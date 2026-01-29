import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MAX_GAMES_DISPLAYED } from '../pages/GameLobby';
import { classAbilityService } from '../services/classAbilityService';
import AccordionList from './AccordionList';
import CharacterStats from './CharacterStats';
// Iconos por tipo de clase
const CLASS_ICONS = {
  guerrero: '⚔️',
  mago: '🪄',
  pícaro: '🗡️',
  clérigo: '⛑️',
  arquero: '🏹',
  paladín: '🛡️',
  bardo: '🎸',
  // ...agrega más tipos si es necesario
  default: '👤',
};

export const CharacterSheet = ({
  character,
  onUpdate,
  statChanges,
  isKO,
  koWarning,
}) => {
  const { isDM } = useAuth();
  const [editing, setEditing] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [classAbilities, setClassAbilities] = useState([]);
  const [showHpChange, setShowHpChange] = useState(false);
  const [showManaChange, setShowManaChange] = useState(false);
  const [formData, setFormData] = useState({
    name: character.name,
    classType: character.classType || '',
    hp: character.stats.hp,
    maxHp: character.stats.maxHp,
    mana: character.stats.mana,
    maxMana: character.stats.maxMana,
    strength: character.stats.strength,
    intelligence: character.stats.intelligence,
    dexterity: character.stats.dexterity,
    defense: character.stats.defense,
  });

  // Sincronizar formData cuando el character cambia (por actualizaciones de socket)
  useEffect(() => {
    if (!editing) {
      setFormData({
        name: character.name,
        classType: character.classType || '',
        hp: character.stats.hp,
        maxHp: character.stats.maxHp,
        mana: character.stats.mana,
        maxMana: character.stats.maxMana,
        strength: character.stats.strength,
        intelligence: character.stats.intelligence,
        dexterity: character.stats.dexterity,
        defense: character.stats.defense,
      });
    }
  }, [character, editing]);

  const canEdit = isDM || character.canEdit;

  // Detectar cambios de HP/MP para mostrar animación
  const hpChange = useMemo(() => {
    if (
      statChanges &&
      statChanges.type === 'hp' &&
      statChanges.characterId === character._id
    ) {
      return statChanges.change;
    }
    return character.pendingChanges?.hp || 0;
  }, [statChanges, character._id, character.pendingChanges]);

  const manaChange = useMemo(() => {
    if (
      statChanges &&
      statChanges.type === 'mana' &&
      statChanges.characterId === character._id
    ) {
      return statChanges.change;
    }
    return character.pendingChanges?.mana || 0;
  }, [statChanges, character._id, character.pendingChanges]);

  // Mostrar animación de cambio cuando hay cambios
  useEffect(() => {
    if (hpChange !== 0) {
      setShowHpChange(true);
      const timer = setTimeout(() => setShowHpChange(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hpChange, statChanges?.timestamp]);

  useEffect(() => {
    if (manaChange !== 0) {
      setShowManaChange(true);
      const timer = setTimeout(() => setShowManaChange(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [manaChange, statChanges?.timestamp]);

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
    const numValue = Math.max(0, Number.parseInt(value) || 0);

    setFormData((prev) => {
      // Validar que HP esté entre 0 y maxHp
      if (name === 'hp') {
        return { ...prev, [name]: Math.min(numValue, prev.maxHp) };
      }
      // Validar que mana esté entre 0 y maxMana
      if (name === 'mana') {
        return { ...prev, [name]: Math.min(numValue, prev.maxMana) };
      }
      // Si se cambia maxHp, ajustar hp si es necesario (mínimo 1 para maxHp)
      if (name === 'maxHp') {
        const newMaxHp = Math.max(1, numValue);
        return {
          ...prev,
          [name]: newMaxHp,
          hp: Math.min(prev.hp, newMaxHp),
        };
      }
      // Si se cambia maxMana, ajustar mana si es necesario (mínimo 0 para maxMana)
      if (name === 'maxMana') {
        return {
          ...prev,
          [name]: numValue,
          mana: Math.min(prev.mana, numValue),
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSave = () => {
    onUpdate({
      name: formData.name,
      classType: formData.classType,
      stats: {
        hp: Number.parseInt(formData.hp),
        maxHp: Number.parseInt(formData.maxHp),
        mana: Number.parseInt(formData.mana),
        maxMana: Number.parseInt(formData.maxMana),
        strength: Number.parseInt(formData.strength),
        intelligence: Number.parseInt(formData.intelligence),
        dexterity: Number.parseInt(formData.dexterity),
        defense: Number.parseInt(formData.defense),
      },
    });
    setEditing(false);
  };

  const hpPercentage = (character.stats.hp / character.stats.maxHp) * 100;
  const manaPercentage = (character.stats.mana / character.stats.maxMana) * 100;

  // Función para voltear la carta
  const handleFlip = () => {
    if (!editing) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div className="relative min-w-sm" style={{ perspective: '1000px' }}>
      {/* Botón Flip - Esquina superior derecha */}
      <button
        onClick={handleFlip}
        className="absolute top-2 right-2 z-10 w-10 h-10 bg-gray-700/90 hover:bg-purple-600 rounded-full font-medium transition-all duration-300 flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-purple-500/30"
        title={
          isFlipped ? 'Ver stats y habilidades' : 'Ver descripción e inventario'
        }
      >
        <span
          className="text-lg transition-transform duration-500"
          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {isFlipped ? '⚔️' : '📜'}
        </span>
      </button>

      <div
        className={`relative w-full transition-transform duration-500 ease-in-out`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRENTE - Stats y Habilidades */}
        <div
          className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-shadow"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex-1 flex items-center gap-3 min-w-0">
              {/* Icono de clase y badge de nivel */}
              <div className="relative shrink-0">
                {editing ? (
                  <select
                    name="classType"
                    value={formData.classType}
                    onChange={handleInputChange}
                    className="text-2xl bg-gray-700 rounded-lg p-1 cursor-pointer"
                    title="Seleccionar clase"
                  >
                    <option value="">👤</option>
                    <option value="guerrero">⚔️ Guerrero</option>
                    <option value="mago">🪄 Mago</option>
                    <option value="pícaro">🗡️ Pícaro</option>
                    <option value="clérigo">⛑️ Clérigo</option>
                    <option value="arquero">🏹 Arquero</option>
                    <option value="paladín">🛡️ Paladín</option>
                    <option value="bardo">🎸 Bardo</option>
                  </select>
                ) : (
                  <span className="text-3xl select-none">
                    {CLASS_ICONS[character.classType] || CLASS_ICONS.default}
                  </span>
                )}
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
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                title={editing ? 'Guardar' : 'Editar'}
              >
                <span className="text-xl">{editing ? '💾' : '✏️'}</span>
              </button>
            )}
          </div>

          {/* KO Overlay */}
          {(isKO || character.isKO) && (
            <div className="absolute inset-0 bg-black/70 rounded-lg z-20 flex flex-col items-center justify-center">
              <span className="text-6xl mb-2">💀</span>
              <span className="text-2xl font-bold text-red-500">KO</span>
              <span className="text-sm text-gray-400 mt-1">
                Fuera de combate
              </span>
            </div>
          )}

          {/* KO Warning Badge */}
          {(koWarning || character.koWarning) && !isKO && !character.isKO && (
            <div className="absolute top-12 left-2 z-20 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold animate-pulse flex items-center gap-1">
              ⚠️ ¡KO próximo turno!
            </div>
          )}

          {/* Barra HP */}
          <div className="mb-4 relative">
            <div className="flex items-center mb-1 justify-between">
              <div className="flex items-center">
                <span className="text-red-400 text-lg mr-2">❤️</span>
                {editing ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-300">HP:</span>
                    <input
                      type="number"
                      name="hp"
                      value={formData.hp}
                      onChange={handleInputChange}
                      className="w-12 px-1 py-0.5 bg-gray-600 rounded text-xs text-center"
                    />
                    <span className="text-xs text-gray-300">/</span>
                    <input
                      type="number"
                      name="maxHp"
                      value={formData.maxHp}
                      onChange={handleInputChange}
                      className="w-12 px-1 py-0.5 bg-gray-600 rounded text-xs text-center"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, hp: prev.maxHp }))
                      }
                      className="px-1.5 py-0.5 bg-red-500 hover:bg-red-400 rounded text-xs text-white"
                      title="Llenar HP al máximo"
                    >
                      MAX
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-300">
                    HP: {character.stats.hp} / {character.stats.maxHp}
                  </span>
                )}
              </div>
              {/* Indicador de cambio HP */}
              {showHpChange && hpChange !== 0 && (
                <span
                  className={`text-sm font-bold animate-bounce ${
                    hpChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {hpChange > 0 ? '+' : ''}
                  {hpChange}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden relative">
              {/* Barra de HP actual */}
              <div
                className={`h-full transition-all duration-500 ${
                  showHpChange && hpChange !== 0
                    ? hpChange > 0
                      ? 'bg-gradient-to-r from-red-500 to-green-400'
                      : 'bg-gradient-to-r from-red-500 to-red-300'
                    : 'bg-red-500'
                }`}
                style={{ width: `${hpPercentage}%` }}
              />
              {/* Overlay de cambio */}
              {showHpChange && hpChange !== 0 && (
                <div
                  className={`absolute top-0 h-full transition-all duration-300 ${
                    hpChange > 0
                      ? 'bg-green-400/40 animate-pulse'
                      : 'bg-red-300/40 animate-pulse'
                  }`}
                  style={{
                    width: `${Math.abs(hpChange / character.stats.maxHp) * 100}%`,
                    left:
                      hpChange > 0
                        ? `${((character.stats.hp - hpChange) / character.stats.maxHp) * 100}%`
                        : `${hpPercentage}%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Barra MP */}
          <div className="mb-2 relative">
            <div className="flex items-center mb-1 justify-between">
              <div className="flex items-center">
                <span className="text-blue-400 text-lg mr-2">💙</span>
                {editing ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-300">MP:</span>
                    <input
                      type="number"
                      name="mana"
                      value={formData.mana}
                      onChange={handleInputChange}
                      className="w-12 px-1 py-0.5 bg-gray-600 rounded text-xs text-center"
                    />
                    <span className="text-xs text-gray-300">/</span>
                    <input
                      type="number"
                      name="maxMana"
                      value={formData.maxMana}
                      onChange={handleInputChange}
                      className="w-12 px-1 py-0.5 bg-gray-600 rounded text-xs text-center"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, mana: prev.maxMana }))
                      }
                      className="px-1.5 py-0.5 bg-blue-500 hover:bg-blue-400 rounded text-xs text-white"
                      title="Llenar MP al máximo"
                    >
                      MAX
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-300">
                    MP: {character.stats.mana} / {character.stats.maxMana}
                  </span>
                )}
              </div>
              {/* Indicador de cambio Mana */}
              {showManaChange && manaChange !== 0 && (
                <span
                  className={`text-sm font-bold animate-bounce ${
                    manaChange > 0 ? 'text-cyan-400' : 'text-blue-300'
                  }`}
                >
                  {manaChange > 0 ? '+' : ''}
                  {manaChange}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden relative">
              {/* Barra de Mana actual */}
              <div
                className={`h-full transition-all duration-500 ${
                  showManaChange && manaChange !== 0
                    ? manaChange > 0
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      : 'bg-gradient-to-r from-blue-500 to-blue-300'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${manaPercentage}%` }}
              />
              {/* Overlay de cambio */}
              {showManaChange && manaChange !== 0 && (
                <div
                  className={`absolute top-0 h-full transition-all duration-300 ${
                    manaChange > 0
                      ? 'bg-cyan-400/40 animate-pulse'
                      : 'bg-blue-300/40 animate-pulse'
                  }`}
                  style={{
                    width: `${Math.abs(manaChange / character.stats.maxMana) * 100}%`,
                    left:
                      manaChange > 0
                        ? `${((character.stats.mana - manaChange) / character.stats.maxMana) * 100}%`
                        : `${manaPercentage}%`,
                  }}
                />
              )}
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
                {CLASS_ICONS[character.classType] || CLASS_ICONS.default}
                Habilidades
              </h3>
              <span className="text-xs text-gray-400">
                {character.abilities?.length || 0} habilidades
              </span>
            </div>
            {(() => {
              const abilitiesToShow =
                character.abilities && character.abilities.length > 0
                  ? character.abilities
                  : classAbilities;
              return abilitiesToShow.length > 0 ? (
                <AccordionList
                  items={abilitiesToShow.map((ability) => ({
                    id: ability.id,
                    title: ability.name,
                    subtitle:
                      ability.manaCost > 0 ? `💙 ${ability.manaCost}` : '',
                    icon:
                      CLASS_ICONS[character.classType] || CLASS_ICONS.default,
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
              );
            })()}
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
                items={character.status.map((status) => {
                  const getStatusIcon = (type) => {
                    if (type === 'buff') return '🟢';
                    if (type === 'debuff') return '🔴';
                    return '⚪';
                  };
                  return {
                    id: status.id,
                    title: status.name,
                    subtitle: status.duration
                      ? `Duración: ${status.duration}`
                      : '',
                    icon: getStatusIcon(status.type),
                    content: (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">
                          {status.description}
                        </div>
                        <div className="text-xs mb-1">
                          Tipo:{' '}
                          <span className="font-semibold">{status.type}</span>
                        </div>
                        {status.duration && (
                          <div className="text-xs">
                            Turnos restantes: {status.duration}
                          </div>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            ) : (
              <p className="text-gray-500 text-sm w-full text-center py-2">
                Sin efectos activos
              </p>
            )}
          </div>
        </div>

        {/* DORSO - Descripción e Inventario */}
        <div
          className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl absolute inset-0 w-full h-full overflow-auto"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Header del dorso */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">📜</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {character.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Descripción e Inventario
                </p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-purple-400 mb-3 flex items-center gap-2">
              📖 Descripción
            </h3>
            <div className="bg-gray-700/50 rounded-lg p-4">
              {character.description ? (
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {character.description}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-2">
                  Sin descripción
                </p>
              )}
            </div>
          </div>

          {/* Inventario */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-purple-400 flex items-center gap-2">
                🎒 Inventario
              </h3>
              <span className="text-xs text-gray-400">
                {character.inventory?.length || 0} objetos
              </span>
            </div>
            {character.inventory && character.inventory.length > 0 ? (
              <div className="space-y-2">
                {character.inventory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📦</span>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-400">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-sm text-gray-500 text-center">
                  🎒 Inventario vacío
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

CharacterSheet.propTypes = {
  character: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    classType: PropTypes.string,
    level: PropTypes.number,
    canEdit: PropTypes.bool,
    description: PropTypes.string,
    isKO: PropTypes.bool,
    koWarning: PropTypes.bool,
    pendingChanges: PropTypes.shape({
      hp: PropTypes.number,
      mana: PropTypes.number,
      appliedAt: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
      ]),
    }),
    inventory: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        quantity: PropTypes.number,
        description: PropTypes.string,
      }),
    ),
    stats: PropTypes.shape({
      hp: PropTypes.number,
      maxHp: PropTypes.number,
      mana: PropTypes.number,
      maxMana: PropTypes.number,
      strength: PropTypes.number,
      intelligence: PropTypes.number,
      dexterity: PropTypes.number,
      defense: PropTypes.number,
    }).isRequired,
    abilities: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        description: PropTypes.string,
        damage: PropTypes.string,
        manaCost: PropTypes.number,
      }),
    ),
    status: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        description: PropTypes.string,
        type: PropTypes.oneOf(['buff', 'debuff', 'neutral']),
        duration: PropTypes.number,
        effects: PropTypes.shape({
          hpPerTurn: PropTypes.number,
          manaPerTurn: PropTypes.number,
          statModifiers: PropTypes.shape({
            strength: PropTypes.number,
            intelligence: PropTypes.number,
            dexterity: PropTypes.number,
            defense: PropTypes.number,
          }),
        }),
      }),
    ),
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  statChanges: PropTypes.shape({
    type: PropTypes.oneOf(['hp', 'mana']),
    characterId: PropTypes.string,
    oldValue: PropTypes.number,
    newValue: PropTypes.number,
    maxValue: PropTypes.number,
    change: PropTypes.number,
    reason: PropTypes.string,
    timestamp: PropTypes.number,
  }),
  isKO: PropTypes.bool,
  koWarning: PropTypes.bool,
};
