import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import {
  EQUIP_SLOTS,
  getItemTypeInfo,
  getRarityInfo,
  ITEM_RARITIES,
  ITEM_TYPES,
  itemService,
} from '../services/itemService';

const ItemManager = ({ characters, gameId, onItemAssigned }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'create', 'assign', 'shop'
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRarity, setFilterRarity] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado para la tienda (DM vendiendo a jugadores) - Soporta múltiples items
  const [shopSelectedItems, setShopSelectedItems] = useState([]); // [{item, quantity, price}]
  const [shopSelectedCharacter, setShopSelectedCharacter] = useState('');

  // Estado para crear/editar item
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'misc',
    rarity: 'common',
    icon: '📦',
    equippable: false,
    equipSlot: '',
    damage: '',
    armorValue: 0,
    value: 0,
    statModifiers: {
      strength: 0,
      intelligence: 0,
      dexterity: 0,
      defense: 0,
      maxHp: 0,
      maxMana: 0,
    },
  });

  const [editingItem, setEditingItem] = useState(null);

  // Cargar items
  useEffect(() => {
    loadItems();
  }, []);

  // Auto-limpiar mensajes de éxito después de 3 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await itemService.getAll();
      console.log('Items cargados:', data);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar items:', err);
      setError('Error al cargar items: ' + err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar items
  const filteredItems = (items || []).filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || item.type === filterType;
    const matchesRarity = !filterRarity || item.rarity === filterRarity;
    return matchesSearch && matchesType && matchesRarity;
  });

  // Crear/Actualizar item
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingItem) {
        await itemService.update(editingItem._id, formData);
        setSuccess('Item actualizado correctamente');
      } else {
        await itemService.create(formData);
        setSuccess('Item creado correctamente');
      }

      resetForm();
      loadItems();
      setActiveTab('catalog');
    } catch (err) {
      setError(err.message || 'Error al guardar el item');
    }
  };

  // Eliminar item
  const handleDelete = async (itemId) => {
    if (!window.confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      await itemService.delete(itemId);
      setSuccess('Item eliminado');
      loadItems();
    } catch (err) {
      setError(err.message || 'Error al eliminar');
    }
  };

  // Editar item
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      type: item.type,
      rarity: item.rarity,
      icon: item.icon || '📦',
      equippable: item.equippable || false,
      equipSlot: item.equipSlot || '',
      damage: item.damage || '',
      armorValue: item.armorValue || 0,
      value: item.value || 0,
      statModifiers: item.statModifiers || {
        strength: 0,
        intelligence: 0,
        dexterity: 0,
        defense: 0,
        maxHp: 0,
        maxMana: 0,
      },
    });
    setActiveTab('create');
  };

  // Duplicar item (crear nuevo basado en existente)
  const handleDuplicate = (item) => {
    setEditingItem(null); // No estamos editando, estamos creando uno nuevo
    setFormData({
      name: `${item.name} (copia)`,
      description: item.description || '',
      type: item.type,
      rarity: item.rarity,
      icon: item.icon || '📦',
      equippable: item.equippable || false,
      equipSlot: item.equipSlot || '',
      damage: item.damage || '',
      armorValue: item.armorValue || 0,
      value: item.value || 0,
      statModifiers: item.statModifiers
        ? { ...item.statModifiers }
        : {
            strength: 0,
            intelligence: 0,
            dexterity: 0,
            defense: 0,
            maxHp: 0,
            maxMana: 0,
          },
    });
    setActiveTab('create');
    setSuccess('Item cargado como plantilla. Modifica los datos y guarda.');
  };

  // Reset form
  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      type: 'misc',
      rarity: 'common',
      icon: '📦',
      equippable: false,
      equipSlot: '',
      damage: '',
      armorValue: 0,
      value: 0,
      statModifiers: {
        strength: 0,
        intelligence: 0,
        dexterity: 0,
        defense: 0,
        maxHp: 0,
        maxMana: 0,
      },
    });
  };

  // Toggle selección de item
  const toggleItemSelection = (item) => {
    setSelectedItems((prev) =>
      prev.some((i) => i._id === item._id)
        ? prev.filter((i) => i._id !== item._id)
        : [...prev, item],
    );
  };

  // Seleccionar/deseleccionar todos los items filtrados
  const selectAllItems = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredItems]);
    }
  };

  // Asignar items
  const handleAssign = async () => {
    if (selectedItems.length === 0 || selectedCharacters.length === 0) {
      setError('Selecciona al menos un item y un personaje');
      return;
    }

    setError('');
    setSuccess('');

    try {
      // Asignar cada item seleccionado
      for (const item of selectedItems) {
        if (selectedCharacters.length === 1) {
          await itemService.assignToCharacter(selectedCharacters[0], {
            itemId: item._id,
            quantity,
            gameId,
          });
        } else {
          await itemService.assignBulk({
            itemId: item._id,
            characterIds: selectedCharacters,
            quantity,
            gameId,
          });
        }
      }

      setSuccess(
        `${selectedItems.length} item(s) asignado(s) a ${selectedCharacters.length} personaje(s)`,
      );
      setSelectedItems([]);
      setSelectedCharacters([]);
      setQuantity(1);

      if (onItemAssigned) onItemAssigned();
    } catch (err) {
      setError(err.message || 'Error al asignar items');
    }
  };

  // Toggle selección de personaje
  const toggleCharacterSelection = (charId) => {
    setSelectedCharacters((prev) =>
      prev.includes(charId)
        ? prev.filter((id) => id !== charId)
        : [...prev, charId],
    );
  };

  // Seleccionar todos los personajes
  const selectAllCharacters = () => {
    if (selectedCharacters.length === characters.length) {
      setSelectedCharacters([]);
    } else {
      setSelectedCharacters(characters.map((c) => c._id));
    }
  };

  const renderTabs = () => (
    <div className="flex gap-2 mb-4 border-b border-gray-700 pb-2 overflow-x-auto">
      {[
        { id: 'catalog', label: '📦 Catálogo', icon: '📦' },
        { id: 'create', label: '➕ Crear Item', icon: '➕' },
        { id: 'assign', label: '🎁 Asignar', icon: '🎁' },
        { id: 'shop', label: '🏪 Vender', icon: '🏪' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id);
            setSuccess('');
            setError('');
            if (tab.id === 'create') resetForm();
          }}
          className={`px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderCatalog = () => (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
        >
          <option value="">Todos los tipos</option>
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>
        <select
          value={filterRarity}
          onChange={(e) => setFilterRarity(e.target.value)}
          className="px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
        >
          <option value="">Todas las rarezas</option>
          {ITEM_RARITIES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Seleccionar todos */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          {selectedItems.length > 0 &&
            `${selectedItems.length} item(s) seleccionado(s)`}
        </span>
        <button
          onClick={selectAllItems}
          className="text-xs text-purple-400 hover:text-purple-300"
        >
          {selectedItems.length === filteredItems.length &&
          filteredItems.length > 0
            ? 'Deseleccionar todos'
            : 'Seleccionar todos'}
        </button>
      </div>

      {/* Lista de items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
        {filteredItems.map((item) => {
          const typeInfo = getItemTypeInfo(item.type);
          const rarityInfo = getRarityInfo(item.rarity);
          const isSelected = selectedItems.some((i) => i._id === item._id);

          return (
            <div
              key={item._id}
              className={`bg-gray-700 rounded-lg p-3 border-l-4 ${
                isSelected
                  ? 'border-purple-500 ring-2 ring-purple-500'
                  : 'border-transparent'
              } cursor-pointer hover:bg-gray-600 transition-colors`}
              onClick={() => toggleItemSelection(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded accent-purple-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-2xl">{item.icon || typeInfo.icon}</span>
                  <div>
                    <h4 className={`font-medium ${rarityInfo.color}`}>
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {typeInfo.label} • {rarityInfo.label}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {/* Botón duplicar (siempre visible) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(item);
                    }}
                    className="text-green-400 hover:text-green-300 p-1"
                    title="Usar como plantilla"
                  >
                    📋
                  </button>
                  {/* Botones editar/eliminar (solo para items custom) */}
                  {item.isCustom && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item._id);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {item.damage && (
                  <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded">
                    ⚔️ {item.damage}
                  </span>
                )}
                {item.value > 0 && (
                  <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded">
                    🪙 {item.value}
                  </span>
                )}
                {item.equippable && (
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                    Equipable
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No se encontraron items
        </p>
      )}
    </div>
  );

  const renderCreateForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre e Icono */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nombre</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Icono</label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="📦"
          />
        </div>

        {/* Tipo y Rareza */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tipo</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
          >
            {ITEM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rareza</label>
          <select
            value={formData.rarity}
            onChange={(e) =>
              setFormData({ ...formData, rarity: e.target.value })
            }
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
          >
            {ITEM_RARITIES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px]"
          />
        </div>

        {/* Equipable */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.equippable}
              onChange={(e) =>
                setFormData({ ...formData, equippable: e.target.checked })
              }
              className="w-4 h-4 rounded bg-gray-700"
            />
            <span className="text-sm text-gray-300">Equipable</span>
          </label>
        </div>

        {formData.equippable && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Slot de equipo
            </label>
            <select
              value={formData.equipSlot}
              onChange={(e) =>
                setFormData({ ...formData, equipSlot: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
            >
              <option value="">Seleccionar...</option>
              {EQUIP_SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Daño (para armas) */}
        {formData.type === 'weapon' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Daño (ej: 1d6+2)
            </label>
            <input
              type="text"
              value={formData.damage}
              onChange={(e) =>
                setFormData({ ...formData, damage: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
              placeholder="1d6"
            />
          </div>
        )}

        {/* Valor */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Valor (oro)
          </label>
          <input
            type="number"
            value={formData.value}
            onChange={(e) =>
              setFormData({ ...formData, value: Number(e.target.value) })
            }
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
            min="0"
          />
        </div>

        {/* Modificadores de stats */}
        {formData.equippable && (
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">
              Modificadores de stats
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(formData.statModifiers).map(([stat, value]) => (
                <div key={stat}>
                  <label className="block text-xs text-gray-500 capitalize">
                    {stat}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statModifiers: {
                          ...formData.statModifiers,
                          [stat]: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-2 py-1 bg-gray-600 rounded text-white text-sm text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          {editingItem ? '💾 Guardar cambios' : '➕ Crear item'}
        </button>
        {editingItem && (
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );

  const renderAssign = () => (
    <div className="space-y-4">
      {/* Items seleccionados */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-400">
            Items a asignar ({selectedItems.length})
          </label>
          {selectedItems.length > 0 && (
            <button
              onClick={() => setSelectedItems([])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Limpiar selección
            </button>
          )}
        </div>
        {selectedItems.length > 0 ? (
          <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto bg-gray-700/50 rounded-lg p-3">
            {selectedItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-2 bg-gray-600 rounded-lg px-2 py-1"
              >
                <span>{item.icon}</span>
                <span className={`text-sm ${getRarityInfo(item.rarity).color}`}>
                  {item.name}
                </span>
                <button
                  onClick={() => toggleItemSelection(item)}
                  className="text-gray-400 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm bg-gray-700/50 rounded-lg p-3">
            Selecciona items del catálogo
          </p>
        )}
      </div>

      {/* Cantidad */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Cantidad</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-24 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
          min="1"
        />
      </div>

      {/* Selección de personajes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-400">Personajes</label>
          <button
            onClick={selectAllCharacters}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {selectedCharacters.length === characters.length
              ? 'Deseleccionar todos'
              : 'Seleccionar todos'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
          {characters.map((char) => (
            <label
              key={char._id}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                selectedCharacters.includes(char._id)
                  ? 'bg-purple-600/30 border border-purple-500'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedCharacters.includes(char._id)}
                onChange={() => toggleCharacterSelection(char._id)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white truncate">{char.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Botón asignar */}
      <button
        onClick={handleAssign}
        disabled={selectedItems.length === 0 || selectedCharacters.length === 0}
        className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
      >
        🎁 Asignar {selectedItems.length} item(s) a {selectedCharacters.length}{' '}
        personaje(s)
      </button>
    </div>
  );

  // Funciones para manejar items de la tienda
  const addShopItem = (item) => {
    setShopSelectedItems((prev) => {
      const existing = prev.find((i) => i.item._id === item._id);
      if (existing) {
        return prev.map((i) =>
          i.item._id === item._id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { item, quantity: 1, price: item.value || 0 }];
    });
  };

  const removeShopItem = (itemId) => {
    setShopSelectedItems((prev) => prev.filter((i) => i.item._id !== itemId));
  };

  const updateShopItemQuantity = (itemId, quantity) => {
    setShopSelectedItems((prev) =>
      prev.map((i) =>
        i.item._id === itemId ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    );
  };

  const updateShopItemPrice = (itemId, price) => {
    setShopSelectedItems((prev) =>
      prev.map((i) =>
        i.item._id === itemId ? { ...i, price: Math.max(0, price) } : i,
      ),
    );
  };

  const getShopTotalPrice = () => {
    return shopSelectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  };

  // Función para enviar oferta de compra al jugador (múltiples items)
  const handleSendShopOffer = async () => {
    if (shopSelectedItems.length === 0 || !shopSelectedCharacter) {
      setError('Selecciona al menos un item y un personaje');
      return;
    }

    try {
      setError('');
      const items = shopSelectedItems.map((i) => ({
        itemId: i.item._id,
        quantity: i.quantity,
        price: i.price,
      }));

      await itemService.createShopOffer({
        items,
        characterId: shopSelectedCharacter,
        gameId,
      });

      const itemNames = shopSelectedItems
        .map((i) => `${i.quantity}x ${i.item.name}`)
        .join(', ');
      setSuccess(
        `Oferta enviada: ${itemNames} por ${getShopTotalPrice()} oro total`,
      );

      // Limpiar selección
      setShopSelectedItems([]);
      setShopSelectedCharacter('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al enviar oferta');
    }
  };

  const renderShop = () => (
    <div className="space-y-4">
      <div className="bg-gray-700/50 rounded-lg p-4">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          🏪 Vender Items a Jugador
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Selecciona uno o varios items del catálogo, elige un jugador y
          establece el precio de cada uno. El jugador recibirá una oferta que
          puede aceptar o rechazar.
        </p>

        {/* Items seleccionados para vender */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">
              Items a vender ({shopSelectedItems.length})
            </label>
            {shopSelectedItems.length > 0 && (
              <button
                onClick={() => setShopSelectedItems([])}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Limpiar todo
              </button>
            )}
          </div>
          {shopSelectedItems.length > 0 ? (
            <div className="space-y-2 max-h-[250px] overflow-y-auto bg-gray-600/50 rounded-lg p-3">
              {shopSelectedItems.map((shopItem) => (
                <div
                  key={shopItem.item._id}
                  className="flex items-center gap-2 bg-gray-700 rounded-lg p-2"
                >
                  <span className="text-xl">{shopItem.item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-medium ${getRarityInfo(shopItem.item.rarity).color}`}
                    >
                      {shopItem.item.name}
                    </span>
                    <p className="text-xs text-gray-400">
                      Base: {shopItem.item.value} oro
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400">Cant.</span>
                      <input
                        type="number"
                        value={shopItem.quantity}
                        onChange={(e) =>
                          updateShopItemQuantity(
                            shopItem.item._id,
                            Number(e.target.value),
                          )
                        }
                        className="w-14 px-1 py-1 bg-gray-600 rounded text-white text-sm text-center"
                        min="1"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400">Precio</span>
                      <input
                        type="number"
                        value={shopItem.price}
                        onChange={(e) =>
                          updateShopItemPrice(
                            shopItem.item._id,
                            Number(e.target.value),
                          )
                        }
                        className="w-16 px-1 py-1 bg-gray-600 rounded text-white text-sm text-center"
                        min="0"
                      />
                    </div>
                    <span className="text-xs text-yellow-400 w-16 text-right">
                      = {shopItem.quantity * shopItem.price} 💰
                    </span>
                    <button
                      onClick={() => removeShopItem(shopItem.item._id)}
                      className="text-gray-400 hover:text-red-400 ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {/* Total */}
              <div className="flex justify-end pt-2 border-t border-gray-600">
                <span className="text-sm font-medium text-yellow-400">
                  Total: {getShopTotalPrice()} oro 💰
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm bg-gray-600/50 rounded-lg p-3">
              👆 Haz clic en items del catálogo abajo para agregarlos
            </p>
          )}
        </div>

        {/* Selección de personaje */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Vender a</label>
          <select
            value={shopSelectedCharacter}
            onChange={(e) => setShopSelectedCharacter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white"
          >
            <option value="">Selecciona un personaje...</option>
            {characters.map((char) => (
              <option key={char._id} value={char._id}>
                {char.name} - 💰 {char.gold || 0} oro
              </option>
            ))}
          </select>
        </div>

        {/* Resumen */}
        {shopSelectedItems.length > 0 && shopSelectedCharacter && (
          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-300 mb-2">
              <span className="text-white font-medium">Resumen:</span> Vender a{' '}
              <span className="text-purple-400">
                {characters.find((c) => c._id === shopSelectedCharacter)?.name}
              </span>
            </p>
            <ul className="text-xs text-gray-400 space-y-1">
              {shopSelectedItems.map((si) => (
                <li key={si.item._id}>
                  • {si.quantity}x{' '}
                  <span className={getRarityInfo(si.item.rarity).color}>
                    {si.item.name}
                  </span>{' '}
                  → {si.price * si.quantity} oro
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium text-yellow-400 mt-2 pt-2 border-t border-gray-600">
              Total: {getShopTotalPrice()} oro
            </p>
          </div>
        )}

        {/* Botón enviar oferta */}
        <button
          onClick={handleSendShopOffer}
          disabled={shopSelectedItems.length === 0 || !shopSelectedCharacter}
          className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          📨 Enviar Oferta ({shopSelectedItems.length} item
          {shopSelectedItems.length !== 1 ? 's' : ''})
        </button>
      </div>

      {/* Mini catálogo para seleccionar items */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">
          Seleccionar Items del Catálogo
        </h4>

        {/* Búsqueda rápida */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar item..."
          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white text-sm mb-3"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
          {filteredItems.slice(0, 20).map((item) => {
            const isSelected = shopSelectedItems.some(
              (si) => si.item._id === item._id,
            );
            return (
              <button
                key={item._id}
                onClick={() => addShopItem(item)}
                className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-yellow-600/30 border border-yellow-500'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${getRarityInfo(item.rarity).color}`}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-yellow-400">{item.value} oro</p>
                </div>
                {isSelected && (
                  <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        📦 Gestión de Items
      </h2>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-300 text-sm">
          {success}
        </div>
      )}

      {renderTabs()}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Cargando items...</div>
      ) : (
        <>
          {activeTab === 'catalog' && renderCatalog()}
          {activeTab === 'create' && renderCreateForm()}
          {activeTab === 'assign' && renderAssign()}
          {activeTab === 'shop' && renderShop()}
        </>
      )}
    </div>
  );
};

ItemManager.propTypes = {
  characters: PropTypes.array.isRequired,
  gameId: PropTypes.string.isRequired,
  onItemAssigned: PropTypes.func,
};

export default ItemManager;
