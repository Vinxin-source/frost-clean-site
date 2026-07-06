/* ============================================================
   FROST — admin.js
   A no-code editor for config.js. Runs entirely in the browser:
   - Password-gates the panel (local convenience lock, not a
     public auth system — see README for what this does and
     doesn't protect against).
   - Edits a draft copy of CONFIG, live-previews it in an iframe
     built from the real index.html, and either downloads the
     resulting config.js or publishes it straight to GitHub via
     the Contents API (which triggers your host's auto-redeploy).
   ============================================================ */

(function () {
  'use strict';

  var LS_AUTH = 'frostAdmin.auth.v1';
  var LS_GITHUB = 'frostAdmin.github.v1';

  var THEMES_SOURCE = "const THEMES = {\n" +
    "  frost:        { blue: \"#2F6FED\", blueDeep: \"#0F3D91\", blueBright: \"#4FA8FF\" }, // clean & trustworthy\n" +
    "  emerald:      { blue: \"#189167\", blueDeep: \"#0A5A3F\", blueBright: \"#4FE0A8\" }, // eco / green cleaning\n" +
    "  charcoalGold: { blue: \"#B8892E\", blueDeep: \"#7A5A16\", blueBright: \"#E8C46B\" }, // premium / luxury\n" +
    "  coral:        { blue: \"#E85D42\", blueDeep: \"#A5301C\", blueBright: \"#FF9C82\" }, // friendly / residential\n" +
    "  slate:        { blue: \"#5B6EE1\", blueDeep: \"#2E3A8C\", blueBright: \"#8FA0FF\" }, // commercial / corporate\n" +
    "};\n";

  var draft = null;         // working copy of CONFIG-shaped data
  var previewTimer = null;
  var previewPage = 'index.html';

  document.addEventListener('DOMContentLoaded', function () {
    initGate();
  });

  /* ================= crypto helpers ================= */
  function randomSalt() {
    var arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function sha256Hex(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }
  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  /* ================= gate: setup / lock ================= */
  function initGate() {
    var authRaw = localStorage.getItem(LS_AUTH);
    if (!authRaw) {
      document.getElementById('gateSetup').hidden = false;
      wireSetup();
    } else {
      document.getElementById('gateLock').hidden = false;
      wireLock();
    }
  }

  function wireSetup() {
    document.getElementById('setupSubmit').addEventListener('click', function () {
      var pass = document.getElementById('setupPass').value;
      var pass2 = document.getElementById('setupPass2').value;
      var errEl = document.getElementById('setupError');
      errEl.hidden = true;

      if (!pass || pass.length < 4) { return showErr(errEl, 'Choose a password with at least 4 characters.'); }
      if (pass !== pass2) { return showErr(errEl, 'Passwords do not match.'); }

      var owner = document.getElementById('setupOwner').value.trim();
      var repo = document.getElementById('setupRepo').value.trim();
      var branch = document.getElementById('setupBranch').value.trim() || 'main';
      var token = document.getElementById('setupToken').value.trim();
      var siteUrl = document.getElementById('setupSiteUrl').value.trim();

      var salt = randomSalt();
      sha256Hex(salt + pass).then(function (hash) {
        localStorage.setItem(LS_AUTH, JSON.stringify({ salt: salt, hash: hash }));
        if (owner && repo && token) {
          localStorage.setItem(LS_GITHUB, JSON.stringify({ owner: owner, repo: repo, branch: branch, token: token, siteUrl: siteUrl }));
        }
        enterDashboard();
      });
    });
  }

  function wireLock() {
    document.getElementById('lockSubmit').addEventListener('click', attemptUnlock);
    document.getElementById('lockPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') attemptUnlock(); });
    document.getElementById('forgotBtn').addEventListener('click', function () {
      if (confirm('This clears your saved password and GitHub connection from this browser. Your live site is not affected. Continue?')) {
        localStorage.removeItem(LS_AUTH);
        localStorage.removeItem(LS_GITHUB);
        location.reload();
      }
    });
  }

  function attemptUnlock() {
    var pass = document.getElementById('lockPass').value;
    var errEl = document.getElementById('lockError');
    var auth = JSON.parse(localStorage.getItem(LS_AUTH));
    sha256Hex(auth.salt + pass).then(function (hash) {
      if (hash === auth.hash) { enterDashboard(); }
      else { showErr(errEl, 'Wrong password.'); }
    });
  }

  function showErr(el, msg) { el.textContent = msg; el.hidden = false; }

  /* ================= dashboard ================= */
  function enterDashboard() {
    document.getElementById('gate').hidden = true;
    document.getElementById('dash').hidden = false;
    draft = buildDraftFromConfig();
    buildNav();
    buildAllSections();
    showSection('business');
    buildPreviewTabs();
    refreshPreview();
    wireTopbar();
    setStatus();
  }

  function buildDraftFromConfig() {
    var d = JSON.parse(JSON.stringify(CONFIG));
    d.useCustomColors = !!(CONFIG.colors && CONFIG.colors.blue);
    if (!d.colors) d.colors = { blue: '#2F6FED', blueDeep: '#0F3D91', blueBright: '#4FA8FF' };
    // normalize simple-string lists to {text} objects up front so every
    // downstream read/write (including unedited items) is consistent
    d.trustBadges = (d.trustBadges || []).map(function (v) { return { text: v }; });
    d.serviceAreas = (d.serviceAreas || []).map(function (v) { return { text: v }; });
    return d;
  }

  var SECTIONS = [
    { id: 'business', label: 'Business info' },
    { id: 'theme', label: 'Theme & color' },
    { id: 'hero', label: 'Hero section' },
    { id: 'trust', label: 'Trust & guarantee' },
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'gallery', label: 'Before / after' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'faq', label: 'FAQ' },
    { id: 'form', label: 'Booking form' },
    { id: 'github', label: 'Publishing' },
  ];

  function buildNav() {
    var nav = document.getElementById('adminNav');
    nav.innerHTML = SECTIONS.map(function (s) {
      return '<button data-section="' + s.id + '">' + s.label + '</button>';
    }).join('');
    nav.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () { showSection(btn.getAttribute('data-section')); });
    });
  }

  function showSection(id) {
    document.querySelectorAll('#adminNav button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-section') === id);
    });
    document.querySelectorAll('.form-section').forEach(function (s) {
      s.hidden = s.getAttribute('data-section') !== id;
    });
    previewPage = (id === 'services') ? 'services.html' : (id === 'pricing') ? 'services.html' :
                  (id === 'gallery') ? 'index.html' : (id === 'form') ? 'booking.html' : previewPage;
    if (id === 'business' || id === 'theme' || id === 'hero' || id === 'trust') previewPage = 'index.html';
    if (id === 'testimonials' || id === 'faq') previewPage = 'index.html';
    highlightPreviewTab();
    refreshPreview();
  }

  function buildPreviewTabs() {
    var wrap = document.getElementById('previewTabs');
    var pages = [['index.html', 'Home'], ['services.html', 'Services'], ['booking.html', 'Booking']];
    wrap.innerHTML = pages.map(function (p) {
      return '<button data-page="' + p[0] + '">' + p[1] + '</button>';
    }).join('');
    wrap.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () { previewPage = btn.getAttribute('data-page'); highlightPreviewTab(); refreshPreview(); });
    });
    highlightPreviewTab();
  }
  function highlightPreviewTab() {
    document.querySelectorAll('#previewTabs button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-page') === previewPage);
    });
  }

  /* ================= generic GitHub file push (used by config publish + image upload) ================= */
  function pushFileToGithub(gh, path, base64Content, message) {
    var apiBase = 'https://api.github.com/repos/' + gh.owner + '/' + gh.repo + '/contents/' + path;
    return fetch(apiBase + '?ref=' + encodeURIComponent(gh.branch), {
      headers: { Authorization: 'Bearer ' + gh.token, Accept: 'application/vnd.github+json' }
    }).then(function (res) {
      if (res.status === 404) return null; // new file, no sha yet
      if (!res.ok) return res.json().then(function (b) { throw new Error(githubErrMsg(res.status, b)); });
      return res.json();
    }).then(function (existing) {
      return fetch(apiBase, {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + gh.token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          content: base64Content,
          sha: existing ? existing.sha : undefined,
          branch: gh.branch,
        }),
      });
    }).then(function (res) {
      if (!res.ok) { return res.json().then(function (b) { throw new Error(githubErrMsg(res.status, b)); }); }
      return res.json();
    });
  }

  /* ================= image upload field (drop zone) ================= */
  function imageFieldHtml(label, path, currentValue, hint) {
    var hasImg = !!currentValue;
    return '<label class="f-label">' + label + (hint ? ' <span class="f-hint">— ' + hint + '</span>' : '') + '</label>' +
      '<div class="image-drop" data-drop-for="' + path + '">' +
        '<input type="file" accept="image/*" class="image-drop-input" data-file-for="' + path + '" style="display:none">' +
        '<div class="image-drop-preview"' + (hasImg ? '' : ' hidden') + '><img src="' + esc(currentValue) + '" alt=""></div>' +
        '<div class="image-drop-empty"' + (hasImg ? ' hidden' : '') + '>' +
          '<div class="image-drop-icon">&#9729;</div>' +
          '<div>Drag a photo here, or click to choose one</div>' +
        '</div>' +
        '<div class="image-drop-status" data-status-for="' + path + '"></div>' +
      '</div>' +
      '<input type="text" class="f-input image-url-fallback" data-path="' + path + '" value="' + esc(currentValue) + '" placeholder="...or paste an image URL directly">';
  }

  function wireImageField(scopeEl, path) {
    var zone = scopeEl.querySelector('.image-drop[data-drop-for="' + path + '"]');
    if (!zone) return;
    var input = zone.querySelector('[data-file-for="' + path + '"]');
    var statusEl = zone.querySelector('[data-status-for="' + path + '"]');
    var previewWrap = zone.querySelector('.image-drop-preview');
    var previewImg = previewWrap.querySelector('img');
    var emptyWrap = zone.querySelector('.image-drop-empty');
    var urlInput = scopeEl.querySelector('.image-url-fallback[data-path="' + path + '"]');

    function setPreview(url) {
      previewImg.src = url;
      previewWrap.hidden = false;
      emptyWrap.hidden = true;
    }

    zone.addEventListener('click', function (e) { if (e.target === urlInput) return; input.click(); });
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('dragging'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('dragging'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('dragging');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', function () { if (input.files[0]) handleFile(input.files[0]); });

    function handleFile(file) {
      if (!file.type.startsWith('image/')) { statusEl.textContent = 'That\'s not an image file.'; return; }
      if (file.size > 4.5 * 1024 * 1024) { statusEl.textContent = 'Keep photos under ~4.5MB — compress it first.'; return; }

      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = reader.result;
        setPreview(dataUrl); // instant local preview, before upload finishes

        var gh = JSON.parse(localStorage.getItem(LS_GITHUB) || 'null');
        if (!gh) {
          statusEl.textContent = 'No GitHub connection — set one up under "Publishing" to upload photos. For now, paste an image URL below instead.';
          return;
        }
        statusEl.textContent = 'Uploading…';
        var base64 = dataUrl.split(',')[1];
        var safeName = Date.now() + '-' + file.name.toLowerCase().replace(/[^a-z0-9.\-]/g, '-');
        var repoPath = 'images/' + safeName;

        pushFileToGithub(gh, repoPath, base64, 'Upload image via Site Editor').then(function () {
          setPath(draft, path, repoPath);
          if (urlInput) urlInput.value = repoPath;
          statusEl.textContent = 'Uploaded. It will appear on the live site once this is published.';
          queuePreview();
        }).catch(function (err) {
          statusEl.textContent = 'Upload failed: ' + err.message;
        });
      };
      reader.readAsDataURL(file);
    }

    if (urlInput) {
      urlInput.addEventListener('input', function () {
        setPath(draft, path, urlInput.value);
        if (urlInput.value) setPreview(urlInput.value);
        queuePreview();
      });
    }
  }

  function itemImageFieldHtml(label, key, currentValue) {
    var hasImg = !!currentValue;
    return '<label class="f-label">' + label + '</label>' +
      '<div class="image-drop image-drop-small" data-item-drop="' + key + '">' +
        '<input type="file" accept="image/*" class="image-drop-input" data-item-file="' + key + '" style="display:none">' +
        '<div class="image-drop-preview"' + (hasImg ? '' : ' hidden') + '><img src="' + esc(currentValue) + '" alt=""></div>' +
        '<div class="image-drop-empty"' + (hasImg ? ' hidden' : '') + '>' +
          '<div class="image-drop-icon">&#9729;</div><div>Drop or click to choose</div>' +
        '</div>' +
        '<div class="image-drop-status" data-item-status="' + key + '"></div>' +
      '</div>' +
      '<input type="text" class="f-input image-url-fallback" data-item-field="' + key + '" value="' + esc(currentValue) + '" placeholder="...or paste an image URL">';
  }

  function wireItemImageField(itemEl, key, arr, idx) {
    var zone = itemEl.querySelector('.image-drop[data-item-drop="' + key + '"]');
    if (!zone) return;
    var input = zone.querySelector('[data-item-file="' + key + '"]');
    var statusEl = zone.querySelector('[data-item-status="' + key + '"]');
    var previewWrap = zone.querySelector('.image-drop-preview');
    var previewImg = previewWrap.querySelector('img');
    var emptyWrap = zone.querySelector('.image-drop-empty');
    var urlInput = itemEl.querySelector('.image-url-fallback[data-item-field="' + key + '"]');

    function setPreview(url) { previewImg.src = url; previewWrap.hidden = false; emptyWrap.hidden = true; }

    zone.addEventListener('click', function (e) { if (e.target === urlInput) return; input.click(); });
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('dragging'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('dragging'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault(); zone.classList.remove('dragging');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', function () { if (input.files[0]) handleFile(input.files[0]); });

    function handleFile(file) {
      if (!file.type.startsWith('image/')) { statusEl.textContent = 'That\'s not an image file.'; return; }
      if (file.size > 4.5 * 1024 * 1024) { statusEl.textContent = 'Keep photos under ~4.5MB.'; return; }
      var reader = new FileReader();
      reader.onload = function () {
        setPreview(reader.result);
        var gh = JSON.parse(localStorage.getItem(LS_GITHUB) || 'null');
        if (!gh) { statusEl.textContent = 'No GitHub connection — paste an image URL below instead.'; return; }
        statusEl.textContent = 'Uploading…';
        var base64 = reader.result.split(',')[1];
        var safeName = Date.now() + '-' + file.name.toLowerCase().replace(/[^a-z0-9.\-]/g, '-');
        var repoPath = 'images/' + safeName;
        pushFileToGithub(gh, repoPath, base64, 'Upload image via Site Editor').then(function () {
          arr[idx][key] = repoPath;
          if (urlInput) urlInput.value = repoPath;
          statusEl.textContent = 'Uploaded.';
          queuePreview();
        }).catch(function (err) { statusEl.textContent = 'Upload failed: ' + err.message; });
      };
      reader.readAsDataURL(file);
    }
    if (urlInput) {
      urlInput.addEventListener('input', function () {
        arr[idx][key] = urlInput.value;
        if (urlInput.value) setPreview(urlInput.value);
        queuePreview();
      });
    }
  }

  /* ================= form builders ================= */
  function buildAllSections() {
    var host = document.getElementById('formSections');
    host.innerHTML = SECTIONS.map(function (s) { return '<section class="form-section glass" data-section="' + s.id + '"></section>'; }).join('');
    renderBusiness();
    renderTheme();
    renderHero();
    renderTrust();
    renderServices();
    renderPricing();
    renderGallery();
    renderTestimonials();
    renderFaq();
    renderForm();
    renderGithub();
  }

  function sectionEl(id) { return document.querySelector('.form-section[data-section="' + id + '"]'); }

  function esc(s) { return (s == null ? '' : String(s)).replace(/"/g, '&quot;'); }

  function bindField(el, path) {
    el.addEventListener('input', function () {
      setPath(draft, path, el.type === 'checkbox' ? el.checked : el.value);
      queuePreview();
    });
  }
  function setPath(obj, path, val) {
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = val;
  }
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o ? o[k] : undefined; }, obj);
  }

  function renderBusiness() {
    var el = sectionEl('business');
    el.innerHTML =
      '<h2>Business info</h2><p class="section-sub">Shown in the nav, footer, and contact links across every page.</p>' +
      field('Business name', 'business.name', getPath(draft, 'business.name')) +
      field('Phone (displayed)', 'business.phone', getPath(draft, 'business.phone')) +
      field('Phone (for tap-to-call, digits only)', 'business.phoneHref', getPath(draft, 'business.phoneHref')) +
      field('Email', 'business.email', getPath(draft, 'business.email')) +
      field('Service area line', 'business.area', getPath(draft, 'business.area')) +
      field('Hours', 'business.hours', getPath(draft, 'business.hours')) +
      imageFieldHtml('Logo', 'business.logoUrl', getPath(draft, 'business.logoUrl'), 'leave empty to keep the colored dot mark');
    wireFields(el);
    wireImageField(el, 'business.logoUrl');
  }

  function field(label, path, value, hint) {
    return '<label class="f-label">' + label + (hint ? ' <span class="f-hint">— ' + hint + '</span>' : '') + '</label>' +
      '<input type="text" class="f-input" data-path="' + path + '" value="' + esc(value) + '">';
  }
  function textarea(label, path, value, hint) {
    return '<label class="f-label">' + label + (hint ? ' <span class="f-hint">— ' + hint + '</span>' : '') + '</label>' +
      '<textarea class="f-textarea" data-path="' + path + '">' + esc(value) + '</textarea>';
  }
  function wireFields(scopeEl) {
    scopeEl.querySelectorAll('[data-path]').forEach(function (el) { bindField(el, el.getAttribute('data-path')); });
  }

  function renderTheme() {
    var el = sectionEl('theme');
    var themeKeys = Object.keys(THEMES);
    el.innerHTML =
      '<h2>Theme &amp; color</h2><p class="section-sub">Pick a preset, or use exact brand colors for this client.</p>' +
      '<div class="theme-swatch-row" id="swatchRow">' +
      themeKeys.map(function (k) {
        var t = THEMES[k];
        return '<div class="theme-swatch' + (draft.theme === k && !draft.useCustomColors ? ' active' : '') + '" data-theme="' + k + '" ' +
          'style="background:linear-gradient(135deg,' + t.blue + ',' + t.blueDeep + ')">' +
          '<div class="theme-swatch-name">' + k + '</div></div>';
      }).join('') + '</div>' +
      '<div class="f-check"><input type="checkbox" id="customColorsToggle" ' + (draft.useCustomColors ? 'checked' : '') + '> Use exact custom colors instead of a preset</div>' +
      '<div id="customColorFields" style="' + (draft.useCustomColors ? '' : 'display:none') + ';margin-top:14px;">' +
      colorField('Primary blue', 'colors.blue', draft.colors.blue) +
      colorField('Deep / hover shade', 'colors.blueDeep', draft.colors.blueDeep) +
      colorField('Bright accent', 'colors.blueBright', draft.colors.blueBright) +
      '</div>';

    el.querySelectorAll('.theme-swatch').forEach(function (sw) {
      sw.addEventListener('click', function () {
        draft.theme = sw.getAttribute('data-theme');
        draft.useCustomColors = false;
        document.getElementById('customColorsToggle').checked = false;
        document.getElementById('customColorFields').style.display = 'none';
        el.querySelectorAll('.theme-swatch').forEach(function (s) { s.classList.remove('active'); });
        sw.classList.add('active');
        queuePreview();
      });
    });
    document.getElementById('customColorsToggle').addEventListener('change', function (e) {
      draft.useCustomColors = e.target.checked;
      document.getElementById('customColorFields').style.display = e.target.checked ? '' : 'none';
      el.querySelectorAll('.theme-swatch').forEach(function (s) { s.classList.toggle('active', !e.target.checked && s.getAttribute('data-theme') === draft.theme); });
      queuePreview();
    });
    el.querySelectorAll('[data-path]').forEach(function (input) { bindField(input, input.getAttribute('data-path')); });
  }
  function colorField(label, path, value) {
    return '<label class="f-label">' + label + '</label>' +
      '<div style="display:flex;gap:10px;align-items:center;">' +
      '<input type="color" data-path="' + path + '" value="' + value + '" style="width:44px;height:40px;border-radius:10px;border:1px solid rgba(11,18,32,0.1);padding:2px;">' +
      '<input type="text" class="f-input" data-path="' + path + '" value="' + esc(value) + '" style="flex:1;">' +
      '</div>';
  }

  function renderHero() {
    var el = sectionEl('hero');
    el.innerHTML =
      '<h2>Hero section</h2><p class="section-sub">The first thing a visitor sees on the homepage.</p>' +
      field('Eyebrow (small line above headline)', 'hero.eyebrow', draft.hero.eyebrow) +
      field('Headline words (comma-separated — each animates in)', '__headlineWords', draft.hero.headlineWords.join(', ')) +
      textarea('Subheading', 'hero.subhead', draft.hero.subhead) +
      arrayEditorHtml('trustBadges', 'Trust badges', draft.trustBadges, [{ key: 'text', label: 'Badge text', type: 'text' }], true);
    wireFields(el);
    var headlineInput = el.querySelector('[data-path="__headlineWords"]');
    headlineInput.addEventListener('input', function () {
      draft.hero.headlineWords = headlineInput.value.split(',').map(function (w) { return w.trim(); }).filter(Boolean);
      queuePreview();
    });
    wireArrayEditor(el, 'trustBadges', draft.trustBadges, [{ key: 'text', label: 'Badge text', type: 'text' }], true);
  }

  function renderTrust() {
    var el = sectionEl('trust');
    el.innerHTML =
      '<h2>Trust &amp; guarantee</h2><p class="section-sub">The guarantee badge and the service-area chips shown near the footer.</p>' +
      field('Guarantee title', 'guarantee.title', draft.guarantee.title) +
      textarea('Guarantee text', 'guarantee.text', draft.guarantee.text) +
      arrayEditorHtml('serviceAreas', 'Service areas', draft.serviceAreas, [{ key: 'text', label: 'Area name', type: 'text' }], true);
    wireFields(el);
    wireArrayEditor(el, 'serviceAreas', draft.serviceAreas, [{ key: 'text', label: 'Area name', type: 'text' }], true);
  }

  function renderServices() {
    var el = sectionEl('services');
    el.innerHTML = '<h2>Services</h2><p class="section-sub">Mark one or two as "featured" for visual variety in the grid.</p>' +
      arrayEditorHtml('services', 'Service', draft.services, [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        { key: 'big', label: 'Featured (larger card)', type: 'checkbox' },
      ]);
    wireArrayEditor(el, 'services', draft.services, [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'desc', label: 'Description', type: 'textarea' },
      { key: 'big', label: 'Featured (larger card)', type: 'checkbox' },
    ]);
  }

  function renderPricing() {
    var el = sectionEl('pricing');
    el.innerHTML = '<h2>Pricing</h2><p class="section-sub">Drives both the instant quote calculator and the services page tiers.</p>' +
      '<div class="f-row">' + field('Currency symbol', 'pricing.currency', draft.pricing.currency) + field('Base price', 'pricing.basePrice', draft.pricing.basePrice) + '</div>' +
      '<div class="f-row">' + field('Price per bedroom', 'pricing.perBedroom', draft.pricing.perBedroom) + field('Price per bathroom', 'pricing.perBathroom', draft.pricing.perBathroom) + '</div>' +
      arrayEditorHtml('pricing.types', 'Cleaning type', draft.pricing.types, [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'multiplier', label: 'Price multiplier (1 = base price)', type: 'number' },
      ], false, true);
    wireFields(el);
    wireArrayEditor(el, 'pricing.types', draft.pricing.types, [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'multiplier', label: 'Price multiplier (1 = base price)', type: 'number' },
    ], false, true);
  }

  function renderGallery() {
    var el = sectionEl('gallery');
    el.innerHTML = '<h2>Before / after gallery</h2><p class="section-sub">Drop photos in directly, or paste URLs. Leave blank to keep clean placeholder frames.</p>' +
      arrayEditorHtml('gallery', 'Photo pair', draft.gallery, [
        { key: 'label', label: 'Caption', type: 'text' },
        { key: 'before', label: 'Before photo', type: 'image' },
        { key: 'after', label: 'After photo', type: 'image' },
      ]);
    wireArrayEditor(el, 'gallery', draft.gallery, [
      { key: 'label', label: 'Caption', type: 'text' },
      { key: 'before', label: 'Before photo', type: 'image' },
      { key: 'after', label: 'After photo', type: 'image' },
    ]);
  }

  function renderTestimonials() {
    var el = sectionEl('testimonials');
    el.innerHTML = '<h2>Testimonials</h2><p class="section-sub">Real quotes build trust faster than anything else on the page.</p>' +
      arrayEditorHtml('testimonials', 'Testimonial', draft.testimonials, [
        { key: 'quote', label: 'Quote', type: 'textarea' },
        { key: 'name', label: 'Customer name', type: 'text' },
      ]);
    wireArrayEditor(el, 'testimonials', draft.testimonials, [
      { key: 'quote', label: 'Quote', type: 'textarea' },
      { key: 'name', label: 'Customer name', type: 'text' },
    ]);
  }

  function renderFaq() {
    var el = sectionEl('faq');
    el.innerHTML = '<h2>FAQ</h2><p class="section-sub">Shown as an accordion near the bottom of the homepage.</p>' +
      arrayEditorHtml('faq', 'Question', draft.faq, [
        { key: 'q', label: 'Question', type: 'text' },
        { key: 'a', label: 'Answer', type: 'textarea' },
      ]);
    wireArrayEditor(el, 'faq', draft.faq, [
      { key: 'q', label: 'Question', type: 'text' },
      { key: 'a', label: 'Answer', type: 'textarea' },
    ]);
  }

  function renderForm() {
    var el = sectionEl('form');
    el.innerHTML = '<h2>Booking form</h2><p class="section-sub">Where booking requests get sent. Create a free endpoint at <a href="https://formspree.io" target="_blank" rel="noopener">formspree.io</a>.</p>' +
      field('Form endpoint URL', 'formEndpoint', draft.formEndpoint);
    wireFields(el);
  }

  function renderGithub() {
    var el = sectionEl('github');
    var gh = JSON.parse(localStorage.getItem(LS_GITHUB) || 'null');
    el.innerHTML = '<h2>Publishing</h2><p class="section-sub">Connects Save &amp; Publish to this site\'s GitHub repo. Stored only in this browser — never sent anywhere except directly to GitHub.</p>' +
      field('Repo owner / organization', '__gh_owner', gh ? gh.owner : '') +
      field('Repository name', '__gh_repo', gh ? gh.repo : '') +
      field('Branch', '__gh_branch', gh ? gh.branch : 'main') +
      '<label class="f-label">Personal access token <span class="f-hint">(Contents: read &amp; write, this repo only)</span></label>' +
      '<input type="password" class="f-input" data-path="__gh_token" value="' + esc(gh ? gh.token : '') + '">' +
      field('Live site URL', '__gh_siteUrl', gh ? gh.siteUrl : '') +
      '<button id="saveGithubBtn" class="btn-primary btn-small" type="button" style="margin-top:16px;">Save connection</button>' +
      '<div id="githubSaveMsg" style="margin-top:10px;font-size:12.5px;color:var(--ink-soft);"></div>';

    document.getElementById('saveGithubBtn').addEventListener('click', function () {
      var owner = el.querySelector('[data-path="__gh_owner"]').value.trim();
      var repo = el.querySelector('[data-path="__gh_repo"]').value.trim();
      var branch = el.querySelector('[data-path="__gh_branch"]').value.trim() || 'main';
      var token = el.querySelector('[data-path="__gh_token"]').value.trim();
      var siteUrl = el.querySelector('[data-path="__gh_siteUrl"]').value.trim();
      if (!owner || !repo || !token) {
        document.getElementById('githubSaveMsg').textContent = 'Owner, repo, and token are required to enable publishing.';
        return;
      }
      localStorage.setItem(LS_GITHUB, JSON.stringify({ owner: owner, repo: repo, branch: branch, token: token, siteUrl: siteUrl }));
      document.getElementById('githubSaveMsg').textContent = 'Saved. Save & Publish will now push straight to GitHub.';
      setStatus();
    });
  }

  /* ================= generic array editor ================= */
  function arrayEditorHtml(path, itemName, items, fields, simpleString, numberSimple) {
    return '<div class="array-editor" data-array-path="' + path + '">' +
      items.map(function (item, i) { return listItemHtml(itemName, i, item, fields, simpleString, numberSimple); }).join('') +
      '<button class="add-item-btn" data-add-for="' + path + '" type="button">+ Add ' + itemName.toLowerCase() + '</button>' +
      '</div>';
  }
  function listItemHtml(itemName, i, item, fields, simpleString) {
    var inner = simpleString
      ? '<input type="text" class="f-input" data-item-field="text" value="' + esc(item.text != null ? item.text : item) + '">'
      : fields.map(function (f) {
          var val = item[f.key];
          if (f.type === 'checkbox') {
            return '<div class="f-check"><input type="checkbox" data-item-field="' + f.key + '" ' + (val ? 'checked' : '') + '> ' + f.label + '</div>';
          }
          if (f.type === 'textarea') {
            return '<label class="f-label">' + f.label + '</label><textarea class="f-textarea" data-item-field="' + f.key + '">' + esc(val) + '</textarea>';
          }
          if (f.type === 'image') {
            return itemImageFieldHtml(f.label, f.key, val);
          }
          return '<label class="f-label">' + f.label + '</label><input type="' + (f.type === 'number' ? 'number' : 'text') + '" class="f-input" data-item-field="' + f.key + '" value="' + esc(val) + '"' + (f.type === 'number' ? ' step="0.01"' : '') + '>';
        }).join('');
    return '<div class="list-item" data-index="' + i + '">' +
      '<div class="list-item-head"><span class="list-item-title">' + itemName + ' ' + (i + 1) + '</span>' +
      '<div class="list-item-actions">' +
      '<button class="icon-btn" data-move="-1" title="Move up" type="button">&uarr;</button>' +
      '<button class="icon-btn" data-move="1" title="Move down" type="button">&darr;</button>' +
      '<button class="icon-btn danger" data-remove title="Remove" type="button">&times;</button>' +
      '</div></div>' + inner + '</div>';
  }

  function wireArrayEditor(scopeEl, path, itemsRef, fields, simpleString, numberSimple) {
    var wrap = scopeEl.querySelector('.array-editor[data-array-path="' + path + '"]');
    if (!wrap) return;

    wrap.querySelectorAll('.list-item').forEach(function (itemEl) {
      var idx = parseInt(itemEl.getAttribute('data-index'), 10);
      var arrRef = getPath(draft, path);
      itemEl.querySelectorAll('[data-item-field]').forEach(function (input) {
        input.addEventListener('input', function () {
          var arr = getPath(draft, path);
          var key = input.getAttribute('data-item-field');
          var val = input.type === 'checkbox' ? input.checked : (numberSimple && key === 'multiplier' ? parseFloat(input.value) || 0 : input.value);
          if (simpleString) { arr[idx] = { text: val }; }
          else { arr[idx][key] = val; }
          queuePreview();
        });
      });
      if (fields) {
        fields.forEach(function (f) {
          if (f.type === 'image') wireItemImageField(itemEl, f.key, arrRef, idx);
        });
      }
      itemEl.querySelector('[data-remove]').addEventListener('click', function () {
        getPath(draft, path).splice(idx, 1);
        rerenderSectionFor(path);
      });
      itemEl.querySelectorAll('[data-move]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var arr = getPath(draft, path);
          var dir = parseInt(btn.getAttribute('data-move'), 10);
          var newIdx = idx + dir;
          if (newIdx < 0 || newIdx >= arr.length) return;
          var tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
          rerenderSectionFor(path);
        });
      });
    });

    var addBtn = wrap.querySelector('.add-item-btn[data-add-for="' + path + '"]');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var arr = getPath(draft, path);
        if (simpleString) { arr.push({ text: '' }); }
        else {
          var blank = {};
          fields.forEach(function (f) { blank[f.key] = f.type === 'checkbox' ? false : (f.type === 'number' ? 0 : ''); });
          arr.push(blank);
        }
        rerenderSectionFor(path);
      });
    }
  }

  function rerenderSectionFor(path) {
    var top = path.split('.')[0];
    var renderMap = {
      trustBadges: renderHero, serviceAreas: renderTrust, services: renderServices,
      pricing: renderPricing, gallery: renderGallery, testimonials: renderTestimonials, faq: renderFaq,
    };
    var fn = renderMap[top] || renderMap[path];
    if (fn) fn();
    queuePreview();
  }

  /* ================= config.js generation ================= */
  function configFromDraft() {
    var out = JSON.parse(JSON.stringify(draft));
    // arrays stored with {text} wrapper for simple-string lists — unwrap
    out.trustBadges = draft.trustBadges.map(function (b) { return b.text; });
    out.serviceAreas = draft.serviceAreas.map(function (a) { return a.text; });
    if (!draft.useCustomColors) out.colors = null;
    delete out.useCustomColors;
    return out;
  }

  function generateConfigJSText() {
    var cfg = configFromDraft();
    var header = "/* ============================================================\n" +
      "   FROST — brand & theme config.\n" +
      "   This is the ONLY file most rebrands need. No CSS editing required.\n" +
      "   Last updated via Site Editor: " + new Date().toISOString() + "\n" +
      "   ============================================================ */\n\n" +
      "/* ---------- Pick a theme, or override colors completely below ---------- */\n";
    return header + THEMES_SOURCE + "\nconst CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
  }

  /* ================= live preview ================= */
  function queuePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 260);
  }

  function refreshPreview() {
    fetch(previewPage, { cache: 'no-store' }).then(function (res) { return res.text(); }).then(function (html) {
      var cfg = configFromDraft();
      var inline = '<script>' +
        'var THEMES = ' + JSON.stringify(THEMES) + ';' +
        'var CONFIG = ' + JSON.stringify(cfg) + ';' +
        '<' + '/script>';
      var baseHref = new URL('.', location.href).href;
      html = html.replace('<script src="config.js"></script>', inline);
      html = html.replace('<head>', '<head><base href="' + baseHref + '">');
      var frame = document.getElementById('previewFrame');
      frame.srcdoc = html;
    }).catch(function () {
      var frame = document.getElementById('previewFrame');
      frame.srcdoc = '<body style="font-family:sans-serif;padding:24px;color:#666;">Preview unavailable — this only works when the editor is served over http(s), not opened as a local file.</body>';
    });
  }

  /* ================= save / publish ================= */
  function wireTopbar() {
    document.getElementById('downloadBtn').addEventListener('click', downloadConfig);
    document.getElementById('publishBtn').addEventListener('click', publishToGithub);
    document.getElementById('lockAgainBtn').addEventListener('click', function () { location.reload(); });
  }

  function downloadConfig() {
    var text = generateConfigJSText();
    var blob = new Blob([text], { type: 'text/javascript' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'config.js';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function setStatus() {
    var gh = JSON.parse(localStorage.getItem(LS_GITHUB) || 'null');
    var el = document.getElementById('statusText');
    el.textContent = gh ? ('Connected to ' + gh.owner + '/' + gh.repo) : 'Not connected — Save & Publish will download instead';
  }

  function publishToGithub() {
    var gh = JSON.parse(localStorage.getItem(LS_GITHUB) || 'null');
    if (!gh) { downloadConfig(); toast('No GitHub connection set up — downloaded config.js instead. Set one up under "Publishing".', true); return; }

    var btn = document.getElementById('publishBtn');
    var original = btn.textContent;
    btn.textContent = 'Publishing…';
    btn.disabled = true;

    var content = generateConfigJSText();
    pushFileToGithub(gh, 'config.js', utf8ToBase64(content), 'Update site content via Site Editor').then(function () {
      var msg = 'Published! Your host will redeploy automatically — usually live within a minute.';
      if (gh.siteUrl) msg += ' → ' + gh.siteUrl;
      toast(msg, false);
    }).catch(function (err) {
      toast('Publish failed: ' + err.message, true);
    }).finally(function () {
      btn.textContent = original;
      btn.disabled = false;
    });
  }

  function githubErrMsg(status, body) {
    if (status === 401) return 'GitHub rejected the token. Check it under "Publishing".';
    if (status === 404) return 'Repo, branch, or config.js not found. Check owner/repo/branch under "Publishing".';
    if (status === 409) return 'Someone else changed the file at the same time — reload and try again.';
    return (body && body.message) || ('GitHub error ' + status);
  }

  function toast(msg, isError) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast' + (isError ? ' error' : '');
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.add('hide'); setTimeout(function () { el.hidden = true; el.classList.remove('hide'); }, 300); }, 5000);
  }
})();
