/* "Planlarken yanındayız": beni ara formu ve saat seçme çekmecesi. Çevrimiçi göstergesi shell.js'te. */
import { isLive } from './shell.js';
import { makeSheet } from './ui.js';
const HELP=`<section class="help" aria-labelledby="h-help">
  <div class="help-hd"><h2 id="h-help">Planlarken yanındayız</h2><i class="live dark" data-live><em></em><span data-live-t>Çevrimiçi</span></i></div>
  <p>Seyahat uzmanlarımız her gün <span class="nw">09:00 – 23:59</span> arası <b class="tel">0850 000 00 00</b>'da. Aklına takılanı sor, <span class="nw">birlikte planlayalım.</span></p>
  <div class="acts">
    <a href="https://wa.me/900000000000" target="_blank" rel="noopener" class="btn wa"><svg class="wa-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>WhatsApp'tan yaz<em class="wa-dot light" data-live-dot aria-hidden="true"></em></a>
    <button type="button" class="btn ghost" id="callBtn" aria-expanded="false" aria-controls="callForm"><svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>Beni ara</button>
  </div>
  <form class="call" id="callForm" hidden novalidate>
    <label for="cName">Adın</label><input id="cName" autocomplete="given-name" placeholder="Örn. Ayşe" required>
    <label for="cTel">Telefon numaran</label><input id="cTel" type="tel" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" required aria-describedby="telErr"><p class="err" id="telErr" hidden>Cep telefonunu 05 ile başlayan 11 hane olarak yaz, örneğin 0532 123 45 67.</p>
    <label for="cWhenBtn" id="cWhenLbl">Ne zaman arayalım?</label>
    <button type="button" class="pick" id="cWhenBtn" aria-haspopup="dialog" aria-expanded="false" aria-controls="whenSheet"><span id="cWhenTxt">Hemen</span><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
    <input type="hidden" id="cWhen" value="Hemen">
    <button class="btn" type="submit">Aranma talebi gönder</button>
    <p class="call-note">Uzmanımız seçtiğin saatte arar.</p>
  </form>
  <p class="call-ok" id="callOk" hidden role="status"></p>
</section>`;
const SHEET=`<div class="sh-bg" id="whenBg" aria-hidden="true"></div>
<div class="sheet" id="whenSheet" role="dialog" aria-modal="true" aria-labelledby="whenTtl">
  <div class="sh-grab" aria-hidden="true"></div>
  <div class="sh-hd"><h3 id="whenTtl">Ne zaman arayalım?</h3><button type="button" class="sh-x" data-x aria-label="Kapat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
  <div class="sh-list" id="whenList" role="radiogroup" aria-labelledby="whenTtl"></div>
</div>`;

/* Yardım kutusunu verilen yere, saat çekmecesini sayfanın sonuna ekler */
export function renderHelp(where){
  where.insertAdjacentHTML('beforeend',HELP);
  document.querySelector('script[type="module"]').insertAdjacentHTML('beforebegin',SHEET);
  initHelp();
}

function initHelp(){
/* aranma saatleri: çevrimiçiyse "Hemen", sonra henüz başlamamış ilk üç aralık */
function callSlots(){
  const on=isLive();
  const sel=document.getElementById('cWhen'),prev=sel.value;
  /* aralıklar tarayıcı saatine göre: henüz başlamamış ilk üç aralık */
  const SL=[['sabah',9,12],['öğlen',12,17],['akşam',17,22]],bh=new Date().getHours(),p2=n=>String(n).padStart(2,'0')+':00',nx=[];
  for(const d of ['Bu','Yarın'])for(const [n,a,z] of SL)if((d==='Yarın'||a>bh)&&nx.length<3)nx.push(d+' '+n+' ('+p2(a)+' – '+p2(z)+')');
  const opts=(on?['Hemen']:[]).concat(nx);
  const v=opts.includes(prev)?prev:opts[0];sel.value=v;document.getElementById('cWhenTxt').textContent=v;
  document.getElementById('whenList').innerHTML=opts.map(o=>{const m=o.match(/^(.*?) \((.*)\)$/);return '<button type="button" class="opt" role="radio" aria-checked="'+(o===v)+'" data-v="'+o+'"><span>'+(m?m[1]+'<small>'+m[2]+'</small>':o+'<small>Birkaç dakika içinde</small>')+'</span><i aria-hidden="true"></i></button>'}).join('');
}
callSlots();setInterval(callSlots,60000);

/* beni ara */
const cb=document.getElementById('callBtn'),cf=document.getElementById('callForm'),ok=document.getElementById('callOk');
cb.addEventListener('click',()=>{const o=cf.hidden;cf.hidden=!o;ok.hidden=true;cb.setAttribute('aria-expanded',o);if(o)document.getElementById('cName').focus()});
/* ne zaman arayalım: alttan çekmece */
const wb=document.getElementById('cWhenBtn'),sh=document.getElementById('whenSheet');
const when=makeSheet(sh,document.getElementById('whenBg'));
wb.addEventListener('click',()=>when.open(wb));
document.getElementById('whenList').addEventListener('click',e=>{const o=e.target.closest('.opt');if(!o)return;
  sh.querySelectorAll('.opt').forEach(x=>x.setAttribute('aria-checked',x===o));
  document.getElementById('cWhen').value=o.dataset.v;document.getElementById('cWhenTxt').textContent=o.dataset.v;setTimeout(when.close,140)});
const tel=document.getElementById('cTel'),telErr=document.getElementById('telErr');
const telOk=v=>{const d=v.replace(/\D/g,'').replace(/^90/,'').replace(/^(?=5)/,'0');return /^05\d{9}$/.test(d)};
tel.addEventListener('input',()=>{if(tel.getAttribute('aria-invalid')==='true'&&telOk(tel.value)){tel.removeAttribute('aria-invalid');telErr.hidden=true}});
cf.addEventListener('submit',e=>{e.preventDefault();
  if(!telOk(tel.value)){tel.setAttribute('aria-invalid','true');telErr.hidden=false;tel.focus();return}
  const n=document.getElementById('cName').value.trim(),w=document.getElementById('cWhen').value;
  cf.hidden=true;cb.setAttribute('aria-expanded','false');ok.hidden=false;ok.textContent=(n?n+', ':'')+'talebin alındı. Uzmanımız '+(w==='Hemen'?'birkaç dakika içinde':w.toLocaleLowerCase('tr').replace(/ \(.*\)/,'')+' '+(w.match(/\((.*)\)/)||['',''])[1]+' arasında')+' seni arayacak. (Taslak: gerçek talep gönderilmedi.)'});
}
