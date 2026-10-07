/* Keşfet: arama kartı yatay kayar. Önce arama formu; sola kaydırınca
   ardından seçili sekmenin bütün koleksiyonları gelir (Yurt dışı turları,
   Kültür turları …): Keşfet'teki temalar gibi yana kayan kartlar, üç sıra,
   yalnızca adı yazar (Bedir). Kategori sekmeden gelir, koleksiyon yalnızca yer ya da
   tema ekler (kural 3). Sekme değişince kartlar da değişir (arama.js onTab).

   Kaydırılabildiği, sayfa açılınca formun ve kartların birlikte iki kez kısa
   sola kıpırdayıp dönmesiyle gösterilir: oturumda bir kez (sessionStorage
   m360-kaydir). Kullanıcı kartı kendisi kaydırdıysa bir daha hiç
   (localStorage m360-kaydir). Hareketi azalt açıksa gösterilmez. */
import { listCollections, getSearch, TYPES } from './api.js';
import { ROOT } from './root.js';
import { esc } from './ui.js';

const K='m360-kaydir';
const has=s=>{try{return !!s.getItem(K)}catch(e){return false}};
const mark=s=>{try{s.setItem(K,'1')}catch(e){}};
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
    /* sekme değişince kartlar yumuşakça yenilenir */
    if(was){g.classList.remove('swap');void g.offsetWidth;g.classList.add('swap')}
  }
  show(TYPES.some(x=>x[0]===getSearch().tur)?getSearch().tur:'tur');

  /* kullanıcı kendisi kaydırınca ipucu durur ve bir daha gösterilmez */
  const stop=()=>sx.classList.remove('nudge');
  ['pointerdown','touchstart','wheel'].forEach(e=>sx.addEventListener(e,stop,{passive:true}));
  sx.addEventListener('scroll',()=>{if(sx.scrollLeft>2){stop();mark(localStorage)}},{passive:true});
  sx.addEventListener('animationend',e=>{if(e.animationName==='sxNudge')stop()});

  /* ipucu: sayfa açıldıktan kısa süre sonra, kart görünürken */
  const nudge=()=>{if(sx.scrollLeft>2||has(localStorage))return;
    const r=sx.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
    mark(sessionStorage);sx.classList.add('nudge')};
  if(!calm()&&!has(localStorage)&&!has(sessionStorage)){
    const later=()=>setTimeout(nudge,700);
    if(document.visibilityState==='visible')later();
    else document.addEventListener('visibilitychange',function v(){if(document.visibilityState!=='visible')return;document.removeEventListener('visibilitychange',v);later()});
  }
  return {show};
}
