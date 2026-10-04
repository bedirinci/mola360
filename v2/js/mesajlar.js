/* Mesajlar: takip ettiklerinle sohbetler ve mesaj istekleri (takip etmediğin
   biri yazınca). Bağlan'ın üstündeki mesaj ikonundan açılır; "Birlikte gidelim"
   ve paylaşımdaki Gönder buraya düşer. Sohbetin kendisi sohbet/?k= */
import { renderShell } from './shell.js';
import { listChats, listFollowing } from './api.js';
import { ava } from './cards.js';
import { makeSheet } from './ui.js';
import { IC, VERIFIED } from './icons.js';
import { ROOT } from './root.js';
import { getLevel } from './level.js';

renderShell('baglan',{nav:false});

const el=document.getElementById('ms'),tabs=document.getElementById('msTabs');
const chatUrl=k=>ROOT+'sohbet/?k='+encodeURIComponent(k);
/* son mesajın özeti: kart gönderildiyse ne olduğu */
function preview(c){const m=[...c.msgs].reverse().find(x=>!x.day);if(!m)return '';
  const t=m.invite&&m.product?'Birlikte gidelim: '+m.product.title:m.product&&!m.text?m.product.title:m.post&&!m.text?'Bir paylaşım gönderdi':m.text||(m.product?m.product.title:'');
  return (m.who==='b'?'Sen: ':'')+t}
const row=c=>'<li><a class="ms-r'+(c.unread?' new':'')+'" href="'+chatUrl(c.id)+'">'+ava(c.user,'m')
  +'<span class="x"><b>'+c.user.ad+(c.user.onay?VERIFIED:'')+'</b><span class="pv">'+preview(c)+'</span></span>'
  +'<span class="ms-t"><small>'+c.when+'</small>'+(c.unread?'<i aria-label="'+c.unread+' yeni mesaj">'+c.unread+'</i>':'')+'</span></a></li>';

let tab='sohbet',q='';
function show(){
  const reqs=listChats({istek:true}),n=document.getElementById('istN');
  n.textContent=reqs.length||'';n.hidden=!reqs.length;
  tabs.querySelectorAll('[data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===tab));
  const all=tab==='istek'?reqs:listChats(),nq=q.toLocaleLowerCase('tr');
  const list=nq?all.filter(c=>(c.user.ad+' '+c.user.kul).toLocaleLowerCase('tr').includes(nq)):all;
  document.getElementById('msL').innerHTML=list.map(row).join('');
  const none=document.getElementById('msNone');
  none.hidden=!!list.length;
  none.innerHTML=q?'<p class="ms-nq">"'+q.replace(/</g,'&lt;')+'" ile eşleşen sohbet yok.</p>'
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
    +'<ul class="ms-l" id="msL"></ul><div id="msNone" hidden></div>';
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b){tab=b.dataset.t;show()}});
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
