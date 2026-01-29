import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { itemService } from '../services/itemService';

const SellRequestsPanel = ({ socket, gameId }) => {
  const [sellRequests, setSellRequests] = useState([]);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (!socket) {
      console.log('⚠️ SellRequestsPanel: socket no disponible');
      return;
    }

    console.log(
      '✅ SellRequestsPanel: socket conectado, escuchando sell-request',
    );

    // Escuchar solicitudes de venta
    const handleSellRequest = (request) => {
      console.log('💰 Nueva solicitud de venta:', request);
      setSellRequests((prev) => {
        // Evitar duplicados
        if (prev.some((r) => r.id === request.id)) return prev;
        return [...prev, request];
      });
    };

    socket.on('sell-request', handleSellRequest);

    return () => {
      socket.off('sell-request', handleSellRequest);
    };
  }, [socket]);

  const handleResponse = async (request, approved) => {
    setProcessing((prev) => ({ ...prev, [request.id]: true }));

    // Debug: verificar token
    const token = localStorage.getItem('token');
    console.log(
      '🔑 Token disponible:',
      token ? 'Sí (' + token.substring(0, 20) + '...)' : 'NO',
    );

    try {
      await itemService.respondToSellRequest({
        characterId: request.characterId,
        inventoryId: request.inventoryId,
        quantity: request.quantity,
        totalValue: request.totalValue,
        approved,
        gameId,
      });

      // Eliminar la solicitud de la lista
      setSellRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error('Error al procesar venta:', error);
      alert(error.message || 'Error al procesar la venta');
    } finally {
      setProcessing((prev) => ({ ...prev, [request.id]: false }));
    }
  };

  if (sellRequests.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2">
      {sellRequests.map((request) => (
        <div
          key={request.id}
          className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-4 shadow-xl animate-pulse"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-sm font-bold text-yellow-400">
                Solicitud de Venta
              </p>
              <p className="text-xs text-gray-400">
                de {request.characterName}
              </p>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{request.itemIcon}</span>
              <span className="text-sm font-medium text-white">
                {request.itemName}
              </span>
              <span className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">
                x{request.quantity}
              </span>
            </div>
            <p className="text-sm text-yellow-400 font-bold">
              💰 {request.totalValue} oro
              {request.quantity > 1 && (
                <span className="text-xs text-gray-400 font-normal ml-1">
                  ({request.unitValue} c/u)
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleResponse(request, true)}
              disabled={processing[request.id]}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              ✅ Aprobar
            </button>
            <button
              type="button"
              onClick={() => handleResponse(request, false)}
              disabled={processing[request.id]}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-3 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              ❌ Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

SellRequestsPanel.propTypes = {
  socket: PropTypes.object,
  gameId: PropTypes.string.isRequired,
};

export default SellRequestsPanel;
