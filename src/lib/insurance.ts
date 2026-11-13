// B10 (2026-11-14): factual insurance-requirement notes for pair pages.
// Data: src/data/insurance-required.json, transcribed from the first-hand
// verified list in monetization-audit-2026-11-13/b10-insurance-required/.
// An entry renders only when the pair's status matches the entry's verified
// applicability; officialOnly entries (QA/SA/KE/TZ) never carry a commercial
// "meets the requirement" note — their requirements are met only by the
// official/designated policy named in the note itself.
import raw from '../data/insurance-required.json';

export interface InsuranceEntry {
  id: string;
  codes: string[];
  category: string;
  statuses: string[];
  threshold: string | null;
  sourceName: string;
  sourceUrl: string;
  officialOnly: boolean;
  note: string;
  cardNote: string | null;
  cutNote: string | null;
  passports: string[] | null;
  excludePassports: string[] | null;
  maxDays: number | null;
}

const entries = (raw as { entries: InsuranceEntry[] }).entries;

export function insuranceFor(
  destinationCode: string,
  status: string,
  passportCode?: string,
  days?: number | null,
): InsuranceEntry | null {
  const e = entries.find((x) => x.codes.includes(destinationCode));
  if (!e) return null;
  if (!e.statuses.includes(status)) return null;
  if (e.passports && (!passportCode || !e.passports.includes(passportCode))) return null;
  if (e.excludePassports && passportCode && e.excludePassports.includes(passportCode)) return null;
  if (e.maxDays != null && !(days != null && days <= e.maxDays)) return null;
  return e;
}
