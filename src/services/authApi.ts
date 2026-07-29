import type { AuthSession, LoginPayload, RegisterPayload } from '../types';
import { normalizeRegisterPayload, validateRegisterPayload } from '../utils/validators';

/**
 * Backend de autenticación simulado.
 *
 * Reglas del mock:
 *  - login: cualquier usuario/contraseña no vacíos inician sesión. El usuario
 *    `error` siempre falla, para poder probar el mensaje de error.
 *  - register: valida igual que POST /user y rechaza los usuarios/emails ya
 *    "registrados" imitando el error de clave duplicada de MySQL.
 *
 * Para conectar el backend real basta con reemplazar el cuerpo de cada método
 * por una llamada al endpoint, manteniendo la misma firma:
 *   login:    request<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
 *   register: request<string>('/user', { method: 'POST', body: JSON.stringify(payload) })
 * `request` ya desenvuelve el Envelope { data, error } y lanza con `error`.
 */

const MOCK_LATENCY_MS = 600;

/** Único usuario que el mock rechaza al iniciar sesión. */
export const MOCK_INVALID_USERNAME = 'error';

/** Usuarios y emails "ya existentes" en la BD simulada. */
const TAKEN_USERNAMES = ['john', 'admin'];
const TAKEN_EMAILS = ['john@example.com'];

const INVALID_CREDENTIALS_MESSAGE = 'Usuario o contraseña incorrectos';

/** Imita el error crudo de MySQL que el backend devuelve dentro del 400. */
function duplicateKeyError(value: string, key: string): Error {
  return new Error(`Error 1062 (23000): Duplicate entry '${value}' for key '${key}'`);
}

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

/** Resuelve con el `data` del 201: la cadena "user created". */
function mockRegister(payload: RegisterPayload): Promise<string> {
  const normalized = normalizeRegisterPayload(payload);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const validationError = validateRegisterPayload(normalized);
      if (validationError) {
        reject(new Error(validationError));
        return;
      }

      if (TAKEN_USERNAMES.includes(normalized.username)) {
        reject(duplicateKeyError(normalized.username, 'users.username'));
        return;
      }
      if (TAKEN_EMAILS.includes(normalized.email)) {
        reject(duplicateKeyError(normalized.email, 'users.email'));
        return;
      }

      // La BD simulada solo vive en memoria: se pierde al recargar.
      TAKEN_USERNAMES.push(normalized.username);
      TAKEN_EMAILS.push(normalized.email);

      resolve('user created');
    }, MOCK_LATENCY_MS);
  });
}

export const authApi = {
  login: (payload: LoginPayload) => mockLogin(payload),
  register: (payload: RegisterPayload) => mockRegister(payload),
};
