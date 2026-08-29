import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
            info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
          };

          const borders = {
            success: 'border-emerald-200 bg-white text-slate-800',
            error: 'border-rose-200 bg-white text-slate-800',
            warning: 'border-amber-200 bg-white text-slate-800',
            info: 'border-blue-200 bg-white text-slate-800',
          };

          return (
            <div
              key={toast.id}
              className={clsx(
                'pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border shadow-xl transition-all animate-in slide-in-from-bottom-5 duration-200',
                borders[toast.type]
              )}
            >
              <div className="flex items-center gap-3">
                {icons[toast.type]}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
