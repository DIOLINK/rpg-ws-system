import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MAX_GAMES_DISPLAYED } from '../pages/GameLobby';
import { classAbilityService } from '../services/classAbilityService';
import AccordionList from './AccordionList';
import CharacterStats from './CharacterStats';
// Iconos por tipo de clase
const CLASS_ICONS = {
  warrior: '⚔️',
  mage: '🪄',
  rogue: '🗡️',
  cleric: '⛑️',
  archer: '🏹',
  paladin: '🛡️',
  bard: '🎸',
  // ...agrega más tipos si es necesario
  default: '👤',
};

export const CharacterSheet = ({ character, onUpdate }) => {
  const { isDM } = useAuth();
  const [editing, setEditing] = useState(false);
  const [classAbilities, setClassAbilities] = useState([]);
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

  // Cargar habilidades de clase si el personaje no tiene habilidades propias
  useEffect(() => {
    if (character.abilities && character.abilities.length > 0) return;
    if (!character.classType) return;
    classAbilityService
      .getByClassType(character.classType)
      .then(setClassAbilities)
      .catch(() => setClassAbilities([]));
  }, [character.abilities, character.classType]);

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
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {/* Icono de clase y badge de nivel */}
          <div className="relative flex-shrink-0">
            <span className="text-3xl select-none">
              {CLASS_ICONS[character.classType] || CLASS_ICONS.default}
            </span>
            {/* Badge de nivel */}
            <span
              className="absolute -top-1 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 border-2 border-gray-800 shadow"
              style={{ minWidth: 22, textAlign: 'center', lineHeight: '1' }}
              title={`Nivel ${character.level}`}
            >
              {character.level > 99 ? '+99' : character.level || 1}
            </span>
          </div>
          <div className="flex-1 min-w-0">
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

      {/* Stats principales */}
      <CharacterStats
        stats={formData}
        editing={editing && isDM}
        onChange={({ name, value }) =>
          setFormData((prev) => ({ ...prev, [name]: value }))
        }
      />

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
        {(character.abilities && character.abilities.length > 0
          ? character.abilities
          : classAbilities
        ).length > 0 ? (
          <AccordionList
            items={(character.abilities && character.abilities.length > 0
              ? character.abilities
              : classAbilities
            ).map((ability) => ({
              id: ability.id,
              title: ability.name,
              subtitle: ability.manaCost > 0 ? `💙 ${ability.manaCost}` : '',
              icon: '⚔️',
              content: (
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    {ability.description}
                  </div>
                  {ability.damage && (
                    <div className="text-xs text-orange-400 mb-1">
                      Daño: {ability.damage}
                    </div>
                  )}
                  {isDM &&
                    character.abilities &&
                    character.abilities.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate({ removeAbility: ability.id });
                        }}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/30 transition-colors mt-2"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                </div>
              ),
            }))}
          />
        ) : (
          <p className="text-gray-500 text-center py-4 text-sm">
            No hay habilidades
          </p>
        )}
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
        {character.status && character.status.length > 0 ? (
          <AccordionList
            items={character.status.map((status) => ({
              id: status.id,
              title: status.name,
              subtitle: status.duration ? `Duración: ${status.duration}` : '',
              icon:
                status.type === 'buff'
                  ? '🟢'
                  : status.type === 'debuff'
                    ? '🔴'
                    : '⚪',
              content: (
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    {status.description}
                  </div>
                  <div className="text-xs mb-1">
                    Tipo: <span className="font-semibold">{status.type}</span>
                  </div>
                  {status.duration && (
                    <div className="text-xs">
                      Turnos restantes: {status.duration}
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        ) : (
          <p className="text-gray-500 text-sm w-full text-center py-2">
            Sin efectos activos
          </p>
        )}
      </div>
    </div>
  );
};
