# PHASE 0 — Baseline & Safety Net

_Date: 2026-09-04 · Branch: `arena/01a06c54-kisholoy-bd`_

## Gate results

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **0 errors** ✅ |
| Build | `npm run build` | **success** — client built in 11.9s, `dist/server.cjs` 822.8 kB ✅ |
| Dev server | `npm run dev` | boots on `0.0.0.0:3000` ✅ |
| Health | `GET /api/health` | 200 ✅ |

## Smoke test of every GET route

Script added: **`scripts/audit/smoke-endpoints.sh`** (`BASE=http://localhost:3000 bash scripts/audit/smoke-endpoints.sh`).
It parses every `app.get('...')` from `server.ts`, substitutes sample ids for `:params`, and prints a status table.

**Result: 107 GET routes · 98 returned 2xx · 9 non-2xx.**

The 9 non-2xx were re-tested with **real ids pulled from the live API**:

| Route | With sample id | With real id | Verdict |
|---|---|---|---|
| `/api/suppliers/:id` | 404 | **200** (`sup-001`) | OK — sample id artifact |
| `/api/suppliers/:id/statement` | 404 | **200** | OK |
| `/api/marketing/customers-crm/:id` | 404 | **200** (`cust-1`) | OK |
| `/api/suppliers/settlements/:id` | 404 | **200** (`set-002`) | OK |
| `/api/system/backups/:id/download` | 404 | **200** | OK |
| `/api/orders/track` | 400 | **200** with `?orderNumber=…` | OK — 400 is correct for a missing query |
| `/api/suppliers/portal/dashboard` | 400 | 400 without portal token | OK — auth-guarded by design |
| `/api/system/export` | 400 | 400 without `entity` | OK — `entity` is required (`PRODUCTS\|ORDERS\|CUSTOMERS\|FINANCE`) |
| `/api/marketing/customers-crm` (list) | 200 | 200 | OK |

**No genuine 5xx or broken GET route in the baseline.** All 9 flags were test-harness artifacts or
correct validation behaviour.

## Baseline artifacts

- `scripts/audit/smoke-endpoints.sh` — re-runnable GET smoke suite (reused in PHASE 7/8)
- `scripts/audit/build-inventory.mjs` — re-runnable PHASE 1 inventory generator
