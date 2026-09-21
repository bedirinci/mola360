/* Oturum yükleme ve yetki kontrolü.

   oturumYukle her istekte çalışıyor ve req.user'ı dolduruyor (yoksa null).
   girisGerekli ve izinGerekli KORUMA katmanı — ikisi de sunucuda.

   Panelin menüyü gizlemesi bir kolaylıktır, koruma değildir: düğmeyi
   gizlemek, o adrese doğrudan istek atmayı engellemez. */
import { oturumCoz, COOKIE_ADI } from '../services/auth.js';
import { hata } from '../lib/errors.js';
import { yakala } from './error.js';

export const oturumYukle = yakala(async (req, _res, next) => {
  const jeton = req.cookies ? req.cookies[COOKIE_ADI] : null;
  req.user = jeton ? await oturumCoz(jeton) : null;
  next();
});

export function girisGerekli(req, _res, next) {
  if (!req.user) return next(hata.kimlikYok());
  next();
}

/* Birden çok izin verilirse HEPSİ gerekir. "herhangi biri" gerektiğinde
   izinlerdenBiri kullanılıyor — hangisinin istendiği çağrı yerinde
   okunabilir olsun diye iki ayrı fonksiyon. */
export function izinGerekli(...gerekli) {
  return (req, _res, next) => {
    if (!req.user) return next(hata.kimlikYok());
    const eksik = gerekli.filter(k => !req.user.permissions.has(k));
    if (eksik.length) {
      return next(hata.yetkiYok(`Bu işlem için gereken yetki sizde yok: ${eksik.join(', ')}`));
    }
    next();
  };
}

export function izinlerdenBiri(...secenekler) {
  return (req, _res, next) => {
    if (!req.user) return next(hata.kimlikYok());
    if (secenekler.some(k => req.user.permissions.has(k))) return next();
    next(hata.yetkiYok(`Bu işlem şu yetkilerden birini gerektiriyor: ${secenekler.join(', ')}`));
  };
}
