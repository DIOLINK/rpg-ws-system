// Servicio para consumir items por socket
// Modular y escalable

export const itemSocketService = {
  consumeItem(socket, { characterId, inventoryId, gameId }) {
    if (!socket) throw new Error('Socket no inicializado');
    socket.emit('player:consume-item', { characterId, inventoryId, gameId });
  },
};
