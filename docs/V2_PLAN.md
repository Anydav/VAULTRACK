# VAULTRACK v2 Plan

_As of 2026-10-17_

## Overview

v2 takes VAULTRACK from a web MVP to a native mobile app that fills itself: CSV import, automatic exchange sync, and cash and savings alongside crypto and NGX stocks.

- **v1** is the built MVP (web app, Node backend, Flask AI service). The other docs in this folder describe v1.
- **v2** adds the four features below and fixes what the v1 review found. The AI gets fixes only.
- **Tasks** are tracked in the main [Tasks](https://app.notion.com/p/b9fe1795a15b4711b8f737861441528c) database in Notion, filtered to Project = VAULTRACK. This doc holds scope; Notion holds the work.

## Milestones

v2 ships **Fri 30 Oct 2026**. All bugs are fixed before any feature work starts. The day-by-day schedule lives in Notion (Due dates + Calendar view); this is the summary.

| Dates | Phase |
| --- | --- |
| Sun 18 – Wed 21 Oct | **Bugs:** fix all 11; app works on Chrome and Safari |
| Thu 22 – Sat 24 Oct | **Groundwork:** migrations in repo, transactions model, edit/delete |
| Sun 25 – Thu 29 Oct | **Features:** mobile login + cash and savings, basic mobile app, CSV import |
| Fri 30 Oct | Final testing and release |

The schedule has no spare days. If something overruns, CSV import slips first.

## Committed features

These four are the v2 scope. Exchange sync moves **after 30 Oct** (one person, 13 days); CSV import covers getting trades in until then. The mobile app ships as a basic version: login, dashboard and holdings, read-only.

| # | Feature | What it means | Depends on |
| --- | --- | --- | --- |
| 1 | Native mobile app | A real iOS/Android app, not a PWA, using the same backend API. | Login working off-browser (cookie auth today), edit/delete endpoints |
| 2 | CSV import | Upload a CSV of holdings or transactions and map its columns into VAULTRACK. | Transactions model |
| 3 | Automatic exchange sync | Connect an exchange with a read-only API key; balances and trades pull in on a schedule. | Transactions model, encrypted key storage, scheduled jobs |
| 4 | Cash and savings | Track cash and savings balances (any of the 10 currencies) next to crypto and NGX. | Asset model that supports non-market assets |

## Fixes and groundwork

The v1 review found 24 items: 11 bugs, 8 missing pieces, 5 chores. All are in Notion; these are the ones the features above need first.

- **Transactions model:** CSV import and exchange sync both bring in buys and sells, so this is decided before either.
- **Edit and delete** for holdings and accounts.
- **Auth that works on mobile and Safari:** cross-site cookies break today; the Supabase Auth decision settles this.
- **Schema migrations in the repo** and **scheduled jobs in the repo**, since exchange sync adds a new job.
- **AI: fixes only.** Lock down the `/analyze` endpoint, fix the timeout mismatch, keep answers when the memory step fails, and show real errors.

## Transactions model (decided 2026-10-17)

Transactions are the source of truth. Holdings are calculated from them.

- **New `transactions` table**: one row per event, with `type` (buy, sell, deposit, withdrawal, dividend, interest, fee, transfer_in, transfer_out), `quantity`, `price_per_unit` + `price_currency` (the currency actually paid), `fx_rate_to_usd` (the rate on the trade date), `fee`, `occurred_at`, `source` (manual / csv / exchange name), `external_id` (unique per account + source to block duplicates on re-import or re-sync) and `import_batch_id` (to undo a CSV import).
- **`user_assets` becomes a derived cache**: it's recalculated for an account + asset whenever that pair's transactions change. Dashboard, snapshots and AI keep reading it as today.
- **Base currency stays USD.** All conversions still go through USD (e.g. NGN display ↔ EUR asset goes NGN → USD → EUR). New: the original price and currency are kept on each transaction, along with the USD rate on the trade date, so a past purchase's USD cost never changes when exchange rates move.
- **Cost basis: average cost.**
- **Cash is independent**: buys and sells don't move cash balances. Cash and savings use deposit / withdrawal / interest.
- **Transfers between your own accounts**: a linked `transfer_out` + `transfer_in` pair that carries the cost basis over and doesn't count as new money invested.
- **No direct quantity edits**: users edit or delete transactions, and holdings update.
- **Deposits vs market growth**: add `net_invested_base` to `portfolio_snapshots`.
- **Migration**: each existing `user_assets` row becomes one `buy` transaction (recorded in USD, since v1 didn't keep the original currency).

## Optional features

Good ideas we may pick up once the committed four ship. None are scheduled.

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
- **A PWA.** The mobile app is native.

## Open decisions

Each one is settled when we reach the task that needs it, not up front.

- [x] Transactions model: decided, see "Transactions model" above.
- [ ] Switch to Supabase Auth, or keep custom JWT and add token auth for mobile?
- [ ] Mobile stack: React Native/Expo (reuses our TypeScript/React) or Flutter?
- [ ] Which exchanges to support first (e.g. Binance, Bybit, Quidax)?
- [ ] CSV import: our own template only, or also exchange/broker export formats?
- [ ] Cash and savings: plain balances only, or interest rates and maturity dates too?
