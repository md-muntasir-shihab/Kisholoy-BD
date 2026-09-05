#!/usr/bin/env node
/**
 * F-307 — retrofit Escape / focus-trap / ARIA onto the standalone admin modals.
 *
 * Only files that follow the shared shape are touched:
 *   export function X({ isOpen, onClose, ... })  ->  early `if (!isOpen) return null`
 *   -> a `fixed inset-0` overlay element
 *
 * The hook must run before the early return (rules of hooks), so it is inserted
 * immediately after the component's opening brace and the ref is attached to
 * the overlay. Files that do not match are reported and left alone for manual
 * handling rather than being edited blindly.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const targets = process.argv.slice(2);

const report = { patched: [], skipped: [] };

for (const rel of targets) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { report.skipped.push([rel, 'missing']); continue; }
  let s = fs.readFileSync(file, 'utf8');

  if (s.includes('useModalA11y')) { report.skipped.push([rel, 'already done']); continue; }

  // Two component shapes exist in this codebase:
  //   export function X({ ... }) {
  //   export const X: React.FC<P> = ({ ... }) => {
  const FN = /export (?:default )?function (\w+)\(\{([^}]*)\}[^)]*\)\s*\{/;
  const ARROW = /export const (\w+):\s*React\.FC<[^>]*>\s*=\s*\(\{([^}]*)\}[^)]*\)\s*=>\s*\{/;
  const comp = FN.exec(s) || ARROW.exec(s);
  if (!comp) { report.skipped.push([rel, 'no destructured component']); continue; }
  const props = comp[2];
  if (!/\bonClose\b/.test(props)) { report.skipped.push([rel, 'no onClose prop']); continue; }

  // Openness is either an explicit flag or a nullable entity prop that the
  // component early-returns on (`if (!product) return null`).
  let openProp = /\bisOpen\b/.test(props) ? 'isOpen' : (/\bopen\b/.test(props) ? 'open' : null);
  if (!openProp) {
    const gate = /if \(!(\w+)(?: \|\| !\w+)*\) return null;/.exec(s);
    if (gate && new RegExp(`\\b${gate[1]}\\b`).test(props)) openProp = `!!${gate[1]}`;
  }
  if (!openProp) { report.skipped.push([rel, 'no open flag or nullable gate']); continue; }

  // Overlay element to carry the ref + dialog role.
  const overlay = /(<div\s+[^>]*className=(?:"|\{`)[^"`]*fixed inset-0[^"`]*(?:"|`\}))/.exec(s);
  if (!overlay) { report.skipped.push([rel, 'no fixed inset-0 overlay']); continue; }

  // 1. import the hook
  const lastImport = [...s.matchAll(/^import .*;$/gm)].pop();
  const depth = (rel.match(/\//g) || []).length - 1;
  const hookPath = `${'../'.repeat(depth)}hooks/useModalA11y`;
  s = s.slice(0, lastImport.index + lastImport[0].length)
    + `\nimport { useModalA11y } from '${hookPath}';`
    + s.slice(lastImport.index + lastImport[0].length);

  // 2. call the hook right after the component opens (before any early return)
  const compAfter = FN.exec(s) || ARROW.exec(s);
  const insertAt = compAfter.index + compAfter[0].length;
  const name = compAfter[1];
  const hookCall = `
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: ${openProp},
    onClose,
    label: '${name.replace(/Modal$/, '').replace(/([a-z])([A-Z])/g, '$1 $2')}',
  });
`;
  s = s.slice(0, insertAt) + hookCall + s.slice(insertAt);

  // 3. attach ref + dialog props to the overlay
  const ov = /(<div\s+)([^>]*className=(?:"|\{`)[^"`]*fixed inset-0)/.exec(s);
  s = s.slice(0, ov.index) + `<div ref={containerRef} {...dialogProps} ` + s.slice(ov.index + ov[1].length);

  fs.writeFileSync(file, s);
  report.patched.push(rel);
}

console.log(`patched ${report.patched.length}:`);
report.patched.forEach(f => console.log('   ', f));
console.log(`skipped ${report.skipped.length}:`);
report.skipped.forEach(([f, why]) => console.log(`    ${f}  (${why})`));
