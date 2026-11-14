#!/usr/bin/env node
/* Segmented sitemaps for visafreely (replaces @astrojs/sitemap output).
 *
 * Emits into dist/:
 *  - sitemap-index.xml   (references the files below; same name GSC already has)
 *  - sitemap-core.xml    (home, hubs and site pages — the link-graph roots)
 *  - sitemap-pairs-N.xml (pair pages in 10k chunks)
 *
 * lastmod discipline (SEO L1, 2026-11-14): a <lastmod> is written ONLY
 * when it comes from the data layer — never the build date.
 *  - pair page:        the pair's own verified date (data/verified.json)
 *  - passport hub:     newest verified date among that passport's pairs
 *  - destination hub:  newest verified date among pairs into it
 *  - /passport-ranking/: newest verified date overall (pure data function)
 *  - /visa-policy-changes/: newest policy-tracker entry date
 *  - /changelog/:      newest changelog entry date
 *  - everything else:  no lastmod (no honest date exists)
 * Index entries carry the max lastmod of their shard's dated entries,
 * or no lastmod when the shard has none.
 */
import { readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';

const SITE = 'https://visafreely.com';
const sd = JSON.parse(readFileSync('src/data/site-data.json', 'utf8'));
const ver = JSON.parse(readFileSync('data/verified.json', 'utf8'));
const policy = JSON.parse(readFileSync('src/data/policy-changes.json', 'utf8'));
const changelog = JSON.parse(readFileSync('src/data/changelog.json', 'utf8'));
const countries = sd.countries; // [{code, name, slug}]
const slugOf = Object.fromEntries(countries.map((c) => [c.code, c.slug]));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const maxDate = (a, b) => (a && b ? (a > b ? a : b) : a || b || null);
const urlEntry = (loc, lastmod) =>
  `  <url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
const urlset = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

// ---- real dates from the data layer ----
let globalMax = null;
const maxByPassport = {};
const maxByDestination = {};
for (const [key, v] of Object.entries(ver)) {
  if (!v || !v.date) continue;
  const [pc, dc] = key.split(':');
  globalMax = maxDate(globalMax, v.date);
  maxByPassport[pc] = maxDate(maxByPassport[pc], v.date);
  maxByDestination[dc] = maxDate(maxByDestination[dc], v.date);
}
const policyLatest = (Array.isArray(policy) ? policy : policy.entries)
  .reduce((m, e) => maxDate(m, e.date), null);
const changelogLatest = (Array.isArray(changelog) ? changelog : changelog.entries)
  .reduce((m, e) => maxDate(m, e.date), null);

function coreDateFor(path) {
  if (path === '/passport-ranking/') return globalMax;
  if (path === '/visa-policy-changes/') return policyLatest;
  if (path === '/changelog/') return changelogLatest;
  let m = path.match(/^\/passport\/([^/]+)\/$/);
  if (m) {
    const c = countries.find((x) => x.slug === m[1]);
    return c ? maxByPassport[c.code] || null : null;
  }
  m = path.match(/^\/destination\/([^/]+)\/$/);
  if (m) {
    const c = countries.find((x) => x.slug === m[1]);
    return c ? maxByDestination[c.code] || null : null;
  }
  return null;
}

// shard name -> max lastmod inside it (for the index)
const shardMax = {};
const noteShard = (name, date) => { shardMax[name] = maxDate(shardMax[name], date); };

// Core: site pages + passport/destination hubs.
const corePaths = ['/', '/visa/', '/passports/', '/destinations/', '/passport-ranking/', '/map/', '/compare/',
  '/visa-policy-changes/', '/about/', '/changelog/', '/widget/', '/for-business/', '/privacy/'];
const core = [];
for (const p of corePaths) {
  const dte = coreDateFor(p);
  core.push(urlEntry(SITE + p, dte));
  noteShard('sitemap-core.xml', dte);
}
for (const c of countries) {
  const pd = maxByPassport[c.code] || null;
  core.push(urlEntry(`${SITE}/passport/${c.slug}/`, pd));
  noteShard('sitemap-core.xml', pd);
  const dd = maxByDestination[c.code] || null;
  core.push(urlEntry(`${SITE}/destination/${c.slug}/`, dd));
  noteShard('sitemap-core.xml', dd);
}
// Residency vertical (batch 3, 2026-11-15): hub + country + route pages
// join the core shard. Paths are enumerated from the built output so the
// sitemap can never drift from what actually shipped; the lastmod is the
// residency dataset's own verified date (data layer, per L1 discipline).
const resData = JSON.parse(readFileSync('src/data/residency-routes.json', 'utf8'));
const resDate = (resData && resData.meta && resData.meta.verified_date) || null;
const resPaths = [];
if (existsSync('dist/residency')) {
  const walk = (dir, prefix) => {
    if (existsSync(`${dir}/index.html`)) resPaths.push(prefix);
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(`${dir}/${e.name}`, `${prefix}${e.name}/`);
    }
  };
  walk('dist/residency', '/residency/');
}
resPaths.sort();
for (const p of resPaths) {
  core.push(urlEntry(SITE + p, resDate));
  noteShard('sitemap-core.xml', resDate);
}
writeFileSync('dist/sitemap-core.xml', urlset(core));

// Pairs in chunks of 10,000.
const CHUNK = 10000;
const pairFiles = [];
let buf = [];
let n = 0;
const flush = () => {
  if (!buf.length) return;
  const name = `sitemap-pairs-${pairFiles.length}.xml`;
  writeFileSync(`dist/${name}`, urlset(buf));
  pairFiles.push(name);
  buf = [];
};
for (const p of countries) {
  for (const d of countries) {
    if (p.code === d.code) continue;
    const v = ver[`${p.code}:${d.code}`];
    const dte = v ? v.date : null;
    buf.push(urlEntry(`${SITE}/visa/${p.slug}/${d.slug}/`, dte));
    noteShard(`sitemap-pairs-${pairFiles.length}.xml`, dte);
    n += 1;
    if (buf.length >= CHUNK) flush();
  }
}
flush();

// Localized sitemaps (i18n batch 0; pair shards added in batch 2 wave A):
// one core file per launched non-default locale holding the non-pair paths
// the availability manifest lists for it, plus pair shards
// (sitemap-pairs-<loc>-N.xml, 10k chunks). Same lastmod rules as English.
const launched = JSON.parse(readFileSync('src/i18n/launched.json', 'utf8'));
const availability = JSON.parse(readFileSync('src/i18n/availability.json', 'utf8'));
const codeOfSlug = Object.fromEntries(countries.map((c) => [c.slug, c.code]));
const localeFiles = [];
for (const loc of launched) {
  if (loc === 'en') continue;
  const paths = Object.entries(availability)
    .filter(([, locs]) => locs.includes(loc))
    .map(([p]) => p)
    .sort();
  const isPair = (p) => {
    const s = p.split('/').filter(Boolean);
    return s.length === 3 && s[0] === 'visa';
  };
  const coreName = `sitemap-${loc}-core.xml`;
  const coreEntries = paths.filter((p) => !isPair(p))
    .map((p) => {
      const dte = coreDateFor(p);
      noteShard(coreName, dte);
      return urlEntry(`${SITE}/${loc}${p}`, dte);
    });
  writeFileSync(`dist/${coreName}`, urlset(coreEntries));
  localeFiles.push(coreName);
  console.log(`sitemaps: ${coreName} urls=${coreEntries.length}`);
  const pairPaths = paths.filter(isPair);
  let pbuf = [];
  let pidx = 0;
  const pflush = () => {
    if (!pbuf.length) return;
    const name = `sitemap-pairs-${loc}-${pidx}.xml`;
    pidx += 1;
    writeFileSync(`dist/${name}`, urlset(pbuf));
    localeFiles.push(name);
    console.log(`sitemaps: ${name} urls=${pbuf.length}`);
    pbuf = [];
  };
  for (const p of pairPaths) {
    const seg = p.split('/').filter(Boolean); // ['visa', pslug, dslug]
    const v = ver[`${codeOfSlug[seg[1]]}:${codeOfSlug[seg[2]]}`];
    const dte = v ? v.date : null;
    pbuf.push(urlEntry(`${SITE}/${loc}${p}`, dte));
    noteShard(`sitemap-pairs-${loc}-${pidx}.xml`, dte);
    if (pbuf.length >= CHUNK) pflush();
  }
  pflush();
}

// Index (same filename GSC/Bing already track). Per-shard lastmod = the
// newest real content date inside the shard — never the build date.
const indexEntries = ['sitemap-core.xml', ...localeFiles, ...pairFiles]
  .map((f) => `  <sitemap><loc>${SITE}/${f}</loc>${shardMax[f] ? `<lastmod>${shardMax[f]}</lastmod>` : ''}</sitemap>`);
writeFileSync('dist/sitemap-index.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries.join('\n')}\n</sitemapindex>\n`);

// Drop the plugin's monolith so it cannot compete.
if (existsSync('dist/sitemap-0.xml')) rmSync('dist/sitemap-0.xml');

console.log(`sitemaps: core=${core.length} pairs=${n} files=${pairFiles.length + 1}+index globalMax=${globalMax} policyLatest=${policyLatest} changelogLatest=${changelogLatest}`);
