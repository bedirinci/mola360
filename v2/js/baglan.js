/* Bağlan: gerçek insanların paylaşımları, her biri bağlı olduğu ürünle */
import { renderShell } from './shell.js';
import { listPosts, listSuggestions, weekTraveler } from './api.js';
import { postCard, initPostActions, ava, postUrl, userUrl } from './cards.js';
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
    +'<a class="ppl-a" href="'+userUrl(x.user)+'">'+ava(x.user,'m')+'<b>'+x.user.ad+(x.user.onay?VERIFIED:'')+'</b><small>@'+x.user.kul+'</small></a><p>'+x.why+'</p>'
    +'<button type="button" class="follow" aria-pressed="false">Takip et</button></article>').join('')+'</div></section>':''};
/* Haftanın gezgini: geçen hafta en çok kaydedilen paylaşımın sahibi; Molapuan kazanır.
   İnce kart; x ile kapatılınca o hafta bir daha çıkmaz (m360-hafta). */
const WK='m360-hafta';
const weekOff=w=>{try{return localStorage.getItem(WK)===w.post.id}catch(e){return false}};
const nf=n=>n.toLocaleString('tr-TR');
const week=()=>{const w=weekTraveler();if(!w||weekOff(w))return '';const p=w.post,u=p.user;
  return '<section class="wk" aria-label="Haftanın gezgini"><a class="wk-a" href="'+postUrl(p.id)+'">'
   +'<span class="wk-av">'+ava(u)+'<i aria-hidden="true">'+STAR+'</i></span>'
   +'<span class="wk-x"><small>Haftanın gezgini</small><b>@'+u.kul+(u.onay?VERIFIED:'')+'</b>'
   +'<span>'+nf(w.total)+' etkileşim · <em>+'+w.points+' Molapuan</em></span></span>'
   +'<span class="wk-t" style="background:'+p.bg+'" aria-hidden="true"></span></a>'
   +'<button type="button" class="wk-q" aria-label="Haftanın gezgini nasıl seçilir?">?</button>'
   +'<button type="button" class="wk-c" aria-label="Haftanın gezgini kartını kapat">'+IC.close+'</button></section>'};
function show(k){
  const list=FEEDS[k]();
  feed.innerHTML=list.length?(k==='sen'?week():'')+list.map((p,i)=>postCard(p)+(k==='sen'&&i===1?people():'')).join('')
    :'<div class="empty"><span class="ei">'+IC.users+'</span><b>Henüz kimseyi takip etmiyorsun</b><p>Beğendiğin paylaşımlarda "Takip et"e dokun; onların yeni deneyimleri burada görünür.</p><button type="button" class="btn" data-feed-go="sen">Senin için akışına dön</button></div>'+people();
  if(k==='yakin')feed.insertAdjacentHTML('afterbegin','<p class="feed-note">Konum: İzmir</p>');
  document.querySelectorAll('[data-feed]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.feed===k));
}
document.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('[data-feed]');if(b)show(b.dataset.feed)});
feed.addEventListener('click',e=>{const b=e.target.closest('[data-feed-go]');if(b)show(b.dataset.feedGo);
  if(e.target.closest('.wk-q')){const w=weekTraveler();toast('Her pazartesi, geçen haftanın etkileşim toplamı en yüksek paylaşımı seçilir: '+nf(w.likes)+' beğeni, '+nf(w.comments)+' yorum, '+nf(w.saves)+' kayıt, '+nf(w.shares)+' paylaşım. Sahibi '+w.points+' Molapuan kazanır.','Tamam',()=>{},7000);return}
  if(e.target.closest('.wk-c')){const w=weekTraveler();try{localStorage.setItem(WK,w.post.id)}catch(er){}e.target.closest('.wk').remove();return}
  const x=e.target.closest('.ppl-x');if(x){const s=x.closest('.ppl');x.closest('.ppl-c').remove();if(!s.querySelector('.ppl-c'))s.remove()}});
show('sen');

/* Keşfet'ten gelinen paylaşım (#p3) ekrana getirilir */
const hit=location.hash&&document.querySelector('[data-post="'+location.hash.slice(1)+'"]');
if(hit)hit.scrollIntoView({block:'start'});

/* Yeni paylaşım: akışın başına gelir */
document.addEventListener('m360:paylasildi',e=>{show('sen');const el=document.querySelector('[data-post="'+e.detail.id+'"]');if(el)el.scrollIntoView({block:'start',behavior:'smooth'})});
