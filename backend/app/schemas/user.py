from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from ..models.user import UserType

class UserBase(BaseModel):
    login: str
    nome_completo: str
    cpf: str
    matricula: str
    telefone: Optional[str] = None
    orgao: Optional[str] = None
    estado_do_orgao: Optional[str] = None
    email: EmailStr
    tipo_usuario: UserType

class UserCreate(UserBase):
    senha: str

    @validator('cpf')
    def validate_cpf(cls, v):
        # Remover caracteres não numéricos
        cpf = ''.join(filter(str.isdigit, v))
        
        # Verificar se tem 11 dígitos
        if len(cpf) != 11:
            raise ValueError('CPF deve conter 11 dígitos')
        
        return cpf

class UserInDB(UserBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    nome_completo: Optional[str] = None
    telefone: Optional[str] = None
    orgao: Optional[str] = None
    estado_do_orgao: Optional[str] = None
    tipo_usuario: Optional[UserType] = None