# 🚀 ПОЛНОЕ РУКОВОДСТВО ПО РАЗВЕРТЫВАНИЮ SNAPCHECK

## 📊 НЕОБХОДИМЫЕ ДАННЫЕ (Соберите их ПЕРЕД началом)

### ✅ ДАННЫЕ О СЕРВЕРЕ

| Параметр | Значение | Пример |
|----------|----------|--------|
| **IP адрес сервера** | `_________` | `123.45.67.89` |
| **SSH Порт** | `_________` | `22` |
| **SSH Пользователь** | `_________` | `root` |
| **SSH Пароль/Ключ** | `_________` | `password` или `key.pem` |
| **ОС** | `_________` | `Ubuntu 22.04 LTS` |

### ✅ ДАННЫЕ О ДОМЕНЕ

| Параметр | Значение | Пример |
|----------|----------|--------|
| **Домен** | `_________` | `snapcheck.com` |
| **Поддомен (опционально)** | `_________` | `app.snapcheck.com` |
| **Email для SSL** | `_________` | `admin@snapcheck.com` |

### ✅ ПАРАМЕТРЫ ПРИЛОЖЕНИЯ

| Параметр | Значение | Описание |
|----------|----------|---------|
| **GitHub репо** | `_________` | Ваш публичный репозиторий |
| **Ветка** | `[ ] main [ ] master` | Обычно `main` |
| **Окружение** | `[ ] production [ ] staging` | `production` для боевого сервера |

---

## 🎯 ШАГ 1: ПОДГОТОВКА ВАШЕГО ПК

### Убедитесь что у вас есть:

```bash
# 1. Git установлен
git --version
# Вывод: git version X.XX.X

# 2. SSH клиент
ssh -V
# Вывод: OpenSSH_X.X ...

# 3. SSH ключи (опционально, для более безопасного подключения)
ls ~/.ssh/id_rsa    # Если есть - есть ключи
```

---

## 🔌 ШАГ 2: ПОДГОТОВКА СЕРВЕРА

### 2.1 Подключитесь к серверу

```bash
# Способ 1: С паролем
ssh root@YOUR_IP

# Способ 2: С SSH ключом
ssh -i ~/.ssh/id_rsa root@YOUR_IP

# Способ 3: Если SSH на другом порту
ssh -p 2222 root@YOUR_IP
```

### 2.2 Установите Docker (если еще не установлен)

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
sudo apt install -y docker.io docker-compose git curl wget

# Добавить текущего пользователя в группу docker (чтобы не писать sudo)
sudo usermod -aG docker $USER
sudo usermod -aG docker root

# Проверить что Docker работает
docker --version
docker-compose --version
```

### 2.3 Проверить что порты свободны

```bash
# Проверить порты 80 и 443
sudo ss -tlnp | grep -E ":80|:443"

# Вывод ДОЛЖЕН быть пустым, если есть - остановить:
sudo systemctl stop nginx
sudo systemctl stop apache2
```

### 2.4 Проверить DNS (если вы собираетесь использовать домен)

```bash
# Убедитесь что ваш домен указывает на IP сервера
nslookup YOUR_DOMAIN

# Вывод должен содержать IP вашего сервера
```

---

## 📥 ШАГ 3: ЗАГРУЗКА ПРОЕКТА

### На сервере выполните:

```bash
# Перейти в необходимую директорию
cd /opt

# СПОСОБ A: Если ваш репозиторий публичный
git clone https://github.com/YOUR_USERNAME/snapcheck.git snapcheck
cd snapcheck

# СПОСОБ B: Если репозиторий приватный (нужен GitHub SSH ключ)
git clone git@github.com:YOUR_USERNAME/snapcheck.git snapcheck
cd snapcheck

# СПОСОБ C: Загрузить через SCP с вашего ПК
# На вашем ПК выполните:
# scp -r /Users/rakhat/Documents/webhosting/SnapCheck root@YOUR_IP:/opt/snapcheck

# Проверить что всё загружено
ls -la /opt/snapcheck
```

---

## ⚙️ ШАГ 4: СОЗДАНИЕ КОНФИГУРАЦИИ

### 4.1 Создать .env файл

На сервере выполните:

```bash
cd /opt/snapcheck

# Создать .env файл
cat > .env << 'EOF'
# ═══════════════════════════════════════════════════════════════
# SNAPCHECK - PRODUCTION КОНФИГУРАЦИЯ
# ═══════════════════════════════════════════════════════════════

# ОСНОВНЫЕ ПАРАМЕТРЫ
DOMAIN=YOUR_DOMAIN_HERE
ENVIRONMENT=production
LOG_LEVEL=info

# БЕЗОПАСНОСТЬ (Генерируются автоматически ниже)
SECRET_KEY=GENERATE_THIS
DB_PASSWORD=GENERATE_THIS

# DATABASE
DATABASE_URL=postgresql://snapcheck:DB_PASSWORD@db:5432/snapcheck

# FRONTEND
VITE_API_URL=https://YOUR_DOMAIN_HERE/api
NODE_ENV=production

# BACKEND
WORKERS=4
PYTHONUNBUFFERED=1
EOF

# Отредактировать .env
nano .env
```

### 4.2 Заполните переменные окружения

В файле `.env` замените:

1. `YOUR_DOMAIN_HERE` → ваш домен (например: `snapcheck.com`)
2. `GENERATE_THIS` для `SECRET_KEY` → выполните:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
3. `GENERATE_THIS` для `DB_PASSWORD` → используйте сильный пароль, например:
   ```bash
   openssl rand -base64 32
   ```

### 4.3 Сохраните файл

```bash
# В nano: Ctrl+O → Enter → Ctrl+X

# Проверить содержимое
cat .env
```

---

## 🐳 ШАГ 5: ЗАПУСК ПРИЛОЖЕНИЯ

### 5.1 Использовать автоматический скрипт (РЕКОМЕНДУЕТСЯ)

```bash
# Скачать и выполнить скрипт установки
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/snapcheck/main/deploy.sh
chmod +x deploy.sh

# Запустить установку
./deploy.sh https://github.com/YOUR_USERNAME/snapcheck.git YOUR_DOMAIN DB_PASSWORD

# Примеры:
./deploy.sh https://github.com/rakhat/snapcheck.git snapcheck.com MyPassword123
```

### 5.2 Ручная установка (если автоматический скрипт не работает)

```bash
cd /opt/snapcheck

# Проверить что Docker сеть существует
docker network inspect traefik-net || docker network create traefik-net

# Построить образы
docker-compose build

# Запустить контейнеры
docker-compose up -d

# Проверить статус
docker-compose ps

# Должны быть запущены 3 контейнера:
# - snapcheck-backend      (Up)
# - snapcheck-frontend     (Up)
# - snapcheck-db           (Up)
```

---

## ✅ ШАГ 6: ПРОВЕРКА РАБОТОСПОСОБНОСТИ

### 6.1 Проверить статус контейнеров

```bash
cd /opt/snapcheck

# Все ли запущены?
docker-compose ps

# Вывод должен быть:
# NAME                    STATUS
# snapcheck-backend    Up (healthy)
# snapcheck-frontend   Up (healthy)
# snapcheck-db         Up (healthy)
```

### 6.2 Посмотреть логи

```bash
# Все логи
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend

# Только БД
docker-compose logs -f db

# Только последние 20 строк
docker-compose logs --tail 20
```

### 6.3 Проверить Traefik

```bash
# Видит ли Traefik ваше приложение?
docker logs traefik | grep snapcheck

# Должны быть строки типа:
# "Creating router snapcheck-frontend"
# "Creating router snapcheck-backend"
```

### 6.4 Проверить SSL сертификат

```bash
# Выписан ли сертификат?
docker logs traefik | grep -i letsencrypt

# Должны быть успешные логи
```

### 6.5 Проверить API

```bash
# Проверить что backend работает
curl http://localhost:8000/health
# Вывод: {"status":"ok"}

# Проверить что frontend работает
curl http://localhost/
# Вывод: HTML код приложения
```

---

## 🌐 ШАГ 7: ПРОВЕРКА ВЕБ-ИНТЕРФЕЙСА

### Откройте браузер и посетите:

```
https://YOUR_DOMAIN/
```

Должны увидеть:
- ✅ Приложение загружается без ошибок
- ✅ Нет красных ошибок в консоли (F12)
- ✅ Все иконки и стили загружены
- ✅ API доступен: https://YOUR_DOMAIN/api/health

---

## 🔧 ПОЛЕЗНЫЕ КОМАНДЫ ДЛЯ УПРАВЛЕНИЯ

```bash
cd /opt/snapcheck

# 🏃 ЗАПУСК / ОСТАНОВКА
docker-compose up -d                # Запустить
docker-compose stop                 # Остановить
docker-compose restart              # Перезагрузить
docker-compose down                 # Остановить и удалить контейнеры

# 🏗️ СБОРКА
docker-compose build                # Собрать образы
docker-compose build --no-cache     # Пересоздать образы с нуля

# 📊 МОНИТОРИНГ
docker-compose ps                   # Статус контейнеров
docker-compose logs -f              # Логи (все)
docker-compose logs -f backend      # Логи (backend)
docker-compose logs -f frontend     # Логи (frontend)
docker stats                        # Использование ресурсов

# 🔍 ОТЛАДКА
docker-compose exec backend bash    # Войти в контейнер backend
docker-compose exec db psql -U snapcheck -d snapcheck
                                    # Подключиться к БД

# 🗑️ ОЧИСТКА
docker-compose down -v              # Удалить всё (⚠️ включая БД!)
docker image prune -a               # Удалить старые образы
docker volume prune                 # Удалить неиспользуемые volumes
```

---

## 🚨 РЕШЕНИЕ ПРОБЛЕМ

### Проблема: "Port 80/443 already in use"

```bash
# Найти что использует порты
sudo lsof -i :80
sudo lsof -i :443

# Остановить конфликтующее приложение
sudo systemctl stop nginx
sudo systemctl stop apache2
```

### Проблема: "Cannot connect to Docker daemon"

```bash
# Добавить пользователя в группу docker
sudo usermod -aG docker $USER

# Перезагрузить сессию
exit
# Подключиться заново
ssh root@YOUR_IP
```

### Проблема: Backend не запускается

```bash
# Посмотреть ошибку
docker-compose logs backend

# Пересоздать контейнер
docker-compose restart backend

# Если всё равно не работает, пересоздать заново
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Проблема: SSL сертификат не выписан

```bash
# Проверить DNS
nslookup YOUR_DOMAIN
# Должен вернуть IP вашего сервера

# Посмотреть логи Traefik
docker logs traefik | grep -i letsencrypt

# Если проблема в DNS, подождать и перезагрузить:
docker-compose restart
```

### Проблема: Frontend показывает пустую страницу

```bash
# Проверить консоль браузера (F12 → Console)
# Обычно видна ошибка подключения к API

# Убедиться что API доступен:
curl https://YOUR_DOMAIN/api/health -k

# Если не доступен, пересоздать frontend:
docker-compose restart frontend
```

---

## 💾 РЕЗЕРВНОЕ КОПИРОВАНИЕ БАЗЫ ДАННЫХ

### Создать резервную копию вручную

```bash
cd /opt/snapcheck

# Сделать дамп БД
docker-compose exec -T db pg_dump -U snapcheck snapcheck > backup-$(date +%Y%m%d-%H%M%S).sql

# Проверить резервную копию
ls -lh backup-*.sql
```

### Автоматическое ежедневное резервное копирование

```bash
# Открыть crontab
sudo crontab -e

# Добавить строку (резервная копия каждый день в 2:00 ночи):
0 2 * * * cd /opt/snapcheck && docker-compose exec -T db pg_dump -U snapcheck snapcheck > /opt/snapcheck/backups/backup-$(date +\%Y\%m\%d).sql
```

---

## 📝 ПРОВЕРКА КОНФИГУРАЦИИ

### Убедиться что всё правильно настроено

```bash
cd /opt/snapcheck

# 1. Проверить .env
echo "=== КОНФИГУРАЦИЯ ==="
cat .env | grep -v "^#" | grep -v "^$"

# 2. Проверить что все файлы на месте
echo ""
echo "=== ФАЙЛЫ ПРОЕКТА ==="
ls -la | head -20

# 3. Проверить статус Docker
echo ""
echo "=== СТАТУС DOCKER ==="
docker-compose ps

# 4. Проверить логи
echo ""
echo "=== ПОСЛЕДНИЕ ЛОГИ ==="
docker-compose logs --tail 10

# 5. Проверить состояние здоровья
echo ""
echo "=== ЗДОРОВЬЕ ПРИЛОЖЕНИЯ ==="
curl -s http://localhost:8000/health | head -c 100
```

---

## 🎉 ВСЁ ГОТОВО!

### Ваше приложение доступно по адресу:

```
🌐 Frontend:   https://YOUR_DOMAIN/
🔌 API:        https://YOUR_DOMAIN/api/health
📊 Статус:     https://YOUR_DOMAIN/api/health (должен вернуть: {"status":"ok"})
```

---

## 📞 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Проверьте по порядку:

1. **DNS настроен правильно?**
   ```bash
   nslookup YOUR_DOMAIN
   ```

2. **Все контейнеры запущены?**
   ```bash
   docker-compose ps
   ```

3. **Нет ошибок в логах?**
   ```bash
   docker-compose logs -f
   ```

4. **API доступен?**
   ```bash
   curl https://YOUR_DOMAIN/api/health -k
   ```

5. **Браузер использует правильный адрес?**
   - ✅ `https://YOUR_DOMAIN/`
   - ❌ `http://YOUR_DOMAIN/` (без HTTPS)
   - ❌ `localhost`
   - ❌ `127.0.0.1`

---

## 📚 ДОПОЛНИТЕЛЬНАЯ ДОКУМЕНТАЦИЯ

- **Полный гайд Traefik:** `DOCKER_TRAEFIK_INSTALLATION.md`
- **Быстрая шпаргалка:** `DOCKER_TRAEFIK_QUICK_START.md`
- **Проверка конфликтов портов:** `check-docker-traefik.sh`
- **Все команды Docker:** `docker-compose --help`

---

**Готовы начать? Соберите необходимые данные и начните с ШАГ 1! 🚀**
