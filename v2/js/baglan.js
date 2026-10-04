/* Bağlan: gerçek insanların paylaşımları, her biri bağlı olduğu ürünle */
import { renderShell } from './shell.js';
import { listPosts, listSuggestions, weekTraveler } from './api.js';
import { postCard, initPostActions, ava, postUrl } from './cards.js';
import { initFavorites } from './favorites.js';
import { VERIFIED, STAR } from './icons.js';
import { toast } from './ui.js';
import { IC } from './icons.js';
import { initStories } from './hikaye.js';

renderShell('baglan');
initPostActions(toast);
initFavorites();
initStories(document.getElementById('hikayeler'));

const feed=document.getElementById('feed');
/* Akış seçimi bir filtre: aynı paylaşımlara farklı bakış. Takip ve konum gerçek veriyle gelecek. */
const FEEDS={
  sen:()=>listPosts(),
  takip:()=>[],
  yakin:()=>listPosts().filter(p=>/İzmir/.test(p.place))};
/* Yeni insanlar keşfet: akışın içinde yatay öneri şeridi (Senin için'de 2. paylaşımdan sonra, boş takip akışında altta) */
const people=()=>{const l=listSuggestions();return l.length?'<section class="ppl" aria-labelledby="h-ppl"><div class="ppl-hd"><h2 id="h-ppl">Yeni insanlar keşfet</h2></div>'
  +'<div class="ppl-row">'+l.map(x=>'<article class="ppl-c" data-ppl="'+x.id+'"><button type="button" class="ppl-x" aria-label="Öneriyi kaldır">'+IC.close+'</button>'
    +ava(x.user,'m')+'<b>'+x.user.ad+(x.user.onay?VERIFIED:'')+'</b><small>@'+x.user.kul+'</small><p>'+x.why+'</p>'
    +'<button type="button" class="follow" aria-pressed="false">Takip et</button></article>').join('')+'</div></section>':''};
/* Haftanın gezgini: geçen hafta en çok kaydedilen paylaşımın sahibi; Molapuan kazanır */
const week=()=>{const w=weekTraveler();if(!w)return '';const p=w.post,u=p.user;
  return '<section class="wk" aria-labelledby="h-wk"><a class="wk-a" href="'+postUrl(p.id)+'">'
   +'<span class="wk-av">'+ava(u,'m')+'<i aria-hidden="true">'+STAR+'</i></span>'
   +'<span class="wk-x"><small id="h-wk">Haftanın gezgini</small><b>@'+u.kul+(u.onay?VERIFIED:'')+'</b>'
   +'<span>'+(p.product?p.product.title:'Paylaşımı')+' paylaşımı '+w.saves+' kez kaydedildi</span>'
   +'<em>+'+w.points+' Molapuan kazandı</em></span>'
   +'<span class="wk-t" style="background:'+p.bg+'" aria-hidden="true"></span></a>'
   +'<button type="button" class="wk-q" aria-label="Haftanın gezgini nasıl seçilir?">?</button></section>'};
function show(k){
  const list=FEEDS[k]();
  feed.innerHTML=list.length?(k==='sen'?week():'')+list.map((p,i)=>postCard(p)+(k==='sen'&&i===1?people():'')).join('')
    :'<div class="empty"><span class="ei">'+IC.users+'</span><b>Henüz kimseyi takip etmiyorsun</b><p>Beğendiğin paylaşımlarda "Takip et"e dokun; onların yeni deneyimleri burada görünür.</p><button type="button" class="btn" data-feed-go="sen">Senin için akışına dön</button></div>'+people();
  if(k==='yakin')feed.insertAdjacentHTML('afterbegin','<p class="feed-note">Konum: İzmir</p>');
  document.querySelectorAll('[data-feed]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.feed===k));
}
document.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('[data-feed]');if(b)show(b.dataset.feed)});
feed.addEventListener('click',e=>{const b=e.target.closest('[data-feed-go]');if(b)show(b.dataset.feedGo);
  if(e.target.closest('.wk-q')){toast('Her pazartesi, geçen hafta en çok kaydedilen paylaşımın sahibi seçilir ve '+(weekTraveler()||{}).points+' Molapuan kazanır.','Tamam',()=>{},6000);return}
  const x=e.target.closest('.ppl-x');if(x){const s=x.closest('.ppl');x.closest('.ppl-c').remove();if(!s.querySelector('.ppl-c'))s.remove()}});
show('sen');

/* Keşfet'ten gelinen paylaşım (#p3) ekrana getirilir */
const hit=location.hash&&document.querySelector('[data-post="'+location.hash.slice(1)+'"]');
if(hit)hit.scrollIntoView({block:'start'});

/* Yeni paylaşım: akışın başına gelir */
document.addEventListener('m360:paylasildi',e=>{show('sen');const el=document.querySelector('[data-post="'+e.detail.id+'"]');if(el)el.scrollIntoView({block:'start',behavior:'smooth'})});
