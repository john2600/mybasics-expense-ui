import { request } from './api';
import type { LoginPayload, RegisterPayload } from '../types';

/**
 * Autenticación contra el API real.
 *
 * El backend usa sesiones de servidor (cookie `session`, HttpOnly, store en
 * MySQL vía scs). No hay token que guardar: la sesión la mantiene el navegador
 * y `request` envía la cookie con `credentials: 'include'`.
 *
 * Las tres respuestas traen una cadena en `data`:
 *   POST /user         -> 201 "user created"
 *   POST /user/login   -> 200 "login successful"   (+ Set-Cookie: session)
 *   POST /user/logout  -> 200 "logout successful"  (destruye esa sesión)
 */
export const authApi = {
  /** Login por email, no por username. Credenciales inválidas → 401. */
  login: (payload: LoginPayload) =>
    request<string>('/user/login', { method: 'POST', body: JSON.stringify(payload) }),

  register: (payload: RegisterPayload) =>
    request<string>('/user', { method: 'POST', body: JSON.stringify(payload) }),

  /**
   * Cierra únicamente la sesión de esta cookie: si el mismo usuario tiene
   * sesión abierta en otro dispositivo, esa sigue viva. Sin sesión → 401.
   */
  logout: () => request<string>('/user/logout', { method: 'POST' }),
};
