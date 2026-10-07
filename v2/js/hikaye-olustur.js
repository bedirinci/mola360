/* Hikaye oluştur: gönderiden ayrı, tam ekran dikey düzenleyici (Bedir:
   "Hikaye paylaşım içeriği daha farklı olsun"). Önce bir fotoğraf ya da
   video seçilir; üstüne yazı, yer etiketi ve bağlı deneyim eklenir. Ekranda
   görünen, Bağlan'daki hikaye izleyicisinin aynısıdır: ortada yazı, altında
   yer, altta "Deneyimi gör" kartı, Mola360'tan gidilen deneyimde "Mola360
   ile gitti". Taslakta hikaye yalnızca bu cihazda tutulur (api.js createStory). */
import { listPastBookings, suggest, getProduct, createStory, listDestinations, ME } from './api.js';
import { backLayer, makeSheet, toast, esc } from './ui.js';
import { IC, PIN, STAR } from './icons.js';
import { ROOT } from './root.js';
import { ava } from './cards.js';
import { thumbOf } from './paylas.js';

const NOTE=150;
const LOGO_K='<img src="'+ROOT+'logo-koyu.webp" alt="Mola360" width="44" height="18">';
const BG='linear-gradient(165deg,#2B3A75,#152048 60%,#0B1020)';
const TAG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>';
const $=id=>document.getElementById(id);

const HTML=`<div class="hc" id="hc" role="dialog" aria-modal="true" aria-label="Hikaye oluştur" hidden>
  <div class="hc-m" id="hcM"></div>
  <div class="hc-hd"><button type="button" class="hc-x" id="hcX" aria-label="Kapat">${IC.close}</button><b class="hc-t" id="hcT">Hikaye oluştur</b></div>
  <div class="hc-pick" id="hcPick">
    <span class="hc-pi">${IC.image}</span>
    <b>Bugün neredesin?</b><p>Bir fotoğraf ya da video seç, üstüne yazı, yer ve deneyim ekle.</p>
    <label class="btn green hc-file"><input type="file" class="sr" id="hcFile" accept="image/*,video/*">Galeriden seç</label>
    <small>Hikayen 24 saat görünür.</small>
  </div>
  <div class="hc-stage" id="hcStage" hidden>
    <div class="hc-tools" role="toolbar" aria-label="Hikaye araçları">
      <button type="button" class="hc-tl" data-tool="yazi"><i class="aa" aria-hidden="true">Aa</i><span>Yazı</span></button>
      <button type="button" class="hc-tl" data-tool="deneyim"><i aria-hidden="true">${TAG}</i><span>Deneyim</span></button>
      <button type="button" class="hc-tl" data-tool="konum"><i aria-hidden="true">${PIN}</i><span>Konum</span></button>
      <label class="hc-tl"><input type="file" class="sr" id="hcFile2" accept="image/*,video/*"><i aria-hidden="true">${IC.image}</i><span>Değiştir</span></label>
    </div>
    <div class="hc-body" id="hcBody"></div>
  </div>
  <div class="hc-type" id="hcType" hidden>
    <div class="hc-type-hd"><button type="button" class="hc-sty" id="hcSty" aria-pressed="false" aria-label="Beyaz zemin"><i>A</i></button><button type="button" class="hc-done" id="hcDone">Bitti</button></div>
    <textarea id="hcTxt" rows="1" maxlength="${NOTE}" placeholder="Bir şey yaz…" aria-label="Hikaye yazısı"></textarea>
  </div>
  <div class="hc-ft" id="hcFt" hidden><button type="button" class="hc-go" id="hcGo"><span class="hc-av">${ava(ME,'s')}</span>Hikayene ekle${IC.right}</button></div>
</div>
<div class="sh-bg hc-bg" id="hdBg"></div>
<div class="sheet tall ps hc-sh" id="hdSheet" role="dialog" aria-modal="true" aria-labelledby="hdTtl">
  <div class="ps-top" id="hdDrag"><div class="sh-grab"></div>
    <div class="sh-hd"><h3 id="hdTtl">Deneyim ekle</h3><button type="button" class="sh-x" data-x aria-label="Kapat">${IC.close}</button></div>
  </div>
  <div class="ps-body">
    <div id="hdPast"></div>
    <div class="ps-q">${IC.search}<input type="search" id="hdQ" placeholder="Deneyim adı ya da yer" autocomplete="off" enterkeyhint="search" aria-label="Deneyim ara"></div>
    <div id="hdRes" aria-live="polite"></div>
  </div>
</div>
<div class="sh-bg hc-bg" id="hlBg"></div>
<div class="sheet tall ps hc-sh" id="hlSheet" role="dialog" aria-modal="true" aria-labelledby="hlTtl">
  <div class="ps-top" id="hlDrag"><div class="sh-grab"></div>
    <div class="sh-hd"><h3 id="hlTtl">Konum ekle</h3><button type="button" class="sh-x" data-x aria-label="Kapat">${IC.close}</button></div>
  </div>
  <div class="ps-body">
    <div class="ps-q">${IC.search}<input type="search" id="hlQ" placeholder="Yer ara" autocomplete="off" enterkeyhint="search" aria-label="Yer ara"></div>
    <div id="hlRes" aria-live="polite"></div>
  </div>
</div>`;

let root,layer,dSheet,lSheet,st;
const fresh=()=>({media:null,text:'',box:false,productId:'',custom:'',place:'',dq:'',lq:''});
const pastIds=()=>listPastBookings().map(b=>b.productId);

/* izleyicideki "Deneyimi gör" kartının eşi; burada dokununca deneyim değişir */
function card(){
  const p=st.productId?getProduct(st.productId):null;
  if(!p&&!st.custom)return '';
  const st1=p&&p.count?'<span class="st">'+STAR+p.score.toFixed(1).replace('.',',')+' <i>('+p.count+')</i></span>':'';
  return '<div class="sv-card hc-card"><button type="button" class="hc-cardb" data-tool="deneyim" aria-label="Deneyimi değiştir"></button>'
   +'<span class="pt" style="background:'+(p?p.bg:'linear-gradient(160deg,#D5DCEA,#8E9AB6)')+'"></span><span class="x"><b>'+(p?p.title:esc(st.custom))+'</b>'
   +'<small>'+(p?st1+'<span class="w">'+p.type+' · '+p.place.split(' · ')[0]+'</span>':'<span class="w">Mola360 dışı deneyim</span>')+'</small></span>'
   +(p?'<span class="sv-go">Deneyimi gör</span>':'')
   +'<button type="button" class="hc-rm" data-rm="deneyim" aria-label="Deneyimi kaldır">'+IC.close+'</button></div>';
}
function draw(){
  const has=!!st.media;
  root.classList.toggle('empty',!has);
  $('hcM').style.background=has?'url("'+st.media.url+'") center/cover,'+BG:BG;
  $('hcPick').hidden=has;$('hcStage').hidden=!has;$('hcFt').hidden=!has;
  $('hcT').hidden=has;
  if(!has)return;
  const went=!!st.productId&&pastIds().includes(st.productId);
  $('hcBody').innerHTML=(went?'<span class="went">'+LOGO_K+' ile gitti</span>':'')
   +(st.text||st.place?'<div class="sv-cap'+(st.box?' box':'')+'">'
     +(st.text?'<button type="button" class="hc-txt" data-tool="yazi" aria-label="Yazıyı düzenle"><p>'+esc(st.text)+'</p></button>':'')
     +(st.place?'<span class="loc">'+PIN+esc(st.place)+'<button type="button" class="hc-rm s" data-rm="konum" aria-label="Konumu kaldır">'+IC.close+'</button></span>':'')+'</div>':'')
   +card();
}

/* ---- yazı ---- */
function typeOpen(){
  $('hcType').hidden=false;root.classList.add('typing');
  const t=$('hcTxt');t.value=st.text;styOn();fit();t.focus();t.setSelectionRange(t.value.length,t.value.length);
}
function typeDone(){st.text=$('hcTxt').value.replace(/\s+/g,' ').trim();$('hcType').hidden=true;root.classList.remove('typing');draw();
  (root.querySelector('[data-tool="yazi"]')).focus({preventScroll:true})}
function styOn(){$('hcSty').setAttribute('aria-pressed',st.box);$('hcTxt').classList.toggle('box',st.box)}
function fit(){const t=$('hcTxt');t.style.height='auto';t.style.height=Math.min(t.scrollHeight,260)+'px'}

/* ---- deneyim ---- */
const row=(p,{went,sub})=>{const on=st.productId===p.id;
  return '<button type="button" class="ps-opt" role="radio" aria-checked="'+on+'" data-pid="'+p.id+'"><span class="pt" style="background:'+p.bg+'"></span>'
   +'<span class="x"><b>'+p.title+'</b><small>'+sub+'</small>'+(went?'<em class="ps-went">'+IC.check+'Mola360 ile gitti</em>':'')+'</span><i aria-hidden="true"></i></button>'};
function drawD(){
  const past=listPastBookings(),ids=past.map(b=>b.productId),q=st.dq.trim();
  const found=q?suggest(q).products.filter(p=>!ids.includes(p.id)):[];
  const exact=found.some(p=>p.title.toLocaleLowerCase('tr')===q.toLocaleLowerCase('tr'));
  $('hdPast').innerHTML=past.length&&!q?'<p class="ps-lbl" id="hdL1">Mola360 ile gittiklerin</p><div class="ps-list" role="radiogroup" aria-labelledby="hdL1">'
     +past.map(b=>row(b.product,{went:true,sub:b.when})).join('')+'</div><p class="ps-lbl">Başka bir deneyim</p>':'';
  const add=q&&!exact?'<button type="button" class="ps-opt ps-new" data-new><span class="pt">'+PIN+'</span><span class="x"><b>'+esc(q)+'</b><small>Yeni deneyim olarak ekle</small></span><i aria-hidden="true">'+IC.plus+'</i></button>':'';
  $('hdRes').innerHTML=found.length||add?'<div class="ps-list" aria-label="Arama sonuçları">'+found.map(p=>row(p,{sub:p.type+' · '+p.place.split(' · ')[0]})).join('')+add+'</div>'
    +'<p class="ps-hint">Mola360 dışından gittiğin deneyimde rozet görünmez.</p>':'';
}
/* deneyim seçilince konum boşsa deneyimin yeri gelir (sonra değiştirilebilir) */
function pickD(id,custom){
  const p=id?getProduct(id):null;
  st.productId=p?id:'';st.custom=p?'':custom;
  if(p&&!st.place)st.place=p.place.split(' · ')[0];
  st.dq='';$('hdQ').value='';dSheet.close();draw();
}

/* ---- konum ---- */
function places(){
  const q=st.lq.trim().toLocaleLowerCase('tr'),p=st.productId?getProduct(st.productId):null;
  const all=listDestinations().map(d=>({name:d.name,sub:d.sub}));
  const near=p?[{name:p.place.split(' · ')[0],sub:'Deneyimin yeri'}]:[];
  const l=[...near,...all].filter((x,i,a)=>a.findIndex(y=>y.name===x.name)===i)
    .filter(x=>!q||x.name.toLocaleLowerCase('tr').includes(q)||(x.sub||'').toLocaleLowerCase('tr').includes(q));
  return l.slice(0,q?12:8);
}
function drawL(){
  const q=st.lq.trim(),l=places(),exact=l.some(x=>x.name.toLocaleLowerCase('tr')===q.toLocaleLowerCase('tr'));
  $('hlRes').innerHTML=(q?'':'<p class="ps-lbl">Önerilen yerler</p>')+'<div class="ps-list" aria-label="Yerler">'
   +l.map(x=>'<button type="button" class="ps-opt ps-new hc-pl" data-place="'+esc(x.name)+'"><span class="pt">'+PIN+'</span><span class="x"><b>'+esc(x.name)+'</b><small>'+esc(x.sub||'')+'</small></span></button>').join('')
   +(q&&!exact?'<button type="button" class="ps-opt ps-new hc-pl" data-place="'+esc(q.slice(0,40))+'"><span class="pt">'+PIN+'</span><span class="x"><b>'+esc(q)+'</b><small>Bu adla ekle</small></span></button>':'')+'</div>';
}

function build(){
  document.body.insertAdjacentHTML('beforeend',HTML);
  root=$('hc');st=fresh();
  layer=backLayer(()=>hide());
  dSheet=makeSheet($('hdSheet'),$('hdBg'),{drag:$('hdDrag')});
  lSheet=makeSheet($('hlSheet'),$('hlBg'),{drag:$('hlDrag')});
  const pick=e=>{const f=[...e.target.files].find(f=>/^(image|video)\//.test(f.type));e.target.value='';if(!f)return;
    if(st.media)URL.revokeObjectURL(st.media.url);st.media={url:URL.createObjectURL(f),video:f.type.startsWith('video/')};
    /* videodan ilk kare arka plan olur */
    if(st.media.video)thumbOf(st.media).then(u=>{if(u&&st.media){st.media.still=u;$('hcM').style.background='url("'+u+'") center/cover,'+BG}});
    draw();($('hcGo')).focus({preventScroll:true})};
  $('hcFile').addEventListener('change',pick);$('hcFile2').addEventListener('change',pick);
  $('hcX').addEventListener('click',()=>close());
  $('hcDone').addEventListener('click',typeDone);
  $('hcSty').addEventListener('click',()=>{st.box=!st.box;styOn()});
  $('hcTxt').addEventListener('input',fit);
  $('hcTxt').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();typeDone()}});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(!$('hcType').hidden)typeDone();else close()}});
  root.addEventListener('click',e=>{
    const rm=e.target.closest('[data-rm]');
    if(rm){if(rm.dataset.rm==='konum')st.place='';else{st.productId='';st.custom=''}draw();return}
    const t=e.target.closest('[data-tool]');if(!t)return;
    const k=t.dataset.tool;
    if(k==='yazi')typeOpen();
    if(k==='deneyim'){drawD();dSheet.open(t,$('hdQ'))}
    if(k==='konum'){st.lq='';$('hlQ').value='';drawL();lSheet.open(t,$('hlQ'))}
  });
  $('hcGo').addEventListener('click',share);
  $('hdSheet').addEventListener('input',e=>{if(e.target.id==='hdQ'){st.dq=e.target.value;drawD()}});
  $('hdSheet').addEventListener('click',e=>{const o=e.target.closest('[data-pid]');if(o){pickD(o.dataset.pid,'');return}
    if(e.target.closest('[data-new]'))pickD('',st.dq.trim().slice(0,60))});
  $('hlSheet').addEventListener('input',e=>{if(e.target.id==='hlQ'){st.lq=e.target.value;drawL()}});
  $('hlSheet').addEventListener('click',e=>{const o=e.target.closest('[data-place]');if(!o)return;st.place=o.dataset.place;lSheet.close();draw()});
}

async function share(){
  const go=$('hcGo');go.disabled=true;
  const thumb=st.media.still||await thumbOf(st.media);
  const ok=createStory({productId:st.productId,title:st.custom,text:st.text,place:st.place,box:st.box,thumbs:thumb?[thumb]:[]});
  go.disabled=false;
  if(!ok){toast('Hikaye kaydedilemedi, tekrar dene.','Tamam',()=>{},3500);return}
  close();
  document.dispatchEvent(new CustomEvent('m360:hikaye'));
  if(!document.getElementById('hikayeler'))toast('Hikayen Bağlan\'da','Gör',()=>{location.href=ROOT+'baglan/'},5000);
  else toast('Hikayen paylaşıldı','Tamam',()=>{},3000);
}

let opener=null;
const behind=()=>[...document.body.children].filter(el=>el!==root&&!el.classList.contains('hc-sh')&&!el.classList.contains('hc-bg')&&el.id!=='toast'&&el.tagName!=='SCRIPT');
function hide(){
  if(!root||root.hidden)return;
  root.classList.remove('in','typing');root.hidden=true;$('hcType').hidden=true;
  document.documentElement.classList.remove('sv-on');behind().forEach(el=>el.inert=false);
  if(st.media)URL.revokeObjectURL(st.media.url);st=fresh();
  if(opener&&opener.isConnected)opener.focus({preventScroll:true});
}
function close(){hide();layer.pop()}

/* opts.productId: geçmiş rezervasyondan gelince o deneyim bağlı açılır */
export function openStory(from,{productId}={}){
  if(!root)build();
  opener=from||null;st=fresh();
  if(productId&&getProduct(productId))pickD(productId,'');
  root.hidden=false;draw();layer.push();
  document.documentElement.classList.add('sv-on');behind().forEach(el=>el.inert=true);
  requestAnimationFrame(()=>root.classList.add('in'));
  setTimeout(()=>$('hcX').focus({preventScroll:true}),60);
}
