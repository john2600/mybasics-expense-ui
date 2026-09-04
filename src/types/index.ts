export type MovementType = 'E' | 'I';

export interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Movement {
  id: number;
  category_id: number;
  category: string;
  type: MovementType;
  amount: number;
  description: string;
  date: string;
  hour: string | null;
  transaction_type: string | null;
  mail_uid: number | null;
  mail_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupedByCategory {
  category: string;
  total: number;
  movements: Movement[];
}

/**
 * Respuesta de `GET /movements/expenses`: la lista plana de gastos más el
 * `total` de los gastos que casan con el filtro aplicado.
 *
 * El backend lo suma en memoria sobre esa misma lista, así que `total` siempre
 * corresponde a `movements` — sin filtro es el total de todos los gastos; con
 * `category_id` o rango de fechas, el de ese subconjunto.
 */
export interface ExpenseList {
  total: number;
  movements: Movement[];
}

export interface MonthlySummary {
  year: number;
  month: number;
  total: number;
}

export interface IncomeConfig {
  amount: number;
  cut_day: number;
  description: string;
  updated_at: string;
}

export interface BalancePeriod {
  period_start: string;
  period_end: string;
  fixed_income: number;
  registered_incomes: number;
  total_income: number;
  expenses: number;
  carry_over_in: number;
  balance: number;
  carry_over_out: number;
  deficit: number;
}

export interface BalanceSummary {
  expenses: number;
  incomes: number;
  balance: number;
  carry_over: number;
  income_config: IncomeConfig;
}

export interface AuthUser {
  email: string;
}

/** `authentication_token` que devuelve `POST /tokens/authentication`. */
export interface AuthToken {
  token: string;
  /** Caducidad en ISO-8601. El backend los emite con 24 h de vida. */
  expiry: string;
}

/** Envoltorio del `data` de `POST /tokens/authentication`. */
export interface AuthTokenResponse {
  authentication_token: AuthToken;
}

/**
 * La sesión del cliente.
 *
 * A diferencia del esquema anterior por cookie `HttpOnly`, aquí el token **sí**
 * es accesible desde JS: hay que ponerlo en `Authorization` en cada petición.
 * Por eso esto es la fuente de verdad de la sesión, no una simple pista para
 * evitar el parpadeo al recargar.
 */
export interface AuthSession {
  token: string;
  expiry: string;
  user: AuthUser;
}

/** El backend autentica por email, no por username. */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Body de POST /change_password. El backend anida las credenciales actuales
 * bajo `login_request` y espera la nueva en la raíz — no es un objeto plano.
 */
export interface ChangePasswordPayload {
  login_request: LoginPayload;
  new_password: string;
}

/** Body de POST /user. El backend espera exactamente estas claves. */
export interface RegisterPayload {
  username: string;
  name: string;
  email: string;
  password: string;
}

export interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}

// UI types
export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export interface CreateMovementPayload {
  category_id: number;
  type: MovementType;
  amount: number;
  description: string;
  date: string;
  hour?: string;
}

export interface UpdateMovementPayload {
  category_id?: number;
  type?: MovementType;
  amount?: number;
  description?: string;
  date?: string;
  hour?: string;
}

export interface ReportMonthlySummary {
  year: number;
  month: number;
  label: string;
  total: number;
}

export interface ExportRow {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface ExportReport {
  period_from: string;
  period_to: string;
  total: number;
  monthly_summary: ReportMonthlySummary[];
  expenses: ExportRow[];
}

export type ExportFormat = 'json' | 'csv' | 'pdf';

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface CategoryUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
}
