"""Collects Alepo's blog posts for the Blog page.
Reads https://alepo.com/post-sitemap.xml, then each post page (one at a time, short pause),
and keeps what the page itself states: title, publish date, summary (og:description),
categories (articleSection) and featured image. Images are saved as 640 px WebP.
Output: build/blog/posts.json and build/static/img/blog-<slug>.webp
Run:  python3 alepo-site/build/fetch_blog.py
"""
import json, os, re, subprocess, sys, time, html, io
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'blog', 'posts.json')
IMG = os.path.join(HERE, 'static', 'img')
os.makedirs(IMG, exist_ok=True)

def get(url, binary=False):
    r = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', '-w', '\n%{http_code}', url], capture_output=True)
    body, _, code = r.stdout.rpartition(b'\n')
    return int(code or 0), (body if binary else body.decode('utf-8', 'replace'))

code, sm = get('https://alepo.com/post-sitemap.xml')
if code != 200: sys.exit(f'sitemap {code}')
entries = []
for u in re.findall(r'<url>(.*?)</url>', sm, re.S):
    loc = re.search(r'<loc>([^<]+)</loc>', u).group(1)
    img = re.search(r'<image:loc>([^<]+)</image:loc>', u)
    entries.append((loc, img.group(1) if img else None))

old = {p['url']: p for p in json.load(open(OUT))} if os.path.exists(OUT) else {}
posts, fails = [], []
for i, (url, smimg) in enumerate(entries):
    if url in old and old[url].get('title'):
        posts.append(old[url]); continue
    code, s = get(url)
    if code != 200: fails.append((url, code)); time.sleep(1); continue
    meta = lambda p: (lambda m: html.unescape(m.group(1)).strip() if m else None)(re.search(r'<meta property="' + p + r'" content="([^"]*)"', s))
    title = meta('og:title') or (lambda m: html.unescape(m.group(1)).strip() if m else None)(re.search(r'<title>([^<]*)', s))
    title = re.sub(r'\s*[-|–]\s*Alepo\s*$', '', title or '').strip()
    date = (re.search(r'"datePublished":"([^"]+)"', s) or re.search(r'article:published_time" content="([^"]+)"', s))
    cats = re.search(r'"articleSection":\[([^\]]*)\]', s)
    cats = [html.unescape(c) for c in re.findall(r'"([^"]+)"', cats.group(1))] if cats else []
    image = meta('og:image') or smimg
    slug = url.rstrip('/').rsplit('/', 1)[-1][:80]
    local = None
    if image:
        c2, b = get(image, binary=True)
        if c2 == 200 and b:
            try:
                im = Image.open(io.BytesIO(b)).convert('RGB')
                if im.width > 640: im = im.resize((640, round(im.height * 640 / im.width)), Image.LANCZOS)
                local = f'blog-{slug}.webp'
                im.save(os.path.join(IMG, local), 'WEBP', quality=72, method=6)
            except Exception as e:
                local = None
    posts.append({'url': url, 'title': title, 'date': date.group(1)[:10] if date else None,
                  'excerpt': meta('og:description'), 'categories': cats, 'image': local, 'source_image': image})
    if i % 20 == 0: print(i, title, flush=True)
    time.sleep(0.4)
posts.sort(key=lambda p: p.get('date') or '', reverse=True)
json.dump(posts, open(OUT, 'w'), indent=1, ensure_ascii=False)
print(f'{len(posts)} posts, {sum(1 for p in posts if p["image"])} images, failures: {len(fails)}')
for f in fails: print('  FAIL', f)
