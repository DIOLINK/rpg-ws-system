import { useCallback, useEffect, useState } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';

/**
 * Hook para sincronizar el orden de turnos en tiempo real usando sockets.
 * Maneja el cálculo de iniciativa basado en dexterity y resolución de empates.
 * @param {string} gameId - ID de la partida
 * @returns {object} Estado y acciones para el sistema de turnos
 */
export function useTurnOrderSocket(gameId) {
  const { getSocket } = useGameSocket();
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [tiedGroups, setTiedGroups] = useState([]);
  const [combatStarted, setCombatStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Escuchar eventos de actualización de turnos
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !gameId) return;

    // Solicitar estado actual al conectar
    socket.emit('get-turn-order', { gameId });

    // Orden calculado inicialmente
    const handleCalculated = ({ turnOrder, currentTurnIndex, tiedGroups }) => {
      setTurnOrder(turnOrder);
      setCurrentTurnIndex(currentTurnIndex);
      setTiedGroups(tiedGroups || []);
      setCombatStarted(true);
      setLoading(false);
    };

    // Orden actualizado (por resolución de empate, agregar/remover personaje, etc.)
    const handleUpdated = ({ turnOrder, currentTurnIndex, tiedGroups }) => {
      setTurnOrder(turnOrder);
      setCurrentTurnIndex(currentTurnIndex);
      setTiedGroups(tiedGroups || []);
      setLoading(false);
    };

    // Turno avanzado
    const handleAdvanced = ({ currentTurnIndex, currentCharacter }) => {
      setCurrentTurnIndex(currentTurnIndex);
    };

    // Turno forzado
    const handleForced = ({ currentTurnIndex, currentCharacter }) => {
      setCurrentTurnIndex(currentTurnIndex);
    };

    // Estado inicial recibido
    const handleState = ({
      turnOrder,
      currentTurnIndex,
      combatStarted,
      tiedGroups,
    }) => {
      setTurnOrder(turnOrder || []);
      setCurrentTurnIndex(currentTurnIndex || 0);
      setCombatStarted(combatStarted || false);
      setTiedGroups(tiedGroups || []);
    };

    // Escuchar errores
    const handleError = ({ message }) => {
      console.error('Turn order error:', message);
      setLoading(false);
    };

    socket.on('turn-order-calculated', handleCalculated);
    socket.on('turn-order-updated', handleUpdated);
    socket.on('turn-advanced', handleAdvanced);
    socket.on('turn-forced', handleForced);
    socket.on('turn-order-state', handleState);
    socket.on('error', handleError);

    return () => {
      socket.off('turn-order-calculated', handleCalculated);
      socket.off('turn-order-updated', handleUpdated);
      socket.off('turn-advanced', handleAdvanced);
      socket.off('turn-forced', handleForced);
      socket.off('turn-order-state', handleState);
      socket.off('error', handleError);
    };
  }, [getSocket, gameId]);

  // DM: Calcular orden de turnos basado en dexterity
  const calculateTurnOrder = useCallback(() => {
    const socket = getSocket();
    if (!socket || !gameId) return;
    setLoading(true);
    socket.emit('dm:calculate-turn-order', { gameId });
  }, [getSocket, gameId]);

  // DM: Resolver empate manualmente
  const resolveTie = useCallback(
    (reorderedCharacters) => {
      const socket = getSocket();
      if (!socket || !gameId) return;
      setLoading(true);
      socket.emit('dm:resolve-tie', { gameId, reorderedCharacters });
    },
    [getSocket, gameId],
  );

  // DM: Actualizar el orden de turnos completo
  const updateTurnOrder = useCallback(
    (newOrder) => {
      const socket = getSocket();
      if (!socket || !gameId) return;
      setLoading(true);
      socket.emit('dm:update-turn-order', { gameId, turnOrder: newOrder });
    },
    [getSocket, gameId],
  );

  // DM: Avanzar turno
  const nextTurn = useCallback(() => {
    const socket = getSocket();
    if (!socket || !gameId) return;
    socket.emit('dm:next-turn', { gameId });
  }, [getSocket, gameId]);

  // DM: Forzar turno a un personaje específico
  const forceTurn = useCallback(
    (characterId) => {
      const socket = getSocket();
      if (!socket || !gameId) return;
      socket.emit('dm:force-turn', { gameId, characterId });
    },
    [getSocket, gameId],
  );

  // DM: Agregar personaje al orden de turnos
  const addToTurnOrder = useCallback(
    (characterId) => {
      const socket = getSocket();
      if (!socket || !gameId) return;
      setLoading(true);
      socket.emit('dm:add-to-turn-order', { gameId, characterId });
    },
    [getSocket, gameId],
  );

  // DM: Remover personaje del orden de turnos
  const removeFromTurnOrder = useCallback(
    (characterId) => {
      const socket = getSocket();
      if (!socket || !gameId) return;
      setLoading(true);
      socket.emit('dm:remove-from-turn-order', { gameId, characterId });
    },
    [getSocket, gameId],
  );

  // Obtener el personaje con el turno actual
  const currentCharacter = turnOrder[currentTurnIndex] || null;

  // Verificar si un personaje tiene el turno actual
  const isCurrentTurn = useCallback(
    (characterId) => {
      return (
        currentCharacter?.characterId?.toString() === characterId?.toString()
      );
    },
    [currentCharacter],
  );

  return {
    // Estado
    turnOrder,
    currentTurnIndex,
    currentCharacter,
    tiedGroups,
    combatStarted,
    loading,
    // Acciones DM
    calculateTurnOrder,
    resolveTie,
    updateTurnOrder,
    nextTurn,
    forceTurn,
    addToTurnOrder,
    removeFromTurnOrder,
    // Utilidades
    isCurrentTurn,
  };
}
