// Head-route sets for internal-link layering (indexation batch,
// 2026-11-14). Definitions follow the wave-A selection (see
// i18n-plan BUILD/WAVEA-PROGRESS.md): S1 = the nine audience passports
// x all destinations; S2 = the 14 hot destinations x all passports;
// the launched head set is pair-routes.json (4,600 routes).
import { countryByCode, pairRow, easyAccessCount, type Country, type PairRow } from './data';
import pairRoutesRaw from '../i18n/pair-routes.json';

export const AUDIENCE9 = ['CN', 'JP', 'KR', 'TH', 'SG', 'MY', 'TW', 'HK', 'MO'];
export const HOT14 = ['JP', 'US', 'AE', 'FR', 'AT', 'AU', 'KR', 'AR', 'BN', 'BB', 'BA', 'SG', 'ES', 'BE'];
export const HEAD_SET = new Set<string>(pairRoutesRaw as string[]);

export interface HeadRoute {
  p: Country;
  d: Country;
  row: PairRow;
  score: number;
}

const STATUS_TIE = ['E', 'R', 'T', 'A', 'F', 'N']; // S3 tiebreak order

export function headRoute(pc: string, dc: string): HeadRoute | null {
  if (pc === dc || !HEAD_SET.has(`${pc}:${dc}`)) return null;
  const row = pairRow(pc, dc);
  const p = countryByCode[pc];
  const d = countryByCode[dc];
  if (!row || !p || !d) return null;
  return { p, d, row, score: easyAccessCount(pc) + easyAccessCount(dc) };
}

function byScore(a: HeadRoute, b: HeadRoute): number {
  if (b.score !== a.score) return b.score - a.score;
  const t = STATUS_TIE.indexOf(a.row.s) - STATUS_TIE.indexOf(b.row.s);
  if (t !== 0) return t;
  return `${a.p.code}:${a.d.code}`.localeCompare(`${b.p.code}:${b.d.code}`);
}

/** Audience passport -> its hot-destination head routes (the S1 x S2 grid). */
export const gridByPassport: { p: Country; routes: HeadRoute[] }[] = AUDIENCE9.map((pc) => ({
  p: countryByCode[pc],
  routes: HOT14.map((dc) => headRoute(pc, dc)).filter((r): r is HeadRoute => !!r),
})).filter((g) => g.p && g.routes.length);

/** All grid routes, best first (for the home band). */
export const gridRanked: HeadRoute[] = gridByPassport
  .flatMap((g) => g.routes)
  .sort(byScore);

/** Top head routes by the S3 score, excluding keys already listed. */
export function topHeadRoutes(n: number, exclude: Set<string>): HeadRoute[] {
  const all: HeadRoute[] = [];
  for (const key of HEAD_SET) {
    if (exclude.has(key)) continue;
    const [pc, dc] = key.split(':');
    const r = headRoute(pc, dc);
    if (r) all.push(r);
  }
  return all.sort(byScore).slice(0, n);
}

/** Hot-destination pair chips for one passport (ranking rows). */
export function hotChipsFor(pc: string): HeadRoute[] {
  return HOT14.map((dc) => headRoute(pc, dc)).filter((r): r is HeadRoute => !!r);
}
