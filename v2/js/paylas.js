/* Paylaş: Bağlan'a yeni deneyim paylaşımı, Instagram gibi iki adım.
   Alt menünün yanındaki yuvarlak düğme ve geçmiş rezervasyonlardaki
   "Deneyimini paylaş" önce telefonun galerisini açar (shell.js pickAndShare),
   seçilen görsellerle bu ekran gelir:
   1) Yeni paylaşım: büyük önizleme, seçilenler şeridi, en az POST_MIN (2)
      fotoğraf ya da video; "İleri".
   2) Bilgiler: kısa not, bağlı deneyim, kiminle; "Paylaş".
   Mola360'tan rezerve edip yaşadığın deneyime bağlanan paylaşım "Mola360
   ile gitti" rozeti alır; başka bir deneyime bağlanan almaz. Taslakta
   paylaşım yalnızca bu cihazda tutulur (api.js createPost). */
import { listPastBookings, suggest, getProduct, createPost, POST_MIN } from './api.js';
import { makeSheet, toast } from './ui.js';
import { IC } from './icons.js';
import { ROOT } from './root.js';

const MAX=10,NOTE=300;
const WITH=['Tek başıma','Sevgilimle','Arkadaşlarla','Ailemle','Çocuklarla','İş arkadaşlarımla'];
const h=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const PICK='<input type="file" class="sr" accept="image/*,video/*" multiple data-pick>';

const HTML=`<div class="sh-bg" id="psBg" hidden></div>
<div class="cmp" id="psSheet" role="dialog" aria-modal="true" aria-labelledby="psTtl">
  <header class="cmp-top">
    <button type="button" class="cmp-l" id="psBack">İptal</button>
    <h3 id="psTtl">Yeni paylaşım</h3>
    <button type="button" class="cmp-r" id="psGo" disabled>İleri</button>
  </header>
  <section class="cmp-s1" id="psS1" aria-label="Görseller">
    <div class="cmp-big" id="psBig"></div>
    <div class="cmp-bar"><b id="psCount"></b><span id="psNeed1" class="cmp-need"></span></div>
    <div class="cmp-strip" id="psStrip"></div>
  </section>
  <section class="cmp-s2" id="psS2" hidden aria-label="Bilgiler">
    <p id="psNeed" class="ps-need" aria-live="polite"></p>
    <div class="cmp-note"><span class="cmp-th" id="psTh"></span>
      <div class="ps-note"><textarea id="psNote" rows="3" maxlength="${NOTE}" placeholder="Nasıldı? Birkaç cümle yaz…" aria-label="Nasıldı?"></textarea><small id="psCnt" aria-live="polite">0 / ${NOTE}</small></div>
    </div>
    <section class="ps-sec" aria-labelledby="psH2"><h4 id="psH2">Hangi deneyim?</h4>
      <div id="psPast"></div>
      <p class="ps-lbl">Başka bir deneyim</p>
      <div id="psSel"></div>
      <div class="ps-q">${IC.search}<input type="search" id="psQ" placeholder="Deneyim adı ya da yer" autocomplete="off" enterkeyhint="search" aria-label="Başka bir deneyim ara"></div>
      <div id="psRes" aria-live="polite"></div>
    </section>
    <section class="ps-sec" aria-labelledby="psH3"><h4 id="psH3">Kiminle gittin?</h4>
      <div class="ps-with" role="radiogroup" aria-labelledby="psH3">${WITH.map(w=>'<button type="button" class="fc" role="radio" aria-checked="false" data-with="'+w+'">'+w+'</button>').join('')}</div>
    </section>
  </section>
</div>`;

let sheet,st;
const $=id=>document.getElementById(id);
const fresh=()=>({media:[],cur:0,step:1,productId:'',q:'',with:'',note:''});

/* Önizleme: görsel küçültülür (en fazla 720 px); videodan ilk kare */
function shrink(src,w,h0){const k=Math.min(1,720/Math.max(w,h0)),c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h0*k);
  c.getContext('2d').drawImage(src,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.72)}
function thumbOf(m){return new Promise(res=>{
  if(m.video){const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='metadata';v.src=m.url;
    v.onloadeddata=()=>{v.currentTime=Math.min(.5,(v.duration||1)/2)};v.onseeked=()=>{try{res(shrink(v,v.videoWidth,v.videoHeight))}catch(e){res('')}};v.onerror=()=>res('');return}
  const i=new Image();i.onload=()=>{try{res(shrink(i,i.naturalWidth,i.naturalHeight))}catch(e){res('')}};i.onerror=()=>res('');i.src=m.url})}

const view=(m,ctl)=>m.video?'<video src="'+m.url+'" muted playsinline preload="metadata"'+(ctl?' controls':'')+'></video>':'<img src="'+m.url+'" alt="">';
function addFiles(list){
  const files=[...list].filter(f=>/^(image|video)\//.test(f.type)).slice(0,MAX-st.media.length);
  if(!files.length)return;
  st.media.push(...files.map(f=>({url:URL.createObjectURL(f),video:f.type.startsWith('video/')})));
  st.cur=st.media.length-files.length;
}

/* 1. adım: büyük önizleme ve seçilenler şeridi */
function drawMedia(){
  const n=st.media.length,m=st.media[st.cur];
  $('psBig').innerHTML=m?view(m,true):'<label class="cmp-empty">'+PICK+IC.image+'<b>Galeriden seç</b><span>En az '+POST_MIN+' fotoğraf ya da video</span></label>';
  $('psCount').textContent=n?n+' seçildi':'';
  $('psNeed1').textContent=n&&n<POST_MIN?'En az '+POST_MIN+' görsel seç':'';
  $('psStrip').innerHTML=st.media.map((x,i)=>'<div class="cmp-t'+(i===st.cur?' on':'')+'"><button type="button" class="cmp-tb" data-cur="'+i+'" aria-label="'+(i+1)+'. görseli göster"'+(i===st.cur?' aria-current="true"':'')+'>'+view(x)+(x.video?IC.play:'')+'</button>'
    +'<button type="button" class="ps-rm" data-rm="'+i+'" aria-label="'+(i+1)+'. görseli kaldır">'+IC.close+'</button></div>').join('')
   +(n&&n<MAX?'<label class="cmp-add">'+PICK+IC.plus+'<span>Ekle</span></label>':'');
}

const row=(p,{went,sub})=>{const on=st.productId===p.id;
  return '<button type="button" class="ps-opt" role="radio" aria-checked="'+on+'" data-pid="'+p.id+'"><span class="pt" style="background:'+p.bg+'"></span>'
   +'<span class="x"><b>'+p.title+'</b><small>'+sub+'</small>'+(went?'<em class="ps-went">'+IC.check+'Mola360 ile gitti</em>':'')+'</span><i aria-hidden="true"></i></button>'};
function drawPick(){
  const past=listPastBookings(),pastIds=past.map(b=>b.productId);
  const sel=st.productId&&!pastIds.includes(st.productId)?getProduct(st.productId):null;
  const q=st.q.trim(),found=q?suggest(q).products.filter(p=>!pastIds.includes(p.id)&&p.id!==st.productId):[];
  $('psPast').innerHTML=past.length?'<p class="ps-lbl" id="psL1">Mola360 ile gittiklerin</p><div class="ps-list" role="radiogroup" aria-labelledby="psL1">'
     +past.map(b=>row(b.product,{went:true,sub:b.when})).join('')+'</div>':'';
  $('psSel').innerHTML=sel?'<div class="ps-list" role="radiogroup" aria-label="Seçtiğin deneyim">'+row(sel,{sub:sel.type+' · '+sel.place.split(' · ')[0]})+'</div>':'';
  $('psRes').innerHTML=(found.length?'<div class="ps-list" role="radiogroup" aria-label="Arama sonuçları">'+found.map(p=>row(p,{sub:p.type+' · '+p.place.split(' · ')[0]})).join('')+'</div>'
     :q?'<p class="ps-none">“'+h(q)+'” bulunamadı.</p>':'')
   +(sel||found.length?'<p class="ps-hint">Mola360 dışından gittiğin deneyimde rozet görünmez.</p>':'');
}

/* Üstteki sağ düğme: 1. adımda İleri (en az 2 görsel), 2. adımda Paylaş (deneyim seçili) */
function check(){
  const go=$('psGo');
  if(st.step===1){go.textContent='İleri';go.disabled=st.media.length<POST_MIN;return}
  const need=!st.productId?'Paylaşımı bir deneyime bağla':'';
  $('psNeed').textContent=need;go.textContent='Paylaş';go.disabled=!!need;
}
function step(n){
  st.step=n;const sh=$('psSheet');sh.classList.toggle('s2',n===2);
  $('psS1').hidden=n!==1;$('psS2').hidden=n!==2;
  $('psTtl').textContent=n===1?'Yeni paylaşım':'Bilgiler';
  $('psBack').textContent=n===1?'İptal':'Geri';
  if(n===2){const m=st.media[0];$('psTh').innerHTML=m?view(m)+(st.media.length>1?'<em>'+st.media.length+'</em>':''):'';drawPick()}
  check();
}
function drawAll(){drawMedia();drawPick();
  document.querySelectorAll('[data-with]').forEach(b=>b.setAttribute('aria-checked',b.dataset.with===st.with));
  $('psQ').value=st.q;$('psNote').value=st.note;$('psCnt').textContent=st.note.length+' / '+NOTE;step(st.step)}
function discard(){st.media.forEach(m=>URL.revokeObjectURL(m.url));st=fresh()}

function build(){
  document.querySelector('script[type="module"]').insertAdjacentHTML('beforebegin',HTML);
  /* tam ekran: sürükleyerek kapanmaz (boş bir tutamak verilir) */
  sheet=makeSheet($('psSheet'),$('psBg'),{drag:document.createElement('div')});
  st=fresh();
  const sh=$('psSheet');
  sh.addEventListener('change',e=>{if(!e.target.matches('[data-pick]'))return;
    addFiles(e.target.files);drawMedia();check();$('psGo').focus()});
  sh.addEventListener('input',e=>{
    if(e.target.id==='psQ'){st.q=e.target.value;drawPick()}
    if(e.target.id==='psNote'){st.note=e.target.value;$('psCnt').textContent=st.note.length+' / '+NOTE}});
  sh.addEventListener('click',e=>{
    if(e.target.closest('#psBack')){if(st.step===2)step(1);else{discard();sheet.close()}return}
    if(e.target.closest('#psGo')){if(st.step===1)step(2);else share();return}
    const c=e.target.closest('[data-cur]');
    if(c){st.cur=+c.dataset.cur;drawMedia();sh.querySelector('[data-cur="'+st.cur+'"]').focus({preventScroll:true});return}
    const rm=e.target.closest('[data-rm]');
    if(rm){const i=+rm.dataset.rm,m=st.media.splice(i,1)[0];URL.revokeObjectURL(m.url);if(st.cur>=st.media.length)st.cur=Math.max(0,st.media.length-1);
      drawMedia();check();(sh.querySelector('[data-cur="'+st.cur+'"]')||sh.querySelector('[data-pick]')).focus();return}
    const o=e.target.closest('[data-pid]');
    if(o){const id=o.dataset.pid;st.productId=st.productId===id?'':id;if(st.productId){st.q='';$('psQ').value=''}drawPick();check();
      const n=sh.querySelector('[data-pid="'+id+'"]')||$('psQ');n.focus({preventScroll:true});return}
    const w=e.target.closest('[data-with]');
    if(w){st.with=st.with===w.dataset.with?'':w.dataset.with;document.querySelectorAll('[data-with]').forEach(b=>b.setAttribute('aria-checked',b.dataset.with===st.with));return}
  });
}

async function share(){
  const go=$('psGo');go.disabled=true;go.textContent='Paylaşılıyor…';
  const thumbs=(await Promise.all(st.media.slice(0,3).map(thumbOf))).filter(Boolean);
  const p=createPost({productId:st.productId,text:st.note.trim(),with:st.with,thumbs,media:st.media.length,video:!!st.media[0]&&st.media[0].video});
  if(!p){check();toast('Paylaşım kaydedilemedi, tekrar dene.','Tamam',()=>{},3500);return}
  discard();drawAll();sheet.close();
  document.dispatchEvent(new CustomEvent('m360:paylasildi',{detail:p}));
  if(!document.getElementById('feed'))toast('Paylaşımın Bağlan\'da','Gör',()=>{location.href=ROOT+'baglan/#'+p.id},5000);
  else toast('Paylaşımın Bağlan\'da','Tamam',()=>{},3000);
}

/* opts.files: galeriden seçilenler; opts.productId: geçmiş rezervasyondan
   gelince o deneyim seçili açılır */
export function openShare(from,{productId,files}={}){
  if(!sheet)build();
  if(files&&files.length){discard();addFiles(files);st.cur=0}
  if(productId&&getProduct(productId)){st.productId=productId;st.q=''}
  st.step=1;drawAll();sheet.open(from,$('psGo').disabled?($('psSheet').querySelector('[data-pick]')||$('psBack')):$('psGo'));
}
