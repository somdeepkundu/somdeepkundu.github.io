---
hide:
  - toc
og:
  image: assets/images/social-card.jpg
  image_alt: "Somdeep Kundu: geospatial portfolio, map layers of terrain, crops and night lights"
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&display=swap');
/* home page only: subtle paper grain + warm earthy mottling.
   ~1.5 KB of CSS, no image requests: the grain is a 240px SVG noise tile the browser
   draws once and repeats; it scrolls with the page (no fixed layer, no blend modes,
   no animation), so scrolling and painting cost nothing extra. Regenerate the tile
   strength via the feColorMatrix alpha row and the g opacity. */
body[data-md-color-scheme="default"]{--md-default-bg-color:#f9f5ee;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='a' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.329 0 0 0 0 0.243 0 0 0 0 0.157 1.3 0 0 0 -0.58'/%3E%3C/filter%3E%3Cfilter id='b' x='0' y='0'%3E%3CfeTurbulence type='turbulence' baseFrequency='.006 .32' numOctaves='2' seed='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.329 0 0 0 0 0.243 0 0 0 0 0.157 2.0 0 0 0 -1.3'/%3E%3C/filter%3E%3Cg opacity='0.4'%3E%3Crect width='240' height='240' filter='url(%23a)'/%3E%3Crect width='240' height='240' filter='url(%23b)'/%3E%3C/g%3E%3C/svg%3E"),
    radial-gradient(1100px 700px at 8% -5%,rgba(208,180,138,.16),transparent 65%),
    radial-gradient(900px 800px at 105% 30%,rgba(176,138,104,.10),transparent 60%),
    radial-gradient(800px 600px at 25% 85%,rgba(160,140,96,.08),transparent 60%);
  background-repeat:repeat,no-repeat,no-repeat,no-repeat}
body[data-md-color-scheme="slate"]{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='a' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1.000 0 0 0 0 0.957 0 0 0 0 0.894 1.3 0 0 0 -0.58'/%3E%3C/filter%3E%3Cfilter id='b' x='0' y='0'%3E%3CfeTurbulence type='turbulence' baseFrequency='.006 .32' numOctaves='2' seed='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1.000 0 0 0 0 0.957 0 0 0 0 0.894 2.0 0 0 0 -1.3'/%3E%3C/filter%3E%3Cg opacity='0.12'%3E%3Crect width='240' height='240' filter='url(%23a)'/%3E%3Crect width='240' height='240' filter='url(%23b)'/%3E%3C/g%3E%3C/svg%3E"),
    radial-gradient(1100px 700px at 8% -5%,rgba(196,154,110,.07),transparent 65%),
    radial-gradient(900px 800px at 105% 30%,rgba(176,120,96,.05),transparent 60%);
  background-repeat:repeat,no-repeat,no-repeat}
@media print,(prefers-contrast:more),(forced-colors:active){body[data-md-color-scheme]{background-image:none}}
/* CropView pill styles removed from the home page; the project page still has its own */
/* home page only: launch announcement (Pujo Map + FloodView), each in its own app palette */
.ann{margin:0 0 1.4rem}
.md-typeset .ann-label{display:flex;align-items:center;gap:.7rem;margin:0 0 .6rem;font-family:'Comfortaa',system-ui,sans-serif;font-size:.58rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#8a7a66}
.ann-label::before,.ann-label::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,currentColor);opacity:.45}
.ann-label::after{transform:scaleX(-1)}
.ann-label span{display:inline-flex;align-items:center;gap:.45rem}
.ann-label span::before{content:"";width:6px;height:6px;border-radius:50%;background:#e2554a;box-shadow:0 0 0 0 rgba(226,85,74,.5);animation:annPulse 2.4s ease-out infinite}
[data-md-color-scheme="slate"] .ann-label{color:#b3a48f}
.ann-row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
@media (max-width:700px){.ann-row{grid-template-columns:1fr}}
.md-typeset .ann a.ann-card,.md-typeset .ann a.ann-card:hover{position:relative;display:flex;align-items:center;gap:.85rem;padding:.8rem 1rem .95rem .85rem;border-radius:16px;overflow:hidden;text-decoration:none;transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s ease;opacity:0;animation:annIn .7s cubic-bezier(.2,.7,.2,1) forwards}
.md-typeset .ann a.ann-flood{animation-delay:.14s}
.md-typeset .ann a.ann-card:hover{transform:translateY(-3px)}
.ann-card::before{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;transform:skewX(-20deg) translateX(0);background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);opacity:0;pointer-events:none}
.ann-card:hover::before{opacity:1;transform:skewX(-20deg) translateX(420%);transition:transform .9s ease,opacity .2s}
.ann-body{display:flex;flex-direction:column;min-width:0;gap:.12rem}
.ann-tag{font-family:'Comfortaa',system-ui,sans-serif;font-size:.54rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.ann-title{font-size:1.02rem;font-weight:700;line-height:1.2}
.ann-sub{font-size:.68rem;line-height:1.45}
.ann-mark{flex:none;width:46px;height:46px}
.ann-arrow{margin-left:auto;flex:none;font-size:1.05rem;transition:transform .3s ease}
.ann-card:hover .ann-arrow{transform:translateX(4px)}
/* pujo: laal paar shada, white with an alta-red double border */
.md-typeset .ann a.ann-pujo,.md-typeset .ann a.ann-pujo:hover{background:linear-gradient(180deg,#fff,#fdf3f2);border:1px solid #ecd9d8;color:#241e1f!important;box-shadow:0 8px 22px -14px rgba(176,21,31,.45)}
.ann-pujo::after{content:"";position:absolute;left:0;right:0;bottom:0;height:7px;background:linear-gradient(#b0151f 0 3px,transparent 3px 4px,#b0151f 4px)}
.ann-pujo .ann-mark{color:#b0151f}.ann-pujo .ann-tag,.ann-pujo .ann-arrow{color:#b0151f}.ann-pujo .ann-sub{color:#6f6668}
.md-typeset .ann a.ann-pujo:hover{box-shadow:0 14px 28px -14px rgba(176,21,31,.55)}
[data-md-color-scheme="slate"] .md-typeset .ann a.ann-pujo,[data-md-color-scheme="slate"] .md-typeset .ann a.ann-pujo:hover{background:linear-gradient(180deg,#241a1b,#1a1314);border-color:#4a3436;color:#f3ecec!important}
[data-md-color-scheme="slate"] .ann-pujo .ann-mark,[data-md-color-scheme="slate"] .ann-pujo .ann-tag,[data-md-color-scheme="slate"] .ann-pujo .ann-arrow{color:#ea4a51}
[data-md-color-scheme="slate"] .ann-pujo::after{background:linear-gradient(#ea4a51 0 3px,transparent 3px 4px,#ea4a51 4px)}
[data-md-color-scheme="slate"] .ann-pujo .ann-sub{color:#aba0a2}
/* floodview: monsoon navy, sky glow, water-to-silt band */
.md-typeset .ann a.ann-flood,.md-typeset .ann a.ann-flood:hover{background:radial-gradient(130% 160% at 0% 0%,#16274d,#0b1430 60%,#070d1c);border:1px solid rgba(125,211,252,.28);color:#e8f0fe!important;box-shadow:0 8px 22px -14px rgba(7,13,28,.8)}
.ann-flood::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,#1d4ed8,#38bdf8,#14b8a6,#8a6a45)}
.ann-flood .ann-mark{border-radius:12px;box-shadow:0 0 0 1px rgba(255,255,255,.14),0 6px 18px -4px rgba(56,189,248,.45)}
.ann-flood .ann-tag,.ann-flood .ann-arrow{color:#38bdf8}.ann-flood .ann-sub{color:#b9cadb}
.md-typeset .ann a.ann-flood:hover{box-shadow:0 14px 30px -14px rgba(56,189,248,.5)}
.md-typeset .ann a.ann-card,.md-typeset .ann a.ann-card *{text-decoration:none!important;border-bottom:0!important}
.md-typeset .ann a.ann-pujo .ann-title{color:#241e1f!important}.md-typeset .ann a.ann-pujo .ann-tag,.md-typeset .ann a.ann-pujo .ann-arrow{color:#b0151f!important}.md-typeset .ann a.ann-pujo .ann-sub{color:#6f6668!important}
.md-typeset .ann a.ann-flood .ann-title{color:#fff!important}.md-typeset .ann a.ann-flood .ann-tag,.md-typeset .ann a.ann-flood .ann-arrow{color:#38bdf8!important}.md-typeset .ann a.ann-flood .ann-sub{color:#b9cadb!important}
[data-md-color-scheme="slate"] .md-typeset .ann a.ann-pujo .ann-title{color:#f3ecec!important}[data-md-color-scheme="slate"] .md-typeset .ann a.ann-pujo .ann-tag,[data-md-color-scheme="slate"] .md-typeset .ann a.ann-pujo .ann-arrow{color:#ea4a51!important}[data-md-color-scheme="slate"] .md-typeset .ann a.ann-pujo .ann-sub{color:#aba0a2!important}
@keyframes annIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes annPulse{70%,100%{box-shadow:0 0 0 7px rgba(226,85,74,0)}}
/* siuli (shiuli, night jasmine): a few blossoms drift down the page; decorative only */
.siuli-layer{position:fixed;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.siuli{position:absolute;top:-40px;will-change:transform}
.siuli i{display:block;will-change:transform}
.siuli svg{display:block;width:100%;height:100%;filter:drop-shadow(0 1px 1.5px rgba(90,60,30,.35))}
.siuli{animation:siuliFall var(--d) linear var(--l) infinite}
.siuli i{animation:siuliSway var(--s) ease-in-out var(--l) infinite alternate}
.siuli svg{animation:siuliSpin var(--r) linear var(--l) infinite}
@keyframes siuliFall{from{transform:translate3d(0,-6vh,0)}to{transform:translate3d(var(--x),112vh,0)}}
@keyframes siuliSway{from{transform:translateX(-18px)}to{transform:translateX(18px)}}
@keyframes siuliSpin{from{transform:rotate(var(--a)) rotateY(0)}to{transform:rotate(calc(var(--a) + 360deg)) rotateY(360deg)}}
@media (prefers-reduced-motion:reduce){.siuli-layer{display:none}.md-typeset .ann a.ann-card{animation:none;opacity:1}.ann-label span::before{animation:none}}
</style>

<section class="ann" aria-label="Latest launches">
  <p class="ann-label"><span>Now live</span></p>
  <div class="ann-row">
    <a class="ann-card ann-pujo" href="projects/pujo-map/">
      <svg class="ann-mark" viewBox="-50 -50 100 100" fill="currentColor" aria-hidden="true"><circle r="4.2"/><g><path d="M0-7C6-13 6-25 0-33C-6-25-6-13 0-7Z"/><path transform="rotate(45)" d="M0-7C6-13 6-25 0-33C-6-25-6-13 0-7Z"/><path transform="rotate(90)" d="M0-7C6-13 6-25 0-33C-6-25-6-13 0-7Z"/><path transform="rotate(135)" d="M0-7C6-13 6-25 0-33C-6-25-6-13 0-7Z"/><path transform="rotate(180)" d="M0-7C6-13 6-25 0-33C-6-25-6-13 0-7Z"/><path transform="rotate(225)" d="M0-7C6-13 6-25 0-33C-6-25-6-13 0-7Z"/><path transform="rotate(270)" d="M0-7C6-13 6-25 0-33C-6-25-6-13 0-7Z"/><path transform="rotate(315)" d="M0-7C6-13 6-25 0-33C-6-25-6-13 0-7Z"/></g><circle r="37" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>
      <span class="ann-body">
        <span class="ann-tag">Durga Puja 2026</span>
        <span class="ann-title">Mumbai Durga Pujo Map</span>
        <span class="ann-sub">115 pujos, nearest first, in English and <span lang="bn">বাংলা</span></span>
      </span>
      <span class="ann-arrow">→</span>
    </a>
    <a class="ann-card ann-flood" href="projects/floodview/">
      <img class="ann-mark" src="assets/images/floodview-icon.png" alt="">
      <span class="ann-body">
        <span class="ann-tag">Launched on DRR Day</span>
        <span class="ann-title">FloodView</span>
        <span class="ann-sub">A free field camera for flood ground truthing</span>
      </span>
      <span class="ann-arrow">→</span>
    </a>
  </div>
</section>

<div class="siuli-layer" aria-hidden="true"></div>


<script>
(function(){
  function go(){
    var L=document.querySelector('.siuli-layer');
    if(!L||L.dataset.on)return; L.dataset.on=1;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var ns='http://www.w3.org/2000/svg',n=innerWidth<700?9:16;
    var svg='<svg viewBox="-50 -50 100 100" aria-hidden="true">';
    for(var k=0;k<5;k++)svg+='<ellipse cx="0" cy="-24" rx="10" ry="25" transform="rotate('+(k*72)+')" fill="#fffdf8" stroke="#e8ddcb" stroke-width="1.4"/>';
    svg+='<circle r="9" fill="#f08a2c"/><circle r="4" fill="#d96a12"/></svg>';
    for(var i=0;i<n;i++){
      var w=document.createElement('div'),b=document.createElement('i'),z=14+Math.random()*16;
      w.className='siuli';
      w.style.left=(Math.random()*100)+'vw';
      w.style.width=w.style.height=z+'px';
      w.style.opacity=(.55+Math.random()*.4).toFixed(2);
      w.style.setProperty('--d',(14+Math.random()*12).toFixed(1)+'s');
      w.style.setProperty('--l',(-Math.random()*26).toFixed(1)+'s');
      w.style.setProperty('--s',(2.8+Math.random()*3).toFixed(1)+'s');
      w.style.setProperty('--r',(7+Math.random()*9).toFixed(1)+'s');
      w.style.setProperty('--a',Math.floor(Math.random()*360)+'deg');
      w.style.setProperty('--x',(Math.random()*120-60).toFixed(0)+'px');
      b.style.width=b.style.height='100%';
      b.innerHTML=svg; w.appendChild(b); L.appendChild(w);
    }
  }
  if(typeof document$!=='undefined')document$.subscribe(go); else if(document.readyState!=='loading')go(); else document.addEventListener('DOMContentLoaded',go);
})();
</script>

<div class="hero">
  <img src="assets/images/profile.png" alt="Somdeep Kundu" class="profile-photo">
  <div>
    <h1>Somdeep Kundu</h1>
    <p><strong>PhD Scholar, IIT Bombay | RuDRA Lab, C-TARA</strong></p>
    <p><em>Generalised Abstract Spatio-temporal madness</em></p>
  </div>
</div>

---

## About Me

<div class="about-section" markdown>
<div class="about-text" markdown>

I am a PhD Scholar at the Centre for Technology Alternatives for Rural Areas (C-TARA) at Indian Institute of Technology, Bombay, and part of the RuDRA (Rural Data Research Analysis) Lab. Building on my background in Civil Engineering and a PG diploma in Disaster Management with Remote Sensing & GIS from IIRS, ISRO, my work addresses agricultural water optimization for rural Maharashtra, especially for small holding farmers in this extreme times of rainfall vulnerability. My methodology centers on field-operationalizable approaches, learning from bottom up, need assessment then implement hydrological modeling rather than purely theoretical machine learning. By integrating ancient agrometeorology with multimodal satellite data (such as NISAR and Sentinel) and multi-temporal ground-truthing from inhouse built CropView v2.0 app, I utilize Python, QGIS, and Google Earth Engine to translate complex geospatial data into actionable rural applications. 

</div>

<div class="about-image">
  <img src="assets/images/about.png" alt="About">
  <p><a href="https://somdeepkundu.github.io/assets/files/IndiaAI-ImpactSummit-Somdeep.pdf" target="_blank" rel="noopener">View IndiaAI Summit poster →</a></p>
</div>

</div>

---

[View My Projects :material-arrow-right:](projects/index.md){ .md-button .md-button--primary }
[Download CV :material-download:](assets/Somdeep-Kundu-CV.pdf){ .md-button }


---

## Skills

<div class="grid cards" markdown>

-   :material-layers:{ .lg .middle } **GIS & Remote Sensing**

    ---

    - Google Earth Engine, QGIS
    - GDAL / OGR — Drone data spatial analysis with open-source tools
    - STAC API for satellite data integration
    - DGCA-approved certified drone pilot (Rotorcraft, VLOS, Small)

-   :material-code-braces:{ .lg .middle } **Programming**

    ---

    - Python — Machine Learning & Automation
    - R — Spatial Data Analysis
    - JavaScript — Web mapping & GEE
    - HTML, CSS — Web Development
    - Natural Language / Vibe Coding — Agentic Workflow
    - Parallel processing using Dask and XArray

-   :material-star-four-points:{ .lg .middle } **Machine Learning & GeoAI**

    ---

    - Linear Algebra, Bayesian Statistics
    - Classical and non-Markovian hybrid approach
    - Post-classification accuracy assessment
    - Time-series spatial data processing and gap filling
    - Foundational Model (Alpha Earth)
    - Graph Neural Networks (GNN), Knowledge Graph
    - Sustainable and Trustworthy AI
    - Chaos Theory applications in agrometeorology

-   :material-earth:{ .lg .middle } **Web Mapping & Applications**

    ---

    - Streamlit for data-driven web apps and dashboards
    - Interactive web-based application development (GEE apps, GitHub.io)
    - Integrating indigenous knowledge systems with spatial data
    - Multiband spatiotemporal remote sensing data visualization
    - Static and dynamic web development

-   :material-account-group:{ .lg .middle } **Social & Emotional Skills**

    ---

    - Highly motivated
    - Working on technology alternative for Rural Areas
    - Communication skills and active leadership experiences
    - Evidence-based policy evaluation studies
    - Qualitative research, Auto-Ethnography

</div>

---

## Connect

[GitHub](https://github.com/somdeepkundu){ .md-button }
[LinkedIn](https://linkedin.com/in/somdeep-kundu){ .md-button }
[ResearchGate](https://www.researchgate.net/profile/Somdeep-Kundu-2){ .md-button } 
[Website](https://www.somdeepkundu.in/){ .md-button }
