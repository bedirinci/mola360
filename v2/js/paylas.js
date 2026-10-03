/* Paylaş: Bağlan'a yeni deneyim paylaşımı. Alt menünün yanındaki yuvarlak
   düğme ve geçmiş rezervasyonlardaki "Deneyimini paylaş" açar.
   1) fotoğraf ya da video, 2) bağlı deneyim, 3) kiminle ve kısa not.
   Mola360'tan rezerve edip yaşadığın deneyime bağlanan paylaşım "Mola360
   ile gitti" rozeti alır; başka bir deneyime bağlanan almaz. Taslakta
   paylaşım yalnızca bu cihazda tutulur (api.js createPost). */
import { listPastBookings, suggest, getProduct, createPost } from './api.js';
import { makeSheet, toast } from './ui.js';
import { IC } from './icons.js';
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
    <section class="ps-sec" aria-labelledby="psH1"><h4 id="psH1">Fotoğraf veya video</h4>
      <div class="ps-media" id="psMedia"></div>
    </section>
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
    <section class="ps-sec"><label for="psNote"><h4>Nasıldı?</h4></label>
      <div class="ps-note"><textarea id="psNote" rows="3" maxlength="${NOTE}" placeholder="Birkaç cümle yeter"></textarea><small id="psCnt" aria-live="polite">0 / ${NOTE}</small></div>
    </section>
  </div>
  <div class="ps-foot"><p id="psNeed" class="ps-need"></p><button type="button" class="btn green ps-go" id="psGo" disabled>Paylaş</button></div>
</div>`;

let sheet,st;
const $=id=>document.getElementById(id);
const fresh=()=>({media:[],productId:'',q:'',with:'',note:''});

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
   +(st.media.length<MAX?'<label class="ps-add'+(st.media.length?'':' first')+'"><input type="file" class="sr" id="psFile" accept="image/*,video/*" multiple>'+IC.image+'<span>'+(st.media.length?'Ekle':'Fotoğraf ya da video seç')+'</span></label>':'');
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

function check(){
  const need=!st.media.length&&!st.productId?'Fotoğraf ve deneyim seç':!st.media.length?'Bir fotoğraf ya da video ekle':!st.productId?'Paylaşımı bir deneyime bağla':'';
  $('psNeed').textContent=need;$('psGo').disabled=!!need;
}
function drawAll(){drawMedia();drawPick();
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
    if(o){const id=o.dataset.pid;st.productId=st.productId===id?'':id;if(st.productId){st.q='';$('psQ').value=''}drawPick();check();
      const n=sh.querySelector('[data-pid="'+id+'"]')||$('psQ');n.focus({preventScroll:true});return}
    const w=e.target.closest('[data-with]');
    if(w){st.with=st.with===w.dataset.with?'':w.dataset.with;document.querySelectorAll('[data-with]').forEach(b=>b.setAttribute('aria-checked',b.dataset.with===st.with));return}
    if(e.target.closest('#psGo'))share();
  });
}

async function share(){
  const go=$('psGo');go.disabled=true;go.textContent='Paylaşılıyor…';
  const thumbs=(await Promise.all(st.media.slice(0,3).map(thumbOf))).filter(Boolean);
  const p=createPost({productId:st.productId,text:st.note.trim(),with:st.with,thumbs,media:st.media.length,video:!!st.media[0]&&st.media[0].video});
  go.textContent='Paylaş';
  if(!p){check();toast('Paylaşım kaydedilemedi, tekrar dene.','Tamam',()=>{},3500);return}
  st.media.forEach(m=>URL.revokeObjectURL(m.url));st=fresh();drawAll();sheet.close();
  document.dispatchEvent(new CustomEvent('m360:paylasildi',{detail:p}));
  if(!document.getElementById('feed'))toast('Paylaşımın Bağlan\'da','Gör',()=>{location.href=ROOT+'baglan/#'+p.id},5000);
  else toast('Paylaşımın Bağlan\'da','Tamam',()=>{},3000);
}

/* opts.productId: geçmiş rezervasyondan gelince o deneyim seçili açılır */
export function openShare(from,{productId}={}){
  if(!sheet)build();
  if(productId&&getProduct(productId)){st.productId=productId;st.q=''}
  drawAll();sheet.open(from,$('psFile')||$('psQ'));
}
