/* Birlikte gidelim: Bağlan'daki bir deneyimi arkadaşlarına "Bunu yapalım mı?"
   notuyla gönderir. Takip ettiğin kişiler seçilir; ya da telefonun paylaşımıyla
   başka uygulamadan gönderilir. Aynı çekmece paylaşımın Paylaş düğmesinde
   "Gönder" olur (openSend). Gönderilen her şey Mesajlar'da sohbete düşer. */
import { makeSheet, toast } from './ui.js';
import { getProduct, productUrl, getPost, sendMessage, FOLLOWING } from './api.js';
import { USERS } from './data.js';
import { IC } from './icons.js';
import { ROOT } from './root.js';

const FRIENDS=FOLLOWING;
const $=id=>document.getElementById(id);
let sheet=null,prod=null,post=null;
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
  const keys=()=>[...$('tgF').querySelectorAll('[aria-pressed="true"]')].map(b=>b.dataset.u);
  const sel=()=>keys().map(k=>USERS[k].ad.split(' ')[0]);
  const upd=()=>{const n=sel().length;$('tgGo').disabled=!n;$('tgGo').textContent=n?n+' kişiye gönder':'Kişi seç'};
  $('tgF').addEventListener('click',e=>{const b=e.target.closest('[data-u]');if(!b)return;b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');upd()});
  $('tgGo').addEventListener('click',()=>{const l=sel(),ks=keys();if(!l.length)return;
    const note=$('tgNote').value.trim();
    ks.forEach(k=>post?sendMessage(k,{post:post.id,text:note}):sendMessage(k,{urun:prod.id,davet:true,text:note}));
    const who=l.length>2?l.slice(0,2).join(', ')+' ve '+(l.length-2)+' kişi':l.join(' ve ');
    const to=ks.length===1?ROOT+'sohbet/?k='+ks[0]:ROOT+'mesajlar/';
    sheet.close();toast(who+' ile paylaşıldı.',ks.length===1?'Sohbete git':'Mesajlar',()=>{location.href=to},4500)});
  $('tgOut').addEventListener('click',()=>{const title=post?post.user.kul+' paylaşımı':prod.title,
      url=new URL(post?ROOT+'gonderi/?id='+encodeURIComponent(post.id):productUrl(ROOT,prod.title),location.href).href,text=($('tgNote').value+' '+(post?'':prod.title)).trim();
    if(navigator.share)navigator.share({title,text,url}).catch(()=>{});
    else if(navigator.clipboard)navigator.clipboard.writeText(text+' '+url).then(()=>{sheet.close();toast('Bağlantı kopyalandı.','Tamam',()=>{},3000)},()=>{})});
}

function open(from,ttl,preview,note,ph){
  if(!sheet)build();
  $('tgTtl').textContent=ttl;$('tgP').innerHTML=preview;
  $('tgF').querySelectorAll('[data-u]').forEach(b=>b.setAttribute('aria-pressed','false'));
  $('tgGo').disabled=true;$('tgGo').textContent='Kişi seç';$('tgNote').value=note;$('tgNote').placeholder=ph;
  sheet.open(from);
}
export function openTogether(from,id){
  prod=getProduct(id);post=null;if(!prod)return;
  open(from,'Birlikte gidelim','<span class="pt" style="background:'+prod.bg+'"></span><span class="x"><b>'+prod.title+'</b><small>'+prod.type+' · '+prod.place.split(' · ')[0]+'</small></span>','Bunu birlikte yapalım mı?','Notun');
}
/* Paylaşımı mesajla gönder */
export function openSend(from,id){
  post=getPost(id);prod=null;if(!post)return;
  open(from,'Gönder','<span class="pt" style="background:'+post.bg+'"></span><span class="x"><b>'+post.user.kul+' paylaşımı</b><small>'+(post.product?post.product.title:post.place)+'</small></span>','','Mesaj ekle…');
}
