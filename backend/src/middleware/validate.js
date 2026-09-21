/* Şema doğrulama — SUNUCU TARAFINDA, her zaman.

   Tarayıcıdaki doğrulama kullanıcıya yardım eder; güvenlik sağlamaz.
   İsteği doğrudan atan biri için hiçbir anlamı yoktur. Bu yüzden her yazma
   uç noktası buradan geçiyor.

   Doğrulanan değer req.body'nin ÜZERİNE yazılıyor: şemada olmayan alanlar
   düşüyor. Böylece istemcinin gönderdiği fazladan bir alan (örneğin
   `status: 'published'`) sorguya sızamıyor. */
import { hata } from '../lib/errors.js';

function alanHatalari(zodHatasi) {
  const sonuc = {};
  for (const sorun of zodHatasi.issues) {
    const yol = sorun.path.join('.') || '_';
    if (!sonuc[yol]) sonuc[yol] = [];
    sonuc[yol].push(sorun.message);
  }
  return sonuc;
}

function dogrulayici(kaynak) {
  return (sema) => (req, _res, next) => {
    const sonuc = sema.safeParse(req[kaynak]);
    if (!sonuc.success) {
      return next(hata.gecersizIstek('Gönderilen veri geçersiz.', alanHatalari(sonuc.error)));
    }
    req[kaynak] = sonuc.data;
    next();
  };
}

export const govdeDogrula  = dogrulayici('body');
export const sorguDogrula  = dogrulayici('query');
export const paramDogrula  = dogrulayici('params');
