/* ============================================================
 standard-deck.js v6.0.1 -- Core Rendering Engine
 Standard Presentation Builder
 Phase 2A: Pantone colors, background modes, cream/deep
 v6.0.1:  customFooter support, bgGradient support,
          renderImage src support for external URLs
 ============================================================ */

(function () {
'use strict';

var CANVAS_W = 1920;
var CANVAS_H = 1200;
var SLIDE_W  = 13.33;
var SLIDE_H  = 7.5;
var SX       = CANVAS_W / SLIDE_W;
var SY       = CANVAS_H / SLIDE_H;
var PT_PX    = SY / 72;

// ============================================================
// V6.0 LAYOUT CONSTANTS
// ============================================================

var SD_CONST = {
  SLIDE_W:     13.33,
  SLIDE_H:     7.50,
  SAFE_X_MIN:  0.50,
  SAFE_X_MAX:  12.92,
  SAFE_W:      12.42,
  SAFE_Y_MIN:  0.75,
  SAFE_Y_MAX:  7.00,
  BAR_H:       0.08,
  TAG_Y:       0.75,
  TAG_H:       0.25,
  TITLE_Y:     1.10,
  TITLE_H_1:   0.55,
  TITLE_H_2:   0.90,
  HEADER_END:  1.75,
  CONTENT_Y:   2.10,
  CONTENT_Y_2: 2.30,
  CONTENT_END: 6.80,
  FOOTER_Y:    7.00,
  GAP:         0.25,
  TEXT_RATIO:  0.80,
GRID: {
  full:  { cols: [{ x: 0.50, w: 12.42 }] },
  col1:  { cols: [{ x: 0.50, w: 12.42 }] },
  col2:  { cols: [{ x: 0.50, w: 6.09 },
                  { x: 6.84, w: 6.08 }] },
  col3:  { cols: [{ x: 0.50, w: 3.97 },
                  { x: 4.72, w: 3.97 },
                  { x: 8.94, w: 3.97 }] },
  col4:  { cols: [{ x: 0.50,  w: 2.92 },
                  { x: 3.67,  w: 2.92 },
                  { x: 6.84,  w: 2.92 },
                  { x: 10.01, w: 2.92 }] },
  col5:  { cols: [{ x: 0.50,  w: 2.28 },
                  { x: 3.03,  w: 2.28 },
                  { x: 5.56,  w: 2.28 },
                  { x: 8.09,  w: 2.28 },
                  { x: 10.62, w: 2.28 }] }
},
  TITLE_WRAP_THRESHOLD: 36
};

var SAFE = {
  x:  SD_CONST.SAFE_X_MIN,
  y:  SD_CONST.SAFE_Y_MIN,
  x2: SD_CONST.SAFE_X_MAX,
  y2: SD_CONST.SAFE_Y_MAX
};

// ============================================================
// V6.0: PANTONE-ALIGNED PALETTE
// ============================================================

var PALETTE = {
  black:     '#191919',
  deepBlack: '#12171F',
  white:     '#F5F5F5',
  cream:     '#F5F1EB',
  dkGray:    '#363732',
  mdGray:    '#53544A',
  gray:      '#8B8C81',
  ltGray:    '#C2C4B8',
  ok:        '#28A745',
  warn:      '#E67E00',
  bad:       '#C12638'
};

var ACCENT_FAMILIES = {
  red:      { light: '#E5D0C9', mid: '#8E1C2E', dark: '#5C1220' },
  navy:     { light: '#C4C6D0', mid: '#002544', dark: '#001830' },
  green:    { light: '#CACEC7', mid: '#00412E', dark: '#002B1E' },
  plum:     { light: '#D4C8D1', mid: '#4B1848', dark: '#2F0F2E' },
  gold:     { light: '#F9D28C', mid: '#C4962C', dark: '#8B6A00' },
  teal:     { light: '#9ECFCF', mid: '#1A7A7A', dark: '#0F4E4E' },
  charcoal: { light: '#C2C4B8', mid: '#53544A', dark: '#363732' }
};

var CHART_SERIES = ['#8E1C2E', '#002544', '#00412E', '#4B1848', '#000000'];
var CHART_SERIES_LIGHT = ['#B67367', '#5A657E', '#627967', '#89657F', '#888888'];

var _accentLight = '#E5D0C9';
var _accentMid   = '#8E1C2E';
var _accentDark  = '#5C1220';
var _familyName  = 'red';

var _bgMode = 'standard';

var FONT_MAP = {
  H: { face: 'Mazda Type, Classico URW, Montserrat, sans-serif', weight: 700 },
  B: { face: 'Mazda Type, Classico URW, Montserrat, sans-serif', weight: 400 }
};

var LIMITS = {
  bullets: 5, tableRows: 8, tableCols: 5,
  cards: 4, stats: 6, paragraphs: 3, rows: 4,
  cardTitleChars: 30, statLabelChars: 25,
  coverTitleChars: 40, titleChars: 48
};

var MIN_SIZES = {
  coverTitle: 36, title: 33, cardTitle: 21,
  subtitle: 18, body: 15, table: 12,
  statValue: 42, tag: 10, footnote: 9
};

// ============================================================
// V6.0: TYPOGRAPHY HIERARCHY (auto-applied)
// ============================================================

var TEXT_STYLES = {
  L1: { transform: 'uppercase', spacing: '0.25em', weight: 700 },
  L2: { transform: 'uppercase', spacing: '0.05em', weight: 700 },
  L3: { transform: 'uppercase', spacing: '0.08em', weight: 500 },
  L4: { transform: 'none',      spacing: 'normal', weight: 400 },
  L5: { transform: 'uppercase', spacing: '0.10em', weight: 400 }
};

var _currentSlideLayout = null;

function getTextStyle(el) {
if (el.textStyle && TEXT_STYLES[el.textStyle]) {
  return el.textStyle;
}
if ((_currentSlideLayout === 'cover' ||
     _currentSlideLayout === 'closing') && el.size >= 36) {
  return 'L1';
}
if ((_currentSlideLayout === 'divider' ||
     _currentSlideLayout === 'coverloc') && el.size >= 36) {
  return 'L4';
}
if (el.size >= 30 && el.font === 'H' && !el.textStyle) {
  return 'L2';
}
if (el.color === 'accent' && el.size <= 14 && el.font === 'H') {
  return 'L3';
}
if (el.size >= 18 && el.size <= 24 && el.font === 'H') {
  return 'L3';
}
if (el.size <= 10 || el.color === 'muted') {
  return 'L5';
}
return 'L4';
}

// ============================================================
// V6.0: DATE GENERATION
// ============================================================

var MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY',
  'JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER',
  'NOVEMBER','DECEMBER'];

function getFooterDate() {
  var now = new Date();
  return MONTHS[now.getMonth()] + ' ' + now.getFullYear();
}

// ============================================================
// V6.0: COLOR RESOLUTION (bgMode-aware)
// ============================================================

function resolveColor(token, isDark) {
if (!token || typeof token !== 'string') return isDark ? PALETTE.white : PALETTE.black;
if (token.charAt(0) === '#') return token;
var semantics = {
  title:      isDark ? PALETTE.white    : PALETTE.black,
  body:       isDark ? PALETTE.ltGray   : PALETTE.mdGray,
  sub:        isDark ? _accentLight     : PALETTE.mdGray,
  muted:      PALETTE.gray,
  accent:     _accentMid,
  accentLt:   _accentLight,
  accentDk:   _accentDark,
  cardBg:     isDark ? PALETTE.dkGray   : '#FFFFFF',
  cardBorder: isDark ? 'transparent'    : PALETTE.ltGray,
  slideBg:    isDark
    ? (_bgMode === 'deep' ? PALETTE.deepBlack : PALETTE.black)
    : (_bgMode === 'brand' ? PALETTE.cream : PALETTE.white),
  white:      '#FFFFFF',
  black:      '#000000',
  cream:      PALETTE.cream,
  deepBlack:  PALETTE.deepBlack
};
if (semantics[token]) return semantics[token];
if (PALETTE[token]) return PALETTE[token];
return isDark ? PALETTE.white : PALETTE.black;
}

function colorForPptx(token, isDark) {
return resolveColor(token, isDark).replace('#', '');
}

// ============================================================
// V6.0: BACKGROUND MODE
// ============================================================

function setBgMode(mode) {
  if (['standard', 'brand', 'deep'].indexOf(mode) > -1) {
    _bgMode = mode;
  }
}

function getBgMode() {
  return _bgMode;
}

function detectBgMode(title) {
  var t = (title || '').toLowerCase();
  if (/brand|messaging|positioning|portfolio|move and be moved|campaign|creative/.test(t)) {
    return 'brand';
  }
  if (/ai|technical|strategy|digital|platform|cdp|summit|engineering/.test(t)) {
    return 'deep';
  }
  return 'standard';
}

// ============================================================
// COORDINATE CONVERSION
// ============================================================

function toX(inches) { return Math.round(inches * SX); }
function toY(inches) { return Math.round(inches * SY); }
function ptToPx(pt)  { return Math.round(pt * PT_PX); }

// ============================================================
// TITLE HEIGHT DETECTION
// ============================================================

function getTitleMetrics(title) {
  var len = (title || '').length;
  if (len > SD_CONST.TITLE_WRAP_THRESHOLD) {
    return {
      titleH:   SD_CONST.TITLE_H_2,
      contentY: SD_CONST.CONTENT_Y_2
    };
  }
  return {
    titleH:   SD_CONST.TITLE_H_1,
    contentY: SD_CONST.CONTENT_Y
  };
}

// ============================================================
// SAFE AREA VALIDATION
// ============================================================

function validatePosition(el, slideIndex) {
  if (!el || typeof el.x === 'undefined' || typeof el.y === 'undefined') return;

  var C = SD_CONST;
  var right  = el.x + (el.w || 0);
  var bottom = el.y + (el.h || 0);

  if (el.type === 't' && el.y < C.CONTENT_Y) {
    if (el.y >= C.TAG_Y && el.y <= C.TITLE_Y + C.TITLE_H_2) {
      return;
    }
  }

  if (el.y < C.CONTENT_Y && el.type !== 't') {
    console.warn('[SD] Slide ' + slideIndex +
      ': Element at y:' + el.y +
      ' is above CONTENT_Y (' + C.CONTENT_Y + ')');
  }

  if (bottom > C.CONTENT_END) {
    console.warn('[SD] Slide ' + slideIndex +
      ': Element bottom at y:' + bottom.toFixed(2) +
      ' exceeds CONTENT_END (' + C.CONTENT_END + ')');
  }

  if (right > C.SAFE_X_MAX) {
    console.warn('[SD] Slide ' + slideIndex +
      ': Element right edge at x:' + right.toFixed(2) +
      ' exceeds SAFE_X_MAX (' + C.SAFE_X_MAX + ')');
  }
}

// ============================================================
// SLIDE & ELEMENT VALIDATION
// ============================================================

function validateSlide(slide, index) {
  var warn = function (msg) {
    console.warn('[standard-deck] Slide ' + index + ': ' + msg);
  };
  if (slide.layout && slide.els) {
    warn('has both layout and els -- layout takes precedence');
    delete slide.els;
  }
  var maxTitle = (slide.layout === 'cover' || slide.layout === 'closing')
    ? LIMITS.coverTitleChars : LIMITS.titleChars;
  if (slide.title && slide.title.length > maxTitle) {
    warn('title "' + slide.title.substring(0, 20) + '..." exceeds '
      + maxTitle + ' chars -- truncating');
    slide.title = slide.title.substring(0, maxTitle - 3) + '...';
  }
  if (slide.els) {
    slide.els = slide.els.map(function (el) {
      return validateElement(el, slide, index);
    });
  }
  return slide;
}

function validateElement(el, slide, slideIndex) {
  if (el.type === 't' && typeof el.size === 'number') {
    if (el.size < MIN_SIZES.footnote) {
      el.size = MIN_SIZES.footnote;
    }
  }
  if (typeof el.x === 'number' && el.x < SD_CONST.SAFE_X_MIN) {
    el.x = SD_CONST.SAFE_X_MIN;
  }
  if (typeof el.y === 'number' && el.y < SD_CONST.SAFE_Y_MIN) {
    el.y = SD_CONST.SAFE_Y_MIN;
  }
  if (el.type === 't' && el._parentShape) {
    var maxW = el._parentShape.w * SD_CONST.TEXT_RATIO;
    if (el.w > maxW) {
      el.x = el._parentShape.x + (el._parentShape.w - maxW) / 2;
      el.w = maxW;
    }
  }
  return el;
}

function enforceWidthRule(els) {
  var shapes = els.filter(function (e) {
    return e.type === 's' || e.type === 'o';
  });
  els.forEach(function (el) {
    if (el.type !== 't') return;
    for (var i = 0; i < shapes.length; i++) {
      var s = shapes[i];
      if (el.x >= s.x && el.y >= s.y
        && el.x + el.w <= s.x + s.w + 0.01
        && el.y + el.h <= s.y + s.h + 0.01) {
        var maxW = s.w * SD_CONST.TEXT_RATIO;
        if (el.w > maxW) {
          el.x = s.x + (s.w - maxW) / 2;
          el.w = maxW;
        }
        break;
      }
    }
  });
  return els;
}

// ============================================================
// ELEMENT RENDERERS
// ============================================================

function renderElement(el, isDark) {
  var renderers = {
    t:     renderText,
    s:     renderShape,
    o:     renderOval,
    i:     renderIcon,
    d:     renderDivider,
    p:     renderPill,
    b:     renderBar,
    chart: renderChart,
    tbl:   renderTable,
    img:   renderImage
  };
  var fn = renderers[el.type];
  if (!fn) {
    console.warn('[standard-deck] Unknown element type: ' + el.type);
    return document.createElement('div');
  }
  return fn(el, isDark);
}

function renderText(el, isDark) {
  var div = document.createElement('div');
  var isTitle = (el.size >= 30);
  div.style.cssText = 'position:absolute;box-sizing:border-box;word-wrap:break-word;overflow:' + (isTitle ? 'visible' : 'hidden') + ';';
  div.style.left     = toX(el.x) + 'px';
  div.style.top      = toY(el.y) + 'px';
  div.style.width    = toX(el.w) + 'px';
  div.style.height   = toY(el.h) + 'px';
  div.style.fontSize = ptToPx(el.size) + 'px';
  div.style.color    = resolveColor(el.color || 'body', isDark);
  div.style.lineHeight = '1.35';
  var fm = FONT_MAP[el.font || 'B'];
  div.style.fontFamily = fm.face;
  div.style.fontWeight = fm.weight;
  if (el.bold) div.style.fontWeight = 700;
  if (el.italic) div.style.fontStyle = 'italic';

  var isCompact = el.w <= 0.80 && el.h <= 0.80;
  div.style.textAlign = el.align || (isCompact ? 'center' : 'left');

  var textStyle = getTextStyle(el);
  var ts = TEXT_STYLES[textStyle];
  div.style.textTransform = ts.transform;
  div.style.letterSpacing = ts.spacing;
  if (textStyle === 'L1') div.style.fontWeight = 700;

  if (el.valign === 'middle' || el.valign === 'bottom') {
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.justifyContent = el.valign === 'middle' ? 'center' : 'flex-end';
    if (isCompact || el.align === 'center') {
      div.style.alignItems = 'center';
    }
  }
  if (el.text && el.text.indexOf('\n') > -1) {
    el.text.split('\n').forEach(function (line, i) {
      if (i > 0) div.appendChild(document.createElement('br'));
      div.appendChild(document.createTextNode(line));
    });
  } else {
    var span = document.createElement('span');
    span.textContent = el.text || '';
    div.appendChild(span);
  }
  return div;
}

function renderShape(el, isDark) {
var div = document.createElement('div');
div.style.cssText = 'position:absolute;';
div.style.left   = toX(el.x) + 'px';
div.style.top    = toY(el.y) + 'px';
div.style.width  = toX(el.w) + 'px';
div.style.height = toY(el.h) + 'px';
div.style.backgroundColor = resolveColor(el.fill || 'cardBg', isDark);
if (el.border && typeof el.border === 'string') {
  div.style.border = '1px solid ' + resolveColor(el.border, isDark);
}
if (el.transparency) {
  div.style.opacity = (100 - el.transparency) / 100;
}
return div;
}

function renderOval(el, isDark) {
var div = renderShape(el, isDark);
div.style.borderRadius = '50%';
return div;
}

function renderIcon(el) {
var div = document.createElement('div');
div.style.cssText = 'position:absolute;display:flex;align-items:center;justify-content:center;line-height:1;';
div.style.left = toX(el.x) + 'px';
div.style.top = toY(el.y) + 'px';
div.style.width = toX(el.w) + 'px';
div.style.height = toY(el.h) + 'px';
var scale = (el.w >= 0.45) ? 0.55 : 0.45;
div.style.fontSize = Math.min(toX(el.w), toY(el.h)) * scale + 'px';
div.textContent = el.icon || '';
return div;
}

function renderDivider(el, isDark) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;';
  div.style.left            = toX(el.x) + 'px';
  div.style.top             = toY(el.y) + 'px';
  div.style.width           = toX(el.w) + 'px';
  div.style.height          = '0';
  div.style.borderTop       = '2px solid ' + resolveColor(el.color || 'ltGray', isDark);
  return div;
}

function renderPill(el, isDark) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;display:flex;align-items:center;justify-content:center;border-radius:100px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;';
  div.style.left            = toX(el.x) + 'px';
  div.style.top             = toY(el.y) + 'px';
  div.style.width           = toX(el.w) + 'px';
  div.style.height          = toY(el.h) + 'px';
  div.style.fontSize        = ptToPx(el.size || 9) + 'px';
  div.style.backgroundColor = resolveColor(el.fill || 'accent', isDark);
  div.style.color           = resolveColor(el.color || 'white', isDark);
  div.textContent           = el.text || '';
  return div;
}

function renderBar(el, isDark) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;';
  div.style.left            = toX(el.x) + 'px';
  div.style.top             = toY(el.y) + 'px';
  div.style.width           = toX(el.w) + 'px';
  div.style.height          = toY(el.h) + 'px';
  div.style.backgroundColor = resolveColor(el.fill || 'accent', isDark);
  return div;
}

// ============================================================
// CHART RENDERERS
// ============================================================

function renderChart(el, isDark) {
  var container = document.createElement('div');
  container.style.cssText = 'position:absolute;overflow:hidden;background:' + resolveColor('cardBg', isDark) + ';border:1px solid ' + resolveColor('ltGray', isDark) + ';';
  container.style.left   = toX(el.x) + 'px';
  container.style.top    = toY(el.y) + 'px';
  container.style.width  = toX(el.w) + 'px';
  container.style.height = toY(el.h) + 'px';
  var cw = toX(el.w);
  var ch = toY(el.h);
  var canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  container.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var data = el.data || [];
  var opts = el.opts || {};
  if (opts.showTitle && opts.title) {
    ctx.font = '600 ' + ptToPx(12) + 'px DM Sans, sans-serif';
    ctx.fillStyle = resolveColor('title', isDark);
    ctx.fillText(opts.title, 20, ptToPx(14) + 10);
  }
  var chartType = el.chartType || 'bar';
  if (chartType === 'bar') {
    renderBarChart(ctx, data, opts, cw, ch, isDark);
  } else if (chartType === 'line' || chartType === 'area') {
    renderLineChart(ctx, data, opts, cw, ch, isDark, chartType === 'area');
  } else if (chartType === 'pie' || chartType === 'doughnut') {
    renderPieChart(ctx, data, opts, cw, ch, isDark, chartType === 'doughnut');
  }
  return container;
}

function renderBarChart(ctx, data, opts, cw, ch, isDark) {
  if (!data.length || !data[0].values) return;
  var series   = data;
  var labels   = series[0].labels || [];
  var nGroups  = labels.length;
  var nSeries  = series.length;
  var maxVal   = 0;
  series.forEach(function (s) {
    s.values.forEach(function (v) {
      if (v > maxVal) maxVal = v;
    });
  });
  if (maxVal === 0) maxVal = 1;
  var padding  = { top: 60, right: 40, bottom: 50, left: 60 };
  var plotW    = cw - padding.left - padding.right;
  var plotH    = ch - padding.top - padding.bottom;
  var groupW   = plotW / nGroups;
  var barW     = (groupW * 0.7) / nSeries;
  var gap      = groupW * 0.3;
  var colors = resolveChartColors(opts.chartColors || null, nSeries, isDark);
  series.forEach(function (s, si) {
    s.values.forEach(function (val, vi) {
      var bx = padding.left + vi * groupW + gap / 2 + si * barW;
      var bh = (val / maxVal) * plotH;
      var by = padding.top + plotH - bh;
      ctx.fillStyle = colors[si];
      ctx.fillRect(bx, by, barW - 2, bh);
      if (opts.showValue) {
        ctx.font = '500 ' + ptToPx(8) + 'px DM Sans, sans-serif';
        ctx.fillStyle = resolveColor('title', isDark);
        ctx.textAlign = 'center';
        ctx.fillText(formatVal(val), bx + barW / 2, by - 6);
      }
    });
  });
  ctx.font = ptToPx(8) + 'px DM Sans, sans-serif';
  ctx.fillStyle = resolveColor('muted', isDark);
  ctx.textAlign = 'center';
  labels.forEach(function (lbl, i) {
    var lx = padding.left + i * groupW + groupW / 2;
    ctx.fillText(lbl, lx, ch - padding.bottom + 20);
  });
}

function renderLineChart(ctx, data, opts, cw, ch, isDark, isArea) {
  if (!data.length || !data[0].values) return;
  var series  = data;
  var labels  = series[0].labels || [];
  var nPoints = labels.length;
  var maxVal  = 0;
  series.forEach(function (s) {
    s.values.forEach(function (v) {
      if (v > maxVal) maxVal = v;
    });
  });
  if (maxVal === 0) maxVal = 1;
  var padding = { top: 60, right: 40, bottom: 50, left: 60 };
  var plotW   = cw - padding.left - padding.right;
  var plotH   = ch - padding.top - padding.bottom;
  var colors = resolveChartColors(opts.chartColors || null, series.length, isDark);
  series.forEach(function (s, si) {
    ctx.beginPath();
    ctx.strokeStyle = colors[si];
    ctx.lineWidth = 3;
    s.values.forEach(function (val, vi) {
      var px = padding.left + (vi / (nPoints - 1 || 1)) * plotW;
      var py = padding.top + plotH - (val / maxVal) * plotH;
      if (vi === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    if (isArea) {
      ctx.lineTo(padding.left + plotW, padding.top + plotH);
      ctx.lineTo(padding.left, padding.top + plotH);
      ctx.closePath();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = colors[si];
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
    ctx.stroke();
    s.values.forEach(function (val, vi) {
      var px = padding.left + (vi / (nPoints - 1 || 1)) * plotW;
      var py = padding.top + plotH - (val / maxVal) * plotH;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = colors[si];
      ctx.fill();
    });
  });
  ctx.font = ptToPx(8) + 'px DM Sans, sans-serif';
  ctx.fillStyle = resolveColor('muted', isDark);
  ctx.textAlign = 'center';
  labels.forEach(function (lbl, i) {
    var lx = padding.left + (i / (nPoints - 1 || 1)) * plotW;
    ctx.fillText(lbl, lx, ch - padding.bottom + 20);
  });
}

function renderPieChart(ctx, data, opts, cw, ch, isDark, isDoughnut) {
  if (!data.length || !data[0].values) return;
  var values = data[0].values;
  var labels = data[0].labels || [];
  var total  = values.reduce(function (a, b) { return a + b; }, 0);
  if (total === 0) return;
  var cx     = cw / 2;
  var cy     = ch / 2;
  var radius = Math.min(cw, ch) * 0.35;
  var hole   = isDoughnut ? radius * ((opts.holeSize || 70) / 100) : 0;
  var colors = resolveChartColors(opts.chartColors || null, values.length, isDark);
  var startAngle = -Math.PI / 2;
  values.forEach(function (val, i) {
    var sliceAngle = (val / total) * Math.PI * 2;
    var endAngle   = startAngle + sliceAngle;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    if (isDoughnut) {
      ctx.arc(cx, cy, hole, endAngle, startAngle, true);
    } else {
      ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    if (opts.showPercent !== false) {
      var midAngle = startAngle + sliceAngle / 2;
      var labelR   = isDoughnut ? (radius + hole) / 2 : radius * 0.65;
      var lx = cx + Math.cos(midAngle) * labelR;
      var ly = cy + Math.sin(midAngle) * labelR;
      ctx.font = '600 ' + ptToPx(9) + 'px DM Sans, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var pct = Math.round((val / total) * 100) + '%';
      ctx.fillText(pct, lx, ly);
    }
    startAngle = endAngle;
  });
  if (opts.showLegend !== false) {
    var legendY = cy + radius + 30;
    ctx.font = ptToPx(8) + 'px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    labels.forEach(function (lbl, i) {
      var lx = 40 + i * (cw / labels.length);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(lx, legendY, 12, 12);
      ctx.fillStyle = resolveColor('body', isDark);
      ctx.fillText(lbl, lx + 18, legendY);
    });
  }
}

function resolveChartColors(tokens, count, isDark) {
  var colors = [];
  for (var i = 0; i < count; i++) {
    if (tokens && tokens[i % tokens.length]) {
      var token = tokens[i % tokens.length];
      colors.push(resolveColor(token, isDark));
    } else {
      colors.push(CHART_SERIES[i % CHART_SERIES.length]);
    }
  }
  return colors;
}

function formatVal(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
  if (v % 1 !== 0) return v.toFixed(1);
  return v.toString();
}

// ============================================================
// TABLE RENDERER
// ============================================================

function renderTable(el, isDark) {
  var container = document.createElement('div');
  container.style.cssText = 'position:absolute;overflow:hidden;';
  container.style.left   = toX(el.x) + 'px';
  container.style.top    = toY(el.y) + 'px';
  container.style.width  = toX(el.w) + 'px';
  container.style.height = toY(el.h) + 'px';
  var table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-family:DM Sans,sans-serif;font-size:' + ptToPx(10) + 'px;';
  var headers = el.headers || [];
  var rows    = el.rows || [];
  var colW    = el.colW;
  if (headers.length) {
    var thead = document.createElement('thead');
    var tr    = document.createElement('tr');
    headers.forEach(function (h, i) {
      var th = document.createElement('th');
      th.textContent = h;
      th.style.cssText = 'padding:12px 16px;text-align:left;background:' + resolveColor('accent', isDark) + ';color:#FFFFFF;font-weight:600;border-bottom:2px solid ' + resolveColor('ltGray', isDark) + ';';
      if (colW && colW[i]) th.style.width = toX(colW[i]) + 'px';
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
  }
  var tbody = document.createElement('tbody');
  rows.forEach(function (row, ri) {
    var tr = document.createElement('tr');
    tr.style.background = ri % 2 === 0 ? 'transparent' : resolveColor(isDark ? 'dkGray' : 'ltGray', isDark) + '33';
    (Array.isArray(row) ? row : [row]).forEach(function (cell) {
      var td = document.createElement('td');
      td.textContent = cell;
      td.style.cssText = 'padding:10px 16px;border-bottom:1px solid ' + resolveColor('ltGray', isDark) + '44;color:' + resolveColor('body', isDark) + ';';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
  return container;
}

// ============================================================
// IMAGE RENDERER [v6.0.1: added src support for external URLs]
// ============================================================

function renderImage(el) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;overflow:hidden;';
  if (!el.src) div.style.background = '#E8E8E8';
  div.style.left   = toX(el.x) + 'px';
  div.style.top    = toY(el.y) + 'px';
  div.style.width  = toX(el.w) + 'px';
  div.style.height = toY(el.h) + 'px';
  if (el.ref) div.id = el.ref;
  if (el.src) {
    var img = document.createElement('img');
    img.src = el.src;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
    div.appendChild(img);
  }
  return div;
}

// ============================================================
// SLIDE RENDERING [v6.0.1: bgGradient + customFooter support]
// ============================================================

function renderSlide(slideData, index) {
  var isDark = !!slideData.dark;
  var slide = document.createElement('div');
  slide.className = 'slide' + (index === 0 ? ' active' : '');
  slide.style.cssText = 'position:absolute;top:0;left:0;width:1920px;height:1200px;overflow:hidden;background:' + resolveColor('slideBg', isDark) + ';';

  _currentSlideLayout = slideData.layout || null;
  var els;
  if (slideData.layout) {
    els = window.DeckLayouts ? window.DeckLayouts.dispatch(slideData) : [];
  } else {
    els = slideData.els || [];
  }

  // Custom background gradient (layout functions may set via cfg mutation)
  if (slideData.bgGradient) {
    slide.style.background = slideData.bgGradient;
  }

  els = enforceWidthRule(els);
  els.forEach(function (el) {
    validatePosition(el, index);
    slide.appendChild(renderElement(el, isDark));
  });

  // Footer (skipped if layout provides custom footer via cfg.customFooter)
  if (!slideData.customFooter) {
    var mutedColor = resolveColor('muted', isDark);
    var dateDiv = document.createElement('div');
    dateDiv.style.cssText = 'position:absolute;bottom:24px;left:40px;'
      + 'font-size:' + ptToPx(9) + 'px;'
      + 'font-weight:500;'
      + 'letter-spacing:0.15em;'
      + 'text-transform:uppercase;'
      + 'color:' + mutedColor + ';'
      + 'font-family:DM Sans,sans-serif;';
    dateDiv.textContent = _footerText || getFooterDate();
    slide.appendChild(dateDiv);

    if (slideData.num) {
      var footerRight = document.createElement('div');
      footerRight.style.cssText = 'position:absolute;bottom:24px;'
        + 'right:40px;display:flex;align-items:center;gap:12px;'
        + 'font-family:DM Sans,sans-serif;';

      var logoSlot = document.createElement('div');
      logoSlot.className = 'logo-footer-slot';
      logoSlot.style.cssText = 'display:flex;align-items:center;';
      footerRight.appendChild(logoSlot);

      var divLine = document.createElement('div');
      divLine.style.cssText = 'width:1px;height:20px;background:' + mutedColor + ';';
      footerRight.appendChild(divLine);

      var numSpan = document.createElement('span');
      numSpan.style.cssText = 'font-size:' + ptToPx(10) + 'px;'
        + 'font-weight:600;color:' + mutedColor + ';';
      numSpan.textContent = slideData.num;
      footerRight.appendChild(numSpan);

      slide.appendChild(footerRight);
    }
  } // end customFooter check

  return slide;
}

function renderAll(D, container) {
  container.innerHTML = '';
  D.forEach(function (slideData, i) {
    var validated = validateSlide(slideData, i);
    container.appendChild(renderSlide(validated, i));
  });
}

// ============================================================
// ACCENT / COLOR MANAGEMENT
// ============================================================

function setAccent(nameOrHex, light, dark) {
  if (ACCENT_FAMILIES[nameOrHex]) {
    var fam      = ACCENT_FAMILIES[nameOrHex];
    _accentLight = fam.light;
    _accentMid   = fam.mid;
    _accentDark  = fam.dark;
    _familyName  = nameOrHex;
  } else if (nameOrHex && nameOrHex.charAt(0) === '#') {
    _accentMid   = nameOrHex;
    _accentLight = light || adjustBrightness(nameOrHex, 60);
    _accentDark  = dark  || adjustBrightness(nameOrHex, -40);
    _familyName  = 'custom';
  }
}

function adjustBrightness(hex, amount) {
  hex = hex.replace('#', '');
  var r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + amount));
  var g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + amount));
  var b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + amount));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// ============================================================
// V6.0: CONFIGURABLE FOOTER
// ============================================================

var _footerText = null;

function setFooter(text) {
  if (text === 'confidential') {
    _footerText = 'S T R I C T L Y   C O N F I D E N T I A L';
  } else if (text === 'date' || text === null) {
    _footerText = null;
  } else {
    _footerText = text;
  }
}

function getFooterText() {
  return _footerText || getFooterDate();
}

// ============================================================
// PPTX EXPORT -- SAFE AREA
// ============================================================

var pptxSafeArea = {
  x: SD_CONST.SAFE_X_MIN,
  y: SD_CONST.SAFE_Y_MIN,
  w: SD_CONST.SAFE_W,
  h: SD_CONST.CONTENT_END - SD_CONST.SAFE_Y_MIN
};

// ============================================================
// PUBLIC API
// ============================================================

window.StandardDeck = {
  renderAll:        renderAll,
  renderSlide:      renderSlide,
  renderElement:    renderElement,
  resolveColor:     resolveColor,
  colorForPptx:     colorForPptx,
  setAccent:        setAccent,
  setBgMode:        setBgMode,
  getBgMode:        getBgMode,
  detectBgMode:     detectBgMode,
  setFooter:        setFooter,
  getFooterText:    getFooterText,
  validateSlide:    validateSlide,
  validatePosition: validatePosition,
  enforceWidthRule: enforceWidthRule,
  getTitleMetrics:  getTitleMetrics,
  getFooterDate:    getFooterDate,
  toX: toX, toY: toY, ptToPx: ptToPx,
  TEXT_STYLES:      TEXT_STYLES,
  getTextStyle:     getTextStyle,
  PALETTE:          PALETTE,
  ACCENT_FAMILIES:  ACCENT_FAMILIES,
  CHART_SERIES:     CHART_SERIES,
  CHART_SERIES_LIGHT: CHART_SERIES_LIGHT,
  FONT_MAP:         FONT_MAP,
  LIMITS:           LIMITS,
  MIN_SIZES:        MIN_SIZES,
  SAFE:             SAFE,
  SD_CONST:         SD_CONST,
  SLIDE_W:          SLIDE_W,
  SLIDE_H:          SLIDE_H,
  pptxSafeArea:     pptxSafeArea,
  getAccent:        function () {
    return {
      light: _accentLight, mid: _accentMid,
      dark: _accentDark, name: _familyName
    };
  }
};

})();
