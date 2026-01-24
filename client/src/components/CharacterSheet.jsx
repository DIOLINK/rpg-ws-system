import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MAX_GAMES_DISPLAYED } from '../pages/GameLobby';

export const CharacterSheet = ({ character, onUpdate }) => {
  const { isDM } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: character.name,
    hp: character.stats.hp,
    maxHp: character.stats.maxHp,
    mana: character.stats.mana,
    maxMana: character.stats.maxMana,
    strength: character.stats.strength,
    intelligence: character.stats.intelligence,
    dexterity: character.stats.dexterity,
    defense: character.stats.defense,
  });

  const canEdit = isDM || character.canEdit;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate({
      name: formData.name,
      stats: {
        hp: parseInt(formData.hp),
        maxHp: parseInt(formData.maxHp),
        mana: parseInt(formData.mana),
        maxMana: parseInt(formData.maxMana),
        strength: parseInt(formData.strength),
        intelligence: parseInt(formData.intelligence),
        dexterity: parseInt(formData.dexterity),
        defense: parseInt(formData.defense),
      },
    });
    setEditing(false);
  };

  const hpPercentage = (character.stats.hp / character.stats.maxHp) * 100;
  const manaPercentage = (character.stats.mana / character.stats.maxMana) * 100;

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex-1">
          {editing ? (
            <input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="text-xl sm:text-2xl font-bold bg-gray-700 px-3 py-2 rounded-lg w-full"
            />
          ) : (
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
              {character.name}
            </h2>
          )}
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            ID: {character._id.slice(MAX_GAMES_DISPLAYED)}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            title={editing ? 'Guardar' : 'Editar'}
          >
            <span className="text-xl">{editing ? '💾' : '✏️'}</span>
          </button>
        )}
      </div>

      {/* Barra HP */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <span className="text-red-400 text-lg mr-2">❤️</span>
          <span className="text-xs text-gray-300">HP</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-red-500 h-full transition-all duration-500"
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>

      {/* Barra MP */}
      <div className="mb-2">
        <div className="flex items-center mb-1">
          <span className="text-blue-400 text-lg mr-2">💙</span>
          <span className="text-xs text-gray-300">MP</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-500"
            style={{ width: `${manaPercentage}%` }}
          />
        </div>
      </div>

      {/* Habilidades */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-purple-400">
            ⚔️ Habilidades
          </h3>
          <span className="text-xs text-gray-400">
            {character.abilities?.length || 0} habilidades
          </span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {character.abilities && character.abilities.length > 0 ? (
            character.abilities.map((ability) => (
              <div
                key={ability.id}
                className="bg-gray-700 rounded-lg p-3 flex items-center justify-between hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {ability.name}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {ability.description}
                  </div>
                  {ability.damage && (
                    <div className="text-xs text-orange-400 mt-1">
                      ⚔️ {ability.damage}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  {ability.manaCost > 0 && (
                    <span className="text-xs text-blue-400">
                      💙 {ability.manaCost}
                    </span>
                  )}
                  {isDM && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({ removeAbility: ability.id });
                      }}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/30 transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">
              No hay habilidades
            </p>
          )}
        </div>
      </div>

      {/* Estados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-purple-400">
            ✨ Estados
          </h3>
          <span className="text-xs text-gray-400">
            {character.status?.length || 0} efectos
          </span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
          {character.status && character.status.length > 0 ? (
            character.status.map((status) => (
              <span
                key={status.id}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  status.type === 'buff'
                    ? 'bg-green-600/80'
                    : status.type === 'debuff'
                      ? 'bg-red-600/80'
                      : 'bg-gray-600/80'
                }`}
              >
                {status.name}
                {status.duration && ` (${status.duration})`}
              </span>
            ))
          ) : (
            <p className="text-gray-500 text-sm w-full text-center py-2">
              Sin efectos activos
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
