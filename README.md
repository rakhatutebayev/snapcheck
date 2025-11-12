# SnapCheck - Система управления корпоративными презентациями

## Статус: ✅ ГОТОВО К РАБОТЕ

Система полностью настроена и работает с новой архитектурой - ручной конверсией PPTX → JPG с удобной загрузкой через админ панель.

## 🚀 Запуск системы

### Бэкенд (FastAPI):
```bash
cd /Users/rakhat/Documents/webhosting/SnapCheck
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Фронтенд (Vite + React):
```bash
cd /Users/rakhat/Documents/webhosting/SnapCheck/frontend
npm run dev
```

**Сайт**: http://localhost:5173

---

## 🔐 Стартовые учётные данные

### Администратор
- **Email:** admin@gss.aero
- **Пароль:** 123456

### Обычный пользователь
- **Email:** user@gss.aero
- **Пароль:** 123456

---

## 📋 Новый рабочий процесс (с версии 2.0)

### Вместо автоматической конверсии PPTX → JPG:

1. **Пользователь вручную конвертирует PPTX в JPG** (LibreOffice, онлайн конвертер, PowerPoint и т.д.)
2. **Сохраняет JPG файлы в одну папку** с именами `slide1.jpg`, `slide2.jpg`, и т.д.
3. **В админ панели:**
   - Вводит путь к папке
   - Нажимает "🔍 Проверить" - система находит слайды
   - Вводит название презентации
   - Нажимает "✓ Загрузить [N] слайдов"
4. **Редактирует названия слайдов** в админ панели
5. **Публикует презентацию** - она становится доступна всем пользователям

### Преимущества нового подхода:
- ✅ Кроссплатформенность (Mac, Windows, Linux)
- ✅ Пользователь контролирует качество конвертирования
- ✅ Нет зависимости от LibreOffice на сервере
- ✅ Быстрая загрузка
- ✅ Простая модель - просто файлы в папке

---

## 🖥️ Примеры путей на разных ОС

```
macOS:    /Users/john/Documents/presentation_slides
Windows:  C:\Users\john\Documents\presentation_slides
Linux:    /home/john/presentation_slides
```

---

## 📁 Структура проекта

```
SnapCheck/
├── backend/
│   ├── main.py           # Главное FastAPI приложение
│   ├── models.py         # ORM модели (User, Presentation, Slide...)
│   ├── schemas.py        # Pydantic валидация
│   ├── database.py       # SQLite конфиг
│   ├── auth.py           # Аутентификация
│   ├── admin.py          # Управление пользователями
│   ├── slides.py         # Просмотр слайдов
│   ├── slides_admin.py   # ⭐ НОВОЕ: Управление слайдами для админа
│   ├── files.py          # Подача файлов
│   └── utils/
│       ├── security.py   # JWT, хэширование паролей
│       └── convert_pptx.py  # (deprecated)
├── frontend/
│   │   │   ├── AdminPanel.jsx         # ⭐ ОБНОВЛЕНА: Новый интерфейс загрузки
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🔌 API эндпоинты

### Проверка слайдов в папке (новый эндпоинт)
```
POST /admin/slides/check-folder
Headers: Authorization: Bearer {token}
Body: {
  "folder_path": "/path/to/slides"
}
Response: {
  "status": "success",
  "folder_path": "/path/to/slides",
  "slides_count": 10,
  "slides": [
    {"order": 1, "filename": "slide1.jpg", "size": 18826},
    ...
  ]
}
```
### Загрузка слайдов из папки
```
POST /admin/slides/upload-from-folder
Headers: Authorization: Bearer {token}
Body: {
  "folder_path": "/path/to/slides",
  "presentation_title": "Грамположительные бактерии"
}
Response: {
  "status": "success",
  "presentation": {"id": 1, "title": "...", ...},
  "slides_count": 10
}
```

### Получение слайдов презентации
```
GET /admin/slides/{presentation_id}
Headers: Authorization: Bearer {token}
Response: {
  "status": "success",
  "data": [
    {"id": 1, "order": 1, "title": "Слайд 1", ...},
    ...
  ]
}
```

### Обновление названия слайда
```
PUT /admin/slides/{slide_id}/title
Headers: Authorization: Bearer {token}
Body: {"title": "Введение в бактерии"}
```

### Публикация/Снятие с публикации
```
POST /admin/presentations/{presentation_id}/publish
POST /admin/presentations/{presentation_id}/unpublish
Headers: Authorization: Bearer {token}
```

### Удаление презентации (требует подтверждение)
```
DELETE /admin/presentations/{presentation_id}?confirm=true
Headers: Authorization: Bearer {token}
```

---

## 📊 Структура БД

### users
```sql
id (PK) | first_name | last_name | email | password_hash | role | created_at
```

### presentations
```sql
id (PK) | title | filename | status (draft/published) | uploaded_at | published_at
```

### slides
```sql
id (PK) | presentation_id (FK) | filename | title | order | uploaded_at
```

### user_slide_progress
```sql
id (PK) | user_id (FK) | slide_id (FK) | viewed
```

### user_completion
```sql
id (PK) | user_id (FK) | presentation_id (FK) | completed_at
```

---

## 🛠️ Технологии

### Backend
- FastAPI 0.119.0
- SQLAlchemy 2.0.44
- SQLite (файловая БД)
- Python 3.8+
- JWT (HS256)
- bcrypt

### Frontend
- React 18.3.1
- Vite 5.4.20
- Tailwind CSS 3.4.0
- Axios
- Lucide React (иконки)

---

## 🔧 Развёртывание на продакшене

1. Используйте переменные окружения для настроек
2. Измените SECRET_KEY в `backend/utils/security.py`
# SnapCheck (SnapCheck)
3. Используйте PostgreSQL вместо SQLite
4. Разверните на облачной платформе (Heroku, AWS, DigitalOcean и т.д.)
5. Используйте HTTPS
6. Настройте CORS правильно

##  Автор
GSS Training System


## 📋 Рабочий процесс

- Экспортируйте каждый слайд как JPG файл
- Сохраните файлы с названиями: `slide1.jpg`, `slide2.jpg`, `slide3.jpg` и т.д.
- Поместите все файлы в одну папку, например: `/Users/user/Documents/my_slides/`

**Пример структуры:**
```
/Users/user/Documents/my_slides/
├── slide3.jpg
└── slide4.jpg
```

### 2. Загрузка презентации в систему
1. Войдите в админ панель (admin@gss.aero / 123456)
2. Перейдите на вкладку **"📤 Загрузить"**
3. Укажите:
   - **Путь к папке**: `/Users/user/Documents/my_slides`
   - **Название презентации**: "Грамположительные и грамотрицательные бактерии"
4. Нажмите **"Загрузить слайды"**
5. Система создаст презентацию в статусе **"Черновик"**

### 3. Редактирование названий слайдов
1. На вкладке **"📁 Презентации"** кликните на презентацию
2. Откроется список всех слайдов
3. Для каждого слайда нажмите **"Редактировать"**
4. Введите название (например: "Характеристики грамположительных бактерий")
5. Нажмите **"Сохранить"**

### 4. Публикация презентации
1. Когда готовы - нажмите **"Опубликовать"** на презентации
2. Статус изменится на **"✅ Опубликована"**
3. Сотрудники смогут смотреть эту презентацию на странице "Просмотр"

### 5. Управление пользователями
- Вкладка **"👥 Пользователи"** для создания новых сотрудников
- Можно назначать администраторов и обычных пользователей

### 6. Просмотр отчётов
  - Процент выполнения

## 👥 Учётные данные по умолчанию
| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@gss.aero | 123456 |

## 🗄️ База данных
```
Тип: SQLite
```

```
Местоположение: /tmp/snapcheck_uploads/
Структура:
│   ├── 1/
│   │   ├── slide1.jpg
│   │   ├── slide2.jpg
│   │   └── slide3.jpg
│   └── 2/
│       └── slide2.jpg
```

### Аутентификация
- `POST /auth/login` - Вход в систему
### Просмотр презентаций
- `GET /slides/` - Получить список всех опубликованных презентаций
- `GET /slides/{presentation_id}` - Получить слайды конкретной презентации
- `GET /slides/image/{slide_id}/{filename}` - Скачать изображение слайда

### Управление (админ)
- `POST /admin/slides/upload-from-folder` - Загрузить слайды из папки
- `GET /admin/slides/{presentation_id}` - Получить все слайды презентации
- `POST /admin/presentations/{presentation_id}/unpublish` - Снять с публикации
- `DELETE /admin/presentations/{presentation_id}?confirm=true` - Удалить
- `GET /admin/presentations` - Получить список всех презентаций

- FastAPI 0.119.0
- SQLAlchemy 2.0.44
- SQLite
- Python 3.10+

**Frontend:**
- React 18.3.1
- Vite 5.4.20
- Tailwind CSS 3.4.0
- Lucide React icons

**Аутентификация:**
- JWT tokens (HS256)
- Bcrypt хеширование паролей

## ✨ Новые функции в текущей версии

✅ Ручная конверсия PPTX → JPG (пользователь сам конвертирует)
✅ Загрузка предконвертированных слайдов из папки
✅ Автоматическое определение порядка слайдов по номерам в имени файла
✅ Редактирование названий слайдов через админ панель
✅ Подтверждение перед удалением презентаций
✅ Статусы: Черновик, Опубликована
✅ Управление пользователями и их ролями
✅ Отчёты об ознакомлении с презентациями

## 🔧 Поиск и решение проблем

### Система не стартует
```bash
# Проверьте, свободны ли порты
lsof -i :8000  # Бэкенд
lsof -i :5173  # Фронтенд

# Убейте старые процессы
killall -9 python3 node npm

# Удалите старую БД
rm /tmp/snapcheck.db
```

---

## 🚀 Развертывание в продакшене

### Быстрый старт (5 минут):

```bash
# На сервере Ubuntu 20.04+
sudo bash /opt/SnapCheck/install-prod.sh
```

Или вручную:

```bash
# 1. Установить Docker
curl -fsSL https://get.docker.com | sudo sh

# 2. Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Запустить контейнеры
cd /opt/SnapCheck
docker-compose -f docker-compose.prod.yml up -d

# 4. Открыть браузер
# http://YOUR_SERVER_IP:3000
```

### Платформы:
- ✅ **DigitalOcean** - $5/месяц (рекомендуется)
- ✅ **AWS EC2** - Бесплатно (год)
- ✅ **Heroku** - $7/месяц
- ✅ **Любой Linux VPS**

### Полная документация:
- 📖 **PRODUCTION_INSTALL_GUIDE.md** - Полный гайд
- ⚡ **QUICK_DEPLOY.md** - Быстрый старт
- ❓ **PRODUCTION_FAQ.md** - 25+ ответов
- 🛣️ **DEPLOYMENT_ROADMAP.md** - Дорожная карта

### Затраты:
- Сервер: $5/месяц
- Домен: ~$1/месяц  
- SSL: БЕСПЛАТНО (Let's Encrypt)
- **ИТОГО: $6/месяц** 💰

---

## 📱 Мобильное приложение

React Native приложение (Expo) в папке `frontend-mobile/`:

```bash
cd frontend-mobile
npm install
npm start

# На телефоне установи Expo Go
# и отсканируй QR код
```

---

### Ошибка при загрузке слайдов
- Проверьте, что путь к папке правильный
- Проверьте наличие файлов `slide1.jpg`, `slide2.jpg` и т.д.
- Убедитесь, что файлы это JPEG изображения

### Слайды не показываются
- Проверьте, что презентация в статусе "Опубликована"
- Проверьте права доступа на файлы в `/tmp/snapcheck_uploads/`

## 📝 Примеры использования API

### Загрузка слайдов
```bash
curl -X POST http://localhost:8000/admin/slides/upload-from-folder \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "folder_path": "/Users/user/slides",
    "presentation_title": "Новая презентация"
  }'
```

### Обновление названия слайда
```bash
curl -X PUT http://localhost:8000/admin/slides/1/title \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Новое название слайда"}'
```

### Публикация презентации
```bash
curl -X POST http://localhost:8000/admin/presentations/1/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Версия**: 1.1.0  
**Дата**: Ноябрь 2025  
**Статус**: Production Ready ✅

### Изменения в 1.1.0
| Тип | Описание |
|-----|----------|
| ✨ Feature | Добавлен фильтр отчета по конкретной презентации (`GET /admin/report?presentation_title=...` или `presentation_id`) |
| 🛠 Improvement | UI: Dropdown "All Presentations" + немедленная перезагрузка отчета при выборе |
| 📊 Reporting | В ответе теперь есть поле `selected_presentation` и корректная бинарная метрика `completion_count` при узком фильтре |
| 📄 Docs | Обновлено описание эндпоинта /admin/report и README | 
| ♻ Refactor | Код отчета объединяет предыдущую агрегированную логику и точечную фильтрацию |

#### Пример выборочного отчета по названию
```
GET /admin/report?presentation_title=Грамположительные%20бактерии
Authorization: Bearer <TOKEN>
Response:
{
  "status": "success",
  "data": {
    "total_users": 42,
    "completed": 17,
    "pending": 25,
    "completion_percentage": 40.47,
    "users": [ {"id":1, "completion_count":1, ...}, ... ],
    "all_presentations": ["Грамположительные бактерии", "Основы безопасности"],
    "selected_presentation": {"id": 7, "title": "Грамположительные бактерии"}
  }
}
```

#### Сброс к агрегату (все презентации)
```
GET /admin/report
GET /admin/report?presentation_title=all
```

> Для production UI: рекомендуется кешировать список презентаций и подбирать `presentation_id` для уменьшения двусмысленности имен.

---

## 📚 Полная документация

### 🔧 Для разработчиков

- 📖 **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** — Полный справочник всех проблем, возникших при разработке проекта, с подробными решениями
  - Backend issues (импорты, 404, IntegrityError)
  - Frontend issues (404 от Traefik, 405 при login, устаревшие версии)
  - Infrastructure issues (Traefik роутеры, Nginx SPA конфиг)
  - Deployment issues (пересборка образов)
  - Database issues (пользователи, пароли)
  - Quick reference и Best practices

### 🚀 Для деплоя и DevOps

- 🚀 **[DEPLOYMENT.md](DEPLOYMENT.md)** — Полное руководство по развертыванию на production сервер
  - Требования к серверу
  - Первоначальная настройка (Docker, Traefik, firewall)
  - Первый деплой с проверками
  - Обновление приложения (стандартное, с миграциями, zero-downtime)
  - Rollback процедура
  - Мониторинг и проверка health
  - Автоматизация деплоя (webhook, CI/CD)
  - Чек-листы перед/после деплоя

### 🔒 Для безопасности

- 🔐 **[SECURITY.md](SECURITY.md)** — Комплексное руководство по безопасности приложения
  - Управление секретами (.env, Docker secrets, SECRET_KEY)
  - Аутентификация и авторизация (JWT, refresh tokens, rate limiting, политика паролей)
  - Безопасность базы данных (пароли, бэкапы, шифрование)
  - Сетевая безопасность (HTTPS, firewall UFW, SSH ключи, fail2ban)
  - Безопасность приложения (CORS, SQL injection, XSS, валидация, security headers)
  - Безопасный деплой (проверки, rollback, логирование)
  - Мониторинг и аудит безопасности
  - Чек-лист безопасности для продакшена

### 🤖 Автоматизация

- 🔧 **[production-deploy.sh](production-deploy.sh)** — Скрипт автоматического деплоя на продакшен
  - Автоматический бэкап БД перед обновлением
  - Git pull и проверка изменений
  - Запуск миграций (если есть)
  - Пересборка Docker образов
  - Health checks с автоматическим rollback при ошибках
  - Проверка SSL сертификата
  - Очистка старых образов и бэкапов
  - Подробное логирование всех операций

### 📋 Архитектура

- **Backend**: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- **Frontend**: React + Vite + centralized API client с baseURL=/api
- **Инфраструктура**: Traefik v3.1 (reverse proxy + Let's Encrypt) + Docker Compose
- **API routing**: Все запросы идут через `/api` prefix в dev и prod
- **Health checks**: Backend `/health`, frontend через wget на 127.0.0.1:80
- **Deploy**: git pull + docker compose up -d --build
