"""Collects the Library and News items from alepo.com for the Library and News pages.
Library: https://alepo.com/resources/library/ (its Datasheets / Case Studies / White Papers tabs give the type),
         plus each /library/ page for its summary and, on case studies, solution, operator type and country.
News:    https://alepo.com/nnews-sitemap.xml, each news page (title, date, summary, image) and the
         categories shown on https://alepo.com/resources/news/.
Keeps only what the pages state. Images are saved as 640 px WebP in build/static/img/.
Output: build/library/items.json, build/news/items.json
Run:  python3 alepo-site/build/fetch_resources.py
"""
import json, os, re, subprocess, time, html, io
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, 'static', 'img')

def get(url, binary=False):
    r = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', '-w', '\n%{http_code}', url], capture_output=True)
    body, _, code = r.stdout.rpartition(b'\n')
    return int(code or 0), (body if binary else body.decode('utf-8', 'replace'))

def txt(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))).strip()
def meta(s, p):
    m = re.search(r'<meta property="' + p + r'" content="([^"]*)"', s)
    return html.unescape(m.group(1)).strip() if m else None
def slug(u): return re.sub(r'[^a-z0-9-]+', '-', u.split('#')[0].rstrip('/').rsplit('/', 1)[-1].lower().replace('.pdf', ''))[:80]

def save_img(url, name):
    if not url: return None, None, None
    if url.startswith('/'): url = 'https://alepo.com' + url
    code, b = get(url, binary=True)
    if code != 200 or not b: return None, None, None
    try:
        im = Image.open(io.BytesIO(b)); im = im.convert('RGBA').convert('RGB') if im.mode in ('P', 'LA', 'RGBA') else im.convert('RGB')
        if im.width > 640: im = im.resize((640, round(im.height * 640 / im.width)), Image.LANCZOS)
        im.save(os.path.join(IMG, name), 'WEBP', quality=72, method=6)
        return name, im.width, im.height
    except Exception:
        return None, None, None

# ---------- Library ----------
code, s = get('https://alepo.com/resources/library/')
assert code == 200, code
tabs = {m.group(1): txt(m.group(2)) for m in re.finditer(r'aria-controls="(e-n-tab-content-\d+)"[^>]*>\s*<span class="e-n-tab-title-text">(.*?)</span>', s, re.S)}
TYPE = {'Datasheets': 'datasheet', 'Case Studies': 'case-study', 'White Papers': 'white-paper'}
lib, seen = [], set()
for pid, label in tabs.items():
    if label not in TYPE: continue
    a = s.find(f'id="{pid}"'); b = s.find('e-n-tab-content-', a + 30)
    panel = s[a: b if b > 0 else len(s)]
    for it in re.finditer(r'<div class="item item-template2">(.*?)<div class="icon">', panel, re.S):
        block = it.group(1)
        href = html.unescape(re.search(r'href="([^"]+)"', block).group(1))
        title = txt(re.search(r'<h3 class="title">(.*?)</h3>', block, re.S).group(1))
        img = re.search(r'<img[^>]+src="([^"]+)"', block)
        key = href.split('#')[0]
        if key in seen: continue
        seen.add(key)
        lib.append({'type': TYPE[label], 'title': title, 'url': key if key.startswith('http') else 'https://alepo.com' + key,
                    'pdf': key.lower().endswith('.pdf'), 'listing_image': img.group(1) if img else None})
for x in lib:
    x['summary'] = x['solution'] = x['operator'] = x['country'] = None
    if not x['pdf'] and '/library/' in x['url']:
        c, p = get(x['url'])
        if c == 200:
            d = meta(p, 'og:description') or ''
            m = re.match(r'Solutions (.+?) Telco Type (.+?) Country (.+?) ' + re.escape(x['title'][:12]), d)
            if m:
                x['solution'], x['operator'], x['country'] = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
                rest = d[m.end() - 12:]
                rest = rest[len(x['title']):].strip() if rest.startswith(x['title']) else rest
                sub = re.split(r' The Challenge| \[&hellip;\]| \[…\]', rest)[0].strip()
                x['summary'] = sub or None
            elif d and not d.startswith('Solutions '):
                x['summary'] = re.sub(r'\s*\[(?:&hellip;|…)\]\s*$', '', d).strip()
            if not x['listing_image']: x['listing_image'] = meta(p, 'og:image')
        time.sleep(0.4)
    x['image'], x['w'], x['h'] = save_img(x['listing_image'], f'lib-{slug(x["url"])}.webp')
json.dump(lib, open(os.path.join(HERE, 'library', 'items.json'), 'w'), indent=1, ensure_ascii=False)
print('library', len(lib), {t: sum(1 for x in lib if x['type'] == t) for t in TYPE.values()}, 'images', sum(1 for x in lib if x['image']))

# ---------- News ----------
code, listing = get('https://alepo.com/resources/news/')
cats = {}
for m in re.finditer(r'<article class="([^"]*)"[^>]*>.*?href="(https://alepo.com/news/[^"]+)"', listing, re.S):
    cats[m.group(2)] = [c[9:] for c in m.group(1).split() if c.startswith('category-') and c != 'category-news']
code, sm = get('https://alepo.com/nnews-sitemap.xml')
sm_images = {re.search(r'<loc>([^<]+)', b).group(1): re.findall(r'<image:loc>([^<]+)', b) for b in re.findall(r'<url>(.*?)</url>', sm, re.S)}
urls = [u for u in re.findall(r'<loc>([^<]+)</loc>', re.sub(r'<image:image>.*?</image:image>', '', sm, flags=re.S)) if '/news/' in u and u.rstrip('/') != 'https://alepo.com/news']
news = []
for u in urls:
    c, p = get(u)
    if c != 200: print('news fail', u, c); continue
    t = meta(p, 'og:title') or txt((re.search(r'<title>(.*?)</title>', p, re.S) or [None, ''])[1])
    t = re.sub(r'\s*[-|–]\s*Alepo\s*$', '', t).strip()
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', p, re.S)
    date = re.search(r'"datePublished":"([^"]+)"', p)
    it = {'url': u, 'title': txt(h1.group(1)) if h1 and txt(h1.group(1)) else t, 'date': date.group(1)[:10] if date else None,
          'summary': meta(p, 'og:description'), 'categories': cats.get(u, [])}
    img = meta(p, 'og:image')
    if not img and it['date']:
        # no share image: use a sitemap image only if it was uploaded within two months of the item (others belong to other posts)
        ym = lambda y, m: int(y) * 12 + int(m)
        d = ym(*it['date'].split('-')[:2])
        for cand in sm_images.get(u, []):
            f = re.search(r'/uploads/(\d{4})/(\d{2})/', cand)
            if f and abs(ym(*f.groups()) - d) <= 2: img = cand; break
    it['image'], it['w'], it['h'] = save_img(img, f'news-{slug(u)}.webp')
    news.append(it); time.sleep(0.4)
news.sort(key=lambda x: x['date'] or '', reverse=True)
json.dump(news, open(os.path.join(HERE, 'news', 'items.json'), 'w'), indent=1, ensure_ascii=False)
print('news', len(news), 'images', sum(1 for x in news if x['image']), 'with categories', sum(1 for x in news if x['categories']))
