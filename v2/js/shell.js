/* Ortak kabuk: her sayfada aynı olan parçalar. Tam ekran menü, alt menü,
   bildirim (toast) ve sayfa genelindeki dokunma/klavye davranışları.
   Sayfalar ayrı klasörlerde (baglan/, urun/ …); bağlar kök adrese göre kurulur. */
import { MENU } from './data.js';
import { listThemes } from './api.js';
import { I } from './icons.js';
import { initGestures, initKeyboardFocus, backLayer, toast } from './ui.js';

import { ROOT } from './root.js';
import { getLevel } from './level.js';
export { ROOT };
const R=ROOT;

/* Alt menü: iki kalp (Keşfet, Bağlan) + kullanıcının alanı. Arama menüde
   yok, Keşfet'in en üstünde; Keşfet'teyken Keşfet'e yeniden dokunmak oraya
   götürür. Yanındaki yuvarlak düğme Bağlan'a paylaşım ekler (paylas.js). */
/* İkonlarda .f seçili sekmede dolar, .w dolgunun üstünde beyaz çizilir */
const NAV=[
 ['kesfet','','Keşfet','<circle class="f" cx="12" cy="12" r="9"/><path class="w wf" d="m15.5 8.5-2 5-5 2 2-5z"/>'],
 ['baglan','baglan/','Bağlan','<circle class="f" cx="9" cy="8" r="3.5"/><path class="f" d="M2.5 20a6.5 6.5 0 0 1 13 0z"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 13.6a6.5 6.5 0 0 1 3.5 6.4"/>'],
 ['planlarim','planlarim/','Planlarım','<rect class="f" x="3" y="5" width="18" height="16" rx="2"/><path class="w" d="M3 10h18"/><path d="M8 3v4M16 3v4"/><path class="w" d="m9 15 2 2 4-4"/>'],
 ['profil','profil/','Profil','<circle class="f" cx="12" cy="8" r="4"/><path class="f" d="M4 21a8 8 0 0 1 16 0z"/>']];

const navHtml=page=>'<div class="dock" id="dock"><nav class="nav" aria-label="Alt menü">'+NAV.map(n=>'<a href="'+R+n[1]+'" data-nav="'+n[0]+'"'+(n[0]===page?' aria-current="page"':'')+'><svg viewBox="0 0 24 24" aria-hidden="true">'+n[3]+'</svg><span>'+n[2]+'</span></a>').join('')+'</nav>'
 +'<button type="button" class="dock-add" id="shareBtn" aria-label="Paylaş" aria-haspopup="dialog" aria-expanded="false"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></i></button></div>';

const menuHtml=`<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menü">
  <div class="m-bar">
    <a class="logo" href="${R}" aria-label="mola360 anasayfa"><img src="${R}logo.webp" alt="mola360" width="97" height="40"></a>
    <div class="bar-i">
      <button class="ib" aria-label="Bildirimler"><svg viewBox="0 0 24 24"><path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/></svg><span class="dot"></span></button>
      <button class="ib" id="menuClose" aria-label="Menüyü kapat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
  </div>
  <div class="m-body">
    <div class="m-top">
    <div class="m-user" data-guest>
      <div class="av"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>
      <div class="x"><b>Hoş geldin</b><span>İlk rezervasyonda %15 indirim</span></div>
      <a href="#yakinda" class="btn">Giriş yap</a>
    </div>
    <div class="m-user" data-member hidden>
      <div class="av ini">AY</div>
      <div class="x"><b>Merhaba, Ayşe</b><span class="lvl"><svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/></svg><em id="lvlTxt">Kâşif · 1.240 Molapuan</em></span></div>
      <a href="${R}profil/" class="btn">Hesabım</a>
    </div>
    </div>

    <div class="m-rest" id="mRest">
    <nav class="m-main" aria-label="Ürünler" id="mMain"></nav>

    <div class="m-h">NE KADAR VAKTİN VAR?</div>
    <div class="chips">
      <a href="${R}liste/?sure=saat" class="chip">Birkaç saat</a><a href="${R}liste/?sure=gun" class="chip">Bir gün</a><a href="${R}liste/?sure=hs" class="chip">Hafta sonu</a><a href="${R}liste/?sure=uzun" class="chip">4 gün +</a>
    </div>

    <div class="m-h">TEMALAR</div>
    <div class="m-themes">${listThemes().map(t=>'<a href="'+R+'liste/?tema='+t.id+'" class="m-theme"><b>'+t.name+'</b></a>').join('')}</div>

    <div class="m-h">BÖLGELER</div>
    <div class="chips"><a href="#yakinda" class="chip">Marmara</a><a href="#yakinda" class="chip">Ege</a><a href="#yakinda" class="chip">Akdeniz</a><a href="#yakinda" class="chip">Karadeniz</a><a href="#yakinda" class="chip">İç Anadolu</a><a href="#yakinda" class="chip">Doğu Anadolu</a><a href="#yakinda" class="chip">Güneydoğu</a><a href="#yakinda" class="chip">Yurt dışı</a></div>

    <div data-member hidden>
      <div class="m-h">HESABIM</div>
      <div class="m-grid">
        <a href="${R}planlarim/#yaklasan" class="m-tile"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2"/></svg>Rezervasyonlarım</a>
        <a href="${R}planlarim/#favoriler" class="m-tile"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Favorilerim</a>
        <a href="#yakinda" class="m-tile"><svg viewBox="0 0 24 24"><path d="M4 9V6h16v3a3 3 0 0 0 0 6v3H4v-3a3 3 0 0 0 0-6zM10 6v12"/></svg>Kuponlarım</a>
        <a href="${R}profil/" class="m-tile"><img src="${R}img/molapuan.webp" alt="" width="20" height="20">Molapuanlarım</a>
      </div>
    </div>

    <div class="m-h">YARDIM</div>
    <div class="m-contact">
      <div><span class="hours">Her gün 09:00 – 23:59<i class="live" data-live><em></em><span data-live-t>Çevrimiçi</span></i></span><b>0850 000 00 00</b></div>
      <a href="https://wa.me/900000000000" target="_blank" rel="noopener" class="btn wa"><svg class="wa-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>WhatsApp<em class="wa-dot" data-live-dot aria-hidden="true"></em></a>
    </div>
    <div class="chips">
      <a href="#yakinda" class="chip">Yardım merkezi</a><a href="#yakinda" class="chip">Sıkça sorulan sorular</a><a href="#yakinda" class="chip">İptal ve iade</a>
    </div>

    <div class="m-foot">
      <div class="lang">
        <label class="sel"><span class="sr">Dil</span><select id="langSel" aria-label="Dil"><option>Türkçe</option><option>English</option><option>Deutsch</option><option>Русский</option></select></label>
        <label class="sel"><span class="sr">Para birimi</span><select id="curSel" aria-label="Para birimi"><option>₺ TL</option><option>€ EUR</option><option>$ USD</option><option>£ GBP</option></select></label>
      </div>
      <span class="copy">© 2026 Mola360. Tüm hakları saklıdır.</span>
    </div>
    </div>
  </div>
</div>`;

const toastHtml='<div class="toast" id="toast" role="status" aria-live="polite"><span></span><button type="button"></button></div>';

/* Menüdeki ürün türleri listeye gider (Fırsatlar henüz yok) */
const menuLink=m=>m[1]==='firsat'?'#yakinda':R+'liste/?tur='+m[1];

/* çevrimiçi göstergesi: İstanbul saatiyle 09:00 – 23:59 */
export function isLive(){
  let h;try{h=+new Intl.DateTimeFormat('en-GB',{hour:'numeric',hourCycle:'h23',timeZone:'Europe/Istanbul'}).format(new Date())}catch(e){h=new Date().getHours()}
  return h>=9&&h<24;
}
function liveNow(){const on=isLive();
  document.querySelectorAll('[data-live]').forEach(x=>{x.classList.toggle('off',!on);x.querySelector('[data-live-t]').textContent=on?'Çevrimiçi':'Çevrimdışı · 09:00\'da'});
  document.querySelectorAll('[data-live-dot]').forEach(x=>x.classList.toggle('off',!on));
}

/* page: alt menüde seçili sekme. nav:false → alt menü yok (ürün sayfasındaki gibi kendi alt çubuğu olan sayfalar) */
/* menüde üye ya da misafir bölümü, oturumdaki kullanıcıya göre */
export function applyLevel(){const l=getLevel(),m=l!=='guest';
  document.querySelectorAll('[data-member]').forEach(x=>x.hidden=!m);document.querySelectorAll('[data-guest]').forEach(x=>x.hidden=m);
  const t=document.getElementById('lvlTxt');if(t&&m)t.textContent=l==='kasif'?'Kâşif · 1.240 Molapuan':'Gezgin · 320 Molapuan';}

export function renderShell(page,{nav=true}={}){
  const anchor=document.querySelector('script[type="module"]');
  const tpl=document.createElement('template');
  tpl.innerHTML=toastHtml+(nav?navHtml(page):'')+menuHtml;
  document.body.insertBefore(tpl.content,anchor);
  if(!nav)document.body.classList.add('no-nav');
  initGestures();
  initKeyboardFocus();
  initMenu();
  applyLevel();
  if(nav)initDock(page);
  initShare();
  /* bildirimler henüz yok */
  document.addEventListener('click',e=>{if(e.target.closest('.ib[aria-label="Bildirimler"]'))toast('Yeni bildirimin yok.','Tamam',()=>{},3000)});
  liveNow();setInterval(liveNow,60000);
  initBack();
}

/* Geri (başlıktaki ok): sitede gezilen sayfaların yolu bu sekmede tutulur
   (sessionStorage), her sayfanın geçmiş kaydına sırası yazılır (m360i).
   Geri bir önceki sayfaya döner; o sayfa bu sayfanın kendisi ya da bir
   rezervasyon adımıysa (ürün → rezervasyon → ürün döngüsü) atlanır.
   Önceki sayfa yoksa (siteye bu sayfadan girildiyse) bağın adresine gider. */
const YOL='m360-yol',here=()=>location.pathname+location.search;
const readYol=()=>{try{const y=JSON.parse(sessionStorage.getItem(YOL)||'[]');return Array.isArray(y)?y:[]}catch(e){return[]}};
const saveYol=y=>{try{sessionStorage.setItem(YOL,JSON.stringify(y.slice(-40)))}catch(e){}};
const skip=u=>u===here()||/\/rezervasyon\//.test(u);
function markYol(){
  let y=readYol(),i=history.state&&history.state.m360i;
  if(typeof i==='number'&&i<=y.length){y=y.slice(0,i);}
  else{const inside=document.referrer.startsWith(R)&&y.length;i=inside?y.length:0;if(!inside)y=[];
    history.replaceState({...(history.state||{}),m360i:i},'')}
  y[i]=here();saveYol(y);
}
function initBack(){
  markYol();
  addEventListener('pageshow',e=>{if(e.persisted)markYol()});
  addEventListener('pagehide',()=>{const y=readYol(),i=history.state&&history.state.m360i;if(typeof i==='number'&&i<y.length){y[i]=here();saveYol(y)}});
  document.addEventListener('click',e=>{const a=e.target.closest('[data-back]');if(!a||e.defaultPrevented)return;
    const t=backTo(a.href);if(!t)return;
    e.preventDefault();
    if(t.back)history.back();else location.href=t.url});
}
/* geri okunun yanındaki ad: dönülecek sayfa */
const NAMES={'':'Keşfet',baglan:'Bağlan',planlarim:'Planlarım',profil:'Profil',liste:'Liste',urun:'Deneyim'};
export function backLabel(fallback){const t=backTo(fallback),u=new URL(t?t.url:fallback,location.href);
  if(!u.href.startsWith(R))return NAMES[''];return NAMES[u.pathname.slice(new URL(R).pathname.length).split('/')[0]]||'Geri'}
/* geri nereye: {back:true} bir önceki sayfa tarayıcı geçmişinde hemen arkada;
   {url} o adrese gidilir; null: sitede önceki sayfa yok, bağın kendi adresi */
export function backTo(fallback){
  const y=readYol(),i=history.state&&history.state.m360i;if(typeof i!=='number'||i<1)return null;
  let j=i-1;while(j>=0&&skip(y[j]))j--;
  return j===i-1?{back:true,url:y[j]}:{url:j>=0?y[j]:fallback};
}

/* Yüzen alt menü: aşağı kaydırınca küçülür (yalnızca ikonlar), yukarı
   kaydırınca ya da sayfanın başına gelince geri açılır. */
function initDock(page){
  const dock=document.getElementById('dock'),body=document.body;
  let last=scrollY,acc=0;
  const set=on=>body.classList.toggle('nav-min',on);
  addEventListener('scroll',()=>{const y=scrollY,d=y-last;last=y;
    if(y<80){acc=0;set(false);return}
    if(d&&(d>0)!==(acc>0))acc=0;acc+=d;
    if(acc>24)set(true);else if(acc<-24)set(false)},{passive:true});
  /* klavyeyle menüye gelince açık dursun */
  dock.addEventListener('focusin',()=>set(false));
  /* Keşfet'teyken Keşfet: başa dön ve aramayı aç */
  const f1=document.getElementById('f1');
  if(page==='kesfet'&&f1)dock.querySelector('[data-nav="kesfet"]').addEventListener('click',e=>{e.preventDefault();
    const smooth=!matchMedia('(prefers-reduced-motion: reduce)').matches&&scrollY>8;
    scrollTo({top:0,behavior:smooth?'smooth':'auto'});setTimeout(()=>f1.click(),smooth?380:0)});
  document.getElementById('shareBtn').addEventListener('click',e=>openShare(e.currentTarget));
}

/* Paylaş çekmecesi (paylas.js) ilk açılışta yüklenir. Her sayfadan açılır:
   alt menüdeki düğme, data-paylas="ürün id" taşıyan bir öğe ya da adresteki
   ?paylas=ürün id (o deneyim seçili gelir). */
export const openShare=(from,opts)=>import('./paylas.js').then(m=>m.openShare(from,opts));
function initShare(){
  document.addEventListener('click',e=>{const b=e.target.closest('[data-paylas]');if(b){e.preventDefault();openShare(b,{productId:b.dataset.paylas})}});
  const u=new URL(location.href),id=u.searchParams.get('paylas');
  if(id!==null){u.searchParams.delete('paylas');history.replaceState(history.state,'',u.pathname+u.search+u.hash);openShare(null,{productId:id})}
}

function initMenu(){
document.getElementById('mMain').innerHTML=MENU.map(m=>'<a href="'+menuLink(m)+'" class="m-link"><span class="ico"><img src="'+R+'m-'+m[1]+'.webp" alt="" width="30" height="30" decoding="async"></span><b>'+m[0]+'</b><em>'+m[2]+'</em>'+I.chev+'</a>').join('');
const menu=document.getElementById('menu'),btn=document.getElementById('menuBtn');
const behind=()=>[...document.body.children].filter(el=>el!==menu&&el.id!=='toast'&&el.tagName!=='SCRIPT');
/* geri tuşu menüyü kapatır (ui.js backLayer) */
const layer=backLayer(hideM);
function openM(){menu.classList.add('open');document.body.classList.add('locked');btn.setAttribute('aria-expanded','true');behind().forEach(el=>el.inert=true);layer.push();setTimeout(()=>document.getElementById('menuClose').focus(),50)}
function hideM(){if(!menu.classList.contains('open'))return;menu.classList.remove('open');document.body.classList.remove('locked');btn.setAttribute('aria-expanded','false');behind().forEach(el=>el.inert=false);btn.focus({preventScroll:true})}
function closeM(){hideM();layer.pop()}
menu.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const f=[...menu.querySelectorAll('a,button,select')].filter(x=>x.offsetParent);const a=f[0],z=f[f.length-1];
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});
/* menüdeki bağ: menünün geçmiş adımının yerine geçer (yeni sekmede açılanlar ve "yakında" bağları hariç) */
menu.addEventListener('click',e=>{const l=e.target.closest('a');if(!l)return;const h=l.getAttribute('href');
  if(h==='#')e.preventDefault();
  if(e.defaultPrevented||l.target==='_blank'||h.startsWith('#')){closeM();return}
  e.preventDefault();layer.leave(l.href)});
btn.addEventListener('click',openM);
(()=>{const mb=menu.querySelector('.m-body'),rest=document.getElementById('mRest');let sy=null,pull=0;
  const back=()=>{if(sy==null&&!pull)return;sy=null;pull=0;rest.style.transition='transform .32s cubic-bezier(.2,.8,.2,1)';rest.style.transform=''};
  mb.addEventListener('touchstart',e=>{sy=mb.scrollTop<=0?e.touches[0].clientY:null;rest.style.transition='none'},{passive:true});
  mb.addEventListener('touchmove',e=>{if(sy==null)return;const dy=e.touches[0].clientY-sy;
    if(dy>0&&mb.scrollTop<=0){e.preventDefault();pull=Math.min(140,dy*.45);rest.style.transform='translateY('+pull+'px)'}
    else if(pull){pull=0;rest.style.transform='';sy=null}},{passive:false});
  mb.addEventListener('touchend',back);mb.addEventListener('touchcancel',back);})();document.getElementById('menuClose').addEventListener('click',closeM);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open'))closeM()});
if(location.hash==='#menu')openM();
}
