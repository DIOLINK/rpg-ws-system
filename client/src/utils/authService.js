export const authService = {
  async loginWithGoogle(token) {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/auth/google`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }
    );

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
