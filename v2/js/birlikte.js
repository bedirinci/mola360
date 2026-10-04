/* Birlikte gidelim: Bağlan'daki bir deneyimi arkadaşlarına "Bunu yapalım mı?"
   notuyla gönderir. Takip ettiğin kişiler seçilir; ya da telefonun paylaşımıyla
   başka uygulamadan gönderilir. */
import { makeSheet, toast } from './ui.js';
import { getProduct, productUrl } from './api.js';
import { USERS } from './data.js';
import { IC } from './icons.js';
import { ROOT } from './root.js';

const FRIENDS=['selin','mert','elif','deniz','kaan','zeynep'];
const $=id=>document.getElementById(id);
let sheet=null,prod=null;
const ava=u=>'<span class="ava" style="--c:'+u.renk+'" aria-hidden="true">'+u.ini+'</span>';

function build(){
  document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="tgBg"></div>'
   +'<div class="sheet tg" id="tgSheet" role="dialog" aria-modal="true" aria-labelledby="tgTtl">'
   +'<div class="sh-grab"></div><div class="sh-hd"><h3 id="tgTtl">Birlikte gidelim</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div>'
   +'<div class="tg-p" id="tgP"></div>'
   +'<p class="tg-h" id="tgH">Kime gönderelim?</p>'
   +'<div class="tg-f" id="tgF" role="group" aria-labelledby="tgH">'+FRIENDS.map(k=>{const u=USERS[k];
      return '<button type="button" aria-pressed="false" data-u="'+k+'">'+ava(u)+'<i aria-hidden="true">'+IC.check+'</i><span>'+u.ad.split(' ')[0]+'</span></button>'}).join('')+'</div>'
   +'<label class="sr" for="tgNote">Notun</label><input id="tgNote" class="tg-n" type="text" maxlength="120" value="Bunu birlikte yapalım mı?">'
   +'<button type="button" class="btn green tg-go" id="tgGo" disabled>Kişi seç</button>'
   +'<button type="button" class="tg-out" id="tgOut">'+IC.share+'Başka uygulamayla gönder</button></div>');
  sheet=makeSheet($('tgSheet'),$('tgBg'));
  const sel=()=>[...$('tgF').querySelectorAll('[aria-pressed="true"]')].map(b=>USERS[b.dataset.u].ad.split(' ')[0]);
  const upd=()=>{const n=sel().length;$('tgGo').disabled=!n;$('tgGo').textContent=n?n+' kişiye gönder':'Kişi seç'};
  $('tgF').addEventListener('click',e=>{const b=e.target.closest('[data-u]');if(!b)return;b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');upd()});
  $('tgGo').addEventListener('click',()=>{const l=sel();if(!l.length)return;
    const who=l.length>2?l.slice(0,2).join(', ')+' ve '+(l.length-2)+' kişi':l.join(' ve ');
    sheet.close();toast(who+' ile paylaşıldı.','Tamam',()=>{},3500)});
  $('tgOut').addEventListener('click',()=>{const url=new URL(productUrl(ROOT,prod.title),location.href).href,text=$('tgNote').value+' '+prod.title;
    if(navigator.share)navigator.share({title:prod.title,text,url}).catch(()=>{});
    else if(navigator.clipboard)navigator.clipboard.writeText(text+' '+url).then(()=>{sheet.close();toast('Bağlantı kopyalandı.','Tamam',()=>{},3000)},()=>{})});
}

export function openTogether(from,id){
  prod=getProduct(id);if(!prod)return;
  if(!sheet)build();
  $('tgP').innerHTML='<span class="pt" style="background:'+prod.bg+'"></span><span class="x"><b>'+prod.title+'</b><small>'+prod.type+' · '+prod.place.split(' · ')[0]+'</small></span>';
  $('tgF').querySelectorAll('[data-u]').forEach(b=>b.setAttribute('aria-pressed','false'));
  $('tgGo').disabled=true;$('tgGo').textContent='Kişi seç';$('tgNote').value='Bunu birlikte yapalım mı?';
  sheet.open(from);
}
