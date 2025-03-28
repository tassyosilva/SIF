import os
from pydantic import PostgresDsn
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """
    Configurações da aplicação carregadas de variáveis de ambiente ou arquivo .env
    """
    # Configurações gerais
    APP_NAME: str = "Face Recognition System"
    API_PREFIX: str = "/api"
    DEBUG: bool = False
    
    # Configurações do banco de dados
    DATABASE_URL: PostgresDsn = "postgresql://postgres:adm2000%21%40@192.168.3.204:5432/face_recognition"
    
    # Configurações de diretórios
    UPLOAD_DIR: str = os.path.join(os.getcwd(), "data", "uploads")
    PROCESSED_DIR: str = os.path.join(os.getcwd(), "data", "processed")
    MODELS_DIR: str = os.path.join(os.getcwd(), "data", "models")
    
    # Configurações do InsightFace
    INSIGHTFACE_MODEL: str = "buffalo_l"
    
    # Configurações do FAISS
    FAISS_DIMENSION: int = 512
    FAISS_INDEX_TYPE: str = "L2"
    
    # Configurações de processamento
    BATCH_WORKERS: int = 4
    SIMILARITY_THRESHOLD: float = 0.7
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instanciar as configurações
settings = Settings()