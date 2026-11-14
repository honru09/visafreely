// B10 insurance-requirement strings, localized (wave A). The data layer
// (src/data/insurance-required.json) stays the English source of record;
// insurance-text.json holds per-entry, per-locale renderings of the three
// display fields. Amounts, dates, URLs and scheme names are facts and are
// carried over verbatim in every locale. A locale's pair pages only launch
// once its coverage here is complete (batch gate in WAVEA-PROGRESS.md);
// until then the helper falls back to the English original.
import raw from './insurance-text.json';
import type { InsuranceEntry } from '../lib/insurance';
import type { LocaleCode } from './locales';

type Field = 'note' | 'cardNote' | 'cutNote';
const map = raw as Record<string, Partial<Record<Field, Partial<Record<LocaleCode, string>>>>>;

export function insuranceTextL(
  locale: LocaleCode,
  entry: InsuranceEntry,
  field: Field,
): string | null {
  const orig = entry[field];
  if (locale === 'en' || !orig) return orig;
  return map[entry.id]?.[field]?.[locale] ?? orig;
}
