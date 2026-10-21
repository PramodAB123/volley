import math, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
NAVY='#0b1220'; NAVY2='#16264a'; BLUE='#2f6fe0'; BLUE2='#4d8bff'; YEL='#ffd23f'; ORA='#f08a3c'; ORA2='#ff6b3d'; GRN='#23744a'; WHITE='#ffffff'

FONT = TTFont('/usr/share/fonts/opentype/inter/InterDisplay-BlackItalic.otf')
gs = FONT.getGlyphSet(); cmap = FONT.getBestCmap(); UPM = FONT['head'].unitsPerEm
def text_path(s, x, y, size, track=0.0):
    """Outline text; returns (d, width). y is baseline."""
    sc = size / UPM; pen = SVGPathPen(gs); cx = 0
    for ch in s:
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (sc, 0, 0, -sc, x + cx, y))
        gs[g].draw(tp); cx += gs[g].width * sc + track * size
    return pen.getCommands(), cx - track * size

def f(v): return ('%.2f' % v).rstrip('0').rstrip('.')

def ball(cx, cy, r, seam=None, simple=False, rot=-18):
    """Stylised volleyball: three swirling panels (yellow, blue, white)."""
    seam = seam if seam is not None else max(1.5, r * 0.075)
    def rotp(p, a):
        a = math.radians(a); x, y = p
        return (x*math.cos(a) - y*math.sin(a), x*math.sin(a) + y*math.cos(a))
    # one seam from centre to rim, unit circle
    base = [(0, 0), (0.42, -0.08), (0.78, -0.42), (0.80, -0.60)]
    L = math.hypot(*base[3]); base[3] = (base[3][0]/L, base[3][1]/L)
    seams = [[rotp(p, rot + k*120) for p in base] for k in range(3)]
    P = lambda p: f'{f(cx+p[0]*r)} {f(cy+p[1]*r)}'
    out = [f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{WHITE}"/>']
    fills = [YEL, BLUE, None]
    for k in range(3):
        if not fills[k]: continue
        a, b = seams[k], seams[(k+1) % 3]
        d = (f'M{P(a[0])}C{P(a[1])} {P(a[2])} {P(a[3])}'
             f'A{f(r)} {f(r)} 0 0 1 {P(b[3])}'
             f'C{P(b[2])} {P(b[1])} {P(b[0])}Z')
        out.append(f'<path d="{d}" fill="{fills[k]}"/>')
    if not simple:
        # a second, parallel seam in each panel gives the classic banded look
        for k in range(3):
            s2 = [rotp(p, rot + k*120 + 38) for p in [(0.30, 0.06), (0.58, -0.02), (0.88, -0.22), (0.93, -0.36)]]
            out.append(f'<path d="M{P(s2[0])}C{P(s2[1])} {P(s2[2])} {P(s2[3])}" fill="none" stroke="{NAVY}" stroke-width="{f(seam*0.75)}" stroke-linecap="round" opacity=".55"/>')
    for s in seams:
        out.append(f'<path d="M{P(s[0])}C{P(s[1])} {P(s[2])} {P(s[3])}" fill="none" stroke="{NAVY}" stroke-width="{f(seam)}" stroke-linecap="round"/>')
    out.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r - seam/2)}" fill="none" stroke="{NAVY}" stroke-width="{f(seam)}"/>')
    return '\n'.join(out)

def streaks(x, y, r, n=3, length=1.6, color=YEL, w=None):
    """Speed lines trailing up-left of a ball moving down-right."""
    w = w or r*0.22; out = []
    ang = math.radians(-145)  # direction the trail points
    nx, ny = -math.sin(ang), math.cos(ang)
    for i, (off, ln, op) in enumerate([(-0.55, 1.0, .9), (0.0, 1.35, 1), (0.55, 0.85, .75)][:n]):
        sx = x + math.cos(ang)*r*1.05 + nx*off*r; sy = y + math.sin(ang)*r*1.05 + ny*off*r
        ex = sx + math.cos(ang)*r*length*ln; ey = sy + math.sin(ang)*r*length*ln
        out.append(f'<line x1="{f(sx)}" y1="{f(sy)}" x2="{f(ex)}" y2="{f(ey)}" stroke="{color}" stroke-width="{f(w)}" stroke-linecap="round" opacity="{op}"/>')
    return '\n'.join(out)

def svg(w, h, body, defs=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n<defs>{defs}</defs>\n{body}\n</svg>\n'

BG_DEFS = (f'<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{NAVY2}"/><stop offset="1" stop-color="{NAVY}"/></linearGradient>'
           f'<linearGradient id="court" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{ORA2}"/><stop offset="1" stop-color="{ORA}"/></linearGradient>')

# ---------- Icon A: "Spike" (recommended): ball smashing down past the net onto the court ----------
def icon_a(S=512, full_bleed=False, simple=False):
    rx = 0 if full_bleed else S*0.22
    b = [f'<rect width="{S}" height="{S}" rx="{f(rx)}" fill="url(#bg)"/>']
    clip = f'<clipPath id="c"><rect width="{S}" height="{S}" rx="{f(rx)}"/></clipPath>'
    g = []
    # court floor in perspective
    g.append(f'<path d="M{f(S*-0.1)} {S} L{f(S*0.24)} {f(S*0.70)} L{f(S*0.76)} {f(S*0.70)} L{f(S*1.1)} {S}Z" fill="url(#court)"/>')
    g.append(f'<path d="M{f(S*0.24)} {f(S*0.70)} L{f(S*0.76)} {f(S*0.70)}" stroke="{WHITE}" stroke-width="{f(S*0.02)}" opacity=".9"/>')
    if not simple:
        # net
        g.append(f'<rect x="{f(S*0.18)}" y="{f(S*0.56)}" width="{f(S*0.64)}" height="{f(S*0.075)}" rx="{f(S*0.012)}" fill="{WHITE}" opacity=".18"/>')
        g.append(f'<rect x="{f(S*0.18)}" y="{f(S*0.56)}" width="{f(S*0.64)}" height="{f(S*0.018)}" rx="{f(S*0.009)}" fill="{WHITE}"/>')
        for i in range(1, 12):
            x = S*0.18 + i*S*0.64/12
            g.append(f'<line x1="{f(x)}" y1="{f(S*0.575)}" x2="{f(x)}" y2="{f(S*0.635)}" stroke="{WHITE}" stroke-width="{f(S*0.005)}" opacity=".35"/>')
    r = S*(0.215 if not simple else 0.30)
    bx, by = S*(0.60 if not simple else 0.56), S*(0.36 if not simple else 0.42)
    g.append(streaks(bx, by, r, color=YEL, length=0.95 if not simple else 0.9, n=3 if not simple else 2))
    g.append(ball(bx, by, r, simple=simple))
    b.append(f'<g clip-path="url(#c)">' + '\n'.join(g) + '</g>')
    return svg(S, S, '\n'.join(b), BG_DEFS + clip)

# ---------- Icon B: "Court view": the in-game broadcast angle ----------
def icon_b(S=512):
    rx = S*0.22; g = []
    clip = f'<clipPath id="c"><rect width="{S}" height="{S}" rx="{f(rx)}"/></clipPath>'
    g.append(f'<rect width="{S}" height="{S}" fill="{GRN}"/>')
    g.append(f'<path d="M{f(S*0.08)} {f(S*0.92)} L{f(S*0.27)} {f(S*0.18)} L{f(S*0.73)} {f(S*0.18)} L{f(S*0.92)} {f(S*0.92)}Z" fill="url(#court)" stroke="{WHITE}" stroke-width="{f(S*0.022)}" stroke-linejoin="round"/>')
    g.append(f'<path d="M{f(S*0.165)} {f(S*0.60)} H{f(S*0.835)}" stroke="{WHITE}" stroke-width="{f(S*0.016)}"/>')
    # net across the middle
    g.append(f'<rect x="{f(S*0.12)}" y="{f(S*0.34)}" width="{f(S*0.76)}" height="{f(S*0.08)}" fill="{NAVY}" opacity=".55"/>')
    g.append(f'<rect x="{f(S*0.12)}" y="{f(S*0.33)}" width="{f(S*0.76)}" height="{f(S*0.022)}" fill="{WHITE}"/>')
    for x in (0.12, 0.88):
        g.append(f'<rect x="{f(S*x - S*0.015)}" y="{f(S*0.30)}" width="{f(S*0.03)}" height="{f(S*0.22)}" rx="{f(S*0.01)}" fill="{WHITE}"/>')
    g.append(ball(S*0.5, S*0.66, S*0.17))
    return svg(S, S, f'<g clip-path="url(#c)">' + '\n'.join(g) + '</g>', BG_DEFS + clip)

# ---------- Icon C: "Monogram": italic S with the ball as the full stop ----------
def icon_c(S=512):
    rx = S*0.22
    d, w = text_path('S', 0, 0, S*0.78)
    body = [f'<rect width="{S}" height="{S}" rx="{f(rx)}" fill="{BLUE}"/>',
            f'<path d="M0 {f(S*0.83)}L{S} {f(S*0.64)}V{S}H0Z" fill="{NAVY}" opacity=".35" clip-path="url(#c)"/>',
            f'<path d="{d}" transform="translate({f(S*0.17)} {f(S*0.80)})" fill="{WHITE}"/>',
            ball(S*0.73, S*0.30, S*0.13),
            ]
    clip = f'<clipPath id="c"><rect width="{S}" height="{S}" rx="{f(rx)}"/></clipPath>'
    return svg(S, S, '\n'.join(body), BG_DEFS + clip)

# ---------- Wordmark ----------
def wordmark(theme='dark', lockup=True):
    size = 120; c1, c2 = (WHITE, YEL) if theme == 'dark' else (NAVY, BLUE)
    d1, w1 = text_path('SPIKE', 0, 0, size, track=-0.01)
    d2, w2 = text_path('RALLY', 0, 0, size, track=-0.01)
    gap = size*0.22; x0 = 0; parts = []
    if lockup:
        r = size*0.52; bx = r + 6; by = size*0.5 + 6
        parts.append(streaks(bx, by, r*0.9, n=2, length=0.8, color=ORA2 if theme=='light' else YEL, w=r*0.18).replace('stroke-linecap', 'opacity-x="1" stroke-linecap') if False else '')
        parts.append(ball(bx + size*0.05, by, r))
        x0 = bx + r + size*0.28
    top = 14; base = top + size*0.73 + 6
    parts.append(f'<path d="{d1}" transform="translate({f(x0)} {f(base)})" fill="{c1}"/>')
    parts.append(f'<path d="{d2}" transform="translate({f(x0 + w1 + gap)} {f(base)})" fill="{c2}"/>')
    # speed underline
    W = x0 + w1 + gap + w2 + 14
    uy = base + size*0.12
    parts.append(f'<path d="M{f(x0 + size*0.02)} {f(uy)}H{f(W - 10)}l-{f(size*0.06)} {f(size*0.09)}H{f(x0 - size*0.04)}Z" fill="{ORA2}"/>')
    H = uy + size*0.09 + 12
    return svg(int(math.ceil(W)), int(math.ceil(H)), '\n'.join(parts))

def stacked(theme='dark'):
    """Badge: ball over two-line wordmark, for splash / social."""
    size = 140; c1, c2 = (WHITE, YEL) if theme == 'dark' else (NAVY, BLUE)
    d1, w1 = text_path('SPIKE', 0, 0, size, -0.01); d2, w2 = text_path('RALLY', 0, 0, size, -0.01)
    W = max(w1, w2) + 60
    parts = [ball(W/2, 120, 95)]
    parts.append(f'<path d="{d1}" transform="translate({f((W-w1)/2)} {f(330)})" fill="{c1}"/>')
    parts.append(f'<path d="{d2}" transform="translate({f((W-w2)/2)} {f(470)})" fill="{c2}"/>')
    parts.append(f'<path d="M{f(W*0.16)} 500H{f(W*0.86)}l-12 16H{f(W*0.14)}Z" fill="{ORA2}"/>')
    return svg(int(W), 530, '\n'.join(parts))

# ---------- Social preview 1200x630 ----------
def social():
    W, H = 1200, 630; g = []
    g.append(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
    # stadium glow + court in perspective
    g.append(f'<ellipse cx="{W*0.5}" cy="{H*0.1}" rx="{W*0.6}" ry="{H*0.5}" fill="{BLUE}" opacity=".18"/>')
    g.append(f'<path d="M-80 {H} L{W*0.22} {H*0.70} L{W*0.78} {H*0.70} L{W+80} {H}Z" fill="url(#court)"/>')
    g.append(f'<path d="M{W*0.22} {H*0.70} L{W*0.78} {H*0.70}" stroke="#fff" stroke-width="6"/>')
    g.append(f'<path d="M{W*0.08} {H*0.86} H{W*0.92}" stroke="#fff" stroke-width="5" opacity=".85"/>')
    g.append(f'<path d="M{W*0.5} {H*0.70} V{H}" stroke="#fff" stroke-width="4" opacity=".5"/>')
    # wordmark + ball, centred as one group
    size = 128; d1, w1 = text_path('SPIKE', 0, 0, size, -0.01); d2, w2 = text_path('RALLY', 0, 0, size, -0.01)
    gap = 30; tw = w1 + gap + w2; r = 74; group = tw + 40 + 2*r
    x0 = (W - group)/2; base = 290
    g.append(f'<path d="{d1}" transform="translate({f(x0)} {base})" fill="#fff"/>')
    g.append(f'<path d="{d2}" transform="translate({f(x0 + w1 + gap)} {base})" fill="{YEL}"/>')
    g.append(f'<path d="M{f(x0)} {base+20}H{f(x0+tw-6)}l-9 13H{f(x0-9)}Z" fill="{ORA2}"/>')
    bx, by = x0 + tw + 40 + r, 196
    g.append(streaks(bx, by, r, color=YEL, length=0.9))
    g.append(ball(bx, by, r))
    tag, tww = text_path('6v6 VOLLEYBALL  ·  PLAY A FRIEND ONLINE', 0, 0, 30, 0.02)
    g.append(f'<path d="{tag}" transform="translate({f((W-tww)/2)} 372)" fill="#dfe5ee"/>')
    return svg(W, H, '\n'.join(g), BG_DEFS)

files = {
  'icon.svg': icon_a(), 'icon-maskable.svg': icon_a(full_bleed=True), 'icon-small.svg': icon_a(simple=True),
  'option-b-court.svg': icon_b(), 'option-c-monogram.svg': icon_c(),
  'logo-wordmark-dark.svg': wordmark('dark'), 'logo-wordmark-light.svg': wordmark('light'),
  'logo-stacked-dark.svg': stacked('dark'), 'logo-stacked-light.svg': stacked('light'),
  'social-preview.svg': social(),
}
for n, s in files.items():
    open(os.path.join(OUT, n), 'w').write(s)
print('ok', list(files))
