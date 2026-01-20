// apiFetch.js
// Utilidad para fetch con manejo automático de 401 y refresh token
import { authService } from './authService';

/**
 * apiFetch envuelve fetch y maneja el refresh automático de token si recibe un 401.
 * Si el refresh falla, ejecuta logoutCallback.
 * @param {string} url
 * @param {object} options
 * @param {function} logoutCallback - función a ejecutar si el refresh falla
 */
export async function apiFetch(url, options = {}, logoutCallback) {
  let token = authService.getToken();
  let refreshToken = localStorage.getItem('refreshToken');
  options.headers = options.headers || {};
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, options);

  if (response.status === 401 && refreshToken) {
    // Intentar refrescar el token
    const refreshRes = await fetch(
      `${import.meta.env.VITE_API_URL}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      },
    );
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem('token', data.token);
      // Si el backend devuelve un nuevo refreshToken, actualizarlo
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      // Reintentar la petición original con el nuevo token
      options.headers['Authorization'] = `Bearer ${data.token}`;
      response = await fetch(url, options);
    } else {
      // Si falla el refresh, cerrar sesión
      if (typeof logoutCallback === 'function') logoutCallback();
      throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
    }
  }

  return response;
}
