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

## CodeQL findings on the pull request

CodeQL raised two high-severity alerts against this branch. Both were real.

**1. Missing rate limiting (`server.ts`) — the important one.**
`securityEngine` locks an individual staff account after 5 failed attempts,
but that is per *account*: spraying one common password across many usernames
never trips it, and `/api/customer/auth/*` and the supplier portal login had
no protection at all.

Added `server/rateLimit.ts` — a dependency-free fixed-window per-IP limiter —
mounted as a *pattern* over the credential-checking surface (staff auth,
customer login/register, supplier portal login, portal-token and
set-portal-password) rather than route by route, so a login endpoint added
later is covered by default instead of being silently unprotected. Budget is
10 POSTs per IP per 5 minutes: far above a human mistyping a password,
far below useful automated guessing.

Verified live: 12 rapid bad logins → `401 ×10` then `429 ×2` with a
`Retry-After` header; `/api/health` and `/api/products` unaffected; a correct
staff login still returns 200.

CodeQL still flagged `attachAuthContext` and `enforceStaffSurface` after the
first attempt, and it was right to: the limiter had been mounted *after*
them, so a flood still reached token and password verification and could be
used as a CPU oracle against scrypt/HMAC. The limiter now runs first, and a
coarse `generalApiRateLimit` (300/IP/min) sits ahead of the auth middleware
so every handler is bounded, not only the enumerated credential routes.
Verified the ceiling does not disturb normal use: the 108-request smoke
suite still reports 99/9.

*Known limit:* the window is in-memory and per-process, so it resets on
restart and does not span instances. A shared store is required before
running more than one node — noted here rather than pretended away.

**2. Regular expression injection (`scripts/audit/apply-pending-guard.mjs`).**
A function name read from a CLI-supplied findings file was interpolated
straight into a `RegExp`, so a name like `handle.*` would have matched
arbitrary code. Now escaped before interpolation. Low real-world impact (a
local dev script over a file we generate), but it is a one-line fix.

Gates after both: tsc 0 · build green · smoke 99/9 · responsive auditor 0.

The `SonarCloud analysis` check also fails, but it fails identically on
`main` and on every prior commit: the workflow is an unconfigured template
(`-Dsonar.projectKey=` is empty and no `SONAR_TOKEN` secret exists). It is
not related to this branch and is not something this work can fix.
