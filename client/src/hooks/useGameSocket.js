import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import useToastStore from '../context/toastStore';
import { authService } from '../utils/authService';

export const useGameSocket = (gameId, onJoinedGame) => {
  const socket = useRef(null);
  const [connected, setConnected] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [game, setGame] = useState(null);
  const addToast = useToastStore((state) => state.addToast);
  const { user, isDM } = useAuth();

  // ...existing code...
  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';
    if (!gameId) return;

    socket.current = io(`${BASE_URL}`, {
      auth: {
        token: authService.getToken(),
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.current.on('connect', () => {
      setConnected(true);
      console.log('🔌 [GameSocket] Conectado, uniéndose a partida:', gameId);
      socket.current.emit('join-game', { gameId, userId: 'current-user-id' });
      // También unirse al canal del usuario para recibir notificaciones personales
      socket.current.emit('join-user-channel');
    });

    socket.current.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 [GameSocket] Desconectado');
    });

    // Escuchar TODOS los eventos para depuración
    socket.current.onAny((eventName, ...args) => {
      console.log(`📨 [GameSocket] Evento recibido: ${eventName}`, args);
    });

    // Evento de respuesta de venta (solo para jugadores, no DM)
    socket.current.on('sell-response', (response) => {
      console.log('💰 [GameSocket] sell-response recibido:', response);

      // El DM no debe ver este toast
      if (isDM) {
        console.log('💰 DM ignorando sell-response');
        return;
      }

      try {
        const { addToast } = useToastStore.getState();
        if (response.approved) {
          addToast({
            type: 'success',
            message: `✅ Venta aprobada!\n${response.itemName} x${response.quantity} por ${response.totalValue} oro`,
          });
        } else {
          addToast({
            type: 'error',
            message: `❌ Venta rechazada\n${response.itemName || 'Item'}: ${response.reason || 'El DM ha rechazado la venta'}`,
          });
        }
      } catch (err) {
        console.error('❌ Error en sell-response handler:', err);
      }
    });

    // Evento de respuesta de tienda (cuando jugador acepta/rechaza oferta del DM)
    socket.current.on('shop-response', (response) => {
      console.log('🏪 [GameSocket] shop-response recibido:', response);

      // Solo el DM debe ver este toast
      if (!isDM) {
        console.log('🏪 Jugador ignorando shop-response');
        return;
      }

      try {
        const { addToast } = useToastStore.getState();
        if (response.accepted) {
          addToast({
            type: 'success',
            message: `✅ ${response.characterName} compró ${response.itemSummary} por ${response.totalPrice} oro`,
          });
        } else {
          addToast({
            type: 'info',
            message: `❌ ${response.characterName} rechazó la oferta (${response.itemSummary})`,
          });
        }
      } catch (err) {
        console.error('❌ Error en shop-response handler:', err);
      }
    });

    // Evento de confirmación de unión a la partida
    socket.current.on('joined-game', ({ gameId, userId }) => {
      console.log(`Te has unido a la partida ${gameId} como ${userId}`);
      if (typeof onJoinedGame === 'function') {
        onJoinedGame();
      }
    });

    // Eventos de personaje
    socket.current.on('character-updated', (updatedData) => {
      console.log('📥 [GameSocket] character-updated:', updatedData);
      setCharacters((prev) =>
        prev.map((char) => {
          if (
            char._id === updatedData.characterId ||
            char._id === updatedData._id
          ) {
            return {
              ...char,
              ...updatedData,
              // Mezclar stats correctamente si vienen en la actualización
              stats: updatedData.stats
                ? { ...char.stats, ...updatedData.stats }
                : char.stats,
            };
          }
          return char;
        }),
      );
    });

    socket.current.on('ability-added', ({ characterId, ability }) => {
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? { ...char, abilities: [...char.abilities, ability] }
            : char,
        ),
      );
    });

    socket.current.on('ability-removed', ({ characterId, abilityId }) => {
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? {
                ...char,
                abilities: char.abilities.filter((a) => a.id !== abilityId),
              }
            : char,
        ),
      );
    });

    socket.current.on('damage-applied', ({ updates }) => {
      setCharacters((prev) =>
        prev.map((char) => {
          const update = updates.find((u) => u.characterId === char._id);
          return update
            ? { ...char, stats: { ...char.stats, hp: update.hp } }
            : char;
        }),
      );
    });

    socket.current.on('status-added', ({ characterId, status }) => {
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? { ...char, status: [...char.status, status] }
            : char,
        ),
      );
    });

    socket.current.on('status-removed', ({ characterId, statusId }) => {
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? { ...char, status: char.status.filter((s) => s.id !== statusId) }
            : char,
        ),
      );
    });

    // Evento de actualización de inventario
    socket.current.on(
      'inventory-updated',
      ({ characterId, inventory, gold, itemData, action }) => {
        console.log('📦 [GameSocket] inventory-updated:', {
          characterId,
          action,
          itemData,
        });
        setCharacters((prev) =>
          prev.map((char) =>
            char._id === characterId
              ? {
                  ...char,
                  inventory: inventory || char.inventory,
                  gold: gold ?? char.gold,
                }
              : char,
          ),
        );
      },
    );

    // Evento de validación de personaje
    socket.current.on(
      'character-validated',
      ({ characterId, validated, comment }) => {
        setCharacters((prev) =>
          prev.map((char) =>
            char._id === characterId
              ? { ...char, validated, validationComment: comment }
              : char,
          ),
        );
      },
    );

    return () => {
      socket.current?.disconnect();
    };
  }, [gameId]);

  const emit = (event, data) => {
    console.log(
      '📡 Socket emit:',
      event,
      data,
      'Socket connected:',
      socket.current?.connected,
    );
    if (!socket.current) {
      console.error('❌ Socket no existe');
      return;
    }
    socket.current.emit(event, { ...data, gameId });
  };

  return {
    getSocket: () => socket.current,
    connected,
    characters,
    setCharacters,
    game,
    setGame,
    emit,
  };
};
