"""QA for alepo-site/public against the blueprint rules (6.1, 6.3, 15.4).
Usage: python3 alepo-site/build/qa.py   (exit code 1 on any FAIL)
"""
import glob, html, json, os, re, sys
from urllib.parse import urlsplit

PUB = os.path.join(os.path.dirname(__file__), '..', 'public')
PUB = os.path.normpath(PUB)
ORIGIN = 'https://alepo.com'
fails, warns = [], []


def path_of(f):
    rel = '/' + os.path.relpath(f, PUB).replace(os.sep, '/')
    return rel[:-len('index.html')] if rel.endswith('/index.html') else rel


def exists(p):
    p = p.split('#')[0].split('?')[0]
    if not p.startswith('/'):
        return True
    fp = os.path.join(PUB, p.lstrip('/'))
    return os.path.isfile(fp) or os.path.isfile(os.path.join(fp, 'index.html'))


def text(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()


pages = sorted(glob.glob(os.path.join(PUB, '**', '*.html'), recursive=True))
canon = {}
alts = {}
titles, metas = {}, {}
for f in pages:
    s = open(f, encoding='utf-8').read()
    p = path_of(f)
    is404 = p.endswith('404.html')
    t = re.findall(r'<title>(.*?)</title>', s)
    m = re.findall(r'<meta name="description" content="([^"]*)"', s)
    h1 = re.findall(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    if len(t) != 1: fails.append(f'{p}: {len(t)} <title>')
    if len(h1) != 1: fails.append(f'{p}: {len(h1)} <h1>')
    if not re.search(r'<meta name="viewport"', s): fails.append(f'{p}: no viewport')
    if t:
        tt = html.unescape(t[0])
        if len(tt) > 60: fails.append(f'{p}: title {len(tt)} chars: {tt}')
        if ',' in tt: fails.append(f'{p}: comma in title: {tt}')
        titles.setdefault(tt, []).append(p)
    if m:
        mm = html.unescape(m[0])
        if len(mm) > 155: fails.append(f'{p}: meta {len(mm)} chars')
        metas.setdefault(mm, []).append(p)
    elif not is404:
        fails.append(f'{p}: no meta description')
    if h1 and ',' in text(h1[0]): fails.append(f'{p}: comma in H1: {text(h1[0])}')
    for lvl in ('h2', 'h3'):
        for h in re.findall(rf'<{lvl}[^>]*>(.*?)</{lvl}>', s, re.S):
            if ',' in text(h): warns.append(f'{p}: comma in {lvl.upper()} (design copy): {text(h)[:80]}')
    c = re.findall(r'<link rel="canonical" href="([^"]+)"', s)
    if len(c) != 1: fails.append(f'{p}: {len(c)} canonical')
    elif c[0] != ORIGIN + p: fails.append(f'{p}: canonical {c[0]} is not self')
    else: canon[p] = c[0]
    a = dict(re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"', s))
    if not is404:
        if set(a) != {'en', 'es', 'x-default'}: fails.append(f'{p}: hreflang set {sorted(a)}')
        alts[p] = a
    for blob in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            json.loads(blob)
        except Exception as e:
            fails.append(f'{p}: bad JSON-LD {e}')
    if p not in ('/', '/es/') and not is404 and 'BreadcrumbList' not in s: fails.append(f'{p}: no BreadcrumbList')
    if p in ('/', '/es/') and '"Organization"' not in s: fails.append(f'{p}: no Organization schema')
    for href in re.findall(r'(?:href|src)="([^"]+)"', s):
        if href.startswith(('http', 'mailto:', 'tel:', '#', 'data:')): continue
        if re.search(r'\.dc\.html|^[a-z-]+\.html', href): fails.append(f'{p}: snapshot link left: {href}')
        elif not exists(href): fails.append(f'{p}: broken link {href}')
    for js in re.findall(r"location\.href='([^']+)'", s):
        if not exists(js): fails.append(f'{p}: broken language link {js}')
    for img in re.findall(r'<img [^>]*>', s):
        if 'alt="' not in img: fails.append(f'{p}: img without alt')

# hreflang reciprocity
for p, a in alts.items():
    for lang in ('en', 'es'):
        other = urlsplit(a[lang]).path
        if other not in alts: fails.append(f'{p}: hreflang {lang} -> {other} missing'); continue
        if alts[other] != a: fails.append(f'{p}: hreflang not reciprocal with {other}')
for t, ps in titles.items():
    if len(ps) > 1: fails.append(f'duplicate title "{t}": {ps}')
for m, ps in metas.items():
    if len(ps) > 1: fails.append(f'duplicate meta: {ps}')

# sitemap.xml
sm = open(os.path.join(PUB, 'sitemap.xml')).read()
locs = re.findall(r'<loc>([^<]+)</loc>', sm)
for l in locs:
    if not exists(urlsplit(l).path): fails.append(f'sitemap: {l} missing')
print(f'pages: {len(pages)}  sitemap URLs: {len(locs)}  FAIL: {len(fails)}  WARN: {len(warns)}')
for x in fails: print('FAIL', x)
for x in warns[:400]: print('WARN', x)
sys.exit(1 if fails else 0)
