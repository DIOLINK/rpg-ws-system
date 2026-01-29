import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { authService } from '../utils/authService';

/**
 * Hook global de socket para actualizaciones de personajes en tiempo real.
 * Se puede usar en cualquier página que necesite recibir actualizaciones de personajes.
 */
export const useCharacterSocket = (initialCharacters = []) => {
  const socket = useRef(null);
  const [connected, setConnected] = useState(false);
  const [characters, setCharacters] = useState(initialCharacters);

  // Sincronizar con personajes iniciales cuando cambien
  useEffect(() => {
    if (initialCharacters.length > 0) {
      setCharacters(initialCharacters);
    }
  }, [initialCharacters]);

  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';
    const token = authService.getToken();

    if (!token) return;

    socket.current = io(`${BASE_URL}`, {
      auth: { token },
    });

    socket.current.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket de personajes conectado');
      // Unirse al canal personal del usuario
      socket.current.emit('join-user-channel');
    });

    socket.current.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Socket de personajes desconectado');
    });

    // Evento de validación de personaje
    socket.current.on(
      'character-validated',
      ({ characterId, validated, comment }) => {
        console.log('📥 character-validated:', { characterId, validated });
        setCharacters((prev) =>
          prev.map((char) =>
            char._id === characterId
              ? { ...char, validated, validationComment: comment }
              : char,
          ),
        );
      },
    );

    // Evento de personaje actualizado (general)
    socket.current.on('character-updated', (updatedCharacter) => {
      console.log('📥 character-updated:', updatedCharacter);
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === updatedCharacter._id ||
          char._id === updatedCharacter.characterId
            ? { ...char, ...updatedCharacter }
            : char,
        ),
      );
    });

    // Evento de personaje eliminado
    socket.current.on('character-deleted', ({ characterId }) => {
      console.log('📥 character-deleted:', characterId);
      setCharacters((prev) => prev.filter((char) => char._id !== characterId));
    });

    // Evento de personaje creado
    socket.current.on('character-created', (newCharacter) => {
      console.log('📥 character-created:', newCharacter);
      setCharacters((prev) => {
        // Evitar duplicados
        if (prev.some((c) => c._id === newCharacter._id)) return prev;
        return [...prev, newCharacter];
      });
    });

    // Evento de habilidad añadida
    socket.current.on('ability-added', ({ characterId, ability }) => {
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? { ...char, abilities: [...(char.abilities || []), ability] }
            : char,
        ),
      );
    });

    // Evento de habilidad eliminada
    socket.current.on('ability-removed', ({ characterId, abilityId }) => {
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? {
                ...char,
                abilities: (char.abilities || []).filter(
                  (a) => a.id !== abilityId,
                ),
              }
            : char,
        ),
      );
    });

    // Evento de estado añadido
    socket.current.on('status-added', ({ characterId, status }) => {
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? { ...char, status: [...(char.status || []), status] }
            : char,
        ),
      );
    });

    // Evento de estado eliminado
    socket.current.on('status-removed', ({ characterId, statusId }) => {
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? {
                ...char,
                status: (char.status || []).filter((s) => s.id !== statusId),
              }
            : char,
        ),
      );
    });

    // Evento de actualización de inventario
    socket.current.on(
      'inventory-updated',
      ({ characterId, inventory, gold }) => {
        console.log('📦 [CharacterSocket] inventory-updated:', characterId);
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

    // Daño aplicado
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

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  // Función para emitir eventos
  const emit = useCallback((event, data) => {
    if (!socket.current?.connected) {
      console.error('❌ Socket no conectado');
      return;
    }
    socket.current.emit(event, data);
  }, []);

  return {
    connected,
    characters,
    setCharacters,
    emit,
    getSocket: () => socket.current,
  };
};
