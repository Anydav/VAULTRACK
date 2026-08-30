# VaultTrack Backend Architecture

## Request Flow

```
Client
  → Express app (server.ts): cors → express.json() → cookie-parser
    → Router (mounted per resource under /api/<resource> in server.ts)
      → authMiddleware (if the route requires auth)
        → [analysisRateLimiter — only on POST /api/analysis/ask]
          → Controller
            → Service (business logic + Supabase / external API calls)
              → Database (Supabase/Postgres) and/or External API
            ← thrown Error on failure
          ← Controller catches, maps to a JSON response + status code
      ← Response
```

This matches the actual code in every resource **except** two ad hoc exceptions:

- `GET /api/test-db` (`server.ts`) calls `supabase` directly, bypassing the controller/service layering entirely.
- `controllers/auth.controller.ts`'s `meController` also calls `supabase` directly rather than going through `services/auth.service.ts`.
- `routes/analysis.routes.ts` contains its route-handling logic inline (no separate `analysis.controller.ts` exists, unlike every other resource).

### Layer Responsibilities

- **`routes/`** — one Express router per resource. Wires middleware (`authMiddleware`, occasionally a rate limiter) to controller functions. Contains no business logic (except `analysis.routes.ts`, noted above).
- **`controllers/`** — translates HTTP ↔ service calls: reads `req.body`/`req.query`, does presence/type validation, calls exactly one service function, wraps the call in `try/catch`, and shapes the JSON response. Status codes on failure are chosen per-controller, ad hoc — there is no shared error-handling middleware or centralized status-code mapping (confirmed: `server.ts` registers no `app.use((err, req, res, next) => ...)` error handler).
- **`services/`** — where all actual business logic and all Supabase/external-API calls live. A service function either returns data or `throw new Error(message)`; it never touches `req`/`res`.
- **`types/`** — plain TypeScript interfaces, one small file per feature. No shared/base types, no runtime schema validation (no zod/joi/yup anywhere in `package.json` or code).
- **`middleware/`** — `auth.middleware.ts` (JWT verification, applied per-route) and `rateLimit.middleware.ts` (only `analysisRateLimiter`, applied to exactly one route).
- **`scripts/`** — standalone entry points (`seedNgx.ts`, `runDailySnapshot.ts`, `runNgxSync.ts`) that import from `services/` directly and call `process.exit()` themselves. Not part of the Express app's request lifecycle at all — see "Cron Jobs / Scheduled Jobs" below.
- **`config/`** — a single Supabase client singleton (`config/supabase.ts`). Calls `dotenv.config()` itself; `server.ts` also calls `dotenv.config()` independently (redundant but harmless, since `dotenv.config()` is idempotent for already-loaded values).

---

## Authentication

### Mechanism
Custom JWT-based auth, implemented directly with `jsonwebtoken` and `bcrypt` — **not** Supabase Auth, despite `@supabase/supabase-js` being used for every other data operation.

### Password Storage
Hashed with `bcrypt` (cost factor `10`), stored in a dedicated `auth_credentials` table keyed by `user_id`, deliberately separate from `profiles`. This means an over-broad `select("*")` on `profiles` could never expose a password hash even if one were written — it structurally isn't in that table.

### Token Generation
On both signup and login (`services/auth.service.ts`), on success:
```ts
jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
```
`JWT_EXPIRES_IN` defaults to `"7d"` if unset.

### Token Transport
Two accepted methods, checked in this order by `authMiddleware`:
1. `httpOnly` cookie named `vaulttrack_token` (set with `secure: true`, `sameSite: "none"`, and `maxAge` derived from the signed token's own `exp` claim via `jwt.decode` in `auth.controller.ts`, so it always tracks `JWT_EXPIRES_IN` rather than a fixed value).
2. `Authorization: Bearer <token>` header, if no cookie is present.

### Token Validation
`jwt.verify(token, JWT_SECRET)` inside `authMiddleware`. Any failure — missing token, malformed token, expired token, wrong secret — results in the same `401 { success: false, message: "Invalid or expired token." }` (or `"Access denied. No token provided."` if no token was found at all). No distinction is made between these failure modes in the response.

### Session / User Handling
There is **no server-side session store**. The verified JWT payload (`{ userId, email }`) is copied directly onto `req.user` and used as-is for the rest of that request — most routes never re-check the database for the user's current state. The one exception is `GET /api/auth/me`, which re-fetches the profile fresh. There is no token revocation/blacklist mechanism: a token remains valid until it naturally expires, regardless of anything that happens to the account afterward (there is no account-deletion or deactivation flow anywhere in this code, so this is currently a theoretical rather than exploitable gap, but worth noting given the design).

### Refresh Behavior
**Not implemented.** No `/refresh` endpoint, no rotating/short-lived-plus-refresh-token pattern. A user must log in again once their token expires.

### Authorization / Roles
**None implemented.** No role or permission field exists anywhere in `profiles` or any other table/type found in the code. Every authenticated user has identical capabilities, and data isolation is achieved purely by scoping every query to `req.user.userId` (directly, or via an ownership check through `accounts`). There is no admin role and no multi-user/team/sharing concept.

---

## External Integrations

### Supabase
- **Used for**: all persistent data storage — every table in `SCHEMA.md`.
- **Called from**: every file in `services/` via the single client in `config/supabase.ts`.
- **Auth**: service-role/secret key (`SUPABASE_SECRET_KEY`) — the backend has full database access; no row-level security is enforced from the app's perspective (all scoping is done in application-level `.eq("user_id", ...)` filters).
- **Error handling**: every call checks `{ error }` and, if present, `throw new Error(error.message)` — no retries, no circuit breaking.

### CoinGecko
- **Used for**: crypto asset discovery (`GET /search`) and price sync (`GET /simple/price`).
- **Called from**: `services/coinGecko.service.ts`, consumed by `services/asset.service.ts` (search-triggered discovery) and `services/price.service.ts` (`syncCryptoPrices`).
- **Auth**: API key sent as an `x-cg-demo-api-key` header.
- **Data retrieved**: coin id/symbol/name (search), current price in USD (price sync).
- **Error handling**: no explicit try/catch inside `coinGecko.service.ts` itself — a failed request propagates as a thrown error up through whichever service called it, ultimately surfacing as a `500` from the relevant controller.
- **Config**: `COINGECKO_API_KEY`, `COINGECKO_BASE_URL` — both validated (throw) at module import time, meaning importing this module at all with either missing crashes the process immediately, not just when the function is actually called.

### Mansa API (`mansaapi.com`)
- **Used for**: fetching the full NGX stock list + prices, and checking whether the NGX market is currently open.
- **Called from**: `services/mansaMarket.service.ts`, consumed by `services/price.service.ts` (`syncStockPrices`), `services/ngxSeed.service.ts`, and `scripts/runNgxSync.ts` (via `isNgxOpen`).
- **Auth**: `Authorization: Bearer <MANSA_API_KEY>`.
- **Data retrieved**: `{ ticker, name, price, change, change_pct, volume, scraped_at }` per stock; a boolean `is_open` for the market-hours check.
- **Error handling**: throws if the API responds with `success: false` in its payload; otherwise no special handling — a thrown error propagates up the same way as CoinGecko's.
- **Config**: `MANSA_API_KEY` (validated/throws at import time). Base URL is **hardcoded** to `https://mansaapi.com` in this file — the `MANSA_BASE_URL` environment variable is not read anywhere in the codebase.

### Currency Rate API (`cdn.jsdelivr.net/npm/@fawazahmed0/currency-api`)
- **Used for**: foreign-exchange rate lookups powering every currency conversion in the app.
- **Called from**: `services/currency.service.ts`.
- **Auth**: none — public, unauthenticated CDN-hosted JSON.
- **Data retrieved**: a full rate table for a given base currency, upserted wholesale into `exchange_rates`.
- **Caching**: `syncExchangeRatesIfStale` only re-fetches if the newest cached row for that base currency is ≥60 minutes old (default); `getExchangeRate` triggers this staleness check on every call before reading the cached rate.
- **Error handling**: throws if the response has no rates for the requested base currency; no retry.
- **Config**: none — URL is hardcoded, no API key.

### Flask Analysis Microservice (external, separate codebase)
- **Used for**: AI-generated answers to portfolio questions (`POST /api/analysis/ask`).
- **Called from**: `services/analysis.service.ts`, via native `fetch` (not `axios`, unlike every other external call in this codebase).
- **Auth**: none visible from this side — a plain unauthenticated POST to `${FLASK_ANALYSIS_URL}/analyze`.
- **Data sent**: simplified holdings (`symbol`, `type`, `market`, `current_value_usd`, `cost_usd` — always base-currency, regardless of the user's display currency), the user's question, the rolling memory summary, and any unfolded recent messages.
- **Data received**: `{ summary, answer, updated_memory }`.
- **Error handling**: a 120-second `AbortController` timeout; non-2xx responses, aborts, and other fetch failures are each mapped to a distinct thrown-error message, all ultimately surfaced as `500 { error: message }` by the route.
- **Config**: `FLASK_ANALYSIS_URL`.

---

## Cron Jobs / Scheduled Jobs

**As of the current code, nothing in this repository schedules or triggers these jobs automatically.** Both are plain scripts meant to be invoked by something external (e.g. a platform's Cron Job feature, a system crontab, a CI scheduled workflow) — none of which exists inside this repository. `server.ts` does not import, schedule, or otherwise reference either script.

For historical context only (visible in prior commits, not in the current code): this project previously used the `node-cron` package to schedule these same jobs *inside* the running Express process — a daily snapshot job at midnight UTC, and three NGX sync attempts per weekday at `09:15`, `12:30`, and `14:15` `Africa/Lagos` time. That in-process scheduling has been fully removed; `node-cron` is no longer a dependency.

### Daily Portfolio Snapshot

- **File**: `Backend/src/scripts/runDailySnapshot.ts`
- **Purpose**: creates/overwrites today's `portfolio_snapshots` row for every user.
- **Schedule**: Unknown / Not found in code — no schedule exists in this repository; must be configured on whatever external scheduler invokes `npm run snapshot:daily`.
- **What triggers it**: currently, only a manual `npm run snapshot:daily` invocation (or whatever external scheduler is configured to run that command). The same underlying logic (`createPortfolioSnapshot`) is also reachable per-user, on-demand, via `POST /api/snapshots`.
- **Data read**: all rows from `profiles` (just `id`), then for each user, everything `getDashboardSummary` reads (holdings, exchange rates, etc.).
- **Data created/updated**: one `portfolio_snapshots` row per user, upserted on `(user_id, snapshot_date)`.
- **Services/functions called**: `services/snapshot.service.ts`'s `createPortfolioSnapshot`, which internally calls `getDashboardSummary`.
- **External APIs involved**: indirectly, whatever `getDashboardSummary` triggers (crypto price sync if stale, currency-rate sync if stale).
- **Transaction behavior**: none — there is no database transaction wrapping the per-user loop or any individual snapshot write. Each user's snapshot is an independent upsert.
- **Error handling**: each user's snapshot is wrapped in its own `try/catch`; a failure for one user is logged and does not stop the loop from continuing to the next user.
- **Logging**: `console.log`/`console.error` only — no file, no external logging service.
- **Retry behavior**: **none implemented.** A failed user is not retried within the same run.
- **Partial failure behavior**: the script tracks a `failures` counter and exits with status code `1` if `failures > 0` (i.e. **any** user failed), or `0` if every user succeeded (or there were no users at all).
- **Does a failure affect subsequent executions?**: no persisted "last successful run" state exists — each invocation independently re-attempts every user for "today" (UTC date), and the upsert means a later successful run for the same day simply overwrites whatever partial data an earlier failed run may have left.
- **Manually triggerable?**: yes — `npm run snapshot:daily` (all users), or `POST /api/snapshots` (single user, requires that user's auth token).

### NGX Price Sync

- **File**: `Backend/src/scripts/runNgxSync.ts`
- **Purpose**: refreshes cached prices for all locally-known NGX stocks, but only if the NGX market is currently open.
- **Schedule**: Unknown / Not found in code — same as above; must be configured externally. (See the historical note above for the cadence this job used to run on before scheduling was removed from the codebase.)
- **What triggers it**: currently, only a manual `npm run ngx:sync` (or `npm run ngx:sync -- "<label>"` to tag the run in its own log output) invocation, or whatever external scheduler is configured to run that command. There is no API-triggerable equivalent (unlike snapshots).
- **Data read**: `isNgxOpen()` (Mansa calendar check) first; if open, all `assets` rows where `market = "NGX"`, plus a live stock list from Mansa, plus the current `NGN → USD` exchange rate.
- **Data created/updated**: `asset_prices` rows for matched NGX assets, upserted on `asset_id` (overwrites the previous cached price — no history retained).
- **Services/functions called**: `services/mansaMarket.service.ts` (`isNgxOpen`, `fetchNgxStocks`), `services/price.service.ts` (`syncStockPrices`), `services/currency.service.ts` (`getExchangeRate`).
- **External APIs involved**: Mansa API (both calls), plus the currency-rate API transitively via `getExchangeRate`.
- **Transaction behavior**: none — a single batch `upsert` of all matched price rows; no per-row transaction, no rollback if the upsert itself partially fails (Supabase's `upsert` on an array is one request, so this is effectively atomic at the request level, but nothing in the application code manages a transaction explicitly).
- **Error handling**: the entire run is wrapped in one `try/catch` — there is no per-stock isolation like the snapshot job has. A single Mansa API failure (or any other error) fails the whole run.
- **Logging**: `console.log`/`console.error` only.
- **Retry behavior**: **none implemented.**
- **Partial failure behavior**: not applicable in the same sense as snapshots — this job either completes as one unit or fails as one unit. If the market is closed, it logs that and exits `0` (a closed market is treated as success, not failure).
- **Does a failure affect subsequent executions?**: no persisted state; the next scheduled/manual run starts fresh.
- **Manually triggerable?**: yes — `npm run ngx:sync` (optionally `npm run ngx:sync -- "<label>"`).
- **Notable coupling**: because `services/price.service.ts` imports `coinGecko.service.ts` at module scope, running this NGX-only script still requires `COINGECKO_API_KEY`/`COINGECKO_BASE_URL` to be set, or the process crashes at import time before ever reaching the NGX logic.
