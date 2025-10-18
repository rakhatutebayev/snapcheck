#!/bin/bash

# SlideConfirm Production Deployment Script
# Обновление приложения

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║   🔄 SlideConfirm Update                           ║"
echo "╚════════════════════════════════════════════════════╝"

INSTALL_DIR="${1:-.}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$INSTALL_DIR/data/backups"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📋 Параметры:${NC}"
echo "  Install Dir: $INSTALL_DIR"
echo "  Backup Dir: $BACKUP_DIR"
echo ""

# Создание директории резервных копий
mkdir -p "$BACKUP_DIR"

# Функция для запуска команд
run_cmd() {
    echo -e "${YELLOW}▶ $1${NC}"
    eval "$1"
}

# Резервная копия БД
echo -e "${YELLOW}💾 Шаг 1: Резервная копия БД${NC}"
if [ -f "$INSTALL_DIR/data/db/slideconfirm.db" ]; then
    run_cmd "cp $INSTALL_DIR/data/db/slideconfirm.db $BACKUP_DIR/slideconfirm.db.$TIMESTAMP.backup"
    echo -e "${GREEN}✓ Резервная копия создана${NC}"
else
    echo -e "${YELLOW}⚠️  БД не найдена${NC}"
fi

# Остановка контейнеров
echo -e "${YELLOW}🛑 Шаг 2: Остановка контейнеров${NC}"
cd "$INSTALL_DIR/app"
run_cmd "docker-compose -f docker-compose.prod.yml down"

# Обновление кода
echo -e "${YELLOW}📥 Шаг 3: Обновление кода${NC}"
if [ -d .git ]; then
    run_cmd "git pull origin main || git pull origin master"
else
    echo -e "${YELLOW}⚠️  Git репозиторий не найден${NC}"
fi

# Сборка образов
echo -e "${YELLOW}🔨 Шаг 4: Сборка Docker образов${NC}"
run_cmd "docker-compose -f docker-compose.prod.yml build --no-cache"

# Запуск контейнеров
echo -e "${YELLOW}🚀 Шаг 5: Запуск контейнеров${NC}"
run_cmd "docker-compose -f docker-compose.prod.yml up -d"

# Ожидание запуска
echo -e "${YELLOW}⏳ Ожидание запуска (10 сек)...${NC}"
sleep 10

# Проверка здоровья
echo -e "${YELLOW}🏥 Шаг 6: Проверка здоровья${NC}"
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend работает${NC}"
else
    echo -e "${RED}✗ Backend не ответил${NC}"
    echo -e "${RED}Откатываем резервную копию...${NC}"
    run_cmd "cp $BACKUP_DIR/slideconfirm.db.$TIMESTAMP.backup $INSTALL_DIR/data/db/slideconfirm.db"
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d
    exit 1
fi

# Очистка старых резервных копий (старше 30 дней)
echo -e "${YELLOW}🗑️  Очистка старых резервных копий${NC}"
find "$BACKUP_DIR" -name "*.backup" -mtime +30 -delete

# Итоги
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ Обновление завершено!                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Информация:${NC}"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  Backup:   $BACKUP_DIR/slideconfirm.db.$TIMESTAMP.backup"
echo ""
echo -e "${YELLOW}🔍 Проверка логов:${NC}"
echo "  docker-compose logs -f"
echo ""
