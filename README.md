# Frost — Multi-Page Cleaning Business Website

## Files
- `index.html` — homepage (intro animation, hero, services, before/after gallery, testimonials, guarantee, FAQ, CTA)
- `services.html` — pricing tiers page
- `booking.html` — instant quote calculator + booking form
- `admin.html` / `admin.js` / `admin.css` — **no-code editor** for the client (see below)
- `styles.css` — the entire design system
- `script.js` — all interactivity (shared across pages)
- `config.js` — **the only file the site itself reads to rebrand**, and the file the admin panel edits for you

## Deploy on Vercel (free)
1. Create a new GitHub repo
2. Unzip this bundle, open the folder, select all files **inside** it (not the folder itself), drag them into GitHub's upload box, commit
3. Vercel → New Project → import that repo → Framework: Other → Deploy
4. Live URL in under a minute

## Connect the booking form (required before going live for real)
1. Create a free form at formspree.io
2. Paste the endpoint URL into `config.js` as `formEndpoint` (or set it from inside the admin panel's "Booking form" section)
3. Submit a real test booking to confirm it arrives

---

## The client admin panel (`/admin.html`)

This is the "no-code editor" — it's what makes this sellable as a real product instead of a one-off site. There's no database or login server behind this (it's a static site on GitHub/Vercel), so the panel works like this instead:

- Client opens `yoursite.com/admin.html`, sets a password the first time, and optionally connects it to their GitHub repo with a personal access token.
- They edit business info, theme/colors, hero copy, services, pricing, gallery, testimonials, FAQ — with a **live preview** that updates as they type, built from the real `index.html`/`services.html`/`booking.html`.
- **Save & Publish** pushes the updated `config.js` straight to their GitHub repo via the GitHub API, which triggers Vercel's auto-redeploy. Live again in under a minute, no code touched.
- If they skip the GitHub connection, Save & Publish just downloads `config.js` for them to drag into GitHub manually instead — still no code, one extra step.

**Setting it up per client (each client is their own repo):**
1. When you resell, clone this repo fresh for each client and deploy it as its own Vercel project.
2. On GitHub, create the client a **fine-grained personal access token** scoped to *only that one repo*, with **Contents: Read and write** permission — nothing else. (github.com → Settings → Developer settings → Fine-grained tokens)
3. Give the client the admin URL, their password (they set it), and that token to paste in during setup.

**Security notes, plainly:**
- The password is a convenience lock to keep casual visitors out — it is not a full authentication system with multiple accounts or server-side enforcement.
- The GitHub token is stored only in that client's browser (localStorage) and is sent only to GitHub's API — never to any third party, never to you. But it does live in their browser, so this fits a single trusted client per site, not a public multi-user login system.
- This is standard practice for small no-code tools built without a backend; if a client later needs real multi-user roles and audit logs, that's a different, bigger build (a real backend + database).

---

## Performance
Already in place: deferred scripts (non-render-blocking), font preconnects, `loading="lazy"` on gallery/before-after photos once real URLs are added, and a lean font/animation footprint. Since there are no shipped raster images, the biggest lever left is **whatever photos you add** — compress them (WebP, under ~200KB each) before pasting URLs into the gallery or admin panel.

## Design
The glass system got a real 3D upgrade: the service cards and testimonial cards now tilt in actual 3D perspective as the cursor moves over them (`.tilt-3d` in `styles.css` / `initTilt3D()` in `script.js`), layered on top of the existing cursor-reactive glass sheen. It respects `prefers-reduced-motion`.

---

## Rebrand for a new client — either through the admin panel above, or directly in `config.js` (no CSS editing needed either way)
1. **Color** — change `theme: \"frost\"` to one of the presets at the top of `config.js`:
   `frost` (blue), `emerald` (green/eco), `charcoalGold` (premium), `coral` (friendly), `slate` (commercial).
   The whole site — nav, buttons, glow, glass tint, price highlights — re-themes instantly.
   Need an exact brand color instead of a preset? Fill in `colors: { blue, blueDeep, blueBright }` and it overrides the theme.
2. **Business info** — `business` (name, phone, email, area, hours)
   - **Logo** — set `business.logoUrl` to an image path (e.g. `\"images/logo.png\"`) or a hosted URL to replace the default colored dot in the nav with a real logo. Leave it as `\"\"` to keep the dot + business name mark.
3. **Hero** — headline words, eyebrow, subhead
4. **Trust badges** — `trustBadges` array feeds both the scrolling marquee and the badge row under the hero
5. **Guarantee** — `guarantee.title` / `guarantee.text`
6. **Service areas** — `serviceAreas` array renders as chips (footer trust section)
7. **Services** — bento grid content (mark 1–2 as `big: true` for visual variety)
8. **Gallery** — `gallery` array; each item is a draggable before/after slider. Leave `before`/`after` as `null` to show a clearly-labeled placeholder frame, or point them at real photo paths (e.g. `"images/kitchen-after.jpg"`) once you have them
9. **FAQ** — `faq` array of question/answer pairs, shown as an accordion
10. **Pricing** — base price, per-room rates, cleaning types (this also drives the services page pricing tiers automatically)
11. **Testimonials**

Rebranding for a new city or client is a config-only edit — swap the values, pick a theme, done. Selling to a second cleaner, e.g. a Bristol-based client after a Versailles one: duplicate the repo, edit `config.js`, redeploy.

## Why this is worth $800+ (positioning notes for your pitch)
This isn't a template-store theme — point these out when selling:
- **Multi-page structure** (Home / Services / Booking) — most cheap templates are a single scrolling page; a real site with separate pages reads as more credible and is better for SEO (each page can rank for different searches)
- **A custom, deliberately-paced opening animation** unique to the cleaning concept, with a skip control so it never annoys a returning visitor
- **A working instant-quote calculator connected to a real booking form** — most competitors' sites just have a static contact form
- **Draggable before/after photo comparisons** — most competitors just post static photos
- **One-file rebranding with instant color theming** — you can demonstrate turning it into a different business, in a different color, in front of them live
- **Cursor-reactive, layered "real glass" panels and scroll animations** — visibly more polished than a $50 Wix template
- **A sticky mobile call/book bar** — most competitors lose mobile visitors who don't want to scroll to find a phone number

## Pre-launch checklist
- [ ] `formEndpoint` set and tested
- [ ] Business info updated in `config.js`
- [ ] Theme/colors set in `config.js`
- [ ] Real before/after photos added to `gallery` (or left as placeholders)
- [ ] Checked on an actual phone
- [ ] Custom domain connected (optional upsell)
