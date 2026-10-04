/* Ortak kabuk: her sayfada aynı olan parçalar. Alt menü, başlıktaki mesaj sayısı ve zil,
   bildirim (toast) ve sayfa genelindeki dokunma/klavye davranışları.
   Sayfalar ayrı klasörlerde (baglan/, urun/ …); bağlar kök adrese göre kurulur. */
import { unreadChats, unreadNotifs } from './api.js';
import { initGestures, initKeyboardFocus } from './ui.js';

import { ROOT } from './root.js';
import { getLevel } from './level.js';
import { initGuestGate } from './giris.js';
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



const toastHtml='<div class="toast" id="toast" role="status" aria-live="polite"><span></span><button type="button"></button></div>';


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
  const t=document.getElementById('lvlTxt');if(t&&m)t.textContent=l==='kasif'?'Kâşif · 1.240 Molapuan':'Gezgin · 320 Molapuan';
  /* başlıktaki mesaj ikonu: okunmamış sohbet sayısı (misafirde yok) */
  const n=m?unreadChats():0;document.querySelectorAll('[data-mesaj-n]').forEach(x=>{x.textContent=n;x.hidden=!n;
    x.parentElement.setAttribute('aria-label',n?'Mesajlar, '+n+' okunmamış sohbet':'Mesajlar')});
  /* zil: okunmamış bildirim varsa nokta */
  const b=m?unreadNotifs():0;document.querySelectorAll('[data-bildirim-n]').forEach(x=>{x.hidden=!b;
    x.parentElement.setAttribute('aria-label',b?'Bildirimler, '+b+' okunmamış':'Bildirimler')});}

export function renderShell(page,{nav=true}={}){
  const anchor=document.querySelector('script[type="module"]');
  const tpl=document.createElement('template');
  tpl.innerHTML=toastHtml+(nav?navHtml(page):'');
  document.body.insertBefore(tpl.content,anchor);
  if(!nav)document.body.classList.add('no-nav');
  initGestures();
  initKeyboardFocus();
  applyLevel();
  if(nav)initDock(page);
  initGuestGate();
  document.addEventListener('m360:giris',applyLevel);
  initShare();
  /* geri gelince (bfcache) zil ve mesaj sayısı güncellensin */
  addEventListener('pageshow',e=>{if(e.persisted)applyLevel()});
  liveNow();setInterval(liveNow,60000);
  initBack();
}

/* Geri (başlıktaki ok): sitede gezilen sayfaların yolu bu sekmede tutulur
   (sessionStorage), her sayfanın geçmiş kaydına yoldaki sırası (m360i) ve
   tarayıcı geçmişindeki yeri (m360h) yazılır. Sayfanın kendi eklediği
   kayıtlar (çekmece, hikaye, rezervasyon adımı) m360d ile sayılır.
   Geri bir önceki sayfaya döner; o sayfa bu sayfanın kendisi ya da bir
   rezervasyon adımıysa atlanır. Bu sayfa yolda daha önce de açıldıysa
   (deneyim → benzer deneyim → ilk deneyim) ilk açıldığı yerin öncesine
   döner: geri hiçbir sayfayı iki kez göstermez, döngü olmaz. Atlanan
   kayıtlar tarayıcı geçmişinde de atlanır (history.go), yeni kayıt
   eklenmez; telefonun geri tuşu da aynı yolu izler.
   Önceki sayfa yoksa (siteye bu sayfadan girildiyse) bağın adresine gider. */
const YOL='m360-yol',YOLH='m360-yolh',here=()=>location.pathname+location.search;
const readArr=k=>{try{const y=JSON.parse(sessionStorage.getItem(k)||'[]');return Array.isArray(y)?y:[]}catch(e){return[]}};
const readYol=()=>readArr(YOL);
const saveYol=(y,h)=>{try{sessionStorage.setItem(YOL,JSON.stringify(y.slice(-40)));if(h)sessionStorage.setItem(YOLH,JSON.stringify(h.slice(-40)))}catch(e){}};
const skip=u=>u===here()||/\/rezervasyon\//.test(u);
/* tarayıcı geçmişi 50 kayıtta dolar; sonrasında yer bilgisi güvenilmez */
const hNow=()=>history.length<50?history.length-1:null;
function markYol(){
  let y=readYol(),h=readArr(YOLH),s=history.state||{},i=s.m360i;
  if(typeof i==='number'&&i<=y.length){y=y.slice(0,i);h=h.slice(0,i)}
  else{const inside=document.referrer.startsWith(R)&&y.length;i=inside?y.length:0;if(!inside){y=[];h=[]}
    s={...s,m360i:i,m360h:hNow()};history.replaceState(s,'')}
  while(h.length<i)h.push(null);
  y[i]=here();h[i]=typeof s.m360h==='number'?s.m360h:null;saveYol(y,h);
}
/* açık çekmecenin ya da hikayenin geçmiş kaydı: içindeki bağdan başka sayfaya
   gidilirse o kayıt yeni sayfayla değişir; geride boş (ölü) bir adım kalmaz */
const layerOn=()=>{const s=history.state;return !!(s&&(s.m360ov||s.hk))};
function initBack(){
  /* sayfa yeniden yüklendiğinde açık katman kaydında kaldıysa (katman artık
     kapalı) sayfanın kendi kaydına inilir; geri bir kez basılınca boşa gitmez */
  const s=history.state;
  if(layerOn()&&s.m360d>0){history.go(-s.m360d);return}
  markYol();
  addEventListener('pageshow',e=>{if(!e.persisted)return;
    if(layerOn()&&!document.querySelector('.sheet.open,.sv:not([hidden])')&&history.state.m360d>0){history.go(-history.state.m360d);return}
    markYol()});
  addEventListener('pagehide',()=>{const y=readYol(),i=history.state&&history.state.m360i;if(typeof i==='number'&&i<y.length){y[i]=here();saveYol(y)}});
  document.addEventListener('click',e=>{const a=e.target.closest('[data-back]');if(!a||e.defaultPrevented)return;
    const t=backTo(a.href);if(!t)return;
    e.preventDefault();goBack(t)});
  document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||!layerOn()||a.target||a.hasAttribute('download'))return;
    const u=new URL(a.href,location.href);if(u.origin!==location.origin||(u.pathname+u.search===here()&&u.hash))return;
    e.preventDefault();location.replace(u.href)});
}
/* backTo'nun sonucuna göre geri git */
export function goBack(t){if(typeof t.go==='number')history.go(t.go);else if(t.back)history.back();else location.href=t.url}
/* geri okunun yanındaki ad: dönülecek sayfa */
const NAMES={'':'Keşfet',baglan:'Bağlan',planlarim:'Planlarım',profil:'Profil',liste:'Liste',urun:'Deneyim',gonderi:'Gönderi',mesajlar:'Mesajlar',sohbet:'Sohbet',bildirimler:'Bildirimler'};
export function backLabel(fallback){const t=backTo(fallback),u=new URL(t?t.url:fallback,location.href);
  if(!u.href.startsWith(R))return NAMES[''];return NAMES[u.pathname.slice(new URL(R).pathname.length).split('/')[0]]||'Geri'}
/* geri nereye: {go:-n} tarayıcı geçmişinde n kayıt geri; {back:true} bir önceki
   kayıt; {url} o adrese gidilir; null: sitede önceki sayfa yok, bağın kendi adresi */
export function backTo(fallback){
  const s=history.state||{},i=s.m360i;if(typeof i!=='number'||i<1)return null;
  const y=readYol(),h=readArr(YOLH),f=y.indexOf(here());
  let j=(f>=0&&f<i?f:i)-1;while(j>=0&&skip(y[j]))j--;
  if(j<0)return {url:fallback};
  const cur=typeof s.m360h==='number'?s.m360h+(s.m360d||0):null;
  if(cur!==null&&typeof h[j]==='number'&&h[j]<cur)return {go:h[j]-cur,url:y[j]};
  return j===i-1&&!s.m360d?{back:true,url:y[j]}:{url:y[j]};
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
  /* yuvarlak Paylaş: önce Hikaye / Gönderi seçimi */
  document.getElementById('shareBtn').addEventListener('click',e=>{const b=e.currentTarget;import('./paylas.js').then(m=>m.openChooser(b))});
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
