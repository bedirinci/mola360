/* Ürün (deneyim) sayfası: tek şablon, ürün adresteki ?id= ile seçilir */
import { renderShell } from './shell.js';
import { getProduct, listProducts, listPosts, typeKey, markViewed, productDetails, bookingSpec, cancelBy, firstDateIn, getSearch } from './api.js';
import { productCard, postMini, initPostActions } from './cards.js';
import { tl, sc, word, toast, makeScroll, esc } from './ui.js';
import { isFav, initFavorites, favSync } from './favorites.js';
import { initLevelInfo, lvb } from './level.js';
import { renderHelp } from './help.js';
import { TRUST } from './data.js';
import { IC, I, TRI } from './icons.js';
import { ROOT } from './root.js';

const id=new URLSearchParams(location.search).get('id');
const p=getProduct(id);

if(p)render(p);
else{
  document.getElementById('urun').innerHTML='<header class="pg-top slim"><div class="bar"><div class="bar-l"><a class="ib back" href="'+ROOT+'" data-back aria-label="Geri">'+IC.back+'</a></div><div class="bar-i"><button class="ib" id="menuBtn" aria-label="Menüyü aç" aria-expanded="false" aria-controls="menu">'+IC.menu+'</button></div></div><h1>Deneyim bulunamadı</h1></header>'
   +'<div class="empty"><b>Bu deneyim artık yok ya da adres yanlış</b><p>Benzerlerini Keşfet\'te bulabilirsin.</p><a class="btn" href="'+ROOT+'">Keşfet\'e dön</a></div>';
  document.getElementById('ctaBar').remove();
  renderShell('kesfet');
}

function render(p){
document.title='mola360 — '+p.title;
markViewed(p.id);

const tick=(b,t)=>'<li>'+IC.check+'<div><b>'+b+'</b>'+(t?' <span>'+t+'</span>':'')+'</div></li>';
const NO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const info=productDetails(p),S=bookingSpec(p);
/* program uzunsa ilk üç adım, gerisi "tamamını gör" ile */
const cut=info.program.length>4;
const unitOf=k=>/gün$/.test(k)?'gün':'adım';
/* Keşfet'teki aramada seçilen tarih penceresindeki ilk kalkış hazır seçili gelir */
/* seçilen tarih bu sayfanın geçmiş kaydında durur: rezervasyondan geri dönünce seçim kaybolmaz */
const kept=history.state&&history.state.tarih;
let picked=kept&&p.dates.some(x=>x[0]+' '+x[1]===kept)?kept:firstDateIn(p,getSearch().tarih);
const posts=listPosts({productId:p.id});
const similar=listProducts({type:typeKey(p.type)}).filter(x=>x.id!==p.id).slice(0,6);
const chips=[p.info,p.tr&&TRI[p.tr][0],p.visa,...p.facts].filter(Boolean);
const deposit=p.type==='Tur'?Math.round(p.price*.2):0;

document.getElementById('urun').innerHTML=
 '<div class="ug" style="background:'+p.bg+'">'
 +'<div class="ug-top"><a class="cb" href="'+ROOT+'" data-back aria-label="Geri">'+IC.back+'</a><span class="sp"></span>'
 +'<button type="button" class="cb" data-share aria-label="Paylaş">'+IC.share+'</button>'
 +'<button type="button" class="cb" id="favP" data-fav="'+esc(p.title)+'" aria-pressed="'+isFav(p.title)+'" aria-label="Favorilere ekle">'+IC.heart+'</button>'
 +'<button type="button" class="cb" id="menuBtn" aria-label="Menüyü aç" aria-expanded="false" aria-controls="menu">'+IC.menu+'</button></div>'
 +'<span class="ug-n">1 / 8 · Görseller</span></div>'
 +'<section class="u-hd"><div class="u-type"><span class="type">'+p.type+'</span>'+(p.stars?'<span class="stars">'+p.stars+'</span>':'')+'</div>'
 +'<h1>'+p.title+'</h1><div class="meta">'+I.pin+'<span>'+p.place+'</span></div>'
 +'<div class="u-score">'+(p.count?sc(p.score)+'<a href="#yorumlar">'+p.count.toLocaleString('tr-TR')+' değerlendirme</a>':'<span class="score new"><b>Yeni</b></span><span>Henüz değerlendirme yok</span>')+'</div>'
 +lvb(p.title,'in')+'<div class="u-chips">'+chips.map(c=>'<span>'+c+'</span>').join('')+'</div></section>'

 /* Bağlan köprüsü: ürün sayfasında gerçek insanların paylaşımları */
 +'<section class="u-sec" id="paylasimlar"><div class="hd"><h2>Bu deneyimi yaşayanlar</h2>'+(posts.length?'<a href="'+ROOT+'baglan/" class="all">Tümü →</a>':'')+'</div>'
 +(posts.length?'<p class="sub">'+posts.length+' paylaşım</p></section><div class="rail" id="uPosts">'+posts.map(postMini).join('')+'</div>'
   :'<div class="u-first">'+IC.users+'<p><b>Henüz paylaşım yok.</b> Bu deneyimi yaşayınca ilk paylaşan sen ol; paylaşımın bu sayfada görünsün.</p></div></section>')

 +(p.dates.length?'<section class="box" id="tarihler"><h2>Tarih seç</h2><p>Yaklaşan kalkışlar. Kontenjan ve fiyat tarih seçince netleşir.</p><div class="u-dates" role="radiogroup" aria-label="Kalkış tarihi">'
   +p.dates.map(x=>'<button type="button" role="radio" aria-checked="'+(x[0]+' '+x[1]===picked)+'" data-d="'+x[0]+' '+x[1]+'"><small>'+x[0]+'</small><b>'+x[1]+'</b></button>').join('')
   +'<button type="button" class="more-d" data-soon-cal>'+IC.calendar+'<span>'+p.more+' tarih</span></button></div></section>':'')

 +(info.about?'<section class="box"><h2>Hakkında</h2><p class="u-about">'+info.about+'</p>'
   +'</section>':'')

 +(info.program.length?'<section class="box"><h2>'+info.progTitle+'</h2><ol class="u-prog">'
   +info.program.map((x,i)=>'<li'+(cut&&i>2?' hidden':'')+'><span class="k">'+x[0]+'</span><span class="dot" aria-hidden="true"></span><div class="c"><b>'+x[1]+'</b>'+(x[2]?'<p>'+x[2]+'</p>':'')+'</div></li>').join('')+'</ol>'
   +(cut?'<button type="button" class="u-more" data-prog aria-expanded="false">Tamamını gör · '+info.program.length+' '+unitOf(info.program[0][0])+'</button>':'')+'</section>':'')

 +(info.dahil.length?'<section class="box"><h2>Fiyata neler dahil?</h2><div class="u-inc"><h3>Dahil</h3><ul class="ticks">'+info.dahil.map(x=>'<li>'+IC.check+'<div>'+x+'</div></li>').join('')+'</ul>'
   +(info.haric.length?'<h3>Dahil değil</h3><ul class="ticks no">'+info.haric.map(x=>'<li>'+NO+'<div>'+x+'</div></li>').join('')+'</ul>':'')+'</div></section>':'')

 +'<section class="box"><h2>'+info.placeTitle+'</h2><div class="u-place">'+I.pin+'<div><b>'+info.place[0]+'</b>'+(info.place[1]?'<p>'+info.place[1]+'</p>':'')+'</div></div>'
 +(info.bilgi.length?'<h3 class="u-h3">Bilmen gerekenler</h3><ul class="u-info">'+info.bilgi.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'')+'</section>'

 +'<section class="box"><h2>İptal ve ödeme</h2><ul class="ticks">'
 +'<li>'+IC.check+'<div><b>'+S.cancel+'</b> <span id="cxl"></span></div></li>'
 +(deposit?tick('%20 kaporayla yer ayırt','Bugün '+tl(deposit)+' öde, kalanını kalkıştan önce.'):'')
 +tick(TRUST.taksit[0],'Anlaşmalı kartlarla.')
 +tick('Toplam fiyat şeffaf','Ödeme adımında sonradan eklenen ücret yok.')+'</ul></section>'

 +'<section class="box" id="yorumlar"><h2>Değerlendirmeler'+(info.reviews.length?'':'')+'</h2>'
 +(p.count?'<div class="u-rev"><span class="big">'+p.score.toFixed(1).replace('.',',')+'</span><div><b>'+word(p.score)+'</b><span>'+p.count.toLocaleString('tr-TR')+' değerlendirme · yalnızca rezervasyonu tamamlayanlar yazabilir</span></div></div>'
   +'<div class="u-revs">'+info.reviews.map(r=>'<article class="rv"><div class="rv-h"><span class="ava s" style="--c:'+r.user.renk+'" aria-hidden="true">'+r.user.ini+'</span><div class="x"><b>'+r.user.ad+'</b><small>Rezervasyonla gitti</small></div><span class="rv-s">'+r.score.toFixed(1).replace('.',',')+'</span></div><p>'+r.text+'</p></article>').join('')+'</div>'
   :'<p>Bu deneyimi Mola360\'tan yaşayanlar değerlendirdikçe burada görünecek.</p>')+'</section>'

 +(similar.length?'<section class="u-sec"><div class="hd"><h2>Benzer deneyimler</h2><a href="'+ROOT+'liste/?tur='+typeKey(p.type)+'" class="all">Tümü →</a></div></section><div class="rail" id="uSim">'+similar.map(x=>productCard(x)).join('')+'</div>':'');


const cta=document.getElementById('ctaBar');
/* son ücretsiz iptal günü: seçilen ya da tek tarihe göre */
function cxl(){
  const when=picked||(S.dates.length===1?S.dates[0].join(' '):'');
  const c=when&&cancelBy(p,when);
  document.getElementById('cxl').textContent=!c?(p.dates.length?'Tarih seçince son ücretsiz iptal günü burada yazar.':'Son ücretsiz iptal günü rezervasyonda, tarih seçince yazar.')
    :c.past?'Bu tarihte ücretsiz iptal süresi doldu; iptal edersen ödediğin tutar iade edilmez.':'Bu tarih için son gün: '+c.date+'.';
}
cxl();
function drawCta(){
  cta.innerHTML='<div class="pp"><small>'+(picked?picked+' · ':'')+p.unit+'</small>'+(p.old?'<s>'+tl(p.old)+'</s>':'')+'<strong>'+tl(p.price)+'</strong></div>'
   +'<button type="button" class="btn green" id="ctaGo">'+(p.dates.length?(picked?'Devam et':'Tarih seç'):'Rezervasyon yap')+'</button>';
}
drawCta();
cta.addEventListener('click',e=>{if(!e.target.closest('#ctaGo'))return;
  if(p.dates.length&&!picked){document.getElementById('tarihler').scrollIntoView({behavior:'smooth',block:'center'});return}
  location.href=ROOT+'rezervasyon/?id='+p.id+(picked?'&tarih='+encodeURIComponent(picked):'')});
document.getElementById('urun').addEventListener('click',e=>{
  const d=e.target.closest('[data-d]');
  if(d){document.querySelectorAll('[data-d]').forEach(x=>x.setAttribute('aria-checked',x===d));picked=d.dataset.d;history.replaceState({...history.state,tarih:picked},'');drawCta();cxl();return}
  const m=e.target.closest('[data-prog]');
  if(m){const open=m.getAttribute('aria-expanded')!=='true';m.previousElementSibling.querySelectorAll('li').forEach((li,i)=>li.hidden=!open&&i>2);m.setAttribute('aria-expanded',open);
    m.textContent=open?'Daha az göster':'Tamamını gör · '+info.program.length+' '+unitOf(info.program[0][0]);return}
  if(e.target.closest('[data-soon-cal]'))toast('Çok yakında.','Tamam',()=>{},3000);
});

renderShell('urun',{nav:false});
renderHelp(document.getElementById('urun'));
initPostActions(toast);
initFavorites();
initLevelInfo();
favSync();
document.querySelectorAll('.rail').forEach(el=>{makeScroll(el)});
/* adresteki bölüm (kartlardaki "N paylaşım" → #paylasimlar) sayfa çizildikten sonra açılır */
const at=location.hash.length>1&&document.getElementById(location.hash.slice(1));
if(at)at.scrollIntoView({block:'start'});
}
