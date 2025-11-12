#!/bin/bash

# SnapCheck Quick Start Script для Mac/Linux
# Используйте: chmod +x start.sh && ./start.sh

echo "🚀 SnapCheck - Запуск системы"
echo "================================"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Загружаем переменные окружения из .env.local (для локальной разработки) или .env
if [ -f .env.local ]; then
    echo -e "${YELLOW}📄 Загрузка .env.local переменных (dev mode)...${NC}"
    set -a
    # shellcheck disable=SC1091
    source .env.local
    set +a
elif [ -f .env ]; then
    echo -e "${YELLOW}📄 Загрузка .env переменных...${NC}"
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

# Убиваем старые процессы
echo -e "${YELLOW}⏹️  Остановка старых процессов...${NC}"
killall -9 python3 node npm 2>/dev/null
sleep 2

# Проверяем Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 не найден!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python3 найден${NC}"

# Проверяем npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm не найден!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm найден${NC}"

# Проверяем Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js не найден!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js найден${NC}"

# Запускаем бэкенд
echo -e "\n${YELLOW}🔧 Запуск бэкенда на порту 8000...${NC}"
cd "$(dirname "$0")"
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3

# Проверяем бэкенд
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Бэкенд работает${NC}"
else
    echo -e "${RED}❌ Бэкенд не запустился!${NC}"
    cat /tmp/backend.log
    exit 1
fi

# Запускаем фронтенд
echo -e "\n${YELLOW}🎨 Запуск фронтенда на порту 5173...${NC}"
cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
sleep 4

# Проверяем фронтенд
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Фронтенд работает${NC}"
else
    echo -e "${YELLOW}⚠️  Фронтенд может быть ещё в процессе запуска...${NC}"
fi

# Выводим информацию
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ Система запущена успешно!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}📱 Откройте браузер:${NC}"
echo -e "   • Локально: http://localhost:5173"
echo -e "   • По сети: http://<ваш-IP>:5173"
echo ""
echo -e "${YELLOW}🔐 Вход как администратор:${NC}"
echo -e "   Email: admin@gss.aero"
echo -e "   Пароль: admin123"
echo ""
echo -e "${YELLOW}👤 Вход как пользователь:${NC}"
echo -e "   Email: user@gss.aero"
echo -e "   Пароль: 123456"
echo ""
echo -e "${YELLOW}📖 Документация:${NC} cat README.md"
echo -e "${YELLOW}📝 Инструкции:${NC} cat INSTRUCTIONS.md"
echo ""
echo -e "${YELLOW}⏹️  Для остановки введите: Ctrl+C${NC}"
echo ""

# Держим процессы живыми
wait $BACKEND_PID $FRONTEND_PID
