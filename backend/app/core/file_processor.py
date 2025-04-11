import os
import re
import shutil
from typing import Dict, List, Tuple, Optional, Any
import logging
from datetime import datetime
import concurrent.futures
from pathlib import Path


from .face_processor import FaceProcessor
from .faiss_index import FaissIndex


logger = logging.getLogger(__name__)


class FileProcessor:
    """
    Classe para processar arquivos de imagem, extrair informações do nome do arquivo
    e gerenciar o processamento em lote de imagens.
    """
    def __init__(
        self,
        upload_dir: str,
        processed_dir: str,
        face_processor: FaceProcessor,
        faiss_index: FaissIndex
    ):
        """
        Inicializa o processador de arquivos.
        Args:
            upload_dir: Diretório para uploads de imagens
            processed_dir: Diretório para imagens processadas
            face_processor: Instância do processador de faces
            faiss_index: Instância do índice FAISS
        """
        self.upload_dir = upload_dir
        self.processed_dir = processed_dir
        self.face_processor = face_processor
        self.faiss_index = faiss_index
        
        # Mapa de origens completo com todos os órgãos disponíveis
        self.origin_map = {
            "001": "idnet",
            "002": "cacador",
            "003": "pf",
            "004": "prf",
            "005": "pff",
            "006": "pm",
            "007": "pc",
            "008": "pp",
            "009": "gm",
            "010": "sesp",
            "011": "sejuc",
            "012": "mitra",
            "013": "detran",
            "014": "sif"
        }
        
        # Criar diretórios se não existirem
        os.makedirs(upload_dir, exist_ok=True)
        os.makedirs(processed_dir, exist_ok=True)
        logger.info(f"File processor initialized with upload_dir={upload_dir}, processed_dir={processed_dir}")

    def parse_filename(self, filename: str) -> Dict[str, Any]:
        """
        Extrai informações do nome do arquivo seguindo o novo padrão:
        OOOCCCCCCCCCCCRRRRRRRRRRRNOME.ext
        Onde:
        - OOO: origem do arquivo (001 para idnet, 002 para cacador)
        - CCCCCCCCCCC: CPF da pessoa (11 dígitos)
        - RRRRRRRRRRR: RG da pessoa (11 dígitos)
        - NOME: nome da pessoa (com underscores)
        - .ext: extensão do arquivo (.jpg, .png, etc.)

        Args:
            filename: Nome do arquivo a ser analisado

        Returns:
            Dicionário com as informações extraídas
        """
        try:
            # Remover a extensão do arquivo
            base_name = os.path.splitext(filename)[0]
            
            # Padrão de regex para extrair as informações
            # Formato: 0010010071423400000001168FRANCISCO_DAS_CHAGAS_DUARTE.jpg
            pattern = r'^(\d{3})(\d{11})(\d{11})(.+)$'
            match = re.match(pattern, base_name)
            
            if not match:
                logger.warning(f"Filename {filename} does not match the expected pattern")
                return {
                    "valid": False,
                    "filename": filename
                }
            
            origin_code = match.group(1)
            cpf_raw = match.group(2)
            person_id_raw = match.group(3)
            person_name_raw = match.group(4)
            
            # Formatar CPF (001.007.142-34)
            cpf = f"{cpf_raw[:3]}.{cpf_raw[3:6]}.{cpf_raw[6:9]}-{cpf_raw[9:]}"
            
            # Formatar RG (apenas remover zeros à esquerda desnecessários)
            person_id = person_id_raw.lstrip('0')
            if person_id == "":  # Se sobrar string vazia após remover zeros à esquerda
                person_id = "00000000000"  # Usar 11 zeros
            
            # Formatar nome (substituir underscores por espaços)
            person_name = person_name_raw.replace('_', ' ')
            
            # Usar o mapa de origens da classe
            origin = self.origin_map.get(origin_code, "unknown")
            
            return {
                "valid": True,
                "filename": filename,
                "origin_code": origin_code,
                "origin": origin,
                "cpf": cpf,
                "person_id": person_id,
                "person_name": person_name
            }
        except Exception as e:
            logger.error(f"Error parsing filename {filename}: {str(e)}")
            return {
                "valid": False,
                "filename": filename,
                "error": str(e)
            }

    def process_image(self, image_path: str) -> Dict[str, Any]:
        """
        Processa uma única imagem: extrai informações do nome, detecta faces,
        extrai embeddings e adiciona ao índice FAISS.

        Args:
            image_path: Caminho completo para a imagem

        Returns:
            Dicionário com os resultados do processamento
        """
        try:
            original_filename = os.path.basename(image_path)
            file_info = self.parse_filename(original_filename)
            
            if not file_info["valid"]:
                logger.warning(f"Skipping invalid file: {original_filename}")
                return {
                    "success": False,
                    "filename": original_filename,
                    "error": "Invalid filename format"
                }
            
            # Extrair embedding facial
            embedding = self.face_processor.extract_embedding(image_path)
            
            if embedding is None:
                logger.warning(f"No face detected in {original_filename}")
                return {
                    "success": False,
                    "filename": original_filename,
                    "error": "No face detected"
                }
            
            # Gerar um nome de arquivo único com timestamp
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            base_name, ext = os.path.splitext(original_filename)
            unique_filename = f"{base_name}_{timestamp}{ext}"
            
            # Criar metadados para o índice FAISS
            metadata = {
                "person_id": file_info["person_id"],
                "cpf": file_info["cpf"],
                "person_name": file_info["person_name"],
                "origin": file_info["origin"],
                "filename": unique_filename,
                "original_filename": original_filename,
                "processed_date": datetime.now().isoformat()
            }
            
            # Adicionar embedding ao índice FAISS
            faiss_id = self.faiss_index.add_embedding(embedding, metadata)
            
            # Mover a imagem para o diretório de processados com o nome único
            processed_path = os.path.join(self.processed_dir, unique_filename)
            shutil.copy2(image_path, processed_path)
            
            # Alinhar a face e salvar com nome único
            aligned_dir = os.path.join(self.processed_dir, "aligned")
            os.makedirs(aligned_dir, exist_ok=True)
            aligned_path = os.path.join(aligned_dir, unique_filename)
            self.face_processor.align_face(image_path, aligned_path)
            
            logger.info(f"Successfully processed {original_filename} as {unique_filename}, FAISS ID: {faiss_id}")
            
            # Salvar o índice FAISS após cada processamento
            index_path = os.path.join(self.processed_dir, "faiss_index.bin")
            metadata_path = os.path.join(self.processed_dir, "faiss_metadata.pkl")
            self.faiss_index.save(index_path, metadata_path)
            
            return {
                "success": True,
                "filename": unique_filename,
                "original_filename": original_filename,
                "person_id": file_info["person_id"],
                "cpf": file_info["cpf"],
                "person_name": file_info["person_name"],
                "origin": file_info["origin"],
                "faiss_id": faiss_id
            }
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            return {
                "success": False,
                "filename": original_filename if 'original_filename' in locals() else os.path.basename(image_path),
                "error": str(e)
            }

    def process_batch(self, max_workers: int = 4) -> Dict[str, Any]:
        """
        Processa todas as imagens no diretório de upload em paralelo.

        Args:
            max_workers: Número máximo de workers para processamento paralelo

        Returns:
            Dicionário com estatísticas do processamento
        """
        start_time = datetime.now()
        
        # Listar todos os arquivos no diretório de upload
        image_files = []
        for ext in ['.jpg', '.jpeg', '.png', '.bmp']:
            image_files.extend(list(Path(self.upload_dir).glob(f'*{ext}')))
            image_files.extend(list(Path(self.upload_dir).glob(f'*{ext.upper()}')))
        
        total_files = len(image_files)
        logger.info(f"Found {total_files} images to process in {self.upload_dir}")
        
        if total_files == 0:
            return {
                "success": True,
                "total_files": 0,
                "processed": 0,
                "failed": 0,
                "elapsed_time": 0,
                "details": []
            }
        
        # Processar imagens em paralelo
        results = []
        successful = 0
        failed = 0
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_file = {executor.submit(self.process_image, str(file)): file for file in image_files}
            
            for future in concurrent.futures.as_completed(future_to_file):
                file = future_to_file[future]
                try:
                    result = future.result()
                    results.append(result)
                    
                    if result["success"]:
                        successful += 1
                    else:
                        failed += 1
                    
                    # Log progresso a cada 100 arquivos
                    if (successful + failed) % 100 == 0:
                        logger.info(f"Progress: {successful + failed}/{total_files} files processed")
                
                except Exception as e:
                    logger.error(f"Error processing {file}: {str(e)}")
                    failed += 1
                    results.append({
                        "success": False,
                        "filename": os.path.basename(str(file)),
                        "error": str(e)
                    })
        
        # Salvar o índice FAISS após o processamento
        index_path = os.path.join(self.processed_dir, "faiss_index.bin")
        metadata_path = os.path.join(self.processed_dir, "faiss_metadata.pkl")
        self.faiss_index.save(index_path, metadata_path)
        
        elapsed_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Batch processing completed: {successful} successful, {failed} failed, {elapsed_time:.2f} seconds")
        
        return {
            "success": True,
            "total_files": total_files,
            "processed": successful,
            "failed": failed,
            "elapsed_time": elapsed_time,
            "details": results
        }

    def search_similar_faces(self, image_path: str, k: int = 5) -> Dict[str, Any]:
        """
        Busca faces similares a uma imagem de consulta.

        Args:
            image_path: Caminho para a imagem de consulta
            k: Número de resultados a retornar

        Returns:
            Dicionário com os resultados da busca
        """
        try:
            # Extrair embedding facial da imagem de consulta
            embedding = self.face_processor.extract_embedding(image_path)
            
            if embedding is None:
                logger.warning(f"No face detected in query image {image_path}")
                return {
                    "success": False,
                    "error": "No face detected in query image"
                }
            
            # Buscar faces similares no índice FAISS
            distances, metadatas = self.faiss_index.search(embedding, k)
            
            # Filtrar resultados inválidos (None)
            results = []
            for i, (distance, metadata) in enumerate(zip(distances, metadatas)):
                if metadata is not None:
                    # Log para depuração
                    logger.info(f"Distância para resultado {i+1}: {distance}")
                    
                    # Considerando que distâncias típicas estão na faixa de 500-1000,
                    # vamos normalizar para uma faixa mais interpretável
                    # Definir limites para a normalização (ajustar conforme necessário)
                    min_distance = 500  # Considerar qualquer distância < 500 como muito similar
                    max_distance = 1000  # Considerar qualquer distância > 1000 como totalmente diferente
                    
                    # Normalizar entre 0 e 1, e inverter (menor distância = maior similaridade)
                    if distance <= min_distance:
                        similarity = 1.0
                    elif distance >= max_distance:
                        similarity = 0.0
                    else:
                        similarity = 1.0 - ((distance - min_distance) / (max_distance - min_distance))
                    
                    # Log para depuração
                    logger.info(f"Similaridade calculada para resultado {i+1}: {similarity:.4f}")
                    
                    results.append({
                        "rank": i + 1,
                        "distance": float(distance),
                        "similarity": float(similarity),
                        "person_id": metadata["person_id"],
                        "cpf": metadata.get("cpf", "N/A"),  # Usa "N/A" se o campo não existir
                        "person_name": metadata["person_name"],
                        "origin": metadata["origin"],
                        "filename": metadata["filename"],
                        "processed_date": metadata["processed_date"]
                    })
            
            logger.info(f"Search completed for {image_path}, found {len(results)} matches")
            
            return {
                "success": True,
                "query_image": os.path.basename(image_path),
                "results": results
            }
        except Exception as e:
            logger.error(f"Error searching similar faces for {image_path}: {str(e)}")
            return {
                "success": False,
                "query_image": os.path.basename(image_path),
                "error": str(e)
            }
