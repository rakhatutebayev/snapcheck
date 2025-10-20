#!/bin/bash
set -e

# 🚀 SMART UPDATE SCRIPT FOR SNAPCHECK
# Обновляет проект с минимальными простоями

echo "=================================================="
echo "🚀 SnapCheck Smart Update Script"
echo "=================================================="

cd /opt/snapcheck

# ═══════════════════════════════════════════════════════════════
# ШАГ 1: Загрузить изменения из GitHub
# ═══════════════════════════════════════════════════════════════
echo ""
echo "📥 Загружаю код из GitHub..."
git fetch origin main

# Показать что изменилось
echo ""
echo "📝 Изменённые файлы:"
git diff --name-only origin/main || echo "  (нет новых изменений)"

# Загрузить изменения
git pull origin main

# ═══════════════════════════════════════════════════════════════
# ШАГ 2: Определить что нужно пересобирать
# ═══════════════════════════════════════════════════════════════
echo ""
echo "🔍 Определяю что изменилось..."

CHANGED_BACKEND=0
CHANGED_FRONTEND=0
CHANGED_MIGRATIONS=0

# Проверить backend/миграции
if git diff HEAD~1 --name-only 2>/dev/null | grep -E "^backend/|^requirements.txt" > /dev/null 2>&1; then
    CHANGED_BACKEND=1
    echo "  ⚠️  Backend изменился"
fi

# Проверить frontend
if git diff HEAD~1 --name-only 2>/dev/null | grep -E "^frontend/|^Dockerfile.frontend" > /dev/null 2>&1; then
    CHANGED_FRONTEND=1
    echo "  ⚠️  Frontend изменился"
fi

# Проверить миграции
if git diff HEAD~1 --name-only 2>/dev/null | grep "migrations/versions" > /dev/null 2>&1; then
    CHANGED_MIGRATIONS=1
    echo "  ⚠️  Миграции БД есть - будут применены"
fi

# ═══════════════════════════════════════════════════════════════
# ШАГ 3: Применить миграции БД (если есть)
# ═══════════════════════════════════════════════════════════════
if [ $CHANGED_MIGRATIONS -eq 1 ]; then
    echo ""
    echo "🗄️  Применяю миграции БД..."
    docker-compose -f docker-compose.prod.yml run --rm db-migrate
    echo "  ✅ Миграции БД применены"
fi

# ═══════════════════════════════════════════════════════════════
# ШАГ 4: Пересобрать контейнеры (только если нужно)
# ═══════════════════════════════════════════════════════════════
if [ $CHANGED_BACKEND -eq 1 ]; then
    echo ""
    echo "🔨 Перестраиваю backend..."
    docker-compose -f docker-compose.prod.yml build --no-cache backend
fi

if [ $CHANGED_FRONTEND -eq 1 ]; then
    echo ""
    echo "🔨 Перестраиваю frontend..."
    docker-compose -f docker-compose.prod.yml build --no-cache frontend
fi

# ═══════════════════════════════════════════════════════════════
# ШАГ 5: Перезагрузить контейнеры
# ═══════════════════════════════════════════════════════════════
if [ $CHANGED_BACKEND -eq 1 ] || [ $CHANGED_FRONTEND -eq 1 ]; then
    echo ""
    echo "🚀 Перезагружаю контейнеры..."
    docker-compose -f docker-compose.prod.yml up -d backend frontend
    
    echo ""
    echo "⏳ Жду 10 секунд чтобы контейнеры стартовали..."
    sleep 10
    
    echo ""
    echo "📊 Статус контейнеров:"
    docker-compose -f docker-compose.prod.yml ps
else
    echo ""
    echo "ℹ️  Нет изменений в коде"
fi

# ═══════════════════════════════════════════════════════════════
# ШАГ 6: Проверить здоровье приложения
# ═══════════════════════════════════════════════════════════════
echo ""
echo "🏥 Проверяю здоровье приложения..."

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -k https://lms.it-uae.com/api/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "  ✅ Backend здоров (HTTP $HEALTH_CHECK)"
else
    echo "  ⚠️  Backend вернул HTTP $HEALTH_CHECK"
    echo ""
    echo "📋 Логи backend:"
    docker-compose -f docker-compose.prod.yml logs --tail 50 backend
fi

# ═══════════════════════════════════════════════════════════════
# ШАГ 7: Итоговый отчёт
# ═══════════════════════════════════════════════════════════════
echo ""
echo "=================================================="
echo "✅ Обновление завершено!"
echo "=================================================="
echo ""
echo "📌 Информация об обновлении:"
echo "  - Время: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  - Backend изменился: $([ $CHANGED_BACKEND -eq 1 ] && echo 'ДА ✓' || echo 'НЕТ')"
echo "  - Frontend изменился: $([ $CHANGED_FRONTEND -eq 1 ] && echo 'ДА ✓' || echo 'НЕТ')"
echo "  - Миграции применены: $([ $CHANGED_MIGRATIONS -eq 1 ] && echo 'ДА ✓' || echo 'НЕТ')"
echo ""
echo "🔗 URL приложения: https://lms.it-uae.com"
echo "📊 Статус API: https://lms.it-uae.com/api/health"
echo ""
