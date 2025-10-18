#!/bin/bash

# SlideConfirm Production Installation Script
# Установка на Ubuntu 20.04+

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║   🚀 SlideConfirm Production Installation          ║"
echo "╚════════════════════════════════════════════════════╝"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка прав
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Скрипт должен быть запущен от root${NC}"
   echo "Используйте: sudo bash install.sh"
   exit 1
fi

# Переменные
INSTALL_DIR="/opt/slideconfirm"
APP_USER="slideconfirm"
DOMAIN="${1:-localhost}"

echo -e "${YELLOW}📋 Параметры установки:${NC}"
echo "  Install Dir: $INSTALL_DIR"
echo "  App User: $APP_USER"
echo "  Domain: $DOMAIN"
echo ""

# Функция для запуска команд
run_cmd() {
    echo -e "${YELLOW}▶ $1${NC}"
    eval "$1"
}

# 1. Обновление системы
echo -e "${YELLOW}📦 Шаг 1: Обновление системы${NC}"
run_cmd "apt-get update"
run_cmd "apt-get upgrade -y"

# 2. Установка Docker и Docker Compose
echo -e "${YELLOW}🐳 Шаг 2: Установка Docker${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    bash get-docker.sh
    rm get-docker.sh
else
    echo -e "${GREEN}✓ Docker уже установлен${NC}"
fi

# 3. Установка Docker Compose
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}✓ Docker Compose уже установлен${NC}"
fi

# 4. Установка Git
echo -e "${YELLOW}📚 Шаг 3: Установка Git${NC}"
run_cmd "apt-get install -y git"

# 5. Создание пользователя
echo -e "${YELLOW}👤 Шаг 4: Создание пользователя${NC}"
if id "$APP_USER" &>/dev/null; then
    echo -e "${GREEN}✓ Пользователь $APP_USER уже существует${NC}"
else
    run_cmd "useradd -m -s /bin/bash $APP_USER"
    echo -e "${GREEN}✓ Пользователь $APP_USER создан${NC}"
fi

# 6. Создание директорий
echo -e "${YELLOW}📁 Шаг 5: Создание директорий${NC}"
run_cmd "mkdir -p $INSTALL_DIR/{app,config,data/{db,uploads},logs/{backend,nginx},scripts}"
run_cmd "chown -R $APP_USER:$APP_USER $INSTALL_DIR"

# 7. Клонирование приложения (предполагаем, что код уже есть)
echo -e "${YELLOW}📥 Шаг 6: Подготовка приложения${NC}"
echo "  ⚠️  Скопируйте код приложения в: $INSTALL_DIR/app"
echo "  Команда: cp -r /path/to/slideconfirm/* $INSTALL_DIR/app/"
echo ""
read -p "  Нажмите Enter когда код скопирован... "

# 8. Запуск Docker Compose
echo -e "${YELLOW}🚀 Шаг 7: Запуск приложения${NC}"
cd "$INSTALL_DIR/app"
run_cmd "docker-compose -f docker-compose.prod.yml build"
run_cmd "docker-compose -f docker-compose.prod.yml up -d"

# 9. Проверка статуса
echo -e "${YELLOW}⏳ Ожидание запуска приложения (10 сек)...${NC}"
sleep 10

echo -e "${YELLOW}🏥 Проверка здоровья${NC}"
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend работает${NC}"
else
    echo -e "${RED}✗ Backend не ответил${NC}"
fi

if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend работает${NC}"
else
    echo -e "${RED}✗ Frontend не ответил${NC}"
fi

# 10. Информация о системе
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ Установка завершена!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Информация:${NC}"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  Logs:     $INSTALL_DIR/logs"
echo ""
echo -e "${YELLOW}🔧 Полезные команды:${NC}"
echo "  cd $INSTALL_DIR/app"
echo "  docker-compose logs -f          # Все логи"
echo "  docker-compose logs -f backend  # Логи backend"
echo "  docker-compose ps               # Статус контейнеров"
echo ""
echo -e "${YELLOW}📚 Документация:${NC}"
echo "  Production гайд: PRODUCTION_DEPLOY.md"
echo "  Обновление: bash $INSTALL_DIR/scripts/update.sh"
echo "  Резервная копия: bash $INSTALL_DIR/scripts/backup.sh"
echo ""
