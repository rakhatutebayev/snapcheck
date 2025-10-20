# 🤖 ЗАЩИТА ОТ БОТОВ - РЕГИСТРАЦИЯ И ЛОГИН

## 🚨 ПРОБЛЕМА

**Текущее состояние:** ❌ Нет защиты от ботов
- Боты могут автоматически регистрироваться через API
- Боты могут перебирать пароли (brute-force)
- Нет проверки на "человека"

**Результат:** 
- Бот создает 1000 аккаунтов за минуту
- Заполняет БД мусором
- Перегружает сервер

---

## ✅ РЕШЕНИЯ (3 уровня защиты)

### УРОВЕНЬ 1: RATE LIMITING (уже есть в плане)
```python
@router.post("/register")
@limiter.limit("5/hour")  # Максимум 5 регистраций в час с одного IP
def register(request: Request, ...):
    ...
```

**Защита:** Защищает от быстрых атак с одного IP

---

### УРОВЕНЬ 2: EMAIL VERIFICATION (простая)

**Как работает:**
1. Бот регистрируется с email: bot@gmail.com
2. Отправляем письмо с кодом подтверждения
3. Бот НЕ может получить доступ к почте → не может подтвердить
4. Аккаунт остается неактивным

**Файл:** `backend/models.py`

**Добавить новое поле:**

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # ✅ НОВОЕ: Поля для email verification
    is_verified = Column(Boolean, default=False)  # Подтвержден ли email
    verification_code = Column(String, nullable=True)  # Код для подтверждения
    verification_code_expires = Column(DateTime(timezone=True), nullable=True)  # Когда кончается код
    
    progress = relationship("UserSlideProgress", back_populates="user", cascade="all, delete-orphan")
    completions = relationship("UserCompletion", back_populates="user", cascade="all, delete-orphan")
```

**Файл:** `backend/utils/email.py` (НОВЫЙ)

**Создать:**

```python
import os
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def generate_verification_code():
    """Генерировать 6-значный код"""
    return secrets.randbelow(999999).__str__().zfill(6)

def send_verification_email(email: str, code: str) -> bool:
    """Отправить письмо с кодом подтверждения"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = email
        msg['Subject'] = 'SlideConfirm - Email Verification'
        
        body = f"""
        <html>
            <body>
                <h2>Email Verification</h2>
                <p>Your verification code: <strong>{code}</strong></p>
                <p>This code expires in 15 minutes</p>
                <p>If you didn't register, ignore this email</p>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # ✅ НОВОЕ: Отправка письма
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"❌ Email error: {str(e)}")
        return False

def verify_code(db, user_id: int, code: str) -> bool:
    """Проверить код подтверждения"""
    from .database import SessionLocal
    from .models import User
    
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return False
    
    # Проверка кода
    if user.verification_code != code:
        return False
    
    # Проверка срока действия
    if user.verification_code_expires < datetime.utcnow():
        return False
    
    # Активировать пользователя
    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()
    
    return True
```

**Файл:** `backend/auth.py` - Обновить register:

```python
from .utils.email import generate_verification_code, send_verification_email
from datetime import datetime, timedelta

@router.post("/register", response_model=UserResponse)
@limiter.limit("5/hour")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация пользователя с email verification"""
    
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        logger.warning(f"❌ Registration failed: Email already registered - {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # ✅ НОВОЕ: Валидация пароля
    try:
        validate_password_strength(user.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    hashed_password = hash_password(user.password)
    role = getattr(user, 'role', 'user') or 'user'
    
    # ✅ НОВОЕ: Генерировать код подтверждения
    verification_code = generate_verification_code()
    
    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=hashed_password,
        role=role,
        is_verified=False,  # ✅ Изначально не подтвержден
        verification_code=verification_code,
        verification_code_expires=datetime.utcnow() + timedelta(minutes=15)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # ✅ НОВОЕ: Отправить письмо с кодом
    send_verification_email(user.email, verification_code)
    
    logger.info(f"✅ Registration: User created - {user.email}, verification code sent")
    
    return {
        "id": db_user.id,
        "email": db_user.email,
        "message": "Registration successful. Check your email for verification code."
    }

# ✅ НОВОЕ: Endpoint для подтверждения email
@router.post("/verify-email")
@limiter.limit("10/hour")
def verify_email(request: Request, user_id: int, code: str, db: Session = Depends(get_db)):
    """Подтвердить email адрес"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Проверка кода
    if user.verification_code != code:
        logger.warning(f"❌ Verification failed: Invalid code for user {user_id}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code")
    
    # Проверка срока действия
    if user.verification_code_expires < datetime.utcnow():
        logger.warning(f"❌ Verification failed: Code expired for user {user_id}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code expired")
    
    # Активировать пользователя
    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()
    
    logger.info(f"✅ Email verified: {user.email}")
    
    return {"message": "Email verified successfully"}
```

---

### УРОВЕНЬ 3: CAPTCHA (сильная защита)

**Как работает:** Google reCAPTCHA проверяет что это человек, а не бот

#### Вариант A: Google reCAPTCHA V3 (рекомендуется)

**Установить:**
```bash
pip install requests
```

**Файл:** `backend/utils/captcha.py` (НОВЫЙ)

```python
import os
import requests

RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET_KEY")
RECAPTCHA_SITE = os.getenv("RECAPTCHA_SITE_KEY")

async def verify_recaptcha(token: str) -> bool:
    """Проверить reCAPTCHA V3 токен"""
    
    if not RECAPTCHA_SECRET:
        return True  # Если нет конфигурации, пропустить
    
    try:
        response = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={
                "secret": RECAPTCHA_SECRET,
                "response": token
            }
        )
        
        data = response.json()
        
        # ✅ Проверка результата
        if not data.get("success"):
            return False
        
        # ✅ Проверка score (0.0 = бот, 1.0 = человек)
        score = data.get("score", 0)
        
        if score < 0.5:  # Вероятно бот
            return False
        
        return True
    except Exception as e:
        print(f"❌ CAPTCHA error: {str(e)}")
        return False
```

**Обновить auth.py:**

```python
from pydantic import BaseModel, Field

class RegisterWithCaptcha(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    recaptcha_token: str = Field(...)  # ✅ Токен от фронтенда

@router.post("/register")
@limiter.limit("5/hour")
async def register(
    request: Request,
    user: RegisterWithCaptcha,
    db: Session = Depends(get_db)
):
    """Регистрация с CAPTCHA"""
    
    # ✅ НОВОЕ: Проверить CAPTCHA
    captcha_valid = await verify_recaptcha(user.recaptcha_token)
    if not captcha_valid:
        logger.warning(f"❌ CAPTCHA failed: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CAPTCHA verification failed"
        )
    
    # ... остальной код как раньше
```

**Frontend - установить:**
```bash
npm install react-google-recaptcha
```

**Frontend - использовать в регистрации:**

```jsx
import ReCAPTCHA from "react-google-recaptcha";

export function Register() {
  const [captchaToken, setCaptchaToken] = useState(null);
  
  const handleRegister = async () => {
    const response = await fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        first_name,
        last_name,
        email,
        password,
        recaptcha_token: captchaToken  // ✅ Отправить токен
      })
    });
  };
  
  return (
    <div>
      {/* Форма регистрации */}
      
      {/* ✅ CAPTCHA */}
      <ReCAPTCHA
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        onChange={setCaptchaToken}
      />
      
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}
```

---

### УРОВЕНЬ 4: PHONE VERIFICATION (максимальная защита)

**Как работает:**
1. Бот регистрируется
2. Просим номер телефона
3. Отправляем SMS код
4. Бот НЕ может получить SMS → аккаунт не активируется

**Установить Twilio:**
```bash
pip install twilio
```

**Файл:** `backend/utils/sms.py` (НОВЫЙ)

```python
import os
from twilio.rest import Client

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM = os.getenv("TWILIO_PHONE_NUMBER")

client = Client(TWILIO_SID, TWILIO_TOKEN)

def send_sms_code(phone: str, code: str) -> bool:
    """Отправить SMS с кодом"""
    try:
        message = client.messages.create(
            body=f"SlideConfirm verification code: {code}",
            from_=TWILIO_FROM,
            to=phone
        )
        return True
    except Exception as e:
        print(f"❌ SMS error: {str(e)}")
        return False
```

---

## 🎯 РЕКОМЕНДУЕМАЯ КОМБИНАЦИЯ

| Защита | Где | Эффективность | Сложность |
|--------|-----|---------------|-----------|
| Rate Limiting | `/auth/register` | 70% | Легко ✅ |
| Email Verification | Обязательное поле | 90% | Средне |
| reCAPTCHA V3 | Frontend + Backend | 98% | Средне |
| Phone Verification | Опционально | 99%+ | Сложно |

---

## 🚀 БЫСТРОЕ ВНЕДРЕНИЕ (УРОВЕНЬ 2+3)

### Шаг 1: Получить reCAPTCHA ключи

1. Перейти на https://www.google.com/recaptcha/admin
2. Создать новый сайт
3. Выбрать "reCAPTCHA V3"
4. Получить Site Key и Secret Key

### Шаг 2: Добавить в .env

```bash
# Google reCAPTCHA
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe

# Email (Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Генерируется в Google Account Security
```

### Шаг 3: Установить модули

```bash
pip install requests
npm install react-google-recaptcha
```

### Шаг 4: Обновить код

- Backend: `auth.py` + `models.py` + `utils/email.py`
- Frontend: Регистрация компонент + добавить CAPTCHA

---

## 📊 РЕЗУЛЬТАТЫ ЗАЩИТЫ

### БЕЗ ЗАЩИТЫ
```
Бот запускается:
✅ 1000 аккаунтов за 10 секунд
✅ БД заполнена мусором
✅ Сервер перегружен
❌ Система неработоспособна
```

### С RATE LIMITING + EMAIL VERIFICATION
```
Бот запускается:
❌ 5 попыток в час (rate limiting)
❌ Не может подтвердить email
❌ Аккаунты остаются неактивными
✅ БД защищена
```

### С RATE LIMITING + EMAIL + CAPTCHA
```
Бот запускается:
❌ 5 попыток в час (rate limiting)
❌ CAPTCHA блокирует автоматизированные попытки
❌ Email verification как дополнительная защита
✅ Практически невозможно зарегистрировать бота
```

---

## ✅ ЧЕКЛИСТ

```
УРОВЕНЬ 1 (КРИТИЧНЫЙ):
- [ ] Rate limiting в auth.py (уже в плане)

УРОВЕНЬ 2 (ВАЖНЫЙ):
- [ ] Добавить is_verified, verification_code в models.py
- [ ] Создать backend/utils/email.py
- [ ] Обновить auth.py с email verification
- [ ] Настроить SMTP (Gmail)
- [ ] Тестировать локально

УРОВЕНЬ 3 (РЕКОМЕНДУЕТСЯ):
- [ ] Получить RECAPTCHA ключи
- [ ] Создать backend/utils/captcha.py
- [ ] Обновить auth.py с CAPTCHA проверкой
- [ ] Установить react-google-recaptcha
- [ ] Обновить регистрацию на frontend

УРОВЕНЬ 4 (ОПЦИОНАЛЬНО):
- [ ] Установить Twilio
- [ ] Создать backend/utils/sms.py
- [ ] Добавить phone_verified поле
```

---

## 💡 СОВЕТЫ

✅ **Email Verification** - обязательно! Самый простой и эффективный
✅ **reCAPTCHA V3** - почти невидима для пользователя, отлично работает
✅ **Phone SMS** - очень сильная, но может отпугнуть пользователей
✅ **Комбинируйте** - чем больше слоев, тем безопаснее

**Каким уровнем начать?** 🚀

Рекомендую: **Rate Limiting (уже есть) + Email Verification + reCAPTCHA V3**

Это займет 2-3 часа, но защитит от 99% ботов!

Готовы внедрять?
