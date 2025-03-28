from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Person(Base):
    """
    Modelo SQLAlchemy para armazenar informações de pessoas.
    """
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(String, unique=True, index=True)  # RG da pessoa (11 dígitos)
    cpf = Column(String, index=True)  # CPF modificado para não ser único
    name = Column(String)
    origin_code = Column(String)  # 001, 002, etc.
    origin = Column(String)  # idnet, cacador, etc.
    
    # Relacionamento com imagens
    images = relationship("PersonImage", back_populates="person", cascade="all, delete-orphan")
    
    # Metadados
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Person(id={self.id}, person_id={self.person_id}, name={self.name})>"


class PersonImage(Base):
    """
    Modelo SQLAlchemy para armazenar imagens de pessoas.
    """
    __tablename__ = "person_images"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(String, ForeignKey("persons.person_id"), index=True)
    
    # Informações do arquivo
    filename = Column(String)
    file_path = Column(String)
    original_filename = Column(String)  # Nome original do arquivo
    
    # Informações do processamento
    processed = Column(Boolean, default=False)
    processed_date = Column(DateTime, default=None, nullable=True)
    face_detected = Column(Boolean, default=False)
    
    # Informações do FAISS
    faiss_id = Column(Integer, nullable=True)
    
    # Relacionamento com a pessoa
    person = relationship("Person", back_populates="images")
    
    # Metadados
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PersonImage(id={self.id}, person_id={self.person.person_id}, filename={self.filename})>"


class BatchUpload(Base):
    """
    Modelo para rastrear uploads em lote
    """
    __tablename__ = "batch_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, unique=True, index=True)
    status = Column(String, default='pending')  # pending, processing, completed, failed
    total_files = Column(Integer)
    processed_files = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
