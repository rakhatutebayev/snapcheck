# 📚 Универсальное руководство для веб-проектов

> Полное руководство по созданию современного веб-приложения с React + FastAPI
> 
> Создано на основе опыта разработки проекта SnapCheck (SlideConfirm)
> 
> **Можно использовать для любого проекта!**

---

## 📖 Содержание

1. [Система дизайна](#-система-дизайна)
2. [Email уведомления](#-email-уведомления)
3. [Деплоймент](#-деплоймент)
4. [Безопасность](#-безопасность)
5. [Лучшие практики](#-лучшие-практики)

---

## 🎨 Система дизайна

### Структура файлов

```
frontend/src/styles/
├── typography.css      # Типографика (шрифты, размеры, стили текста)
├── design-system.css   # Цвета, отступы, тени, компоненты
└── index.css          # Главный файл (импортирует все)
```

### Типографика

#### Заголовки
```jsx
<h1 className="heading-1">Главный заголовок</h1>      {/* 36px → 30px mobile */}
<h2 className="heading-2">Заголовок секции</h2>       {/* 30px → 24px mobile */}
<h3 className="heading-3">Подзаголовок</h3>           {/* 24px → 20px mobile */}
<h4 className="heading-4">Заголовок карточки</h4>     {/* 20px */}
```

#### Текст
```jsx
<p className="text-body">Обычный текст</p>            {/* 16px */}
<p className="text-lead">Большой текст</p>            {/* 18px */}
<span className="text-small">Мелкий текст</span>      {/* 14px */}
<span className="text-tiny">Очень мелкий</span>       {/* 12px */}
<code className="text-mono">const x = 42;</code>      {/* Моноширинный */}
```

#### Стили текста
```jsx
<span className="font-bold">Жирный</span>
<span className="font-semibold">Полужирный</span>
<span className="font-medium">Средний</span>
<span className="text-uppercase">UPPERCASE</span>
<div className="text-truncate">Длинный текст...</div>
<div className="text-clamp-2">Текст на 2 строки...</div>
```

#### Цвета текста
```jsx
<span className="text-primary">Синий (основной)</span>
<span className="text-success">Зеленый (успех)</span>
<span className="text-danger">Красный (ошибка)</span>
<span className="text-warning">Оранжевый (предупреждение)</span>
<span className="text-info">Голубой (инфо)</span>
<span className="text-muted">Серый (приглушенный)</span>
```

### Компоненты

#### Кнопки
```jsx
{/* Варианты */}
<button className="btn btn-primary">Сохранить</button>
<button className="btn btn-success">Подтвердить</button>
<button className="btn btn-danger">Удалить</button>
<button className="btn btn-secondary">Отмена</button>
<button className="btn btn-outline">Подробнее</button>
<button className="btn btn-ghost">Закрыть</button>

{/* Размеры */}
<button className="btn btn-primary btn-sm">Маленькая</button>
<button className="btn btn-primary">Обычная</button>
<button className="btn btn-primary btn-lg">Большая</button>

{/* С иконкой */}
<button className="btn btn-primary">
  <CheckIcon size={20} />
  Сохранить
</button>
```

#### Карточки
```jsx
<div className="card">
  <div className="card-header">
    <h3 className="heading-4">Заголовок</h3>
  </div>
  <div className="card-body">
    <p>Содержимое карточки</p>
  </div>
  <div className="card-footer">
    <button className="btn btn-primary">Действие</button>
  </div>
</div>
```

#### Инпуты
```jsx
<label className="label label-required">Email</label>
<input type="email" className="input" placeholder="your@email.com" />

{/* С ошибкой */}
<input type="text" className="input input-error" />
<p className="text-small text-danger">Поле обязательно</p>
```

#### Бейджи
```jsx
<span className="badge badge-primary">Новое</span>
<span className="badge badge-success">Активно</span>
<span className="badge badge-danger">Ошибка</span>
<span className="badge badge-warning">Ожидание</span>
<span className="badge badge-info">Инфо</span>
<span className="badge badge-gray">Архив</span>
```

#### Алерты
```jsx
<div className="alert alert-success">
  <CheckCircle size={20} />
  <p>Успешно сохранено!</p>
</div>

<div className="alert alert-danger">
  <XCircle size={20} />
  <p>Произошла ошибка</p>
</div>

<div className="alert alert-warning">
  <AlertCircle size={20} />
  <p>Внимание! Проверьте данные</p>
</div>

<div className="alert alert-info">
  <Info size={20} />
  <p>Полезная информация</p>
</div>
```

### CSS переменные

```css
/* Цвета */
var(--color-primary-600)    /* Основной синий */
var(--color-success-600)    /* Зеленый */
var(--color-danger-600)     /* Красный */
var(--color-warning-600)    /* Оранжевый */
var(--color-gray-100)       /* Светлый фон */
var(--color-gray-300)       /* Границы */
var(--color-gray-600)       /* Текст */

/* Отступы */
var(--spacing-2)   /* 8px */
var(--spacing-4)   /* 16px */
var(--spacing-6)   /* 24px */
var(--spacing-8)   /* 32px */

/* Скругления */
var(--radius-sm)   /* 4px */
var(--radius-md)   /* 8px */
var(--radius-lg)   /* 12px */
var(--radius-xl)   /* 16px */

/* Тени */
var(--shadow-sm)   /* Маленькая */
var(--shadow-md)   /* Средняя */
var(--shadow-lg)   /* Большая */
```

### Утилиты

```jsx
{/* Отступы */}
<div className="p-4">Padding 16px</div>
<div className="m-4">Margin 16px</div>
<div className="mt-4">Margin top 16px</div>
<div className="mb-4">Margin bottom 16px</div>

{/* Скругления */}
<div className="rounded">4px</div>
<div className="rounded-lg">8px</div>
<div className="rounded-xl">12px</div>
<div className="rounded-full">Круг</div>

{/* Тени */}
<div className="shadow">Обычная</div>
<div className="shadow-md">Средняя</div>
<div className="shadow-lg">Большая</div>

{/* Фоны */}
<div className="bg-primary">Синий</div>
<div className="bg-success">Зеленый</div>
<div className="bg-white">Белый</div>

{/* Анимации */}
<div className="animate-fade-in">Появление</div>
<div className="animate-slide-down">Выезд</div>
<div className="animate-spin">Вращение</div>
```

### Готовые примеры

#### Форма входа
```jsx
<div className="card" style={{maxWidth: '400px'}}>
  <div className="card-header">
    <h2 className="heading-2">Вход в систему</h2>
  </div>
  <div className="card-body">
    <form>
      <div className="mb-4">
        <label className="label label-required">Email</label>
        <input type="email" className="input" placeholder="your@email.com" />
      </div>
      
      <div className="mb-4">
        <label className="label label-required">Пароль</label>
        <input type="password" className="input" placeholder="••••••••" />
      </div>
      
      <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
        Войти
      </button>
    </form>
  </div>
</div>
```

#### Карточка пользователя
```jsx
<div className="card">
  <div className="card-body">
    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
      <div className="w-12 h-12 rounded-full bg-primary-light"></div>
      <div>
        <h4 className="heading-4">Иван Иванов</h4>
        <p className="text-small text-muted">ivan@company.com</p>
      </div>
      <span className="badge badge-success">Активен</span>
    </div>
  </div>
</div>
```

---

## 📧 Email уведомления

### Архитектура

```
backend/
├── email_models.py      # SQLAlchemy модели (EmailSettings, EmailLog)
├── email_service.py     # Сервис отправки (OAuth2 + SMTP)
└── email_api.py         # REST API endpoints
```

### Backend: Модели

```python
# email_models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from database import Base
from datetime import datetime

class EmailSettings(Base):
    __tablename__ = "email_settings"
    
    id = Column(Integer, primary_key=True)
    provider = Column(String, nullable=False)  # smtp, office365, google
    
    # OAuth2 (для office365/google)
    client_id = Column(String)
    client_secret = Column(String)
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expires_at = Column(DateTime)
    
    # SMTP (для smtp)
    smtp_host = Column(String)
    smtp_port = Column(Integer)
    smtp_username = Column(String)
    smtp_password = Column(String)
    smtp_use_tls = Column(Boolean, default=True)
    
    # Общие настройки
    from_email = Column(String, nullable=False)
    from_name = Column(String, default="System")
    notification_recipients = Column(JSON)  # ["email1", "email2"]
    
    # Флаги уведомлений
    enabled = Column(Boolean, default=True)
    notify_on_registration = Column(Boolean, default=True)
    notify_on_completion = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id = Column(Integer, primary_key=True)
    recipient = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    event_type = Column(String)  # registration, completion, test
    status = Column(String)  # sent, failed
    error_message = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow)
```

### Backend: Email Service

```python
# email_service.py
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

class EmailService:
    def __init__(self, db):
        self.db = db
        self.settings = db.query(EmailSettings).first()
    
    def _refresh_oauth_token(self):
        """Автоматическое обновление OAuth токенов"""
        if not self.settings.refresh_token:
            return False
        
        if self.settings.provider == "office365":
            # Microsoft Graph API
            token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
            data = {
                "client_id": self.settings.client_id,
                "client_secret": self.settings.client_secret,
                "refresh_token": self.settings.refresh_token,
                "grant_type": "refresh_token",
                "scope": "https://graph.microsoft.com/Mail.Send offline_access"
            }
        elif self.settings.provider == "google":
            # Google OAuth2
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "client_id": self.settings.client_id,
                "client_secret": self.settings.client_secret,
                "refresh_token": self.settings.refresh_token,
                "grant_type": "refresh_token"
            }
        
        response = requests.post(token_url, data=data)
        if response.status_code == 200:
            tokens = response.json()
            self.settings.access_token = tokens["access_token"]
            self.settings.token_expires_at = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))
            self.db.commit()
            return True
        return False
    
    def send_email(self, to_email, subject, html_content):
        """Универсальная отправка email"""
        if not self.settings or not self.settings.enabled:
            return False
        
        try:
            if self.settings.provider == "smtp":
                return self._send_via_smtp(to_email, subject, html_content)
            elif self.settings.provider == "office365":
                return self._send_via_office365(to_email, subject, html_content)
            elif self.settings.provider == "google":
                return self._send_via_google(to_email, subject, html_content)
        except Exception as e:
            self._log_email(to_email, subject, "failed", str(e))
            return False
    
    def _send_via_smtp(self, to_email, subject, html_content):
        """SMTP отправка"""
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{self.settings.from_name} <{self.settings.from_email}>"
        msg['To'] = to_email
        
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port) as server:
            if self.settings.smtp_use_tls:
                server.starttls()
            server.login(self.settings.smtp_username, self.settings.smtp_password)
            server.send_message(msg)
        
        self._log_email(to_email, subject, "sent")
        return True
    
    def _send_via_office365(self, to_email, subject, html_content):
        """Office 365 Graph API отправка"""
        # Проверка и обновление токена
        if datetime.utcnow() >= self.settings.token_expires_at:
            self._refresh_oauth_token()
        
        url = "https://graph.microsoft.com/v1.0/me/sendMail"
        headers = {
            "Authorization": f"Bearer {self.settings.access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "message": {
                "subject": subject,
                "body": {"contentType": "HTML", "content": html_content},
                "toRecipients": [{"emailAddress": {"address": to_email}}]
            }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 202:
            self._log_email(to_email, subject, "sent")
            return True
        return False
    
    def _log_email(self, recipient, subject, status, error=None):
        """Логирование отправок"""
        log = EmailLog(
            recipient=recipient,
            subject=subject,
            status=status,
            error_message=error
        )
        self.db.add(log)
        self.db.commit()
```

### Frontend: Email настройки

```jsx
// EmailSettings.jsx
import { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';

// SMTP пресеты для быстрой настройки
const smtpPresets = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    tls: true,
    info: 'Используйте App Password: https://myaccount.google.com/apppasswords'
  },
  yandex: {
    name: 'Яндекс',
    host: 'smtp.yandex.ru',
    port: 587,
    tls: true
  },
  mailru: {
    name: 'Mail.ru',
    host: 'smtp.mail.ru',
    port: 587,
    tls: true
  },
  outlook: {
    name: 'Outlook',
    host: 'smtp-mail.outlook.com',
    port: 587,
    tls: true
  }
};

function EmailSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const applyPreset = (presetKey) => {
    const preset = smtpPresets[presetKey];
    setSettings(prev => ({
      ...prev,
      provider: 'smtp',
      smtp_host: preset.host,
      smtp_port: preset.port,
      smtp_use_tls: preset.tls
    }));
  };
  
  const saveSettings = async () => {
    setLoading(true);
    try {
      await api.post('/admin/email/settings', settings);
      alert('✅ Настройки сохранены!');
    } catch (error) {
      alert('❌ Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="heading-2">
          <Mail size={24} />
          Email уведомления
        </h2>
      </div>
      
      <div className="card-body">
        {/* Быстрая настройка */}
        <div className="mb-6">
          <h3 className="heading-4 mb-3">⚡ Быстрая настройка</h3>
          <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
            {Object.entries(smtpPresets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="btn btn-outline btn-sm"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Провайдер */}
        <div className="mb-4">
          <label className="label label-required">Провайдер</label>
          <select
            className="input"
            value={settings?.provider || 'smtp'}
            onChange={(e) => setSettings({...settings, provider: e.target.value})}
          >
            <option value="smtp">SMTP</option>
            <option value="office365">Office 365</option>
            <option value="google">Google</option>
          </select>
        </div>
        
        {/* SMTP настройки */}
        {settings?.provider === 'smtp' && (
          <>
            <div className="mb-4">
              <label className="label">SMTP Host</label>
              <input
                type="text"
                className="input"
                value={settings?.smtp_host || ''}
                onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div className="mb-4">
              <label className="label">SMTP Port</label>
              <input
                type="number"
                className="input"
                value={settings?.smtp_port || 587}
                onChange={(e) => setSettings({...settings, smtp_port: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                value={settings?.smtp_username || ''}
                onChange={(e) => setSettings({...settings, smtp_username: e.target.value})}
                placeholder="your-email@gmail.com"
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={settings?.smtp_password || ''}
                onChange={(e) => setSettings({...settings, smtp_password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            
            <div className="mb-4">
              <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <input
                  type="checkbox"
                  checked={settings?.smtp_use_tls || false}
                  onChange={(e) => setSettings({...settings, smtp_use_tls: e.target.checked})}
                />
                <span>Use TLS</span>
              </label>
            </div>
          </>
        )}
        
        {/* From Email */}
        <div className="mb-4">
          <label className="label label-required">From Email</label>
          <input
            type="email"
            className="input"
            value={settings?.from_email || ''}
            onChange={(e) => setSettings({...settings, from_email: e.target.value})}
            placeholder="noreply@company.com"
          />
        </div>
        
        {/* Получатели */}
        <div className="mb-4">
          <label className="label">Получатели уведомлений</label>
          <input
            type="text"
            className="input"
            placeholder="admin1@company.com, admin2@company.com"
          />
        </div>
        
        {/* Флаги уведомлений */}
        <div className="mb-6">
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
            <input type="checkbox" checked={settings?.enabled} />
            <span>Включить email уведомления</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
            <input type="checkbox" checked={settings?.notify_on_registration} />
            <span>Уведомлять о регистрации</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <input type="checkbox" checked={settings?.notify_on_completion} />
            <span>Уведомлять о завершении</span>
          </label>
        </div>
        
        {/* Кнопки */}
        <div style={{display: 'flex', gap: '1rem'}}>
          <button
            onClick={saveSettings}
            disabled={loading}
            className="btn btn-primary"
          >
            <Send size={20} />
            Сохранить настройки
          </button>
          
          <button className="btn btn-secondary">
            <Mail size={20} />
            Отправить тест
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailSettings;
```

### Быстрая настройка SMTP

#### Gmail (рекомендуется)
```
1. Включите 2FA: https://myaccount.google.com/security
2. Создайте App Password: https://myaccount.google.com/apppasswords
3. В настройках используйте:
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: [16-значный App Password]
   TLS: ✓
```

#### Яндекс
```
Host: smtp.yandex.ru
Port: 587
Username: your-email@yandex.ru
Password: [обычный пароль]
TLS: ✓
```

#### Mail.ru
```
Host: smtp.mail.ru
Port: 587
Username: your-email@mail.ru
Password: [обычный пароль]
TLS: ✓
```

---

## 🚀 Деплоймент

### Docker Compose структура

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      SECRET_KEY: ${SECRET_KEY}
      ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 30
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - postgres
    networks:
      - app_network
    restart: unless-stopped

  frontend:
    build: ./frontend
    depends_on:
      - backend
    networks:
      - app_network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - app_network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  app_network:
    driver: bridge
```

### Nginx конфигурация

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    upstream backend {
        server backend:8000;
    }
    
    upstream frontend {
        server frontend:3000;
    }
    
    server {
        listen 80;
        server_name your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name your-domain.com;
        
        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # Uploads
        location /uploads {
            alias /app/uploads;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
        
        # Static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Run migrations and start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Environment файл

```.env
# .env (НЕ коммитить в git!)
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secure_password_here
SECRET_KEY=your-secret-key-min-32-characters
```

### Деплой на сервер

```bash
# 1. Подключитесь к серверу
ssh root@your-server-ip

# 2. Установите Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install docker-compose-plugin

# 3. Клонируйте проект
git clone https://github.com/your-repo/your-project.git
cd your-project

# 4. Создайте .env файл
nano .env
# (скопируйте содержимое из примера выше)

# 5. Запустите проект
docker compose up -d --build

# 6. Проверьте статус
docker compose ps
docker compose logs -f

# 7. Настройте SSL с Let's Encrypt
apt-get install certbot
certbot certonly --standalone -d your-domain.com
```

### Обновление проекта

```bash
# На сервере
cd /opt/your-project
git pull
docker compose down
docker compose up -d --build
```

---

## 🔒 Безопасность

### JWT Authentication

```python
# backend/utils/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "your-secret-key-min-32-characters"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception
```

### CORS настройка

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS для разработки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Для production используйте конкретные домены:
# allow_origins=["https://your-domain.com"]
```

### SQL Injection защита

```python
# ✅ ПРАВИЛЬНО: Используйте ORM
user = db.query(User).filter(User.email == email).first()

# ❌ НЕПРАВИЛЬНО: Прямой SQL
db.execute(f"SELECT * FROM users WHERE email = '{email}'")
```

### XSS защита

```jsx
// React автоматически экранирует текст
<div>{userInput}</div>  // ✅ Безопасно

// ⚠️ Опасно: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✅ Если нужен HTML, используйте sanitizer
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

### Rate Limiting

```python
# backend/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/login")
@limiter.limit("5/minute")  # Максимум 5 попыток в минуту
async def login(request: Request):
    # ...
    pass
```

---

## ✨ Лучшие практики

### Структура проекта

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/      # Переиспользуемые компоненты
│   │   ├── pages/          # Страницы
│   │   ├── styles/         # Стили (design system)
│   │   ├── utils/          # Утилиты (api.js, helpers)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── models/             # SQLAlchemy модели
│   ├── routers/            # API endpoints (auth, users, etc.)
│   ├── utils/              # Утилиты (security, email)
│   ├── alembic/            # Миграции БД
│   ├── database.py         # Подключение к БД
│   ├── main.py             # FastAPI app
│   └── requirements.txt
├── docker-compose.yml
├── nginx.conf
├── .env
├── .gitignore
└── README.md
```

### Git лучшие практики

```bash
# .gitignore
# Environment
.env
.env.local

# Dependencies
node_modules/
__pycache__/
*.pyc
venv/

# Build
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Uploads
uploads/
```

### Коммиты

```bash
# ✅ Хорошие коммиты
git commit -m "feat: add email notifications"
git commit -m "fix: resolve login error"
git commit -m "docs: update README"
git commit -m "refactor: improve email service"
git commit -m "style: apply design system"

# ❌ Плохие коммиты
git commit -m "updates"
git commit -m "fix"
git commit -m "asdasd"
```

### API дизайн

```python
# ✅ RESTful endpoints
GET    /api/users          # Список пользователей
GET    /api/users/{id}     # Один пользователь
POST   /api/users          # Создать пользователя
PUT    /api/users/{id}     # Обновить пользователя
DELETE /api/users/{id}     # Удалить пользователя

# Вложенные ресурсы
GET    /api/users/{id}/presentations
POST   /api/users/{id}/presentations
```

### React компоненты

```jsx
// ✅ Хорошая структура компонента
import { useState, useEffect } from 'react';

function UserCard({ user }) {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Логика при монтировании
  }, []);
  
  const handleAction = async () => {
    setLoading(true);
    try {
      // Действие
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card">
      <div className="card-body">
        <h3 className="heading-3">{user.name}</h3>
        <p className="text-small text-muted">{user.email}</p>
        <button
          onClick={handleAction}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Загрузка...' : 'Действие'}
        </button>
      </div>
    </div>
  );
}

export default UserCard;
```

### Обработка ошибок

```python
# Backend
@app.post("/api/users")
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Валидация
        if db.query(User).filter(User.email == user.email).first():
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )
        
        # Создание
        new_user = User(**user.dict())
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"message": "User created", "user": new_user}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

```jsx
// Frontend
const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    alert('✅ Пользователь создан!');
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      alert('❌ Email уже существует');
    } else {
      alert('❌ Ошибка сервера: ' + error.message);
    }
    throw error;
  }
};
```

### Environment переменные

```python
# backend/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
```

```javascript
// frontend/src/config.js
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MyApp';
```

---

## 📝 Заключение

Этот документ содержит все лучшие практики из реального проекта SnapCheck.

### Что включено:
✅ Готовая система дизайна (typography + components)
✅ Email уведомления (SMTP + OAuth2)
✅ Docker деплоймент
✅ Безопасность (JWT, CORS, Rate Limiting)
✅ Лучшие практики разработки

### Как использовать:
1. Скопируйте CSS файлы для дизайна
2. Адаптируйте email систему под свои нужды
3. Используйте Docker Compose для деплоя
4. Следуйте best practices

### Дополнительные ресурсы:
- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Docker Documentation](https://docs.docker.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Создано с ❤️ на основе проекта SnapCheck**

**Версия:** 1.0
**Дата:** Октябрь 2025
**Лицензия:** MIT

**Вопросы?** Используйте этот документ как базу для своего проекта!

