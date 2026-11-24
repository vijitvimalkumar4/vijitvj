"""Spanish pages from the English copy models.

  python3 alepo-site/build/copy/i18n.py extract   # every visible English string -> copy/es/strings.json (keeps existing translations)
  python3 alepo-site/build/copy/i18n.py apply     # copy/en/*.json + strings.json -> copy/es/*.json

The Spanish models keep the English structure, links, anchors and layout hints; only the words change.
A string with no translation yet stays in English, and `apply` lists it.
"""
import json, os, sys, copy

HERE = os.path.dirname(os.path.abspath(__file__))
EN, ES = os.path.join(HERE, 'en'), os.path.join(HERE, 'es')
STRINGS = os.path.join(ES, 'strings.json')

def walk_blocks(blocks, f):
    for b in blocks:
        t = b['t']
        if t in ('p', 'more', 'status', 'product', 'h1'): b['text'] = f(b['text'])
        elif t in ('list', 'ul'): b['items'] = [f(x) for x in b['items']]
        elif t == 'buttons':
            for it in b['items']: it['label'] = f(it['label'])
        elif t == 'table':
            b['head'] = [f(x) for x in b['head']]
            b['rows'] = [[f(c) for c in r] for r in b['rows']]
            for k in ('title', 'caption'):
                if b.get(k): b[k] = f(b[k])
        elif t == 'faq':
            for q in b['items']: q['q'] = f(q['q']); q['a'] = f(q['a'])
        elif t == 'diagram': b['boxes'] = [[f(x) for x in bx] for bx in b['boxes']]
        elif t == 'sub':
            b['h3'] = f(b['h3'])
            walk_blocks(b['blocks'], f)

def walk(m, f):
    for k in ('title', 'desc'):
        if m.get(k): m[k] = f(m[k])
    h = m.get('hero')
    if h:
        for k in ('eyebrow', 'badge', 'h1', 'customersLabel'):
            if h.get(k): h[k] = f(h[k])
        if h.get('crumbs'): h['crumbs'] = [f(x) for x in h['crumbs']]
        h['lede'] = [f(x) for x in h.get('lede', [])]
        for it in h.get('buttons', []): it['label'] = f(it['label'])
        h['subnav'] = [f(x) for x in h.get('subnav', [])]
        walk_blocks(h.get('extra', []), f)
    for s in m.get('sections', []):
        s['h2'] = f(s['h2'])
        walk_blocks(s['blocks'], f)

def models():
    for name in sorted(os.listdir(EN)):
        if name.endswith('.json') and not name.startswith('48-'):  # 48 is the blog article template, not a page
            yield name, json.load(open(os.path.join(EN, name), encoding='utf-8'))

def extract():
    os.makedirs(ES, exist_ok=True)
    old = json.load(open(STRINGS, encoding='utf-8')) if os.path.exists(STRINGS) else {}
    seen = {}
    for name, m in models():
        def grab(s):
            if isinstance(s, str) and s.strip() and s not in seen: seen[s] = old.get(s, '')
            return s
        walk(m, grab)
    json.dump(seen, open(STRINGS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    todo = sum(1 for v in seen.values() if not v)
    print(f'{len(seen)} strings ({sum(len(k) for k in seen)} characters), {todo} without a translation -> {os.path.relpath(STRINGS)}')

def apply():
    tr = json.load(open(STRINGS, encoding='utf-8'))
    missing = set()
    def f(s):
        v = tr.get(s)
        if not v: missing.add(s); return s
        return v
    for name, m in models():
        es = copy.deepcopy(m)
        walk(es, f)
        es['lang'] = 'es'
        json.dump(es, open(os.path.join(ES, name), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'Spanish models written; {len(missing)} strings still in English')
    for s in sorted(missing)[:30]: print('  untranslated:', s[:90])

if __name__ == '__main__':
    {'extract': extract, 'apply': apply}[sys.argv[1] if len(sys.argv) > 1 else 'extract']()
