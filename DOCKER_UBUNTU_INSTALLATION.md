# 🐳 DOCKER НА UBUNTU - ПОЛНОЕ РУКОВОДСТВО

## 📋 ТРЕБОВАНИЯ

```
✅ Ubuntu 18.04+ (рекомендуется 22.04 LTS)
✅ Интернет соединение
✅ SSH доступ на сервер
✅ Минимум 2GB RAM
✅ Минимум 20GB диска
```

---

## 🚀 БЫСТРАЯ УСТАНОВКА (10 МИНУТ)

### Шаг 1: Подключиться к серверу

```bash
ssh root@YOUR_SERVER_IP
# или
ssh user@YOUR_SERVER_IP
# затем sudo su для получения прав admin
```

### Шаг 2: Обновить систему

```bash
apt update && apt upgrade -y
```

### Шаг 3: Установить Docker

```bash
# Способ A: Официальный скрипт (рекомендуется)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Способ B: Вручную (долго, но безопаснее)
# см. ниже полный список команд
```

### Шаг 4: Установить Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Шаг 5: Проверить установку

```bash
docker --version
docker-compose --version
docker run hello-world  # Проверка работоспособности
```

---

## 📝 ПОЛНАЯ ПОШАГОВАЯ УСТАНОВКА НА UBUNTU

### 1️⃣ Подключиться по SSH

```bash
# С вашего Mac:
ssh root@YOUR_SERVER_IP

# Введите пароль или используйте SSH ключ
```

### 2️⃣ Обновить систему

```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

### 3️⃣ Установить зависимости

```bash
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common
```

### 4️⃣ Добавить Docker репозиторий

```bash
# Добавить GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавить репозиторий
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 5️⃣ Обновить индекс пакетов

```bash
sudo apt update
```

### 6️⃣ Установить Docker Engine

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 7️⃣ Запустить Docker сервис

```bash
sudo systemctl start docker
sudo systemctl enable docker  # Автозагрузка при старте
```

### 8️⃣ Добавить текущего пользователя в группу docker

```bash
# Позволить запускать docker без sudo
sudo usermod -aG docker $USER

# Применить изменения группы
newgrp docker

# Проверить
docker ps
```

### 9️⃣ Установить Docker Compose

```bash
# Установить последнюю версию
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Сделать исполняемым
sudo chmod +x /usr/local/bin/docker-compose

# Проверить версию
docker-compose --version
```

### 🔟 Проверить установку

```bash
docker --version
docker-compose --version

# Запустить тестовый контейнер
docker run hello-world
```

---

## 🛠️ АВТОМАТИЧЕСКИЙ СКРИПТ

**Файл:** `/tmp/install-docker.sh`

```bash
#!/bin/bash

echo "🐳 Installing Docker on Ubuntu..."

# Update system
echo "📦 Updating system..."
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y

# Install dependencies
echo "📦 Installing dependencies..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

# Add Docker repository
echo "📦 Adding Docker repository..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index
echo "📦 Updating package index..."
sudo apt update

# Install Docker
echo "📦 Installing Docker Engine..."
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
echo "🚀 Starting Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
echo "👤 Adding user to docker group..."
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
echo "✅ Verifying installation..."
docker --version
docker-compose --version

echo "✅ Docker installation completed!"
echo "⚠️  Please logout and login again for group changes to take effect"
echo "   Then run: docker ps"
```

**Запустить:**
```bash
curl -fsSL https://get.docker.com/install-docker.sh -o /tmp/install-docker.sh
chmod +x /tmp/install-docker.sh
sudo /tmp/install-docker.sh
```

---

## 🐳 РАЗВЕРНУТЬ SLIDECONFIRM НА UBUNTU

### Шаг 1: Загрузить проект

```bash
# Вариант A: Клонировать из GitHub
git clone https://github.com/YOUR_USERNAME/slideconfirm.git /opt/slideconfirm
cd /opt/slideconfirm

# Вариант B: Скачать zip файл
wget https://github.com/YOUR_USERNAME/slideconfirm/archive/refs/heads/main.zip
unzip main.zip
mv slideconfirm-main /opt/slideconfirm
cd /opt/slideconfirm
```

### Шаг 2: Создать необходимые директории

```bash
mkdir -p /opt/slideconfirm/data/db
mkdir -p /opt/slideconfirm/data/uploads
mkdir -p /opt/slideconfirm/logs/backend
mkdir -p /opt/slideconfirm/logs/nginx

chmod -R 755 /opt/slideconfirm
```

### Шаг 3: Создать .env файл

```bash
cat > /opt/slideconfirm/.env << 'EOF'
# Backend Security
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
DATABASE_URL=postgresql://slideconfirm:StrongPassword123@db:5432/slideconfirm
ACCESS_TOKEN_EXPIRE=30
REFRESH_TOKEN_EXPIRE=7

# Frontend
VITE_API_URL=https://api.your-domain.com

# Environment
ENVIRONMENT=production
LOG_LEVEL=info

# Database
DB_PASSWORD=StrongPassword123
EOF
```

**⚠️ Важно:** Отредактировать пароли!

```bash
nano /opt/slideconfirm/.env
# Нажать Ctrl+X для выхода, Y для сохранения
```

### Шаг 4: Обновить docker-compose для production

**Файл:** `/opt/slideconfirm/docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: slideconfirm-backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - LOG_LEVEL=${LOG_LEVEL}
    volumes:
      - ./data/uploads:/tmp/slideconfirm_uploads
      - ./logs/backend:/app/logs
    depends_on:
      - db
    restart: always
    networks:
      - slideconfirm-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: slideconfirm-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./logs/nginx:/var/log/nginx
      - /etc/letsencrypt:/etc/letsencrypt  # SSL сертификаты
    depends_on:
      - backend
    restart: always
    networks:
      - slideconfirm-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    container_name: slideconfirm-db
    environment:
      - POSTGRES_DB=slideconfirm
      - POSTGRES_USER=slideconfirm
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: always
    networks:
      - slideconfirm-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U slideconfirm"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  slideconfirm-network:
    driver: bridge

volumes:
  db_data:
    driver: local
```

### Шаг 5: Собрать Docker образы

```bash
cd /opt/slideconfirm

# Собрать образы (первый раз долго, 5-10 минут)
docker-compose -f docker-compose.prod.yml build

# Или с флагом --no-cache для переборки
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Шаг 6: Запустить контейнеры

```bash
# Запустить в фоновом режиме
docker-compose -f docker-compose.prod.yml up -d

# Посмотреть статус
docker-compose -f docker-compose.prod.yml ps

# Посмотреть логи
docker-compose -f docker-compose.prod.yml logs -f
```

### Шаг 7: Получить SSL сертификат

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификат (если Nginx работает)
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Сертификаты находятся в:
ls -la /etc/letsencrypt/live/your-domain.com/
```

### Шаг 8: Обновить Nginx конфиг

**Файл:** `/opt/slideconfirm/docker-nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    
    # Редирект на HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL сертификаты Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL конфигурация
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    
    # Приложение
    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Шаг 9: Перезагрузить frontend контейнер

```bash
docker-compose -f docker-compose.prod.yml restart frontend
```

### Шаг 10: Проверить

```bash
# Проверить что всё работает
curl https://your-domain.com

# Посмотреть логи
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

---

## 📊 КОМАНДНЫЙ НАБОР ДЛЯ UBUNTU

```bash
# ═══════════════════════════════════════════════════════════════
# УПРАВЛЕНИЕ КОНТЕЙНЕРАМИ
# ═══════════════════════════════════════════════════════════════

# Запустить
docker-compose -f docker-compose.prod.yml up -d

# Остановить
docker-compose -f docker-compose.prod.yml stop

# Перезагрузить
docker-compose -f docker-compose.prod.yml restart

# Удалить контейнеры (сохранит данные)
docker-compose -f docker-compose.prod.yml down

# Удалить всё включая данные (осторожно!)
docker-compose -f docker-compose.prod.yml down -v

# ═══════════════════════════════════════════════════════════════
# ЛОГИРОВАНИЕ
# ═══════════════════════════════════════════════════════════════

# Все логи
docker-compose -f docker-compose.prod.yml logs

# Логи backend (live)
docker-compose -f docker-compose.prod.yml logs -f backend

# Логи frontend (live)
docker-compose -f docker-compose.prod.yml logs -f frontend

# Логи БД (live)
docker-compose -f docker-compose.prod.yml logs -f db

# ═══════════════════════════════════════════════════════════════
# ОТЛАДКА
# ═══════════════════════════════════════════════════════════════

# Войти в контейнер backend
docker exec -it slideconfirm-backend bash

# Войти в контейнер frontend
docker exec -it slideconfirm-frontend sh

# Войти в контейнер БД
docker exec -it slideconfirm-db psql -U slideconfirm -d slideconfirm

# Выполнить команду в контейнере
docker exec slideconfirm-backend python3 -m pip list

# ═══════════════════════════════════════════════════════════════
# СТАТУС И ИНФОРМАЦИЯ
# ═══════════════════════════════════════════════════════════════

# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Все контейнеры
docker ps -a

# Все образы
docker images

# Использование ресурсов
docker stats

# Сетевые соединения
docker network inspect slideconfirm-network

# ═══════════════════════════════════════════════════════════════
# ОБСЛУЖИВАНИЕ
# ═══════════════════════════════════════════════════════════════

# Очистить неиспользуемые образы
docker image prune -a

# Очистить неиспользуемые контейнеры
docker container prune

# Очистить неиспользуемые volumes
docker volume prune

# Полная очистка (осторожно!)
docker system prune -a
```

---

## 🔄 АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ

### Способ 1: Cron (регулярно)

```bash
# Открыть cron редактор
crontab -e

# Добавить строку (обновление каждый день в 3 утра):
0 3 * * * cd /opt/slideconfirm && git pull && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d
```

### Способ 2: GitHub Actions (автоматический CI/CD)

**Файл:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/slideconfirm
            git pull
            docker-compose -f docker-compose.prod.yml build --no-cache
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## ⚠️ ПРОБЛЕМЫ И РЕШЕНИЯ

### Проблема 1: Permission denied

```bash
# Ошибка: Got permission denied
# Решение:
sudo usermod -aG docker $USER
newgrp docker
```

### Проблема 2: Port already in use

```bash
# Найти процесс на порту
sudo lsof -i :80
sudo lsof -i :443

# Убить процесс
sudo kill -9 <PID>
```

### Проблема 3: Docker daemon не запускается

```bash
# Перезагрузить Docker
sudo systemctl restart docker

# Посмотреть статус
sudo systemctl status docker

# Посмотреть логи
sudo journalctl -u docker
```

### Проблема 4: Нет места на диске

```bash
# Посмотреть использование
du -sh /opt/slideconfirm/*

# Очистить старые образы
docker image prune -a

# Очистить старые логи
docker logs --tail 0 slideconfirm-backend

# Очистить систему
docker system prune -a --volumes
```

---

## 🔐 SECURITY CHECKLIST

```
- [ ] Использовать сильные пароли в .env
- [ ] Включить firewall: sudo ufw enable
- [ ] Открыть только необходимые порты:
      sudo ufw allow 22/tcp
      sudo ufw allow 80/tcp
      sudo ufw allow 443/tcp
- [ ] Регулярно обновлять систему: sudo apt update && sudo apt upgrade
- [ ] Сделать бэкап БД:
      docker exec slideconfirm-db pg_dump -U slideconfirm slideconfirm > backup.sql
- [ ] Настроить SSH ключи (отключить пароль)
- [ ] Установить fail2ban: sudo apt install fail2ban
- [ ] Настроить SSL сертификат (Let's Encrypt)
```

---

## 📊 PRODUCTION CHECKLIST

```
ПРЕДПРОИЗВОДСТВО:
- [ ] Обновить все зависимости
- [ ] Запустить тесты
- [ ] Проверить безопасность

РАЗВЕРТЫВАНИЕ:
- [ ] Создать бэкап существующей базы
- [ ] Запустить docker-compose build --no-cache
- [ ] Запустить docker-compose up -d
- [ ] Проверить логи: docker-compose logs -f
- [ ] Протестировать все endpoints

ПОСТРАЗВЕРТЫВАНИЕ:
- [ ] Настроить мониторинг
- [ ] Настроить логирование
- [ ] Настроить alerts
- [ ] Настроить backup (ежедневный)
- [ ] Документировать изменения
```

---

## 📚 ПОЛЕЗНЫЕ ССЫЛКИ

- [Docker Installation](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose](https://docs.docker.com/compose/install/linux/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Nginx Docker](https://hub.docker.com/_/nginx)

**Готовы развертывать на Ubuntu?** 🚀
