# 🐳 DOCKER УСТАНОВКА - ПОЛНОЕ РУКОВОДСТВО

## ✅ ЧТО УЖЕ ЕСТЬ

```
✅ Dockerfile.backend - Python/FastAPI контейнер
✅ Dockerfile.frontend - Node.js/React контейнер
✅ docker-compose.prod.yml - Оркестрация контейнеров
✅ docker-nginx.conf - Nginx конфигурация
```

---

## 🚀 БЫСТРАЯ УСТАНОВКА (3 команды)

```bash
# Шаг 1: Перейти в директорию проекта
cd /Users/rakhat/Documents/webhosting/SlideConfirm

# Шаг 2: Построить контейнеры (первый раз долго)
docker-compose -f docker-compose.prod.yml build

# Шаг 3: Запустить проект
docker-compose -f docker-compose.prod.yml up -d

# Результат: Приложение доступно на http://localhost:3000
```

---

## 📋 ПОШАГОВАЯ ИНСТРУКЦИЯ

### Шаг 1: Установить Docker

**macOS:**
```bash
# Вариант A: Через Homebrew
brew install docker docker-compose

# Вариант B: Скачать Docker Desktop
# Перейти на https://www.docker.com/products/docker-desktop
# Скачать, установить, запустить
```

**Проверить установку:**
```bash
docker --version
docker-compose --version
```

---

### Шаг 2: Подготовить проект

```bash
# Перейти в директорию проекта
cd /Users/rakhat/Documents/webhosting/SlideConfirm

# Создать необходимые директории
mkdir -p data/db data/uploads logs/backend logs/nginx

# Создать .env файл (если еще нет)
cat > .env << 'EOF'
# Backend
SECRET_KEY=your-random-secret-key-min-64-chars
DATABASE_URL=sqlite:///./data/db/slideconfirm.db
ACCESS_TOKEN_EXPIRE=30
REFRESH_TOKEN_EXPIRE=7

# Frontend
VITE_API_URL=http://localhost:8000

# Security
ENVIRONMENT=production
EOF
```

---

### Шаг 3: Построить образы (Build)

```bash
# Вариант A: Быстро (если Dockerfile не менялся)
docker-compose -f docker-compose.prod.yml build

# Вариант B: Пересчитать заново
docker-compose -f docker-compose.prod.yml build --no-cache

# Вывод:
# ✅ Building backend ... done
# ✅ Building frontend ... done
```

**Что происходит:**
1. Docker читает `Dockerfile.backend`
2. Docker читает `Dockerfile.frontend`
3. Скачивает базовые образы (python:3.9, node:18)
4. Устанавливает зависимости (pip install, npm install)
5. Собирает React приложение (npm run build)
6. Создает готовые образы

---

### Шаг 4: Запустить контейнеры (Run)

```bash
# Запустить в фоновом режиме
docker-compose -f docker-compose.prod.yml up -d

# Или запустить с логами (для тестирования)
docker-compose -f docker-compose.prod.yml up

# Вывод:
# ✅ Creating slideconfirm-backend ... done
# ✅ Creating slideconfirm-frontend ... done
```

---

### Шаг 5: Проверить что все работает

```bash
# Проверить запущенные контейнеры
docker ps

# Вывод должен быть:
# CONTAINER ID  IMAGE          STATUS
# abc123...     slideconfirm-backend    Up 2 minutes
# def456...     slideconfirm-frontend   Up 2 minutes

# Проверить логи backend
docker logs slideconfirm-backend

# Проверить логи frontend
docker logs slideconfirm-frontend

# Проверить сетевое подключение
docker network ls
```

---

### Шаг 6: Тестировать

```bash
# Frontend (React)
open http://localhost:3000

# Backend API
curl http://localhost:8000/health
# Ответ: {"status":"ok"}

# API регистрация
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@example.com","password":"TestPass123!"}'
```

---

## 🛑 ОСТАНОВИТЬ И УДАЛИТЬ

```bash
# Остановить контейнеры (сохраняет данные)
docker-compose -f docker-compose.prod.yml down

# Остановить и удалить все (включая данные!)
docker-compose -f docker-compose.prod.yml down -v

# Удалить образы
docker rmi slideconfirm-backend slideconfirm-frontend
```

---

## 📊 DOCKER ARCHITECTURE

```
┌─────────────────────────────────────┐
│         Docker Desktop              │
├─────────────────────────────────────┤
│                                     │
│  slideconfirm-network (мост)        │
│  ├─ Backend Container (port 8000)   │
│  │  ├─ Python 3.9                   │
│  │  ├─ FastAPI                      │
│  │  ├─ SQLite DB                    │
│  │  └─ Uvicorn server               │
│  │                                  │
│  └─ Frontend Container (port 3000)  │
│     ├─ Node 18                      │
│     ├─ React (собран)               │
│     ├─ Nginx                        │
│     └─ Веб-сервер                   │
│                                     │
│  Volumes (данные)                   │
│  ├─ ./data/db (БД)                  │
│  ├─ ./data/uploads (файлы)          │
│  └─ ./logs (логи)                   │
│                                     │
└─────────────────────────────────────┘
         ↓
    http://localhost:3000
    http://localhost:8000
```

---

## 🔧 КОМАНДЫ DOCKER

### Основные команды

```bash
# Запустить
docker-compose -f docker-compose.prod.yml up -d

# Остановить
docker-compose -f docker-compose.prod.yml stop

# Перезагрузить
docker-compose -f docker-compose.prod.yml restart

# Посмотреть статус
docker-compose -f docker-compose.prod.yml ps

# Посмотреть логи
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Выполнить команду в контейнере
docker-compose -f docker-compose.prod.yml exec backend bash
docker-compose -f docker-compose.prod.yml exec frontend sh
```

### Debugging

```bash
# Зайти в bash backend контейнера
docker exec -it slideconfirm-backend bash
# Теперь внутри контейнера можешь:
# ls -la
# python3
# pip list

# Зайти в sh frontend контейнера
docker exec -it slideconfirm-frontend sh
# Теперь внутри контейнера можешь:
# ls -la
# npm list
```

---

## ⚠️ ПРОБЛЕМЫ И РЕШЕНИЯ

### Проблема 1: Port уже занят

**Ошибка:**
```
Error: Port 3000 is already in use
```

**Решение:**
```bash
# Способ A: Освободить порт
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Способ B: Использовать другой порт
# Отредактировать docker-compose.prod.yml:
# ports:
#   - "3001:80"  # вместо 3000:80
```

---

### Проблема 2: Контейнеры не запускаются

**Ошибка:**
```
ERROR: Service 'backend' failed to build
```

**Решение:**
```bash
# Пересобрать заново
docker-compose -f docker-compose.prod.yml build --no-cache

# Посмотреть ошибку
docker logs slideconfirm-backend

# Проверить requirements.txt
cat backend/requirements.txt
```

---

### Проблема 3: БД не создается

**Ошибка:**
```
sqlite: no such file or directory
```

**Решение:**
```bash
# Создать директорию
mkdir -p data/db

# Дать права
chmod 777 data/db

# Перезагрузить контейнер
docker-compose -f docker-compose.prod.yml restart backend
```

---

### Проблема 4: Frontend показывает ошибку подключения

**Ошибка:**
```
Cannot connect to API
```

**Решение:**
```bash
# Проверить переменные окружения
docker exec slideconfirm-frontend cat /usr/share/nginx/html/.env

# Проверить что backend работает
curl http://localhost:8000/health

# Посмотреть логи Nginx
docker logs slideconfirm-frontend

# Редактировать .env и пересобрать
VITE_API_URL=http://localhost:8000
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml restart frontend
```

---

## 📁 СТРУКТУРА ПРОЕКТА ДЛЯ DOCKER

```
SlideConfirm/
├── backend/                    # Python/FastAPI
│   ├── main.py
│   ├── auth.py
│   ├── models.py
│   ├── requirements.txt
│   └── ...
├── frontend/                   # React/Vite
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── frontend-mobile/           # React Native (опционально)
├── data/                       # 📁 Создать
│   ├── db/                     # SQLite БД
│   └── uploads/                # Загруженные файлы
├── logs/                       # 📁 Создать
│   ├── backend/
│   └── nginx/
├── .env                        # 📝 Создать
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.prod.yml
├── docker-nginx.conf
└── requirements.txt
```

---

## 🔐 PRODUCTION SETUP

### Шаг 1: Обновить docker-compose.prod.yml для production

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: slideconfirm-backend
    ports:
      - "8000:8000"  # ⚠️ НЕ ОТКРЫВАТЬ В PRODUCTION!
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/slideconfirm
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - LOG_LEVEL=info
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
      - "80:80"    # ✅ Открываем только 80
      - "443:443"  # ✅ 443 для HTTPS
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

### Шаг 2: Обновить .env для production

```bash
# SECRET KEY - генерировать с помощью:
# python3 -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-generated-secret-key

# DATABASE
DATABASE_URL=postgresql://slideconfirm:password@db:5432/slideconfirm
DB_PASSWORD=your-strong-postgres-password

# ENVIRONMENT
ENVIRONMENT=production
LOG_LEVEL=info

# FRONTEND
VITE_API_URL=https://api.your-domain.com
```

### Шаг 3: Запустить на production

```bash
# На вашем production сервере:

# 1. Загрузить код
git clone <your-repo> /opt/slideconfirm
cd /opt/slideconfirm

# 2. Создать .env
nano .env  # Заполнить переменные

# 3. Построить образы
docker-compose -f docker-compose.prod.yml build --no-cache

# 4. Запустить
docker-compose -f docker-compose.prod.yml up -d

# 5. Проверить
docker ps
docker-compose logs -f backend
```

---

## 📊 МОНИТОРИНГ КОНТЕЙНЕРОВ

```bash
# Посмотреть использование ресурсов
docker stats

# Посмотреть все образы
docker images

# Посмотреть все контейнеры (включая остановленные)
docker ps -a

# Посмотреть сетевые подключения
docker network inspect slideconfirm-network

# Посмотреть объем данных
du -sh data/

# Посмотреть размер контейнеров
docker system df
```

---

## 🔄 ОБНОВЛЕНИЕ КОДА (CI/CD)

### Способ 1: Вручную

```bash
# Скачать новый код
git pull

# Пересобрать образы
docker-compose -f docker-compose.prod.yml build --no-cache

# Перезагрузить контейнеры
docker-compose -f docker-compose.prod.yml up -d

# Проверить
docker logs slideconfirm-backend
```

### Способ 2: GitHub Actions (автоматически)

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
      - uses: actions/checkout@v2
      
      - name: Build Docker images
        run: docker-compose -f docker-compose.prod.yml build --no-cache
      
      - name: Push to registry
        run: docker push your-registry/slideconfirm
      
      - name: SSH to server
        run: |
          ssh -i ${{ secrets.SSH_KEY }} user@your-server.com << 'EOF'
          cd /opt/slideconfirm
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d
          EOF
```

---

## ✅ ЧЕКЛИСТ УСТАНОВКИ

```
ЛОКАЛЬНОЕ РАЗВЕРТЫВАНИЕ:
- [ ] Установить Docker Desktop
- [ ] Перейти в директорию проекта
- [ ] Создать директории (data/, logs/)
- [ ] Создать .env файл
- [ ] Выполнить: docker-compose -f docker-compose.prod.yml build
- [ ] Выполнить: docker-compose -f docker-compose.prod.yml up -d
- [ ] Проверить: http://localhost:3000
- [ ] Проверить: http://localhost:8000/health

PRODUCTION РАЗВЕРТЫВАНИЕ:
- [ ] Обновить docker-compose.prod.yml для production
- [ ] Добавить PostgreSQL контейнер
- [ ] Генерировать SECRET_KEY
- [ ] Настроить SSL сертификаты
- [ ] Настроить Nginx для HTTPS
- [ ] Запустить: docker-compose -f docker-compose.prod.yml up -d
- [ ] Настроить мониторинг и логирование
- [ ] Настроить backup базы данных
- [ ] Настроить CI/CD (GitHub Actions)
```

---

## 🎯 ПОЛЕЗНЫЕ СКРИПТЫ

**Файл:** `docker-helper.sh`

```bash
#!/bin/bash

# Использование: ./docker-helper.sh build|start|stop|logs|clean

case "$1" in
  build)
    echo "🔨 Building Docker images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    ;;
  start)
    echo "▶️  Starting containers..."
    docker-compose -f docker-compose.prod.yml up -d
    echo "✅ Containers started!"
    ;;
  stop)
    echo "⏹️  Stopping containers..."
    docker-compose -f docker-compose.prod.yml stop
    echo "✅ Containers stopped!"
    ;;
  restart)
    echo "🔄 Restarting containers..."
    docker-compose -f docker-compose.prod.yml restart
    echo "✅ Containers restarted!"
    ;;
  logs)
    docker-compose -f docker-compose.prod.yml logs -f "$2"
    ;;
  clean)
    echo "🗑️  Cleaning up..."
    docker-compose -f docker-compose.prod.yml down -v
    echo "✅ Cleanup done!"
    ;;
  *)
    echo "Usage: $0 {build|start|stop|restart|logs [service]|clean}"
    ;;
esac
```

**Использование:**
```bash
chmod +x docker-helper.sh

./docker-helper.sh build       # Собрать образы
./docker-helper.sh start       # Запустить
./docker-helper.sh stop        # Остановить
./docker-helper.sh restart     # Перезагрузить
./docker-helper.sh logs backend # Логи backend
./docker-helper.sh clean       # Удалить все
```

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

**Готовы запускать Docker?** 🚀
