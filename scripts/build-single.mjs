// Bundles the site into one self-contained HTML file: dist/alepo-signal.html
// Inlines the stylesheet, the vendored libraries, the app scripts and the data bundle,
// so the page can be dropped into a CMS (HubSpot custom module, landing page) or shared as a file.
// Run: node scripts/build-single.mjs            → full document
//      node scripts/build-single.mjs --fragment → body-only fragment (title + style + markup + scripts)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const fragment = process.argv.includes('--fragment');

let html = read('index.html');

// stylesheet → inline
html = html.replace(/<link rel="stylesheet" href="assets\/css\/site.css">/, () => `<style>\n${read('assets/css/site.css')}\n</style>`);

// favicon → inline data URI
html = html.replace(/href="assets\/img\/favicon.svg"/, `href="data:image/svg+xml,${encodeURIComponent(read('assets/img/favicon.svg'))}"`);

// scripts → inline, in document order
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const code = read(src).replace(/<\/script/gi, '<\\/script');
  return `<script>/* ${src} */\n${code}\n</script>`;
});

if (fragment) {
  // keep <title>, the font link, the inline theme script and the whole body; drop the document wrapper
  const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
  const font = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/)[0];
  const style = html.match(/<style>[\s\S]*?<\/style>/)[0];
  const themeBoot = html.match(/<script>\s*\/\/ Apply a remembered theme[\s\S]*?<\/script>/)[0];
  const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
  html = [title, font, style, themeBoot, body].join('\n');
}

mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', fragment ? 'alepo-signal.fragment.html' : 'alepo-signal.html');
writeFileSync(out, html);
console.log(`Wrote ${out} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
