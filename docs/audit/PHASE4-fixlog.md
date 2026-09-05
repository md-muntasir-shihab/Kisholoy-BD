# PHASE 4 — Fix Log (batch 1: PHASE 2 findings)

_Date: 2026-09-04 · All fixes verified live against `npm run dev`, then `tsc --noEmit` = 0 and `npm run build` green._

| ID | Sev | Module | Root cause | Fix | Files | Verification |
|---|---|---|---|---|---|---|
| **F-201** | S1 | Inventory / Orders | `serverDb.updateProductStock()` mutated `product.stock` directly with no `InventoryTransaction` row, while every inflow (restock, return, adjust) used `adjustInventory()` which does log. The ledger recorded only inflows → any reconciliation over-stated stock. | Rewrote `updateProductStock()` to allocate **through `adjustInventory()`** with `quantityChange: -qty` and reason `Sale allocation for order <no>`. Availability check kept before mutation so atomic rollback still works. Moved `orderNumber`/`orderId` generation *above* stock allocation so ledger rows can cite the order. | `server/db.ts:141`, `server.ts:187` | Sale of 2 units: ledger 6→7, newest row `type=SALE qty=-2 reason="Sale allocation for order KSH-2026-7193"`. Cancel: ledger 7→8 `+2` restock. **Symmetric.** |
| **F-202** | S2 | Orders / CRM | Order create stored `customer.phone.trim()` verbatim, so the same person was a different key depending on input format. Every phone-keyed join (CRM dedupe, loyalty, fraud velocity, blacklist, RFM) was format-sensitive. | Canonicalise once at the write boundary with `normalizeBdMobilePhone()`; use it for the order customer, the fraud assessment and the shipping address (falling back to raw input only when normalisation returns `null`). | `server.ts:207` | Input `01799887766` → stored `+8801799887766`. Input `+880 1744-556677` → stored `+8801744556677`. |
| **F-203** | S2 | Customers / CRM | Order create minted a throwaway `cust-${Date.now()}` id matching no CRM record. **9 orders had 9 distinct customer ids against only 3 real customers**, so guest buyers were invisible to Customer 360, RFM and CLV. | Added `serverDb.findCustomerByPhone()` (canonical-first, digits fallback) and `serverDb.upsertCustomerFromOrder()`; order create now links `order.customer.id` to the real record and `recordCustomerOrderStats()` rolls value into `totalOrders`/`totalSpent`. Auto-created records are audit-logged. | `server/db.ts` (+3 methods), `server.ts:207,246,361` | New buyer → customers 3→4, `orders=1 spent=9700`. **Same buyer re-ordering as `+880 1799-887766` reused the SAME id** — customers stayed 4, `orders=2 spent=14550`. |
| **S1-3** | S1 | Backup / DR | `extractDatabaseSnapshotPayload()` hand-listed **11 of 35** collections; restore hand-listed 10. A "successful" restore silently destroyed `paymentTransactions`, `blacklists`, `loyaltyWallets`, `customerAddresses`, `gatewayConfig`, `fraudSettings`, `printSettings`, wishlists, pick-lists, manifests and 14 more. | Introduced `BackupEngine.BACKED_UP_COLLECTIONS` (all 35) as the single contract; snapshot, restore and `getCollectionCounts` are now **data-driven from that list**, so restore coverage can never drift behind snapshot coverage. Restore keeps a shape guard (never swaps array↔object). Widened `collectionCounts` in `types.ts` to an open map. | `server/backupEngine.ts`, `src/types.ts:1690` | Snapshot manifest: **36 collections / 179 records** (was 12). Round-trip: added a blacklist entry (5→6), restored → **35 collections restored**, blacklist back to 5. |
| **F-205** | S3 | Fraud | `fraudEngine.normalizeBdPhone()` was a second, weaker normaliser that returned unrecognised input unchanged, so blacklist/velocity matching could miss or collide. | Delegated to the canonical `normalizeBdMobilePhone()`, with a digits-only fallback instead of raw passthrough. | `server/fraudEngine.ts:35` | Blacklisted `01766554433`; orders as `01766554433`, `+8801766554433`, `8801766554433`, `+880 1766-554433` **all → BLOCK, blacklisted=True**. |
| **F-206** | S3 | Shipments | Orders could reach SHIPPED with no consignment, leaving the parcel untrackable and silent. (First attempt keyed off the `courier` object, which is pre-seeded with `{provider, status:CREATED}` before any booking — corrected to key off a real consignment/tracking number.) | `POST /api/orders/:id/status` now detects SHIPPED-without-consignment, writes a `SHIPPED_WITHOUT_CONSIGNMENT` audit row and returns a bilingual `warnings[]` entry. Booking stays a deliberate manual step. | `server.ts:610` | SHIPPED without booking → `warnings[0].code = SHIPPED_WITHOUT_CONSIGNMENT` + audit row. |
| **S2-4** | S2 | Inventory UI | `AppContext.inventoryTransactions` was seeded from mock data and **never** replaced by a server payload; `InventoryAdmin` made zero API calls. Server ledger had 7 rows while the UI could only ever show 6 seeded ones. | Added a mount-time hydration of `/api/inventory/transactions`, and `adjustInventory()` now re-reads the authoritative ledger after a successful write so the screen shows the server's row. | `src/context/AppContext.tsx:291,776` | Ledger endpoint hydrates on load; post-adjust refetch confirmed via `apiFetchJson`. |
| **S2-5 (partial)** | S2 | Customers | `AppContext.customers` was never hydrated from the server, so every consumer other than `CustomersAdmin` (which fetches its own) read mock data. | Added mount-time hydration of `/api/customers`. | `src/context/AppContext.tsx:299` | Directory now reflects auto-created CRM records (5 after probes). |

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **0 errors** ✅ |
| `npm run build` | **success** — `dist/server.cjs` 828.0 kB ✅ |
| GET smoke suite (107 routes) | **98 × 2xx, 9 sample-id artifacts** — identical to the PHASE 0 baseline, no regression ✅ |
| Order lifecycle regression | create → stock −2, ledger +1, customer +1, UTM kept, fraud scored → SHIPPED warning → CANCELLED → stock restored, ledger +1 ✅ |

## Still open (deliberately not in this batch)

These need product decisions or a larger surface, and are queued next:

| ID | Sev | Why deferred |
|---|---|---|
| **S1-1** | S1 | Server-side auth/RBAC on 160 mutating routes. Its precondition is **S2-1 (staff login UI)** — shipping enforcement without a way to log in would lock every operator out. Must land together. |
| **S1-2** | S1 | IDOR on `/api/customer/*`. Needs the same session-identity plumbing as S1-1 to know who the caller is. |
| **S2-1** | S2 | Staff login UI (10 orphan `/api/security/auth/*` endpoints already exist). |
| **S2-2** | S2 | `PromotionsAdmin` unreachable — **owner decision**: restore the route or formally retire the module. |
| **S2-3 / F-204** | S2 | RMA moves from `localStorage` to the server API — sizeable UI rework of `ReturnsRefundsAdmin`. |
| **S2-6, S3-1…S3-6, S4-*** | S2–S4 | Marketing state outside `serverDb`; unsurfaced report/operations endpoints; synthetic Analytics; localStorage courier configs. |

### Probe disclosure
Verification created several orders, customers, loyalty wallets, ledger rows, a blacklist entry and two backup snapshots. All state is **in-memory only** and cleared on restart; no repository data was modified.

---

## Batch 2 — Authentication, RBAC and IDOR

Batch 2 closes the largest finding of PHASE 1: **160 of 164 mutating routes
accepted anonymous requests**, and every `/api/customer/*` route trusted a
caller-supplied id. All three fixes share one dependency — a real server-side
session identity — so they shipped together.

| # | Finding | Fix | Evidence |
|---|---------|-----|----------|
| S2-1 | Admin panel had no sign-in; role was a local dropdown | New `src/admin/StaffLoginScreen.tsx` posts to `/api/security/auth/login`, stores `kisholoy_staff_token`; `AdminLayout` gates all admin routes and revalidates via `/api/security/auth/verify` on mount | login 200 + token; bad password 401; verify 200 |
| S1-1 | Mutating routes unauthenticated | New `server/authGuard.ts`: `attachAuthContext` + `enforceStaffSurface` mounted after `express.json()`. Every non-GET `/api/**` requires a staff session unless allow-listed; sensitive GET families are gated too | anon `PUT /api/products/prod-1` → 401 `STAFF_AUTH_REQUIRED`; same call with bearer → 200; anon `GET /api/customers` → 401, authed → 200 |
| S1-2 | IDOR on `/api/customer/*` | `requireCustomerSelf('customerId')` applied to 10 routes (6 path-param, 4 body-param); staff bypass retained | `cust-2` token reading `cust-1` → 403 `NOT_RESOURCE_OWNER`; `cust-1` reading itself → 200; staff → 200 |

### Public surface preserved

Checkout and storefront traffic must never require a login. Explicit allow-list
(`PUBLIC_MUTATION_PATTERNS`): order creation, checkout, promotion validation,
customer auth, supplier portal auth, payment IPN/SSLCommerz/bKash callbacks,
courier webhooks and the marketing attribution beacon. Verified: anonymous
`POST /api/orders/create` still reaches validation (400 on an empty body, not
401) and `GET /api/products` is 200.

### Gates

- `tsc --noEmit` — 0 errors.
- `npm run build` — green, `dist/server.cjs` 834.5 kB.
- Smoke suite — **98 × 2xx / 9 non-2xx, identical to baseline.** The script now
  signs in as staff first (`scripts/audit/smoke-endpoints.sh`, override with
  `TOKEN=`), because unauthenticated protected reads now *correctly* answer 401
  and would otherwise read as regressions.

### Still open

`requirePermission(...)` exists in `server/authGuard.ts` and is enforced, but is
not yet attached per-route — the current protection is a blanket staff gate, so
a MODERATOR can still call SUPER_ADMIN operations. Wiring per-route permissions
is the remainder of S1-1 and is the first item of batch 3, along with S2-3/F-204
(RMA persistence), S2-5 (residual hydration) and S2-2 (promotions ownership).

### Batch 2a — self-review corrections

Re-reading the batch 2 diff and probing it live turned up three real defects in
the batch 2 work itself. All three are fixed and verified.

| # | Defect introduced/missed by batch 2 | Fix | Evidence |
|---|---|---|---|
| B2-A | **The guard broke the admin UI.** 203 of 210 admin call sites use raw `fetch('/api/...')` and send no token, so every admin write returned 401 the moment the gate went in — only 7 sites used `apiFetch`. | `installApiAuthInterceptor()` in `src/lib/apiClient.ts`, called from `src/main.tsx` before mount. It patches `window.fetch` once and attaches the surface-appropriate token to same-origin `/api/**` calls, respecting any `Authorization` already set. | Harness: `/api/products`→staff, `/api/customer/*`→customer, `/api/suppliers/portal/*`→supplier, preset header untouched, cross-origin untouched, no token → no header |
| B2-B | **Unauthenticated account takeover.** `POST /api/customer/auth/change-password` and `POST /api/suppliers/portal/change-password` sat on the public allow-list and trusted a body-supplied id — anyone could reset any customer's or supplier's password. Both returned 200 to an anonymous curl. | `requireCustomerSelf` / `requireSupplierSelf` applied; `requireSupplierSelf` extended to read query and `x-supplier-id`, and to 400 when no id is supplied. | anon → 403, cross-tenant → 403, own account → 200 |
| B2-C | **Ownership gaps on record-keyed routes.** `PUT`/`DELETE /api/customer/addresses/:addressId`, `POST /api/customer/notifications/:id/read`, `link-guest-order` and `GET /api/suppliers/portal/dashboard` had no owner check — the owner is on the stored record, not in the URL, so `requireCustomerSelf` could not cover them. | New `requireAddressOwner` / `requireNotificationOwner` in `server/authGuard.ts` resolve the owner from the record server-side and answer 404 (not 403) for unknown ids so existence is not leaked. Address updates also strip `customerId` from the body so a record cannot be re-parented. | anon → 403, `cust-2` on `cust-1`'s address → 403, owner → 200, unknown id → 404, staff → 200 |

Re-verified after the fixes: `GET /api/products` 200 anonymous, `POST
/api/orders/create` still 400-on-empty-body (not 401), staff write 200,
`tsc --noEmit` clean, build green (`dist/server.cjs` 837.7 kB), smoke 98/9.

Note for future batches: the tsx dev watcher served stale routes during this
review and briefly showed every guard as failing. Restart the server before
concluding a guard does not work.

### Batch 2b — token forgery (found re-verifying PHASE 3)

Re-checking the batch 2 work turned up an **S1 that undermined the batch 2
ownership fixes themselves**, plus two related weaknesses.

| # | Finding | Fix | Evidence |
|---|---|---|---|
| B2-D · **S1** | **Customer and supplier session tokens were unsigned and guessable.** `attachAuthContext` derived identity from the token *shape* (`ksh-cust-sess-<id>-<ts>`), so a hand-typed `ksh-cust-sess-cust-1-9999999999` authenticated as that customer. The IDOR guards were enforcing a value the attacker chose — `GET /api/customer/profile/cust-1` returned full PII to a fabricated token. | New `server/sessionTokens.ts`: HMAC-SHA256 signed tokens (`<payload>.<sig>`), constant-time compare, identity read only from the verified payload. Unsigned legacy tokens rejected unless `KISHOLOY_ALLOW_LEGACY_TOKENS=true`. Key from `KISHOLOY_SESSION_SECRET`, else a per-process random key. | forged token → 403; real login → 200 own / 403 cross; tampered signature → 403; valid signature replayed on another id → 403 |
| B2-E · **S2** | The admin "Open Live Vendor Hub" button **fabricated a supplier token in the browser** (`SuppliersAdmin.tsx:1070`), which signing would have silently broken. | New staff-gated `POST /api/suppliers/:id/portal-token` mints a signed token and writes a `SUPPLIER_PORTAL_IMPERSONATE` audit row; the button now calls it. | anon → 401; staff → token; token opens `sup-001` (200) but not `sup-002` (403) |
| B2-F · **S2** | The hardcoded `ksh-token-super-admin-root-session-2026` SUPER_ADMIN session was created unconditionally — a publicly known credential that would ship to production. | Skipped when `NODE_ENV=production` or `KISHOLOY_DISABLE_ROOT_TOKEN=true`; kept in dev for the seed and smoke suite. | `NODE_ENV=production` → `verifySession(...).valid === false`; dev → still 200 |

**PHASE 3 claims re-verified.** "0 dead buttons" was re-tested with a stricter
detector (name must appear in a JSX prop position, not merely twice in the
file): 1 candidate surfaced, `AnalyticsAdmin.handleStorageChange`, which is a
correctly-wired `window.addEventListener` callback. Claim holds. Inventory
coverage re-counted: 175 `handleXxx` declarations vs 174 rows — the difference
is a duplicated handler name, not a missing function; no handler is absent.
F-301 and F-302 were re-confirmed live (`POST /api/categories` persists 4→5
while the UI never calls it; server holds 3 expenses while the UI keeps its own
divergent copy).

**Gates:** `tsc --noEmit` clean · build green (`dist/server.cjs` 841.0 kB) ·
smoke 98/9 unchanged · 10-point regression battery green (staff write 200, anon
write 401, public read 200, checkout 400-not-401, all three ownership guards 403).

---

## Batch 3 — per-route RBAC + the four PHASE 3 S2 defects

### S1-1 completed: per-route permissions

Batch 2 left a **blanket** staff gate: any signed-in staffer could call any
endpoint, so a SUPPORT rep could delete products and an ORDER_MANAGER could mint
staff accounts. Rather than hand-annotating 164 routes, the mapping lives in a
reviewable table (`server/routePermissions.ts`) that `enforceStaffSurface`
consults after establishing the session; denials emit a `PERMISSION_DENIED`
audit row naming the role, route and missing permission.

Verified against the five seeded roles (all `Kisholoy@2026!`):

| Action | SUPER | ORDER | INVENTORY | FINANCE | SUPPORT |
|---|---|---|---|---|---|
| `DELETE /api/products/:id` | 404* | **403** | 404* | **403** | **403** |
| `PUT /api/products/:id` | 200 | **403** | 200 | **403** | **403** |
| `POST /api/payments/refund` | 500* | **403** | **403** | 500* | **403** |
| `POST /api/finance/expenses` | 200 | **403** | **403** | 200 | **403** |
| `POST /api/security/users/create` | 400* | **403** | **403** | **403** | **403** |
| `POST /api/system/backups/create` | 200 | **403** | **403** | **403** | **403** |
| `POST /api/suppliers/:id/portal-token` | 200 | **403** | **403** | **403** | **403** |

\* non-403 codes are the route's own validation on a deliberately bogus id, not
an authorisation result.

**One rule was tightened during testing.** Supplier impersonation
(`portal-token`) initially required `SUPPLIER_MANAGE`, which INVENTORY_MANAGER
holds via `suppliers:write` so it can receive stock — it could therefore open the
vendor hub as any supplier. Receiving stock is not impersonation, so the rule now
requires `SECURITY_ADMIN` (403 for INVENTORY_MANAGER, 200 for SUPER_ADMIN).

**No false lockouts:** each role still performs its own work — ORDER_MANAGER
reads orders and advances status (200), INVENTORY_MANAGER updates products and
warehouses (200), FINANCE reads the P&L and transactions (200), SUPPORT reads
customers and orders (200).

### PHASE 3 S2 fixes

| # | Defect | Fix | Evidence |
|---|---|---|---|
| F-301 | Categories created/deleted in the admin never persisted — `CategoriesAdmin` wrote to React state while full CRUD sat unused at `server.ts:465-510`. | Screen now calls the context helpers. Both were rewritten to be optimistic-with-rollback: adopt the server's record (so ids match), restore the previous list and toast an error on failure. | `POST /api/categories` 4→5 persisted; helper adopts returned record |
| F-302 | Expenses were written twice — POST to the server, then a second local copy with a different `exp-<Date.now()>` id. The P&L on screen drifted from the ledger and delete-by-id could not match. | `FinanceAdmin` adopts `data.expense` from the response; `addExpense` accepts a server record instead of always minting an id. Failures now surface `data.error`. | server and UI share one id |
| F-303 | On a fraud-engine failure `PaymentsAdmin` fabricated a score (`COD && total>7000 ? HIGH : LOW`) and rendered a `riskScore: 15` default — an invented number shown as if it came from the engine, ignoring blacklist/velocity/history. | Fallback deleted; unscored orders render "Risk score unavailable — engine unreachable", `— / 100`, `NOT ASSESSED`. | no client-side scoring path remains |
| F-304 | No idempotency on expense creation: the same `reference` twice produced two cost rows (verified 3→5), understating profit. | Server rejects a duplicate `reference` with 409 `DUPLICATE_REFERENCE` (bilingual) and returns the existing row — mirrors the refund guard. | 1st 200, 2nd 409, count 3→4 |

**Gates:** `tsc --noEmit` clean · build green (`dist/server.cjs` 849.8 kB) ·
smoke 98/9 unchanged · storefront unaffected (`/api/products`, `/api/categories`,
`/api/content`, `/api/orders/track` all 200; checkout 400-not-401).

**Remaining from PHASE 3:** F-305 (33 silent catches), F-306 (71 mutations with
no in-flight state), F-307 (41 modals with no Esc/focus-trap), F-308 (responsive,
belongs to PHASE 5), F-309 (3 English-only screens).

---

## Batch 4 — F-305: silent error handling

### The reported count was wrong

PHASE 3 reported 33 silent catches. Re-running the analyzer after the batch 3
edits produced 34 — with phantom entries — which exposed two detector bugs:

1. **Stale line numbers.** `functionBody()` searched only ±8 lines around the
   inventory's recorded line for the declaration. Once batch 3 shifted lines in
   `PaymentsAdmin`, it silently extracted the *wrong function* and reported
   `handleTriggerIpn` / `handleProcessRefund` as having no catch when both do.
   It now finds the declaration anywhere in the file and takes the occurrence
   nearest the recorded line.
2. **Unknown feedback aliases.** The detector only recognised `showToast`.
   Screens using `notify(...)` (SuppliersAdmin) or `showNotification(...)`
   (FraudRiskDashboard) — 13 functions — were reported as silent when they
   already told the user.

Corrected baseline: **21 genuine cases** (5 mutations, 16 loaders), not 33.

### Fixes

Mutations — silent failure here destroys the operator's work or misleads them:

| Function | Was | Now |
|---|---|---|
| `ShipmentsAdmin.handleExecuteDispatch` | Courier booking failure logged to console; UI showed the order as dispatched. **An operator could believe a parcel was booked when no carrier ever received it.** | Records locally (intended fallback) but toasts that booking failed and the consignment must be confirmed manually |
| `BackupAdmin.handleOpenRestoreModal` | Dry-run failure left an empty impact panel — a restore could be run without ever seeing what it would overwrite | Clears the result and warns "Do not restore without it" |
| `PromotionsAdmin.runSimulator` | Blank result panel, which reads as "coupon invalid" rather than "check never ran" | Explicit failure toast |
| `OperationsAdmin.handleSmsInputChange` | Silent | **Kept silent, now documented** — fires per keystroke on a character counter; a toast per keystroke would be worse |
| `PaymentsAdmin useEffect@55` | — | Already fixed in batch 3 (F-303); silence is the correct behaviour there |

Loaders — the fallback is good, but the operator must know the data is not live:

- New shared `src/components/admin/OfflineDataBanner.tsx` (bilingual, `role="status"`, retry button) wired into **CustomersAdmin** (stale CRM figures), **AuditAdmin** (a compliance ledger that looked complete while the real chain never loaded) and **FraudRiskDashboard** (an empty blacklist reads as "nobody is blacklisted").
- **BackupAdmin**: six independent loaders collected into one `loadFailures` banner with a retry-all, instead of six empty cards that look like "no backups".
- **Dashboard**: the Vendor Payable tile showed a confident `৳0` on failure, understating what the business owes; now renders `—` / "Could not load".
- **OrderCourierDispatchModal**: on config failure the badge claimed "Sandbox (Simulated)" even for live-configured carriers; now "Status unknown".
- Toast-only fixes: `FinanceAdmin.fetchSummary`, `PaymentsAdmin.fetchTransactions`, `PromotionsAdmin.fetchPromotionData`, `SuppliersAdmin.loadPurchaseOrders` / `openSupplierDetail`, `ProductsAdmin` supplier dropdown.

### Result

Silent catches **21 → 2**, and both survivors are deliberate and commented
(per-keystroke SMS counter; the F-303 fraud fallback where staying quiet is the
fix). The detector now also recognises state-flag error surfacing, so
banner-based handling is no longer miscounted as silence.

**Gates:** `tsc --noEmit` clean · build green (`dist/server.cjs` 849.8 kB) ·
smoke 98/9 unchanged · storefront and auth regression battery green.

**Remaining from PHASE 3:** F-306 (79 mutations with no in-flight state),
F-307 (41 modals with no Esc/focus-trap), F-308 (responsive → PHASE 5),
F-309 (3 English-only screens).

---

## Batch 5 — F-306, F-307, F-308, F-309

Closes the remaining PHASE 3 findings. All four are cross-cutting defects, so
each was fixed with one shared primitive plus a codemod, rather than 100+
hand-edits that would drift apart over time.

### F-306 — duplicate submits (S3)

`src/hooks/usePendingAction.ts`. `run(key, action)` refuses re-entry while the
same key is in flight. The guard is a `useRef<Set<string>>`, **not** the
`pending` state: state updates are async, so two clicks in the same tick would
both observe `pending === null` and both fire. That window is exactly how
duplicate expenses, double dispatches and repeated status flips were produced.

Applied to **51 mutation handlers** across 13 files (OperationsAdmin 9,
FraudRiskDashboard 7, MarketingAdmin 7, UsersAdmin 6, FinanceAdmin 4,
PromotionsAdmin 4, SupplierSettlementsView 4, SuppliersAdmin 4, BackupAdmin 2,
ShipmentsAdmin 1, Customer360Modal 1, SupplierAgreementsView 1,
SupplyBatchesView 1) via `scripts/audit/apply-pending-guard.mjs`.

The 6 sites still reported as "no loading state" were checked individually and
deliberately left alone: five are GET loaders (`fetchSchedule`, `fetchDrMetrics`,
`loadPurchaseOrders`, `handleRunDiagnostics`, `handleRunReconciliation`) where a
repeat is idempotent, and `handleSmsInputChange` runs per keystroke.

### F-307 — modal accessibility (S3)

`src/hooks/useModalA11y.ts` provides Escape-to-close, a Tab/Shift+Tab focus
trap, focus-on-open, focus-restore-on-close, a body scroll lock and the
`role="dialog"` / `aria-modal` / `aria-label` wiring.

Two delivery mechanisms, because the codebase has two modal shapes:

- **17 standalone `*Modal.tsx` components** call the hook directly
  (`scripts/audit/apply-modal-a11y.mjs`, extended to handle both
  `export function X({…})` and `export const X: React.FC = ({…}) =>`, plus
  modals gated on a nullable entity prop instead of an `isOpen` flag).
- **58 overlays declared inline inside admin screens** are wrapped in the new
  `src/components/admin/AdminModalShell.tsx`
  (`scripts/audit/wrap-inline-modals.mjs`). These have no component boundary
  and each owns its own open-state variable, so wrapping was the low-risk
  route.

The hook is always called *before* the `if (!isOpen) return null` early return —
rules of hooks.

Destructive dialogs opt out of dismissal so a stray Escape or backdrop click
cannot abandon a half-finished irreversible action: **backup restore**,
**supplier MFA payment**, **settlement payout** and **manual IP quarantine**
set `closeOnEscape={false} closeOnBackdrop={false}`. Backdrop dismissal
elsewhere fires on `mousedown` at the overlay itself, so a text selection that
drags onto the backdrop does not close the form.

### F-308 — responsive (S3)

`BulkSupplierImportModal` and `CustomerQuickMessageModal` were fixed-padding
with unconditional multi-column grids; both now use `sm:`-prefixed padding and
collapse to a single column on phones. Aggregate: **2 → 0** files.

### F-309 — English-only screens (S3)

`SettingsAdmin` (8 strings), `PaymentsAdmin` (33) and `BusinessDocumentModal`
(10) are bilingual. The courier manifest stays bilingual rather than
Bengali-only because the printed sheet is handed to a rider.

### Accessibility sweep

`aria-label`s on unlabelled filter selects/search inputs (CustomersAdmin,
CategoriesAdmin, ReportsAdmin) and landmark roles on Dashboard, SettingsAdmin,
DateRangeFilterBar and OrderLiveTrackingTimeline. Aggregate: **32 → 0** files.

### Analyzer corrections (F-310)

Two more false-positive classes: handlers guarded by `usePendingAction().run()`
were counted as unguarded, and modals delegating to `useModalA11y` /
`AdminModalShell` were counted as having no ARIA. Both are now recognised, which
is why the no-loading count moves 57 → 6 rather than 57 → 8.

### Result — PHASE 3 aggregate now clean

| finding | before | after |
|---|---|---|
| possibly unwired | 0 | 0 |
| mutation w/o refetch | 0 | 0 |
| silent catch / no catch | 1 + 1 | 1 + 1 (both intentional) |
| no in-flight state | 57 | 6 (all idempotent GETs) |
| files lacking i18n | 3 | **0** |
| files lacking responsive | 2 | **0** |
| files lacking aria/role | 32 | **0** |

**Gates:** `tsc --noEmit` clean · build green (`dist/server.cjs` 849.8 kB) ·
smoke 98/9 unchanged · all 8 admin routes 200 · every rewritten module
re-verified through Vite's transform pipeline (58 inline JSX rewrites).

---

## Batch 6 — S2: supplier portal authentication

Closing the last open S2. What started as "a hardcoded password" turned out to
be four defects stacked on the same code path, one of which was a full
authentication bypass.

### The bypass

```js
const configuredPassword = supplier.portalAccess?.password || 'kisholoy2026';
if (pass && pass.trim() !== configuredPassword && pass.trim() !== 'kisholoy2026') {
  return { success: false, error: 'Incorrect password.' };
}
```

1. **Empty password authenticated as any supplier.** The `pass &&` guard means
   an absent or blank password skipped verification entirely — `POST` the email
   alone and you were logged in as that vendor. Verified before the fix.
2. **`'kisholoy2026'` was accepted unconditionally**, even for a supplier who
   had set their own password. It was a permanent backdoor no vendor could close.
3. **Passwords were stored and compared in plaintext**, and the whole
   `portalAccess` object — password included — was returned by
   `GET /api/suppliers` and `GET /api/suppliers/:id`.
4. **`POST /api/suppliers/:id/set-portal-password` had no RBAC rule**, so it
   fell through to the generic `SUPPLIER_MANAGE` write rule that
   INVENTORY_MANAGER holds for stock receiving. Any such account could reset a
   vendor's password and take over the portal.

### The fix

- **`server/supplierCredentials.ts`** — scrypt (N=16384, 16-byte salt, 64-byte
  key), constant-time compare via `timingSafeEqual`, stored as
  `scrypt$N$salt$key`.
- **A password is now always required**; the empty-password branch is gone.
- **No shared fallback.** Absent credentials mean authentication fails, full
  stop. Seeded demo suppliers read from `KISHOLOY_SUPPLIER_SEED_PASSWORD`,
  defaulting to `ChangeMe@2026` in development only — in production with no env
  value the seed hash is random per boot, so those accounts are unusable rather
  than silently sharing a known password.
- **Hashes never leave the server.** `publicPortalAccess()` strips
  `passwordHash`, applied at source in `getAllSuppliers()` and
  `getSupplierById()` rather than at each call site. Verified: 0 occurrences in
  the list, detail and login responses.
- **Admin resets mint the password.** `set-portal-password` no longer accepts a
  password from the request body — staff never choose a vendor's password. It
  generates a 12-character temporary one (ambiguous glyphs removed, since these
  get read out over the phone), returns it exactly once, and sets
  `mustChangePassword`.
- **Self-service change requires the current password**, so a leaked session
  token cannot lock the real supplier out of their own account.
- **RBAC**: `set-portal-password` and `toggle-portal` now require
  `SECURITY_ADMIN`, alongside the existing `portal-token` rule.
- **UI**: the admin supplier list no longer prints the password (it shows an
  "on a temporary password" flag instead), and the portal login form no longer
  pre-fills one.
- Login failures are audit-logged, and the wrong-password and unknown-email
  responses are now identical so the endpoint stops confirming which vendor
  emails are registered.

### Verification (live)

| probe | result |
|---|---|
| old shared password | rejected |
| **empty password** (the bypass) | rejected |
| password field omitted | rejected |
| correct password | authenticates |
| unknown email | identical message to wrong password |
| `passwordHash` in list/detail/login responses | **0** |
| admin reset — anonymous / INVENTORY_MANAGER / SUPER_ADMIN | 401 / 403 / 200 |
| reset → temp login → change → old rejected, new works | full lifecycle passes |
| wrong current password / weak new password | rejected |
| sup-001 token changing sup-002's password | 403 |
| supplier token hitting admin reset | 403 |

**Gates:** `tsc --noEmit` clean · build green (849.8 kB) · smoke 98/9 unchanged.

**Note for deployment:** set `KISHOLOY_SUPPLIER_SEED_PASSWORD`, or issue each
real supplier a temporary password from the admin panel. Existing records
carrying the old plaintext field have no `passwordHash` and therefore cannot log
in until reset — deliberate, since the alternative is honouring a password that
is public knowledge.
