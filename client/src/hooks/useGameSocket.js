import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useToastStore from '../context/toastStore';

export const useGameSocket = (gameId, onJoinedGame) => {
  const { connected, characters, setCharacters, game, setGame, emit, on, off } =
    useSocket();
  const { user, isDM } = useAuth();
  const addToast = useToastStore((state) => state.addToast);
  const [localGameId, setLocalGameId] = useState(null);

  // Set gameId in SocketProvider when this hook mounts with a gameId
  useEffect(() => {
    if (gameId) {
      setLocalGameId(gameId);
    }
  }, [gameId]);

  // Game-specific listeners
  useEffect(() => {
    if (!connected || !gameId) return;

    const onJoinedGameEvent = (data) => {
      console.log(`Te has unido a la partida ${data.gameId}`);
      if (typeof onJoinedGame === 'function') {
        onJoinedGame();
      }
    };

    on('joined-game', onJoinedGameEvent);

    return () => {
      off('joined-game', onJoinedGameEvent);
    };
  }, [connected, gameId, on, off, onJoinedGame]);

  // Emit helper that always appends gameId
  const emitToGame = useCallback(
    (event, data) => {
      if (event && event.startsWith && event.startsWith('dm:') && !isDM) {
        console.warn(
          '⚠️ Emisión de evento DM desde cliente cuando isDM=false:',
          event,
        );
      }
      emit(event, data);
    },
    [emit, isDM],
  );

  return {
    getSocket: () => useSocket().getSocket(),
    connected,
    characters,
    setCharacters,
    game,
    setGame,
    emit: emitToGame,
  };
};
