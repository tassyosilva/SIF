from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
from ...database import get_db
from ...schemas.person import SearchResponse
from ...config import settings
from ...models.person import Person

router = APIRouter()

@router.post("/search/", response_model=SearchResponse)
async def search_faces(
    file: UploadFile = File(...),
    k: int = Query(5, description="Número de resultados a retornar"),
    db: Session = Depends(get_db)
):
    """
    Busca faces similares a partir de uma imagem de consulta.
    """
    # Verificar se é uma imagem
    valid_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in valid_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type. Only image files are allowed.")

    # Criar diretório temporário para a imagem de consulta
    temp_dir = os.path.join(settings.UPLOAD_DIR, "temp")
    os.makedirs(temp_dir, exist_ok=True)

    # Gerar nome único para o arquivo
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(temp_dir, unique_filename)

    # Salvar o arquivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Buscar faces similares
        from ...core.dependencies import get_file_processor
        file_processor = get_file_processor()
        result = file_processor.search_similar_faces(file_path, k)
        return result
    finally:
        # Remover o arquivo temporário
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/search-by-id/", response_model=SearchResponse)
def search_by_person_id(
    person_id: str = Body(..., embed=True),
    k: int = Query(5, description="Número de resultados a retornar"),
    db: Session = Depends(get_db)
):
    """
    Busca faces similares a partir do ID de uma pessoa.
    """
    # Buscar a pessoa no banco de dados
    person = db.query(Person).filter(Person.person_id == person_id).first()
    if not person:
        # Em vez de lançar exceção, retornar resposta com erro
        return {
            "success": False,
            "message": "RG não encontrado no sistema.",
            "results": []
        }
    
    # Buscar a imagem mais recente desta pessoa
    from ...models.person import PersonImage
    latest_image = db.query(PersonImage).filter(
        PersonImage.person_id == person.person_id
    ).order_by(PersonImage.processed_date.desc()).first()
    
    if not latest_image or not latest_image.file_path or not os.path.exists(latest_image.file_path):
        return {
            "success": False,
            "message": "Imagem da pessoa não encontrada no sistema.",
            "results": []
        }

    # Buscar faces similares
    from ...core.dependencies import get_file_processor
    file_processor = get_file_processor()
    result = file_processor.search_similar_faces(latest_image.file_path, k)
    return result

@router.post("/search-by-cpf/", response_model=SearchResponse)
def search_by_cpf(
    cpf: str = Body(..., embed=True),
    k: int = Query(5, description="Número de resultados a retornar"),
    db: Session = Depends(get_db)
):
    """
    Busca faces similares a partir do CPF de uma pessoa.
    """
    # Buscar a pessoa no banco de dados
    person = db.query(Person).filter(Person.cpf == cpf).first()
    if not person:
        # Em vez de lançar exceção, retornar resposta com erro
        return {
            "success": False,
            "message": "CPF não encontrado no sistema.",
            "results": []
        }
    
    # Buscar a imagem mais recente desta pessoa
    from ...models.person import PersonImage
    latest_image = db.query(PersonImage).filter(
        PersonImage.person_id == person.person_id
    ).order_by(PersonImage.processed_date.desc()).first()
    
    if not latest_image or not latest_image.file_path or not os.path.exists(latest_image.file_path):
        return {
            "success": False,
            "message": "Imagem da pessoa não encontrada no sistema.",
            "results": []
        }

    # Buscar faces similares
    from ...core.dependencies import get_file_processor
    file_processor = get_file_processor()
    result = file_processor.search_similar_faces(latest_image.file_path, k)
    return result

@router.post("/search-by-name/", response_model=SearchResponse)
def search_by_name(
    name: str = Body(..., embed=True),
    k: int = Query(5, description="Número de resultados a retornar"),
    db: Session = Depends(get_db)
):
    """
    Busca faces similares a partir do nome de uma pessoa.
    """
    # Buscar a pessoa no banco de dados (usando LIKE para correspondência parcial)
    person = db.query(Person).filter(Person.name.ilike(f"%{name}%")).first()
    if not person:
        # Em vez de lançar exceção, retornar resposta com erro
        return {
            "success": False,
            "message": "Nome não encontrado no sistema.",
            "results": []
        }
    
    # Buscar a imagem mais recente desta pessoa
    from ...models.person import PersonImage
    latest_image = db.query(PersonImage).filter(
        PersonImage.person_id == person.person_id
    ).order_by(PersonImage.processed_date.desc()).first()
    
    if not latest_image or not latest_image.file_path or not os.path.exists(latest_image.file_path):
        return {
            "success": False,
            "message": "Imagem da pessoa não encontrada no sistema.",
            "results": []
        }

    # Buscar faces similares
    from ...core.dependencies import get_file_processor
    file_processor = get_file_processor()
    result = file_processor.search_similar_faces(latest_image.file_path, k)
    return result