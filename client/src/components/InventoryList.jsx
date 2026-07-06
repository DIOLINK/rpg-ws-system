import PropTypes from 'prop-types';
import { memo } from 'react';
import { itemSocketService } from '../services/itemSocketService';

const InventoryList = memo(function InventoryList({
  inventory,
  isDM,
  equippedCount,
  selectedItems,
  toggleItemSelection,
  handleEquipItem,
  handleUnequipItem,
  handleSellItem,
  addToast,
  getSocket,
  character,
  gameId,
  removingItems,
  handleRemoveItems,
  selectAllItems,
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-purple-400 flex items-center gap-2">
          🎒 Inventario
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {inventory?.length || 0} objetos
          </span>
          {!isDM && (
            <span className="text-xs text-yellow-400" title="Items equipados">
              ⚔️ {equippedCount}/5
            </span>
          )}
          {isDM && inventory?.length > 0 && (
            <>
              <button
                type="button"
                onClick={selectAllItems}
                className="text-xs text-purple-400 hover:text-purple-300 active:text-purple-200 p-1 min-h-touch min-w-touch"
                title={
                  selectedItems.length === inventory?.length
                    ? 'Deseleccionar todo'
                    : 'Seleccionar todo'
                }
              >
                {selectedItems.length === inventory?.length ? '☑️' : '☐'}
              </button>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveItems}
                  disabled={removingItems}
                  className="text-xs bg-red-600 hover:bg-red-500 active:bg-red-700 text-white px-2 py-2 rounded disabled:opacity-50 min-h-touch"
                  title={`Eliminar ${selectedItems.length} item(s)`}
                >
                  {removingItems ? '...' : `🗑️ ${selectedItems.length}`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {inventory && inventory.length > 0 ? (
        <div className="space-y-2">
          {inventory.map((item) => (
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
                      {(() => {
                        const unitValue =
                          item.value && item.value > 0
                            ? item.value
                            : item.type === 'quest'
                              ? 0
                              : 1;
                        return (
                          unitValue > 0 && (
                            <span className="text-xs text-yellow-400">
                              💰 {unitValue}
                            </span>
                          )
                        );
                      })()}
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
                    <div className="flex gap-1 flex-shrink-0">
                      {/* Equipar/Desequipar */}
                      {item.equippable &&
                        (item.equipped ? (
                          <button
                            type="button"
                            onClick={() => handleUnequipItem(item.id)}
                            className="text-xs bg-gray-600 hover:bg-gray-500 active:bg-gray-700 text-white px-2 py-2 rounded min-h-touch min-w-touch"
                            title="Desequipar"
                          >
                            ❌
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEquipItem(item.id)}
                            disabled={equippedCount >= 5}
                            className="text-xs bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-2 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed min-h-touch min-w-touch"
                            title={
                              equippedCount >= 5
                                ? 'Máximo 5 items equipados'
                                : 'Equipar'
                            }
                          >
                            ⚔️
                          </button>
                        ))}
                      {/* Usar consumible */}
                      {item.type === 'consumable' &&
                        item.useEffect &&
                        item.quantity > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              console.log('🎯 Consumiendo item:', {
                                itemName: item.name,
                                itemId: item.id || item._id,
                                characterId: character._id,
                                gameId,
                                hasUseEffect: !!item.useEffect,
                                useEffect: item.useEffect,
                              });
                              itemSocketService.consumeItem(getSocket(), {
                                characterId: character._id,
                                inventoryId: item.id || item._id,
                                gameId,
                              });
                              addToast({
                                type: 'info',
                                message: `Intentando consumir ${item.name}`,
                              });
                            }}
                            className="text-xs bg-green-600 hover:bg-green-500 active:bg-green-700 text-white px-2 py-2 rounded min-h-touch min-w-touch"
                            title={`Consumir (${item.name})`}
                          >
                            🍶 Usar
                          </button>
                        )}
                      {/* Vender (usar valor por defecto si falta) */}
                      {(() => {
                        const unitValue =
                          item.value && item.value > 0
                            ? item.value
                            : item.type === 'quest'
                              ? 0
                              : 1;
                        return (
                          unitValue > 0 &&
                          item.type !== 'quest' &&
                          !item.equipped && (
                            <button
                              type="button"
                              onClick={() => handleSellItem(item)}
                              className="text-xs bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white px-2 py-2 rounded min-h-touch min-w-touch"
                              title={`Vender por ${unitValue} oro`}
                            >
                              💰
                            </button>
                          )
                        );
                      })()}
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
    </>
  );
});

InventoryList.propTypes = {
  inventory: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      quantity: PropTypes.number,
      description: PropTypes.string,
      icon: PropTypes.string,
      equipped: PropTypes.bool,
      equippable: PropTypes.bool,
      equipSlot: PropTypes.string,
      type: PropTypes.string,
      useEffect: PropTypes.object,
      value: PropTypes.number,
    }),
  ).isRequired,
  isDM: PropTypes.bool.isRequired,
  equippedCount: PropTypes.number.isRequired,
  selectedItems: PropTypes.arrayOf(PropTypes.string).isRequired,
  toggleItemSelection: PropTypes.func.isRequired,
  handleEquipItem: PropTypes.func.isRequired,
  handleUnequipItem: PropTypes.func.isRequired,
  handleSellItem: PropTypes.func.isRequired,
  addToast: PropTypes.func.isRequired,
  getSocket: PropTypes.func.isRequired,
  character: PropTypes.object.isRequired,
  gameId: PropTypes.string,
  removingItems: PropTypes.bool.isRequired,
  handleRemoveItems: PropTypes.func.isRequired,
  selectAllItems: PropTypes.func.isRequired,
};

export default InventoryList;
