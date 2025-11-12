# 🚀 Production Deploy Guide - SnapCheck

Полное руководство по созданию production версии и развёртыванию на Ubuntu.

## 📋 Содержание

1. [Структура production проекта](#структура-production-проекта)
2. [Docker и Docker Compose](#docker-и-docker-compose)
3. [Nginx конфигурация](#nginx-конфигурация)
4. [SystemD сервисы](#systemd-сервисы)
5. [Скрипт установки](#скрипт-установки)
6. [Мониторинг и логирование](#мониторинг-и-логирование)
7. [Резервное копирование](#резервное-копирование)
8. [Обновление приложения](#обновление-приложения)

## Структура Production проекта

```
/opt/snapcheck/
├── app/                          # Основное приложение
│   ├── backend/                  # FastAPI backend
│   ├── frontend/                 # React frontend (собранный)
│   └── docker-compose.yml        # Docker Compose конфиг
├── config/
│   ├── nginx.conf               # Nginx конфиг
│   ├── supervisor/              # Supervisor конфиги (опционально)
│   └── systemd/                 # SystemD unit файлы
├── data/
│   ├── db/                      # SQLite БД
│   ├── uploads/                 # Загруженные файлы
│   └── backups/                 # Резервные копии
├── logs/
│   ├── backend.log
│   ├── frontend.log
│   └── nginx/
├── scripts/
│   ├── install.sh              # Скрипт установки
│   ├── update.sh               # Скрипт обновления
│   ├── backup.sh               # Скрипт резервного копирования
│   └── health-check.sh         # Проверка здоровья
└── README.md                    # Документация
```

## Docker и Docker Compose

### Dockerfile для Backend

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Установка зависимостей системы
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Копирование requirements.txt
COPY backend/requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копирование приложения
COPY backend/ .

# Переменные окружения
ENV PYTHONUNBUFFERED=1
ENV WORKERS=4

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Запуск приложения
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Dockerfile для Frontend

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

# Build production версию
RUN npm run build

# Production образ с Nginx
FROM nginx:alpine

# Копирование Nginx конфига
COPY config/nginx-docker.conf /etc/nginx/conf.d/default.conf

# Копирование собранного приложения
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: snapcheck-backend
    ports:
      - "8000:8000"
    volumes:
      - ./data/db:/app/data/db
      - ./data/uploads:/tmp/snapcheck_uploads
      - ./logs:/app/logs
    environment:
      - DATABASE_URL=sqlite:///./data/db/snapcheck.db
      - ENVIRONMENT=production
      - LOG_LEVEL=info
    restart: unless-stopped
    networks:
      - snapcheck-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: snapcheck-frontend
    ports:
      - "80:80"
    volumes:
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - snapcheck-network

  nginx-reverse-proxy:
    image: nginx:alpine
    container_name: snapcheck-nginx-proxy
    ports:
      - "443:443"
    volumes:
      - ./config/nginx-reverse-proxy.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - snapcheck-network

networks:
  snapcheck-network:
    driver: bridge

volumes:
  db_data:
  uploads_data:
```

## Nginx конфигурация

### nginx-reverse-proxy.conf (HTTPS, SSL/TLS)

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Логирование
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1000;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

    # Upstream backends
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    # Редирект с HTTP на HTTPS
    server {
        listen 80;
        server_name _;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS сервер
    server {
        listen 443 ssl http2;
        server_name snapcheck.example.com;

        # SSL сертификаты
        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;
        
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            limit_req zone=general_limit burst=50 nodelay;
        }

        # API Backend
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # API rate limiting
            limit_req zone=api_limit burst=20 nodelay;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }
    }
}
```

## SystemD сервисы

### /etc/systemd/system/snapcheck.service

```ini
[Unit]
Description=SnapCheck Docker Compose Service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=simple
User=snapcheck
WorkingDirectory=/opt/snapcheck
ExecStart=/usr/bin/docker-compose up
ExecStop=/usr/bin/docker-compose down
Restart=always
RestartSec=10

Environment="COMPOSE_PROJECT_NAME=snapcheck"

[Install]
WantedBy=multi-user.target
```

## Скрипт установки

### install.sh

```bash
#!/bin/bash

set -e

echo "🚀 SnapCheck Production Installation"
echo "======================================="

# Проверка прав
if [[ $EUID -ne 0 ]]; then
   echo "❌ Скрипт должен быть запущен от root"
   exit 1
fi

# Обновление системы
echo "📦 Обновление системы..."
apt-get update
apt-get upgrade -y

# Установка зависимостей
echo "📦 Установка зависимостей..."
apt-get install -y \
    docker.io \
    docker-compose \
    nginx \
    curl \
    git \
    certbot \
    python3-certbot-nginx

# Создание пользователя
echo "👤 Создание пользователя snapcheck..."
useradd -m -s /bin/bash snapcheck 2>/dev/null || true

# Создание директорий
echo "📁 Создание директорий..."
mkdir -p /opt/snapcheck/{app,config,data/db,data/uploads,logs,scripts}

# Установка прав
chown -R snapcheck:snapcheck /opt/snapcheck

# Копирование приложения
echo "📋 Копирование приложения..."
# Здесь должны быть ваши скрипты копирования

# Установка SSL сертификата (Let's Encrypt)
echo "🔒 Генерация SSL сертификата..."
certbot certonly --standalone \
    -d snapcheck.example.com \
    --email admin@example.com \
    --agree-tos -q

# Копирование сертификатов
cp /etc/letsencrypt/live/snapcheck.example.com/fullchain.pem /opt/snapcheck/certs/cert.pem
cp /etc/letsencrypt/live/snapcheck.example.com/privkey.pem /opt/snapcheck/certs/key.pem

# Копирование SystemD сервиса
echo "⚙️ Установка SystemD сервиса..."
cp /opt/snapcheck/config/systemd/snapcheck.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable snapcheck.service

# Запуск приложения
echo "🚀 Запуск приложения..."
systemctl start snapcheck.service

# Проверка статуса
echo "✅ Установка завершена!"
echo "🌐 Ваше приложение доступно по адресу: https://snapcheck.example.com"

systemctl status snapcheck.service
```

### update.sh

```bash
#!/bin/bash

set -e

echo "🔄 Обновление SnapCheck"
echo "=========================="

cd /opt/snapcheck

# Резервное копирование БД
echo "💾 Резервное копирование БД..."
cp data/db/snapcheck.db data/backups/snapcheck.db.backup.$(date +%Y%m%d_%H%M%S)

# Остановка контейнеров
echo "🛑 Остановка контейнеров..."
docker-compose down

# Обновление кода
echo "📥 Обновление кода..."
git pull origin main

# Сборка новых образов
echo "🔨 Сборка Docker образов..."
docker-compose build

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
docker-compose up -d

# Проверка здоровья
echo "⏳ Проверка здоровья приложения..."
sleep 5

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Обновление завершено успешно!"
else
    echo "❌ Ошибка при проверке здоровья приложения"
    exit 1
fi
```

### backup.sh

```bash
#!/bin/bash

BACKUP_DIR="/opt/snapcheck/data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "💾 Резервное копирование SnapCheck"
echo "===================================="

# Резервная копия БД
echo "📦 Архивирование БД..."
tar -czf "$BACKUP_DIR/db_backup_$TIMESTAMP.tar.gz" \
    /opt/snapcheck/data/db/

# Резервная копия загружаемых файлов
echo "📦 Архивирование загруженных файлов..."
tar -czf "$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz" \
    /tmp/snapcheck_uploads/

# Удаление старых резервных копий (старше 30 дней)
echo "🗑️ Очистка старых резервных копий..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "✅ Резервное копирование завершено"
echo "📁 Файлы сохранены в: $BACKUP_DIR"
```

### health-check.sh

```bash
#!/bin/bash

echo "🏥 Проверка здоровья SnapCheck"
echo "=================================="

# Проверка Backend
echo -n "Backend: "
if curl -sf http://localhost:8000/health > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# Проверка Frontend
echo -n "Frontend: "
if curl -sf http://localhost/ > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# Проверка Docker контейнеров
echo -n "Docker Backend: "
if docker ps | grep snapcheck-backend > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Stopped"
fi

echo -n "Docker Frontend: "
if docker ps | grep snapcheck-frontend > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Stopped"
fi

# Проверка дискового пространства
echo ""
echo "💾 Дисковое пространство:"
df -h /opt/snapcheck | tail -1

# Проверка использования памяти Docker
echo ""
echo "🧠 Использование памяти Docker:"
docker ps --format "{{.Names}}: {{.MemUsage}}"
```

## Мониторинг и логирование

### Просмотр логов

```bash
# Все логи
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend

# Логи Nginx
tail -f /opt/snapcheck/logs/nginx/access.log
tail -f /opt/snapcheck/logs/nginx/error.log
```

### Prometheus метрики (опционально)

Добавить в `backend/main.py`:

```python
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import Response

# Метрики
request_count = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## Обновление приложения

```bash
# На сервере
cd /opt/snapcheck

# Запуск обновления
bash scripts/update.sh

# Проверка статуса
bash scripts/health-check.sh

# Просмотр логов
docker-compose logs -f backend
```

## Первоначальная настройка

```bash
# SSH на сервер
ssh root@your-server.com

# Запуск установки
bash /opt/snapcheck/scripts/install.sh

# После установки
systemctl status snapcheck.service

# Проверка приложения
curl https://snapcheck.example.com/health
```

## Управление сервисом

```bash
# Запуск
systemctl start snapcheck.service

# Остановка
systemctl stop snapcheck.service

# Перезагрузка
systemctl restart snapcheck.service

# Статус
systemctl status snapcheck.service

# Логи
journalctl -u snapcheck.service -f
```

## Резервное копирование

```bash
# Однократное резервное копирование
bash /opt/snapcheck/scripts/backup.sh

# Автоматическое резервное копирование каждый день в 2:00
0 2 * * * /opt/snapcheck/scripts/backup.sh >> /var/log/snapcheck-backup.log 2>&1
```

## Переменные окружения

Создать `/opt/snapcheck/.env`:

```
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=sqlite:///./data/db/snapcheck.db
SECRET_KEY=your-secret-key-here
LOG_LEVEL=info
WORKERS=4
MAX_UPLOAD_SIZE=104857600
DOMAIN=snapcheck.example.com
```

## Требования к серверу

- **ОС**: Ubuntu 20.04 LTS или новше
- **CPU**: 2+ ядра
- **RAM**: 2+ GB
- **Диск**: 20+ GB
- **Сеть**: Статический IP, доступ на порты 80 и 443

## Стоимость хостинга (примерно)

| Провайдер | Тип | Цена |
|-----------|-----|------|
| DigitalOcean | Droplet 2GB | $6-12/мес |
| Linode | Nanode 1GB | $5/мес |
| Hetzner | Cloud CX11 | €3.99/мес |
| AWS | t3.small | $20-30/мес |
| Яндекс.Облако | n1-standard-1 | ₽500-800/мес |

---

**Готово!** Ваше приложение готово к production. 🚀
