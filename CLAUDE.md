# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (http://localhost:5173)
npm run build      # type-check + vite build
npm run lint       # eslint with zero warnings allowed
npm run preview    # serve the dist/ build locally
npx tsc --noEmit   # type-check only, no output
```

There are no tests configured. No test runner is installed.

## Environment

Copy `.env.example` to `.env` and set `VITE_API_URL` if the backend runs on a different host/port. Default is `http://localhost:8080/api/v1` (the Go API run locally); Docker Compose exposes it on `8081` instead.

## Architecture

### Routing

There is no router library. Navigation is plain `useState` in `App.tsx` — a `page` string switches between `'dashboard'`, `'movements'`, and `'settings'`. `MainLayout` receives `activePage` and `onNavigate` props; `Sidebar` calls `onNavigate` on click.

### Data flow

All server state goes through **TanStack Query v5** (`@tanstack/react-query`). The single `QueryClient` lives in `App.tsx` with `staleTime: 30_000` and `retry: 1`.

`src/services/api.ts` is the only HTTP layer — a thin `request<T>` wrapper around `fetch` that unwraps the backend envelope `{ data, error }` and throws on non-2xx. All hooks call `api.*` methods; no component calls `fetch` directly.

### Authentication

Server-side sessions: the backend sets an **HttpOnly `session` cookie** (scs, stored in MySQL). There is no token reachable from JS, so every request goes out with `credentials: 'include'` — that line in `request` is what keeps the user logged in.

- `POST /user` (public) — register, `{ username, name, email, password }`, password 8–72 chars.
- `POST /user/login` (public) — **authenticates by `email`, not `username`**. `401` means bad credentials.
- `POST /user/logout` — destroys only the session of the cookie sent, so other devices stay logged in.

Everything under `/api/v1` except `/user` and `/user/login` is protected and scoped to the session user; `user_id` is never sent in a body or query. A `401` on any protected call means the session died: `request` calls the handler registered via `setUnauthorizedHandler`, which `AuthProvider` uses to drop the session and bounce to the login. Add new public routes to `PUBLIC_PATHS` in `api.ts` or their `401` will log the user out.

`AuthProvider` (`src/context/AuthContext.tsx`) keeps only `{ user: { email } }` in `localStorage`, purely so a reload doesn't flash the login screen — it is a hint, never the source of truth. The API returns no user object on login.

### Billing period logic

The backend has a configurable `cut_day` (1–28) stored in `IncomeConfig`. All date-ranged API calls use the period `[cutDay of this/last month … cutDay−1 of next month]` computed by `getCurrentPeriod(cutDay)` in `src/utils/formatters.ts`. **`useDashboardData`** bootstraps this: it first fetches `IncomeConfig`, derives both the current and previous period, then fires the balance queries for each.

Any feature that needs "current period" must go through `useDashboardData` or call `getCurrentPeriod`/`getPreviousPeriod` directly — hardcoding calendar-month boundaries is wrong.

### API contract

- `MovementType` is `"E"` (expense) | `"I"` (income) — **not** `"expense"/"income"`.
- `GET /movements` returns `GroupedByCategory[]` (movements nested under each category group).
- `GET /movements/expenses` returns a flat `Movement[]` sorted newest-first — use this for lists.
- `GET /balance` returns `BalanceSummary` which embeds `income_config`; balance = `(income_config.amount + incomes) − expenses`.
- `DELETE /movements/{id}` returns `204 No Content` (no body).
- `Category` has no `type` field from the API — categories are universal. The `EXPENSE_CATEGORIES`/`INCOME_CATEGORIES` split in `src/constants/categories.ts` is a local fallback only.

### React Query key conventions

| Key | Hook |
|---|---|
| `['categories']` | `useCategories` |
| `['movements', params]` | `useMovements` |
| `['expenses', params]` | `useExpenses` |
| `['movements-summary']` | `useMovementsSummary` |
| `['balance', params]` | `useBalance` |
| `['income-config']` | `useIncomeConfig` |

Mutations invalidate `['movements']`, `['expenses']`, and `['balance']` on success.

### Styling

Tailwind CSS only — no CSS modules or styled-components. Color palette: `blue-500` primary, `green-500` income, `red-500` expense, `gray-50` background. Charts (`recharts`) use `React.memo` to avoid re-renders.
