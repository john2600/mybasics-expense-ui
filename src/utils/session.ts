import type { AuthSession, AuthTokenResponse } from '../types';

/**
 * ¿Caducó ya el token? Los tokens duran 24 h; comprobarlo en cliente evita
 * disparar una petición que sabemos que va a devolver 401.
 *
 * Sin `expiry` devuelve `false`: preferimos dejar que el servidor decida antes
 * que cerrar la sesión de alguien por un campo que falta.
 */
export function isExpired(expiry: string | undefined, now: number = Date.now()): boolean {
  if (!expiry) return false;
  const at = Date.parse(expiry);
  return Number.isFinite(at) && at <= now;
}

/**
 * Convierte la respuesta de `POST /tokens/authentication` en la sesión que
 * guardamos. El email no viene en la respuesta: es el que se usó para entrar.
 */
export function sessionFromToken(response: AuthTokenResponse, email: string): AuthSession {
  return {
    token: response.authentication_token.token,
    expiry: response.authentication_token.expiry,
    user: { email: email.trim().toLowerCase() },
  };
}

/**
 * Lee la sesión persistida y descarta la que ya no sirve: sin token, con token
 * caducado o con JSON corrupto. Devolver `null` equivale a "no hay sesión".
 */
export function parseStoredSession(raw: string | null, now: number = Date.now()): AuthSession | null {
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session?.token || isExpired(session.expiry, now)) return null;
    return session;
  } catch {
    return null;
  }
}
