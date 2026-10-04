/* Profil: sosyal kimlik + deneyim geçmişi + Molapuan (PROJE.md §10) */
import { renderShell } from './shell.js';
import { listPosts, findByTitle, ME } from './api.js';
import { postMini, plink, ava, initPostActions } from './cards.js';
import { toast } from './ui.js';
import { IC } from './icons.js';
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
  '<div class="pf-id">'+ava(ME,'l')+'<div class="x"><b>'+ME.ad+'</b><span>@'+ME.kul+'</span>'
 +'<div class="pf-tags"><span class="pf-lv">'+IC.check+'Kâşif</span><span class="pf-loc">'+PIN+'İzmir</span></div></div></div>'
 +'<p class="pf-bio">Hafta sonu kaçamakları, caz akşamları, bol yürüyüş.</p>'
 +'<div class="pf-stats">'+STAT(mine.length,'paylaşım','pay')+STAT(went.length,'deneyim','den')+STAT(128,'takipçi')+STAT(96,'takip')+'</div>'
 +'<div class="pf-acts"><button type="button" class="btn green" data-paylas>'+IC.plus+'<span class="lg">Deneyimini paylaş</span><span class="sm">Paylaş</span></button>'
 +'<button type="button" class="btn ghost-d" data-soon>Düzenle</button>'
 +'<button type="button" class="btn ghost-d sq" data-share aria-label="Profili paylaş">'+IC.share+'</button></div>';

const el=document.getElementById('pf');
const TABS={
  pay:()=>'<div class="pf-grid">'+mine.map(x=>postMini(x,{own:true})).join('')+'</div>',
  den:()=>'<div class="pf-went">'+went.map(plink).join('')+'</div>',
  kay:()=>'<div class="empty"><span class="ei">'+IC.save+'</span><b>Kaydettiğin paylaşımlar</b><p>Bağlan\'da beğendiğin paylaşımları kaydet; ürün favorilerin Planlarım\'da.</p><a class="btn" href="'+ROOT+'planlarim/#favoriler">Favorilere git</a></div>'};
el.innerHTML=molapuan('kasif')
 +'<div class="seg light" role="group" aria-label="Profil" id="pfTabs"><button type="button" aria-pressed="true" data-t="pay">'+IC.grid+'Paylaşımlar</button><button type="button" aria-pressed="false" data-t="den">'+IC.bag+'Deneyimler</button><button type="button" aria-pressed="false" data-t="kay">'+IC.save+'Kaydedilenler</button></div>'
 +'<div id="pfBody"></div>';
const body=document.getElementById('pfBody');
function show(k){document.querySelectorAll('#pfTabs [data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===k));body.innerHTML=TABS[k]()}
document.getElementById('pfTabs').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)show(b.dataset.t)});
document.addEventListener('click',e=>{if(e.target.closest('[data-soon]'))toast('Çok yakında.','Tamam',()=>{},3000)});
show('pay');
/* sayılara dokununca ilgili sekme */
document.getElementById('pfHead').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;show(b.dataset.go);document.getElementById('pfTabs').scrollIntoView({behavior:'smooth',block:'start'})});

initMolapuan();
