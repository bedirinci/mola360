/* Planlarım: yaklaşan ve geçmiş rezervasyonlar ile favoriler tek yerde.
   Geçmiş deneyim, döngünün kapandığı yer: paylaş (paylas.js), değerlendir. */
import { renderShell } from './shell.js';
import { findByTitle, urunUrl, listUpcoming, cancelBooking, payRemaining, listPastBookings, rateBooking, parseDay, today, typeKey } from './api.js';
import { productCard } from './cards.js';
import { favList, initFavorites, favSync } from './favorites.js';
import { toast, tl, makeSheet, sc, esc } from './ui.js';
import { IC, I } from './icons.js';
import { ROOT } from './root.js';
import { getLevel } from './level.js';
import { guestIntro } from './giris.js';
import { karekodSvg } from './karekod.js';

renderShell('planlarim');
initFavorites();

/* Tarih tek biçimde: "10 Ekim Cumartesi · 07:30". Rezervasyon bu cihazda
   tutulduğu için alanlar HTML'e esc ile basılır */
const longDay=d=>d.toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});
const when=b=>{const d=b.day;if(!d)return esc([b.date,b.slot].filter(Boolean).join(' · '));
  return esc([longDay(d),(b.date.split(' · ')[1]||''),b.slot].filter(Boolean).join(' · '))};
const what=b=>esc([b.opt,b.qty].filter(Boolean).join(' · '));
/* Kaç gün kaldı */
const left=d=>{if(!d)return '';const n=Math.round((d-today())/864e5);return n<0?'':n===0?'Bugün':n===1?'Yarın':n+' gün kaldı'};
const qtyLabel=p=>({otel:'Oda',etkinlik:'Bilet'})[typeKey(p.type)]||'Kişi';
const due=b=>b.total-b.paid;
const mapsUrl=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);

const head=(p,line,cd)=>'<a class="rz-hd" href="'+urunUrl(ROOT,p)+'"><span class="pt" style="background:'+p.bg+'"></span><div class="x"><small>'+p.type.toLocaleUpperCase('tr')+(cd?'<em class="rz-cd">'+cd+'</em>':'')+'</small><b>'+p.title+'</b><span>'+line+'</span></div>'+IC.right+'</a>';

const up=b=>{const p=b.product,rest=due(b);
  return '<article class="rz" data-no="'+b.no+'">'+head(p,when(b),left(b.day))
  +'<div class="rz-rows"><div><small>'+qtyLabel(p)+'</small><b>'+what(b)+'</b></div>'
  +'<div><small>Durum</small><b>'+(rest>0?'Kapora ödendi':'Ödendi')+'</b></div><div><small>Toplam</small><b>'+tl(b.total)+'</b></div></div>'
  +(rest>0?'<div class="rz-pay"><div><small>Kalan ödeme</small><b>'+tl(rest)+'</b></div><button type="button" class="btn green" data-pay>Kalanı öde</button></div>':'')
  +'<div class="rz-acts"><button type="button" class="btn ghost" data-bilet>'+IC.ticket+'Biletim</button>'
  +(b.meet?'<button type="button" class="btn ghost" data-meet>'+I.pin+'Buluşma noktası</button>'
    :'<a class="btn ghost" href="'+mapsUrl(p.title+' '+p.place.split(' · ')[0])+'" target="_blank" rel="noopener">'+I.pin+'Yol tarifi</a>')+'</div>'
  +'<div class="rz-ft"><span class="rz-no">Rezervasyon no '+b.no+'</span><button type="button" class="rz-cx" data-cancel>İptal et</button></div></article>'};

/* Puan 10 üzerinden, sitedeki puanlarla aynı */
const rated=b=>b.review?'<div class="rz-rv"><span>Puanın</span>'+sc(b.review.puan)+'<button type="button" class="rz-cx" data-rate="'+b.productId+'">Düzenle</button></div>':'';
const past=b=>'<article class="rz">'+head(b.product,b.when+' · '+b.who)
  +(b.shared?'<p class="rz-done">'+IC.check+'Bu deneyimi paylaştın</p>'+(b.review?rated(b):'<div class="rz-acts"><button type="button" class="btn ghost" data-rate="'+b.productId+'">Değerlendir</button></div>')
   :'<div class="rz-share"><b>Nasıldı?</b><p>Paylaşımın "Mola360 ile gitti" rozetiyle Bağlan\'da görünür.</p><div class="rz-acts"><button type="button" class="btn green" data-paylas="'+b.productId+'">'+IC.plus+'Paylaş</button>'
     +(b.review?'':'<button type="button" class="btn ghost" data-rate="'+b.productId+'">Değerlendir</button>')+'</div></div>'+rated(b))
  +'</article>';

const empty=(ic,t,x)=>'<div class="empty"><span class="ei">'+ic+'</span><b>'+t+'</b><p>'+x+'</p><a class="btn green" href="'+ROOT+'">Keşfetmeye başla</a></div>';

const favs=()=>{const items=favList().map(findByTitle).filter(Boolean).reverse();
  return items.length?'<p class="feed-note" data-fav-n aria-live="polite">'+items.length+' deneyim</p><div class="stack">'+items.map(x=>productCard(x)).join('')+'</div>'
  :empty(IC.heart,'Henüz favorin yok','Beğendiğin turu, oteli ya da etkinliği kalbe dokunarak sakla.')};

const TABS={
  yaklasan:()=>{const l=listUpcoming();return l.length?'<div class="rz-list">'+l.map(up).join('')+'</div>'
    :empty(IC.calendar,'Yaklaşan planın yok','Bir sonraki molanı bul; rezervasyonun, biletin ve buluşma noktası burada olur.')},
  gecmis:()=>{const l=listPastBookings();return l.length?'<div class="rz-list">'+l.map(past).join('')+'</div>'
    :empty(IC.check,'Henüz geçmiş molan yok','Yaşadığın deneyimler burada toplanır. Paylaşınca "Mola360 ile gitti" rozeti alırsın.')},
  favoriler:favs};

/* Ortak çekmece: bilet, buluşma noktası, kalan ödeme, değerlendirme ve iptal onayı */
let sh=null;
function sheet(title,body,from,ex){
  if(!sh){document.body.insertAdjacentHTML('beforeend','<div class="sh-bg" id="plBg"></div><div class="sheet pl-sh" id="plSheet" role="dialog" aria-modal="true" aria-labelledby="plTtl">'
     +'<div class="pl-top"><div class="sh-grab"></div><div class="sh-hd"><h3 id="plTtl"></h3><button type="button" class="sh-x" data-x aria-label="Kapat">'+IC.close+'</button></div></div><div class="pl-in"></div></div>');
    /* içerik uzunsa kendi içinde kayar; çekerek kapatma üst şeritten */
    const el=document.getElementById('plSheet');sh=makeSheet(el,document.getElementById('plBg'),{drag:el.querySelector('.pl-top')})}
  const el=document.getElementById('plSheet');el.classList.toggle('ex',!!ex);el.setAttribute('role',ex?'alertdialog':'dialog');
  document.getElementById('plTtl').textContent=title;const inn=el.querySelector('.pl-in');inn.innerHTML=body;inn.scrollTop=0;sh.open(from);
}
/* Çekmece kapanınca (geri tuşu dahil) iş yapılır, sonra sayfa yenilenir */
function after(fn){let done=false;const go=()=>{if(done)return;done=true;removeEventListener('popstate',go);fn()};
  addEventListener('popstate',go);sh.close();setTimeout(go,450)}

const byNo=no=>listUpcoming().find(b=>b.no===no);

function ticket(b,from){const p=b.product;
  sheet('Biletin','<div class="tk-c"><b>'+p.title+'</b><span>'+when(b)+'</span><span>'+what(b)+'</span>'
    +karekodSvg(b.no,b.no+' bilet karekodu')+'<strong>'+b.no+'</strong><small>Girişte ya da buluşma noktasında bu kodu okut.</small></div>'
    +'<div class="ex-b"><button type="button" class="btn ghost" data-ics>'+IC.calendar+'Takvime ekle</button></div>',from)}

function meet(b,from){const m=b.meet,q=m.yer+', '+m.adres;
  sheet('Buluşma noktası','<div class="bn-map"><span class="bn-pin">'+I.pin+'</span></div>'
    +'<div class="bn-x"><b>'+m.yer+'</b><span>'+m.adres+'</span><p><strong>'+m.saat+'</strong> buluşma · <strong>'+b.slot+'</strong> kalkış</p><p class="bn-n">'+m.not+'</p></div>'
    +'<div class="ex-b"><a class="btn green" href="'+mapsUrl(q)+'" target="_blank" rel="noopener">Yol tarifi al</a><button type="button" class="btn ghost" data-copy="'+q.replace(/"/g,'&quot;')+'">Adresi kopyala</button></div>',from)}

function pay(b,from){
  sheet('Kalanı öde','<dl class="pay-l"><div><dt>Toplam</dt><dd>'+tl(b.total)+'</dd></div><div><dt>Ödenen kapora</dt><dd>'+tl(b.paid)+'</dd></div><div class="tot"><dt>Kalan</dt><dd>'+tl(due(b))+'</dd></div></dl>'
    +'<p class="pay-h">Ödeme yöntemi</p><div class="sh-list" role="radiogroup" aria-label="Ödeme yöntemi"><button type="button" class="opt" role="radio" aria-checked="true"><span>Kayıtlı kart •••• 4821<small>Son kullanma 08/28</small></span><i></i></button></div>'
    +'<div class="ex-b pay-b"><button type="button" class="btn green" data-paygo>'+tl(due(b))+' öde</button></div>',from)}

/* Değerlendirme: genel puan 1 – 10 ve türe göre ayrıntılı puanlar */
const ALT={tur:['Rehber','Program','Ulaşım','Fiyat/performans'],otel:['Temizlik','Konum','Personel','Fiyat/performans'],
  etkinlik:['Organizasyon','Ses ve sahne','Giriş','Fiyat/performans'],aktivite:['Ekip','Güvenlik','Organizasyon','Fiyat/performans'],
  mekan:['Hizmet','Ortam','Temizlik','Fiyat/performans']};
const WORD=['','Çok kötü','Kötü','Kötü','Zayıf','Orta','Fena değil','İyi','Çok iyi','Harika','Olağanüstü'];
let rv={id:'',n:0,alt:{}};
function rate(id,from){const b=listPastBookings().find(x=>x.productId===id);if(!b)return;
  const r=b.review||{},names=ALT[typeKey(b.product.type)]||ALT.tur;rv={id,n:r.puan||0,alt:{...(r.alt||{})}};
  sheet('Nasıldı?','<p class="dg-t">'+b.product.title+'</p>'
    +'<p class="dg-h">Genel puanın</p><div class="dg-n" role="radiogroup" aria-label="Genel puan, 10 üzerinden">'+[1,2,3,4,5,6,7,8,9,10].map(i=>'<button type="button" role="radio" aria-checked="false" data-n="'+i+'">'+i+'</button>').join('')+'</div>'
    +'<p class="dg-w" aria-live="polite"></p>'
    +'<p class="dg-h">Ayrıntılı puan <small>İsteğe bağlı</small></p><div class="dg-alt">'+names.map((a,k)=>'<div class="dg-r"><label for="dgA'+k+'">'+a+'</label>'
      +'<input type="range" id="dgA'+k+'" min="1" max="10" step="1" value="'+(rv.alt[a]||rv.n||8)+'" data-alt="'+a+'"'+(rv.alt[a]?' data-set':'')+'><output for="dgA'+k+'">'+(rv.alt[a]||'–')+'</output></div>').join('')+'</div>'
    +'<label class="dg-l" for="rvTxt">Neler hoşuna gitti? <small>İsteğe bağlı</small></label><textarea id="rvTxt" rows="3" maxlength="500" placeholder="Rehber, ulaşım, yemek…">'+esc(r.metin||'')+'</textarea>'
    +'<div class="ex-b"><button type="button" class="btn green" data-rvgo>Gönder</button></div>',from);
  paintScore()}
function paintScore(){document.querySelectorAll('[data-n]').forEach(s=>s.setAttribute('aria-checked',+s.dataset.n===rv.n));
  const w=document.querySelector('.dg-w');if(w)w.textContent=rv.n?rv.n+' · '+WORD[rv.n]:'Puan vermek için bir sayıya dokun.';
  const g=document.querySelector('[data-rvgo]');if(g)g.disabled=!rv.n;
  /* ayrıntılı puana dokunulmadıysa genel puanı izler */
  document.querySelectorAll('[data-alt]:not([data-set])').forEach(x=>{if(rv.n)x.value=rv.n})}

function askCancel(b,from){
  sheet('Rezervasyon iptal edilsin mi?','<p class="ex-t">'+b.product.title+' rezervasyonun iptal edilir. İaden, iptal koşullarına göre ödeme yöntemine yapılır.</p>'
    +'<div class="ex-b"><button type="button" class="btn danger" data-cxgo>İptal et</button><button type="button" class="btn ghost" data-x>Vazgeç</button></div>',from,true)}

/* Takvim dosyası (.ics) */
/* Saat "07:30", "Giriş 14:00" ya da "Tüm gün" olabilir: saat yoksa tüm gün etkinliği.
   Metin alanlarında virgül, noktalı virgül ve ters bölü kaçışlanır (RFC 5545) */
function ics(b){const d=b.day;if(!d)return;const t=/(\d{1,2}):(\d{2})/.exec(b.slot||'');
  const p2=n=>String(n).padStart(2,'0'),day=d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate()),tx=s=>String(s).replace(/[\\;,]/g,c=>'\\'+c);
  const loc=b.meet?b.meet.yer+', '+b.meet.adres:b.product.place;
  const txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//mola360//TR','BEGIN:VEVENT','UID:'+b.no+'@mola360','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z',
    t?'DTSTART:'+day+'T'+p2(+t[1])+t[2]+'00':'DTSTART;VALUE=DATE:'+day,'SUMMARY:'+tx(b.product.title),'LOCATION:'+tx(loc),'DESCRIPTION:Rezervasyon no '+b.no,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/calendar'}));a.download='mola360-'+b.no+'.ics';
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

const el=document.getElementById('plan');
/* misafir: sekmeler yerine tanıtım */
if(getLevel()==='guest'){document.querySelector('.seg').hidden=true;el.innerHTML=guestIntro('planlarim')}else{
let cur='yaklasan',open=null;
function show(k){cur=k;
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tab===k));
  el.innerHTML=TABS[k]();if(k==='favoriler')favSync();
  history.replaceState(history.state,'','#'+k);
}
document.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)show(b.dataset.tab)});
el.addEventListener('click',e=>{const card=e.target.closest('[data-no]'),b=card&&byNo(card.dataset.no),t=e.target.closest('button');
  if(!t)return;
  if(b){open=b.no;
    if(t.matches('[data-bilet]'))return ticket(b,t);
    if(t.matches('[data-meet]'))return meet(b,t);
    if(t.matches('[data-pay]'))return pay(b,t);
    if(t.matches('[data-cancel]'))return askCancel(b,t)}
  if(t.matches('[data-rate]'))return rate(t.dataset.rate,t);
});
document.body.addEventListener('click',e=>{const t=e.target.closest('#plSheet button,#plSheet a');if(!t)return;
  const b=open&&byNo(open);
  if(t.matches('.pl-in [data-x]')){sh.close();return}
  if(t.matches('[data-n]')){rv.n=+t.dataset.n;paintScore();return}
  if(t.matches('[data-rvgo]')){const id=rv.id,n=rv.n,m=document.getElementById('rvTxt').value.trim(),alt={};
    document.querySelectorAll('[data-alt][data-set]').forEach(x=>{alt[x.dataset.alt]=+x.value});
    after(()=>{rateBooking(id,n,m,alt);show('gecmis');toast('Teşekkürler, değerlendirmen kaydedildi.','Tamam',()=>{},3000)});return}
  if(t.matches('[data-ics]')&&b){ics(b);return}
  if(t.matches('[data-copy]')){if(navigator.clipboard)navigator.clipboard.writeText(t.dataset.copy).then(()=>toast('Adres kopyalandı.','Tamam',()=>{},2500),()=>{});return}
  if(t.matches('[data-paygo]')&&b){after(()=>{payRemaining(b.no);show('yaklasan');toast('Ödeme alındı. Rezervasyonun tamamen ödendi.','Tamam',()=>{},3000)});return}
  if(t.matches('[data-cxgo]')&&b){after(()=>{cancelBooking(b.no);show('yaklasan');toast('Rezervasyon iptal edildi.','Tamam',()=>{},3000)});return}
});
document.body.addEventListener('input',e=>{const x=e.target.closest('#plSheet [data-alt]');if(!x)return;
  x.setAttribute('data-set','');x.nextElementSibling.textContent=x.value});
/* Paylaşınca geçmişteki kart "paylaştın"a döner */
document.addEventListener('m360:paylasildi',()=>{if(cur==='gecmis')show('gecmis')});
const h=location.hash.slice(1);
show(TABS[h]?h:'yaklasan');
/* Bildirimlerden doğrudan: ?ac=bilet|meet|pay&no= rezervasyon no, ?ac=rate&id= ürün → ilgili çekmece açılır */
const u=new URL(location.href),ac=u.searchParams.get('ac');
if(ac){const no=u.searchParams.get('no'),id=u.searchParams.get('id');
  if(ac==='rate')show('gecmis');else if(cur!=='yaklasan')show('yaklasan');
  history.replaceState(history.state,'',u.pathname+'#'+cur);
  const sel={bilet:'[data-bilet]',meet:'[data-meet]',pay:'[data-pay]'}[ac];
  const t=ac==='rate'?el.querySelector('[data-rate="'+CSS.escape(id||'')+'"]'):sel&&el.querySelector('[data-no="'+CSS.escape(no||'')+'"] '+sel);
  if(t)t.click()}
/* aynı sayfadayken menüden gelen #favoriler ya da #yaklasan sekmeyi değiştirir */
addEventListener('hashchange',()=>{const k=location.hash.slice(1);if(TABS[k]&&k!==cur)show(k)});
}
