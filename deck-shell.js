/* ============================================================
 deck-shell.js v6.0.8 -- UI Shell & PPTX Export
 v6.0.5:  _imgPlaceholder, _skipExport, generatePlaceholderImage
 v6.0.6:  Reordered export: dispatch before master/bg overrides
 v6.0.7:  Removed bgMode buttons. Bronze accent. White light bg.
 v6.0.8:  exportShape _pptxGradient support for imageCards.
 ============================================================ */

(function () {
'use strict';

var SD = window.StandardDeck;
if (!SD) { console.error('[deck-shell] standard-deck.js must load first'); return; }

var FONT = 'Mazda Type, Arial, sans-serif';
var _D = []; var _config = {}; var _currentSlide = 0; var _totalSlides = 0;
var _customLogo = null; var _noLogo = false; var _imageMode = false;
var _imageCache = {};

// ============================================================
// IMAGE PREFETCH CACHE
// ============================================================

function prefetchImage(url) {
if (_imageCache[url]) return;
var img = new Image();
img.crossOrigin = 'anonymous';
img.onload = function () {
  var canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  var ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
  try { _imageCache[url] = canvas.toDataURL('image/png'); }
  catch (e) { console.warn('[deck-shell] CORS blocked prefetch: ' + url); }
};
img.onerror = function () { console.warn('[deck-shell] Failed to prefetch: ' + url); };
img.src = url;
}

// ============================================================
// ICON PNG PRE-RENDER CACHE
// ============================================================

var _iconCache = {};

function prerenderIcon(name, size, color) {
var key = name + '_' + size + '_' + color;
if (_iconCache[key]) return;
if (!window.DeckIcons || !window.DeckIcons.has(name)) return;
var renderSize = size * 3;  // 3x resolution for sharp PPTX export
var svg = window.DeckIcons.get(name, color, renderSize);
if (!svg) return;
var img = new Image();
var blob = new Blob([svg], {type: 'image/svg+xml'});
var url = URL.createObjectURL(blob);
img.onload = function() {
  var canvas = document.createElement('canvas');
  canvas.width = renderSize; canvas.height = renderSize;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, renderSize, renderSize);
  _iconCache[key] = canvas.toDataURL('image/png');
  URL.revokeObjectURL(url);
};
img.src = url;
}

// ============================================================
// PLACEHOLDER IMAGE GENERATOR
// ============================================================

function generatePlaceholderImage(w, h, isDark) {
  var canvas = document.createElement('canvas');
  var pw = Math.round(w * 150); var ph = Math.round(h * 150);
  canvas.width = pw; canvas.height = ph;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = isDark ? '#535B69' : '#F0F0F0';
  ctx.fillRect(0, 0, pw, ph);
  ctx.strokeStyle = isDark ? '#777777' : '#CCCCCC';
  ctx.lineWidth = 2; ctx.strokeRect(1, 1, pw - 2, ph - 2);
  ctx.strokeStyle = isDark ? '#606870' : '#E0E0E0';
  ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(pw, ph);
  ctx.moveTo(pw, 0); ctx.lineTo(0, ph); ctx.stroke();
  ctx.fillStyle = '#999999';
  var fontSize = Math.max(12, Math.round(pw * 0.022));
  ctx.font = 'bold ' + fontSize + 'px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Right-click \u2192 Change Picture', pw / 2, ph / 2);
  return canvas.toDataURL('image/png');
}

// ============================================================
// STYLES
// ============================================================

function injectStyles() {
var css = [
  '*, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }',
  'body { background:#111; font-family:DM Sans,sans-serif; display:flex; flex-direction:column; align-items:center; min-height:100vh; overflow-x:hidden; }',
  '.sd-toolbar { display:flex; justify-content:space-between; align-items:center; padding:8px 16px; background:#191919; border-bottom:2px solid #333; font-family:DM Sans,sans-serif; font-size:13px; color:#F5F5F5; position:sticky; top:0; z-index:1000; width:100%; }',
  '.sd-toolbar-left, .sd-toolbar-right { display:flex; align-items:center; gap:8px; }',
  '.sd-btn { background:#363732; color:#F5F5F5; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; font-family:inherit; transition:background 0.15s; }',
  '.sd-btn:hover { background:#53544A; }',
  '.sd-btn:disabled { opacity:0.3; cursor:default; }',
  '.sd-slide-counter { margin:0 12px; color:#8B8C81; }',
  '.sd-slide-counter .sd-current { color:#F5F5F5; font-weight:600; }',
  '.sd-btn-download { background:#D50032 !important; color:#FFFFFF !important; font-weight:600; }',
  '.sd-btn-download:hover { background:#B5002A !important; }',
  '#sd-viewport { position:relative; width:1920px; height:1200px; transform-origin:top center; margin:20px auto 0; }',
  '.slide { position:absolute; top:0; left:0; width:1920px; height:1200px; overflow:hidden; opacity:0; transition:opacity 0.3s ease; pointer-events:none; }',
  '.slide.active { opacity:1; pointer-events:auto; }',
  '.sd-color-picker { display:none; flex-direction:column; gap:10px; position:absolute; top:100%; right:0; margin-top:8px; padding:14px; background:#191919; border:1px solid #363732; border-radius:6px; z-index:1100; min-width:240px; }',
  '.sd-picker-label { font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:#8B8C81; margin-bottom:4px; }',
  '.sd-swatch-row { display:flex; flex-wrap:wrap; gap:6px; }',
  '.sd-swatch { width:30px; height:30px; border-radius:6px; cursor:pointer; border:3px solid transparent; transition:border-color 0.2s, transform 0.15s; }',
  '.sd-swatch:hover { transform:scale(1.1); }',
  '.sd-swatch.active { border-color:#FFFFFF; }',
  '.sd-picker-divider { height:1px; background:#363732; }',
  '.sd-hex-row { display:flex; align-items:center; gap:6px; }',
  '.sd-hex-row input { background:#2a2a2a; border:1px solid #444; color:#eee; padding:6px 8px; border-radius:4px; font-size:12px; width:90px; }',
  '.sd-hex-row button { background:#363732; color:#ccc; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:11px; }',
  '.sd-notes-panel { position:fixed; right:0; top:44px; width:320px; max-height:calc(100vh - 44px); background:#191919; border-left:1px solid #363732; overflow-y:auto; z-index:900; }',
  '.sd-notes-header { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #363732; color:#F5F5F5; font-weight:600; font-size:13px; }',
  '.sd-notes-content { padding:16px; color:#C2C4B8; font-size:13px; line-height:1.6; }',
  '.sd-logo-panel { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:600px; background:#191919; border:1px solid #363732; border-bottom:none; border-radius:8px 8px 0 0; padding:20px 24px; z-index:950; }',
  '.sd-logo-preview { width:120px; height:80px; background:#2a2a2a; border-radius:6px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; overflow:hidden; }',
  '.sd-logo-preview img { max-width:100%; max-height:100%; }',
  '.sd-logo-controls { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-top:12px; }',
  '.sd-logo-controls label { color:#aaa; font-size:13px; }',
  '.sd-logo-controls input[type=range] { width:150px; }',
  '.sd-logo-controls select { background:#2a2a2a; color:#ddd; border:1px solid #444; padding:6px; border-radius:4px; }',
  '.sd-toast { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); padding:10px 20px; border-radius:6px; font-size:13px; font-family:DM Sans,sans-serif; z-index:2000; transition:opacity 0.3s; }',
  '.sd-toast-ok { background:#28A745; color:#FFF; }',
  '.sd-toast-warn { background:#E67E00; color:#FFF; }',
  '.sd-toast-bad { background:#C12638; color:#FFF; }',
  '[contenteditable] { cursor:text; }',
  '[contenteditable]:focus { outline:1px dashed rgba(255,255,255,0.3); outline-offset:2px; }',
  '[contenteditable]:hover { outline:1px dashed rgba(255,255,255,0.15); outline-offset:2px; }'
].join('\n');
var style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
}

// ============================================================
// VIEWPORT SCALING
// ============================================================

function scaleViewport() {
  var vp = document.getElementById('sd-viewport'); if (!vp) return;
  var availW = window.innerWidth - 40; var availH = window.innerHeight - 80;
  var scale = Math.min(availW / 1920, availH / 1200, 1);
  vp.style.transform = 'scale(' + scale + ')';
  vp.style.marginBottom = -(1200 * (1 - scale)) + 'px';
}

// ============================================================
// SLIDE NAVIGATION
// ============================================================

function showSlide(index) {
  if (index < 0 || index >= _totalSlides) return;
  _currentSlide = index;
  if (_imageMode) {
    document.querySelectorAll('#sw .sf, #sd-viewport .sf').forEach(function (sf, i) { sf.style.display = (i === _currentSlide) ? 'block' : 'none'; });
  } else {
    var slides = document.querySelectorAll('#sd-viewport .slide');
    slides.forEach(function (s) { s.classList.remove('active'); });
    if (slides[index]) slides[index].classList.add('active');
  }
  var ce = document.querySelector('.sd-current'); if (ce) ce.textContent = _currentSlide + 1;
  var pb = document.querySelector('.sd-prev'); var nb = document.querySelector('.sd-next');
  if (pb) pb.disabled = (_currentSlide === 0);
  if (nb) nb.disabled = (_currentSlide === _totalSlides - 1);
  updateNotes();
}

// ============================================================
// TOOLBAR
// ============================================================

function buildToolbar(container) {
  var existing = document.querySelector('.sd-toolbar'); if (existing) existing.remove();
  var toolbar = document.createElement('div'); toolbar.className = 'sd-toolbar';
  toolbar.innerHTML = [
    '<div class="sd-toolbar-left">',
    '  <button class="sd-btn sd-prev" title="Previous slide">\u25C0</button>',
    '  <span class="sd-slide-counter">Slide <span class="sd-current">1</span> / <span class="sd-total">' + _totalSlides + '</span></span>',
    '  <button class="sd-btn sd-next" title="Next slide">\u25B6</button>',
    '</div>',
    '<div class="sd-toolbar-right">',
    '  <button class="sd-btn sd-color-btn" title="Color">\uD83C\uDFA8 Color</button>',
    '  <button class="sd-btn sd-notes-btn" title="Notes">\uD83D\uDCDD Notes</button>',
    '  <button class="sd-btn sd-logo-btn" title="Logo">\uD83D\uDDBC Logo</button>',
    '  <button class="sd-btn sd-btn-download sd-download-btn" title="Download">\u2B07 Download</button>',
    '</div>'
  ].join('');
  if (container && container.firstChild) container.insertBefore(toolbar, container.firstChild);
  else document.body.insertBefore(toolbar, document.body.firstChild);
  toolbar.querySelector('.sd-prev').addEventListener('click', function () { showSlide(_currentSlide - 1); });
  toolbar.querySelector('.sd-next').addEventListener('click', function () { showSlide(_currentSlide + 1); });
  return toolbar;
}

// ============================================================
// COLOR PICKER
// ============================================================

function buildColorPicker(toolbarRight) {
  var picker = document.createElement('div'); picker.className = 'sd-color-picker';
  var al = document.createElement('div'); al.className = 'sd-picker-label'; al.textContent = 'Accent Color'; picker.appendChild(al);
  var ar = document.createElement('div'); ar.className = 'sd-swatch-row';
  var families = SD.ACCENT_FAMILIES; var ca = SD.getAccent().mid;
  Object.keys(families).forEach(function (name) {
    var fam = families[name]; var sw = document.createElement('button');
    sw.className = 'sd-swatch' + (fam.mid === ca ? ' active' : '');
    sw.style.background = fam.mid; sw.title = name; sw.setAttribute('data-family', name);
    sw.addEventListener('click', function () { SD.setAccent(name); rerenderAll(); updateSwatchStates(); picker.style.display = 'none'; });
    ar.appendChild(sw);
  }); picker.appendChild(ar);
  picker.appendChild(Object.assign(document.createElement('div'), { className: 'sd-picker-divider' }));
  var hr = document.createElement('div'); hr.className = 'sd-hex-row';
  hr.innerHTML = '<span style="color:#8B8C81;font-size:10px;margin-right:4px;">Custom:</span><input type="text" class="sd-hex-input" placeholder="#8D7057" maxlength="7"><button class="sd-hex-apply">Apply</button><button class="sd-hex-reset">Reset</button>';
  picker.appendChild(hr);
  toolbarRight.style.position = 'relative'; toolbarRight.appendChild(picker);
  hr.querySelector('.sd-hex-apply').addEventListener('click', function () {
    var hex = hr.querySelector('.sd-hex-input').value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) { SD.setAccent(hex); rerenderAll(); updateSwatchStates(); picker.style.display = 'none'; }
  });
  hr.querySelector('.sd-hex-reset').addEventListener('click', function () {
    SD.setAccent('bronze'); rerenderAll(); updateSwatchStates();
    hr.querySelector('.sd-hex-input').value = ''; picker.style.display = 'none';
  });
  return picker;
}

function updateSwatchStates() {
  var cur = SD.getAccent().name;
  document.querySelectorAll('.sd-swatch').forEach(function (s) { s.classList.toggle('active', s.getAttribute('data-family') === cur); });
  var tb = document.querySelector('.sd-toolbar'); if (tb) tb.style.borderBottomColor = SD.getAccent().mid;
}

// ============================================================
// NOTES PANEL
// ============================================================

function buildNotesPanel(container) {
  var existing = document.querySelector('.sd-notes-panel'); if (existing) existing.remove();
  var panel = document.createElement('div'); panel.className = 'sd-notes-panel'; panel.style.display = 'none';
  panel.innerHTML = '<div class="sd-notes-header"><span>Speaker Notes</span><button class="sd-btn sd-notes-close">\u2715</button></div><div class="sd-notes-content">No speaker notes for this slide.</div>';
  (container || document.body).appendChild(panel);
  panel.querySelector('.sd-notes-close').addEventListener('click', function () { panel.style.display = 'none'; });
  return panel;
}

function updateNotes() {
  var c = document.querySelector('.sd-notes-content'); if (!c) return;
  var s = _D[_currentSlide];
  if (s && s.notes) { c.textContent = s.notes; c.style.fontStyle = 'normal'; c.style.color = '#C2C4B8'; }
  else { c.textContent = 'No speaker notes for this slide.'; c.style.fontStyle = 'italic'; c.style.color = '#8B8C81'; }
}

function toggleNotesPanel() { var p = document.querySelector('.sd-notes-panel'); if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none'; }

// ============================================================
// LOGO MANAGER
// ============================================================

function buildLogoPanel(container) {
  var existing = document.querySelector('.sd-logo-panel'); if (existing) existing.remove();
  var panel = document.createElement('div'); panel.className = 'sd-logo-panel'; panel.style.display = 'none';
  panel.innerHTML = [
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">',
    '<span style="color:#F5F5F5;font-weight:600;font-size:13px;">Logo Manager</span>',
    '<button class="sd-btn sd-logo-close">\u2715</button></div>',
    '<div class="sd-logo-preview"><span style="color:#666;font-size:13px;">No logo uploaded</span></div>',
    '<button class="sd-btn sd-logo-upload" style="margin-bottom:12px;">\uD83D\uDCC1 Upload Logo</button>',
    '<input type="file" class="sd-logo-file" accept=".png,.jpg,.jpeg,.svg" style="display:none;">',
    '<div class="sd-logo-controls" style="display:none;">',
    '<label>Size:</label><input type="range" class="sd-logo-size" min="40" max="200" value="80">',
    '<span class="sd-logo-size-lbl">80px</span><label>Position:</label>',
    '<select class="sd-logo-pos"><option value="bottom-right" selected>Bottom Right</option><option value="top-right">Top Right</option><option value="top-left">Top Left</option><option value="bottom-left">Bottom Left</option></select>',
    '<button class="sd-btn sd-logo-apply">Apply to All</button>',
    '<button class="sd-btn sd-logo-remove">Remove</button></div>'
  ].join('');
  (container || document.body).appendChild(panel);
  panel.querySelector('.sd-logo-close').addEventListener('click', function () { panel.style.display = 'none'; });
  panel.querySelector('.sd-logo-upload').addEventListener('click', function () { panel.querySelector('.sd-logo-file').click(); });
  panel.querySelector('.sd-logo-file').addEventListener('change', function (e) {
    var file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Logo must be under 2MB.', 'warn'); return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var dataUri = ev.target.result; var tempImg = new Image();
      tempImg.onload = function () {
        var ar = tempImg.naturalHeight / tempImg.naturalWidth;
        var ic = document.createElement('canvas'); ic.width = tempImg.naturalWidth; ic.height = tempImg.naturalHeight;
        var ictx = ic.getContext('2d'); ictx.drawImage(tempImg, 0, 0);
        var id = ictx.getImageData(0, 0, ic.width, ic.height); var px = id.data;
        for (var p = 0; p < px.length; p += 4) { px[p] = 255 - px[p]; px[p+1] = 255 - px[p+1]; px[p+2] = 255 - px[p+2]; }
        ictx.putImageData(id, 0, 0);
        panel.querySelector('.sd-logo-preview').innerHTML = '<img src="' + dataUri + '">';
        panel.querySelector('.sd-logo-controls').style.display = 'flex';
        _customLogo = { src: dataUri, srcInverted: ic.toDataURL('image/png'), width: 80, aspectRatio: ar, position: 'bottom-right' };
      }; tempImg.src = dataUri;
    }; reader.readAsDataURL(file);
  });
  panel.querySelector('.sd-logo-size').addEventListener('input', function (e) { var v = e.target.value; panel.querySelector('.sd-logo-size-lbl').textContent = v + 'px'; if (_customLogo) _customLogo.width = parseInt(v); });
  panel.querySelector('.sd-logo-pos').addEventListener('change', function (e) { if (_customLogo) _customLogo.position = e.target.value; });
  panel.querySelector('.sd-logo-apply').addEventListener('click', function () { if (_customLogo) applyLogoToSlides(); });
  panel.querySelector('.sd-logo-remove').addEventListener('click', function () {
    _customLogo = null; removeLogoFromSlides();
    panel.querySelector('.sd-logo-preview').innerHTML = '<span style="color:#666;font-size:13px;">No logo uploaded</span>';
    panel.querySelector('.sd-logo-controls').style.display = 'none';
  });
  return panel;
}

function applyLogoToSlides() {
  removeLogoFromSlides();
  document.querySelectorAll('#sd-viewport .slide, #sw .sf').forEach(function (slide, i) {
    var isDark = _D[i] && _D[i].dark;
    var img = document.createElement('img'); img.src = isDark ? _customLogo.src : _customLogo.srcInverted; img.className = 'logo-custom';
    var pos = _customLogo.position || 'bottom-right';
    if (pos === 'bottom-right') { var slot = slide.querySelector('.logo-footer-slot'); if (slot) { img.style.width = _customLogo.width + 'px'; img.style.height = 'auto'; slot.appendChild(img); return; } }
    img.style.position = 'absolute'; img.style.width = _customLogo.width + 'px'; img.style.height = 'auto';
    if (pos.indexOf('top') > -1) img.style.top = '30px'; if (pos.indexOf('bottom') > -1) img.style.bottom = '30px';
    if (pos.indexOf('right') > -1) img.style.right = '100px'; if (pos.indexOf('left') > -1) img.style.left = '50px';
    slide.appendChild(img);
  });
}

function removeLogoFromSlides() { document.querySelectorAll('.logo-custom').forEach(function (el) { el.remove(); }); }
function toggleLogoPanel() { var p = document.querySelector('.sd-logo-panel'); if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none'; }

// ============================================================
// TOAST / KEYBOARD / RERENDER
// ============================================================

function showToast(message, type) {
  var t = document.createElement('div'); t.className = 'sd-toast sd-toast-' + (type || 'ok'); t.textContent = message;
  document.body.appendChild(t); setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, 3000);
}

function setupKeyboard() {
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.target.getAttribute && e.target.getAttribute('contenteditable') === 'true') return;
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); showSlide(_currentSlide - 1); break;
      case 'ArrowRight': e.preventDefault(); showSlide(_currentSlide + 1); break;
      case 'n': case 'N': if (!e.ctrlKey && !e.metaKey) toggleNotesPanel(); break;
      case 'Escape': closeAllPanels(); break;
    }
  });
}

function closeAllPanels() {
  ['sd-notes-panel', 'sd-color-picker', 'sd-logo-panel'].forEach(function (cls) {
    var el = document.querySelector('.' + cls); if (el) el.style.display = 'none';
  });
}

function rerenderAll() {
  var vp = document.getElementById('sd-viewport'); if (!vp || _imageMode) return;
  SD.renderAll(_D, vp); _totalSlides = _D.length; showSlide(_currentSlide);
  if (_customLogo) applyLogoToSlides();
}

// ============================================================
// PPTX EXPORT [v6.0.8: _pptxGradient support]
// ============================================================

function exportPPTX() {
var downloadBtn = document.querySelector('.sd-download-btn');
if (typeof PptxGenJS === 'undefined' && typeof pptxgen === 'undefined') { showToast('Export library loading...', 'warn'); return; }
if (!_D || !_D.length) { showToast('No slide data.', 'bad'); return; }
if (downloadBtn && downloadBtn.disabled) return;
if (downloadBtn) { downloadBtn.disabled = true; downloadBtn.textContent = '\u23F3 Exporting...'; }

try {
  var pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'SD_LAYOUT', width: 13.33, height: 7.5 }); pptx.layout = 'SD_LAYOUT';
  pptx.author = 'Standard Presentation Builder'; pptx.subject = _config.title || 'Presentation';
  var accent = SD.getAccent(); var footerText = SD.getFooterText();
  var darkBgColor = '040B13';
  var lightBgColor = 'FFFFFF';
  var contentFooterText = SD.getContentFooter();

  pptx.defineSlideMaster({ title: 'SD_DARK', background: { color: darkBgColor },
    objects: [{ text: { text: footerText, options: { x: 0.3, y: 7.05, w: 4, h: 0.3, fontSize: 7, fontFace: FONT, color: '999999', bold: false, letterSpacing: 1.5 } } }] });
  pptx.defineSlideMaster({ title: 'SD_LIGHT', background: { color: lightBgColor },
    objects: [{ text: { text: footerText, options: { x: 0.3, y: 7.05, w: 4, h: 0.3, fontSize: 7, fontFace: FONT, color: '999999', bold: false, letterSpacing: 1.5 } } }] });

  pptx.defineSlideMaster({ title: 'SD_DARK_NOFOOTER', background: { color: darkBgColor } });
  pptx.defineSlideMaster({ title: 'SD_LIGHT_NOFOOTER', background: { color: lightBgColor } });

  if (contentFooterText) {
    pptx.defineSlideMaster({ title: 'SD_DARK_CONTENT', background: { color: darkBgColor },
      objects: [{ text: { text: contentFooterText, options: { x: 0.3, y: 7.05, w: 4, h: 0.3, fontSize: 7, fontFace: FONT, color: '767676', bold: false, letterSpacing: 1.5 } } }] });
    pptx.defineSlideMaster({ title: 'SD_LIGHT_CONTENT', background: { color: lightBgColor },
      objects: [{ text: { text: contentFooterText, options: { x: 0.3, y: 7.05, w: 4, h: 0.3, fontSize: 7, fontFace: FONT, color: '767676', bold: false, letterSpacing: 1.5 } } }] });
  }

  _D.forEach(function (slideData, index) {
    var isDark = !!slideData.dark;

    // STEP 1: Dispatch (mutates slideData)
    var els;
    if (slideData.layout && window.DeckLayouts) els = window.DeckLayouts.dispatch(slideData);
    else els = slideData.els || [];
    els = SD.enforceWidthRule(els);

    isDark = !!slideData.dark;

    // STEP 2: Master selection (after dispatch)
    var master;
    if (slideData.customFooter) {
      master = isDark ? 'SD_DARK_NOFOOTER' : 'SD_LIGHT_NOFOOTER';
    } else if (SD.isStructuralSlide(slideData.layout)) {
      master = isDark ? 'SD_DARK' : 'SD_LIGHT';
    } else if (contentFooterText) {
      master = isDark ? 'SD_DARK_CONTENT' : 'SD_LIGHT_CONTENT';
    } else {
      master = isDark ? 'SD_DARK_NOFOOTER' : 'SD_LIGHT_NOFOOTER';
    }

    var slide = pptx.addSlide({ masterName: master });

    // STEP 3: Background overrides (after dispatch)
    if (slideData.bgImage && _imageCache[slideData.bgImage]) {
      slide.background = { data: _imageCache[slideData.bgImage] };
    }
    if (slideData.bgColor) {
      slide.background = { color: slideData.bgColor.replace('#', '') };
    }

    // STEP 4: Export elements
    els.forEach(function (el) {
      if (el._skipExport) return;
      exportElement(slide, el, isDark, accent, pptx);
    });

    // STEP 5: Page number (3-way)
    if (slideData.num && !slideData.customFooter) {
      if (!SD.isStructuralSlide(slideData.layout)) {
        slide.addText(slideData.num, {
          x: 12.30, y: 7.05, w: 0.80, h: 0.30,
          fontSize: 7, fontFace: FONT, bold: false, color: '767676',
          align: 'right', margin: [0, 0, 0, 0]
        });
      } else {
        slide.addShape(pptx.shapes.RECTANGLE, { x: 12.15, y: 7.05, w: 0.01, h: 0.25, fill: { color: '999999' } });
        slide.addText(slideData.num, {
          x: 12.30, y: 7.05, w: 0.80, h: 0.30,
          fontSize: 10, fontFace: FONT, bold: true, color: '999999',
          align: 'left', margin: [0, 0, 0, 0]
        });
      }
    }

    // STEP 6: Notes + Logo
    if (slideData.notes) slide.addNotes(slideData.notes);

    if (_customLogo && !_noLogo) {
      var logoSrc = isDark ? _customLogo.src : _customLogo.srcInverted;
      var lw = _customLogo.width / 144; var lh = lw * (_customLogo.aspectRatio || 0.5);
      var pos = _customLogo.position || 'bottom-right';
      var lx, ly;
      if (pos === 'bottom-right') { lx = 12.15 - lw - 0.15; ly = 7.05 + (0.25 - lh) / 2; }
      else if (pos === 'top-right') { lx = 13.33 - lw - 0.3; ly = 0.15; }
      else if (pos === 'top-left') { lx = 0.3; ly = 0.15; }
      else { lx = 0.3; ly = 7.05; }
      slide.addImage({ data: logoSrc, x: lx, y: ly, w: lw, h: lh });
    }
  });

  var title = (_config.title || 'Presentation').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 40);
  pptx.writeFile({ fileName: title + '_' + _D.length + 'slides.pptx' }).then(function () {
    if (downloadBtn) { downloadBtn.disabled = false; downloadBtn.textContent = '\u2B07 Download'; }
    showToast('PPTX downloaded!', 'ok');
  }).catch(function (err) {
    if (downloadBtn) { downloadBtn.disabled = false; downloadBtn.textContent = '\u2B07 Download'; }
    showToast('Export failed: ' + err.message, 'bad'); console.error('[SD] Export error:', err);
  });
} catch (err) {
  if (downloadBtn) { downloadBtn.disabled = false; downloadBtn.textContent = '\u2B07 Download'; }
  showToast('Export failed: ' + err.message, 'bad'); console.error('[SD] Export error:', err);
}
}

// ============================================================
// PPTX ELEMENT EXPORTERS
// ============================================================

function exportElement(slide, el, isDark, accent, pptx) {
  var m = { t: exportText, s: exportShape, o: exportOval, d: exportDivider, p: exportPill, b: exportBar, chart: exportChart, tbl: exportTable, i: exportIcon, img: exportImage };
  var fn = m[el.type]; if (fn) fn(slide, el, isDark, accent, pptx);
}

function exportText(slide, el, isDark) {
  var isCompact = el.w <= 0.80 && el.h <= 0.80;
  var textStyle = SD.getTextStyle(el); var exportedText = el.text || '';
  if (['L1','L2','L3','L5'].indexOf(textStyle) > -1) exportedText = exportedText.toUpperCase();
  var cs = 0;
  if (textStyle === 'L1') cs = 12; else if (textStyle === 'L3') cs = 3; else if (textStyle === 'L2') cs = 2; else if (textStyle === 'L5') cs = 4;
  var ts = SD.TEXT_STYLES[textStyle];
  slide.addText(exportedText, {
    x: el.x, y: el.y, w: el.w, h: el.h, fontSize: el.size, fontFace: FONT,
    bold: ts.weight >= 700 || el.bold, italic: !!el.italic,
    color: SD.colorForPptx(el.color || 'body', isDark),
    align: el.align || (isCompact ? 'center' : 'left'), valign: el.valign || 'top',
    charSpacing: cs, lineSpacingMultiple: isCompact ? 1.0 : 1.35,
    wrap: !isCompact, margin: [0,0,0,0], shrinkText: isCompact
  });
}

function exportShape(slide, el, isDark, accent, pptx) {
  // Image placeholder: export as addImage for "Change Picture..." support
  if (el._imgPlaceholder) {
    var phData = generatePlaceholderImage(el.w, el.h, isDark);
    slide.addImage({ data: phData, x: el.x, y: el.y, w: el.w, h: el.h });
    return;
  }

  // [v6.0.8] Gradient fill support for imageCards
  var fillOpt;
  if (el._pptxGradient) {
    fillOpt = { type:'gradient', stops: el._pptxGradient };
  } else {
    fillOpt = { color: SD.colorForPptx(el.fill || 'cardBg', isDark) };
  }

  var opts = { x: el.x, y: el.y, w: el.w, h: el.h, fill: fillOpt };
  if (el.border) opts.line = { color: SD.colorForPptx(el.border, isDark), width: 1 };
  if (el.transparency) opts.fill.transparency = el.transparency;
  if (!isDark && el.fill === 'cardBg' && !el.noShadow && !el._pptxGradient) opts.shadow = { type:'outer', color:'000000', blur:4, offset:2, angle:135, opacity:0.08 };
  slide.addShape(pptx.shapes.RECTANGLE, opts);
}

function exportOval(slide, el, isDark, accent, pptx) { slide.addShape(pptx.shapes.OVAL, { x:el.x, y:el.y, w:el.w, h:el.h, fill:{color:SD.colorForPptx(el.fill||'accent',isDark)} }); }
function exportDivider(slide, el, isDark, accent, pptx) { slide.addShape(pptx.shapes.RECTANGLE, { x:el.x, y:el.y, w:el.w, h:0.015, fill:{color:SD.colorForPptx(el.color||'ltGray',isDark)} }); }

function exportPill(slide, el, isDark, accent, pptx) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x:el.x, y:el.y, w:el.w, h:el.h, fill:{color:SD.colorForPptx(el.fill||'accent',isDark)}, rectRadius:0.15 });
  slide.addText(el.text||'', { x:el.x, y:el.y, w:el.w, h:el.h, fontSize:el.size||9, fontFace:FONT, bold:true, color:SD.colorForPptx(el.color||'white',isDark), align:'center', valign:'middle', margin:[0,0,0,0] });
}

function exportBar(slide, el, isDark, accent, pptx) { slide.addShape(pptx.shapes.RECTANGLE, { x:el.x, y:el.y, w:el.w, h:el.h, fill:{color:SD.colorForPptx(el.fill||'accent',isDark)} }); }

function exportIcon(slide, el, isDark) {
var color = SD.colorForPptx(el.color || 'accent', isDark);
var sizePx = Math.round(Math.min(el.w, el.h) * 72 * 0.55);
var key = el.icon + '_' + sizePx + '_#' + color;

// Use pre-rendered PNG from cache
if (_iconCache[key]) {
  slide.addImage({ data: _iconCache[key], x: el.x, y: el.y, w: el.w, h: el.h });
  return;
}
// Fallback: emoji as text
var scale = (el.w >= 0.45) ? 0.50 : 0.42;
slide.addText(el.icon || '', { x: el.x, y: el.y, w: el.w, h: el.h,
  fontSize: Math.min(el.w, el.h) * 72 * scale,
  align: 'center', valign: 'middle', margin: [0,0,0,0], lineSpacingMultiple: 1.0 });
}

function exportChart(slide, el, isDark, accent, pptx) {
  var ctm = { bar:'BAR', line:'LINE', pie:'PIE', doughnut:'DOUGHNUT', area:'AREA' };
  var pt = pptx.charts[ctm[el.chartType]||'BAR']; var opts = el.opts||{};
  var rc; var ct = opts.chartColors||null;
  if (ct) rc = ct.map(function(t){return SD.colorForPptx(t,isDark);}); else rc = SD.CHART_SERIES.map(function(h){return h.replace('#','');});
  var co = { x:el.x, y:el.y, w:el.w, h:el.h, chartColors:rc, showValue:opts.showValue!==false, showTitle:!!opts.showTitle, title:opts.title||'',
    titleColor:SD.colorForPptx('title',isDark), titleFontSize:12, showLegend:opts.showLegend||false, legendPos:opts.legendPos||'b', legendColor:SD.colorForPptx('body',isDark),
    chartArea:{fill:{color:isDark?'535B69':'FFFFFF'},roundedCorners:true}, valGridLine:{color:isDark?'535B69':'E2E8F0',size:0.5}, catGridLine:{style:'none'} };
  if (el.chartType==='bar'||el.chartType==='line'||el.chartType==='area') {
    co.barGrouping=opts.barGrouping||'clustered'; co.barDir=opts.barDir||'bar'; co.valAxisHidden=opts.valAxisHidden||false;
    co.catAxisLabelColor=SD.colorForPptx('body',isDark); co.valAxisLabelColor=SD.colorForPptx('body',isDark);
    if (el.chartType==='bar') co.dataLabelPosition=opts.dataLabelPosition||'outEnd';
  }
  if (el.chartType==='pie'||el.chartType==='doughnut') {
    co.showPercent=opts.showPercent!==false; co.showValue=opts.showValue||false;
    co.dataLabelColor=SD.colorForPptx(opts.dataLabelColor||'white',isDark);
    if (el.chartType==='doughnut') co.holeSize=opts.holeSize||70;
  }
  slide.addChart(pt, el.data, co);
}

function exportTable(slide, el, isDark) {
  var headers=el.headers||[]; var rows=el.rows||[]; var tr=[];
  if (headers.length) { tr.push(headers.map(function(h){return{text:h,options:{bold:true,fill:{color:SD.colorForPptx('accent',isDark)},color:'FFFFFF',fontSize:11,fontFace:FONT}};})); }
  rows.forEach(function(row,ri) {
    tr.push((Array.isArray(row)?row:[row]).map(function(cell){return{text:String(cell),options:{fontSize:10,fontFace:FONT,color:SD.colorForPptx('body',isDark),fill:ri%2===0?{color:isDark?'535B69':'F5F5F5'}:{color:isDark?'2A2A2A':'FFFFFF'}}};}));
  });
  slide.addTable(tr, { x:el.x, y:el.y, w:el.w, fontSize:10, fontFace:FONT, border:{type:'solid',color:'CCCCCC',pt:0.5}, colW:el.colW||undefined });
}

function exportImage(slide, el) {
  if (el.src) { var c = _imageCache[el.src]; if (c) slide.addImage({data:c,x:el.x,y:el.y,w:el.w,h:el.h}); else console.warn('[deck-shell] Image not cached: '+el.src); return; }
  var imgEl = document.getElementById(el.ref); if (!imgEl) return;
  var img = imgEl.querySelector('img');
  if (img && img.src && img.src.indexOf('data:') === 0) slide.addImage({data:img.src,x:el.x,y:el.y,w:el.w,h:el.h});
}

// ============================================================
// deckInit
// ============================================================

function deckInit(config) {
config = config || {}; _config = config; _D = window.D || [];
_totalSlides = _D.length; _noLogo = !!config.noLogo; _imageMode = !!config.imageMode;
injectStyles();

if (config.accent) SD.setAccent(config.accent);
else if (window.AH) SD.setAccent(window.AH, window.AL, window.AD);

if (config.footer) SD.setFooter(config.footer);

if (config.contentFooter === false || config.contentFooter === 'none') SD.setContentFooter(null);
else if (config.contentFooter) SD.setContentFooter(config.contentFooter);

window._deckTitle = config.title || 'Presentation';

var vp = document.getElementById('sd-viewport');
if (!vp && !_imageMode) { vp = document.createElement('div'); vp.id = 'sd-viewport'; document.body.appendChild(vp); }
if (!_imageMode && vp) SD.renderAll(_D, vp);

if (window.DeckLayouts && window.DeckLayouts.getPrefetchUrls) window.DeckLayouts.getPrefetchUrls().forEach(prefetchImage);

// Pre-render icons for PPTX export
if (window.DeckIcons) {
  _D.forEach(function(slideData) {
    var els = [];
    if (slideData.layout && window.DeckLayouts) els = window.DeckLayouts.dispatch(slideData);
    else els = slideData.els || [];
    els.forEach(function(el) {
      if (el.type === 'i' && el.icon) {
        var isDark = !!slideData.dark;
        var color = SD.resolveColor(el.color || 'accent', isDark);
        var size = Math.round(Math.min(el.w, el.h) * 72 * 0.55);
        prerenderIcon(el.icon, size, color);
      }
    });
  });
}

var container = _imageMode ? (document.getElementById('sw') || document.body) : document.body;
var toolbar = buildToolbar(container);
var toolbarRight = toolbar.querySelector('.sd-toolbar-right');
var colorPicker = buildColorPicker(toolbarRight);

toolbarRight.querySelector('.sd-color-btn').addEventListener('click', function () {
  closeAllPanels(); colorPicker.style.display = colorPicker.style.display === 'none' ? 'flex' : 'none';
});
buildNotesPanel();
toolbarRight.querySelector('.sd-notes-btn').addEventListener('click', function () { closeAllPanels(); toggleNotesPanel(); });
buildLogoPanel();
toolbarRight.querySelector('.sd-logo-btn').addEventListener('click', function () { closeAllPanels(); toggleLogoPanel(); });
toolbarRight.querySelector('.sd-download-btn').addEventListener('click', exportPPTX);

setupKeyboard();
window.addEventListener('resize', scaleViewport); scaleViewport();
toolbar.style.borderBottomColor = SD.getAccent().mid;
showSlide(0);
}

// ============================================================
// PUBLIC API
// ============================================================

window.StandardShell = {
  init: deckInit, showSlide: showSlide, exportPPTX: exportPPTX, rerenderAll: rerenderAll,
  showToast: showToast, closeAllPanels: closeAllPanels,
  getConfig: function () { return _config; },
  getState: function () { return { currentSlide:_currentSlide, totalSlides:_totalSlides, customLogo:_customLogo, noLogo:_noLogo, imageMode:_imageMode }; }
};
window.deckInit = deckInit;

})();