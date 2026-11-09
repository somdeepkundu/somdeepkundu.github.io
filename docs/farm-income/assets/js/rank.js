// States ranked: a dot for the estimate and a line for its 95% range, with the All-India
// value as a reference line. Each row is a focusable button; arrow keys move between rows.
import { s, clear } from "./dom.js";

const ROW = 27, TOP = 34, PAD_R = 14;

function niceTicks(lo, hi, count = 4) {
  const span = hi - lo || 1;
  const raw = span / count, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => span / st <= count + 0.5) || mag * 10;
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

/**
 * rows: [{code, label, v, lo, hi, caution, unweighted, aria}]  (already sorted)
 * india: {v, label}
 */
export function drawRank(container, { rows, india, format, selected, showUnweighted, onPick }) {
  const width = Math.max(280, container.clientWidth || 400);
  const labelW = Math.min(170, Math.round(width * 0.4));
  const x0 = labelW + 10, x1 = width - PAD_R;
  const values = rows.flatMap(r => [r.lo, r.hi, r.v, showUnweighted ? r.unweighted : null]).filter(v => v != null);
  values.push(india.v);
  let lo = Math.min(0, ...values), hi = Math.max(...values);
  const ticks = niceTicks(lo, hi);
  lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]);
  const x = v => x0 + ((v - lo) / (hi - lo || 1)) * (x1 - x0);
  const height = TOP + rows.length * ROW + 6;

  const svg = s("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "list" });
  const grid = s("g", { "aria-hidden": "true" });
  for (const tv of ticks) {
    grid.append(s("line", { x1: x(tv), x2: x(tv), y1: TOP - 6, y2: height, class: "grid" }),
      s("text", { x: x(tv), y: TOP - 12, "text-anchor": "middle", class: "axis", text: format(tv) }));
  }
  svg.append(grid);

  const items = [];
  rows.forEach((r, i) => {
    const y = TOP + i * ROW + ROW / 2;
    const g = s("g", { class: `row${r.code === selected ? " sel" : ""}`, role: "listitem", tabindex: 0,
      "aria-label": r.aria, "data-code": r.code });
    g.append(s("rect", { x: 0, y: y - ROW / 2 + 1, width, height: ROW - 2, rx: 4, class: "hit" }));
    g.append(s("text", { x: labelW, y: y + 4.5, "text-anchor": "end", class: "lab", text: r.label }));
    g.append(s("line", { x1: x(r.lo), x2: x(r.hi), y1: y, y2: y, class: `ci${r.caution ? " caution" : ""}` }));
    if (showUnweighted && r.unweighted != null) g.append(s("circle", { cx: x(r.unweighted), cy: y, r: 4.5, class: "unw" }));
    g.append(s("circle", { cx: x(r.v), cy: y, r: 5, class: `dot${r.caution ? " caution" : ""}` }));
    g.addEventListener("click", () => onPick(r.code));
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(r.code); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = items[i + (e.key === "ArrowDown" ? 1 : -1)];
        if (next) next.focus();
      }
    });
    items.push(g);
    svg.append(g);
  });

  const ix = x(india.v);
  svg.append(s("line", { x1: ix, x2: ix, y1: TOP - 4, y2: height, class: "india", "aria-hidden": "true" }));
  const anchor = ix > width - 90 ? "end" : ix < x0 + 60 ? "start" : "middle";
  svg.append(s("text", { x: ix, y: 11, "text-anchor": anchor, class: "india-lab", text: india.label }));

  clear(container).append(svg);
  return items;
}
