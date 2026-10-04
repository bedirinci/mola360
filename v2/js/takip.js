/* Takipçiler / Takip edilenler: profildeki "takipçi" ve "takip" sayısına
   dokununca alttan açılan çekmece (Bedir). Kendi Profil'inde ve başkasının
   profilinde aynı görünür. Her satırda kişi (profiline gider) ve Takip et /
   Takiptesin. Listeler ÖRNEK; backend gelince hesaptan. */
import { FOLLOWING, ME, getUser } from './api.js';
import { USERS } from './data.js';
import { ava, userUrl } from './cards.js';
import { makeSheet } from './ui.js';
import { IC, VERIFIED } from './icons.js';

const h=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const norm=t=>String(t).toLocaleLowerCase('tr');
const $=id=>document.getElementById(id);
const SK='m360-takip';
const KEYS=Object.keys(USERS);
/* takip ettiklerin bu cihazda tutulur; ilk açılışta örnek liste */
const mine=()=>{try{const v=JSON.parse(localStorage.getItem(SK));if(Array.isArray(v))return v}catch(e){}return [...FOLLOWING]};
const save=l=>{try{localStorage.setItem(SK,JSON.stringify(l))}catch(e){}};

/* kişinin listeleri: kendi profilinde takip ettiklerin gerçek, diğerleri
   kullanıcıdan türeyen sabit bir sıra (her açılışta aynı) */
function lists(key){
  if(!key)return {ers:[...KEYS],ing:mine()};
  const others=KEYS.filter(k=>k!==key),seed=[...key].reduce((a,c)=>a+c.charCodeAt(0),0),rot=others.map((_,i)=>others[(i+seed)%others.length]);
  return {ers:(mine().includes(key)?['me']:[]).concat(rot.slice(0,7)),ing:rot.slice(2,8)};
}
const U=k=>k==='me'?{...ME,onay:true}:getUser(USERS[k].kul);

const HTML=`<div class="sh-bg" id="tkBg"></div>
<div class="sheet tall ps flw" id="tkSheet" role="dialog" aria-modal="true" aria-labelledby="tkTtl">
  <div class="ps-top" id="tkDrag"><div class="sh-grab"></div>
    <div class="sh-hd"><h3 id="tkTtl"></h3><button type="button" class="sh-x" data-x aria-label="Kapat">${IC.close}</button></div>
    <div class="seg light flw-seg" role="tablist" aria-label="Takip listeleri">
      <button type="button" role="tab" id="tkT1" data-tk="ers" aria-pressed="true"></button>
      <button type="button" role="tab" id="tkT2" data-tk="ing" aria-pressed="false"></button>
    </div>
    <div class="ps-q flw-q">${IC.search}<input type="search" id="tkQ" placeholder="Ara" autocomplete="off" enterkeyhint="search" aria-label="Kişi ara"></div>
  </div>
  <div class="ps-body flw-body" id="tkList" role="tabpanel" aria-live="polite"></div>
</div>`;

let sheet,cur={key:'',tab:'ers',q:'',counts:[0,0],kul:''};
function row(k){
  const me=k==='me',u=U(k),on=!me&&mine().includes(k);
  return '<div class="flw-r"><a class="flw-p" href="'+userUrl(u)+'">'+ava(u)+'<span class="x"><b>'+u.kul+(u.onay?VERIFIED:'')+'</b><small>'+h(u.ad)+'</small></span></a>'
   +(me?'<span class="flw-me">Sen</span>':'<button type="button" class="follow'+(on?'':' go')+'" data-tf="'+k+'" aria-pressed="'+on+'">'+(on?'Takiptesin':'Takip et')+'</button>')+'</div>';
}
function draw(){
  const L=lists(cur.key),l=L[cur.tab],q=norm(cur.q.trim());
  const f=l.filter(k=>{if(!q)return true;const u=U(k);return norm(u.kul).includes(q)||norm(u.ad).includes(q)});
  $('tkTtl').textContent=cur.kul;
  $('tkT1').textContent=cur.counts[0]+' takipçi';$('tkT2').textContent=cur.counts[1]+' takip';
  document.querySelectorAll('[data-tk]').forEach(b=>{const on=b.dataset.tk===cur.tab;b.setAttribute('aria-pressed',on);b.setAttribute('aria-selected',on)});
  $('tkList').innerHTML=f.length?f.map(row).join('')
    :'<p class="flw-none">'+(q?'Bu adla kimse yok.':cur.tab==='ers'?'Henüz takipçi yok.':'Henüz kimseyi takip etmiyor.')+'</p>';
}
function build(){
  document.body.insertAdjacentHTML('beforeend',HTML);
  sheet=makeSheet($('tkSheet'),$('tkBg'),{drag:$('tkDrag')});
  $('tkSheet').addEventListener('click',e=>{
    const t=e.target.closest('[data-tk]');if(t){cur.tab=t.dataset.tk;draw();$('tkList').scrollTop=0;return}
    const b=e.target.closest('[data-tf]');if(!b)return;
    /* sayfadaki ortak Takip et dinleyicisi ikinci kez çevirmesin */
    e.stopPropagation();
    const k=b.dataset.tf,l=mine(),on=!l.includes(k);
    save(on?[...l,k]:l.filter(x=>x!==k));
    b.setAttribute('aria-pressed',on);b.classList.toggle('go',!on);b.textContent=on?'Takiptesin':'Takip et';
  });
  $('tkQ').addEventListener('input',e=>{cur.q=e.target.value;draw()});
}

/* who: başkasının profilinde USERS anahtarı, kendi profilinde boş.
   tab: 'ers' (takipçiler) ya da 'ing' (takip edilenler) */
export function openFollow(from,{who='',tab='ers',counts=[0,0]}={}){
  if(!sheet)build();
  cur={key:who,tab,q:'',counts,kul:who?USERS[who].kul:ME.kul};
  $('tkQ').value='';draw();sheet.open(from,$('tkSheet').querySelector('[data-tk][aria-pressed="true"]'));
}
