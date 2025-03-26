"""
Dependências compartilhadas para injeção de dependência no FastAPI.
"""
import os
import logging
from ..core.face_processor import FaceProcessor
from ..core.faiss_index import FaissIndex
from ..core.file_processor import FileProcessor

logger = logging.getLogger(__name__)

# Variáveis globais para armazenar as instâncias
face_processor = None
faiss_index = None
file_processor = None

def rebuild_index_from_db(db, faiss_index, file_processor):
    """
    Reconstrói o índice FAISS a partir das imagens armazenadas no banco de dados.
    """
    from ..models.person import Person
    
    # Limpar o índice FAISS existente
    faiss_index.clear()
    
    # Obter todas as pessoas com faces detectadas
    logger.info("Iniciando reconstrução do índice FAISS a partir do banco de dados")
    persons = db.query(Person).filter(Person.face_detected == True).all()
    logger.info(f"Encontradas {len(persons)} pessoas com faces detectadas")
    
    # Processar cada pessoa para adicionar ao índice
    success_count = 0
    failure_count = 0
    
    for person in persons:
        if person.file_path and os.path.exists(person.file_path):
            # Obter o embedding da face
            embedding = face_processor.extract_embedding(person.file_path)
            
            if embedding is not None:
                # Criar metadados
                metadata = {
                    "person_id": person.person_id,
                    "person_name": person.name,
                    "origin": person.origin,
                    "filename": person.filename,
                    "processed_date": person.processed_date.isoformat() if person.processed_date else ""
                }
                
                # Adicionar ao índice FAISS
                faiss_id = faiss_index.add_embedding(embedding, metadata)
                
                # Atualizar o ID FAISS na pessoa
                person.faiss_id = faiss_id
                success_count += 1
            else:
                logger.warning(f"Não foi possível extrair embedding para {person.file_path}")
                failure_count += 1
        else:
            logger.warning(f"Arquivo não encontrado: {person.file_path}")
            failure_count += 1
    
    # Salvar as alterações no banco de dados
    db.commit()
    
    # Salvar o índice FAISS
    processed_dir = os.path.dirname(persons[0].file_path) if persons else file_processor.processed_dir
    index_path = os.path.join(processed_dir, "faiss_index.bin")
    metadata_path = os.path.join(processed_dir, "faiss_metadata.pkl")
    faiss_index.save(index_path, metadata_path)
    
    logger.info(f"Reconstrução do índice FAISS concluída: {success_count} sucesso, {failure_count} falhas")
    return success_count, failure_count

def init_processors(upload_dir, processed_dir, models_dir):
    """Inicializa os processadores necessários para a aplicação."""
    global face_processor, faiss_index, file_processor
    
    # Inicializar processador de faces
    face_processor = FaceProcessor(model_path=models_dir)
    logger.info("Face processor initialized")
    
    # Inicializar índice FAISS
    faiss_index = FaissIndex(
        dimension=512,  # Valor padrão, pode ser configurável
        index_type="L2"  # Valor padrão, pode ser configurável
    )
    logger.info("FAISS index initialized")
    
    # Verificar se existe um índice FAISS salvo
    try:
        index_path = os.path.join(processed_dir, "faiss_index.bin")
        metadata_path = os.path.join(processed_dir, "faiss_metadata.pkl")
        
        if os.path.exists(index_path) and os.path.exists(metadata_path):
            logger.info("Existing FAISS index found, attempting to load")
            success = faiss_index.load(index_path, metadata_path)
            
            if success:
                logger.info(f"FAISS index loaded with {faiss_index.get_total_items()} embeddings")
            else:
                logger.warning("Failed to load FAISS index, a new one will be created")
                logger.info("You may need to rebuild the index using /api/settings/rebuild-index")
    except Exception as e:
        logger.error(f"Error loading FAISS index: {str(e)}")
        logger.warning("A new FAISS index will be created")
        logger.info("You may need to rebuild the index using /api/settings/rebuild-index")
    
    # Inicializar processador de arquivos
    file_processor = FileProcessor(
        upload_dir=upload_dir,
        processed_dir=processed_dir,
        face_processor=face_processor,
        faiss_index=faiss_index
    )
    logger.info("File processor initialized")
    
    # Verificar se é necessário reconstruir o índice automaticamente
    if faiss_index.get_total_items() == 0:
        logger.warning("FAISS index is empty, you may want to rebuild it using /api/settings/rebuild-index")

def get_face_processor():
    """Retorna a instância do processador de faces."""
    return face_processor

def get_faiss_index():
    """Retorna a instância do índice FAISS."""
    return faiss_index

def get_file_processor():
    """Retorna a instância do processador de arquivos."""
    return file_processor