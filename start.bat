@echo off
REM SlideConfirm Quick Start Script для Windows (PowerShell compatible)
REM Используйте: start.bat

setlocal enabledelayedexpansion

echo 🚀 SlideConfirm - Запуск системы
echo ================================

REM Ищем текущую директорию
for %%I in (.) do set SCRIPT_DIR=%%~dpI

REM Проверяем Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден!
    echo Пожалуйста установите Python с сайта https://www.python.org/
    pause
    exit /b 1
)
echo ✓ Python найден

REM Проверяем npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm не найден!
    echo Пожалуйста установите Node.js с сайта https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ npm найден

REM Убиваем старые процессы на портах
echo.
echo ⏹️  Остановка старых процессов...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /pid %%a /f 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /pid %%a /f 2>nul
timeout /t 2 /nobreak >nul

REM Запускаем бэкенд
echo.
echo 🔧 Запуск бэкенда на порту 8000...
cd /d "%SCRIPT_DIR%"
start "SlideConfirm Backend" python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
timeout /t 3 /nobreak >nul

REM Запускаем фронтенд
echo 🎨 Запуск фронтенда на порту 5173...
cd /d "%SCRIPT_DIR%frontend"
start "SlideConfirm Frontend" cmd /k npm run dev

REM Ждём перед открытием браузера
timeout /t 4 /nobreak >nul

REM Открываем браузер
echo.
echo ✅ Система запущена успешно!
echo.
echo 📱 Открываем браузер http://localhost:5173...
start http://localhost:5173

echo.
echo ================================
echo 🔐 Вход как администратор:
echo    Email: admin@gss.aero
echo    Пароль: 123456
echo.
echo 👤 Вход как пользователь:
echo    Email: user@gss.aero
echo    Пароль: 123456
echo.
echo 📖 Документация: README.md
echo 📝 Инструкции: INSTRUCTIONS.md
echo ================================
echo.
echo ⏹️  Для остановки закройте оба окна терминала
pause
