import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { authService } from '../utils/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';

export const useGameLobby = (user) => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const socket = useRef(null);

  // Conectar socket para actualizaciones en tiempo real
  useEffect(() => {
    const token = authService.getToken();
    if (!token || !user) return;

    socket.current = io(SOCKET_URL, {
      auth: { token },
    });

    socket.current.on('connect', () => {
      console.log('🔌 Socket de lobby conectado');
      socket.current.emit('join-user-channel');
    });

    // Evento cuando un jugador se une a una partida del DM
    socket.current.on('player-joined', ({ userId, gameId }) => {
      console.log('📥 player-joined:', { userId, gameId });
      // Refrescar lista de partidas
      fetchGames();
    });

    // Evento cuando se actualiza una partida
    socket.current.on('game-updated', (updatedGame) => {
      console.log('📥 game-updated:', updatedGame);
      setGames((prev) =>
        prev.map((g) =>
          g._id === updatedGame._id ? { ...g, ...updatedGame } : g,
        ),
      );
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [user]);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/game/my-games`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setGames(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const createGame = async () => {
    if (!newGameName) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/game/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGameName }),
      });

      const game = await response.json();
      navigate(`/game/${game._id}`);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const [selectGames, setSelectGames] = useState(null);

  const joinGame = async (gameId = joinCode) => {
    if (!gameId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/game/join/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.selectGames) {
        setSelectGames(data.selectGames);
      } else if (data.game) {
        navigate(`/assign-character/${data.game._id}`);
      }
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  return {
    games,
    newGameName,
    setNewGameName,
    joinCode,
    setJoinCode,
    loading,
    createGame,
    joinGame,
    selectGames,
    setSelectGames,
  };
};
