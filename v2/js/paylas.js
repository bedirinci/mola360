/* Paylaş: Bağlan'a yeni deneyim paylaşımı. Alt menünün yanındaki yuvarlak
   düğme ve geçmiş rezervasyonlardaki "Deneyimini paylaş" açar.
   1) en az POST_MIN (2) fotoğraf ya da video, 2) bağlı deneyim, 3) kiminle ve kısa not.
   Mola360'tan rezerve edip yaşadığın deneyime bağlanan paylaşım "Mola360
   ile gitti" rozeti alır; başka bir deneyime bağlanan almaz. Taslakta
   paylaşım yalnızca bu cihazda tutulur (api.js createPost). */
import { listPastBookings, suggest, getProduct, createPost, createStory, POST_MIN } from './api.js';
import { makeSheet, toast } from './ui.js';
import { IC, PIN } from './icons.js';
import { ROOT } from './root.js';

const MAX=10,NOTE=300;
const WITH=['Tek başıma','Sevgilimle','Arkadaşlarla','Ailemle','Çocuklarla','İş arkadaşlarımla'];
const h=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

const HTML=`<div class="sh-bg" id="psBg"></div>
<div class="sheet tall ps" id="psSheet" role="dialog" aria-modal="true" aria-labelledby="psTtl">
  <div class="ps-top" id="psDrag"><div class="sh-grab"></div>
    <div class="sh-hd"><h3 id="psTtl">Deneyimini paylaş</h3><button type="button" class="sh-x" data-x aria-label="Kapat">${IC.close}</button></div>
  </div>
  <div class="ps-body">
    <section class="ps-sec" aria-labelledby="psH1"><h4 id="psH1">Fotoğraf veya video <small id="psMinT">(en az ${POST_MIN})</small></h4>
      <div class="ps-media" id="psMedia"></div>
    </section>
    <section class="ps-sec" aria-labelledby="psH2"><h4 id="psH2">Hangi deneyim? <small id="psOpt" hidden>(isteğe bağlı)</small></h4>
      <div id="psPast"></div>
      <p class="ps-lbl">Başka bir deneyim</p>
      <div id="psSel"></div>
      <div class="ps-q">${IC.search}<input type="search" id="psQ" placeholder="Deneyim adı ya da yer" autocomplete="off" enterkeyhint="search" aria-label="Başka bir deneyim ara"></div>
      <div id="psRes" aria-live="polite"></div>
    </section>
    <section class="ps-sec" id="psWithSec" aria-labelledby="psH3"><h4 id="psH3">Kiminle gittin?</h4>
      <div class="ps-with" role="radiogroup" aria-labelledby="psH3">${WITH.map(w=>'<button type="button" class="fc" role="radio" aria-checked="false" data-with="'+w+'">'+w+'</button>').join('')}</div>
    </section>
    <section class="ps-sec"><label for="psNote"><h4 id="psNoteH">Nasıldı?</h4></label>
      <div class="ps-note"><textarea id="psNote" rows="3" maxlength="${NOTE}" placeholder="Birkaç cümle yeter"></textarea><small id="psCnt" aria-live="polite">0 / ${NOTE}</small></div>
    </section>
  </div>
  <div class="ps-foot"><p id="psNeed" class="ps-need"></p><button type="button" class="btn green ps-go" id="psGo" disabled>Paylaş</button></div>
</div>`;

/* Paylaş düğmesi önce ne paylaşılacağını sorar: hikaye ya da gönderi (Bedir) */
const CHOOSE=`<div class="sh-bg" id="pcBg"></div>
<div class="sheet ps-choose" id="pcSheet" role="dialog" aria-modal="true" aria-labelledby="pcTtl">
  <div class="sh-grab"></div>
  <div class="sh-hd"><h3 id="pcTtl">Ne paylaşmak istersin?</h3><button type="button" class="sh-x" data-x aria-label="Kapat">${IC.close}</button></div>
  <div class="pc-list">
    <button type="button" class="pc-o" data-mode="hikaye"><i class="pc-ic hk-ic">${IC.plus}</i><span><b>Hikaye</b><small>24 saat görünür, tek fotoğraf yeter</small></span>${IC.right}</button>
    <button type="button" class="pc-o" data-mode="post"><i class="pc-ic">${IC.grid}</i><span><b>Gönderi</b><small>Bağlan akışında ve profilinde kalır</small></span>${IC.right}</button>
  </div>
</div>`;
let chooser;

let sheet,st,mode='post';
const $=id=>document.getElementById(id);
const fresh=()=>({media:[],productId:'',custom:'',q:'',with:'',note:''});
const MIN=()=>mode==='hikaye'?1:POST_MIN;

/* Önizleme: görsel küçültülür (en fazla 720 px); videodan ilk kare */
function shrink(src,w,h0){const k=Math.min(1,720/Math.max(w,h0)),c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h0*k);
  c.getContext('2d').drawImage(src,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.72)}
function thumbOf(m){return new Promise(res=>{
  if(m.video){const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='metadata';v.src=m.url;
    v.onloadeddata=()=>{v.currentTime=Math.min(.5,(v.duration||1)/2)};v.onseeked=()=>{try{res(shrink(v,v.videoWidth,v.videoHeight))}catch(e){res('')}};v.onerror=()=>res('');return}
  const i=new Image();i.onload=()=>{try{res(shrink(i,i.naturalWidth,i.naturalHeight))}catch(e){res('')}};i.onerror=()=>res('');i.src=m.url})}

function drawMedia(){
  $('psMedia').innerHTML=st.media.map((m,i)=>'<div class="ps-th'+(m.video?' vid':'')+'">'+(m.video?'<video src="'+m.url+'" muted playsinline preload="metadata"></video>'+IC.play:'<img src="'+m.url+'" alt="">')
    +'<button type="button" class="ps-rm" data-rm="'+i+'" aria-label="'+(i+1)+'. medyayı kaldır">'+IC.close+'</button></div>').join('')
   +(st.media.length<MAX?'<label class="ps-add'+(st.media.length?'':' first')+'"><input type="file" class="sr" id="psFile" accept="image/*,video/*" multiple>'+IC.image+'<span>'+(st.media.length?'Ekle':MIN()>1?'En az '+MIN()+' fotoğraf ya da video seç':'Fotoğraf ya da video seç')+'</span></label>':'');
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
  /* sitede olmayan deneyim: yazılan ad seçenek olarak çıkar, sağında + (Bedir) */
  const exact=found.some(p=>p.title.toLocaleLowerCase('tr')===q.toLocaleLowerCase('tr'));
  const add=q&&!exact&&q!==st.custom?'<button type="button" class="ps-opt ps-new" data-new><span class="pt">'+PIN+'</span><span class="x"><b>'+h(q)+'</b><small>Yeni deneyim olarak ekle</small></span><i aria-hidden="true">'+IC.plus+'</i></button>':'';
  const mine=st.custom?'<button type="button" class="ps-opt ps-new" role="radio" aria-checked="true" data-custom><span class="pt">'+PIN+'</span><span class="x"><b>'+h(st.custom)+'</b><small>Mola360 dışı deneyim</small></span><i aria-hidden="true"></i></button>':'';
  $('psSel').innerHTML=sel||mine?'<div class="ps-list" role="radiogroup" aria-label="Seçtiğin deneyim">'+(sel?row(sel,{sub:sel.type+' · '+sel.place.split(' · ')[0]}):mine)+'</div>':'';
  $('psRes').innerHTML=(found.length||add?'<div class="ps-list" aria-label="Arama sonuçları">'+found.map(p=>row(p,{sub:p.type+' · '+p.place.split(' · ')[0]})).join('')+add+'</div>':'')
   +(sel||found.length||add||mine?'<p class="ps-hint">Mola360 dışından gittiğin deneyimde rozet görünmez.</p>':'');
}

function check(){
  const n=st.media.length,left=MIN()-n;
  if(mode==='hikaye'){const need=n?'':'Bir fotoğraf ya da video ekle';$('psNeed').textContent=need;$('psGo').disabled=!!need;return}
  const need=left>0&&!st.productId&&!st.custom?'En az '+POST_MIN+' fotoğraf ekle ve deneyim seç':left>1?'En az '+POST_MIN+' fotoğraf ya da video ekle'
    :left===1?(n?'Bir fotoğraf daha ekle':'Bir fotoğraf ya da video ekle'):!st.productId&&!st.custom?'Paylaşımı bir deneyime bağla':'';
  $('psNeed').textContent=need;$('psGo').disabled=!!need;
}
/* hikaye: tek görsel yeter, deneyim isteğe bağlı, kiminle sorulmaz */
function drawMode(){const hk=mode==='hikaye';
  $('psTtl').textContent=hk?'Hikaye paylaş':'Deneyimini paylaş';
  $('psMinT').textContent=hk?'':'(en az '+POST_MIN+')';$('psOpt').hidden=!hk;$('psWithSec').hidden=hk;
  $('psNoteH').textContent=hk?'Kısa not':'Nasıldı?';$('psGo').textContent=hk?'Hikayeni paylaş':'Paylaş'}
function drawAll(){drawMode();drawMedia();drawPick();
  document.querySelectorAll('[data-with]').forEach(b=>b.setAttribute('aria-checked',b.dataset.with===st.with));
  $('psQ').value=st.q;$('psNote').value=st.note;$('psCnt').textContent=st.note.length+' / '+NOTE;check()}

function build(){
  document.querySelector('script[type="module"]').insertAdjacentHTML('beforebegin',HTML);
  sheet=makeSheet($('psSheet'),$('psBg'),{drag:$('psDrag')});
  st=fresh();
  const sh=$('psSheet');
  sh.addEventListener('change',e=>{if(e.target.id!=='psFile')return;
    const files=[...e.target.files].filter(f=>/^(image|video)\//.test(f.type)).slice(0,MAX-st.media.length);
    st.media.push(...files.map(f=>({url:URL.createObjectURL(f),video:f.type.startsWith('video/')})));
    drawMedia();check();($('psFile')||$('psQ')).focus()});
  sh.addEventListener('input',e=>{
    if(e.target.id==='psQ'){st.q=e.target.value;drawPick()}
    if(e.target.id==='psNote'){st.note=e.target.value;$('psCnt').textContent=st.note.length+' / '+NOTE}});
  sh.addEventListener('click',e=>{
    const rm=e.target.closest('[data-rm]');
    if(rm){const m=st.media.splice(+rm.dataset.rm,1)[0];URL.revokeObjectURL(m.url);drawMedia();check();($('psFile')||sh.querySelector('[data-rm]')).focus();return}
    const o=e.target.closest('[data-pid]');
    const nw=e.target.closest('[data-new]');
    if(nw){st.custom=st.q.trim().slice(0,60);st.productId='';st.q='';$('psQ').value='';drawPick();check();
      (sh.querySelector('[data-custom]')||$('psQ')).focus({preventScroll:true});return}
    if(e.target.closest('[data-custom]')){st.custom='';drawPick();check();$('psQ').focus({preventScroll:true});return}
    if(o){const id=o.dataset.pid;st.productId=st.productId===id?'':id;if(st.productId){st.q='';$('psQ').value='';st.custom=''}drawPick();check();
      const n=sh.querySelector('[data-pid="'+id+'"]')||$('psQ');n.focus({preventScroll:true});return}
    const w=e.target.closest('[data-with]');
    if(w){st.with=st.with===w.dataset.with?'':w.dataset.with;document.querySelectorAll('[data-with]').forEach(b=>b.setAttribute('aria-checked',b.dataset.with===st.with));return}
    if(e.target.closest('#psGo'))share();
  });
}

async function shareStory(){
  const go=$('psGo');go.disabled=true;go.textContent='Paylaşılıyor…';
  const thumbs=(await Promise.all(st.media.slice(0,5).map(thumbOf))).filter(Boolean);
  const ok=createStory({productId:st.productId,title:st.custom,text:st.note.trim(),thumbs});
  go.textContent='Hikayeni paylaş';
  if(!ok){check();toast('Hikaye kaydedilemedi, tekrar dene.','Tamam',()=>{},3500);return}
  st.media.forEach(m=>URL.revokeObjectURL(m.url));st=fresh();drawAll();sheet.close();
  document.dispatchEvent(new CustomEvent('m360:hikaye'));
  if(!document.getElementById('hikayeler'))toast('Hikayen Bağlan\'da','Gör',()=>{location.href=ROOT+'baglan/'},5000);
  else toast('Hikayen paylaşıldı','Tamam',()=>{},3000);
}

async function share(){
  if(mode==='hikaye')return shareStory();
  const go=$('psGo');go.disabled=true;go.textContent='Paylaşılıyor…';
  const thumbs=(await Promise.all(st.media.slice(0,3).map(thumbOf))).filter(Boolean);
  const p=createPost({productId:st.productId,title:st.custom,text:st.note.trim(),with:st.with,thumbs,media:st.media.length,video:!!st.media[0]&&st.media[0].video});
  go.textContent='Paylaş';
  if(!p){check();toast('Paylaşım kaydedilemedi, tekrar dene.','Tamam',()=>{},3500);return}
  st.media.forEach(m=>URL.revokeObjectURL(m.url));st=fresh();drawAll();sheet.close();
  document.dispatchEvent(new CustomEvent('m360:paylasildi',{detail:p}));
  if(!document.getElementById('feed'))toast('Paylaşımın Bağlan\'da','Gör',()=>{location.href=ROOT+'baglan/#'+p.id},5000);
  else toast('Paylaşımın Bağlan\'da','Tamam',()=>{},3000);
}

/* opts.productId: geçmiş rezervasyondan gelince o deneyim seçili açılır.
   opts.mode: 'hikaye' ya da 'post' (varsayılan) */
export function openShare(from,{productId,mode:m='post'}={}){
  if(!sheet)build();
  if(m!==mode){mode=m;st.media.forEach(x=>URL.revokeObjectURL(x.url));st=fresh()}
  if(productId&&getProduct(productId)){st.productId=productId;st.q='';st.custom=''}
  drawAll();sheet.open(from,$('psFile')||$('psQ'));
}

/* Alt menüdeki yuvarlak Paylaş: önce Hikaye mi Gönderi mi. Seçince bu
   çekmece kapanır, geri adımı bitince paylaşım çekmecesi açılır. */
export function openChooser(from){
  if(!chooser){
    document.body.insertAdjacentHTML('beforeend',CHOOSE);
    chooser=makeSheet($('pcSheet'),$('pcBg'));
    $('pcSheet').addEventListener('click',e=>{const o=e.target.closest('[data-mode]');if(!o)return;
      const m=o.dataset.mode;let done=false;
      const go=()=>{if(done)return;done=true;removeEventListener('popstate',go);openShare(from,{mode:m})};
      addEventListener('popstate',go);chooser.close();setTimeout(go,450)});
  }
  chooser.open(from);
}
