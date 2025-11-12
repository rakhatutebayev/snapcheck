# ❓ FAQ: Продакшен SnapCheck

## Самые частые вопросы

---

### ❓ Сколько стоит развернуть?

| Статья | Стоимость |
|--------|----------|
| Сервер DigitalOcean | $5/месяц |
| Домен (example.com) | ~$10/год |
| SSL (Let's Encrypt) | БЕСПЛАТНО |
| Бэкапы | БЕСПЛАТНО (встроено) |
| **Итого** | **~$5.83/месяц** |

**Это дешевле, чем кофе в месяц!** ☕

---

### ❓ На каком сервере лучше развернуть?

| Сервис | Плюсы | Минусы | Цена |
|--------|-------|--------|------|
| **DigitalOcean** | Просто, быстро, русский саппорт | Могут затосковать о деньгах | $5+ |
| **AWS** | Мощная, масштабируемая | Запутанный интерфейс | $0 (год бесплатно) |
| **Heroku** | Супер просто, один клик | Дорого за функции | $7+ |
| **VPS любой** | Полный контроль | Нужны навыки админа | $3-50 |
| **Свой сервер** | Один раз + вечно | Электричество, охлаждение | $50+ |

**Рекомендую:** DigitalOcean или AWS для начала.

---

### ❓ Как часто нужно обновлять?

- **Критичные баги**: Сразу же
- **Новые функции**: 1-2 раза в неделю
- **Security патчи**: Сразу же
- **UI улучшения**: Когда хочешь

**Время обновления:** 2-3 минуты (максимум)

```bash
# На сервере
cd /opt/SnapCheck
git pull origin main
docker-compose -f docker-compose.prod.yml restart
# Всё! Без downtime ✅
```

---

### ❓ Как делать бэкапы?

**Автоматический бэкап (рекомендуется):**

```bash
# На сервере создать скрипт /opt/SnapCheck/backup.sh
#!/bin/bash
cd /opt/SnapCheck
timestamp=$(date +%Y%m%d_%H%M%S)
tar czf backups/db_${timestamp}.tar.gz data/db/snapcheck.db data/uploads/
# Хранить 7 дней
find backups -name "db_*.tar.gz" -mtime +7 -delete

# Добавить в crontab (каждый день в 2:00 AM)
crontab -e
# 0 2 * * * /opt/SnapCheck/backup.sh
```

**Ручной бэкап:**

```bash
# Скопировать БД на локальный компьютер
scp -r root@YOUR_IP:/opt/SnapCheck/data/db ./backup-prod
```

---

### ❓ Как дать доступ другим админам?

```bash
# На сервере добавить SSH ключ
cat >> /root/.ssh/authorized_keys << 'EOF'
ssh-rsa AAAA... (публичный ключ админа)
EOF

# Или дать root пароль
passwd root
```

**Безопаснее через SSH ключи!**

---

### ❓ Что делать если сервер упал?

```bash
# SSH на сервер
ssh root@YOUR_IP

# Проверить Docker
docker-compose -f docker-compose.prod.yml ps

# Если контейнеры упали:
docker-compose -f docker-compose.prod.yml up -d

# Проверить логи
docker-compose -f docker-compose.prod.yml logs

# Если совсем плохо - перезагрузить сервер
sudo reboot
```

**Контейнеры имеют `restart: unless-stopped`, поэтому запустятся сами после перезагрузки!**

---

### ❓ Как смотреть кто что делает (логи)?

```bash
# Все логи
docker-compose -f docker-compose.prod.yml logs

# Только backend
docker-compose -f docker-compose.prod.yml logs backend

# Только последние 50 строк
docker-compose -f docker-compose.prod.yml logs --tail=50

# В реальном времени (follow)
docker-compose -f docker-compose.prod.yml logs -f backend

# Логи за последний час
docker-compose -f docker-compose.prod.yml logs --since 1h

# Сохранить логи в файл
docker-compose -f docker-compose.prod.yml logs > logs.txt
```

---

### ❓ Как увеличить производительность?

```bash
# 1. Увеличить количество worker'ов
# Отредактировать docker-compose.prod.yml:
WORKERS=8  # было 4

# 2. Добавить Redis кэширование
# (требует изменения кода backend'а)

# 3. Использовать более мощный сервер
# DigitalOcean: $5 → $12 → $24

# 4. Добавить CDN (CloudFlare бесплатно)
# - Распределяет трафик
# - Кэширует статику
# - Защищает от DDoS
```

---

### ❓ Как защитить от DDoS?

**Встроенное:**
- Nginx rate limiting
- Cloudflare (бесплатно)
- UFW firewall

```bash
# Включить firewall на сервере
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Premium:**
- Akamai
- AWS Shield
- Cloudflare Enterprise

**Для начала - Cloudflare бесплатной версии достаточно!**

---

### ❓ Как настроить SSL/HTTPS?

**Способ 1: Let's Encrypt (БЕСПЛАТНО)**

```bash
sudo apt install -y certbot

sudo certbot certonly --standalone -d example.com

# Отредактировать docker-nginx.conf с путями:
# /etc/letsencrypt/live/example.com/fullchain.pem
# /etc/letsencrypt/live/example.com/privkey.pem

# Обновлять автоматически:
sudo crontab -e
# 0 3 * * * certbot renew --quiet
```

**Способ 2: Cloudflare (еще проще)**

1. Добавить домен на Cloudflare
2. Выбрать Free Plan
3. Включить Full (strict) SSL
4. Домен будет работать с https://

---

### ❓ Как добавить поддержку мобильных устройств?

Мобильное приложение (Expo React Native):

```bash
# На компьютере
cd frontend-mobile
npm install
npm start

# На телефоне установи Expo Go
# Отсканируй QR код в терминале

# Приложение готово! 📱
```

---

### ❓ Базу данных как хранить безопаснее?

**Текущее:** SQLite (файл на диске)

**Проблемы:**
- ❌ Не защищена от сбоев диска
- ❌ Не масштабируется
- ❌ Медленнее на большие данные

**Решение:**

1. **PostgreSQL** (лучший выбор):
   ```bash
   # В docker-compose.prod.yml добавить сервис
   postgres:
     image: postgres:14
     environment:
       POSTGRES_DB: snapcheck
       POSTGRES_PASSWORD: secure-password
   ```

2. **MySQL** (альтернатива)

3. **Облачная БД** (AWS RDS, DigitalOcean Managed)

**Рекомендуемо после запуска >100 пользователей!**

---

### ❓ Как получать уведомления об ошибках?

**Email:**
```python
# backend/main.py добавить:
import smtplib
from email.mime.text import MIMEText

def send_error_notification(error_text):
    msg = MIMEText(error_text)
    msg['Subject'] = f'SnapCheck Error: {error_text[:50]}'
    # Отправить админу
```

**Sentry (рекомендуется):**
```python
import sentry_sdk
sentry_sdk.init("https://YOUR_KEY@sentry.io/PROJECT")

# Теперь все ошибки логируются автоматически
```

**Slack:**
```python
import requests

def notify_slack(message):
    requests.post('https://hooks.slack.com/...', json={'text': message})
```

---

### ❓ Как управлять пользователями?

**Через админ-панель:**
- http://YOUR_IP:3000/admin
- Email: admin@example.com
- Пароль: твой пароль

**Функции:**
- ✅ Добавить/удалить пользователей
- ✅ Загрузить презентации
- ✅ Смотреть отчеты
- ✅ Экспортировать в Excel

---

### ❓ Лицензия и открытый исходный код?

Добавить лицензию:

```bash
# В корень проекта
cp LICENSE.md ./
# (Выбрать лицензию: MIT, GPL, Commercial и т.д.)
```

---

### ❓ Что делать если всё сломалось?

```bash
# Шаг 1: Проверить логи
docker-compose -f docker-compose.prod.yml logs | tail -50

# Шаг 2: Перезагрузить контейнеры
docker-compose -f docker-compose.prod.yml restart

# Шаг 3: Если не помогло - пересобрать
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Шаг 4: Если совсем плохо - восстановить из бэкапа
docker-compose -f docker-compose.prod.yml down
cp backups/db_latest.tar.gz ./
tar xzf db_latest.tar.gz
docker-compose -f docker-compose.prod.yml up -d

# Шаг 5: Позвонить админу 📞 (это ты!)
```

---

## Нужна помощь?

- 📖 Документация: `PRODUCTION_INSTALL_GUIDE.md`
- ⚡ Быстрый старт: `QUICK_DEPLOY.md`
- 🐛 GitHub Issues: https://github.com/YOUR_REPO/issues
- 💬 Slack/Discord для поддержки

---

**Обновлено:** 19 октября 2025  
**Версия:** 1.0  
**Статус:** ✅ Проверено на Prod
