import { useCallback, useEffect, useRef, useState } from 'react';
import useToastStore from '../context/toastStore.js';

/**
 * Hook para sincronizar el orden de turnos en tiempo real usando sockets.
 * Maneja el cálculo de iniciativa basado en dexterity, resolución de empates,
 * modificaciones de HP/MP y estado de KO.
 * @param {string} gameId - ID de la partida
 * @returns {object} Estado y acciones para el sistema de turnos
 */
// Ahora el hook acepta `getSocket` para reutilizar el socket ya inicializado
export function useTurnOrderSocket(gameId, getSocket, emit) {
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [tiedGroups, setTiedGroups] = useState([]);
  const [combatStarted, setCombatStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado para notificaciones de cambios HP/MP
  const [statChanges, setStatChanges] = useState(null);
  const [koAlert, setKoAlert] = useState(null);
  const [statusEffectsApplied, setStatusEffectsApplied] = useState(null);
  const lastTurnOrderStr = useRef(null);

  // Escuchar eventos de actualización de turnos
  useEffect(() => {
    const socket = getSocket ? getSocket() : null;
    if (!socket || !gameId) return;

    // Solicitar estado actual al conectar (usar emit wrapper si está disponible)
    if (emit) {
      emit('get-turn-order', { gameId });
    } else {
      socket.emit('get-turn-order', { gameId });
    }

    // Orden calculado inicialmente
    const handleCalculated = ({ turnOrder, currentTurnIndex, tiedGroups }) => {
      try {
        const newStr = JSON.stringify(turnOrder || []);
        if (lastTurnOrderStr.current === newStr) {
          // Evitar actualizaciones redundantes que pueden causar loops
          setLoading(false);
          return;
        }
        lastTurnOrderStr.current = newStr;
      } catch (err) {
        // ignore stringify errors
      }
      setTurnOrder(turnOrder);
      setCurrentTurnIndex(currentTurnIndex);
      setTiedGroups(tiedGroups || []);
      setCombatStarted(true);
      setLoading(false);
      if (turnOrder.length > 0) {
        const current = turnOrder[currentTurnIndex];
        useToastStore.getState().addToast({
          message: `Inicio de combate. Turno de ${current?.name || 'desconocido'}`,
          type: 'info',
        });
      }
    };

    // Orden actualizado (por resolución de empate, agregar/remover personaje, etc.)
    const handleUpdated = ({ turnOrder, currentTurnIndex, tiedGroups }) => {
      try {
        const newStr = JSON.stringify(turnOrder || []);
        if (lastTurnOrderStr.current === newStr) {
          setLoading(false);
          return;
        }
        lastTurnOrderStr.current = newStr;
      } catch (err) {}
      setTurnOrder(turnOrder);
      setCurrentTurnIndex(currentTurnIndex);
      setTiedGroups(tiedGroups || []);
      setLoading(false);
    };

    // Turno avanzado (con efectos de estados y verificación de KO)
    const handleAdvanced = ({
      currentTurnIndex,
      currentCharacter,
      statusEffects,
      koWarning,
      characterKO,
    }) => {
      setCurrentTurnIndex(currentTurnIndex);
      setTiedGroups([]); // Limpiar empates al avanzar turno
      if (currentCharacter) {
        useToastStore.getState().addToast({
          message: `Turno de ${currentCharacter.name}`,
          type: 'info',
        });
      }

      // Notificar efectos de estados aplicados
      if (statusEffects && statusEffects.appliedEffects?.length > 0) {
        setStatusEffectsApplied(statusEffects);
        // Limpiar después de 5 segundos
        setTimeout(() => setStatusEffectsApplied(null), 5000);
      }

      // Notificar aviso de KO
      if (koWarning) {
        setKoAlert({
          type: 'warning',
          ...koWarning,
        });
        setTimeout(() => setKoAlert(null), 8000);
      }

      // Notificar KO confirmado
      if (characterKO) {
        setKoAlert({
          type: characterKO.wasAlreadyKO ? 'info' : 'ko',
          ...characterKO,
        });
        setTimeout(() => setKoAlert(null), 8000);

        // Actualizar el turnOrder con el estado KO
        setTurnOrder((prev) =>
          prev.map((entry) =>
            entry.characterId?.toString() ===
            characterKO.characterId?.toString()
              ? { ...entry, isKO: true }
              : entry,
          ),
        );
      }
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

    // HP modificado
    const handleHpModified = ({
      characterId,
      oldHp,
      newHp,
      maxHp,
      change,
      reason,
      koWarning,
      isKO,
    }) => {
      setStatChanges({
        type: 'hp',
        characterId,
        oldValue: oldHp,
        newValue: newHp,
        maxValue: maxHp,
        change,
        reason,
        timestamp: Date.now(),
      });

      // Limpiar después de 3 segundos
      setTimeout(() => setStatChanges(null), 3000);

      // Si hay aviso de KO
      if (koWarning) {
        setKoAlert({
          type: 'warning',
          characterId,
          message: '¡HP en 0! KO en el siguiente turno',
        });
        setTimeout(() => setKoAlert(null), 8000);
      }
    };

    // Mana modificado
    const handleManaModified = ({
      characterId,
      oldMana,
      newMana,
      maxMana,
      change,
      reason,
    }) => {
      setStatChanges({
        type: 'mana',
        characterId,
        oldValue: oldMana,
        newValue: newMana,
        maxValue: maxMana,
        change,
        reason,
        timestamp: Date.now(),
      });

      setTimeout(() => setStatChanges(null), 3000);
    };

    // Daño aplicado (puede tener múltiples targets)
    const handleDamageApplied = ({ updates }) => {
      for (const update of updates) {
        if (update.koWarning) {
          setKoAlert({
            type: 'warning',
            characterId: update.characterId,
            message: '¡HP en 0! KO en el siguiente turno',
          });
          setTimeout(() => setKoAlert(null), 8000);
        }
      }
    };

    // Personaje revivido
    const handleRevived = ({ characterId, name, hp }) => {
      setKoAlert({
        type: 'revived',
        characterId,
        name,
        message: `¡${name} ha sido revivido con ${hp} HP!`,
      });
      setTimeout(() => setKoAlert(null), 5000);

      // Actualizar turnOrder
      setTurnOrder((prev) =>
        prev.map((entry) =>
          entry.characterId?.toString() === characterId?.toString()
            ? { ...entry, isKO: false }
            : entry,
        ),
      );
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
    socket.on('hp-modified', handleHpModified);
    socket.on('mana-modified', handleManaModified);
    socket.on('damage-applied', handleDamageApplied);
    socket.on('character-revived', handleRevived);
    socket.on('error', handleError);

    return () => {
      socket.off('turn-order-calculated', handleCalculated);
      socket.off('turn-order-updated', handleUpdated);
      socket.off('turn-advanced', handleAdvanced);
      socket.off('turn-forced', handleForced);
      socket.off('turn-order-state', handleState);
      socket.off('hp-modified', handleHpModified);
      socket.off('mana-modified', handleManaModified);
      socket.off('damage-applied', handleDamageApplied);
      socket.off('character-revived', handleRevived);
      socket.off('error', handleError);
    };
  }, [getSocket, gameId]);

  // DM: Calcular orden de turnos basado en dexterity
  const calculateTurnOrder = useCallback(() => {
    console.log(
      '[useTurnOrderSocket] calculateTurnOrder called, gameId:',
      gameId,
    );
    if (!gameId) return;
    setLoading(true);
    setTiedGroups([]); // Reset tiedGroups when starting calculation
    if (emit) {
      emit('dm:calculate-turn-order', { gameId });
      return;
    }
    const socket = getSocket ? getSocket() : null;
    if (!socket) {
      console.warn(
        '[useTurnOrderSocket] Socket ausente, no se emitirá dm:calculate-turn-order',
      );
      setLoading(false);
      return;
    }
    socket.emit('dm:calculate-turn-order', { gameId });
  }, [getSocket, emit, gameId]);

  // DM: Terminar combate
  const endCombat = useCallback(() => {
    setTiedGroups([]); // Limpiar empates al terminar combate
    if (emit) return emit('dm:end-combat', { gameId });
    const socket = getSocket ? getSocket() : null;
    if (!socket || !gameId) return;
    socket.emit('dm:end-combat', { gameId });
  }, [getSocket, emit, gameId]);

  // DM: Resolver empate manualmente
  const resolveTie = useCallback(
    (reorderedCharacters) => {
      if (emit) {
        setLoading(true);
        emit('dm:resolve-tie', { gameId, reorderedCharacters });
        return;
      }
      const socket = getSocket();
      if (!socket || !gameId) return;
      setLoading(true);
      socket.emit('dm:resolve-tie', { gameId, reorderedCharacters });
    },
    [getSocket, emit, gameId],
  );

  // DM: Actualizar el orden de turnos completo
  const updateTurnOrder = useCallback(
    (newOrder) => {
      if (emit) {
        setLoading(true);
        emit('dm:update-turn-order', { gameId, turnOrder: newOrder });
        return;
      }
      const socket = getSocket();
      if (!socket || !gameId) return;
      setLoading(true);
      socket.emit('dm:update-turn-order', { gameId, turnOrder: newOrder });
    },
    [getSocket, emit, gameId],
  );

  // DM: Avanzar turno
  const nextTurn = useCallback(() => {
    if (emit) return emit('dm:next-turn', { gameId });
    const socket = getSocket();
    if (!socket || !gameId) return;
    socket.emit('dm:next-turn', { gameId });
  }, [getSocket, emit, gameId]);

  // DM: Forzar turno a un personaje específico
  const forceTurn = useCallback(
    (characterId) => {
      if (emit) return emit('dm:force-turn', { gameId, characterId });
      const socket = getSocket();
      if (!socket || !gameId) return;
      socket.emit('dm:force-turn', { gameId, characterId });
    },
    [getSocket, emit, gameId],
  );

  // DM: Agregar personaje al orden de turnos
  const addToTurnOrder = useCallback(
    (characterId) => {
      if (emit) {
        setLoading(true);
        emit('dm:add-to-turn-order', { gameId, characterId });
        return;
      }
      const socket = getSocket();
      if (!socket || !gameId) return;
      setLoading(true);
      socket.emit('dm:add-to-turn-order', { gameId, characterId });
    },
    [getSocket, emit, gameId],
  );

  // DM: Remover personaje del orden de turnos
  const removeFromTurnOrder = useCallback(
    (characterId) => {
      if (emit) {
        setLoading(true);
        emit('dm:remove-from-turn-order', { gameId, characterId });
        return;
      }
      const socket = getSocket();
      if (!socket || !gameId) return;
      setLoading(true);
      socket.emit('dm:remove-from-turn-order', { gameId, characterId });
    },
    [getSocket, emit, gameId],
  );

  // Modificar HP (jugador o DM)
  const modifyHp = useCallback(
    (characterId, amount, reason) => {
      if (emit)
        return emit('modify-hp', { characterId, amount, gameId, reason });
      const socket = getSocket();
      if (!socket || !gameId) return;
      socket.emit('modify-hp', { characterId, amount, gameId, reason });
    },
    [getSocket, emit, gameId],
  );

  // Modificar Mana (jugador o DM)
  const modifyMana = useCallback(
    (characterId, amount, reason) => {
      if (emit)
        return emit('modify-mana', { characterId, amount, gameId, reason });
      const socket = getSocket();
      if (!socket || !gameId) return;
      socket.emit('modify-mana', { characterId, amount, gameId, reason });
    },
    [getSocket, emit, gameId],
  );

  // DM: Revivir personaje
  const reviveCharacter = useCallback(
    (characterId, hpAmount = 1) => {
      if (emit)
        return emit('dm:revive-character', { characterId, hpAmount, gameId });
      const socket = getSocket();
      if (!socket || !gameId) return;
      socket.emit('dm:revive-character', { characterId, hpAmount, gameId });
    },
    [getSocket, emit, gameId],
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

  // Verificar si un personaje está en KO
  const isCharacterKO = useCallback(
    (characterId) => {
      const entry = turnOrder.find(
        (t) => t.characterId?.toString() === characterId?.toString(),
      );
      return entry?.isKO || false;
    },
    [turnOrder],
  );

  return {
    // Estado
    turnOrder,
    currentTurnIndex,
    currentCharacter,
    tiedGroups,
    combatStarted,
    loading,
    // Notificaciones
    statChanges,
    koAlert,
    statusEffectsApplied,
    // Acciones DM
    calculateTurnOrder,
    resolveTie,
    updateTurnOrder,
    nextTurn,
    forceTurn,
    addToTurnOrder,
    removeFromTurnOrder,
    endCombat,
    reviveCharacter,
    // Acciones HP/MP
    modifyHp,
    modifyMana,
    // Utilidades
    isCurrentTurn,
    isCharacterKO,
  };
}
