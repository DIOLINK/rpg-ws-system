import { useEffect } from 'react';
import useToastStore from '../context/toastStore';

const Toast = ({ id, type, message, duration = 3000 }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, removeToast]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'info':
        return 'bg-purple-500 text-white';
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
      className={`flex items-center p-4 rounded shadow-lg mb-4 ${getStyles()}`}
      role="alert"
    >
      {getIcon() && <span className="mr-2 text-xl">{getIcon()}</span>}
      <span>{message}</span>
    </div>
  );
};

const ToastProvider = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed bottom-4 right-4 w-80">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export default ToastProvider;
