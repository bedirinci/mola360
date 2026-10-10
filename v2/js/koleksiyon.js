/* Keşfet: arama kartı yatay kayar. Önce arama formu; sola kaydırınca
   ardından seçili sekmenin bütün koleksiyonları gelir (Yurt dışı turları,
   Kültür turları …): Keşfet'teki temalar gibi yana kayan kartlar, üç sıra,
   yalnızca adı yazar (Bedir). Kategori sekmeden gelir, koleksiyon yalnızca
   yer ya da tema ekler (kural 3).

   Bütün sekmelerin kartları arama motorları için sayfanın HTML'inde durur
   (scripts/kategoriler.mjs üretir); burada yalnızca seçili sekmeninki
   gösterilir, sekme değişince o değişir (arama.js onTab).

   Kaydırılabildiği, formun ve kartların birlikte iki kez kısa sola
   kıpırdayıp dönmesiyle gösterilir: her açılışta ve sekme her değiştiğinde
   (Bedir). Kartlara geçilmişse sekme değişince yalnızca kartlar yenilenir;
   dokununca ipucu durur. Hareketi azalt açıksa gösterilmez. */
import { getSearch, TYPES } from './api.js';

const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initCollections(){
  const sx=document.getElementById('sx');
  let cur='';

  /* seçili sekmenin bölümü görünür; sekme değişince yumuşakça gelir ve ipucu yeniden oynar */
  function show(t){if(!TYPES.some(x=>x[0]===t)||t===cur)return;
    const was=cur;let on=null;cur=t;
    sx.querySelectorAll('.koll-g').forEach(g=>{g.hidden=g.dataset.tur!==t;if(!g.hidden)on=g});
    if(was&&on){on.classList.remove('swap');void on.offsetWidth;on.classList.add('swap');nudge(250)}
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
