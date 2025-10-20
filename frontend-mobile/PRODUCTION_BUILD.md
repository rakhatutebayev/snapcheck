# 📱 Production Build - Мобильное приложение SnapCheck

## 🎯 Что это?

Полная production-ready версия мобильного приложения SnapCheck для распространения на:
- ✅ **Apple App Store** (iOS)
- ✅ **Google Play Store** (Android)
- ✅ **TestFlight** (тестирование iOS)
- ✅ **Google Play Console** (тестирование Android)

---

## 📦 Production версия включает:

### ✅ iOS Build (для App Store)
```
frontend-mobile/
├── ios/
│   ├── App.xcodeproj/          # Xcode проект
│   └── Podfile                  # CocoaPods зависимости
├── app.json                     # Expo config для iOS
└── eas.json                     # EAS Build config
```

### ✅ Android Build (для Play Store)
```
frontend-mobile/
├── android/
│   ├── app/
│   │   └── build.gradle         # Android конфиг
│   └── build.gradle
├── app.json                     # Expo config для Android
└── eas.json                     # EAS Build config
```

### ✅ Конфигурационные файлы
```
frontend-mobile/
├── app.json                     # Главная конфигурация
├── eas.json                     # EAS Build (облачная компиляция)
├── app.icon.png                 # Иконка приложения (1024x1024)
├── app.splash.png               # Splash экран
└── eas.secrets.json             # Секреты для App Store Connect
```

### ✅ Build скрипты
```
frontend-mobile/
├── scripts/
│   ├── build-ios.sh             # iOS build
│   ├── build-android.sh         # Android build
│   ├── submit-ios.sh            # Отправка на App Store
│   └── submit-android.sh        # Отправка на Play Store
```

---

## 🚀 Быстрый старт (Production Build)

### Вариант 1: EAS Build (РЕКОМЕНДУЕТСЯ ✅)

**Плюсы:**
- Облачная компиляция (не нужны Xcode/Android Studio)
- Работает на любом компьютере (macOS/Windows/Linux)
- Автоматическое подписание сертификатов
- Простая отправка на App Store/Play Store

**Шаг 1: Установить EAS CLI**
```bash
npm install -g eas-cli
eas login
```

**Шаг 2: Инициализировать проект**
```bash
cd frontend-mobile
eas build:configure
```

**Шаг 3: Собрать для iOS**
```bash
eas build --platform ios --type release
```

**Шаг 4: Собрать для Android**
```bash
eas build --platform android --type release
```

**Шаг 5: Отправить на App Store / Play Store**
```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

**Время сборки:** 5-15 минут (облако Expo)  
**Стоимость:** Первые 30 сборок в месяц - бесплатно

---

### Вариант 2: Локальная компиляция (для опытных)

**Требует:**
- macOS + Xcode (для iOS)
- Android SDK + Android Studio (для Android)
- 50+ GB свободного места

**Для iOS:**
```bash
cd frontend-mobile
eas build --platform ios --local
```

**Для Android:**
```bash
cd frontend-mobile
eas build --platform android --local
```

---

## 📋 Что нужно перед публикацией?

### ✅ iOS (App Store)

```
□ Apple Developer Account ($99/год)
  └─ Зарегистрироваться: https://developer.apple.com/programs

□ Провизионирующий профиль (Provisioning Profile)
  └─ Создать в Apple Developer Portal

□ Сертификат подписи (Distribution Certificate)
  └─ Экспортировать из Xcode

□ App Store Connect запись
  └─ Создать приложение на App Store Connect

□ Скриншоты приложения (4-5 штук)
  └─ Разрешение: 1284x2778 (iPhone 14 Pro Max)

□ Описание приложения (max 4000 символов)
□ Ключевые слова (max 100 символов)
□ Поддержка URL
□ Политика конфиденциальности URL
□ Рейтинг контента (IARC)
```

### ✅ Android (Play Store)

```
□ Google Play Developer Account ($25 один раз)
  └─ Зарегистрироваться: https://play.google.com/console

□ Подписанный APK/AAB файл
  └─ Создается автоматически через EAS Build

□ Play Store запись
  └─ Создать приложение в Play Console

□ Скриншоты приложения (4-8 штук)
  └─ Разрешение: 1440x2560 (для фонов)

□ Описание приложения
□ Иконка приложения (512x512)
□ Графический ассет (1024x500)
□ Политика конфиденциальности URL
```

---

## 🎨 Финальная подготовка

### 1️⃣ Версионирование

**Обновить версию в `app.json`:**

```json
{
  "expo": {
    "name": "SnapCheck",
    "version": "1.0.0",              ← iOS/Android версия
    "runtimeVersion": "1.0.0",
    "ios": {
      "version": "1.0.0"
    },
    "android": {
      "versionCode": 1                ← должен расти на каждый апдейт
    }
  }
}
```

### 2️⃣ Иконки и Splash

```bash
# Использовать easybadges для иконок
# https://www.appicon.co/

# Разрешения:
# iOS:     1024x1024 (App Store)
# Android: 512x512   (Play Store)
```

### 3️⃣ Данные приложения

```json
{
  "name": "SnapCheck",
  "slug": "snapcheck",
  "owner": "ваш_юзер",
  "runtimeVersion": "1.0.0",
  "privacy": "public",
  "platforms": ["ios", "android"],
  "ios": {
    "supportsTabletMode": true,
    "bundleIdentifier": "com.yourcompany.snapcheck"
  },
  "android": {
    "adaptiveIcon": true,
    "package": "com.yourcompany.snapcheck"
  }
}
```

---

## 🔐 Production Переменные

**Создать `app.config.js` (вместо `app.json`):**

```javascript
export default {
  expo: {
    name: "SnapCheck",
    slug: "snapcheck",
    version: "1.0.0",
    runtimeVersion: "1.0.0",
    
    // Production API URL
    extra: {
      apiUrl: process.env.API_URL || "https://api.snapcheck.com",
      appName: "SnapCheck",
      appVersion: "1.0.0"
    },
    
    ios: {
      bundleIdentifier: "com.yourcompany.snapcheck",
      buildNumber: "1",
      supportsTabletMode: true,
      infoPlist: {
        NSCameraUsageDescription: "Используется для сканирования кодов",
        NSPhotoLibraryUsageDescription: "Используется для выбора фото"
      }
    },
    
    android: {
      package: "com.yourcompany.snapcheck",
      versionCode: 1,
      adaptiveIcon: true,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "Allow SnapCheck to access your camera"
        }
      ]
    ]
  }
};
```

---

## 📱 Собрать Production версию

### Шаг 1: Подготовка

```bash
cd frontend-mobile

# Установить зависимости
npm install

# Проверить конфигурацию
npx expo doctor

# Проверить bundler
npx expo prebuild --clean
```

### Шаг 2: Локальная тестирование

```bash
# Запустить на эмуляторе
npm start

# Или через Expo Go
# Отсканировать QR код телефоном в Expo Go
```

### Шаг 3: Production Build через EAS

```bash
# iOS
eas build --platform ios --type release

# Android
eas build --platform android --type release

# Оба сразу
eas build --platform all --type release
```

### Шаг 4: Скачать собранные файлы

```bash
# После завершения EAS Build
# Файлы доступны в EAS Build консоли

# iOS: app-xxx.ipa (для TestFlight)
# Android: app-release.aab (для Play Store)
```

---

## 📤 Публикация

### iOS - App Store

```bash
# Способ 1: Автоматический (РЕКОМЕНДУЕТСЯ)
eas submit --platform ios --latest

# Способ 2: Ручной (через Transporter)
# 1. Скачать app-xxx.ipa
# 2. Открыть Transporter на Mac
# 3. Выбрать ipa файл
# 4. Отправить
```

**Время модерации:** 1-3 дня (обычно 24 часа)

### Android - Play Store

```bash
# Способ 1: Автоматический (РЕКОМЕНДУЕТСЯ)
eas submit --platform android --latest

# Способ 2: Ручной (через Play Console)
# 1. Скачать app-release.aab
# 2. Открыть Play Console
# 3. Internal Testing → Upload → app-release.aab
# 4. После тестирования → Production
```

**Время модерации:** обычно 2-4 часа

---

## 💰 Стоимость

| Платформа | Стоимость | Периодичность |
|-----------|-----------|---------------|
| iOS App Store | $99 | Ежегодно |
| Android Play Store | $25 | Один раз |
| EAS Build (облако) | $0-200 | По мере надобности |
| Сертификаты SSL | $0 (Let's Encrypt) | - |
| **ИТОГО на старт** | **$124** | - |

---

## 🐛 Типичные проблемы

### ❌ Problem: "Invalid provisioning profile"

**Solution:**
```bash
# Удалить старый профиль
eas credentials

# Пересоздать
eas build --platform ios --clear-cache
```

### ❌ Problem: "Android keystore not found"

**Solution:**
```bash
# Удалить старый keystore
eas credentials --platform android --clear

# Создать новый
eas build --platform android
```

### ❌ Problem: "App already submitted"

**Solution:**
```bash
# Увеличить версию в app.json
# iOS: version должна быть выше
# Android: versionCode должен быть выше
```

### ❌ Problem: "Icon size wrong"

**Solution:**
```bash
# Правильные размеры:
# iOS: 1024x1024 px (App Store требует ровно 1024x1024)
# Android: 512x512 px (для Play Store)
# Используйте: https://www.appicon.co/
```

---

## ✅ Финальный Checklist

```
ПЕРЕД ПУБЛИКАЦИЕЙ:
☐ Версия обновлена в app.json (1.0.0)
☐ Иконка 1024x1024 установлена
☐ Splash экран готов
☐ Описание приложения написано (на русском и английском)
☐ Ключевые слова добавлены
☐ Скриншоты 5-10 штук (разные языки)
☐ Политика конфиденциальности URL готова
☐ API URL указан (production)
☐ Все ошибки исправлены (npx expo doctor)
☐ Локально протестировано на эмуляторе

iOS ДОПОЛНИТЕЛЬНО:
☐ Apple Developer Account создан ($99)
☐ App Store Connect запись создана
☐ IARC рейтинг заполнен
☐ Privacy Policy URL указана
☐ Скриншоты 1284x2778 (iPhone 14 Pro Max)

ANDROID ДОПОЛНИТЕЛЬНО:
☐ Google Play Developer Account создан ($25)
☐ Play Console приложение создано
☐ Privacy Policy URL указана
☐ Скриншоты 1440x2560 (для фонов)

ПОСЛЕ ПУБЛИКАЦИИ:
☐ Ссылка на App Store скопирована
☐ Ссылка на Play Store скопирована
☐ Ссылки добавлены на сайт/в README
☐ Пользователи приглашены
☐ Аналитика настроена (Firebase)
☐ Обновления планируются
```

---

## 🎉 Готово!

Production версия мобильного приложения полностью подготовлена к публикации на:
- ✅ **Apple App Store** (iOS)
- ✅ **Google Play Store** (Android)

**Следующий шаг:** Запустить `eas build --platform all --type release`

---

**Документ создан:** 19 октября 2025  
**Версия:** 1.0.0  
**Статус:** Production Ready ✅
