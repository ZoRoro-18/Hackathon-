import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const extractAuthData = (data) => {
    if (!data) return { user: null, business: null };
    const rawUser = data.user || data;
    const userObj = {
      id: rawUser.id,
      email: rawUser.email,
      fullName: rawUser.full_name || rawUser.fullName || '',
      full_name: rawUser.full_name || rawUser.fullName || '',
      role: rawUser.role || 'merchant',
      language: rawUser.language || 'en',
      theme: rawUser.theme || 'system',
      textSize: rawUser.text_size || rawUser.textSize || 'normal',
      text_size: rawUser.text_size || rawUser.textSize || 'normal',
    };
    const rawBusiness = data.business || rawUser;
    const businessObj = {
      id: rawBusiness.business_id || rawBusiness.id,
      name: rawBusiness.business_name || rawBusiness.name || 'My Business',
      business_name: rawBusiness.business_name || rawBusiness.name || 'My Business',
      gstin: rawBusiness.gstin || '',
      state: rawBusiness.state || '',
      state_code: rawBusiness.gstin ? rawBusiness.gstin.substring(0, 2) : (rawBusiness.state_code || '27'),
      address: rawBusiness.address || '',
      currency: rawBusiness.currency || 'INR',
    };
    return { user: userObj, business: businessObj };
  };

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
        const { user: u, business: b } = extractAuthData(res.data.data);
        setUser(u);
        setBusiness(b);
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
      const { token } = res.data.data;
      const { user: u, business: b } = extractAuthData(res.data.data);
      localStorage.setItem('khaata_token', token);
      setUser(u);
      setBusiness(b);
      return res.data.data;
    }
    throw new Error(res.data?.error?.message || 'Login failed');
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    if (res.data?.success && res.data?.data) {
      const { token } = res.data.data;
      const { user: u, business: b } = extractAuthData(res.data.data);
      localStorage.setItem('khaata_token', token);
      setUser(u);
      setBusiness(b);
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
