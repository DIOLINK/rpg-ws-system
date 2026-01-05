import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user } = useAuth();

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
          <img
            src={user.picture}
            alt="Foto de perfil"
            className="w-24 h-24 rounded-full border-2 border-gray-700"
          />
          <div>
            <p className="text-xl text-white font-semibold">{user.name}</p>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          onClick={() => alert('Función de cerrar sesión aún no implementada')}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Profile;
