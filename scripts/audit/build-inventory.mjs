#!/usr/bin/env node
/**
 * PHASE 1 — Inventory generator for the Kisholoy-BD admin audit.
 *
 * Emits:
 *   docs/audit/INVENTORY-functions.csv   (1A) every user-triggered admin function
 *   docs/audit/INVENTORY-api.csv         (1B) server route <-> client caller contract map
 *   docs/audit/INVENTORY-orphans.md      (1B addendum) orphan endpoints & orphan components
 *
 * Static analysis only — brace-matched function bodies, no execution.
 * Re-run any time:  node scripts/audit/build-inventory.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'docs/audit');
fs.mkdirSync(OUT, { recursive: true });

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const listFiles = (dir, ext = '.tsx') =>
  fs.existsSync(path.join(ROOT, dir))
    ? fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(ext)).map((f) => `${dir}/${f}`)
    : [];

// ---------------------------------------------------------------- route map
const routeMap = (() => {
  const app = read('src/App.tsx');
  const map = {};
  for (const m of app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<(\w+)/g)) map[m[2]] = m[1];
  for (const m of app.matchAll(/<Route\s+index\s+element=\{<(\w+)/g)) map[m[1]] = '/admin';
  return map;
})();

// -------------------------------------------------------- sidebar section map
const SECTION_OF_ROUTE = (() => {
  const src = read('src/admin/adminModulesData.ts');
  const out = {};
  let section = null;
  for (const line of src.split('\n')) {
    const s = /id:\s*'(sales-operations|catalog-inventory|customer-management|system-administration)'/.exec(line);
    if (s) section = s[1];
    const p = /path:\s*'([^']+)'/.exec(line);
    if (p && section) out[p[1]] = section;
  }
  return out;
})();

// ------------------------------------------------------------------ helpers
const uniq = (a) => [...new Set(a)].filter(Boolean);
const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';

/** Extract the balanced body starting at the first `{` at/after `from`. */
function bodyFrom(src, from) {
  const start = src.indexOf('{', from);
  if (start < 0) return '';
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return src.slice(start, Math.min(src.length, start + 4000));
}

const normPath = (p) =>
  p.replace(/\$\{[^}]*\}/g, ':x').replace(/[?"'`].*$/, '').replace(/\/+$/, '');

function apiCallsIn(body) {
  const calls = [];
  // fetch('/api/..', { method: 'POST' }) / apiFetch(`/api/..`)
  const re = /(?:api)?[fF]etch(?:Json)?\(\s*[`'"]([^`'"]*\/api\/[^`'"]*)[`'"]([\s\S]{0,220})?/g;
  for (const m of re.exec_all_shim ? [] : [...body.matchAll(re)]) {
    const p = normPath(m[1]);
    const method = /method:\s*['"](\w+)['"]/.exec(m[2] || '')?.[1] || 'GET';
    calls.push(`${method.toUpperCase()} ${p}`);
  }
  return uniq(calls);
}

const CONTEXT_KEYS = [
  'orders','setOrders','products','setProducts','categories','setCategories','customers','setCustomers',
  'inventoryTransactions','expenses','settlements','siteContent','updateSiteContent','contentRevisions',
  'warehouses','stockMatrix','transfers','pickLists','manifests','auditLogs','automationJobs',
  'currentRole','setCurrentRole','language','showToast','customerProfile','savedAddresses','wishlist',
  'returnRequests','customerNotifications','customerLoyalty','currentCustomerId','loginCustomer','logoutCustomer',
];

function contextUse(body) {
  const reads = [], writes = [];
  for (const k of CONTEXT_KEYS) {
    if (new RegExp(`\\b${k}\\b`).test(body)) (k.startsWith('set') || k.startsWith('update') ? writes : reads).push(k);
  }
  return { reads: uniq(reads), writes: uniq(writes) };
}

const RBAC = (() => {
  const src = read('src/admin/AdminLayout.tsx');
  const out = {};
  for (const m of src.matchAll(/'(\/admin\/[\w-]+)':\s*\{\s*requiredPermission:\s*'(\w+)'/g)) out[m[1]] = m[2];
  return out;
})();

// ------------------------------------------------------- 1A function inventory
const ADMIN_FILES = [...listFiles('src/admin'), ...listFiles('src/components/admin')];
const funcRows = [[
  'section','module','route','file','function_name','ui_trigger','purpose_1line',
  'calls_api','reads_context','writes_context','writes_localStorage','emits_audit_log',
  'emits_notification','guarded_by_permission',
]];

const perFile = {};

for (const file of ADMIN_FILES) {
  const src = read(file);
  const comp = path.basename(file, '.tsx');
  const route = routeMap[comp] ? (routeMap[comp].startsWith('/') ? routeMap[comp] : `/admin/${routeMap[comp]}`) : '';
  const section = SECTION_OF_ROUTE[route] || (route ? 'unrouted' : 'shared-component');
  const perm = RBAC[route] || 'none';

  // handlers: const handleX = ... / const doX = async ...
  const decls = [...src.matchAll(/const\s+([a-zA-Z_$][\w$]*)\s*=\s*(async\s*)?\(([^)]*)\)\s*(?::[^=]*)?=>/g)];
  const effects = [...src.matchAll(/useEffect\(/g)].map((m) => ({ name: `useEffect@${src.slice(0, m.index).split('\n').length}`, index: m.index }));

  const items = [
    ...decls
      .filter((m) => /^(handle|on|do|submit|save|load|fetch|refresh|create|update|delete|toggle|export|print|open|close|apply|confirm|dispatch|retry|verify|sync|run)/i.test(m[1]))
      .map((m) => ({ name: m[1], index: m.index, kind: 'handler' })),
    ...effects.map((e) => ({ ...e, kind: 'effect' })),
  ].sort((a, b) => a.index - b.index);

  const seen = new Set();
  for (const it of items) {
    if (seen.has(it.name)) continue;
    seen.add(it.name);
    const body = bodyFrom(src, it.index);
    const apis = apiCallsIn(body);
    const { reads, writes } = contextUse(body);
    const ls = uniq([...body.matchAll(/localStorage\.(?:set|get|remove)Item\(\s*['"`]([^'"`]+)/g)].map((m) => m[1]));
    // Where is this handler actually referenced? (excluding its own declaration)
    const elsewhere = src.replace(new RegExp(`const\\s+${it.name}\\s*=`), '');
    const jsxProp = new RegExp(`\\b(on[A-Z]\\w*)=\\{(?:\\s*\\(\\)\\s*=>\\s*)?${it.name}\\b`).exec(elsewhere)
      || new RegExp(`\\b(on[A-Z]\\w*)=\\{[^}]*\\b${it.name}\\s*\\(`).exec(elsewhere);
    const trigger =
      it.kind === 'effect' ? 'effect(mount/dep)' :
      new RegExp(`onSubmit=\\{[^}]*${it.name}`).test(elsewhere) ? 'form submit' :
      new RegExp(`onClick=\\{[^}]*${it.name}`).test(elsewhere) ? 'button click' :
      new RegExp(`onChange=\\{[^}]*${it.name}`).test(elsewhere) ? 'input change' :
      jsxProp ? `prop:${jsxProp[1]} (child component)` :
      new RegExp(`\\b${it.name}\\s*\\(`).test(elsewhere) ? 'called internally' : 'UNWIRED?';
    const line = src.slice(0, it.index).split('\n').length;

    funcRows.push([
      section, comp, route || '(none)', `${file}:${line}`, it.name, trigger,
      it.kind === 'effect' ? 'data load / sync on mount or dependency change' : `${it.name} action`,
      apis.join(' | ') || 'NONE',
      reads.join(' ') || '-', writes.join(' ') || '-', ls.join(' ') || '-',
      /audit/i.test(body) ? 'y' : 'n',
      /(notification|showToast|dispatch-event|sms|whatsapp)/i.test(body) ? 'y' : 'n',
      perm,
    ]);
  }
  perFile[file] = { comp, route, section, apis: apiCallsIn(src) };
}

fs.writeFileSync(path.join(OUT, 'INVENTORY-functions.csv'), csv(funcRows));

// ------------------------------------------------------------- 1B API contract
const server = read('server.ts');
const serverLines = server.split('\n');
const routes = [];
for (const m of server.matchAll(/app\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)) {
  const line = server.slice(0, m.index).split('\n').length;
  const body = bodyFrom(server, m.index);
  const engines = uniq(
    [...body.matchAll(/\b(serverDb|financeEngine|paymentService|courierService|smsService|queueService|reportService|webhookService|notificationService|fraudEngine|fulfillmentEngine|promotionEngine|marketingService|marketingCommandCenter|securityEngine|backupEngine|supplierEngine)\b/g)].map((x) => x[1]),
  );
  const mutates = uniq(
    [...body.matchAll(/serverDb\.(\w+)/g)].map((x) => x[1]).filter((x) => !/^(orders|products|customers|suppliers|categories)$/.test(x) || /(add|update|delete|adjust|push)/i.test(body)),
  ).slice(0, 8);
  routes.push({
    method: m[1].toUpperCase(),
    path: m[2],
    line,
    engines,
    mutates,
    auth: /authorization|Bearer|verifySession|requireStaff/i.test(body) ? 'y' : 'n',
  });
}

// all client-side api references (whole src tree)
const allSrc = [];
(function walk(d) {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    const rel = `${d}/${e.name}`;
    if (e.isDirectory()) walk(rel);
    else if (/\.(tsx?|ts)$/.test(e.name)) allSrc.push(rel);
  }
})('src');

const callers = {}; // normalizedPath -> Set(file)
for (const f of allSrc) {
  const s = read(f);
  for (const m of s.matchAll(/[`'"](\/api\/[^`'"]*)[`'"]/g)) {
    const p = normPath(m[1]);
    (callers[p] ||= new Set()).add(f);
  }
}
const callerFor = (routePath) => {
  const norm = routePath.replace(/:[A-Za-z]+/g, ':x').replace(/\/+$/, '');
  const hits = new Set();
  for (const [p, files] of Object.entries(callers)) {
    if (p === norm || p.replace(/\/[^/]*$/, '') === norm || norm.startsWith(p + '/') || p.startsWith(norm + '/')) {
      if (p === norm) files.forEach((f) => hits.add(f));
    }
  }
  if (hits.size === 0 && callers[norm]) callers[norm].forEach((f) => hits.add(f));
  // loose: same path with :x collapsed
  if (hits.size === 0) {
    for (const [p, files] of Object.entries(callers)) {
      if (p.replace(/:x/g, '') === norm.replace(/:x/g, '')) files.forEach((f) => hits.add(f));
    }
  }
  return [...hits];
};

const apiRows = [['method','path','handler_line','engines_used','mutates','called_from','auth_in_handler','rbac_permission','status']];
const orphans = [];
for (const r of routes) {
  if (r.path === '*') continue;
  const from = callerFor(r.path);
  const status = from.length ? 'WIRED' : 'ORPHAN(no client caller)';
  if (!from.length) orphans.push(r);
  apiRows.push([
    r.method, r.path, `server.ts:${r.line}`, r.engines.join(' '), r.mutates.join(' '),
    from.join(' | ') || 'NONE', r.auth, '-', status,
  ]);
}
fs.writeFileSync(path.join(OUT, 'INVENTORY-api.csv'), csv(apiRows));

// ------------------------------------------------------------ orphan report
const routedComponents = new Set(Object.keys(routeMap));
const orphanComponents = ADMIN_FILES
  .map((f) => ({ f, comp: path.basename(f, '.tsx') }))
  .filter(({ f, comp }) => {
    if (f.includes('components/admin')) return false; // modals are imported, not routed
    if (routedComponents.has(comp)) return false;
    const usedElsewhere = allSrc.some((o) => o !== f && read(o).includes(`<${comp}`));
    return !usedElsewhere;
  });

const md = [];
md.push('# PHASE 1B addendum — Orphans\n');
md.push(`_Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/audit/build-inventory.mjs\`_\n`);
md.push(`## Orphan server endpoints (${orphans.length} of ${routes.length})\n`);
md.push('No client file references these paths. Decide per endpoint: **(a) wire into UI**, **(b) document as internal/webhook**, **(c) flag deprecated**. Do not delete.\n');
md.push('| Method | Path | Handler | Engines |');
md.push('|---|---|---|---|');
for (const r of orphans) md.push(`| ${r.method} | \`${r.path}\` | server.ts:${r.line} | ${r.engines.join(', ') || '-'} |`);
md.push(`\n## Orphan admin components (${orphanComponents.length})\n`);
md.push('| Component | File | Note |');
md.push('|---|---|---|');
for (const o of orphanComponents) md.push(`| ${o.comp} | \`${o.f}\` | not routed in App.tsx and not rendered by any other file |`);
fs.writeFileSync(path.join(OUT, 'INVENTORY-orphans.md'), md.join('\n') + '\n');

console.log(`functions: ${funcRows.length - 1}`);
console.log(`routes:    ${routes.length}  orphan endpoints: ${orphans.length}`);
console.log(`orphan components: ${orphanComponents.map((o) => o.comp).join(', ') || 'none'}`);
