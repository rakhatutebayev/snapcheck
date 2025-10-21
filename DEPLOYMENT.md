# Руководство по деплою SnapCheck

Полное пошаговое руководство по развертыванию приложения SnapCheck на production сервер.

---

## Содержание

1. [Требования к серверу](#требования-к-серверу)
2. [Первоначальная настройка сервера](#первоначальная-настройка-сервера)
3. [Установка зависимостей](#установка-зависимостей)
4. [Настройка Traefik](#настройка-traefik)
5. [Первый деплой](#первый-деплой)
6. [Обновление приложения](#обновление-приложения)
7. [Rollback (откат)](#rollback-откат)
8. [Мониторинг и проверка](#мониторинг-и-проверка)
9. [Troubleshooting](#troubleshooting)
10. [Автоматизация деплоя](#автоматизация-деплоя)

---

## Требования к серверу

### Минимальные требования

- **OS**: Ubuntu 22.04 или 24.04 LTS
- **CPU**: 2 ядра
- **RAM**: 2 GB (рекомендуется 4 GB)
- **Disk**: 20 GB свободного места
- **Network**: Статический IP, открытые порты 80, 443

### Текущий сервер

```
IP: 88.99.124.218
Domain: lms.it-uae.com
OS: Ubuntu 24.04.1 LTS
```

---

## Первоначальная настройка сервера

### 1. Подключение к серверу

```bash
# С использованием пароля
ssh root@88.99.124.218

# С использованием SSH ключа (рекомендуется)
ssh -i ~/.ssh/id_ed25519 root@88.99.124.218
```

### 2. Обновление системы

```bash
# Обновить список пакетов
apt update

# Установить обновления
apt upgrade -y

# Перезагрузить (если обновилось ядро)
reboot
```

### 3. Настройка firewall

```bash
# Установить UFW
apt install ufw

# Разрешить SSH (ВАЖНО! Сделать до включения firewall)
ufw allow 22/tcp

# Разрешить HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Включить firewall
ufw enable

# Проверить статус
ufw status verbose
```

**Ожидаемый вывод:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### 4. Создание пользователя для деплоя (опционально)

```bash
# Создать пользователя
adduser deploy

# Добавить в sudo группу
usermod -aG sudo deploy

# Скопировать SSH ключи
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## Установка зависимостей

### 1. Docker

```bash
# Удалить старые версии (если есть)
apt remove docker docker-engine docker.io containerd runc

# Установить зависимости
apt install -y ca-certificates curl gnupg lsb-release

# Добавить Docker GPG ключ
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавить Docker репозиторий
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установить Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Проверить установку
docker --version
docker compose version
```

**Ожидаемый вывод:**
```
Docker version 24.0.x
Docker Compose version v2.x.x
```

### 2. Git

```bash
# Установить Git
apt install -y git

# Настроить Git
git config --global user.name "Deploy User"
git config --global user.email "deploy@example.com"

# Проверить
git --version
```

### 3. Дополнительные инструменты

```bash
# Установить полезные утилиты
apt install -y htop nano curl wget net-tools

# Установить certbot (опционально, Traefik сам получает сертификаты)
apt install -y certbot
```

---

## Настройка Traefik

### 1. Создать сеть для Traefik

```bash
# Создать внешнюю сеть
docker network create traefik_proxy

# Проверить
docker network ls | grep traefik
```

### 2. Создать директории для Traefik

```bash
# Создать директории
mkdir -p /opt/traefik/letsencrypt

# Создать конфигурацию
nano /opt/traefik/traefik.yml
```

**Содержимое traefik.yml:**
```yaml
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  myresolver:
    acme:
      email: admin@lms.it-uae.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik_proxy

log:
  level: INFO
  # level: DEBUG  # Для troubleshooting
```

### 3. Запустить Traefik

```bash
# Создать docker-compose для Traefik
nano /opt/traefik/docker-compose.yml
```

**Содержимое docker-compose.yml:**
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.1
    container_name: traefik
    restart: unless-stopped
    command:
      - "--configFile=/etc/traefik/traefik.yml"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - traefik_proxy
    labels:
      - "traefik.enable=true"

networks:
  traefik_proxy:
    external: true
```

```bash
# Запустить Traefik
cd /opt/traefik
docker compose up -d

# Проверить логи
docker logs traefik

# Проверить что работает
docker ps | grep traefik
```

---

## Первый деплой

### 1. Клонировать репозиторий

```bash
# Перейти в /opt
cd /opt

# Клонировать репозиторий
git clone https://github.com/rakhatutebayev/snapcheck.git

# Переименовать (опционально)
mv snapcheck snapcheck

# Перейти в директорию
cd snapcheck
```

### 2. Создать .env файл

```bash
# Создать .env
nano .env
```

**Содержимое .env:**
```bash
# Секреты (ОБЯЗАТЕЛЬНО изменить!)
SECRET_KEY=ваш-супер-секретный-ключ-минимум-32-символа

# База данных
POSTGRES_USER=snapcheck_user
POSTGRES_PASSWORD=сложный_пароль_БД_123
POSTGRES_DB=snapcheck
DATABASE_URL=postgresql://snapcheck_user:сложный_пароль_БД_123@db:5432/snapcheck

# Окружение
ENVIRONMENT=production
ALLOWED_ORIGINS=https://lms.it-uae.com

# Traefik
DOMAIN=lms.it-uae.com
ACME_EMAIL=admin@lms.it-uae.com
```

**Генерация SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Скопировать результат в .env
```

### 3. Проверить docker-compose.prod.yml

```bash
# Просмотреть конфигурацию
cat docker-compose.prod.yml

# Убедиться что:
# - Все сервисы подключены к traefik_proxy
# - Labels для Traefik настроены правильно
# - Healthchecks настроены
```

### 4. Запустить базу данных

```bash
# Запустить только БД
docker compose -f docker-compose.prod.yml up -d db

# Подождать пока БД запустится
sleep 10

# Проверить health
docker compose -f docker-compose.prod.yml ps
```

**Ожидаемый вывод:**
```
NAME                  STATUS
snapcheck-db-1        Up 10 seconds (healthy)
```

### 5. Запустить миграции

```bash
# Запустить миграцию базы
docker compose -f docker-compose.prod.yml run --rm db-migrate

# Проверить логи
docker compose -f docker-compose.prod.yml logs db-migrate
```

**Ожидаемый вывод:**
```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxxx, initial migration
```

### 6. Запустить все сервисы

```bash
# Собрать и запустить
docker compose -f docker-compose.prod.yml up -d --build

# Подождать запуска
sleep 30

# Проверить статус всех контейнеров
docker compose -f docker-compose.prod.yml ps
```

**Ожидаемый вывод:**
```
NAME                     STATUS
snapcheck-backend-1      Up 30 seconds (healthy)
snapcheck-db-1           Up 40 seconds (healthy)
snapcheck-frontend-1     Up 30 seconds (healthy)
```

### 7. Проверить работу

```bash
# Проверить backend
curl -f https://lms.it-uae.com/api/health
# Ожидаемый ответ: {"status":"ok"}

# Проверить frontend
curl -I https://lms.it-uae.com/
# Ожидаемый ответ: HTTP/2 200

# Проверить логи
docker compose -f docker-compose.prod.yml logs --tail=50
```

### 8. Проверить SSL сертификат

```bash
# Проверить сертификат
echo | openssl s_client -connect lms.it-uae.com:443 2>/dev/null | openssl x509 -noout -dates

# Должен быть Let's Encrypt сертификат со сроком действия ~90 дней
```

---

## Обновление приложения

### Стандартная процедура обновления

```bash
# 1. Подключиться к серверу
ssh root@88.99.124.218

# 2. Перейти в директорию проекта
cd /opt/snapcheck

# 3. Создать бэкап базы данных (ОБЯЗАТЕЛЬНО!)
docker exec snapcheck-db-1 pg_dump -U snapcheck_user snapcheck | gzip > /opt/backups/snapcheck_$(date +%Y%m%d_%H%M%S).sql.gz

# 4. Проверить текущий коммит
git log -1 --oneline

# 5. Получить обновления
git pull origin main

# 6. Проверить что изменилось
git log -5 --oneline

# 7. Остановить сервисы (опционально, для быстрого обновления)
docker compose -f docker-compose.prod.yml down

# 8. Пересобрать и запустить с новым кодом
docker compose -f docker-compose.prod.yml up -d --build

# 9. Подождать запуска
sleep 30

# 10. Проверить health всех сервисов
docker compose -f docker-compose.prod.yml ps

# 11. Проверить логи на ошибки
docker compose -f docker-compose.prod.yml logs --tail=100 | grep -i error

# 12. Проверить работу приложения
curl -f https://lms.it-uae.com/api/health
curl -I https://lms.it-uae.com/
```

### Обновление с миграциями БД

Если в обновлении есть новые миграции Alembic:

```bash
cd /opt/snapcheck

# Бэкап БД (ОБЯЗАТЕЛЬНО!)
docker exec snapcheck-db-1 pg_dump -U snapcheck_user snapcheck | gzip > /opt/backups/snapcheck_$(date +%Y%m%d_%H%M%S).sql.gz

# Получить обновления
git pull origin main

# Применить миграции
docker compose -f docker-compose.prod.yml run --rm db-migrate

# Пересобрать и запустить
docker compose -f docker-compose.prod.yml up -d --build

# Проверить
curl -f https://lms.it-uae.com/api/health
```

### Zero-downtime обновление (без остановки)

```bash
cd /opt/snapcheck

# Получить обновления
git pull origin main

# Пересобрать образы и перезапустить контейнеры поочередно
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
sleep 10
docker compose -f docker-compose.prod.yml up -d --build --no-deps frontend

# Проверить
curl -f https://lms.it-uae.com/api/health
```

---

## Rollback (откат)

### Откат кода без БД

```bash
cd /opt/snapcheck

# 1. Посмотреть историю коммитов
git log --oneline -10

# 2. Найти нужный коммит (например, f2c1e87)
# 3. Откатиться на него
git reset --hard f2c1e87

# 4. Пересобрать
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# 5. Проверить
curl -f https://lms.it-uae.com/api/health
```

### Откат с восстановлением БД

```bash
cd /opt/snapcheck

# 1. Откатить код
git reset --hard <коммит>

# 2. Остановить сервисы
docker compose -f docker-compose.prod.yml down

# 3. Восстановить БД из бэкапа
gunzip -c /opt/backups/snapcheck_20241021_030000.sql.gz | docker exec -i snapcheck-db-1 psql -U snapcheck_user snapcheck

# 4. Запустить сервисы
docker compose -f docker-compose.prod.yml up -d

# 5. Проверить
curl -f https://lms.it-uae.com/api/health
```

### Быстрый откат на предыдущий коммит

```bash
cd /opt/snapcheck

# Откатиться на 1 коммит назад
git reset --hard HEAD~1

# Пересобрать
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

---

## Мониторинг и проверка

### Health checks

```bash
# Backend health
curl https://lms.it-uae.com/api/health
# Ожидаемый ответ: {"status":"ok"}

# Frontend health (код ответа)
curl -I https://lms.it-uae.com/
# Ожидаемый ответ: HTTP/2 200

# Проверка через Docker
docker compose -f docker-compose.prod.yml ps
# Все сервисы должны быть (healthy)
```

### Проверка логов

```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Только backend
docker compose -f docker-compose.prod.yml logs -f backend

# Только frontend
docker compose -f docker-compose.prod.yml logs -f frontend

# Только база данных
docker compose -f docker-compose.prod.yml logs -f db

# Последние 100 строк
docker compose -f docker-compose.prod.yml logs --tail=100

# Поиск ошибок
docker compose -f docker-compose.prod.yml logs | grep -i error
```

### Проверка ресурсов

```bash
# Использование ресурсов контейнерами
docker stats --no-stream

# Использование диска
df -h

# Использование памяти
free -h

# Размер образов
docker images | grep snapcheck

# Размер volumes
docker volume ls
docker system df
```

### Проверка сети

```bash
# Проверка портов
netstat -tuln | grep LISTEN

# Проверка DNS
nslookup lms.it-uae.com

# Проверка сертификата
echo | openssl s_client -connect lms.it-uae.com:443 2>/dev/null | openssl x509 -noout -dates

# Проверка Traefik сети
docker network inspect traefik_proxy
```

### Проверка базы данных

```bash
# Подключиться к БД
docker exec -it snapcheck-db-1 psql -U snapcheck_user snapcheck

# Проверить таблицы
\dt

# Проверить пользователей
SELECT id, email, role FROM users;

# Выйти
\q

# Проверить размер БД
docker exec snapcheck-db-1 psql -U snapcheck_user -c "SELECT pg_size_pretty(pg_database_size('snapcheck'));"
```

---

## Troubleshooting

### Контейнер не запускается

```bash
# Проверить логи
docker compose -f docker-compose.prod.yml logs <service-name>

# Проверить конфигурацию
docker compose -f docker-compose.prod.yml config

# Попробовать запустить вручную
docker compose -f docker-compose.prod.yml up <service-name>

# Проверить healthcheck
docker inspect snapcheck-<service>-1 | grep -A 20 Health
```

### Backend возвращает 404

**Проблема:** Backend контейнер запущен, но API недоступен.

**Решение:**
```bash
# 1. Проверить логи backend
docker compose -f docker-compose.prod.yml logs backend

# 2. Проверить что uvicorn запущен
docker exec snapcheck-backend-1 ps aux | grep uvicorn

# 3. Проверить healthcheck изнутри контейнера
docker exec snapcheck-backend-1 curl -f http://localhost:8000/health

# 4. Проверить Traefik labels
docker inspect snapcheck-backend-1 | grep -A 10 traefik

# 5. Если проблема с imports - пересобрать с --no-cache
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d backend
```

### Frontend возвращает 404 через Traefik

**Проблема:** Frontend unhealthy или Traefik не видит router.

**Решение:**
```bash
# 1. Проверить health frontend контейнера
docker compose -f docker-compose.prod.yml ps frontend

# 2. Если unhealthy - проверить логи
docker compose -f docker-compose.prod.yml logs frontend

# 3. Проверить Nginx изнутри контейнера
docker exec snapcheck-frontend-1 curl -f http://127.0.0.1:80/

# 4. Включить DEBUG в Traefik
# В /opt/traefik/traefik.yml изменить:
# log:
#   level: DEBUG

# Перезапустить Traefik
cd /opt/traefik
docker compose restart

# 5. Проверить логи Traefik
docker logs traefik | grep frontend

# 6. Если видно "filtered as unhealthy" - увеличить start_period в healthcheck
```

### База данных недоступна

```bash
# 1. Проверить что контейнер запущен
docker compose -f docker-compose.prod.yml ps db

# 2. Проверить логи
docker compose -f docker-compose.prod.yml logs db

# 3. Проверить подключение изнутри
docker exec snapcheck-db-1 pg_isready -U snapcheck_user

# 4. Проверить пароль в .env
cat .env | grep POSTGRES_PASSWORD

# 5. Попробовать подключиться вручную
docker exec -it snapcheck-db-1 psql -U snapcheck_user snapcheck
```

### Старая версия на продакшене

**Проблема:** `git pull` выполнен, но приложение показывает старую версию.

**Причина:** Docker images не пересобраны.

**Решение:**
```bash
# ВСЕГДА использовать --build флаг
docker compose -f docker-compose.prod.yml up -d --build

# Для полной пересборки без кэша
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Проверить дату создания образов
docker images | grep snapcheck
# CreatedSince должен быть свежим
```

### Ошибка "Login failed" (405)

**Проблема:** Frontend делает запросы без /api prefix.

**Решение:** Проверить что используется centralized API client.

```bash
# На локальной машине
grep -r "axios.post.*auth" frontend/src/
# НЕ должно находить прямых вызовов axios

# Должен использоваться api client
grep -r "import.*api.*client" frontend/src/
```

Подробнее в [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Автоматизация деплоя

### Создать скрипт deploy.sh на сервере

```bash
# Создать скрипт
nano /opt/snapcheck/deploy.sh
```

**Содержимое deploy.sh:**
```bash
#!/bin/bash

# Настройки
PROJECT_DIR="/opt/snapcheck"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/snapcheck_deploy.log"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Начало деплоя
log "=== Starting deployment ==="

# 1. Перейти в директорию проекта
cd "$PROJECT_DIR" || { error "Failed to cd to $PROJECT_DIR"; exit 1; }

# 2. Проверить текущий коммит
CURRENT_COMMIT=$(git rev-parse --short HEAD)
log "Current commit: $CURRENT_COMMIT"

# 3. Создать бэкап БД
log "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/snapcheck_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p "$BACKUP_DIR"
docker exec snapcheck-db-1 pg_dump -U snapcheck_user snapcheck | gzip > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    log "Backup created: $BACKUP_FILE"
else
    error "Backup failed!"
    exit 1
fi

# 4. Получить обновления
log "Pulling latest changes..."
git pull origin main

NEW_COMMIT=$(git rev-parse --short HEAD)
log "New commit: $NEW_COMMIT"

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    warning "No new commits. Skipping deployment."
    exit 0
fi

# 5. Показать изменения
log "Changes:"
git log --oneline "$CURRENT_COMMIT".."$NEW_COMMIT"

# 6. Проверить наличие миграций
if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q "backend/migrations"; then
    log "New migrations detected. Running migrations..."
    docker compose -f docker-compose.prod.yml run --rm db-migrate
fi

# 7. Пересобрать и запустить
log "Building and starting services..."
docker compose -f docker-compose.prod.yml up -d --build

# 8. Подождать запуска
log "Waiting for services to start..."
sleep 30

# 9. Проверить health
log "Checking health..."

# Backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://lms.it-uae.com/api/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    log "✅ Backend is healthy"
else
    error "❌ Backend is unhealthy (HTTP $BACKEND_HEALTH)"
    warning "Rolling back..."
    git reset --hard "$CURRENT_COMMIT"
    docker compose -f docker-compose.prod.yml up -d --build
    exit 1
fi

# Frontend health
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://lms.it-uae.com/)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    log "✅ Frontend is healthy"
else
    error "❌ Frontend is unhealthy (HTTP $FRONTEND_HEALTH)"
    warning "Rolling back..."
    git reset --hard "$CURRENT_COMMIT"
    docker compose -f docker-compose.prod.yml up -d --build
    exit 1
fi

# 10. Проверить контейнеры
log "Container status:"
docker compose -f docker-compose.prod.yml ps

# 11. Показать последние логи
log "Recent logs:"
docker compose -f docker-compose.prod.yml logs --tail=20

# 12. Удалить старые бэкапы (старше 7 дней)
log "Cleaning old backups..."
find "$BACKUP_DIR" -name "snapcheck_*.sql.gz" -mtime +7 -delete

log "=== Deployment completed successfully ==="
log "Deployed commit: $NEW_COMMIT"
```

```bash
# Сделать исполняемым
chmod +x /opt/snapcheck/deploy.sh

# Протестировать
/opt/snapcheck/deploy.sh
```

### Использование deploy.sh

```bash
# Запустить деплой
ssh root@88.99.124.218 "/opt/snapcheck/deploy.sh"

# Или с локальной машины (одной командой)
ssh root@88.99.124.218 "cd /opt/snapcheck && git pull && ./deploy.sh"
```

### Настроить webhook для автоматического деплоя (опционально)

Можно настроить GitHub webhook для автоматического деплоя при push в main:

```bash
# Установить webhook handler
apt install -y webhook

# Создать конфигурацию webhook
nano /etc/webhook/hooks.json
```

```json
[
  {
    "id": "snapcheck-deploy",
    "execute-command": "/opt/snapcheck/deploy.sh",
    "command-working-directory": "/opt/snapcheck",
    "response-message": "Deployment started",
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha1",
        "secret": "your-webhook-secret",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature"
        }
      }
    }
  }
]
```

---

## Чек-лист деплоя

### Перед деплоем

- [ ] Код прошел ревью
- [ ] Тесты пройдены (если есть)
- [ ] .env файл актуален
- [ ] Бэкап БД создан
- [ ] Проверен текущий коммит

### Во время деплоя

- [ ] `git pull` выполнен успешно
- [ ] Миграции применены (если есть)
- [ ] `docker compose up -d --build` выполнен
- [ ] Контейнеры запущены (healthy)
- [ ] Логи не показывают ошибок

### После деплоя

- [ ] Backend health: 200 OK
- [ ] Frontend health: 200 OK
- [ ] Login работает
- [ ] Основной функционал работает
- [ ] SSL сертификат валиден
- [ ] Мониторинг показывает нормальные метрики

### При проблемах

- [ ] Логи проверены
- [ ] Rollback план готов
- [ ] Бэкап БД доступен
- [ ] Контакты техподдержки под рукой

---

## Быстрая справка - Команды деплоя

```bash
# Подключение к серверу
ssh root@88.99.124.218

# Стандартный деплой
cd /opt/snapcheck && \
docker exec snapcheck-db-1 pg_dump -U snapcheck_user snapcheck | gzip > /opt/backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz && \
git pull origin main && \
docker compose -f docker-compose.prod.yml up -d --build && \
sleep 30 && \
curl -f https://lms.it-uae.com/api/health && \
curl -I https://lms.it-uae.com/

# Деплой с миграциями
cd /opt/snapcheck && \
git pull origin main && \
docker compose -f docker-compose.prod.yml run --rm db-migrate && \
docker compose -f docker-compose.prod.yml up -d --build

# Rollback
cd /opt/snapcheck && \
git reset --hard HEAD~1 && \
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

# Проверка health
docker compose -f docker-compose.prod.yml ps
curl https://lms.it-uae.com/api/health
curl -I https://lms.it-uae.com/

# Просмотр логов
docker compose -f docker-compose.prod.yml logs -f
```

---

## Дополнительные ресурсы

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Решение проблем
- [SECURITY.md](./SECURITY.md) - Безопасность
- [README.md](./README.md) - Общая документация

---

## Поддержка

При проблемах с деплоем:
1. Проверить [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Проверить логи: `docker compose logs`
3. Проверить health: `docker compose ps`
4. Связаться с администратором
