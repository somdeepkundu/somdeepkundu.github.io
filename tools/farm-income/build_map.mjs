// Builds docs/farm-income/assets/map/india-states.json from geoKosh's IndiaState shapefile.
//
//   git clone --depth 1 https://github.com/somdeepkundu/geoKosh /tmp/geoKosh
//   node tools/farm-income/build_map.mjs /tmp/geoKosh/IndiaShapes/IndiaState.shp
//
// The shapefile is already in India's Lambert conformal conic projection (Survey of India
// parameters), so it is only simplified (mapshaper, weighted Visvalingam, 1%) and scaled to a
// 1000-unit-wide SVG. Each state carries its NSS 2013 code; Ladakh borrows Jammu & Kashmir's
// (it was part of that state in 2013) and the merged UT uses the pooled "25+26" estimate.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SHP = process.argv[2];
if (!SHP) { console.error("usage: node build_map.mjs <IndiaState.shp>"); process.exit(1); }
const OUT = join(dirname(fileURLToPath(import.meta.url)), "../../docs/farm-income/assets/map/india-states.json");
const WIDTH = 1000, PAD = 4, SMALL = 22, MIN_RING = 0.6, KEEP_LARGEST = 3;

const CODES = {
  "Jammu And Kashmir": "01", "Ladakh": "01", "Himachal Pradesh": "02", "Punjab": "03",
  "Chandigarh": "04", "Uttarakhand": "05", "Haryana": "06", "Delhi": "07", "Rajasthan": "08",
  "Uttar Pradesh": "09", "Bihar": "10", "Sikkim": "11", "Arunachal Pradesh": "12",
  "Nagaland": "13", "Manipur": "14", "Mizoram": "15", "Tripura": "16", "Meghalaya": "17",
  "Assam": "18", "West Bengal": "19", "Jharkhand": "20", "Odisha": "21", "Chhattisgarh": "22",
  "Madhya Pradesh": "23", "Gujarat": "24", "Dadra & Nagar Haveli & Daman & Diu": "25+26",
  "Maharashtra": "27", "Andhra Pradesh": "28", "Karnataka": "29", "Goa": "30",
  "Lakshadweep": "31", "Kerala": "32", "Tamil Nadu": "33", "Puducherry": "34",
  "Andaman & Nicobar": "35", "Telangana": "36",
};

const tmp = mkdtempSync(join(tmpdir(), "india-"));
const geo = join(tmp, "states.json");
execFileSync("npx", ["--yes", "mapshaper@0.6", SHP, "-simplify", "weighted", "1%", "keep-shapes",
  "-o", geo, "format=geojson", "precision=1"], { stdio: "inherit" });
const fc = JSON.parse(readFileSync(geo, "utf8"));

let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
const rings = f => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);
for (const f of fc.features) for (const poly of rings(f)) for (const [x, y] of poly[0]) {
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
}
const k = (WIDTH - 2 * PAD) / (x1 - x0);
const HEIGHT = Math.ceil((y1 - y0) * k + 2 * PAD);
const sx = x => +((x - x0) * k + PAD).toFixed(1);
const sy = y => +((y1 - y) * k + PAD).toFixed(1);   // northing up -> SVG y down

const area = ring => ring.reduce((s, [x, y], i) => {
  const [x2, y2] = ring[(i + 1) % ring.length]; return s + x * y2 - x2 * y; }, 0) / 2;
function centroid(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [xa, ya] = ring[i], [xb, yb] = ring[(i + 1) % ring.length], c = xa * yb - xb * ya;
    a += c; cx += (xa + xb) * c; cy += (ya + yb) * c;
  }
  return a ? [cx / (3 * a), cy / (3 * a)] : ring[0];
}

const features = fc.features.map(f => {
  const name = f.properties.State;
  const code = CODES[name];
  if (!code) throw new Error(`No NSS code for ${name}`);
  let d = "", big = null, bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  // drop specks below MIN_RING square units, but always keep a state's largest pieces, so island
  // territories such as Lakshadweep survive
  const polys = rings(f).map(poly => poly.map(r => r.map(([x, y]) => [sx(x), sy(y)])))
    .map(poly => ({ poly, a: Math.abs(area(poly[0])) })).sort((p, q) => q.a - p.a);
  for (const [i, { poly }] of polys.entries()) {
    if (i >= KEEP_LARGEST && Math.abs(area(poly[0])) < MIN_RING) continue;
    for (const pts of poly) {
      if (pts !== poly[0] && Math.abs(area(pts)) < MIN_RING) continue;
      for (const [x, y] of pts) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
      d += "M" + pts.slice(0, -1).map(p => p.join(",")).join("L") + "Z";
    }
    if (!big) big = poly[0];
  }
  const [cx, cy] = centroid(big);
  // too small to tap on a phone: drawn with a marker dot as well
  const small = Math.abs(area(big)) < SMALL * SMALL;
  return { key: name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""), name, code,
           ...(name === "Ladakh" ? { via: "01" } : {}), cx: +cx.toFixed(1), cy: +cy.toFixed(1),
           ...(small ? { small: true } : {}), d };
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  source: "geoKosh IndiaState (https://github.com/somdeepkundu/geoKosh), Lambert conformal conic, simplified 1% with mapshaper",
  viewBox: [0, 0, WIDTH, HEIGHT], features,
}));
console.log(`${features.length} states, viewBox 0 0 ${WIDTH} ${HEIGHT}, ${(readFileSync(OUT).length / 1024).toFixed(0)} KB -> ${OUT}`);
