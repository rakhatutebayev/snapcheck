# 🚀 ПЛАН ДЕЙСТВИЙ ДЛЯ УЛУЧШЕНИЯ SECURITY

## 📋 СТАТУС: ЧТО УЖЕ ЕСТЬ ✅

```
✅ JWT tokens (базовые)
✅ bcrypt для хеша паролей
✅ CORS middleware
✅ FastAPI приложение
✅ Модели БД
```

## 🔴 КРИТИЧНЫЕ ПРОБЛЕМЫ (сделать первым!)

### 1. CORS открыт для всех (`allow_origins=["*"]`) 🚨
**Статус:** КРИТИЧНО  
**Файл:** `backend/main.py` (строка 58)  
**Проблема:** Любой сайт может запрашивать ваш API  
**Действие:**
```python
# ❌ БЫЛО:
allow_origins=["*"]

# ✅ ДОЛЖНО БЫТЬ:
allow_origins=[
    "http://localhost:3000",       # dev frontend
    "http://localhost:5173",       # dev vite
    "https://your-domain.com",     # production
    "https://www.your-domain.com", # production www
]
```

---

### 2. ACCESS_TOKEN_EXPIRE_MINUTES = 1440 (24 часа) 🚨
**Статус:** КРИТИЧНО  
**Файл:** `backend/utils/security.py` (строка 6)  
**Проблема:** Украденный токен действует сутки  
**Действие:**
```python
# ❌ БЫЛО:
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 часа

# ✅ ДОЛЖНО БЫТЬ:
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 минут
REFRESH_TOKEN_EXPIRE_DAYS = 7     # 7 дней
```

---

### 3. SECRET_KEY захардкожен 🚨
**Статус:** КРИТИЧНО  
**Файл:** `backend/utils/security.py` (строка 5)  
**Проблема:** Secret в коде видно в GitHub  
**Действие:**
```python
# ❌ БЫЛО:
SECRET_KEY = "your-super-secret-key-change-in-production"

# ✅ ДОЛЖНО БЫТЬ:
import os
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY не установлен в .env!")
```

---

### 4. Пароли можно устанавливать как "123456" 🚨
**Статус:** КРИТИЧНО  
**Файл:** `backend/auth.py` и `backend/schemas.py`  
**Проблема:** Нет валидации на пароль  
**Действие:** Добавить в `schemas.py`:
```python
from pydantic import BaseModel, Field, validator

class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=12)  # Минимум 12 символов
    first_name: str
    last_name: str
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Пароль должен содержать ЗАГЛАВНЫЕ буквы')
        if not any(c.islower() for c in v):
            raise ValueError('Пароль должен содержать строчные буквы')
        if not any(c.isdigit() for c in v):
            raise ValueError('Пароль должен содержать цифры')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Пароль должен содержать спецсимволы (!@#$%...)')
        return v
```

---

### 5. Rate limiting не реализован 🚨
**Статус:** КРИТИЧНО  
**Проблема:** Можно перебирать пароли (brute-force)  
**Действие:** Добавить в `backend/main.py`:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# На эндпоинт логина добавить:
@router.post("/login")
@limiter.limit("5/15minutes")  # 5 попыток за 15 минут
def login(...):
    ...
```

---

### 6. Нет логирования попыток логина 🚨
**Статус:** КРИТИЧНО  
**Проблема:** Не видно атак и несанкционированных попыток  
**Действие:** Добавить логирование в `auth.py`:
```python
import logging

logger = logging.getLogger("snapcheck")

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user:
        logger.warning(f"❌ LOGIN FAILED: User not found - {user.email} from {request.client.host}")
        raise HTTPException(...)
    
    if not verify_password(user.password, db_user.password_hash):
        logger.warning(f"❌ LOGIN FAILED: Invalid password - {user.email} from {request.client.host}")
        raise HTTPException(...)
    
    logger.info(f"✅ LOGIN SUCCESS: {user.email} from {request.client.host}")
    access_token = create_access_token(...)
    return TokenResponse(...)
```

---

### 7. Нет HTTPS редиректа 🚨
**Статус:** КРИТИЧНО  
**Проблема:** Пользователи могут случайно открыть HTTP  
**Действие:** Добавить в `docker-nginx.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

---

### 8. Нет защиты от SQL injection 🚨
**Статус:** ВАЖНО  
**Проблема:** Если будут сырые SQL запросы - уязвимость  
**Действие:** Всегда использовать ORM (SQLAlchemy - уже используется ✅)
```python
# ✅ ПРАВИЛЬНО:
user = db.query(User).filter(User.email == user_email).first()

# ❌ НЕПРАВИЛЬНО (никогда так не делайте):
# db.execute(f"SELECT * FROM users WHERE email = '{user_email}'")
```

---

### 9. Нет защиты от XSS в frontend 🚨
**Статус:** ВАЖНО  
**Файл:** `frontend/` компоненты  
**Действие:** Проверить все места где используется `dangerouslySetInnerHTML`:
```javascript
// ❌ ОПАСНО:
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ БЕЗОПАСНО (React автоматически экранирует):
<div>{userInput}</div>
```

---

### 10. Нет HTTPS headers в Nginx 🚨
**Статус:** ВАЖНО  
**Файл:** `docker-nginx.conf`  
**Действие:** Добавить headers:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## 🟡 ВАЖНЫЕ УЛУЧШЕНИЯ (сделать вторым приоритетом)

### 11. Refresh tokens не реализованы
**Статус:** ВАЖНО  
**Файл:** `backend/auth.py`  
**Действие:** Добавить endpoint для refresh:
```python
@router.post("/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_access_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    new_access_token = create_access_token(data={"sub": user_id})
    return {"access_token": new_access_token}
```

---

### 12. Нет .env файла
**Статус:** ВАЖНО  
**Файл:** Нужно создать `.env`  
**Действие:**
```
# .env
SECRET_KEY=your-random-string-min-64-chars
DATABASE_URL=postgresql://user:password@localhost/snapcheck
FRONTEND_URL=https://your-domain.com
JWT_EXPIRATION_MINUTES=30
REFRESH_TOKEN_EXPIRATION_DAYS=7
```

---

### 13. Нет валидации email адреса
**Статус:** ВАЖНО  
**Файл:** `backend/schemas.py`  
**Действие:**
```python
from pydantic import EmailStr

class UserCreate(BaseModel):
    email: EmailStr  # Проверит формат email
    ...
```

---

### 14. Нет rate limiting на API endpoints
**Статус:** ВАЖНО  
**Действие:** Добавить на все публичные endpoints:
```python
@app.get("/user/presentations")
@limiter.limit("100/minute")  # 100 запросов в минуту
def get_presentations(...):
    ...
```

---

### 15. Токен можно перехватить из localStorage
**Статус:** ВАЖНО  
**Файл:** `frontend/` (API интеграция)  
**Действие:** Использовать HttpOnly cookies или sessionStorage:
```javascript
// ❌ ОПАСНО:
localStorage.setItem("token", token)

// ✅ БЕЗОПАСНЕЕ (HttpOnly cookie - на backend):
// Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict

// ✅ ВРЕМЕННОЕ ХРАНИЛИЩЕ:
sessionStorage.setItem("token", token)  // Очищается при закрытии браузера
```

---

## 🟢 ЖЕЛАЕМЫЕ УЛУЧШЕНИЯ (при наличии времени)

### 16. Двухфакторная аутентификация (2FA)
- Использовать TOTP (Time-based One-Time Password)
- Библиотека: `pyotp`

### 17. Логирование в централизованную систему
- CloudWatch, ELK Stack, Datadog

### 18. SSL certificate pinning для мобильного приложения
- Защита от Man-in-the-Middle атак

### 19. Web Application Firewall (WAF)
- CloudFlare, AWS WAF

### 20. Регулярные пентесты
- Проверки безопасности профессионалами

---

## ⏱️ ГРАФИК РЕАЛИЗАЦИИ

```
НЕДЕЛЯ 1 - КРИТИЧНОЕ (3-4 часа):
├─ Исправить CORS
├─ Исправить SECRET_KEY (.env)
├─ Изменить token expiration (30 мин)
├─ Добавить валидацию пароля
└─ Добавить rate limiting на login

НЕДЕЛЯ 2 - ВАЖНОЕ (4-5 часов):
├─ Добавить логирование
├─ Добавить HTTPS redirect
├─ Добавить Security headers
├─ Реализовать refresh tokens
└─ Добавить email валидацию

НЕДЕЛЯ 3 - ЖЕЛАЕМОЕ:
├─ 2FA (если критично)
├─ Centralized logging
└─ Пентест
```

---

## ✅ ЧЕКЛИСТ: ЧТО СДЕЛАТЬ ПРЯМО СЕЙЧАС

- [ ] Открыть `backend/main.py` и исправить CORS
- [ ] Открыть `backend/utils/security.py` и переместить SECRET_KEY в .env
- [ ] Создать `.env` файл в корне проекта
- [ ] Открыть `backend/schemas.py` и добавить валидацию пароля
- [ ] Установить `slowapi` для rate limiting: `pip install slowapi`
- [ ] Добавить rate limiting на `/auth/login`
- [ ] Добавить логирование в `auth.py`
- [ ] Обновить `docker-nginx.conf` с HTTPS headers
- [ ] Протестировать все изменения локально
- [ ] Развернуть на production

---

## 📞 НУЖНА ПОМОЩЬ?

Скажите мне номер проблемы (1-20) и я помогу её решить!

Например:
- "Помогите с #1 (CORS)" → Я покажу точный код
- "Сделайте #5 (Rate limiting)" → Я внесу изменения в файлы
- "Объясните #11 (Refresh tokens)" → Я подробно объясню

**Готовы начинать?** 🚀
