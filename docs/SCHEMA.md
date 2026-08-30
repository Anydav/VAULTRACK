# VaultTrack Database Schema

**No migration files, SQL files, or ORM schema definitions exist anywhere in this repository** (verified by a repository-wide search for `*.sql` and migration directories — none found). Everything below is **inferred entirely from the Supabase queries** (`.select()`, `.insert()`, `.update()`, `.upsert()`, `.eq()`, embedded relational selects) found in `Backend/src/services/*.ts`.

Confidence levels used below:
- **Confirmed via relational select** — Supabase's embedded-select syntax (e.g. selecting `accounts (...)` from `user_assets`) only works if a real foreign-key relationship exists between the tables, so these are strong signals.
- **Confirmed via `onConflict`** — an `upsert(...).onConflict("col")` call requires a real unique constraint/index on those columns to behave as intended, so these are strong signals of a unique constraint (but not proof it actually exists and is enforced — that can only be confirmed in Supabase itself).
- **Inferred** — implied by how the code uses the field (e.g. always filtering by `.eq("user_id", ...)`), but not provable from code alone.
- **Unknown / Not found in code** — column types, default values beyond what's explicitly set in an `.insert()`, nullability, and indexes are, in general, **not visible from this codebase** and are marked as such per-column where relevant.

Primary keys are assumed to be a Postgres `id` column (standard Supabase convention, referenced via `.eq("id", ...)` everywhere), but the exact type (`uuid` vs `bigint` etc.) is `Unknown / Not found in code`.

---

## `profiles`

**Purpose**: One row per user account (application user, not to be confused with the `accounts`/"Custodian" table).

| Column | Notes |
|---|---|
| `id` | Primary key (inferred). Used as the FK target from every other user-owned table. |
| `email` | Set at signup, normalized lowercase/trimmed before storage. Uniqueness is checked in application code (`signupUser` looks up by email before inserting) but no DB-level unique constraint can be confirmed from code. |
| `full_name` | Set at signup. |
| `preferred_currency` | Set to `"NGN"` at signup (`services/auth.service.ts`); updatable via `PATCH /api/profile/currency`, constrained by application code to one of `USD, NGN, EUR, GBP, GHS, KES, ZAR, CAD, AUD, JPY`. |
| `created_at` | Selected in every profile query; presumably a default-now timestamp. Default behavior: Unknown / Not found in code. |

**Relationships**: `profiles.id` ← referenced by `auth_credentials.user_id`, `accounts.user_id`, `user_assets.user_id`, `portfolio_snapshots.user_id`, `conversations.user_id`, `user_memory.user_id` (all inferred from `.eq("user_id", ...)` usage; none of these are relational-select-confirmed since `profiles` is never embedded into another table's select in the code found).

---

## `auth_credentials`

**Purpose**: Stores password hashes separately from `profiles`, so a `select("*")` or over-broad select on `profiles` can never accidentally expose a password hash.

| Column | Notes |
|---|---|
| `user_id` | FK to `profiles.id` (inferred — set from `profile.id` at insert time in `signupUser`). |
| `password_hash` | bcrypt hash, cost factor `10`. |

No `id`, `created_at`, or other columns are referenced anywhere in the code for this table.

---

## `accounts`

**Purpose**: A place a user holds assets — labeled "Custodian" in the frontend, but this table and all backend code call it `account`.

| Column | Notes |
|---|---|
| `id` | Primary key (inferred). |
| `user_id` | FK to `profiles.id` (inferred via `.eq("user_id", ...)` filters). |
| `name` | Required at creation. No uniqueness enforced by application code — duplicates for the same user are allowed. |
| `account_type` | Required at creation. Free-text string in application code (e.g. `"Crypto Exchange"`, `"Brokerage"` from the frontend's preset list) — not a DB enum as far as this code shows. |
| `currency` | Optional at creation; nullable (type is `string \| null` in `types/account.ts`, and the field is optional in `CreateAccountInput`). |
| `created_at` | Used for `order("created_at", { ascending: false })` when listing. |

**Relationships**: `accounts.id` ← `user_assets.account_id` (**confirmed via relational select** — `user_assets` selects embed `accounts (id, name, account_type, currency)`).

---

## `assets`

**Purpose**: The catalog of tradable assets (crypto and NGX stocks), shared across all users — not user-specific.

| Column | Notes |
|---|---|
| `id` | Primary key (inferred). |
| `symbol` | E.g. `"BTC"`, a stock ticker. Normalized uppercase on insert. |
| `name` | Display name. |
| `asset_type` | E.g. `"crypto"`, `"stock"`. |
| `market` | `"CRYPTO"` or `"NGX"` observed in code; not restricted to only these two values by any visible constraint — any string is accepted by `GET /api/assets`'s `market` query param, it simply won't match existing rows. |
| `currency` | The asset's native currency (e.g. `"USD"` for crypto, `"NGN"` for NGX stocks). |
| `external_id` | Nullable. CoinGecko coin id, only populated for crypto assets discovered via search. |
| `created_at` | Selected implicitly via `*`-style creation flows; not explicitly used for ordering anywhere found. |

**Unique constraint (confirmed via `onConflict`)**: `(symbol, market)` — used in both the CoinGecko-discovery upsert (`asset.service.ts`) and the NGX seed upsert (`ngxSeed.service.ts`).

**Relationships**: `assets.id` ← `user_assets.asset_id` (**confirmed via relational select**) and ← `asset_prices.asset_id` (**confirmed via relational select** — `assets` selects embed `asset_prices (...)`).

---

## `asset_prices`

**Purpose**: Despite the plural name and a `price_time` column, this behaves as a **single latest-price cache per asset**, not a price history/time-series table.

| Column | Notes |
|---|---|
| `id` | Primary key (inferred; selected in some queries). |
| `asset_id` | FK to `assets.id`. |
| `price` | Numeric. Always stored in the app's base currency (`USD`) — every write path converts into base currency before insert. |
| `currency` | Observed to always be written as the base currency value. |
| `source` | `"coingecko"` or `"mansa"` depending on which sync path wrote it. |
| `price_time` | ISO timestamp of when the price was fetched. |

**Unique constraint (confirmed via `onConflict`)**: `asset_id` — both `syncCryptoPrices` and `syncStockPrices`/`seedNgxAssets` upsert with `onConflict: "asset_id"`, meaning each asset has **at most one** row here at any time; a new sync overwrites the previous price rather than appending a history row.

---

## `user_assets`

**Purpose**: A user's holding of a specific asset inside a specific account. Referred to as "holdings" in application code/comments.

| Column | Notes |
|---|---|
| `id` | Primary key (inferred). |
| `user_id` | FK to `profiles.id` (inferred). |
| `account_id` | FK to `accounts.id` (**confirmed via relational select**). Ownership of the account is checked in application code before insert, but not re-validated on read. |
| `asset_id` | FK to `assets.id` (**confirmed via relational select**). No application-level existence check before insert — relies on a DB-level FK constraint, if one exists (cannot be confirmed from code). |
| `quantity` | Numeric. `0` is an explicitly valid value per controller validation. |
| `cost_price` | Nullable. If provided with a `costCurrency`, converted into base currency before storage; if provided **without** a `costCurrency`, stored as-is with no conversion. |
| `cost_currency` | Always written as the app's base currency (`USD`) by `createUserAsset` — `cost_price` is always converted into that currency first (assumed already-`USD` if the client didn't submit a `costCurrency`), so the label is accurate. See `API.md` for detail. |
| `acquired_at` | Nullable, optional at creation. |
| `created_at` | Used for `order("created_at", { ascending: false })`. |

---

## `exchange_rates`

**Purpose**: Cached FX rates pulled from the public currency-rate API, refreshed on a staleness check (default: 60 minutes old).

| Column | Notes |
|---|---|
| `base_currency` | Uppercased currency code. |
| `target_currency` | Uppercased currency code. |
| `rate` | Numeric rate from `base_currency` to `target_currency`. |
| `rate_time` | ISO timestamp of when the rate was fetched. |

**Unique constraint (confirmed via `onConflict`)**: `(base_currency, target_currency)`.

**Relationships**: none to other tables — looked up directly by currency-code pair, not joined.

---

## `portfolio_snapshots`

**Purpose**: One row per user per calendar day, capturing total portfolio value/cost/profit-loss in base currency at that point in time.

| Column | Notes |
|---|---|
| `user_id` | FK to `profiles.id` (inferred). |
| `base_currency` | The app's base currency at the time of the snapshot. |
| `total_portfolio_value_base` | Numeric. |
| `total_cost_base` | Numeric. |
| `total_profit_loss_base` | Numeric. |
| `snapshot_date` | Date (`YYYY-MM-DD`, derived from `new Date().toISOString().split("T")[0]` — i.e. **UTC date**, not the user's local date). |

**Unique constraint (confirmed via `onConflict`)**: `(user_id, snapshot_date)` — re-running a snapshot for the same user on the same UTC day overwrites the existing row rather than duplicating it.

**Notable**: display-currency values are **not stored** — they're computed at read time from the row's base-currency fields and the reader's *current* `preferred_currency`, so historical snapshots automatically re-render in whatever currency the user prefers today.

---

## `conversations`

**Purpose**: Stores every AI Q&A turn for the `/api/analysis` feature.

| Column | Notes |
|---|---|
| `id` | Primary key (inferred; referenced directly when marking a row as folded). |
| `user_id` | FK to `profiles.id` (inferred). |
| `question` | The user's question text. |
| `answer` | The AI's answer text. |
| `folded_into_summary` | Boolean. Set `false` implicitly on insert (never explicitly set at insert time in code, so this relies on a database default of `false`), explicitly set `true` once the Flask service decides to fold that message into the rolling summary. |
| `created_at` | Used for ordering (ascending for context-building, descending for history display). |

---

## `user_memory`

**Purpose**: One rolling AI-conversation summary per user, used to keep long-running chat context bounded.

| Column | Notes |
|---|---|
| `user_id` | Primary key / unique (inferred from `onConflict: "user_id"` in the upsert — at most one memory row per user). FK to `profiles.id`. |
| `summary_text` | The rolling summary text, replaced wholesale on each fold. |
| `updated_at` | Set explicitly to `new Date().toISOString()` on every upsert. |

---

## Relationship Overview

```
profiles ──1───* accounts
   │                │
   │                │ (account_id)
   │                ▼
   ├──1───* user_assets ────*───1 assets ────1───1 asset_prices
   │                                 (asset_id)      (asset_id, onConflict unique)
   │
   ├──1───* portfolio_snapshots   (unique per user_id + snapshot_date)
   ├──1───1 auth_credentials      (password hash, kept off `profiles`)
   ├──1───* conversations
   └──1───1 user_memory            (unique per user_id)

exchange_rates            — standalone, keyed by (base_currency, target_currency), not FK-linked to anything
```

Everything drawn as `*` (one-to-many) or `1` (one-to-one/unique) above reflects either a **confirmed relational-select** relationship or an **`onConflict`-confirmed** unique constraint, as noted per-table. Anything not explicitly marked "confirmed" in a table's section above is an inference from consistent `.eq("user_id", ...)`-style filtering in the code, not a proven database constraint.
