# VAULTRACK v2 Plan

_Shipped 2026-11-01_

## Status

**v2 shipped on Sun 1 Nov 2026** (`main` at `f336ac8`, live at https://vaultrack.vercel.app), tested by David on the live site.

- All three committed features are done (PRs listed in "Committed features" below).
- Before the mobile work, a UI pass added shared Card / Button / PageHeader components, tabs on History, Custodian and Asset pages, and log out in the profile menu (PRs #16, #17).
- **Still open, both AI fixes from "Fixes and groundwork":** lock down the `/analyze` endpoint, and keep the AI answer when the memory step fails. Both are blocked until a teammate with access to the AI service on Render is available; they ship as a follow-up, not a new version.

## Overview

v2 makes the VAULTRACK web app solid and usable on phones, and moves holdings onto a transactions model that later features (CSV import, exchange sync, cash and savings) build on.

- **v1** is the built MVP (web app, Node backend, Flask AI service). The other docs in this folder describe v1.
- **v2** fixes what the v1 review found, adds the transactions model with edit/delete, and makes the web app work on phone screens. The AI gets fixes only.
- **Tasks** are tracked in the main [Tasks](https://app.notion.com/p/b9fe1795a15b4711b8f737861441528c) database in Notion, filtered to Project = VAULTRACK. This doc holds scope; Notion holds the work.

## Milestones

v2 was planned for **Fri 30 Oct 2026** and shipped **Sun 1 Nov 2026**, two days late. All bugs were fixed before feature work started. The planned schedule:

| Dates | Phase |
| --- | --- |
| Sun 18 – Wed 21 Oct | **Bugs:** fix all 11; app works on Chrome and Safari |
| Thu 22 – Sat 24 Oct | **Groundwork:** migrations in repo, transactions model, edit/delete |
| Sun 25 – Thu 29 Oct | **Features:** mobile responsiveness (web app on phone screens) |
| Fri 30 Oct | Final testing and release |

CSV import and cash and savings were cut from v2 on 29 Oct (see "Moved out of v2").

## Committed features

All three are done.

| # | Feature | What it means | Done in |
| --- | --- | --- | --- |
| 1 | Transactions model | Buys, sells and other events are stored as transactions; holdings are calculated from them (see below). | PR #11 (schema migrations first, PR #10) |
| 2 | Edit, sell and remove | Edit accounts; record sells; remove accounts and transactions without erasing them. A History page lists every transaction. Holdings update to match (see "Edit, sell and remove" below). | PRs #12, #13 (API), #15 (UI) |
| 3 | Mobile responsiveness | The existing web app works on a real phone browser against the live site: login, dashboard, holdings, transactions. | PRs #18 (slide-out menu), #19 (table rows as cards), #20 (page pass, currency symbols) |

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
- **Edit, sell and remove** for accounts and transactions.
- **Auth that works on mobile and Safari:** fixed in PR #3 by routing the API through Vercel so the login cookie is first-party. The Supabase Auth decision is still open.
- **Schema migrations in the repo** (with row-level security) before the transactions model. **Scheduled jobs in the repo** is in the backlog; exchange sync will need it.
- **AI: fixes only.** Lock down the `/analyze` endpoint, fix the timeout mismatch, keep answers when the memory step fails, and show real errors. The timeout (PR #7) and real errors (PR #6) are fixed; the `/analyze` lock-down and memory-step fix are still open (see "Status").

## Transactions model (decided 2026-10-17)

Transactions are the source of truth. Holdings are calculated from them.

- **New `transactions` table**: one row per event, with `type` (buy, sell, deposit, withdrawal, dividend, interest, transfer_in, transfer_out), `quantity`, `price_per_unit` + `price_currency` (the currency actually paid), `fx_rate_to_usd` (the rate on the trade date), `occurred_at`, `source` (manual / csv / exchange name), `external_id` (unique per account + source to block duplicates on re-import or re-sync) and `import_batch_id` (to undo a CSV import).
- **`user_assets` becomes a derived cache**: it's recalculated for an account + asset whenever that pair's transactions change. Dashboard, snapshots and AI keep reading it as today.
- **Base currency stays USD.** All conversions still go through USD (e.g. NGN display ↔ EUR asset goes NGN → USD → EUR). New: the original price and currency are kept on each transaction, along with the USD rate on the trade date, so a past purchase's USD cost never changes when exchange rates move.
- **Cost basis: average cost.**
- **No fees**: the app doesn't record trading fees (decided 2026-10-30).
- **Cash is independent**: buys and sells don't move cash balances. Cash and savings use deposit / withdrawal / interest.
- **Transfers between your own accounts**: a linked `transfer_out` + `transfer_in` pair that carries the cost basis over and doesn't count as new money invested.
- **No direct quantity edits**: users add, sell or remove transactions, and holdings update. Transactions can't be edited (changed 2026-11-01, see below).
- **Deposits vs market growth**: add `net_invested_base` to `portfolio_snapshots`.
- **Migration**: each existing `user_assets` row becomes one `buy` transaction (recorded in USD, since v1 didn't keep the original currency).

## Edit, sell and remove (decided 2026-11-01)

Nothing is erased. Removing marks a row as removed, so the History page can still show it. This replaces the delete behaviour merged in PR #12.

| | Add | Edit | Sell | Remove |
| --- | --- | --- | --- | --- |
| Custodian (account) | Yes | Name, type, currency | – | Yes, marked removed |
| Transaction | Yes (buy) | No | Yes | Yes, marked removed |

- **Sell vs remove.** Sell records a real sale: the trade happened and you got money for it (partial sells allowed, profit and net invested stay correct). Remove means "this never happened": use it only to undo a transaction entered by mistake. To fix a typo, remove the wrong transaction and add the right one.
- **Removing a custodian** takes it and its holdings out of the Dashboard, Portfolio, sidebar and totals. Its transactions are kept and still appear in History.
- **History page** reads from `transactions` (joined to `accounts` and `assets`), including removed rows. It only lists transactions; account changes (create, rename, remove) are not recorded. Account names are always the current name. Transactions and snapshots are separate tabs (PR #16).
  ```
  Date    Type  Asset  Qty  Price      Custodian
  2 Nov   Sell  BTC    0.2  $30,000    Binance (removed)
  31 Oct  Buy   BTC    0.3  $20,000    Binance (removed)
  29 Oct  Buy   ETH    0.5  $2,400     Bybit        Removed
  ```
  "(removed)" after a custodian = the account was removed. "Removed" on a row = that transaction was removed.

**Backend changes**
1. Migration: add `removed_at` to `accounts` and `transactions`.
2. The holdings calculation skips removed transactions and transactions on removed accounts.
3. Removing an account sets `removed_at` and clears its holdings (`delete_account` stops deleting rows).
4. Removing a transaction sets `removed_at` (the same "a later sell needs this buy" check still applies).
5. Drop `PATCH /api/transactions/:id`.
6. `GET /api/accounts` returns only active accounts; new transactions on a removed account are refused. `GET /api/transactions` includes removed rows, flagged.

**Frontend changes**
- Custodian page: Edit and Remove custodian; a Sell button on each holding; a transactions list with Remove on each row.
- History page: Transactions and Snapshots tabs.
- Asset page (`/assets/<asset id>`, added 2026-11-01): one page per asset, combining every custodian that holds it. Shows how much you hold, % of portfolio, value, average cost and profit; a "Held in" breakdown by custodian with Sell on each; Sell and "+ Add more" buttons; this asset's transactions with Remove. Asset names in tables and the sidebar link here. **No price chart in v2:** we only store the latest price, so the chart waits for price history ("Store price history per asset" in the backlog).
- **The UI must say when to use Sell and when to use Remove:**
  - Sell form, under the title: "Record a sale you made. This counts toward your profit."
  - Remove transaction confirmation: "Only remove a transaction you entered by mistake. It will be treated as if it never happened. If you sold this asset, use Sell instead." with buttons "Remove" and "Record a sale instead" (opens the Sell form).
  - Remove custodian confirmation: "Remove Binance? Its holdings leave your portfolio and totals. Its 5 transactions stay in History."

## Optional features

Good ideas we may pick up now that v2 has shipped. None are scheduled.

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
