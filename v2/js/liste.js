/* Liste: kategori (ürün ne?), filtreler (keşif kriteri), arama (yer ya da
   metin) ve tema ayrı satırlarda ve ayrı adres parametrelerinde:
   ?tur=otel&yer=kapadokya&tarih=bu-hs&sure=hs&kimle=sevgili&tema=doga
   (docs/yeni-surum.md kural 3). Tema seçiliyse sayfa temanın vitrini olur:
   kapak, iki cümlelik giriş, temadaki kategoriler ve paylaşımlar. */
import { renderShell } from './shell.js';
import { listProducts, listPosts, getTheme, getDestination, getSearch, typeKey, TYPES, BUCKETS, WITH, WHEN } from './api.js';
import { productCard, postMini } from './cards.js';
import { toast } from './ui.js';
import { initFavorites, favSync } from './favorites.js';

renderShell('kesfet');
initFavorites();

const q=new URLSearchParams(location.search);
let tur=TYPES.some(t=>t[0]===q.get('tur'))?q.get('tur'):'';
let sure=BUCKETS.some(b=>b[0]===q.get('sure'))?q.get('sure'):'';
let kimle=WITH.some(w=>w[0]===q.get('kimle'))?q.get('kimle'):'';
let yer=getDestination(q.get('yer'))?q.get('yer'):'';
let ara=(q.get('ara')||'').trim().slice(0,60);
let tarih=WHEN.some(w=>w[0]===q.get('tarih'))?q.get('tarih'):'';
const th=getTheme(q.get('tema'));
/* Keşfet'teki aramada seçilen kişi sayısı (yalnızca bu sekmede) */
const s=getSearch();

/* Tema vitrini: kapakta temanın görseli, adı ve girişi; sekmelerde yalnızca
   temada olan kategoriler */
if(th){const top=document.querySelector('.pg-top');top.classList.add('cover');top.style.setProperty('--g',th.bg);
  const lg=top.querySelector('.logo img');if(lg)lg.src='../logo.webp'}
const CATS=th?TYPES.filter(t=>th.types.includes(t[1])):TYPES;
/* Bu temada paylaşılanlar: temadaki (sekme seçiliyse o kategorideki) deneyimlerin paylaşımları */
const themePosts=()=>th?listPosts().filter(x=>x.product&&th.ids.includes(x.product.id)&&(!tur||typeKey(x.product.type)===tur)):[];

/* Süre ve kiminle filtreleri örnek veride çalışıyor; diğerleri gerçek veriyle gelecek */
const SURE=BUCKETS; /* süre adları tek yerden (Keşfet ile aynı) */
const OTHER=['Yakınımda','Fiyat aralığı'];
const X='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const h=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const href=(t,s,k=kimle)=>'?'+[th&&'tema='+th.id,t&&'tur='+t,yer&&'yer='+yer,ara&&'ara='+encodeURIComponent(ara),tarih&&'tarih='+tarih,s&&'sure='+s,k&&'kimle='+k].filter(Boolean).join('&');
const go=()=>{history.replaceState(null,'',href(tur,sure)==='?'?location.pathname:href(tur,sure));draw()};

/* aramadan gelen seçimler (yer, metin, tarih) en başta; dokununca kalkar */
function filters(){
  const D=getDestination(yer),WH=WHEN.find(w=>w[0]===tarih);
  const off=(k,label)=>'<button type="button" class="fc off" aria-pressed="true" data-off="'+k+'" aria-label="'+h(label)+' seçimini kaldır">'+h(label)+X+'</button>';
  document.getElementById('filters').innerHTML=(D?off('yer',D.name):'')+(ara?off('ara','“'+ara+'”'):'')+(WH?off('tarih',WH[2]):'')
    +SURE.map(x=>'<button type="button" class="fc" aria-pressed="false" data-sure="'+x[0]+'">'+x[1]+'</button>').join('')
    +WITH.map(w=>'<button type="button" class="fc" aria-pressed="false" data-kimle="'+w[0]+'">'+w[1]+'</button>').join('')
    +OTHER.map(o=>'<button type="button" class="fc" aria-pressed="false" data-soon-f>'+o+'</button>').join('');
}
function draw(){
  const T=TYPES.find(t=>t[0]===tur),B=BUCKETS.find(b=>b[0]===sure),W=WITH.find(w=>w[0]===kimle),D=getDestination(yer),WH=WHEN.find(w=>w[0]===tarih);
  /* başlık en belirleyici seçim; geri kalanlar alt satırda */
  const lead=D?D.name:ara?'“'+ara+'”':'';
  const title=th?th.name:lead||(T?T[2]:B?B[2]:W?W[1]:'Tüm deneyimler');
  /* temada seçimler filtre satırında görünür; alt satır temanın girişi */
  const rest=th?th.intro:[lead&&th&&th.name,(lead||th)&&T&&T[2],(lead||th||T)&&B&&B[2],(lead||th||T||B)&&W&&W[1],WH&&WH[1]+' ('+WH[2]+')',(lead||WH)&&s.tur===tur&&s.who].filter(Boolean).join(' · ');
  document.getElementById('lsTitle').textContent=title;
  const sub=document.getElementById('lsSub');sub.textContent=rest;sub.hidden=!rest;
  document.getElementById('cats').innerHTML='<a href="'+href('',sure)+'"'+(tur?'':' aria-current="true"')+'>Tümü</a>'
    +CATS.map(t=>'<a href="'+href(t[0],sure)+'"'+(t[0]===tur?' aria-current="true"':'')+'>'+t[2]+'</a>').join('');
  document.querySelectorAll('[data-sure]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sure===sure));
  document.querySelectorAll('[data-kimle]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.kimle===kimle));
  const f={sure,kimle,tema:th&&th.id,yer,ara,tarih};
  const list=listProducts({type:tur,...f});
  /* tema vitrini temanın kendi sırasıyla */
  if(th)list.sort((a,b)=>th.ids.indexOf(a.id)-th.ids.indexOf(b.id));
  document.getElementById('lsCount').innerHTML=list.length+' deneyim';
  const el=document.getElementById('list');
  /* boşsa: aynı arama başka kategoride sonuç veriyorsa oraya yönlendir */
  const other=!list.length&&tur?listProducts(f).length:0;
  const ps=list.length?themePosts():[];
  const cards=list.map(x=>productCard(x));
  if(ps.length)cards.splice(Math.min(4,cards.length),0,'<section class="ls-posts" aria-labelledby="h-tp"><div class="hd"><h2 id="h-tp">Bu temada paylaşılanlar</h2><a class="all" href="../baglan/">Bağlan →</a></div>'
    +'<div class="rail">'+ps.map(postMini).join('')+'</div></section>');
  el.innerHTML=list.length?cards.join('')
    :'<div class="empty"><b>Bu seçimde deneyim yok</b><p>'+(other?'Aynı seçimle başka kategorilerde '+other+' deneyim var.':'Filtreleri kaldırmayı ya da başka bir kategoriye bakmayı dene.')+'</p>'
     +(other?'<a class="btn" href="'+href('',sure)+'">Tüm kategorilerde gör</a>':'<a class="btn" href="?'+[th&&'tema='+th.id,tur&&'tur='+tur].filter(Boolean).join('&')+'">Filtreleri kaldır</a>')+'</div>';
  favSync();
  document.title='mola360 — '+title;
}
document.getElementById('filters').addEventListener('click',e=>{
  const o=e.target.closest('[data-off]');
  if(o){({yer:()=>yer='',ara:()=>ara='',tarih:()=>tarih=''})[o.dataset.off]();filters();go();
    document.querySelector('#filters .fc').focus({preventScroll:true});return}
  const b=e.target.closest('[data-sure]');
  if(b){sure=b.dataset.sure===sure?'':b.dataset.sure;go();return}
  const k=e.target.closest('[data-kimle]');
  if(k){kimle=k.dataset.kimle===kimle?'':k.dataset.kimle;go();return}
  if(e.target.closest('[data-soon-f]'))toast('Bu filtre gerçek veriyle çalışacak.','Tamam',()=>{},3000);
});
document.querySelector('[data-soon-sort]').addEventListener('click',()=>toast('Çok yakında.','Tamam',()=>{},3000));
filters();
draw();
