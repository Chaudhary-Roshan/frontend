import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.get('auth/profile/');
          setUser(response.data);
        } catch (error) {
          console.error("Token might be invalid or expired", error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const login = async (identity, password) => {
    const cleanIdentity = (identity || '').trim();
    const response = await api.post('auth/login/', { 
      identifier: cleanIdentity,
      username: cleanIdentity,
      email: cleanIdentity,
      roll_number: cleanIdentity,
      password 
    });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    
    // Fetch profile after successful login
    const profileResponse = await api.get('auth/profile/');
    setUser(profileResponse.data);
    return profileResponse.data;
  };

  const register = async (userData) => {
    const response = await api.post('auth/register/', userData);
    return response.data;
  };

  const verifyOtp = async (emailOrUsername, otp) => {
    const response = await api.post('auth/verify-otp/', { email: emailOrUsername, username: emailOrUsername, otp });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
