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

/* Sayfa genelinde dokunma ve klavye davranışları */
export function initGestures(){
/* Hızlı çift dokunma: aynı aç/kapa düğmesine 350 ms içinde gelen ikinci
   dokunuş yok sayılır (favori ekle-çıkar, açıklama aç-kapa gibi). */
(function(){const son=new WeakMap();
  document.addEventListener('click',e=>{const t=e.target.closest('.heart,#callBtn,.lvb,.tt,.fc,.dm,.tab,#menuBtn,#menuClose,.toast button,a[href="#yakinda"]');if(!t)return;
    const now=Date.now(),prev=son.get(t)||0;son.set(t,now);
    if(now-prev<350){e.preventDefault();e.stopImmediatePropagation();}},true);})();
document.addEventListener('dblclick',e=>{if(e.target.closest('button,a,.vk,.tk,.th,.tt'))e.preventDefault()},{passive:false});

/* Seçilen çip, sekme ya da güven kutusu kenardaki solmada kalmasın */
document.addEventListener('click',e=>{const c=e.target.closest('.fc,.tab');if(!c)return;
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
