import { apiFetch } from '../utils/apiFetch';

const API_URL = import.meta.env.VITE_API_URL || '';

export const gameService = {
  async leaveGame(gameId) {
    const res = await apiFetch(
      `${API_URL}/game/leave/${gameId}`,
      { method: 'POST' },
      null,
      { useCache: false },
    );
    if (!res.ok)
      throw new Error(
        (await res.json()).error || 'Error al salir de la partida'
      );
    return res.json();
  },
};
