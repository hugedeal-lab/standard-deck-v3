/* ============================================================
 deck-layouts.js v6.0.1 -- Layout Shortcut Library
 Depends on: standard-deck.js (for SD_CONST, getTitleMetrics)
 Phase 2C: Metrics spacing fix, 5 new layouts
           (pillar, fromto, capability, schedule, coverloc)
 v6.0.1:  Divider gap, pillar title spacing, card title wrap,
          stats dark-mode contrast, duplicate to include 
          claude approaches
 ============================================================ */

(function () {
'use strict';

var SD = window.StandardDeck;
if (!SD || !SD.SD_CONST) {
  console.error('[deck-layouts] FATAL: standard-deck.js v6.0+ must load first.');
  return;
}

var C = SD.SD_CONST;

// ============================================================
// SHARED HEADER RENDERER
// ============================================================

function renderHeader(slide) {
  var els = [];
  var metrics = SD.getTitleMetrics(slide.title);

  if (slide.tag) {
    els.push({
      type: 't', text: slide.tag,
      x: C.SAFE_X_MIN, y: C.TAG_Y, w: 11.00, h: C.TAG_H,
      font: 'H', size: 11, color: 'accent'
    });
  }

  if (slide.title) {
    els.push({
      type: 't', text: slide.title,
      x: C.SAFE_X_MIN, y: C.TITLE_Y, w: 11.00, h: metrics.titleH,
      font: 'H', size: 33, color: 'title'
    });
  }

  return { els: els, contentY: metrics.contentY };
}

// ============================================================
// GRID HELPER
// ============================================================

function getGrid(colCount) {
  var key = 'col' + colCount;
  return C.GRID[key] || C.GRID.col3;
}

// ============================================================
// LAYOUT: COVER
// ============================================================

function layoutCover(cfg) {
var els = [];
var titleLen = (cfg.title || '').length;

if (cfg.tag) {
  els.push({
    type: 't', text: cfg.tag, x: C.SAFE_X_MIN, y: C.TAG_Y,
    w: 11.00, h: C.TAG_H, font: 'H', size: 11, color: 'accent'
  });
}

var titleY = 2.00;
var titleH = titleLen > 20 ? 1.80 : 1.20;
els.push({
  type: 't', text: cfg.title, x: C.SAFE_X_MIN, y: titleY,
  w: 11.00, h: titleH, font: 'H', size: 42, color: 'title'
});

var subY = titleY + titleH + 0.15;
if (cfg.subtitle) {
  els.push({
    type: 't', text: cfg.subtitle, x: C.SAFE_X_MIN, y: subY,
    w: 11.00, h: 0.40, font: 'H', size: 22, color: 'sub'
  });
}
var dateY = subY + (cfg.subtitle ? 0.50 : 0);
if (cfg.date) {
  els.push({
    type: 't', text: cfg.date, x: C.SAFE_X_MIN, y: dateY,
    w: 11.00, h: 0.30, font: 'B', size: 13, color: 'body'
  });
}
return els;
}

// ============================================================
// LAYOUT: CLOSING
// ============================================================

function layoutClosing(cfg) {
  var els = [];
  var metrics = SD.getTitleMetrics(cfg.title);

  var titleY = 2.00;
  els.push({
    type: 't', text: cfg.title, x: C.SAFE_X_MIN, y: titleY,
    w: 11.00, h: 1.20, font: 'H', size: 42, color: 'title'
  });

  var subY = titleY + 1.40;
  if (cfg.subtitle) {
    els.push({
      type: 't', text: cfg.subtitle, x: C.SAFE_X_MIN, y: subY,
      w: 11.00, h: 0.40, font: 'H', size: 22, color: 'sub'
    });
  }

  if (cfg.attribution) {
    els.push({
      type: 't', text: cfg.attribution, x: C.SAFE_X_MIN,
      y: subY + 0.55, w: 11.00, h: 0.30,
      font: 'B', size: 11, color: 'body'
    });
  }
  return els;
}

// ============================================================
// LAYOUT: DIVIDER  [v6.0.1 FIX: title/subtitle collision]
// Increased title box height (0.70 → 1.10) to accommodate
// L1 spaced-caps wrapping. Subtitle now positioned relative
// to title bottom edge instead of fixed offset.
// ============================================================

function layoutDivider(cfg) {
  var centerY = (C.SLIDE_H - 1.80) / 2;
  var titleH = 1.10;
  var els = [{
    type: 't', text: cfg.title, x: C.SAFE_X_MIN, y: centerY,
    w: 11.00, h: titleH, font: 'H', size: 42,
    color: 'title', valign: 'middle'
  }];
  if (cfg.subtitle) {
    els.push({
      type: 't', text: cfg.subtitle, x: C.SAFE_X_MIN,
      y: centerY + titleH + 0.20, w: 11.00, h: 0.40,
      font: 'B', size: 18, color: 'sub'
    });
  }
  return els;
}

// ============================================================
// LAYOUT: CARDS  [v6.0.1 FIX: title wrap overlap]
// Increased card title height (0.30 → 0.45) and step
// (0.40 → 0.55) so 2-line titles don't collide with body.
// ============================================================

function layoutCards(cfg) {
  var header = renderHeader(cfg);
  var els = header.els;
  var startY = header.contentY;
  var isDark = cfg.dark === 1;

  var items = cfg.items || [];
  var cols = cfg.columns || 3;
  var grid = getGrid(cols);
  var rows = Math.ceil(items.length / cols);
  var availH = C.CONTENT_END - startY;
  var cardH = (availH - (C.GAP * (rows - 1))) / rows;

  items.forEach(function(item, i) {
    var col = i % cols;
    var row = Math.floor(i / cols);
    var cx = grid.cols[col].x;
    var cw = grid.cols[col].w;
    var cy = startY + row * (cardH + C.GAP);

    els.push({ type: 's', x: cx, y: cy, w: cw, h: cardH, fill: 'cardBg', border: isDark ? null : 'cardBorder' });

    var textW = cw * C.TEXT_RATIO;
    var textX = cx + (cw - textW) / 2;
    var innerY = cy + 0.20;

    if (item.icon) {
      els.push({ type: 'i', icon: item.icon, x: textX, y: innerY, w: 0.50, h: 0.50 });
      innerY += 0.60;
    }
    if (item.title) {
      els.push({ type: 't', text: item.title, x: textX, y: innerY, w: textW, h: 0.45, font: 'H', size: 15, color: 'title' });
      innerY += 0.55;
    }
    if (item.text) {
      els.push({ type: 't', text: item.text, x: textX, y: innerY, w: textW, h: cardH - (innerY - cy) - 0.60, font: 'B', size: 13, color: 'body' });
    }
    if (item.pill) {
      els.push({ type: 'p', text: item.pill, x: textX, y: cy + cardH - 0.45, w: 1.50, h: 0.30, fill: item.pillColor || 'accent', color: '#FFFFFF', size: 9 });
    }
  });
  return els;
}

// ============================================================
// LAYOUT: STATS  [v6.0.1 FIX: dark-mode value contrast]
// Value color now uses accentLt on dark slides instead of
// accent, which had insufficient contrast against dkGray.
// ============================================================

function layoutStats(cfg) {
var header = renderHeader(cfg);
var els = header.els;
var startY = header.contentY;
var isDark = cfg.dark === 1;

var items = cfg.items || [];
var cols = cfg.columns || 3;
var rows = cfg.rows || 2;
var grid = getGrid(cols);
var availH = C.CONTENT_END - startY;
var cellH = (availH - (C.GAP * (rows - 1))) / rows;

var valueColor = isDark ? 'accentLt' : 'accent';

items.forEach(function(item, i) {
  var col = i % cols;
  var row = Math.floor(i / cols);
  var cx = grid.cols[col].x;
  var cw = grid.cols[col].w;
  var cy = startY + row * (cellH + C.GAP);
  var textW = cw * C.TEXT_RATIO;
  var textX = cx + (cw - textW) / 2;

  els.push({ type: 's', x: cx, y: cy, w: cw, h: cellH, fill: 'cardBg', border: isDark ? null : 'cardBorder' });
  els.push({ type: 't', text: item.value, x: textX, y: cy + 0.15, w: textW, h: 0.55, font: 'H', size: 44, color: valueColor, textStyle: 'L4' });
  els.push({ type: 't', text: item.label, x: textX, y: cy + 0.80, w: textW, h: 0.25, font: 'H', size: 13, color: 'title' });
  if (item.text) {
    els.push({ type: 't', text: item.text, x: textX, y: cy + 1.10, w: textW, h: cellH - 1.35, font: 'B', size: 11, color: 'body' });
  }
});
return els;
}

// ============================================================
// LAYOUT: METRICS — spacing fix: pill top, value below, label below
// ============================================================

function layoutMetrics(cfg) {
  var header = renderHeader(cfg);
  var els = header.els;
  var startY = header.contentY;
  var isDark = cfg.dark === 1;

  var items = cfg.items || [];
  var cols = Math.min(items.length, 4);
  var rows = Math.ceil(items.length / cols);
  var grid = getGrid(cols);
  var availH = C.CONTENT_END - startY;
  var cellH = (availH - (C.GAP * (rows - 1))) / rows;

  var sampleTextW = grid.cols[0].w * C.TEXT_RATIO;
  var maxValueLen = 0;
  items.forEach(function(item) {
    if (item.value && item.value.length > maxValueLen) {
      maxValueLen = item.value.length;
    }
  });
  var valueSize = 44;
  var estimatedWidth = maxValueLen * 0.40;
  var availableWidth = sampleTextW * 0.85;
  if (estimatedWidth > availableWidth) {
    valueSize = Math.max(28, Math.floor(44 * (availableWidth / estimatedWidth)));
  }

  items.forEach(function(item, i) {
    var col = i % cols;
    var row = Math.floor(i / cols);
    var cx = grid.cols[col].x;
    var cw = grid.cols[col].w;
    var cy = startY + row * (cellH + C.GAP);
    var itemTextW = cw * C.TEXT_RATIO;
    var textX = cx + (cw - itemTextW) / 2;

    els.push({ type: 's', x: cx, y: cy, w: cw, h: cellH, fill: 'cardBg', border: isDark ? null : 'cardBorder' });

    if (item.trend) {
      var trendColor = item.trendDir === 'up' ? 'ok' : 'bad';
      var arrow = item.trendDir === 'up' ? '\u25B2' : '\u25BC';
      var pillW = 1.20;
      var pillX = Math.min(textX + itemTextW - pillW, cx + cw - pillW - 0.15);
      els.push({ type: 'p', text: arrow + ' ' + item.trend, x: pillX, y: cy + 0.15, w: pillW, h: 0.28, fill: trendColor, color: '#FFFFFF', size: 9 });
    }

    els.push({ type: 't', text: item.value, x: textX, y: cy + 0.55, w: itemTextW, h: 0.60, font: 'H', size: valueSize, color: 'title', textStyle: 'L4' });

    els.push({ type: 't', text: item.label, x: textX, y: cy + 1.40, w: itemTextW, h: 0.25, font: 'B', size: 13, color: 'body' });
  });
  return els;
}

// ============================================================
// LAYOUT: SPLIT
// ============================================================

function layoutSplit(cfg) {
  var header = renderHeader(cfg);
  var els = header.els;
  var startY = header.contentY;
  var isDark = cfg.dark === 1;

  var items = cfg.items || [];
  var grid = C.GRID.col2;
  var availH = C.CONTENT_END - startY;

  items.forEach(function(item, i) {
    if (i > 1) return;
    var cx = grid.cols[i].x;
    var cw = grid.cols[i].w;
    var textW = cw * C.TEXT_RATIO;
    var textX = cx + (cw - textW) / 2;

    els.push({ type: 's', x: cx, y: startY, w: cw, h: availH, fill: 'cardBg', border: isDark ? null : 'cardBorder' });
    els.push({ type: 't', text: item.title, x: textX, y: startY + 0.25, w: textW, h: 0.35, font: 'H', size: 18, color: 'title' });
    els.push({ type: 'd', x: textX, y: startY + 0.70, w: textW, color: 'ltGray' });
    els.push({ type: 't', text: item.text, x: textX, y: startY + 0.90, w: textW, h: availH - 1.20, font: 'B', size: 13, color: 'body' });
  });
  return els;
}

// ============================================================
// LAYOUT: ROWS
// ============================================================

function layoutRows(cfg) {
  var header = renderHeader(cfg);
  var els = header.els;
  var startY = header.contentY;
  var isDark = cfg.dark === 1;

  var items = cfg.items || [];
  var numbered = !!cfg.numbered;
  var availH = C.CONTENT_END - startY;
  var rowH = Math.min(0.90, (availH - (C.GAP * (items.length - 1))) / items.length);

  items.forEach(function(item, i) {
    var ry = startY + i * (rowH + C.GAP);
    els.push({ type: 's', x: C.SAFE_X_MIN, y: ry, w: C.SAFE_W, h: rowH, fill: 'cardBg' });

    var textStartX = C.SAFE_X_MIN + 0.20;
    if (numbered) {
      var num = String(i + 1).padStart(2, '0');
      els.push({ type: 't', text: num, x: C.SAFE_X_MIN + 0.20, y: ry, w: 1.00, h: rowH, font: 'H', size: 22, color: 'accent', valign: 'middle' });
      textStartX = C.SAFE_X_MIN + 1.30;
    }
    els.push({ type: 't', text: item.title, x: textStartX, y: ry, w: 3.50, h: rowH, font: 'H', size: 13, color: 'title', valign: 'middle' });
    els.push({ type: 't', text: item.text, x: textStartX + 3.70, y: ry, w: C.SAFE_W - textStartX - 3.70 + C.SAFE_X_MIN - 0.20, h: rowH, font: 'B', size: 11, color: 'body', valign: 'middle' });
  });
  return els;
}

// ============================================================
// LAYOUT: AGENDA
// ============================================================

function layoutAgenda(cfg) {
  cfg.numbered = cfg.numbered !== false;
  return layoutRows(cfg);
}

// ============================================================
// LAYOUT: DETAIL
// ============================================================

function layoutDetail(cfg) {
  var header = renderHeader(cfg);
  var els = header.els;
  var startY = header.contentY;
  var isDark = cfg.dark === 1;

  var items = cfg.items || [];
  var availH = C.CONTENT_END - startY;
  var cardW = 8.00;
  var cardX = C.SAFE_X_MIN + (C.SAFE_W - cardW) / 2;
  var cardH = Math.min(availH, items.length * 0.70 + 0.40);
  var cardY = startY + (availH - cardH) / 2;

  els.push({ type: 's', x: cardX, y: cardY, w: cardW, h: cardH, fill: 'cardBg', border: isDark ? null : 'cardBorder' });

  var textW = cardW * C.TEXT_RATIO;
  var innerX = cardX + (cardW - textW) / 2;
  var rowH = 0.60;

  items.forEach(function(item, i) {
    var iy = cardY + 0.20 + i * rowH;
    if (item.icon) {
      els.push({ type: 'i', icon: item.icon, x: innerX, y: iy, w: 0.40, h: 0.40 });
    }
    els.push({ type: 't', text: item.label, x: innerX + 0.60, y: iy, w: 2.50, h: 0.40, font: 'H', size: 13, color: 'muted', valign: 'middle' });
    els.push({ type: 't', text: item.value, x: innerX + 3.30, y: iy, w: textW - 3.30, h: 0.40, font: 'B', size: 13, color: 'title', valign: 'middle' });
    if (i < items.length - 1) {
      els.push({ type: 'd', x: innerX, y: iy + 0.48, w: textW, color: 'ltGray' });
    }
  });
  return els;
}

// ============================================================
// LAYOUT: BULLETS
// ============================================================

function layoutBullets(cfg) {
  var header = renderHeader(cfg);
  var els = header.els;
  var startY = header.contentY;
  var items = cfg.items || [];

  var bulletH = 0.55;
  var bulletX = C.SAFE_X_MIN + 0.40;
  var bulletW = 10.00;

  items.forEach(function(item, i) {
    var by = startY + i * bulletH;
    els.push({ type: 'o', x: C.SAFE_X_MIN + 0.10, y: by + 0.18, w: 0.12, h: 0.12, fill: 'accent' });
    els.push({ type: 't', text: item, x: bulletX, y: by, w: bulletW, h: bulletH, font: 'B', size: 15, color: 'body', valign: 'middle' });
  });
  return els;
}

// ============================================================
// NEW LAYOUT: PILLAR  [v6.0.1 FIX: title/subtitle spacing]
// Increased title height (0.35 → 0.55), pushed subtitle
// (1.05 → 1.30) and bullets (1.45 → 1.70) down to prevent
// L3 uppercase titles from overlapping subtitles.
// ============================================================

function layoutPillar(cfg) {
var header = renderHeader(cfg);
var els = header.els;
var startY = header.contentY;
var isDark = cfg.dark === 1;

var items = cfg.items || [];
var cols = Math.min(items.length, 4);
var grid = getGrid(cols);
var availH = C.CONTENT_END - startY;

var labelColor = isDark ? 'accentLt' : 'accent';

items.forEach(function(item, i) {
  if (i >= cols) return;
  var cx = grid.cols[i].x;
  var cw = grid.cols[i].w;
  var textW = cw * C.TEXT_RATIO;
  var textX = cx + (cw - textW) / 2;

  // Column background
  els.push({ type: 's', x: cx, y: startY, w: cw, h: availH, fill: 'cardBg', border: isDark ? null : 'cardBorder' });

  // Pillar number label
  var pillarNum = item.num || String(i + 1).padStart(3, '0');
  els.push({ type: 't', text: 'PILLAR.' + pillarNum, x: textX, y: startY + 0.20, w: textW, h: 0.25, font: 'H', size: 10, color: labelColor });

  // Divider under pillar label
  els.push({ type: 'd', x: textX, y: startY + 0.50, w: textW, color: labelColor });

  // Title — v6.0.1: h increased 0.35 → 0.55
  els.push({ type: 't', text: item.title, x: textX, y: startY + 0.65, w: textW, h: 0.55, font: 'H', size: 18, color: 'title' });

  // Subtitle — v6.0.1: y pushed 1.05 → 1.30
  if (item.subtitle) {
    els.push({ type: 't', text: item.subtitle, x: textX, y: startY + 1.30, w: textW, h: 0.25, font: 'H', size: 11, color: 'muted' });
  }

  // Bullet items — v6.0.1: start pushed 1.45 → 1.70
  var bulletStartY = startY + 1.70;
  var bulletItems = item.items || [];
  bulletItems.forEach(function(bi, bi_idx) {
    var by = bulletStartY + bi_idx * 0.40;
    els.push({ type: 'o', x: textX, y: by + 0.10, w: 0.08, h: 0.08, fill: labelColor });
    els.push({ type: 't', text: bi, x: textX + 0.20, y: by, w: textW - 0.20, h: 0.35, font: 'B', size: 11, color: 'body', valign: 'middle' });
  });

  // Goal at bottom
  if (item.goal) {
    var goalY = startY + availH - 0.70;
    els.push({ type: 'd', x: textX, y: goalY, w: textW, color: 'ltGray' });
    els.push({ type: 't', text: 'GOAL', x: textX, y: goalY + 0.08, w: textW, h: 0.20, font: 'H', size: 9, color: labelColor });
    els.push({ type: 't', text: item.goal, x: textX, y: goalY + 0.30, w: textW, h: 0.35, font: 'B', size: 11, color: 'title' });
  }
});
return els;
}

// ============================================================
// NEW LAYOUT: FROMTO - before/after with large numbers
// ============================================================

function layoutFromto(cfg) {
var header = renderHeader(cfg);
var els = header.els;
var startY = header.contentY;
var isDark = cfg.dark === 1;

var grid = C.GRID.col2;
var availH = C.CONTENT_END - startY;

var rx = grid.cols[1].x;
var rw = grid.cols[1].w;
var rtw = rw * C.TEXT_RATIO;
var rtx = rx + (rw - rtw) / 2;
var blockH = (availH - C.GAP - 0.40) / 2;

// FROM block
els.push({ type: 's', x: rx, y: startY, w: rw, h: blockH, fill: 'cardBg', border: isDark ? null : 'cardBorder' });
els.push({ type: 't', text: 'FROM', x: rtx, y: startY + 0.15, w: rtw, h: 0.20, font: 'H', size: 10, color: 'muted' });
if (cfg.from) {
  els.push({ type: 't', text: cfg.from.value, x: rtx, y: startY + 0.45, w: rtw, h: 0.60, font: 'H', size: 36, color: 'accent', textStyle: 'L4' });
  if (cfg.from.label) {
    els.push({ type: 't', text: cfg.from.label, x: rtx, y: startY + 1.15, w: rtw, h: 0.30, font: 'B', size: 11, color: 'body' });
  }
}

// Arrow
var arrowY = startY + blockH + 0.05;
els.push({ type: 't', text: '\u2193', x: rx + rw / 2 - 0.25, y: arrowY, w: 0.50, h: 0.30, font: 'H', size: 22, color: 'accent', align: 'center' });

// TO block
var toY = startY + blockH + C.GAP + 0.40;
var toBlockH = C.CONTENT_END - toY;
els.push({ type: 's', x: rx, y: toY, w: rw, h: toBlockH, fill: 'accent' });
els.push({ type: 't', text: 'TO', x: rtx, y: toY + 0.15, w: rtw, h: 0.20, font: 'H', size: 10, color: 'white' });
if (cfg.to) {
  els.push({ type: 't', text: cfg.to.value, x: rtx, y: toY + 0.45, w: rtw, h: 0.60, font: 'H', size: 36, color: 'white', textStyle: 'L4' });
  if (cfg.to.label) {
    els.push({ type: 't', text: cfg.to.label, x: rtx, y: toY + 1.15, w: rtw, h: 0.30, font: 'B', size: 11, color: 'white' });
  }
}

// Left side: description + benefits
var lx = grid.cols[0].x;
var lw = grid.cols[0].w;
var ltw = lw * C.TEXT_RATIO;
var ltx = lx + (lw - ltw) / 2;

if (cfg.description) {
  els.push({ type: 't', text: cfg.description, x: ltx, y: startY + 0.20, w: ltw, h: availH * 0.45, font: 'B', size: 13, color: 'body' });
}

if (cfg.benefits) {
  var benefitsText = cfg.benefits;
  if (Array.isArray(cfg.benefits)) {
    benefitsText = cfg.benefits.map(function(b) {
      return typeof b === 'object' ? (b.text || b) : b;
    }).join(' | ');
  }

  var benefitsH = toBlockH;
  var benefitsY = toY;
  els.push({ type: 's', x: lx, y: benefitsY, w: lw, h: benefitsH, fill: isDark ? 'dkGray' : 'white', border: 'accent' });
  els.push({ type: 't', text: 'BENEFITS', x: ltx, y: benefitsY + 0.15, w: ltw, h: 0.20, font: 'H', size: 9, color: 'accent' });
  els.push({ type: 't', text: benefitsText, x: ltx, y: benefitsY + 0.45, w: ltw, h: benefitsH - 0.65, font: 'B', size: 12, color: 'accent', valign: 'top' });
}

return els;
}

// ============================================================
// NEW LAYOUT: CAPABILITY - matrix grid with column headers
// ============================================================

function layoutCapability(cfg) {
var header = renderHeader(cfg);
var els = header.els;
var startY = header.contentY;
var isDark = cfg.dark === 1;

var columns = cfg.columns || [];
var items = cfg.items || [];
var colCount = columns.length;
if (colCount < 2) colCount = 2;
if (colCount > 5) colCount = 5;

var grid = getGrid(colCount);
var availH = C.CONTENT_END - startY;
var headerRowH = 0.50;
var dataStartY = startY + headerRowH + C.GAP;
var rowCount = items.length;
var dataH = availH - headerRowH - C.GAP;

var labelH = 0.25;
var cellPad = 0.05;
var rowUnit = rowCount > 0 ? (dataH - C.GAP * (rowCount - 1)) / rowCount : 1.00;
var cellH = Math.max(0.35, rowUnit - labelH - cellPad);

// Column headers
columns.forEach(function(colName, ci) {
  if (ci >= colCount || !grid.cols[ci]) return;
  var cx = grid.cols[ci].x;
  var cw = grid.cols[ci].w;
  els.push({ type: 's', x: cx, y: startY, w: cw, h: headerRowH, fill: 'accent' });
  els.push({ type: 't', text: colName, x: cx + 0.15, y: startY, w: cw - 0.30, h: headerRowH, font: 'H', size: 11, color: 'white', valign: 'middle' });
});

// Data rows
items.forEach(function(row, ri) {
  var ry = dataStartY + ri * (rowUnit + C.GAP);

  if (row.metric) {
    els.push({ type: 't', text: row.metric, x: C.SAFE_X_MIN, y: ry, w: 3.00, h: labelH, font: 'H', size: 10, color: isDark ? 'accentLt' : 'accent' });
  }

  var cellY = ry + labelH + cellPad;
  var values = row.values || [];

  values.forEach(function(val, vi) {
    if (vi >= colCount || !grid.cols[vi]) return;
    var cx = grid.cols[vi].x;
    var cw = grid.cols[vi].w;
    els.push({ type: 's', x: cx, y: cellY, w: cw, h: cellH, fill: 'cardBg', border: isDark ? null : 'cardBorder' });
    els.push({ type: 't', text: val, x: cx + 0.15, y: cellY, w: cw - 0.30, h: cellH, font: 'B', size: 11, color: 'body', valign: 'middle' });
  });
});

return els;
}

// ============================================================
// NEW LAYOUT: SCHEDULE — time-based agenda table
// ============================================================

function layoutSchedule(cfg) {
var header = renderHeader(cfg);
var els = header.els;
var startY = header.contentY;
var isDark = cfg.dark === 1;

var items = cfg.items || [];
var availH = C.CONTENT_END - startY;
var headerH = 0.40;
var headerGap = C.GAP;
var dataAvail = availH - headerH - headerGap;
var gapFactor = 0.35;
var rowH = (dataAvail - (items.length - 1) * C.GAP * gapFactor) / items.length;
rowH = Math.max(0.38, Math.min(0.75, rowH));

var timeX = C.SAFE_X_MIN;
var timeW = 2.50;
var actX = timeX + timeW + C.GAP;
var actW = 6.50;
var whoX = actX + actW + C.GAP;
var whoW = C.SAFE_W - timeW - actW - C.GAP * 2;

// Column headers
els.push({ type: 's', x: timeX, y: startY, w: timeW, h: headerH, fill: 'accent' });
els.push({ type: 't', text: 'TIME', x: timeX + 0.10, y: startY, w: timeW - 0.20, h: headerH, font: 'H', size: 10, color: 'white', valign: 'middle' });
els.push({ type: 's', x: actX, y: startY, w: actW, h: headerH, fill: 'accent' });
els.push({ type: 't', text: 'ACTIVITY', x: actX + 0.10, y: startY, w: actW - 0.20, h: headerH, font: 'H', size: 10, color: 'white', valign: 'middle' });
els.push({ type: 's', x: whoX, y: startY, w: whoW, h: headerH, fill: 'accent' });
els.push({ type: 't', text: 'PARTICIPANTS', x: whoX + 0.10, y: startY, w: whoW - 0.20, h: headerH, font: 'H', size: 10, color: 'white', valign: 'middle' });

var dataStartY = startY + headerH + headerGap;

items.forEach(function(item, i) {
  var ry = dataStartY + i * (rowH + C.GAP * gapFactor);
  var bgFill = i % 2 === 0 ? 'cardBg' : (isDark ? 'dkGray' : 'ltGray');

  els.push({ type: 's', x: timeX, y: ry, w: timeW, h: rowH, fill: bgFill });
  els.push({ type: 's', x: actX, y: ry, w: actW, h: rowH, fill: bgFill });
  els.push({ type: 's', x: whoX, y: ry, w: whoW, h: rowH, fill: bgFill });

  els.push({ type: 't', text: item.time || '', x: timeX + 0.10, y: ry, w: timeW - 0.20, h: rowH, font: 'H', size: 11, color: 'accent', valign: 'middle' });
  els.push({ type: 't', text: item.activity || '', x: actX + 0.10, y: ry, w: actW - 0.20, h: rowH, font: 'B', size: 12, color: 'title', valign: 'middle' });
  els.push({ type: 't', text: item.who || '', x: whoX + 0.10, y: ry, w: whoW - 0.20, h: rowH, font: 'B', size: 11, color: 'body', valign: 'middle' });
});

return els;
}

// ============================================================
// NEW LAYOUT: COVERLOC - cover with location and date
// ============================================================

function layoutCoverloc(cfg) {
  var els = [];

  if (cfg.org) {
    els.push({
      type: 't', text: cfg.org, x: C.SAFE_X_MIN, y: C.TAG_Y,
      w: 11.00, h: 0.30, font: 'H', size: 12, color: 'muted'
    });
  }

  var titleY = cfg.org ? 1.30 : C.TITLE_Y;
  els.push({
    type: 't', text: cfg.title, x: C.SAFE_X_MIN, y: titleY,
    w: 11.00, h: 1.20, font: 'H', size: 48, color: 'title'
  });

  var locY = titleY + 1.50;
  if (cfg.location) {
    els.push({
      type: 't', text: cfg.location, x: C.SAFE_X_MIN, y: locY,
      w: 11.00, h: 0.45, font: 'H', size: 24, color: 'sub'
    });
  }

  var dateY = locY + 0.60;
  if (cfg.date) {
    els.push({
      type: 't', text: cfg.date, x: C.SAFE_X_MIN, y: dateY,
      w: 11.00, h: 0.35, font: 'B', size: 16, color: 'body'
    });
  }

  return els;
}

// ============================================================
// LAYOUT DISPATCHER
// ============================================================

var LAYOUT_MAP = {
  cover:      layoutCover,
  closing:    layoutClosing,
  divider:    layoutDivider,
  agenda:     layoutAgenda,
  cards:      layoutCards,
  stats:      layoutStats,
  metrics:    layoutMetrics,
  split:      layoutSplit,
  rows:       layoutRows,
  detail:     layoutDetail,
  bullets:    layoutBullets,
  pillar:     layoutPillar,
  fromto:     layoutFromto,
  capability: layoutCapability,
  schedule:   layoutSchedule,
  coverloc:   layoutCoverloc
};

function dispatch(slideData) {
  var fn = LAYOUT_MAP[slideData.layout];
  if (fn) return fn(slideData);
  if (slideData.els) return slideData.els;
  console.warn('[deck-layouts] Unknown layout: "' + slideData.layout + '"');
  return [];
}

// ============================================================
// PUBLIC API
// ============================================================

window.DeckLayouts = {
  dispatch: dispatch
};

})();
