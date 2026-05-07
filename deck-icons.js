/* deck-icons.js — Lucide SVG bundle for Standard Deck */
/* Generated: 2026-05-07T19:42:58.136Z | 0 icons */
(function(){
'use strict';
var I={
};
function get(n,color,size){
  var s=I[n];if(!s)return '';
  if(color)s=s.replace(/currentColor/g,color);
  if(size)s='<svg width="'+size+'" height="'+size+'"'+s.slice(4);
  return s;
}
window.DeckIcons={
  get:get,
  has:function(n){return !!I[n];},
  list:function(){return Object.keys(I);},
  toDataURL:function(n,size,color){
    var s=get(n,color||'#000000',size||48);
    if(!s)return null;
    return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(s)));
  }
};
})();
