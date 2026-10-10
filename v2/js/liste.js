/* Liste: kategori (ürün ne?), filtreler (keşif kriteri), arama (yer ya da
   metin) ve tema ayrı satırlarda ve ayrı adres parametrelerinde:
   ?tur=otel&yer=kapadokya&tarih=bu-hs&sure=hs&kimle=sevgili&tema=doga
   (docs/yeni-surum.md kural 3). Tema seçiliyse sayfa temanın vitrini olur:
   kapak, iki cümlelik giriş, temadaki kategoriler ve paylaşımlar. */
import { renderShell } from './shell.js';
import { listProducts, listPosts, getTheme, getDestination, getSearch, findCollection, collectionTitle, typeKey, TYPES, BUCKETS, WITH, WHEN } from './api.js';
import { ROOT } from './root.js';
import { productCard, postMini } from './cards.js';
import { toast, esc } from './ui.js';
import { initFavorites, favSync } from './favorites.js';

renderShell('kesfet');
initFavorites();

/* Kategori sayfası (v2/karadeniz-turlari/ gibi, scripts/kategoriler.mjs üretir):
   seçim sayfanın kendisinde (body data-q). Üst kısım (kapak, sayfa yolu,
   başlık, giriş) HTML'de sabit; kategori satırı ve kiminle süzgeci yok.
   Adreste yalnızca süre durur (karadeniz-turlari/?sure=uzun) */
const PG=document.body.dataset.q!=null,KAT=document.body.dataset.kat||'';
const q=new URLSearchParams(PG?document.body.dataset.q:location.search);
if(PG){const x=new URLSearchParams(location.search).get('sure');if(x)q.set('sure',x)}
let tur=TYPES.some(t=>t[0]===q.get('tur'))?q.get('tur'):'';
let sure=BUCKETS.some(b=>b[0]===q.get('sure'))?q.get('sure'):'';
let kimle=WITH.some(w=>w[0]===q.get('kimle'))?q.get('kimle'):'';
let yer=getDestination(q.get('yer'))?q.get('yer'):'';
let ara=(q.get('ara')||'').trim().slice(0,60);
let tarih=WHEN.some(w=>w[0]===q.get('tarih'))?q.get('tarih'):'';
const th=getTheme(q.get('tema'));
/* kategori sayfasında süre süzgeci yalnızca kategoride olan süreler; tek süre varsa hiç yok */
const SURE=(()=>{if(!PG)return BUCKETS;const l=listProducts({type:tur,tema:th&&th.id,yer}),b=BUCKETS.filter(x=>l.some(p=>p.b===x[0]));return b.length>1?b:[]})();
if(!SURE.some(b=>b[0]===sure))sure='';
const KIMLE=PG?[]:WITH;
/* Keşfet'teki aramada seçilen kişi sayısı (yalnızca bu sekmede) */
const s=getSearch();

/* Tema vitrini: kapakta temanın görseli, adı ve girişi; sekmelerde yalnızca
   temada olan kategoriler */
if(th){const top=document.querySelector('.pg-top');top.classList.add('cover');top.style.setProperty('--g',th.bg)}
const CATS=th?TYPES.filter(t=>th.types.includes(t[1])):TYPES;
/* Bu temada paylaşılanlar: temadaki (sekme seçiliyse o kategorideki) deneyimlerin paylaşımları */
const themePosts=()=>th?listPosts().filter(x=>x.product&&th.ids.includes(x.product.id)&&(!tur||typeKey(x.product.type)===tur)):[];

/* Süre ve kiminle filtreleri örnek veride çalışıyor; diğerleri gerçek veriyle gelecek.
   Süre adları tek yerden (BUCKETS, Keşfet ile aynı) */
const OTHER=['Yakınımda','Fiyat aralığı'];
const X='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

const href=(t,s,k=kimle)=>{if(PG)return s?'?sure='+s:location.pathname;const x=[th&&'tema='+th.id,t&&'tur='+t,yer&&'yer='+yer,ara&&'ara='+encodeURIComponent(ara),tarih&&'tarih='+tarih,s&&'sure='+s,k&&'kimle='+k].filter(Boolean).join('&');
  return PG?ROOT+'liste/'+(x?'?'+x:''):'?'+x};
const go=()=>{const h=href(tur,sure);history.replaceState(history.state,'',h==='?'?location.pathname:h);draw()};

/* aramadan gelen seçimler (yer, metin, tarih) en başta; dokununca kalkar */
function filters(){
  /* kategori sayfasında yer kategorinin kendisi: kaldırılacak seçim değil */
  const D=PG?null:getDestination(yer),WH=WHEN.find(w=>w[0]===tarih);
  const off=(k,label)=>'<button type="button" class="fc off" aria-pressed="true" data-off="'+k+'" aria-label="'+esc(label)+' seçimini kaldır">'+esc(label)+X+'</button>';
  document.getElementById('filters').innerHTML=(D?off('yer',D.name):'')+(ara?off('ara','“'+ara+'”'):'')+(WH?off('tarih',WH[2]):'')
    +SURE.map(x=>'<button type="button" class="fc" aria-pressed="false" data-sure="'+x[0]+'">'+x[1]+'</button>').join('')
    +KIMLE.map(w=>'<button type="button" class="fc" aria-pressed="false" data-kimle="'+w[0]+'">'+w[1]+'</button>').join('')
    +OTHER.map(o=>'<button type="button" class="fc" aria-pressed="false" data-soon-f>'+o+'</button>').join('');
}
function draw(){
  const T=TYPES.find(t=>t[0]===tur),B=BUCKETS.find(b=>b[0]===sure),W=WITH.find(w=>w[0]===kimle),D=getDestination(yer),WH=WHEN.find(w=>w[0]===tarih);
  /* başlık en belirleyici seçim; geri kalanlar alt satırda */
  const lead=D?D.name:ara?'“'+ara+'”':'';
  /* Keşfet'teki kategori kartından gelindiyse başlık kartın adı (Karadeniz turları) */
  const K=tur&&!ara?findCollection(tur,{yer,tema:th?th.id:''}):null;
  const title=K?K.name:th?th.name:lead||(T?T[2]:B?B[2]:W?W[1]:'Tüm deneyimler');
  /* temada seçimler filtre satırında görünür; alt satır temanın girişi */
  const rest=th?th.intro:[lead&&th&&th.name,(lead||th)&&!K&&T&&T[2],(lead||th||T)&&B&&B[2],(lead||th||T||B)&&W&&W[1],WH&&WH[1]+' ('+WH[2]+')',(lead||WH)&&s.tur===tur&&s.who].filter(Boolean).join(' · ');
  /* kategori sayfasında başlık, giriş ve kategori satırı HTML'de sabit */
  if(!PG){
    document.getElementById('lsTitle').textContent=title;
    const sub=document.getElementById('lsSub');sub.textContent=rest;sub.hidden=!rest;
    document.getElementById('cats').innerHTML='<a href="'+href('',sure)+'"'+(tur?'':' aria-current="true"')+'>Tümü</a>'
      +CATS.map(t=>'<a href="'+href(t[0],sure)+'"'+(t[0]===tur?' aria-current="true"':'')+'>'+t[2]+'</a>').join('');
  }
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
     +(other&&!PG?'<a class="btn" href="'+href('',sure)+'">Tüm kategorilerde gör</a>':'<a class="btn" href="'+(PG?location.pathname:'?'+[th&&'tema='+th.id,tur&&'tur='+tur].filter(Boolean).join('&'))+'">Filtreleri kaldır</a>')+'</div>';
  favSync();
  /* kategoriye denk gelen sayfa: başlıkta önce kategori, asıl adres kategori sayfası (arama motorları için) */
  document.title=K?collectionTitle(K):'mola360 — '+title;
  /* kategori sayfasının kendi bölümleri (sayfa yolu, açıklama, SSS): liste kategorinin tamamı değilse (başka seçim, süzgeç) gizlenir */
  const tam=!!K&&K.slug===KAT&&!sure&&!kimle&&!tarih;
  document.querySelectorAll('body [data-kat]').forEach(e=>{e.hidden=!tam});
  let cn=document.querySelector('link[rel=canonical]');
  if(K){if(!cn){cn=document.createElement('link');cn.rel='canonical';document.head.appendChild(cn)}cn.href=ROOT+K.slug+'/'}else if(cn)cn.remove();
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
/* kategori sekmesi sayfayı yeniden açmaz, adresi değiştirir: sekmeler
   arasında gezmek geçmişe yeni sayfa eklemez, geri Liste'den önceki sayfaya döner */
if(!PG)document.getElementById('cats').addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;
  e.preventDefault();tur=new URL(a.href).searchParams.get('tur')||'';go();
  const n=document.querySelector('#cats [aria-current]');if(n){n.focus({preventScroll:true});n.scrollIntoView({block:'nearest',inline:'nearest'})}});
document.querySelector('[data-soon-sort]').addEventListener('click',()=>toast('Çok yakında.','Tamam',()=>{},3000));
filters();
draw();
