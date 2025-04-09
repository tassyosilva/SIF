from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from fastapi.responses import FileResponse # Nova importação
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
from ...database import get_db
from ...models.person import Person, PersonImage, BatchUpload
from ...schemas.person import (
    Person as PersonSchema,
    PersonCreate,
    PersonUpdate,
    PersonImage as PersonImageSchema,
    BatchUploadStart,
    BatchUploadComplete
)
from ...core.file_processor import FileProcessor
from ...config import settings

router = APIRouter()

@router.get("/", response_model=List[PersonSchema])
def get_persons(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    person_id: Optional[str] = None,
    origin: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retorna uma lista de pessoas com filtros opcionais."""
    query = db.query(Person)
    if name:
        query = query.filter(Person.name.ilike(f"%{name}%"))
    if person_id:
        query = query.filter(Person.person_id == person_id)
    if origin:
        query = query.filter(Person.origin == origin)
    return query.offset(skip).limit(limit).all()

@router.get("/{person_id}", response_model=PersonSchema)
def get_person(person_id: str, db: Session = Depends(get_db)):
    """Retorna uma pessoa pelo ID."""
    person = db.query(Person).filter(Person.person_id == person_id).first()
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    return person

@router.post("/", response_model=PersonSchema)
def create_person(person: PersonCreate, db: Session = Depends(get_db)):
    """Cria uma nova pessoa."""
    db_person = db.query(Person).filter(Person.person_id == person.person_id).first()
    if db_person:
        raise HTTPException(status_code=400, detail="Person ID already registered")
    db_person = Person(**person.dict())
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person

@router.put("/{person_id}", response_model=PersonSchema)
def update_person(person_id: str, person: PersonUpdate, db: Session = Depends(get_db)):
    """Atualiza uma pessoa existente."""
    db_person = db.query(Person).filter(Person.person_id == person_id).first()
    if db_person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    for key, value in person.dict(exclude_unset=True).items():
        setattr(db_person, key, value)
    db.commit()
    db.refresh(db_person)
    return db_person

@router.delete("/{person_id}")
def delete_person(person_id: str, db: Session = Depends(get_db)):
    """Remove uma pessoa."""
    db_person = db.query(Person).filter(Person.person_id == person_id).first()
    if db_person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    db.delete(db_person)
    db.commit()
    return {"message": "Person deleted successfully"}

@router.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    allow_duplicates: bool = Form(False),  # Novo parâmetro para permitir duplicatas
    db: Session = Depends(get_db)
):
    """Faz upload de um arquivo de imagem e processa."""
    # Verificar se é uma imagem
    valid_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in valid_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type. Only image files are allowed.")
    
    # Verificar se o arquivo original já existe (apenas se não for permitido duplicatas)
    if not allow_duplicates:
        existing_file = db.query(PersonImage).filter(
            PersonImage.original_filename == file.filename
        ).first()
        
        if existing_file:
            return {
                "success": False,
                "message": f"Arquivo {file.filename} já foi processado anteriormente.",
                "details": {
                    "filename": file.filename,
                    "processed_date": existing_file.processed_date,
                    "duplicate": True
                }
            }
    
    # Salvar o arquivo no diretório de uploads
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Processar o arquivo
    from ...core.dependencies import get_file_processor
    file_processor = get_file_processor()
    result = file_processor.process_image(file_path)
    if not result["success"]:
        return result
    
    # Verificar se a pessoa já existe no banco de dados
    db_person = db.query(Person).filter(
        Person.name == result["person_name"],
        Person.cpf == result["cpf"]
    ).first()
    
    if not db_person:
        # Criar nova pessoa
        person_data = {
            "person_id": result["person_id"],
            "cpf": result["cpf"],
            "name": result["person_name"],
            "origin_code": result["origin"][:3],
            "origin": result["origin"],
        }
        db_person = Person(**person_data)
        db.add(db_person)
        db.commit()
        db.refresh(db_person) # Isso carregará o registro_unico gerado
    
    # Criar nova entrada de imagem
    image_data = {
        "person_id": db_person.person_id, # Mantido para compatibilidade
        "registro_unico": db_person.registro_unico, # Nova chave estrangeira
        "filename": result["filename"],
        "original_filename": result["original_filename"],
        "file_path": os.path.join(settings.PROCESSED_DIR, result["filename"]),
        "processed": True,
        "processed_date": datetime.now(),
        "face_detected": True,
        "faiss_id": result.get("faiss_id")
    }
    db_image = PersonImage(**image_data)
    db.add(db_image)
    db.commit()
    
    return {
        "success": True,
        "message": "File uploaded and processed successfully",
        "person": {
            "id": db_person.id,
            "person_id": db_person.person_id,
            "name": db_person.name,
            "origin": db_person.origin,
            "image_id": db_image.id
        }
    }

@router.post("/batch-process/")
def batch_process(db: Session = Depends(get_db)):
    """Processa todas as imagens no diretório de uploads."""
    from ...core.dependencies import get_file_processor
    file_processor = get_file_processor()
    result = file_processor.process_batch(max_workers=settings.BATCH_WORKERS)

    # Atualizar banco de dados com os resultados
    if result["success"]:
        for detail in result["details"]:
            if detail["success"]:
                # Verificar se a pessoa já existe no banco de dados
                db_person = db.query(Person).filter(
                    Person.name == detail["person_name"],
                    Person.cpf == detail["cpf"]
                ).first()
                
                if not db_person:
                    # Criar nova pessoa
                    person_data = {
                        "person_id": detail["person_id"],
                        "cpf": detail["cpf"],
                        "name": detail["person_name"],
                        "origin_code": detail["origin"][:3],
                        "origin": detail["origin"],
                    }
                    db_person = Person(**person_data)
                    db.add(db_person)
                    db.commit()
                    db.refresh(db_person) # Carrega o registro_unico gerado
                
                # Criar nova entrada de imagem
                image_data = {
                    "person_id": db_person.person_id, # Mantido para compatibilidade
                    "registro_unico": db_person.registro_unico, # Nova chave estrangeira
                    "filename": detail["filename"],
                    "original_filename": detail["original_filename"],
                    "file_path": os.path.join(settings.PROCESSED_DIR, detail["filename"]),
                    "processed": True,
                    "processed_date": datetime.now(),
                    "face_detected": True,
                    "faiss_id": detail.get("faiss_id")
                }
                db_image = PersonImage(**image_data)
                db.add(db_image)
                db.commit()
    
    return result

@router.get("/{person_id}/image")
def get_person_image(
    person_id: str,
    image_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retorna a imagem de uma pessoa. Se image_id for fornecido, retorna essa imagem específica.
    Caso contrário, retorna a imagem mais recente."""
    person = db.query(Person).filter(Person.person_id == person_id).first()
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Buscar a imagem específica ou a mais recente usando registro_unico
    if image_id:
        image = db.query(PersonImage).filter(
            PersonImage.registro_unico == person.registro_unico,
            PersonImage.id == image_id
        ).first()
    else:
        # Buscar a imagem mais recente
        image = db.query(PersonImage).filter(
            PersonImage.registro_unico == person.registro_unico
        ).order_by(PersonImage.processed_date.desc()).first()
    
    if not image or not image.file_path or not os.path.exists(image.file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(image.file_path)

@router.get("/{person_id}/images", response_model=List[PersonImageSchema])
def get_person_images(person_id: str, db: Session = Depends(get_db)):
    """Retorna todas as imagens de uma pessoa."""
    person = db.query(Person).filter(Person.person_id == person_id).first()
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    
    images = db.query(PersonImage).filter(
        PersonImage.registro_unico == person.registro_unico
    ).all()
    
    return images

@router.post("/batch-upload-start/")
def start_batch_upload(
    batch_info: BatchUploadStart,
    db: Session = Depends(get_db)
):
    """Iniciar um upload em lote"""
    batch_upload = BatchUpload(
        batch_id=batch_info.batch_id,
        status='pending',
        total_files=batch_info.total_files
    )
    db.add(batch_upload)
    db.commit()
    
    return {"message": "Batch upload started", "batch_id": batch_upload.batch_id}

@router.post("/upload-file/")
async def upload_file(
    file: UploadFile = File(...),
    batch_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload de arquivo individual para um lote"""
    # Verificar se o lote existe e está pendente
    batch = db.query(BatchUpload).filter(
        BatchUpload.batch_id == batch_id,
        BatchUpload.status == 'pending'
    ).first()
    
    if not batch:
        raise HTTPException(status_code=400, detail="Invalid or completed batch")
    
    # Salvar arquivo
    file_path = os.path.join(settings.UPLOAD_DIR, f"{batch_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"message": "File uploaded successfully"}

@router.post("/batch-upload-complete/")
def complete_batch_upload(
    batch_info: BatchUploadComplete,
    db: Session = Depends(get_db)
):
    """Processar todos os arquivos de um lote"""
    batch = db.query(BatchUpload).filter(
        BatchUpload.batch_id == batch_info.batch_id,
        BatchUpload.status == 'pending'
    ).first()
    
    if not batch:
        raise HTTPException(status_code=400, detail="Invalid batch")
    
    try:
        # Processar todos os arquivos do lote
        batch_files = [f for f in os.listdir(settings.UPLOAD_DIR) 
                      if f.startswith(f"{batch_info.batch_id}_")]
        
        from ...core.dependencies import get_file_processor
        file_processor = get_file_processor()
        
        for filename in batch_files:
            full_path = os.path.join(settings.UPLOAD_DIR, filename)
            file_processor.process_image(full_path)
            # Marcar progresso
            batch.processed_files += 1
        
        # Marcar lote como concluído
        batch.status = 'completed'
        db.commit()
        
        return {
            "message": "Batch upload processed successfully",
            "total_files": batch.total_files,
            "processed_files": batch.processed_files
        }
    except Exception as e:
        batch.status = 'failed'
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
