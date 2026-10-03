/* Liste: kategori (ürün ne?), filtreler (keşif kriteri) ve tema ayrı
   satırlarda ve ayrı adres parametrelerinde: ?tur=otel&sure=hs&kimle=cift
   &tema=doga (docs/yeni-surum.md kural 3). */
import { renderShell } from './shell.js';
import { listProducts, getTheme, TYPES, BUCKETS, WITH } from './api.js';
import { productCard } from './cards.js';
import { toast } from './ui.js';
import { initFavorites, favSync } from './favorites.js';

renderShell('kesfet');
initFavorites();

const q=new URLSearchParams(location.search);
let tur=TYPES.some(t=>t[0]===q.get('tur'))?q.get('tur'):'';
let sure=BUCKETS.some(b=>b[0]===q.get('sure'))?q.get('sure'):'';
let kimle=WITH.some(w=>w[0]===q.get('kimle'))?q.get('kimle'):'';
const th=getTheme(q.get('tema'));

/* Süre ve kiminle filtreleri örnek veride çalışıyor; diğerleri gerçek veriyle gelecek */
const SURE=[['saat','Birkaç saat'],['gun','Günübirlik'],['hs','Hafta sonu'],['uzun','4 gün +']];
const OTHER=['Yakınımda','Fiyat aralığı'];

const href=(t,s,k=kimle)=>'?'+[th&&'tema='+th.id,t&&'tur='+t,s&&'sure='+s,k&&'kimle='+k].filter(Boolean).join('&');

document.getElementById('filters').innerHTML=SURE.map(s=>'<button type="button" class="fc" aria-pressed="false" data-sure="'+s[0]+'">'+s[1]+'</button>').join('')
  +WITH.map(w=>'<button type="button" class="fc" aria-pressed="false" data-kimle="'+w[0]+'">'+w[1]+'</button>').join('')
  +OTHER.map(o=>'<button type="button" class="fc" aria-pressed="false" data-soon-f>'+o+'</button>').join('');
function draw(){
  const T=TYPES.find(t=>t[0]===tur),B=BUCKETS.find(b=>b[0]===sure),W=WITH.find(w=>w[0]===kimle);
  /* başlık en belirleyici seçim; geri kalanlar alt satırda */
  const title=th?th.name:T?T[2]:B?B[3]:W?W[1]:'Tüm deneyimler';
  const rest=[th&&T&&T[2],(th||T)&&B&&B[3],(th||T||B)&&W&&W[1]].filter(Boolean).join(' · ');
  document.getElementById('lsTitle').textContent=title;
  document.getElementById('lsSub').textContent=rest||(th?th.types.join(', ')+' birlikte':T?'Süreye ya da kiminle gideceğine göre daraltabilirsin':'Tur, otel, etkinlik, aktivite ve mekân birlikte');
  document.getElementById('cats').innerHTML='<a href="'+href('',sure)+'"'+(tur?'':' aria-current="true"')+'>Tümü</a>'
    +TYPES.map(t=>'<a href="'+href(t[0],sure)+'"'+(t[0]===tur?' aria-current="true"':'')+'>'+t[2]+'</a>').join('');
  document.querySelectorAll('[data-sure]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sure===sure));
  document.querySelectorAll('[data-kimle]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.kimle===kimle));
  const list=listProducts({type:tur,sure,kimle,tema:th&&th.id});
  document.getElementById('lsCount').innerHTML=list.length+' deneyim <span class="ornek">ÖRNEK</span>';
  const el=document.getElementById('list');
  el.innerHTML=list.length?list.map(x=>productCard(x)).join('')
    :'<div class="empty"><b>Bu seçimde deneyim yok</b><p>Filtreleri kaldırmayı ya da başka bir kategoriye bakmayı dene.</p><a class="btn" href="'+(href(tur,'','')||'?')+'">Filtreleri kaldır</a></div>';
  favSync();
  document.title='mola360 — '+document.getElementById('lsTitle').textContent;
}
document.getElementById('filters').addEventListener('click',e=>{
  const b=e.target.closest('[data-sure]');
  if(b){sure=b.dataset.sure===sure?'':b.dataset.sure;history.replaceState(null,'',href(tur,sure)||location.pathname);draw();return}
  const k=e.target.closest('[data-kimle]');
  if(k){kimle=k.dataset.kimle===kimle?'':k.dataset.kimle;history.replaceState(null,'',href(tur,sure)||location.pathname);draw();return}
  if(e.target.closest('[data-soon-f]'))toast('Bu filtre gerçek veriyle çalışacak.','Tamam',()=>{},3000);
});
document.querySelector('[data-soon-sort]').addEventListener('click',()=>toast('Sıralama seçenekleri yeni mola360\'ta hazırlanıyor.','Tamam',()=>{},3000));
draw();
