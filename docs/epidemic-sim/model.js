/* Spatial agent-based SIR model on real geography.  v1.2
   Somdeep Kundu. MIT licence.
   Methods: Kermack & McKendrick (1927) SIR compartments; Monte Carlo simulation
   (Metropolis & Ulam 1949) with a seeded Mulberry32 generator; Poisson counts by
   Knuth's method; Euler integration for the mean-field ODE; gravity model with
   exponential distance decay for commuting (Wilson 1971); Matheron (1963)
   semivariogram; Moran (1950) spatial autocorrelation. */
(function (root) {
  "use strict";

  var DT = 0.1; // days per step

  // Study area (Mumbai, Thane, Navi Mumbai, Mira-Bhayandar) and a local metric frame
  var BOX = { w: 72.77, s: 18.89, e: 73.13, n: 19.34 };
  var LAT0 = (BOX.s + BOX.n) / 2;
  var KX = 111320 * Math.cos(LAT0 * Math.PI / 180); // metres per degree lon
  var KY = 110574;                                   // metres per degree lat
  var WM = (BOX.e - BOX.w) * KX, HM = (BOX.n - BOX.s) * KY;

  function toXY(lon, lat) { return [(lon - BOX.w) * KX, (lat - BOX.s) * KY]; }
  function toLL(x, y) { return [BOX.w + x / KX, BOX.s + y / KY]; }

  var TOWNS = [["Colaba",18.915,72.823],["Dadar",19.021,72.843],["Bandra",19.058,72.84],["Andheri",19.12,72.85],
    ["Goregaon",19.165,72.85],["Borivali",19.235,72.855],["Mira Road",19.285,72.87],["Powai",19.12,72.905],
    ["Chembur",19.06,72.9],["Mulund",19.172,72.955],["Thane",19.2,72.97],["Airoli",19.155,73.0],
    ["Vashi",19.075,72.998],["Nerul",19.033,73.02],["Kharghar",19.045,73.068],["Ghatkopar",19.086,72.908],
    ["Kurla",19.07,72.88],["Malad",19.187,72.848]];

  // Job centres used as commuting destinations. Weights are illustrative, not measured.
  var HUBS = [["Fort and Nariman Point",72.830,18.932,3],["Lower Parel",72.828,19.000,2.2],["Bandra Kurla Complex",72.866,19.065,3],
    ["Andheri East and SEEPZ",72.872,19.118,2.5],["Powai",72.906,19.118,1.5],["Goregaon and Malad",72.852,19.172,1.5],
    ["Thane Wagle Estate",72.955,19.200,1.2],["Vashi and Turbhe",73.005,19.070,1.5],["Airoli and Mahape",73.010,19.140,1]];

  // Where travellers arrive from outside the region
  var GATEWAYS = [["Chhatrapati Shivaji Maharaj Terminus",72.8355,18.9398],["Mumbai Central",72.8195,18.9696],
    ["Dadar",72.8434,19.0186],["Lokmanya Tilak Terminus",72.8905,19.0688],["Bandra Terminus",72.8406,19.0626],
    ["Mumbai airport",72.8679,19.0896],["Thane",72.9781,19.1860]];

  var IITB = [72.9133, 19.1334];
  var WORK_START = 0.375, WORK_END = 0.75; // 9 am to 6 pm

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
    if (lambda <= 0) return 0;
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
  }
  LandMask.prototype.on = function (x, y) {
    if (x < 0 || y < 0 || x >= WM || y >= HM) return false;
    return this.m[Math.floor(y / this.cell) * this.gw + Math.floor(x / this.cell)] === 1;
  };

  // Census population raster (built by tools/epidemic-sim/build_population.py)
  function decodeRLE(b64, n) {
    var bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
    var out = new Uint16Array(n), k = 0;
    for (var i = 0; i + 3 < bin.length; i += 4) {
      var v = bin.charCodeAt(i) | bin.charCodeAt(i + 1) << 8, c = bin.charCodeAt(i + 2) | bin.charCodeAt(i + 3) << 8;
      out.fill(v, k, k + c); k += c;
    }
    return out;
  }
  function Population(data, mask) {
    this.zones = data.zones; this.cell = data.cell; this.gw = data.gw; this.gh = data.gh;
    this.zone = decodeRLE(data.zone, data.gw * data.gh);
    this.slum = decodeRLE(data.slum, data.gw * data.gh);
    this.mask = mask;
    this.total = 0;
    for (var i = 0; i < this.zones.length; i++) this.total += this.zones[i].pop;
    this.cache = {};
  }
  // Cumulative weights over cells for a given slum share
  Population.prototype.cdf = function (slumShare) {
    var key = slumShare.toFixed(3);
    if (this.cache[key]) return this.cache[key];
    var n = this.gw * this.gh, zones = this.zones, i, z;
    var land = new Int32Array(zones.length + 1), landSlum = new Int32Array(zones.length + 1);
    for (i = 0; i < n; i++) {
      z = this.zone[i];
      if (!z || !this.cellOnLand(i)) continue;
      land[z]++; if (this.slum[i]) landSlum[z]++;
    }
    var cum = new Float64Array(n), acc = 0;
    for (i = 0; i < n; i++) {
      z = this.zone[i];
      if (z && this.cellOnLand(i)) {
        var Z = zones[z - 1], s = landSlum[z] > 0 && land[z] > landSlum[z] ? slumShare : landSlum[z] / Math.max(1, land[z]);
        acc += this.slum[i] ? Z.pop * s / landSlum[z] : Z.pop * (1 - s) / (land[z] - landSlum[z]);
      }
      cum[i] = acc;
    }
    this.cache[key] = cum;
    return cum;
  };
  // People per km² of land in each zone
  Population.prototype.densities = function () {
    if (this.dens) return this.dens;
    var km2 = new Float64Array(this.zones.length + 1), d = new Float64Array(this.zones.length + 1), i;
    for (i = 0; i < this.zone.length; i++) if (this.zone[i] && this.cellOnLand(i)) km2[this.zone[i]] += this.cell * this.cell / 1e6;
    for (i = 1; i <= this.zones.length; i++) d[i] = km2[i] ? this.zones[i - 1].pop / km2[i] : 0;
    this.dens = d;
    return d;
  };
  Population.prototype.cellOnLand = function (i) {
    var x = (i % this.gw + 0.5) * this.cell, y = (Math.floor(i / this.gw) + 0.5) * this.cell;
    return this.mask.on(x, y);
  };
  Population.prototype.sample = function (cum, r) {
    var u = r() * cum[cum.length - 1], lo = 0, hi = cum.length - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (cum[mid] < u) lo = mid + 1; else hi = mid; }
    var x = (lo % this.gw + r()) * this.cell, y = (Math.floor(lo / this.gw) + r()) * this.cell;
    return [x, y, this.zone[lo]];
  };
  Population.prototype.zoneAt = function (x, y) {
    var c = Math.floor(x / this.cell), r = Math.floor(y / this.cell);
    if (c < 0 || r < 0 || c >= this.gw || r >= this.gh) return 0;
    return this.zone[r * this.gw + c];
  };

  /* Parameters:
     N, crLo/crHi (contacts per day), infLo/infHi (prob. per contact), durLo/durHi (days),
     init, wan (days of immunity after infection, 0 = for ever), rad (m), wander (m), days, seed,
     vaccination: v1 (share given dose 1), v2 (share of dose-1 people given dose 2), v3 (share of
     dose-2 people given a booster), e1/e2/e3 (protection against infection after each dose, 0-1),
     vStart (day the campaign starts), vRoll (days to give each round), vGap (days between doses),
     vHalf (days for vaccine protection to halve, 0 = never), vOrder ("random" | "dense" | "commuters"),
     mode ("spatial" | "random"), place ("census" | "towns" | "uniform"), slum (fraction),
     commute (fraction), commuteKm (km), stopDay (day, 0 = never), imports (per day),
     seedAt ([lon,lat] or null) */
  function Sim(p, mask, pop) {
    this.p = p; this.mask = mask; this.pop = pop || null; this.N = p.N;
    var r = this.r = rng(p.seed), N = p.N, i;
    this.hx = new Float32Array(N); this.hy = new Float32Array(N);
    this.wx = new Float32Array(N); this.wy = new Float32Array(N); this.com = new Uint8Array(N);
    this.x = new Float32Array(N); this.y = new Float32Array(N);
    this.ox = new Float32Array(N); this.oy = new Float32Array(N);
    this.zone = new Uint16Array(N);
    this.st = new Uint8Array(N); this.ever = new Uint8Array(N);
    this.cr = new Float32Array(N); this.inf = new Float32Array(N); this.dur = new Float32Array(N);
    this.tInf = new Float32Array(N).fill(-1);
    var cum = p.place === "census" && this.pop ? this.pop.cdf(p.slum) : null;
    for (i = 0; i < N; i++) {
      var pt = cum ? this.pop.sample(cum, r) : this.randomPoint();
      this.hx[i] = pt[0]; this.hy[i] = pt[1];
      this.zone[i] = cum ? pt[2] : (this.pop ? this.pop.zoneAt(pt[0], pt[1]) : 0);
      this.cr[i] = between(r, p.crLo, p.crHi);
      this.inf[i] = between(r, p.infLo, p.infHi);
      this.dur[i] = between(r, p.durLo, p.durHi);
      if (r() < p.commute) {
        var w = this.workplace(pt[0], pt[1]);
        if (w) { this.com[i] = 1; this.wx[i] = w[0]; this.wy[i] = w[1]; }
      }
      this.x[i] = this.hx[i]; this.y[i] = this.hy[i];
    }
    this.scale = this.pop && p.place === "census" ? this.pop.total / N : 0;
    this.t = 0; this.planVaccines();
    this.seed(p.seedAt || null, p.init);
    this.stepNo = 0; this.t = 0; this.imported = 0;
    this.hist = { t: [], S: [], I: [], R: [], V1: [], V2: [] };
    this.peakI = 0; this.peakDay = 0;
    this.record();
  }
  // ---- Vaccination: a leaky vaccine given in up to three rounds ----
  // Each person gets a planned day for each dose. Doses are given on that day unless the person is ill then.
  Sim.prototype.planVaccines = function () {
    var p = this.p, r = this.r, N = this.N, i;
    this.doses = new Uint8Array(N); this.tDose = new Float32Array(N);
    this.plan = [new Float32Array(N).fill(-1), new Float32Array(N).fill(-1), new Float32Array(N).fill(-1)];
    this.given = [0, 0, 0];
    var v1 = p.v1 || 0;
    if (v1 <= 0) return;
    var order = [];
    for (i = 0; i < N; i++) order.push(i);
    var key = new Float64Array(N), self = this, dens = this.pop ? this.pop.densities() : null;
    for (i = 0; i < N; i++) {
      key[i] = r(); // random tie-break
      if (p.vOrder === "dense" && dens) key[i] -= dens[this.zone[i]] || 0;
      if (p.vOrder === "commuters") key[i] -= this.com[i] ? 1e9 : 0;
    }
    order.sort(function (a, b) { return key[a] - key[b]; });
    var n1 = Math.round(v1 * N), roll = Math.max(0, p.vRoll || 0), gap = Math.max(0, p.vGap || 0), start = p.vStart || 0;
    for (var k = 0; k < n1; k++) {
      i = order[k];
      var t1 = start + (n1 > 1 ? roll * k / (n1 - 1) : 0);
      this.plan[0][i] = t1;
      if (r() < (p.v2 || 0)) {
        this.plan[1][i] = t1 + gap;
        if (r() < (p.v3 || 0)) this.plan[2][i] = t1 + 2 * gap;
      }
    }
    this.giveDoses(); // doses planned for day 0
  };
  Sim.prototype.giveDoses = function () {
    var t = this.t, N = this.N;
    for (var d = 0; d < 3; d++) {
      var P = this.plan[d];
      for (var i = 0; i < N; i++) {
        if (P[i] < 0 || P[i] > t + 1e-9 || this.doses[i] !== d || this.st[i] === 1) continue;
        this.doses[i] = d + 1; this.tDose[i] = t; P[i] = -1; this.given[d]++;
      }
    }
  };
  Sim.prototype.protection = function (i) {
    var d = this.doses[i];
    if (!d) return 0;
    var p = this.p, e = d === 1 ? p.e1 : d === 2 ? p.e2 : p.e3;
    if (p.vHalf > 0) e *= Math.pow(0.5, (this.t - this.tDose[i]) / p.vHalf);
    return e;
  };
  Sim.prototype.doseCounts = function () {
    var c = [0, 0, 0];
    for (var i = 0; i < this.N; i++) { var d = this.doses[i]; if (d >= 1) c[0]++; if (d >= 2) c[1]++; if (d >= 3) c[2]++; }
    return c;
  };
  Sim.prototype.randomPoint = function () {
    var r = this.r, x, y, tries = 0;
    do {
      if (this.p.place === "towns" && tries < 200) {
        var T = TOWNS[Math.floor(r() * TOWNS.length)], c = toXY(T[2], T[1]);
        x = c[0] + gauss(r) * 1500; y = c[1] + gauss(r) * 1500;
      } else { x = r() * WM; y = r() * HM; }
      tries++;
    } while (!this.mask.on(x, y) && tries < 5000);
    return [x, y, 0];
  };
  // Gravity model: hub j is chosen with probability proportional to weight_j * exp(-distance / commuteKm)
  Sim.prototype.workplace = function (x, y) {
    var r = this.r, beta = Math.max(0.5, this.p.commuteKm) * 1000, w = [], tot = 0, j;
    for (j = 0; j < HUBS.length; j++) {
      var c = toXY(HUBS[j][1], HUBS[j][2]), d = Math.hypot(c[0] - x, c[1] - y);
      w.push(HUBS[j][3] * Math.exp(-d / beta)); tot += w[j];
    }
    var u = r() * tot;
    for (j = 0; j < HUBS.length; j++) { u -= w[j]; if (u <= 0) break; }
    j = Math.min(j, HUBS.length - 1);
    var h = toXY(HUBS[j][1], HUBS[j][2]);
    for (var k = 0; k < 50; k++) {
      var wx = h[0] + gauss(r) * 900, wy = h[1] + gauss(r) * 900;
      if (this.mask.on(wx, wy)) return [wx, wy];
    }
    return null;
  };
  Sim.prototype.atWork = function () {
    var f = this.t - Math.floor(this.t), p = this.p;
    return f >= WORK_START && f < WORK_END && !(p.stopDay > 0 && this.t >= p.stopDay);
  };
  // Infect k susceptible people: nearest to a point, or at random
  Sim.prototype.seed = function (at, k) {
    var N = this.N, i, n = 0;
    if (at) {
      var c = toXY(at[0], at[1]), cand = [];
      for (i = 0; i < N; i++) if (this.st[i] === 0) {
        var dx = this.x[i] - c[0], dy = this.y[i] - c[1];
        cand.push([dx * dx + dy * dy, i]);
      }
      cand.sort(function (a, b) { return a[0] - b[0]; });
      for (i = 0; i < Math.min(k, cand.length); i++) { this.infect(cand[i][1]); n++; }
    } else {
      var guard = 0;
      while (n < k && guard++ < N * 50) { var j = Math.floor(this.r() * N); if (this.st[j] === 0) { this.infect(j); n++; } }
    }
    return n;
  };
  Sim.prototype.infect = function (i) { this.st[i] = 1; this.ever[i] = 1; this.tInf[i] = this.t || 0; };
  Sim.prototype.record = function () {
    var s = 0, i = 0, rc = 0;
    for (var j = 0; j < this.N; j++) { var v = this.st[j]; if (v === 0) s++; else if (v === 1) i++; else rc++; }
    this.last = { S: s, I: i, R: rc };
    var v1 = 0, v2 = 0;
    if (this.doses) for (var q = 0; q < this.N; q++) { if (this.doses[q] >= 1) v1++; if (this.doses[q] >= 2) v2++; }
    this.hist.V1.push(v1); this.hist.V2.push(v2);
    this.hist.t.push(this.t); this.hist.S.push(s); this.hist.I.push(i); this.hist.R.push(rc);
    if (i > this.peakI) { this.peakI = i; this.peakDay = this.t; }
  };
  // Each person wanders around an anchor: home, or work during working hours
  Sim.prototype.move = function () {
    var r = this.r, sd = this.p.wander, work = this.atWork(), keep = 0.8, kick = sd * Math.sqrt(1 - keep * keep);
    for (var i = 0; i < this.N; i++) {
      var ax = work && this.com[i] ? this.wx[i] : this.hx[i], ay = work && this.com[i] ? this.wy[i] : this.hy[i];
      var nox = this.ox[i] * keep + gauss(r) * kick, noy = this.oy[i] * keep + gauss(r) * kick;
      if (this.mask.on(ax + nox, ay + noy)) { this.ox[i] = nox; this.oy[i] = noy; }
      else if (!this.mask.on(ax + this.ox[i], ay + this.oy[i])) { this.ox[i] = 0; this.oy[i] = 0; }
      this.x[i] = ax + this.ox[i]; this.y[i] = ay + this.oy[i];
    }
  };
  Sim.prototype.buildGrid = function () {
    var R = this.p.rad;
    this.gw = Math.ceil(WM / R); this.gh = Math.ceil(HM / R);
    if (!this.head || this.head.length !== this.gw * this.gh) this.head = new Int32Array(this.gw * this.gh);
    if (!this.nxt) this.nxt = new Int32Array(this.N);
    this.head.fill(-1);
    for (var i = 0; i < this.N; i++) {
      var c = Math.min(this.gh - 1, Math.max(0, Math.floor(this.y[i] / R))) * this.gw + Math.min(this.gw - 1, Math.max(0, Math.floor(this.x[i] / R)));
      this.nxt[i] = this.head[c]; this.head[c] = i;
    }
  };
  Sim.prototype.neighbours = function (i, out) {
    out.length = 0;
    var R = this.p.rad, R2 = R * R, x = this.x[i], y = this.y[i];
    var cx = Math.min(this.gw - 1, Math.max(0, Math.floor(x / R))), cy = Math.min(this.gh - 1, Math.max(0, Math.floor(y / R)));
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
  // Infected travellers arrive at a gateway; the nearest susceptible person there is infected
  Sim.prototype.importCases = function () {
    var n = poisson(this.p.imports * DT, this.r);
    for (var k = 0; k < n; k++) {
      var g = GATEWAYS[Math.floor(this.r() * GATEWAYS.length)];
      this.imported += this.seed([g[1], g[2]], 1);
    }
  };
  Sim.prototype.step = function () {
    var p = this.p, r = this.r, N = this.N, i, k;
    this.t = (this.stepNo + 1) * DT;
    this.move();
    this.giveDoses();
    if (p.imports > 0) this.importCases();
    var infected = [];
    for (i = 0; i < N; i++) if (this.st[i] === 1) infected.push(i);
    var spatial = p.mode === "spatial", buf = [];
    if (spatial) this.buildGrid();
    for (k = 0; k < infected.length; k++) {
      i = infected[k];
      var n = poisson(this.cr[i] * DT, r);
      if (n === 0) continue;
      if (spatial) { this.neighbours(i, buf); if (!buf.length) continue; }
      for (var c = 0; c < n; c++) {
        var tg = spatial ? buf[Math.floor(r() * buf.length)] : Math.floor(r() * N);
        if (this.st[tg] === 0 && r() < this.inf[i] * (1 - this.protection(tg))) this.infect(tg);
      }
    }
    for (k = 0; k < infected.length; k++) {
      i = infected[k];
      if (r() < DT / this.dur[i]) this.st[i] = 2;
    }
    if (p.wan > 0) for (i = 0; i < N; i++) if (this.st[i] === 2 && r() < DT / p.wan) this.st[i] = 0;
    this.stepNo++;
    this.record();
  };
  Object.defineProperty(Sim.prototype, "done", { get: function () { return this.t >= this.p.days - 1e-9; } });
  Sim.prototype.lonlat = function (i) { return toLL(this.x[i], this.y[i]); };
  // People and share ever infected by home zone
  Sim.prototype.zoneStats = function () {
    var nz = this.pop ? this.pop.zones.length + 1 : 1, n = new Int32Array(nz), e = new Int32Array(nz);
    for (var i = 0; i < this.N; i++) { n[this.zone[i]]++; e[this.zone[i]] += this.ever[i]; }
    return { n: n, ever: e };
  };

  // Mean-field SIR (well mixed), Euler steps, using the mid-point of each range
  function runSD(p) {
    var cr = (p.crLo + p.crHi) / 2, inf = (p.infLo + p.infHi) / 2, dur = (p.durLo + p.durHi) / 2, N = p.N;
    var I = Math.min(p.init, N), S = N - I, R = 0;
    var h = { t: [0], S: [S], I: [I], R: [R] }, steps = Math.round(p.days / DT);
    // average protection of the population on day t, from the vaccine schedule (doses given at an even rate)
    var cover = function (t, d) {
      var start = (p.vStart || 0) + d * (p.vGap || 0), roll = p.vRoll || 0, share = (p.v1 || 0) * (d >= 1 ? p.v2 || 0 : 1) * (d >= 2 ? p.v3 || 0 : 1);
      if (t < start) return 0;
      return share * (roll > 0 ? Math.min(1, (t - start) / roll) : 1);
    };
    var prot = function (t) {
      var c1 = cover(t, 0), c2 = cover(t, 1), c3 = cover(t, 2);
      var w = p.vHalf > 0 ? Math.pow(0.5, Math.max(0, (t - (p.vStart || 0) - (p.vRoll || 0) / 2)) / p.vHalf) : 1;
      return ((c1 - c2) * p.e1 + (c2 - c3) * p.e2 + c3 * p.e3) * w;
    };
    for (var k = 1; k <= steps; k++) {
      var t = k * DT, f = 1 - prot(t);
      var a = (cr * inf * S * I / N + (S > 0 ? (p.imports || 0) * S / N : 0)) * f, b = I / dur, w = p.wan > 0 ? R / p.wan : 0;
      S += (w - a) * DT; I += (a - b) * DT; R += (b - w) * DT;
      h.t.push(t); h.S.push(S); h.I.push(I); h.R.push(R);
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

  // Empirical semivariogram (Matheron) of an indicator z over distance bins, using home locations
  function semivariogram(sim, z, maxLag, nBins) {
    var g = new Float64Array(nBins), c = new Float64Array(nBins), w = maxLag / nBins, N = sim.N, X = sim.hx, Y = sim.hy;
    for (var i = 0; i < N; i++) {
      var xi = X[i], yi = Y[i], zi = z[i];
      for (var j = i + 1; j < N; j++) {
        var dx = X[j] - xi, dy = Y[j] - yi, d = Math.sqrt(dx * dx + dy * dy);
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

  // Global Moran's I with binary weights for pairs of homes within distance d
  function moransI(sim, z, d) {
    var N = sim.N, mean = 0, i, j, X = sim.hx, Y = sim.hy;
    for (i = 0; i < N; i++) mean += z[i];
    mean /= N;
    var num = 0, den = 0, W = 0, d2 = d * d;
    for (i = 0; i < N; i++) den += (z[i] - mean) * (z[i] - mean);
    if (den === 0) return null;
    for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
      var dx = X[j] - X[i], dy = Y[j] - Y[i];
      if (dx * dx + dy * dy <= d2) { num += 2 * (z[i] - mean) * (z[j] - mean); W += 2; }
    }
    if (W === 0) return null;
    return { I: (N / W) * (num / den), expected: -1 / (N - 1) };
  }

  var API = { VERSION: "1.2", DT: DT, BOX: BOX, WM: WM, HM: HM, IITB: IITB, TOWNS: TOWNS, HUBS: HUBS, GATEWAYS: GATEWAYS,
    toXY: toXY, toLL: toLL, rng: rng, poisson: poisson, LandMask: LandMask, Population: Population, Sim: Sim,
    runSD: runSD, finalSize: finalSize, semivariogram: semivariogram, moransI: moransI };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.EpiModel = API;
})(this);
