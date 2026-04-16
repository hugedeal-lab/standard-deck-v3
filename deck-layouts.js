/* ============================================================
 deck-layouts.js v6.0.11 -- Layout Shortcut Library
 v6.0.9:  Fixed duplicate IIFE. coverPresenter v5 dynamic title.
 v6.0.10: twoCols _imgPlaceholder + _skipExport for Change Picture.
 v6.0.11: Accent rename warmBrown → bronze. No functional changes.
 ============================================================ */

(function () {
'use strict';

var SD = window.StandardDeck;
if (!SD || !SD.SD_CONST) { console.error('[deck-layouts] FATAL: standard-deck.js v6.0+ must load first.'); return; }
var C = SD.SD_CONST;

function renderHeader(slide) {
  var els = []; var metrics = SD.getTitleMetrics(slide.title);
  if (slide.tag) els.push({ type:'t', text:slide.tag, x:C.SAFE_X_MIN, y:C.TAG_Y, w:11.00, h:C.TAG_H, font:'H', size:11, color:'accent' });
  if (slide.title) els.push({ type:'t', text:slide.title, x:C.SAFE_X_MIN, y:C.TITLE_Y, w:11.00, h:metrics.titleH, font:'H', size:33, color:'title' });
  return { els:els, contentY:metrics.contentY };
}

function getGrid(colCount) { return C.GRID['col'+colCount] || C.GRID.col3; }

// ============================================================
// CORE LAYOUTS
// ============================================================

function layoutCover(cfg) {
  var els=[]; var tl=(cfg.title||'').length;
  if (cfg.tag) els.push({type:'t',text:cfg.tag,x:C.SAFE_X_MIN,y:C.TAG_Y,w:11.00,h:C.TAG_H,font:'H',size:11,color:'accent'});
  var tY=2.00; var tH=tl>20?1.80:1.20;
  els.push({type:'t',text:cfg.title,x:C.SAFE_X_MIN,y:tY,w:11.00,h:tH,font:'H',size:42,color:'title'});
  var sY=tY+tH+0.15;
  if (cfg.subtitle) els.push({type:'t',text:cfg.subtitle,x:C.SAFE_X_MIN,y:sY,w:11.00,h:0.40,font:'H',size:22,color:'sub'});
  if (cfg.date) els.push({type:'t',text:cfg.date,x:C.SAFE_X_MIN,y:sY+(cfg.subtitle?0.50:0),w:11.00,h:0.30,font:'B',size:13,color:'body'});
  return els;
}

function layoutClosing(cfg) {
  var els=[];
  els.push({type:'t',text:cfg.title,x:C.SAFE_X_MIN,y:2.00,w:11.00,h:1.20,font:'H',size:42,color:'title'});
  if (cfg.subtitle) els.push({type:'t',text:cfg.subtitle,x:C.SAFE_X_MIN,y:3.40,w:11.00,h:0.40,font:'H',size:22,color:'sub'});
  if (cfg.attribution) els.push({type:'t',text:cfg.attribution,x:C.SAFE_X_MIN,y:3.95,w:11.00,h:0.30,font:'B',size:11,color:'body'});
  return els;
}

function layoutDivider(cfg) {
  var cY=(C.SLIDE_H-1.80)/2; var tH=1.10;
  var els=[{type:'t',text:cfg.title,x:C.SAFE_X_MIN,y:cY,w:11.00,h:tH,font:'H',size:42,color:'title',valign:'middle'}];
  if (cfg.subtitle) els.push({type:'t',text:cfg.subtitle,x:C.SAFE_X_MIN,y:cY+tH+0.20,w:11.00,h:0.40,font:'B',size:18,color:'sub'});
  return els;
}

function layoutCards(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY; var dk=cfg.dark===1;
  var items=cfg.items||[]; var cols=cfg.columns||3; var grid=getGrid(cols);
  var rows=Math.ceil(items.length/cols); var aH=C.CONTENT_END-sY; var cH=(aH-(C.GAP*(rows-1)))/rows;
  items.forEach(function(item,i){
    var col=i%cols; var row=Math.floor(i/cols);
    var cx=grid.cols[col].x; var cw=grid.cols[col].w; var cy=sY+row*(cH+C.GAP);
    els.push({type:'s',x:cx,y:cy,w:cw,h:cH,fill:'cardBg',border:dk?null:'cardBorder'});
    var tw=cw*C.TEXT_RATIO; var tx=cx+(cw-tw)/2; var iy=cy+0.20;
    if(item.icon){els.push({type:'i',icon:item.icon,x:tx,y:iy,w:0.50,h:0.50});iy+=0.60;}
    if(item.title){els.push({type:'t',text:item.title,x:tx,y:iy,w:tw,h:0.45,font:'H',size:15,color:'title'});iy+=0.55;}
    if(item.text){els.push({type:'t',text:item.text,x:tx,y:iy,w:tw,h:cH-(iy-cy)-0.60,font:'B',size:13,color:'body'});}
    if(item.pill){els.push({type:'p',text:item.pill,x:tx,y:cy+cH-0.45,w:1.50,h:0.30,fill:item.pillColor||'accent',color:'#FFFFFF',size:9});}
  });
  return els;
}

function layoutStats(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY; var dk=cfg.dark===1;
  var items=cfg.items||[]; var cols=cfg.columns||3; var rows=cfg.rows||2;
  var grid=getGrid(cols); var aH=C.CONTENT_END-sY; var cH=(aH-(C.GAP*(rows-1)))/rows;
  var vc=dk?'accentLt':'accent';
  items.forEach(function(item,i){
    var col=i%cols; var row=Math.floor(i/cols);
    var cx=grid.cols[col].x; var cw=grid.cols[col].w; var cy=sY+row*(cH+C.GAP);
    var tw=cw*C.TEXT_RATIO; var tx=cx+(cw-tw)/2;
    els.push({type:'s',x:cx,y:cy,w:cw,h:cH,fill:'cardBg',border:dk?null:'cardBorder'});
    els.push({type:'t',text:item.value,x:tx,y:cy+0.15,w:tw,h:0.55,font:'H',size:44,color:vc,textStyle:'L4'});
    els.push({type:'t',text:item.label,x:tx,y:cy+0.80,w:tw,h:0.25,font:'H',size:13,color:'title'});
    if(item.text) els.push({type:'t',text:item.text,x:tx,y:cy+1.10,w:tw,h:cH-1.35,font:'B',size:11,color:'body'});
  });
  return els;
}

function layoutMetrics(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY; var dk=cfg.dark===1;
  var items=cfg.items||[]; var cols=Math.min(items.length,4); var rows=Math.ceil(items.length/cols);
  var grid=getGrid(cols); var aH=C.CONTENT_END-sY; var cH=(aH-(C.GAP*(rows-1)))/rows;
  var stw=grid.cols[0].w*C.TEXT_RATIO; var mvl=0;
  items.forEach(function(it){if(it.value&&it.value.length>mvl)mvl=it.value.length;});
  var vs=44; var ew=mvl*0.40; var aw=stw*0.85;
  if(ew>aw) vs=Math.max(28,Math.floor(44*(aw/ew)));
  items.forEach(function(item,i){
    var col=i%cols; var row=Math.floor(i/cols);
    var cx=grid.cols[col].x; var cw=grid.cols[col].w; var cy=sY+row*(cH+C.GAP);
    var tw=cw*C.TEXT_RATIO; var tx=cx+(cw-tw)/2;
    els.push({type:'s',x:cx,y:cy,w:cw,h:cH,fill:'cardBg',border:dk?null:'cardBorder'});
    if(item.trend){
      var tc=item.trendDir==='up'?'ok':'bad'; var ar=item.trendDir==='up'?'\u25B2':'\u25BC';
      els.push({type:'p',text:ar+' '+item.trend,x:Math.min(tx+tw-1.20,cx+cw-1.35),y:cy+0.15,w:1.20,h:0.28,fill:tc,color:'#FFFFFF',size:9});
    }
    els.push({type:'t',text:item.value,x:tx,y:cy+0.55,w:tw,h:0.60,font:'H',size:vs,color:'title',textStyle:'L4'});
    els.push({type:'t',text:item.label,x:tx,y:cy+1.40,w:tw,h:0.25,font:'B',size:13,color:'body'});
  });
  return els;
}

function layoutSplit(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY; var dk=cfg.dark===1;
  var items=cfg.items||[]; var grid=C.GRID.col2; var aH=C.CONTENT_END-sY;
  items.forEach(function(item,i){
    if(i>1)return; var cx=grid.cols[i].x; var cw=grid.cols[i].w;
    var tw=cw*C.TEXT_RATIO; var tx=cx+(cw-tw)/2;
    els.push({type:'s',x:cx,y:sY,w:cw,h:aH,fill:'cardBg',border:dk?null:'cardBorder'});
    els.push({type:'t',text:item.title,x:tx,y:sY+0.25,w:tw,h:0.35,font:'H',size:18,color:'title'});
    els.push({type:'d',x:tx,y:sY+0.70,w:tw,color:'ltGray'});
    els.push({type:'t',text:item.text,x:tx,y:sY+0.90,w:tw,h:aH-1.20,font:'B',size:13,color:'body'});
  });
  return els;
}

function layoutRows(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY;
  var items=cfg.items||[]; var numbered=!!cfg.numbered;
  var aH=C.CONTENT_END-sY; var rH=Math.min(0.90,(aH-(C.GAP*(items.length-1)))/items.length);
  items.forEach(function(item,i){
    var ry=sY+i*(rH+C.GAP);
    els.push({type:'s',x:C.SAFE_X_MIN,y:ry,w:C.SAFE_W,h:rH,fill:'cardBg'});
    var sx=C.SAFE_X_MIN+0.20;
    if(numbered){els.push({type:'t',text:String(i+1).padStart(2,'0'),x:C.SAFE_X_MIN+0.20,y:ry,w:1.00,h:rH,font:'H',size:22,color:'accent',valign:'middle'});sx=C.SAFE_X_MIN+1.30;}
    els.push({type:'t',text:item.title,x:sx,y:ry,w:3.50,h:rH,font:'H',size:13,color:'title',valign:'middle'});
    els.push({type:'t',text:item.text,x:sx+3.70,y:ry,w:C.SAFE_W-sx-3.70+C.SAFE_X_MIN-0.20,h:rH,font:'B',size:11,color:'body',valign:'middle'});
  });
  return els;
}

function layoutAgenda(cfg){cfg.numbered=cfg.numbered!==false;return layoutRows(cfg);}

function layoutDetail(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY; var dk=cfg.dark===1;
  var items=cfg.items||[]; var aH=C.CONTENT_END-sY;
  var cW=8.00; var cX=C.SAFE_X_MIN+(C.SAFE_W-cW)/2;
  var cH=Math.min(aH,items.length*0.70+0.40); var cY=sY+(aH-cH)/2;
  els.push({type:'s',x:cX,y:cY,w:cW,h:cH,fill:'cardBg',border:dk?null:'cardBorder'});
  var tw=cW*C.TEXT_RATIO; var ix=cX+(cW-tw)/2;
  items.forEach(function(item,i){
    var iy=cY+0.20+i*0.60;
    if(item.icon) els.push({type:'i',icon:item.icon,x:ix,y:iy,w:0.40,h:0.40});
    els.push({type:'t',text:item.label,x:ix+0.60,y:iy,w:2.50,h:0.40,font:'H',size:13,color:'muted',valign:'middle'});
    els.push({type:'t',text:item.value,x:ix+3.30,y:iy,w:tw-3.30,h:0.40,font:'B',size:13,color:'title',valign:'middle'});
    if(i<items.length-1) els.push({type:'d',x:ix,y:iy+0.48,w:tw,color:'ltGray'});
  });
  return els;
}

function layoutBullets(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY;
  (cfg.items||[]).forEach(function(item,i){
    var by=sY+i*0.55;
    els.push({type:'o',x:C.SAFE_X_MIN+0.10,y:by+0.18,w:0.12,h:0.12,fill:'accent'});
    els.push({type:'t',text:item,x:C.SAFE_X_MIN+0.40,y:by,w:10.00,h:0.55,font:'B',size:15,color:'body',valign:'middle'});
  });
  return els;
}

function layoutPillar(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY; var dk=cfg.dark===1;
  var items=cfg.items||[]; var cols=Math.min(items.length,4);
  var grid=getGrid(cols); var aH=C.CONTENT_END-sY; var lc=dk?'accentLt':'accent';
  items.forEach(function(item,i){
    if(i>=cols)return; var cx=grid.cols[i].x; var cw=grid.cols[i].w;
    var tw=cw*C.TEXT_RATIO; var tx=cx+(cw-tw)/2;
    els.push({type:'s',x:cx,y:sY,w:cw,h:aH,fill:'cardBg',border:dk?null:'cardBorder'});
    els.push({type:'t',text:'PILLAR.'+(item.num||String(i+1).padStart(3,'0')),x:tx,y:sY+0.20,w:tw,h:0.25,font:'H',size:10,color:lc});
    els.push({type:'d',x:tx,y:sY+0.50,w:tw,color:lc});
    els.push({type:'t',text:item.title,x:tx,y:sY+0.65,w:tw,h:0.55,font:'H',size:18,color:'title'});
    if(item.subtitle) els.push({type:'t',text:item.subtitle,x:tx,y:sY+1.30,w:tw,h:0.25,font:'H',size:11,color:'muted'});
    (item.items||[]).forEach(function(bi,bi_idx){
      var by=sY+1.70+bi_idx*0.40;
      els.push({type:'o',x:tx,y:by+0.10,w:0.08,h:0.08,fill:lc});
      els.push({type:'t',text:bi,x:tx+0.20,y:by,w:tw-0.20,h:0.35,font:'B',size:11,color:'body',valign:'middle'});
    });
    if(item.goal){
      var gy=sY+aH-0.70;
      els.push({type:'d',x:tx,y:gy,w:tw,color:'ltGray'});
      els.push({type:'t',text:'GOAL',x:tx,y:gy+0.08,w:tw,h:0.20,font:'H',size:9,color:lc});
      els.push({type:'t',text:item.goal,x:tx,y:gy+0.30,w:tw,h:0.35,font:'B',size:11,color:'title'});
    }
  });
  return els;
}

function layoutFromto(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY; var dk=cfg.dark===1;
  var grid=C.GRID.col2; var aH=C.CONTENT_END-sY;
  var rx=grid.cols[1].x; var rw=grid.cols[1].w; var rtw=rw*C.TEXT_RATIO; var rtx=rx+(rw-rtw)/2;
  var bH=(aH-C.GAP-0.40)/2;
  els.push({type:'s',x:rx,y:sY,w:rw,h:bH,fill:'cardBg',border:dk?null:'cardBorder'});
  els.push({type:'t',text:'FROM',x:rtx,y:sY+0.15,w:rtw,h:0.20,font:'H',size:10,color:'muted'});
  if(cfg.from){els.push({type:'t',text:cfg.from.value,x:rtx,y:sY+0.45,w:rtw,h:0.60,font:'H',size:36,color:'accent',textStyle:'L4'});if(cfg.from.label)els.push({type:'t',text:cfg.from.label,x:rtx,y:sY+1.15,w:rtw,h:0.30,font:'B',size:11,color:'body'});}
  els.push({type:'t',text:'\u2193',x:rx+rw/2-0.25,y:sY+bH+0.05,w:0.50,h:0.30,font:'H',size:22,color:'accent',align:'center'});
  var tY=sY+bH+C.GAP+0.40; var tbH=C.CONTENT_END-tY;
  els.push({type:'s',x:rx,y:tY,w:rw,h:tbH,fill:'accent'});
  els.push({type:'t',text:'TO',x:rtx,y:tY+0.15,w:rtw,h:0.20,font:'H',size:10,color:'white'});
  if(cfg.to){els.push({type:'t',text:cfg.to.value,x:rtx,y:tY+0.45,w:rtw,h:0.60,font:'H',size:36,color:'white',textStyle:'L4'});if(cfg.to.label)els.push({type:'t',text:cfg.to.label,x:rtx,y:tY+1.15,w:rtw,h:0.30,font:'B',size:11,color:'white'});}
  var lx=grid.cols[0].x; var lw=grid.cols[0].w; var ltw=lw*C.TEXT_RATIO; var ltx=lx+(lw-ltw)/2;
  if(cfg.description) els.push({type:'t',text:cfg.description,x:ltx,y:sY+0.20,w:ltw,h:aH*0.45,font:'B',size:13,color:'body'});
  if(cfg.benefits){
    var bt=cfg.benefits; if(Array.isArray(bt))bt=bt.map(function(b){return typeof b==='object'?(b.text||b):b;}).join(' | ');
    els.push({type:'s',x:lx,y:tY,w:lw,h:tbH,fill:dk?'dkGray':'white',border:'accent'});
    els.push({type:'t',text:'BENEFITS',x:ltx,y:tY+0.15,w:ltw,h:0.20,font:'H',size:9,color:'accent'});
    els.push({type:'t',text:bt,x:ltx,y:tY+0.45,w:ltw,h:tbH-0.65,font:'B',size:12,color:'accent',valign:'top'});
  }
  return els;
}

function layoutCapability(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY; var dk=cfg.dark===1;
  var columns=cfg.columns||[]; var items=cfg.items||[]; var cc=columns.length;
  if(cc<2)cc=2; if(cc>5)cc=5;
  var grid=getGrid(cc); var aH=C.CONTENT_END-sY; var hrH=0.50;
  var dsY=sY+hrH+C.GAP; var rc=items.length; var dH=aH-hrH-C.GAP;
  var lH=0.25; var cp=0.05; var ru=rc>0?(dH-C.GAP*(rc-1))/rc:1.00;
  var cH=Math.max(0.35,ru-lH-cp);
  columns.forEach(function(cn,ci){
    if(ci>=cc||!grid.cols[ci])return; var cx=grid.cols[ci].x; var cw=grid.cols[ci].w;
    els.push({type:'s',x:cx,y:sY,w:cw,h:hrH,fill:'accent'});
    els.push({type:'t',text:cn,x:cx+0.15,y:sY,w:cw-0.30,h:hrH,font:'H',size:11,color:'white',valign:'middle'});
  });
  items.forEach(function(row,ri){
    var ry=dsY+ri*(ru+C.GAP);
    if(row.metric) els.push({type:'t',text:row.metric,x:C.SAFE_X_MIN,y:ry,w:3.00,h:lH,font:'H',size:10,color:dk?'accentLt':'accent'});
    var cellY=ry+lH+cp;
    (row.values||[]).forEach(function(val,vi){
      if(vi>=cc||!grid.cols[vi])return; var cx=grid.cols[vi].x; var cw=grid.cols[vi].w;
      els.push({type:'s',x:cx,y:cellY,w:cw,h:cH,fill:'cardBg',border:dk?null:'cardBorder'});
      els.push({type:'t',text:val,x:cx+0.15,y:cellY,w:cw-0.30,h:cH,font:'B',size:11,color:'body',valign:'middle'});
    });
  });
  return els;
}

function layoutSchedule(cfg) {
  var h=renderHeader(cfg); var els=h.els; var sY=h.contentY; var dk=cfg.dark===1;
  var items=cfg.items||[]; var aH=C.CONTENT_END-sY; var hH=0.40;
  var da=aH-hH-C.GAP; var gf=0.35;
  var rH=Math.max(0.38,Math.min(0.75,(da-(items.length-1)*C.GAP*gf)/items.length));
  var tX=C.SAFE_X_MIN; var tW=2.50; var aX=tX+tW+C.GAP; var aW=6.50; var wX=aX+aW+C.GAP; var wW=C.SAFE_W-tW-aW-C.GAP*2;
  els.push({type:'s',x:tX,y:sY,w:tW,h:hH,fill:'accent'}); els.push({type:'t',text:'TIME',x:tX+0.10,y:sY,w:tW-0.20,h:hH,font:'H',size:10,color:'white',valign:'middle'});
  els.push({type:'s',x:aX,y:sY,w:aW,h:hH,fill:'accent'}); els.push({type:'t',text:'ACTIVITY',x:aX+0.10,y:sY,w:aW-0.20,h:hH,font:'H',size:10,color:'white',valign:'middle'});
  els.push({type:'s',x:wX,y:sY,w:wW,h:hH,fill:'accent'}); els.push({type:'t',text:'PARTICIPANTS',x:wX+0.10,y:sY,w:wW-0.20,h:hH,font:'H',size:10,color:'white',valign:'middle'});
  var dsY=sY+hH+C.GAP;
  items.forEach(function(item,i){
    var ry=dsY+i*(rH+C.GAP*gf); var bg=i%2===0?'cardBg':(dk?'dkGray':'ltGray');
    els.push({type:'s',x:tX,y:ry,w:tW,h:rH,fill:bg}); els.push({type:'s',x:aX,y:ry,w:aW,h:rH,fill:bg}); els.push({type:'s',x:wX,y:ry,w:wW,h:rH,fill:bg});
    els.push({type:'t',text:item.time||'',x:tX+0.10,y:ry,w:tW-0.20,h:rH,font:'H',size:11,color:'accent',valign:'middle'});
    els.push({type:'t',text:item.activity||'',x:aX+0.10,y:ry,w:aW-0.20,h:rH,font:'B',size:12,color:'title',valign:'middle'});
    els.push({type:'t',text:item.who||'',x:wX+0.10,y:ry,w:wW-0.20,h:rH,font:'B',size:11,color:'body',valign:'middle'});
  });
  return els;
}

function layoutCoverloc(cfg) {
  var els=[];
  if(cfg.org) els.push({type:'t',text:cfg.org,x:C.SAFE_X_MIN,y:C.TAG_Y,w:11.00,h:0.30,font:'H',size:12,color:'muted'});
  var tY=cfg.org?1.30:C.TITLE_Y;
  els.push({type:'t',text:cfg.title,x:C.SAFE_X_MIN,y:tY,w:11.00,h:1.20,font:'H',size:48,color:'title'});
  if(cfg.location) els.push({type:'t',text:cfg.location,x:C.SAFE_X_MIN,y:tY+1.50,w:11.00,h:0.45,font:'H',size:24,color:'sub'});
  if(cfg.date) els.push({type:'t',text:cfg.date,x:C.SAFE_X_MIN,y:tY+2.10,w:11.00,h:0.35,font:'B',size:16,color:'body'});
  return els;
}

// ============================================================
// CLIENT ASSETS
// ============================================================

var CP_BG_URL = 'https://cdn.jsdelivr.net/gh/hugedeal-lab/standard-deck-v3@main/cover_slide_background.jpg';
var CP_LOGO_URL = 'https://cdn.jsdelivr.net/gh/hugedeal-lab/standard-deck-v3@main/cover_slide_logo.svg';
var CP_GRADIENT = 'radial-gradient(ellipse at 75% 75%, #1a2a3a 0%, #111d27 40%, #0b1319 100%)';
var _prefetchUrls = [];
function registerPrefetch(url) { if (_prefetchUrls.indexOf(url) === -1) _prefetchUrls.push(url); }
registerPrefetch(CP_LOGO_URL);
registerPrefetch(CP_BG_URL);

// ============================================================
// CLIENT: COVER-PRESENTER v5
// ============================================================

function layoutCoverPresenter(cfg) {
  var els = [];
  cfg.customFooter = true;
  cfg.bgGradient = 'url(' + CP_BG_URL + ') center/cover no-repeat, ' + CP_GRADIENT;
  cfg.bgImage = CP_BG_URL;

  var grid = getGrid(1);
  var cx = grid.cols[0].x;
  var cw = grid.cols[0].w;
  var tw = cw * 0.80;
  var GOLD = '#CAA380';

  els.push({ type:'img', src:CP_LOGO_URL, x:11.29, y:0.84, w:1.02, h:0.84 });

  var tY = 1.60;
  var titleLen = (cfg.title || '').length;
  var titleH = titleLen > 20 ? 1.20 : 0.80;
  if (cfg.title) {
    els.push({ type:'t', text:cfg.title, x:cx, y:tY, w:tw, h:titleH,
      font:'B', size:40, color:'title', textStyle:'L2' });
  }

  var sY = tY + (titleLen > 20 ? 1.40 : 1.05);
  if (cfg.subtitle) {
    els.push({ type:'t', text:cfg.subtitle, x:cx, y:sY, w:tw, h:0.45,
      font:'B', size:23, color:GOLD, textStyle:'L3' });
  }

  var dY = sY + 0.50;
  if (cfg.date) {
    els.push({ type:'t', text:cfg.date, x:cx, y:dY, w:tw, h:0.35,
      font:'B', size:18, color:GOLD, textStyle:'L3' });
  }

  var items = cfg.items || [];
  var presStartY = dY + 1.30;
  var rowStep = 0.75;

  items.forEach(function(item, i) {
    var ry = presStartY + (i * rowStep);
    if (ry + 0.64 <= 6.45) {
      els.push({ type:'t', text:item.title, x:cx, y:ry, w:tw, h:0.32,
        font:'H', size:18, color:'white', textStyle:'L3' });
      if (item.text) {
        els.push({ type:'t', text:item.text, x:cx, y:ry + 0.32, w:tw, h:0.32,
          font:'B', size:18, color:'white', textStyle:'L4' });
      }
    }
  });

  els.push({ type:'d', x:cx, y:6.55, w:cw, color:'white' });

  if (cfg.footerOrg) {
    els.push({ type:'t', text:cfg.footerOrg, x:cx, y:6.65, w:6.00, h:0.18,
      font:'H', size:8, color:'white', textStyle:'L3' });
  }
  if (cfg.footerDept) {
    els.push({ type:'t', text:cfg.footerDept, x:cx, y:6.83, w:6.00, h:0.18,
      font:'H', size:8, color:'white', textStyle:'L3' });
  }

  return els;
}

// ============================================================
// CLIENT: SECTION — asymmetric dark divider
// ============================================================

var SECTION_BG = '#535B69';

function layoutSection(cfg) {
  var els = [];
  cfg.customFooter = true;
  cfg.dark = 1;
  cfg.bgGradient = SECTION_BG;
  cfg.bgColor = SECTION_BG;

  var tc = 'white';

  if (cfg.num) {
    els.push({ type:'t', text:cfg.num, x:0.89, y:3.34, w:0.91, h:0.42,
      font:'H', size:20, color:tc, valign:'top' });
  }
  if (cfg.title) {
    els.push({ type:'t', text:cfg.title, x:8.60, y:3.34, w:3.86, h:0.42,
      font:'H', size:20, color:tc, valign:'top' });
  }

  var fY = 6.40;
  els.push({ type:'d', x:C.SAFE_X_MIN, y:fY, w:C.SAFE_W, color:tc });
  els.push({ type:'t', text:cfg.footerOrg || 'Mazda North American Operations',
    x:C.SAFE_X_MIN, y:fY + 0.10, w:8.00, h:0.15, font:'H', size:10, color:tc, textStyle:'L5' });
  els.push({ type:'t', text:cfg.footerConf || 'Confidential',
    x:C.SAFE_X_MIN, y:fY + 0.25, w:8.00, h:0.15, font:'B', size:10, color:tc });

  return els;
}

// ============================================================
// CLIENT: PROSE — basic narrative slide
// ============================================================

function layoutProse(cfg) {
  var header = renderHeader(cfg);
  var els = header.els;
  var startY = header.contentY;
  var isDark = cfg.dark === 1;

  var blockW = cfg.width || C.GRID.col2.cols[0].w;
  var textX = C.SAFE_X_MIN;
  var currentY = startY;

  var subColor = isDark ? 'accentLt' : 'title';
  var bodyColor = isDark ? 'white' : 'title';

  if (cfg.subtitle) {
    els.push({ type:'t', text:cfg.subtitle, x:textX, y:currentY,
      w:blockW, h:0.70, font:'H', size:18, color:subColor });
    currentY += 0.80;
  }

  if (cfg.text) {
    els.push({ type:'t', text:cfg.text, x:textX, y:currentY,
      w:blockW, h:C.CONTENT_END - currentY,
      font:'B', size:15, color:bodyColor, valign:'top' });
  }

  return els;
}

// ============================================================
// CLIENT: TWOCOLS — 2-column image + text spotlights
// ============================================================

function layoutTwoCols(cfg) {
  var header = renderHeader(cfg);
  var els = header.els;
  var startY = header.contentY;
  var isDark = cfg.dark === 1;

  var items = cfg.items || [];
  var cols = cfg.columns || 2;
  var grid = getGrid(cols);

  items.slice(0, cols).forEach(function(item, i) {
    var cx = grid.cols[i].x;
    var cw = grid.cols[i].w;
    var imgH = cw * (9 / 16);

    els.push({ type:'s', x:cx, y:startY, w:cw, h:imgH,
      fill: isDark ? 'cardBg' : 'white',
      border: isDark ? null : 'cardBorder',
      _imgPlaceholder: true });

    els.push({ type:'t', text:'RIGHT-CLICK \u2192 CHANGE PICTURE',
      x: cx + 0.20, y: startY + (imgH / 2) - 0.15,
      w: cw - 0.40, h: 0.30,
      font:'H', size:9, color: isDark ? 'muted' : 'gray',
      align:'center', valign:'middle',
      _skipExport: true });

    var textY = startY + imgH + 0.20;
    if (item.subtitle) {
      els.push({ type:'t', text:item.subtitle, x:cx, y:textY, w:cw, h:0.25,
        font:'H', size:13, color:'title', textStyle:'L3' });
      textY += 0.30;
    }

    if (item.text) {
      els.push({ type:'t', text:item.text, x:cx, y:textY, w:cw,
        h:C.CONTENT_END - textY, font:'B', size:11, color:'body' });
    }
  });

  return els;
}

// ============================================================
// CLIENT: GALLERY — 50/50 split with 3-image grid [v6.0.12]
// Left: title + subtitle + body. Right: cream/dkGray panel
// with 1 top + 2 bottom image placeholders.
// ============================================================

var GALLERY_PANEL = '#F5F1EB';

function layoutGallery(cfg) {
 var header = renderHeader(cfg);
 var els = header.els;
 var startY = header.contentY;
 var isDark = cfg.dark === 1;

 var splitX = C.SLIDE_W / 2;
 var leftW = splitX - C.SAFE_X_MIN - 0.50;

 // Constrain header elements to left half
 els.forEach(function(el) {
   if (el.y < startY && el.type === 't') {
     el.w = leftW;
   }
 });

 // Right-side background panel (full height)
 els.push({ type:'s', x:splitX, y:0, w:C.SLIDE_W - splitX, h:C.SLIDE_H,
   fill: isDark ? 'dkGray' : GALLERY_PANEL, border:null, noShadow:true });

 // Left content
 var textY = startY + 0.60;
 if (cfg.subtitle) {
   els.push({ type:'t', text:cfg.subtitle, x:C.SAFE_X_MIN, y:textY,
     w:leftW, h:0.40, font:'H', size:18, color:'title' });
   textY += 0.50;
 }
 if (cfg.text) {
   els.push({ type:'t', text:cfg.text, x:C.SAFE_X_MIN, y:textY,
     w:leftW, h:C.CONTENT_END - textY, font:'B', size:13, color:'body' });
 }

 // Right content: 3-image gallery
 var grid = getGrid(2);
 var rx = grid.cols[1].x;
 var rw = grid.cols[1].w;
 var availH = C.CONTENT_END - C.SAFE_Y_MIN;
 var topH = (availH - C.GAP) / 2;
 var bottomY = C.SAFE_Y_MIN + topH + C.GAP;
 var botW = (rw - C.GAP) / 2;
 var phFill = isDark ? 'black' : 'white';
 var phBorder = isDark ? null : 'ltGray';
 var phColor = isDark ? 'muted' : 'gray';

 // Top image (full width)
 els.push({ type:'s', x:rx, y:C.SAFE_Y_MIN, w:rw, h:topH,
   fill:phFill, border:phBorder, _imgPlaceholder:true });
 els.push({ type:'t', text:'RIGHT-CLICK \u2192 CHANGE PICTURE',
   x:rx+0.20, y:C.SAFE_Y_MIN+(topH/2)-0.15, w:rw-0.40, h:0.30,
   font:'H', size:9, color:phColor, align:'center', valign:'middle',
   _skipExport:true });

 // Bottom-left image
 els.push({ type:'s', x:rx, y:bottomY, w:botW, h:topH,
   fill:phFill, border:phBorder, _imgPlaceholder:true });
 els.push({ type:'t', text:'RIGHT-CLICK \u2192 CHANGE PICTURE',
   x:rx+0.10, y:bottomY+(topH/2)-0.15, w:botW-0.20, h:0.30,
   font:'H', size:8, color:phColor, align:'center', valign:'middle',
   _skipExport:true });

 // Bottom-right image
 var brX = rx + botW + C.GAP;
 var brW = rw - botW - C.GAP;
 els.push({ type:'s', x:brX, y:bottomY, w:brW, h:topH,
   fill:phFill, border:phBorder, _imgPlaceholder:true });
 els.push({ type:'t', text:'RIGHT-CLICK \u2192 CHANGE PICTURE',
   x:brX+0.10, y:bottomY+(topH/2)-0.15, w:brW-0.20, h:0.30,
   font:'H', size:8, color:phColor, align:'center', valign:'middle',
   _skipExport:true });

 return els;
}

// ============================================================
// DISPATCHER
// ============================================================

var LAYOUT_MAP = {
  cover:layoutCover, closing:layoutClosing, divider:layoutDivider,
  agenda:layoutAgenda, cards:layoutCards, stats:layoutStats,
  metrics:layoutMetrics, split:layoutSplit, rows:layoutRows,
  detail:layoutDetail, bullets:layoutBullets, pillar:layoutPillar,
  fromto:layoutFromto, capability:layoutCapability, schedule:layoutSchedule,
  coverloc:layoutCoverloc, coverPresenter:layoutCoverPresenter,
  section:layoutSection, prose:layoutProse, twoCols:layoutTwoCols, gallery:layoutGallery
};

function dispatch(slideData) {
  var fn = LAYOUT_MAP[slideData.layout];
  if (fn) return fn(slideData);
  if (slideData.els) return slideData.els;
  console.warn('[deck-layouts] Unknown layout: "' + slideData.layout + '"');
  return [];
}

window.DeckLayouts = { dispatch:dispatch, getPrefetchUrls:function(){ return _prefetchUrls; } };
})();