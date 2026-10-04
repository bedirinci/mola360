/* Bildirimler: başlıktaki zilden açılır. Bağlan'dan gelenler (beğeni, yorum,
   bahsetme, yeni takipçi, Birlikte gidelim, mesaj isteği, haftanın gezgini) ve
   Planlarım'dan gelenler (yaklaşan tur, kalan ödeme, değerlendirme, favorideki
   indirim, Molapuan, seviye). Her satır ilgili sayfaya gider; dokununca okunur. */
import { renderShell, applyLevel } from './shell.js';
import { listNotifs, markNotifs, productUrl, NOTIF_GROUPS, notifOff, setNotif } from './api.js';
import { ava, postUrl, userUrl } from './cards.js';
import { tl, makeSheet } from './ui.js';
import { IC, VERIFIED } from './icons.js';
import { ROOT } from './root.js';
import { getLevel } from './level.js';

renderShell('',{nav:false});

const el=document.getElementById('nt'),tabs=document.getElementById('ntTabs');
const I=d=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
const STAR=I('<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>');
const PCT=I('<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>');
const PIN=I('<path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>');
const MP='<img src="'+ROOT+'img/molapuan.webp" alt="" width="44" height="44">';
/* avatarın köşesindeki tür rozeti: ne olduğu ilk bakışta okunur (beyaz zemin, dolu ikon) */
const BADGE={begeni:'<path d="M12 20.5s-8-4.6-8-10.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8 2.6c0 6-8 10.6-8 10.6z"/>',
  yorum:'<path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z"/>',bahset:'<path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z"/>',
  takip:'<circle cx="10" cy="8" r="4"/><path d="M3 20a7 7 0 0 1 14 0zM19 8v6M16 11h6"/>',
  davet:'<path d="M3 7h18v12H3z"/><path class="w" d="m3 7 9 7 9-7"/>',istek:'<path d="M21.5 2.5 14.5 21.5l-4-8-8-4z"/>',
  gezgin:'<path d="M7 4h10v5a5 5 0 0 1-10 0zM10 18h4v2h-4zM11 13h2v5h-2z"/><path class="w" d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>'};
const badge=t=>BADGE[t]?'<i class="nt-bd"><svg viewBox="0 0 24 24" aria-hidden="true">'+BADGE[t]+'</svg></i>':'';

const name=u=>'<b>'+u.kul+(u.onay?VERIFIED:'')+'</b>';
const q=t=>'<span class="nt-q">'+t+'</span>';
const thumb=bg=>'<span class="nt-th" style="background:'+bg+'"></span>';
const icon=(ic,cls)=>'<span class="nt-ic'+(cls?' '+cls:'')+'">'+ic+'</span>';
const face=(n,html)=>'<span class="nt-av">'+html+badge(n.tur)+'</span>';
const plan=(a,x)=>ROOT+'planlarim/?ac='+a+'&'+x;

/* her bildirim: [sol (avatar ya da ikon), metin, gidilecek adres, sağ (görsel), ek düğme] */
function parts(n){const p=n.product,u=n.users&&n.users[0];
  switch(n.tur){
  case 'degerlendir':return [icon(STAR),'<b>'+p.title+'</b> nasıldı? 10 üzerinden puan ver.',plan('rate','id='+p.id),'','Değerlendir'];
  case 'indirim':{const pct=Math.round((1-p.price/p.old)*100);
    return [icon(PCT),'Favorindeki <b>'+p.title+'</b> indirimde: <s>'+tl(p.old)+'</s> <b>'+tl(p.price)+'</b> <span class="nt-off">%'+pct+' indirim</span>',productUrl(ROOT,p.title),thumb(p.bg)]}
  case 'puan':return [icon(MP,'nt-mp'),'<b>'+p.title+'</b> rezervasyonundan <b class="nt-g">'+n.puan+' Molapuan</b> kazandın.',ROOT+'profil/'];
  case 'seviye':return [icon(MP,'nt-mp'),'Artık <b>Kâşif</b>sin! Seçili deneyimlerde %10 indirim hesabına tanımlandı.',ROOT+'profil/'];
  case 'gezgin':return [face(n,ava(u,'m')),'Haftanın gezgini '+name(u)+'. Paylaşımı '+n.total.toLocaleString('tr-TR')+' etkileşim aldı, '+n.points+' Molapuan kazandı.',postUrl(n.post.id),thumb(n.post.bg)];
  case 'begeni':return [face(n,'<span class="nt-two">'+n.users.slice(0,2).map(x=>ava(x,'s')).join('')+'</span>'),
    n.users.map(name).join(', ')+(n.n?' ve '+n.n.toLocaleString('tr-TR')+' kişi daha':'')+' paylaşımını beğendi.',postUrl(n.post.id),thumb(n.post.bg)];
  case 'yorum':return [face(n,ava(u,'m')),name(u)+' yorum yaptı: '+q('"'+n.metin+'"'),postUrl(n.post.id)+'#yorumlar',thumb(n.post.bg)];
  case 'bahset':return [face(n,ava(u,'m')),name(u)+' senden bahsetti: '+q('"'+n.metin+'"'),postUrl(n.post.id)+'#yorumlar',thumb(n.post.bg)];
  case 'takip':return [face(n,ava(u,'m')),name(u)+' seni takip etmeye başladı.',userUrl(u),'',null,true];
  case 'davet':return [face(n,ava(u,'m')),name(u)+' seninle <b>'+p.title+'</b> yapmak istiyor.',ROOT+'sohbet/?k='+n.k[0],thumb(p.bg)];
  case 'istek':return [face(n,ava(u,'m')),name(u)+' sana mesaj göndermek istiyor.',ROOT+'mesajlar/#istekler','','Gör'];
  }return null}

function row(n){const r=parts(n);if(!r)return '';const [lead,text,href,right,btn,follow]=r;
  return '<li class="nt-r'+(n.read?'':' new')+'"><a class="nt-a" href="'+href+'" data-id="'+n.id+'">'+lead
   +'<span class="nt-x"><span class="nt-t">'+text+'</span> <time>'+n.ne+'</time></span>'+(right||'')+'</a>'
   +(btn?'<a class="nt-b" href="'+href+'" data-id="'+n.id+'">'+btn+'</a>':'')
   +(follow?'<button type="button" class="follow" aria-pressed="false" data-id="'+n.id+'">Takip et</button>':'')+'</li>'}

/* Yaklaşan molan: satır değil, üstte sabit kart. Biletim ve kalan ödeme doğrudan Planlarım'daki çekmeceyi açar */
const longDay=d=>d.toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});
const leftTxt=n=>n===0?'Bugün':n===1?'Yarın':n+' gün kaldı';
const upCard=n=>{const p=n.product;
  return '<section class="nt-up'+(n.read?'':' new')+'" aria-label="Yaklaşan molan"><a class="nt-up-a" href="'+ROOT+'planlarim/#yaklasan" data-id="'+n.id+'">'
   +'<span class="pt" style="background:'+p.bg+'"></span><span class="x"><small>'+p.type.toLocaleUpperCase('tr')+'<em class="rz-cd">'+leftTxt(n.left)+'</em></small><b>'+p.title+'</b><span>'+(n.day?longDay(n.day)+' · ':'')+n.slot+'</span></span>'+IC.right+'</a>'
   +(n.meet?'<a class="nt-up-m" href="'+plan('meet','no='+n.no)+'" data-id="'+n.id+'">'+PIN+'<span>Buluşma <b>'+n.meet.saat+'</b> · '+n.meet.yer+'</span></a>':'')
   +'<div class="nt-up-b"><a class="btn ghost" href="'+plan('bilet','no='+n.no)+'" data-id="'+n.id+'">'+IC.ticket+'Biletim</a>'
   +(n.rest>0?'<a class="btn green" href="'+plan('pay','no='+n.no)+'" data-id="'+n.id+'">Kalanı öde · '+tl(n.rest)+'</a>':'')+'</div></section>'};

const GROUPS=[['bugun','Bugün'],['hafta','Bu hafta'],['once','Daha önce']];
const EMPTY={hepsi:['Bildirimin yok','Biri paylaşımını beğenince, seni takip edince ya da molan yaklaşınca burada görürsün.'],
  baglan:['Bağlan\'da yeni bir şey yok','Beğeniler, yorumlar ve yeni takipçilerin burada görünür.'],
  plan:['Planlarında yeni bir şey yok','Yaklaşan molan, ödemelerin ve Molapuanın burada görünür.']};
let tab='hepsi';
function show(){
  const all=listNotifs().filter(n=>n.tur!=='odeme');
  tabs.querySelectorAll('[data-t]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.t===tab);
    const c=b.querySelector('.ms-c'),k=all.filter(n=>!n.read&&(b.dataset.t==='hepsi'||n.cat===b.dataset.t)).length;if(c){c.textContent=k||'';c.hidden=!k}});
  const list=tab==='hepsi'?all:all.filter(n=>n.cat===tab),ups=list.filter(n=>n.tur==='yaklasan'),rest=list.filter(n=>n.tur!=='yaklasan');
  if(!list.length){el.innerHTML='<div class="empty"><span class="ei">'+IC.bell+'</span><b>'+EMPTY[tab][0]+'</b><p>'+EMPTY[tab][1]+'</p></div>';return}
  const nNew=list.filter(n=>!n.read).length;let first=true;
  el.innerHTML=ups.map(upCard).join('')
   +GROUPS.map(([g,t])=>{const l=rest.filter(n=>n.g===g);if(!l.length)return '';
     const h='<div class="nt-hd"><h2 class="nt-h">'+t+'</h2>'+(first&&nNew?'<button type="button" id="ntAll">Tümünü okundu say</button>':'')+'</div>';first=false;
     return '<section aria-label="'+t+'">'+h+'<ul class="nt-l">'+l.map(row).join('')+'</ul></section>'}).join('');
}

/* Bildirim ayarları: hangi bildirimleri almak istediğin. Profil > Hesap ve ayarlar > Bildirimler de buraya açılır (#ayarlar) */
let set=null;
function openSettings(from){
  if(!set){const off=notifOff();
    document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="nsBg"></div><div class="sheet ns" id="nsSheet" role="dialog" aria-modal="true" aria-labelledby="nsTtl">'
      +'<div class="sh-grab"></div><div class="sh-hd"><h3 id="nsTtl">Bildirim ayarları</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div>'
      +'<ul class="ns-l">'+NOTIF_GROUPS.map(([k,t,d])=>'<li><span><b id="ns-'+k+'">'+t+'</b><small>'+d+'</small></span><button type="button" class="sw" role="switch" aria-labelledby="ns-'+k+'" aria-checked="'+!off.has(k)+'" data-ns="'+k+'"></button></li>').join('')
      +'<li class="ns-on"><span><b>Rezervasyon hatırlatmaları</b><small>Yaklaşan molan, ödemelerin ve biletin. Molan için gerekli, hep açık.</small></span><span class="ns-lock">Açık</span></li></ul></div>');
    set=makeSheet(document.getElementById('nsSheet'),document.getElementById('nsBg'));
    document.getElementById('nsSheet').addEventListener('click',e=>{const b=e.target.closest('[data-ns]');if(!b)return;
      const on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);setNotif(b.dataset.ns,on);show();applyLevel()})}
  set.open(from);
}

if(getLevel()==='guest'){
  tabs.hidden=true;document.getElementById('ntSet').hidden=true;
  el.innerHTML='<div class="empty"><span class="ei">'+IC.bell+'</span><b>Bildirimlerin burada</b><p>Paylaşımını beğenenleri, yeni takipçilerini ve yaklaşan molanı buradan takip et.</p><button type="button" class="btn green" data-giris="login">Giriş yap</button></div>';
}else{
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b){tab=b.dataset.t;show()}});
  el.addEventListener('click',e=>{
    if(e.target.closest('#ntAll')){markNotifs(listNotifs().map(n=>n.id));show();applyLevel();return}
    const f=e.target.closest('.follow');
    if(f){const on=f.getAttribute('aria-pressed')!=='true';f.setAttribute('aria-pressed',on);f.textContent=on?'Takiptesin':'Takip et';
      markNotifs([f.dataset.id]);f.closest('.nt-r').classList.remove('new');applyLevel();return}
    const a=e.target.closest('[data-id]');if(a)markNotifs([a.dataset.id]);
  });
  show();
  document.getElementById('ntSet').addEventListener('click',e=>openSettings(e.currentTarget));
  if(location.hash==='#ayarlar'){history.replaceState(history.state,'',location.pathname+location.search);openSettings(null)}
  /* geri gelince (bfcache) okunanlar güncellensin */
  addEventListener('pageshow',e=>{if(e.persisted)show()});
}
