from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from datetime import datetime
from ..database import Base

class Settings(Base):
    """
    Modelo SQLAlchemy para armazenar configurações do sistema.
    """
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Configurações gerais
    upload_dir = Column(String, default="./data/uploads")
    processed_dir = Column(String, default="./data/processed")
    models_dir = Column(String, default="./data/models")
    
    # Configurações do InsightFace
    insightface_model = Column(String, default="buffalo_l")
    
    # Configurações do FAISS
    faiss_dimension = Column(Integer, default=512)
    faiss_index_type = Column(String, default="L2")
    
    # Configurações de processamento
    batch_workers = Column(Integer, default=8)
    similarity_threshold = Column(Float, default=0.7)
    
    # Configurações de backup
    auto_backup = Column(Boolean, default=False)
    backup_interval = Column(Integer, default=24)  # horas
    backup_dir = Column(String, default="./data/backups")
    last_backup = Column(DateTime, nullable=True)
    
    # Metadados
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Settings(id={self.id})>"
