import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import useToastStore from '../context/toastStore';
import { getRarityInfo, itemService } from '../services/itemService';

const ShopOffersPanel = ({
  socket,
  gameId,
  characterId,
  characterGold = 0,
}) => {
  const [shopOffers, setShopOffers] = useState([]);
  const [processing, setProcessing] = useState({});
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (!socket) {
      console.log('⚠️ ShopOffersPanel: socket no disponible');
      return;
    }

    console.log('🏪 ShopOffersPanel: escuchando shop-offer');

    // Escuchar ofertas de compra del DM
    const handleShopOffer = (offer) => {
      console.log('🏪 Nueva oferta de compra:', offer);
      // Solo mostrar si es para este personaje
      if (offer.characterId === characterId) {
        setShopOffers((prev) => {
          if (prev.some((o) => o.id === offer.id)) return prev;
          return [...prev, offer];
        });
      }
    };

    socket.on('shop-offer', handleShopOffer);

    return () => {
      socket.off('shop-offer', handleShopOffer);
    };
  }, [socket, characterId]);

  const handleResponse = async (offer, accepted) => {
    // Verificar oro antes de intentar comprar
    if (accepted && characterGold < offer.totalPrice) {
      addToast({
        type: 'error',
        message: `❌ No tienes suficiente oro\nNecesitas ${offer.totalPrice} oro, tienes ${characterGold}`,
      });
      return;
    }

    setProcessing((prev) => ({ ...prev, [offer.id]: true }));

    try {
      const result = await itemService.respondToShopOffer({
        items: offer.items,
        characterId: offer.characterId,
        totalPrice: offer.totalPrice,
        accepted,
        gameId,
        offerId: offer.id,
      });

      // Eliminar la oferta de la lista
      setShopOffers((prev) => prev.filter((o) => o.id !== offer.id));

      if (accepted) {
        const itemSummary = offer.items
          .map((i) => `${i.quantity}x ${i.itemName}`)
          .join(', ');
        addToast({
          type: 'success',
          message: `🛒 Compra exitosa!\n${itemSummary}\nOro restante: ${result.newGold}`,
        });
      } else {
        addToast({
          type: 'info',
          message: `Rechazaste la oferta del DM`,
        });
      }
    } catch (error) {
      console.error('Error al procesar oferta:', error);
      addToast({
        type: 'error',
        message: error.message || 'Error al procesar la oferta',
      });
    } finally {
      setProcessing((prev) => ({ ...prev, [offer.id]: false }));
    }
  };

  if (shopOffers.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm space-y-2">
      {shopOffers.map((offer) => (
        <div
          key={offer.id}
          className="bg-gray-800 border-2 border-emerald-500 rounded-lg p-4 shadow-xl animate-pulse"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏪</span>
            <div>
              <p className="text-sm font-bold text-emerald-400">
                Oferta del DM
              </p>
              <p className="text-xs text-gray-400">
                {offer.items.length} item{offer.items.length !== 1 ? 's' : ''}{' '}
                en oferta
              </p>
            </div>
          </div>

          {/* Lista de items */}
          <div className="bg-gray-700/50 rounded-lg p-3 mb-3 max-h-[200px] overflow-y-auto space-y-2">
            {offer.items.map((item, idx) => (
              <div
                key={`${item.itemId}-${idx}`}
                className="flex items-center gap-2 bg-gray-600/50 rounded p-2"
              >
                <span className="text-xl">{item.itemIcon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-medium truncate ${getRarityInfo(item.itemRarity).color}`}
                    >
                      {item.itemName}
                    </span>
                    <span className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">
                      x{item.quantity}
                    </span>
                  </div>
                  {item.itemDescription && (
                    <p className="text-xs text-gray-400 truncate">
                      {item.itemDescription}
                    </p>
                  )}
                </div>
                <span className="text-xs text-yellow-400 whitespace-nowrap">
                  {item.subtotal} 💰
                </span>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-600">
              <span className="text-sm text-gray-300">Total:</span>
              <span className="text-lg font-bold text-yellow-400">
                💰 {offer.totalPrice} oro
              </span>
            </div>

            {/* Tu oro disponible */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-400">Tu oro:</span>
              <span
                className={`text-sm font-medium ${
                  characterGold >= offer.totalPrice
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                💰 {characterGold}
                {characterGold < offer.totalPrice && (
                  <span className="ml-1 text-xs">
                    (faltan {offer.totalPrice - characterGold})
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleResponse(offer, true)}
              disabled={
                processing[offer.id] || characterGold < offer.totalPrice
              }
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                characterGold >= offer.totalPrice
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {characterGold >= offer.totalPrice
                ? '💰 Comprar Todo'
                : '❌ Oro insuficiente'}
            </button>
            <button
              type="button"
              onClick={() => handleResponse(offer, false)}
              disabled={processing[offer.id]}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              ❌ Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

ShopOffersPanel.propTypes = {
  socket: PropTypes.object,
  gameId: PropTypes.string.isRequired,
  characterId: PropTypes.string,
  characterGold: PropTypes.number,
};

export default ShopOffersPanel;
