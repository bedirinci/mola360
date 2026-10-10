/* Mesajlar: takip ettiklerinle sohbetler ve mesaj istekleri (takip etmediğin
   biri yazınca). Bağlan'ın üstündeki mesaj ikonundan açılır; "Birlikte gidelim"
   ve paylaşımdaki Gönder buraya düşer. Sohbetin kendisi sohbet/?k= */
import { renderShell } from './shell.js';
import { listChats, listFollowing, setMuted, setArchived, deleteChat } from './api.js';
import { ava } from './cards.js';
import { makeSheet, toast, esc } from './ui.js';
import { IC, VERIFIED } from './icons.js';
import { ROOT } from './root.js';
import { getLevel } from './level.js';

renderShell('baglan',{nav:false});

const el=document.getElementById('ms'),tabs=document.getElementById('msTabs');
const chatUrl=k=>ROOT+'sohbet/?k='+encodeURIComponent(k);
/* son mesajın özeti: kart gönderildiyse ne olduğu. Düz metin; satıra esc ile basılır */
function preview(c){const m=[...c.msgs].reverse().find(x=>!x.day);if(!m)return '';
  const t=m.invite&&m.product?'Birlikte gidelim: '+m.product.title:m.product&&!m.text?m.product.title:m.post&&!m.text?'Bir paylaşım gönderdi':m.text||(m.product?m.product.title:'');
  return (m.who==='b'?'Sen: ':'')+t}
/* son mesaj senin ise durumu: gönderildi (boş halka), iletildi (dolu gri), görüldü (karşı kişinin minik avatarı) */
const TICK='<path d="m8 12.4 2.7 2.6L16 9.6"/>';
const status=c=>c.status==='goruldu'?'<span class="ms-st seen" role="img" aria-label="Görüldü">'+ava(c.user,'xs')+'</span>'
  :c.status?'<span class="ms-st '+(c.status==='iletildi'?'dl':'')+'" role="img" aria-label="'+(c.status==='iletildi'?'İletildi':'Gönderildi')+'"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/>'+TICK+'</svg></span>':'';
/* sola kaydırınca: Daha fazla, Sessize al, Arşivle (arşivde: Arşivden çıkar) */
const act=(a,ic,t,cls)=>'<button type="button" class="sw-b'+(cls?' '+cls:'')+'" data-sw="'+a+'" tabindex="-1">'+ic+'<span>'+t+'</span></button>';
const row=c=>(c.request?'<li>':'<li class="ms-sw" data-k="'+c.id+'"><div class="sw-a" aria-hidden="true">'+act('more',IC.more,'Daha fazla')
  +act('mute',c.muted?IC.bell:IC.mute,c.muted?'Sesi aç':'Sessize al')+act('arch',IC.archive,c.archived?'Çıkar':'Arşivle','arch')+'</div>')
  +'<a class="ms-r'+(c.unread?' new':'')+'" href="'+chatUrl(c.id)+'">'+ava(c.user,'m')
  +'<span class="x"><b>'+c.user.ad+(c.user.onay?VERIFIED:'')+(c.muted?'<i class="ms-mu" role="img" aria-label="Sessize alındı">'+IC.mute+'</i>':'')+'</b><span class="pv">'+esc(preview(c))+'</span></span>'
  +'<span class="ms-t"><small>'+c.when+'</small>'+(c.unread?'<i aria-label="'+c.unread+' yeni mesaj">'+c.unread+'</i>':status(c))+'</span></a></li>';

let tab='sohbet',q='';
function show(){
  const reqs=listChats({istek:true}),n=document.getElementById('istN');
  n.textContent=reqs.length||'';n.hidden=!reqs.length;
  tabs.querySelectorAll('[data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===tab));
  const arch=listChats({arsiv:true});
  const all=tab==='istek'?reqs:tab==='arsiv'?arch:listChats(),nq=q.toLocaleLowerCase('tr');
  const list=nq?all.filter(c=>(c.user.ad+' '+c.user.kul).toLocaleLowerCase('tr').includes(nq)):all;
  document.getElementById('msL').innerHTML=list.map(row).join('');
  /* Arşivlenenler: sohbetlerin altında bir satır; arşivde başta geri dönüş */
  const ar=document.getElementById('msArch');
  ar.innerHTML=tab==='sohbet'&&arch.length&&!q?'<button type="button" class="ms-ar" data-arsiv>'+IC.archive+'<span>Arşivlenen sohbetler</span><em>'+arch.length+'</em>'+IC.right+'</button>':'';
  document.getElementById('msArH').hidden=tab!=='arsiv';
  const none=document.getElementById('msNone');
  none.hidden=!!list.length;
  none.innerHTML=q?'<p class="ms-nq">"'+esc(q)+'" ile eşleşen sohbet yok.</p>'
    :tab==='arsiv'?'<div class="empty"><span class="ei">'+IC.archive+'</span><b>Arşivin boş</b><p>Sola kaydırıp "Arşivle"ye dokunduğun sohbetler burada durur.</p></div>'
    :tab==='istek'?'<div class="empty"><span class="ei">'+IC.shield+'</span><b>Mesaj isteğin yok</b><p>Takip etmediğin biri yazınca mesajı burada görürsün. Kabul edene kadar mesajını okuduğunu bilmez.</p></div>'
    :'<div class="empty"><span class="ei">'+IC.send+'</span><b>Henüz mesajın yok</b><p>Bir paylaşımı arkadaşına gönder ya da "Birlikte gidelim" de; sohbetiniz burada başlar.</p><button type="button" class="btn" data-new>Yeni mesaj</button></div>';
  document.getElementById('msHint').hidden=tab!=='istek'||!list.length;
}

if(getLevel()==='guest'){
  tabs.hidden=true;
  el.innerHTML='<div class="empty"><span class="ei">'+IC.send+'</span><b>Mesajların burada</b><p>Takip ettiklerine deneyim gönder, birlikte plan yap. Mesajlaşmak için giriş yap.</p><button type="button" class="btn green" data-giris="login">Giriş yap</button></div>';
}else{
  el.innerHTML='<label class="ms-q"><span class="sr">Sohbetlerde ara</span>'+IC.search+'<input id="msQ" type="search" placeholder="Ara" autocomplete="off" enterkeyhint="search"></label>'
    +'<p class="ms-hint" id="msHint" hidden>'+IC.shield+'Kabul edene kadar mesajı okuduğunu bilmezler.</p>'
    +'<div class="ms-arh" id="msArH" hidden><button type="button" data-t-back>'+IC.back+'</button><b>Arşivlenen sohbetler</b></div>'
    +'<ul class="ms-l" id="msL"></ul><div id="msArch"></div><div id="msNone" hidden></div>';
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b){tab=b.dataset.t;show()}});
  el.addEventListener('click',e=>{if(e.target.closest('[data-arsiv]')){tab='arsiv';show();scrollTo(0,0)}
    else if(e.target.closest('[data-t-back]')){tab='sohbet';show()}});
  initSwipe();
  document.getElementById('msQ').addEventListener('input',e=>{q=e.target.value.trim();show()});
  if(location.hash==='#istekler')tab='istek';
  show();
  /* geri gelince (bfcache) okunmuşlar güncellensin */
  addEventListener('pageshow',e=>{if(e.persisted)show()});
}

/* Yeni mesaj: takip ettiklerinden biri seçilir */
let sheet=null;
function openNew(from){
  if(!sheet){
    document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="nmBg"></div><div class="sheet nm" id="nmSheet" role="dialog" aria-modal="true" aria-labelledby="nmTtl">'
      +'<div class="sh-grab"></div><div class="sh-hd"><h3 id="nmTtl">Yeni mesaj</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div>'
      +'<p class="tg-h">Takip ettiklerin</p><ul class="nm-l">'+listFollowing().map(f=>'<li><a href="'+chatUrl(f.id)+'">'+ava(f.user)+'<span class="x"><b>'+f.user.ad+(f.user.onay?VERIFIED:'')+'</b><small>@'+f.user.kul+'</small></span>'+IC.right+'</a></li>').join('')+'</ul></div>');
    sheet=makeSheet(document.getElementById('nmSheet'),document.getElementById('nmBg'));
  }
  sheet.open(from);
}
document.addEventListener('click',e=>{const b=e.target.closest('#newBtn,[data-new]');if(b)openNew(b)});

/* Kaydırma: yalnızca yatay. Satır touch-action:pan-y, yani dikey kayma
   tarayıcıda kalır; yatay hareket kilitlenince satır sola açılır. Bir satır
   açıkken başka bir yere dokunmak onu kapatır. */
let openRow=null;
const setX=(li,x,anim)=>{const r=li.querySelector('.ms-r');r.style.transition=anim?'transform .26s cubic-bezier(.2,.8,.2,1)':'none';r.style.transform=x?'translateX('+x+'px)':''};
function closeRow(){if(!openRow)return;const li=openRow;openRow=null;setX(li,0,true);li.classList.remove('open');li.querySelectorAll('.sw-b').forEach(b=>b.tabIndex=-1);li.querySelector('.sw-a').setAttribute('aria-hidden','true')}
function openIt(li){if(openRow&&openRow!==li)closeRow();openRow=li;const w=li.querySelector('.sw-a').offsetWidth;setX(li,-w,true);li.classList.add('open');li.querySelectorAll('.sw-b').forEach(b=>b.tabIndex=0);li.querySelector('.sw-a').removeAttribute('aria-hidden')}
function initSwipe(){
  const L=document.getElementById('msL');let st=null;
  /* dokunma (touch*) ve fare (pointer*) aynı üç adımı kullanır */
  const down=(t,x,y)=>{const li=t.closest('.ms-sw');if(!li||t.closest('.sw-a'))return;
    st={li,x,y,lock:0,base:li===openRow?-li.querySelector('.sw-a').offsetWidth:0,dx:0}};
  const move=(x,y,e)=>{if(!st)return;const dx=x-st.x,dy=y-st.y;
    if(!st.lock){if(Math.abs(dx)<8&&Math.abs(dy)<8)return;st.lock=Math.abs(dx)>Math.abs(dy)?1:-1;
      if(st.lock>0&&openRow&&openRow!==st.li)closeRow()}
    if(st.lock<0)return;
    if(e.cancelable)e.preventDefault();
    const w=st.li.querySelector('.sw-a').offsetWidth;st.dx=dx;
    let x2=Math.min(0,st.base+dx);if(x2<-w)x2=-w-(-w-x2)*.25;setX(st.li,x2,false)};
  L.addEventListener('touchstart',e=>{const t=e.touches[0];down(e.target,t.clientX,t.clientY)},{passive:true});
  L.addEventListener('touchmove',e=>{const t=e.touches[0];move(t.clientX,t.clientY,e)},{passive:false});
  L.addEventListener('touchend',()=>end());L.addEventListener('touchcancel',()=>end());
  L.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&!e.button)down(e.target,e.clientX,e.clientY)});
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse')move(e.clientX,e.clientY,e)});
  addEventListener('pointerup',e=>{if(e.pointerType==='mouse')end()});
  function end(){if(!st)return;const s0=st;st=null;if(s0.lock<=0)return;
    const w=s0.li.querySelector('.sw-a').offsetWidth,x=s0.base+s0.dx;
    s0.li.dataset.drag='1';setTimeout(()=>delete s0.li.dataset.drag,350);
    if(x<-w*.35)openIt(s0.li);else{if(openRow===s0.li)closeRow();else setX(s0.li,0,true)}}
  /* sürükleme bağı açmaz; açık satıra dokunmak yalnızca kapatır */
  L.addEventListener('click',e=>{const li=e.target.closest('.ms-sw');if(!li)return;
    const b=e.target.closest('[data-sw]');if(b){e.preventDefault();swAct(li.dataset.k,b.dataset.sw,b);return}
    if(li.dataset.drag||li===openRow){e.preventDefault();closeRow()}},true);
  /* açık satır varken başka yere dokunmak yalnızca onu kapatır, bağı açmaz */
  let swallow=false;
  document.addEventListener('pointerdown',e=>{swallow=false;if(openRow&&!openRow.contains(e.target)){closeRow();swallow=true}},true);
  document.addEventListener('click',e=>{if(swallow){swallow=false;e.preventDefault();e.stopPropagation()}},true);
  addEventListener('scroll',()=>{if(openRow&&!st)closeRow()},{passive:true});
}
function swAct(k,a,b){
  const c=listChats({arsiv:tab==='arsiv'}).find(x=>x.id===k)||{},ad=(c.user||{}).ad||'';
  if(a==='mute'){setMuted(k,!c.muted);closeRow();show();toast(c.muted?ad+' için bildirimler açık.':ad+' sessize alındı.','Geri al',()=>{setMuted(k,!!c.muted);show()},3500);return}
  if(a==='arch'){const on=!c.archived;setArchived(k,on);openRow=null;show();
    toast(on?'Sohbet arşivlendi.':'Sohbet arşivden çıkarıldı.','Geri al',()=>{setArchived(k,!on);show()},4000);return}
  if(a==='more')openMore(k,c,b);
}
/* Daha fazla: profil, okunmadı say, sohbeti sil */
let msh=null,mk='';
function openMore(k,c,from){mk=k;
  if(!msh){
    const it=(a,ic,t,cls)=>'<li><button type="button" data-mo="'+a+'"'+(cls?' class="'+cls+'"':'')+'>'+ic+'<span>'+t+'</span></button></li>';
    document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="moBg"></div><div class="sheet op" id="moSheet" role="dialog" aria-modal="true" aria-labelledby="moTtl">'
      +'<div class="sh-grab"></div><div class="sh-hd"><h3 id="moTtl"></h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div>'
      +'<ul class="op-l">'+it('profil',IC.users,'Profili gör')+it('okunmadi',IC.comment,'Okunmadı olarak işaretle')+it('bildir',IC.flag,'Bildir')+it('sil',IC.trash,'Sohbeti sil','dng')+'</ul>'
      +'<div class="op-c" hidden><p id="moQ"></p><div class="ms-req-b"><button type="button" class="btn ghost" data-mo="vazgec">Vazgeç</button><button type="button" class="btn danger" data-mo="evet">Sil</button></div></div></div>');
    msh=makeSheet(document.getElementById('moSheet'),document.getElementById('moBg'));
    document.getElementById('moSheet').addEventListener('click',ev=>{const b=ev.target.closest('[data-mo]');if(!b)return;
      const a=b.dataset.mo,sh=document.getElementById('moSheet'),l=sh.querySelector('.op-l'),cf=sh.querySelector('.op-c');
      if(a==='profil'){location.href=ROOT+'kisi/?u='+encodeURIComponent(msh.u.kul);return}
      if(a==='okunmadi'){msh.close();toast('Çok yakında.','Tamam',()=>{},3000);return}
      if(a==='bildir'){msh.close();toast('Çok yakında.','Tamam',()=>{},3000);return}
      if(a==='sil'){l.hidden=true;cf.hidden=false;return}
      if(a==='vazgec'){l.hidden=false;cf.hidden=true;return}
      if(a==='evet'){deleteChat(mk);msh.close();openRow=null;show();toast('Sohbet silindi.','Tamam',()=>{},2500)}});
  }
  msh.u=c.user;
  const sh=document.getElementById('moSheet');
  document.getElementById('moTtl').textContent=c.user.ad;
  document.getElementById('moQ').textContent='Sohbet senin için silinsin mi? '+c.user.ad.split(' ')[0]+' mesajları görmeye devam eder.';
  sh.querySelector('.op-l').hidden=false;sh.querySelector('.op-c').hidden=true;
  closeRow();msh.open(from);
}
