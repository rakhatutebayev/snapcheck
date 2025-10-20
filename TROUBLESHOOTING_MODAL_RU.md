# 🚨 MODAL TROUBLESHOOTING GUIDE

## Проблема: Модальное окно не появляется

### 📊 Вероятные причины (в порядке вероятности)

1. **🥇 Кеш браузера** (80% вероятность)
   - Старая версия JavaScript в памяти браузера
   - Решение: Очистить кеш + hard refresh

2. **🥈 Dev server не перезагрузил код** (15% вероятность)
   - Vite не следил за изменениями
   - Решение: Перезагрузить dev server

3. **🥉 Файлы не сохранены правильно** (5% вероятность)
   - ConfirmModal.jsx или Slides.jsx не содержат правильный код
   - Решение: Проверить содержимое файлов

---

## 🔧 РЕШЕНИЕ #1: Очистить Кеш Браузера (ПОПРОБУЙ ПЕРВЫМ!)

### Шаг 1: Открыть меню очистки
```
macOS:     Cmd + Shift + Delete
Windows:   Ctrl + Shift + Delete
Linux:     Ctrl + Shift + Delete
```

### Шаг 2: Выбрать опции
```
Временный диапазон: "Всё время" / "All time"
Галочки отметить:
  ✓ Cookies
  ✓ Cached images and files
  ✓ Cached JavaScript and CSS
```

### Шаг 3: Нажать "Clear data" / "Очистить"

### Шаг 4: Hard Refresh
```
macOS:     Cmd + Shift + R
Windows:   Ctrl + Shift + R
Linux:     Ctrl + Shift + F5
```

### Шаг 5: Тестировать
```
1. Go to http://localhost:5173
2. Click "Next" without marking slide
3. Yellow modal should appear!
```

---

## 🔧 РЕШЕНИЕ #2: Перезагрузить Dev Server

### Если Решение #1 не помогло:

**Terminal где запущен npm run dev:**
```bash
# 1. Остановить
Ctrl + C

# 2. Очистить Vite кеш
rm -rf node_modules/.vite

# 3. Перезагрузить
npm run dev

# Ждите сообщения:
# ✓ built in 1.24s
# Local: http://localhost:5173/
```

**Browser:**
```
Hard Refresh: Cmd+Shift+R (Mac) или Ctrl+Shift+R (Windows)
```

---

## 🔧 РЕШЕНИЕ #3: Проверить Файлы

### Проверить что ConfirmModal создан:
```bash
cat frontend/src/components/ConfirmModal.jsx | head -20
```

**Должно быть:**
```jsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  ...
```

### Проверить что Slides.jsx импортирует ConfirmModal:
```bash
grep -n "import ConfirmModal" frontend/src/pages/Slides.jsx
```

**Должно показать:**
```
7:import ConfirmModal from '../components/ConfirmModal';
```

### Проверить что showSkipWarning в состоянии:
```bash
grep -n "showSkipWarning" frontend/src/pages/Slides.jsx
```

**Должно показать 3 строки:**
```
20:  const [showSkipWarning, setShowSkipWarning] = useState(false);
169:        setShowSkipWarning(true);
475:      isOpen={showSkipWarning}
```

---

## 🔍 ДИАГНОСТИКА: Открыть DevTools

**Нажми: F12**

### Вкладка Console
```
1. Нажми "Next" без отметки слайда
2. Должно появиться в консоли:
   ⚠️ User tried to skip slide without marking as viewed

3. Если нет ничего - значит handleNext не вызывается
4. Если есть ошибка - скопируй её
```

### Вкладка Network
```
1. Чистка Network tab (иконка с мусор бочкой)
2. Нажми "Next" без отметки
3. Должно быть 0 API запросов
4. Если есть запрос - значит handleNext вызывает что-то ещё
```

### Вкладка Elements (Inspect)
```
1.右-click на пустую область страницы
2. Select: "Inspect" / "Исследовать элемент"
3. Нажми Ctrl+F (Cmd+F на Mac)
4. Ищи "Cannot Skip"
5. Если найдешь div с этим текстом - значит компонент в DOM
```

---

## 📝 Debug Лог (Добавить временно)

В файл `frontend/src/pages/Slides.jsx` найди функцию `handleNext` (около строки 161):

**Замени это:**
```jsx
const handleNext = () => {
  if (currentSlideIndex < slides.length - 1) {
    const currentSlide = slides[currentSlideIndex];
    
    if (!currentSlide.viewed && !isPreviewMode) {
      setShowSkipWarning(true);
      console.warn('⚠️ User tried to skip slide without marking as viewed');
      return;
    }
    
    setCurrentSlideIndex(currentSlideIndex + 1);
  }
};
```

**На это:**
```jsx
const handleNext = () => {
  console.log('🔍 DEBUG: handleNext called');
  console.log('  currentSlideIndex:', currentSlideIndex);
  console.log('  slides.length:', slides.length);
  console.log('  currentSlide:', slides[currentSlideIndex]);
  console.log('  isPreviewMode:', isPreviewMode);
  
  if (currentSlideIndex < slides.length - 1) {
    const currentSlide = slides[currentSlideIndex];
    
    console.log('  Checking condition...');
    console.log('    !currentSlide.viewed:', !currentSlide.viewed);
    console.log('    !isPreviewMode:', !isPreviewMode);
    
    if (!currentSlide.viewed && !isPreviewMode) {
      console.log('✅ DEBUG: Setting showSkipWarning = true');
      setShowSkipWarning(true);
      console.warn('⚠️ User tried to skip slide without marking as viewed');
      return;
    }
    
    console.log('➡️  DEBUG: Moving to next slide');
    setCurrentSlideIndex(currentSlideIndex + 1);
  }
};
```

Теперь:
1. Нажми F12 → Console
2. Нажми Next (без отметки слайда)
3. Смотри что выведется в консоли
4. Пришли скриншот консоли

---

## ✅ Что Проверить

```
ФАЙЛЫ:
[ ] ConfirmModal.jsx существует
    ls -la frontend/src/components/ConfirmModal.jsx
[ ] Toast.jsx существует
    ls -la frontend/src/components/Toast.jsx
[ ] useToast.js существует
    ls -la frontend/src/hooks/useToast.js
[ ] Slides.jsx обновлён
    grep "showSkipWarning" frontend/src/pages/Slides.jsx

BROWSER:
[ ] Кеш очищен (Cmd+Shift+Delete)
[ ] Hard refresh (Cmd+Shift+R)
[ ] DevTools открыт (F12)
[ ] Console tab активен
[ ] No красных ошибок

DEV SERVER:
[ ] npm run dev запущен
[ ] Показывает "built in X.XXs"
[ ] Порт 5173 доступен
[ ] Нет ошибок при сохранении файлов

ЛОГИКА:
[ ] handleNext вызывается при клике Next
[ ] setShowSkipWarning(true) вызывается
[ ] showSkipWarning в состоянии правильно
[ ] ConfirmModal рендерится в конце JSX
```

---

## 🎯 Пошагово: Что Должно Произойти

```
1. Пользователь на слайде (viewed = false)
   ↓
2. Пользователь нажимает "Next"
   ↓
3. handleNext() вызывается
   ↓
4. Проверяется: !currentSlide.viewed && !isPreviewMode
   ↓
5. Условие TRUE → setShowSkipWarning(true)
   ↓
6. React перерендерит компонент
   ↓
7. <ConfirmModal isOpen={showSkipWarning} .../> рендерится
   ↓
8. showSkipWarning = true → модальное окно показывается
   ↓
9. Появляется жёлтое окно с текстом "Cannot Skip"
```

Если где-то на этой цепочке сломалось - модальное окно не появится.

---

## 🆘 Помощь

Если ничего не помогает, пришли:

1. **Скриншот Console (F12)**
2. **Вывод:**
   ```bash
   cat frontend/src/components/ConfirmModal.jsx | head -30
   grep -A 15 "const handleNext" frontend/src/pages/Slides.jsx
   ```
3. **Скажи:**
   - [ ] Видишь ли yellow warning box?
   - [ ] Есть ли ошибки в Console?
   - [ ] Работают ли остальные функции (Mark, Complete)?

---

**ГЛАВНОЕ:** Очистить браузер кеш + hard refresh обычно решает 80% проблем! 🧹

