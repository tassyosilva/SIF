from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Any

from ...database import get_db
from ...schemas.settings import SettingsUpdate, SettingsInDB, SystemInfo
from ...services.settings_service import (
    get_settings, 
    update_settings, 
    get_system_info, 
    rebuild_faiss_index,
    create_backup
)
from ...core.dependencies import get_faiss_index, get_file_processor

router = APIRouter()

@router.get("/", response_model=SettingsInDB)
def read_settings(db: Session = Depends(get_db)) -> Any:
    """
    Obter configurações atuais do sistema.
    """
    return get_settings(db)

@router.put("/", response_model=SettingsInDB)
def update_system_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Atualizar configurações do sistema.
    """
    return update_settings(db, settings_update)

@router.get("/system-info", response_model=SystemInfo)
def read_system_info(db: Session = Depends(get_db)) -> Any:
    """
    Obter informações do sistema.
    """
    return get_system_info(db)

@router.post("/rebuild-index")
def rebuild_index(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    faiss_index = Depends(get_faiss_index),
    file_processor = Depends(get_file_processor)
) -> Any:
    """
    Reconstruir o índice FAISS.
    """
    # Executar em segundo plano para não bloquear a resposta
    background_tasks.add_task(rebuild_faiss_index, db, faiss_index, file_processor)
    return {"message": "Reconstrução do índice FAISS iniciada em segundo plano"}

@router.post("/backup")
def backup_system(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Any:
    """
    Criar um backup do sistema.
    """
    # Executar em segundo plano para não bloquear a resposta
    background_tasks.add_task(create_backup, db)
    return {"message": "Criação de backup iniciada em segundo plano"}
