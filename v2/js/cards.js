/* Kartlar: ortak ürün kartı ve ulaşım etiketi */
import { G } from './data.js';
import { I, TRI } from './icons.js';
import { tl, ttl, scoreOrNew } from './ui.js';
import { lvOn, lvPrice, lvb } from './level.js';
import { heartBtn } from './favorites.js';
import { IC } from './icons.js';
import { ROOT } from './root.js';
import { sc as scoreBadge } from './ui.js';

/* Ulaşım etiketi: görselin sol üstünde, tür etiketinin yanında */
export const trTag=k=>k?'<span class="tag tr-tag"><svg viewBox="0 0 24 24" aria-hidden="true">'+TRI[k][1]+'</svg>'+TRI[k][0]+'</span>':'';

/* Tek kart düzeni: görsel (tür + favori) · başlık · konum · bilgi satırı · alt satırda puan solda, fiyat sağda */
export function card(x){
  const row=x.dates
    ?'<div class="lbl">YAKLAŞAN KALKIŞLAR</div><div class="dates" data-fit data-base="'+parseInt(x.more)+'">'+x.dates.map((d,i)=>'<span class="d'+(i?'':' first')+'">'+d[0]+'<b>'+d[1]+'</b></span>').join('')+'<span class="d more">'+x.more+'</span></div>'
    :'<div class="lbl">ÖNE ÇIKANLAR</div><div class="dates" data-fit>'+x.facts.map(f=>'<span class="f">'+f+'</span>').join('')+'</div>';
  return '<article class="cd"><div class="ph" style="--g:'+(x.gbg||G[x.g])+'"><div class="tags"><span class="type">'+x.k+'</span>'+trTag(x.tr)+'</div>'+lvb(x.t)
  +''+heartBtn(x.t)+'</div>'
  +'<div class="bd"><h3>'+ttl(x.t)+'</h3><div class="meta">'+I.pin+'<span>'+x.a+'</span></div>'
  +(x.info?'<div class="info"><span class="it">'+x.info+'</span>'+(x.visa?'<span class="visa'+(x.visaReq?' req':'')+'">'+x.visa+'</span>':'')+'</div>':'')
  +'<div class="dep">'+row+'</div>'
  +'<div class="pr">'+scoreOrNew(x.s,x.c)+'<div class="price">'+(lvOn(x.t)?'<span class="old">'+tl(x.p)+'</span>':(x.old?'<span class="old">'+tl(x.old)+'</span>':''))
  +'<span class="unit">'+(x.u||'kişi başı')+'</span><span class="now">'+tl(lvPrice(x.t,x.p))+'</span>'+'</div></div></div></article>';
}

/* Veri katmanındaki ürünü (api.js) kart biçimine çevirip çizer */
export const productCard=x=>card({k:x.type,t:x.title,a:x.place,p:x.price,old:x.old,u:x.unit==='kişi başı'?'':x.unit,s:x.score,c:x.count,gbg:x.bg,
  facts:x.facts,dates:x.dates.length?x.dates:null,more:x.more,info:x.info,tr:x.tr,visa:x.visa});

/* ---- Bağlan bileşenleri ---- */

const ava=(u,cls)=>'<span class="ava'+(cls?' '+cls:'')+'" style="--c:'+u.renk+'" aria-hidden="true">'+u.ini+'</span>';
export { ava };

/* Paylaşıma bağlı ürün: puan, fiyat ve "Deneyimi keşfet" */
export function plink(p){
  if(!p)return '';
  return '<div class="plink"><span class="pt" style="background:'+p.bg+'"></span><div class="x"><small>BAĞLI DENEYİM · '+p.type.toLocaleUpperCase('tr')+'</small>'
   +'<b><a href="'+ROOT+'urun/?id='+p.id+'">'+p.title+'</a></b><div class="pm">'+(p.count?scoreBadge(p.score):'')+'<span><strong>'+tl(p.price)+'</strong> '+p.unit+'</span></div></div>'
   +'<span class="go-p">Keşfet'+IC.right+'</span></div>';
}

/* Akıştaki paylaşım kartı */
export function postCard(x){
  const u=x.user;
  return '<article class="post" data-post="'+x.id+'">'
   +'<div class="post-hd">'+ava(u)+'<div class="x"><b>'+u.ad+'</b><small>@'+u.kul+' · '+x.place+' · '+x.when+'</small></div><button type="button" class="follow" aria-pressed="false">Takip et</button></div>'
   +'<div class="media" style="background:'+x.bg+'"><span class="ornek">ÖRNEK</span>'+(x.verified?'<span class="went">'+IC.check+'Mola360 ile gitti</span>':'')+'</div>'
   +'<div class="acts-row"><button type="button" class="act like" aria-pressed="false" aria-label="Beğen">'+IC.heart+'<span>'+x.likes+'</span></button>'
   +'<button type="button" class="act" aria-label="Yorumlar" data-soon>'+IC.comment+'<span>'+x.comments+'</span></button>'
   +'<button type="button" class="act" aria-label="Paylaş" data-share>'+IC.share+'</button>'
   +'<button type="button" class="act save" aria-pressed="false" aria-label="Kaydet">'+IC.save+'</button></div>'
   +'<p class="txt"><b>'+u.kul+'</b>'+x.text+'</p>'
   +plink(x.product)+'</article>';
}

/* Rayda küçük paylaşım kartı (Keşfet ve ürün sayfası) */
export function postMini(x){
  const u=x.user,p=x.product;
  return '<article class="pmini" style="background:'+x.bg+'"><div class="who">'+ava(u,'s')+'<span>@'+u.kul+'</span></div>'
   +'<div><p>'+x.text+'</p>'+(p?'<div class="tagp">'+IC.check+'<span>'+p.title+'</span></div>':'')+'</div>'
   +'<a class="lk2" href="'+ROOT+'baglan/#'+x.id+'" aria-label="'+u.kul+' paylaşımını aç"></a></article>';
}

/* Beğen, kaydet, takip et: taslakta yalnızca ekranda değişir */
export function initPostActions(toast){
  document.addEventListener('click',e=>{
    const b=e.target.closest('.act.like,.act.save,.follow');
    if(b){const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);
      if(b.classList.contains('like')){const n=b.querySelector('span');n.textContent=+n.textContent+(on?1:-1)}
      if(b.classList.contains('follow'))b.textContent=on?'Takiptesin':'Takip et';
      if(b.classList.contains('save'))toast(on?'Paylaşım kaydedildi':'Kayıttan çıkarıldı','Tamam',()=>{},2500);
      return}
    const s=e.target.closest('[data-share]');
    if(s){const url=location.href;if(navigator.share){navigator.share({title:'mola360',url}).catch(()=>{})}else toast('Paylaşım bağlantısı hazırlanıyor.','Tamam',()=>{},3000);return}
    if(e.target.closest('[data-soon]'))toast('Yorumlar yeni mola360\'ta hazırlanıyor.','Tamam',()=>{},3000);
  });
}
