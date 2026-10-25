import raw from '../data/site-data.json';

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
