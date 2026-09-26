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
const KAPI_ORNEK = kapiModul('./sample-catalog-data.js');
const KAPI_MOTOR = kapiModul('./listing-engine.js');

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
    facets:      kapiDeger('TAXONOMY_FACETS', T, typeof TAXONOMY_FACETS !== 'undefined' ? TAXONOMY_FACETS : undefined) || {},
    menu:        kapiDeger('TAXONOMY_MENU', T, typeof TAXONOMY_MENU !== 'undefined' ? TAXONOMY_MENU : undefined) || [],
    resolve:     kapiFn('taxonomyResolvePath', T, typeof taxonomyResolvePath !== 'undefined' ? taxonomyResolvePath : null),
    categoryPath: kapiFn('taxonomyCategoryPath', T, typeof taxonomyCategoryPath !== 'undefined' ? taxonomyCategoryPath : null)
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

/* ---------------- sayfa yükü: ürünler ----------------
   Bir tipin kayıtları = sayfası olan ürünler (TOURS …) + henüz sayfası
   olmayan örnek özet kayıtlar (sample-catalog-data.js, sample: true).
   İkisi aynı biçimde; aynı slug ikisinde birden varsa sayfası olan
   kazanır. */
function kapiKume(tip) {
  const t = KAPI_TIPLER[tip];
  if (!t) return null;
  const tam = t.kayitlar();
  const ornekHepsi = kapiDeger('SAMPLE_PRODUCTS', KAPI_ORNEK,
    typeof SAMPLE_PRODUCTS !== 'undefined' ? SAMPLE_PRODUCTS : undefined);
  const ornek = ornekHepsi ? ornekHepsi[tip] : null;
  if (!tam && !ornek) return null;
  return Object.assign({}, ornek || {}, tam || {});
}


/* Yayında olmayan kayıt public adreste görünmez (sözleşme bölüm 9).
   Örnek kayıtlarda status yoksa yayında sayılıyor. */
function kapiYayinda(kayit) {
  return !!kayit && (kayit.status === undefined || kayit.status === 'published');
}

function kapiUrun(tip, slug) {
  const kume = kapiKume(tip);
  const anahtar = String(slug || '').trim().toLowerCase();
  if (!kume || !anahtar || !Object.prototype.hasOwnProperty.call(kume, anahtar)) return null;
  const kayit = kume[anahtar];
  return kapiYayinda(kayit) ? kayit : null;
}

function kapiUrunler(tip) {
  const tipler = tip ? [tip] : Object.keys(KAPI_TIPLER);
  const out = [];
  tipler.forEach(t => {
    const kume = kapiKume(t);
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

/* Listelerde yalnızca SATILABİLİR ürün: sezonu biten etkinliğin sayfası
   açılır ("program tamamlandı") ama liste, tema sayısı ve koleksiyon
   onu saymaz; satın alınamayan ürünü listelemek ölü kart olurdu. */
function kapiSatista(kayit, bugun) {
  if (kapiIcerikTipi(kayit) !== 'event') return true;
  return !!KAPI_TIPLER.event.ilkTarih(kayit, kapiISO(bugun || new Date()));
}

function kapiListele(filtre, bugun) {
  return kapiUrunler((filtre && filtre.type) || null)
    .filter(k => kapiSatista(k, bugun) && kapiFiltreyeUyar(k, filtre, bugun));
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

/* ---------------- liste satırı ----------------
   Liste motorunun (listing-engine.js) okuduğu biçim: ürünün süzülen ve
   sıralanan her niteliği tek düz nesnede. Backend geldiğinde bu satırı
   arama dizini üretecek; motor ve ekran aynı kalacak.

   facets[x] === null → "her değer" (her gün açık otel her aya uyar);
   [] → "hiçbiri" (otelin süre dilimi yok). */

/* Tarih süzgecinin ufku: bu ay + 5 ay. */
const KAPI_AY_UFKU = 6;

function kapiAyEkle(iso, ay) {
  const d = kapiAsDate(iso);
  return d ? kapiISO(new Date(d.getFullYear(), d.getMonth() + ay, 1)) : null;
}

/* Sabit tarihli ürünün (tur, etkinlik) ufuk içindeki satış tarihleri.
   Her gün satılan ürün (otel, aktivite, mekân) için null. */
function kapiSabitTarihler(kayit, tip, bugun) {
  const gun = kapiISO(bugun || new Date());
  const sinir = kapiAyEkle(gun, KAPI_AY_UFKU);
  if (tip === 'tour') {
    const p = kayit.pricing || {};
    const f = kapiFn('nextDepartureDates', KAPI_TUR, typeof nextDepartureDates !== 'undefined' ? nextDepartureDates : null);
    return f ? f(gun, p.departureDays, 400, p.leadDays).filter(d => d < sinir) : [];
  }
  if (tip === 'event') {
    const f = kapiFn('upcomingPerformances', KAPI_ETKINLIK,
      typeof upcomingPerformances !== 'undefined' ? upcomingPerformances : null);
    return f ? f(kayit, gun).map(t => t.date).filter(d => d < sinir) : [];
  }
  return null;
}

/* Puan 5 üzerinden. Sayfası olan kayıtta yorum dağılımından, örnek
   özette özetin kendisinden. Otel 10 üzerinden gösteriliyor; süzgeç ve
   sıralama için 5'liğe çevriliyor. Puanı olmayan ürün null. */
function kapiPuan5(kayit, tip) {
  const onluk = tip === 'hotel';
  if (kayit.rating && !kayit.ratingBreakdown) {
    const ort = Number(kayit.rating.average);
    return {
      ortalama: Number.isFinite(ort) && ort > 0 ? Math.round((onluk ? ort / 2 : ort) * 100) / 100 : null,
      adet: Number(kayit.rating.count) || 0
    };
  }
  const ozet = kapiFn('ratingSummary', KAPI_TUR, typeof ratingSummary !== 'undefined' ? ratingSummary : null);
  const r = ozet ? ozet(kayit.ratingBreakdown) : { total: 0, average: 0 };
  return { ortalama: r.total ? r.average : null, adet: r.total };
}

function kapiListeSatiri(kayit, bugun) {
  const ozet = kapiOzet(kayit, bugun);
  if (!ozet) return null;
  const tip = ozet.type;
  const T = kapiTaksonomi();
  const t = kayit.taxonomy || {};
  const bolge = kapiUrunBolgesi(kayit);
  const puan = kapiPuan5(kayit, tip);
  const tarihler = kapiSabitTarihler(kayit, tip, bugun);
  const sureFn = kapiFn('suzSureDilimi', KAPI_MOTOR, typeof suzSureDilimi !== 'undefined' ? suzSureDilimi : null);
  const dilim = tip === 'tour' && sureFn ? sureFn(ozet.nights) : null;
  const elle = T.collections.filter(c => c.mode === 'manual').map(c => c.slug);
  return {
    kayit,
    type: tip,
    slug: kayit.slug,
    /* Ürünün adresi (kök göreli). */
    path: T.types[tip].path + '/' + kayit.slug,
    title: kayit.title,
    price: ozet.price,
    listPrice: ozet.listPrice,
    currency: ozet.currency,
    discounted: ozet.discounted,
    nights: ozet.nights,
    nextDate: tarihler ? (tarihler[0] || null) : ozet.nextDate,
    rating: puan.ortalama,
    ratingCount: puan.adet,
    facets: {
      tip: [T.types[tip].path],
      ay: tarihler ? tarihler.map(d => d.slice(0, 7)).filter((m, i, d) => d.indexOf(m) === i) : null,
      sure: dilim ? [dilim] : [],
      bolge: bolge ? [bolge.slug] : [],
      kalkis: kapiKalkisSehirleri(kayit),
      ulasim: ((t.facets && t.facets.transport) || []).slice(),
      pansiyon: kapiPansiyonlar(kayit),
      tema: (t.themes || []).slice(),
      kimle: (t.collections || []).filter(c => elle.indexOf(c) !== -1)
    }
  };
}

/* Süzgeç alanlarının tanımı: adres parametresi (key), başlık ve
   seçenekler. Sıra ekrandaki sıra. Seçenekler taksonomiden; sayısı 0
   olan seçenek ekranda görünmüyor (motor eliyor). */
function kapiYuzeyTanimlari(bugun) {
  const T = kapiTaksonomi();
  const M = KAPI_MOTOR;
  const deger = (ad, yerel) => kapiDeger(ad, M, yerel) || [];
  const aylar = kapiDeger('AYLAR_TR', KAPI_TUR, typeof AYLAR_TR !== 'undefined' ? AYLAR_TR : undefined) || [];
  const gun = kapiISO(bugun || new Date());
  const ayListesi = [];
  for (let i = 0; i < KAPI_AY_UFKU; i++) {
    const ilk = kapiAyEkle(gun, i);
    if (!ilk) break;
    const d = kapiAsDate(ilk);
    ayListesi.push({ slug: ilk.slice(0, 7), name: (aylar[d.getMonth()] || ilk.slice(5, 7)) + ' ' + d.getFullYear() });
  }
  const adli = (liste) => liste.map(x => ({ slug: x.slug, name: x.name }));
  return [
    { key: 'tip', name: 'Tür', kind: 'coklu',
      options: Object.keys(T.types).map(t => ({ slug: T.types[t].path, name: T.types[t].plural })) },
    { key: 'ay', name: 'Tarih', kind: 'coklu', options: ayListesi,
      note: 'Her gün satılan oteller, aktiviteler ve mekânlar her ayda listelenir.' },
    { key: 'sure', name: 'Süre', kind: 'coklu',
      options: adli(deger('SUZ_SURE_DILIMLERI', typeof SUZ_SURE_DILIMLERI !== 'undefined' ? SUZ_SURE_DILIMLERI : undefined)) },
    { key: 'bolge', name: 'Bölge', kind: 'coklu', options: adli(T.regions) },
    { key: 'kalkis', name: 'Kalkış şehri', kind: 'coklu', options: adli(T.cities) },
    { key: 'ulasim', name: 'Ulaşım', kind: 'coklu', options: adli((T.facets && T.facets.transport) || []) },
    { key: 'pansiyon', name: 'Pansiyon', kind: 'coklu', options: adli((T.facets && T.facets.board) || []) },
    { key: 'tema', name: 'Tema', kind: 'coklu', options: adli(T.themes) },
    { key: 'kimle', name: 'Kimin için', kind: 'coklu',
      options: adli(T.collections.filter(c => c.mode === 'manual')) },
    { key: 'fiyat', name: 'Fiyat', kind: 'aralik', field: 'price', currency: 'TRY',
      options: deger('SUZ_FIYAT_DILIMLERI', typeof SUZ_FIYAT_DILIMLERI !== 'undefined' ? SUZ_FIYAT_DILIMLERI : undefined).slice(),
      note: 'Döviz fiyatlı ürünler TL fiyat süzgecinde listelenmez.' },
    { key: 'puan', name: 'Puan', kind: 'esik', field: 'rating',
      options: deger('SUZ_PUAN_ESIKLERI', typeof SUZ_PUAN_ESIKLERI !== 'undefined' ? SUZ_PUAN_ESIKLERI : undefined).slice() },
    { key: 'indirimli', name: 'Fırsat', kind: 'bayrak', field: 'discounted',
      options: [{ slug: '1', name: 'Yalnızca indirimliler', etiket: 'İndirimli' }] }
  ];
}

/* ---------------- adres çözümü ----------------
   Tek yönlendirici sayfanın (404.html) karar noktası: adres neye
   karşılık geliyor? Dönüş kind:
     home, product, type-list, category, listing, theme, collection,
     theme-index, collection-index, static
   veya null (bulunamadı). Ürün yayında değilse de null. */
function kapiYolTemizle(yol) {
  let y = String(yol || '');
  try { y = decodeURIComponent(y); } catch (_) { /* ham kalır */ }
  y = y.split('?')[0].split('#')[0];
  return y.replace(/\/index\.html?$/i, '/').replace(/\/{2,}/g, '/')
    .replace(/^\/+|\/+$/g, '').toLowerCase();
}

function kapiAdres(yol) {
  const temiz = kapiYolTemizle(yol);
  if (!temiz) return { kind: 'home', path: '' };
  const T = kapiTaksonomi();
  const parca = temiz.split('/');
  const detayTipi = Object.keys(T.types).find(t => T.types[t].path === parca[0]);
  if (detayTipi) {
    if (parca.length !== 2) return null;
    const kayit = kapiUrun(detayTipi, parca[1]);
    return kayit ? { kind: 'product', type: detayTipi, slug: kayit.slug, path: temiz } : null;
  }
  if (temiz === 'temalar') return { kind: 'theme-index', path: temiz };
  if (temiz === 'koleksiyonlar') return { kind: 'collection-index', path: temiz };
  const r = T.resolve ? T.resolve(temiz) : null;
  return r ? Object.assign({ path: temiz }, r) : null;
}

/* ---------------- sayfa modeli ----------------
   Liste sayfasının başlığı, temel süzgeci, sayfa yolu (kırıntı) ve
   alt sayfa çipleri. Hepsi taksonomiden; sayfaya metin yazılmıyor. */

/* Menüde bu yolu taşıyan düğüm ve üst düğümü. Aynı yol iki düğümde
   olabilir: "Oteller" ile altındaki "Tüm Oteller" aynı adrese gidiyor.
   Varsayılan ilk bulunan (üst düğüm, çipleri o taşıyor); yaprak: true
   başlık için çocuksuz olanı tercih eder ("Kurumsal" değil
   "Hakkımızda"). */
function kapiMenuDugumu(yol, yaprak) {
  const bulunanlar = [];
  const gez = (liste, ust) => (liste || []).forEach(d => {
    if (d.path === yol) bulunanlar.push({ dugum: d, ust });
    gez(d.children, d);
  });
  gez(kapiTaksonomi().menu, null);
  if (yaprak) return bulunanlar.find(b => !b.dugum.children) || bulunanlar[0] || null;
  return bulunanlar[0] || null;
}

function kapiMenuEtiketi(yol, yaprak) {
  const b = kapiMenuDugumu(yol, yaprak);
  return b ? b.dugum.label : null;
}

/* "12 tur", "4 etkinlik"; tipler karışıksa "9 seçenek". */
function kapiAdetMetni(urunler) {
  const tipler = (urunler || []).map(kapiIcerikTipi).filter((t, i, d) => d.indexOf(t) === i);
  return (urunler || []).length + ' ' + kapiBirim(tipler.length === 1 ? tipler[0] : null);
}

/* İçerik tipinin kısa birimi: "tur", "otel" … (sayım metni). */
function kapiBirim(tip) {
  const T = kapiTaksonomi();
  return tip && T.types[tip] ? T.types[tip].name.toLocaleLowerCase('tr-TR') : 'seçenek';
}

function kapiSayfaModeli(adres, bugun) {
  if (!adres) return null;
  const T = kapiTaksonomi();
  const ana = { name: 'Anasayfa', path: '' };
  const tabanEtiketi = (base) => {
    const tip = Object.keys(T.types).find(t => T.types[t].base === base);
    return { name: kapiMenuEtiketi(base) || (tip ? T.types[tip].plural : base), path: base };
  };
  let m = null;
  if (adres.kind === 'type-list') {
    const base = adres.type ? T.types[adres.type].base : adres.base;
    m = {
      baslik: tabanEtiketi(base).name,
      tip: adres.type || null,
      /* /firsatlar/ bütün indirimli ürünler; fırsat alt sayfaları
         (erken rezervasyon, son dakika) çip olarak. */
      temel: adres.type ? { type: adres.type } : { discounted: true },
      kirinti: [ana, tabanEtiketi(base)]
    };
  } else if (adres.kind === 'category') {
    const base = T.types[adres.type].base;
    const zincir = T.categoryPath ? T.categoryPath(adres.type, adres.category.slug) : [adres.category];
    m = {
      baslik: adres.category.name,
      tip: adres.type,
      temel: { type: adres.type, category: adres.category.slug },
      kirinti: [ana, tabanEtiketi(base)].concat(zincir.map(k => ({ name: k.name, path: base + '/' + k.slug })))
    };
  } else if (adres.kind === 'listing') {
    const l = adres.listing;
    m = {
      baslik: l.name,
      tip: (l.filter && l.filter.type) || null,
      temel: Object.assign({}, l.filter || {}),
      kirinti: [ana, tabanEtiketi(l.base), { name: l.name, path: l.base + '/' + l.slug }]
    };
  } else if (adres.kind === 'theme') {
    m = {
      baslik: adres.theme.name,
      tip: null,
      temel: { theme: adres.theme.slug },
      kirinti: [ana, { name: 'Temalar', path: 'temalar' }, { name: adres.theme.name, path: adres.path }]
    };
  } else if (adres.kind === 'collection') {
    m = {
      baslik: adres.collection.name,
      tip: null,
      temel: { collection: adres.collection.slug },
      kirinti: [ana, { name: 'Koleksiyonlar', path: 'koleksiyonlar' }, { name: adres.collection.name, path: adres.path }]
    };
  } else if (adres.kind === 'theme-index' || adres.kind === 'collection-index') {
    const tema = adres.kind === 'theme-index';
    const liste = tema ? T.themes : T.collections;
    m = {
      baslik: tema ? 'Temalar' : 'Koleksiyonlar',
      tip: null,
      temel: null,
      kirinti: [ana, { name: tema ? 'Temalar' : 'Koleksiyonlar', path: adres.path }],
      kartlar: liste.map(x => {
        const urunler = kapiListele(tema ? { theme: x.slug } : { collection: x.slug }, bugun);
        return { name: x.name, text: x.text || '', img: x.img, path: adres.path + '/' + x.slug,
                 adet: urunler.length, adetMetni: kapiAdetMetni(urunler) };
      }).filter(k => k.adet > 0)
    };
  } else if (adres.kind === 'static') {
    const b = kapiMenuDugumu(adres.path, true);
    const etiket = b ? b.dugum.label : adres.path;
    m = {
      baslik: etiket,
      tip: null,
      temel: null,
      kirinti: [ana]
        .concat(b && b.ust ? [{ name: b.ust.label, path: b.ust.path }] : [])
        .concat([{ name: etiket, path: adres.path }])
    };
  }
  if (!m) return null;
  m.kind = adres.kind;
  m.path = adres.path;
  m.birim = kapiBirim(m.tip);
  m.altlar = kapiAltSayfalar(adres, bugun);
  return m;
}

/* Sayfanın çipleri: menüde alt düğümü varsa onlar, yaprak sayfaysa
   kardeşleri (bulunduğu sayfa işaretli). Menüde olmayan sayfa (tema,
   koleksiyon, menu:false kategori) kendi ailesini gösterir. Ürünü
   olmayan çip gizli; bulunduğun sayfa hiç gizlenmez. */
function kapiAltSayfalar(adres, bugun) {
  const T = kapiTaksonomi();
  let adaylar = [];
  if (adres.kind === 'theme') {
    adaylar = T.themes.map(x => ({ name: x.name, path: 'temalar/' + x.slug }));
  } else if (adres.kind === 'collection') {
    adaylar = T.collections.map(x => ({ name: x.name, path: 'koleksiyonlar/' + x.slug }));
  } else if (['type-list', 'category', 'listing'].indexOf(adres.kind) !== -1) {
    const b = kapiMenuDugumu(adres.path);
    let kaynak = null;
    if (b && b.dugum.children) kaynak = b.dugum;
    else if (b && b.ust) kaynak = b.ust;
    else {
      /* Menüde yok: tipin kök düğümü. */
      const kok = adres.path.split('/')[0];
      const k = kapiMenuDugumu(kok);
      kaynak = k ? k.dugum : null;
    }
    adaylar = ((kaynak && kaynak.children) || [])
      .filter(c => !(kaynak.path === adres.path && c.path === adres.path))
      .map(c => ({ name: c.label, path: c.path }));
  }
  return adaylar.map(c => {
    const hedef = kapiAdres(c.path);
    const model = hedef && hedef.kind !== 'static' ? kapiSayfaTemeli(hedef) : null;
    const adet = model ? kapiListele(model, bugun).length : null;
    return { name: c.name, path: c.path, adet, aktif: c.path === adres.path };
  }).filter(c => c.aktif || c.adet === null || c.adet > 0);
}

/* Yalnızca temel süzgeç (çip sayımı için; kırıntı ve çip üretmeden). */
function kapiSayfaTemeli(adres) {
  if (adres.kind === 'type-list') return adres.type ? { type: adres.type } : { discounted: true };
  if (adres.kind === 'category') return { type: adres.type, category: adres.category.slug };
  if (adres.kind === 'listing') return Object.assign({}, adres.listing.filter || {});
  if (adres.kind === 'theme') return { theme: adres.theme.slug };
  if (adres.kind === 'collection') return { collection: adres.collection.slug };
  return null;
}

/* ---------------- liste sorgusu ----------------
   Canlı sorgu (Promise): süzgeç ve sıralama değiştikçe ekran bunu
   çağırıyor. Backend geldiğinde:
     fetch('/api/liste?' + temel + '&' + secimler) → aynı biçim
   Bugün cevap buradaki satırlardan, liste motoruyla. */
function kapiListeSorgusu(sorgu) {
  return Promise.resolve().then(() => {
    const s = sorgu || {};
    const motor = kapiFn('suzListe', KAPI_MOTOR, typeof suzListe !== 'undefined' ? suzListe : null);
    if (!motor) return null;
    const satirlar = kapiListele(s.temel || {}, s.bugun)
      .map(k => kapiListeSatiri(k, s.bugun)).filter(Boolean);
    return motor(satirlar, s.alanlar || kapiYuzeyTanimlari(s.bugun), s.durum || {});
  });
}

/* Sayfa yükü: liste sayfasının SEO alanları ve sayım özeti. Açıklama
   sayıdan ve en düşük TL fiyattan türetiliyor; ürün eklenince kendisi
   güncelleniyor. */
function kapiListeSeo(model, bugun) {
  if (!model) return null;
  const urunler = model.temel ? kapiListele(model.temel, bugun) : [];
  const tlFiyatlar = urunler.map(k => kapiOzet(k, bugun))
    .filter(o => o && o.currency === 'TRY' && o.price > 0).map(o => o.price);
  const enDusuk = tlFiyatlar.length ? Math.min.apply(null, tlFiyatlar) : null;
  const fiyatMetni = enDusuk ? kapiFiyatMetni(enDusuk, 'TRY') : null;
  const adet = urunler.length;
  const yol = model.path ? model.path + '/' : '';
  let aciklama;
  if (model.kartlar) {
    aciklama = model.baslik + ': ' + model.kartlar.map(k => k.name).join(', ') + '. Aradığın deneyimi temaya göre seç.';
  } else if (!model.temel) {
    aciklama = model.baslik + ' — mola360.';
  } else if (adet) {
    aciklama = model.baslik + ': ' + adet + ' ' + model.birim
      + (fiyatMetni ? ', fiyatlar ' + fiyatMetni + '\'den başlıyor' : '')
      + '. Tarihe, bölgeye ve bütçeye göre süz; güvenli ödemeyle online rezervasyon yap.';
  } else {
    aciklama = model.baslik + ': yeni seçenekler eklendiğinde burada listelenecek.';
  }
  return {
    title: model.baslik + ' — mola360',
    description: aciklama,
    canonical: KAPI_SITE_ADRESI + yol,
    path: yol,
    /* Ürünü olmayan liste ince içeriktir; dizine girmesin. */
    noindex: !!model.temel && adet === 0,
    adet,
    enDusuk: fiyatMetni
  };
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
  /* liste sayfaları (sayfa yükü) */
  adres: kapiAdres,
  sayfaModeli: kapiSayfaModeli,
  listeSeo: kapiListeSeo,
  yuzeyTanimlari: kapiYuzeyTanimlari,
  listeSatiri: kapiListeSatiri,
  /* canlı sorgu (Promise) */
  liste: kapiListeSorgusu,
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
    kapiYolTemizle,
    kapiPuan5,
    kapiSabitTarihler,
    musaitlikKaydi,
    saatAnahtari,
    konaklamaKalan,
    tarihDoluMu,
    kontenjanDurumu
  };
}
