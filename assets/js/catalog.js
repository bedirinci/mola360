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
const KATALOG_AKTIVITE_VERI = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./activity-data.js') : null;
const KATALOG_ETKINLIK_VERI = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./event-data.js') : null;
const KATALOG_MEKAN_VERI = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./venue-data.js') : null;

/* Yardımcılar Node'da require'dan, tarayıcıda genel kapsamdan gelir.

   ÖNEMLİ: arama TEMBEL ve KORUMALI. İlk sürümde adlar dosyanın en
   üstünde `const x = MODUL ? MODUL.x : globalAd` biçiminde çözülüyordu
   ve o satır, veri dosyası yüklenmemiş bir sayfada ReferenceError
   atıyordu. Sonuç: eksik olan tek bir veri dosyası yüzünden catalog.js
   yüklenirken ölüyor ve anasayfadaki TÜM türetilmiş kartlar birden
   kayboluyordu -- tarayıcıda tam olarak bu görüldü
   ("activityPriceFrom is not defined").

   Artık ad çözülemezse null dönüyor; o kaynağın kayıtları da zaten
   yüklü olmadığı için satır sessizce atlanıyor ve diğer türler
   çalışmaya devam ediyor. tests/katalog.test.js bunu eksik dosyayla
   ölçüyor. */
function katalogYardimci(ad, modul, yerel) {
  if (modul && typeof modul[ad] === 'function') return modul[ad];
  if (typeof yerel === 'function') return yerel;
  /* Fonksiyon BİLDİRİMLERİ (function x(){}) tarayıcıda globalThis'e
     yazılır; son çare olarak oraya da bakılıyor. */
  const kapsam = (typeof globalThis !== 'undefined') ? globalThis : null;
  const genel = kapsam ? kapsam[ad] : undefined;
  return typeof genel === 'function' ? genel : null;
}

/* Yardımcılar Node'da require'dan, tarayıcıda ÜST KAPSAMDAN gelir ve
   ikisi de ÇAĞRI ANINDA çözülür.

   İki hata bu satırların altında yatıyordu ve ikisi de tarayıcıda
   görüldü:

   1. Adlar dosyanın en üstünde çözülüyordu ve veri dosyası yüklenmemiş
      bir sayfada ReferenceError atıyordu: catalog.js yüklenirken ölüyor,
      eksik olan tek türün değil BÜTÜN kartların hepsi birden
      kayboluyordu.
   2. Düzeltme globalThis üzerinden arıyordu. Ama `const` ile tanımlanmış
      bir ad globalThis'te DURMAZ (yalnızca function bildirimleri durur);
      GUNLER_TR ve AYLAR_TR bulunamayınca kart tarihi "Bu undefined"
      yazdı.

   Çözüm ikisini de kapatıyor: doğrudan ad, ama `typeof` ile korunmuş.
   typeof tanımsız bir ad için hata atmaz, "undefined" döner. */
function kAsDate(v) {
  const f = katalogYardimci('asDate', KATALOG_TUR_VERI, typeof asDate !== 'undefined' ? asDate : null);
  return f ? f(v) : null;
}
function kToISODate(v) {
  const f = katalogYardimci('toISODate', KATALOG_TUR_VERI, typeof toISODate !== 'undefined' ? toISODate : null);
  return f ? f(v) : '';
}
function kRatingOzet(v) {
  const f = katalogYardimci('ratingSummary', KATALOG_TUR_VERI, typeof ratingSummary !== 'undefined' ? ratingSummary : null);
  return f ? f(v) : { total: 0, average: 0, rows: [] };
}
function kBasePrice(v) {
  const f = katalogYardimci('basePrice', KATALOG_TUR_VERI, typeof basePrice !== 'undefined' ? basePrice : null);
  return f ? f(v) : 0;
}
function kSonrakiKalkis(a, b, c, d) {
  const f = katalogYardimci('nextDepartureDates', KATALOG_TUR_VERI,
    typeof nextDepartureDates !== 'undefined' ? nextDepartureDates : null);
  return f ? f(a, b, c, d) : [];
}
function kGunlerTR() {
  if (KATALOG_TUR_VERI && KATALOG_TUR_VERI.GUNLER_TR) return KATALOG_TUR_VERI.GUNLER_TR;
  return (typeof GUNLER_TR !== 'undefined' && GUNLER_TR) ? GUNLER_TR : [];
}
function kAylarTR() {
  if (KATALOG_TUR_VERI && KATALOG_TUR_VERI.AYLAR_TR) return KATALOG_TUR_VERI.AYLAR_TR;
  return (typeof AYLAR_TR !== 'undefined' && AYLAR_TR) ? AYLAR_TR : [];
}

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
  if (fark < 7) return 'Bu ' + kGunlerTR()[gun.getDay()];
  return gun.getDate() + ' ' + kAylarTR()[gun.getMonth()] + ', ' + kGunlerTR()[gun.getDay()];
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
    rating: String(katalogYardimci('hotelScore', KATALOG_OTEL_VERI, typeof hotelScore !== 'undefined' ? hotelScore : null)(otel.ratingBreakdown)),
    reviews: formatReviewCount(puan.total),
    meta1: kart.meta1 || (otel.area + ' · ' + otel.distanceLabel),
    meta2: cardDateText(ilkGiris, bugun),
    priceMain: String(katalogYardimci('hotelNightlyFrom', KATALOG_OTEL_VERI, typeof hotelNightlyFrom !== 'undefined' ? hotelNightlyFrom : null)(otel)),
    unit: '/gece'
  };
}

/* ---------------- aktivite kartı ----------------
   Aktivitenin sabit bir kalkış tarihi yok: her sabah yapılıyor. Kartta
   yazan tarih bu yüzden ilk SATILABİLİR günden geliyor (aynı gün
   satılmıyorsa yarın), otel kartındaki müsaitlik tarihiyle aynı mantık.

   sponsored, kaydın card alanından geçiyor: sponsorluk ticari bir
   anlaşma, türetilecek bir şey değil. */
function activityCatalogCard(aktivite, bugun) {
  const kart = aktivite.card || {};
  const puan = kRatingOzet(aktivite.ratingBreakdown);
  const p = aktivite.pricing || {};
  const bas = kAsDate(bugun) || new Date();
  const ilkGun = kToISODate(new Date(bas.getFullYear(), bas.getMonth(),
    bas.getDate() + Math.max(0, Math.round(Number(p.leadDays) || 0))));
  return {
    img: kart.img,
    href: 'aktivite/' + aktivite.slug + '/',
    type: 'Aktivite',
    title: kart.title || aktivite.title,
    badges: kart.badges || [aktivite.categoryShort],
    rating: String(puan.average),
    reviews: formatReviewCount(puan.total),
    meta1: kart.meta1 || (aktivite.area + ' · ' + aktivite.durationLabel),
    meta2: cardDateText(ilkGun, bugun),
    priceMain: String(katalogYardimci('activityPriceFrom', KATALOG_AKTIVITE_VERI, typeof activityPriceFrom !== 'undefined' ? activityPriceFrom : null)(aktivite)),
    sponsored: !!kart.sponsored
  };
}

/* ---------------- etkinlik kartı ----------------
   Etkinliğin diğer üç türden farkı: sabit temsil tarihleri var ve
   biterler. Karttaki tarih TEMSİL TAKVİMİNDEN geliyor.

   SEZONU BİTEN ETKİNLİK KART ÜRETMİYOR (null dönüyor): geçmiş bir
   festivali "yaklaşan" diye anasayfada tutmak, elle yazılmış kartların
   düştüğü tuzağın ta kendisi olurdu. catalogCards null kartı atlıyor. */
function eventCatalogCard(etkinlik, bugun) {
  const sonraki = katalogYardimci('nextPerformance', KATALOG_ETKINLIK_VERI, typeof nextPerformance !== 'undefined' ? nextPerformance : null)(etkinlik, bugun);
  if (!sonraki) return null;

  const kart = etkinlik.card || {};
  const puan = kRatingOzet(etkinlik.ratingBreakdown);
  return {
    img: kart.img,
    href: 'etkinlik/' + etkinlik.slug + '/',
    type: 'Etkinlik',
    title: kart.title || etkinlik.title,
    badges: kart.badges || [etkinlik.categoryShort],
    rating: String(puan.average),
    reviews: formatReviewCount(puan.total),
    meta1: kart.meta1 || (etkinlik.venueName + ' · ' + etkinlik.area),
    meta2: cardDateText(sonraki.date, bugun),
    priceMain: String(katalogYardimci('eventPriceFrom', KATALOG_ETKINLIK_VERI, typeof eventPriceFrom !== 'undefined' ? eventPriceFrom : null)(etkinlik)),
    inDays: cardDaysUntil(sonraki.date, bugun),
    dayKey: cardDayKey(sonraki.date, bugun),
    sponsored: !!kart.sponsored
  };
}

/* ---------------- mekân kartı ----------------
   Mekânın diğer dört türden farkı: bir TARİHİ yok, bir YERİ var. Kartta
   tarih yerine "şu an açık mı" yazıyor ve o bilgi saate göre değişiyor.

   Mekân kartı anasayfada iki ayrı yerde kullanılıyor: kategori
   sonuçları/arama için standart kart alanları (title, meta1,
   priceMain), "Mekanlar" bloğu için de o bloğun kendi alanları (type,
   area, hours, open). İkisi de aynı nesnede; blok hangisini okuyorsa
   onu kullanıyor. */
function venueCatalogCard(mekan, bugun) {
  const kart = mekan.card || {};
  const puan = kRatingOzet(mekan.ratingBreakdown);
  const durumFn = katalogYardimci('venueOpenNow', KATALOG_MEKAN_VERI,
    typeof venueOpenNow !== 'undefined' ? venueOpenNow : null);
  const fiyatFn = katalogYardimci('venuePriceFrom', KATALOG_MEKAN_VERI,
    typeof venuePriceFrom !== 'undefined' ? venuePriceFrom : null);
  /* Kart "şu anı" gösteriyor: bugun parametresi testlerin sabit bir an
     verebilmesi için, verilmezse gerçek zaman. */
  const an = (bugun instanceof Date) ? bugun : (kAsDate(bugun) || new Date());
  const durum = durumFn ? durumFn(mekan, an) : { open: false, text: '' };

  return {
    img: kart.img,
    href: 'mekan/' + mekan.slug + '/',
    type: 'Mekan',
    title: kart.title || mekan.title,
    badges: kart.badges || [mekan.categoryShort],
    rating: String(puan.average),
    reviews: formatReviewCount(puan.total),
    meta1: kart.meta1 || (mekan.area + ' · ' + mekan.kindLabel),
    meta2: durum.open ? 'Şu an açık' : (durum.text || 'Şu an kapalı'),
    priceMain: String(fiyatFn ? fiyatFn(mekan) : 0),
    /* "Mekanlar" bloğunun kendi kart alanları. */
    venueType: mekan.kindLabel,
    area: mekan.area,
    hours: durum.open ? ('Açık · ' + durum.text) : (durum.text || 'Kapalı'),
    open: !!durum.open
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
    /* Mekân "Yaklaşan Planlar"a girmiyor: yaklaşan bir tarihi yok,
       kapısı açık. Otel ve aktivite gibi. */
    anchor: 'mekanlar',
    kayitlar: () => (typeof PLACES !== 'undefined' ? PLACES : (KATALOG_MEKAN_VERI && KATALOG_MEKAN_VERI.PLACES)),
    kart: venueCatalogCard
  },
  {
    anchor: 'etkinlikler',
    kayitlar: () => (typeof EVENTS !== 'undefined' ? EVENTS : (KATALOG_ETKINLIK_VERI && KATALOG_ETKINLIK_VERI.EVENTS)),
    kart: eventCatalogCard
  },
  {
    anchor: 'aktiviteler',
    kayitlar: () => (typeof ACTIVITIES !== 'undefined' ? ACTIVITIES : (KATALOG_AKTIVITE_VERI && KATALOG_AKTIVITE_VERI.ACTIVITIES)),
    kart: activityCatalogCard
  },
  {
    /* Tarihi olan her içerik buraya da girer: şerit "yaklaşan" olanı
       gösteriyor, türünü değil. Otelin ve aktivitenin sabit bir tarihi
       olmadığı için (biri her gün açık, diğeri her sabah yapılıyor)
       onların kayıtları burada yok; etkinliğin sayılı temsilleri var,
       o yüzden burada. */
    anchor: 'yaklasan-planlar',
    kayitlar: () => (typeof TOURS !== 'undefined' ? TOURS : (KATALOG_TUR_VERI && KATALOG_TUR_VERI.TOURS)),
    kart: tourCatalogCard
  },
  {
    anchor: 'yaklasan-planlar',
    kayitlar: () => (typeof EVENTS !== 'undefined' ? EVENTS : (KATALOG_ETKINLIK_VERI && KATALOG_ETKINLIK_VERI.EVENTS)),
    kart: eventCatalogCard
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
      /* Kart üretici null dönebilir: sezonu bitmiş bir etkinlik
         anasayfada görünmemeli. */
      const kart = kaynak.kart(kayit, bugun);
      if (kart) out.push(kart);
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
    katalogYardimci,
    formatReviewCount,
    cardDateText,
    cardDaysUntil,
    cardDayKey,
    tourCatalogCard,
    hotelCatalogCard,
    activityCatalogCard,
    eventCatalogCard,
    venueCatalogCard,
    catalogCards,
    catalogAllCards,
    mergeCatalogCards
  };
}
