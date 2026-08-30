# VaultTrack Backend Operations Guide

Only procedures actually supported by the current codebase are documented here. Where the repository doesn't answer a question (e.g. exact production deployment steps), that's stated explicitly rather than guessed.

## Starting the System

### Development
```
cd Backend
npm install
npm run dev
```
Runs `tsx watch src/server.ts`. Requires a `.env` file in `Backend/` containing at minimum `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `JWT_SECRET` (the process throws at startup if any of these three — or `COINGECKO_API_KEY`/`COINGECKO_BASE_URL`/`MANSA_API_KEY`, the moment anything imports those modules — are missing). See `README.md` for the full variable list.

### Production
```
npm run build
npm start
```
`build` compiles to `dist/` via `tsc`; `start` runs `node dist/server.js`. No process manager (pm2, systemd unit, etc.) is defined in this repository — if one is used in production, it is configured outside this codebase.

### Required Services
- A reachable Supabase project with the schema described in `SCHEMA.md` already created.
- For full functionality (not required just to boot): CoinGecko API access, Mansa API access, outbound network access to `cdn.jsdelivr.net`, and a reachable Flask analysis service for `/api/analysis/*` only.

---

## Database Operations

### Migrations
**None exist in this repository.** The schema must already exist in the target Supabase project — there is no `migrate` command, no migration folder, and no ORM to generate one from.

### Seeding
```
npm run seed:ngx
```
Runs `src/scripts/seedNgx.ts`, which calls `seedNgxAssets()` (`services/ngxSeed.service.ts`): fetches the full NGX stock list from Mansa, upserts them into `assets` (`market = "NGX"`), converts each price to base currency, and upserts into `asset_prices`. Safe to re-run — both upserts use `onConflict`, so re-seeding updates existing rows rather than duplicating them.

### Reset Procedures
**Not implemented.** No script exists to delete or reset data.

---

## Scheduled Jobs

### Verifying Jobs Are Running
There is no in-app job-status endpoint or dashboard. The only way to verify a run happened is:
- Check whatever log output your external scheduler captured for that invocation (stdout/stderr — see "Logging" below).
- For snapshots specifically, check the `portfolio_snapshots` table for a row with today's `snapshot_date` for the user(s) in question.
- For NGX sync, check `asset_prices.price_time` for NGX-market assets to see how recently they were updated.

### Manually Executing Jobs
```
npm run snapshot:daily
npm run ngx:sync
npm run ngx:sync -- "manual run"   # optional label, shows up in that run's log lines
```
Both can be run from a developer machine or any environment with the required env vars and network access to Supabase/Mansa/CoinGecko. `POST /api/snapshots` additionally lets any authenticated user force their own single snapshot via the API, without running the script.

### Checking Logs
Both scripts only write to `console.log`/`console.error` (stdout/stderr) — there is no log file and no external logging service integration anywhere in the codebase. Whatever captures your process's stdout (terminal, platform log viewer, etc.) is the only place to see this output.

### Diagnosing Failures
- **Snapshot job**: look for `Snapshot failed for user <id>: <message>` lines — failures are isolated per user, so the summary line (`Daily portfolio snapshot job completed. N failure(s).`) tells you how many users were affected. Exit code `1` means at least one user failed; `0` means all succeeded (or there were zero users).
- **NGX sync job**: a single `NGX price sync failed (<label>): <message>` line means the entire run failed as one unit (or `NGX is closed — skipping sync` if it exited early and successfully because the market wasn't open). Exit code `1` on failure, `0` on success or a closed-market skip.

---

## Deployment

Documented only to the extent the repository reveals it:
- Production command: `npm run build && npm start`.
- No `Dockerfile`, `render.yaml`, `Procfile`, or CI/CD workflow file exists anywhere in the repository (verified by search) — there is no infrastructure-as-code for this service in this codebase.
- Strong environmental evidence (an `onrender.com` URL observed in `.env` for `FLASK_ANALYSIS_URL`, and the frontend's API base URL also pointing at an `onrender.com` domain) suggests the backend is deployed on **Render**, but the actual service configuration — build command, start command, instance type, auto-deploy settings — is **Unknown / Not found in code**; it exists only in Render's dashboard.
- Scheduled jobs (`snapshot:daily`, `ngx:sync`) are not triggered by this deployment automatically — whatever external scheduler is meant to invoke them must be configured separately (see `ARCHITECTURE.md`).
- CORS is hardcoded in `server.ts` to allow exactly `http://localhost:5173` and `https://vaultrack.vercel.app` — deploying a new frontend origin requires editing and redeploying this file, not just a config change.

---

## Monitoring and Debugging

### Logging System
Plain `console.log`/`console.error` throughout — no structured logging library (no winston/pino/etc.), no log file, no external log aggregation service found in the codebase.

### Health Checks
No dedicated `/health` or `/healthz` endpoint exists. The closest equivalents:
- `GET /` — confirms the Express process is up and responding. Does not check the database or any external service.
- `GET /api/test-db` — confirms Supabase connectivity (runs a real query, requires auth, only returns an `id`).

### Error Handling
No centralized error-handling middleware exists (`server.ts` registers no `(err, req, res, next)` handler). Every controller has its own `try/catch` that maps thrown `Error`s to a JSON response — status codes and response shapes are chosen per-controller and are **not** fully consistent across the API (see `API.md` for the specific inconsistencies, e.g. `/api/analysis/*`'s `{ error }` shape vs. everywhere else's `{ success, message }`).

### Useful Debugging Commands
- `curl http://<host>/` — process liveness.
- `curl -H "Authorization: Bearer <token>" http://<host>/api/test-db` — database connectivity (requires a valid token).
- `npm run build` — surfaces any TypeScript errors before deploying.
- Re-run `npm run snapshot:daily` / `npm run ngx:sync` locally with the same env vars as production to reproduce a job failure outside the scheduler.

---

## Failure Recovery

### Database Connection Failure
Every service function that hits Supabase checks for `{ error }` and throws if present; this bubbles up as a `500` from whichever controller called it (or a logged failure inside the batch scripts). There is no automatic retry or circuit breaker anywhere. **Recovery**: fix the underlying Supabase issue (credentials, project availability, network) and either wait for the caller to retry or manually re-invoke the affected operation — nothing in the app retries on your behalf.

### External API Failure (CoinGecko / Mansa / Currency API)
Same pattern — a thrown error surfaces as a `500` to whichever request triggered it (asset search/sync, holding valuation, snapshot creation, etc., depending on which API failed). **Recovery**: once the external API recovers, the next request or scheduled run will succeed on its own; there is no queued retry to manage.

### NGX Sync Failure
Because the whole job is one unit (no per-stock isolation), any failure means **no** NGX prices were updated in that run. **Recovery**: re-run `npm run ngx:sync` manually once the underlying cause (Mansa API outage, missing `MANSA_API_KEY`, etc.) is fixed. Existing `asset_prices` rows are left at their last-known values in the meantime — the app doesn't clear stale data on failure.

### Snapshot Failure
Failures are isolated per user within a single run. **Recovery**: re-run `npm run snapshot:daily` (safe — the upsert on `(user_id, snapshot_date)` means it will only update, not duplicate, any user's snapshot for that day), or have the specific affected user call `POST /api/snapshots` themselves.

### Authentication / Configuration Problems
`JWT_SECRET`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY` are validated at module-import time — the process **will not start** at all if any are missing (a thrown error crashes startup immediately, before the server binds to a port). The same is true for `COINGECKO_API_KEY`/`COINGECKO_BASE_URL` and `MANSA_API_KEY`, but only for whichever entry point actually imports those modules (e.g. `runNgxSync.ts` will crash on missing CoinGecko vars even though it never calls CoinGecko, per the transitive-import note in `ARCHITECTURE.md`). **Recovery**: set the missing environment variable and restart/redeploy — there is no way to run with a partial/degraded config for these particular variables.

---

## Critical External Dependencies and Impact of Unavailability

| Dependency | If unavailable |
|---|---|
| **Supabase** | The entire API is unusable — every single route touches it. |
| **CoinGecko** | Crypto asset *discovery* (searching for a brand-new symbol) and crypto price sync fail; browsing/using already-known crypto assets and all NGX functionality are unaffected. |
| **Mansa API** | NGX price sync and the NGX market-open check fail; already-seeded NGX assets remain readable with their last-known cached prices. |
| **`cdn.jsdelivr.net` currency API** | `getExchangeRate` throws once the 60-minute cache goes stale, which cascades into failures anywhere a currency conversion is needed — holdings valuation, dashboard summary, snapshot creation — until the API is reachable again. |
| **Flask analysis microservice** | Only `POST /api/analysis/ask` and its supporting flow are affected (fails after a 120-second timeout, or immediately on a connection error); every other endpoint in the API is unaffected. |
