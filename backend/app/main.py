import os
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .api.router import api_router
from .config import settings
from .database import engine, Base, SessionLocal
from .core.dependencies import init_processors
from .tasks.scheduled_tasks import start_scheduler
from .models.user import User, UserType
from .core.security import hash_password
from .models.local import Estado, Orgao

# Importar todos os modelos para garantir que sejam registrados com Base
from .models import Person, Settings # Importe todos os seus modelos aqui

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)

logger = logging.getLogger(__name__)

# Criar tabelas no banco de dados automaticamente na inicialização
try:
    # Teste de conexão
    from sqlalchemy import text, inspect
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        logger.info(f"Database connection test: {result.scalar()}")
    
    # Verificar se as tabelas já existem
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    logger.info(f"Existing tables: {existing_tables}")
    
    # Criar tabelas apenas se não existirem
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created or already exist")
    
    # Verificar tabelas após a criação
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    logger.info(f"Tables in database after creation: {tables}")
    
    # Verificar e criar usuário admin
    with SessionLocal() as db:
        # Verificar se já existe um admin
        existing_admin = db.query(User).filter(User.login == "admin").first()
        
        if not existing_admin:
            admin_user = User(
                login="admin",
                nome_completo="Administrador do Sistema",
                cpf="00000000000",  # CPF fictício
                matricula="000000",
                email="admin@admin.com",
                senha_hash=hash_password("admin"),
                tipo_usuario=UserType.ADMINISTRADOR
            )
            
            db.add(admin_user)
            db.commit()
            logger.info("Usuário administrador criado com sucesso!")
        else:
            logger.info("Usuário administrador já existe.")
    
    # Popular estados e órgãos
    with SessionLocal() as db:
        Estado.populate_default_estados(db)
        Orgao.populate_default_orgaos(db)
        logger.info("Estados e Órgãos populados com sucesso!")
            
except Exception as e:
    logger.error(f"Error with database: {e}")

# Criar diretórios necessários
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)

# Criar aplicação FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, especificar origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas da API com o prefixo definido em settings
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.on_event("startup")
async def startup_event():
    """
    Inicializa os processadores quando a aplicação é iniciada.
    """
    # Existentes configurações de inicialização
    init_processors(
        upload_dir=settings.UPLOAD_DIR,
        processed_dir=settings.PROCESSED_DIR,
        models_dir=settings.MODELS_DIR
    )
    
    # Iniciar scheduler em uma thread separada
    threading.Thread(target=start_scheduler, daemon=True).start()

@app.get("/")
def read_root():
    """
    Rota raiz para verificar se a API está funcionando.
    """
    return {
        "message": "Face Recognition API is running",
        "version": "1.0.0",
        "docs": f"{settings.API_PREFIX}/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
