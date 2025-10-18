# 📄 Логика переименования файлов слайдов

## Описание

Система автоматически переименовывает загруженные файлы слайдов в стандартный формат `slide1.jpg`, `slide2.jpg`, и т.д.

Это позволяет пользователям загружать файлы с любыми именами (например, `Slide1.jpeg`, `PHOTO_2.jpg`, `image-3.jpg`), и система автоматически привесит их в нужный формат.

## Как это работает

### 1️⃣ Фильтрация файлов (Frontend)

**Файл:** `/frontend/src/pages/AdminPanel.jsx` - функция `handleFolderSelect()`

Система принимает файлы, которые:
- Заканчиваются на `.jpg` или `.jpeg` (любой регистр)
- Начинаются с `slide` (любой регистр)

**Примеры:**
```
✅ Принимаем:
  - Slide1.jpeg
  - slide2.jpg
  - SLIDE3.JPG
  - slide_4.jpg
  - SLIDE-5.JPEG

❌ Отклоняем:
  - photo1.jpg        (не начинается с "slide")
  - image_2.jpeg      (не начинается с "slide")
  - slide3.png        (не .jpg/.jpeg)
  - slide4.txt        (не изображение)
```

### 2️⃣ Сортировка по номеру (Frontend)

Система извлекает номер из имени файла и сортирует по порядку:

```
Исходный порядок:          После сортировки:
- Slide1.jpeg              - Slide1.jpeg     (1)
- slide3.jpg               - slide2.jpg      (2)
- slide2.jpg               - slide3.jpg      (3)

               ↓ становится ↓

Индекс 1 → Slide1.jpeg      →  slide1.jpg
Индекс 2 → slide2.jpg       →  slide2.jpg
Индекс 3 → slide3.jpg       →  slide3.jpg
```

### 3️⃣ Переименование перед отправкой (Frontend)

**Файл:** `/frontend/src/pages/AdminPanel.jsx` - функция `handleUploadSlidesFromFolder()`

Перед отправкой на сервер каждый файл переименовывается:

```javascript
checkedSlides.forEach((slide, index) => {
  const newFilename = `slide${index + 1}.jpg`;  // Новое имя
  console.log(`  ${index + 1}. ${slide.filename} → ${newFilename}`);
  formData.append('slides', slide.file, newFilename);
});
```

**Пример логов в консоли браузера (F12):**
```
Начинаем загрузку: 3 слайдов, название: "Моя презентация"
Добавляем файлы (с переименованием):
  1. Slide1.jpeg → slide1.jpg
  2. slide2.jpg → slide2.jpg
  3. SLIDE3.JPG → slide3.jpg
Отправляем запрос на сервер...
```

### 4️⃣ Валидация на сервере (Backend)

**Файл:** `/backend/slides_admin.py` - endpoint `POST /admin/slides/upload-from-files`

Сервер проверяет, что файлы пришли в правильном формате (`slide1.jpg`, `slide2.jpg` и т.д.), и сохраняет их в стандартной директории.

## Примеры использования

### Сценарий 1: Файлы с разными расширениями и регистром
```
Папка содержит:
  - Slide1.JPEG
  - Slide2.jpg
  - SLIDE3.jpeg

Результат:
  ✓ Все файлы принимаются
  ✓ Сортируются по номеру
  ✓ Переименовываются в: slide1.jpg, slide2.jpg, slide3.jpg
  ✓ Загружаются на сервер с правильными именами
```

### Сценарий 2: Файлы с разными названиями
```
Папка содержит:
  - Photo1.jpg      ❌ Отклонен (не начинается с "slide")
  - Slide2.jpeg     ✓ Принят → slide1.jpg
  - Image3.jpg      ❌ Отклонен (не начинается с "slide")
  - slide4.jpg      ✓ Принят → slide2.jpg

Результат:
  2 слайда загружены (они становятся slide1.jpg и slide2.jpg)
```

### Сценарий 3: Неправильный порядок файлов
```
Папка содержит (в этом порядке):
  - slide3.jpg
  - slide1.jpg
  - slide2.jpg

Frontend сортирует по номеру:
  1. slide1.jpg → slide1.jpg
  2. slide2.jpg → slide2.jpg
  3. slide3.jpg → slide3.jpg

Результат:
  Слайды загружаются в правильном порядке 1→2→3
```

## Технические детали

### Frontend фильтр (handleFolderSelect)
```javascript
const slideFiles = Array.from(files).filter(f => {
  const name = f.name.toLowerCase();
  const isImageFile = name.endsWith('.jpg') || name.endsWith('.jpeg');
  const isSlideFile = name.startsWith('slide');
  return isImageFile && isSlideFile;
}).sort((a, b) => {
  const numA = parseInt(a.name.match(/\d+/)?.[0]) || 0;
  const numB = parseInt(b.name.match(/\d+/)?.[0]) || 0;
  return numA - numB;
});
```

### Frontend переименование (handleUploadSlidesFromFolder)
```javascript
checkedSlides.forEach((slide, index) => {
  const newFilename = `slide${index + 1}.jpg`;
  formData.append('slides', slide.file, newFilename);
});
```

### Backend валидация (upload_slides_from_files)
```python
match = re.match(r'^slide(\d+)\.(jpg|jpeg)$', file.filename.lower())
if not match:
    raise HTTPException(detail=f"Имя файла {file.filename} должно быть в формате: slide1.jpg")
```

## Отладка

Чтобы увидеть логи переименования:

1. Откройте браузер (F12)
2. Перейдите на вкладку **Console**
3. Выберите папку со слайдами
4. Нажмите кнопку "Загрузить"
5. Посмотрите логи:
   ```
   Начинаем загрузку: X слайдов...
   Добавляем файлы (с переименованием):
     1. ИсходноеИмя.jpg → slide1.jpg
     2. ДругоеИмя.jpeg → slide2.jpg
     ...
   ```

## Поддерживаемые форматы имён файлов

✅ **Принимаются:**
- `slide1.jpg`, `slide2.jpg`, ... (стандартный формат)
- `Slide1.jpg`, `SLIDE2.jpg` (разный регистр)
- `slide_1.jpg`, `slide-2.jpg` (с разделителями)
- `slide 1.jpg`, `slide_1.jpeg` (разные варианты)
- `slide1.jpeg`, `slide2.JPEG` (разные расширения)

❌ **Не принимаются:**
- Файлы не начинающиеся с "slide"
- Файлы не в формате jpg/jpeg
- Слайды с пропусками нумерации (например: slide1, slide3 - пропущен slide2)

## Будущие улучшения

Возможные улучшения:
- Автоматическое преобразование других форматов (PNG → JPG)
- Перекодирование больших файлов
- Проверка ориентации изображения
- Автоматическое выравнивание размера изображений
