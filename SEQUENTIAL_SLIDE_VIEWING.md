# 🎯 Последовательный просмотр слайдов (Sequential Slide Viewing)

## 📋 Описание функции

Реализована система **обязательного последовательного просмотра слайдов** с подтверждением. Пользователь может просматривать слайды только по порядку:

- ✅ Может просмотреть **первый слайд** сразу
- ✅ Может перейти на **следующий слайд** только после нажатия кнопки **"Mark as Viewed"**
- ✅ Может листать **назад** (к уже просмотренным слайдам)
- ❌ **Не может** пропустить слайд и перейти на следующий без подтверждения
- ❌ **Не может** нажать кнопку thumbnail для непросмотренного слайда
- ❌ **Не может** просто кликнуть "Next" без отметки текущего слайда

---

## 🔧 Технические изменения

### Backend (`backend/slides.py`)

#### 1. Добавлена логика проверки доступности слайдов в `/slides/list`

```python
# Каждый слайд получает поле can_view которое проверяет:
# - Это первый слайд? (всегда доступен)
# - Все предыдущие слайды просмотрены пользователем?

can_view = idx == 0  # Первый слайд
if not can_view and idx > 0:
    can_view = all(
        db.query(UserSlideProgress).filter(
            UserSlideProgress.user_id == user.id,
            UserSlideProgress.slide_id == prev_slide.id,
            UserSlideProgress.viewed == True
        ).first() is not None
        for prev_slide in previous_slides
    )
```

#### 2. Добавлена проверка в `/slides/mark/{slide_id}` endpoint

Перед отметкой слайда как просмотренного проверяется:
- Все ли предыдущие слайды уже просмотрены?
- Если нет - возвращается ошибка 403 Forbidden

```python
# Проверяем просмотрены ли все предыдущие слайды
if current_index > 0:
    for prev_slide in all_slides[:current_index]:
        prev_progress = db.query(UserSlideProgress).filter(
            UserSlideProgress.user_id == user.id,
            UserSlideProgress.slide_id == prev_slide.id,
            UserSlideProgress.viewed == True
        ).first()
        
        if not prev_progress:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You must view slides in order. Please review slide {prev_slide.order + 1} first."
            )
```

### Backend (`backend/schemas.py`)

#### Добавлено поле `can_view` в `SlideResponse`

```python
class SlideResponse(BaseModel):
    id: int
    presentation_id: int
    filename: str
    title: Optional[str] = None
    order: int
    viewed: bool = False
    can_view: bool = True  # ✅ Новое поле
```

### Frontend (`frontend/src/pages/Slides.jsx`)

#### 1. Улучшена функция `handleNext()`

Теперь проверяет что текущий слайд помечен как просмотренный:

```jsx
const handleNext = () => {
  if (currentSlideIndex < slides.length - 1) {
    const currentSlide = slides[currentSlideIndex];
    
    if (!currentSlide.viewed && !isPreviewMode) {
      setError('❌ Please mark this slide as "Viewed" before moving to the next slide');
      return;
    }
    
    setCurrentSlideIndex(currentSlideIndex + 1);
  }
};
```

#### 2. Улучшена функция `handleMarkViewed()`

Теперь показывает успешное сообщение и очищает ошибки:

```jsx
const handleMarkViewed = async () => {
  // ... проверка и API call ...
  
  const newSlides = [...slides];
  newSlides[currentSlideIndex].viewed = true;
  setSlides(newSlides);
  setError(''); // ✅ Очищаем ошибки
  setSuccess('✅ Slide marked as viewed!');
  fetchProgress();
};
```

#### 3. Умная кнопка "Next" с визуальными подсказками

- 🔴 **Оранжевая** - если текущий слайд не просмотрен (нельзя нажать)
- ⚫ **Серая** - если это последний слайд (нельзя нажать)
- ✅ **Серая активная** - если можно перейти на следующий

```jsx
<button
  onClick={handleNext}
  disabled={isLastSlide || (!isPreviewMode && !currentSlide.viewed)}
  className={`... ${
    isLastSlide 
      ? 'bg-gray-600 text-white opacity-30'
      : !isPreviewMode && !currentSlide.viewed
      ? 'bg-orange-500 text-white hover:bg-orange-600'  // ⚠️ Подсказка
      : 'bg-gray-600 text-white hover:bg-gray-700'
  }`}
  title={
    isLastSlide 
      ? 'Last slide' 
      : !isPreviewMode && !currentSlide.viewed
      ? 'Mark current slide as viewed first'
      : 'Next slide'
  }
>
  Next <ChevronRight size={14} />
</button>
```

#### 4. Улучшена логика thumbnail навигации

Thumbnail слайдов теперь:
- ✅ **Зелёные** - просмотренные слайды (доступны)
- ⚪ **Серые светлые** - доступные непросмотренные слайды (первый слайд)
- 🔒 **Серые тёмные** - недоступные слайды (заблокированы)

```jsx
{slides.map((slide, idx) => {
  let isAccessible = idx === 0; // Первый слайд
  
  if (!isAccessible && idx > 0 && !isPreviewMode) {
    isAccessible = slides.slice(0, idx).every(s => s.viewed);
  }
  
  return (
    <button
      onClick={() => {
        if (isAccessible || isPreviewMode) {
          setCurrentSlideIndex(idx);
        } else {
          setError('❌ Please review all previous slides first');
        }
      }}
      disabled={!isAccessible && !isPreviewMode}
      className={`... ${
        idx === currentSlideIndex
          ? 'bg-blue-600 text-white ring-1 ring-blue-400'
          : slide.viewed
          ? 'bg-green-100 text-green-700'
          : isAccessible || isPreviewMode
          ? 'bg-gray-200 text-gray-700'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
      }`}
    >
      {idx + 1}
    </button>
  );
})}
```

---

## 🎨 Поведение пользователя

### Нормальный сценарий ✅

1. Пользователь открывает презентацию
2. Видит слайд 1 (доступен)
3. Читает информацию на слайде 1
4. Нажимает кнопку **"Mark as Viewed"** ✅
5. Слайд 1 помечается зелёным цветом в thumbnail
6. Кнопка **"Next"** становится активной (серая)
7. Кликает **"Next"** и переходит на слайд 2
8. Повторяет процесс для всех слайдов
9. На последнем слайде после "Mark as Viewed" - может нажать **"Complete Review"**

### Попытка пропустить слайд ❌

1. Пользователь пытается нажать **"Next"** без "Mark as Viewed"
2. Кнопка **"Next"** становится оранжевой (заблокирована)
3. Появляется сообщение: "❌ Please mark this slide as 'Viewed' before moving to the next slide"
4. Пользователь должен нажать **"Mark as Viewed"** прежде чем продолжить

### Попытка перейти по thumbnail ❌

1. Пользователь пытается нажать на thumbnail слайда 3, но не просмотрел слайды 1-2
2. Thumbnail слайда 3 заблокирован (серый, затемнённый)
3. При клике - появляется сообщение: "❌ Please review all previous slides first"

### Preview Mode (Администратор) ✅

- Кнопка "Mark as Viewed" отключена (Preview Mode)
- Кнопка "Next" всегда активна
- Thumbnail навигация всегда доступна
- Администратор может просматривать слайды в любом порядке

---

## 🔍 API Endpoints

### GET `/slides/list?presentation_id=123`

**Ответ включает:**
```json
{
  "presentation_id": 123,
  "total_slides": 5,
  "slides": [
    {
      "id": 1,
      "presentation_id": 123,
      "filename": "slide_1.png",
      "order": 0,
      "viewed": true,
      "can_view": true
    },
    {
      "id": 2,
      "presentation_id": 123,
      "filename": "slide_2.png",
      "order": 1,
      "viewed": false,
      "can_view": true
    },
    {
      "id": 3,
      "presentation_id": 123,
      "filename": "slide_3.png",
      "order": 2,
      "viewed": false,
      "can_view": false  // ⛔ Недоступен
    }
  ]
}
```

### POST `/slides/mark/{slide_id}`

**При попытке пометить слайд вне последовательности:**
```json
{
  "detail": "You must view slides in order. Please review slide 2 first."
}
```
Статус: **403 Forbidden**

---

## 🧪 Тестирование

### Тест 1: Последовательный просмотр
- [ ] Открыть слайд 1
- [ ] Нажать "Mark as Viewed"
- [ ] Кнопка "Next" должна быть активной
- [ ] Перейти на слайд 2
- [ ] Повторить для всех слайдов

### Тест 2: Попытка пропустить
- [ ] Открыть слайд 1
- [ ] Нажать "Next" без "Mark as Viewed"
- [ ] Должна быть ошибка: "Please mark this slide as 'Viewed'"
- [ ] Нажать "Mark as Viewed"
- [ ] Теперь "Next" работает

### Тест 3: Навигация по thumbnail
- [ ] На слайде 1 нажать на thumbnail слайда 3
- [ ] Должна быть ошибка: "Please review all previous slides first"
- [ ] Просмотреть слайды 1, 2
- [ ] Теперь можно нажать на thumbnail слайда 3

### Тест 4: Preview Mode
- [ ] Администратор открывает слайды в preview mode
- [ ] "Mark as Viewed" отключена (серая)
- [ ] "Next" всегда активна
- [ ] Можно переходить на любой слайд по thumbnail

### Тест 5: Завершение
- [ ] Просмотреть все слайды
- [ ] Нажать "Complete Review"
- [ ] Должно быть сообщение: "🎉 Review completed successfully!"

---

## 📊 Статус квадратиков (Thumbnails)

| Цвет | Значение | Действие |
|------|----------|----------|
| 🟦 Синий | Текущий слайд | Отображается |
| 🟩 Зелёный | Просмотренный | Доступен для клика |
| ⬜ Серый светлый | Доступный непросмотренный | Доступен (первый слайд) |
| 🟫 Серый тёмный | Недоступный | Заблокирован - нельзя кликать |

---

## 💾 Базы данных

Существующие таблицы используются как есть:
- `users` - пользователи
- `presentations` - презентации
- `slides` - слайды
- `user_slide_progress` - прогресс пользователя (просмотры)
- `user_completion` - завершённые презентации

**Новые колонки:** Нет! Все логика реализована на основе существующих данных.

---

## 🚀 Развёртывание

1. **Обновить backend код** → `/backend/slides.py`
2. **Обновить schemas** → `/backend/schemas.py`
3. **Обновить frontend код** → `/frontend/src/pages/Slides.jsx`
4. **Перезагрузить сервис**:
   ```bash
   docker-compose restart backend frontend
   ```

**Всё готово!** 🎉

---

## 📝 Примечания

- Функция работает как в обычном режиме пользователя, так и в preview режиме администратора
- В preview режиме администратор может смотреть слайды в любом порядке
- Система учитывает время просмотра через прогресс-бар
- Ошибки автоматически исчезают через 5 секунд
- Сообщения об ошибке теперь содержат более информативный текст

---

**Версия:** 1.0  
**Дата:** October 20, 2025  
**Статус:** ✅ Ready for Production
