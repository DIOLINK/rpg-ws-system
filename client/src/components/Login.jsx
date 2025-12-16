import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from './ErrorMessage';

export const Login = () => {
  const { login } = useAuth();
  const [error, setError] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
    } catch (err) {
      console.error(err);
      setError('Error al iniciar sesión');
    }
  };

  const handleError = () => {
    setError('Error al iniciar sesión con Google');
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
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="filled_black"
            size="large"
            text="signin_with"
            shape="rectangular"
            className="w-full"
          />
        </div>

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
};
