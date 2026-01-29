import { useCallback, useEffect, useState } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';

/**
 * Hook para sincronizar el orden de turnos en tiempo real usando sockets.
 * @param {string} gameId - ID de la partida
 * @param {array} initialOrder - Orden inicial de turnos (opcional)
 * @returns {object} { turnOrder, setTurnOrder, forceTurn, nextTurn }
 */
export function useTurnOrderSocket(gameId, initialOrder = []) {
  const { getSocket } = useGameSocket();
  const [turnOrder, setTurnOrder] = useState(initialOrder);
  const [currentTurn, setCurrentTurn] = useState(0);

  // Escuchar eventos de actualización de turnos
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !gameId) return;
    const handleUpdate = ({ turnOrder }) => {
      setTurnOrder(turnOrder);
    };
    const handleNext = () => {
      setCurrentTurn((prev) => (prev + 1) % (turnOrder.length || 1));
    };
    const handleForce = ({ characterId }) => {
      const idx = turnOrder.findIndex((c) => c.id === characterId);
      if (idx !== -1) setCurrentTurn(idx);
    };
    socket.on('turn-order-updated', handleUpdate);
    socket.on('turn-next', handleNext);
    socket.on('turn-forced', handleForce);
    return () => {
      socket.off('turn-order-updated', handleUpdate);
      socket.off('turn-next', handleNext);
      socket.off('turn-forced', handleForce);
    };
  }, [getSocket, gameId, turnOrder]);

  // DM: actualizar el orden de turnos
  const updateTurnOrder = useCallback(
    (newOrder) => {
      const socket = getSocket();
      if (!socket || !gameId) return;
      socket.emit('dm:update-turn-order', { gameId, turnOrder: newOrder });
    },
    [getSocket, gameId],
  );

  // DM: avanzar turno
  const nextTurn = useCallback(() => {
    const socket = getSocket();
    if (!socket || !gameId) return;
    socket.emit('dm:next-turn', { gameId });
  }, [getSocket, gameId]);

  // DM: forzar turno
  const forceTurn = useCallback(
    (characterId) => {
      const socket = getSocket();
      if (!socket || !gameId) return;
      socket.emit('dm:force-turn', { gameId, characterId });
    },
    [getSocket, gameId],
  );

  return {
    turnOrder,
    setTurnOrder: updateTurnOrder,
    nextTurn,
    forceTurn,
    currentTurn,
  };
}
