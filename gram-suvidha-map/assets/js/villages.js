/* Gram Suvidha Map: the viewer's own village boundaries, kept in this browser (IndexedDB).
   Geometry helpers work on GeoJSON Polygon / MultiPolygon in lon/lat. */
"use strict";
const Villages = (() => {
  const DB = "gram-suvidha", VER = 1;
  let dbp = null, districtsCache = null, indexCache = null;
  const cache = new Map();                 // district key -> {meta, feats, grid}; small LRU

  function open() {
    if (!("indexedDB" in self)) return Promise.reject(new Error("This browser cannot store data locally."));
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, VER);
      r.onupgradeneeded = () => {
        const db = r.result;
        for (const s of ["meta", "districts", "geo"]) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "key" });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => { dbp = null; rej(r.error); };
      r.onblocked = () => { dbp = null; rej(new Error("Close other tabs of this app and reload.")); };
    });
    return dbp;
  }
  async function get(store, key) {
    const db = await open();
    return new Promise((res, rej) => { const r = db.transaction(store).objectStore(store).get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }
  async function all(store) {
    const db = await open();
    return new Promise((res, rej) => { const r = db.transaction(store).objectStore(store).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }

  /* ---------- geometry ---------- */
  const polysOf = g => g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  function bboxOf(g) {
    const b = [180, 90, -180, -90];
    for (const p of polysOf(g)) for (const [x, y] of p[0]) {
      if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
    }
    return b;
  }
  function inRing(x, y, ring) {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function contains(g, lon, lat) {
    for (const p of polysOf(g)) {
      if (!inRing(lon, lat, p[0])) continue;
      let hole = false;
      for (let k = 1; k < p.length; k++) if (inRing(lon, lat, p[k])) { hole = true; break; }
      if (!hole) return true;
    }
    return false;
  }
  /* area in km² and an area-weighted centroid, on a local equirectangular projection (fine at village scale) */
  function areaCentroid(g, b) {
    const lat0 = (b[1] + b[3]) / 2 * Math.PI / 180, kx = 111.32 * Math.cos(lat0), ky = 110.57;
    let A = 0, cx = 0, cy = 0;
    for (const p of polysOf(g)) p.forEach((ring, ri) => {
      let a = 0, sx = 0, sy = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const x0 = ring[j][0] * kx, y0 = ring[j][1] * ky, x1 = ring[i][0] * kx, y1 = ring[i][1] * ky;
        const c = x0 * y1 - x1 * y0; a += c; sx += (x0 + x1) * c; sy += (y0 + y1) * c;
      }
      a /= 2; const s = ri ? -Math.abs(a) : Math.abs(a), sign = a ? s / a : 0;
      A += s; cx += sx / 6 * sign; cy += sy / 6 * sign;
    });
    if (!A) return { km2: 0, c: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] };
    return { km2: A, c: [cx / A / kx, cy / A / ky] };
  }

  /* ---------- store API ---------- */
  async function info() { try { return (await get("meta", "info")) || null; } catch { return null; } }
  async function districts() { return districtsCache || (districtsCache = await all("districts")); }
  async function index() {
    if (indexCache) return indexCache;
    const r = await get("meta", "index");
    indexCache = r ? JSON.parse(r.text).map(a => ({ id: a[0], name: a[1], subdist: a[2], district: a[3], state: a[4], key: a[5], lon: a[6], lat: a[7], pop: a[8],
      s: norm(a[1] + " " + a[2] + " " + a[3]) })) : [];
    return indexCache;
  }
  async function district(key) {
    if (cache.has(key)) { const d = cache.get(key); cache.delete(key); cache.set(key, d); return d; }
    const [geo, meta] = [await get("geo", key), (await districts()).find(d => d.key === key)];
    if (!geo || !meta) throw new Error("That district is not in your village file.");
    const feats = JSON.parse(geo.text);
    feats.forEach(f => {
      const p = f.properties, b = bboxOf(f.geometry), ac = areaCentroid(f.geometry, b);
      f.id = p.vill_lgd; f.bbox = b; f.km2 = ac.km2; f.c = ac.c;
      f.pop = +p.pop || 0; f.hh = +p.hh || 0;
      // a few thousand small villages collapsed to 4-6 point slivers when the layer was simplified; their area is not usable
      const verts = polysOf(f.geometry).reduce((n, p) => n + p[0].length, 0);
      f.collapsed = f.km2 < 0.05 && verts <= 8;
      f.density = !f.collapsed && f.km2 > 0 && f.pop ? f.pop / f.km2 : null;
      f.hhsize = f.hh ? f.pop / f.hh : null;
    });
    // coarse grid so a point finds its village fast
    const cell = 0.02, grid = new Map();
    feats.forEach((f, i) => {
      for (let gx = Math.floor(f.bbox[0] / cell); gx <= Math.floor(f.bbox[2] / cell); gx++)
        for (let gy = Math.floor(f.bbox[1] / cell); gy <= Math.floor(f.bbox[3] / cell); gy++) {
          const k = gx + ":" + gy; (grid.get(k) || grid.set(k, []).get(k)).push(i);
        }
    });
    const d = { key, meta, feats, grid, cell };
    cache.set(key, d);
    if (cache.size > 4) cache.delete(cache.keys().next().value);
    return d;
  }
  function villageIn(d, lon, lat) {
    const ids = d.grid.get(Math.floor(lon / d.cell) + ":" + Math.floor(lat / d.cell)) || [];
    for (const i of ids) { const f = d.feats[i], b = f.bbox; if (lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3] && contains(f.geometry, lon, lat)) return f; }
    return null;
  }
  async function locate(lat, lon) {
    const ds = (await districts()).filter(m => lon >= m.bbox[0] && lon <= m.bbox[2] && lat >= m.bbox[1] && lat <= m.bbox[3]);
    for (const m of ds) { const d = await district(m.key), f = villageIn(d, lon, lat); if (f) return { d, f }; }
    return null;
  }

  function norm(s) { return String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); }
  async function search(q, limit = 8) {
    const t = norm(q).split(" ").filter(Boolean);
    if (!t.length) return [];
    const idx = await index(), out = [];
    for (const r of idx) {
      if (!t.every(w => r.s.includes(w))) continue;
      const nm = norm(r.name);
      r._rank = (nm === t.join(" ") ? 0 : nm.startsWith(t[0]) ? 1 : 2) - Math.min(r.pop, 1e6) / 1e7;
      out.push(r);
      if (out.length > 400) break;
    }
    return out.sort((a, b) => a._rank - b._rank).slice(0, limit);
  }

  function importFile(file, onMsg) {
    return new Promise((res, rej) => {
      const w = new Worker("assets/js/village-worker.js");
      w.onmessage = e => {
        const m = e.data; onMsg(m);
        if (m.type === "done") { w.terminate(); districtsCache = indexCache = null; cache.clear(); res(m.info); }
        if (m.type === "error") { w.terminate(); rej(new Error(m.message)); }
      };
      w.onerror = e => { w.terminate(); rej(new Error(e.message || "The import stopped. Try again in a desktop browser.")); };
      w.postMessage({ file });
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
    });
  }
  async function clear() {
    const db = await open();
    const tx = db.transaction(["meta", "districts", "geo"], "readwrite");
    ["meta", "districts", "geo"].forEach(s => tx.objectStore(s).clear());
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    districtsCache = indexCache = null; cache.clear();
  }

  return { info, districts, district, villageIn, locate, search, index, importFile, clear, contains, bboxOf };
})();
