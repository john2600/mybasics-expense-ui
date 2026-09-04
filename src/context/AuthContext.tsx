import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthToken, setUnauthorizedHandler } from '../services/api';
import { authApi } from '../services/authApi';
import { parseStoredSession, sessionFromToken } from '../utils/session';
import type { AuthSession, LoginPayload } from '../types';

/**
 * Con tokens el `localStorage` deja de ser una pista y pasa a guardar la
 * credencial: es lo que se manda en `Authorization` en cada petición.
 */
const STORAGE_KEY = 'mybasics.auth';

const readStoredSession = (): AuthSession | null =>
  parseStoredSession(localStorage.getItem(STORAGE_KEY));

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// El token debe estar puesto antes del primer render: si no, las queries que
// disparan los hijos al montar saldrían sin cabecera y morirían con un 401.
const initialSession = readStoredSession();
setAuthToken(initialSession?.token ?? null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  // Un 401 en cualquier endpoint protegido significa token caducado o revocado
  // (p. ej. un logout desde otro dispositivo, que borra todos los tokens):
  // devolvemos al login sin esperar a que el usuario pulse nada.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const email = payload.email.trim().toLowerCase();
    const response = await authApi.login({ ...payload, email });
    const next = sessionFromToken(response, email);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuthToken(next.token);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Si la llamada falla (red caída, token ya muerto) igual cerramos en
      // cliente: dejar la UI dentro sería peor que un logout solo local.
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
