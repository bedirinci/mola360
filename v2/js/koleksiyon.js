/* Keşfet: arama kartı yatay kayar. Önce arama formu; sola kaydırınca
   ardından seçili sekmenin bütün koleksiyonları gelir (Yurt dışı turları,
   Kültür turları …): Keşfet'teki temalar gibi yana kayan kartlar, üç sıra,
   yalnızca adı yazar (Bedir). Kategori sekmeden gelir, koleksiyon yalnızca yer ya da
   tema ekler (kural 3). Sekme değişince kartlar da değişir (arama.js onTab).

   Kaydırılabildiği, formun ve kartların birlikte iki kez kısa sola
   kıpırdayıp dönmesiyle gösterilir: her açılışta ve sekme her değiştiğinde
   (Bedir). Kartlara geçilmişse sekme değişince yalnızca kartlar yenilenir;
   dokununca ipucu durur. Hareketi azalt açıksa gösterilmez. */
import { listCollections, getSearch, TYPES } from './api.js';
import { ROOT } from './root.js';
import { esc } from './ui.js';

const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const url=q=>ROOT+'liste/?'+Object.entries(q).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');

export function initCollections(){
  const $=id=>document.getElementById(id),sx=$('sx'),g=$('kollG');
  let cur='';

  /* seçili sekmenin bütün koleksiyonları; deneyimi olmayan zaten gelmez
     (api.listCollections) */
  function show(t){const T=TYPES.find(x=>x[0]===t);if(!T||t===cur)return;
    const was=cur;cur=t;
    $('kollH').textContent=T[1]+' çeşitleri';
    g.innerHTML=listCollections(t).map(c=>'<a class="kl" href="'+url(c.q)+'" style="background:'+c.bg+'"><b>'+esc(c.name)+'</b></a>').join('');
    /* sekme değişince kartlar yumuşakça yenilenir ve ipucu yeniden oynar */
    if(was){g.classList.remove('swap');void g.offsetWidth;g.classList.add('swap');nudge(250)}
  }

  /* ipucu: form görünürken; oynuyorsa baştan. Dokunmak ya da kaydırmak durdurur */
  let tm=0;
  const stop=()=>sx.classList.remove('nudge');
  function nudge(ms){clearTimeout(tm);if(calm())return;
    tm=setTimeout(()=>{if(document.visibilityState!=='visible'||sx.scrollLeft>2)return;
      const r=sx.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
      stop();void sx.offsetWidth;sx.classList.add('nudge')},ms)}
  ['pointerdown','touchstart','wheel','scroll'].forEach(e=>sx.addEventListener(e,stop,{passive:true}));
  sx.addEventListener('animationend',e=>{if(e.animationName==='sxNudge')stop()});

  show(TYPES.some(x=>x[0]===getSearch().tur)?getSearch().tur:'tur');
  /* açılışta: sayfa göründükten kısa süre sonra (arka planda açıldıysa öne gelince) */
  if(document.visibilityState==='visible')nudge(700);
  else document.addEventListener('visibilitychange',function v(){if(document.visibilityState!=='visible')return;document.removeEventListener('visibilitychange',v);nudge(700)});
  return {show};
}
