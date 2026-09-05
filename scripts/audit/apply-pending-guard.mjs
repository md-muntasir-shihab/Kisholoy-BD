#!/usr/bin/env node
/**
 * F-306 — wrap unguarded async mutation handlers in `usePendingAction().run()`
 * so a double-click cannot fire the same POST/PUT/DELETE twice.
 *
 * Transform:
 *   const handleX = async (a, b) => {      ->  const handleX = async (a, b) => run('handleX', async () => {
 *     ...body...                                 ...body...
 *   };                                        });
 *
 * The hook's ref guard is what actually fixes the bug: it rejects re-entry in
 * the same tick, before React has re-rendered any disabled state.
 *
 * Usage: node scripts/audit/apply-pending-guard.mjs <file>:<handler> ...
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');

// group targets by file
const byFile = new Map();
for (const arg of process.argv.slice(2)) {
  const [file, fn] = arg.split('#');
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push(fn);
}

let wrapped = 0;
const skipped = [];

for (const [rel, fns] of byFile) {
  const abs = path.join(ROOT, rel);
  let src = fs.readFileSync(abs, 'utf8');

  for (const fn of fns) {
    // `const handleX = async (...) => {`  (params may span lines)
    // `fn` comes from a CLI-supplied findings file, so it must be escaped
    // before being spliced into a pattern (CodeQL: regular expression
    // injection). A name like `handle.*` would otherwise match anything.
    const safeFn = fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(\\n(\\s*)const ${safeFn} = async \\(([\\s\\S]*?)\\)(?::[^=]*?)? => \\{\\n)`);
    const m = re.exec(src);
    if (!m) { skipped.push([rel, fn, 'signature not found']); continue; }
    const indent = m[2];
    const bodyStart = m.index + m[1].length;

    // Walk braces from the opening `{` to find the handler's closing `};`.
    let depth = 1, i = bodyStart, end = -1;
    let inStr = null, inTpl = 0, inLine = false, inBlock = false;
    for (; i < src.length; i++) {
      const c = src[i], p = src[i - 1];
      if (inLine) { if (c === '\n') inLine = false; continue; }
      if (inBlock) { if (c === '/' && p === '*') inBlock = false; continue; }
      if (inStr) { if (c === inStr && p !== '\\') inStr = null; continue; }
      if (c === '/' && src[i + 1] === '/') { inLine = true; continue; }
      if (c === '/' && src[i + 1] === '*') { inBlock = true; continue; }
      if (c === "'" || c === '"') { inStr = c; continue; }
      if (c === '`') { inTpl ^= 1; continue; }
      if (inTpl) continue;
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) { skipped.push([rel, fn, 'unbalanced body']); continue; }
    if (src.slice(end, end + 2) !== '};') { skipped.push([rel, fn, 'no `};` terminator']); continue; }

    src =
      src.slice(0, m.index + m[1].length - 2) +          // up to the `{\n`
      ` run('${fn}', async () => {\n` +
      src.slice(bodyStart, end) +
      `${indent}});` +
      src.slice(end + 2);
    wrapped++;
  }

  // Ensure the hook is imported and instantiated once per component.
  if (!/import .*usePendingAction/.test(src)) {
    const imports = [...src.matchAll(/^import .*;$/gm)];
    const last = imports[imports.length - 1];
    const depth = rel.split('/').length - 2;
    src = src.slice(0, last.index + last[0].length)
      + `\nimport { usePendingAction } from '${'../'.repeat(depth)}hooks/usePendingAction';`
      + src.slice(last.index + last[0].length);
  }
  if (!/const \{[^}]*\brun\b/.test(src)) {
    // Insert after the first hook call inside the component.
    // Must be a single-line useState declaration: a lazy initialiser
    // (`useState(() => {`) spans lines and the hook would land inside it.
    const anchor = /\n(\s*)const \[[^\]]+\] = useState[^\n]*\);\n/.exec(src);
    if (anchor) {
      const ind = anchor[1];
      const at = anchor.index + anchor[0].length;
      src = src.slice(0, at)
        + `${ind}// F-306: blocks duplicate submits while a mutation is in flight.\n`
        + `${ind}const { run, isPending, isBusy } = usePendingAction();\n`
        + src.slice(at);
    } else {
      skipped.push([rel, '*', 'no useState anchor for hook init']);
    }
  }

  fs.writeFileSync(abs, src);
  console.log(`${rel}: ok`);
}

console.log(`\nwrapped ${wrapped} handlers`);
if (skipped.length) {
  console.log('skipped:');
  skipped.forEach(([f, fn, why]) => console.log(`  ${f} ${fn} (${why})`));
}
