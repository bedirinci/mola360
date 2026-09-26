/* ---------------- veri kapısı: MolaVeri ----------------
   Ekranlar veriyi YALNIZCA buradan ister. Sözleşme
   docs/veri-sozlesmesi.md'de; bu dosya o sözleşmenin tarayıcı tarafı.

   Bugün cevaplar depodaki örnek veriden geliyor. Backend geldiğinde bu
   dosyanın İÇİ değişecek (sayfa yükü sunucunun sayfaya gömdüğü veriden,
   canlı sorgular fetch'ten), dışı değişmeyecek. Ekranların bu dosyanın
   içine bakmaması gerekiyor: kayıt dizilerine (TOURS, HOTELS …) doğrudan
   erişen ekran, backend geldiğinde kırılacak ekrandır.

   İKİ TÜR OKUMA (sözleşme bölüm 1):
     sayfa yükü   senkron  ürün, kategori, tema, koleksiyon, liste
     canlı sorgu  Promise  kontenjan (ileride arama, fiyat teklifi)

   ADLAR: klasik <script> etiketleri üst kapsamı paylaştığı için bu
   dosyanın bütün üst seviye adları KAPI_ / kapi ile başlıyor; başka bir
   dosyadaki adla çakışırsa bütün sayfa ölür (tests/katalog.test.js
   anasayfa betiklerini tek kapsamda çalıştırıp bunu ölçüyor). */

const KAPI_NODE = (typeof require === 'function' && typeof module !== 'undefined' && module.exports);
function kapiModul(yol) {
  if (!KAPI_NODE) return null;
  try { return require(yol); } catch (_) { return null; }
}
const KAPI_TUR = kapiModul('./tour-data.js');
const KAPI_OTEL = kapiModul('./hotel-data.js');
const KAPI_AKTIVITE = kapiModul('./activity-data.js');
const KAPI_ETKINLIK = kapiModul('./event-data.js');
const KAPI_MEKAN = kapiModul('./venue-data.js');
const KAPI_TAKSONOMI = kapiModul('./taxonomy-data.js');
const KAPI_ENVANTER = kapiModul('./inventory-data.js');

/* Kanonik adreslerin kökü. Alan adı (mola360.com) hazır olduğunda tek
   değişecek satır. */
const KAPI_SITE_ADRESI = 'https://bedirinci.github.io/mola360/';

/* Ad çözümü ÇAĞRI ANINDA: Node'da modülden, tarayıcıda üst kapsamdan.
   Sayfa o tipin veri dosyasını yüklemediyse null döner ve ilgili tip
   sessizce "kayıt yok" sayılır; kapı yüklenirken patlamaz. */
function kapiFn(ad, modul, yerel) {
  if (modul && typeof modul[ad] === 'function') return modul[ad];
  return typeof yerel === 'function' ? yerel : null;
}
function kapiDeger(ad, modul, yerel) {
  if (modul && modul[ad] !== undefined) return modul[ad];
  return yerel === undefined ? null : yerel;
}

/* taxonomy-data.js tabloları (tarayıcıda üst kapsamdan). */
function kapiTaksonomi() {
  const T = KAPI_TAKSONOMI;
  return {
    types:       kapiDeger('TAXONOMY_TYPES', T, typeof TAXONOMY_TYPES !== 'undefined' ? TAXONOMY_TYPES : undefined) || {},
    tourKinds:   kapiDeger('TAXONOMY_TOUR_KINDS', T, typeof TAXONOMY_TOUR_KINDS !== 'undefined' ? TAXONOMY_TOUR_KINDS : undefined) || {},
    categories:  kapiDeger('TAXONOMY_CATEGORIES', T, typeof TAXONOMY_CATEGORIES !== 'undefined' ? TAXONOMY_CATEGORIES : undefined) || [],
    themes:      kapiDeger('TAXONOMY_THEMES', T, typeof TAXONOMY_THEMES !== 'undefined' ? TAXONOMY_THEMES : undefined) || [],
    collections: kapiDeger('TAXONOMY_COLLECTIONS', T, typeof TAXONOMY_COLLECTIONS !== 'undefined' ? TAXONOMY_COLLECTIONS : undefined) || [],
    regions:     kapiDeger('TAXONOMY_REGIONS', T, typeof TAXONOMY_REGIONS !== 'undefined' ? TAXONOMY_REGIONS : undefined) || [],
    cities:      kapiDeger('TAXONOMY_CITIES', T, typeof TAXONOMY_CITIES !== 'undefined' ? TAXONOMY_CITIES : undefined) || [],
    listings:    kapiDeger('TAXONOMY_LISTINGS', T, typeof TAXONOMY_LISTINGS !== 'undefined' ? TAXONOMY_LISTINGS : undefined) || [],
    facets:      kapiDeger('TAXONOMY_FACETS', T, typeof TAXONOMY_FACETS !== 'undefined' ? TAXONOMY_FACETS : undefined) || {}
  };
}

/* ---------------- ürün tipleri ----------------
   Her tipin kayıt kümesi ve kendi fiyat/görsel/tarih fonksiyonları. Yeni
   bir tip eklemek buraya bir satır. */
const KAPI_TIPLER = {
  tour: {
    kayitlar: () => kapiDeger('TOURS', KAPI_TUR, typeof TOURS !== 'undefined' ? TOURS : undefined),
    gorsel: (k, w) => kapiFn('tourImage', KAPI_TUR, typeof tourImage !== 'undefined' ? tourImage : null)(k, w),
    fiyat: (k) => kapiFn('basePrice', KAPI_TUR, typeof basePrice !== 'undefined' ? basePrice : null)(k),
    listeFiyati: (k) => kapiFn('baseListPrice', KAPI_TUR, typeof baseListPrice !== 'undefined' ? baseListPrice : null)(k),
    geceler: (k) => (k.type === 'stay' ? Math.max(0, Number(k.nights) || 0) : 0),
    ilkTarih: (k, bugun) => {
      const p = k.pricing || {};
      const f = kapiFn('nextDepartureDates', KAPI_TUR, typeof nextDepartureDates !== 'undefined' ? nextDepartureDates : null);
      return f ? (f(bugun, p.departureDays, 1, p.leadDays)[0] || null) : null;
    },
    kalkisGunleri: (k) => ((k.pricing && k.pricing.departureDays) || [])
  },
  hotel: {
    kayitlar: () => kapiDeger('HOTELS', KAPI_OTEL, typeof HOTELS !== 'undefined' ? HOTELS : undefined),
    gorsel: (k, w) => kapiFn('hotelImage', KAPI_OTEL, typeof hotelImage !== 'undefined' ? hotelImage : null)(k, w),
    fiyat: (k) => kapiFn('hotelNightlyFrom', KAPI_OTEL, typeof hotelNightlyFrom !== 'undefined' ? hotelNightlyFrom : null)(k),
    listeFiyati: (k) => kapiFn('hotelNightlyListFrom', KAPI_OTEL, typeof hotelNightlyListFrom !== 'undefined' ? hotelNightlyListFrom : null)(k),
    geceler: () => null,
    ilkTarih: (k, bugun) => kapiGunEkle(bugun, (k.pricing && k.pricing.leadDays) || 0)
  },
  activity: {
    kayitlar: () => kapiDeger('ACTIVITIES', KAPI_AKTIVITE, typeof ACTIVITIES !== 'undefined' ? ACTIVITIES : undefined),
    gorsel: (k, w) => kapiFn('activityImage', KAPI_AKTIVITE, typeof activityImage !== 'undefined' ? activityImage : null)(k, w),
    fiyat: (k) => kapiFn('activityPriceFrom', KAPI_AKTIVITE, typeof activityPriceFrom !== 'undefined' ? activityPriceFrom : null)(k),
    listeFiyati: (k) => kapiFn('activityListPriceFrom', KAPI_AKTIVITE, typeof activityListPriceFrom !== 'undefined' ? activityListPriceFrom : null)(k),
    geceler: () => null,
    ilkTarih: (k, bugun) => kapiGunEkle(bugun, (k.pricing && k.pricing.leadDays) || 0)
  },
  event: {
    kayitlar: () => kapiDeger('EVENTS', KAPI_ETKINLIK, typeof EVENTS !== 'undefined' ? EVENTS : undefined),
    gorsel: (k, w) => kapiFn('eventImage', KAPI_ETKINLIK, typeof eventImage !== 'undefined' ? eventImage : null)(k, w),
    fiyat: (k) => kapiFn('eventPriceFrom', KAPI_ETKINLIK, typeof eventPriceFrom !== 'undefined' ? eventPriceFrom : null)(k),
    listeFiyati: (k) => kapiFn('eventListPriceFrom', KAPI_ETKINLIK, typeof eventListPriceFrom !== 'undefined' ? eventListPriceFrom : null)(k),
    geceler: () => null,
    ilkTarih: (k, bugun) => {
      const f = kapiFn('nextPerformance', KAPI_ETKINLIK, typeof nextPerformance !== 'undefined' ? nextPerformance : null);
      const t = f ? f(k, bugun) : null;
      return t ? t.date : null;
    }
  },
  venue: {
    kayitlar: () => kapiDeger('PLACES', KAPI_MEKAN, typeof PLACES !== 'undefined' ? PLACES : undefined),
    gorsel: (k, w) => kapiFn('venueImage', KAPI_MEKAN, typeof venueImage !== 'undefined' ? venueImage : null)(k, w),
    fiyat: (k) => kapiFn('venuePriceFrom', KAPI_MEKAN, typeof venuePriceFrom !== 'undefined' ? venuePriceFrom : null)(k),
    /* Masa modelinde liste fiyatı yok (minimum harcama indirilmez);
       randevuda en ucuz hizmetin liste fiyatı. */
    listeFiyati: (k) => {
      if (k.booking !== 'randevu') return 0;
      const ucuz = (k.services || []).slice().sort((a, b) => (a.price || 0) - (b.price || 0))[0];
      return ucuz ? (Number(ucuz.priceList) || 0) : 0;
    },
    geceler: () => null,
    ilkTarih: (k, bugun) => kapiGunEkle(bugun, (k.pricing && k.pricing.leadDays) || 0)
  }
};

/* ---------------- küçük yardımcılar ---------------- */
function kapiAsDate(v) {
  const f = kapiFn('asDate', KAPI_TUR, typeof asDate !== 'undefined' ? asDate : null);
  return f ? f(v) : null;
}
function kapiISO(v) {
  const f = kapiFn('toISODate', KAPI_TUR, typeof toISODate !== 'undefined' ? toISODate : null);
  return f ? f(v) : '';
}
function kapiGunEkle(v, gun) {
  const d = kapiAsDate(v || new Date());
  return d ? kapiISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + (Number(gun) || 0))) : null;
}
function kapiGunFarki(bas, son) {
  const a = kapiAsDate(bas), b = kapiAsDate(son);
  return (a && b) ? Math.round((b.getTime() - a.getTime()) / 86400000) : null;
}

/* Tur kaydında `type` alanı tur tipini (daily/stay) taşıyor; içerik tipi
   o değil. Kayıttan içerik tipini okumak için tek yer. */
function kapiIcerikTipi(kayit) {
  if (!kayit) return null;
  if (kayit.type === 'daily' || kayit.type === 'stay') return 'tour';
  return KAPI_TIPLER[kayit.type] ? kayit.type : null;
}

/* ---------------- sayfa yükü: ürünler ---------------- */

/* Yayında olmayan kayıt public adreste görünmez (sözleşme bölüm 9).
   Örnek kayıtlarda status yoksa yayında sayılıyor. */
function kapiYayinda(kayit) {
  return !!kayit && (kayit.status === undefined || kayit.status === 'published');
}

function kapiUrun(tip, slug) {
  const t = KAPI_TIPLER[tip];
  const kume = t ? t.kayitlar() : null;
  const anahtar = String(slug || '').trim().toLowerCase();
  if (!kume || !anahtar || !Object.prototype.hasOwnProperty.call(kume, anahtar)) return null;
  const kayit = kume[anahtar];
  return kapiYayinda(kayit) ? kayit : null;
}

function kapiUrunler(tip) {
  const tipler = tip ? [tip] : Object.keys(KAPI_TIPLER);
  const out = [];
  tipler.forEach(t => {
    const kume = KAPI_TIPLER[t] ? KAPI_TIPLER[t].kayitlar() : null;
    if (!kume) return;
    Object.keys(kume).forEach(s => { if (kapiYayinda(kume[s])) out.push(kume[s]); });
  });
  return out;
}

/* Filtre ve kural için ürünün özeti. Fiyat, gece ve tarih ürünün kendi
   fonksiyonlarından; burada kopya tutulmuyor. */
function kapiOzet(kayit, bugun) {
  const tip = kapiIcerikTipi(kayit);
  const t = KAPI_TIPLER[tip];
  if (!t) return null;
  const gun = kapiISO(bugun || new Date());
  const fiyat = Number(t.fiyat(kayit)) || 0;
  const liste = Number(t.listeFiyati(kayit)) || 0;
  return {
    type: tip,
    slug: kayit.slug,
    price: fiyat,
    listPrice: liste,
    discounted: liste > fiyat && fiyat > 0,
    currency: kayit.currency || 'TRY',
    nights: t.geceler(kayit),
    nextDate: t.ilkTarih(kayit, gun),
    departureDays: t.kalkisGunleri ? t.kalkisGunleri(kayit) : null
  };
}

/* ---------------- sayfa yükü: sınıflandırma ---------------- */
function kapiKategoriler(tip) {
  return kapiTaksonomi().categories.filter(k => k.type === tip);
}
function kapiKategori(tip, slug) {
  return kapiKategoriler(tip).find(k => k.slug === slug) || null;
}
function kapiAltKategoriler(tip, slug) {
  const liste = kapiKategoriler(tip);
  const out = [];
  const kuyruk = [slug];
  while (kuyruk.length) {
    const s = kuyruk.shift();
    if (out.indexOf(s) !== -1) continue;
    out.push(s);
    liste.filter(k => k.parent === s).forEach(k => kuyruk.push(k.slug));
  }
  return out;
}
function kapiTema(slug) {
  return kapiTaksonomi().themes.find(t => t.slug === slug) || null;
}
function kapiKoleksiyon(slug) {
  return kapiTaksonomi().collections.find(c => c.slug === slug) || null;
}
function kapiSehir(slug) {
  return kapiTaksonomi().cities.find(c => c.slug === slug) || null;
}
function kapiBolge(slug) {
  return kapiTaksonomi().regions.find(r => r.slug === slug) || null;
}
/* Ürünün bölgesi şehrinden. */
function kapiUrunBolgesi(kayit) {
  const sehir = kapiSehir(kayit && kayit.taxonomy && kayit.taxonomy.city);
  return sehir ? kapiBolge(sehir.region) : null;
}

/* Otelin pansiyon özellikleri kendi pansiyon kodlarından (BB, HB …). */
function kapiPansiyonlar(kayit) {
  const kodlar = ((kayit && kayit.boards) || []).map(b => String(b.id || '').toLowerCase());
  return ((kapiTaksonomi().facets.board) || []).filter(b => kodlar.indexOf(b.code) !== -1).map(b => b.slug);
}

/* Konaklamalı turda kalkış şehirleri departureCities'ten, günübirlikte
   taxonomy.facets.departFrom'dan (ikisi aynı anda yazılmıyor). */
function kapiKalkisSehirleri(kayit) {
  if (kayit && Array.isArray(kayit.departureCities)) return kayit.departureCities.map(d => d.city);
  return ((kayit && kayit.taxonomy && kayit.taxonomy.facets && kayit.taxonomy.facets.departFrom) || []).slice();
}

/* ---------------- koleksiyon kuralı ---------------- */
function kapiKuralaUyar(kural, ozet, bugun) {
  const r = kural || {};
  if (!ozet) return false;
  if (Array.isArray(r.types) && r.types.indexOf(ozet.type) === -1) return false;
  if (r.maxPrice !== undefined) {
    if (r.currency && ozet.currency !== r.currency) return false;
    if (!(ozet.price > 0 && ozet.price < r.maxPrice)) return false;
  }
  if (r.nextDateWithin !== undefined) {
    const fark = ozet.nextDate ? kapiGunFarki(bugun, ozet.nextDate) : null;
    if (fark === null || fark < 0 || fark > r.nextDateWithin) return false;
  }
  if (r.minNights !== undefined || r.maxNights !== undefined) {
    if (ozet.nights === null || ozet.nights === undefined || ozet.nights <= 0) return false;
    if (r.minNights !== undefined && ozet.nights < r.minNights) return false;
    if (r.maxNights !== undefined && ozet.nights > r.maxNights) return false;
  }
  return true;
}

/* Ürün koleksiyonda mı: elle koleksiyonda kaydın listesine, kurallıda
   kurala bakılır. */
function kapiKoleksiyondaMi(kayit, slug, bugun) {
  const kol = kapiKoleksiyon(slug);
  if (!kol || !kayit) return false;
  if (kol.mode === 'manual') {
    return ((kayit.taxonomy && kayit.taxonomy.collections) || []).indexOf(slug) !== -1;
  }
  return kapiKuralaUyar(kol.rule, kapiOzet(kayit, bugun), kapiISO(bugun || new Date()));
}

/* ---------------- filtre ----------------
   Liste sayfalarının, tema/koleksiyon sayfalarının ve ileride adres
   parametreli süzmenin (?ulasim=otobus) TEK süzgeci. Anahtarlar
   taxonomy-data.js'teki liste sayfası tanımıyla aynı. */
function kapiFiltreyeUyar(kayit, filtre, bugun) {
  const f = filtre || {};
  const tip = kapiIcerikTipi(kayit);
  const t = (kayit && kayit.taxonomy) || {};
  if (!tip) return false;
  if (f.type && f.type !== tip) return false;
  if (f.tourKind && !(tip === 'tour' && kayit.type === f.tourKind)) return false;
  if (f.category) {
    const kapsam = kapiAltKategoriler(tip, f.category);
    if (!(t.categories || []).some(s => kapsam.indexOf(s) !== -1)) return false;
  }
  if (f.theme && (t.themes || []).indexOf(f.theme) === -1) return false;
  if (f.collection && !kapiKoleksiyondaMi(kayit, f.collection, bugun)) return false;
  if (f.city && t.city !== f.city) return false;
  if (f.region || f.abroad !== undefined) {
    const bolge = kapiUrunBolgesi(kayit);
    if (!bolge) return false;
    if (f.region && bolge.slug !== f.region) return false;
    if (f.abroad !== undefined && !!bolge.abroad !== !!f.abroad) return false;
  }
  if (f.transport && ((t.facets && t.facets.transport) || []).indexOf(f.transport) === -1) return false;
  if (f.departFrom && kapiKalkisSehirleri(kayit).indexOf(f.departFrom) === -1) return false;
  if (f.board && kapiPansiyonlar(kayit).indexOf(f.board) === -1) return false;
  if (f.weekend) {
    /* Hafta sonu: cuma, cumartesi veya pazar kalkışı olan ve en fazla 2
       gecelik tur. */
    if (tip !== 'tour') return false;
    const gunler = (kayit.pricing && kayit.pricing.departureDays) || [];
    if (!gunler.some(g => g === 5 || g === 6 || g === 0)) return false;
    if (kayit.type === 'stay' && (Number(kayit.nights) || 0) > 2) return false;
  }
  if (f.discounted && !kapiOzet(kayit, bugun).discounted) return false;
  /* Erken rezervasyon indirimi fiyat kurallarıyla gelecek (4. adım);
     bugün hiçbir ürünün böyle bir kuralı yok. */
  if (f.earlyBooking) return false;
  return true;
}

function kapiListele(filtre, bugun) {
  return kapiUrunler((filtre && filtre.type) || null).filter(k => kapiFiltreyeUyar(k, filtre, bugun));
}

/* /<base>/<slug>/ adresinin karşılığı: kategori veya liste sayfası.
   2. adımdaki yönlendirici bunu kullanacak. */
function kapiListeSayfasi(base, slug) {
  const T = kapiTaksonomi();
  const liste = T.listings.find(l => l.base === base && l.slug === slug);
  if (liste) return { kind: 'listing', listing: liste, filter: liste.filter || {} };
  const tip = Object.keys(T.types).find(t => T.types[t].base === base);
  const kat = tip ? kapiKategori(tip, slug) : null;
  if (kat) return { kind: 'category', category: kat, filter: { type: tip, category: kat.slug } };
  return null;
}

/* ---------------- SEO ----------------
   Kaydın seo alanı + türetilenler. Açıklamadaki {fiyat} güncel başlangıç
   fiyatıyla dolar: fiyat metne gömülseydi fiyat değişince açıklama
   eskirdi. Paylaşım görseli seo.ogImage anahtarından, yoksa galerinin
   ilk görselinden. */
function kapiFiyatMetni(tutar, paraBirimi) {
  const bicim = kapiFn('formatNumberTR', KAPI_TUR, typeof formatNumberTR !== 'undefined' ? formatNumberTR : null);
  const sayi = bicim ? bicim(tutar) : String(tutar);
  const birim = { TRY: 'TL', EUR: '€', USD: '$' }[paraBirimi || 'TRY'] || paraBirimi;
  return paraBirimi === 'EUR' || paraBirimi === 'USD' ? birim + sayi : sayi + ' ' + birim;
}

function kapiSeo(tip, kayit) {
  const t = KAPI_TIPLER[tip];
  if (!t || !kayit) return null;
  const s = kayit.seo || {};
  const fiyat = kapiFiyatMetni(Number(t.fiyat(kayit)) || 0, kayit.currency || 'TRY');
  const doldur = (m) => String(m || '').split('{fiyat}').join(fiyat);
  const yol = kapiTaksonomi().types[tip].path + '/' + kayit.slug + '/';
  const gorselAnahtari = s.ogImage || (kayit.gallery && kayit.gallery[0] && kayit.gallery[0].key);
  return {
    title: s.title || kayit.title,
    description: doldur(s.description || kayit.tagline),
    ogTitle: s.ogTitle || s.title || kayit.title,
    ogDescription: doldur(s.ogDescription || s.description || kayit.tagline),
    ogImage: gorselAnahtari ? t.gorsel(gorselAnahtari, 1200) : '',
    canonical: KAPI_SITE_ADRESI + yol,
    path: yol
  };
}

/* ---------------- canlı sorgu: kontenjan ----------------
   Promise döner. Bugün cevap örnek kontenjandan (inventory-data.js),
   backend geldiğinde:
     fetch('/api/urunler/' + tip + '/' + slug + '/musaitlik?from=…&to=…')
   Ürün yoksa veya kontenjan kaynağı yüklenmemişse null ile çözülür;
   ekran bunu "bilinmiyor" sayar ve satışı ENGELLEMEZ (son kontrol ödeme
   adımında). */
function kapiMusaitlik(tip, slug, aralik) {
  return Promise.resolve().then(() => {
    const kayit = kapiUrun(tip, slug);
    const kaynak = kapiFn('ornekMusaitlik', KAPI_ENVANTER,
      typeof ornekMusaitlik !== 'undefined' ? ornekMusaitlik : null);
    if (!kayit || !kaynak) return null;
    return kaynak(tip, kayit, aralik || {});
  });
}

/* ---------------- kontenjan cevabını okuma ----------------
   Saf fonksiyonlar; ekranlar kontenjanı bunlarla okur. Cevabın biçimi
   değişirse değişecek tek yer burası. */
function musaitlikKaydi(musaitlik, item, date, time) {
  const liste = (musaitlik && musaitlik.items) || [];
  for (let i = 0; i < liste.length; i++) {
    const r = liste[i];
    if (r.item !== item || r.date !== date) continue;
    if (time === undefined || time === null || r.time === time) return r;
  }
  return null;
}

/* Kontenjanın saat anahtarı: "≈ 05:45" -> "05:45". Balon seansının
   saati gün doğumuna bağlı olduğu için veride yaklaşık yazılı; kontenjan
   satırının anahtarı ise makine saati (HH:MM). */
function saatAnahtari(metin) {
  const m = String(metin || '').match(/(\d{1,2}):(\d{2})/);
  return m ? m[1].padStart(2, '0') + ':' + m[2] : null;
}

/* Otelde kalan oda: konaklamanın HER GECESİNİN en küçüğü. Bir gece için
   bile kayıt yoksa bilinmiyor (null). Çıkış günü gece sayılmaz. */
function konaklamaKalan(musaitlik, item, giris, cikis) {
  const geceler = kapiGunFarki(giris, cikis);
  if (!musaitlik || !geceler || geceler < 1) return null;
  let enAz = Infinity;
  for (let i = 0; i < geceler; i++) {
    const r = musaitlikKaydi(musaitlik, item, kapiGunEkle(giris, i));
    if (!r) return null;
    enAz = Math.min(enAz, r.remaining);
  }
  return enAz;
}

/* Bir tarihin (saat verilirse o seansın) BÜTÜN birimleri dolu mu: tarih
   ve seans çiplerini pasifleştirmek için. Hiç kayıt yoksa false —
   bilinmeyen tarih kapatılmaz, son kontrol ödeme adımında. */
function tarihDoluMu(musaitlik, date, time) {
  const liste = ((musaitlik && musaitlik.items) || [])
    .filter(r => r.date === date && (time === undefined || time === null || r.time === time));
  return liste.length > 0 && liste.every(r => r.remaining <= 0);
}

/* kalan: sayı veya null (bilinmiyor). istenen: kişi/oda/bilet/masa.
   azEsigi: "son N yer" uyarısının sınırı. */
function kontenjanDurumu(kalan, istenen, azEsigi) {
  if (kalan === null || kalan === undefined || !Number.isFinite(Number(kalan))) {
    return { durum: 'bilinmiyor', kalan: null };
  }
  const k = Math.max(0, Math.floor(Number(kalan)));
  const iste = Math.max(1, Math.floor(Number(istenen) || 1));
  if (k <= 0) return { durum: 'doldu', kalan: 0 };
  if (iste > k) return { durum: 'yetersiz', kalan: k };
  if (k <= (Number(azEsigi) || 0)) return { durum: 'az', kalan: k };
  return { durum: 'var', kalan: k };
}

/* ---------------- dışa açılan yüz ---------------- */
const MolaVeri = {
  /* sayfa yükü (senkron) */
  urun: kapiUrun,
  urunler: kapiUrunler,
  icerikTipi: kapiIcerikTipi,
  ozet: kapiOzet,
  kategoriler: kapiKategoriler,
  kategori: kapiKategori,
  temalar: () => kapiTaksonomi().themes.slice(),
  tema: kapiTema,
  koleksiyonlar: () => kapiTaksonomi().collections.slice(),
  koleksiyon: kapiKoleksiyon,
  bolge: kapiUrunBolgesi,
  listeSayfasi: kapiListeSayfasi,
  listele: kapiListele,
  temaUrunleri: (slug, bugun) => kapiListele({ theme: slug }, bugun),
  koleksiyonUrunleri: (slug, bugun) => kapiListele({ collection: slug }, bugun),
  seo: kapiSeo,
  /* canlı sorgu (Promise) */
  musaitlik: kapiMusaitlik
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MolaVeri,
    KAPI_SITE_ADRESI,
    kapiFiyatMetni,
    kapiFiltreyeUyar,
    kapiKuralaUyar,
    kapiPansiyonlar,
    kapiKalkisSehirleri,
    musaitlikKaydi,
    saatAnahtari,
    konaklamaKalan,
    tarihDoluMu,
    kontenjanDurumu
  };
}
