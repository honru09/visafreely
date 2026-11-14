// Localized pair-page prose generators (wave A). English delegates to the
// original lib/data generators, so the English pair pages render exactly
// what they rendered before the views were localized; other locales render
// the frozen message templates (pair_* keys) with localized country names.
// Facts (status, days, dates, vintage) always come from the data layer.
import {
  STATUS_MEANING,
  STATUS_STEPS,
  STATUS_CHECKLIST,
  applyBeforeText,
  entryBasisText,
  maxStayText,
  pairFaq,
  type PairExtra,
  type PairRow,
} from '../lib/data';
import { t as i18nT, verdictTextL, formatDateL, type LocaleCode } from './locales';

const low = (s: string) => s.toLowerCase();

export function meaningL(locale: LocaleCode, s: string, p: string, d: string): string {
  if (locale === 'en') return STATUS_MEANING[s](p, d);
  return i18nT(locale)(`pair_meaning_${low(s)}`, { p, d });
}

export function stepsL(
  locale: LocaleCode,
  s: string,
  p: string,
  d: string,
): { t: string; b: string }[] {
  if (locale === 'en') return STATUS_STEPS[s](p, d);
  const T = i18nT(locale);
  return [1, 2, 3].map((n) => ({
    t: T(`pair_step_${low(s)}_${n}_t`, { p, d }),
    b: T(`pair_step_${low(s)}_${n}_b`, { p, d }),
  }));
}

export function checklistL(locale: LocaleCode, s: string): string[] {
  if (locale === 'en') return STATUS_CHECKLIST[s];
  const T = i18nT(locale);
  const n = s === 'N' ? 4 : 5;
  return Array.from({ length: n }, (_, i) => T(`pair_ck_${low(s)}_${i + 1}`));
}

export function applyBeforeL(locale: LocaleCode, s: string): string {
  if (locale === 'en') return applyBeforeText(s);
  return i18nT(locale)(`pair_apply_${low(s)}`);
}

export function basisL(locale: LocaleCode, s: string): string {
  if (locale === 'en') return entryBasisText(s);
  return i18nT(locale)(`pair_basis_${low(s)}`);
}

export function maxStayL(locale: LocaleCode, row: PairRow): string {
  if (locale === 'en') return maxStayText(row);
  const T = i18nT(locale);
  if (row.days) return T('pair_stay_days', { days: row.days });
  if (row.s === 'F' || row.s === 'A') return T('pair_stay_nodata');
  return T('pair_stay_set');
}

export function faqL(
  locale: LocaleCode,
  p: string,
  d: string,
  row: PairRow,
  extra: PairExtra,
  vintage: string,
  dEn: string,
): { q: string; a: string }[] {
  if (locale === 'en') return pairFaq(p, d, row, extra);
  const T = i18nT(locale);
  const verdict = verdictTextL(locale, row);
  const a1 = T(`pair_faq1_a_${low(row.s)}`, { p, d, verdict });
  const a2 = row.days
    ? T('pair_faq2_a_days', { days: row.days })
    : row.s === 'F' || row.s === 'A'
      ? T('pair_faq2_a_nodata')
      : T('pair_faq2_a_set');
  const a3 = extra.verified
    ? T('pair_faq3_a_yes', { date: formatDateL(locale, extra.verified), source: extra.source_name ?? '' })
    : T('pair_faq3_a_no', { vintage });
  const out = [
    { q: T('pair_faq1_q', { p, d }), a: a1 },
    { q: T('pair_faq2_q', { p, d }), a: a2 },
    { q: T('pair_faq3_q'), a: a3 },
  ];
  // SEO L10 query-style additions (2026-11-14) — localized counterparts of
  // the pairFaq() additions in lib/data.ts, phrased the way each locale
  // actually searches. Facts only: the honest fee line, this page's own
  // checklist, and the data layer's valid_until for expiring policies.
  const adds: { q: string; a: string }[] = [];
  if (row.s === 'E' || row.s === 'R' || row.s === 'A') {
    adds.push({
      q: T('l10_fee_q', { p, d }),
      a: extra.source_name
        ? T('l10_fee_a_src', { d, source: extra.source_name })
        : T('l10_fee_a', { d }),
    });
  }
  if (row.s === 'E' || row.s === 'R') {
    adds.push({
      q: T(row.s === 'E' ? 'l10_doc_q_e' : 'l10_doc_q_r', { p, d }),
      a: T('l10_doc_a', { items: checklistL(locale, row.s).join('; ') }),
    });
  }
  if (extra.valid_until) {
    adds.push({
      q: T('l10_until_q', { p, d }),
      a: T('l10_until_a', { date: formatDateL(locale, extra.valid_until) }),
    });
  }
  // Mixed-language mention: at most one per page, woven into the first
  // L10 answer — travellers often search the route by its English name.
  if (adds.length) {
    const enPhrase: Record<string, string> = {
      E: 'e-Visa',
      T: 'ETA',
      A: 'visa on arrival',
      R: 'visa',
      F: 'visa-free entry',
      N: 'entry rules',
    };
    adds[0].a +=
      (locale === 'th' ? ' ' : '') + T('l10_mix', { route: `${dEn} ${enPhrase[row.s]}` });
    out.push(...adds);
  }
  return out;
}
