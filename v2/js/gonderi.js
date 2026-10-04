/* Paylaşımın kendi sayfası: paylaşım ve yorumları. Profil'deki kareler,
   Keşfet'teki küçük kartlar ve akıştaki yorum düğmesi buraya açılır. */
import { renderShell, backTo, goBack } from './shell.js';
import { getPost, listComments, addComment, ME } from './api.js';
import { postCard, initPostActions, ava, userUrl } from './cards.js';
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

/* yorum: ada dokununca profil; Yanıtla yorum kutusunu o kişiye açar. Yanıtlar yorumun altında. */
const cm=c=>'<li class="cmt'+(c.mine?' mine':'')+'" data-cm="'+c.id+'">'+'<a class="cm-av" href="'+userUrl(c.user)+'" aria-label="'+c.user.kul+' profili">'+ava(c.user,'s')+'</a><div class="x"><p><a class="cm-u" href="'+userUrl(c.user)+'">'+c.user.kul+'</a>'+(c.user.onay?VERIFIED:'')+' '+c.text.replace(/^@([\w.]+)/,(m,k)=>'<a class="cm-at" href="'+ROOT+'kisi/?u='+k+'">@'+k+'</a>')+'</p>'
  +'<small>'+c.when+(c.likes?' · '+c.likes+' beğeni':'')+(c.mine?'':'<button type="button" class="cm-rep" data-rep="'+(c.to||c.id)+'" data-kul="'+c.user.kul+'">Yanıtla</button>')+'</small>'
  +'<button type="button" class="cm-more" hidden aria-expanded="false"></button><ul class="cm-sub" hidden></ul></div>'
  +'<button type="button" class="cm-like" aria-pressed="false" aria-label="Yorumu beğen">'+IC.heart+'</button></li>';
const place=(ul,c)=>{const parent=c.to&&ul.querySelector('[data-cm="'+c.to+'"] > .x > .cm-sub');(parent||ul).insertAdjacentHTML('beforeend',cm(c));
  if(parent)more(parent);return (parent||ul).lastElementChild};
/* yanıtlar kapalı gelir: "Yanıtları gör (N)" açar, "Yanıtları gizle" kapatır */
const more=(sub,open)=>{const b=sub.previousElementSibling,n=sub.children.length;if(open!=null)sub.hidden=!open;
  b.hidden=!n;b.setAttribute('aria-expanded',String(!sub.hidden));b.textContent=sub.hidden?'Yanıtları gör ('+n+')':'Yanıtları gizle'};

if(!post){
  main.innerHTML='<div class="empty"><span class="ei">'+IC.comment+'</span><b>Bu gönderi artık yok</b><p>Paylaşan kişi gönderiyi silmiş olabilir.</p><a class="btn" href="'+ROOT+'baglan/">Bağlan\'a git</a></div>';
}else{
  document.title='mola360 — '+post.user.kul+' gönderisi';
  document.getElementById('gpSub').textContent='@'+post.user.kul;
  const list=listComments(post);
  main.innerHTML=postCard(post)
   +'<section class="cms" aria-labelledby="h-cm"><h2 id="h-cm">Yorumlar <span id="cmN">'+Math.max(post.comments||0,list.length)+'</span></h2>'
   +'<ul class="cm-l" id="cmL"></ul>'
   +(list.length?'':'<p class="cm-none" id="cmNone">İlk yorumu sen yaz.</p>')+'</section>';
  const ul=document.getElementById('cmL');list.forEach(c=>place(ul,c));
  /* yanıt modu: kutunun üstünde kime yanıt verildiği, x ile iptal */
  let to='';
  form.insertAdjacentHTML('afterbegin','<div class="cm-to" id="cmTo" hidden><span></span><button type="button" aria-label="Yanıtı iptal et">'+IC.close+'</button></div>');
  const toBar=document.getElementById('cmTo');
  const reply=(id,kul)=>{to=id;toBar.hidden=false;toBar.querySelector('span').textContent='@'+kul+' kişisine yanıt veriyorsun';
    if(!txt.value.startsWith('@'+kul))txt.value='@'+kul+' '+txt.value.replace(/^@\S+\s*/,'');go.disabled=false;txt.focus()};
  const unreply=()=>{to='';toBar.hidden=true;txt.value=txt.value.replace(/^@\S+\s*/,'');go.disabled=!txt.value.trim()};
  toBar.querySelector('button').addEventListener('click',()=>{unreply();txt.focus()});
  form.hidden=false;
  document.getElementById('cmMe').textContent=ME.ini;document.getElementById('cmMe').style.setProperty('--c',ME.renk);
  /* akıştaki yorum düğmesi burada yorum kutusuna götürür */
  main.addEventListener('click',e=>{
    const c=e.target.closest('.act.cm');if(c){e.preventDefault();txt.focus();return}
    const m=e.target.closest('.cm-more');if(m){more(m.nextElementSibling,m.nextElementSibling.hidden);return}
    const r=e.target.closest('.cm-rep');if(r){reply(r.dataset.rep,r.dataset.kul);return}
    const l=e.target.closest('.cm-like');if(l)l.setAttribute('aria-pressed',l.getAttribute('aria-pressed')!=='true');
  });
  txt.addEventListener('input',()=>{go.disabled=!txt.value.trim()});
  form.addEventListener('submit',e=>{e.preventDefault();if(to&&/^@\S+\s*$/.test(txt.value))return;const c=addComment(post.id,txt.value,to);if(!c)return;
    const li=place(ul,c);if(c.to)more(li.parentElement,true);
    const n=document.getElementById('cmNone');if(n)n.remove();
    const k=document.getElementById('cmN');k.textContent=+k.textContent+1;
    const a=main.querySelector('.act.cm span');if(a)a.textContent=+a.textContent+1;
    txt.value='';go.disabled=true;to='';toBar.hidden=true;li.scrollIntoView({block:'nearest',behavior:'smooth'})});
  /* paylaşım silinince geldiği yere (yoksa Profil'e) dön */
  document.addEventListener('m360:silindi',()=>{form.hidden=true;
    const t=backTo(ROOT+'profil/');setTimeout(()=>{if(t&&(t.back||typeof t.go==='number'))goBack(t);else location.replace(t?t.url:ROOT+'profil/')},700)});
  if(location.hash==='#yorum')setTimeout(()=>txt.focus(),300);
  /* bildirimden gelince yorumlara in */
  if(location.hash==='#yorumlar')setTimeout(()=>document.getElementById('h-cm').scrollIntoView({block:'start'}),120);
}
