#!/usr/bin/env node
/* Build-time availability manifest for visafreely i18n.
 *
 * Emits the map "site path -> locales that have a built version of it":
 *  - src/i18n/availability.json    (imported by Base.astro for hreflang)
 *  - public/i18n-availability.json (fetched by the language switcher)
 *
 * Sources of truth: src/i18n/launched.json (which locales are live),
 * src/i18n/core-paths.json (which surfaces are localized per launched
 * locale) and src/data/site-data.json (hub slugs). Pair pages (batch 2,
 * wave A) appear here only for the shared selected route set
 * (src/i18n/pair-routes.json) and only in the locales activated in
 * src/i18n/pair-launched.json — the page shells read the same two files,
 * so manifest and built pages cannot drift apart. The switcher and the
 * hreflang cluster both read this file and nothing else, which is what
 * guarantees zero 404 targets and no dangling alternates.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const launched = JSON.parse(readFileSync('src/i18n/launched.json', 'utf8'));
const corePaths = JSON.parse(readFileSync('src/i18n/core-paths.json', 'utf8'));
const pairRoutes = JSON.parse(readFileSync('src/i18n/pair-routes.json', 'utf8'));
const pairLaunched = JSON.parse(readFileSync('src/i18n/pair-launched.json', 'utf8'));
const sd = JSON.parse(readFileSync('src/data/site-data.json', 'utf8'));

const map = {};
const add = (p) => { map[p] = [...launched]; };
for (const p of corePaths) add(p);
for (const c of sd.countries) {
  add(`/passport/${c.slug}/`);
  add(`/destination/${c.slug}/`);
}
const slugOf = Object.fromEntries(sd.countries.map((c) => [c.code, c.slug]));
const pairLocales = ['en', ...pairLaunched];
for (const k of pairRoutes) {
  const [pc, dc] = k.split(':');
  map[`/visa/${slugOf[pc]}/${slugOf[dc]}/`] = [...pairLocales];
}
const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)));
const json = JSON.stringify(sorted, null, 1) + '\n';
writeFileSync('src/i18n/availability.json', json);
writeFileSync('public/i18n-availability.json', json);
console.log(`availability: ${Object.keys(sorted).length} paths x locales [${launched.join(', ')}]; pair routes=${pairRoutes.length} in [${pairLocales.join(', ')}]`);
