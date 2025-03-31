import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from ..config import settings
from typing import List, Optional

logger = logging.getLogger(__name__)

async def send_welcome_email(
    email_to: str,
    username: str,
    password: str = None
) -> bool:
    """
    Envia um e-mail de boas-vindas ao novo usuário.
    
    Args:
        email_to: E-mail do destinatário
        username: Nome de usuário
        password: Senha (opcional, apenas para novos usuários)
        
    Returns:
        bool: True se o e-mail foi enviado com sucesso, False caso contrário
    """
    # Configurações do e-mail
    sender_email = settings.MAIL_USERNAME
    sender_password = settings.MAIL_PASSWORD
    
    # Criar mensagem
    msg = MIMEMultipart()
    msg['From'] = settings.MAIL_FROM
    msg['To'] = email_to
    msg['Subject'] = "Bem-vindo ao Sistema de Identificação Facial"
    
    # Seção de senha (condicional)
    password_section = f"""
    <p><strong>Senha:</strong> {password}</p>
    <p style="color: #D4AF37; font-weight: bold;">Por favor, altere sua senha após o primeiro acesso.</p>
    """ if password else ""
    
    # HTML do e-mail
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Bem-vindo ao Sistema de Identificação Facial</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px; }}
            .header {{ background-color: #000; color: #D4AF37; padding: 10px 20px; text-align: center; border-radius: 5px 5px 0 0; margin: -20px -20px 20px; }}
            .footer {{ margin-top: 30px; text-align: center; font-size: 12px; color: #666; }}
            .credential-box {{ background-color: #f8f8f8; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Sistema de Identificação Facial</h1>
            </div>
            <h2>Olá, {username}!</h2>
            <p>Sua conta foi criada com sucesso.</p>
            <p>Seguem suas informações de acesso ao sistema:</p>
            <div class="credential-box">
                <p><strong>Login:</strong> {username}</p>
                {password_section}
            </div>
            <p>Para acessar o sistema, clique no link abaixo:</p>
            <p><a href="http://192.168.4.2">Acessar o Sistema</a></p>
            <p>Em caso de dúvidas, entre em contato com o administrador do sistema.</p>
            <div class="footer">
                <p>Este é um e-mail automático. Por favor, não responda.</p>
                <p>&copy; 2025 Sistema de Identificação Facial. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Anexar o conteúdo HTML
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        # Conectar ao servidor SMTP
        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        server.starttls()
        
        # Login
        server.login(sender_email, sender_password)
        
        # Enviar e-mail
        server.sendmail(sender_email, email_to, msg.as_string())
        
        # Encerrar conexão
        server.quit()
        
        logger.info(f"E-mail enviado para {email_to}")
        return True
    
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail: {str(e)}")
        return False