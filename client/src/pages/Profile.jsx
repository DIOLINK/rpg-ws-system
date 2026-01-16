import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user, logout } = useAuth();
  const [imgError, setImgError] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white text-lg">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-4">
          Perfil de Usuario
        </h1>
        <div className="flex items-center gap-4 mb-6">
          {imgError || !user.picture ? (
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gray-700 border-2 border-gray-700">
              {/* Ícono de usuario genérico SVG */}
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 12c2.7 0 4.5-1.8 4.5-4.5S14.7 3 12 3 7.5 4.8 7.5 7.5 9.3 12 12 12zm0 2c-3 0-9 1.5-9 4.5V21h18v-2.5c0-3-6-4.5-9-4.5z"
                />
              </svg>
            </div>
          ) : (
            <img
              src={user.picture}
              alt="Foto de perfil"
              className="w-24 h-24 rounded-full border-2 border-gray-700"
              onError={() => setImgError(true)}
            />
          )}
          <div>
            <p className="text-xl text-white font-semibold">{user.name}</p>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          onClick={logout}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Profile;
