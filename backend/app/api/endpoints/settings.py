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
@router.get("", response_model=SettingsInDB)
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

@router.post("/reload-config")
def reload_config(db: Session = Depends(get_db)):
    """
    Recarrega as configurações sem reiniciar o servidor.
    """
    from ...core.dependencies import init_processors
    from ...config import settings
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Obter configurações atualizadas do banco de dados
    db_settings = get_settings(db)
    
    # Log para depuração
    logger.info(f"Recarregando configurações do banco de dados")
    
    # Atualizar TODAS as configurações em memória
    settings.UPLOAD_DIR = db_settings.upload_dir
    settings.PROCESSED_DIR = db_settings.processed_dir
    settings.MODELS_DIR = db_settings.models_dir
    settings.INSIGHTFACE_MODEL = db_settings.insightface_model
    settings.FAISS_DIMENSION = db_settings.faiss_dimension
    settings.FAISS_INDEX_TYPE = db_settings.faiss_index_type
    settings.BATCH_WORKERS = db_settings.batch_workers
    settings.SIMILARITY_THRESHOLD = db_settings.similarity_threshold  # Esta linha estava faltando
    
    # Também atualizar configurações de backup
    # Estas atualizações não foram incluídas antes
    if hasattr(settings, 'AUTO_BACKUP'):
        settings.AUTO_BACKUP = db_settings.auto_backup
    if hasattr(settings, 'BACKUP_INTERVAL'):
        settings.BACKUP_INTERVAL = db_settings.backup_interval
    if hasattr(settings, 'BACKUP_DIR'):
        settings.BACKUP_DIR = db_settings.backup_dir
    
    logger.info(f"Configurações atualizadas em memória. Valores atuais:")
    logger.info(f"UPLOAD_DIR: {settings.UPLOAD_DIR}")
    logger.info(f"PROCESSED_DIR: {settings.PROCESSED_DIR}")
    logger.info(f"MODELS_DIR: {settings.MODELS_DIR}")
    logger.info(f"INSIGHTFACE_MODEL: {settings.INSIGHTFACE_MODEL}")
    logger.info(f"FAISS_DIMENSION: {settings.FAISS_DIMENSION}")
    logger.info(f"FAISS_INDEX_TYPE: {settings.FAISS_INDEX_TYPE}")
    logger.info(f"BATCH_WORKERS: {settings.BATCH_WORKERS}")
    logger.info(f"SIMILARITY_THRESHOLD: {settings.SIMILARITY_THRESHOLD}")
    
    # Reinicializar os processadores com as novas configurações
    init_processors(
        upload_dir=settings.UPLOAD_DIR,
        processed_dir=settings.PROCESSED_DIR,
        models_dir=settings.MODELS_DIR
    )
    
    return {"message": "Configurações recarregadas com sucesso", "success": True}