'use client';

import { useState, createContext, useContext } from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <ToasterUI toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToasterUI({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-900 dark:bg-green-900 dark:border-green-700 dark:text-green-100';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-900 dark:bg-red-900 dark:border-red-700 dark:text-red-100';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full rounded-lg border-l-4 p-4 shadow-lg
            animate-slide-up
            ${getToastStyles(toast.type)}
          `}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{toast.title}</h4>
              {toast.description && (
                <p className="text-sm mt-1 opacity-90">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="ml-4 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}