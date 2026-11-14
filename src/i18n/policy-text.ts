// Policy-change entry texts, localized (batch 3). src/data/policy-changes.json
// stays the English source of record and is never edited for localization:
// its summary field feeds the route-change mailer's entry_key, so the
// translations live in a sidecar keyed by that same key (sha1 over
// date|destination|passport|summary, first 16 hex chars — the dispatcher.py
// entry_key formula, replicated here and covered by a key-set comparison in
// BATCH3-PROGRESS.md). Entries without an English title have no title in any
// locale either; the view renders the same empty heading as English.
import { createHash } from 'node:crypto';
import raw from './policy-text.json';
import type { LocaleCode } from './locales';

export interface PolicyEntryLike {
  date: string;
  destination: string;
  passport?: string;
  title?: string;
  summary: string;
}

const map = raw as Record<string, Partial<Record<LocaleCode, { t?: string; s: string }>>>;

export function policyEntryKey(e: PolicyEntryLike): string {
  const rawKey = [e.date, e.destination, e.passport || '', e.summary].join('|');
  return createHash('sha1').update(rawKey, 'utf8').digest('hex').slice(0, 16);
}

export function policyTextL(
  locale: LocaleCode,
  e: PolicyEntryLike,
): { title: string | undefined; summary: string } {
  if (locale === 'en') return { title: e.title, summary: e.summary };
  const rec = map[policyEntryKey(e)]?.[locale];
  if (!rec) return { title: e.title, summary: e.summary };
  return { title: rec.t ?? e.title, summary: rec.s };
}
