import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';
import { request, setSession } from '../api/client';
import { resetPharmacy } from '../screens/Pharmacy/pharmacyData';
import { clearRememberedCredentials, saveRememberedCredentials } from './rememberedCredentials';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const clear = (reason = '') => {
    setSession(null);
    resetPharmacy();
    setUser(null);
    setMessage(reason);
  };
  const login = async (email, password, remember = true) => {
    const result = await request('/login', {
      method: 'POST',
      authenticated: false,
      body: {
        email: email.trim(),
        password,
        sessionMeta: { platform: Platform.OS, deviceName: 'MD Tracker mobile' },
      },
    });
    if (!result.access_token) {
      throw new Error('The server did not return a login token.');
    }
    setSession(result.access_token, () =>
      clear('Your session has expired. Please sign in again.'),
    );
    try {
      const profile = await request('/user');
      let rememberError = null;
      try {
        if (remember) {
          await saveRememberedCredentials(email, password);
        } else {
          await clearRememberedCredentials();
        }
      } catch (error) {
        rememberError = error;
      }
      setMessage('');
      setUser(profile);
      return rememberError;
    } catch (error) {
      clear();
      throw error;
    }
  };
  const logout = async () => {
    try {
      await request('/logout', { method: 'POST' });
    } finally {
      clear();
    }
  };
  return (
    <AuthContext.Provider value={{ user, message, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
