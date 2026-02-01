/**
 * Sistema de caché simple para peticiones HTTP
 * Evita peticiones duplicadas y almacena respuestas temporalmente
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Genera una clave única para la petición
   */
  getCacheKey(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Obtiene datos del caché si están disponibles y no han expirado
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Almacena datos en el caché
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Invalida una clave específica o todo el caché
   */
  invalidate(key = null) {
    if (key) {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
    } else {
      this.cache.clear();
      this.pendingRequests.clear();
    }
  }

  /**
   * Invalida todas las claves que coincidan con un patrón
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Ejecuta una petición con caché
   * Evita peticiones duplicadas en vuelo
   */
  async fetch(url, options = {}, cacheTTL = this.defaultTTL, useCache = true) {
    const key = this.getCacheKey(url, options);

    // Solo usar caché para peticiones GET
    const shouldCache = useCache && (options.method || 'GET') === 'GET';

    // Intentar obtener del caché
    if (shouldCache) {
      const cached = this.get(key);
      if (cached) {
        return cached;
      }

      // Si hay una petición pendiente, esperar su resultado
      const pending = this.pendingRequests.get(key);
      if (pending) {
        return pending;
      }
    }

    // Hacer la petición
    const promise = fetch(url, options)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();

        // Guardar en caché solo si es exitoso y GET
        if (shouldCache) {
          this.set(key, data, cacheTTL);
        }

        return data;
      })
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    // Guardar la promesa para evitar duplicados
    if (shouldCache) {
      this.pendingRequests.set(key, promise);
    }

    return promise;
  }

  /**
   * Limpia entradas expiradas del caché
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Instancia singleton
export const cacheService = new CacheService();

// Limpiar caché expirado cada 5 minutos
setInterval(() => cacheService.cleanup(), 5 * 60 * 1000);

export default cacheService;
