import { useState } from 'react';
import { signInWithGoogle } from '../utils/authService';
import { ErrorMessage } from './ErrorMessage';

export const Login = () => {
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      const { user, token } = await signInWithGoogle();
      console.log('User signed in:', user);
      console.log('Token:', token);
      // Aquí puedes manejar el token, como enviarlo al backend
    } catch (err) {
      console.error(err);
      if (err.message === 'Inicio de sesión cancelado por el usuario.') {
        setError('El inicio de sesión fue cancelado.');
      } else {
        setError('Error al iniciar sesión con Google');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-lg p-6 sm:p-8 w-full max-w-sm mx-auto shadow-2xl">
        {/* Logo/Icon */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-4xl sm:text-5xl mb-4">🎲</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">
            RPG WebSocket
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Inicia sesión para comenzar tu aventura
          </p>
        </div>

        {/* Google Login */}
        <div className="flex justify-center">
          <button
            onClick={handleLogin}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
          >
            Iniciar sesión con Google
          </button>
        </div>

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
};
