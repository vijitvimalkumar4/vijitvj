"""Turns the website copy deck (build/copy/source/NN-page.docx, US English, 24 Nov 2026) into page models
(build/copy/en/NN-page.json) that build/copy/render.js puts on the site.

Run after replacing the Word files:  python3 alepo-site/build/copy/parse.py

What it keeps exactly as written: every heading, paragraph, list item, table cell, question and answer.
What it changes, and why (each is a decision recorded in the README, "New copy, 24 Nov 2026"):
- keyword bold is kept as ** markers in the model (the renderer does not show it as bold), as the copy
  deck's own note says to remove the bold before publishing
- product names: "AI Assist for Staff", "AI Assist" and "AI Agent Assistant" become "AI Agent Assist";
  "New CRM" becomes "Alepo CRM" (decisions taken on 24 Nov 2026)
- editorial notes for the web team (alt-text patterns, pagination specs, "no demo button" notes) are moved
  to "notes" and are not shown; the renderer carries them out instead
"""
import json, os, re, sys
import docx
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.text.hyperlink import Hyperlink

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'source')
OUT = os.path.join(HERE, 'en')

NAMES = [
    (re.compile(r'\bAI Assist for Staff\b'), 'AI Agent Assist'),
    (re.compile(r'\bAI Agent Assistant\b'), 'AI Agent Assist'),
    (re.compile(r'(?<!Agent )\bAI Assist\b'), 'AI Agent Assist'),
    (re.compile(r'\bNew (Alepo )?CRM\b'), 'Alepo CRM'),
]
def names(s):
    for rx, to in NAMES: s = rx.sub(to, s)
    return s

# lines that instruct the web team rather than speak to visitors
NOTE = re.compile(r'^(\(No demo button.*\)|Photo alt text pattern:.*|Each item shows its publication date.*|Datasheet names use the new product names.*|'
                  r'Pagination:.*|Each role links to its own page.*|Mandatory box\..*|Example for E\d.*|\[Auto-generated.*\])$')

def inline(p):
    t = ''
    for item in p.iter_inner_content():
        if isinstance(item, Hyperlink):
            t += '{{link:' + (item.address or item.fragment or '') + '|' + item.text + '}}'
            continue
        s = item.text
        if not s: continue
        t += ('**' + s + '**') if item.bold and s.strip() else s
    t = t.replace('****', '')
    return names(t.replace(' ', ' ').strip())

def raw_blocks(path):
    d = docx.Document(path)
    for ch in d.element.body.iterchildren():
        tag = ch.tag.split('}')[1]
        if tag == 'p':
            p = Paragraph(ch, d)
            text = inline(p)
            if text: yield {'style': p.style.name if p.style is not None else '', 'text': text}
        elif tag == 'tbl':
            tb = Table(ch, d)
            rows = [[names(c.text.replace(' ', ' ').strip()) for c in r.cells] for r in tb.rows]
            yield {'style': 'TABLE', 'rows': rows}

BTN = re.compile(r'\{\{link:([^|]*)\|([^}]*)\}\}|\[([^\[\]]+)\]')
def buttons_only(t):
    rest = BTN.sub('', t).strip()
    return not rest and BTN.search(t)
def buttons(t):
    out = []
    for m in BTN.finditer(t):
        if m.group(2): out.append({'label': m.group(2), 'to': m.group(1)})
        else: out.append({'label': m.group(3)})
    return out

def classify(b):
    """one docx block -> one or more model blocks"""
    if b['style'] == 'TABLE':
        rows = b['rows']
        return [{'t': 'table', 'head': rows[0], 'rows': rows[1:]}]
    t, st = b['text'], b['style']
    if NOTE.match(re.sub(r'\*\*', '', t)): return [{'t': 'note', 'text': t}]
    if st == 'Compact' and re.sub(r'\*\*', '', t).rstrip().endswith('→'): return [{'t': 'more', 'text': t}]
    if st == 'Compact': return [{'t': 'li', 'text': t}]
    if st == 'Heading 3': return [{'t': 'h3', 'text': t}]
    m = re.match(r'^\*\*(.+?\?)\*\*\n(.+)$', t, re.S)
    if m: return [{'t': 'qa', 'q': m.group(1).strip(), 'a': m.group(2).strip()}]
    if buttons_only(t): return [{'t': 'buttons', 'items': buttons(t)}]
    if '\n- ' in t:  # a paragraph followed by its own bullet list (customer stories)
        head, *items = t.split('\n- ')
        return [{'t': 'p', 'text': head.strip()}, {'t': 'ul', 'items': [i.strip() for i in items]}]
    m = re.match(r'^Status: (.+)$', t)
    if m: return [{'t': 'status', 'text': m.group(1)}]
    m = re.match(r'^Product: (.+)$', t)
    if m: return [{'t': 'product', 'text': m.group(1)}]
    if re.sub(r'\*\*', '', t).rstrip().endswith('→'): return [{'t': 'more', 'text': t}]
    return [{'t': 'p', 'text': t}]

def group(blocks):
    """consecutive list items -> one list; consecutive questions -> one faq; h3 -> a sub-block holding what follows"""
    out = []
    for b in blocks:
        if b['t'] == 'li':
            if out and out[-1]['t'] == 'list': out[-1]['items'].append(b['text'])
            else: out.append({'t': 'list', 'items': [b['text']]})
        elif b['t'] == 'qa':
            if out and out[-1]['t'] == 'faq': out[-1]['items'].append({'q': b['q'], 'a': b['a']})
            else: out.append({'t': 'faq', 'items': [{'q': b['q'], 'a': b['a']}]})
        else: out.append(b)
    res = []
    for b in out:
        if b['t'] == 'h3': res.append({'t': 'sub', 'h3': b['text'], 'blocks': []})
        elif res and res[-1]['t'] == 'sub' and b['t'] != 'note': res[-1]['blocks'].append(b)
        else: res.append(b)
    return res

def parse(path):
    bl = list(raw_blocks(path))
    m = {'source': os.path.basename(path), 'notes': [], 'sections': []}
    m['doc'] = re.sub(r'\s+—.*$', '', bl[0]['text'])
    i = 1
    while i < len(bl) and bl[i]['style'] != 'Heading 2':
        t = bl[i].get('text', '')
        plain = re.sub(r'\*\*', '', t)
        for key, lab in (('url', 'URL:'), ('title', 'Title tag:'), ('desc', 'Meta description:'), ('primary', 'Primary keyword:'), ('secondary', 'Secondary keywords:')):
            if plain.startswith(lab):
                v = plain[len(lab):].strip()
                if key == 'url': v = re.sub(r'\s*\(.*\)$', '', v); m['pagination'] = 'page/2' in plain
                m[key] = v
                if key in ('title', 'desc'): m[key + 'Marked'] = t[t.find(':') + 1:].strip()
                break
        else:
            m['notes'].append(t)
        i += 1
    if m['doc'].startswith('01 ') and not m.get('url'): m['url'] = '/'  # the home page copy has no URL line
    cur = None
    while i < len(bl):
        b = bl[i]
        if b['style'] == 'Heading 2':
            cur = {'h2': b['text'], 'blocks': []}
            m['sections'].append(cur)
        elif b['style'] == 'Heading 1':
            cur['blocks'].append({'t': 'h1', 'text': b['text']})
        else:
            for x in classify(b):
                if x['t'] == 'note': m['notes'].append(x['text'])
                else: cur['blocks'].append(x)
        i += 1
    for s in m['sections']: s['blocks'] = group(s['blocks'])
    # hero: breadcrumb, H1, opening lines, buttons, in-page links, anything else shown with it
    if m['sections'] and re.sub(r'\*\*', '', m['sections'][0]['h2']) == 'Hero':
        hs = m['sections'].pop(0)['blocks']
        hero = {'crumbs': None, 'eyebrow': None, 'badge': None, 'h1': None, 'lede': [], 'buttons': [], 'subnav': [], 'customers': None, 'extra': []}
        for b in hs:
            txt = re.sub(r'\*\*', '', b.get('text', ''))
            if b['t'] == 'h1': hero['h1'] = b['text']
            elif b['t'] == 'p' and hero['h1'] is None and ' / ' in b['text']: hero['crumbs'] = [c.strip() for c in b['text'].split(' / ')]
            elif b['t'] == 'p' and txt.startswith('Status badge'): hero['badge'] = txt.split(':', 1)[1].strip()
            elif b['t'] == 'p' and hero['h1'] is None: hero['eyebrow'] = b['text']
            elif b['t'] == 'p' and re.match(r'^(Overview|Capabilities|AI|Deployment)( · [A-Z][\w ]+)+$', txt): hero['subnav'] = txt.split(' · ')
            elif b['t'] == 'p' and txt.startswith('Operators running on Alepo:'): hero['customers'] = txt.split(':', 1)[1].strip().split(' · ')
            elif b['t'] == 'p' and not hero['buttons'] and not hero['extra']: hero['lede'].append(b['text'])
            elif b['t'] == 'buttons': hero['buttons'] += b['items']
            elif b['t'] == 'list' and not hero['subnav'] and all(len(x) < 30 for x in b['items']): hero['subnav'] = b['items']
            else: hero['extra'].append(b)
        m['hero'] = hero
    return m

# ---------- links: every link is resolved here, on the English text, and stored as href so a translation keeps it ----------
NAME_URL = {
    'AAA Server': '/products/aaa-server/', 'Fulfilment Manager': '/products/service-provisioning/', 'TACACS+ Server': '/products/tacacs-server/',
    'Wi-Fi Offload and Calling': '/products/wifi-offload-calling/', 'Home Router and ONT Management': '/products/device-management/',
    'Subscriber Data Management': '/products/subscriber-data-management/', 'Digital BSS': '/products/digital-bss/', 'BSS in a Box': '/products/bss-in-a-box/',
    'BSS in a Box for MVNOs': '/products/bss-in-a-box/', 'Online Charging': '/products/online-charging/', 'Policy Control': '/products/policy-control/',
    'Prepaid Offers and Vouchers': '/products/prepaid-offers-vouchers/', 'Mediation Studio': '/products/mediation-revenue-assurance/',
    'Collections and Dunning': '/products/collections-dunning/', 'Partner and MVNO Settlement': '/products/partner-mvno-settlement/',
    'Interconnect and Roaming Settlement': '/products/interconnect-roaming-settlement/', 'Alepo CRM': '/products/crm/', 'Selfcare Now': '/products/self-care-portal/',
    'Self-Care Mobile App': '/products/self-care-app/', 'Mobile POS': '/products/dealer-mobile-pos/', 'AI Customer Assistant': '/products/ai-virtual-agent/',
    'AI Agent Assist': '/products/ai-agent-assist/', 'AI': '/products/ai-for-telecom/',
    'Fiber and cable ISPs': '/solutions/fibre-cable-isps/', 'Fiber and cable': '/solutions/fibre-cable-isps/', 'Mobile operators': '/solutions/mobile-operators/',
    'MVNOs and MVNEs': '/solutions/mvnos-mvnes/', 'Wi-Fi and venues': '/solutions/wifi-venues/', 'Enterprise and government networks': '/solutions/enterprise-government-networks/',
    'Enterprise networks': '/solutions/enterprise-government-networks/', 'Services and support': '/services/', 'Solutions': '/solutions/', 'Products': '/products/',
    'Services': '/services/', 'Resources': '/resources/', 'Company': '/company/about/', 'Home': '/',
    'About Alepo': '/company/about/', 'Leadership': '/company/leadership/', 'Customers': '/customers/', 'Partners': '/company/partners/', 'Careers': '/company/careers/',
    'News and events': '/news/', 'Security': '/company/security/', 'Contact': '/contact-us/', 'Customer support': '/services/#support', 'Blog': '/blog/',
    'Library': '/library/', 'Case studies': '/customers/', 'Privacy policy': '/privacy-policy/', 'Sitemap': '/sitemap/',
    'Access control': '/products/network-access-aaa/', 'BSS and monetization': '/products/billing-bss/', 'Channels and care': '/products/customer-care-channels/',
    'Care and AI': '/products/customer-care-channels/', 'Network Access & AAA': '/products/network-access-aaa/', 'Billing & BSS': '/products/billing-bss/',
    'Deployment': '/services/#deployment', 'Run by Alepo': '/services/#run-by-alepo', 'Professional services': '/services/#professional-services',
    'Forward-deployed engineers': '/services/#forward-deployed-engineers', 'Support': '/services/#support',
    'Integration and single sign-on': '/services/#integration-and-single-sign-on', 'Customer success': '/services/#customer-success',
}
MORE = [
    (r'All customer stories|Read customer stories|All case studies', '/customers/'), (r'All products', '/products/'), (r'All solutions', '/solutions/'),
    (r'See ISP solutions', '/solutions/fibre-cable-isps/'), (r'See mobile solutions', '/solutions/mobile-operators/'), (r'See MVNO solutions', '/solutions/mvnos-mvnes/'),
    (r'See Wi-Fi solutions', '/solutions/wifi-venues/'), (r'See enterprise solutions|See the enterprise and government solution', '/solutions/enterprise-government-networks/'),
    (r'AI in Alepo products|See how AI works across Alepo products', '/products/ai-for-telecom/'), (r'About Alepo', '/company/about/'),
    (r'All news|All events', '/news/'), (r'All resources', '/resources/'), (r'All posts', '/blog/'), (r'See the package', '/products/bss-in-a-box/'),
    (r'Support details', '/services/#support'), (r'download the product datasheet', '/library/'),
    (r'launch an MVNO', 'post:launch an mvno'), (r'What is TACACS\+\?', 'post:what is tacacs'),
]
BUTTONS = {'Request a demo': '/contact-us/#demo', 'Contact sales': '/contact-us/?request=sales#demo', 'See the AI at work': '/products/ai-for-telecom/',
           'Meet the team': '/company/leadership/', 'Apply': '/contact-us/?request=partner#demo', 'Apply to partner': '/contact-us/?request=partner#demo',
           'See open roles': '#open-roles', 'Send your resume': 'https://alepo.com/company/careers/apply-now/', 'Subscribe': '#newsletter'}
ROLE_URL = {  # the live role pages on the current site (WordPress), passed through by the server
    'Senior Sales Engineering Solutions Architect': 'https://alepo.com/careers/senior-sales-engineering-solutions-architect/', 'Team Lead, Delivery and Support': 'https://alepo.com/careers/team-lead-delivery-support/',
    'Senior Engineer, Technical Support': 'https://alepo.com/careers/senior-engineer-technical-support/', 'Lead Java Developer, Research and Development': 'https://alepo.com/careers/lead-java-developer-research-development/',
    'Sales Director': 'https://alepo.com/careers/sales-director/'}
POST_ALIAS = {'Running RADIUS Across Firewalls and NAT: Which Ports to Open, and Where': '/radius-firewall-nat-rules/'}
LIB_RENAME = {'Policy Control Datasheet': 'Converged Policy Control Datasheet', 'Wi-Fi Offload and Calling Datasheet': 'WiFi Monetization Datasheet'}

def words(t): return [w for w in re.findall(r'[a-z0-9+]+', t.lower()) if w not in ('the', 'a', 'an', 'and', 'with', 'for', 'of', 'to', 'in', 'on', 'alepo', 'explained', 'vs')]
def best(title, cands):
    want = words(title)
    if not want: return None
    scored = sorted(((sum(w in words(c['title']) for w in want) / len(want), c) for c in cands), key=lambda x: -x[0])
    return scored[0][1] if scored and scored[0][0] >= 0.6 else None

def load(rel):
    try: return json.load(open(os.path.join(HERE, '..', rel), encoding='utf-8'))
    except Exception: return []
POSTS, LIB, NEWS = load('blog/posts.json'), load('library/items.json'), load('news/items.json')
def overlap(a, b):
    A, B = set(words(a)), set(words(b))
    return len(A & B) / max(1, min(len(A), len(B)))
def closest(title, cands, floor=0.5):
    scored = sorted(((overlap(title, c['title']), c) for c in cands), key=lambda x: -x[0])
    return scored[0][1] if scored and scored[0][0] >= floor else None
UNRESOLVED = []

def plain(t): return re.sub(r'\{\{link:[^|]*\|([^}]*)\}\}', r'\1', re.sub(r'\*\*', '', t)).strip()
def name_url(t):
    t = plain(t).rstrip(' →').strip()
    if t in NAME_URL: return NAME_URL[t]
    m = re.match(r'^(.+?):\s', t)
    if m and m.group(1) in NAME_URL: return NAME_URL[m.group(1)]
    return None
def more_url(text, ctx):
    t = plain(text)
    m = re.match(r'^Explore (.+?) →$', t)
    if m and m.group(1) in NAME_URL: return NAME_URL[m.group(1)]
    if re.match(r'^(Product page|Open) →$', t) and ctx and name_url(ctx): return name_url(ctx)
    for rx, to in MORE:
        if re.search(rx, t):
            if to.startswith('post:'):
                hit = best(to[5:], POSTS)
                return hit['url'] if hit else None
            return to
    return None
def resource_url(kind, title):
    title = re.sub(r'\s*\(was .*\)$', '', title)
    title = re.sub(r'\s*·\s*Read →$', '', title)
    if kind in ('Customer', 'Product', 'Partner', 'News'):
        hit = closest(title, NEWS)
        return hit['url'] if hit else None
    if kind == 'Blog' or kind in ('RADIUS',):
        alias = POST_ALIAS.get(title)
        hit = next((p for p in POSTS if alias and p['url'].endswith(alias)), None) or best(title, POSTS) or closest(title, POSTS[:40], 0.45)
    else:
        typ = {'Datasheet': 'datasheet', 'Case study': 'case-study', 'White paper': 'white-paper'}.get(kind)
        hit = next((x for x in LIB if x['title'] == LIB_RENAME.get(title, title)), None) or best(title, [x for x in LIB if x.get('type') == typ])
    return hit['url'] if hit else None

def resolve(m):
    def btns(items):
        for it in items:
            if 'href' not in it: it['href'] = BUTTONS.get(it['label'])
            if it['href'] is None and it['label'] != 'Send request': UNRESOLVED.append((m['source'], 'button', it['label']))
    def walk(blocks, ctx=None):
        for b in blocks:
            if b['t'] == 'more':
                b['href'] = more_url(b['text'], ctx)
                if not b['href']: UNRESOLVED.append((m['source'], 'more', b['text']))
            elif b['t'] == 'buttons': btns(b['items'])
            elif b['t'] == 'product': b['href'] = name_url(b['text'])
            elif b['t'] == 'p' and m['source'].startswith('02-') and ' · ' in b['text']:
                b['hrefs'] = [name_url(x) for x in plain(b['text']).split(' · ')]
            elif b['t'] == 'list': b['hrefs'] = [name_url(i) for i in b['items']]
            elif b['t'] == 'table':
                h = b['head']
                if h[:2] == ['Type', 'Title'] or h == ['Type', 'Item']:
                    b['hrefs'] = [resource_url(r[0], r[1]) if r[0] in ('Datasheet', 'Case study', 'Blog', 'White paper', 'Customer', 'Product', 'Partner', 'News', 'RADIUS') else ROLE_URL.get(r[0]) or name_url(r[1]) for r in b['rows']]
                elif h[:1] == ['Product']: b['hrefs'] = [name_url(r[0]) for r in b['rows']]
                elif h == ['News']: b['hrefs'] = [resource_url('News', r[0]) for r in b['rows']]
            elif b['t'] == 'sub':
                b['href'] = name_url(b['h3'])
                walk(b['blocks'], b['h3'])
    for s in m['sections']: walk(s['blocks'], s['h2'])
    h = m.get('hero')
    if h:
        btns(h['buttons'])
        if h.get('crumbs'): h['crumbHrefs'] = [name_url(c) for c in h['crumbs']]
        walk(h['extra'])

# ---------- layout hints, from the English copy, so a translation keeps the same layout and anchors ----------
def slug(t): return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', plain(t).lower())).strip('-')
TABLE_KIND = {('Figure', 'Result', 'Customer'): 'stats', ('Fact', 'Detail'): 'facts', ('Product', 'What it does'): 'products', ('Layer', 'What sits there'): 'layers',
              ('Speaker', 'Message'): 'chat', ('Assistant', 'Question', 'Answer', 'Status'): 'assistants', ('News',): 'newslist', ('Type', 'Item'): 'newsrows'}
TYPE_TITLE = {'Offices': 'offices', 'Leadership team': 'people', 'Open roles': 'roles', 'Customer support': 'phones', 'Events': 'events', 'News': 'newsrows',
              'News and events': 'newsrows', 'By need': 'needs', 'Latest posts': 'posts', 'Posts': 'posts', 'Resources': 'resources', 'Items': 'library'}
def annotate(m):
    def tables(blocks, sec):
        for i, b in enumerate(blocks):
            if b['t'] == 'table':
                h = tuple(b['head'])
                if h == ('Field', 'Copy'): b['kind'] = 'promo' if b['rows'] and b['rows'][0][0] == 'Eyebrow' else 'story'
                elif h[:2] == ('Type', 'Title'): b['kind'] = TYPE_TITLE.get(plain(sec), 'rows')
                else: b['kind'] = TABLE_KIND.get(h, 'rows')
                if b['kind'] == 'story': b['fields'] = [r[0] for r in b['rows']]
                # a console title in bold just before a chat, and its caption just after
                if b['kind'] == 'chat' and i > 0 and blocks[i - 1]['t'] == 'p' and re.fullmatch(r'\*\*[^*]+\*\*', blocks[i - 1]['text']):
                    b['title'] = plain(blocks[i - 1]['text']); blocks[i - 1]['t'] = 'skip'
                if b['kind'] in ('chat', 'assistants') and i + 1 < len(blocks) and blocks[i + 1]['t'] == 'p' and plain(blocks[i + 1]['text']).startswith('Illustration'):
                    b['caption'] = blocks[i + 1]['text']; blocks[i + 1]['t'] = 'skip'
            elif b['t'] == 'p':
                t = plain(b['text'])
                if t.startswith('Diagram labels:'):
                    b['t'] = 'diagram'
                    b['boxes'] = [[x.strip() for x in re.split(r':\s|\s·\s', part.strip())] for part in t.split(':', 1)[1].split('|')]
            elif b['t'] == 'sub':
                tables(b['blocks'], sec)
                first = next((x for x in b['blocks'] if x['t'] == 'p'), None)
                if ' · ' in b['h3'] and first and first['text'].startswith('**'): b['kind'] = 'story'
        blocks[:] = [b for b in blocks if b['t'] != 'skip']
    for s in m['sections']:
        name = plain(s['h2'])
        s['id'] = slug(name)
        tables(s['blocks'], name)
        kinds = {b['t'] for b in s['blocks']}
        if name.startswith('AI in ') or name == 'AI network operations': s['tone'] = 'dark'
        if name in ('Often added',): s['role'] = 'chips'
        elif name in ('Topic filters', 'Filters'): s['role'] = 'filters'
        elif name in ('Posts', 'Items'): s['role'] = 'feed'
        elif name == 'Form': s['role'] = 'form'
        elif name.startswith('Thank-you page'): s['role'] = 'thanks'
        elif name == 'Customer quote': s['role'] = 'quote'
        elif 'faq' in kinds: s['role'] = 'faq'
    if m['sections'] and any(b['t'] == 'buttons' for b in m['sections'][-1]['blocks']) and m['sections'][-1].get('role') is None \
            and all(b['t'] in ('p', 'buttons') for b in m['sections'][-1]['blocks']):
        m['sections'][-1]['role'] = 'cta'
    h = m.get('hero')
    if h: tables(h['extra'], 'Hero')
    if h and h.get('subnav'):
        secs = [s for s in m['sections'] if s.get('role') not in ('cta', 'thanks')]
        def target(lab):
            if lab == 'Overview': return secs[0]['id'] if secs else None
            if lab == 'Capabilities': return secs[1]['id'] if len(secs) > 1 else None
            for s in secs:
                n = plain(s['h2'])
                if lab == 'AI' and (n.startswith('AI') or 'AI' in n.split()): return s['id']
                if lab == 'Questions' and s.get('role') == 'faq': return s['id']
                if lab == 'Deployment' and re.match(r'^(Install|Where it runs|Deployment)', n): return s['id']
                if lab in ('Customer story', 'Resources') and n == lab: return s['id']
            return None
        h['subnavTargets'] = [target(x) for x in h['subnav']]

def main():
    os.makedirs(OUT, exist_ok=True)
    n = 0
    for f in sorted(os.listdir(SRC)):
        if not f.endswith('.docx'): continue
        model = parse(os.path.join(SRC, f))
        resolve(model)
        annotate(model)
        json.dump(model, open(os.path.join(OUT, f[:-5] + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        n += 1
    print(f'{n} page models written to {os.path.relpath(OUT)}')
    for u in UNRESOLVED: print('  link not resolved:', *u)

if __name__ == '__main__':
    main()
