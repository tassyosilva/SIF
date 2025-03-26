"""
Dependências compartilhadas para injeção de dependência no FastAPI.
"""
from ..core.face_processor import FaceProcessor
from ..core.faiss_index import FaissIndex
from ..core.file_processor import FileProcessor

# Variáveis globais para armazenar as instâncias
face_processor = None
faiss_index = None
file_processor = None

def init_processors(upload_dir, processed_dir, models_dir):
    """Inicializa os processadores necessários para a aplicação."""
    global face_processor, faiss_index, file_processor
    
    # Inicializar processador de faces
    face_processor = FaceProcessor(model_path=models_dir)
    
    # Inicializar índice FAISS
    faiss_index = FaissIndex(
        dimension=512,  # Valor padrão, pode ser configurável
        index_type="L2"  # Valor padrão, pode ser configurável
    )
    
    # Verificar se existe um índice FAISS salvo
    import os
    index_path = os.path.join(processed_dir, "faiss_index.bin")
    metadata_path = os.path.join(processed_dir, "faiss_metadata.pkl")
    if os.path.exists(index_path) and os.path.exists(metadata_path):
        faiss_index.load(index_path, metadata_path)
    
    # Inicializar processador de arquivos
    file_processor = FileProcessor(
        upload_dir=upload_dir,
        processed_dir=processed_dir,
        face_processor=face_processor,
        faiss_index=faiss_index
    )

def get_face_processor():
    """Retorna a instância do processador de faces."""
    return face_processor

def get_faiss_index():
    """Retorna a instância do índice FAISS."""
    return faiss_index

def get_file_processor():
    """Retorna a instância do processador de arquivos."""
    return file_processor
