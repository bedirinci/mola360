/* ---------------- yönetim paneli: veri katmanı ----------------
   /admin/ sayfasının BÜTÜN mantığı burada durur; admin-page.js yalnızca
   bu modülün ürettiğini ekrana çizer. Sayfada görünen hiçbir sayı
   admin-page.js'in içinde hesaplanmaz — kural site genelinde aynı
   (docs/tur-sayfasi.md, docs/otel-sayfasi.md).

   PANELİN TEMEL KURALI: panel kendi veri kopyasını TUTMAZ.

   Her sayı, her liste, her rozet sitenin yayındaki veri dosyalarından
   (tour-data.js, hotel-data.js, activity-data.js, event-data.js,
   venue-data.js) okunur ve kartı üreten fonksiyonlar catalog.js'ten
   alınır. Panelde gördüğünüz fiyat, ziyaretçinin anasayfada gördüğü
   fiyatla AYNI FONKSİYONDAN geliyor; ikisi ayrışamaz. Paneli ayrı bir
   veritabanıyla kursaydık, sitenin gösterdiği ile panelin gösterdiği
   kaçınılmaz olarak ayrışırdı — docs/icerik-katalogu.md'de anlatılan
   "kart eskiyor" sorununun aynısı, bu kez yönetim tarafında.

   YAZMA İŞİ: site statik (GitHub Pages), arka uç yok. Tarayıcı depoya
   dosya yazamaz. Bu yüzden düzenleme TASLAK olarak localStorage'da
   durur ve panel "dışa aktar" ile veri dosyasına yapıştırılmaya hazır
   bir JS bloğu üretir. Arka uç geldiğinde değişmesi gereken tek yer
   adminTaslak* fonksiyonları; okuma ve denetim katmanı olduğu gibi
   kalır. */

/* Node (vitest) tarafında modüller require ile gelir; tarayıcıda veri
   dosyaları paneleden ÖNCE yüklendiği için aynı adlar zaten tanımlı.
   Koşulun yalnızca BİR dalı çalıştığı için diğer daldaki ad hiç okunmaz. */
const ADMIN_MOD = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? {
      tur: require('./tour-data.js'),
      otel: require('./hotel-data.js'),
      aktivite: require('./activity-data.js'),
      etkinlik: require('./event-data.js'),
      mekan: require('./venue-data.js'),
      katalog: require('./catalog.js')
    }
  : null;

/* Ad çözümü TEMBEL ve KORUMALI — catalog.js'teki ile aynı gerekçe:
   `const` ile tanımlanmış bir ad tarayıcıda globalThis'te DURMAZ, bu
   yüzden bare ad `typeof` ile korunarak okunur. typeof tanımsız bir ad
   için hata atmaz. Çözülemeyen ad null döner; çağıran taraf onu
   "bu tür yüklü değil" diye okur ve o satırı sessizce atlar. */
function aFn(modAd, ad, yerel) {
  if (ADMIN_MOD && ADMIN_MOD[modAd] && typeof ADMIN_MOD[modAd][ad] === 'function') {
    return ADMIN_MOD[modAd][ad];
  }
  return typeof yerel === 'function' ? yerel : null;
}
function aVeri(modAd, ad, yerel) {
  if (ADMIN_MOD && ADMIN_MOD[modAd] && ADMIN_MOD[modAd][ad]) return ADMIN_MOD[modAd][ad];
  return yerel || null;
}
function aCagir(fn, ...arg) { return fn ? fn(...arg) : null; }

/* ---------------- tür tanımları ----------------
   Panele yeni bir içerik türü eklemek = buraya bir satır. Listeler,
   istatistikler, denetim ve düzenleyici hepsi bu diziden besleniyor;
   hiçbiri türleri ayrıca saymıyor.

   dizin  içerik sayfasının adres kökü (/otel/<slug>/)
   renk   panelde türü ayırt eden nokta rengi
   puan10 otelde puan 10 üzerinden gösterilir (hotelScore), diğerlerinde
          yorum ortalaması 5 üzerinden — sitedeki gösterimin aynısı. */
const ADMIN_TURLER = [
  {
    key: 'tur',
    tekil: 'Tur',
    cogul: 'Turlar',
    dizin: 'tur',
    veriDosyasi: 'assets/js/tour-data.js',
    degisken: 'TOURS',
    ikon: 'compass',
    renk: '#8CC63F',
    puan10: false,
    birim: 'kişi başı',
    kayitlar: () => aVeri('tur', 'TOURS', typeof TOURS !== 'undefined' ? TOURS : null),
    gorseller: () => aVeri('tur', 'TOUR_IMAGE_FILES', typeof TOUR_IMAGE_FILES !== 'undefined' ? TOUR_IMAGE_FILES : null),
    fiyat: (k) => aCagir(aFn('tur', 'basePrice', typeof basePrice !== 'undefined' ? basePrice : null), k),
    listeFiyat: (k) => aCagir(aFn('tur', 'baseListPrice', typeof baseListPrice !== 'undefined' ? baseListPrice : null), k),
    kart: (k, bugun) => aCagir(aFn('katalog', 'tourCatalogCard', typeof tourCatalogCard !== 'undefined' ? tourCatalogCard : null), k, bugun),
    /* Günübirlik ve konaklamalı tur aynı dosyada, ayrı fiyat alanları. */
    fiyatTablosu: (k) => (k && k.type === 'stay')
      ? { tip: 'duz', etiket: 'Kişi başı fiyat', alanlar: [
          { yol: 'pricing.perPerson', etiket: 'Kişi başı', tip: 'sayi' },
          { yol: 'pricing.perPersonList', etiket: 'Liste fiyatı', tip: 'sayi' }
        ] }
      : { tip: 'duz', etiket: 'Kişi başı fiyat', alanlar: [
          { yol: 'pricing.adult', etiket: 'Yetişkin', tip: 'sayi' },
          { yol: 'pricing.adultList', etiket: 'Yetişkin liste', tip: 'sayi' },
          { yol: 'pricing.child', etiket: 'Çocuk', tip: 'sayi' },
          { yol: 'pricing.childList', etiket: 'Çocuk liste', tip: 'sayi' }
        ] }
  },
  {
    key: 'otel',
    tekil: 'Otel',
    cogul: 'Oteller',
    dizin: 'otel',
    veriDosyasi: 'assets/js/hotel-data.js',
    degisken: 'HOTELS',
    ikon: 'home',
    renk: '#3E7BFA',
    puan10: true,
    birim: '/gece',
    kayitlar: () => aVeri('otel', 'HOTELS', typeof HOTELS !== 'undefined' ? HOTELS : null),
    gorseller: () => aVeri('otel', 'HOTEL_IMAGE_FILES', typeof HOTEL_IMAGE_FILES !== 'undefined' ? HOTEL_IMAGE_FILES : null),
    fiyat: (k) => aCagir(aFn('otel', 'hotelNightlyFrom', typeof hotelNightlyFrom !== 'undefined' ? hotelNightlyFrom : null), k),
    listeFiyat: (k) => aCagir(aFn('otel', 'hotelNightlyListFrom', typeof hotelNightlyListFrom !== 'undefined' ? hotelNightlyListFrom : null), k),
    puan: (k) => aCagir(aFn('otel', 'hotelScore', typeof hotelScore !== 'undefined' ? hotelScore : null), k.ratingBreakdown),
    kart: (k, bugun) => aCagir(aFn('katalog', 'hotelCatalogCard', typeof hotelCatalogCard !== 'undefined' ? hotelCatalogCard : null), k, bugun),
    fiyatTablosu: () => ({ tip: 'liste', yol: 'rooms', etiket: 'Oda tipleri', ad: 'name', alanlar: [
      { ad: 'nightly', etiket: 'Gecelik', tip: 'sayi' },
      { ad: 'nightlyList', etiket: 'Liste', tip: 'sayi' },
      { ad: 'count', etiket: 'Oda adedi', tip: 'sayi' },
      { ad: 'maxGuests', etiket: 'Kapasite', tip: 'sayi' }
    ] })
  },
  {
    key: 'aktivite',
    tekil: 'Aktivite',
    cogul: 'Aktiviteler',
    dizin: 'aktivite',
    veriDosyasi: 'assets/js/activity-data.js',
    degisken: 'ACTIVITIES',
    ikon: 'activity',
    renk: '#FF8A3D',
    puan10: false,
    birim: 'kişi başı',
    kayitlar: () => aVeri('aktivite', 'ACTIVITIES', typeof ACTIVITIES !== 'undefined' ? ACTIVITIES : null),
    gorseller: () => aVeri('aktivite', 'ACTIVITY_IMAGE_FILES', typeof ACTIVITY_IMAGE_FILES !== 'undefined' ? ACTIVITY_IMAGE_FILES : null),
    fiyat: (k) => aCagir(aFn('aktivite', 'activityPriceFrom', typeof activityPriceFrom !== 'undefined' ? activityPriceFrom : null), k),
    listeFiyat: (k) => aCagir(aFn('aktivite', 'activityListPriceFrom', typeof activityListPriceFrom !== 'undefined' ? activityListPriceFrom : null), k),
    kart: (k, bugun) => aCagir(aFn('katalog', 'activityCatalogCard', typeof activityCatalogCard !== 'undefined' ? activityCatalogCard : null), k, bugun),
    fiyatTablosu: () => ({ tip: 'liste', yol: 'packages', etiket: 'Paketler', ad: 'name', alanlar: [
      { ad: 'perPerson', etiket: 'Kişi başı', tip: 'sayi' },
      { ad: 'perPersonList', etiket: 'Liste', tip: 'sayi' }
    ] })
  },
  {
    key: 'etkinlik',
    tekil: 'Etkinlik',
    cogul: 'Etkinlikler',
    dizin: 'etkinlik',
    veriDosyasi: 'assets/js/event-data.js',
    degisken: 'EVENTS',
    ikon: 'ticket',
    renk: '#B457F5',
    puan10: false,
    birim: 'bilet başı',
    kayitlar: () => aVeri('etkinlik', 'EVENTS', typeof EVENTS !== 'undefined' ? EVENTS : null),
    gorseller: () => aVeri('etkinlik', 'EVENT_IMAGE_FILES', typeof EVENT_IMAGE_FILES !== 'undefined' ? EVENT_IMAGE_FILES : null),
    fiyat: (k) => aCagir(aFn('etkinlik', 'eventPriceFrom', typeof eventPriceFrom !== 'undefined' ? eventPriceFrom : null), k),
    listeFiyat: (k) => aCagir(aFn('etkinlik', 'eventListPriceFrom', typeof eventListPriceFrom !== 'undefined' ? eventListPriceFrom : null), k),
    kart: (k, bugun) => aCagir(aFn('katalog', 'eventCatalogCard', typeof eventCatalogCard !== 'undefined' ? eventCatalogCard : null), k, bugun),
    fiyatTablosu: () => ({ tip: 'liste', yol: 'categories', etiket: 'Bilet kategorileri', ad: 'name', alanlar: [
      { ad: 'price', etiket: 'Fiyat', tip: 'sayi' },
      { ad: 'priceList', etiket: 'Liste', tip: 'sayi' },
      { ad: 'seats', etiket: 'Koltuk', tip: 'sayi' }
    ] })
  },
  {
    key: 'mekan',
    tekil: 'Mekan',
    cogul: 'Mekanlar',
    dizin: 'mekan',
    veriDosyasi: 'assets/js/venue-data.js',
    degisken: 'PLACES',
    ikon: 'mapPin',
    renk: '#00B3A4',
    puan10: false,
    birim: '',
    kayitlar: () => aVeri('mekan', 'PLACES', typeof PLACES !== 'undefined' ? PLACES : null),
    gorseller: () => aVeri('mekan', 'VENUE_IMAGE_FILES', typeof VENUE_IMAGE_FILES !== 'undefined' ? VENUE_IMAGE_FILES : null),
    fiyat: (k) => aCagir(aFn('mekan', 'venuePriceFrom', typeof venuePriceFrom !== 'undefined' ? venuePriceFrom : null), k),
    listeFiyat: () => 0,
    birimMetni: (k) => aCagir(aFn('mekan', 'venuePriceUnit', typeof venuePriceUnit !== 'undefined' ? venuePriceUnit : null), k) || '',
    kart: (k, bugun) => aCagir(aFn('katalog', 'venueCatalogCard', typeof venueCatalogCard !== 'undefined' ? venueCatalogCard : null), k, bugun),
    /* Mekânda fiyat tablosu rezervasyon biçimine göre değişiyor:
       randevuda hizmetler (price), masada alanlar (minSpend). Tek bir
       sabit yol yazılsaydı biri boş görünürdü. */
    fiyatTablosu: (k) => (k && k.booking === 'randevu')
      ? { tip: 'liste', yol: 'services', etiket: 'Hizmetler', ad: 'name', alanlar: [
          { ad: 'price', etiket: 'Fiyat', tip: 'sayi' },
          { ad: 'priceList', etiket: 'Liste', tip: 'sayi' },
          { ad: 'count', etiket: 'Kapasite', tip: 'sayi' }
        ] }
      : { tip: 'liste', yol: 'areas', etiket: 'Alanlar', ad: 'name', alanlar: [
          { ad: 'minSpend', etiket: 'Masada en az', tip: 'sayi' },
          { ad: 'deposit', etiket: 'Kapora', tip: 'sayi' },
          { ad: 'count', etiket: 'Adet', tip: 'sayi' }
        ] }
  }
];

function adminTur(key) {
  for (let i = 0; i < ADMIN_TURLER.length; i++) {
    if (ADMIN_TURLER[i].key === key) return ADMIN_TURLER[i];
  }
  return null;
}

/* ---------------- ortak yardımcılar ---------------- */
function adminRatingOzet(kirilim) {
  const f = aFn('tur', 'ratingSummary', typeof ratingSummary !== 'undefined' ? ratingSummary : null);
  return f ? f(kirilim) : { total: 0, average: 0, rows: [] };
}
function adminParaTR(n) {
  const f = aFn('tur', 'formatTRY', typeof formatTRY !== 'undefined' ? formatTRY : null);
  return f ? f(n) : String(n);
}
function adminSayiTR(n) {
  const f = aFn('tur', 'formatNumberTR', typeof formatNumberTR !== 'undefined' ? formatNumberTR : null);
  return f ? f(n) : String(n);
}
function adminIkonlar() {
  return aVeri('tur', 'TOUR_ICONS', typeof TOUR_ICONS !== 'undefined' ? TOUR_ICONS : null) || {};
}

/* Kelime sayısı: SEO kararı 130–170 kelimelik pasajlara dayanıyor
   (docs/seo-arastirma.md madde 2), denetim o bandı ölçüyor. */
function adminKelimeSayisi(metin) {
  return String(metin || '').trim().split(/\s+/).filter(Boolean).length;
}

/* İndirim yüzdesi tek yerde: listede, kartta ve denetimde aynı sayı. */
function adminIndirim(fiyat, liste) {
  const f = Number(fiyat) || 0;
  const l = Number(liste) || 0;
  if (!f || !l || l <= f) return 0;
  return Math.round(((l - f) / l) * 100);
}

/* ---------------- kayıt listesi ----------------
   Beş ayrı biçimdeki kaydı panelin tek satır biçimine indiriyor. Liste,
   arama, istatistik ve denetim hep bu biçimi okuyor; hiçbiri ham kaydın
   içine ayrıca dalmıyor. Ham kayıt `ham` altında duruyor: düzenleyici
   ve dışa aktarma onu kullanıyor. */
function adminKayitlar(bugun) {
  const out = [];
  ADMIN_TURLER.forEach(tur => {
    const kume = tur.kayitlar();
    if (!kume) return;               /* o veri dosyası yüklü değil: atla */
    Object.keys(kume).forEach(anahtar => {
      const k = kume[anahtar];
      if (!k) return;
      out.push(adminKayitSatiri(tur, anahtar, k, bugun));
    });
  });
  return out;
}

function adminKayitSatiri(tur, anahtar, k, bugun) {
  const ozet = adminRatingOzet(k.ratingBreakdown);
  const fiyat = Number(tur.fiyat(k)) || 0;
  const liste = Number(tur.listeFiyat ? tur.listeFiyat(k) : 0) || 0;
  let kart = null;
  try { kart = tur.kart(k, bugun); } catch (_) { kart = null; }

  return {
    tur: tur.key,
    turTekil: tur.tekil,
    turCogul: tur.cogul,
    renk: tur.renk,
    anahtar: anahtar,
    slug: k.slug || anahtar,
    baslik: k.title || '',
    ozetCumle: k.tagline || '',
    kategori: k.category || '',
    kategoriKisa: k.categoryShort || '',
    alan: k.area || '',
    bolge: k.region || '',
    kod: k.code || '',
    adres: tur.dizin + '/' + (k.slug || anahtar) + '/',
    fiyat: fiyat,
    listeFiyat: liste,
    indirim: adminIndirim(fiyat, liste),
    birim: tur.birimMetni ? tur.birimMetni(k) : tur.birim,
    /* Sitede görünen puan: otelde 10, diğerlerinde 5 üzerinden. */
    puan: tur.puan ? (Number(tur.puan(k)) || 0) : ozet.average,
    puanOlcek: tur.puan10 ? 10 : 5,
    /* Sıralama her türde aynı ölçekle yapılsın diye 5'lik ortalama da
       tutuluyor — 9,2 ile 4,6 aynı sütunda yan yana sıralanamaz. */
    puan5: ozet.average,
    yorumSayisi: ozet.total,
    etiketler: Array.isArray(k.tags) ? k.tags.slice() : [],
    kartGorseli: (k.card && k.card.img) || '',
    kart: kart,
    sayilar: {
      galeri: (k.gallery || []).length,
      oneCikan: (k.highlights || []).length,
      paragraf: (k.description || []).length,
      kelime: (k.description || []).reduce((t, p) => t + adminKelimeSayisi(p), 0),
      sss: (k.faq || []).length,
      yorum: (k.reviews || []).length,
      rozet: (k.badges || []).length,
      kunye: (k.facts || []).length,
      ekHizmet: (k.addons || []).length,
      benzer: (k.similar || []).length,
      etiket: (k.tags || []).length
    },
    ham: k
  };
}

/* ---------------- arama ve süzme ----------------
   Arama Türkçe'ye duyarlı küçültme yapıyor: "İZMİR" yazan da "izmir"
   yazan da aynı kaydı buluyor. toLowerCase() tek başına 'I' harfini
   yanlış küçültür ve İzmir aramasını boş döndürürdü. */
function adminNormalize(metin) {
  return String(metin || '').toLocaleLowerCase('tr-TR').trim();
}

function adminEslesiyorMu(kayit, q) {
  const terim = adminNormalize(q);
  if (!terim) return true;
  const havuz = [kayit.baslik, kayit.slug, kayit.kod, kayit.alan, kayit.bolge,
    kayit.kategori, kayit.ozetCumle].concat(kayit.etiketler).join(' ');
  return adminNormalize(havuz).indexOf(terim) !== -1;
}

const ADMIN_SIRALAMA = {
  baslik: (a, b) => String(a.baslik).localeCompare(String(b.baslik), 'tr'),
  fiyat: (a, b) => a.fiyat - b.fiyat,
  puan: (a, b) => a.puan5 - b.puan5,
  yorum: (a, b) => a.yorumSayisi - b.yorumSayisi,
  tur: (a, b) => String(a.turTekil).localeCompare(String(b.turTekil), 'tr'),
  bolge: (a, b) => String(a.bolge).localeCompare(String(b.bolge), 'tr')
};

function adminSuz(kayitlar, secim) {
  const s = secim || {};
  const liste = (kayitlar || []).filter(k => {
    if (s.tur && s.tur !== 'hepsi' && k.tur !== s.tur) return false;
    if (s.bolge && s.bolge !== 'hepsi' && k.bolge !== s.bolge) return false;
    if (s.taslakli && !s.taslakli(k)) return false;
    return adminEslesiyorMu(k, s.q);
  });
  const sirala = ADMIN_SIRALAMA[s.sirala] || ADMIN_SIRALAMA.baslik;
  liste.sort(sirala);
  if (s.yon === 'azalan') liste.reverse();
  return liste;
}

function adminBolgeler(kayitlar) {
  const set = new Set();
  (kayitlar || []).forEach(k => { if (k.bolge) set.add(k.bolge); });
  return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
}

/* ---------------- istatistik ----------------
   Panel açılışındaki kutular. Hepsi kayıtlardan türetiliyor; panelin
   kendi saydığı ayrı bir sayı yok. */
function adminIstatistik(kayitlar) {
  const liste = kayitlar || [];
  const turBazinda = ADMIN_TURLER.map(t => ({
    key: t.key,
    tekil: t.tekil,
    cogul: t.cogul,
    renk: t.renk,
    ikon: t.ikon,
    adet: liste.filter(k => k.tur === t.key).length
  }));

  const yorumToplam = liste.reduce((t, k) => t + k.yorumSayisi, 0);
  const puanli = liste.filter(k => k.yorumSayisi > 0);
  /* Ortalama puan AĞIRLIKLI: 4 yorumlu bir kayıt ile 900 yorumlu bir
      kayıt eşit ağırlıkta sayılsaydı site ortalaması gerçeği anlatmazdı. */
  const agirlikliToplam = puanli.reduce((t, k) => t + k.puan5 * k.yorumSayisi, 0);
  const fiyatlar = liste.map(k => k.fiyat).filter(f => f > 0);
  const indirimliler = liste.filter(k => k.indirim > 0);

  return {
    toplam: liste.length,
    turBazinda: turBazinda,
    yorumToplam: yorumToplam,
    ortalamaPuan: yorumToplam ? Math.round((agirlikliToplam / yorumToplam) * 10) / 10 : 0,
    enDusukFiyat: fiyatlar.length ? Math.min(...fiyatlar) : 0,
    enYuksekFiyat: fiyatlar.length ? Math.max(...fiyatlar) : 0,
    ortalamaFiyat: fiyatlar.length
      ? Math.round(fiyatlar.reduce((t, f) => t + f, 0) / fiyatlar.length) : 0,
    indirimliAdet: indirimliler.length,
    ortalamaIndirim: indirimliler.length
      ? Math.round(indirimliler.reduce((t, k) => t + k.indirim, 0) / indirimliler.length) : 0,
    galeriToplam: liste.reduce((t, k) => t + k.sayilar.galeri, 0),
    sssToplam: liste.reduce((t, k) => t + k.sayilar.sss, 0),
    kelimeToplam: liste.reduce((t, k) => t + k.sayilar.kelime, 0)
  };
}

/* ---------------- denetim ----------------
   Testlerin koruduğu kuralların panelde GÖRÜNEN karşılığı. Amaç, bir
   hatayı CI'ya gitmeden önce içerik yazan kişinin ekranında göstermek:
   kayıtsız bir görsel anahtarı, tanımsız bir ikon, boş kalan zorunlu bir
   alan sitede sessizce bozuk bir kart üretiyor.

   Üç seviye var ve ayrımları bilinçli:
     hata    sitede GÖRÜNÜR bir bozukluk üretir (fotoğrafsız kart,
             çizilmeyen ikon, ölü bağ). Yayına çıkmamalı.
     uyari   sitede çalışır ama içerik ölçütünün altında kalır (kısa
             açıklama, az SSS, eski yorum).
     bilgi   dikkat çekmeye değer, yanlış değil.

   sayfalar: içerik sayfası dizinlerinin kümesi. Tarayıcıda panel bunu
   adresleri yoklayarak kurar, testte dosya sisteminden okunur. Küme
   verilmezse sayfa kontrolü atlanır — eksik bilgiyle "sayfa yok"
   demek, olmayan bir hatayı bildirmekten kötüdür. */
function adminDenetim(kayitlar, secenek) {
  const s = secenek || {};
  const ikonlar = adminIkonlar();
  const bulgular = [];
  const ekle = (kayit, seviye, alan, mesaj) => bulgular.push({
    seviye: seviye,
    tur: kayit.tur,
    slug: kayit.slug,
    baslik: kayit.baslik,
    alan: alan,
    mesaj: mesaj
  });

  /* Kod çakışması kayıtlar arası bir kural; tek kaydı incelerken
     görünmez, bu yüzden önce toplanıyor. */
  const kodSayaci = {};
  (kayitlar || []).forEach(k => {
    if (!k.kod) return;
    (kodSayaci[k.kod] = kodSayaci[k.kod] || []).push(k);
  });

  (kayitlar || []).forEach(kayit => {
    const tur = adminTur(kayit.tur);
    const ham = kayit.ham || {};
    const gorseller = (tur && tur.gorseller()) || {};

    /* --- hata --- */
    if (kayit.slug !== kayit.anahtar) {
      ekle(kayit, 'hata', 'slug',
        'Kaydın anahtarı "' + kayit.anahtar + '", slug alanı "' + kayit.slug
        + '". İkisi ayrışınca kartın bağı ile sayfanın adresi farklı oluyor.');
    }
    [['baslik', 'title'], ['ozetCumle', 'tagline'], ['kategori', 'category'],
     ['alan', 'area'], ['kod', 'code']].forEach(([panelAd, veriAd]) => {
      if (!kayit[panelAd]) {
        ekle(kayit, 'hata', veriAd, 'Zorunlu alan boş: ' + veriAd + '.');
      }
    });
    if (!kayit.kartGorseli) {
      ekle(kayit, 'hata', 'card.img',
        'Kartın görsel anahtarı yok; anasayfada fotoğrafsız kart çıkar.');
    } else if (s.kartGorselleri && !s.kartGorselleri.has(kayit.kartGorseli)) {
      ekle(kayit, 'hata', 'card.img',
        '"' + kayit.kartGorseli + '" app.js içindeki cardImages listesinde yok; '
        + 'kart alakasız bir yedek fotoğrafa düşer.');
    }
    (ham.gallery || []).forEach((g, i) => {
      if (g && g.key && !gorseller[g.key]) {
        ekle(kayit, 'hata', 'gallery[' + i + ']',
          'Galeri anahtarı "' + g.key + '" görsel sözlüğünde yok; o kare boş gelir.');
      }
    });
    (ham.similar || []).forEach((b, i) => {
      if (b && b.key && !gorseller[b.key]) {
        ekle(kayit, 'hata', 'similar[' + i + ']',
          'Benzer kart anahtarı "' + b.key + '" görsel sözlüğünde yok.');
      }
    });
    adminIkonKullanimlari(ham).forEach(kul => {
      if (!ikonlar[kul.ad]) {
        ekle(kayit, 'hata', kul.alan,
          'Tanımsız ikon "' + kul.ad + '"; TOUR_ICONS içinde karşılığı yok, çizilmez.');
      }
    });
    if (kayit.fiyat <= 0) {
      ekle(kayit, 'hata', 'pricing',
        'Başlangıç fiyatı sıfır görünüyor; kartta "0 ₺" yazar.');
    }
    if (kayit.listeFiyat && kayit.listeFiyat < kayit.fiyat) {
      ekle(kayit, 'hata', 'pricing',
        'Liste fiyatı satış fiyatının altında; üstü çizili fiyat daha ucuz görünür.');
    }
    if (kayit.kod && kodSayaci[kayit.kod] && kodSayaci[kayit.kod].length > 1) {
      ekle(kayit, 'hata', 'code',
        'Aynı kod başka bir kayıtta da var: '
        + kodSayaci[kayit.kod].map(k => k.slug).join(', ') + '.');
    }
    if (s.sayfalar && !s.sayfalar.has(kayit.adres)) {
      ekle(kayit, 'hata', 'sayfa',
        '/' + kayit.adres + ' açılmıyor; kart anasayfada çıkıyor ama bağ ölü.');
    }

    /* --- uyarı --- */
    if (kayit.sayilar.paragraf < 3) {
      ekle(kayit, 'uyari', 'description',
        'Açıklama ' + kayit.sayilar.paragraf + ' paragraf; sayfa yapısı üç paragraf bekliyor.');
    }
    /* Paragraf uzunluğu İKİ ayrı eşikle okunuyor ve ikisi bilerek farklı
       seviyede:

       25 kelimenin altı UYARI — o uzunluktaki bir paragraf yer tutucudur,
       sayfada eksik görünür.

       130–170 kelimelik pasaj bandı (docs/seo-arastirma.md madde 2) ise
       BİLGİ ve paragraf paragraf değil, kayıt başına TEK satır olarak
       veriliyor. İlk sürüm her paragrafı ayrı uyarı yazıyordu: yedi
       kaydın yirmi bir paragrafı da bandın altındaydı ve liste tek bir
       konudan ibaret hâle geldi — gerçek bir hata o yığının içinde
       görünmezdi. Denetimin işe yaraması, az ve ayırt edici bulgu
       vermesine bağlı. */
    (ham.description || []).forEach((p, i) => {
      const kelime = adminKelimeSayisi(p);
      if (kelime < 25) {
        ekle(kayit, 'uyari', 'description[' + i + ']',
          kelime + ' kelimelik paragraf; yer tutucu gibi duruyor.');
      } else if (kelime > 260) {
        ekle(kayit, 'uyari', 'description[' + i + ']',
          kelime + ' kelime; bölmek daha iyi alıntılanıyor.');
      }
    });
    if (kayit.sayilar.paragraf) {
      const ortalama = Math.round(kayit.sayilar.kelime / kayit.sayilar.paragraf);
      if (ortalama < 120) {
        ekle(kayit, 'bilgi', 'description',
          'Paragraf ortalaması ' + ortalama + ' kelime. Üretken aramanın aldığı pasaj '
          + 'bandı 130–170 kelime (docs/seo-arastirma.md, madde 2); paragrafları '
          + 'zenginleştirmek alıntılanma olasılığını artırıyor.');
      }
    }
    if (kayit.sayilar.oneCikan < 5) {
      ekle(kayit, 'uyari', 'highlights',
        'Öne çıkanlar ' + kayit.sayilar.oneCikan + ' madde; bölüm beş maddeden az görünüyor.');
    }
    if (kayit.sayilar.sss < 4) {
      ekle(kayit, 'uyari', 'faq', 'SSS ' + kayit.sayilar.sss + ' soru; en az dört soru hedefleniyor.');
    }
    if (kayit.sayilar.galeri < 5) {
      ekle(kayit, 'uyari', 'gallery', 'Galeride ' + kayit.sayilar.galeri + ' fotoğraf var.');
    }
    if (kayit.sayilar.yorum < 5) {
      ekle(kayit, 'uyari', 'reviews', 'Yorum bölümünde ' + kayit.sayilar.yorum + ' yorum var.');
    }
    if (kayit.sayilar.etiket < 6) {
      ekle(kayit, 'uyari', 'tags',
        'Etiket sayısı ' + kayit.sayilar.etiket + '; arama bu kaydı daha az sorguda bulur.');
    }
    if (kayit.yorumSayisi < 20) {
      ekle(kayit, 'uyari', 'ratingBreakdown',
        'Puan dağılımının toplamı ' + kayit.yorumSayisi + '; kartta çıkan puan az sayıya dayanıyor.');
    }
    if (kayit.ozetCumle.length > 90) {
      ekle(kayit, 'uyari', 'tagline',
        'Özet cümle ' + kayit.ozetCumle.length + ' karakter; başlık altında iki satıra taşar.');
    }
    const kartBaslik = (ham.card && ham.card.title) || kayit.baslik;
    if (kartBaslik.length > 34) {
      ekle(kayit, 'uyari', 'card.title',
        'Kart başlığı ' + kartBaslik.length + ' karakter; dar kartta üç satıra taşar. '
        + 'card.title ile kısa bir ad yazılabilir.');
    }
    if (kayit.indirim > 50) {
      ekle(kayit, 'uyari', 'pricing',
        'İndirim %' + kayit.indirim + ' görünüyor; liste fiyatı gerçekçi mi?');
    }

    /* --- bilgi --- */
    const sonYorum = adminSonYorumTarihi(ham.reviews);
    if (sonYorum && s.bugun) {
      const gun = adminGunFarki(sonYorum, s.bugun);
      if (gun > 120) {
        ekle(kayit, 'bilgi', 'reviews',
          'En yeni yorum ' + gun + ' gün önce; yorum bölümü eskimiş görünüyor.');
      }
      if (gun < 0) {
        ekle(kayit, 'uyari', 'reviews',
          'Yorum tarihi gelecekte (' + sonYorum + '); sayfada "-3 gün önce" gibi bir metin çıkar.');
      }
    }
  });

  return bulgular;
}

/* Kayıtta ikon adı taşıyan bütün alanlar. Tek tek elle yazılıyor çünkü
   kaydın her yerinde `icon` anahtarı aramak, ikon OLMAYAN alanları da
   (görsel anahtarı gibi) yanlışlıkla toplardı. */
function adminIkonKullanimlari(ham) {
  const out = [];
  const topla = (liste, alan) => (liste || []).forEach((x, i) => {
    if (x && x.icon) out.push({ ad: x.icon, alan: alan + '[' + i + ']' });
  });
  topla(ham.badges, 'badges');
  topla(ham.facts, 'facts');
  topla(ham.trust, 'trust');
  topla(ham.amenities, 'amenities');
  topla(ham.included, 'included');
  topla(ham.excluded, 'excluded');
  topla(ham.requirements, 'requirements');
  topla(ham.rules, 'rules');
  topla(ham.policies, 'policies');
  topla(ham.ratingAspects, 'ratingAspects');
  return out;
}

function adminSonYorumTarihi(yorumlar) {
  let enYeni = '';
  (yorumlar || []).forEach(y => {
    const t = String((y && y.date) || '');
    if (t && t > enYeni) enYeni = t;
  });
  return enYeni;
}

function adminGunFarki(isoA, isoB) {
  const f = aFn('tur', 'asDate', typeof asDate !== 'undefined' ? asDate : null);
  const a = f ? f(isoA) : null;
  const b = f ? f(isoB) : null;
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/* Denetim özeti: kutulardaki sayılar ve "sağlık" yüzdesi. Yüzde, hatasız
   kayıt oranı — uyarılar sayıya girmiyor, çünkü uyarı yayını engellemez. */
function adminDenetimOzeti(kayitlar, bulgular) {
  const toplam = (kayitlar || []).length;
  const hatali = new Set();
  const uyarili = new Set();
  (bulgular || []).forEach(b => {
    const ad = b.tur + '/' + b.slug;
    if (b.seviye === 'hata') hatali.add(ad);
    if (b.seviye === 'uyari') uyarili.add(ad);
  });
  return {
    toplam: toplam,
    hata: (bulgular || []).filter(b => b.seviye === 'hata').length,
    uyari: (bulgular || []).filter(b => b.seviye === 'uyari').length,
    bilgi: (bulgular || []).filter(b => b.seviye === 'bilgi').length,
    hataliKayit: hatali.size,
    uyariliKayit: uyarili.size,
    temizKayit: toplam - hatali.size,
    saglik: toplam ? Math.round(((toplam - hatali.size) / toplam) * 100) : 100
  };
}

/* ---------------- medya ----------------
   Her türün görsel sözlüğü ile o sözlüğün NEREDE kullanıldığını
   eşleştiriyor. Kullanılmayan anahtar ölü ağırlık, kullanılan ama
   sözlükte olmayan anahtar bozuk kare — ikisi de burada görünüyor. */
function adminMedya(kayitlar) {
  const out = [];
  ADMIN_TURLER.forEach(tur => {
    const sozluk = tur.gorseller();
    if (!sozluk) return;
    const kullanim = {};
    (kayitlar || []).filter(k => k.tur === tur.key).forEach(k => {
      const ekle = (anahtar, nerede) => {
        if (!anahtar) return;
        (kullanim[anahtar] = kullanim[anahtar] || []).push(nerede);
      };
      (k.ham.gallery || []).forEach(g => ekle(g && g.key, k.slug + ' · galeri'));
      (k.ham.similar || []).forEach(b => ekle(b && b.key, k.slug + ' · benzer'));
      (k.ham.rooms || []).forEach(o => ekle(o && o.key, k.slug + ' · oda'));
      (k.ham.packages || []).forEach(p => ekle(p && p.key, k.slug + ' · paket'));
      (k.ham.areas || []).forEach(a => ekle(a && a.key, k.slug + ' · alan'));
      (k.ham.services || []).forEach(h => ekle(h && h.key, k.slug + ' · hizmet'));
    });
    Object.keys(sozluk).forEach(anahtar => {
      out.push({
        tur: tur.key,
        turTekil: tur.tekil,
        anahtar: anahtar,
        dosya: sozluk[anahtar].dosya,
        ad: sozluk[anahtar].ad,
        kullanim: kullanim[anahtar] || []
      });
    });
  });
  return out;
}

/* ---------------- düzenlenebilir alanlar ----------------
   Düzenleyicinin formu bu şemadan çiziliyor; admin-page.js hiçbir alanı
   kendi eliyle yazmıyor. Yeni bir alan düzenlenebilir olsun istiyorsanız
   buraya bir satır — form, taslak, fark ve dışa aktarma o satırı
   kendiliğinden tanır.

   yol    kayıt içindeki nokta yolu ('card.img', 'pricing.adult')
   tip    metin · metinUzun · sayi · oran · satirlar · paragraflar ·
          nesneListesi · gorselAnahtari
   grup   düzenleyicideki sekme */
const ADMIN_ORTAK_ALANLAR = [
  { grup: 'kunye', yol: 'title', etiket: 'Başlık', tip: 'metin', zorunlu: true,
    ipucu: 'Sayfanın h1 başlığı ve sekme adı. Kartta bu değil, card.title görünür.' },
  { grup: 'kunye', yol: 'tagline', etiket: 'Özet cümle', tip: 'metinUzun', zorunlu: true,
    sinir: 90,
    ipucu: 'Başlığın altındaki tek cümle. 90 karakteri geçince iki satıra taşar.' },
  { grup: 'kunye', yol: 'category', etiket: 'Kategori', tip: 'metin', zorunlu: true },
  { grup: 'kunye', yol: 'categoryShort', etiket: 'Kategori (kısa)', tip: 'metin',
    ipucu: 'Dar yerlerde (mobil başlık, rozet) bu kullanılıyor.' },
  { grup: 'kunye', yol: 'area', etiket: 'Konum', tip: 'metin', zorunlu: true },
  { grup: 'kunye', yol: 'region', etiket: 'Bölge', tip: 'metin' },
  { grup: 'kunye', yol: 'code', etiket: 'Ürün kodu', tip: 'metin', zorunlu: true,
    ipucu: 'Kayıtlar arasında tekil olmalı; denetim çakışmayı yakalıyor.' },

  { grup: 'kart', yol: 'card.img', etiket: 'Kart görseli', tip: 'gorselAnahtari', zorunlu: true,
    ipucu: 'app.js içindeki cardImages anahtarı. Listede olmayan anahtar yedek fotoğrafa düşer.' },
  { grup: 'kart', yol: 'card.title', etiket: 'Kart başlığı', tip: 'metin',
    ipucu: 'Boş bırakılırsa kaydın tam başlığı kullanılır. Dar kart iki satır alıyor.' },
  { grup: 'kart', yol: 'card.meta1', etiket: 'Kart alt satırı', tip: 'metin' },
  { grup: 'kart', yol: 'card.badges', etiket: 'Kart rozetleri', tip: 'satirlar' },

  { grup: 'icerik', yol: 'highlights', etiket: 'Öne çıkanlar', tip: 'satirlar',
    ipucu: 'Her satır bir madde. Beş maddeden az olunca bölüm zayıf görünüyor.' },
  { grup: 'icerik', yol: 'description', etiket: 'Açıklama paragrafları', tip: 'paragraflar',
    ipucu: 'Her paragraf kendi başına anlaşılan 130–170 kelimelik bir pasaj olmalı.' },
  { grup: 'icerik', yol: 'tags', etiket: 'Arama etiketleri', tip: 'satirlar' },

  { grup: 'sss', yol: 'faq', etiket: 'Sık sorulan sorular', tip: 'nesneListesi',
    ad: 'q',
    alanlar: [
      { ad: 'q', etiket: 'Soru', tip: 'metin' },
      { ad: 'a', etiket: 'Cevap', tip: 'metinUzun' }
    ] }
];

/* Türe özgü alanlar: yalnızca o türde anlamı olanlar. */
const ADMIN_TUR_ALANLARI = {
  tur: [
    { grup: 'kunye', yol: 'durationLabel', etiket: 'Süre', tip: 'metin' },
    { grup: 'fiyat', yol: 'pricing.maxGuests', etiket: 'En fazla kişi', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.seatsPerDeparture', etiket: 'Kalkış başına koltuk', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.leadDays', etiket: 'En erken kaç gün sonra', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.startTime', etiket: 'Kalkış saati', tip: 'metin' }
  ],
  otel: [
    { grup: 'kunye', yol: 'stars', etiket: 'Yıldız', tip: 'sayi' },
    { grup: 'kunye', yol: 'distanceLabel', etiket: 'Konum cümlesi', tip: 'metin' },
    { grup: 'fiyat', yol: 'pricing.taxRate', etiket: 'Konaklama vergisi', tip: 'oran',
      ipucu: 'Oran olarak yazılır: 0,02 = %2.' },
    { grup: 'fiyat', yol: 'pricing.minNights', etiket: 'En az gece', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.maxNights', etiket: 'En fazla gece', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.maxRooms', etiket: 'En fazla oda', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.leadDays', etiket: 'En erken giriş (gün)', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.checkInTime', etiket: 'Giriş saati', tip: 'metin' },
    { grup: 'fiyat', yol: 'pricing.checkOutTime', etiket: 'Çıkış saati', tip: 'metin' }
  ],
  aktivite: [
    { grup: 'kunye', yol: 'durationLabel', etiket: 'Süre', tip: 'metin' },
    { grup: 'kunye', yol: 'activityLabel', etiket: 'Aktivite türü', tip: 'metin' },
    { grup: 'fiyat', yol: 'pricing.maxGuests', etiket: 'En fazla kişi', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.minAge', etiket: 'En küçük yaş', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.seatsPerSession', etiket: 'Seans başına yer', tip: 'sayi' }
  ],
  etkinlik: [
    { grup: 'kunye', yol: 'venueName', etiket: 'Sahne / mekân', tip: 'metin' },
    { grup: 'kunye', yol: 'doorsLabel', etiket: 'Kapı açılışı', tip: 'metin' },
    { grup: 'fiyat', yol: 'pricing.maxTickets', etiket: 'En fazla bilet', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.servicePerTicket', etiket: 'Bilet başı hizmet bedeli', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.startTime', etiket: 'Başlangıç saati', tip: 'metin' }
  ],
  mekan: [
    { grup: 'kunye', yol: 'kindLabel', etiket: 'Mekân türü', tip: 'metin' },
    { grup: 'kunye', yol: 'priceLevel', etiket: 'Fiyat seviyesi', tip: 'metin' },
    { grup: 'fiyat', yol: 'pricing.maxGuests', etiket: 'En fazla kişi', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.entryFee', etiket: 'Giriş ücreti', tip: 'sayi' },
    { grup: 'fiyat', yol: 'pricing.leadDays', etiket: 'En erken kaç gün sonra', tip: 'sayi' }
  ]
};

const ADMIN_GRUPLAR = [
  { key: 'kunye', etiket: 'Künye' },
  { key: 'kart', etiket: 'Anasayfa kartı' },
  { key: 'icerik', etiket: 'İçerik' },
  { key: 'fiyat', etiket: 'Fiyat' },
  { key: 'sss', etiket: 'SSS' }
];

function adminAlanlar(turKey) {
  return ADMIN_ORTAK_ALANLAR.concat(ADMIN_TUR_ALANLARI[turKey] || []);
}

/* ---------------- nokta yolu ile okuma/yazma ----------------
   'card.img' gibi bir yolu okuyup yazıyor. Yazma kaydın KOPYASINA
   yapılıyor; panel yayındaki veri nesnesine asla dokunmuyor — dokunsaydı
   taslağı iptal etmek imkânsız olurdu, çünkü aslı kaybolurdu. */
function adminOku(nesne, yol) {
  const parca = String(yol || '').split('.');
  let s = nesne;
  for (let i = 0; i < parca.length; i++) {
    if (s === null || typeof s !== 'object') return undefined;
    s = s[parca[i]];
  }
  return s;
}

function adminYaz(nesne, yol, deger) {
  const parca = String(yol || '').split('.');
  let s = nesne;
  for (let i = 0; i < parca.length - 1; i++) {
    if (s[parca[i]] === null || typeof s[parca[i]] !== 'object') s[parca[i]] = {};
    s = s[parca[i]];
  }
  s[parca[parca.length - 1]] = deger;
  return nesne;
}

function adminKopya(nesne) {
  return JSON.parse(JSON.stringify(nesne));
}

/* ---------------- taslak ----------------
   Taslak TÜM kaydı değil, yalnızca DEĞİŞEN yolları tutuyor:
   { 'title': 'Yeni ad', 'pricing.adult': 1450 }

   Neden böyle: taslak kaydın kopyası olsaydı, veri dosyasında sonradan
   yapılan bir düzeltme (mesela bir yazım hatası) taslak açıkken
   kaybolurdu — taslağı uygulamak eski kopyayı geri yazardı. Yol/değer
   tutunca yalnızca elle değiştirilen alan üzerine biniyor, kaydın geri
   kalanı güncel kalıyor. */
function adminTaslakUygula(kayit, taslak) {
  const kopya = adminKopya(kayit);
  Object.keys(taslak || {}).forEach(yol => adminYaz(kopya, yol, taslak[yol]));
  return kopya;
}

/* Taslağın kayda göre farkı. Kayıttakiyle AYNI değere dönen bir yol
   farkta görünmez: kullanıcı bir alanı değiştirip geri aldığında panel
   "1 değişiklik var" demeye devam etmesin. */
function adminFark(kayit, taslak) {
  const out = [];
  Object.keys(taslak || {}).forEach(yol => {
    const eski = adminOku(kayit, yol);
    const yeni = taslak[yol];
    if (JSON.stringify(eski) === JSON.stringify(yeni)) return;
    out.push({ yol: yol, eski: eski, yeni: yeni });
  });
  out.sort((a, b) => a.yol.localeCompare(b.yol));
  return out;
}

function adminTaslakTemizle(kayit, taslak) {
  const temiz = {};
  adminFark(kayit, taslak).forEach(f => { temiz[f.yol] = f.yeni; });
  return temiz;
}

/* ---------------- dışa aktarma ----------------
   Site statik: tarayıcı veri dosyasına yazamaz. Panel bunun yerine
   dosyaya YAPIŞTIRILACAK bloğu üretiyor. Biçim veri dosyalarıyla aynı:
   iki boşluk girinti, tek tırnak, Türkçe karakterler olduğu gibi.

   Tek tırnak içeren metin kaçışlanıyor; kaçışlanmasaydı üretilen blok
   söz dizimi hatası verirdi ve bu, panelin en kolay gözden kaçan
   hatası olurdu ("dosyaya yapıştırdım, site açılmadı"). */
function adminJsDeger(v, girinti) {
  const bos = ' '.repeat(girinti);
  const icBos = ' '.repeat(girinti + 2);
  if (v === null) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const satirlar = v.map(x => icBos + adminJsDeger(x, girinti + 2));
    return '[\n' + satirlar.join(',\n') + '\n' + bos + ']';
  }
  if (typeof v === 'object') {
    const anahtarlar = Object.keys(v);
    if (!anahtarlar.length) return '{}';
    const satirlar = anahtarlar.map(a =>
      icBos + adminJsAnahtar(a) + ': ' + adminJsDeger(v[a], girinti + 2));
    return '{\n' + satirlar.join(',\n') + '\n' + bos + '}';
  }
  return 'undefined';
}

/* Sayısal ve tire içeren anahtarlar tırnaklanıyor: ratingBreakdown'ın
   '5' anahtarı ve slug benzeri anahtarlar tırnaksız geçerli değil. */
function adminJsAnahtar(ad) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(ad) ? ad : "'" + String(ad).replace(/'/g, "\\'") + "'";
}

function adminJsKaynak(anahtar, kayit) {
  return '  ' + adminJsAnahtar(anahtar) + ': ' + adminJsDeger(kayit, 2) + ',';
}

/* Yalnızca değişen alanların özeti: bütün kaydı yapıştırmak istemeyen
   için, hangi satırın ne olacağını tek tek gösteren kısa liste. */
function adminFarkMetni(fark) {
  return (fark || []).map(f =>
    f.yol + ':\n  eski: ' + JSON.stringify(f.eski) + '\n  yeni: ' + JSON.stringify(f.yeni)
  ).join('\n\n');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ADMIN_TURLER,
    ADMIN_GRUPLAR,
    ADMIN_ORTAK_ALANLAR,
    ADMIN_TUR_ALANLARI,
    adminTur,
    adminKelimeSayisi,
    adminIndirim,
    adminKayitlar,
    adminKayitSatiri,
    adminNormalize,
    adminEslesiyorMu,
    adminSuz,
    adminBolgeler,
    adminIstatistik,
    adminDenetim,
    adminDenetimOzeti,
    adminIkonKullanimlari,
    adminSonYorumTarihi,
    adminMedya,
    adminAlanlar,
    adminOku,
    adminYaz,
    adminKopya,
    adminTaslakUygula,
    adminFark,
    adminTaslakTemizle,
    adminJsDeger,
    adminJsAnahtar,
    adminJsKaynak,
    adminFarkMetni,
    adminParaTR,
    adminSayiTR,
    adminRatingOzet
  };
}
