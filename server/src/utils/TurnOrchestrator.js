import { Item } from '../models/Item.js';

export class TurnOrchestrator {
  // Calcular iniciativa: PJs incluyen modifiers de items equipados, NPCs solo base
  static async calculateInitiative(characters) {
    const enrichedCharacters = await Promise.all(
      characters.map(async (char) => {
        let totalDexterity = char.stats?.dexterity || 1;
        if (!char.isNPC) {
          // Para PJs, sumar modifiers de items equipados
          const equippedItemIds = Object.values(char.equipment || {}).filter(
            (id) => id,
          );
          if (equippedItemIds.length > 0) {
            const items = await Item.find({ _id: { $in: equippedItemIds } });
            const dexterityBonus = items.reduce(
              (sum, item) => sum + (item.statModifiers?.dexterity || 0),
              0,
            );
            totalDexterity += dexterityBonus;
          }
        }
        return {
          characterId: char._id,
          name: char.name,
          initiative: totalDexterity,
          isKO: char.isKO || false,
          isNPC: char.isNPC || false,
        };
      }),
    );
    return enrichedCharacters
      .sort((a, b) => b.initiative - a.initiative)
      .map((entry, index) => ({ ...entry, position: index }));
  }

  // Encontrar grupos de empate (mover de gameSocket.js)
  static findTiedGroups(turnOrder) {
    const groups = [];
    let currentGroup = [];
    let currentInitiative = null;
    for (const entry of turnOrder) {
      if (
        currentInitiative === null ||
        entry.initiative === currentInitiative
      ) {
        currentGroup.push(entry);
        currentInitiative = entry.initiative;
      } else {
        if (currentGroup.length > 1) {
          groups.push({
            initiative: currentInitiative,
            characters: currentGroup,
          });
        }
        currentGroup = [entry];
        currentInitiative = entry.initiative;
      }
    }
    if (currentGroup.length > 1) {
      groups.push({
        initiative: currentInitiative,
        characters: currentGroup,
      });
    }
    return groups;
  }

  // Resolver tie (reordenar)
  static resolveTie(turnOrder, reorderedCharacters) {
    // Lógica para aplicar reorderedCharacters al turnOrder
    // Asumir reorderedCharacters es array de {characterId, newPosition}
    // Reordenar turnOrder basado en eso
    // Retornar nuevo turnOrder
    // (Implementar según lógica existente en dm:resolve-tie)
    return turnOrder; // Placeholder
  }

  // Next turn
  static nextTurn(game) {
    game.currentTurnIndex = (game.currentTurnIndex + 1) % game.turnOrder.length;
    return game;
  }

  // End combat
  static endCombat(game) {
    game.combatStarted = false;
    game.currentTurnIndex = 0;
    return game;
  }
}
