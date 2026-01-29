import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useToastStore from '../context/toastStore';
import { MAX_GAMES_DISPLAYED } from '../pages/GameLobby';
import { classAbilityService } from '../services/classAbilityService';
import { itemService } from '../services/itemService';
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
  gameId,
}) => {
  const { isDM } = useAuth();
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  const [editing, setEditing] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [classAbilities, setClassAbilities] = useState([]);
  const [showHpChange, setShowHpChange] = useState(false);
  const [showManaChange, setShowManaChange] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [removingItems, setRemovingItems] = useState(false);
  const [sellModal, setSellModal] = useState(null); // { item, quantity }
  const [formData, setFormData] = useState({
    name: character.name,
    classType: character.classType || '',
    description: character.description || '',
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
        description: character.description || '',
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
      description: formData.description,
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

  // Funciones para gestión de items del inventario
  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const selectAllItems = () => {
    if (selectedItems.length === character.inventory?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(character.inventory?.map((item) => item.id) || []);
    }
  };

  const handleRemoveItems = async () => {
    if (selectedItems.length === 0 || !gameId) return;

    setRemovingItems(true);
    try {
      for (const inventoryId of selectedItems) {
        await itemService.removeFromCharacter(character._id, inventoryId, {
          gameId,
        });
      }
      setSelectedItems([]);
    } catch (error) {
      console.error('Error al eliminar items:', error);
    } finally {
      setRemovingItems(false);
    }
  };

  // Funciones de equipamiento (jugador)
  const handleEquipItem = async (inventoryId) => {
    try {
      await itemService.equipItem(character._id, inventoryId, gameId);
    } catch (error) {
      console.error('Error al equipar item:', error);
      addToast({
        type: 'error',
        message: error.message || 'Error al equipar item',
      });
    }
  };

  const handleUnequipItem = async (inventoryId) => {
    try {
      await itemService.unequipItem(character._id, inventoryId, gameId);
    } catch (error) {
      console.error('Error al desequipar item:', error);
      addToast({
        type: 'error',
        message: error.message || 'Error al desequipar item',
      });
    }
  };

  // Iniciar proceso de venta - abre modal
  const handleSellItem = (item) => {
    if (item.equipped) {
      addToast({
        type: 'warning',
        message: 'Desequipa el item antes de venderlo',
      });
      return;
    }
    if (item.type === 'quest') {
      addToast({
        type: 'warning',
        message: 'No puedes vender items de misión',
      });
      return;
    }
    if (!item.value || item.value <= 0) {
      addToast({
        type: 'warning',
        message: 'Este item no tiene valor de venta',
      });
      return;
    }

    // Abrir modal de venta
    setSellModal({ item, quantity: 1 });
  };

  // Confirmar venta desde el modal
  const confirmSell = async () => {
    if (!sellModal) return;

    const { item, quantity } = sellModal;
    const totalValue = item.value * quantity;

    try {
      await itemService.requestSell(character._id, item.id, quantity, gameId);
      addToast({
        type: 'info',
        message: `💰 Solicitud de venta enviada al DM\n${item.name} x${quantity} por ${totalValue} oro`,
      });
      setSellModal(null);
    } catch (error) {
      console.error('Error al solicitar venta:', error);
      addToast({
        type: 'error',
        message: error.message || 'Error al solicitar venta',
      });
    }
  };

  // Contar items equipados
  const equippedCount =
    character.inventory?.filter((item) => item.equipped).length || 0;

  const hpPercentage = (character.stats.hp / character.stats.maxHp) * 100;
  const manaPercentage = (character.stats.mana / character.stats.maxMana) * 100;

  // Función para voltear la carta
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
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

          {/* Oro */}
          <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
            <span className="text-2xl">💰</span>
            <span className="text-lg font-bold text-yellow-400">
              {character.gold || 0}
            </span>
            <span className="text-sm text-yellow-400/70">oro</span>
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
              const ownAbilities = character.abilities || [];
              // Filtrar habilidades de clase que el personaje NO tiene todavía
              const availableClassAbilities = classAbilities.filter(
                (ca) => !ownAbilities.some((oa) => oa.name === ca.name),
              );

              return (
                <>
                  {/* Habilidades del personaje (guardadas) */}
                  {ownAbilities.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-green-400 mb-2">
                        ✅ Habilidades del personaje:
                      </p>
                      <AccordionList
                        items={ownAbilities.map((ability) => ({
                          id: ability.id || ability._id,
                          title: ability.name,
                          subtitle:
                            ability.manaCost > 0
                              ? `💙 ${ability.manaCost}`
                              : '',
                          icon:
                            CLASS_ICONS[character.classType] ||
                            CLASS_ICONS.default,
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
                              {canEdit && (
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
                    </div>
                  )}

                  {/* Habilidades de clase disponibles para añadir */}
                  {availableClassAbilities.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">
                        📚 Habilidades de clase disponibles:
                      </p>
                      <AccordionList
                        items={availableClassAbilities.map((ability) => ({
                          id: ability.id || ability._id || ability.name,
                          title: ability.name,
                          subtitle:
                            ability.manaCost > 0
                              ? `💙 ${ability.manaCost}`
                              : '',
                          icon:
                            CLASS_ICONS[character.classType] ||
                            CLASS_ICONS.default,
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
                              {canEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdate({ addAbility: ability });
                                  }}
                                  className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-green-900/30 transition-colors mt-2"
                                >
                                  ➕ Añadir al personaje
                                </button>
                              )}
                            </div>
                          ),
                        }))}
                      />
                    </div>
                  )}

                  {/* Si no hay ninguna habilidad */}
                  {ownAbilities.length === 0 &&
                    availableClassAbilities.length === 0 && (
                      <p className="text-gray-500 text-center py-4 text-sm">
                        No hay habilidades
                      </p>
                    )}
                </>
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
              {editing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Escribe la descripción del personaje..."
                  className="w-full bg-gray-600 text-sm text-gray-300 leading-relaxed rounded-lg p-2 min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : character.description ? (
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {character.inventory?.length || 0} objetos
                </span>
                {!isDM && (
                  <span
                    className="text-xs text-yellow-400"
                    title="Items equipados"
                  >
                    ⚔️ {equippedCount}/5
                  </span>
                )}
                {isDM && character.inventory?.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={selectAllItems}
                      className="text-xs text-purple-400 hover:text-purple-300"
                      title={
                        selectedItems.length === character.inventory?.length
                          ? 'Deseleccionar todo'
                          : 'Seleccionar todo'
                      }
                    >
                      {selectedItems.length === character.inventory?.length
                        ? '☑️'
                        : '☐'}
                    </button>
                    {selectedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRemoveItems}
                        disabled={removingItems}
                        className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded disabled:opacity-50"
                        title={`Eliminar ${selectedItems.length} item(s)`}
                      >
                        {removingItems ? '...' : `🗑️ ${selectedItems.length}`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {character.inventory && character.inventory.length > 0 ? (
              <div className="space-y-2">
                {character.inventory.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-gray-700/50 rounded-lg p-3 transition-all ${
                      item.equipped
                        ? 'ring-2 ring-yellow-500 bg-yellow-900/20'
                        : selectedItems.includes(item.id)
                          ? 'ring-2 ring-purple-500 bg-purple-900/30'
                          : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isDM && (
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            className="w-4 h-4 rounded border-gray-500 text-purple-600 focus:ring-purple-500 bg-gray-700 flex-shrink-0"
                          />
                        )}
                        <span className="text-xl flex-shrink-0">
                          {item.icon || '📦'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {item.name}
                            </p>
                            {item.equipped && (
                              <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded flex-shrink-0">
                                Equipado
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate">
                              {item.description}
                            </p>
                          )}
                          {/* Info adicional del item */}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {item.equipSlot && (
                              <span className="text-xs text-blue-400">
                                📍 {item.equipSlot}
                              </span>
                            )}
                            {item.value > 0 && (
                              <span className="text-xs text-yellow-400">
                                💰 {item.value}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cantidad y acciones */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-sm font-bold text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                          x{item.quantity}
                        </span>

                        {/* Botones de acción para jugador (no DM) */}
                        {!isDM && (
                          <div className="flex gap-1">
                            {/* Equipar/Desequipar */}
                            {item.equippable &&
                              (item.equipped ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnequipItem(item.id)}
                                  className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                                  title="Desequipar"
                                >
                                  ❌
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleEquipItem(item.id)}
                                  disabled={equippedCount >= 5}
                                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={
                                    equippedCount >= 5
                                      ? 'Máximo 5 items equipados'
                                      : 'Equipar'
                                  }
                                >
                                  ⚔️
                                </button>
                              ))}
                            {/* Vender */}
                            {item.value > 0 &&
                              item.type !== 'quest' &&
                              !item.equipped && (
                                <button
                                  type="button"
                                  onClick={() => handleSellItem(item)}
                                  className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded"
                                  title={`Vender por ${item.value} oro`}
                                >
                                  💰
                                </button>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
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

      {/* Modal de Venta */}
      {sellModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border-2 border-yellow-500/50">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
              💰 Vender Item
            </h3>

            <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{sellModal.item.icon || '📦'}</span>
                <div>
                  <p className="font-medium text-white">
                    {sellModal.item.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Valor: {sellModal.item.value} oro c/u
                  </p>
                </div>
              </div>
            </div>

            {sellModal.item.quantity > 1 && (
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Cantidad a vender:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSellModal((prev) => ({
                        ...prev,
                        quantity: Math.max(1, prev.quantity - 1),
                      }))
                    }
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-white min-w-[3rem] text-center">
                    {sellModal.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSellModal((prev) => ({
                        ...prev,
                        quantity: Math.min(
                          sellModal.item.quantity,
                          prev.quantity + 1,
                        ),
                      }))
                    }
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg text-xl font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-400">
                    / {sellModal.item.quantity}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-center text-yellow-400 font-bold text-lg">
                Total: {sellModal.item.value * sellModal.quantity} oro
              </p>
              <p className="text-center text-xs text-gray-400 mt-1">
                El DM debe aprobar la venta
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSellModal(null)}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmSell}
                className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium transition-colors"
              >
                💰 Vender
              </button>
            </div>
          </div>
        </div>
      )}
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
  gameId: PropTypes.string,
};
