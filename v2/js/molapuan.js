/* Molapuan kartı: ince yatay kart. Üstte puan ve seviye, ortada sıradaki hedef,
   altta açılıp kapanan seviye yolu. Keşfet ve Profil aynı kartı kullanır. */
import { getPoints } from './api.js';
import { IC, STAR, chevR } from './icons.js';
import { toast } from './ui.js';
import { ROOT } from './root.js';

const OK='m360-mp';
const LOCK='<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const UP='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
const isOpen=()=>{try{return localStorage.getItem(OK)==='1'}catch(e){return false}};
const keep=o=>{try{o?localStorage.setItem(OK,'1'):localStorage.removeItem(OK)}catch(e){}};
const fmt=x=>x.toLocaleString('tr-TR');

export function molapuan(level){
  const {pts,n,levels:L}=getPoints(level),cur=L.filter(l=>n>=l.need).pop(),nxt=L.find(l=>n<l.need),top=L[L.length-1].need;
  /* duraklar sütun ortalarında; dolgu iki durak arasında orantılı ilerler */
  const k=L.length,i=L.findIndex(l=>n<l.need);
  const fill=i<0?100:(()=>{const a=i?L[i-1].need:0,x0=i?(2*i-1)/(2*k)*100:0,x1=(2*i+1)/(2*k)*100;return x0+(x1-x0)*(n-a)/(L[i].need-a)})();
  const stop=l=>{const st=l===cur?'cur':n>=l.need?'on':'off';
    return '<li class="'+st+'"><span class="mp-c">'+(st==='cur'?'Buradasın':l.need+' rez.')+'</span><span class="mp-n" aria-hidden="true">'+(st==='off'?LOCK:st==='cur'?STAR:IC.check)+'</span><b>'+l.name+'</b><small>'+l.perk+'</small></li>'};
  const goal=!nxt?'En üst seviyedesin, <em>'+cur.perk+'</em> her rezervasyonunda!'
    :!n?'İlk rezervasyonunla '+nxt.name+' ol, <em>'+nxt.goal+'</em>!'
    :nxt.to+' '+(nxt.need-n)+' rezervasyon kaldı, <em>'+nxt.goal+'</em>!';
  const o=isOpen();
  return '<section class="mp" aria-labelledby="mpT">'
   +'<div class="mp-top"><span class="mp-ic" aria-hidden="true">'+STAR+'</span>'
   +'<div class="mp-x"><h2 id="mpT">Molapuanın: <b>'+fmt(pts)+'</b></h2>'
   +'<div class="mp-r">'+(cur?'<span class="mp-lv">'+cur.name+'<i> · '+cur.perk+'</i></span>':'<span class="mp-lv off">Üye ol<i>, puan kazan</i></span>')
   +'<button type="button" class="mp-how" data-mp-how>Nasıl kazanırım?</button></div></div></div>'
   +'<a class="mp-next" href="'+ROOT+'liste/"><span>'+goal+'</span><span class="mp-go" aria-hidden="true">'+chevR+'</span></a>'
   +'<button type="button" class="mp-tg" aria-expanded="'+o+'" aria-controls="mpPath">'+UP+'<span>Seviye yolun<small>Son 24 ayda '+n+' rezervasyon · 1 puan = 1 TL</small></span></button>'
   +'<div class="mp-path" id="mpPath"'+(o?'':' hidden')+'><div class="mp-bar" role="progressbar" aria-label="Seviye ilerlemesi" aria-valuemin="0" aria-valuemax="'+top+'" aria-valuenow="'+n+'" aria-valuetext="'+top+' rezervasyondan '+n+'"><i style="width:'+fill.toFixed(1)+'%"></i></div>'
   +'<ol class="mp-lvls">'+L.map(stop).join('')+'</ol></div>'
   +'</section>';
}

/* olaylar bir kez, belge düzeyinde: kart yeniden çizilse de çalışır */
let bound=false;
export function initMolapuan(){
  if(bound)return;bound=true;
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-mp-how]'))return toast('Her 100 TL\'lik rezervasyonda 1 Molapuan kazanırsın. 1 puan = 1 TL olarak sonraki rezervasyonunda kullanılır.','Tamam',()=>{},6000);
    const t=e.target.closest('.mp-tg');if(!t)return;
    const o=t.getAttribute('aria-expanded')!=='true';t.setAttribute('aria-expanded',o);
    document.getElementById(t.getAttribute('aria-controls')).hidden=!o;keep(o);
  });
}
