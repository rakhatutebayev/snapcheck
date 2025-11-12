# 📋 ЧЕКЛИСТ ДАННЫХ ДЛЯ ПУБЛИКАЦИИ НА СЕРВЕР

## ⚠️ СРОЧНО ЗАПОЛНИТЕ:

### 1️⃣ ДАННЫЕ СЕРВЕРА
```
🔹 IP адрес сервера:           _________________________
🔹 SSH порт (обычно 22):        _________________________
🔹 Пользователь SSH:            _________________________
🔹 Способ входа:                [ ] Пароль  [ ] SSH ключ
🔹 Пароль SSH:                  _________________________
🔹 ОС сервера:                  [ ] Ubuntu  [ ] Debian  [ ] Другое: _______
🔹 Версия ОС:                   _________________________
```

### 2️⃣ ИНФОРМАЦИЯ О ДОМЕНЕ
```
🔹 Домен приложения:            _________________________
🔹 Email для SSL сертификата:   _________________________
🔹 DNS уже настроен?            [ ] Да  [ ] Нет
🔹 Текущий A запись указывает на: _________________________
```

### 3️⃣ БАЗОВЫЕ ПАРОЛИ И КЛЮЧИ
```
🔹 БД пароль (PostgreSQL):      _________________________
   (если нет - сгенерируем)

🔹 SECRET_KEY для backend:      _________________________
   (если нет - сгенерируем)

🔹 Admin пароль:                _________________________
```

### 4️⃣ КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
```
🔹 Ссылка на GitHub репозиторий:  _________________________
🔹 Ветка для deployment:           [ ] main  [ ] master  [ ] другое: _____
🔹 Окружение:                      [ ] production  [ ] staging
```

### 5️⃣ ТРЕБОВАНИЯ СЕРВЕРА
```
🔹 Docker установлен?           [ ] Да  [ ] Нет
🔹 Docker Compose установлен?   [ ] Да  [ ] Нет
🔹 Traefik работает?            [ ] Да  [ ] Нет
🔹 Свободно RAM:                [ ] >2GB  [ ] >4GB  [ ] >8GB
🔹 Свободно места:              [ ] >20GB [ ] >50GB [ ] >100GB
```

---

## ✅ ЧТО УЖЕ ЕСТЬ В ПРОЕКТЕ (ГОТОВО)

```
✅ Dockerfile.backend              - готов
✅ Dockerfile.frontend             - готов  
✅ docker-compose.prod.yml         - готов
✅ docker-nginx-traefik.conf       - готов
✅ docker-nginx.conf               - готов
✅ docker-compose-traefik.yml      - готов
✅ check-docker-traefik.sh         - готов
✅ deploy-ubuntu.sh                - готов
✅ install-prod.sh                 - готов
✅ requirements.txt                - готов
✅ Вся документация                - готов
```

---

## 🚀 ПЛАН ДЕЙСТВИЙ (После заполнения данных)

**1. ПОДГОТОВКА (5 минут)**
- [ ] Создать .env файл с вашими данными
- [ ] Обновить docker-compose.yml если нужно
- [ ] Подготовить SSH ключи если требуется

**2. ПРОВЕРКА СЕРВЕРА (10 минут)**
- [ ] Подключиться к серверу по SSH
- [ ] Проверить Docker: `docker --version`
- [ ] Проверить Docker Compose: `docker-compose --version`
- [ ] Проверить свободные порты: `sudo ss -tlnp`

**3. ЗАГРУЗКА ПРОЕКТА (5 минут)**
- [ ] Загрузить проект через Git или SFTP
- [ ] Скопировать .env файл
- [ ] Проверить что все файлы на месте

**4. ЗАПУСК (2 минуты)**
- [ ] docker-compose build
- [ ] docker-compose up -d
- [ ] docker-compose ps (проверить что все запущено)

**5. ПРОВЕРКА (5 минут)**
- [ ] Проверить https://yourdomain.com
- [ ] Проверить https://yourdomain.com/api/health
- [ ] Посмотреть логи: docker-compose logs -f

---

## 📧 ОТПРАВЬТЕ МНЕ ЗАПОЛНЕННЫЕ ДАННЫЕ:

Скопируйте и заполните этот текст:

```
🔹 IP адрес сервера: 
🔹 SSH порт: 
🔹 Пользователь SSH: 
🔹 ОС сервера: 
🔹 Домен приложения: 
🔹 Email для SSL: 
🔹 GitHub репозиторий: 
🔹 Docker уже установлен? 
🔹 Traefik уже работает? 
```

---

## 🎯 ТОЧНЫЙ ПОРЯДОК КОМАНД (После подключения к серверу)

```bash
# 1. Подключиться
ssh -p 22 root@YOUR_IP

# 2. Проверить Docker
docker --version
docker-compose --version

# 3. Создать директорию
mkdir -p /opt/snapcheck
cd /opt/snapcheck

# 4. Загрузить проект (выберите один способ):

# Способ A: Git (если репозиторий публичный)
git clone https://github.com/YOUR_USERNAME/snapcheck.git .

# Способ B: SFTP (если хотите загрузить локальный код)
# На вашем ПК: sftp -P 22 root@YOUR_IP
# sftp> put -r /Users/rakhat/Documents/webhosting/SnapCheck /opt/snapcheck

# 5. Создать .env файл
cat > .env << 'EOF'
DOMAIN=yourdomain.com
DB_PASSWORD=YourStrongPassword123
SECRET_KEY=your-secret-key-here
ENVIRONMENT=production
LOG_LEVEL=info
VITE_API_URL=https://yourdomain.com/api
EOF

# 6. Запустить
docker-compose up -d

# 7. Проверить статус
docker-compose ps

# 8. Посмотреть логи
docker-compose logs -f backend
```

---

## 🆘 ЧАСТЫЕ ПРОБЛЕМЫ

| Проблема | Решение |
|----------|---------|
| "command not found: docker" | Docker не установлен. Установить: `sudo apt update && sudo apt install docker.io` |
| "Port 80 already in use" | Остановить другое приложение: `sudo systemctl stop nginx` |
| "Cannot connect to Docker daemon" | Добавить в группу: `sudo usermod -aG docker $USER` |
| "DNS не резолвится" | Проверить: `nslookup yourdomain.com` |
| "SSL не выписан" | Проверить логи: `docker logs traefik` |

---

## 📞 СЛЕДУЮЩИЕ ШАГИ

1. **Заполните данные выше** ⬆️
2. **Отправьте мне информацию**
3. **Я создам .env файл с вашими данными**
4. **Я подготовлю скрипт для автоматической установки**
5. **Вы запустите скрипт на сервере**
6. **Приложение будет работать! 🎉**

---

**ГОТОВЫ? Начните с заполнения данных выше! ⬆️**
