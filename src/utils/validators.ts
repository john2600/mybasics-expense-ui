import type { RegisterPayload } from '../types';

export const PASSWORD_MIN_LENGTH = 8;
/** Tope de bcrypt en el backend. */
export const PASSWORD_MAX_LENGTH = 72;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normaliza el payload igual que el backend: username y email a minúsculas
 * con trim, name solo con trim. La contraseña se envía tal cual.
 */
export function normalizeRegisterPayload(payload: RegisterPayload): RegisterPayload {
  return {
    username: payload.username.trim().toLowerCase(),
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
  };
}

/**
 * Réplica en cliente de las validaciones de POST /user, en el mismo orden y
 * con los mismos mensajes que devuelve el backend, para que el usuario vea
 * siempre el mismo texto lo valide quien lo valide.
 *
 * Devuelve el mensaje de error, o null si el payload es válido.
 */
export function validateRegisterPayload(payload: RegisterPayload): string | null {
  const { username, name, email, password } = normalizeRegisterPayload(payload);

  if (!username) return 'username es obligatorio';
  if (!name) return 'name es obligatorio';
  if (!email) return 'email es obligatorio';
  if (!EMAIL_REGEX.test(email)) return 'email inválido';
  if (!password) return 'password es obligatorio';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `password debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `password no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`;
  }

  return null;
}

/**
 * Validación en cliente del cambio de contraseña.
 *
 * Refleja las reglas de `ChangePasswordRequest.Validate()` del backend, pero con
 * mensajes presentables: los del servidor llegan mezclando idiomas y con el
 * error de bcrypt pegado detrás, así que aquí no se copian literalmente como sí
 * se hace en el registro.
 *
 * `confirmation` es solo de cliente — el backend no la conoce; evita quedarse
 * fuera por una errata en la contraseña nueva.
 */
export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmation: string,
): string | null {
  if (!currentPassword) return 'Ingresa tu contraseña actual.';
  if (currentPassword.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña actual debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!newPassword) return 'Ingresa la nueva contraseña.';
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (newPassword.length > PASSWORD_MAX_LENGTH) {
    return `La nueva contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres.`;
  }
  if (newPassword === currentPassword) {
    return 'La nueva contraseña debe ser distinta de la actual.';
  }
  if (confirmation !== newPassword) return 'Las contraseñas no coinciden.';

  return null;
}
