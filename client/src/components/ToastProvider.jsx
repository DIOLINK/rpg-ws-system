import { useEffect } from 'react';
import useToastStore from '../context/toastStore';

// Ahora acepta 'actions' como prop opcional
const Toast = ({ id, type, message, duration = 3000, actions }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    if (!actions || actions.length === 0) {
      const timer = setTimeout(() => removeToast(id), duration);
      return () => clearTimeout(timer);
    }
    // Si hay acciones, no autocierra
    return undefined;
  }, [id, duration, removeToast, actions]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-700 text-white';
      case 'error':
        return 'bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 text-black';
      case 'info':
        return 'bg-purple-700 text-white';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✔️';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl shadow-2xl mb-4 border-2 ${getStyles()}`}
      role="alert"
      style={{
        minHeight: '24px',
        fontSize: '1.1rem',
        letterSpacing: '0.01em',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        borderColor:
          type === 'error'
            ? '#b91c1c'
            : type === 'success'
              ? '#059669'
              : type === 'warning'
                ? '#eab308'
                : '#a21caf',
        backdropFilter: 'blur(2px)',
        color: 'white',
        alignItems: 'center',
      }}
    >
      {getIcon() && (
        <span className="text-2xl drop-shadow-lg">{getIcon()}</span>
      )}
      <span
        className="flex-1 whitespace-pre-line"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
      >
        {message}
      </span>
      {actions && actions.length > 0 && (
        <div className="flex gap-2 ml-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => action.onClick(id)}
              className={`px-3 py-1 rounded font-semibold text-sm ${
                action.variant === 'danger'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : action.variant === 'secondary'
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              style={{ pointerEvents: 'auto' }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => removeToast(id)}
        className="ml-2 text-white text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Cerrar"
        style={{ pointerEvents: 'auto' }}
      >
        ×
      </button>
    </div>
  );
};

const ToastProvider = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      className="fixed top-8 left-1/2 z-50 flex flex-col items-center pointer-events-none"
      style={{ width: '90vw', transform: 'translateX(-50%)' }}
    >
      {toasts.map((toast, idx) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full animate-toast-in"
          style={{
            animationDelay: `${idx * 0.1}s`,
            maxWidth: '90vw',
            transition: 'transform 0.3s cubic-bezier(.4,2,.3,1), opacity 0.3s',
          }}
        >
          <Toast key={toast.id} {...toast} />
        </div>
      ))}
    </div>
  );
};

export default ToastProvider;
