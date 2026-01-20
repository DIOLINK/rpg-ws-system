/* eslint-disable react-refresh/only-export-components */
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';
import { authService } from '../utils/authService';

const AuthContext = createContext();
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verificar token en el backend
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/lobby'); // Redirigir al lobby si el usuario está autenticado
      } else {
        navigate('/login'); // Redirigir al login si no está autenticado
      }
    }
  }, [user]);

  const fetchUser = async (token) => {
    try {
      const response = await apiFetch(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } },
        logout,
      );
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const data = await authService.loginWithGoogle();
      setUser(data.user);
      // El token de Google ya se guarda en localStorage en authService
      return data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      loading,
      isDM: user?.isDM || false,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
