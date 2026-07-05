# Frost — Multi-Page Cleaning Business Website

## Files
- `index.html` — homepage (intro animation, hero, services, testimonials, CTA)
- `services.html` — pricing tiers page
- `booking.html` — instant quote calculator + booking form
- `styles.css` — the entire design system
- `script.js` — all interactivity (shared across pages)
- `config.js` — **the only file you edit to rebrand for a new client**

## Deploy on Vercel (free)
1. Create a new GitHub repo
2. Unzip this bundle, open the folder, select all files **inside** it (not the folder itself), drag them into GitHub's upload box, commit
3. Vercel → New Project → import that repo → Framework: Other → Deploy
4. Live URL in under a minute

## Connect the booking form (required before going live for real)
1. Create a free form at formspree.io
2. Paste the endpoint URL into `config.js` as `formEndpoint`
3. Submit a real test booking to confirm it arrives

## Rebrand for a new client
Edit `config.js` only:
- `business` — name, phone, email, area, hours
- `hero` — headline words, eyebrow, subhead
- `services` — bento grid content (mark 1-2 as `big: true` for visual variety)
- `pricing` — base price, per-room rates, cleaning types (this also drives the services page pricing tiers automatically)
- `testimonials`

To change the color, open `styles.css` and edit `--blue` and `--blue-deep` at the top — everything else derives from those two.

## Why this is worth $800+ (positioning notes for your pitch)
This isn't a template-store theme — point these out when selling:
- **Multi-page structure** (Home / Services / Booking) — most cheap templates are a single scrolling page; a real site with separate pages reads as more credible and is better for SEO (each page can rank for different searches)
- **A custom opening animation** unique to the cleaning concept — no other cleaner in their area will have this
- **A working instant-quote calculator connected to a real booking form** — most competitors' sites just have a static contact form
- **One-file rebranding** — you can demonstrate turning it into a different business in front of them live, which is a strong selling moment
- **Cursor-reactive glass and scroll animations** — visibly more polished than a $50 Wix template, easy to show side-by-side

## Pre-launch checklist
- [ ] `formEndpoint` set and tested
- [ ] Business info updated in `config.js`
- [ ] Brand color updated in `styles.css` if needed
- [ ] Checked on an actual phone
- [ ] Custom domain connected (optional upsell)
