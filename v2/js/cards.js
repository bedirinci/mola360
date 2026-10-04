/* Kartlar: ürün kartı ve Bağlan bileşenleri (paylaşım, bağlı ürün) */
import { G } from './data.js';
import { STAR, IC, PIN, VERIFIED } from './icons.js';
import { tl, ttl, makeSheet } from './ui.js';
import { lvOn, lvPrice } from './level.js';
import { heartBtn, isFav } from './favorites.js';
import { ROOT } from './root.js';
import { listPosts, deletePost } from './api.js';

/* Görsel ağırlıklı kart: görsel kartın tamamı, yazı görselin üstünde.
   Kartta yalnızca karar için gereken: tür, ad, yer · süre, puan, fiyat.
   Tarihler, vize, ulaşım ve seviye indirimi ürün sayfasında. */
const placeOf=x=>x.a.split(' · ')[0];
/* Otelde tarih zaten seçili hafta sonu; onun yerine pansiyon tipi (kahvaltı dahil …) */
const durOf=x=>x.info||(x.facts&&(x.k==='Otel'?x.facts[1]:x.facts[0]))||'';
const unitOf=u=>u==='kişi başı'?'kişi başı':u;
/* Yakınımda: kuş uçuşu uzaklık, yuvarlanmış */
export const km=d=>(d<1?'1':d<100?String(Math.round(d)):(Math.round(d/10)*10).toLocaleString('tr-TR'))+' km';
/* Bağlan döngüsü: deneyimi yaşayanların paylaşımları kartın üstünde;
   dokununca ürün sayfasındaki paylaşımlara gider */
const pp=(id,l)=>l&&l.length?'<a class="vk-pp" href="'+ROOT+'urun/?id='+id+'#paylasimlar" aria-label="Bu deneyimin '+l.length+' paylaşımı"><span class="avs">'
  +l.slice(0,3).map(p=>ava(p.user,'xs')).join('')+'</span>'+l.length+' paylaşım</a>':'';
export function card(x){
  const unit=x.u||'kişi başı',lv=lvOn(x.t);
  return '<article class="vk" style="--g:'+(x.gbg||G[x.g])+'"><div class="vk-tg"><span class="type">'+x.k+'</span>'+(lv?'<span class="vk-off">%10 indirim</span>':'')+'</div>'+heartBtn(x.t)
  +'<div class="vk-b">'+pp(x.id,x.pp)+'<h3>'+ttl(x.t)+'</h3><p class="vk-s">'+(x.km!=null?'<span class="km">'+PIN+km(x.km)+'</span> · ':'')+placeOf(x)+(durOf(x)?' · '+durOf(x):'')+'</p>'
  +'<div class="vk-r">'+(x.s&&x.c?'<span class="vk-st">'+STAR+x.s.toFixed(1).replace('.',',')+' <i>('+x.c.toLocaleString('tr-TR')+')</i></span>':'<span class="vk-st new">Yeni</span>')
  +'<span class="vk-p">'+(lv?'<s>'+tl(x.p)+'</s>':'')+'<b>'+tl(lvPrice(x.t,x.p))+'</b><small>'+unitOf(unit)+'</small></span></div></div></article>';
}

/* Veri katmanındaki ürünü (api.js) kart biçimine çevirip çizer */
export const productCard=x=>card({k:x.type,t:x.title,a:x.place,p:x.price,u:x.unit==='kişi başı'?'':x.unit,s:x.score,c:x.count,gbg:x.bg,facts:x.facts,info:x.info,km:x.km,id:x.id,pp:listPosts({productId:x.id})});

/* Kaldığın yerden: hatırlatma kartı (küçük görsel, ad, tür ve fiyat) */
export const recentCard=p=>'<article class="rc"><span class="rc-i" style="background:'+p.bg+'"></span><div class="rc-x"><h3>'+ttl(p.title)+'</h3>'
  +'<p>'+p.type+' · <b>'+tl(lvPrice(p.title,p.price))+'</b></p></div></article>';

/* Sahnede: bilet. Solda gün, ay ve saat; sağda tür, ad, yer ve fiyat */
export const ticket=e=>'<article class="tk" style="--g:'+e.bg+'"><div class="tk-d"><span class="dw">'+e.dw+'</span><span class="dn">'+e.dn+'</span><span class="mo">'+e.month+'</span><span class="tm">'+e.time+'</span></div>'
  +'<span class="notch t"></span><span class="notch b"></span>'
  +'<div class="tk-b"><span class="cat">'+e.cat+'</span><h3>'+ttl(e.title)+'</h3><p class="tk-m">'+PIN+'<span>'+e.place+'</span></p>'
  +'<div class="tk-f"><span class="tk-p"><b>'+tl(e.price)+'</b>\'den</span><span class="tk-go">Bilet al'+IC.right+'</span></div></div></article>';

/* ---- Bağlan bileşenleri ---- */

const ava=(u,cls)=>'<span class="ava'+(cls?' '+cls:'')+'" style="--c:'+u.renk+'" aria-hidden="true">'+u.ini+'</span>';
export { ava };

/* Paylaşımdaki deneyim: görsel, tür ve yer, ad, puan ve fiyat; kartın
   tamamı ürün sayfasına gider */
export function plink(p){
  if(!p)return '';
  return '<a class="plink" href="'+ROOT+'urun/?id='+p.id+'"><span class="pt" style="background:'+p.bg+'"></span><span class="x">'
   +'<small><em>'+p.type+'</em> · '+placeOf({a:p.place})+'</small><b>'+p.title+'</b>'
   +'<span class="pm">'+(p.count?'<span class="st">'+STAR+p.score.toFixed(1).replace('.',',')+'</span>':'<span class="st new">Yeni</span>')
   +'<strong>'+tl(p.price)+'</strong><span class="u">'+p.unit+'</span></span></span>'
   +'<span class="go-p" aria-hidden="true">'+IC.right+'</span></a>';
}

/* Fotoğrafın üstünde "Mola360 ile gitti": beyaz zemin, Mola360 logosu */
const WENT='<span class="went"><img src="'+ROOT+'logo-koyu.webp" alt="Mola360" width="44" height="18"> ile gitti</span>';

/* Fotoğrafın içinde, altta bağlı deneyim: görsel, tür ve yer, ad, puan.
   Fiyat ürün sayfasında. */
function plinkOver(p){
  if(!p)return '';
  return '<a class="plo" href="'+ROOT+'urun/?id='+p.id+'"><span class="pt" style="background:'+p.bg+'"></span><span class="x">'
   +'<b>'+p.title+'</b><small>'+(p.count?'<span class="st">'+STAR+p.score.toFixed(1).replace('.',',')+' <i>('+p.count+')</i></span>':'<span class="st new">Yeni</span>')
   +'<span class="w">'+p.type+' · '+placeOf({a:p.place})+'</span></small></span>'
   +'<span class="go-p" aria-hidden="true">'+IC.right+'</span></a>';
}

/* Akıştaki paylaşım: kart değil, ekran boyu. Görseller yan yana kayar;
   ilk görsel ekranın çoğunu kaplar, sonraki kenardan görünür. */
/* her paylaşımın kendi sayfası: yorumlarıyla açılır */
export const postUrl=id=>ROOT+'gonderi/?id='+encodeURIComponent(id);
export function postCard(x){
  const u=x.user,pics=x.pics&&x.pics.length?x.pics:[x.bg],more=Math.max(0,(x.media||pics.length)-pics.length),n=pics.length;
  return '<article class="post" data-post="'+x.id+'">'
   +'<div class="post-hd">'+ava(u)+'<div class="x"><b>'+u.kul+(u.onay?VERIFIED:'')+'</b><small>'+[x.place,x.with,x.when].filter(Boolean).join(' · ')+'</small></div>'+(x.mine?'':'<button type="button" class="follow" aria-pressed="false">Takip et</button>')+'<button type="button" class="p-more" aria-label="Seçenekler" aria-haspopup="menu" aria-expanded="false"'+(x.mine?' data-mine':'')+'>'+IC.more+'</button></div>'
   +'<div class="pics" role="group" aria-label="'+(n+more)+' görsel" tabindex="0">'
   +pics.map((bg,i)=>'<div class="pic" style="background:'+bg+'">'
     +(i===0&&x.verified?WENT:'')
     +(i===0&&x.video?'<span class="m-play" aria-label="Video">'+IC.play+'</span>':'')
     +(i===n-1&&more?'<span class="pic-more">+'+more+'</span>':'')
     +(i===0?plinkOver(x.product):'')+'</div>').join('')+'</div>'
   +'<div class="acts-row"><button type="button" class="act like" aria-pressed="false" aria-label="Beğen">'+IC.heart+'<span>'+x.likes+'</span></button>'
   +'<a class="act cm" href="'+postUrl(x.id)+'" aria-label="Yorumlar">'+IC.comment+'<span>'+x.comments+'</span></a>'
   +'<button type="button" class="act" aria-label="Paylaş" data-share>'+IC.share+'</button>'
   +'<button type="button" class="act save" aria-pressed="false" aria-label="Kaydet">'+IC.save+'</button></div>'
   +(x.text?'<p class="txt"><b>'+u.kul+'</b>'+x.text+'</p>':'')
   /* ilhamdan plana: deneyimi listeye ekle ya da birlikte gitmeyi öner */
   +(x.product&&!x.mine?'<div class="p-go"><button type="button" class="pg-b want" data-fav="'+x.product.title.replace(/"/g,'&quot;')+'" aria-pressed="'+isFav(x.product.title)+'">'+IC.plus+'<span class="off">Ben de gitmek istiyorum</span>'+IC.check+'<span class="on">Listende</span></button>'
     +'<button type="button" class="pg-b" data-birlikte="'+x.product.id+'">'+IC.users+'Birlikte gidelim</button></div>':'')
   +'</article>';
}

/* Rayda küçük paylaşım kartı (Keşfet ve ürün sayfası) */
export function postMini(x,{own=false}={}){
  const u=x.user,p=x.product;
  return '<article class="pmini'+(own?' own':'')+'" style="background:'+x.bg+'">'+(own?(x.verified?WENT:''):'<div class="who">'+ava(u,'s')+'<span>@'+u.kul+'</span></div>')
   +'<div class="pm-b"><p>'+x.text+'</p>'+(p?'<div class="tagp"><span class="sw" style="background:'+p.bg+'"></span><span>'+p.title+'</span></div>':'')+'</div>'
   +'<a class="lk2" href="'+postUrl(x.id)+'" aria-label="'+u.kul+' paylaşımını aç"></a></article>';
}

/* Paylaşım seçenekleri (üç nokta): kaydet, bağlantıyı kopyala; başkasının
   paylaşımında ilgilenmiyorum ve bildir */
function closeMenu(){const m=document.querySelector('.pmenu');if(!m)return;
  const b=m.parentElement.querySelector('.p-more');if(b)b.setAttribute('aria-expanded','false');m.remove()}
function openMenu(btn){
  closeMenu();const post=btn.closest('.post'),save=post.querySelector('.act.save'),saved=save&&save.getAttribute('aria-pressed')==='true';
  const it=(k,ic,t)=>'<button type="button" role="menuitem" data-pm="'+k+'">'+ic+'<span>'+t+'</span></button>';
  btn.insertAdjacentHTML('afterend','<div class="pmenu" role="menu">'
    +it('save',IC.save,saved?'Kayıttan çıkar':'Kaydet')+it('link',IC.link,'Bağlantıyı kopyala')
    +(btn.hasAttribute('data-mine')?it('del',IC.trash,'Gönderiyi sil'):it('hide',IC.eyeoff,'İlgilenmiyorum')+it('report',IC.flag,'Bildir'))+'</div>');
  btn.setAttribute('aria-expanded','true');btn.nextElementSibling.querySelector('button').focus();
}
function menuAct(k,post,toast){
  if(k==='save'){const s=post.querySelector('.act.save');if(s)s.click();return}
  if(k==='del'){askDelete(post,toast);return}
  if(k==='link'){const url=new URL(postUrl(post.dataset.post),location.href).href;
    if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>toast('Bağlantı kopyalandı.','Tamam',()=>{},3000),()=>{});return}
  if(k==='hide'){post.hidden=true;toast('Bu paylaşımı artık görmeyeceksin.','Geri al',()=>{post.hidden=false},5000);return}
  if(k==='report')toast('Çok yakında.','Tamam',()=>{},3000);
}

/* Kendi paylaşımını silme: önce onay. Silinince paylaşım ekrandan kalkar ve
   m360:silindi duyurulur (paylaşım sayfası Profil'e döner). */
let del=null,delPost=null,delToast=null;
function askDelete(post,toast){delPost=post;delToast=toast;
  if(!del){document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="delBg"></div><div class="sheet ex" id="delSheet" role="alertdialog" aria-modal="true" aria-labelledby="delTtl" aria-describedby="delTxt">'
     +'<div class="sh-grab"></div><div class="sh-hd"><h3 id="delTtl">Gönderi silinsin mi?</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div>'
     +'<p class="ex-t" id="delTxt">Fotoğrafları, yazısı ve yorumlarıyla birlikte silinir. Bu işlem geri alınamaz.</p>'
     +'<div class="ex-b"><button type="button" class="btn danger" id="delGo">Sil</button><button type="button" class="btn ghost" data-x>Vazgeç</button></div></div>');
    del=makeSheet(document.getElementById('delSheet'),document.getElementById('delBg'));
    document.getElementById('delGo').addEventListener('click',()=>{const p=delPost,id=p.dataset.post;deletePost(id);
      let done=false;const go=()=>{if(done)return;done=true;removeEventListener('popstate',go);
        p.remove();delToast('Gönderi silindi.','Tamam',()=>{},3000);document.dispatchEvent(new CustomEvent('m360:silindi',{detail:{id}}))};
      addEventListener('popstate',go);del.close();setTimeout(go,450)})}
  del.open(post.querySelector('.p-more'));
}

/* Beğen, kaydet, takip et: taslakta yalnızca ekranda değişir */
export function initPostActions(toast){
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('.pmenu')){const b=document.querySelector('.pmenu').parentElement.querySelector('.p-more');closeMenu();if(b)b.focus()}});
  document.addEventListener('click',e=>{
    const mb=e.target.closest('.p-more');
    if(mb){const open=mb.getAttribute('aria-expanded')==='true';if(open)closeMenu();else openMenu(mb);return}
    const mi=e.target.closest('[data-pm]');
    if(mi){const post=mi.closest('.post');closeMenu();menuAct(mi.dataset.pm,post,toast);return}
    if(!e.target.closest('.pmenu'))closeMenu();
    const b=e.target.closest('.act.like,.act.save,.follow');
    if(b){const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);
      if(b.classList.contains('like')){const n=b.querySelector('span');n.textContent=+n.textContent+(on?1:-1)}
      if(b.classList.contains('follow'))b.textContent=on?'Takiptesin':'Takip et';
      if(b.classList.contains('save'))toast(on?'Paylaşım kaydedildi':'Kayıttan çıkarıldı','Tamam',()=>{},2500);
      return}
    const tg=e.target.closest('[data-birlikte]');
    if(tg){import('./birlikte.js').then(m=>m.openTogether(tg,tg.dataset.birlikte));return}
    const s=e.target.closest('[data-share]');
    if(s){const url=location.href;if(navigator.share){navigator.share({title:'mola360',url}).catch(()=>{})}else if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>toast('Bağlantı kopyalandı.','Tamam',()=>{},3000),()=>{});return}
    if(e.target.closest('.act[data-soon]'))toast('Çok yakında.','Tamam',()=>{},3000);
  });
}
