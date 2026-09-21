/* ---------------- içerik kataloğu: kayıtlardan anasayfa kartı ----------------
   Anasayfadaki her liste (şeritler, kategori sonuçları, arama ekranı)
   app.js'teki cardSections'tan besleniyor. İçerik sayfası olan bir kaydın
   (tur, otel, ileride etkinlik/aktivite/mekân) oraya ELLE yazılması iki
   sorun üretiyordu:

     1. Yeni bir sayfa yazmak iki dosyaya dokunmayı gerektiriyordu; biri
        unutulursa sayfa sitede hiçbir yerden görünmüyordu.
     2. Kartta yazan fiyat, puan ve tarih kaydın kendisinden kopyalanmıştı;
        kayıt değişince kart eskiyordu. Dosyada duran "20 Ekim, Salı" gibi
        bir tarih birkaç hafta sonra geçmiş bir günü gösteriyor.

   Bu dosya köprü: kayıtları okuyup anasayfanın kart biçimine çeviriyor ve
   cardSections'a karıştırıyor. Kartın FİYATI, PUANI, YORUM SAYISI ve
   TARİHİ kayıttan türetiliyor; elle yazılamıyor, dolayısıyla eskiyemiyor.

   Yeni bir içerik türü eklemek = KAYNAKLAR'a bir satır. Kayıt kümesi
   yüklenmemişse (o veri dosyasını yüklemeyen bir sayfa) satır sessizce
   atlanıyor.

   Kayıtlara ait olup kartta görünen ama türetilemeyen üç şey kaydın kendi
   "card" alanında durur: hangi fotoğraf (anasayfanın görsel anahtarı),
   dar karta sığan kısa ad ve rozetler. */

const KATALOG_TUR_VERI = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./tour-data.js') : null;
const KATALOG_OTEL_VERI = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./hotel-data.js') : null;

/* Tarayıcıda bu adlar genel kapsamda duruyor (dosyalar önce yükleniyor),
   Node/vitest tarafında require ile geliyor. Koşulun yalnızca bir dalı
   çalıştığı için diğer daldaki ad hiç okunmaz. */
const kAsDate     = KATALOG_TUR_VERI ? KATALOG_TUR_VERI.asDate : asDate;
const kToISODate  = KATALOG_TUR_VERI ? KATALOG_TUR_VERI.toISODate : toISODate;
const kGunlerTR   = KATALOG_TUR_VERI ? KATALOG_TUR_VERI.GUNLER_TR : GUNLER_TR;
const kAylarTR    = KATALOG_TUR_VERI ? KATALOG_TUR_VERI.AYLAR_TR : AYLAR_TR;
const kRatingOzet = KATALOG_TUR_VERI ? KATALOG_TUR_VERI.ratingSummary : ratingSummary;
const kBasePrice  = KATALOG_TUR_VERI ? KATALOG_TUR_VERI.basePrice : basePrice;
const kSonrakiKalkis = KATALOG_TUR_VERI ? KATALOG_TUR_VERI.nextDepartureDates : nextDepartureDates;
const kHotelScore   = KATALOG_OTEL_VERI ? KATALOG_OTEL_VERI.hotelScore : hotelScore;
const kOtelGecelik  = KATALOG_OTEL_VERI ? KATALOG_OTEL_VERI.hotelNightlyFrom : hotelNightlyFrom;

/* ---------------- yorum sayısı ----------------
   Kartta tam sayı yazmıyor; "1.247 değerlendirme" kart genişliğine
   sığmıyor ve o hassasiyetin kartta bir değeri de yok. Biçim mevcut
   kartlarla aynı: binden büyükse "1,2b+", küçükse onluğa yuvarlanmış
   "970+". Yuvarlama her zaman AŞAĞI: kart hiçbir zaman olduğundan fazla
   yorum olduğunu söylemiyor. */
function formatReviewCount(n) {
  const sayi = Math.max(0, Math.floor(Number(n) || 0));
  if (sayi >= 1000) {
    const bin = Math.floor(sayi / 100) / 10;
    return String(bin).replace('.', ',') + 'b+';
  }
  if (sayi >= 10) return String(Math.floor(sayi / 10) * 10) + '+';
  return String(sayi);
}

/* ---------------- tarih metni ----------------
   Kartın "En yakın / Müsait" satırı. Yakın günler gün adıyla, uzak
   günler tarihle yazılıyor — "Bu Cumartesi" 34 gün sonrası için anlamsız,
   "20 Ekim, Salı" da yarın için gereksiz. */
function cardDateText(iso, bugun) {
  const gun = kAsDate(iso);
  const bas = kAsDate(bugun) || new Date();
  if (!gun) return '';
  const fark = Math.round((gun.getTime() - kAsDate(bas).getTime()) / 86400000);
  if (fark <= 0) return 'Bugün';
  if (fark === 1) return 'Yarın';
  if (fark < 7) return 'Bu ' + kGunlerTR[gun.getDay()];
  return gun.getDate() + ' ' + kAylarTR[gun.getMonth()] + ', ' + kGunlerTR[gun.getDay()];
}

/* Kalan gün sayısı: "Yaklaşan Planlar" şeridi buna göre sıralıyor. */
function cardDaysUntil(iso, bugun) {
  const gun = kAsDate(iso);
  const bas = kAsDate(bugun) || new Date();
  if (!gun) return 0;
  return Math.max(0, Math.round((gun.getTime() - kAsDate(bas).getTime()) / 86400000));
}

/* Hafta sonu filtreleri (Bu Cuma / Bu Cumartesi / Bu Pazar) yalnızca bu
   haftanın o gününü göstermeli; iki hafta sonraki cumartesi "Bu
   Cumartesi" filtresine düşerse filtre yalan söyler. */
function cardDayKey(iso, bugun) {
  const gun = kAsDate(iso);
  if (!gun) return '';
  if (cardDaysUntil(iso, bugun) > 6) return '';
  return ({ 5: 'cuma', 6: 'cumartesi', 0: 'pazar' })[gun.getDay()] || '';
}

/* ---------------- tur kartı ---------------- */
function tourCatalogCard(tur, bugun) {
  const kart = tur.card || {};
  const puan = kRatingOzet(tur.ratingBreakdown);
  const p = tur.pricing || {};
  /* Kalkış takvimi kayıttan: kartta yazan tarih, tur sayfasındaki
     takvimin ilk seçilebilir günüyle aynı gün. */
  const kalkis = kSonrakiKalkis(bugun || new Date(), p.departureDays, 1, p.leadDays)[0] || '';
  return {
    img: kart.img,
    href: 'tur/' + tur.slug + '/',
    /* Arama sonucundaki tur etiketi: serit basligindan tahmin
       edilmesin diye kayittan geliyor. */
    type: 'Tur',
    title: kart.title || tur.title,
    badges: kart.badges || [tur.categoryShort],
    rating: String(puan.average),
    reviews: formatReviewCount(puan.total),
    meta1: kart.meta1 || (tur.area + ' · ' + tur.durationLabel),
    meta2: cardDateText(kalkis, bugun),
    priceMain: String(kBasePrice(tur)),
    inDays: cardDaysUntil(kalkis, bugun),
    dayKey: cardDayKey(kalkis, bugun)
  };
}

/* ---------------- otel kartı ----------------
   Otelde puan 10 üzerinden ve yorum dağılımından türetiliyor; kartta da
   aynı sayı görünüyor (hotelScore).

   "Müsait" tarihi otelin kendi kuralından geliyor: aynı gün giriş
   satılmadığı için en erken giriş yarın. Kart elle yazılıyken orada
   "Bugün" yazıyordu ve otel sayfasındaki takvimle çelişiyordu. */
function hotelCatalogCard(otel, bugun) {
  const kart = otel.card || {};
  const puan = kRatingOzet(otel.ratingBreakdown);
  const p = otel.pricing || {};
  const bas = kAsDate(bugun) || new Date();
  const ilkGiris = kToISODate(new Date(bas.getFullYear(), bas.getMonth(),
    bas.getDate() + Math.max(0, Math.round(Number(p.leadDays) || 0))));
  return {
    img: kart.img,
    href: 'otel/' + otel.slug + '/',
    type: 'Otel',
    title: kart.title || otel.title,
    badges: kart.badges || [otel.categoryShort],
    rating: String(kHotelScore(otel.ratingBreakdown)),
    reviews: formatReviewCount(puan.total),
    meta1: kart.meta1 || (otel.area + ' · ' + otel.distanceLabel),
    meta2: cardDateText(ilkGiris, bugun),
    priceMain: String(kOtelGecelik(otel)),
    unit: '/gece'
  };
}

/* ---------------- kaynak kütüğü ----------------
   Yeni içerik türü eklemek buraya bir satır:

     { anchor: 'etkinlikler', kayitlar: () => EVENTS, kart: eventCatalogCard }

   anchor  anasayfadaki şeridin çapası (app.js/cardSections)
   kayitlar  kayıt nesnesini döndürür; yüklü değilse satır atlanır
   filtre  aynı kümeden yalnızca bazı kayıtlar bu şeride giriyorsa
   kart    kaydı anasayfa kartına çeviren saf fonksiyon

   Aynı kayıt birden fazla şeride girebilir: turlar hem kendi
   kategorisinde hem "Yaklaşan Planlar"da görünüyor. */
const KATALOG_KAYNAKLARI = [
  {
    anchor: 'turlar',
    kayitlar: () => (typeof TOURS !== 'undefined' ? TOURS : (KATALOG_TUR_VERI && KATALOG_TUR_VERI.TOURS)),
    filtre: (t) => t.type === 'daily',
    kart: tourCatalogCard
  },
  {
    anchor: 'konaklamali-turlar',
    kayitlar: () => (typeof TOURS !== 'undefined' ? TOURS : (KATALOG_TUR_VERI && KATALOG_TUR_VERI.TOURS)),
    filtre: (t) => t.type === 'stay',
    kart: tourCatalogCard
  },
  {
    anchor: 'oteller',
    kayitlar: () => (typeof HOTELS !== 'undefined' ? HOTELS : (KATALOG_OTEL_VERI && KATALOG_OTEL_VERI.HOTELS)),
    kart: hotelCatalogCard
  },
  {
    /* Tarihi olan her içerik buraya da girer: şerit "yaklaşan" olanı
       gösteriyor, türünü değil. Otelin sabit bir tarihi olmadığı için
       otel kayıtları burada yok. */
    anchor: 'yaklasan-planlar',
    kayitlar: () => (typeof TOURS !== 'undefined' ? TOURS : (KATALOG_TUR_VERI && KATALOG_TUR_VERI.TOURS)),
    kart: tourCatalogCard
  }
];

/* Bir şeride giren türetilmiş kartlar. Kayıt kümesi yüklü değilse boş
   dizi döner — katalogu yüklemeyen sayfalar (tur/otel içerik sayfaları
   app.js'i yüklüyor) bundan etkilenmez. */
function catalogCards(anchor, bugun) {
  const out = [];
  KATALOG_KAYNAKLARI.filter(k => k.anchor === anchor).forEach(kaynak => {
    const kayitlar = kaynak.kayitlar();
    if (!kayitlar) return;
    Object.keys(kayitlar).forEach(slug => {
      const kayit = kayitlar[slug];
      if (kaynak.filtre && !kaynak.filtre(kayit)) return;
      out.push(kaynak.kart(kayit, bugun));
    });
  });
  return out;
}

/* Türetilmiş kartların tamamı: arama ve testler için. */
function catalogAllCards(bugun) {
  const gorulen = new Set();
  const out = [];
  KATALOG_KAYNAKLARI.forEach(kaynak => {
    catalogCards(kaynak.anchor, bugun).forEach(kart => {
      if (gorulen.has(kart.href)) return;
      gorulen.add(kart.href);
      out.push(kart);
    });
  });
  return out;
}

function katalogBaslikAnahtari(metin) {
  return String(metin || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

/* ---------------- birleştirme ----------------
   Türetilmiş kartlar şeridin BAŞINA geliyor: içerik sayfası olan kayıt,
   sayfası olmayan örnek kartın önünde durmalı.

   Elle yazılmış bir kart aynı adresi ya da aynı başlığı taşıyorsa
   düşüyor. Bu bir güvenlik ağı: aynı otel iki kez görünmesin diye elle
   yazılmış satırın silinmesini beklemek yerine, kopya burada eleniyor. */
function mergeCatalogCards(sections, bugun) {
  (Array.isArray(sections) ? sections : []).forEach(sec => {
    const turetilen = catalogCards(sec.anchor, bugun);
    if (!turetilen.length) return;
    const adresler = new Set(turetilen.map(k => k.href));
    const basliklar = new Set(turetilen.map(k => katalogBaslikAnahtari(k.title)));
    const elle = (sec.items || []).filter(it =>
      !adresler.has(it.href) && !basliklar.has(katalogBaslikAnahtari(it.title)));
    sec.items = turetilen.concat(elle);
  });
  return sections;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    KATALOG_KAYNAKLARI,
    formatReviewCount,
    cardDateText,
    cardDaysUntil,
    cardDayKey,
    tourCatalogCard,
    hotelCatalogCard,
    catalogCards,
    catalogAllCards,
    mergeCatalogCards
  };
}
