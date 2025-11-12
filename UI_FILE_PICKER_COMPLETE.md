# 🎉 ЗАВЕРШЕНО: Замена текстового ввода пути на диалог выбора папки

## Что было сделано

Полностью обновлена система загрузки слайдов в админ-панели SnapCheck:

### Проблема (ДО)
❌ Текстовое поле для ввода пути к папке  
❌ Нужно было знать полный путь (например: `/Users/john/Documents/slides`)  
❌ Возможны опечатки в пути  
❌ На Windows и Mac пути выглядели по-разному  
❌ Кнопка "Проверить" для валидации пути  

### Решение (ПОСЛЕ)
✅ **Нативный диалог выбора папки** - как в проводнике/Finder  
✅ Кнопка "📁 Нажмите для выбора папки"  
✅ Браузер открывает нативный File Picker  
✅ Автоматическое обнаружение JPG файлов  
✅ Превью слайдов прямо в админ-панели перед загрузкой  
✅ **Поддержка всех ОС:** macOS, Windows, Linux  

## Файлы, которые были изменены

### 1. Frontend: `/frontend/src/pages/AdminPanel.jsx`
**Изменения:**
- Заменено текстовое поле на `<input type="file" webkitdirectory>`
- Добавлена визуальная дроп-зона с инструкциями
- Новая функция `handleFolderSelect()` для обработки выбора папки
- Обновленная функция `handleUploadSlidesFromFolder()` для отправки файлов
- Удалены: `folderPath`, `checkingFolder`, `handleCheckFolder()`

**Новый UI элемент:**
```jsx
<input
  ref={input => setFolderInputRef(input)}
  type="file"
  webkitdirectory="true"
  mozdirectory="true"
  onChange={handleFolderSelect}
  className="hidden"
  id="folder-input"
/>
```

### 2. Backend: `/backend/slides_admin.py`
**Изменения:**
- Добавлен новый endpoint `POST /admin/slides/upload-from-files`
- Добавлены импорты: `UploadFile`, `File`, `List` из FastAPI
- Добавлен импорт: `re` для валидации имен файлов

**Новый endpoint:**
```python
@router.post("/slides/upload-from-files")
async def upload_slides_from_files(
    presentation_title: str,
    slides: List[UploadFile] = File(...),
    ...
)
```

## Как это работает

### Пользовательский поток

1. **Администратор открывает админ-панель**
   - URL: `http://localhost:5173`
   - Логин: `admin@gss.aero` / `123456`

2. **Переходит на вкладку "📤 Загрузить"**
   - Видит кнопку "📁 Нажмите для выбора папки"

3. **Нажимает на кнопку**
   - Открывается нативный диалог выбора папки
   - На Mac: Finder
   - На Windows: Проводник (Explorer)
   - На Linux: Файловый менеджер

4. **Выбирает папку со слайдами**
   - Файлы должны быть названы: `slide1.jpg`, `slide2.jpg`, и т.д.
   - Система автоматически находит все JPG файлы

5. **Видит превью найденных слайдов**
   - Сетка с числом слайдов
   - Размер каждого файла в KB

6. **Вводит название презентации**
   - Например: "Правовая поддержка сотрудников"

7. **Нажимает "✓ Загрузить 5 слайдов"**
   - Файлы отправляются на сервер
   - Сохраняются в базу данных
   - Получает подтверждение

### Технический поток

1. **Браузер читает файлы**
   - WebKitDirectory API позволяет браузеру читать содержимое папки
   - Файлы загружаются в памяти браузера
   - Нет доступа к полному пути (для безопасности)

2. **Фильтрация файлов**
   ```javascript
   // Фильтруем только slide*.jpg файлы
   const slideFiles = Array.from(files).filter(f => 
     /^slide\d+\.jpg$/i.test(f.name)
   );
   ```

3. **Сортировка**
   ```javascript
   // Сортируем по номерам: slide1, slide2, slide3...
   slideFiles.sort((a, b) => {
     const numA = parseInt(a.name.match(/\d+/)[0]);
     const numB = parseInt(b.name.match(/\d+/)[0]);
     return numA - numB;
   });
   ```

4. **Отправка на сервер**
   ```javascript
   // Используем FormData для отправки файлов
   const formData = new FormData();
   formData.append('presentation_title', presentationTitle);
   checkedSlides.forEach(slide => {
     formData.append('slides', slide.file, slide.filename);
   });
   
   const response = await axios.post(
     '/admin/slides/upload-from-files', 
     formData
   );
   ```

5. **Сервер обрабатывает файлы**
   - Валидирует имена файлов
   - Проверяет что слайды идут по порядку
   - Сохраняет файлы в `/tmp/snapcheck_uploads/slides/{presentation_id}/`
   - Создает записи в БД

## Технические детали

### Поддерживаемые браузеры

| Браузер | macOS | Windows | Linux |
|---------|-------|---------|-------|
| Chrome 32+ | ✅ | ✅ | ✅ |
| Firefox 50+ | ✅ | ✅ | ✅ |
| Safari 10+ | ⚠️ | - | - |
| Edge 79+ | ✅ | ✅ | - |
| Opera 19+ | ✅ | ✅ | ✅ |

### API endpoint

**POST /admin/slides/upload-from-files**

Request:
```
Content-Type: multipart/form-data

presentation_title=My+Presentation
slides=slide1.jpg (file)
slides=slide2.jpg (file)
slides=slide3.jpg (file)
```

Response (success):
```json
{
  "status": "success",
  "presentation": {
    "id": 5,
    "title": "My Presentation",
    "status": "draft",
    "slides_count": 3
  },
  "slides_count": 3,
  "message": "Загружено 3 слайдов"
}
```

Response (error):
```json
{
  "detail": "Файл slide1.jpg не является JPG"
}
```

## Тестирование

### Локальное тестирование

1. **Создайте тестовую папку:**
   ```bash
   mkdir -p ~/my_slides
   # Добавьте туда JPG файлы с именами: slide1.jpg, slide2.jpg, slide3.jpg
   ```

2. **Откройте админ-панель:**
   - URL: `http://localhost:5173`
   - Логин как админ

3. **Перейдите на вкладку "Загрузить":**
   - Нажмите на "Нажмите для выбора папки"
   - Выберите папку `~/my_slides`
   - Введите название (например "Тест №1")
   - Нажмите "Загрузить"

4. **Проверьте результат:**
   - На вкладке "Презентации" должна появиться новая презентация
   - Статус должен быть "📝 Черновик"
   - Можно расширить и отредактировать названия слайдов
   - Можно опубликовать кнопкой "Опубликовать"

### API тестирование

```bash
# Создайте тестовые файлы
mkdir -p /tmp/test_slides
touch /tmp/test_slides/slide1.jpg
touch /tmp/test_slides/slide2.jpg

# Получите токен
TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@gss.aero&password=123456" | jq -r '.access_token')

# Загрузите слайды
curl -X POST http://localhost:8000/admin/slides/upload-from-files \
  -H "Authorization: Bearer $TOKEN" \
  -F "presentation_title=Test Presentation" \
  -F "slides=@/tmp/test_slides/slide1.jpg" \
  -F "slides=@/tmp/test_slides/slide2.jpg"
```

## Важные примечания

### Браузерная безопасность
- Браузер **НЕ** отправляет полный путь к папке серверу (это была бы уязвимость)
- Браузер читает только файлы, которые находятся в выбранной папке
- Это одна из причин, почему мы используем `webkitdirectory` вместо текстового поля для пути

### Требования к файлам
- ✅ JPG формат (или JPEG)
- ✅ Имена: `slide1.jpg`, `slide2.jpg`, и т.д.
- ✅ **Должны идти по порядку** (1, 2, 3... без пропусков)
- ✅ Размер: обычно нет ограничений (зависит от сервера)
- ❌ Не может быть пропусков в нумерации (например, slide1.jpg, slide3.jpg - ошибка)

### Ограничения
- Максимум 999 слайдов (обработка всех нумераций от 1-999)
- Максимальный размер загрузки зависит от настроек FastAPI (по умолчанию ~25MB)
- Файлы должны быть в выбранной папке (не в подпапках)

## Возможные улучшения в будущем

1. **Поддержка других форматов**
   - PNG, BMP, GIF

2. **Загрузка из подпапок**
   - Если найти слайды в подпапках выбранной папки

3. **Переименование файлов**
   - Сервер может переименовывать неправильно названные файлы

4. **Прогресс-бар**
   - Показывать процент загрузки для больших файлов

5. **Drag & Drop**
   - Перетаскивание папки прямо на дроп-зону (уже поддерживается браузерами)

## Заключение

✨ **Система загрузки полностью обновлена и готова к использованию**

Теперь администраторы могут:
- 🎯 Быстро выбирать папки со слайдами
- 🌍 Работать на любой ОС (Mac, Windows, Linux)
- ✅ Видеть превью перед загрузкой
- 🚀 Загружать презентации за несколько кликов
- 📝 Редактировать названия слайдов
- 📢 Публиковать готовые презентации

**Оба сервера запущены и работают:**
- Backend: `http://localhost:8000` ✅
- Frontend: `http://localhost:5173` ✅

**Готово к использованию!** 🎉
