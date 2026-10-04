/* Misafir görünümü: Keşfet, ürün, liste ve Bağlan herkese açık. Kişisel bir
   işlem (beğen, kaydet, takip et, yorum, paylaş, favori) giriş çekmecesini açar;
   giriş yapınca yarım kalan işlem kaldığı yerden sürer. Planlarım ve Profil
   misafire tanıtım sayfası gösterir (guestIntro). */
import { getLevel, setLevel } from './level.js';
import { makeSheet } from './ui.js';
import { IC } from './icons.js';
import { ROOT } from './root.js';

const G='<svg viewBox="0 0 24 24" aria-hidden="true" class="lg-g"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>';
const A='<svg viewBox="0 0 24 24" aria-hidden="true" class="lg-a"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.9a4.8 4.8 0 0 0-4 2.5c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.1-1.2 2.9-2.4a10 10 0 0 0 1.3-2.7 4.2 4.2 0 0 1-2.4-3.8zM14 5.2A4.3 4.3 0 0 0 15 2a4.4 4.4 0 0 0-2.9 1.5 4.1 4.1 0 0 0-1 3.1A3.6 3.6 0 0 0 14 5.2z"/></svg>';
const T='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>';

/* neden açıldığına göre başlık */
const WHY={like:'Beğenmek için giriş yap',save:'Kaydetmek için giriş yap',follow:'Takip etmek için giriş yap',
  comment:'Yorum yapmak için giriş yap',fav:'Favorilerine eklemek için giriş yap',share:'Paylaşmak için giriş yap',
  join:'Mola360\'a üye ol',login:'Mola360\'a giriş yap'};
const SUB='Molapuan kazan, ilk rezervasyonunda %15 indirim al.';

const HTML=`<div class="sh-bg lg-bg" id="lgBg"></div>
<div class="sheet lg-sh" id="lgSheet" role="dialog" aria-modal="true" aria-labelledby="lgTtl">
  <div class="sh-grab"></div>
  <div class="sh-hd"><h3 id="lgTtl"></h3><button type="button" class="sh-x" data-x aria-label="Kapat">${IC.close}</button></div>
  <p class="lg-sub">${SUB}</p>
  <div class="lg-step" data-step="1">
    <button type="button" class="lg-b" data-by="google">${G}Google ile devam et</button>
    <button type="button" class="lg-b dark" data-by="apple">${A}Apple ile devam et</button>
    <button type="button" class="lg-b" data-by="tel">${T}Telefon numarasıyla devam et</button>
  </div>
  <form class="lg-step" data-step="2" hidden novalidate>
    <label for="lgTel">Telefon numaran</label>
    <input id="lgTel" type="tel" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx">
    <p class="err" id="lgErr" hidden>Telefon numaranı 05 ile başlayan 11 hane olarak yaz.</p>
    <button type="submit" class="btn green">Kod gönder</button>
    <button type="button" class="lg-back" data-lg-back>Diğer seçenekler</button>
  </form>
  <p class="lg-note">Hesabın yoksa aynı adımla oluşturulur. Devam ederek <a href="#yakinda">Kullanım koşulları</a>'nı ve <a href="#yakinda">Gizlilik politikası</a>'nı kabul edersin.</p>
</div>`;

let sheet=null,after=null;
const $=id=>document.getElementById(id);
function step(n){document.querySelectorAll('#lgSheet .lg-step').forEach(s=>s.hidden=s.dataset.step!==String(n));
  $('lgErr').hidden=true;if(n===2)setTimeout(()=>$('lgTel').focus(),30)}

/* giriş: oturum Ayşe (Kâşif) olur; adresteki ?gorunum=misafir silinir ki
   yenileyince misafire dönmesin */
function signIn(){
  setLevel('kasif');
  const fn=after;after=null;
  let done=false;const go=()=>{if(done)return;done=true;removeEventListener('popstate',go);
    const u=new URL(location.href);if(u.searchParams.has('gorunum')){u.searchParams.delete('gorunum');history.replaceState(history.state,'',u.pathname+u.search+u.hash)}
    document.dispatchEvent(new CustomEvent('m360:giris'));
    if(fn)fn();else location.reload()};
  addEventListener('popstate',go);sheet.close();setTimeout(go,450);
}

function build(){
  document.body.insertAdjacentHTML('beforeend',HTML);
  sheet=makeSheet($('lgSheet'),$('lgBg'));
  $('lgSheet').addEventListener('click',e=>{
    const b=e.target.closest('[data-by]');
    if(b){if(b.dataset.by==='tel')step(2);else signIn();return}
    if(e.target.closest("[data-lg-back]"))step(1);
  });
  $('lgSheet').querySelector('form').addEventListener('submit',e=>{e.preventDefault();
    const v=$('lgTel').value.replace(/\D/g,'');
    if(!/^05\d{9}$/.test(v)){$('lgErr').hidden=false;$('lgTel').focus();return}
    signIn()});
}

/* from: açan öğe; why: WHY anahtarı; then: girişten sonra yapılacak (yoksa sayfa yenilenir) */
export function openLogin(from,why,then){
  if(!sheet)build();
  after=then||null;
  $('lgTtl').textContent=WHY[why]||WHY.login;
  step(1);sheet.open(from);
}

/* Misafirken kişisel işlemleri yakala: işlem durur, çekmece açılır, girişten sonra aynı öğeye yeniden dokunulur */
const GATE=[['.act.like,.sv-act[data-sva="like"]','like'],['.act.save,[data-pm="save"]','save'],['.follow','follow'],
  ['.cm-in input,.cm-in button,.sv-rep input','comment'],['[data-fav]','fav'],['#shareBtn,[data-paylas],[data-hk-me],[data-birlikte]','share']];
export function initGuestGate(){
  const hit=e=>{if(getLevel()!=='guest')return;
    const j=e.target.closest('[data-giris]');
    if(j){e.preventDefault();e.stopImmediatePropagation();openLogin(j,j.dataset.giris||'login');return}
    for(const [sel,why] of GATE){const t=e.target.closest(sel);if(!t||t.closest('#lgSheet'))continue;
      e.preventDefault();e.stopImmediatePropagation();
      if(t.matches('input'))t.blur();
      openLogin(t,why,()=>{if(t.isConnected){if(t.matches('input'))t.focus();else t.click()}});
      return}};
  document.addEventListener('click',hit,true);
  /* yanıt kutusuna dokunmak odaklanmadan önce yakalanır */
  document.addEventListener('focusin',e=>{if(getLevel()==='guest'&&e.target.closest&&e.target.closest('.sv-rep input,.cm-in input'))hit(e)},true);
}

/* Planlarım ve Profil için misafir tanıtımı */
const ROW=(ic,b,s)=>'<li><i>'+ic+'</i><span><b>'+b+'</b><small>'+s+'</small></span></li>';
const PCT='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/></svg>';
export function guestIntro(page){
  const T={planlarim:['Planların burada toplanır','Rezervasyonların, biletlerin ve favorilerin tek yerde. Giriş yap, hiçbirini kaybetme.'],
    profil:['Molalarını biriktir','Gittiğin yerleri paylaş, takip ettiklerinin molalarını gör, puanını büyüt.']}[page];
  return '<section class="gi" aria-labelledby="giT"><h2 id="giT">'+T[0]+'</h2><p>'+T[1]+'</p>'
   +'<ul class="gi-l">'
   +ROW('<img src="'+ROOT+'img/molapuan.webp" alt="" width="36" height="36">','Her rezervasyonda Molapuan','1 puan = 1 TL, sonraki molanda kullan')
   +ROW(PCT,'İlk rezervasyonda %15 indirim','Üye olunca hesabına tanımlanır')
   +ROW('<img class="lg-k" src="'+ROOT+'logo-koyu.webp" alt="" width="30" height="12">','"Mola360 ile gitti" rozeti','Paylaşımların gerçek bir deneyimle görünür')
   +'</ul><div class="gi-acts"><button type="button" class="btn green" data-giris="login">Giriş yap</button><button type="button" class="btn ghost" data-giris="join">Üye ol</button></div>'
   +'<a class="gi-k" href="'+ROOT+'">Önce keşfetmek istiyorum</a></section>';
}

/* Rezervasyon onayı: misafire hesap daveti */
export const guestNudge=pts=>'<section class="box gi-n" data-pts="'+pts+'"><img src="'+ROOT+'img/molapuan.webp" alt="" width="40" height="40"><div><b>Hesap oluştur, '+pts+' Molapuanını al</b>'
 +'<p>Bu rezervasyon hesabına eklenir, Planlarım\'dan takip edersin.</p></div><button type="button" class="btn green" data-rz-join>Hesap oluştur</button></section>';

