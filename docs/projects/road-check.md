---
hide:
  - toc
title: "Road Check"
description: "A phone web app that logs road roughness while you ride: a score for every 20 m, sharp bumps, a coloured map and an LLM-ready ZIP. Works offline."
og:
  image: assets/images/road-check-card.png
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');
/* FloodView page only: app font (Comfortaa) and monsoon palette, with a silt accent.
   Same structure as the CropView page (cv-*), scoped under .rc-page. */
.rc-page{--rc-navy:#1b1d1a;--rc-sky:#f2b84b;--rc-river:#1f4d3a;--rc-deep:#1f4d3a;--rc-teal:#c2410c;--rc-silt:#8a6a45;--rc-sand:#d8c39a;--rc-edge:#e2549a;--rc-paper:#f6f9fb;--rc-line:#d9e3ea;--rc-ink:#14212b;--rc-mute:#5b6875;font-family:'Atkinson Hyperlegible',system-ui,sans-serif;color:var(--rc-ink)}
[data-md-color-scheme="slate"] .rc-page{--rc-paper:#0e1628;--rc-line:#24304a;--rc-ink:#e8f0fe;--rc-mute:#9fb0c3;--rc-river:#f2b84b;--rc-silt:#d8c39a;--rc-edge:#f472b6}
.md-typeset .rc-page p,.md-typeset .rc-page li,.md-typeset .rc-page figcaption{font-family:inherit}
.md-typeset .rc-page h2{font-family:'Atkinson Hyperlegible',system-ui,sans-serif;font-weight:700;font-size:1.1rem;color:var(--rc-ink);margin:2.2rem 0 .2rem}
.md-typeset .rc-page h2::after,[data-md-color-scheme="slate"] .md-typeset .rc-page h2::after{width:3rem;background:linear-gradient(90deg,var(--rc-deep),var(--rc-sky),var(--rc-teal),var(--rc-silt))}
.md-typeset .rc-page .rc-sub{margin:.55rem 0 0;font-size:.74rem;color:var(--rc-mute)}
.md-typeset .rc-page a:not(.md-button):not(.md-tabs__link):not(.md-nav__link):not(.md-footer__link):not(.md-source__link):not(.md-header__button){color:var(--rc-river)!important;text-decoration-color:rgba(31,77,58,.35)}
[data-md-color-scheme="slate"] .md-typeset .rc-page a:not(.md-button):not(.md-tabs__link):not(.md-nav__link):not(.md-footer__link):not(.md-source__link):not(.md-header__button){color:var(--rc-sky)!important;text-decoration-color:rgba(242,184,75,.4)}
/* hero: app navy with two rows of waves and a water-to-silt band */
.rc-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:1.25rem;padding:1.5rem 1.7rem 2.7rem;margin:0 0 1.3rem;border-radius:16px;background:radial-gradient(130% 160% at 0% 0%,#2b3a2f 0%,#22261f 55%,#1b1d1a 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 40px -26px rgba(7,13,28,.8)}
.rc-hero::before{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,#1f4d3a,#f2b84b,#c2410c,#8a6a45)}
.rc-hero::after{content:"";position:absolute;left:0;right:0;bottom:4px;height:40px;opacity:.5;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='40' viewBox='0 0 48 40'%3E%3Cg fill='none' stroke-linecap='round'%3E%3Cpath d='M0 14 Q12 6 24 14 T48 14' stroke='%23bae6fd' stroke-width='1.6'/%3E%3Cpath d='M0 28 Q12 20 24 28 T48 28' stroke='%237dd3fc' stroke-width='1.3' stroke-opacity='.6'/%3E%3C/g%3E%3C/svg%3E") repeat-x bottom left/48px 40px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent);mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)}
.md-typeset .rc-hero>p{margin:0;flex:none;position:relative;z-index:1}
.rc-hero-text{position:relative;z-index:1}
.rc-hero-text::before{content:"";position:absolute;inset:-3rem -40vw auto auto;width:22rem;height:14rem;z-index:-1;border-radius:50%;background:radial-gradient(closest-side,rgba(242,184,75,.12),transparent);pointer-events:none}
.md-typeset .rc-hero img.rc-logo{display:block;width:78px;height:78px;border-radius:20px;box-shadow:0 0 0 1px rgba(255,255,255,.14),inset 0 1px 0 rgba(255,255,255,.3),0 10px 28px -6px rgba(242,184,75,.4)}
.md-typeset .rc-hero h1.rc-wordmark{font-family:'Atkinson Hyperlegible',system-ui,sans-serif;font-weight:700;font-size:2.2rem;line-height:1.1;margin:0;color:#f2b84b;letter-spacing:.01em}
.md-typeset .rc-hero .rc-tagline{margin:.3rem 0 0;color:#d9d3c3;font-size:.8rem}
.md-typeset .rc-hero .rc-pills{margin:.6rem 0 0}
.rc-pills span{display:inline-block;font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ece4cf;border:1px solid rgba(242,184,75,.35);border-radius:999px;padding:.14rem .62rem;margin:0 .35rem .3rem 0;background:rgba(255,255,255,.06);box-shadow:inset 0 1px 0 rgba(255,255,255,.1);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
@media (max-width:520px){.rc-hero{flex-direction:column;align-items:flex-start;padding:1.2rem 1.2rem 2.7rem}}
.md-typeset .rc-page .rc-intro{font-size:.82rem;line-height:1.6}
/* glass: translucent tiles with a top highlight, a faint sky/teal glow behind the top of the page */
.rc-page{position:relative;isolation:isolate;--rc-glass:linear-gradient(180deg,rgba(255,255,255,.8),rgba(255,255,255,.54));--rc-gedge:rgba(20,60,90,.13);--rc-shine:inset 0 1px 0 rgba(255,255,255,.9);--rc-gdrop:0 10px 28px -20px rgba(20,45,70,.45)}
[data-md-color-scheme="slate"] .rc-page{--rc-glass:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));--rc-gedge:rgba(255,255,255,.09);--rc-shine:inset 0 1px 0 rgba(255,255,255,.07);--rc-gdrop:0 14px 30px -22px rgba(0,0,0,.9)}
.rc-page::before{content:"";position:absolute;inset:0 0 auto;height:min(70vh,640px);z-index:-1;pointer-events:none;-webkit-mask-image:radial-gradient(80% 70% at 50% 40%,#000,transparent);mask-image:radial-gradient(80% 70% at 50% 40%,#000,transparent);
  background:radial-gradient(60% 50% at 10% 0%,rgba(242,184,75,.08),transparent 70%),radial-gradient(55% 45% at 95% 30%,rgba(194,65,12,.06),transparent 70%)}
/* buttons */
.md-typeset .rc-page .md-button{font-family:'Atkinson Hyperlegible',system-ui,sans-serif;font-weight:700;font-size:.66rem;letter-spacing:.02em;border-radius:999px;padding:.5em 1.2em;margin:0 .35rem .45rem 0;color:var(--rc-ink);border:1.5px solid var(--rc-gedge);background:var(--rc-glass);box-shadow:var(--rc-shine)}
.md-typeset .rc-page .md-button:hover{box-shadow:var(--rc-shine),0 6px 18px rgba(31,77,58,.16);border-color:var(--rc-sky);color:var(--rc-ink)}
.md-typeset .rc-page .md-button--primary,[data-md-color-scheme="slate"] .md-typeset .rc-page .md-button--primary{background:linear-gradient(180deg,#2b3a2f,#1b1d1a);border-color:#1b1d1a;color:#f2b84b;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 8px 20px -10px rgba(242,184,75,.5)}
[data-md-color-scheme="slate"] .md-typeset .rc-page .md-button--primary{border-color:#f2b84b}
.md-typeset .rc-page .md-button--primary:hover{border-color:#f2b84b;color:#c7bfa6}
[data-md-color-scheme="slate"] .md-typeset .rc-page .md-button:not(.md-button--primary){color:var(--rc-ink)}
[data-md-color-scheme="slate"] .md-typeset .rc-page .md-button:not(.md-button--primary):hover{color:#fff;border-color:var(--rc-sky)}
/* safety note */
.rc-safety{display:flex;gap:.7rem;align-items:flex-start;margin:1rem 0 .4rem;padding:.75rem .95rem;border-radius:14px;background:rgba(251,191,36,.09);border:1px solid rgba(217,119,6,.32);box-shadow:var(--rc-shine)}
.md-typeset .rc-safety p{margin:0;font-size:.7rem;line-height:1.65;color:#6b4206}
.md-typeset .rc-safety strong{color:#9a5b05}
[data-md-color-scheme="slate"] .rc-safety{background:rgba(251,191,36,.07);border-color:rgba(251,191,36,.28)}
[data-md-color-scheme="slate"] .md-typeset .rc-safety p{color:#fcd9a0}
[data-md-color-scheme="slate"] .md-typeset .rc-safety strong{color:#fbbf24}
.rc-safety .twemoji{color:#d97706;flex:none;margin-top:.1rem}
/* step tiles */
.rc-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.75rem;margin:.9rem 0 .4rem}
.rc-steps.rc-3{grid-template-columns:repeat(3,minmax(0,1fr))}
@media (max-width:960px){.rc-steps,.rc-steps.rc-3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:480px){.rc-steps,.rc-steps.rc-3{grid-template-columns:1fr}}
.rc-step{background:var(--rc-glass);border:1px solid var(--rc-gedge);border-radius:14px;padding:.8rem .95rem .85rem;box-shadow:var(--rc-shine),var(--rc-gdrop);transition:border-color .2s ease,transform .2s ease,box-shadow .2s ease}
.rc-step:hover{border-color:var(--rc-sky);transform:translateY(-2px);box-shadow:var(--rc-shine),0 16px 32px -20px rgba(242,184,75,.4)}
.md-typeset .rc-step p{margin:.25rem 0 0;font-size:.68rem;line-height:1.6;color:var(--rc-mute)}
.md-typeset .rc-step p:first-child{display:flex;justify-content:space-between;align-items:center;margin:0}
.md-typeset .rc-step p strong{color:var(--rc-ink);font-size:.78rem;font-weight:700}
.rc-num{font-size:.62rem;font-weight:700;letter-spacing:.1em;color:var(--rc-silt)}
.md-typeset .rc-step .twemoji{color:var(--rc-river)}
.md-typeset .rc-step b.fl{color:#2563eb}.md-typeset .rc-step b.wl{color:#0d9488}.md-typeset .rc-step b.dr{color:#b45309}.md-typeset .rc-step b.ed{color:var(--rc-edge)}
[data-md-color-scheme="slate"] .md-typeset .rc-step b.fl{color:#60a5fa}[data-md-color-scheme="slate"] .md-typeset .rc-step b.wl{color:#2dd4bf}[data-md-color-scheme="slate"] .md-typeset .rc-step b.dr{color:#fbbf24}
/* figures (always on light paper so the line drawings read in both themes) */
.rc-figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;margin:.9rem 0 1.2rem}
@media (max-width:900px){.rc-figs{grid-template-columns:1fr}}
.md-typeset .rc-figs figure{width:auto;max-width:none;margin:0;padding:.7rem .7rem .6rem;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(246,249,251,.92));border:1px solid var(--rc-gedge);border-radius:14px;box-shadow:var(--rc-shine),var(--rc-gdrop)}
.md-typeset .rc-figs figure img{width:100%;height:190px;object-fit:contain}
.md-typeset .rc-figs figcaption{max-width:none;margin:.45rem 0 0;font-size:.62rem;font-style:normal;color:#4f5d68}
/* data chips */
.rc-data{margin:.3rem 0 .6rem}
.md-typeset .rc-data p{margin:0 0 .75rem}
.rc-label{display:block;font-size:.56rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--rc-silt);margin-bottom:.35rem}
.md-typeset .rc-page code{font-family:'Atkinson Hyperlegible',system-ui,sans-serif;font-weight:600;font-size:.62rem;border-radius:999px;padding:.12rem .6rem;margin:0 .15rem .3rem 0;display:inline-block;background:var(--rc-glass);border:1px solid var(--rc-gedge);color:var(--rc-ink)}
.md-typeset .rc-page kbd{font-family:'Atkinson Hyperlegible',system-ui,sans-serif;font-size:.6rem;font-weight:700;border-radius:6px;padding:.1rem .45rem;background:var(--rc-glass);border:1px solid var(--rc-gedge);box-shadow:0 1px 0 var(--rc-line);color:var(--rc-ink)}
.md-typeset .rc-page .rc-keys{font-size:.66rem;color:var(--rc-mute);margin:.7rem 0 0}
.md-typeset .rc-page .rc-note{font-size:.7rem;line-height:1.65;color:var(--rc-mute)}
.md-typeset .rc-page .rc-foot{font-size:.7rem;color:var(--rc-mute)}
.md-typeset .rc-page hr{border-bottom-color:var(--rc-line)}
/* DRR Day 2026 announcement */
.rc-announce{position:relative;margin:0 0 1.1rem;padding:.9rem 1.05rem .85rem 1.25rem;border-radius:14px;background:var(--rc-glass);border:1px solid rgba(217,119,6,.28);box-shadow:var(--rc-shine),var(--rc-gdrop);overflow:hidden}
.rc-announce::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#fbbf24,#f2b84b)}
[data-md-color-scheme="slate"] .rc-announce{border-color:rgba(251,191,36,.25)}
.md-typeset .rc-announce p{margin:.45rem 0 0;font-size:.74rem;line-height:1.65}
.md-typeset .rc-announce p.rc-kicker{margin:0;display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9a5b05}
[data-md-color-scheme="slate"] .md-typeset .rc-announce p.rc-kicker{color:#fcd34d}
.rc-kicker span{background:#fbbf24;color:#1b1d1a;border-radius:999px;padding:.12rem .55rem;letter-spacing:.1em}
.md-typeset .rc-announce details.rc-why{margin:.6rem 0 0;border:none;box-shadow:none;background:none;padding:0;font-size:.72rem}
.md-typeset .rc-announce details.rc-why>summary{display:inline-flex;align-items:center;gap:.4rem;cursor:pointer;list-style:none;padding:.3rem .8rem;border-radius:999px;border:1px solid var(--rc-gedge);background:var(--rc-glass);box-shadow:var(--rc-shine);font-size:.66rem;font-weight:700;color:var(--rc-ink)}
.md-typeset .rc-announce details.rc-why>summary::-webkit-details-marker{display:none}
.md-typeset .rc-announce details.rc-why>summary::before,.md-typeset .rc-announce details.rc-why>summary::after{display:none}
.md-typeset .rc-announce details.rc-why>summary .rc-chev{display:inline-block;transition:transform .2s ease;color:var(--rc-river)}
.md-typeset .rc-announce details.rc-why[open]>summary .rc-chev{transform:rotate(90deg)}
.md-typeset .rc-announce details.rc-why ul{margin:.6rem 0 0 1rem}
.md-typeset .rc-announce details.rc-why li{font-size:.7rem;line-height:1.6;margin-bottom:.3rem}
@media (prefers-reduced-transparency:reduce){.rc-pills span{-webkit-backdrop-filter:none;backdrop-filter:none}}
.rc-figs.rc-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.md-typeset .rc-figs figure img{height:auto;max-height:300px}
.md-typeset .rc-poster img{width:100%;border-radius:12px;border:1px solid var(--rc-gedge)}
.md-typeset .rc-page table{font-size:.66rem}
.md-typeset .rc-qr img{width:150px;border-radius:12px;background:#fff;padding:6px}
</style>

<div class="rc-page" markdown>

<div class="rc-hero" markdown>

![Road Check logo](../assets/images/road-check-icon.png){ .rc-logo }

<div class="rc-hero-text" markdown>

# Road Check { .rc-wordmark }

<p class="rc-tagline">How rough is the road? Ride it and find out.</p>

<p class="rc-pills"><span>Accelerometer · GPS</span><span>v0.2.0</span><span>20 m stretches</span><span>Works offline</span><span>Experimental</span></p>

</div>
</div>

<p class="rc-intro">A phone web app that logs how rough the road is while you ride a motorbike, scooter, bicycle or car. It turns the phone's shake into a roughness score for every 20 m of road, marks sharp bumps, and colours the route on a map. One ZIP holds everything, including a ready brief for an LLM to look up road types, surfaces and speed breakers and make a report poster.</p>

<div class="rc-links" markdown>
[Launch App →](https://somdeepkundu.github.io/geo-dev-skills-bysomdeep/apps/road-check/){ .md-button .md-button--primary }
[GitHub](https://github.com/somdeepkundu/geo-dev-skills-bysomdeep/tree/main/apps/road-check){ .md-button }
[Sibling: CropView](cropview.md){ .md-button }
[Sibling: FloodView](floodview.md){ .md-button }
</div>

<div class="rc-safety" markdown>
:material-alert-outline:

**Ride first, data second.** Set the app up while you are stopped, then don't touch the phone on the move. Use a proper handlebar mount, never a hand.
</div>

## On the ride

<div class="rc-steps" markdown>

<div class="rc-step" markdown>
<span class="rc-num">01</span> :material-cellphone-arrow-down:

**Open once online**

Open the app with internet once. It then works with no network, and can be added to the home screen.
</div>

<div class="rc-step" markdown>
<span class="rc-num">02</span> :material-map-outline:

**Save the map**

At home on wifi, tap “Save the map around me” for about 1.5 km of street map to use offline.
</div>

<div class="rc-step" markdown>
<span class="rc-num">03</span> :material-motorbike:

**Pick vehicle & mount**

Choose the vehicle and where the phone sits. A handlebar mount gives the cleanest data; a pocket adds your own movement.
</div>

<div class="rc-step" markdown>
<span class="rc-num">04</span> :material-play-circle-outline:

**Start ride**

Allow location and motion. Wait for “logging” and a GPS figure of ±10 m or better.
</div>

<div class="rc-step" markdown>
<span class="rc-num">05</span> :material-brightness-4:

**Dim screen**

A locked phone stops the sensors, so the screen stays on but goes black and ignores touches. Hold the ring 2 s to wake it.
</div>

<div class="rc-step" markdown>
<span class="rc-num">06</span> :material-flag-checkered:

**End ride**

Tap End twice. The summary shows distance, share of each road class, and the roughest stretches.
</div>

<div class="rc-step" markdown>
<span class="rc-num">07</span> :material-folder-zip-outline:

**Export ZIP**

GeoJSON and CSV for QGIS, the raw readings, <code>datapackage.json</code> and <code>PROMPT.md</code>.
</div>

<div class="rc-step" markdown>
<span class="rc-num">08</span> :material-robot-outline:

**Ask an LLM**

Tap “Copy LLM prompt”, or hand over the ZIP. The brief asks for a road-type analysis and a report poster.
</div>

</div>

## How it scores the road

| Step | What happens |
|---|---|
| **Vertical shake** | The phone's acceleration is projected on a slowly averaged gravity direction, so the phone can sit at any angle. |
| **20 m stretches** | The ride is cut by distance, not time, interpolated between GPS fixes. Each stretch gets `rms_v`, `peak_v`, bumps, speed and curve. |
| **Speed-adjusted index** | `rms_v × (30 km/h ÷ speed)`. Classes: smooth < 1.0 · fair < 2.0 · rough < 3.5 · very rough. |
| **No guessing** | Below 10 km/h, under 20 readings a second, or with weak GPS, a stretch is left unscored (empty, never 0). Standing still is trimmed. |
| **Sharp bumps** | Peaks over 4 m/s², merged within 0.25 s, saved as points. |

<p class="rc-note">Raw readings are kept in 10 s chunks on the phone, either all of them or a rolling window of the last 5 or 30 minutes plus ±2 s around every bump. Nothing leaves the phone until you export.</p>

## Validation

<div class="rc-steps rc-3" markdown>

<div class="rc-step" markdown>
<span class="rc-num">169</span> :material-check-all:

**Automated tests pass**

Checks on the maths and in a real browser, including a full ride with the network switched off.
</div>

<div class="rc-step" markdown>
<span class="rc-num">±5%</span> :material-angle-acute:

**Any phone angle**

Against known vibration, with the phone tilted six ways, readings stay within 5%.
</div>

<div class="rc-step" markdown>
<span class="rc-num">3</span> :material-map-marker-path:

**Field rides**

Validated in rural Bengal and Mumbai. Rides in Delhi–Noida are going on.
</div>

</div>

<figure markdown>
![Bench test: measured against true vibration](../assets/images/road-check-bench.png){ style="max-width:460px" }
<figcaption>Bench test: every reading sits on the 1:1 line whatever the phone's angle.</figcaption>
</figure>

## Who it helps

| | |
|---|---|
| **Road policy makers & PWD / PMGSY engineers** | A cheap, repeatable roughness map to rank repairs and check new roads after handover. |
| **Municipalities & panchayats** | Evidence for budget asks, ward by ward or village by village. |
| **Researchers** | Open, explained data for road, transport and rural-access studies. |
| **Riders & citizens** | Rough stretches and speed breakers mapped from an everyday phone. |

## In the ZIP

<div class="rc-data" markdown>
<span class="rc-label">Every 20 m stretch carries</span>
`index` `class` `rms_v` `peak_v` `rms_lateral` `bumps` `speed_kmh` `heading_deg` `curve_radius_gps_m` `curve_radius_gyro_m` `rate_hz` `gps_acc_max_m` `flags`

<span class="rc-label">Files</span>
`data/*_segments.geojson` `data/*_segments.csv` `data/*_bumps.geojson` `raw/*_raw.csv` `ride.json` `datapackage.json` `PROMPT.md` `README.txt`

<span class="rc-label">The LLM brief asks for</span>
`OSM road type & surface` `speed breakers` `rain` `ranked stretches` `report poster`
</div>

<div class="rc-qr" markdown>
![QR code for Road Check](../assets/images/road-check-qr.png)
</div>
<p class="rc-note">Scan to open on a phone. Works on Android Chrome; on iPhone, Safari asks for motion permission when you start.</p>

---

<p class="rc-foot">Made by <a href="https://somdeepkundu.github.io/">Somdeep Kundu</a> with ❤️ at RuDRA Lab, C-TARA, IIT Bombay · Built on the phone-field-sensors skill · MIT License</p>

</div>
