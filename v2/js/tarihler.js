/* Tarih seçimi: sayfada ilk üç tarih ve "Tüm tarihler"; düğme alttan
   çekmece açar, tarihler aylara bölünmüş dörtlü ızgarada durur. Çekmeceden
   sonraki bir tarih seçilirse sayfada üçüncü yerde o görünür.
   Ürün sayfası ve rezervasyon (otel giriş günü) birlikte kullanır. */
import { makeSheet } from './ui.js';
import { IC } from './icons.js';

const AY={Oca:'Ocak',Şub:'Şubat',Mar:'Mart',Nis:'Nisan',May:'Mayıs',Haz:'Haziran',Tem:'Temmuz',Ağu:'Ağustos',Eyl:'Eylül',Eki:'Ekim',Kas:'Kasım',Ara:'Aralık'};
export const dKey=x=>x[0]+' '+x[1];
const dBtn=(x,picked)=>'<button type="button" role="radio" aria-checked="'+(dKey(x)===picked)+'" data-gun="'+dKey(x)+'"><small>'+x[0]+'</small><b>'+x[1]+'</b></button>';

export function dateGrid(ds,picked){let show=ds.slice(0,3);const at=ds.find(x=>dKey(x)===picked);if(at&&!show.includes(at))show=[ds[0],ds[1],at];
  return show.map(x=>dBtn(x,picked)).join('')+(ds.length>3?'<button type="button" class="more-d" data-all-d aria-haspopup="dialog" aria-expanded="false">'+IC.calendar+'<span>Tüm tarihler</span></button>':'')}

let sh=null,onPick=null;
/* what: "kalkış tarihi" ya da "giriş günü" (çekmecedeki sayı satırı) */
export function openDates(ds,picked,pick,from,what){
  onPick=pick;
  if(!sh){document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="udBg"></div><div class="sheet pl-sh" id="udSheet" role="dialog" aria-modal="true" aria-labelledby="udTtl">'
     +'<div class="pl-top"><div class="sh-grab"></div><div class="sh-hd"><h3 id="udTtl">Tüm tarihler</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div></div><div class="pl-in"></div></div>');
    const el=document.getElementById('udSheet');sh=makeSheet(el,document.getElementById('udBg'),{drag:el.querySelector('.pl-top')});
    el.addEventListener('click',e=>{const d=e.target.closest('[data-gun]');if(d){onPick(d.dataset.gun);sh.close()}})}
  const by=[];ds.forEach(x=>{const m=AY[x[1].split(' ')[1]]||'';const g=by.find(b=>b[0]===m);g?g[1].push(x):by.push([m,[x]])});
  const inn=document.querySelector('#udSheet .pl-in');
  inn.innerHTML='<p class="u-dn">'+ds.length+' '+(what||'kalkış tarihi')+'</p>'
    +by.map(([m,l])=>'<h4 class="u-dm">'+m+'</h4><div class="u-dates u-dall" role="radiogroup" aria-label="'+m+'">'+l.map(x=>dBtn(x,picked)).join('')+'</div>').join('');
  inn.scrollTop=0;sh.open(from)}
