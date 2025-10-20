# 🔧 Настройка системы миграций Alembic

## 📍 Шаг 1: Инициализировать Alembic (один раз на локальной машине)

```bash
cd /Users/rakhat/Documents/webhosting/SlideConfirm/backend

# Инициализировать Alembic
alembic init migrations

# Структура после инициализации:
# backend/
# ├── migrations/
# │   ├── versions/         # Все версии БД
# │   ├── env.py            # Конфиг миграций ← ОТРЕДАКТИРОВАТЬ!
# │   ├── script.py.mako    # Шаблон новой миграции
# │   ├── alembic.ini       # Конфиг Alembic ← ОТРЕДАКТИРОВАТЬ!
# │   └── README
# └── main.py
```

## 🔨 Шаг 2: Отредактировать `backend/migrations/env.py`

Замените содержимое на:

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Импортировать вашу Base и модели
from ..models import Base  # ← ВАЖНО!
from ..database import SQLALCHEMY_DATABASE_URL

# this is the Alembic Config object, which provides
# the values of the alembic.ini file in the same
# directory as this script. Configuration can be
# provided by the constructor, as well as "configfile"
# option of the command-line
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata  # ← ВАЖНО! Тут наши модели

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = SQLALCHEMY_DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = SQLALCHEMY_DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## ⚙️ Шаг 3: Отредактировать `backend/migrations/alembic.ini`

Найдите строку:
```ini
sqlalchemy.url = driver://user:password@localhost/dbname
```

Замените на:
```ini
# Используется переменная из env.py
sqlalchemy.url = 
```

Или замените всю строку на пустую (используется DATABASE_URL из env.py).

## 📝 Шаг 4: Создать первую миграцию

После того как модели готовы:

```bash
cd backend

# Генерировать первую миграцию (Alembic сам всё найдёт!)
alembic revision --autogenerate -m "Initial migration create all tables"

# Проверить что сгенерировалось:
cat migrations/versions/001_*.py
```

## ✅ Шаг 5: Применить миграции на локальной машине

```bash
cd backend

# Применить все миграции
alembic upgrade head

# Проверить текущую версию
alembic current

# Посмотреть историю миграций
alembic history
```

## 🚀 Шаг 6: Коммитить в Git

```bash
# На локальной машине
git add backend/migrations/
git add requirements.txt
git commit -m "Add Alembic migrations system"
git push origin main
```

## 🐳 Шаг 7: На сервере - автоматическое применение

Обновите `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Контейнер для автоматических миграций
  db-migrate:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: snapcheck-migrate
    command: sh -c "cd backend && alembic upgrade head"  # ← Миграции
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - snapcheck_snapcheck-net
    profiles:
      - donotstart  # Запускаем перед backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: snapcheck-backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      db:
        condition: service_healthy
      db-migrate:
        condition: service_completed_successfully  # ← Ждёт миграций!
    # ... остальная конфигурация
```

## 🔄 Workflow обновления на сервере

```bash
# На сервере
ssh root@88.99.124.218
cd /opt/snapcheck

# 1. Загрузить код
git pull origin main

# 2. Применить миграции БД
docker-compose run --rm db-migrate

# 3. Пересобрать backend
docker-compose build --no-cache backend

# 4. Перезагрузить
docker-compose up -d backend

# 5. Проверить логи
docker-compose logs -f backend
```

## 📌 Примеры изменений БД

### Добавить новый столбец в users

```python
# backend/models.py
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    avatar_url = Column(String, nullable=True)  # ← НОВОЕ!

# Команда для создания миграции:
cd backend && alembic revision --autogenerate -m "Add avatar_url to users"
```

### Добавить новую таблицу

```python
# backend/models.py
class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    text = Column(String(1000))
    user_id = Column(Integer, ForeignKey("users.id"))

# Команда:
cd backend && alembic revision --autogenerate -m "Add comments table"
```

## 🔙 Откат при ошибке

```bash
cd backend

# Откатить последнюю миграцию
alembic downgrade -1

# Откатить на конкретную версию
alembic history  # Посмотреть версии
alembic downgrade 001

# Откатить ВСЕ (вернуться к пустой БД)
alembic downgrade base
```

## ⚠️ Важно!

1. **Коммитьте миграции в Git** - они часть кода!
2. **Никогда не редактируйте уже примененные миграции** - создавайте новые
3. **На сервере миграции применяются автоматически** при `docker-compose up`
4. **Данные сохраняются** - миграции меняют только структуру

Готово! 🚀
