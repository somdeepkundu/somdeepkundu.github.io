"""Build the population inputs for the Mumbai Epidemic Simulator.

Inputs (open data, not stored in this repo):
  - DataMeet Municipal_Spatial_Data (CC BY-SA 2.5 India):
      Mumbai/BMC_Wards.geojson, Mumbai/slumClusters.geojson,
      NMMC/NMC_ElectoralWards.geojson, Mira-Bhayandar/Mira-Bhayandar.geojson
  - Census of India 2011 Primary Census Abstract, collated by ward in
      github.com/mickeykedia/Mumbai-Population-Map (ward_level_collated.csv)
  - City totals from Census 2011 for Thane, Navi Mumbai and Mira-Bhayandar

Outputs (docs/epidemic-sim/):
  population.json  zone table and two run-length encoded rasters on the
                   simulator's 100 m grid (zone id per cell, slum flag per cell)
  wards.geojson    simplified zone outlines for the map

Usage: python build_population.py DATAMEET_DIR WARD_CSV OUT_DIR
"""
import base64
import csv
import json
import math
import sys

# Must match model.js
BOX = dict(w=72.77, s=18.89, e=73.13, n=19.34)
LAT0 = (BOX["s"] + BOX["n"]) / 2
KX = 111320 * math.cos(math.radians(LAT0))
KY = 110574
CELL = 100
GW = math.ceil((BOX["e"] - BOX["w"]) * KX / CELL)
GH = math.ceil((BOX["n"] - BOX["s"]) * KY / CELL)

# Census 2011 totals for the municipal corporations outside Greater Mumbai
OUTSIDE = {
    "Thane": (1841488, 0.38),
    "Navi Mumbai": (1120547, 0.40),
    "Mira-Bhayandar": (809378, 0.37),
}
# No open boundary was found for Thane Municipal Corporation, so this is a
# rough hand-drawn outline; land and other zones clip it.
THANE_APPROX = [[72.935, 19.170], [72.985, 19.165], [73.020, 19.195], [73.010, 19.230],
                [72.985, 19.260], [72.960, 19.300], [72.930, 19.295], [72.935, 19.240],
                [72.950, 19.215], [72.935, 19.170]]


def xy(lon, lat):
    return ((lon - BOX["w"]) * KX, (lat - BOX["s"]) * KY)


def rings_of(geom):
    t, c = geom["type"], geom["coordinates"]
    polys = c if t == "MultiPolygon" else [c]
    return [[xy(p[0], p[1]) for p in ring] for poly in polys for ring in poly]


def rasterise(rings):
    """Even-odd scanline fill of rings onto the grid; returns a set of cell indices."""
    cells = set()
    edges = []
    for R in rings:
        for i in range(len(R)):
            a, b = R[i], R[i - 1]
            if a[1] != b[1]:
                edges.append((a, b))
    ys = [p[1] for R in rings for p in R]
    if not ys:
        return cells
    r0 = max(0, int(min(ys) // CELL) - 1)
    r1 = min(GH - 1, int(max(ys) // CELL) + 1)
    for row in range(r0, r1 + 1):
        y = (row + 0.5) * CELL
        xs = sorted(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])
                    for a, b in edges if (a[1] > y) != (b[1] > y))
        for k in range(0, len(xs) - 1, 2):
            c0 = max(0, math.ceil(xs[k] / CELL - 0.5))
            c1 = min(GW - 1, math.floor(xs[k + 1] / CELL - 0.5))
            for col in range(c0, c1 + 1):
                cells.add(row * GW + col)
    return cells


def rle(values):
    """[value, count] pairs, flattened, as base64 of uint16 little-endian."""
    out = bytearray()
    prev, n = values[0], 0
    for v in values:
        if v == prev and n < 65535:
            n += 1
        else:
            out += prev.to_bytes(2, "little") + n.to_bytes(2, "little")
            prev, n = v, 1
    out += prev.to_bytes(2, "little") + n.to_bytes(2, "little")
    return base64.b64encode(bytes(out)).decode()


def simplify(pts, tol):
    """Douglas-Peucker on lon/lat points, tolerance in degrees."""
    if len(pts) < 4:
        return pts
    a, b = pts[0], pts[-1]
    dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1e-12
        d = abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / L
        if d > dmax:
            dmax, idx = d, i
    if dmax <= tol:
        return [a, b]
    return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)


def simplify_geom(geom, tol=0.0004):
    t, c = geom["type"], geom["coordinates"]
    polys = c if t == "MultiPolygon" else [c]
    out = []
    for poly in polys:
        rings = []
        for ring in poly:
            pts = [p[:2] for p in ring]
            h = len(pts) // 2  # split the closed ring so both halves have distinct ends
            s = simplify(pts[:h + 1], tol)[:-1] + simplify(pts[h:], tol)
            s = [[round(x, 5), round(y, 5)] for x, y in s]
            if len(s) >= 4:
                rings.append(s)
        if rings:
            out.append(rings)
    return {"type": "MultiPolygon", "coordinates": out}


def main(dm, ward_csv, out_dir):
    load = lambda p: json.load(open(f"{dm}/{p}", encoding="utf-8"))
    census = {r["Ward_Alphabet"]: r for r in csv.DictReader(open(ward_csv, encoding="utf-8"))}

    zones, shapes = [], []  # zone 0 = no population
    for f in load("Mumbai/BMC_Wards.geojson")["features"]:
        w = f["properties"]["name"]
        r = census[w]
        zones.append(dict(name="Ward " + w, city="Greater Mumbai", pop=int(r["TOT_P"]),
                          workers=int(r["TOT_WORK_P"]), place=r.get("Place", "")))
        shapes.append(f["geometry"])

    nm = {"type": "MultiPolygon", "coordinates": [f["geometry"]["coordinates"] for f in load("NMMC/NMC_ElectoralWards.geojson")["features"]]}
    mb = load("Mira-Bhayandar/Mira-Bhayandar.geojson")["features"][0]["geometry"]
    th = {"type": "Polygon", "coordinates": [THANE_APPROX]}
    for name, geom in (("Mira-Bhayandar", mb), ("Thane", th), ("Navi Mumbai", nm)):
        pop, share = OUTSIDE[name]
        zones.append(dict(name=name, city=name, pop=pop, workers=round(pop * share), place=""))
        shapes.append(geom)

    zone = [0] * (GW * GH)
    for zid, geom in enumerate(shapes, start=1):
        for c in rasterise(rings_of(geom)):
            if zone[c] == 0:  # earlier zones (BMC wards) win any overlap
                zone[c] = zid

    slum = [0] * (GW * GH)
    for f in load("Mumbai/slumClusters.geojson")["features"]:
        for c in rasterise(rings_of(f["geometry"])):
            slum[c] = 1

    for zid, z in enumerate(zones, start=1):
        z["cells"] = sum(1 for v in zone if v == zid)
        z["slumCells"] = sum(1 for i, v in enumerate(zone) if v == zid and slum[i])

    json.dump(dict(
        source="Census of India 2011 (ward PCA via mickeykedia/Mumbai-Population-Map); boundaries DataMeet CC BY-SA 2.5 IN; Thane outline approximate",
        box=BOX, cell=CELL, gw=GW, gh=GH, zones=zones, zone=rle(zone), slum=rle(slum)),
        open(f"{out_dir}/population.json", "w"), separators=(",", ":"))

    feats = [dict(type="Feature", properties=dict(zone=i + 1, name=z["name"], pop=z["pop"]),
                  geometry=simplify_geom(g)) for i, (z, g) in enumerate(zip(zones, shapes))]
    json.dump(dict(type="FeatureCollection", features=feats), open(f"{out_dir}/wards.geojson", "w"), separators=(",", ":"))

    for z in zones:
        print(f'{z["name"]:16s} pop {z["pop"]:>9,d} cells {z["cells"]:>6d} slum {z["slumCells"]:>5d}')
    print("grid", GW, GH, "total pop", sum(z["pop"] for z in zones))


if __name__ == "__main__":
    main(*sys.argv[1:4])
