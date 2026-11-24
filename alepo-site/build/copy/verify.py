"""Checks that every line of the website copy deck is on the built page (English, and Spanish once translated).
Run after a build:  python3 alepo-site/build/copy/verify.py [en|es]
A line counts as present when its words (bold markers removed, whitespace collapsed) appear in the page's text.
Exit 1 when any line is missing. Lines the renderer deliberately leaves out are listed with the reason:
past events (hidden by date), the editorial notes, and the menu/footer copy (checked on the home page).
"""
import html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.normpath(os.path.join(HERE, '..', '..', 'public'))
LANG = sys.argv[1] if len(sys.argv) > 1 else 'en'
SRC = os.path.join(HERE, LANG)
sys.path.insert(0, HERE)
from i18n import walk  # same walk as the translation, so both languages are checked the same way

TODAY = __import__('datetime').date.today().isoformat()
MONTHS = {m: i + 1 for i, m in enumerate('january february march april may june july august september october november december'.split())}
MONTHS.update({m: i + 1 for i, m in enumerate('enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split())})
def past(t):
    m = re.search(r'(\d{1,2})(?:\s*(?:to|al|a|-|–)\s*(\d{1,2}))?\s+(?:de\s+)?([a-záéíóú]+)\s+(?:de\s+)?(\d{4})', t.lower())
    return bool(m and m.group(3) in MONTHS and f'{m.group(4)}-{MONTHS[m.group(3)]:02d}-{int(m.group(2) or m.group(1)):02d}' < TODAY)

def norm(s):
    s = re.sub(r'\{\{link:[^|]*\|([^}]*)\}\}', r'\1', s).replace('**', '')
    s = re.sub(r'\s*→\s*$', '', s)
    return re.sub(r'\s+', ' ', s.replace(' ', ' ')).strip()

def page_text(url):
    p = os.path.join(PUB, ('es/' if LANG == 'es' else '') + url.strip('/'), 'index.html')
    if not os.path.exists(p): return None
    raw = open(p, encoding='utf-8').read()
    body = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', raw, flags=re.S)
    body = re.sub(r'<br\s*/?>', ' ', body)
    title = re.search(r'<title>(.*?)</title>', raw, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', raw)
    alts = ' '.join(re.findall(r'alt="([^"]*)"', raw))
    text = html.unescape(re.sub(r'<[^>]+>', ' ', body)) + ' ' + html.unescape(alts)
    return re.sub(r'\s+', ' ', text), html.unescape(title.group(1)) if title else '', html.unescape(desc.group(1)) if desc else ''

LAYOUT_HEADS = {'Fact', 'Detail', 'Type', 'Title', 'Field', 'Copy', 'Product', 'What it does', 'Figure', 'Result', 'Customer', 'Layer', 'What sits there',
                'Speaker', 'Message', 'Assistant', 'Question', 'Answer', 'Status', 'News', 'Item', 'Project', 'Highlights', 'Profile', 'Eyebrow', 'Text', 'Link'}
missing, checked, skipped = [], 0, {}
for name in sorted(os.listdir(SRC)):
    if not name.endswith('.json') or name == 'strings.json' or name.startswith(('02-', '48-')): continue
    m = json.load(open(os.path.join(SRC, name), encoding='utf-8'))
    en = json.load(open(os.path.join(HERE, 'en', name), encoding='utf-8'))
    got = page_text(m['url'])
    if not got: missing.append((name, '(page missing)')); continue
    text, title, desc = got
    if m.get('title') and norm(m['title']) != norm(title): missing.append((name, 'title: ' + norm(m['title'])))
    if m.get('desc') and norm(m['desc']) != norm(desc): missing.append((name, 'description: ' + norm(m['desc'])))
    lines = []
    def grab(s):
        lines.append(s); return s
    m2 = json.loads(json.dumps(m)); m2.pop('title', None); m2.pop('desc', None)
    # sections the renderer builds from data or puts on another page
    for s in m2.get('sections', []):
        if s.get('role') in ('thanks', 'form'): s['blocks'] = []; skipped['form fields and the thank-you page (checked on their pages)'] = skipped.get('form fields and the thank-you page (checked on their pages)', 0) + 1
        if s.get('role') == 'filters': s['blocks'] = []
        def heads(bl):
            for b in bl:
                if b['t'] == 'table':
                    b['head'] = []  # layout labels, not shown
                    if b.get('kind') in ('story', 'promo'): b['rows'] = [['', r[1]] for r in b['rows']]
                    if LANG == 'es' and b.get('kind') in ('posts', 'library') and s.get('role') == 'feed': b['rows'] = []  # posts and documents are published in English, under their English titles
                if b['t'] == 'sub': heads(b['blocks'])
        heads(s['blocks'])
        # a section of events that have all passed is not shown, heading included
        ev = [b for b in s['blocks'] if b['t'] == 'table' and b.get('kind') == 'events']
        if ev and all(past(' '.join(r)) for b in ev for r in b['rows']): s['h2'] = ''
        for b in s['blocks']:
            if b['t'] == 'table' and b.get('kind') in ('events', 'newsrows'):
                keep = [r for r in b['rows'] if not past(' '.join(r))]
                skipped['past events (hidden by date)'] = skipped.get('past events (hidden by date)', 0) + len(b['rows']) - len(keep)
                b['rows'] = keep
    if m2.get('hero'):
        for b in m2['hero'].get('extra', []):
            if b['t'] == 'table': b['head'] = []
    walk(m2, grab)
    for s in lines:
        n = norm(s)
        if not n or n in LAYOUT_HEADS: continue
        if n.startswith(('Operators running on', 'Operadores que')): continue
        if name.startswith('01-') and n.startswith(('Illustration. Names and figures', 'Ilustración.')): skipped['Home hero caption (removed on request)'] = 1; continue
        if n in ('Event', 'Evento', 'Topic filters', 'Filters', 'Form', 'Filtros por tema', 'Filtros de tema', 'Filtros', 'Formulario') or n.startswith(('Thank-you page', 'Página de agradecimiento')):
            continue  # an instruction heading, or the tag of a past event
        n = re.sub(r'\s*\((was|antes) [^)]*\)$', '', n)
        if past(n): skipped['past events (hidden by date)'] = skipped.get('past events (hidden by date)', 0) + 1; continue
        checked += 1
        parts = [p for p in re.split(r'\s+·\s+|\n', n) if p.strip()]
        if not all(norm(p).replace('Read', '').strip(' ·') in text or norm(p) in text for p in parts):
            # a story result is shown as figure + words; a "Name: description" line as name and description
            alt = re.sub(r'^(\S+)\s+', r'\1 ', n)
            pieces = re.split(r':\s+', n, maxsplit=1)
            if all(x in text for x in pieces) or alt in text: continue
            missing.append((name, n[:140]))
print(f'copy check ({LANG}): {checked} lines on {len([f for f in os.listdir(SRC) if f.endswith(".json")]) - 2} pages, {len(missing)} missing')
for k, v in skipped.items(): print(f'  left out on purpose: {v} {k}')
for f, s in missing[:60]: print('  MISSING', f, '|', s)
sys.exit(1 if missing else 0)
