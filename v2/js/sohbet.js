/* Sohbet: iki kişi arasındaki mesajlar. Mesajda deneyim kartı (Birlikte
   gidelim daveti dahil) ve Bağlan paylaşımı gönderilebilir. Takip etmediğin
   biri yazdıysa mesaj isteği: kabul edene kadar yanıt kutusu yok. */
import { renderShell } from './shell.js';
import { getChat, markRead, acceptChat, deleteChat, sendMessage, listRecent, listProducts, findByTitle, productUrl } from './api.js';
import { ava, postUrl, userUrl } from './cards.js';
import { favList } from './favorites.js';
import { makeSheet, toast, tl } from './ui.js';
import { IC, VERIFIED, STAR } from './icons.js';
import { ROOT } from './root.js';
import { getLevel } from './level.js';

renderShell('baglan',{nav:false});

const $=id=>document.getElementById(id);
const main=$('ch'),form=$('chIn'),txt=$('chTxt'),go=$('chGo');
const k=new URLSearchParams(location.search).get('k');
let chat=k&&getLevel()!=='guest'?getChat(k):null;

const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const score=p=>p.score&&p.count?'<span class="st">'+STAR+p.score.toFixed(1).replace('.',',')+'</span>':'';
/* deneyim kartı; davetse üstünde "Birlikte gidelim" */
const pcard=(p,inv)=>'<a class="ms-pc'+(inv?' inv':'')+'" href="'+productUrl(ROOT,p.title)+'">'
  +(inv?'<span class="ms-inv">'+IC.users+'Birlikte gidelim</span>':'')
  +'<span class="ms-pi" style="background:'+p.bg+'"></span><span class="x"><small>'+p.type+' · '+p.place.split(' · ')[0].split(',')[0]+'</small><b>'+p.title+'</b>'
  +'<em>'+score(p)+'<span>'+tl(p.price)+'</span></em></span>'
  +(inv?'<span class="ms-cta">Tarihlere bak'+IC.right+'</span>':'')+'</a>';
/* paylaşım kartı */
const pst=x=>'<a class="ms-ps" href="'+postUrl(x.id)+'"><span class="ms-ph">'+ava(x.user,'xs')+'<b>'+x.user.kul+'</b>'+(x.user.onay?VERIFIED:'')+'</span>'
  +'<span class="ms-pim" style="background:'+x.bg+'"></span>'+(x.text?'<span class="ms-pt">'+x.text+'</span>':'')+'</a>';

/* mesajlar: aynı kişinin art arda gelenleri bir grup; grubun sonunda saat,
   karşı tarafınkinde avatar */
function render(){
  const l=chat.msgs,out=[];
  l.forEach((m,i)=>{
    if(m.day){out.push('<li class="ms-day"><span>'+m.day+'</span></li>');return}
    const nx=l[i+1],last=!nx||nx.day||nx.who!==m.who,pv=l[i-1],first=!pv||pv.day||pv.who!==m.who;
    const body=(m.product?pcard(m.product,m.invite):'')+(m.post?pst(m.post):'')+(m.text?'<p class="bb">'+esc(m.text)+'</p>':'');
    out.push('<li class="ms-m '+(m.who==='b'?'me':'they')+(first?' first':'')+(last?' last':'')+'">'
      +(m.who==='o'?(last?ava(chat.user,'s'):'<span class="ava-sp"></span>'):'')
      +'<div class="ms-b">'+body+(last?'<small>'+m.at+'</small>':'')+'</div></li>');
  });
  const lm=[...l].reverse().find(m=>!m.day);
  if(lm&&lm.who==='b'&&!chat.request)out.push('<li class="ms-seen">'+(lm.sent?'Gönderildi':'Görüldü')+'</li>');
  main.innerHTML='<ul class="ms-c-l" id="chL">'+('<li class="ms-start">'+ava(chat.user,'l')+'<b>'+chat.user.ad+(chat.user.onay?VERIFIED:'')+'</b><small>@'+chat.user.kul+'</small><a class="btn ghost" href="'+userUrl(chat.user)+'">Profili gör</a></li>')+out.join('')+'</ul>';
}
const toEnd=smooth=>requestAnimationFrame(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:smooth?'smooth':'auto'}));

if(getLevel()==='guest'){
  $('chWho').innerHTML='<h1 class="bk-h">Mesajlar</h1>';
  main.innerHTML='<div class="empty"><span class="ei">'+IC.send+'</span><b>Mesajların burada</b><p>Takip ettiklerine deneyim gönder, birlikte plan yap. Mesajlaşmak için giriş yap.</p><button type="button" class="btn green" data-giris="login">Giriş yap</button></div>';
}else if(!chat){
  $('chWho').innerHTML='<h1 class="bk-h">Sohbet</h1>';
  main.innerHTML='<div class="empty"><span class="ei">'+IC.send+'</span><b>Bu sohbet bulunamadı</b><p>Sohbet silinmiş olabilir.</p><a class="btn" href="'+ROOT+'mesajlar/">Mesajlar\'a git</a></div>';
}else{
  const u=chat.user;
  document.title='mola360 — '+u.ad;
  $('chWho').innerHTML='<a href="'+userUrl(u)+'">'+ava(u,'s')+'<span class="x"><b>'+u.ad+(u.onay?VERIFIED:'')+'</b><small>@'+u.kul+'</small></span></a>';
  $('chMore').hidden=false;
  render();
  if(chat.request){
    /* mesaj isteği: okundu sayılmaz; kabul et ya da sil */
    $('chReq').hidden=false;
    $('chReq').innerHTML='<p><b>'+u.ad+' takip ettiklerin arasında değil.</b> Kabul edersen birbirinize yazabilirsiniz. Kabul edene kadar mesajı okuduğunu bilmez.</p>'
      +'<div class="ms-req-b"><button type="button" class="btn ghost" data-req="sil">Sil</button><button type="button" class="btn green" data-req="kabul">Kabul et</button></div>';
    $('chReq').addEventListener('click',e=>{const b=e.target.closest('[data-req]');if(!b)return;
      if(b.dataset.req==='kabul'){acceptChat(k);markRead(k);chat=getChat(k);$('chReq').hidden=true;form.hidden=false;render();toEnd();txt.focus()}
      else{deleteChat(k);toast('İstek silindi.','Tamam',()=>{},2500);setTimeout(()=>location.replace(ROOT+'mesajlar/#istekler'),600)}});
  }else{markRead(k);form.hidden=false}
  toEnd();

  txt.addEventListener('input',()=>{go.disabled=!txt.value.trim()});
  form.addEventListener('submit',e=>{e.preventDefault();if(!sendMessage(k,{text:txt.value}))return;
    txt.value='';go.disabled=true;chat=getChat(k);render();toEnd(true);txt.focus()});

  /* + : deneyim gönder (favoriler, son baktıkların, sonra çok sevilenler) */
  let dsh=null;
  $('chAdd').addEventListener('click',e=>{
    if(!dsh){
      const seen=new Set(),pick=[...favList().map(findByTitle),...listRecent(),...listProducts().sort((a,b)=>b.count-a.count)].filter(p=>p&&!seen.has(p.id)&&seen.add(p.id)).slice(0,8);
      document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="dpBg"></div><div class="sheet dp" id="dpSheet" role="dialog" aria-modal="true" aria-labelledby="dpTtl">'
        +'<div class="sh-grab"></div><div class="sh-hd"><h3 id="dpTtl">Deneyim gönder</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div>'
        +'<ul class="nm-l dp-l">'+pick.map(p=>'<li><button type="button" data-p="'+p.id+'"><span class="pt" style="background:'+p.bg+'"></span><span class="x"><b>'+p.title+'</b><small>'+p.type+' · '+p.place.split(' · ')[0]+'</small></span>'+IC.send+'</button></li>').join('')+'</ul></div>');
      dsh=makeSheet($('dpSheet'),$('dpBg'));
      $('dpSheet').addEventListener('click',ev=>{const b=ev.target.closest('[data-p]');if(!b)return;
        sendMessage(k,{urun:b.dataset.p});dsh.close();chat=getChat(k);render();toEnd(true)});
    }
    dsh.open(e.currentTarget);
  });

  /* ⋯ : profil, sessize al, bildir, sohbeti sil */
  let osh=null,muted=false;
  $('chMore').addEventListener('click',e=>{
    if(!osh){
      const it=(a,ic,t,cls)=>'<li><button type="button" data-o="'+a+'"'+(cls?' class="'+cls+'"':'')+'>'+ic+'<span>'+t+'</span></button></li>';
      document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="opBg"></div><div class="sheet op" id="opSheet" role="dialog" aria-modal="true" aria-labelledby="opTtl">'
        +'<div class="sh-grab"></div><div class="sh-hd"><h3 id="opTtl">'+u.ad+'</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div>'
        +'<ul class="op-l">'+it('profil',IC.users,'Profili gör')+it('sessiz',IC.mute,'Sessize al')+it('bildir',IC.flag,'Bildir')+it('sil',IC.trash,'Sohbeti sil','dng')+'</ul>'
        +'<div class="op-c" hidden><p>Sohbet senin için silinsin mi? '+u.ad.split(' ')[0]+' mesajları görmeye devam eder.</p><div class="ms-req-b"><button type="button" class="btn ghost" data-o="vazgec">Vazgeç</button><button type="button" class="btn danger" data-o="evet">Sil</button></div></div></div>');
      osh=makeSheet($('opSheet'),$('opBg'));
      $('opSheet').addEventListener('click',ev=>{const b=ev.target.closest('[data-o]');if(!b)return;const a=b.dataset.o,c=$('opSheet').querySelector('.op-c'),l=$('opSheet').querySelector('.op-l');
        if(a==='profil'){osh.go(userUrl(u));return}
        if(a==='sessiz'){muted=!muted;b.querySelector('span').textContent=muted?'Sesi aç':'Sessize al';osh.close();toast(muted?'Bu sohbetin bildirimleri kapandı.':'Bildirimler yeniden açık.','Tamam',()=>{},3000);return}
        if(a==='bildir'){osh.close();toast('Bildirimin alındı, ekibimiz inceleyecek.','Tamam',()=>{},3500);return}
        if(a==='sil'){l.hidden=true;c.hidden=false;return}
        if(a==='vazgec'){l.hidden=false;c.hidden=true;return}
        if(a==='evet'){deleteChat(k);osh.close();toast('Sohbet silindi.','Tamam',()=>{},2500);setTimeout(()=>location.replace(ROOT+'mesajlar/'),600)}});
    }
    $('opSheet').querySelector('.op-l').hidden=false;$('opSheet').querySelector('.op-c').hidden=true;
    osh.open(e.currentTarget);
  });
}
