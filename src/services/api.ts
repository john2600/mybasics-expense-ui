const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }

  return json.data as T;
}

async function downloadExport(format: string, months: number): Promise<{ blob: Blob; filename: string }> {
  const qs = new URLSearchParams({ format, months: String(months) });
  const res = await fetch(`${BASE_URL}/reports/export?${qs}`);
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
  getExpenses: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('../types').Movement[]>(`/movements/expenses${qs}`);
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
