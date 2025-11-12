# 🔐 ПОЛНЫЙ РАЗВЕРНУТЫЙ ОТВЕТ ПО ЗАЩИТЕ ОТ ВЗЛОМА

## 📌 ВВЕДЕНИЕ

**Современное веб-приложение подвергается множеству типов атак ежедневно:**

- SQL Injection (внедрение вредоносного кода в БД)
- XSS атаки (внедрение JavaScript в браузер пользователя)
- CSRF атаки (выполнение действий от имени пользователя)
- DDoS атаки (перегрузка сервера запросами)
- Brute Force атаки (перебор паролей)
- Man-in-the-Middle атаки (перехват трафика)
- Path Traversal (доступ к запретным файлам)
- XXE атаки (внедрение в XML)
- SSRF атаки (использование сервера для своих целей)

**Это не паранойя. Это реальность.**

---

## 🎯 ПОЧЕМУ ЗАЩИТА ВАЖНА?

### Последствия взлома:

1. **Для вас (компания):**
   - Утечка данных пользователей
   - Потеря репутации
   - Штрафы (GDPR: до €20 млн или 4% выручки)
   - Судебные иски
   - Восстановление после взлома: дорого и долго

2. **Для пользователей:**
   - Кража личных данных
   - Мошенничество
   - Кража денег со счета
   - Потеря конфиденциальности

### Реальные примеры:

- **Facebook (2019):** утечка 419 млн номеров телефонов
- **Target (2013):** 40 млн кредитных карт украдено, штраф $18.5 млн
- **Equifax (2017):** 147 млн записей украдено, штраф $700 млн
- **Twitter (2020):** аккаунты знаменитостей взломаны

**Защита - это не опция, это обязательство.**

---

## 🔐 ДЕТАЛЬНОЕ ОБЪЯСНЕНИЕ КАЖДОГО ТРЕБОВАНИЯ

### 1️⃣ AUTHENTICATION & AUTHORIZATION

#### A. JWT токены

**Что это?**
JSON Web Token - это подписанный токен, содержащий информацию о пользователе.

**Текущее состояние:**
```
Вероятно, вы используете JWT для аутентификации
```

**Что улучшить:**

```python
# ❌ НЕПРАВИЛЬНО (текущее):
# Один длительный токен без обновления
token = create_token(user_id, expires_hours=24*30)  # 30 дней!

# ✅ ПРАВИЛЬНО (нужно):
# Короткоживущий access token + refresh token
access_token = create_token(user_id, expires_minutes=30)      # 30 минут
refresh_token = create_token(user_id, expires_days=7)          # 7 дней
token_blacklist = add_to_blacklist(token_id)                   # при логауте
```

**Почему это важно?**
- Если access token украдут, вор может действовать максимум 30 минут
- Refresh token хранится в secure storage (не в памяти)
- При логауте токен добавляется в blacklist
- Новый токен = новый жизненный цикл

**Как это работает:**
```
1. Пользователь логинится
2. Сервер выдает access_token (30 мин) + refresh_token (7 дней)
3. Клиент использует access_token для запросов
4. Через 30 минут access_token истекает
5. Клиент использует refresh_token для получения нового access_token
6. Если refresh_token украден, его можно отозвать
```

#### B. Пароли

**Текущее состояние:**
```
Неизвестно, используется ли bcrypt
```

**Что нужно:**

```python
# ❌ НЕПРАВИЛЬНО:
import hashlib
password_hash = hashlib.md5(password).hexdigest()  # MD5 - взламывается за миллисекунды!
password_hash = hashlib.sha256(password).hexdigest()  # SHA256 - 2 млрд попыток в сек

# ✅ ПРАВИЛЬНО:
import bcrypt
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12))
# bcrypt - 5000 попыток в сек (в 400,000 раз медленнее)
```

**Требования к паролям:**
```
✅ Минимум 12 символов (не 8, не 10!)
✅ ЗАГЛАВНЫЕ буквы: A-Z
✅ строчные буквы: a-z
✅ Цифры: 0-9
✅ Спецсимволы: !@#$%^&*

Пример плохого пароля: "password123" (легко угадать)
Пример хорошего пароля: "Tr0pic@lSunset#92" (сложно угадать)
```

**Почему bcrypt?**
```
MD5/SHA1: создан в 1990х, слишком быстрый
bcrypt: создан в 1999, специально для паролей, медленный
scrypt: еще лучше, но bcrypt достаточно

Bcrypt содержит salt (случайные данные)
Bcrypt добавляет задержку (0.2 секунды на проверку)
При переборе на 1000 попыток уходит 200 секунд!
```

#### C. Rate limiting на логин

**Текущее состояние:**
```
Вероятно, нет защиты от brute force
```

**Что это значит?**
```
Атакующий может перепробовать 1000 паролей в секунду
За час - 3.6 млн попыток
Против слабых паролей это работает!
```

**Решение:**

```python
# ✅ ПРАВИЛЬНО:
# Максимум 5 неудачных попыток в 15 минут
failed_attempts = get_failed_attempts(email)
if failed_attempts >= 5:
    raise TooManyAttemptsError("Заблокирован на 15 минут")

# Блокировка экспоненциально растет:
# 1-я попытка: блокировка на 1 минуту
# 2-я попытка: блокировка на 2 минуты
# 3-я попытка: блокировка на 4 минуты
# 4-я попытка: блокировка на 8 минут
# 5-я попытка: блокировка на 15 минут
```

**После 5-й попытки:**
```
- Отправить email с подтверждением
- Использовать CAPTCHA
- Использовать 2FA (двухфакторную аутентификацию)
```

#### D. Двухфакторная аутентификация (2FA)

**Что это?**
```
Пароль - это первый фактор (что вы знаете)
Второй фактор (что вы имеете):
  - SMS код (отправляется на телефон)
  - Authenticator app (Google Authenticator, Authy)
  - Email код
  - Биометрия (отпечаток пальца, Face ID)
```

**Почему нужна?**
```
Даже если пароль украден, вор не может зайти без второго фактора
Требует наличие доступа к телефону/email/биометрии

На мобильном: Face ID или Touch ID уже встроены
На веб: SMS или Authenticator
```

**Как работает:**
```
1. Пользователь вводит email + пароль
2. Сервер проверяет (правильно)
3. Сервер генерирует 6-значный код
4. SMS отправляет код на телефон пользователя
5. Пользователь вводит код в браузер
6. Сервер проверяет код
7. Доступ разрешен

Без второго фактора - доступ запрещен!
```

---

### 2️⃣ ENCRYPTION (ШИФРОВАНИЕ)

#### A. HTTPS везде (не HTTP)

**Текущее состояние:**
```
HTTP передает данные открытым текстом (любой может перехватить)
```

**Что происходит при HTTP:**
```
Человек в сети может видеть:
1. Ваш пароль (если передается открытым текстом)
2. JWT токен (может украсть и выдать себя за вас)
3. Личные данные (email, имя, телефон)
4. Содержание презентаций (финансовые отчеты?)
```

**Решение - HTTPS:**
```
HTTPS использует TLS 1.2+ для шифрования
Данные передаются в зашифрованном виде
Даже если перехватить трафик, не видно содержимого

Сертификат: Let's Encrypt (бесплатный, автообновляется каждые 90 дней)
```

**Конфиг Nginx:**
```nginx
# Редирект с HTTP на HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

#### B. Шифрование в БД (at rest)

**Текущее состояние:**
```
Пароли: скорее всего, хешируются (хорошо)
Другие чувствительные данные: ?
```

**Что нужно шифровать?**
```
✅ Пароли (хешировать, не шифровать!)
✅ API ключи (если сохраняются)
✅ Платежные данные (если обрабатываются)
✅ Номера телефонов (могут быть приватными)
✅ Email адреса (могут быть приватными)
✅ IP адреса (для GDPR)
```

**Как это работает:**

```python
# ✅ ПРАВИЛЬНО:
from cryptography.fernet import Fernet

cipher = Fernet(encryption_key)

# Шифрование
encrypted_data = cipher.encrypt(sensitive_data.encode())
# Результат: b'gAAAAAB...' (невозможно прочитать)

# Расшифровка
decrypted_data = cipher.decrypt(encrypted_data).decode()
# Результат: исходные данные
```

**Ключ шифрования:**
```
- Хранить в .env (не в коде!)
- Никогда не коммитить в Git
- Использовать разные ключи для dev/prod
- Ротировать ежегодно (старый ключ сохранить)
```

---

### 3️⃣ API SECURITY

#### A. SQL Injection (внедрение SQL кода)

**Что это?**

```sql
-- ❌ УЯЗВИМЫЙ код:
query = f"SELECT * FROM users WHERE email = '{email}'"
# Если email = "' OR '1'='1" -- то получится:
# SELECT * FROM users WHERE email = '' OR '1'='1' --
# Выдаст ВСЕ пользователей, не только нужного!

-- ✅ БЕЗОПАСНЫЙ код:
query = "SELECT * FROM users WHERE email = ?"
cursor.execute(query, (email,))
# БД сама экранирует спецсимволы
```

**В FastAPI (SQLAlchemy):**

```python
# ✅ ПРАВИЛЬНО (используется ORM):
user = db.query(User).filter(User.email == email).first()
# SQLAlchemy автоматически экранирует значения

# ❌ НЕПРАВИЛЬНО (если где-то есть):
query = f"SELECT * FROM users WHERE email = '{email}'"
```

**Как это предотвращается?**
```
1. Использовать ORM (SQLAlchemy) вместо raw SQL
2. Параметризованные запросы (placeholder ?)
3. Input validation (проверить формат email)
4. Escape специальные символы
```

#### B. XSS (Cross-Site Scripting)

**Что это?**

```html
<!-- ❌ УЯЗВИМЫЙ код (React) -->
<div dangerouslySetInnerHTML={{ __html: user_comment }} />
<!-- Если user_comment = "<img src=x onerror='alert(document.cookie)'" то: -->
<!-- JavaScript выполнится и украдет cookies! -->

<!-- ✅ БЕЗОПАСНЫЙ код (React) -->
<div>{user_comment}</div>
<!-- React автоматически экранирует HTML -->
```

**На фронтенде:**

```javascript
// ❌ НЕПРАВИЛЬНО:
document.innerHTML = user_input;  // Может выполнить JavaScript

// ✅ ПРАВИЛЬНО:
document.textContent = user_input;  // Только текст
// или в React:
<div>{user_input}</div>  // React экранирует
```

**Content Security Policy (CSP) header:**

```
Content-Security-Policy: default-src 'self'; script-src 'self' trusted.com
```

Это говорит браузеру:
- Загружать ресурсы только с этого сайта
- JavaScript только с сайта и trusted.com
- Встроенный JavaScript (inline) запретить

#### C. CSRF (Cross-Site Request Forgery)

**Что это?**

```html
<!-- Вы залогинены на example.com -->
<!-- Вы открываете вредоносный сайт evil.com -->
<!-- На evil.com есть скрытая форма: -->
<form action="https://example.com/transfer" method="POST">
  <input name="amount" value="1000">
  <input name="to_account" value="hacker@evil.com">
  <input type="submit">
</form>
<!-- При загрузке страницы форма автоматически отправится! -->
<!-- Деньги переведены, потому что вы залогинены! -->
```

**Решение - CSRF токены:**

```html
<!-- На сайте example.com -->
<form action="/transfer" method="POST">
  <input name="amount" value="1000">
  <input name="to_account" value="friend@example.com">
  <input name="csrf_token" value="abc123def456...">  <!-- уникальный токен -->
  <input type="submit">
</form>
```

```python
# На сервере:
@app.post("/transfer")
def transfer(amount, to_account, csrf_token, request):
    if not verify_csrf_token(csrf_token, request.session):
        raise CSRFError("Неверный CSRF токен")
    # Выполнить транзакцию
```

**Почему работает?**
- Вредоносный сайт не может получить CSRF токен (Same-Origin Policy)
- evil.com не может отправить валидный токен с example.com
- Сервер отвергает запросы без правильного токена

#### D. Rate Limiting

**Что это?**

```
Защита от:
- DDoS атак (миллионы запросов в сек)
- Brute force атак (перебор паролей)
- Resource exhaustion (исчерпание ресурсов)
```

**Как это работает:**

```python
# ✅ ПРАВИЛЬНО (в Nginx):
limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;
limit_req zone=general burst=20;

# Объяснение:
# - $binary_remote_addr = IP адрес клиента
# - zone=general:10m = зона на 10 минут
# - rate=100r/m = максимум 100 запросов в минуту
# - burst=20 = допустить всплеск из 20 запросов
```

**В приложении:**

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()

@app.post("/login")
@limiter.limit("5/15 minutes")  # 5 попыток в 15 минут
def login(email: str, password: str):
    # ...
```

---

### 4️⃣ INPUT VALIDATION & SANITIZATION

**Что это?**

```
Валидация = проверить формат данных
Санитизация = удалить опасные символы
```

**Примеры:**

```python
# ❌ НЕПРАВИЛЬНО:
email = request.form.get("email")
user = User.create(email=email)  # Может быть что угодно!

# ✅ ПРАВИЛЬНО:
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr  # Должен быть валидный email
    password: str = Field(..., min_length=12, max_length=256)
    
# Если email не валидный или пароль короче 12 символов - ошибка

# SQL injection:
if "'" in email or "--" in email or ";" in email:
    raise ValueError("Недопустимые символы")

# XSS:
email = email.replace("<", "&lt;").replace(">", "&gt;")
```

**Максимальные размеры:**

```
Request body: максимум 5 MB
String поле: максимум 256 символов
Array: максимум 1000 элементов
File upload: максимум 100 MB
```

---

### 5️⃣ DATABASE SECURITY

#### A. Доступ к БД

**Текущее состояние:**
```
SQLite на локальной машине (в разработке хорошо)
На production нужно переехать на PostgreSQL
```

**Требования:**

```
✅ Доступ только через localhost (127.0.0.1)
✅ Никакого внешнего доступа (firewall)
✅ Разные пользователи для dev/prod
✅ Нестандартный порт (не 5432 для PostgreSQL)
✅ Сильный пароль (минимум 20 символов, random)
✅ SSL/TLS для подключения
```

**Конфиг PostgreSQL:**

```python
# ❌ НЕПРАВИЛЬНО:
DATABASE_URL = "postgresql://postgres:password@example.com:5432/db"

# ✅ ПРАВИЛЬНО:
DATABASE_URL = "postgresql://app_user:$(SECRET_DB_PASSWORD)@127.0.0.1:5555/db"
# app_user = специальный пользователь (не postgres!)
# $(SECRET_DB_PASSWORD) = из .env
# 127.0.0.1 = только localhost
# 5555 = нестандартный порт
# SSL включен на уровне ОС
```

#### B. Бэкапы БД

**Почему это важно?**
```
Если произойдет взлом или сбой, нужно восстановиться
Без бэкапов - потеря всех данных
```

**Как это работает:**

```bash
#!/bin/bash

# Создать бэкап
pg_dump -h 127.0.0.1 -U app_user -d snapcheck > backup_$(date +%Y%m%d).sql.gz

# Зашифровать
gpg --symmetric --cipher-algo aes256 backup_20251019.sql.gz

# Загрузить на удаленный сервер
scp backup_20251019.sql.gz.gpg backup_server:/backups/

# Хранить в 2-3 местах (не на одном сервере!)
# AWS S3, Dropbox, другой VPS
```

**Автоматизация:**

```cron
# Каждый день в 2:00 AM создавать бэкап
0 2 * * * /scripts/backup.sh

# Каждый месяц проверять восстановление
0 3 1 * * /scripts/test_restore.sh
```

---

### 6️⃣ INFRASTRUCTURE SECURITY

#### A. Сервер (Linux)

**Обновления:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt upgrade
sudo apt autoremove

# Автоматические обновления:
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

**Firewall:**

```bash
sudo ufw enable
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw deny from anywhere to anywhere port 5432  # БД закрыта!
```

**SSH Безопасность:**

```bash
# Отключить root логин
sudo nano /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no  # Только SSH ключи!
Port 2222  # Нестандартный порт

# Перезагрузить SSH
sudo systemctl restart ssh
```

**SSH ключи:**

```bash
# Создать ключ один раз
ssh-keygen -t rsa -b 4096 -f ~/.ssh/snapcheck_key -N ""

# Копировать публичный ключ на сервер
ssh-copy-id -i ~/.ssh/snapcheck_key.pub -p 2222 snapcheck@example.com

# Теперь подключение:
ssh -p 2222 -i ~/.ssh/snapcheck_key snapcheck@example.com
# Пароль не нужен!
```

**Разрешения файлов:**

```bash
# Папки: 755 (owner: r/w/x, others: r/x)
sudo chmod 755 /opt/snapcheck

# Конфигурация: 644 (owner: r/w, others: r)
sudo chmod 644 /opt/snapcheck/.env

# Скрипты: 755 (owner: r/w/x, others: r/x)
sudo chmod 755 /opt/snapcheck/start.sh
```

#### B. Docker Security

**Проблемы:**

```
❌ Запускать контейнер от root
❌ Использовать старые образы
❌ Монтировать весь файловой системе
```

**Решение:**

```dockerfile
# ✅ Dockerfile
FROM python:3.11-slim

# Не запускать от root
RUN useradd -m -u 1000 appuser

# Обновить базовый образ
RUN apt-get update && apt-get upgrade -y

# Скопировать код с правильными permissions
COPY --chown=appuser:appuser . /app

# Переключиться на appuser
USER appuser

# Запустить приложение
CMD ["python", "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"]
```

**Docker compose:**

```yaml
version: '3.8'

services:
  app:
    build: .
    user: appuser  # Не root!
    volumes:
      - ./data:/app/data  # Только необходимые папки
    environment:
      - DATABASE_URL=postgresql://...
    restart: unless-stopped
    networks:
      - private
    
networks:
  private:
    internal: true  # Не может общаться с интернетом
```

#### C. Nginx Security Headers

**Что это?**

```
HTTP headers дают инструкции браузеру
Они помогают защитить от атак на стороне клиента
```

**Конфиг:**

```nginx
server {
    # ...
    
    # Не позволять вставлять в iframe
    add_header X-Frame-Options "DENY" always;
    
    # Заставить проверять MIME тип
    add_header X-Content-Type-Options "nosniff" always;
    
    # XSS фильтр браузера
    add_header X-XSS-Protection "1; mode=block" always;
    
    # HTTPS в течение 1 года
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Content Security Policy (защита от XSS)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" always;
    
    # Referrer Policy
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Permissions Policy (какие права нужны)
    add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;
}
```

---

### 7️⃣ FRONTEND SECURITY

#### A. localStorage vs SessionStorage

**Проблема:**

```javascript
// ❌ НЕПРАВИЛЬНО:
localStorage.setItem('token', jwt_token);  // Доступен для XSS!

// Любой JavaScript на сайте может прочитать:
const token = localStorage.getItem('token');
// Если есть XSS, вор украдет токен!
```

**Решение:**

```javascript
// ✅ ПРАВИЛЬНО (мобильное):
import SecureStorage from 'react-native-secure-store';
SecureStorage.setItem('token', jwt_token);  // Зашифровано в ОС

// ✅ ПРАВИЛЬНО (веб):
// HttpOnly cookies (не доступны JavaScript!)
// Сервер устанавливает:
Set-Cookie: token=abc123; HttpOnly; Secure; SameSite=Strict; Path=/

// JavaScript не может прочитать!
console.log(document.cookie);  // Пусто!
```

#### B. npm Dependencies

**Текущее состояние:**

```bash
npm audit  # Запустить для проверки уязвимостей
```

**Процесс:**

```bash
# Проверить уязвимости
npm audit

# Автоматически исправить
npm audit fix

# Обновить все пакеты
npm update

# Проверить наличие старых пакетов
npm outdated
```

**Что проверять:**

```
- Все версии в package.json
- npm audit перед каждым релизом
- Использовать точные версии (не *)
- Lock файл (package-lock.json) обязателен
- Избегать пакетов с множеством vulnerabilities
```

**Пример уязвимости:**

```
npm ERR! found 5 vulnerabilities (3 high, 2 critical)
npm ERR! run npm audit fix to fix them, or npm audit for details
```

Это говорит: найдены 5 уязвимостей, 3 высокие, 2 критические.

---

### 8️⃣ МОБИЛЬНАЯ БЕЗОПАСНОСТЬ

#### A. Secure Storage (не AsyncStorage!)

**Проблема:**

```javascript
// ❌ НЕПРАВИЛЬНО:
AsyncStorage.setItem('token', jwt_token);
// AsyncStorage = простой JSON файл на диске
// Любой может прочитать с помощью adb (Android) или через backup
```

**Решение:**

```javascript
// ✅ ПРАВИЛЬНО:
import * as SecureStore from 'expo-secure-store';

// Сохранить
await SecureStore.setItemAsync('token', jwt_token);

// Прочитать
const token = await SecureStore.getItemAsync('token');

// Удалить
await SecureStore.deleteItemAsync('token');
```

**Как это работает:**

```
iOS: Хранит в Keychain (зашифровано ОС)
Android: Хранит в EncryptedSharedPreferences (зашифровано)
Доступ защищен:
  - Если устройство защищено паролем/биометрией
  - При разблокировке устройства пароль проверяется
```

#### B. Биометрическая аутентификация

**Что это?**

```
Отпечаток пальца (Touch ID / Fingerprint)
Лицо (Face ID / Face Unlock)
Iris scan (радужная оболочка глаза)
```

**Как работает:**

```javascript
import * as LocalAuthentication from 'expo-local-authentication';

// Проверить поддержку биометрии
const compatible = await LocalAuthentication.hasHardwareAsync();

// Запросить аутентификацию
try {
  const result = await LocalAuthentication.authenticateAsync({
    reason: 'Подтвердите отпечаток пальца',
    fallbackLabel: 'Использовать пароль',
    disableDeviceFallback: false,
  });
  
  if (result.success) {
    // Биометрия прошла успешно
    // Разрешить доступ
  } else {
    // Биометрия не прошла
  }
} catch (error) {
  // Ошибка
}
```

#### C. Certificate Pinning (для мобильных)

**Что это?**

```
Обычно: браузер проверяет любой сертификат от доверенного CA
Certificate Pinning: мобильное приложение хранит ожидаемый сертификат
Если сертификат не совпадает - соединение отвергается
```

**Зачем?**

```
Защита от man-in-the-middle атак даже если:
- Злоумышленник украл сертификат
- CA выдал фальшивый сертификат
- Используется прокси/firewall на корпоративной сети
```

**Как работает:**

```javascript
import axios from 'axios';

// Подключить axios с certificate pinning
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  // Certificate pinning будет настроено на уровне ОС
});
```

---

### 9️⃣ MONITORING & LOGGING

#### A. Что логировать?

```
✅ Все попытки логина (успешные и неудачные)
✅ Все неудачные попытки доступа (401, 403)
✅ Все изменения данных (create, update, delete)
✅ Все попытки SQL injection
✅ Все попытки XSS
✅ Все DDoS попытки (много запросов в сек)
✅ Все ошибки приложения
✅ Все ошибки БД
```

**Пример логирования:**

```python
import logging

logger = logging.getLogger(__name__)

@app.post("/login")
def login(email: str, password: str):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning(f"Failed login attempt: user not found for {email}")
            raise ValueError("Invalid credentials")
        
        if not bcrypt.checkpw(password.encode(), user.password_hash):
            logger.warning(f"Failed login attempt: wrong password for {email}")
            raise ValueError("Invalid credentials")
        
        logger.info(f"Successful login: {email}")
        # Создать токен
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
```

#### B. Где хранить логи?

**Локально (плохо):**
```bash
/var/log/app.log  # Если сервер скомпрометирован, логи удалят
```

**Централизованное логирование (хорошо):**
```
ELK Stack (Elasticsearch, Logstash, Kibana)
AWS CloudWatch
Google Cloud Logging
Datadog
Splunk
```

**Настройка:**

```python
# Отправлять логи в CloudWatch
import watchtower

cloudwatch_handler = watchtower.CloudWatchLogHandler(
    log_group='snapcheck',
    stream_name='app-logs',
)

logger.addHandler(cloudwatch_handler)
```

#### C. Алерты

```
Создать алерты на:

1. Множественные неудачные логины
   - Если 5+ неудачных попыток за 15 минут
   - Отправить email: "Подозрительная активность"

2. DDoS попытки
   - Если 1000+ запросов с одного IP за минуту
   - Заблокировать IP

3. SQL injection попытки
   - Если в параметрах найдены ' или -- или ;
   - Заблокировать и отправить алерт

4. Сертификат истекает
   - Если Let's Encrypt сертификат истекает через 14 дней
   - Обновить автоматически

5. Высокая нагрузка
   - Если CPU > 80% или память > 85%
   - Запустить масштабирование
```

---

### 🔟 COMPLIANCE & REGULATIONS

#### A. GDPR (если пользователи из EU)

**Требования:**

```
✅ Right to be forgotten (пользователь может удалить свои данные)
✅ Right to access (пользователь может экспортировать свои данные)
✅ Right to portability (получить данные в стандартном формате)
✅ Consent management (получить согласие на обработку)
✅ Privacy policy (объяснить что вы делаете с данными)
✅ Notify of breach (уведомить за 72 часа при взломе)
```

**Штрафы за нарушение:**

```
- До €10 млн или 2% мировой выручки
- До €20 млн или 4% мировой выручки (при систематических нарушениях)
```

#### B. Privacy Policy & Terms of Service

**Что должно быть:**

```
Privacy Policy:
- Какие данные собираем?
- Как используем данные?
- Как долго храним?
- Каким компаниям передаем?
- Права пользователей (GDPR)

Terms of Service:
- Что запрещено?
- Что можно использовать?
- Отказ от ответственности
- Контактная информация
```

---

## 🎯 ПРИОРИТИЗАЦИЯ

### 🔴 КРИТИЧЕСКОЕ (ДЕЛАТЬ СЕЙЧАС!)

**Без этого приложение уязвимо для 90% атак:**

1. ✅ **HTTPS везде** (редирект с HTTP)
2. ✅ **Пароли через bcrypt** (минимум 12 символов)
3. ✅ **SQL injection защита** (ORM, не raw SQL)
4. ✅ **XSS защита** (React autoescape, не dangerouslySetInnerHTML)
5. ✅ **JWT с правильной expiration** (30 мин для access)
6. ✅ **Rate limiting на логин** (5 попыток за 15 минут)
7. ✅ **CORS только для доверенных доменов** (не "*")
8. ✅ **Логирование** (все попытки доступа)
9. ✅ **Security headers в Nginx** (X-Frame-Options, Content-Security-Policy)
10. ✅ **Input validation** (Pydantic)

**Время на реализацию:** 2-3 дня

---

### 🟡 ВАЖНОЕ (В ТЕЧЕНИЕ МЕСЯЦА)

**Усиливает защиту, но не критично:**

1. ✅ Refresh tokens (долгоживущие для обновления)
2. ✅ 2FA (двухфакторная аутентификация)
3. ✅ CAPTCHA на формах (защита от ботов)
4. ✅ Мониторинг и алерты (подозрительная активность)
5. ✅ Регулярные обновления зависимостей (npm audit)
6. ✅ SSH ключи вместо паролей (для сервера)
7. ✅ Firewall конфигурация (закрыть ненужные порты)
8. ✅ Шифрование чувствительных данных в БД (AES-256)
9. ✅ Регулярные бэкапы БД (ежедневно)
10. ✅ Тестирование восстановления (раз в месяц)

**Время на реализацию:** 2-3 недели

---

### 🟢 ЖЕЛАЕМОЕ (LONG-TERM)

**Для enterprise-уровня безопасности:**

1. ✅ Биометрическая аутентификация (Face ID, Touch ID)
2. ✅ Hardware security keys (U2F, FIDO2)
3. ✅ End-to-end encryption (е2е для чувствительных данных)
4. ✅ Penetration testing (профессиональный аудит)
5. ✅ Bug bounty программа (вознаграждение за найденные баги)
6. ✅ ISO 27001 сертификация (стандарт информационной безопасности)
7. ✅ SIEM (Security Information and Event Management)
8. ✅ Advanced threat detection (AI для обнаружения аномалий)

**Время на реализацию:** 2-3 месяца

---

## 📊 СРАВНЕНИЕ ПРИЛОЖЕНИЯ: ДО И ПОСЛЕ

### ДО ЗАЩИТЫ (Текущее состояние)

```
🔓 УЯЗВИМОСТИ:

1. Пароли: неизвестно, используется ли bcrypt
2. HTTP: нет (?) - данные открытым текстом?
3. SQL injection: использовать ORM, но может быть raw SQL?
4. XSS: React защищает, но нет CSP header?
5. CSRF: нет CSRF токенов?
6. Rate limiting: нет - возможен brute force
7. Логирование: базовое
8. Сертификат: Let's Encrypt (?)
9. Backup: неизвестно

РИСК: 🔴 ВЫСОКИЙ (возможен взлом)
```

### ПОСЛЕ ЗАЩИТЫ (После применения требований)

```
🔒 ЗАЩИТА:

1. Пароли: bcrypt с 12+ символами
2. HTTPS: с Let's Encrypt, auto-renewal
3. SQL injection: ORM, параметризованные запросы
4. XSS: React autoescape + CSP headers
5. CSRF: CSRF токены + SameSite=Strict
6. Rate limiting: 5 попыток в 15 минут
7. Логирование: централизованное (CloudWatch/ELK)
8. 2FA: SMS или Authenticator app
9. Backup: ежедневные, зашифрованные, в 2-3 местах
10. Мониторинг: алерты на подозрительную активность
11. Security headers: X-Frame-Options, CSP, HSTS
12. Biometric auth: Face ID / Touch ID на мобильных

РИСК: 🟢 НИЗКИЙ (защита от 95% атак)
```

---

## 💡 ПРАКТИЧЕСКИЕ СОВЕТЫ

### 1. Начните с критического

```
Не пытайтесь сделать всё сразу.
Сначала - базовая безопасность.
Потом - усиленная.
Потом - enterprise-уровень.
```

### 2. Автоматизируйте что возможно

```bash
# Автоматические обновления
sudo apt install unattended-upgrades

# Автоматический Let's Encrypt renewal
sudo certbot renew --dry-run

# npm audit каждую неделю
0 0 * * 0 cd /app && npm audit

# Бэкапы ежедневно
0 2 * * * /scripts/backup.sh
```

### 3. Тестируйте регулярно

```bash
# Раз в месяц:
- Тестировать восстановление из backup
- Тестировать 2FA
- Тестировать rate limiting
- Проверить логи на аномалии

# Раз в квартал:
- Penetration testing (попросить хакера атаковать)
- Security code review
- Vulnerability scanning (OWASP ZAP)
```

### 4. Документируйте всё

```
- Кто имеет доступ к чему?
- Какие пароли и ключи где хранятся?
- Как работает backup?
- Как восстановить из backup?
- Контактная информация (кто отвечает за безопасность?)
```

### 5. Обучайте команду

```
- Все должны знать про социальную инженерию
- Никакие пароли не пишут в сообщениях
- Не открывайте ссылки от неизвестных
- Всегда обновляйте свое ПО
- 2FA везде, где возможно
```

---

## 🚨 ЕСЛИ ПРОИЗОЙДЕТ ВЗЛОМ

**План действий:**

```
1. Немедленно: Отключить скомпрометированные аккаунты
2. В течение часа: Восстановить из последнего clean backup
3. В течение 24 часов: Уведомить пользователей
4. В течение 72 часов: Отправить официальное уведомление (GDPR требует)
5. В течение недели: Провести post-mortem анализ
6. В течение месяца: Внедрить меры для предотвращения повторения
```

---

## 📚 РЕСУРСЫ

**Изучение безопасности:**
- OWASP Top 10 (https://owasp.org/www-project-top-ten/)
- NIST Cybersecurity Framework (https://www.nist.gov/cyberframework)
- PortSwigger Web Security Academy (https://portswigger.net/web-security)
- HackTheBox (https://www.hackthebox.com/)

**Инструменты:**
- OWASP ZAP (сканирование уязвимостей)
- npm audit (проверка JavaScript)
- SonarQube (анализ кода)
- Snyk (уязвимости в зависимостях)

**Сертификации:**
- Certified Information Systems Security Professional (CISSP)
- Certified Ethical Hacker (CEH)
- Offensive Security Certified Professional (OSCP)

---

## ✅ ФИНАЛЬНЫЙ CHECKLIST

```
ПЕРЕД PRODUCTION РЕЛИЗОМ:

Authentication:
☐ JWT с 30 минутной expiration для access token
☐ Refresh token с 7 дневной expiration
☐ bcrypt с 12+ rounds для паролей
☐ Пароли: минимум 12 символов (CAPS + lower + цифры + спец)
☐ Rate limiting: 5 попыток за 15 минут на логин
☐ 2FA (SMS или Authenticator)

Encryption:
☐ HTTPS везде (редирект с HTTP на HTTPS)
☐ TLS 1.2+ (не старые версии)
☐ Let's Encrypt сертификат с auto-renewal
☐ Шифрование чувствительных данных в БД (AES-256)

API Security:
☐ Input validation (Pydantic)
☐ Output encoding (JSON escape)
☐ SQL injection защита (ORM)
☐ XSS защита (React autoescape, нет dangerouslySetInnerHTML)
☐ CSRF protection (CSRF токены)
☐ CORS только для доверенных доменов

Database:
☐ PostgreSQL на production (не SQLite)
☐ Только localhost/VPN доступ
☐ Сильный пароль
☐ Регулярные бэкапы (ежедневно)
☐ Шифрованные бэкапы
☐ Тестирование восстановления

Infrastructure:
☐ ОС обновлена (patches)
☐ Firewall включен и настроен
☐ SSH ключи (не пароли)
☐ SSH на нестандартном порту (не 22)
☐ Docker security (non-root)

Security Headers:
☐ X-Frame-Options: DENY
☐ X-Content-Type-Options: nosniff
☐ X-XSS-Protection: 1; mode=block
☐ Strict-Transport-Security: max-age=31536000
☐ Content-Security-Policy
☐ Referrer-Policy

Frontend:
☐ npm audit (нет vulnerabilities)
☐ Отключить source maps в production
☐ HttpOnly cookies для токенов
☐ SessionStorage для временных данных
☐ Минификация кода

Mobile:
☐ Secure storage (не AsyncStorage!)
☐ Certificate pinning
☐ Биометрическая аутентификация

Monitoring:
☐ Логирование всех событий
☐ Централизованные логи (CloudWatch/ELK)
☐ Алерты на подозрительную активность
☐ Uptime monitoring каждые 5 минут

Compliance:
☐ Privacy policy на сайте
☐ Terms of service
☐ GDPR compliance (если нужно)
☐ Incident response plan

Testing:
☐ Penetration testing
☐ Security code review
☐ Vulnerability scanning (OWASP ZAP)
☐ Load testing
☐ Backup recovery test
```

---

**Документ создан:** 19 октября 2025  
**Версия:** 2.0 (Развернутый ответ)  
**Тип:** Security Hardening - Полное руководство  
**Статус:** Ready for Implementation ✅

🔐 **Ваше приложение готово к защите!**
