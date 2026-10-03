/* Keşfet (anasayfa) */
import { ITEMS, BUCKETS, PL, EV, HT, VN, ABO, TABS, POP, TRUST, G } from './data.js';
import { I, PIN } from './icons.js';
import { tl, ttl, scoreOrNew, fitFacts, makeScroll, toast } from './ui.js';
import { getLevel, setLevel, lvOn, lvPrice, lvb, initLevelInfo } from './level.js';
import { heartBtn, favSync, initFavorites } from './favorites.js';
import { card, postMini, initPostActions } from './cards.js';
import { renderShell } from './shell.js';
import { listPosts } from './api.js';
import { initHelp } from './help.js';

renderShell('kesfet');

const tEl=document.getElementById('time'),rail=document.getElementById('timeRail'),rt=document.getElementById('railTitle');
tEl.innerHTML=BUCKETS.map(b=>{const n=ITEMS.filter(x=>x.b===b[0]).length;return '<button class="tt" aria-pressed="false" data-b="'+b[0]+'"><span class="n">'+b[1]+'</span><span class="l">'+b[2]+'</span><span class="c">'+n+' seçenek</span></button>'}).join('');
let shown=new Set();
let curB='hs',curF='all';
function pick(b){curB=b;
  tEl.querySelectorAll('.tt').forEach(e=>e.setAttribute('aria-pressed',e.dataset.b===b));
  rt.textContent=BUCKETS.find(x=>x[0]===b)[3];document.getElementById('railAll').href='liste/?sure='+b;
  const list=ITEMS.filter(x=>x.b===b);
  const ks=[...new Set(list.map(x=>PL[x.k]))].map((k,i)=>i?k.toLocaleLowerCase('tr'):k);
  document.getElementById('railSub').textContent=ks.length>1?ks.slice(0,-1).join(', ')+' ve '+ks[ks.length-1]:ks[0];
  rail.innerHTML=list.map(card).join('');fitFacts(rail);
  rail.scrollLeft=0;rail.dispatchEvent(new Event('scroll'));
  shown=new Set(list.map(x=>x.t));renderLower();
}
tEl.addEventListener('click',e=>{const t=e.target.closest('.tt');if(t)pick(t.dataset.b)});

/* Alt bölümler, yukarıdaki listede gösterilenleri tekrar etmiyor */
function renderLower(){
  const ev=EV.filter(e=>!shown.has(e[3])).slice(0,3);
  document.getElementById('events').innerHTML=ev.map(e=>'<article class="tk"><div class="stub"><span class="dw">'+e[0]+'</span><span class="dn">'+e[1]+'</span><span class="mo">EKİM</span></div><span class="notch t"></span><span class="notch b"></span>'
   +'<div class="tb"><div class="x"><div class="cat">'+e[2].toUpperCase()+'</div><h3>'+ttl(e[3])+'</h3><div class="meta">'+I.clock+'<span>'+e[4]+'</span></div><div class="p"><b>'+tl(e[5])+'</b>\'den başlayan</div>'+'</div>'
   +'<div class="thumb" style="background:'+G[e[6]]+'"></div></div></article>').join('');
  /* Mekânlarda tekrar filtresi yok: yalnızca iki mekân var, ikisi de her zaman görünsün */
  document.getElementById('venues').innerHTML=VN.map(v=>'<article class="cd"><div class="ph" style="--g:'+G[v.g]+'"><div class="tags"><span class="type">Mekân</span></div>'+lvb(v.t)+''+heartBtn(v.t)+'</div>'
   +'<div class="bd"><h3>'+ttl(v.t)+'</h3><div class="meta">'+I.pin+'<span>'+v.a+'</span></div>'
   +'<div class="dep"><div class="lbl">HİZMETLER</div><div class="dates"><span class="d svc">'+v.opts[0][0]+'<b>'+(lvOn(v.t)?'<s>'+tl(v.opts[0][1])+'</s> ':'')+tl(lvPrice(v.t,v.opts[0][1]))+'</b></span>'+(v.opts.length>1?'<span class="d more">+'+(v.opts.length-1)+'</span>':'')+'</div></div>'
   +'<div class="pr">'+scoreOrNew(v.s,v.c)+'<div class="price"><span class="mode">'+I.clock+v.mode+'</span>'+'</div></div></div></article>').join('');
  fitFacts(document.getElementById('venues'));
  const ht=HT.filter(h=>!shown.has(h[1])).slice(0,2);
  document.getElementById('hotels').innerHTML=ht.map(h=>'<article class="hc"><div class="ph" style="--g:'+G[h[7]]+'">'+heartBtn(h[1])+'</div>'
   +'<div class="x"><div class="stars" aria-label="Otel sınıfı">'+h[0]+'</div><h3>'+ttl(h[1])+'</h3><div class="meta">'+I.pin+'<span>'+h[2]+'</span></div>'+'<div class="hrow">'+scoreOrNew(h[3],h[4])+'<span class="pill">'+h[5]+'</span></div>'+lvb(h[1],'in')
   +'<div class="hfoot"><div class="hl-l"><span>2 gece toplam</span>'+'</div><div class="hl-r">'+(lvOn(h[1])?'<s class="old">'+tl(h[6]*2)+'</s>':'')+'<strong>'+tl(lvPrice(h[1],h[6]*2))+'</strong></div></div></div></article>').join('');
}
/* Yurt dışında tekrar filtresi yok: bölüm her zaman 4 ürünü gösteriyor */
const ab=document.getElementById('abroad');
const ABF={all:()=>true,kolay:x=>!x.visaReq,avrupa:x=>x.reg==='avrupa',uzak:x=>x.reg==='uzak'};
function renderAbroad(f){curF=f;ab.innerHTML=ABO.map(t=>ITEMS.find(x=>x.t===t)).filter(ABF[f]).map(card).join('');fitFacts(ab);ab.scrollLeft=0;ab.dispatchEvent(new Event('scroll'))}
document.querySelector('.fchips').addEventListener('click',e=>{const b=e.target.closest('.fc');if(!b)return;document.querySelectorAll('.fc').forEach(x=>x.setAttribute('aria-pressed',x===b));renderAbroad(b.dataset.f)});
renderAbroad('all');


/* taslak: misafir / üye görünümü */
document.querySelector('.demo').addEventListener('click',e=>{const b=e.target.closest('.dm');if(!b)return;setLevel(b.dataset.v);const m=getLevel()!=='guest';
  document.querySelectorAll('.dm').forEach(x=>x.setAttribute('aria-pressed',x===b));
  document.querySelectorAll('[data-member]').forEach(x=>x.hidden=!m);document.querySelectorAll('[data-guest]').forEach(x=>x.hidden=m);
  document.getElementById('lvlTxt').textContent=getLevel()==='kasif'?'Kâşif · 1.240 Molapuan':'Gezgin · 320 Molapuan';
  pick(curB);renderAbroad(curF);favSync()});
initLevelInfo();

/* güven şeridi: dokununca kısa açıklama */
const tin=document.getElementById('trustInfo');
document.querySelector('.trust').addEventListener('click',e=>{const b=e.target.closest('.tr');if(!b)return;const open=b.getAttribute('aria-expanded')!=='true';
  document.querySelectorAll('.tr').forEach(x=>x.setAttribute('aria-expanded',x===b&&open));
  tin.hidden=!open;if(open){const t=TRUST[b.dataset.t];tin.innerHTML='<b>'+t[0]+'</b><span>'+t[1]+'</span>'}});
pick('hs');
favSync();
window.addEventListener('resize',()=>document.querySelectorAll('.rail').forEach(fitFacts));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>document.querySelectorAll('.rail').forEach(fitFacts));

initFavorites();

/* sekmeye göre arama kutusu */
const pEl=document.getElementById('pchips'),f1=()=>document.querySelector('#f1 span');
let curTab='tur';
function renderPop(){pEl.innerHTML=POP[curTab].map(q=>'<button type="button" class="pc" aria-pressed="false">'+PIN+q+'</button>').join('');pEl.scrollLeft=0;pEl.dispatchEvent(new Event('scroll'))}
function resetWhere(){const sp=f1();sp.textContent=TABS[curTab][1];sp.classList.add('hint')}
pEl.addEventListener('click',e=>{const b=e.target.closest('.pc');if(!b)return;const on=b.getAttribute('aria-pressed')!=='true';
  pEl.querySelectorAll('.pc').forEach(x=>x.setAttribute('aria-pressed',x===b&&on));
  if(on){const sp=f1();sp.textContent=b.textContent;sp.classList.remove('hint')}else resetWhere()});
renderPop();
document.querySelector('.tabs').addEventListener('click',e=>{const t=e.target.closest('.tab');if(!t)return;curTab=t.dataset.tab;
  document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x===t));
  const v=TABS[t.dataset.tab];['f1','f2','f3'].forEach((id,i)=>{const f=document.getElementById(id);f.querySelector('small').textContent=v[i*2];f.querySelector('span').textContent=v[i*2+1]});
  document.getElementById('go').textContent=v[6];f1().classList.add('hint');renderPop();});

/* Bağlan önizlemesi: paylaşımlar bağlı oldukları ürünle */
document.getElementById('postRail').innerHTML=listPosts().map(postMini).join('');
initPostActions(toast);

/* Arama: seçili ürün türünün listesine gider */
document.getElementById('search').addEventListener('submit',()=>{location.href='liste/?tur='+curTab});

document.querySelectorAll('.rail').forEach(el=>makeScroll(el,true));
document.querySelectorAll('.tabs,.promise,.fchips,.trust,.pchips').forEach(el=>makeScroll(el,false));

initHelp();
