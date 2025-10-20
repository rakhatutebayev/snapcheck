# 🐳 DOCKER НА UBUNTU - ФИНАЛЬНЫЙ ГАЙД (2025)

## 🎯 НАЧНИ ОТСЮДА

**Выбери что тебе нужно:**

### Вариант 1: Самый быстрый (10 минут)
```bash
# На вашем Ubuntu сервере выполните ЭТУ команду:

ssh root@YOUR_SERVER_IP

# Затем скопируйте и вставьте (одну строку):

curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/slideconfirm/main/deploy-ubuntu.sh | sudo bash -s your-domain.com

# ВСЁ! Приложение развернуто и работает на https://your-domain.com
```

### Вариант 2: Пошагово (20 минут)
```bash
# Шаг 1: Установить Docker
ssh root@YOUR_SERVER_IP
curl -fsSL https://get.docker.com | sudo sh

# Шаг 2: Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Шаг 3: Загрузить проект
mkdir -p /opt/slideconfirm
cd /opt/slideconfirm
git clone https://github.com/YOUR_USERNAME/slideconfirm.git .
mkdir -p data/db data/uploads logs/backend logs/nginx

# Шаг 4: Отредактировать .env
sudo nano .env
# Замените:
# - SECRET_KEY на случайную строку
# - DB_PASSWORD на пароль
# - VITE_API_URL на https://api.your-domain.com

# Шаг 5: Запустить
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Проверить
docker ps
docker-compose logs -f backend
```

### Вариант 3: Полное понимание (1 час)
👉 Прочитайте `DOCKER_UBUNTU_INSTALLATION.md` полностью

---

## 📊 ВСЕ СОЗДАННЫЕ ДОКУМЕНТЫ

| Файл | Назначение | Для кого |
|------|-----------|----------|
| **DOCKER_UBUNTU_INSTALL_NOW.md** | 🚀 **Начнина отсюда** - быстрый старт | Новичков |
| **DOCKER_UBUNTU_VISUAL_GUIDE.md** | 📊 Схемы и диаграммы | Визуальное понимание |
| **DOCKER_UBUNTU_QUICK_REFERENCE.md** | 🔧 Шпаргалка команд | После установки |
| **DOCKER_UBUNTU_INSTALLATION.md** | 📚 Подробное руководство | Для изучения |
| **DOCKER_ALL_GUIDES_OVERVIEW.md** | 📋 Обзор всех документов | Навигация |
| **deploy-ubuntu.sh** | ⚙️ **Полная автоматизация** | Ленивых 😄 |
| **DOCKER_INSTALLATION_GUIDE.md** | 🍎 Для macOS | Mac разработчиков |
| **docker-setup.sh** | 🍎 macOS скрипт | Mac разработчиков |

---

## ⚡ 3 ВАРИАНТА ДЛЯ РАЗНЫХ СИТУАЦИЙ

### ВАРИАНТ А: "Я не знаю что это такое" 👶

```
1. Прочитай: DOCKER_UBUNTU_VISUAL_GUIDE.md (5 мин)
2. Скопируй: Вариант 1 команду выше (10 мин)
3. Введи пароли в .env (2 мин)
4. Перезагрузись: docker-compose restart (1 мин)
5. Готово! https://your-domain.com 🎉
```

### ВАРИАНТ Б: "Я хочу понимать что происходит" 🧠

```
1. Прочитай: DOCKER_UBUNTU_INSTALLATION.md (30 мин)
2. Выполни: Вариант 2 пошагово (20 мин)
3. Уже понимаешь на 100% ✅
4. Готово! https://your-domain.com 🎉
```

### ВАРИАНТ В: "Мне просто нужно чтобы работало" ⚡

```
1. Запусти: deploy-ubuntu.sh скрипт (15 мин)
2. Всё автоматическое ✅
3. Готово! https://your-domain.com 🎉
```

---

## 🔐 ПЕРЕД ЗАПУСКОМ ОТРЕДАКТИРУЙ .env

```bash
# Открыть .env
sudo nano /opt/slideconfirm/.env

# ОБЯЗАТЕЛЬНО ИЗМЕНИ эти строки:

# 1. SECRET_KEY - сгенерировать новый!
# Способ: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=ОЧЕНЬ_ДЛИННАЯ_СЛУЧАЙНАЯ_СТРОКА

# 2. Пароль для БД - придумать свой!
DB_PASSWORD=StrongPassword123!

# 3. Домен - ваш домен!
VITE_API_URL=https://api.your-domain.com

# Сохранить: Ctrl+X → Y → Enter
```

---

## 📱 ПРОВЕРИТЬ ЧТО РАБОТАЕТ

```bash
# Статус контейнеров
docker ps

# Должно быть:
# slideconfirm-backend    Up (healthy)
# slideconfirm-frontend   Up (healthy)
# slideconfirm-db         Up (healthy)

# Посмотреть логи
docker-compose logs -f backend

# Тестировать API
curl https://your-domain.com
curl https://api.your-domain.com/health

# Должно вернуться: {"status":"ok"}
```

---

## 🛠️ ЧАСТО ИСПОЛЬЗУЕМЫЕ КОМАНДЫ

```bash
# ПОСМОТРЕТЬ СТАТУС
docker ps                                    # Статус контейнеров
docker-compose logs -f backend              # Логи backend
docker-compose logs -f frontend             # Логи frontend

# УПРАВЛЕНИЕ
docker-compose stop                         # Остановить
docker-compose restart                      # Перезагрузить
docker-compose down -v                      # Удалить всё

# ОБНОВЛЕНИЕ КОДА
cd /opt/slideconfirm
git pull
docker-compose build --no-cache
docker-compose up -d

# ВХОД В КОНТЕЙНЕР
docker exec -it slideconfirm-backend bash   # В backend
docker exec -it slideconfirm-db psql -U slideconfirm  # В БД

# BACKUP
docker exec slideconfirm-db pg_dump -U slideconfirm slideconfirm > backup.sql
tar -czf uploads_backup.tar.gz /opt/slideconfirm/data/uploads
```

---

## ⚠️ ЕСЛИ ЧТО-ТО ПОШЛО НЕ ТАК

```bash
# ❌ ОШИБКА: "Cannot connect to API"
РЕШЕНИЕ:
1. Посмотреть логи: docker-compose logs -f backend
2. Пересобрать: docker-compose build --no-cache
3. Перезагрузить: docker-compose restart

# ❌ ОШИБКА: "Port 80 already in use"
РЕШЕНИЕ:
sudo lsof -i :80
sudo kill -9 <PID>

# ❌ ОШИБКА: "Out of space"
РЕШЕНИЕ:
docker system prune -a --volumes

# ❌ ОШИБКА: "Permission denied"
РЕШЕНИЕ:
sudo usermod -aG docker $USER
newgrp docker

# ❌ ОШИБКА: "Cannot pull image"
РЕШЕНИЕ:
docker login
docker-compose pull

# Больше ошибок найди в:
DOCKER_UBUNTU_INSTALLATION.md → "⚠️ ПРОБЛЕМЫ И РЕШЕНИЯ"
```

---

## 🎯 PRODUCTION CHECKLIST

```
ПЕРЕД ЗАПУСКОМ:
☐ Отредактировать .env (SECRET_KEY, пароли)
☐ Обновить домен в VITE_API_URL
☐ Проверить требования (2GB RAM, 20GB диск)

ПОСЛЕ ЗАПУСКА:
☐ docker ps (все 3 контейнера работают)
☐ curl https://your-domain.com (фронтенд)
☐ curl https://api.your-domain.com/health (бэкенд)
☐ Логины работают
☐ Файлы загружаются
☐ Данные сохраняются

БЕЗОПАСНОСТЬ:
☐ SSL сертификат установлен (Let's Encrypt)
☐ HTTPS редирект работает (80→443)
☐ Firewall включен (ufw enable)
☐ SSH ключи настроены
☐ .env файл не в Git

МОНИТОРИНГ:
☐ Backup script установлен
☐ Cron job добавлен (ежедневный backup)
☐ Логирование работает
```

---

## 📈 МАСШТАБИРОВАНИЕ

Если приложение медленно:

```bash
# Увеличить воркеры backend
docker-compose.prod.yml → WORKERS=8

# Увеличить RAM
docker update --memory=4g slideconfirm-backend

# Кэширование
docker-compose up -d redis

# Load balancing
Настроить Nginx upstream с несколькими backend'ами
```

---

## 🔄 ОБНОВЛЕНИЕ ПРИЛОЖЕНИЯ

```bash
# Когда вышла новая версия:

cd /opt/slideconfirm

# 1. Скачать новый код
git pull

# 2. Пересобрать образы
docker-compose -f docker-compose.prod.yml build --no-cache

# 3. Перезагрузить контейнеры
docker-compose -f docker-compose.prod.yml up -d

# 4. Проверить
docker-compose logs -f backend
```

---

## 💾 BACKUP И ВОССТАНОВЛЕНИЕ

```bash
# СОЗДАТЬ BACKUP
docker exec slideconfirm-db pg_dump -U slideconfirm slideconfirm > db_backup_$(date +%Y%m%d).sql
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /opt/slideconfirm/data/uploads

# ВОССТАНОВИТЬ ИЗ BACKUP
docker exec -i slideconfirm-db psql -U slideconfirm slideconfirm < db_backup_20250101.sql
tar -xzf uploads_backup_20250101.tar.gz -C /opt/slideconfirm/

# АВТОМАТИЧЕСКИЙ BACKUP (каждый день в 3 утра)
# Уже добавлено скриптом deploy-ubuntu.sh!
# Проверить: crontab -l
```

---

## 📞 НУЖНА ПОМОЩЬ?

**Документация:**
- `DOCKER_UBUNTU_INSTALLATION.md` - полный гайд
- `DOCKER_UBUNTU_QUICK_REFERENCE.md` - команды
- `DOCKER_UBUNTU_VISUAL_GUIDE.md` - диаграммы

**Логи:**
```bash
docker-compose logs backend
docker logs slideconfirm-backend
```

**Проверить:**
```bash
docker ps
docker stats
docker network inspect slideconfirm-network
```

---

## ✨ ГОТОВО!

Теперь у тебя есть всё что нужно для установки SlideConfirm на Docker! 🎉

**ВЫБЕРИ ВАРИАНТ И НАЧНИ:** 👆

```
💪 ТЫ СМОЖЕШЬ! 💪
```

---

## 📚 ДОПОЛНИТЕЛЬНО

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Ubuntu Docs](https://ubuntu.com/server/docs)
- [Let's Encrypt](https://letsencrypt.org/)

**Дата создания:** 19 октября 2025
**Версия:** 1.0
**Статус:** ✅ Готово для production
