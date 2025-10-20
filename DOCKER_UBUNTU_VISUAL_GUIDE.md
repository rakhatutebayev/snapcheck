# 🐳 DOCKER УСТАНОВКА НА UBUNTU - ВИЗУАЛЬНОЕ РУКОВОДСТВО

## 📊 СХЕМА АРХИТЕКТУРЫ

```
┌────────────────────────────────────────────────────────────┐
│                    UBUNTU SERVER                            │
│  (your-domain.com)                                          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────── DOCKER ──────────────────┐          │
│  │                                               │          │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────┐ │          │
│  │  │ NGINX       │  │  FASTAPI    │  │ PSQL │ │          │
│  │  │ Frontend    │  │  Backend    │  │  DB  │ │          │
│  │  │             │  │             │  │      │ │          │
│  │  │ Port 80/443 │  │ Port 8000   │  │ 5432 │ │          │
│  │  └─────────────┘  └─────────────┘  └──────┘ │          │
│  │                                               │          │
│  │      slideconfirm-network (мост)             │          │
│  └───────────────────────────────────────────────┘          │
│                        ↓                                     │
│         ┌─────────────────────────────┐                    │
│         │ data/db (БД)                │                    │
│         │ data/uploads (файлы)        │                    │
│         │ logs/ (логи)                │                    │
│         └─────────────────────────────┘                    │
│                                                              │
└────────────────────────────────────────────────────────────┘
         ↑
    ИНТЕРНЕТ
         ↓
    🌐 БРАУЗЕР
    https://your-domain.com
```

---

## 📋 ШАГ ЗА ШАГОМ

```
ШАГ 1: SSH ПОДКЛЮЧЕНИЕ
   ├─ ssh root@YOUR_SERVER_IP
   └─ Введите пароль

   РЕЗУЛЬТАТ: ✅ Вы в терминале сервера

─────────────────────────────────────────────

ШАГ 2: УСТАНОВИТЬ DOCKER (2 минуты)
   ├─ curl -fsSL https://get.docker.com | sudo sh
   ├─ sudo usermod -aG docker $USER
   └─ newgrp docker

   РЕЗУЛЬТАТ: ✅ Docker установлен

─────────────────────────────────────────────

ШАГ 3: УСТАНОВИТЬ DOCKER COMPOSE (1 минута)
   ├─ sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   ├─ sudo chmod +x /usr/local/bin/docker-compose
   └─ docker-compose --version

   РЕЗУЛЬТАТ: ✅ Docker Compose установлен

─────────────────────────────────────────────

ШАГ 4: ЗАГРУЗИТЬ ПРОЕКТ (2 минуты)
   ├─ cd /opt
   ├─ sudo git clone https://github.com/USERNAME/slideconfirm.git
   ├─ cd slideconfirm
   └─ sudo mkdir -p data/db data/uploads logs/{backend,nginx}

   РЕЗУЛЬТАТ: ✅ Проект загружен в /opt/slideconfirm

─────────────────────────────────────────────

ШАГ 5: СОЗДАТЬ .env (2 минуты)
   ├─ sudo nano .env
   ├─ Отредактировать пароли и SECRET_KEY
   ├─ Нажать Ctrl+X → Y → Enter
   └─ Проверить: sudo cat .env

   РЕЗУЛЬТАТ: ✅ .env файл создан

─────────────────────────────────────────────

ШАГ 6: СОБРАТЬ ОБРАЗЫ (10 минут)
   ├─ sudo docker-compose -f docker-compose.prod.yml build
   └─ Ждать...

   РЕЗУЛЬТАТ: ✅ Образы собраны

─────────────────────────────────────────────

ШАГ 7: ЗАПУСТИТЬ КОНТЕЙНЕРЫ (2 минуты)
   ├─ sudo docker-compose -f docker-compose.prod.yml up -d
   ├─ sleep 10
   └─ sudo docker ps

   РЕЗУЛЬТАТ: ✅ Контейнеры запущены

─────────────────────────────────────────────

ШАГ 8: ПОЛУЧИТЬ SSL СЕРТИФИКАТ (2 минуты)
   ├─ sudo apt install certbot
   ├─ sudo certbot certonly --standalone -d your-domain.com
   └─ Ввести email

   РЕЗУЛЬТАТ: ✅ SSL сертификат готов

─────────────────────────────────────────────

ШАГ 9: ПРОВЕРИТЬ (1 минута)
   ├─ curl https://your-domain.com
   ├─ curl https://api.your-domain.com/health
   └─ Открыть в браузере: https://your-domain.com

   РЕЗУЛЬТАТ: ✅ ВСЁ РАБОТАЕТ!
```

---

## 🎯 ВЫБРАННЫЙ ПУТЬ

### ПУТЬ 1: ПОЛНАЯ АВТОМАТИЗАЦИЯ (Рекомендуется)

```bash
# Одна команда делает всё!
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/slideconfirm/main/deploy-ubuntu.sh | sudo bash -s your-domain.com

# Время: 20 минут
# Сложность: Очень легко ✅
```

### ПУТЬ 2: БЫСТРЫЙ СТАРТ

```bash
# Вручную по шагам (самый быстрый путь)

# 1. Установить Docker (скопировать 3 команды)
curl -fsSL https://get.docker.com | sudo sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose

# 2. Загрузить проект (скопировать 3 команды)
cd /opt && sudo git clone https://github.com/YOUR_USERNAME/slideconfirm.git && cd slideconfirm && sudo mkdir -p data/db data/uploads logs/{backend,nginx}

# 3. Настроить .env (скопировать 1 команду)
sudo nano .env  # отредактировать

# 4. Запустить (скопировать 1 команду)
sudo docker-compose -f docker-compose.prod.yml up -d

# Время: 15 минут
# Сложность: Легко ✅
```

### ПУТЬ 3: ПОДРОБНОЕ ИЗУЧЕНИЕ

```
1. Прочитать: DOCKER_UBUNTU_INSTALLATION.md (30 минут)
2. Выполнить все шаги вручную (30 минут)
3. Понимаешь как всё работает ✅

Время: 1 час
Сложность: Средняя
Результат: Полное понимание
```

---

## 📱 ПРОСТОЙ ЧЕКЛИСТ

```
☐ SSH подключение работает
  ssh root@YOUR_SERVER_IP

☐ Docker установлен
  docker --version

☐ Docker Compose установлен
  docker-compose --version

☐ Проект загружен
  ls /opt/slideconfirm

☐ Директории созданы
  ls /opt/slideconfirm/data

☐ .env файл создан
  cat /opt/slideconfirm/.env

☐ Образы собраны (10 мин ждать!)
  docker images | grep slideconfirm

☐ Контейнеры запущены
  docker ps | grep slideconfirm

☐ Приложение доступно
  curl https://your-domain.com

☐ API работает
  curl https://api.your-domain.com/health
```

---

## 🔄 ЖИЗНЕННЫЙ ЦИКЛ

```
ДЕНЬ 1: УСТАНОВКА
├─ Выполнить шаги 1-7 выше
└─ 30 минут ✅

ДЕНЬ 2-7: ИСПОЛЬЗОВАНИЕ
├─ Приложение работает 24/7
├─ Автоматический backup каждую ночь
└─ Всё работает! ✅

ЧЕРЕЗ НЕДЕЛЮ: ОБНОВЛЕНИЕ
├─ git pull (новый код)
├─ docker-compose build (пересобрать)
├─ docker-compose restart (перезагрузить)
└─ Новая версия развернута! ✅
```

---

## ❓ ЕСЛИ ЕСТЬ ПРОБЛЕМЫ

```
ПРОБЛЕМА 1: "Permission denied"
└─ Решение: sudo usermod -aG docker $USER && newgrp docker

ПРОБЛЕМА 2: "Port already in use"
└─ Решение: sudo lsof -i :80 && sudo kill -9 <PID>

ПРОБЛЕМА 3: "Cannot connect to API"
└─ Решение: docker-compose logs -f backend

ПРОБЛЕМА 4: "Build failed"
└─ Решение: docker-compose build --no-cache

ПРОБЛЕМА 5: "Out of space"
└─ Решение: docker system prune -a
```

---

## 💰 СТОИМОСТЬ

```
Docker: БЕСПЛАТНО ✅
Ubuntu Server: От $5/месяц
Domain: От $10/год
SSL: БЕСПЛАТНО (Let's Encrypt) ✅

ИТОГО: ~$10/год + хостинг
```

---

## 📞 ПОМОЩЬ

**Если скрипт не работает:**
1. Посмотреть ошибку в терминале
2. Прочитать DOCKER_UBUNTU_INSTALLATION.md → "ПРОБЛЕМЫ И РЕШЕНИЯ"
3. Выполнить шаги вручную

**Если контейнеры не запускаются:**
```bash
docker-compose logs backend   # Посмотреть ошибку
docker-compose restart         # Перезагрузить
```

**Если приложение медленно:**
```bash
docker stats                   # Посмотреть использование
docker-compose restart backend # Перезагрузить backend
```

---

## ✨ ГОТОВО!

Ты готов развернуть SlideConfirm на Docker! 🚀

**ВЫБЕРИ:**
- 👉 **Вариант 1** (Самый быстрый) → Скопировать скрипт deploy-ubuntu.sh
- 👉 **Вариант 2** (Быстро) → Следовать "ПУТЬ 2" выше
- 👉 **Вариант 3** (Понять) → Прочитать DOCKER_UBUNTU_INSTALLATION.md

**ТЫ СМОЖЕШЬ! 💪**
