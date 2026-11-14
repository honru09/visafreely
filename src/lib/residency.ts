// Residency & citizenship vertical (batch 1, 2026-11-14).
// Single source of truth: src/data/residency-routes.json — the finalized
// research dataset (official first-hand sources only, verified
// 2026-11-14). Templates render every figure from this file at build
// time; no number is hand-written into a template (PLAN section 1).
import routesRaw from '../data/residency-routes.json';
import { countryByCode } from './data';

export interface ResidencyOption {
  name: string;
  amount: number;
  currency: string;
  basis?: string;
  notes?: string;
}

export interface ResidencyRoute {
  id: string;
  country: string;
  code: string;
  type: 'cbi' | 'rbi';
  programme: string;
  status: 'open' | 'closed';
  status_date?: string;
  status_note?: string;
  legal_basis?: string;
  options: ResidencyOption[];
  historical_thresholds?: string;
  gov_fees: string | null;
  government_total_single: number | null;
  government_total_family4: number | null;
  government_total_family4_max?: number;
  currency: string;
  family_total_basis?: string;
  processing_time: string | null;
  residence_requirement: string | null;
  time_to_pr: string | null;
  time_to_citizenship: string | null;
  dual_citizenship: string | null;
  restricted_nationalities: string | null;
  documents: string[];
  conflicts: string[];
  sources: string[];
  merit_country_page_material?: { placement: string; facts: string };
}

const allRoutes = (routesRaw as unknown as { routes: ResidencyRoute[] }).routes;
export const RESIDENCY_VERIFIED_DATE = (
  routesRaw as unknown as { meta: { verified_date: string } }
).meta.verified_date;

/** Published set (PLAN section 5): batch 1 (DM/KN/ST + Spain archive)
 *  and batch 2 (GD/LC/VU/EG + AG/TR partial CBI; PT/GR/IT/CY/HU/AE RBI;
 *  Malta MPRP + Malta CBI archive page per PLAN section 3 and the
 *  dataset's archive_note adjudication). */
export const PUBLISHED_ROUTE_IDS = [
  'dominica-cbi',
  'st-kitts-cbi',
  'sao-tome-cbi',
  'spain-golden-visa',
  'grenada-cbi',
  'st-lucia-cbi',
  'vanuatu-dsp',
  'egypt-cbi',
  'antigua-cbi',
  'turkiye-cbi',
  'portugal-ari',
  'greece-golden-visa',
  'italy-investor-visa',
  'cyprus-pr-62',
  'hungary-guest-investor',
  'uae-golden-visa',
  'malta-mprp',
  'malta-cbi',
];

export const publishedRoutes: ResidencyRoute[] = allRoutes.filter((r) =>
  PUBLISHED_ROUTE_IDS.includes(r.id),
);
export const openRoutes = publishedRoutes.filter((r) => r.status === 'open');
export const closedRoutes = publishedRoutes.filter((r) => r.status === 'closed');
export const routeById: Record<string, ResidencyRoute> = Object.fromEntries(
  publishedRoutes.map((r) => [r.id, r]),
);

/** Malta country-page material (PLAN section 3): the Citizenship by
 *  Merit framework is a discretionary naturalisation route, stated as
 *  facts on the country page only — never a standalone route page. */
const maltaCbiFull = allRoutes.find((r) => r.id === 'malta-cbi');
export const MALTA_MERIT_FACTS =
  maltaCbiFull?.merit_country_page_material?.facts ?? null;
export const publishedCountries: string[] = [
  ...new Set(publishedRoutes.map((r) => r.code)),
];
export const routesForCountry = (code: string) =>
  publishedRoutes.filter((r) => r.code === code);

const ROUTE_SLUG: Record<string, string> = {
  'dominica-cbi': 'citizenship-by-investment',
  'st-kitts-cbi': 'citizenship-by-investment',
  'sao-tome-cbi': 'citizenship-by-investment',
  'spain-golden-visa': 'golden-visa',
  'grenada-cbi': 'citizenship-by-investment',
  'st-lucia-cbi': 'citizenship-by-investment',
  'vanuatu-dsp': 'citizenship-by-investment',
  'egypt-cbi': 'citizenship-by-investment',
  'antigua-cbi': 'citizenship-by-investment',
  'turkiye-cbi': 'citizenship-by-investment',
  'portugal-ari': 'golden-visa',
  'greece-golden-visa': 'golden-visa',
  'italy-investor-visa': 'investor-visa',
  'cyprus-pr-62': 'permanent-residence',
  'hungary-guest-investor': 'guest-investor-visa',
  'uae-golden-visa': 'golden-visa',
  'malta-mprp': 'permanent-residence',
  'malta-cbi': 'citizenship-by-investment',
};
export const routeSlug = (r: ResidencyRoute) => ROUTE_SLUG[r.id];
export const countryPath = (code: string) =>
  `/residency/${countryByCode[code].slug}/`;
export const routePath = (r: ResidencyRoute) =>
  `/residency/${countryByCode[r.code].slug}/${ROUTE_SLUG[r.id]}/`;

const CUR_SYMBOL: Record<string, string> = { USD: 'US$', EUR: '€' };
export const fmtMoney = (amount: number, currency: string) =>
  `${CUR_SYMBOL[currency] || currency + ' '}${amount.toLocaleString('en-US')}`;

/** Rendered when a field has no official figure (PLAN section 1). */
export const NOT_PUBLISHED = 'Not officially published';

/** Headline minimum: the cheapest one-off qualifying amount. Options
 *  without a fixed amount (job-creation routes) and recurring amounts
 *  (basis "per year", e.g. a rent or an annual tax figure) never pose as
 *  the entry threshold — they are listed in full in the options table. */
export const minThreshold = (r: ResidencyRoute) => {
  const lump = r.options
    .filter((o) => o.amount != null && o.basis !== 'per year')
    .map((o) => o.amount);
  if (lump.length) return Math.min(...lump);
  const any = r.options.filter((o) => o.amount != null).map((o) => o.amount);
  return any.length ? Math.min(...any) : null;
};

export const familyTotalText = (r: ResidencyRoute): string => {
  if (r.government_total_family4 == null) return NOT_PUBLISHED;
  const lo = fmtMoney(r.government_total_family4, r.currency);
  return r.government_total_family4_max
    ? `${lo} – ${fmtMoney(r.government_total_family4_max, r.currency)}`
    : lo;
};

/** The nine fixed decision fields (PLAN section 1, item 2). Null fields
 *  never render an invented number: genuinely unpublished fields show
 *  NOT_PUBLISHED; years-to-PR on a citizenship route is not applicable
 *  because citizenship itself is granted directly. */
export function decisionRows(r: ResidencyRoute): { label: string; value: string }[] {
  const min = minThreshold(r);
  return [
    {
      label: 'Minimum investment (single applicant)',
      value: min != null ? fmtMoney(min, r.currency) : NOT_PUBLISHED,
    },
    { label: 'Government-side total — family of 4', value: familyTotalText(r) },
    { label: 'Government fees', value: r.gov_fees ?? NOT_PUBLISHED },
    { label: 'Processing time (official)', value: r.processing_time ?? NOT_PUBLISHED },
    { label: 'Residence requirement', value: r.residence_requirement ?? NOT_PUBLISHED },
    {
      label: 'Years to permanent residence',
      value:
        r.time_to_pr ??
        (r.type === 'cbi'
          ? 'Not applicable — citizenship is granted directly'
          : NOT_PUBLISHED),
    },
    { label: 'Years to citizenship', value: r.time_to_citizenship ?? NOT_PUBLISHED },
    { label: 'Dual citizenship', value: r.dual_citizenship ?? NOT_PUBLISHED },
    {
      label: 'Restricted nationalities',
      value: r.restricted_nationalities ?? NOT_PUBLISHED,
    },
  ];
}

/** Related routes: same type first, then nearest minimum threshold. */
export function relatedRoutes(r: ResidencyRoute, n = 3): ResidencyRoute[] {
  const base = minThreshold(r) ?? 0;
  return publishedRoutes
    .filter((x) => x.id !== r.id && x.status === 'open')
    .sort((a, b) => {
      const ta = a.type === r.type ? 0 : 1;
      const tb = b.type === r.type ? 0 : 1;
      if (ta !== tb) return ta - tb;
      return Math.abs((minThreshold(a) ?? 0) - base) - Math.abs((minThreshold(b) ?? 0) - base);
    })
    .slice(0, n);
}

/** PLAN section 3 fixed disclaimer (date filled from the dataset). */
export const residencyDisclaimer = (date: string) =>
  `Figures compiled from official sources as of ${date}. Programmes change without notice. Confirm current terms with the competent authority or a licensed agent before acting. VisaFreely is an information service — not an immigration adviser, not a licensed agent, and it does not process applications.`;
