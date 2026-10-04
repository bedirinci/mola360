/* Keşfet (anasayfa): arama (arama.js), kaldığın yerden, "Ne kadar molan var?" +
   kiminle, yakınımda, Bağlan önizlemesi, "Bu hafta sonu için", sahnede,
   temalar. Bölümler bilerek az: her biri tek bir soruya cevap veriyor. Veri
   yalnızca api.js'ten okunur.
   Keşfet seni hatırlar: süre ve kiminle seçimi bu cihazda saklanır, arama
   kutusuna biner; bölümlerin sırası değişmez, içlerindeki deneyimler
   kiminle seçimine ve yakınlığa göre sıralanır. */
import { ROOT } from './root.js';
import { makeScroll, toast } from './ui.js';
import { getLevel } from './level.js';
import { molapuan, initMolapuan } from './molapuan.js';
import { favSync, initFavorites } from './favorites.js';
import { productCard, recentCard, ticket, postMini, initPostActions } from './cards.js';
import { renderShell } from './shell.js';
import { listPosts, listProducts, listEvents, listThemes, listRecent, clearRecent, listNearby, nearestPlace, placePos, getDestination, BUCKETS, WITH, TYPES, typeKey } from './api.js';

renderShell('kesfet');

const $=id=>document.getElementById(id);
const fill=(el,html)=>{el.innerHTML=html;el.scrollLeft=0;el.dispatchEvent(new Event('scroll'))};

/* Hatırlanan seçim (m360-kesfet: {b, k}); konum burada tutulmaz */
const MK='m360-kesfet';
const mem=(()=>{try{return JSON.parse(localStorage.getItem(MK))||{}}catch(e){return {}}})();
const keep=()=>{try{localStorage.setItem(MK,JSON.stringify({b:curB,k:curK}))}catch(e){}};
let curB=BUCKETS.some(b=>b[0]===mem.b)?mem.b:'hs',curK=WITH.some(w=>w[0]===mem.k)?mem.k:'',curW='',nearAt=null;

/* Arama: nereye, ne zaman, kaç kişi (arama.js). Kiminle seçimi aramayı
   etkilemez; yalnızca Keşfet'teki rayların sırasını belirler */
/* Arama ayrı yüklenir: arama modülünde bir sorun olsa (ör. yayından hemen
   sonra tarayıcı eski ve yeni dosyaları karıştırırsa) raylar ve kartlar
   yine çizilir */
let srch={setNear(){}};
import('./arama.js').then(m=>{srch=m.initSearch();if(nearAt)srch.setNear(nearAt[2]);
  document.querySelectorAll('.pchips').forEach(el=>makeScroll(el))}).catch(e=>console.error(e));

/* Kişiye göre sıra: kiminle seçimine uyanlar öne; aynı derecedekiler kendi
   sırasında kalır. Konum yalnızca "Yakınımda ne var?" rayını doldurur,
   öteki bölümlerin sırasını değiştirmez (Bedir, 2026-10-04). */
const score=p=>curK&&p&&!p.with.includes(curK)?1:0;
const rank=(l,of=x=>x)=>l.map((x,i)=>[x,score(of(x)),i]).sort((a,b)=>a[1]-b[1]||a[2]-b[2]).map(a=>a[0]);

/* Kaldığın yerden: yalnızca bakılmış ürün varsa görünür */
const rc=$('recent');
/* geri ile dönünce raf ayrıldığın gibi kalır: arada yeni açılan raf sayfayı kaydırmasın (sonraki açılışta görünür) */
const back=(performance.getEntriesByType('navigation')[0]||{}).type==='back_forward'&&history.state&&history.state.rc===false;
function recent(){const l=back&&rc.hidden?[]:listRecent();rc.hidden=!l.length;if(l.length)fill($('rcRail'),l.map(recentCard).join(''));
  history.replaceState({...history.state,rc:!rc.hidden},'')}
$('rcClear').addEventListener('click',()=>{clearRecent();recent();toast('Son baktıkların temizlendi.','Tamam',()=>{},2500)});

/* Ne kadar molan var? + Kiminle? (iki keşif filtresi birlikte) */
/* süre ikonları: Bedir'in verdiği 3B ikonlar (v2/img/KAYNAK.md) */
const ICON=b=>'<img src="'+ROOT+'img/sure-'+b+'.webp" alt="" width="40" height="40" decoding="async">';
const tEl=$('time'),rail=$('timeRail'),wEl=$('withChips');
const q=(k,v)=>k&&v?k+'='+v:'';
tEl.innerHTML=BUCKETS.map(b=>'<button type="button" class="tt" aria-pressed="false" data-b="'+b[0]+'"><span class="i">'+ICON(b[0])+'</span><span class="x"><b>'+b[1]+'</b><small></small></span></button>').join('');
wEl.innerHTML=WITH.map(w=>'<button type="button" class="fc" aria-pressed="false" data-k="'+w[0]+'">'+w[1]+'</button>').join('');
function pick(){
  tEl.querySelectorAll('.tt').forEach(e=>{e.setAttribute('aria-pressed',e.dataset.b===curB);e.querySelector('small').textContent=listProducts({sure:e.dataset.b,kimle:curK}).length+' deneyim'});
  wEl.querySelectorAll('[data-k]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.k===curK));
  /* kiminle seçimi hemen üstteki çipte görünüyor; başlık tek satırda kalsın diye yalnızca süre */
  $('railTitle').textContent=BUCKETS.find(x=>x[0]===curB)[2];
  $('railAll').href='liste/?'+[q('sure',curB),q('kimle',curK)].filter(Boolean).join('&');
  const list=rank(listProducts({sure:curB,kimle:curK}));
  fill(rail,list.length?list.map(productCard).join('')
    :'<div class="empty-r"><b>Bu seçimde deneyim yok</b>Başka bir süre seç ya da kiminle seçimini kaldır.</div>');
  favSync();
}
tEl.addEventListener('click',e=>{const t=e.target.closest('.tt');if(t){curB=t.dataset.b;keep();pick()}});
wEl.addEventListener('click',e=>{const t=e.target.closest('[data-k]');if(t){curK=t.dataset.k===curK?'':t.dataset.k;keep();pick();personal()}});

/* Yakınımda ne var? Konum yalnızca kullanıcı dokununca istenir. Seçim bu
   cihazda hatırlanır ("gps" ya da "yer:izmir"); konumun kendisi saklanmaz.
   İzin daha önce verildiyse sonraki açılışta yeniden sormadan kullanılır. */
const NK='m360-yakin',CITIES=['istanbul','izmir','ankara','antalya'];
const nGo=$('nearGo'),nCard=$('nearCard'),nOn=$('nearOn'),nAlt=$('nearAlt');
const nGet=()=>{try{return localStorage.getItem(NK)||''}catch(e){return ''}};
const nSet=v=>{try{v?localStorage.setItem(NK,v):localStorage.removeItem(NK)}catch(e){}};
function nearShow(pos,label,place){
  nearAt=[pos,label,place];nCard.hidden=true;nOn.hidden=false;
  $('nearLoc').textContent=label;
  fill($('nearRail'),listNearby(pos).map(productCard).join(''));
  srch.setNear(place);
}
function nearOff(){nSet('');nearAt=null;srch.setNear(null);nOn.hidden=true;nCard.hidden=false;nAlt.hidden=true;nGo.disabled=false;nGo.querySelector('span').textContent='Konumumu kullan'}
$('nearOff').addEventListener('click',()=>{nearOff();nGo.focus()});
function nearCity(id){const d=getDestination(id),pos=placePos(id);if(!d||!pos)return nearOff();nSet('yer:'+id);nearShow(pos,d.name+' çevresi',id)}
function nearFail(msg){nGo.disabled=false;nGo.querySelector('span').textContent='Tekrar dene';nAlt.hidden=false;$('nearMsg').textContent=msg}
function nearGps(){
  if(!navigator.geolocation)return nearFail('Tarayıcın konum paylaşmıyor. Bir şehir seç:');
  nGo.disabled=true;nGo.querySelector('span').textContent='Konum alınıyor…';
  /* izin sorusu cevapsız kalırsa düğme kilitli kalmasın */
  const late=setTimeout(()=>nearFail('Konumun alınamadı. İstersen bir şehir seç:'),15000);
  navigator.geolocation.getCurrentPosition(p=>{clearTimeout(late);
    const pos=[p.coords.latitude,p.coords.longitude],n=nearestPlace(pos);
    const ok=n&&n.km<=60;nSet('gps');nGo.disabled=false;nearShow(pos,ok?n.name+' çevresi':'Konumuna göre',ok?n.id:null);
  },e=>{clearTimeout(late);nearFail(e.code===1?'Konum izni verilmedi. İstersen bir şehir seç:':'Konumun alınamadı. İstersen bir şehir seç:')},{timeout:10000,maximumAge:600000});
}
$('nearCities').innerHTML=CITIES.map(id=>'<button type="button" data-city="'+id+'">'+getDestination(id).name+'</button>').join('');
nGo.addEventListener('click',nearGps);
$('nearCities').addEventListener('click',e=>{const b=e.target.closest('[data-city]');if(b)nearCity(b.dataset.city)});
/* açılışta: şehir seçildiyse hemen, konum izni verildiyse yeniden sormadan */
function nearStart(){
  const v=nGet();
  if(v.startsWith('yer:')){nearCity(v.slice(4));return true}
  if(v==='gps'&&navigator.permissions)navigator.permissions.query({name:'geolocation'}).then(r=>{if(r.state==='granted')nearGps()}).catch(()=>{});
  return false;
}

/* Bu hafta sonu için: bu hafta sonu yapılabilecekler, kategoriye göre.
   Tümü'nde türler karışık sıralanır. */
const wk=$('wkRail'),wkC=$('wkChips');
const mix=l=>{const by=TYPES.map(t=>l.filter(p=>typeKey(p.type)===t[0])),out=[];for(let i=0;out.length<l.length;i++)by.forEach(b=>b[i]&&out.push(b[i]));return out};
wkC.innerHTML=[['','Tümü'],...TYPES.map(t=>[t[0],t[2]])].map(t=>'<button type="button" class="fc" aria-pressed="false" data-w="'+t[0]+'">'+t[1]+'</button>').join('');
function week(w){curW=w;
  wkC.querySelectorAll('[data-w]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.w===w));
  $('wkAll').href='liste/?'+[q('tur',w),'tarih=bu-hs'].filter(Boolean).join('&');
  const l=rank(listProducts({type:w,tarih:'bu-hs'}));
  fill(wk,(w?l:mix(l)).map(productCard).join(''));
  favSync();
}
wkC.addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(b)week(b.dataset.w)});

/* Bu hafta sahnede: önümüzdeki 7 günün etkinlikleri, bilet görünümünde;
   sana en uygun dördü, gün ve saat sırasıyla */
const events=()=>{$('events').innerHTML=rank(listEvents()).slice(0,4).sort((a,b)=>a.day-b.day||a.time.localeCompare(b.time)).map(ticket).join('')};

/* Temaya göre keşfet: yalnızca tema adı; her tema tur, otel, etkinlik,
   aktivite ve mekânı birlikte getirir */
$('themeRail').innerHTML=listThemes().map(t=>'<a href="liste/?tema='+t.id+'" class="th" style="background:'+t.bg+'"><b>'+t.name+'</b></a>').join('');

/* Bağlan önizlemesi: paylaşımlar bağlı oldukları ürünle */
const posts=()=>fill($('postRail'),rank(listPosts(),x=>x.product).map(postMini).join(''));
initPostActions(toast);

/* kiminle ya da yakınlık değişince sıralanan bölümler */
function personal(){week(curW);events();posts();favSync()}
const mpBox=document.getElementById('mpBox'),mpDraw=()=>{mpBox.innerHTML=molapuan(getLevel())};

mpDraw();initMolapuan();
recent();
nearStart();pick();personal();
initFavorites();
favSync();

document.querySelectorAll('.rail').forEach(el=>makeScroll(el));
document.querySelectorAll('.tabs,.fchips').forEach(el=>makeScroll(el));
