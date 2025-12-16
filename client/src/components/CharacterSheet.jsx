import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
            ID: {character._id.slice(-6)}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">{editing ? '💾' : '✏️'}</span>
            <span className="text-sm sm:text-base">
              {editing ? 'Guardar' : 'Editar'}
            </span>
          </button>
        )}
      </div>

      {/* Stats principales - HP/Mana */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* HP */}
        <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              ❤️ HP
            </label>
            <div className="flex items-center gap-2">
              {editing ? (
                <input
                  name="hp"
                  type="number"
                  value={formData.hp}
                  onChange={handleInputChange}
                  className="w-16 bg-gray-600 px-2 py-1 rounded text-center font-bold"
                />
              ) : (
                <span className="text-lg sm:text-xl font-bold">
                  {character.stats.hp}
                </span>
              )}
              <span className="text-gray-400">/</span>
              {editing ? (
                <input
                  name="maxHp"
                  type="number"
                  value={formData.maxHp}
                  onChange={handleInputChange}
                  className="w-16 bg-gray-600 px-2 py-1 rounded text-center"
                />
              ) : (
                <span className="text-sm sm:text-lg">
                  {character.stats.maxHp}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 bg-gray-600 rounded-full h-2 sm:h-3 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-500"
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>

        {/* Mana */}
        <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              💙 Mana
            </label>
            <div className="flex items-center gap-2">
              {editing ? (
                <input
                  name="mana"
                  type="number"
                  value={formData.mana}
                  onChange={handleInputChange}
                  className="w-16 bg-gray-600 px-2 py-1 rounded text-center font-bold"
                />
              ) : (
                <span className="text-lg sm:text-xl font-bold">
                  {character.stats.mana}
                </span>
              )}
              <span className="text-gray-400">/</span>
              {editing ? (
                <input
                  name="maxMana"
                  type="number"
                  value={formData.maxMana}
                  onChange={handleInputChange}
                  className="w-16 bg-gray-600 px-2 py-1 rounded text-center"
                />
              ) : (
                <span className="text-sm sm:text-lg">
                  {character.stats.maxMana}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 bg-gray-600 rounded-full h-2 sm:h-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${manaPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats secundarios */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {[
          { label: '💪', name: 'strength', value: character.stats.strength },
          {
            label: '🧠',
            name: 'intelligence',
            value: character.stats.intelligence,
          },
          { label: '⚡', name: 'dexterity', value: character.stats.dexterity },
          { label: '🛡️', name: 'defense', value: character.stats.defense },
        ].map((stat) => (
          <div
            key={stat.name}
            className="bg-gray-700 rounded-lg p-3 text-center hover:bg-gray-600 transition-colors"
          >
            <div className="text-xl sm:text-2xl mb-1">{stat.label}</div>
            {editing ? (
              <input
                name={stat.name}
                type="number"
                value={formData[stat.name]}
                onChange={handleInputChange}
                className="w-full bg-gray-600 px-2 py-1 rounded text-center font-bold"
              />
            ) : (
              <div className="text-base sm:text-lg font-bold">{stat.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Habilidades */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-purple-400">
            ⚔️ Habilidades
          </h3>
          <span className="text-xs sm:text-sm text-gray-400">
            {character.abilities.length} habilidades
          </span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {character.abilities.map((ability) => (
            <div
              key={ability.id}
              className="bg-gray-700 rounded-lg p-3 flex items-center justify-between hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base truncate">
                  {ability.name}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">
                  {ability.description}
                </div>
                {ability.damage && (
                  <div className="text-xs sm:text-sm text-orange-400 mt-1">
                    ⚔️ {ability.damage}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                {ability.manaCost > 0 && (
                  <span className="text-xs sm:text-sm text-blue-400">
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
          ))}
          {character.abilities.length === 0 && (
            <p className="text-gray-500 text-center py-4 text-sm">
              No hay habilidades
            </p>
          )}
        </div>
      </div>

      {/* Estados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-purple-400">
            ✨ Estados
          </h3>
          <span className="text-xs sm:text-sm text-gray-400">
            {character.status.length} efectos
          </span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
          {character.status.map((status) => (
            <span
              key={status.id}
              className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
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
          ))}
          {character.status.length === 0 && (
            <p className="text-gray-500 text-sm w-full text-center py-2">
              Sin efectos activos
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
