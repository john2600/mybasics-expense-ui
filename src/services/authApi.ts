import type { AuthSession, LoginPayload } from '../types';

/**
 * Backend de autenticación simulado.
 *
 * Reglas del mock:
 *  - Cualquier usuario/contraseña no vacíos inician sesión.
 *  - El usuario `error` siempre falla, para poder probar el mensaje de error.
 *
 * Para conectar el backend real basta con reemplazar el cuerpo de `login`
 * por una llamada al endpoint, manteniendo la misma firma:
 *   login: (payload) => request<AuthSession>('/auth/login', {
 *     method: 'POST', body: JSON.stringify(payload),
 *   })
 */

const MOCK_LATENCY_MS = 600;

/** Único usuario que el mock rechaza. */
export const MOCK_INVALID_USERNAME = 'error';

const INVALID_CREDENTIALS_MESSAGE = 'Usuario o contraseña incorrectos';

function mockLogin({ username, password }: LoginPayload): Promise<AuthSession> {
  const user = username.trim();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!user || !password || user.toLowerCase() === MOCK_INVALID_USERNAME) {
        reject(new Error(INVALID_CREDENTIALS_MESSAGE));
        return;
      }

      resolve({
        token: `mock-token-${Date.now()}`,
        user: { username: user, name: user },
      });
    }, MOCK_LATENCY_MS);
  });
}

export const authApi = {
  login: (payload: LoginPayload) => mockLogin(payload),
};
