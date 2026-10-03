/* ---------------- slug: başlıktan adres parçası ----------------
   "Karadeniz Yaylaları ve Batum Turu" -> "karadeniz-yaylalari-ve-batum-turu"

   Kurallar docs/veri-sozlesmesi.md bölüm 3'te. Özeti:

   TÜRKÇE HARFLER KÜÇÜLTMEDEN ÖNCE ÇEVRİLİR. JavaScript'te
   'İ'.toLowerCase() düz "i" değil, "i" + birleşik nokta (U+0307) üretir;
   toLowerCase() önce çalışsaydı "İSTANBUL" -> "i̇stanbul" olur ve adreste
   görünmez bir bozuk karakter kalırdı. toLocaleLowerCase('tr') de çözüm
   değil: "I" harfini "ı" yapar, ASCII olmayan bir harf yine adrese girer.

   AYNI ALGORİTMA BACKEND'DE DE VAR (backend/scripts/import-legacy.js,
   slugla). Yönetim paneli slug önerirken ve göç betiği mevcut veriyi
   aktarırken aynı başlıktan aynı adres çıkmalı; tests/slug.test.js iki
   uygulamayı aynı girdilerle karşılaştırıyor.

   Sonuç backend'deki is_slug() kısıtına uyar: ^[a-z0-9]+(-[a-z0-9]+)*$ */

const SLUG_TR_HARF = {
  'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o',
  'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u'
};

/* Adres çubuğunda uzun slug okunmuyor ve paylaşıldığında kesiliyor.
   Backend'deki sınırla aynı. */
const SLUG_EN_UZUN = 80;

function slugOlustur(metin) {
  return String(metin === undefined || metin === null ? '' : metin)
    .replace(/[çÇğĞıİöÖşŞüÜâîû]/g, h => SLUG_TR_HARF[h] || h)
    .toLowerCase()
    /* Kalan aksanlı harfler (é, ñ, ã …) harfin kendisine iner. */
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_EN_UZUN)
    /* Kesilen yer bir tirenin üstüne denk gelirse sonda tire kalmasın. */
    .replace(/-+$/g, '');
}

/* Backend'in is_slug() kısıtının aynısı. Elle girilen slug bu testten
   geçmeli; geçmiyorsa kayıt veritabanına yazılamaz. */
function slugGecerli(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(slug || ''));
}

/* Tip içinde tekil slug. Aynı başlıkla ikinci bir tur açılırsa sessizce
   üzerine yazmak yerine sonuna sayı eklenir: kapadokya-turu-2.
   mevcutlar: dizi veya Set. Sayı eklenince 80 karakter sınırı aşılmasın
   diye taban gerekirse kısaltılır. */
function benzersizSlug(taban, mevcutlar) {
  const kume = mevcutlar instanceof Set ? mevcutlar : new Set(mevcutlar || []);
  const temel = slugOlustur(taban) || 'kayit';
  if (!kume.has(temel)) return temel;
  for (let n = 2; n < 10000; n++) {
    const ek = '-' + n;
    const aday = temel.slice(0, SLUG_EN_UZUN - ek.length).replace(/-+$/g, '') + ek;
    if (!kume.has(aday)) return aday;
  }
  throw new Error('Benzersiz slug üretilemedi: ' + temel);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SLUG_TR_HARF, SLUG_EN_UZUN, slugOlustur, slugGecerli, benzersizSlug };
}
