/* Keşfet (anasayfa): arama (arama.js), kaldığın yerden, "Ne kadar molan var?" +
   kiminle, Bağlan önizlemesi, "Bu hafta sonu için", sahnede, temalar.
   Bölümler bilerek az: her biri tek bir soruya cevap veriyor. Veri
   yalnızca api.js'ten okunur. */
import { I } from './icons.js';
import { tl, ttl, makeScroll, toast } from './ui.js';
import { getLevel, setLevel } from './level.js';
import { favSync, initFavorites } from './favorites.js';
import { productCard, postMini, initPostActions } from './cards.js';
import { renderShell } from './shell.js';
import { initSearch } from './arama.js';
import { listPosts, listProducts, listEvents, listThemes, listRecent, clearRecent, BUCKETS, WITH, TYPES, typeKey } from './api.js';

renderShell('kesfet');

const fill=(el,html)=>{el.innerHTML=html;el.scrollLeft=0;el.dispatchEvent(new Event('scroll'))};

/* Kaldığın yerden: yalnızca bakılmış ürün varsa görünür */
const rc=document.getElementById('recent');
function recent(){const l=listRecent();rc.hidden=!l.length;if(l.length)fill(document.getElementById('rcRail'),l.map(productCard).join(''))}
document.getElementById('rcClear').addEventListener('click',()=>{clearRecent();recent();toast('Son baktıkların temizlendi.','Tamam',()=>{},2500)});

/* Ne kadar molan var? + Kiminle? (iki keşif filtresi birlikte) */
const tEl=document.getElementById('time'),rail=document.getElementById('timeRail'),rt=document.getElementById('railTitle'),wEl=document.getElementById('withChips');
let curB='hs',curK='',curW='otel';
const q=(k,v)=>k&&v?k+'='+v:'';
tEl.innerHTML=BUCKETS.map(b=>'<button class="tt" aria-pressed="false" data-b="'+b[0]+'"><span class="n">'+b[1]+'</span><span class="l">'+b[2]+'</span><span class="c"></span></button>').join('');
function pick(){
  tEl.querySelectorAll('.tt').forEach(e=>{e.setAttribute('aria-pressed',e.dataset.b===curB);e.querySelector('.c').textContent=listProducts({sure:e.dataset.b,kimle:curK}).length+' seçenek'});
  wEl.querySelectorAll('[data-k]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.k===curK));
  const W=WITH.find(w=>w[0]===curK);
  rt.textContent=BUCKETS.find(x=>x[0]===curB)[3]+(W?' · '+W[1].toLocaleLowerCase('tr'):'');
  document.getElementById('railAll').href='liste/?'+[q('sure',curB),q('kimle',curK)].filter(Boolean).join('&');
  const list=listProducts({sure:curB,kimle:curK});
  const ks=TYPES.filter(t=>list.some(p=>typeKey(p.type)===t[0])).map((t,i)=>i?t[2].toLocaleLowerCase('tr'):t[2]);
  document.getElementById('railSub').textContent=!ks.length?'Bu seçimde deneyim yok; başka bir süre dene.':ks.length>1?ks.slice(0,-1).join(', ')+' ve '+ks[ks.length-1]:ks[0];
  fill(rail,list.map(productCard).join(''));
  favSync();
}
wEl.innerHTML='<span class="fl">Kiminle?</span>'+WITH.map(w=>'<button type="button" class="fc" aria-pressed="false" data-k="'+w[0]+'">'+w[1]+'</button>').join('');
tEl.addEventListener('click',e=>{const t=e.target.closest('.tt');if(t){curB=t.dataset.b;pick()}});
wEl.addEventListener('click',e=>{const t=e.target.closest('[data-k]');if(t){curK=t.dataset.k===curK?'':t.dataset.k;pick()}});

/* Bu hafta sonu için: oteller, mekânlar, yurt dışı tek bölümde */
const WK={otel:()=>listProducts({type:'otel'}),mekan:()=>listProducts({type:'mekan'}),yurtdisi:()=>listProducts({type:'tur'}).filter(p=>p.abroad)};
const WKALL={otel:'liste/?tur=otel',mekan:'liste/?tur=mekan',yurtdisi:'liste/?tur=tur'};
const wk=document.getElementById('wkRail');
function week(w){curW=w;
  document.querySelectorAll('[data-w]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.w===w));
  document.getElementById('wkAll').href=WKALL[w];
  fill(wk,WK[w]().map(productCard).join(''));
}
document.querySelector('[data-w]').parentElement.addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(b)week(b.dataset.w)});

/* Bu hafta sonu sahnede: bilet görünümünde ilk üç etkinlik */
document.getElementById('events').innerHTML=listEvents().slice(0,3).map(e=>'<article class="tk"><div class="stub"><span class="dw">'+e.dw+'</span><span class="dn">'+e.dn+'</span><span class="mo">'+e.month+'</span></div><span class="notch t"></span><span class="notch b"></span>'
 +'<div class="tb"><div class="x"><div class="cat">'+e.cat.toLocaleUpperCase('tr')+'</div><h3>'+ttl(e.title)+'</h3><div class="meta">'+I.clock+'<span>'+e.time+' · '+e.place+'</span></div><div class="p"><b>'+tl(e.price)+'</b>\'den başlayan</div></div>'
 +'<div class="thumb" style="background:'+e.bg+'"></div></div></article>').join('');

/* Temaya göre keşfet: her tema kendi listesine gider */
document.getElementById('themeRail').innerHTML=listThemes().map(t=>'<a href="liste/?tema='+t.id+'" class="th" style="background:'+t.bg+'"><b>'+t.name+'</b><span>'+t.types.join(' · ')+'</span></a>').join('');

/* Bağlan önizlemesi: paylaşımlar bağlı oldukları ürünle */
document.getElementById('postRail').innerHTML=listPosts().map(postMini).join('');
initPostActions(toast);

/* taslak: misafir / üye görünümü */
document.querySelector('.demo').addEventListener('click',e=>{const b=e.target.closest('.dm');if(!b)return;setLevel(b.dataset.v);const m=getLevel()!=='guest';
  document.querySelectorAll('.dm').forEach(x=>x.setAttribute('aria-pressed',x===b));
  document.querySelectorAll('[data-member]').forEach(x=>x.hidden=!m);document.querySelectorAll('[data-guest]').forEach(x=>x.hidden=m);
  document.getElementById('lvlTxt').textContent=getLevel()==='kasif'?'Kâşif · 1.240 Molapuan':'Gezgin · 320 Molapuan';
  pick();week(curW);recent();favSync()});

recent();
pick();
week('otel');
initFavorites();
favSync();

/* Arama: nereye, ne zaman, kaç kişi (arama.js) */
initSearch();

document.querySelectorAll('.rail').forEach(el=>makeScroll(el));
document.querySelectorAll('.tabs,.fchips').forEach(el=>makeScroll(el));
