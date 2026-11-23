"""Collects company content from alepo.com that the new site reuses as published:
- the Privacy Policy and Cookie Policy text (https://alepo.com/privacy-policy/, /cookie-policy/), cleaned to
  headings, paragraphs, lists and links -> build/legal/privacy.html, build/legal/cookie.html
- the leadership photos (https://alepo.com/company/leadership/) -> build/static/img/leader-<name>.webp
Run:  python3 alepo-site/build/fetch_company.py
"""
import os, re, subprocess, html, io, json
from html.parser import HTMLParser
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
def get(url, binary=False):
    r = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', '-w', '\n%{http_code}', url], capture_output=True)
    body, _, code = r.stdout.rpartition(b'\n')
    return int(code or 0), (body if binary else body.decode('utf-8', 'replace'))

KEEP = {'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'strong', 'b', 'em', 'i', 'br'}
class Clean(HTMLParser):
    def __init__(self): super().__init__(convert_charrefs=True); self.out = []; self.skip = 0
    def handle_starttag(self, t, a):
        if t in ('script', 'style', 'svg'): self.skip += 1; return
        if self.skip or t not in KEEP: return
        if t == 'a':
            href = dict(a).get('href') or ''
            if href.startswith('https://alepo.com/'): href = href[len('https://alepo.com'):]
            self.out.append(f'<a href="{html.escape(href)}">'); return
        t = {'b': 'strong', 'i': 'em'}.get(t, t)
        self.out.append('<br>' if t == 'br' else f'<{t}>')
    def handle_endtag(self, t):
        if t in ('script', 'style', 'svg'): self.skip = max(0, self.skip - 1); return
        if self.skip or t not in KEEP or t == 'br': return
        self.out.append(f'</{ {"b": "strong", "i": "em"}.get(t, t)}>')
    def handle_data(self, d):
        if not self.skip: self.out.append(html.escape(d))

for slug, name in (('privacy-policy', 'privacy'), ('cookie-policy', 'cookie')):
    code, s = get(f'https://alepo.com/{slug}/')
    assert code == 200, (slug, code)
    # the policy runs from its title heading to the footer's "Locations" heading
    b = s[s.find('<body'):]
    start = re.search(r'<h3[^>]*>\s*(?:Privacy|Cookie) Policy\s*</h3>', b).end()
    end = re.search(r'<h3[^>]*>\s*Locations\s*</h3>', b).start()
    c = Clean(); c.feed(b[start:end])
    out = re.sub(r'<p>\s*</p>', '', ''.join(c.out))
    out = re.sub(r'\s+', ' ', out).replace('> <', '><').strip()
    open(os.path.join(HERE, 'legal', name + '.html'), 'w').write(out)
    print(slug, len(out), 'chars,', out.count('<h2>'), 'sections')

code, s = get('https://alepo.com/company/leadership/')
photos = {}
for u in sorted(set(re.findall(r'https://alepo\.com/wp-content/uploads/[^"\')\s]+\.(?:jpg|jpeg|png)', s))):
    base = u.rsplit('/', 1)[-1].lower()
    if re.search(r'-\d+x\d+\.', base) or any(k in base for k in ('logo', 'shutterstock', 'gemini', 'about-us', 'blog-pic', 'legit', 'favicon')): continue
    stem = re.sub(r'\.(jpg|jpeg|png)$', '', base).replace('-cto', '').replace('-1', '')
    c2, b = get(u, binary=True)
    if c2 != 200: continue
    im = Image.open(io.BytesIO(b)).convert('RGB')
    side = min(im.size); im = im.crop(((im.width - side) // 2, 0, (im.width - side) // 2 + side, side)).resize((320, 320), Image.LANCZOS)
    f = f'leader-{stem}.webp'; im.save(os.path.join(HERE, 'static', 'img', f), 'WEBP', quality=80, method=6)
    photos[stem] = f
json.dump(photos, open(os.path.join(HERE, 'legal', 'leaders.json'), 'w'), indent=1)
print('leader photos', len(photos), sorted(photos))
