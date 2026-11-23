"""Checks the merge of the team package (build/merge/package-v1.json) into the built site (public/).
Run after a build:  python3 alepo-site/build/merge/verify.py
Fails (exit 1) when:
- a line the package corrected (its EDITS "from" text) is still on a page it applies to
- a page has fewer questions and answers than the package, or a different title or description
- a withdrawn data sheet or the held SE 14 news item is on the site
"""
import html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.normpath(os.path.join(HERE, '..', '..', 'public'))
pk = json.load(open(os.path.join(HERE, 'package-v1.json'), encoding='utf-8'))
norm = lambda s: re.sub(r'\s+', ' ', (s or '').replace(' ', ' ')).strip()

def page(url):
    p = os.path.join(PUB, url.strip('/'), 'index.html')
    if not os.path.exists(p): return None, None
    raw = open(p, encoding='utf-8').read()
    body = re.sub(r'<script.*?</script>|<style.*?</style>', '', raw, flags=re.S)
    return raw, norm(html.unescape(re.sub(r'<[^>]+>', ' ', body)))

fails, stats = [], {'pages': 0, 'edits checked': 0, 'questions': 0, 'titles': 0}
for key, routes in pk['routes'].items():
    for L in ('en', 'es'):
        raw, text = page(routes[L])
        if raw is None:
            fails.append(f'{routes[L]}: page missing'); continue
        stats['pages'] += 1
        P = pk['pages'][key][L]
        for e in pk['edits']:
            files = e.get('files')
            if files and key not in files and '_header' not in files and '_footer' not in files: continue
            pair = e.get(L)
            if not pair or len(pair[0]) < 25 or norm(pair[0]) in norm(pair[1]): continue
            stats['edits checked'] += 1
            if norm(pair[0]) in text: fails.append(f'{routes[L]}: corrected line still present: {pair[0][:80]}')
        qa = P.get('qa') or []
        found = sum(1 for q, a in qa if norm(q) in text and norm(a) in text)
        stats['questions'] += found
        if found < len(qa): fails.append(f'{routes[L]}: {found} of {len(qa)} questions and answers')
        if P.get('title'):
            t = re.search(r'<title>(.*?)</title>', raw, re.S)
            if t and norm(html.unescape(t.group(1))) == norm(P['title']): stats['titles'] += 1
            else: fails.append(f'{routes[L]}: title differs from the package')
        if P.get('desc'):
            d = re.search(r'<meta name="description" content="([^"]*)"', raw)
            if not d or norm(html.unescape(d.group(1))) != norm(P['desc']): fails.append(f'{routes[L]}: description differs from the package')

withdrawn = ['AAA Server Datasheet', 'Subscriber Data Management Datasheet', 'Converged Policy Control Datasheet', 'WiFi Monetization Datasheet']
for root, _, files in os.walk(PUB):
    for f in files:
        if not f.endswith('.html'): continue
        s = open(os.path.join(root, f), encoding='utf-8').read()
        for w in withdrawn:
            if '>' + w + '<' in s: fails.append(f'{os.path.relpath(root, PUB)}: withdrawn data sheet "{w}"')
        if re.search(r'Unveils SE 14', s): fails.append(f'{os.path.relpath(root, PUB)}: SE 14 news item')

print('merge check:', ', '.join(f'{v} {k}' for k, v in stats.items()), f'- {len(fails)} problems')
for f in fails[:40]: print('  FAIL', f)
sys.exit(1 if fails else 0)
