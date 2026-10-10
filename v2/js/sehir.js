/* Şehir sayfası (v2/izmir/, scripts/seo.mjs üretir): türlere göre öne
   çıkanlar, kiminle, semtler, tanıtım ve SSS HTML'de durur. Burada
   yalnızca kabuk (alt menü), favoriler ve kayan raylar. */
import { renderShell } from './shell.js';
import { initFavorites, favSync } from './favorites.js';
import { makeScroll } from './ui.js';

renderShell('kesfet');
initFavorites();
favSync();
document.querySelectorAll('.rail').forEach(el=>makeScroll(el));
