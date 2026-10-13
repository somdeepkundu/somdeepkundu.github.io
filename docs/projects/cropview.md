---
hide:
  - toc
description: "CropView: a field capture app that maps every photo as a ground footprint, with its location, look direction and tilt."
og:
  image: assets/images/cropview-card.png
  image_alt: "CropView: geo-tagged field capture app"
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&display=swap');
/* CropView page only: app font (Comfortaa) and palette, with earthy accents */
.cv-page{--cv-navy:#080d1a;--cv-cyan:#22d3ee;--cv-soil:#7a5c3e;--cv-clay:#b07a4f;--cv-wheat:#d9c08f;--cv-sage:#5f8450;--cv-paper:#faf6ee;--cv-line:#e7dcc6;--cv-ink:#22281f;--cv-mute:#6a6555;--cv-icon:#0e8fa8;font-family:'Comfortaa',system-ui,sans-serif;color:var(--cv-ink)}
[data-md-color-scheme="slate"] .cv-page{--cv-paper:#0f1626;--cv-line:#253047;--cv-ink:#e8f0fe;--cv-mute:#a3ab9a;--cv-sage:#9dbb8a;--cv-wheat:#d9c08f;--cv-icon:#22d3ee}
.md-typeset .cv-page p,.md-typeset .cv-page li,.md-typeset .cv-page figcaption{font-family:inherit}
.md-typeset .cv-page h2{font-family:'Comfortaa',system-ui,sans-serif;font-weight:700;font-size:1.1rem;color:var(--cv-ink);margin:2.2rem 0 .2rem}
.md-typeset .cv-page h2::after,[data-md-color-scheme="slate"] .md-typeset .cv-page h2::after{width:3rem;background:linear-gradient(90deg,var(--cv-soil),var(--cv-wheat),var(--cv-sage))}
.md-typeset .cv-page .cv-sub{margin:.55rem 0 0;font-size:.74rem;color:var(--cv-mute)}
.md-typeset .cv-page a:not(.md-button):not(.md-tabs__link):not(.md-nav__link):not(.md-footer__link):not(.md-source__link):not(.md-header__button){color:var(--cv-icon)!important;text-decoration-color:rgba(14,143,168,.35)}
[data-md-color-scheme="slate"] .md-typeset .cv-page a:not(.md-button):not(.md-tabs__link):not(.md-nav__link):not(.md-footer__link):not(.md-source__link):not(.md-header__button){color:var(--cv-cyan)!important}
/* hero: app navy with a strip of crop rows and a soil band */
.cv-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:1.25rem;padding:1.5rem 1.7rem 2.6rem;margin:0 0 1.3rem;border-radius:16px;background:radial-gradient(130% 160% at 0% 0%,#17233f 0%,#0c1324 55%,#080d1a 100%)}
.cv-hero::before{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,#7a5c3e,#b07a4f,#d9c08f,#7f9c6f)}
.cv-hero::after{content:"";position:absolute;left:0;right:0;bottom:4px;height:46px;opacity:.45;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='24' viewBox='0 0 30 24'%3E%3Cg fill='none' stroke='%23a9c98f' stroke-width='1.3' stroke-linecap='round'%3E%3Cpath d='M15 23V13'/%3E%3Cpath d='M15 15c-3-4-6-4-8-3'/%3E%3Cpath d='M15 14c3-4 6-5 8-4'/%3E%3C/g%3E%3C/svg%3E") repeat-x bottom left/30px 24px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent);mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)}
.md-typeset .cv-hero>p{margin:0;flex:none;position:relative;z-index:1}
.cv-hero-text{position:relative;z-index:1}
.md-typeset .cv-hero img.cv-logo{display:block;width:78px;height:78px;border-radius:20px;box-shadow:0 0 0 1px rgba(34,211,238,.25),0 8px 24px rgba(0,0,0,.4)}
.md-typeset .cv-hero h1.cv-wordmark{font-family:'Comfortaa',system-ui,sans-serif;font-weight:700;font-size:2.2rem;line-height:1.1;margin:0;color:#22d3ee;letter-spacing:.01em}
.md-typeset .cv-hero .cv-tagline{margin:.3rem 0 0;color:#c9d3df;font-size:.8rem}
.md-typeset .cv-hero .cv-pills{margin:.6rem 0 0}
.cv-pills span{display:inline-block;font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#e7d5ad;border:1px solid rgba(217,192,143,.4);border-radius:999px;padding:.14rem .62rem;margin:0 .35rem .3rem 0}
@media (max-width:520px){.cv-hero{flex-direction:column;align-items:flex-start;padding:1.2rem 1.2rem 2.6rem}}
.md-typeset .cv-page .cv-intro{font-size:.82rem;line-height:1.6}
/* buttons */
.md-typeset .cv-page .md-button{font-family:'Comfortaa',system-ui,sans-serif;font-weight:700;font-size:.66rem;letter-spacing:.02em;border-radius:999px;padding:.5em 1.2em;margin:0 .35rem .45rem 0;color:var(--cv-ink);border:1.5px solid var(--cv-line);background:var(--cv-paper)}
.md-typeset .cv-page .md-button:hover{box-shadow:0 6px 18px rgba(122,92,62,.18);border-color:var(--cv-clay);color:var(--cv-ink)}
.md-typeset .cv-page .md-button--primary{background:#080d1a;border-color:#080d1a;color:#22d3ee}
.md-typeset .cv-page .md-button--primary:hover{background:#0f1626;border-color:#22d3ee;color:#22d3ee}
[data-md-color-scheme="slate"] .md-typeset .cv-page .md-button--primary{border-color:#22d3ee}
[data-md-color-scheme="slate"] .md-typeset .cv-page .md-button--primary{background:#080d1a;color:#22d3ee}
[data-md-color-scheme="slate"] .md-typeset .cv-page .md-button:not(.md-button--primary){color:var(--cv-ink);border-color:var(--cv-line);background:var(--cv-paper)}
[data-md-color-scheme="slate"] .md-typeset .cv-page .md-button:not(.md-button--primary):hover{color:#fff;border-color:var(--cv-wheat);background:var(--cv-paper)}
/* step tiles */
.cv-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.75rem;margin:.9rem 0 .4rem}
.cv-steps.cv-3{grid-template-columns:repeat(3,minmax(0,1fr))}
@media (max-width:960px){.cv-steps,.cv-steps.cv-3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:480px){.cv-steps,.cv-steps.cv-3{grid-template-columns:1fr}}
.cv-step{background:var(--cv-paper);border:1px solid var(--cv-line);border-radius:14px;padding:.8rem .95rem .85rem;transition:border-color .2s ease,transform .2s ease}
.cv-step:hover{border-color:var(--cv-clay);transform:translateY(-2px)}
.md-typeset .cv-step p{margin:.25rem 0 0;font-size:.68rem;line-height:1.6;color:var(--cv-mute)}
.md-typeset .cv-step p:first-child{display:flex;justify-content:space-between;align-items:center;margin:0}
.md-typeset .cv-step p strong{color:var(--cv-ink);font-size:.78rem;font-weight:700}
.cv-num{font-size:.62rem;font-weight:700;letter-spacing:.1em;color:var(--cv-sage)}
.md-typeset .cv-step .twemoji{color:var(--cv-icon)}
/* figures */
.cv-figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;margin:.9rem 0 1.2rem}
@media (max-width:900px){.cv-figs{grid-template-columns:1fr}}
.md-typeset .cv-figs figure{width:auto;max-width:none;margin:0;padding:.7rem .7rem .6rem;background:#f8fafd;border:1px solid var(--cv-line);border-radius:14px}
.md-typeset .cv-figs figure img{width:100%;height:180px;object-fit:contain}
.md-typeset .cv-figs figcaption{max-width:none;margin:.45rem 0 0;font-size:.62rem;font-style:normal;color:#5a5648}
/* data chips */
.cv-data{margin:.3rem 0 .6rem}
.md-typeset .cv-data p{margin:0 0 .75rem}
.cv-label{display:block;font-size:.56rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--cv-soil);margin-bottom:.35rem}
[data-md-color-scheme="slate"] .cv-label{color:var(--cv-wheat)}
.md-typeset .cv-page code{font-family:'Comfortaa',system-ui,sans-serif;font-weight:600;font-size:.62rem;border-radius:999px;padding:.12rem .6rem;margin:0 .15rem .3rem 0;display:inline-block;background:var(--cv-paper);border:1px solid var(--cv-line);color:var(--cv-ink)}
.md-typeset .cv-page kbd{font-family:'Comfortaa',system-ui,sans-serif;font-size:.6rem;font-weight:700;border-radius:6px;padding:.1rem .45rem;background:var(--cv-paper);border:1px solid var(--cv-line);box-shadow:0 1px 0 var(--cv-line);color:var(--cv-ink)}
.md-typeset .cv-page .cv-keys{font-size:.66rem;color:var(--cv-mute);margin:.7rem 0 0}
.md-typeset .cv-page .cv-note{font-size:.68rem;color:var(--cv-mute)}
.md-typeset .cv-page .cv-foot{font-size:.7rem;color:var(--cv-mute)}
.md-typeset .cv-page hr{border-bottom-color:var(--cv-line)}
/* glass (matches app v3.6) — kept subtle: translucent tiles with a top highlight, a faint sky/leaf glow, frosted pills in the hero */
.cv-page{position:relative;isolation:isolate;--cv-glass:linear-gradient(180deg,rgba(255,255,255,.78),rgba(255,255,255,.52));--cv-gedge:rgba(122,92,62,.14);--cv-shine:inset 0 1px 0 rgba(255,255,255,.9);--cv-gdrop:0 10px 28px -20px rgba(60,45,25,.45)}
[data-md-color-scheme="slate"] .cv-page{--cv-glass:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));--cv-gedge:rgba(255,255,255,.09);--cv-shine:inset 0 1px 0 rgba(255,255,255,.07);--cv-gdrop:0 14px 30px -22px rgba(0,0,0,.9)}
.cv-page::before{content:"";position:absolute;inset:0 0 auto;height:min(70vh,640px);z-index:-1;pointer-events:none;-webkit-mask-image:radial-gradient(80% 70% at 50% 40%,#000,transparent);mask-image:radial-gradient(80% 70% at 50% 40%,#000,transparent);
  background:radial-gradient(60% 50% at 10% 0%,rgba(34,211,238,.07),transparent 70%),radial-gradient(55% 45% at 95% 30%,rgba(127,156,111,.07),transparent 70%)}
[data-md-color-scheme="slate"] .cv-page::before{background:radial-gradient(60% 50% at 10% 0%,rgba(34,211,238,.09),transparent 70%),radial-gradient(55% 45% at 95% 30%,rgba(52,211,153,.06),transparent 70%)}
.cv-hero{box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 40px -26px rgba(8,13,26,.8)}
.cv-hero-text::before{content:"";position:absolute;inset:-3rem -40vw auto auto;width:22rem;height:14rem;z-index:-1;border-radius:50%;background:radial-gradient(closest-side,rgba(34,211,238,.10),transparent);pointer-events:none}
.cv-pills span{background:rgba(255,255,255,.06);box-shadow:inset 0 1px 0 rgba(255,255,255,.1);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.md-typeset .cv-hero img.cv-logo{box-shadow:0 0 0 1px rgba(255,255,255,.14),inset 0 1px 0 rgba(255,255,255,.3),0 10px 28px -6px rgba(34,211,238,.35)}
.cv-step,.md-typeset .cv-figs figure{background:var(--cv-glass);border-color:var(--cv-gedge);box-shadow:var(--cv-shine),var(--cv-gdrop)}
.cv-step:hover{box-shadow:var(--cv-shine),0 16px 32px -20px rgba(34,211,238,.35)}
[data-md-color-scheme="slate"] .md-typeset .cv-figs figure{background:linear-gradient(180deg,rgba(248,250,253,.96),rgba(240,244,250,.92))}
.md-typeset .cv-page .md-button:not(.md-button--primary),[data-md-color-scheme="slate"] .md-typeset .cv-page .md-button:not(.md-button--primary){background:var(--cv-glass);border-color:var(--cv-gedge);box-shadow:var(--cv-shine)}
.md-typeset .cv-page .md-button--primary,[data-md-color-scheme="slate"] .md-typeset .cv-page .md-button--primary{background:linear-gradient(180deg,#15203a,#080d1a);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 8px 20px -10px rgba(34,211,238,.45)}
.md-typeset .cv-page code,.md-typeset .cv-page kbd{background:var(--cv-glass);border-color:var(--cv-gedge)}
@media (prefers-reduced-transparency:reduce){.cv-pills span{-webkit-backdrop-filter:none;backdrop-filter:none}}
</style>

<div class="cv-page" markdown>

<div class="cv-hero" markdown>

![CropView logo](../assets/images/cropview-icon.png){ .cv-logo }

<div class="cv-hero-text" markdown>

# CropView { .cv-wordmark }

<p class="cv-tagline">Let the place speak in coordinates and geometries.</p>

<p class="cv-pills"><span>Camera · GPS · Compass</span><span>v3.6</span><span>Web + Android</span></p>

</div>
</div>

<p class="cv-intro">A field capture app that turns every photo into a mapped ground footprint, with its location, look direction and tilt.</p>

<div class="cv-links" markdown>
[Launch App →](https://somdeepkundu.github.io/cropview-v3/){ .md-button .md-button--primary }
[Data Explorer](https://somdeepkundu.github.io/cropview-v3/cropview-viewer-v2.html){ .md-button }
[Field Manual (PDF)](../assets/files/CropView_Field_Manual_v3.4.pdf){ .md-button }
[GitHub](https://github.com/somdeepkundu/cropview-v3){ .md-button }
</div>

## In the field

<div class="cv-steps" markdown>

<div class="cv-step" markdown>
<span class="cv-num">01</span> :material-cellphone-check:

**Open & allow**

Tap “Grant Permissions & Continue” and allow camera, location and compass.
</div>

<div class="cv-step" markdown>
<span class="cv-num">02</span> :material-clipboard-text-outline:

**Start a session**

Name the project. Standing? Keep the camera height at 1.5 m.
</div>

<div class="cv-step" markdown>
<span class="cv-num">03</span> :material-crosshairs-gps:

**Wait for GPS**

Stand in the open until the GPS button turns blue. Direction off? Tap the compass.
</div>

<div class="cv-step" markdown>
<span class="cv-num">04</span> :material-sprout-outline:

**Aim**

Tilt until the side bar shows ✓ GOOD. Crop surveys: pick the Kc stage in DATA first.
</div>

<div class="cv-step" markdown>
<span class="cv-num">05</span> :material-camera-iris:

**Capture**

Hold still and tap CAPTURE. Location, look direction and tilt are saved.
</div>

<div class="cv-step" markdown>
<span class="cv-num">06</span> :material-map-outline:

**Map**

See your camera POV and ground footprint on the map.
</div>

<div class="cv-step" markdown>
<span class="cv-num">07</span> :material-package-variant-closed:

**Export**

Before closing, open DATA, scroll down and tap EXPORT ZIP.
</div>

<div class="cv-step" markdown>
<span class="cv-num">08</span> :material-map-search-outline:

**Explore**

Open the ZIP in the [Data Explorer](#data-explorer), guide below.
</div>

</div>

## Capture geometry

<div class="cv-figs" markdown>

<figure markdown>
![Ground footprint of a capture](../assets/images/cropview-hero.png)
<figcaption>Each photo is mapped as a ground footprint.</figcaption>
</figure>

<figure markdown>
![Camera tilt from nadir](../assets/images/cropview-camera-tilt.png)
<figcaption>Phone at chest, 28–55° from nadir reads ✓ GOOD.</figcaption>
</figure>

<figure markdown>
![Anatomy of a capture](../assets/images/cropview-capture-anatomy.png)
<figcaption>h: camera height · θ: tilt from nadir.</figcaption>
</figure>

</div>

<div class="cv-data" markdown>
<span class="cv-label">Every frame carries</span>
`lat` `lon` `azimuth` `tilt` `altitude` `acc_h` `fp_w_m` `fp_d_m` `heading_source`

<span class="cv-label">Filename</span>
`ProjectName_ID_YYYYMMDDHHMMSS_lat_lon.jpg`
</div>

## Data Explorer

<p class="cv-sub">Map, browse and label your exported ZIPs in the browser. <a href="https://somdeepkundu.github.io/cropview-v3/cropview-viewer-v2.html">Open the Data Explorer →</a></p>

<div class="cv-steps cv-3" markdown>

<div class="cv-step" markdown>
<span class="cv-num">01</span> :material-folder-zip-outline:

**Load ZIPs**

Drop one or more exported ZIPs on the upload box. Each ZIP becomes its own colour-coded set.
</div>

<div class="cv-step" markdown>
<span class="cv-num">02</span> :material-map-marker-radius-outline:

**Read the map**

Click a point to see its photo and footprint. Switch layers on or off: footprint, azimuth arrow, FOV cone, capture path.
</div>

<div class="cv-step" markdown>
<span class="cv-num">03</span> :material-palette-outline:

**Colour & align**

Colour points by project, azimuth, tilt, altitude or index. Arrows look off? Turn them with Rotation Offset.
</div>

<div class="cv-step" markdown>
<span class="cv-num">04</span> :material-image-multiple-outline:

**Browse & zoom photos**

Open any photo full screen. Pinch, scroll or double-tap to zoom, and drag to look around. On phones, swipe for the next photo.
</div>

<div class="cv-step" markdown>
<span class="cv-num">05</span> :material-tag-outline:

**Annotate**

On the Annotate tab, select points, type a 2-digit class code and tap Apply to selected. 1st digit: crop or land type. 2nd: growth stage.
</div>

<div class="cv-step" markdown>
<span class="cv-num">06</span> :material-download-outline:

**Export & resume**

Export Annotated GeoJSON; it opens in QGIS. Import it later to pick up where you left off.
</div>

</div>

<p class="cv-keys">Photo viewer: <kbd>←</kbd> <kbd>→</kbd> move · <kbd>Space</kbd> next · <kbd>+</kbd> <kbd>−</kbd> zoom · <kbd>0</kbd> fit · <kbd>I</kbd> info · <kbd>Esc</kbd> close</p>

<p class="cv-note">The <a href="../../assets/files/CropView_Field_Manual_v3.4.pdf">field manual</a> is a two-page print, with the field steps in English, हिन्दी, मराठी, தமிழ் and বাংলা.</p>

---

<p class="cv-foot">Made by <a href="https://somdeepkundu.github.io/">Somdeep Kundu</a> with ❤️ at RuDRA Lab, C-TARA, IIT Bombay · RGSTC Project · MIT License</p>

</div>
