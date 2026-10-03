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
/* Molapuan kartı: puan, sıradaki seviye ve seviye yolu.
   Seviye son 24 aydaki rezervasyon sayısıyla (ÖNERİ): Gezgin 1, Kâşif 3, Mola Ustası 6. */
const LVS=[['Gezgin',1,'Puan kazanır'],['Kâşif',3,'%10 indirim'],['Mola Ustası',6,'%15 indirim']];
const PTS=1240,n=went.length,cur=LVS.filter(l=>n>=l[1]).pop(),nxt=LVS.find(l=>n<l[1]);
/* düğümler sütun ortalarında (1/6, 3/6, 5/6); dolgu iki düğüm arasında orantılı ilerler */
const fillPct=(()=>{const i=LVS.findIndex(l=>n<l[1]);if(i<0)return 100;
  const a=i?LVS[i-1][1]:0,b=LVS[i][1],x0=i?(2*i-1)/6*100:0,x1=(2*i+1)/6*100;return x0+(x1-x0)*(n-a)/(b-a)})();
el.innerHTML='<section class="mp" aria-labelledby="mpT">'
 +'<div class="mp-top"><span class="mp-ic" aria-hidden="true">'+STAR+'</span><div class="mp-x"><h2 id="mpT">Molapuanın: <b>'+PTS.toLocaleString('tr-TR')+'</b></h2>'+'<div class="mp-r">'+(cur?'<span class="mp-lv">'+cur[0].toLocaleUpperCase('tr-TR')+'</span>':'')
 +'<button type="button" class="mp-how" id="mpHow">Nasıl kazanırım?</button></div></div></div>'
 +(nxt?'<a class="mp-next" href="'+ROOT+'"><p>'+(nxt[1]-n)+' rezervasyon daha yap, <em>'+nxt[0]+'</em> ol, '+nxt[2]+' kazan!</p><span class="mp-go" aria-hidden="true">'+chevR+'</span></a>'
     :'<p class="mp-next"><span class="mp-t">En üst seviyedesin: <em>Mola Ustası</em> indirimlerin açık.</span></p>')
 +'<button type="button" class="mp-tg" aria-expanded="true" aria-controls="mpPath"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg><span>Seviye yolun<small>Son 24 aydaki rezervasyonların sayılır</small></span></button>'
 +'<div class="mp-path" id="mpPath"><div class="mp-bar" role="progressbar" aria-label="Seviye ilerlemesi" aria-valuemin="0" aria-valuemax="'+LVS[2][1]+'" aria-valuenow="'+n+'" aria-valuetext="'+n+' rezervasyon"><i style="width:'+fillPct.toFixed(1)+'%"></i></div>'
 +'<ol class="mp-lvls">'+LVS.map(l=>'<li'+(n>=l[1]?' class="on"':'')+'><b>'+l[1]+'</b><span class="mp-n" aria-hidden="true">'+(n>=l[1]?IC.check:STAR)+'</span><strong>'+l[0]+'</strong><small>'+l[2]+'</small></li>').join('')+'</ol></div>'
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
