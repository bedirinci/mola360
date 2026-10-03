/* Veri katmanı: yeni sayfalar veriyi yalnızca buradan okur (docs/yeni-surum.md
   kural 6). Bugün örnek veriyi (data.js) tek bir ürün şekline çeviriyor;
   backend geldiğinde yalnızca bu dosyanın içi değişecek. Alan adları
   backend'deki `content` tablosuna yakın: id (slug), type, title, place,
   price, unit, score, count. */
import { ITEMS, EV, HT, VN, G, POSTS, USERS, BUCKETS, WITH, KIMLE, THEMES } from './data.js';

/* Keşif filtreleri: süre ve kiminle (kategori değil) */
export { BUCKETS, WITH };

const TR_MAP={ı:'i',ğ:'g',ü:'u',ş:'s',ö:'o',ç:'c',â:'a',î:'i',û:'u'};
export const slug=t=>t.toLocaleLowerCase('tr').replace(/[ığüşöçâîû]/g,c=>TR_MAP[c]).replace(/&/g,' ve ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/* Ürün türü (kategori) → adres anahtarı */
export const TYPES=[['tur','Tur','Turlar'],['otel','Otel','Oteller'],['etkinlik','Etkinlik','Etkinlikler'],['aktivite','Aktivite','Aktiviteler'],['mekan','Mekân','Mekânlar']];
export const typeKey=k=>(TYPES.find(t=>t[1]===k)||TYPES[0])[0];

const fromItem=x=>({id:slug(x.t),type:x.k,title:x.t,place:x.a,price:x.p,old:x.old,unit:x.u||'kişi başı',score:x.s||0,count:x.c||0,
  bg:G[x.g],facts:x.facts||[],dates:x.dates||[],more:x.more,info:x.info,tr:x.tr,visa:x.visa,b:x.b,abroad:!!x.abroad,sample:true});
const all=new Map();
ITEMS.forEach(x=>all.set(slug(x.t),fromItem(x)));
const evDay=e=>e[0][0]+e[0].slice(1).toLocaleLowerCase('tr')+' '+e[1]+' Eki';
EV.forEach(e=>{const id=slug(e[3]),[time,place]=e[4].split(' · ');if(!all.has(id))all.set(id,{id,type:'Etkinlik',title:e[3],place,price:e[5],unit:'bilet',score:0,count:0,bg:G[e[6]],facts:[evDay(e)+' · '+time,e[2]],dates:[],b:'saat',sample:true})});
HT.forEach(h=>{const id=slug(h[1]),p=all.get(id);const o={id,type:'Otel',title:h[1],place:h[2],price:h[6]*2,unit:'2 gece toplam',score:h[3],count:h[4],bg:G[h[7]],facts:['2 – 4 Eki · 2 gece',h[5]],dates:[],stars:h[0],b:'hs',sample:true};all.set(id,p?{...o,...p,stars:h[0]}:o)});
VN.forEach(v=>{const id=slug(v.t),p=all.get(id);const o={id,type:'Mekân',title:v.t,place:v.a,price:v.opts[0][1],unit:'seans',score:v.s,count:v.c,bg:G[v.g],facts:v.opts.map(o=>o[0]),dates:[],b:'saat',sample:true};all.set(id,{...o,...(p||{}),opts:v.opts,mode:v.mode})});

all.forEach(p=>{p.with=(KIMLE[p.title]||'').split(' ').filter(Boolean)});

export const productUrl=(root,t)=>root+'urun/?id='+slug(t);
export const getProduct=id=>all.get(id)||null;
export const findByTitle=t=>all.get(slug(t))||null;
/* Tema: tür karışık koleksiyon */
const themes=THEMES.map(([id,name,bg,titles])=>{const ids=titles.map(slug).filter(i=>all.has(i));
  return {id,name,bg,ids,types:TYPES.filter(t=>ids.some(i=>typeKey(all.get(i).type)===t[0])).map(t=>t[1])}});
export const listThemes=()=>themes;
export const getTheme=id=>themes.find(t=>t.id===id)||null;

/* Liste: kategori (type), keşif filtreleri (süre, kiminle) ve tema ayrı
   parametreler: kategori ≠ filtre */
export function listProducts({type,sure,kimle,tema}={}){
  const th=tema&&getTheme(tema);
  return [...all.values()].filter(p=>(!type||typeKey(p.type)===type)&&(!sure||p.b===sure)&&(!kimle||p.with.includes(kimle))&&(!th||th.ids.includes(p.id)));
}

/* Etkinlik takvimi: bilet görünümü için gün ve saat ayrı */
export const listEvents=()=>EV.map(e=>{const [time,place]=e[4].split(' · ');return {id:slug(e[3]),title:e[3],dw:e[0],dn:e[1],month:'EKİM',cat:e[2],time,place,price:e[5],bg:G[e[6]],sample:true}});

/* Son bakılanlar: yalnızca bu cihazda tutulur; backend gelince kullanıcı
   geçmişinden okunacak */
const RK='m360-son';
const readRecent=()=>{try{return JSON.parse(localStorage.getItem(RK))||[]}catch(e){return []}};
export function markViewed(id){if(!all.has(id))return;try{localStorage.setItem(RK,JSON.stringify([id,...readRecent().filter(x=>x!==id)].slice(0,12)))}catch(e){}}
export const listRecent=()=>readRecent().map(getProduct).filter(Boolean);
export function clearRecent(){try{localStorage.removeItem(RK)}catch(e){}}

const post=(p,i)=>({id:'p'+(i+1),user:USERS[p.u],place:p.yer,when:p.ne,bg:G[p.g],text:p.metin,likes:p.beg,comments:p.yor,verified:!!p.gitti,product:findByTitle(p.urun),sample:true});
const posts=POSTS.map(post);
export const listPosts=({productId}={})=>productId?posts.filter(p=>p.product&&p.product.id===productId):posts;

/* Rezervasyon: ürün türüne göre tarih, saat, seçenek ve adet. Kurallar
   (kapora, iptal, adet sınırları, saatler) ÖRNEK; v2'nin kuralları
   yazılınca buradan değişecek. */
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
    slots:(t==='aktivite'||t==='mekan')&&!fixed?['10:00','12:00','14:00','16:00']:[],
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
