"""Post-build image step (blueprint 6.1: descriptive image names, WebP, fixed dimensions).
Converts each JPEG used by the site to WebP under a name taken from its alt text,
rewrites every <img src> to it and adds width/height attributes.
Run after build.mjs:  python3 alepo-site/build/images.py
"""
import glob, os, re, html
from PIL import Image

PUB = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'public'))
IMG = os.path.join(PUB, 'assets', 'img')
pages = sorted(glob.glob(os.path.join(PUB, '**', '*.html'), recursive=True))
# English pages first so file names come from English alt text
pages.sort(key=lambda p: ('/es/' in p.replace(os.sep, '/'), p))

def slug(t):
    t = re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')
    return '-'.join(t.split('-')[:8]) or 'image'

names, used = {}, set()
for p in pages:
    s = open(p, encoding='utf-8').read()
    for src, alt in re.findall(r'<img src="/assets/img/([0-9a-f]{32}\.(?:jpg|svg))" alt="([^"]*)"', s):
        if src in names: continue
        base = 'alepo-logo' if src.endswith('.svg') else slug(html.unescape(alt))
        n, i = base, 2
        while n in used: n, i = f'{base}-{i}', i + 1
        used.add(n)
        names[src] = n + ('.svg' if src.endswith('.svg') else '.webp')

dims = {}
small = {}
for src, new in names.items():
    old = os.path.join(IMG, src)
    if src.endswith('.jpg'):
        with Image.open(old) as im:
            dims[new] = im.size
            im = im.convert('RGB')
            # audit finding 13: cap width at 1600 px and keep heavy photos under ~250 KB
            if im.width > 1600:
                im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
            dims[new] = im.size
            out = os.path.join(IMG, new)
            for q in (80, 72, 64):
                im.save(out, 'WEBP', quality=q, method=6)
                if os.path.getsize(out) <= 250_000: break
            # an 800 px copy for phones and small cards
            if im.width > 1000:
                im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS).save(out.replace('.webp', '-800.webp'), 'WEBP', quality=78, method=6)
                small[new] = new.replace('.webp', '-800.webp')
    else:
        os.replace(old, os.path.join(IMG, new)) if not os.path.exists(os.path.join(IMG, new)) else None
for f in os.listdir(IMG):
    if re.fullmatch(r'[0-9a-f]{32}\.(jpg|svg)', f):
        os.remove(os.path.join(IMG, f))

def fix(m):
    tag = m.group(0)
    src = re.search(r'src="/assets/img/([^"]+)"', tag).group(1)
    if src in names:
        new = names[src]
        tag = tag.replace(f'/assets/img/{src}', f'/assets/img/{new}')
        if new in dims and ' width="' not in tag:
            w, h = dims[new]
            tag = tag.replace('<img ', f'<img width="{w}" height="{h}" ', 1)
        shown = re.search(r' data-w="(\d+)"', tag)
        if new in small and ' srcset=' not in tag:
            w = dims[new][0]
            sizes = f'(max-width: 1060px) 100vw, {shown.group(1)}px' if shown else '100vw'
            tag = tag.replace('<img ', f'<img srcset="/assets/img/{small[new]} 800w, /assets/img/{new} {w}w" sizes="{sizes}" ', 1)
    tag = re.sub(r' data-w="\d+"', '', tag)
    return tag

for p in pages:
    s = open(p, encoding='utf-8').read()
    s2 = re.sub(r'<img [^>]*>', fix, s)
    # schema logo path
    s2 = s2.replace('/assets/img/3e3ebf594e76d8759bbe4ff47f7c56dc.svg', '/assets/img/' + names.get('3e3ebf594e76d8759bbe4ff47f7c56dc.svg', '3e3ebf594e76d8759bbe4ff47f7c56dc.svg'))
    if s2 != s:
        open(p, 'w', encoding='utf-8').write(s2)
before = sum(os.path.getsize(os.path.join(IMG, f)) for f in os.listdir(IMG))
print(f'{len(names)} images renamed; assets/img now {before/1e6:.1f} MB')
for k, v in sorted(names.items(), key=lambda x: x[1]): print(f'  {k} -> {v}')
