// Run from repository root: node scripts/check-styles.mjs
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const groups = {
  'discos.css': ['discos.base.css', 'discos.header.css', 'discos.deck.css', 'discos.ios-player.css', 'discos.library.css', 'discos.responsive.css'],
  'site-theme.css': ['site-theme.tokens.css', 'site-theme.editorial.css', 'site-theme.header.css'],
  'footer-sign.css': ['footer-sign.effects.css', 'footer-sign.layout.css', 'footer-sign.viewport.css', 'footer-sign.touch.css'],
  'home-flow.css': ['home-flow.layout.css', 'home-flow.releases.css', 'home-flow.archive.css', 'home-flow.refinements.css', 'home-flow.motion.css']
};
const pages = {
  'index.html': ['home-flow.css', 'footer-sign.css', 'site-theme.css'],
  'discos.html': ['discos.css', 'footer-sign.css', 'site-theme.css'],
  'sessions.html': ['footer-sign.css', 'site-theme.css'],
  'eventos.html': ['footer-sign.css', 'site-theme.css'],
  'archivo.html': ['footer-sign.css', 'site-theme.css']
};
const errors = [];
const read = name => readFileSync(resolve(root, name), 'utf8');
function checkBraces(name, input) {
  let depth = 0, quote = '', comment = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i], next = input[i + 1];
    if (comment) { if (c === '*' && next === '/') { comment = false; i++; } continue; }
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = ''; continue; }
    if (c === '/' && next === '*') { comment = true; i++; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth < 0) { errors.push(name + ': closing brace without opening brace'); return; } }
  }
  if (depth || quote || comment) errors.push(name + ': unbalanced CSS syntax');
}
for (const [entry, modules] of Object.entries(groups)) {
  const manifest = read(entry);
  const imports = [...manifest.matchAll(/@import\s+url\(["']([^"']+)/g)]
    .map(match => match[1].split('?')[0]);
  if (JSON.stringify(imports) !== JSON.stringify(modules))
    errors.push(entry + ': compatibility manifest import order differs');
  let combined = '';
  for (const name of modules) {
    if (!existsSync(resolve(root, name))) { errors.push(name + ': CSS module missing'); continue; }
    const content = read(name);
    if (!content.trim()) errors.push(name + ': CSS module is empty');
    combined += content;
  }
  checkBraces(entry + ' (assembled)', combined);
}
for (const [page, entries] of Object.entries(pages)) {
  const html = read(page);
  const links = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)]
    .map(match => match[1].split('?')[0]);
  for (const entry of entries) {
    const modules = groups[entry];
    const positions = modules.map(name => links.indexOf(name));
    if (positions.some((x, i) => x < 0 || (i > 0 && x !== positions[i - 1] + 1)))
      errors.push(page + ': CSS component modules missing or out of order: ' + entry);
    if (links.includes(entry)) errors.push(page + ': loads both legacy manifest and component modules: ' + entry);
    for (const name of modules) {
      if (links.filter(link => link === name).length !== 1)
        errors.push(page + ': duplicate or missing stylesheet ' + name);
    }
  }
}
if (read('discos.js').includes('carrizo-basket.svg'))
  errors.push('discos.js: obsolete shopping basket icon has returned');
if (errors.length) {
  for (const error of errors) console.error('FAIL', error);
  process.exitCode = 1;
} else {
  console.log('PASS: 18 CSS components, manifests and 5 public pages are ordered and syntactically balanced.');
}
