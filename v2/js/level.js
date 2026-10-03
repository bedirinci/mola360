/* Seviye indirimi (ÖNERİ): Kâşif %10, Mola Ustası %15. Rozet görünümü kullanıcının seviyesine göre değişir.
   Molapuan önerisi: her 100 TL'ye 1 puan, 1 puan = 1 TL. Seviye indirimi programa katılan üründe. */
import { STAR } from './icons.js';
import { toast } from './ui.js';

const LV=new Set(['Kapadokya Turu','Efes ve Şirince Turu','Göreme Mağara Otel','Sealight Resort','Kordon Spa & Masaj']);
let LEVEL='guest';
export const getLevel=()=>LEVEL;
export const setLevel=v=>{LEVEL=v};
const LVTXT={guest:'Üyelere %15\'e varan indirim',gezgin:'Kâşif\'e %10 indirim',kasif:'Kâşif indirimi %10'};
export const lvOn=t=>LEVEL==='kasif'&&LV.has(t);
export const lvPrice=(t,p)=>lvOn(t)?Math.round(p*.9):p;
export const lvb=(t,cls)=>LV.has(t)?'<button type="button" class="lvb'+(cls?' '+cls:'')+'" aria-label="Seviye indirimi: '+LVTXT[LEVEL]+'. Ayrıntı için dokun">'+STAR+LVTXT[LEVEL]+'</button>':'';

/* rozete dokununca açıklama */
const LVINFO={guest:'Üye ol, rezervasyon yaptıkça seviyen yükselsin: bu üründe Kâşif %10, Mola Ustası %15 indirim alır.',
 gezgin:'24 ayda 3 rezervasyonla Kâşif olursun; bu üründe Kâşif %10, Mola Ustası %15 indirim alır.',
 kasif:'Kâşif olduğun için bu üründe %10 indirim fiyata yansıdı. Mola Ustası %15 indirim alır.'};
export function initLevelInfo(){
document.addEventListener('click',e=>{const b=e.target.closest('.lvb');if(!b)return;e.preventDefault();e.stopPropagation();toast(LVINFO[LEVEL],'Tamam',()=>{},6000)});
}
