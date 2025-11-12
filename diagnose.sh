#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════
# 🔍 ПОЛНАЯ ДИАГНОСТИКА ПРОБЛЕМЫ
# ════════════════════════════════════════════════════════════════════════════

set +e  # Не прерываем при ошибках

YELLOW='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

cd /opt/SnapCheck || { echo "Папка не найдена"; exit 1; }

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║            🔍 ПОЛНАЯ ДИАГНОСТИКА                      ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 1️⃣ Статус контейнеров
echo "═══════════════════════════════════════════════════════"
echo "1️⃣  СТАТУС КОНТЕЙНЕРОВ"
echo "═══════════════════════════════════════════════════════"
sudo docker-compose -f docker-compose-traefik.yml ps
echo ""

# 2️⃣ Логи backend (последние 100 строк)
echo "═══════════════════════════════════════════════════════"
echo "2️⃣  ЛОГИ BACKEND (последние 100 строк)"
echo "═══════════════════════════════════════════════════════"
sudo docker-compose -f docker-compose-traefik.yml logs backend --tail=100
echo ""

# 3️⃣ Проверка базы данных
echo "═══════════════════════════════════════════════════════"
echo "3️⃣  СОСТОЯНИЕ БАЗЫ ДАННЫХ"
echo "═══════════════════════════════════════════════════════"
echo "Проверка PostgreSQL..."
sudo docker-compose -f docker-compose-traefik.yml exec -T db pg_isready -U snapcheck
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ БД готова к подключению${NC}"
else
    echo -e "${RED}❌ БД не готова${NC}"
fi
echo ""

# 4️⃣ Проверка connectivity между контейнерами
echo "═══════════════════════════════════════════════════════"
echo "4️⃣  ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БД ИЗ BACKEND"
echo "═══════════════════════════════════════════════════════"
sudo docker-compose -f docker-compose-traefik.yml exec -T backend bash -c 'python3 -c "
import os
import psycopg2
try:
    conn = psycopg2.connect(
        host=\"db\",
        database=\"snapcheck\",
        user=\"snapcheck\",
        password=os.environ.get(\"DB_PASSWORD\", \"unknown\"),
        timeout=5
    )
    print(\"✅ Успешное подключение к БД\")
    conn.close()
except Exception as e:
    print(f\"❌ Ошибка подключения: {e}\")
" 2>&1
