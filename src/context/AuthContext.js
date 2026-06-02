import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../services/notificationService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'user']).then(([[, tok], [, usr]]) => {
      if (tok) {
        setToken(tok);
        notificationService.registerPushToken(tok).catch(err =>
          console.error('[Auth] Erreur enregistrement push token:', err)
        );
      }
      if (usr) setUser(JSON.parse(usr));
    }).finally(() => setLoading(false));
  }, []);

  async function login(tokenVal, userData) {
    await AsyncStorage.multiSet([['token', tokenVal], ['user', JSON.stringify(userData)]]);
    setToken(tokenVal);
    setUser(userData);
    notificationService.registerPushToken(tokenVal).catch(err =>
      console.error('[Auth] Erreur enregistrement push token:', err)
    );
  }

  async function logout() {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
