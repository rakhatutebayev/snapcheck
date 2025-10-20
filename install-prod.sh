#!/bin/bash

# SnapCheck Production Auto-Installer
# Для DigitalOcean Ubuntu 20.04

set -e

echo "🚀 SnapCheck Production Installer"
echo "=================================="

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для печати сообщений
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Проверить что запущено с root
if [ "$EUID" -ne 0 ]; then 
    print_error "Нужно запустить с sudo!"
    exit 1
fi

print_status "Обновление системы..."
apt update && apt upgrade -y

print_status "Установка Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

print_status "Установка Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

print_status "Проверка Docker..."
docker --version
docker-compose --version

print_status "Создание папок..."
mkdir -p /opt/SlideConfirm
cd /opt/SlideConfirm

print_status "Клонирование репозитория..."
git clone https://github.com/YOUR_REPO/SlideConfirm.git . 2>/dev/null || print_warning "Git может быть не установлен, следуй инструкциям SFTP"

print_status "Создание необходимых папок..."
mkdir -p data/db
mkdir -p data/uploads
mkdir -p logs/backend
mkdir -p logs/nginx
chmod -R 755 data logs

print_status "Создание .env файла..."
cat > .env << 'EOF'
DATABASE_URL=sqlite:///./data/db/slideconfirm.db
ENVIRONMENT=production
LOG_LEVEL=info
WORKERS=4
SECRET_KEY=prod-secret-key-$(date +%s)-change-this
EOF

print_status "Запуск Docker контейнеров..."
docker-compose -f docker-compose.prod.yml up -d

print_status "Ожидание запуска контейнеров (30 сек)..."
sleep 30

print_status "Проверка статуса..."
docker-compose -f docker-compose.prod.yml ps

print_status "Проверка Backend..."
if curl -s http://localhost:8000/health > /dev/null; then
    print_status "Backend работает ✅"
else
    print_warning "Backend может быть в процессе запуска, подожди 30 сек"
fi

print_status "Проверка Frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend работает ✅"
else
    print_warning "Frontend может быть в процессе запуска, подожди 30 сек"
fi

# Получить IP адрес
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ УСТАНОВКА ЗАВЕРШЕНА!                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Приложение доступно по адресу:"
echo ""
echo "   🌐 http://${IP}:3000"
echo ""
echo "📚 Полезные команды:"
echo ""
echo "   Смотреть логи:           docker-compose -f docker-compose.prod.yml logs -f"
echo "   Перезагрузить:            docker-compose -f docker-compose.prod.yml restart"
echo "   Остановить:               docker-compose -f docker-compose.prod.yml down"
echo "   Обновить код:             cd /opt/SlideConfirm && git pull && docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔒 Для добавления SSL:"
echo ""
echo "   sudo apt install -y certbot"
echo "   sudo certbot certonly --standalone -d YOUR_DOMAIN.com"
echo ""
echo "📖 Подробный гайд: /opt/SlideConfirm/PRODUCTION_INSTALL_GUIDE.md"
echo "❓ FAQ:             /opt/SlideConfirm/PRODUCTION_FAQ.md"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
print_status "Готово к работе! 🎉"
