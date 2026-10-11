---
hide:
  - toc
---

<div class="cv-hero" markdown>

![CropView logo](../assets/images/cropview-icon.png){ .cv-logo }

<div class="cv-hero-text" markdown>

# CropView { .cv-wordmark }

<p class="cv-tagline">Let the place speak in coordinates and geometries.</p>

<p class="cv-pills"><span>Camera · GPS · Compass</span><span>v3.4 LTR</span><span>Web + Android</span></p>

</div>
</div>

A field capture app that turns every photo into a mapped ground footprint, with its location, look direction and tilt.

<div class="cv-links" markdown>
[Launch App →](https://somdeepkundu.github.io/cropview-v3/){ .md-button .md-button--primary }
[Data Explorer](https://somdeepkundu.github.io/cropview-v3/cropview-viewer-v2.html){ .md-button }
[Field Manual (PDF)](../assets/files/CropView_Field_Manual_v3.4.pdf){ .md-button }
[GitHub](https://github.com/somdeepkundu/cropview-v3){ .md-button }
</div>

## How it works

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

Open the ZIP in the [Data Explorer](https://somdeepkundu.github.io/cropview-v3/cropview-viewer-v2.html).
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

<p class="cv-note">The <a href="../../assets/files/CropView_Field_Manual_v3.4.pdf">field manual</a> is a two-page print, with the steps in English, हिन्दी, मराठी, தமிழ் and বাংলা.</p>

---

Made by [Somdeep Kundu](https://somdeepkundu.github.io/) with ❤️ at RuDRA Lab, C-TARA, IIT Bombay · RGSTC Project · MIT License
