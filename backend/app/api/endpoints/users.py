from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...database import get_db
from ...models.user import User, UserType
from ...schemas.user import UserCreate, UserInDB, UserUpdate
from ...core.security import hash_password

router = APIRouter()

@router.post("/", response_model=UserInDB)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Verificar se usuário já existe
    existing_user = (
        db.query(User)
        .filter(
            (User.login == user.login) | 
            (User.cpf == user.cpf) | 
            (User.email == user.email)
        )
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="Usuário já cadastrado")

    # Criar novo usuário
    db_user = User(
        **user.dict(exclude={"senha"}),
        senha_hash=hash_password(user.senha)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user