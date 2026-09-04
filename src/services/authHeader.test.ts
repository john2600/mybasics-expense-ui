import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, setAuthToken, setUnauthorizedHandler, UnauthorizedError } from './api';
import { authApi } from './authApi';

/** Respuesta con el envoltorio `{ data }` del backend. */
function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), { status });
}

function unauthorized(error: string) {
  return new Response(JSON.stringify({ error }), { status: 401 });
}

let fetchMock: ReturnType<typeof vi.fn>;

/** Última llamada a `fetch`. El body de una `Response` solo se lee una vez, así
 *  que los mocks se construyen con una fábrica: devolver siempre la misma
 *  instancia rompe en la segunda petición. */
function lastCall(): [string, RequestInit | undefined] {
  const calls = fetchMock.mock.calls;
  return calls[calls.length - 1] as [string, RequestInit | undefined];
}

function sentHeaders(): Record<string, string> {
  return (lastCall()?.[1]?.headers ?? {}) as Record<string, string>;
}

function calledUrl(): string {
  return String(lastCall()?.[0]);
}

beforeEach(() => {
  fetchMock = vi.fn(() => Promise.resolve(ok([])));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  setAuthToken(null);
  setUnauthorizedHandler(null);
  vi.unstubAllGlobals();
});

describe('token en las peticiones', () => {
  it('manda Authorization: Bearer cuando hay token', async () => {
    setAuthToken('ABC123');
    await api.getCategories();

    expect(sentHeaders().Authorization).toBe('Bearer ABC123');
  });

  it('no manda Authorization sin token, en vez de mandar "Bearer null"', async () => {
    setAuthToken(null);
    await api.getCategories();

    expect(sentHeaders()).not.toHaveProperty('Authorization');
  });

  it('deja de mandarlo tras limpiar la sesión', async () => {
    setAuthToken('ABC123');
    await api.getCategories();
    setAuthToken(null);
    await api.getCategories();

    expect(sentHeaders()).not.toHaveProperty('Authorization');
  });

  it('ya no envía la cookie: el esquema de sesión quedó deprecado', async () => {
    setAuthToken('ABC123');
    await api.getCategories();

    // `credentials: 'include'` con `Allow-Origin: *` haría que el navegador
    // rechazara la respuesta; el token viaja en la cabecera.
    expect(lastCall()?.[1]).not.toHaveProperty('credentials');
  });
});

describe('rutas de autenticación', () => {
  it('el login pega a /tokens/authentication, no al legacy /user/login', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(ok({ authentication_token: { token: 'T', expiry: 'x' } }, 201)));
    await authApi.login({ email: 'john@example.com', password: 'supersecret' });

    expect(calledUrl()).toContain('/tokens/authentication');
    expect(calledUrl()).not.toContain('/user/login');
  });

  it('el logout pega a /tokens/logout, no al legacy /user/logout', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(ok('logged out')));
    await authApi.logout();

    expect(calledUrl()).toContain('/tokens/logout');
    expect(calledUrl()).not.toContain('/user/logout');
  });

  it('la activación manda el token escapado en la query', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(ok('account activated')));
    await authApi.activate('a b+c');

    expect(calledUrl()).toContain('/user/activate?token=a%20b%2Bc');
  });
});

describe('401 y cierre de sesión', () => {
  it('un 401 en endpoint protegido dispara el cierre de sesión', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockImplementation(() => Promise.resolve(unauthorized('invalid or missing authentication token')));

    await expect(api.getCategories()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('un 401 al hacer login NO cierra sesión: son credenciales malas', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockImplementation(() => Promise.resolve(unauthorized('invalid email or password')));

    await expect(
      authApi.login({ email: 'john@example.com', password: 'mala' }),
    ).rejects.toThrow('invalid email or password');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('un 401 al registrarse tampoco cierra sesión', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockImplementation(() => Promise.resolve(unauthorized('nope')));

    await expect(
      authApi.register({ username: 'j', name: 'J', email: 'j@e.com', password: 'supersecret' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('propaga el mensaje del backend en el error', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(unauthorized('not authenticated')));

    await expect(api.getCategories()).rejects.toThrow('not authenticated');
  });
});
