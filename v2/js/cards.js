/* Kartlar: ürün kartı ve Bağlan bileşenleri (paylaşım, bağlı ürün) */
import { G } from './data.js';
import { STAR, IC } from './icons.js';
import { tl, ttl, sc as scoreBadge } from './ui.js';
import { lvOn, lvPrice } from './level.js';
import { heartBtn } from './favorites.js';
import { ROOT } from './root.js';

/* Görsel ağırlıklı kart: görsel kartın tamamı, yazı görselin üstünde.
   Kartta yalnızca karar için gereken: tür, ad, yer · süre, puan, fiyat.
   Tarihler, vize, ulaşım ve seviye indirimi ürün sayfasında. */
const placeOf=x=>x.a.split(' · ')[0];
/* Otelde tarih zaten seçili hafta sonu; onun yerine pansiyon tipi (kahvaltı dahil …) */
const durOf=x=>x.info||(x.facts&&(x.k==='Otel'?x.facts[1]:x.facts[0]))||'';
const unitOf=u=>u==='kişi başı'?'kişi başı':u;
export function card(x){
  const unit=x.u||'kişi başı',lv=lvOn(x.t);
  return '<article class="vk" style="--g:'+(x.gbg||G[x.g])+'"><span class="type">'+x.k+'</span>'+heartBtn(x.t)
  +'<div class="vk-b"><h3>'+ttl(x.t)+'</h3><p class="vk-s">'+placeOf(x)+(durOf(x)?' · '+durOf(x):'')+'</p>'
  +'<div class="vk-r">'+(x.s&&x.c?'<span class="vk-st">'+STAR+x.s.toFixed(1).replace('.',',')+' <i>('+x.c.toLocaleString('tr-TR')+')</i></span>':'<span class="vk-st new">Yeni</span>')
  +'<span class="vk-p">'+(lv?'<s>'+tl(x.p)+'</s>':'')+'<b>'+tl(lvPrice(x.t,x.p))+'</b><small>'+unitOf(unit)+'</small></span></div></div></article>';
}

/* Veri katmanındaki ürünü (api.js) kart biçimine çevirip çizer */
export const productCard=x=>card({k:x.type,t:x.title,a:x.place,p:x.price,u:x.unit==='kişi başı'?'':x.unit,s:x.score,c:x.count,gbg:x.bg,facts:x.facts,info:x.info});

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
