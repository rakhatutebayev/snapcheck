#!/bin/bash

# 📱 PUBLISH TO APP STORE & PLAY STORE
# Используйте: bash scripts/publish.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  📤 Publishing to App Store & Play Store                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Проверить eas cli
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI не установлен"
    echo "Установите: npm install -g eas-cli"
    exit 1
fi

echo ""
echo "Выберите платформу:"
echo "1) iOS только"
echo "2) Android только"
echo "3) iOS и Android"
read -p "Выбор (1-3): " choice

echo ""

if [ "$choice" = "1" ]; then
    echo "📱 Отправляю на App Store..."
    eas submit --platform ios --latest
    
elif [ "$choice" = "2" ]; then
    echo "📱 Отправляю на Play Store..."
    eas submit --platform android --latest
    
elif [ "$choice" = "3" ]; then
    echo "📱 Отправляю на App Store и Play Store..."
    eas submit --platform all --latest
    
else
    echo "❌ Неверный выбор"
    exit 1
fi

echo ""
echo "✅ Приложение отправлено на модерацию!"
echo ""
echo "📊 Проверяйте статус:"
echo "   iOS: https://appstoreconnect.apple.com"
echo "   Android: https://play.google.com/console"
