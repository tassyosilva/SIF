from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
from datetime import datetime

# Remova esta linha:
# from sqlalchemy.ext.declarative import declarative_base
# Base = declarative_base()

# Importe Base do módulo database
from ..database import Base

class Person(Base):
    """
    Modelo SQLAlchemy para armazenar informações de pessoas.
    """
    __tablename__ = "persons"
    
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(String, unique=True, index=True) # ID da pessoa (12 dígitos)
    name = Column(String)
    origin_code = Column(String) # 001, 002, etc.
    origin = Column(String) # idnet, cacador, etc.
    
    # Informações do arquivo original
    filename = Column(String)
    file_path = Column(String)
    
    # Informações do processamento
    processed = Column(Boolean, default=False)
    processed_date = Column(DateTime, default=None, nullable=True)
    face_detected = Column(Boolean, default=False)
    
    # Informações do FAISS
    faiss_id = Column(Integer, nullable=True)
    
    # Metadados
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Person(id={self.id}, person_id={self.person_id}, name={self.name})>"
