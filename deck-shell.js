/* ============================================================
 deck-shell.js v6.0.2 -- UI Shell & PPTX Export
 Depends on: standard-deck.js, deck-layouts.js, pptxgen.bundle.js
 Phase 2A: Background picker, Pantone PPTX masters, footer config
 v6.0.1:  charSpacing for L1-L5, card shadows, chart polish,
          object reuse safety
 v6.0.2:  customFooter support, no-footer PPTX masters,
          image prefetch cache, bgImage slide backgrounds,
          exportImage src support for external URLs
 ============================================================
 WARNING: PptxGenJS mutates option objects in-place (e.g.
 converting shadow/margin values to EMU). Never share option
 objects between addText/addShape/addChart calls. Create
 fresh objects for every call.
 ============================================================ */

(function () {
'use strict';

var SD = window.StandardDeck;
if (!SD) {
console.error('[deck-shell] standard-deck.js must load first');
return;
}

var FONT = 'Mazda Type, Classico URW, Montserrat, sans-serif';

var _D             = [];
var _config        = {};
var _currentSlide  = 0;
var _totalSlides   = 0;
var _customLogo    = null;
var _noLogo        = false;
var _imageMode     = false;
var _imageCache    = {};

// ============================================================
// IMAGE PREFETCH CACHE [v6.0.2]
// Uses Image() constructor (governed by img-src CSP, not
// connect-src) to load external assets for PPTX export.
// Gracefully skips on CORS or CSP failures.
// ============================================================

function prefetchImage(url) {
  if (_imageCache[url]) return;
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    try {
      _imageCache[url] = canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('[deck-shell] CORS blocked base64 conversion for: ' + url);
    }
  };
  img.onerror = function () {
    console.warn('[deck-shell] Failed to prefetch: ' + url);
  };
  img.src = url;
}

// ============================================================
// STYLES
// ============================================================

function injectStyles() {
var css = [
  '*, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }',
  'body { background:#111; font-family:DM Sans,sans-serif; display:flex; flex-direction:column; align-items:center; min-height:100vh; overflow-x:hidden; }',

  '.sd-toolbar {',
  '  display: flex;',
  '  justify-content: space-between;',
  '  align-items: center;',
  '  padding: 8px 16px;',
  '  background: #191919;',
  '  border-bottom: 2px solid #333;',
  '  font-family: DM Sans, sans-serif;',
  '  font-size: 13px;',
  '  color: #F5F5F5;',
  '  position: sticky;',
  '  top: 0;',
  '  z-index: 1000;',
  '  width: 100%;',
  '}',
  '.sd-toolbar-left,',
  '.sd-toolbar-right {',
  '  display: flex;',
  '  align-items: center;',
  '  gap: 8px;',
  '}',
  '.sd-btn {',
  '  background: #363732;',
  '  color: #F5F5F5;',
  '  border: none;',
  '  padding: 6px 12px;',
  '  border-radius: 4px;',
  '  cursor: pointer;',
  '  font-size: 12px;',
  '  font-family: inherit;',
  '  transition: background 0.15s;',
  '}',
  '.sd-btn:hover { background: #53544A; }',
  '.sd-btn:disabled { opacity: 0.3; cursor: default; }',
  '.sd-slide-counter {',
  '  margin: 0 12px;',
  '  color: #8B8C81;',
  '}',
  '.sd-slide-counter .sd-current {',
  '  color: #F5F5F5;',
  '  font-weight: 600;',
  '}',
  '.sd-btn-download {',
  '  background: #D50032 !important;',
  '  color: #FFFFFF !important;',
  '  font-weight: 600;',
  '}',
  '.sd-btn-download:hover { background: #B5002A !important; }',

  '#sd-viewport { position:relative; width:1920px; height:1200px; transform-origin:top center; margin:20px auto 0; }',
  '.slide { position:absolute; top:0; left:0; width:1920px; height:1200px; overflow:hidden; opacity:0; transition:opacity 0.3s ease; pointer-events:none; }',
  '.slide.active { opacity:1; pointer-events:auto; }',

  '.sd-color-picker {',
  '  display: none;',
  '  flex-direction: column;',
  '  gap: 10px;',
  '  position: absolute;',
  '  top: 100%;',
  '  right: 0;',
  '  margin-top: 8px;',
  '  padding: 14px;',
  '  background: #191919;',
  '  border: 1px solid #363732;',
  '  border-radius: 6px;',
  '  z-index: 1100;',
  '  min-width: 240px;',
  '}',
  '.sd-picker-label {',
  '  font-size: 10px;',
  '  text-transform: uppercase;',
  '  letter-spacing: 0.08em;',
  '  color: #8B8C81;',
  '  margin-bottom: 4px;',
  '}',
  '.sd-swatch-row {',
  '  display: flex;',
  '  flex-wrap: wrap;',
  '  gap: 6px;',
  '}',
  '.sd-swatch {',
  '  width: 30px;',
  '  height: 30px;',
  '  border-radius: 6px;',
  '  cursor: pointer;',
  '  border: 3px solid transparent;',
  '  transition: border-color 0.2s, transform 0.15s;',
  '}',
  '.sd-swatch:hover { transform: scale(1.1); }',
  '.sd-swatch.active { border-color: #FFFFFF; }',
  '.sd-bg-btn {',
  '  padding: 5px 10px;',
  '  border-radius: 4px;',
  '  cursor: pointer;',
  '  border: 2px solid transparent;',
  '  font-size: 11px;',
  '  font-family: DM Sans, sans-serif;',
  '  transition: border-color 0.2s;',
  '}',
  '.sd-bg-btn.active { border-color: #FFFFFF; }',
  '.sd-bg-btn:hover { border-color: #8B8C81; }',
  '.sd-picker-divider {',
  '  height: 1px;',
  '  background: #363732;',
  '}',
  '.sd-hex-row {',
  '  display: flex;',
  '  align-items: center;',
  '  gap: 6px;',
  '}',
  '.sd-hex-row input {',
  '  background: #2a2a2a;',
  '  border: 1px solid #444;',
  '  color: #eee;',
  '  padding: 6px 8px;',
  '  border-radius: 4px;',
  '  font-size: 12px;',
  '  width: 90px;',
  '}',
  '.sd-hex-row button {',
  '  background: #363732;',
  '  color: #ccc;',
  '  border: none;',
  '  padding: 6px 10px;',
  '  border-radius: 4px;',
  '  cursor: pointer;',
  '  font-size: 11px;',
  '}',

  '.sd-notes-panel {',
  '  position: fixed;',
  '  right: 0;',
  '  top: 44px;',
  '  width: 320px;',
  '  max-height: calc(100vh - 44px);',
  '  background: #191919;',
  '  border-left: 1px solid #363732;',
  '  overflow-y: auto;',
  '  z-index: 900;',
  '}',
  '.sd-notes-header {',
  '  display: flex;',
  '  justify-content: space-between;',
  '  align-items: center;',
  '  padding: 12px 16px;',
  '  border-bottom: 1px solid #363732;',
  '  color: #F5F5F5;',
  '  font-weight: 600;',
  '  font-size: 13px;',
  '}',
  '.sd-notes-content {',
  '  padding: 16px;',
  '  color: #C2C4B8;',
  '  font-size: 13px;',
  '  line-height: 1.6;',
  '}',

  '.sd-logo-panel {',
  '  position: fixed;',
  '  bottom: 0;',
  '  left: 50%;',
  '  transform: translateX(-50%);',
  '  width: 100%;',
  '  max-width: 600px;',
  '  background: #191919;',
  '  border: 1px solid #363732;',
  '  border-bottom: none;',
  '  border-radius: 8px 8px 0 0;',
  '  padding: 20px 24px;',
  '  z-index: 950;',
  '}',
  '.sd-logo-preview {',
  '  width: 120px;',
  '  height: 80px;',
  '  background: #2a2a2a;',
  '  border-radius: 6px;',
  '  display: flex;',
  '  align-items: center;',
  '  justify-content: center;',
  '  margin-bottom: 12px;',
  '  overflow: hidden;',
  '}',
  '.sd-logo-preview img { max-width:100%; max-height:100%; }',
  '.sd-logo-controls {',
  '  display: flex;',
  '  align-items: center;',
  '  gap: 12px;',
  '  flex-wrap: wrap;',
  '  margin-top: 12px;',
  '}',
  '.sd-logo-controls label { color: #aaa; font-size: 13px; }',
  '.sd-logo-controls input[type=range] { width: 150px; }',
  '.sd-logo-controls select {',
  '  background: #2a2a2a;',
  '  color: #ddd;',
  '  border: 1px solid #444;',
  '  padding: 6px;',
  '  border-radius: 4px;',
  '}',

  '.sd-toast {',
  '  position: fixed;',
  '  bottom: 20px;',
  '  left: 50%;',
  '  transform: translateX(-50%);',
  '  padding: 10px 20px;',
  '  border-radius: 6px;',
  '  font-size: 13px;',
  '  font-family: DM Sans, sans-serif;',
  '  z-index: 2000;',
  '  transition: opacity 0.3s;',
  '}',
  '.sd-toast-ok   { background: #28A745; color: #FFF; }',
  '.sd-toast-warn { background: #E67E00; color: #FFF; }',
  '.sd-toast-bad  { background: #C12638; color: #FFF; }'
].join('\n');

var style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
}

// ============================================================
// VIEWPORT SCALING
// ============================================================

function scaleViewport() {
var vp = document.getElementById('sd-viewport');
if (!vp) return;
var toolbarH = 60;
var availW = window.innerWidth - 40;
var availH = window.innerHeight - toolbarH - 20;
var scale = Math.min(availW / 1920, availH / 1200);
scale = Math.min(scale, 1);
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
  var sfs = document.querySelectorAll('#sw .sf, #sd-viewport .sf');
  sfs.forEach(function (sf, i) {
    sf.style.display = (i === _currentSlide) ? 'block' : 'none';
  });
} else {
  var slides = document.querySelectorAll('#sd-viewport .slide');
  slides.forEach(function (s) { s.classList.remove('active'); });
  if (slides[index]) slides[index].classList.add('active');
}

var currentEl = document.querySelector('.sd-current');
if (currentEl) currentEl.textContent = _currentSlide + 1;

var prevBtn = document.querySelector('.sd-prev');
var nextBtn = document.querySelector('.sd-next');
if (prevBtn) prevBtn.disabled = (_currentSlide === 0);
if (nextBtn) nextBtn.disabled = (_currentSlide === _totalSlides - 1);

updateNotes();
}

// ============================================================
// TOP TOOLBAR
// ============================================================

function buildToolbar(container) {
var existing = document.querySelector('.sd-toolbar');
if (existing) existing.remove();

var toolbar = document.createElement('div');
toolbar.className = 'sd-toolbar';
toolbar.innerHTML = [
  '<div class="sd-toolbar-left">',
  '  <button class="sd-btn sd-prev" title="Previous slide">â—€</button>',
  '  <span class="sd-slide-counter">',
  '    Slide <span class="sd-current">1</span>',
  '    / <span class="sd-total">' + _totalSlides + '</span>',
  '  </span>',
  '  <button class="sd-btn sd-next" title="Next slide">â–¶</button>',
  '</div>',
  '<div class="sd-toolbar-right">',
  '  <button class="sd-btn sd-color-btn" title="Color & Background">ðŸŽ¨ Color</button>',
  '  <button class="sd-btn sd-notes-btn" title="Toggle Notes">ðŸ“ Notes</button>',
  '  <button class="sd-btn sd-logo-btn" title="Upload Logo">ðŸ–¼ Logo</button>',
  '  <button class="sd-btn sd-btn-download sd-download-btn" title="Download PPTX">â¬‡ Download</button>',
  '</div>'
].join('');

if (container && container.firstChild) {
  container.insertBefore(toolbar, container.firstChild);
} else {
  document.body.insertBefore(toolbar, document.body.firstChild);
}

toolbar.querySelector('.sd-prev').addEventListener('click', function () {
  showSlide(_currentSlide - 1);
});
toolbar.querySelector('.sd-next').addEventListener('click', function () {
  showSlide(_currentSlide + 1);
});

return toolbar;
}

// ============================================================
// V6.0: COLOR & BACKGROUND PICKER
// ============================================================

function buildColorPicker(toolbarRight) {
var picker = document.createElement('div');
picker.className = 'sd-color-picker';

var accentLabel = document.createElement('div');
accentLabel.className = 'sd-picker-label';
accentLabel.textContent = 'Accent Color';
picker.appendChild(accentLabel);

var accentRow = document.createElement('div');
accentRow.className = 'sd-swatch-row';

var families = SD.ACCENT_FAMILIES;
var currentAccent = SD.getAccent().mid;

Object.keys(families).forEach(function (name) {
  var fam = families[name];
  var swatch = document.createElement('button');
  swatch.className = 'sd-swatch' + (fam.mid === currentAccent ? ' active' : '');
  swatch.style.background = fam.mid;
  swatch.title = name.charAt(0).toUpperCase() + name.slice(1);
  swatch.setAttribute('data-family', name);
  swatch.addEventListener('click', function () {
    applyColorFamily(name);
    picker.style.display = 'none';
  });
  accentRow.appendChild(swatch);
});
picker.appendChild(accentRow);

var div1 = document.createElement('div');
div1.className = 'sd-picker-divider';
picker.appendChild(div1);

var bgLabel = document.createElement('div');
bgLabel.className = 'sd-picker-label';
bgLabel.textContent = 'Background';
picker.appendChild(bgLabel);

var bgRow = document.createElement('div');
bgRow.className = 'sd-swatch-row';

var bgModes = [
  { name: 'standard', label: 'Standard', lightBg: '#F5F5F5', darkBg: '#191919' },
  { name: 'brand',    label: 'Brand',    lightBg: '#F5F1EB', darkBg: '#191919' },
  { name: 'deep',     label: 'Deep',     lightBg: '#F5F5F5', darkBg: '#12171F' }
];

var currentBg = SD.getBgMode();

bgModes.forEach(function (mode) {
  var btn = document.createElement('button');
  btn.className = 'sd-bg-btn' + (mode.name === currentBg ? ' active' : '');
  btn.setAttribute('data-bgmode', mode.name);
  btn.style.background = 'linear-gradient(135deg, ' + mode.lightBg + ' 50%, ' + mode.darkBg + ' 50%)';
  btn.style.color = '#F5F5F5';
  btn.title = mode.label + ' (' + mode.lightBg + ' / ' + mode.darkBg + ')';
  btn.textContent = mode.label;
  btn.addEventListener('click', function () {
    applyBgMode(mode.name);
    picker.style.display = 'none';
  });
  bgRow.appendChild(btn);
});
picker.appendChild(bgRow);

var div2 = document.createElement('div');
div2.className = 'sd-picker-divider';
picker.appendChild(div2);

var hexRow = document.createElement('div');
hexRow.className = 'sd-hex-row';
hexRow.innerHTML = [
'<span style="color:#8B8C81;font-size:10px;margin-right:4px;">Custom:</span>',
'<input type="text" class="sd-hex-input" placeholder="#8E1C2E" maxlength="7">',
'<button class="sd-hex-apply">Apply</button>',
'<button class="sd-hex-reset">Reset All</button>'
].join('');
picker.appendChild(hexRow);

toolbarRight.style.position = 'relative';
toolbarRight.appendChild(picker);

hexRow.querySelector('.sd-hex-apply').addEventListener('click', function () {
  var hex = hexRow.querySelector('.sd-hex-input').value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    SD.setAccent(hex);
    rerenderAll();
    updateSwatchStates();
    picker.style.display = 'none';
  }
});
hexRow.querySelector('.sd-hex-reset').addEventListener('click', function () {
  SD.setAccent('red');
  SD.setBgMode('standard');
  rerenderAll();
  updateSwatchStates();
  hexRow.querySelector('.sd-hex-input').value = '';
  picker.style.display = 'none';
});

return picker;
}

function applyColorFamily(familyName) {
SD.setAccent(familyName);
rerenderAll();
updateSwatchStates();
}

function applyBgMode(mode) {
SD.setBgMode(mode);
rerenderAll();
updateSwatchStates();
}

function updateSwatchStates() {
var current = SD.getAccent().name;
document.querySelectorAll('.sd-swatch').forEach(function (s) {
  s.classList.toggle('active', s.getAttribute('data-family') === current);
});
var currentBg = SD.getBgMode();
document.querySelectorAll('.sd-bg-btn').forEach(function (b) {
  b.classList.toggle('active', b.getAttribute('data-bgmode') === currentBg);
});
var toolbar = document.querySelector('.sd-toolbar');
if (toolbar) {
  toolbar.style.borderBottomColor = SD.getAccent().mid;
}
}

// ============================================================
// NOTES SIDE PANEL
// ============================================================

function buildNotesPanel(container) {
var existing = document.querySelector('.sd-notes-panel');
if (existing) existing.remove();

var panel = document.createElement('div');
panel.className = 'sd-notes-panel';
panel.style.display = 'none';
panel.innerHTML = [
  '<div class="sd-notes-header">',
  '  <span>Speaker Notes</span>',
  '  <button class="sd-btn sd-notes-close">âœ•</button>',
  '</div>',
  '<div class="sd-notes-content">No speaker notes for this slide.</div>'
].join('');

(container || document.body).appendChild(panel);

panel.querySelector('.sd-notes-close').addEventListener('click', function () {
  panel.style.display = 'none';
});

return panel;
}

function updateNotes() {
var content = document.querySelector('.sd-notes-content');
if (!content) return;
var slide = _D[_currentSlide];
if (slide && slide.notes) {
  content.textContent = slide.notes;
  content.style.fontStyle = 'normal';
  content.style.color = '#C2C4B8';
} else {
  content.textContent = 'No speaker notes for this slide.';
  content.style.fontStyle = 'italic';
  content.style.color = '#8B8C81';
}
}

function toggleNotesPanel() {
var panel = document.querySelector('.sd-notes-panel');
if (!panel) return;
panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// ============================================================
// LOGO MANAGER
// ============================================================

function buildLogoPanel(container) {
var existing = document.querySelector('.sd-logo-panel');
if (existing) existing.remove();

var panel = document.createElement('div');
panel.className = 'sd-logo-panel';
panel.style.display = 'none';
panel.innerHTML = [
  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">',
  '  <span style="color:#F5F5F5;font-weight:600;font-size:13px;">Logo Manager</span>',
  '  <button class="sd-btn sd-logo-close">âœ•</button>',
  '</div>',
  '<div class="sd-logo-preview"><span style="color:#666;font-size:13px;">No logo uploaded</span></div>',
  '<button class="sd-btn sd-logo-upload" style="margin-bottom:12px;">ðŸ“ Upload Logo</button>',
  '<input type="file" class="sd-logo-file" accept=".png,.jpg,.jpeg,.svg" style="display:none;">',
  '<div class="sd-logo-controls" style="display:none;">',
  '  <label>Size:</label>',
  '  <input type="range" class="sd-logo-size" min="40" max="200" value="80">',
  '  <span class="sd-logo-size-lbl">80px</span>',
  '  <label>Position:</label>',
  '  <select class="sd-logo-pos">',
  '    <option value="bottom-right" selected>Bottom Right</option>',
  '    <option value="top-right">Top Right</option>',
  '    <option value="top-left">Top Left</option>',
  '    <option value="bottom-left">Bottom Left</option>',
  '  </select>',
  '  <button class="sd-btn sd-logo-apply">Apply to All</button>',
  '  <button class="sd-btn sd-logo-remove">Remove</button>',
  '</div>'
].join('');

(container || document.body).appendChild(panel);

panel.querySelector('.sd-logo-close').addEventListener('click', function () {
  panel.style.display = 'none';
});
panel.querySelector('.sd-logo-upload').addEventListener('click', function () {
  panel.querySelector('.sd-logo-file').click();
});

panel.querySelector('.sd-logo-file').addEventListener('change', function (e) {
  var file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('Logo must be under 2MB.', 'warn');
    return;
  }
  var reader = new FileReader();
  reader.onload = function (ev) {
    var dataUri = ev.target.result;
    var tempImg = new Image();
    tempImg.onload = function () {
      var aspectRatio = tempImg.naturalHeight / tempImg.naturalWidth;

      var invertCanvas = document.createElement('canvas');
      invertCanvas.width = tempImg.naturalWidth;
      invertCanvas.height = tempImg.naturalHeight;
      var ictx = invertCanvas.getContext('2d');
      ictx.drawImage(tempImg, 0, 0);
      var imageData = ictx.getImageData(0, 0, invertCanvas.width, invertCanvas.height);
      var pixels = imageData.data;
      for (var p = 0; p < pixels.length; p += 4) {
        pixels[p]     = 255 - pixels[p];
        pixels[p + 1] = 255 - pixels[p + 1];
        pixels[p + 2] = 255 - pixels[p + 2];
      }
      ictx.putImageData(imageData, 0, 0);
      var invertedUri = invertCanvas.toDataURL('image/png');

      panel.querySelector('.sd-logo-preview').innerHTML =
        '<img src="' + dataUri + '">';
      panel.querySelector('.sd-logo-controls').style.display = 'flex';
      _customLogo = {
        src: dataUri,
        srcInverted: invertedUri,
        width: 80,
        aspectRatio: aspectRatio,
        position: 'bottom-right'
      };
    };
    tempImg.src = dataUri;
  };
  reader.readAsDataURL(file);
});

panel.querySelector('.sd-logo-size').addEventListener('input', function (e) {
  var val = e.target.value;
  panel.querySelector('.sd-logo-size-lbl').textContent = val + 'px';
  if (_customLogo) _customLogo.width = parseInt(val);
});
panel.querySelector('.sd-logo-pos').addEventListener('change', function (e) {
  if (_customLogo) _customLogo.position = e.target.value;
});
panel.querySelector('.sd-logo-apply').addEventListener('click', function () {
  if (_customLogo) applyLogoToSlides();
});
panel.querySelector('.sd-logo-remove').addEventListener('click', function () {
  _customLogo = null;
  removeLogoFromSlides();
  panel.querySelector('.sd-logo-preview').innerHTML =
    '<span style="color:#666;font-size:13px;">No logo uploaded</span>';
  panel.querySelector('.sd-logo-controls').style.display = 'none';
});

return panel;
}

function applyLogoToSlides() {
removeLogoFromSlides();
var slides = document.querySelectorAll('#sd-viewport .slide, #sw .sf');
slides.forEach(function (slide, i) {
  var isDark = _D[i] && _D[i].dark;
  var logoSrc = isDark
    ? _customLogo.src
    : _customLogo.srcInverted;

  var img = document.createElement('img');
  img.src = logoSrc;
  img.className = 'logo-custom';

  var pos = _customLogo.position || 'bottom-right';

  if (pos === 'bottom-right') {
    var slot = slide.querySelector('.logo-footer-slot');
    if (slot) {
      img.style.width = _customLogo.width + 'px';
      img.style.height = 'auto';
      slot.appendChild(img);
      return;
    }
  }

  img.style.position = 'absolute';
  img.style.width = _customLogo.width + 'px';
  img.style.height = 'auto';
  if (pos.indexOf('top') > -1)    img.style.top = '30px';
  if (pos.indexOf('bottom') > -1) img.style.bottom = '30px';
  if (pos.indexOf('right') > -1)  img.style.right = '100px';
  if (pos.indexOf('left') > -1)   img.style.left = '50px';
  slide.appendChild(img);
});
}

function removeLogoFromSlides() {
document.querySelectorAll('.logo-custom').forEach(function (el) {
  el.remove();
});
}

function toggleLogoPanel() {
var panel = document.querySelector('.sd-logo-panel');
if (!panel) return;
panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type) {
var toast = document.createElement('div');
toast.className = 'sd-toast sd-toast-' + (type || 'ok');
toast.textContent = message;
document.body.appendChild(toast);
setTimeout(function () {
  toast.style.opacity = '0';
  setTimeout(function () {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}, 3000);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

function setupKeyboard() {
document.addEventListener('keydown', function (e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      showSlide(_currentSlide - 1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      showSlide(_currentSlide + 1);
      break;
    case 'n':
    case 'N':
      if (!e.ctrlKey && !e.metaKey) {
        toggleNotesPanel();
      }
      break;
    case 'Escape':
      closeAllPanels();
      break;
  }
});
}

function closeAllPanels() {
var notes = document.querySelector('.sd-notes-panel');
var picker = document.querySelector('.sd-color-picker');
var logo = document.querySelector('.sd-logo-panel');
if (notes) notes.style.display = 'none';
if (picker) picker.style.display = 'none';
if (logo) logo.style.display = 'none';
}

// ============================================================
// RERENDER
// ============================================================

function rerenderAll() {
var vp = document.getElementById('sd-viewport');
if (!vp || _imageMode) return;
SD.renderAll(_D, vp);
_totalSlides = _D.length;
showSlide(_currentSlide);
if (_customLogo) applyLogoToSlides();
}

// ============================================================
// V6.0: PPTX EXPORT [v6.0.2: customFooter, bgImage, no-footer masters]
// ============================================================

function exportPPTX() {
var downloadBtn = document.querySelector('.sd-download-btn');

if (typeof PptxGenJS === 'undefined' && typeof pptxgen === 'undefined') {
  showToast('Export library still loading. Please try again in a moment.', 'warn');
  return;
}

if (!_D || !_D.length) {
  showToast('No slide data found.', 'bad');
  return;
}

if (downloadBtn && downloadBtn.disabled) return;
if (downloadBtn) {
  downloadBtn.disabled = true;
  downloadBtn.textContent = '\u23F3 Exporting...';
}

try {
  var pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'SD_LAYOUT', width: 13.33, height: 7.5 });
  pptx.layout = 'SD_LAYOUT';
  pptx.author = 'Standard Presentation Builder';
  pptx.subject = _config.title || 'Presentation';

  var accent = SD.getAccent();
  var footerText = SD.getFooterText();
  var bgMode = SD.getBgMode();

  var darkBgColor = bgMode === 'deep' ? '12171F' : '191919';
  var lightBgColor = bgMode === 'brand' ? 'F5F1EB' : 'F5F5F5';

  pptx.defineSlideMaster({
    title: 'SD_DARK',
    background: { color: darkBgColor },
    objects: [
      { text: { text: footerText, options: {
        x: 0.3, y: 7.05, w: 4, h: 0.3,
        fontSize: 9, fontFace: FONT, color: '8B8C81',
        bold: true, letterSpacing: 1.5
      } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'SD_LIGHT',
    background: { color: lightBgColor },
    objects: [
      { text: { text: footerText, options: {
        x: 0.3, y: 7.05, w: 4, h: 0.3,
        fontSize: 9, fontFace: FONT, color: '53544A',
        bold: true, letterSpacing: 1.5
      } } }
    ]
  });

  // v6.0.2: No-footer masters for slides with custom footers
  pptx.defineSlideMaster({
    title: 'SD_DARK_NOFOOTER',
    background: { color: darkBgColor }
  });

  pptx.defineSlideMaster({
    title: 'SD_LIGHT_NOFOOTER',
    background: { color: lightBgColor }
  });

  _D.forEach(function (slideData, index) {
    var isDark = !!slideData.dark;
    var master = isDark ? 'SD_DARK' : 'SD_LIGHT';

    // v6.0.2: Use no-footer master for slides with custom footer
    if (slideData.customFooter) {
      master = isDark ? 'SD_DARK_NOFOOTER' : 'SD_LIGHT_NOFOOTER';
    }

    var slide = pptx.addSlide({ masterName: master });

    // v6.0.2: Override background with cached image if available
    if (slideData.bgImage && _imageCache[slideData.bgImage]) {
      slide.background = { data: _imageCache[slideData.bgImage] };
    }

    var els;
    if (slideData.layout && window.DeckLayouts) {
      els = window.DeckLayouts.dispatch(slideData);
    } else {
      els = slideData.els || [];
    }

    els = SD.enforceWidthRule(els);
    els.forEach(function (el) {
      exportElement(slide, el, isDark, accent, pptx);
    });

    // v6.0.2: Guard num export with customFooter check
    if (slideData.num && !slideData.customFooter) {
      var numColor = isDark ? '8B8C81' : '53544A';

      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 12.15, y: 7.05, w: 0.01, h: 0.25,
        fill: { color: numColor }
      });

      slide.addText(slideData.num, {
        x: 12.30, y: 7.05, w: 0.80, h: 0.30,
        fontSize: 10, fontFace: FONT,
        bold: true, color: numColor,
        align: 'left', margin: [0, 0, 0, 0]
      });
    }

    if (slideData.notes) slide.addNotes(slideData.notes);

    if (_customLogo && !_noLogo) {
      var logoSrc = isDark
        ? _customLogo.src
        : _customLogo.srcInverted;
      var logoWInches = _customLogo.width / 144;
      var logoHInches = logoWInches * (_customLogo.aspectRatio || 0.5);
      var pos = _customLogo.position || 'bottom-right';

      var logoX, logoY;
      if (pos === 'bottom-right') {
        logoX = 12.15 - logoWInches - 0.15;
        logoY = 7.05 + (0.25 - logoHInches) / 2;
      } else if (pos === 'top-right') {
        logoX = 13.33 - logoWInches - 0.3;
        logoY = 0.15;
      } else if (pos === 'top-left') {
        logoX = 0.3;
        logoY = 0.15;
      } else {
        logoX = 0.3;
        logoY = 7.05;
      }

      slide.addImage({
        data: logoSrc,
        x: logoX, y: logoY,
        w: logoWInches,
        h: logoHInches
      });
    }
  });

  var title = sanitizeFileName(_config.title || 'Presentation');
  var fileName = title + '_' + _D.length + 'slides.pptx';

  pptx.writeFile({ fileName: fileName }).then(function () {
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.textContent = '\u2B07 Download';
    }
    showToast('PPTX downloaded successfully!', 'ok');
  }).catch(function (err) {
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.textContent = '\u2B07 Download';
    }
    showToast('Export failed: ' + err.message, 'bad');
    console.error('[SD] Export error:', err);
  });

} catch (err) {
  if (downloadBtn) {
    downloadBtn.disabled = false;
    downloadBtn.textContent = '\u2B07 Download';
  }
  showToast('Export failed: ' + err.message, 'bad');
  console.error('[SD] Export error:', err);
}
}

// ============================================================
// PPTX ELEMENT EXPORTERS
// ============================================================

function exportElement(slide, el, isDark, accent, pptx) {
var exporters = {
  t: exportText, s: exportShape, o: exportOval,
  d: exportDivider, p: exportPill, b: exportBar,
  chart: exportChart, tbl: exportTable,
  i: exportIcon, img: exportImage
};
var fn = exporters[el.type];
if (fn) fn(slide, el, isDark, accent, pptx);
}

function exportText(slide, el, isDark) {
var isCompact = el.w <= 0.80 && el.h <= 0.80;
var textStyle = SD.getTextStyle(el);
var exportedText = el.text || '';

if (['L1', 'L2', 'L3', 'L5'].indexOf(textStyle) > -1) {
  exportedText = exportedText.toUpperCase();
}

var charSpace = 0;
if (textStyle === 'L1') charSpace = 12;
else if (textStyle === 'L3') charSpace = 3;
else if (textStyle === 'L2') charSpace = 2;
else if (textStyle === 'L5') charSpace = 4;

var ts = SD.TEXT_STYLES[textStyle];

slide.addText(exportedText, {
  x: el.x, y: el.y, w: el.w, h: el.h,
  fontSize: el.size,
  fontFace: FONT,
  bold: ts.weight >= 700 || el.font === 'H' || el.bold,
  italic: !!el.italic,
  color: SD.colorForPptx(el.color || 'body', isDark),
  align: el.align || (isCompact ? 'center' : 'left'),
  valign: el.valign || 'top',
  charSpacing: charSpace,
  lineSpacingMultiple: isCompact ? 1.0 : 1.35,
  wrap: !isCompact,
  margin: [0, 0, 0, 0],
  shrinkText: isCompact
});
}

function exportShape(slide, el, isDark, accent, pptx) {
var opts = {
  x: el.x, y: el.y, w: el.w, h: el.h,
  fill: { color: SD.colorForPptx(el.fill || 'cardBg', isDark) }
};
if (el.border) opts.line = { color: SD.colorForPptx(el.border, isDark), width: 1 };
if (el.transparency) opts.fill.transparency = el.transparency;

if (!isDark && el.fill === 'cardBg' && !el.noShadow) {
  opts.shadow = {
    type: 'outer',
    color: '000000',
    blur: 4,
    offset: 2,
    angle: 135,
    opacity: 0.08
  };
}

slide.addShape(pptx.shapes.RECTANGLE, opts);
}

function exportOval(slide, el, isDark, accent, pptx) {
slide.addShape(pptx.shapes.OVAL, {
  x: el.x, y: el.y, w: el.w, h: el.h,
  fill: { color: SD.colorForPptx(el.fill || 'accent', isDark) }
});
}

function exportDivider(slide, el, isDark, accent, pptx) {
slide.addShape(pptx.shapes.RECTANGLE, {
  x: el.x, y: el.y, w: el.w, h: 0.015,
  fill: { color: SD.colorForPptx(el.color || 'ltGray', isDark) }
});
}

function exportPill(slide, el, isDark, accent, pptx) {
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: el.x, y: el.y, w: el.w, h: el.h,
  fill: { color: SD.colorForPptx(el.fill || 'accent', isDark) },
  rectRadius: 0.15
});
slide.addText(el.text || '', {
  x: el.x, y: el.y, w: el.w, h: el.h,
  fontSize: el.size || 9,
  fontFace: FONT,
  bold: true,
  color: SD.colorForPptx(el.color || 'white', isDark),
  align: 'center', valign: 'middle',
  margin: [0, 0, 0, 0]
});
}

function exportBar(slide, el, isDark, accent, pptx) {
slide.addShape(pptx.shapes.RECTANGLE, {
  x: el.x, y: el.y, w: el.w, h: el.h,
  fill: { color: SD.colorForPptx(el.fill || 'accent', isDark) }
});
}

function exportIcon(slide, el) {
var scale = (el.w >= 0.45) ? 0.50 : 0.42;
var fontSize = Math.min(el.w, el.h) * 72 * scale;
slide.addText(el.icon || '', {
  x: el.x, y: el.y, w: el.w, h: el.h,
  fontSize: fontSize, align: 'center', valign: 'middle',
  margin: [0, 0, 0, 0], lineSpacingMultiple: 1.0
});
}

function exportChart(slide, el, isDark, accent, pptx) {
var chartTypeMap = {
  bar: 'BAR', line: 'LINE', pie: 'PIE',
  doughnut: 'DOUGHNUT', area: 'AREA'
};
var pptxType = pptx.charts[chartTypeMap[el.chartType] || 'BAR'];
var opts = el.opts || {};

var colorTokens = opts.chartColors || null;
var resolvedColors;
if (colorTokens) {
  resolvedColors = colorTokens.map(function (token) {
    return SD.colorForPptx(token, isDark);
  });
} else {
  resolvedColors = SD.CHART_SERIES.map(function (hex) {
    return hex.replace('#', '');
  });
}

var chartOpts = {
  x: el.x, y: el.y, w: el.w, h: el.h,
  chartColors: resolvedColors,
  showValue: opts.showValue !== false,
  showTitle: !!opts.showTitle,
  title: opts.title || '',
  titleColor: SD.colorForPptx('title', isDark),
  titleFontSize: 12,
  showLegend: opts.showLegend || false,
  legendPos: opts.legendPos || 'b',
  legendColor: SD.colorForPptx('body', isDark),

  chartArea: {
    fill: { color: isDark ? '363732' : 'FFFFFF' },
    roundedCorners: true
  },

  valGridLine: {
    color: isDark ? '53544A' : 'E2E8F0',
    size: 0.5
  },
  catGridLine: { style: 'none' }
};

if (el.chartType === 'bar' || el.chartType === 'line' || el.chartType === 'area') {
  chartOpts.barGrouping = opts.barGrouping || 'clustered';
  chartOpts.barDir = opts.barDir || 'bar';
  chartOpts.valAxisHidden = opts.valAxisHidden || false;
  chartOpts.catAxisLabelColor = SD.colorForPptx('body', isDark);
  chartOpts.valAxisLabelColor = SD.colorForPptx('body', isDark);

  if (el.chartType === 'bar') {
    chartOpts.dataLabelPosition = opts.dataLabelPosition || 'outEnd';
  }
}
if (el.chartType === 'pie' || el.chartType === 'doughnut') {
  chartOpts.showPercent = opts.showPercent !== false;
  chartOpts.showValue = opts.showValue || false;
  chartOpts.dataLabelColor = SD.colorForPptx(opts.dataLabelColor || 'white', isDark);
  if (el.chartType === 'doughnut') chartOpts.holeSize = opts.holeSize || 70;
}
slide.addChart(pptxType, el.data, chartOpts);
}

function exportTable(slide, el, isDark, accent, pptx) {
var headers = el.headers || [];
var rows = el.rows || [];
var tableRows = [];

if (headers.length) {
  tableRows.push(headers.map(function (h) {
    return {
      text: h,
      options: {
        bold: true,
        fill: { color: SD.colorForPptx('accent', isDark) },
        color: 'FFFFFF',
        fontSize: 11,
        fontFace: FONT
      }
    };
  }));
}
rows.forEach(function (row, ri) {
  tableRows.push((Array.isArray(row) ? row : [row]).map(function (cell) {
    return {
      text: String(cell),
      options: {
        fontSize: 10,
        fontFace: FONT,
        color: SD.colorForPptx('body', isDark),
        fill: ri % 2 === 0
          ? { color: isDark ? '363732' : 'F5F5F5' }
          : { color: isDark ? '2A2A2A' : 'FFFFFF' }
      }
    };
  }));
});
slide.addTable(tableRows, {
  x: el.x, y: el.y, w: el.w,
  fontSize: 10,
  fontFace: FONT,
  border: { type: 'solid', color: 'C2C4B8', pt: 0.5 },
  colW: el.colW || undefined
});
}

// ============================================================
// IMAGE EXPORTER [v6.0.2: src support with prefetch cache]
// ============================================================

function exportImage(slide, el) {
  // v6.0.2: External URL images via prefetch cache
  if (el.src) {
    var cached = _imageCache[el.src];
    if (cached) {
      slide.addImage({ data: cached, x: el.x, y: el.y, w: el.w, h: el.h });
    } else {
      console.warn('[deck-shell] Image not in cache (CSP may have blocked prefetch): ' + el.src);
    }
    return;
  }
  // Existing ref-based image logic
  var imgEl = document.getElementById(el.ref);
  if (!imgEl) return;
  var img = imgEl.querySelector('img');
  if (img && img.src && img.src.indexOf('data:') === 0) {
    slide.addImage({ data: img.src, x: el.x, y: el.y, w: el.w, h: el.h });
  }
}

// ============================================================
// UTILITIES
// ============================================================

function getLogoPosition(logo) {
var pos = logo.position || 'bottom-right';
var wInches = logo.width / 144;
return {
  x: pos.indexOf('right') > -1 ? 13.33 - wInches - 0.3 : 0.3,
  y: pos.indexOf('bottom') > -1 ? 7.0 : 0.15
};
}

function sanitizeFileName(title) {
return title.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 40);
}

// ============================================================
// V6.0: deckInit [v6.0.2: asset prefetch after renderAll]
// ============================================================

function deckInit(config) {
config = config || {};
_config = config;
_D = window.D || [];
_totalSlides = _D.length;
_noLogo = !!config.noLogo;
_imageMode = !!config.imageMode;

injectStyles();

if (config.accent) {
  SD.setAccent(config.accent);
} else if (window.AH) {
  SD.setAccent(window.AH, window.AL, window.AD);
}

if (config.bgMode) {
  SD.setBgMode(config.bgMode);
} else {
  SD.setBgMode(SD.detectBgMode(config.title));
}

if (config.footer) {
  SD.setFooter(config.footer);
}

window._deckTitle = config.title || 'Presentation';
window._noLogo = _noLogo;
window._imageMode = _imageMode;

var vp = document.getElementById('sd-viewport');
if (!vp && !_imageMode) {
  vp = document.createElement('div');
  vp.id = 'sd-viewport';
  document.body.appendChild(vp);
}

if (!_imageMode && vp) {
  SD.renderAll(_D, vp);
}

// v6.0.2: Pre-fetch external assets for PPTX export
// Runs after renderAll so layout functions have registered their URLs
if (window.DeckLayouts && window.DeckLayouts.getPrefetchUrls) {
  window.DeckLayouts.getPrefetchUrls().forEach(prefetchImage);
}

var container = _imageMode
  ? (document.getElementById('sw') || document.body)
  : document.body;

var toolbar = buildToolbar(container);
var toolbarRight = toolbar.querySelector('.sd-toolbar-right');

var colorPicker = buildColorPicker(toolbarRight);
toolbarRight.querySelector('.sd-color-btn').addEventListener('click', function () {
  var np = document.querySelector('.sd-notes-panel');
  var lp = document.querySelector('.sd-logo-panel');
  if (np) np.style.display = 'none';
  if (lp) lp.style.display = 'none';
  colorPicker.style.display = colorPicker.style.display === 'none' ? 'flex' : 'none';
});

var notesPanel = buildNotesPanel();
toolbarRight.querySelector('.sd-notes-btn').addEventListener('click', function () {
  var lp = document.querySelector('.sd-logo-panel');
  if (lp) lp.style.display = 'none';
  colorPicker.style.display = 'none';
  toggleNotesPanel();
});

var logoPanel = buildLogoPanel();
toolbarRight.querySelector('.sd-logo-btn').addEventListener('click', function () {
  var np = document.querySelector('.sd-notes-panel');
  if (np) np.style.display = 'none';
  colorPicker.style.display = 'none';
  toggleLogoPanel();
});

toolbarRight.querySelector('.sd-download-btn').addEventListener('click', function () {
  exportPPTX();
});

setupKeyboard();

window.addEventListener('resize', scaleViewport);
scaleViewport();

toolbar.style.borderBottomColor = SD.getAccent().mid;

showSlide(0);
}

// ============================================================
// PUBLIC API
// ============================================================

window.StandardShell = {
init: deckInit,
showSlide: showSlide,
exportPPTX: exportPPTX,
rerenderAll: rerenderAll,
showToast: showToast,
closeAllPanels: closeAllPanels,
getConfig: function () { return _config; },
getState: function () {
  return {
    currentSlide: _currentSlide,
    totalSlides: _totalSlides,
    customLogo: _customLogo,
    noLogo: _noLogo,
    imageMode: _imageMode
  };
}
};
window.deckInit = deckInit;

})();
