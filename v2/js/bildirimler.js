/* Bildirimler: başlıktaki zilden açılır. Bağlan'dan gelenler (beğeni, yorum,
   bahsetme, yeni takipçi, Birlikte gidelim, mesaj isteği, haftanın gezgini) ve
   Planlarım'dan gelenler (yaklaşan tur, kalan ödeme, değerlendirme, favorideki
   indirim, Molapuan, seviye). Her satır ilgili sayfaya gider; dokununca okunur. */
import { renderShell } from './shell.js';
import { listNotifs, markNotifs, productUrl } from './api.js';
import { ava, postUrl, userUrl } from './cards.js';
import { toast, tl } from './ui.js';
import { IC, VERIFIED } from './icons.js';
import { ROOT } from './root.js';
import { getLevel } from './level.js';

renderShell('',{nav:false});

const el=document.getElementById('nt'),tabs=document.getElementById('ntTabs');
const I=d=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
const CARD=I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>');
const STAR=I('<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>');
const PCT=I('<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>');
const MP='<img src="'+ROOT+'img/molapuan.webp" alt="" width="44" height="44">';

const name=u=>'<b>'+u.kul+(u.onay?VERIFIED:'')+'</b>';
const q=t=>'<span class="nt-q">'+t+'</span>';
const thumb=bg=>'<span class="nt-th" style="background:'+bg+'"></span>';
const icon=(ic,cls)=>'<span class="nt-ic'+(cls?' '+cls:'')+'">'+ic+'</span>';
const leftTxt=n=>n===0?'bugün':n===1?'yarın':n+' gün sonra';

/* her bildirim: [sol (avatar ya da ikon), metin, gidilecek adres, sağ (görsel), ek düğme] */
function parts(n){const p=n.product,u=n.users&&n.users[0];
  switch(n.tur){
  case 'yaklasan':return [icon(IC.calendar),'<b>'+p.title+'</b> '+leftTxt(n.left)+'. Buluşma '+(n.meet?n.meet.saat+', '+n.meet.yer:n.slot)+'.',ROOT+'planlarim/#yaklasan',thumb(p.bg)];
  case 'odeme':return [icon(CARD),'<b>'+p.title+'</b> için kalan <b>'+tl(n.rest)+'</b> ödemen var.',ROOT+'planlarim/#yaklasan','','Kalanı öde'];
  case 'degerlendir':return [icon(STAR),'<b>'+p.title+'</b> nasıldı? 10 üzerinden puan ver.',ROOT+'planlarim/#gecmis','','Değerlendir'];
  case 'indirim':{const pct=Math.round((1-p.price/p.old)*100);
    return [icon(PCT),'Favorindeki <b>'+p.title+'</b> indirimde: <s>'+tl(p.old)+'</s> <b>'+tl(p.price)+'</b>. <span class="nt-off">%'+pct+' indirim</span>',productUrl(ROOT,p.title),thumb(p.bg)]}
  case 'puan':return [icon(MP,'nt-mp'),'<b>'+p.title+'</b> rezervasyonundan <b class="nt-g">'+n.puan+' Molapuan</b> kazandın. Sonraki molanda kullanabilirsin.',ROOT+'profil/'];
  case 'seviye':return [icon(MP,'nt-mp'),'Tebrikler, artık <b>Kâşif</b>sin! Seçili deneyimlerde %10 indirim hesabına tanımlandı.',ROOT+'profil/'];
  case 'gezgin':return [ava(u,'m'),'Haftanın gezgini belli oldu: '+name(u)+'. Paylaşımı '+n.total.toLocaleString('tr-TR')+' etkileşim aldı, '+n.points+' Molapuan kazandı.',postUrl(n.post.id),thumb(n.post.bg)];
  case 'begeni':return ['<span class="nt-two">'+n.users.slice(0,2).map(x=>ava(x,'s')).join('')+'</span>',
    n.users.map(name).join(', ')+(n.n?' ve '+n.n.toLocaleString('tr-TR')+' kişi daha':'')+' paylaşımını beğendi.',postUrl(n.post.id),thumb(n.post.bg)];
  case 'yorum':return [ava(u,'m'),name(u)+' paylaşımına yorum yaptı: '+q(n.metin),postUrl(n.post.id),thumb(n.post.bg)];
  case 'bahset':return [ava(u,'m'),name(u)+' bir yorumda senden bahsetti: '+q(n.metin),postUrl(n.post.id),thumb(n.post.bg)];
  case 'takip':return [ava(u,'m'),name(u)+' seni takip etmeye başladı.',userUrl(u),'',null,true];
  case 'davet':return [ava(u,'m'),name(u)+' seninle <b>'+p.title+'</b> yapmak istiyor: '+q('Birlikte gidelim mi?'),ROOT+'sohbet/?k='+n.k[0],thumb(p.bg)];
  case 'istek':return [ava(u,'m'),name(u)+' sana mesaj göndermek istiyor. Kabul edene kadar okuduğunu bilmez.',ROOT+'mesajlar/#istekler'];
  }return null}

function row(n){const r=parts(n);if(!r)return '';const [lead,text,href,right,btn,follow]=r;
  return '<li class="nt-r'+(n.read?'':' new')+'"><a class="nt-a" href="'+href+'" data-id="'+n.id+'">'+lead
   +'<span class="nt-x"><span class="nt-t">'+text+'</span> <time>'+n.ne+'</time></span>'+(right||'')+'</a>'
   +(btn?'<a class="nt-b" href="'+href+'" data-id="'+n.id+'">'+btn+'</a>':'')
   +(follow?'<button type="button" class="follow" aria-pressed="false">Takip et</button>':'')+'</li>'}

const GROUPS=[['bugun','Bugün'],['hafta','Bu hafta'],['once','Daha önce']];
const EMPTY={hepsi:['Bildirimin yok','Biri paylaşımını beğenince, seni takip edince ya da molan yaklaşınca burada görürsün.'],
  baglan:['Bağlan\'da yeni bir şey yok','Beğeniler, yorumlar ve yeni takipçilerin burada görünür.'],
  plan:['Planlarında yeni bir şey yok','Yaklaşan molan, ödemelerin ve Molapuanın burada görünür.']};
let tab='hepsi';
function show(){
  tabs.querySelectorAll('[data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===tab));
  const all=listNotifs(),list=tab==='hepsi'?all:all.filter(n=>n.cat===tab),nNew=list.filter(n=>!n.read).length;
  if(!list.length){el.innerHTML='<div class="empty"><span class="ei">'+IC.bell+'</span><b>'+EMPTY[tab][0]+'</b><p>'+EMPTY[tab][1]+'</p></div>';return}
  el.innerHTML='<div class="nt-top"><span>'+(nNew?nNew+' yeni bildirim':'Hepsini okudun')+'</span>'+(nNew?'<button type="button" id="ntAll">Tümünü okundu say</button>':'')+'</div>'
   +GROUPS.map(([g,t])=>{const l=list.filter(n=>n.g===g);return l.length?'<section class="nt-g-s" aria-label="'+t+'"><h2 class="nt-h">'+t+'</h2><ul class="nt-l">'+l.map(row).join('')+'</ul></section>':''}).join('');
}

if(getLevel()==='guest'){
  tabs.hidden=true;document.getElementById('ntSet').hidden=true;
  el.innerHTML='<div class="empty"><span class="ei">'+IC.bell+'</span><b>Bildirimlerin burada</b><p>Paylaşımını beğenenleri, yeni takipçilerini ve yaklaşan molanı buradan takip et.</p><button type="button" class="btn green" data-giris="login">Giriş yap</button></div>';
}else{
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b){tab=b.dataset.t;show()}});
  el.addEventListener('click',e=>{
    if(e.target.closest('#ntAll')){markNotifs(listNotifs().map(n=>n.id));show();return}
    const f=e.target.closest('.follow');
    if(f){const on=f.getAttribute('aria-pressed')!=='true';f.setAttribute('aria-pressed',on);f.textContent=on?'Takiptesin':'Takip et';return}
    const a=e.target.closest('[data-id]');if(a)markNotifs([a.dataset.id]);
  });
  show();
  /* geri gelince (bfcache) okunanlar güncellensin */
  addEventListener('pageshow',e=>{if(e.persisted)show()});
}
document.getElementById('ntSet').addEventListener('click',()=>toast('Çok yakında.','Tamam',()=>{},3000));
