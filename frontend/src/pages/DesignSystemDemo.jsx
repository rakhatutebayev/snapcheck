import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

/**
 * Компонент демонстрации системы дизайна
 * Показывает все доступные стили и компоненты
 */
const DesignSystemDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-1 mb-2">🎨 Система дизайна SnapCheck</h1>
          <p className="text-lead text-muted">
            Единая типографика, цвета и компоненты для консистентного интерфейса
          </p>
        </div>

        {/* Typography Section */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="heading-2">Типографика</h2>
          </div>
          <div className="card-body">
            <h1 className="heading-1">Heading 1 - Главный заголовок</h1>
            <h2 className="heading-2">Heading 2 - Заголовок секции</h2>
            <h3 className="heading-3">Heading 3 - Подзаголовок</h3>
            <h4 className="heading-4">Heading 4 - Заголовок карточки</h4>
            <h5 className="heading-5">Heading 5 - Подзаголовок</h5>
            <h6 className="heading-6">Heading 6 - Мелкий заголовок</h6>
            
            <hr className="my-4" style={{ border: 'none', borderTop: '1px solid var(--color-gray-200)' }} />
            
            <p className="text-lead mb-3">
              Это большой текст (lead). Используется для важных параграфов.
            </p>
            <p className="text-body mb-3">
              Это обычный текст (body). Используется для основного контента страницы.
            </p>
            <p className="text-small mb-3">
              Это мелкий текст (small). Используется для дополнительной информации.
            </p>
            <p className="text-tiny">
              Это очень мелкий текст (tiny). Используется для вспомогательных данных.
            </p>
            
            <div className="mt-4">
              <code className="text-mono">const example = "Моноширинный шрифт для кода";</code>
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="heading-2">Цвета текста</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-primary font-semibold">Primary (синий)</p>
                <p className="text-success font-semibold">Success (зеленый)</p>
                <p className="text-danger font-semibold">Danger (красный)</p>
              </div>
              <div>
                <p className="text-warning font-semibold">Warning (оранжевый)</p>
                <p className="text-info font-semibold">Info (голубой)</p>
                <p className="text-muted font-semibold">Muted (серый)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="heading-2">Кнопки</h2>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <h3 className="heading-4 mb-3">Варианты</h3>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary">Primary</button>
                <button className="btn btn-success">Success</button>
                <button className="btn btn-danger">Danger</button>
                <button className="btn btn-secondary">Secondary</button>
                <button className="btn btn-outline">Outline</button>
                <button className="btn btn-ghost">Ghost</button>
                <button className="btn btn-primary" disabled>Disabled</button>
              </div>
            </div>
            
            <div>
              <h3 className="heading-4 mb-3">Размеры</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button className="btn btn-primary btn-sm">Small</button>
                <button className="btn btn-primary">Normal</button>
                <button className="btn btn-primary btn-lg">Large</button>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="heading-2">Бейджи</h2>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-primary">Primary</span>
              <span className="badge badge-success">Success</span>
              <span className="badge badge-danger">Danger</span>
              <span className="badge badge-warning">Warning</span>
              <span className="badge badge-info">Info</span>
              <span className="badge badge-gray">Gray</span>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="heading-2">Алерты</h2>
          </div>
          <div className="card-body space-y-3">
            <div className="alert alert-success">
              <CheckCircle size={20} />
              <div>
                <p className="font-semibold">Успешно!</p>
                <p className="text-sm">Операция выполнена успешно</p>
              </div>
            </div>
            
            <div className="alert alert-danger">
              <XCircle size={20} />
              <div>
                <p className="font-semibold">Ошибка</p>
                <p className="text-sm">Произошла ошибка при выполнении операции</p>
              </div>
            </div>
            
            <div className="alert alert-warning">
              <AlertCircle size={20} />
              <div>
                <p className="font-semibold">Внимание</p>
                <p className="text-sm">Проверьте введенные данные</p>
              </div>
            </div>
            
            <div className="alert alert-info">
              <Info size={20} />
              <div>
                <p className="font-semibold">Информация</p>
                <p className="text-sm">Полезная информация для пользователя</p>
              </div>
            </div>
          </div>
        </div>

        {/* Forms Section */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="heading-2">Формы</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Обычное поле</label>
                <input type="text" className="input" placeholder="Введите текст" />
              </div>
              
              <div>
                <label className="label label-required">Обязательное поле</label>
                <input type="text" className="input" placeholder="Обязательно" />
              </div>
              
              <div>
                <label className="label">Заблокированное поле</label>
                <input type="text" className="input" disabled value="Недоступно" />
              </div>
              
              <div>
                <label className="label">Поле с ошибкой</label>
                <input type="text" className="input input-error" placeholder="Ошибка" />
                <p className="text-small text-danger mt-1">Поле обязательно для заполнения</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card">
            <div className="card-header">
              <h3 className="heading-3">Простая карточка</h3>
            </div>
            <div className="card-body">
              <p className="text-body">
                Это простая карточка с заголовком и телом.
              </p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="heading-3">С футером</h3>
            </div>
            <div className="card-body">
              <p className="text-body mb-0">
                Карточка с футером и действием.
              </p>
            </div>
            <div className="card-footer">
              <button className="btn btn-primary btn-sm">Действие</button>
            </div>
          </div>
        </div>

        {/* Spacing Section */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="heading-2">Отступы и тени</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-primary-light rounded text-center">
                <p className="text-small">p-3</p>
              </div>
              <div className="p-4 bg-success-light rounded text-center">
                <p className="text-small">p-4</p>
              </div>
              <div className="p-6 bg-warning-light rounded text-center">
                <p className="text-small">p-6</p>
              </div>
              <div className="p-8 bg-info-light rounded text-center">
                <p className="text-small">p-8</p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="p-4 bg-white shadow rounded text-center">
                <p className="text-tiny">shadow</p>
              </div>
              <div className="p-4 bg-white shadow-md rounded text-center">
                <p className="text-tiny">shadow-md</p>
              </div>
              <div className="p-4 bg-white shadow-lg rounded text-center">
                <p className="text-tiny">shadow-lg</p>
              </div>
              <div className="p-4 bg-white shadow-xl rounded text-center">
                <p className="text-tiny">shadow-xl</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rounded Section */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="heading-2">Скругления</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 bg-primary-light rounded text-center">
                <p className="text-tiny">rounded</p>
              </div>
              <div className="p-4 bg-primary-light rounded-lg text-center">
                <p className="text-tiny">rounded-lg</p>
              </div>
              <div className="p-4 bg-primary-light rounded-xl text-center">
                <p className="text-tiny">rounded-xl</p>
              </div>
              <div className="p-4 bg-primary-light rounded-2xl text-center">
                <p className="text-tiny">rounded-2xl</p>
              </div>
              <div className="w-16 h-16 bg-primary-light rounded-full mx-auto flex items-center justify-center">
                <p className="text-tiny">full</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real Example */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-2">Пример: Карточка пользователя</h2>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div className="flex-1">
                <h3 className="heading-3 mb-1">Иван Иванов</h3>
                <p className="text-small text-muted">ivan.ivanov@company.com</p>
              </div>
              <span className="badge badge-success">Активен</span>
            </div>
            
            <div className="alert alert-info mb-4">
              <Info size={18} />
              <div>
                <p className="text-small">
                  Пользователь завершил <span className="font-semibold">3 из 5</span> презентаций
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="btn btn-primary">Редактировать</button>
              <button className="btn btn-secondary">Просмотр</button>
              <button className="btn btn-danger">Удалить</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DesignSystemDemo;
