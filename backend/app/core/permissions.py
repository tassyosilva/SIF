from functools import wraps
from fastapi import HTTPException, status, Depends
from typing import List

from ..models.user import UserType
from ..api.endpoints.auth import get_current_user

def role_required(allowed_roles: List[UserType]):
    """
    Decorator para verificar permissões de usuário
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user = get_current_user(*[dep for dep in args if hasattr(dep, 'login')])
            
            if user.tipo_usuario not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Você não tem permissão para acessar este recurso"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator