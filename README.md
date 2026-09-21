# American Stone LS — website redesign

A static, dependency-free site (plain HTML, CSS and JavaScript). No build step.

## Pages
- `index.html` — Home
- `about.html` — Our Story (Luciano & Alex Sansalone, four generations)
- `services.html` — Services + FAQ
- `work.html` — Portfolio with filters, case studies, before/after compare, reels
- `contact.html` — Estimate form, phone lines, service areas, map

## Assets
- `assets/css/styles.css` — design system (colors, type, components)
- `assets/js/main.js` — loader, smooth scroll, reveals, filters, lightbox, embeds, form
- `assets/img/work` — portfolio photos (from the current site and blog)
- `assets/img/story` — founder photos (from the company Instagram)
- `assets/img/covers` — Instagram reel cover frames used as link cards
- `site images/` — the original files you supplied (untouched)

Libraries load from CDN: GSAP 3 + ScrollTrigger (animation), Lenis (smooth scroll),
Google Fonts (Cormorant Garamond, Manrope, Caveat). If a CDN fails, the site still works.

## Preview locally
Open `index.html` in a browser, or run a tiny server so the map, fonts and
Instagram embeds behave like production:

    python3 -m http.server 8080

then visit http://localhost:8080

## Deploy
Drag the whole folder onto Netlify (or connect it to Vercel / any static host).
The contact form is already marked up for Netlify Forms (`data-netlify="true"`).
On any other host, the form falls back to opening the visitor's email app
with the request pre-filled and addressed to AmericanStoneLS@gmail.com.

## Swapping content
- Photos: replace files in `assets/img/...` keeping the same file names, or edit the `src` in the HTML.
- Instagram reels: each embed is a `div.ig-slot` with a `data-permalink` — paste any public post/reel URL.
- YouTube: each `div.yt` has a `data-id` — paste the video id.
- Phone numbers, address and email appear in the header menu, contact page and footer of every page.
