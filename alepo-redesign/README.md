# Alepo.com redesign: combined direction

Static build of the Design artifact "Alepo.com redesign: combined direction"
(https://claude.ai/artifact/XQEPUEjULJxbc4r5nnbDCu). Every page from the design is here
in English and Spanish, with the same markup, styles, copy and images.

## Run it

```bash
npx http-server . -p 8080 -c-1
```

Then open http://localhost:8080. Any static host works. No JavaScript build step and no runtime.

## Pages

| Design board | File |
| --- | --- |
| Home | `index.html` |
| Navigation | `menu.html` |
| Products, Solutions, Services, AI | `products.html`, `solutions.html`, `services.html`, `ai.html` |
| Customers, About, Leadership, Partners, Security, Careers | `customers.html`, `about.html`, `leadership.html`, `partners.html`, `security.html`, `careers.html` |
| News and events, Resources, Blog, Library, Contact | `news.html`, `resources.html`, `blog.html`, `library.html`, `contact.html` |
| Solution pages (5) | `s-ftth.html`, `s-mno.html`, `s-mvno.html`, `s-wifi.html`, `s-ent.html` |
| Product pages (21) | `p-*.html` (for example `p-aaa.html`, `p-bss.html`, `p-aica.html`) |

Spanish versions live in `es/` with the same file names. The EN and ES buttons in the
header switch between the two copies of the current page.

Images are in `assets/img/`, named by their asset ID in the design. Photos are from Unsplash:
Jesse Collins, Peter Nguyen, Jimmy Conover, Mario Caruso, Luke Porter, Cameron Cox, Taylor Vick,
Denny Müller, Jonas Leupe, BaljkanN4, Mapbox, Headway, Mina Rad, Mario Spencer, Valentin Lacoste,
Marc Zeman, Mudit Agarwal, Vitaly Gariev, Andreea Avramescu, CardMapr.nl, Matthias Cooper,
imsogabriel stock, Jonathan Roger, Zulfugar Karimov, Julio Lopez, Albert Stoynov, Tyler,
Charanjeet Dhiman, Arlington Research.

## How it was produced and checked

Each design page was rendered in Chromium with the design's own runtime, once per language,
and the rendered DOM was saved as plain HTML. The only changes from the render are:

- runtime scripts and editor-only attributes removed
- links between design pages rewritten from `h-*.dc.html` to the file names above
- the EN/ES buttons navigate to the other language's file instead of switching state in place

Every page was then screenshotted from the original and from this build and compared pixel by
pixel: all 86 pages (43 EN + 43 ES) match exactly at 1440px wide, and all 43 English pages
match exactly at 390px wide.
