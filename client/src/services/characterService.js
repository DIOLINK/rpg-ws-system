import { apiFetch } from '../utils/apiFetch';

const API_URL = import.meta.env.VITE_API_URL || '';

export const characterService = {
  async assignToGame(characterId, gameId) {
    const res = await apiFetch(
      `${API_URL}/game/games/${gameId}/assign-character`,
      {
        method: 'POST',
        body: JSON.stringify({ characterId }),
      },
      null,
      { useCache: false },
    );
    if (!res.ok)
      throw new Error(
        (await res.json()).error || 'Error al asociar personaje a partida'
      );
    return res.json();
  },
  async getAll() {
    const res = await apiFetch(`${API_URL}/characters`);
    if (!res.ok) throw new Error('Error al obtener personajes');
    return res.json();
  },
  async create(character) {
    const res = await apiFetch(
      `${API_URL}/characters`,
      {
        method: 'POST',
        body: JSON.stringify(character),
      },
      null,
      { useCache: false },
    );
    if (!res.ok)
      throw new Error((await res.json()).error || 'Error al crear personaje');
    return res.json();
  },
  async update(id, data) {
    const res = await apiFetch(
      `${API_URL}/characters/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      null,
      { useCache: false },
    );
    if (!res.ok)
      throw new Error((await res.json()).error || 'Error al editar personaje');
    return res.json();
  },
  async remove(id) {
    const res = await apiFetch(
      `${API_URL}/characters/${id}`,
      { method: 'DELETE' },
      null,
      { useCache: false },
    );
    if (!res.ok)
      throw new Error(
        (await res.json()).error || 'Error al eliminar personaje'
      );
    return res.json();
  },
  async sendToValidation(id) {
    const res = await apiFetch(
      `${API_URL}/characters/${id}/send`,
      { method: 'POST' },
      null,
      { useCache: false },
    );
    if (!res.ok)
      throw new Error(
        (await res.json()).error || 'Error al enviar a validación'
      );
    return res.json();
  },
};
