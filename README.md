# Alepo Signal — blog page design

A forward-looking blog for Alepo, built from the brand's own colours and shipped as a static site: one JSON feed, one HTML shell, and a motion layer built on GSAP, ScrollTrigger, Lenis and Motion.

## Run it

```bash
npx http-server . -p 8080 -c-1
# open http://localhost:8080
```

Any static host works (Netlify, Vercel, S3, HubSpot file manager). Opening `index.html` straight from disk also works, because the page falls back to `data/posts.js` when `fetch()` is unavailable.

## Edit content

`data/posts.json` is the single source of truth. Each post has:

| field | purpose |
| --- | --- |
| `slug` | URL: `#/post/<slug>` |
| `title`, `dek` | headline and standfirst |
| `category` | one of the `categories[].id` values; drives the colour hue |
| `tags[]` | searchable labels |
| `author{name, role}` | byline |
| `date`, `readTime` | ISO date, minutes |
| `featured` | `true` puts it in the pinned horizontal rail (use three) |
| `seed` | integer that seeds the generative cover art |
| `body[]` | blocks: `p`, `h2`, `list`, `quote`, `callout`. Backticks in text become inline code. |

After editing, regenerate the fallback bundle:

```bash
node scripts/build-data.mjs
```

## Brand tokens

Colours were lifted from Alepo's live creative (LinkedIn posts, banners, testimonial template):

| token | hex | where it came from |
| --- | --- | --- |
| indigo | `#2d1d8f` | primary background of product posts |
| violet | `#5b3fe8` | logo mark gradient (top) |
| cyan | `#55cbe3` | accent text and icons |
| mint | `#36eee0` | "The future" headline highlight |
| teal | `#008686` | gradient partner to indigo |
| ice | `#bcecf1` | secondary text on indigo |
| navy | `#10143a` | deep text |

Type: **Poppins** (display, matches the brand's headline face), **Inter** (body), **JetBrains Mono** (protocol labels and data).

The page is dark-first with a full light theme; the toggle in the nav persists per browser.

## Motion layer

| library | used for |
| --- | --- |
| GSAP + ScrollTrigger | hero word reveal, pinned horizontal "Featured" rail, parallax covers, batch reveals, counters, reading progress, active table of contents |
| Lenis | smooth scrolling, synced to GSAP's ticker |
| Motion | spring-based magnetic buttons, card tilt, theme toggle spin |
| Canvas | hero node mesh (pointer-reactive) and seeded cover art for every post |

Everything respects `prefers-reduced-motion`, and all content is readable with JavaScript disabled.

Libraries are vendored in `assets/vendor/` (gsap 3.12.5, lenis 1.1.18, motion 11.11.17) so the site has no runtime dependency on a CDN.

## Structure

```
index.html            shell: home view + article view, hash-routed
assets/css/site.css   tokens, layout, components, both themes
assets/js/app.js      data loading, rendering, routing, animation choreography
assets/js/art.js      generative brand art (canvas)
assets/vendor/        gsap, ScrollTrigger, lenis, motion
data/posts.json       content (source of truth)
data/posts.js         generated fallback bundle
scripts/build-data.mjs
```

## Swapping in the real logo

The Alepo mark in `index.html` is an SVG approximation drawn from the brand's Canva assets. Replace the two inline `<svg viewBox="0 0 250 64">` blocks (nav and footer) with the official export; keep the `wordmark` class on the letterforms so they follow the theme colour.
