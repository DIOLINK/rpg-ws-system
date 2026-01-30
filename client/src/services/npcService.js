import { apiFetch } from '../utils/apiFetch';

// === PLANTILLAS ===

// Obtener todas las plantillas de NPC
export const getNPCTemplates = async () => {
  const res = await apiFetch('/api/npc/templates');
  return res.json();
};

// Crear nueva plantilla
export const createNPCTemplate = async (templateData) => {
  const res = await apiFetch('/api/npc/templates', {
    method: 'POST',
    body: JSON.stringify(templateData),
  });
  return res.json();
};

// Actualizar plantilla
export const updateNPCTemplate = async (templateId, templateData) => {
  const res = await apiFetch(`/api/npc/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(templateData),
  });
  return res.json();
};

// Eliminar plantilla
export const deleteNPCTemplate = async (templateId) => {
  const res = await apiFetch(`/api/npc/templates/${templateId}`, {
    method: 'DELETE',
  });
  return res.json();
};

// === NPCs EN PARTIDA ===

// Crear NPC en una partida
export const spawnNPC = async (gameId, templateId, customData = null) => {
  const res = await apiFetch('/api/npc/spawn', {
    method: 'POST',
    body: JSON.stringify({ gameId, templateId, customData }),
  });
  return res.json();
};

// Obtener NPCs de una partida
export const getGameNPCs = async (gameId) => {
  const res = await apiFetch(`/api/npc/game/${gameId}`);
  return res.json();
};

// Matar NPC
export const killNPC = async (npcId, distributeExpTo = []) => {
  const res = await apiFetch(`/api/npc/${npcId}/kill`, {
    method: 'POST',
    body: JSON.stringify({ distributeExpTo }),
  });
  return res.json();
};

// Eliminar NPC
export const deleteNPC = async (npcId) => {
  const res = await apiFetch(`/api/npc/${npcId}`, {
    method: 'DELETE',
  });
  return res.json();
};

// Dar loot a un personaje
export const giveLoot = async (npcId, characterId, items, gold) => {
  const res = await apiFetch(`/api/npc/${npcId}/give-loot`, {
    method: 'POST',
    body: JSON.stringify({ characterId, items, gold }),
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    console.error('giveLoot: response not JSON', e);
  }
  return { status: res.status, ok: res.ok, body };
};
