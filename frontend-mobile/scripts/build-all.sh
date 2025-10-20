#!/bin/bash

# 📱 BUILD BOTH iOS & Android PRODUCTION VERSIONS
# Используйте: bash scripts/build-all.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  📱 Building iOS & Android Production Versions                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Проверить eas cli
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI не установлен"
    echo "Установите: npm install -g eas-cli"
    exit 1
fi

# Проверить expo
if ! command -v npx &> /dev/null; then
    echo "❌ npx не установлен"
    exit 1
fi

echo ""
echo "📋 Проверяю конфигурацию..."
npx expo doctor --fix-dependencies || true

echo ""
echo "📦 Устанавливаю зависимости..."
npm install

echo ""
echo "🔨 Собираю iOS и Android приложения (это займет 20-30 минут)..."
echo ""
echo "⏳ Начинаю сборку..."
eas build --platform all --type release

echo ""
echo "✅ Оба приложения собраны!"
echo ""
echo "📥 Скачайте файлы:"
echo "   https://dashboard.expo.dev"
echo ""
echo "   iOS: app-xxx.ipa"
echo "   Android: app-release.aab"
echo ""
echo "🚀 Опубликуйте в магазины:"
echo "   eas submit --platform all --latest"
