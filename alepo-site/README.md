# Alepo.com: SEO build of the redesign

`public/` is the Alepo.com redesign with the SharePoint SEO plan applied, in English and Spanish.
It is built from the design snapshot in `../alepo-redesign/`, which stays untouched as the audit baseline.

Sources (SharePoint › Marketing2 › SEO › Alepo.com › New SEO Website approch):

- `Alepo_website_structure_and_keyword_map.xlsx`: URLs, H1s, title tags, keyword owners, redirects
- `Alepo_website_blueprint_48_pages_final.html`: meta descriptions, page templates, site-wide rules (extract in `build/source/`)
- `Alepo_blueprint_v2_validation_and_developer_appendix.html`: schema code, hreflang, URLs to protect
- `Alepo.com recommended Products menu.png`: five product groups, buyer labels with brand on the second line

## Run and rebuild

Run the site with its form server, then open http://localhost:8080:

```bash
ADMIN_TOKEN=change-me node alepo-site/server/server.mjs
```

A plain static host also serves the pages, but the forms need `server/server.mjs` (see "Forms and leads" below).

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

## Standalone file

`dist/alepo-website.html` is the whole site (98 pages, English and Spanish) in one 5.7 MB HTML file. Its images, styles and scripts are embedded, and the pages are compressed inside it. It opens from disk with no server, so you can email it or share it for review. Pages switch through the address bar's `#!` part, for example `alepo-website.html#!/products/aaa-server/`.

`dist/alepo-original-design.html` is the untouched original design (`alepo-redesign/`, 43 pages in each language, 9.3 MB) built the same way, for side-by-side comparison. Build it with `python3 alepo-site/build/standalone.py --src alepo-redesign --out alepo-site/dist/alepo-original-design.html`.

Forms in these files say they are an offline copy and do not send. Fonts load from Google Fonts when online. Rebuild it after `build.mjs`:

```bash
python3 alepo-site/build/standalone.py
```

## UX and lead-generation fixes

These come from the audit doc "Alepo.com redesign: UX and lead-generation audit". The code is in `build/leadfixes.js` (applied to each page at build time), `build/static/js/site.js` (runtime, no dependencies, no tracking) and `build/static/css/site-fixes.css`.

**Forms post to Alepo's own server, with no third-party service.** See "Forms and leads" below. Set `privacyUrl` in `build/site-config.json` so the consent line links to the policy.

| # | Finding | Fix |
| --- | --- | --- |
| 1 | Form did not send | Real submit to `/api/forms/<form>` on Alepo's own server, with inline validation and a noindex `/contact-us/thank-you/` page with next steps. Works without JavaScript too. The newsletter form works the same way. |
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

## Forms and leads

`server/server.mjs` serves `public/` and receives the three forms. It is one file with no dependencies, and needs Node 18 or later. Run it on any server or container behind HTTPS.

| Form | Where it is | Required fields |
| --- | --- | --- |
| `demo` | Contact page hero; every "Request a demo", "Get an estimate" and "Contact sales" button lands on it, with the product prefilled | Name, work email, company |
| `datasheet` | "Get the data sheet" on every product page | Work email |
| `newsletter` | Footer of every page | Email |

**What happens on submit:**
1. The server checks required fields and email format, rejects posts from other sites, caps each IP at 8 submissions per 10 minutes, and limits the body to 32 KB.
2. A hidden spam-trap field catches bots; their posts are accepted silently and not stored.
3. Each lead is appended to `data/leads.ndjson`, readable only by the server's own user (mode 600). It holds the form, name, email, company, request type, product, message, language, page, consent text and timestamp. IP addresses are not stored.
4. If `LEAD_WEBHOOK_URL` is set, the server posts a short summary to it. A Microsoft Teams or Slack incoming webhook works.
5. The visitor lands on the thank-you page (demo) or sees a confirmation in place (data sheet, newsletter).

**Environment variables:**

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on (default 8080) |
| `LEADS_DIR` | Where leads are stored (default `alepo-site/data`, which is git-ignored) |
| `ADMIN_TOKEN` | Required to download leads; with no token set the download is switched off |
| `LEAD_WEBHOOK_URL` | Optional notification for each new lead, and for data sheets the team must send by hand |
| `TRUST_PROXY=1` | Read the client IP from `X-Forwarded-For` behind a load balancer |

**Download leads** as a CSV (newest first; opens in Excel). The export prefixes values starting with `=`, `+`, `-` or `@` with `'`, so spreadsheets never run them as formulas.

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://alepo.com/api/leads.csv -o leads.csv
```

The server also applies the 301 redirects from `_redirects`, serves the English or Spanish 404 page, and sends basic security headers.

**Data sheet emails.** When someone asks for a data sheet, the server emails them a link to the product's PDF, in their language. The email has a button to the PDF, a link to request a demo for that product, and Alepo's address. It is built in `server/datasheets.mjs` and sent by `server/mailer.mjs`, both without dependencies.

To switch it on:

1. Put each PDF in `build/static/datasheets/en/<slug>.pdf` (Spanish versions in `.../es/<slug>.pdf`), then rebuild. If a Spanish file is missing, the English one is sent with a one-line note. The build and the server both list products that have no PDF yet. The slugs are the product URLs: aaa-server, tacacs-server, wifi-offload-calling, subscriber-data-management, digital-bss, bss-in-a-box, online-charging, policy-control, prepaid-offers-vouchers, mediation-revenue-assurance, collections-dunning, partner-mvno-settlement, interconnect-roaming-settlement, service-provisioning, device-management, crm, self-care-portal, self-care-app, dealer-mobile-pos, ai-virtual-agent, ai-agent-assist.
2. Give the server a mailbox to send from. Use one of these:

| Option | Variables |
| --- | --- |
| Microsoft 365 through Graph (recommended for Alepo) | `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET` from an Entra app registration with the **Mail.Send** application permission (limit it to the sending mailbox with an application access policy) |
| Any SMTP service (Microsoft 365, Google Workspace, SendGrid, Amazon SES...) | `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS or 465 TLS), `SMTP_USER`, `SMTP_PASS` |
| Both | `MAIL_FROM` (the sending mailbox, for example datasheets@alepo.com), `MAIL_FROM_NAME` (default "Alepo"), `MAIL_REPLY_TO` (for example sales@alepo.com; the email then invites a reply), `SITE_URL` (default https://alepo.com) |

3. Make sure the sending domain's SPF and DKIM records cover the service you chose, so the emails reach the inbox.

**How delivery behaves:**
- **On the page:** the visitor sees "on its way to your inbox" when an email is being sent. Otherwise they see "our team will email you".
- **Manual fallback:** if there is no PDF, no mailbox is configured, or the product is unknown, the team gets a webhook alert to send it by hand.
- **Retries:** a failed send is retried after 1 and 5 minutes. After the last try the team is alerted with the address and the PDF link.
- **Abuse limits:** the same address gets the same data sheet at most once a day, and at most 5 data sheets a day; past that, the team is asked to check. The form's IP limit of 8 an hour still applies.
- **Records:** every outcome is written to `data/mail.ndjson` (sent, failed, manual or duplicate). The email links to the PDF rather than attaching it, which keeps it small and less likely to be marked as spam.

**Still manual:** back up the `data/` folder with the server's normal backups.

## UI fixes

These come from the doc "Alepo.com redesign: UI audit" and its "Website checklist (67 rules)" tab. The code is in `build/uifixes.js`, which runs after `leadfixes.js`. Runtime behaviour is in `build/static/js/site.js` and styles in `build/static/css/site-fixes.css`.

- **Focus ring:** indigo on light backgrounds and cyan on dark ones, each at least 3:1 contrast. Dark areas are detected at build time and marked `.on-dark`.
- **Forms:**
  - single column
  - 5.0:1 field borders
  - "(optional)" on optional fields
  - each field checked when the visitor leaves it
- **Contact page:** the customer names sit beside the demo form.
- **Colour:** indigo is kept for links and buttons, and static text uses ink.
- **Library:** the chips filter the list for real (`aria-pressed`) and show an empty state.
- **Interaction states:**
  - hover on menu cards
  - a pressed state on every link and button
  - 60%-white borders on outline buttons over dark backgrounds
  - "Get an estimate" is a secondary button
- **Events:** the "Upcoming" badge comes from the event date, at build time and again in the browser.
- **Design tokens at build time:**
  - type on a 1.25 scale (13, 16, 20, 25, 31, 39, 49, 61)
  - spacing snapped to the 4- and 8-point grid
  - corner radii of 8, 12, 20 or round
  - fixed-size diagrams are left as designed
- **Header:** the desktop menu shows from 1001 px, compact up to 1180 px. The design's 1060 px breakpoint is rewritten in the page style.
- **Phones:**
  - the footer collapses, with a toggle button and 44 px rows
  - tap targets are 44 px
  - the mobile menu marks the current page, dims the page and closes on an outside tap or Esc
  - the page sub-menu fades its edge, tracks the current section and hides while scrolling down
  - the product map and the Services deployment diagram turn into stacked cards
- **Product pages:** a reassurance line under the hero CTA (the page's own demo-band text).
- **Footer:** the head-office address.
- **Content lists:** visited links are styled in Blog, Library and News.
- **Images:** decorative photos get empty alt text.
- **HTTPS:** `FORCE_HTTPS=1` on the server redirects plain HTTP and sends HSTS.

**Still needs content from Alepo:**
- a sales email and social links
- leadership photos
- customer logos and a real console screenshot for the hero
- blog post dates
- the privacy policy address
- the demo length

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

## Visual polish

`build/polish.js` runs after `uifixes.js` and tags the design's building blocks with classes; `build/static/css/site-polish.css` styles them and `site.js` adds the motion. Copy and page order are unchanged.

Direction: professional and quiet. Depth comes from neutral shadows (no coloured glows behind elements), colour is flat brand indigo, and motion is short fades over small distances on one easing curve. Nothing loops or follows the pointer.

| Class | What it gets |
| --- | --- |
| `x-header` | Frosted white header; a soft shadow once the page scrolls |
| `x-hero` | Light first sections: faint violet and cyan wash and a dot grid; photo with a neutral shadow |
| `x-tint`, `x-dark` | Soft lavender bands; dark bands with one faint glow |
| `x-h2` | A short violet rule above section headings (cyan on dark) |
| `x-card` | Neutral shadow; on hover lifts 2 px and the photo eases in 3% |
| `x-statcard` | Results figures on quiet white cards, figures in indigo |
| `x-row` | Product lists stay open rows with hairlines; on hover the row tints and the icon tile turns indigo |
| `x-icon`, `x-row-icon` | Light indigo icon tiles |
| `x-cardgrid` | Runs of 4 or more plain framed rows (offices, events) become a card grid |
| `x-btn` | Flat indigo buttons that darken on hover; arrows move 3 px |
| `x-cta` | The demo band is a flat indigo panel with rounded corners |
| `x-prodrow` | Home product families: the family with the most products (Billing & BSS) is a tall card on the left, the other four sit in two balanced rows beside it; photos absorb spare height so all cards end flush. Below 900 px it becomes a swipe row |
| `x-solgrid` | Home solutions use the same pattern: the first solution (Fibre and cable ISPs) is the tall card, the other four sit in two rows beside it, photos absorb spare height; a swipe row below 900 px |

### Header menus

Before, each menu opened as a full-width sheet 450 to 754 px tall (most of a laptop screen). Now:

- Menus open as a floating card aligned to the page edges, with compact rows (32 px icons, 15 px titles, 13 px descriptions); the page behind dims slightly.
- **Products** has three parts: the five families on the left, the products of the family you point at (or tab to) in the middle, the promo and "All products" on the right. Billing & BSS keeps its four sub-groups as a 2 x 2 block. Keyboard order: family, its products, next family. Without JavaScript the first family shows and each family name links to its page.
- **Solutions** works the same way: "By operator" and "By need" on the left (buttons, as these headings have no page of their own), the chosen group's items in two columns in the middle, the customer story on the right.
- Heights at 1440 x 900: Products 349 to 399 px, Solutions 298 to 320, Services 356, Resources 342, Company 356.

### Customer names strip

The label is a small uppercase eyebrow with a divider; the seven names are set as bold wordmarks spread evenly across the row (wrapping on phones). Real customer logos, with permission, would be the next step.

### Footer

`polish.js` rebuilds the footer from the same links and form (the only new words are the "Offices" heading and the back-to-top label):
brand block (logo, the one-line company description already used under "Why Alepo", a demo button, support numbers, head office) beside the newsletter card;
then six link columns, a second row with Services, Resources, Company and office chips; a bottom bar with legal links and a back-to-top button; and a large faded wordmark.
On phones the columns keep their open/close buttons.

### Motion

| Where | What moves |
| --- | --- |
| First screen | Text settles in (12 px, 0.7 s, 70 ms apart), then the picture fades in. CSS only |
| Below the first screen | Headings, cards, rows and photos fade up 16 px as they scroll in, at most 4 in a short sequence |
| Hover | Colour and shadow changes, 0.2 to 0.35 s; cards lift 2 px |
| Menus | The mega menu fades and settles 6 px; the phone menu fades |

Content is only hidden for the reveal when JavaScript is running, motion is allowed and the item starts below the screen. When scrolling stops, anything at or above the screen is shown at once, and printing shows everything. With reduced motion turned on, nothing moves.

Checked with axe (WCAG 2.2 AA and best practice) on 8 page types at 1440 px and 390 px: no violations.
