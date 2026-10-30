# VAULTRACK v2 Plan

_As of 2026-10-29_

## Overview

v2 makes the VAULTRACK web app solid and usable on phones, and moves holdings onto a transactions model that later features (CSV import, exchange sync, cash and savings) build on.

- **v1** is the built MVP (web app, Node backend, Flask AI service). The other docs in this folder describe v1.
- **v2** fixes what the v1 review found, adds the transactions model with edit/delete, and makes the web app work on phone screens. The AI gets fixes only.
- **Tasks** are tracked in the main [Tasks](https://app.notion.com/p/b9fe1795a15b4711b8f737861441528c) database in Notion, filtered to Project = VAULTRACK. This doc holds scope; Notion holds the work.

## Milestones

v2 ships **Fri 30 Oct 2026**. All bugs are fixed before any feature work starts. The day-by-day schedule lives in Notion (Due dates + Calendar view); this is the summary.

| Dates | Phase |
| --- | --- |
| Sun 18 – Wed 21 Oct | **Bugs:** fix all 11; app works on Chrome and Safari |
| Thu 22 – Sat 24 Oct | **Groundwork:** migrations in repo, transactions model, edit/delete |
| Sun 25 – Thu 29 Oct | **Features:** mobile responsiveness (web app on phone screens) |
| Fri 30 Oct | Final testing and release |

The schedule has no spare days. CSV import and cash and savings were cut from v2 on 29 Oct (see "Moved out of v2").

## Committed features

| # | Feature | What it means | Depends on |
| --- | --- | --- | --- |
| 1 | Transactions model | Buys, sells and other events are stored as transactions; holdings are calculated from them (see below). | Schema migrations in the repo |
| 2 | Edit and delete | Edit or delete transactions and accounts; holdings update to match. | Transactions model |
| 3 | Mobile responsiveness | The existing web app works on a real phone browser against the live site: login, dashboard, holdings, transactions. | Login working on Safari (done, PR #3) |

## Moved out of v2

| Feature | Decision |
| --- | --- |
| Native mobile app | Dropped from v2 on 25 Oct; replaced by mobile responsiveness above. |
| CSV import | Moved to v3 on 29 Oct. |
| Cash and savings | Moved to v3 on 29 Oct. |
| Automatic exchange sync | Moved after 30 Oct (one person, 13 days). |

## Fixes and groundwork

The v1 review found 24 items: 11 bugs, 8 missing pieces, 5 chores. All are in Notion; these are the ones the features above need first.

- **Transactions model:** CSV import and exchange sync both bring in buys and sells, so this is decided before either.
- **Edit and delete** for holdings and accounts.
- **Auth that works on mobile and Safari:** fixed in PR #3 by routing the API through Vercel so the login cookie is first-party. The Supabase Auth decision is still open.
- **Schema migrations in the repo** (with row-level security) before the transactions model. **Scheduled jobs in the repo** is in the backlog; exchange sync will need it.
- **AI: fixes only.** Lock down the `/analyze` endpoint, fix the timeout mismatch, keep answers when the memory step fails, and show real errors.

## Transactions model (decided 2026-10-17)

Transactions are the source of truth. Holdings are calculated from them.

- **New `transactions` table**: one row per event, with `type` (buy, sell, deposit, withdrawal, dividend, interest, transfer_in, transfer_out), `quantity`, `price_per_unit` + `price_currency` (the currency actually paid), `fx_rate_to_usd` (the rate on the trade date), `occurred_at`, `source` (manual / csv / exchange name), `external_id` (unique per account + source to block duplicates on re-import or re-sync) and `import_batch_id` (to undo a CSV import).
- **`user_assets` becomes a derived cache**: it's recalculated for an account + asset whenever that pair's transactions change. Dashboard, snapshots and AI keep reading it as today.
- **Base currency stays USD.** All conversions still go through USD (e.g. NGN display ↔ EUR asset goes NGN → USD → EUR). New: the original price and currency are kept on each transaction, along with the USD rate on the trade date, so a past purchase's USD cost never changes when exchange rates move.
- **Cost basis: average cost.**
- **No fees**: the app doesn't record trading fees (decided 2026-10-30).
- **Cash is independent**: buys and sells don't move cash balances. Cash and savings use deposit / withdrawal / interest.
- **Transfers between your own accounts**: a linked `transfer_out` + `transfer_in` pair that carries the cost basis over and doesn't count as new money invested.
- **No direct quantity edits**: users edit or delete transactions, and holdings update.
- **Deposits vs market growth**: add `net_invested_base` to `portfolio_snapshots`.
- **Migration**: each existing `user_assets` row becomes one `buy` transaction (recorded in USD, since v1 didn't keep the original currency).

## Optional features

Good ideas we may pick up once v2 ships. None are scheduled.

| Feature | What it means |
| --- | --- |
| More asset types | US stocks and ETFs, T-bills and fixed income, manually valued assets like property |
| NGX dividends | Track dividends received and upcoming |
| Watchlist | Follow assets you don't own yet |
| Performance charts | Time ranges: 1W, 1M, 1Y, all time |
| Benchmark comparison | Your returns vs the NGX All-Share Index or BTC |
| Goals | A target like "₦10M by Dec 2027" with progress tracking |
| Price alerts | Email or push notification when a price crosses a level |
| Exportable reports | Portfolio reports as PDF or CSV |

## Out of scope

- **New AI features.** No weekly AI summaries, rebalancing suggestions or extra AI context in v2.
- **A native mobile app or PWA.** v2 makes the web app responsive instead.

## Open decisions

Each one is settled when we reach the task that needs it, not up front.

- [x] Transactions model: decided, see "Transactions model" above.
- [ ] Switch to Supabase Auth, or keep custom JWT and add token auth for mobile?
- [ ] Mobile stack, if a native app comes back after v2: React Native/Expo (reuses our TypeScript/React) or Flutter?
- [ ] Which exchanges to support first (e.g. Binance, Bybit, Quidax)? (after v2)
- [ ] CSV import: our own template only, or also exchange/broker export formats? (v3)
- [ ] Cash and savings: plain balances only, or interest rates and maturity dates too? (v3)
