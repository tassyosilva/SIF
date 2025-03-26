import os
import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
from insightface.utils import face_align
from typing import List, Dict, Tuple, Optional, Any
import logging

logger = logging.getLogger(__name__)

class FaceProcessor:
    """
    Classe para processar faces usando InsightFace.
    """
    def __init__(self, model_path: str = None, det_size: Tuple[int, int] = (640, 640)):
        """
        Inicializa o processador de faces.
        
        Args:
            model_path: Caminho para os modelos pré-treinados (opcional)
            det_size: Tamanho da imagem para detecção
        """
        # Inicializar o analisador de faces do InsightFace
        self.app = FaceAnalysis(name="buffalo_l", root=model_path)
        self.app.prepare(ctx_id=0, det_size=det_size)
        logger.info("Face processor initialized successfully")
    
    def detect_faces(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Detecta faces em uma imagem.
        
        Args:
            image_path: Caminho para a imagem
            
        Returns:
            Lista de faces detectadas com suas informações
        """
        try:
            # Carregar a imagem
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"Failed to load image: {image_path}")
                return []
            
            # Converter BGR para RGB (InsightFace espera RGB)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Detectar faces
            faces = self.app.get(img)
            
            # Processar resultados
            results = []
            for face in faces:
                # Extrair informações relevantes
                bbox = face.bbox.astype(int).tolist()  # Bounding box
                landmarks = face.landmark_2d_106.astype(int).tolist() if face.landmark_2d_106 is not None else None
                embedding = face.embedding.tolist() if face.embedding is not None else None
                
                result = {
                    "bbox": bbox,
                    "landmarks": landmarks,
                    "embedding": embedding,
                    "score": float(face.det_score)  # Score de confiança da detecção
                }
                results.append(result)
            
            logger.info(f"Detected {len(results)} faces in {image_path}")
            return results
        
        except Exception as e:
            logger.error(f"Error detecting faces in {image_path}: {str(e)}")
            return []
    
    def extract_embedding(self, image_path: str) -> Optional[np.ndarray]:
        """
        Extrai o embedding facial da primeira face detectada em uma imagem.
        
        Args:
            image_path: Caminho para a imagem
            
        Returns:
            Embedding facial como array numpy ou None se nenhuma face for detectada
        """
        faces = self.detect_faces(image_path)
        if not faces:
            return None
        
        # Retornar o embedding da primeira face (a mais proeminente)
        embedding = faces[0].get("embedding")
        if embedding:
            return np.array(embedding, dtype=np.float32)
        return None
    
    def extract_all_embeddings(self, image_path: str) -> List[np.ndarray]:
        """
        Extrai embeddings faciais de todas as faces detectadas em uma imagem.
        
        Args:
            image_path: Caminho para a imagem
            
        Returns:
            Lista de embeddings faciais
        """
        faces = self.detect_faces(image_path)
        embeddings = []
        
        for face in faces:
            embedding = face.get("embedding")
            if embedding:
                embeddings.append(np.array(embedding, dtype=np.float32))
        
        return embeddings
    
    def align_face(self, image_path: str, output_path: str, size: Tuple[int, int] = (112, 112)) -> bool:
        """
        Alinha a face detectada e salva a imagem alinhada.
        
        Args:
            image_path: Caminho para a imagem de entrada
            output_path: Caminho para salvar a imagem alinhada
            size: Tamanho da imagem de saída
            
        Returns:
            True se o alinhamento for bem-sucedido, False caso contrário
        """
        try:
            # Carregar a imagem
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"Failed to load image: {image_path}")
                return False
            
            # Converter BGR para RGB
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Detectar faces
            faces = self.app.get(img_rgb)
            if not faces:
                logger.warning(f"No faces detected in {image_path}")
                return False
            
            # Usar a primeira face detectada (a mais proeminente)
            face = faces[0]
            
            # Alinhar a face
            aligned = face_align.norm_crop(img, landmark=face.landmark_2d_106, image_size=size)
            
            # Salvar a imagem alinhada
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            cv2.imwrite(output_path, aligned)
            
            logger.info(f"Face aligned and saved to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error aligning face in {image_path}: {str(e)}")
            return False
