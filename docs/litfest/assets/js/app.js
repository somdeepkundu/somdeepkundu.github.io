/*
 * LitFest Companion
 * Live programme + interactive campus map. Plain JavaScript, no build step, no dependencies,
 * so it runs from GitHub Pages, any static host, or straight from disk (file://).
 *
 * Reads window.LITFEST_PROGRAMME (data/programme.js) and window.LITFEST_CAMPUS (data/campus.js).
 * See docs/ARCHITECTURE.md for how the pieces fit together.
 */
(function () {
  "use strict";

  var VERSION = "1.0.0";
  var P = window.LITFEST_PROGRAMME;
  var C = window.LITFEST_CAMPUS;
  var ENV = window.LITFEST_ENV || "web"; // "web" | "offline" | "artifact"
  var SVGNS = "http://www.w3.org/2000/svg";
  var SNAP = 5; // minutes

  if (!P || !C) {
    document.body.innerHTML = '<p style="padding:24px;font-family:system-ui">The programme data did not load. Check that data/programme.js and data/campus.js are next to index.html.</p>';
    return;
  }

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
  /* ------------------------------------------------------------------ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function toMin(hhmm) { var a = hhmm.split(":"); return (+a[0]) * 60 + (+a[1]); }
  function fmt(m) {
    m = Math.round(m);
    var h = Math.floor(m / 60) % 24, mm = m % 60;
    return (h % 12 || 12) + ":" + pad(mm) + " " + (h >= 12 ? "PM" : "AM");
  }
  function fmtRange(a, b) {
    var sa = fmt(a), sb = fmt(b);
    if (sa.slice(-2) === sb.slice(-2)) sa = sa.slice(0, -3);
    return sa + "\u2013" + sb;
  }
  function dur(m) {
    var h = Math.floor(m / 60), r = m % 60;
    if (!h) return r + " min";
    return h + " hr" + (r ? " " + r + " min" : "");
  }
  function relIn(m) { return "in " + dur(Math.max(1, Math.round(m))); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ICONS = {
    bookmark: '<path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-4-6 4V4.5a1 1 0 0 1 1-1z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    fit: '<path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>',
    access: '<circle cx="12.5" cy="4.2" r="1.7"/><path d="M11.5 7.5v6h5.5l2.5 5.5"/><path d="M8.6 10.6a5.6 5.6 0 1 0 7.6 7.2"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    gate: '<path d="M4 20V10a8 8 0 0 1 16 0v10"/><path d="M8.5 20v-8M12 20V9M15.5 20v-8M3 20h18"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    expand: '<path d="M4 14v6h6M20 10V4h-6M4 20l6.5-6.5M20 4l-6.5 6.5"/>',
    shrink: '<path d="M10 20v-6H4M14 4v6h6M4 20l6-6M20 4l-6 6"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.2"/>',
    door: '<path d="M6 21V4.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1V21M3.5 21h17"/><path d="M14.5 12.5v.4"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3A4.5 4.5 0 0 0 13 4.6l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
    spot: '<path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z"/><path d="M12 8v5M9.5 10.5h5"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    hands: '<path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11M10 10.5V5a1.5 1.5 0 0 1 3 0v5.5M13 10.5V6.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6 7-2.6 0-4.2-1.4-5.4-3.6L3.3 14a1.4 1.4 0 0 1 2.3-1.5L7 14.5"/>',
    calm: '<path d="M3 20 12 5l9 15z"/><path d="M9.5 20 12 15.5l2.5 4.5"/>',
    aid: '<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5h6v2M12 10.5v5.5M9.2 13.2h5.6"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="m9 21 2.5-6.5L14 17v4M8 12l2.5-4.5 4 1 2 3.5M10.5 7.5 9 14"/>'
  };
  function icon(name, cls) {
    return '<svg class="i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }
  function hydrateIcons(root) {
    $$("[data-icon]", root).forEach(function (el) {
      var tmp = document.createElement("span");
      tmp.innerHTML = icon(el.getAttribute("data-icon"), el.className);
      el.replaceWith(tmp.firstChild);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Data preparation                                                    */
  /* ------------------------------------------------------------------ */
  var VENUES = {};
  C.venues.forEach(function (v) { VENUES[v.id] = v; });

  var DAYS = P.days.map(function (d) {
    var sessions = d.sessions.map(function (s) {
      var v = VENUES[s.venue] || {};
      var o = Object.assign({}, s);
      o.s = toMin(s.start); o.e = toMin(s.end);
      o.v = v;
      o.hay = norm([s.title, s.subtitle, s.overline, s.people, s.chair, s.kind, v.name, v.place].concat((s.categories || []).map(function (c) { return P.categories[c] || c; })).join(" "));
      return o;
    }).sort(function (a, b) { return a.s - b.s || a.e - b.e || a.title.localeCompare(b.title); });
    var lanes = [];
    sessions.forEach(function (s) { if (lanes.indexOf(s.venue) < 0) lanes.push(s.venue); });
    var order = C.venues.map(function (v) { return v.id; });
    lanes.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    return {
      date: d.date, label: d.label, short: d.short || d.label,
      w0: toMin(d.window.start), w1: toMin(d.window.end),
      sessions: sessions, lanes: lanes,
      byId: sessions.reduce(function (m, s) { m[s.id] = s; return m; }, {})
    };
  });

  /* ------------------------------------------------------------------ */
  /* Clock (always Asia/Kolkata, whatever the device's time zone)        */
  /* ------------------------------------------------------------------ */
  var DTF = new Intl.DateTimeFormat("en-GB", { timeZone: P.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  var demo = null; // ?demo=2026-10-25T15:10 or ?demo=15:10 pretends it is that moment, then runs on
  (function () {
    try {
      var q = new URLSearchParams(location.search).get("demo");
      if (!q) return;
      var m = q.match(/^(?:(\d{4}-\d{2}-\d{2})T)?(\d{1,2}):(\d{2})$/);
      if (m) demo = { date: m[1] || P.days[0].date, min: (+m[2]) * 60 + (+m[3]), t0: Date.now() };
    } catch (e) { /* no URL access */ }
  })();
  function now() {
    if (demo) { var el = (Date.now() - demo.t0) / 60000; return { date: demo.date, min: demo.min + el }; }
    var p = {};
    DTF.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { date: p.year + "-" + p.month + "-" + p.day, min: (+p.hour) * 60 + (+p.minute) + (+p.second) / 60 };
  }

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  var S = {
    day: 0,
    t: 0,              // playhead, minutes since midnight
    follow: false,     // playhead tracks the real clock
    selected: null,    // session id
    venue: null,       // venue filter id
    q: "", cat: null, isl: false,
    tab: "programme",
    from: store("lf-from") || "auto", // "auto" | "g1" | "g2" | "g3" | "me" | "spot"
    spot: null,
    picking: false,
    amen: store("lf-amen") !== "0",
    access: store("lf-access") === "1",
    plan: {},
    mapBig: false
  };
  (function pickDay() {
    var n = now();
    DAYS.forEach(function (d, i) { if (d.date === n.date) S.day = i; });
  })();
  function D() { return DAYS[S.day]; }
  function planKey() { return "lf-plan-" + D().date; }
  function loadPlan() {
    S.plan = {};
    try { (JSON.parse(store(planKey()) || "[]") || []).forEach(function (id) { if (D().byId[id]) S.plan[id] = true; }); } catch (e) {}
  }
  function savePlan() { store(planKey(), JSON.stringify(Object.keys(S.plan))); }
  function planList() { return D().sessions.filter(function (s) { return S.plan[s.id]; }); }
  loadPlan();
  try { var sp = JSON.parse(store("lf-spot") || "null"); if (sp && sp.length === 2) S.spot = sp; } catch (e) {}
  if (S.from === "spot" && !S.spot) S.from = "auto";

  function isFestivalDay() { return now().date === D().date; }
  function liveMinute() { var d = D(); return clamp(now().min, d.w0, d.w1); }
  function busiestMinute() {
    var d = D(), best = d.w0, bestN = -1;
    for (var m = d.w0; m <= d.w1; m += SNAP) {
      var n = 0;
      d.sessions.forEach(function (s) { if (m >= s.s && m < s.e) n++; });
      if (n > bestN) { bestN = n; best = m; }
    }
    return best;
  }
  function initialTime() {
    if (isFestivalDay()) { S.follow = true; S.t = liveMinute(); return; }
    S.follow = false;
    S.t = busiestMinute();
  }
  initialTime();

  function stateAt(s, t) {
    if (t >= s.e) return "done";
    if (t >= s.s) return "live";
    if (s.s - t <= 60) return "soon";
    return "later";
  }
  function venueStatus(vid, t) {
    var list = D().sessions.filter(function (s) { return s.venue === vid; });
    if (!list.length) return { state: "none" };
    var live = list.filter(function (s) { return t >= s.s && t < s.e; });
    if (live.length) return { state: "live", session: live[live.length - 1], all: live };
    var next = list.filter(function (s) { return s.s > t; })[0];
    if (!next) return { state: "idle" };
    return { state: next.s - t <= 60 ? "soon" : "open", session: next };
  }

  /* ------------------------------------------------------------------ */
  /* Walking network and directions (Dijkstra on the traced walkways)    */
  /* ------------------------------------------------------------------ */
  var GRAPH = (function () {
    var nodes = {}, key = function (p) { return p[0] + "," + p[1]; };
    function add(a, b) {
      var ka = key(a), kb = key(b), d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      (nodes[ka] = nodes[ka] || { p: a, e: {} }).e[kb] = d;
      (nodes[kb] = nodes[kb] || { p: b, e: {} }).e[ka] = d;
    }
    function nearest(pt) {
      var best = null, bd = Infinity;
      Object.keys(nodes).forEach(function (k) {
        var q = nodes[k].p, d = Math.hypot(q[0] - pt[0], q[1] - pt[1]);
        if (d < bd) { bd = d; best = q; }
      });
      return best;
    }
    C.paths.forEach(function (path) { for (var i = 1; i < path.pts.length; i++) add(path.pts[i - 1], path.pts[i]); });
    // Step-free entrances and amenity markers join the network at their nearest walkway point.
    function link(pt) { if (!nodes[key(pt)]) { var n = nearest(pt); if (n) add(pt, n); } }
    C.venues.forEach(function (v) { (v.access || []).forEach(link); });
    Object.keys(C.amenities).forEach(function (n) { C.amenities[n].at.forEach(link); });
    return { nodes: nodes, key: key, nearest: nearest };
  })();
  function shortest(from, to) {
    var N = GRAPH.nodes, src = GRAPH.key(from), dst = GRAPH.key(to);
    if (!N[src] || !N[dst]) return null;
    var dist = {}, prev = {}, done = {}, open = [src];
    dist[src] = 0;
    while (open.length) {
      open.sort(function (a, b) { return dist[a] - dist[b]; });
      var u = open.shift();
      if (u === dst) break;
      if (done[u]) continue;
      done[u] = true;
      Object.keys(N[u].e).forEach(function (v) {
        var alt = dist[u] + N[u].e[v];
        if (dist[v] === undefined || alt < dist[v]) { dist[v] = alt; prev[v] = u; open.push(v); }
      });
    }
    if (dist[dst] === undefined) return null;
    var pts = [], k = dst;
    while (k) { pts.unshift(N[k].p); k = prev[k]; }
    return { pts: pts, len: dist[dst] };
  }

  /* ------------------------------------------------------------------ */
  /* Where am I? Live GPS position, or a spot the visitor taps            */
  /* ------------------------------------------------------------------ */
  var GEO = C.geo || {};
  var CAL_KEY = "lf-calib";
  var ME = { on: false, watch: null, pending: false, fix: null, map: null, onCampus: false, msg: "" };
  var FIT = null;
  function calibPoints() {
    var pts = (GEO.points || []).slice();
    try { (JSON.parse(store(CAL_KEY) || "[]") || []).forEach(function (p) { pts.push(p); }); } catch (e) {}
    return pts;
  }
  function toLocal(lat, lon) { // metres east and metres south of the campus centre
    var c = GEO.centre || [lat, lon], R = 6371008, rad = Math.PI / 180;
    return [(lon - c[1]) * rad * R * Math.cos(c[0] * rad), -(lat - c[0]) * rad * R];
  }
  function metresBetween(a, b) { var p = toLocal(a[0], a[1]), q = toLocal(b[0], b[1]); return Math.hypot(p[0] - q[0], p[1] - q[1]); }
  // Least-squares similarity transform (scale, rotation, shift) from GPS to map units, using complex numbers.
  function fitGeo() {
    FIT = null;
    var pts = calibPoints();
    if (pts.length < 2) return;
    var zs = pts.map(function (p) { return toLocal(p.lat, p.lon); }), ws = pts.map(function (p) { return p.map; });
    var zm = [0, 0], wm = [0, 0];
    zs.forEach(function (z, i) { zm[0] += z[0] / zs.length; zm[1] += z[1] / zs.length; wm[0] += ws[i][0] / zs.length; wm[1] += ws[i][1] / zs.length; });
    var nr = 0, ni = 0, den = 0;
    zs.forEach(function (z, i) {
      var a = z[0] - zm[0], b = z[1] - zm[1], c = ws[i][0] - wm[0], d = ws[i][1] - wm[1];
      nr += c * a + d * b; ni += d * a - c * b; den += a * a + b * b;
    });
    if (den < 400) return; // points closer than ~20 m apart can't anchor the map
    var A = [nr / den, ni / den];
    var B = [wm[0] - (A[0] * zm[0] - A[1] * zm[1]), wm[1] - (A[0] * zm[1] + A[1] * zm[0])];
    var err = 0;
    zs.forEach(function (z, i) { var x = A[0] * z[0] - A[1] * z[1] + B[0], y = A[0] * z[1] + A[1] * z[0] + B[1]; err += Math.hypot(x - ws[i][0], y - ws[i][1]); });
    FIT = { A: A, B: B, mpu: 1 / Math.hypot(A[0], A[1]), err: err / zs.length, n: zs.length };
  }
  function geoToMap(lat, lon) {
    if (!FIT) return null;
    var z = toLocal(lat, lon);
    return [FIT.A[0] * z[0] - FIT.A[1] * z[1] + FIT.B[0], FIT.A[0] * z[1] + FIT.A[1] * z[0] + FIT.B[1]];
  }
  function mpu() { return FIT ? FIT.mpu : (GEO.metresPerUnit || 0.17); }
  function insideCampus(pt) {
    var b = C.boundary;
    return pt[0] >= b.x - 40 && pt[0] <= b.x + b.w + 40 && pt[1] >= b.y - 40 && pt[1] <= b.y + b.h + 40;
  }
  fitGeo();

  /* ------------------------------------------------------------------ */
  /* Directions                                                          */
  /* ------------------------------------------------------------------ */
  function origins() {
    if (S.from === "me" && ME.map) return [{ pt: ME.map, label: "where you are", kind: "me" }];
    if (S.from === "spot" && S.spot) return [{ pt: S.spot, label: "your spot", kind: "spot" }];
    var gs = /^g\d$/.test(S.from) ? C.gates.filter(function (g) { return g.id === S.from; }) : C.gates;
    return gs.map(function (g) { return { pt: g.at, label: g.name, kind: "gate", gate: g }; });
  }
  function routeFrom(o, dest) {
    if (GRAPH.nodes[GRAPH.key(o.pt)]) return shortest(o.pt, dest);
    var n = GRAPH.nearest(o.pt), r = n && shortest(n, dest);
    if (!r) return null;
    return { pts: [o.pt].concat(r.pts), len: r.len + Math.hypot(n[0] - o.pt[0], n[1] - o.pt[1]) };
  }
  function bestRoute(dests) {
    var best = null;
    origins().forEach(function (o) {
      dests.forEach(function (d) {
        var r = routeFrom(o, d);
        if (r && (!best || r.len < best.len)) { best = r; best.origin = o; }
      });
    });
    return best;
  }
  function routeTo(venue) {
    if (!venue || !venue.node) return null;
    var stepFree = !!(S.access && venue.access && venue.access.length);
    var r = bestRoute(stepFree ? venue.access : [venue.node]);
    if (r) r.stepFree = stepFree;
    return r;
  }
  function walkMin(len) { return Math.max(1, Math.round(len * mpu() / (GEO.walkMetresPerMinute || 65))); }
  function fromText(r) {
    if (!r) return "";
    if (r.origin.kind === "gate") return r.origin.label + (/^g\d$/.test(S.from) ? "" : ", the closest gate");
    return r.origin.label;
  }

  /* ------------------------------------------------------------------ */
  /* Map                                                                 */
  /* ------------------------------------------------------------------ */
  var svg = $("#mapSvg"), labelsEl = $("#mapLabels"), mapwrap = $("#mapwrap");
  var VB = C.viewBox; // [x, y, w, h]
  var view = { k: 1, tx: 0, ty: 0 };
  var meEls = {};
  var world, routeLayer, venueEls = {}, labelEls = {}, gateLabels = [], amenEls = [], scalables = [];
  // Markers keep a steady on-screen size while the map zooms (they grow a little, not 4x).
  function scalable(el, x, y, rot) { var o = { el: el, x: x, y: y, rot: rot || 0 }; el._sc = o; scalables.push(o); return el; }
  function updateScalables() {
    var ms = Math.pow(view.k, -0.62);
    for (var i = 0; i < scalables.length; i++) {
      var o = scalables[i];
      o.el.setAttribute("transform", "translate(" + o.x + " " + o.y + ") scale(" + ms.toFixed(4) + ")" + (o.rot ? " rotate(" + o.rot + ")" : ""));
    }
  }
  function frame() {
    world.setAttribute("transform", "translate(" + view.tx.toFixed(2) + " " + view.ty.toFixed(2) + ") scale(" + view.k.toFixed(4) + ")");
    updateScalables();
    placeLabels();
  }

  function sv(tag, attrs, parent) {
    var el = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(el);
    return el;
  }
  function polyD(pts, close) { return "M" + pts.map(function (p) { return p[0] + " " + p[1]; }).join("L") + (close ? "Z" : ""); }
  function bbox(pts) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    return [x0, y0, x1, y1];
  }

  function buildMap() {
    svg.setAttribute("viewBox", VB.join(" "));
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    var defs = sv("defs", null, svg);
    var sym = sv("symbol", { id: "sym-access", viewBox: "-17 -17 34 34" }, defs);
    sv("circle", { class: "m-access-bg", r: 15.5 }, sym);
    sv("circle", { class: "m-access-head", cx: 1.5, cy: -8.5, r: 2.6 }, sym);
    sv("path", { class: "m-access-fg", d: "M0 -4.5v8h7.5l3.6 7.5M-4.6 -0.2a7.8 7.8 0 1 0 10.6 10" }, sym);

    world = sv("g", { id: "world" }, svg);
    var b = C.boundary;

    sv("rect", { class: "m-outside", x: VB[0] - 2000, y: VB[1] - 2000, width: VB[2] + 4000, height: VB[3] + 4000 }, world);
    sv("rect", { class: "m-sea", x: VB[0] - 2000, y: VB[1] - 2000, width: VB[2] + 4000, height: 2000 + (b.y - VB[1]) }, world);
    for (var wi = 0; wi < 3; wi++) {
      var y = -30 + wi * 26, d = "M" + (VB[0] - 40) + " " + y;
      for (var x = VB[0] - 40; x < VB[0] + VB[2] + 40; x += 60) d += " q15 -9 30 0 t30 0";
      sv("path", { class: "m-wave", d: d, opacity: 0.55 - wi * 0.12 }, world);
    }
    sv("rect", { class: "m-ground", x: b.x, y: b.y, width: b.w, height: b.h, rx: b.r }, world);

    C.parking.forEach(function (p) { sv("rect", { class: "m-parking", x: p[0], y: p[1], width: p[2], height: p[3], rx: 4 }, world); });
    C.buildings.forEach(function (pts) { sv("path", { class: "m-building", d: polyD(pts, true) }, world); });
    C.paths.forEach(function (p) { if (!p.hidden) sv("path", { class: "m-path", d: polyD(p.pts) }, world); });

    if (C.labels && C.labels.title) {
      var tt = sv("text", { class: "m-title", x: C.labels.title.at[0], y: C.labels.title.at[1] }, world);
      tt.textContent = C.labels.title.text;
    }

    var vg = sv("g", { id: "venues" }, world);
    C.venues.forEach(function (v) {
      var g = sv("g", { class: "venue", "data-id": v.id, "data-type": v.type, tabindex: 0, role: "button", "aria-label": v.name }, vg);
      sv("path", { class: "v-shape", d: polyD(v.shape, true) }, g);
      sv("path", { class: "v-ring", d: polyD(v.shape, true) }, g);
      venueEls[v.id] = g;
    });

    var eg = sv("g", { id: "entries" }, world);
    C.venues.forEach(function (v) {
      (v.entries || []).forEach(function (e) {
        scalable(sv("path", { class: "m-entry", "data-venue": v.id, d: "M-34 -7H-15V-14L0 0-15 14V7H-34Z" }, eg), e.at[0], e.at[1], e.dir);
      });
    });

    var ag = sv("g", { class: "layer-access" + (S.access ? "" : " off"), id: "layerAccessG" }, world);
    C.venues.forEach(function (v) {
      (v.access || []).forEach(function (a) {
        var g = scalable(sv("g", null, ag), a[0], a[1]);
        sv("use", { href: "#sym-access", x: -17, y: -17, width: 34, height: 34 }, g);
      });
    });

    var mg = sv("g", { class: "layer-amenities" + (S.amen ? "" : " off"), id: "layerAmenG" }, world);
    Object.keys(C.amenities).forEach(function (n) {
      C.amenities[n].at.forEach(function (p) {
        var g = scalable(sv("g", { class: "m-amenity", "data-n": n }, mg), p[0], p[1]);
        var t = sv("title", null, g); t.textContent = n + ". " + C.amenities[n].name;
        sv("circle", { r: 15 }, g);
        var tx = sv("text", { y: 1 }, g); tx.textContent = n;
        amenEls.push(g);
      });
    });

    var gg = sv("g", { id: "gates" }, world);
    C.gates.forEach(function (g) {
      var t = scalable(sv("g", null, gg), g.at[0], g.at[1], g.side === "right" ? 90 : 0);
      sv("rect", { class: "m-gate", x: -26, y: -15, width: 52, height: 30, rx: 8 }, t);
      [-12, 0, 12].forEach(function (x) { sv("line", { class: "m-gate-bar", x1: x, y1: -8, x2: x, y2: 8 }, t); });
    });

    sv("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: b.r, class: "m-wall" }, world);

    if (C.labels && C.labels.sea) {
      var st = sv("text", { class: "m-sea-label", x: C.labels.sea.at[0], y: C.labels.sea.at[1], "text-anchor": "middle" }, world);
      st.textContent = C.labels.sea.text;
    }
    if (C.labels && C.labels.side) {
      var sd = sv("text", { class: "m-edge-label", "text-anchor": "middle", transform: "translate(" + C.labels.side.at[0] + " " + C.labels.side.at[1] + ") rotate(90)" }, world);
      sd.textContent = C.labels.side.text;
    }

    routeLayer = sv("g", { id: "route" }, world);

    var meLayer = sv("g", { id: "me" }, world);
    meEls.acc = sv("circle", { class: "me-acc", r: 0, cx: 0, cy: 0 }, meLayer);
    meEls.dot = scalable(sv("g", { class: "me-dot" }, meLayer), 0, 0);
    sv("circle", { class: "me-halo", r: 17 }, meEls.dot);
    sv("circle", { class: "me-core", r: 9 }, meEls.dot);
    meEls.spot = scalable(sv("g", { class: "spot-pin" }, meLayer), 0, 0);
    sv("path", { class: "spot-body", d: "M0 0C-4-9-15-15-15-27a15 15 0 0 1 30 0C15-15 4-9 0 0Z" }, meEls.spot);
    sv("circle", { class: "spot-eye", cy: -27, r: 6 }, meEls.spot);
    meEls.dot.style.display = "none"; meEls.spot.style.display = "none"; meEls.acc.style.display = "none";

    // HTML labels
    C.venues.forEach(function (v) {
      var el = document.createElement("div");
      el.className = "mlabel";
      el.setAttribute("data-id", v.id);
      el.setAttribute("data-type", v.type);
      el.innerHTML = '<span class="n"></span><span class="st" hidden></span>';
      el.addEventListener("click", function () { selectVenue(v.id, true); });
      labelsEl.appendChild(el);
      labelEls[v.id] = { el: el, n: el.firstChild, st: el.lastChild, v: v };
    });
    C.gates.forEach(function (g) {
      var el = document.createElement("div");
      el.className = "mlabel gate";
      el.innerHTML = '<span class="n">' + esc(g.name) + "</span>";
      labelsEl.appendChild(el);
      var off = g.side === "right" ? [0, 52] : [0, 34];
      gateLabels.push({ el: el, at: [g.at[0] + off[0], g.at[1] + off[1]] });
    });
  }

  // Coordinate transforms
  var metrics = { w: 1, h: 1, s: 1, ox: 0, oy: 0 };
  function measure() {
    var r = svg.getBoundingClientRect();
    metrics.w = r.width || 1; metrics.h = r.height || 1;
    metrics.s = Math.min(metrics.w / VB[2], metrics.h / VB[3]);
    metrics.ox = (metrics.w - VB[2] * metrics.s) / 2;
    metrics.oy = (metrics.h - VB[3] * metrics.s) / 2;
    metrics.left = r.left; metrics.top = r.top;
  }
  function toScreen(wx, wy) {
    return [metrics.ox + (view.k * wx + view.tx - VB[0]) * metrics.s, metrics.oy + (view.k * wy + view.ty - VB[1]) * metrics.s];
  }
  function toUser(px, py) { return [VB[0] + (px - metrics.ox) / metrics.s, VB[1] + (py - metrics.oy) / metrics.s]; }
  var KMIN = 1, KMAX = 4.5;
  function clampView(v) {
    v.k = clamp(v.k, KMIN, KMAX);
    // How much of the pane lies outside the viewBox (letterboxing), in user units; allow panning into it when zoomed.
    var exX = Math.max(0, (metrics.w / metrics.s - VB[2]) / 2), exY = Math.max(0, (metrics.h / metrics.s - VB[3]) / 2) + (typeof mapInsetBottom === "function" ? mapInsetBottom() / metrics.s : 0);
    var x0 = VB[0], x1 = VB[0] + VB[2], y0 = VB[1], y1 = VB[1] + VB[3];
    var loX = x1 + exX - v.k * x1, hiX = x0 - exX - v.k * x0;
    var loY = y1 + exY - v.k * y1, hiY = y0 - exY - v.k * y0;
    // When the map is smaller than the pane, let it sit anywhere inside (fitBox decides); otherwise keep it covering the pane.
    v.tx = loX > hiX ? clamp(v.tx, hiX, loX) : clamp(v.tx, loX, hiX);
    v.ty = loY > hiY ? clamp(v.ty, hiY, loY) : clamp(v.ty, loY, hiY);
    return v;
  }
  var viewQueued = false;
  function applyView() {
    if (viewQueued) return;
    viewQueued = true;
    requestAnimationFrame(function () {
      viewQueued = false;
      frame();
    });
  }
  function zoomAt(px, py, f) {
    var u = toUser(px, py), wx = (u[0] - view.tx) / view.k, wy = (u[1] - view.ty) / view.k;
    var k = clamp(view.k * f, KMIN, KMAX);
    view.k = k; view.tx = u[0] - k * wx; view.ty = u[1] - k * wy;
    clampView(view); applyView();
  }
  var anim = null;
  function animateTo(target, ms) {
    if (anim) cancelAnimationFrame(anim.raf);
    clampView(target);
    if (reduceMotion || !ms) { view.k = target.k; view.tx = target.tx; view.ty = target.ty; applyView(); return; }
    var from = { k: view.k, tx: view.tx, ty: view.ty }, t0 = performance.now();
    anim = {};
    (function step(t) {
      var p = Math.min(1, (t - t0) / ms), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      view.k = from.k + (target.k - from.k) * e;
      view.tx = from.tx + (target.tx - from.tx) * e;
      view.ty = from.ty + (target.ty - from.ty) * e;
      frame();
      if (p < 1) anim.raf = requestAnimationFrame(step); else anim = null;
    })(t0);
  }
  function fitBox(bb, opts) {
    opts = opts || {};
    measure();
    var padX = opts.pad || 0.18, padY = opts.pad || 0.18;
    var mn = opts.min || 160, bw = Math.max(bb[2] - bb[0], mn), bh = Math.max(bb[3] - bb[1], mn);
    var inset = opts.noInset ? 0 : (typeof mapInsetBottom === "function" ? mapInsetBottom() : 0), vh = Math.max(120, metrics.h - inset);
    var k = Math.min(metrics.w * (1 - padX) / (bw * metrics.s), vh * (1 - padY) / (bh * metrics.s));
    k = clamp(k, opts.minK || KMIN, opts.maxK || 2.6);
    var cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
    var uc = toUser(metrics.w / 2, vh / 2);
    animateTo({ k: k, tx: uc[0] - k * cx, ty: uc[1] - k * cy }, opts.instant ? 0 : 520);
  }
  function home(instant) {
    if (typeof isPhone === "function" && isPhone()) { fitBox([60, 40, 1200, 1105], { pad: 0.04, instant: instant, maxK: 1.6, minK: 1 }); return; }
    fitBox([C.boundary.x, C.boundary.y - 30, C.boundary.x + C.boundary.w + 60, C.boundary.y + C.boundary.h], { pad: 0.02, instant: instant, maxK: 1 });
  }

  // Labels: positioned in screen pixels so text stays crisp and readable at any zoom; overlaps are hidden by priority.
  var PRIORITY = { live: 4, soon: 3, open: 2, idle: 1, none: 1 };
  function placeLabels() {
    var placed = [], scale = metrics.s * view.k, full = scale > 0.62;
    var items = Object.keys(labelEls).map(function (id) { return labelEls[id]; });
    items.forEach(function (L) {
      var p = toScreen(L.v.label[0], L.v.label[1]);
      L.x = p[0]; L.y = p[1];
      var name = full ? L.v.name : L.v.short;
      if (L.name !== name) { L.n.textContent = name; L.name = name; L.w = null; }
      L.el.style.transform = "translate(" + L.x.toFixed(1) + "px," + L.y.toFixed(1) + "px) translate(-50%,-50%)";
    });
    items.sort(function (a, b) { return (b.pri || 0) - (a.pri || 0); });
    items.forEach(function (L) {
      if (L.w == null || L.dirty) { L.w = L.el.offsetWidth; L.h = L.el.offsetHeight; L.dirty = false; }
      // Try the venue's own spot first, then nudge below, above, right and left before giving up.
      var cands = [[0, 0], [0, L.h * 0.62 + 4], [0, -(L.h * 0.62 + 4)], [L.w / 2 + 18, 0], [-(L.w / 2 + 18), 0], [0, L.h + 10]];
      var chosen = null;
      for (var i = 0; i < cands.length; i++) {
        var x = L.x + cands[i][0], y = L.y + cands[i][1];
        var box = [x - L.w / 2 - 3, y - L.h / 2 - 2, x + L.w / 2 + 3, y + L.h / 2 + 2];
        if (box[0] < 2 || box[1] < 2 || box[2] > metrics.w - 2 || box[3] > metrics.h - 2) continue;
        var hit = placed.some(function (q) { return box[0] < q[2] && box[2] > q[0] && box[1] < q[3] && box[3] > q[1]; });
        if (!hit || (i === 0 && L.sel)) { chosen = { x: x, y: y, box: box }; break; }
      }
      if (!chosen && L.sel) {
        var cx = clamp(L.x, L.w / 2 + 6, metrics.w - L.w / 2 - 6), cy = clamp(L.y, L.h / 2 + 6, metrics.h - L.h / 2 - 6);
        chosen = { x: cx, y: cy, box: [cx - L.w / 2, cy - L.h / 2, cx + L.w / 2, cy + L.h / 2] };
      }
      L.el.classList.toggle("hidden", !chosen);
      if (chosen) {
        placed.push(chosen.box);
        L.el.style.transform = "translate(" + chosen.x.toFixed(1) + "px," + chosen.y.toFixed(1) + "px) translate(-50%,-50%)";
      }
    });
    gateLabels.forEach(function (G) {
      var p = toScreen(G.at[0], G.at[1]);
      G.el.style.transform = "translate(" + p[0].toFixed(1) + "px," + p[1].toFixed(1) + "px) translate(-50%,-50%)";
    });
  }

  function renderMapState() {
    var t = S.t, sel = S.selected ? D().byId[S.selected] : null, focusVenue = sel ? sel.venue : S.venue;
    C.venues.forEach(function (v) {
      var st = venueStatus(v.id, t), g = venueEls[v.id], L = labelEls[v.id];
      var vis = v.type === "hub" ? "open" : (st.state === "none" ? "idle" : st.state);
      g.setAttribute("data-state", vis);
      g.classList.toggle("is-selected", focusVenue === v.id);
      var label = v.name;
      var text = "", cls = "";
      if (st.state === "live") { text = st.session.title; cls = "live"; label += ", on now: " + st.session.title; }
      else if (st.state === "soon") { text = st.session.title.length > 22 ? relIn(st.session.s - t) : st.session.title + ", " + relIn(st.session.s - t); cls = "soon"; label += ", next " + fmt(st.session.s); }
      else if (st.state === "open") { text = "Next " + fmt(st.session.s); cls = "soon"; label += ", next " + fmt(st.session.s); }
      else if (st.state === "idle") { text = "Done for today"; cls = "done"; }
      g.setAttribute("aria-label", label);
      if (L.st.textContent !== text || L.cls !== cls) {
        L.st.textContent = text; L.st.className = "st " + cls; L.st.hidden = !text; L.cls = cls; L.dirty = true;
      }
      L.pri = (focusVenue === v.id ? 10 : 0) + (PRIORITY[st.state] || 1) + (v.type === "hub" ? -0.5 : 0);
      L.sel = focusVenue === v.id;
      L.el.classList.toggle("sel", L.sel);
    });
    $$(".m-entry", svg).forEach(function (e) { e.classList.toggle("dim", !!focusVenue && e.getAttribute("data-venue") !== focusVenue); });
    placeLabels();
  }

  var lastRoute = null, routeTarget = null;
  function drawRoute(venue, fly) { routeTarget = venue ? { venue: venue } : null; return paintRoute(fly); }
  function routeAmenity(n, fly) { routeTarget = { amenity: String(n) }; return paintRoute(fly); }
  function paintRoute(fly) {
    while (routeLayer.firstChild) routeLayer.removeChild(routeLayer.firstChild);
    scalables = scalables.filter(function (o) { return document.documentElement.contains(o.el) || o.el.ownerSVGElement; });
    scalables = scalables.filter(function (o) { var p = o.el.parentNode; return p && p !== routeLayer && (!p.parentNode || p.parentNode !== routeLayer); });
    lastRoute = null;
    if (!routeTarget) return null;
    var r, extra;
    if (routeTarget.venue) { r = routeTo(routeTarget.venue); extra = routeTarget.venue.shape; }
    else { var am = C.amenities[routeTarget.amenity]; r = am ? bestRoute(am.at) : null; extra = r ? [r.pts[r.pts.length - 1]] : []; }
    if (!r) return null;
    lastRoute = r;
    var d = polyD(r.pts);
    sv("path", { class: "route-casing", d: d }, routeLayer);
    sv("path", { class: "route-line" + (reduceMotion ? "" : " flow"), d: d }, routeLayer);
    var end = r.pts[r.pts.length - 1];
    if (r.origin.kind === "gate") sv("circle", { class: "route-start", r: 11 }, scalable(sv("g", null, routeLayer), r.pts[0][0], r.pts[0][1]));
    sv("circle", { class: "route-end", r: 10 }, scalable(sv("g", null, routeLayer), end[0], end[1]));
    updateScalables();
    if (fly) fitBox(bbox(r.pts.concat(extra)), { pad: 0.14, min: 520, maxK: 2 });
    return r;
  }
  function refreshRoute(fly) { if (routeTarget) paintRoute(fly); }

  // Pointer interaction: pan, pinch, wheel, tap
  var pointers = {}, gesture = null;
  function pcount() { return Object.keys(pointers).length; }
  function rel(e) { return [e.clientX - metrics.left, e.clientY - metrics.top]; }
  function bindMapInput() {
    svg.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button > 0) return;
      measure();
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      pointers[e.pointerId] = rel(e);
      if (anim) { cancelAnimationFrame(anim.raf); anim = null; }
      if (pcount() === 1) {
        var vt = e.target.closest ? e.target.closest(".venue") : null;
        gesture = { type: "pan", start: rel(e), tx: view.tx, ty: view.ty, moved: false, venue: vt && vt.getAttribute("data-id") };
      } else if (pcount() === 2) {
        var ps = Object.keys(pointers).map(function (k) { return pointers[k]; });
        var mid = [(ps[0][0] + ps[1][0]) / 2, (ps[0][1] + ps[1][1]) / 2];
        var u = toUser(mid[0], mid[1]);
        gesture = { type: "pinch", d0: Math.hypot(ps[0][0] - ps[1][0], ps[0][1] - ps[1][1]) || 1, k0: view.k, w: [(u[0] - view.tx) / view.k, (u[1] - view.ty) / view.k], moved: true };
      }
    });
    svg.addEventListener("pointermove", function (e) {
      if (!pointers[e.pointerId] || !gesture) return;
      pointers[e.pointerId] = rel(e);
      if (gesture.type === "pan") {
        var p = pointers[e.pointerId], dx = p[0] - gesture.start[0], dy = p[1] - gesture.start[1];
        if (!gesture.moved && Math.hypot(dx, dy) > 6) { gesture.moved = true; svg.classList.add("dragging"); }
        if (gesture.moved) {
          view.tx = gesture.tx + dx / metrics.s; view.ty = gesture.ty + dy / metrics.s;
          clampView(view); applyView();
        }
      } else if (gesture.type === "pinch" && pcount() >= 2) {
        var ps = Object.keys(pointers).map(function (k) { return pointers[k]; });
        var mid = [(ps[0][0] + ps[1][0]) / 2, (ps[0][1] + ps[1][1]) / 2];
        var d = Math.hypot(ps[0][0] - ps[1][0], ps[0][1] - ps[1][1]);
        var k = clamp(gesture.k0 * d / gesture.d0, KMIN, KMAX), u = toUser(mid[0], mid[1]);
        view.k = k; view.tx = u[0] - k * gesture.w[0]; view.ty = u[1] - k * gesture.w[1];
        clampView(view); applyView();
      }
    });
    function end(e) {
      if (!pointers[e.pointerId]) return;
      delete pointers[e.pointerId];
      svg.classList.remove("dragging");
      if (gesture && gesture.type === "pan" && !gesture.moved && e.type === "pointerup") {
        if (S.picking) {
          var pp = rel(e), u = toUser(pp[0], pp[1]);
          setSpot([Math.round((u[0] - view.tx) / view.k), Math.round((u[1] - view.ty) / view.k)]);
        } else if (gesture.venue) selectVenue(gesture.venue, true);
      }
      if (pcount() === 1) {
        var id = Object.keys(pointers)[0];
        gesture = { type: "pan", start: pointers[id], tx: view.tx, ty: view.ty, moved: true };
      } else if (!pcount()) gesture = null;
    }
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("wheel", function (e) {
      e.preventDefault(); measure();
      var dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
      var p = rel(e);
      zoomAt(p[0], p[1], Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)));
    }, { passive: false });
    svg.addEventListener("dblclick", function (e) { measure(); var p = rel(e); zoomAt(p[0], p[1], 1.7); });
    svg.addEventListener("keydown", function (e) {
      var g = e.target.closest && e.target.closest(".venue");
      if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectVenue(g.getAttribute("data-id"), true); }
    });
    $("#zoomIn").addEventListener("click", function () { measure(); zoomAt(metrics.w / 2, metrics.h / 2, 1.5); });
    $("#zoomOut").addEventListener("click", function () { measure(); zoomAt(metrics.w / 2, metrics.h / 2, 1 / 1.5); });
    $("#zoomReset").addEventListener("click", function () { home(false); });
    if (window.ResizeObserver) new ResizeObserver(function () { measure(); clampView(view); applyView(); }).observe(svg);
    else window.addEventListener("resize", function () { measure(); applyView(); });
  }

  /* ------------------------------------------------------------------ */
  /* Live location and "my spot" (UI)                                    */
  /* ------------------------------------------------------------------ */
  function startLocate() {
    if (!navigator.geolocation) { ME.on = false; ME.msg = "This browser can't share its location. Tap Set my spot instead."; renderGeo(); return; }
    ME.on = true; ME.pending = true; ME.msg = "";
    renderGeo();
    try {
      ME.watch = navigator.geolocation.watchPosition(onPos, onPosErr, { enableHighAccuracy: true, maximumAge: 10000, timeout: 25000 });
    } catch (e) { onPosErr({ code: 0 }); }
  }
  function stopLocate(silent) {
    if (ME.watch != null && navigator.geolocation) navigator.geolocation.clearWatch(ME.watch);
    ME = { on: false, watch: null, pending: false, fix: null, map: null, onCampus: false, msg: "" };
    if (S.from === "me") S.from = "auto";
    renderGeo(); refreshRoute(false);
    if (!silent) render(true);
  }
  var lastGeoRender = null;
  function onPos(p) {
    var c = p.coords;
    ME.pending = false;
    ME.fix = { lat: c.latitude, lon: c.longitude, acc: c.accuracy || 50, t: Date.now() };
    var dist = metresBetween([c.latitude, c.longitude], GEO.centre || [c.latitude, c.longitude]);
    ME.onCampus = dist <= (GEO.campusRadius || 230);
    var m = ME.onCampus ? geoToMap(c.latitude, c.longitude) : null;
    ME.map = m && insideCampus(m) ? [Math.round(m[0]), Math.round(m[1])] : null;
    if (ME.map && S.from !== "spot" && !ME.autoFrom) { S.from = "me"; ME.autoFrom = true; }
    ME.msg = "";
    renderGeo();
    var moved = !lastGeoRender || !ME.map || Math.hypot(ME.map[0] - lastGeoRender[0], ME.map[1] - lastGeoRender[1]) > 12;
    if (moved) { lastGeoRender = ME.map; if (S.from === "me") refreshRoute(false); render(true); }
  }
  function onPosErr(e) {
    ME.pending = false;
    if (e && e.code === 1) { ME.on = false; ME.msg = "Location access is off for this site. Tap Set my spot to start routes from where you are."; }
    else if (e && e.code === 3) ME.msg = "Still looking for GPS. Indoors it can take a while.";
    else ME.msg = "Your location isn't available right now. Tap Set my spot instead.";
    renderGeo();
  }
  function setSpot(pt) {
    var b = C.boundary;
    pt = [clamp(pt[0], b.x + 10, b.x + b.w - 10), clamp(pt[1], b.y + 10, b.y + b.h - 10)];
    S.spot = pt; S.from = "spot"; S.picking = false;
    store("lf-spot", JSON.stringify(pt)); store("lf-from", "spot");
    mapwrap.classList.remove("picking");
    renderGeo(); refreshRoute(!!routeTarget); render(true);
    toast("Routes now start from your spot");
  }
  function clearSpot() {
    S.spot = null; store("lf-spot", null);
    if (S.from === "spot") { S.from = ME.map ? "me" : "auto"; store("lf-from", S.from); }
    renderGeo(); refreshRoute(false); render(true);
  }
  function renderGeo() {
    // marker layer
    var showDot = !!(ME.on && ME.map);
    meEls.dot.style.display = showDot ? "" : "none";
    meEls.acc.style.display = showDot ? "" : "none";
    if (showDot) {
      meEls.dot._sc.x = ME.map[0]; meEls.dot._sc.y = ME.map[1];
      meEls.acc.setAttribute("cx", ME.map[0]); meEls.acc.setAttribute("cy", ME.map[1]);
      meEls.acc.setAttribute("r", Math.min(400, ME.fix.acc / mpu()));
    }
    meEls.spot.style.display = S.spot ? "" : "none";
    if (S.spot) { meEls.spot._sc.x = S.spot[0]; meEls.spot._sc.y = S.spot[1]; }
    meEls.spot.classList.toggle("active", S.from === "spot");
    updateScalables();
    // buttons
    var lb = $("#locateBtn");
    lb.setAttribute("aria-pressed", String(ME.on));
    lb.classList.toggle("busy", ME.pending);
    $("#spotBtn").setAttribute("aria-pressed", String(S.picking));
    // the "from" picker
    var nar = narrowShelf();
    var sel = $("#fromSel"), opts = [["auto", nar ? "Closest gate" : "From the closest gate"], ["g1", nar ? "Gate 1" : "From Gate 1"], ["g2", nar ? "Gate 2" : "From Gate 2"], ["g3", nar ? "Gate 3" : "From Gate 3"]];
    if (ME.map) opts.unshift(["me", nar ? "Where I am" : "From where I am"]);
    if (S.spot) opts.splice(ME.map ? 1 : 0, 0, ["spot", nar ? "My spot" : "From my spot"]);
    var html = opts.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + "</option>"; }).join("");
    if (sel.innerHTML !== html) sel.innerHTML = html;
    if (S.from === "me" && !ME.map) { /* fall back silently */ sel.value = "auto"; } else sel.value = S.from;
    // status chip
    var chip = $("#geoChip"), txt = "", acts = "";
    if (S.picking) { txt = "Tap the map where you are standing."; acts = '<button type="button" data-geo="cancel">Cancel</button>'; }
    else if (ME.pending) txt = "Finding your location…";
    else if (ME.msg) { txt = ME.msg; acts = '<button type="button" data-geo="pick">Set my spot</button><button type="button" class="x" data-geo="dismiss" aria-label="Dismiss">' + icon("close") + "</button>"; }
    else if (ME.on && ME.fix && !ME.onCampus) { txt = "You don't seem to be at NCPA right now. Routes start from the closest gate."; acts = '<button type="button" class="x" data-geo="stop" aria-label="Stop using location">' + icon("close") + "</button>"; }
    else if (ME.on && ME.fix && !ME.map) { txt = "You're at NCPA. Your exact spot isn't available yet, so tap Set my spot to route from where you are."; acts = '<button type="button" data-geo="pick">Set my spot</button><button type="button" class="x" data-geo="stop" aria-label="Stop using location">' + icon("close") + "</button>"; }
    else if (ME.on && ME.map) {
      var acc = Math.round(ME.fix.acc);
      txt = acc > 35 ? "GPS is weak here (about ±" + acc + " m). If the blue dot looks wrong, tap Set my spot." : "Showing where you are, to within about " + acc + " m.";
      acts = (acc > 35 ? '<button type="button" data-geo="pick">Set my spot</button>' : "") + '<button type="button" class="x" data-geo="stop" aria-label="Stop using location">' + icon("close") + "</button>";
    }
    chip.hidden = !txt;
    if (txt) chip.innerHTML = '<span class="g-ic">' + icon(S.picking ? "spot" : "locate") + "</span><span class=\"g-tx\">" + esc(txt) + "</span>" + acts;
  }

  /* ------------------------------------------------------------------ */
  /* Reminders                                                           */
  /* ------------------------------------------------------------------ */
  var REM = { on: store("lf-remind") === "1", lead: +(store("lf-lead") || 10) };
  function firedKey() { return "lf-fired-" + D().date; }
  function firedMap() { try { return JSON.parse(store(firedKey()) || "{}") || {}; } catch (e) { return {}; } }
  function travelFor(s) {
    var r = routeTo(s.v), mins = r ? walkMin(r.len) : 3;
    return { mins: mins, text: "about " + mins + " min walk from " + (r ? fromText(r) : "the gate") };
  }
  function remindAt(s) {
    var t = travelFor(s);
    return { at: s.s - P.arriveBeforeMinutes - t.mins - REM.lead, travel: t };
  }
  function notifPermission() { return "Notification" in window ? Notification.permission : "unsupported"; }
  function setReminders(on) {
    REM.on = on; store("lf-remind", on ? "1" : "0");
    if (on && notifPermission() === "default") {
      try {
        var pr = Notification.requestPermission(function () { render(true); });
        if (pr && pr.then) pr.then(function () { render(true); });
      } catch (e) {}
    }
    toast(on ? "Reminders on" : "Reminders off");
    render(true);
  }
  function reminderText(s, r) {
    return {
      title: "Head to " + s.v.short + " now",
      body: s.title + " starts at " + fmt(s.s) + ". Arrive by " + fmt(s.s - P.arriveBeforeMinutes) + " to keep your seat; it's " + r.travel.text + "."
    };
  }
  function fireReminder(s, r, test) {
    var m = reminderText(s, r);
    if (test) m.title = "Test: " + m.title;
    var shown = false;
    if (notifPermission() === "granted") {
      var opts = { body: m.body, tag: "lf-" + s.id, icon: "assets/icons/icon-192.png", badge: "assets/icons/icon-192.png", data: { id: s.id }, renotify: true };
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(function (reg) { return reg.showNotification(m.title, opts); }).catch(function () { try { new Notification(m.title, opts); } catch (e) {} });
        } else new Notification(m.title, opts);
        shown = true;
      } catch (e) { shown = false; }
    }
    showBanner(m.title, m.body, s.id);
    if (navigator.vibrate) { try { navigator.vibrate([120, 60, 120]); } catch (e) {} }
    return shown;
  }
  function checkReminders() {
    if (!REM.on || !isFestivalDay()) return;
    var n = now().min, fired = firedMap(), changed = false;
    planList().forEach(function (s) {
      if (fired[s.id]) return;
      var r = remindAt(s);
      if (n >= r.at && n < s.s - 2) { fireReminder(s, r); fired[s.id] = Math.round(n); changed = true; }
    });
    if (changed) store(firedKey(), JSON.stringify(fired));
  }
  function showBanner(title, body, id) {
    var b = $("#remindBanner");
    $(".rb-t", b).textContent = title;
    $(".rb-b", b).textContent = body;
    b.setAttribute("data-id", id);
    b.hidden = false;
    requestAnimationFrame(function () { b.classList.add("show"); });
  }
  function hideBanner() { var b = $("#remindBanner"); b.classList.remove("show"); setTimeout(function () { b.hidden = true; }, 220); }

  /* ------------------------------------------------------------------ */
  /* Phone bottom sheet: map behind, timeline and list in a sheet         */
  /* ------------------------------------------------------------------ */
  var SHEET = { state: "peek", y: 0 };
  function isPhone() { return narrowShelf(); }
  function sheetPositions() {
    var st = $("#stage"), h = st.clientHeight, sheet = $("#sheet");
    var low = $("#grabber").offsetHeight + $("#shelf").offsetHeight + 2;
    return { h: h, full: 10, peek: Math.round(h * 0.48), low: Math.max(10, sheet.offsetHeight - low + 10) };
  }
  function setSheet(state, instant) {
    if (!isPhone()) return;
    SHEET.state = state;
    var pos = sheetPositions(), y = pos[state];
    placeSheet(y, instant);
    $("#grabber").setAttribute("aria-label", state === "full" ? "Show the map" : "Show more of the list");
  }
  function placeSheet(y, instant) {
    var sheet = $("#sheet"), pos = sheetPositions();
    SHEET.y = y;
    sheet.classList.toggle("dragging", !!instant);
    sheet.style.setProperty("--sheet-y", y + "px");
    $("#stage").style.setProperty("--sheet-vis", Math.max(0, pos.h - y) + "px");
    if (!instant) setTimeout(function () { measure(); placeLabels(); }, 360); else placeLabels();
  }
  function mapInsetBottom() {
    if (!isPhone()) return 0;
    var pos = sheetPositions();
    return Math.max(0, pos.h - SHEET.y);
  }
  function bindSheet() {
    var drag = null, sheet = $("#sheet");
    function start(e) {
      if (!isPhone()) return;
      if (e.target.closest("select, button:not(#grabber), input, .track, label")) return;
      drag = { y0: e.clientY, s0: SHEET.y, t0: performance.now(), moved: false, id: e.pointerId, el: e.currentTarget };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {}
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = e.clientY - drag.y0;
      if (!drag.moved && Math.abs(dy) < 5) return;
      drag.moved = true;
      var pos = sheetPositions();
      placeSheet(clamp(drag.s0 + dy, pos.full, pos.low), true);
    }
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      sheet.classList.remove("dragging");
      var pos = sheetPositions();
      if (!d.moved) { setSheet(SHEET.state === "full" ? "peek" : SHEET.state === "peek" ? "full" : "peek"); return; }
      var v = (SHEET.y - d.s0) / Math.max(1, performance.now() - d.t0); // px per ms
      var target;
      if (v > 0.5) target = SHEET.y > pos.peek ? "low" : "peek";
      else if (v < -0.5) target = SHEET.y < pos.peek ? "full" : "peek";
      else target = ["full", "peek", "low"].sort(function (a, b) { return Math.abs(pos[a] - SHEET.y) - Math.abs(pos[b] - SHEET.y); })[0];
      setSheet(target);
    }
    [$("#grabber"), $(".shelf-head")].forEach(function (el) {
      el.addEventListener("pointerdown", start);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
    });
    $("#grabber").addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSheet(SHEET.state === "full" ? "peek" : "full"); }
    });
    // Scrolling the list to the very top and pulling down hands control back to the sheet.
    var pull = null;
    scroller.addEventListener("touchstart", function (e) { if (isPhone() && SHEET.state === "full" && scroller.scrollTop <= 0) pull = e.touches[0].clientY; else pull = null; }, { passive: true });
    scroller.addEventListener("touchmove", function (e) { if (pull != null && e.touches[0].clientY - pull > 70) { pull = null; setSheet("peek"); } }, { passive: true });
    scroller.addEventListener("focusin", function (e) { if (e.target.id === "q" && SHEET.state !== "full") setSheet("full"); });
    window.addEventListener("resize", function () { if (isPhone()) setSheet(SHEET.state, true); });
  }
  function revealMap() { if (isPhone() && SHEET.state === "full") setSheet("peek"); }

  /* ------------------------------------------------------------------ */
  /* Shelf: the day timeline                                             */
  /* ------------------------------------------------------------------ */
  var track = $("#track"), playheadEl, nowEl, spineEls = {};
  function narrowShelf() { return window.matchMedia && window.matchMedia("(max-width: 820px)").matches; }
  function pct(m) { var d = D(); return ((m - d.w0) / (d.w1 - d.w0)) * 100; }
  function buildShelf() {
    var d = D();
    track.innerHTML = "";
    $("#laneNames").innerHTML = d.lanes.map(function (id) {
      var v = VENUES[id];
      return '<span title="' + esc(v.name) + '"><i class="' + (v.type === "indoor" ? "indoor" : "outdoor") + '"></i>' + esc(narrowShelf() ? (v.lane || v.short) : v.short) + "</span>";
    }).join("");
    track.style.setProperty("--lanes", d.lanes.length);
    track.style.height = "calc(18px + " + d.lanes.length + " * var(--lane-h) + " + (d.lanes.length - 1) + " * var(--lane-gap))";
    var narrow = track.clientWidth < 420;
    for (var m = d.w0; m <= d.w1; m += 30) {
      var tk = document.createElement("div");
      tk.className = "tick" + (m % 60 ? " half" : "");
      tk.style.left = pct(m) + "%";
      if (m % 60 === 0 && (!narrow || ((m - d.w0) / 60) % 2 === 0)) {
        var h = m / 60, lbl = (h % 12 || 12) + (h === 12 || m === d.w0 || m === d.w1 ? (h >= 12 ? " pm" : " am") : "");
        tk.innerHTML = "<b>" + lbl + "</b>";
      }
      if (m === d.w1) tk.querySelector("b") && (tk.querySelector("b").style.transform = "translateX(-100%)");
      track.appendChild(tk);
    }
    spineEls = {};
    d.lanes.forEach(function (vid, i) {
      var lane = document.createElement("div");
      lane.className = "lane";
      lane.style.top = "calc(18px + " + i + " * (var(--lane-h) + var(--lane-gap)))";
      d.sessions.filter(function (s) { return s.venue === vid; }).forEach(function (s, j, arr) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "spine";
        b.tabIndex = -1;
        b.setAttribute("data-id", s.id);
        b.setAttribute("data-type", VENUES[vid].type === "indoor" ? "indoor" : "outdoor");
        b.setAttribute("aria-label", s.title + ", " + fmtRange(s.s, s.e) + ", " + VENUES[vid].name);
        b.title = s.title + "\n" + fmtRange(s.s, s.e);
        // Overlapping sessions in one venue (Poetry Garden) share the lane: stack the shorter one as a thinner bar.
        var overlaps = arr.some(function (o) { return o !== s && o.s < s.e && s.s < o.e && (o.e - o.s) > (s.e - s.s); });
        b.style.left = pct(s.s) + "%";
        b.style.width = "calc(" + (pct(s.e) - pct(s.s)) + "% - 2px)";
        if (overlaps) { b.classList.add("inner"); }
        lane.appendChild(b);
        spineEls[s.id] = b;
      });
      track.appendChild(lane);
    });
    nowEl = document.createElement("div"); nowEl.className = "nowmark"; nowEl.hidden = true; track.appendChild(nowEl);
    playheadEl = document.createElement("div"); playheadEl.className = "playhead"; track.appendChild(playheadEl);
    track.setAttribute("aria-valuemin", d.w0); track.setAttribute("aria-valuemax", d.w1);
  }
  function renderShelf() {
    var d = D(), t = S.t;
    playheadEl.style.left = pct(t) + "%";
    track.setAttribute("aria-valuenow", Math.round(t));
    track.setAttribute("aria-valuetext", fmt(t));
    var fest = isFestivalDay(), nm = now().min;
    nowEl.hidden = !(fest && !S.follow && nm >= d.w0 && nm <= d.w1);
    if (!nowEl.hidden) nowEl.style.left = pct(nm) + "%";
    var filt = filteredIds();
    d.sessions.forEach(function (s) {
      var b = spineEls[s.id]; if (!b) return;
      b.setAttribute("data-state", stateAt(s, t));
      b.classList.toggle("sel", S.selected === s.id);
      b.classList.toggle("planned", !!S.plan[s.id]);
      b.classList.toggle("dim", !filt[s.id]);
    });
    var tl = $("#shelfTime");
    var sub = S.follow ? "Now" : (fest ? "Preview" : "Drag to explore the day");
    tl.innerHTML = esc(fmt(t)) + "<small>" + esc(sub) + "</small>";
    $("#nowBtn").hidden = !fest || S.follow;
  }
  function bindShelf() {
    var drag = null;
    function minuteAt(clientX) {
      var r = track.getBoundingClientRect(), d = D();
      var m = d.w0 + clamp((clientX - r.left) / r.width, 0, 1) * (d.w1 - d.w0);
      return clamp(Math.round(m / SNAP) * SNAP, d.w0, d.w1);
    }
    track.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button > 0) return;
      try { track.setPointerCapture(e.pointerId); } catch (x) {}
      var sp = e.target.closest && e.target.closest(".spine");
      drag = { x: e.clientX, moved: false, spine: sp && sp.getAttribute("data-id") };
      if (!sp) setTime(minuteAt(e.clientX), true);
    });
    track.addEventListener("pointermove", function (e) {
      if (!drag) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x) > 4) drag.moved = true;
      if (drag.moved) setTime(minuteAt(e.clientX), true);
    });
    function up(e) {
      if (!drag) return;
      if (!drag.moved && drag.spine && e.type === "pointerup") {
        var s = D().byId[drag.spine];
        if (S.selected !== s.id) setTime(clamp(Math.max(S.t, s.s), s.s, s.e - SNAP), true);
        selectSession(drag.spine, { fly: true, scroll: true, toggle: true });
      }
      drag = null;
      scheduleListScroll();
    }
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
    track.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 30 : SNAP, d = D(), m = null;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") m = S.t + step;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") m = S.t - step;
      else if (e.key === "Home") m = d.w0;
      else if (e.key === "End") m = d.w1;
      else if (e.key === "PageUp") m = S.t + 60;
      else if (e.key === "PageDown") m = S.t - 60;
      if (m === null) return;
      e.preventDefault();
      setTime(clamp(Math.round(m / SNAP) * SNAP, d.w0, d.w1), true);
      scheduleListScroll();
    });
    $("#nowBtn").addEventListener("click", backToNow);
    $("#backToNow").addEventListener("click", backToNow);
  }
  function backToNow() { S.follow = true; S.t = liveMinute(); render(); scheduleListScroll(true); }
  function setTime(m, user) {
    if (user) {
      S.follow = false;
      if (isFestivalDay() && Math.abs(m - now().min) < SNAP / 2 + 0.01) S.follow = true;
    }
    if (m === S.t) { if (user) renderShelf(); return; }
    S.t = m;
    render();
  }

  /* ------------------------------------------------------------------ */
  /* Panel: programme list, plan, around the campus                       */
  /* ------------------------------------------------------------------ */
  var scroller = $("#panelScroll");
  function filteredIds() {
    var out = {}, q = norm(S.q).trim(), terms = q ? q.split(/\s+/) : [];
    D().sessions.forEach(function (s) {
      if (S.venue && s.venue !== S.venue) return;
      if (S.cat && (s.categories || []).indexOf(S.cat) < 0) return;
      if (S.isl && !s.isl) return;
      if (terms.length && !terms.every(function (t) { return s.hay.indexOf(t) >= 0; })) return;
      out[s.id] = true;
    });
    return out;
  }

  function badgeFor(s, t) {
    var st = stateAt(s, t);
    if (st === "live") return '<span class="badge live">On now</span>';
    if (st === "soon") return '<span class="badge soon">Starts ' + esc(relIn(s.s - t)) + "</span>";
    if (st === "done") return '<span class="badge done">Ended</span>';
    return "";
  }

  function sessionCard(s, t) {
    var st = stateAt(s, t), sel = S.selected === s.id, inPlan = !!S.plan[s.id], v = s.v;
    var h = '<li class="s' + (sel ? " sel" : "") + '" data-id="' + esc(s.id) + '" data-state="' + st + '">';
    h += '<button class="s-main" type="button" data-act="toggle" data-fk="m-' + esc(s.id) + '" aria-expanded="' + sel + '">';
    h += '<span class="s-time"><b>' + esc(fmt(s.s).replace(" ", "\u202f")) + "</b><span>to " + esc(fmt(s.e).replace(" ", "\u202f")) + "<br>" + esc(dur(s.e - s.s)) + "</span></span>";
    h += '<span class="s-body">';
    h += '<span class="s-meta"><span class="vdot ' + (v.type === "indoor" ? "indoor" : "outdoor") + '"></span>' + esc(v.name) + (s.kind ? ' <span class="badge kind">' + esc(s.kind) + "</span>" : "") + " " + badgeFor(s, t) + "</span>";
    if (s.overline) h += '<span class="s-over">' + esc(s.overline) + "</span>";
    h += '<span class="s-title">' + esc(s.title) + "</span>";
    if (s.subtitle) h += '<span class="s-sub">' + esc(s.subtitle) + "</span>";
    if (s.people) h += '<span class="s-people">' + esc(s.people) + "</span>";
    h += "</span></button>";
    h += '<button class="save" type="button" data-act="plan" data-fk="p-' + esc(s.id) + '" aria-pressed="' + inPlan + '" aria-label="' + (inPlan ? "Remove " : "Add ") + esc(s.title) + (inPlan ? " from" : " to") + ' my plan">' + icon("bookmark") + "</button>";
    if (sel) h += detail(s);
    h += "</li>";
    return h;
  }

  function detail(s) {
    var v = s.v, r = lastRoute && S.selected === s.id ? lastRoute : routeTo(v);
    var h = '<div class="s-more">';
    h += '<dl class="facts">';
    h += "<dt>When</dt><dd class=\"tnum\">" + esc(fmtRange(s.s, s.e)) + "</dd>";
    h += "<dt>Where</dt><dd>" + esc(v.name) + (v.place ? ", " + esc(v.place) : "") + "</dd>";
    if (s.chair) h += "<dt>Chair</dt><dd>" + esc(s.chair) + "</dd>";
    h += '<dt>Arrive by</dt><dd class="tnum">' + esc(fmt(s.s - P.arriveBeforeMinutes)) + "</dd>";
    if (s.isl) h += "<dt>Access</dt><dd>Indian Sign Language interpretation</dd>";
    h += "</dl>";
    var cats = (s.categories || []).map(function (c) { return '<span class="tag">' + esc(P.categories[c] || c) + "</span>"; }).join("");
    if (s.isl) cats = '<span class="tag isl">ISL interpreted</span>' + cats;
    if (cats) h += '<div class="tags">' + cats + "</div>";
    if (r) {
      h += '<p class="note">' + icon("walk") + "<span>About " + walkMin(r.len) + " min walk from " + esc(fromText(r)) + " to the " + (r.stepFree ? "step-free entrance of " + esc(v.short) : esc(v.short) + " entrance") + ". The route is on the map." + (v.note ? " " + esc(v.note) : "") + "</span></p>";
    }
    if (v.access && v.access.length) {
      if (!S.access) h += '<p class="note">' + icon("access") + '<span>This venue has a marked step-free entrance. <button class="link" type="button" data-act="stepfree">Route me there</button></span></p>';
    } else if (v.type !== "hub") h += '<p class="note">' + icon("access") + "<span>No step-free entrance is marked for this venue on the festival map. Ask at the festival desk.</span></p>";
    if (S.plan[s.id]) {
      var rm = remindAt(s);
      h += '<p class="note">' + icon("bell") + "<span>" + (REM.on ? "Reminder at " + esc(fmt(rm.at)) + ", time to walk over and arrive " + P.arriveBeforeMinutes + " min early." : 'Want a nudge when it\u2019s time to leave? <button class="link" type="button" data-act="remindon">Turn on reminders</button>') + "</span></p>";
    }
    var inPlan = !!S.plan[s.id];
    h += '<div class="actions">';
    h += '<button class="btn' + (inPlan ? "" : " primary") + '" type="button" data-act="plan" data-fk="b-' + esc(s.id) + '">' + icon(inPlan ? "check" : "bookmark") + (inPlan ? "In my plan" : "Add to my plan") + "</button>";
    if (ENV === "web") h += '<button class="btn" type="button" data-act="link">' + icon("link") + "Copy link</button>";
    h += "</div></div>";
    return h;
  }

  var listSig = "";
  function renderPanel(force) {
    var t = S.t, d = D();
    var sig = [S.tab, S.selected, S.venue, S.q, S.cat, S.isl, S.from, S.access, String(S.spot), String(lastGeoRender), REM.on, REM.lead, notifPermission(), String(FIT && FIT.n), Object.keys(S.plan).sort().join(","),
      d.sessions.map(function (s) { var st = stateAt(s, t); return st === "soon" ? "s" + Math.round(s.s - t) : st[0]; }).join("")].join("|");
    if (!force && sig === listSig) return;
    listSig = sig;
    var fk = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-fk");
    var searchFocused = document.activeElement && document.activeElement.id === "q";
    var caret = searchFocused ? document.activeElement.selectionStart : 0;

    $("#countProg").textContent = d.sessions.length;
    $("#countPlan").textContent = planList().length;
    $$(".tab").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === S.tab)); });
    scroller.setAttribute("aria-labelledby", "tab-" + S.tab);

    if (S.tab === "programme") renderProgramme(t);
    else if (S.tab === "plan") renderPlan(t);
    else renderInfo();

    if (fk) { var el = scroller.querySelector('[data-fk="' + fk + '"]'); if (el) el.focus({ preventScroll: true }); }
    if (searchFocused) { var q = $("#q"); if (q) { q.focus({ preventScroll: true }); try { q.setSelectionRange(caret, caret); } catch (e) {} } }
    var f = $(".filters", scroller);
    scroller.style.setProperty("--filters-h", (f ? f.offsetHeight : 0) + "px");
  }

  function renderProgramme(t) {
    var d = D(), ids = filteredIds();
    var cats = {};
    d.sessions.forEach(function (s) { (s.categories || []).forEach(function (c) { cats[c] = (cats[c] || 0) + 1; }); });
    var catList = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a] || a.localeCompare(b); });
    var islCount = d.sessions.filter(function (s) { return s.isl; }).length;

    var h = '<div class="filters">';
    h += '<div class="search">' + icon("search") + '<input id="q" type="search" placeholder="Search speakers, books, topics" autocomplete="off" value="' + esc(S.q) + '" aria-label="Search the programme">' + (S.q ? '<button class="clear" type="button" data-act="clearq" aria-label="Clear search">' + icon("close") + "</button>" : "") + "</div>";
    h += '<div class="chips" role="group" aria-label="Filter by topic">';
    h += '<button class="chip" type="button" data-act="cat" data-cat="" aria-pressed="' + (!S.cat) + '">All</button>';
    h += '<button class="chip" type="button" data-act="isl" aria-pressed="' + S.isl + '">ISL interpreted <span class="n">' + islCount + "</span></button>";
    catList.forEach(function (c) {
      h += '<button class="chip" type="button" data-act="cat" data-cat="' + esc(c) + '" aria-pressed="' + (S.cat === c) + '">' + esc(P.categories[c] || c) + ' <span class="n">' + cats[c] + "</span></button>";
    });
    h += "</div></div>";

    if (S.venue) {
      var v = VENUES[S.venue], vs = venueStatus(v.id, t), line = v.note || "";
      if (vs.state === "live") line = "On now: " + vs.session.title + ". " + line;
      else if (vs.state === "soon" || vs.state === "open") line = "Next: " + vs.session.title + " at " + fmt(vs.session.s) + ". " + line;
      else if (vs.state === "idle") line = "No more sessions here today. " + line;
      h += '<div class="venue-card"><div class="vc-main"><h3>' + esc(v.name) + "</h3><p>" + esc(line.trim()) + '</p></div><button class="icon-btn" type="button" data-act="clearvenue" aria-label="Show all venues">' + icon("close") + "</button></div>";
    }

    var shown = d.sessions.filter(function (s) { return ids[s.id]; });
    if (!shown.length) {
      if (S.venue && VENUES[S.venue].type === "hub") {
        h += '<div class="empty"><h3>No sessions at the Festival Hub</h3><p>It has the bookstore, book swap, book signing, food and the festival desk.</p><button class="btn" type="button" data-act="tab" data-tab="around">See what\u2019s around the campus</button></div>';
      } else {
        h += '<div class="empty"><h3>No sessions match</h3><p>Try another word, or clear the filters to see the whole day.</p><button class="btn" type="button" data-act="reset">Clear filters</button></div>';
      }
    } else {
      var groups = [];
      shown.forEach(function (s) {
        var g = groups[groups.length - 1];
        if (!g || g.s !== s.s) groups.push(g = { s: s.s, items: [] });
        g.items.push(s);
      });
      h += '<ul class="groups">';
      groups.forEach(function (g) {
        var anyLive = g.items.some(function (s) { return stateAt(s, t) === "live"; });
        var allDone = g.items.every(function (s) { return stateAt(s, t) === "done"; });
        var relTxt = anyLive ? "On now" : allDone ? "" : (g.s > t && g.s - t <= 180 ? relIn(g.s - t) : "");
        h += '<li data-start="' + g.s + '"><div class="group-h' + (anyLive ? " now" : "") + '">' + esc(fmt(g.s)) + (relTxt ? ' <span class="rel">' + esc(relTxt) + "</span>" : "") + "</div>";
        h += '<ul class="sessions">' + g.items.map(function (s) { return sessionCard(s, t); }).join("") + "</ul></li>";
      });
      h += "</ul>";
    }
    h += footer();
    scroller.innerHTML = h;
  }

  function clashesFor(list) {
    var notes = {};
    list.forEach(function (a, i) {
      list.forEach(function (b, j) {
        if (i === j) return;
        if (a.s < b.e && b.s < a.e) (notes[a.id] = notes[a.id] || []).push({ type: "clash", other: b });
      });
      var prev = list[i - 1];
      if (prev && !(prev.s < a.e && a.s < prev.e) && prev.venue !== a.venue) {
        var gap = a.s - prev.e;
        if (gap < P.arriveBeforeMinutes) (notes[a.id] = notes[a.id] || []).push({ type: "tight", other: prev, gap: gap });
      }
    });
    return notes;
  }

  function renderPlan(t) {
    var list = planList();
    var h = "";
    if (!list.length) {
      h += '<div class="empty"><h3>Your plan is empty</h3><p>Tap the bookmark on any session to add it. Your plan stays on this device, and clashes are flagged here.</p><button class="btn" type="button" data-act="tab" data-tab="programme">Browse the programme</button></div>';
      h += footer();
      scroller.innerHTML = h;
      return;
    }
    var notes = clashesFor(list), nClash = Object.keys(notes).filter(function (k) { return notes[k].some(function (n) { return n.type === "clash"; }); }).length;
    var first = list[0];
    h += '<div class="plan-head"><h2>Your ' + esc(D().label.split(" ")[0]) + "</h2>";
    h += "<p>" + list.length + (list.length === 1 ? " session" : " sessions") + ", starting " + esc(fmt(first.s)) + ". Booked seats are released 15 minutes before the start, so arrive by " + esc(fmt(first.s - P.arriveBeforeMinutes)) + "." + (nClash ? ' <span class="warn">' + nClash + " overlap.</span>" : "") + "</p>";
    h += '<div class="actions">';
    if (ENV !== "artifact") h += '<button class="btn primary" type="button" data-act="ics">' + icon("calendar") + "Add to calendar</button>";
    h += '<span id="clearSlot"><button class="btn danger" type="button" data-act="clearplan">Clear plan</button></span>';
    h += "</div>";
    h += remindCard();
    h += "</div>";
    h += '<ol class="itin">';
    list.forEach(function (s) {
      var st = stateAt(s, t);
      h += "<li>";
      h += '<span class="stop ' + (st === "live" ? "live" : st === "done" ? "done" : "") + '"></span>';
      h += '<div class="arrive">' + icon("door") + "Arrive by " + esc(fmt(s.s - P.arriveBeforeMinutes)) + " at " + esc(s.v.name) + "</div>";
      var rm = remindAt(s);
      h += '<button class="card" type="button" data-act="plansel" data-id="' + esc(s.id) + '"><span class="t">' + esc(s.title) + '</span><span class="m">' + esc(fmtRange(s.s, s.e)) + " " + badgeFor(s, t) + "</span>" +
        (REM.on && st !== "done" ? '<span class="m rm">' + icon("bell") + "Reminder " + esc(fmt(rm.at)) + ", " + esc(rm.travel.text) + "</span>" : "") + "</button>";
      (notes[s.id] || []).forEach(function (n) {
        if (n.type === "clash") h += '<div class="clash">' + icon("alert") + "<span>Overlaps with " + esc(n.other.title) + " (" + esc(fmtRange(n.other.s, n.other.e)) + ")</span></div>";
        else h += '<div class="clash">' + icon("clock") + "<span>Tight change: " + (n.gap <= 0 ? "starts as " : "only " + n.gap + " min after ") + esc(n.other.title) + (n.gap <= 0 ? " ends" : " ends") + ", at a different venue.</span></div>";
      });
      h += "</li>";
    });
    h += "</ol>";
    h += footer();
    scroller.innerHTML = h;
  }

  function remindCard() {
    var perm = notifPermission(), h = '<div class="remind-card">';
    h += '<div class="rc-row"><span class="rc-ic">' + icon("bell") + '</span><div class="rc-main"><b>Leave-now reminders</b><span>Timed from your walk to each venue, so you arrive ' + P.arriveBeforeMinutes + " minutes early.</span></div>";
    h += '<label class="switch"><input type="checkbox" id="remindToggle" data-act="remindtoggle"' + (REM.on ? " checked" : "") + '><span class="track-s"></span><span class="sr-only">Reminders</span></label></div>';
    if (REM.on) {
      h += '<div class="rc-row rc-lead"><label for="leadSel">Extra time before I leave</label><select id="leadSel">' +
        [0, 5, 10, 15, 30].map(function (m) { return '<option value="' + m + '"' + (m === REM.lead ? " selected" : "") + ">" + (m ? m + " min" : "None") + "</option>"; }).join("") + "</select></div>";
      var msg;
      if (perm === "granted") msg = "Notifications are on. Keep this app open or in the background on your phone.";
      else if (perm === "denied") msg = "Notifications are blocked for this site, so reminders will pop up inside the app while it's open.";
      else if (perm === "unsupported") msg = "This browser can't show notifications. Reminders will pop up inside the app while it's open. On iPhone, add the app to your Home Screen first.";
      else msg = "Allow notifications when asked, so reminders reach you even with the screen on another app.";
      h += '<p class="rc-note">' + esc(msg) + (ENV !== "artifact" ? " For an alert even when the app is closed, also add your plan to your calendar." : "") + "</p>";
      h += '<button class="btn" type="button" data-act="testremind">' + icon("bell") + "Send a test reminder</button>";
    }
    return h + "</div>";
  }

  function renderInfo() {
    var A = P.access || { notes: [], rules: [] };
    var h = '<section class="info"><h2>Accessibility</h2>';
    h += '<div class="remind-card"><div class="rc-row"><span class="rc-ic">' + icon("access") + '</span><div class="rc-main"><b>Step-free routes</b><span>Show the wheelchair-accessible entrances marked on the festival map, and route to them.</span></div>';
    h += '<label class="switch"><input type="checkbox" data-act="stepfreetoggle"' + (S.access ? " checked" : "") + '><span class="track-s"></span><span class="sr-only">Step-free routes</span></label></div></div>';
    h += '<ul class="info-list">';
    A.notes.forEach(function (n) {
      h += '<li><span class="info-ic">' + icon(n.icon) + '</span><span><span class="t">' + esc(n.title) + '</span><span class="d">' + esc(n.text) + "</span>" +
        (n.marker ? '<button class="link" type="button" data-act="amenroute" data-n="' + n.marker + '">Show me the way</button>' : "") +
        (n.icon === "hands" ? '<button class="link" type="button" data-act="islfilter">Show ISL sessions</button>' : "") + "</span></li>";
    });
    h += "</ul>";
    h += '<h3>Step-free entrances by venue</h3><ul class="venue-access">';
    C.venues.forEach(function (v) {
      var n = (v.access || []).length;
      h += '<li><button type="button" data-act="venueaccess" data-id="' + v.id + '"><span class="vdot ' + (v.type === "indoor" ? "indoor" : "outdoor") + '"></span><span class="t">' + esc(v.name) + '</span><span class="d">' + (n ? n + (n > 1 ? " marked entrances" : " marked entrance") : "Not marked, ask at the festival desk") + "</span></button></li>";
    });
    h += "</ul></section>";

    h += '<section class="info"><h2>Around the campus</h2><p class="info-intro">Open all day. Numbers match the markers on the map. Tap one for the way there.</p><ul class="around">';
    P.around.forEach(function (a) {
      h += '<li><button type="button" data-act="amenroute" data-n="' + a.marker + '"><span class="num">' + a.marker + '</span><span><span class="t">' + esc(a.title) + '</span><span class="d">' + esc(a.text) + "</span></span></button></li>";
    });
    h += "</ul></section>";

    h += '<section class="info"><h2>Good to know</h2><ul class="rules">' + A.rules.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></section>";
    h += setupPanel();
    h += footer();
    scroller.innerHTML = h;
  }

  /* One-time setup so the live GPS dot lands in the right place on this schematic map. */
  function setupTargets() {
    var t = C.gates.map(function (g) { return { id: g.id, label: g.name, map: g.at }; });
    C.venues.forEach(function (v) { if (v.entries && v.entries[0]) t.push({ id: "e-" + v.id, label: v.short + " entrance", map: v.entries[0].at }); });
    return t;
  }
  function setupPanel() {
    var showOpen = /[?&]setup\b|[?&]calibrate\b/.test(location.search || "");
    var local = []; try { local = JSON.parse(store(CAL_KEY) || "[]") || []; } catch (e) {}
    var h = '<details class="setup"' + (showOpen ? " open" : "") + '><summary>' + icon("locate") + "Live location setup, for organisers</summary><div class=\"setup-in\">";
    h += "<p>The festival map is a drawing, not to scale, so the app needs a few real GPS readings to place people on it. Do this once, on site:</p>";
    h += "<ol><li>Tap Start GPS and allow location.</li><li>Stand right at a gate or a venue entrance and wait until accuracy is under 15 m.</li><li>Tap that place below. Record at least two places far apart, ideally Gate 1, Gate 3 and two venue entrances.</li></ol>";
    var acc = ME.fix ? Math.round(ME.fix.acc) : null;
    h += '<div class="actions">' + (ME.on ? '<span class="gps-state' + (acc != null && acc <= 15 ? " good" : "") + '">' + (acc == null ? "Waiting for GPS…" : "GPS accuracy ±" + acc + " m") + "</span>" : '<button class="btn primary" type="button" data-act="setupgps">' + icon("locate") + "Start GPS</button>") + "</div>";
    h += '<div class="setup-grid">' + setupTargets().map(function (t) {
      var done = local.some(function (p) { return p.id === t.id; });
      return '<button class="btn' + (done ? " done" : "") + '" type="button" data-act="record" data-id="' + t.id + '"' + (ME.fix ? "" : " disabled") + ">" + (done ? icon("check") : "") + esc(t.label) + "</button>";
    }).join("") + "</div>";
    if (local.length) {
      h += "<p>" + local.length + " recorded on this phone." + (FIT ? " Live position is on for this phone (average fit error " + Math.round(FIT.err * mpu()) + " m)." : " Record one more place to turn on live position.") + "</p>";
      var json = JSON.stringify(local.map(function (p) { return { id: p.id, map: p.map, lat: +p.lat.toFixed(6), lon: +p.lon.toFixed(6), acc: p.acc }; }));
      h += "<p>To turn it on for everyone, send this to the developer, or paste it as <code>points</code> in data/campus.js:</p>";
      h += '<pre class="code" id="calibOut">' + esc(json) + "</pre>";
      h += '<div class="actions"><button class="btn" type="button" data-act="copycalib">' + icon("link") + 'Copy</button><button class="btn danger" type="button" data-act="clearcalib">Clear recordings</button></div>';
    }
    return h + "</div></details>";
  }
  function recordPoint(id) {
    if (!ME.fix) { toast("Waiting for GPS"); return; }
    var t = setupTargets().filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var local = []; try { local = JSON.parse(store(CAL_KEY) || "[]") || []; } catch (e) {}
    local = local.filter(function (p) { return p.id !== id; });
    local.push({ id: id, map: t.map, lat: ME.fix.lat, lon: ME.fix.lon, acc: Math.round(ME.fix.acc), t: new Date().toISOString() });
    store(CAL_KEY, JSON.stringify(local));
    fitGeo();
    if (ME.fix) onPos({ coords: { latitude: ME.fix.lat, longitude: ME.fix.lon, accuracy: ME.fix.acc } });
    toast("Recorded " + t.label + (ME.fix.acc > 15 ? " (accuracy was ±" + Math.round(ME.fix.acc) + " m)" : ""));
    render(true);
  }

  function footer() {
    return '<div class="foot"><span>Unofficial companion. Programme and map from the printed festival guide. Check <a href="' + esc(P.officialSite) + '" target="_blank" rel="noopener">litlive.in</a> for changes.</span><span>Developed by Somdeep Kundu. <button class="link" type="button" data-act="about">About this app</button></span></div>';
  }

  var listScrollTimer = null;
  function scheduleListScroll(force) {
    clearTimeout(listScrollTimer);
    listScrollTimer = setTimeout(function () {
      if (S.tab !== "programme" || (S.selected && !force)) return;
      var t = S.t, target = null;
      $$(".groups > li", scroller).some(function (li) {
        var ok = $$(".s", li).some(function (s) { var st = s.getAttribute("data-state"); return st !== "done"; });
        if (ok) { target = li; return true; }
        return false;
      });
      if (!target) return;
      var f = $(".filters", scroller), off = f ? f.offsetHeight : 0;
      scroller.scrollTo({ top: Math.max(0, target.offsetTop - off - 2), behavior: reduceMotion ? "auto" : "smooth" });
      void t;
    }, 160);
  }

  function bindPanel() {
    $$(".tab").forEach(function (b) {
      b.addEventListener("click", function () { setTab(b.getAttribute("data-tab")); });
      b.addEventListener("keydown", function (e) {
        var tabs = $$(".tab"), i = tabs.indexOf(b);
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          var n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
          n.focus(); setTab(n.getAttribute("data-tab"));
        }
      });
    });
    scroller.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var act = b.getAttribute("data-act"), li = b.closest(".s"), id = li && li.getAttribute("data-id");
      if (act === "toggle") selectSession(id, { fly: true, toggle: true });
      else if (act === "plan") togglePlan(id || b.getAttribute("data-id"));
      else if (act === "cat") { S.cat = b.getAttribute("data-cat") || null; render(true); }
      else if (act === "isl") { S.isl = !S.isl; render(true); }
      else if (act === "clearq") { S.q = ""; render(true); var q = $("#q"); if (q) q.focus(); }
      else if (act === "clearvenue") { S.venue = null; if (!S.selected) drawRoute(null); render(true); home(false); }
      else if (act === "reset") { S.q = ""; S.cat = null; S.isl = false; S.venue = null; render(true); }
      else if (act === "tab") setTab(b.getAttribute("data-tab"));
      else if (act === "plansel") { selectSession(b.getAttribute("data-id"), { fly: true }); }
      else if (act === "ics") downloadIcs();
      else if (act === "clearplan") {
        $("#clearSlot").innerHTML = '<span class="confirm">Clear all ' + planList().length + '? <button class="btn danger" type="button" data-act="clearyes">Clear</button><button class="btn" type="button" data-act="clearno">Keep</button></span>';
      }
      else if (act === "clearyes") { S.plan = {}; savePlan(); toast("Plan cleared"); render(true); }
      else if (act === "clearno") render(true);
      else if (act === "amen") flashAmenity(b.getAttribute("data-n"));
      else if (act === "amenroute") { var an = b.getAttribute("data-n"); revealMap(); flashAmenity(an, true); routeAmenity(an, true); }
      else if (act === "stepfree" || act === "stepfreetoggle") { setAccess(act === "stepfree" ? true : b.checked); }
      else if (act === "remindon") setReminders(true);
      else if (act === "remindtoggle") setReminders(b.checked);
      else if (act === "testremind") { var ps = planList()[0]; if (ps) fireReminder(ps, remindAt(ps), true); }
      else if (act === "islfilter") { S.isl = true; S.tab = "programme"; render(true); scroller.scrollTop = 0; }
      else if (act === "venueaccess") { revealMap(); setAccess(true, true); var vv = VENUES[b.getAttribute("data-id")]; if (vv.access && vv.access.length) fitBox(bbox(vv.access.concat(vv.shape)), { pad: 0.2, min: 420, maxK: 2 }); }
      else if (act === "setupgps") startLocate();
      else if (act === "record") recordPoint(b.getAttribute("data-id"));
      else if (act === "copycalib") { var tx = $("#calibOut").textContent; try { navigator.clipboard.writeText(tx).then(function () { toast("Copied"); }, function () { selectText($("#calibOut")); }); } catch (e) { selectText($("#calibOut")); } }
      else if (act === "clearcalib") { store(CAL_KEY, null); fitGeo(); if (ME.fix) onPos({ coords: { latitude: ME.fix.lat, longitude: ME.fix.lon, accuracy: ME.fix.acc } }); render(true); }
      else if (act === "about") openAbout();
      else if (act === "link") copyLink(S.selected);
    });
    scroller.addEventListener("input", function (e) {
      if (e.target.id === "q") { S.q = e.target.value; render(true); }
    });
    scroller.addEventListener("change", function (e) {
      if (e.target.id === "leadSel") { REM.lead = +e.target.value; store("lf-lead", String(REM.lead)); render(true); }
    });
    scroller.addEventListener("keydown", function (e) {
      if (e.target.id === "q" && e.key === "Escape") { S.q = ""; render(true); }
    });
  }

  function setTab(tab) {
    if (S.tab === tab) return;
    S.tab = tab;
    render(true);
    scroller.scrollTop = 0;
    if (tab === "programme") scheduleListScroll();
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */
  function selectSession(id, opts) {
    opts = opts || {};
    if (!id || !D().byId[id]) return;
    if (opts.toggle && S.selected === id) {
      S.selected = null;
      drawRoute(S.venue ? VENUES[S.venue] : null, false);
      setHash("");
      render(true);
      return;
    }
    S.selected = id;
    var s = D().byId[id];
    if (opts.fly !== false) revealMap();
    drawRoute(s.v, opts.fly !== false);
    setHash(id);
    if (S.tab === "around") S.tab = "programme";
    render(true);
    if (opts.scroll || S.tab === "programme") {
      requestAnimationFrame(function () {
        var el = scroller.querySelector('.s[data-id="' + id + '"]');
        if (!el) return;
        var f = $(".filters", scroller), off = (f ? f.offsetHeight : 0) + 34;
        var top = el.offsetTop, st = scroller.scrollTop;
        var parentTop = el.offsetParent === scroller ? 0 : 0;
        void parentTop;
        var rect = el.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
        if (rect.top < sr.top + off || rect.bottom > sr.bottom) scroller.scrollTo({ top: st + (rect.top - sr.top) - off, behavior: reduceMotion ? "auto" : "smooth" });
        void top;
      });
    }
  }
  function selectVenue(id, fly) {
    if (S.venue === id && !S.selected) { S.venue = null; drawRoute(null); render(true); home(false); return; }
    S.venue = id;
    S.selected = null;
    setHash("");
    S.tab = "programme";
    drawRoute(VENUES[id], !!fly);
    render(true);
    scroller.scrollTop = 0;
  }
  function togglePlan(id) {
    if (!id) return;
    var s = D().byId[id];
    if (S.plan[id]) { delete S.plan[id]; toast("Removed from your plan"); }
    else {
      S.plan[id] = true;
      var clash = planList().filter(function (o) { return o.id !== id && o.s < s.e && s.s < o.e; })[0];
      toast(clash ? "Added. It overlaps with " + clash.title : "Added to your plan");
    }
    savePlan();
    render(true);
  }
  function flashAmenity(n, noFit) {
    if (!S.amen) { S.amen = true; store("lf-amen", "1"); syncLayers(); }
    var pts = C.amenities[n] ? C.amenities[n].at : [];
    amenEls.forEach(function (g) { g.classList.remove("flash"); });
    void svg.getBoundingClientRect();
    amenEls.forEach(function (g) { if (g.getAttribute("data-n") === String(n)) g.classList.add("flash"); });
    if (pts.length && !noFit) fitBox(bbox(pts), { pad: 0.2, min: 420, maxK: 2 });
    clearTimeout(flashAmenity.t);
    flashAmenity.t = setTimeout(function () { amenEls.forEach(function (g) { g.classList.remove("flash"); }); }, 4000);
  }
  function setAccess(on, quiet) {
    S.access = on; store("lf-access", on ? "1" : "0");
    syncLayers(); refreshRoute(false); render(true);
    if (!quiet) toast(on ? "Step-free routes on" : "Step-free routes off");
  }
  function selectText(el) { try { var r = document.createRange(); r.selectNodeContents(el); var sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); toast("Selected. Copy it from here."); } catch (e) {} }
  function syncLayers() {
    $("#layerAmenG").classList.toggle("off", !S.amen);
    $("#layerAccessG").classList.toggle("off", !S.access);
    $("#layerAmen").setAttribute("aria-pressed", String(S.amen));
    $("#layerAccess").setAttribute("aria-pressed", String(S.access));
  }
  function setHash(id) {
    if (ENV === "artifact") return;
    try { history.replaceState(null, "", id ? "#" + id : location.pathname + location.search); } catch (e) {}
  }
  function copyLink(id) {
    var url = location.href.split("#")[0] + (id ? "#" + id : "");
    var done = function () { toast("Link copied"); };
    try {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt && done(); });
    } catch (e) { toast(url); }
  }
  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  function icsDate(day, m) {
    // IST is UTC+5:30 all year; convert to UTC so every calendar app reads it the same way.
    var parts = day.split("-").map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0) + (m - 330) * 60000);
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z";
  }
  function icsText(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function fold(line) { var out = [], i = 0; while (line.length - i > 74) { out.push((i ? " " : "") + line.slice(i, i + 74)); i += 74; } out.push((i ? " " : "") + line.slice(i)); return out.join("\r\n"); }
  function downloadIcs() {
    var list = planList(), d = D();
    if (!list.length) return;
    var stamp = icsDate(d.date, 0).slice(0, 8) + "T000000Z";
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LitFest Companion//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:LitFest " + d.short];
    list.forEach(function (s) {
      L.push("BEGIN:VEVENT");
      L.push("UID:" + d.date + "-" + s.id + "@litfest-companion");
      L.push("DTSTAMP:" + stamp);
      L.push("DTSTART:" + icsDate(d.date, s.s));
      L.push("DTEND:" + icsDate(d.date, s.e));
      L.push(fold("SUMMARY:" + icsText(s.title)));
      L.push(fold("LOCATION:" + icsText(s.v.name + ", " + P.venue)));
      L.push(fold("DESCRIPTION:" + icsText([s.subtitle, s.people, s.chair ? "Chair: " + s.chair : "", "Arrive by " + fmt(s.s - P.arriveBeforeMinutes) + ".", "Check " + P.officialSite + " for changes."].filter(Boolean).join("\n"))));
      L.push("BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT" + (P.arriveBeforeMinutes + 15) + "M", fold("DESCRIPTION:" + icsText("Head to " + s.v.name + " for " + s.title)), "END:VALARM");
      L.push("END:VEVENT");
    });
    L.push("END:VCALENDAR");
    try {
      var blob = new Blob([L.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "litfest-" + d.date + "-my-plan.ics";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast("Calendar file saved. Open it to add your plan.");
    } catch (e) { toast("This browser can't save the calendar file."); }
  }

  /* ------------------------------------------------------------------ */
  /* Header, theme, about                                                */
  /* ------------------------------------------------------------------ */
  function effectiveTheme() {
    var a = document.documentElement.getAttribute("data-theme");
    if (a) return a;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function renderThemeBtn() {
    var dark = effectiveTheme() === "dark", b = $("#themeBtn");
    b.innerHTML = icon(dark ? "sun" : "moon");
    b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", dark ? "#191623" : "#4B2C86");
  }
  function openAbout() {
    var d = $("#about");
    if (d.showModal) { try { d.showModal(); return; } catch (e) {} }
    d.setAttribute("open", "");
  }
  function renderClock() {
    var n = now(), d = D(), el = $("#clock"), txt = $("#clockText");
    var mode, html;
    if (n.date === d.date) {
      if (n.min < d.w0) { mode = "today"; html = '<span class="k">Today, opens</span> ' + esc(fmt(d.sessions[0].s)); }
      else if (n.min > d.w1) { mode = "over"; html = "That's a wrap"; }
      else { mode = "live"; html = '<span class="k">Live</span> ' + esc(fmt(n.min)); }
    } else if (n.date < d.date) { mode = "preview"; html = '<span class="k">Preview of</span> ' + esc(d.short); }
    else { mode = "over"; html = '<span class="k">Archive,</span> ' + esc(d.short); }
    if (el.getAttribute("data-mode") !== mode) el.setAttribute("data-mode", mode);
    if (txt.innerHTML !== html) txt.innerHTML = html;
    var pb = $("#previewBar");
    var showBar = n.date === d.date && !S.follow;
    pb.hidden = !showBar;
    if (showBar) $("#previewText").textContent = "Showing " + fmt(S.t) + ", not now";
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  var rq = false, rqForce = false;
  function render(force) {
    if (force) rqForce = true;
    if (rq) return;
    rq = true;
    requestAnimationFrame(function () {
      rq = false;
      var f = rqForce; rqForce = false;
      renderClock();
      renderShelf();
      renderMapState();
      renderPanel(f);
    });
  }

  function tick() {
    if (S.follow && isFestivalDay()) {
      var m = liveMinute();
      if (Math.floor(m) !== Math.floor(S.t)) { S.t = Math.floor(m); render(); }
    }
    renderClock();
    renderShelf();
    checkReminders();
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  function boot() {
    hydrateIcons(document);
    $("#zoomIn").innerHTML = icon("plus");
    $("#zoomOut").innerHTML = icon("minus");
    $("#zoomReset").innerHTML = icon("fit");
    $("#aboutBtn").innerHTML = icon("info");
    $("#aboutClose").innerHTML = icon("close");
    $("#versionLine").textContent = "Version " + VERSION + ". Programme for " + DAYS.map(function (d) { return d.label; }).join(", ") + ".";
    $("#brandSub").textContent = D().label + ", NCPA Mumbai";
    if (DAYS.length > 1) {
      var days = $("#days");
      days.hidden = false;
      days.innerHTML = DAYS.map(function (d, i) { return '<button class="chip" type="button" data-day="' + i + '" aria-pressed="' + (i === S.day) + '">' + esc(d.short) + "</button>"; }).join("");
      days.addEventListener("click", function (e) {
        var b = e.target.closest("[data-day]"); if (!b) return;
        S.day = +b.getAttribute("data-day"); S.selected = null; S.venue = null;
        $$("[data-day]", days).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        $("#brandSub").textContent = D().label + ", NCPA Mumbai";
        loadPlan(); initialTime(); buildShelf(); drawRoute(null); render(true); scheduleListScroll(true);
      });
    }

    buildMap();
    measure();
    if (mapwrap.clientWidth < 900) $("#legend").open = false;
    home(true);
    buildShelf();
    bindMapInput();
    bindShelf();
    bindPanel();
    bindSheet();

    $("#fromSel").addEventListener("change", function (e) {
      S.from = e.target.value; store("lf-from", S.from);
      refreshRoute(true);
      render(true);
    });
    $("#locateBtn").innerHTML = icon("locate");
    $("#locateBtn").addEventListener("click", function () { if (ME.on) stopLocate(); else startLocate(); });
    $("#spotBtn").addEventListener("click", function () {
      S.picking = !S.picking;
      mapwrap.classList.toggle("picking", S.picking);
      renderGeo();
    });
    $("#geoChip").addEventListener("click", function (e) {
      var b = e.target.closest("[data-geo]"); if (!b) return;
      var a = b.getAttribute("data-geo");
      if (a === "cancel") { S.picking = false; mapwrap.classList.remove("picking"); renderGeo(); }
      else if (a === "pick") { S.picking = true; mapwrap.classList.add("picking"); renderGeo(); }
      else if (a === "stop") stopLocate();
      else if (a === "dismiss") { ME.msg = ""; renderGeo(); }
    });
    $("#remindBanner").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.getAttribute("data-rb") === "show") { var id = this.getAttribute("data-id"); hideBanner(); if (id) selectSession(id, { fly: true, scroll: true }); }
      else hideBanner();
    });
    $("#rbClose").innerHTML = icon("close");
    renderGeo();
    $("#layerAmen").addEventListener("click", function () { S.amen = !S.amen; store("lf-amen", S.amen ? "1" : "0"); syncLayers(); });
    $("#layerAccess").addEventListener("click", function () { setAccess(!S.access); });
    syncLayers();
    var ctrls = $(".map-ctrl.tl"), shelfHead = $(".shelf-head");
    // The map toolbar lives in the timeline header, so nothing sits on top of the map itself.
    function placeControls() { if (ctrls.parentNode !== shelfHead) shelfHead.insertBefore(ctrls, $("#nowBtn")); }
    placeControls();
    if (isPhone()) { setSheet("peek", true); requestAnimationFrame(function () { setSheet("peek", true); home(true); }); }
    if (window.matchMedia) { var nq = window.matchMedia("(max-width: 820px)"); if (nq.addEventListener) nq.addEventListener("change", function () { placeControls(); buildShelf(); renderGeo(); render(true); if (isPhone()) setSheet(SHEET.state, true); else { $("#stage").style.removeProperty("--sheet-vis"); } setTimeout(function () { measure(); home(true); }, 50); }); }
    $("#themeBtn").addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      store("lf-theme", next);
      renderThemeBtn();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", renderThemeBtn);
    }
    renderThemeBtn();
    $("#aboutBtn").addEventListener("click", openAbout);
    $("#aboutClose").addEventListener("click", function () { var d = $("#about"); if (d.close) d.close(); else d.removeAttribute("open"); });
    $("#about").addEventListener("click", function (e) { if (e.target === this && this.close) this.close(); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        if (S.tab !== "programme") setTab("programme");
        requestAnimationFrame(function () { var q = $("#q"); if (q) { e.preventDefault(); q.focus(); } });
      } else if (e.key === "Escape" && !$("#about").open) {
        if (S.picking) { S.picking = false; mapwrap.classList.remove("picking"); renderGeo(); }
        else if (S.selected) selectSession(S.selected, { toggle: true });
        else if (S.venue) { S.venue = null; drawRoute(null); render(true); }
      }
    });

    // Deep link: #session-id opens that session.
    var h = (location.hash || "").replace(/^#/, "");
    if (h && D().byId[h]) { selectSession(h, { fly: false, scroll: true }); setTimeout(function () { drawRoute(D().byId[h].v, true); }, 60); }
    else { render(true); scheduleListScroll(true); }

    setInterval(tick, 15000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) tick(); });
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", function (e) {
      if (e.data && e.data.type === "open-session" && D().byId[e.data.id]) selectSession(e.data.id, { fly: true, scroll: true });
    });
    tick();

    if (ENV === "web" && "serviceWorker" in navigator && /^https?:$/.test(location.protocol) && window.top === window.self) {
      window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
    }
    window.LitFest = { version: VERSION, state: S, setTime: function (m) { setTime(m, true); }, select: selectSession, fix: function (lat, lon, acc) { ME.on = true; onPos({ coords: { latitude: lat, longitude: lon, accuracy: acc || 8 } }); }, remind: function () { var ps = planList()[0]; if (ps) fireReminder(ps, remindAt(ps), true); } };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
