/* ============================================================
   FROST — brand & theme config.
   This is the ONLY file most rebrands need. No CSS editing required.
   Last updated via Site Editor: 2026-07-06T14:02:02.659Z
   ============================================================ */

/* ---------- Pick a theme, or override colors completely below ---------- */
const THEMES = {
  frost:        { blue: "#2F6FED", blueDeep: "#0F3D91", blueBright: "#4FA8FF" }, // clean & trustworthy
  emerald:      { blue: "#189167", blueDeep: "#0A5A3F", blueBright: "#4FE0A8" }, // eco / green cleaning
  charcoalGold: { blue: "#B8892E", blueDeep: "#7A5A16", blueBright: "#E8C46B" }, // premium / luxury
  coral:        { blue: "#E85D42", blueDeep: "#A5301C", blueBright: "#FF9C82" }, // friendly / residential
  slate:        { blue: "#5B6EE1", blueDeep: "#2E3A8C", blueBright: "#8FA0FF" }, // commercial / corporate
};

const CONFIG = {
  "theme": "emerald",
  "colors": {
    "blue": "#8ff2ff",
    "blueDeep": "#00fffb",
    "blueBright": "#8ae8ff"
  },
  "business": {
    "name": "Frost",
    "logoUrl": "images/1783307719134-logo.png.jpeg",
    "phone": "(555) 010-2020",
    "phoneHref": "+15550102020",
    "email": "hello@frostclean.com",
    "area": "Serving the Greater Riverside Area",
    "hours": "Mon–Sat, 8am–6pm"
  },
  "formEndpoint": "https://formspree.io/f/REPLACE_ME",
  "hero": {
    "eyebrow": "Residential & Vacation Rental Cleaning",
    "headlineWords": [
      "Spotless.",
      "Instant.",
      "Effortless."
    ],
    "subhead": "Get a real price in seconds, book in one tap, and come home to a space that actually feels clean."
  },
  "trustBadges": [
    "Licensed & Insured",
    "Background-Checked Team",
    "100% Satisfaction Guarantee",
    "Eco-Friendly Products Available"
  ],
  "guarantee": {
    "title": "100% Satisfaction Guarantee",
    "text": "If anything's missed, tell us within 24 hours and we'll come back and fix it — free."
  },
  "serviceAreas": [
    "Riverside",
    "Corona",
    "Moreno Valley",
    "Jurupa Valley",
    "Eastvale",
    "Norco"
  ],
  "services": [
    {
      "title": "Standard Cleaning",
      "desc": "Recurring upkeep for busy homes — every surface refreshed, every visit.",
      "big": true
    },
    {
      "title": "Deep Cleaning",
      "desc": "Baseboards, grout, inside appliances — the full reset.",
      "big": false
    },
    {
      "title": "Move-In / Move-Out",
      "desc": "Empty-home detail cleaning.",
      "big": false
    },
    {
      "title": "Vacation Rental Turnover",
      "desc": "Fast, reliable cleaning between every guest — built for hosts who can't afford a bad review.",
      "big": true
    },
    {
      "title": "Office & Commercial",
      "desc": "Scheduled cleaning around your hours.",
      "big": false
    }
  ],
  "pricing": {
    "currency": "$",
    "basePrice": 89,
    "perBedroom": 18,
    "perBathroom": 22,
    "types": [
      {
        "key": "standard",
        "label": "Standard",
        "multiplier": 1
      },
      {
        "key": "deep",
        "label": "Deep Clean",
        "multiplier": 1.45
      },
      {
        "key": "moveout",
        "label": "Move-Out",
        "multiplier": 1.65
      }
    ]
  },
  "testimonials": [
    {
      "quote": "Booked in two minutes and they showed up exactly on time.",
      "name": "Priya M."
    },
    {
      "quote": "The instant quote was spot on — zero surprises.",
      "name": "Daniel R."
    },
    {
      "quote": "Our turnover cleaning has never been this reliable.",
      "name": "Aisha K."
    }
  ],
  "gallery": [
    {
      "label": "Kitchen deep clean",
      "before": "images/1783345971197-20231023-141814.jpg",
      "after": "images/1783345975095-screen-shot-2026-04-20-at-12.28.11-am.png"
    },
    {
      "label": "Bathroom detail",
      "before": "images/1783308034450-20231023-141814--1-.jpg",
      "after": null
    },
    {
      "label": "Move-out reset",
      "before": null,
      "after": null
    }
  ],
  "faq": [
    {
      "q": "Do I need to be home during the cleaning?",
      "a": "No — most clients provide a door code or key. We'll text you before and after so you always know the status."
    },
    {
      "q": "What cleaning products do you use?",
      "a": "Standard eco-friendly products by default. If you have allergies, sensitivities, or a preferred brand, just add a note when booking."
    },
    {
      "q": "Is there a contract, or can I cancel anytime?",
      "a": "No contract. Recurring plans can be paused or cancelled anytime — just give 24 hours notice."
    },
    {
      "q": "Are you insured and background-checked?",
      "a": "Yes — every cleaner on our team is background-checked, and we carry full liability insurance."
    }
  ]
};
