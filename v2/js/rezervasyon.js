/* Rezervasyon akışı: seçim → bilgiler → ödeme → onay. Tek sayfa, adımlar
   tarayıcı geçmişine yazılır (geri tuşu bir önceki adıma döner). Taslakta
   ödeme alınmaz ve kart bilgisi istenmez; rezervasyon yalnızca bu cihazda
   tutulur. Toplam fiyat baştan sona aynı: sonradan eklenen ücret yok. */
import { renderShell } from './shell.js';
import { getProduct, bookingSpec, createBooking } from './api.js';
import { tl, esc, toast } from './ui.js';
import { lvOn, lvPrice, getLevel } from './level.js';
import { IC } from './icons.js';
import { ROOT } from './root.js';

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

/* seçim durumu; adresten gelen tarih (ürün sayfasında seçildiyse) */
const dateKey=d=>d[0]+' '+d[1];
const st={step:1,
  date:S.dates.length===1?dateKey(S.dates[0]):(S.dates.map(dateKey).find(k=>k===q.get('tarih'))||''),
  slot:'',opt:S.opts.length?0:-1,qty:S.qty?(S.qty.start||2):1,pay:S.deposit?'kapora':'tam',
  name:'',phone:'',email:'',ok:false};

const unit=()=>lvPrice(p.title,st.opt>=0?S.opts[st.opt][1]:p.price);
const full=()=>st.opt>=0?S.opts[st.opt][1]:p.price;
const total=()=>S.fixed?unit():unit()*st.qty;
const now=()=>st.pay==='kapora'?Math.round(total()*S.deposit):total();
const qtyTxt=()=>S.qty?st.qty+' '+S.qty.label.toLocaleLowerCase('tr'):'';
const when=()=>[st.date,st.slot].filter(Boolean).join(' · ');

const head='<a class="bk-p" href="'+productUrl+'"><span class="pt" style="background:'+p.bg+'"></span><div class="x"><small>'+p.type.toLocaleUpperCase('tr')+'</small><b>'+p.title+'</b><span>'+p.place.split(' · ')[0]+'</span></div></a>';
const radios=(name,items,cur)=>'<div class="u-dates" role="radiogroup" aria-label="'+name+'">'+items.map(([v,a,b])=>'<button type="button" role="radio" aria-checked="'+(v===cur)+'" data-'+name.toLocaleLowerCase('tr').replace(/[^a-z]/g,'')+'="'+esc(v)+'"><small>'+a+'</small><b>'+b+'</b></button>').join('')+'</div>';

function step1(){
  return head
  +'<section class="box" id="bkDate"><h2>'+(S.dates.length===1?'Tarih':'Tarih seç')+'</h2>'
  +(S.dates.length===1?'<p class="bk-one">'+IC.calendar+'<b>'+st.date+'</b></p>'
    :radios('Tarih',S.dates.map(d=>[dateKey(d),d[0],d[1]]),st.date)+'<p class="err" id="dateErr" hidden>Devam etmek için bir tarih seç.</p>')
  +'</section>'
  +(S.slots.length?'<section class="box" id="bkSlot"><h2>Saat</h2>'+radios('Saat',S.slots.map(s=>[s,'Başlangıç',s]),st.slot)+'<p class="err" id="slotErr" hidden>Bir saat seç.</p></section>':'')
  +(S.opts.length?'<section class="box"><h2>'+(S.fixed?'Alan':'Seçenek')+'</h2><div class="bk-opts" role="radiogroup" aria-label="Seçenek">'
    +S.opts.map((o,i)=>'<button type="button" role="radio" aria-checked="'+(i===st.opt)+'" data-opt="'+i+'"><span>'+o[0]+'</span><b>'+tl(lvPrice(p.title,o[1]))+'</b></button>').join('')+'</div>'
    +(S.fixed?'<p>Fiyat seçtiğin alan için minimum harcama; mekânda harcamandan düşülür. <span class="ornek">ÖRNEK KURAL</span></p>':'')+'</section>':'')
  +(S.qty?'<section class="box"><div class="bk-qty"><div><h2>'+S.qty.label+'</h2>'+(S.qty.note?'<p>'+S.qty.note+'</p>':'')+'</div>'
    +'<div class="stp"><button type="button" data-q="-1" aria-label="Azalt">−</button><output id="qty" aria-live="polite">'+st.qty+'</output><button type="button" data-q="1" aria-label="Artır">+</button></div></div></section>':'')
  +(S.deposit?'<section class="box"><h2>Nasıl ödemek istersin?</h2><div class="bk-opts" role="radiogroup" aria-label="Ödeme şekli">'
    +'<button type="button" role="radio" aria-checked="'+(st.pay==='kapora')+'" data-pay="kapora"><span>%20 kaporayla yerini ayırt<small>Bugün <i id="depNow">'+tl(Math.round(total()*S.deposit))+'</i>, kalanı kalkıştan 7 gün önce</small></span></button>'
    +'<button type="button" role="radio" aria-checked="'+(st.pay==='tam')+'" data-pay="tam"><span>Tamamını şimdi öde<small>Sonra hatırlaman gereken bir ödeme kalmaz</small></span></button></div>'
    +'<p><span class="ornek">ÖRNEK KURAL</span></p></section>':'');
}

function step2(){
  const f=(id,label,type,ac,v,extra)=>'<label for="'+id+'">'+label+'</label><input id="'+id+'" name="'+id+'" type="'+type+'" autocomplete="'+ac+'" value="'+esc(v)+'"'+(extra||'')+'><p class="err" id="'+id+'Err" hidden></p>';
  return head
  +'<section class="box"><h2>İletişim bilgilerin</h2><p>Biletin ve rezervasyon bilgilerin bu adrese gelir. Yalnızca bu rezervasyon için kullanılır.</p>'
  +'<form class="bk-form" id="bkForm" novalidate>'
  +f('name','Ad soyad','text','name',st.name)
  +f('phone','Telefon','tel','tel',st.phone,' inputmode="tel" placeholder="05xx xxx xx xx"')
  +f('email','E-posta','email','email',st.email,' inputmode="email"')
  +'</form><p class="bk-login">Hesabın var mı? <a href="#yakinda">Giriş yap</a>, bilgilerin dolsun.</p></section>';
}

function step3(){
  const rows=[['Tarih',when()],S.opts.length&&[S.fixed?'Alan':'Seçenek',S.opts[st.opt][0]],S.qty&&[S.qty.label,qtyTxt()]].filter(Boolean);
  const lv=lvOn(p.title);
  const pts=Math.floor(total()/100);
  return head
  +'<section class="box"><h2>Özet</h2><dl class="bk-sum">'+rows.map(r=>'<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>').join('')+'<div><dt>İletişim</dt><dd>'+esc(st.name)+'<br>'+esc(st.email)+'</dd></div></dl></section>'
  +'<section class="box"><h2>Fiyat</h2><dl class="bk-sum price">'
  +(S.fixed?'<div><dt>Minimum harcama</dt><dd>'+tl(unit())+'</dd></div>'
    :'<div><dt>'+tl(full())+' × '+qtyTxt()+'</dt><dd>'+tl(full()*st.qty)+'</dd></div>'
     +(lv?'<div><dt>Kâşif indirimi %10</dt><dd class="ok">−'+tl(full()*st.qty-total())+'</dd></div>':''))
  +'<div><dt>Hizmet bedeli</dt><dd>0 TL</dd></div>'
  +'<div class="tot"><dt>Toplam</dt><dd>'+tl(total())+'</dd></div>'
  +(st.pay==='kapora'?'<div class="now"><dt>Bugün ödenecek (%20 kapora)</dt><dd>'+tl(now())+'</dd></div><div><dt>Kalan, kalkıştan 7 gün önce</dt><dd>'+tl(total()-now())+'</dd></div>':'')
  +'</dl><p>Gördüğün toplam, ödeyeceğin toplam: sonradan eklenen ücret yok.</p></section>'
  +'<section class="box"><h2>İptal <span class="ornek">ÖRNEK KURAL</span></h2><ul class="ticks"><li>'+IC.check+'<div><b>'+S.cancel+'.</b> <span>Sonrasında iptal edersen ödediğin tutar iade edilmez.</span></div></li></ul></section>'
  +'<section class="box"><h2>Ödeme</h2><div class="bk-pay">'+IC.shield+'<p><b>Kartla güvenli ödeme (3D Secure)</b> ödeme altyapısıyla gelecek. Bu taslakta kart bilgisi istenmez ve ödeme alınmaz.</p></div>'
  +'<ul class="ticks"><li>'+IC.check+'<div><b>3 taksit, vade farksız</b> <span>Anlaşmalı kartlarla. <span class="ornek">ÖRNEK</span></span></div></li>'
  +'<li>'+IC.check+'<div><b>'+(getLevel()==='guest'?'Üyeler bu rezervasyondan '+pts+' Molapuan kazanır':'Bu rezervasyondan '+pts+' Molapuan kazanırsın')+'</b> <span>100 TL = 1 puan. <span class="ornek">ÖNERİ</span></span></div></li></ul>'
  +'<label class="bk-ok"><input type="checkbox" id="okBox"'+(st.ok?' checked':'')+'><span><a href="#yakinda">Ön bilgilendirme formunu</a> ve <a href="#yakinda">mesafeli satış sözleşmesini</a> okudum, onaylıyorum.</span></label><p class="err" id="okErr" hidden>Devam etmek için sözleşmeyi onaylaman gerekiyor.</p></section>';
}

function done(r){
  return '<div class="bk-done"><span class="ei">'+IC.check+'</span><h1>Rezervasyonun alındı</h1><p>'+p.title+'<br>'+when()+(S.qty?' · '+qtyTxt():'')+'</p>'
  +'<p class="no">Rezervasyon no <b>'+r.no+'</b> <span class="ornek">TASLAK · ödeme alınmadı</span></p></div>'
  +'<section class="box"><h2>Sırada ne var?</h2><ul class="ticks">'
  +'<li>'+IC.check+'<div><b>Bilgiler e-postanda</b> <span>'+esc(st.email)+' adresine bilet ve buluşma bilgisi gider. Taslakta e-posta gönderilmez.</span></div></li>'
  +(st.pay==='kapora'?'<li>'+IC.check+'<div><b>Kalan '+tl(total()-now())+'</b> <span>Kalkıştan 7 gün önce hatırlatırız; Rezervasyonlar\'dan ödeyebilirsin.</span></div></li>':'')
  +'<li>'+IC.check+'<div><b>Döndükten sonra paylaş</b> <span>Paylaşımın bu deneyimin sayfasında ve Bağlan\'da "Mola360 ile gitti" rozetiyle görünür.</span></div></li></ul></section>'
  +'<div class="bk-acts"><a class="btn" href="'+ROOT+'rezervasyonlar/">Rezervasyonlarım</a><button type="button" class="btn ghost" data-invite>'+IC.share+'Birlikte gideceklere gönder</button></div>';
}

const LABEL={1:'Devam et',2:'Ödemeye geç'};
function drawCta(){
  if(st.step===4){cta.hidden=true;return}
  cta.hidden=false;
  const small=st.step===3&&st.pay==='kapora'?'Bugün ödenecek':(S.fixed?'minimum harcama':'toplam'+(S.qty?' · '+qtyTxt():''));
  cta.innerHTML='<div class="pp"><small>'+small+'</small><strong>'+tl(st.step===3?now():total())+'</strong></div>'
   +'<button type="button" class="btn green" id="ctaGo">'+(LABEL[st.step]||tl(now())+' öde')+'</button>';
}
let last=null;
function draw(push){
  document.querySelectorAll('#steps li').forEach((li,i)=>{li.classList.toggle('on',i+1===st.step);li.classList.toggle('ok',i+1<st.step);if(i+1===st.step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
  document.getElementById('steps').hidden=st.step===4;
  main.innerHTML=st.step===1?step1():st.step===2?step2():st.step===3?step3():done(last);
  if(st.step===1)refresh();else drawCta();
  if(push)history.pushState({s:st.step},'');
  window.scrollTo(0,0);
}
history.replaceState({s:1},'');
window.addEventListener('popstate',e=>{const s=e.state&&e.state.s||1;if(st.step===4){location.href=ROOT+'rezervasyonlar/';return}st.step=s;draw(false)});
back.addEventListener('click',e=>{if(st.step>1&&st.step<4){e.preventDefault();history.back()}});

const show=(id,msg)=>{const el=document.getElementById(id);if(!el)return;el.hidden=!msg;if(msg)el.textContent=msg};
function check2(){
  st.name=document.getElementById('name').value.trim();st.phone=document.getElementById('phone').value.trim();st.email=document.getElementById('email').value.trim();
  const e={name:st.name.length<3||!st.name.includes(' ')?'Adını ve soyadını yaz.':'',
    phone:st.phone.replace(/\D/g,'').length<10?'Telefon numarası en az 10 rakam olmalı.':'',
    email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(st.email)?'':'Geçerli bir e-posta adresi yaz.'};
  Object.entries(e).forEach(([k,m])=>{show(k+'Err',m);document.getElementById(k).setAttribute('aria-invalid',!!m)});
  const bad=Object.keys(e).find(k=>e[k]);if(bad)document.getElementById(bad).focus();
  return !bad;
}
cta.addEventListener('click',e=>{if(!e.target.closest('#ctaGo'))return;
  if(st.step===1){
    if(!st.date){show('dateErr','Devam etmek için bir tarih seç.');document.getElementById('bkDate').scrollIntoView({behavior:'smooth',block:'center'});return}
    if(S.slots.length&&!st.slot){show('slotErr','Bir saat seç.');document.getElementById('bkSlot').scrollIntoView({behavior:'smooth',block:'center'});return}
  }
  if(st.step===2&&!check2())return;
  if(st.step===3){
    if(!st.ok){show('okErr','Devam etmek için sözleşmeyi onaylaman gerekiyor.');document.getElementById('okBox').focus();return}
    last=createBooking({productId:p.id,date:st.date,slot:st.slot,opt:st.opt>=0?S.opts[st.opt][0]:'',qty:qtyTxt(),total:total(),paid:now(),pay:st.pay});
    st.step=4;history.replaceState({s:4},'');draw(false);return;
  }
  st.step++;draw(true);
});
/* adım içindeki seçimler sayfayı yeniden çizmez: odak ve kaydırma yerinde kalır */
const radio=(sel,el)=>main.querySelectorAll(sel).forEach(x=>x.setAttribute('aria-checked',x===el));
function refresh(){
  const q=document.getElementById('qty');if(q)q.textContent=st.qty;
  const d=document.getElementById('depNow');if(d)d.textContent=tl(Math.round(total()*S.deposit));
  main.querySelectorAll('[data-q]').forEach(b=>b.disabled=+b.dataset.q<0?st.qty<=S.qty.min:st.qty>=S.qty.max);
  drawCta();
}
main.addEventListener('click',e=>{
  const d=e.target.closest('[data-tarih]');if(d){st.date=d.dataset.tarih;radio('[data-tarih]',d);show('dateErr','');refresh();return}
  const s=e.target.closest('[data-saat]');if(s){st.slot=s.dataset.saat;radio('[data-saat]',s);show('slotErr','');refresh();return}
  const o=e.target.closest('[data-opt]');if(o){st.opt=+o.dataset.opt;radio('[data-opt]',o);refresh();return}
  const y=e.target.closest('[data-pay]');if(y){st.pay=y.dataset.pay;radio('[data-pay]',y);refresh();return}
  const n=e.target.closest('[data-q]');if(n){st.qty=Math.max(S.qty.min,Math.min(S.qty.max,st.qty+ +n.dataset.q));refresh();return}
  if(e.target.closest('[data-invite]')){
    if(navigator.share)navigator.share({title:p.title,text:when()+' · '+p.title+' için yerimizi ayırttım.',url:new URL(productUrl,location.href).href}).catch(()=>{});
    else toast('Paylaşım bu tarayıcıda yok; bağlantıyı kopyalayıp gönderebilirsin.','Tamam',()=>{},3500);return}
});
main.addEventListener('change',e=>{if(e.target.id==='okBox'){st.ok=e.target.checked;if(st.ok)show('okErr','')}});
main.addEventListener('input',e=>{if(st.step===2&&['name','phone','email'].includes(e.target.id))st[e.target.id]=e.target.value});

renderShell('kesfet',{nav:false});
draw(false);
}
