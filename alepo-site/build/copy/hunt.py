"""Finds visible text on the built pages that is not in the copy deck (the reverse of verify.py).
Run after a build:  python3 alepo-site/build/copy/hunt.py [en|es] [--all]
Every text node shown on a page (main, header, footer) must be part of a line in that page's Word file
or in 02 · Navigation. Text that comes from alepo.com data (blog posts, news items, library items) is
reported separately, because the copy deck lists those items rather than writing them.
"""
import html, json, os, re, sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.normpath(os.path.join(HERE, '..', '..', 'public'))
LANG = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else 'en'
SHOW_ALL = '--all' in sys.argv
SRC = os.path.join(HERE, LANG)
sys.path.insert(0, HERE)
from i18n import walk

def norm(s):
    s = re.sub(r'\{\{link:[^|]*\|([^}]*)\}\}', r'\1', s).replace('**', '')
    return re.sub(r'\s+', ' ', s.replace(' ', ' ')).strip()

def copy_text(m):
    out = []
    def grab(s): out.append(norm(s)); return s
    m2 = json.loads(json.dumps(m)); walk(m2, grab)
    h = m.get('hero') or {}
    for k in ('customers',):
        if h.get(k): out += h[k]
    if h.get('customersLabel'): out.append(norm(h['customersLabel']))
    return out

class Texts(HTMLParser):
    SKIP = {'script', 'style', 'noscript', 'svg', 'title'}
    def __init__(self):
        super().__init__(); self.stack = []; self.out = []; self.where = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.stack.append((tag, a.get('class', ''), a.get('aria-hidden')))
    def handle_endtag(self, tag):
        while self.stack:
            t = self.stack.pop()
            if t[0] == tag: break
    def handle_data(self, d):
        if any(t[0] in self.SKIP or t[2] == 'true' for t in self.stack): return
        d = norm(html.unescape(d))
        if not d: return
        classes = ' '.join(t[1] or '' for t in self.stack)
        tags = [t[0] for t in self.stack]
        region = 'main' if 'main' in tags else 'header' if 'header' in tags else 'footer'
        data = bool(re.search(r'\bx-post\b|\bx-feed\b|x-gate|x-blog', classes))
        self.out.append((region, data, d))

nav = json.load(open(os.path.join(SRC, '02-navigation.json'), encoding='utf-8'))
nav_txt = copy_text(nav)
UI = {  # interface words the site needs that the copy deck does not write (listed so a reviewer can see them)
    'en': ['Menu', 'EN', 'ES', 'On this page', 'Previous', 'Next', 'Skip to content', 'Breadcrumb', '*', '/', '·', '→', '+', '–', '×'],
    'es': ['Menú', 'EN', 'ES', 'En esta página', 'Anterior', 'Siguiente', 'Saltar al contenido', 'Ir al contenido', '*', '/', '·', '→', '+', '–', '×']}[LANG]
report = {}
for name in sorted(os.listdir(SRC)):
    if not name.endswith('.json') or name in ('strings.json',) or name.startswith(('02-', '48-')): continue
    m = json.load(open(os.path.join(SRC, name), encoding='utf-8'))
    p = os.path.join(PUB, ('es/' if LANG == 'es' else '') + m['url'].strip('/'), 'index.html')
    if not os.path.exists(p): continue
    page_blob = ' ␞ '.join(copy_text(m)); nav_blob = ' ␞ '.join(nav_txt)
    t = Texts(); t.feed(open(p, encoding='utf-8').read())
    for region, data, d in t.out:
        if d in UI or re.fullmatch(r'[\d\s.,:/+()#\-–]+', d): continue
        blob = page_blob if region == 'main' else nav_blob  # the page's own file for <main>, 02 · Navigation for the menus and footer
        if d in blob or d.rstrip(':') in blob: continue
        key = ('DATA ' if data else '') + region
        report.setdefault(name, []).append((key, d))
total = 0
for name, items in report.items():
    seen = []
    for k, d in items:
        if (k, d) not in seen: seen.append((k, d))
    shown = [x for x in seen if SHOW_ALL or not x[0].startswith('DATA')]
    if not shown: continue
    print(f'== {name}')
    for k, d in shown: print(f'   [{k}] {d[:140]}'); total += 1
print(f'\n{total} text pieces not found in the copy deck ({LANG})' + ('' if SHOW_ALL else '; lists built from alepo.com data not shown (use --all)'))
