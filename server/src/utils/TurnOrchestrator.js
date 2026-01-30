export class TurnOrchestrator {
  // Calcular iniciativa: PJs incluyen modifiers de items equipados, NPCs solo base
  static async calculateInitiative(characters) {
    const enrichedCharacters = await Promise.all(
      characters.map(async (char) => {
        let totalDexterity = char.stats?.dexterity || 1;
        // Sumar modifiers de items equipados para todos los personajes (PJs y NPCs)
        const equippedInventoryItems = char.inventory.filter(
          (inv) => inv.equipped,
        );
        if (equippedInventoryItems.length > 0) {
          const dexterityBonus = equippedInventoryItems.reduce(
            (sum, inv) => sum + (inv.statModifiers?.dexterity || 0),
            0,
          );
          totalDexterity += dexterityBonus;
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
    // reorderedCharacters es un objeto { characterId: newPosition }
    // Encontrar el grupo empatado (asumir que hay uno, o el primero)
    const tiedGroups = this.findTiedGroups(turnOrder);
    if (tiedGroups.length === 0) return turnOrder;

    const group = tiedGroups[0]; // Asumir el primero
    const sortedGroup = group.characters.sort((a, b) => {
      const posA = reorderedCharacters[a.characterId] ?? 999;
      const posB = reorderedCharacters[b.characterId] ?? 999;
      return posA - posB;
    });

    // Reemplazar en turnOrder
    const startIndex = turnOrder.findIndex(
      (e) => e.characterId === group.characters[0].characterId,
    );
    for (let i = 0; i < sortedGroup.length; i++) {
      turnOrder[startIndex + i] = {
        ...sortedGroup[i],
        position: startIndex + i,
      };
    }

    // Actualizar posiciones para el resto
    for (let i = startIndex + sortedGroup.length; i < turnOrder.length; i++) {
      turnOrder[i].position = i;
    }

    return turnOrder;
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
