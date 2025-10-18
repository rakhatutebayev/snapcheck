# SlideConfirm - Система управления корпоративными презентациями

## Статус: ✅ ГОТОВО К РАБОТЕ

Система полностью настроена и работает с новой архитектурой - ручной конверсией PPTX → JPG с удобной загрузкой через админ панель.

## 🚀 Запуск системы

### Бэкенд (FastAPI):
```bash
cd /Users/rakhat/Documents/webhosting/SlideConfirm
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Фронтенд (Vite + React):
```bash
cd /Users/rakhat/Documents/webhosting/SlideConfirm/frontend
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
SlideConfirm/
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
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx              # Страница входа
│   │   │   ├── UserPanel.jsx          # Просмотр для пользователей
│   │   │   ├── AdminPanel.jsx         # ⭐ ОБНОВЛЕНА: Новый интерфейс загрузки
│   │   │   └── PresentationView.jsx   # Просмотр презентации
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
3. Используйте PostgreSQL вместо SQLite
4. Разверните на облачной платформе (Heroku, AWS, DigitalOcean и т.д.)
5. Используйте HTTPS
6. Настройте CORS правильно

---

## 📝 Лицензия
Внутреннее корпоративное приложение GSS

## 👤 Автор
GSS Training System

## 📞 Контакты
admin@gss.aero

## 📋 Рабочий процесс

### 1. Подготовка слайдов (Вручную)
- Откройте ваш PPTX файл в PowerPoint, LibreOffice или аналоге
- Экспортируйте каждый слайд как JPG файл
- Сохраните файлы с названиями: `slide1.jpg`, `slide2.jpg`, `slide3.jpg` и т.д.
- Поместите все файлы в одну папку, например: `/Users/user/Documents/my_slides/`

**Пример структуры:**
```
/Users/user/Documents/my_slides/
├── slide1.jpg
├── slide2.jpg
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
- Вкладка **"📊 Отчет"** показывает статистику:
  - Сколько сотрудников завершили презентацию
  - Процент выполнения

## 👥 Учётные данные по умолчанию

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@gss.aero | 123456 |
| Пользователь | user@gss.aero | 123456 |

## 🗄️ База данных
```
Местоположение: /tmp/slideconfirm.db
Тип: SQLite
```

## 📁 Хранилище загруженных слайдов
```
Местоположение: /tmp/slideconfirm_uploads/
Структура:
├── slides/
│   ├── 1/
│   │   ├── slide1.jpg
│   │   ├── slide2.jpg
│   │   └── slide3.jpg
│   └── 2/
│       ├── slide1.jpg
│       └── slide2.jpg
```

## 🔌 API Endpoints

### Аутентификация
- `POST /auth/login` - Вход в систему
- `POST /auth/register` - Регистрация

### Просмотр презентаций
- `GET /slides/` - Получить список всех опубликованных презентаций
- `GET /slides/{presentation_id}` - Получить слайды конкретной презентации
- `GET /slides/image/{slide_id}/{filename}` - Скачать изображение слайда

### Управление (админ)
- `POST /admin/slides/upload-from-folder` - Загрузить слайды из папки
- `GET /admin/slides/{presentation_id}` - Получить все слайды презентации
- `PUT /admin/slides/{slide_id}/title` - Обновить название слайда
- `POST /admin/presentations/{presentation_id}/publish` - Опубликовать
- `POST /admin/presentations/{presentation_id}/unpublish` - Снять с публикации
- `DELETE /admin/presentations/{presentation_id}?confirm=true` - Удалить
- `GET /admin/presentations` - Получить список всех презентаций
- `GET /admin/users` - Получить список пользователей
- `POST /admin/create_user` - Создать пользователя
- `PUT /admin/set_role/{user_id}` - Установить роль

## 📊 Технические детали

**Backend:**
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
rm /tmp/slideconfirm.db
```

### Ошибка при загрузке слайдов
- Проверьте, что путь к папке правильный
- Проверьте наличие файлов `slide1.jpg`, `slide2.jpg` и т.д.
- Убедитесь, что файлы это JPEG изображения

### Слайды не показываются
- Проверьте, что презентация в статусе "Опубликована"
- Проверьте права доступа на файлы в `/tmp/slideconfirm_uploads/`

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

**Версия**: 1.0.0  
**Дата**: Октябрь 2025  
**Статус**: Готово к использованию ✅
