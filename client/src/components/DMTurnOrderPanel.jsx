import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

/**
 * Panel de control de turnos para el DM.
 * Separa la lógica de presentación de la lógica de negocio (hooks).
 */
export function DMTurnOrderPanel({
  turnOrder,
  currentTurnIndex,
  tiedGroups,
  combatStarted,
  loading,
  characters,
  // Acciones
  onCalculateTurnOrder,
  onNextTurn,
  onForceTurn,
  onAddToTurnOrder,
  onRemoveFromTurnOrder,
  onResolveTie,
  onReviveCharacter,
}) {
  const [selectedForTie, setSelectedForTie] = useState({});
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [reviveHp, setReviveHp] = useState({});

  // Personajes que no están en el orden de turnos
  const charactersNotInOrder = useMemo(() => {
    const inOrderIds = new Set(turnOrder.map((t) => t.characterId?.toString()));
    return characters.filter((c) => !inOrderIds.has(c._id?.toString()));
  }, [characters, turnOrder]);

  // Personajes en KO
  const koCharacters = useMemo(() => {
    return turnOrder.filter((entry) => entry.isKO);
  }, [turnOrder]);

  // Manejar cambio de posición en grupo empatado
  const handleTiePositionChange = (groupIndex, characterId, newPosition) => {
    setSelectedForTie((prev) => ({
      ...prev,
      [groupIndex]: {
        ...prev[groupIndex],
        [characterId]: newPosition,
      },
    }));
  };

  // Aplicar resolución de empate
  const handleResolveTie = (groupIndex, group) => {
    const positions = selectedForTie[groupIndex] || {};
    const reorderedCharacters = group.characters.map((char, idx) => ({
      characterId: char.characterId,
      newPosition: positions[char.characterId?.toString()] ?? char.position,
    }));
    onResolveTie(reorderedCharacters);
    setSelectedForTie((prev) => {
      const next = { ...prev };
      delete next[groupIndex];
      return next;
    });
  };

  // Obtener el personaje actual
  const currentCharacter = turnOrder[currentTurnIndex];

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-xl border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
          ⚔️ Control de Turnos
        </h3>
        {loading && (
          <span className="text-xs text-gray-400 animate-pulse">
            Procesando...
          </span>
        )}
      </div>

      {/* Botón para iniciar/recalcular combate */}
      {combatStarted ? (
        <button
          onClick={onCalculateTurnOrder}
          disabled={loading}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm transition-colors mb-4"
        >
          🔄 Recalcular Iniciativa
        </button>
      ) : (
        <button
          onClick={onCalculateTurnOrder}
          disabled={loading || characters.length === 0}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors mb-4"
        >
          🎲 Calcular Iniciativa (Dexterity)
        </button>
      )}

      {/* Controles de turno activo */}
      {combatStarted && turnOrder.length > 0 && (
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs text-gray-400">Turno actual:</span>
              <p className="font-semibold text-green-400">
                🎯 {currentCharacter?.name || 'Sin turno'}
              </p>
              <span className="text-xs text-gray-500">
                Iniciativa: {currentCharacter?.initiative || 0}
              </span>
            </div>
            <button
              onClick={onNextTurn}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              ⏭️ Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Lista de orden de turnos */}
      {combatStarted && turnOrder.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">
            📋 Orden de Turnos
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {turnOrder.map((entry, idx) => (
              <div
                key={entry.characterId}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  entry.isKO
                    ? 'bg-red-900/30 border border-red-500/50 opacity-60'
                    : idx === currentTurnIndex
                      ? 'bg-green-600/30 border border-green-500/50'
                      : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-5">{idx + 1}.</span>
                  {entry.isKO && <span className="text-sm">💀</span>}
                  <span
                    className={`font-medium text-sm ${
                      entry.isKO
                        ? 'text-red-400 line-through'
                        : idx === currentTurnIndex
                          ? 'text-green-300'
                          : 'text-white'
                    }`}
                  >
                    {entry.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    (DEX: {entry.initiative})
                  </span>
                </div>
                <div className="flex gap-1">
                  {entry.isKO ? (
                    <span className="text-xs text-red-400 px-2">KO</span>
                  ) : idx !== currentTurnIndex ? (
                    <>
                      <button
                        onClick={() => onForceTurn(entry.characterId)}
                        disabled={loading}
                        className="px-2 py-1 bg-yellow-600/50 hover:bg-yellow-600 rounded text-xs transition-colors"
                        title="Forzar turno"
                      >
                        🎯
                      </button>
                      <button
                        onClick={() => onRemoveFromTurnOrder(entry.characterId)}
                        disabled={loading}
                        className="px-2 py-1 bg-red-600/50 hover:bg-red-600 rounded text-xs transition-colors"
                        title="Remover del combate"
                      >
                        ✖️
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-green-400 px-2">
                      ▶ Activo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personajes en KO */}
      {koCharacters.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
            💀 Personajes KO ({koCharacters.length})
          </h4>
          <div className="space-y-2">
            {koCharacters.map((entry) => {
              const char = characters.find(
                (c) => c._id?.toString() === entry.characterId?.toString(),
              );
              return (
                <div
                  key={entry.characterId}
                  className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                >
                  <div>
                    <span className="text-sm text-red-300">{entry.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      Max HP: {char?.stats?.maxHp || 10}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={char?.stats?.maxHp || 10}
                      value={reviveHp[entry.characterId?.toString()] || 1}
                      onChange={(e) =>
                        setReviveHp((prev) => ({
                          ...prev,
                          [entry.characterId?.toString()]:
                            Number.parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-16 px-2 py-1 bg-gray-700 rounded text-xs text-center"
                      placeholder="HP"
                    />
                    <button
                      onClick={() => {
                        if (onReviveCharacter) {
                          onReviveCharacter(
                            entry.characterId,
                            reviveHp[entry.characterId?.toString()] || 1,
                          );
                        }
                      }}
                      disabled={loading || !onReviveCharacter}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs font-medium transition-colors"
                    >
                      ✨ Revivir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grupos empatados */}
      {tiedGroups.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2">
            ⚠️ Empates Detectados
          </h4>
          <p className="text-xs text-gray-400 mb-3">
            Los siguientes personajes tienen la misma iniciativa. Puedes
            reordenarlos manualmente.
          </p>
          {tiedGroups.map((group, groupIdx) => (
            <div
              key={`tie-${group.initiative}`}
              className="mb-3 p-2 bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-yellow-400">
                  Iniciativa {group.initiative}:
                </span>
              </div>
              <div className="space-y-1">
                {group.characters.map((char, charIdx) => (
                  <div
                    key={char.characterId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{char.name}</span>
                    <select
                      value={
                        selectedForTie[groupIdx]?.[
                          char.characterId?.toString()
                        ] ?? char.position
                      }
                      onChange={(e) =>
                        handleTiePositionChange(
                          groupIdx,
                          char.characterId?.toString(),
                          Number.parseInt(e.target.value),
                        )
                      }
                      className="px-2 py-1 bg-gray-700 rounded text-xs"
                      disabled={
                        currentCharacter?.characterId?.toString() ===
                        char.characterId?.toString()
                      }
                    >
                      {group.characters.map((c, posIdx) => (
                        <option
                          key={`pos-${c.characterId}-${posIdx}`}
                          value={group.characters[0].position + posIdx}
                        >
                          Posición {group.characters[0].position + posIdx + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleResolveTie(groupIdx, group)}
                disabled={loading}
                className="mt-2 w-full py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded text-xs font-medium transition-colors"
              >
                ✅ Aplicar Orden
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Agregar personaje al combate */}
      {combatStarted && (
        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={() => setShowAddCharacter(!showAddCharacter)}
            className="w-full py-2 bg-blue-600/50 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors mb-2"
          >
            {showAddCharacter ? '➖ Cerrar' : '➕ Agregar al Combate'}
          </button>

          {showAddCharacter && (
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
              {charactersNotInOrder.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">
                  Todos los personajes están en el combate
                </p>
              ) : (
                charactersNotInOrder.map((char) => (
                  <div
                    key={char._id}
                    className="flex items-center justify-between p-2 bg-gray-700/50 rounded"
                  >
                    <div>
                      <span className="text-sm">{char.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        (DEX: {char.stats?.dexterity || 1})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onAddToTurnOrder(char._id);
                        setShowAddCharacter(false);
                      }}
                      disabled={loading}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
                    >
                      ➕ Agregar
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Estado vacío */}
      {!combatStarted && characters.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-4">
          No hay personajes en la partida
        </p>
      )}
    </div>
  );
}

DMTurnOrderPanel.propTypes = {
  turnOrder: PropTypes.arrayOf(
    PropTypes.shape({
      characterId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      name: PropTypes.string,
      initiative: PropTypes.number,
      position: PropTypes.number,
      isKO: PropTypes.bool,
    }),
  ),
  currentTurnIndex: PropTypes.number,
  tiedGroups: PropTypes.arrayOf(
    PropTypes.shape({
      initiative: PropTypes.number,
      characters: PropTypes.array,
    }),
  ),
  combatStarted: PropTypes.bool,
  loading: PropTypes.bool,
  characters: PropTypes.array,
  onCalculateTurnOrder: PropTypes.func,
  onNextTurn: PropTypes.func,
  onForceTurn: PropTypes.func,
  onAddToTurnOrder: PropTypes.func,
  onRemoveFromTurnOrder: PropTypes.func,
  onResolveTie: PropTypes.func,
  onReviveCharacter: PropTypes.func,
};

DMTurnOrderPanel.defaultProps = {
  turnOrder: [],
  currentTurnIndex: 0,
  tiedGroups: [],
  combatStarted: false,
  loading: false,
  characters: [],
};

export default DMTurnOrderPanel;
