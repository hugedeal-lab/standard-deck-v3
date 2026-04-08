const fs = require('fs');
const path = require('path');

// CONFIG — adjust this path to where you cloned Iconoir
const ICONOIR_DIR = path.join(__dirname, '..', 'iconoir', 'icons');
const MANIFEST = path.join(__dirname, 'icon-manifest.json');
const OUTPUT = path.join(__dirname, 'deck-icons.js');

// Possible sub-folders to search (Iconoir v7+ uses /regular, /solid, etc.)
const SEARCH_DIRS = ['regular', 'solid', ''];

function findSvgFile(iconName) {
  for (const sub of SEARCH_DIRS) {
    const filePath = path.join(ICONOIR_DIR, sub, iconName + '.svg');
    if (fs.existsSync(filePath)) return filePath;
  }
  // Try root icons/ folder directly
  const rootPath = path.join(ICONOIR_DIR, iconName + '.svg');
  if (fs.existsSync(rootPath)) return rootPath;
  return null;
}

function extractInnerSvg(svgContent) {
  // Remove XML declaration if present
  svgContent = svgContent.replace(/<\?xml[^?]*\?>/g, '').trim();
  // Extract content between svg tags
  const match = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (!match) return null;
  // Clean up: single line, normalize whitespace
  return match[1].trim().replace(/\n\s*/g, '');
}

// Load manifest
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const allIcons = {};
const missing = [];
const found = [];

// Process each category
for (const [category, names] of Object.entries(manifest)) {
  for (const name of names) {
    if (allIcons[name]) continue; // Skip duplicates across categories

    const filePath = findSvgFile(name);
    if (!filePath) {
      missing.push({ category, name });
      continue;
    }

    const svgContent = fs.readFileSync(filePath, 'utf8');
    const inner = extractInnerSvg(svgContent);
    if (inner) {
      allIcons[name] = inner;
      found.push({ category, name });
    } else {
      missing.push({ category, name, reason: 'parse-failed' });
    }
  }
}

// Build output JS
const entries = Object.entries(allIcons).map(([name, paths]) => {
  // Escape single quotes in SVG content
  const escaped = paths.replace(/'/g, "\\'");
  return `  '${name}': '${escaped}'`;
});

const output = `/* ============================================================
 deck-icons.js — Auto-generated SVG Icon Bundle
 Source: Iconoir (MIT License) — https://iconoir.com
 Generated: ${new Date().toISOString().split('T')[0]}
 Icons: ${Object.keys(allIcons).length} from ${Object.keys(manifest).length} categories
 ============================================================
 DO NOT EDIT MANUALLY. Regenerate with: node build-icons.js
 To add icons: edit icon-manifest.json, then rebuild.
 ============================================================ */

(function () {
'use strict';

var ICON_PATHS = {
${entries.join(',\n')}
};

function getSvg(name, color, size) {
  var paths = ICON_PATHS[name];
  if (!paths) return null;
  size = size || 24;
  color = color || '#000000';
  var colored = paths.replace(/currentColor/g, color);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size
    + '" height="' + size
    + '" viewBox="0 0 24 24" fill="none">'
    + colored + '</svg>';
}

function toBase64Png(name, color, size, callback) {
  var svgStr = getSvg(name, color, size || 256);
  if (!svgStr) { if (callback) callback(null); return; }
  var canvas = document.createElement('canvas');
  var s = size || 256;
  canvas.width = s; canvas.height = s;
  var ctx = canvas.getContext('2d');
  var img = new Image();
  var blob = new Blob([svgStr], { type: 'image/svg+xml' });
  var url = URL.createObjectURL(blob);
  img.onload = function () {
    ctx.drawImage(img, 0, 0, s, s);
    URL.revokeObjectURL(url);
    if (callback) callback(canvas.toDataURL('image/png'));
  };
  img.onerror = function () {
    URL.revokeObjectURL(url);
    if (callback) callback(null);
  };
  img.src = url;
}

function hasIcon(name) { return !!ICON_PATHS[name]; }
function listIcons() { return Object.keys(ICON_PATHS); }

window.DeckIcons = {
  getSvg: getSvg,
  toBase64Png: toBase64Png,
  hasIcon: hasIcon,
  listIcons: listIcons,
  ICON_PATHS: ICON_PATHS
};

})();
`;

fs.writeFileSync(OUTPUT, output, 'utf8');

// Report
console.log('\\n✅ deck-icons.js generated');
console.log('   Icons: ' + found.length + ' found');
console.log('   Missing: ' + missing.length);
if (missing.length > 0) {
  console.log('\\n⚠️  Missing icons (check spelling or Iconoir version):');
  missing.forEach(m => {
    console.log('   [' + m.category + '] ' + m.name
      + (m.reason ? ' (' + m.reason + ')' : ''));
  });
}
console.log('\\nDone. Commit deck-icons.js to your repo.');
