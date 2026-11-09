// The choropleth. Built once from the pre-projected geometry (tools/farm-income/build_map.mjs),
// then recoloured. Fills are CSS variables, so switching light/dark recolours without a redraw.
import { s, clear } from "./dom.js";

export function drawMap(container, geo, { onHover, onLeave, onPick }) {
  const [, , w, hgt] = geo.viewBox;
  const svg = s("svg", { viewBox: `0 0 ${w} ${hgt}`, role: "img" });
  const defs = s("defs", {},
    s("pattern", { id: "hatch", width: 7, height: 7, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
      s("line", { x1: 0, y1: 0, x2: 0, y2: 7, class: "hatch-line" })));
  const base = s("g", {}), hatch = s("g", { class: "hatch-layer" }), marks = s("g", {}), top = s("g", { class: "hatch-layer" });
  svg.append(defs, base, hatch, marks, top);

  const shapes = [];
  for (const f of geo.features) {
    const path = s("path", { d: f.d, class: "st" });
    const over = s("path", { d: f.d, fill: "url(#hatch)", visibility: "hidden" });
    const item = { f, path, over, marker: null };
    if (f.small) {
      item.marker = s("circle", { cx: f.cx, cy: f.cy, r: 7, class: "mk" });
      marks.append(item.marker);
    }
    for (const el of [path, item.marker].filter(Boolean)) {
      el.addEventListener("pointermove", e => { if (e.pointerType === "mouse") onHover(f, e); });
      el.addEventListener("pointerleave", () => onLeave());
      el.addEventListener("click", () => onPick(f));
    }
    base.append(path);
    hatch.append(over);
    shapes.push(item);
  }
  clear(container).append(svg);
  return { svg, shapes, top };
}

/** colour(f) -> {fill, caution, label}; selected = NSS code or null */
export function paintMap(map, colour, selected, label) {
  map.svg.setAttribute("aria-label", label);
  map.svg.classList.toggle("dim", Boolean(selected));
  map.top.replaceChildren();
  for (const { f, path, over, marker } of map.shapes) {
    const c = colour(f);
    path.style.fill = c.fill;
    over.setAttribute("visibility", c.caution ? "visible" : "hidden");
    const sel = selected !== null && f.code === selected;
    path.classList.toggle("sel", sel);
    if (marker) { marker.style.fill = c.fill; marker.classList.toggle("sel", sel); }
    if (sel) {
      // SVG has no z-index: draw the selected outline again on top
      map.top.append(s("path", { d: f.d, fill: "none", stroke: "currentColor", "stroke-width": 2.4,
        "stroke-linejoin": "round", class: "sel-outline" }));
    }
  }
}
