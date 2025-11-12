# 🚀 DOCKER + TRAEFIK - БЫСТРАЯ ШПАРГАЛКА

## ⚡ ОДНА МИНУТА - ЗАГРУЗИТЬ И ЗАПУСТИТЬ

```bash
# 1. Подключиться к серверу
ssh root@YOUR_SERVER_IP

# 2. Проверить что нет конфликтов
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :443

# 3. Клонировать проект
git clone https://github.com/YOUR_USERNAME/snapcheck.git /opt/snapcheck
cd /opt/snapcheck

# 4. Создать .env
cat > .env << 'EOF'
DOMAIN=snapcheck.yourdomain.com
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
DB_PASSWORD=StrongPassword123
ENVIRONMENT=production
LOG_LEVEL=info
EOF

# 5. Запустить
docker-compose up -d

# 6. Проверить
docker-compose ps
docker-compose logs -f backend
```

**Готово!** 🎉 Приложение доступно на `https://yourdomain.com`

---

## 🔍 ДИАГНОСТИКА КОНФЛИКТОВ

```bash
# Все слушающие порты
sudo ss -tlnp

# Какие контейнеры есть
docker ps -a

# Какие сети есть
docker network ls

# Какие контейнеры в traefik-net
docker network inspect traefik-net

# Логи Traefik
docker logs traefik

# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats
```

---

## 🛠️ ОСНОВНЫЕ КОМАНДЫ

```bash
cd /opt/snapcheck

# Запустить
docker-compose up -d

# Остановить
docker-compose stop

# Перезагрузить
docker-compose restart

# Пересобрать
docker-compose build --no-cache

# Логи
docker-compose logs -f                  # Все логи
docker-compose logs -f backend          # Только backend
docker-compose logs -f frontend         # Только frontend
docker-compose logs -f db               # Только БД

# Зайти в контейнер
docker-compose exec backend bash
docker-compose exec db psql -U snapcheck -d snapcheck

# Удалить (осторожно!)
docker-compose down -v                  # С данными
docker-compose down                     # Без данных
```

---

## ✅ ПРОВЕРКА РАБОТОСПОСОБНОСТИ

```bash
# 1. Все ли контейнеры запущены?
docker-compose ps
# Должны быть Up: backend, frontend, db

# 2. Traefik знает о маршрутах?
docker logs traefik | grep snapcheck
# Должны быть строки вроде:
# "Creating router snapcheck-frontend"
# "Creating router snapcheck-backend"

# 3. SSL сертификат получен?
docker logs traefik | grep letsencrypt
# Должны быть успешные логи

# 4. Проверить подключение
curl -k https://yourdomain.com
# Должен вернуть HTML

# 5. Проверить API
curl -k https://yourdomain.com/api/health
# Должен вернуть: {"status":"ok"}

# 6. Посмотреть логи приложения
docker-compose logs -f backend | tail -20
```

---

## 🚨 ПРОБЛЕМЫ И БЫСТРЫЕ РЕШЕНИЯ

```bash
# Проблема: "port already in use"
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :443
# Остановить приложение: sudo systemctl stop nginx

# Проблема: Traefik не видит маршруты
docker-compose restart backend frontend
docker logs traefik | grep snapcheck

# Проблема: SSL не выписан
docker logs traefik | grep letsencrypt
# Проверить DNS: nslookup yourdomain.com

# Проблема: Backend не запускается
docker-compose logs -f backend
# Посмотреть ошибку в логах

# Проблема: БД не подключается
docker-compose logs -f db
# Проверить переменные в .env

# Проблема: Frontend показывает ошибку
docker-compose logs -f frontend
# Проверить что API доступен через https://yourdomain.com/api/health
```

---

## 📊 ФАЙЛЫ ДЛЯ TRAEFIK

**Обновленные файлы для вашего проекта:**

```
✅ docker-compose.yml              # Обновлено с labels для Traefik
✅ docker-nginx-traefik.conf       # Новый конфиг БЕЗ SSL
✅ Dockerfile.backend              # Обновлено
✅ Dockerfile.frontend             # Обновлено
✅ DOCKER_TRAEFIK_INSTALLATION.md  # Полная документация
✅ check-docker-traefik.sh         # Скрипт проверки конфликтов
```

---

## 🔐 ВАЖНО ДЛЯ PRODUCTION

```bash
# 1. Сильные пароли в .env
DB_PASSWORD=SuperComplexPassword123!@#
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# 2. Firewall (если не используется, открыть только 80/443)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 3. SSL сертификат автоматически обновляется
# (Traefik сам следит за Let's Encrypt сертификатами)

# 4. Резервное копирование БД
docker exec snapcheck-db pg_dump -U snapcheck snapcheck > backup.sql

# 5. Логирование
docker-compose logs -f > /var/log/snapcheck.log &
```

---

## 📋 ЧЕКЛИСТ ПЕРЕД ЗАПУСКОМ

- [ ] SSH ключи настроены
- [ ] Домен указывает на IP сервера
- [ ] Docker установлен
- [ ] Traefik запущен
- [ ] Порты 80/443 свободны
- [ ] Сеть traefik-net существует
- [ ] .env создан и заполнен
- [ ] docker-compose.yml скопирован
- [ ] docker-nginx-traefik.conf скопирован

---

## 🎯 ПОСЛЕ ЗАПУСКА

```bash
# 1. Проверить логи
docker-compose logs -f

# 2. Подождать 30-60 секунд (старт приложений)

# 3. Проверить URL
https://yourdomain.com          # Frontend
https://yourdomain.com/api/health  # API

# 4. Слегка отредактировать если нужно
nano /opt/snapcheck/.env
docker-compose restart

# 5. Установить backup (рекомендуется)
crontab -e
# Добавить: 0 2 * * * docker exec snapcheck-db pg_dump -U snapcheck snapcheck > /opt/backup-$(date +%Y%m%d).sql
```

---

## 📞 ПОДДЕРЖКА

**Если что-то не работает:**

1. Посмотри логи: `docker-compose logs -f`
2. Проверь диагностику: `sudo bash check-docker-traefik.sh`
3. Посмотри полную документацию: `DOCKER_TRAEFIK_INSTALLATION.md`
4. Проверь DNS: `nslookup yourdomain.com`
5. Проверь SSL: `echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates`

**Готово! Приложение работает! 🚀**
