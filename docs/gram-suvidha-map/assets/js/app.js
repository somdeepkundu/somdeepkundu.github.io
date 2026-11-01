/* Gram Suvidha Map — village-level amenities from OpenStreetMap.
   Keep APP.version equal to VERSION in sw.js and package.json. */
"use strict";
const APP = { version: "1.1.0", defaultPlace: "Hiware Bazar, Ahmednagar" };
const $ = id => document.getElementById(id);

/* Every string from OSM is untrusted: escape for HTML, neutralise formulas for CSV. */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function csvCell(v){
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/* ---------- categories ---------- */
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

/* ---------- basic-services scorecard ---------- */
const ESSENTIALS = [
  {label:"School",           test:f => ["school","college"].includes(f.tags.amenity)},
  {label:"Anganwadi",        test:f => ["kindergarten","childcare"].includes(f.tags.amenity) || /anganwadi/i.test(f.tags.name || "")},
  {label:"Health facility",  test:f => f.cat === "health"},
  {label:"Drinking water",   test:f => ["drinking_water","water_point"].includes(f.tags.amenity) || ["water_well","water_tower","water_works","storage_tank"].includes(f.tags.man_made)},
  {label:"Bank or ATM",      test:f => ["bank","atm"].includes(f.tags.amenity)},
  {label:"Post office",      test:f => f.tags.amenity === "post_office"},
  {label:"Bus stop",         test:f => f.tags.highway === "bus_stop" || f.tags.amenity === "bus_station"},
  {label:"Panchayat office", test:f => f.tags.amenity === "townhall" || f.tags.office === "government" || /panchayat/i.test(f.tags.name || "")},
  {label:"Market or ration shop", test:f => f.tags.amenity === "marketplace" || !!f.tags.shop},
  {label:"Veterinary care",  test:f => f.tags.amenity === "veterinary"}
];

/* ---------- map: OSM tiles, Esri as the alternative (no CARTO without a key) ---------- */
const map = L.map("map").setView([20.6, 78.9], 5);
const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:"© OpenStreetMap contributors"}).addTo(map);
const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {maxZoom:19, attribution:"Imagery © Esri, Maxar, Earthstar Geographics"});
L.control.layers({"OSM map":osm, "Satellite (Esri)":sat}, null, {position:"topright"}).addTo(map);
L.control.scale({imperial:false}).addTo(map);

const areaLayer = L.layerGroup().addTo(map);
const catLayers = Object.fromEntries(CATS.map(c => [c.id, L.layerGroup().addTo(map)]));
const state = {place:null, feats:[], hidden:new Set(["other"]), seq:0};

map.on("click", e => {
  const {lat, lng} = e.latlng;
  const div = document.createElement("div"); div.className = "pop";
  const b1 = document.createElement("b"); b1.textContent = "Map amenities here?";
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
$("radius").addEventListener("change", () => { if (state.place && state.place.mode !== "boundary") load(state.place); });

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
  if (geo && km2 < 300){            // a district-sized boundary would swamp Overpass; use the radius instead
    if (r.osm_type === "relation") areaId = 3600000000 + Number(r.osm_id);
    else if (r.osm_type === "way") areaId = 2400000000 + Number(r.osm_id);
  }
  return {name, meta, lat:+r.lat, lon:+r.lon, geo:areaId ? geo : null, areaId, type:r.type};
}

$("searchForm").addEventListener("submit", async e => {
  e.preventDefault();
  const q = $("q").value.trim(); if (!q) return;
  status("Searching for “" + q + "”…", "busy");
  const box = $("results");
  try {
    const res = await nominatim(q);
    box.replaceChildren();
    if (!res.length){ box.hidden = true; status("No place called “" + q + "” found in India. Try adding the district.", "err"); return; }
    status(null);
    if (res.length === 1){ box.hidden = true; load(placeFromResult(res[0])); return; }
    res.forEach(r => {
      const p = placeFromResult(r);
      const b = document.createElement("button"); b.type = "button";
      const n = document.createElement("b"); n.textContent = p.name;
      const m = document.createElement("span"); m.textContent = (p.meta || r.display_name) + " · " + p.type;
      b.append(n, m);
      b.onclick = () => { box.hidden = true; load(p); };
      box.append(b);
    });
    box.hidden = false;
  } catch (err){ status(err.message, "err"); }
});

/* ---------- Overpass (GET, so the service worker can keep the last results for offline use) ---------- */
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
function buildQuery(sel, prefix){
  const f = [
    "[amenity]", "[shop]", "[healthcare]", "[highway=bus_stop]", '[railway~"^(station|halt)$"]',
    '[man_made~"^(water_well|water_tower|water_works|storage_tank|pumping_station|wastewater_plant|silo)$"]',
    '[office~"^(government|administrative)$"]', '[leisure~"^(playground|pitch|park|sports_centre|stadium)$"]', "[craft=agricultural_engines]"
  ];
  return `[out:json][timeout:60];${prefix}(${f.map(x => `nwr${sel}${x};`).join("")});out center tags;`;
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

async function load(place){
  const my = ++state.seq;                 // a slow older query must not overwrite a newer one
  state.place = place;
  $("results").hidden = true;
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

  areaLayer.clearLayers(); Object.values(catLayers).forEach(l => l.clearLayers());
  const style = {color:cssVar("--indigo"), weight:2, dashArray:"6 5", fillOpacity:.04};
  const shape = mode === "boundary" && place.geo ? L.geoJSON(place.geo, {style}) : L.circle([place.lat, place.lon], {radius:radius(), ...style});
  shape.addTo(areaLayer); state.shape = shape;
  map.fitBounds(shape.getBounds(), {padding:[24, 24]});
  L.circleMarker([place.lat, place.lon], {radius:5, color:"#fff", weight:2, fillColor:"#1c2420", fillOpacity:1}).bindTooltip("Village centre").addTo(areaLayer);

  const seen = new Set(); let dropped = 0;
  state.feats = data.elements.map(el => {
    const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null || !el.tags){ dropped++; return null; }
    const key = el.type + "/" + el.id; if (seen.has(key)) return null; seen.add(key);
    const t = el.tags, cat = classify(t);
    if (cat === "other" && SKIP.includes(t.amenity)) return null;
    return {osm:key, lat, lon, tags:t, cat, type:typeLabel(t), name:t.name || t["name:en"] || "", d:dist(place.lat, place.lon, lat, lon)};
  }).filter(Boolean).sort((a, b) => a.d - b.d);
  if (dropped) console.info(`Gram Suvidha: ${dropped} OSM element(s) without position or tags were skipped.`);

  state.feats.forEach(f => {
    f.marker = L.circleMarker([f.lat, f.lon], {radius:7, color:"#fff", weight:1.5, fillColor:CAT[f.cat].color, fillOpacity:.95})
      .bindPopup(() => popup(f)).bindTooltip(esc(f.name || f.type), {direction:"top", offset:[0, -6]});
    f.marker.addTo(catLayers[f.cat]);
  });
  applyVisibility();
  render();
  writeUrl();
  status(state.feats.length + " amenities mapped in OSM", "ok");
}

function popup(f){
  const t = f.tags, rows = [];
  ["name:en","name:hi","name:mr","name:bn","operator","opening_hours","religion","isced:level","phone","addr:full"].forEach(k => {
    if (t[k] && t[k] !== f.name) rows.push(`<tr><td>${esc(k)}</td><td>${esc(t[k])}</td></tr>`);
  });
  return `<div class="pop"><b>${esc(f.name || f.type)}</b><div class="t">${esc(f.type)} · ${fmtKm(f.d)} from centre</div>
    ${rows.length ? `<table>${rows.join("")}</table>` : ""}
    <div style="margin-top:6px;font-size:.8rem"><a href="https://www.openstreetmap.org/${esc(f.osm)}" target="_blank" rel="noopener">View on OSM ↗</a></div></div>`;
}

/* ---------- panel ---------- */
function render(){
  const p = state.place, F = state.feats;
  ["place","scoreSec","catSec","listSec","expSec"].forEach(id => $(id).hidden = false);
  $("placeName").textContent = p.name;
  $("placeMeta").textContent = p.meta || "";
  $("mode").textContent = p.mode === "boundary" ? "village boundary" : fmtKm(radius()) + " radius";
  $("editLink").href = `https://www.openstreetmap.org/edit#map=16/${p.lat.toFixed(5)}/${p.lon.toFixed(5)}`;

  let have = 0;
  $("score").innerHTML = ESSENTIALS.map(e => {
    const hits = F.filter(e.test);
    if (hits.length) have++;
    return `<div class="${hits.length ? "yes" : "no"}"><b>${esc(e.label)}</b>
      <span class="mono">${hits.length ? `${hits.length} · nearest ${fmtKm(hits[0].d)}` : "not mapped"}</span></div>`;
  }).join("");
  $("scoreCount").textContent = `${have}/${ESSENTIALS.length} mapped`;

  const counts = {}; F.forEach(f => counts[f.cat] = (counts[f.cat] || 0) + 1);
  $("total").textContent = F.length + " total";
  $("cats").replaceChildren();
  CATS.filter(c => counts[c.id]).forEach(c => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip";
    b.style.setProperty("--c", c.color);
    b.setAttribute("aria-pressed", String(!state.hidden.has(c.id)));
    b.innerHTML = `<i></i>${esc(c.label)}<em>${counts[c.id]}</em>`;
    b.onclick = () => { state.hidden.has(c.id) ? state.hidden.delete(c.id) : state.hidden.add(c.id); applyVisibility(); render(); };
    $("cats").append(b);
  });

  const list = $("list"); list.replaceChildren();
  const shown = CATS.filter(c => counts[c.id] && !state.hidden.has(c.id));
  const note = txt => { const e = document.createElement("p"); e.className = "empty"; e.textContent = txt; return e; };
  if (!F.length){ list.append(note("Nothing has been mapped here yet. Try a wider radius, or be the first to add amenities on OSM.")); return; }
  if (!shown.length){ list.append(note("All layers are switched off.")); return; }
  shown.forEach(c => {
    const g = document.createElement("div"); g.className = "group"; g.style.setProperty("--c", c.color);
    g.innerHTML = `<h4><i></i>${esc(c.label)}</h4>`;
    const items = F.filter(f => f.cat === c.id);
    items.slice(0, 40).forEach(f => {
      const b = document.createElement("button"); b.type = "button"; b.className = "item";
      b.innerHTML = `<b>${esc(f.name || f.type)}</b><span class="mono">${fmtKm(f.d)}</span><span>${esc(f.name ? f.type : "unnamed")}</span>`;
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
    properties:{...f.tags, gs_category:CAT[f.cat].label, gs_type:f.type, gs_distance_m:Math.round(f.d), osm_id:f.osm}}))};
  save(JSON.stringify(fc, null, 1), `amenities-${slug()}.geojson`, "application/geo+json");
};
$("dlCsv").onclick = () => {
  const head = ["category","type","name","lat","lon","distance_m","osm_url"];
  const rows = state.feats.map(f => [CAT[f.cat].label, f.type, f.name, f.lat.toFixed(6), f.lon.toFixed(6), Math.round(f.d), "https://www.openstreetmap.org/" + f.osm].map(csvCell).join(","));
  save("﻿" + [head.join(","), ...rows].join("\n"), `amenities-${slug()}.csv`, "text/csv");
};
$("copyLink").onclick = async e => {
  const btn = e.currentTarget;
  try { await navigator.clipboard.writeText(location.href); btn.textContent = "Link copied"; }
  catch { btn.textContent = "Copy from the address bar"; }
  setTimeout(() => btn.textContent = "Copy share link", 2000);
};

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
    if (state.shape) state.shape.setStyle({color:cssVar("--indigo")});
  };
  show();
})();

/* ---------- shareable URL: ?q=village or ?lat=..&lon=..  (&r= radius in metres) ---------- */
function writeUrl(){
  const p = state.place, u = new URL(location.href);
  u.search = "";
  if (p.pin){ u.searchParams.set("lat", p.lat.toFixed(5)); u.searchParams.set("lon", p.lon.toFixed(5)); }
  else u.searchParams.set("q", [p.name, (p.meta || "").split(" · ").pop()].filter(Boolean).join(", "));
  u.searchParams.set("r", radius());
  try { history.replaceState(null, "", u); } catch {}
}

$("ver").textContent = "v" + APP.version;
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

(async function boot(){
  const sp = new URLSearchParams(location.search);
  const r = +sp.get("r");
  if (r >= 500 && r <= 5000){ $("radius").value = r; }
  $("radiusVal").textContent = fmtKm(radius());
  const lat = parseFloat(sp.get("lat")), lon = parseFloat(sp.get("lon"));
  if (isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return load(pinPlace(lat, lon));
  const q = sp.get("q") || APP.defaultPlace;
  $("q").value = q;
  status("Finding " + q + "…", "busy");
  try {
    const res = await nominatim(q);
    if (res.length) load(placeFromResult(res[0])); else status("Search for a village to begin.", "ok");
  } catch (err){ status(err.message, "err"); }
})();
