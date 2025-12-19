import useToastStore from '../context/toastStore';

export const ErrorMessage = ({ message, onRetry }) => {
  const addToast = useToastStore((state) => state.addToast);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      addToast({ type: 'info', message: 'Reintentando...' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-lg font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-400 text-sm mb-4">{message}</p>
          {onRetry && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
