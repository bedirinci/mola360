/* Kartlar: ortak ürün kartı ve ulaşım etiketi */
import { G } from './data.js';
import { I, TRI } from './icons.js';
import { tl, ttl, scoreOrNew } from './ui.js';
import { lvOn, lvPrice, lvb } from './level.js';
import { heartBtn } from './favorites.js';

/* Ulaşım etiketi: görselin sol üstünde, tür etiketinin yanında */
export const trTag=k=>k?'<span class="tag tr-tag"><svg viewBox="0 0 24 24" aria-hidden="true">'+TRI[k][1]+'</svg>'+TRI[k][0]+'</span>':'';

/* Tek kart düzeni: görsel (tür + favori) · başlık · konum · bilgi satırı · alt satırda puan solda, fiyat sağda */
export function card(x){
  const row=x.dates
    ?'<div class="lbl">YAKLAŞAN KALKIŞLAR</div><div class="dates" data-fit data-base="'+parseInt(x.more)+'">'+x.dates.map((d,i)=>'<span class="d'+(i?'':' first')+'">'+d[0]+'<b>'+d[1]+'</b></span>').join('')+'<span class="d more">'+x.more+'</span></div>'
    :'<div class="lbl">ÖNE ÇIKANLAR</div><div class="dates" data-fit>'+x.facts.map(f=>'<span class="f">'+f+'</span>').join('')+'</div>';
  return '<article class="cd"><div class="ph" style="--g:'+G[x.g]+'"><div class="tags"><span class="type">'+x.k+'</span>'+trTag(x.tr)+'</div>'+lvb(x.t)
  +''+heartBtn(x.t)+'</div>'
  +'<div class="bd"><h3>'+ttl(x.t)+'</h3><div class="meta">'+I.pin+'<span>'+x.a+'</span></div>'
  +(x.info?'<div class="info"><span class="it">'+x.info+'</span>'+(x.visa?'<span class="visa'+(x.visaReq?' req':'')+'">'+x.visa+'</span>':'')+'</div>':'')
  +'<div class="dep">'+row+'</div>'
  +'<div class="pr">'+scoreOrNew(x.s,x.c)+'<div class="price">'+(lvOn(x.t)?'<span class="old">'+tl(x.p)+'</span>':(x.old?'<span class="old">'+tl(x.old)+'</span>':''))
  +'<span class="unit">'+(x.u||'kişi başı')+'</span><span class="now">'+tl(lvPrice(x.t,x.p))+'</span>'+'</div></div></div></article>';
}
