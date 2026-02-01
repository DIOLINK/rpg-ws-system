/**
 * Rate limiter para eventos de Socket.IO
 * Previene spam y abuso de eventos
 */

class SocketRateLimiter {
  constructor() {
    this.clients = new Map();
    this.cleanupInterval = 60 * 1000; // Limpiar cada minuto

    // Limpiar clientes inactivos periódicamente
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Verifica si un cliente ha excedido el límite de rate
   * @param {string} socketId - ID del socket
   * @param {string} event - Nombre del evento
   * @param {number} maxRequests - Máximo de requests permitidos
   * @param {number} windowMs - Ventana de tiempo en ms
   * @returns {boolean} true si está dentro del límite, false si lo excede
   */
  checkLimit(socketId, event, maxRequests = 10, windowMs = 1000) {
    const now = Date.now();
    const key = `${socketId}:${event}`;

    if (!this.clients.has(key)) {
      this.clients.set(key, {
        requests: [now],
        lastRequest: now,
      });
      return true;
    }

    const clientData = this.clients.get(key);

    // Filtrar requests dentro de la ventana de tiempo
    clientData.requests = clientData.requests.filter(
      (timestamp) => now - timestamp < windowMs,
    );

    // Verificar si excede el límite
    if (clientData.requests.length >= maxRequests) {
      return false;
    }

    // Agregar el nuevo request
    clientData.requests.push(now);
    clientData.lastRequest = now;

    return true;
  }

  /**
   * Limpiar clientes inactivos (sin actividad en los últimos 5 minutos)
   */
  cleanup() {
    const now = Date.now();
    const maxInactivity = 5 * 60 * 1000; // 5 minutos

    for (const [key, data] of this.clients.entries()) {
      if (now - data.lastRequest > maxInactivity) {
        this.clients.delete(key);
      }
    }
  }

  /**
   * Remover un cliente específico
   */
  removeClient(socketId) {
    for (const key of this.clients.keys()) {
      if (key.startsWith(socketId + ':')) {
        this.clients.delete(key);
      }
    }
  }

  /**
   * Middleware para Socket.IO
   * Uso: socket.use(rateLimiter.middleware({ maxRequests: 10, windowMs: 1000 }))
   */
  middleware(options = {}) {
    const { maxRequests = 10, windowMs = 1000 } = options;

    return (packet, next) => {
      const [event] = packet;
      const socketId = packet.nsp?.socket?.id;

      if (!socketId) {
        return next();
      }

      // Eventos que no deben ser limitados (sistema)
      const whitelist = ['connection', 'disconnect', 'error'];
      if (whitelist.includes(event)) {
        return next();
      }

      if (!this.checkLimit(socketId, event, maxRequests, windowMs)) {
        const error = new Error('Rate limit exceeded');
        error.data = { event, limit: maxRequests, window: windowMs };
        return next(error);
      }

      next();
    };
  }
}

// Instancia singleton
export const socketRateLimiter = new SocketRateLimiter();

export default socketRateLimiter;
