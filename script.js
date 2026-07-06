/* ============================================================
   FROST — shared script.js (used by all pages)
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  try {
    applyTheme();
    renderBrandBasics();
    initIntro();
    initSplitWords();
    initMarquee();
    initBadgeRow();
    initBento();
    initGallery();
    initTestimonials();
    initFaq();
    initGuarantee();
    initAreaChips();
    initCalculator();
    initBookingForm();
    initTierPricing();
    initMobileCta();
    // run after all dynamic content above exists, so cards rendered
    // by initBento/initTestimonials/initBadgeRow are included
    initWipeReveal();
    initCursorGlass();
    initTilt3D();
  } catch (err) {
    console.error('Frost site failed to initialize:', err);
  }
});

/* ---------- theme: turn CONFIG.theme / CONFIG.colors into CSS variables ---------- */
function hexToRgba(hex, alpha) {
  var h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
  var r = parseInt(h.substring(0, 2), 16);
  var g = parseInt(h.substring(2, 4), 16);
  var b = parseInt(h.substring(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}
function applyTheme() {
  var preset = (typeof THEMES !== 'undefined' && THEMES[CONFIG.theme]) || (typeof THEMES !== 'undefined' && THEMES.frost) || {};
  var c = Object.assign({}, preset, CONFIG.colors || {});
  if (!c.blue) return;
  var root = document.documentElement.style;
  root.setProperty('--blue', c.blue);
  root.setProperty('--blue-deep', c.blueDeep || c.blue);
  root.setProperty('--blue-bright', c.blueBright || c.blue);
  root.setProperty('--blue-glow', hexToRgba(c.blue, 0.28));
}

/* ---------- basic brand text (nav, footer) ---------- */
function renderBrandBasics() {
  document.querySelectorAll('[data-biz-name]').forEach(function (el) { el.textContent = CONFIG.business.name; });
  renderLogo();
  document.querySelectorAll('[data-biz-phone]').forEach(function (el) { el.textContent = CONFIG.business.phone; });
  document.querySelectorAll('[data-biz-phone-href]').forEach(function (el) { el.href = 'tel:' + CONFIG.business.phoneHref; });
  document.querySelectorAll('[data-biz-area]').forEach(function (el) { el.textContent = CONFIG.business.area; });
  document.querySelectorAll('[data-biz-hours]').forEach(function (el) { el.textContent = CONFIG.business.hours; });
  document.title = CONFIG.business.name + (document.title.includes('—') ? ' — ' + document.title.split('—')[1].trim() : '');
}

/* ---------- swap in a real logo image if CONFIG.business.logoUrl is set ---------- */
function renderLogo() {
  var url = CONFIG.business.logoUrl;
  if (!url) return; // keep the default dot + text mark
  document.querySelectorAll('.brand').forEach(function (el) {
    var dot = el.querySelector('.brand-dot');
    if (dot) {
      var img = document.createElement('img');
      img.src = url;
      img.alt = CONFIG.business.name + ' logo';
      img.className = 'brand-logo';
      img.loading = 'eager';
      img.decoding = 'async';
      dot.replaceWith(img);
    }
  });
}

/* ---------- opening wipe intro — plays once per browser session ----------
   Paced deliberately for first-time visitors (~5.6s): mark draws in,
   name settles, tagline arrives, then the frost wipes away.
   A visible "Skip" control lets anyone bypass it instantly. ---------- */
function initIntro() {
  var intro = document.getElementById('intro');
  if (!intro) return;

  if (sessionStorage.getItem('frostIntroPlayed')) {
    intro.style.display = 'none';
    document.body.classList.remove('intro-active');
    return;
  }

  var mark = document.createElement('div');
  mark.className = 'intro-mark';
  intro.appendChild(mark);

  var word = document.createElement('div');
  word.className = 'intro-word';
  word.textContent = 'Fresh start.';
  intro.appendChild(word);

  var sub = document.createElement('div');
  sub.className = 'intro-sub';
  sub.textContent = CONFIG.business.name;
  intro.appendChild(sub);

  var count = 26;
  for (var i = 0; i < count; i++) {
    var b = document.createElement('div');
    b.className = 'foam-bubble';
    var size = 14 + Math.random() * 46;
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    b.style.left = (Math.random() * 100) + '%';
    b.style.top = (Math.random() * 70) + '%';
    b.style.animationDelay = (2.0 + Math.random() * 0.9) + 's';
    intro.appendChild(b);
  }

  var TOTAL_MS = 5600;

  function finishIntro() {
    document.body.classList.remove('intro-active');
    intro.style.display = 'none';
    sessionStorage.setItem('frostIntroPlayed', '1');
  }

  var skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'intro-skip';
  skip.textContent = 'Skip intro';
  skip.addEventListener('click', finishIntro);
  intro.appendChild(skip);

  var finished = false;
  setTimeout(function () {
    if (!finished) { finished = true; finishIntro(); }
  }, TOTAL_MS);
  skip.addEventListener('click', function () { finished = true; });
}

/* ---------- cursor-reactive glass highlight ---------- */
function initCursorGlass() {
  var els = document.querySelectorAll('.glass-reactive');
  if (!els.length) return;
  els.forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    });
  });
}

/* ---------- 3D tilt: real perspective rotation from cursor position ---------- */
function initTilt3D() {
  var els = document.querySelectorAll('.tilt-3d');
  if (!els.length) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  var MAX_DEG = 7;

  els.forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;   // 0..1
      var py = (e.clientY - rect.top) / rect.height;    // 0..1
      var ry = (px - 0.5) * 2 * MAX_DEG;                // left/right -> rotateY
      var rx = -(py - 0.5) * 2 * MAX_DEG;               // up/down -> rotateX
      el.classList.add('tilting');
      el.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    });
    el.addEventListener('mouseleave', function () {
      el.classList.remove('tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------- wipe-clean scroll reveal ---------- */
function initWipeReveal() {
  var els = document.querySelectorAll('.wipe');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('wipe-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function () { entry.target.classList.add('wipe-in'); }, i * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (el) { io.observe(el); });
}

/* ---------- split-word hero entrance, built from CONFIG.hero.headlineWords ---------- */
function initSplitWords() {
  var target = document.getElementById('heroHeadline');
  if (!target) return;
  var words = CONFIG.hero.headlineWords || ['Spotless.'];
  target.innerHTML = words.map(function (w, i) {
    return '<span class="split-word"><span style="animation-delay:' + (0.15 + i * 0.12) + 's">' + w + '</span></span>';
  }).join(' ');

  var eyebrow = document.getElementById('heroEyebrow');
  if (eyebrow) eyebrow.textContent = CONFIG.hero.eyebrow;
  var sub = document.getElementById('heroSub');
  if (sub) sub.textContent = CONFIG.hero.subhead;
}

/* ---------- trust marquee, driven by CONFIG.trustBadges ---------- */
function initMarquee() {
  var track = document.getElementById('marqueeTrack');
  if (!track) return;
  var items = (CONFIG.trustBadges && CONFIG.trustBadges.length) ? CONFIG.trustBadges : ['INSURED & BONDED'];
  var html = items.map(function (t) { return '<span>' + t.toUpperCase() + '</span><span class="dot">&#9679;</span>'; }).join('');
  track.innerHTML = html + html; // doubled for seamless loop
}

/* ---------- compact badge row directly under the hero ---------- */
function initBadgeRow() {
  var row = document.getElementById('badgeRow');
  if (!row) return;
  var items = (CONFIG.trustBadges || []).slice(0, 4);
  row.innerHTML = items.map(function (t) {
    return '<div class="badge-chip glass">' + t + '</div>';
  }).join('');
}

/* ---------- bento services grid from CONFIG.services ---------- */
function initBento() {
  var grid = document.getElementById('bentoGrid');
  if (!grid) return;
  grid.innerHTML = CONFIG.services.map(function (s) {
    return '<div class="bento-card glass glass-reactive tilt-3d wipe' + (s.big ? ' big' : '') + '">' +
      '<div class="glow"></div>' +
      '<h3>' + s.title + '</h3>' +
      '<p>' + s.desc + '</p>' +
      '</div>';
  }).join('');
}

/* ---------- before/after gallery, driven by CONFIG.gallery ---------- */
function initGallery() {
  var grid = document.getElementById('galleryGrid');
  if (!grid) return;
  var items = CONFIG.gallery || [];
  if (!items.length) { grid.closest('section').style.display = 'none'; return; }

  grid.innerHTML = items.map(function (item, i) {
    var afterInner = item.after
      ? '<img class="compare-after" src="' + item.after + '" alt="' + item.label + ' — after" loading="lazy" decoding="async">'
      : '<div class="compare-after"><div class="compare-placeholder">Add an "after"<br>photo here</div></div>';
    var beforeInner = item.before
      ? '<img class="compare-before" src="' + item.before + '" alt="' + item.label + ' — before" loading="lazy" decoding="async">'
      : '<div class="compare-before"><div class="compare-placeholder">Add a "before"<br>photo here</div></div>';
    return (
      '<figure class="wipe">' +
        '<div class="compare glass" id="compare' + i + '" style="--pos:50%">' +
          afterInner +
          '<div class="compare-before-wrap">' + beforeInner + '</div>' +
          '<div class="compare-handle"></div>' +
          '<div class="compare-label label-before">Before</div>' +
          '<div class="compare-label label-after">After</div>' +
          '<input type="range" class="compare-range" min="0" max="100" value="50" aria-label="Drag to compare before and after">' +
        '</div>' +
        '<div class="gallery-cap">' + item.label + '</div>' +
      '</figure>'
    );
  }).join('');

  grid.querySelectorAll('.compare').forEach(function (el) {
    var range = el.querySelector('.compare-range');
    range.addEventListener('input', function () {
      el.style.setProperty('--pos', range.value + '%');
    });
  });
}

/* ---------- testimonials from CONFIG.testimonials ---------- */
function initTestimonials() {
  var grid = document.getElementById('testiGrid');
  if (!grid) return;
  grid.innerHTML = CONFIG.testimonials.map(function (t) {
    return '<div class="testi-card glass glass-reactive tilt-3d wipe">' +
      '<div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>' +
      '<p>&#8220;' + t.quote + '&#8221;</p>' +
      '<div class="testi-name">' + t.name + '</div>' +
      '</div>';
  }).join('');
}

/* ---------- FAQ accordion, driven by CONFIG.faq ---------- */
function initFaq() {
  var list = document.getElementById('faqList');
  if (!list) return;
  var items = CONFIG.faq || [];
  if (!items.length) { list.closest('section').style.display = 'none'; return; }

  list.innerHTML = items.map(function (item) {
    return (
      '<div class="faq-item glass wipe">' +
        '<div class="faq-q"><span>' + item.q + '</span><span class="plus">+</span></div>' +
        '<div class="faq-a"><p>' + item.a + '</p></div>' +
      '</div>'
    );
  }).join('');

  list.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      list.querySelectorAll('.faq-item.open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        a.style.maxHeight = null;
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
}

/* ---------- guarantee seal, driven by CONFIG.guarantee ---------- */
function initGuarantee() {
  var el = document.getElementById('guaranteeBadge');
  if (!el || !CONFIG.guarantee) return;
  el.innerHTML =
    '<div class="seal">&#10003;</div>' +
    '<div class="text"><strong>' + CONFIG.guarantee.title + '</strong><span>' + CONFIG.guarantee.text + '</span></div>';
}

/* ---------- service area chips, driven by CONFIG.serviceAreas ---------- */
function initAreaChips() {
  var wrap = document.getElementById('areaChips');
  if (!wrap) return;
  var areas = CONFIG.serviceAreas || [];
  if (!areas.length) { wrap.closest('section').style.display = 'none'; return; }
  wrap.innerHTML = areas.map(function (a) { return '<span class="area-chip glass">' + a + '</span>'; }).join('');
}

/* ---------- instant quote calculator (booking page) ---------- */
function initCalculator() {
  var priceAmount = document.getElementById('priceAmount');
  if (!priceAmount) return;

  var pillsWrap = document.getElementById('typePills');
  pillsWrap.innerHTML = CONFIG.pricing.types.map(function (t, i) {
    return '<div class="pill' + (i === 0 ? ' active' : '') + '" data-key="' + t.key + '" data-mult="' + t.multiplier + '">' + t.label + '</div>';
  }).join('');

  var state = { bed: 2, bath: 1, mult: CONFIG.pricing.types[0].multiplier, typeLabel: CONFIG.pricing.types[0].label };
  var bedVal = document.getElementById('bedVal');
  var bathVal = document.getElementById('bathVal');
  var zipVal = document.getElementById('zipVal');
  var bBase = document.getElementById('bBase');
  var bRooms = document.getElementById('bRooms');
  var bType = document.getElementById('bType');
  var bTotal = document.getElementById('bTotal');
  var ripple = document.getElementById('ripple');
  var summaryHidden = document.getElementById('quoteSummaryHidden');

  function calc() {
    var p = CONFIG.pricing;
    var roomsCost = state.bed * p.perBedroom + state.bath * p.perBathroom;
    var total = Math.round((p.basePrice + roomsCost) * state.mult);
    return { roomsCost: roomsCost, total: total };
  }

  function animatePrice(target) {
    var current = parseInt(priceAmount.dataset.val || '0', 10);
    var start = performance.now();
    var duration = 320;
    function step(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.round(current + (target - current) * eased);
      priceAmount.innerHTML = CONFIG.pricing.currency + val + '<sup>+</sup>';
      if (t < 1) requestAnimationFrame(step);
      else priceAmount.dataset.val = target;
    }
    requestAnimationFrame(step);
  }

  function splash() {
    if (!ripple) return;
    ripple.classList.remove('animate');
    void ripple.offsetWidth;
    ripple.classList.add('animate');
  }

  function render() {
    bedVal.textContent = state.bed;
    bathVal.textContent = state.bath;
    var r = calc();
    animatePrice(r.total);
    bBase.textContent = CONFIG.pricing.currency + CONFIG.pricing.basePrice;
    bRooms.textContent = '+' + CONFIG.pricing.currency + r.roomsCost;
    bType.textContent = '\u00d7' + state.mult.toFixed(2);
    bTotal.textContent = CONFIG.pricing.currency + r.total;
    splash();
    if (summaryHidden) {
      summaryHidden.value = state.typeLabel + ' · ' + state.bed + ' bed / ' + state.bath + ' bath' +
        (zipVal && zipVal.value ? ' · ' + zipVal.value : '') + ' · Est. ' + CONFIG.pricing.currency + r.total;
    }
  }

  document.querySelectorAll('.stepper [data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-target');
      var dir = parseInt(btn.getAttribute('data-step'), 10);
      state[key] = Math.max(1, Math.min(10, state[key] + dir));
      render();
    });
  });

  document.querySelectorAll('#typePills .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      document.querySelectorAll('#typePills .pill').forEach(function (x) { x.classList.remove('active'); });
      p.classList.add('active');
      state.mult = parseFloat(p.getAttribute('data-mult'));
      state.typeLabel = p.textContent;
      render();
    });
  });

  if (zipVal) zipVal.addEventListener('input', render);

  render();
}

/* ---------- booking form: real submission + unconfigured-endpoint warning ---------- */
function isEndpointConfigured() {
  return typeof CONFIG.formEndpoint === 'string' &&
    CONFIG.formEndpoint.indexOf('http') === 0 &&
    CONFIG.formEndpoint.indexOf('REPLACE_ME') === -1;
}

function initBookingForm() {
  var form = document.getElementById('bookingForm');
  if (!form) return;

  if (!isEndpointConfigured()) {
    var warn = document.createElement('div');
    warn.style.cssText = 'background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.3);color:#b3261e;font-size:12.5px;padding:10px 12px;border-radius:12px;margin-bottom:10px;';
    warn.innerHTML = '&#9888; Form not connected yet — set <code>formEndpoint</code> in config.js.';
    form.prepend(warn);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var original = btn.textContent;

    if (!isEndpointConfigured()) {
      btn.textContent = 'Form not connected — see README';
      setTimeout(function () { btn.textContent = original; }, 3000);
      return;
    }

    btn.textContent = 'Sending…';
    btn.disabled = true;

    var formData = new FormData(form);
    fetch(CONFIG.formEndpoint, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        btn.textContent = res.ok ? 'Request sent — we\u2019ll be in touch shortly' : 'Something went wrong — please call us';
        if (res.ok) form.reset();
      })
      .catch(function () { btn.textContent = 'Network error — please call us instead'; })
      .finally(function () { setTimeout(function () { btn.textContent = original; btn.disabled = false; }, 4000); });
  });
}

/* ---------- services page pricing tiers ---------- */
function initTierPricing() {
  var grid = document.getElementById('tierGrid');
  if (!grid) return;
  var p = CONFIG.pricing;
  var tiers = [
    { name: 'Standard', price: p.basePrice, featured: false, items: ['Kitchen & bathrooms', 'Floors & dusting', 'Trash removal', 'Bring your own or our supplies'] },
    { name: 'Deep Clean', price: Math.round(p.basePrice * 1.45), featured: true, items: ['Everything in Standard', 'Baseboards & vents', 'Inside oven & fridge', 'Grout detailing'] },
    { name: 'Move-Out', price: Math.round(p.basePrice * 1.65), featured: false, items: ['Everything in Deep Clean', 'Inside cabinets & closets', 'Wall spot-cleaning', 'Move-out ready guarantee'] },
  ];
  grid.innerHTML = tiers.map(function (t) {
    return '<div class="tier-card glass wipe' + (t.featured ? ' featured' : '') + '">' +
      (t.featured ? '<div class="eyebrow">Most popular</div>' : '') +
      '<div class="tier-name">' + t.name + '</div>' +
      '<div class="tier-price">' + p.currency + t.price + '<sup style="font-size:16px;">+</sup></div>' +
      '<ul class="tier-list">' + t.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' +
      '<a href="booking.html" class="btn-primary">Book This</a>' +
      '</div>';
  }).join('');
}

/* ---------- sticky mobile call/book bar ---------- */
function initMobileCta() {
  var bar = document.getElementById('mobileCta');
  if (!bar) return;
  bar.innerHTML =
    '<a href="tel:' + CONFIG.business.phoneHref + '" class="m-call glass-strong">Call Now</a>' +
    '<a href="booking.html" class="m-book">Get Quote</a>';
}
