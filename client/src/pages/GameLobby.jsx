import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL;

export const GameLobby = () => {
  const { user, isDM } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/game/my-games`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setGames(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching games:', error);
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const createGame = async () => {
    if (!newGameName) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/game/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGameName }),
      });

      const game = await response.json();
      navigate(`/game/${game._id}`);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const joinGame = async () => {
    if (!joinCode) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/game/join/${joinCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ characterName: `${user.name}'s Character` }),
      });

      const data = await response.json();
      navigate(`/game/${data.game._id}`);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1">
                Bienvenido, {user.name}
              </h1>
              <p className="text-sm text-gray-400">
                Rol: {isDM ? '🎭 Dungeon Master' : '🎮 Jugador'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs sm:text-sm text-gray-400">En línea</span>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {isDM && (
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-shadow">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-400 flex items-center gap-2">
                🎲 Crear Partida
              </h2>
              <input
                type="text"
                placeholder="Nombre de la partida"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg mb-3 text-sm sm:text-base"
              />
              <button
                onClick={createGame}
                className="w-full py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                🎲 Crear Partida
              </button>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-shadow">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-400 flex items-center gap-2">
              🔗 Unirse a Partida
            </h2>
            <input
              type="text"
              placeholder="ID de la partida"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg mb-3 text-sm sm:text-base"
            />
            <button
              onClick={joinGame}
              className="w-full py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              🔗 Unirse
            </button>
          </div>
        </div>

        {/* Mis partidas */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Mis Partidas</h2>
            <span className="text-xs sm:text-sm text-gray-400">
              {games.length} partida{games.length !== 1 ? 's' : ''}
            </span>
          </div>

          {games.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎲</div>
              <p className="text-gray-500 text-sm sm:text-base">
                No estás en ninguna partida aún
              </p>
              <p className="text-gray-600 text-xs mt-2">
                Crea una nueva o únete a una existente
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {games.map((game) => (
                <div
                  key={game._id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                  onClick={() => navigate(`/game/${game._id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm sm:text-base truncate flex-1">
                      {game.name}
                    </h3>
                    <span
                      className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        game.isActive ? 'bg-green-600/50' : 'bg-gray-600/50'
                      }`}
                    >
                      {game.isActive ? 'Activa' : 'Finalizada'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-400">
                    <span>
                      {game.players.length} jugador
                      {game.players.length !== 1 ? 'es' : ''}
                    </span>
                    <span>ID: {game._id.slice(-6)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
