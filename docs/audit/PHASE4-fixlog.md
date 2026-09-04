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
