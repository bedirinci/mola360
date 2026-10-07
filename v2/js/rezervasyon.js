/* Rezervasyon akışı: seçim → bilgiler → ödeme → onay. Tek sayfa, adımlar
   tarayıcı geçmişine yazılır (geri tuşu bir önceki adıma döner). Taslakta
   ödeme alınmaz ve kart bilgisi istenmez; rezervasyon yalnızca bu cihazda
   tutulur. Toplam fiyat baştan sona aynı: sonradan eklenen ücret yok. */
import { renderShell, backTo } from './shell.js';
import { getProduct, bookingSpec, createBooking, cancelBy, getSearch, typeKey, parseDay, addDays, longDate } from './api.js';
import { dateGrid, openDates } from './tarihler.js';
import { tl, esc, toast, makeSheet } from './ui.js';
import { lvOn, lvPrice, getLevel } from './level.js';
import { IC, I } from './icons.js';
import { ROOT } from './root.js';
import { openLogin, guestNudge } from './giris.js';

const q=new URLSearchParams(location.search);
const p=getProduct(q.get('id'));
const main=document.getElementById('bk'),cta=document.getElementById('ctaBar'),back=document.getElementById('bkBack');

if(!p){
  main.innerHTML='<div class="empty"><b>Rezervasyon için deneyim seçilmedi</b><p>Bir deneyimin sayfasından tarih seçip devam edebilirsin.</p><a class="btn" href="'+ROOT+'">Keşfet\'e dön</a></div>';
  cta.remove();document.getElementById('steps').hidden=true;
  renderShell('kesfet',{nav:false});
}else start();

function start(){
const S=bookingSpec(p);
const productUrl=ROOT+'urun/?id='+p.id;
back.href=productUrl;
document.title='mola360 — Rezervasyon · '+p.title;

/* başlangıç adedi: Keşfet'te aynı türde arandıysa oradaki kişi, oda ya da bilet sayısı */
function startQty(q){const s=getSearch(),n=s.tur===typeKey(p.type)&&+s.adet;return n?Math.max(q.min,Math.min(q.max,n)):q.start||2}
/* tur: yaşa göre kişi satırları [anahtar, ad, not, fiyat oranı, yaş aralığı] */
const PP=S.people,ROWS=PP?PP.rows:[];
const DEP=S.dep,RM=S.room,HR=S.hotel;
/* seçim durumu; adresten gelen tarih (ürün sayfasında seçildiyse) */
const dateKey=d=>d[0]+' '+d[1];
const st={step:1,
  date:S.dates.length===1?dateKey(S.dates[0]):(S.dates.map(dateKey).find(k=>k===q.get('tarih'))||(HR?HR.stay.date:'')),
  slot:S.slots.length===1?S.slots[0]:'',opt:S.opts.length?Math.max(0,Math.min(S.opts.length-1,+q.get('sec')||0)):-1,qty:S.qty?startQty(S.qty):1,pay:S.deposit?'kapora':'tam',
  ppl:PP?{yetiskin:startQty({min:1,max:PP.max,start:2}),cocuk:0,bebek:0}:null,
  stop:DEP&&DEP.stops.length===1?0:-1,
  sgl:0,pax:{},ben:true,note:'',
  /* otel: gece, oda tipi ve sayısı, misafirler, çocuk yaşları, varış saati */
  ...(HR?{gece:Math.max(1,Math.min(HR.maxNights,+q.get('gece')||HR.stay.nights)),oda:Math.max(0,Math.min(HR.rooms.length-1,+q.get('oda')||0)),rc:1,
    ms:{yetiskin:startQty({min:1,max:8,start:2}),cocuk:0},yas:[],varis:''}:{}),
  name:'',phone:'',email:'',ok:false};

const unit=()=>lvPrice(p.title,st.opt>=0?S.opts[st.opt][1]:p.price);
const full=()=>st.opt>=0?S.opts[st.opt][1]:p.price;
/* kişi satırının liste fiyatı (çocuk ve bebek oranla, 10 TL'ye yuvarlı) */
const rowFull=r=>r[3]===1?full():Math.round(full()*r[3]/10)*10;
const seats=()=>PP?st.ppl.yetiskin+st.ppl.cocuk:st.qty;
const heads=()=>PP?seats()+st.ppl.bebek:st.qty;
/* oda düzeni: bebek ebeveyn odasında; istenen tek kişilik odalar ayrılır, kalanlar
   ikişerli, tek sayıda kalırsa son oda üç kişilik; yalnız kalan yetişkin tek kişilik odada */
const sglMax=()=>RM?Math.max(0,st.ppl.yetiskin-Math.ceil(st.ppl.cocuk/2)):0;
function rooms(){const s=Math.min(st.sgl,sglMax());let rest=seats()-s,forced=false,single=s;
  if(rest===1){single++;rest=0;forced=true}
  const triple=rest>=3&&rest%2?1:0,dbl=(rest-triple*3)/2;
  return {single,dbl,triple,forced,count:single+dbl+triple}}
const roomTxt=r=>[r.dbl&&r.dbl+' iki kişilik',r.triple&&r.triple+' üç kişilik',r.single&&r.single+' tek kişilik'].filter(Boolean).join(', ')+' oda';
const sglFee=()=>RM?rooms().single*RM.single:0;
const gross=()=>HR?roomGross()+kidGross():ROWS.reduce((a,r)=>a+rowFull(r)*st.ppl[r[0]],0)+sglFee();
const total=()=>PP||HR?lvPrice(p.title,gross()):S.fixed?unit():unit()*st.qty;
const now=()=>st.pay==='kapora'?Math.round(total()*S.deposit):total();
const qtyTxt=()=>HR?st.rc+' oda · '+guestTxt():PP?ROWS.filter(r=>st.ppl[r[0]]).map(r=>st.ppl[r[0]]+' '+r[1].toLocaleLowerCase('tr')).join(', '):S.qty?st.qty+' '+S.qty.label.toLocaleLowerCase('tr'):'';
const stopOf=()=>DEP&&st.stop>=0?DEP.stops[st.stop]:null;
const when=()=>HR?st.date+' · '+st.gece+' gece':[st.date,(stopOf()||{}).saat||st.slot].filter(Boolean).join(' · ');
/* katılımcılar: kişi sayısına göre; bilgiler "yetiskin-0" gibi anahtarla tutulur */
const people=()=>ROWS.flatMap(r=>Array.from({length:st.ppl[r[0]]},(_,i)=>({key:r[0]+'-'+i,rol:r[0],label:r[1],n:i+1,many:st.ppl[r[0]]>1,yas:r[4]})));
/* hesaptaki kimlik numarasından yalnızca son dört hane gösterilir (ÖRNEK); tam numara arayüzde tutulmaz */
const ME_TC_SON='4127';
const meOn=k=>st.ben&&(k==='yetiskin-0'||k==='oda-0');

/* otel: oda kapasitesine 2 yaş ve üzeri herkes girer (yaşı seçilmemiş çocuk da);
   çocuk ücretsiz yaşın üstündeyse ek yatak gecelik; her odada en az bir yetişkin */
const RT=()=>HR.rooms[st.oda];
const capN=()=>st.ms.yetiskin+st.yas.filter(a=>a===''||+a>=2).length;
const needR=()=>Math.ceil(capN()/RT().kap);
const maxR=()=>Math.min(5,st.ms.yetiskin);
const fitR=()=>{st.rc=Math.max(needR(),Math.min(st.rc,maxR()))};
const extraK=()=>st.yas.filter(a=>a!==''&&+a>HR.free).length;
const roomGross=()=>RT().fiyat*st.gece*st.rc;
const kidGross=()=>HR.extra*extraK()*st.gece;
const guestTxt=()=>st.ms.yetiskin+' yetişkin'+(st.ms.cocuk?', '+st.ms.cocuk+' çocuk':'');
const outDay=()=>{const d=parseDay(st.date);return d?addDays(d,st.gece):null};
const hNames=()=>Array.from({length:st.rc},(_,i)=>({key:'oda-'+i,n:i+1}));

const head='<a class="bk-p" href="'+productUrl+'"><span class="pt" style="background:'+p.bg+'"></span><div class="x"><small>'+p.type.toLocaleUpperCase('tr')+'</small><b>'+p.title+'</b><span>'+p.place.split(' · ')[0]+'</span></div></a>';
const radios=(name,items,cur)=>'<div class="u-dates" role="radiogroup" aria-label="'+name+'">'+items.map(([v,a,b])=>'<button type="button" role="radio" aria-checked="'+(v===cur)+'" data-'+name.toLocaleLowerCase('tr').replace(/[^a-z]/g,'')+'="'+esc(v)+'"><small>'+a+'</small><b>'+b+'</b></button>').join('')+'</div>';

function step1(){
  if(HR)return step1H();
  return head
  +'<section class="box" id="bkDate"><h2>'+(S.dates.length===1?'Tarih':'Tarih seç')+'</h2>'
  +(S.dates.length===1?'<p class="bk-one">'+IC.calendar+'<b>'+st.date+'</b></p>'
    /* her gün açık deneyimde (aktivite, mekân) ilk üç gün ve "Tüm tarihler" çekmecesi */
    :(S.dates.length>12?'<div class="u-dates bk-dg" id="bkDg" role="radiogroup" aria-label="Tarih">'+dateGrid(S.dates,st.date)+'</div>':radios('Tarih',S.dates.map(d=>[dateKey(d),d[0],d[1]]),st.date))+'<p class="err" id="dateErr" hidden>Devam etmek için bir tarih seç.</p>')
  +'</section>'
  +(PP?'<section class="box" id="bkPpl"><h2>Kişi sayısı</h2><p>En fazla '+PP.max+' kişi. Her bebek bir yetişkinin kucağında yolculuk eder.</p><div class="bk-ppl">'
    +ROWS.map(r=>'<div class="bk-pr"><div><b>'+r[1]+'</b><small>'+r[2]+(r[3]?' · <i>'+tl(lvPrice(p.title,rowFull(r)))+'</i>':'')+'</small></div>'
      +'<div class="stp"><button type="button" data-pq="'+r[0]+'" data-d="-1" aria-label="'+r[1]+' azalt">−</button><output id="pq-'+r[0]+'" aria-live="polite">'+st.ppl[r[0]]+'</output><button type="button" data-pq="'+r[0]+'" data-d="1" aria-label="'+r[1]+' artır">+</button></div></div>').join('')
    +'</div></section>':'')
  +(RM?'<section class="box" id="bkRoom"><h2>Oda düzeni</h2><p>Fiyat iki kişilik odada kişi başı. Bebekler ebeveyn odasında kalır, bebek yatağı ücretsiz.</p>'
    +'<div class="bk-room">'+I.bed+'<div><b id="roomPlan"></b><span id="roomSub"></span></div></div>'
    +'<div class="bk-pr"><div><b>Tek kişilik oda</b><small>Kişi başı <i>+'+tl(lvPrice(p.title,RM.single))+'</i> fark</small></div>'
    +'<div class="stp"><button type="button" data-sg="-1" aria-label="Tek kişilik oda azalt">−</button><output id="sgl" aria-live="polite">0</output><button type="button" data-sg="1" aria-label="Tek kişilik oda artır">+</button></div></div>'
    +'<p class="bk-rn" id="roomNote" hidden></p></section>':'')
  +(DEP?'<section class="box" id="bkStop">'+stopBox()+'</section>':'')
  +(S.slots.length?'<section class="box" id="bkSlot"><h2>Saat</h2>'+radios('Saat',S.slots.map(s=>[s,/gün/.test(s)?'Saat':'Başlangıç',s]),st.slot)+'<p class="err" id="slotErr" hidden>Bir saat seç.</p></section>':'')
  +(S.opts.length?'<section class="box"><h2>'+(S.fixed?'Alan':{etkinlik:'Bilet türü',aktivite:'Paket'}[typeKey(p.type)]||'Seçenek')+'</h2><div class="bk-opts" role="radiogroup" aria-label="Seçenek">'
    +S.opts.map((o,i)=>'<button type="button" role="radio" aria-checked="'+(i===st.opt)+'" data-opt="'+i+'"><span>'+o[0]+'</span><b>'+tl(lvPrice(p.title,o[1]))+'</b></button>').join('')+'</div>'
    +(S.fixed?'<p>Fiyat seçtiğin alan için minimum harcama; mekânda harcamandan düşülür.</p>':'')+'</section>':'')
  +(S.qty?'<section class="box"><div class="bk-qty"><div><h2>'+S.qty.label+'</h2>'+(S.qty.note?'<p>'+S.qty.note+'</p>':'')+'</div>'
    +'<div class="stp"><button type="button" data-q="-1" aria-label="Azalt">−</button><output id="qty" aria-live="polite">'+st.qty+'</output><button type="button" data-q="1" aria-label="Artır">+</button></div></div></section>':'')
  +(S.deposit?'<section class="box"><h2>Nasıl ödemek istersin?</h2><div class="bk-opts" role="radiogroup" aria-label="Ödeme şekli">'
    +'<button type="button" role="radio" aria-checked="'+(st.pay==='kapora')+'" data-pay="kapora"><span>%20 kaporayla yerini ayırt<small>Bugün <i id="depNow">'+tl(Math.round(total()*S.deposit))+'</i>, kalanı kalkıştan 7 gün önce</small></span></button>'
    +'<button type="button" role="radio" aria-checked="'+(st.pay==='tam')+'" data-pay="tam"><span>Tamamını şimdi öde<small>Sonra hatırlaman gereken bir ödeme kalmaz</small></span></button></div>'
    +'<p></p></section>':'');
}

/* otel: giriş günü ve gece, misafirler ve çocuk yaşları, oda tipi ve oda sayısı */
const stepper=(attr,label,val)=>'<div class="stp"><button type="button" '+attr+' data-v="-1" aria-label="'+label+' azalt">−</button><output aria-live="polite">'+val+'</output><button type="button" '+attr+' data-v="1" aria-label="'+label+' artır">+</button></div>';
function kidBox(){return st.yas.map((a,i)=>'<div class="bk-f"><label for="ky-'+i+'">'+(st.yas.length>1?(i+1)+'. çocuğun yaşı':'Çocuğun yaşı')+'</label><select id="ky-'+i+'" data-ky="'+i+'"><option value="">Seç</option>'
  +Array.from({length:13},(_,y)=>'<option value="'+y+'"'+(String(a)===String(y)?' selected':'')+'>'+(y?y+' yaş':'1 yaşından küçük')+'</option>').join('')+'</select></div>').join('')
  +'<p class="err" id="kyErr" hidden></p>'}
function step1H(){
  return head
  +'<section class="box" id="bkDate"><h2>Giriş günü</h2><div class="u-dates bk-dg" id="bkDg" role="radiogroup" aria-label="Giriş günü">'+dateGrid(S.dates,st.date)+'</div>'
  +'<p class="err" id="dateErr" hidden>Devam etmek için giriş gününü seç.</p>'
  +'<div class="bk-pr u-night"><div><b>Kaç gece?</b><small id="hOut"></small></div>'+stepper('data-hg','Gece',st.gece)+'</div></section>'
  +'<section class="box" id="bkGuest"><h2>Misafirler</h2><p>'+(HR.extra?'0–'+HR.free+' yaş çocuklar ücretsiz; '+(HR.free+1)+'–12 yaş ek yatak gecelik '+tl(lvPrice(p.title,HR.extra))+'.':'12 yaşa kadar çocuklar ücretsiz.')+' 2 yaş altı bebek odadaki kişi sayısına girmez.</p><div class="bk-ppl">'
  +'<div class="bk-pr"><div><b>Yetişkin</b><small>13 yaş ve üzeri</small></div>'+stepper('data-hm="yetiskin"','Yetişkin',st.ms.yetiskin)+'</div>'
  +'<div class="bk-pr"><div><b>Çocuk</b><small>0–12 yaş</small></div>'+stepper('data-hm="cocuk"','Çocuk',st.ms.cocuk)+'</div></div>'
  +'<div class="bk-kids" id="bkKids">'+kidBox()+'</div></section>'
  +'<section class="box" id="bkOda"><h2>Oda</h2><p>Fiyatlar oda başı, gecelik'+(p.facts[1]?'; '+p.facts[1].toLocaleLowerCase('tr'):'')+'.</p><div class="u-rooms" role="radiogroup" aria-label="Oda">'
  +HR.rooms.map((r,i)=>'<button type="button" class="u-room" role="radio" aria-checked="'+(i===st.oda)+'" data-hoda="'+i+'"><span class="u-rm-h"><b>'+r.ad+'</b><i aria-hidden="true"></i></span>'
    +'<span class="u-rm-s">'+r.alt+'</span><span class="u-rm-f">'+IC.users+'En fazla '+r.kap+' kişi</span>'+(r.oz.length?'<span class="u-rm-o">'+r.oz.join(' · ')+'</span>':'')
    +'<span class="u-rm-p">'+(lvOn(p.title)?'<s>'+tl(r.fiyat)+'</s>':'')+'<strong>'+tl(lvPrice(p.title,r.fiyat))+'</strong><small>gecelik</small></span></button>').join('')+'</div>'
  +'<div class="bk-pr bk-rc"><div><b>Oda sayısı</b><small id="hRc"></small></div>'+stepper('data-hr','Oda',st.rc)+'</div>'
  +'<p class="err" id="rcErr" hidden></p></section>';
}

/* kalkış noktası: turun çıkış şehrindeki duraklar; tek durak bilgi olarak, birden çoksa seçim */
function stopBox(){const ss=DEP.stops,sub=DEP.city?'<p>'+DEP.city+' çıkışlı · '+DEP.how.toLocaleLowerCase('tr')+'</p>':'';
  if(ss.length===1){const x=ss[0];return '<h2>Kalkış noktası'+(x.saat?' ve saati':'')+'</h2>'+sub+'<div class="bk-stop1">'+I.pin+'<div><b>'+(x.saat?x.saat+' · ':'')+x.yer+'</b>'+(x.adres?'<span>'+x.adres+'</span>':'')+(x.not?'<p>'+x.not+'</p>':'')+'</div></div>'}
  return '<h2>Kalkış noktası ve saati</h2><p>'+DEP.city+' çıkışlı · '+DEP.how.toLocaleLowerCase('tr')+'. Sana en yakın noktadan katıl.</p><div class="bk-opts bk-stops" role="radiogroup" aria-label="Kalkış noktası">'
   +ss.map((x,i)=>'<button type="button" role="radio" aria-checked="'+(i===st.stop)+'" data-stop="'+i+'"><b class="t">'+x.saat+'</b><span>'+x.yer+'<small>'+x.adres+'</small></span></button>').join('')
   +'</div><p class="err" id="stopErr" hidden>Bir kalkış noktası seç.</p>'}

function pxBox(){
  const tc=S.idDoc==='tc',acc=getLevel()!=='guest';
  const fld=(k,f,label,attrs)=>'<div class="bk-f" data-w="'+k+'-'+f+'"><label for="px-'+k+'-'+f+'">'+label+'</label><input id="px-'+k+'-'+f+'" data-px="'+k+'" data-f="'+f+'" '+attrs+' value="'+esc((st.pax[k]||{})[f]||'')+'"><p class="err" id="px-'+k+'-'+f+'Err" hidden></p></div>';
  return '<section class="box" id="bkPx"><h2>Katılımcılar</h2><p>Yolcu listesi ve seyahat sigortası için. '
   +(tc?'Yetişkinlerde T.C. kimlik numarası gerekli.':'Yurt dışı turunda herkes için pasaport numarası gerekli; pasaportun dönüşten sonra en az 6 ay geçerli olmalı.')+'</p>'
   +people().map(x=>{const k=x.key,v=st.pax[k]||{},me=k==='yetiskin-0';
     return '<fieldset class="bk-px"><legend>'+(x.many?x.n+'. ':'')+x.label+'</legend>'
      +(me?'<label class="bk-ck"><input type="checkbox" id="pxBen"'+(st.ben?' checked':'')+'><span>Bu kişi benim</span></label>'
        +'<p class="bk-me" id="pxMe"><b>'+esc(st.name||'Adın soyadın')+'</b>'+(tc&&acc?'<span>T.C. kimlik no •••••••'+ME_TC_SON+' · hesabından</span>':'')+'</p>':'')
      +fld(k,'ad','Ad soyad','type="text" autocomplete="'+(me?'name':'off')+'" maxlength="60"')
      +(x.yas?'<div class="bk-f" data-w="'+k+'-yas"><label for="px-'+k+'-yas">Yaşı</label><select id="px-'+k+'-yas" data-px="'+k+'" data-f="yas"><option value="">Seç</option>'
          +Array.from({length:x.yas[1]-x.yas[0]+1},(_,i)=>x.yas[0]+i).map(y=>'<option value="'+y+'"'+(String(v.yas)===String(y)?' selected':'')+'>'+(y?y+' yaş':'1 yaşından küçük')+'</option>').join('')
          +'</select><p class="err" id="px-'+k+'-yasErr" hidden></p></div>':'')
      +(tc&&!x.yas?fld(k,'tc','T.C. kimlik no','type="text" inputmode="numeric" maxlength="11" autocomplete="off"')
        +'<label class="bk-ck"><input type="checkbox" data-yab="'+k+'"'+(v.yab?' checked':'')+'><span>T.C. vatandaşı değilim</span></label>':'')
      +fld(k,'pas','Pasaport no','type="text" maxlength="12" autocomplete="off" autocapitalize="characters"')
      +'</fieldset>'}).join('')
   +'<label class="bk-lb" for="bkNote">Özel istek <span>(isteğe bağlı)</span></label><textarea id="bkNote" rows="2" maxlength="300" placeholder="Ör. vejetaryen menü, bebek arabası">'+esc(st.note)+'</textarea>'
   +'</section>';
}
/* otel: her odada kalacak bir kişinin adı (girişte kimlikle karşılanır), varış saati, özel istek */
const VARIS=['14:00–16:00','16:00–18:00','18:00–20:00','20:00–22:00','22:00 sonrası','Henüz bilmiyorum'];
function guestBox(){
  return '<section class="box" id="bkPx"><h2>Odalarda kalacaklar</h2><p>Her oda için bir kişinin adı; girişte kimliğiyle karşılanır.</p>'
   +hNames().map(x=>{const k=x.key,v=st.pax[k]||{},me=k==='oda-0';
     return '<fieldset class="bk-px"><legend>'+(st.rc>1?x.n+'. oda · ':'')+RT().ad+'</legend>'
      +(me?'<label class="bk-ck"><input type="checkbox" id="pxBen"'+(st.ben?' checked':'')+'><span>Ben kalacağım</span></label><p class="bk-me" id="pxMe"><b>'+esc(st.name||'Adın soyadın')+'</b></p>':'')
      +'<div class="bk-f" data-w="'+k+'-ad"><label for="px-'+k+'-ad">Ad soyad</label><input id="px-'+k+'-ad" data-px="'+k+'" data-f="ad" type="text" maxlength="60" autocomplete="off" value="'+esc(v.ad||'')+'"><p class="err" id="px-'+k+'-adErr" hidden></p></div>'
      +'</fieldset>'}).join('')
   +'<div class="bk-f"><label for="bkVaris">Tahmini varış saatin <span>(isteğe bağlı)</span></label><select id="bkVaris"><option value="">Seç</option>'+VARIS.map(x=>'<option'+(x===st.varis?' selected':'')+'>'+x+'</option>').join('')+'</select></div>'
   +'<label class="bk-lb" for="bkNote">Özel istek <span>(isteğe bağlı)</span></label><textarea id="bkNote" rows="2" maxlength="300" placeholder="Ör. erken giriş, bitişik oda, bebek yatağı">'+esc(st.note)+'</textarea>'
   +'</section>';
}
/* katılımcı alanlarının görünürlüğü: "Bu kişi benim" ve vatandaşlık seçimine göre */
function syncPx(){if(HR){const me=document.getElementById('pxMe');if(me){me.hidden=!st.ben;me.querySelector('b').textContent=st.name||'Adın soyadın'}
    const w=main.querySelector('[data-w="oda-0-ad"]');if(w)w.hidden=st.ben;return}
  if(!PP)return;const tc=S.idDoc==='tc',acc=getLevel()!=='guest';
  const w=id=>main.querySelector('[data-w="'+id+'"]'),hide=(id,h)=>{const e=w(id);if(e)e.hidden=h};
  const me=document.getElementById('pxMe');if(me){me.hidden=!st.ben;me.querySelector('b').textContent=st.name||'Adın soyadın'}
  people().forEach(x=>{const k=x.key,v=st.pax[k]||{},m=meOn(k);
    hide(k+'-ad',m);
    hide(k+'-tc',!tc||!!x.yas||!!v.yab||(m&&acc));
    hide(k+'-pas',tc&&!(v.yab&&!x.yas));
    const y=main.querySelector('[data-yab="'+k+'"]');if(y)y.closest('label').hidden=m&&acc});
}
/* T.C. kimlik numarası denetimi (11 hane, son iki hane kontrol hanesi) */
function tcOk(n){if(!/^[1-9]\d{10}$/.test(n))return false;const d=[...n].map(Number);
  const o=d[0]+d[2]+d[4]+d[6]+d[8],e=d[1]+d[3]+d[5]+d[7];
  return ((o*7-e)%10+10)%10===d[9]&&d.slice(0,10).reduce((a,b)=>a+b,0)%10===d[10]}

function step2(){
  const f=(id,label,type,ac,v,extra)=>'<label for="'+id+'">'+label+'</label><input id="'+id+'" name="'+id+'" type="'+type+'" autocomplete="'+ac+'" value="'+esc(v)+'"'+(extra||'')+'><p class="err" id="'+id+'Err" hidden></p>';
  return head
  +'<section class="box"><h2>İletişim bilgilerin</h2><p>Biletin ve rezervasyon bilgilerin bu adrese gelir. Yalnızca bu rezervasyon için kullanılır.</p>'
  +'<form class="bk-form" id="bkForm" novalidate>'
  +f('name','Ad soyad','text','name',st.name)
  +f('phone','Telefon','tel','tel',st.phone,' inputmode="tel" placeholder="05xx xxx xx xx"')
  +f('email','E-posta','email','email',st.email,' inputmode="email"')
  +'</form>'+(getLevel()==='guest'?'<p class="bk-login">Hesabın var mı? <a href="#giris" data-rz-login>Giriş yap</a>, bilgilerin dolsun.</p>':'')+'</section>'
  +(PP?pxBox():HR?guestBox():'');
}

function step3(){
  const so=stopOf();
  const ci=parseDay(st.date),names=HR?hNames().map(x=>esc(meOn(x.key)?st.name:(st.pax[x.key]||{}).ad)).join('<br>'):'';
  const rows=HR?[['Giriş',ci?longDate(ci)+' · '+HR.giris:st.date],['Çıkış',outDay()?longDate(outDay())+' · '+HR.cikis:''],['Konaklama',st.gece+' gece'],
    ['Oda',st.rc+' × '+RT().ad],['Misafir',guestTxt()+(st.yas.length?' <small>('+st.yas.map(a=>+a?a+' yaş':'bebek').join(', ')+')</small>':'')],['Odada kalan',names],
    st.varis&&['Varış',esc(st.varis)],st.note.trim()&&['Özel istek',esc(st.note.trim())]].filter(Boolean):[['Tarih',so?st.date:when()],RM&&['Oda',roomTxt(rooms())],so&&['Kalkış',(so.saat?so.saat+' · ':'')+so.yer],
    S.opts.length&&[S.fixed?'Alan':{etkinlik:'Bilet türü',aktivite:'Paket'}[typeKey(p.type)]||'Seçenek',S.opts[st.opt][0]],S.qty&&[S.qty.label,qtyTxt()],
    PP&&['Kişi',qtyTxt()],PP&&['Katılımcılar',people().map(x=>esc(meOn(x.key)?st.name:(st.pax[x.key]||{}).ad)+(x.yas?' <small>('+(+(st.pax[x.key]||{}).yas?(st.pax[x.key]||{}).yas+' yaş':'bebek')+')</small>':'')).join('<br>')],
    PP&&st.note.trim()&&['Özel istek',esc(st.note.trim())]].filter(Boolean);
  const lv=lvOn(p.title);
  const pts=Math.floor(total()/100);
  return head
  +'<section class="box"><h2>Özet</h2><dl class="bk-sum">'+rows.map(r=>'<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>').join('')+'<div><dt>İletişim</dt><dd>'+esc(st.name)+'<br>'+esc(st.email)+'</dd></div></dl></section>'
  +'<section class="box"><h2>Fiyat</h2><dl class="bk-sum price">'
  +(HR?'<div><dt>'+RT().ad+' '+tl(RT().fiyat)+' × '+st.gece+' gece'+(st.rc>1?' × '+st.rc+' oda':'')+'</dt><dd>'+tl(roomGross())+'</dd></div>'
     +(extraK()?'<div><dt>Çocuk ek yatak '+tl(HR.extra)+' × '+st.gece+' gece'+(extraK()>1?' × '+extraK():'')+'</dt><dd>'+tl(kidGross())+'</dd></div>':'')
     +(lv?'<div><dt>Kâşif indirimi %10</dt><dd class="ok">−'+tl(gross()-total())+'</dd></div>':'')
   :PP?ROWS.filter(r=>st.ppl[r[0]]).map(r=>'<div><dt>'+r[1]+(rowFull(r)?' '+tl(rowFull(r))+' × '+st.ppl[r[0]]:' × '+st.ppl[r[0]])+'</dt><dd>'+(rowFull(r)?tl(rowFull(r)*st.ppl[r[0]]):'Ücretsiz')+'</dd></div>').join('')
     +(sglFee()?'<div><dt>Tek kişilik oda farkı '+tl(RM.single)+' × '+rooms().single+'</dt><dd>'+tl(sglFee())+'</dd></div>':'')
     +(lvOn(p.title)?'<div><dt>Kâşif indirimi %10</dt><dd class="ok">−'+tl(gross()-total())+'</dd></div>':'')
   :S.fixed?'<div><dt>Minimum harcama</dt><dd>'+tl(unit())+'</dd></div>'
    :'<div><dt>'+tl(full())+' × '+qtyTxt()+'</dt><dd>'+tl(full()*st.qty)+'</dd></div>'
     +(lv?'<div><dt>Kâşif indirimi %10</dt><dd class="ok">−'+tl(full()*st.qty-total())+'</dd></div>':''))
  +'<div><dt>Hizmet bedeli</dt><dd>0 TL</dd></div>'
  +'<div class="tot"><dt>Toplam</dt><dd>'+tl(total())+'</dd></div>'
  +(st.pay==='kapora'?'<div class="now"><dt>Bugün ödenecek (%20 kapora)</dt><dd>'+tl(now())+'</dd></div><div><dt>Kalan, kalkıştan 7 gün önce</dt><dd>'+tl(total()-now())+'</dd></div>':'')
  +'</dl><p>Gördüğün toplam, ödeyeceğin toplam: sonradan eklenen ücret yok.'+(HR?' Konaklama vergisi ve KDV dahil.':'')+'</p></section>'
  +'<section class="box"><h2>İptal</h2><ul class="ticks"><li>'+IC.check+'<div><b>'+S.cancel+'.</b> <span>'+cxl()+'</span></div></li></ul></section>'
  +'<section class="box"><h2>Ödeme</h2><div class="bk-pay">'+IC.shield+'<p><b>Kartla güvenli ödeme (3D Secure)</b> Kart bilgilerini bankanın güvenli ödeme sayfasında girersin; kart bilgin Mola360\'ta saklanmaz.</p></div>'
  +'<ul class="ticks"><li>'+IC.check+'<div><b>3 taksit, vade farksız</b> <span>Anlaşmalı kartlarla.</span></div></li>'
  +'<li>'+IC.check+'<div><b>'+(getLevel()==='guest'?'Üyeler bu rezervasyondan '+pts+' Molapuan kazanır':'Bu rezervasyondan '+pts+' Molapuan kazanırsın')+'</b> <span>100 TL = 1 puan.</span></div></li></ul>'
  +'<label class="bk-ok"><input type="checkbox" id="okBox"'+(st.ok?' checked':'')+'><span><a href="#yakinda">Ön bilgilendirme formunu</a> ve <a href="#yakinda">mesafeli satış sözleşmesini</a> okudum, onaylıyorum.</span></label><p class="err" id="okErr" hidden>Devam etmek için sözleşmeyi onaylaman gerekiyor.</p></section>';
}

/* seçilen tarihe göre son ücretsiz iptal günü */
function cxl(){const c=cancelBy(p,st.date);
  return !c?'Sonrasında iptal edersen ödediğin tutar iade edilmez.':c.past?'Bu tarihte ücretsiz iptal süresi doldu; iptal edersen ödediğin tutar iade edilmez.':'Bu rezervasyon için son gün '+c.date+'; sonrasında iptalde ödeme iade edilmez.'}

const stayTxt=()=>{const a=parseDay(st.date),b=outDay();return a&&b?a.getDate()+' '+a.toLocaleDateString('tr-TR',{month:'long'})+' – '+b.getDate()+' '+b.toLocaleDateString('tr-TR',{month:'long'})+' · '+st.gece+' gece':when()};
function done(r){
  return '<div class="bk-done"><span class="ei">'+IC.check+'</span><h2>Rezervasyonun alındı</h2><p>'+p.title+'<br>'+(HR?stayTxt()+'<br>'+st.rc+' × '+RT().ad:when()+(S.qty?' · '+qtyTxt():''))+'</p>'
  +'<p class="no">Rezervasyon no <b>'+r.no+'</b></p></div>'
  +'<section class="box"><h2>Sırada ne var?</h2><ul class="ticks">'
  +(HR?'<li>'+I.bed+'<div><b>Giriş '+(parseDay(st.date)?longDate(parseDay(st.date)):st.date)+', '+HR.giris+'\'ten itibaren</b> <span>Resepsiyonda kimliğini göstermen yeterli; çıkış '+HR.cikis+'\'ye kadar.</span></div></li>':'')
  +(stopOf()?'<li>'+I.pin+'<div><b>Kalkış '+[stopOf().saat,stopOf().yer].filter(Boolean).join(' · ')+'</b> <span>'+(stopOf().not||stopOf().adres)+'</span></div></li>':'')
  +'<li>'+IC.check+'<div><b>Bilgiler e-postanda</b> <span>'+esc(st.email)+' adresine bilet ve buluşma bilgisi gider.</span></div></li>'
  +(st.pay==='kapora'?'<li>'+IC.check+'<div><b>Kalan '+tl(total()-now())+'</b> <span>Kalkıştan 7 gün önce hatırlatırız; Planlarım\'dan ödeyebilirsin.</span></div></li>':'')
  +'<li>'+IC.check+'<div><b>Döndükten sonra paylaş</b> <span>Paylaşımın bu deneyimin sayfasında ve Bağlan\'da "Mola360 ile gitti" rozetiyle görünür.</span></div></li></ul></section>'
  +(getLevel()==='guest'?guestNudge(Math.floor(total()/100)):'')
  +'<div class="bk-acts"><a class="btn" href="'+ROOT+'planlarim/">Planlarım</a><button type="button" class="btn ghost" data-invite>'+IC.share+'Birlikte gideceklere gönder</button></div>';
}

const LABEL={1:'Devam et',2:'Ödemeye geç'};
function drawCta(){
  if(st.step===4){cta.hidden=true;return}
  cta.hidden=false;
  const small=st.step===3&&st.pay==='kapora'?'Bugün ödenecek':(S.fixed?'minimum harcama':'toplam'+(HR?' · '+st.gece+' gece · '+st.rc+' oda':PP?' · '+heads()+' kişi':S.qty?' · '+qtyTxt():''));
  cta.innerHTML='<div class="pp"><small>'+small+'</small><strong>'+tl(st.step===3?now():total())+'</strong></div>'
   +'<button type="button" class="btn green" id="ctaGo">'+(LABEL[st.step]||tl(now())+' öde')+'</button>';
}
let last=null,calm=0;
function draw(push){
  document.querySelectorAll('#steps li').forEach((li,i)=>{li.classList.toggle('on',i+1===st.step);li.classList.toggle('ok',i+1<st.step);if(i+1===st.step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
  document.getElementById('steps').hidden=st.step===4;
  main.innerHTML=st.step===1?step1():st.step===2?step2():st.step===3?step3():done(last);
  if(st.step===1)refresh();else drawCta();
  if(st.step===2)syncPx();
  if(push)history.pushState({...history.state,s:st.step,m360d:((history.state||{}).m360d||0)+1},'');
  save();
  window.scrollTo(0,0);
}
/* yenilemede akış kaybolmasın: seçimler ve form bu sekmede (sessionStorage)
   tutulur, adım geçmişteki kayıttan gelir; rezervasyon bitince silinir */
const KEY='m360bk:'+p.id;
const save=()=>{try{st.step<4?sessionStorage.setItem(KEY,JSON.stringify(st)):sessionStorage.removeItem(KEY)}catch(e){}};
const was=history.state&&history.state.s;
if(was===4){location.replace(ROOT+'planlarim/');return}
let restored=false;
try{const d=was&&JSON.parse(sessionStorage.getItem(KEY)||'null');if(d){Object.assign(st,d,{step:was});restored=true;
  /* yarım kalan rezervasyonun günü bu arada geçmiş ya da kalkmış olabilir: seçilebilir değilse yeniden seçilir */
  if(!S.dates.some(x=>dateKey(x)===st.date))st.date=S.dates.length===1?dateKey(S.dates[0]):'';
  if(!S.slots.includes(st.slot))st.slot=S.slots.length===1?S.slots[0]:'';
  if(!S.opts[st.opt])st.opt=S.opts.length?0:-1;st.qty=S.qty?Math.max(S.qty.min,Math.min(S.qty.max,+st.qty||1)):1;
  if(PP&&!(st.ppl&&st.ppl.yetiskin>=1))st.ppl={yetiskin:2,cocuk:0,bebek:0};
  if(HR&&!(st.ms&&st.ms.yetiskin>=1&&Array.isArray(st.yas)&&HR.rooms[st.oda]&&st.gece>=1)){st.ms={yetiskin:2,cocuk:0};st.yas=[];st.oda=0;st.gece=2;st.rc=1}if(!DEP||!DEP.stops[st.stop])st.stop=DEP&&DEP.stops.length===1?0:-1;if(!st.pax)st.pax={};if(!(st.sgl>=0))st.sgl=0}}catch(e){}
if(!restored)history.replaceState({...history.state,s:1},'');
/* seçim adımında zorunlu olan bir seçim eksik mi (gün, saat, kalkış noktası) */
const needPick=()=>!!((S.dates.length&&!st.date)||(S.slots.length&&!st.slot)||(DEP&&st.stop<0));
/* geri yüklenen rezervasyonda seçim artık geçerli değilse seçim adımından devam edilir */
if(restored&&st.step>1&&st.step<4&&needPick()){st.step=1;history.replaceState({...history.state,s:1},'')}
/* aynı adımda kalan geri (açık menüyü kapatan geri tuşu) adımı yeniden çizmez */
window.addEventListener('popstate',e=>{const s=e.state&&e.state.s||1;if(s===st.step)return;if(st.step===4){location.href=ROOT+'planlarim/';return}st.step=s;draw(false)});
/* başlıktaki geri: ara adımda bir önceki adıma; ilk adımda geldiğin sayfaya (shell.js data-back);
   onaydan sonra deneyimin sayfasına */
back.addEventListener('click',e=>{if(st.step>1&&st.step<4){e.preventDefault();history.back()}else if(st.step===4){e.preventDefault();location.href=productUrl}
  else if(dirty()){e.preventDefault();exitSheet().open(back,document.getElementById('exStay'))}});

/* hesaptakinden farklı bir bilgi ya da katılımcı bilgisi girildi mi */
const dirty=()=>['name','phone','email'].some(k=>st[k]&&st[k]!==ME_C[k])||Object.values(st.pax||{}).some(v=>Object.values(v).some(Boolean))||!!st.note.trim();
/* İletişim bilgisi girildiyse çıkmadan önce sorulur; iki seçenek de açıkça görünür */
let ex=null;
function exitSheet(){if(ex)return ex;
  main.insertAdjacentHTML('afterend','<div class="sh-bg" id="exBg"></div><div class="sheet ex" id="exSheet" role="alertdialog" aria-modal="true" aria-labelledby="exTtl" aria-describedby="exTxt">'
   +'<div class="sh-grab"></div><div class="sh-hd"><h3 id="exTtl">Rezervasyondan çıkılsın mı?</h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div>'
   +'<p class="ex-t" id="exTxt">Seçtiğin tarih ve girdiğin bilgiler silinir.</p>'
   +'<div class="ex-b"><button type="button" class="btn green" id="exStay" data-x>Rezervasyona devam et</button><button type="button" class="btn ghost" id="exGo">Çık</button></div></div>');
  ex=makeSheet(document.getElementById('exSheet'),document.getElementById('exBg'));
  document.getElementById('exGo').addEventListener('click',()=>{
    try{sessionStorage.removeItem(KEY)}catch(e){}
    const t=backTo(productUrl);
    /* çekmecenin geçmiş adımı ile rezervasyon sayfası birlikte geçilir */
    if(t&&typeof t.go==='number')history.go(t.go);else if(t&&t.back)history.go(-2);else ex.go(t?t.url:productUrl)});
  return ex}

const show=(id,msg)=>{const el=document.getElementById(id);if(!el)return;el.hidden=!msg;if(msg)el.textContent=msg};
function check2(){
  st.name=document.getElementById('name').value.trim();st.phone=document.getElementById('phone').value.trim();st.email=document.getElementById('email').value.trim();
  const e={name:st.name.length<3||!st.name.includes(' ')?'Adını ve soyadını yaz.':'',
    phone:st.phone.replace(/\D/g,'').length<10?'Telefon numarası en az 10 rakam olmalı.':'',
    email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(st.email)?'':'Geçerli bir e-posta adresi yaz.'};
  Object.entries(e).forEach(([k,m])=>{show(k+'Err',m);document.getElementById(k).setAttribute('aria-invalid',!!m)});
  /* otel: odada kalacakların adı */
  if(HR)hNames().forEach(x=>{if(meOn(x.key))return;const ad=((st.pax[x.key]||{}).ad||'').trim(),id='px-'+x.key+'-ad';
    e[id]=ad.length<3||!ad.includes(' ')?'Adını ve soyadını yaz.':'';show(id+'Err',e[id]);const el=document.getElementById(id);if(el)el.setAttribute('aria-invalid',!!e[id])});
  /* katılımcılar */
  if(PP){const tc=S.idDoc==='tc',acc=getLevel()!=='guest';
    people().forEach(x=>{const k=x.key,v=st.pax[k]=st.pax[k]||{},m=meOn(k),id=f=>'px-'+k+'-'+f;
      const ad=(v.ad||'').trim(),pas=(v.pas||'').trim(),t=(v.tc||'').trim();
      if(!m)e[id('ad')]=ad.length<3||!ad.includes(' ')?'Adını ve soyadını yaz.':'';
      if(x.yas)e[id('yas')]=v.yas===undefined||v.yas===''?'Yaşını seç.':'';
      const needTc=tc&&!x.yas&&!v.yab&&!(m&&acc),needPas=!tc||(v.yab&&!x.yas);
      if(needTc)e[id('tc')]=!t?'T.C. kimlik numarasını yaz.':tcOk(t)?'':'T.C. kimlik numarası geçersiz; 11 haneyi kontrol et.';
      if(needPas)e[id('pas')]=/^[A-Za-z0-9]{6,12}$/.test(pas)?'':'Pasaport numarasını yaz (6–12 harf ve rakam).'});
    Object.entries(e).forEach(([k,m])=>{if(!k.startsWith('px-'))return;show(k+'Err',m);const el=document.getElementById(k);if(el)el.setAttribute('aria-invalid',!!m)})}
  const bad=Object.keys(e).find(k=>e[k]);if(bad){const el=document.getElementById(bad);el.focus();el.scrollIntoView({block:'center'})}
  return !bad;
}
/* oturumdaki kullanıcının iletişim bilgileri (boş alanlara) */
/* hesaptaki bilgiler: yalnızca bunlar varken çıkarken sorulmaz */
const ME_C={name:'Ayşe Yılmaz',phone:'0532 418 27 63',email:'ayse.yilmaz@mail.com'};
function fillMe(){for(const k in ME_C)if(!st[k])st[k]=ME_C[k];save()}
cta.addEventListener('click',e=>{if(!e.target.closest('#ctaGo')||Date.now()<calm)return;
  /* geri tuşuyla dönülen ara adımda seçim eksikse ödemeye geçilmez */
  if(st.step>1&&st.step<4&&needPick()){st.step=1;history.replaceState({...history.state,s:1},'');draw(false);return}
  if(st.step===1){
    if(!st.date){show('dateErr','Devam etmek için bir tarih seç.');document.getElementById('bkDate').scrollIntoView({behavior:'smooth',block:'center'});return}
    if(HR){if(st.yas.some(a=>a==='')){show('kyErr','Çocukların yaşını seç; fiyat ve oda düzeni buna göre hesaplanır.');document.getElementById('bkGuest').scrollIntoView({behavior:'smooth',block:'center'});return}
      if(needR()>maxR()){document.getElementById('bkOda').scrollIntoView({behavior:'smooth',block:'center'});return}}
    if(DEP&&st.stop<0){show('stopErr','Bir kalkış noktası seç.');document.getElementById('bkStop').scrollIntoView({behavior:'smooth',block:'center'});return}
    if(S.slots.length&&!st.slot){show('slotErr','Bir saat seç.');document.getElementById('bkSlot').scrollIntoView({behavior:'smooth',block:'center'});return}
  }
  if(st.step===2&&!check2())return;
  if(st.step===3){
    if(!st.ok){show('okErr','Devam etmek için sözleşmeyi onaylaman gerekiyor.');document.getElementById('okBox').focus();return}
    last=createBooking({productId:p.id,date:HR?st.date+' · '+st.gece+' gece':st.date,slot:HR?'Giriş '+HR.giris:st.slot,opt:HR?RT().ad:st.opt>=0?S.opts[st.opt][0]:'',qty:HR?st.rc+' oda':qtyTxt(),total:total(),paid:now(),pay:st.pay,...(RM?{rooms:roomTxt(rooms())}:{}),
      ...(stopOf()?{slot:stopOf().saat||st.slot,meet:{yer:stopOf().yer,adres:stopOf().adres||p.place,saat:stopOf().saat,not:stopOf().not}}:{})});
    st.step=4;history.replaceState({...history.state,s:4},'');draw(false);return;
  }
  /* sonraki adımın düğmesi kısa bir süre dokunuş almaz: "Devam et"e çift
     dokunuş boş formu gönderip hata göstermesin */
  calm=Date.now()+450;st.step++;draw(true);
});
/* adım içindeki seçimler sayfayı yeniden çizmez: odak ve kaydırma yerinde kalır */
const radio=(sel,el)=>main.querySelectorAll(sel).forEach(x=>x.setAttribute('aria-checked',x===el));
function refresh(){
  if(HR)refreshH();
  const q=document.getElementById('qty');if(q)q.textContent=st.qty;
  const d=document.getElementById('depNow');if(d)d.textContent=tl(Math.round(total()*S.deposit));
  main.querySelectorAll('[data-q]').forEach(b=>b.disabled=+b.dataset.q<0?st.qty<=S.qty.min:st.qty>=S.qty.max);
  if(PP){ROWS.forEach(r=>{const o=document.getElementById('pq-'+r[0]);if(o)o.textContent=st.ppl[r[0]]});
    main.querySelectorAll('[data-pq]').forEach(b=>{const k=b.dataset.pq,up=+b.dataset.d>0;
      b.disabled=up?(k==='bebek'?st.ppl.bebek>=st.ppl.yetiskin:seats()>=PP.max):st.ppl[k]<=(k==='yetiskin'?1:0)})}
  if(RM&&document.getElementById('roomPlan')){st.sgl=Math.min(st.sgl,sglMax());const r=rooms();
    document.getElementById('roomPlan').textContent=roomTxt(r);
    document.getElementById('roomSub').textContent=r.count+' oda · '+qtyTxt();
    document.getElementById('sgl').textContent=r.single;
    main.querySelectorAll('[data-sg]').forEach(b=>b.disabled=+b.dataset.sg>0?st.sgl>=sglMax()||r.single>=st.ppl.yetiskin:st.sgl<=0);
    const n=document.getElementById('roomNote');n.hidden=!r.forced;
    if(r.forced)n.textContent=seats()===1?'Tek kişi katıldığın için oda tek kişilik; fark fiyata eklendi.':'Bir yetişkin tek kaldığı için tek kişilik odada kalır; fark fiyata eklendi.'}
  drawCta();save();
}
/* otel adımı: sayılar, düğmelerin sınırları, çıkış günü ve oda sayısı */
function refreshH(){if(!document.getElementById('bkGuest'))return;fitR();
  const o=(sel,v)=>{const b=main.querySelector(sel);if(b)b.closest('.stp').querySelector('output').textContent=v};
  o('[data-hg]',st.gece);o('[data-hm="yetiskin"]',st.ms.yetiskin);o('[data-hm="cocuk"]',st.ms.cocuk);o('[data-hr]',st.rc);
  main.querySelectorAll('[data-hg]').forEach(b=>b.disabled=+b.dataset.v<0?st.gece<=1:st.gece>=HR.maxNights);
  main.querySelectorAll('[data-hm]').forEach(b=>{const k=b.dataset.hm,up=+b.dataset.v>0;b.disabled=up?(k==='yetiskin'?st.ms.yetiskin>=8:st.ms.cocuk>=4):st.ms[k]<=(k==='yetiskin'?1:0)});
  main.querySelectorAll('[data-hr]').forEach(b=>b.disabled=+b.dataset.v<0?st.rc<=needR():st.rc>=maxR());
  const out=outDay();document.getElementById('hOut').textContent=out?'Çıkış '+longDate(out)+' · '+HR.cikis:'';
  const bad=needR()>maxR();
  document.getElementById('hRc').textContent=bad?'':needR()>1?capN()+' kişi bu odaya en az '+needR()+' oda olarak sığar':guestTxt();
  show('rcErr',bad?'Her odada en az bir yetişkin kalmalı. '+capN()+' kişi bu odaya '+needR()+' oda olarak sığar; yetişkin ekle ya da daha büyük bir oda seç.':'');
}
const regrid=()=>{const g=document.getElementById('bkDg');if(g)g.innerHTML=dateGrid(S.dates,st.date)};
main.addEventListener('click',e=>{
  const gn=e.target.closest('[data-gun]');if(gn){st.date=gn.dataset.gun;regrid();show('dateErr','');refresh();return}
  const al=e.target.closest('[data-all-d]');if(al){openDates(S.dates,st.date,k=>{st.date=k;regrid();show('dateErr','');refresh()},al,HR?'giriş günü':'gün');return}
  const hg=e.target.closest('[data-hg]');if(hg){st.gece=Math.max(1,Math.min(HR.maxNights,st.gece+ +hg.dataset.v));refresh();return}
  const hm=e.target.closest('[data-hm]');if(hm){const k=hm.dataset.hm;st.ms[k]=Math.max(k==='yetiskin'?1:0,st.ms[k]+ +hm.dataset.v);
    if(k==='cocuk'){st.yas=st.yas.slice(0,st.ms.cocuk);while(st.yas.length<st.ms.cocuk)st.yas.push('');document.getElementById('bkKids').innerHTML=kidBox()}
    refresh();return}
  const ho=e.target.closest('[data-hoda]');if(ho){st.oda=+ho.dataset.hoda;radio('[data-hoda]',ho);st.rc=1;refresh();return}
  const hr=e.target.closest('[data-hr]');if(hr){st.rc+= +hr.dataset.v;refresh();return}
  const d=e.target.closest('[data-tarih]');if(d){st.date=d.dataset.tarih;radio('[data-tarih]',d);show('dateErr','');refresh();return}
  const s=e.target.closest('[data-saat]');if(s){st.slot=s.dataset.saat;radio('[data-saat]',s);show('slotErr','');refresh();return}
  const o=e.target.closest('[data-opt]');if(o){st.opt=+o.dataset.opt;radio('[data-opt]',o);refresh();return}
  const y=e.target.closest('[data-pay]');if(y){st.pay=y.dataset.pay;radio('[data-pay]',y);refresh();return}
  const pq=e.target.closest('[data-pq]');if(pq){const k=pq.dataset.pq,d=+pq.dataset.d,c=st.ppl;
    if(d>0&&(k==='bebek'?c.bebek>=c.yetiskin:seats()>=PP.max))return;
    c[k]=Math.max(k==='yetiskin'?1:0,c[k]+d);if(c.bebek>c.yetiskin)c.bebek=c.yetiskin;refresh();return}
  const sg=e.target.closest('[data-sg]');if(sg){st.sgl=Math.max(0,Math.min(sglMax(),st.sgl+ +sg.dataset.sg));refresh();return}
  const so=e.target.closest('[data-stop]');if(so){st.stop=+so.dataset.stop;radio('[data-stop]',so);show('stopErr','');refresh();return}
  const n=e.target.closest('[data-q]');if(n){st.qty=Math.max(S.qty.min,Math.min(S.qty.max,st.qty+ +n.dataset.q));refresh();return}
  /* misafir: giriş bilgileri doldurur; onayda hesap oluşturunca puan hesaba geçer */
  const lg=e.target.closest('[data-rz-login]');if(lg){e.preventDefault();openLogin(lg,'login',()=>{fillMe();draw(false)});return}
  const j=e.target.closest('[data-rz-join]');if(j){openLogin(j,'join',()=>{const n=j.closest('.gi-n');
    n.innerHTML='<img src="'+ROOT+'img/molapuan.webp" alt="" width="40" height="40"><div><b>Hesabın hazır</b><p>'+n.dataset.pts+' Molapuan hesabına eklendi. Rezervasyonun Planlarım\'da.</p></div>';n.classList.add('ok')});return}
  if(e.target.closest('[data-invite]')){
    if(navigator.share)navigator.share({title:p.title,text:when()+' · '+p.title+' için yerimizi ayırttım.',url:new URL(productUrl,location.href).href}).catch(()=>{});
    else toast('Paylaşım bu tarayıcıda yok; bağlantıyı kopyalayıp gönderebilirsin.','Tamam',()=>{},3500);return}
});
main.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.ky!==undefined){st.yas[+t.dataset.ky]=t.value;if(!st.yas.some(a=>a===''))show('kyErr','');refresh()}
  if(t.id==='bkVaris')st.varis=t.value;
  if(t.id==='okBox'){st.ok=t.checked;if(st.ok)show('okErr','')}
  if(t.id==='pxBen'){st.ben=t.checked;syncPx()}
  if(t.dataset.yab){(st.pax[t.dataset.yab]=st.pax[t.dataset.yab]||{}).yab=t.checked;syncPx()}
  if(t.dataset.px){(st.pax[t.dataset.px]=st.pax[t.dataset.px]||{})[t.dataset.f]=t.value}
  save()});
main.addEventListener('input',e=>{const t=e.target;if(st.step!==2)return;
  if(['name','phone','email'].includes(t.id)){st[t.id]=t.value;if(t.id==='name')syncPx()}
  else if(t.dataset.px)(st.pax[t.dataset.px]=st.pax[t.dataset.px]||{})[t.dataset.f]=t.value;
  else if(t.id==='bkNote')st.note=t.value;
  save()});

if(getLevel()!=='guest')fillMe();
renderShell('kesfet',{nav:false});
draw(false);
}
