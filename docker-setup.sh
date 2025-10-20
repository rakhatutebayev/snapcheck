#!/bin/bash

# 🐳 DOCKER INSTALLATION & SETUP SCRIPT
# Автоматическая установка и запуск Docker для SlideConfirm

set -e  # Остановить на ошибке

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║           🐳 DOCKER INSTALLATION FOR SLIDECONFIRM                          ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

PROJECT_DIR="/Users/rakhat/Documents/webhosting/SlideConfirm"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1️⃣ Проверка Docker
echo -e "\n${YELLOW}1️⃣  Проверка Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен!${NC}"
    echo "Установите Docker Desktop с https://www.docker.com/products/docker-desktop"
    exit 1
else
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ $DOCKER_VERSION${NC}"
fi

# 2️⃣ Проверка Docker Compose
echo -e "\n${YELLOW}2️⃣  Проверка Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose не установлена!${NC}"
    echo "Установите: brew install docker-compose"
    exit 1
else
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✅ $COMPOSE_VERSION${NC}"
fi

# 3️⃣ Перейти в директорию проекта
echo -e "\n${YELLOW}3️⃣  Переход в директорию проекта...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Директория не найдена: $PROJECT_DIR${NC}"
    exit 1
fi
cd "$PROJECT_DIR"
echo -e "${GREEN}✅ Находимся в $PROJECT_DIR${NC}"

# 4️⃣ Создать необходимые директории
echo -e "\n${YELLOW}4️⃣  Создание директорий...${NC}"
mkdir -p data/db data/uploads logs/backend logs/nginx
echo -e "${GREEN}✅ Директории созданы${NC}"

# 5️⃣ Проверить .env файл
echo -e "\n${YELLOW}5️⃣  Проверка .env файла...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env файл не найден, создаем...${NC}"
    cat > .env << 'EOF'
# Backend Security
SECRET_KEY=your-random-secret-key-min-64-chars-replace-this
DATABASE_URL=sqlite:///./data/db/slideconfirm.db
ACCESS_TOKEN_EXPIRE=30
REFRESH_TOKEN_EXPIRE=7

# Frontend
VITE_API_URL=http://localhost:8000

# Environment
ENVIRONMENT=development
LOG_LEVEL=info
EOF
    echo -e "${GREEN}✅ .env файл создан (отредактируйте SECRET_KEY!)${NC}"
else
    echo -e "${GREEN}✅ .env файл найден${NC}"
fi

# 6️⃣ Проверить Docker файлы
echo -e "\n${YELLOW}6️⃣  Проверка Docker файлов...${NC}"
if [ ! -f "Dockerfile.backend" ] || [ ! -f "Dockerfile.frontend" ] || [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Не найдены Docker файлы!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Все Docker файлы присутствуют${NC}"

# 7️⃣ Проверить requirements.txt
echo -e "\n${YELLOW}7️⃣  Проверка requirements.txt...${NC}"
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ requirements.txt не найден!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ requirements.txt найден${NC}"

# 8️⃣ Отключить порты если они заняты
echo -e "\n${YELLOW}8️⃣  Проверка портов...${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Порт 3000 занят, освобождаю...${NC}"
    lsof -ti:3000 | xargs kill -9 || true
    sleep 2
fi
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Порт 8000 занят, освобождаю...${NC}"
    lsof -ti:8000 | xargs kill -9 || true
    sleep 2
fi
echo -e "${GREEN}✅ Порты свободны${NC}"

# 9️⃣ Собрать Docker образы
echo -e "\n${YELLOW}9️⃣  Сборка Docker образов (первый раз долго)...${NC}"
docker-compose -f docker-compose.prod.yml build
echo -e "${GREEN}✅ Образы собраны${NC}"

# 🔟 Запустить контейнеры
echo -e "\n${YELLOW}🔟 Запуск контейнеров...${NC}"
docker-compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✅ Контейнеры запущены${NC}"

# 1️⃣1️⃣ Ждать пока приложения стартуют
echo -e "\n${YELLOW}1️⃣1️⃣ Ожидание запуска приложений...${NC}"
sleep 5

# 1️⃣2️⃣ Проверить статус контейнеров
echo -e "\n${YELLOW}1️⃣2️⃣ Проверка статуса контейнеров...${NC}"
docker ps --filter "name=slideconfirm"

# 1️⃣3️⃣ Тестировать API
echo -e "\n${YELLOW}1️⃣3️⃣ Тестирование API...${NC}"
if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend работает${NC}"
else
    echo -e "${RED}❌ Backend не отвечает${NC}"
    echo "Логи:"
    docker logs slideconfirm-backend | tail -20
fi

# 1️⃣4️⃣ Финальный вывод
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════════════════╗"
echo -e "║                        ✅ DOCKER УСТАНОВКА ЗАВЕРШЕНА                            ║"
echo -e "╚════════════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}📋 ИНФОРМАЦИЯ:${NC}"
echo -e "  🌐 Frontend:     ${GREEN}http://localhost:3000${NC}"
echo -e "  🔌 Backend API:  ${GREEN}http://localhost:8000${NC}"
echo -e "  📊 Здоровье:     ${GREEN}http://localhost:8000/health${NC}"

echo -e "\n${YELLOW}📝 ПОЛЕЗНЫЕ КОМАНДЫ:${NC}"
echo -e "  ${GREEN}docker-compose -f docker-compose.prod.yml logs -f backend${NC}    # Логи backend"
echo -e "  ${GREEN}docker-compose -f docker-compose.prod.yml logs -f frontend${NC}   # Логи frontend"
echo -e "  ${GREEN}docker-compose -f docker-compose.prod.yml ps${NC}                 # Статус контейнеров"
echo -e "  ${GREEN}docker-compose -f docker-compose.prod.yml stop${NC}               # Остановить"
echo -e "  ${GREEN}docker-compose -f docker-compose.prod.yml restart${NC}            # Перезагрузить"

echo -e "\n${YELLOW}⚙️  СЛЕДУЮЩИЕ ШАГИ:${NC}"
echo -e "  1. Откройте ${GREEN}http://localhost:3000${NC} в браузере"
echo -e "  2. Отредактируйте ${GREEN}.env${NC} файл (замените SECRET_KEY)"
echo -e "  3. Пересобрите образы: ${GREEN}docker-compose -f docker-compose.prod.yml build --no-cache${NC}"
echo -e "  4. Перезагрузитесь: ${GREEN}docker-compose -f docker-compose.prod.yml restart${NC}"

echo -e "\n${GREEN}🎉 Готово!${NC}\n"
