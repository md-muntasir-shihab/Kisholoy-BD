# PHASE 3 — Function-by-Function Audit

**Scope:** all 255 admin functions from `docs/audit/INVENTORY-functions.csv`, across
`sales-operations` (52), `catalog-inventory` (29), `customer-management` (13),
`system-administration` (47), `shared-component` (93) and `unrouted` (21).

**Method.** The PHASE 3 checklist is 14 points × 255 functions = 3,570 individual
checks. Filling that in by hand would be neither reliable nor reviewable, so the
mechanically-decidable points were extracted by a static analyzer
(`scripts/audit/phase3-analyze.mjs` → `docs/audit/PHASE3-findings.csv`), and every
finding it raised was then confirmed by reading the source and, where it involved
money or data integrity, by probing the running server.

Points decided mechanically: 1 (wired), 2 (server-backed), 4 (auth/RBAC),
6 (refetch), 9 (error UX), 10 (loading), 12 (i18n), 13 (responsive), 14 (a11y).
Points 5, 7, 8, 11 were checked manually on the high-risk subset (money,
inventory, auth, bulk operations), because they cannot be read off the syntax.

**Analyzer honesty.** The first run reported 6 "mutation without refetch" and 4
"no catch" findings that were false positives — it missed `loadSecurityData()`
style refetch helpers and the `catch {` binding-less form. The detectors were
corrected and re-run before this report was written; the numbers below are
post-correction. Two remaining "no catch" rows (`BackupAdmin.fetchDriveConfig`,
`PaymentsAdmin useEffect@55`) are still false positives caused by nested-function
body extraction, and are recorded as such rather than as defects.

## Aggregate result

| Check | Result |
|---|---|
| Functions analyzed | 255 |
| Dead / unwired triggers | **0** |
| Server-backed | 106 · local-only 149 (94 with a user trigger) |
| Mutations without refetch | **0** (after detector fix) |
| Silent catch (swallowed error, no user feedback) | **33** |
| Mutations with no in-flight/disabled state | **71** |
| Files lacking any BN/EN switch | 3 |
| Files lacking any responsive breakpoint | 2 |
| Non-responsive `grid-cols-3/4` instances | 71 |
| Modals with `Escape` handling or `role="dialog"` | **0 of 41** |

Auth posture of the 106 API-calling functions: 89 STAFF-gated, 14 open reads,
3 deliberately public (`promotions/validate`, `courier/webhook`, `orders/create`).
No unintended public mutation path remains after PHASE 4 batch 2/2a.

---

## Findings

### F-301 · S2 · Category create/delete never reaches the server
`src/admin/CategoriesAdmin.tsx` `handleAddCategory` / `handleDelete` mutate React
state only (`setCategories([...])`). The server has full CRUD at
`server.ts:465-510` (`GET/POST/PUT/DELETE /api/categories`) and `AppContext`
already exposes persisting `addCategory`/`updateCategory`/`deleteCategory`
helpers (`AppContext.tsx:678-715`) — the screen simply bypasses them. Every
category a merchant creates or deletes is lost on reload.
**Fix:** call the context helpers instead of `setCategories`.

### F-302 · S2 · Expenses are double-written and never reconciled
`FinanceAdmin.handleCreateExpense` (`FinanceAdmin.tsx:191`) POSTs to
`/api/finance/expenses` **and then** calls `addExpense()`, which appends a second
copy to local state with a different `exp-<Date.now()>` id. The screen never
reads expenses back from the server, so the P&L a merchant sees is local state
that silently diverges from the persisted ledger. `handleDeleteExpense` has the
mirror problem: it deletes server-side by the server id and locally by the local
id.
**Fix:** drop the local `addExpense`/`deleteExpense` call and refetch from
`/api/finance/expenses` after a successful write.

### F-303 · S2 · Fraud fallback is hardcoded in the client
`PaymentsAdmin.tsx:55-95`: when `POST /api/orders/fraud-check` fails, the catch
substitutes a locally-computed assessment (`COD && total > 7000 ? HIGH : LOW`).
This is a second, divergent fraud policy living in the UI — it ignores the
blacklist, velocity and history signals the server applies, and it presents an
invented `riskScore` as if it came from the engine.
**Fix:** show an explicit "risk unavailable" state instead of fabricating one.

### F-304 · S2 · No idempotency on expense creation
Verified live: posting an identical expense (same vendor, amount and
`reference`) twice creates two records — count went 3 → 5. A double-click or a
retry on a flaky connection duplicates a cost entry and understates profit.
Refunds are *not* affected (`POST /api/payments/refund` correctly answered
`Refund already processed for this order — duplicate prevented.` on the second
call), so the pattern to copy already exists in the codebase.
**Fix:** reject a duplicate `reference` server-side, and disable the submit
button while in flight (see F-306).

### F-305 · S3 · 33 functions swallow errors silently
`catch` blocks that only `console.error`, leaving the operator with a screen that
appears to have worked. Concentrated in `BackupAdmin` (6), `FraudRiskDashboard`
(5), `SuppliersAdmin` (5). Worst cases are mutations, not loaders:
`SuppliersAdmin.handleCreateSupplier`, `handleCreatePo`, `handleMarkPoReceived`,
`handleTogglePortal`, `FraudRiskDashboard.handleAddBlacklist` /
`handleDeleteBlacklist` / `handleSaveSettings`, `ShipmentsAdmin.handleExecuteDispatch`,
`BulkSupplierImportModal.handleCommitImport`. Full list in the CSV.
**Fix:** surface `showToast('error', ...)` in each catch, bilingual.

### F-306 · S3 · 71 mutations have no in-flight or disabled state
Nothing prevents a second submit while the first is still running, which is the
delivery mechanism for F-304. Includes all 11 `BackupAdmin` write actions
(snapshot create, restore, DR drill, Drive sync), the finance writes, and the
bulk supplier import.
**Fix:** a shared `useSubmitting` hook; disable the trigger and show a spinner.

### F-307 · S3 · No modal is keyboard-accessible
All 41 modal surfaces in `src/admin` and `src/components/admin` lack `Escape`
handling, `role="dialog"`, `aria-modal` and a focus trap. Keyboard and
screen-reader operators cannot close or navigate any dialog.
**Fix:** one shared `<AdminModal>` shell providing Esc, focus trap, restore-focus
and the ARIA attributes; migrate the 41 call sites onto it.

### F-308 · S3 · Mobile breakage on dense admin views
71 `grid-cols-3` / `grid-cols-4` instances declare no `sm:`/`md:` fallback, so
they stay multi-column at 320px (worst: `FulfillmentAdmin`, `FraudRiskDashboard`,
`AnalyticsAdmin`). Three tables have no horizontal-scroll wrapper
(`BulkSupplierImportModal`, `InventoryAdmin` 1 of 3, `BusinessDocumentModal`).
Two files carry no breakpoint at all (`BulkSupplierImportModal`,
`CustomerQuickMessageModal`).
**Fix:** deferred to PHASE 5, which owns the responsive pass end-to-end.

### F-309 · S3 · Three admin screens are English-only
`PaymentsAdmin.tsx`, `SettingsAdmin.tsx`, `BusinessDocumentModal.tsx` contain no
BN branch, breaking the bilingual guarantee the rest of the panel keeps.

### F-310 · S4 · Analyzer false positives (recorded, not defects)
`BackupAdmin.fetchDriveConfig` and `PaymentsAdmin useEffect@55` are reported as
"no catch" but both do catch; the extractor stops at the inner function
boundary. Noted so a later reader does not re-investigate.

---

## Verdict by section

| Section | Functions | PASS | FIX-NEEDED |
|---|---|---|---|
| sales-operations | 52 | 44 | 8 (F-302, F-305, F-306, F-308) |
| catalog-inventory | 29 | 27 | 2 (F-301) |
| customer-management | 13 | 13 | 0 |
| system-administration | 47 | 32 | 15 (F-303, F-305, F-306, F-309) |
| shared-component | 93 | 78 | 15 (F-307, F-308) |
| unrouted | 21 | 21 | 0 |

## Recommended fix order for PHASE 4 batch 3

1. **F-301, F-302** (S2) — data loss and a wrong P&L; smallest diffs, highest value.
2. **F-304** (S2) — duplicate money entries; mirror the existing refund guard.
3. **F-303** (S2) — stop inventing fraud scores.
4. **F-306 + F-305** (S3) — one pass per screen; F-306 also mitigates F-304.
5. **F-307** (S3) — shared modal shell.
6. **F-308, F-309** — fold into PHASE 5 (responsive) and a translation pass.

Still outstanding from batch 2: `requirePermission` is implemented but not yet
attached per route, so a MODERATOR can still invoke SUPER_ADMIN operations.
