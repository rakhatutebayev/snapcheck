#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════
# 🔧 АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ И ПЕРЕЗАПУСК
# ════════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║      🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С BACKEND                ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Перейти в папку приложения
cd /opt/SlideConfirm || { echo -e "${RED}Папка /opt/SlideConfirm не найдена${NC}"; exit 1; }

echo -e "${YELLOW}Загрузка переменных из .env...${NC}"
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
else
    echo -e "${YELLOW}.env не найден, продолжу без загрузки переменных${NC}"
fi

echo -e "${YELLOW}Шаг 1/6: Остановка контейнеров...${NC}"
sudo docker-compose -f docker-compose-traefik.yml down -v

echo -e "${YELLOW}Шаг 2/6: Получение последних изменений из GitHub...${NC}"
sudo git pull origin main

echo -e "${YELLOW}Шаг 3/6: Пересборка образов backend (без кеша)...${NC}"
sudo docker-compose -f docker-compose-traefik.yml build --no-cache backend || true

echo -e "${YELLOW}Шаг 4/6: Запуск контейнеров...${NC}"
sudo docker-compose -f docker-compose-traefik.yml up -d

echo -e "${YELLOW}Шаг 5/6: Ожидание старта сервисов (60 секунд)...${NC}"
sleep 60

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📊 Статус контейнеров:"
echo "═══════════════════════════════════════════════════════"
sudo docker-compose -f docker-compose-traefik.yml ps

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🏥 Проверка здоровья:"
echo "═══════════════════════════════════════════════════════"

# Проверка backend
if sudo docker-compose -f docker-compose-traefik.yml exec -T backend curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend работает!${NC}"
else
    echo -e "${YELLOW}⚠️  Backend ещё стартует, подождите 1-2 минуты${NC}"
fi

# Проверка БД (используем переменные из .env, fallback на postgres)
DBU="${POSTGRES_USER:-postgres}"
DBN="${POSTGRES_DB:-postgres}"
if sudo docker-compose -f docker-compose-traefik.yml exec -T db pg_isready -U "$DBU" -d "$DBN" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ База данных работает!${NC}"
else
    echo -e "${RED}❌ База данных недоступна${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║            ✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!                  ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Приложение:  https://lms.it-uae.com"
echo "API Health:  https://lms.it-uae.com/api/health"
echo ""
echo "Если backend всё ещё не работает через 2 минуты, смотрите логи:"
echo "  sudo docker-compose -f docker-compose-traefik.yml logs db | tail -80"
echo "  sudo docker-compose -f docker-compose-traefik.yml logs backend | tail -120"
echo ""

exit 0
