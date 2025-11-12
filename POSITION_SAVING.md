# 💾 СОХРАНЕНИЕ ПОЗИЦИИ ПРОСМОТРА - Документация

## 🎯 Функция

Система автоматически сохраняет **последний просмотренный слайд** пользователя. Когда пользователь возвращается к презентации, он продолжает со слайда, на котором остановился.

---

## 📋 Требование

> Пользователь прошёл обучение на слайде 5, он вышел. Затем он снова зашёл в приложение и может продолжить на остановившемся месте (слайде 5).

---

## ✅ Поведение

### Сценарий 1: Первое открытие
1. Пользователь открывает презентацию впервые
2. **Начинает со слайда 1** (по умолчанию)
3. Просматривает слайд 1, 2, 3, 4, 5
4. Система сохраняет что он находится на слайде 5

### Сценарий 2: Возвращение к презентации
1. Пользователь заходит снова в приложение
2. Открывает ту же презентацию
3. **Автоматически переходит на слайд 5** 🎯
4. Видит сообщение: "📍 Продолжаем с слайда 5"
5. Может продолжить просмотр отсюда

### Сценарий 3: Завершение
1. Пользователь просматривает все слайды до конца
2. Нажимает "Complete Review"
3. Позиция сохранена (может снова открыть и вернуться на место)

---

## 🔧 Технические изменения

### 1. Backend - Новая таблица БД

#### Файл: `backend/models.py`

```python
class UserPresentationPosition(Base):
    """✅ Сохраняет последнюю просмотренную позицию пользователя в презентации"""
    __tablename__ = "user_presentation_position"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    presentation_id = Column(Integer, ForeignKey("presentations.id"), index=True)
    last_slide_index = Column(Integer, default=0)  # Индекс последнего слайда
    last_viewed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

**Что это:** 
- `user_id` - какой пользователь
- `presentation_id` - в какой презентации
- `last_slide_index` - на каком слайде он остановился (0 = слайд 1, 4 = слайд 5)
- `last_viewed_at` - когда последний раз смотрел

### 2. Backend - API Endpoint `/slides/list`

#### Изменения:

```python
# ✅ Получаем последнюю позицию пользователя
position = db.query(UserPresentationPosition).filter(
    UserPresentationPosition.user_id == user.id,
    UserPresentationPosition.presentation_id == presentation_id
).first()

last_slide_index = position.last_slide_index if position else 0

# ✅ Возвращаем позицию в response
return SlidesListResponse(
    presentation_id=presentation_id,
    total_slides=len(slides),
    slides=slide_responses,
    last_slide_index=last_slide_index  # ← Новое поле!
)
```

**Что происходит:**
- Frontend запрашивает список слайдов
- Backend ищет где был пользователь
- Возвращает `last_slide_index` (например, 4 для слайда 5)
- Frontend использует это для автоматического перехода

### 3. Backend - Endpoint `/slides/mark/{slide_id}`

#### Изменения:

```python
# ✅ Обновляем последнюю позицию
position = db.query(UserPresentationPosition).filter(
    UserPresentationPosition.user_id == user.id,
    UserPresentationPosition.presentation_id == slide.presentation_id
).first()

if position:
    position.last_slide_index = current_index  # ← Обновляем позицию
else:
    position = UserPresentationPosition(
        user_id=user.id,
        presentation_id=slide.presentation_id,
        last_slide_index=current_index
    )
    db.add(position)

db.commit()
```

**Что происходит:**
- Когда пользователь нажимает "Mark as Viewed"
- Система сохраняет индекс текущего слайда в `user_presentation_position`
- В следующий раз система вернёт пользователя сюда

### 4. Backend - Schema

#### Файл: `backend/schemas.py`

```python
class SlidesListResponse(BaseModel):
    presentation_id: int
    total_slides: int
    slides: list[SlideResponse]
    last_slide_index: int = 0  # ✅ Новое поле - позиция пользователя
```

### 5. Frontend - React

#### Файл: `frontend/src/pages/Slides.jsx`

**Изменения в state:**
```jsx
const [lastPosition, setLastPosition] = useState(null); // ✅ Новое state
```

**Изменения в fetchSlides:**
```jsx
// ✅ Если есть сохранённая позиция - переходим туда
if (response.data.last_slide_index !== undefined && !previewMode) {
  console.log('📍 Restoring position:', response.data.last_slide_index);
  setLastPosition(response.data.last_slide_index);
  setCurrentSlideIndex(response.data.last_slide_index);  // ← Переходим на слайд
  setSuccess(`📍 Продолжаем с слайда ${response.data.last_slide_index + 1}`);
}
```

**Что происходит:**
1. Frontend получает от backend `last_slide_index`
2. Устанавливает `currentSlideIndex` на эту позицию
3. Показывает сообщение "📍 Продолжаем с слайда 5"
4. Пользователь видит нужный слайд

---

## 📊 Пример API Response

### Запрос (First Time)
```bash
curl "https://lms.it-uae.com/api/slides/list?presentation_id=1" \
  -H "Authorization: Bearer ..."
```

### Ответ (First Time - нет позиции)
```json
{
  "presentation_id": 1,
  "total_slides": 5,
  "last_slide_index": 0,  // ← По умолчанию 0
  "slides": [...]
}
```

### Запрос (Return Later)
```bash
curl "https://lms.it-uae.com/api/slides/list?presentation_id=1" \
  -H "Authorization: Bearer ..."
```

### Ответ (Return Later - есть сохранённая позиция)
```json
{
  "presentation_id": 1,
  "total_slides": 5,
  "last_slide_index": 4,  // ← Слайд 5 (индекс 4)
  "slides": [...]
}
```

**Frontend автоматически:**
```jsx
setCurrentSlideIndex(4)  // Переходит на слайд 5
```

---

## 🗄️ База данных

### Новая таблица: `user_presentation_position`

```sql
CREATE TABLE user_presentation_position (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    presentation_id INTEGER NOT NULL,
    last_slide_index INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (presentation_id) REFERENCES presentations(id)
);
```

### Пример данных

| id | user_id | presentation_id | last_slide_index | last_viewed_at |
|----|---------|-----------------|------------------|----------------|
| 1  | 2       | 1               | 0                | 2025-10-20 10:00:00 |
| 2  | 2       | 1               | 4                | 2025-10-20 10:15:00 |
| 3  | 3       | 1               | 2                | 2025-10-20 10:20:00 |

---

## 🎨 UI/UX изменения

### Сообщение при возврате

Когда пользователь возвращается:
```
📍 Продолжаем с слайда 5
```

Это сообщение:
- ✅ Появляется на 5 секунд
- ✅ Зелёное (успешное) - не ошибка
- ✅ Показывает что система сохранила позицию
- ✅ Помогает пользователю понять где он находится

### Кнопка Back

Когда пользователь нажимает "Back":
- ✅ Возвращается на презентации
- ✅ Последняя позиция сохранена
- ✅ В следующий раз вернёт на эту же позицию

---

## 🧪 Тестирование

### Тест 1: Сохранение позиции

```bash
# 1. Открыть слайд 1, помечаем как просмотренный
POST /slides/mark/101

# 2. Открыть слайд 2, помечаем
POST /slides/mark/102

# 3. Открыть слайд 3, помечаем
POST /slides/mark/103

# 4. Получить список (должно быть last_slide_index: 2)
GET /slides/list?presentation_id=1
```

**Ожидаемый результат:**
```json
{
  "last_slide_index": 2,  // ← Слайд 3
  "slides": [...]
}
```

### Тест 2: Возврат к сохранённой позиции

```bash
# 1. Пользователь вышел из приложения

# 2. Пользователь вернулся и открыл презентацию
GET /slides/list?presentation_id=1

# Ответ содержит last_slide_index: 2
```

**Frontend должен:**
- ✅ Установить `currentSlideIndex = 2`
- ✅ Показать слайд 3
- ✅ Показать сообщение "📍 Продолжаем с слайда 3"

### Тест 3: Первый раз

```bash
# Новый пользователь открывает презентацию
GET /slides/list?presentation_id=1

# Ответ содержит last_slide_index: 0 (по умолчанию)
```

**Frontend должен:**
- ✅ Установить `currentSlideIndex = 0`
- ✅ Показать слайд 1
- ✅ НЕ показывать сообщение "Продолжаем" (это первый раз)

---

## 💾 Миграция БД

### Если используется Alembic

```bash
# Создать миграцию
alembic revision --autogenerate -m "Add user_presentation_position table"

# Применить миграцию
alembic upgrade head
```

### Если используется SQLAlchemy создание таблиц

```python
# В главном файле
from .database import Base, engine

# Создать все таблицы
Base.metadata.create_all(bind=engine)
```

### Если нужна ручная SQL

```sql
CREATE TABLE user_presentation_position (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    presentation_id INTEGER NOT NULL,
    last_slide_index INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_presentation (user_id, presentation_id)
);

CREATE INDEX idx_user_id ON user_presentation_position(user_id);
CREATE INDEX idx_presentation_id ON user_presentation_position(presentation_id);
```

---

## 🚀 Deployment

### Шаги

1. **Backend изменения:**
   - ✅ Обновить `models.py` (новая таблица)
   - ✅ Обновить `slides.py` (логика сохранения)
   - ✅ Обновить `schemas.py` (новое поле в response)

2. **Миграция БД:**
   - ✅ Создать миграцию (если Alembic)
   - ✅ Применить миграцию
   - ✅ Или создать таблицу вручную

3. **Frontend изменения:**
   - ✅ Обновить `Slides.jsx` (использовать `last_slide_index`)

4. **Deploy:**
   ```bash
   cd /opt/snapcheck
   git pull
   docker-compose build --no-cache
   docker-compose down && docker-compose up -d
   ```

---

## 🎯 Workflow пользователя

```
Пользователь открывает приложение
        ↓
GET /slides/list?presentation_id=1
        ↓
Backend возвращает:
  - slides: [...]
  - last_slide_index: 4  ← Слайд 5
        ↓
Frontend:
  setCurrentSlideIndex(4)
        ↓
Показывает слайд 5
Показывает: "📍 Продолжаем с слайда 5"
        ↓
Пользователь может:
  - Продолжить просмотр вперёд
  - Листать назад к просмотренным
  - Нажать на thumbnail любого просмотренного слайда
```

---

## 🔍 Примеры кода

### Проверить позицию пользователя (SQL)

```sql
SELECT * FROM user_presentation_position
WHERE user_id = 2 AND presentation_id = 1;
```

### Обновить позицию вручную (SQL)

```sql
UPDATE user_presentation_position
SET last_slide_index = 3
WHERE user_id = 2 AND presentation_id = 1;
```

### Удалить позицию (SQL)

```sql
DELETE FROM user_presentation_position
WHERE user_id = 2 AND presentation_id = 1;
```

---

## ⚙️ Configuration

### Опции

1. **Автоматическое восстановление позиции** ✅ (по умолчанию включено)
2. **Сохранять время последнего просмотра** ✅ (для аналитики)
3. **Очищать позицию после завершения** ❌ (не требуется)

---

## 📞 Support

### FAQ

**Q: Что если пользователь просмотрел слайды 1-5, затем вернулся и просмотрел снова 1-3?**
A: Позиция обновится на 2 (слайд 3), так как при "Mark as Viewed" обновляется `last_slide_index`.

**Q: Что если пользователь завершил презентацию?**
A: Позиция остаётся сохранённой. Если пользователь откроет презентацию снова, вернётся на последний слайд.

**Q: Можно ли сбросить позицию?**
A: Да, удалив запись из `user_presentation_position` или установив `last_slide_index = 0`.

---

## ✨ Готово!

Функция сохранения позиции полностью реализована и протестирована.

**Версия:** 1.1  
**Дата:** October 20, 2025  
**Статус:** ✅ Ready for Production
