/* Bağlan hikayeleri: akışın üstünde ince bir satır ve tam ekran izleyici.
   Satırda önce "Hikayen", sonra Mola360'ın hikayeleri (sahnede, hafta sonu,
   temalar), sonra takip edilenler. Her karenin altında bağlı deneyim. */
import { listStories, myStory, ME } from './api.js';
import { STAR, IC, PIN, VERIFIED } from './icons.js';
import { lvOn, lvPrice } from './level.js';
import { ROOT } from './root.js';
import { ava } from './cards.js';
import { toast, tl } from './ui.js';
import { openShare } from './shell.js';

const DUR=5000;
const SK='m360-hikaye';
const seen=()=>{try{return JSON.parse(localStorage.getItem(SK))||[]}catch(e){return []}};
const markSeen=id=>{try{localStorage.setItem(SK,JSON.stringify([...new Set([...seen(),id])]))}catch(e){}};
const LOGO_K='<img src="'+ROOT+'logo-koyu.webp" alt="Mola360" width="44" height="18">';
const placeOf=p=>p.place.split(' · ')[0];

let stories=[],mine=null,row;
const load=()=>{mine=myStory();stories=mine?[mine,...listStories()]:listStories()};

/* ---- Satır ---- */
function item(s,isSeen){
  const inner=s.kind==='mola'
    ?'<span class="hk-in m" style="background:'+s.bg+'">'+IC[s.icon]+'</span><span class="hk-logo">'+LOGO_K+'</span>'
    :'<span class="hk-in">'+ava(s.user)+'</span>';
  return '<button type="button" class="hk'+(isSeen?' seen':'')+'" data-hk="'+s.id+'" aria-label="'+(s.kind==='mola'?s.title:s.user.kul)+' hikayesi'+(isSeen?'':', yeni')+'">'
   +'<span class="hk-c">'+inner+'</span><span class="hk-n">'+(s.kind==='mola'?s.label:s.user.kul)+'</span></button>';
}
function drawRow(){
  const sn=seen();
  /* görülmemişler önde; Mola360'ın hikayeleri hep kişilerden önce */
  const ord=stories.filter(s=>!s.mine).sort((a,b)=>(a.kind!==b.kind?(a.kind==='mola'?-1:1):0)||(sn.includes(a.id)-sn.includes(b.id)));
  /* hikayen varsa halka görünür ve dokununca açılır; yoksa + ile hikaye eklenir */
  row.innerHTML=(mine
     ?'<button type="button" class="hk me'+(sn.includes(mine.id)?' seen':'')+'" data-hk="h-me" aria-label="Hikayen"><span class="hk-c"><span class="hk-in">'+ava(ME)+'</span></span><span class="hk-n">Hikayen</span></button>'
     :'<button type="button" class="hk me" data-hk-me aria-label="Hikaye ekle"><span class="hk-c"><span class="hk-in">'+ava(ME)+'</span><i class="hk-plus" aria-hidden="true">'+IC.plus+'</i></span><span class="hk-n">Hikayen</span></button>')
   +ord.map(s=>item(s,sn.includes(s.id))).join('');
}

/* ---- İzleyici ---- */
let sv,cur=-1,fi=0,t0=0,el=0,raf=0,list=[];
function build(){
  sv=document.createElement('div');sv.className='sv';sv.setAttribute('role','dialog');sv.setAttribute('aria-modal','true');sv.hidden=true;
  sv.innerHTML='<div class="sv-m"></div><div class="sv-bars"></div><div class="sv-hd"></div>'
   +'<button type="button" class="sv-tap prev" aria-label="Önceki"></button><button type="button" class="sv-tap next" aria-label="Sonraki"></button>'
   +'<div class="sv-body"></div><div class="sv-ft"></div>';
  document.body.appendChild(sv);
  sv.addEventListener('click',onClick);
  /* basılı tut: durur; aşağı kaydır: kapanır */
  let y0=null,hold=0;
  sv.addEventListener('pointerdown',e=>{if(e.target.closest('a,input,.sv-x,.sv-act'))return;y0=e.clientY;hold=setTimeout(()=>sv.classList.add('hold'),180)});
  sv.addEventListener('pointerup',e=>{clearTimeout(hold);const dy=y0==null?0:e.clientY-y0;y0=null;
    if(dy>90){close();return}
    if(sv.classList.contains('hold')){sv.classList.remove('hold');e.preventDefault();sv.dataset.held='1';setTimeout(()=>delete sv.dataset.held,0)}});
  addEventListener('keydown',e=>{if(sv.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)});
  addEventListener('popstate',()=>{if(!sv.hidden&&!(history.state&&history.state.hk))close(true)});
}
function onClick(e){
  if(sv.dataset.held)return;
  if(e.target.closest('.sv-x')){close();return}
  const a=e.target.closest('[data-sva]');
  if(a){const k=a.dataset.sva;
    if(k==='like'){const on=a.getAttribute('aria-pressed')!=='true';a.setAttribute('aria-pressed',on)}
    if(k==='share'){const url=location.href.split('#')[0];if(navigator.share)navigator.share({title:'mola360',url}).catch(()=>{});
      else if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>toast('Bağlantı kopyalandı.','Tamam',()=>{},3000),()=>{})}
    return}
  if(e.target.closest('.sv-tap.next'))step(1);
  else if(e.target.closest('.sv-tap.prev'))step(-1);
}
function open(id){
  if(!sv)build();
  list=stories;cur=list.findIndex(s=>s.id===id);if(cur<0)return;fi=0;
  sv.hidden=false;document.documentElement.classList.add('sv-on');
  if(!(history.state&&history.state.hk)){const s=history.state||{};history.pushState({...s,hk:1,m360d:(s.m360d||0)+1},'')}
  show();requestAnimationFrame(()=>sv.classList.add('in'));
  sv.querySelector('.sv-x').focus({preventScroll:true});
}
function close(fromPop){
  if(!sv||sv.hidden)return;cancelAnimationFrame(raf);
  sv.classList.remove('in','hold');sv.hidden=true;document.documentElement.classList.remove('sv-on');
  if(!fromPop&&history.state&&history.state.hk)history.back();
  drawRow();
  const b=row.querySelector('[data-hk="'+(list[cur]&&list[cur].id)+'"]');if(b)b.focus({preventScroll:true});
}
function step(d){
  const s=list[cur];fi+=d;
  if(fi>=s.frames.length){if(cur+1<list.length){cur++;fi=0}else{close();return}}
  else if(fi<0){if(cur>0){cur--;fi=list[cur].frames.length-1}else fi=0}
  show();
}
/* Kişinin hikayesinde: ad, puan, tür ve yer (paylaşımdaki kartın eşi).
   Mola360'ın hikayesinde ad zaten büyük başlıkta; kartta fiyat ve indirim. */
function card(p,{mola,deal}={}){
  if(!p)return '';
  const off=deal&&lvOn(p.title),st=p.count?'<span class="st">'+STAR+p.score.toFixed(1).replace('.',',')+' <i>('+p.count+')</i></span>':'';
  return '<a class="sv-card" href="'+ROOT+'urun/?id='+p.id+'"><span class="pt" style="background:'+p.bg+'"></span><span class="x">'
   +(mola
     ?'<b class="pr">'+(off?'<s>'+tl(p.price)+'</s>':'')+tl(lvPrice(p.title,p.price))+'<i>'+(p.unit==='bilet'?'\'den':' '+p.unit)+'</i></b><small>'+(off?'<span class="off">%10 indirim</span>':st)+'<span class="w">'+p.type+'</span></small>'
     :'<b>'+p.title+'</b><small>'+st+'<span class="w">'+p.type+' · '+placeOf(p)+'</span></small>')
   +'</span><span class="sv-go">Deneyimi gör</span></a>';
}
function show(){
  const s=list[cur],f=s.frames[fi],mola=s.kind==='mola';
  /* kendi hikayende yer ve rozet her karede ayrı */
  const place=f.place!==undefined?f.place:s.place,ver=f.verified!==undefined?f.verified:s.verified;
  markSeen(s.id);
  sv.setAttribute('aria-label',(mola?s.title:s.user.kul)+' hikayesi, '+(fi+1)+'/'+s.frames.length);
  sv.querySelector('.sv-m').style.background=f.bg;
  sv.querySelector('.sv-bars').innerHTML=s.frames.map((_,i)=>'<span><i style="transform:scaleX('+(i<fi?1:0)+')"></i></span>').join('');
  sv.querySelector('.sv-hd').innerHTML=(mola
     ?'<img class="sv-logo" src="'+ROOT+'logo.webp" alt="Mola360" width="58" height="24"><span class="x"><b>'+s.title+'</b></span>'
     :ava(s.user,'s')+'<span class="x"><b>'+s.user.kul+(s.user.onay?VERIFIED:'')+'</b><small>'+s.when+'</small></span>')
   +'<button type="button" class="sv-x" aria-label="Kapat">'+IC.close+'</button>';
  sv.querySelector('.sv-body').innerHTML=(mola
     ?'<div class="sv-ed"><span class="ov">'+f.over+'</span><h2>'+f.title+'</h2><p>'+f.sub+'</p></div>'
     :(ver?'<span class="went">'+LOGO_K+' ile gitti</span>':'')+(f.text||place?'<div class="sv-cap'+(f.box?' box':'')+'">'+(f.text?'<p>'+f.text+'</p>':'')+(place?'<span class="loc">'+PIN+place+'</span>':'')+'</div>':''))
   +card(f.product,{mola,deal:f.deal});
  sv.querySelector('.sv-ft').innerHTML=(mola||s.mine?'':'<label class="sv-rep"><input type="text" placeholder="'+s.user.kul+' kişisine yanıt ver" enterkeyhint="send"></label>')
   +'<button type="button" class="sv-act" data-sva="like" aria-pressed="false" aria-label="Beğen">'+IC.heart+'</button>'
   +'<button type="button" class="sv-act" data-sva="share" aria-label="Paylaş">'+IC.share+'</button>';
  const rep=sv.querySelector('.sv-rep input');
  if(rep){rep.addEventListener('focus',()=>sv.classList.add('hold'));rep.addEventListener('blur',()=>sv.classList.remove('hold'));
    rep.addEventListener('keydown',e=>{if(e.key==='Enter'&&rep.value.trim()){rep.value='';rep.blur();toast('Çok yakında.','Tamam',()=>{},3000)}})}
  t0=performance.now();el=0;cancelAnimationFrame(raf);tick();
}
function tick(){
  raf=requestAnimationFrame(now=>{
    if(sv.classList.contains('hold')||document.hidden){t0=now-el;tick();return}
    el=now-t0;const bar=sv.querySelectorAll('.sv-bars i')[fi];if(bar)bar.style.transform='scaleX('+Math.min(1,el/DUR)+')';
    if(el>=DUR)step(1);else tick();
  });
}

export function initStories(el){
  row=el;load();drawRow();
  document.addEventListener('m360:hikaye',()=>{load();drawRow()});
  row.addEventListener('click',e=>{
    if(e.target.closest('[data-hk-me]')){openShare(e.target.closest('[data-hk-me]'),{mode:'hikaye'});return}
    const b=e.target.closest('[data-hk]');if(b)open(b.dataset.hk);
  });
  /* adresten açılan hikaye: ?hikaye=m-sahne */
  const q=new URLSearchParams(location.search).get('hikaye');if(q&&stories.some(s=>s.id===q))open(q);
}
