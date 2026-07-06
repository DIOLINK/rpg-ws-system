import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Hook global de socket para actualizaciones de personajes en tiempo real.
 * Consume del SocketProvider unificado.
 */
export const useCharacterSocket = (initialCharacters = []) => {
  const { connected, characters, setCharacters, emit, getSocket } =
    useSocket();
  const [initialized, setInitialized] = useState(false);

  // Sincronizar con personajes iniciales cuando cambien
  useEffect(() => {
    if (initialCharacters.length > 0 && !initialized) {
      setCharacters(initialCharacters);
      setInitialized(true);
    }
  }, [initialCharacters, initialized, setCharacters]);

  return {
    connected,
    characters,
    setCharacters,
    emit,
    getSocket,
  };
};
