// visafreely i18n registry — the single place that knows the locales.
//
// To add a language: add one entry here, add it to
// project.inlang/settings.json + messages/<locale>.json, translate the
// catalogue, and flip it live in src/i18n/launched.json once its core
// surfaces are built and reviewed. Nothing else changes.
import * as m from '../paraglide/messages.js';
import launchedRaw from './launched.json';
import glossaryRaw from './glossary.json';
import type { Country, PairRow } from '../lib/data';
import { formatDateLong } from '../lib/data';

export type LocaleCode = 'en' | 'zh-hans' | 'zh-hant' | 'ja' | 'ko' | 'th';

export interface LocaleDef {
  code: LocaleCode;
  /** URL prefix segment; '' for the default locale. */
  prefix: string;
  hreflang: string;
  htmlLang: string;
  /** Display name in the language itself (switcher menu). */
  name: string;
  launched: boolean;
}

const LAUNCHED = new Set(launchedRaw as string[]);
const def = (
  code: LocaleCode,
  prefix: string,
  hreflang: string,
  name: string,
): LocaleDef => ({ code, prefix, hreflang, htmlLang: hreflang, name, launched: LAUNCHED.has(code) });

export const LOCALES: LocaleDef[] = [
  def('en', '', 'en', 'English'),
  def('zh-hans', 'zh-hans', 'zh-Hans', '简体中文'),
  def('zh-hant', 'zh-hant', 'zh-Hant', '繁體中文'),
  def('ja', 'ja', 'ja', '日本語'),
  def('ko', 'ko', 'ko', '한국어'),
  def('th', 'th', 'th', 'ไทย'),
];
export const localeByCode: Record<string, LocaleDef> = Object.fromEntries(
  LOCALES.map((l) => [l.code, l]),
);
export const LAUNCHED_LOCALES = LOCALES.filter((l) => l.launched);

/** Hub URL prefixes that exist per launched locale (besides CORE_PATHS). */
export const HUB_PREFIXES = ['/passport/', '/destination/'];

/** Suggestion-bar copy per target locale (frozen; see glossary discipline). */
export const SUGGEST: Partial<Record<LocaleCode, { text: string; cta: string; close: string }>> = {
  'zh-hans': { text: '本站提供简体中文版', cta: '切换到简体中文', close: '关闭' },
  'zh-hant': { text: '本站提供繁體中文版', cta: '切換到繁體中文', close: '關閉' },
  ja: { text: 'このサイトは日本語でも読めます', cta: '日本語で見る', close: '閉じる' },
  ko: { text: '이 사이트를 한국어로 볼 수 있습니다', cta: '한국어로 보기', close: '닫기' },
  th: { text: 'เว็บไซต์นี้มีภาษาไทยให้อ่าน', cta: 'ดูเป็นภาษาไทย', close: 'ปิด' },
};

/** Message lookup for one locale: t('nav_passports') / t('home_lede', {count}). */
export function t(locale: LocaleCode) {
  return (key: string, inputs?: Record<string, string | number>): string => {
    const fn = (m as unknown as Record<string, (i?: unknown, o?: unknown) => string>)[key];
    if (!fn) throw new Error(`i18n: missing message "${key}"`);
    return fn(inputs, { locale });
  };
}

interface GlossarySection {
  status: Record<string, string>;
  statusShort: Record<string, string>;
  countries: Record<string, string>;
}
const glossary = glossaryRaw as unknown as Partial<Record<string, GlossarySection>>;

/** Country display name in a locale (frozen-glossary locales only). */
export function countryName(locale: LocaleCode, c: Country): string {
  const g = glossary[locale];
  if (g) return g.countries[c.code] || c.name;
  return c.name;
}

/** Full status label ("Visa free" / 免签 / ビザ免除） in a locale. */
export function statusLabelL(locale: LocaleCode, code: string): string {
  const g = glossary[locale];
  if (g) return g.status[code] || code;
  return { F: 'Visa free', A: 'Visa on arrival', E: 'e-Visa', T: 'Electronic travel authorisation (ETA)', R: 'Visa required', N: 'No admission' }[code] || code;
}

/** Short status label for compact rows ("No admission" / 不可入境）. */
export function statusShortL(locale: LocaleCode, code: string): string {
  const g = glossary[locale];
  if (g) return g.statusShort[code] || code;
  return { F: 'Visa free', A: 'Visa on arrival', E: 'e-Visa', T: 'ETA', R: 'Visa required', N: 'No admission' }[code] || code;
}

/** Verdict sentence in a locale; mirrors lib/data.verdictText for English. */
export function verdictTextL(locale: LocaleCode, row: PairRow): string {
  const tt = t(locale);
  if (row.s === 'F' && row.days) return tt('verdict_f_days', { days: row.days });
  if (row.s === 'A' && row.days) return tt('verdict_a_days', { days: row.days });
  if (row.s === 'E') return tt('verdict_e');
  if (row.s === 'T') return tt('verdict_t');
  return statusLabelL(locale, row.s);
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/** "25 Oct 2026" / "2026年10月25日" (zh and ja share the 年月日 form) / "2026년 10월 25일" (ko, PLAN §7)
 *  / "25 ตุลาคม 2026" (th: Thai month name + Gregorian year — never Buddhist Era, PLAN §7). */
export function formatDateL(locale: LocaleCode, iso: string): string {
  if (locale === 'zh-hans' || locale === 'zh-hant' || locale === 'ja') {
    const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (mm) return `${parseInt(mm[1], 10)}年${parseInt(mm[2], 10)}月${parseInt(mm[3], 10)}日`;
    return iso;
  }
  if (locale === 'ko') {
    const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (mm) return `${parseInt(mm[1], 10)}년 ${parseInt(mm[2], 10)}월 ${parseInt(mm[3], 10)}일`;
    return iso;
  }
  if (locale === 'th') {
    const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (mm) return `${parseInt(mm[3], 10)} ${THAI_MONTHS[parseInt(mm[2], 10) - 1]} ${parseInt(mm[1], 10)}`;
    return iso;
  }
  return formatDateLong(iso);
}

/** Locale-aware path: prefix a site path when that locale has the page. */
export function hrefFor(
  locale: LocaleCode,
  path: string,
  availability: Record<string, string[]>,
): string {
  if (locale === 'en') return path;
  const hashAt = path.indexOf('#');
  const base = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const hash = hashAt >= 0 ? path.slice(hashAt) : '';
  const loc = localeByCode[locale];
  if (loc && availability[base]?.includes(locale)) return `/${loc.prefix}${base}${hash}`;
  return path;
}

/** Locale home path ('/' for en, '/zh-hans/' otherwise). */
export function localeHome(locale: LocaleCode): string {
  const loc = localeByCode[locale];
  return loc && loc.prefix ? `/${loc.prefix}/` : '/';
}

/** Split a request pathname into (locale, unprefixed path). */
export function stripLocale(pathname: string): { locale: LocaleCode; path: string } {
  for (const loc of LOCALES) {
    if (!loc.prefix) continue;
    if (pathname === `/${loc.prefix}` || pathname.startsWith(`/${loc.prefix}/`)) {
      return { locale: loc.code, path: pathname.slice(loc.prefix.length + 1) || '/' };
    }
  }
  return { locale: 'en', path: pathname };
}
