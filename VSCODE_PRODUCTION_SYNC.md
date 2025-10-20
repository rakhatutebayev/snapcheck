# 🚀 VS Code → Production Server: Автоматическая синхронизация

## Самый быстрый способ (SSH + Git)

### Шаг 1: Установить расширение VS Code

1. **Ctrl+Shift+X** (Extensions)
2. Поиск: `Remote - SSH`
3. Установить (от Microsoft)
4. Перезагрузить VS Code

---

## 📋 Способ 1: SFTP/SSH Deploy (РЕКОМЕНДУЕТСЯ)

### Установить расширение

1. **Ctrl+Shift+X** (Extensions)
2. Поиск: `SFTP`
3. Установить `SFTP - Upload/Download` (Natizyskly)

### Создать конфиг

1. **Ctrl+Shift+P** (Command Palette)
2. Напишите: `SFTP: Config`
3. Enter → откроется файл `.vscode/sftp.json`

### Заполнить конфиг

```json
{
  "name": "Production Server",
  "host": "YOUR_SERVER_IP",
  "port": 22,
  "username": "root",
  "password": "YOUR_PASSWORD",
  "remotePath": "/opt/slideconfirm/app",
  "uploadOnSave": true,
  "downloadOnOpen": false,
  "ignore": [
    "node_modules",
    ".vscode",
    ".git",
    "**/__pycache__",
    ".env"
  ]
}
```

### Объяснение параметров:

```
host          - IP адрес вашего сервера (например: 123.45.67.89)
port          - SSH порт (обычно 22)
username      - пользователь на сервере (root или slideconfirm)
password      - пароль от сервера
remotePath    - путь на сервере (где лежит приложение)
uploadOnSave  - автоматически загружать при сохранении файла
ignore        - какие папки не загружать
```

### Готово!

- Теперь при каждом **Ctrl+S** (сохранение) файл автоматически загружается на сервер
- Можете видеть статус в статус-баре VS Code

---

## 🔄 Способ 2: Git Deployment (ДЛЯ ПРОДВИНУТЫХ)

### Как работает:

1. Вы push'ите код на GitHub
2. На сервере настроены Git Webhooks
3. При push'е сервер автоматически pull'ит новый код
4. Автоматически перезагружает контейнеры Docker

### Шаг 1: На сервере создать Post-Receive Hook

SSH в сервер:
```bash
ssh root@YOUR_SERVER_IP
```

Создать скрипт:
```bash
nano /opt/slideconfirm/app/.git/hooks/post-receive
```

Вставить:
```bash
#!/bin/bash
cd /opt/slideconfirm/app
git reset --hard HEAD
cd /opt/slideconfirm/app
docker-compose -f docker-compose.prod.yml restart
echo "✅ Production updated from git push!"
```

Сделать исполняемым:
```bash
chmod +x /opt/slideconfirm/app/.git/hooks/post-receive
exit
```

### Шаг 2: В VS Code просто push'ьте

```
Ctrl+Shift+G → напишите сообщение → Ctrl+Enter → ↑ push
```

Сервер автоматически обновится! ✅

---

## 🐳 Способ 3: Docker Deploy с GitHub Actions (САМЫЙ АВТОМАТИЧЕСКИЙ)

### Как работает:

1. Вы push'ите на GitHub
2. GitHub Actions автоматически запускает CI/CD
3. Actions rebuild'ит Docker образы
4. Deploy'ит на сервер
5. Перезагружает контейнеры

### Создать файл GitHub Actions

В VS Code создайте новую папку:
```
.github/workflows/
```

Создайте файл:
```
.github/workflows/deploy.yml
```

Вставьте:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/slideconfirm/app
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up -d
            echo "✅ Deployment complete!"
```

### Добавить Secrets в GitHub

1. Откройте: https://github.com/YOUR_USERNAME/SlideConfirm/settings/secrets/actions
2. Добавьте:
   - **SERVER_IP**: IP адрес сервера
   - **SERVER_USER**: username (root)
   - **SERVER_SSH_KEY**: ваш SSH приватный ключ

### Готово!

Каждый раз при push'е на main branch:
- ✅ GitHub Actions запустится
- ✅ Код обновится на сервере
- ✅ Docker перезагрузится
- ✅ Production обновится автоматически

---

## 🔑 SSH Ключ (для безопасности вместо пароля)

### Создать SSH ключ на вашем компьютере

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/slideconfirm_key
```

Нажимайте Enter (без пароля)

Вывод:
```
Generating public/private rsa key pair.
Your identification has been saved in /Users/rakhat/.ssh/slideconfirm_key
Your public key has been saved in /Users/rakhat/.ssh/slideconfirm_key.pub
```

### Скопировать публичный ключ на сервер

```bash
cat ~/.ssh/slideconfirm_key.pub | ssh root@YOUR_SERVER_IP "cat >> ~/.ssh/authorized_keys"
```

### Использовать в VS Code

Вместо `password` в sftp.json:
```json
{
  "privateKeyPath": "/Users/rakhat/.ssh/slideconfirm_key",
  "password": "",
  ...
}
```

Теперь SSH без пароля! 🔐

---

## 📝 ПОЛНЫЙ ПРИМЕР: Все вместе

### .vscode/sftp.json (с SSH ключом)

```json
{
  "name": "Production Server",
  "host": "123.45.67.89",
  "port": 22,
  "username": "root",
  "privateKeyPath": "/Users/rakhat/.ssh/slideconfirm_key",
  "remotePath": "/opt/slideconfirm/app",
  "uploadOnSave": true,
  "useTempFile": false,
  "openSsh": false,
  "ignore": [
    "**/.git/**",
    "**/.vscode/**",
    "**/node_modules/**",
    "**/__pycache__/**",
    "**/.env",
    "**/data/**",
    "**/logs/**",
    "**/.DS_Store"
  ],
  "syncMode": "update",
  "watcher": {
    "files": "src/**/*.{js,jsx,py,css}",
    "autoUpload": true,
    "autoDelete": false
  }
}
```

---

## ✨ Горячие клавиши SFTP

| Действие | Клавиши |
|----------|---------|
| Синхронизировать | `Ctrl+Shift+P` → `SFTP: Sync` |
| Загрузить файл | `Ctrl+Shift+P` → `SFTP: Upload` |
| Загрузить папку | Правый клик → Upload |
| Скачать файл | Правый клик → Download |

---

## 🚀 Workflow: День в жизни разработчика

### С SFTP:

1. Открыли VS Code
2. Отредактировали файл `AdminPanel.jsx`
3. Нажали **Ctrl+S** (сохранить)
4. ✅ Файл автоматически загрузился на сервер
5. Открыли браузер, обновили страницу
6. Видите изменения на production! 🎉

### С GitHub Actions:

1. Открыли VS Code
2. Отредактировали несколько файлов
3. Коммитили: `Ctrl+Shift+G` → сообщение → `Ctrl+Enter`
4. Push'или: стрелка вверх
5. ✅ GitHub Actions запустилась автоматически
6. Сервер обновился через 1-2 минуты
7. Production запустился автоматически 🎉

---

## ⚙️ Что обновляется автоматически?

### Только код:
- `backend/` файлы
- `frontend/src/` файлы
- Конфиги

### Автоматический перезапуск Docker:
- Backend: `docker-compose restart backend`
- Frontend: `docker-compose restart frontend`

### НЕ обновляются:
- `node_modules/` (нужно npm install)
- `__pycache__/` (игнорируется)
- `data/uploads/` (пользовательские файлы)
- `requirements.txt` (нужен pip install)

Если меняете requirements.txt или package.json - нужен полный restart!

---

## 🆘 Если что-то не работает

### SFTP не подключается

```bash
# Проверить SSH доступ вручную
ssh -i ~/.ssh/slideconfirm_key root@YOUR_SERVER_IP

# Если не работает - проверить ключ
ssh-keygen -y -f ~/.ssh/slideconfirm_key
```

### GitHub Actions не запускается

1. Проверьте `SERVER_SSH_KEY` в Secrets
2. Убедитесь что ключ в формате:
   ```bash
   cat ~/.ssh/slideconfirm_key | base64
   ```
   Вставить значение в GitHub Secrets

### Контейнеры не перезагружаются

Проверьте на сервере:
```bash
docker-compose -f /opt/slideconfirm/app/docker-compose.prod.yml logs -f
```

---

## 📊 Сравнение методов

| Метод | Скорость | Сложность | Автоматизм |
|-------|----------|-----------|-----------|
| SFTP | Быстро (1-2 сек) | Средняя | Средний |
| Git Webhooks | 5-10 сек | Высокая | Высокий |
| GitHub Actions | 1-2 минуты | Средняя | Очень высокий |

---

## 🎯 Рекомендация

**Для быстрого desenvolvimento:**
- Используйте **SFTP** с `uploadOnSave`
- Изменения видны через 1-2 секунды

**Для production:**
- Используйте **GitHub Actions**
- Всё автоматическое, через Git

**Комбинированный подход:**
- SFTP для быстрого тестирования
- Git/Actions для production

---

## ✅ Чеклист настройки

### Для SFTP:

- [ ] Установить расширение SFTP
- [ ] Создать `.vscode/sftp.json`
- [ ] Добавить IP сервера
- [ ] Добавить username и пароль (или SSH ключ)
- [ ] Проверить `remotePath` на сервере
- [ ] Попробовать загрузить файл

### Для GitHub Actions:

- [ ] Создать папку `.github/workflows/`
- [ ] Создать файл `deploy.yml`
- [ ] Добавить Secrets в GitHub (SERVER_IP, etc.)
- [ ] Push'ить на GitHub
- [ ] Проверить Actions на GitHub

---

## 🎉 Готово!

Выберите подходящий метод и настройте в VS Code:

1. **SFTP** - для быстрой разработки
2. **GitHub Actions** - для production
3. **Оба** - для профессиональной работы

Теперь вы можете разрабатывать локально, а production обновляется автоматически! 🚀
