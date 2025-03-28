import os
import shutil
import psutil
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.settings import Settings
from ..models.person import Person, PersonImage
from ..schemas.settings import SettingsCreate, SettingsUpdate, SystemInfo
from ..core.dependencies import rebuild_index_from_db

logger = logging.getLogger(__name__)

def get_settings(db: Session):
    """Obter configurações do sistema"""
    try:
        # Tentar obter a primeira configuração
        settings = db.query(Settings).order_by(Settings.id).first()
        
        # Se não existir, criar uma nova
        if not settings:
            settings = Settings()
            db.add(settings)
            db.commit()
            db.refresh(settings)
        # Se existirem múltiplas, manter apenas a primeira e excluir as outras
        else:
            # Verificar se há mais registros além do primeiro
            extra_settings = db.query(Settings).filter(Settings.id != settings.id).all()
            if extra_settings:
                # Registrar quantos registros extras encontrados
                logger.warning(f"Encontrados {len(extra_settings)} registros extras na tabela settings. Mantendo apenas o ID {settings.id}.")
                
                # Excluir registros extras um por um para evitar erros
                for extra in extra_settings:
                    db.delete(extra)
                    try:
                        db.commit()
                    except Exception as e:
                        db.rollback()
                        logger.error(f"Erro ao excluir configuração ID {extra.id}: {e}")
        
        return settings
    except Exception as e:
        logger.error(f"Erro ao obter configurações: {e}")
        db.rollback()
        # Criar uma nova configuração em caso de erro
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

def update_settings(db: Session, settings_update: SettingsUpdate):
    """Atualizar configurações do sistema"""
    db_settings = get_settings(db)
    
    # Atualizar apenas os campos fornecidos
    update_data = settings_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_settings, key, value)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings

def get_system_info(db: Session) -> SystemInfo:
    """Obter informações do sistema"""
    settings = get_settings(db)
    
    # Versão da aplicação
    version = "1.0.0"  # Você pode obter isso de um arquivo de versão
    
    # Status do banco de dados
    try:
        db.execute(func.now())
        database_status = "Connected"
    except Exception:
        database_status = "Disconnected"
    
    # Informações de armazenamento
    try:
        total, used, free = shutil.disk_usage("/")
        storage_used = f"{used / (1024**3):.1f} GB"
        storage_available = f"{free / (1024**3):.1f} GB"
    except Exception:
        storage_used = "Unknown"
        storage_available = "Unknown"
    
    # Contagem de pessoas e imagens
    total_persons = db.query(Person).count()
    # Corrigido: usar PersonImage em vez de Person.face_detected
    total_images = db.query(PersonImage).filter(PersonImage.face_detected == True).count()
    
    # Tamanho do índice FAISS
    faiss_index_path = os.path.join(settings.processed_dir, "faiss_index.bin")
    if os.path.exists(faiss_index_path):
        faiss_index_size = f"{os.path.getsize(faiss_index_path) / (1024**2):.1f} MB"
    else:
        faiss_index_size = "0 MB"
    
    # Último backup
    last_backup = settings.last_backup.strftime("%Y-%m-%d %H:%M:%S") if settings.last_backup else "Never"
    
    return SystemInfo(
        version=version,
        database_status=database_status,
        storage_used=storage_used,
        storage_available=storage_available,
        total_persons=total_persons,
        total_images=total_images,
        faiss_index_size=faiss_index_size,
        last_backup=last_backup
    )

def rebuild_faiss_index(db: Session, faiss_index, file_processor):
    """Reconstruir o índice FAISS"""
    # Usar a função de reconstrução do dependencies.py
    success_count, failure_count = rebuild_index_from_db(db, faiss_index, file_processor)
    
    return {
        "success": True,
        "total_processed": success_count + failure_count,
        "successful": success_count,
        "failed": failure_count,
        "message": f"FAISS index rebuilt successfully: {success_count} successful, {failure_count} failed"
    }

def create_backup(db: Session):
    """Criar um backup do sistema"""
    settings = get_settings(db)
    
    # Criar diretório de backup se não existir
    os.makedirs(settings.backup_dir, exist_ok=True)
    
    # Nome do arquivo de backup com timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"backup_{timestamp}.zip"
    backup_path = os.path.join(settings.backup_dir, backup_filename)
    
    # Diretórios para fazer backup
    dirs_to_backup = [
        settings.processed_dir,
        # Adicione outros diretórios conforme necessário
    ]
    
    # Criar arquivo zip com os diretórios
    shutil.make_archive(
        os.path.splitext(backup_path)[0],  # Nome do arquivo sem extensão
        'zip',
        root_dir=os.path.dirname(dirs_to_backup[0]),
        base_dir=os.path.basename(dirs_to_backup[0])
    )
    
    # Atualizar a data do último backup
    settings.last_backup = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "backup_path": backup_path,
        "timestamp": timestamp,
        "message": f"Backup created successfully at {backup_path}"
    }