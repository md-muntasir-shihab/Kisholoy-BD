# PHASE 1 — Inventory: Summary & Findings

_Date: 2026-09-04 · Generator: `node scripts/audit/build-inventory.mjs` (re-runnable, static analysis only)_

## Artifacts produced

| # | Artifact | Contents |
|---|---|---|
| 1A | [`INVENTORY-functions.csv`](./INVENTORY-functions.csv) | **255 user-triggered admin functions** across 21 routed modules + 26 shared admin components. 14 columns: section, module, route, file:line, function, UI trigger, purpose, APIs called, context read/written, localStorage writes, audit-log emission, notification emission, RBAC permission. |
| 1B | [`INVENTORY-api.csv`](./INVENTORY-api.csv) | **272 server routes** × engines used, mutated entities, calling client files, in-handler auth, WIRED/ORPHAN status. |
| 1B+ | [`INVENTORY-orphans.md`](./INVENTORY-orphans.md) | 52 orphan endpoints + 3 orphan admin components, as a decision table. |
| 1C | [`INVENTORY-dataflow.md`](./INVENTORY-dataflow.md) | 14 core entities: source of truth → writers → readers → client mirror → admin/storefront UIs → **obligatory side-effects** (these become PHASE 2/3 pass criteria). |

## Headline numbers

| Metric | Value |
|---|---|
| Admin functions inventoried | **255** |
| — `sales-operations` | 52 |
| — `catalog-inventory` | 29 |
| — `customer-management` | 13 |
| — `system-administration` | 47 |
| — shared admin components (modals/views) | 93 |
| — **unrouted modules** (PromotionsAdmin / ReturnsAdmin / RefundsAdmin) | **21** |
| Functions that never touch the server | **149 / 255 (58%)** |
| Functions writing business data to localStorage | 1 (`ReturnsRefundsAdmin.saveRmaList`) |
| Truly unwired handlers | 0 (2 flagged rows are `addEventListener` callbacks — fine) |
| Server routes | **272** |
| Orphan routes (no client caller) | **52 (19%)** |
| **Mutating routes with no auth/RBAC check in handler** | **160 / 164 (98%)** |

## Wired-vs-orphan by API namespace

| Namespace | Total | Wired | Orphan |
|---|---:|---:|---:|
| `/api/admin` | 6 | 0 | **6** |
| `/api/security` | 25 | 15 | **10** |
| `/api/operations` | 8 | 2 | **6** |
| `/api/reports` | 8 | 2 | **6** |
| `/api/suppliers` | 37 | 31 | 6 |
| `/api/inventory` | 5 | 2 | **3** |
| `/api/payments` | 8 | 5 | 3 |
| `/api/marketing` | 30 | 28 | 2 |
| `/api/notifications` | 13 | 11 | 2 |
| `/api/content`, `/api/print`, `/api/promotions`, `/api/webhooks`, `/api/system`, `/api/customer`, `/api/checkout`, `/api/health` | — | — | 1 each |
| `/api/orders`, `/api/products`, `/api/categories`, `/api/customers`, `/api/finance`, `/api/fraud`, `/api/fulfillment`, `/api/warehouses`, `/api/courier` | 58 | 58 | **0** ✅ |

The core commerce loop is fully wired. The gaps cluster in **admin-side operations, security, reporting and inventory analytics**.

---

## Top findings to carry into PHASE 2/3

| # | Severity (provisional) | Finding | Evidence |
|---|---|---|---|
| 1 | **S1** | **98% of mutating endpoints have no server-side auth/RBAC guard.** Client-side `ROUTE_PERMISSIONS` is the only gate — anyone can `curl -X POST` any admin mutation. | `INVENTORY-api.csv` → `auth_in_handler=n`, 160/164 |
| 2 | **S2** | **No staff login UI exists.** `currentRole` is a plain dropdown; all 10 `/api/security/auth/*` endpoints (login/logout/verify/MFA/password reset) are orphan. The `kisholoy-auth-expired` staff gate built last round has nothing to protect yet. | `INVENTORY-orphans.md`; `AdminLayout.tsx` role `<select>` |
| 3 | **S2** | **`PromotionsAdmin` (1,323 lines, 10 functions) is unreachable** — `/admin/promotions` redirects to `/admin`. Coupons, flash deals and loyalty adjustment have no UI. `ReturnsAdmin`/`RefundsAdmin` are likewise orphaned (superseded by `ReturnsRefundsAdmin`). | `App.tsx:123`; orphan-component scan |
| 4 | **S2** | **RMA/returns data persists to `localStorage('kisholoy_rma_records')`**, while the server's `/api/admin/returns`, `/api/admin/returns/approve`, `/api/admin/refunds`, `/api/admin/refunds/process` sit unused. Returns are per-browser and invisible to other staff. | `ReturnsRefundsAdmin.tsx:200-210` |
| 5 | **S2** | **`SettingsAdmin` makes zero API calls** — store settings only mutate React context, so nothing persists and nothing reaches checkout math. | `SettingsAdmin.tsx:7` |
| 6 | **S2** | **Payment initiation half is orphan**: `/api/payments/sslcommerz/init` and `/api/payments/bkash/create` have no caller while `validate`/`execute` are wired. The prepaid checkout path needs an end-to-end trace. | `INVENTORY-api.csv` |
| 7 | **S2** | **Marketing Command Center + security state live outside `serverDb`** (private arrays in `marketingCommandCenter.ts`, `securityEngine.ts`) → almost certainly excluded from `/api/system/export` backup and restore. | `INVENTORY-dataflow.md` §0, §11, §14 |
| 8 | **S3** | **Inventory analytics endpoints orphan** (`/api/inventory/stats|transactions|export`) — InventoryAdmin derives everything from context instead of the authoritative ledger. | `INVENTORY-api.csv` |
| 9 | **S3** | **6 report endpoints orphan** (`financial-pnl`, `inventory-health`, `customer-cohorts`, `districts`, `documents/invoice`, `documents/manifest`) — ReportsAdmin only uses `analytics` + `export`. Real BI value is built but not surfaced. | `INVENTORY-api.csv` |
| 10 | **S3** | **Operations worker/DLQ controls orphan** (`worker/tick`, `worker/toggle`, `dlq/replay-all`, `dlq/purge`, `jobs/enqueue`, `jobs/retry`) — OperationsAdmin exposes only a subset. | `INVENTORY-api.csv` |
| 11 | **S3** | **Custom courier configs live in admin-browser localStorage** (`kisholoy_custom_couriers`) → not shared across staff/devices. | `AppContext.tsx:473` |
| 12 | **S3** | **Telemetry/analytics is localStorage-only** — AnalyticsAdmin reads browser storage, so "traffic & user analytics" is single-browser, not real. | `telemetryLogger.ts`, `AnalyticsAdmin.tsx:102` |
| 13 | **S3** | **58% of admin functions never call the server** — many are pure UI, but this set must be triaged in PHASE 3 to find state that *should* be persisted. | `INVENTORY-functions.csv` |
| 14 | **S3** | Potential **IDOR** on customer endpoints (`/api/customer/profile/:custId` etc. accept any id, no ownership check). | `INVENTORY-dataflow.md` §5 |
| 15 | **S4** | `PromotionsAdmin` uses 5 native `alert()` calls instead of `showToast`. | `PromotionsAdmin.tsx` |
| 16 | **S4** | `MarketingCommandCenter.tsx:1136` renders a literal "Not implemented" badge — verify whether stale. | source |

## Notes on method

- Function extraction is **brace-matched** per handler body, so "calls_api / reads_context / writes_context" reflect the actual body, not the whole file.
- Trigger detection distinguishes `onClick` / `onSubmit` / `onChange` / `prop:onX` (passed to a child) / `called internally` / `effect`.
- Orphan detection normalises `${template}` params to `:x` before comparing client paths to server routes, so parameterised routes are matched correctly.
- Nothing was deleted or modified in application code during PHASE 1 — inventory only.

## Next

**PHASE 2 — Connectivity verification.** Walk the Expected Connectivity Matrix in
`docs/ADMIN_FULL_AUDIT_PROMPT.md` §2A/2B row by row and mark each `OK / BROKEN / MISSING / PARTIAL`
with file:line evidence, using `INVENTORY-dataflow.md`'s "obligatory side-effects" as the pass criteria.
