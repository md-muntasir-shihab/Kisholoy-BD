# PHASE 1 — Inventory: Summary & Findings

_Date: 2026-09-04 · Generator: `node scripts/audit/build-inventory.mjs` (re-runnable)_
_**Revision 2** — every finding below was re-verified against the running server with live probes.
Corrections from revision 1 are listed in [§Revision log](#revision-log)._

## Artifacts produced

| # | Artifact | Contents |
|---|---|---|
| 1A | [`INVENTORY-functions.csv`](./INVENTORY-functions.csv) | **255 user-triggered admin functions** across 21 routed modules + 26 shared components. 14 columns incl. APIs called, context read/written, localStorage writes, audit emission, notification emission, RBAC permission. |
| 1B | [`INVENTORY-api.csv`](./INVENTORY-api.csv) | **272 server routes** × engines, mutated entities, calling client files, in-handler auth, WIRED/ORPHAN. |
| 1B+ | [`INVENTORY-orphans.md`](./INVENTORY-orphans.md) | 52 orphan endpoints (**now classified** external-by-design vs unsurfaced capability) + 3 orphan components. |
| 1C | [`INVENTORY-dataflow.md`](./INVENTORY-dataflow.md) | 14 core entities: source of truth → writers → readers → client mirror → UIs → **obligatory side-effects**. |

## Headline numbers

| Metric | Value |
|---|---|
| Admin functions inventoried | **255** |
| — `sales-operations` / `catalog-inventory` / `customer-management` / `system-administration` | 52 / 29 / 13 / 47 |
| — shared admin components (modals, views) | 93 |
| — **unrouted modules** (PromotionsAdmin, ReturnsAdmin, RefundsAdmin) | **21** |
| Functions with no direct `fetch` in their body | 149 (**see caveat below**) |
| Functions writing business data to localStorage | 1 (`ReturnsRefundsAdmin.saveRmaList`) |
| Genuinely unwired handlers | **0** (2 flagged rows are `addEventListener` callbacks — correct) |
| Server routes | **272** |
| Orphan routes — no client caller | **52 (19%)**, of which **4 are external/infra by design**, **48 are unsurfaced capability** |
| **Mutating routes with no auth check in handler** | **160 / 164 (98%)** — *empirically confirmed exploitable* |
| **`serverDb` collections covered by backup snapshot** | **11 / 35 (31%)** |

> **Caveat on "149 no-API functions":** this counts functions with no `fetch` **in their own body**.
> Many legitimately delegate to `AppContext` helpers (e.g. `ProductsAdmin.handleSave` → `addProduct()` → `POST /api/products`).
> It is a **triage list, not a defect list** — PHASE 3 resolves each one.

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
| `/api/content`,`/print`,`/promotions`,`/webhooks`,`/system`,`/customer`,`/checkout`,`/health` | — | — | 1 each |
| **`/api/orders`,`/products`,`/categories`,`/customers`,`/finance`,`/fraud`,`/fulfillment`,`/warehouses`,`/courier`** | **58** | **58** | **0** ✅ |

The core commerce loop is fully wired. Gaps cluster in **security, admin operations, reporting and inventory analytics**.

---

## Findings (all empirically verified)

### S1 — Critical

**S1-1 · No server-side authentication or authorization on any admin mutation.**
`server.ts` has only two global middlewares (security headers, rate limiting) — no auth middleware.
160 of 164 mutating routes have no in-handler check. **Proven with live unauthenticated `curl`:**

| Probe | Result |
|---|---|
| `POST /api/security/users/create` role `SUPER_ADMIN` | **200 — staff account created** (user count 5 → 6) |
| `DELETE /api/products/prod-1` | **200 — product deleted** |
| `POST /api/inventory/adjust` (+1 stock, operator `anon`) | **200 — stock mutated, ledger row written** |
| `POST /api/orders/ord-101/status` → CONFIRMED | **200 — order state changed** |
| `GET /api/customers` | **200 — full customer PII dump** |

Client-side `ROUTE_PERMISSIONS` in `AdminLayout.tsx` is cosmetic only.
Evidence: `server.ts:58-104`, `INVENTORY-api.csv` (`auth_in_handler=n`).

**S1-2 · IDOR on every customer endpoint.**
`/api/customer/profile|addresses|wishlist|returns|notifications/:custId` accept any id with no ownership check.
Proven: `cust-1`'s profile returned **200** using a `cust-2` bearer, and addresses/wishlist returned **200** with **no token at all**.
*(Note: `GET /api/orders` scoping added in the previous session works correctly — this gap is the `/api/customer/*` family.)*

**S1-3 · Backup covers only 31% of the database.**
`backupEngine.extractDatabaseSnapshotPayload()` (`server/backupEngine.ts:211-226`) snapshots 11 collections; `serverDb` has **35**.
**24 collections silently absent from backup *and* restore**: `contentRevisions, automationJobs, paymentTransactions, webhookEndpoints, webhookLogs, notificationTemplates, notificationLogs, gatewayConfig, customerNotifications, blacklists, fraudSettings, warehouseStock, stos, routingRules, pickLists, dispatchManifests, flashDeals, loyaltyWallets, promotionStats, customerAddresses, wishlists, customerReturns, customerProfiles, printSettings`.
Also outside `serverDb` entirely → also unbackupable: `marketingCommandCenter` channels/spends/attributions, `securityEngine` sessions/chained ledger.
**A "successful" restore would silently destroy payment transactions, fraud blacklists, loyalty wallets and customer addresses.** Restore path (`:463+`) has the same 10-collection limit.

### S2 — High

**S2-1 · No staff login UI.** `currentRole` is a `<select>` dropdown in `AdminLayout.tsx`. All 10 `/api/security/auth/*` endpoints (login, logout, verify, MFA, password change/reset) are orphan. The `kisholoy-auth-expired` staff gate and `kisholoy_staff_token` plumbing built last session have no producer. This is the precondition for fixing S1-1.

**S2-2 · `PromotionsAdmin` is unreachable.** `App.tsx:123` routes `/admin/promotions` → `<Navigate to="/admin">`, yet `AdminLayout.tsx:35` still declares RBAC for that path. 1,323 lines / 10 functions of coupon, flash-deal and loyalty-adjustment UI are dead. `ReturnsAdmin` + `RefundsAdmin` are likewise orphaned (superseded by `ReturnsRefundsAdmin`).

**S2-3 · RMA records persist to browser localStorage.** `ReturnsRefundsAdmin.tsx:200,210` reads/writes `kisholoy_rma_records`. Meanwhile the server *does* hold real return data (`GET /api/customer/returns/cust-1` → `ret-req-01 / RMA-2026-001`) and exposes `/api/admin/returns`, `/api/admin/returns/approve`, `/api/admin/refunds`, `/api/admin/refunds/process` — all unused. Returns are per-browser and invisible to other staff; the stock-restore-on-return logic already fixed in `AUDIT_REPORT.md` §2.4 is therefore **never triggered from the UI**.

**S2-4 · Inventory ledger in the admin UI is permanently stale mock data.**
`AppContext.inventoryTransactions` is seeded from `INITIAL_INVENTORY_TRANSACTIONS` and **never replaced by a server payload** (`setInventoryTransactions` is only ever called with a `prev =>` updater). `InventoryAdmin.tsx` makes **zero API calls** and renders that state.
Proven: after my probe write, the server ledger holds **7 rows** (newest `"audit probe"`); the admin UI can only ever show the **6 mock rows**. `/api/inventory/transactions|stats|export` are orphan.

**S2-5 · Context collections never hydrated from the server.** Same class as S2-4, for `customers`, `expenses`, `settlements`, `automationJobs`, `auditLogs`, `routingRules`, `customerLoyalty`.
*Mitigation observed:* `CustomersAdmin`, `FinanceAdmin`, `AuditAdmin`, `OperationsAdmin` each fetch their own data, so those screens are correct — but **any other consumer of these context values (dashboards, modals, cross-links) reads mock data**. Must be triaged per consumer in PHASE 3.

**S2-6 · Marketing Command Center state lives outside `serverDb`** (`marketingCommandCenter.ts:179-181` private arrays) → excluded from backup/restore (see S1-3) and from `/api/system/export`.

### S3 — Medium

**S3-1** 6 report endpoints unsurfaced: `financial-pnl`, `inventory-health`, `customer-cohorts`, `districts`, `documents/invoice/:orderNumber`, `documents/manifest`. `ReportsAdmin` uses only `analytics` + `export`.
**S3-2** 6 operations endpoints unsurfaced: `worker/tick`, `worker/toggle`, `dlq/replay-all`, `dlq/purge`, `jobs/enqueue`, `jobs/retry`. `OperationsAdmin` calls only `jobs`, `stats`, `tick`, `jobs/:id/retry`.
**S3-3** `AnalyticsAdmin` shows **synthetic data**, not telemetry. Beyond reading localStorage auth events, `createRandomAuthEvent()` / `createRandomVisitor()` (`AnalyticsAdmin.tsx:1333`, invoked on a `setInterval`) *fabricate* visitors and logins. The "Traffic & User Analytics" module is a simulator presented as live telemetry.
**S3-4** Custom courier configs stored in `localStorage('kisholoy_custom_couriers')` → not shared across staff or devices.
**S3-5** `/api/inventory/stats|transactions|export` and `/api/promotions/stats` unsurfaced (companion to S2-4/S2-2).
**S3-6** `POST /api/content/upload-image` unsurfaced — ContentAdmin has no image upload path.

### S4 — Low

**S4-1** `PromotionsAdmin` uses 5 native `alert()` calls instead of `showToast` (moot until S2-2 is resolved).
**S4-2** `/api/checkout/calculate` orphan — Checkout relies on `/api/orders/create` to compute totals. Server-authoritative either way; document or wire for a pre-submit quote.

### Verified NOT defects (closed)

| Claim (rev 1) | Verdict after probing |
|---|---|
| "`SettingsAdmin` makes zero API calls — settings never persist" | **FALSE.** `SettingsAdmin.handleSave` → `updateSiteContent()` → `PUT /api/content` (`AppContext.tsx:1180`). Live probe: `insideDhaka` 80 → 999 persisted and re-read from the server; `financeEngine.ts:55-126` consumes `siteContent.shippingFees` for checkout math. Chain is intact. |
| "Payment initiation is orphan / prepaid checkout broken" | **Partly false.** `sslcommerz/init` and `bkash/create` are genuinely uncalled, but Checkout uses gateway **modals** then posts `validate`/`execute`, which are wired. Correct statement: the *simulated* gateway path works; the real `init`/`create` handshake is unsurfaced. Reclassified S4, not S2. |
| "`MarketingCommandCenter.tsx:1136` 'Not implemented' badge is a bug" | **FALSE.** It is an intentional roadmap label on a channel-registry card listing planned channels. No action. |
| "12 functions emit audit logs" / "122 emit notifications" | **Generator false positives** — matched the word "audit" and `showToast`. Detector rewritten: audit now `n / server-side? (33)`, notifications now `y (9) / ui-toast-only (108) / n (138)`. |

---

## Revision log

Changes made in this revision after re-verifying every rev-1 claim against the running server:

1. **Removed** the false "SettingsAdmin doesn't persist" finding (was S2-5) — disproved by live probe.
2. **Downgraded** payment-initiation finding S2 → S4 and corrected its description.
3. **Removed** the "Not implemented badge" finding — intentional roadmap label.
4. **Upgraded** backup coverage from a suspicion to **S1-3 with hard numbers** (11/35 collections; 24 named omissions; restore equally limited).
5. **Upgraded** IDOR from "potential" to **S1-2, empirically exploited** (200 with wrong token / no token).
6. **Upgraded** S1-1 from static inference to **empirically exploited** (5 unauthenticated probes, including SUPER_ADMIN creation and product deletion).
7. **Added new S2-4** — inventory ledger UI is permanently stale mock data (found while verifying the orphan `/api/inventory/*` endpoints).
8. **Added new S2-5** — 7 context collections never hydrated from the server, with the per-screen mitigation noted.
9. **Sharpened S3-3** — AnalyticsAdmin doesn't merely use localStorage, it *fabricates* data on a timer.
10. **Fixed the generator** (`build-inventory.mjs`): audit/notification detectors rewritten; handler-trigger detection now recognises `prop:onX` (removed 10 false "UNWIRED" rows); orphan table now carries an **external-by-design vs unsurfaced-capability** classification (4 vs 48).
11. **Added the "149 no-API functions" caveat** — it is a triage list, not a defect count.

### Probe side-effects (disclosure)

Live probes mutated in-memory server state (a `prod-1` delete, a `+1` stock adjust, one order set to CONFIRMED, one staff user `h@x.com`, a shipping fee changed and restored). All are **in-memory only** and cleared by the server restart that follows; no repository data changed. The shipping fee was explicitly restored to `80` during the session.

## Next

**PHASE 2 — Connectivity verification.** Walk the Expected Connectivity Matrix
(`docs/ADMIN_FULL_AUDIT_PROMPT.md` §2A/2B) row by row, marking `OK / BROKEN / MISSING / PARTIAL`
with file:line evidence, using `INVENTORY-dataflow.md`'s obligatory side-effects as pass criteria.
S1-1, S1-2 and S1-3 are already queued for PHASE 4 as the first fixes.
