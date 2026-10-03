/* Keşfet (anasayfa): arama, "Ne kadar molan var?", Bağlan önizlemesi,
   "Bu hafta sonu için", sahnede, temalar. Bölümler bilerek az: her biri
   tek bir soruya cevap veriyor. */
import { ITEMS, BUCKETS, PL, EV, TABS, G } from './data.js';
import { I } from './icons.js';
import { tl, ttl, makeScroll, toast } from './ui.js';
import { getLevel, setLevel } from './level.js';
import { favSync, initFavorites } from './favorites.js';
import { card, productCard, postMini, initPostActions } from './cards.js';
import { renderShell } from './shell.js';
import { listPosts, listProducts } from './api.js';

renderShell('kesfet');

/* Ne kadar molan var? */
const tEl=document.getElementById('time'),rail=document.getElementById('timeRail'),rt=document.getElementById('railTitle');
tEl.innerHTML=BUCKETS.map(b=>{const n=ITEMS.filter(x=>x.b===b[0]).length;return '<button class="tt" aria-pressed="false" data-b="'+b[0]+'"><span class="n">'+b[1]+'</span><span class="l">'+b[2]+'</span><span class="c">'+n+' seçenek</span></button>'}).join('');
let curB='hs',curW='otel';
function pick(b){curB=b;
  tEl.querySelectorAll('.tt').forEach(e=>e.setAttribute('aria-pressed',e.dataset.b===b));
  rt.textContent=BUCKETS.find(x=>x[0]===b)[3];document.getElementById('railAll').href='liste/?sure='+b;
  const list=ITEMS.filter(x=>x.b===b);
  const ks=[...new Set(list.map(x=>PL[x.k]))].map((k,i)=>i?k.toLocaleLowerCase('tr'):k);
  document.getElementById('railSub').textContent=ks.length>1?ks.slice(0,-1).join(', ')+' ve '+ks[ks.length-1]:ks[0];
  rail.innerHTML=list.map(card).join('');
  rail.scrollLeft=0;rail.dispatchEvent(new Event('scroll'));
}
tEl.addEventListener('click',e=>{const t=e.target.closest('.tt');if(t)pick(t.dataset.b)});

/* Bu hafta sonu için: oteller, mekânlar, yurt dışı tek bölümde */
const WK={otel:()=>listProducts({type:'otel'}),mekan:()=>listProducts({type:'mekan'}),yurtdisi:()=>listProducts({type:'tur'}).filter(p=>p.abroad)};
const WKALL={otel:'liste/?tur=otel',mekan:'liste/?tur=mekan',yurtdisi:'liste/?tur=tur'};
const wk=document.getElementById('wkRail');
function week(w){curW=w;
  document.querySelectorAll('[data-w]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.w===w));
  document.getElementById('wkAll').href=WKALL[w];
  wk.innerHTML=WK[w]().map(productCard).join('');wk.scrollLeft=0;wk.dispatchEvent(new Event('scroll'));
}
document.querySelector('[data-w]').parentElement.addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(b)week(b.dataset.w)});

/* Bu hafta sonu sahnede: bilet görünümünde ilk üç etkinlik */
document.getElementById('events').innerHTML=EV.slice(0,3).map(e=>'<article class="tk"><div class="stub"><span class="dw">'+e[0]+'</span><span class="dn">'+e[1]+'</span><span class="mo">EKİM</span></div><span class="notch t"></span><span class="notch b"></span>'
 +'<div class="tb"><div class="x"><div class="cat">'+e[2].toUpperCase()+'</div><h3>'+ttl(e[3])+'</h3><div class="meta">'+I.clock+'<span>'+e[4]+'</span></div><div class="p"><b>'+tl(e[5])+'</b>\'den başlayan</div></div>'
 +'<div class="thumb" style="background:'+G[e[6]]+'"></div></div></article>').join('');

/* Bağlan önizlemesi: paylaşımlar bağlı oldukları ürünle */
document.getElementById('postRail').innerHTML=listPosts().map(postMini).join('');
initPostActions(toast);

/* taslak: misafir / üye görünümü */
document.querySelector('.demo').addEventListener('click',e=>{const b=e.target.closest('.dm');if(!b)return;setLevel(b.dataset.v);const m=getLevel()!=='guest';
  document.querySelectorAll('.dm').forEach(x=>x.setAttribute('aria-pressed',x===b));
  document.querySelectorAll('[data-member]').forEach(x=>x.hidden=!m);document.querySelectorAll('[data-guest]').forEach(x=>x.hidden=m);
  document.getElementById('lvlTxt').textContent=getLevel()==='kasif'?'Kâşif · 1.240 Molapuan':'Gezgin · 320 Molapuan';
  pick(curB);week(curW);favSync()});

pick('hs');
week('otel');
initFavorites();
favSync();

/* sekmeye göre arama kutusu */
const f1=()=>document.querySelector('#f1 span');
let curTab='tur';
document.querySelector('.tabs').addEventListener('click',e=>{const t=e.target.closest('.tab');if(!t)return;curTab=t.dataset.tab;
  document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x===t));
  const v=TABS[t.dataset.tab];['f1','f2','f3'].forEach((id,i)=>{const f=document.getElementById(id);f.querySelector('small').textContent=v[i*2];f.querySelector('span').textContent=v[i*2+1]});
  document.getElementById('go').textContent=v[6];f1().classList.add('hint');});
/* Arama: seçili ürün türünün listesine gider */
document.getElementById('search').addEventListener('submit',()=>{location.href='liste/?tur='+curTab});

document.querySelectorAll('.rail').forEach(el=>makeScroll(el,true));
document.querySelectorAll('.tabs,.fchips').forEach(el=>makeScroll(el,false));
