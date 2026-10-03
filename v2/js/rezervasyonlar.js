/* Rezervasyonlar: yaklaşan ve geçmiş. Geçmiş deneyim, döngünün kapandığı yer: paylaş. */
import { renderShell } from './shell.js';
import { findByTitle } from './api.js';
import { toast, tl } from './ui.js';
import { IC, I } from './icons.js';
import { ROOT } from './root.js';

renderShell('rezervasyonlar');

/* ÖRNEK rezervasyonlar */
const UP=[{t:'Efes ve Şirince Turu',when:'Cumartesi 3 Ekim · 08:30',who:'2 yetişkin',paid:'Kapora ödendi',left:2064,no:'M360-48211'}];
const PAST=[{t:'Kapadokya Turu',when:'12 – 15 Eylül',who:'2 yetişkin',shared:false},{t:'Kordon Caz Akşamları',when:'5 Eylül',who:'2 bilet',shared:true}];

const head=(p,when)=>'<a class="rz-hd" href="'+ROOT+'urun/?id='+p.id+'"><span class="pt" style="background:'+p.bg+'"></span><div class="x"><small>'+p.type.toLocaleUpperCase('tr')+'</small><b>'+p.title+'</b><span>'+when+'</span></div>'+IC.right+'</a>';
const up=r=>{const p=findByTitle(r.t);return '<article class="rz">'+head(p,r.when)
  +'<div class="rz-rows"><div><small>Kişi</small><b>'+r.who+'</b></div><div><small>Durum</small><b class="ok">'+r.paid+'</b></div><div><small>Kalan</small><b>'+tl(r.left)+'</b></div></div>'
  +'<div class="rz-acts"><button type="button" class="btn ghost" data-soon>Biletim</button><button type="button" class="btn ghost" data-soon>Buluşma noktası</button></div>'
  +'<p class="rz-no">Rezervasyon no '+r.no+'</p></article>'};
const past=r=>{const p=findByTitle(r.t);return '<article class="rz">'+head(p,r.when+' · '+r.who)
  +(r.shared?'<p class="rz-done">'+IC.check+'Bu deneyimi paylaştın</p>'
   :'<div class="rz-share"><b>Nasıldı?</b><p>Bir fotoğraf ve birkaç cümleyle paylaş; deneyim sayfasında ve Bağlan\'da "Mola360 ile gitti" rozetiyle görünsün.</p><div class="rz-acts"><button type="button" class="btn green" data-soon>'+IC.plus+'Deneyimini paylaş</button><button type="button" class="btn ghost" data-soon>Değerlendir</button></div></div>')
  +'</article>'};

const el=document.getElementById('rez');
function show(k){
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tab===k));
  el.innerHTML='<p class="feed-note">Rezervasyonlar <span class="ornek">ÖRNEK</span></p><div class="rz-list">'+(k==='yakin'?UP.map(up):PAST.map(past)).join('')+'</div>';
}
document.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)show(b.dataset.tab)});
el.addEventListener('click',e=>{if(e.target.closest('[data-soon]'))toast('Bu adım yeni mola360\'ta hazırlanıyor.','Tamam',()=>{},3000)});
show(location.hash==='#gecmis'?'gecmis':'yakin');
