/* Gram Suvidha Map: village-level amenities from OpenStreetMap, on the viewer's own village boundaries.
   Keep APP.version equal to VERSION in sw.js and package.json. */
"use strict";
const APP = { version: "1.2.1", defaultPlace: "Hiware Bazar, Ahmednagar", near: 3000 };
const $ = id => document.getElementById(id);

/* Every string from OSM or the village file is untrusted: escape for HTML, neutralise formulas for CSV. */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function csvCell(v){
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const fmtN = n => Math.round(n).toLocaleString("en-IN");

/* ---------- amenity categories ---------- */
const CATS = [
  {id:"health",    label:"Health",                    color:"#d1495b"},
  {id:"education", label:"Education & Anganwadi",     color:"#3f51b5"},
  {id:"water",     label:"Water & sanitation",        color:"#1f8fb4"},
  {id:"agri",      label:"Agriculture & veterinary",  color:"#5f8a2b"},
  {id:"finance",   label:"Bank, ATM & post",          color:"#c98a12"},
  {id:"gov",       label:"Panchayat & public offices",color:"#7b4fa3"},
  {id:"transport", label:"Transport & fuel",          color:"#4a5862"},
  {id:"market",    label:"Shops, markets & food",     color:"#d9702a"},
  {id:"religion",  label:"Places of worship",         color:"#9c6b4e"},
  {id:"leisure",   label:"Play & recreation",         color:"#2f9e7a"},
  {id:"other",     label:"Other",                     color:"#8a948e"}
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
const SKIP = ["bench","waste_basket","parking","parking_space","bicycle_parking","motorcycle_parking","telephone","post_box","clock","shelter","hunting_stand","vending_machine"];

function classify(t){
  const a = t.amenity, s = t.shop, mm = t.man_made;
  if (a === "veterinary" || ["agrarian","farm","garden_centre","feed"].includes(s) || mm === "silo" || t.craft === "agricultural_engines" || a === "animal_breeding") return "agri";
  if (["hospital","clinic","doctors","dentist","pharmacy","health_post","nursing_home"].includes(a) || t.healthcare) return "health";
  if (["school","college","university","kindergarten","library","childcare","training","prep_school"].includes(a)) return "education";
  if (["drinking_water","water_point","toilets","shower","waste_disposal","recycling"].includes(a) ||
      ["water_well","water_tower","water_works","storage_tank","pumping_station","wastewater_plant"].includes(mm)) return "water";
  if (["bank","atm","post_office","bureau_de_change","money_lender"].includes(a)) return "finance";
  if (["townhall","police","fire_station","courthouse","community_centre","social_facility","public_building","village_hall"].includes(a) ||
      ["government","administrative"].includes(t.office)) return "gov";
  if (a === "place_of_worship" || a === "monastery") return "religion";
  if (a === "bus_station" || t.highway === "bus_stop" || ["station","halt"].includes(t.railway) || ["fuel","taxi"].includes(a)) return "transport";
  if (a === "marketplace" || s || ["restaurant","cafe","fast_food","food_court"].includes(a)) return "market";
  if (t.leisure || ["theatre","cinema","arts_centre"].includes(a)) return "leisure";
  return "other";
}
const NICE = {
  townhall:"Town hall / Gram Panchayat", kindergarten:"Kindergarten / Anganwadi", drinking_water:"Drinking water tap",
  water_well:"Well / borewell", water_tower:"Overhead water tank", storage_tank:"Storage tank", water_works:"Water works",
  pumping_station:"Pumping station", toilets:"Public toilet", doctors:"Doctor", clinic:"Clinic", hospital:"Hospital",
  pharmacy:"Pharmacy", health_post:"Health sub-centre", veterinary:"Veterinary hospital", agrarian:"Agri-input shop",
  bank:"Bank", atm:"ATM", post_office:"Post office", bus_stop:"Bus stop", bus_station:"Bus stand", fuel:"Fuel pump",
  marketplace:"Market / haat", community_centre:"Community hall", police:"Police station", school:"School",
  college:"College", library:"Library", playground:"Playground", pitch:"Sports ground", convenience:"General store",
  supermarket:"Supermarket", station:"Railway station", halt:"Railway halt"
};
const WORSHIP = {hindu:"Temple", muslim:"Mosque", christian:"Church", sikh:"Gurdwara", buddhist:"Buddhist vihara", jain:"Jain temple"};
const cap = s => { s = String(s).replace(/_/g, " "); return s.charAt(0).toUpperCase() + s.slice(1); };
function typeLabel(t){
  if (t.amenity === "place_of_worship") return WORSHIP[t.religion] || "Place of worship";
  if (t.amenity) return NICE[t.amenity] || cap(t.amenity);
  if (t.highway === "bus_stop") return NICE.bus_stop;
  if (t.railway) return NICE[t.railway] || cap(t.railway);
  if (t.shop) return NICE[t.shop] || cap(t.shop) + " shop";
  if (t.man_made) return NICE[t.man_made] || cap(t.man_made);
  if (t.healthcare) return cap(t.healthcare);
  if (t.office) return cap(t.office) + " office";
  if (t.leisure) return NICE[t.leisure] || cap(t.leisure);
  if (t.craft) return cap(t.craft);
  return "Feature";
}

/* ---------- basic services (scorecard and district scan) ---------- */
const ESSENTIALS = [
  {label:"School",           short:"School",     test:t => ["school","college"].includes(t.amenity)},
  {label:"Anganwadi",        short:"Anganwadi",  test:t => ["kindergarten","childcare"].includes(t.amenity) || /anganwadi/i.test(t.name || "")},
  {label:"Health facility",  short:"Health",     test:t => classify(t) === "health"},
  {label:"Drinking water",   short:"Water",      test:t => ["drinking_water","water_point"].includes(t.amenity) || ["water_well","water_tower","water_works","storage_tank"].includes(t.man_made)},
  {label:"Bank or ATM",      short:"Bank/ATM",   test:t => ["bank","atm"].includes(t.amenity)},
  {label:"Post office",      short:"Post",       test:t => t.amenity === "post_office"},
  {label:"Bus stop",         short:"Bus stop",   test:t => t.highway === "bus_stop" || t.amenity === "bus_station"},
  {label:"Panchayat office", short:"Panchayat",  test:t => t.amenity === "townhall" || t.office === "government" || /panchayat/i.test(t.name || "")},
  {label:"Market or ration shop", short:"Market", test:t => t.amenity === "marketplace" || !!t.shop},
  {label:"Veterinary care",  short:"Vet",        test:t => t.amenity === "veterinary"}
];

/* ---------- village colour scale (seaborn "mako", light = low) ---------- */
const MAKO = ["#DEF5E5", "#9AE0BA", "#4CC2AD", "#3497A9", "#3B6CA3", "#40498E"];
const METRICS = {
  density: {label:"People per km²",        get:f => f.density,         fmt:v => fmtN(v)},
  pop:     {label:"Population",            get:f => f.pop || null,     fmt:v => fmtN(v)},
  hh:      {label:"Households",            get:f => f.hh || null,      fmt:v => fmtN(v)},
  hhsize:  {label:"People per household",  get:f => f.hhsize,          fmt:v => v.toFixed(1)},
  score:   {label:"Basic services mapped", get:f => state.scan ? (state.scan.byVillage.get(f.id)?.size || 0) : null, fmt:v => v + "/10", fixed:[0,1,2,3,5,7,11]}
};

/* ---------- map ---------- */
const map = L.map("map").setView([20.6, 78.9], 5);
const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:"© OpenStreetMap contributors"}).addTo(map);
const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {maxZoom:19, attribution:"Imagery © Esri, Maxar, Earthstar Geographics"});
L.control.layers({"OSM map":osm, "Satellite (Esri)":sat}, null, {position:"topright"}).addTo(map);
L.control.scale({imperial:false}).addTo(map);
map.createPane("villages").style.zIndex = 350;
const vRenderer = L.canvas({pane:"villages", tolerance:2});

const villageLayer = L.layerGroup().addTo(map);
map.createPane("vlabels").style.zIndex = 450;               // above village fills, below amenity markers
map.getPane("vlabels").style.pointerEvents = "none";
const labelLayer = L.layerGroup().addTo(map);
map.createPane("amenities").style.zIndex = 640;            // OSM amenities always on top (popups stay above at 700)
const amenRenderer = L.svg({pane:"amenities"});
const LABEL_ZOOM = 12, LABEL_MAX = 350;
const areaLayer = L.layerGroup().addTo(map);
const catLayers = Object.fromEntries(CATS.map(c => [c.id, L.layerGroup().addTo(map)]));
const state = {place:null, feats:[], hidden:new Set(["other"]), seq:0, shape:null, data:null,
               labels:(() => { try { return localStorage.getItem("gs-labels") !== "off"; } catch { return true; } })(),
               dist:null, village:null, vlayers:new Map(), metric:"density", breaks:[], scan:null, bin:null, hover:null, tab:"overview"};

const legend = L.control({position:"bottomleft"});
legend.onAdd = () => { const d = L.DomUtil.create("div", "legend"); L.DomEvent.disableClickPropagation(d); return d; };
legend.addTo(map);

/* village names: on/off, drawn only for villages in view once zoomed in enough to read them */
const labelCtl = L.control({position:"topright"});
labelCtl.onAdd = () => {
  const d = L.DomUtil.create("div", "leaflet-bar labelctl");
  const b = L.DomUtil.create("button", "", d);
  b.type = "button"; b.id = "labelBtn";
  L.DomEvent.disableClickPropagation(d);
  b.onclick = () => {
    state.labels = !state.labels;
    try { localStorage.setItem("gs-labels", state.labels ? "on" : "off"); } catch {}
    updateLabels();
  };
  return d;
};
labelCtl.addTo(map);
function updateLabels(){
  labelLayer.clearLayers();
  const btn = $("labelBtn"), d = state.dist, z = map.getZoom();
  if (btn){
    btn.hidden = !d;
    btn.setAttribute("aria-pressed", String(state.labels));
    btn.textContent = "Village names: " + (state.labels ? "on" : "off");
    btn.title = state.labels && z < LABEL_ZOOM ? "Zoom in to see names" : "";
    btn.classList.toggle("dim", state.labels && z < LABEL_ZOOM);
  }
  if (!state.labels || !d || z < LABEL_ZOOM) return;
  const view = map.getBounds().pad(0.1);
  const inView = d.feats.filter(f => view.contains([f.c[1], f.c[0]]));
  inView.sort((a, b) => (b.id === state.village?.id) - (a.id === state.village?.id) || b.pop - a.pop);
  inView.slice(0, LABEL_MAX).forEach(f => {
    const p = f.properties, sel = f.id === state.village?.id;
    L.marker([f.c[1], f.c[0]], {pane:"vlabels", interactive:false, keyboard:false,
      icon:L.divIcon({className:"vlabel" + (sel ? " sel" : ""), html:`<span>${esc(p.vill_name || p.name)}</span>`, iconSize:null})}).addTo(labelLayer);
  });
}
map.on("zoomend moveend", updateLabels);

map.on("click", async e => {
  const {lat, lng} = e.latlng;
  if (state.data){
    const hit = await Villages.locate(lat, lng).catch(() => null);
    if (hit) return selectVillage(hit.d, hit.f);
  }
  const div = document.createElement("div"); div.className = "pop";
  const b1 = document.createElement("b"); b1.textContent = state.data ? "This spot is outside your village file" : "Map amenities here?";
  const t = document.createElement("div"); t.className = "t mono"; t.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const btn = document.createElement("button"); btn.type = "button"; btn.textContent = "Map within " + fmtKm(radius());
  btn.onclick = () => { map.closePopup(); load(pinPlace(lat, lng)); };
  div.append(b1, t, btn);
  L.popup().setLatLng(e.latlng).setContent(div).openOn(map);
});
const pinPlace = (lat, lon) => ({name:"Dropped pin", meta:`${lat.toFixed(5)}, ${lon.toFixed(5)}`, lat, lon, pin:true});

/* ---------- helpers ---------- */
const radius = () => +$("radius").value;
const fmtKm = m => m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(m < 10000 ? 1 : 0) + " km";
$("radius").addEventListener("input", () => $("radiusVal").textContent = fmtKm(radius()));
$("radius").addEventListener("change", () => { if (state.place && state.place.mode === "radius") load(state.place); });

function status(msg, kind){
  const el = $("status");
  if (!msg){ el.hidden = true; return; }
  el.hidden = false; el.className = "status" + (kind === "err" ? " err" : "");
  el.replaceChildren();
  if (kind === "busy"){ const d = document.createElement("span"); d.className = "dot"; el.append(d); }
  el.append(msg);
  if (kind === "ok") setTimeout(() => { if (el.textContent === msg) el.hidden = true; }, 3500);
}
function dist(a, b, c, d){
  const R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r;
  const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const cssVar = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#2e3f97";
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ---------- Nominatim ---------- */
async function nominatim(q){
  const u = "https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&polygon_threshold=0.0002&addressdetails=1&limit=8&countrycodes=in&accept-language=en&q=" + encodeURIComponent(q);
  const r = await fetch(u);
  if (!r.ok) throw new Error("Place search failed (HTTP " + r.status + "). Try again in a moment.");
  return r.json();
}
function placeFromResult(r){
  const ad = r.address || {};
  const name = ad.village || ad.hamlet || ad.town || ad.suburb || ad.city || r.name || String(r.display_name).split(",")[0];
  const meta = [ad.subdistrict || ad.county, ad.state_district, ad.state].filter(Boolean).join(" · ");
  const geo = r.geojson && /Polygon/.test(r.geojson.type) ? r.geojson : null;
  const bb = (r.boundingbox || [0,0,0,0]).map(Number);
  const km2 = dist(bb[0], bb[2], bb[1], bb[2]) * dist(bb[0], bb[2], bb[0], bb[3]) / 1e6;
  let areaId = null;
  if (geo && km2 < 300){
    if (r.osm_type === "relation") areaId = 3600000000 + Number(r.osm_id);
    else if (r.osm_type === "way") areaId = 2400000000 + Number(r.osm_id);
  }
  return {name, meta, lat:+r.lat, lon:+r.lon, geo:areaId ? geo : null, areaId, type:r.type};
}
/* An OSM place: snap to the village polygon when the viewer has village boundaries */
async function goPlace(p){
  if (state.data){
    const hit = await Villages.locate(p.lat, p.lon).catch(() => null);
    if (hit) return selectVillage(hit.d, hit.f);
  }
  return load(p);
}

/* ---------- search: the viewer's villages first, then OSM ---------- */
const box = $("results");
function resultRow(title, sub, onPick){
  const b = document.createElement("button"); b.type = "button";
  const n = document.createElement("b"); n.textContent = title;
  const m = document.createElement("span"); m.textContent = sub;
  b.append(n, m); b.onclick = () => { box.hidden = true; onPick(); };
  return b;
}
function renderResults(local, osm){
  box.replaceChildren();
  if (local && local.length){
    const h = document.createElement("p"); h.className = "rhead"; h.textContent = "Your villages"; box.append(h);
    local.forEach(r => box.append(resultRow(r.name, `${r.subdist} · ${r.district} · ${r.pop ? fmtN(r.pop) + " people" : "no population"}`, () => pickById(r.key, r.id))));
  }
  if (osm && osm.length){
    const h = document.createElement("p"); h.className = "rhead"; h.textContent = "OpenStreetMap places"; box.append(h);
    osm.forEach(r => { const p = placeFromResult(r); box.append(resultRow(p.name, (p.meta || r.display_name) + " · " + p.type, () => goPlace(p))); });
  }
  box.hidden = !box.children.length;
}
async function pickById(key, id){
  try {
    const d = await Villages.district(key), f = d.feats.find(x => x.id === id);
    if (f) selectVillage(d, f);
  } catch (err){ status(err.message, "err"); }
}
$("q").addEventListener("input", debounce(async () => {
  if (!state.data) return;
  const q = $("q").value.trim();
  if (q.length < 2){ box.hidden = true; return; }
  renderResults(await Villages.search(q), null);
}, 160));
$("searchForm").addEventListener("submit", async e => {
  e.preventDefault();
  const q = $("q").value.trim(); if (!q) return;
  status("Searching for “" + q + "”…", "busy");
  try {
    const local = state.data ? await Villages.search(q, 5) : [];
    const res = await nominatim(q);
    if (!res.length && !local.length){ box.hidden = true; status("No place called “" + q + "” found in India. Try adding the district.", "err"); return; }
    status(null);
    if (!local.length && res.length === 1){ box.hidden = true; goPlace(placeFromResult(res[0])); return; }
    renderResults(local, res);
  } catch (err){ status(err.message, "err"); }
});

/* ---------- Overpass ---------- */
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
function buildQuery(sel, prefix){
  const f = [
    "[amenity]", "[shop]", "[healthcare]", "[highway=bus_stop]", '[railway~"^(station|halt)$"]',
    '[man_made~"^(water_well|water_tower|water_works|storage_tank|pumping_station|wastewater_plant|silo)$"]',
    '[office~"^(government|administrative)$"]', '[leisure~"^(playground|pitch|park|sports_centre|stadium)$"]', "[craft=agricultural_engines]"
  ];
  return `[out:json][timeout:60];${prefix}(${f.map(x => `nwr${sel}${x};`).join("")});out center tags;`;
}
function buildScanQuery(bb){
  const s = `(${bb[1]},${bb[0]},${bb[3]},${bb[2]})`;
  const f = ['[amenity~"^(school|college|kindergarten|childcare|hospital|clinic|doctors|dentist|pharmacy|health_post|nursing_home|drinking_water|water_point|bank|atm|post_office|bus_station|townhall|marketplace|veterinary)$"]',
    "[healthcare]", "[highway=bus_stop]", '[man_made~"^(water_well|water_tower|water_works|storage_tank)$"]', "[office=government]",
    '[shop~"^(convenience|supermarket|general|kiosk|grocery)$"]'];
  return `[out:json][timeout:120][maxsize:268435456];(${f.map(x => `nwr${s}${x};`).join("")});out center tags;`;
}
async function overpass(q){
  let last;
  for (const ep of ENDPOINTS){
    try {
      const r = await fetch(ep + "?data=" + encodeURIComponent(q));
      if (r.ok) return await r.json();
      last = new Error(r.status === 429 || r.status === 504 ? "Overpass servers are busy. Wait a minute and try again." : "Overpass error (HTTP " + r.status + ").");
    } catch (e){ last = new Error("Could not reach Overpass. Check your connection; places you opened before still work offline."); }
  }
  throw last;
}
function toFeats(elements, origin, inside){
  const seen = new Set(); let dropped = 0;
  const out = elements.map(el => {
    const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null || !el.tags){ dropped++; return null; }
    const key = el.type + "/" + el.id; if (seen.has(key)) return null; seen.add(key);
    const t = el.tags, cat = classify(t);
    if (cat === "other" && SKIP.includes(t.amenity)) return null;
    return {osm:key, lat, lon, tags:t, cat, type:typeLabel(t), name:t.name || t["name:en"] || "",
            d:dist(origin[0], origin[1], lat, lon), inside:inside ? inside(lon, lat) : true};
  }).filter(Boolean).sort((a, b) => (b.inside - a.inside) || (a.d - b.d));
  if (dropped) console.info(`Gram Suvidha: ${dropped} OSM element(s) without position or tags were skipped.`);
  return out;
}
function drawAmenities(){
  Object.values(catLayers).forEach(l => l.clearLayers());
  state.feats.forEach(f => {
    f.marker = L.circleMarker([f.lat, f.lon], f.inside
        ? {radius:7, color:"#fff", weight:1.5, fillColor:CAT[f.cat].color, fillOpacity:.95, pane:"amenities", renderer:amenRenderer}
        : {radius:5, color:CAT[f.cat].color, weight:1.5, fillColor:"#fff", fillOpacity:.85, pane:"amenities", renderer:amenRenderer})
      .bindPopup(() => popup(f)).bindTooltip(esc(f.name || f.type), {direction:"top", offset:[0, -6]});
    f.marker.addTo(catLayers[f.cat]);
  });
  applyVisibility();
}

/* ---------- radius / OSM-boundary mode (no village file, or outside it) ---------- */
async function load(place){
  const my = ++state.seq;
  state.place = place; state.village = null;
  box.hidden = true;
  status("Collecting amenities for " + place.name + "…", "busy");
  let data = null, mode = "radius";
  try {
    if (place.areaId){
      data = await overpass(buildQuery("(area.a)", `area(${place.areaId})->.a;`)); mode = "boundary";
      if (!data.elements.length){ data = null; mode = "radius"; }
    }
    if (!data) data = await overpass(buildQuery(`(around:${radius()},${place.lat},${place.lon})`, ""));
  } catch (err){ if (my === state.seq) status(err.message, "err"); return; }
  if (my !== state.seq) return;
  place.mode = mode;
  clearDistrict();
  areaLayer.clearLayers();
  const style = {color:cssVar("--indigo"), weight:2, dashArray:"6 5", fillOpacity:.04};
  const shape = mode === "boundary" && place.geo ? L.geoJSON(place.geo, {style}) : L.circle([place.lat, place.lon], {radius:radius(), ...style});
  shape.addTo(areaLayer); state.shape = shape;
  map.fitBounds(shape.getBounds(), {padding:[24, 24]});
  L.circleMarker([place.lat, place.lon], {radius:5, color:"#fff", weight:2, fillColor:"#1c2420", fillOpacity:1}).bindTooltip("Centre").addTo(areaLayer);
  state.feats = toFeats(data.elements, [place.lat, place.lon], null);
  drawAmenities();
  render();
  writeUrl();
  status(state.feats.length + " amenities mapped in OSM", "ok");
}

/* ---------- village mode ---------- */
function clearDistrict(){
  villageLayer.clearLayers(); labelLayer.clearLayers(); state.vlayers.clear(); state.dist = null; state.scan = null; state.bin = null; state.binIndex = null;
  updateLegend();
}
function computeBreaks(){
  const m = METRICS[state.metric];
  if (m.fixed){ state.breaks = m.fixed; return; }
  const v = state.dist.feats.map(m.get).filter(x => x != null && isFinite(x) && x > 0).sort((a, b) => a - b);
  if (!v.length){ state.breaks = []; return; }
  const q = p => v[Math.min(v.length - 1, Math.floor(p * v.length))];
  state.breaks = [v[0], q(1/6), q(2/6), q(3/6), q(4/6), q(5/6), v[v.length - 1] * 1.0001];
}
function colourFor(f){
  const v = METRICS[state.metric].get(f), b = state.breaks;
  if (v == null || !isFinite(v) || (state.metric !== "score" && v <= 0) || !b.length) return null;
  for (let i = 1; i < b.length; i++) if (v < b[i]) return MAKO[Math.min(i - 1, MAKO.length - 1)];
  return MAKO[MAKO.length - 1];
}
function styleFor(f){
  const c = colourFor(f), sel = state.village && f.id === state.village.id, hov = state.hover === f.id;
  let op = c ? .58 : .35;
  if (state.bin){ const lp = f.pop > 0 ? Math.log10(f.pop) : null; if (!(lp != null && lp >= state.bin[0] && lp < state.bin[1])) op = .07; }
  if (sel) op = c ? .4 : .2;
  return {renderer:vRenderer, pane:"villages", color: sel ? cssVar("--indigo") : hov ? cssVar("--ink") : "#ffffff",
          weight: sel ? 3.2 : hov ? 2.4 : .7, opacity: 1, fillColor: c || "#c7ccd1", fillOpacity: op};
}
function restyle(){ state.vlayers.forEach((l, id) => { l.setStyle(styleFor(l.feature)); if (id === state.village?.id || id === state.hover) l.bringToFront(); }); }
function drawDistrict(d){
  clearDistrict();
  state.dist = d;
  if (state.metric === "score") state.metric = "density";
  computeBreaks();
  L.geoJSON(d.feats, {
    renderer:vRenderer, pane:"villages", style:styleFor,
    onEachFeature:(f, l) => {
      state.vlayers.set(f.id, l);
      l.bindTooltip(() => {
        const p = f.properties, m = METRICS[state.metric], v = m.get(f);
        return `<b>${esc(p.vill_name || p.name)}</b><br>${esc(m.label)}: ${v != null && isFinite(v) ? esc(m.fmt(v)) : "–"}`;
      }, {sticky:true, direction:"top", className:"vtip"});
      l.on("click", e => { L.DomEvent.stop(e); selectVillage(d, f); });
    }
  }).addTo(villageLayer);
  updateLegend();
}
function updateLegend(){
  const el = legend.getContainer();
  if (!el) return;
  if (!state.dist || !state.breaks.length){ el.hidden = true; return; }
  const m = METRICS[state.metric], b = state.breaks;
  el.hidden = false;
  el.innerHTML = `<b>${esc(m.label)}</b>` + MAKO.slice(0, b.length - 1).map((c, i) =>
    `<div><i style="background:${c}"></i>${esc(m.fixed ? (b[i + 1] - 1 > b[i] ? b[i] + "–" + (b[i + 1] - 1) : String(b[i])) : m.fmt(b[i]) + "–" + m.fmt(b[i + 1]))}</div>`).join("") +
    `<div><i style="background:#c7ccd1"></i>No data</div>`;
}
function hoverVillage(id){
  const prev = state.hover; state.hover = id;
  [prev, id].forEach(x => { const l = x != null && state.vlayers.get(x); if (l) l.setStyle(styleFor(l.feature)); });
  const l = id != null && state.vlayers.get(id); if (l) l.bringToFront();
  const s = state.village && state.vlayers.get(state.village.id); if (s) s.bringToFront();
}

async function selectVillage(d, f, opts = {}){
  const my = ++state.seq;
  box.hidden = true;
  if (!state.dist || state.dist.key !== d.key) drawDistrict(d);
  state.village = f; state.hover = null;
  const p = f.properties;
  state.place = {name:p.vill_name || p.name, meta:[p.subdist && p.subdist + " taluka", p.district, p.state].filter(Boolean).join(" · "),
                 lat:f.c[1], lon:f.c[0], mode:"village"};
  restyle(); updateLabels();
  areaLayer.clearLayers();
  state.shape = L.geoJSON(f.geometry, {style:{color:cssVar("--indigo"), weight:3, fill:false}, interactive:false}).addTo(areaLayer);
  if (opts.fit !== false) map.fitBounds(state.shape.getBounds(), {padding:[40, 40], maxZoom:16});
  state.feats = []; state.loading = true; drawAmenities(); render();
  status("Collecting amenities in and around " + state.place.name + "…", "busy");
  const b = f.bbox, py = APP.near / 111320, px = py / Math.cos(f.c[1] * Math.PI / 180);
  let data;
  try { data = await overpass(buildQuery(`(${(b[1] - py).toFixed(5)},${(b[0] - px).toFixed(5)},${(b[3] + py).toFixed(5)},${(b[2] + px).toFixed(5)})`, "")); }
  catch (err){ if (my === state.seq){ state.loading = false; render(); status(err.message, "err"); } return; }
  if (my !== state.seq) return;
  state.loading = false;
  state.feats = toFeats(data.elements, [f.c[1], f.c[0]], (lon, lat) => Villages.contains(f.geometry, lon, lat));
  drawAmenities();
  render();
  writeUrl();
  const nIn = state.feats.filter(x => x.inside).length;
  status(`${nIn} amenities inside ${state.place.name}, ${state.feats.length - nIn} nearby`, "ok");
}

/* ---------- district scan: which villages have basic services mapped ---------- */
async function scanDistrict(){
  const d = state.dist; if (!d) return;
  const btn = $("scanBtn"); btn.disabled = true; btn.textContent = "Scanning…";
  status(`Downloading basic services for ${d.meta.district} district…`, "busy");
  try {
    const data = await overpass(buildScanQuery(d.meta.bbox));
    if (state.dist !== d) return;
    const byVillage = new Map(), totals = ESSENTIALS.map(() => 0);
    let placed = 0;
    for (const el of data.elements){
      const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
      if (lat == null || !el.tags) continue;
      const v = Villages.villageIn(d, lon, lat); if (!v) continue;
      placed++;
      ESSENTIALS.forEach((e, i) => { if (e.test(el.tags)){ (byVillage.get(v.id) || byVillage.set(v.id, new Set()).get(v.id)).add(i); totals[i]++; } });
    }
    state.scan = {key:d.key, byVillage, totals, placed, at:new Date()};
    state.metric = "score"; computeBreaks(); restyle(); updateLegend();
    render();
    status(`${fmtN(placed)} mapped services found across ${d.meta.district}`, "ok");
  } catch (err){ status(err.message, "err"); }
  finally { btn.disabled = false; btn.textContent = state.scan ? "Scan again" : "Scan district"; }
}

function popup(f){
  const t = f.tags, rows = [];
  ["name:en","name:hi","name:mr","name:bn","operator","opening_hours","religion","isced:level","phone","addr:full"].forEach(k => {
    if (t[k] && t[k] !== f.name) rows.push(`<tr><td>${esc(k)}</td><td>${esc(t[k])}</td></tr>`);
  });
  const where = state.village ? (f.inside ? "inside " + esc(state.place.name) : fmtKm(f.d) + " from village centre, outside") : fmtKm(f.d) + " from centre";
  return `<div class="pop"><b>${esc(f.name || f.type)}</b><div class="t">${esc(f.type)} · ${where}</div>
    ${rows.length ? `<table>${rows.join("")}</table>` : ""}
    <div style="margin-top:6px;font-size:.8rem"><a href="https://www.openstreetmap.org/${esc(f.osm)}" target="_blank" rel="noopener">View on OSM ↗</a></div></div>`;
}

/* ---------- panel ---------- */
function setTab(t){
  state.tab = t;
  document.querySelectorAll(".tabs button").forEach(b => { const on = b.dataset.tab === t; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
  ["overview","district","amenities"].forEach(id => $("tab-" + id).hidden = id !== t);
  if (t === "district") renderDistrict();
}
document.querySelectorAll(".tabs button").forEach(b => {
  b.onclick = () => setTab(b.dataset.tab);
  b.onkeydown = e => {
    const tabs = [...document.querySelectorAll(".tabs button:not([hidden])")], i = tabs.indexOf(b);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft"){ const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); setTab(n.dataset.tab); }
  };
});

function render(){
  const p = state.place, F = state.feats, v = state.village;
  ["place","tabsWrap"].forEach(id => $(id).hidden = false);
  $("placeName").textContent = p.name;
  $("placeMeta").textContent = p.meta || "";
  $("mode").textContent = v ? "LGD " + v.id : p.mode === "boundary" ? "OSM boundary" : fmtKm(radius()) + " radius";
  $("editLink").href = `https://www.openstreetmap.org/edit#map=16/${p.lat.toFixed(5)}/${p.lon.toFixed(5)}`;
  $("tabDistrict").hidden = !v;
  if (!v && state.tab === "district") setTab("overview");

  // village facts
  $("facts").hidden = !v;
  if (v){
    const pr = v.properties;
    const facts = [["Population", v.pop ? fmtN(v.pop) : "–"], ["Households", v.hh ? fmtN(v.hh) : "–"], ["Area", v.collapsed ? "not usable" : v.km2 ? v.km2.toFixed(v.km2 < 10 ? 2 : 1) + " km²" : "–"],
      ["People per km²", v.density ? fmtN(v.density) : "–"], ["Per household", v.hhsize ? v.hhsize.toFixed(1) : "–"], ["Type", (pr.type || "–") + (pr.level && pr.level !== "Village" ? " · " + pr.level : "")]];
    $("facts").innerHTML = facts.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join("");
  }

  // scorecard
  let have = 0;
  $("score").innerHTML = ESSENTIALS.map(e => {
    const inn = F.filter(f => f.inside && e.test(f.tags)), near = F.filter(f => !f.inside && e.test(f.tags));
    if (inn.length) have++;
    let cls = "no", txt = v ? "none mapped within 3 km" : "not mapped";
    if (inn.length){ cls = "yes"; txt = v ? `${inn.length} in village` : `${inn.length} · nearest ${fmtKm(inn[0].d)}`; }
    else if (near.length){ cls = "near"; txt = `nearest ${fmtKm(Math.min(...near.map(f => f.d)))} away`; }
    return `<div class="${cls}"><b>${esc(e.label)}</b><span class="mono">${txt}</span></div>`;
  }).join("");
  $("scoreCount").textContent = `${have}/${ESSENTIALS.length} ${v ? "inside" : "mapped"}`;
  $("scoreKey").hidden = !v;

  // amenities inside the village, per 1,000 people
  const counts = {}; F.filter(f => f.inside).forEach(f => counts[f.cat] = (counts[f.cat] || 0) + 1);
  const rows = CATS.filter(c => counts[c.id] && c.id !== "other").map(c => {
    const n = counts[c.id], per = v && v.pop ? n / v.pop * 1000 : null;
    return {label:c.label.replace(" & Anganwadi", "").replace(" & veterinary", "").replace(" & public offices", "").replace(", markets & food", " & markets"),
            value:n, color:c.color, text: per != null ? `${n} · ${per < 1 ? per.toFixed(2) : per.toFixed(1)}/1k` : String(n),
            tip:`<b>${esc(c.label)}</b><br>${n} mapped${per != null ? `<br>${per.toFixed(2)} per 1,000 people` : ""}`};
  }).sort((a, b) => b.value - a.value);
  $("amenChartWrap").hidden = !rows.length;
  $("amenTitle").textContent = v ? `Mapped inside ${p.name}` : "Mapped in this area";
  if (rows.length) Sns.barh($("amenChart"), {rows, label:"Amenities by category", labelWidth:150});

  // layers
  const all = {}; F.forEach(f => all[f.cat] = (all[f.cat] || 0) + 1);
  $("total").textContent = F.length + " total";
  $("cats").replaceChildren();
  CATS.filter(c => all[c.id]).forEach(c => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip";
    b.style.setProperty("--c", c.color);
    b.setAttribute("aria-pressed", String(!state.hidden.has(c.id)));
    b.innerHTML = `<i></i>${esc(c.label)}<em>${all[c.id]}</em>`;
    b.onclick = () => { state.hidden.has(c.id) ? state.hidden.delete(c.id) : state.hidden.add(c.id); applyVisibility(); render(); };
    $("cats").append(b);
  });

  // list
  const list = $("list"); list.replaceChildren();
  const shown = CATS.filter(c => all[c.id] && !state.hidden.has(c.id));
  const note = txt => { const e = document.createElement("p"); e.className = "empty"; e.textContent = txt; return e; };
  if (!F.length){ list.append(note(state.loading ? "Loading amenities…" : "Nothing has been mapped here yet. Be the first to add amenities on OSM.")); }
  else if (!shown.length){ list.append(note("All layers are switched off.")); }
  else shown.forEach(c => {
    const g = document.createElement("div"); g.className = "group"; g.style.setProperty("--c", c.color);
    g.innerHTML = `<h4><i></i>${esc(c.label)}</h4>`;
    const items = F.filter(f => f.cat === c.id);
    items.slice(0, 40).forEach(f => {
      const b = document.createElement("button"); b.type = "button"; b.className = "item" + (f.inside ? "" : " out");
      b.innerHTML = `<b>${esc(f.name || f.type)}</b><span class="mono">${fmtKm(f.d)}</span><span>${esc(f.name ? f.type : "unnamed")}${f.inside ? "" : " · outside village"}</span>`;
      b.onclick = () => {
        if (innerWidth <= 820) $("map").scrollIntoView({behavior:"smooth"});
        map.flyTo([f.lat, f.lon], Math.max(map.getZoom(), 17), {duration:.6});
        map.once("moveend", () => f.marker.openPopup());
      };
      g.append(b);
    });
    if (items.length > 40) g.append(note(`+ ${items.length - 40} more on the map`));
    list.append(g);
  });
  $("dlDist").hidden = !state.dist;
  if (state.tab === "district") renderDistrict();
}

function renderDistrict(){
  const d = state.dist, v = state.village;
  if (!d || !v) return;
  const F = d.feats, m = d.meta;
  $("distTitle").textContent = `${m.district} district`;
  $("distMeta").textContent = `${m.state} · ${fmtN(m.n)} villages and towns · ${fmtN(m.pop)} people`;

  // metric chips
  const mc = $("metrics"); mc.replaceChildren();
  Object.entries(METRICS).forEach(([k, mm]) => {
    if (k === "score" && !state.scan) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "seg";
    b.textContent = mm.label; b.setAttribute("aria-pressed", String(state.metric === k));
    b.onclick = () => { state.metric = k; computeBreaks(); restyle(); updateLegend(); renderDistrict(); };
    mc.append(b);
  });

  // where this village sits: histogram + KDE of log10 population
  const pops = F.filter(f => f.pop > 0);
  const share = v.pop ? Math.round(pops.filter(f => f.pop < v.pop).length / pops.length * 100) : null;
  Sns.histKde($("histChart"), {
    values: pops.map(f => Math.log10(f.pop)), marker: v.pop ? Math.log10(v.pop) : null, unit:"people",
    markerLabel: v.pop ? `${v.properties.vill_name || v.properties.name} · ${fmtN(v.pop)}` : "",
    xTitle:"Population (log scale)", label:"Population of villages in the district", activeBin: state.binIndex ?? null,
    onBin:(range, i) => {
      state.bin = range; state.binIndex = i; restyle();
      const n = range ? F.filter(f => f.pop > 0 && Math.log10(f.pop) >= range[0] && Math.log10(f.pop) < range[1]).length : 0;
      $("binNote").textContent = range ? `Map shows the ${n} villages with ${fmtN(10 ** range[0])}–${fmtN(10 ** range[1])} people. Tap the bar again to show all.` : "";
    }
  });
  $("histNote").textContent = share != null ? `${v.properties.vill_name || v.properties.name} has more people than ${share}% of the ${fmtN(pops.length)} inhabited villages here.` : "No population recorded for this village.";
  if (!state.bin) $("binNote").textContent = "";

  // population vs area, hue by rural / urban
  Sns.scatter($("scatterChart"), {
    points: F.filter(f => !f.collapsed).map(f => ({x:f.km2, y:f.pop, hue:f.properties.type || "Rural", id:f.id, f})),
    hues: {Rural:Sns.DEEP[0], Urban:Sns.DEEP[1]}, selectedId: v.id,
    xTitle:"Area, km² (log)", yTitle:"Population (log)", label:"Population against area",
    tip: q => `<b>${esc(q.f.properties.vill_name || q.f.properties.name)}</b><br>${esc(q.f.properties.subdist || "")}<br>${fmtN(q.f.pop)} people · ${q.f.km2.toFixed(1)} km²<br>${q.f.density ? fmtN(q.f.density) + " per km²" : ""}`,
    onHover: id => hoverVillage(id),
    onClick: id => { const f = F.find(x => x.id === id); if (f) selectVillage(d, f); }
  });

  const col = F.filter(f => f.collapsed).length;
  $("scatterNote").textContent = col ? `${fmtN(col)} ${col === 1 ? "village is" : "villages are"} left out: ${col === 1 ? "its" : "their"} boundary shrank to a sliver when the layer was simplified, so area is not usable.` : "";

  // basic services across the district
  const s = state.scan && state.scan.key === d.key ? state.scan : null;
  $("scanBtn").textContent = s ? "Scan again" : "Scan district";
  $("scanResult").hidden = !s;
  if (s){
    const inhabited = F.filter(f => f.pop > 0), N = inhabited.length || 1;
    const rows = ESSENTIALS.map((e, i) => {
      const n = inhabited.filter(f => s.byVillage.get(f.id)?.has(i)).length;
      return {label:e.label, value:n / N * 100, text:Math.round(n / N * 100) + "%", color:Sns.DEEP[0], tip:`<b>${esc(e.label)}</b><br>${fmtN(n)} of ${fmtN(N)} villages`};
    }).sort((a, b) => b.value - a.value);
    rows.forEach((r, i) => r.color = Sns.DEEP[i % 10]);
    Sns.barh($("scanChart"), {rows, max:100, ticks:[0, 25, 50, 75, 100], tickFmt:x => x + "%", label:"Share of villages with each service mapped", labelWidth:150});
    const scores = inhabited.map(f => s.byVillage.get(f.id)?.size || 0).sort((a, b) => a - b);
    const med = scores[Math.floor(scores.length / 2)] || 0, none = scores.filter(x => !x).length;
    const mine = s.byVillage.get(v.id)?.size || 0;
    $("scanNote").textContent = `The middle village has ${med} of 10 services mapped; ${fmtN(none)} villages have none. ${v.properties.vill_name || v.properties.name} has ${mine}.`;
  }
}
function applyVisibility(){ CATS.forEach(c => state.hidden.has(c.id) ? map.removeLayer(catLayers[c.id]) : catLayers[c.id].addTo(map)); }

/* ---------- export ---------- */
const slug = () => (state.place?.name || "area").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "area";
function save(text, name, type){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$("dlGeo").onclick = () => {
  const fc = {type:"FeatureCollection", features:state.feats.map(f => ({type:"Feature",
    geometry:{type:"Point", coordinates:[+f.lon.toFixed(7), +f.lat.toFixed(7)]},
    properties:{...f.tags, gs_category:CAT[f.cat].label, gs_type:f.type, gs_distance_m:Math.round(f.d), gs_inside_village:f.inside, osm_id:f.osm}}))};
  save(JSON.stringify(fc, null, 1), `amenities-${slug()}.geojson`, "application/geo+json");
};
$("dlCsv").onclick = () => {
  const head = ["category","type","name","lat","lon","distance_m","inside_village","osm_url"];
  const rows = state.feats.map(f => [CAT[f.cat].label, f.type, f.name, f.lat.toFixed(6), f.lon.toFixed(6), Math.round(f.d), f.inside ? "yes" : "no", "https://www.openstreetmap.org/" + f.osm].map(csvCell).join(","));
  save("﻿" + [head.join(","), ...rows].join("\n"), `amenities-${slug()}.csv`, "text/csv");
};
$("dlDist").onclick = () => {
  const d = state.dist; if (!d) return;
  const s = state.scan && state.scan.key === d.key ? state.scan : null;
  const head = ["vill_lgd","village","subdistrict","district","state","type","level","population","households","area_km2","people_per_km2","people_per_household"]
    .concat(s ? ["services_mapped", ...ESSENTIALS.map(e => "has_" + e.short.toLowerCase().replace(/[^a-z]+/g, "_"))] : []);
  const rows = d.feats.map(f => {
    const p = f.properties, set = s && (s.byVillage.get(f.id) || new Set());
    return [f.id, p.vill_name || p.name, p.subdist, p.district, p.state, p.type, p.level, f.pop, f.hh, f.km2.toFixed(3),
            f.density ? Math.round(f.density) : "", f.hhsize ? f.hhsize.toFixed(2) : ""]
      .concat(s ? [set.size, ...ESSENTIALS.map((e, i) => set.has(i) ? 1 : 0)] : []).map(csvCell).join(",");
  });
  save("﻿" + [head.join(","), ...rows].join("\n"), `villages-${d.meta.district.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, "text/csv");
};
$("copyLink").onclick = async e => {
  const btn = e.currentTarget;
  try { await navigator.clipboard.writeText(location.href); btn.textContent = "Link copied"; }
  catch { btn.textContent = "Copy from the address bar"; }
  setTimeout(() => btn.textContent = "Copy share link", 2000);
};
$("scanBtn").onclick = scanDistrict;

/* ---------- the viewer's village file ---------- */
function showData(info){
  state.data = info;
  const card = $("dataCard");
  card.dataset.state = info ? "ready" : "empty";
  $("dataEmpty").hidden = !!info; $("dataBusy").hidden = true; $("dataReady").hidden = !info;
  if (info){
    $("dataSummary").textContent = `${fmtN(info.villages)} villages · ${info.districts} districts · ${info.states} states`;
    $("dataWhen").textContent = "Imported " + new Date(info.imported).toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric"}) + " · stays in this browser";
  }
}
async function importFile(file){
  if (!file) return;
  if (!/\.(zip|geojson|json)$/i.test(file.name)){ status("Choose the .zip from the loni-private-data release, or the .geojson inside it.", "err"); return; }
  $("dataEmpty").hidden = true; $("dataReady").hidden = true; $("dataBusy").hidden = false;
  const bar = $("dataBar"), txt = $("dataProgress");
  try {
    const info = await Villages.importFile(file, m => {
      if (m.type === "progress"){ bar.style.width = (m.read / m.total * 100).toFixed(1) + "%"; txt.textContent = `Reading ${file.name}: ${fmtN(m.n)} villages`; }
      if (m.type === "saving"){ bar.style.width = "100%"; txt.textContent = m.of ? `Saving districts ${m.part} of ${m.of}…` : "Saving to this browser…"; }
    });
    showData(info);
    status(`${fmtN(info.villages)} village boundaries ready`, "ok");
    if (state.place && !state.place.pin) goPlace(state.place);
  } catch (err){
    showData(await Villages.info());
    status(err.message, "err");
  }
}
$("dataPick").onclick = () => $("dataFile").click();
$("dataFile").onchange = e => { importFile(e.target.files[0]); e.target.value = ""; };
$("dataRemove").onclick = async e => {
  const b = e.currentTarget;
  if (b.dataset.armed !== "1"){ b.dataset.armed = "1"; b.textContent = "Tap again to remove"; setTimeout(() => { b.dataset.armed = ""; b.textContent = "Remove"; }, 4000); return; }
  await Villages.clear(); b.dataset.armed = ""; b.textContent = "Remove";
  showData(null); clearDistrict();
  if (state.place) load({...state.place, mode:"radius", areaId:null});
};
let dragDepth = 0;
addEventListener("dragenter", e => { if ([...(e.dataTransfer?.types || [])].includes("Files")){ dragDepth++; document.body.classList.add("dragging"); } });
addEventListener("dragleave", () => { if (--dragDepth <= 0){ dragDepth = 0; document.body.classList.remove("dragging"); } });
addEventListener("dragover", e => e.preventDefault());
addEventListener("drop", e => { e.preventDefault(); dragDepth = 0; document.body.classList.remove("dragging"); importFile(e.dataTransfer?.files?.[0]); });

/* ---------- theme: Auto → Light → Dark ---------- */
(function theme(){
  const order = ["auto", "light", "dark"], btn = $("themeBtn");
  let cur = document.documentElement.getAttribute("data-theme") || "auto";
  const show = () => { btn.textContent = cap(cur); btn.setAttribute("aria-label", "Colour theme: " + cur); };
  btn.onclick = () => {
    cur = order[(order.indexOf(cur) + 1) % 3];
    if (cur === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", cur);
    try { cur === "auto" ? localStorage.removeItem("gs-theme") : localStorage.setItem("gs-theme", cur); } catch {}
    show();
    if (state.shape && state.shape.setStyle) state.shape.setStyle({color:cssVar("--indigo")});
    restyle();
    if (state.place) render();
  };
  show();
})();

/* ---------- shareable URL ---------- */
function writeUrl(){
  const p = state.place, u = new URL(location.href);
  u.search = "";
  if (state.village){
    u.searchParams.set("v", state.village.id); u.searchParams.set("d", state.dist.key);
    u.searchParams.set("q", [p.name, state.village.properties.district].filter(Boolean).join(", "));
  } else if (p.pin){ u.searchParams.set("lat", p.lat.toFixed(5)); u.searchParams.set("lon", p.lon.toFixed(5)); u.searchParams.set("r", radius()); }
  else { u.searchParams.set("q", [p.name, (p.meta || "").split(" · ").pop()].filter(Boolean).join(", ")); u.searchParams.set("r", radius()); }
  try { history.replaceState(null, "", u); } catch {}
}

$("ver").textContent = "v" + APP.version;
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

(async function boot(){
  showData(await Villages.info());
  const sp = new URLSearchParams(location.search);
  const r = +sp.get("r");
  if (r >= 500 && r <= 5000){ $("radius").value = r; }
  $("radiusVal").textContent = fmtKm(radius());
  if (state.data && sp.get("v") && sp.get("d")){
    try {
      const d = await Villages.district(sp.get("d")), f = d.feats.find(x => String(x.id) === sp.get("v"));
      if (f) return selectVillage(d, f);
    } catch {}
  }
  const lat = parseFloat(sp.get("lat")), lon = parseFloat(sp.get("lon"));
  if (isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return goPlace(pinPlace(lat, lon));
  const q = sp.get("q") || APP.defaultPlace;
  $("q").value = q;
  status("Finding " + q + "…", "busy");
  try {
    const res = await nominatim(q);
    if (res.length) goPlace(placeFromResult(res[0])); else status("Search for a village to begin.", "ok");
  } catch (err){ status(err.message, "err"); }
})();
