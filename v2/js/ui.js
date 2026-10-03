/* Ortak arayüz yardımcıları: biçimlendirme, bildirim (toast), yatay raylar, dokunma ayarları. */
import { chevL, chevR } from './icons.js';
import { ROOT } from './root.js';
import { productUrl } from './api.js';

export const tl=n=>n.toLocaleString('tr-TR')+' TL';
export const word=s=>s>=9.5?'Olağanüstü':s>=9?'Harika':s>=8.5?'Çok iyi':'İyi';
export const sc=(s,c)=>'<span class="score"><b>'+s.toFixed(1).replace('.',',')+'</b>'+word(s)+'</span>';
export const esc=t=>String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
/* Kart başlığı ürün sayfasına bağlanır; bağın ::after'ı kartın tamamını kaplar */
export const ttl=t=>'<a class="lk" href="'+productUrl(ROOT,t)+'" title="'+t.replace(/"/g,'&quot;')+'">'+t+'</a>';
export const scoreOrNew=(s,c)=>s&&c?sc(s,c):'<span class="score new"><b>Yeni</b></span>';

let toastT;
export function toast(msg,act,fn,ms){const el=document.getElementById('toast');el.querySelector('span').textContent=msg;const b=el.querySelector('button');b.textContent=act;b.onclick=()=>{fn();el.classList.remove('show')};
  el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),ms||3500)}

/* kaydırılabilir alanlar: fareyle sürükleme ve oklar */
export function makeScroll(el){
  let down=false,sx=0,sl=0,moved=false;
  el.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;down=true;moved=false;sx=e.clientX;sl=el.scrollLeft});
  window.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>4){moved=true;el.classList.add('drag')}el.scrollLeft=sl-dx});
  window.addEventListener('pointerup',()=>{if(!down)return;down=false;setTimeout(()=>el.classList.remove('drag'),0)});
  el.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
  const ar=document.querySelector('.arrows[data-for="'+el.id+'"]');let pb,nb;
  if(ar){ar.innerHTML='<button class="arr" aria-label="Geri kaydır">'+chevL+'</button><button class="arr" aria-label="İleri kaydır">'+chevR+'</button>';[pb,nb]=ar.children;
    const step=()=>Math.max(160,el.clientWidth*.8);pb.onclick=()=>el.scrollBy({left:-step(),behavior:'smooth'});nb.onclick=()=>el.scrollBy({left:step(),behavior:'smooth'})}
  const upd=()=>{const max=el.scrollWidth-el.clientWidth;
    if(pb){pb.disabled=el.scrollLeft<=2;nb.disabled=el.scrollLeft>=max-2}
    el.classList.toggle('end',el.scrollLeft>=max-2)};
  el.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);upd();
}

/* Geri tuşu açık katmanı (menü, çekmece) kapatır, sayfadan çıkmaz: açılınca
   geçmişe bir adım eklenir, kapanınca o adım geri alınır. Katmanın içindeki
   bir bağ o adımın yerine geçer (leave), geçmişte ölü adım kalmaz. */
export function backLayer(hide){
  let on=false;
  const mine=()=>!!(history.state&&history.state.m360ov);
  addEventListener('popstate',()=>{if(on&&!mine()){on=false;hide()}});
  return {
    push(){if(on)return;on=true;history.pushState({...(history.state||{}),m360ov:1},'')},
    pop(){if(!on)return;on=false;if(mine())history.back()},
    leave(url){hide();if(on&&mine()){on=false;location.replace(url)}else{on=false;location.href=url}}};
}

/* Alttan açılan çekmece: arkası kilitlenir ve dokunulmaz olur, odak içeride
   döner, Esc ya da arkaya dokunmak kapatır, tutamaçtan aşağı çekince kapanır.
   open(açan düğme, odaklanacak öğe); kapanınca odak açan düğmeye döner.
   Geri tuşu da kapatır; bildirim (toast) çekmecenin üstünde ve dokunulur kalır. */
export function makeSheet(sh,bg,{drag=sh}={}){
  let opener=null;
  const behind=()=>[...document.body.children].filter(el=>el!==sh&&el!==bg&&el.id!=='toast'&&el.tagName!=='SCRIPT');
  const exp=v=>{if(opener&&opener.hasAttribute('aria-expanded'))opener.setAttribute('aria-expanded',v)};
  const layer=backLayer(hide);
  function open(from,focus){opener=from||null;layer.push();bg.classList.add('open');sh.classList.add('open');document.body.classList.add('locked');exp('true');behind().forEach(el=>el.inert=true);
    setTimeout(()=>(focus||sh.querySelector('[aria-checked="true"]')||sh.querySelector('button')).focus({preventScroll:true}),60)}
  function hide(){if(!sh.classList.contains('open'))return;sh.style.transform='';bg.style.opacity='';bg.classList.remove('open');sh.classList.remove('open');document.body.classList.remove('locked');
    behind().forEach(el=>el.inert=false);exp('false');if(opener)opener.focus({preventScroll:true})}
  function close(){hide();layer.pop()}
  bg.addEventListener('click',close);
  sh.querySelectorAll('[data-x]').forEach(b=>b.addEventListener('click',close));
  sh.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();return}
    if(e.key!=='Tab')return;const f=[...sh.querySelectorAll('button,input,a[href]')].filter(x=>!x.disabled&&x.getClientRects().length),a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});
  let y0=null,dy=0,t0=0;
  /* sürüklerken karartma parmağı gecikmesiz izler (geçiş kapalı) */
  const reset=()=>{y0=null;sh.classList.remove('drag');bg.classList.remove('drag');sh.style.transform='';bg.style.opacity=''};
  drag.addEventListener('touchstart',e=>{y0=e.touches[0].clientY;dy=0;t0=Date.now();sh.classList.add('drag');bg.classList.add('drag')},{passive:true});
  drag.addEventListener('touchmove',e=>{if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);if(dy>0)e.preventDefault();sh.style.transform='translateY('+dy+'px)';bg.style.opacity=String(Math.max(0,1-dy/sh.offsetHeight))},{passive:false});
  drag.addEventListener('touchend',()=>{if(y0==null)return;const v=dy/Math.max(1,Date.now()-t0);if(dy>sh.offsetHeight*.3||(dy>30&&v>.5)){y0=null;sh.classList.remove('drag');bg.classList.remove('drag');close()}else reset()});
  drag.addEventListener('touchcancel',reset);
  /* çekmecedeki bir bağdan başka sayfaya geçiş */
  return {open,close,go:url=>layer.leave(url)};
}

/* Sayfa genelinde dokunma ve klavye davranışları */
export function initGestures(){
/* Hızlı çift dokunma: aynı aç/kapa düğmesine 350 ms içinde gelen ikinci
   dokunuş yok sayılır (favori ekle-çıkar, açıklama aç-kapa gibi). */
(function(){const son=new WeakMap();
  document.addEventListener('click',e=>{const t=e.target.closest('.heart,[data-fav],#callBtn,.lvb,.tt,.fc,.dm,.tab,#menuBtn,#menuClose,.toast button,a[href="#yakinda"]');if(!t)return;
    const now=Date.now(),prev=son.get(t)||0;son.set(t,now);
    if(now-prev<350){e.preventDefault();e.stopImmediatePropagation();}},true);})();
document.addEventListener('dblclick',e=>{if(e.target.closest('button,a,.vk,.tk,.th,.tt'))e.preventDefault()},{passive:false});

/* Seçilen çip, sekme ya da güven kutusu kenardaki solmada kalmasın */
document.addEventListener('click',e=>{const c=e.target.closest('.fc,.tab');if(!c||!c.isConnected)return;
  const sc=c.parentElement,r=c.getBoundingClientRect(),R=sc.getBoundingClientRect(),pad=48;
  if(r.right>R.right-pad)sc.scrollBy({left:r.right-R.right+pad,behavior:'smooth'});
  else if(r.left<R.left+16)sc.scrollBy({left:r.left-R.left-16,behavior:'smooth'});});

/* Yeni sitede henüz yapılmamış sayfalar */
document.addEventListener('click',e=>{const a=e.target.closest('a[href="#yakinda"]');if(!a)return;e.preventDefault();
  toast('Bu sayfa yeni mola360\'ta hazırlanıyor.','Tamam',()=>{},4000)});
}

/* Klavyeyle gezinirken odak çerçevesi görünsün, dokunurken görünmesin */
export function initKeyboardFocus(){
document.addEventListener('keydown',e=>{if(e.key==='Tab')document.documentElement.classList.add('kb')});
document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('kb'));
}
