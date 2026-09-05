#!/usr/bin/env node
/**
 * PHASE 4 — responsive/mobile regression guard.
 *
 * Static checks only. It cannot tell you a layout *looks* right, but it does
 * catch the four mistakes that actually broke this codebase on a 375px screen:
 *
 *   1. form rows locked to multiple columns, giving ~160px-wide inputs
 *   2. wide tables with no horizontal scroll container
 *   3. icon-only buttons with a tap target under 44px
 *   4. fixed pixel widths that cannot fit a phone viewport
 *
 * Layouts that are legitimately multi-column on phones (stat pairs, steppers,
 * bar charts) are deliberately not flagged — see the classifier below.
 *
 * Usage: node scripts/audit/responsive-audit.mjs [--json]
 * Exit code 1 when any issue is found, so it can gate CI.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SRC = path.join(ROOT, 'src');

// Print templates render to paper; viewport rules do not apply.
const PRINT_TEMPLATES = new Set([
  'PrintTemplates.tsx',
  'PurchaseDocumentTemplate.tsx',
  'ReportTemplate.tsx',
  'SupplierStatementTemplate.tsx',
  'BusinessDocumentModal.tsx',
]);

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.tsx')) acc.push(p);
  }
  return acc;
}

const files = walk(SRC);
const issues = [];
const add = (file, rule, detail) =>
  issues.push({ file: path.relative(ROOT, file), rule, detail });

for (const file of files) {
  const base = path.basename(file);
  const s = fs.readFileSync(file, 'utf8');
  const isPrint = PRINT_TEMPLATES.has(base);

  // ---- 1. form grids that never collapse to one column ---------------------
  for (const m of s.matchAll(/className="([^"]*\bgrid-cols-([2-9])\b[^"]*)"/g)) {
    const cls = m[1];
    if (/(sm:|md:|lg:|xl:)grid-cols-/.test(cls)) continue;
    // Only a grid holding real form controls is a problem. Two short stats or
    // a 5-step tracker side by side is fine on a phone.
    const body = s.slice(m.index + m[0].length, m.index + m[0].length + 900);
    if (!/<(input|select|textarea|label)\b/.test(body)) continue;
    add(file, 'form-grid-no-stack', `grid-cols-${m[2]} with form fields and no sm: fallback`);
  }

  // ---- 2. tables with no horizontal scroll ---------------------------------
  if (!isPrint) {
    for (const m of s.matchAll(/<table\b/g)) {
      const before = s.slice(Math.max(0, m.index - 500), m.index);
      if (/overflow-(x-)?auto/.test(before)) continue;
      add(file, 'table-no-scroll', 'table without an overflow-x-auto container');
    }
  }

  // ---- 3. icon-only buttons with a small tap target ------------------------
  for (const m of s.matchAll(/<button\b([^>]*)>\s*(<[A-Z]\w+[^>]*\/>)\s*<\/button>/g)) {
    const cls = /className="([^"]*)"/.exec(m[1])?.[1] ?? '';
    if (/min-[wh]-/.test(cls)) continue;
    const pads = [...cls.matchAll(/\b(?:p|px|py)-([0-9.]+)/g)].map(x => parseFloat(x[1]));
    const icon = parseFloat(/w-([0-9.]+)/.exec(m[2])?.[1] ?? '4');
    const px = (icon + 2 * Math.min(...(pads.length ? pads : [0]))) * 4;
    if (px < 40) add(file, 'small-tap-target', `icon-only button ~${Math.round(px)}px (want >=44px on touch)`);
  }

  // ---- 4. fixed widths wider than a small phone ----------------------------
  for (const m of s.matchAll(/\b(?:min-)?w-\[(\d{3,4})px\]/g)) {
    if (Number(m[1]) <= 360 || isPrint) continue;
    const line = s.slice(s.lastIndexOf('\n', m.index) + 1, s.indexOf('\n', m.index));
    // Legitimate: breakpoint-scoped (`sm:w-[420px]`, `2xl:max-w-[1440px]`),
    // capped by a viewport max (`max-w-[95vw]`), or a deliberate device-frame
    // preview (ContentAdmin renders a simulated phone at exactly 375px).
    if (/(sm|md|lg|xl|2xl):(max-)?w-\[/.test(line)) continue;
    if (/max-w-\[\d+vw\]/.test(line)) continue;
    if (/rounded-3xl border-8/.test(line)) continue;
    add(file, 'fixed-width', `${m[0]} exceeds a 360px viewport`);
  }
}

const asJson = process.argv.includes('--json');
if (asJson) {
  console.log(JSON.stringify(issues, null, 2));
} else {
  const byRule = {};
  for (const i of issues) (byRule[i.rule] ??= []).push(i);
  console.log(`responsive audit — ${files.length} files scanned\n`);
  for (const rule of ['form-grid-no-stack', 'table-no-scroll', 'small-tap-target', 'fixed-width']) {
    const list = byRule[rule] ?? [];
    console.log(`  ${rule.padEnd(20)} ${list.length}`);
    for (const i of list.slice(0, 6)) console.log(`      ${i.file}: ${i.detail}`);
    if (list.length > 6) console.log(`      … ${list.length - 6} more`);
  }
  console.log(`\n  total: ${issues.length}`);
}

process.exit(issues.length ? 1 : 0);
