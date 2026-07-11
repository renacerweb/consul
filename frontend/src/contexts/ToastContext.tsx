import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * INTERFAZ TOAST
 * Define la estructura de una notificación toast
 */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * INTERFAZ TOAST CONTEXT
 * Define las funciones disponibles en el contexto de toasts
 */
interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number, action?: Toast['action']) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

/**
 * CONTEXTO DE TOASTS
 * Proporciona el sistema de notificaciones global
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * HOOK PARA USAR TOASTS
 * Hook personalizado para acceder al sistema de toasts
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
};

/**
 * PROVEEDOR DE TOASTS
 * Componente que proporciona el contexto de toasts a toda la aplicación
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * MUESTRA UN TOAST
   * Crea y muestra una nueva notificación toast
   */
  const showToast = useCallback((
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 5000,
    action?: Toast['action']
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      action,
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remover después de la duración
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  /**
   * OCULTA UN TOAST
   * Remueve un toast específico por su ID
   */
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * LIMPIA TODOS LOS TOASTS
   * Remueve todas las notificaciones activas
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-4 z-[9999] flex flex-col gap-3 w-[min(100%,20rem)]">
        {toasts.map((toast) => {
          const variantClasses = toast.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : toast.type === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-900'
            : toast.type === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-slate-200 bg-slate-50 text-slate-900';

          return (
            <div
              key={toast.id}
              className={`rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm ${variantClasses}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm leading-5">{toast.message}</div>
                <button
                  type="button"
                  onClick={() => hideToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Cerrar notificación"
                >
                  ×
                </button>
              </div>
              {toast.action && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={toast.action.onClick}
                    className="text-sm font-semibold text-slate-700 hover:underline"
                  >
                    {toast.action.label}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};