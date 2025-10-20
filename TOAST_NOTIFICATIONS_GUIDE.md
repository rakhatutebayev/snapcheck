# 📢 Toast (Оповещения) - Модульная система

## 🎯 Что это?

**Toast** - это модульная система оповещений для показания сообщений пользователю с автоматическим исчезновением.

Вместо того чтобы писать одинаковый код для ошибок и успеха на каждой странице, мы используем один переиспользуемый модуль.

---

## 📁 Файлы

### 1. **Toast Component** (`frontend/src/components/Toast.jsx`)
Компонент который отображает одно оповещение.

```jsx
import Toast from '../components/Toast';

// Использование:
<Toast 
  type="error" 
  message="Что-то пошло не так!" 
  duration={5000}
  autoClose={true}
/>
```

### 2. **useToast Hook** (`frontend/src/hooks/useToast.js`)
Хук для удобного управления оповещениями.

```jsx
import useToast from '../hooks/useToast';

const MyComponent = () => {
  const { toasts, error, success, info, warning, clearAll } = useToast();
  
  return (
    <>
      {/* Отображаем оповещения */}
      {toasts.error && <Toast type="error" message={toasts.error} />}
      {toasts.success && <Toast type="success" message={toasts.success} />}
      
      {/* Используем функции */}
      <button onClick={() => error('Произошла ошибка!')}>
        Show Error
      </button>
    </>
  );
};
```

---

## 🎨 Типы оповещений

### 1. **Error** (Красное - ошибка)
```jsx
error('❌ Что-то пошло не так!');
```
- Цвет: Красный
- Иконка: AlertCircle
- Длительность: 5000ms (по умолчанию)

### 2. **Success** (Зелёное - успех)
```jsx
success('✅ Успешно сохранено!');
```
- Цвет: Зелёный
- Иконка: CheckCircle
- Длительность: 5000ms (по умолчанию)

### 3. **Info** (Синее - информация)
```jsx
info('ℹ️ Это информационное сообщение');
```
- Цвет: Синий
- Иконка: Info
- Длительность: 5000ms (по умолчанию)

### 4. **Warning** (Жёлтое - предупреждение)
```jsx
warning('⚠️ Будьте осторожны!');
```
- Цвет: Жёлтый
- Иконка: AlertCircle
- Длительность: 5000ms (по умолчанию)

---

## 💻 Использование в компонентах

### Простой пример

```jsx
import useToast from '../hooks/useToast';
import Toast from '../components/Toast';

const Slides = () => {
  const { toasts, error, success } = useToast();

  const handleMarkViewed = async () => {
    try {
      await axios.post('/slides/mark/1');
      success('✅ Слайд отмечен!', 3000); // исчезает через 3 сек
    } catch (err) {
      error('❌ Ошибка!', 5000); // исчезает через 5 сек
    }
  };

  return (
    <div>
      {/* Отображаем оповещения */}
      <div className="space-y-2">
        {toasts.error && <Toast type="error" message={toasts.error} />}
        {toasts.success && <Toast type="success" message={toasts.success} />}
      </div>

      <button onClick={handleMarkViewed}>Mark as Viewed</button>
    </div>
  );
};
```

### Продвинутый пример

```jsx
const { toasts, error, success, info, warning, clearAll } = useToast();

// Вызывать нужные функции:
error('Ошибка загрузки', 5000);      // красное, исчезает через 5 сек
success('Сохранено!', 3000);         // зелёное, исчезает через 3 сек
info('Обновление...', 0);            // синее, НЕ исчезает автоматически
warning('Внимание!', 7000);          // жёлтое, исчезает через 7 сек

// Закрыть все оповещения
clearAll();
```

---

## ⚙️ Параметры функций

### `error(message, duration)`
- `message` (string) - Текст сообщения
- `duration` (number, optional) - Время до исчезновения (мс). 0 = не исчезает

### `success(message, duration)`
### `info(message, duration)`
### `warning(message, duration)`

---

## 🔄 API Hook

```jsx
const {
  toasts,           // объект {error, success, info, warning}
  error,            // функция (msg, duration)
  success,          // функция (msg, duration)
  info,             // функция (msg, duration)
  warning,          // функция (msg, duration)
  clearAll          // функция () - закрыть все
} = useToast();
```

---

## 📱 В Slides.jsx это используется вот так:

```jsx
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';

const Slides = () => {
  const { toasts, error, success, info, warning, clearAll } = useToast();

  // ✅ Когда пользователь пытается перейти без отметки:
  const handleNext = () => {
    if (!currentSlide.viewed) {
      error('❌ Отметьте слайд перед переходом!', 5000);
      return;
    }
    // ...
  };

  // ✅ Когда успешно помечен:
  const handleMarkViewed = async () => {
    try {
      await axios.post('/slides/mark/1');
      success('✅ Слайд отмечен!', 3000);
    } catch (err) {
      error('❌ Ошибка при отметке', 5000);
    }
  };

  return (
    <div>
      {/* Оповещения видны здесь */}
      <div className="space-y-2">
        {toasts.error && <Toast type="error" message={toasts.error} />}
        {toasts.success && <Toast type="success" message={toasts.success} />}
        {toasts.info && <Toast type="info" message={toasts.info} />}
        {toasts.warning && <Toast type="warning" message={toasts.warning} />}
      </div>

      {/* Остальной контент */}
      <button onClick={handleNext}>Next</button>
      <button onClick={handleMarkViewed}>Mark as Viewed</button>
    </div>
  );
};
```

---

## 🌍 Использовать на ДРУГИХ страницах

Просто скопируйте эти строки:

```jsx
import useToast from '../hooks/useToast';
import Toast from '../components/Toast';

const MyPage = () => {
  const { toasts, error, success, info, warning } = useToast();

  return (
    <div>
      {/* Оповещения */}
      <div className="space-y-2">
        {toasts.error && <Toast type="error" message={toasts.error} />}
        {toasts.success && <Toast type="success" message={toasts.success} />}
      </div>

      {/* Ваш контент */}
      <button onClick={() => success('Работает!')}>Test</button>
    </div>
  );
};
```

---

## 🎯 Преимущества модульного подхода

✅ **Переиспользуемость** - Один модуль для всех страниц
✅ **Конфигурируемость** - Легко изменить стиль в одном месте
✅ **Простота** - Простой API с минимальной конфигурацией
✅ **Масштабируемость** - Можно добавить новые типы оповещений
✅ **Автоматическое исчезновение** - Встроено в хук
✅ **Типизация** - Чёткие типы (error, success, info, warning)

---

## 🔧 Как изменить стиль для всех страниц?

Если вы хотите изменить стиль оповещения (например, цвет, размер) для всех страниц:

**Отредактируйте одной файл:** `frontend/src/components/Toast.jsx`

```jsx
// Например, изменить размер шрифта
<p className={`${config.text} text-sm font-medium flex-1 truncate`}>
// На
<p className={`${config.text} text-md font-bold flex-1 truncate`}>
```

Изменение применится ко ВСЕМ страницам автоматически! ✅

---

## 📊 Структура

```
frontend/src/
├── components/
│   └── Toast.jsx           ✅ Компонент оповещения
├── hooks/
│   └── useToast.js         ✅ Хук для управления
└── pages/
    └── Slides.jsx          ✅ Использует оба
```

---

## ✨ Примеры из реальной жизни

### Пример 1: Ошибка при загрузке

```jsx
const fetchData = async () => {
  try {
    const res = await axios.get('/api/data');
    success('✅ Данные загружены!', 3000);
  } catch (err) {
    error('❌ Ошибка загрузки: ' + err.message, 5000);
  }
};
```

### Пример 2: Валидация формы

```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!name) {
    error('❌ Заполните имя!', 4000);
    return;
  }
  
  if (!email) {
    error('❌ Заполните email!', 4000);
    return;
  }
  
  success('✅ Форма отправлена!', 3000);
};
```

### Пример 3: Операции с данными

```jsx
const deleteItem = async (id) => {
  try {
    await axios.delete(`/api/items/${id}`);
    success('✅ Элемент удалён!', 3000);
    // Обновить список...
  } catch (err) {
    error('❌ Не удалось удалить элемент', 5000);
  }
};
```

---

## 🚀 Готово!

Теперь вы можете:
✅ Показывать оповещения на любой странице
✅ Изменять стили в одном месте
✅ Использовать один и тот же API везде
✅ Добавлять новые типы оповещений при необходимости

**Happy coding!** 🎉
