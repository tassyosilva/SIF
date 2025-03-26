import sys
import os

# Adicionar o diretório raiz ao path para importar os módulos da aplicação
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.database import engine

def check_db():
    try:
        # Testar conexão
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print(f"Database connection test: {result.scalar()}")
        
        # Verificar tabelas
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Tables in database: {tables}")
        
        # Verificar esquemas
        schemas = inspector.get_schema_names()
        print(f"Schemas in database: {schemas}")
        
        # Para cada esquema, verificar tabelas
        for schema in schemas:
            schema_tables = inspector.get_table_names(schema=schema)
            print(f"Tables in schema {schema}: {schema_tables}")
    
    except Exception as e:
        print(f"Error checking database: {e}")

if __name__ == "__main__":
    check_db()
