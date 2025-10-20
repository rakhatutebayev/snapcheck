# 🐳 DOCKER НА UBUNTU С TRAEFIK - ПОЛНЫЙ ГАЙД

## 📋 ТРЕБОВАНИЯ

```
✅ Ubuntu 20.04+ (22.04 LTS рекомендуется)
✅ Docker установлен
✅ Docker Compose установлен
✅ Traefik установлен и работает
✅ Домен/DNS настроены
✅ Минимум 2GB RAM + 20GB диска
```

---

## 🚀 БЫСТРАЯ УСТАНОВКА (15 МИНУТ)

### Шаг 1: Проверить какие приложения уже используют Docker

```bash
# Подключиться к серверу
ssh root@YOUR_SERVER_IP

# ✅ КРИТИЧНЫЙ ШАГ: Посмотреть все контейнеры
docker ps -a

# Вывод должен показать:
# CONTAINER ID  IMAGE                 STATUS              PORTS
# abc123...     traefik:latest        Up X days           0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
# def456...     portainer/portainer   Up X days           0.0.0.0:9000->9000/tcp
# ...

# Посмотреть какие порты используются
sudo netstat -tlnp | grep LISTEN

# или

sudo ss -tlnp | grep LISTEN

# Вывод покажет:
# LISTEN  0  128  0.0.0.0:80   0.0.0.0:*  pid/docker
# LISTEN  0  128  0.0.0.0:443  0.0.0.0:*  pid/docker
# LISTEN  0  128  0.0.0.0:3000 0.0.0.0:*  pid/docker
# и т.д.
```

### Шаг 2: Посмотреть сетевые интерфейсы Docker

```bash
# Все Docker сети
docker network ls

# Вывод:
# NETWORK ID  NAME            DRIVER  SCOPE
# abc123      bridge          bridge  local
# def456      host            host    local
# ghi789      none            null    local
# jkl012      traefik-net     bridge  local
# mno345      other-apps-net  bridge  local

# Информация о сети Traefik
docker network inspect traefik-net

# Это покажет все контейнеры в этой сети
```

### Шаг 3: Найти свободные порты (если нужны для внутреннего обращения)

```bash
# Проверить какие порты свободны (8000-9000)
for port in {8000..8010}; do
  echo "Port $port: $(nc -z 127.0.0.1 $port > /dev/null 2>&1 && echo 'IN USE' || echo 'FREE')"
done

# Вывод:
# Port 8000: FREE
# Port 8001: FREE
# Port 8002: IN USE
# Port 8003: FREE
# и т.д.
```

---

## 🔧 УСТАНОВКА SLIDECONFIRM С TRAEFIK

### ШАГ 1: Загрузить проект

```bash
# Клонировать проект
git clone https://github.com/rakhatutebayev-create/slideconfirm.git /opt/slideconfirm
cd /opt/slideconfirm

# Создать необходимые директории
mkdir -p data/db data/uploads logs/backend logs/nginx
chmod -R 755 /opt/slideconfirm
```

### ШАГ 2: Создать docker-compose.yml для Traefik

**Файл:** `/opt/slideconfirm/docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: slideconfirm-backend
    environment:
      - DATABASE_URL=postgresql://slideconfirm:${DB_PASSWORD}@db:5432/slideconfirm
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - LOG_LEVEL=${LOG_LEVEL}
      - VITE_API_URL=https://${DOMAIN}/api
    volumes:
      - ./data/uploads:/tmp/slideconfirm_uploads
      - ./logs/backend:/app/logs
    depends_on:
      - db
    restart: always
    networks:
      - traefik-net  # ✅ ВАЖНО: Использовать сеть Traefik
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      # ✅ Traefik конфигурация для backend
      - "traefik.enable=true"
      - "traefik.http.routers.slideconfirm-backend.rule=Host(`${DOMAIN}`) && PathPrefix(`/api`)"
      - "traefik.http.routers.slideconfirm-backend.entrypoints=websecure"
      - "traefik.http.routers.slideconfirm-backend.tls.certresolver=${TRAEFIK_RESOLVER}"
      - "traefik.http.services.slideconfirm-backend.loadbalancer.server.port=8000"
      - "traefik.docker.network=${TRAEFIK_NETWORK}"  # ✅ КРИТИЧНО: Явно указываем сеть для Traefik (исключает 504)
      - "traefik.http.middlewares.api-prefix.stripprefix.prefixes=/api"
      - "traefik.http.routers.slideconfirm-backend.middlewares=api-prefix"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: slideconfirm-frontend
    restart: always
    networks:
      - traefik-net  # ✅ ВАЖНО: Использовать сеть Traefik
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      # ✅ Traefik конфигурация для frontend
      - "traefik.enable=true"
      - "traefik.http.routers.slideconfirm-frontend.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.slideconfirm-frontend.entrypoints=websecure"
      - "traefik.http.routers.slideconfirm-frontend.tls.certresolver=${TRAEFIK_RESOLVER}"
      - "traefik.http.services.slideconfirm-frontend.loadbalancer.server.port=80"
      - "traefik.docker.network=${TRAEFIK_NETWORK}"  # ✅ КРИТИЧНО: Явно указываем сеть для Traefik
      - "traefik.http.routers.slideconfirm-frontend.priority=1"

  db:
    image: postgres:15-alpine
    container_name: slideconfirm-db
    environment:
      - POSTGRES_DB=slideconfirm
      - POSTGRES_USER=slideconfirm
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./logs/postgres:/var/log/postgresql
    restart: always
    networks:
      - traefik-net  # ✅ БД в общей сети
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U slideconfirm"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  traefik-net:
    external: true  # ✅ ВАЖНО: Использовать существующую сеть Traefik

volumes:
  db_data:
    driver: local
```

### ШАГ 3: Создать .env файл

```bash
cat > /opt/slideconfirm/.env << 'EOF'
# ═══════════════════════════════════════════════════════════════
# ОСНОВНЫЕ ПАРАМЕТРЫ
# ═══════════════════════════════════════════════════════════════

# ✅ Ваш домен
DOMAIN=slideconfirm.yourdomain.com

# ✅ Генерировать так:
# python3 -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-random-secret-key-min-64-chars-replace-this

# ═══════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════

DATABASE_URL=postgresql://slideconfirm:StrongDbPassword123@db:5432/slideconfirm
DB_PASSWORD=StrongDbPassword123

# ═══════════════════════════════════════════════════════════════
# FRONTEND
# ═══════════════════════════════════════════════════════════════

VITE_API_URL=https://slideconfirm.yourdomain.com/api

# ═══════════════════════════════════════════════════════════════
# TRAEFIK
# ═══════════════════════════════════════════════════════════════

# Имя внешней сети Docker, к которой подключён контейнер Traefik
TRAEFIK_NETWORK=traefik-net

# Имя certresolver, настроенного в Traefik (например: myresolver или letsencrypt)
TRAEFIK_RESOLVER=letsencrypt

# ═══════════════════════════════════════════════════════════════
# ENVIRONMENT
# ═══════════════════════════════════════════════════════════════

ENVIRONMENT=production
LOG_LEVEL=info
EOF

# ⚠️ ВАЖНО: Отредактировать .env
nano /opt/slideconfirm/.env
```

### ШАГ 4: Проверить что Traefik сеть существует

```bash
# Посмотреть все Docker сети
docker network ls

# Если traefik-net НЕ существует, создать:
docker network create traefik-net

# Если существует, можно проверить:
docker network inspect traefik-net
```

### ШАГ 5: Обновить Dockerfile.backend для Traefik

**Файл:** `Dockerfile.backend`

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Установка зависимостей системы
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Копирование requirements.txt
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копирование приложения
COPY backend/ .

# Создание директорий для данных
RUN mkdir -p /app/data/db /tmp/slideconfirm_uploads

# Переменные окружения
ENV PYTHONUNBUFFERED=1
ENV WORKERS=4
ENV ENVIRONMENT=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Запуск приложения
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### ШАГ 6: Обновить Dockerfile.frontend для Traefik

**Файл:** `Dockerfile.frontend`

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

# Копирование Nginx конфига для Traefik (БЕЗ SSL, Traefik сам управляет)
COPY docker-nginx-traefik.conf /etc/nginx/conf.d/default.conf

# Копирование собранного приложения
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### ШАГ 7: Создать Nginx конфиг для Traefik

**Файл:** `docker-nginx-traefik.conf`

```nginx
# ⚠️ БЕЗ SSL конфигурации! Traefik сам управляет SSL

server {
  listen 80;
  listen [::]:80;
    server_name _;

    # Максимальный размер загружаемого файла
    client_max_body_size 100M;

    # Gzip компрессия
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;

    # Frontend приложение
    location / {
        root /usr/share/nginx/html;
        index index.html;
        
        # React Router - всегда возвращать index.html
        try_files $uri $uri/ /index.html;
    }

    # API проксирование на backend
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Статические файлы с кешем
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

```

### 🚑 Частая проблема: HTTPS даёт 504 Gateway Timeout

Если сертификат выдан и HTTPS открывается, но ответы идут 504 из Traefik:

1) Убедитесь, что оба сервиса имеют label выбора сети:

  - `traefik.docker.network=${TRAEFIK_NETWORK}`

2) Проверьте, что контейнер Traefik подключён к этой сети:

```bash
docker network inspect ${TRAEFIK_NETWORK} | grep -A2 'Containers' -n
```

3) Перезапустите стек и подождите 10–20 секунд:

```bash
docker-compose up -d
sleep 10
docker-compose ps
```

4) Проверьте доступ к backend внутри сети:

```bash
docker exec -it slideconfirm-frontend wget -qO- http://backend:8000/health || true
```

5) Если API в приложении смонтирован на `/`, а роут Traefik — `/api`, включите удаление префикса:

- `traefik.http.middlewares.api-prefix.stripprefix.prefixes=/api`
- `traefik.http.routers.slideconfirm-backend.middlewares=api-prefix`

Ожидаемый результат после исправлений:

- `curl -vk https://$DOMAIN/` возвращает HTML фронтенда
- `curl -vk https://$DOMAIN/api/health` возвращает JSON со статусом 200
```

### ШАГ 8: Построить образы

```bash
cd /opt/slideconfirm

# Построить образы (ДОЛГО на первый раз)
docker-compose build

# Или пересобрать заново
docker-compose build --no-cache
```

### ШАГ 9: Запустить контейнеры

```bash
# Запустить приложение
docker-compose up -d

# Проверить статус
docker-compose ps

# Вывод должен показать:
# NAME                  STATUS
# slideconfirm-backend  Up
# slideconfirm-frontend Up
# slideconfirm-db       Up
```

### ШАГ 10: Проверить работу

```bash
# Посмотреть логи backend
docker-compose logs -f backend

# Посмотреть логи frontend
docker-compose logs -f frontend

# Посмотреть логи БД
docker-compose logs -f db

# Проверить через curl
curl http://localhost:8000/health

# Проверить подключение к БД
docker exec slideconfirm-db psql -U slideconfirm -d slideconfirm -c "SELECT 1"
```

---

## 🔍 ПРОВЕРКА КОНФЛИКТОВ ПОРТОВ

### Полная диагностика

```bash
# ═══════════════════════════════════════════════════════════════
# 1. Посмотреть все контейнеры и их порты
# ═══════════════════════════════════════════════════════════════

docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

# Вывод:
# NAMES                     IMAGE                    STATUS         PORTS
# traefik                   traefik:latest           Up 30 days     0.0.0.0:80->80/tcp,0.0.0.0:443->443/tcp
# portainer                 portainer/portainer      Up 30 days     0.0.0.0:9000->9000/tcp
# slideconfirm-backend      slideconfirm:backend     Up 2 minutes
# slideconfirm-frontend     slideconfirm:frontend    Up 2 minutes
# slideconfirm-db           postgres:15-alpine       Up 2 minutes

# ═══════════════════════════════════════════════════════════════
# 2. Посмотреть слушающие порты на хосте
# ═══════════════════════════════════════════════════════════════

sudo netstat -tlnp | grep LISTEN

# или новая версия:

sudo ss -tlnp | grep LISTEN

# Вывод:
# LISTEN  0  128  127.0.0.1:22    0.0.0.0:*  1234/sshd
# LISTEN  0  128  0.0.0.0:80      0.0.0.0:*  5678/docker-proxy  ← Traefik
# LISTEN  0  128  0.0.0.0:443     0.0.0.0:*  5678/docker-proxy  ← Traefik
# LISTEN  0  128  0.0.0.0:9000    0.0.0.0:*  9012/docker-proxy  ← Portainer
# ...

# ═══════════════════════════════════════════════════════════════
# 3. Посмотреть Docker сети и подключения
# ═══════════════════════════════════════════════════════════════

docker network ls

docker network inspect traefik-net

# Вывод покажет какие контейнеры в сети:
# "Containers": {
#   "abc123...": {
#     "Name": "traefik",
#     "IPv4Address": "172.18.0.1/16"
#   },
#   "def456...": {
#     "Name": "portainer",
#     "IPv4Address": "172.18.0.2/16"
#   },
#   "ghi789...": {
#     "Name": "slideconfirm-backend",
#     "IPv4Address": "172.18.0.5/16"
#   },
#   ...
# }

# ═══════════════════════════════════════════════════════════════
# 4. Проверить использование ресурсов
# ═══════════════════════════════════════════════════════════════

docker stats

# Вывод (real-time):
# CONTAINER             CPU %   MEM USAGE      MEM %
# slideconfirm-backend  0.05%   120MiB/2GiB    6%
# slideconfirm-frontend 0.01%   45MiB/2GiB     2%
# slideconfirm-db       0.08%   200MiB/2GiB    10%
# traefik               0.02%   80MiB/2GiB     4%

# ═══════════════════════════════════════════════════════════════
# 5. Проверить логи Traefik
# ═══════════════════════════════════════════════════════════════

docker logs traefik

# Вывод должен показать что роуты добавлены:
# time="2025-10-19T10:00:00Z" level=info msg="Creating router slideconfirm-frontend"
# time="2025-10-19T10:00:00Z" level=info msg="Creating router slideconfirm-backend"
```

---

## 🚨 РЕШЕНИЕ ПРОБЛЕМ КОНФЛИКТОВ

### Проблема 1: Порт 80/443 уже используется

```bash
# Найти что использует порты
sudo lsof -i :80
sudo lsof -i :443

# Вывод может показать:
# COMMAND  PID  USER  FD  TYPE DEVICE SIZE NODE NAME
# nginx    123  root  6u  IPv4  1234      0t0 TCP *:http (LISTEN)

# Остановить это приложение
sudo systemctl stop nginx
# или
docker stop <CONTAINER_NAME>
```

### Проблема 2: Контейнер не подключается к traefik-net

```bash
# Проверить сеть Traefik
docker network inspect traefik-net

# Если контейнера нет в списке, подключить вручную:
docker network connect traefik-net slideconfirm-backend
docker network connect traefik-net slideconfirm-frontend
docker network connect traefik-net slideconfirm-db
```

### Проблема 3: Traefik не видит labels

```bash
# Перезагрузить контейнеры
docker-compose restart backend frontend

# Проверить логи Traefik
docker logs traefik | grep slideconfirm

# Должно показать что роуты созданы
```

### Проблема 4: SSL сертификат не выписан

```bash
# Проверить логи Traefik
docker logs traefik | grep letsencrypt

# Может быть проблема с DNS - убедиться что домен указывает на сервер
nslookup slideconfirm.yourdomain.com

# Если нужно, переписать сертификат
docker exec traefik traefik-renew-certificates

# Или удалить и пересоздать:
docker exec traefik rm -rf /letsencrypt/
docker-compose restart
```

---

## 📋 ИТОГОВЫЙ ЧЕКЛИСТ

```
ПРЕДВАРИТЕЛЬНАЯ ПРОВЕРКА:
- [ ] SSH подключение работает
- [ ] Docker установлен: docker --version
- [ ] Docker Compose установлен: docker-compose --version
- [ ] Traefik работает: docker ps | grep traefik
- [ ] Сеть traefik-net существует: docker network ls | grep traefik
- [ ] Порты 80/443 свободны: sudo ss -tlnp | grep :80

УСТАНОВКА SLIDECONFIRM:
- [ ] Проект загружен в /opt/slideconfirm
- [ ] Директории созданы: data/, logs/
- [ ] .env файл создан и отредактирован
- [ ] docker-compose.yml обновлен для Traefik
- [ ] docker-nginx-traefik.conf создан
- [ ] Dockerfile.backend отредактирован
- [ ] Dockerfile.frontend отредактирован

ЗАПУСК:
- [ ] docker-compose build выполнен успешно
- [ ] docker-compose up -d запущено
- [ ] docker-compose ps показывает все 3 контейнера
- [ ] docker logs показывает нормальный старт

ПРОВЕРКА TRAEFIK:
- [ ] Traefik обнаружил slideconfirm-backend label
- [ ] Traefik обнаружил slideconfirm-frontend label
- [ ] SSL сертификат выписан для домена
- [ ] https://yourdomain.com доступен
- [ ] https://yourdomain.com/api/health работает

ПРОИЗВОДСТВО:
- [ ] Все логи выглядят нормально
- [ ] Нет портов конфликтов
- [ ] БД подключена к backend
- [ ] Frontend может обращаться к API
- [ ] SSL сертификат автоматически обновляется
```

---

## 📊 СТРУКТУРА НА PRODUCTION СЕРВЕРЕ

```
/opt/slideconfirm/
├── .env                          # ⚠️ Переменные окружения
├── docker-compose.yml            # ✅ Обновлено для Traefik
├── Dockerfile.backend            # ✅ Обновлено
├── Dockerfile.frontend           # ✅ Обновлено
├── docker-nginx-traefik.conf    # ✅ Новый файл (без SSL)
├── requirements.txt
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── models.py
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── data/
│   ├── db/                       # 📁 PostgreSQL данные
│   └── uploads/                  # 📁 Загруженные файлы
└── logs/
    ├── backend/                  # 📁 Логи backend
    ├── postgres/                 # 📁 Логи БД
    └── nginx/                    # 📁 Логи Nginx (если нужны)

/etc/letsencrypt/
└── live/yourdomain.com/          # 📁 SSL сертификаты (Traefik управляет)

Docker:
├── traefik-net (сеть)            # ✅ Общая сеть для всех контейнеров
├── slideconfirm-backend
├── slideconfirm-frontend
├── slideconfirm-db
├── traefik
├── portainer
└── (другие приложения)
```

---

## 🎯 КОМАНДЫ УПРАВЛЕНИЯ

```bash
# 📦 СБОРКА И ЗАПУСК
cd /opt/slideconfirm
docker-compose build                    # Построить образы
docker-compose build --no-cache         # Пересоздать образы
docker-compose up -d                    # Запустить
docker-compose down                     # Остановить

# 📊 МОНИТОРИНГ
docker-compose ps                       # Статус контейнеров
docker-compose logs -f backend          # Логи backend (live)
docker-compose logs -f frontend         # Логи frontend (live)
docker-compose logs -f db               # Логи БД (live)
docker stats                            # Использование ресурсов

# 🔧 УПРАВЛЕНИЕ
docker-compose restart backend          # Перезагрузить backend
docker-compose exec backend bash        # Войти в контейнер backend
docker-compose exec db psql -U slideconfirm -d slideconfirm
                                        # Подключиться к БД

# 🗑️ ОЧИСТКА
docker-compose down -v                  # Удалить с данными (осторожно!)
docker image prune -a                   # Удалить неиспользуемые образы
docker volume prune                     # Удалить неиспользуемые volumes
```

**Готовы развертывать с Traefik?** 🚀
