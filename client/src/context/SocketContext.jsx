/* eslint-disable react-refresh/only-export-components */
import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import useToastStore from './toastStore';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [game, setGame] = useState(null);
  const [gameId, setGameId] = useState(null);
  const listenersRef = useRef(new Map());

  const addToast = useToastStore((state) => state.addToast);

  // Create socket connection on mount / when user changes
  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join user-scoped channel for personal events
      socket.emit('join-user-channel');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      if (err.message.includes('auth') || err.message.includes('token')) {
        logout();
      }
    });

    // ─── Global listeners (always active) ───────────────────────────

    socket.on('character-updated', (data) => {
      setCharacters((prev) =>
        prev.map((c) => {
          const id = data.characterId || data._id;
          if (c._id !== id) return c;
          // Merge stats separately if provided
          const updated = { ...c, ...data };
          if (data.stats) {
            updated.stats = { ...c.stats, ...data.stats };
          }
          return updated;
        }),
      );
    });

    socket.on('character-validated', (data) => {
      setCharacters((prev) =>
        prev.map((c) =>
          c._id === data.characterId
            ? {
                ...c,
                validated: data.validated,
                validationComment: data.comment,
              }
            : c,
        ),
      );
    });

    socket.on('character-created', (data) => {
      setCharacters((prev) => {
        if (prev.some((c) => c._id === data._id)) return prev;
        return [...prev, data];
      });
    });

    socket.on('character-deleted', (data) => {
      setCharacters((prev) => prev.filter((c) => c._id !== data.characterId));
    });

    socket.on('ability-added', (data) => {
      setCharacters((prev) =>
        prev.map((c) =>
          c._id === data.characterId
            ? { ...c, abilities: [...(c.abilities || []), data.ability] }
            : c,
        ),
      );
    });

    socket.on('ability-removed', (data) => {
      setCharacters((prev) =>
        prev.map((c) =>
          c._id === data.characterId
            ? {
                ...c,
                abilities: (c.abilities || []).filter(
                  (a) => a.id !== data.abilityId,
                ),
              }
            : c,
        ),
      );
    });

    socket.on('status-added', (data) => {
      setCharacters((prev) =>
        prev.map((c) =>
          c._id === data.characterId
            ? { ...c, status: [...(c.status || []), data.status] }
            : c,
        ),
      );
    });

    socket.on('status-removed', (data) => {
      setCharacters((prev) =>
        prev.map((c) =>
          c._id === data.characterId
            ? {
                ...c,
                status: (c.status || []).filter((s) => s.id !== data.statusId),
              }
            : c,
        ),
      );
    });

    socket.on('inventory-updated', (data) => {
      setCharacters((prev) =>
        prev.map((c) => {
          if (c._id !== data.characterId) return c;
          const updated = { ...c };
          if (data.inventory) updated.inventory = data.inventory;
          if (data.gold !== undefined) updated.gold = data.gold;
          if (data.stats) updated.stats = { ...c.stats, ...data.stats };
          return updated;
        }),
      );
      // Toast for player
      if (user && characters.some((c) => c.playerId === user._id)) {
        const toastMessages = {
          added: `+${data.itemData?.name || 'Item'}`,
          removed: `-${data.itemData?.name || 'Item'}`,
          equipped: `Equipado: ${data.itemData?.name || ''}`,
          unequipped: `Desequipado: ${data.itemData?.name || ''}`,
          gold_changed: `${data.goldChange > 0 ? '+' : ''}${data.goldChange} oro`,
          sold: `Vendido: ${data.itemData?.name || ''}`,
        };
        if (data.action && toastMessages[data.action]) {
          addToast({ type: 'info', message: toastMessages[data.action] });
        }
      }
    });

    socket.on('damage-applied', (data) => {
      setCharacters((prev) =>
        prev.map((c) => {
          const update = (data.updates || []).find(
            (u) => u.characterId === c._id,
          );
          if (!update) return c;
          return {
            ...c,
            stats: { ...c.stats, hp: update.hp },
            koWarning: update.koWarning || c.koWarning,
          };
        }),
      );
      // Damage toast for affected player
      if (data.updates && user) {
        const myUpdate = data.updates.find(
          (u) =>
            characters.find((c) => c._id === u.characterId)?.playerId ===
            user._id,
        );
        if (myUpdate && myUpdate.hpChange < 0) {
          addToast({
            type: 'warning',
            message: `Recibiste ${Math.abs(myUpdate.hpChange)} de daño`,
          });
        }
      }
    });

    socket.on('hp-modified', (data) => {
      setCharacters((prev) =>
        prev.map((c) =>
          c._id === data.characterId
            ? {
                ...c,
                stats: { ...c.stats, hp: data.newHp },
                isKO: data.isKO || c.isKO,
                koWarning: data.koWarning || c.koWarning,
              }
            : c,
        ),
      );
    });

    socket.on('mana-modified', (data) => {
      setCharacters((prev) =>
        prev.map((c) =>
          c._id === data.characterId
            ? { ...c, stats: { ...c.stats, mana: data.newMana } }
            : c,
        ),
      );
    });

    socket.on('sell-response', (data) => {
      if (data.approved) {
        addToast({
          type: 'success',
          message: `Venta aprobada: ${data.itemName} x${data.quantity}`,
        });
      } else {
        addToast({
          type: 'error',
          message: `Venta rechazada: ${data.reason || 'Sin razón'}`,
        });
      }
    });

    socket.on('dm:item-consumed', (data) => {
      addToast({
        type: 'info',
        message: `${data.playerName} usó ${data.itemName}`,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  // ─── Game-scoped listeners (activated when gameId is set) ─────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !gameId) return;

    socket.emit('join-game', { gameId, userId: user?._id });

    const onJoinedGame = (data) => {
      console.log('Joined game:', data);
    };

    const onPlayerJoined = () => {
      // Refresh could be triggered here if needed
    };

    const onGameUpdated = (data) => {
      setGame((prev) => (prev ? { ...prev, ...data } : data));
    };

    socket.on('joined-game', onJoinedGame);
    socket.on('player-joined', onPlayerJoined);
    socket.on('game-updated', onGameUpdated);

    return () => {
      socket.off('joined-game', onJoinedGame);
      socket.off('player-joined', onPlayerJoined);
      socket.off('game-updated', onGameUpdated);
    };
  }, [gameId, user]);

  // ─── Emit helpers ─────────────────────────────────────────────────

  const emit = useCallback(
    (event, data) => {
      const socket = socketRef.current;
      if (!socket) return;
      // Auto-append gameId if in game scope
      if (gameId) {
        socket.emit(event, { ...data, gameId });
      } else {
        socket.emit(event, data);
      }
    },
    [gameId],
  );

  const getSocket = useCallback(() => socketRef.current, []);

  // ─── Listener registration for custom events ──────────────────────

  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on(event, handler);
    // Track for cleanup
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(handler);
  }, []);

  const off = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.off(event, handler);
    listenersRef.current.get(event)?.delete(handler);
  }, []);

  // ─── Characters management ────────────────────────────────────────

  const setCharactersState = useCallback((fnOrValue) => {
    setCharacters(fnOrValue);
  }, []);

  const value = useMemo(
    () => ({
      connected,
      characters,
      setCharacters: setCharactersState,
      game,
      setGame,
      gameId,
      setGameId,
      emit,
      getSocket,
      on,
      off,
    }),
    [connected, characters, game, gameId, emit, getSocket, on, off],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
