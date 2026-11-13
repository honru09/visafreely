// One-off (re-runnable) converter: world-atlas TopoJSON -> projected SVG paths.
// Source asset: scripts/assets/countries-110m.json (world-atlas v2; geometry is
// Natural Earth 1:110m cultural, public domain; package ISC). Output:
// src/data/world-paths.json — { viewBox, land (neutral, non-dataset countries
// merged), paths: { ISO2: "M..." } } in Natural Earth projection.
// The site never loads the TopoJSON or a mapping library at runtime.
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const topo = JSON.parse(readFileSync(join(root, 'scripts/assets/countries-110m.json'), 'utf8'));
const site = JSON.parse(readFileSync(join(root, 'src/data/site-data.json'), 'utf8'));
const datasetCodes = new Set(site.countries.map((c) => c.code));

// ISO 3166-1 numeric (TopoJSON feature id) -> ISO alpha-2, for every feature in
// countries-110m. Ids absent from the dataset (AQ, FK, TF, GL, NC, PR, EH)
// intentionally map to null => neutral land.
const NUM2A2 = {
  '004': 'AF', '008': 'AL', '010': null, '012': 'DZ', '024': 'AO', '031': 'AZ',
  '032': 'AR', '036': 'AU', '040': 'AT', '044': 'BS', '050': 'BD', '051': 'AM',
  '056': 'BE', '064': 'BT', '068': 'BO', '070': 'BA', '072': 'BW', '076': 'BR',
  '084': 'BZ', '090': 'SB', '096': 'BN', '100': 'BG', '104': 'MM', '108': 'BI',
  '112': 'BY', '116': 'KH', '120': 'CM', '124': 'CA', '140': 'CF', '144': 'LK',
  '148': 'TD', '152': 'CL', '156': 'CN', '158': 'TW', '170': 'CO', '178': 'CG',
  '180': 'CD', '188': 'CR', '191': 'HR', '192': 'CU', '196': 'CY', '203': 'CZ',
  '204': 'BJ', '208': 'DK', '214': 'DO', '218': 'EC', '222': 'SV', '226': 'GQ',
  '231': 'ET', '232': 'ER', '233': 'EE', '238': null, '242': 'FJ', '246': 'FI',
  '250': 'FR', '260': null, '262': 'DJ', '266': 'GA', '268': 'GE', '270': 'GM',
  '275': 'PS', '276': 'DE', '288': 'GH', '300': 'GR', '304': null, '320': 'GT',
  '324': 'GN', '328': 'GY', '332': 'HT', '340': 'HN', '348': 'HU', '352': 'IS',
  '356': 'IN', '360': 'ID', '364': 'IR', '368': 'IQ', '372': 'IE', '376': 'IL',
  '380': 'IT', '384': 'CI', '388': 'JM', '392': 'JP', '398': 'KZ', '400': 'JO',
  '404': 'KE', '408': 'KP', '410': 'KR', '414': 'KW', '417': 'KG', '418': 'LA',
  '422': 'LB', '426': 'LS', '428': 'LV', '430': 'LR', '434': 'LY', '440': 'LT',
  '442': 'LU', '450': 'MG', '454': 'MW', '458': 'MY', '466': 'ML', '478': 'MR',
  '484': 'MX', '496': 'MN', '498': 'MD', '499': 'ME', '504': 'MA', '508': 'MZ',
  '512': 'OM', '516': 'NA', '524': 'NP', '528': 'NL', '540': null, '548': 'VU',
  '554': 'NZ', '558': 'NI', '562': 'NE', '566': 'NG', '578': 'NO', '586': 'PK',
  '591': 'PA', '598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH', '616': 'PL',
  '620': 'PT', '624': 'GW', '626': 'TL', '630': null, '634': 'QA', '642': 'RO',
  '643': 'RU', '646': 'RW', '682': 'SA', '686': 'SN', '688': 'RS', '694': 'SL',
  '703': 'SK', '704': 'VN', '705': 'SI', '706': 'SO', '710': 'ZA', '716': 'ZW',
  '724': 'ES', '728': 'SS', '729': 'SD', '732': null, '740': 'SR', '748': 'SZ',
  '752': 'SE', '756': 'CH', '760': 'SY', '762': 'TJ', '764': 'TH', '768': 'TG',
  '780': 'TT', '784': 'AE', '788': 'TN', '792': 'TR', '795': 'TM', '800': 'UG',
  '804': 'UA', '807': 'MK', '818': 'EG', '826': 'GB', '834': 'TZ', '840': 'US',
  '854': 'BF', '858': 'UY', '860': 'UZ', '862': 'VE', '887': 'YE', '894': 'ZM',
};
// Features without a numeric id, keyed by their Natural Earth name.
const NAME2A2 = { Kosovo: 'XK', 'N. Cyprus': null, Somaliland: null };

// ---------- TopoJSON decode ----------
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; // [lon, lat] degrees
  });
});
function arcPoints(idx) {
  const pts = idx >= 0 ? arcs[idx] : arcs[~idx].slice().reverse();
  return pts;
}
function ringPoints(ring) {
  const out = [];
  for (const idx of ring) {
    const pts = arcPoints(idx);
    for (let i = out.length ? 1 : 0; i < pts.length; i++) out.push(pts[i]);
  }
  return out;
}
function geometryPolygons(geom) {
  if (geom.type === 'Polygon') return geom.arcs.map((ring) => ringPoints(ring));
  if (geom.type === 'MultiPolygon')
    return geom.arcs.flatMap((poly) => poly.map((ring) => ringPoints(ring)));
  return [];
}

// ---------- Antimeridian repair ----------
// Natural Earth rings are paths on the sphere: a step from +179 to -179 means
// "cross the antimeridian", not "draw a line across the whole map". Unwrap
// each ring to continuous longitudes, then Sutherland–Hodgman-clip the
// unwrapped ring (and its ±360 copies) back into [-180, 180].
function unwrap(ring) {
  const out = [[ring[0][0], ring[0][1]]];
  for (let i = 1; i < ring.length; i++) {
    let lon = ring[i][0];
    const prev = out[i - 1][0];
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}
function clipHalfPlane(poly, keepLE, bound) {
  // keep points with lon <= bound (keepLE) or lon >= bound.
  const inside = (lon) => (keepLE ? lon <= bound + 1e-9 : lon >= bound - 1e-9);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ain = inside(a[0]), bin = inside(b[0]);
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (bound - a[0]) / (b[0] - a[0]);
      out.push([bound, a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}
function repairRing(ring) {
  let hasJump = false;
  for (let i = 1; i < ring.length; i++)
    if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) { hasJump = true; break; }
  if (!hasJump) return [ring];
  const unwrapped = unwrap(ring);
  const pieces = [];
  for (const shift of [-360, 0, 360]) {
    const shifted = unwrapped.map(([lon, lat]) => [lon + shift, lat]);
    const clipped = clipHalfPlane(clipHalfPlane(shifted, false, -180), true, 180);
    if (clipped.length >= 3) pieces.push(clipped);
  }
  return pieces.length ? pieces : [ring];
}

// ---------- Natural Earth projection (d3-geo naturalEarth1 raw) ----------
function project(lon, lat) {
  const lambda = (lon * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const phi2 = phi * phi, phi4 = phi2 * phi2;
  return [
    lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))),
    phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))),
  ];
}

// First pass: project everything, find bounds.
const features = topo.objects.countries.geometries.map((g) => {
  const code =
    g.id !== undefined && g.id !== null
      ? NUM2A2[String(g.id).padStart(3, '0')]
      : NAME2A2[g.properties.name];
  if (code === undefined) throw new Error(`unmapped feature: ${g.id} ${g.properties.name}`);
  return { code, name: g.properties.name, rings: geometryPolygons(g).flatMap(repairRing) };
});
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const f of features)
  for (const ring of f.rings)
    for (const [lon, lat] of ring) {
      const [x, y] = project(lon, lat);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
const W = 960;
const k = W / (maxX - minX);
const H = Math.round((maxY - minY) * k * 10) / 10;
const px = (lon, lat) => {
  const [x, y] = project(lon, lat);
  return [Math.round((x - minX) * k * 10) / 10, Math.round((maxY - y) * k * 10) / 10];
};

// Second pass: path strings (drop consecutive duplicates after rounding).
function ringPath(ring) {
  let d = '';
  let prev = null;
  for (const [lon, lat] of ring) {
    const [x, y] = px(lon, lat);
    const key = x + ',' + y;
    if (key === prev) continue;
    d += (d === '' ? 'M' : 'L') + key;
    prev = key;
  }
  return d ? d + 'Z' : '';
}

const paths = {};
let land = '';
for (const f of features) {
  const d = f.rings.map(ringPath).filter(Boolean).join('');
  if (!d) continue;
  if (f.code && datasetCodes.has(f.code)) {
    if (paths[f.code]) throw new Error(`duplicate geometry for ${f.code}`);
    paths[f.code] = d;
  } else {
    land += d;
  }
}

const out = { viewBox: `0 0 ${W} ${H}`, land, paths };
const json = JSON.stringify(out);
writeFileSync(join(root, 'src/data/world-paths.json'), json);

const covered = Object.keys(paths);
const missing = [...datasetCodes].filter((c) => !paths[c]).sort();
console.log(`features=${features.length} dataset-covered=${covered.length} neutral-merged=${features.length - covered.length}`);
console.log(`viewBox=0 0 ${W} ${H}`);
console.log(`world-paths.json raw=${json.length}B gzip=${gzipSync(json).length}B`);
console.log(`dataset codes without geometry (${missing.length}): ${missing.join(' ')}`);
