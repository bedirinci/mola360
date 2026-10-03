/* Profil: sosyal kimlik + deneyim geçmişi + Molapuan (PROJE.md §10) */
import { renderShell } from './shell.js';
import { listPosts, findByTitle, ME } from './api.js';
import { postMini, plink, ava, initPostActions } from './cards.js';
import { toast } from './ui.js';
import { IC } from './icons.js';
import { ROOT } from './root.js';

renderShell('profil');
initPostActions(toast);

/* ÖRNEK profil (api.js ME) */
const mine=listPosts().slice(0,4).map(p=>({...p,user:ME}));
const went=['Kapadokya Turu','Kordon Caz Akşamları','Köprülü Kanyon Rafting'].map(findByTitle);

document.getElementById('pfHead').innerHTML=
  '<div class="pf-id">'+ava(ME,'l')+'<div class="x"><b>'+ME.ad+'</b><span>@'+ME.kul+'</span><span class="lvl">'+IC.check+'Kâşif</span></div></div>'
 +'<p class="pf-bio">Hafta sonu kaçamakları, caz akşamları, bol yürüyüş. İzmir. <span class="ornek">ÖRNEK</span></p>'
 +'<div class="pf-stats"><div><b>'+mine.length+'</b><span>paylaşım</span></div><div><b>'+went.length+'</b><span>deneyim</span></div><div><b>128</b><span>takipçi</span></div><div><b>96</b><span>takip</span></div></div>'
 +'<div class="pf-acts"><button type="button" class="btn green" data-soon>Profili düzenle</button><button type="button" class="btn ghost-d" data-share>'+IC.share+'Paylaş</button></div>';

const el=document.getElementById('pf');
const TABS={
  pay:()=>'<div class="pf-grid">'+mine.map(postMini).join('')+'</div>',
  den:()=>'<div class="pf-went">'+went.map(plink).join('')+'</div>',
  kay:()=>'<div class="empty"><span class="ei">'+IC.save+'</span><b>Kaydettiğin paylaşımlar</b><p>Bağlan\'da beğendiğin paylaşımları kaydet; ürün favorilerin Planlarım\'da.</p><a class="btn" href="'+ROOT+'planlarim/#favoriler">Favorilere git</a></div>'};
el.innerHTML='<section class="pf-pts"><div class="x"><small>MOLAPUAN <span class="ornek">ÖRNEK</span></small><b>1.240 puan</b><span>Mola Ustası\'na 1 deneyim kaldı</span></div><div class="bar-p" role="progressbar" aria-valuenow="2" aria-valuemin="0" aria-valuemax="3" aria-label="Seviye ilerlemesi"><i style="width:66%"></i></div></section>'
 +'<div class="seg light" role="group" aria-label="Profil" id="pfTabs"><button type="button" aria-pressed="true" data-t="pay">'+IC.grid+'Paylaşımlar</button><button type="button" aria-pressed="false" data-t="den">'+IC.bag+'Deneyimler</button><button type="button" aria-pressed="false" data-t="kay">'+IC.save+'Kaydedilenler</button></div>'
 +'<div id="pfBody"></div>';
const body=document.getElementById('pfBody');
function show(k){document.querySelectorAll('#pfTabs [data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===k));body.innerHTML=TABS[k]()}
document.getElementById('pfTabs').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)show(b.dataset.t)});
document.addEventListener('click',e=>{if(e.target.closest('[data-soon]'))toast('Profil düzenleme yeni mola360\'ta hazırlanıyor.','Tamam',()=>{},3000)});
show('pay');
