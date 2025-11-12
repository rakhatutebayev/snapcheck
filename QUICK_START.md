# 🚀 Quick Start - Production Deployment

## Быстрая установка на Ubuntu за 5 минут

### 📋 Требования

- Ubuntu 20.04+ или любой Linux с Docker
- 2+ GB RAM
- 10+ GB диска
- SSH доступ

### ⚡ Установка в 4 шага

#### Шаг 1: Загрузить скрипт установки

```bash
sudo bash install.sh
```

#### Шаг 2: Скопировать код приложения

```bash
# На вашей машине
scp -r /path/to/snapcheck root@your-server:/opt/snapcheck/app

# Или на сервере
cd /opt/snapcheck/app
git clone https://github.com/yourrepo/snapcheck .
```

#### Шаг 3: Запустить приложение

```bash
# Скрипт установки уже запустит приложение
# Проверить статус:
cd /opt/snapcheck/app
docker-compose -f docker-compose.prod.yml ps
```

#### Шаг 4: Открыть в браузере

```
http://your-server:3000
```

### 📊 Что получилось

```
✓ Backend работает на :8000
✓ Frontend работает на :3000
✓ SQLite БД в: /opt/snapcheck/data/db/
✓ Загруженные файлы в: /opt/snapcheck/data/uploads/
✓ Логи в: /opt/snapcheck/logs/
```

### 🔧 Полезные команды

```bash
cd /opt/snapcheck/app

# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи приложения
docker-compose -f docker-compose.prod.yml logs -f

# Логи backend только
docker-compose -f docker-compose.prod.yml logs -f backend

# Остановить приложение
docker-compose -f docker-compose.prod.yml down

# Перезагрузить
docker-compose -f docker-compose.prod.yml restart

# Удалить всё (внимание!)
docker-compose -f docker-compose.prod.yml down -v
```

### 🌐 Настройка домена и HTTPS

#### Вариант 1: Nginx + Let's Encrypt

```bash
# Установка Nginx
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Получить сертификат
sudo certbot certonly --standalone -d yourdomain.com

# Настроить Nginx (смотри PRODUCTION_DEPLOY.md)
sudo nano /etc/nginx/sites-enabled/snapcheck.conf

# Перезагрузить Nginx
sudo systemctl restart nginx
```

#### Вариант 2: Traefik (проще)

Добавить в `docker-compose.prod.yml`:

```yaml
traefik:
  image: traefik:latest
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ./traefik.yml:/traefik.yml
  labels:
    - "traefik.enable=true"

frontend:
  labels:
    - "traefik.http.routers.snapcheck.rule=Host(`yourdomain.com`)"
    - "traefik.http.services.snapcheck.loadbalancer.server.port=80"
```

### 📊 Мониторинг

```bash
# Проверить здоровье приложения
curl http://localhost:8000/health

# Статус Docker
docker stats

# Использование диска
du -sh /opt/snapcheck

# Список запущенных контейнеров
docker ps
```

### 💾 Резервная копия

```bash
# Создать резервную копию
tar -czf snapcheck-backup-$(date +%Y%m%d).tar.gz /opt/snapcheck/data/

# Восстановить
tar -xzf snapcheck-backup-*.tar.gz -C /

# Автоматическое резервное копирование
# Добавить в crontab
0 2 * * * tar -czf /opt/snapcheck/data/backups/backup-$(date +\%Y\%m\%d).tar.gz /opt/snapcheck/data/
```

### 🆘 Решение проблем

#### Приложение не запускается

```bash
# Посмотреть ошибки
docker-compose logs backend
docker-compose logs frontend

# Перестроить образы
docker-compose build --no-cache

# Перезапустить
docker-compose restart
```

#### Проблемы с портами

```bash
# Проверить занятые порты
sudo netstat -tlnp | grep LISTEN

# Изменить порты в docker-compose.prod.yml
# ports:
#   - "8080:8000"  # backend на 8080 вместо 8000
#   - "3001:80"    # frontend на 3001 вместо 3000
```

#### Нет доступа к файлам

```bash
# Проверить права доступа
ls -la /opt/snapcheck/data/

# Исправить права
sudo chown -R snapcheck:snapcheck /opt/snapcheck/
```

### 📈 Масштабирование

Для большого количества пользователей:

```yaml
# Увеличить workers в docker-compose.prod.yml
environment:
  - WORKERS=8  # Было 4
  - DATABASE_URL=postgresql://...  # Использовать PostgreSQL вместо SQLite
```

### 🔐 Безопасность

```bash
# Включить firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Обновить систему
sudo apt-get update && sudo apt-get upgrade -y

# Регулярное резервное копирование
0 2 * * * bash /opt/snapcheck/scripts/backup.sh
```

### 📱 Мобильный доступ

Приложение полностью адаптивно и работает на мобильных устройствах через HTTPS.

### 💰 Стоимость

| Компонент | Стоимость |
|-----------|-----------|
| VPS (2GB) | $5-12/мес |
| Домен | $10-15/год |
| SSL сертификат | Бесплатно (Let's Encrypt) |
| **Итого** | **~$0.5-1/день** |

### ✅ Чек-лист

- [ ] Ubuntu сервер готов
- [ ] Docker установлен
- [ ] Код приложения скопирован
- [ ] `install.sh` запущен
- [ ] Приложение работает (http://server:3000)
- [ ] Домен настроен
- [ ] SSL сертификат установлен
- [ ] Резервное копирование настроено
- [ ] Мониторинг настроен

### 📞 Поддержка

Если что-то не работает:

1. Посмотреть логи: `docker-compose logs -f`
2. Проверить здоровье: `curl http://localhost:8000/health`
3. Перезагрузить: `docker-compose restart`
4. Полный restart: `docker-compose down && docker-compose up -d`

---

**Готово!** Ваше приложение на production! 🎉
