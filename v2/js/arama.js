/* Keşfet araması: sekmeye göre üç alan (nereye, ne zaman, kaç kişi); her
   biri alttan bir çekmece açar. Yer ve tarih liste sayfasına adresle gider;
   kişi sayısı ve tarih bu sekme açık kaldıkça ürün ve rezervasyon
   sayfalarına taşınır (api.js setSearch). Veri yalnızca api.js'ten. */
import { I } from './icons.js';
import { makeSheet } from './ui.js';
import { listDestinations, getDestination, suggest, listProducts, listSearches, saveSearch, clearSearches, getSearch, setSearch, productUrl, norm, WHEN, TYPES } from './api.js';
import { ROOT } from './root.js';

/* sekmeye göre alan adları */
const TABS={tur:['NEREYE','Şehir, bölge veya tur adı','NE ZAMAN','KİŞİ','Molamı bul','Nereye gidiyorsun?'],
 otel:['NEREYE','Şehir, bölge veya otel adı','GİRİŞ','ODA · KİŞİ','Otel bul','Nerede kalacaksın?'],
 etkinlik:['ŞEHİR','Tüm şehirler','NE ZAMAN','BİLET','Etkinlik bul','Hangi şehirde?'],
 aktivite:['NEREYE','Şehir veya aktivite','NE ZAMAN','KİŞİ','Aktivite bul','Nerede yapmak istersin?'],
 mekan:['NEREYE','Şehir veya mekân adı','NE ZAMAN','KİŞİ','Mekân bul','Nerede?']};
/* kişi sayacı: [anahtar, ad, açıklama, en az, en çok] */
const WHO={tur:[['y','Yetişkin','18 yaş ve üstü',1,9],['c','Çocuk','2 – 17 yaş',0,6]],
 otel:[['o','Oda','Odada en çok 2 yetişkin',1,3],['y','Yetişkin','18 yaş ve üstü',1,6],['c','Çocuk','2 – 17 yaş',0,4]],
 etkinlik:[['b','Bilet','',1,8]],aktivite:[['k','Kişi','',1,9]],mekan:[['k','Kişi','',1,9]]};

const FOLD={ı:'i',ğ:'g',ü:'u',ş:'s',ö:'o',ç:'c',â:'a',î:'i',û:'u'};
const fold=t=>[...t].map(c=>{const l=c.toLocaleLowerCase('tr');return l.length===1?FOLD[l]||l:c}).join('');
const h=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
/* yazılan kısmı kalın göster (Türkçe harf farkı yok sayılır) */
function mark(text,q){const f=fold(text),n=norm(q);if(!n)return h(text);
  let i=f.startsWith(n)?0:f.indexOf(' '+n)+1;if(i<=0)i=f.indexOf(n);
  return i<0?h(text):h(text.slice(0,i))+'<mark>'+h(text.slice(i,i+n.length))+'</mark>'+h(text.slice(i+n.length))}

const X='<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const LOOP='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
const GLOBE='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>';
const SHEETS=`<div class="sh-bg" id="whereBg" aria-hidden="true"></div>
<div class="sheet tall" id="whereSheet" role="dialog" aria-modal="true" aria-labelledby="whereTtl">
  <div class="sh-top" id="whereDrag"><div class="sh-grab" aria-hidden="true"></div>
    <div class="sh-hd"><h3 id="whereTtl">Nereye?</h3><button type="button" class="sh-x" data-x aria-label="Kapat">${X}</button></div>
    <form class="sr-in" id="whereForm" role="search">${LOOP}<label class="sr" for="whereIn">Yer ya da deneyim ara</label><input id="whereIn" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="button" class="sr-clr" id="whereClr" aria-label="Yazdığını sil" hidden>${X}</button></form>
  </div>
  <p class="sr" id="whereSt" role="status"></p>
  <div class="sr-body" id="whereList"></div>
</div>
<div class="sh-bg" id="dateBg" aria-hidden="true"></div>
<div class="sheet" id="dateSheet" role="dialog" aria-modal="true" aria-labelledby="dateTtl">
  <div class="sh-grab" aria-hidden="true"></div>
  <div class="sh-hd"><h3 id="dateTtl">Ne zaman?</h3><button type="button" class="sh-x" data-x aria-label="Kapat">${X}</button></div>
  <div class="sh-list" id="dateList" role="radiogroup" aria-labelledby="dateTtl"></div>
</div>
<div class="sh-bg" id="whoBg" aria-hidden="true"></div>
<div class="sheet" id="whoSheet" role="dialog" aria-modal="true" aria-labelledby="whoTtl">
  <div class="sh-grab" aria-hidden="true"></div>
  <div class="sh-hd"><h3 id="whoTtl">Kaç kişi?</h3><button type="button" class="sh-x" data-x aria-label="Kapat">${X}</button></div>
  <div class="who-l" id="whoList"></div>
  <button type="button" class="btn who-ok" data-x>Tamam</button>
</div>`;

export function initSearch(){
document.querySelector('script[type="module"]').insertAdjacentHTML('beforebegin',SHEETS);
const $=id=>document.getElementById(id);
const f1=$('f1'),f2=$('f2'),f3=$('f3'),inp=$('whereIn'),list=$('whereList'),clr=$('whereClr');

/* arama durumu: bu sekmede açık kaldıkça hatırlanır */
const saved=getSearch();
const st={tur:TABS[saved.tur]?saved.tur:'tur',yer:getDestination(saved.yer)?saved.yer:'',ara:saved.ara||'',
  tarih:WHEN.some(w=>w[0]===saved.tarih)?saved.tarih:'',n:{y:2,c:0,o:1,b:2,k:2,...(saved.n||{})}};
const T=()=>TYPES.find(t=>t[0]===st.tur);
const unit=()=>T()[1].toLocaleLowerCase('tr');
const whereTxt=()=>st.yer?getDestination(st.yer).name:st.ara?'“'+st.ara+'”':'';
const whenTxt=()=>st.tarih?WHEN.find(w=>w[0]===st.tarih)[1]:'Tarih esnek';
const n=st.n;
const whoTxt=()=>({tur:n.y+' yetişkin'+(n.c?' · '+n.c+' çocuk':''),otel:n.o+' oda · '+(n.y+n.c)+' kişi',etkinlik:n.b+' bilet'})[st.tur]||n.k+' kişi';
/* rezervasyonda başlangıç adedi: tur kişi, otel oda, etkinlik bilet */
const adet=()=>({tur:n.y+n.c,otel:n.o,etkinlik:n.b})[st.tur]||n.k;
const remember=()=>setSearch({...st,adet:adet(),who:whoTxt()});

function fields(){
  const v=TABS[st.tur],w=whereTxt();
  f1.querySelector('small').textContent=v[0];
  const s1=f1.querySelector('span');s1.textContent=w||v[1];s1.classList.toggle('hint',!w);
  f2.querySelector('small').textContent=v[2];f2.querySelector('span').textContent=whenTxt();
  f3.querySelector('small').textContent=v[3];f3.querySelector('span').textContent=whoTxt();
  $('go').textContent=v[4];
  document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x.dataset.tab===st.tur));
}

/* Nereye: yazdıkça yerler ve deneyimler; boşken son aramalar ve yerler */
const where=makeSheet($('whereSheet'),$('whereBg'),{drag:$('whereDrag')});
const destRow=(d,q)=>'<button type="button" class="sr-row" data-yer="'+d.id+'"><span class="sr-ic">'+I.pin+'</span><span class="x"><b>'+mark(d.name,q)+'</b><small>'+d.sub+'</small></span><em>'+d.count+' '+unit()+'</em></button>';
const prodRow=(p,q)=>'<a class="sr-row" href="'+productUrl(ROOT,p.title)+'"><span class="sr-th" style="background:'+p.bg+'"></span><span class="x"><b>'+mark(p.title,q)+'</b><small>'+p.type+' · '+h(p.place.split(' · ')[0])+'</small></span></a>';
const head=(t,extra)=>'<div class="sr-hd"><h4>'+t+'</h4>'+(extra||'')+'</div>';
function drawWhere(){
  const q=inp.value.trim();clr.hidden=!q;
  let html='',say='';
  if(!q){
    const rs=listSearches();
    if(rs.length)html+=head('Son aramaların','<button type="button" class="clr" data-clear-recent>Temizle</button>')
      +rs.map((r,i)=>'<button type="button" class="sr-row" data-recent="'+i+'"><span class="sr-ic">'+I.clock+'</span><span class="x"><b>'+h(r.title)+'</b><small>'+h(r.sub)+'</small></span></button>').join('');
    html+=head('Yerler')+(st.yer||st.ara?'<button type="button" class="sr-row" data-yer=""><span class="sr-ic">'+GLOBE+'</span><span class="x"><b>Her yer</b><small>Seçimi kaldır</small></span></button>':'')
      +listDestinations({type:st.tur}).map(d=>destRow(d,'')).join('');
  }else{
    const r=suggest(q,{type:st.tur});
    if(r.dests.length)html+=head('Yerler')+r.dests.map(d=>destRow(d,q)).join('');
    if(r.products.length)html+=head(T()[2])+r.products.map(p=>prodRow(p,q)).join('');
    if(r.total)html+='<button type="button" class="sr-row all" data-all><span class="sr-ic">'+LOOP+'</span><span class="x"><b>“'+h(q)+'” için tüm sonuçlar</b><small>'+r.total+' '+unit()+'</small></span>'+I.chev+'</button>';
    say=r.dests.length+' yer, '+r.total+' '+unit()+' bulundu';
    if(!r.dests.length&&!r.total){
      /* bu kategoride yoksa diğer kategorilere bak */
      const o=suggest(q);
      html+='<div class="sr-none"><b>'+T()[2]+' içinde “'+h(q)+'” yok</b><p>'+(o.total?'Başka kategorilerde '+o.total+' sonuç var.':'Şehir, bölge ya da deneyim adıyla dene.')+'</p></div>'
        +(o.total?head('Başka kategorilerde')+o.products.map(p=>prodRow(p,q)).join(''):head('Yerler')+listDestinations({type:st.tur}).map(d=>destRow(d,'')).join(''));
      say=o.total?'Bu kategoride sonuç yok, başka kategorilerde '+o.total+' sonuç var':'Sonuç yok';
    }
  }
  list.innerHTML=html;list.scrollTop=0;$('whereSt').textContent=say;
}
f1.setAttribute('aria-haspopup','dialog');f1.setAttribute('aria-expanded','false');
f1.addEventListener('click',()=>{$('whereTtl').textContent=TABS[st.tur][5];inp.placeholder=TABS[st.tur][1];inp.value=st.ara;drawWhere();where.open(f1,inp)});
inp.addEventListener('input',drawWhere);
clr.addEventListener('click',()=>{inp.value='';drawWhere();inp.focus()});
const pickWhere=(yer,ara)=>{st.yer=yer;st.ara=ara;fields();remember();where.close()};
/* Enter: yazılan bir yerin adıysa yer seçilir, değilse metinle aranır */
$('whereForm').addEventListener('submit',e=>{e.preventDefault();const q=inp.value.trim();
  const d=listDestinations().find(d=>d.keys.slice(0,-1).includes(norm(q)));
  if(d)pickWhere(d.id,'');else pickWhere('',q)});
list.addEventListener('click',e=>{
  const y=e.target.closest('[data-yer]');if(y){pickWhere(y.dataset.yer,'');return}
  if(e.target.closest('[data-all]')){pickWhere('',inp.value.trim());return}
  if(e.target.closest('[data-clear-recent]')){clearSearches();drawWhere();inp.focus();return}
  const r=e.target.closest('[data-recent]');if(r){const s=listSearches()[+r.dataset.recent];setSearch(s.state);location.href=s.url}
});

/* Ne zaman: her seçenekte bu yer ve kategoride kaç deneyim olduğu */
const date=makeSheet($('dateSheet'),$('dateBg'));
function drawDate(){
  $('dateList').innerHTML=[['','Tarihim esnek','Tüm tarihler'],...WHEN].map(w=>{const c=listProducts({type:st.tur,yer:st.yer,ara:st.ara,tarih:w[0]}).length;
    return '<button type="button" class="opt" role="radio" aria-checked="'+(w[0]===st.tarih)+'" data-tarih="'+w[0]+'"'+(c?'':' data-none')+'><span>'+w[1]+'<small>'+w[2]+' · '+(c?c+' '+unit():'bu seçimde yok')+'</small></span><i aria-hidden="true"></i></button>'}).join('');
}
f2.setAttribute('aria-haspopup','dialog');f2.setAttribute('aria-expanded','false');
f2.addEventListener('click',()=>{$('dateTtl').textContent=st.tur==='otel'?'Giriş ne zaman?':'Ne zaman?';drawDate();date.open(f2)});
$('dateList').addEventListener('click',e=>{const o=e.target.closest('[data-tarih]');if(!o)return;
  $('dateList').querySelectorAll('.opt').forEach(x=>x.setAttribute('aria-checked',x===o));
  st.tarih=o.dataset.tarih;fields();remember();setTimeout(date.close,140)});

/* Kaç kişi: sayaçlar; otelde odaya sığmayan yetişkin için oda kendiliğinden artar */
const who=makeSheet($('whoSheet'),$('whoBg'));
function can(k,d){const r=WHO[st.tur].find(x=>x[0]===k),v=n[k]+d;
  if(v<r[3]||v>r[4])return false;
  if(st.tur==='tur'&&d>0&&n.y+n.c>=9)return false;
  if(st.tur==='otel'&&k==='o'&&d<0&&v*2<n.y)return false;
  if(st.tur==='otel'&&k==='y'&&d>0&&v>n.o*2&&n.o>=3)return false;
  return true}
function drawWho(){
  $('whoTtl').textContent=st.tur==='etkinlik'?'Kaç bilet?':st.tur==='otel'?'Kaç oda, kaç kişi?':'Kaç kişi?';
  $('whoList').innerHTML=WHO[st.tur].map(([k,name,note])=>'<div class="who-r"><div><b>'+name+'</b>'+(note?'<small>'+note+'</small>':'')+'</div><div class="stp">'
    +'<button type="button" data-who="'+k+'" data-d="-1" aria-label="'+name+' azalt"'+(can(k,-1)?'':' disabled')+'>−</button><output aria-live="polite">'+n[k]+'</output>'
    +'<button type="button" data-who="'+k+'" data-d="1" aria-label="'+name+' artır"'+(can(k,1)?'':' disabled')+'>+</button></div></div>').join('');
}
f3.setAttribute('aria-haspopup','dialog');f3.setAttribute('aria-expanded','false');
f3.addEventListener('click',()=>{drawWho();who.open(f3)});
$('whoList').addEventListener('click',e=>{const b=e.target.closest('[data-who]');if(!b)return;const k=b.dataset.who,d=+b.dataset.d;if(!can(k,d))return;
  n[k]+=d;if(st.tur==='otel'&&n.y>n.o*2)n.o=Math.ceil(n.y/2);
  drawWho();fields();remember();
  const same=$('whoList').querySelector('[data-who="'+k+'"][data-d="'+d+'"]');(same.disabled?$('whoList').querySelector('[data-who="'+k+'"]:not(:disabled)')||$('whoSheet').querySelector('.who-ok'):same).focus()});

/* sekme: alan adları değişir, seçimler kalır */
document.querySelector('.tabs').addEventListener('click',e=>{const t=e.target.closest('.tab');if(!t)return;st.tur=t.dataset.tab;fields();remember()});

/* Molamı bul: liste sayfasına; yer ya da metin varsa son aramalara yazılır */
$('search').addEventListener('submit',e=>{e.preventDefault();
  const qs=[['tur',st.tur],['yer',st.yer],['ara',st.ara],['tarih',st.tarih]].filter(x=>x[1]).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
  const url=ROOT+'liste/?'+qs;
  remember();
  if(st.yer||st.ara)saveSearch({url,title:whereTxt(),sub:[T()[2],whenTxt(),whoTxt()].join(' · '),state:{...st,n:{...n},adet:adet(),who:whoTxt()}});
  location.href=url;
});

fields();
}
