# Alepo.com: SEO build of the redesign

`public/` is the Alepo.com redesign with the SharePoint SEO plan applied, in English and Spanish.
It is built from the design snapshot in `../alepo-redesign/`, which stays untouched as the audit baseline.

Sources (SharePoint › Marketing2 › SEO › Alepo.com › New SEO Website approch):

- `Alepo_website_structure_and_keyword_map.xlsx`: URLs, H1s, title tags, keyword owners, redirects
- `Alepo_website_blueprint_48_pages_final.html`: meta descriptions, page templates, site-wide rules (extract in `build/source/`)
- `Alepo_blueprint_v2_validation_and_developer_appendix.html`: schema code, hreflang, URLs to protect
- `Alepo.com recommended Products menu.png`: five product groups, buyer labels with brand on the second line

## Run and rebuild

Serve the site locally, then open http://localhost:8080:

```bash
npx http-server alepo-site/public -p 8080 -c-1
```

Rebuild the site after changing anything in `build/` (needs Playwright with Chromium and Python with Pillow):

```bash
NODE_PATH=$(npm root -g) node alepo-site/build/build.mjs
```

Check the output against the blueprint rules (exits non-zero on any failure):

```bash
python3 alepo-site/build/qa.py
```

| File | What it holds |
| --- | --- |
| `build/urls.json` | Design page to public URL, the four category pages, anchor renames |
| `build/catalog.json` | Product labels, brand lines, the five groups and their sub-groups |
| `build/overrides.json` | Values that are not verbatim from the blueprint, each with its reason; all Spanish titles, metas and H1s |
| `build/redirects.csv` | 301 map. Rows marked `confirm` are listed but not live |
| `build/transform.js` | The changes made to each page, run in the browser |
| `build/build.mjs`, `build/images.py` | Build runner and WebP image step |
| `build/qa.py` | Checks: titles of 60 characters or fewer, no commas, metas of 155 or fewer, one H1, self-canonical, reciprocal hreflang, valid JSON-LD, BreadcrumbList, no broken links, sitemap entries exist |
| `build/last-build.json` | Title, meta and H1 of every built page |

## What was applied

**URLs.** Every page moves to the keyword map's URL, with a trailing slash and an `/es/` mirror, for example `/products/aaa-server/` and `/es/products/aaa-server/`. The Navigation design board is not a public page.

**Head of every page:**
- title tag and meta description
- viewport meta, which the design lacked, so phones rendered it at desktop width
- self-canonical, plus hreflang `en`, `es` and `x-default` pointing at each other
- Open Graph title, description and URL
- JSON-LD: Organization and WebSite on Home, BreadcrumbList on every other page

**H1s.** Every H1 follows the keyword map. Product pages whose H1 no longer names the brand carry the brand as styled text above it, for example "Fulfilment Manager" above "Service Provisioning and Activation" (blueprint rules 6.1 and 6.3).

**Breadcrumbs.** "Home" is now the first item. Product pages show Home › Products › [Category] › [Product], and the category links to its new landing page.

**Navigation:**
- **Products menu:** rebuilt into the five groups from the recommended menu image. Each group heading links to its landing page, and Billing & BSS has the sub-groups Billing, Charging and policy, Revenue assurance and Wholesale.
- **Labels:** each product shows its buyer label, with the brand in italics where it differs, under the design's own descriptor. The design's own copy uses only "Mediation Studio", "Alepo CRM" and the other brand names.
- **Mobile menu:** grouped under the same five headings.
- **Footer:** the columns follow blueprint 5.5: five product groups, then Solutions, Services, Resources and Company. Sitemap in the legal row is now a link.

**Product renames in link text across the site:**

| Old name | New label |
| --- | --- |
| Fulfilment Manager | Service Provisioning and Activation |
| Home Router and ONT Management | Device Management (TR-069 and TR-369) |
| Mediation Studio | Mediation and Revenue Assurance |
| Alepo CRM | CRM and Customer Care |
| Selfcare Now | Self-Care Portal |
| Mobile POS | Dealer App and Mobile POS |
| AI Customer Assistant | AI Virtual Agent |
| AI Assist for Staff | AI Agent Assist |

Prose on the pages still uses the brand names, as the blueprint asks.

**New pages:**
- **Four category landing pages:** Network Access & AAA, Billing & BSS, Provisioning & Devices, and Customer Care & Channels, in both languages. Each follows the blueprint 9.2 order (hero with definition, products by sub-group, product map, AI, Solutions by operator type, customer story, resources, demo band). Every section is reused from the design, and the definition is the blueprint's meta.
- **HTML sitemap** (`/sitemap/`) and a **404 page**, which is noindex and links the top tasks.

**Other page changes:**
- **Home:** Products now shows five group cards instead of two.
- **Products hub:** regrouped into the five groups, with headings linking to the landing pages.
- **Services:**
  - anchors renamed to the map's `#professional-services` and `#forward-deployed-engineers`
  - new `#customer-success` section built from sentences already in the design
- **Enterprise solution page:** new `#cisco-acs-replacement` anchor. The "Replace Cisco ACS" menu shortcut now goes there (keyword map N3).

**Files at the site root:**
- `sitemap.xml` with hreflang alternates
- `robots.txt`
- `_redirects` (Netlify format, live 301s only) and `redirects.csv` (all rows)
- `llms.txt` (optional, per blueprint 15.1)

**Images.** WebP files with names taken from their alt text and fixed width and height. Image weight fell from 5.8 MB to 3.8 MB.

## UX and lead-generation fixes

These come from the audit doc "Alepo.com redesign: UX and lead-generation audit". The code is in `build/leadfixes.js` (applied to each page at build time), `build/static/js/site.js` (runtime, no dependencies, no tracking) and `build/static/css/site-fixes.css`.

**One setup step before launch.** The forms post straight to the HubSpot Forms API for portal 242907903, with no HubSpot script and no tracking before consent. Create three forms in HubSpot with the fields email, firstname, lastname, company and message: Demo request, Data sheet request and Newsletter. Paste each form's ID into `build/site-config.json` and rebuild. Until then, `qa.py` prints a WARN per form, and a visitor who submits sees "We could not send this".

The data-sheet form only records the request. To email the PDF, add a HubSpot workflow on that form. Set `privacyUrl` in the same file so the consent line links to the policy.

| # | Finding | Fix |
| --- | --- | --- |
| 1 | Form did not send | Real submit to HubSpot, inline validation, and a noindex `/contact-us/thank-you/` page with next steps. The newsletter form works the same way. |
| 2 | Demo buttons went to a generic page | Every demo button goes to `/contact-us/?product=<slug>#demo`. The form now sits in the contact hero, prefilled with the product. |
| 3 | No step for buyers not ready for a demo | Every product page offers "Get the data sheet" (work email only). Resource data-sheet links point to it. The contact form adds Talk to an engineer, Submit an RFP, Get a pricing estimate and Get a data sheet. |
| 4 | Past event in the top bar | Expires after `topbar.ends`, at build time and in the browser, and switches to News and events |
| 5 | Search did nothing | Removed |
| 6 + 18 | Menu taller than the screen | Descriptors dropped from the menu and the panel capped at the screen height with its own scroll. Opens on click, closes after a short delay and on Esc, and sets `aria-expanded`. |
| 9 | No pricing signal | "How pricing works" block on every product page, with "Get an estimate" |
| 10 | Phones not tappable | Every phone number is a `tel:` link. The support numbers also moved into the contact hero. |
| 11 | No mobile demo button | Sticky "Request a demo" bar on product pages, shown once the hero scrolls away |
| 12 | No consent text or autofill | Consent line on every form, autocomplete on name, email and company, and the product captured from the page instead of an extra field |
| 13 | Heavy images | Images capped at 1600 px and about 250 KB, an 800 px copy with `srcset`, and lazy loading below the fold. Home went from 2.3 MB to 0.6 MB. |
| 14 | Repeated sections | Category pages no longer repeat the product map and Solutions grid |
| 15 | Small text and targets on phones | Descriptors at 15 px, breadcrumbs at 28 px and page-menu tabs at 44 px |
| 16 + 17 | Motion and accessibility defects | Static customer list with readable contrast and no duplicates, no photo zooms. Product map role fixed and scroll area focusable. axe-core finds 0 defects (24 before). |
| 19 | No expectation set | "What happens next" line on the demo form |
| 20 | Language switch was a script button | Plain links with `hreflang` |

**Still needs content from Alepo (not changed):**
- **Findings 7 and 8:** logos, named quotes and a real console screenshot, which need customer permission and product assets.
- **Finding 10:** regional sales contacts.
- **Pricing wording:** "The price depends on the products you take, your subscriber numbers and how it is deployed" needs confirming by sales.
- **"What happens next" line:** should match how sales actually follows up.

## Decisions taken, to confirm

| Item | What the build does | Why |
| --- | --- | --- |
| Home H1 | Option B: "AAA and BSS software for telecom operators" | Option A ("AI-native ...") applies only if every product's agent is Live, which isn't confirmed |
| Policy Control | "Policy Control (PCRF)", with the fallback title "PCRF Policy Control for Telecom Operators" | The blueprint uses PCF only if it's supported, and the design never mentions PCF |
| Online Charging title | "Online Charging System (OCS) for Operators" | The blueprint uses "5G" only if CHF or Nchf is supported, and neither is in the design |
| Group label | "Billing & BSS" | The menu image leaves "BSS & Monetization" open; the URL `/billing-bss/` works either way |
| TACACS+ | Keeps its own page | The keyword map recommends it; Jonathan decides |
| N1 "Replace an end-of-life AAA" | Links to the AAA page without `#replace-legacy-aaa` | The design has no "Replace a legacy AAA" section |
| Spanish | Every Spanish title, meta and H1 not given in the blueprint was written for this build, along with the Spanish group labels | Needs human review (blueprint rule 6.6). The 9 Spanish H1s and 2 Spanish titles in the blueprint are used verbatim |

## Not done (needs content or a decision from Alepo)

- **Questions and answers.** The blueprint lists questions for 22 pages with no answers. Writing them would mean inventing product claims.
- **Product template blocks the design lacks:**
  - How it works, Features (draft H2s to H3s), Specifications table, Use cases, Integrations, Deployment, Pricing, Related products
  - inline demo form, sticky mobile CTA, data sheet download, and the AI cards with a Live, Pilot or Roadmap status
  - all of these need facts from product management and the claims register (6.4)
- **Pages not built:**
  - blog explainers E1 to E15
  - case study, news item, job posting and thank-you templates
  - privacy policy, cookie settings and accessibility statement
  - the AI Sales Assistant and AI CCaaS sections (decision T10 and T11)
- **Redirects marked `confirm`:** these need the pre-launch crawl, the `?p=` addresses, or a decision on whether the offer is the same.
- **Open Graph images** (1200 × 630) and analytics events. The latter need consent tooling first.
