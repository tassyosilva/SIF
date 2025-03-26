from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from fastapi.responses import FileResponse  # Nova importação

from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil

from ...database import get_db
from ...models.person import Person
from ...schemas.person import Person as PersonSchema, PersonCreate, PersonUpdate
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
    """
    Retorna uma lista de pessoas com filtros opcionais.
    """
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
    """
    Retorna uma pessoa pelo ID.
    """
    person = db.query(Person).filter(Person.person_id == person_id).first()
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    return person

@router.post("/", response_model=PersonSchema)
def create_person(person: PersonCreate, db: Session = Depends(get_db)):
    """
    Cria uma nova pessoa.
    """
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
    """
    Atualiza uma pessoa existente.
    """
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
    """
    Remove uma pessoa.
    """
    db_person = db.query(Person).filter(Person.person_id == person_id).first()
    if db_person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    db.delete(db_person)
    db.commit()
    return {"message": "Person deleted successfully"}

@router.post("/upload/")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Faz upload de um arquivo de imagem e processa.
    """
    # Verificar se é uma imagem
    valid_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in valid_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type. Only image files are allowed.")
    
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
    db_person = db.query(Person).filter(Person.person_id == result["person_id"]).first()
    
    if not db_person:
        # Criar nova pessoa
        person_data = {
            "person_id": result["person_id"],
            "cpf": result["cpf"],  # Adicionar CPF aqui
            "name": result["person_name"],
            "origin_code": result["origin"][:3],
            "origin": result["origin"],
            "filename": result["filename"],
            "file_path": file_path,
            "processed": True,
            "processed_date": result.get("processed_date"),
            "face_detected": True,
            "faiss_id": result.get("faiss_id")
        }
        db_person = Person(**person_data)
        db.add(db_person)
        db.commit()
        db.refresh(db_person)
    else:
        # Atualizar pessoa existente
        db_person.filename = result["filename"]
        db_person.file_path = file_path
        db_person.processed = True
        db_person.processed_date = result.get("processed_date")
        db_person.face_detected = True
        db_person.faiss_id = result.get("faiss_id")
        db.commit()
        db.refresh(db_person)
    
    return {
        "success": True,
        "message": "File uploaded and processed successfully",
        "person": {
            "id": db_person.id,
            "person_id": db_person.person_id,
            "name": db_person.name,
            "origin": db_person.origin
        }
    }

@router.post("/batch-process/")
def batch_process(db: Session = Depends(get_db)):
    """
    Processa todas as imagens no diretório de uploads.
    """
    from ...core.dependencies import get_file_processor
    file_processor = get_file_processor()
    result = file_processor.process_batch(max_workers=settings.BATCH_WORKERS)
    
    # Atualizar banco de dados com os resultados
    if result["success"]:
        for detail in result["details"]:
            if detail["success"]:
                # Verificar se a pessoa já existe no banco de dados
                db_person = db.query(Person).filter(Person.person_id == detail["person_id"]).first()
                file_path = os.path.join(settings.UPLOAD_DIR, detail["filename"])
                
                if not db_person:
                    # Criar nova pessoa
                    person_data = {
                        "person_id": detail["person_id"],
                        "cpf": detail["cpf"],  # Adicionar CPF aqui
                        "name": detail["person_name"],
                        "origin_code": detail["origin"][:3],
                        "origin": detail["origin"],
                        "filename": detail["filename"],
                        "file_path": file_path,
                        "processed": True,
                        "processed_date": detail.get("processed_date"),
                        "face_detected": True,
                        "faiss_id": detail.get("faiss_id")
                    }
                    db_person = Person(**person_data)
                    db.add(db_person)
                else:
                    # Atualizar pessoa existente
                    db_person.filename = detail["filename"]
                    db_person.file_path = file_path
                    db_person.processed = True
                    db_person.face_detected = True
                    db_person.faiss_id = detail.get("faiss_id")
                db.commit()
    
    return result

@router.get("/{person_id}/image")
def get_person_image(person_id: str, db: Session = Depends(get_db)):
    """
    Retorna a imagem de uma pessoa.
    """
    person = db.query(Person).filter(Person.person_id == person_id).first()
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    
    if not person.file_path or not os.path.exists(person.file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(person.file_path)