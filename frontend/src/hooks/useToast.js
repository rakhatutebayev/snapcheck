import { useState, useCallback } from 'react';

/**
 * 🎯 useToast Hook - Упрощённое управление оповещениями
 * 
 * Использование:
 * const { error, success, info, warning, clearAll } = useToast();
 * 
 * error('Что-то пошло не так');
 * success('Успешно!');
 */

export const useToast = () => {
  const [toasts, setToasts] = useState({
    error: '',
    success: '',
    info: '',
    warning: ''
  });

  const showToast = useCallback((type, message, duration = 5000) => {
    setToasts(prev => ({
      ...prev,
      [type]: message
    }));

    // Auto-dismiss через duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => ({
          ...prev,
          [type]: ''
        }));
      }, duration);
    }
  }, []);

  const error = useCallback((message, duration = 5000) => {
    showToast('error', message, duration);
  }, [showToast]);

  const success = useCallback((message, duration = 5000) => {
    showToast('success', message, duration);
  }, [showToast]);

  const info = useCallback((message, duration = 5000) => {
    showToast('info', message, duration);
  }, [showToast]);

  const warning = useCallback((message, duration = 5000) => {
    showToast('warning', message, duration);
  }, [showToast]);

  const clearAll = useCallback(() => {
    setToasts({
      error: '',
      success: '',
      info: '',
      warning: ''
    });
  }, []);

  return {
    toasts,
    error,
    success,
    info,
    warning,
    clearAll
  };
};

export default useToast;
