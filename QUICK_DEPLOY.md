# ⚡ Быстрый старт на продакшен (5 минут)

## Самый быстрый способ - на DigitalOcean

### 1️⃣ Создать Droplet (2 минуты)

1. Перейти: https://cloud.digitalocean.com
2. **Create** → **Droplets**
3. Выбрать:
   - **OS**: Ubuntu 20.04 x64
   - **Plan**: Basic ($5/month) ✅
   - **Region**: Ближайший к вам
4. Нажать **Create Droplet**
5. Получить IP адрес по email

### 2️⃣ Подключиться по SSH (30 секунд)

```bash
# На локальном компьютере
ssh root@YOUR_DROPLET_IP

# Первый вход может попросить пароль (из email)
```

### 3️⃣ Установить Docker (1 минута)

Скопируй и запусти:

```bash
# На сервере (скопировать весь блок):
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh

sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

# Проверить установку
docker --version
docker-compose --version
```

### 4️⃣ Скопировать проект (30 секунд)

```bash
# На сервере
cd /opt

# Если есть GitHub
git clone https://github.com/YOUR_REPO/SlideConfirm.git
cd SlideConfirm

# ИЛИ если используешь SSH (через SFTP)
# Просто загрузи папку целиком на сервер в /opt/SlideConfirm

# Создать папки
mkdir -p data/db data/uploads logs/backend logs/nginx
chmod -R 755 data logs
```

### 5️⃣ Создать .env файл

```bash
# На сервере
cat > .env << 'EOF'
DATABASE_URL=sqlite:///./data/db/slideconfirm.db
ENVIRONMENT=production
LOG_LEVEL=info
WORKERS=4
SECRET_KEY=prod-secret-key-change-this-12345
EOF
```

### 6️⃣ Запустить Docker (1 минута)

```bash
# На сервере (в папке /opt/SlideConfirm)
docker-compose -f docker-compose.prod.yml up -d

# Подождать 30 секунд на сборку...

# Проверить статус
docker-compose -f docker-compose.prod.yml ps

# Должно быть:
# slideconfirm-backend  ... Up
# slideconfirm-frontend ... Up
```

### 7️⃣ Готово! 🎉

Открыть в браузере:
```
http://YOUR_DROPLET_IP:3000
```

Должна загрузиться страница SnapCheck!

---

## Быстрая проверка

```bash
# Backend жив?
curl http://localhost:8000/health
# Ответ: {"status":"ok"} ✅

# Frontend жив?
curl http://localhost:3000
# Ответ: <html>... ✅

# Логи нормальные?
docker-compose -f docker-compose.prod.yml logs --tail=20
```

---

## Добавить домен (опционально)

```bash
# 1. В DigitalOcean добавить A record:
# dns → example.com → A record → YOUR_DROPLET_IP

# 2. Дождаться распространения (5-10 минут)

# 3. Открыть:
# https://example.com:3000 (пока без SSL)
```

---

## Что дальше?

- ✅ Приложение работает
- 📱 Протестировать на телефоне (Expo)
- 🔒 Добавить SSL (Let's Encrypt)
- 📊 Настроить бэкапы
- 🔄 Настроить auto-deploy

---

## Команды администратора

```bash
# Перезагрузить приложение
docker-compose -f docker-compose.prod.yml restart

# Посмотреть логи в реальном времени
docker-compose -f docker-compose.prod.yml logs -f

# Остановить
docker-compose -f docker-compose.prod.yml down

# Запустить заново
docker-compose -f docker-compose.prod.yml up -d

# Зайти в контейнер backend
docker-compose -f docker-compose.prod.yml exec backend bash

# Очистить место (удалить старые образы)
docker image prune -a
```

---

**Время установки:** ~5 минут ⚡
**Сложность:** Легко 🟢
**Стоимость:** $5/месяц 💰
