# 🔐 SECURITY HARDENING - ПОЛНЫЙ СПИСОК ТРЕБОВАНИЙ

## ✅ ЧТО НУЖНО ПРИМЕНИТЬ

### 1️⃣ BACKEND БЕЗОПАСНОСТЬ (Python/FastAPI)

#### A. Аутентификация и авторизация

```
✅ JWT токены (уже есть)
   - Добавить: Refresh tokens (долгоживущие)
   - Добавить: Blacklist отозванных токенов
   - Добавить: Expiration time (30 мин для access, 7 дней для refresh)
   - Добавить: Token rotation (новый токен при каждом запросе)

✅ Пароли
   - Минимум 12 символов (сейчас может быть меньше?)
   - Требуется: ЗАГЛАВНЫЕ + строчные + цифры + спецсимволы
   - Хеширование: bcrypt с 12+ rounds (не MD5, не SHA1!)
   - Rate limiting на логин (5 попыток за 15 минут)
   - Двухфакторная аутентификация (2FA) - опционально, но хорошо

✅ Сессии
   - HttpOnly cookies для токенов (не localStorage!)
   - Secure flag (только HTTPS)
   - SameSite=Strict (защита от CSRF)
   - CORS только для доверенных доменов
```

#### B. Данные

```
✅ Шифрование в покое
   - Зашифровать чувствительные данные в БД (пароли уже хешируются?)
   - Использовать: AES-256 для конфиденциальных данных
   - Ключи хранить в .env (не в коде!)

✅ Шифрование в пути (TLS/SSL)
   - Обязательно HTTPS (не HTTP!)
   - TLS 1.2+ (не старые версии)
   - Сертификат Let's Encrypt (бесплатный, автообновляется)
   - Редирект со 301 redirect с HTTP на HTTPS

✅ Валидация данных
   - Pydantic валидация (уже есть?)
   - Input sanitization (удалять спецсимволы)
   - SQL injection защита (использовать ORM, параметризованные запросы)
   - XSS защита (экранировать HTML спецсимволы)
```

#### C. API безопасность

```
✅ Rate limiting
   - Максимум 100 запросов в минуту на юзера
   - Максимум 1000 запросов в час на IP адрес
   - Заблокировать при превышении на 15 минут

✅ CORS (Cross-Origin Resource Sharing)
   - Список доверенных доменов (не "*")
   - Включить только необходимые headers
   - Отключить для чувствительных endpoints

✅ Input validation
   - Максимальный размер request (5MB)
   - Максимальная длина string полей
   - Enum для категорий (не свободный текст)
   - Email validation + SMS verification

✅ Output encoding
   - JSON эскейпинг
   - Не возвращать sensitive информацию в ошибках
   - Не показывать stack traces клиенту
```

#### D. Логирование и мониторинг

```
✅ Логирование
   - Все попытки логина (успешные и неудачные)
   - Все изменения данных
   - Все API ошибки
   - Все попытки несанкционированного доступа
   - Хранить логи минимум 90 дней

✅ Мониторинг
   - Алерт на множественные неудачные логины
   - Алерт на подозрительную активность
   - Алерт на DDoS атаки
   - Алерт на SQL injection попытки
```

#### E. Экземпляр и окружение

```
✅ .env файл
   - НЕ коммитить .env в Git
   - Использовать .env.example с примерами
   - Все секреты в .env (не в коде)
   - Разные переменные для dev/prod

✅ Secret management
   - Использовать vault или managed secrets
   - Ротировать ключи каждые 90 дней
   - Никогда не логировать секреты
   - Использовать разные ключи для разных сервисов

✅ Permissions
   - Файлы: 644 (для конфигов), 755 (для папок)
   - Базе данных: только необходимые permissions
   - ОС: запускать приложение от non-root юзера
```

---

### 2️⃣ FRONTEND БЕЗОПАСНОСТЬ (React/Vite)

#### A. Защита от атак

```
✅ XSS (Cross-Site Scripting)
   - Использовать React (он автоматически экранирует)
   - dangerouslySetInnerHTML - избегать
   - Санитизировать user input перед отображением
   - Content Security Policy (CSP) header

✅ CSRF (Cross-Site Request Forgery)
   - CSRF токены для POST/PUT/DELETE запросов
   - SameSite=Strict для cookies
   - Проверка Origin header

✅ Clickjacking
   - X-Frame-Options: DENY (не встраивать в iframe)
   - Content-Security-Policy: frame-ancestors 'none'

✅ Man-in-the-Middle
   - Только HTTPS (не HTTP)
   - HSTS header (минимум 1 год)
   - SSL pinning (для мобильных)
```

#### B. Данные на клиенте

```
✅ Хранилище
   - НЕ хранить пароли нигде (ни в localStorage, ни в cookies)
   - JWT токены: в sessionStorage или HttpOnly cookies (НЕ localStorage!)
   - Sensitive data: шифровать перед сохранением
   - Очищать данные при логауте

✅ Кэширование
   - Cache-Control: no-store, no-cache, must-revalidate
   - Pragma: no-cache
   - Expires: 0

✅ Source maps
   - Отключить source maps в production
   - Это защищает от reverse-engineering кода
```

#### C. Dependencies

```
✅ npm packages
   - Регулярно обновлять (npm audit, npm update)
   - Использовать npm audit fix
   - Проверять уязвимости перед релизом
   - Lock файл (package-lock.json) обязателен
   - Не использовать * версии (использовать точные версии)

✅ Build процесс
   - Минификация кода (уже происходит в Vite)
   - Tree shaking (удалять неиспользуемый код)
   - Uglification переменных
   - Отключить debug информацию
```

---

### 3️⃣ МОБИЛЬНОЕ ПРИЛОЖЕНИЕ БЕЗОПАСНОСТЬ (React Native/Expo)

#### A. Аутентификация

```
✅ JWT токены
   - Хранить в secure storage (не AsyncStorage!)
   - Использовать react-native-secure-store
   - Автоматическое удаление при expiration
   - Обновление через refresh token

✅ Биометрическая аутентификация
   - Отпечаток пальца (Face ID / Touch ID)
   - PIN код с защитой от brute-force
```

#### B. Сетевая безопасность

```
✅ HTTPS
   - Обязательно HTTPS (не HTTP)
   - Certificate pinning (проверка сертификата)
   - TLS 1.2+ только

✅ Данные
   - Шифровать чувствительные данные перед отправкой
   - Подписывать запросы (HMAC-SHA256)
   - Проверять целостность ответов
```

#### C. Локальное хранилище

```
✅ Защита
   - Использовать react-native-secure-store
   - Шифровать перед сохранением
   - Очищать при логауте
   - Автоматическое удаление устаревших данных
```

#### D. Permissions

```
✅ Минимальные права
   - Камера: только если нужна
   - Местоположение: никогда (если не нужно)
   - Контакты: никогда (если не нужно)
   - Календарь: никогда (если не нужно)
   - Просить permission при первом использовании
```

---

### 4️⃣ ИНФРАСТРУКТУРА БЕЗОПАСНОСТЬ

#### A. Сервер

```
✅ ОС
   - Обновлять регулярно (patch updates)
   - Отключить ненужные сервисы
   - Firewall включен
   - SSH на нестандартном порту (не 22)
   - Отключить root логин по SSH
   - Только SSH ключи (не пароль)

✅ Docker
   - Использовать образы от официальных источников
   - Регулярно обновлять базовые образы
   - Не запускать контейнеры от root
   - Volume permissions: правильные
   - Network: изолировать контейнеры

✅ Nginx
   - Отключить Server header (не показывать версию)
   - Отключить X-Powered-By
   - Добавить Security headers (см. ниже)
   - Rate limiting на уровне Nginx
```

#### B. Security Headers

```
✅ Обязательные HTTP headers
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security: max-age=31536000
   - Content-Security-Policy: default-src 'self'
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: accelerometer=(), camera=(), geolocation=()
```

#### C. SSL/TLS

```
✅ Сертификаты
   - Let's Encrypt (бесплатный)
   - Автоматическое обновление за 30 дней до истечения
   - TLS 1.2 минимум (лучше 1.3)
   - Сильные cipher suites
```

#### D. Бэкапы

```
✅ Регулярные бэкапы
   - База данных: ежедневно (шифровать!)
   - Конфигурация: еженедельно
   - Хранить в 2-3 местах (не на одном сервере)
   - Тестировать восстановление ежемесячно
   - Хранить не менее 90 дней
```

#### E. Аудит и логирование

```
✅ Системные логи
   - /var/log/auth.log (попытки логина)
   - /var/log/syslog (системные события)
   - Docker логи (приложение)
   - Nginx логи (web requests)
   - Архивировать по размеру (не заполнять диск)
   - Централизованное логирование (ELK, CloudWatch)
```

---

### 5️⃣ DATABASE БЕЗОПАСНОСТЬ

#### A. Доступ

```
✅ Permissions
   - Backend: только необходимые permissions
   - Другие приложения: ЗАПРЕТИТЬ доступ
   - root юзер: отключить
   - Разные пароли для dev/prod

✅ Соединение
   - Только через localhost или VPN
   - Отключить сетевой доступ из интернета
   - Использовать парольную защиту
   - Изменить порт со стандартного (не 5432, не 3306)
```

#### B. Шифрование

```
✅ At rest
   - Шифровать чувствительные колонки
   - Использовать Transparent Data Encryption (TDE)

✅ In transit
   - SSL/TLS для подключения (mysql --ssl, psql --ssl)
   - Проверять сертификаты
```

#### C. Резервное копирование

```
✅ Регулярные бэкапы
   - Ежедневно (точка восстановления)
   - Шифровать перед сохранением
   - Хранить географически удаленно
   - Проверять целостность
```

---

### 6️⃣ ЗАЩИТА ОТ КОНКРЕТНЫХ АТАК

#### A. SQL Injection

```
✅ Защита
   - ORM (уже используется SQLAlchemy?)
   - Параметризованные запросы (не конкатенация строк!)
   - Input validation
   - Escape специальные символы
```

#### B. XSS (Cross-Site Scripting)

```
✅ Защита
   - React автоматически экранирует
   - Избегать dangerouslySetInnerHTML
   - Content Security Policy
   - Input sanitization
```

#### C. CSRF (Cross-Site Request Forgery)

```
✅ Защита
   - CSRF токены в forms
   - SameSite=Strict для cookies
   - Проверка Origin header
   - Double submit cookies
```

#### D. DDoS

```
✅ Защита
   - Rate limiting (Nginx, приложение)
   - CloudFlare или аналог (DDoS protection)
   - Load balancing
   - Auto-scaling при нагрузке
```

#### E. Brute Force

```
✅ Защита
   - Ограничение попыток логина (5 за 15 мин)
   - Экспоненциальная задержка
   - CAPTCHA после нескольких попыток
   - 2FA (двухфакторная аутентификация)
```

#### F. Path Traversal

```
✅ Защита
   - Валидировать пути файлов
   - Не разрешать "../" в пути
   - Использовать whitelist доступных путей
```

---

### 7️⃣ COMPLIANCE И РЕГУЛЯЦИЯ

#### A. Данные пользователя

```
✅ GDPR (если пользователи из EU)
   - Right to be forgotten (удаление данных)
   - Data portability (экспорт данных)
   - Consent management
   - Privacy policy

✅ Минимизация данных
   - Собирать только необходимое
   - Удалять при необходимости
   - Pseudonymization

✅ Уведомление о взломе
   - Если произошёл breach, уведомить за 72 часа
   - Документировать инцидент
```

#### B. Лицензии

```
✅ Third-party
   - Отслеживать лицензии (MIT, Apache, GPL, etc.)
   - Убедиться в совместимости
   - Соблюдать условия лицензии
```

---

### 8️⃣ МОНИТОРИНГ И РЕАГИРОВАНИЕ

#### A. Инструменты

```
✅ Security scanning
   - OWASP ZAP (для web приложений)
   - npm audit (для dependencies)
   - SonarQube (для code quality)
   - Snyk (для vulnerability scanning)

✅ Log monitoring
   - Centralized logging (ELK, CloudWatch)
   - Alerting на подозрительные события
   - Retention: минимум 90 дней

✅ Uptime monitoring
   - Status page (statuspage.io)
   - Ping сервера каждые 5 минут
   - Алерт при downtime
```

#### B. Incident response

```
✅ План
   - Кто отвечает при инциденте?
   - Как сообщить пользователям?
   - Как восстанавливать данные?
   - Post-mortem анализ

✅ Документация
   - Все инциденты должны быть задокументированы
   - Root cause analysis
   - Превентивные меры
```

---

## 🎯 ПРИОРИТЕТЫ (если ограничено время)

### 🔴 КРИТИЧЕСКОЕ (ДЕЛАТЬ СЕЙЧАС!)

1. ✅ HTTPS везде (замените HTTP)
2. ✅ JWT с правильной expiration
3. ✅ Пароли: bcrypt, минимум 12 символов
4. ✅ SQL injection защита (использовать ORM)
5. ✅ CORS только для доверенных доменов
6. ✅ Security headers в Nginx
7. ✅ .env для всех секретов
8. ✅ Rate limiting на логин
9. ✅ Логирование всех попыток доступа
10. ✅ Регулярные бэкапы БД

### 🟡 ВАЖНОЕ (В ТЕЧЕНИЕ МЕСЯЦА)

1. ✅ Refresh tokens
2. ✅ 2FA (двухфакторная аутентификация)
3. ✅ Input validation & sanitization
4. ✅ CAPTCHA на формах
5. ✅ Мониторинг безопасности
6. ✅ Регулярные security audits
7. ✅ SSH ключи для сервера
8. ✅ Обновления зависимостей
9. ✅ Логирование на центральный сервер
10. ✅ Автоматические обновления ОС

### 🟢 ЖЕЛАЕМОЕ (LONG-TERM)

1. ✅ Биометрическая аутентификация
2. ✅ End-to-end encryption
3. ✅ Hardware security keys
4. ✅ Advanced threat detection
5. ✅ Penetration testing
6. ✅ Bug bounty программа
7. ✅ SIEM (Security Information and Event Management)
8. ✅ ISO 27001 сертификация

---

## 📋 ЧЕКЛИСТ ДЛЯ PRODUCTION

```
AUTHENTICATION:
☐ JWT с expiration (30 мин для access, 7 дней для refresh)
☐ Refresh token механизм
☐ Пароли: bcrypt с 12+ rounds
☐ Минимальная длина пароля: 12 символов
☐ Требуется: CAPS + lowercase + цифры + спецсимволы
☐ Rate limiting: 5 попыток за 15 минут
☐ 2FA (двухфакторная аутентификация)

ENCRYPTION:
☐ HTTPS везде (не HTTP)
☐ TLS 1.2 минимум
☐ Let's Encrypt сертификат
☐ Auto-renewal сертификата за 30 дней
☐ Шифрование чувствительных данных в БД (AES-256)

API SECURITY:
☐ Input validation всюду
☐ Output encoding (JSON escape)
☐ SQL injection защита (ORM)
☐ XSS защита (React autoescape)
☐ CSRF protection (токены)
☐ CORS для доверенных доменов
☐ Rate limiting: 100 req/min per user

DATABASE:
☐ Только localhost/VPN доступ
☐ Сильный пароль
☐ Регулярные бэкапы (ежедневно)
☐ Шифрованные бэкапы
☐ Тестирование восстановления

INFRASTRUCTURE:
☐ Обновления ОС (патчи)
☐ Firewall включен
☐ SSH ключи (не пароль)
☐ SSH на нестандартном порту
☐ Docker security (non-root)
☐ Логирование всех событий
☐ Centralized logging (минимум 90 дней)

HEADERS:
☐ X-Content-Type-Options: nosniff
☐ X-Frame-Options: DENY
☐ X-XSS-Protection: 1; mode=block
☐ Strict-Transport-Security: max-age=31536000
☐ Content-Security-Policy
☐ Referrer-Policy

FRONTEND:
☐ npm audit (нет vulnerabilities)
☐ Отключить source maps в production
☐ Минификация кода
☐ HttpOnly cookies для токенов
☐ SessionStorage для временных данных

MONITORING:
☐ Алерт на множественные неудачные логины
☐ Алерт на DDoS попытки
☐ Алерт на SQL injection попытки
☐ Алерт на сертификат istoria истечения
☐ Uptime monitoring каждые 5 минут

COMPLIANCE:
☐ Privacy policy на сайте
☐ Terms of service
☐ Cookie consent (если нужно)
☐ Документация по security
☐ Incident response plan

TESTING:
☐ Penetration testing
☐ Security code review
☐ Vulnerability scanning (OWASP ZAP)
☐ Dependency audit (npm audit)
☐ Load testing (проверка rate limits)
```

---

## ⚠️ ЧАСТО ПРОПУСКАЕМОЕ

```
❌ Нет rate limiting → Brute force атаки
❌ HTTP вместо HTTPS → Man-in-the-middle
❌ Пароли в логах → Утечка данных
❌ Нет логирования → Невозможно найти взломщика
❌ .env в Git → Секреты украдены
❌ Старые зависимости → Known vulnerabilities
❌ Нет бэкапов → Потеря данных при взломе
❌ CORS "*" → Доступ для всех
❌ Stored XSS уязвимость → Кража cookies
❌ Слабые пароли → Легко взломать
```

---

## 🎯 ИТОГОВЫЙ СПИСОК

**Всё вышеуказанное - это стандартные требования для production-ready приложения.**

Это не усложнение, это **обязательный минимум** для защиты от реальных атак.

---

**Документ создан:** 19 октября 2025  
**Версия:** 1.0.0  
**Тип:** Security Hardening Guidelines  
**Статус:** Ready for Implementation ✅
