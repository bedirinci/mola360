/* Tam ekran menü */
import { MENU } from './data.js';
import { I } from './icons.js';

export function initMenu(){
document.getElementById('mMain').innerHTML=MENU.map(m=>'<a href="#yakinda" class="m-link"><span class="ico"><img src="m-'+m[1]+'.webp" alt="" width="30" height="30" decoding="async"></span><b>'+m[0]+'</b><em>'+m[2]+'</em>'+I.chev+'</a>').join('');
const menu=document.getElementById('menu'),btn=document.getElementById('menuBtn');
const behind=()=>[...document.body.children].filter(el=>el!==menu&&el.tagName!=='SCRIPT');
function openM(){menu.classList.add('open');document.body.classList.add('locked');btn.setAttribute('aria-expanded','true');behind().forEach(el=>el.inert=true);setTimeout(()=>document.getElementById('menuClose').focus(),50)}
function closeM(){menu.classList.remove('open');document.body.classList.remove('locked');btn.setAttribute('aria-expanded','false');behind().forEach(el=>el.inert=false);btn.focus()}
menu.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const f=[...menu.querySelectorAll('a,button,select')].filter(x=>x.offsetParent);const a=f[0],z=f[f.length-1];
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});
menu.addEventListener('click',e=>{const l=e.target.closest('a');if(!l)return;if(l.getAttribute('href')==='#')e.preventDefault();closeM()});
btn.addEventListener('click',openM);
(()=>{const mb=menu.querySelector('.m-body'),rest=document.getElementById('mRest');let sy=null,pull=0;
  const back=()=>{if(sy==null&&!pull)return;sy=null;pull=0;rest.style.transition='transform .32s cubic-bezier(.2,.8,.2,1)';rest.style.transform=''};
  mb.addEventListener('touchstart',e=>{sy=mb.scrollTop<=0?e.touches[0].clientY:null;rest.style.transition='none'},{passive:true});
  mb.addEventListener('touchmove',e=>{if(sy==null)return;const dy=e.touches[0].clientY-sy;
    if(dy>0&&mb.scrollTop<=0){e.preventDefault();pull=Math.min(140,dy*.45);rest.style.transform='translateY('+pull+'px)'}
    else if(pull){pull=0;rest.style.transform='';sy=null}},{passive:false});
  mb.addEventListener('touchend',back);mb.addEventListener('touchcancel',back);})();document.getElementById('menuClose').addEventListener('click',closeM);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open'))closeM()});
if(location.hash==='#menu')openM();
}
