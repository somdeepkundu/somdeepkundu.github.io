---
hide:
  - toc
---
# CropView

![CropView](../assets/images/cropview-hero.png)

*Let the place speak in coordinates and geometries.*

A geo-tagged field capture app. Point your phone at a crop, or anything you want to record, and every photo is saved with its location, look direction, tilt and ground footprint on the map.

**Requires:** Camera · GPS · Compass  
**Version:** v3.4 LTR · RGSTC Project · MIT License

[Launch App →](https://somdeepkundu.github.io/cropview-v3/){ .md-button .md-button--primary } [Data Explorer →](https://somdeepkundu.github.io/cropview-v3/cropview-viewer-v2.html){ .md-button } [Field Manual (PDF) →](../assets/files/CropView_Field_Manual_v3.4.pdf){ .md-button } [GitHub →](https://github.com/somdeepkundu/cropview-v3){ .md-button }

## How to use

1. **Open & allow.** Open CropView. Tap “Grant Permissions & Continue” and allow camera, location and compass.
2. **Start a session.** Type a project name. If you are standing, keep the camera height at 1.5 m. Tap **START SESSION**.
3. **Wait for GPS.** Stand in the open until the GPS button turns blue. Direction looks wrong? Tap the compass.
4. **Aim.** Point the phone at what you want to photograph. Tilt it until the side bar shows **✓ GOOD**.
5. **Take the photo.** Hold still and tap **CAPTURE**. Location, look direction and tilt are saved with every photo.
6. **Map tab.** See your camera POV and footprint on the map.
7. **Save your work.** Before closing the app, open the **DATA** tab, scroll to the bottom and tap **EXPORT ZIP**.
8. **Explore.** Open the ZIP in the [Data Explorer](https://somdeepkundu.github.io/cropview-v3/cropview-viewer-v2.html).

!!! note "Crop surveys only"
    First pick the crop stage (Kc stage) in the **DATA** tab.

## Camera tilt (from nadir)

![Camera tilt from nadir](../assets/images/cropview-camera-tilt.png){ width="460" }

Hold the phone at chest level and aim at the target. A tilt of 28–55° from nadir shows **✓ GOOD**.

## Anatomy of a capture

![Anatomy of a capture](../assets/images/cropview-capture-anatomy.png){ width="600" }

*h* is the camera height and *θ* is the tilt from straight down (nadir).

**Every frame carries:** `lat` `lon` `azimuth` `tilt` `altitude` `acc_h` `fp_w_m` `fp_d_m` `heading_source`

**Filename structure:** `ProjectName_ID_YYYYMMDDHHMMSS_lat_lon.jpg`

## Field manual

A printable two-page manual, with the steps in English, हिन्दी, मराठी, தமிழ் and বাংলা.

[Download Field Manual (PDF) →](../assets/files/CropView_Field_Manual_v3.4.pdf){ .md-button }

---

Made by [Somdeep Kundu](https://somdeepkundu.github.io/) with ❤️ at RuDRA Lab, C-TARA, IIT Bombay
