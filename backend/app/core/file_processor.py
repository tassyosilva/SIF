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
        
        # Criar diretórios se não existirem
        os.makedirs(upload_dir, exist_ok=True)
        os.makedirs(processed_dir, exist_ok=True)
        
        logger.info(f"File processor initialized with upload_dir={upload_dir}, processed_dir={processed_dir}")
    
    def parse_filename(self, filename: str) -> Dict[str, Any]:
        """
        Extrai informações do nome do arquivo seguindo o padrão:
        OOONNNNNNNNNNNNNNOME.ext
        
        Onde:
        - OOO: origem do arquivo (001 para idnet, 002 para cacador)
        - NNNNNNNNNNNN: identidade da pessoa (12 dígitos)
        - NOME: nome da pessoa
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
            # Formato: 001000000022582cibele dantas damasceno.jpg
            pattern = r'^(\d{3})(\d{12})(.+)$'
            match = re.match(pattern, base_name)
            
            if not match:
                logger.warning(f"Filename {filename} does not match the expected pattern")
                return {
                    "valid": False,
                    "filename": filename
                }
            
            origin_code = match.group(1)
            person_id = match.group(2)
            person_name = match.group(3)
            
            # Mapear códigos de origem para nomes
            origin_map = {
                "001": "idnet",
                "002": "cacador"
            }
            
            origin = origin_map.get(origin_code, "unknown")
            
            return {
                "valid": True,
                "filename": filename,
                "origin_code": origin_code,
                "origin": origin,
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
            filename = os.path.basename(image_path)
            file_info = self.parse_filename(filename)
            
            if not file_info["valid"]:
                logger.warning(f"Skipping invalid file: {filename}")
                return {
                    "success": False,
                    "filename": filename,
                    "error": "Invalid filename format"
                }
            
            # Extrair embedding facial
            embedding = self.face_processor.extract_embedding(image_path)
            
            if embedding is None:
                logger.warning(f"No face detected in {filename}")
                return {
                    "success": False,
                    "filename": filename,
                    "error": "No face detected"
                }
            
            # Criar metadados para o índice FAISS
            metadata = {
                "person_id": file_info["person_id"],
                "person_name": file_info["person_name"],
                "origin": file_info["origin"],
                "filename": filename,
                "processed_date": datetime.now().isoformat()
            }
            
            # Adicionar embedding ao índice FAISS
            faiss_id = self.faiss_index.add_embedding(embedding, metadata)
            
            # Mover a imagem para o diretório de processados
            processed_path = os.path.join(self.processed_dir, filename)
            shutil.copy2(image_path, processed_path)
            
            # Alinhar a face e salvar
            aligned_dir = os.path.join(self.processed_dir, "aligned")
            os.makedirs(aligned_dir, exist_ok=True)
            aligned_path = os.path.join(aligned_dir, filename)
            self.face_processor.align_face(image_path, aligned_path)
            
            logger.info(f"Successfully processed {filename}, FAISS ID: {faiss_id}")
            
            return {
                "success": True,
                "filename": filename,
                "person_id": file_info["person_id"],
                "person_name": file_info["person_name"],
                "origin": file_info["origin"],
                "faiss_id": faiss_id
            }
        
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            return {
                "success": False,
                "filename": filename if 'filename' in locals() else os.path.basename(image_path),
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
                    results.append({
                        "rank": i + 1,
                        "distance": float(distance),
                        "similarity": float(max(0, 1 - distance / 2)),  # Converter distância para similaridade
                        "person_id": metadata["person_id"],
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
