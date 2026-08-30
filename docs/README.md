# VaultTrack Backend

This document describes the **VaultTrack Backend** exactly as implemented in `Backend/` at the time of writing. It does not describe planned features — anything not present in the code is marked `Unknown / Not found in code`.

## What VaultTrack Is

VaultTrack is a personal portfolio-tracking application. Based on the code, a user can:

- Create **accounts** (labeled "Custodian" in the frontend UI, but referred to as `account` everywhere in the backend code, routes, and database) representing where an asset is held (e.g. an exchange, a broker, a wallet).
- Search for and add **assets** — crypto (market `CRYPTO`, priced via CoinGecko) and Nigerian Exchange stocks (market `NGX`, priced via the Mansa API).
- Record **holdings** (`user_assets`) of a given asset inside a given account, with quantity, cost basis, and acquisition date.
- View portfolio value, cost, and profit/loss converted into a **preferred display currency**, separate from the currency the underlying data is stored in.
- View a **daily portfolio snapshot history** and day-over-day performance.
- Ask an AI assistant questions about their portfolio, proxied to a separate **Flask analysis microservice**.

## Backend Responsibilities

The `Backend/` service is a REST API (Express) that:

- Authenticates users (custom JWT-based auth, not Supabase Auth).
- Owns all business logic for accounts, assets, holdings, currency conversion, and portfolio snapshots.
- Talks to Supabase (Postgres) as its only database.
- Talks to three external market-data sources (CoinGecko, Mansa API, a public currency-rate API) and one external AI microservice (Flask).
- Exposes two standalone scripts (not scheduled by the app itself) for batch jobs: daily portfolio snapshots and NGX price sync.

## Technology Stack

Inferred from `Backend/package.json` and `Backend/tsconfig.json`:

| Concern | Technology |
|---|---|
| Language | TypeScript (`^6.0.3`), compiled with `target: ES2022`, `module`/`moduleResolution: NodeNext` |
| Runtime | Node.js (module type `"module"` / native ESM). Node version itself: `Unknown / Not found in code` — no `engines` field in `package.json` |
| HTTP framework | Express `^5.2.1` |
| Database | Supabase (`@supabase/supabase-js` `^2.106.2`) — Postgres under the hood, accessed only through the Supabase client. **No ORM, no migration files exist in this repository** |
| Auth | `jsonwebtoken` `^9.0.3` (custom JWT, not Supabase Auth), `bcrypt` `^6.0.0` for password hashing |
| HTTP client (outbound) | `axios` `^1.17.0` for CoinGecko/Mansa/currency-rate calls; native `fetch` for the Flask analysis call |
| Rate limiting | `express-rate-limit` `^8.6.1` — applied to exactly one route (`POST /api/analysis/ask`) |
| Cookies / CORS | `cookie-parser` `^1.4.7`, `cors` `^2.8.6` |
| Config | `dotenv` `^17.4.2` |
| Dev/run tooling | `tsx` (runs TypeScript directly — used for `dev` and the two cron-style scripts), `nodemon` (devDependency; not referenced by any `package.json` script), `tsc` (production build) |

## Project Structure

```
Backend/
  src/
    config/          Supabase client singleton (supabase.ts)
    controllers/      HTTP-layer handlers — one file per resource
    middleware/       auth.middleware.ts, rateLimit.middleware.ts
    routes/           Express routers — one file per resource, mounted in server.ts
    scripts/          Standalone entry points: seedNgx.ts, runDailySnapshot.ts, runNgxSync.ts
    services/         All business logic and Supabase/external-API calls
    types/            Plain TypeScript interfaces per feature (no runtime validation library)
    utils/            passwordValidator.ts, emailValidator.ts
    server.ts         Express app assembly and route mounting
  package.json
  tsconfig.json
  .env               (not committed; see Environment Variables below)
```

## Installing Dependencies

```
cd Backend
npm install
```

## Running in Development

```
npm run dev
```

Runs `tsx watch src/server.ts` — TypeScript executed directly, restarting on file changes. Requires a valid `.env` in `Backend/` (see below).

## Running in Production

```
npm run build
npm start
```

`build` runs `tsc` (emits to `dist/`, per `tsconfig.json`'s `outDir`). `start` runs `node dist/server.js`. No process manager (pm2, etc.) is configured in the repository.

## Available npm Scripts

From `Backend/package.json`:

| Script | Command | Purpose |
|---|---|---|
| `dev` | `tsx watch src/server.ts` | Development server with auto-restart |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/server.js` | Run the compiled production server |
| `seed:ngx` | `tsx src/scripts/seedNgx.ts` | One-time (idempotent) seed of the full NGX stock universe into `assets`/`asset_prices` |
| `snapshot:daily` | `tsx src/scripts/runDailySnapshot.ts` | Snapshots every user's portfolio for "today". Meant to be invoked by an external scheduler — nothing in this repo triggers it automatically |
| `ngx:sync` | `tsx src/scripts/runNgxSync.ts` | Syncs NGX stock prices if the market is open. Also meant to be invoked externally |

## Required Environment Variables

Every `process.env.*` read in `Backend/src` (verified by direct search — this is the complete list; no others exist):

| Variable | Required? | Used in | Purpose |
|---|---|---|---|
| `PORT` | No (defaults to `5000`) | `server.ts` | Port the Express server listens on |
| `SUPABASE_URL` | Yes — throws at import time if missing | `config/supabase.ts` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Yes | `config/supabase.ts` | Supabase service-role/secret key used for all DB access |
| `JWT_SECRET` | Yes — throws at import time if missing | `services/auth.service.ts`, `middleware/auth.middleware.ts` | Secret used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | No (defaults to `"7d"`) | `services/auth.service.ts` | JWT expiry duration passed to `jsonwebtoken`'s `expiresIn` |
| `COINGECKO_API_KEY` | Yes for any code path that imports `services/coinGecko.service.ts` — throws at import time if missing | `services/coinGecko.service.ts` | CoinGecko API key (sent as `x-cg-demo-api-key` header) |
| `COINGECKO_BASE_URL` | Yes, same as above | `services/coinGecko.service.ts` | Base URL for CoinGecko API calls |
| `MANSA_API_KEY` | Yes — throws at import time if missing | `services/mansaMarket.service.ts` | Bearer token for the Mansa API (NGX stock data) |
| `FLASK_ANALYSIS_URL` | Yes, for `/api/analysis/*` to function | `services/analysis.service.ts` | Base URL of the external Flask AI-analysis microservice |

**Notable detail**: `Backend/.env` (as seen during development) also defines `MANSA_BASE_URL`, but no code in `Backend/src` reads `process.env.MANSA_BASE_URL` — `services/mansaMarket.service.ts` hardcodes `MANSA_BASE_URL = "https://mansaapi.com"` directly. The env var value observed locally was for a different, unrelated purpose (a "movers" endpoint) and has no effect on NGX sync/search behavior.

**Notable detail**: because `services/price.service.ts` imports `coinGecko.service.ts` at module scope (for its crypto-sync functions), anything that imports *any* export from `price.service.ts` — including `runNgxSync.ts`, which only uses the stock-sync function — will crash at startup if `COINGECKO_API_KEY`/`COINGECKO_BASE_URL` are unset, even though it never calls CoinGecko.

## Database Configuration

- **Supabase** is the only persistence layer. Connection is a single client instance in `config/supabase.ts`, created from `SUPABASE_URL` + `SUPABASE_SECRET_KEY`.
- **No migration files, SQL files, or ORM schema definitions exist anywhere in this repository** (verified by repository-wide search). The schema must already exist in the target Supabase project; see `SCHEMA.md` for the schema as inferred from every query in the codebase.
- There is no reset/teardown script. The only data-population script is `seed:ngx`.

## External APIs / Services Used

| Service | Used for | Auth | Config |
|---|---|---|---|
| Supabase (Postgres) | All application data | Service-role key | `SUPABASE_URL`, `SUPABASE_SECRET_KEY` |
| CoinGecko | Crypto asset discovery (`/search`) and price sync (`/simple/price`) | API key header | `COINGECKO_API_KEY`, `COINGECKO_BASE_URL` |
| Mansa API (`mansaapi.com`) | NGX stock list, NGX market-open calendar | Bearer token | `MANSA_API_KEY` (base URL hardcoded) |
| `cdn.jsdelivr.net/npm/@fawazahmed0/currency-api` | Foreign-exchange rates | None (public, unauthenticated) | Hardcoded URL in `services/currency.service.ts` |
| Flask Analysis microservice (external, separate codebase) | AI portfolio Q&A | None visible from this side — plain unauthenticated `fetch` | `FLASK_ANALYSIS_URL` |

## Authentication Approach

Custom JWT auth (see `ARCHITECTURE.md` for full detail): passwords hashed with bcrypt and stored in a dedicated `auth_credentials` table (not on `profiles`); on login/signup a JWT containing `{ userId, email }` is signed and set as an `httpOnly` cookie (`vaulttrack_token`) — an `Authorization: Bearer` header is also accepted. `authMiddleware` verifies the token on every protected route. No roles, no refresh tokens, no server-side session store.

## Deployment

Inferred, not fully documented in the repository:

- The production start command is `npm run build && npm start`.
- No `Dockerfile`, `render.yaml`, `Procfile`, or CI/CD workflow exists anywhere in the repository (verified by search).
- Environment strongly suggests deployment on **Render** (the `FLASK_ANALYSIS_URL` observed in `.env` points to an `onrender.com` domain, and the frontend's configured API base URL also points to an `onrender.com` domain), but the actual Render service configuration (build command, start command, scaling, cron jobs) is **not present in this repository** — it lives entirely in Render's dashboard.
- `server.ts` hardcodes its CORS allow-list to exactly two origins: `http://localhost:5173` and `https://vaultrack.vercel.app`. This is not environment-configurable.

## Important Prerequisites

- A Supabase project with the tables described in `SCHEMA.md` already created (this repo cannot create them).
- Valid API credentials for CoinGecko and Mansa if you need asset search, price sync, or NGX seeding to work.
- A reachable Flask analysis service if you need `/api/analysis/*` to work — every other endpoint functions without it.
- An external scheduler (e.g. a Render Cron Job, cron, GitHub Actions, etc.) if you need the daily snapshot or NGX sync jobs to actually run — this repository no longer schedules them itself (see `ARCHITECTURE.md`).

## Current Limitations / Notable Implementation Details

- **No update or delete endpoints** for accounts, assets, or holdings — only create + list exist.
- **No runtime request-validation library** (no zod/joi/yup). Validation is hand-written presence/type checks in controllers, plus two small dedicated validators for email format and password strength.
- **No scheduler lives in this codebase.** `runDailySnapshot.ts` and `runNgxSync.ts` are plain scripts; nothing in `server.ts` or elsewhere invokes them automatically.
- **`cost_currency` on a holding is always stored as the app's base currency (`USD`)** — `cost_price` is converted into it before storage regardless of what currency was submitted at creation time. See `API.md` for the exact conversion behavior of `POST /api/user-assets`.
- **`GET /api/test-db` requires authentication** and only selects `id` from `profiles` — kept intentionally minimal since it exists purely to verify Supabase connectivity, not to return data.
- Error-response shapes are inconsistent across the API: most routes return `{ success, message, data|user }`; `/api/analysis/*` returns `{ error }` or `{ conversations }` instead. See `API.md`.
