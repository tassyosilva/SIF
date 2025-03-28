import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.person import BatchUpload
from ..config import settings

def clean_old_uploads(db: Session):
    """
    Limpa uploads pendentes e arquivos temporários antigos
    """
    try:
        # Define o tempo de corte para 24 horas atrás
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        # Buscar lotes antigos não concluídos
        old_batches = db.query(BatchUpload).filter(
            BatchUpload.created_at < cutoff_time,
            BatchUpload.status != 'completed'
        ).all()
        
        for batch in old_batches:
            # Encontrar e remover arquivos do lote
            batch_files = [
                f for f in os.listdir(settings.UPLOAD_DIR) 
                if f.startswith(f"{batch.batch_id}_")
            ]
            
            for filename in batch_files:
                file_path = os.path.join(settings.UPLOAD_DIR, filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            # Remover registro do banco de dados
            db.delete(batch)
        
        db.commit()
        
        print(f"Cleaned up {len(old_batches)} old upload batches")
    
    except Exception as e:
        db.rollback()
        print(f"Error in upload cleanup: {str(e)}")