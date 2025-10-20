import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * ConfirmModal Component
 * Modal dialog for confirmations and alerts
 */
const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'warning' // 'warning', 'error', 'info', 'success'
}) => {
  if (!isOpen) return null;

  // Color schemes based on type
  const typeStyles = {
    warning: {
      icon: 'text-yellow-600',
      header: 'bg-yellow-50 border-b border-yellow-200',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    error: {
      icon: 'text-red-600',
      header: 'bg-red-50 border-b border-red-200',
      button: 'bg-red-600 hover:bg-red-700'
    },
    info: {
      icon: 'text-blue-600',
      header: 'bg-blue-50 border-b border-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    success: {
      icon: 'text-green-600',
      header: 'bg-green-50 border-b border-green-200',
      button: 'bg-green-600 hover:bg-green-700'
    }
  };

  const styles = typeStyles[type] || typeStyles.warning;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        {/* Header */}
        <div className={`px-6 py-4 ${styles.header} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`${styles.icon}`} size={24} />
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <div className="px-6 py-6">
          <p className="text-gray-700 text-base leading-relaxed">{message}</p>
        </div>

        {/* Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition text-sm"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 ${styles.button} text-white font-semibold rounded-lg transition text-sm`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
