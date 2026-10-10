/* Liste: kategori (ürün ne?), filtreler (keşif kriteri), arama (yer ya da
   metin) ve tema ayrı satırlarda ve ayrı adres parametrelerinde:
   ?tur=otel&yer=kapadokya&tarih=bu-hs&sure=hs&kimle=sevgili&tema=doga
   (docs/yeni-surum.md kural 3). Tema seçiliyse sayfa temanın vitrini olur:
   kapak, iki cümlelik giriş, temadaki kategoriler ve paylaşımlar. */
import { renderShell } from './shell.js';
import { listProducts, listPosts, getTheme, getDestination, getSearch, findCityPage, pageTitle, recommended, typeKey, kmTo, TYPES, BUCKETS, WITH, WHEN } from './api.js';
import { OZ_AD } from './sehirler.js';
import { ROOT } from './root.js';
import { productCard, postMini } from './cards.js';
import { toast, esc, tl, makeSheet } from './ui.js';
import { lvOn, lvPrice } from './level.js';
import { initFavorites, favSync } from './favorites.js';
import { IC } from './icons.js';

renderShell('kesfet');
initFavorites();

/* Şehir sayfası (v2/izmir/mekanlar/kahvalti/ gibi, scripts/seo.mjs üretir):
   seçim sayfanın kendisinde (body data-q: şehir, tür, özellik, kiminle, yer).
   Üst kısım (kapak, sayfa yolu, başlık, giriş) HTML'de sabit; kategori
   satırı ve kiminle süzgeci yok. Adreste yalnızca süre durur
   (izmir/turlar/?sure=uzun); sıra üreticiyle aynı (önerilen) */
const PG=document.body.dataset.q!=null;
const q=new URLSearchParams(PG?document.body.dataset.q:location.search);
if(PG){const x=new URLSearchParams(location.search).get('sure');if(x)q.set('sure',x)}
let tur=TYPES.some(t=>t[0]===q.get('tur'))?q.get('tur'):'';
let sure=BUCKETS.some(b=>b[0]===q.get('sure'))?q.get('sure'):'';
let kimle=WITH.some(w=>w[0]===q.get('kimle'))?q.get('kimle'):'';
let yer=getDestination(q.get('yer'))?q.get('yer'):'';
let ara=(q.get('ara')||'').trim().slice(0,60);
let tarih=WHEN.some(w=>w[0]===q.get('tarih'))?q.get('tarih'):'';
const th=getTheme(q.get('tema'));
const sehir=q.get('sehir')||'',oz=q.get('oz')||'',kalkis=q.get('kalkis')||'';
/* şehir sayfasında süre süzgeci yalnızca sayfada olan süreler; tek süre varsa hiç yok */
const SURE=(()=>{if(!PG)return BUCKETS;const l=listProducts({type:tur,tema:th&&th.id,yer,kimle,sehir,oz,kalkis}),b=BUCKETS.filter(x=>l.some(p=>p.b===x[0]));return b.length>1?b:[]})();
if(!SURE.some(b=>b[0]===sure))sure='';
const KIMLE=PG?[]:WITH;
/* Keşfet'teki aramada seçilen kişi sayısı (yalnızca bu sekmede) */
const s=getSearch();

/* Tema vitrini: kapakta temanın görseli, adı ve girişi; sekmelerde yalnızca
   temada olan kategoriler */
if(th){const top=document.querySelector('.pg-top');top.classList.add('cover');top.style.setProperty('--g',th.bg)}
const CATS=th?TYPES.filter(t=>th.types.includes(t[1])):TYPES;
/* Bu temada paylaşılanlar: temadaki (sekme seçiliyse o kategorideki) deneyimlerin paylaşımları */
const themePosts=()=>th?listPosts().filter(x=>x.product&&th.ids.includes(x.product.id)&&(!tur||typeKey(x.product.type)===tur)):[];

/* Araç çubuğu: Filtreler (çekmece: fiyat aralığı, süre, kiminle ve ek filtreler), sıralama
   (çekmece: önerilen, yakınımda, fiyat, puan) ve ızgara/liste görünümü.
   Süre ve kiminle tek seçimse adreste; diğer filtreler, sıra ve konum yalnızca
   bu açılışta. Görünüm tarayıcıda hatırlanır. Süre adları tek yerden (BUCKETS, Keşfet ile aynı) */
let sira='',pos=null;
const SIRA=[['','Önerilen'],['yakin','Yakınımda','Sana en yakın olanlar önce'],['ucuz','En düşük fiyat'],['puan','En yüksek puan']];
const fp=p=>lvPrice(p.title,p.price);
/* Fiyat aralıkları listenin kendi fiyatlarından: üçte birlik dilimler, yuvarlak sınırlar; boş dilim yok */
const nice=x=>{const st=x>=2000?500:100;return Math.max(st,Math.round(x/st)*st)};
function bands(l){
  const v=l.map(fp).sort((a,b)=>a-b);if(v.length<3||v[0]===v[v.length-1])return [];
  const c=[...new Set([nice(v[Math.floor(v.length/3)]),nice(v[Math.floor(v.length*2/3)])])];
  const b=c.length>1?[['d',tl(c[0])+' altı',p=>p<c[0]],['o',tl(c[0])+' – '+tl(c[1]),p=>p>=c[0]&&p<c[1]],['y',tl(c[1])+' ve üstü',p=>p>=c[1]]]
    :[['d',tl(c[0])+' altı',p=>p<c[0]],['y',tl(c[0])+' ve üstü',p=>p>=c[0]]];
  return b.filter(x=>v.some(x[2]));
}
/* Filtre grupları, ilk sürümdeki gibi işaretlemeli: grupta birden çok seçenek
   "ya da", gruplar arasında "ve". Seçenekler listenin kendisinden; boş kalan,
   ek gruplarda hiçbir şeyi daraltmayan seçenek gösterilmez */
const TR_AD={otobus:'Otobüs',ucak:'Uçak',feribot:'Feribot',tren:'Tren'};
const uniq=a=>[...new Set(a.filter(Boolean))];
let FB=[],LST=[];
const G=[
  {k:'fiyat',t:'Fiyat aralığı',vals:()=>FB.map(b=>[b[0],b[1]]),pred:v=>{const b=FB.find(x=>x[0]===v);return p=>!b||b[2](fp(p))}},
  {k:'sure',t:'Süre',vals:()=>SURE.map(b=>[b[0],b[1]]),pred:v=>p=>p.b===v},
  {k:'kimle',t:'Kiminle',vals:()=>KIMLE.map(w=>[w[0],w[1]]),pred:v=>p=>p.with.includes(v)},
  {k:'ozl',t:'Özellikler',ek:1,vals:l=>uniq(l.flatMap(p=>p.oz||[])).filter(v=>OZ_AD[v]&&v!==oz).map(v=>[v,OZ_AD[v]]),pred:v=>p=>(p.oz||[]).includes(v)},
  {k:'ulasim',t:'Ulaşım',ek:1,vals:l=>uniq(l.map(p=>p.tr)).map(v=>[v,TR_AD[v]||v]),pred:v=>p=>p.tr===v},
  /* kalkış şehrinin adı ürünün yer satırından ("Ayvalık çıkışlı") */
  {k:'kalk',t:'Kalkış şehri',ek:1,vals:l=>{const t=l.filter(p=>typeKey(p.type)==='tur'&&p.kalkis);return kalkis?[]:uniq(t.map(p=>p.kalkis))
    .map(v=>[v,t.find(p=>p.kalkis===v).place.split(' · ').find(x=>/ çıkışlı$/.test(x)).replace(/ çıkışlı$/,'')])},pred:v=>p=>typeKey(p.type)==='tur'&&p.kalkis===v},
  {k:'firsat',t:'Fırsatlar',ek:1,vals:()=>[['indirim','İndirimli']],pred:()=>p=>lvOn(p.title)}];
const sel=Object.fromEntries(G.map(g=>[g.k,[]]));
if(sure)sel.sure=[sure];if(kimle)sel.kimle=[kimle];
const apply=(l,d,skip)=>G.reduce((a,g)=>g.k!==skip&&d[g.k].length?a.filter(p=>d[g.k].some(v=>g.pred(v)(p))):a,l);
/* adreste süre ve kiminle yalnızca tek seçimse durur */
const one=a=>a.length===1?a[0]:'';
const single=()=>{sure=one(sel.sure);kimle=one(sel.kimle)};
const all=()=>listProducts({type:tur,tema:th&&th.id,yer,ara,tarih,sehir,oz,kalkis});
/* listede karşılığı kalmayan seçim düşer (sekme değişince); fiyat dilimleri diğer seçimlerden sonraki listeden */
const prune=(l,d)=>{FB=bands(apply(l,d,'fiyat'));G.forEach(g=>{const v=g.vals(l).map(x=>x[0]);d[g.k]=d[g.k].filter(x=>v.includes(x))})};
const X='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

const href=(t,s,k=kimle)=>{if(PG)return s?'?sure='+s:location.pathname;const x=[th&&'tema='+th.id,t&&'tur='+t,yer&&'yer='+yer,ara&&'ara='+encodeURIComponent(ara),tarih&&'tarih='+tarih,s&&'sure='+s,k&&'kimle='+k].filter(Boolean).join('&');
  return PG?ROOT+'liste/'+(x?'?'+x:''):'?'+x};
const go=()=>{const h=href(tur,sure);history.replaceState(history.state,'',h==='?'?location.pathname:h);draw()};

/* aramadan gelen seçimler (yer, metin, tarih) en başta; dokununca kalkar */
function filters(){
  /* kategori sayfasında yer kategorinin kendisi: kaldırılacak seçim değil */
  const D=PG?null:getDestination(yer),WH=WHEN.find(w=>w[0]===tarih);
  const off=(k,label)=>'<button type="button" class="fc off" aria-pressed="true" data-off="'+k+'" aria-label="'+esc(label)+' seçimini kaldır">'+esc(label)+X+'</button>';
  document.getElementById('filters').innerHTML=(D?off('yer',D.name):'')+(ara?off('ara','“'+ara+'”'):'')+(WH?off('tarih',WH[2]):'')
    +G.flatMap(g=>sel[g.k].map(v=>off(g.k+':'+v,(g.vals(LST).find(x=>x[0]===v)||[v,v])[1]))).join('');
  const el=document.getElementById('filters');el.hidden=!el.firstChild;
  /* Filtreler düğmesinde seçili filtre sayısı */
  const n=G.reduce((a,g)=>a+sel[g.k].length,0),N=document.getElementById('ltN');
  N.textContent=n;N.hidden=!n;document.getElementById('ltFilter').classList.toggle('on',!!n);
}
function draw(){
  const T=TYPES.find(t=>t[0]===tur),B=BUCKETS.find(b=>b[0]===sure),W=WITH.find(w=>w[0]===kimle),D=getDestination(yer),WH=WHEN.find(w=>w[0]===tarih);
  /* başlık en belirleyici seçim; geri kalanlar alt satırda */
  const lead=D?D.name:ara?'“'+ara+'”':'';
  /* seçim bir şehir sayfasına denk geliyorsa başlık ve asıl adres o sayfanın */
  const K=!PG&&!ara&&!th?findCityPage({tur,yer,kimle,oz,sehir,kalkis}):null;
  const title=K?K.name:th?th.name:lead||(T?T[2]:B?B[2]:W?W[1]:'Tüm deneyimler');
  /* temada seçimler filtre satırında görünür; alt satır temanın girişi */
  const rest=th?th.intro:[lead&&th&&th.name,(lead||th)&&!K&&T&&T[2],(lead||th||T)&&B&&B[2],(lead||th||T||B)&&W&&W[1],WH&&WH[1]+' ('+WH[2]+')',(lead||WH)&&s.tur===tur&&s.who].filter(Boolean).join(' · ');
  /* kategori sayfasında başlık, giriş ve kategori satırı HTML'de sabit */
  if(!PG){
    document.getElementById('lsTitle').textContent=title;
    const sub=document.getElementById('lsSub');sub.textContent=rest;sub.hidden=!rest;
    document.getElementById('cats').innerHTML='<a href="'+href('',sure)+'"'+(tur?'':' aria-current="true"')+'>Tümü</a>'
      +CATS.map(t=>'<a href="'+href(t[0],sure)+'"'+(t[0]===tur?' aria-current="true"':'')+'>'+t[2]+'</a>').join('');
  }
  const f={sure,kimle,tema:th&&th.id,yer,ara,tarih,sehir,oz,kalkis};
  let list=all();LST=list;prune(list,sel);single();
  list=apply(list,sel);
  filters();
  /* tema vitrini temanın kendi sırasıyla; şehir sayfası önerilen sırayla (üreticiyle aynı) */
  if(th)list.sort((a,b)=>th.ids.indexOf(a.id)-th.ids.indexOf(b.id));
  if(PG)list=recommended(list);
  /* yakınımda: kartta uzaklık; konumu bilinmeyen en sonda */
  if(sira==='yakin'&&pos)list=list.map(p=>({...p,km:kmTo(pos,p)})).sort((a,b)=>(a.km??1e9)-(b.km??1e9));
  if(sira==='ucuz')list.sort((a,b)=>fp(a)-fp(b));
  if(sira==='puan')list.sort((a,b)=>(b.count?b.score:0)-(a.count?a.score:0)||b.count-a.count);
  document.getElementById('ltSortL').textContent=SIRA.find(x=>x[0]===sira)[1];
  document.getElementById('ltSort').classList.toggle('on',!!sira);
  document.getElementById('lsCount').innerHTML=list.length+' deneyim';
  const el=document.getElementById('list');
  /* boşsa: aynı arama başka kategoride sonuç veriyorsa oraya yönlendir */
  const other=!list.length&&tur?apply(listProducts({...f,sure:'',kimle:''}),sel).length:0;
  const ps=list.length?themePosts():[];
  const cards=list.map(x=>productCard(x));
  if(ps.length)cards.splice(Math.min(4,cards.length),0,'<section class="ls-posts" aria-labelledby="h-tp"><div class="hd"><h2 id="h-tp">Bu temada paylaşılanlar</h2><a class="all" href="../baglan/">Bağlan →</a></div>'
    +'<div class="rail">'+ps.map(postMini).join('')+'</div></section>');
  el.innerHTML=list.length?cards.join('')
    :'<div class="empty"><b>Bu seçimde deneyim yok</b><p>'+(other?'Aynı seçimle başka kategorilerde '+other+' deneyim var.':'Filtreleri kaldırmayı ya da başka bir kategoriye bakmayı dene.')+'</p>'
     +(other&&!PG?'<a class="btn" href="'+href('',sure)+'">Tüm kategorilerde gör</a>':'<a class="btn" href="'+(PG?location.pathname:'?'+[th&&'tema='+th.id,tur&&'tur='+tur].filter(Boolean).join('&'))+'">Filtreleri kaldır</a>')+'</div>';
  favSync();
  /* şehir sayfasının listenin altındaki bölümleri (hakkında, SSS, ilgili): süre seçilince liste sayfanın tamamı olmadığı için gizlenir */
  if(PG){document.querySelectorAll('body [data-kat]').forEach(e=>{e.hidden=!!(tarih||G.some(g=>sel[g.k].length))});return}
  /* şehir sayfasına denk gelen seçim: başlıkta önce sayfanın adı, asıl adres şehir sayfası (arama motorları için) */
  document.title=K?pageTitle(K):'mola360 — '+title;
  let cn=document.querySelector('link[rel=canonical]');
  if(K){if(!cn){cn=document.createElement('link');cn.rel='canonical';document.head.appendChild(cn)}cn.href=ROOT+K.path}else if(cn)cn.remove();
}
document.getElementById('filters').addEventListener('click',e=>{
  const o=e.target.closest('[data-off]');
  if(!o)return;const [k,v]=o.dataset.off.split(/:(.*)/);
  if(v!=null){sel[k]=sel[k].filter(x=>x!==v);single()}else({yer:()=>yer='',ara:()=>ara='',tarih:()=>tarih=''})[k]();
  go();(document.querySelector('#filters .fc')||document.getElementById('ltFilter')).focus({preventScroll:true});
});
/* kategori sekmesi sayfayı yeniden açmaz, adresi değiştirir: sekmeler
   arasında gezmek geçmişe yeni sayfa eklemez, geri Liste'den önceki sayfaya döner */
if(!PG)document.getElementById('cats').addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;
  e.preventDefault();tur=new URL(a.href).searchParams.get('tur')||'';go();
  const n=document.querySelector('#cats [aria-current]');if(n){n.focus({preventScroll:true});n.scrollIntoView({block:'nearest',inline:'nearest'})}});

/* Filtreler çekmecesi: seçimler taslakta; "N deneyimi gör" uygular, kapatmak vazgeçer */
const XS='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const radio='<i aria-hidden="true"></i>';
document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="lfBg" aria-hidden="true"></div>'
  +'<div class="sheet lf" id="lfSheet" role="dialog" aria-modal="true" aria-labelledby="lfTtl"><div class="sh-grab" aria-hidden="true"></div>'
  +'<div class="sh-hd"><h3 id="lfTtl">Filtreler</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+XS+'</button></div>'
  +'<div class="lf-b" id="lfBody"></div>'
  +'<div class="lf-f"><button type="button" class="btn ghost" id="lfClear">Temizle</button><button type="button" class="btn green" id="lfOk"></button></div></div>'
  +'<div class="sh-bg" id="lsBg" aria-hidden="true"></div>'
  +'<div class="sheet" id="lsSheet" role="dialog" aria-modal="true" aria-labelledby="lsTtl"><div class="sh-grab" aria-hidden="true"></div>'
  +'<div class="sh-hd"><h3 id="lsTtl">Sırala</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+XS+'</button></div>'
  +'<div class="sh-list" role="radiogroup" aria-labelledby="lsTtl" id="lsOpts"></div></div>');
const fSh=makeSheet(document.getElementById('lfSheet'),document.getElementById('lfBg'));
const sSh=makeSheet(document.getElementById('lsSheet'),document.getElementById('lsBg'));
let dr={};const more=new Set();
/* her seçeneğin yanında, diğer seçimlerle birlikte kaç deneyim olduğu; uzun grupta ilk beşi ve "Tümünü gör" */
function fDraw(){
  const l=all();prune(l,dr);const n=apply(l,dr).length;
  document.getElementById('lfBody').innerHTML=G.map(g=>{const r=apply(l,dr,g.k);
    const o=g.vals(l).map(x=>[x[0],x[1],r.filter(g.pred(x[0])).length,dr[g.k].includes(x[0])]).filter(x=>x[3]||x[2]&&(!g.ek||x[2]<r.length));
    if(!o.length)return '';const kis=o.length>6&&!more.has(g.k);
    return '<fieldset class="lf-g"><legend>'+g.t+'</legend><div class="lf-c">'
      +(kis?o.filter((x,i)=>i<5||x[3]):o).map(x=>'<button type="button" class="lf-o" role="checkbox" aria-checked="'+x[3]+'" data-k="'+g.k+'" data-v="'+x[0]+'"><span class="lf-cb" aria-hidden="true">'+IC.check+'</span><span class="lf-l">'+x[1]+'</span><i>'+x[2]+'</i></button>').join('')
      +(kis?'<button type="button" class="lf-more" data-more="'+g.k+'">Tümünü gör ('+o.length+')</button>':'')+'</div></fieldset>'}).join('');
  const ok=document.getElementById('lfOk');ok.textContent=n?n+' deneyimi gör':'Bu seçimde deneyim yok';ok.disabled=!n;
  document.getElementById('lfClear').disabled=!G.some(g=>dr[g.k].length);
}
const empty=()=>Object.fromEntries(G.map(g=>[g.k,[]]));
document.getElementById('ltFilter').addEventListener('click',e=>{dr=Object.fromEntries(G.map(g=>[g.k,[...sel[g.k]]]));more.clear();fDraw();fSh.open(e.currentTarget)});
document.getElementById('lfBody').addEventListener('click',e=>{const m=e.target.closest('[data-more]');
  if(m){more.add(m.dataset.more);fDraw();document.querySelector('#lfBody [data-k="'+m.dataset.more+'"]:nth-of-type(6)')?.focus({preventScroll:true});return}
  const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k,v=b.dataset.v;
  dr[k]=dr[k].includes(v)?dr[k].filter(x=>x!==v):[...dr[k],v];fDraw();
  document.querySelector('#lfBody [data-k="'+k+'"][data-v="'+v+'"]')?.focus({preventScroll:true})});
document.getElementById('lfClear').addEventListener('click',()=>{dr=empty();fDraw();document.getElementById('lfOk').focus({preventScroll:true})});
/* adres, çekmecenin geçmiş adımı geri alındıktan sonra yazılır (yoksa geri adımı süreyi silerdi) */
document.getElementById('lfOk').addEventListener('click',()=>{G.forEach(g=>sel[g.k]=dr[g.k]);single();
  const ov=!!(history.state&&history.state.m360ov);if(ov)addEventListener('popstate',go,{once:true});fSh.close();if(!ov)go()});

/* Sıralama: seçince uygulanır. Yakınımda konumu yalnızca seçilince ister, saklamaz */
function sDraw(){document.getElementById('lsOpts').innerHTML=SIRA.map(x=>'<button type="button" class="opt" role="radio" aria-checked="'+(x[0]===sira)+'" data-s="'+x[0]+'"><span>'+x[1]+(x[2]?'<small>'+x[2]+'</small>':'')+'</span>'+radio+'</button>').join('')}
document.getElementById('ltSort').addEventListener('click',e=>{sDraw();sSh.open(e.currentTarget)});
document.getElementById('lsOpts').addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;const v=b.dataset.s;
  if(v!=='yakin'||pos){sira=v;sSh.close();draw();return}
  if(!navigator.geolocation){sSh.close();toast('Konumun alınamadı.','Tamam',()=>{},3000);return}
  b.querySelector('small').textContent='Konumun alınıyor…';
  navigator.geolocation.getCurrentPosition(p=>{pos=[p.coords.latitude,p.coords.longitude];sira='yakin';sSh.close();draw()},
    er=>{sSh.close();toast(er.code===1?'Konum izni verilmedi.':'Konumun alınamadı.','Tamam',()=>{},3000)},{timeout:10000,maximumAge:600000})});

/* Görünüm: büyük kart (tek sütun, geniş görsel) ya da liste (yatay, karşılaştırmalı) */
let gor='liste';try{if(localStorage.getItem('m360-liste-gorunum')==='izgara')gor='izgara'}catch{}
function view(){const l=document.getElementById('list');l.classList.toggle('stack',gor==='liste');l.classList.toggle('ls-grid',gor==='izgara');
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===gor))}
document.querySelector('.lt-view').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b||b.dataset.view===gor)return;
  gor=b.dataset.view;try{localStorage.setItem('m360-liste-gorunum',gor)}catch{}view()});
view();
draw();
