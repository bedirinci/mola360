/* Planlarım: yaklaşan ve geçmiş rezervasyonlar ile favoriler tek yerde.
   Geçmiş deneyim, döngünün kapandığı yer: paylaş (paylas.js). */
import { renderShell } from './shell.js';
import { findByTitle, listBookings, cancelBooking, listPastBookings } from './api.js';
import { productCard } from './cards.js';
import { favList, initFavorites, favSync } from './favorites.js';
import { toast, tl } from './ui.js';
import { IC } from './icons.js';
import { ROOT } from './root.js';

renderShell('planlarim');
initFavorites();

/* ÖRNEK yaklaşan rezervasyon */
const UP=[{t:'Efes ve Şirince Turu',when:'Cumartesi 3 Ekim · 08:30',who:'2 yetişkin',paid:'Kapora ödendi',left:2064,no:'M360-48211'}];

const head=(p,when)=>'<a class="rz-hd" href="'+ROOT+'urun/?id='+p.id+'"><span class="pt" style="background:'+p.bg+'"></span><div class="x"><small>'+p.type.toLocaleUpperCase('tr')+'</small><b>'+p.title+'</b><span>'+when+'</span></div>'+IC.right+'</a>';
const up=r=>{const p=findByTitle(r.t);return '<article class="rz">'+head(p,r.when)
  +'<div class="rz-rows"><div><small>Kişi</small><b>'+r.who+'</b></div><div><small>Durum</small><b class="ok">'+r.paid+'</b></div><div><small>Kalan</small><b>'+tl(r.left)+'</b></div></div>'
  +'<div class="rz-acts"><button type="button" class="btn ghost" data-soon>Biletim</button><button type="button" class="btn ghost" data-soon>Buluşma noktası</button></div>'
  +'<p class="rz-no">Rezervasyon no '+r.no+'</p></article>'};
const past=b=>'<article class="rz">'+head(b.product,b.when+' · '+b.who)
  +(b.shared?'<p class="rz-done">'+IC.check+'Bu deneyimi paylaştın</p>'
   :'<div class="rz-share"><b>Nasıldı?</b><p>Paylaşımın "Mola360 ile gitti" rozetiyle Bağlan\'da görünür.</p><div class="rz-acts"><button type="button" class="btn green" data-paylas="'+b.productId+'">'+IC.plus+'Paylaş</button><button type="button" class="btn ghost" data-soon>Değerlendir</button></div></div>')
  +'</article>';

/* Bu cihazda yapılan taslak rezervasyonlar (rezervasyon akışından) */
const mine=b=>'<article class="rz">'+head(b.product,[b.date,b.slot].filter(Boolean).join(' · '))
  +'<div class="rz-rows"><div><small>Seçim</small><b>'+[b.opt,b.qty].filter(Boolean).join(' · ')+'</b></div>'
  +'<div><small>Durum</small><b class="ok">'+(b.pay==='kapora'?'Kapora':'Tamamı')+'</b></div><div><small>'+(b.total>b.paid?'Kalan':'Toplam')+'</small><b>'+tl(b.total>b.paid?b.total-b.paid:b.total)+'</b></div></div>'
  +'<div class="rz-acts"><button type="button" class="btn ghost" data-soon>Biletim</button><button type="button" class="btn ghost" data-cancel="'+b.no+'">İptal et</button></div>'
  +'<p class="rz-no">Rezervasyon no '+b.no+' · ödeme alınmadı</p></article>';

const favs=()=>{const items=favList().map(findByTitle).filter(Boolean).reverse();
  return items.length?'<p class="feed-note" data-fav-n aria-live="polite">'+items.length+' deneyim</p><div class="stack">'+items.map(x=>productCard(x)).join('')+'</div>'
  :'<div class="empty"><span class="ei">'+IC.heart+'</span><b>Henüz favorin yok</b><p>Beğendiğin turu, oteli ya da etkinliği kalbe dokunarak sakla.</p><a class="btn" href="'+ROOT+'">Keşfetmeye başla</a></div>'};

const TABS={
  yaklasan:()=>'<div class="rz-list">'+listBookings().map(mine).concat(UP.map(up)).join('')+'</div>',
  gecmis:()=>'<div class="rz-list">'+listPastBookings().map(past).join('')+'</div>',
  favoriler:favs};

const el=document.getElementById('plan');
let cur='yaklasan';
function show(k){cur=k;
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tab===k));
  el.innerHTML=TABS[k]();if(k==='favoriler')favSync();
  history.replaceState(history.state,'','#'+k);
}
document.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)show(b.dataset.tab)});
el.addEventListener('click',e=>{const c=e.target.closest('[data-cancel]');
  if(c){cancelBooking(c.dataset.cancel);show('yaklasan');toast('Rezervasyon iptal edildi.','Tamam',()=>{},3000);return}
  if(e.target.closest('[data-soon]'))toast('Çok yakında.','Tamam',()=>{},3000)});
/* Paylaşınca geçmişteki kart "paylaştın"a döner */
document.addEventListener('m360:paylasildi',()=>{if(cur==='gecmis')show('gecmis')});
const h=location.hash.slice(1);
show(TABS[h]?h:'yaklasan');
/* aynı sayfadayken menüden gelen #favoriler ya da #yaklasan sekmeyi değiştirir */
addEventListener('hashchange',()=>{const k=location.hash.slice(1);if(TABS[k]&&k!==cur)show(k)});
