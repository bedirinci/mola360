/* "Planlarken yanındayız": çevrimiçi göstergesi, beni ara formu, saat seçme çekmecesi */
export function initHelp(){
/* çevrimiçi göstergesi: İstanbul saatiyle 09:00 – 23:59 */
function liveNow(){
  let h;try{h=+new Intl.DateTimeFormat('en-GB',{hour:'numeric',hourCycle:'h23',timeZone:'Europe/Istanbul'}).format(new Date())}catch(e){h=new Date().getHours()}
  const on=h>=9&&h<24;
  document.querySelectorAll('[data-live]').forEach(x=>{x.classList.toggle('off',!on);x.querySelector('[data-live-t]').textContent=on?'Çevrimiçi':'Çevrimdışı · 09:00\'da'});
  document.querySelectorAll('[data-live-dot]').forEach(x=>x.classList.toggle('off',!on));
  const sel=document.getElementById('cWhen'),prev=sel.value;
  /* aralıklar tarayıcı saatine göre: henüz başlamamış ilk üç aralık */
  const SL=[['sabah',9,12],['öğlen',12,17],['akşam',17,22]],bh=new Date().getHours(),p2=n=>String(n).padStart(2,'0')+':00',nx=[];
  for(const d of ['Bu','Yarın'])for(const [n,a,z] of SL)if((d==='Yarın'||a>bh)&&nx.length<3)nx.push(d+' '+n+' ('+p2(a)+' – '+p2(z)+')');
  const opts=(on?['Hemen']:[]).concat(nx);
  const v=opts.includes(prev)?prev:opts[0];sel.value=v;document.getElementById('cWhenTxt').textContent=v;
  document.getElementById('whenList').innerHTML=opts.map(o=>{const m=o.match(/^(.*?) \((.*)\)$/);return '<button type="button" class="opt" role="radio" aria-checked="'+(o===v)+'" data-v="'+o+'"><span>'+(m?m[1]+'<small>'+m[2]+'</small>':o+'<small>Birkaç dakika içinde</small>')+'</span><i aria-hidden="true"></i></button>'}).join('');
}
liveNow();setInterval(liveNow,60000);

/* beni ara */
const cb=document.getElementById('callBtn'),cf=document.getElementById('callForm'),ok=document.getElementById('callOk');
cb.addEventListener('click',()=>{const o=cf.hidden;cf.hidden=!o;ok.hidden=true;cb.setAttribute('aria-expanded',o);if(o)document.getElementById('cName').focus()});
/* ne zaman arayalım: alttan çekmece */
const wb=document.getElementById('cWhenBtn'),sh=document.getElementById('whenSheet'),bg=document.getElementById('whenBg');
const shBehind=()=>[...document.body.children].filter(el=>el!==sh&&el!==bg&&el.tagName!=='SCRIPT');
function openSh(){bg.classList.add('open');sh.classList.add('open');document.body.classList.add('locked');wb.setAttribute('aria-expanded','true');shBehind().forEach(el=>el.inert=true);
  setTimeout(()=>(sh.querySelector('.opt[aria-checked="true"]')||document.getElementById('whenX')).focus({preventScroll:true}),60)}
function closeSh(){if(!sh.classList.contains('open'))return;sh.style.transform='';bg.style.opacity='';bg.classList.remove('open');sh.classList.remove('open');document.body.classList.remove('locked');wb.setAttribute('aria-expanded','false');shBehind().forEach(el=>el.inert=false);wb.focus({preventScroll:true})}
wb.addEventListener('click',openSh);bg.addEventListener('click',closeSh);document.getElementById('whenX').addEventListener('click',closeSh);
document.getElementById('whenList').addEventListener('click',e=>{const o=e.target.closest('.opt');if(!o)return;
  sh.querySelectorAll('.opt').forEach(x=>x.setAttribute('aria-checked',x===o));
  document.getElementById('cWhen').value=o.dataset.v;document.getElementById('cWhenTxt').textContent=o.dataset.v;setTimeout(closeSh,140)});
sh.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeSh();return}
  if(e.key==='Tab'){const f=[...sh.querySelectorAll('button')],a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
/* aşağı kaydırınca kapanır */
let y0=null,dy=0,t0=0;
sh.addEventListener('touchstart',e=>{y0=e.touches[0].clientY;dy=0;t0=Date.now();sh.classList.add('drag')},{passive:true});
sh.addEventListener('touchmove',e=>{if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);if(dy>0)e.preventDefault();sh.style.transform='translateY('+dy+'px)';bg.style.opacity=String(Math.max(0,1-dy/sh.offsetHeight))},{passive:false});
sh.addEventListener('touchend',()=>{if(y0==null)return;sh.classList.remove('drag');const v=dy/Math.max(1,Date.now()-t0);y0=null;
  if(dy>sh.offsetHeight*.3||(dy>30&&v>.5))closeSh();else{sh.style.transform='';bg.style.opacity=''}});
sh.addEventListener('touchcancel',()=>{y0=null;sh.classList.remove('drag');sh.style.transform='';bg.style.opacity=''});
const tel=document.getElementById('cTel'),telErr=document.getElementById('telErr');
const telOk=v=>{const d=v.replace(/\D/g,'').replace(/^90/,'').replace(/^(?=5)/,'0');return /^05\d{9}$/.test(d)};
tel.addEventListener('input',()=>{if(tel.getAttribute('aria-invalid')==='true'&&telOk(tel.value)){tel.removeAttribute('aria-invalid');telErr.hidden=true}});
cf.addEventListener('submit',e=>{e.preventDefault();
  if(!telOk(tel.value)){tel.setAttribute('aria-invalid','true');telErr.hidden=false;tel.focus();return}
  const n=document.getElementById('cName').value.trim(),w=document.getElementById('cWhen').value;
  cf.hidden=true;cb.setAttribute('aria-expanded','false');ok.hidden=false;ok.textContent=(n?n+', ':'')+'talebin alındı. Uzmanımız '+(w==='Hemen'?'birkaç dakika içinde':w.toLocaleLowerCase('tr').replace(/ \(.*\)/,'')+' '+(w.match(/\((.*)\)/)||['',''])[1]+' arasında')+' seni arayacak. (Taslak: gerçek talep gönderilmedi.)'});
}
