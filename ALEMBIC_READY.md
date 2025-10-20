# ✅ ГОТОВО! Alembic инициализирован

Структура создана:
```
backend/
├── migrations/
│   ├── __init__.py
│   ├── env.py              ✅ Обновлен
│   ├── alembic.ini         ✅ Создан
│   └── versions/
│       ├── __init__.py
│       └── 001_initial_migration.py  ✅ Первая миграция
├── database.py             ✅ Обновлен
└── models.py               (без изменений)
```

## 🚀 Следующие шаги

### 1. На локальной машине - протестировать миграции

```bash
cd /Users/rakhat/Documents/webhosting/SlideConfirm/backend

# Посмотреть текущую версию (должна быть пустой)
alembic current
# Вывод: None

# Применить все миграции
alembic upgrade head
# Вывод должен показать применение миграции 001

# Проверить что применилось
alembic current
# Вывод должен показать версию 001

# Посмотреть историю миграций
alembic history
# Вывод:
# <base> -> 001_initial_migration (head), Initial migration: create all tables
```

### 2. Если что-то пошло не так - откат

```bash
cd backend

# Откатить последнюю миграцию
alembic downgrade -1

# Откатить полностью (вернуться к пустой БД)
alembic downgrade base

# Снова применить
alembic upgrade head
```

### 3. Коммитить в Git

```bash
# Перейти в корневую папку проекта
cd /Users/rakhat/Documents/webhosting/SlideConfirm

# Проверить что изменилось
git status

# Должны быть новые файлы:
# backend/migrations/
# backend/database.py (обновлен)

# Добавить в Git
git add backend/migrations/
git add backend/database.py
git add requirements.txt
git add Dockerfile.backend
git add docker-compose.prod.yml

# Коммитить
git commit -m "Add Alembic migrations system with initial database schema"

# Пушить на GitHub
git push origin main
```

### 4. На сервере - первый раз запустить миграции

```bash
ssh root@88.99.124.218
cd /opt/snapcheck

# Загрузить новый код
git pull origin main

# Применить миграции БД
docker-compose -f docker-compose.prod.yml run --rm db-migrate

# Пересобрать контейнеры
docker-compose -f docker-compose.prod.yml build --no-cache

# Перезагрузить
docker-compose -f docker-compose.prod.yml up -d

# Проверить
docker-compose -f docker-compose.prod.yml ps
```

### 5. Проверить что всё работает

```bash
# Локально
curl -k https://lms.it-uae.com/api/health

# Должна быть ошибка 200 OK (API отвечает)
```

---

## 📌 Дальнейшие обновления

Когда вам нужно будет изменить структуру БД:

```bash
# 1. Отредактировать models.py
vim backend/models.py

# 2. Создать новую миграцию (Alembic сам всё найдёт!)
cd backend
alembic revision --autogenerate -m "Описание изменения"

# 3. Отредактировать файл миграции если нужно
vim migrations/versions/002_*.py

# 4. Протестировать
alembic upgrade head

# 5. Коммитить
cd ..
git add backend/migrations/
git commit -m "Add migration: your description"
git push origin main

# 6. На сервере - одна команда!
bash /opt/snapcheck/smart-deploy.sh
```

---

## ✅ Готово к production! 🚀

Все файлы созданы и настроены. Теперь можно коммитить и деплоить!
