#!/bin/bash

# 🐳 DOCKER DEPLOYMENT FOR UBUNTU
# Автоматическое развертывание SlideConfirm на Ubuntu сервер

set -e  # Остановить на ошибке

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Переменные
PROJECT_DIR="/opt/slideconfirm"
DOMAIN="${1:-your-domain.com}"

# ═══════════════════════════════════════════════════════════════════════════
# ФУНКЦИИ
# ═══════════════════════════════════════════════════════════════════════════

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  🐳 $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_step() {
    echo -e "${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════
# НАЧАЛО УСТАНОВКИ
# ═══════════════════════════════════════════════════════════════════════════

print_header "DOCKER DEPLOYMENT FOR SLIDECONFIRM"

# 1️⃣ Проверка прав администратора
print_step "1️⃣  Проверка прав администратора..."
if [[ $EUID -ne 0 ]]; then
    print_error "Скрипт должен быть запущен с sudo"
fi
print_success "Права администратора подтверждены"

# 2️⃣ Обновление системы
print_step "2️⃣  Обновление системы..."
apt update
apt upgrade -y
apt autoremove -y
print_success "Система обновлена"

# 3️⃣ Установка зависимостей
print_step "3️⃣  Установка зависимостей..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    wget \
    nano
print_success "Зависимости установлены"

# 4️⃣ Проверка Docker
print_step "4️⃣  Проверка Docker..."
if ! command -v docker &> /dev/null; then
    print_step "   Docker не установлен, устанавливаю..."
    
    # Добавить GPG ключ
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Добавить репозиторий
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Обновить пакеты
    apt update
    
    # Установить Docker
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Запустить Docker
    systemctl start docker
    systemctl enable docker
    
    print_success "Docker установлен"
else
    DOCKER_VERSION=$(docker --version)
    print_success "Docker уже установлен: $DOCKER_VERSION"
fi

# 5️⃣ Установка Docker Compose
print_step "5️⃣  Проверка Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    print_step "   Docker Compose не установлена, устанавливаю..."
    
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose установлена"
else
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose уже установлена: $COMPOSE_VERSION"
fi

# 6️⃣ Создать директорию проекта
print_step "6️⃣  Подготовка директории проекта..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR || exit 1
print_success "Директория: $PROJECT_DIR"

# 7️⃣ Загрузить проект
print_step "7️⃣  Загрузка проекта..."
if [ ! -d "$PROJECT_DIR/.git" ]; then
    print_step "   Клонирую репозиторий..."
    # Замените на ваш GitHub репозиторий
    git clone https://github.com/YOUR_USERNAME/slideconfirm.git . || \
    print_error "Не удалось клонировать репозиторий. Отредактируйте URL в скрипте"
else
    print_step "   Обновляю существующий репозиторий..."
    git pull
fi
print_success "Проект загружен"

# 8️⃣ Создать директории для данных
print_step "8️⃣  Создание директорий..."
mkdir -p data/db data/uploads logs/backend logs/nginx
chmod -R 755 .
print_success "Директории созданы"

# 9️⃣ Создать .env файл
print_step "9️⃣  Создание .env файла..."
if [ ! -f ".env" ]; then
    # Генерировать SECRET_KEY
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(16))")
    
    cat > .env << EOF
# Backend Security
SECRET_KEY=$SECRET_KEY
DATABASE_URL=postgresql://slideconfirm:$DB_PASSWORD@db:5432/slideconfirm
ACCESS_TOKEN_EXPIRE=30
REFRESH_TOKEN_EXPIRE=7

# Frontend
VITE_API_URL=https://api.$DOMAIN

# Environment
ENVIRONMENT=production
LOG_LEVEL=info

# Database
DB_PASSWORD=$DB_PASSWORD

# Email (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EOF
    
    print_success ".env файл создан"
    echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Отредактируйте .env файл перед запуском!${NC}"
    echo -e "${YELLOW}   nano $PROJECT_DIR/.env${NC}"
else
    print_success ".env файл уже существует"
fi

# 🔟 Собрать Docker образы
print_step "🔟 Сборка Docker образов (это займет 5-10 минут)..."
docker-compose -f docker-compose.prod.yml build --no-cache || \
print_error "Ошибка при сборке образов"
print_success "Образы собраны"

# 1️⃣1️⃣ Запустить контейнеры
print_step "1️⃣1️⃣ Запуск контейнеров..."
docker-compose -f docker-compose.prod.yml up -d || \
print_error "Ошибка при запуске контейнеров"
print_success "Контейнеры запущены"

# 1️⃣2️⃣ Ждать запуска приложений
print_step "1️⃣2️⃣ Ожидание запуска приложений (30 сек)..."
sleep 30

# 1️⃣3️⃣ Проверить статус
print_step "1️⃣3️⃣ Проверка статуса контейнеров..."
docker-compose -f docker-compose.prod.yml ps
print_success "Контейнеры запущены"

# 1️⃣4️⃣ Тестировать API
print_step "1️⃣4️⃣ Тестирование API..."
if curl -s http://localhost:8000/health | grep -q "ok"; then
    print_success "Backend работает!"
else
    echo -e "${YELLOW}⚠️  Backend может быть еще не готов${NC}"
    print_step "   Проверьте логи: docker-compose logs -f backend"
fi

# 1️⃣5️⃣ Установить SSL сертификат (Let's Encrypt)
print_step "1️⃣5️⃣ Установка SSL сертификата..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    print_success "Certbot установлен"
fi

print_step "   Получение SSL сертификата для $DOMAIN..."
certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || \
print_error "Ошибка при получении SSL сертификата"
print_success "SSL сертификат получен"

# 1️⃣6️⃣ Перезагрузить frontend с SSL
print_step "1️⃣6️⃣ Перезагрузка frontend с SSL..."
docker-compose -f docker-compose.prod.yml restart frontend
print_success "Frontend перезагружен"

# 1️⃣7️⃣ Настроить Firewall
print_step "1️⃣7️⃣ Настройка Firewall..."
ufw --force enable || print_success "UFW уже включен"
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
print_success "Firewall настроен"

# 1️⃣8️⃣ Создать backup скрипт
print_step "1️⃣8️⃣ Создание backup скрипта..."
cat > /usr/local/bin/slideconfirm-backup.sh << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/opt/slideconfirm/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "🔄 Creating backup..."
docker exec slideconfirm-db pg_dump -U slideconfirm slideconfirm > $BACKUP_DIR/db_$TIMESTAMP.sql
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz /opt/slideconfirm/data/uploads
echo "✅ Backup created: $BACKUP_DIR"
EOF
chmod +x /usr/local/bin/slideconfirm-backup.sh
print_success "Backup скрипт создан"

# 1️⃣9️⃣ Добавить в cron (ежедневный backup)
print_step "1️⃣9️⃣ Настройка автоматического backup (ежедневно в 3 утра)..."
CRON_ENTRY="0 3 * * * /usr/local/bin/slideconfirm-backup.sh"
(crontab -l 2>/dev/null | grep -v "slideconfirm-backup" ; echo "$CRON_ENTRY") | crontab - 2>/dev/null || true
print_success "Cron job добавлен"

# ═══════════════════════════════════════════════════════════════════════════
# ФИНАЛЬНЫЙ ВЫВОД
# ═══════════════════════════════════════════════════════════════════════════

print_header "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"

echo -e "${GREEN}📋 ИНФОРМАЦИЯ:${NC}"
echo -e "  Project Path:     ${BLUE}$PROJECT_DIR${NC}"
echo -e "  Domain:           ${BLUE}https://$DOMAIN${NC}"
echo -e "  Frontend:         ${BLUE}https://$DOMAIN${NC}"
echo -e "  Backend API:      ${BLUE}https://api.$DOMAIN${NC}"
echo -e "  Health Check:     ${BLUE}https://api.$DOMAIN/health${NC}"

echo -e "\n${GREEN}📝 ПОЛЕЗНЫЕ КОМАНДЫ:${NC}"
echo -e "  Статус контейнеров:"
echo -e "    ${BLUE}docker-compose -f docker-compose.prod.yml ps${NC}"
echo -e ""
echo -e "  Логи backend (live):"
echo -e "    ${BLUE}docker-compose -f docker-compose.prod.yml logs -f backend${NC}"
echo -e ""
echo -e "  Перезагрузить все:"
echo -e "    ${BLUE}docker-compose -f docker-compose.prod.yml restart${NC}"
echo -e ""
echo -e "  Backup БД:"
echo -e "    ${BLUE}/usr/local/bin/slideconfirm-backup.sh${NC}"
echo -e ""
echo -e "  Редактировать .env:"
echo -e "    ${BLUE}nano $PROJECT_DIR/.env${NC}"

echo -e "\n${YELLOW}⚠️  ВАЖНО:${NC}"
echo -e "  1. Отредактируйте $PROJECT_DIR/.env (замените SECRET_KEY, пароли)"
echo -e "  2. Обновите DNS записи для вашего домена"
echo -e "  3. Проверьте логи: docker-compose logs -f"
echo -e "  4. Сделайте первый backup: /usr/local/bin/slideconfirm-backup.sh"

echo -e "\n${GREEN}🎉 ГОТОВО! Развертывание завершено.${NC}\n"
