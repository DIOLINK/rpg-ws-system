import { memo, useState } from 'react';
import Collapsible from './Collapsible';

export const DMPanel = memo(function DMPanel({ characters, onDMCommand }) {
  // Personajes pendientes de validación
  const pendingCharacters = characters.filter((c) => c.validated === false);
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [damage, setDamage] = useState(0);
  const [damageType, setDamageType] = useState('normal');
  const [newAbility, setNewAbility] = useState({
    name: '',
    description: '',
    damage: '',
    manaCost: 0,
  });
  const [newStatus, setNewStatus] = useState({
    name: '',
    description: '',
    type: 'neutral',
    duration: 0,
  });

  const toggleCharacter = (characterId) => {
    setSelectedCharacters((prev) =>
      prev.includes(characterId)
        ? prev.filter((id) => id !== characterId)
        : [...prev, characterId],
    );
  };

  const applyDamage = () => {
    if (selectedCharacters.length === 0 || damage <= 0) return;
    onDMCommand('apply-damage', {
      targets: selectedCharacters,
      damage: Number.parseInt(damage),
      damageType,
    });
    setDamage(0);
    setSelectedCharacters([]);
  };

  const addAbility = (characterId) => {
    if (!newAbility.name) return;
    onDMCommand('add-ability', {
      characterId,
      ability: { ...newAbility, id: `ability_${Date.now()}` },
    });
    setNewAbility({ name: '', description: '', damage: '', manaCost: 0 });
  };

  const addStatus = (characterId) => {
    if (!newStatus.name) return;
    onDMCommand('add-status', {
      characterId,
      status: { ...newStatus, id: `status_${Date.now()}` },
    });
    setNewStatus({ name: '', description: '', type: 'neutral', duration: 0 });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl">
      {/* Sección de aprobación de personajes */}
      {pendingCharacters.length > 0 && (
        <div className="mb-6 p-3 sm:p-4 bg-yellow-900/70 border border-yellow-500/30 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-300 mb-3">
            📝 Personajes pendientes de aprobación
          </h3>
          <div className="space-y-3">
            {pendingCharacters.map((char) => (
              <div
                key={char._id}
                className="bg-gray-700 rounded-lg p-3 flex flex-col gap-3"
              >
                <div className="text-center">
                  <span className="font-medium text-base text-white">
                    {char.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    por{' '}
                    {char.playerName ||
                      (typeof char.playerId === 'object'
                        ? char.playerId.name ||
                          char.playerId.email ||
                          char.playerId._id
                        : char.playerId)}
                  </span>
                  <p className="text-xs text-gray-300 mt-1">
                    {char.description}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-colors shadow-md"
                    onClick={() =>
                      onDMCommand('validate-character', {
                        characterId: char._id,
                        validated: true,
                      })
                    }
                  >
                    <span className="text-lg">✓</span> Aprobar
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-colors shadow-md"
                    onClick={() =>
                      onDMCommand('validate-character', {
                        characterId: char._id,
                        validated: false,
                      })
                    }
                  >
                    <span className="text-lg">✗</span> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-purple-400">
          🎭 Panel del DM
        </h2>
        <span className="text-xs sm:text-sm text-gray-400">
          {characters.length} personajes
        </span>
      </div>

      {/* Daño Masivo */}
      <Collapsible title="⚔️ Daño Masivo" defaultOpen>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">
            ({selectedCharacters.length} seleccionados)
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="number"
            placeholder="Daño"
            value={damage}
            onChange={(e) => setDamage(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-600 rounded-lg text-sm sm:text-base"
          />
          <select
            value={damageType}
            onChange={(e) => setDamageType(e.target.value)}
            className="px-3 py-2 bg-gray-600 rounded-lg text-sm sm:text-base"
          >
            <option value="normal">Normal</option>
            <option value="magico">Mágico</option>
            <option value="fuego">Fuego</option>
            <option value="hielo">Hielo</option>
          </select>
        </div>
        <button
          onClick={applyDamage}
          disabled={selectedCharacters.length === 0 || damage <= 0}
          className="w-full py-2 sm:py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-sm sm:text-base"
        >
          💥 Aplicar {damage || 0} daño
        </button>
      </Collapsible>

      {/* Lista de personajes */}
      <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {characters.map((character) => (
          <Collapsible
            key={character._id}
            title={`🧑 ${character.name}`}
            defaultOpen={false}
          >
            <div className="bg-gray-700 rounded-lg p-3 sm:p-4 hover:bg-gray-600 transition-colors">
              {/* Header del personaje */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCharacters.includes(character._id)}
                    onChange={() => toggleCharacter(character._id)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-medium text-sm sm:text-base">
                      {character.name}
                    </span>
                    <span
                      className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        character.canEdit ? 'bg-green-600/50' : 'bg-gray-600/50'
                      }`}
                    >
                      {character.canEdit ? '✏️' : '🔒'}
                    </span>
                  </div>
                </label>
                <button
                  onClick={() =>
                    onDMCommand('toggle-edit', {
                      characterId: character._id,
                      canEdit: !character.canEdit,
                    })
                  }
                  className={`w-full sm:w-auto px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    character.canEdit
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  {character.canEdit ? '✏️ Editable' : '🔒 Bloqueado'}
                </button>
              </div>

              {/* Añadir habilidad */}
              <div className="mb-3 p-2 sm:p-3 bg-gray-600/50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nombre habilidad"
                    value={newAbility.name}
                    onChange={(e) =>
                      setNewAbility((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="px-2 py-2 bg-gray-600 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={newAbility.description}
                    onChange={(e) =>
                      setNewAbility((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="px-2 py-2 bg-gray-600 rounded text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Daño (ej: 1d6+2)"
                    value={newAbility.damage}
                    onChange={(e) =>
                      setNewAbility((prev) => ({
                        ...prev,
                        damage: e.target.value,
                      }))
                    }
                    className="flex-1 px-2 py-2 bg-gray-600 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Mana"
                    value={newAbility.manaCost}
                    onChange={(e) =>
                      setNewAbility((prev) => ({
                        ...prev,
                        manaCost: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full sm:w-20 px-2 py-2 bg-gray-600 rounded text-sm"
                  />
                  <button
                    onClick={() => addAbility(character._id)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                  >
                    ➕ Habilidad
                  </button>
                </div>
              </div>

              {/* Añadir estado */}
              <div className="p-2 sm:p-3 bg-gray-600/50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nombre estado"
                    value={newStatus.name}
                    onChange={(e) =>
                      setNewStatus((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="px-2 py-2 bg-gray-600 rounded text-sm"
                  />
                  <select
                    value={newStatus.type}
                    onChange={(e) =>
                      setNewStatus((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="px-2 py-2 bg-gray-600 rounded text-sm"
                  >
                    <option value="buff">✨ Buff</option>
                    <option value="debuff">💀 Debuff</option>
                    <option value="neutral">⚪ Neutral</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    placeholder="Duración (turnos)"
                    value={newStatus.duration}
                    onChange={(e) =>
                      setNewStatus((prev) => ({
                        ...prev,
                        duration: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full sm:w-24 px-2 py-2 bg-gray-600 rounded text-sm"
                  />
                  <button
                    onClick={() => addStatus(character._id)}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
                  >
                    ✨ Estado
                  </button>
                </div>
              </div>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  );
});
