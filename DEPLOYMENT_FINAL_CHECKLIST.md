# ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ РАЗВЕРТЫВАНИЯ

## 📋 ЗАПОЛНИТЕ ЭТИ ДАННЫЕ ПРЯМО СЕЙЧАС

```ini
# ═══════════════════════════════════════════════════════════════
# ВАЖНЫЕ ДАННЫЕ ДЛЯ РАЗВЕРТЫВАНИЯ
# ═══════════════════════════════════════════════════════════════

# 1. ДАННЫЕ СЕРВЕРА
SERVER_IP = ____________________________
SSH_PORT = ____________________________  (обычно 22)
SSH_USER = ____________________________  (обычно root)
SSH_PASSWORD = ____________________________

# 2. ДОМЕН
DOMAIN = ____________________________  (например: snapcheck.com)
EMAIL_FOR_SSL = ____________________________  (например: admin@company.com)

# 3. GITHUB
GITHUB_REPO = ____________________________  (например: https://github.com/user/snapcheck.git)
GITHUB_BRANCH = [ ] main  [ ] master  (выберите одну)

# 4. ПАРОЛИ (оставьте пусто если хотите генерировать автоматически)
DB_PASSWORD = ____________________________
SECRET_KEY = ____________________________

# 5. СОСТОЯНИЕ ПОДГОТОВКИ
[ ] DNS настроен (домен указывает на IP сервера)
[ ] Docker установлен на сервере
[ ] SSH ключ готов (если используется)
[ ] Резервная копия текущего приложения сделана (если есть)
```

---

## 🔧 КОМАНДНЫЙ БЛОК ДЛЯ КОПИРОВАНИЯ

### Скопируйте и вставьте эти команды в терминал вашего сервера

#### 1️⃣ ПОДКЛЮЧЕНИЕ К СЕРВЕРУ

```bash
# Замените YOUR_IP на IP вашего сервера
ssh root@YOUR_IP

# Если используется другой порт:
ssh -p YOUR_PORT root@YOUR_IP

# Если используется SSH ключ:
ssh -i ~/.ssh/id_rsa root@YOUR_IP
```

#### 2️⃣ ПРОВЕРКА ЗАВИСИМОСТЕЙ (выполнить на сервере)

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить необходимое ПО
sudo apt install -y docker.io docker-compose git curl wget nano openssh-client

# Проверить версии
docker --version
docker-compose --version
git --version

# Добавить пользователя в группу docker
sudo usermod -aG docker root
sudo usermod -aG docker $USER
```

#### 3️⃣ ЗАГРУЗКА ПРОЕКТА (выполнить на сервере)

```bash
# Перейти в директорию /opt
cd /opt

# Загрузить проект из GitHub
git clone https://github.com/YOUR_USERNAME/snapcheck.git snapcheck
cd snapcheck

# Или если используется приватный репозиторий:
# git clone git@github.com:YOUR_USERNAME/snapcheck.git snapcheck

# Проверить что загружено
ls -la
```

#### 4️⃣ СОЗДАНИЕ КОНФИГУРАЦИИ (выполнить на сервере)

```bash
# Перейти в директорию проекта
cd /opt/snapcheck

# Создать .env файл с вашими данными
cat > .env << 'EOF'
DOMAIN=YOUR_DOMAIN.COM
ENVIRONMENT=production
LOG_LEVEL=info
SECRET_KEY=YOUR_SECRET_KEY_HERE
DB_PASSWORD=YOUR_DB_PASSWORD_HERE
DATABASE_URL=postgresql://snapcheck:YOUR_DB_PASSWORD_HERE@db:5432/snapcheck
VITE_API_URL=https://YOUR_DOMAIN.COM/api
NODE_ENV=production
WORKERS=4
PYTHONUNBUFFERED=1
EOF

# Отредактировать .env (если нужно)
nano .env
# После редактирования: Ctrl+O → Enter → Ctrl+X
```

#### 5️⃣ ЗАПУСК ПРИЛОЖЕНИЯ (выполнить на сервере)

```bash
# Перейти в директорию проекта
cd /opt/snapcheck

# Создать Docker сеть (если не существует)
sudo docker network create traefik-net 2>/dev/null || true

# Построить образы
docker-compose build

# Запустить контейнеры
docker-compose up -d

# Дождаться полного запуска (~30 сек)
sleep 30

# Проверить статус
docker-compose ps
```

#### 6️⃣ ПРОВЕРКА РАБОТОСПОСОБНОСТИ (выполнить на сервере)

```bash
# Все ли контейнеры запущены?
docker-compose ps

# Посмотреть логи
docker-compose logs --tail 20

# Проверить backend API
curl http://localhost:8000/health

# Проверить что frontend запущен
curl http://localhost/

# Проверить что Traefik видит приложение
docker logs traefik | grep snapcheck
```

#### 7️⃣ ПРОВЕРКА ВЕБ-ИНТЕРФЕЙСА (на вашем ПК)

```bash
# Откройте браузер и перейдите на:
# https://YOUR_DOMAIN.COM/

# Проверьте в консоли браузера (F12 → Console):
# Не должно быть красных ошибок
# API должен быть доступен
```

---

## 🎯 БЫСТРЫЙ СТАРТ (если всё уже подготовлено)

### За 5 минут:

```bash
# 1. Подключиться к серверу
ssh root@YOUR_IP

# 2. Скачать и выполнить скрипт установки
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/snapcheck/main/deploy.sh
chmod +x deploy.sh
./deploy.sh https://github.com/YOUR_USERNAME/snapcheck.git YOUR_DOMAIN DB_PASSWORD

# 3. Дождаться завершения (5-10 минут)
# Скрипт сам всё установит и настроит

# 4. Проверить статус
docker-compose ps
```

---

## 📊 ТАБЛИЦА ЗАМЕНЫ ПЕРЕМЕННЫХ

Перед выполнением команд замените следующие значения:

| Переменная | Текущее | Ваше значение |
|-----------|---------|-------------|
| `YOUR_IP` | `192.168.1.1` | `____________________` |
| `YOUR_PORT` | `22` | `____________________` |
| `YOUR_DOMAIN.COM` | `example.com` | `____________________` |
| `YOUR_USERNAME` | `github_user` | `____________________` |
| `YOUR_SECRET_KEY_HERE` | - | `____________________` |
| `YOUR_DB_PASSWORD_HERE` | - | `____________________` |

---

## ✅ ЧЕКЛИСТ ПЕРЕД ЗАПУСКОМ

### Локально (на вашем ПК):

- [ ] Знаете IP адрес сервера
- [ ] Знаете пароль/имеют SSH ключ для подключения
- [ ] Знаете ваш домен
- [ ] Email адрес для SSL сертификата готов
- [ ] GitHub репозиторий готов (публичный или есть SSH ключ)
- [ ] Сохранили все необходимые пароли в безопасном месте

### На сервере (подготовка):

- [ ] Сервер доступен по SSH
- [ ] ОС: Ubuntu 20.04+ или Debian 11+
- [ ] Минимум: 2GB RAM, 20GB места
- [ ] Порты 80 и 443 свободны
- [ ] DNS настроен (домен указывает на IP сервера)

### После запуска:

- [ ] Все 3 контейнера запущены: `docker-compose ps`
- [ ] Backend здоров: `curl http://localhost:8000/health`
- [ ] Frontend доступен: `curl http://localhost/`
- [ ] Traefik видит приложение: `docker logs traefik | grep snapcheck`
- [ ] Браузер показывает приложение: `https://YOUR_DOMAIN/`
- [ ] API работает: `https://YOUR_DOMAIN/api/health`

---

## 🔑 ГЕНЕРАЦИЯ БЕЗОПАСНЫХ ПАРОЛЕЙ

### На вашем ПК или сервере:

```bash
# Генерировать SECRET_KEY (для Flask/Django)
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"

# Генерировать DB_PASSWORD (для PostgreSQL)
openssl rand -base64 32

# Или использовать date
date | md5sum | cut -c1-32
```

---

## 🚨 ЕСЛИ ЧТО-ТО ПОШЛО НЕ ТАК

### Диагностика проблем:

#### Проблема: Не подключается к серверу
```bash
# Проверить доступность сервера
ping YOUR_IP
# или
telnet YOUR_IP 22

# Убедиться что IP правильный
# Убедиться что firewall не блокирует SSH
```

#### Проблема: Docker не найден
```bash
# Установить Docker
sudo apt update
sudo apt install -y docker.io docker-compose

# Проверить
docker --version
```

#### Проблема: Ошибка при сборке
```bash
# Посмотреть ошибку
docker-compose build 2>&1 | tail -50

# Пересоздать заново
docker-compose down
docker-compose build --no-cache
```

#### Проблема: Контейнеры не запускаются
```bash
# Посмотреть ошибки
docker-compose logs -f

# Перезагрузить
docker-compose restart

# Если не поможет, пересоздать
docker-compose down
docker-compose up -d
```

#### Проблема: Сайт не открывается
```bash
# Проверить DNS
nslookup YOUR_DOMAIN
# Должен показать IP вашего сервера

# Проверить порты
sudo ss -tlnp | grep -E ":80|:443"

# Проверить что Traefik работает
docker logs traefik | tail -20

# Проверить логи приложения
docker-compose logs -f
```

---

## 📱 МОНИТОРИНГ ПРИЛОЖЕНИЯ

### Регулярно выполняйте:

```bash
# Каждый день проверяйте здоровье
docker-compose ps

# Ежедневно смотрите логи
docker-compose logs --tail 50

# Проверяйте использование ресурсов
docker stats

# Проверяйте размер БД
docker exec snapcheck-db du -sh /var/lib/postgresql/data
```

---

## 💾 РЕЗЕРВНОЕ КОПИРОВАНИЕ

### Сделать резервную копию сейчас:

```bash
cd /opt/snapcheck

# Дамп БД
docker-compose exec -T db pg_dump -U snapcheck snapcheck > backup-$(date +%Y%m%d-%H%M%S).sql

# Скачать на ПК (выполнить на ПК):
scp root@YOUR_IP:/opt/snapcheck/backup-*.sql ~/Downloads/

# Или архивировать всё
tar -czf backup-snapcheck-$(date +%Y%m%d).tar.gz -C /opt snapcheck
```

---

## 🔐 БЕЗОПАСНОСТЬ

### После развертывания:

```bash
# 1. Изменить пароль root (если используется)
passwd

# 2. Включить firewall
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 3. Включить автоматическое обновление
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# 4. Проверить что не логируются чувствительные данные
grep -r "SECRET_KEY\|DB_PASSWORD\|password" /opt/snapcheck/logs/ || echo "✅ OK"
```

---

## 📞 ТЕХНИЧЕСКАЯ ПОДДЕРЖКА

### Если нужна помощь:

1. Соберите информацию:
   ```bash
   docker-compose ps > status.txt
   docker-compose logs > logs.txt
   cat .env > config.txt
   ```

2. Посмотрите документацию:
   - `DOCKER_TRAEFIK_INSTALLATION.md` - полный гайд
   - `DOCKER_TRAEFIK_QUICK_START.md` - шпаргалка
   - `check-docker-traefik.sh` - скрипт диагностики

3. Проверьте логи Traefik:
   ```bash
   docker logs traefik | grep -i error
   ```

---

## 🎉 ГОТОВО!

После завершения всех шагов:

```
✅ Frontend доступен на: https://YOUR_DOMAIN/
✅ API доступен на: https://YOUR_DOMAIN/api/health
✅ SSL сертификат установлен автоматически
✅ Приложение готово к использованию
✅ Резервное копирование настроено
✅ Мониторинг включен
```

---

**ВПЕРЕД! Начните развертывание! 🚀**

Если появились вопросы - посмотрите более подробное руководство:
- `DEPLOYMENT_STEP_BY_STEP.md` - пошаговое руководство
- `DOCKER_TRAEFIK_INSTALLATION.md` - все детали
