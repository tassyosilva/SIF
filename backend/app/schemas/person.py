from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PersonBase(BaseModel):
    """
    Esquema base para pessoas.
    """
    person_id: str = Field(..., description="RG da pessoa (11 dígitos)")
    cpf: str = Field(..., description="CPF da pessoa (formato: XXX.XXX.XXX-XX)")
    name: str = Field(..., description="Nome da pessoa")
    origin_code: str = Field(..., description="Código de origem (001, 002, etc.)")
    origin: str = Field(..., description="Origem (idnet, cacador, etc.)")

class PersonCreate(PersonBase):
    """
    Esquema para criação de pessoas.
    """
    filename: str = Field(..., description="Nome do arquivo original")
    file_path: str = Field(..., description="Caminho do arquivo original")

class PersonUpdate(BaseModel):
    """
    Esquema para atualização de pessoas.
    """
    name: Optional[str] = Field(None, description="Nome da pessoa")
    processed: Optional[bool] = Field(None, description="Status de processamento")
    processed_date: Optional[datetime] = Field(None, description="Data de processamento")
    face_detected: Optional[bool] = Field(None, description="Se uma face foi detectada")
    faiss_id: Optional[int] = Field(None, description="ID no índice FAISS")

class PersonInDB(PersonBase):
    """
    Esquema para pessoas no banco de dados.
    """
    id: int
    filename: str
    file_path: str
    processed: bool
    processed_date: Optional[datetime]
    face_detected: bool
    faiss_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Person(PersonInDB):
    """
    Esquema para resposta de pessoas.
    """
    pass

class SearchResult(BaseModel):
    """
    Esquema para resultados de busca.
    """
    rank: int
    distance: float
    similarity: float
    person_id: str
    person_name: str
    origin: str
    filename: str
    processed_date: str

class SearchResponse(BaseModel):
    """
    Esquema para resposta de busca.
    """
    success: bool
    query_image: str
    results: List[SearchResult] = []
    error: Optional[str] = None

class BatchProcessResponse(BaseModel):
    """
    Esquema para resposta de processamento em lote.
    """
    success: bool
    total_files: int
    processed: int
    failed: int
    elapsed_time: float
    details: List[dict] = []