from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SettingsBase(BaseModel):
    upload_dir: str
    processed_dir: str
    models_dir: str
    insightface_model: str
    faiss_dimension: int
    faiss_index_type: str
    batch_workers: int
    similarity_threshold: float
    auto_backup: bool
    backup_interval: int
    backup_dir: str

class SettingsCreate(SettingsBase):
    pass

class SettingsUpdate(BaseModel):
    upload_dir: Optional[str] = None
    processed_dir: Optional[str] = None
    models_dir: Optional[str] = None
    insightface_model: Optional[str] = None
    faiss_dimension: Optional[int] = None
    faiss_index_type: Optional[str] = None
    batch_workers: Optional[int] = None
    similarity_threshold: Optional[float] = None
    auto_backup: Optional[bool] = None
    backup_interval: Optional[int] = None
    backup_dir: Optional[str] = None

class SettingsInDB(SettingsBase):
    id: int
    last_backup: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SystemInfo(BaseModel):
    version: str
    database_status: str
    storage_used: str
    storage_available: str
    total_persons: int
    total_images: int
    faiss_index_size: str
    last_backup: Optional[str] = None
