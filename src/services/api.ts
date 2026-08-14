// Relativa por defecto: el proxy de Vite la reenvía al API sin CORS, para que
// la cookie de sesión viaje como first-party (ver vite.config.ts).
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/** Error de un endpoint protegido sin sesión válida (401). */
export class UnauthorizedError extends Error {
  constructor(message = 'not authenticated') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Rutas públicas que también responden 401: en `/user/login` un 401 significa
 * credenciales inválidas, no una sesión caducada, así que no debe disparar el
 * cierre de sesión global.
 */
const PUBLIC_PATHS = ['/user', '/user/login'];

let onUnauthorized: (() => void) | null = null;

/** Registra qué hacer cuando el backend rechaza la sesión. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    // La sesión viaja en la cookie `session` (HttpOnly), no en un header.
    credentials: 'include',
    ...options,
  });

  if (res.status === 401) {
    const json = await res.json().catch(() => ({}));
    if (!PUBLIC_PATHS.includes(path.split('?')[0])) onUnauthorized?.();
    throw new UnauthorizedError((json as { error?: string }).error || 'not authenticated');
  }

  if (res.status === 204) return undefined as T;

  // No todo lo que devuelve el API es JSON: el 404 del router de chi es texto
  // plano, y parsearlo a ciegas enterraba el error real bajo un fallo de JSON.
  const body = await res.text();
  let json: { data?: unknown; error?: string } = {};

  if (body) {
    try {
      json = JSON.parse(body);
    } catch {
      throw new Error(
        res.ok ? 'El servidor devolvió una respuesta no válida' : `HTTP ${res.status}: ${body.slice(0, 120)}`,
      );
    }
  }

  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }

  return json.data as T;
}

export { request };

/**
 * Normaliza la respuesta de `/movements/expenses` a `ExpenseList`.
 *
 * El endpoint devolvía un `Movement[]` plano y ahora devuelve
 * `{ total, movements }`. Aceptamos ambas formas porque una instancia del API
 * anterior al cambio sigue sirviendo la vieja, y ahí el total se suma en
 * cliente. **Se puede borrar en cuanto todos los entornos estén al día**; el
 * total autoritativo es el del servidor.
 */
export function normalizeExpenseList(
  payload: import('../types').ExpenseList | import('../types').Movement[] | null | undefined,
): import('../types').ExpenseList {
  if (!payload) return { total: 0, movements: [] };

  if (Array.isArray(payload)) {
    return {
      total: payload.reduce((sum, m) => sum + m.amount, 0),
      movements: payload,
    };
  }

  return {
    total: payload.total ?? 0,
    movements: payload.movements ?? [],
  };
}

async function downloadExport(format: string, months: number): Promise<{ blob: Blob; filename: string }> {
  const qs = new URLSearchParams({ format, months: String(months) });
  const res = await fetch(`${BASE_URL}/reports/export?${qs}`, { credentials: 'include' });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const ext = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'json';
  return { blob, filename: `expenses_export.${ext}` };
}

export const api = {
  // Categories
  getCategories: () => request<import('../types').Category[]>('/categories'),
  getCategory: (id: number) => request<import('../types').Category>(`/categories/${id}`),
  createCategory: (payload: import('../types').CategoryCreateRequest) =>
    request<import('../types').Category>('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: number, payload: import('../types').CategoryUpdateRequest) =>
    request<import('../types').Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),

  // Movements
  getMovements: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('../types').GroupedByCategory[]>(`/movements${qs}`);
  },
  getExpenses: async (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const data = await request<import('../types').ExpenseList | import('../types').Movement[]>(
      `/movements/expenses${qs}`,
    );
    return normalizeExpenseList(data);
  },
  getMovementsSummary: () => request<import('../types').MonthlySummary[]>('/movements/summary'),
  getMovement: (id: number) => request<import('../types').Movement>(`/movements/${id}`),
  createMovement: (payload: import('../types').CreateMovementPayload) =>
    request<import('../types').Movement>('/movements', { method: 'POST', body: JSON.stringify(payload) }),
  updateMovement: (id: number, payload: import('../types').UpdateMovementPayload) =>
    request<import('../types').Movement>(`/movements/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMovement: (id: number) => request<void>(`/movements/${id}`, { method: 'DELETE' }),

  // Balance
  getBalance: (params?: { date_from?: string; date_to?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<import('../types').BalanceSummary>(`/balance${qs}`);
  },

  // Balance periods (carry-over)
  getBalancePeriods: () => request<import('../types').BalancePeriod[]>('/balance/periods'),

  // Income config
  getIncomeConfig: () => request<import('../types').IncomeConfig>('/incomes/config'),
  updateIncomeConfig: (payload: Partial<import('../types').IncomeConfig>) =>
    request<import('../types').IncomeConfig>('/incomes/config', { method: 'PUT', body: JSON.stringify(payload) }),

  // Reports
  getExportJson: (months: number) => {
    const qs = new URLSearchParams({ format: 'json', months: String(months) });
    return request<import('../types').ExportReport>(`/reports/export?${qs}`);
  },
  downloadExport: (format: string, months: number) => downloadExport(format, months),
};
