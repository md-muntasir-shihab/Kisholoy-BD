# PHASE 2 — Connectivity Verification

_Date: 2026-09-04 · Method: live probes against `npm run dev` (real orders created and driven through
the full status chain), plus `file:line` source verification. Pass criteria = the "obligatory
side-effects" defined in [`INVENTORY-dataflow.md`](./INVENTORY-dataflow.md)._

Verdicts: **OK** · **PARTIAL** (works but a required link is weak/missing) · **BROKEN** (required link absent) · **BY DESIGN** (intentionally manual/external).

---

## 2A · Order lifecycle

### Probe methodology

Three real orders were pushed through the API:

| Probe | Order | Purpose |
|---|---|---|
| P1 | `KSH-2026-1513` (`01799887766`, 2× prod-1, COD) | create → side-effects → CANCELLED |
| P2 | `KSH-2026-3351` (`+8801711223399`, UTM tagged) | UTM attribution chain |
| P3 | `KSH-2026-6077` (`+8801733445566`) | CONFIRMED → SHIPPED → DELIVERED chain |

### Order **create** — 10 obligatory side-effects

| # | Obligation | Verdict | Evidence |
|---|---|---|---|
| ① | Server-side price recomputation | **OK** | `total=9700` computed server-side from `verifiedItems`; client totals ignored. `server.ts` `calculateOrderFinance`. |
| ② | Atomic stock deduction + rollback | **OK** | stock 12 → 10 on 2 units; `deductedItems[]` + `rollbackStock()` present (`server.ts:174-197`). |
| ③ | Fraud evaluation persisted | **OK** | `fraudRisk.recommendation = REQUIRE_PHONE_VERIFICATION` stored on the order. |
| ④ | Coupon / loyalty counters | **OK** | P3 wallet created with `WELCOME_BONUS 50` + `EARN_PURCHASE 48`, both linked to `orderId`/`orderNumber`. |
| ⑤ | **Inventory ledger row** | **🔴 BROKEN** | Ledger stayed at **6 rows** after the sale. See **F-201** below. |
| ⑥ | Audit log | **OK** | chained ledger grew (14 entries). |
| ⑦ | Customer notification | **OK** | notification log grew; recipient `phase2@probe.test` recorded. |
| ⑧ | UTM attribution capture | **OK** | P2 stored `{utmSource, utmMedium, utmCampaign, capturedAt}`. *(A rev-1 suspicion of loss was my own test using `source` instead of `utmSource` — chain is correct: `utmCapture.ts:51` → `Checkout.tsx:161` → `sanitizeOrderUtm` at `marketingCommandCenter.ts:540`.)* |
| ⑨ | Finance summary refresh | **OK** | `/api/finance/summary` recomputes from orders (`grossRevenue…netSales…grossProfit`). |
| ⑩ | Admin list refresh | **OK** | order count 7 → 8 → 9 via `GET /api/orders`. |

**Additional gaps found on create:** **F-202** (phone not canonicalised) and **F-203** (no customer record created/linked).

### Status transitions

| Transition | Obligation | Verdict | Evidence |
|---|---|---|---|
| CONFIRMED | payment consistency, pick-list eligibility | **OK** | 200; `paymentStatus`/`settlementStatus`/`verificationStatus` fields maintained. |
| SHIPPED | courier booking, consignment persisted, timeline, SMS | **PARTIAL / BY DESIGN** | Status flips but `courier` stays `NONE` — booking is a deliberate manual step via `OrderCourierDispatchModal` → `POST /api/courier/book`. **Not auto-wired**; acceptable, but an order can sit in SHIPPED with no consignment. Recommend a guard/warning. |
| DELIVERED | COD→finance, supplier eligible-sale, loyalty, RFM | **OK** | `KSH-2026-6077` appears in `/api/suppliers/eligible-sales/all`; loyalty `EARN_PURCHASE 48` awarded; notification logged. |
| CANCELLED | stock restore exactly once, finance, audit | **OK** | stock 10 → 12; ledger row `"Restock after order KSH-2026-1513 cancellation" qty +2`; `stockRestoredOnCancel` guard intact. |
| RETURNED / RMA | stock restore once, refund record, supplier adj | **🔴 BROKEN (UI path)** | Server logic exists and is correct, but the admin RMA screen never calls it — see **S2-3** (PHASE 1) / **F-204**. |
| REFUNDED | idempotency, ledger, notification | **OK (API)** | Duplicate-refund guard from `AUDIT_REPORT.md` §2.3 still present; reachable only via PaymentsAdmin. |

---

## 2B · Module-by-module connectivity

| Module | Verdict | Notes |
|---|---|---|
| **Dashboard** | **PARTIAL** | KPIs come from `/api/reports/analytics` (live) ✅, but low-stock/pending badges derive from `AppContext`, whose `inventoryTransactions`/`customers` are stale mock data (**S2-4/S2-5**). |
| **Orders Desk** | **PARTIAL** | Row actions, status API, print, Customer360 all wired ✅. Export = client-side only. Ledger link broken via **F-201**. |
| **Fraud & Anti-Abuse** | **PARTIAL** | Blacklist CRUD + `/api/fraud/evaluate` wired ✅; risk persisted on orders ✅. Blacklist phone matching uses `fraudEngine.normalizeBdPhone`, a **second, weaker** normaliser than the canonical `src/lib/phone.ts` (accepts malformed input, returns the raw string instead of `null`) → **F-205**. |
| **Shipments & Couriers** | **PARTIAL** | `/api/courier/book`, `/config`, `/track/:id`, webhook all exist ✅; auto-book on SHIPPED absent (see above); custom couriers live in browser localStorage (**S3-4**). |
| **Fulfillment (Hubs)** | **OK** | warehouses / stock-matrix / transfers / pick-lists / manifests all wired both ways; 12/12 endpoints WIRED. |
| **Returns & Refunds (RMA)** | **🔴 BROKEN** | UI persists to `localStorage('kisholoy_rma_records')` while `/api/admin/returns*`, `/api/admin/refunds*` and real server return data (`ret-req-01`) go unused. |
| **Payments & Ledger** | **PARTIAL** | `transactions`, `refund`, `test-ipn`, `validate`, `execute` wired ✅; `sslcommerz/init`, `bkash/create`, `ipn` unsurfaced (S4-2 / external). |
| **Finance & P&L** | **OK** | 8/8 endpoints wired; summary recomputes; courier-fee double-count fix intact. |
| **Products Catalog** | **PARTIAL** | CRUD + storefront propagation ✅; stock mutations bypass the ledger (**F-201**). |
| **Categories & Menus** | **OK** | 4/4 wired; storefront nav reflects changes. |
| **Inventory Ledger** | **🔴 BROKEN** | `InventoryAdmin` makes **zero** API calls and renders never-hydrated mock state; `/api/inventory/stats\|transactions\|export` orphan (**S2-4**). Combined with F-201 the ledger is both stale *and* incomplete. |
| **Suppliers & Procurement** | **OK** | 31/37 wired; PO → delivery → batch → settlement chain intact; DELIVERED → eligible-sale verified live ✅. |
| **Customers Directory** | **PARTIAL** | CRM screens fetch their own data ✅, but orders never create/link customer records (**F-203**) → Customer360 and RFM see only 3 seeded customers against 9 orders. |
| **Marketing Command Center** | **PARTIAL** | 28/30 wired; UTM→attribution→ROI chain verified ✅; state lives outside `serverDb` so it is unbackupable (**S2-6**). |
| **Analytics** | **🔴 BROKEN (as a data product)** | Renders `createRandomVisitor()` / `createRandomAuthEvent()` output on a timer (**S3-3**). Not connected to any real telemetry source. |
| **Reports** | **PARTIAL** | `analytics` + `export` wired; 6 real BI endpoints unsurfaced (**S3-1**). |
| **Content CMS** | **OK** | content/revisions/publish/restore wired; storefront reflects. Only `upload-image` unsurfaced (**S3-6**). |
| **Store Settings** | **OK** | ✅ Re-verified: `handleSave` → `updateSiteContent()` → `PUT /api/content` (`AppContext.tsx:1180`) persists, and `financeEngine.ts:55-126` consumes `shippingFees` in checkout math. Live probe 80 → 999 → restored. |
| **Users & RBAC** | **🔴 BROKEN** | Client-only guard; **no server-side enforcement anywhere** (**S1-1**), no login UI (**S2-1**). `AdminLayout.tsx:35` still declares RBAC for the dead `/admin/promotions` route. |
| **Audit Trail** | **PARTIAL** | Chain ledger + verify wired ✅; but stock sales (F-201) and many mutations produce no audit row. |
| **Backup** | **🔴 BROKEN** | 11/35 collections snapshotted, 10 restored (**S1-3**). |

---

## New findings from PHASE 2

### F-201 · S1 — Order sales bypass the inventory ledger (asymmetric ledger)

`serverDb.updateProductStock()` (`server/db.ts:141-147`) mutates `product.stock` directly with **no
`InventoryTransaction` row and no audit entry**, while every other stock path (`rollbackStock`,
cancel restock, return restock, manual adjust, batch intake) goes through `adjustInventory()`, which
**does** write a ledger row.

**Proven asymmetry:** selling 2 units → ledger unchanged (6 rows). Cancelling the same order → ledger
+1 row `"Restock after order KSH-2026-1513 cancellation" qty +2`.

**Impact:** the ledger records only inflows, never outflows. Any stock reconciliation, inventory
valuation, shrinkage analysis or audit replay built on it will over-state stock. `/api/inventory/stats`
and `inventory-health` inherit the error.

**Fix direction:** route order allocation through `adjustInventory({ quantityChange: -qty, reason: 'Order <no> allocation', operator: 'ORDER_ENGINE' })`, preserving the existing atomic rollback semantics (rollback then becomes a symmetric `+qty` entry).

### F-202 · S2 — Order create does not canonicalise the customer phone

`server.ts:206,241` store `customer.phone.trim()` verbatim. An order placed as `01799887766` is
stored in local form while seeded customers use `+8801712345678`.

Tracking still works (the canonical matcher added last session absorbs the difference), but every
*other* phone-keyed join is format-sensitive: customer dedupe, loyalty wallet lookup, fraud
velocity/blacklist checks, and marketing RFM.

**Fix direction:** `normalizeBdMobilePhone()` at the write boundary (order create, customer create,
customer register/login), falling back to the raw string only if normalisation returns `null`.

### F-203 · S2 — Guest orders never create or link a customer record

Order create synthesises `id: cust-${Date.now()}` (`server.ts:239`) that matches nothing in
`serverDb.customers`. **Live proof: 9 orders → 9 distinct customer ids, but only 3 customers exist.**

**Impact:** Customer360 shows no history for guest buyers; CRM/RFM/segmentation see a fraction of
real buyers; repeat-customer and CLV metrics are wrong; fraud "customer history" checks always see a
first-time buyer. *(Loyalty is unaffected — it keys off phone and does create a wallet.)*

**Fix direction:** on order create, upsert the customer by canonical phone (F-202 first), link
`order.customer.id` to the real record, and increment `totalOrders`/`totalSpent`.

### F-204 · S2 — RMA UI/server split (confirms PHASE 1 S2-3 at the connectivity level)

The server's return-approval path — including the already-fixed once-only stock restore
(`AUDIT_REPORT.md` §2.4) — is **unreachable from the UI**, so that fix can never fire in practice.

### F-205 · S3 — Two competing phone normalisers

`fraudEngine.normalizeBdPhone()` (`server/fraudEngine.ts:35`) returns the cleaned input unchanged when
it doesn't match a known prefix, so garbage normalises to garbage and can collide. The canonical
`normalizeBdMobilePhone()` (`src/lib/phone.ts`) validates the operator prefix and returns `null`
instead. Blacklist and velocity matching should use the canonical one.

### F-206 · S3 — Orders can reach SHIPPED with no consignment

Nothing blocks or warns when `status = SHIPPED` while `courier`/consignment is empty. Courier booking
is deliberately manual, so add a guard or a visible "awaiting consignment" state rather than
auto-booking.

---

## Score

| Verdict | Modules (of 21) |
|---|---|
| OK | 6 — Fulfillment, Finance, Categories, Suppliers, Content, Settings |
| PARTIAL | 10 — Dashboard, Orders, Fraud, Shipments, Payments, Products, Customers, Marketing, Reports, Audit |
| **BROKEN** | **5 — Returns/RMA, Inventory, Analytics, Users & RBAC, Backup** |

Order-lifecycle obligations: **9 of 10 create-time side-effects OK**, 1 broken (ledger);
**4 of 6 transitions OK**, 1 partial (SHIPPED), 1 broken via the UI (RETURNED).

## Consolidated fix queue for PHASE 4

| Order | ID | Sev | Fix |
|---|---|---|---|
| 1 | S1-1 | S1 | Server-side auth + RBAC middleware on all mutating routes |
| 2 | S1-2 | S1 | Ownership checks on `/api/customer/*` (IDOR) |
| 3 | S1-3 | S1 | Backup/restore to cover all 35 collections + engine state |
| 4 | **F-201** | S1 | Route order allocation through `adjustInventory` (ledger symmetry) |
| 5 | S2-1 | S2 | Staff login UI → real staff token (precondition for #1) |
| 6 | **F-203** | S2 | Upsert + link customer on order create |
| 7 | **F-202** | S2 | Canonicalise phone at every write boundary |
| 8 | S2-3 / F-204 | S2 | Move RMA to the server API |
| 9 | S2-4 / S2-5 | S2 | Hydrate inventory ledger + remaining context collections |
| 10 | S2-2 | S2 | Restore or formally retire `PromotionsAdmin` (owner decision) |
| 11 | F-205, F-206, S3-1…S3-6, S4-* | S3/S4 | Remaining medium/low items |

### Probe disclosure
Probes created 3 orders, 1 loyalty wallet, 1 eligible-sale row and several notification/audit entries,
and cancelled one order. All state is **in-memory only** and is cleared on server restart; no
repository data was modified.
