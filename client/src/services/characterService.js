const API_URL = import.meta.env.VITE_API_URL || '';

export const characterService = {
  async assignToGame(characterId, gameId, token) {
    const res = await fetch(
      `${API_URL}/game/games/${gameId}/assign-character`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ characterId }),
      }
    );
    if (!res.ok)
      throw new Error(
        (await res.json()).error || 'Error al asociar personaje a partida'
      );
    return res.json();
  },
  async getAll(token) {
    const res = await fetch(`${API_URL}/characters`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener personajes');
    return res.json();
  },
  async create(character, token) {
    const res = await fetch(`${API_URL}/characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(character),
    });
    if (!res.ok)
      throw new Error((await res.json()).error || 'Error al crear personaje');
    return res.json();
  },
  async update(id, data, token) {
    const res = await fetch(`${API_URL}/characters/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error((await res.json()).error || 'Error al editar personaje');
    return res.json();
  },
  async remove(id, token) {
    const res = await fetch(`${API_URL}/characters/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
      throw new Error(
        (await res.json()).error || 'Error al eliminar personaje'
      );
    return res.json();
  },
  async sendToValidation(id, token) {
    const res = await fetch(`${API_URL}/characters/${id}/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
      throw new Error(
        (await res.json()).error || 'Error al enviar a validación'
      );
    return res.json();
  },
};
