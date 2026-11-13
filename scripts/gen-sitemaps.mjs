#!/usr/bin/env node
/* Segmented sitemaps for visafreely (replaces @astrojs/sitemap output).
 *
 * Emits into dist/:
 *  - sitemap-index.xml   (references the files below; same name GSC already has)
 *  - sitemap-core.xml    (home, hubs and site pages — the link-graph roots)
 *  - sitemap-pairs-N.xml (pair pages in 10k chunks, <lastmod> = the pair's
 *                         verified date where one exists)
 * The plugin's sitemap-0.xml is removed so only the segmented set is served.
 *
 * Data sources mirror the page routes: src/data/site-data.json (slugs),
 * data/verified.json (per-pair verification dates).
 */
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';

const SITE = 'https://visafreely.com';
const sd = JSON.parse(readFileSync('src/data/site-data.json', 'utf8'));
const ver = JSON.parse(readFileSync('data/verified.json', 'utf8'));
const countries = sd.countries; // [{code, name, slug}]
const slugOf = Object.fromEntries(countries.map((c) => [c.code, c.slug]));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const urlEntry = (loc, lastmod) =>
  `  <url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
const urlset = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

// Core: site pages + passport/destination hubs.
const corePaths = ['/', '/visa/', '/passports/', '/destinations/', '/passport-ranking/', '/map/', '/compare/',
  '/visa-policy-changes/', '/about/', '/changelog/', '/widget/'];
const core = corePaths.map((p) => urlEntry(SITE + p));
for (const c of countries) {
  core.push(urlEntry(`${SITE}/passport/${c.slug}/`));
  core.push(urlEntry(`${SITE}/destination/${c.slug}/`));
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
    buf.push(urlEntry(`${SITE}/visa/${p.slug}/${d.slug}/`, v ? v.date : null));
    n += 1;
    if (buf.length >= CHUNK) flush();
  }
}
flush();

// Index (same filename GSC/Bing already track).
const today = new Date().toISOString().slice(0, 10);
const indexEntries = ['sitemap-core.xml', ...pairFiles]
  .map((f) => `  <sitemap><loc>${SITE}/${f}</loc><lastmod>${today}</lastmod></sitemap>`);
writeFileSync('dist/sitemap-index.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries.join('\n')}\n</sitemapindex>\n`);

// Drop the plugin's monolith so it cannot compete.
if (existsSync('dist/sitemap-0.xml')) rmSync('dist/sitemap-0.xml');

console.log(`sitemaps: core=${core.length} pairs=${n} files=${pairFiles.length + 1}+index`);
