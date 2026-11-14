#!/usr/bin/env node
/* Wave-A pair route selection (i18n batch 2). Deterministic; rerunnable.
 *
 * One shared route set for all five locales (hreflang clusters stay whole).
 * No per-page GSC data exists in the workspace (DATA.md §7), so selection is
 * the documented composite (see BUILD/WAVEA-PROGRESS.md):
 *   S1  audience passports of the five locales x all destinations
 *   S2  top-14 destinations by heat x all passports
 *       heat = easyAccessCount(destination) + 3 * site by_destination views
 *   S3  fill to 4,600 by score = easyAccess(p) + easyAccess(d),
 *       ties broken by status E>R>T>A>F>N, then code order.
 * Output: src/i18n/pair-routes.json — sorted ["PC:DC", ...].
 */
import { readFileSync, writeFileSync } from 'node:fs';

const sd = JSON.parse(readFileSync('src/data/site-data.json', 'utf8'));
const countries = sd.countries;
const byP = sd.byPassport;

const easy = {};
for (const c of countries) {
  easy[c.code] = (byP[c.code] || []).filter((r) => ['F', 'A', 'T'].includes(r.s)).length;
}
// Site-stats by_destination pageviews, DATA.md (head values; rest are 0).
const VIEWS = { JP: 41, US: 29, FR: 21, AE: 19, BA: 18, AT: 17, BN: 17, BB: 15, AR: 15, TH: 14, AU: 14, KR: 11 };
const heat = (c) => easy[c] + 3 * (VIEWS[c] || 0);
const topDestinations = Object.keys(easy)
  .sort((a, b) => heat(b) - heat(a) || a.localeCompare(b))
  .slice(0, 14);

const AUDIENCE = ['CN', 'SG', 'MY', 'TW', 'HK', 'MO', 'JP', 'KR', 'TH'];
const sel = new Set();
for (const p of AUDIENCE) for (const r of byP[p] || []) sel.add(`${p}:${r.d}`);
const afterS1 = sel.size;
for (const c of countries) {
  for (const d of topDestinations) if (c.code !== d) sel.add(`${c.code}:${d}`);
}
const afterS2 = sel.size;

const PRIO = { E: 0, R: 1, T: 2, A: 3, F: 4, N: 5 };
const rest = [];
for (const c of countries) {
  for (const r of byP[c.code] || []) {
    const k = `${c.code}:${r.d}`;
    if (!sel.has(k)) rest.push({ k, score: easy[c.code] + easy[r.d], s: r.s });
  }
}
rest.sort((a, b) => b.score - a.score || PRIO[a.s] - PRIO[b.s] || (a.k < b.k ? -1 : 1));
for (const r of rest) {
  if (sel.size >= 4600) break;
  sel.add(r.k);
}

const out = [...sel].sort();
writeFileSync('src/i18n/pair-routes.json', JSON.stringify(out, null, 1) + '\n');
const dist = {};
for (const k of out) {
  const [p, d] = k.split(':');
  const row = (byP[p] || []).find((r) => r.d === d);
  dist[row.s] = (dist[row.s] || 0) + 1;
}
console.log(`pair-routes: total=${out.length} afterS1=${afterS1} afterS2=${afterS2} status=${JSON.stringify(dist)}`);
console.log(`top destinations: ${topDestinations.join(' ')}`);
