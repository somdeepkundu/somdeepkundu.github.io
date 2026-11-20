/* Gram Suvidha Map: village import worker.
   Reads the village boundary file the viewer chose (the release .zip or the .geojson inside it),
   streams it line by line (mapshaper writes one village per line), splits it by district and
   stores everything in this browser's IndexedDB. Nothing is uploaded anywhere. */
"use strict";
importScripts("../../vendor/fflate/fflate.js");

const DB = "gram-suvidha", VER = 1;
const REQUIRED = ["state_lgd", "state", "dist_lgd", "district", "vill_lgd", "vill_name"];

function openDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => {
      const db = r.result;
      for (const s of ["meta", "districts", "geo"]) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "key" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const done = tx => new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = tx.onabort = () => rej(tx.error); });

function bboxOf(g, b) {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  for (const p of polys) for (const [x, y] of p[0]) {
    if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
  }
  return b;
}

self.onmessage = async e => {
  const file = e.data.file;
  const total = file.size, isZip = /\.zip$/i.test(file.name);
  const buckets = new Map(), meta = new Map(), index = [];
  let n = 0, skipped = 0, read = 0, tail = "", lastPost = 0, checked = false;
  const dec = new TextDecoder();

  const post = force => {
    const now = Date.now();
    if (force || now - lastPost > 200) { lastPost = now; self.postMessage({ type: "progress", read, total, n }); }
  };
  const line = raw => {
    let s = raw.trim();
    if (!s.startsWith('{"type":"Feature"')) return;
    if (s.endsWith(",")) s = s.slice(0, -1);
    let f;
    try { f = JSON.parse(s); } catch { skipped++; return; }
    const p = f.properties || {}, g = f.geometry;
    if (!checked) {
      const miss = REQUIRED.filter(k => !(k in p));
      if (miss.length) throw new Error("This file is missing the columns " + miss.join(", ") + ". Use india_villages_2021_22states.geojson.zip from the loni-private-data release.");
      checked = true;
    }
    if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) { skipped++; return; }
    // state + district code + name: two placeholder districts (Mirpur, Muzaffarabad) share LGD code 999
    const key = p.state_lgd + "-" + p.dist_lgd + "-" + String(p.district || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let m = meta.get(key);
    if (!m) {
      m = { key, state: p.state, district: p.district, state_lgd: p.state_lgd, dist_lgd: p.dist_lgd, n: 0, pop: 0, hh: 0, rural: 0, urban: 0, bbox: [180, 90, -180, -90] };
      meta.set(key, m); buckets.set(key, []);
    }
    const b = bboxOf(g, [180, 90, -180, -90]);
    m.n++; m.pop += +p.pop || 0; m.hh += +p.hh || 0; p.type === "Urban" ? m.urban++ : m.rural++;
    m.bbox = [Math.min(m.bbox[0], b[0]), Math.min(m.bbox[1], b[1]), Math.max(m.bbox[2], b[2]), Math.max(m.bbox[3], b[3])];
    buckets.get(key).push(s);
    index.push([p.vill_lgd, p.vill_name || p.name || "", p.subdist || "", p.district || "", p.state || "", key,
                +((b[0] + b[2]) / 2).toFixed(5), +((b[1] + b[3]) / 2).toFixed(5), +p.pop || 0]);
    n++;
  };
  const text = (chunk, final) => {
    tail += dec.decode(chunk, { stream: !final });
    const parts = tail.split("\n");
    tail = final ? "" : parts.pop();
    for (const l of parts) line(l);
  };

  try {
    const reader = file.stream().getReader();
    let found = !isZip;
    let uz = null;
    if (isZip) {
      uz = new fflate.Unzip(entry => {
        if (found || !/\.(geo)?json$/i.test(entry.name)) return;
        found = true;
        entry.ondata = (err, chunk, final) => { if (err) throw err; text(chunk, final); };
        entry.start();
      });
      uz.register(fflate.UnzipInflate);
    }
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) { if (uz) uz.push(new Uint8Array(0), true); else text(new Uint8Array(0), true); break; }
      read += value.length;
      if (uz) uz.push(value, false); else text(value, false);
      post(false);
    }
    if (!found) throw new Error("No .geojson file was found inside this zip.");
    if (!n) throw new Error("No villages were found. The file must have one village per line, as mapshaper writes it.");
    post(true);
    self.postMessage({ type: "saving" });

    const db = await openDb();
    let tx = db.transaction(["meta", "districts", "geo"], "readwrite");
    ["meta", "districts", "geo"].forEach(s => tx.objectStore(s).clear());
    await done(tx);
    const keys = [...buckets.keys()];
    for (let i = 0; i < keys.length; i += 25) {
      tx = db.transaction(["districts", "geo"], "readwrite");
      for (const k of keys.slice(i, i + 25)) {
        tx.objectStore("districts").put(meta.get(k));
        tx.objectStore("geo").put({ key: k, text: "[" + buckets.get(k).join(",") + "]" });
        buckets.delete(k);
      }
      await done(tx);
      self.postMessage({ type: "saving", part: Math.min(i + 25, keys.length), of: keys.length });
    }
    const states = new Set([...meta.values()].map(m => m.state));
    const info = { key: "info", file: file.name, bytes: total, villages: n, skipped, districts: meta.size, states: states.size, imported: new Date().toISOString(), version: 1 };
    tx = db.transaction("meta", "readwrite");
    tx.objectStore("meta").put(info);
    tx.objectStore("meta").put({ key: "index", text: JSON.stringify(index) });
    await done(tx);
    db.close();
    self.postMessage({ type: "done", info });
  } catch (err) {
    self.postMessage({ type: "error", message: err && err.message ? err.message : String(err) });
  }
};
