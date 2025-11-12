# ✅ DOCKER + TRAEFIK - ПОЛНЫЙ ЧЕКЛИСТ

## 📋 ВСЕ ФАЙЛЫ И ШАГИ

### 📂 Созданные/Обновленные Файлы

```
✅ DOCKER_TRAEFIK_INSTALLATION.md       # Полная документация
✅ DOCKER_TRAEFIK_QUICK_START.md        # Быстрый старт (1 минута)
✅ docker-compose-traefik.yml           # Ready-to-use docker-compose
✅ docker-nginx-traefik.conf            # Nginx конфиг без SSL
✅ check-docker-traefik.sh              # Скрипт проверки конфликтов
```

---

## 🚀 ПОШАГОВАЯ УСТАНОВКА

### ЭТАП 1: ПОДГОТОВКА НА ЛОКАЛЬНОМ КОМПЬЮТЕРЕ (Mac)

```
1. Откройте файлы для редактирования:
   ✅ docker-compose-traefik.yml
   ✅ docker-nginx-traefik.conf
   ✅ DOCKER_TRAEFIK_QUICK_START.md

2. Убедитесь что они готовы (это примеры для копирования на сервер)

3. Скачайте/подготовьте SSH ключ для сервера
```

### ЭТАП 2: НАСТРОЙКА НА UBUNTU СЕРВЕРЕ

```bash
# Шаг 1: Подключиться к серверу
ssh root@YOUR_SERVER_IP
# или если используется обычный пользователь:
ssh user@YOUR_SERVER_IP
sudo su

# Шаг 2: Проверить что Docker установлен
docker --version
docker-compose --version

# Шаг 3: Проверить что Traefik запущен
docker ps | grep traefik

# Шаг 4: Проверить сеть traefik-net
docker network ls | grep traefik-net
# Если нету, создать:
docker network create traefik-net
```

### ЭТАП 3: ЗАГРУЗКА ПРОЕКТА

```bash
# Вариант A: Из GitHub
git clone https://github.com/YOUR_USERNAME/snapcheck.git /opt/snapcheck
cd /opt/snapcheck

# Вариант B: Копировать с Mac через SFTP
# или вручную скопировать файлы
```

### ЭТАП 4: ПРОВЕРКА КОНФЛИКТОВ ПОРТОВ

```bash
# Запустить диагностический скрипт
bash check-docker-traefik.sh

# Или вручную проверить:
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :443

# Если есть конфликты - разрешить их
docker ps -a  # Посмотреть что использует порты
docker stop <CONTAINER>  # Остановить если нужно
```

### ЭТАП 5: СОЗДАНИЕ .env ФАЙЛА

```bash
# Создать .env с вашими параметрами
cat > /opt/snapcheck/.env << 'EOF'
# ✅ ИЗМЕНИТЕ ЗНАЧЕНИЯ!
DOMAIN=snapcheck.yourdomain.com      # ← Ваш домен
SECRET_KEY=GeneratedSecretKeyHere       # ← Генерировать: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
DB_PASSWORD=YourStrongPassword123       # ← Сильный пароль БД
ENVIRONMENT=production
LOG_LEVEL=info
EOF

# Проверить содержимое
cat /opt/snapcheck/.env
```

### ЭТАП 6: ПОДГОТОВКА ФАЙЛОВ ПРОЕКТА

```bash
cd /opt/snapcheck

# Создать директории
mkdir -p data/db data/uploads logs/backend logs/nginx

# Убедиться что есть все нужные файлы
ls -la Dockerfile.backend
ls -la Dockerfile.frontend
ls -la docker-compose-traefik.yml
ls -la docker-nginx-traefik.conf
ls -la requirements.txt
ls -la backend/
ls -la frontend/

# Переименовать docker-compose-traefik.yml в docker-compose.yml
mv docker-compose-traefik.yml docker-compose.yml
cp docker-nginx-traefik.conf docker-nginx.conf
```

### ЭТАП 7: СОБРАТЬ ОБРАЗЫ

```bash
cd /opt/snapcheck

# Построить Docker образы (ДОЛГО - 10-15 минут)
docker-compose build

# Или пересобрать заново если были ошибки
docker-compose build --no-cache
```

### ЭТАП 8: ЗАПУСТИТЬ КОНТЕЙНЕРЫ

```bash
# Запустить в фоновом режиме
docker-compose up -d

# Проверить что всё запустилось
docker-compose ps

# Должно показать:
# snapcheck-backend    Up
# snapcheck-frontend   Up
# snapcheck-db         Up
```

### ЭТАП 9: ПРОВЕРИТЬ РАБОТУ

```bash
# Подождать 30 секунд пока приложение стартует
sleep 30

# Проверить логи
docker-compose logs -f

# Остановить просмотр логов: Ctrl+C

# Проверить что backend работает
docker exec snapcheck-backend curl http://localhost:8000/health

# Проверить подключение к БД
docker exec snapcheck-db psql -U snapcheck -d snapcheck -c "SELECT 1"
```

### ЭТАП 10: ПРОВЕРИТЬ TRAEFIK

```bash
# Посмотреть логи Traefik
docker logs traefik | tail -30

# Должны быть строки:
# "Creating router snapcheck-backend"
# "Creating router snapcheck-frontend"
# "Trying to obtain and store certificate for domain ..."

# Проверить SSL сертификат
docker logs traefik | grep letsencrypt | tail -5
```

### ЭТАП 11: ФИНАЛЬНАЯ ПРОВЕРКА

```bash
# ✅ Если всё из браузера работает
# Открыть https://yourdomain.com
# Должны видеть:
# - Фронтенд приложение
# - Форма логина/регистрации

# ✅ Проверить API
curl -k https://yourdomain.com/api/health
# Ответ: {"status":"ok"}
```

---

## 🔍 ДИАГНОСТИКА

### Если что-то не работает

```bash
# 1. Посмотреть статус контейнеров
docker-compose ps

# 2. Посмотреть логи каждого
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# 3. Посмотреть логи Traefik
docker logs traefik | grep -i "error\|warning"

# 4. Проверить сетевое подключение
docker network inspect traefik-net

# 5. Проверить использование ресурсов
docker stats

# 6. Проверить порты
sudo ss -tlnp | grep -E ":80|:443"
```

### Частые проблемы

```bash
# Проблема: "Port 80 already in use"
sudo ss -tlnp | grep :80
# Остановить конфликтующее приложение
docker stop <name>
docker-compose restart

# Проблема: Backend не подключается к БД
docker-compose logs db
docker-compose restart db

# Проблема: Traefik не видит маршруты
docker-compose restart backend frontend
docker logs traefik | grep snapcheck

# Проблема: SSL сертификат не выписан
# Убедиться что DNS настроен: nslookup yourdomain.com
# Проверить логи: docker logs traefik | grep letsencrypt

# Проблема: Frontend показывает ошибку
# Проверить что API доступен: curl -k https://yourdomain.com/api/health
```

---

## 📊 КОМАНДЫ УПРАВЛЕНИЯ

```bash
cd /opt/snapcheck

# Запуск и остановка
docker-compose up -d          # Запустить
docker-compose stop           # Остановить
docker-compose restart        # Перезагрузить

# Логирование
docker-compose logs -f                    # Все логи (live)
docker-compose logs -f backend            # Backend только
docker-compose logs -f frontend           # Frontend только
docker-compose logs -f db                 # БД только

# Отладка
docker-compose exec backend bash          # Войти в backend
docker-compose exec db psql -U snapcheck -d snapcheck
                                          # Войти в БД

# Очистка
docker-compose down                       # Остановить и удалить контейнеры
docker-compose down -v                    # Удалить с данными (осторожно!)
```

---

## ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ

### Предварительно
- [ ] SSH доступ на сервер
- [ ] Docker установлен
- [ ] Docker Compose установлена
- [ ] Traefik запущен
- [ ] Сеть traefik-net существует
- [ ] Домен указывает на IP сервера

### Во время установки
- [ ] Проект загружен в /opt/snapcheck
- [ ] .env файл создан и заполнен
- [ ] docker-compose.yml скопирован/переименован
- [ ] docker-nginx-traefik.conf скопирован/переименован
- [ ] Директории data/ и logs/ созданы
- [ ] docker-compose build прошел успешно
- [ ] docker-compose up -d запустилось

### После запуска
- [ ] docker-compose ps показывает 3 Up контейнера
- [ ] docker logs traefik показывает успешное создание маршрутов
- [ ] curl -k https://yourdomain.com работает
- [ ] curl -k https://yourdomain.com/api/health возвращает 200
- [ ] SSL сертификат получен (видно в браузере)
- [ ] Нет ошибок в логах

### Production
- [ ] Strongные пароли в .env
- [ ] Firewall настроен (только 22, 80, 443)
- [ ] Backup БД настроен (cron job)
- [ ] Логирование настроено
- [ ] Monitoring настроен
- [ ] SSL автообновляется (Traefik)

---

## 📚 ФАЙЛЫ ДЛЯ СПРАВКИ

```
DOCKER_TRAEFIK_INSTALLATION.md     # Полная документация (все детали)
DOCKER_TRAEFIK_QUICK_START.md      # Быстрый старт (команды и шпаргалка)
docker-compose-traefik.yml         # Готовый docker-compose
docker-nginx-traefik.conf          # Nginx конфиг
check-docker-traefik.sh            # Диагностический скрипт
```

---

## 🎯 ИТОГО

1. **5 МИНУТ** - Подготовка на сервере
2. **15 МИНУТ** - Сборка Docker образов
3. **2 МИНУТЫ** - Запуск контейнеров
4. **1 МИНУТА** - Проверка работы

**ИТОГО: ~25 МИНУТ ДО PRODUCTION** 🚀

Приложение будет доступно на `https://yourdomain.com` со всеми преимуществами Traefik:
- ✅ Автоматический HTTPS
- ✅ Let's Encrypt сертификаты
- ✅ Маршрутизация по доменам
- ✅ Load balancing
- ✅ Автоматический перезапуск контейнеров

**Готово!** 🎉
