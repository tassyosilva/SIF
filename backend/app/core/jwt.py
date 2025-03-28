import os
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from jose.exceptions import JWTError

# Gerar uma chave secreta segura se não existir
def generate_secret_key():
    # Primeiro, tenta ler de uma variável de ambiente
    secret_key = os.environ.get('JWT_SECRET_KEY')
    
    # Se não existir na variável de ambiente, verifica um arquivo
    if not secret_key:
        secret_key_path = os.path.join(os.path.dirname(__file__), '..', '..', 'jwt_secret.key')
        
        # Se o arquivo não existir, gera uma nova chave
        if not os.path.exists(secret_key_path):
            secret_key = os.urandom(32).hex()
            # Salva a chave gerada
            with open(secret_key_path, 'w') as f:
                f.write(secret_key)
        else:
            # Lê a chave existente
            with open(secret_key_path, 'r') as f:
                secret_key = f.read().strip()
    
    return secret_key

# Gera ou recupera a chave secreta
SECRET_KEY = generate_secret_key()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Cria um token de acesso JWT
    """
    to_encode = data.copy()
    
    # Define o tempo de expiração
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    
    # Codifica o token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

def decode_token(token: str):
    """
    Decodifica e valida um token JWT
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None