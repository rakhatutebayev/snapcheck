# Troubleshooting Guide — SnapCheck (SnapCheck)

Полный справочник всех проблем, возникших при разработке и деплое проекта, с причинами и решениями.

---

## 🔴 BACKEND ISSUES

### Проблема: API возвращает 404 на все роуты (кроме /health)

**Симптомы:**
```bash
curl https://lms.it-uae.com/api/health      # ✅ 200 OK {"status":"ok"}
curl https://lms.it-uae.com/api/auth/login  # ❌ 404 Not Found
```

**Причина:**
- Использовались относительные импорты: `from models import User`
- При запуске внутри Docker с `WORKDIR /app` относительные импорты ломались
- Python не мог найти модули и роуты не регистрировались

**Решение:**
1. ✅ Перевели все импорты на абсолютные:
   ```python
   # ❌ Неправильно
   from models import User
   from auth import router
   
   # ✅ Правильно
   from models import User
   from auth import router
   ```

2. ✅ Изменили запуск uvicorn в Dockerfile:
   ```dockerfile
   # ❌ Неправильно
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   
   # ✅ Правильно
   CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

3. ✅ Добавили `__init__.py` в корень:
   ```dockerfile
   RUN touch /app/__init__.py
   ```

**Коммиты:** a9a61ae, 25a3347, 4337765, b55f954

**Как избежать в будущем:**
- Всегда используйте абсолютные импорты в backend
- Запускайте uvicorn через `python -m uvicorn`
- Тестируйте импорты локально с той же структурой папок

---

### Проблема: IntegrityError при запуске (duplicate table)

**Симптомы:**
```
IntegrityError: (psycopg2.errors.DuplicateTable) 
relation "users" already exists
```

**Причина:**
- `main.py` вызывает `models.Base.metadata.create_all()` при старте
- Alembic миграции уже создали таблицы
- SQLAlchemy пытается создать их снова

**Решение:**
- ✅ Это нормальное поведение при первом запуске на существующей БД
- ✅ SQLAlchemy просто пропускает уже существующие таблицы
- ✅ В логах это можно игнорировать

**Долгосрочное решение:**
- Убрать `create_all()` из `main.py`
- Полагаться только на Alembic миграции
- Или добавить проверку перед `create_all()`

**Как избежать в будущем:**
- Используйте только Alembic для создания таблиц в продакшене
- `create_all()` оставьте только для локальной разработки

---

## 🔴 FRONTEND ISSUES

### Проблема: Сайт возвращает 404 (не открывается через Traefik)

**Симптомы:**
```bash
curl https://lms.it-uae.com/         # ❌ 404 Not Found
docker exec snapcheck-frontend curl http://localhost/  # ✅ 200 OK (внутри контейнера работает)
```

**Причина:**
- Frontend контейнер был помечен как `unhealthy`
- Traefik фильтрует unhealthy контейнеры и не создаёт для них роутеры
- Healthcheck падал из-за `localhost` в alpine-контейнере

**Диагностика:**
```bash
# Проверка health status
docker inspect snapcheck-frontend | grep -A 10 "Health"

# Вывод:
"Status": "unhealthy"
"Output": "wget: can't connect to remote host: Connection refused"
```

**Решение:**
1. ✅ Изменили healthcheck в `docker-compose.prod.yml`:
   ```yaml
   # ❌ Неправильно
   healthcheck:
     test: ["CMD", "wget", "--spider", "http://localhost:80/"]
     start_period: 10s
   
   # ✅ Правильно
   healthcheck:
     test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:80/"]
     start_period: 20s
   ```

2. ✅ Пересоздали контейнер:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --force-recreate frontend
   ```

**Коммит:** 183f01c

**Как избежать в будущем:**
- В alpine-контейнерах используйте `127.0.0.1` вместо `localhost`
- Достаточный `start_period` для сервисов (особенно после Vite build)
- Всегда проверяйте `docker inspect` health при проблемах с Traefik

---

### Проблема: Login возвращает 405 Method Not Allowed

**Симптомы:**
```bash
# В браузере
POST /auth/login → 405 Method Not Allowed

# Напрямую через API работает
curl -X POST https://lms.it-uae.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@gss.aero","password":"123456"}'
# ✅ 200 OK {"access_token":"...","role":"admin"}
```

**Причина:**
- Frontend делал запросы на `/auth/login` (без префикса `/api`)
- В dev Vite proxy работал: `/auth/` → `http://127.0.0.1:8000`
- В prod Nginx проксировал только `/api/` на backend
- Запрос `/auth/login` попадал на статику Nginx → 405

**Код проблемы:**
```jsx
// frontend/src/pages/Login.jsx
// ❌ Неправильно
const res = await axios.post('/auth/login', { email, password });
```

**Временное решение (бэндэйд):**
- Добавили в `docker-nginx.conf` прокси для `/auth|/admin|/slides|/user`:
```nginx
location ~ ^/(auth|admin|slides|user)/ {
    proxy_pass http://backend:8000$request_uri;
    # ...
}
```

**Правильное решение:**
1. ✅ Создали централизованный API-клиент:
   ```javascript
   // frontend/src/api/client.js
   import axios from 'axios';
   
   const api = axios.create();
   
   api.interceptors.request.use((config) => {
     const base = '/api';
     config.url = joinUrl(base, config.url);
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   
   export default api;
   ```

2. ✅ Обновили все страницы:
   ```jsx
   // ❌ Старый код
   import axios from 'axios';
   const res = await axios.post('/auth/login', { email, password }, {
     headers: { Authorization: `Bearer ${token}` }
   });
   
   // ✅ Новый код
   import api from '../api/client';
   const res = await api.post('/auth/login', { email, password });
   // Токен добавляется автоматически
   ```

3. ✅ Унифицировали Vite dev proxy:
   ```javascript
   // vite.config.js
   server: {
     proxy: {
       '/api': {
         target: 'http://127.0.0.1:8000',
         rewrite: (path) => path.replace(/^\/api/, ''),
       }
     }
   }
   ```

**Коммиты:** cc2975d (временный), 60bfd62 (правильный)

**Как избежать в будущем:**
- ✅ ВСЕ API-запросы делать через `import api from '../api/client.js'`
- ✅ Не использовать `axios` напрямую для API
- ✅ Единая структура `/api` и в dev, и в prod
- ✅ Автоматическое добавление токена через interceptor

---

### Проблема: Слайды не отображаются - 404 на изображения

**Симптомы:**
```bash
# В консоли браузера
GET https://lms.it-uae.com/slides/image/1/slide1.jpg → 404 (Not Found)

# На месте слайда - серый квадрат с текстом "SlidePreview"
```

**Причина:**
- В `Slides.jsx` использовался прямой путь `/slides/image/...` вместо `/api/slides/image/...`
- Nginx проксирует только `/api/` на backend, а `/slides/` идёт в статику frontend
- В статике нет таких файлов → 404

**Диагностика:**
```bash
# Проверка где запрашиваются картинки
grep -r "/slides/image" frontend/src/

# Вывод:
# frontend/src/pages/Slides.jsx:326: src={`/slides/image/${currentSlide.presentation_id}/${currentSlide.filename}`}
```

**Решение:**
1. ✅ Исправили путь в `Slides.jsx`:
   ```jsx
   // ❌ Неправильно
   <img src={`/slides/image/${currentSlide.presentation_id}/${currentSlide.filename}`} />
   
   // ✅ Правильно
   <img src={`/api/slides/image/${currentSlide.presentation_id}/${currentSlide.filename}`} />
   ```

2. ✅ Пересобрали frontend:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build frontend
   ```

**Как избежать в будущем:**
- ✅ ВСЕ backend-ресурсы (API, изображения, файлы) запрашивать через `/api`
- ✅ Для API-запросов использовать `api` клиент (он автоматически добавляет `/api`)
- ✅ Для статических ресурсов backend (картинки, PDF и т.д.) вручную добавлять префикс `/api`
- ✅ В dev-режиме Vite proxy должен покрывать все backend-пути

**Конвенция:**
```
Frontend статика:    /assets/*     → Nginx статика
Backend API:         /api/*        → Proxy на backend:8000
Backend изображения: /api/slides/* → Proxy на backend:8000
```

---

## 🔴 INFRASTRUCTURE ISSUES

### Проблема: Traefik не создаёт роутер для frontend

**Симптомы:**
```bash
# В логах Traefik (с DEBUG)
"Filtering unhealthy or starting container ... frontend ..."
```

**Причина:**
- Traefik с Docker provider и `exposedbydefault=false` игнорирует:
  - Контейнеры со статусом `unhealthy`
  - Контейнеры со статусом `starting`
- Без DEBUG-логов эта причина не видна

**Диагностика:**
1. Включили DEBUG в Traefik:
   ```yaml
   # docker-compose.override.yml (для Traefik)
   services:
     traefik:
       command:
         - --log.level=DEBUG
         - --accesslog=true
   ```

2. Проверили логи:
   ```bash
   docker logs traefik | grep frontend
   # "Filtering unhealthy or starting container ... frontend ..."
   ```

**Решение:**
- ✅ Исправили healthcheck (см. выше)
- ✅ Контейнер стал healthy → роутер появился

**Как избежать в будущем:**
- При проблемах с Traefik сразу включайте DEBUG-логи
- Проверяйте health status контейнеров: `docker inspect <container>`
- Убедитесь, что контейнеры в правильной сети (`traefik_proxy`)

---

### Проблема: Nginx конфиг для SPA с конфликтующими location блоками

**Симптомы:**
- React Router пути возвращают 404
- index.html кэшируется

**Причина:**
- Regex location `~ \.html$` перехватывал index.html
- Несколько конфликтующих блоков для HTML

**Решение:**
```nginx
# ✅ Упрощённая версия для SPA
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
    
    # Кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # HTML без кэша
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, must-revalidate";
    }
}
```

**Как избежать в будущем:**
- Для SPA достаточно простого `try_files $uri $uri/ /index.html`
- HTML всегда без кэша
- Статика (js/css/images) с долгим кэшем

---

## 🔴 DEPLOYMENT ISSUES

### Проблема: Изменения кода не видны на продакшене

**Симптомы:**
```bash
# Локально
./start.sh  # Видна новая версия

# На проде
https://lms.it-uae.com/  # Старая версия

# Git HEAD одинаковый
git rev-parse HEAD  # 183f01c (и локально, и на сервере)
```

**Причина:**
- После `git pull` не пересобрали Docker образы
- Контейнеры работают со старыми образами
- Код обновился, но образы нет

**Диагностика:**
```bash
# Проверка времени создания образов
docker images --format '{{.Repository}}\t{{.CreatedSince}}'
snapcheck-frontend    9 hours ago   # ❌ Старый
snapcheck-backend     9 hours ago   # ❌ Старый
```

**Решение:**
```bash
cd /opt/snapcheck
git pull --rebase
docker compose -f docker-compose.prod.yml up -d --build  # ✅ --build обязателен!
```

**Проверка:**
```bash
# После деплоя
docker compose -f docker-compose.prod.yml ps
docker images --format '{{.Repository}}\t{{.CreatedSince}}'
snapcheck-frontend    2 seconds ago   # ✅ Новый
snapcheck-backend     1 minute ago    # ✅ Новый

# Проверить bundle hash в HTML
curl -ks https://lms.it-uae.com/ | grep -o 'assets/index-[^.]*\.js'
# Должен измениться: index-DUvHr4tn.js → index-ChpDuq__.js
```

**Как избежать в будущем:**
- ✅ Всегда используйте `--build` при деплое
- ✅ Проверяйте image ID и CreatedSince после сборки
- ✅ Можно создать `deploy.sh` скрипт с автоматическими проверками

---

## 🔴 DATABASE ISSUES

### Проблема: Нет пользователей в БД / не могу залогиниться

**Симптомы:**
```
Login failed. Please check your credentials.
```

**Диагностика:**
```bash
# Проверка пользователей в БД
docker exec -i snapcheck-db psql -U snapcheck -d snapcheck -c \
  'SELECT id, email, role FROM users;'

# Вывод:
 id |     email      | role  
----+----------------+-------
  1 | user@gss.aero  | user
  2 | admin@gss.aero | admin
```

**Причина в нашем случае:**
- Пользователи были в БД
- Проблема была в API-маршрутизации (см. выше: 405 на /auth/login)

**Как создаются начальные пользователи:**
```python
# backend/main.py
def create_initial_data():
    db = SessionLocal()
    if not db.query(User).filter_by(email="user@gss.aero").first():
        db.add(User(
            first_name="User",
            last_name="GSS",
            email="user@gss.aero",
            password_hash=hash_password("123456"),
            role="user"
        ))
    if not db.query(User).filter_by(email="admin@gss.aero").first():
        db.add(User(
            first_name="Admin",
            last_name="GSS",
            email="admin@gss.aero",
            password_hash=hash_password("123456"),
            role="admin"
        ))
    db.commit()

create_initial_data()  # Вызывается при старте
```

**Как сбросить пароль:**
```bash
# Способ 1: Через Python в контейнере
docker exec -it snapcheck-backend python -c "
from utils.security import hash_password
print(hash_password('новый_пароль'))
"

# Способ 2: Напрямую в БД
docker exec -i snapcheck-db psql -U snapcheck -d snapcheck -c \
  "UPDATE users SET password_hash='<bcrypt_hash>' WHERE email='admin@gss.aero';"
```

**Как избежать проблем:**
- ✅ Проверяйте наличие пользователей через SQL
- ✅ Для продакшена используйте env-переменные для начальных паролей
- ✅ Обновите `SECRET_KEY` для JWT токенов

---

## 📝 QUICK REFERENCE

### Проверка здоровья системы

```bash
# 1. Статус контейнеров
docker compose -f docker-compose.prod.yml ps

# 2. Health каждого контейнера
docker inspect snapcheck-backend | grep -A 5 "Health"
docker inspect snapcheck-frontend | grep -A 5 "Health"
docker inspect snapcheck-db | grep -A 5 "Health"

# 3. Логи
docker logs snapcheck-backend --tail 50
docker logs snapcheck-frontend --tail 50
docker logs traefik --tail 50

# 4. Сетевое подключение
docker network inspect traefik_proxy | grep snapcheck

# 5. Внешние проверки
curl -kI https://lms.it-uae.com/
curl -ks https://lms.it-uae.com/api/health
```

### Типичный процесс деплоя

```bash
# 1. Обновить код
cd /opt/snapcheck
git pull --rebase

# 2. Пересобрать и перезапустить (с --build!)
docker compose -f docker-compose.prod.yml up -d --build

# 3. Проверить статус
docker compose -f docker-compose.prod.yml ps

# 4. Проверить health
docker inspect snapcheck-backend snapcheck-frontend | grep '"Status"'

# 5. Проверить снаружи
curl -kI https://lms.it-uae.com/
curl -ks https://lms.it-uae.com/api/health

# 6. Проверить bundle hash (опционально)
curl -ks https://lms.it-uae.com/ | grep -o 'assets/index-[^.]*\.js'
```

### Включение DEBUG-логов Traefik

```bash
# Временно через override
cd /opt/traefik
cat > docker-compose.override.yml <<EOF
services:
  traefik:
    command:
      - --log.level=DEBUG
      - --accesslog=true
EOF

docker compose restart
docker logs traefik -f
```

---

## 🎯 BEST PRACTICES

### Backend
- ✅ Всегда абсолютные импорты
- ✅ Запуск через `python -m uvicorn`
- ✅ Healthcheck на /health endpoint
- ✅ Логирование в JSON для продакшена

### Frontend
- ✅ Все API-запросы через централизованный клиент
- ✅ Единый префикс `/api` в dev и prod
- ✅ Healthcheck на `127.0.0.1:80`, не `localhost`
- ✅ HTML без кэша, статика с кэшем

### Infrastructure
- ✅ Healthchecks с достаточным `start_period`
- ✅ Контейнеры в правильных сетях
- ✅ DEBUG-логи для траблшутинга
- ✅ Мониторинг health status

### Deployment
- ✅ Всегда `--build` при деплое изменений
- ✅ Проверка health после деплоя
- ✅ Проверка bundle hash для frontend
- ✅ Git коммиты перед деплоем

---

**Последнее обновление:** 21 октября 2025  
**Статус проекта:** ✅ Все основные проблемы решены и задокументированы
