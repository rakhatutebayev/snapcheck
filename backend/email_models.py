"""
Email notification models
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base


class EmailSettings(Base):
    """Настройки SMTP для отправки уведомлений"""
    __tablename__ = "email_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # SMTP Server Configuration
    smtp_host = Column(String(255), nullable=False)
    smtp_port = Column(Integer, nullable=False, default=587)
    
    # Security: ssl, tls, starttls, none
    encryption = Column(String(50), nullable=False, default="tls")
    
    # SMTP Authentication
    smtp_username = Column(String(255), nullable=False)
    smtp_password = Column(Text, nullable=False)
    
    # From settings
    from_email = Column(String(255), nullable=False)
    from_name = Column(String(255), nullable=True, default="SnapCheck System")
    
    # Notifications configuration
    notifications_enabled = Column(Boolean, default=False)
    notify_on_registration = Column(Boolean, default=True)
    notify_on_completion = Column(Boolean, default=True)
    
    # System info
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


class NotificationAdmin(Base):
    """Админы для получения уведомлений"""
    __tablename__ = "notification_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    receive_registration_notifications = Column(Boolean, default=True)
    receive_completion_notifications = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
