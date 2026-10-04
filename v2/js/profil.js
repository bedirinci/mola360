/* Profil: sosyal kimlik + deneyim geçmişi + Molapuan (PROJE.md §10) */
import { renderShell } from './shell.js';
import { listPosts, findByTitle, ME } from './api.js';
import { postMini, plink, ava, initPostActions } from './cards.js';
import { toast } from './ui.js';
import { IC, STAR, chevR } from './icons.js';
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
/* Molapuan kartı: koyu üst bölümde puan ve seviye; altta sıradaki hedef ve seviye yolu.
   Seviye son 24 aydaki rezervasyon sayısıyla (ÖNERİ): Gezgin 1, Kâşif 3, Mola Ustası 6. */
const LVS=[['Gezgin',1,'Puan kazanır','Gezgin\'e'],['Kâşif',3,'%10 indirim','Kâşif\'e'],['Mola Ustası',6,'%15 indirim','Mola Ustası\'na']];
const PTS=1240,n=went.length,cur=LVS.filter(l=>n>=l[1]).pop(),nxt=LVS.find(l=>n<l[1]),top=LVS[LVS.length-1][1];
const LOCK='<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const INFO='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>';
/* duraklar sütun ortalarında (1/6, 3/6, 5/6); dolgu iki durak arasında orantılı ilerler */
const fillPct=(()=>{const i=LVS.findIndex(l=>n<l[1]);if(i<0)return 100;
  const a=i?LVS[i-1][1]:0,b=LVS[i][1],x0=i?(2*i-1)/6*100:0,x1=(2*i+1)/6*100;return x0+(x1-x0)*(n-a)/(b-a)})();
const stop=l=>{const st=l===cur?'cur':n>=l[1]?'on':'off';
  return '<li class="'+st+'">'+(st==='cur'?'<span class="mp-you">Buradasın</span>':'<span class="mp-cnt">'+l[1]+' rez.</span>')
   +'<span class="mp-n" aria-hidden="true">'+(st==='off'?LOCK:st==='cur'?STAR:IC.check)+'</span><strong>'+l[0]+'</strong><small>'+l[2]+'</small></li>'};
el.innerHTML='<section class="mp" aria-labelledby="mpT">'
 +'<div class="mp-hero"><div class="mp-row"><h2 class="mp-brand" id="mpT"><span aria-hidden="true">'+STAR+'</span>Molapuan</h2>'
 +'<button type="button" class="mp-how" id="mpHow">'+INFO+'Nasıl kazanırım?</button></div>'
 +'<p class="mp-sum"><b>'+PTS.toLocaleString('tr-TR')+'</b><span>puan</span></p>'
 +'<p class="mp-val">Sonraki rezervasyonunda '+PTS.toLocaleString('tr-TR')+' TL indirim olarak kullanabilirsin</p>'
 +(cur?'<span class="mp-lv">'+STAR+cur[0]+' · '+cur[2]+'</span>':'')+'</div>'
 +'<div class="mp-body">'
 +(nxt?'<a class="mp-next" href="'+ROOT+'"><span class="mp-t"><b>'+nxt[3]+' '+(nxt[1]-n)+' rezervasyon kaldı</b><span>'+nxt[2]+' seni bekliyor</span></span><span class="mp-go" aria-hidden="true">'+chevR+'</span></a>'
     :'<p class="mp-next"><span class="mp-t"><b>En üst seviyedesin</b><span>Mola Ustası indirimlerin açık</span></span></p>')
 +'<button type="button" class="mp-tg" aria-expanded="true" aria-controls="mpPath"><span><b>Seviye yolun</b><small>Son 24 ayda '+n+' rezervasyon</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button>'
 +'<div class="mp-path" id="mpPath"><div class="mp-bar" role="progressbar" aria-label="Seviye ilerlemesi" aria-valuemin="0" aria-valuemax="'+top+'" aria-valuenow="'+n+'" aria-valuetext="'+top+' rezervasyondan '+n+'"><i style="width:'+fillPct.toFixed(1)+'%"></i></div>'
 +'<ol class="mp-lvls">'+LVS.map(stop).join('')+'</ol></div></div>'
 +'</section>'
 +'<div class="seg light" role="group" aria-label="Profil" id="pfTabs"><button type="button" aria-pressed="true" data-t="pay">'+IC.grid+'Paylaşımlar</button><button type="button" aria-pressed="false" data-t="den">'+IC.bag+'Deneyimler</button><button type="button" aria-pressed="false" data-t="kay">'+IC.save+'Kaydedilenler</button></div>'
 +'<div id="pfBody"></div>';
const body=document.getElementById('pfBody');
function show(k){document.querySelectorAll('#pfTabs [data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===k));body.innerHTML=TABS[k]()}
document.getElementById('pfTabs').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)show(b.dataset.t)});
document.addEventListener('click',e=>{if(e.target.closest('[data-soon]'))toast('Profil düzenleme yeni mola360\'ta hazırlanıyor.','Tamam',()=>{},3000)});
show('pay');

const mpTg=el.querySelector('.mp-tg');
mpTg.addEventListener('click',()=>{const o=mpTg.getAttribute('aria-expanded')!=='true';mpTg.setAttribute('aria-expanded',o);document.getElementById('mpPath').hidden=!o});
document.getElementById('mpHow').addEventListener('click',()=>toast('Her 100 TL\'lik rezervasyonda 1 Molapuan kazanırsın. 1 puan = 1 TL olarak sonraki rezervasyonunda kullanılır.','Tamam',()=>{},6000));
