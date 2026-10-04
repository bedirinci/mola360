/* Profil: sosyal kimlik + deneyim geçmişi + Molapuan (PROJE.md §10) */
import { renderShell } from './shell.js';
import { listPosts, findByTitle, ME } from './api.js';
import { postMini, plink, ava, initPostActions } from './cards.js';
import { toast } from './ui.js';
import { IC, VERIFIED } from './icons.js';
import { molapuan, initMolapuan } from './molapuan.js';
import { ROOT } from './root.js';

renderShell('profil');
initPostActions(toast);

/* ÖRNEK profil (api.js ME) */
const mine=listPosts().slice(0,4).map(p=>({...p,user:ME}));
const went=['Kapadokya Turu','Kordon Caz Akşamları','Köprülü Kanyon Rafting'].map(findByTitle);

const PIN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>';
const STAT=(n,t,tab)=>tab?'<button type="button" data-go="'+tab+'"><b>'+n+'</b><span>'+t+'</span></button>':'<div><b>'+n+'</b><span>'+t+'</span></div>';
document.getElementById('pfHead').innerHTML=
  '<div class="pf-id">'+ava(ME,'l')+'<div class="x"><div class="pf-nm"><b>'+ME.ad+'</b>'+VERIFIED+'</div>'
 +'<span class="pf-at">@'+ME.kul+'<i>·</i>'+PIN+'İzmir</span></div></div>'
 +'<p class="pf-bio">Hafta sonu kaçamakları, caz akşamları, bol yürüyüş.</p>'
 +'<div class="pf-stats">'+STAT(mine.length,'paylaşım','pay')+STAT(went.length,'deneyim','den')+STAT(128,'takipçi')+STAT(96,'takip')+'</div>'
 +'<div class="pf-acts"><button type="button" class="btn green" data-paylas>'+IC.plus+'<span class="lg">Deneyimini paylaş</span><span class="sm">Paylaş</span></button>'
 +'<button type="button" class="btn ghost-d" data-soon>Düzenle</button>'
 +'<button type="button" class="btn ghost-d sq" data-share aria-label="Profili paylaş">'+IC.share+'</button></div>';

/* Hesap ve ayarlar: beyaz, ince satırlar (Molapuan kartı dili). Henüz yapılmayanlar "Çok yakında." */
const I=d=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
const ACC=[
 ['Hesabım',[
  ['Kişisel bilgiler','Ad, telefon, e-posta',I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')],
  ['Ödeme yöntemleri','Kayıtlı kartın: •••• 4821',I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>')],
  ['Kuponlarım','1 kupon kullanılabilir',I('<path d="M4 9V6h16v3a3 3 0 0 0 0 6v3H4v-3a3 3 0 0 0 0-6zM10 6v12"/>')],
  ['Bildirimler','Rezervasyon, kampanya, Bağlan',I('<path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>')]]],
 ['Destek ve gizlilik',[
  ['Gizlilik ve güvenlik','Şifre, profil görünürlüğü',I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>')],
  ['Yardım merkezi','Sık sorulanlar, bize yaz',I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>')]]]];
const OUT=I('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>');
const acc=()=>'<section class="acc" aria-labelledby="h-acc"><div class="hd"><h2 id="h-acc">Hesap ve ayarlar</h2></div>'
 +ACC.map(([t,rows])=>'<h3 class="acc-h">'+t+'</h3><div class="acc-c">'
   +rows.map(([a,b,ic])=>'<button type="button" class="acc-r" data-soon><i>'+ic+'</i><span><b>'+a+'</b><small>'+b+'</small></span>'+IC.right+'</button>').join('')+'</div>').join('')
 +'<a class="acc-c acc-r acc-out" href="'+ROOT+'?gorunum=misafir"><i>'+OUT+'</i><span><b>Çıkış yap</b></span></a>'+'</section>';

const el=document.getElementById('pf');
const TABS={
  pay:()=>'<div class="pf-grid">'+mine.map(x=>postMini(x,{own:true})).join('')+'</div>',
  den:()=>'<div class="pf-went">'+went.map(plink).join('')+'</div>',
  kay:()=>'<div class="empty"><span class="ei">'+IC.save+'</span><b>Kaydettiğin paylaşımlar</b><p>Bağlan\'da beğendiğin paylaşımları kaydet; ürün favorilerin Planlarım\'da.</p><a class="btn" href="'+ROOT+'planlarim/#favoriler">Favorilere git</a></div>'};
el.innerHTML=molapuan('kasif')
 +'<div class="seg light" role="group" aria-label="Profil" id="pfTabs"><button type="button" aria-pressed="true" data-t="pay">'+IC.grid+'Paylaşımlar</button><button type="button" aria-pressed="false" data-t="den">'+IC.bag+'Deneyimler</button><button type="button" aria-pressed="false" data-t="kay">'+IC.save+'Kaydedilenler</button></div>'
 +'<div id="pfBody"></div>'
 +acc();
const body=document.getElementById('pfBody');
function show(k){document.querySelectorAll('#pfTabs [data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===k));body.innerHTML=TABS[k]()}
document.getElementById('pfTabs').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)show(b.dataset.t)});
document.addEventListener('click',e=>{if(e.target.closest('[data-soon]'))toast('Çok yakında.','Tamam',()=>{},3000)});
show('pay');
/* sayılara dokununca ilgili sekme */
document.getElementById('pfHead').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;show(b.dataset.go);document.getElementById('pfTabs').scrollIntoView({behavior:'smooth',block:'start'})});

initMolapuan();
