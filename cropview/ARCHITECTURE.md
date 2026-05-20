# CropView — Technical Architecture

> Deep design document for contributors and layer implementors.

---

## 1. Coordinate & Geometry Model

### 1.1 Reference Frame

All coordinates stored in **WGS84 (EPSG:4326)**.  
Layer 2 will reproject to **UTM** for metric distance operations using `proj4js`.

```
Phone GPS  →  WGS84 (lat/lon)
             ↓  proj4.forward(utmZone)
           UTM (easting/northing) in metres
             ↓  turf.destination / bearing math
           FOV polygon corners in UTM
             ↓  proj4.inverse(utmZone)
           GeoJSON polygon in WGS84
```

### 1.2 Camera Frustum Projection

The camera FOV creates a **truncated pyramid** (frustum). We intersect it with the ground plane:

```
Device position (D)
        │
        │  H = height above ground (m)
        │
        ● ─────── β (tilt from vertical)
       /|\
      / | \
     /  |  \
    /   |   \
   ────────────── GROUND PLANE
   ←── w/2 ──→
        ↑
   ground_distance = H × tan(β)
   footprint_width = 2 × H × tan(β) × tan(θ_h/2)
```

**Variables:**

| Symbol | Meaning | Source |
|---|---|---|
| H | Device height above ground | GPS altitude or assumed 1.5m |
| β | Camera tilt from horizontal | `DeviceOrientationEvent.beta` |
| θ_h | Horizontal FOV | Device lookup table or ~65° default |
| θ_v | Vertical FOV | θ_h × (sensor_h / sensor_w) |
| α | Compass azimuth | `DeviceOrientationEvent.alpha` (absolute) |

**Layer 2 improvement**: Use actual camera EXIF `FocalLength` and `FocalPlaneXResolution` to compute precise FOV:

```
θ_h = 2 × arctan(sensor_width_mm / (2 × focal_length_mm))
```

### 1.3 Polygon Construction (Turf.js)

```javascript
// 1. Project device location forward by ground_distance along azimuth
const fwdCenter = turf.destination(origin, ground_distance_km, azimuth_deg);

// 2. From forward center, offset left and right by half footprint width
const farLeft  = turf.destination(fwdCenter, half_width_km, azimuth - 90);
const farRight = turf.destination(fwdCenter, half_width_km, azimuth + 90);

// 3. Near edge at device feet (smaller width)
const nearLeft  = turf.destination(origin, half_width_km * 0.5, azimuth - 90);
const nearRight = turf.destination(origin, half_width_km * 0.5, azimuth + 90);

// 4. Close polygon: nearLeft → farLeft → farRight → nearRight → nearLeft
```

---

## 2. Sensor Pipeline

### 2.1 GPS

```
navigator.geolocation.watchPosition(callback, error, {
  enableHighAccuracy: true,   // requests GPS chip (not WiFi/cell)
  maximumAge: 2000,           // accept 2s old cached position
  timeout: 10000              // fail after 10s
})
```

**Accuracy tiers:**
- < 5m  → High confidence (RTK-like, clear sky)
- 5–15m → Good (standard phone GPS)
- 15–30m → Marginal (obstructed / indoors)
- > 30m → Warn user; do not capture

### 2.2 Compass

**Android (Chrome):**
```javascript
window.addEventListener('deviceorientationabsolute', e => {
  azimuth = e.alpha;  // 0° = True North (absolute mode)
  tilt    = e.beta;   // 0° = flat, 90° = vertical
  roll    = e.gamma;
});
```

**iOS (Safari 13+):**
```javascript
DeviceOrientationEvent.requestPermission().then(state => {
  if (state === 'granted') {
    window.addEventListener('deviceorientation', e => {
      azimuth = e.webkitCompassHeading; // iOS proprietary, compensated
      tilt    = e.beta;
    });
  }
});
```

**Known issues:**
- iOS compass needs `requestPermission()` — must be triggered by user gesture
- `deviceorientation` (non-absolute) gives arbitrary alpha on Android; prefer `deviceorientationabsolute`
- Magnetic declination: Layer 2 will apply World Magnetic Model correction

### 2.3 Camera

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'environment',    // rear camera
    width:  { ideal: 1920 },
    height: { ideal: 1080 }
  }
});
video.srcObject = stream;
```

**FOV defaults by sensor (Layer 2 improvement):**

| Device Class | H-FOV | V-FOV |
|---|---|---|
| iPhone 14+ (main) | 77° | 59° |
| iPhone 14+ (ultra-wide) | 120° | 94° |
| Pixel 7 (main) | 79° | 62° |
| Generic Android | ~65° | ~49° |
| Fallback | 65° | 49° |

---

## 3. Data Model

### 3.1 Capture Object (in-memory / localStorage)

```typescript
interface Capture {
  id:          string;       // "CV-{timestamp}"
  timestamp:   string;       // ISO 8601
  lat:         number;       // WGS84 decimal degrees
  lon:         number;       // WGS84 decimal degrees
  altitude:    number|null;  // metres above WGS84 ellipsoid
  accuracy:    number;       // metres (1σ horizontal)
  azimuth:     number;       // degrees true north (0–360)
  tilt:        number;       // degrees from horizontal
  fov:         number;       // horizontal FOV in degrees
  kcStage:     1|2|3|4|null; // FAO-56 growth stage
  footprint: {
    widthM:    number;       // ground footprint width (m)
    depthM:    number;       // ground footprint depth (m)
  } | null;
  polygon:     [number,number][] | null;  // GeoJSON ring coords
  thumb:       string;       // base64 JPEG (40% quality, for UI)
  full:        string;       // base64 JPEG (85% quality, for export)
}
```

### 3.2 GeoJSON Export (Layer 2 contract)

The exported GeoJSON is the **interface contract** between Layer 1 and Layer 2.  
Layer 2 reads this file and enriches each feature with satellite-derived data.

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "app": "CropView Layer 1",
    "version": "1.0.0",
    "exported": "2026-05-15T09:22:45Z",
    "totalCaptures": 12
  },
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [lon, lat, alt]
      },
      "properties": {
        "id": "CV-1715812345678",
        "timestamp": "2026-05-15T09:22:45.123Z",
        "azimuth_deg": 142,
        "tilt_deg": 38,
        "hfov_deg": 65,
        "gps_accuracy_m": 4.2,
        "kc_stage": 3,
        "footprint_width_m": 8.4,
        "footprint_depth_m": 5.1,
        // Layer 2 will ADD these fields:
        "sentinel2_date": null,
        "sentinel2_tile": null,
        "ndvi_centroid": null,
        "ndvi_mean_polygon": null,
        "ndvi_std_polygon": null,
        "kc_derived_from_ndvi": null,
        "stage_match": null
      },
      "fov_polygon": {
        "type": "Polygon",
        "coordinates": [[ [lon,lat], ... ]]
      }
    }
  ]
}
```

---

## 4. Layer 2 Design (Planned)

### 4.1 Sentinel-2 Data Access

**Free API options (no key required for basic access):**

| API | URL | Notes |
|---|---|---|
| Copernicus STAC | `https://catalogue.dataspace.copernicus.eu/stac/v1` | Search by bbox + date |
| Element84 STAC | `https://earth-search.aws.element84.com/v1` | Sentinel-2 L2A on AWS |
| Sentinel Hub | `https://services.sentinel-hub.com` | Free tier, needs registration |

**Search flow:**
```javascript
// 1. Build bounding box from capture lat/lon (±0.01°)
const bbox = [lon-0.01, lat-0.01, lon+0.01, lat+0.01];

// 2. Query STAC for scenes within ±15 days of capture
const stacUrl = `https://earth-search.aws.element84.com/v1/search?
  collections=sentinel-2-l2a
  &bbox=${bbox.join(',')}
  &datetime=${startDate}/${endDate}
  &query=eo:cloud_cover<20`;

// 3. Select scene with closest timestamp to capture
// 4. Fetch B04 (Red) and B08 (NIR) COG tiles
// 5. Compute NDVI = (NIR - Red) / (NIR + Red)
// 6. Sample pixel values at FOV polygon centroid
```

### 4.2 NDVI → Kc Mapping

Based on FAO-56 and empirical research:

```javascript
function ndviToKcStage(ndvi, cropType = 'wheat') {
  const thresholds = {
    wheat: { initial: 0.15, development: 0.40, mid: 0.70, late: 0.45 },
    maize: { initial: 0.15, development: 0.45, mid: 0.75, late: 0.50 },
    rice:  { initial: 0.20, development: 0.50, mid: 0.80, late: 0.55 },
  };
  const t = thresholds[cropType] || thresholds.wheat;

  if (ndvi < t.initial)     return { stage: 1, label: 'Initial' };
  if (ndvi < t.development) return { stage: 2, label: 'Development' };
  if (ndvi < t.mid)         return { stage: 3, label: 'Mid-Season' };
                            return { stage: 4, label: 'Late-Season' };
}
```

---

## 5. Layer 3 Design (Planned)

### 5.1 Mismatch Detection

```
User selects Kc Stage 3 (Mid-Season)
         ↓
Satellite NDVI at location = 0.22
         ↓
NDVI → Kc Stage 1 (Initial)
         ↓
⚠ ALERT: "Observed stage (3) does not match
           satellite-derived stage (1).
           Check irrigation or pest damage."
```

### 5.2 ET₀ × Kc Calculation

```
ETc = ET₀ × Kc
```

Where:
- **ET₀** = Reference evapotranspiration (from weather API, e.g. Open-Meteo)
- **Kc** = Crop coefficient for current stage
- **ETc** = Crop water requirement (mm/day)

---

## 6. Privacy & Permissions

| Permission | Why needed | When requested |
|---|---|---|
| Camera | Capture field photos | On app start (user gesture) |
| Geolocation | GPS coordinates for capture | On app start |
| DeviceOrientation | Compass + tilt for FOV | On app start (iOS needs gesture) |

**No data leaves the device in Layer 1.**  
All captures stored in `localStorage`. Export is manual by user.  
Layer 2 will make read-only API calls to Copernicus/STAC (no user data sent).

---

## 7. File Structure (Target)

```
cropview/
├── index.html              ← Layer 1: self-contained app
├── README.md
├── ARCHITECTURE.md         ← this file
├── LICENSE
│
├── layer2/                 ← (future)
│   ├── sentinel.js         ← STAC API + NDVI computation
│   ├── correlate.js        ← FOV polygon × satellite pixel sampling
│   └── proj.js             ← coordinate reprojection (proj4js)
│
├── layer3/                 ← (future)
│   ├── kc-classifier.js    ← NDVI → Kc stage logic
│   ├── et-calculator.js    ← ETc = ET₀ × Kc
│   └── crops.json          ← Kc tables per crop type
│
└── data/
    └── sample-captures.geojson  ← test dataset
```

---

## 8. Known Limitations (Layer 1)

| Issue | Impact | Fix in Layer |
|---|---|---|
| FOV assumes 65° for all devices | Inaccurate footprint polygon | L2: device lookup table |
| Altitude defaults to 1.5m if GPS has no alt | Inaccurate depth estimate | L2: barometer API |
| Compass not absolute on all Android browsers | Azimuth drift | L2: magnetometer calibration |
| iOS DeviceOrientation needs user gesture | Compass may not work if skipped | UX: explicit calibration step |
| Footprint is trapezoid, not true perspective | Minor geometric error | L2: full perspective transform |
| No cloud cover awareness | Capture on cloudy day ≠ satellite day | L2: cloud mask from Sentinel QA60 band |

---

*CropView · Open Source · MIT License*
