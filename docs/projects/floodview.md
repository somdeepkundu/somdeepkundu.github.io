---
hide:
  - toc
title: "FloodView, launched on DRR Day 2026"
description: "Launched on the International Day for Disaster Risk Reduction (13 Oct 2026): FloodView, a free field camera for flood ground truthing. One tap labels a geo-tagged photo flooded, waterlogged or dry, with depth, flow and the waterline."
og:
  image: assets/images/floodview-drr-card.jpg
  image_alt: "FloodView launching on International Day for Disaster Risk Reduction, 13 October 2026"
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&display=swap');
/* FloodView page only: app font (Comfortaa) and monsoon palette, with a silt accent.
   Same structure as the CropView page (cv-*), scoped under .fv-page. */
.fv-page{--fv-navy:#070d1c;--fv-sky:#38bdf8;--fv-river:#0277b5;--fv-deep:#1d4ed8;--fv-teal:#14b8a6;--fv-silt:#8a6a45;--fv-sand:#d8c39a;--fv-edge:#e2549a;--fv-paper:#f6f9fb;--fv-line:#d9e3ea;--fv-ink:#14212b;--fv-mute:#5b6875;font-family:'Comfortaa',system-ui,sans-serif;color:var(--fv-ink)}
[data-md-color-scheme="slate"] .fv-page{--fv-paper:#0e1628;--fv-line:#24304a;--fv-ink:#e8f0fe;--fv-mute:#9fb0c3;--fv-river:#38bdf8;--fv-silt:#d8c39a;--fv-edge:#f472b6}
.md-typeset .fv-page p,.md-typeset .fv-page li,.md-typeset .fv-page figcaption{font-family:inherit}
.md-typeset .fv-page h2{font-family:'Comfortaa',system-ui,sans-serif;font-weight:700;font-size:1.1rem;color:var(--fv-ink);margin:2.2rem 0 .2rem}
.md-typeset .fv-page h2::after,[data-md-color-scheme="slate"] .md-typeset .fv-page h2::after{width:3rem;background:linear-gradient(90deg,var(--fv-deep),var(--fv-sky),var(--fv-teal),var(--fv-silt))}
.md-typeset .fv-page .fv-sub{margin:.55rem 0 0;font-size:.74rem;color:var(--fv-mute)}
.md-typeset .fv-page a:not(.md-button):not(.md-tabs__link):not(.md-nav__link):not(.md-footer__link):not(.md-source__link):not(.md-header__button){color:var(--fv-river)!important;text-decoration-color:rgba(2,119,181,.35)}
[data-md-color-scheme="slate"] .md-typeset .fv-page a:not(.md-button):not(.md-tabs__link):not(.md-nav__link):not(.md-footer__link):not(.md-source__link):not(.md-header__button){color:var(--fv-sky)!important;text-decoration-color:rgba(56,189,248,.4)}
/* hero: app navy with two rows of waves and a water-to-silt band */
.fv-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:1.25rem;padding:1.5rem 1.7rem 2.7rem;margin:0 0 1.3rem;border-radius:16px;background:radial-gradient(130% 160% at 0% 0%,#16274d 0%,#0b1430 55%,#070d1c 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 40px -26px rgba(7,13,28,.8)}
.fv-hero::before{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,#1d4ed8,#38bdf8,#14b8a6,#8a6a45)}
.fv-hero::after{content:"";position:absolute;left:0;right:0;bottom:4px;height:40px;opacity:.5;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='40' viewBox='0 0 48 40'%3E%3Cg fill='none' stroke-linecap='round'%3E%3Cpath d='M0 14 Q12 6 24 14 T48 14' stroke='%23bae6fd' stroke-width='1.6'/%3E%3Cpath d='M0 28 Q12 20 24 28 T48 28' stroke='%237dd3fc' stroke-width='1.3' stroke-opacity='.6'/%3E%3C/g%3E%3C/svg%3E") repeat-x bottom left/48px 40px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent);mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)}
.md-typeset .fv-hero>p{margin:0;flex:none;position:relative;z-index:1}
.fv-hero-text{position:relative;z-index:1}
.fv-hero-text::before{content:"";position:absolute;inset:-3rem -40vw auto auto;width:22rem;height:14rem;z-index:-1;border-radius:50%;background:radial-gradient(closest-side,rgba(56,189,248,.12),transparent);pointer-events:none}
.md-typeset .fv-hero img.fv-logo{display:block;width:78px;height:78px;border-radius:20px;box-shadow:0 0 0 1px rgba(255,255,255,.14),inset 0 1px 0 rgba(255,255,255,.3),0 10px 28px -6px rgba(56,189,248,.4)}
.md-typeset .fv-hero h1.fv-wordmark{font-family:'Comfortaa',system-ui,sans-serif;font-weight:700;font-size:2.2rem;line-height:1.1;margin:0;color:#38bdf8;letter-spacing:.01em}
.md-typeset .fv-hero .fv-tagline{margin:.3rem 0 0;color:#c9d8e6;font-size:.8rem}
.md-typeset .fv-hero .fv-pills{margin:.6rem 0 0}
.fv-pills span{display:inline-block;font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#cde8f7;border:1px solid rgba(125,211,252,.35);border-radius:999px;padding:.14rem .62rem;margin:0 .35rem .3rem 0;background:rgba(255,255,255,.06);box-shadow:inset 0 1px 0 rgba(255,255,255,.1);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
@media (max-width:520px){.fv-hero{flex-direction:column;align-items:flex-start;padding:1.2rem 1.2rem 2.7rem}}
.md-typeset .fv-page .fv-intro{font-size:.82rem;line-height:1.6}
/* glass: translucent tiles with a top highlight, a faint sky/teal glow behind the top of the page */
.fv-page{position:relative;isolation:isolate;--fv-glass:linear-gradient(180deg,rgba(255,255,255,.8),rgba(255,255,255,.54));--fv-gedge:rgba(20,60,90,.13);--fv-shine:inset 0 1px 0 rgba(255,255,255,.9);--fv-gdrop:0 10px 28px -20px rgba(20,45,70,.45)}
[data-md-color-scheme="slate"] .fv-page{--fv-glass:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));--fv-gedge:rgba(255,255,255,.09);--fv-shine:inset 0 1px 0 rgba(255,255,255,.07);--fv-gdrop:0 14px 30px -22px rgba(0,0,0,.9)}
.fv-page::before{content:"";position:absolute;inset:0 0 auto;height:min(70vh,640px);z-index:-1;pointer-events:none;-webkit-mask-image:radial-gradient(80% 70% at 50% 40%,#000,transparent);mask-image:radial-gradient(80% 70% at 50% 40%,#000,transparent);
  background:radial-gradient(60% 50% at 10% 0%,rgba(56,189,248,.08),transparent 70%),radial-gradient(55% 45% at 95% 30%,rgba(20,184,166,.06),transparent 70%)}
/* buttons */
.md-typeset .fv-page .md-button{font-family:'Comfortaa',system-ui,sans-serif;font-weight:700;font-size:.66rem;letter-spacing:.02em;border-radius:999px;padding:.5em 1.2em;margin:0 .35rem .45rem 0;color:var(--fv-ink);border:1.5px solid var(--fv-gedge);background:var(--fv-glass);box-shadow:var(--fv-shine)}
.md-typeset .fv-page .md-button:hover{box-shadow:var(--fv-shine),0 6px 18px rgba(2,119,181,.16);border-color:var(--fv-sky);color:var(--fv-ink)}
.md-typeset .fv-page .md-button--primary,[data-md-color-scheme="slate"] .md-typeset .fv-page .md-button--primary{background:linear-gradient(180deg,#16274d,#070d1c);border-color:#070d1c;color:#38bdf8;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 8px 20px -10px rgba(56,189,248,.5)}
[data-md-color-scheme="slate"] .md-typeset .fv-page .md-button--primary{border-color:#38bdf8}
.md-typeset .fv-page .md-button--primary:hover{border-color:#38bdf8;color:#7dd3fc}
[data-md-color-scheme="slate"] .md-typeset .fv-page .md-button:not(.md-button--primary){color:var(--fv-ink)}
[data-md-color-scheme="slate"] .md-typeset .fv-page .md-button:not(.md-button--primary):hover{color:#fff;border-color:var(--fv-sky)}
/* safety note */
.fv-safety{display:flex;gap:.7rem;align-items:flex-start;margin:1rem 0 .4rem;padding:.75rem .95rem;border-radius:14px;background:rgba(251,191,36,.09);border:1px solid rgba(217,119,6,.32);box-shadow:var(--fv-shine)}
.md-typeset .fv-safety p{margin:0;font-size:.7rem;line-height:1.65;color:#6b4206}
.md-typeset .fv-safety strong{color:#9a5b05}
[data-md-color-scheme="slate"] .fv-safety{background:rgba(251,191,36,.07);border-color:rgba(251,191,36,.28)}
[data-md-color-scheme="slate"] .md-typeset .fv-safety p{color:#fcd9a0}
[data-md-color-scheme="slate"] .md-typeset .fv-safety strong{color:#fbbf24}
.fv-safety .twemoji{color:#d97706;flex:none;margin-top:.1rem}
/* step tiles */
.fv-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.75rem;margin:.9rem 0 .4rem}
.fv-steps.fv-3{grid-template-columns:repeat(3,minmax(0,1fr))}
@media (max-width:960px){.fv-steps,.fv-steps.fv-3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:480px){.fv-steps,.fv-steps.fv-3{grid-template-columns:1fr}}
.fv-step{background:var(--fv-glass);border:1px solid var(--fv-gedge);border-radius:14px;padding:.8rem .95rem .85rem;box-shadow:var(--fv-shine),var(--fv-gdrop);transition:border-color .2s ease,transform .2s ease,box-shadow .2s ease}
.fv-step:hover{border-color:var(--fv-sky);transform:translateY(-2px);box-shadow:var(--fv-shine),0 16px 32px -20px rgba(56,189,248,.4)}
.md-typeset .fv-step p{margin:.25rem 0 0;font-size:.68rem;line-height:1.6;color:var(--fv-mute)}
.md-typeset .fv-step p:first-child{display:flex;justify-content:space-between;align-items:center;margin:0}
.md-typeset .fv-step p strong{color:var(--fv-ink);font-size:.78rem;font-weight:700}
.fv-num{font-size:.62rem;font-weight:700;letter-spacing:.1em;color:var(--fv-silt)}
.md-typeset .fv-step .twemoji{color:var(--fv-river)}
.md-typeset .fv-step b.fl{color:#2563eb}.md-typeset .fv-step b.wl{color:#0d9488}.md-typeset .fv-step b.dr{color:#b45309}.md-typeset .fv-step b.ed{color:var(--fv-edge)}
[data-md-color-scheme="slate"] .md-typeset .fv-step b.fl{color:#60a5fa}[data-md-color-scheme="slate"] .md-typeset .fv-step b.wl{color:#2dd4bf}[data-md-color-scheme="slate"] .md-typeset .fv-step b.dr{color:#fbbf24}
/* figures (always on light paper so the line drawings read in both themes) */
.fv-figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;margin:.9rem 0 1.2rem}
@media (max-width:900px){.fv-figs{grid-template-columns:1fr}}
.md-typeset .fv-figs figure{width:auto;max-width:none;margin:0;padding:.7rem .7rem .6rem;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(246,249,251,.92));border:1px solid var(--fv-gedge);border-radius:14px;box-shadow:var(--fv-shine),var(--fv-gdrop)}
.md-typeset .fv-figs figure img{width:100%;height:190px;object-fit:contain}
.md-typeset .fv-figs figcaption{max-width:none;margin:.45rem 0 0;font-size:.62rem;font-style:normal;color:#4f5d68}
/* data chips */
.fv-data{margin:.3rem 0 .6rem}
.md-typeset .fv-data p{margin:0 0 .75rem}
.fv-label{display:block;font-size:.56rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--fv-silt);margin-bottom:.35rem}
.md-typeset .fv-page code{font-family:'Comfortaa',system-ui,sans-serif;font-weight:600;font-size:.62rem;border-radius:999px;padding:.12rem .6rem;margin:0 .15rem .3rem 0;display:inline-block;background:var(--fv-glass);border:1px solid var(--fv-gedge);color:var(--fv-ink)}
.md-typeset .fv-page kbd{font-family:'Comfortaa',system-ui,sans-serif;font-size:.6rem;font-weight:700;border-radius:6px;padding:.1rem .45rem;background:var(--fv-glass);border:1px solid var(--fv-gedge);box-shadow:0 1px 0 var(--fv-line);color:var(--fv-ink)}
.md-typeset .fv-page .fv-keys{font-size:.66rem;color:var(--fv-mute);margin:.7rem 0 0}
.md-typeset .fv-page .fv-note{font-size:.7rem;line-height:1.65;color:var(--fv-mute)}
.md-typeset .fv-page .fv-foot{font-size:.7rem;color:var(--fv-mute)}
.md-typeset .fv-page hr{border-bottom-color:var(--fv-line)}
/* DRR Day 2026 announcement */
.fv-announce{position:relative;margin:0 0 1.1rem;padding:.9rem 1.05rem .85rem 1.25rem;border-radius:14px;background:var(--fv-glass);border:1px solid rgba(217,119,6,.28);box-shadow:var(--fv-shine),var(--fv-gdrop);overflow:hidden}
.fv-announce::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#fbbf24,#38bdf8)}
[data-md-color-scheme="slate"] .fv-announce{border-color:rgba(251,191,36,.25)}
.md-typeset .fv-announce p{margin:.45rem 0 0;font-size:.74rem;line-height:1.65}
.md-typeset .fv-announce p.fv-kicker{margin:0;display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9a5b05}
[data-md-color-scheme="slate"] .md-typeset .fv-announce p.fv-kicker{color:#fcd34d}
.fv-kicker span{background:#fbbf24;color:#070d1c;border-radius:999px;padding:.12rem .55rem;letter-spacing:.1em}
.md-typeset .fv-announce details.fv-why{margin:.6rem 0 0;border:none;box-shadow:none;background:none;padding:0;font-size:.72rem}
.md-typeset .fv-announce details.fv-why>summary{display:inline-flex;align-items:center;gap:.4rem;cursor:pointer;list-style:none;padding:.3rem .8rem;border-radius:999px;border:1px solid var(--fv-gedge);background:var(--fv-glass);box-shadow:var(--fv-shine);font-size:.66rem;font-weight:700;color:var(--fv-ink)}
.md-typeset .fv-announce details.fv-why>summary::-webkit-details-marker{display:none}
.md-typeset .fv-announce details.fv-why>summary::before,.md-typeset .fv-announce details.fv-why>summary::after{display:none}
.md-typeset .fv-announce details.fv-why>summary .fv-chev{display:inline-block;transition:transform .2s ease;color:var(--fv-river)}
.md-typeset .fv-announce details.fv-why[open]>summary .fv-chev{transform:rotate(90deg)}
.md-typeset .fv-announce details.fv-why ul{margin:.6rem 0 0 1rem}
.md-typeset .fv-announce details.fv-why li{font-size:.7rem;line-height:1.6;margin-bottom:.3rem}
@media (prefers-reduced-transparency:reduce){.fv-pills span{-webkit-backdrop-filter:none;backdrop-filter:none}}
</style>

<div class="fv-page" markdown>

<div class="fv-hero" markdown>

![FloodView logo](../assets/images/floodview-icon.png){ .fv-logo }

<div class="fv-hero-text" markdown>

# FloodView { .fv-wordmark }

<p class="fv-tagline">Ground truth for flood maps, from where you stand.</p>

<p class="fv-pills"><span>Camera · GPS · Compass</span><span>v1.1</span><span>During + after flood</span><span>Works offline</span><span>DRR Day 2026</span></p>

</div>
</div>

<div class="fv-announce" markdown>
<p class="fv-kicker"><span>13 Oct 2026</span> International Day for Disaster Risk Reduction</p>

**We are pleased to announce FloodView** on this year's DRR Day, themed [Resilience Starts at Home](https://www.undrr.org/news/undrr-announces-resilience-starts-home-theme-2026-international-day-disaster-risk-reduction). In a flood, the first people to see the water are the people at home. FloodView lets them record it as data that a flood map can be checked against.

**Why it's needed.** Satellite flood maps come fast, but they often miss water in built-up areas, under trees and beneath clouds, and are rarely checked on the ground. Field photos exist, but they sit in phones and chat groups without position or direction. FloodView turns each one into a mapped, labelled observation.

<details class="fv-why" markdown>
<summary><span class="fv-chev">▸</span> Why it matters</summary>

- **Checks the map.** Points labelled flooded, waterlogged or dry show where a flood map is right and where it is wrong.
- **Marks the edge safely.** The crosshair records where the water starts, so nobody has to stand in it.
- **Works when networks fail.** Capture offline, keep full-size photos on the phone, and share one ZIP when the signal returns.
- **Open by default.** Free and open source. GeoJSON and CSV open in QGIS, with no account or server.

</details>
</div>

<p class="fv-intro">A field camera for flood ground truthing. One tap saves a geo-tagged photo labelled flooded, waterlogged or dry, with its look direction, ground footprint and the exact spot under the crosshair, so you can mark the waterline from dry ground. After the flood, it records flood marks and damage.</p>

<div class="fv-links" markdown>
[Launch App →](https://somdeepkundu.github.io/floodview/){ .md-button .md-button--primary }
[Explorer](https://somdeepkundu.github.io/floodview/explorer.html){ .md-button }
[GitHub](https://github.com/somdeepkundu/floodview){ .md-button }
[Sibling: CropView](cropview.md){ .md-button }
</div>

<div class="fv-safety" markdown>
:material-alert-outline:

**Stay safe.** Never wade into moving water: 15 cm of fast water can knock an adult over, and 30 cm can carry a car away. The crosshair point is there so you can tag water without standing in it.
</div>

## In the field

<div class="fv-steps" markdown>

<div class="fv-step" markdown>
<span class="fv-num">01</span> :material-cellphone-check:

**Open & allow**

Tap “Grant Permissions & Continue” and allow camera, location and motion sensors.
</div>

<div class="fv-step" markdown>
<span class="fv-num">02</span> :material-clipboard-text-outline:

**Name the survey**

Set the camera height above the ground, or above the water if you're in it, on a boat or on a bridge.
</div>

<div class="fv-step" markdown>
<span class="fv-num">03</span> :material-crosshairs-gps:

**Wait for GPS**

Stand in the open until the GPS button turns green. Direction off? Tap the compass and draw a figure-8.
</div>

<div class="fv-step" markdown>
<span class="fv-num">04</span> :material-tag-multiple-outline:

**Set the tags**

Depth, flow, rising or receding, and what's flooded. They stay on until you change them.
</div>

<div class="fv-step" markdown>
<span class="fv-num">05</span> :material-gesture-tap-button:

**Tap the class**

<b class="fl">FLOODED</b>, <b class="wl">WATERLOGGED</b> or <b class="dr">DRY</b>: one tap saves the photo with that label.
</div>

<div class="fv-step" markdown>
<span class="fv-num">06</span> :material-vector-polyline:

**Trace the edge**

Switch <b class="ed">〰 Edge</b> on and put the crosshair on the waterline. Walk the boundary from dry ground.
</div>

<div class="fv-step" markdown>
<span class="fv-num">07</span> :material-pencil-outline:

**Fix on the spot**

On the DATA tab, tap EDIT on any capture to change its class, tags, edge flag or note.
</div>

<div class="fv-step" markdown>
<span class="fv-num">08</span> :material-share-variant-outline:

**Export & share**

Tap EXPORT ZIP, or SHARE ZIP straight to WhatsApp or Drive. Then open it in the [Explorer](#explorer).
</div>

</div>

## After the flood

<p class="fv-sub">Pick <b>After flood</b> when you start a survey. The buttons change to:</p>

<div class="fv-steps fv-3" markdown>

<div class="fv-step" markdown>
<span class="fv-num">📏</span> :material-ruler:

**Flood mark**

The water line left on walls and trees. Note its height above the ground.
</div>

<div class="fv-step" markdown>
<span class="fv-num">🏚</span> :material-home-alert-outline:

**Damage**

What is damaged (house, road, bridge, crops, embankment, well, power line…) and how bad: minor, major or destroyed.
</div>

<div class="fv-step" markdown>
<span class="fv-num">✅</span> :material-check-circle-outline:

**Not flooded**

Places that stayed dry. Just as useful for checking a flood map.
</div>

</div>

<p class="fv-note">You can also note the mud left behind and how long the water stayed. Every point gets a simple <code>was_flooded</code> yes/no, so during- and after-flood surveys go on one map.</p>

## Capture geometry

<div class="fv-figs" markdown>

<figure markdown>
![Crosshair point on the waterline](../assets/images/floodview-aim.png)
<figcaption>The crosshair lands h · tan θ ahead. On the waterline, that spot is the water edge.</figcaption>
</figure>

<figure markdown>
![Water edge traced from crosshair points](../assets/images/floodview-edge-trace.png)
<figcaption>Edge points join in capture order to trace the flood boundary.</figcaption>
</figure>

<figure markdown>
![Body-scale water depth](../assets/images/floodview-depth.png)
<figcaption>Depth on a body scale, or a measured value in cm.</figcaption>
</figure>

</div>

<p class="fv-note">The crosshair point is most reliable with the phone tilted 40–80° from straight down, the green band on the tilt bar. Each capture also stores its ± uncertainty. Look direction, tilt and footprint use the same sensor code as CropView.</p>

<div class="fv-data" markdown>
<span class="fv-label">Every capture carries</span>
`flood_class` `water_depth_class` `water_depth_cm` `flow` `level_trend` `flooded_land_cover` `water_edge` `heading_deg` `tilt_deg_from_nadir` `aim_lat` `aim_lon` `aim_uncertainty_m` `gps_accuracy_m`

<span class="fv-label">In the ZIP</span>
`images/` `*_captures_points.geojson` `*_captures_footprints.geojson` `*_water_edge.geojson` `*_captures.csv`

<span class="fv-label">Filename</span>
`Survey_FV-ID_YYYYMMDDHHMMSS_lat_lon.jpg`
</div>

## Explorer

<p class="fv-sub">Map, review and export your ZIPs in the browser, on a phone or a desktop. <a href="https://somdeepkundu.github.io/floodview/explorer.html">Open the Explorer →</a></p>

<div class="fv-steps fv-3" markdown>

<div class="fv-step" markdown>
<span class="fv-num">01</span> :material-folder-zip-outline:

**Load ZIPs**

Drop one or more ZIPs on the map. Each survey gets its own colour. CropView ZIPs open too.
</div>

<div class="fv-step" markdown>
<span class="fv-num">02</span> :material-map-marker-radius-outline:

**Read the map**

Click a point to see its photo. Layers: footprints, crosshair points, water-edge trace, arrows, cones, walking path.
</div>

<div class="fv-step" markdown>
<span class="fv-num">03</span> :material-palette-outline:

**Colour & filter**

Colour points by class, depth, flow, level trend or capture time. Hide a class, or show only edge points.
</div>

<div class="fv-step" markdown>
<span class="fv-num">04</span> :material-image-multiple-outline:

**Browse & zoom photos**

Open any photo full screen. Pinch, scroll or double-tap to zoom, and drag to look around. On phones, swipe for the next photo.
</div>

<div class="fv-step" markdown>
<span class="fv-num">05</span> :material-clipboard-check-outline:

**Review**

Fix the class, depth or edge flag in the table, on the map or in the photo viewer. The original field labels stay beside your edits.
</div>

<div class="fv-step" markdown>
<span class="fv-num">06</span> :material-download-outline:

**Export & resume**

Export reviewed points, water edges or a CSV; the GeoJSON opens in QGIS. Reopen the same ZIPs later and your edits come back.
</div>

</div>

<p class="fv-keys">Photo viewer: <kbd>←</kbd> <kbd>→</kbd> move · <kbd>Space</kbd> next · <kbd>+</kbd> <kbd>−</kbd> zoom · <kbd>0</kbd> fit · <kbd>I</kbd> info · <kbd>Esc</kbd> close</p>

<p class="fv-note"><strong>No network in the flood zone?</strong> Open the app once with internet and it then works offline. Photos are kept full-size on the phone, saved surveys can be resumed, and map tiles you've already viewed stay available. Add it to your home screen for a full-screen app.</p>

---

<p class="fv-foot">Made by <a href="https://somdeepkundu.github.io/">Somdeep Kundu</a> with ❤️ at RuDRA Lab, C-TARA, IIT Bombay · Sibling of <a href="../cropview/">CropView</a> · MIT License</p>

</div>
