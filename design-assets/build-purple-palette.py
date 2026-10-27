from pathlib import Path
import base64
import json
from html import escape

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
HEXES = ['#F7F2FF', '#EFE6FE', '#DECCFD', '#C7A8FB', '#AA7FF8', '#8B56F6', '#7639E0', '#6128BC', '#502399', '#421F7C', '#29134F']
ROLES = ['Canvas', 'Subtle', 'Border', 'Soft accent', 'Accent', 'Primary', 'Hover / CTA', 'Pressed', 'Heading', 'Text', 'Ink']


def luminance(h):
    rgb = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    channels = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
    return sum(v * w for v, w in zip(channels, [.2126, .7152, .0722]))


def contrast(a, b):
    lo, hi = sorted([luminance(a), luminance(b)])
    return (hi + .05) / (lo + .05)


svg = ['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="982" viewBox="0 0 1600 982">', '<title>Mind Bridge — primary purple color foundations</title>']


def rect(x, y, w, h, fill, radius=0, stroke=None):
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}"' + (f' stroke="{stroke}"' if stroke else '') + '/>')


def text(x, y, value, size=16, fill='#1D1816', weight=400):
    svg.append(f'<text x="{x}" y="{y}" font-family="Google Sans Flex, Arial, sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}">{escape(value)}</text>')


rect(0, 0, 1600, 982, '#F7F5F4')
rect(0, 0, 1600, 264, '#000000')
logo = base64.b64encode((ROOT / 'public/mindbridge-logo-lockup.png').read_bytes()).decode()
svg.append(f'<image x="32" y="40" width="172" height="184" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{logo}"/>')
text(236, 80, 'MIND BRIDGE / DESIGN FOUNDATIONS', 12, '#C7A8FB', 600)
text(236, 139, 'Color, with care.', 44, '#FFFFFF', 600)
text(236, 181, 'Our primary purple and supporting colors, made for a', 17, '#DECCFD')
text(236, 207, 'consistent Mind Bridge experience.', 17, '#DECCFD')
rect(1292, 52, 268, 160, '#8B56F6', 20)
text(1316, 87, 'PRIMARY / PURPLE 500', 12, '#000000', 600)
text(1316, 139, '#8B56F6', 32, '#000000', 600)
text(1316, 176, 'Mind Bridge signature', 14, '#000000')

text(40, 311, '●  FOUNDATION / BRAND COLOR', 12, '#7639E0', 600)
text(40, 354, 'Purple scale · Primary', 30, '#1D1816', 600)
text(40, 385, 'Anchored at 500 · #8B56F6. Soft lavender tints support quiet surfaces;', 16, '#6F675F')
text(40, 409, 'deeper shades give actions and text stronger contrast.', 16, '#6F675F')

tokens = []
for i, (step, h, role) in enumerate(zip(STEPS, HEXES, ROLES)):
    x = 40 + i * (1520 / 11)
    w = 1520 / 11 - 8
    ink = max(['#000000', '#FFFFFF'], key=lambda c: contrast(c, h))
    ratio = contrast(ink, h)
    grade = 'AAA' if ratio >= 7 else 'AA' if ratio >= 4.5 else 'AA large'
    rect(x, 444, w, 236, '#FFFFFF', 10, '#E8E4E3')
    rect(x, 444, w, 154, h, 10)
    rect(x, 570, w, 28, h)
    text(x+12, 469, f'{grade} · {ratio:.2f}', 11, ink, 500)
    text(x+12, 579, str(step), 24, ink, 600)
    text(x+12, 624, h, 12, '#1D1816', 600)
    text(x+12, 649, role, 12, '#6F675F')
    tokens.append({'name': f'purple/{step}', 'value': h, 'css': f'var(--primary-{step})', 'role': role, 'onColor': ink, 'contrast': round(ratio, 4)})

rect(40, 716, 1520, 190, '#FFFFFF', 12)
rect(60, 738, 94, 25, '#7639E0', 12)
text(73, 755, f'AA · {contrast("#FFFFFF", HEXES[6]):.2f}', 12, '#FFFFFF', 500)
text(60, 792, 'Contrast labels show black or', 14, '#6F675F')
text(60, 814, 'white against each swatch.', 14, '#6F675F')
text(60, 844, 'White on 500: 4.41:1.', 14, '#6F675F')
text(60, 866, 'Use 600+ for white button labels.', 14, '#6F675F')
rect(342, 740, 1, 140, '#E8E4E3')
for x, label, line1, line2, dot in [
    (382, 'SURFACE RANGE', '50–300 · quiet surfaces,', 'subtle fills and borders', '#DECCFD'),
    (775, 'BRAND & ACTIONS', '500 · brand primary', '600 · white-label actions', '#8B56F6'),
    (1168, 'CONTENT RANGE', '700–950 · pressed states,', 'headings and readable ink', '#421F7C'),
]:
    rect(x, 768, 8, 8, dot, 4)
    text(x+20, 778, label, 12, '#6F675F', 600)
    text(x+20, 811, line1, 16, '#1D1816', 500)
    text(x+20, 837, line2, 16, '#1D1816', 500)

text(40, 951, 'MIND BRIDGE  /  Primary purple + tints and shades  /  Keep red, yellow, lime, blue and neutral scales as supporting colors.', 13, '#6F675F')
svg.append('</svg>')
(HERE / 'mind-bridge-primary-purple.svg').write_text('\n'.join(svg))
(HERE / 'mind-bridge-purple-tokens.json').write_text(json.dumps({'primary': '#8B56F6', 'shades': tokens}, indent=2) + '\n')
assert tokens[5]['value'] == '#8B56F6'
assert all(luminance(HEXES[i]) > luminance(HEXES[i+1]) for i in range(10))
assert all(t['contrast'] >= 4.5 for t in tokens)
print('Created SVG and JSON; verified primary, 11 descending shades, and swatch text contrast.')
