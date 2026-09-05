# PHASE 5 — closing the remaining S2 items

Three items were still open after PHASE 4. Two were real functional gaps and
are now closed; the third is a deliberate non-change.

## S2-3 / F-204 — RMA cases moved from localStorage to the server

**Was:** `ReturnsRefundsAdmin` kept every return case in
`localStorage['kisholoy_rma_records']`, seeded from a hardcoded array inside
the component. A return raised at one desk was invisible to every other
member of staff, disappeared with a cache clear, and never reached backup.
The screen already called `/api/admin/returns/approve` and
`/api/admin/refunds/process` (fixed in F-204), so the money and the stock
moved on the server while the *case record* stayed in one browser.

**Now:**

| Piece | Where |
|---|---|
| `RmaRecord` type | `src/types.ts` (was local to the admin screen) |
| Seed cases | `src/data/mockData.ts` → `INITIAL_RMA_RECORDS` |
| Store + methods | `server/db.ts` → `rmaRecords`, `createRma`, `updateRma` |
| Routes | `server.ts` → `GET/POST /api/admin/rma`, `PATCH /api/admin/rma/:id` |
| RBAC | `server/routePermissions.ts` — refunds need `REFUND_PROCESS`, case workflow needs `ORDER_UPDATE`, reads need `ORDER_VIEW` |
| Read protection | `server/authGuard.ts` — RMA reads carry customer name, phone, district and refund amounts, so they are not world-readable |
| Backup | `server/backupEngine.ts` → `rmaRecords` added to `BACKED_UP_COLLECTIONS` |

Server-side hardening worth noting:

- The client cannot set `totalRefundAmount`; it is derived from the order, so
  a tampered request cannot inflate a payout.
- `updateRma` strips `id` and `rmaNumber` from any patch — a stale tab cannot
  renumber a case.
- `handleSaveInspection` now writes the inspection **after** the server
  accepts the workflow step, so a failed approve no longer leaves a case
  that looks inspected.
- A failed load renders `OfflineDataBanner` instead of an empty table, which
  previously was indistinguishable from "no returns".

Verified live: unauth `GET` 401 · admin 200 · SUPPORT `POST /api/admin/rma`
403 · FINANCE refund 200 · SUPPORT refund 403 · create → PATCH → re-read
persists the stage and keeps id/rmaNumber immutable · backup manifest
reports `rmaRecords: 4`.

## S2-2 / S4-1 — Promotions & Loyalty restored

`/admin/promotions` redirected to the dashboard and the module had **no
sidebar entry at all**, so 1,323 lines of coupon, flash-deal and loyalty UI
were unreachable — even though all eight `/api/promotions/*` endpoints exist
and answer 200. Nothing in `MarketingAdmin` covers coupons, flash deals or
loyalty adjustments, so this was lost capability rather than a duplicate.

- Route restored in `src/App.tsx`.
- Nav entry `admin-nav-promotions` added to `adminModulesData.ts` (bilingual,
  under `customer-management`) — a route with no sidebar link is still lost.
- **S4-1:** the module's 5 native `alert()` calls are now `showToast(...)`,
  matching every other admin screen.

Verified: `/admin/promotions` 200 · coupons / flash-deals / loyalty / stats
all 200 · responsive auditor still 0/0/0/0 with the screen in scope.

## S2-6 — Marketing state outside `serverDb`: deliberately not changed

`marketingCommandCenter.ts` holds its state in private module arrays, so it
is excluded from backup/restore. Fixing it properly means moving that state
into `serverDb` and re-pointing the engine's internal reads — a refactor of a
live subsystem with no test coverage, well beyond the "audit and connect"
remit. It is recorded here as the top remaining item rather than half-done.

## Gates

`tsc --noEmit` 0 · `npm run build` green · smoke **99 × 2xx / 9 non-2xx**
(was 98; the extra pass is `/api/admin/rma`) · responsive auditor 0/0/0/0.

Standing limitation, unchanged: no real-browser verification is possible in
this environment.
