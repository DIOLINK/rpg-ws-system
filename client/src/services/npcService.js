import { apiFetch } from '../utils/apiFetch';

// === PLANTILLAS ===

// Obtener todas las plantillas de NPC
export const getNPCTemplates = async () => {
  return apiFetch('/api/npc/templates');
};

// Crear nueva plantilla
export const createNPCTemplate = async (templateData) => {
  return apiFetch('/api/npc/templates', {
    method: 'POST',
    body: JSON.stringify(templateData),
  });
};

// Actualizar plantilla
export const updateNPCTemplate = async (templateId, templateData) => {
  return apiFetch(`/api/npc/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(templateData),
  });
};

// Eliminar plantilla
export const deleteNPCTemplate = async (templateId) => {
  return apiFetch(`/api/npc/templates/${templateId}`, {
    method: 'DELETE',
  });
};

// === NPCs EN PARTIDA ===

// Crear NPC en una partida
export const spawnNPC = async (gameId, templateId, customData = null) => {
  return apiFetch('/api/npc/spawn', {
    method: 'POST',
    body: JSON.stringify({ gameId, templateId, customData }),
  });
};

// Obtener NPCs de una partida
export const getGameNPCs = async (gameId) => {
  return apiFetch(`/api/npc/game/${gameId}`);
};

// Matar NPC
export const killNPC = async (npcId, distributeExpTo = []) => {
  return apiFetch(`/api/npc/${npcId}/kill`, {
    method: 'POST',
    body: JSON.stringify({ distributeExpTo }),
  });
};

// Eliminar NPC
export const deleteNPC = async (npcId) => {
  return apiFetch(`/api/npc/${npcId}`, {
    method: 'DELETE',
  });
};

// Dar loot a un personaje
export const giveLoot = async (npcId, characterId, items, gold) => {
  return apiFetch(`/api/npc/${npcId}/give-loot`, {
    method: 'POST',
    body: JSON.stringify({ characterId, items, gold }),
  });
};
