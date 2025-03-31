from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr, BaseModel
from typing import List, Dict, Any
import os
from ..config import settings

# Configurações para o envio de e-mail
email_conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "cyberlab@policiacivil.rr.gov.br"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "sua_senha_de_app"),
    MAIL_FROM=os.getenv("MAIL_FROM", "cyberlab@policiacivil.rr.gov.br"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Sistema de Identificação Facial"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

class EmailSchema(BaseModel):
    email: List[EmailStr]
    subject: str
    body: Dict[str, Any]
    template_name: str = "email_template.html"

# Inicialização do objeto FastMail
fm = FastMail(email_conf)