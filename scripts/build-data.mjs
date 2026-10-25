// Build the site data layer from the pinned seed + overrides + verified records.
// Inputs (data/):  seed-source.json  — raw passport-index.json from imorte/passport-index-data
//                   overrides.json    — { "JP:TH": {status, days, reason, source, date, valid_until?} }
//                   verified.json     — { "JP:CN": {date, source, source_name, valid_until?, note?} }
//                   changelog-extra.json — manual changelog entries [{date, title, body, source?}]
// Outputs: src/data/site-data.json, src/data/changelog.json, public/check.json
//
// Date semantics (two separate clocks, never conflated):
//   lastVerified ("verified" in extras) — bumped on every completed official-source check of a pair.
//   lastChanged  ("changed" in extras)  — set only when an override actually changes the displayed
//                                         value; equals the override's date. Pairs never overridden
//                                         carry the seed vintage as their implicit lastChanged.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const seed = read('data/seed-source.json');
const overrides = read('data/overrides.json');
const verified = read('data/verified.json');
const changelogExtra = read('data/changelog-extra.json');

const SEED_COMMIT = '9c59780dd0dbaefcbdfa0134d21cd99d0d547509';
const VINTAGE_LABEL = 'February 2026';

// ---------- countries ----------
const codes = new Set();
for (const [p, row] of Object.entries(seed)) {
  codes.add(p);
  for (const d of Object.keys(row)) codes.add(d);
}
const dn = new Intl.DisplayNames(['en'], { type: 'region' });
const NAME_FIX = { XK: 'Kosovo', AN: 'Netherlands Antilles' };
function countryName(code) {
  if (NAME_FIX[code]) return NAME_FIX[code];
  try {
    return dn.of(code) || code;
  } catch {
    return code;
  }
}
function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
const countries = [...codes].sort().map((code) => {
  const name = countryName(code);
  return { code, name, slug: slugify(name) };
});
const slugSeen = new Map();
for (const c of countries) {
  if (slugSeen.has(c.slug)) throw new Error(`slug collision: ${c.slug} (${slugSeen.get(c.slug)} vs ${c.code})`);
  slugSeen.set(c.slug, c.code);
}
const byCode = Object.fromEntries(countries.map((c) => [c.code, c]));

// ---------- status vocabulary ----------
const STATUS = {
  'visa free': { code: 'F', label: 'Visa free' },
  'visa on arrival': { code: 'A', label: 'Visa on arrival' },
  'e-visa': { code: 'E', label: 'e-Visa' },
  eta: { code: 'T', label: 'Electronic travel authorisation (ETA)' },
  'visa required': { code: 'R', label: 'Visa required' },
  'no admission': { code: 'N', label: 'No admission' },
};

// ---------- merge layers ----------
const pairs = {}; // "P:D" -> {s: statusString, days: int|null}
for (const [p, row] of Object.entries(seed)) {
  for (const [d, cell] of Object.entries(row)) {
    pairs[`${p}:${d}`] = { s: cell.status, days: cell.days ?? null };
  }
}
const extras = {}; // "P:D" -> {verified?, source?, source_name?, valid_until?, note?, overridden?}
const changelog = [];
for (const [key, o] of Object.entries(overrides)) {
  const before = pairs[key];
  if (!before) throw new Error(`override for unknown pair ${key}`);
  changelog.push({
    date: o.date,
    pair: key,
    title: `${byCode[key.split(':')[0]].name} → ${byCode[key.split(':')[1]].name}`,
    old: before.days ? `${before.s} (${before.days} days)` : before.s,
    new: o.days ? `${o.status} (${o.days} days)` : o.status,
    reason: o.reason,
    source: o.source || null,
  });
  pairs[key] = { s: o.status, days: o.days ?? null };
  extras[key] = {
    ...(extras[key] || {}),
    overridden: true,
    changed: o.date || null,
    note: o.reason || null,
    valid_until: o.valid_until || (extras[key] || {}).valid_until || null,
  };
}
for (const [key, v] of Object.entries(verified)) {
  if (!pairs[key]) throw new Error(`verified record for unknown pair ${key}`);
  extras[key] = {
    ...(extras[key] || {}),
    verified: v.date,
    source: v.source,
    source_name: v.source_name,
    valid_until: v.valid_until || (extras[key] || {}).valid_until || null,
    note: v.note || (extras[key] || {}).note || null,
  };
}
for (const e of changelogExtra) changelog.push(e);
changelog.sort((a, b) => (a.date < b.date ? 1 : -1));

// ---------- outputs ----------
const byPassport = {};
for (const [key, cell] of Object.entries(pairs)) {
  const [p, d] = key.split(':');
  (byPassport[p] ||= []).push({ d, s: STATUS[cell.s].code, days: cell.days });
}
for (const row of Object.values(byPassport)) row.sort((a, b) => (a.d < b.d ? -1 : 1));

const siteData = {
  generated: new Date().toISOString().slice(0, 10),
  seed_commit: SEED_COMMIT,
  vintage: VINTAGE_LABEL,
  countries,
  statusMeta: Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [v.code, { key: k, label: v.label }])),
  byPassport,
  extras,
  pairCount: Object.keys(pairs).length,
};
writeFileSync(join(root, 'src/data/site-data.json'), JSON.stringify(siteData));
writeFileSync(join(root, 'src/data/changelog.json'), JSON.stringify(changelog, null, 1));

// checker index: index-based rows
const destList = countries; // same list used for both axes
const idx = Object.fromEntries(countries.map((c, i) => [c.code, i]));
const checkRows = {};
for (const [p, row] of Object.entries(byPassport)) {
  checkRows[p] = row.map((r) => [idx[r.d], r.s, r.days]);
}
writeFileSync(
  join(root, 'public/check.json'),
  JSON.stringify({
    countries: countries.map((c) => ({ code: c.code, name: c.name, slug: c.slug })),
    status: Object.fromEntries(Object.entries(STATUS).map(([, v]) => [v.code, v.label])),
    rows: checkRows,
  })
);

const verifiedCount = Object.values(extras).filter((e) => e.verified).length;
console.log(
  `countries=${countries.length} pairs=${siteData.pairCount} overrides=${Object.keys(overrides).length} verified=${verifiedCount} changelog=${changelog.length}`
);
