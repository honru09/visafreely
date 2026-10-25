import raw from '../data/site-data.json';
import changelogRaw from '../data/changelog.json';

export interface Country {
  code: string;
  name: string;
  slug: string;
}
export interface PairRow {
  d: string;
  s: string;
  days: number | null;
}
export interface PairExtra {
  verified?: string;
  source?: string;
  source_name?: string;
  valid_until?: string | null;
  note?: string | null;
  overridden?: boolean;
  changed?: string | null;
}

interface SiteData {
  generated: string;
  seed_commit: string;
  vintage: string;
  countries: Country[];
  statusMeta: Record<string, { key: string; label: string }>;
  byPassport: Record<string, PairRow[]>;
  extras: Record<string, PairExtra>;
  pairCount: number;
}

export const data = raw as SiteData;
export const countries: Country[] = data.countries;
export const countryByCode: Record<string, Country> = Object.fromEntries(countries.map((c) => [c.code, c]));
export const countryBySlug: Record<string, Country> = Object.fromEntries(countries.map((c) => [c.slug, c]));

export function pairRow(passport: string, destination: string): PairRow | undefined {
  return (data.byPassport[passport] || []).find((r) => r.d === destination);
}
export function pairExtra(passport: string, destination: string): PairExtra {
  return data.extras[`${passport}:${destination}`] || {};
}
export function statusLabel(code: string): string {
  return data.statusMeta[code]?.label || code;
}
export function statusKey(code: string): string {
  return data.statusMeta[code]?.key || code;
}
/** Human verdict: "Visa free for 30 days", "Visa on arrival", ... */
export function verdictText(row: PairRow): string {
  const label = statusLabel(row.s);
  if (row.s === 'F' && row.days) return `Visa free for ${row.days} days`;
  if (row.s === 'A' && row.days) return `Visa on arrival (up to ${row.days} days)`;
  if (row.s === 'E') return 'e-Visa required before travel';
  if (row.s === 'T') return 'Electronic travel authorisation required';
  return label;
}
/** Rows for one passport, grouped by status code in display order. */
export function groupedForPassport(passport: string): { code: string; rows: PairRow[] }[] {
  const order = ['F', 'A', 'E', 'T', 'R', 'N'];
  const rows = data.byPassport[passport] || [];
  return order
    .map((code) => ({ code, rows: rows.filter((r) => r.s === code) }))
    .filter((g) => g.rows.length > 0);
}
/** Rows for one destination: passports grouped by status code. */
export function groupedForDestination(destination: string): { code: string; passports: { p: string; days: number | null }[] }[] {
  const order = ['F', 'A', 'E', 'T', 'R', 'N'];
  const groups: Record<string, { p: string; days: number | null }[]> = {};
  for (const [p, rows] of Object.entries(data.byPassport)) {
    const row = rows.find((r) => r.d === destination);
    if (row) (groups[row.s] ||= []).push({ p, days: row.days });
  }
  return order
    .filter((code) => groups[code])
    .map((code) => ({
      code,
      passports: groups[code].sort((a, b) => (countryByCode[a.p].name < countryByCode[b.p].name ? -1 : 1)),
    }));
}
/** Count of destinations per status for a passport. */
export function countsForPassport(passport: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of data.byPassport[passport] || []) counts[r.s] = (counts[r.s] || 0) + 1;
  return counts;
}
/** "Easy access" score: visa free + on arrival + e-visa + eta destinations. */
export function easyAccessCount(passport: string): number {
  const c = countsForPassport(passport);
  return (c.F || 0) + (c.A || 0) + (c.E || 0) + (c.T || 0);
}
export function pairPath(passport: Country, destination: Country): string {
  return `/visa/${passport.slug}/${destination.slug}/`;
}
/** Flag emoji for an ISO 2-letter country code (same construction as the checker dropdown). */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code || '')) return '';
  try {
    return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)));
  } catch {
    return '';
  }
}
export const STATUS_MEANING: Record<string, (p: string, d: string) => string> = {
  F: (p, d) =>
    `Holders of a ${p} passport can enter ${d} without a visa for short stays. You do not need to apply for anything before departure for the visa itself — border officials stamp you in on arrival. Some destinations still ask for a separate arrival form or travel registration; where an official one exists it is free through the government channel.`,
  A: (p, d) =>
    `Holders of a ${p} passport can obtain their visa on arrival in ${d}. You apply at the border or airport visa desk, so bring a passport photo, the fee in the accepted currency, and proof of onward travel and accommodation — requirements vary by entry point.`,
  E: (p, d) =>
    `${d} requires holders of a ${p} passport to apply for an electronic visa (e-Visa) online before travelling. Apply only through the official government e-Visa portal, allow several working days for processing, and carry the approval when you travel.`,
  T: (p, d) =>
    `${d} requires holders of a ${p} passport to obtain an electronic travel authorisation before travelling. This is not a visa, but airlines will not board you without it. Apply through the official government channel a few days before departure.`,
  R: (p, d) =>
    `Holders of a ${p} passport must obtain a visa for ${d} before travelling. Apply through the ${d} embassy or consulate (or its official visa application centre) in your country of residence, and do not book non-refundable travel until the visa is issued.`,
  N: (p, d) =>
    `${d} currently does not admit holders of a ${p} passport for ordinary travel. Entry is restricted regardless of purpose in most cases; contact the nearest ${d} diplomatic mission if you believe an exception applies to you.`,
};

/** "What to do next" — 3 steps per status. Presentation copy only; restates the
 *  status meaning + generic travel truths, never pair-specific facts. */
export const STATUS_STEPS: Record<string, (p: string, d: string) => { t: string; b: string }[]> = {
  F: (p, d) => [
    { t: 'Check your passport', b: 'Make sure it stays valid for at least six months beyond your travel dates, with a blank page for the entry stamp.' },
    { t: 'Check for an arrival form', b: `Some destinations ask visa-free visitors to file an official arrival form or digital arrival card. Where one applies in ${d}, it is free on the government's own site — never pay a third party for the form itself.` },
    { t: 'Travel — nothing to apply for', b: `There is no visa application for this route. Keep proof of onward travel and your accommodation details handy for the border officer.` },
  ],
  A: (p, d) => [
    { t: 'Prepare before you fly', b: 'Check your passport validity, and carry a passport photo plus the visa fee in the currency the border desk accepts.' },
    { t: 'Get the visa at the border', b: `The visa for ${d} is issued on arrival at the airport or border visa desk — no application before travel.` },
    { t: 'Keep your documents ready', b: 'Border officers can ask for proof of onward travel, accommodation and sufficient funds for the stay.' },
  ],
  E: (p, d) => [
    { t: 'Apply online before you travel', b: `Apply through ${d}'s official government e-Visa portal only — third-party sites add fees without adding anything.` },
    { t: 'Wait for the approval', b: 'Allow several working days for processing. Do not book non-refundable travel until the e-Visa is granted.' },
    { t: 'Carry the approval', b: 'Travel with the approval on your phone and as a printout, on the same passport you applied with.' },
  ],
  T: (p, d) => [
    { t: 'Apply a few days before departure', b: `The authorisation for ${d} is applied for online through the official government channel. It is not a visa, but it is mandatory.` },
    { t: 'Wait for approval before check-in', b: 'Airlines will not board you without an approved authorisation, so do not leave it to the airport.' },
    { t: 'Travel on the same passport', b: 'The authorisation is linked to your passport — if you renew it, you need a new authorisation.' },
  ],
  R: (p, d) => [
    { t: 'Apply at the embassy or visa centre', b: `Holders of a ${p} passport apply through the ${d} embassy or consulate, or its official visa application centre, in their country of residence.` },
    { t: 'Wait for the visa before booking', b: 'Do not book non-refundable travel until the visa is issued and in your passport.' },
    { t: 'Check the visa window', b: 'Before you fly, check the validity dates and the number of entries the issued visa allows.' },
  ],
  N: (p, d) => [
    { t: 'Do not travel on this route', b: `${d} is not currently admitting holders of a ${p} passport for ordinary travel.` },
    { t: 'If you believe an exception applies', b: `Contact the nearest ${d} diplomatic mission directly — exceptions are decided case by case, not at the border.` },
    { t: 'Re-check before making plans', b: 'Rules on this page carry a verification status below — confirm the current position before relying on any change.' },
  ],
};

/** "Before you go" checklist items per status. Generic, hedged items only. */
export const STATUS_CHECKLIST: Record<string, string[]> = {
  F: [
    'Passport usually needs 6+ months of validity beyond your travel dates',
    'A blank passport page for the entry stamp',
    'Proof of onward or return travel — border officers can ask',
    'Accommodation details and evidence of sufficient funds',
    'Check whether an official arrival form applies — it is free via the government channel',
  ],
  A: [
    'Passport usually needs 6+ months of validity beyond your travel dates',
    'A recent passport photo for the border visa desk',
    'The visa fee in the currency accepted at the border',
    'Proof of onward or return travel',
    'Accommodation details and evidence of sufficient funds',
  ],
  E: [
    'Passport usually needs 6+ months of validity beyond your travel dates',
    'An approved e-Visa — apply on the official portal several working days ahead',
    'A printout of the approval, plus a copy on your phone',
    'Proof of onward or return travel',
    'Accommodation details and evidence of sufficient funds',
  ],
  T: [
    'Passport usually needs 6+ months of validity beyond your travel dates',
    'An approved electronic travel authorisation — airlines check before boarding',
    'The same passport you used for the authorisation application',
    'Proof of onward or return travel',
    'Accommodation details and evidence of sufficient funds',
  ],
  R: [
    'A visa issued before travel — allow weeks, not days, for processing',
    'Passport usually needs 6+ months of validity beyond your travel dates',
    'Supporting documents the embassy asks for (itinerary, funds, accommodation)',
    'Proof of onward or return travel',
    'Do not book non-refundable travel before the visa is granted',
  ],
  N: [
    'Entry is not currently permitted for ordinary travel on this passport',
    'Contact the destination\u2019s diplomatic mission if you believe an exception applies',
    'Do not rely on third-party sites claiming a workaround',
    'Re-check the official position before making any plans',
  ],
};


// ---------- Presentation helpers (redesign) ----------

/** Number of pairs carrying a completed official-source verification. */
export const verifiedCount: number = Object.values(data.extras).filter((e) => e.verified).length;
/** Number of published changelog entries (computed, never hardcoded). */
export const changelogCount: number = (changelogRaw as unknown[]).length;

export const STATUS_ORDER = ['F', 'A', 'E', 'T', 'R', 'N'];

/** One-word glyph per status, rendered inside a circle next to pills. */
export const STATUS_GLYPH: Record<string, string> = {
  F: '✓',
  A: '↓',
  E: '@',
  T: '⚡',
  R: '!',
  N: '✕',
};

/** One-line meaning per status (status legend, home). */
export const STATUS_BLURB: Record<string, string> = {
  F: 'No visa needed for short stays.',
  A: 'The visa is issued at the border when you arrive.',
  E: 'Apply online for a visa before you travel.',
  T: 'An online authorisation — not a visa, but mandatory.',
  R: 'Apply for a visa at an embassy before you travel.',
  N: 'Entry is not currently permitted.',
};

/** Passports ranked by easy-access count, computed once for the whole build. */
export const passportsByEasy: { c: Country; easy: number; free: number }[] = countries
  .map((c) => ({ c, easy: easyAccessCount(c.code), free: countsForPassport(c.code).F || 0 }))
  .sort((a, b) => b.easy - a.easy);
export const passportRank: Record<string, number> = Object.fromEntries(
  passportsByEasy.map((r, i) => [r.c.code, i + 1]),
);

/** Number of passports that enter a destination visa free, computed in one pass. */
const freeByDestination: Record<string, number> = {};
for (const rows of Object.values(data.byPassport)) {
  for (const r of rows) if (r.s === 'F') freeByDestination[r.d] = (freeByDestination[r.d] || 0) + 1;
}
export function visaFreePassportCount(destination: string): number {
  return freeByDestination[destination] || 0;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-12-31" → "31 Dec 2026"; anything else passes through unchanged. */
export function formatDateLong(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

/** Spec-grid "Apply before travel?" cell copy per status. */
export function applyBeforeText(code: string): string {
  switch (code) {
    case 'F': return 'No visa application needed';
    case 'A': return 'No — the visa is issued on arrival';
    case 'E': return 'Yes — online e-Visa application';
    case 'T': return 'Yes — online authorisation, usually approved quickly';
    case 'R': return 'Yes — embassy or consulate visa required in advance';
    case 'N': return 'Entry is not currently permitted';
    default: return '';
  }
}
/** Spec-grid / fact-tile "Maximum stay" copy. */
export function maxStayText(row: PairRow): string {
  if (row.days) return `${row.days} days`;
  if (row.s === 'F' || row.s === 'A') return 'Not specified in the dataset — confirm with the official source';
  return 'Set by the visa issued';
}
/** Verdict-hero "Entry basis" fact tile per status. */
export function entryBasisText(code: string): string {
  switch (code) {
    case 'F': return 'Visa exemption';
    case 'A': return 'Visa issued on arrival';
    case 'E': return 'e-Visa approval';
    case 'T': return 'Travel authorisation (not a visa)';
    case 'R': return 'Embassy / consulate visa';
    case 'N': return 'No admission';
    default: return '';
  }
}

/** Status hex colours — mirrors the --f/--a/--e/--t/--r/--n tokens in Base.astro
 *  (presentation only; used for seal ink props and inline styles). */
export const STATUS_COLOR: Record<string, string> = {
  F: '#0b6e4f', A: '#0e7490', E: '#b45309', T: '#6d28d9', R: '#b3261e', N: '#57534e',
};

/** Map "PC:DC" → verified ISO date, for the homepage checker's stamp moment. */
export const verifiedPairDates: Record<string, string> = Object.fromEntries(
  Object.entries(data.extras)
    .filter(([, e]) => e.verified)
    .map(([k, e]) => [k, e.verified as string]),
);

/** The 3 generated FAQ entries for a pair. The pair template renders this array
 *  both as the visible FAQ and as FAQPage JSON-LD, so the two stay identical. */
export function pairFaq(
  p: string,
  d: string,
  row: PairRow,
  extra: PairExtra,
): { q: string; a: string }[] {
  const verdict = verdictText(row);
  let a1 = verdict;
  if (row.s === 'F') a1 = `${verdict}. Holders of a ${p} passport can enter ${d} without a visa for short stays.`;
  else if (row.s === 'A') a1 = `${verdict}. The visa is issued on arrival in ${d}; no advance application is needed.`;
  else if (row.s === 'E') a1 = `Yes. ${verdict} — apply through ${d}'s official e-Visa portal before travelling.`;
  else if (row.s === 'T') a1 = `You need an authorisation, not a visa. ${verdict} before travelling; airlines will not board you without it.`;
  else if (row.s === 'R') a1 = `Yes. ${verdict} — apply through the ${d} embassy or consulate before travelling.`;
  else if (row.s === 'N') a1 = `Entry is not currently permitted. ${d} does not admit holders of a ${p} passport for ordinary travel.`;
  const a2 = row.days
    ? `Up to ${row.days} days under the current rule.`
    : row.s === 'F' || row.s === 'A'
      ? 'The dataset does not specify a maximum stay for this pair — confirm the permitted stay with the official source before travelling.'
      : 'The permitted stay is set by the visa issued.';
  const a3 = extra.verified
    ? `Yes — last verified on ${extra.verified} against an official source: ${extra.source_name}.`
    : `Not yet. This pair is from the passport-index dataset (${data.vintage} snapshot) and has not yet been individually verified against an official source.`;
  return [
    { q: `Do ${p} citizens need a visa for ${d}?`, a: a1 },
    { q: `How long can ${p} citizens stay in ${d}?`, a: a2 },
    { q: 'Has this requirement been verified?', a: a3 },
  ];
}
