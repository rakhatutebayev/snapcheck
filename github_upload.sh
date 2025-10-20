#!/bin/bash

# 🚀 GitHub Upload Helper - Быстрая загрузка проекта на GitHub

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       SlideConfirm - GitHub Upload Helper                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Проверить что git инициализирован
if [ ! -d .git ]; then
    echo "❌ Git репозиторий не найден. Инициализируем..."
    git init
fi

echo ""
echo "📋 ИНСТРУКЦИЯ ПО ЗАГРУЗКЕ НА GITHUB:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ ШАГ 1: Git репозиторий готов"
echo ""

echo "🔧 ШАГ 2: Создать репозиторий на GitHub"
echo "   1. Откройте https://github.com/new"
echo "   2. Repository name: SlideConfirm"
echo "   3. Description: Presentation management system"
echo "   4. Выберите Public или Private"
echo "   5. НЕ выбирайте README, .gitignore, License"
echo "   6. Нажмите Create repository"
echo ""

echo "📝 ШАГ 3: Скопируйте команду для загрузки"
echo ""
echo "   Замените YOUR_USERNAME на ваше имя пользователя GitHub:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/SlideConfirm.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Введите ваше имя пользователя GitHub (или нажмите Enter для пропуска): " github_username

if [ ! -z "$github_username" ]; then
    echo ""
    echo "🚀 Загружаем проект..."
    echo ""
    
    # Установить remote
    git remote add origin https://github.com/$github_username/SlideConfirm.git 2>/dev/null || \
    git remote set-url origin https://github.com/$github_username/SlideConfirm.git
    
    # Установить main branch
    git branch -M main
    
    # Попробовать загрузить
    echo "📤 Загрузка файлов на GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ УСПЕШНО! Ваш проект загружен на GitHub!"
        echo ""
        echo "🔗 Ссылка: https://github.com/$github_username/SlideConfirm"
        echo ""
    else
        echo ""
        echo "⚠️  Возможно, требуется аутентификация"
        echo "   Используйте Personal Access Token вместо пароля"
        echo ""
        echo "   1. Откройте https://github.com/settings/tokens/new"
        echo "   2. Создайте новый токен с доступом 'repo'"
        echo "   3. Скопируйте токен и введите его как пароль"
        echo ""
    fi
else
    echo ""
    echo "ℹ️  Вы можете загрузить вручную, используя команды выше"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Статус репозитория:"
git remote -v
echo ""
echo "✓ Готово!"
