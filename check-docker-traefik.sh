#!/bin/bash

# 🐳 DOCKER TRAEFIK DEPLOYMENT SCRIPT
# Проверяет конфликты портов, устанавливает SlideConfirm с Traefik

set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║          🐳 DOCKER TRAEFIK - SLIDECONFIRM DEPLOYMENT                       ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════════
# ФУНКЦИИ
# ═══════════════════════════════════════════════════════════════════════════════

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 не установлен${NC}"
        return 1
    fi
    return 0
}

check_port() {
    local port=$1
    if sudo ss -tlnp 2>/dev/null | grep -q ":$port "; then
        return 0  # Порт занят
    fi
    return 1  # Порт свободен
}

# ═══════════════════════════════════════════════════════════════════════════════
# 1️⃣ ПРЕДВАРИТЕЛЬНЫЕ ПРОВЕРКИ
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BLUE}1️⃣  ПРЕДВАРИТЕЛЬНЫЕ ПРОВЕРКИ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Проверка Docker
echo -n "  Проверка Docker... "
if check_command docker; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ $DOCKER_VERSION${NC}"
else
    echo -e "${RED}❌ Docker не установлен${NC}"
    exit 1
fi

# Проверка Docker Compose
echo -n "  Проверка Docker Compose... "
if check_command docker-compose; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✅ $COMPOSE_VERSION${NC}"
else
    echo -e "${RED}❌ Docker Compose не установлена${NC}"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 2️⃣ ПРОВЕРКА СУЩЕСТВУЮЩИХ КОНТЕЙНЕРОВ
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BLUE}2️⃣  ПРОВЕРКА СУЩЕСТВУЮЩИХ КОНТЕЙНЕРОВ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | head -20

CONTAINER_COUNT=$(docker ps -a --format "{{.Names}}" | wc -l)
echo -e "\n  ${GREEN}✅ Всего контейнеров: $CONTAINER_COUNT${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# 3️⃣ ПРОВЕРКА DOCKER СЕТЕЙ
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BLUE}3️⃣  ПРОВЕРКА DOCKER СЕТЕЙ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "  Доступные Docker сети:"
docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" | tail -n +2 | sed 's/^/    /'

# Проверить traefik-net
if docker network inspect traefik-net &> /dev/null; then
    echo -e "  ${GREEN}✅ Сеть traefik-net найдена${NC}"
    TRAEFIK_NET_EXISTS=1
else
    echo -e "  ${YELLOW}⚠️  Сеть traefik-net не найдена${NC}"
    TRAEFIK_NET_EXISTS=0
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 4️⃣ ПРОВЕРКА ПОРТОВ
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BLUE}4️⃣  ПРОВЕРКА ПОРТОВ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "  Проверка критичных портов:"

CRITICAL_PORTS=(22 80 443)
PORTS_OK=1

for port in "${CRITICAL_PORTS[@]}"; do
    if check_port $port; then
        echo -e "    ${RED}❌ Порт $port: ЗАНЯТ${NC}"
        
        # Показать что использует порт
        echo "       Используется:"
        sudo ss -tlnp 2>/dev/null | grep ":$port " | grep -oE "pid=[0-9]+/[^ ]+" | sed 's/^/         /'
        PORTS_OK=0
    else
        echo -e "    ${GREEN}✅ Порт $port: СВОБОДЕН${NC}"
    fi
done

if [ $PORTS_OK -eq 0 ]; then
    echo -e "\n${RED}⚠️  ВНИМАНИЕ: Некоторые порты заняты!${NC}"
    echo "  Вы можете:"
    echo "    1. Остановить конфликтующие приложения"
    echo "    2. Использовать другие порты"
    echo "    3. Продолжить (если знаете что делаете)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 5️⃣ ПРОВЕРКА TRAEFIK
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BLUE}5️⃣  ПРОВЕРКА TRAEFIK${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps --format "{{.Names}}" | grep -q "^traefik$"; then
    echo -e "  ${GREEN}✅ Traefik ЗАПУЩЕН${NC}"
    
    # Показать логи Traefik
    echo -n "  Последние логи Traefik: "
    docker logs traefik --tail 3 2>&1 | grep -i "error\|warning\|routing" | head -1 || echo "OK"
    
    # Показать маршруты
    echo "  Текущие маршруты Traefik:"
    docker exec traefik traefik config 2>/dev/null | grep -i "rule\|service" | head -5 | sed 's/^/    /' || echo "    (не удалось получить маршруты)"
else
    echo -e "  ${YELLOW}⚠️  Traefik НЕ ЗАПУЩЕН${NC}"
    echo "  Убедитесь что Traefik запущен перед запуском SlideConfirm"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 6️⃣ ПРОВЕРКА РЕСУРСОВ
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BLUE}6️⃣  ПРОВЕРКА РЕСУРСОВ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# RAM
TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}')
USED_MEM=$(free -h | awk '/^Mem:/ {print $3}')
echo -e "  Памяти: $USED_MEM / $TOTAL_MEM"

# Диск
DISK_INFO=$(df -h / | awk 'NR==2 {printf "%s / %s (%.1f%% использовано)", $3, $2, $5}')
echo -e "  Диска: $DISK_INFO"

# CPU
CPU_CORES=$(nproc)
echo -e "  CPU: $CPU_CORES ядер"

# ═══════════════════════════════════════════════════════════════════════════════
# 7️⃣ РЕКОМЕНДАЦИИ
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BLUE}7️⃣  РЕКОМЕНДАЦИИ И СЛЕДУЮЩИЕ ШАГИ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TRAEFIK_NET_EXISTS -eq 0 ]; then
    echo -e "  ${YELLOW}1. Создать сеть traefik-net:${NC}"
    echo "     docker network create traefik-net"
fi

echo -e "  2. Загрузить SlideConfirm проект:"
echo "     git clone https://github.com/YOUR_USERNAME/slideconfirm.git /opt/slideconfirm"

echo -e "  3. Создать .env файл с вашими параметрами:"
echo "     nano /opt/slideconfirm/.env"

echo -e "  4. Собрать Docker образы:"
echo "     cd /opt/slideconfirm && docker-compose build"

echo -e "  5. Запустить контейнеры:"
echo "     docker-compose up -d"

echo -e "  6. Проверить логи:"
echo "     docker-compose logs -f"

# ═══════════════════════════════════════════════════════════════════════════════
# ФИНАЛ
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════════════════╗"
echo -e "║                   ✅ ПРОВЕРКА ЗАВЕРШЕНА УСПЕШНО                             ║"
echo -e "╚════════════════════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}📋 ИТОГОВЫЙ СТАТУС:${NC}"
if [ $PORTS_OK -eq 1 ] && [ $TRAEFIK_NET_EXISTS -eq 1 ]; then
    echo -e "  ${GREEN}✅ Система готова к установке SlideConfirm${NC}"
else
    echo -e "  ${YELLOW}⚠️  Требуются дополнительные действия перед установкой${NC}"
fi

echo -e "\n${YELLOW}🔗 ССЫЛКИ ДЛЯ СПРАВКИ:${NC}"
echo "  📖 Документация: DOCKER_TRAEFIK_INSTALLATION.md"
echo "  🐳 Docker: https://docs.docker.com/"
echo "  ⚙️  Traefik: https://doc.traefik.io/"

echo ""
