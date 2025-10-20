# 🚀 DOCKER НА UBUNTU - ВСЕ ЧТО НУЖНО

## 📌 ОДНА КОМАНДА ДЛЯ УСТАНОВКИ

```bash
# На вашем Ubuntu сервере выполнить:

ssh root@YOUR_SERVER_IP

# Затем скопировать и выполнить:

curl -fsSL https://get.docker.com -o get-docker.sh && \
sudo sh get-docker.sh && \
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
sudo chmod +x /usr/local/bin/docker-compose && \
sudo mkdir -p /opt/slideconfirm && \
cd /opt/slideconfirm && \
sudo git clone https://github.com/YOUR_USERNAME/slideconfirm.git . 2>/dev/null || sudo git pull && \
sudo mkdir -p data/db data/uploads logs/backend logs/nginx && \
echo "✅ Docker готов! Теперь выполните:" && \
echo "cd /opt/slideconfirm && sudo nano .env"
```

---

## 📋 ПОШАГОВО (САМЫЙ БЫСТРЫЙ СПОСОБ)

### Шаг 1: Подключиться к серверу
```bash
ssh root@YOUR_SERVER_IP
```

### Шаг 2: Скопировать этот скрипт и запустить
```bash
sudo bash -c 'cat > /tmp/install-docker.sh << '\''EOF'\''
#!/bin/bash
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
mkdir -p /opt/slideconfirm/data/db /opt/slideconfirm/data/uploads /opt/slideconfirm/logs
echo "✅ Docker установлен!"
EOF
bash /tmp/install-docker.sh'
```

### Шаг 3: Загрузить проект
```bash
cd /opt/slideconfirm
git clone https://github.com/YOUR_USERNAME/slideconfirm.git . 2>/dev/null || git pull
```

### Шаг 4: Создать .env
```bash
sudo cat > .env << 'EOF'
SECRET_KEY=your-generated-key-64-chars
DATABASE_URL=postgresql://slideconfirm:password@db:5432/slideconfirm
VITE_API_URL=https://api.your-domain.com
ENVIRONMENT=production
DB_PASSWORD=password
EOF

# Отредактировать пароли
sudo nano .env
```

### Шаг 5: Запустить Docker
```bash
sudo docker-compose -f docker-compose.prod.yml up -d
```

### Шаг 6: Проверить
```bash
sudo docker ps
sudo docker-compose logs -f backend
```

---

## 🎯 ТРИ ФАЙЛА КОТОРЫЕ ВЫ СОЗДАЛИ

| Файл | Для чего | На Mac | На Ubuntu |
|------|----------|--------|-----------|
| `DOCKER_INSTALLATION_GUIDE.md` | Подробное руководство | ✅ Используй | - |
| `DOCKER_UBUNTU_INSTALLATION.md` | Подробное руководство | - | ✅ Используй |
| `DOCKER_UBUNTU_QUICK_REFERENCE.md` | Шпаргалка команд | - | ✅ Используй |

---

## 💡 БЫСТРЫЕ КОМАНДЫ

```bash
# Все статус контейнеров
docker ps -a

# Логи backend
docker-compose logs -f backend

# Перезагрузить
docker-compose restart

# Остановить
docker-compose stop

# Удалить (осторожно!)
docker-compose down -v
```

---

## ✅ ГОТОВО!

Ваш SlideConfirm развернут на Docker! 🎉
