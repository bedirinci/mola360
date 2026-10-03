/* Veri katmanı: yeni sayfalar veriyi yalnızca buradan okur (docs/yeni-surum.md
   kural 6). Bugün örnek veriyi (data.js) tek bir ürün şekline çeviriyor;
   backend geldiğinde yalnızca bu dosyanın içi değişecek. Alan adları
   backend'deki `content` tablosuna yakın: id (slug), type, title, place,
   price, unit, score, count. */
import { ITEMS, EV, HT, VN, G, POSTS, USERS, BUCKETS, WITH, KIMLE, THEMES, DESTS, WHEN, GEO, IMG, POP } from './data.js';
import { DETAY, BASLIK, YORUM } from './icerik.js';
import { ROOT } from './root.js';

/* Keşif filtreleri: süre, kiminle ve ne zaman (kategori değil) */
export { BUCKETS, WITH, WHEN };

const TR_MAP={ı:'i',ğ:'g',ü:'u',ş:'s',ö:'o',ç:'c',â:'a',î:'i',û:'u'};
/* Arama karşılaştırması: Türkçe harf ve büyük/küçük harf farkı yok sayılır */
export const norm=t=>String(t).toLocaleLowerCase('tr').replace(/[ığüşöçâîû]/g,c=>TR_MAP[c]).replace(/[^a-z0-9]+/g,' ').trim();
export const slug=t=>t.toLocaleLowerCase('tr').replace(/[ığüşöçâîû]/g,c=>TR_MAP[c]).replace(/&/g,' ve ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/* Ürün türü (kategori) → adres anahtarı */
export const TYPES=[['tur','Tur','Turlar'],['otel','Otel','Oteller'],['etkinlik','Etkinlik','Etkinlikler'],['aktivite','Aktivite','Aktiviteler'],['mekan','Mekân','Mekânlar']];
export const typeKey=k=>(TYPES.find(t=>t[1]===k)||TYPES[0])[0];

const fromItem=x=>({id:slug(x.t),type:x.k,title:x.t,place:x.a,price:x.p,old:x.old,unit:x.u||'kişi başı',score:x.s||0,count:x.c||0,
  bg:G[x.g],facts:x.facts||[],dates:x.dates||[],more:x.more,info:x.info,tr:x.tr,visa:x.visa,b:x.b,abroad:!!x.abroad,cat:x.cat,sample:true});
const all=new Map();
ITEMS.forEach(x=>all.set(slug(x.t),fromItem(x)));
const evDay=e=>e[0][0]+e[0].slice(1).toLocaleLowerCase('tr')+' '+e[1]+' Eki';
EV.forEach(e=>{const id=slug(e[3]),[time,place]=e[4].split(' · ');if(!all.has(id))all.set(id,{id,type:'Etkinlik',title:e[3],place,price:e[5],unit:'bilet',score:0,count:0,bg:G[e[6]],facts:[evDay(e)+' · '+time,e[2]],cat:e[2],dates:[],b:'saat',sample:true})});
HT.forEach(h=>{const id=slug(h[1]),p=all.get(id);const o={id,type:'Otel',title:h[1],place:h[2],price:h[6]*2,unit:'2 gece toplam',score:h[3],count:h[4],bg:G[h[7]],facts:['2 – 4 Eki · 2 gece',h[5]],dates:[],stars:h[0],b:'hs',sample:true};all.set(id,p?{...o,...p,stars:h[0]}:o)});
VN.forEach(v=>{const id=slug(v.t),p=all.get(id);const o={id,type:'Mekân',title:v.t,place:v.a,price:v.opts[0][1],unit:v.u||(v.slots?'kişi başı':'seans'),slots:v.slots,score:v.s,count:v.c,bg:G[v.g],facts:v.opts.map(o=>o[0]),dates:[],b:'saat',sample:true};all.set(id,{...o,...(p||{}),opts:v.opts,mode:v.mode})});

all.forEach(p=>{p.with=(KIMLE[p.title]||'').split(' ').filter(Boolean)});

/* Fotoğraf: bg tek bir CSS arka planı. Fotoğraf varsa geçişin üstünde
   durur; kartlar, raylar ve ürün sayfası ayrıca bir şey yapmadan gösterir */
export const photo=(f,bg)=>f?'url('+ROOT+'img/'+f+') center/cover no-repeat,'+bg:bg;
all.forEach(p=>{p.bg=photo(IMG[p.title],p.bg)});

/* Yer: ürünün adı ya da bulunduğu yer (kalkış şehri sayılmaz) bir yerin
   eş adlarından birini içeriyorsa ürün o yerdedir */
const where=p=>p.place.split(' · ').filter(x=>!x.includes('çıkışlı')).join(' ');
const dests=DESTS.map(([id,name,sub,al])=>{const keys=[name,...al].map(norm);
  return {id,name,sub,keys:[...keys,norm(sub)],ids:[...all.values()].filter(p=>{const h=' '+norm(p.title+' '+where(p));return keys.some(k=>h.includes(' '+k))}).map(p=>p.id)}});
all.forEach(p=>{p.dest=dests.filter(d=>d.ids.includes(p.id)).map(d=>d.id)});
export const getDestination=id=>dests.find(d=>d.id===id)||null;
/* Yerler, istenen türde kaç deneyim olduğuyla; deneyimi olmayan yer gösterilmez */
export const listDestinations=({type}={})=>dests.map(d=>({id:d.id,name:d.name,sub:d.sub,keys:d.keys,
  count:d.ids.filter(i=>!type||typeKey(all.get(i).type)===type).length})).filter(d=>d.count);

export const productUrl=(root,t)=>root+'urun/?id='+slug(t);
export const getProduct=id=>all.get(id)||null;
export const findByTitle=t=>all.get(slug(t))||null;
/* Tema: tür karışık koleksiyon; tema sayfasında kapak ve iki cümlelik giriş */
const themes=THEMES.map(([id,name,bg,titles,intro])=>{const ids=titles.map(slug).filter(i=>all.has(i));
  return {id,name,intro,bg:photo(IMG['tema:'+id],bg),ids,types:TYPES.filter(t=>ids.some(i=>typeKey(all.get(i).type)===t[0])).map(t=>t[1])}});
export const listThemes=()=>themes;
export const getTheme=id=>themes.find(t=>t.id===id)||null;

/* Serbest metin araması: ad, yer, tür, yer adları ve temalar içinde. Her
   kelime geçmeli: kısa kelime kelime başında, 4 harf ve üstü her yerde
   ("deniz" → Ölüdeniz, "ist" → Turistik değil İstanbul). */
const hay=new Map();
const haystack=p=>{if(!hay.has(p.id))hay.set(p.id,' '+norm([p.title,where(p),p.type,TYPES.find(t=>t[1]===p.type)[2],
  ...p.dest.map(i=>getDestination(i)).flatMap(d=>[d.name,d.sub]),...themes.filter(t=>t.ids.includes(p.id)).map(t=>t.name)].join(' ')));return hay.get(p.id)};
const hit=(h,q)=>norm(q).split(' ').filter(Boolean).every(w=>h.includes(w.length<4?' '+w:w));

/* Ne zaman: tarihi olan ürün (tur kalkışı, etkinlik) pencereye düşmeli;
   otel, aktivite ve mekân her gün açık sayılır (ÖRNEK) */
const MON={oca:0,sub:1,mar:2,nis:3,may:4,haz:5,tem:6,agu:7,eyl:8,eki:9,kas:10,ara:11};
export function parseDay(t){const m=norm(t||'').match(/(?:^| )(\d{1,2}) (?:\d{1,2} )?(oca|sub|mar|nis|may|haz|tem|agu|eyl|eki|kas|ara)(?: |$)/);return m?new Date(2026,MON[m[2]],+m[1]):null}
const productDays=p=>p.dates.length?p.dates.map(d=>parseDay(d[1])):typeKey(p.type)==='etkinlik'?[parseDay(p.facts[0])]:null;
const win=id=>{const w=WHEN.find(x=>x[0]===id);return w&&[new Date(...w[3]),new Date(...w[4])]};
const inWin=(d,w)=>d&&d>=w[0]&&d<=w[1];
export function availableIn(p,tarih){const w=win(tarih);if(!w)return true;const ds=productDays(p);return !ds||ds.some(d=>inWin(d,w))}
/* Ürünün seçilen penceredeki ilk kalkışı (ürün sayfasında hazır seçili gelir) */
export function firstDateIn(p,tarih){const w=win(tarih);const d=w&&p.dates.find(x=>inWin(parseDay(x[1]),w));return d?d[0]+' '+d[1]:''}

/* Liste: kategori (type), keşif filtreleri (süre, kiminle, ne zaman), yer,
   arama ve tema ayrı parametreler: kategori ≠ filtre */
export function listProducts({type,sure,kimle,tema,yer,ara,tarih}={}){
  const th=tema&&getTheme(tema);
  return [...all.values()].filter(p=>(!type||typeKey(p.type)===type)&&(!sure||p.b===sure)&&(!kimle||p.with.includes(kimle))&&(!th||th.ids.includes(p.id))
    &&(!yer||p.dest.includes(yer))&&(!ara||hit(haystack(p),ara))&&(!tarih||availableIn(p,tarih)));
}

/* Popüler aramalar (sekmeye göre): yer adıysa yer, değilse metin; o sekmede
   sonucu olmayanlar çıkarılır ki dokunan boş listeye düşmesin */
export function listPopular(type){
  return (POP[type]||[]).map(label=>{const d=listDestinations().find(d=>norm(d.name)===norm(label));
    return d?{label,yer:d.id,ara:''}:{label,yer:'',ara:label}})
    .filter(x=>listProducts({type,yer:x.yer,ara:x.ara}).length);
}

/* Arama önerileri: önce adı yazılanla başlayan yerler ve deneyimler */
export function suggest(text,{type}={}){
  const q=norm(text);if(!q)return {dests:[],products:[],total:0};
  const rank=ks=>ks.some(k=>k.startsWith(q))?0:ks.some(k=>k.includes(' '+q))?1:q.length>3&&ks.some(k=>k.includes(q))?2:9;
  const ds=listDestinations({type}).map(d=>[d,rank(d.keys)]).filter(x=>x[1]<9).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  const ps=listProducts({type,ara:text}).map(p=>[p,rank([norm(p.title)])]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  return {dests:ds.slice(0,4),products:ps.slice(0,5),total:ps.length};
}

/* Arama durumu: bu sekmede açık kaldıkça liste, ürün ve rezervasyon
   sayfaları kişi sayısını ve tarihi hatırlar */
const SK='m360-arama';
export function setSearch(s){try{sessionStorage.setItem(SK,JSON.stringify(s))}catch(e){}}
export function getSearch(){try{return JSON.parse(sessionStorage.getItem(SK))||{}}catch(e){return {}}}
/* Son aramalar: yalnızca bu cihazda */
const AK='m360-aramalar';
export function listSearches(){try{return JSON.parse(localStorage.getItem(AK))||[]}catch(e){return []}}
export function saveSearch(s){try{localStorage.setItem(AK,JSON.stringify([s,...listSearches().filter(x=>x.url!==s.url)].slice(0,4)))}catch(e){}}
export function clearSearches(){try{localStorage.removeItem(AK)}catch(e){}}

/* Sahnede: bugünden itibaren birkaç gün içindeki etkinlikler, gün ve saat
   sırasıyla; bilet görünümü için gün, ay ve saat ayrı */
const DW=['PAZ','PZT','SAL','ÇAR','PER','CUM','CMT'];
export function listEvents({days=7}={}){
  const end=new Date(TODAY);end.setDate(end.getDate()+days);
  return [...all.values()].filter(p=>typeKey(p.type)==='etkinlik').map(p=>{const d=parseDay(p.facts[0]),t=p.facts[0].split(' · ')[1]||'';
    return {...p,day:d,dw:d&&DW[d.getDay()],dn:d&&String(d.getDate()),month:d&&d.toLocaleDateString('tr-TR',{month:'short'}).toLocaleUpperCase('tr'),
      time:t.charAt(0).toLocaleUpperCase('tr')+t.slice(1),cat:p.cat||p.type}})
   .filter(e=>e.day&&e.day>=TODAY&&e.day<end).sort((a,b)=>a.day-b.day||a.time.localeCompare(b.time));
}

/* Yakınımda: ürünün yaklaşık konumu (data.js GEO, ÖRNEK) ve kuş uçuşu
   uzaklık. Konum yalnızca kullanıcı isteyince, tarayıcıdan gelir; burada
   saklanmaz. */
const geoKeys=Object.keys(GEO).map(k=>[' '+norm(k),GEO[k]]);
all.forEach(p=>{const h=' '+norm(p.title+' '+where(p));const g=geoKeys.find(([k])=>h.includes(k));p.geo=g?g[1]:null});
const dist=(a,b)=>{const r=Math.PI/180,x=Math.sin((b[0]-a[0])*r/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin((b[1]-a[1])*r/2)**2;return 12742*Math.asin(Math.sqrt(x))};
/* Ürünün konuma uzaklığı (km); konumu bilinmeyen ürün için null */
export const kmTo=(pos,p)=>pos&&p&&p.geo?dist(pos,p.geo):null;
/* Yakındakiler (varsayılan 200 km); azsa en yakın birkaç deneyim */
export function listNearby(pos,{within=200,min=6}={}){
  const l=[...all.values()].filter(p=>p.geo).map(p=>({...p,km:dist(pos,p.geo)})).sort((a,b)=>a.km-b.km);
  const near=l.filter(p=>p.km<=within);
  return near.length>=min?near:l.slice(0,min);
}
/* Konuma en yakın yer: yerin adı ya da eş adlarından en yakını (Bodrum → Muğla) */
export function nearestPlace(pos){
  return DESTS.map(([id,name,,al])=>({id,name,km:Math.min(...[name,...al].filter(k=>GEO[k]).map(k=>dist(pos,GEO[k])))}))
    .filter(d=>d.km<Infinity).sort((a,b)=>a.km-b.km)[0]||null;
}
/* Konum izni yoksa seçilebilecek şehirler */
export const placePos=id=>{const d=getDestination(id);return d&&GEO[d.name]||null};

/* Son bakılanlar: yalnızca bu cihazda tutulur; backend gelince kullanıcı
   geçmişinden okunacak */
const RK='m360-son';
const readRecent=()=>{try{return JSON.parse(localStorage.getItem(RK))||[]}catch(e){return []}};
export function markViewed(id){if(!all.has(id))return;try{localStorage.setItem(RK,JSON.stringify([id,...readRecent().filter(x=>x!==id)].slice(0,12)))}catch(e){}}
export const listRecent=()=>readRecent().map(getProduct).filter(Boolean);
export function clearRecent(){try{localStorage.removeItem(RK)}catch(e){}}

const post=(p,i)=>({id:'p'+(i+1),user:USERS[p.u],place:p.yer,when:p.ne,bg:photo(p.img,G[p.g]),text:p.metin,likes:p.beg,comments:p.yor,verified:!!p.gitti,product:findByTitle(p.urun),sample:true});
const posts=POSTS.map(post);
/* Akış: önce bu cihazda paylaştıkların, sonra örnek paylaşımlar */
export const listPosts=({productId}={})=>{const l=[...listMyPosts(),...posts];return productId?l.filter(p=>p.product&&p.product.id===productId):l};

/* Oturumdaki kullanıcı (ÖRNEK); backend gelince hesaptan */
export const ME={ad:'Ayşe Yılmaz',kul:'ayse.molada',ini:'AY',renk:'#223066'};

/* Geçmiş rezervasyonlar (ÖRNEK): yaşanmış deneyimler. Paylaşımdaki
   "Mola360 ile gitti" rozeti yalnızca bunlardan birine bağlanınca çıkar. */
const PAST=[{productId:'kapadokya-turu',when:'12 – 15 Eylül',who:'2 yetişkin'},{productId:'kordon-caz-aksamlari',when:'5 Eylül',who:'2 bilet',shared:true}];
export const listPastBookings=()=>PAST.map(b=>({...b,product:getProduct(b.productId),
  shared:!!b.shared||listMyPosts().some(p=>p.product.id===b.productId)})).filter(b=>b.product);

/* Paylaşımlar: taslakta yalnızca bu cihazda tutulur, görseller küçültülmüş
   önizleme olarak. Backend gelince yükleme ve akış oradan. */
const PK='m360-paylas';
const readPs=()=>{try{return JSON.parse(localStorage.getItem(PK))||[]}catch(e){return []}};
const hx=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const okThumb=t=>/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(t||'');
const ago=t=>{const m=Math.floor((Date.now()-t)/60000);return m<1?'Az önce':m<60?m+' dk önce':m<1440?Math.floor(m/60)+' sa önce':Math.floor(m/1440)+' gün önce'};
export function listMyPosts(){
  return readPs().map(x=>{const p=getProduct(x.productId);if(!p)return null;
    return {id:x.id,user:ME,place:p.place.split(' · ')[0],when:ago(x.created),with:hx(x.with||''),
      bg:x.thumbs&&okThumb(x.thumbs[0])?'url('+x.thumbs[0]+') center/cover,'+p.bg:p.bg,media:x.media||1,video:!!x.video,
      text:hx(x.text||''),likes:0,comments:0,verified:PAST.some(b=>b.productId===p.id),product:p,mine:true}}).filter(Boolean);
}
/* Rozet buradan değil, bağlanan deneyimin geçmiş rezervasyonlarda olmasından gelir */
export function createPost({productId,text='',with:w='',thumbs=[],media=1,video=false}){
  if(!getProduct(productId))return null;
  const r={id:'m'+Date.now().toString(36),productId,text:String(text).slice(0,300),with:w,thumbs,media,video,created:Date.now()};
  const save=l=>{try{localStorage.setItem(PK,JSON.stringify(l));return true}catch(e){return false}};
  /* yer kalmadıysa önizlemesiz kaydet */
  if(!save([r,...readPs()].slice(0,12))){r.thumbs=[];save([r,...readPs().map(x=>({...x,thumbs:[]}))].slice(0,12))}
  return listMyPosts().find(p=>p.id===r.id)||null;
}

/* Rezervasyon: ürün türüne göre tarih, saat, seçenek ve adet. Kurallar
   (kapora, iptal, adet sınırları, saatler) ÖRNEK; v2'nin kuralları
   yazılınca buradan değişecek. */
/* Örnek takvim 1 Ekim 2026 Perşembe'de yaşıyor; backend gelince bugünün tarihi */
const TODAY=new Date(2026,9,1);
const CANCEL_DAYS={tur:7,otel:3,etkinlik:2};
/* Seçilen tarihe göre son ücretsiz iptal günü; süre dolduysa past */
export function cancelBy(p,label){const d=parseDay(label);if(!d)return null;
  const by=new Date(d);by.setDate(by.getDate()-(CANCEL_DAYS[typeKey(p.type)]||1));
  return {date:by.toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'}),past:by<TODAY}}
const NEXT_DAYS=[['Cmt','3 Eki'],['Paz','4 Eki'],['Cmt','10 Eki'],['Paz','11 Eki']];
const CANCEL={tur:'Kalkıştan 7 gün öncesine kadar ücretsiz iptal',otel:'Girişten 3 gün öncesine kadar ücretsiz iptal',etkinlik:'Etkinlikten 48 saat öncesine kadar ücretsiz iptal'};
export function bookingSpec(p){
  const t=typeKey(p.type);
  const split=f=>{const i=f.indexOf(' ');return [f.slice(0,i),f.slice(i+1)]};
  const dates=p.dates.length?p.dates:t==='otel'?[['Giriş – çıkış',p.facts[0]]]:t==='etkinlik'?[split(p.facts[0])]:NEXT_DAYS;
  /* min. harcamalı mekânda fiyat seçilen alanın; kişi sayısı fiyatı değiştirmez */
  const fixed=p.unit==='min. harcama';
  return {
    dates,fixed,
    slots:p.slots||((t==='aktivite'||t==='mekan')&&!fixed?['10:00','12:00','14:00','16:00']:[]),
    opts:p.opts||[],
    qty:fixed?null:t==='otel'?{label:'Oda',min:1,max:3,start:1,note:'Oda başına 2 yetişkin.'}:t==='etkinlik'?{label:'Bilet',min:1,max:8}:{label:'Kişi',min:1,max:9},
    deposit:t==='tur'?.2:0,
    cancel:CANCEL[t]||'24 saat öncesine kadar ücretsiz iptal'
  };
}

/* Taslak rezervasyonlar: ödeme alınmaz, yalnızca bu cihazda tutulur */
const BK='m360-rez';
const readBk=()=>{try{return JSON.parse(localStorage.getItem(BK))||[]}catch(e){return []}};
const writeBk=l=>{try{localStorage.setItem(BK,JSON.stringify(l))}catch(e){}};
export function createBooking(b){
  const r={...b,no:'M360-T'+String(Math.floor(10000+Math.random()*90000)),created:Date.now(),draft:true};
  writeBk([r,...readBk()]);return r;
}
export const listBookings=()=>readBk().map(b=>({...b,product:getProduct(b.productId)})).filter(b=>b.product);
export function cancelBooking(no){writeBk(readBk().filter(b=>b.no!==no))}

/* Ürün sayfası içeriği: açıklama, program, dahil/hariç, buluşma noktası,
   bilmen gerekenler ve örnek değerlendirmeler (ÖRNEK, icerik.js) */
export function productDetails(p){
  const t=typeKey(p.type),d=DETAY[p.title]||{},[progTitle,placeTitle]=BASLIK[t];
  return {about:d.about||'',progTitle,program:d.program||[],placeTitle,place:d.yer||[p.place,''],
    dahil:d.dahil||[],haric:d.haric||[],bilgi:d.bilgi||[],
    reviews:p.count?(YORUM[t]||[]).map(([u,score,text])=>({user:USERS[u],score,text})):[]};
}
