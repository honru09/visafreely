// Per-pair verification notes, localized (batch 3). The data layer
// (site-data.json extras, regenerated from the verification data files) stays
// the English source of record; pair-note-text.json holds per-pair,
// per-locale renderings for the pairs in the wave-A route set
// (src/i18n/pair-routes.json). Facts — dates, day counts, fees, scheme and
// portal names — are carried over verbatim in every locale. Pairs outside
// the wave-A set have no localized pages, so a missing entry simply falls
// back to the English original.
import raw from './pair-note-text.json';
import type { LocaleCode } from './locales';

const map = raw as Record<string, Partial<Record<LocaleCode, string>>>;

export function pairNoteL(
  locale: LocaleCode,
  passport: string,
  destination: string,
  orig: string | null | undefined,
): string | null | undefined {
  if (locale === 'en' || !orig) return orig;
  return map[`${passport}:${destination}`]?.[locale] ?? orig;
}
