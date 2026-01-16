import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameLobby } from '../hooks/useGameLobby';

export const MAX_GAMES_DISPLAYED = -6;

import { useState } from 'react';
import { InputClearable } from '../components/InputClearable';

export function CopyButton({ id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      className={`ml-1 px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs font-semibold focus:outline-none transition-all duration-300 ${
        copied ? 'scale-110 bg-green-600' : ''
      }`}
      title={copied ? '¡Copiado!' : 'Copiar ID'}
      onClick={handleCopy}
    >
      {copied ? '✅' : '📋'}
    </button>
  );
}

export const GameLobby = () => {
  const { user, isDM } = useAuth();
  const navigate = useNavigate();
  const {
    games,
    newGameName,
    setNewGameName,
    joinCode,
    setJoinCode,
    loading,
    createGame,
    joinGame,
    games: allGames,
    selectGames,
    setSelectGames,
  } = useGameLobby(user, isDM);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const safeGames = Array.isArray(games) ? games : [];

  // Permitir buscar por los últimos 6 caracteres del ID
  const getFullGameId = (input) => {
    if (!input) return input;
    if (input.length === 24) return input;
    // Buscar en la lista de partidas por los últimos 6 caracteres
    const found = allGames?.find((g) => g._id.slice(-6) === input);
    return found ? found._id : input;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1">
                Bienvenido, {user.displayName}
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
            <InputClearable
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ID de la partida (completo o últimos 6)"
              className="mb-3"
            />
            <button
              onClick={() => joinGame(getFullGameId(joinCode))}
              className="w-full py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              🔗 Unirse
            </button>

            {/* Modal de selección de partidas */}
            {selectGames && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 shadow-2xl max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4 text-purple-400">
                    Selecciona la partida
                  </h3>
                  <ul className="space-y-3 mb-4">
                    {selectGames.map((g) => (
                      <li
                        key={g._id}
                        className="flex items-center justify-between bg-gray-700 rounded p-3"
                      >
                        <div>
                          <span className="font-bold text-sm text-white">
                            {g.name}
                          </span>
                          <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-600/50">
                            {g.isActive ? 'Activa' : 'Finalizada'}
                          </span>
                        </div>
                        <button
                          className="ml-4 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                          onClick={() => {
                            setSelectGames(null);
                            joinGame(g._id);
                          }}
                        >
                          Unirse
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-white font-semibold"
                    onClick={() => setSelectGames(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mis partidas */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Mis Partidas</h2>
            <span className="text-xs sm:text-sm text-gray-400">
              {safeGames.length} partida{safeGames.length !== 1 ? 's' : ''}
            </span>
          </div>

          {safeGames.length === 0 ? (
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
              {safeGames.map((game) => (
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
                    <span className="flex items-center gap-1">
                      ID: {game._id.slice(MAX_GAMES_DISPLAYED)}
                      <CopyButton id={game._id} />
                    </span>
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
