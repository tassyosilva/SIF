import os
import shutil
import psutil
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.settings import Settings
from ..models.person import Person
from ..schemas.settings import SettingsCreate, SettingsUpdate, SystemInfo

def get_settings(db: Session):
    """Obter configurações do sistema"""
    settings = db.query(Settings).first()
    if not settings:
        # Criar configurações padrão se não existirem
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
    total_images = db.query(Person).filter(Person.face_detected == True).count()
    
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
    # Limpar o índice FAISS
    faiss_index.clear()
    
    # Obter todas as pessoas com faces detectadas
    persons = db.query(Person).filter(Person.face_detected == True).all()
    
    # Processar cada pessoa novamente para adicionar ao índice
    for person in persons:
        if person.file_path and os.path.exists(person.file_path):
            file_processor.process_file(person.file_path, person.person_id, person.name)
    
    # Salvar o índice FAISS
    settings = get_settings(db)
    index_path = os.path.join(settings.processed_dir, "faiss_index.bin")
    metadata_path = os.path.join(settings.processed_dir, "faiss_metadata.pkl")
    faiss_index.save(index_path, metadata_path)
    
    return True

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
    
    return True
