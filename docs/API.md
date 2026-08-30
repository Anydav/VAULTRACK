# VaultTrack Backend API Reference

Every endpoint currently implemented in `Backend/src`, grouped by feature. All paths are relative to the API base (mounted from `server.ts`); there is no version prefix (no `/v1`, etc.).

Unless stated otherwise, error responses across most of the API follow `{ success: false, message: string }`. **Exception**: `/api/analysis/*` uses a different shape (`{ error: string }` / `{ conversations: [...] }`) — this is a real inconsistency in the code, not a documentation simplification.

Authentication is via `authMiddleware` (`Backend/src/middleware/auth.middleware.ts`), which accepts **either** an `httpOnly` cookie named `vaulttrack_token` **or** an `Authorization: Bearer <token>` header (cookie checked first). No route implements role-based authorization — every "Auth required" route only checks that a valid token exists, then scopes data to `req.user.userId`.

---

## Health / Diagnostics

### `GET /`
- **Auth**: None
- **Purpose**: Liveness check.
- **Response**: `200` — `{ success: true, message: "VaultTrack API is running" }`. No error path.

### `GET /api/test-db`
- **Auth**: Required. *(Previously unauthenticated and selected `*` on `profiles`, leaking one arbitrary user's PII to any caller — fixed: now gated by `authMiddleware` and selects only `id`.)*
- **Purpose**: Verifies Supabase connectivity.
- **Logic**: Runs `supabase.from("profiles").select("id").limit(1)` directly inside `server.ts` (not via a service).
- **Response**: `200` — `{ success: true, message: "Database connected successfully", data: [...] }` where `data` is up to 1 row (`{ id }` only). `500` — `{ success: false, message: "Database connection failed", error: <message> }` on a Supabase error.

### `GET /api/protected-test`
- **Auth**: Required
- **Purpose**: Smoke-tests `authMiddleware`.
- **Response**: `200` — `{ success: true, message: "You accessed a protected route", user: { userId, email } }` (from the JWT payload, not re-fetched from the DB).

---

## Auth (`/api/auth`)

Source: `routes/auth.routes.ts`, `controllers/auth.controller.ts`, `services/auth.service.ts`.

### `POST /api/auth/signup`
- **Auth**: None
- **Body**: `{ fullName: string, email: string, password: string }` — all required.
- **Validation**:
  - `400` if any of `fullName`/`email`/`password` is missing.
  - `400` if email fails `validateEmail` (`utils/emailValidator.ts` — regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`).
  - `400` if password fails `validatePassword` (`utils/passwordValidator.ts` — requires ≥8 chars, one uppercase, one lowercase, one digit, one special character; returns the first failed requirement's message).
- **Logic** (`signupUser` in `auth.service.ts`):
  1. Normalizes email (`toLowerCase().trim()`).
  2. Checks `profiles` for an existing row with that email.
  3. Hashes the password with `bcrypt` (cost factor `10`).
  4. Inserts into `profiles` (`full_name`, `email`, `preferred_currency` hardcoded to `"NGN"`).
  5. Inserts into `auth_credentials` (`user_id`, `password_hash`).
  6. Signs a JWT `{ userId, email }` with `JWT_SECRET`, expiry `JWT_EXPIRES_IN` (default `7d`).
- **Success**: `201` — sets cookie `vaulttrack_token` (`httpOnly`, `secure: true`, `sameSite: "none"`, `maxAge` derived from the signed token's actual `exp` claim, so it always matches `JWT_EXPIRES_IN`); body `{ success: true, message: "Account created successfully", user: { id, email, full_name, preferred_currency, created_at } }`.
- **Errors**: `400` for the validation cases above. **`409`** for a duplicate email (`"Email already exists"`). `500` for any other/unexpected server error.

### `POST /api/auth/login`
- **Auth**: None
- **Body**: `{ email: string, password: string }` — both required (`400` if missing).
- **Logic** (`loginUser`):
  1. Normalizes email, looks up `profiles` by email (`maybeSingle`).
  2. Looks up `auth_credentials` by the found `user_id` (`single`).
  3. `bcrypt.compare` against the stored hash.
  4. On any of (no profile / no credentials row / password mismatch), throws the **same** message — `"Invalid email or password"` — deliberately not distinguishing "no such user" from "wrong password".
  5. On success, signs a JWT identically to signup.
- **Success**: `200` — same cookie-setting behavior as signup; body `{ success: true, message: "Login successful", user: {...} }`.
- **Errors**: `400` if fields missing. `401` for any authentication failure.

### `GET /api/auth/me`
- **Auth**: Required
- **Purpose**: Returns the current user's profile, re-fetched fresh from `profiles` (not just decoded from the JWT).
- **Response**: `200` — `{ success: true, message: "User fetched successfully", user: { id, email, full_name, preferred_currency, created_at } }`. `404` if the profile row is gone. `401` if `req.user` is somehow absent (defensive; `authMiddleware` normally prevents this). `500` on any other error — message is **not** included in this response (`"Something went wrong"` only), unlike most other controllers.

### `POST /api/auth/logout`
- **Auth**: None (works with or without a valid session).
- **Logic**: Clears the `vaulttrack_token` cookie with matching flags.
- **Response**: Always `200` — `{ success: true, message: "Logout successful" }`.

---

## Accounts (`/api/accounts`)

Labeled "Custodian" in the frontend UI. The API, database, and all backend code use `account` throughout. Source: `routes/account.routes.ts`, `controllers/account.controller.ts`, `services/account.service.ts`.

### `POST /api/accounts`
- **Auth**: Required
- **Body**: `{ name: string, accountType: string, currency?: string }`.
- **Validation**: `400` if `name` or `accountType` missing. No uniqueness check — a user can create multiple accounts with the same name.
- **Logic**: Inserts into `accounts` with `user_id` from the token.
- **Success**: `201` — `{ success: true, message: "Account created successfully", data: { id, name, account_type, currency, created_at, ... } }`.
- **Errors**: `400` (validation), `500` (any Supabase error, message passed through).

### `GET /api/accounts`
- **Auth**: Required
- **Purpose**: Lists the caller's own accounts.
- **Logic**: `accounts` filtered by `user_id`, ordered by `created_at` descending.
- **Success**: `200` — `{ success: true, message: "Accounts fetched successfully", data: [...] }` (empty array if none).
- **Errors**: `500`.

No `PATCH`/`DELETE` route exists for accounts.

---

## Assets (`/api/assets`)

Source: `routes/asset.routes.ts`, `controllers/asset.controller.ts`, `services/asset.service.ts`.

### `GET /api/assets`
- **Auth**: Required
- **Query params**:
  - `market` (required — `400` `"Market is required"` if missing; any string is accepted, not restricted to a known enum).
  - `query` (optional — defaults to an empty string server-side).
- **Logic** (`searchAssets`):
  1. Normalizes `market` (uppercase/trim) and `query` (trim).
  2. Queries local `assets` table for that market; if `query` is non-empty, adds an `ilike` filter on `symbol` OR `name`. Always ordered by `symbol` ascending, `limit(10)`.
  3. If local rows are found, enriches each with `priceDisplay`/`displayCurrency` — the stored price converted from its own currency into the **caller's** `preferred_currency`.
  4. If **zero** local rows and (`query` is empty **or** `market !== "CRYPTO"`), returns `[]` — no external fallback in these cases.
  5. If zero local rows, `query` is non-empty, and `market === "CRYPTO"`: calls CoinGecko `/search`, takes exact-symbol matches (up to 5) or the top 10 raw matches, **upserts** them into `assets` (`onConflict: "symbol,market"`), force-syncs their prices via `syncCryptoPricesIfStale(0)`, re-selects with prices, and returns those, enriched the same way.
- **Behavior summary**: only `CRYPTO` can self-discover brand-new assets via search; any other market (e.g. `NGX`) can only ever return assets that already exist locally (populated via `seed:ngx`).
- **Success**: `200` — `{ success: true, message: "Assets fetched successfully", data: [...] }`.
- **Errors**: `400` (missing market), `500`.

No `POST`/`PATCH`/`DELETE` route exists for assets.

---

## User Assets / Holdings (`/api/user-assets`)

Source: `routes/userAsset.routes.ts`, `controllers/userAsset.controller.ts`, `services/userAsset.service.ts`.

### `POST /api/user-assets`
- **Auth**: Required
- **Body**: `{ accountId: string, assetId: string, quantity: number, costPrice?: number, costCurrency?: string, acquiredAt?: string }`.
- **Validation**: `400` if `accountId`, `assetId`, or `quantity` is missing (`quantity` is checked against `undefined`/`null` specifically, so `quantity: 0` is valid).
- **Logic** (`createUserAsset`):
  1. Verifies the `accountId` belongs to the caller (`accounts.user_id === req.user.userId`); if not found, throws `"Account not found"` (surfaces as `500`, not `404`).
  2. If `costPrice` is given, converts it into the app's base currency (`USD`) via `convertAmount`, using the submitted `costCurrency` if present, or assuming it's already in `USD` if not (`convertAmount` is a no-op when the two currencies match, so this doesn't distort an already-base-currency price).
  3. Inserts into `user_assets` with `cost_currency` always written as the base currency (`USD`), which is now accurate since the price is always converted (or already in that currency) before storage.
  4. No pre-insert check that `assetId` actually exists in `assets` — relies entirely on whatever foreign-key constraint (if any) exists in the database, which cannot be confirmed from this code.
- **Success**: `201` — `{ success: true, message: "Asset added to portfolio successfully", data: {...} }`, the new row joined with its `accounts` and `assets` (+ `asset_prices`) data.
- **Errors**: `400` (validation), `500` (including the "Account not found" case).

### `GET /api/user-assets`
- **Auth**: Required
- **Purpose**: Lists the caller's holdings, each enriched with a `valuation` object.
- **Logic** (`getUserAssets`): joins `user_assets` → `accounts` and `assets` (+`asset_prices`), ordered by `created_at` descending. For each holding computes:
  - `currentValueBase = quantity × latestPrice` (from the asset's single cached price row — not any historical price near acquisition)
  - `totalCostBase = quantity × cost_price`
  - `profitLossBase = currentValueBase − totalCostBase`
  - `profitLossPercentage = profitLossBase / totalCostBase × 100` (or `0` if `totalCostBase` is `0`)
  - Display-currency equivalents of all of the above, converted via the caller's current `preferred_currency` and a fresh/cached FX rate.
- **Success**: `200` — `{ success: true, message: "User assets fetched successfully", data: [...] }`.
- **Errors**: `500`.

No `PATCH`/`DELETE` route exists for holdings.

---

## Prices (`/api/prices`)

Source: `routes/price.routes.ts`, `controllers/price.controller.ts`, `services/price.service.ts`.

### `POST /api/prices/sync-crypto`
- **Auth**: Required (any authenticated user — not restricted to an admin role, since no role concept exists).
- **Body**: None.
- **Logic** (`syncCryptoPrices`): fetches every `assets` row where `market = "CRYPTO"` and `external_id` is set, calls CoinGecko `/simple/price` for all of them in one batch, converts each price into the base currency, and upserts into `asset_prices` (`onConflict: "asset_id"` — one row per asset, i.e. a latest-price cache, not a price history table).
- **Success**: `200` — `{ success: true, message: "Crypto prices synced successfully", data: [...] }`.
- **Errors**: `500`.
- **Notable**: not rate-limited despite calling an external, presumably-quota-limited API; any logged-in user can call it repeatedly.

---

## Dashboard (`/api/dashboard`)

Source: `routes/dashbaord.routes.ts` *(filename spelled as in the repo)*, `controllers/dashbaord.controller.ts`, `services/dashboard.service.ts`.

### `GET /api/dashboard/summary`
- **Auth**: Required
- **Logic** (`getDashboardSummary`): in parallel, (a) syncs crypto prices if the oldest cached price is ≥5 minutes old, and (b) resolves the caller's currency context; then fetches all holdings (same enrichment as `GET /api/user-assets`) and sums `currentValueBase`/`totalCostBase`/`profitLossBase` across them.
- **Success**: `200` — `{ success: true, message: "Dashboard summary fetched successfully", data: { baseCurrency, displayCurrency, exchangeRate, totalPortfolioValueBase, totalCostBase, totalProfitLossBase, totalPortfolioValueDisplay, totalCostDisplay, totalProfitLossDisplay, totalProfitLossPercentage, numberOfHoldings, holdings: [...] } }`. Note `holdings` here duplicates the full array `GET /api/user-assets` already returns — this endpoint is not a lightweight aggregate-only summary.
- **Errors**: `500`.

---

## Snapshots (`/api/snapshots`)

Source: `routes/snapshot.routes.ts`, `controllers/snapshot.controller.ts`, `services/snapshot.service.ts`.

### `POST /api/snapshots`
- **Auth**: Required
- **Purpose**: Manually creates/overwrites **today's** snapshot for the caller (the same function the `snapshot:daily` script calls per-user).
- **Logic**: computes `getDashboardSummary`-equivalent totals in base currency, `upsert`s into `portfolio_snapshots` on `(user_id, snapshot_date)` — safe to call repeatedly the same day.
- **Success**: `201` — `{ success: true, message: "Portfolio snapshot created successfully", data: {...} }`.
- **Errors**: `500`.

### `GET /api/snapshots`
- **Auth**: Required
- **Logic**: all of the caller's `portfolio_snapshots`, ordered by `snapshot_date` ascending. Each row's display-currency fields are computed **at read time** from the caller's **current** `preferred_currency` — not whatever currency was active the day the snapshot was taken.
- **Success**: `200` — `{ success: true, message: "Portfolio snapshots fetched successfully", data: [...] }`.
- **Errors**: `500`.

### `GET /api/snapshots/performance`
- **Auth**: Required
- **Logic**: compares the two most recent snapshots. Explicitly handles 0 snapshots (`message: "No snapshots available yet"`), exactly 1 snapshot (`message: "Only one snapshot available, no comparison yet"`), and ≥2 snapshots (computes `changeBase`, `changeDisplay`, `changePercentage`).
- **Success**: `200` — `{ success: true, message: "Snapshot performance fetched successfully", data: { latestSnapshot, previousSnapshot, changeBase, changeDisplay, changePercentage, message } }`.
- **Errors**: `500`.

---

## Profile (`/api/profile`)

Source: `routes/profile.routes.ts`, `controllers/profile.controller.ts`, `services/profile.service.ts`.

### `PATCH /api/profile/currency`
- **Auth**: Required
- **Body**: `{ currency: string }`.
- **Validation**: server uppercases/trims the value and checks it against a fixed list of 10 codes (`SUPPORTED_CURRENCIES` in `services/currency.service.ts`: `USD, NGN, EUR, GBP, GHS, KES, ZAR, CAD, AUD, JPY`). `400` if not in that list.
- **Logic**: updates `profiles.preferred_currency`.
- **Success**: `200` — `{ success: true, message: "Preferred currency updated successfully", user: {...} }`.
- **Errors**: `400` (unsupported currency), `500`.

No endpoint exists to change `full_name` or `email`.

---

## Analysis (`/api/analysis`)

Proxies to an external Flask microservice. Source: `routes/analysis.routes.ts` (contains its logic inline, unlike every other route file — no separate controller file exists for this resource), `services/analysis.service.ts`, `services/conversation.service.ts`. **Response shapes here differ from the rest of the API** (`{ error }` instead of `{ success, message }`).

### `POST /api/analysis/ask`
- **Auth**: Required, **plus** `analysisRateLimiter` (`middleware/rateLimit.middleware.ts`): 5 requests per 3-minute window, keyed per authenticated `userId`.
- **Body**: `{ question: string }` — must be a non-empty (after trim) string, else `400` `{ error: "question is required and must be a non-empty string." }`.
- **Logic**:
  1. Fetches all of the caller's enriched holdings via `getUserAssets` (this call does **not** reuse any cached currency context — it performs its own independent exchange-rate lookup).
  2. Fetches memory context: the rolling summary from `user_memory` plus any `conversations` rows not yet folded into that summary (`folded_into_summary = false`).
  3. POSTs to `${FLASK_ANALYSIS_URL}/analyze` with `{ holdings (mapped to symbol/type/market/current_value_usd/cost_usd), question, memory_summary, recent_messages }`, with a 120-second abort timeout.
  4. On success, saves the Q&A into `conversations`; if Flask returned `updated_memory`, upserts `user_memory.summary_text` and marks the referenced message `folded_into_summary = true`.
- **Success**: `200` — `{ summary: {...}, answer: string }` (shape of `summary` determined entirely by the external Flask service's response).
- **Errors**: `401` if unauthenticated (also enforced defensively inside the rate limiter's `keyGenerator`). `400` for an empty question. `500` `{ error: message }` for: a non-2xx Flask response (`"Analysis service returned {status}"`), a timeout (`"Analysis service timed out. Please try again."`), or any other fetch failure (`"Could not reach the analysis service."`).

### `GET /api/analysis/history`
- **Auth**: Required
- **Query params**: `limit` (parsed as integer, defaults to `10`, hard-capped at `50`).
- **Logic**: returns the caller's full `conversations` history (id, question, answer, created_at), most-recent-first, **unfiltered by fold status** — folded messages still appear here even though they're excluded from the AI's `recent_messages` context.
- **Success**: `200` — `{ conversations: [...] }`.
- **Errors**: `500` — `{ error: message }`.
