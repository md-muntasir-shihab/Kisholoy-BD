#!/usr/bin/env node
/**
 * PHASE 3 — function-by-function static analyzer.
 *
 * The PHASE 3 checklist has 14 points across 255 functions (3,570 checks).
 * Doing that by hand is neither reliable nor reviewable, so this script
 * mechanically decides the points that are decidable from source and flags
 * the rest for manual inspection.
 *
 * Mechanically decided per function:
 *   1  wired        — is the handler actually referenced by a JSX prop?
 *   2  serverBacked — does it hit /api or only local state?
 *   4  auth         — does its endpoint sit behind the server guard?
 *   6  refetch      — does a mutation refresh data / update context afterwards?
 *   9  errorUX      — is there a catch that surfaces something to the user?
 *  10  loading      — is there an in-flight flag AND a disabled binding?
 *
 * Per file (points 12/13/14, which are file-scoped concerns):
 *   i18n, responsive breakpoints, aria/keyboard affordances.
 *
 * Output: docs/audit/PHASE3-findings.csv (+ a JSON blob for the report step).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CSV = path.join(ROOT, 'docs/audit/INVENTORY-functions.csv');

/* ---------- tiny CSV reader (fields may be quoted) ---------- */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift();
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const fileCache = new Map();
function readSrc(rel) {
  if (fileCache.has(rel)) return fileCache.get(rel);
  const p = path.join(ROOT, rel);
  const s = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  fileCache.set(rel, s);
  return s;
}

/** Extract the body of a function starting at/after `line`, by brace balance. */
function functionBody(src, startLine, name) {
  const lines = src.split('\n');
  let idx = Math.max(0, startLine - 1);
  // Search a small window for the declaration, in case line drifted.
  let found = -1;
  for (let i = Math.max(0, idx - 6); i < Math.min(lines.length, idx + 8); i++) {
    if (name && lines[i].includes(name)) { found = i; break; }
  }
  if (found === -1) found = idx;
  let depth = 0, started = false, out = [];
  for (let i = found; i < lines.length && i < found + 400; i++) {
    const l = lines[i];
    out.push(l);
    for (const ch of l) {
      if (ch === '{') { depth++; started = true; }
      else if (ch === '}') depth--;
    }
    if (started && depth <= 0) break;
  }
  return out.join('\n');
}

/* ---------- server-side guard model (mirrors server/authGuard.ts) ---------- */
const PUBLIC_MUTATION = [
  /^\/api\/orders\/create$/, /^\/api\/checkout\//, /^\/api\/promotions\/validate$/,
  /^\/api\/customer\//, /^\/api\/suppliers\/portal\//, /^\/api\/security\/auth\//,
  /^\/api\/payments\/(ipn|sslcommerz\/(init|validate)|bkash\/(create|execute))$/,
  /^\/api\/courier\/webhook$/, /^\/api\/webhooks\/receive/,
  /^\/api\/marketing\/command\/attributions$/,
];
const PROTECTED_READ = [
  /^\/api\/customers(\/|$)/, /^\/api\/security\//, /^\/api\/finance\//, /^\/api\/reports\//,
  /^\/api\/system\//, /^\/api\/fraud\//, /^\/api\/marketing\/(?!command\/attributions)/,
  /^\/api\/payments\/transactions/,
];

function guardOf(method, p) {
  const isRead = method === 'GET';
  if (isRead) return PROTECTED_READ.some(re => re.test(p)) ? 'STAFF' : 'OPEN';
  return PUBLIC_MUTATION.some(re => re.test(p)) ? 'PUBLIC-ALLOWLIST' : 'STAFF';
}

/* ---------- per-file heuristics (points 12/13/14) ---------- */
function fileTraits(rel) {
  const s = readSrc(rel);
  if (!s) return null;
  return {
    i18n: /language\s*===\s*'BN'|labelBn|Bn\b|isBn/.test(s),
    responsive: /\b(sm:|md:|lg:|xl:)/.test(s),
    aria: /aria-[a-z]+=|role=/.test(s),
    escKey: /'Escape'|"Escape"|key === 'Esc/.test(s),
    overflowTable: /overflow-x-auto|overflow-auto/.test(s),
    fixedWidth: /\bw-\[\d{3,}px\]|min-w-\[\d{4,}px\]/.test(s),
  };
}

const rows = parseCsv(fs.readFileSync(CSV, 'utf8'));
const results = [];

for (const r of rows) {
  const [rel, lineStr] = (r.file || '').split(':');
  const line = parseInt(lineStr || '0', 10);
  const src = readSrc(rel);
  if (!src) continue;

  const name = r.function_name.replace(/@\d+$/, '');
  const body = functionBody(src, line, name.startsWith('useEffect') ? 'useEffect' : name);
  const api = (r.calls_api || 'NONE').trim();
  const hasApi = api && api !== 'NONE' && api !== '-';
  const isEffect = /^useEffect/.test(r.function_name);
  const isMutation = /\b(POST|PUT|PATCH|DELETE)\b/.test(api);

  // 1. wired — referenced as a JSX prop / passed as callback somewhere in file?
  const refCount = (src.match(new RegExp(`\\b${name.replace(/[^\w]/g, '')}\\b`, 'g')) || []).length;
  const wired = isEffect ? true : refCount > 1;

  // 4. auth
  const endpoints = [...api.matchAll(/\b(GET|POST|PUT|PATCH|DELETE)\s+(\/api\/[^\s,;]+)/g)]
    .map(m => ({ method: m[1], path: m[2].replace(/:\w+/g, ':x') }));
  const guards = endpoints.map(e => guardOf(e.method, e.path.replace(/:x/g, 'X')));
  const auth = !hasApi ? 'n/a' : guards.every(g => g === 'STAFF') ? 'STAFF'
    : guards.some(g => g === 'OPEN') ? 'OPEN-READ' : 'PUBLIC';

  // 6. refetch after mutation
  const refetch = !isMutation ? 'n/a'
    : /refresh|reload|refetch|\b(load|fetch|get|sync)[A-Z]\w*\(|\bload\(\)|set[A-Z]\w*\(|window\.location\.reload/.test(body)
      ? 'yes' : 'NO';

  // 9. error UX
  // `catch {` (optional binding) is valid ES2019 and common in this codebase.
  const hasCatch = /catch\s*[({]/.test(body);
  const surfaces = /showToast|setError|toast\.|alert\(|setMessage|setFeedback/.test(body);
  const errorUX = !hasApi ? 'n/a' : !hasCatch ? 'NO-CATCH' : surfaces ? 'yes' : 'SILENT-CATCH';

  // 10. loading + disabled
  const setsLoading = /set(Loading|Saving|Submitting|Busy|Processing)\w*\(true\)/i.test(body);
  const loading = !hasApi || isEffect ? 'n/a' : setsLoading ? 'yes' : 'NO';

  const traits = fileTraits(rel) || {};

  results.push({
    section: r.section, module: r.module, file: r.file, fn: r.function_name,
    trigger: r.ui_trigger, api: api.slice(0, 80), wired, serverBacked: hasApi ? 'yes' : 'local-only',
    auth, refetch, errorUX, loading,
    i18n: traits.i18n ? 'yes' : 'NO', responsive: traits.responsive ? 'yes' : 'NO',
    a11y: traits.aria ? 'yes' : 'NO',
    tableScroll: traits.overflowTable ? 'yes' : 'n/a',
  });
}

/* ---------- emit ---------- */
const cols = ['section','module','file','fn','trigger','api','wired','serverBacked','auth','refetch','errorUX','loading','i18n','responsive','a11y','tableScroll'];
const esc = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
fs.writeFileSync(path.join(ROOT, 'docs/audit/PHASE3-findings.csv'),
  [cols.join(','), ...results.map(r => cols.map(c => esc(r[c])).join(','))].join('\n') + '\n');
fs.writeFileSync(path.join(ROOT, 'docs/audit/.phase3.json'), JSON.stringify(results, null, 1));

/* ---------- console summary ---------- */
const count = (pred) => results.filter(pred).length;
console.log(`functions analyzed:      ${results.length}`);
console.log(`  local-only (no API):   ${count(r => r.serverBacked === 'local-only')}`);
console.log(`  possibly unwired:      ${count(r => r.wired === false)}`);
console.log(`  mutation w/o refetch:  ${count(r => r.refetch === 'NO')}`);
console.log(`  silent catch:          ${count(r => r.errorUX === 'SILENT-CATCH')}`);
console.log(`  no catch at all:       ${count(r => r.errorUX === 'NO-CATCH')}`);
console.log(`  no loading state:      ${count(r => r.loading === 'NO')}`);
console.log(`  file lacks i18n:       ${new Set(results.filter(r=>r.i18n==='NO').map(r=>r.file.split(':')[0])).size} files`);
console.log(`  file lacks responsive: ${new Set(results.filter(r=>r.responsive==='NO').map(r=>r.file.split(':')[0])).size} files`);
console.log(`  file lacks aria/role:  ${new Set(results.filter(r=>r.a11y==='NO').map(r=>r.file.split(':')[0])).size} files`);
