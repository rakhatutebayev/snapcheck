# 🎨 Система дизайна SnapCheck

Единая система типографики, цветов и компонентов для консистентного интерфейса.

---

## 📁 Структура файлов

```
frontend/src/styles/
├── typography.css      # Типографика (шрифты, размеры, стили текста)
├── design-system.css   # Цвета, отступы, тени, компоненты
└── index.css          # Главный файл (импортирует все)
```

---

## 📝 Типографика

### Заголовки

```html
<!-- H1 - Главные заголовки страниц -->
<h1 class="heading-1">Главный заголовок</h1>

<!-- H2 - Секции -->
<h2 class="heading-2">Заголовок секции</h2>

<!-- H3 - Подсекции -->
<h3 class="heading-3">Подзаголовок</h3>

<!-- H4 - Карточки -->
<h4 class="heading-4">Заголовок карточки</h4>

<!-- Можно использовать с любыми тегами -->
<div class="heading-2">Это тоже H2</div>
```

### Текст

```html
<!-- Основной текст -->
<p class="text-body">
  Обычный текст для параграфов
</p>

<!-- Большой текст (лид) -->
<p class="text-lead">
  Важный текст, который выделяется
</p>

<!-- Мелкий текст -->
<span class="text-small">Дополнительная информация</span>

<!-- Очень мелкий текст -->
<span class="text-tiny">Вспомогательный текст</span>

<!-- Моноширинный (код) -->
<code class="text-mono">const value = 42;</code>
```

### Стили текста

```html
<!-- Жирность -->
<span class="font-bold">Жирный текст</span>
<span class="font-semibold">Полужирный</span>
<span class="font-medium">Средний</span>

<!-- Верхний регистр -->
<span class="text-uppercase">Uppercase</span>

<!-- Усечение с многоточием -->
<div class="text-truncate">Очень длинный текст...</div>

<!-- Многострочное усечение (2 строки) -->
<div class="text-clamp-2">Длинный текст на 2 строки...</div>
```

### Цвета текста

```html
<span class="text-primary">Синий (основной)</span>
<span class="text-success">Зеленый (успех)</span>
<span class="text-danger">Красный (ошибка)</span>
<span class="text-warning">Оранжевый (предупреждение)</span>
<span class="text-info">Голубой (инфо)</span>
<span class="text-muted">Серый (приглушенный)</span>
```

---

## 🎨 Цвета

### CSS переменные

```css
/* Primary (синий) */
var(--color-primary-50)   /* Очень светлый */
var(--color-primary-100)
var(--color-primary-600)  /* Основной */
var(--color-primary-900)  /* Темный */

/* Success (зеленый) */
var(--color-success-600)

/* Danger (красный) */
var(--color-danger-600)

/* Warning (оранжевый) */
var(--color-warning-600)

/* Gray (серый) */
var(--color-gray-100)     /* Светлый фон */
var(--color-gray-300)     /* Границы */
var(--color-gray-600)     /* Текст */
```

### Классы фонов

```html
<div class="bg-primary">Синий фон</div>
<div class="bg-primary-light">Светлый синий</div>
<div class="bg-success">Зеленый фон</div>
<div class="bg-danger">Красный фон</div>
<div class="bg-gray">Серый фон</div>
<div class="bg-white">Белый фон</div>
```

---

## 📦 Компоненты

### Кнопки

```html
<!-- Основная кнопка -->
<button class="btn btn-primary">
  Сохранить
</button>

<!-- Кнопка успеха -->
<button class="btn btn-success">
  Подтвердить
</button>

<!-- Кнопка опасности -->
<button class="btn btn-danger">
  Удалить
</button>

<!-- Вторичная кнопка -->
<button class="btn btn-secondary">
  Отмена
</button>

<!-- Кнопка с обводкой -->
<button class="btn btn-outline">
  Подробнее
</button>

<!-- Прозрачная кнопка -->
<button class="btn btn-ghost">
  Закрыть
</button>

<!-- Размеры -->
<button class="btn btn-primary btn-sm">Маленькая</button>
<button class="btn btn-primary">Обычная</button>
<button class="btn btn-primary btn-lg">Большая</button>

<!-- С иконкой -->
<button class="btn btn-primary">
  <svg>...</svg>
  Сохранить
</button>

<!-- Заблокированная -->
<button class="btn btn-primary" disabled>
  Недоступно
</button>
```

### Карточки

```html
<div class="card">
  <div class="card-header">
    <h3 class="heading-4">Заголовок карточки</h3>
  </div>
  <div class="card-body">
    <p>Содержимое карточки</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Действие</button>
  </div>
</div>
```

### Инпуты

```html
<!-- Обычный инпут -->
<label class="label">Email</label>
<input type="text" class="input" placeholder="Введите email" />

<!-- Обязательное поле -->
<label class="label label-required">Пароль</label>
<input type="password" class="input" />

<!-- Ошибка -->
<input type="text" class="input input-error" />
<p class="text-small text-danger">Поле обязательно</p>
```

### Бейджи

```html
<span class="badge badge-primary">Новое</span>
<span class="badge badge-success">Активно</span>
<span class="badge badge-danger">Ошибка</span>
<span class="badge badge-warning">Ожидание</span>
<span class="badge badge-info">Инфо</span>
<span class="badge badge-gray">Архив</span>
```

### Алерты

```html
<!-- Успех -->
<div class="alert alert-success">
  <svg>...</svg>
  <p>Успешно сохранено!</p>
</div>

<!-- Ошибка -->
<div class="alert alert-danger">
  <svg>...</svg>
  <p>Произошла ошибка</p>
</div>

<!-- Предупреждение -->
<div class="alert alert-warning">
  <svg>...</svg>
  <p>Внимание! Проверьте данные</p>
</div>

<!-- Информация -->
<div class="alert alert-info">
  <svg>...</svg>
  <p>Полезная информация</p>
</div>
```

---

## 📏 Отступы

### Padding

```html
<div class="p-0">Без отступов</div>
<div class="p-2">Маленький отступ (8px)</div>
<div class="p-4">Средний отступ (16px)</div>
<div class="p-6">Большой отступ (24px)</div>
```

### Margin

```html
<div class="m-4">Margin со всех сторон</div>
<div class="mt-4">Margin сверху</div>
<div class="mb-4">Margin снизу</div>
<div class="mb-2">Маленький margin снизу</div>
```

---

## 🔲 Скругления

```html
<div class="rounded">Обычное (4px)</div>
<div class="rounded-lg">Большое (8px)</div>
<div class="rounded-xl">Очень большое (12px)</div>
<div class="rounded-2xl">Экстра большое (16px)</div>
<div class="rounded-full">Полный круг</div>
```

---

## ✨ Тени

```html
<div class="shadow">Обычная тень</div>
<div class="shadow-md">Средняя тень</div>
<div class="shadow-lg">Большая тень</div>
<div class="shadow-xl">Очень большая</div>
```

---

## 🎭 Переходы

```html
<!-- Быстрый (150ms) -->
<button class="transition-fast">Hover me</button>

<!-- Обычный (250ms) -->
<button class="transition">Hover me</button>

<!-- Медленный (350ms) -->
<button class="transition-slow">Hover me</button>
```

---

## 🎬 Анимации

```html
<!-- Появление -->
<div class="animate-fade-in">Плавно появляется</div>

<!-- Выезд сверху -->
<div class="animate-slide-down">Выезжает сверху</div>

<!-- Вращение -->
<div class="animate-spin">Крутится</div>
```

---

## 💡 Примеры использования

### Форма входа

```html
<div class="card" style="max-width: 400px;">
  <div class="card-header">
    <h2 class="heading-2">Вход в систему</h2>
  </div>
  <div class="card-body">
    <form>
      <div class="mb-4">
        <label class="label label-required">Email</label>
        <input type="email" class="input" placeholder="your@email.com" />
      </div>
      
      <div class="mb-4">
        <label class="label label-required">Пароль</label>
        <input type="password" class="input" placeholder="••••••••" />
      </div>
      
      <button type="submit" class="btn btn-primary" style="width: 100%;">
        Войти
      </button>
    </form>
  </div>
</div>
```

### Список уведомлений

```html
<div class="card">
  <div class="card-header">
    <h3 class="heading-3">Уведомления</h3>
  </div>
  <div class="card-body">
    <div class="alert alert-success mb-3">
      <p><span class="font-semibold">Иван Иванов</span> завершил презентацию</p>
      <span class="text-tiny text-muted">2 минуты назад</span>
    </div>
    
    <div class="alert alert-info mb-3">
      <p><span class="font-semibold">Петр Петров</span> зарегистрировался</p>
      <span class="text-tiny text-muted">10 минут назад</span>
    </div>
  </div>
</div>
```

### Карточка пользователя

```html
<div class="card">
  <div class="card-body">
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div style="width: 48px; height: 48px;" class="bg-primary-light rounded-full"></div>
      <div>
        <h4 class="heading-4 mb-1">Иван Иванов</h4>
        <p class="text-small text-muted">ivan@company.com</p>
      </div>
      <div style="margin-left: auto;">
        <span class="badge badge-success">Активен</span>
      </div>
    </div>
  </div>
</div>
```

### Таблица с данными

```html
<div class="card">
  <div class="card-header">
    <h3 class="heading-3">Пользователи</h3>
  </div>
  <table style="width: 100%;">
    <thead>
      <tr style="border-bottom: 2px solid var(--color-gray-200);">
        <th class="text-small font-semibold text-left p-3">Имя</th>
        <th class="text-small font-semibold text-left p-3">Email</th>
        <th class="text-small font-semibold text-left p-3">Статус</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid var(--color-gray-100);">
        <td class="p-3">
          <span class="font-medium">Иван Иванов</span>
        </td>
        <td class="p-3">
          <span class="text-small">ivan@company.com</span>
        </td>
        <td class="p-3">
          <span class="badge badge-success">Активен</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🎯 Преимущества системы дизайна

✅ **Консистентность** - все элементы выглядят единообразно  
✅ **Скорость разработки** - готовые классы и компоненты  
✅ **Легкая поддержка** - изменения в одном месте  
✅ **Адаптивность** - автоматические адаптации для мобильных  
✅ **Читаемость кода** - понятные названия классов  
✅ **Расширяемость** - легко добавить новые компоненты  

---

## 📱 Адаптивность

Все заголовки автоматически уменьшаются на мобильных устройствах:

```css
/* Десктоп */
H1: 36px
H2: 30px
H3: 24px

/* Мобильный (<640px) */
H1: 30px
H2: 24px
H3: 20px
```

---

## 🔧 Кастомизация

### Изменение цветов

Отредактируйте `design-system.css`:

```css
:root {
  /* Замените primary цвет на свой */
  --color-primary-600: #your-color;
}
```

### Добавление новых компонентов

Добавьте в конец `design-system.css`:

```css
.my-component {
  /* ваши стили */
}
```

---

## ✨ Рекомендации

1. **Используйте готовые классы** вместо inline стилей
2. **Комбинируйте классы** для создания уникальных компонентов
3. **Следуйте системе отступов** (4, 8, 16, 24px)
4. **Используйте CSS переменные** для цветов
5. **Не дублируйте стили** - создайте класс в системе

---

## 🚀 Быстрый старт

```html
<!-- Подключите стили (уже подключено в index.css) -->
<link rel="stylesheet" href="./styles/typography.css">
<link rel="stylesheet" href="./styles/design-system.css">

<!-- Используйте классы -->
<div class="card">
  <div class="card-body">
    <h2 class="heading-2">Привет!</h2>
    <p class="text-body">Используйте систему дизайна</p>
    <button class="btn btn-primary">Начать</button>
  </div>
</div>
```

---

**Готово!** Теперь у вас есть полная система дизайна для создания красивых и консистентных интерфейсов! 🎨
