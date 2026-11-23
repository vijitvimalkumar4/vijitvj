# Alepo.com blueprint: site-wide rules (verbatim extract)

Source: Alepo_website_blueprint_48_pages_final.html (Final version, 21 November 2026). Text below is copied verbatim from the blueprint; section headings are the blueprint's own. Section 4.1 page table, Sections 10 to 14 page specs (see blueprint.json), and Sections 1-3, 7, 8, 17-20 and the Section 16 action table are omitted.

## 4. Site map: all 48 pages (URL rule)

Every page also has a Spanish version at /es/ plus the same path. "Confirm" = check the old URL in the pre-launch crawl. "Keep" = the URL already exists with links or rankings.

## 4. Site map (continued)

**AI Sales Assistant (/solutions/ai-sales-assistant/) and AI CCaaS (/solutions/ai-ccaas-assistant/)** are not in the 21-product menu. If they are still sold, each gets an H2 section with an anchor on the AI for Telecom page. If not, each redirects with a 301 to the closest page.

### 4.2 Existing URLs that carry links or rankings (protect in the 301 map)

Ahrefs Site Explorer, 20 November 2026.

| URL today | Visits | Top keyword (position) | Referring domains | Action |
|---|---|---|---|---|
| / | 400 | alepo technologies (#2) | 1,042 | Keep |
| /company/careers/ | 39 | alepo technologies mumbai (#7) | 3 | Keep |
| /company/about/ | 35 | alepo technologies (#2) | 14 | Keep |
| /blog/tacacs-port-numbers-and-protocol-basics/ | 18 | tacacs port number (#7) | 0 | Keep; link to TACACS+ |
| /top-5-benefits-of-virtualized-5g-ran-vran/ | 17 | virtualized ran (#2) | 1 | Keep; article template |
| /solutions/digital-bss/ | 15 | digital bss (#5) | 20 | 301 to /products/digital-bss/ |
| /blog/what-is-online-charging-system-ocs/ | 12 | 5g ocs (#5) | 5 | Keep; link to OCS |
| /blog/what-is-an-aaa-server-and-why-does-every-csp-need-one/ | 7 | aaa server (#6) | 0 | Keep; link to AAA |
| /contact-us/ | 6 | brand | 6 | Keep (Contact page) |
| /company/leadership/ | 6 | brand | 1 | Keep |
| /solutions/aaa-server/ | 5 | **aaa radius server (#1)** | 22 | 301 to /products/aaa-server/; keep core copy and FAQ |
| /how-policy-control-and-charging-network-functions-harness-5g-potential/ | 4 | pcrf in 5g (#5) | 2 | Keep; link to Policy Control |
| /customers/ | 3 | brand | 1 | Keep |
| /solutions/bss-now/ | 3 | brand (#1) | 4 | 301 to BSS in a Box if same offer |
| /blog/radius-coa-change-of-authorization/ | 0 | radius coa (#1) | 0 | Keep; link to AAA |
| /blog/what-is-tacacs-the-complete-guide-for-network-teams/ | 0 | tacacs+ questions (#5) | 0 | Refresh as the TACACS+ explainer |
| /solutions/wifi-monetization/ · /solutions/ai-sales-assistant/ | 1 each | brand | 2 and 0 | 301 by content match |
| /company · /solutions (no slash) | 0 | brand | 0 | 301 to /company/about/ and /solutions/ |

## 5. Navigation (board 02)

### 5.1 Header
- **Top bar:** the next dated event or the latest news. Events disappear automatically once they end.
- **Utility bar:** Customer support · Partners · Careers · Contact · EN | ES. The language switch opens the same page in the other language, not the Spanish home page.
- **Main bar:** Logo (links to Home) · Products · Solutions · Services · Resources · Company · **Request a demo**.
- **Build rules:** plain HTML links (Google generally crawls only <a href> links), clickable group headings, open on click and hover, close with Esc, visible focus, full keyboard access.

### 5.5 Mobile menu and footer
- **Mobile:** one accordion per top item, group headings kept as section titles (the draft flattens them), and a sticky "Request a demo" bar on product pages.
- **Footer columns:** Network Access & AAA (4) · Billing & BSS (9) · Provisioning & Devices (2) · Customer Care & Channels (4) · AI for Telecom (hub plus 2) · Solutions (5) · Services (4) · Resources (4) · Company (8). Labels are the same as the menu; the draft footer uses brand names.
- **Also in the footer:** newsletter, GTAC numbers, one confirmed office list, and a legal row: Security · Privacy policy · Cookie settings · Accessibility statement (new) · Sitemap · © 2026 Alepo · EN | ES.

## 6. Rules for every page

### 6.1 SEO rules
- **Headings and titles:** one H1 per page with the primary keyword; a category label above it as styled text, not a heading. Title tags 60 characters or fewer, ending " | Alepo", no commas, aligned with the H1 (Google builds the search title from the title tag and main heading).
- **Meta description:** 155 characters or fewer, unique, numbers only from the register.
- **Definition sentence** in the first 100 words: what it is and who it is for.
- **Keywords:** one primary per URL, and only terms whose search results serve telecom buyers. Check the results page before adopting any new keyword.
- **Markup and language tags:** breadcrumb with BreadcrumbList on every page except Home; self-referencing canonical; hreflang en, es and x-default.
- **Internal links:** each product links its category, 2 to 4 related products, the Solutions pages it serves and 2 to 4 explainers. Every explainer links back to its product.
- **Content in HTML:** specifications and Q&A as visible text, not locked in PDFs or loaded on click. Descriptive image names, alt text, WebP or AVIF, fixed dimensions.
- **URLs:** lowercase, hyphens, trailing slash, no dates in product or solution URLs. Keep established URLs.

### 6.2 Keyword ownership (one search, one page)

| Page | Owns | Must not target |
|---|---|---|
| Home | alepo, alepo technologies | product terms |
| 03 Products hub | telecom software | product terms |
| 06 AI for Telecom | ai in telecom · ai for telecom · ES "IA en telecomunicaciones" | ai virtual agent, ai agent assist |
| 44 Network Access & AAA | AAA and RADIUS overview (no single head term) | aaa server, aaa radius server, radius server, tacacs+ |
| 45 Billing & BSS | telecom billing software · billing and revenue management · telecom bss · oss bss | digital bss |
| 46 Provisioning & Devices | service delivery overview | telecom provisioning, tr-069 device management |
| 47 Customer Care & Channels | customer experience management telecom | telecom crm, self service portal software |
| 18 Fibre and cable ISPs | isp billing software · isp software · isp management software | tr-069 |
| 19 Mobile operators | BSS for mobile operators, prepaid and postpaid long-tail queries | telecom billing software |
| 20 MVNOs and MVNEs | mvne · mvno platform · mvno software · ES "OMV", "operador móvil virtual", "MVNO" | mvno billing platform |
| 21 Wi-Fi and venues | captive portal software · carrier wifi · ES "portal cautivo", "hotspot wifi" | wifi offload |
| 22 Enterprise and government | cisco acs replacement · enterprise device administration | tacacs+, tacacs server |
| Product pages | the primary keyword in each spec (Section 13) | each other's terms |
| Blog posts | informational terms: tr-069, tr069, cwmp, what is TACACS+, pcrf vs pcf, oss vs bss | product commercial terms |

### 6.3 Copy rules (Jonathan's, every page and theme)
- **Headings** are simple and basic; only the hero may carry a crafted line.
- **No titles that read "The product does this, instead of doing that" or "the product does this and that".**
- **No commas in any title** (H1, H2, H3, title tag, menu label). Product names with "and" are fine as names.
- **Benefits** go in a styled box or quote, never in a heading.
- **First sentences** of every section and answer answer directly.
- **Numbers** only from the register; no AI percentages unless registered.
- **Brand name** in the first line of copy and in the menu descriptor.
- **Style:** sentence-case headings (product names keep capitals), standards named precisely (RFC 8907, TR-369 USP Controller, 3GPP CHF), operator vocabulary, short active sentences, Oxford spelling, dates as "20 November 2026", "Wi-Fi" and "TACACS+".

### 6.4 Claims register

Every number, deployment claim (SaaS, multitenant, Kubernetes), AI capability and customer result comes from one register: approved value, source, owner, last check date, and the pages and data sheets that use it. Product management signs off every H1, AI card and specification. Section 17 lists the claims found in the draft.

### 6.5 AI section rule (every product page)
- **Heading:** H2 "AI in [Product name]" (#ai).
- **Cards:** 2 to 4, each with an H3 covering what it does · who uses it · what data it reads · how a person stays in control · status (Live, Pilot or Roadmap).
- **Illustrations:** keep the agent and AI Assist console illustrations, labelled "Illustration. Names and numbers are invented."
- **No shared paragraphs** across pages. Links to the AI hub and both AI products.
- **If a product has no native AI,** describe how it works with AI Virtual Agent or AI Agent Assist instead.

### 6.6 Bilingual rules
- **Launch and URLs:** EN and ES go live together; /es/ mirrors English paths (translated slugs later is an open decision). Human-reviewed translation for every page.
- **Spanish business terms have demand.** Use them in Spanish H1s, titles and metas where each page spec shows them: OMV, MVNO, portal cautivo, hotspot wifi, portal de autoservicio or autogestión, IA en telecomunicaciones, agente virtual IA, software de cobranza, cobranza automatizada, sistema de recargas, servidor RADIUS, TACACS.
- **Spanish versions of standards terms have almost no demand** (servidor aaa, bss telecomunicaciones, aseguramiento de ingresos, aprovisionamiento de servicios, crm telecomunicaciones all score 0 to 10). Keep the English standard term in the Spanish H1, for example "Servidor AAA y RADIUS para operadores".
- **LATAM proof first:** Wind Telecom (Dominican Republic), Celsia and ETB (Colombia), the Central American ISP, Digicel, WOM. Spanish data sheets use the same register numbers.
- **Portuguese for Brazil is the next phase.** Brazil already searches English standards terms ("mvne" 350, "tr-069" 200).

### 6.7 Accessibility and performance
- **WCAG 2.2 AA** (EN 301 549 V4.1.1, 2 September 2026, moves the EU baseline to 2.2): keyboard access, visible focus, 4.5:1 text contrast, alt text, captions, 24 × 24 px targets, no meaning by colour alone, reduced motion for the Direction D animation.
- **Core Web Vitals "good" at the 75th percentile:** LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less.
- **Delivery:** a CDN with points of presence in LATAM, Africa and India, plus subset fonts. India is the second search market, so mobile speed there matters.

### 6.8 Privacy and trust
- **Consent:** real accept and reject options (GDPR); check LGPD and DPDP with legal; no tracking before consent; consent text on every form.
- **Security:** Security page linked from every product page; security.txt and a vulnerability disclosure policy; certifications only if held and current.

## 9. Page templates

Word counts are guidance for completeness, not a ranking target. Length should follow the questions buyers ask; the pages that rank in this market are technically deep (Radiator, Aradial).

| Template | Pages | Words |
|---|---|---|
| Product Tier A | 23, 25, 29, 30, 31, 36, 39, 42, 43 | 1,500 to 2,200 |
| Product Tier B | 24, 26, 27, 28, 33, 34, 37, 41 | 1,100 to 1,600 |
| Product Tier C | 32, 35, 38, 40 | 700 to 1,000 |
| Category | 06, 44 to 47 | 900 to 1,300 |
| Solution | 18 to 22 | 900 to 1,300 |
| Home | 01 | 600 to 900 |
| Hubs | 03, 04, 07, 13, 14, 15, 16 | 300 to 600, plus cards |
| Company and info | 05, 08 to 12, 17 | 300 to 700 (Services 800 to 1,200) |
| Blog explainer | 48 | 1,500 to 2,500 |
| News item · case study | outside the 48 | 150 to 400 · 600 to 1,000 |

### 9.1 Product page (pages 23 to 43)

| # | Block | Heading (anchor) | What goes in | Tiers |
|---|---|---|---|---|
| 0 | Breadcrumb | – | Home › Products › [Category] › [Product] | A B C |
| 1 | Hero | **H1** | Category label (styled text) · H1 · one-sentence definition · optional crafted line · Request a demo and Download data sheet · UI or architecture visual · trust strip of 3 to 5 logos or one proof line | A B C |
| 2 | Benefits box | – | 3 outcomes with register proof, or one short quote | A B C |
| 3 | Platform strip | – | Six steps with this product highlighted, each linking its category | A B C |
| 4 | Anchor nav | – | Overview · How it works · Features · AI · Specifications · Customers · Resources · Questions | A B C |
| 5 | Overview | Overview (#overview) | Two short paragraphs (problem, what it does, who uses it) plus the facts strip; keep the draft's "Also known as" | A B C |
| 6 | How it works | How it works (#how-it-works) | Diagram, 3 to 5 numbered steps, named interfaces | A B C |
| 7 | Features | Features (#features) | 6 to 9 H3 cards (4 to 6 for Tier C). The draft capability H2s become H3s and keep their copy. | A B C |
| 8 | AI | AI in [Product] (#ai) | Rule 6.5 | A B C |
| 9 | Use cases | Use cases (#use-cases) | 3 to 5 by operator type, linking Solutions | A B |
| 10 | Integrations | Integrations (#integrations) | Alepo products (linked), third-party systems, APIs | A B |
| 11 | Deployment | Deployment (#deployment) | True options only, a "Replace…" H3 where relevant, project steps (durations only if approved) | A B |
| 12 | Specifications | Specifications (#specifications) | HTML table: standards and RFCs, interfaces, scale (register), availability design, security, platforms, languages. Mirrors the data sheet. | A B C |
| 13 | Customers | Customers (#customers) | Case study card, named quote with headshot and role, logo row; anonymised when names can't be shared | A B (C if available) |
| 14 | Pricing | Pricing (#pricing) | How pricing works: subscription (perpetual licences are rare, per the Services page), cost drivers, what is included, "Get an estimate". No figures. | A (B optional) |
| 15 | Resources | Resources (#resources) | Dated data sheet (EN and ES), white paper, 2 to 4 explainers, demo video, tagged news | A B C |
| 16 | Questions | Questions and answers (#faq) | 6 to 8 (A), 4 to 5 (B), 3 (C). The first sentence of each answer answers directly. | A B C |
| 17 | Related products | Related products | 3 to 4 cards with descriptor lines | A B C |
| 18 | Contact | Request a demo (#demo) | Inline form (product prefilled), privacy note, Talk to an expert, Submit an RFP | A B C |
| + | Sticky CTA | – | Shown once the hero scrolls away; bottom bar on mobile | A B C |
- **Tier C:** blocks 0 to 8, 12, 15, 16, 17 and 18 (plus 13 if proof exists).
- **Launch minimum for every product:** URL, H1, definition, How it works, Features, AI, Specifications, Questions, form and Spanish version.

### 9.2 Category page (06, 44 to 47)

Breadcrumb → hero (H1, definition, Request a demo) → product grid by sub-group (label, brand line, descriptor, "for" line) → How the products work together (diagram carrying the tagline) → AI in [category] → Solutions by operator type → featured case study → Resources (2 to 4 explainers) → Questions (4 to 5) → form.

### 9.3 Solution page (18 to 22)

Keep the draft order with these changes: breadcrumb with Home · an Overview that adds information instead of repeating the hero · 3 to 4 job sections (H2s, each linking a product) · AI section titled "AI for [segment]" · Where to start (3 cards) · Often added trimmed from 14 to 16 links to 4 to 6 · proof matched to the segment · Questions (3 to 4) · inline form.

### 9.4 Hubs and company pages
- **Hubs (03, 04, 07, 13, 14, 15, 16):** breadcrumb, H1 with one sentence, link-based filters, cards with type, date and language, plain-link pagination (/page/2/, not "load more"), and the page's own CTA.
- **Company and info (05, 08 to 12, 17):** the page's own action (Careers "See open roles", Partners "Apply", Security "Request security documents"). "Request a demo" only where a buyer would expect it.

### Also needed at launch (outside the 48)

| Template | URL | Notes |
|---|---|---|
| Case study page | /customers/[slug]/ | Customer, problem, result, products, quote, PDF |
| News item | /news/[slug]/ | Spec under page 13; NewsArticle markup |
| Job posting | /company/careers/[role]/ | JobPosting markup |
| Thank-you page | /contact-us/thank-you/ | Conversion tracking; offer the data sheet |
| Privacy policy · cookie settings · accessibility statement · HTML sitemap · 404 | /privacy/ · /accessibility/ · /sitemap/ | Footer links; the 404 links to top tasks |
| Optional paid landing variant | /lp/[product]/ | Same blocks, reduced menu, noindex; test before switching paid traffic |

## 15. Technical SEO, structured data, campaigns and launch QA

### 15.1 Technical SEO
- **Redirects:** crawl the live site and export every URL with traffic, links and rankings; one-to-one 301 map with no chains and no redirects to the home page; keep the URLs in Section 4.2; update the menu, footer and every internal link.
- **Jonathan's four crawl basics:** 301 every ?p= address and remove the shortlink tag · one canonical, status-200 URL per page in the sitemap · crawlable blog pagination · llms.txt optional (Google has said it won't use it, but it is cheap to add).
- **Markup:** BreadcrumbList on inner pages, Organization on Home, BlogPosting, NewsArticle, JobPosting, Event and VideoObject where they apply. FAQ markup is optional (Google stopped showing FAQ rich results in May 2026); visible Q&A still matters for buyers and AI answers.
- **Language and crawlers:** hreflang en, es and x-default plus self-canonicals; allow the main search and AI crawlers unless legal says otherwise; semantic HTML with no essential text behind a click.
- **Measurement:** Search Console and Bing Webmaster Tools with the new sitemap on launch day; baseline from the Ahrefs snapshot (20 November 2026), a Search Console export and GA4 conversions by URL.

### 15.2 Structured data and hreflang code

JSON-LD in the page head. Replace values in [brackets]. Never add ratings or prices that are not real.

**Organization (Home only)**

```
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Alepo Technologies",
  "url": "https://alepo.com/",
  "logo": "https://alepo.com/[path-to-logo].png",
  "sameAs": ["[LinkedIn URL]", "[YouTube URL]", "[X URL]"],
  "address": {"@type": "PostalAddress", "streetAddress": "1606 Headway Circle, Suite #9137", "addressLocality": "Austin", "addressRegion": "TX", "postalCode": "78754", "addressCountry": "US"},
  "contactPoint": [
    {"@type": "ContactPoint", "telephone": "+1-737-313-3952", "contactType": "technical support", "areaServed": "US", "availableLanguage": ["en", "es"]},
    {"@type": "ContactPoint", "telephone": "+91-22-61085013", "contactType": "technical support", "areaServed": "IN", "availableLanguage": "en"}
  ]
}
```

**BreadcrumbList (example: AAA Server)**

```
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://alepo.com/"},
    {"@type": "ListItem", "position": 2, "name": "Products", "item": "https://alepo.com/products/"},
    {"@type": "ListItem", "position": 3, "name": "Network Access & AAA", "item": "https://alepo.com/products/network-access-aaa/"},
    {"@type": "ListItem", "position": 4, "name": "AAA Server"}
  ]
}
```

**BlogPosting (every article)**

```
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "[Post title]",
  "datePublished": "[2026-11-25]",
  "dateModified": "[2026-11-25]",
  "author": {"@type": "Person", "name": "[Author name]", "jobTitle": "[Role]"},
  "publisher": {"@type": "Organization", "name": "Alepo Technologies", "logo": {"@type": "ImageObject", "url": "https://alepo.com/[path-to-logo].png"}},
  "image": "https://alepo.com/[path-to-hero-image].webp",
  "mainEntityOfPage": "https://alepo.com/blog/[slug]/",
  "inLanguage": "en"
}
```

**NewsArticle (every news item)**

```
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "[Headline]",
  "datePublished": "[true date of the event or announcement]",
  "author": {"@type": "Organization", "name": "Alepo Technologies"},
  "publisher": {"@type": "Organization", "name": "Alepo Technologies"},
  "mainEntityOfPage": "https://alepo.com/news/[slug]/"
}
```

**JobPosting (every role page)**

```
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Senior Engineer, Technical Support",
  "description": "[Full role description in HTML]",
  "datePosted": "[2026-11-25]",
  "validThrough": "[2027-01-31]",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {"@type": "Organization", "name": "Alepo Technologies", "sameAs": "https://alepo.com/"},
  "jobLocation": {"@type": "Place", "address": {"@type": "PostalAddress", "addressLocality": "Navi Mumbai", "addressRegion": "MH", "addressCountry": "IN"}}
}
```

For remote roles, add "jobLocationType": "TELECOMMUTE" and "applicantLocationRequirements" naming the country.

**FAQPage (optional)**

```
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "What does an AAA server do?",
     "acceptedAnswer": {"@type": "Answer", "text": "[The visible answer, word for word]"}}
  ]
}
```

**hreflang and canonical (every page)**

```
<link rel="alternate" hreflang="en" href="https://alepo.com/products/aaa-server/" />
<link rel="alternate" hreflang="es" href="https://alepo.com/es/products/aaa-server/" />
<link rel="alternate" hreflang="x-default" href="https://alepo.com/products/aaa-server/" />
<link rel="canonical" href="https://alepo.com/products/aaa-server/" />
```

The Spanish page carries the same three alternate tags and its own canonical; every pair must point at each other.

### 15.3 Campaign readiness

| Campaign | Landing page | Paid terms (US CPC) | Negative keywords |
|---|---|---|---|
| Network access and security | AAA; TACACS+ | aaa radius server $13 · tacacs+ $6 · tacacs server $6 | port, cisco packet tracer, tutorial |
| ISP growth | Fibre and cable ISPs | isp billing software $11 (US and India) · isp management software $3 | free, open source |
| MVNO launch | BSS in a Box; MVNOs | mvno billing $7 · mvno platform | list of mvnos, best mvno plan |
| Billing and revenue | Billing & BSS; Collections; Mediation | telecom billing software $20 · telecom revenue assurance $4.50 | stripe, saas, subscription, small business |
| Policy and charging | Policy Control; OCS | 5g pcf $4.50 · pcrf telecom $8 | **charity, palestine, gaza, donate, relief fund** |
| Customer care | CRM; Self-Care Portal | telecom crm $25 · self service portal software | login, sign in, utility, county |
| AI for telecom | AI hub; AI Virtual Agent; AI Agent Assist | ai in telecom $4.50 · ai customer service telecom · ai noc $9 | zoom, ringcentral, free, chatgpt |
| Spanish LATAM | /es/ pages | portal de autoservicio $7 · omv · portal cautivo · cobranza automatizada $1.30 | gratis, empleo, OMV (Austria) |
- **Message match:** the ad headline matches the H1; segment ads can land on anchors such as #use-cases.
- **Tracked events (after consent):** demo_submit · rfp_submit · datasheet_download · video_play · cta_click · chat_start · 75% scroll. Hidden form fields store UTM source, medium, campaign and content, plus the product.
- **Campaign kit per page (CMS fields):** Open Graph image 1200 × 630, social description, 2 alternative headlines and 1 content offer.

### 15.4 Launch-day QA

Redirects in one hop · no broken links · markup passes the Rich Results Test · hreflang pairs correct · Core Web Vitals pass on mobile · keyboard and contrast checks · forms submit and fire events · Spanish live · data sheets open · no past events shown as upcoming.

## 16. Link-building plan

- **Do not:** buy links, swap links, use private blog networks, stuff keywords into anchors, or make self-promotional Wikipedia edits.
- **Measure:** referring domains to product and category pages at days 30, 60 and 90. Suggested target: at least 5 for every Tier A page by day 90.
