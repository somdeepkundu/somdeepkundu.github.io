# Usage (not part of the built site):
#   pip install playwright matplotlib numpy && python -m playwright install chromium
#   mkdir -p WORK/cardfonts && (cd WORK/cardfonts && npm i @fontsource/dm-serif-display@5 @fontsource/dm-sans@5 @fontsource/roboto-mono@5)
#   python tools/make_social_card.py WORK card.png docs/assets/images/logo.svg
#   then save card.png as docs/assets/images/social-card.jpg (JPEG, quality 90; keep it under ~300 KB for WhatsApp)
"""Social preview card (1200x630) for somdeepkundu.github.io.

Right side: an isometric stack of three map layers drawn from the kind of
work on the site, bottom to top: terrain contours + a river, a satellite
crop-pixel mosaic with a CropView ground footprint, and night-time lights.
Left side: RGB logo, name, tagline, affiliation, topic chips.
"""
import math, random, sys, os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from playwright.sync_api import sync_playwright

S = sys.argv[1]
OUT = sys.argv[2]
LOGO = open(sys.argv[3]).read()
FONTS = os.path.join(S, "cardfonts", "node_modules", "@fontsource")
random.seed(11); np.random.seed(11)
L = 220  # layer side, in layer coordinates

# ---------- layer 1: terrain contours + river ----------
xs = np.linspace(0, L, 120); X, Y = np.meshgrid(xs, xs)
def hill(cx, cy, s, h): return h * np.exp(-((X - cx) ** 2 + (Y - cy) ** 2) / (2 * s * s))
Z = hill(60, 70, 38, 1.0) + hill(165, 150, 45, 0.85) + hill(150, 45, 25, 0.5) + 0.06 * np.sin(X / 13) * np.cos(Y / 17)
cs = plt.contour(X, Y, Z, levels=np.linspace(0.08, 0.95, 11))
contours = []
for i, segs in enumerate(cs.allsegs):
    for seg in segs:
        if len(seg) < 4: continue
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in seg[::2])
        contours.append(f'<path d="{d}" fill="none" stroke="#5cc3d6" stroke-opacity="{0.25 + 0.05 * i:.2f}" stroke-width="1.1"/>')
plt.close("all")
river = '<path d="M-5,200 C40,175 70,185 100,150 S150,120 160,95 S205,40 228,30" fill="none" stroke="#22d3ee" stroke-width="3.2" stroke-linecap="round"/>'
river2 = '<path d="M100,150 C110,175 125,190 150,226" fill="none" stroke="#22d3ee" stroke-width="1.8" stroke-opacity=".8" stroke-linecap="round"/>'
terrain = "".join(contours) + river + river2

# ---------- layer 2: crop pixel mosaic + CropView footprint ----------
ramp = ["#6e5233", "#9a7a3e", "#c8b257", "#9cbf4f", "#5e9e3e", "#2f7a35"]
n = 11; c = L / n; cells = []
for i in range(n):
    for j in range(n):
        v = 0.5 + 0.32 * math.sin(i / 2.1 + 0.6) * math.cos(j / 2.7 - 0.4) + 0.18 * (random.random() - 0.5)
        if (i // 3 + j // 4) % 3 == 0: v -= 0.25   # fallow parcels
        k = max(0, min(len(ramp) - 1, int(v * len(ramp))))
        cells.append(f'<rect x="{j*c:.1f}" y="{i*c:.1f}" width="{c+.3:.1f}" height="{c+.3:.1f}" fill="{ramp[k]}"/>')
parcels = []
for t in (3, 7):  # field boundaries
    parcels.append(f'<line x1="{t*c:.1f}" y1="0" x2="{t*c:.1f}" y2="{L}" stroke="#1a1410" stroke-opacity=".45" stroke-width="1.4"/>')
for t in (4, 8):
    parcels.append(f'<line x1="0" y1="{t*c:.1f}" x2="{L}" y2="{t*c:.1f}" stroke="#1a1410" stroke-opacity=".45" stroke-width="1.4"/>')
cam = (150, 182)
foot = '<polygon points="128,120 172,120 192,72 108,72" fill="#22d3ee" fill-opacity=".22" stroke="#e8fbff" stroke-width="1.8" stroke-dasharray="5 4"/>'
cone = f'<path d="M{cam[0]},{cam[1]} L108,72 M{cam[0]},{cam[1]} L192,72" stroke="#e8fbff" stroke-opacity=".75" stroke-width="1.2"/>'
camdot = f'<circle cx="{cam[0]}" cy="{cam[1]}" r="5" fill="#22d3ee" stroke="#fff" stroke-width="1.6"/>'
crops = "".join(cells) + "".join(parcels) + foot + cone + camdot

# ---------- layer 3: night-time lights ----------
lights = []
for (cx, cy, nn, sp) in [(70, 80, 160, 16), (160, 140, 110, 14), (150, 55, 50, 9), (55, 175, 40, 8), (195, 200, 25, 6)]:
    for _ in range(nn):
        x = random.gauss(cx, sp); y = random.gauss(cy, sp)
        if not (2 < x < L - 2 and 2 < y < L - 2): continue
        d = math.hypot(x - cx, y - cy) / sp
        r = max(0.5, 2.2 - d * 0.7) * random.uniform(0.6, 1.1)
        col = "#fff3c4" if d < 0.6 else ("#ffd36b" if d < 1.4 else "#ff9a5c")
        lights.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}" fill="{col}"/>')
roads = ('<path d="M70,80 L150,55 L160,140 L55,175 M160,140 L195,200 M70,80 L55,175" fill="none" '
         'stroke="#ffd36b" stroke-opacity=".28" stroke-width="1"/>')
night = roads + "".join(lights)

# ---------- isometric stack ----------
K = 1.0
def iso(ox, oy): return f"matrix({K},{K/2},{-K},{K/2},{ox},{oy})"
OX, OY0, GAP = 826, 96, 122
def slab(oy, fill, content, clip_id, top_opacity=1.0):
    return f'''
  <g transform="{iso(OX, oy + 9)}"><rect width="{L}" height="{L}" fill="#05030a" fill-opacity=".55"/></g>
  <g transform="{iso(OX, oy)}" opacity="{top_opacity}">
    <clipPath id="{clip_id}"><rect width="{L}" height="{L}"/></clipPath>
    <rect width="{L}" height="{L}" fill="{fill}"/>
    <g clip-path="url(#{clip_id})">{content}</g>
    <rect width="{L}" height="{L}" fill="none" stroke="#f5e4ec" stroke-opacity=".35" stroke-width="1.2"/>
  </g>'''
y1, y2, y3 = OY0 + 2 * GAP, OY0 + GAP, OY0
def corner(oy, x, y): return (OX + K * x - K * y, oy + K * x / 2 + K * y / 2)
guides = []
for (x, y) in [(0, L), (L, 0), (L, L)]:
    a = corner(y3, x, y); b = corner(y1, x, y)
    guides.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#c49aaa" stroke-opacity=".35" stroke-dasharray="3 5"/>')
def label(oy, text, sub):
    x, y = corner(oy, L, 0)
    return (f'<line x1="{x+6:.0f}" y1="{y:.0f}" x2="{x+26:.0f}" y2="{y:.0f}" stroke="#c49aaa" stroke-opacity=".6"/>'
            f'<text x="{x+32:.0f}" y="{y-2:.0f}" class="lbl">{text}</text><text x="{x+32:.0f}" y="{y+13:.0f}" class="lbl2">{sub}</text>')
orbit = ('<path d="M584,124 C684,14 984,-4 1094,100" fill="none" stroke="#e8608a" stroke-opacity=".45" stroke-width="1.4" stroke-dasharray="2 6"/>'
         '<g transform="translate(942,32) rotate(14)"><rect x="-7" y="-5" width="14" height="10" rx="2" fill="#f5e4ec"/>'
         '<rect x="-25" y="-3" width="15" height="6" fill="#22d3ee"/><rect x="10" y="-3" width="15" height="6" fill="#22d3ee"/></g>')

stack = f'''
<svg class="stack" width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  {orbit}
  {"".join(guides)}
  {slab(y1, "#10222b", terrain, "c1")}
  {slab(y2, "#3b2a1a", crops, "c2")}
  <g filter="url(#glow)">{slab(y3, "#0a0f24", night, "c3", .96)}</g>
  {label(y3, "NIGHT LIGHTS", "settlements")}
  {label(y2, "CROPS + FIELD", "pixels · footprint")}
  {label(y1, "TERRAIN + WATER", "contours · rivers")}
</svg>'''

logo_svg = LOGO.replace("<svg ", '<svg width="54" height="54" ', 1)
ff = lambda fam, f, w: f"@font-face{{font-family:'{fam}';font-weight:{w};src:url(file://{FONTS}/{f}) format('woff2')}}"
html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
{ff("DM Serif Display","dm-serif-display/files/dm-serif-display-latin-400-normal.woff2",400)}
{ff("DM Sans","dm-sans/files/dm-sans-latin-400-normal.woff2",400)}
{ff("DM Sans","dm-sans/files/dm-sans-latin-500-normal.woff2",500)}
{ff("DM Sans","dm-sans/files/dm-sans-latin-600-normal.woff2",600)}
{ff("Roboto Mono","roboto-mono/files/roboto-mono-latin-500-normal.woff2",500)}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;overflow:hidden;font-family:'DM Sans',sans-serif;color:#f5e4ec;
  background:radial-gradient(120% 120% at 85% 20%,#2a1430 0%,#170b19 45%,#0e0710 100%)}}
.stack{{position:absolute;inset:0}}
.lbl{{font:500 10.5px 'Roboto Mono',monospace;letter-spacing:.09em;fill:#f0dce8}}
.lbl2{{font:400 11px 'DM Sans',sans-serif;fill:#c49aaa}}
.left{{position:absolute;left:72px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center}}
.brand{{display:flex;align-items:center;gap:14px;margin-bottom:34px}}
.brand span{{font:500 15px 'Roboto Mono',monospace;letter-spacing:.06em;color:#d4889a}}
h1{{font:400 82px/0.98 'DM Serif Display',serif;letter-spacing:-.01em;color:#fbeef3}}
.tag{{margin-top:18px;font:400 italic 24px 'DM Serif Display',serif;color:#e8608a}}
.aff{{margin-top:26px;font:500 19px 'DM Sans',sans-serif;color:#e9d3dd}}
.chips{{margin-top:30px;display:flex;flex-wrap:wrap;gap:9px;max-width:520px}}
.chips span{{font:500 14px 'DM Sans',sans-serif;color:#f5e4ec;border:1px solid rgba(232,96,138,.45);
  background:rgba(232,96,138,.08);border-radius:999px;padding:6px 14px}}
.rgb{{position:absolute;left:72px;bottom:0;width:120px;height:5px;display:flex}}
.rgb i{{flex:1}}
</style></head><body>
{stack}
<div class="left">
  <div class="brand">{logo_svg}<span>somdeepkundu.github.io</span></div>
  <h1>Somdeep<br>Kundu</h1>
  <div class="tag">Generalised Abstract Spatio-temporal madness</div>
  <div class="aff">PhD Scholar · RuDRA Lab, C-TARA, IIT Bombay</div>
  <div class="chips"><span>Remote Sensing</span><span>Crop Water</span><span>Night Lights</span><span>Field Apps</span><span>Spatial Statistics</span></div>
</div>
<div class="rgb"><i style="background:#ff1e1e"></i><i style="background:#1edc3c"></i><i style="background:#1e3cff"></i></div>
</body></html>'''
hp = os.path.join(S, "card.html"); open(hp, "w").write(html)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.goto("file://" + hp); pg.wait_for_timeout(800)
    print("fonts ok:", pg.evaluate("document.fonts.check(\"82px 'DM Serif Display'\") && document.fonts.check(\"500 15px 'Roboto Mono'\")"))
    pg.screenshot(path=OUT)
    b.close()
print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")
