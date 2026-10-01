import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem('khaata_token');
    if (!token) {
      setUser(null);
      setBusiness(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data.user);
        setBusiness(res.data.data.business);
        return res.data.data;
      }
    } catch (err) {
      localStorage.removeItem('khaata_token');
      setUser(null);
      setBusiness(null);
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success && res.data?.data) {
      const { token, user, business } = res.data.data;
      localStorage.setItem('khaata_token', token);
      setUser(user);
      setBusiness(business);
      return res.data.data;
    }
    throw new Error(res.data?.error?.message || 'Login failed');
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    if (res.data?.success && res.data?.data) {
      const { token, user, business } = res.data.data;
      localStorage.setItem('khaata_token', token);
      setUser(user);
      setBusiness(business);
      return res.data.data;
    }
    throw new Error(res.data?.error?.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('khaata_token');
    setUser(null);
    setBusiness(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, business, loading, login, register, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
