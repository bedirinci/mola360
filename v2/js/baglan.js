/* Bağlan: gerçek insanların paylaşımları, her biri bağlı olduğu ürünle */
import { renderShell } from './shell.js';
import { listPosts } from './api.js';
import { postCard, initPostActions } from './cards.js';
import { toast } from './ui.js';
import { IC } from './icons.js';

renderShell('baglan');
initPostActions(toast);

const feed=document.getElementById('feed');
/* Akış seçimi bir filtre: aynı paylaşımlara farklı bakış. Takip ve konum gerçek veriyle gelecek. */
const FEEDS={
  sen:()=>listPosts(),
  takip:()=>[],
  yakin:()=>listPosts().filter(p=>/İzmir/.test(p.place))};
function show(k){
  const list=FEEDS[k]();
  feed.innerHTML=list.length?list.map(postCard).join('')
    :'<div class="empty"><span class="ei">'+IC.users+'</span><b>Henüz kimseyi takip etmiyorsun</b><p>Beğendiğin paylaşımlarda "Takip et"e dokun; onların yeni deneyimleri burada görünür.</p><button type="button" class="btn" data-feed-go="sen">Senin için akışına dön</button></div>';
  if(k==='yakin')feed.insertAdjacentHTML('afterbegin','<p class="feed-note">Konum: İzmir</p>');
  document.querySelectorAll('[data-feed]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.feed===k));
}
document.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('[data-feed]');if(b)show(b.dataset.feed)});
feed.addEventListener('click',e=>{const b=e.target.closest('[data-feed-go]');if(b)show(b.dataset.feedGo)});
show('sen');

/* Keşfet'ten gelinen paylaşım (#p3) ekrana getirilir */
const hit=location.hash&&document.querySelector('[data-post="'+location.hash.slice(1)+'"]');
if(hit)hit.scrollIntoView({block:'start'});

/* Yeni paylaşım: akışın başına gelir */
document.addEventListener('m360:paylasildi',e=>{show('sen');const el=document.querySelector('[data-post="'+e.detail.id+'"]');if(el)el.scrollIntoView({block:'start',behavior:'smooth'})});
