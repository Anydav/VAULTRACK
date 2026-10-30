# VaultTrack Database Schema

The schema lives in `Backend/supabase/migrations/`. `20261001000000_baseline_schema.sql` is the v1 schema,
copied from the production database's catalog on 2026-10-29; later migrations change it from there.
Every table's primary key is a `uuid` with default `gen_random_uuid()` (except `user_memory`, keyed by `user_id`).
All foreign keys and unique constraints below are real database constraints.

---

## `profiles`

**Purpose**: One row per user account (application user, not to be confused with the `accounts`/"Custodian" table).

| Column | Notes |
|---|---|
| `id` | Primary key. Used as the FK target from every other user-owned table. |
| `email` | Set at signup, normalized lowercase/trimmed before storage. Unique (`profiles_email_key`); `signupUser` also checks for an existing email before inserting. |
| `full_name` | Set at signup. Nullable. |
| `preferred_currency` | Defaults to `'NGN'`; set to `"NGN"` at signup (`services/auth.service.ts`); updatable via `PATCH /api/profile/currency`, constrained by application code to one of `USD, NGN, EUR, GBP, GHS, KES, ZAR, CAD, AUD, JPY`. |
| `created_at` | Defaults to `now()`. |
| `updated_at` | Kept current by the `trg_profiles_updated_at` trigger. |

**Relationships**: `profiles.id` ← referenced by `auth_credentials.user_id`, `accounts.user_id`, `user_assets.user_id`, `portfolio_snapshots.user_id`, `conversations.user_id`, `user_memory.user_id` and `transactions.user_id`. Deleting a profile cascades to all of these except `accounts` and `transactions`, which block the delete.

---

## `auth_credentials`

**Purpose**: Stores password hashes separately from `profiles`, so a `select("*")` or over-broad select on `profiles` can never accidentally expose a password hash.

| Column | Notes |
|---|---|
| `id` | Primary key. Not used by the code. |
| `user_id` | FK to `profiles.id`, on delete cascade. Unique: one password per user. |
| `password_hash` | bcrypt hash, cost factor `10`. |
| `created_at`, `updated_at` | Default `now()`. No trigger, so `updated_at` doesn't change on update. |

---

## `accounts`

**Purpose**: A place a user holds assets — labeled "Custodian" in the frontend, but this table and all backend code call it `account`.

| Column | Notes |
|---|---|
| `id` | Primary key. |
| `user_id` | FK to `profiles.id` (no cascade). |
| `name` | Required at creation. No uniqueness enforced by application code — duplicates for the same user are allowed. |
| `account_type` | Required at creation. Free-text string in application code (e.g. `"Crypto Exchange"`, `"Brokerage"` from the frontend's preset list) — not a DB enum as far as this code shows. |
| `currency` | Optional at creation; nullable (type is `string \| null` in `types/account.ts`, and the field is optional in `CreateAccountInput`). |
| `created_at` | Used for `order("created_at", { ascending: false })` when listing. |
| `updated_at` | Kept current by the `trg_accounts_updated_at` trigger. |

**Relationships**: `accounts.id` ← `user_assets.account_id` (on delete cascade) and ← `transactions.account_id` (no cascade). `user_assets` selects embed `accounts (id, name, account_type, currency)`.

---

## `assets`

**Purpose**: The catalog of tradable assets (crypto and NGX stocks), shared across all users — not user-specific.

| Column | Notes |
|---|---|
| `id` | Primary key. |
| `symbol` | E.g. `"BTC"`, a stock ticker. Normalized uppercase on insert. |
| `name` | Display name. |
| `asset_type` | E.g. `"crypto"`, `"stock"`. |
| `market` | `"CRYPTO"` or `"NGX"` observed in code; not restricted to only these two values by any visible constraint — any string is accepted by `GET /api/assets`'s `market` query param, it simply won't match existing rows. |
| `currency` | The asset's native currency (e.g. `"USD"` for crypto, `"NGN"` for NGX stocks). |
| `external_id` | Nullable. CoinGecko coin id, only populated for crypto assets discovered via search. |
| `created_at` | Defaults to `now()`. Not used for ordering. |
| `updated_at` | Kept current by the `trg_assets_updated_at` trigger. |

**Unique constraint**: `(market, external_id)` (`assets_market_external_id_unique`) — the `onConflict` target in both the CoinGecko-discovery upsert (`asset.service.ts`) and the NGX seed upsert (`ngxSeed.service.ts`). `(symbol, market)` has a plain index only, not a unique one.

**Relationships**: `assets.id` ← `user_assets.asset_id` (on delete cascade), ← `asset_prices.asset_id` (no cascade) and ← `transactions.asset_id` (no cascade). `assets` selects embed `asset_prices (...)`.

---

## `asset_prices`

**Purpose**: Despite the plural name and a `price_time` column, this behaves as a **single latest-price cache per asset**, not a price history/time-series table.

| Column | Notes |
|---|---|
| `id` | Primary key. |
| `asset_id` | FK to `assets.id` (no cascade). |
| `price` | Numeric. Always stored in the app's base currency (`USD`) — every write path converts into base currency before insert. |
| `currency` | Observed to always be written as the base currency value. |
| `source` | `"coingecko"` or `"mansa"` depending on which sync path wrote it. |
| `price_time` | ISO timestamp of when the price was fetched. |

**Unique constraint**: `asset_id` (`asset_prices_asset_id_unique`) — both `syncCryptoPrices` and `syncStockPrices`/`seedNgxAssets` upsert with `onConflict: "asset_id"`, meaning each asset has **at most one** row here at any time; a new sync overwrites the previous price rather than appending a history row.

---

## `user_assets`

**Purpose**: A user's holding of a specific asset inside a specific account. Referred to as "holdings" in application code/comments.

Since v2 this is a **cache rebuilt from `transactions`**: the `recalculate_holding` database function rewrites the row whenever one of that account + asset's transactions is added, edited or deleted. Application code never writes it directly. There is at most one row per account + asset (`user_assets_account_asset_unique`), and a fully sold holding has no row.

| Column | Notes |
|---|---|
| `id` | Primary key. |
| `user_id` | FK to `profiles.id`, on delete cascade. |
| `account_id` | FK to `accounts.id`, on delete cascade. Ownership of the account is checked in application code before insert, but not re-validated on read. |
| `asset_id` | FK to `assets.id`, on delete cascade. No application-level existence check before insert; the FK rejects unknown assets. |
| `quantity` | Numeric, `>= 0`. Buys minus sells. Always `> 0` in practice, because a fully sold holding is removed. |
| `cost_price` | Average cost per unit in USD: the total USD cost of what's held ÷ `quantity`. A sell removes its share of cost, so it doesn't change the average. |
| `cost_currency` | Always `USD`. |
| `acquired_at` | Date of the first buy since the holding was last fully sold. |
| `created_at` | Used for `order("created_at", { ascending: false })`. |
| `updated_at` | Set by `recalculate_holding` on every rebuild. |

---

## `exchange_rates`

**Purpose**: Cached FX rates pulled from the public currency-rate API, refreshed on a staleness check (default: 60 minutes old).

| Column | Notes |
|---|---|
| `base_currency` | Uppercased currency code. |
| `target_currency` | Uppercased currency code. |
| `rate` | Numeric rate from `base_currency` to `target_currency`. |
| `rate_time` | ISO timestamp of when the rate was fetched. |

**Unique constraint**: `(base_currency, target_currency)` (`unique_base_target`).

**Relationships**: none to other tables — looked up directly by currency-code pair, not joined.

---

## `portfolio_snapshots`

**Purpose**: One row per user per calendar day, capturing total portfolio value/cost/profit-loss in base currency at that point in time.

| Column | Notes |
|---|---|
| `user_id` | FK to `profiles.id`, on delete cascade. |
| `base_currency` | The app's base currency at the time of the snapshot. Defaults to `'USD'`. |
| `total_portfolio_value_base` | Numeric. |
| `total_cost_base` | Numeric. |
| `total_profit_loss_base` | Numeric. |
| `net_invested_base` | Numeric, nullable. What the user's buys cost minus what their sells brought in, in USD, so charts can separate money put in from market growth. Empty for snapshots taken before v2. |
| `snapshot_date` | Date (`YYYY-MM-DD`, derived from `new Date().toISOString().split("T")[0]` — i.e. **UTC date**, not the user's local date). |

**Unique constraint**: `(user_id, snapshot_date)` (`unique_user_snapshot`) — re-running a snapshot for the same user on the same UTC day overwrites the existing row rather than duplicating it.

**Notable**: display-currency values are **not stored** — they're computed at read time from the row's base-currency fields and the reader's *current* `preferred_currency`, so historical snapshots automatically re-render in whatever currency the user prefers today.

---

## `conversations`

**Purpose**: Stores every AI Q&A turn for the `/api/analysis` feature.

| Column | Notes |
|---|---|
| `id` | Primary key; referenced directly when marking a row as folded. |
| `user_id` | FK to `profiles.id`, on delete cascade. |
| `question` | The user's question text. |
| `answer` | The AI's answer text. |
| `folded_into_summary` | Boolean, defaults to `false` (the insert relies on this default), explicitly set `true` once the Flask service decides to fold that message into the rolling summary. |
| `created_at` | Used for ordering (ascending for context-building, descending for history display). |

---

## `user_memory`

**Purpose**: One rolling AI-conversation summary per user, used to keep long-running chat context bounded.

| Column | Notes |
|---|---|
| `user_id` | Primary key (the `onConflict: "user_id"` upsert target — at most one memory row per user). FK to `profiles.id`, on delete cascade. |
| `summary_text` | The rolling summary text, replaced wholesale on each fold. |
| `updated_at` | Set explicitly to `new Date().toISOString()` on every upsert. |

---

## `transactions`

**Purpose**: One row per buy or sell. The source of truth for holdings (see `user_assets`).

| Column | Notes |
|---|---|
| `user_id` | FK to `profiles.id` (no cascade). |
| `account_id` | FK to `accounts.id` (no cascade). |
| `asset_id` | FK to `assets.id`. Required for `buy`, `sell`, `transfer_in`, `transfer_out`. |
| `type` | One of `buy`, `sell`, `deposit`, `withdrawal`, `dividend`, `interest`, `transfer_in`, `transfer_out`. Only `buy` and `sell` are created by the app today. |
| `quantity` | Numeric, `> 0` for buys, sells and transfers. |
| `price_per_unit` | Numeric, `>= 0`, in `price_currency`. |
| `price_currency` | The currency actually paid, e.g. `NGN`. |
| `fx_rate_to_usd` | `> 0`. USD per 1 unit of `price_currency`, saved when the transaction is recorded. USD cost = `quantity × price_per_unit × fx_rate_to_usd`. |
| `occurred_at` | When the trade happened. Holdings are rebuilt in this order. |
| `source` | `manual` (default); later `csv` or an exchange name. |
| `external_id` | Nullable. Unique per `(account_id, source, external_id)` to block duplicate imports. Unused today. |
| `import_batch_id` | Nullable. Groups a CSV import so it can be undone. Unused today. |
| `transfer_id` | Nullable. Links the two halves of a transfer. Unused today. |
| `notes` | Free text. Holdings migrated from v1 say `Migrated from v1 holding <id>`. |
| `created_at`, `updated_at` | `updated_at` is kept current by `trg_transactions_updated_at`. |

**Trigger**: `trg_transactions_recalculate_holding` calls `recalculate_holding(account_id, asset_id)` after every insert, update or delete, for both the old and new pair if an edit moves a transaction. If the rebuild finds a sell bigger than what was held at that date, it raises "Cannot sell …" and the change is rejected.

**No fees**: the app doesn't record trading fees.

**Migration from v1** (`20261030000000_transactions_model.sql`): each v1 `user_assets` row became one `buy` in USD, and duplicate rows for the same account + asset were merged, keeping the oldest row's id. The v1 rows are kept in `user_assets_v1_backup`, which has RLS on; drop it once v2 is settled.

---

## Row-level security

RLS is on for every table, with no policies (`20261029000000_enable_rls.sql`). The backend uses the
secret (service_role) key, which bypasses RLS; requests with the anon key see nothing.

---

## Relationship Overview

```
profiles ──1───* accounts ──1───* transactions (also linked to profiles and assets)
   │                │
   │                │ (account_id)
   │                ▼
   ├──1───* user_assets ────*───1 assets ────1───1 asset_prices
   │        (rebuilt from transactions; unique per account_id + asset_id)
   │                                 (asset_id)      (unique per asset_id)
   │
   ├──1───* portfolio_snapshots   (unique per user_id + snapshot_date)
   ├──1───1 auth_credentials      (password hash, kept off `profiles`)
   ├──1───* conversations
   └──1───1 user_memory            (unique per user_id)

exchange_rates            — standalone, keyed by (base_currency, target_currency), not FK-linked to anything
```
