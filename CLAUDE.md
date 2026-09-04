# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (http://localhost:5173)
npm run build      # type-check + vite build
npm run lint       # eslint with zero warnings allowed
npm run preview    # serve the dist/ build locally
npx tsc -b         # type-check only, no bundle
```

**Do not use `tsc --noEmit` here.** The root `tsconfig.json` is solution-style (`"files": []` plus references), so that command type-checks nothing and always exits 0. Use `tsc -b`.

Tests run on **Vitest** (`npm test`, or `npm run test:watch`). There is no jsdom or Testing Library: the suite covers pure functions and the API layer, so components are tested through the logic extracted out of them (`src/utils/totals.ts`, `normalizeExpenseList`) rather than by rendering.

## Environment

Copy `.env.example` to `.env` and set `VITE_API_URL` if the backend runs on a different host/port. Default is `http://localhost:8080/api/v1` (the Go API run locally); Docker Compose exposes it on `8081` instead.

## Architecture

### Routing

There is no router library. Navigation is plain `useState` in `App.tsx` — a `page` string switches between `'dashboard'`, `'movements'`, and `'settings'`. `MainLayout` receives `activePage` and `onNavigate` props; `Sidebar` calls `onNavigate` on click.

### Data flow

All server state goes through **TanStack Query v5** (`@tanstack/react-query`). The single `QueryClient` lives in `App.tsx` with `staleTime: 30_000` and `retry: 1`.

`src/services/api.ts` is the only HTTP layer — a thin `request<T>` wrapper around `fetch` that unwraps the backend envelope `{ data, error }` and throws on non-2xx. All hooks call `api.*` methods; no component calls `fetch` directly.

### Authentication

**Bearer tokens.** Every request carries `Authorization: Bearer <token>`; `request` adds it from the module-level token set by `setAuthToken`, which only `AuthProvider` should write. Cookies are gone — do **not** reintroduce `credentials: 'include'`: the API answers `Access-Control-Allow-Origin: *`, which browsers reject for credentialed requests.

- `POST /user` (public) — register, `{ username, name, email, password }`, password 8–72 chars. Duplicates → `400 "username or email already in use"`. Also issues an activation token and sends a welcome email.
- `GET /user/activate?token=…` (public) — activates from the emailed link. **Does not gate login yet**: an unactivated user can still get a token, which is why there is no activation screen.
- `POST /tokens/authentication` (public) — login by `email`, returns `{ authentication_token: { token, expiry } }` with a **24 h** life. `401` means bad credentials (same message for unknown email and wrong password).
- `POST /tokens/logout` — deletes **every** token of the user, so it logs out all devices. Verified: two tokens of the same user both go to `401` after one call.
- `POST /change_password` — needs the token *and* re-verifies the current password in the body.

`/user/login` and `/user/logout` are the **deprecated** cookie-session routes. They still respond, but protected endpoints validate the token, not the cookie — `/user/logout` returns `200` and leaves the token alive. Don't use them.

Everything under `/api/v1` except `/user`, `/user/activate` and `/tokens/authentication` is protected and scoped to the token's user; `user_id` is never sent in a body or query. A `401` on a protected call means the token expired or was revoked (including by a logout on another device): `request` calls the handler registered via `setUnauthorizedHandler`, which `AuthProvider` uses to drop the session and bounce to the login. Add new public routes to `PUBLIC_PATHS` in `api.ts` or their `401` will log the user out.

`AuthProvider` (`src/context/AuthContext.tsx`) stores `{ token, expiry, user: { email } }` in `localStorage`. Unlike the old cookie hint, this **is** the credential — it is reachable from JS, so an XSS can lift it. Expired sessions are dropped on read (`parseStoredSession`) rather than waiting for a `401`. The email is the one typed at login; the API returns no user object.

### Billing period logic

The backend has a configurable `cut_day` (1–28) stored in `IncomeConfig`. All date-ranged API calls use the period `[cutDay of this/last month … cutDay−1 of next month]` computed by `getCurrentPeriod(cutDay)` in `src/utils/formatters.ts`. **`useDashboardData`** bootstraps this: it first fetches `IncomeConfig`, derives both the current and previous period, then fires the balance queries for each.

Any feature that needs "current period" must go through `useDashboardData` or call `getCurrentPeriod`/`getPreviousPeriod` directly — hardcoding calendar-month boundaries is wrong.

### API contract

- `MovementType` is `"E"` (expense) | `"I"` (income) — **not** `"expense"/"income"`.
- `GET /movements` returns `GroupedByCategory[]` (movements nested under each category group).
- `GET /movements/expenses` returns `ExpenseList` — `{ total, movements }`, movements sorted newest-first. `total` is summed server-side over the rows it returns, **after** `limit` is applied: verified against the API, `?limit=1` on two expenses of 42500 + 7500 answers `total: 42500`, not `50000`. So `limit` and `total` do not combine — asking for a page gives you that page's total, never the filter's. Callers that need a real total must omit `limit` (`MovementsList` does). Treat `total` as authoritative and don't recompute it client-side. `api.getExpenses` runs the payload through `normalizeExpenseList`, which also accepts the older flat `Movement[]` (summing client-side) until every environment serves the new shape.
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
