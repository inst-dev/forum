'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clientApi } from '@/lib/api';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await clientApi.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await clientApi.post('/auth/login', { email, password });
    if (res.success) {
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const register = async (data) => {
    const res = await clientApi.post('/auth/register', data);
    if (res.success) {
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = async () => {
    await clientApi.post('/auth/logout');
    setUser(null);
    window.location.href = '/';
  };

  const refresh = async () => {
    const res = await clientApi.post('/auth/refresh');
    if (res.success) {
      await fetchUser();
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
