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

class PersonImageBase(BaseModel):
    """
    Esquema base para imagens de pessoas.
    """
    filename: str = Field(..., description="Nome do arquivo processado")
    original_filename: str = Field(..., description="Nome do arquivo original")
    file_path: str = Field(..., description="Caminho do arquivo processado")
    processed: bool = Field(True, description="Status de processamento")
    face_detected: bool = Field(True, description="Se uma face foi detectada")
    faiss_id: Optional[int] = Field(None, description="ID no índice FAISS")

class PersonCreate(PersonBase):
    """
    Esquema para criação de pessoas.
    """
    pass

class PersonImageCreate(PersonImageBase):
    """
    Esquema para criação de imagens de pessoas.
    """
    person_id: str = Field(..., description="RG da pessoa associada")
    registro_unico: str = Field(..., description="Identificador único da pessoa")
    processed_date: Optional[datetime] = Field(None, description="Data de processamento")

class PersonUpdate(BaseModel):
    """Esquema para atualização de pessoas."""
    name: Optional[str] = Field(None, description="Nome da pessoa")
    cpf: Optional[str] = Field(None, description="CPF da pessoa")
    origin_code: Optional[str] = Field(None, description="Código de origem")
    origin: Optional[str] = Field(None, description="Origem")

class PersonImageUpdate(BaseModel):
    """Esquema para atualização de imagens de pessoas."""
    processed: Optional[bool] = Field(None, description="Status de processamento")
    processed_date: Optional[datetime] = Field(None, description="Data de processamento")
    face_detected: Optional[bool] = Field(None, description="Se uma face foi detectada")
    faiss_id: Optional[int] = Field(None, description="ID no índice FAISS")

class PersonImageInDB(PersonImageBase):
    """Esquema para imagens de pessoas no banco de dados."""
    id: int
    person_id: str
    processed_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class PersonImage(PersonImageInDB):
    """Esquema para resposta de imagens de pessoas."""
    pass

class PersonInDB(PersonBase):
    """
    Esquema para pessoas no banco de dados.
    """
    id: int
    registro_unico: str
    created_at: datetime
    updated_at: datetime
    images: List[PersonImage] = []

    class Config:
        orm_mode = True

class Person(PersonInDB):
    """Esquema para resposta de pessoas."""
    pass

class SearchResult(BaseModel):
    """Esquema para resultados de busca."""
    rank: int
    distance: float
    similarity: float
    person_id: str
    cpf: str
    person_name: str
    origin: str
    filename: str
    processed_date: str

class SearchResponse(BaseModel):
    """Esquema para resposta de busca."""
    success: bool
    query_image: str
    results: List[SearchResult] = []
    error: Optional[str] = None

class BatchProcessResponse(BaseModel):
    """Esquema para resposta de processamento em lote."""
    success: bool
    total_files: int
    processed: int
    failed: int
    elapsed_time: float
    details: List[dict] = []

class UploadResponse(BaseModel):
    """Esquema para resposta de upload de arquivo."""
    success: bool
    message: str
    person: dict
    error: Optional[str] = None

class BatchUploadStart(BaseModel):
    """Esquema para iniciar um upload em lote."""
    batch_id: str
    total_files: int

class BatchUploadComplete(BaseModel):
    """Esquema para finalizar um upload em lote."""
    batch_id: str
