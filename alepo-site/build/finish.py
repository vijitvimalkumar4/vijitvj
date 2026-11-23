"""Last build step (after images.py), from the council audit:
1. 400 px copies of blog, library and news card images, offered through srcset.
2. A 1200 x 630 share image per page (og:image, twitter:card) in /assets/og/.
3. Content-hashed CSS and JavaScript names (site-polish.3f9c2a1b.css) so they can be cached for a year.
Run after build.mjs (build.mjs runs it):  python3 alepo-site/build/finish.py
"""
import glob, hashlib, html, os, re
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.normpath(os.path.join(HERE, '..', 'public'))
IMG = os.path.join(PUB, 'assets', 'img')
FONTS = os.path.join(HERE, 'static', 'fonts')
pages = sorted(glob.glob(os.path.join(PUB, '**', '*.html'), recursive=True))
ORIGIN = 'https://alepo.com'

# 1. thumbnails
thumbs = 0
for f in os.listdir(IMG):
    if re.match(r'(blog|lib|news|leader)-.*(?<!-400)\.webp$', f) and not f.startswith('leader-'):
        out = os.path.join(IMG, f[:-5] + '-400.webp')
        if not os.path.exists(out):
            with Image.open(os.path.join(IMG, f)) as im:
                if im.width > 400: im.resize((400, round(im.height * 400 / im.width)), Image.LANCZOS).save(out, 'WEBP', quality=74, method=6); thumbs += 1
def add_srcset(m):
    tag, name = m.group(0), m.group(1)
    if ' srcset=' in tag or not os.path.exists(os.path.join(IMG, name + '-400.webp')): return tag
    return tag.replace('<img ', f'<img srcset="/assets/img/{name}-400.webp 400w, /assets/img/{name}.webp 640w" sizes="(max-width: 760px) 90vw, 400px" ', 1)

# 2. share images
OG = os.path.join(PUB, 'assets', 'og'); os.makedirs(OG, exist_ok=True)
bold = lambda n: ImageFont.truetype(os.path.join(FONTS, 'plus-jakarta-sans-latin-700-normal.woff2'), n)
semi = lambda n: ImageFont.truetype(os.path.join(FONTS, 'plus-jakarta-sans-latin-600-normal.woff2'), n)
def wrap(draw, text, font, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) <= width: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines
def share_image(title, section, out):
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), (18, 13, 61))
    px = im.load()
    for y in range(H):            # indigo to violet, lighter towards the top right
        for x in range(0, W, 4):
            t = min(1, max(0, (x / W) * 0.65 + (1 - y / H) * 0.35))
            c = (int(18 + (74 - 18) * t), int(13 + (52 - 13) * t), int(61 + (214 - 61) * t))
            for k in range(4): px[x + k, y] = c
    d = ImageDraw.Draw(im)
    for gx in range(40, W, 28):    # dot grid, top right
        for gy in range(30, 300, 28):
            if gx > 640: d.ellipse((gx, gy, gx + 2, gy + 2), fill=(120, 108, 220))
    d.rectangle((80, 120, 152, 126), fill=(85, 203, 227))
    d.text((80, 150), section.upper(), font=semi(26), fill=(185, 176, 255))
    size = 72
    while size > 44:
        lines = wrap(d, title, bold(size), 1000)
        if len(lines) <= 3: break
        size -= 4
    y = 200
    for ln in lines[:3]: d.text((80, y), ln, font=bold(size), fill=(255, 255, 255)); y += int(size * 1.15)
    d.text((80, H - 92), 'alepo.com', font=semi(30), fill=(201, 196, 232))
    im.save(out, 'JPEG', quality=84, optimize=True, progressive=True)

made = 0
for p in pages:
    s = open(p, encoding='utf-8').read()
    s2 = re.sub(r'<img [^>]*src="/assets/img/((?:blog|lib|news)-[^"/]+?)\.webp"[^>]*>', add_srcset, s)
    if 'og:image' not in s2 and 'noindex' not in s2[:6000]:
        h1 = re.search(r'<h1[^>]*>(.*?)</h1>', s2, re.S)
        title = html.unescape(re.sub(r'<[^>]+>', '', h1.group(1))).strip() if h1 else 'Alepo'
        crumbs = re.findall(r'data-role="breadcrumb"[^>]*>(.*?)</div>', s2, re.S)
        names = [html.unescape(x).strip() for x in re.findall(r'>([^<>/][^<>]*)</(?:a|span)>', crumbs[0])] if crumbs else []
        section = names[-2] if len(names) >= 2 else ('Alepo' if not names else names[0])
        if section in ('Home', 'Inicio'): section = 'Alepo'
        rel = os.path.relpath(p, PUB).replace(os.sep, '/').replace('index.html', '').strip('/') or 'home'
        name = re.sub(r'[^a-z0-9]+', '-', rel.lower()).strip('-') + '.jpg'
        share_image(title, section, os.path.join(OG, name)); made += 1
        url = f'{ORIGIN}/assets/og/{name}'
        tags = (f'<meta property="og:image" content="{url}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
                f'<meta property="og:image:alt" content="{html.escape(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{url}">')
        s2 = s2.replace('</head>', tags + '</head>', 1)
    if s2 != s: open(p, 'w', encoding='utf-8').write(s2)

# 3. hashed asset names
renamed = {}
for sub, ext in (('css', '.css'), ('js', '.js')):
    d = os.path.join(PUB, 'assets', sub)
    for f in os.listdir(d):
        if not f.endswith(ext) or re.search(r'\.[0-9a-f]{8}\.', f): continue
        data = open(os.path.join(d, f), 'rb').read()
        hf = f[:-len(ext)] + '.' + hashlib.sha256(data).hexdigest()[:8] + ext
        open(os.path.join(d, hf), 'wb').write(data)
        renamed[f'/assets/{sub}/{f}'] = f'/assets/{sub}/{hf}'
for p in pages:
    s = open(p, encoding='utf-8').read(); s2 = s
    for a, b in renamed.items(): s2 = s2.replace(f'"{a}"', f'"{b}"')
    if s2 != s: open(p, 'w', encoding='utf-8').write(s2)
print(f'finish: {thumbs} thumbnails, {made} share images, {len(renamed)} hashed assets')
