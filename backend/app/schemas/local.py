from pydantic import BaseModel

class EstadoBase(BaseModel):
    sigla: str

class OrgaoBase(BaseModel):
    id: str
    nome: str