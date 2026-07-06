import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../utils/apiFetch';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useGameLobby = (user) => {
  const navigate = useNavigate();
  const { connected, on, off } = useSocket();
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectGames, setSelectGames] = useState(null);

  const fetchGames = async () => {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/game/my-games`,
        {},
        () => {},
      );
      if (response.ok) {
        const data = await response.json();
        setGames(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Lobby-specific socket listeners
  useEffect(() => {
    if (!connected) return;

    const onPlayerJoined = () => {
      fetchGames();
    };

    const onGameUpdated = (updatedGame) => {
      setGames((prev) =>
        prev.map((g) =>
          g._id === updatedGame._id ? { ...g, ...updatedGame } : g,
        ),
      );
    };

    on('player-joined', onPlayerJoined);
    on('game-updated', onGameUpdated);

    return () => {
      off('player-joined', onPlayerJoined);
      off('game-updated', onGameUpdated);
    };
  }, [connected, on, off]);

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
