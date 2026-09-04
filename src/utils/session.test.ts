import { describe, expect, it } from 'vitest';
import { isExpired, parseStoredSession, sessionFromToken } from './session';
import type { AuthSession } from '../types';

const NOW = Date.parse('2026-09-03T12:00:00Z');
const IN_AN_HOUR = '2026-09-03T13:00:00Z';
const AN_HOUR_AGO = '2026-09-03T11:00:00Z';

function session(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    token: 'BF64UCB4USI5Y4U2ZJAHAZM5IA',
    expiry: IN_AN_HOUR,
    user: { email: 'john@example.com' },
    ...overrides,
  };
}

describe('isExpired', () => {
  it('acepta un token todavía vigente', () => {
    expect(isExpired(IN_AN_HOUR, NOW)).toBe(false);
  });

  it('rechaza un token pasado de fecha', () => {
    expect(isExpired(AN_HOUR_AGO, NOW)).toBe(true);
  });

  it('trata como caducado el token que expira justo ahora', () => {
    expect(isExpired('2026-09-03T12:00:00Z', NOW)).toBe(true);
  });

  it('no caduca sin fecha: que decida el servidor', () => {
    // Cerrar la sesión por un campo ausente echaría al usuario sin motivo.
    expect(isExpired(undefined, NOW)).toBe(false);
  });

  it('no caduca con una fecha ilegible', () => {
    expect(isExpired('mañana', NOW)).toBe(false);
  });
});

describe('sessionFromToken', () => {
  const response = {
    authentication_token: { token: 'ABC123', expiry: IN_AN_HOUR },
  };

  it('extrae token y caducidad del envoltorio del API', () => {
    const result = sessionFromToken(response, 'john@example.com');

    expect(result.token).toBe('ABC123');
    expect(result.expiry).toBe(IN_AN_HOUR);
  });

  it('guarda el email usado para entrar, que no viene en la respuesta', () => {
    expect(sessionFromToken(response, 'john@example.com').user.email).toBe('john@example.com');
  });

  it('normaliza el email igual que el backend', () => {
    expect(sessionFromToken(response, '  John@Example.COM  ').user.email).toBe('john@example.com');
  });
});

describe('parseStoredSession', () => {
  it('restaura una sesión vigente', () => {
    const result = parseStoredSession(JSON.stringify(session()), NOW);

    expect(result?.token).toBe('BF64UCB4USI5Y4U2ZJAHAZM5IA');
    expect(result?.user.email).toBe('john@example.com');
  });

  it('descarta la sesión con el token caducado', () => {
    // Restaurarla llevaría al usuario al dashboard para echarlo al primer 401.
    const stored = JSON.stringify(session({ expiry: AN_HOUR_AGO }));

    expect(parseStoredSession(stored, NOW)).toBeNull();
  });

  it('descarta la sesión sin token', () => {
    const stored = JSON.stringify({ expiry: IN_AN_HOUR, user: { email: 'john@example.com' } });

    expect(parseStoredSession(stored, NOW)).toBeNull();
  });

  it('descarta la sesión del esquema anterior por cookie', () => {
    // Antes se guardaba solo { user: { email } }, sin token: sirve de nada.
    const stored = JSON.stringify({ user: { email: 'john@example.com' } });

    expect(parseStoredSession(stored, NOW)).toBeNull();
  });

  it('devuelve null sin nada guardado', () => {
    expect(parseStoredSession(null, NOW)).toBeNull();
  });

  it('no revienta con JSON corrupto', () => {
    expect(parseStoredSession('{roto', NOW)).toBeNull();
  });
});
