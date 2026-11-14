#!/usr/bin/env node
/* i18n catalogue gate (TOOLING §6): every locale file must carry exactly
 * the base locale's key set, and every key's {placeholder} set must match
 * the base locale's — a missing key or a renamed placeholder fails the
 * build instead of shipping a half-translated page. Also asserts the
 * frozen glossary's zh-hans country table covers every dataset country.
 */
import { readFileSync } from 'node:fs';

const settings = JSON.parse(readFileSync('project.inlang/settings.json', 'utf8'));
const base = settings.baseLocale;
const load = (loc) => JSON.parse(readFileSync(`messages/${loc}.json`, 'utf8'));
const strip = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('$')));
const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

const baseMsgs = strip(load(base));
const baseKeys = Object.keys(baseMsgs).sort();
let fail = 0;
for (const loc of settings.locales) {
  if (loc === base) continue;
  const msgs = strip(load(loc));
  const keys = Object.keys(msgs).sort();
  const missing = baseKeys.filter((k) => !(k in msgs));
  const extra = keys.filter((k) => !(k in baseMsgs));
  if (missing.length || extra.length) {
    console.error(`[i18n] ${loc}: missing keys [${missing.join(', ')}] extra keys [${extra.join(', ')}]`);
    fail = 1;
  }
  for (const k of baseKeys) {
    if (k in msgs && ph(msgs[k]) !== ph(baseMsgs[k])) {
      console.error(`[i18n] ${loc}: placeholder mismatch on "${k}": base {${ph(baseMsgs[k])}} vs {${ph(msgs[k])}}`);
      fail = 1;
    }
  }
}
const glossary = JSON.parse(readFileSync('src/i18n/glossary.json', 'utf8'));
const sd = JSON.parse(readFileSync('src/data/site-data.json', 'utf8'));
const zhNames = glossary['zh-hans']?.countries || {};
for (const c of sd.countries) {
  if (!zhNames[c.code]) { console.error(`[i18n] glossary zh-hans missing country ${c.code}`); fail = 1; }
}
if (fail) process.exit(1);
console.log(`i18n check ok: ${baseKeys.length} keys x ${settings.locales.length} locales, glossary countries=${Object.keys(zhNames).length}`);
