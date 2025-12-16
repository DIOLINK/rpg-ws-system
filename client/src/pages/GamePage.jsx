import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CharacterSheet } from '../components/CharacterSheet';
import { DMPanel } from '../components/DMPanel';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';

const BASE_URL = import.meta.env.VITE_API_URL;

export const GamePage = () => {
  const { gameId } = useParams();
  const { user, isDM } = useAuth();
  const { _socket, connected, characters, setCharacters, emit } =
    useGameSocket(gameId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/game/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('No se pudo cargar la partida');

      const data = await response.json();
      setCharacters(data.characters);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching game:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleCharacterUpdate = (updates) => {
    const character = characters.find((c) => c.playerId === user._id);
    if (!character) return;

    emit('player:update-character', { characterId: character._id, updates });
  };

  const handleDMCommand = (command, data) => {
    emit(`dm:${command}`, data);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  const myCharacter = characters.find((c) => c.playerId === user._id);
  const otherCharacters = characters.filter((c) => c.playerId !== user._id);

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-3 md:p-4 lg:p-6">
      {/* Status Bar - Sticky en mobile */}
      <div className="sticky top-0 z-10 bg-gray-800/95 backdrop-blur-sm rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span className="text-xs sm:text-sm font-medium">
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">
              • Partida: {gameId.slice(-6)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 sm:hidden">
              ID: {gameId.slice(-6)}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(gameId)}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              📋 Copiar ID
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Panel DM - Ocupa toda la fila en desktop */}
          {isDM && (
            <div className="lg:col-span-3">
              <DMPanel characters={characters} onDMCommand={handleDMCommand} />
            </div>
          )}

          {/* Mi personaje - Destacado */}
          {myCharacter && (
            <div className="lg:col-span-2">
              <div className="mb-2 sm:mb-3">
                <h2 className="text-lg sm:text-xl font-semibold text-purple-400 flex items-center gap-2">
                  ⭐ Tu Personaje
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Solo tú puedes ver esta información completa
                </p>
              </div>
              <CharacterSheet
                character={myCharacter}
                onUpdate={handleCharacterUpdate}
              />
            </div>
          )}

          {/* Sidebar en desktop */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4">
            {/* Stats rápidos */}
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 shadow-xl">
              <h3 className="text-sm sm:text-base font-semibold mb-2 text-purple-400">
                📊 Resumen
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Personajes:</span>
                  <span className="font-medium">{characters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tu HP:</span>
                  <span className="font-medium text-red-400">
                    {myCharacter?.stats.hp || 0}/{myCharacter?.stats.maxHp || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tu Mana:</span>
                  <span className="font-medium text-blue-400">
                    {myCharacter?.stats.mana || 0}/
                    {myCharacter?.stats.maxMana || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 shadow-xl">
              <h3 className="text-sm sm:text-base font-semibold mb-2 text-purple-400">
                ⚡ Acciones
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm transition-colors"
                >
                  🔄 Recargar
                </button>
                <button
                  onClick={() =>
                    navigator.share
                      ? navigator.share({ title: 'RPG Game', text: gameId })
                      : navigator.clipboard.writeText(gameId)
                  }
                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm transition-colors"
                >
                  📤 Compartir ID
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Otros personajes */}
        {otherCharacters.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-400 flex items-center gap-2">
                👥 Otros Personajes
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Vista de solo lectura para otros personajes
              </p>
            </div>

            {/* Grid responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {otherCharacters.map((char) => (
                <div
                  key={char._id}
                  className="transform hover:scale-105 transition-transform"
                >
                  <CharacterSheet
                    character={char}
                    onUpdate={() => {}} // Solo lectura
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer informativo */}
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-800 rounded-lg shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-400">
            <p>
              Conectado como:{' '}
              <span className="font-medium text-white">{user.name}</span>
            </p>
            <p>
              Rol:{' '}
              <span
                className={`font-medium ${
                  isDM ? 'text-purple-400' : 'text-blue-400'
                }`}
              >
                {isDM ? 'Dungeon Master' : 'Jugador'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
