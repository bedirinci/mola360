/* Eski adres: Rezervasyonlar artık Planlarım'ın içinde (planlarim.js) */
import { ROOT } from './root.js';
location.replace(ROOT+'planlarim/#'+(location.hash==='#gecmis'?'gecmis':'yaklasan'));
