import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

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
        const response = await fetch(`${BASE_URL}/game/my-games`, {
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
      const response = await fetch(`${BASE_URL}/game/create`, {
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

  const joinGame = async () => {
    if (!joinCode) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/game/join/${joinCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ characterName: `${user.name}'s Character` }),
      });

      const data = await response.json();
      navigate(`/game/${data.game._id}`);
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
  };
};
