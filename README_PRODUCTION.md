# 📦 SnapCheck - Production Ready

Production-готовое приложение для управления презентациями с системой отчетов об ознакомлении.

## 🎯 Быстрый старт

### На локальной машине (разработка)

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Frontend (в новом терминале)
cd frontend
npm install
npm run dev
```

### На Ubuntu сервере (production)

```bash
# Загрузить скрипт установки
bash install.sh

# Приложение запустится автоматически на :3000
```

## 📚 Документация

| Документ | Описание |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | ⚡ Быстрая установка за 5 минут |
| [PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md) | 🚀 Полное руководство production deployment |
| [RENAME_LOGIC.md](RENAME_LOGIC.md) | 📁 Переименование файлов слайдов |
| [USER_GUIDE_RENAME.md](USER_GUIDE_RENAME.md) | 👤 Руководство для пользователей |
| [INTERACTIVE_REPORT.md](INTERACTIVE_REPORT.md) | 📊 Интерактивный отчет |

## 🏗️ Структура проекта

```
SnapCheck/
├── backend/                    # FastAPI приложение
│   ├── main.py                # Главное приложение
│   ├── admin.py               # API админа
│   ├── slides*.py             # Работа со слайдами
│   ├── models.py              # SQLAlchemy модели
│   ├── database.py            # БД конфигурация
│   └── requirements.txt        # Зависимости Python
├── frontend/                   # React приложение
│   ├── src/
│   │   ├── pages/             # Страницы
│   │   ├── components/        # Компоненты
│   │   └── App.jsx            # Главный компонент
│   ├── package.json           # Зависимости Node.js
│   └── vite.config.js         # Vite конфигурация
├── Dockerfile.backend         # Docker backend
├── Dockerfile.frontend        # Docker frontend
├── docker-compose.prod.yml    # Production конфиг
├── install.sh                 # Скрипт установки
├── update.sh                  # Скрипт обновления
└── README.md                  # Этот файл
```

## 🚀 Deployment

### Локально

```bash
# Запуск оба сервиса
docker-compose -f docker-compose.prod.yml up

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### На Ubuntu сервере

```bash
# Одна команда для полной установки
sudo bash install.sh

# Приложение будет работать на :3000
# Всё автоматически запустится и перезагрузится при перезагрузке сервера
```

### С собственным доменом и HTTPS

```bash
# 1. Обновить домен в конфиге Nginx
sudo nano /etc/nginx/sites-available/snapcheck

# 2. Установить SSL сертификат
sudo certbot certonly --nginx -d yourdomain.com

# 3. Перезагрузить Nginx
sudo systemctl restart nginx
```

## ✨ Основные возможности

### 👥 Управление пользователями
- Создание пользователей с разными ролями
- Отслеживание статуса ознакомления
- Автоматическое логирование

### 📊 Презентации и слайды
- Загрузка презентаций со слайдами
- Автоматическое переименование файлов
- Редактирование названий слайдов
- Просмотр и управление

### 📋 Интерактивные отчеты
- Статистика по пользователям
- Кликабельные блоки для фильтрации
- Таблица с ФИО, email, прогрессом
- Категории: все, завершили, в процессе

### 🔄 Автоматическое переименование слайдов
- Поддержка любых форматов имён: `Slide1.jpeg`, `SLIDE2.JPG`, `slide_3.jpg`
- Автоматическое переименование в `slide1.jpg`, `slide2.jpg`
- Сортировка по номерам
- Логирование в консоль браузера

## 🔧 Конфигурация

### Переменные окружения

Создать `/opt/snapcheck/.env`:

```bash
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=sqlite:///./data/db/snapcheck.db
SECRET_KEY=your-secret-key-here
LOG_LEVEL=info
WORKERS=4
MAX_UPLOAD_SIZE=104857600
DOMAIN=yourdomain.com
```

## 📊 Мониторинг

### Проверка здоровья

```bash
# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000
```

### Логи

```bash
# Все логи
docker-compose logs -f

# Backend
docker-compose logs -f backend

# Frontend  
docker-compose logs -f frontend
```

### Статус контейнеров

```bash
docker-compose ps
docker stats
```

## 💾 Резервное копирование

```bash
# Автоматическое ежедневно в 2:00
0 2 * * * bash /opt/snapcheck/scripts/backup.sh

# Или вручную
bash /opt/snapcheck/scripts/backup.sh

# Файлы сохраняются в: /opt/snapcheck/data/backups/
```

## 🆘 Решение проблем

### Приложение не запускается

```bash
# 1. Проверить логи
docker-compose logs -f

# 2. Проверить здоровье
curl http://localhost:8000/health

# 3. Перезагрузить
docker-compose restart

# 4. Полный перезапуск
docker-compose down
docker-compose up -d
```

### Проблемы с портами

```bash
# Проверить занятые порты
sudo netstat -tlnp | grep LISTEN

# Изменить порты в docker-compose.prod.yml
# ports:
#   - "8080:8000"  # Другой порт для backend
#   - "3001:80"    # Другой порт для frontend
```

## 🔐 Безопасность

- ✅ HTTPS/SSL поддержка
- ✅ JWT токены для аутентификации
- ✅ CORS защита
- ✅ Rate limiting
- ✅ Валидация входных данных
- ✅ Защита от CSRF

## 📈 Требования к серверу

| Параметр | Минимум | Рекомендуемо |
|----------|---------|-------------|
| CPU | 1 ядро | 2+ ядра |
| RAM | 1 GB | 2-4 GB |
| Диск | 10 GB | 20+ GB |
| Сеть | 1 Mbps | 10 Mbps |

## 💰 Стоимость хостинга

| Провайдер | Тип | Цена |
|-----------|-----|------|
| DigitalOcean | Droplet 2GB | $6-12/мес |
| Linode | Nanode 1GB | $5/мес |
| Hetzner | Cloud CX11 | €3.99/мес |
| Яндекс.Облако | 2vCPU 2GB | ₽500-800/мес |

## 🚀 Обновление

```bash
# Запустить скрипт обновления
bash /opt/snapcheck/scripts/update.sh

# Или вручную
cd /opt/snapcheck/app
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 📱 API Endpoints

### Публичные

```
POST   /login               - Аутентификация
GET    /presentations       - Список презентаций
GET    /presentations/{id}  - Презентация
POST   /completion          - Отметить как просмотренную
GET    /health              - Проверка здоровья
```

### Админ (требуется токен)

```
GET    /admin/users         - Список пользователей
POST   /admin/users         - Создать пользователя
GET    /admin/report        - Отчет об ознакомлении
POST   /admin/presentations - Загрузить презентацию
POST   /admin/slides/upload-from-files - Загрузить слайды
```

## 🎓 Технологический стек

### Backend
- Python 3.9+
- FastAPI
- SQLAlchemy
- SQLite / PostgreSQL
- Uvicorn

### Frontend
- React 18.3+
- Vite
- Tailwind CSS
- Axios

### DevOps
- Docker
- Docker Compose
- Nginx
- Let's Encrypt

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте [QUICK_START.md](QUICK_START.md) для быстрого старта
2. Посмотрите логи: `docker-compose logs -f`
3. Проверьте [PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md) для подробной документации
4. Обратитесь к документации компонентов

## 📄 Лицензия

MIT License - смотрите LICENSE файл

## 🙏 Благодарности

Спасибо всем, кто использует SnapCheck!

---

**Version**: 1.0.0  
**Last Updated**: October 18, 2025  
**Status**: ✅ Production Ready
