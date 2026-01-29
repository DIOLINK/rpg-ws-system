import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { authService } from '../utils/authService';

export const useGameSocket = (gameId, onJoinedGame) => {
  const socket = useRef(null);
  const [connected, setConnected] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [game, setGame] = useState(null);

  // ...existing code...
  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';
    if (!gameId) return;

    socket.current = io(`${BASE_URL}`, {
      auth: {
        token: authService.getToken(),
      },
    });

    socket.current.on('connect', () => {
      setConnected(true);
      socket.current.emit('join-game', { gameId, userId: 'current-user-id' });
    });

    socket.current.on('disconnect', () => {
      setConnected(false);
    });

    // Evento de confirmación de unión a la partida
    socket.current.on('joined-game', ({ gameId, userId }) => {
      console.log(`Te has unido a la partida ${gameId} como ${userId}`);
      if (typeof onJoinedGame === 'function') {
        onJoinedGame();
      }
    });

    // Eventos de personaje
    socket.current.on('character-updated', ({ characterId, canEdit }) => {
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId ? { ...char, canEdit } : char,
        ),
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
