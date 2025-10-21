# Безопасность SnapCheck

Этот документ описывает все аспекты безопасности приложения SnapCheck, включая управление секретами, аутентификацию, защиту базы данных, сетевую безопасность и рекомендации по безопасному деплою.

---

## Содержание

1. [Управление секретами](#управление-секретами)
2. [Аутентификация и авторизация](#аутентификация-и-авторизация)
3. [Безопасность базы данных](#безопасность-базы-данных)
4. [Сетевая безопасность](#сетевая-безопасность)
5. [Безопасность приложения](#безопасность-приложения)
6. [Безопасный деплой](#безопасный-деплой)
7. [Мониторинг и аудит](#мониторинг-и-аудит)
8. [Чек-лист безопасности](#чек-лист-безопасности)

---

## Управление секретами

### 🔴 КРИТИЧНО: Текущие проблемы

**SECRET_KEY захардкожен в коде:**
```python
# backend/utils/security.py
SECRET_KEY = "your-super-secret-key-change-in-production"  # ❌ НЕ ДЛЯ ПРОДАКШЕНА!
```

**Пароль БД в docker-compose:**
```yaml
# docker-compose.prod.yml
environment:
  POSTGRES_PASSWORD: postgres  # ❌ НЕ ДЛЯ ПРОДАКШЕНА!
```

### ✅ Решение: Использование переменных окружения

#### Шаг 1: Создать .env файл на сервере

```bash
# На сервере: /opt/snapcheck/.env
SECRET_KEY=ваш-супер-секретный-ключ-минимум-32-символа-случайных
DATABASE_URL=postgresql://snapcheck_user:сложный_пароль_123@db:5432/snapcheck
POSTGRES_USER=snapcheck_user
POSTGRES_PASSWORD=сложный_пароль_123
POSTGRES_DB=snapcheck
```

**Генерация безопасного SECRET_KEY:**
```bash
# На сервере
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Шаг 2: Обновить backend/utils/security.py

```python
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# Читаем из переменной окружения
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
if SECRET_KEY == "your-super-secret-key-change-in-production":
    import warnings
    warnings.warn("⚠️  SECRET_KEY не установлен! Используется дефолтное значение. НЕ ДЛЯ ПРОДАКШЕНА!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ... остальной код без изменений
```

#### Шаг 3: Обновить docker-compose.prod.yml

```yaml
services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    # ... остальное без изменений

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
    # ... остальное без изменений
```

#### Шаг 4: Добавить .env в .gitignore

```bash
# В корне проекта
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
```

#### Шаг 5: Создать .env.example

```bash
# .env.example - шаблон для разработчиков
SECRET_KEY=your-secret-key-here-min-32-chars
DATABASE_URL=postgresql://user:password@db:5432/snapcheck
POSTGRES_USER=snapcheck_user
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=snapcheck
```

### 🔒 Docker Secrets (альтернатива для продакшена)

Для более высокого уровня безопасности используйте Docker Secrets:

```bash
# На сервере
echo "ваш-супер-секретный-ключ" | docker secret create snapcheck_secret_key -
echo "сложный_пароль_БД" | docker secret create postgres_password -
```

```yaml
# docker-compose.prod.yml
secrets:
  snapcheck_secret_key:
    external: true
  postgres_password:
    external: true

services:
  backend:
    secrets:
      - snapcheck_secret_key
    environment:
      SECRET_KEY_FILE: /run/secrets/snapcheck_secret_key
```

---

## Аутентификация и авторизация

### Текущая реализация

**JWT токены:**
- Алгоритм: HS256
- Срок действия: 30 минут
- Хранение: localStorage (frontend)

**Хеширование паролей:**
- Библиотека: bcrypt
- Rounds: 12 (по умолчанию в passlib)

### ✅ Рекомендации

#### 1. Увеличить срок действия токена (опционально)

```python
# backend/utils/security.py
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # или больше, если нужно
```

#### 2. Добавить refresh tokens

```python
# backend/utils/security.py
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

```python
# backend/routers/auth.py
@router.post("/refresh")
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        email: str = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
```

#### 3. Добавить rate limiting для логина

```bash
# Установить на сервере
pip install slowapi
```

```python
# backend/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# backend/routers/auth.py
from fastapi import Request

@router.post("/login")
@limiter.limit("5/minute")  # Максимум 5 попыток в минуту
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), ...):
    # ... существующий код
```

#### 4. Добавить логирование неудачных попыток входа

```python
# backend/routers/auth.py
import logging

logger = logging.getLogger(__name__)

@router.post("/login")
async def login(...):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password):
        logger.warning(f"Failed login attempt for user: {form_data.username} from IP: {request.client.host}")
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # ... успешный вход
```

#### 5. Политика паролей

```python
# backend/routers/auth.py
import re

def validate_password(password: str) -> bool:
    """
    Проверка сложности пароля:
    - Минимум 8 символов
    - Минимум 1 заглавная буква
    - Минимум 1 строчная буква
    - Минимум 1 цифра
    - Минимум 1 спецсимвол
    """
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True

@router.post("/register")
async def register(email: str, password: str, ...):
    if not validate_password(password):
        raise HTTPException(
            status_code=400, 
            detail="Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character"
        )
    # ... остальной код
```

---

## Безопасность базы данных

### Текущие настройки

```yaml
# docker-compose.prod.yml
db:
  image: postgres:15-alpine
  environment:
    POSTGRES_PASSWORD: postgres  # ❌ Слабый пароль
```

### ✅ Улучшения

#### 1. Сильный пароль и отдельный пользователь

```bash
# .env
POSTGRES_USER=snapcheck_user
POSTGRES_PASSWORD=G7#mK9$pL2@vN4!qR8
POSTGRES_DB=snapcheck
```

#### 2. Регулярные бэкапы

**Автоматический бэкап (cron на сервере):**

```bash
# Создать скрипт бэкапа: /opt/snapcheck/backup.sh
#!/bin/bash
BACKUP_DIR="/opt/snapcheck/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="snapcheck-db-1"

mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker exec $CONTAINER pg_dump -U snapcheck_user snapcheck | gzip > $BACKUP_DIR/snapcheck_$DATE.sql.gz

# Удалить бэкапы старше 7 дней
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: snapcheck_$DATE.sql.gz"
```

```bash
# Сделать исполняемым
chmod +x /opt/snapcheck/backup.sh

# Добавить в cron (каждый день в 3:00)
crontab -e
# Добавить строку:
0 3 * * * /opt/snapcheck/backup.sh >> /var/log/snapcheck_backup.log 2>&1
```

#### 3. Восстановление из бэкапа

```bash
# Восстановить из бэкапа
cd /opt/snapcheck
gunzip -c backups/snapcheck_20241021_030000.sql.gz | docker exec -i snapcheck-db-1 psql -U snapcheck_user snapcheck
```

#### 4. Ограничение доступа к БД

```yaml
# docker-compose.prod.yml
db:
  # НЕ публикуем порт наружу - только внутри Docker сети
  # ports:  # ❌ Закомментировать или удалить
  #   - "5432:5432"
  networks:
    - snapcheck-net  # Только внутренняя сеть
```

#### 5. Шифрование данных (опционально)

```yaml
# docker-compose.prod.yml
db:
  volumes:
    - postgres_data:/var/lib/postgresql/data
  environment:
    POSTGRES_INITDB_ARGS: "-E UTF8 --locale=en_US.UTF-8"
  command: >
    postgres
    -c ssl=on
    -c ssl_cert_file=/etc/ssl/certs/server.crt
    -c ssl_key_file=/etc/ssl/private/server.key
```

---

## Сетевая безопасность

### 1. HTTPS (уже настроено ✅)

Traefik автоматически получает Let's Encrypt сертификаты:

```yaml
# docker-compose.prod.yml
backend:
  labels:
    - "traefik.http.routers.backend-https.tls.certresolver=myresolver"
```

**Проверка:**
```bash
curl -I https://lms.it-uae.com/api/health
# HTTP/2 200 - ✅ HTTPS работает
```

### 2. Firewall (UFW)

**Настроить на сервере:**

```bash
# Включить firewall
sudo ufw enable

# Разрешить только нужные порты
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (для редиректа на HTTPS)
sudo ufw allow 443/tcp   # HTTPS

# Заблокировать все остальное
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Проверить статус
sudo ufw status verbose
```

### 3. SSH ключи вместо паролей

**На локальной машине:**

```bash
# Генерировать SSH ключ (если нет)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Скопировать на сервер
ssh-copy-id root@88.99.124.218
```

**На сервере отключить вход по паролю:**

```bash
# Редактировать /etc/ssh/sshd_config
sudo nano /etc/ssh/sshd_config

# Изменить:
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin prohibit-password

# Перезапустить SSH
sudo systemctl restart sshd
```

### 4. Rate Limiting (Traefik)

```yaml
# docker-compose.prod.yml (или traefik.yml)
http:
  middlewares:
    rate-limit:
      rateLimit:
        average: 100
        burst: 50
        period: 1s

services:
  backend:
    labels:
      - "traefik.http.routers.backend-https.middlewares=api-strip@file,rate-limit@file"
```

### 5. Fail2Ban для защиты от брутфорса

```bash
# На сервере
sudo apt install fail2ban

# Создать конфигурацию
sudo nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Безопасность приложения

### 1. CORS (Cross-Origin Resource Sharing)

**Текущая настройка (слишком открыта):**

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ❌ Разрешает все домены!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**✅ Правильная настройка для продакшена:**

```python
# backend/main.py
import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://lms.it-uae.com").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Только наш домен
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)
```

```bash
# В .env
ALLOWED_ORIGINS=https://lms.it-uae.com,https://www.lms.it-uae.com
```

### 2. SQL Injection (защита через ORM)

✅ **Используем SQLAlchemy - защищены автоматически:**

```python
# ✅ Безопасно - параметризованный запрос
user = db.query(User).filter(User.email == email).first()

# ❌ НИКОГДА так не делать:
# user = db.execute(f"SELECT * FROM users WHERE email = '{email}'")
```

### 3. XSS (Cross-Site Scripting)

**Frontend - React автоматически экранирует:**

```jsx
// ✅ Безопасно - React экранирует
<div>{user.name}</div>

// ❌ Опасно - прямой HTML
<div dangerouslySetInnerHTML={{__html: user.name}} />
```

**Backend - валидация входных данных:**

```python
from pydantic import BaseModel, validator, EmailStr
import bleach

class UserCreate(BaseModel):
    email: EmailStr  # Автоматическая валидация email
    password: str
    name: str
    
    @validator('name')
    def sanitize_name(cls, v):
        # Удаляем HTML теги
        return bleach.clean(v, tags=[], strip=True)
```

### 4. Валидация всех входных данных

```python
# backend/routers/slides.py
from pydantic import BaseModel, validator

class PresentationCreate(BaseModel):
    title: str
    file_url: str
    
    @validator('title')
    def title_length(cls, v):
        if len(v) < 3 or len(v) > 200:
            raise ValueError('Title must be between 3 and 200 characters')
        return v
    
    @validator('file_url')
    def valid_url(cls, v):
        if not v.startswith(('http://', 'https://', '/')):
            raise ValueError('Invalid file URL')
        return v
```

### 5. Безопасные заголовки HTTP

```python
# backend/main.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

# HTTPS редирект (только для продакшена)
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# Разрешенные хосты
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["lms.it-uae.com", "www.lms.it-uae.com"]
)

# Добавить security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

---

## Безопасный деплой

### 1. Проверка перед деплоем

```bash
# Чек-лист перед деплоем
cd /opt/snapcheck

# 1. Проверить .env файл
cat .env | grep SECRET_KEY  # Должен быть длинный случайный ключ
cat .env | grep POSTGRES_PASSWORD  # Должен быть сложный пароль

# 2. Проверить версию кода
git log -1 --oneline

# 3. Проверить Docker images
docker images | grep snapcheck
```

### 2. Безопасная команда деплоя

```bash
# Полный процесс с проверками
cd /opt/snapcheck

# Бэкап БД перед обновлением
/opt/snapcheck/backup.sh

# Обновить код
git pull origin main

# Пересобрать с новыми секретами
docker compose down
docker compose up -d --build

# Проверить health
sleep 10
curl -f https://lms.it-uae.com/api/health || echo "❌ Backend unhealthy"
curl -f https://lms.it-uae.com/ || echo "❌ Frontend unhealthy"
```

### 3. Rollback процедура

```bash
# Если что-то пошло не так
cd /opt/snapcheck

# 1. Откатить код
git log --oneline -5  # Найти предыдущий коммит
git reset --hard <предыдущий-коммит>

# 2. Пересобрать
docker compose down
docker compose up -d --build

# 3. Восстановить БД (если нужно)
gunzip -c backups/snapcheck_<дата>.sql.gz | docker exec -i snapcheck-db-1 psql -U snapcheck_user snapcheck
```

---

## Мониторинг и аудит

### 1. Логирование безопасности

```python
# backend/main.py
import logging

# Настроить логирование
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/app/logs/security.log"),
        logging.StreamHandler()
    ]
)

security_logger = logging.getLogger("security")

# Логировать важные события
@app.post("/api/auth/login")
async def login(...):
    # При неудачном входе
    security_logger.warning(f"Failed login for {email} from {request.client.host}")
    
    # При успешном входе
    security_logger.info(f"Successful login for {email} from {request.client.host}")
```

### 2. Мониторинг логов

```bash
# На сервере - проверить логи безопасности
docker logs snapcheck-backend-1 | grep -i "failed\|error\|warning"

# Проверить Traefik access logs
docker logs traefik | grep "401\|403\|404\|500"
```

### 3. Алерты при подозрительной активности

```bash
# Простой скрипт для алертов: /opt/snapcheck/check_security.sh
#!/bin/bash
FAILED_LOGINS=$(docker logs --since 1h snapcheck-backend-1 | grep -c "Failed login")

if [ $FAILED_LOGINS -gt 10 ]; then
    echo "⚠️  WARNING: $FAILED_LOGINS failed login attempts in last hour" | mail -s "Security Alert" admin@example.com
fi
```

---

## Чек-лист безопасности

### Перед запуском в продакшн

- [ ] **SECRET_KEY** - случайный, минимум 32 символа, в .env
- [ ] **Пароли БД** - сложные пароли, в .env
- [ ] **.env** добавлен в .gitignore
- [ ] **CORS** - только разрешенные домены (не "*")
- [ ] **HTTPS** - работает (Let's Encrypt)
- [ ] **Firewall** - UFW включен, открыты только 22, 80, 443
- [ ] **SSH** - только ключи, пароли отключены
- [ ] **Бэкапы БД** - настроен cron
- [ ] **Rate limiting** - включен для /auth endpoints
- [ ] **Логирование** - записываются security events
- [ ] **Валидация** - все входные данные проверяются
- [ ] **Security headers** - X-Frame-Options, HSTS, etc.
- [ ] **Fail2Ban** - установлен и настроен

### Регулярные проверки (еженедельно)

- [ ] Проверить логи на подозрительную активность
- [ ] Проверить наличие свежих бэкапов
- [ ] Проверить обновления зависимостей
- [ ] Проверить SSL сертификаты (срок действия)
- [ ] Проверить disk space на сервере

### Перед каждым деплоем

- [ ] Бэкап БД выполнен
- [ ] Код прошел ревью
- [ ] .env файл актуален
- [ ] Health endpoints работают после деплоя
- [ ] Логи не показывают ошибок

---

## Быстрая справка - Команды безопасности

```bash
# Генерация SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Проверка firewall
sudo ufw status verbose

# Проверка failed logins
docker logs snapcheck-backend-1 | grep "Failed login"

# Бэкап БД
docker exec snapcheck-db-1 pg_dump -U snapcheck_user snapcheck | gzip > backup_$(date +%Y%m%d).sql.gz

# Восстановление БД
gunzip -c backup_20241021.sql.gz | docker exec -i snapcheck-db-1 psql -U snapcheck_user snapcheck

# Проверка SSL сертификата
echo | openssl s_client -connect lms.it-uae.com:443 2>/dev/null | openssl x509 -noout -dates

# Проверка открытых портов
sudo netstat -tuln | grep LISTEN

# Проверка попыток брутфорса SSH
sudo grep "Failed password" /var/log/auth.log | tail -20
```

---

## Поддержка

При обнаружении уязвимостей или проблем безопасности:
1. НЕ создавайте публичные issue
2. Свяжитесь напрямую с администратором
3. Следуйте процедуре responsible disclosure
