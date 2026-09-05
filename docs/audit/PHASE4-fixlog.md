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
