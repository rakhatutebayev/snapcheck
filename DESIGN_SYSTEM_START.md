# 🎨 Типографика и система дизайна - Быстрый старт

## ✨ Что добавлено?

Создана **полная система дизайна** для SnapCheck:

### 📁 Файлы:
```
frontend/src/styles/
├── typography.css      # Типографика (шрифты, заголовки, текст)
├── design-system.css   # Цвета, компоненты, отступы, тени
└── index.css          # Главный файл (импортирует все)

Документация:
├── DESIGN_SYSTEM.md    # Полная документация по использованию
└── DesignSystemDemo.jsx # Демо-страница со всеми компонентами
```

---

## 🚀 Как использовать?

### 1. Посмотреть демо

Откройте браузер:
```
http://localhost:5173/design
```

Вы увидите **все доступные стили и компоненты** с примерами!

### 2. Использовать в коде

Все стили уже подключены автоматически! Просто используйте классы:

```jsx
// Заголовки
<h1 className="heading-1">Главный заголовок</h1>
<h2 className="heading-2">Заголовок секции</h2>
<h3 className="heading-3">Подзаголовок</h3>

// Текст
<p className="text-body">Обычный текст</p>
<p className="text-small text-muted">Мелкий серый текст</p>

// Кнопки
<button className="btn btn-primary">Сохранить</button>
<button className="btn btn-success">Подтвердить</button>
<button className="btn btn-danger">Удалить</button>

// Карточки
<div className="card">
  <div className="card-header">
    <h3 className="heading-3">Заголовок</h3>
  </div>
  <div className="card-body">
    <p>Содержимое карточки</p>
  </div>
</div>

// Бейджи
<span className="badge badge-success">Активно</span>
<span className="badge badge-danger">Ошибка</span>

// Алерты
<div className="alert alert-success">
  <p>Успешно сохранено!</p>
</div>

// Инпуты
<label className="label label-required">Email</label>
<input type="email" className="input" placeholder="your@email.com" />
```

---

## 🎯 Преимущества

✅ **Готовые компоненты** - кнопки, карточки, алерты, формы  
✅ **Консистентный дизайн** - все элементы в едином стиле  
✅ **CSS переменные** - легко изменить цвета  
✅ **Адаптивность** - автоматические адаптации для мобильных  
✅ **Типографика** - правильные размеры и отступы  
✅ **Документация** - полное описание в DESIGN_SYSTEM.md  

---

## 📚 Документация

**Полная документация:** `DESIGN_SYSTEM.md`

Там вы найдете:
- Все доступные классы
- Примеры использования
- CSS переменные
- Рекомендации по дизайну

---

## 💡 Примеры

### Форма входа

```jsx
<div className="card" style={{maxWidth: '400px'}}>
  <div className="card-header">
    <h2 className="heading-2">Вход</h2>
  </div>
  <div className="card-body">
    <label className="label label-required">Email</label>
    <input type="email" className="input mb-4" />
    
    <label className="label label-required">Пароль</label>
    <input type="password" className="input mb-4" />
    
    <button className="btn btn-primary" style={{width: '100%'}}>
      Войти
    </button>
  </div>
</div>
```

### Уведомление

```jsx
<div className="alert alert-success">
  <CheckCircle size={20} />
  <div>
    <p className="font-semibold">Успешно!</p>
    <p className="text-sm">Пользователь завершил презентацию</p>
  </div>
</div>
```

### Карточка пользователя

```jsx
<div className="card">
  <div className="card-body">
    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
      <div className="w-12 h-12 rounded-full bg-primary-light"></div>
      <div>
        <h4 className="heading-4">Иван Иванов</h4>
        <p className="text-small text-muted">ivan@company.com</p>
      </div>
      <span className="badge badge-success">Активен</span>
    </div>
  </div>
</div>
```

---

## 🎨 Доступные классы

### Заголовки
- `.heading-1` - H1 (36px)
- `.heading-2` - H2 (30px)
- `.heading-3` - H3 (24px)
- `.heading-4` - H4 (20px)

### Текст
- `.text-body` - Обычный текст
- `.text-lead` - Большой текст
- `.text-small` - Мелкий
- `.text-tiny` - Очень мелкий
- `.text-mono` - Моноширинный (код)

### Цвета
- `.text-primary` - Синий
- `.text-success` - Зеленый
- `.text-danger` - Красный
- `.text-warning` - Оранжевый
- `.text-muted` - Серый

### Кнопки
- `.btn .btn-primary` - Основная
- `.btn .btn-success` - Успех
- `.btn .btn-danger` - Опасность
- `.btn .btn-secondary` - Вторичная
- `.btn .btn-outline` - С обводкой
- `.btn .btn-ghost` - Прозрачная

### Размеры кнопок
- `.btn-sm` - Маленькая
- `.btn-lg` - Большая

### Компоненты
- `.card` - Карточка
- `.badge` - Бейдж
- `.alert` - Алерт
- `.input` - Инпут
- `.label` - Лейбл

### Отступы
- `.p-2` - Padding 8px
- `.p-4` - Padding 16px
- `.m-2` - Margin 8px
- `.mb-4` - Margin bottom 16px

### Скругления
- `.rounded` - 4px
- `.rounded-lg` - 8px
- `.rounded-xl` - 12px
- `.rounded-full` - Круг

### Тени
- `.shadow` - Обычная
- `.shadow-md` - Средняя
- `.shadow-lg` - Большая

---

## 🔧 Кастомизация

Измените цвета в `design-system.css`:

```css
:root {
  /* Замените основной цвет */
  --color-primary-600: #your-color;
  
  /* Или другие цвета */
  --color-success-600: #your-green;
  --color-danger-600: #your-red;
}
```

---

## ✅ Готово!

Система дизайна готова к использованию!

1. 🎨 Посмотрите демо: http://localhost:5173/design
2. 📚 Прочитайте документацию: DESIGN_SYSTEM.md
3. 💻 Используйте классы в своих компонентах
4. 🚀 Наслаждайтесь консистентным дизайном!
