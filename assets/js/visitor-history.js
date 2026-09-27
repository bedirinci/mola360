/* ---------------- ziyaretçi geçmişi: son aramalar, son görüntülenenler ----------------
   Kenar çubuğundaki "Son Görüntülenenler" ve arama ekranındaki "Son
   Aramalar" elle yazılmış örnek listelerdi: her ziyaretçiye aynı
   "Bursa Kültürpark Konseri"ni gösteriyordu. Artık ziyaretçinin KENDİ
   geçmişi; bu tarayıcıda tutuluyor (localStorage), sunucuya gitmiyor.

   Üye girişi geldiğinde (5. adım) aynı liste hesaba da yazılacak; o
   zaman kaynak sunucu, biçim aynı.

   Depolama kapalı ya da dolu olabilir (gizli pencere, kota): her okuma
   ve yazma korumalı; geçmiş yoksa ilgili bölüm hiç çizilmiyor.

   ADLAR: üst seviye adlar GEC_ / gec ile başlıyor. */

const GEC_ANAHTAR = { arama: 'mola360.sonAramalar', urun: 'mola360.sonGorulenler' };
const GEC_SINIR = { arama: 8, urun: 12 };

/* Depo: tarayıcıda localStorage; testte dışarıdan verilebilir. */
function gecDepo(depo) {
  if (depo) return depo;
  try {
    return (typeof localStorage !== 'undefined') ? localStorage : null;
  } catch (_) {
    return null;
  }
}

function gecOku(tur, depo) {
  const d = gecDepo(depo);
  if (!d) return [];
  try {
    const v = JSON.parse(d.getItem(GEC_ANAHTAR[tur]) || '[]');
    return Array.isArray(v) ? v : [];
  } catch (_) {
    return [];
  }
}

function gecYaz(tur, liste, depo) {
  const d = gecDepo(depo);
  if (!d) return;
  try { d.setItem(GEC_ANAHTAR[tur], JSON.stringify(liste)); } catch (_) { /* kota/kapalı */ }
}

/* Aranan metin en başa; aynısı (büyük/küçük harf farkıyla) tekrar
   eklenmez, eskisi silinir. Boş veya çok kısa arama kaydedilmez. */
function gecAramaEkle(metin, depo) {
  const m = String(metin || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  if (m.length < 2) return gecOku('arama', depo);
  const k = m.toLocaleLowerCase('tr-TR');
  const liste = [m].concat(gecOku('arama', depo).filter(x => String(x).toLocaleLowerCase('tr-TR') !== k))
    .slice(0, GEC_SINIR.arama);
  gecYaz('arama', liste, depo);
  return liste;
}

function gecAramaSil(metin, depo) {
  const k = String(metin || '').toLocaleLowerCase('tr-TR');
  const liste = gecOku('arama', depo).filter(x => String(x).toLocaleLowerCase('tr-TR') !== k);
  gecYaz('arama', liste, depo);
  return liste;
}

/* Görüntülenen ürün: { tip, slug, t } — yalnızca kimlik; ad, fiyat ve
   görsel her okumada ürünün kendi kaydından (kopya eskimesin). */
function gecUrunEkle(tip, slug, zaman, depo) {
  if (!tip || !slug) return gecOku('urun', depo);
  const liste = [{ tip, slug, t: Number(zaman) || Date.now() }]
    .concat(gecOku('urun', depo).filter(x => !(x && x.tip === tip && x.slug === slug)))
    .slice(0, GEC_SINIR.urun);
  gecYaz('urun', liste, depo);
  return liste;
}

/* Geçmişteki ürünler, hâlâ yayında olanlar (kapı null döndürürse düşer). */
function gecUrunler(kapi, adet, haric, depo) {
  if (!kapi) return [];
  return gecOku('urun', depo)
    .filter(x => x && !(haric && x.tip === haric.tip && x.slug === haric.slug))
    .map(x => kapi.urun(x.tip, x.slug))
    .filter(Boolean)
    .slice(0, Math.max(0, Number(adet) || GEC_SINIR.urun));
}

/* Tarayıcıda: ürün sayfası açıldığında (dosyası olan sayfa ya da
   yönlendiriciden açılan) geçmişe yaz. Adres veri kapısına soruluyor;
   ürün değilse bir şey yapılmıyor. Sayfanın betikleri yüklendikten sonra
   (DOMContentLoaded) çalışıyor: kapı o zaman hazır. */
function gecSayfayiKaydet() {
  if (typeof MolaVeri === 'undefined' || typeof siteMenuSimdikiYol !== 'function') return;
  const kok = (document.body && document.body.getAttribute('data-root')) || '';
  const adres = MolaVeri.adres(siteMenuSimdikiYol(kok));
  if (adres && adres.kind === 'product') gecUrunEkle(adres.type, adres.slug);
}
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', gecSayfayiKaydet);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GEC_ANAHTAR, GEC_SINIR, gecOku, gecAramaEkle, gecAramaSil, gecUrunEkle, gecUrunler };
}
