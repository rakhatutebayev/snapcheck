from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
import secrets
from .database import get_db
from .models import User
from .schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from .utils.security import hash_password, verify_password, create_access_token, get_current_user
from .email_service import EmailService

router = APIRouter(prefix="/auth", tags=["auth"])

# Additional schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    token: str

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Проверка, не существует ли пользователь
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Создание пользователя
    hashed_password = hash_password(user.password)
    role = getattr(user, 'role', 'user') or 'user'
    
    # Генерация токена верификации
    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.utcnow() + timedelta(hours=24)
    
    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=hashed_password,
        role=role,
        is_verified=False,
        verification_token=verification_token,
        verification_token_expires=verification_expires
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Отправить email с ссылкой верификации
    try:
        email_service = EmailService(db)
        user_full_name = f"{db_user.first_name} {db_user.last_name}"
        email_service.send_verification_email(db_user.email, user_full_name, verification_token)
        
        # Также отправить уведомление админам
        email_service.send_registration_notification(db_user.email, user_full_name)
    except Exception as e:
        print(f"Failed to send registration email: {e}")
    
    return db_user

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Поиск пользователя
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Проверка верификации email
    if not db_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Email not verified. Please check your email for verification link."
        )
    
    # Проверка пароля
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Создание токена
    access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role})
    return TokenResponse(access_token=access_token, role=db_user.role)


@router.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Верификация email по токену"""
    user = db.query(User).filter(User.verification_token == request.token).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    if user.verification_token_expires < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification token expired")
    
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
def resend_verification(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Повторная отправка письма с верификацией"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Не раскрываем, существует ли пользователь
        return {"message": "If the email exists, verification link has been sent"}
    
    if user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified")
    
    # Генерация нового токена
    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.utcnow() + timedelta(hours=24)
    
    user.verification_token = verification_token
    user.verification_token_expires = verification_expires
    db.commit()
    
    # Отправка email
    try:
        email_service = EmailService(db)
        user_full_name = f"{user.first_name} {user.last_name}"
        email_service.send_verification_email(user.email, user_full_name, verification_token)
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send email")
    
    return {"message": "Verification email sent"}


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Запрос на восстановление пароля"""
    user = db.query(User).filter(User.email == request.email).first()
    
    # Всегда возвращаем успех, не раскрывая существование пользователя
    if not user:
        return {"message": "If the email exists, password reset link has been sent"}
    
    # Генерация токена сброса пароля
    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.utcnow() + timedelta(hours=1)
    
    user.reset_token = reset_token
    user.reset_token_expires = reset_expires
    db.commit()
    
    # Отправка email
    try:
        email_service = EmailService(db)
        user_full_name = f"{user.first_name} {user.last_name}"
        email_service.send_password_reset_email(user.email, user_full_name, reset_token)
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
    
    return {"message": "If the email exists, password reset link has been sent"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Сброс пароля по токену"""
    user = db.query(User).filter(User.reset_token == request.token).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")
    
    if user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token expired")
    
    # Обновление пароля
    user.password_hash = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Изменение пароля авторизованным пользователем"""
    # Проверка текущего пароля
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    
    # Обновление пароля
    current_user.password_hash = hash_password(request.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
