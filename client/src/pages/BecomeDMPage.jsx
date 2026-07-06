import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiFetch';

const API_URL = import.meta.env.VITE_API_URL || '';

export const BecomeDMPage = () => {
  const { user, isDM } = useAuth();
  const navigate = useNavigate();
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white text-lg">Cargando...</p>
      </div>
    );
  }

  if (isDM) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Ya eres Dungeon Master
          </h1>
          <p className="text-gray-400 mb-6">
            Ya tienes permisos de DM. Puedes crear partidas desde el lobby.
          </p>
          <button
            onClick={() => navigate('/lobby')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Ir al Lobby
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch(
        `${API_URL}/game/become-dm`,
        {
          method: 'POST',
          body: JSON.stringify({ secretKey }),
        },
        null,
        { useCache: false },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al convertirse en DM');
      }

      setSuccess('¡Ahora eres Dungeon Master! Redirigiendo al lobby...');

      // Recargar la página para actualizar el estado del usuario
      setTimeout(() => {
        window.location.href = '/lobby';
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Convertirse en DM
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Ingresa la clave secreta para obtener permisos de Dungeon Master.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Clave Secreta
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Ingresa la clave secreta"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !secretKey}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Procesando...' : 'Convertirme en DM'}
          </button>
        </form>

        <button
          onClick={() => navigate('/lobby')}
          className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          Volver al Lobby
        </button>
      </div>
    </div>
  );
};

export default BecomeDMPage;
