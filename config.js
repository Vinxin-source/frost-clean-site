/* ============================================================
   FROST — brand config. Edit this file only to rebrand for a client.
   ============================================================ */

const CONFIG = {
  business: {
    name: "Frost Clean",
    phone: "(555) 010-2020",
    phoneHref: "+15550102020",
    email: "hello@frostclean.com",
    area: "Serving the Greater Riverside Area",
    hours: "Mon–Sat, 8am–6pm",
  },

  formEndpoint: "https://formspree.io/f/REPLACE_ME",

  colors: {
    blue: "#2F6FED",
    blueDeep: "#0F3D91",
  },

  hero: {
    eyebrow: "Residential & Vacation Rental Cleaning",
    headlineWords: ["Spotless.", "Instant.", "Effortless."],
    subhead: "Get a real price in seconds, book in one tap, and come home to a space that actually feels clean.",
  },

  services: [
    { title: "Standard Cleaning", desc: "Recurring upkeep for busy homes — every surface refreshed, every visit.", big: true },
    { title: "Deep Cleaning", desc: "Baseboards, grout, inside appliances — the full reset.", big: false },
    { title: "Move-In / Move-Out", desc: "Empty-home detail cleaning.", big: false },
    { title: "Vacation Rental Turnover", desc: "Fast, reliable cleaning between every guest — built for hosts who can't afford a bad review.", big: true },
    { title: "Office & Commercial", desc: "Scheduled cleaning around your hours.", big: false },
  ],

  pricing: {
    currency: "$",
    basePrice: 89,
    perBedroom: 18,
    perBathroom: 22,
    types: [
      { key: "standard", label: "Standard", multiplier: 1 },
      { key: "deep", label: "Deep Clean", multiplier: 1.45 },
      { key: "moveout", label: "Move-Out", multiplier: 1.65 },
    ],
  },

  testimonials: [
    { quote: "Booked in two minutes and they showed up exactly on time.", name: "Priya M." },
    { quote: "The instant quote was spot on — zero surprises.", name: "Daniel R." },
    { quote: "Our turnover cleaning has never been this reliable.", name: "Aisha K." },
  ],
};
