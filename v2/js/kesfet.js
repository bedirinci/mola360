/* Keşfet (anasayfa): arama (arama.js), kaldığın yerden, "Ne kadar molan var?" +
   kiminle, yakınımda, Bağlan önizlemesi, "Bu hafta sonu için", sahnede,
   temalar. Bölümler bilerek az: her biri tek bir soruya cevap veriyor. Veri
   yalnızca api.js'ten okunur. */
import { CLOCK } from './icons.js';
import { makeScroll, toast } from './ui.js';
import { getLevel, setLevel } from './level.js';
import { favSync, initFavorites } from './favorites.js';
import { productCard, recentCard, ticket, postMini, initPostActions } from './cards.js';
import { renderShell } from './shell.js';
import { initSearch } from './arama.js';
import { listPosts, listProducts, listEvents, listThemes, listRecent, clearRecent, listNearby, nearestPlace, placePos, getDestination, BUCKETS, WITH, TYPES, typeKey } from './api.js';

renderShell('kesfet');

const $=id=>document.getElementById(id);
const fill=(el,html)=>{el.innerHTML=html;el.scrollLeft=0;el.dispatchEvent(new Event('scroll'))};
const svg=p=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';

/* Kaldığın yerden: yalnızca bakılmış ürün varsa görünür */
const rc=$('recent');
function recent(){const l=listRecent();rc.hidden=!l.length;if(l.length)fill($('rcRail'),l.map(recentCard).join(''))}
$('rcClear').addEventListener('click',()=>{clearRecent();recent();toast('Son baktıkların temizlendi.','Tamam',()=>{},2500)});

/* Ne kadar molan var? + Kiminle? (iki keşif filtresi birlikte) */
const ICON={saat:CLOCK,
  gun:svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
  hs:svg('<path d="M2.5 20h19M4.5 20 12 5l7.5 15"/><path d="m10 20 2-4 2 4"/>'),
  uzun:svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4.5h6V7M3 13h18"/>')};
const tEl=$('time'),rail=$('timeRail'),wEl=$('withChips');
let curB='hs',curK='',curW='',nearAt=null;
const q=(k,v)=>k&&v?k+'='+v:'';
tEl.innerHTML=BUCKETS.map(b=>'<button type="button" class="tt" aria-pressed="false" data-b="'+b[0]+'"><span class="i">'+ICON[b[0]]+'</span><span class="x"><b>'+b[1]+'</b><small></small></span></button>').join('');
wEl.innerHTML=WITH.map(w=>'<button type="button" class="fc" aria-pressed="false" data-k="'+w[0]+'">'+w[1]+'</button>').join('');
function pick(){
  tEl.querySelectorAll('.tt').forEach(e=>{e.setAttribute('aria-pressed',e.dataset.b===curB);e.querySelector('small').textContent=listProducts({sure:e.dataset.b,kimle:curK}).length+' deneyim'});
  wEl.querySelectorAll('[data-k]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.k===curK));
  const W=WITH.find(w=>w[0]===curK);
  $('railTitle').textContent=BUCKETS.find(x=>x[0]===curB)[2]+(W?' · '+W[1].toLocaleLowerCase('tr'):'');
  $('railAll').href='liste/?'+[q('sure',curB),q('kimle',curK)].filter(Boolean).join('&');
  const list=listProducts({sure:curB,kimle:curK});
  fill(rail,list.length?list.map(productCard).join('')
    :'<div class="empty-r"><b>Bu seçimde deneyim yok</b>Başka bir süre seç ya da kiminle seçimini kaldır.</div>');
  favSync();
}
tEl.addEventListener('click',e=>{const t=e.target.closest('.tt');if(t){curB=t.dataset.b;pick()}});
wEl.addEventListener('click',e=>{const t=e.target.closest('[data-k]');if(t){curK=t.dataset.k===curK?'':t.dataset.k;pick()}});

/* Yakınımda ne var? Konum yalnızca kullanıcı dokununca istenir. Seçim bu
   cihazda hatırlanır ("gps" ya da "yer:izmir"); konumun kendisi saklanmaz.
   İzin daha önce verildiyse sonraki açılışta yeniden sormadan kullanılır. */
const NK='m360-yakin',CITIES=['istanbul','izmir','ankara','antalya'];
const nGo=$('nearGo'),nCard=$('nearCard'),nOn=$('nearOn'),nAlt=$('nearAlt');
const nGet=()=>{try{return localStorage.getItem(NK)||''}catch(e){return ''}};
const nSet=v=>{try{v?localStorage.setItem(NK,v):localStorage.removeItem(NK)}catch(e){}};
function nearShow(pos,label){
  nearAt=[pos,label];nCard.hidden=true;nOn.hidden=false;
  $('nearLoc').textContent=label;
  fill($('nearRail'),listNearby(pos).map(productCard).join(''));
  favSync();
}
function nearOff(){nSet('');nearAt=null;nOn.hidden=true;nCard.hidden=false;nAlt.hidden=true;nGo.disabled=false;nGo.querySelector('span').textContent='Konumumu kullan'}
function nearCity(id){const d=getDestination(id),pos=placePos(id);if(!d||!pos)return nearOff();nSet('yer:'+id);nearShow(pos,d.name+' çevresi')}
function nearFail(msg){nGo.disabled=false;nGo.querySelector('span').textContent='Tekrar dene';nAlt.hidden=false;$('nearMsg').textContent=msg}
function nearGps(){
  if(!navigator.geolocation)return nearFail('Tarayıcın konum paylaşmıyor. Bir şehir seç:');
  nGo.disabled=true;nGo.querySelector('span').textContent='Konum alınıyor…';
  /* izin sorusu cevapsız kalırsa düğme kilitli kalmasın */
  const late=setTimeout(()=>nearFail('Konumun alınamadı. İstersen bir şehir seç:'),15000);
  navigator.geolocation.getCurrentPosition(p=>{clearTimeout(late);
    const pos=[p.coords.latitude,p.coords.longitude],n=nearestPlace(pos);
    nSet('gps');nGo.disabled=false;nearShow(pos,n&&n.km<=60?n.name+' çevresi':'Konumuna göre');
  },e=>{clearTimeout(late);nearFail(e.code===1?'Konum izni verilmedi. İstersen bir şehir seç:':'Konumun alınamadı. İstersen bir şehir seç:')},{timeout:10000,maximumAge:600000});
}
$('nearCities').innerHTML=CITIES.map(id=>'<button type="button" data-city="'+id+'">'+getDestination(id).name+'</button>').join('');
nGo.addEventListener('click',nearGps);
$('nearCities').addEventListener('click',e=>{const b=e.target.closest('[data-city]');if(b)nearCity(b.dataset.city)});
$('nearOff').addEventListener('click',()=>{nearOff();nGo.focus({preventScroll:true})});
(function nearStart(){
  const v=nGet();
  if(v.startsWith('yer:'))return nearCity(v.slice(4));
  if(v==='gps'&&navigator.permissions)navigator.permissions.query({name:'geolocation'}).then(r=>{if(r.state==='granted')nearGps()}).catch(()=>{});
})();

/* Bu hafta sonu için: bu hafta sonu yapılabilecekler, kategoriye göre.
   Tümü'nde türler karışık sıralanır. */
const wk=$('wkRail'),wkC=$('wkChips');
const mix=l=>{const by=TYPES.map(t=>l.filter(p=>typeKey(p.type)===t[0])),out=[];for(let i=0;out.length<l.length;i++)by.forEach(b=>b[i]&&out.push(b[i]));return out};
wkC.innerHTML=[['','Tümü'],...TYPES.map(t=>[t[0],t[2]])].map(t=>'<button type="button" class="fc" aria-pressed="false" data-w="'+t[0]+'">'+t[1]+'</button>').join('');
function week(w){curW=w;
  wkC.querySelectorAll('[data-w]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.w===w));
  $('wkAll').href='liste/?'+[q('tur',w),'tarih=bu-hs'].filter(Boolean).join('&');
  const l=listProducts({type:w,tarih:'bu-hs'});
  fill(wk,(w?l:mix(l)).map(productCard).join(''));
  favSync();
}
wkC.addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(b)week(b.dataset.w)});

/* Bu hafta sahnede: önümüzdeki 7 günün etkinlikleri, bilet görünümünde */
$('events').innerHTML=listEvents().slice(0,4).map(ticket).join('');

/* Temaya göre keşfet: yalnızca tema adı; her tema tur, otel, etkinlik,
   aktivite ve mekânı birlikte getirir */
$('themeRail').innerHTML=listThemes().map(t=>'<a href="liste/?tema='+t.id+'" class="th" style="background:'+t.bg+'"><b>'+t.name+'</b></a>').join('');

/* Bağlan önizlemesi: paylaşımlar bağlı oldukları ürünle */
$('postRail').innerHTML=listPosts().map(postMini).join('');
initPostActions(toast);

/* taslak: misafir / üye görünümü */
document.querySelector('.demo').addEventListener('click',e=>{const b=e.target.closest('.dm');if(!b)return;setLevel(b.dataset.v);const m=getLevel()!=='guest';
  document.querySelectorAll('.dm').forEach(x=>x.setAttribute('aria-pressed',x===b));
  document.querySelectorAll('[data-member]').forEach(x=>x.hidden=!m);document.querySelectorAll('[data-guest]').forEach(x=>x.hidden=m);
  document.getElementById('lvlTxt').textContent=getLevel()==='kasif'?'Kâşif · 1.240 Molapuan':'Gezgin · 320 Molapuan';
  pick();week(curW);recent();if(nearAt)nearShow(...nearAt);favSync()});

recent();
pick();
week('');
initFavorites();
favSync();

/* Arama: nereye, ne zaman, kaç kişi (arama.js) */
initSearch();

document.querySelectorAll('.rail').forEach(el=>makeScroll(el));
document.querySelectorAll('.tabs,.fchips').forEach(el=>makeScroll(el));
