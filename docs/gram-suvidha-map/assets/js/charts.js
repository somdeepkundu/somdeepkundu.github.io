/* Gram Suvidha Map: small interactive SVG charts in the seaborn "darkgrid" look
   (grey panel, white grid, no spines, the "deep" palette). No library; colours come from CSS tokens. */
"use strict";
const Sns = (() => {
  const DEEP = ["#4C72B0", "#DD8452", "#55A868", "#C44E52", "#8172B3", "#937860", "#DA8BC3", "#8C8C8C", "#CCB974", "#64B5CD"];
  const NS = "http://www.w3.org/2000/svg";
  const W = 380, PAD = { l: 44, r: 12, t: 10, b: 34 };
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fmt = n => n >= 1e5 ? (n / 1e5).toFixed(n >= 1e6 ? 0 : 1).replace(/\.0$/, "") + " lakh" : Math.round(n).toLocaleString("en-IN");
  const short = v => v >= 1e5 ? (v / 1e5) + "L" : v >= 1e3 ? (v / 1e3) + "k" : String(v);

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function frame(host, H, label) {
    host.replaceChildren();
    host.classList.add("sns");
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": label });
    host.appendChild(svg);
    const tip = document.createElement("div"); tip.className = "sns-tip"; tip.hidden = true; host.appendChild(tip);
    const t = { bg: css("--sns-bg"), grid: css("--sns-grid"), ink: css("--sns-ink"), muted: css("--muted") };
    el("rect", { x: PAD.l, y: PAD.t, width: W - PAD.l - PAD.r, height: H - PAD.t - PAD.b, fill: t.bg }, svg);
    return { svg, tip, t, x0: PAD.l, x1: W - PAD.r, y0: H - PAD.b, y1: PAD.t, H };
  }
  function showTip(f, html, evt) {
    f.tip.innerHTML = html; f.tip.hidden = false;
    const r = f.tip.parentElement.getBoundingClientRect(), x = evt.clientX - r.left, y = evt.clientY - r.top;
    const w = f.tip.offsetWidth;
    f.tip.style.left = Math.max(4, Math.min(x - w / 2, r.width - w - 4)) + "px";
    f.tip.style.top = Math.max(0, y - f.tip.offsetHeight - 12) + "px";
  }
  const hideTip = f => { f.tip.hidden = true; };
  function niceLinear(max, n = 4) {
    const raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw || 1))), m = raw / p;
    const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p, out = [];
    for (let v = 0; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function gridX(f, ticks, sx, label) {
    ticks.forEach(v => {
      const x = sx(v);
      el("line", { x1: x, x2: x, y1: f.y1, y2: f.y0, stroke: f.t.grid, "stroke-width": 1 }, f.svg);
      el("text", { x, y: f.y0 + 14, "text-anchor": "middle", class: "sns-tick", fill: f.t.ink }, f.svg).textContent = label(v);
    });
  }
  function gridY(f, ticks, sy, label) {
    ticks.forEach(v => {
      const y = sy(v);
      el("line", { x1: f.x0, x2: f.x1, y1: y, y2: y, stroke: f.t.grid, "stroke-width": 1 }, f.svg);
      el("text", { x: f.x0 - 6, y: y + 3.5, "text-anchor": "end", class: "sns-tick", fill: f.t.ink }, f.svg).textContent = label(v);
    });
  }
  function axisTitles(f, xt, yt) {
    if (xt) el("text", { x: (f.x0 + f.x1) / 2, y: f.H - 4, "text-anchor": "middle", class: "sns-axis", fill: f.t.ink }, f.svg).textContent = xt;
    if (yt) el("text", { x: 10, y: (f.y0 + f.y1) / 2, transform: `rotate(-90 10 ${(f.y0 + f.y1) / 2})`, "text-anchor": "middle", class: "sns-axis", fill: f.t.ink }, f.svg).textContent = yt;
  }
  const logTicks = (lo, hi) => { const o = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) o.push(k); return o; };

  /* histplot(log10 values, kde=True) with a marker for the selected village. Bars are hoverable and clickable. */
  function histKde(host, o) {
    const vals = o.values.filter(v => isFinite(v));
    const f = frame(host, 210, o.label || "Histogram");
    if (vals.length < 3) { el("text", { x: W / 2, y: 105, "text-anchor": "middle", fill: f.t.muted, class: "sns-tick" }, f.svg).textContent = "Too few villages to draw"; return; }
    let lo = Math.min(...vals), hi = Math.max(...vals);
    lo = Math.floor(lo * 4) / 4; hi = Math.ceil(hi * 4) / 4 + 1e-9;
    const nb = Math.min(28, Math.max(10, Math.round(Math.sqrt(vals.length)))), bw = (hi - lo) / nb;
    const counts = new Array(nb).fill(0);
    vals.forEach(v => counts[Math.min(nb - 1, Math.floor((v - lo) / bw))]++);
    // Gaussian KDE, Scott's bandwidth (seaborn's default)
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (vals.length - 1)) || 0.1;
    const h = sd * Math.pow(vals.length, -0.2), G = 140, kde = [];
    for (let i = 0; i <= G; i++) {
      const x = lo + (hi - lo) * i / G; let s = 0;
      for (const v of vals) { const z = (x - v) / h; s += Math.exp(-0.5 * z * z); }
      kde.push([x, s / (vals.length * h * Math.sqrt(2 * Math.PI)) * vals.length * bw]);
    }
    const ymax = Math.max(...counts, ...kde.map(k => k[1])) * 1.08;
    const sx = v => f.x0 + (v - lo) / (hi - lo) * (f.x1 - f.x0), sy = v => f.y0 - v / ymax * (f.y0 - f.y1);
    gridX(f, logTicks(lo, hi), sx, k => short(Math.pow(10, k)));
    gridY(f, niceLinear(ymax).filter(v => v < ymax), sy, v => v);
    const col = o.color || DEEP[0];
    let active = o.activeBin ?? null;
    const bars = counts.map((c, i) => {
      const r = el("rect", { x: sx(lo + i * bw) + 0.5, y: sy(c), width: Math.max(0, sx(lo + (i + 1) * bw) - sx(lo + i * bw) - 1), height: f.y0 - sy(c),
        fill: col, "fill-opacity": active === null || active === i ? 0.62 : 0.2, stroke: f.t.bg, "stroke-width": 0.8, class: "sns-hit", tabindex: c ? 0 : -1 }, f.svg);
      const a = Math.pow(10, lo + i * bw), b = Math.pow(10, lo + (i + 1) * bw);
      const html = `<b>${fmt(a)}–${fmt(b)}</b> ${o.unit || ""}<br>${c} ${c === 1 ? "village" : "villages"}`;
      r.addEventListener("pointermove", e => showTip(f, html, e));
      r.addEventListener("pointerleave", () => hideTip(f));
      const pick = () => { active = active === i ? null : i; bars.forEach((x, j) => x.setAttribute("fill-opacity", active === null || active === j ? 0.62 : 0.2)); o.onBin && o.onBin(active === null ? null : [lo + i * bw, lo + (i + 1) * bw], active); };
      r.addEventListener("click", pick);
      r.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      return r;
    });
    el("path", { d: "M" + kde.map(([x, y]) => sx(x).toFixed(1) + "," + sy(y).toFixed(1)).join("L"), fill: "none", stroke: col, "stroke-width": 2, "pointer-events": "none" }, f.svg);
    if (o.marker != null && isFinite(o.marker)) {
      const x = sx(Math.max(lo, Math.min(hi, o.marker))), mc = css("--sns-mark");
      el("line", { x1: x, x2: x, y1: f.y1, y2: f.y0, stroke: mc, "stroke-width": 2, "stroke-dasharray": "4 3", "pointer-events": "none" }, f.svg);
      const right = x < (f.x0 + f.x1) / 2;
      el("text", { x: x + (right ? 5 : -5), y: f.y1 + 12, "text-anchor": right ? "start" : "end", class: "sns-mark", fill: mc, "pointer-events": "none" }, f.svg).textContent = o.markerLabel || "";
    }
    axisTitles(f, o.xTitle, "Villages");
  }

  /* scatterplot(log x, log y, hue) — hover links to the map, click selects */
  function scatter(host, o) {
    const pts = o.points.filter(p => p.x > 0 && p.y > 0);
    const f = frame(host, 250, o.label || "Scatter");
    if (pts.length < 2) { el("text", { x: W / 2, y: 120, "text-anchor": "middle", fill: f.t.muted, class: "sns-tick" }, f.svg).textContent = "Too few villages to draw"; return; }
    const lx = pts.map(p => Math.log10(p.x)), ly = pts.map(p => Math.log10(p.y));
    const [xl, xh] = [Math.floor(Math.min(...lx)), Math.ceil(Math.max(...lx))], [yl, yh] = [Math.floor(Math.min(...ly)), Math.ceil(Math.max(...ly))];
    const sx = v => f.x0 + 6 + (v - xl) / (xh - xl || 1) * (f.x1 - f.x0 - 12), sy = v => f.y0 - 6 - (v - yl) / (yh - yl || 1) * (f.y0 - f.y1 - 12);
    gridX(f, logTicks(xl, xh), sx, k => { const v = Math.pow(10, k); return v < 1 ? String(+v.toFixed(3)) : short(v); });
    gridY(f, logTicks(yl, yh), sy, k => short(Math.pow(10, k)));
    const hues = o.hues || {}, hk = Object.keys(hues);
    const g = el("g", {}, f.svg);
    let sel = null;
    pts.forEach((p, i) => {
      const isSel = p.id === o.selectedId;
      const c = el("circle", { cx: sx(lx[i]), cy: sy(ly[i]), r: isSel ? 6 : 3.4, fill: hues[p.hue] || DEEP[0], "fill-opacity": isSel ? 1 : 0.62,
        stroke: isSel ? css("--sns-mark") : f.t.bg, "stroke-width": isSel ? 2.4 : 0.6, class: "sns-hit" }, g);
      if (isSel) sel = c;
      c.addEventListener("pointermove", e => { showTip(f, o.tip(p), e); o.onHover && o.onHover(p.id); });
      c.addEventListener("pointerleave", () => { hideTip(f); o.onHover && o.onHover(null); });
      c.addEventListener("click", () => o.onClick && o.onClick(p.id));
    });
    if (sel) g.appendChild(sel);   // draw the selected village on top
    if (hk.length > 1) {
      const lg = el("g", { transform: `translate(${f.x0 + 8},${f.y1 + 8})`, "pointer-events": "none" }, f.svg);
      el("rect", { x: -4, y: -4, width: 78, height: hk.length * 15 + 4, rx: 3, fill: f.t.bg, "fill-opacity": 0.85, stroke: f.t.grid }, lg);
      hk.forEach((k, i) => {
        el("circle", { cx: 4, cy: 5 + i * 15, r: 4, fill: hues[k] }, lg);
        el("text", { x: 13, y: 9 + i * 15, class: "sns-tick", fill: f.t.ink }, lg).textContent = k;
      });
    }
    axisTitles(f, o.xTitle, o.yTitle);
  }

  /* barplot(orient="h") with value labels */
  function barh(host, o) {
    const rows = o.rows, rh = 21, H = PAD.t + rows.length * rh + 30;
    const f = frame(host, H, o.label || "Bar chart");
    const lw = o.labelWidth || 128, x0 = lw, max = o.max || Math.max(1, ...rows.map(r => r.value));
    f.svg.querySelector("rect").setAttribute("x", x0); f.svg.querySelector("rect").setAttribute("width", W - PAD.r - x0);
    const sx = v => x0 + v / max * (W - PAD.r - x0 - 34);
    const ticks = o.ticks || niceLinear(max, 4);
    ticks.forEach(v => { const x = sx(v); el("line", { x1: x, x2: x, y1: f.y1, y2: H - 30 + 4, stroke: f.t.grid }, f.svg);
      el("text", { x, y: H - 12, "text-anchor": "middle", class: "sns-tick", fill: f.t.ink }, f.svg).textContent = (o.tickFmt || String)(v); });
    rows.forEach((r, i) => {
      const y = PAD.t + i * rh + 3;
      el("text", { x: x0 - 6, y: y + 11, "text-anchor": "end", class: "sns-tick", fill: f.t.ink }, f.svg).textContent = r.label;
      const b = el("rect", { x: x0, y, width: Math.max(r.value ? 1.5 : 0, sx(r.value) - x0), height: rh - 7, fill: r.color || DEEP[i % DEEP.length], "fill-opacity": 0.85, class: r.tip ? "sns-hit" : "" }, f.svg);
      el("text", { x: sx(r.value) + 4, y: y + 11, class: "sns-val", fill: f.t.ink }, f.svg).textContent = r.text ?? r.value;
      if (r.tip) { b.addEventListener("pointermove", e => showTip(f, r.tip, e)); b.addEventListener("pointerleave", () => hideTip(f)); }
    });
  }

  return { histKde, scatter, barh, DEEP, fmt };
})();
