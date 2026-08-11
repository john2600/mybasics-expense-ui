import { request } from './api';
import type { ChangePasswordPayload, LoginPayload, RegisterPayload } from '../types';

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

  /**
   * Cambia la contraseña del usuario en sesión. Requiere sesión, y además la
   * contraseña actual en el body: el servidor la verifica antes de aplicar el
   * cambio. Devuelve "password updated"; cualquier fallo es un `400`.
   *
   * No aparece en el README del backend: el contrato sale de
   * `internal/users/handler.go` + `model.go`.
   */
  changePassword: (payload: ChangePasswordPayload) =>
    request<string>('/change_password', { method: 'POST', body: JSON.stringify(payload) }),
};

/**
 * Traduce los errores de `/change_password` a algo presentable.
 *
 * El servidor envuelve el error de bcrypt y devuelve cadenas como
 * `password not coincidences  crypto/bcrypt: hashedPassword is not the hash of
 * the given password`, que no se le pueden enseñar a un usuario.
 */
export function friendlyChangePasswordError(message: string): string {
  if (message.includes('password not coincidences')) {
    return 'La contraseña actual no es correcta.';
  }
  if (message.includes('must be different')) {
    return 'La nueva contraseña debe ser distinta de la actual.';
  }
  if (message.includes('sql: no rows') || message.includes('Error updating password')) {
    return 'No se pudo actualizar la contraseña. Vuelve a iniciar sesión e inténtalo de nuevo.';
  }
  return message;
}
