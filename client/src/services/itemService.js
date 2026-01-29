import { apiFetch } from '../utils/apiFetch';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';

// Helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || 'Error en la petición');
  }
  return response.json();
};

export const itemService = {
  // ============ CRUD DE ITEMS ============

  // Obtener todos los items
  async getAll() {
    const response = await apiFetch(`${BASE_URL}/api/items`);
    return handleResponse(response);
  },

  // Obtener un item por ID
  async getById(id) {
    const response = await apiFetch(`${BASE_URL}/api/items/${id}`);
    return handleResponse(response);
  },

  // Crear un nuevo item
  async create(itemData) {
    const response = await apiFetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    return handleResponse(response);
  },

  // Actualizar un item
  async update(id, itemData) {
    const response = await apiFetch(`${BASE_URL}/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    return handleResponse(response);
  },

  // Eliminar un item
  async delete(id) {
    const response = await apiFetch(`${BASE_URL}/api/items/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // ============ ASIGNACIÓN DE ITEMS ============

  // Asignar item a un personaje
  async assignToCharacter(characterId, { itemId, quantity = 1, gameId, item }) {
    const response = await apiFetch(
      `${BASE_URL}/api/items/assign/${characterId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity, gameId, item }),
      },
    );
    return handleResponse(response);
  },

  // Asignar item a múltiples personajes
  async assignBulk({ itemId, characterIds, quantity = 1, gameId, item }) {
    const response = await apiFetch(`${BASE_URL}/api/items/assign-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, characterIds, quantity, gameId, item }),
    });
    return handleResponse(response);
  },

  // Quitar item de un personaje
  async removeFromCharacter(characterId, inventoryId, { gameId, quantity }) {
    const response = await apiFetch(
      `${BASE_URL}/api/items/remove/${characterId}/${inventoryId}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, quantity }),
      },
    );
    return handleResponse(response);
  },

  // Modificar oro de un personaje
  async modifyGold(characterId, amount, gameId) {
    const response = await apiFetch(
      `${BASE_URL}/api/items/gold/${characterId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, gameId }),
      },
    );
    return handleResponse(response);
  },
};

// Constantes útiles
export const ITEM_TYPES = [
  { value: 'weapon', label: 'Arma', icon: '⚔️' },
  { value: 'armor', label: 'Armadura', icon: '🛡️' },
  { value: 'accessory', label: 'Accesorio', icon: '💍' },
  { value: 'consumable', label: 'Consumible', icon: '🧪' },
  { value: 'material', label: 'Material', icon: '🪨' },
  { value: 'quest', label: 'Misión', icon: '📜' },
  { value: 'misc', label: 'Misceláneo', icon: '📦' },
];

export const ITEM_RARITIES = [
  {
    value: 'common',
    label: 'Común',
    color: 'text-gray-400',
    bg: 'bg-gray-600',
  },
  {
    value: 'uncommon',
    label: 'Poco común',
    color: 'text-green-400',
    bg: 'bg-green-600',
  },
  { value: 'rare', label: 'Raro', color: 'text-blue-400', bg: 'bg-blue-600' },
  {
    value: 'epic',
    label: 'Épico',
    color: 'text-purple-400',
    bg: 'bg-purple-600',
  },
  {
    value: 'legendary',
    label: 'Legendario',
    color: 'text-orange-400',
    bg: 'bg-orange-600',
  },
  { value: 'unique', label: 'Único', color: 'text-red-400', bg: 'bg-red-600' },
];

export const EQUIP_SLOTS = [
  { value: 'mainHand', label: 'Mano principal', icon: '🗡️' },
  { value: 'offHand', label: 'Mano secundaria', icon: '🛡️' },
  { value: 'head', label: 'Cabeza', icon: '👑' },
  { value: 'chest', label: 'Pecho', icon: '👕' },
  { value: 'legs', label: 'Piernas', icon: '👖' },
  { value: 'feet', label: 'Pies', icon: '👢' },
  { value: 'hands', label: 'Manos', icon: '🧤' },
  { value: 'neck', label: 'Cuello', icon: '📿' },
  { value: 'ring1', label: 'Anillo 1', icon: '💍' },
  { value: 'ring2', label: 'Anillo 2', icon: '💍' },
];

export const getItemTypeInfo = (type) =>
  ITEM_TYPES.find((t) => t.value === type) || ITEM_TYPES[6];
export const getRarityInfo = (rarity) =>
  ITEM_RARITIES.find((r) => r.value === rarity) || ITEM_RARITIES[0];
export const getSlotInfo = (slot) => EQUIP_SLOTS.find((s) => s.value === slot);
