# 🔧 Настройка VS Code для загрузки на GitHub

## Быстро (за 5 минут)

### Шаг 1: Авторизоваться в GitHub в VS Code

1. Откройте VS Code
2. Нажмите на иконку **Source Control** (слева) или `Ctrl+Shift+G`
3. Нажмите **"Sign in with GitHub"**
4. Откроется браузер с запросом авторизации
5. Нажмите **"Authorize github"**
6. Браузер перенаправит вас обратно в VS Code

✅ Готово! VS Code подключён к вашему GitHub

---

## Шаг 2: Опубликовать репозиторий на GitHub

### Способ A: Через Source Control (ЛЕГЧЕ)

1. В VS Code откройте нашу папку:
   ```
   File → Open Folder → SnapCheck
   ```

2. В левой панели нажмите **Source Control** (иконка с 3 кружками)

3. Нажмите **"Publish to GitHub"** (большая синяя кнопка)

4. Выберите:
   - **Repo name**: `SnapCheck`
   - **Public** или **Private** (на выбор)

5. Нажмите **"Publish to GitHub"**

✅ Ваш репозиторий создан и загружены все файлы!

---

### Способ B: Через терминал VS Code

1. Откройте встроенный терминал:
   ```
   Ctrl+` (grave/backtick)
   ```

2. Выполните:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/SnapCheck.git
   git branch -M main
   git push -u origin main
   ```

3. При запросе пароля введите **Personal Access Token**

---

## Шаг 3: Сохранять учётные данные (чтобы не вводить каждый раз)

### Способ A: GitHub Credential Manager (РЕКОМЕНДУЕТСЯ)

VS Code уже использует GitHub authentication, поэтому:

1. Первый раз авторизуетесь через браузер
2. VS Code запомнит ваши данные
3. Больше не будет просить пароль!

### Способ B: Сохранить токен локально (если нужно)

1. Откройте VS Code терминал
2. Выполните:
   ```bash
   git config --global credential.helper store
   ```

3. При первом push'е введите:
   - **Username**: YOUR_USERNAME
   - **Password**: ВАШ_PERSONAL_ACCESS_TOKEN

4. Git запомнит и будет использовать автоматически

---

## Шаг 4: Теперь каждый раз при изменениях

### Через VS Code GUI (легко):

1. Сделайте изменения в файлах
2. В Source Control панели увидите изменённые файлы
3. Напишите сообщение коммита в поле внизу
4. Нажмите ✓ (галочка) или `Ctrl+Enter` для коммита
5. Нажмите **"↑"** (стрелка вверх) для push'а на GitHub

Готово! Файлы загружены на GitHub! 🎉

### Через встроенный терминал:

```bash
git add .
git commit -m "Ваше сообщение"
git push
```

---

## 📋 Полный процесс настройки (ШАГ ЗА ШАГОМ)

### 1️⃣ Подготовка (ОДИН РАЗ)

```bash
# Открыть папку в VS Code
code /Users/rakhat/Documents/webhosting/SnapCheck

# Или открыть VS Code и выбрать папку через File → Open Folder
```

### 2️⃣ Авторизация на GitHub

- **Ctrl+Shift+G** (Source Control)
- **Sign in with GitHub**
- Авторизуйтесь в браузере

### 3️⃣ Создать репозиторий

- **Publish to GitHub**
- Выберите Public/Private
- Готово!

### 4️⃣ Делать коммиты и push'ить

После каждых изменений:

```
Source Control → Напишите сообщение → Ctrl+Enter → ↑ (push)
```

---

## 🎯 Если уже есть локальный git репозиторий

У вас уже есть git (мы его инициализировали). 

В VS Code:

1. **Ctrl+Shift+G** → Source Control
2. Вы увидите изменённые файлы
3. **Publish to GitHub** → Создаст новый репо
4. Готово!

---

## 🔒 Безопасность: Personal Access Token

### Зачем нужен?

GitHub отменил возможность использовать пароль для git операций. Нужен токен.

### Как создать токен?

1. Откройте: https://github.com/settings/tokens/new

2. Заполните:
   - **Token name**: `vs-code-git`
   - **Expiration**: 90 days или No expiration
   - **Scopes**: отметьте ✓ repo

3. **Generate token**

4. 📋 **СКОПИРУЙТЕ ТОКЕН** (потом не сможете увидеть!)

### Где использовать?

- Когда VS Code спросит пароль → введите токен
- Когда git спросит пароль → введите токен

### Если используете HTTPS (по умолчанию):

```bash
# При первом push'е:
git remote add origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/SnapCheck.git
```

---

## 🚀 Способ 1: Git Publish (САМЫЙ ЛЕГКИЙ)

### Если у вас VS Code 1.68+ (почти все):

1. **Ctrl+Shift+G** (Source Control)
2. **Publish to GitHub** (большая кнопка)
3. Выберите имя репо и Public/Private
4. **Publish to GitHub**

Всё! Репозиторий создан и файлы загружены! ✅

---

## 🚀 Способ 2: GitHub in VS Code Extension

### Установить расширение (опционально):

1. **Ctrl+Shift+X** (Extensions)
2. Поиск: `GitHub Pull Requests`
3. Установить (от Microsoft)
4. Перезагрузить VS Code

После этого:
- Автоматически авторизует через GitHub
- Работать с PR'ами прямо из VS Code
- Видеть pull requests, issues, etc.

---

## 🆘 Решение проблем

### "Sign in with GitHub" не работает

**Решение:**
```bash
# В терминале VS Code выполните:
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

Потом попробуйте снова.

### "fatal: could not read Username for 'https://github.com'"

**Решение:**
1. Создайте Personal Access Token (выше)
2. Используйте его вместо пароля

### "Publish to GitHub" не появляется

**Решение:**
1. **Ctrl+Shift+G** (Source Control)
2. Если пусто - откройте папку:
   ```
   File → Open Folder → SnapCheck
   ```
3. Попробуйте снова

### Никак не работает?

**Способ B - через терминал:**
```bash
# Открыть терминал в VS Code
Ctrl+`

# Выполнить команды
git remote add origin https://github.com/YOUR_USERNAME/SnapCheck.git
git branch -M main
git push -u origin main
```

---

## 📝 После загрузки на GitHub

### Посмотреть репозиторий:

```
https://github.com/YOUR_USERNAME/SnapCheck
```

### Делать обновления в VS Code:

1. Измените файлы
2. **Ctrl+Shift+G** (Source Control)
3. Введите сообщение коммита
4. Нажмите ✓ (Ctrl+Enter)
5. Нажмите ↑ (стрелка вверх) для push'а

### Или из терминала:

```bash
git add .
git commit -m "Описание изменений"
git push
```

---

## 🎯 Шпаргалка: Горячие клавиши VS Code

| Действие | Клавиши |
|----------|---------|
| Открыть Source Control | `Ctrl+Shift+G` |
| Открыть терминал | `Ctrl+`` |
| Коммитить (с сообщением) | `Ctrl+Enter` (в Source Control) |
| Открыть Command Palette | `Ctrl+Shift+P` |
| Открыть папку | `Ctrl+K Ctrl+O` |

---

## ✅ Финальный чеклист

- [ ] Авторизовался в GitHub через VS Code
- [ ] Создал Personal Access Token
- [ ] Нажал "Publish to GitHub" в VS Code
- [ ] Выбрал Public/Private
- [ ] Репозиторий создан на GitHub
- [ ] Все файлы загружены
- [ ] Могу видеть репо на https://github.com/YOUR_USERNAME/SnapCheck
- [ ] Могу делать коммиты и push'ить через VS Code

---

## 🎉 Готово!

Теперь вы можете:

✓ Редактировать файлы в VS Code  
✓ Делать коммиты одной кнопкой  
✓ Загружать на GitHub одной кнопкой  
✓ Делиться ссылкой с командой  
✓ Отслеживать изменения  
✓ Работать с коллегами  

**Начните с "Publish to GitHub" → выберите Public/Private → Done! 🚀**
