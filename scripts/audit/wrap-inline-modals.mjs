#!/usr/bin/env node
/**
 * F-307 (part 2) — wrap inline `{cond && (<div className="fixed inset-0…">…)}`
 * overlays in `<AdminModalShell>` so they get Escape, a focus trap, focus
 * restore and ARIA dialog roles.
 *
 * Only the exact shape below is rewritten; anything else is reported and left
 * for manual work. Brace/paren balance is tracked so the correct closing
 * `</div>)}` is replaced, and a preceding `{/* comment *​/}` supplies the
 * dialog's accessible name.
 *
 * Close handler: derived from the condition. `showFoo` -> setShowFoo(false),
 * `editRoleUser` -> setEditRoleUser(null). Both setters are verified to exist
 * in the file before the rewrite is accepted.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const files = process.argv.slice(2);
const summary = { wrapped: 0, skipped: [] };

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function labelFor(lines, openIdx, cond) {
  for (let i = openIdx - 1; i >= Math.max(0, openIdx - 3); i--) {
    const m = /\{\/\*\s*(?:MODAL:\s*)?(.+?)\s*\*\/\}/.exec(lines[i]);
    if (m) {
      return m[1]
        .replace(/\(.*?\)/g, '')
        .replace(/[^\w\s&-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60);
    }
  }
  return cond.replace(/^(show|is|active|editing|edit)/, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim() || 'Dialog';
}

for (const rel of files) {
  const file = path.join(ROOT, rel);
  let src = fs.readFileSync(file, 'utf8');
  let lines = src.split('\n');
  let changed = 0;

  for (let i = 0; i < lines.length; i++) {
    // `{cond && (` on its own line, followed by a fixed inset-0 div
    // Single condition, or a compound guard like `{aOpen && entity && (`.
    // The first identifier owns the open-state and drives the close handler;
    // the whole expression is kept as the `open` test.
    const condM = /^(\s*)\{([A-Za-z_$][\w.$]*(?:\s*&&\s*!?[A-Za-z_$][\w.$]*)*)\s*&&\s*\(\s*$/.exec(lines[i]);
    if (!condM) continue;
    const [, indent, expr] = condM;
    const cond = expr.split('&&')[0].trim().replace(/^!/, '');
    const openTest = expr.trim();
    const divM = /^\s*<div className="([^"]*fixed inset-0[^"]*)"\s*>\s*$/.exec(lines[i + 1] || '');
    if (!divM) continue;

    // Resolve the setter and the "closed" value.
    let setter, closedValue;
    if (/^(show|is)[A-Z]/.test(cond)) {
      setter = `set${cap(cond)}`;
      closedValue = 'false';
    } else {
      setter = `set${cap(cond)}`;
      closedValue = 'null';
    }
    if (!new RegExp(`\\b${setter}\\b`).test(src)) {
      summary.skipped.push([rel, i + 1, `no ${setter}`]);
      continue;
    }

    // Find the matching close: walk to the `</div>` that ends this element,
    // then expect `)}`.
    let depth = 0, end = -1;
    for (let j = i + 1; j < lines.length; j++) {
      const opens = (lines[j].match(/<div[\s>]/g) || []).length;
      const closes = (lines[j].match(/<\/div>/g) || []).length;
      depth += opens - closes;
      if (depth === 0) { end = j; break; }
    }
    if (end === -1) { summary.skipped.push([rel, i + 1, 'unbalanced']); continue; }

    const closeLine = lines[end];
    const tailIdx = /^\s*<\/div>\s*$/.test(closeLine) && /^\s*\)\}\s*$/.test(lines[end + 1] || '')
      ? end + 1
      : (/^\s*<\/div>\s*\)\}\s*$/.test(closeLine) ? end : -1);
    if (tailIdx === -1) { summary.skipped.push([rel, i + 1, 'unexpected close']); continue; }

    const label = labelFor(lines, i, cond);
    lines[i] = `${indent}<AdminModalShell`;
    lines[i + 1] = `${indent}  open={!!(${openTest})}\n${indent}  onClose={() => ${setter}(${closedValue})}\n${indent}  label="${label}"\n${indent}  overlayClassName="${divM[1]}"\n${indent}>`;
    if (tailIdx === end) lines[end] = `${indent}</AdminModalShell>`;
    else { lines[end] = '\u0000DROP'; lines[tailIdx] = `${indent}</AdminModalShell>`; }
    changed++;
    summary.wrapped++;
  }

  if (changed) {
    src = lines.filter(l => l !== '\u0000DROP').join('\n');
    if (!src.includes('AdminModalShell}') && !/import .*AdminModalShell/.test(src)) {
      const imports = [...src.matchAll(/^import .*;$/gm)];
      const last = imports[imports.length - 1];
      const depth = rel.split('/').length - 2;
      const p = rel.startsWith('src/components/admin/')
        ? './AdminModalShell'
        : `${'../'.repeat(depth)}components/admin/AdminModalShell`;
      src = src.slice(0, last.index + last[0].length)
        + `\nimport { AdminModalShell } from '${p}';`
        + src.slice(last.index + last[0].length);
    }
    fs.writeFileSync(file, src);
    console.log(`${rel}: wrapped ${changed}`);
  }
}

console.log(`\ntotal wrapped: ${summary.wrapped}`);
if (summary.skipped.length) {
  console.log('skipped:');
  summary.skipped.forEach(([f, l, why]) => console.log(`  ${f}:${l} (${why})`));
}
