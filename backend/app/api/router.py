from fastapi import APIRouter
from .endpoints import persons, recognition, settings
from .endpoints import users
from .endpoints import auth

api_router = APIRouter()

api_router.include_router(persons.router, prefix="/persons", tags=["persons"])
api_router.include_router(recognition.router, prefix="/recognition", tags=["recognition"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
