"""One self-contained HTML file of the whole site (all 98 pages, EN and ES).
Pages are gzip-compressed inside the file and shown by a small hash router (#!/products/aaa-server/);
images, CSS and the site script are embedded. Opens from disk with no server or other files.
Forms cannot send without the server, so they say so.

Usage (after build.mjs):  python3 alepo-site/build/standalone.py
Output: alepo-site/dist/alepo-website.html

The original design (alepo-redesign/, relative links, no site script) builds the same way:
    python3 alepo-site/build/standalone.py --src alepo-redesign --out alepo-site/dist/alepo-original-design.html
"""
import argparse, base64, glob, gzip, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('--src', default=os.path.join(HERE, '..', 'public'))
ap.add_argument('--out', default=os.path.join(HERE, '..', 'dist', 'alepo-website.html'))
ap.add_argument('--title', default='Alepo | AAA and BSS Software for Telecom Operators')
args = ap.parse_args()
PUB = os.path.normpath(os.path.abspath(args.src))
OUT = os.path.normpath(os.path.abspath(args.out))
read = lambda p: open(p, encoding='utf-8').read()

pages, style, fonts = {}, None, None
for f in sorted(glob.glob(os.path.join(PUB, '**', '*.html'), recursive=True)):
    rel = '/' + os.path.relpath(f, PUB).replace(os.sep, '/')
    route = rel[:-len('index.html')] if rel.endswith('/index.html') else rel
    s = read(f)
    head = s[:s.find('</head>')]
    style = style or re.search(r'<style[^>]*>(.*?)</style>', head, re.S).group(1)
    body = re.search(r'<body([^>]*)>(.*)</body>', s, re.S)
    b = body.group(2)
    b = re.sub(r'(src=")(?:\.\./)*(assets/img/)', r'\1/\2', b)                          # images from any depth
    b = re.sub(r"onclick=\"location\.href='([^']+)'\"", r'data-go="\1"', b)              # script buttons (EN/ES)
    cls = re.search(r'class="([^"]*)"', body.group(1))
    pages[route] = {
        't': re.search(r'<title>(.*?)</title>', head, re.S).group(1),
        'l': re.search(r'<html lang="([a-z]+)"', s).group(1),
        'c': cls.group(1) if cls else '',
        # one embedded image per picture; embedded images load at once, so no lazy loading
        'b': re.sub(r'\s(?:srcset|sizes|loading|decoding|fetchpriority)="[^"]*"', '', b),
    }

# embedded images (full size; the 800 px copies are not needed)
imgs = {}
for f in sorted(os.listdir(os.path.join(PUB, 'assets', 'img'))):
    if f.endswith('-800.webp') or f.endswith('-400.webp'): continue
    mime = {'.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png'}.get(os.path.splitext(f)[1], 'image/webp')
    data = open(os.path.join(PUB, 'assets', 'img', f), 'rb').read()
    imgs['/assets/img/' + f] = f'data:{mime};base64,' + base64.b64encode(data).decode()

opt = lambda *p: read(os.path.join(PUB, *p)) if os.path.exists(os.path.join(PUB, *p)) else ''
css = opt('assets', 'css', 'site-fixes.css') + '\n' + opt('assets', 'css', 'site-polish.css') + '\n' + opt('assets', 'css', 'site-copy.css')
site_js = opt('assets', 'js', 'site.js')
# self-hosted fonts are embedded so the file works offline
def _font(m):
    fp = os.path.join(PUB, 'assets', 'fonts', m.group(1))
    return "url('data:font/woff2;base64," + base64.b64encode(open(fp, 'rb').read()).decode() + "')" if os.path.exists(fp) else m.group(0)
css = re.sub(r"url\('/assets/fonts/([\w.\-]+\.woff2)'\)", _font, css)
lenis_js = opt('assets', 'js', 'lenis.min.js')
# the site script reads the query string; in this file the query lives in the hash
site_js = site_js.replace('new URLSearchParams(location.search)', 'new URLSearchParams(window.__q || "")')
site_js = site_js.replace("    v.src = v.canPlayType(", "    if (v.dataset.src === '#hero-video') { var hv = document.getElementById('hero-video'); v.dataset.src = v.dataset.webm = hv ? hv.textContent.trim() : ''; }\n    v.src = v.canPlayType(")
site_js = 'window.__initSite = function () {\n' + site_js + '\n};'

# the Home hero loop is embedded too, so the offline file plays it
_vid = os.path.join(PUB, 'assets', 'video', 'hero-loop.mp4')
if os.path.exists(_vid):
    _uri = 'data:video/mp4;base64,' + base64.b64encode(open(_vid, 'rb').read()).decode()
    _wv = _vid[:-4] + '.webm'
    _wuri = ('data:video/webm;base64,' + base64.b64encode(open(_wv, 'rb').read()).decode()) if os.path.exists(_wv) else _uri
    # one copy only (the smaller WebM), held once in the file for the English and Spanish Home pages
    for _r in pages: pages[_r]['b'] = pages[_r]['b'].replace('data-src="/assets/video/hero-loop.mp4"', 'data-src="#hero-video"').replace('data-webm="/assets/video/hero-loop.webm"', 'data-webm="#hero-video"')
    HERO_VIDEO = _wuri
else:
    HERO_VIDEO = ''
packed = base64.b64encode(gzip.compress(json.dumps(pages, separators=(',', ':')).encode(), 9)).decode()

router = r'''
(function () {
  var PAGES = null, IMGS = window.__IMGS, root = document.getElementById('app');
  var OFFLINE = {en: 'This is an offline copy of the site, so forms do not send. Use the live site to contact Alepo.',
                 es: 'Esta es una copia sin conexión del sitio, así que los formularios no se envían. Use el sitio en línea para contactar a Alepo.'};
  function unpack() {
    var bin = atob(document.getElementById('pages').textContent.trim()), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(ds).text().then(JSON.parse);
  }
  // "/contact-us/?product=x#demo" -> "#!/contact-us/?product=x::demo"
  function toHash(url) {
    var m = url.match(/^(\/[^?#]*)(\?[^#]*)?(#.*)?$/); if (!m) return null;
    return '#!' + m[1] + (m[2] || '') + (m[3] ? '::' + m[3].slice(1) : '');
  }
  function parse() {
    var h = location.hash.indexOf('#!') === 0 ? location.hash.slice(2) : '/';
    var anchor = null, i = h.indexOf('::'); if (i >= 0) { anchor = h.slice(i + 2); h = h.slice(0, i); }
    var q = '', j = h.indexOf('?'); if (j >= 0) { q = h.slice(j); h = h.slice(0, j); }
    return { path: h || '/', query: q, anchor: anchor };
  }
  var current = null;
  function render() {
    var r = parse();
    var page = PAGES[r.path] || PAGES[r.path + '/'] || PAGES[r.path.replace(/\/?$/, '/') + 'index.html'] || PAGES[r.path.indexOf('/es/') === 0 ? '/es/404.html' : '/404.html'] || PAGES['/index.html'] || PAGES['/'];
    if (current !== r.path + r.query) {
      current = r.path + r.query;
      root.innerHTML = page.b.replace(/\/assets\/img\/[\w.\-]+/g, function (u) { return IMGS[u] || u; });
      document.title = page.t.replace(/&amp;/g, '&');
      document.documentElement.lang = page.l;
      document.body.className = page.c;
      // links, root-relative or relative to the current page, become in-file routes
      var resolve = function (href) { var u = new URL(href, 'https://site.invalid' + r.path); return u.pathname + u.search + u.hash; };
      root.querySelectorAll('a[href]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(href) || href.indexOf('/api/') === 0 || href.indexOf('/assets/') === 0) return;
        var h = toHash(resolve(href)); if (h) a.setAttribute('href', h);
      });
      root.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { location.hash = toHash(resolve(b.getAttribute('data-go'))); }); });
      root.querySelectorAll('form[data-form]').forEach(function (f) { f.dataset.endpoint = ''; f.dataset.msgError = OFFLINE[page.l] || OFFLINE.en; f.removeAttribute('action'); });
      window.__q = r.query;
      window.__initSite();
      if (!r.anchor) { if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true }); else window.scrollTo(0, 0); }
    }
    if (r.anchor) { var el = document.getElementById(r.anchor); if (el) { if (window.__lenis) window.__lenis.scrollTo(el, { immediate: true, force: true, offset: -120 }); else el.scrollIntoView(); } }
  }
  // in-page anchors (#overview) scroll without leaving the page
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').indexOf('#!') === 0 || a.getAttribute('href') === '#') return;
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) { e.preventDefault(); if (window.__lenis) window.__lenis.scrollTo(el, { offset: -120 }); else el.scrollIntoView({ behavior: 'smooth' }); }
  });
  window.addEventListener('hashchange', function () { if (location.hash.indexOf('#!') === 0 || location.hash === '') render(); });
  unpack().then(function (p) { PAGES = p; render(); }).catch(function (err) {
    root.innerHTML = '<p style="padding:32px;font:16px Arial">This browser cannot open the compressed pages (' + err.message + '). Please use a current version of Chrome, Edge, Firefox or Safari.</p>';
  });
})();
'''

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{args.title}</title>
<style>{style}</style>
<style>{css}</style>
<style>:root{{color-scheme:light}}body{{background:#FFFFFF;color:#20242D}}</style>
</head>
<body>
<div id="app"><p style="padding:32px;font:16px Arial,sans-serif;color:#565b6b">Loading the Alepo website…</p></div>
<script id="pages" type="application/octet-stream">{packed}</script>
<script id="hero-video" type="text/plain">{HERO_VIDEO}</script>
<script>window.__IMGS = {json.dumps(imgs)};</script>
<script>{lenis_js.replace('</script', '<\\/script')}</script>
<script>{site_js}</script>
<script>{router}</script>
</body>
</html>
'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(html)
print(f'{len(pages)} pages, {len(imgs)} images -> {os.path.relpath(OUT)} ({os.path.getsize(OUT) / 1e6:.1f} MB)')
