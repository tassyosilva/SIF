from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ...database import get_db
from ...models.local import Estado, Orgao
from ...schemas.local import EstadoBase, OrgaoBase

router = APIRouter()

@router.get("/estados/", response_model=List[EstadoBase])
def get_estados(db: Session = Depends(get_db)):
    """
    Retorna a lista de estados (UFs).
    """
    return db.query(Estado).all()

@router.get("/orgaos/", response_model=List[OrgaoBase])
def get_orgaos(db: Session = Depends(get_db)):
    """
    Retorna a lista de órgãos.
    """
    return db.query(Orgao).all()