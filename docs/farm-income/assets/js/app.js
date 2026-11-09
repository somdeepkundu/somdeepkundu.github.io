// Farm income, 2013 — page logic.
// Data: data/farm_income_by_state.json, written by mospi-microdata-kit's nss70 recipe.
// Bump APP.version together with sw.js VERSION and package.json whenever a cached file changes.
import { I18N, t, has, fmt, loadLanguages, pickLanguage, setLanguage } from "./i18n.js";
import { h, $, clear } from "./dom.js";
import { drawMap, paintMap } from "./map.js";
import { drawRank } from "./rank.js";

export const APP = { version: "1.0.0" };
const MEASURES = ["net_per_cultivator", "net_per_hh", "pct_cultivating", "pct_loss"];
const MONEY = new Set(["net_per_cultivator", "net_per_hh"]);
const UTS = new Set(["04", "07", "25", "26", "31", "34", "35"]);   // Union Territories in 2013
const RAMP = { green: ["--g1", "--g2", "--g3", "--g4", "--g5"], red: ["--r1", "--r2", "--r3", "--r4", "--r5"] };

const st = { data: null, geo: null, map: null, rows: new Map(), measure: "net_per_cultivator",
             sel: null, unweighted: false, sort: { key: "net", dir: "desc" } };

// ------------------------------------------------------------------ helpers
const india = () => st.rows.get("IN");
const usable = r => r && r.reliability !== "suppressed";
const name = code => t(`state.${code}`);
const shortName = code => (has(`short.${code}`) ? t(`short.${code}`) : name(code));
const val = (r, m = st.measure) => (usable(r) ? r[m].v : null);
const fmtFor = m => (MONEY.has(m) ? fmt.money : v => fmt.pct(v));

/** States shown in the ranking: the 2013 states, with Daman & Diu and Dadra & Nagar Haveli pooled. */
function rankable() {
  return st.data.rows.filter(r => (r.kind === "state" && r.code !== "25" && r.code !== "26") || r.kind === "pooled");
}

function breaks(measure) {
  const vals = rankable().map(r => val(r, measure)).filter(v => v != null).sort((a, b) => a - b);
  if (vals.length < 5) return [];
  const q = p => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  const nice = v => {
    if (!MONEY.has(measure)) return Math.round(v);
    const mag = 10 ** Math.max(2, Math.floor(Math.log10(Math.abs(v) || 1)) - 1);
    return Math.round(v / mag) * mag;
  };
  const out = [];
  for (const p of [0.2, 0.4, 0.6, 0.8]) {
    const b = nice(q(p));
    if (!out.length || b > out[out.length - 1]) out.push(b);
  }
  return out;
}

function classOf(v, bks) { let i = 0; while (i < bks.length && v >= bks[i]) i++; return i; }

function colourFor(measure) {
  const bks = breaks(measure);
  const ramp = measure === "pct_loss" ? RAMP.red : RAMP.green;
  const steps = ramp.slice(ramp.length - (bks.length + 1));
  return {
    bks, steps,
    of(row) {
      const v = val(row, measure);
      if (v == null) return { fill: "var(--none)", caution: false };
      return { fill: `var(${steps[classOf(v, bks)]})`, caution: row.reliability === "caution" };
    },
  };
}

// ------------------------------------------------------------------ hero
function renderHero() {
  const r = india();
  $("dek").textContent = t("hero.dek", { households: fmt.int(r.n_households), villages: fmt.int(r.n_villages) });
  $("lgOutput").textContent = fmt.money(r.output_per_cultivator.v);
  $("lgExpenses").textContent = `− ${fmt.money(r.expenses_per_cultivator.v)}`;
  $("lgNet").textContent = fmt.money(r.net_per_cultivator.v);
  $("lgRange").textContent = t("ledger.range", { lo: fmt.money(r.net_per_cultivator.lo), hi: fmt.money(r.net_per_cultivator.hi) });
  $("lgMonthly").textContent = t("ledger.monthly", { monthly: fmt.money(r.net_per_cultivator.v / 6) });
  $("lgMedian").textContent = t("ledger.median", { median: fmt.money(r.median_net_per_cultivator) });

  const facts = clear($("facts"));
  facts.append(h("li", {}, h("b", { text: fmt.pct(r.pct_cultivating.v) }), t("facts.grew")));
  facts.append(h("li", {}, h("b", { text: fmt.pct(r.pct_loss.v) }), t("facts.loss")));
  const ok = rankable().filter(x => x.reliability === "ok" && x.kind === "state" && !UTS.has(x.code))
    .sort((a, b) => b.net_per_cultivator.v - a.net_per_cultivator.v);
  const top = ok[0], bottom = ok[ok.length - 1];
  if (top && bottom && bottom.net_per_cultivator.v > 0) {
    const ratio = top.net_per_cultivator.v / bottom.net_per_cultivator.v;
    const shown = ratio >= 10 ? fmt.int(ratio) : fmt.dec(ratio, 1);
    facts.append(h("li", {}, h("b", { text: `${shown}×` }),
      t("facts.gap", { top: name(top.code), bottom: name(bottom.code), ratio: shown })));
  }
}

// ------------------------------------------------------------------ explore
function renderMeasures() {
  const box = $("measures");
  box.querySelectorAll("label").forEach(l => l.remove());
  for (const m of MEASURES) {
    const input = h("input", { type: "radio", name: "measure", value: m, checked: m === st.measure,
      onchange: () => { st.measure = m; syncUrl(); renderExplore(); } });
    box.append(h("label", {}, input, h("span", { text: t(`measure.${m}`) })));
  }
}

function legend(colour) {
  const box = clear($("legend"));
  const f = fmtFor(st.measure);
  const keys = h("ul", { class: "keys" });
  colour.steps.forEach((varName, i) => {
    const a = colour.bks[i - 1], b = colour.bks[i];
    const text = i === 0 ? t("legend.under", { v: f(b) })
      : i === colour.steps.length - 1 ? t("legend.over", { v: f(a) })
      : t("legend.between", { a: f(a), b: f(b) });
    keys.append(h("li", {}, h("span", { class: "sw", style: { background: `var(${varName})` } }), text));
  });
  box.append(keys);
  box.append(h("p", { text: t("legend.caution") }), h("p", { text: t("legend.suppressed") }),
    h("p", { text: t("legend.ladakh") }), h("p", { text: t("legend.pooled") }));
}

function rowFor(code) { return st.rows.get(code); }

function tooltip(f, e) {
  const tip = $("tip");
  const row = rowFor(f.code);
  clear(tip);
  const title = f.via ? t("state.ladakh") : name(f.code);
  tip.append(h("b", { text: title }));
  if (f.via) tip.append(h("div", { text: t("tip.ladakh") }));
  if (usable(row)) {
    const m = row[st.measure], fm = fmtFor(st.measure);
    tip.append(h("div", { text: fm(m.v) }), h("div", { text: t("tip.range", { lo: fm(m.lo), hi: fm(m.hi) }) }));
    if (row.reliability === "caution") tip.append(h("div", { text: t("rank.caution") }));
  } else {
    tip.append(h("div", { text: t("tip.suppressed") }));
  }
  if (row) tip.append(h("div", { text: t("tip.sample", { n: fmt.int(row.n_households) }) }));
  tip.hidden = false;
  const pad = 14, r = tip.getBoundingClientRect();
  let x = e.clientX + pad, y = e.clientY + pad;
  if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
  if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
  tip.style.left = `${Math.max(8, x)}px`;
  tip.style.top = `${Math.max(8, y)}px`;
}

function renderExplore() {
  const colour = colourFor(st.measure);
  $("measureNote").textContent = t(`measure.${st.measure}.note`);
  paintMap(st.map, f => colour.of(rowFor(f.code)), st.sel, t("map.label", { measure: t(`measure.${st.measure}`) }));
  legend(colour);
  renderRank();
}

function renderRank() {
  const m = st.measure, fm = fmtFor(m);
  const all = rankable();
  const shown = all.filter(usable).sort((a, b) => b[m].v - a[m].v);
  const unwAvailable = m === "net_per_cultivator";
  $("unweighted").disabled = !unwAvailable;
  $("unweightedNote").hidden = !st.unweighted;
  $("unweightedNote").textContent = unwAvailable ? t("rank.unweighted_note") : t("rank.unweighted_na");
  const rows = shown.map(r => ({
    code: r.code, label: shortName(r.code), v: r[m].v, lo: r[m].lo, hi: r[m].hi,
    caution: r.reliability === "caution", unweighted: unwAvailable ? r.unweighted_net_per_cultivator : null,
    aria: `${name(r.code)}: ${fm(r[m].v)}. ${t("tip.range", { lo: fm(r[m].lo), hi: fm(r[m].hi) })}` +
      (r.reliability === "caution" ? `. ${t("rank.caution")}` : ""),
  }));
  drawRank($("rank"), {
    rows, india: { v: india()[m].v, label: `${t("rank.india")} ${fm(india()[m].v)}` }, format: fm, selected: st.sel,
    showUnweighted: st.unweighted && unwAvailable, onPick: code => select(code, true),
  });
  const few = all.filter(r => !usable(r)).map(r => name(r.code));
  $("tooFew").textContent = few.length ? t("rank.too_few", { names: few.join(", ") }) : "";
}

// ------------------------------------------------------------------ detail
function select(code, fromUser = false) {
  st.sel = code;
  syncUrl();
  renderExplore();
  renderDetail();
  renderTable();
  if (fromUser) {
    $("announce").textContent = t("detail.announce", { state: name(code) });
    if (matchMedia("(max-width: 900px)").matches) $("detail").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderDetail() {
  const body = clear($("detailBody"));
  if (!st.sel) { $("detailTitle").textContent = t("detail.hint"); return; }
  const r = rowFor(st.sel), n = india(), code = st.sel;
  $("detailTitle").textContent = t("detail.title", { state: name(code) });
  if (!usable(r)) {
    body.append(h("p", { class: "detail-notes warn", text: t("detail.suppressed", { state: name(code), cultivating: fmt.int(r.n_cultivating) }) }));
    return;
  }
  const money = fmt.money, pct = v => fmt.pct(v);
  const line = (label, a, b, cls) => h("tr", { class: cls }, h("td", { text: label }), h("td", { text: a }), h("td", { text: b }));
  const range = x => `${money(x.net_per_cultivator.lo)} – ${money(x.net_per_cultivator.hi)}`;
  const table = h("table", { class: "compare" },
    h("thead", {}, h("tr", {}, h("th", { scope: "col", text: t("detail.col.item") }),
      h("th", { scope: "col", text: name(code) }), h("th", { scope: "col", text: t("state.IN") }))),
    h("tbody", {},
      line(t("detail.output"), money(r.output_per_cultivator.v), money(n.output_per_cultivator.v)),
      line(t("detail.expenses"), `− ${money(r.expenses_per_cultivator.v)}`, `− ${money(n.expenses_per_cultivator.v)}`),
      line(t("detail.net"), money(r.net_per_cultivator.v), money(n.net_per_cultivator.v), "total"),
      line(t("detail.range"), range(r), range(n), "minor"),
      line(t("detail.median"), money(r.median_net_per_cultivator), money(n.median_net_per_cultivator), "minor"),
      line(t("detail.grew"), pct(r.pct_cultivating.v), pct(n.pct_cultivating.v)),
      line(t("detail.loss"), pct(r.pct_loss.v), pct(n.pct_loss.v)),
      line(t("detail.per_hh"), money(r.net_per_hh.v), money(n.net_per_hh.v))));
  body.append(h("div", { class: "table-wrap" }, table));
  body.append(h("p", { class: "detail-notes", text: t("detail.sample", { state: name(code),
    households: fmt.int(r.n_households), villages: fmt.int(r.n_villages), cultivating: fmt.int(r.n_cultivating) }) }));
  if (r.reliability === "caution") {
    body.append(h("p", { class: "detail-notes warn", text: t("detail.caution", { state: name(code),
      rse: fmt.pct(r.net_per_cultivator.rse) }) }));
  }
  const btn = h("button", { type: "button", class: "linkbtn", text: t("detail.link", { state: name(code) }) });
  btn.addEventListener("click", () => copy(location.href, btn, t("detail.copied")));
  body.append(btn);
}

// ------------------------------------------------------------------ table
const COLUMNS = [
  { key: "state", get: r => name(r.code), text: true },
  { key: "net", get: r => val(r, "net_per_cultivator"), show: v => fmt.money(v) },
  { key: "range", get: r => (usable(r) ? r.net_per_cultivator.lo : null),
    show: (v, r) => (usable(r) ? `${fmt.money(r.net_per_cultivator.lo)} – ${fmt.money(r.net_per_cultivator.hi)}` : "—") },
  { key: "median", get: r => (usable(r) ? r.median_net_per_cultivator : null), show: v => fmt.money(v) },
  { key: "grew", get: r => val(r, "pct_cultivating"), show: v => fmt.pct(v, 1) },
  { key: "loss", get: r => val(r, "pct_loss"), show: v => fmt.pct(v, 1) },
  { key: "n", get: r => r.n_households, show: v => fmt.int(v) },
  { key: "note", get: r => note(r), text: true },
];

function note(r) {
  if (r.reliability === "suppressed") return t("table.note.suppressed");
  if (r.reliability === "caution") return t("table.note.caution");
  if (r.kind === "pooled") return t("table.note.pooled");
  return "";
}

function renderTable() {
  const head = clear($("thead"));
  for (const c of COLUMNS) {
    const label = t(`table.col.${c.key}`);
    const th = h("th", { scope: "col" });
    if (st.sort.key === c.key) th.setAttribute("aria-sort", st.sort.dir === "asc" ? "ascending" : "descending");
    th.append(h("button", { type: "button", title: t("table.sort", { column: label }), text: label,
      onclick: () => {
        const same = st.sort.key === c.key;
        st.sort = { key: c.key, dir: same ? (st.sort.dir === "asc" ? "desc" : "asc") : c.text ? "asc" : "desc" };
        renderTable();
      } }));
    head.append(th);
  }
  const col = COLUMNS.find(c => c.key === st.sort.key);
  const dir = st.sort.dir === "asc" ? 1 : -1;
  const coll = new Intl.Collator(I18N.locale);
  const rows = st.data.rows.filter(r => r.kind !== "country").slice().sort((a, b) => {
    const x = col.get(a), y = col.get(b);
    if (x == null && y == null) return coll.compare(name(a.code), name(b.code));
    if (x == null) return 1;
    if (y == null) return -1;
    return (col.text ? coll.compare(x, y) : x - y) * dir;
  });
  const body = clear($("tbody"));
  for (const r of [india(), ...rows]) {
    const tr = h("tr", { class: [r.code === "IN" ? "india" : "", r.code === st.sel ? "sel" : ""].join(" ").trim() || null });
    COLUMNS.forEach((c, i) => {
      const v = c.get(r);
      const text = c.show ? c.show(v, r) : v || "";
      const cell = h(i === 0 ? "th" : "td", { scope: i === 0 ? "row" : null, text, class: v == null || !usable(r) ? "muted" : null });
      tr.append(cell);
    });
    body.append(tr);
  }
}

function csvCell(v) {
  if (v == null) return "";
  if (typeof v === "number") return String(Math.round(v * 100) / 100);
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;   // a cell starting like a formula must not run in Excel
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv() {
  const cols = [["code", r => r.code], ["state", r => name(r.code)], ["reliability", r => r.reliability],
    ["households_surveyed", r => r.n_households], ["households_growing_crops_surveyed", r => r.n_cultivating],
    ["net_receipt_per_growing_household_rs", r => r.net_per_cultivator.v], ["ci95_low", r => r.net_per_cultivator.lo],
    ["ci95_high", r => r.net_per_cultivator.hi], ["median_net_receipt_rs", r => r.median_net_per_cultivator],
    ["output_value_rs", r => r.output_per_cultivator.v], ["paid_out_expenses_rs", r => r.expenses_per_cultivator.v],
    ["net_receipt_per_agricultural_household_rs", r => r.net_per_hh.v],
    ["pct_grew_crops", r => r.pct_cultivating.v], ["pct_paid_out_more_than_harvest", r => r.pct_loss.v]];
  const lines = [cols.map(c => c[0]).join(",")];
  for (const r of st.data.rows) lines.push(cols.map(([, get]) => csvCell(get(r))).join(","));
  lines.push("", csvCell(`Source: NSS 70th round Sch. 33 Visit 2, January-June 2013, Rs at 2013 prices. ${t("cite.text")}`));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = h("a", { href: URL.createObjectURL(blob), download: `farm_income_by_state_2013_${I18N.lang}.csv` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ------------------------------------------------------------------ method, status, footer
function renderMethod() {
  const r = india();
  $("methodP1").textContent = t("method.p1", { households: fmt.int(r.n_households), villages: fmt.int(r.n_villages) });
  $("methodP2").textContent = t("method.p2", { millions: fmt.dec(r.est_households / 1e6, 1), crore: fmt.dec(r.est_households / 1e7, 2) });
  const tbl = clear($("checks"));
  tbl.append(h("thead", {}, h("tr", {}, ...["check", "nsso", "ours", "result"].map(k => h("th", { scope: "col", text: t(`method.col.${k}`) })))));
  const tb = h("tbody");
  const show = (key, v) => (key === "output_per_cultivator" ? fmt.rupees(v)
    : key === "sample_households" ? fmt.int(v) : fmt.dec(v, 1));
  const mark = { pass: "✓", warn: "≈", fail: "✗" };
  for (const c of st.data.validation) {
    tb.append(h("tr", {}, h("td", { text: t(`check.${c.key}`) }), h("td", { text: show(c.key, c.expected) }),
      h("td", { text: show(c.key, c.observed) }),
      h("td", {}, h("span", { class: `res ${c.status}`, text: `${mark[c.status]} ${t(`method.result.${c.status}`)}` }))));
  }
  tbl.append(tb);
}

function renderStatus() {
  const el = $("status");
  const status = st.data.status;
  el.hidden = status === "final";
  if (status !== "final") el.textContent = t(status === "demo" ? "status.demo" : "status.unvalidated");
}

function renderFooter() {
  $("generated").textContent = t("footer.generated", { date: fmt.date(st.data.generated_at), tool: st.data.tool.replace(/^mospi-microdata-kit /, "") });
  $("version").textContent = `v${APP.version}`;
  const note = t("footer.translation");
  $("translationNote").hidden = !note || I18N.lang === "en";
  $("translationNote").textContent = note;
}

function renderLangs() {
  const nav = clear($("langs"));
  for (const l of I18N.langs.filter(x => !x.missing)) {
    nav.append(h("button", { type: "button", lang: l.code, "aria-pressed": String(l.code === I18N.lang), text: l.name,
      onclick: async () => { await setLanguage(l.code); syncUrl(); renderAll(); } }));
  }
}

// ------------------------------------------------------------------ theme, url, copy
function themeButton() {
  const btn = $("themeBtn");
  const order = ["auto", "light", "dark"];
  const current = () => document.documentElement.getAttribute("data-theme") || "auto";
  const label = () => { btn.textContent = t(`theme.${current()}`); };
  btn.onclick = () => {
    const next = order[(order.indexOf(current()) + 1) % order.length];
    if (next === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
    try { if (next === "auto") localStorage.removeItem("fi-theme"); else localStorage.setItem("fi-theme", next); } catch (e) { /* private mode */ }
    label();
  };
  label();
}

function syncUrl() {
  const p = new URLSearchParams();
  if (I18N.lang !== "en") p.set("lang", I18N.lang);
  if (st.measure !== MEASURES[0]) p.set("measure", st.measure);
  if (st.sel) p.set("state", st.sel);
  const q = p.toString();
  history.replaceState(null, "", q ? `?${q}` : location.pathname);
}

async function copy(text, btn, done) {
  const before = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = done; }
  catch (e) { prompt("", text); return; }
  setTimeout(() => { btn.textContent = before; }, 1800);
}

function renderAll() {
  document.title = t("meta.title");
  renderLangs(); renderStatus(); renderHero(); renderMeasures(); renderExplore(); renderDetail();
  renderTable(); renderMethod(); renderFooter(); themeButton();
}

// ------------------------------------------------------------------ start
async function start() {
  const status = $("status");
  try {
    await loadLanguages();
    await setLanguage(pickLanguage());
    status.hidden = false; status.textContent = t("status.loading");
    const [data, geo] = await Promise.all([
      fetch("data/farm_income_by_state.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch("assets/map/india-states.json").then(r => r.json()),
    ]);
    if (data.schema !== 1) throw new Error(`Unknown data schema ${data.schema}`);
    st.data = data; st.geo = geo;
    for (const r of data.rows) st.rows.set(r.code, r);
  } catch (e) {
    console.error(e);
    status.hidden = false; status.textContent = t("status.error");
    return;
  }
  const params = new URLSearchParams(location.search);
  if (MEASURES.includes(params.get("measure"))) st.measure = params.get("measure");
  if (st.rows.has(params.get("state"))) st.sel = params.get("state");

  st.map = drawMap($("map"), st.geo, {
    onHover: tooltip,
    onLeave: () => { $("tip").hidden = true; },
    onPick: f => { $("tip").hidden = true; select(f.code, true); },
  });
  $("unweighted").addEventListener("change", e => { st.unweighted = e.target.checked; renderRank(); });
  $("dlCsv").addEventListener("click", downloadCsv);
  $("printBtn").addEventListener("click", () => print());
  $("citeBtn").addEventListener("click", e => copy($("citeText").textContent, e.currentTarget, t("cite.copied")));
  let width = $("rank").clientWidth;
  new ResizeObserver(() => { const w = $("rank").clientWidth; if (Math.abs(w - width) > 8) { width = w; renderRank(); } }).observe($("rank"));
  renderAll();

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(e => console.warn("offline cache not available", e));
  }
}

start();
