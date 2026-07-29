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
  username: string;
  name: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  username: string;
  password: string;
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
