#!/usr/bin/env node
const https = require("https");
const fs = require("fs");
const path = require("path");

const VERSION = "0.474.0";
const BASE = "https://cdn.jsdelivr.net/npm/lucide-static@" + VERSION + "/icons/";

const ICONS = [
"bar-chart","bar-chart-2","bar-chart-3","bar-chart-4",
"line-chart","area-chart","pie-chart","trending-up","trending-down",
"activity","gauge","percent","sigma","calculator","table","table-2",
"briefcase","building","building-2","landmark",
"dollar-sign","credit-card","wallet","coins","banknote",
"receipt","piggy-bank","handshake",
"target","trophy","award","star","medal","crown",
"badge-check","shield-check","scale",
"user","user-2","user-check","user-plus",
"users","users-2","contact","graduation-cap","hard-hat","bot",
"mail","mail-open","send","message-square","message-circle",
"phone","phone-call","video","mic","bell","bell-ring",
"at-sign","link","share","globe","wifi","megaphone",
"arrow-right","arrow-left","arrow-up","arrow-down",
"arrow-up-right","chevron-right","chevron-left",
"chevron-up","chevron-down","corner-down-right","move","expand",
"check","check-circle","check-circle-2",
"x","x-circle","alert-circle","alert-triangle",
"info","help-circle","thumbs-up","thumbs-down",
"heart","flag","bookmark",
"search","filter","edit","pencil","copy","trash",
"download","upload","save","refresh-cw",
"settings","sliders","wrench","key","lock","unlock","eye","eye-off",
"lightbulb","rocket","puzzle","compass","zap","sparkles",
"brain","atom","wand-2",
"code","terminal","cpu","server","database",
"cloud","cloud-upload","cloud-download",
"monitor","laptop","smartphone","layers","package","box",
"clock","alarm-clock","timer","calendar","calendar-check",
"calendar-days","hourglass","history",
"file","file-text","file-check","file-plus",
"folder","folder-open","paperclip",
"book","book-open","notebook","clipboard","clipboard-check",
"play","pause","circle","square","triangle",
"repeat","shuffle","git-branch","git-merge","workflow","network",
"map","map-pin","navigation","home","coffee",
"shopping-bag","shopping-cart","store",
"image","camera","palette","paintbrush","type",
"presentation","layout-dashboard"
];

function fetchSvg(name) {
return new Promise(function(resolve) {
  https.get(BASE + name + ".svg", function(res) {
    if (res.statusCode !== 200) {
      resolve({ name: name, svg: null });
      res.resume();
      return;
    }
    var data = "";
    res.on("data", function(c) { data += c; });
    res.on("end", function() {
      var svg = data.trim().replace(/\s*width="24"/g, "").replace(/\s*height="24"/g, "");
      resolve({ name: name, svg: svg });
    });
  }).on("error", function() { resolve({ name: name, svg: null }); });
});
}

async function build() {
console.log("Fetching " + ICONS.length + " icons from Lucide CDN v" + VERSION + "...");
var results = [];
for (var i = 0; i < ICONS.length; i += 10) {
  var batch = ICONS.slice(i, i + 10);
  var br = await Promise.all(batch.map(fetchSvg));
  results = results.concat(br);
  process.stdout.write("  " + results.length + "/" + ICONS.length + "\r");
}
console.log("");

var ok = results.filter(function(r) { return r.svg; });
var fail = results.filter(function(r) { return !r.svg; });

if (fail.length) {
  console.log("WARNING: " + fail.length + " not found:");
  fail.forEach(function(f) { console.log("  " + f.name); });
  console.log("");
}

var lines = [];
lines.push("/* deck-icons.js — Lucide SVG bundle for Standard Deck */");
lines.push("/* Generated: " + new Date().toISOString() + " | " + ok.length + " icons */");
lines.push("(function(){");
lines.push("'use strict';");
lines.push("var I={");
ok.forEach(function(item, idx) {
  var esc = item.svg.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  lines.push("'" + item.name + "':'" + esc + "'" + (idx < ok.length - 1 ? "," : ""));
});
lines.push("};");
lines.push("function get(n,color,size){");
lines.push("  var s=I[n];if(!s)return '';");
lines.push("  if(color)s=s.replace(/currentColor/g,color);");
lines.push("  if(size)s='<svg width=\"'+size+'\" height=\"'+size+'\"'+s.slice(4);");
lines.push("  return s;");
lines.push("}");
lines.push("window.DeckIcons={");
lines.push("  get:get,");
lines.push("  has:function(n){return !!I[n];},");
lines.push("  list:function(){return Object.keys(I);},");
lines.push("  toDataURL:function(n,size,color){");
lines.push("    var s=get(n,color||'#000000',size||48);");
lines.push("    if(!s)return null;");
lines.push("    return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(s)));");
lines.push("  }");
lines.push("};");
lines.push("})();");

var output = lines.join("\n") + "\n";
fs.writeFileSync(path.join(__dirname, "deck-icons.js"), output, "utf8");
console.log("Done! deck-icons.js written (" + (output.length / 1024).toFixed(1) + " KB, " + ok.length + " icons)");
}

build().catch(console.error);
