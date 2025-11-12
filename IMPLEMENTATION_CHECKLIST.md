# ✅ Чеклист реализации - Последовательный просмотр слайдов

## 📦 Измененные файлы

### Backend
- ✅ `/backend/slides.py` - добавлена логика проверки последовательности
- ✅ `/backend/schemas.py` - добавлено поле `can_view`

### Frontend  
- ✅ `/frontend/src/pages/Slides.jsx` - обновлены все функции навигации

### Документация
- ✅ `/SEQUENTIAL_SLIDE_VIEWING.md` - полная документация функции

---

## 🔄 Процесс развёртывания

### Шаг 1: Проверить изменения локально ✓

```bash
# На локальной машине - проверить что всё синтаксис верен
cd /Users/rakhat/Documents/webhosting/SnapCheck

# Проверить Python синтаксис
python3 -m py_compile backend/slides.py
python3 -m py_compile backend/schemas.py

# Проверить React компонент (если есть linter)
cd frontend
npm run lint  # если настроено
cd ..
```

### Шаг 2: Копировать файлы на сервер

```bash
# Способ 1: Git push (рекомендуется)
git add backend/slides.py backend/schemas.py frontend/src/pages/Slides.jsx
git commit -m "feat: implement sequential slide viewing with mandatory confirmation"
git push origin main

# Способ 2: SFTP (если настроена)
# Файлы автоматически загружаются через SFTP extension

# Способ 3: Вручную на сервере
scp backend/slides.py root@88.99.124.218:/opt/snapcheck/backend/
scp backend/schemas.py root@88.99.124.218:/opt/snapcheck/backend/
scp frontend/src/pages/Slides.jsx root@88.99.124.218:/opt/snapcheck/frontend/src/pages/
```

### Шаг 3: Перестроить Docker образы

```bash
# На сервере
cd /opt/snapcheck

# Пересоздать образы (займёт 3-5 минут)
docker-compose build --no-cache

# Или быстро (используя кэш)
docker-compose build
```

### Шаг 4: Перезагрузить контейнеры

```bash
# Остановить текущие
docker-compose down

# Запустить новые
docker-compose up -d

# Проверить статус
docker-compose ps

# Посмотреть логи (проверить на ошибки)
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Шаг 5: Протестировать

```bash
# Открыть браузер
# https://lms.it-uae.com/

# Шаги теста:
# 1. Войти как пользователь
# 2. Открыть презентацию
# 3. На слайде 1: 
#    - Попробовать нажать "Next" БЕЗ "Mark as Viewed"
#    - Должна быть ошибка ✓
# 4. Нажать "Mark as Viewed"
# 5. Теперь "Next" работает ✓
# 6. Попробовать кликнуть на thumbnail слайда 3
#    - Должна быть ошибка ✓
# 7. Просмотреть слайд 2
# 8. Теперь доступен слайд 3 ✓
```

---

## 🐛 Решение проблем

### Проблема: Backend не перестраивается

```bash
# Очистить кэш Docker
docker-compose build --no-cache backend

# Если ошибка - посмотреть логи сборки
docker-compose build backend 2>&1 | tail -50

# Проверить синтаксис Python
docker exec snapcheck-backend python -m py_compile /app/slides.py
```

### Проблема: Frontend не перестраивается

```bash
# Очистить кэш и пересоздать
docker-compose build --no-cache frontend

# Проверить логи
docker-compose logs frontend | tail -100

# Проверить что файл на месте
docker exec snapcheck-frontend ls -la /usr/share/nginx/html/
```

### Проблема: Слайды не отображаются

```bash
# Проверить что API работает
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://lms.it-uae.com/api/slides/list?presentation_id=1

# Проверить logs backend
docker-compose logs backend | grep -i error

# Перезагрузить backend
docker-compose restart backend
```

### Проблема: 403 Forbidden при попытке просмотреть слайд

✓ Это **нормально** - означает что система работает! 
- Пользователь пытается просмотреть слайд не в последовательности
- Система правильно его блокирует
- Нужно просмотреть предыдущие слайды сначала

---

## 📊 Откат (если что-то сломалось)

### Вернуться на предыдущую версию

```bash
# На сервере - откатить последний commit
cd /opt/snapcheck
git log --oneline | head -5  # посмотреть историю

# Откатить на предыдущий commit
git revert HEAD

# Или hard reset (опасно!)
git reset --hard HEAD~1

# Пересоздать образы
docker-compose build --no-cache

# Перезагрузить
docker-compose down
docker-compose up -d
```

---

## 🎯 Checklist постпроверки

### Backend ✓
- [ ] Поле `can_view` добавлено в schema
- [ ] Функция `/slides/list` возвращает `can_view` для каждого слайда
- [ ] Функция `/slides/mark/{slide_id}` проверяет последовательность
- [ ] При нарушении последовательности возвращается 403 Forbidden
- [ ] Docker контейнер успешно стартует без ошибок

### Frontend ✓
- [ ] Функция `handleNext()` проверяет что слайд помечен как viewed
- [ ] При нарушении показывается ошибка
- [ ] Функция `handleMarkViewed()` показывает успешное сообщение
- [ ] Кнопка "Next" меняет цвет на оранжевый если слайд не просмотрен
- [ ] Thumbnail навигация блокирует доступ к непросмотренным слайдам
- [ ] Preview mode администратора работает без ограничений
- [ ] Все сообщения об ошибках отображаются корректно

### Функциональность ✓
- [ ] Можно просмотреть слайд 1 (всегда доступен)
- [ ] После "Mark as Viewed" слайд становится зелёным
- [ ] Кнопка "Next" становится активной
- [ ] Нельзя перейти на слайд 2 без отметки слайда 1
- [ ] Нельзя перейти на слайд 3 без отметки слайдов 1 и 2
- [ ] Нельзя нажать thumbnail непросмотренного слайда
- [ ] Можно листать НАЗАД на просмотренные слайды
- [ ] После просмотра всех - кнопка "Complete Review" активна

### Performance ✓
- [ ] Слайды загружаются быстро (< 2 сек)
- [ ] Нет задержек при переходе между слайдами
- [ ] API отвечает быстро (< 1 сек)

---

## 📞 Поддержка

При возникновении проблем:

1. **Проверить логи:**
   ```bash
   docker-compose logs backend -f
   docker-compose logs frontend -f
   ```

2. **Перезагрузить контейнеры:**
   ```bash
   docker-compose restart
   ```

3. **Очистить и пересоздать:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

4. **Откатить изменения:**
   ```bash
   git revert HEAD
   docker-compose build --no-cache
   docker-compose up -d
   ```

---

## ✨ Готово!

После завершения всех шагов функция **последовательного просмотра слайдов** будет полностью рабочей!

**Дата развёртывания:** October 20, 2025  
**Версия:** 1.0  
**Статус:** ✅ Ready
