#!/bin/bash

# 📱 BUILD iOS PRODUCTION VERSION
# Используйте: bash scripts/build-ios.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  📱 Building iOS Production Version                           ║"
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
echo "🔨 Собираю iOS приложение (это займет 10-15 минут)..."
eas build --platform ios --type release

echo ""
echo "✅ iOS приложение собрано!"
echo ""
echo "📥 Скачайте IPA файл:"
echo "   https://dashboard.expo.dev"
echo ""
echo "🚀 Опубликуйте в App Store:"
echo "   eas submit --platform ios --latest"
