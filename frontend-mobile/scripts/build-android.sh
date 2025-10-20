#!/bin/bash

# 📱 BUILD ANDROID PRODUCTION VERSION
# Используйте: bash scripts/build-android.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  📱 Building Android Production Version                        ║"
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
echo "🔨 Собираю Android приложение (это займет 10-15 минут)..."
eas build --platform android --type release

echo ""
echo "✅ Android приложение собрано!"
echo ""
echo "📥 Скачайте AAB файл:"
echo "   https://dashboard.expo.dev"
echo ""
echo "🚀 Опубликуйте в Play Store:"
echo "   eas submit --platform android --latest"
