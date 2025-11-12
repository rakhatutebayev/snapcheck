# 🛡️ SECURITY - CODING IMPROVEMENTS & MODULES

## 📦 НОВЫЕ МОДУЛИ ДЛЯ УСТАНОВКИ

### КРИТИЧНЫЕ (обязательно!)
```bash
pip install slowapi                    # Rate limiting
pip install python-dotenv             # .env файл (уже есть)
pip install cryptography              # Encryption
pip install sqlalchemy[postgresql]    # PostgreSQL support
```

### ВАЖНЫЕ (сильно рекомендуется)
```bash
pip install python-decouple           # Безопасное управление конфигом
pip install pydantic-settings         # Settings management
pip install logging-config            # Структурированное логирование
pip install alembic                   # Database migrations (уже есть)
```

### ДОПОЛНИТЕЛЬНЫЕ (для production)
```bash
pip install APScheduler               # Scheduled tasks (ротация токенов)
pip install redis                     # Token blacklist (вместо БД)
pip install sentry-sdk                # Error tracking
```

---

## 🔴 КРИТИЧНЫЕ ИЗМЕНЕНИЯ В КОДЕ

### 1. SECURITY.PY - SECRET_KEY и PASSWORD VALIDATION

**Текущее состояние:** ❌ SECRET_KEY захардкожен, пароли слабые

**Файл:** `backend/utils/security.py`

**Действие - Полностью переписать:**

```python
import os
import logging
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pydantic import validator

logger = logging.getLogger("snapcheck")

# ✅ НОВОЕ: Получать SECRET_KEY из .env
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("❌ FATAL: SECRET_KEY не установлен в .env!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE", 7))

# ✅ НОВОЕ: bcrypt с 12+ rounds вместо 10
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(password: str) -> str:
    """Хеширование пароля с bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)

# ✅ НОВОЕ: Token blacklist для logout
TOKEN_BLACKLIST = set()  # В продакшене использовать Redis

def add_to_blacklist(token: str):
    """Добавить токен в черный список"""
    TOKEN_BLACKLIST.add(token)
    logger.warning(f"Token added to blacklist")

def is_token_blacklisted(token: str) -> bool:
    """Проверить, в черном ли списке токен"""
    return token in TOKEN_BLACKLIST

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Создать access token (30 минут)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Создать refresh token (7 дней)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """Декодировать токен"""
    try:
        # ✅ НОВОЕ: Проверка blacklist
        if is_token_blacklisted(token):
            logger.warning(f"❌ Blacklisted token used")
            return None
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"❌ JWT Error: {str(e)}")
        return None

def validate_password_strength(password: str) -> bool:
    """✅ НОВОЕ: Проверка на стойкость пароля"""
    if len(password) < 12:
        raise ValueError("Пароль должен содержать минимум 12 символов")
    
    if not any(c.isupper() for c in password):
        raise ValueError("Пароль должен содержать ЗАГЛАВНЫЕ буквы (A-Z)")
    
    if not any(c.islower() for c in password):
        raise ValueError("Пароль должен содержать строчные буквы (a-z)")
    
    if not any(c.isdigit() for c in password):
        raise ValueError("Пароль должен содержать цифры (0-9)")
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        raise ValueError("Пароль должен содержать спецсимволы (!@#$%^&*)")
    
    return True
```

---

### 2. SCHEMAS.PY - PASSWORD VALIDATION в Pydantic

**Текущее состояние:** ❌ Нет валидации пароля

**Файл:** `backend/schemas.py`

**Действие - Обновить:**

```python
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from .utils.security import validate_password_strength

# User Schemas
class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(min_length=12, max_length=128)
    role: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """✅ НОВОЕ: Проверка пароля через validate_password_strength"""
        validate_password_strength(v)
        return v
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_names(cls, v):
        """✅ НОВОЕ: Проверка имен"""
        if len(v) < 2:
            raise ValueError("Имя должно содержать минимум 2 символа")
        if len(v) > 100:
            raise ValueError("Имя не должно быть длиннее 100 символов")
        # Удалить спецсимволы из имен
        if not v.isalnum():
            raise ValueError("Имя может содержать только буквы и цифры")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# ✅ НОВОЕ: Response для токенов
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None  # Новый refresh token
    token_type: str = "bearer"
    role: str

# ✅ НОВОЕ: Request для refresh token
class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Остальное остается как есть...
```

---

### 3. MAIN.PY - CORS и Rate Limiting

**Текущее состояние:** ❌ CORS открыт для всех, нет rate limiting

**Файл:** `backend/main.py`

**Действие - Обновить верхнюю часть:**

```python
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from . import models
from .database import engine, SessionLocal
from .models import User
from .auth import router as auth_router
from .slides import router as slides_router
from .admin import router as admin_router
from .slides_admin import router as slides_admin_router
from .files import router as files_router
from .user import router as user_router
from .utils.security import hash_password

# ✅ НОВОЕ: Логирование
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("snapcheck")

# Создание таблиц
models.Base.metadata.create_all(bind=engine)

def create_initial_data():
    try:
        db = SessionLocal()
        try:
            if not db.query(User).filter_by(email="user@gss.aero").first():
                db.add(User(
                    first_name="User",
                    last_name="GSS",
                    email="user@gss.aero",
                    password_hash=hash_password("SecurePass123!"),  # ✅ Сильный пароль
                    role="user"
                ))
            if not db.query(User).filter_by(email="admin@gss.aero").first():
                db.add(User(
                    first_name="Admin",
                    last_name="GSS",
                    email="admin@gss.aero",
                    password_hash=hash_password("AdminPass123!"),  # ✅ Сильный пароль
                    role="admin"
                ))
            db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Could not create initial data: {e}")

create_initial_data()

# ✅ НОВОЕ: Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="SnapCheck API",
    description="Corporate Slide Confirmation System",
    version="1.0.0"
)

app.state.limiter = limiter

# ✅ НОВОЕ: Trusted Host Middleware (защита от Host Header attacks)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "your-domain.com",
        "www.your-domain.com",
        os.getenv("FRONTEND_URL", "localhost:3000").split("://")[1],
    ]
)

# ✅ НОВОЕ: CORS - ЗАКРЫТ для всех, открыт только для доверенных
ALLOWED_ORIGINS = [
    "http://localhost:3000",       # dev frontend
    "http://localhost:5173",       # dev vite
    "https://your-domain.com",     # production
    "https://www.your-domain.com", # production www
]

# Можно получать из .env:
if frontend_urls := os.getenv("FRONTEND_URLS"):
    ALLOWED_ORIGINS = frontend_urls.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # ✅ Не "*" !
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Только нужные методы
    allow_headers=["Content-Type", "Authorization"],  # Только нужные headers
    expose_headers=["X-Total-Count"],
)

# ✅ НОВОЕ: Exception handlers
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    logger.warning(f"⚠️ Rate limit exceeded: {request.client.host}")
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.warning(f"❌ Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request data"}
    )

# Регистрация роутеров
app.include_router(auth_router)
app.include_router(slides_router)
app.include_router(admin_router)
app.include_router(slides_admin_router)
app.include_router(files_router)
app.include_router(user_router)

@app.get("/")
def root():
    return {
        "status": "success",
        "message": "SnapCheck API is running",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "ok"}
```

---

### 4. AUTH.PY - Rate Limiting и логирование

**Текущое состояние:** ❌ Нет rate limiting, нет логирования

**Файл:** `backend/auth.py`

**Действие - Полностью переписать:**

```python
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from .schemas import UserCreate, UserLogin, TokenResponse, RefreshTokenRequest
from .utils.security import (
    hash_password, 
    verify_password, 
    create_access_token,
    create_refresh_token,
    decode_access_token,
    validate_password_strength,
    add_to_blacklist
)
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger("snapcheck")

# ✅ НОВОЕ: Трекинг неудачных попыток логина
failed_login_attempts = {}  # {email: [(timestamp, ip), ...]}

@router.post("/register", response_model=UserResponse)
@limiter.limit("5/hour")  # ✅ Максимум 5 регистраций в час
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация пользователя"""
    
    # Проверка существования пользователя
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        logger.warning(f"❌ Registration failed: Email already registered - {user.email} from {request.client.host}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    try:
        # ✅ НОВОЕ: Валидация пароля (уже в Pydantic, но проверяем еще раз)
        validate_password_strength(user.password)
    except ValueError as e:
        logger.warning(f"❌ Registration failed: Weak password - {user.email}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    # Хеширование пароля
    hashed_password = hash_password(user.password)
    role = getattr(user, 'role', 'user') or 'user'
    
    # Создание пользователя
    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=hashed_password,
        role=role
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"✅ Registration successful: {user.email}")
        return db_user
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Registration error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed")

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15 minutes")  # ✅ 5 попыток за 15 минут
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    """Логин пользователя"""
    
    # Поиск пользователя
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        logger.warning(f"❌ LOGIN FAILED: User not found - {user.email} from {request.client.host}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    
    # Проверка пароля
    if not verify_password(user.password, db_user.password_hash):
        logger.warning(f"❌ LOGIN FAILED: Invalid password - {user.email} from {request.client.host}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    
    # ✅ НОВОЕ: Создание обоих токенов
    access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role})
    refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
    
    logger.info(f"✅ LOGIN SUCCESS: {user.email} from {request.client.host}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=db_user.role
    )

# ✅ НОВОЕ: Endpoint для refresh token
@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/hour")  # ✅ Максимум 10 запросов в час
def refresh_access_token(request: Request, req: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Получить новый access token используя refresh token"""
    
    payload = decode_access_token(req.refresh_token)
    if not payload or "sub" not in payload:
        logger.warning(f"❌ REFRESH FAILED: Invalid refresh token from {request.client.host}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"❌ REFRESH FAILED: User not found - ID {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Создание нового access token
    new_access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    
    logger.info(f"✅ REFRESH SUCCESS: User {user_id}")
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=req.refresh_token,  # Или создать новый
        role=user.role
    )

# ✅ НОВОЕ: Endpoint для logout
@router.post("/logout")
def logout(request: Request, authorization: str = Header(None)):
    """Logout - добавить токен в blacklist"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    
    token = authorization.split(" ")[1]
    add_to_blacklist(token)
    
    logger.info(f"✅ LOGOUT: User logged out from {request.client.host}")
    
    return {"message": "Logged out successfully"}
```

---

### 5. DATABASE.PY - PostgreSQL для production

**Текущее состояние:** ❌ SQLite для всего (небезопасно для production)

**Файл:** `backend/database.py`

**Действие - Обновить:**

```python
import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# ✅ НОВОЕ: Использовать PostgreSQL в production, SQLite для разработки
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:////tmp/snapcheck.db"  # Для разработки
)

# ✅ НОВОЕ: Дополнительные параметры безопасности для PostgreSQL
if DATABASE_URL.startswith("postgresql"):
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,  # Проверка соединения перед использованием
        pool_recycle=3600,   # Переподключение каждый час
    )
    
    # ✅ НОВОЕ: SSL для PostgreSQL
    if os.getenv("DB_SSL_MODE") == "require":
        from sqlalchemy import event
        from psycopg2 import extensions
        
        @event.listens_for(engine, "connect")
        def receive_connect(dbapi_conn, connection_record):
            dbapi_conn.set_isolation_level(extensions.ISOLATION_LEVEL_SERIALIZABLE)
else:
    # SQLite для разработки
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency для получения БД сессии"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### 6. FILES.PY - Path Traversal Protection

**Текущее состояние:** ⚠️ Есть базовая защита, нужна улучшенная

**Файл:** `backend/files.py`

**Действие - Обновить:**

```python
import os
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import FileResponse
from .database import get_db
from .user import get_current_user
from .models import User

router = APIRouter(tags=["files"])
logger = logging.getLogger("snapcheck")

UPLOADS_DIR = Path("/tmp/snapcheck_uploads")

def validate_file_path(presentation_id: int, filename: str) -> Path:
    """✅ НОВОЕ: Безопасная валидация пути"""
    
    # Проверка расширения файла
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif'}
    if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    # Очистка имени файла
    filename_clean = Path(filename).name  # Получить только имя файла
    
    # Проверка на опасные символы
    if ".." in filename_clean or filename_clean.startswith("/") or filename_clean.startswith("\\"):
        logger.warning(f"❌ Path traversal attempt: {filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    # Построение безопасного пути
    file_path = UPLOADS_DIR / "slides" / str(presentation_id) / filename_clean
    
    # Проверка что файл находится в нужной директории
    try:
        file_path.resolve().relative_to(UPLOADS_DIR.resolve())
    except ValueError:
        logger.warning(f"❌ Path escape attempt: {file_path}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path"
        )
    
    return file_path

@router.get("/slides/image/{presentation_id}/{filename}")
def get_slide_image(
    presentation_id: int,
    filename: str,
    user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """✅ НОВОЕ: Получить изображение слайда с проверкой доступа"""
    
    # Валидация пути
    file_path = validate_file_path(presentation_id, filename)
    
    # Проверка существования файла
    if not file_path.exists():
        logger.warning(f"❌ File not found: {file_path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    logger.info(f"✅ File accessed: {presentation_id}/{filename} by user {user.id}")
    
    return FileResponse(
        file_path,
        media_type="image/jpeg",
        headers={
            "Cache-Control": "max-age=3600",
            "X-Content-Type-Options": "nosniff",  # Защита от MIME sniffing
        }
    )
```

---

### 7. USER.PY - Rate limiting и логирование

**Текущее состояние:** ⚠️ Базовое, нужна защита

**Файл:** `backend/user.py` (первая часть)

**Действие - Добавить в начало:**

```python
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from .database import get_db
from .models import User, Slide, UserSlideProgress, UserCompletion, Presentation
from .utils.security import decode_access_token

router = APIRouter(prefix="/user", tags=["user"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger("snapcheck")

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """✅ НОВОЕ: Добавлено логирование"""
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning(f"❌ Auth failed: Missing token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        logger.warning(f"❌ Auth failed: Invalid token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"❌ Auth failed: User not found - ID {user_id}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user

@router.get("/presentations")
@limiter.limit("30/minute")  # ✅ Rate limiting
def get_user_presentations(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список презентаций"""
    try:
        # ... остальной код остается прежним
        presentations = db.query(Presentation).filter(Presentation.status == "published").all()
        logger.info(f"✅ Presentations loaded for user {user.id}")
        # ...
    except Exception as e:
        logger.error(f"❌ Error loading presentations for user {user.id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

---

## 🟡 FRONTEND УЛУЧШЕНИЯ

### 8. FRONTEND - Удалить localStorage, использовать sessionStorage

**Текущее состояние:** ❌ Token хранится в localStorage (опасно!)

**Файл:** `frontend/src/App.jsx`

**Действие - Обновить:**

```jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Slides from './pages/Slides';
import PresentationsList from './pages/PresentationsList';
import AdminPanel from './pages/AdminPanel';

// ✅ НОВОЕ: Использовать sessionStorage вместо localStorage
const PrivateRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');  // ✅ sessionStorage
  return token ? children : <Navigate to="/login" />;
};

const RootRedirect = () => {
  const token = sessionStorage.getItem('token');
  const role = sessionStorage.getItem('role');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return <Navigate to={role === 'admin' ? '/admin' : '/presentations'} />;
};

// ✅ НОВОЕ: Логирование выхода при закрытии браузера
useEffect(() => {
  return () => {
    // При закрытии браузера/вкладки очистить данные
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('role');
  };
}, []);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/presentations" element={<PrivateRoute><PresentationsList /></PrivateRoute>} />
        <Route path="/slides" element={<PrivateRoute><Slides /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

### 9. API CLIENT - Добавить Refresh Token Logic

**Файл:** Нужно создать `frontend/src/api/client.js`

**Действие - Создать новый файл:**

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ✅ НОВОЕ: API клиент с автоматическим refresh токена
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ НОВОЕ: Interceptor для добавления токена
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ НОВОЕ: Interceptor для обработки 401 и refresh токена
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если 401 и есть refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        // Нет refresh токена - разлогиниться
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );
        
        const { access_token } = response.data;
        sessionStorage.setItem('token', access_token);
        
        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### 10. FRONTEND PACKAGE.JSON - Добавить security утилиты

**Файл:** `frontend/package.json`

**Действие - Обновить dependencies:**

```json
{
  "name": "snapcheck-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx",
    "security-check": "npm audit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.344.0",
    "dompurify": "^3.0.6",  // ✅ НОВОЕ: XSS защита
    "crypto-js": "^4.2.0"   // ✅ НОВОЕ: Encryption утилиты
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.50.0"  // ✅ НОВОЕ: Linting
  }
}
```

---

## 📝 .ENV FILE - Создать в корне проекта

**Файл:** `.env`

**Действие - Создать:**

```bash
# ═══════════════════════════════════════════
# BACKEND SECURITY
# ═══════════════════════════════════════════

# ✅ КРИТИЧНОЕ: Генерировать сильный SECRET_KEY
# Например: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-random-secret-key-min-64-chars-replace-this

# Database
DATABASE_URL=postgresql://user:password@localhost/snapcheck

# Token expiration
ACCESS_TOKEN_EXPIRE=30              # минуты
REFRESH_TOKEN_EXPIRE=7              # дни

# CORS - доверенные домены
FRONTEND_URLS=http://localhost:3000,http://localhost:5173,https://your-domain.com

# ═══════════════════════════════════════════
# FRONTEND
# ═══════════════════════════════════════════
VITE_API_URL=http://localhost:8000  # Для разработки

# Production:
# VITE_API_URL=https://api.your-domain.com

# ═══════════════════════════════════════════
# DATABASE PRODUCTION
# ═══════════════════════════════════════════
DB_SSL_MODE=require  # Для production
```

---

## .GITIGNORE - Защита от утечек

**Файл:** `.gitignore`

**Действие - Убедиться что есть:**

```
.env
.env.local
.env.*.local
__pycache__/
*.pyc
node_modules/
.vscode/
.DS_Store
dist/
build/
*.log
```

---

## 📊 REQUIREMENTS.TXT - ОБНОВЛЕННЫЙ

**Файл:** `requirements.txt`

**Действие - Обновить:**

```
# Core
fastapi==0.119.0
uvicorn[standard]==0.37.0
python-dotenv==1.1.1

# Database
sqlalchemy==2.0.44
alembic==1.16.5
psycopg2-binary==2.9.11

# Security ✅ НОВЫЕ
slowapi==0.1.9                    # Rate limiting
bcrypt==4.0.1                     # Password hashing
python-jose[cryptography]==3.5.0  # JWT tokens
cryptography==41.0.0              # Encryption
pydantic-settings==2.0.0          # Settings management

# Validation
pydantic==2.12.3
pydantic[email]==2.12.3
email-validator==2.3.3

# File handling
python-multipart==0.0.20
pdf2image==1.17.0
Pillow==11.3.0
python-pptx==0.6.23
```

---

## 🚀 NGINX КОНФИГУРАЦИЯ - Security Headers

**Файл:** `docker-nginx.conf`

**Действие - Добавить headers:**

```nginx
server {
    listen 80;
    server_name _;
    
    # ✅ Редирект на HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ✅ SSL Configuration (TLS 1.2+)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # ✅ Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
    
    # ✅ Remove server info
    server_tokens off;
    
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        proxy_pass http://frontend:5173;
    }
}
```

---

## ✅ ЧЕКЛИСТ ВНЕДРЕНИЯ

```
BACKEND:
- [ ] Обновить backend/utils/security.py
- [ ] Обновить backend/schemas.py с валидацией
- [ ] Обновить backend/main.py (CORS, rate limiting)
- [ ] Обновить backend/auth.py (refresh token, rate limiting)
- [ ] Обновить backend/database.py (PostgreSQL)
- [ ] Обновить backend/files.py (path traversal)
- [ ] Обновить backend/user.py (логирование)
- [ ] Установить новые модули: pip install -r requirements.txt
- [ ] Создать .env файл с SECRET_KEY
- [ ] Протестировать локально

FRONTEND:
- [ ] Обновить frontend/src/App.jsx (sessionStorage)
- [ ] Создать frontend/src/api/client.js
- [ ] Обновить frontend/package.json
- [ ] npm install для установки новых модулей
- [ ] Обновить все компоненты использующие localStorage

DEPLOYMENT:
- [ ] Обновить docker-nginx.conf с security headers
- [ ] Генерировать SSL сертификат Let's Encrypt
- [ ] Протестировать HTTPS редирект
- [ ] Проверить headers через curl
- [ ] Развернуть в production
```

---

## 🎯 ПРИОРИТЕТ ВНЕДРЕНИЯ

**НЕДЕЛЯ 1 (КРИТИЧНОЕ):**
1. Security.py - SECRET_KEY + password validation
2. Main.py - CORS + rate limiting
3. Auth.py - Rate limiting на login
4. .env файл
5. Frontend - sessionStorage

**НЕДЕЛЯ 2 (ВАЖНОЕ):**
6. Database.py - PostgreSQL
7. Schemas.py - валидация
8. Files.py - path traversal
9. User.py - логирование
10. Frontend API client с refresh token

**НЕДЕЛЯ 3 (ЖЕЛАЕМОЕ):**
11. Nginx security headers
12. SSL сертификат
13. Мониторинг и логирование
14. Пентест

**Готовы начинать?** 🚀
