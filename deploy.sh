#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🚀 АВТОМАТИЧЕСКАЯ УСТАНОВКА SLIDECONFIRM НА СЕРВЕР
# ═══════════════════════════════════════════════════════════════

set -e  # Выход при первой ошибке

echo "╔════════════════════════════════════════════════════════╗"
echo "║      🚀 SLIDECONFIRM - АВТОМАТИЧЕСКАЯ УСТАНОВКА      ║"
echo "╚════════════════════════════════════════════════════════╝"

# ═══════════════════════════════════════════════════════════════
# ПРОВЕРКА ПАРАМЕТРОВ
# ═══════════════════════════════════════════════════════════════

if [ "$#" -lt 1 ]; then
    echo "❌ Использование: ./deploy.sh <GITHUB_REPO> [DOMAIN] [DB_PASSWORD]"
    echo ""
    echo "Примеры:"
    echo "  ./deploy.sh https://github.com/user/slideconfirm.git"
    echo "  ./deploy.sh https://github.com/user/slideconfirm.git slideconfirm.com"
    echo "  ./deploy.sh https://github.com/user/slideconfirm.git slideconfirm.com MyStrongPass123"
    exit 1
fi

GITHUB_REPO=$1
DOMAIN=${2:-"slideconfirm.local"}
DB_PASSWORD=${3:-"SlideConfirm$(date +%s)"}
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
INSTALL_DIR="/opt/slideconfirm"

# ═══════════════════════════════════════════════════════════════
# ЛОГИРОВАНИЕ
# ═══════════════════════════════════════════════════════════════

LOG_FILE="/var/log/slideconfirm-install.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 Начало установки SlideConfirm"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📦 GitHub репо: $GITHUB_REPO"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🌐 Домен: $DOMAIN"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📁 Директория: $INSTALL_DIR"

# ═══════════════════════════════════════════════════════════════
# ФУНКЦИИ ПРОВЕРКИ
# ═══════════════════════════════════════════════════════════════

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 не установлен"
        return 1
    else
        echo "✅ $1 установлен"
        return 0
    fi
}

check_port() {
    if sudo ss -tlnp | grep -q ":$1 "; then
        echo "❌ Порт $1 занят"
        return 1
    else
        echo "✅ Порт $1 свободен"
        return 0
    fi
}

# ═══════════════════════════════════════════════════════════════
# ЭТАП 1: ПРОВЕРКА ЗАВИСИМОСТЕЙ
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ЭТАП 1: Проверка зависимостей...                      ║"
echo "╚════════════════════════════════════════════════════════╝"

READY=true

echo "🔍 Проверка необходимых программ..."
check_command "docker" || READY=false
check_command "docker-compose" || READY=false
check_command "git" || READY=false
check_command "ssh" || READY=false

echo ""
echo "🔍 Проверка портов..."
check_port "80" || READY=false
check_port "443" || READY=false

if [ "$READY" = false ]; then
    echo ""
    echo "❌ Установите недостающие зависимости:"
    echo "  sudo apt update"
    echo "  sudo apt install -y docker.io docker-compose git openssh-client"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════
# ЭТАП 2: ПОДГОТОВКА ДИРЕКТОРИЙ
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ЭТАП 2: Подготовка директорий...                      ║"
echo "╚════════════════════════════════════════════════════════╝"

echo "📁 Создание директорий..."
sudo mkdir -p "$INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR/data/db"
sudo mkdir -p "$INSTALL_DIR/data/uploads"
sudo mkdir -p "$INSTALL_DIR/logs/backend"
sudo mkdir -p "$INSTALL_DIR/logs/frontend"
sudo chmod -R 755 "$INSTALL_DIR"

echo "✅ Директории готовы"

# ═══════════════════════════════════════════════════════════════
# ЭТАП 3: ЗАГРУЗКА ПРОЕКТА
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ЭТАП 3: Загрузка проекта из GitHub...                 ║"
echo "╚════════════════════════════════════════════════════════╝"

cd "$INSTALL_DIR"

if [ -d ".git" ]; then
    echo "📦 Проект уже существует, обновляем..."
    sudo git fetch origin
    sudo git reset --hard origin/main
else
    echo "📥 Клонирование репозитория..."
    sudo git clone "$GITHUB_REPO" .
fi

echo "✅ Проект загружен"

# ═══════════════════════════════════════════════════════════════
# ЭТАП 4: СОЗДАНИЕ .ENV ФАЙЛА
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ЭТАП 4: Создание конфигурации (.env)...               ║"
echo "╚════════════════════════════════════════════════════════╝"

ENV_FILE="$INSTALL_DIR/.env"

echo "📝 Генерирование .env файла..."

sudo tee "$ENV_FILE" > /dev/null << EOF
# ═══════════════════════════════════════════════════════════════
# SLIDECONFIRM - КОНФИГУРАЦИЯ PRODUCTION
# ═══════════════════════════════════════════════════════════════

# ОСНОВНЫЕ ПАРАМЕТРЫ
DOMAIN=$DOMAIN
ENVIRONMENT=production
LOG_LEVEL=info

# БЕЗОПАСНОСТЬ
SECRET_KEY=$SECRET_KEY
DB_PASSWORD=$DB_PASSWORD

# DATABASE
DATABASE_URL=postgresql://slideconfirm:$DB_PASSWORD@db:5432/slideconfirm

# FRONTEND
VITE_API_URL=https://$DOMAIN/api
NODE_ENV=production

# BACKEND
WORKERS=4
PYTHONUNBUFFERED=1

# ДАТА СОЗДАНИЯ
CREATED_AT=$(date '+%Y-%m-%d %H:%M:%S')
EOF

sudo chmod 600 "$ENV_FILE"
echo "✅ .env создан"

# ═══════════════════════════════════════════════════════════════
# ЭТАП 5: ПРОВЕРКА TRAEFIK
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ЭТАП 5: Проверка Traefik...                           ║"
echo "╚════════════════════════════════════════════════════════╝"

if docker network inspect traefik-net &> /dev/null; then
    echo "✅ Сеть traefik-net существует"
else
    echo "📋 Создание сети traefik-net..."
    sudo docker network create traefik-net
    echo "✅ Сеть создана"
fi

# ═══════════════════════════════════════════════════════════════
# ЭТАП 6: СБОРКА ОБРАЗОВ
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ЭТАП 6: Сборка Docker образов...                      ║"
echo "║         (это может занять 5-10 минут)                 ║"
echo "╚════════════════════════════════════════════════════════╝"

cd "$INSTALL_DIR"
sudo docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке образов"
    exit 1
fi

echo "✅ Образы собраны успешно"

# ═══════════════════════════════════════════════════════════════
# ЭТАП 7: ЗАПУСК КОНТЕЙНЕРОВ
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ЭТАП 7: Запуск контейнеров...                         ║"
echo "╚════════════════════════════════════════════════════════╝"

cd "$INSTALL_DIR"
sudo docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при запуске контейнеров"
    exit 1
fi

echo "✅ Контейнеры запущены"

# ═══════════════════════════════════════════════════════════════
# ЭТАП 8: ПРОВЕРКА СТАТУСА
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ЭТАП 8: Проверка статуса...                           ║"
echo "╚════════════════════════════════════════════════════════╝"

echo "⏳ Ожидание запуска (30 сек)..."
sleep 30

echo ""
echo "📊 Статус контейнеров:"
sudo docker-compose ps

# ═══════════════════════════════════════════════════════════════
# ЭТАП 9: ПРОВЕРКА ЗДОРОВЬЯ
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ЭТАП 9: Проверка здоровья приложения...              ║"
echo "╚════════════════════════════════════════════════════════╝"

echo "🔍 Проверка backend..."
if sudo docker-compose exec -T backend curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend здоров"
else
    echo "⚠️  Backend еще не готов (это нормально, дайте 1-2 минуты)"
fi

echo ""
echo "🔍 Проверка БД..."
if sudo docker-compose exec -T db pg_isready -U slideconfirm > /dev/null 2>&1; then
    echo "✅ БД здорова"
else
    echo "⚠️  БД еще не готова"
fi

# ═══════════════════════════════════════════════════════════════
# ЭТАП 10: ИТОГОВАЯ ИНФОРМАЦИЯ
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              ✅ УСТАНОВКА ЗАВЕРШЕНА                   ║"
echo "╚════════════════════════════════════════════════════════╝"

echo ""
echo "📋 ИНФОРМАЦИЯ О ВАШЕЙ УСТАНОВКЕ:"
echo "════════════════════════════════════════════════════════"
echo "🌐 Домен:              $DOMAIN"
echo "📁 Директория:         $INSTALL_DIR"
echo "🔐 БД пароль:          $DB_PASSWORD"
echo "🔑 SECRET_KEY:         ${SECRET_KEY:0:30}..."
echo "📝 Логи установки:     $LOG_FILE"
echo ""

echo "🎯 ПОЛЕЗНЫЕ КОМАНДЫ:"
echo "════════════════════════════════════════════════════════"
echo "Перейти в директорию проекта:"
echo "  cd $INSTALL_DIR"
echo ""
echo "Посмотреть статус контейнеров:"
echo "  sudo docker-compose ps"
echo ""
echo "Посмотреть логи всех сервисов:"
echo "  sudo docker-compose logs -f"
echo ""
echo "Посмотреть логи backend:"
echo "  sudo docker-compose logs -f backend"
echo ""
echo "Перезагрузить приложение:"
echo "  sudo docker-compose restart"
echo ""
echo "Остановить приложение:"
echo "  sudo docker-compose stop"
echo ""

echo "🔗 ПРОВЕРКА ДОСТУПНОСТИ:"
echo "════════════════════════════════════════════════════════"
echo "Frontend:   https://$DOMAIN"
echo "API:        https://$DOMAIN/api/health"
echo ""

echo "📚 ДОКУМЕНТАЦИЯ:"
echo "════════════════════════════════════════════════════════"
echo "Полный гайд:           $INSTALL_DIR/DOCKER_TRAEFIK_INSTALLATION.md"
echo "Быстрая шпаргалка:     $INSTALL_DIR/DOCKER_TRAEFIK_QUICK_START.md"
echo "Логи установки:        $LOG_FILE"
echo ""

echo "⏳ СЛЕДУЮЩИЕ ШАГИ:"
echo "════════════════════════════════════════════════════════"
echo "1. Убедитесь что DNS настроен (домен указывает на этот сервер)"
echo "2. Дождитесь когда Traefik выпишет SSL сертификат (~1 минута)"
echo "3. Посетите https://$DOMAIN в браузере"
echo "4. Проверьте что всё работает: https://$DOMAIN/api/health"
echo ""

echo "🆘 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ:"
echo "════════════════════════════════════════════════════════"
echo "Посмотрите логи:"
echo "  sudo docker-compose logs -f"
echo ""
echo "Проверьте что все контейнеры запущены:"
echo "  sudo docker-compose ps"
echo ""
echo "Проверьте логи Traefik:"
echo "  sudo docker logs traefik | grep slideconfirm"
echo ""

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Установка завершена успешно"

exit 0
