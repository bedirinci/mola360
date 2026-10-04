/* Ürün (deneyim) sayfası: tek şablon, ürün adresteki ?id= ile seçilir */
import { renderShell, backLabel } from './shell.js';
import { getProduct, listProducts, listPosts, typeKey, markViewed, productDetails, bookingSpec, cancelBy, firstDateIn, getSearch, upcoming } from './api.js';
import { productCard, postMini, initPostActions } from './cards.js';
import { tl, sc, word, toast, makeScroll, esc } from './ui.js';
import { isFav, initFavorites, favSync } from './favorites.js';
import { initLevelInfo, lvb, lvOn, lvPrice } from './level.js';
import { renderHelp } from './help.js';
import { TRUST } from './data.js';
import { IC, I, TRI } from './icons.js';
import { ROOT } from './root.js';

const id=new URLSearchParams(location.search).get('id');
const p=getProduct(id);

if(p)render(p);
else{
  document.getElementById('urun').innerHTML='<header class="pg-top slim"><div class="bar"><div class="bar-l"><a class="ib back" href="'+ROOT+'" data-back aria-label="Geri">'+IC.back+'</a></div></div><h1>Deneyim bulunamadı</h1></header>'
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
const ds=upcoming(p.dates);
/* tek kalkış kaldıysa o seçili gelir */
let picked=kept&&ds.some(x=>x[0]+' '+x[1]===kept)?kept:firstDateIn(p,getSearch().tarih)||(ds.length===1?ds[0].join(' '):'');
const posts=listPosts({productId:p.id});
const similar=listProducts({type:typeKey(p.type)}).filter(x=>x.id!==p.id).slice(0,6);
const chips=[p.info,p.tr&&TRI[p.tr][0],p.visa,...p.facts].filter(Boolean);
const deposit=p.type==='Tur'?Math.round(lvPrice(p.title,p.price)*.2):0;

/* üst çubuk: görselin üstünde yüzen düğmeler; görsel geçince lacivert
   bant, ortada ad ve altında soluk tür · yer, altında bölüm sekmeleri */
const N=5;
const frame=i=>'radial-gradient(circle at '+[[30,25],[75,35],[50,70],[20,60],[80,80]][i].map(v=>v+'%').join(' ')+',rgba(255,255,255,.28),transparent 55%),'+p.bg;
const short=p.place.split(' · ')[0];
const tabs=[['genel','Genel'],p.dates.length&&['tarihler','Tarihler'],['paylasimlar','Paylaşımlar'],info.program.length&&['program',info.progTitle==='Nasıl geçiyor?'?'Akış':info.progTitle],
  info.dahil.length&&['dahil','Dahil'],['yorumlar','Yorumlar']].filter(Boolean);
const facts=chips.slice(0,2).map(c=>[/\d+ (Eki|Kas|Ara)/.test(c)?IC.calendar:/saat|dk|gün|gece/.test(c.toLocaleLowerCase('tr'))?I.clock:p.tr&&c===TRI[p.tr][0]?'<svg viewBox="0 0 24 24">'+TRI[p.tr][1]+'</svg>':IC.ticket,c]);
facts.push([IC.shield,'Ücretsiz iptal']);
const ppl=posts.slice(0,3).map(x=>'<span class="ava s" style="--c:'+x.user.renk+'" aria-hidden="true">'+x.user.ini[0]+'</span>').join('');

document.getElementById('urun').innerHTML=
 '<header class="pg-top slim u-top" id="uTop"><div class="bar"><div class="bar-l"><a class="ib back" href="'+ROOT+'" data-back id="uBack" aria-label="Geri">'+IC.back+'</a></div>'
 +'<div class="bk-mid"><b class="bk-h">'+p.title+'</b><small>'+p.type+' · '+short+'</small></div>'
 +'<div class="bar-i"><button type="button" class="ib" data-share aria-label="Paylaş">'+IC.share+'</button>'
 +'<button type="button" class="ib" id="favP" data-fav="'+esc(p.title)+'" aria-pressed="'+isFav(p.title)+'" aria-label="Favorilere ekle">'+IC.heart+'</button></div></div>'
 +'<nav class="u-tabs" aria-label="Bölümler">'+tabs.map(([k,t],i)=>'<button type="button" data-go="'+k+'"'+(i?'':' aria-current="true"')+'>'+t+'</button>').join('')+'</nav></header>'
 +'<div class="ug"><div class="ug-tr" id="ugTr">'+Array.from({length:N},(_,i)=>'<div class="ug-f" style="background:'+frame(i)+'" role="img" aria-label="'+esc(p.title)+' görsel '+(i+1)+'"></div>').join('')+'</div>'
 +'<span class="ug-n"><span id="ugI">1</span> / '+N+'</span><div class="ug-dots" aria-hidden="true">'+Array.from({length:N},(_,i)=>'<i'+(i?'':' class="on"')+'></i>').join('')+'</div></div>'
 +'<section class="u-hd" id="genel"><div class="u-type"><span class="type">'+p.type+'</span>'+(p.stars?'<span class="stars">'+p.stars+'</span>':'')+'</div>'
 +'<h1>'+p.title+'</h1><div class="meta">'+I.pin+'<span>'+p.place+'</span></div>'
 +'<div class="u-proof">'+(p.count?'<button type="button" class="u-sc" data-go="yorumlar">'+sc(p.score)+'<span>'+p.count.toLocaleString('tr-TR')+' değerlendirme</span></button>':'<span class="score new"><b>Yeni</b></span><span class="u-nr">Henüz değerlendirme yok</span>')
 +(posts.length?'<button type="button" class="u-ppl" data-go="paylasimlar"><span class="stk">'+ppl+'</span>'+posts.length+' paylaşım</button>':'')+'</div>'
 +lvb(p.title,'in')+'</section>'
 +'<ul class="u-facts">'+facts.map(([ic,t])=>'<li>'+ic+'<span>'+t+'</span></li>').join('')+'</ul>'

 +(info.about?'<section class="box"><h2>Hakkında</h2><p class="u-about">'+info.about+'</p>'
   +'</section>':'')

 +(p.dates.length?'<section class="u-sec u-dsec" id="tarihler"><div class="hd"><h2>Tarih seç</h2></div><div class="u-dates" role="radiogroup" aria-label="Kalkış tarihi">'
   +ds.map(x=>'<button type="button" role="radio" aria-checked="'+(x[0]+' '+x[1]===picked)+'" data-d="'+x[0]+' '+x[1]+'"><small>'+x[0]+'</small><b>'+x[1]+'</b></button>').join('')
   +'<button type="button" class="more-d" data-soon-cal>'+IC.calendar+'<span>'+p.more+' tarih</span></button></div><p class="u-cx" id="cxl2"></p></section>':'')

 /* Bağlan köprüsü: ürün sayfasında gerçek insanların paylaşımları */
 +'<section class="u-sec" id="paylasimlar"><div class="hd"><h2>Bu deneyimi yaşayanlar</h2>'+(posts.length?'<a href="'+ROOT+'baglan/" class="all">Tümü →</a>':'')+'</div>'
 +(posts.length?'<p class="sub">'+posts.length+' paylaşım</p></section><div class="rail" id="uPosts">'+posts.map(postMini).join('')+'</div>'
   :'<div class="u-first">'+IC.users+'<p><b>Henüz paylaşım yok.</b> Bu deneyimi yaşayınca ilk paylaşan sen ol; paylaşımın bu sayfada görünsün.</p></div></section>')

 +(info.program.length?'<section class="box" id="program"><h2>'+info.progTitle+'</h2><ol class="u-prog">'
   +info.program.map((x,i)=>'<li'+(cut&&i>2?' hidden':'')+'><span class="k">'+x[0]+'</span><span class="dot" aria-hidden="true"></span><div class="c"><b>'+x[1]+'</b>'+(x[2]?'<p>'+x[2]+'</p>':'')+'</div></li>').join('')+'</ol>'
   +(cut?'<button type="button" class="u-more" data-prog aria-expanded="false">Tamamını gör · '+info.program.length+' '+unitOf(info.program[0][0])+'</button>':'')+'</section>':'')

 +(info.dahil.length?'<section class="box" id="dahil"><h2>Fiyata neler dahil?</h2><div class="u-inc"><h3>Dahil</h3><ul class="ticks">'+info.dahil.map(x=>'<li>'+IC.check+'<div>'+x+'</div></li>').join('')+'</ul>'
   +(info.haric.length?'<h3>Dahil değil</h3><ul class="ticks no">'+info.haric.map(x=>'<li>'+NO+'<div>'+x+'</div></li>').join('')+'</ul>':'')+'</div></section>':'')

 +'<section class="box"><h2>'+info.placeTitle+'</h2><div class="u-place">'+I.pin+'<div><b>'+info.place[0]+'</b>'+(info.place[1]?'<p>'+info.place[1]+'</p>':'')+'</div></div>'
 +(info.bilgi.length?'<h3 class="u-h3">Bilmen gerekenler</h3><ul class="u-info">'+info.bilgi.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'')+'</section>'

 +'<section class="box"><h2>İptal ve ödeme</h2><ul class="ticks">'
 +'<li>'+IC.check+'<div><b>'+S.cancel+'</b> <span id="cxl"></span></div></li>'
 +(deposit?tick('%20 kaporayla yer ayırt','Bugün '+tl(deposit)+' öde, kalanını kalkıştan önce.'):'')
 +tick(TRUST.taksit[0],'Anlaşmalı kartlarla.')
 +tick('Toplam fiyat şeffaf','Ödeme adımında sonradan eklenen ücret yok.')+'</ul></section>'

 +'<section class="box" id="yorumlar"><h2>Değerlendirmeler</h2>'
 +(p.count?'<div class="u-rev"><span class="big">'+p.score.toFixed(1).replace('.',',')+'</span><div><b>'+word(p.score)+'</b><span>'+p.count.toLocaleString('tr-TR')+' değerlendirme</span></div></div>'
   +'<ul class="u-asp">'+info.aspects.map(([k,v])=>'<li><span>'+k+'</span><i><em style="width:'+v*10+'%"></em></i><b>'+v.toFixed(1).replace('.',',')+'</b></li>').join('')+'</ul>'
   +'<p class="u-only">'+IC.shield+'Yalnızca rezervasyonla gidenler değerlendirebilir.</p>'
   +'<div class="u-revs">'+info.reviews.map(r=>'<article class="rv"><div class="rv-h"><span class="ava s" style="--c:'+r.user.renk+'" aria-hidden="true">'+r.user.ini+'</span><div class="x"><b>'+r.user.ad+'</b><small>Rezervasyonla gitti</small></div><span class="rv-s">'+r.score.toFixed(1).replace('.',',')+'</span></div><p>'+r.text+'</p></article>').join('')+'</div>'
   +'<button type="button" class="u-more" data-soon-rv>Tüm değerlendirmeler · '+p.count.toLocaleString('tr-TR')+'</button>'
   :'<p>Bu deneyimi Mola360\'tan yaşayanlar değerlendirdikçe burada görünecek.</p>')+'</section>'

 +(similar.length?'<section class="u-sec"><div class="hd"><h2>Benzer deneyimler</h2><a href="'+ROOT+'liste/?tur='+typeKey(p.type)+'" class="all">Tümü →</a></div></section><div class="rail" id="uSim">'+similar.map(x=>productCard(x)).join('')+'</div>':'');


const cta=document.getElementById('ctaBar');
/* son ücretsiz iptal günü: seçilen ya da tek tarihe göre */
function cxl(){
  const when=picked||(S.dates.length===1?S.dates[0].join(' '):'');
  const c=when&&cancelBy(p,when);
  document.getElementById('cxl').textContent=!c?(p.dates.length?'Tarih seçince son ücretsiz iptal günü burada yazar.':'Son ücretsiz iptal günü rezervasyonda, tarih seçince yazar.')
    :c.past?'Bu tarihte ücretsiz iptal süresi doldu; iptal edersen ödediğin tutar iade edilmez.':'Bu tarih için son gün: '+c.date+'.';
  const c2=document.getElementById('cxl2');
  if(c2)c2.innerHTML=c?IC.shield+'<span>'+(c.past?'Bu tarihte ücretsiz iptal süresi doldu.':'<b>'+c.date+'</b> gününe kadar ücretsiz iptal')+'</span>':'';
}
cxl();
function drawCta(){
  /* kartlardaki fiyatla aynı: seviye indirimi (Kâşif %10) fiyata dahil, üstü çizili ilk fiyat */
  const now=lvPrice(p.title,p.price),was=p.old||(lvOn(p.title)?p.price:0);
  cta.innerHTML='<div class="pp">'+(was?'<span class="pp-o"><s>'+tl(was)+'</s><em>%'+Math.round((1-now/was)*100)+' indirim</em></span>':'')+'<strong>'+tl(now)+'</strong><small>'+p.unit+(picked?' · '+picked:lvOn(p.title)?' · Kâşif fiyatı':'')+'</small></div>'
   +'<button type="button" class="btn green" id="ctaGo">'+(p.dates.length?(picked?'Devam et':'Tarih seç'):'Rezervasyon yap')+'</button>';
}
drawCta();
cta.addEventListener('click',e=>{if(!e.target.closest('#ctaGo'))return;
  if(p.dates.length&&!picked){goTo('tarihler');return}
  location.href=ROOT+'rezervasyon/?id='+p.id+(picked?'&tarih='+encodeURIComponent(picked):'')});
document.getElementById('urun').addEventListener('click',e=>{
  const d=e.target.closest('[data-d]');
  if(d){document.querySelectorAll('[data-d]').forEach(x=>x.setAttribute('aria-checked',x===d));picked=d.dataset.d;history.replaceState({...history.state,tarih:picked},'');drawCta();cxl();return}
  const m=e.target.closest('[data-prog]');
  if(m){const open=m.getAttribute('aria-expanded')!=='true';m.previousElementSibling.querySelectorAll('li').forEach((li,i)=>li.hidden=!open&&i>2);m.setAttribute('aria-expanded',open);
    m.textContent=open?'Daha az göster':'Tamamını gör · '+info.program.length+' '+unitOf(info.program[0][0]);return}
  const g=e.target.closest('[data-go]');
  if(g){goTo(g.dataset.go);return}
  if(e.target.closest('[data-soon-cal],[data-soon-rv]'))toast('Çok yakında.','Tamam',()=>{},3000);
});
/* sekmeler ve puan/paylaşım bağları sayfa içinde kaydırır; geçmişe kayıt eklemez */
const top=document.getElementById('uTop'),ttl=document.querySelector('.u-hd h1');
function goTo(k,smooth=true){const el=document.getElementById(k);if(!el)return;
  const y=k==='genel'?0:el.getBoundingClientRect().top+scrollY-top.offsetHeight-(top.classList.contains('on')?0:34)-8;
  scrollTo({top:Math.max(0,y),behavior:smooth?'smooth':'instant'})}
/* görsel geçince üst çubuk lacivert banda döner; görünen bölümün sekmesi seçili */
const secs=tabs.map(([k])=>document.getElementById(k)).filter(Boolean);
function onScroll(){
  const on=ttl.getBoundingClientRect().bottom<top.querySelector('.bar').getBoundingClientRect().bottom;
  top.classList.toggle('on',on);
  if(!on)return;
  const line=top.offsetHeight+24;let cur=secs[0];
  secs.forEach(x=>{if(x.getBoundingClientRect().top<=line)cur=x});
  if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)cur=secs[secs.length-1];
  top.querySelectorAll('[data-go]').forEach(b=>{const m=b.dataset.go===cur.id;if(m!==(b.getAttribute('aria-current')==='true')){b.setAttribute('aria-current',m);if(m){const n=b.parentElement;n.scrollTo({left:b.offsetLeft-(n.clientWidth-b.offsetWidth)/2,behavior:'smooth'})}}});
}
addEventListener('scroll',onScroll,{passive:true});onScroll();
/* görsel sayacı ve noktalar kaydırdıkça */
const tr=document.getElementById('ugTr');
tr.addEventListener('scroll',()=>{const i=Math.round(tr.scrollLeft/tr.clientWidth);document.getElementById('ugI').textContent=i+1;
  document.querySelectorAll('.ug-dots i').forEach((d,j)=>d.classList.toggle('on',j===i))},{passive:true});

renderShell('urun',{nav:false});
/* geri okunda dönülecek sayfanın adı (Keşfet, Bağlan, Liste…) */
document.getElementById('uBack').setAttribute('aria-label',backLabel(ROOT)+' sayfasına dön');
renderHelp(document.getElementById('urun'));
initPostActions(toast);
initFavorites();
initLevelInfo();
favSync();
document.querySelectorAll('.rail').forEach(el=>{makeScroll(el)});
/* adresteki bölüm (kartlardaki "N paylaşım" → #paylasimlar) sayfa çizildikten sonra açılır */
const at=location.hash.length>1&&document.getElementById(location.hash.slice(1));
if(at)goTo(at.id,false);
}
