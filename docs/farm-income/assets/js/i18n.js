// Languages: each lives in assets/i18n/<code>.json with the same keys as en.json.
// A missing key falls back to English, so a partial translation never shows a blank.
// To add a language: put its file next to en.json and add a line to languages.json.

const STORE = "fi-lang";
export const I18N = { lang: "en", locale: "en-IN", dict: {}, en: {}, langs: [] };

async function getJSON(url) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

export async function loadLanguages() {
  I18N.langs = await getJSON("assets/i18n/languages.json");
  I18N.en = await getJSON("assets/i18n/en.json");
}

export function pickLanguage() {
  const known = new Set(I18N.langs.map(l => l.code));
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (fromUrl && known.has(fromUrl)) return fromUrl;
  try { const saved = localStorage.getItem(STORE); if (saved && known.has(saved)) return saved; } catch (e) { /* private mode */ }
  for (const l of navigator.languages || [navigator.language || "en"]) {
    const code = String(l).toLowerCase().split("-")[0];
    if (known.has(code)) return code;
  }
  return "en";
}

/** Switch language. Returns the code actually used (English if the file is missing). */
export async function setLanguage(code) {
  const meta = I18N.langs.find(l => l.code === code) || I18N.langs[0];
  let dict = I18N.en;
  if (meta.code !== "en") {
    try { dict = await getJSON(`assets/i18n/${meta.file}`); }
    catch (e) { console.warn(`Translation ${meta.file} missing; using English.`, e); meta.missing = true; return setLanguage("en"); }
  }
  I18N.lang = meta.code;
  I18N.locale = meta.locale;
  I18N.dict = dict;
  document.documentElement.lang = meta.code;
  try { localStorage.setItem(STORE, meta.code); } catch (e) { /* private mode */ }
  applyStatic();
  return meta.code;
}

export function has(key) { return Boolean(I18N.dict[key] || I18N.en[key]); }

export function t(key, vars) {
  let s = I18N.dict[key] || I18N.en[key];
  if (s === undefined || s === null) { console.warn("missing string", key); s = key; }
  if (vars) s = s.replace(/\{([\w+]+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}

export function applyStatic(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const n = el.dataset.n;
    el.textContent = t(el.dataset.i18n, n ? { n: fmt.int(+n) } : undefined);
  });
  root.querySelectorAll("[data-i18n-attr]").forEach(el => {
    for (const pair of el.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split(":");
      el.setAttribute(attr, t(key));
    }
  });
}

const cache = new Map();
function nf(opts) {
  const k = I18N.locale + JSON.stringify(opts);
  if (!cache.has(k)) cache.set(k, new Intl.NumberFormat(I18N.locale, opts));
  return cache.get(k);
}
const minus = s => s.replace(/^-/, "−").replace(/^(\D*)-/, "$1−");

/** Survey estimates are not precise to the rupee: amounts are rounded to ₹100 (₹10 below ₹1,000). */
export function roundMoney(v) {
  const step = Math.abs(v) >= 1000 ? 100 : 10;
  return Math.round(v / step) * step;
}

export const fmt = {
  money: v => (v == null || Number.isNaN(v) ? "—" :
    minus(nf({ style: "currency", currency: "INR", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(roundMoney(v)))),
  rupees: v => (v == null || Number.isNaN(v) ? "—" :
    minus(nf({ style: "currency", currency: "INR", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(v))),
  pct: (v, digits = 0) => (v == null || Number.isNaN(v) ? "—" :
    nf({ style: "percent", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v / 100)),
  int: v => (v == null || Number.isNaN(v) ? "—" : nf({ maximumFractionDigits: 0 }).format(v)),
  dec: (v, digits = 1) => (v == null || Number.isNaN(v) ? "—" :
    nf({ maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v)),
  date: iso => new Intl.DateTimeFormat(I18N.locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)),
};
