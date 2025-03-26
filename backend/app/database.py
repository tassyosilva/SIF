from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Criar URL de conexão com o banco de dados
# Converter PostgresDsn para string
SQLALCHEMY_DATABASE_URL = str(settings.DATABASE_URL)

# Criar engine do SQLAlchemy
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Criar fábrica de sessões
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos declarativos
Base = declarative_base()

# Função para obter uma sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()