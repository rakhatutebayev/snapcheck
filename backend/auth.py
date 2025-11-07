from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from .schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from .utils.security import hash_password, verify_password, create_access_token
from .email_service import EmailService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Проверка, не существует ли пользователь
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Создание пользователя
    hashed_password = hash_password(user.password)
    # Используем переданную роль, если она есть, иначе "user" по умолчанию
    role = getattr(user, 'role', 'user') or 'user'
    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=hashed_password,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Отправить email уведомление о регистрации
    try:
        email_service = EmailService(db)
        user_full_name = f"{db_user.first_name} {db_user.last_name}"
        email_service.send_registration_notification(db_user.email, user_full_name)
    except Exception as e:
        print(f"Failed to send registration email: {e}")
        # Не падаем, если email не отправился
    
    return db_user

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Поиск пользователя
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Проверка пароля
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Создание токена
    access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role})
    return TokenResponse(access_token=access_token, role=db_user.role)
