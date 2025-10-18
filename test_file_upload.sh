#!/bin/bash

# Скрипт для тестирования нового endpoint загрузки файлов
# ./test_file_upload.sh

BACKEND_URL="http://localhost:8000"
ADMIN_EMAIL="admin@gss.aero"
ADMIN_PASSWORD="123456"

echo "🧪 Тестирование нового endpoint: POST /admin/slides/upload-from-files"
echo "=================================================="
echo ""

# 1. Логинимся и получаем токен
echo "1️⃣  Получение токена..."
TOKEN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Ошибка получения токена"
  echo "Ответ: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Токен получен: ${TOKEN:0:20}..."
echo ""

# 2. Создаем тестовые файлы
echo "2️⃣  Создание тестовых JPG файлов..."
TEST_DIR="/tmp/test_upload_$$"
mkdir -p "$TEST_DIR"

# Создаем простые файлы (если ImageMagick не установлен)
for i in 1 2 3; do
  echo "Fake JPG content for slide $i" > "$TEST_DIR/slide$i.jpg"
done

echo "✅ Созданы файлы:"
ls -lh "$TEST_DIR/" | tail -n +2 | awk '{print "   - " $9 " (" $5 ")"}'
echo ""

# 3. Загружаем слайды
echo "3️⃣  Загрузка слайдов через новый endpoint..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BACKEND_URL/admin/slides/upload-from-files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "presentation_title=Test Presentation $(date +%s)" \
  -F "slides=@$TEST_DIR/slide1.jpg" \
  -F "slides=@$TEST_DIR/slide2.jpg" \
  -F "slides=@$TEST_DIR/slide3.jpg")

echo "Ответ сервера:"
echo "$UPLOAD_RESPONSE" | jq . 2>/dev/null || echo "$UPLOAD_RESPONSE"
echo ""

# 4. Проверяем результат
if echo "$UPLOAD_RESPONSE" | jq -e '.status' >/dev/null 2>&1; then
  STATUS=$(echo "$UPLOAD_RESPONSE" | jq -r '.status')
  SLIDES_COUNT=$(echo "$UPLOAD_RESPONSE" | jq -r '.slides_count // 0')
  PRESENTATION_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.presentation.id // "unknown"')
  
  if [ "$STATUS" = "success" ]; then
    echo "✅ Успешно загружено $SLIDES_COUNT слайдов"
    echo "   ID презентации: $PRESENTATION_ID"
    echo ""
    
    # 5. Проверяем загруженные слайды
    echo "4️⃣  Получение информации о слайдах..."
    SLIDES_RESPONSE=$(curl -s -X GET "$BACKEND_URL/admin/slides/$PRESENTATION_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Найдено слайдов в БД:"
    echo "$SLIDES_RESPONSE" | jq '.slides[] | {id, order, title, filename}' 2>/dev/null
    echo ""
    
    echo "🎉 Все тесты пройдены успешно!"
  else
    echo "❌ Ошибка загрузки: $STATUS"
  fi
else
  echo "❌ Ошибка: неправильный ответ сервера"
fi

# 6. Очистка
echo ""
echo "5️⃣  Очистка тестовых файлов..."
rm -rf "$TEST_DIR"
echo "✅ Готово"
