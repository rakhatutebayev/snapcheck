# 📦 Production Package - SnapCheck

## ✅ Что входит в production пакет

Полный набор файлов и документации для развёртывания на production сервере.

### 🐳 Docker файлы

| Файл | Описание |
|------|---------|
| **Dockerfile.backend** | Docker образ для FastAPI backend |
| **Dockerfile.frontend** | Docker образ для React frontend с Nginx |
| **docker-compose.prod.yml** | Production конфигурация Docker Compose |
| **docker-nginx.conf** | Nginx конфигурация для frontend |

### 🔧 Скрипты установки и управления

| Скрипт | Команда | Описание |
|--------|---------|---------|
| **install.sh** | `sudo bash install.sh` | Полная установка на Ubuntu |
| **update.sh** | `bash update.sh` | Обновление приложения |
| **backup.sh** | `bash backup.sh` | Резервная копия БД и файлов |
| **health-check.sh** | `bash health-check.sh` | Проверка здоровья сервиса |

### 📚 Документация

| Документ | Для кого | Описание |
|----------|----------|---------|
| **README_PRODUCTION.md** | Администраторы | Полный обзор и инструкции |
| **QUICK_START.md** | Быстрый старт | ⚡ 5 минут на старт за 5 минут |
| **PRODUCTION_DEPLOY.md** | DevOps инженеры | 🚀 Детальное руководство deployment |
| **INTERACTIVE_REPORT.md** | Разработчики | 📊 Описание интерактивных отчётов |
| **RENAME_LOGIC.md** | Разработчики | 📁 Логика переименования файлов |
| **USER_GUIDE_RENAME.md** | Конечные пользователи | 👤 Как использовать систему |

---

## 🚀 Как использовать этот пакет

### Вариант 1: Быстрая установка (5 минут)

```bash
# 1. SSH на сервер
ssh root@your-server.com

# 2. Загрузить скрипт
wget https://raw.github.com/...install.sh
# или скопировать файл

# 3. Запустить установку
sudo bash install.sh

# 4. Открыть браузер
# http://your-server:3000
```

**Результат**: Полностью работающее приложение на сервере.

### Вариант 2: Развёртывание через Docker Compose

```bash
# 1. Скопировать файлы на сервер
scp -r ./* root@your-server:/opt/snapcheck/

# 2. На сервере
cd /opt/snapcheck

# 3. Собрать и запустить
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Проверить
docker-compose ps
curl http://localhost:8000/health
```

### Вариант 3: Развёртывание через Kubernetes

```bash
# Готовые Kubernetes манифесты (находятся в k8s/ директории)
kubectl apply -f k8s/

# Проверить
kubectl get pods
kubectl get services
```

---

## 📊 Структура production пакета

```
SnapCheck/
│
├── 🐳 Docker Files
│   ├── Dockerfile.backend           # Backend контейнер
│   ├── Dockerfile.frontend          # Frontend контейнер
│   ├── docker-compose.prod.yml      # Production оркестрация
│   └── docker-nginx.conf            # Nginx конфиг
│
├── 🔧 Scripts
│   ├── install.sh                   # Установка на Ubuntu
│   ├── update.sh                    # Обновление
│   ├── backup.sh                    # Резервная копия
│   └── health-check.sh              # Проверка здоровья
│
├── 📚 Documentation
│   ├── README_PRODUCTION.md         # Полный обзор
│   ├── QUICK_START.md               # Быстрый старт
│   ├── PRODUCTION_DEPLOY.md         # Детальный гайд
│   ├── INTERACTIVE_REPORT.md        # Отчёты
│   ├── RENAME_LOGIC.md              # Переименование
│   └── USER_GUIDE_RENAME.md         # Руководство пользователя
│
├── 📁 Source Code
│   ├── backend/                     # FastAPI приложение
│   ├── frontend/                    # React приложение
│   └── [основной код]
│
└── 📋 Configuration
    ├── .env.example                 # Пример переменных окружения
    ├── systemd/snapcheck.service # SystemD юнит
    └── config/                      # Дополнительные конфиги
```

---

## 🎯 Quick Reference

### Установка

```bash
# Один скрипт - полная установка
sudo bash install.sh
```

### Управление

```bash
cd /opt/snapcheck/app

# Запуск
docker-compose -f docker-compose.prod.yml up -d

# Остановка
docker-compose -f docker-compose.prod.yml down

# Перезагрузка
docker-compose -f docker-compose.prod.yml restart

# Логи
docker-compose -f docker-compose.prod.yml logs -f
```

### Обновление

```bash
# Автоматическое обновление
bash /opt/snapcheck/scripts/update.sh
```

### Резервная копия

```bash
# Создать резервную копию
bash /opt/snapcheck/scripts/backup.sh

# Восстановить
tar -xzf /opt/snapcheck/data/backups/snapcheck.db.*.backup -C /
```

### Мониторинг

```bash
# Проверка здоровья
bash /opt/snapcheck/scripts/health-check.sh

# Логи
tail -f /opt/snapcheck/logs/backend/backend.log
tail -f /opt/snapcheck/logs/nginx/access.log
```

---

## 🔍 Содержимое каждого компонента

### 📁 Dockerfile.backend

```dockerfile
FROM python:3.9-slim
# - Установка зависимостей
# - Копирование FastAPI приложения
# - Health check
# - Запуск на порту 8000
```

### 📁 Dockerfile.frontend

```dockerfile
FROM node:18-alpine as builder
# - Сборка React приложения
# - Оптимизация для production
# - Nginx для serve статических файлов
# - Health check
```

### 📁 docker-compose.prod.yml

```yaml
services:
  backend:    # FastAPI на :8000
  frontend:   # Nginx на :3000
networks:
  snapcheck-network
volumes:
  db_data:    # SQLite БД
  uploads_data: # Загруженные файлы
```

### 📁 install.sh

Полностью автоматизированная установка:

```bash
✓ Обновление системы
✓ Установка Docker
✓ Установка Docker Compose
✓ Создание пользователя
✓ Создание директорий
✓ Запуск контейнеров
✓ Проверка здоровья
```

---

## 🆘 Troubleshooting

| Проблема | Решение |
|----------|---------|
| Приложение не запускается | `docker-compose logs -f backend` |
| Порты заняты | `sudo netstat -tlnp \| grep LISTEN` |
| Нет доступа к файлам | `sudo chown -R snapcheck:snapcheck /opt/snapcheck/` |
| Забыли пароль | Пересоздать пользователя в БД |
| Нужно обновить | `bash /opt/snapcheck/scripts/update.sh` |

---

## 📈 Масштабирование

### Для 10-50 пользователей (текущая конфигурация)
- 2 GB RAM достаточно
- 2 CPU ядра
- SQLite БД работает хорошо

### Для 50-500 пользователей
- Увеличить до 4-8 GB RAM
- Увеличить workers: `WORKERS=8`
- Рассмотреть PostgreSQL

### Для 500+ пользователей
- Использовать PostgreSQL
- Кэширование Redis
- CDN для статики
- Load balancer (Nginx/HAProxy)
- Несколько инстансов backend

---

## 🔐 Security Checklist

- [ ] Изменить SECRET_KEY
- [ ] Включить HTTPS/SSL
- [ ] Настроить firewall
- [ ] Включить регулярные резервные копии
- [ ] Обновлять зависимости
- [ ] Мониторить логи
- [ ] Удалить debug режим
- [ ] Использовать strong пароли

---

## 📞 Support & Documentation

| Тема | Документ |
|------|----------|
| Быстрый старт | QUICK_START.md |
| Production deployment | PRODUCTION_DEPLOY.md |
| API документация | /admin/docs (Swagger) |
| Пользовательские гайды | USER_GUIDE_*.md |
| Логи и мониторинг | PRODUCTION_DEPLOY.md → Мониторинг |

---

## 📋 Чек-лист перед deployment

### Подготовка

- [ ] Выбран сервер (Ubuntu 20.04+)
- [ ] SSH доступ настроен
- [ ] Domain зарегистрирован
- [ ] Код приложения готов

### Установка

- [ ] Запущен `install.sh`
- [ ] Контейнеры запущены
- [ ] Backend отвечает на `/health`
- [ ] Frontend доступен

### Конфигурация

- [ ] Домен привязан
- [ ] SSL сертификат установлен
- [ ] Резервное копирование настроено
- [ ] Мониторинг включен

### Безопасность

- [ ] Firewall включен
- [ ] Secret key изменён
- [ ] Пароли сложные
- [ ] Debug mode отключен

### Мониторинг

- [ ] Логи настроены
- [ ] Health checks работают
- [ ] Alerts настроены
- [ ] Backup schedule установлен

---

## 🎓 Дополнительные материалы

### Полезные ссылки

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- Nginx: https://nginx.org/

### Системы мониторинга

- Prometheus + Grafana (рекомендуется)
- ELK Stack (для логов)
- DataDog (облачное решение)
- New Relic (облачное решение)

### Хостинги для deployment

- DigitalOcean
- Linode
- Hetzner
- AWS
- Яндекс.Облако

---

## 🎉 Готово!

Ваше приложение полностью готово к production deployment!

**Next Steps:**

1. Выбрать хостинг
2. Запустить `install.sh`
3. Настроить домен
4. Установить SSL
5. Начать использовать

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: October 18, 2025
