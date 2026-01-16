import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useGameLobby = (user) => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        body: JSON.stringify({ characterName: `${user.name}'s Character` }),
      });

      const data = await response.json();
      if (data.selectGames) {
        setSelectGames(data.selectGames);
      } else if (data.game) {
        navigate(`/game/${data.game._id}`);
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
