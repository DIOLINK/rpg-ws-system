import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CharacterSheet } from '../components/CharacterSheet';
import { DMPanel } from '../components/DMPanel';
import DMTurnOrderPanel from '../components/DMTurnOrderPanel';
import { ErrorMessage } from '../components/ErrorMessage';
import ItemManager from '../components/ItemManager';
import { Loading } from '../components/Loading';
import SellRequestsPanel from '../components/SellRequestsPanel';
import ShopOffersPanel from '../components/ShopOffersPanel';
import TurnOrderBar from '../components/TurnOrderBar';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { useTurnOrderSocket } from '../hooks/useTurnOrderSocket';
import { CopyButton, MAX_GAMES_DISPLAYED } from './GameLobby';

const BASE_URL = import.meta.env.VITE_API_URL;

// Componente de alertas de KO y efectos de estado
const TurnAlert = ({ koAlert, statusEffectsApplied, onDismiss }) => {
  if (!koAlert && !statusEffectsApplied) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {/* Alerta de KO */}
      {koAlert && (
        <div
          className={`p-4 rounded-lg shadow-xl animate-bounce ${
            koAlert.type === 'ko'
              ? 'bg-red-900/95 border-2 border-red-500'
              : koAlert.type === 'warning'
                ? 'bg-yellow-900/95 border-2 border-yellow-500'
                : koAlert.type === 'revived'
                  ? 'bg-green-900/95 border-2 border-green-500'
                  : 'bg-gray-800/95 border-2 border-gray-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {koAlert.type === 'ko'
                ? '💀'
                : koAlert.type === 'warning'
                  ? '⚠️'
                  : koAlert.type === 'revived'
                    ? '✨'
                    : '❓'}
            </span>
            <div>
              <p className="font-bold text-white">
                {koAlert.type === 'ko'
                  ? `¡${koAlert.name} está KO!`
                  : koAlert.type === 'warning'
                    ? '¡Aviso de KO!'
                    : koAlert.type === 'revived'
                      ? '¡Personaje revivido!'
                      : 'Notificación'}
              </p>
              <p className="text-sm text-gray-300">{koAlert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de efectos de estado aplicados */}
      {statusEffectsApplied &&
        statusEffectsApplied.appliedEffects?.length > 0 && (
          <div className="p-4 rounded-lg shadow-xl bg-purple-900/95 border-2 border-purple-500">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✨</span>
              <div>
                <p className="font-bold text-white">
                  Efectos de turno aplicados
                </p>
                <div className="text-sm space-y-1 mt-1">
                  {statusEffectsApplied.appliedEffects.map((effect, idx) => (
                    <p
                      key={idx}
                      className={
                        effect.type === 'buff'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {effect.statusName}: {effect.value > 0 ? '+' : ''}
                      {effect.value} {effect.effect.toUpperCase()}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export const GamePage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user, isDM } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Definir fetchGameData antes de usar useGameSocket
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

  const { connected, characters, setCharacters, emit, getSocket } =
    useGameSocket(gameId, fetchGameData);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  // Ahora cada character tiene un campo player con info del usuario dueño
  const myCharacter = characters.find(
    (c) => c.player && c.player._id === user._id,
  );
  const otherCharacters = characters.filter(
    (c) => !c.player || c.player._id !== user._id,
  );

  // Sistema de turnos con iniciativa basada en dexterity
  const {
    turnOrder,
    currentTurnIndex,
    tiedGroups,
    combatStarted,
    loading: turnLoading,
    // Notificaciones
    statChanges,
    koAlert,
    statusEffectsApplied,
    // Acciones DM
    calculateTurnOrder,
    resolveTie,
    nextTurn,
    forceTurn,
    addToTurnOrder,
    removeFromTurnOrder,
    reviveCharacter,
    // Acciones HP/MP
    modifyHp,
    modifyMana,
    // Utilidades
    isCharacterKO,
  } = useTurnOrderSocket(gameId);

  // Redirigir a asignación de personaje si el usuario no tiene personaje en la partida y no es DM
  useEffect(() => {
    if (!loading && !isDM && !myCharacter) {
      navigate(`/assign-character/${gameId}`, { replace: true });
    }
  }, [loading, isDM, myCharacter, gameId, navigate]);

  const handleCharacterUpdate = (updates) => {
    const character = characters.find((c) => c.playerId === user._id);
    if (!character) return;

    // Si es añadir habilidad, usar evento específico
    if (updates.addAbility) {
      emit('player:add-ability', {
        characterId: character._id,
        ability: updates.addAbility,
        gameId,
      });
      return;
    }
    // Si es eliminar habilidad, usar evento específico
    if (updates.removeAbility) {
      emit('player:remove-ability', {
        characterId: character._id,
        abilityId: updates.removeAbility,
        gameId,
      });
      return;
    }

    emit('player:update-character', { characterId: character._id, updates });
  };

  // DM: Actualizar cualquier personaje
  const handleDMCharacterUpdate = (characterId, updates) => {
    // Si es eliminar habilidad, usar evento específico
    if (updates.removeAbility) {
      emit('dm:remove-ability', {
        characterId,
        abilityId: updates.removeAbility,
        gameId,
      });
      return;
    }
    // Si es añadir habilidad, usar evento específico
    if (updates.addAbility) {
      emit('dm:add-ability', {
        characterId,
        ability: updates.addAbility,
        gameId,
      });
      return;
    }
    emit('dm:update-character', { characterId, updates, gameId });
  };

  const handleDMCommand = (command, data) => {
    console.log('🎮 DM Command:', command, { ...data, gameId });
    emit(`dm:${command}`, { ...data, gameId });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-3 md:p-4 lg:p-6">
      {/* Alertas de KO y efectos */}
      <TurnAlert
        koAlert={koAlert}
        statusEffectsApplied={statusEffectsApplied}
      />

      {/* Panel de solicitudes de venta para DM */}
      {isDM && <SellRequestsPanel socket={getSocket()} gameId={gameId} />}

      {/* Panel de ofertas de compra para jugadores */}
      {!isDM && myCharacter && (
        <ShopOffersPanel
          socket={getSocket()}
          gameId={gameId}
          characterId={myCharacter._id}
          characterGold={myCharacter.gold || 0}
        />
      )}

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
              • Partida: {gameId.slice(MAX_GAMES_DISPLAYED)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 sm:hidden">
              ID: {gameId.slice(MAX_GAMES_DISPLAYED)}
            </span>
            <CopyButton id={gameId.slice(MAX_GAMES_DISPLAYED)} />
          </div>
        </div>
      </div>

      {/* Barra de turnos */}
      <TurnOrderBar
        turnOrder={turnOrder}
        currentTurnIndex={currentTurnIndex}
        userId={user._id}
        combatStarted={combatStarted}
        onClickCharacter={isDM ? (char) => forceTurn(char.id) : undefined}
      />

      <div className="max-w-7xl mx-auto">
        {/* Layout principal */}
        <div
          className={`grid grid-cols-1 ${
            isDM ? 'lg:grid-cols-3' : ''
          } gap-3 sm:gap-4 md:gap-6`}
        >
          {/* Panel de Control de Turnos para el DM */}
          {isDM && (
            <div className="lg:col-span-3">
              <DMTurnOrderPanel
                turnOrder={turnOrder}
                currentTurnIndex={currentTurnIndex}
                tiedGroups={tiedGroups}
                combatStarted={combatStarted}
                loading={turnLoading}
                characters={characters}
                onCalculateTurnOrder={calculateTurnOrder}
                onNextTurn={nextTurn}
                onForceTurn={forceTurn}
                onAddToTurnOrder={addToTurnOrder}
                onRemoveFromTurnOrder={removeFromTurnOrder}
                onResolveTie={resolveTie}
                onReviveCharacter={reviveCharacter}
              />
            </div>
          )}

          {/* Panel DM - Acciones de personajes */}
          {isDM && (
            <div className="lg:col-span-3">
              <DMPanel characters={characters} onDMCommand={handleDMCommand} />
            </div>
          )}

          {/* Panel DM - Gestión de Items */}
          {isDM && (
            <div className="lg:col-span-3">
              <ItemManager
                characters={characters}
                gameId={gameId}
                onItemAssigned={fetchGameData}
              />
            </div>
          )}

          {/* Mi personaje - Destacado */}
          {myCharacter && (
            <div className={isDM ? 'lg:col-span-2' : 'col-span-1 w-full'}>
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
                statChanges={statChanges}
                isKO={isCharacterKO(myCharacter._id)}
                koWarning={myCharacter.koWarning}
                gameId={gameId}
              />
            </div>
          )}

          {/* Sidebar en desktop, solo si es DM */}
          {isDM && (
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
                      {myCharacter?.stats.hp || 0}/
                      {myCharacter?.stats.maxHp || 0}
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
                    onClick={() => globalThis.location.reload()}
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
          )}
        </div>

        {/* Otros personajes */}
        {otherCharacters.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-400 flex items-center gap-2">
                👥 Otros Personajes
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {isDM
                  ? 'Como DM puedes editar todos los personajes'
                  : 'Vista de solo lectura para otros personajes'}
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
                    onUpdate={
                      isDM
                        ? (updates) =>
                            handleDMCharacterUpdate(char._id, updates)
                        : () => {}
                    }
                    canEdit={isDM}
                    statChanges={statChanges}
                    isKO={isCharacterKO(char._id)}
                    koWarning={char.koWarning}
                    gameId={gameId}
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
              <span className="font-medium text-white">
                {user.displayName ?? 'Desconocido'}
              </span>
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
