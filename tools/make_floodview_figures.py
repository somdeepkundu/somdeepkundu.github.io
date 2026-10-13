# Usage (not part of the built site):
#   pip install playwright pillow && python -m playwright install chromium
#   python tools/make_floodview_figures.py OUT_DIR FLOODVIEW_REPO
#     OUT_DIR         where the PNGs are written (then copy them to docs/assets/images/)
#     FLOODVIEW_REPO  a clone of github.com/somdeepkundu/floodview (for the icon and the Comfortaa font)
"""Figures for the FloodView project page, in the same line-sketch style as the
CropView page (teal ink on paper, Comfortaa labels):

  floodview-card.png        1024x500  project card + link-preview image
  floodview-aim.png         side view: camera height, tilt, crosshair point on the waterline
  floodview-edge-trace.png  top view: crosshair points along the waterline joined into an edge
  floodview-depth.png       the body-scale depth guide
"""
import base64, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image

OUT, FV = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
font = base64.b64encode(open(os.path.join(FV, 'vendor/fonts/comfortaa-latin-wght-normal.woff2'), 'rb').read()).decode()
icon = open(os.path.join(FV, 'icons/icon.svg')).read()

INK, FILL, WATER, EDGE, TXT, MUTE = '#24566b', 'rgba(56,189,248,.16)', 'rgba(59,130,246,.20)', '#e2549a', '#24343f', '#5f707c'
HEAD = f"""<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Comfortaa;src:url(data:font/woff2;base64,{font}) format('woff2');font-weight:300 700}}
html,body{{margin:0;background:#fff}} svg{{display:block}} text{{font-family:Comfortaa,sans-serif;fill:{TXT}}}
.lbl{{font-size:17px}} .sm{{font-size:14px;fill:{MUTE}}} text{{paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round}} .b{{font-weight:700}} .ink{{stroke:{INK};fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}}
</style>"""

def grass(x0, x1, y, step=26):
    return ''.join(f'<path class="ink" style="stroke-width:1.6" d="M{x} {y} l-5 -10 M{x} {y} l0 -13 M{x} {y} l5 -10"/>' for x in range(x0, x1, step))

def waves(x0, x1, y, amp=4, period=34, cls='ink', extra=''):
    d = f'M{x0} {y}'
    x = x0
    while x < x1:
        d += f' q{period/4} {-amp} {period/2} 0 t{period/2} 0'; x += period
    return f'<path class="{cls}" d="{d}" {extra}/>'

def person(x, y, s=1.0, phone=True):
    """Stick figure, feet at (x, y), about 172*s px tall. With phone=True the
    phone is held at chest height, at (x + 38*s, y - 134*s)."""
    g = f'<circle class="ink" cx="{x}" cy="{y-159*s}" r="{13*s}"/>'
    g += f'<path class="ink" d="M{x} {y-146*s} L{x} {y-92*s} L{x-7*s} {y-46*s} L{x-12*s} {y} M{x} {y-92*s} L{x+7*s} {y-46*s} L{x+12*s} {y}"/>'
    if phone:
        g += f'<path class="ink" d="M{x} {y-136*s} L{x+20*s} {y-110*s} L{x+36*s} {y-132*s}"/>'
        g += f'<rect x="{x+33*s}" y="{y-144*s}" width="{8*s}" height="{18*s}" rx="2" transform="rotate(30 {x+37*s} {y-135*s})" style="fill:#38bdf8;stroke:{INK};stroke-width:1.6"/>'
    else:
        g += f'<path class="ink" d="M{x} {y-136*s} L{x-20*s} {y-86*s} M{x} {y-136*s} L{x+20*s} {y-86*s}"/>'
    return g

def aim_figure():
    import math
    W, H = 1000, 560
    gy = 420                        # ground / water surface level
    hp = 170                        # camera height h in px
    px, py = 290, gy - hp           # phone
    th = 60                         # tilt from nadir, degrees
    edge_x = px + hp*math.tan(math.radians(th))
    half = 14                       # schematic vertical half-angle
    near_x = px + hp*math.tan(math.radians(th-half)); far_x = px + hp*math.tan(math.radians(th+half))
    sc = hp/134
    g = []
    g.append(f'<rect x="{edge_x:.0f}" y="{gy}" width="{W-edge_x:.0f}" height="100" style="fill:{WATER}"/>')
    g.append(f'<path class="ink" d="M30 {gy} L{edge_x:.0f} {gy}"/>')
    g.append(grass(40, int(edge_x) - 10, gy))
    g.append(waves(int(edge_x), W - 20, gy, extra='style="stroke:#2563eb"'))
    g.append(waves(int(edge_x) + 30, W - 40, gy + 34, amp=3, extra='style="stroke:#2563eb;opacity:.45;stroke-width:1.6"'))
    g.append(waves(int(edge_x) + 10, W - 60, gy + 66, amp=3, extra='style="stroke:#2563eb;opacity:.3;stroke-width:1.6"'))
    g.append(f'<text class="sm" x="{W-150}" y="{gy+92}">flood water</text><text class="sm" x="60" y="{gy+92}">dry ground</text>')
    g.append(f'<path d="M{px} {py} L{near_x:.0f} {gy} L{far_x:.0f} {gy} Z" style="fill:{FILL}"/>')
    g.append(f'<path class="ink" d="M{px} {py} L{near_x:.0f} {gy} M{px} {py} L{far_x:.0f} {gy}" style="stroke-width:2"/>')
    g.append(f'<path class="ink" d="M{px} {py} L{edge_x:.0f} {gy}" style="stroke-dasharray:9 7"/>')
    g.append(f'<path class="ink" d="M{px} {py} L{px} {gy}" style="stroke-dasharray:4 6;stroke-width:1.6"/>')
    hx = px - 38*sc - 62
    g.append(f'<path class="ink" d="M{hx:.0f} {py} L{hx:.0f} {gy} M{hx-8:.0f} {py} L{hx+8:.0f} {py} M{hx-8:.0f} {gy} L{hx+8:.0f} {gy}" style="stroke-width:1.8"/><text class="lbl b" x="{hx-28:.0f}" y="{(py+gy)/2+6:.0f}">h</text>')
    r = 62; a = math.radians(th)
    g.append(f'<path class="ink" d="M{px} {py+r} A{r} {r} 0 0 0 {px + r*math.sin(a):.1f} {py + r*math.cos(a):.1f}" style="stroke:#d97706;stroke-width:2.4"/><text class="lbl b" x="{px+12}" y="{py+r+28}" style="fill:#d97706">θ</text>')
    g.append(person(px - 38*sc, gy, sc))
    g.append(f'<path class="ink" d="M{px} {gy+40} L{edge_x:.0f} {gy+40} M{px} {gy+32} L{px} {gy+48} M{edge_x:.0f} {gy+32} L{edge_x:.0f} {gy+48}" style="stroke-width:1.8"/>')
    g.append(f'<text class="lbl b" x="{(px+edge_x)/2-60:.0f}" y="{gy+70}">d = h · tan θ</text>')
    g.append(f'<path class="ink" d="M{near_x:.0f} {gy-30} L{far_x:.0f} {gy-30}" style="stroke:{MUTE};stroke-width:1.4;stroke-dasharray:2 4"/><text class="sm" x="{far_x-128:.0f}" y="{gy-40}">ground footprint</text>')
    g.append(f'<circle cx="{edge_x:.0f}" cy="{gy}" r="15" style="fill:none;stroke:{EDGE};stroke-width:3.5"/><circle cx="{edge_x:.0f}" cy="{gy}" r="4.5" style="fill:{EDGE}"/>')
    g.append(f'<path d="M{edge_x+16:.0f} {gy-18} C{edge_x+40:.0f} {gy-120} {edge_x+90:.0f} {gy-180} {edge_x+130:.0f} {gy-196}" style="fill:none;stroke:{EDGE};stroke-width:1.6"/>')
    g.append(f'<text class="lbl b" x="{edge_x+138:.0f}" y="{gy-198}" style="fill:{EDGE}">crosshair point</text><text class="sm" x="{edge_x+138:.0f}" y="{gy-176}">on the waterline = water edge</text>')
    g.append(f'<text class="lbl" x="{W-320}" y="54">θ : tilt from straight down</text><text class="lbl" x="{W-320}" y="82">h : camera height above</text><text class="lbl" x="{W-320}" y="106">      the ground or water</text>')
    return W, H, ''.join(g)

def edge_figure():
    W, H = 1000, 560
    g = []
    # flood water polygon (top view), irregular boundary
    shore = [(40, 250), (150, 228), (250, 262), (350, 240), (450, 205), (560, 232), (660, 214), (760, 250), (860, 236), (960, 248)]
    d = 'M20 30 L980 30 L980 ' + str(shore[-1][1]) + ' ' + ' '.join(f'L{x} {y}' for x, y in reversed(shore)) + ' L20 250 Z'
    g.append(f'<path d="{d}" style="fill:{WATER}"/>')
    g.append('<path class="ink" d="M20 250 ' + ' '.join(f'L{x} {y}' for x, y in shore) + ' L980 248" style="stroke:#2563eb;stroke-width:2;opacity:.6"/>')
    for yy in (80, 125, 170):
        g.append(waves(80 + (yy % 3) * 20, 900, yy, amp=3, extra='style="stroke:#2563eb;opacity:.35;stroke-width:1.5"'))
    g.append('<text class="sm" x="60" y="70">flood water</text>')
    # road
    g.append('<rect x="20" y="420" width="960" height="46" rx="4" style="fill:#eef1f4"/><path class="ink" d="M20 443 L980 443" style="stroke:#9aa7b1;stroke-width:1.6;stroke-dasharray:14 12"/>')
    for x in range(40, 980, 34):
        g.append(f'<path class="ink" style="stroke-width:1.2;opacity:.55" d="M{x} 360 l-4 -8 M{x} 360 l0 -10 M{x} 360 l4 -8"/>')
    # observers -> crosshair points on the shore
    obs = [(110, 432), (300, 432), (520, 432), (640, 432), (900, 432)]
    hits = [(150, 228), (350, 240), (505, 219), (690, 222), (860, 236)]
    import math
    for (ox, oy), (hx, hy) in zip(obs, hits):
        ang = math.atan2(hy - oy, hx - ox); L = 95; spread = math.radians(16)
        g.append(f'<path d="M{ox} {oy} L{ox+L*math.cos(ang-spread):.0f} {oy+L*math.sin(ang-spread):.0f} L{ox+L*math.cos(ang+spread):.0f} {oy+L*math.sin(ang+spread):.0f} Z" style="fill:{FILL}"/>')
        g.append(f'<path class="ink" d="M{ox} {oy} L{hx} {hy}" style="stroke-dasharray:7 6;stroke-width:1.8"/>')
        g.append(f'<circle cx="{ox}" cy="{oy}" r="9" style="fill:#fff;stroke:{INK};stroke-width:2.4"/>')
    g.append('<path d="M' + ' L'.join(f'{x} {y}' for x, y in hits) + f'" style="fill:none;stroke:{EDGE};stroke-width:4;stroke-dasharray:12 7;stroke-linecap:round"/>')
    for x, y in hits:
        g.append(f'<circle cx="{x}" cy="{y}" r="8" style="fill:{EDGE};stroke:#fff;stroke-width:2.5"/>')
    g.append(f'<text class="lbl b" x="560" y="188" style="fill:{EDGE}">traced water edge</text>')
    g.append(f'<text class="sm" x="140" y="500">you, on the road, Edge ON · dashed: where each photo was aimed</text>')
    g.append('<path class="ink" d="M940 400 L940 340 M940 340 l-9 16 M940 340 l9 16" style="stroke-width:2"/><text class="lbl b" x="932" y="330">N</text>')
    return W, H, ''.join(g)

def depth_figure():
    W, H = 1000, 560
    g = []
    gy = 500; s = 2.25          # person scale: 170*s ≈ 382 px tall
    x0 = 300
    lv = [('ankle', 10, '≈ 10 cm'), ('knee', 45, '≈ 45 cm'), ('waist', 90, '≈ 90 cm'), ('chest', 130, '≈ 130 cm'), ('above head', 175, '> 150 cm')]
    k = 382 / 170               # px per cm (person ~170 cm)
    water_cm = 40
    g.append(f'<rect x="60" y="{gy - water_cm*k:.0f}" width="880" height="{water_cm*k:.0f}" style="fill:{WATER}"/>')
    g.append(waves(60, 930, round(gy - water_cm*k), extra='style="stroke:#2563eb"'))
    g.append(f'<path class="ink" d="M60 {gy} L940 {gy}"/>')
    g.append(person(x0, gy, s, phone=False))
    for name, cm, txt in lv:
        y = gy - cm*k
        g.append(f'<path class="ink" d="M{x0+60} {y:.0f} L{x0+330} {y:.0f}" style="stroke-dasharray:5 6;stroke-width:1.6;stroke:{MUTE}"/>')
        g.append(f'<text class="lbl b" x="{x0+345}" y="{y+6:.0f}">{name}</text><text class="sm" x="{x0+470}" y="{y+6:.0f}">{txt}</text>')
    g.append(f'<text class="lbl" x="{x0+345}" y="{gy - 45*k + 40:.0f}" style="fill:#1d4ed8">↑ water at the knee: tag “Knee”</text>')
    g.append(f'<text class="sm" x="70" y="58">Water depth, body scale. Measured it with a staff or pole?</text><text class="sm" x="70" y="80">Type the cm instead; the export says which it was.</text>')
    return W, H, ''.join(g)

def card():
    W, H = 1024, 500
    return W, H, f"""<div style="width:{W}px;height:{H}px;position:relative;overflow:hidden;background:radial-gradient(120% 140% at 0% 0%,#14244a 0%,#0b1430 50%,#070d1c 100%);font-family:Comfortaa,sans-serif">
  <svg width="{W}" height="140" viewBox="0 0 {W} 140" style="position:absolute;left:0;bottom:0;opacity:.55">
    <path d="M0 60 Q64 36 128 60 T256 60 T384 60 T512 60 T640 60 T768 60 T896 60 T1024 60 V140 H0Z" fill="rgba(56,189,248,.10)"/>
    <path d="M0 92 Q64 70 128 92 T256 92 T384 92 T512 92 T640 92 T768 92 T896 92 T1024 92" fill="none" stroke="rgba(125,211,252,.35)" stroke-width="3"/>
    <path d="M0 60 Q64 36 128 60 T256 60 T384 60 T512 60 T640 60 T768 60 T896 60 T1024 60" fill="none" stroke="rgba(186,230,253,.45)" stroke-width="3"/>
  </svg>
  <div style="position:absolute;left:78px;top:118px;width:220px;height:220px;border-radius:50px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.12),0 24px 60px -20px rgba(56,189,248,.55)">{icon.replace('<svg ', '<svg width="220" height="220" ')}</div>
  <div style="position:absolute;left:350px;top:132px">
    <div style="font-size:84px;font-weight:700;color:#38bdf8;letter-spacing:.5px;line-height:1">Flood<span style="color:#e0f2fe">View</span></div>
    <div style="margin-top:22px;font-size:25px;color:#cfe3f3">Geo-tagged flood ground truthing</div>
    <div style="margin-top:8px;font-size:20px;color:#8fb3cc">class · depth · flow · water edge · works offline</div>
    <div style="margin-top:44px;font-size:14px;color:#6f8aa3;letter-spacing:.06em">RuDRA Lab · C-TARA · IIT Bombay</div>
  </div>
</div>"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(device_scale_factor=1.6)
    for name, fn in [('floodview-aim', aim_figure), ('floodview-edge-trace', edge_figure), ('floodview-depth', depth_figure)]:
        W, H, body = fn()
        pg.set_viewport_size({'width': W, 'height': H})
        pg.set_content(HEAD + f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}">{body}</svg>')
        pg.wait_for_timeout(300)
        path = os.path.join(OUT, name + '.png'); pg.screenshot(path=path)
        Image.open(path).convert('RGB').quantize(colors=96, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)
    pg2 = b.new_page(device_scale_factor=1)
    W, H, body = card()
    pg2.set_viewport_size({'width': W, 'height': H}); pg2.set_content(HEAD + body); pg2.wait_for_timeout(300)
    pg2.screenshot(path=os.path.join(OUT, 'floodview-card.png'))
    b.close()
Image.open(os.path.join(FV, 'icons/icon-192.png')).save(os.path.join(OUT, 'floodview-icon.png'), optimize=True)
for f in sorted(os.listdir(OUT)):
    print(f, Image.open(os.path.join(OUT, f)).size, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB')
