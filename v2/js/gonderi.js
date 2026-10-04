/* Paylaşımın kendi sayfası: paylaşım ve yorumları. Profil'deki kareler,
   Keşfet'teki küçük kartlar ve akıştaki yorum düğmesi buraya açılır. */
import { renderShell, backTo } from './shell.js';
import { getPost, listComments, addComment, ME } from './api.js';
import { postCard, initPostActions, ava } from './cards.js';
import { initFavorites } from './favorites.js';
import { toast } from './ui.js';
import { IC, VERIFIED } from './icons.js';
import { ROOT } from './root.js';

renderShell('baglan',{nav:false});
initPostActions(toast);
initFavorites();

const main=document.getElementById('gp'),form=document.getElementById('cmIn'),txt=document.getElementById('cmTxt'),go=document.getElementById('cmGo');
const id=new URLSearchParams(location.search).get('id');
const post=getPost(id);

const cm=c=>'<li class="cmt'+(c.mine?' mine':'')+'">'+ava(c.user,'s')+'<div class="x"><p><b>'+c.user.kul+(c.user.onay?VERIFIED:'')+'</b> '+c.text+'</p>'
  +'<small>'+c.when+(c.likes?' · '+c.likes+' beğeni':'')+'</small></div>'
  +'<button type="button" class="cm-like" aria-pressed="false" aria-label="Yorumu beğen">'+IC.heart+'</button></li>';

if(!post){
  main.innerHTML='<div class="empty"><span class="ei">'+IC.comment+'</span><b>Bu gönderi artık yok</b><p>Paylaşan kişi gönderiyi silmiş olabilir.</p><a class="btn" href="'+ROOT+'baglan/">Bağlan\'a git</a></div>';
}else{
  document.title='mola360 — '+post.user.kul+' gönderisi';
  const list=listComments(post);
  main.innerHTML=postCard(post)
   +'<section class="cms" aria-labelledby="h-cm"><h2 id="h-cm">Yorumlar <span id="cmN">'+Math.max(post.comments||0,list.length)+'</span></h2>'
   +'<ul class="cm-l" id="cmL">'+list.map(cm).join('')+'</ul>'
   +(list.length?'':'<p class="cm-none" id="cmNone">İlk yorumu sen yaz.</p>')+'</section>';
  form.hidden=false;
  document.getElementById('cmMe').textContent=ME.ini;document.getElementById('cmMe').style.setProperty('--c',ME.renk);
  /* akıştaki yorum düğmesi burada yorum kutusuna götürür */
  main.addEventListener('click',e=>{
    const c=e.target.closest('.act.cm');if(c){e.preventDefault();txt.focus();return}
    const l=e.target.closest('.cm-like');if(l)l.setAttribute('aria-pressed',l.getAttribute('aria-pressed')!=='true');
  });
  txt.addEventListener('input',()=>{go.disabled=!txt.value.trim()});
  form.addEventListener('submit',e=>{e.preventDefault();const c=addComment(post.id,txt.value);if(!c)return;
    document.getElementById('cmL').insertAdjacentHTML('beforeend',cm(c));
    const n=document.getElementById('cmNone');if(n)n.remove();
    const k=document.getElementById('cmN');k.textContent=+k.textContent+1;
    const a=main.querySelector('.act.cm span');if(a)a.textContent=+a.textContent+1;
    txt.value='';go.disabled=true;document.getElementById('cmL').lastElementChild.scrollIntoView({block:'nearest',behavior:'smooth'})});
  /* paylaşım silinince geldiği yere (yoksa Profil'e) dön */
  document.addEventListener('m360:silindi',()=>{form.hidden=true;
    const t=backTo(ROOT+'profil/');setTimeout(()=>{if(t&&t.back)history.back();else location.replace(t?t.url:ROOT+'profil/')},700)});
  if(location.hash==='#yorum')setTimeout(()=>txt.focus(),300);
}
