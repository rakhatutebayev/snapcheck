#!/bin/bash

# SnapCheck Production Deployment Script
# Usage: ./production-deploy.sh [--skip-backup] [--no-cache]

# Настройки
PROJECT_DIR="/opt/snapcheck"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/snapcheck_deploy.log"
DOMAIN="lms.it-uae.com"

# Опции
SKIP_BACKUP=false
NO_CACHE=false

# Обработка аргументов
for arg in "$@"; do
    case $arg in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-backup    Skip database backup"
            echo "  --no-cache       Build images without cache"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
    esac
done

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Функция проверки успешности команды
check_status() {
    if [ $? -eq 0 ]; then
        log "✅ $1"
    else
        error "❌ $1 failed"
        exit 1
    fi
}

# Функция проверки health endpoint
check_health() {
    local url=$1
    local name=$2
    local retries=5
    local wait=5
    
    for i in $(seq 1 $retries); do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url")
        if [ "$HTTP_CODE" = "200" ]; then
            log "✅ $name is healthy (HTTP $HTTP_CODE)"
            return 0
        else
            warning "$name check attempt $i/$retries: HTTP $HTTP_CODE"
            if [ $i -lt $retries ]; then
                sleep $wait
            fi
        fi
    done
    
    error "❌ $name is unhealthy after $retries attempts"
    return 1
}

# Начало деплоя
log "========================================"
log "Starting SnapCheck Deployment (API v1.1.0)"
log "========================================"

# 1. Проверка окружения
info "Checking environment..."

# Проверить что запущен от root или с sudo
if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then 
    warning "Script is not running as root. Some operations may fail."
fi

# Проверить что Docker доступен
if ! command -v docker &> /dev/null; then
    error "Docker is not installed"
    exit 1
fi

# Проверить что docker compose доступен
if ! docker compose version &> /dev/null; then
    error "Docker Compose is not installed"
    exit 1
fi

log "✅ Environment check passed"

# 2. Перейти в директорию проекта
info "Changing to project directory: $PROJECT_DIR"
cd "$PROJECT_DIR" || { error "Failed to cd to $PROJECT_DIR"; exit 1; }
check_status "Changed directory"

# 3. Проверить текущий коммит
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_BRANCH=$(git branch --show-current)
log "Current branch: $CURRENT_BRANCH"
log "Current commit: $CURRENT_COMMIT"

# 4. Создать бэкап БД
if [ "$SKIP_BACKUP" = false ]; then
    info "Creating database backup..."
    BACKUP_FILE="$BACKUP_DIR/snapcheck_$(date +%Y%m%d_%H%M%S).sql.gz"
    mkdir -p "$BACKUP_DIR"
    
    if docker ps | grep -q "snapcheck-db-1"; then
        docker exec snapcheck-db-1 pg_dump -U snapcheck_user snapcheck 2>/dev/null | gzip > "$BACKUP_FILE"
        
        if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log "✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
        else
            warning "Backup file is empty or not created. Continuing anyway..."
        fi
    else
        warning "Database container not running. Skipping backup."
    fi
else
    warning "Skipping database backup (--skip-backup flag)"
fi

# 5. Получить обновления из Git
info "Fetching latest changes from Git..."
git fetch origin
check_status "Git fetch"

# Проверить есть ли обновления
if git diff --quiet HEAD origin/main; then
    warning "No new commits on origin/main. Current version is up to date."
    info "Current commit: $CURRENT_COMMIT"
    exit 0
fi

# Показать что будет обновлено
info "Changes to be deployed:"
git log --oneline --graph HEAD..origin/main

# Применить обновления
git pull origin main
check_status "Git pull"

NEW_COMMIT=$(git rev-parse --short HEAD)
log "New commit: $NEW_COMMIT"

# Показать изменения
info "Deployed changes:"
git log --oneline --graph "$CURRENT_COMMIT".."$NEW_COMMIT"

# 6. Проверить наличие миграций
if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q "backend/migrations"; then
    warning "New database migrations detected!"
    info "Running Alembic migrations..."
    
    docker compose -f docker-compose.prod.yml run --rm db-migrate
    check_status "Database migrations"
else
    info "No new migrations detected"
fi

# 7. Пересобрать и запустить сервисы
info "Building and starting services..."

BUILD_FLAGS="--build"
if [ "$NO_CACHE" = true ]; then
    BUILD_FLAGS="--build --no-cache"
    warning "Building without cache (--no-cache flag)"
fi

docker compose -f docker-compose.prod.yml up -d $BUILD_FLAGS
check_status "Docker compose up"

# 8. Подождать запуска сервисов
info "Waiting for services to start (30 seconds)..."
sleep 30

# 9. Проверить статус контейнеров
info "Checking container status..."
docker compose -f docker-compose.prod.yml ps

# 10. Проверить health endpoints
info "Checking application health..."

# Backend health
if ! check_health "https://$DOMAIN/api/health" "Backend"; then
    error "Backend health check failed!"
    warning "Recent backend logs:"
    docker compose -f docker-compose.prod.yml logs --tail=50 backend
    
    warning "Rolling back to $CURRENT_COMMIT..."
    git reset --hard "$CURRENT_COMMIT"
    docker compose -f docker-compose.prod.yml up -d --build
    error "Rollback completed. Please investigate the issue."
    exit 1
fi

# Frontend health
if ! check_health "https://$DOMAIN/" "Frontend"; then
    error "Frontend health check failed!"
    warning "Recent frontend logs:"
    docker compose -f docker-compose.prod.yml logs --tail=50 frontend
    
    warning "Rolling back to $CURRENT_COMMIT..."
    git reset --hard "$CURRENT_COMMIT"
    docker compose -f docker-compose.prod.yml up -d --build
    error "Rollback completed. Please investigate the issue."
    exit 1
fi

# 11. Дополнительные проверки
info "Running additional checks..."

# Проверить SSL сертификат
SSL_EXPIRY=$(echo | openssl s_client -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$SSL_EXPIRY" ]; then
    log "SSL certificate valid until: $SSL_EXPIRY"
else
    warning "Could not verify SSL certificate"
fi

# Проверить disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    warning "Disk usage is high: ${DISK_USAGE}%"
fi

# 12. Показать последние логи
info "Recent application logs:"
docker compose -f docker-compose.prod.yml logs --tail=30

# 13. Очистка
info "Cleaning up..."

# Удалить неиспользуемые Docker образы
docker image prune -f > /dev/null 2>&1

# Удалить старые бэкапы (старше 7 дней)
if [ -d "$BACKUP_DIR" ]; then
    DELETED_BACKUPS=$(find "$BACKUP_DIR" -name "snapcheck_*.sql.gz" -mtime +7 -print 2>/dev/null | wc -l)
    if [ "$DELETED_BACKUPS" -gt 0 ]; then
        log "Deleted $DELETED_BACKUPS old backup(s)"
    fi
fi

# 14. Итоговая информация
log "========================================"
log "Deployment Completed Successfully! 🎉 (API v1.1.0)"
log "========================================"
log "Deployed commit: $NEW_COMMIT"
log "Backend: https://$DOMAIN/api/health"
log "Frontend: https://$DOMAIN/"
log "========================================"

# Показать summary
info "Deployment Summary:"
echo "  • Previous commit: $CURRENT_COMMIT"
echo "  • New commit: $NEW_COMMIT"
echo "  • Backup: ${BACKUP_FILE:-skipped}"
echo "  • Backend health: ✅"
echo "  • Frontend health: ✅"
echo "  • Domain: https://$DOMAIN"

exit 0
