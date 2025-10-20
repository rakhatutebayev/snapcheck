# 📚 КРАТКАЯ ИНСТРУКЦИЯ: Обновление проекта на сервере

## ✨ Что изменилось?

Проект теперь использует:
- ✅ **Alembic** для версионирования структуры БД
- ✅ **Layer caching** в Dockerfile для быстрых пересборок
- ✅ **Smart deploy скрипт** для обновления только необходимого
- ✅ **PostgreSQL** вместо SQLite
- ✅ **Traefik** для HTTPS и маршрутизации

---

## 🚀 Быстрое обновление проекта

### На локальной машине

```bash
# 1. Сделать изменения в коде
vim backend/models.py      # или frontend/src/App.jsx

# 2. Если изменили модели БД - создать миграцию
cd backend
alembic revision --autogenerate -m "Описание изменения"

# 3. Коммитить всё
git add .
git commit -m "Add new feature"
git push origin main
```

### На сервере

```bash
# Один-единственный скрипт!
ssh root@88.99.124.218
bash /opt/snapcheck/smart-deploy.sh

# Скрипт сам:
# ✅ Загружает изменения из GitHub
# ✅ Применяет миграции БД (если есть)
# ✅ Пересобирает только изменённые контейнеры
# ✅ Перезагружает приложение
# ✅ Проверяет здоровье API
```

**Время:** 30-60 секунд (вместо 10 минут!)

---

## 📋 Настройка на сервере (один раз)

### 1. Обновить код

```bash
ssh root@88.99.124.218
cd /opt/snapcheck
git pull origin main
```

### 2. Применить Alembic первый раз

```bash
# Просмотреть что будет применено
docker-compose -f docker-compose.prod.yml run --rm db-migrate

# Если всё ОК - готово!
```

### 3. Перезагрузить приложение с новыми контейнерами

```bash
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Проверить что работает

```bash
curl -k https://lms.it-uae.com/api/health
# Должно вернуть 200 OK ✓
```

---

## 🔄 Обновление БД при изменении models.py

### Локально (разработка)

```bash
cd backend

# Если нужно вернуться к предыдущей версии БД
alembic downgrade -1

# Или полностью очистить
alembic downgrade base

# Применить все миграции заново
alembic upgrade head
```

### На сервере (production)

```bash
# Миграции применяются АВТОМАТИЧЕСКИ при обновлении!
bash /opt/snapcheck/smart-deploy.sh

# Или вручную:
docker-compose -f docker-compose.prod.yml run --rm db-migrate

# Откатить если ошибка:
docker-compose -f docker-compose.prod.yml exec backend \
  sh -c "cd backend && alembic downgrade -1"
```

---

## 📝 Примеры изменений

### Добавить новый столбец в users

```python
# backend/models.py
class User(Base):
    __tablename__ = "users"
    email = Column(String)
    phone = Column(String, nullable=True)  # ← НОВОЕ
```

```bash
# Создать миграцию
cd backend && alembic revision --autogenerate -m "Add phone to users"

# Проверить что сгенерировалось
cat migrations/versions/*.py | grep -A 5 "phone"

# Коммитить
git add backend/migrations/
git commit -m "Add phone column to users"
git push origin main

# На сервере - обновление одной командой
bash /opt/snapcheck/smart-deploy.sh
```

### Добавить новую таблицу

```python
# backend/models.py
class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    text = Column(String(500))
    user_id = Column(Integer, ForeignKey("users.id"))
```

```bash
cd backend && alembic revision --autogenerate -m "Add comments table"
git add backend/migrations/ && git commit -m "Add comments" && git push

# На сервере
bash /opt/snapcheck/smart-deploy.sh
```

---

## ⚡ Преимущества нового подхода

| До | Сейчас |
|----|--------|
| `docker-compose down && up` | `bash smart-deploy.sh` |
| 10-15 минут обновления | 30-60 секунд |
| Пересобирается ВСЁ | Только изменённое |
| БД обновляется вручную | Автоматически |
| Данные могут потеряться | БД мигрирует безопасно |
| Конфликты портов | Traefik всё управляет |

---

## 🆘 Быстрые команды

```bash
# Статус всех контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи backend (live)
docker-compose -f docker-compose.prod.yml logs -f backend

# Логи frontend (live)
docker-compose -f docker-compose.prod.yml logs -f frontend

# Подключиться к БД
docker-compose -f docker-compose.prod.yml exec db \
  psql -U snapcheck -d snapcheck

# Посмотреть структуру users таблицы
docker-compose -f docker-compose.prod.yml exec db \
  psql -U snapcheck -d snapcheck -c "\\d users"

# Перезагрузить backend без пересборки
docker-compose -f docker-compose.prod.yml restart backend

# Полная пересборка (если что-то сломалось)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## ✅ Чеклист перед продом

- [ ] Все изменения залиты в GitHub
- [ ] Миграции созданы (`alembic revision --autogenerate`)
- [ ] Локально протестировано: `alembic upgrade head`
- [ ] Git история чистая: `git log --oneline | head -5`
- [ ] На сервере: `bash smart-deploy.sh` прошёл успешно
- [ ] API отвечает: `curl -k https://lms.it-uae.com/api/health`

---

## 📞 Если что-то не работает

1. **Посмотреть логи:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   ```

2. **Откатить изменения:**
   ```bash
   git revert HEAD
   bash /opt/snapcheck/smart-deploy.sh
   ```

3. **Откатить БД:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend \
     sh -c "cd backend && alembic downgrade -1"
   ```

Готово! 🚀
