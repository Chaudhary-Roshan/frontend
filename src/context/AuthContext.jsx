import React, { createContext, useState, useEffect } from 'react';
import api, { invalidateCache } from '../utils/api';
import { requestOtpViaGas, resendOtpViaGas, isGasConfigured } from '../utils/otp';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const cached = localStorage.getItem('dsms_cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  // isAuthLoading is true only when verifying an existing token session
  const [isAuthLoading, setIsAuthLoading] = useState(() => {
    try {
      return Boolean(localStorage.getItem('access_token'));
    } catch (e) {
      return false;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return Boolean(localStorage.getItem('access_token'));
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.get('auth/profile/');
          setUser(response.data);
          try {
            localStorage.setItem('dsms_cached_user', JSON.stringify(response.data));
          } catch (e) {}
        } catch (error) {
          console.error("Token might be invalid or expired", error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('dsms_cached_user');
          setUser(null);
        }
      } else {
        localStorage.removeItem('dsms_cached_user');
        setUser(null);
      }
      setIsAuthLoading(false);
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
    try {
      localStorage.setItem('dsms_cached_user', JSON.stringify(profileResponse.data));
    } catch (e) {}
    setIsAuthLoading(false);
    setLoading(false);
    return profileResponse.data;
  };

  /**
   * Register a new user.
   * 1. Calls the Django backend to create the user and store the OTP.
   * 2. If VITE_GAS_URL is configured, also fires the GAS mailer so the
   *    OTP is delivered via cssc.dice@gmail.com. The Django SMTP path
   *    runs in parallel on the backend; GAS is an additional delivery.
   * Returns the Django response data (including masked_email if present).
   */
  const register = async (userData) => {
    const response = await api.post('auth/register/', userData);
    const data = response.data;

    // Fire GAS email in parallel (non-blocking) when GAS is configured
    if (isGasConfigured() && data.requires_otp) {
      const recipientEmail = userData.email || data.email || '';
      const recipientName  = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User';
      requestOtpViaGas(recipientEmail, recipientName)
        .then(gasResp => {
          // Merge masked_email from GAS if Django didn't provide one
          if (gasResp.masked_email && !data.masked_email) {
            data.masked_email = gasResp.masked_email;
          }
          console.info('[GAS] OTP dispatched:', gasResp.masked_email);
        })
        .catch(err => console.warn('[GAS] OTP dispatch failed (SMTP fallback active):', err.message));
    }

    return data;
  };

  const verifyOtp = async (emailOrUsername, otp) => {
    const response = await api.post('auth/verify-otp/', { email: emailOrUsername, username: emailOrUsername, otp });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    setUser(response.data.user);
    try {
      localStorage.setItem('dsms_cached_user', JSON.stringify(response.data.user));
    } catch (e) {}
    setIsAuthLoading(false);
    setLoading(false);
    return response.data;
  };

  /**
   * Resend OTP – tries GAS first, falls back to Django SMTP endpoint.
   * Returns an object with at least { message, masked_email }.
   */
  const resendOtp = async (email, name) => {
    // 1. Always call Django backend to generate and persist new OTP in database
    const resp = await api.post('auth/resend-otp/', { email });
    const data = resp.data;

    // 2. Fire GAS email delivery in parallel if configured
    if (isGasConfigured()) {
      try {
        await resendOtpViaGas(email, name || 'User');
      } catch (err) {
        console.warn('[GAS] Resend failed (Django SMTP active):', err.message);
      }
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('dsms_cached_user');
    try {
      sessionStorage.clear();
    } catch (e) {}
    invalidateCache();
    setUser(null);
    setIsAuthLoading(false);
    setLoading(false);
    window.location.href = '/login';
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const next = prev ? { ...prev, ...updatedData } : updatedData;
      try {
        localStorage.setItem('dsms_cached_user', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      updateUser, 
      login, 
      register, 
      verifyOtp, 
      resendOtp, 
      logout, 
      loading, 
      isAuthLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
