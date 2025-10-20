# 🧪 API Тестирование - Последовательный просмотр слайдов

## 📌 Примеры API запросов и ответов

### 1️⃣ Получить список слайдов (GET `/slides/list`)

#### Запрос
```bash
curl -X GET "https://lms.it-uae.com/api/slides/list?presentation_id=1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Ответ (Успех) ✅
```json
{
  "presentation_id": 1,
  "total_slides": 5,
  "slides": [
    {
      "id": 101,
      "presentation_id": 1,
      "filename": "slide_1.png",
      "title": "Introduction",
      "order": 0,
      "viewed": true,
      "can_view": true
    },
    {
      "id": 102,
      "presentation_id": 1,
      "filename": "slide_2.png",
      "title": "Main Content",
      "order": 1,
      "viewed": false,
      "can_view": true
    },
    {
      "id": 103,
      "presentation_id": 1,
      "filename": "slide_3.png",
      "title": "Details",
      "order": 2,
      "viewed": false,
      "can_view": false
    },
    {
      "id": 104,
      "presentation_id": 1,
      "filename": "slide_4.png",
      "title": "Examples",
      "order": 3,
      "viewed": false,
      "can_view": false
    },
    {
      "id": 105,
      "presentation_id": 1,
      "filename": "slide_5.png",
      "title": "Summary",
      "order": 4,
      "viewed": false,
      "can_view": false
    }
  ]
}
```

**Интерпретация:**
- `viewed: true` - пользователь просмотрел слайд
- `viewed: false` - пользователь НЕ просмотрел слайд
- `can_view: true` - слайд доступен для просмотра
- `can_view: false` - слайд ЗАБЛОКИРОВАН (нужно просмотреть предыдущие)

---

### 2️⃣ Пометить слайд как просмотренный (POST `/slides/mark/{slide_id}`)

#### Запрос (Успех) ✅
```bash
curl -X POST "https://lms.it-uae.com/api/slides/mark/102" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

#### Ответ (Успех) ✅
```json
{
  "status": "success",
  "message": "Slide marked as viewed"
}
```

---

### 3️⃣ Попытка пометить слайд не по порядку (ОШИБКА) ❌

#### Запрос (Нарушение последовательности)
```bash
# Пользователь пытается пометить слайд 3, но не просмотрел слайд 2
curl -X POST "https://lms.it-uae.com/api/slides/mark/103" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

#### Ответ (Ошибка 403) ❌
```json
{
  "detail": "You must view slides in order. Please review slide 2 first."
}
```

**HTTP Status:** `403 Forbidden`

---

### 4️⃣ Правильная последовательность

#### Шаг 1: Просмотреть слайд 1 ✓
```bash
curl -X POST "https://lms.it-uae.com/api/slides/mark/101" \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json"
```
Ответ: `{"status": "success", "message": "Slide marked as viewed"}`

#### Шаг 2: Получить список (изменится `can_view`)
```bash
curl -X GET "https://lms.it-uae.com/api/slides/list?presentation_id=1" \
  -H "Authorization: Bearer ..."
```
Ответ:
```json
{
  "presentation_id": 1,
  "total_slides": 5,
  "slides": [
    {"id": 101, "viewed": true, "can_view": true},
    {"id": 102, "viewed": false, "can_view": true},  // ✅ Теперь доступен!
    {"id": 103, "viewed": false, "can_view": false},
    {"id": 104, "viewed": false, "can_view": false},
    {"id": 105, "viewed": false, "can_view": false}
  ]
}
```

#### Шаг 3: Просмотреть слайд 2 ✓
```bash
curl -X POST "https://lms.it-uae.com/api/slides/mark/102" \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json"
```
Ответ: `{"status": "success", "message": "Slide marked as viewed"}`

#### Шаг 4: Теперь слайд 3 доступен ✓
```bash
# Повторить GET /slides/list
# Слайд 3 теперь будет с can_view: true
```

---

### 5️⃣ Получить прогресс (GET `/slides/progress`)

#### Запрос
```bash
curl -X GET "https://lms.it-uae.com/api/slides/progress?presentation_id=1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Ответ ✅
```json
{
  "presentation_id": 1,
  "viewed_count": 2,
  "total_count": 5,
  "percentage": 40.0
}
```

---

### 6️⃣ Завершить презентацию (POST `/slides/complete`)

#### Запрос (все слайды просмотрены) ✅
```bash
curl -X POST "https://lms.it-uae.com/api/slides/complete" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

#### Ответ (Успех) ✅
```json
{
  "status": "success",
  "message": "Presentation completed"
}
```

---

### 7️⃣ Попытка завершить без просмотра всех (ОШИБКА) ❌

#### Запрос
```bash
curl -X POST "https://lms.it-uae.com/api/slides/complete" \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json"
```

#### Ответ (Ошибка) ❌
```json
{
  "status": "error",
  "message": "Not all slides viewed",
  "missing_slides": [3, 4, 5]
}
```

---

## 🧪 Сценарии тестирования

### Сценарий 1: Нормальный пользователь 👤

```bash
#!/bin/bash
TOKEN="your_token_here"
API="https://lms.it-uae.com/api"

# 1. Получить список
echo "🔄 Получаем список слайдов..."
curl -s "$API/slides/list?presentation_id=1" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 2. Попытка перейти на слайд 2 (должна быть ошибка)
echo -e "\n❌ Попытка пометить слайд 2 БЕЗ слайда 1..."
curl -s -X POST "$API/slides/mark/102" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# 3. Пометить слайд 1
echo -e "\n✅ Помечаем слайд 1..."
curl -s -X POST "$API/slides/mark/101" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# 4. Теперь пометить слайд 2 (должно работать)
echo -e "\n✅ Помечаем слайд 2..."
curl -s -X POST "$API/slides/mark/102" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# 5. Проверить прогресс
echo -e "\n📊 Проверяем прогресс..."
curl -s "$API/slides/progress?presentation_id=1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

### Сценарий 2: Попытка обхода системы 🚫

```bash
#!/bin/bash
TOKEN="your_token_here"
API="https://lms.it-uae.com/api"

# Попытка 1: Пометить слайд 3 сразу
echo "❌ Попытка 1: Помечаем слайд 3 (пропуская 1 и 2)..."
curl -s -X POST "$API/slides/mark/103" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# Попытка 2: Пометить слайд 5 сразу
echo -e "\n❌ Попытка 2: Помечаем слайд 5 (пропуская 1-4)..."
curl -s -X POST "$API/slides/mark/105" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# Все должны вернуть 403 Forbidden
```

---

## 📝 Логирование в приложении

### Frontend console
```javascript
// Когда пользователь пытается нажать "Next"
console.log('🔍 Checking slide:', currentSlide);
console.log('Viewed:', currentSlide.viewed);
console.log('Can proceed:', currentSlide.viewed);

// Когда API возвращает ошибку
console.error('❌ Error response:', err.response?.data);
console.error('Status code:', err.response?.status);
```

### Backend logs
```bash
# Посмотреть логи
docker-compose logs backend -f

# Фильтр по ошибкам
docker-compose logs backend | grep ERROR

# Фильтр по успехам
docker-compose logs backend | grep "success"
```

---

## ✅ Checklist перед продакшеном

- [ ] Все API endpoints возвращают правильные HTTP коды
- [ ] Поле `can_view` правильно вычисляется
- [ ] Система правильно блокирует нарушение последовательности
- [ ] Frontend показывает правильные ошибки
- [ ] Thumbnail навигация работает корректно
- [ ] Preview mode админа не имеет ограничений
- [ ] Прогресс-бар обновляется правильно
- [ ] Кнопка "Complete" работает только при просмотре всех слайдов

---

## 🔗 Полезные команды для тестирования

### Получить валидный токен
```bash
curl -X POST "https://lms.it-uae.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password"
  }' | jq '.access_token'
```

### Сохранить токен в переменную
```bash
TOKEN=$(curl -s -X POST "https://lms.it-uae.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.access_token')

echo $TOKEN
```

### Красивый вывод JSON
```bash
# Установить jq если нет
apt install jq  # Ubuntu/Debian
brew install jq  # macOS

# Использовать в curl
curl -s ... | jq .
```

---

**Дата создания:** October 20, 2025  
**Версия:** 1.0  
**Статус:** ✅ Ready for Testing
