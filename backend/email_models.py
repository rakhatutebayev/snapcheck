"""
Email notification models
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base


class EmailSettings(Base):
    """Настройки email для уведомлений"""
    __tablename__ = "email_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Провайдер: office365, google, smtp
    provider = Column(String(50), nullable=False, default="smtp")
    
    # OAuth2 данные (для Office365 и Google)
    client_id = Column(String(255), nullable=True)
    client_secret = Column(Text, nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    
    # SMTP данные (для обычного SMTP)
    smtp_host = Column(String(255), nullable=True)
    smtp_port = Column(Integer, nullable=True)
    smtp_username = Column(String(255), nullable=True)
    smtp_password = Column(String(255), nullable=True)
    use_tls = Column(Boolean, default=True)
    
    # От кого отправлять
    from_email = Column(String(255), nullable=False)
    from_name = Column(String(255), nullable=True, default="SnapCheck System")
    
    # Кому отправлять уведомления (JSON list)
    notification_recipients = Column(Text, nullable=True)  # JSON array of emails
    
    # Включены ли уведомления
    notifications_enabled = Column(Boolean, default=False)
    
    # События для уведомлений
    notify_on_registration = Column(Boolean, default=True)
    notify_on_completion = Column(Boolean, default=True)
    
    # Системная информация
    is_verified = Column(Boolean, default=False)
    last_test_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class EmailLog(Base):
    """Лог отправленных email"""
    __tablename__ = "email_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    event_type = Column(String(50), nullable=False)  # registration, completion, test
    status = Column(String(50), nullable=False)  # success, failed
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, server_default=func.now())
