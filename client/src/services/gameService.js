const API_URL = import.meta.env.VITE_API_URL || '';

export const gameService = {
  async leaveGame(gameId, token) {
    const res = await fetch(`${API_URL}/game/leave/${gameId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
      throw new Error(
        (await res.json()).error || 'Error al salir de la partida'
      );
    return res.json();
  },
};
