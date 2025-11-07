"""
Email settings API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import json
import secrets
import os
import time
import base64
import hashlib

from database import get_db
from utils.security import get_current_user
from email_models import EmailSettings, EmailLog
from email_service import EmailService
from models import User


router = APIRouter(prefix="/admin/email", tags=["email-settings"])


# In-memory store for PKCE state -> code_verifier (with short TTL)
# NOTE: For production, replace with Redis or another shared store
_OAUTH_STATE_STORE: dict[str, dict] = {}
_OAUTH_STATE_TTL_SECONDS = 10 * 60  # 10 minutes


def _cleanup_state_store():
    """Remove expired state entries"""
    now = time.time()
    to_delete = [k for k, v in _OAUTH_STATE_STORE.items() if now - v.get("created_at", 0) > _OAUTH_STATE_TTL_SECONDS]
    for k in to_delete:
        _OAUTH_STATE_STORE.pop(k, None)


# ============================================================================
# Pydantic Models
# ============================================================================

class EmailSettingsCreate(BaseModel):
    provider: str  # smtp, office365, google
    
    # OAuth2 (для office365 и google) — больше не обязательно хранить в БД
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    
    # SMTP
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    use_tls: bool = True
    
    # От кого
    from_email: EmailStr
    from_name: str = "SnapCheck System"
    
    # Кому отправлять уведомления
    notification_recipients: List[EmailStr]
    
    # Настройки уведомлений
    notifications_enabled: bool = True
    notify_on_registration: bool = True
    notify_on_completion: bool = True


class EmailSettingsResponse(BaseModel):
    id: int
    provider: str
    from_email: str
    from_name: str
    notification_recipients: List[str]
    notifications_enabled: bool
    notify_on_registration: bool
    notify_on_completion: bool
    is_verified: bool
    last_test_at: Optional[datetime] = None
    
    # OAuth status (не возвращаем токены!)
    has_oauth_configured: bool
    oauth_expires_at: Optional[datetime] = None
    effective_client_id: Optional[str] = None
    ready_for_oauth: bool = False
    stored_client_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class TestEmailRequest(BaseModel):
    test_recipient: EmailStr


class OAuth2InitRequest(BaseModel):
    redirect_uri: str


class SetClientIdRequest(BaseModel):
    provider: str  # office365 or google
    client_id: str


# ============================================================================
# Helper Functions
# ============================================================================

def get_oauth_authorize_url(provider: str, client_id: str, redirect_uri: str, state: str) -> str:
    """Получить URL для OAuth авторизации"""
    if provider == "office365":
        # PKCE params are appended by caller
        return (
            f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
            f"?client_id={client_id}"
            f"&response_type=code"
            f"&redirect_uri={redirect_uri}"
            f"&scope=https://graph.microsoft.com/Mail.Send%20offline_access"
            f"&state={state}"
            f"&prompt=consent"
        )
    elif provider == "google":
        # PKCE params are appended by caller
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={client_id}"
            f"&response_type=code"
            f"&redirect_uri={redirect_uri}"
            f"&scope=https://www.googleapis.com/auth/gmail.send"
            f"&access_type=offline"
            f"&prompt=consent"
            f"&state={state}"
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _generate_pkce_pair():
    """Generate code_verifier and S256 code_challenge"""
    code_verifier = _b64url(os.urandom(32))
    code_challenge = _b64url(hashlib.sha256(code_verifier.encode("ascii")).digest())
    return code_verifier, code_challenge


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/settings", response_model=Optional[EmailSettingsResponse])
async def get_email_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить текущие настройки email"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings = db.query(EmailSettings).first()
    if not settings:
        return None
    
    recipients = json.loads(settings.notification_recipients or "[]")
    
    return EmailSettingsResponse(
        id=settings.id,
        provider=settings.provider,
        from_email=settings.from_email,
        from_name=settings.from_name,
        notification_recipients=recipients,
        notifications_enabled=settings.notifications_enabled,
        notify_on_registration=settings.notify_on_registration,
        notify_on_completion=settings.notify_on_completion,
        is_verified=settings.is_verified,
        last_test_at=settings.last_test_at,
        has_oauth_configured=bool(settings.access_token),
        oauth_expires_at=settings.token_expires_at,
        effective_client_id=(settings.client_id or (os.getenv("MICROSOFT_CLIENT_ID") if settings.provider=="office365" else os.getenv("GOOGLE_CLIENT_ID") if settings.provider=="google" else None)),
        ready_for_oauth=(settings.provider in ["office365","google"] and bool(settings.client_id or (os.getenv("MICROSOFT_CLIENT_ID") if settings.provider=="office365" else os.getenv("GOOGLE_CLIENT_ID") if settings.provider=="google" else None))),
        stored_client_id=settings.client_id
    )


@router.post("/settings")
async def create_or_update_email_settings(
    settings_data: EmailSettingsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать или обновить настройки email"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Валидация
    if settings_data.provider not in ["smtp", "office365", "google"]:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    if settings_data.provider == "smtp":
        if not all([settings_data.smtp_host, settings_data.smtp_port, 
                   settings_data.smtp_username, settings_data.smtp_password]):
            raise HTTPException(status_code=400, detail="SMTP settings incomplete")
    
    # Для OAuth провайдеров теперь не требуем client_id/secret — они берутся из окружения
    
    # Получить или создать настройки
    settings = db.query(EmailSettings).first()
    if not settings:
        settings = EmailSettings()
        db.add(settings)
    
    # Обновить поля
    settings.provider = settings_data.provider
    settings.from_email = settings_data.from_email
    settings.from_name = settings_data.from_name
    settings.notification_recipients = json.dumps(settings_data.notification_recipients)
    settings.notifications_enabled = settings_data.notifications_enabled
    settings.notify_on_registration = settings_data.notify_on_registration
    settings.notify_on_completion = settings_data.notify_on_completion
    
    if settings_data.provider == "smtp":
        settings.smtp_host = settings_data.smtp_host
        settings.smtp_port = settings_data.smtp_port
        settings.smtp_username = settings_data.smtp_username
        settings.smtp_password = settings_data.smtp_password
        settings.use_tls = settings_data.use_tls
        settings.is_verified = True  # Для SMTP считаем сразу верифицированным
    
    if settings_data.provider in ["office365", "google"]:
        # Сохраняем, только если были переданы (опционально). В противном случае используем ENV.
        settings.client_id = settings_data.client_id or settings.client_id
        settings.client_secret = settings_data.client_secret or settings.client_secret
        # OAuth токены будут получены через отдельный flow (PKCE)
    
    db.commit()
    db.refresh(settings)
    
    return {"status": "success", "message": "Email settings saved"}


@router.post("/oauth/init")
async def init_oauth_flow(
    request_data: OAuth2InitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Инициировать OAuth2 авторизацию"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings = db.query(EmailSettings).first()
    if not settings or settings.provider not in ["office365", "google"]:
        raise HTTPException(status_code=400, detail="OAuth provider not configured")
    
    # Получить client_id из БД или переменных окружения
    env_client_id = None
    if settings.provider == "office365":
        env_client_id = os.getenv("MICROSOFT_CLIENT_ID")
    elif settings.provider == "google":
        env_client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_id = settings.client_id or env_client_id
    if not client_id:
        raise HTTPException(status_code=400, detail="Client ID not configured (ENV or DB)")
    
    # Генерировать state для защиты от CSRF
    state = secrets.token_urlsafe(32)
    # Сгенерировать PKCE пару и сохранить code_verifier по state
    code_verifier, code_challenge = _generate_pkce_pair()
    _cleanup_state_store()
    _OAUTH_STATE_STORE[state] = {
        "code_verifier": code_verifier,
        "redirect_uri": request_data.redirect_uri,
        "created_at": time.time(),
    }

    base_auth_url = get_oauth_authorize_url(
        settings.provider,
        client_id,
        request_data.redirect_uri,
        state
    )
    # Добавить PKCE параметры
    auth_url = (
        f"{base_auth_url}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
    )

    return {"auth_url": auth_url, "state": state}


@router.get("/oauth/debug")
async def oauth_debug(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Debug endpoint to inspect current OAuth configuration resolution.
    Returns provider, stored client_id, env client id, and readiness flags.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    settings = db.query(EmailSettings).first()
    if not settings:
        return {"configured": False, "reason": "No settings row"}

    env_client_id = None
    env_client_secret = None
    if settings.provider == "office365":
        env_client_id = os.getenv("MICROSOFT_CLIENT_ID")
        env_client_secret = os.getenv("MICROSOFT_CLIENT_SECRET")
    elif settings.provider == "google":
        env_client_id = os.getenv("GOOGLE_CLIENT_ID")
        env_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

    client_id_effective = settings.client_id or env_client_id

    return {
        "provider": settings.provider,
        "stored_client_id": settings.client_id,
        "stored_client_secret_present": bool(settings.client_secret),
        "env_client_id": env_client_id,
        "env_client_secret_present": bool(env_client_secret),
        "effective_client_id": client_id_effective,
        "ready_for_oauth": settings.provider in ["office365", "google"] and bool(client_id_effective),
        "has_tokens": bool(settings.access_token),
        "token_expires_at": settings.token_expires_at,
    }


@router.post("/oauth/client-id")
async def set_oauth_client_id(
    data: SetClientIdRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Установить/переопределить client_id для OAuth-провайдера без дополнительных валидаций SMTP.
    Требует, чтобы базовые настройки уже были сохранены (строка EmailSettings существует).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if data.provider not in ["office365", "google"]:
        raise HTTPException(status_code=400, detail="Invalid provider for OAuth client id")

    settings = db.query(EmailSettings).first()
    if not settings:
        raise HTTPException(status_code=400, detail="Save base email settings first")

    settings.provider = data.provider
    settings.client_id = data.client_id.strip()
    db.commit()
    db.refresh(settings)

    return {"status": "success", "message": "Client ID updated", "provider": settings.provider}


@router.get("/oauth/callback")
async def oauth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """OAuth2 callback endpoint"""
    import requests
    
    settings = db.query(EmailSettings).first()
    if not settings:
        raise HTTPException(status_code=400, detail="Email settings not found")
    
    # Проверка и получение PKCE code_verifier и redirect_uri
    _cleanup_state_store()
    state_entry = _OAUTH_STATE_STORE.pop(state, None)
    if not state_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired state")
    code_verifier = state_entry.get("code_verifier")
    redirect_uri = state_entry.get("redirect_uri")
    
    try:
        # Обменять code на токены
        # Получить client_id и при наличии client_secret из ENV/DB
        env_client_id = os.getenv("MICROSOFT_CLIENT_ID") if settings.provider == "office365" else os.getenv("GOOGLE_CLIENT_ID")
        client_id = settings.client_id or env_client_id
        if not client_id:
            raise HTTPException(status_code=400, detail="Client ID not configured (ENV or DB)")

        client_secret = settings.client_secret or (
            os.getenv("MICROSOFT_CLIENT_SECRET") if settings.provider == "office365" else os.getenv("GOOGLE_CLIENT_SECRET")
        )

        if settings.provider == "office365":
            token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
            data = {
                "client_id": client_id,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
                "code_verifier": code_verifier,
            }
            # Для confidential клиента добавим secret, если он задан
            if client_secret:
                data["client_secret"] = client_secret
        elif settings.provider == "google":
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "client_id": client_id,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
                "code_verifier": code_verifier,
            }
            if client_secret:
                data["client_secret"] = client_secret
        else:
            raise HTTPException(status_code=400, detail="Invalid provider")
        
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        token_data = response.json()
        
        # Сохранить токены
        settings.access_token = token_data.get("access_token")
        settings.refresh_token = token_data.get("refresh_token")
        
        expires_in = token_data.get("expires_in", 3600)
        from datetime import timedelta
        settings.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        settings.is_verified = True
        
        db.commit()
        
        return {
            "status": "success",
            "message": "OAuth authorization successful"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"OAuth callback failed: {str(e)}"
        )


@router.post("/test")
async def send_test_email(
    test_data: TestEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить тестовое письмо"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    email_service = EmailService(db)
    success, message = email_service.send_test_email(test_data.test_recipient)
    
    if success:
        return {"status": "success", "message": message}
    else:
        raise HTTPException(status_code=500, detail=message)


@router.get("/logs")
async def get_email_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить лог отправленных email"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logs = db.query(EmailLog).order_by(EmailLog.sent_at.desc()).limit(limit).all()
    
    return {
        "status": "success",
        "logs": [
            {
                "id": log.id,
                "recipient": log.recipient,
                "subject": log.subject,
                "event_type": log.event_type,
                "status": log.status,
                "error_message": log.error_message,
                "sent_at": log.sent_at
            }
            for log in logs
        ]
    }


@router.delete("/settings")
async def delete_email_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить настройки email"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings = db.query(EmailSettings).first()
    if settings:
        db.delete(settings)
        db.commit()
    
    return {"status": "success", "message": "Email settings deleted"}
