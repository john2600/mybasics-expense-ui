import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '../services/api';
import { authApi } from '../services/authApi';
import type { AuthSession, LoginPayload } from '../types';

/**
 * Solo recuerda que había sesión para no parpadear al login en cada recarga.
 * La sesión real es la cookie `session`; si el backend la rechaza, el 401
 * limpia esto automáticamente.
 */
const STORAGE_KEY = 'mybasics.auth';

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(readStoredSession);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  // Un 401 en cualquier endpoint protegido significa que la sesión caducó o
  // se cerró desde otro sitio: devolvemos al login sin esperar a que el
  // usuario pulse nada.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    await authApi.login(payload);
    const next: AuthSession = { user: { email: payload.email.trim().toLowerCase() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Si el POST falla (red caída, sesión ya muerta) igual cerramos en
      // cliente: dejar la UI dentro sería peor que un logout local.
    } finally {
      setIsLoggingOut(false);
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: !!session, isLoggingOut, login, logout }),
    [session, isLoggingOut, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
