/* Favoriler: ürün adına göre tek kayıt; aynı ürün sayfada iki yerde olsa da ikisi birlikte değişir.
   Taslakta yalnızca bu tarayıcıda saklanıyor. */
import { esc, toast } from './ui.js';
import { I } from './icons.js';

const FAV=new Set((()=>{try{return JSON.parse(localStorage.getItem('m360-fav')||'[]')}catch(e){return []}})());
/* Favorideki ürün adları, eklenme sırasıyla */
export const favList=()=>[...FAV];
export const isFav=t=>FAV.has(t);
export const heartBtn=t=>{const on=FAV.has(t);return '<button class="heart" type="button" data-fav="'+esc(t)+'" aria-pressed="'+on+'" aria-label="'+esc(t)+(on?' favorilerden çıkar':' favorilere ekle')+'">'+I.heart+'</button>'};
function favSave(){try{localStorage.setItem('m360-fav',JSON.stringify([...FAV]))}catch(e){}}
export function favSync(){
  document.querySelectorAll('.heart[data-fav]').forEach(h=>{const t=h.dataset.fav,on=FAV.has(t);h.setAttribute('aria-pressed',on);h.setAttribute('aria-label',t+(on?' favorilerden çıkar':' favorilere ekle'))});
  const n=FAV.size,bd=document.getElementById('favCount');if(bd){bd.textContent=n;bd.hidden=!n}
}
export function favToggle(t){
  const on=!FAV.has(t);on?FAV.add(t):FAV.delete(t);favSave();favSync();
  document.querySelectorAll('.heart[data-fav]').forEach(h=>{if(h.dataset.fav===t&&on){h.classList.remove('pop');void h.offsetWidth;h.classList.add('pop')}});
  on?toast('Favorilerine eklendi','Geri al',()=>favToggle(t)):toast('Favorilerinden çıkarıldı','Geri al',()=>favToggle(t));
}
export function initFavorites(){
document.addEventListener('click',e=>{const h=e.target.closest('.heart[data-fav]');if(!h)return;e.preventDefault();e.stopPropagation();favToggle(h.dataset.fav)});
}
