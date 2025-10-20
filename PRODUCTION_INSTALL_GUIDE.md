# 🚀 Гайд по развертыванию SnapCheck в продакшене

## Структура развертывания

```
Сервер
├── Docker
│   ├── Backend (Python/FastAPI) - порт 8000
│   ├── Frontend (React/Nginx) - порт 3000
│   └── БД (SQLite в файле)
├── Данные
│   ├── /data/db/ - база данных
│   ├── /data/uploads/ - загруженные файлы
│   └── /logs/ - логи
└── Nginx (reverse proxy) - порт 80/443
```

---

## Вариант 1: Установка на VPS/ДедикВыделенный сервер 🖥️

### Требования:
- Linux (Ubuntu 20.04+ или Debian 10+)
- Docker и Docker Compose установлены
- 2GB RAM минимум
- 10GB свободного места

### Шаг 1: Подготовка сервера

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
sudo apt install -y docker.io docker-compose

# Добавить текущего пользователя в группу docker
sudo usermod -aG docker $USER
# Выйти и зайти заново в SSH
exit
```

### Шаг 2: Скопировать проект на сервер

```bash
# На локальном компьютере
scp -r /Users/rakhat/Documents/webhosting/SlideConfirm root@YOUR_SERVER_IP:/opt/

# Или через git
ssh root@YOUR_SERVER_IP
cd /opt
git clone https://github.com/YOUR_REPO/SlideConfirm.git
cd SlideConfirm
```

### Шаг 3: Создать папки для данных

```bash
# На сервере
cd /opt/SlideConfirm

mkdir -p data/db
mkdir -p data/uploads
mkdir -p logs/backend
mkdir -p logs/nginx

chmod -R 755 data/
chmod -R 755 logs/
```

### Шаг 4: Создать .env файл

```bash
# На сервере
cat > .env << 'EOF'
# Backend
DATABASE_URL=sqlite:///./data/db/slideconfirm.db
ENVIRONMENT=production
LOG_LEVEL=info
WORKERS=4

# Frontend
VITE_API_URL=http://YOUR_SERVER_IP:8000
VITE_APP_NAME=SnapCheck

# Безопасность
SECRET_KEY=your-super-secret-key-change-this-12345
CORS_ORIGINS=http://YOUR_SERVER_IP,https://YOUR_DOMAIN.com
EOF
```

### Шаг 5: Запустить Docker контейнеры

```bash
# На сервере (в папке /opt/SlideConfirm)
docker-compose -f docker-compose.prod.yml up -d

# Проверить статус
docker-compose -f docker-compose.prod.yml ps

# Смотреть логи
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Шаг 6: Проверить работу

```bash
# Проверить backend
curl http://localhost:8000/health

# Проверить frontend
curl http://localhost:3000

# Если видишь HTML - всё работает! ✅
```

---

## Вариант 2: Установка на Heroku ☁️

### Требования:
- Аккаунт Heroku (heroku.com)
- Heroku CLI установлен

### Шаги:

```bash
# 1. Логинись в Heroku
heroku login

# 2. Создать приложение
heroku create snapcheck-prod

# 3. Добавить PostgreSQL БД
heroku addons:create heroku-postgresql:hobby-dev

# 4. Задать переменные окружения
heroku config:set \
  ENVIRONMENT=production \
  SECRET_KEY=your-secret-key \
  DATABASE_URL=postgres://... # (будет автоматически)

# 5. Развернуть
git push heroku main

# 6. Смотреть логи
heroku logs -t
```

---

## Вариант 3: Установка на AWS EC2 🔧

### Требования:
- AWS аккаунт
- EC2 инстанс (t2.micro - бесплатно год)
- Security Group с открытыми портами 80, 443, 22

### Шаги:

```bash
# 1. Подключись к EC2
ssh -i your-key.pem ec2-user@your-instance-ip

# 2. Установи Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# 3. Установи Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Следуй шагам как на VPS выше
```

---

## Вариант 4: Установка на DigitalOcean 💧

### Требования:
- DigitalOcean аккаунт
- Droplet с Ubuntu 20.04+ (5$ в месяц)
- doctl CLI (опционально)

### Шаги:

```bash
# 1. Создать Droplet через веб-интерфейс
# Basic → Ubuntu 20.04 → $5/month → выбрать регион

# 2. SSH на сервер
ssh root@your-droplet-ip

# 3. Установить Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh | sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Следуй шагам как на VPS выше
```

---

## Шаг 7: Настроить SSL (Let's Encrypt) 🔒

```bash
# На сервере
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификат
sudo certbot certonly --standalone -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com

# Обновить Nginx конфиг с SSL
# Отредактировать: docker-nginx.conf
```

### Пример Nginx конфига с SSL:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;
    
    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN.com/privkey.pem;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Шаг 8: Автоматические обновления 🔄

### Вариант А: Git Auto-Deploy

```bash
# На сервере, создать скрипт обновления
cat > /opt/SlideConfirm/auto-update.sh << 'EOF'
#!/bin/bash
cd /opt/SlideConfirm
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
EOF

chmod +x /opt/SlideConfirm/auto-update.sh

# Добавить в crontab для ежедневного обновления в 3:00 AM
crontab -e
# 0 3 * * * /opt/SlideConfirm/auto-update.sh >> /opt/SlideConfirm/logs/auto-update.log 2>&1
```

### Вариант Б: GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: root
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/SlideConfirm
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up -d
```

---

## Шаг 9: Мониторинг и логирование 📊

```bash
# Смотреть логи в реальном времени
docker-compose -f docker-compose.prod.yml logs -f

# Смотреть только backend логи
docker-compose -f docker-compose.prod.yml logs -f backend

# Проверить использование ресурсов
docker stats

# Бэкап базы данных
docker-compose -f docker-compose.prod.yml exec backend \
  tar czf /tmp/db-backup.tar.gz data/db/

# Скопировать бэкап локально
docker cp slideconfirm-backend:/tmp/db-backup.tar.gz ./db-backup.tar.gz
```

---

## Чек-лист развертывания ✅

- [ ] Сервер создан и доступен по SSH
- [ ] Docker и Docker Compose установлены
- [ ] Проект скопирован на сервер
- [ ] Папки для данных созданы
- [ ] .env файл заполнен
- [ ] Docker контейнеры запущены
- [ ] Backend доступен (http://ip:8000/health)
- [ ] Frontend загружается (http://ip:3000)
- [ ] SSL сертификат установлен
- [ ] DNS направлен на сервер
- [ ] Логирование настроено
- [ ] Бэкап настроен
- [ ] Мониторинг включен

---

## Команды для управления на продакшене 🔧

```bash
# Перезагрузить контейнеры
docker-compose -f docker-compose.prod.yml restart

# Пересобрать контейнеры
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Очистить неиспользованные образы
docker image prune -a

# Просмотреть логи ошибок
docker-compose -f docker-compose.prod.yml logs --tail=100 backend

# Вход в контейнер для отладки
docker-compose -f docker-compose.prod.yml exec backend /bin/bash

# Остановить все контейнеры
docker-compose -f docker-compose.prod.yml down

# Запустить контейнеры заново
docker-compose -f docker-compose.prod.yml up -d
```

---

## Решение проблем 🔧

### Контейнер не запускается

```bash
# Смотреть полные логи
docker-compose -f docker-compose.prod.yml logs backend

# Проверить, не занят ли порт
sudo lsof -i :8000
sudo lsof -i :3000

# Убить процесс на порту
sudo kill -9 PID
```

### БД на пути

```bash
# Сбросить БД (осторожно!)
docker-compose -f docker-compose.prod.yml exec backend \
  rm -rf data/db/slideconfirm.db

# Перезагрузить контейнеры
docker-compose -f docker-compose.prod.yml restart
```

### Фронтенд показывает старый код

```bash
# Очистить кэш
docker-compose -f docker-compose.prod.yml down
docker image rm slideconfirm-frontend
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Затраты на хостинг 💰

| Платформа | Бюджет | Возможности |
|-----------|--------|----------|
| **DigitalOcean** | $5-20/мес | Droplet, SSL, автобэкап |
| **AWS EC2** | $0-50/мес | t2.micro бесплатно (год), масштабируемо |
| **Heroku** | $7-50/мес | Простая развертка, PostgreSQL |
| **Linode** | $5-20/мес | Быстро, надежно |
| **VPS** (любой) | $3-50/мес | Полный контроль |

---

## Контакты для помощи 📞

Если нужна помощь с развертыванием:
- GitHub Issues: https://github.com/YOUR_REPO/SlideConfirm/issues
- Документация: PRODUCTION_DEPLOY.md
- Email: support@example.com

---

**Создано:** 19 октября 2025
**Версия:** 1.0
**Статус:** ✅ Готово к продакшену
