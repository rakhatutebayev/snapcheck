import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

/**
 * 🎯 Toast Component - Модуль уведомлений
 * Используется для показания сообщений пользователю с автоматическим исчезновением
 * 
 * Типы:
 * - error: Красное (ошибка)
 * - success: Зелёное (успех)
 * - info: Синее (информация)
 * - warning: Жёлтое (предупреждение)
 */

const Toast = ({
  type = 'info', // 'error' | 'success' | 'info' | 'warning'
  message = '',
  duration = 5000, // мс (0 = не исчезает)
  onClose = () => {},
  autoClose = true
}) => {
  const [isVisible, setIsVisible] = useState(!!message);

  useEffect(() => {
    if (!message) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    // Auto-close через duration миллисекунд
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, autoClose, onClose]);

  if (!isVisible || !message) {
    return null;
  }

  // Стили для разных типов
  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: AlertCircle,
      iconColor: 'text-red-600'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: Info,
      iconColor: 'text-blue-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: AlertCircle,
      iconColor: 'text-yellow-600'
    }
  };

  const config = styles[type] || styles.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        flex items-center gap-2 p-3 rounded-lg border
        ${config.bg} ${config.border}
        animate-in fade-in slide-in-from-top-2 duration-300
      `}
      role="alert"
    >
      {/* Иконка */}
      <Icon className={`${config.iconColor} flex-shrink-0`} size={16} />

      {/* Сообщение */}
      <p className={`${config.text} text-sm font-medium flex-1 truncate`}>
        {message}
      </p>

      {/* Кнопка закрытия */}
      {autoClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className={`${config.text} hover:opacity-75 transition flex-shrink-0`}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Toast;
