/* Veri katmanı: yeni sayfalar veriyi yalnızca buradan okur (docs/yeni-surum.md
   kural 6). Bugün örnek veriyi (data.js) tek bir ürün şekline çeviriyor;
   backend geldiğinde yalnızca bu dosyanın içi değişecek. Alan adları
   backend'deki `content` tablosuna yakın: id (slug), type, title, place,
   price, unit, score, count. */
import { ITEMS, EV, HT, VN, G, POSTS, USERS, BUCKETS, WITH, KIMLE, THEMES, DESTS, WHEN, GEO, IMG, POP, PUAN, SEVIYE, HIKAYE, ONERI, YORUMLAR, YANITLAR, HAFTA, PROFIL, SOHBET, BILDIRIM } from './data.js';
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
/* geçmişte kalan kalkışlar gösterilmez ve seçilemez */
export const upcoming=ds=>ds.filter(x=>{const d=parseDay(x[1]);return !d||d>=today()});
export function firstDateIn(p,tarih){const w=win(tarih);const d=w&&upcoming(p.dates).find(x=>inWin(parseDay(x[1]),w));return d?d[0]+' '+d[1]:''}

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

/* Onaylı: Mola360'tan en az bir deneyim satın alıp yaşamış kullanıcı */
const ONAY=new Set(POSTS.filter(p=>p.gitti).map(p=>p.u));
const post=(p,i)=>({id:'p'+(i+1),user:{...USERS[p.u],onay:ONAY.has(p.u)},place:p.yer,when:p.ne,bg:photo(p.img,G[p.g]),pics:[photo(p.img,G[p.g]),...(p.g2||[]).map(k=>G[k])],text:p.metin,likes:p.beg,comments:p.yor,verified:!!p.gitti,product:findByTitle(p.urun),sample:true});
const posts=POSTS.map(post);
/* Akış: önce bu cihazda paylaştıkların, sonra örnek paylaşımlar */
export const listPosts=({productId}={})=>{const l=[...listMyPosts(),...posts];return productId?l.filter(p=>p.product&&p.product.id===productId):l};

/* Profil: Ayşe'nin paylaşımları (bu cihazda paylaştıkları + önceki paylaşımları).
   Silinen önceki paylaşımlar m360-silinen'de tutulur. */
const DK='m360-silinen';
const gone=()=>{try{return new Set(JSON.parse(localStorage.getItem(DK))||[])}catch(e){return new Set()}};
const ayse=()=>posts.slice(0,4).map((p,i)=>({...p,id:'a'+(i+1),user:{...ME,onay:true},mine:true}));
export const listProfilePosts=()=>{const g=gone();return [...listMyPosts(),...ayse()].filter(p=>!g.has(p.id))};
export const getPost=id=>id&&!gone().has(id)?[...listMyPosts(),...ayse(),...posts].find(p=>p.id===id)||null:null;
export function deletePost(id){
  const l=readPs();
  if(l.some(x=>x.id===id)){try{localStorage.setItem(PK,JSON.stringify(l.filter(x=>x.id!==id)))}catch(e){}}
  else{try{localStorage.setItem(DK,JSON.stringify([...gone(),id]))}catch(e){}}
  try{const c=JSON.parse(localStorage.getItem(CK))||{};delete c[id];localStorage.setItem(CK,JSON.stringify(c))}catch(e){}
}
/* Yorumlar: paylaşımın kendi sayfasında. Örnek paylaşımlara havuzdan yorum düşer;
   yazılan yorumlar bu cihazda (m360-yorum) tutulur. */
const CK='m360-yorum';
const myCm=id=>{try{return (JSON.parse(localStorage.getItem(CK))||{})[id]||[]}catch(e){return []}};
export function listComments(post){
  const n=Math.min(post.comments||0,5),start=[...post.id].reduce((a,c)=>a+c.charCodeAt(0),0);
  const base=Array.from({length:n},(_,i)=>{const [u,text,when]=YORUMLAR[(start+i)%YORUMLAR.length];return {id:'b'+i,user:{...USERS[u],onay:ONAY.has(u)},text,when,likes:(start*7+i*13)%40}})
    .filter(c=>c.user.kul!==post.user.kul);
  /* paylaşım sahibi ilk yoruma yanıt vermiş */
  if(base.length>1){const own=post.user.kul===ME.kul;base.splice(1,0,{id:'r0',to:base[0].id,user:own?{...ME,onay:true}:post.user,text:'@'+base[0].user.kul+' '+YANITLAR[start%YANITLAR.length],when:base[0].when,likes:(start%9)+1,mine:own})}
  /* to: yanıtlanan yorumun kimliği (yanıtlar o yorumun altında görünür) */
  return [...base,...myCm(post.id).map(c=>({id:'m'+c.at,to:c.to||'',user:{...ME,onay:true},text:hx(c.text),when:ago(c.at),likes:0,mine:true}))];
}
export function addComment(id,text,to=''){text=String(text).trim().slice(0,300);if(!text)return null;const at=Date.now();
  try{const all=JSON.parse(localStorage.getItem(CK))||{};all[id]=[...(all[id]||[]),{text,at,to}];localStorage.setItem(CK,JSON.stringify(all))}catch(e){return null}
  return {id:'m'+at,to,user:{...ME,onay:true},text:hx(text),when:'Az önce',likes:0,mine:true}}

/* Başkalarının profili (kisi/?u=kullanıcı adı) */
export function getUser(kul){const k=Object.keys(USERS).find(x=>USERS[x].kul===kul);if(!k)return null;
  const [city,bio,followers,following]=PROFIL[k]||['','',0,0];
  return {key:k,...USERS[k],onay:ONAY.has(k),city,bio,followers,following}}
export const listUserPosts=kul=>posts.filter(p=>p.user.kul===kul);

/* Hikayeler: önce Mola360'ın kendi hikayeleri (gerçek ürünlerden: bu
   haftanın etkinlikleri, hafta sonu fırsatları, temalar), sonra takip
   edilen kişilerinkiler. Her karenin altında bağlı olduğu deneyim. */
const kisiHikaye=HIKAYE.map(h=>({id:'h-'+h.u,kind:'kisi',user:{...USERS[h.u],onay:ONAY.has(h.u)},when:h.ne,place:h.yer,verified:!!h.gitti,
  frames:h.kare.map(([g,text])=>({bg:G[g],text,product:findByTitle(h.urun)}))}));
const DEAL=['Kapadokya Turu','Göreme Mağara Otel','Sealight Resort'];
export function listStories(){
  const ev=listEvents().slice(0,3).map(e=>({bg:e.bg,over:e.dw+' '+e.dn+' '+e.month+' · '+e.time,title:e.title,sub:e.place.split(' · ')[0],product:e}));
  const hs=DEAL.map(findByTitle).filter(Boolean).map(p=>({bg:p.bg,over:'Bu hafta sonu',title:p.title,sub:p.facts[0]||p.place,product:p,deal:true}));
  const th=themes.slice(0,4).map(t=>({bg:t.bg,over:'Tema',title:t.name,sub:t.intro.split('. ')[0]+'.',product:all.get(t.ids[0]),theme:t.id}));
  const m=[['sahne','Sahnede','Bu hafta sahnede','ticket',ev],['hafta-sonu','Hafta sonu','Bu hafta sonu için','calendar',hs],['temalar','Temalar','Temalar','grid',th]]
    .filter(x=>x[4].length).map(([id,label,title,icon,frames])=>({id:'m-'+id,kind:'mola',label,title,icon,bg:frames[0].bg,frames}));
  return [...m,...kisiHikaye];
}

/* Oturumdaki kullanıcı (ÖRNEK); backend gelince hesaptan */
/* Bağlan: haftanın gezgini */
export const weekTraveler=()=>{
  const score=(p,i)=>{const r=POSTS[i];return {post:p,likes:p.likes,comments:p.comments,saves:r.kay||0,shares:r.pay||0,total:p.likes+p.comments+(r.kay||0)+(r.pay||0)}};
  const best=posts.map(score).sort((a,b)=>b.total-a.total)[0];
  return best?{...best,points:HAFTA.puan}:null};
/* Bağlan: takip önerileri */
export const listSuggestions=()=>ONERI.map(([u,why,gitti])=>({id:u,user:{...USERS[u],onay:!!gitti||ONAY.has(u)},why}));
export const ME={ad:'Ayşe Yılmaz',kul:'ayse.molada',ini:'AY',renk:'#223066'};

/* Geçmiş rezervasyonlar (ÖRNEK): yaşanmış deneyimler. Paylaşımdaki
   "Mola360 ile gitti" rozeti yalnızca bunlardan birine bağlanınca çıkar. */
const PAST=[{productId:'kapadokya-turu',when:'12 – 15 Eylül',who:'2 yetişkin'},{productId:'kordon-caz-aksamlari',when:'5 Eylül',who:'2 bilet',shared:true}];
export const listPastBookings=()=>PAST.map(b=>({...b,product:getProduct(b.productId),
  shared:!!b.shared||listMyPosts().some(p=>p.product&&p.product.id===b.productId),review:readRv()[b.productId]||null})).filter(b=>b.product);

/* Paylaşımlar: taslakta yalnızca bu cihazda tutulur, görseller küçültülmüş
   önizleme olarak. Backend gelince yükleme ve akış oradan. */
const PK='m360-paylas';
const readPs=()=>{try{return JSON.parse(localStorage.getItem(PK))||[]}catch(e){return []}};
const hx=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const okThumb=t=>/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(t||'');
const ago=t=>{const m=Math.floor((Date.now()-t)/60000);return m<1?'Az önce':m<60?m+' dk önce':m<1440?Math.floor(m/60)+' sa önce':Math.floor(m/1440)+' gün önce'};
/* Paylaşımın görselleri: kaydedilen önizlemeler; yer kalmadığı için
   önizlemesi silinenlerde deneyimin görseli. Her paylaşımda en az POST_MIN görsel. */
export const POST_MIN=2;
const OUT_BG='linear-gradient(160deg,#D5DCEA,#8E9AB6)';
const picsOf=(x,p)=>{const t=(x.thumbs||[]).filter(okThumb).map(u=>'url('+u+') center/cover,'+p.bg);
  while(t.length<POST_MIN)t.push(p.bg);return t};
export function listMyPosts(){
  return readPs().map(x=>{const p=getProduct(x.productId);
    /* Mola360 dışı deneyim: kart yok, adı yer satırında */
    if(!p){if(!x.title)return null;const o={bg:OUT_BG};
      return {id:x.id,user:{...ME,onay:PAST.length>0},place:hx(x.title),when:ago(x.created),with:hx(x.with||''),
        bg:x.thumbs&&okThumb(x.thumbs[0])?'url('+x.thumbs[0]+') center/cover,'+o.bg:o.bg,media:x.media||1,video:!!x.video,
        pics:picsOf(x,o),text:hx(x.text||''),likes:0,comments:0,verified:false,product:null,mine:true}}
    return {id:x.id,user:{...ME,onay:PAST.length>0},place:p.place.split(' · ')[0],when:ago(x.created),with:hx(x.with||''),
      bg:x.thumbs&&okThumb(x.thumbs[0])?'url('+x.thumbs[0]+') center/cover,'+p.bg:p.bg,media:x.media||1,video:!!x.video,
      pics:picsOf(x,p),
      text:hx(x.text||''),likes:0,comments:0,verified:PAST.some(b=>b.productId===p.id),product:p,mine:true}}).filter(Boolean);
}
/* Rozet buradan değil, bağlanan deneyimin geçmiş rezervasyonlarda olmasından gelir */
/* title: sitede olmayan, kullanıcının yazdığı deneyim (ürüne bağlı değil) */
export function createPost({productId,title='',text='',with:w='',thumbs=[],media=1,video=false}){
  title=String(title).trim().slice(0,60);
  if((!getProduct(productId)&&!title)||media<POST_MIN)return null;
  const r={id:'m'+Date.now().toString(36),productId:getProduct(productId)?productId:'',title:getProduct(productId)?'':title,text:String(text).slice(0,300),with:w,thumbs,media,video,created:Date.now()};
  const save=l=>{try{localStorage.setItem(PK,JSON.stringify(l));return true}catch(e){return false}};
  /* yer kalmadıysa önizlemesiz kaydet */
  if(!save([r,...readPs()].slice(0,12))){r.thumbs=[];save([r,...readPs().map(x=>({...x,thumbs:[]}))].slice(0,12))}
  return listMyPosts().find(p=>p.id===r.id)||null;
}

/* Hikayen: 24 saat görünür, bu cihazda tutulur (backend gelince oradan).
   Bir fotoğraf ya da video yeter; deneyim isteğe bağlı. */
const HK='m360-hikayem',DAY=864e5;
const readHk=()=>{try{return (JSON.parse(localStorage.getItem(HK))||[]).filter(x=>Date.now()-x.created<DAY)}catch(e){return []}};
export function createStory({productId='',title='',text='',thumbs=[]}){
  const p=getProduct(productId);
  const r={id:'hm'+Date.now().toString(36),productId:p?productId:'',title:p?'':String(title).trim().slice(0,60),text:String(text).slice(0,300),thumbs:thumbs.filter(okThumb),created:Date.now()};
  const save=l=>{try{localStorage.setItem(HK,JSON.stringify(l));return true}catch(e){return false}};
  if(!save([...readHk(),r].slice(-5))){r.thumbs=r.thumbs.slice(0,1);if(!save([r]))return false}
  return true;
}
export function myStory(){
  const l=readHk();if(!l.length)return null;const last=l[l.length-1];
  const frames=l.flatMap(x=>{const p=getProduct(x.productId),bg=p?p.bg:OUT_BG,t=x.thumbs.length?x.thumbs:[''];
    return t.map(u=>({bg:u?'url('+u+') center/cover,'+bg:bg,text:hx(x.text||''),product:p||null}))});
  const lp=getProduct(last.productId);
  return {id:'h-me',kind:'kisi',mine:true,user:{...ME,onay:PAST.length>0},when:ago(last.created),
    place:lp?lp.place.split(' · ')[0]:hx(last.title||''),verified:!!lp&&PAST.some(b=>b.productId===lp.id),frames};
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
  return {date:by.toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'}),past:by<today()}}
const NEXT_DAYS=[['Cmt','3 Eki'],['Paz','4 Eki'],['Cmt','10 Eki'],['Paz','11 Eki']];
const CANCEL={tur:'Kalkıştan 7 gün öncesine kadar ücretsiz iptal',otel:'Girişten 3 gün öncesine kadar ücretsiz iptal',etkinlik:'Etkinlikten 48 saat öncesine kadar ücretsiz iptal'};
export function bookingSpec(p){
  const t=typeKey(p.type);
  const split=f=>{const i=f.indexOf(' ');return [f.slice(0,i),f.slice(i+1)]};
  const dates=p.dates.length?upcoming(p.dates):t==='otel'?[['Giriş – çıkış',p.facts[0]]]:t==='etkinlik'?[split(p.facts[0])]:upcoming(NEXT_DAYS);
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

/* Bugün: örnek takvimin ilk gününden önceye düşmez; backend gelince sunucudan */
export const today=()=>{const n=new Date(),d=new Date(n.getFullYear(),n.getMonth(),n.getDate());return d<TODAY?new Date(TODAY):d};

/* Yaklaşan rezervasyonlar (ÖRNEK): hesaptaki rezervasyon ve bu cihazda
   yapılanlar, tarihe göre. İptal ve kalan ödeme bu cihazda tutulur. */
const UPCOMING=[{productId:'pamukkale-ve-hierapolis',date:'Cmt 10 Eki',slot:'07:30',qty:'2 yetişkin',total:3780,paid:756,pay:'kapora',no:'M360-48211',
  meet:{yer:'Konak Saat Kulesi önü',adres:'Konak Meydanı, Konak, İzmir',saat:'07:15',not:'Rehberin Murat Bey, Mola360 bayrağıyla seni otobüsün önünde karşılar. Kimliğini yanına al.'}}];
const RDK='m360-rez-durum';
const readDk=()=>{try{return {iptal:[],odeme:{},...JSON.parse(localStorage.getItem(RDK))}}catch(e){return {iptal:[],odeme:{}}}};
const writeDk=d=>{try{localStorage.setItem(RDK,JSON.stringify(d))}catch(e){}};
export function listUpcoming(){const d=readDk();
  return [...readBk(),...UPCOMING].filter(b=>!d.iptal.includes(b.no))
    .map(b=>({...b,paid:d.odeme[b.no]??b.paid,product:getProduct(b.productId),day:parseDay(b.date)}))
    .filter(b=>b.product).sort((a,b)=>(a.day||0)-(b.day||0)||String(a.slot).localeCompare(String(b.slot)))}
export function cancelBooking(no){writeBk(readBk().filter(b=>b.no!==no));const d=readDk();d.iptal=[...new Set([...d.iptal,no])];writeDk(d)}
export function payRemaining(no){const b=listUpcoming().find(x=>x.no===no);if(!b)return;const d=readDk();d.odeme[no]=b.total;writeDk(d)}

/* Geçmiş deneyimin değerlendirmesi: bu cihazda */
const RVK='m360-degerlendir';
const readRv=()=>{try{return JSON.parse(localStorage.getItem(RVK))||{}}catch(e){return {}}};
export function rateBooking(productId,puan,metin,alt){const r=readRv();r[productId]={puan,metin,alt:alt||{},t:Date.now()};try{localStorage.setItem(RVK,JSON.stringify(r))}catch(e){}}

/* Ürün sayfası içeriği: açıklama, program, dahil/hariç, buluşma noktası,
   bilmen gerekenler ve örnek değerlendirmeler (ÖRNEK, icerik.js) */
export function productDetails(p){
  const t=typeKey(p.type),d=DETAY[p.title]||{},[progTitle,placeTitle]=BASLIK[t];
  return {about:d.about||'',progTitle,program:d.program||[],placeTitle,place:d.yer||[p.place,''],
    dahil:d.dahil||[],haric:d.haric||[],bilgi:d.bilgi||[],
    reviews:p.count?(YORUM[t]||[]).map(([u,score,text])=>({user:USERS[u],score,text})):[],
    /* türe göre ayrıntılı puanlar (değerlendirme formundakiyle aynı başlıklar), ÖRNEK: genel puandan türetilir */
    aspects:p.count?(ALT[t]||ALT.mekan).map((k,i)=>[k,Math.min(10,Math.max(1,p.score+[.2,-.1,-.3,0][i]))]):[]};
}
const ALT={tur:['Rehber','Program','Ulaşım','Fiyat/performans'],otel:['Temizlik','Konum','Personel','Fiyat/performans'],
  etkinlik:['Organizasyon','Ses ve sahne','Giriş','Fiyat/performans'],aktivite:['Ekip','Güvenlik','Organizasyon','Fiyat/performans'],
  mekan:['Hizmet','Ortam','Temizlik','Fiyat/performans']};

/* Molapuan: puan, rezervasyon sayısı, seviye yolu (görünüm: guest | gezgin | kasif) */
export function getPoints(level){const [pts,n]=PUAN[level]||PUAN.guest;
  return {pts,n,levels:SEVIYE.map(([name,need,perk,to,goal])=>({name,need,perk,to,goal}))};}

/* Mesajlar: örnek sohbetler (SOHBET) + bu cihazda gönderilenler. Gönderilenler,
   okunanlar, kabul edilen ve silinen istekler/sohbetler m360-mesaj'da. */
const MK='m360-mesaj';
const readMs=()=>{try{const d=JSON.parse(localStorage.getItem(MK))||{};return {ek:d.ek||{},oku:d.oku||[],kabul:d.kabul||[],sil:d.sil||[]}}catch(e){return {ek:{},oku:[],kabul:[],sil:[]}}};
const writeMs=d=>{try{localStorage.setItem(MK,JSON.stringify(d))}catch(e){}};
const msg=x=>x.gun?{day:x.gun}:{who:x[0],text:x[1],at:x[2],product:x[3]&&x[3].urun?findByTitle(x[3].urun):null,invite:!!(x[3]&&x[3].davet),post:x[3]&&x[3].post?getPost(x[3].post):null};
const hm=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
function chatOf(k,d){
  const s=SOHBET.find(c=>c.k===k),u=USERS[k];if(!u)return null;
  const mine=(d.ek[k]||[]).map(m=>({who:'b',text:m.text,at:m.at,product:m.urun?getProduct(m.urun):null,invite:!!m.davet,post:m.post?getPost(m.post):null,sent:true,t:m.t}));
  const base=s&&!d.sil.includes(k)?s.m.map(msg):[];
  const last=[...base].reverse().find(m=>m.day);
  const msgs=[...base,...(mine.length&&(!last||last.day!=='Bugün')?[{day:'Bugün'}]:[]),...mine].filter(m=>m.day||m.text||m.product||m.post);
  const accepted=d.kabul.includes(k)||mine.length>0;
  return {id:k,user:{...u,onay:ONAY.has(k)||ONERI.some(o=>o[0]===k&&o[2])},msgs,request:!!(s&&s.ist)&&!accepted,
    unread:d.oku.includes(k)||mine.length?0:(s&&s.yeni)||0,t:mine.length?mine[mine.length-1].t:0,
    when:(()=>{const l=[...msgs].reverse(),m=l.find(x=>!x.day),g=l.find(x=>x.day);return !g||g.day==='Bugün'?(m?m.at:''):g.day})()};
}
/* Sohbetler: bu cihazda yazılanlar en üstte, sonra örnekler sırasıyla. istek:true → mesaj istekleri */
export function listChats({istek=false}={}){const d=readMs();
  const ks=[...new Set([...Object.keys(d.ek),...SOHBET.map(c=>c.k)])];
  return ks.map(k=>chatOf(k,d)).filter(c=>c&&c.msgs.length&&c.request===istek).sort((a,b)=>b.t-a.t);
}
export const getChat=k=>chatOf(k,readMs());
/* okunmamış sohbet sayısı (istekler hariç) ve istek sayısı */
export const unreadChats=()=>listChats().filter(c=>c.unread).length;
export function markRead(k){const d=readMs();if(!d.oku.includes(k)){d.oku.push(k);writeMs(d)}}
export function acceptChat(k){const d=readMs();if(!d.kabul.includes(k))d.kabul.push(k);writeMs(d)}
export function deleteChat(k){const d=readMs();delete d.ek[k];if(!d.sil.includes(k))d.sil.push(k);writeMs(d)}
/* mesaj gönder: metin ve/veya deneyim (urun: ürün id, davet) ya da paylaşım (post: id) */
export function sendMessage(k,{text='',urun='',davet=false,post=''}={}){
  if(!USERS[k])return null;text=String(text).trim().slice(0,1000);if(!text&&!urun&&!post)return null;
  const d=readMs(),n=new Date(),m={text,at:hm(n),t:n.getTime()};
  if(urun)m.urun=urun;if(davet)m.davet=1;if(post)m.post=post;
  (d.ek[k]=d.ek[k]||[]).push(m);if(!d.oku.includes(k))d.oku.push(k);writeMs(d);
  return {who:'b',text:m.text,at:m.at,product:urun?getProduct(urun):null,invite:!!davet,post:post?getPost(post):null,sent:true};
}
/* yeni mesajda seçilebilecek kişiler: takip ettiklerin */
export const FOLLOWING=['selin','mert','elif','deniz','kaan','zeynep'];
export const listFollowing=()=>FOLLOWING.map(k=>({id:k,user:{...USERS[k],onay:ONAY.has(k)}}));

/* Bildirimler: örnek bildirimler (BILDIRIM) + rezervasyonlardan hesaplananlar
   (yaklaşan tur, kalan ödeme, değerlendirilmemiş geçmiş deneyim). Ödeme yapılınca,
   değerlendirince ya da iptal edince ilgili bildirim kalkar. Okunanlar m360-bildirim'de;
   eskiler (once) ve örnekte oku:1 olanlar zaten okunmuş.
   cat: baglan | plan; g: bugun | hafta | once */
const NK='m360-bildirim';
const readNt=()=>{try{return JSON.parse(localStorage.getItem(NK))||[]}catch(e){return []}};
const CAT={begeni:'baglan',yorum:'baglan',bahset:'baglan',takip:'baglan',davet:'baglan',istek:'baglan',gezgin:'baglan'};
const who=k=>({...USERS[k],onay:ONAY.has(k)||ONERI.some(o=>o[0]===k&&o[2])});
export function listNotifs(){
  const oku=new Set(readNt()),day=today(),out=[];
  listUpcoming().forEach(b=>{const left=b.day?Math.round((b.day-day)/864e5):-1;if(left<0||left>14)return;
    out.push({id:'y-'+b.no,tur:'yaklasan',g:'bugun',ne:'09:00',product:b.product,left,slot:b.slot,meet:b.meet});
    if(b.paid<b.total)out.push({id:'o-'+b.no,tur:'odeme',g:'bugun',ne:'09:00',product:b.product,rest:b.total-b.paid})});
  const rv=readRv();
  /* bağlı paylaşım silinmişse bildirim de gider */
  BILDIRIM.filter(n=>!n.post||getPost(n.post)).forEach(n=>{
    out.push({...n,users:(n.k||[]).map(who),post:n.post?getPost(n.post):null,product:n.urun?findByTitle(n.urun):null})});
  /* değerlendirilmemiş geçmiş deneyimler: dönüş gününde gelmiş */
  PAST.filter(b=>!rv[b.productId]).forEach(b=>{const p=getProduct(b.productId);
    if(p)out.push({id:'d-'+b.productId,tur:'degerlendir',g:'once',ne:b.when.split('–').pop().trim().replace(/(\d+ \S{3})\S*/,'$1'),product:p})});
  /* haftanın gezgini: en çok etkileşim alan paylaşım */
  const wt=weekTraveler();
  return out.filter(n=>n.tur!=='gezgin'||wt)
    .map(n=>({...n,cat:CAT[n.tur]||'plan',read:oku.has(n.id)||!!n.oku||n.g==='once',...(n.tur==='gezgin'?{post:wt.post,users:[wt.post.user],total:wt.total,points:wt.points}:{})}));
}
export const unreadNotifs=()=>listNotifs().filter(n=>!n.read).length;
export function markNotifs(ids){const s=new Set([...readNt(),...ids]);try{localStorage.setItem(NK,JSON.stringify([...s]))}catch(e){}}
