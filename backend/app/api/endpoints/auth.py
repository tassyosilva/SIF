from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Annotated

from ...database import get_db
from ...models.user import User
from ...core.security import verify_password, hash_password
from ...core.jwt import create_access_token, decode_token
from ...schemas.user import UserInDB


router = APIRouter()


# Configuração do esquema de autenticação
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


def authenticate_user(db: Session, login: str, password: str):
    """
    Autentica um usuário
    """
    user = db.query(User).filter(User.login == login).first()
    if not user:
        return False
    if not verify_password(password, user.senha_hash):
        return False
    return user


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    """
    Obtém o usuário atual a partir do token
    """
    try:
        payload = decode_token(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"}
            )
        login = payload.get("sub")
        if login is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"}
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"}
        )
    user = db.query(User).filter(User.login == login).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


@router.post("/token")
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    """
    Endpoint de login para obter token de acesso
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"}
        )
    # Criar token de acesso
    access_token = create_access_token(
        data={"sub": user.login, "tipo_usuario": user.tipo_usuario.value}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "nome_completo": user.nome_completo,
            "tipo_usuario": user.tipo_usuario.value,
            "email": user.email
        }
    }


@router.post("/refresh")
def refresh_token(token: str = Body(...), db: Session = Depends(get_db)):
    """
    Atualiza o token de acesso
    """
    try:
        # Decodificar o token atual
        payload = decode_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        # Buscar usuário
        user = db.query(User).filter(User.login == payload.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        # Criar novo token
        new_token = create_access_token(
            data={"sub": user.login, "tipo_usuario": user.tipo_usuario.value}
        )
        return {"access_token": new_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Não foi possível atualizar o token")


@router.post("/change-password")
def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Alterar senha do usuário logado
    """
    # Verificar se a senha atual está correta
    if not verify_password(current_password, user.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    
    # Validar nova senha
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")
    
    # Atualizar senha
    user.senha_hash = hash_password(new_password)
    db.commit()
    
    return {"message": "Senha alterada com sucesso"}
