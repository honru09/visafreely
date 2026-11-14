#!/usr/bin/env node
/* Build-time availability manifest for visafreely i18n.
 *
 * Emits the map "site path -> locales that have a built version of it":
 *  - src/i18n/availability.json    (imported by Base.astro for hreflang)
 *  - public/i18n-availability.json (fetched by the language switcher)
 *
 * Sources of truth: src/i18n/launched.json (which locales are live),
 * src/i18n/core-paths.json (which surfaces are localized per launched
 * locale) and src/data/site-data.json (hub slugs). Pair pages are
 * English-only until batch 2, so they never appear here; the switcher
 * and the hreflang cluster both read this file and nothing else, which
 * is what guarantees zero 404 targets and no dangling alternates.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const launched = JSON.parse(readFileSync('src/i18n/launched.json', 'utf8'));
const corePaths = JSON.parse(readFileSync('src/i18n/core-paths.json', 'utf8'));
const sd = JSON.parse(readFileSync('src/data/site-data.json', 'utf8'));

const map = {};
const add = (p) => { map[p] = [...launched]; };
for (const p of corePaths) add(p);
for (const c of sd.countries) {
  add(`/passport/${c.slug}/`);
  add(`/destination/${c.slug}/`);
}
const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)));
const json = JSON.stringify(sorted, null, 1) + '\n';
writeFileSync('src/i18n/availability.json', json);
writeFileSync('public/i18n-availability.json', json);
console.log(`availability: ${Object.keys(sorted).length} paths x locales [${launched.join(', ')}]`);
