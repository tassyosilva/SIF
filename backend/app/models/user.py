from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from datetime import datetime
from ..database import Base
import enum

class UserType(enum.Enum):
    ADMINISTRADOR = "administrador"
    CONSULTOR = "consultor"
    CADASTRADOR = "cadastrador"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, index=True, nullable=False)
    nome_completo = Column(String, nullable=False)
    cpf = Column(String, unique=True, nullable=False)
    matricula = Column(String, unique=True, nullable=False)
    telefone = Column(String)
    orgao = Column(String)
    email = Column(String, unique=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    tipo_usuario = Column(Enum(UserType), nullable=False)
    
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User(nome={self.nome_completo}, tipo={self.tipo_usuario.value})>"