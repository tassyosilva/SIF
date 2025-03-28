from apscheduler.schedulers.background import BackgroundScheduler
from ..database import SessionLocal
from ..services.upload_cleanup import clean_old_uploads

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    # Executar limpeza diariamente à meia-noite
    scheduler.add_job(
        lambda: clean_old_uploads(SessionLocal()),
        'cron', 
        hour=0, 
        minute=0
    )
    
    scheduler.start()