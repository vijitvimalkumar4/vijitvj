// Regenerates data/posts.js from data/posts.json.
// posts.json is the single source of truth; posts.js is a same-origin fallback for hosts
// that block fetch() (some sandboxed previews) and for opening index.html from disk.
// Run: node scripts/build-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'data', 'posts.json');
const out = join(root, 'data', 'posts.js');

const json = JSON.parse(readFileSync(src, 'utf8'));

// light validation so a bad edit fails here, not in the browser
const slugs = new Set();
for (const p of json.posts) {
  for (const k of ['slug', 'title', 'dek', 'category', 'author', 'date', 'readTime', 'seed', 'body']) {
    if (p[k] === undefined) throw new Error(`post "${p.slug || '?'}" is missing "${k}"`);
  }
  if (slugs.has(p.slug)) throw new Error(`duplicate slug "${p.slug}"`);
  slugs.add(p.slug);
  if (!json.categories.some((c) => c.id === p.category)) throw new Error(`post "${p.slug}" uses unknown category "${p.category}"`);
}

writeFileSync(out, `// Generated from data/posts.json by scripts/build-data.mjs. Do not edit by hand.\nwindow.ALEPO_POSTS = ${JSON.stringify(json)};\n`);
console.log(`Wrote ${out} (${json.posts.length} posts, ${json.categories.length} categories)`);
