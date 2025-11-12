# 🚀 SFTP: Первый способ синхронизации VS Code ↔ Production Server

## ⚡ За 5 минут настраиваем автозагрузку кода на сервер

---

## Шаг 1️⃣: Установить расширение SFTP

### В VS Code:

1. Нажмите **Ctrl+Shift+X** (или нажмите иконку Extensions слева)
2. В поле поиска напишите: **SFTP**
3. Найдите: **"SFTP - Upload/Download"** (от Natizyskly)
4. Нажмите **Install** (зеленая кнопка)
5. Перезагрузите VS Code (нажмите **Reload** когда появится)

✅ Готово! Расширение установлено.

---

## Шаг 2️⃣: Создать файл конфигурации

### В VS Code:

1. Нажмите **Ctrl+Shift+P** (Command Palette)
2. Напишите: **SFTP: Config**
3. Нажмите Enter
4. Откроется файл `.vscode/sftp.json`

---

## Шаг 3️⃣: Заполнить конфигурацию

### Скопируйте и вставьте этот конфиг:

```json
{
  "name": "SnapCheck Production",
  "host": "YOUR_SERVER_IP",
  "port": 22,
  "username": "root",
  "password": "YOUR_SERVER_PASSWORD",
  "remotePath": "/opt/snapcheck/app",
  "uploadOnSave": true,
  "useTempFile": false,
  "openSsh": false,
  "ignore": [
    "**/.git",
    "**/.vscode",
    "**/node_modules",
    "**/__pycache__",
    "**/.env",
    "**/data",
    "**/logs",
    "**/.DS_Store"
  ]
}
```

### ⚠️ ВАЖНО: Замените на ваши данные:

- **YOUR_SERVER_IP** → IP адрес вашего сервера (например: `123.45.67.89`)
- **YOUR_SERVER_PASSWORD** → пароль от сервера

Например:
```json
{
  "name": "SnapCheck Production",
  "host": "138.201.154.92",
  "port": 22,
  "username": "root",
  "password": "mySecurePassword123",
  "remotePath": "/opt/snapcheck/app",
  ...
}
```

---

## Шаг 4️⃣: Сохранить конфиг

1. Нажмите **Ctrl+S** (сохранить)
2. В статус-баре должна появиться одна из надписей:
   - ✅ "SFTP: Connected" → всё работает!
   - ❌ "SFTP: Disconnected" → проблема с данными

---

## ✅ Если написало "Connected":

**Отлично! Всё работает! 🎉**

Теперь:
1. Отредактируйте любой файл в проекте
2. Нажмите **Ctrl+S** (сохранить)
3. Посмотрите статус-бар внизу
4. Должна появиться надпись: **"Uploading backend/admin.py..."**
5. Через 1-2 секунды готово!

Ваш файл автоматически загрузился на production сервер! ✨

---

## ❌ Если написало "Disconnected":

### Проблема #1: Неправильный IP или пароль

**Решение:**
1. Проверьте IP сервера (откуда получили?)
2. Проверьте пароль (правильный ли?)
3. Отредактируйте `.vscode/sftp.json`
4. Сохраните **Ctrl+S**

### Проблема #2: SSH порт закрыт или сервер не доступен

**Решение:**
```bash
# В терминале на вашем компьютере проверьте:
ssh root@YOUR_SERVER_IP

# Если работает - значит SSH открыт
# Если не работает - проблема с сервером
```

### Проблема #3: Путь `/opt/snapcheck/app` не существует

**Решение:**
```bash
# SSH на сервер
ssh root@YOUR_SERVER_IP

# Проверьте где находится приложение
ls -la /opt/snapcheck/app/

# Если там ничего нет - замените путь в sftp.json
```

---

## 🎯 Теперь каждый день работаете так:

### Workflow разработчика:

1. **Открываете файл** в VS Code (например `AdminPanel.jsx`)
2. **Делаете изменения** (добавляете функцию, исправляете баг)
3. **Нажимаете Ctrl+S** (сохранить)
4. ✅ **Автоматически:**
   - Файл сохраняется на компьютере
   - Загружается на production сервер
   - Обновляется через 1-2 секунды
5. **Открываете браузер** и обновляете страницу
6. **Видите изменения на production** 🎉

**Больше никаких SSH, SCP, вручную копировать файлы!**

---

## 📊 Что загружается, а что нет?

### ✅ ЗАГРУЖАЕТСЯ:
- Все файлы из папок: `backend/`, `frontend/src/`, `docs/`
- Конфиги: `.env`, `requirements.txt`, `docker-compose.prod.yml`
- Все текстовые файлы

### ❌ НЕ ЗАГРУЖАЕТСЯ (исключено в `ignore`):
- `node_modules/` (слишком большая папка)
- `.git/` (репозиторий)
- `__pycache__/` (Python кэш)
- `data/` (пользовательские файлы)
- `logs/` (логи)
- `.env` локальный

Это хорошо! Мы не загружаем ненужные большие папки.

---

## 💡 Полезные команды в VS Code

### Вручную загрузить файл:
1. Щелкните правой кнопкой на файл
2. Выберите **"Upload"**

### Вручную загрузить папку:
1. Щелкните правой кнопкой на папку
2. Выберите **"Upload Folder"**

### Синхронизировать всё:
1. **Ctrl+Shift+P** → **SFTP: Sync Local → Remote**
2. Загружаются все изменённые файлы

### Скачать файл с сервера (если кто-то там менял):
1. Щелкните правой кнопкой на файл
2. Выберите **"Download"**

---

## 🚨 ВАЖНЫЕ МОМЕНТЫ

### 1. Безопасность

⚠️ **Пароль в sftp.json - это не безопасно!**

**Лучше использовать SSH ключ:**

```json
{
  "name": "SnapCheck Production",
  "host": "YOUR_SERVER_IP",
  "port": 22,
  "username": "root",
  "privateKeyPath": "/Users/rakhat/.ssh/id_rsa",
  "remotePath": "/opt/snapcheck/app",
  "uploadOnSave": true,
  ...
}
```

Если хотите - смотрите раздел "SSH ключ" ниже.

### 2. Git конфликты

Если меняли файлы на сервере вручную (через SSH) и в VS Code одновременно:
- Может быть конфликт
- Обычно VS Code перезаписывает старый файл
- Всегда проверяйте логи сервера: `docker logs -f`

### 3. При изменении Docker требуется рестарт

Если меняете:
- `requirements.txt` (Python зависимости)
- `package.json` (Node зависимости)
- `docker-compose.prod.yml`

⚠️ Нужно перезагрузить контейнеры:

```bash
# На сервере:
ssh root@YOUR_SERVER_IP
cd /opt/snapcheck/app
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔐 БОНУС: SSH ключ вместо пароля (безопаснее)

### Создать SSH ключ:

```bash
# На вашем компьютере
ssh-keygen -t rsa -b 4096 -f ~/.ssh/snapcheck_key
```

Нажимайте Enter (без пароля).

Вывод:
```
Your public key has been saved in /Users/rakhat/.ssh/snapcheck_key.pub
```

### Добавить публичный ключ на сервер:

```bash
cat ~/.ssh/snapcheck_key.pub | ssh root@YOUR_SERVER_IP "cat >> ~/.ssh/authorized_keys"
```

### Обновить sftp.json:

```json
{
  "name": "SnapCheck Production",
  "host": "YOUR_SERVER_IP",
  "port": 22,
  "username": "root",
  "privateKeyPath": "/Users/rakhat/.ssh/snapcheck_key",
  "remotePath": "/opt/snapcheck/app",
  "uploadOnSave": true,
  ...
}
```

Теперь никаких паролей! 🔐

---

## ✅ Финальный чеклист

- [ ] Установил расширение SFTP
- [ ] Создал `.vscode/sftp.json`
- [ ] Заполнил IP и пароль
- [ ] Статус-бар показывает "Connected"
- [ ] Попробовал загрузить тестовый файл
- [ ] Файл появился на сервере
- [ ] Ctrl+S работает и загружает файлы автоматически
- [ ] Всё готово к разработке!

---

## 🎉 Готово!

Теперь вы можете:

✓ Редактировать код в VS Code  
✓ Нажать Ctrl+S  
✓ Файл автоматически загружается на production сервер  
✓ Обновить браузер  
✓ Видеть изменения на production  

**Это намного быстрее, чем SSH + SCP + Docker перезагрузка!**

Развивайтесь быстро! 🚀
