/* Başkasının profili: kimlik, paylaşımlar ve yaşadığı deneyimler. Takip et
   ve Birlikte gidelim burada da çalışır (misafirde giriş çekmecesi açılır). */
import { renderShell } from './shell.js';
import { getUser, listUserPosts } from './api.js';
import { ava, plink, initPostActions, postUrl } from './cards.js';
import { toast } from './ui.js';
import { IC, VERIFIED, PIN } from './icons.js';
import { ROOT } from './root.js';

renderShell('baglan');
initPostActions(toast);

const u=getUser(new URLSearchParams(location.search).get('u'));
const head=document.getElementById('pfHead'),el=document.getElementById('pf');
const n=x=>x>=1000?(x/1000).toFixed(1).replace('.',',').replace(',0','')+' B':String(x);

if(!u){
  head.innerHTML='';
  el.innerHTML='<div class="empty"><span class="ei">'+IC.users+'</span><b>Bu profil bulunamadı</b><p>Kullanıcı adı değişmiş ya da hesap kapanmış olabilir.</p><a class="btn" href="'+ROOT+'baglan/">Bağlan\'a git</a></div>';
}else{
  document.title='mola360 — '+u.kul;
  document.getElementById('kTtl').textContent=u.kul;
  const posts=listUserPosts(u.kul);
  /* yaşadığı deneyimler: Mola360 ile gittiği paylaşımların deneyimleri */
  const went=[...new Map(posts.filter(p=>p.verified&&p.product).map(p=>[p.product.id,p.product])).values()];
  const STAT=(v,t,tab)=>tab?'<button type="button" data-go="'+tab+'"><b>'+v+'</b><span>'+t+'</span></button>':'<div><b>'+v+'</b><span>'+t+'</span></div>';
  head.innerHTML='<div class="pf-id">'+ava(u,'l')+'<div class="x"><div class="pf-nm"><b>'+u.ad+'</b>'+(u.onay?VERIFIED:'')+'</div>'
   +'<span class="pf-at">@'+u.kul+(u.city?'<i>·</i>'+PIN+u.city:'')+'</span></div></div>'
   +(u.bio?'<p class="pf-bio">'+u.bio+'</p>':'')
   +'<div class="pf-stats">'+STAT(posts.length,'paylaşım','pay')+STAT(went.length,'deneyim','den')+STAT(n(u.followers),'takipçi')+STAT(n(u.following),'takip')+'</div>'
   +'<div class="pf-acts"><button type="button" class="btn green follow k-follow" aria-pressed="false">Takip et</button>'
   +'<button type="button" class="btn ghost-d sq" data-share aria-label="Profili paylaş">'+IC.share+'</button></div>';
  const TABS={
    pay:()=>posts.length?'<div class="pf-sq">'+posts.map(x=>'<a href="'+postUrl(x.id)+'" style="background:'+x.bg+'" aria-label="'+(x.product?x.product.title+' paylaşımını aç':'Paylaşımı aç')+'"></a>').join('')+'</div>'
      :'<div class="empty"><span class="ei">'+IC.grid+'</span><b>Henüz paylaşım yok</b><p>'+u.kul+' paylaşım yaptığında burada görünecek.</p></div>',
    den:()=>went.length?'<div class="pf-went">'+went.map(plink).join('')+'</div>'
      :'<div class="empty"><span class="ei">'+IC.bag+'</span><b>Henüz deneyim yok</b><p>Mola360 ile gittiği deneyimler burada görünür.</p></div>'};
  el.innerHTML='<div class="seg light" role="group" aria-label="Profil" id="pfTabs"><button type="button" aria-pressed="true" data-t="pay">'+IC.grid+'Paylaşımlar</button><button type="button" aria-pressed="false" data-t="den">'+IC.bag+'Deneyimler</button></div><div id="pfBody"></div>';
  const body=document.getElementById('pfBody');
  const show=k=>{document.querySelectorAll('#pfTabs [data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===k));body.innerHTML=TABS[k]()};
  document.getElementById('pfTabs').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)show(b.dataset.t)});
  head.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){show(b.dataset.go);document.getElementById('pfTabs').scrollIntoView({behavior:'smooth',block:'start'})}});
  show('pay');
}
