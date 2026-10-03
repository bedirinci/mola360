/* Liste: kategori (ürün ne?) ve filtre (keşif kriteri) ayrı satırlarda ve ayrı
   adres parametrelerinde: ?tur=otel&sure=hs (docs/yeni-surum.md kural 3). */
import { renderShell } from './shell.js';
import { listProducts, TYPES } from './api.js';
import { BUCKETS } from './data.js';
import { productCard } from './cards.js';
import { toast, fitFacts } from './ui.js';
import { initFavorites, favSync } from './favorites.js';
import { initLevelInfo } from './level.js';

renderShell('kesfet');
initLevelInfo();
initFavorites();

const q=new URLSearchParams(location.search);
let tur=TYPES.some(t=>t[0]===q.get('tur'))?q.get('tur'):'';
let sure=BUCKETS.some(b=>b[0]===q.get('sure'))?q.get('sure'):'';

/* Süre filtreleri örnek veride çalışıyor; diğerleri gerçek veriyle gelecek */
const SURE=[['saat','Birkaç saat'],['gun','Günübirlik'],['hs','Hafta sonu'],['uzun','4 gün +']];
const OTHER=['Yakınımda','Çiftler','Arkadaşlarla','Ailece','Fiyat aralığı'];

const href=(t,s)=>'?'+[t&&'tur='+t,s&&'sure='+s].filter(Boolean).join('&');

document.getElementById('filters').innerHTML=SURE.map(s=>'<button type="button" class="fc" aria-pressed="false" data-sure="'+s[0]+'">'+s[1]+'</button>').join('')
  +OTHER.map(o=>'<button type="button" class="fc" aria-pressed="false" data-soon-f>'+o+'</button>').join('');
function draw(){
  const T=TYPES.find(t=>t[0]===tur),B=BUCKETS.find(b=>b[0]===sure);
  document.getElementById('lsTitle').textContent=T?T[2]:(B?B[3]:'Tüm deneyimler');
  document.getElementById('lsSub').textContent=T?(B?B[3]:'Süreye göre daraltmak için aşağıdaki filtreleri kullan'):'Tur, otel, etkinlik, aktivite ve mekân birlikte';
  document.getElementById('cats').innerHTML='<a href="'+href('',sure)+'"'+(tur?'':' aria-current="true"')+'>Tümü</a>'
    +TYPES.map(t=>'<a href="'+href(t[0],sure)+'"'+(t[0]===tur?' aria-current="true"':'')+'>'+t[2]+'</a>').join('');
  document.querySelectorAll('[data-sure]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sure===sure));
  const list=listProducts({type:tur,sure});
  document.getElementById('lsCount').innerHTML=list.length+' deneyim <span class="ornek">ÖRNEK</span>';
  const el=document.getElementById('list');
  el.innerHTML=list.length?list.map(x=>productCard(x)).join('')
    :'<div class="empty"><b>Bu seçimde deneyim yok</b><p>Süre filtresini kaldırmayı ya da başka bir kategoriye bakmayı dene.</p><a class="btn" href="'+href(tur,'')+'">Filtreyi kaldır</a></div>';
  fitFacts(el);favSync();
  document.title='mola360 — '+document.getElementById('lsTitle').textContent;
}
document.getElementById('filters').addEventListener('click',e=>{
  const b=e.target.closest('[data-sure]');
  if(b){sure=b.dataset.sure===sure?'':b.dataset.sure;history.replaceState(null,'',href(tur,sure)||location.pathname);draw();return}
  if(e.target.closest('[data-soon-f]'))toast('Bu filtre gerçek veriyle çalışacak.','Tamam',()=>{},3000);
});
document.querySelector('[data-soon-sort]').addEventListener('click',()=>toast('Sıralama seçenekleri yeni mola360\'ta hazırlanıyor.','Tamam',()=>{},3000));
draw();
window.addEventListener('resize',()=>fitFacts(document.getElementById('list')));
