/* Favoriler: taslakta yalnızca bu tarayıcıda (localStorage) */
import { renderShell } from './shell.js';
import { findByTitle } from './api.js';
import { productCard } from './cards.js';
import { fitFacts } from './ui.js';
import { favList, initFavorites, favSync } from './favorites.js';
import { initLevelInfo } from './level.js';
import { IC } from './icons.js';
import { ROOT } from './root.js';

renderShell('favoriler');
initLevelInfo();
initFavorites();

const items=favList().map(findByTitle).filter(Boolean).reverse();
const el=document.getElementById('fav');
el.innerHTML=items.length
  ?'<p class="feed-note">'+items.length+' deneyim · en son eklenen üstte. Kalbe dokunursan listeden çıkar.</p><div class="stack">'+items.map(x=>productCard(x)).join('')+'</div>'
  :'<div class="empty"><span class="ei">'+IC.heart+'</span><b>Henüz favorin yok</b><p>Beğendiğin turu, oteli ya da etkinliği kalbe dokunarak sakla; karar verirken hepsi burada olsun.</p><a class="btn" href="'+ROOT+'">Keşfetmeye başla</a></div>';
fitFacts(el);favSync();
