import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await api.getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.login({ email, password });
    const { accessToken, refreshToken, user: userData } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    setUser(userData);
    return response.data;
  };

  const register = async (userData) => {
    const response = await api.register(userData);
    return response.data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.logout({ refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = async (userId, data) => {
    const response = await api.updateUser(userId, data);
    if (user && user.id === userId) {
      setUser(prev => ({ ...prev, ...response.data }));
    }
    return response.data;
  };

  const blockUser = async (userId) => {
    const response = await api.blockUser(userId);
    return response.data;
  };

  const unblockUser = async (userId) => {
    const response = await api.unblockUser(userId);
    return response.data;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    blockUser,
    unblockUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};