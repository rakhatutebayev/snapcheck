# OAuth2 Setup Guide

## Настройка email уведомлений с OAuth2

Система поддерживает три способа отправки email:
1. **SMTP** - обычный SMTP (проще всего для начала)
2. **Office 365** - через Microsoft Graph API
3. **Google** - через Gmail API

---

## 🔧 SMTP (рекомендуется для быстрого старта)

**Самый простой способ** - использовать обычный SMTP:

### Gmail SMTP
```
Provider: SMTP
SMTP Host: smtp.gmail.com
SMTP Port: 587
Username: your-email@gmail.com
Password: [App Password - см. ниже]
Use TLS: ✓
From Email: your-email@gmail.com
From Name: SnapCheck System
```

**Важно для Gmail:**
1. Включите 2FA в аккаунте Google
2. Создайте App Password:
   - Откройте https://myaccount.google.com/apppasswords
   - Выберите "Mail" и устройство
   - Скопируйте 16-значный пароль
   - Используйте его вместо обычного пароля

### Яндекс SMTP
```
SMTP Host: smtp.yandex.ru
SMTP Port: 465 (или 587)
Username: your-email@yandex.ru
Password: [ваш пароль]
Use TLS: ✓
```

### Mail.ru SMTP
```
SMTP Host: smtp.mail.ru
SMTP Port: 465 (или 587)
Username: your-email@mail.ru
Password: [ваш пароль]
Use TLS: ✓
```

---

## 🏢 Office 365 / Microsoft 365 (для корпоративных аккаунтов)

### Шаг 1: Создание приложения в Azure

1. **Откройте Azure Portal**
   - Перейдите на https://portal.azure.com
   - Войдите с корпоративным Microsoft аккаунтом

2. **Зарегистрируйте приложение**
   - Перейдите в **Azure Active Directory** → **App registrations**
   - Нажмите **+ New registration**
   - Укажите:
     ```
     Name: SnapCheck Email Notifications
     Supported account types: Accounts in this organizational directory only
     Redirect URI: Web → http://localhost:5173/admin/email/callback
     ```
   - Нажмите **Register**

3. **Скопируйте Client ID**
   - На странице приложения найдите **Application (client) ID**
   - Скопируйте его - это ваш **Client ID**

4. **Создайте Client Secret**
   - Перейдите в **Certificates & secrets**
   - Нажмите **+ New client secret**
   - Укажите:
     ```
     Description: SnapCheck Email Secret
     Expires: 24 months (или выберите нужный срок)
     ```
   - Нажмите **Add**
   - **ВАЖНО:** Скопируйте **Value** (не ID!) - это ваш **Client Secret**
   - Сохраните его сразу, потом не увидите!

5. **Настройте API permissions**
   - Перейдите в **API permissions**
   - Нажмите **+ Add a permission**
   - Выберите **Microsoft Graph**
   - Выберите **Delegated permissions**
   - Найдите и добавьте:
     - ✓ `Mail.Send`
     - ✓ `offline_access`
   - Нажмите **Grant admin consent** (требуются права администратора)

6. **Добавьте Redirect URI для production**
   - В **Authentication** → **Platform configurations** → **Web**
   - Добавьте URL вашего production сервера:
     ```
     https://your-domain.com/admin/email/callback
     ```

### Шаг 2: Использование в SnapCheck

В админ панели SnapCheck:
```
Provider: Office 365
Client ID: [Application (client) ID из шага 3]
Client Secret: [Value из шага 4]
From Email: your-work-email@company.com
```

Нажмите **"Авторизовать через Microsoft"** и войдите в ваш Microsoft аккаунт.

---

## 🔍 Google Gmail API (для Gmail аккаунтов)

### Шаг 1: Создание проекта в Google Cloud

1. **Откройте Google Cloud Console**
   - Перейдите на https://console.cloud.google.com
   - Войдите с Google аккаунтом

2. **Создайте новый проект**
   - Нажмите на выпадающий список проектов (вверху)
   - Нажмите **New Project**
   - Укажите:
     ```
     Project name: SnapCheck Email
     Location: No organization (или вашу организацию)
     ```
   - Нажмите **Create**

3. **Включите Gmail API**
   - Перейдите в **APIs & Services** → **Library**
   - Найдите **Gmail API**
   - Нажмите **Enable**

4. **Создайте OAuth consent screen**
   - Перейдите в **APIs & Services** → **OAuth consent screen**
   - Выберите **External** (или Internal для Workspace)
   - Нажмите **Create**
   - Заполните:
     ```
     App name: SnapCheck Email Notifications
     User support email: your-email@gmail.com
     Developer contact: your-email@gmail.com
     ```
   - Нажмите **Save and Continue**
   - На странице **Scopes** нажмите **Add or Remove Scopes**
   - Найдите и добавьте:
     - ✓ `https://www.googleapis.com/auth/gmail.send`
   - Нажмите **Save and Continue**
   - Добавьте тестовых пользователей (свой email)
   - Нажмите **Save and Continue**

5. **Создайте OAuth Client**
   - Перейдите в **APIs & Services** → **Credentials**
   - Нажмите **+ Create Credentials** → **OAuth client ID**
   - Выберите **Web application**
   - Укажите:
     ```
     Name: SnapCheck Web Client
     Authorized JavaScript origins:
       - http://localhost:5173
       - https://your-domain.com (для production)
     
     Authorized redirect URIs:
       - http://localhost:5173/admin/email/callback
       - https://your-domain.com/admin/email/callback (для production)
     ```
   - Нажмите **Create**

6. **Скопируйте credentials**
   - Появится окно с **Client ID** и **Client secret**
   - Скопируйте оба значения

### Шаг 2: Использование в SnapCheck

В админ панели SnapCheck:
```
Provider: Google
Client ID: [Client ID из шага 6]
Client Secret: [Client secret из шага 6]
From Email: your-email@gmail.com
```

Нажмите **"Авторизовать через Google"** и войдите в ваш Gmail аккаунт.

---

## 📝 Настройка получателей уведомлений

После настройки провайдера:

1. **Добавьте email получателей**
   - Укажите email адреса администраторов, которые должны получать уведомления
   - Можно добавить несколько адресов
   - Пример: `admin1@company.com`, `admin2@company.com`

2. **Включите типы уведомлений**
   - ✓ Уведомлять о регистрации новых пользователей
   - ✓ Уведомлять о завершении презентаций

3. **Сохраните настройки**

4. **Отправьте тестовое письмо**
   - Укажите email для теста
   - Нажмите "✉️ Отправить"
   - Проверьте почту (в т.ч. спам)

---

## 🚀 Рекомендации

### Для разработки
- Используйте **SMTP с Gmail App Password** - проще всего
- Не нужно настраивать OAuth приложения

### Для production
- **Office 365** - если у вас корпоративный Microsoft 365
- **Google** - если используете Gmail для бизнеса
- **SMTP** - универсальный вариант для любого провайдера

### Безопасность
- ⚠️ **НИКОГДА** не коммитьте Client Secret в git!
- ⚠️ Используйте переменные окружения для production
- ⚠️ Регулярно обновляйте Client Secrets
- ⚠️ Для Gmail используйте App Password, не основной пароль

---

## 🐛 Troubleshooting

### SMTP ошибки
```
❌ [Errno 61] Connection refused
→ Проверьте SMTP host и port
→ Попробуйте port 465 вместо 587

❌ Authentication failed
→ Для Gmail используйте App Password
→ Включите "Less secure apps" (не рекомендуется) или 2FA + App Password

❌ TLS handshake failed
→ Попробуйте отключить TLS или использовать port 465
```

### OAuth ошибки
```
❌ redirect_uri_mismatch
→ Убедитесь что redirect URI точно совпадает в Azure/Google и SnapCheck
→ http://localhost:5173/admin/email/callback (без слеша в конце!)

❌ invalid_client
→ Проверьте правильность Client ID и Client Secret
→ Проверьте что скопировали именно Value, а не ID секрета (для Microsoft)

❌ insufficient_permissions
→ Убедитесь что добавили Mail.Send permission (Office 365)
→ Убедитесь что добавили gmail.send scope (Google)
→ Нажмите "Grant admin consent" в Azure
```

### Email не приходят
```
✓ Проверьте папку спам
✓ Проверьте логи отправок в админ панели (Лог отправок)
✓ Попробуйте отправить тестовое письмо
✓ Проверьте что уведомления включены (галочки в настройках)
```

---

## 📞 Примеры для популярных провайдеров

### Gmail (SMTP - самый простой)
```
Provider: SMTP
Host: smtp.gmail.com
Port: 587
Username: myemail@gmail.com
Password: [App Password с https://myaccount.google.com/apppasswords]
TLS: ✓
```

### Яндекс
```
Provider: SMTP
Host: smtp.yandex.ru
Port: 587
Username: myemail@yandex.ru
Password: [ваш пароль]
TLS: ✓
```

### Mail.ru
```
Provider: SMTP
Host: smtp.mail.ru
Port: 587
Username: myemail@mail.ru
Password: [ваш пароль]
TLS: ✓
```

### Microsoft 365 (корпоративный)
```
Provider: Office 365
Client ID: [из Azure Portal]
Client Secret: [из Azure Portal]
From Email: myemail@company.com
```

### Mailgun (для отправки больших объемов)
```
Provider: SMTP
Host: smtp.mailgun.org
Port: 587
Username: [SMTP username из Mailgun]
Password: [SMTP password из Mailgun]
TLS: ✓
```

---

## ✅ Готово!

После настройки:
1. Зарегистрируйте нового пользователя → проверьте что пришло уведомление
2. Пройдите презентацию до конца → проверьте уведомление о завершении
3. Проверьте логи отправок в админ панели

Если возникли проблемы - проверьте Troubleshooting выше или логи в backend консоли.
