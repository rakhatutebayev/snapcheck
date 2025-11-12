# 📦 DOCKER + TRAEFIK - ПОЛНЫЙ НАБОР МАТЕРИАЛОВ

## 📁 ВСЕ СОЗДАННЫЕ ФАЙЛЫ

### 📚 Документация (ЧИТАТЬ В ЭТОМ ПОРЯДКЕ)

| Файл | Назначение | Читать | Когда |
|------|-----------|--------|-------|
| **DOCKER_TRAEFIK_QUICK_START.md** | 🚀 НАЧНИТЕ ОТСЮДА | 5 мин | Первый раз |
| **DOCKER_TRAEFIK_CHECKLIST.md** | ✅ Пошаговый чеклист | 10 мин | Во время установки |
| **DOCKER_TRAEFIK_INSTALLATION.md** | 📖 Полная документация | 30 мин | Для понимания |
| **DOCKER_UBUNTU_INSTALLATION.md** | 🐧 Ubuntu (если нужна Docker) | 15 мин | Если Docker не установлен |

### ⚙️ Конфигурационные Файлы

| Файл | Назначение | Статус |
|------|-----------|--------|
| **docker-compose-traefik.yml** | Docker Compose для Traefik | ✅ Готов |
| **docker-nginx-traefik.conf** | Nginx конфиг БЕЗ SSL | ✅ Готов |
| **docker-compose.prod.yml** | Production версия (старая) | ℹ️ Не нужна с Traefik |
| **docker-nginx.conf** | Старый Nginx конфиг с SSL | ℹ️ Замененный |

### 🔧 Скрипты

| Файл | Назначение |
|------|-----------|
| **check-docker-traefik.sh** | 🔍 Диагностика конфликтов портов |
| **docker-setup.sh** | 🚀 Автоматическая установка (для macOS) |

---

## 🎯 БЫСТРЫЙ ВЫБОР

### ❓ Я НА UBUNTU СЕРВЕРЕ С TRAEFIK

**Следуй этому пути (20 минут):**

```
1. Прочитай: DOCKER_TRAEFIK_QUICK_START.md (5 мин)
2. Запусти: bash check-docker-traefik.sh (2 мин)
3. Следуй: DOCKER_TRAEFIK_CHECKLIST.md (13 мин)
```

### ❓ Я НОВИЧОК И НЕ ЗНАЮ С ЧЕГО НАЧАТЬ

**Следуй этому пути (45 минут):**

```
1. Прочитай: DOCKER_TRAEFIK_QUICK_START.md (5 мин)
2. Прочитай: DOCKER_TRAEFIK_INSTALLATION.md (30 мин)
3. Следуй: DOCKER_TRAEFIK_CHECKLIST.md (10 мин)
```

### ❓ У МЕНЯ НЕТ DOCKER НА UBUNTU

**Следуй этому пути (30 минут):**

```
1. Прочитай: DOCKER_UBUNTU_INSTALLATION.md (10 мин)
2. Установи Docker
3. Прочитай: DOCKER_TRAEFIK_QUICK_START.md (5 мин)
4. Следуй: DOCKER_TRAEFIK_CHECKLIST.md (15 мин)
```

### ❓ НУЖНО РЕШИТЬ ПРОБЛЕМУ

**Быстрые команды:**

```bash
# Диагностика
bash check-docker-traefik.sh

# Посмотреть логи
docker-compose logs -f

# Посмотреть статус
docker-compose ps

# Проверить коррликты портов
sudo ss -tlnp | grep -E ":80|:443"
```

---

## 📊 СОДЕРЖАНИЕ ФАЙЛОВ

### 📄 DOCKER_TRAEFIK_QUICK_START.md (ПУСТИ ВПЕРЕД)

- ⚡ Одна минута - загрузить и запустить
- 🔍 Диагностика конфликтов
- 🛠️ Основные команды
- ✅ Проверка работоспособности
- 🚨 Проблемы и решения
- 📝 Важно для production

### 📄 DOCKER_TRAEFIK_CHECKLIST.md (ИСПОЛЬЗУЙ ВО ВРЕМЯ УСТАНОВКИ)

- 📋 Все файлы и шаги
- 🚀 Пошаговая установка (11 этапов)
- 🔍 Диагностика
- 📊 Команды управления
- ✅ Финальный чеклист

### 📄 DOCKER_TRAEFIK_INSTALLATION.md (ПОЛНАЯ ДОКУМЕНТАЦИЯ)

- 📋 Требования
- 🚀 Быстрая установка (10 мин)
- 📝 Полная пошаговая установка
- 🛠️ Автоматический скрипт
- 🐳 Развернуть SnapCheck (11 шагов)
- 📊 Командный набор
- 🔄 Автоматическое обновление
- ⚠️ Проблемы и решения
- 🔐 Security checklist
- 📚 Полезные ссылки

### 📄 DOCKER_UBUNTU_INSTALLATION.md (ЕСЛИ НЕТ DOCKER)

- 📋 Требования
- 🚀 Быстрая установка (10 минут)
- 📝 Полная установка Docker
- 🛠️ Автоматический скрипт
- 🐳 Развернуть SnapCheck
- 📊 Командный набор
- 🔄 Автоматическое обновление
- ⚠️ Проблемы и решения

---

## ⚙️ КОНФИГУРАЦИОННЫЕ ФАЙЛЫ

### docker-compose-traefik.yml

```yaml
# ✅ Использовать ЭТО
services:
  backend:
    labels:
      - traefik.enable=true
      - traefik.http.routers.snapcheck-backend.rule=Host(...) && PathPrefix(/api)
  frontend:
    labels:
      - traefik.enable=true
      - traefik.http.routers.snapcheck-frontend.rule=Host(...)
  db:
    labels: # БД не нужны labels
```

**Переименовать в `docker-compose.yml` на сервере**

### docker-nginx-traefik.conf

```nginx
# ✅ Использовать ЭТО (БЕЗ SSL - Traefik управляет!)
server {
    listen 80;
    # NO SSL конфигурации!
    
    location / {
        # Frontend
    }
    location /api {
        proxy_pass http://backend:8000;
    }
}
```

**Переименовать в `docker-nginx.conf` на сервере**

---

## 🔍 КАКИЕ ФАЙЛЫ НА UBUNTU СЕРВЕРЕ

### /opt/snapcheck/

```
✅ .env                           # СОЗДАТЬ И ЗАПОЛНИТЬ
✅ docker-compose.yml            # ПЕРЕИМЕНОВАТЬ ИЗ docker-compose-traefik.yml
✅ docker-nginx.conf             # СКОПИРОВАТЬ ИЗ docker-nginx-traefik.conf
✅ Dockerfile.backend            # ОБНОВИТЬ (если нужно)
✅ Dockerfile.frontend           # ОБНОВИТЬ (если нужно)
✅ requirements.txt              # Копировать как есть
✅ backend/                       # Копировать как есть
✅ frontend/                      # Копировать как есть
✅ data/                          # СОЗДАТЬ ВРУЧНУЮ (mkdir)
✅ logs/                          # СОЗДАТЬ ВРУЧНУЮ (mkdir)
```

---

## 🚀 ТИПОВЫЕ СЦЕНАРИИ

### Сценарий 1: Первая установка

```bash
# На Ubuntu сервере:

# 1. Загрузить проект
git clone https://github.com/.../snapcheck.git /opt/snapcheck
cd /opt/snapcheck

# 2. Создать .env
nano .env  # Вставить DOMAIN, SECRET_KEY, DB_PASSWORD

# 3. Подготовить файлы
mv docker-compose-traefik.yml docker-compose.yml
cp docker-nginx-traefik.conf docker-nginx.conf
mkdir -p data/db data/uploads logs/backend logs/nginx

# 4. Запустить
docker-compose up -d

# 5. Проверить
docker-compose ps
docker-compose logs -f
```

### Сценарий 2: Обновление кода

```bash
cd /opt/snapcheck

# Загрузить обновления
git pull

# Пересобрать образы
docker-compose build --no-cache

# Перезагрузить
docker-compose restart

# Проверить логи
docker-compose logs -f
```

### Сценарий 3: Дебаг проблемы

```bash
# Шаг 1: Проверить статус
docker-compose ps

# Шаг 2: Посмотреть логи
docker-compose logs -f backend | head -30
docker-compose logs -f frontend | head -30
docker-compose logs -f db | head -30

# Шаг 3: Проверить Traefik
docker logs traefik | grep snapcheck

# Шаг 4: Запустить диагностику
bash check-docker-traefik.sh

# Шаг 5: Перезагрузить
docker-compose restart
```

---

## 📞 ПОДДЕРЖКА

### Если что-то не работает

1. **Читай логи первым:**
   ```bash
   docker-compose logs -f
   ```

2. **Запусти диагностику:**
   ```bash
   bash check-docker-traefik.sh
   ```

3. **Проверь документацию:**
   - DOCKER_TRAEFIK_QUICK_START.md (Проблемы и решения)
   - DOCKER_TRAEFIK_INSTALLATION.md (Полная справка)

4. **Проверь конкретное:**
   ```bash
   docker-compose ps              # Все ли контейнеры up?
   docker logs traefik            # Traefik видит маршруты?
   sudo ss -tlnp | grep :80       # Порты свободны?
   curl https://yourdomain.com    # Доступен ли сайт?
   ```

---

## 🎯 ГЛАВНЫЕ КОМАНДЫ

```bash
cd /opt/snapcheck

# Запустить
docker-compose up -d

# Логи
docker-compose logs -f

# Перезагрузить
docker-compose restart

# Остановить
docker-compose stop

# Статус
docker-compose ps

# Зайти в контейнер
docker-compose exec backend bash
```

---

## ✅ ПЛАН ДЕЙСТВИЙ (25 МИНУТ)

| Время | Действие | Файл |
|-------|----------|------|
| 5 мин | Прочитай Quick Start | DOCKER_TRAEFIK_QUICK_START.md |
| 2 мин | Запусти диагностику | bash check-docker-traefik.sh |
| 3 мин | Загрузи проект | git clone ... |
| 2 мин | Создай .env | nano .env |
| 3 мин | Подготовь файлы | mv, cp, mkdir |
| 5 мин | Собери образы | docker-compose build |
| 2 мин | Запусти контейнеры | docker-compose up -d |
| 1 мин | Проверь работу | docker-compose ps |
| 1 мин | Финал | Открыть https://yourdomain.com |

**ИТОГО: 25 МИНУТ ДО PRODUCTION** 🚀

---

## 🎉 РЕЗУЛЬТАТ

После выполнения всех шагов:

✅ Приложение доступно на `https://yourdomain.com`
✅ Backend API работает на `https://yourdomain.com/api`
✅ SSL сертификат автоматический (Let's Encrypt)
✅ Traefik управляет маршрутизацией
✅ PostgreSQL БД работает
✅ Все контейнеры автоматически перезагружаются

**Готово к production! 🎉**

---

**Версия документации:** 1.0.0
**Дата создания:** October 19, 2025
**Статус:** ✅ READY FOR PRODUCTION

