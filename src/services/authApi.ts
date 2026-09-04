import { request } from './api';
import type {
  AuthTokenResponse,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
} from '../types';

/**
 * Autenticación por token (`Authorization: Bearer <token>`).
 *
 * Sustituye al esquema anterior de cookie de sesión (`/user/login` y
 * `/user/logout`), que sigue existiendo en el backend pero está **deprecado**:
 * los endpoints protegidos ya validan el token, no la cookie. No usar esas dos
 * rutas.
 *
 *   POST /user                    -> 201 "user created"
 *   GET  /user/activate?token=…   -> 200 "account activated"
 *   POST /tokens/authentication   -> 201 { authentication_token: { token, expiry } }
 *   POST /tokens/logout           -> 200 "logged out"
 */
export const authApi = {
  /**
   * Login: canjea email + password por un token de 24 h. Credenciales
   * inválidas → 401 "invalid email or password" (el mismo mensaje para email
   * inexistente y password incorrecta, para no revelar qué cuentas existen).
   */
  login: (payload: LoginPayload) =>
    request<AuthTokenResponse>('/tokens/authentication', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Registro. Emite además un token de activación (3 días) y manda el correo
   * de bienvenida. Duplicados → 400 "username or email already in use".
   */
  register: (payload: RegisterPayload) =>
    request<string>('/user', { method: 'POST', body: JSON.stringify(payload) }),

  /**
   * Activación desde el enlace del correo. Hoy **no** condiciona el login: un
   * usuario sin activar puede obtener token igualmente.
   */
  activate: (token: string) =>
    request<string>(`/user/activate?token=${encodeURIComponent(token)}`),

  /**
   * Logout: borra **todos** los tokens del usuario, no solo el de este
   * dispositivo — verificado contra el API, dos tokens del mismo usuario pasan
   * a 401 tras una sola llamada. Cerrar sesión aquí cierra la de todas partes.
   */
  logout: () => request<string>('/tokens/logout', { method: 'POST' }),

  /** Cambia la contraseña del usuario del token, re-verificando la actual. */
  changePassword: (payload: ChangePasswordPayload) =>
    request<string>('/change_password', { method: 'POST', body: JSON.stringify(payload) }),
};

/**
 * Traduce los errores de `/change_password` a algo presentable.
 *
 * El servidor envuelve el fallo de bcrypt y devuelve cadenas como
 * `password not coincidences  models: invalid credentials`, que no se le pueden
 * enseñar a un usuario.
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
