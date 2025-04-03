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
    DATABASE_URL: PostgresDsn = "postgresql://postgres:senha@enderecodoservidor:5432/face_recognition"
    
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
    BATCH_WORKERS: int = 8
    SIMILARITY_THRESHOLD: float = 0.7
    
    # Configurações de e-mail
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Sistema de Identificação Facial")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instanciar as configurações
settings = Settings()