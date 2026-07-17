# myexpenses-ui — Especificación completa del sistema

Este documento es una especificación de ingeniería inversa del sistema de control de gastos personales **myexpenses-ui**. Su propósito es permitir recrear el sistema completo desde cero.

---

## Visión general

Aplicación web de finanzas personales con las siguientes características:

- Registro y visualización de gastos e ingresos por período de corte configurable
- Balance por período con soporte de carry-over (lo que sobró del período anterior)
- Dashboard con KPIs, gráficas y listas de movimientos
- Exportación de reportes en JSON, CSV y PDF
- CRUD completo de categorías
- Configuración del ingreso fijo mensual y día de corte

El frontend consume una API REST en Go. No hay autenticación en el cliente (el backend maneja acceso).

---

## Stack tecnológico

### Frontend (este repo)

| Herramienta | Versión | Rol |
|---|---|---|
| React | 18.3 | UI |
| TypeScript | 5.5 | Tipado |
| Vite | 5.4 | Build + dev server |
| TanStack Query v5 | 5.56 | Server state |
| Recharts | 2.12 | Gráficas |
| Tailwind CSS | 3.4 | Estilos |
| date-fns | 3.6 | Formateo de fechas |

### Backend (repositorio separado)

API REST en Go. URL configurada en `VITE_API_URL` (default: `http://localhost:8082/api/v1`).

---

## Comandos

```bash
npm run dev        # dev server en http://localhost:5173
npm run build      # type-check + vite build
npm run lint       # eslint sin warnings
npm run preview    # sirve dist/ localmente
npx tsc --noEmit   # solo type-check
```

Copiar `.env.example` a `.env` y ajustar `VITE_API_URL` si el backend corre en otro host.

**No hay tests configurados.**

---

## Arquitectura del frontend

### Navegación

Sin router. `App.tsx` tiene un `useState<string>` llamado `page` que vale `'dashboard'`, `'movements'`, `'reports'`, `'categories'` o `'settings'`. Un `switch` en `renderPage()` retorna la página correspondiente.

```tsx
// App.tsx — patrón completo
const [page, setPage] = useState('dashboard');
// ...
<MainLayout activePage={page} onNavigate={setPage}>
  {renderPage()}
</MainLayout>
```

`MainLayout` recibe `onNavigate` y lo pasa a `Sidebar`. `Sidebar` llama `onNavigate(id)` al hacer click en cada ítem de nav.

### Layout

```
┌─────────────────────────────┐
│ Header (h-14, fixed top)    │
├──────────┬──────────────────┤
│ Sidebar  │  main content    │
│ (w-56)   │  pt-14 lg:pl-56  │
│ fixed    │  p-4 md:p-6      │
│ lg:show  │  max-w-7xl       │
└──────────┴──────────────────┘
```

- Mobile: sidebar oculto, botón hamburguesa en Header lo abre con overlay
- Desktop (lg+): sidebar siempre visible, main tiene `lg:pl-56`

### Estado del servidor

Todo va por **TanStack Query v5**. El `QueryClient` vive en `App.tsx`:

```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});
```

### Capa HTTP

`src/services/api.ts` es el único lugar que llama `fetch`. El wrapper `request<T>` desenvuelve el envelope `{ data, error }` del backend y lanza en no-2xx.

```ts
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data as T;
}
```

Para descargas (CSV/PDF) hay un `downloadExport()` separado que usa `res.blob()` en vez de `res.json()`.

Ningún componente llama `fetch` directamente.

---

## Lógica del período de corte (billing period)

El backend tiene un `cut_day` configurable (1–28) guardado en `IncomeConfig`. Todos los rangos de fechas usan el período `[cutDay del mes actual → cutDay-1 del mes siguiente]`.

```ts
// src/utils/formatters.ts
export function getCurrentPeriod(cutDay: number): { from: string; to: string }
export function getPreviousPeriod(cutDay: number): { from: string; to: string }
```

**`useDashboardData(customPeriod?)`** es el hook orquestador:
1. Obtiene `IncomeConfig` → extrae `cut_day`
2. Calcula `defaultPeriod` y `previousPeriod`
3. `activePeriod = customPeriod ?? defaultPeriod`
4. Dispara `useBalance` para período actual y anterior
5. Dispara `useMovementsSummary` (histórico mensual)
6. Retorna todo + flag `isLoading`

**Regla:** cualquier feature que necesite "período actual" debe usar `useDashboardData` o llamar `getCurrentPeriod`/`getPreviousPeriod` directamente. Nunca hardcodear límites de mes calendario.

---

## API contract

### Tipos clave

```ts
type MovementType = 'E' | 'I'  // E = Gasto, I = Ingreso — NO 'expense'/'income'
```

### Endpoints

| Método | Path | Respuesta |
|---|---|---|
| GET | `/categories` | `Category[]` |
| POST | `/categories` | `Category` |
| PUT | `/categories/:id` | `Category` |
| DELETE | `/categories/:id` | `204` |
| GET | `/movements?type=E&date_from=&date_to=` | `GroupedByCategory[]` |
| GET | `/movements/expenses?date_from=&date_to=` | `Movement[]` (flat, newest-first) |
| GET | `/movements/summary` | `MonthlySummary[]` (histórico mensual de gastos) |
| POST | `/movements` | `Movement` |
| PUT | `/movements/:id` | `Movement` |
| DELETE | `/movements/:id` | `204` |
| GET | `/balance?date_from=&date_to=` | `BalanceSummary` |
| GET | `/balance/periods` | `BalancePeriod[]` |
| GET | `/incomes/config` | `IncomeConfig` |
| PUT | `/incomes/config` | `IncomeConfig` |
| GET | `/reports/export?format=json\|csv\|pdf&months=N` | JSON o blob |

**Notas importantes:**
- `DELETE /movements/:id` retorna `204 No Content` (sin body)
- `GET /movements` retorna `GroupedByCategory[]` (movimientos anidados por categoría)
- `GET /movements/expenses` retorna `Movement[]` flat — usar esto para listas
- `BalanceSummary` embebe `income_config`; balance = `(income_config.amount + incomes) − expenses`
- `Category` no tiene campo `type` — las categorías son universales
- El envelope del backend es `{ data: T, error?: string }`

### Tipos TypeScript completos

```ts
export type MovementType = 'E' | 'I';

export interface Category {
  id: number; name: string; description: string;
  color: string; created_at: string; updated_at: string;
}

export interface Movement {
  id: number; category_id: number; category: string;
  type: MovementType; amount: number; description: string;
  date: string; hour: string | null; transaction_type: string | null;
  mail_uid: number | null; mail_message_id: string | null;
  created_at: string; updated_at: string;
}

export interface GroupedByCategory {
  category: string; total: number; movements: Movement[];
}

export interface MonthlySummary { year: number; month: number; total: number; }

export interface IncomeConfig {
  amount: number; cut_day: number; description: string; updated_at: string;
}

export interface BalancePeriod {
  period_start: string; period_end: string; fixed_income: number;
  registered_incomes: number; total_income: number; expenses: number;
  carry_over_in: number; balance: number; carry_over_out: number; deficit: number;
}

export interface BalanceSummary {
  expenses: number; incomes: number; balance: number;
  carry_over: number; income_config: IncomeConfig;
}

export interface CreateMovementPayload {
  category_id: number; type: MovementType; amount: number;
  description: string; date: string; hour?: string;
}

export interface UpdateMovementPayload {
  category_id?: number; type?: MovementType; amount?: number;
  description?: string; date?: string; hour?: string;
}

export interface CategoryCreateRequest { name: string; description?: string; color?: string; }
export interface CategoryUpdateRequest { name?: string; description?: string; color?: string; }

export interface ReportMonthlySummary { year: number; month: number; label: string; total: number; }
export interface ExportRow { id: number; date: string; category: string; description: string; amount: number; }
export interface ExportReport {
  period_from: string; period_to: string; total: number;
  monthly_summary: ReportMonthlySummary[]; expenses: ExportRow[];
}
export type ExportFormat = 'json' | 'csv' | 'pdf';
```

---

## Estructura de archivos

```
src/
├── App.tsx                          # QueryClient + navegación por useState
├── main.tsx                         # ReactDOM.createRoot
├── index.css                        # Tailwind directives
├── types/index.ts                   # Todos los tipos TypeScript
├── services/
│   └── api.ts                       # Único punto de acceso HTTP
├── utils/
│   └── formatters.ts                # formatCurrency, formatDate, getCurrentPeriod, etc.
├── hooks/
│   ├── useDashboardData.ts          # Orquesta incomeConfig + balance + summary
│   ├── useMovements.ts              # useMovements, useExpenses, useMovementsSummary, mutations
│   ├── useFinancialSummary.ts       # useBalance, useBalancePeriods, useIncomeConfig
│   └── useCategories.ts             # useCategories + mutations CRUD
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx           # Header + Sidebar + main wrapper
│   │   ├── Header.tsx               # Barra top fija, botón hamburguesa
│   │   └── Sidebar.tsx              # Nav lateral con 5 ítems
│   ├── common/
│   │   ├── Card.tsx                 # Wrapper con título y loading skeleton
│   │   ├── Button.tsx               # Botón con variantes + loading spinner
│   │   ├── Loading.tsx              # LoadingSpinner
│   │   └── ErrorMessage.tsx         # Mensaje de error
│   ├── charts/
│   │   ├── ExpensesByCategoryPieChart.tsx   # Donut + leyenda numerada 2 columnas
│   │   └── IncomeExpensesBarChart.tsx       # Bar chart ingresos vs gastos mensual
│   ├── dashboard/
│   │   ├── DailyMovements.tsx       # Lista de movimientos con scroll (max-h-96)
│   │   ├── MonthlyComparison.tsx    # Tabla comparación períodos (gastos/ingresos/balance)
│   │   ├── SummaryCards.tsx         # (legacy, no usado en dashboard actual)
│   │   └── CarryOverCards.tsx       # (legacy)
│   └── movements/
│       ├── MovementsList.tsx        # Página de movimientos completa con formulario
│       ├── AddMovementForm.tsx      # Formulario crear/editar movimiento
│       └── MovementItem.tsx         # Fila de un movimiento con edit/delete on hover
└── pages/
    ├── DashboardPage.tsx            # Página principal
    ├── SettingsPage.tsx             # Config ingreso fijo + día de corte
    ├── ReportsPage.tsx              # Exportar JSON/CSV/PDF
    └── CategoriesPage.tsx           # CRUD categorías
```

---

## Query keys

| Key | Hook |
|---|---|
| `['categories']` | `useCategories` |
| `['movements', params]` | `useMovements` |
| `['expenses', params]` | `useExpenses` |
| `['movements-summary']` | `useMovementsSummary` |
| `['balance', params]` | `useBalance` |
| `['balance-periods']` | `useBalancePeriods` |
| `['income-config']` | `useIncomeConfig` |

Todas las mutaciones de movimientos invalidan `['movements']`, `['expenses']` y `['balance']` en `onSuccess`. Las mutaciones de categorías invalidan `['categories']`. Actualizar `IncomeConfig` invalida `['income-config']` y `['balance']`.

---

## Páginas — detalle

### DashboardPage

Layout vertical con `space-y-5`:

1. **Header** — título izquierda, KPIs + filtro de fechas derecha
   - KPIs inline (`HeaderStat`): Ingresos del período, Gastos del período, Balance actual, Ingreso fijo (con toggle revelar/ocultar), Lo que te quedó
   - Filtro de fechas: dos `input[type=date]` + botón Aplicar + botón Restablecer (solo cuando hay filtro custom)

2. **Grid 3 columnas** — Ingresos vs Gastos (2/3) + Detalle mensual tabla (1/3)
   - Tabla: últimos 6 meses, columnas Mes / Ingresos / Gastos / Balance

3. **ExpensesByCategoryPieChart** — ancho completo

4. **Días seguidos sin gastos** — card blanca centrada con número grande
   - Fetch separado: `GET /movements/expenses?date_from=<30 días atrás>&date_to=<hoy>`
   - Cuenta hacia atrás desde hoy hasta el primer día con gastos

5. **DailyMovements "Gastos del período"** — ancho completo, con delete

6. **Grid 2 columnas** — DailyMovements "Ingresos del período" + MonthlyComparison

**Lógica de datos en DashboardPage:**
- `useDashboardData(customPeriod)` → balance, monthlySummary, períodos
- `useExpenses({ date_from, date_to })` → lista flat de gastos del período → `useMemo` agrupa por categoría para el donut
- `useMovements({ type: 'I', date_from, date_to })` → `GroupedByCategory[]` → `.flatMap(g => g.movements)` para lista de ingresos
- `useExpenses({ date_from: thirtyDaysAgo, date_to: today })` → para calcular racha sin gastos

```ts
// Cálculo del ingreso total
const fixedIncome = currentBalance?.income_config?.amount ?? 0;
const totalIncome = fixedIncome + (currentBalance?.incomes ?? 0);
const carryOver = currentBalance?.carry_over ?? 0;
```

### SettingsPage

Formulario con 3 campos: `amount` (número, COP), `cut_day` (1–28), `description`. `PUT /incomes/config`. Muestra "✓ Guardado" durante 2s tras guardar.

### ReportsPage

- Selector de período: 1, 3, 6, 12 meses
- Botón **Ver JSON** → `GET /reports/export?format=json&months=N` → muestra preview inline (resumen mensual + lista de gastos paginada)
- Botón **Descargar CSV** / **Descargar PDF** → `downloadExport('csv'|'pdf', months)` → `res.blob()` → crea URL temporal → `<a>.click()` → revoke

**Importante:** CSV y PDF no pasan por `request<T>()` porque el body no es JSON. Hay una función `downloadExport` separada en `api.ts`.

### CategoriesPage

- Lista de categorías con punto de color, nombre, descripción, botones editar/eliminar
- Formulario inline (debajo de la lista) para crear o editar:
  - Nombre (requerido)
  - Descripción (opcional)
  - Color: input text `#RRGGBB` + `input[type=color]` sincronizados
- Estado de modo: `{ type: 'list' } | { type: 'create' } | { type: 'edit'; category: Category }`
- Delete pide confirmación con `confirm()` nativo

---

## Componentes compartidos clave

### Card

```tsx
<Card title="Título" loading={boolean}>
  {children}
</Card>
```

Wrapper blanco con borde, sombra, título opcional. Cuando `loading=true` muestra skeleton.

### Button

```tsx
<Button
  variant="primary" | "secondary" | "danger"
  size="sm" | "md"
  loading={boolean}
  type="submit" | "button"
  onClick={fn}
>
  Texto
</Button>
```

### ExpensesByCategoryPieChart

- Recibe `data: GroupedByCategory[]` (ya agrupado y ordenado por total desc)
- Limita a top 20 categorías
- Layout flex: donut fijo `w-64` izquierda + leyenda 2 columnas derecha
- Donut con `innerRadius=82 outerRadius=126`, label central con Total + monto
- Leyenda numerada: número gris pequeño, cuadrado de color, nombre truncable, porcentaje
- Paleta de 20 colores hardcodeada

### IncomeExpensesBarChart

- Recibe `monthlySummary: MonthlySummary[]` + `currentBalance: BalanceSummary`
- Últimos 6 meses (`.slice(0,6).reverse()`)
- Ingresos = `currentBalance.income_config.amount` (fijo para todos los meses)
- Barras: verde Ingresos, roja Gastos
- Height: 340px

### MovementItem

- Ícono circular rojo (↓) para gastos, verde (↑) para ingresos
- Descripción + categoría · fecha
- Monto con signo (- rojo / + verde)
- Botones editar/eliminar solo visibles al hover (`group-hover:flex`)

### DailyMovements

Lista scrollable (`max-h-96 overflow-y-auto`) de `MovementItem`. Acepta `onDelete` y `onEdit` opcionales. Vacío muestra 📭.

### MonthlyComparison

Tabla comparativa actual vs anterior para Gastos / Ingresos registrados / Balance. Columna "Cambio" muestra ▲/▼ + porcentaje en verde (bueno) o rojo (malo). Para gastos, bajar es bueno (`lowerIsBetter: true`).

---

## Estilos y convenciones de Tailwind

- **Fondo de app:** `bg-gray-50`
- **Cards:** `bg-white rounded-xl border border-gray-100 shadow-sm`
- **Color primario:** `blue-500`
- **Ingresos:** `green-500` / `green-600`
- **Gastos:** `red-500`
- **Textos secundarios:** `gray-400`, `gray-500`
- **Inputs:** `border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400`
- Gráficas con `React.memo` para evitar re-renders innecesarios

---

## Formateo

```ts
// COP sin decimales
formatCurrency(1234567)  // → "$ 1.234.567"  (Intl, locale es-CO, currency COP)

// Fechas con date-fns + locale es
formatDate("2026-07-14")       // → "14 jul 2026"
formatShortDate("2026-07-14")  // → "14/07"
formatMonthYear(2026, 7)       // → "jul 2026"

// Porcentaje de cambio
calcPercentageChange(current, previous)  // → número (puede ser negativo)
```

---

## Patrones de mutación

Todas las mutaciones siguen el mismo patrón:

```ts
export function useDeleteMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMovement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}
```

En componentes:
```tsx
const deleteMovement = useDeleteMovement();
// ...
onDelete={(id) => { if (confirm('¿Eliminar?')) deleteMovement.mutate(id); }}
```

---

## Variables de entorno

```bash
VITE_API_URL=http://localhost:8082/api/v1
```

---

## Lo que NO existe en este proyecto

- Router (react-router, etc.)
- Tests (jest, vitest, etc.)
- CSS modules o styled-components
- Autenticación en el cliente
- Estado global (redux, zustand, etc.) — solo TanStack Query
- WebSockets / tiempo real
- PWA / service workers
