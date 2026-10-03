/* Ürün (deneyim) sayfası: tek şablon, ürün adresteki ?id= ile seçilir */
import { renderShell } from './shell.js';
import { getProduct, listProducts, listPosts, typeKey, markViewed } from './api.js';
import { productCard, postMini, initPostActions } from './cards.js';
import { tl, sc, word, toast, makeScroll } from './ui.js';
import { favToggle, isFav, initFavorites, favSync } from './favorites.js';
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
const posts=listPosts({productId:p.id});
const similar=listProducts({type:typeKey(p.type)}).filter(x=>x.id!==p.id).slice(0,6);
const chips=[p.info,p.tr&&TRI[p.tr][0],p.visa,...p.facts].filter(Boolean);
const deposit=p.type==='Tur'?Math.round(p.price*.2):0;

document.getElementById('urun').innerHTML=
 '<div class="ug" style="background:'+p.bg+'">'
 +'<div class="ug-top"><a class="cb" href="'+ROOT+'" data-back aria-label="Geri">'+IC.back+'</a><span class="sp"></span>'
 +'<button type="button" class="cb" data-share aria-label="Paylaş">'+IC.share+'</button>'
 +'<button type="button" class="cb" id="favP" aria-pressed="'+isFav(p.title)+'" aria-label="Favorilere ekle">'+IC.heart+'</button>'
 +'<button type="button" class="cb" id="menuBtn" aria-label="Menüyü aç" aria-expanded="false" aria-controls="menu">'+IC.menu+'</button></div>'
 +'<span class="ug-n">1 / 8 · Görseller <span class="ornek">ÖRNEK</span></span></div>'
 +'<section class="u-hd"><div class="u-type"><span class="type">'+p.type+'</span>'+(p.stars?'<span class="stars">'+p.stars+'</span>':'')+'</div>'
 +'<h1>'+p.title+'</h1><div class="meta">'+I.pin+'<span>'+p.place+'</span></div>'
 +'<div class="u-score">'+(p.count?sc(p.score)+'<a href="#yorumlar">'+p.count.toLocaleString('tr-TR')+' değerlendirme</a>':'<span class="score new"><b>Yeni</b></span><span>Henüz değerlendirme yok</span>')+'</div>'
 +lvb(p.title,'in')+'<div class="u-chips">'+chips.map(c=>'<span>'+c+'</span>').join('')+'</div></section>'

 /* Bağlan köprüsü: ürün sayfasında gerçek insanların paylaşımları */
 +'<section class="u-sec"><div class="hd"><h2>Bu deneyimi yaşayanlar</h2>'+(posts.length?'<a href="'+ROOT+'baglan/" class="all">Tümü →</a>':'')+'</div>'
 +(posts.length?'<p class="sub">'+posts.length+' paylaşım <span class="ornek">ÖRNEK</span></p></section><div class="rail" id="uPosts">'+posts.map(postMini).join('')+'</div>'
   :'<div class="u-first">'+IC.users+'<p><b>Henüz paylaşım yok.</b> Bu deneyimi yaşayınca ilk paylaşan sen ol; paylaşımın bu sayfada görünsün.</p></div></section>')

 +(p.dates.length?'<section class="box" id="tarihler"><h2>Tarih seç</h2><p>Yaklaşan kalkışlar. Kontenjan ve fiyat tarih seçince netleşir.</p><div class="u-dates" role="radiogroup" aria-label="Kalkış tarihi">'
   +p.dates.map((d,i)=>'<button type="button" role="radio" aria-checked="false" data-d="'+d[0]+' '+d[1]+'"><small>'+d[0]+'</small><b>'+d[1]+'</b></button>').join('')
   +'<button type="button" class="more-d" data-soon-cal>'+IC.calendar+'<span>'+p.more+' tarih</span></button></div></section>':'')

 +'<section class="box"><h2>Öne çıkanlar</h2><ul class="ticks">'+chips.slice(0,4).map(c=>tick(c)).join('')+'</ul>'
 +'<div class="sk-wrap" aria-hidden="true"><i class="sk" style="width:92%"></i><i class="sk" style="width:76%"></i><i class="sk" style="width:84%"></i></div><p class="sk-note">Program ve açıklama ürün verisiyle gelecek.</p></section>'

 +'<section class="box"><h2>İptal ve ödeme <span class="ornek">ÖRNEK KURAL</span></h2><ul class="ticks">'
 +tick(TRUST.iptal[0],'Son ücretsiz iptal tarihi, tarih seçince burada yazar.')
 +(deposit?tick('%20 kaporayla yer ayırt','Bugün '+tl(deposit)+' öde, kalanını kalkıştan önce.'):'')
 +tick(TRUST.taksit[0],'Anlaşmalı kartlarla.')
 +tick('Toplam fiyat şeffaf','Ödeme adımında sonradan eklenen ücret yok.')+'</ul></section>'

 +'<section class="box" id="yorumlar"><h2>Değerlendirmeler</h2>'
 +(p.count?'<div class="u-rev"><span class="big">'+p.score.toFixed(1).replace('.',',')+'</span><div><b>'+word(p.score)+'</b><span>'+p.count.toLocaleString('tr-TR')+' değerlendirme · yalnızca rezervasyonu tamamlayanlar yazabilir</span></div></div>':'<p>Bu deneyimi Mola360\'tan yaşayanlar değerlendirdikçe burada görünecek.</p>')
 +'<div class="sk-wrap" aria-hidden="true"><i class="sk" style="width:88%"></i><i class="sk" style="width:64%"></i></div></section>'

 +(similar.length?'<section class="u-sec"><div class="hd"><h2>Benzer deneyimler</h2><a href="'+ROOT+'liste/?tur='+typeKey(p.type)+'" class="all">Tümü →</a></div></section><div class="rail" id="uSim">'+similar.map(x=>productCard(x)).join('')+'</div>':'');


const cta=document.getElementById('ctaBar');
let picked=null;
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
  if(d){document.querySelectorAll('[data-d]').forEach(x=>x.setAttribute('aria-checked',x===d));picked=d.dataset.d;drawCta();return}
  if(e.target.closest('[data-soon-cal]'))toast('Takvim yeni mola360\'ta hazırlanıyor.','Tamam',()=>{},3000);
});

renderShell('urun',{nav:false});
renderHelp(document.getElementById('urun'));
initPostActions(toast);
initFavorites();
initLevelInfo();
favSync();
const fb=document.getElementById('favP');
fb.addEventListener('click',()=>{favToggle(p.title);fb.setAttribute('aria-pressed',isFav(p.title))});
document.querySelectorAll('.rail').forEach(el=>{makeScroll(el,true)});
}
