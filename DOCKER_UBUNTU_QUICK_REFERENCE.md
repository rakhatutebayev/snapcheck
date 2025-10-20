# 🐳 DOCKER НА UBUNTU - ШПАРГАЛКА

## ⚡ БЫСТРАЯ УСТАНОВКА (5 КОМАНД)

```bash
# 1. Подключиться к серверу
ssh root@YOUR_SERVER_IP

# 2. Загрузить и запустить скрипт установки
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/slideconfirm/main/deploy-ubuntu.sh | sudo bash -s your-domain.com

# Или вручную:
sudo bash /opt/slideconfirm/deploy-ubuntu.sh your-domain.com

# 3. Отредактировать .env (замените пароли и keys)
sudo nano /opt/slideconfirm/.env

# 4. Перезагрузить контейнеры
cd /opt/slideconfirm
docker-compose -f docker-compose.prod.yml restart

# 5. Проверить что работает
curl https://your-domain.com/health
```

---

## 🔧 РУЧНАЯ УСТАНОВКА DOCKER (если скрипт не работает)

```bash
# Подключиться
ssh root@YOUR_SERVER_IP

# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверить
docker --version
docker-compose --version
```

---

## 📦 РАЗВЕРНУТЬ SLIDECONFIRM

```bash
# 1. Загрузить проект
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/slideconfirm.git
cd slideconfirm

# 2. Создать директории
sudo mkdir -p data/db data/uploads logs/backend logs/nginx

# 3. Создать .env
sudo cat > .env << 'EOF'
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
DATABASE_URL=postgresql://slideconfirm:password@db:5432/slideconfirm
VITE_API_URL=https://api.your-domain.com
ENVIRONMENT=production
DB_PASSWORD=password
EOF

# 4. Редактировать .env (замените пароли)
sudo nano .env

# 5. Собрать образы
sudo docker-compose -f docker-compose.prod.yml build --no-cache

# 6. Запустить
sudo docker-compose -f docker-compose.prod.yml up -d

# 7. Проверить
sudo docker-compose -f docker-compose.prod.yml ps
```

---

## 📊 ОСНОВНЫЕ КОМАНДЫ

```bash
# Статус
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f db

# Остановить
docker-compose -f docker-compose.prod.yml stop

# Запустить
docker-compose -f docker-compose.prod.yml up -d

# Перезагрузить
docker-compose -f docker-compose.prod.yml restart

# Вход в контейнер
docker exec -it slideconfirm-backend bash
docker exec -it slideconfirm-db psql -U slideconfirm -d slideconfirm

# Удалить (осторожно!)
docker-compose -f docker-compose.prod.yml down -v
```

---

## 🔐 SSL СЕРТИФИКАТ (Let's Encrypt)

```bash
# Установить Certbot
sudo apt install -y certbot

# Получить сертификат
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Проверить где сертификат
ls -la /etc/letsencrypt/live/your-domain.com/

# Сертификаты автоматически обновляются каждые 90 дней
```

---

## 🔄 ОБНОВЛЕНИЕ КОДА

```bash
# Загрузить новый код
cd /opt/slideconfirm
sudo git pull

# Пересобрать образы
sudo docker-compose -f docker-compose.prod.yml build --no-cache

# Перезагрузить
sudo docker-compose -f docker-compose.prod.yml up -d

# Проверить логи
sudo docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## 💾 BACKUP БД

```bash
# Создать backup вручную
docker exec slideconfirm-db pg_dump -U slideconfirm slideconfirm > /opt/slideconfirm/backup_$(date +%Y%m%d).sql

# Или использовать готовый скрипт
/usr/local/bin/slideconfirm-backup.sh

# Восстановить из backup
docker exec -i slideconfirm-db psql -U slideconfirm slideconfirm < /opt/slideconfirm/backup.sql
```

---

## ⚠️ РЕШЕНИЕ ПРОБЛЕМ

### Проблема: Port already in use

```bash
# Найти процесс
sudo lsof -i :80
sudo lsof -i :443

# Убить процесс
sudo kill -9 <PID>

# Или перезагрузить Docker
sudo systemctl restart docker
```

### Проблема: Контейнеры не запускаются

```bash
# Посмотреть ошибку
docker-compose logs backend

# Пересобрать с флагом --no-cache
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Проблема: Permission denied

```bash
# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

### Проблема: Нет места на диске

```bash
# Посмотреть использование
du -sh /opt/slideconfirm/*

# Очистить старые образы
docker image prune -a

# Полная очистка
docker system prune -a --volumes
```

---

## 🎯 PRODUCTION CHECKLIST

```
✅ Docker установлен
✅ Docker Compose установлен
✅ Проект загружен в /opt/slideconfirm
✅ Директории созданы (data/, logs/)
✅ .env файл создан и отредактирован
✅ Образы собраны
✅ Контейнеры запущены
✅ SSL сертификат получен
✅ Firewall настроен
✅ Backup скрипт создан
✅ Cron job добавлен
✅ DNS обновлен
✅ Приложение доступно по HTTPS
✅ Логирование работает
✅ Мониторинг настроен
```

---

## 📞 ПОЛУЧИТЬ ПОМОЩЬ

```bash
# Посмотреть все логи
docker-compose logs

# Посмотреть определенный сервис
docker-compose logs -f backend

# Получить последние 100 строк
docker logs --tail 100 slideconfirm-backend

# Посмотреть статус Docker
sudo systemctl status docker

# Проверить использование ресурсов
docker stats
```

---

**Готово!** 🚀

Ваш SlideConfirm теперь работает на Docker на Ubuntu сервере!
