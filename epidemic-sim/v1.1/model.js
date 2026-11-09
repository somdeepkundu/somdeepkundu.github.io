/* Spatial agent-based SIR model on real geography.
   Somdeep Kundu. MIT licence.
   Methods: Kermack & McKendrick (1927) SIR compartments; Monte Carlo simulation
   (Metropolis & Ulam 1949) with a seeded Mulberry32 generator; Poisson contact
   counts by Knuth's method; Euler integration for the mean-field ODE;
   Matheron (1963) semivariogram estimator; Moran (1950) spatial autocorrelation. */
(function (root) {
  "use strict";

  var DT = 0.1; // days per step

  // Study area (Mumbai, Thane, Navi Mumbai) and a local metric frame
  var BOX = { w: 72.77, s: 18.89, e: 73.13, n: 19.30 };
  var LAT0 = (BOX.s + BOX.n) / 2;
  var KX = 111320 * Math.cos(LAT0 * Math.PI / 180); // metres per degree lon
  var KY = 110574;                                   // metres per degree lat
  var WM = (BOX.e - BOX.w) * KX, HM = (BOX.n - BOX.s) * KY;

  function toXY(lon, lat) { return [(lon - BOX.w) * KX, (lat - BOX.s) * KY]; }
  function toLL(x, y) { return [BOX.w + x / KX, BOX.s + y / KY]; }

  // Town centres used for clustered placement
  var TOWNS = [["Colaba",18.915,72.823],["Dadar",19.021,72.843],["Bandra",19.058,72.84],["Andheri",19.12,72.85],
    ["Goregaon",19.165,72.85],["Borivali",19.235,72.855],["Mira Road",19.285,72.87],["Powai",19.12,72.905],
    ["Chembur",19.06,72.9],["Mulund",19.172,72.955],["Thane",19.2,72.97],["Airoli",19.155,73.0],
    ["Vashi",19.075,72.998],["Nerul",19.033,73.02],["Kharghar",19.045,73.068],["Ghatkopar",19.086,72.908],
    ["Kurla",19.07,72.88],["Malad",19.187,72.848]];

  var IITB = [72.9133, 19.1334];

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function poisson(lambda, r) {
    var L = Math.exp(-lambda), k = 0, p = 1;
    do { k++; p *= r(); } while (p > L);
    return k - 1;
  }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r()); }
  function between(r, lo, hi) { return lo + (hi - lo) * r(); }

  // Land mask: rasterise the land polygons with scanlines (even-odd rule)
  function LandMask(geo, cell) {
    this.cell = cell;
    this.gw = Math.ceil(WM / cell); this.gh = Math.ceil(HM / cell);
    var m = this.m = new Uint8Array(this.gw * this.gh);
    var rings = [];
    var polys = geo.type === "MultiPolygon" ? geo.coordinates : [geo.coordinates];
    polys.forEach(function (p) { p.forEach(function (ring) { rings.push(ring.map(function (c) { return toXY(c[0], c[1]); })); }); });
    for (var row = 0; row < this.gh; row++) {
      var y = (row + 0.5) * cell, xs = [];
      for (var k = 0; k < rings.length; k++) {
        var R = rings[k];
        for (var i = 0, j = R.length - 1; i < R.length; j = i++) {
          var a = R[i], b = R[j];
          if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
        }
      }
      xs.sort(function (p, q) { return p - q; });
      for (var t = 0; t + 1 < xs.length; t += 2) {
        var c0 = Math.max(0, Math.ceil(xs[t] / cell - 0.5)), c1 = Math.min(this.gw - 1, Math.floor(xs[t + 1] / cell - 0.5));
        for (var c = c0; c <= c1; c++) m[row * this.gw + c] = 1;
      }
    }
    var n = 0; for (var q = 0; q < m.length; q++) n += m[q];
    this.areaKm2 = n * cell * cell / 1e6;
  }
  LandMask.prototype.on = function (x, y) {
    if (x < 0 || y < 0 || x >= WM || y >= HM) return false;
    return this.m[Math.floor(y / this.cell) * this.gw + Math.floor(x / this.cell)] === 1;
  };

  /* Parameters:
     N, crLo/crHi (contacts per day), infLo/infHi (prob. per contact), durLo/durHi (days),
     init, vac (fraction), wan (days, 0 = off), rad (m), spd (km/day), days, seed,
     mode ("spatial" | "random"), place ("towns" | "uniform"), seedAt ([lon,lat] or null) */
  function Sim(p, mask) {
    this.p = p; this.mask = mask; this.N = p.N;
    var r = this.r = rng(p.seed), N = p.N;
    this.x = new Float32Array(N); this.y = new Float32Array(N); this.ang = new Float32Array(N);
    this.st = new Uint8Array(N); this.ever = new Uint8Array(N); this.vac = new Uint8Array(N);
    this.cr = new Float32Array(N); this.inf = new Float32Array(N); this.dur = new Float32Array(N);
    this.tInf = new Float32Array(N).fill(-1);
    for (var i = 0; i < N; i++) {
      var pt = this.randomPoint();
      this.x[i] = pt[0]; this.y[i] = pt[1];
      this.ang[i] = r() * 2 * Math.PI;
      this.cr[i] = between(r, p.crLo, p.crHi);
      this.inf[i] = between(r, p.infLo, p.infHi);
      this.dur[i] = between(r, p.durLo, p.durHi);
    }
    var nv = Math.round(p.vac * N);
    while (nv > 0) { var v = Math.floor(r() * N); if (this.st[v] === 0) { this.st[v] = 2; this.vac[v] = 1; nv--; } }
    this.seed(p.seedAt || null, p.init);
    this.stepNo = 0; this.t = 0;
    this.hist = { t: [], S: [], I: [], R: [] };
    this.peakI = 0; this.peakDay = 0;
    this.record();
  }
  Sim.prototype.randomPoint = function () {
    var r = this.r, x, y, tries = 0;
    do {
      if (this.p.place === "towns" && tries < 200) {
        var T = TOWNS[Math.floor(r() * TOWNS.length)], c = toXY(T[2], T[1]);
        x = c[0] + gauss(r) * 1500; y = c[1] + gauss(r) * 1500;
      } else { x = r() * WM; y = r() * HM; }
      tries++;
    } while (!this.mask.on(x, y) && tries < 5000);
    return [x, y];
  };
  // Infect k susceptible people: nearest to a point, or at random
  Sim.prototype.seed = function (at, k) {
    var N = this.N, i;
    if (at) {
      var c = toXY(at[0], at[1]), cand = [];
      for (i = 0; i < N; i++) if (this.st[i] === 0) {
        var dx = this.x[i] - c[0], dy = this.y[i] - c[1];
        cand.push([dx * dx + dy * dy, i]);
      }
      cand.sort(function (a, b) { return a[0] - b[0]; });
      for (i = 0; i < Math.min(k, cand.length); i++) this.infect(cand[i][1]);
    } else {
      var left = k, guard = 0;
      while (left > 0 && guard++ < N * 50) { var j = Math.floor(this.r() * N); if (this.st[j] === 0) { this.infect(j); left--; } }
    }
  };
  Sim.prototype.infect = function (i) { this.st[i] = 1; this.ever[i] = 1; this.tInf[i] = this.t || 0; };
  Sim.prototype.record = function () {
    var s = 0, i = 0, rc = 0;
    for (var j = 0; j < this.N; j++) { var v = this.st[j]; if (v === 0) s++; else if (v === 1) i++; else rc++; }
    this.last = { S: s, I: i, R: rc };
    this.hist.t.push(this.t); this.hist.S.push(s); this.hist.I.push(i); this.hist.R.push(rc);
    if (i > this.peakI) { this.peakI = i; this.peakDay = this.t; }
  };
  Sim.prototype.move = function () {
    var v = this.p.spd * 1000 * DT, r = this.r;
    if (v <= 0) return;
    for (var i = 0; i < this.N; i++) {
      this.ang[i] += (r() - 0.5) * 0.8;
      var nx = this.x[i] + Math.cos(this.ang[i]) * v, ny = this.y[i] + Math.sin(this.ang[i]) * v;
      if (this.mask.on(nx, ny)) { this.x[i] = nx; this.y[i] = ny; }
      else this.ang[i] += Math.PI * (0.5 + r()); // turn back from the sea or the edge
    }
  };
  Sim.prototype.buildGrid = function () {
    var R = this.p.rad;
    this.gw = Math.ceil(WM / R); this.gh = Math.ceil(HM / R);
    if (!this.head || this.head.length !== this.gw * this.gh) this.head = new Int32Array(this.gw * this.gh);
    if (!this.nxt) this.nxt = new Int32Array(this.N);
    this.head.fill(-1);
    for (var i = 0; i < this.N; i++) {
      var c = Math.min(this.gh - 1, Math.floor(this.y[i] / R)) * this.gw + Math.min(this.gw - 1, Math.floor(this.x[i] / R));
      this.nxt[i] = this.head[c]; this.head[c] = i;
    }
  };
  Sim.prototype.neighbours = function (i, out) {
    out.length = 0;
    var R = this.p.rad, R2 = R * R, x = this.x[i], y = this.y[i];
    var cx = Math.min(this.gw - 1, Math.floor(x / R)), cy = Math.min(this.gh - 1, Math.floor(y / R));
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var gx = cx + dx, gy = cy + dy;
      if (gx < 0 || gy < 0 || gx >= this.gw || gy >= this.gh) continue;
      for (var j = this.head[gy * this.gw + gx]; j !== -1; j = this.nxt[j]) {
        if (j === i) continue;
        var ddx = this.x[j] - x, ddy = this.y[j] - y;
        if (ddx * ddx + ddy * ddy <= R2) out.push(j);
      }
    }
    return out;
  };
  Sim.prototype.step = function () {
    var p = this.p, r = this.r, N = this.N, i, k;
    this.move();
    var infected = [];
    for (i = 0; i < N; i++) if (this.st[i] === 1) infected.push(i);
    var spatial = p.mode === "spatial", buf = [];
    if (spatial) this.buildGrid();
    this.t = (this.stepNo + 1) * DT;
    for (k = 0; k < infected.length; k++) {
      i = infected[k];
      var n = poisson(this.cr[i] * DT, r);
      if (n === 0) continue;
      if (spatial) { this.neighbours(i, buf); if (!buf.length) continue; }
      for (var c = 0; c < n; c++) {
        var tg = spatial ? buf[Math.floor(r() * buf.length)] : Math.floor(r() * N);
        if (this.st[tg] === 0 && r() < this.inf[i]) this.infect(tg);
      }
    }
    for (k = 0; k < infected.length; k++) {
      i = infected[k];
      if (r() < DT / this.dur[i]) this.st[i] = 2;
    }
    if (p.wan > 0) for (i = 0; i < N; i++) if (this.st[i] === 2 && r() < DT / p.wan) { this.st[i] = 0; this.vac[i] = 0; }
    this.stepNo++;
    this.record();
  };
  Object.defineProperty(Sim.prototype, "done", { get: function () { return this.t >= this.p.days - 1e-9; } });
  Sim.prototype.lonlat = function (i) { return toLL(this.x[i], this.y[i]); };

  // Mean-field SIR (well mixed), Euler steps, using the mid-point of each range
  function runSD(p) {
    var cr = (p.crLo + p.crHi) / 2, inf = (p.infLo + p.infHi) / 2, dur = (p.durLo + p.durHi) / 2, N = p.N;
    var R = Math.round(p.vac * N), I = Math.min(p.init, N - R), S = N - R - I;
    var h = { t: [0], S: [S], I: [I], R: [R] }, steps = Math.round(p.days / DT);
    for (var k = 1; k <= steps; k++) {
      var a = cr * inf * S * I / N, b = I / dur, w = p.wan > 0 ? R / p.wan : 0;
      S += (w - a) * DT; I += (a - b) * DT; R += (b - w) * DT;
      h.t.push(k * DT); h.S.push(S); h.I.push(I); h.R.push(R);
    }
    return h;
  }

  // Final size of the classic SIR epidemic: z = 1 - exp(-R0 z)
  function finalSize(R0) {
    if (R0 <= 1) return 0;
    var z = 0.5;
    for (var k = 0; k < 200; k++) z = 1 - Math.exp(-R0 * z);
    return z;
  }

  // Empirical semivariogram (Matheron) of an indicator z over distance bins
  function semivariogram(sim, z, maxLag, nBins) {
    var g = new Float64Array(nBins), c = new Float64Array(nBins), w = maxLag / nBins, N = sim.N;
    for (var i = 0; i < N; i++) {
      var xi = sim.x[i], yi = sim.y[i], zi = z[i];
      for (var j = i + 1; j < N; j++) {
        var dx = sim.x[j] - xi, dy = sim.y[j] - yi, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= maxLag) continue;
        var b = Math.floor(d / w), dz = zi - z[j];
        g[b] += dz * dz; c[b]++;
      }
    }
    var out = [], mean = 0;
    for (i = 0; i < N; i++) mean += z[i];
    mean /= N;
    for (var k = 0; k < nBins; k++) out.push({ h: (k + 0.5) * w, gamma: c[k] ? g[k] / (2 * c[k]) : null, pairs: c[k] });
    return { bins: out, sill: mean * (1 - mean), mean: mean };
  }

  // Global Moran's I with binary weights for pairs within distance d
  function moransI(sim, z, d) {
    var N = sim.N, mean = 0, i, j;
    for (i = 0; i < N; i++) mean += z[i];
    mean /= N;
    var num = 0, den = 0, W = 0, d2 = d * d;
    for (i = 0; i < N; i++) den += (z[i] - mean) * (z[i] - mean);
    if (den === 0) return null;
    for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
      var dx = sim.x[j] - sim.x[i], dy = sim.y[j] - sim.y[i];
      if (dx * dx + dy * dy <= d2) { num += 2 * (z[i] - mean) * (z[j] - mean); W += 2; }
    }
    if (W === 0) return null;
    return { I: (N / W) * (num / den), expected: -1 / (N - 1) };
  }

  var API = { DT: DT, BOX: BOX, WM: WM, HM: HM, IITB: IITB, TOWNS: TOWNS, toXY: toXY, toLL: toLL,
    rng: rng, poisson: poisson, LandMask: LandMask, Sim: Sim, runSD: runSD, finalSize: finalSize,
    semivariogram: semivariogram, moransI: moransI };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.EpiModel = API;
})(this);
