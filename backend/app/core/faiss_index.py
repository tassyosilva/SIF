import os
import numpy as np
import faiss
import pickle
from typing import List, Dict, Tuple, Optional, Any
import logging

logger = logging.getLogger(__name__)

class FaissIndex:
    """
    Classe para gerenciar o índice FAISS para busca eficiente de embeddings faciais.
    """
    def __init__(self, dimension: int = 512, index_type: str = "L2"):
        """
        Inicializa o índice FAISS.
        
        Args:
            dimension: Dimensão dos embeddings faciais
            index_type: Tipo de índice FAISS (L2, IVF, HNSW, etc.)
        """
        self.dimension = dimension
        self.index_type = index_type
        self.index = None
        self.id_map = {}  # Mapeia IDs FAISS para metadados (ID da pessoa, nome, etc.)
        self.create_index()
        logger.info(f"FAISS index initialized with dimension {dimension} and type {index_type}")
    
    def create_index(self):
        """
        Cria um novo índice FAISS baseado no tipo especificado.
        """
        if self.index_type == "L2":
            # Índice simples de distância L2 (euclidiana)
            self.index = faiss.IndexFlatL2(self.dimension)
        elif self.index_type == "IVF":
            # Índice IVF para busca mais rápida em grandes conjuntos de dados
            quantizer = faiss.IndexFlatL2(self.dimension)
            nlist = 100  # Número de clusters (ajuste conforme o tamanho do dataset)
            self.index = faiss.IndexIVFFlat(quantizer, self.dimension, nlist, faiss.METRIC_L2)
            self.index.train(np.zeros((1, self.dimension), dtype=np.float32))  # Inicialização
        elif self.index_type == "HNSW":
            # Índice HNSW para busca ainda mais rápida
            self.index = faiss.IndexHNSWFlat(self.dimension, 32)  # 32 é o número de vizinhos
        else:
            # Padrão para L2
            self.index = faiss.IndexFlatL2(self.dimension)
        
        logger.info(f"Created FAISS index of type {self.index_type}")
    
    def add_embedding(self, embedding: np.ndarray, metadata: Dict[str, Any]) -> int:
        """
        Adiciona um embedding ao índice com seus metadados associados.
        
        Args:
            embedding: Vetor de embedding facial
            metadata: Dicionário com metadados (ID da pessoa, nome, etc.)
            
        Returns:
            ID do embedding no índice FAISS
        """
        if embedding.ndim == 1:
            embedding = embedding.reshape(1, -1)
        
        # Garantir que o embedding seja float32
        embedding = embedding.astype(np.float32)
        
        # Obter o próximo ID disponível
        next_id = self.index.ntotal
        
        # Adicionar o embedding ao índice
        self.index.add(embedding)
        
        # Armazenar os metadados
        self.id_map[next_id] = metadata
        
        logger.info(f"Added embedding with ID {next_id} to FAISS index")
        return next_id
    
    def add_embeddings(self, embeddings: np.ndarray, metadatas: List[Dict[str, Any]]) -> List[int]:
        """
        Adiciona múltiplos embeddings ao índice com seus metadados associados.
        
        Args:
            embeddings: Matriz de embeddings faciais
            metadatas: Lista de dicionários com metadados
            
        Returns:
            Lista de IDs dos embeddings no índice FAISS
        """
        if len(embeddings) != len(metadatas):
            raise ValueError("Number of embeddings and metadatas must match")
        
        # Garantir que os embeddings sejam float32
        embeddings = embeddings.astype(np.float32)
        
        # Obter o próximo ID disponível
        start_id = self.index.ntotal
        
        # Adicionar os embeddings ao índice
        self.index.add(embeddings)
        
        # Armazenar os metadados
        ids = list(range(start_id, start_id + len(embeddings)))
        for i, id_val in enumerate(ids):
            self.id_map[id_val] = metadatas[i]
        
        logger.info(f"Added {len(embeddings)} embeddings to FAISS index")
        return ids
    
    def search(self, query_embedding: np.ndarray, k: int = 5) -> Tuple[List[float], List[Dict[str, Any]]]:
        """
        Busca os k embeddings mais próximos ao embedding de consulta.
        
        Args:
            query_embedding: Embedding facial de consulta
            k: Número de resultados a retornar
            
        Returns:
            Tupla contendo (distâncias, metadados)
        """
        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        # Garantir que o embedding seja float32
        query_embedding = query_embedding.astype(np.float32)
        
        # Buscar os k vizinhos mais próximos
        distances, indices = self.index.search(query_embedding, k)
        
        # Extrair os metadados correspondentes
        distances = distances[0].tolist()
        indices = indices[0].tolist()
        
        metadatas = []
        for idx in indices:
            if idx != -1 and idx in self.id_map:  # -1 indica que não foram encontrados k resultados
                metadatas.append(self.id_map[idx])
            else:
                metadatas.append(None)
        
        logger.info(f"Search completed, found {len([m for m in metadatas if m is not None])} matches")
        return distances, metadatas
    
    def save(self, index_path: str, metadata_path: str):
        """
        Salva o índice FAISS e os metadados em arquivos.
        
        Args:
            index_path: Caminho para salvar o índice FAISS
            metadata_path: Caminho para salvar os metadados
        """
        # Criar diretórios se não existirem
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        os.makedirs(os.path.dirname(metadata_path), exist_ok=True)
        
        # Salvar o índice FAISS
        faiss.write_index(self.index, index_path)
        
        # Salvar os metadados
        with open(metadata_path, 'wb') as f:
            pickle.dump({
                'id_map': self.id_map,
                'dimension': self.dimension,
                'index_type': self.index_type
            }, f)
        
        logger.info(f"FAISS index saved to {index_path} and metadata to {metadata_path}")
    
    def load(self, index_path: str, metadata_path: str):
        """
        Carrega o índice FAISS e os metadados de arquivos.
        
        Args:
            index_path: Caminho para o arquivo do índice FAISS
            metadata_path: Caminho para o arquivo de metadados
        """
        # Carregar o índice FAISS
        self.index = faiss.read_index(index_path)
        
        # Carregar os metadados
        with open(metadata_path, 'rb') as f:
            metadata = pickle.load(f)
            self.id_map = metadata['id_map']
            self.dimension = metadata['dimension']
            self.index_type = metadata['index_type']
        
        logger.info(f"FAISS index loaded from {index_path} and metadata from {metadata_path}")
    
    def get_total_items(self) -> int:
        """
        Retorna o número total de embeddings no índice.
        
        Returns:
            Número total de embeddings
        """
        return self.index.ntotal
