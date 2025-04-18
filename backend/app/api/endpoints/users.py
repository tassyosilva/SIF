from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from ...database import get_db
from ...models.user import User, UserType
from ...schemas.user import UserCreate, UserInDB, UserUpdate
from ...core.security import hash_password
from ...core.permissions import role_required
from ...services.email_service import send_welcome_email
import logging


router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[UserInDB])
def get_users(
    skip: int = 0,
    limit: int = 100,
    nome: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna uma lista de usuários com filtros opcionais.
    """
    query = db.query(User)
    # Aplicar filtros se fornecidos
    if nome:
        query = query.filter(User.nome_completo.ilike(f"%{nome}%"))
    # Aplicar paginação
    users = query.offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserInDB)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Retorna um usuário específico pelo ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user


@router.post("/", response_model=UserInDB)
async def create_user(
    user: UserCreate, 
    db: Session = Depends(get_db)
):
    """
    Cria um novo usuário e envia um e-mail de boas-vindas.
    """
    # Verificar se usuário já existe
    existing_user = (
        db.query(User)
        .filter(
            or_(
                User.login == user.login,
                User.cpf == user.cpf,
                User.email == user.email,
                User.matricula == user.matricula
            )
        )
        .first()
    )
    if existing_user:
        # Determinar qual campo está duplicado
        if existing_user.login == user.login:
            raise HTTPException(status_code=400, detail="Login já cadastrado")
        elif existing_user.cpf == user.cpf:
            raise HTTPException(status_code=400, detail="CPF já cadastrado")
        elif existing_user.email == user.email:
            raise HTTPException(status_code=400, detail="E-mail já cadastrado")
        elif existing_user.matricula == user.matricula:
            raise HTTPException(status_code=400, detail="Matrícula já cadastrada")
        else:
            raise HTTPException(status_code=400, detail="Usuário já cadastrado")

    # Criar novo usuário
    db_user = User(
        **user.dict(exclude={"senha"}),
        senha_hash=hash_password(user.senha)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Enviar e-mail de boas-vindas
    try:
        logger.info(f"E-mail de boas-vindas agendado para envio para {user.email}")
        await send_welcome_email(
            email_to=user.email,
            username=user.login,
            password=user.senha
        )
    except Exception as e:
        # Apenas logamos o erro, não queremos falhar a API se o e-mail falhar
        logger.error(f"Erro ao enviar e-mail de boas-vindas: {str(e)}")
    
    return db_user


@router.put("/{user_id}", response_model=UserInDB)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    """
    Atualiza um usuário existente.
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    # Atualizar apenas os campos fornecidos
    for key, value in user.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Remove um usuário (exclusão física).
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    # Verificar se é o último administrador
    if db_user.tipo_usuario == UserType.ADMINISTRADOR:
        admin_count = db.query(User).filter(
            User.tipo_usuario == UserType.ADMINISTRADOR,
            User.id != user_id
        ).count()
        if admin_count == 0:
            raise HTTPException(
                status_code=400,
                detail="Não é possível remover o único administrador do sistema"
            )
    # Exclusão física do usuário
    db.delete(db_user)
    db.commit()
    return {"message": "Usuário removido com sucesso"}
