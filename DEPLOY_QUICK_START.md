# ⚡ QUICK START - Deploy на продакшен за 5 минут

## 🚀 Быстрый запуск

### Вариант 1: Через Git (рекомендуется) ✅

```bash
# На сервере
cd /opt/snapcheck

# 1. Получить последние изменения (30 сек)
git pull origin main

# 2. Пересоздать образы (2-3 минуты)
docker-compose build --no-cache

# 3. Перезагрузить (30 сек)
docker-compose down && docker-compose up -d

# 4. Проверить (30 сек)
docker-compose ps
docker-compose logs backend | head -20
```

**Итого:** ~4 минуты ⏱️

---

### Вариант 2: Через SFTP (если Git не настроен)

```bash
# На локальной машине
# 1. SFTP extension автоматически загружает файлы при Ctrl+S

# На сервере
cd /opt/snapcheck
docker-compose build --no-cache
docker-compose restart
```

---

## ✅ Что проверить после деплоя

### Тест 1: Сервис запущен
```bash
curl -s https://lms.it-uae.com/api/slides/list \
  -H "Authorization: Bearer TEST_TOKEN" | jq . | head -20
```
Должен вернуть JSON с `can_view` полями ✓

### Тест 2: Помечаем слайд
```bash
curl -X POST https://lms.it-uae.com/api/slides/mark/1 \
  -H "Authorization: Bearer TEST_TOKEN" \
  -H "Content-Type: application/json"
```
Должен вернуть `{"status": "success"}` ✓

### Тест 3: Открыть в браузере
```
https://lms.it-uae.com/
```
- Войти как пользователь
- Открыть презентацию
- Попробовать нажать "Next" без "Mark as Viewed"
- Должна быть ошибка ❌
- Нажать "Mark as Viewed"
- Теперь "Next" работает ✅

---

## 🔧 Решение проблем (быстро)

### Ошибка при сборке
```bash
docker-compose build --no-cache
# или
docker system prune -a --volumes
docker-compose build --no-cache
```

### Контейнеры не запускаются
```bash
docker-compose logs backend
# Посмотреть ошибку и исправить
git revert HEAD
```

### API не отвечает
```bash
docker-compose restart backend
# или полный перестарт
docker-compose down && docker-compose up -d
```

---

## 📋 Финальный чеклист

- [ ] Git pull выполнен
- [ ] Docker build завершился без ошибок
- [ ] Контейнеры запущены (`docker-compose ps`)
- [ ] Backend отвечает на API запросы
- [ ] Frontend загружается в браузере
- [ ] Слайды отображаются правильно
- [ ] "Mark as Viewed" помечает слайд
- [ ] "Next" блокирован если слайд не помечен
- [ ] Thumbnail навигация работает
- [ ] Preview mode администратора работает

---

## 📞 Emergency Rollback

Если что-то сломалось:

```bash
cd /opt/snapcheck

# Откатить на предыдущий commit
git revert HEAD

# Пересоздать
docker-compose build --no-cache
docker-compose down && docker-compose up -d

# Проверить
docker-compose ps
```

---

## ⏱️ Timeline

| Шаг | Время |
|-----|-------|
| `git pull` | 30 сек |
| `docker-compose build` | 2-3 мин |
| `docker-compose restart` | 30 сек |
| Тестирование | 1 мин |
| **ИТОГО** | **~4 минут** ⚡ |

---

**✅ Готово к деплою!**
