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
const KAPI_REZ = kapiModul('./booking-engine.js');
const KAPI_HESAP = kapiModul('./account-engine.js');

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
    departureDays: t.kalkisGunleri ? t.kalkisGunleri(kayit) : null,
    publishedAt: kayit.publishedAt || null
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

/* ---------------- arama ----------------
   Metin araması tek kuralla: başlıktaki arama kutusu, arama sayfası
   (/arama/?q=) ve backend'in arama uç noktası aynı eşleşmeyi verir.

   Aranan alanlar ve ağırlıkları:
     5  başlık (kelime başı)       3  başlık (kelimenin içi)
     2  sınıflandırma: kategori, tema, koleksiyon, şehir, bölge, tip adı
     1  yer, kart satırı, rozet, mekân adı
   Sorgudaki HER kelime bir yerde geçmeli (VE). Türkçe ek için: sorgu
   kelimesi en az 4 harflik bir kelimeyle başlıyorsa da eşleşir
   ("kapadokyada" → "kapadokya", "otelleri" → "otel"). Büyük/küçük harf
   ve şapka/nokta farkı yok sayılır. */
function kapiNormal(metin) {
  return String(metin || '').toLocaleLowerCase('tr-TR').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();
}

function kapiAramaAlanlari(kayit) {
  const T = kapiTaksonomi();
  const tip = kapiIcerikTipi(kayit);
  const t = kayit.taxonomy || {};
  const kart = kayit.card || {};
  const sehir = kapiSehir(t.city);
  const bolge = kapiUrunBolgesi(kayit);
  const adlar = (liste, kaynak) => (liste || []).map(s => (kaynak.find(x => x.slug === s) || {}).name).filter(Boolean);
  const sinif = []
    .concat(adlar(t.categories, T.categories.filter(c => c.type === tip)))
    .concat(adlar(t.themes, T.themes))
    .concat(adlar(t.collections, T.collections))
    .concat(sehir ? [sehir.name] : [])
    .concat(bolge ? [bolge.name] : [])
    .concat(tip && T.types[tip] ? [T.types[tip].name, T.types[tip].plural] : [])
    .concat(tip === 'tour' && T.tourKinds[kayit.type] ? [T.tourKinds[kayit.type].name] : []);
  return {
    baslik: kapiNormal(kayit.title),
    sinif: kapiNormal(sinif.join(' ')),
    diger: kapiNormal([kayit.area, kart.meta1, (kart.badges || []).join(' '), kayit.venueName, kayit.categoryShort].join(' '))
  };
}

/* Bir kelimenin bir metindeki en iyi eşleşmesi: 2 kelime başı, 1 içinde,
   0 yok. */
function kapiKelimeEslesmesi(kelime, metin) {
  if (!metin) return 0;
  const kelimeler = metin.split(' ');
  if (kelimeler.some(w => w.indexOf(kelime) === 0)) return 2;
  if (metin.indexOf(kelime) !== -1) return 1;
  /* Türkçe ek: "kapadokyada" → "kapadokya". */
  if (kelimeler.some(w => w.length >= 4 && kelime.indexOf(w) === 0)) return 2;
  return 0;
}

function kapiAramaPuani(kayit, sorgu) {
  const kelimeler = kapiNormal(sorgu).split(' ').filter(Boolean);
  if (!kelimeler.length || !kayit) return 0;
  const a = kapiAramaAlanlari(kayit);
  let toplam = 0;
  for (const k of kelimeler) {
    const b = kapiKelimeEslesmesi(k, a.baslik);
    const s = kapiKelimeEslesmesi(k, a.sinif);
    const d = kapiKelimeEslesmesi(k, a.diger);
    const puan = Math.max(b === 2 ? 5 : b === 1 ? 3 : 0, s ? 2 : 0, d ? 1 : 0);
    if (!puan) return 0;
    toplam += puan;
  }
  return toplam;
}

/* Başlıktaki arama kutusunun anlık sonuçları (senkron, ilk N). Arama
   sayfası aynı eşleşmeyi MolaVeri.liste({ temel: { q } }) ile alıyor. */
function kapiHizliAra(sorgu, bugun, adet) {
  return kapiListele({ q: sorgu }, bugun)
    .map(k => ({ k, p: kapiAramaPuani(k, sorgu), v: kapiPuan5(k, kapiIcerikTipi(k)).adet }))
    .sort((x, y) => (y.p - x.p) || (y.v - x.v))
    .slice(0, Math.max(0, Number(adet) || 8))
    .map(x => x.k);
}

/* Sorguyla adı eşleşen sınıflandırma sayfaları: arama sayfasında ve
   kutuda "Kapadokya Turları" gibi bir kısayol. */
function kapiAramaSayfalari(sorgu) {
  const kelimeler = kapiNormal(sorgu).split(' ').filter(Boolean);
  if (!kelimeler.length) return [];
  const T = kapiTaksonomi();
  const adaylar = []
    .concat(T.categories.map(c => ({ name: c.name, path: T.types[c.type].base + '/' + c.slug })))
    .concat(T.listings.map(l => ({ name: l.name, path: l.base + '/' + l.slug })))
    .concat(T.themes.map(x => ({ name: x.name, path: 'temalar/' + x.slug })))
    .concat(T.collections.map(x => ({ name: x.name, path: 'koleksiyonlar/' + x.slug })));
  return adaylar.filter(x => {
    const ad = kapiNormal(x.name);
    return kelimeler.every(k => kapiKelimeEslesmesi(k, ad));
  }).slice(0, 6);
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
  /* Erken rezervasyon: yürürlükte bir erken rezervasyon kampanyasının
     kapsamında olan ürün (booking-engine.js, REZ_KAMPANYALAR). */
  if (f.earlyBooking) {
    const erken = kapiRezFn('rezErkenRezervasyonVar');
    if (!erken || !erken(tip, kayit, bugun)) return false;
  }
  if (f.q && !kapiAramaPuani(kayit, f.q)) return false;
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
    /* TL fiyat süzgeci ve fiyat sıralaması bununla: tahsilat TL. */
    priceTRY: ozet.price > 0 ? kapiTLKarsiligi(ozet.price, ozet.currency) : 0,
    listPrice: ozet.listPrice,
    currency: ozet.currency,
    discounted: ozet.discounted,
    nights: ozet.nights,
    nextDate: tarihler ? (tarihler[0] || null) : ozet.nextDate,
    publishedAt: ozet.publishedAt,
    rating: puan.ortalama,
    ratingCount: puan.adet,
    facets: {
      tip: [T.types[tip].path],
      ay: tarihler ? tarihler.map(d => d.slice(0, 7)).filter((m, i, d) => d.indexOf(m) === i) : null,
      sure: dilim ? [dilim] : [],
      bolge: bolge ? [bolge.slug] : [],
      sehir: t.city ? [t.city] : [],
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
      note: 'Her gün satılan oteller, aktiviteler ve mekânlar her ayda listelenir.', notKosulu: 'joker' },
    { key: 'sure', name: 'Süre', kind: 'coklu',
      options: adli(deger('SUZ_SURE_DILIMLERI', typeof SUZ_SURE_DILIMLERI !== 'undefined' ? SUZ_SURE_DILIMLERI : undefined)) },
    { key: 'bolge', name: 'Bölge', kind: 'coklu', options: adli(T.regions) },
    { key: 'sehir', name: 'Şehir', kind: 'coklu', options: adli(T.cities) },
    { key: 'kalkis', name: 'Kalkış şehri', kind: 'coklu', options: adli(T.cities) },
    { key: 'ulasim', name: 'Ulaşım', kind: 'coklu', options: adli((T.facets && T.facets.transport) || []) },
    { key: 'pansiyon', name: 'Pansiyon', kind: 'coklu', options: adli((T.facets && T.facets.board) || []) },
    { key: 'tema', name: 'Tema', kind: 'coklu', options: adli(T.themes) },
    { key: 'kimle', name: 'Kimin için', kind: 'coklu',
      options: adli(T.collections.filter(c => c.mode === 'manual')) },
    { key: 'fiyat', name: 'Fiyat', kind: 'aralik', field: 'priceTRY',
      options: deger('SUZ_FIYAT_DILIMLERI', typeof SUZ_FIYAT_DILIMLERI !== 'undefined' ? SUZ_FIYAT_DILIMLERI : undefined).slice(),
      note: 'Döviz fiyatlı ürünler günün kuruyla TL\'ye çevrilerek süzülür; ödeme TL alınır.', notKosulu: 'doviz' },
    { key: 'puan', name: 'Puan', kind: 'esik', field: 'rating',
      options: deger('SUZ_PUAN_ESIKLERI', typeof SUZ_PUAN_ESIKLERI !== 'undefined' ? SUZ_PUAN_ESIKLERI : undefined).slice() },
    { key: 'indirimli', name: 'Fırsat', kind: 'bayrak', field: 'discounted',
      options: [{ slug: '1', name: 'Yalnızca indirimliler', etiket: 'İndirimli' }] }
  ];
}

/* Ürünün ait olduğu liste sayfası: detay sayfasının kırıntısındaki
   orta halka ve "benzerlerin tümü" bağı. Turda tur tipinin liste
   sayfası (Günübirlik/Konaklamalı Turlar), diğerlerinde tipin kökü. */
function kapiListeYolu(kayit) {
  const T = kapiTaksonomi();
  const tip = kapiIcerikTipi(kayit);
  if (!tip) return null;
  const tur = tip === 'tour' ? T.tourKinds[kayit.type] : null;
  return T.types[tip].base + (tur && tur.listing ? '/' + tur.listing : '');
}

/* ---------------- bu hafta: ajanda ----------------
   Önümüzdeki 7 günün (bugün dahil) sabit saatli planları, gün gün: tur
   kalkışları ve etkinlik temsilleri. Haftalık kalkan bir tur her
   kalkış gününde ayrı görünür. Her gün satılan ürünler (otel,
   aktivite, mekân) burada yok; onların "bu hafta"sı her gün. */
const KAPI_GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const KAPI_GUN_SLUG = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];

function kapiHaftaAjandasi(bugun, gunSayisi) {
  const gun = kapiISO(bugun || new Date());
  const n = Math.max(1, Number(gunSayisi) || 7);
  const son = kapiGunEkle(gun, n);
  const aylar = kapiDeger('AYLAR_TR', KAPI_TUR, typeof AYLAR_TR !== 'undefined' ? AYLAR_TR : undefined) || [];
  const gunler = [];
  for (let i = 0; i < n; i++) {
    const iso = kapiGunEkle(gun, i);
    const d = kapiAsDate(iso);
    gunler.push({
      tarih: iso,
      slug: KAPI_GUN_SLUG[d.getDay()],
      gunAdi: KAPI_GUN_ADLARI[d.getDay()],
      etiket: i === 0 ? 'Bugün' : (i === 1 ? 'Yarın' : KAPI_GUN_ADLARI[d.getDay()]),
      tarihMetni: d.getDate() + ' ' + (aylar[d.getMonth()] || '') + ' ' + KAPI_GUN_ADLARI[d.getDay()],
      ogeler: []
    });
  }
  const ekle = (iso, kayit, saat) => {
    const g = gunler.find(x => x.tarih === iso);
    if (g) g.ogeler.push({ kayit, saat: saat || '' });
  };
  kapiListele({ type: 'tour' }, gun).forEach(k => {
    const p = k.pricing || {};
    (kapiSabitTarihler(k, 'tour', gun) || []).filter(d => d < son).forEach(d => ekle(d, k, p.startTime));
  });
  const temsiller = kapiFn('upcomingPerformances', KAPI_ETKINLIK,
    typeof upcomingPerformances !== 'undefined' ? upcomingPerformances : null);
  kapiListele({ type: 'event' }, gun).forEach(k => {
    (temsiller ? temsiller(k, gun) : []).filter(t => t.date < son).forEach(t => ekle(t.date, k, t.time));
  });
  gunler.forEach(g => g.ogeler.sort((a, b) => String(a.saat).localeCompare(String(b.saat))
    || String(a.kayit.title).localeCompare(String(b.kayit.title), 'tr')));
  return gunler;
}

/* ---------------- benzer ürünler ----------------
   Kurala dayalı: aynı tipten, satışta olan ürünler; puan ortak
   sınıflandırmadan. Ana kategori ortaksa 3 (değilse başka bir ortak
   kategori 2), her ortak tema 2, aynı bölge 1, turda aynı tur tipi
   (günübirlik/konaklamalı) 1. Eşitlikte çok
   yorumlu önde. Hiç ortak yanı olmayan ürün "benzer" sayılmıyor.
   Backend geldiğinde satış ve görüntülenme verisi eklenecek (3. adım). */
function kapiBenzerler(kayit, bugun, adet) {
  const tip = kapiIcerikTipi(kayit);
  if (!tip) return [];
  const t = kayit.taxonomy || {};
  const anaKategori = (t.categories || [])[0] || null;
  const temalar = t.themes || [];
  const bolge = kapiUrunBolgesi(kayit);
  const puanla = (k) => {
    const kt = k.taxonomy || {};
    let p = 0;
    if (anaKategori && (kt.categories || []).indexOf(anaKategori) !== -1) p += 3;
    /* Ana olmayan ortak kategori (Aspendos: Sahne Sanatları + Festivaller). */
    else if ((t.categories || []).slice(1).some(c => (kt.categories || []).indexOf(c) !== -1)) p += 2;
    p += temalar.filter(x => (kt.themes || []).indexOf(x) !== -1).length * 2;
    const b = kapiUrunBolgesi(k);
    if (b && bolge && b.slug === bolge.slug) p += 1;
    if (tip === 'tour' && k.type === kayit.type) p += 1;
    return p;
  };
  return kapiListele({ type: tip }, bugun)
    .filter(k => k.slug !== kayit.slug)
    .map(k => ({ k, p: puanla(k), v: kapiPuan5(k, tip).adet }))
    .filter(x => x.p > 0)
    .sort((a, b) => (b.p - a.p) || (b.v - a.v) || String(a.k.title).localeCompare(String(b.k.title), 'tr'))
    .slice(0, Math.max(0, Number(adet) || 4))
    .map(x => x.k);
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
  if (temiz === 'arama') return { kind: 'search', path: temiz };
  /* Ödeme ve onay ekranları: ürün ve seçim adres satırında
     (?urun=tur/efes-sirince&tarih=…, ?kod=M360-…). Dizine girmezler. */
  if (temiz === 'rezervasyon') return { kind: 'checkout', path: temiz };
  if (temiz === 'rezervasyon/onay') return { kind: 'confirmation', path: temiz };
  if (temiz === 'kampanyalar') return { kind: 'campaigns', path: temiz };
  /* Menüdeki iki ürün sayfası: taksonomide "içerik dışı" duruyorlar ama
     ürün listeliyorlar. */
  if (temiz === 'yeni-eklenenler') return { kind: 'new', path: temiz };
  if (temiz === 'bu-hafta') return { kind: 'week', path: temiz };
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
  } else if (adres.kind === 'city') {
    const base = T.types[adres.type].base;
    const ad = adres.city.name + ' ' + (T.types[adres.type].cityTitle || T.types[adres.type].plural);
    m = {
      baslik: ad,
      tip: adres.type,
      temel: { type: adres.type, city: adres.city.slug },
      kirinti: [ana, tabanEtiketi(base), { name: ad, path: base + '/' + adres.city.slug }]
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
  } else if (adres.kind === 'new') {
    /* Bütün ürünler, en son eklenen başta (varsayılan sıralama "yeni"). */
    m = {
      baslik: kapiMenuEtiketi(adres.path) || 'Yeni Eklenenler',
      tip: null,
      temel: {},
      varsayilanSiralama: 'yeni',
      kirinti: [ana, { name: kapiMenuEtiketi(adres.path) || 'Yeni Eklenenler', path: adres.path }]
    };
  } else if (adres.kind === 'week') {
    m = {
      baslik: kapiMenuEtiketi(adres.path) || 'Bu Hafta',
      tip: null,
      temel: null,
      kirinti: [ana, { name: kapiMenuEtiketi(adres.path) || 'Bu Hafta', path: adres.path }]
    };
  } else if (adres.kind === 'checkout' || adres.kind === 'confirmation') {
    const baslik = adres.kind === 'checkout' ? 'Ödeme' : 'Rezervasyon onayı';
    m = { baslik, tip: null, temel: null, kirinti: [ana, { name: baslik, path: adres.path }] };
  } else if (adres.kind === 'static' || adres.kind === 'campaigns') {
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

/* Arama sayfasının modeli: sorgu adresin ?q= parametresinden. Arama
   sayfası dizine girmez (sonsuz sayıda ince sayfa üretir). */
function kapiAramaModeli(sorgu) {
  const q = String(sorgu || '').trim().slice(0, 80);
  return {
    kind: 'search',
    path: 'arama',
    q,
    baslik: q ? '“' + q + '” için sonuçlar' : 'Arama',
    tip: null,
    temel: q ? { q } : null,
    birim: 'sonuç',
    kirinti: [{ name: 'Anasayfa', path: '' }, { name: 'Arama', path: 'arama' }],
    altlar: kapiAramaSayfalari(q).map(x => ({ name: x.name, path: x.path, adet: null, aktif: false }))
  };
}

/* Sayfanın çipleri: menüde alt düğümü varsa onlar, yaprak sayfaysa
   kardeşleri (bulunduğu sayfa işaretli). Menüde olmayan sayfa (tema,
   koleksiyon, menu:false kategori) kendi ailesini gösterir. Ürünü
   olmayan çip gizli; bulunduğun sayfa hiç gizlenmez. */
function kapiAltSayfalar(adres, bugun) {
  const T = kapiTaksonomi();
  let adaylar = [];
  if (adres.kind === 'city') {
    /* Aynı tipin ürünü olan diğer şehirler. */
    const tt = T.types[adres.type];
    adaylar = T.cities.map(c => ({ name: c.name + ' ' + (tt.cityTitle || tt.plural), path: tt.base + '/' + c.slug }));
  } else if (adres.kind === 'theme') {
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
  if (adres.kind === 'city') return { type: adres.type, city: adres.city.slug };
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
    const q = s.temel && s.temel.q;
    const satirlar = kapiListele(s.temel || {}, s.bugun)
      .map(k => {
        const satir = kapiListeSatiri(k, s.bugun);
        /* Arama sonucunda "en alakalı" sıralamasının puanı. */
        if (satir && q) satir.alaka = kapiAramaPuani(k, q);
        return satir;
      }).filter(Boolean);
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

/* ---------------- kur ----------------
   Tahsilat TL: döviz fiyatlı ürünün TL karşılığı günün kuruyla. Sayfa
   yükü (senkron): kur günde bir değişiyor, sunucu sayfaya gömecek.
   Bağlayıcı kur rezervasyonda sabitlenir; buradaki karşılık "yaklaşık". */
function kapiKur(paraBirimi) {
  const kod = paraBirimi || 'TRY';
  if (kod === 'TRY') return { oran: 1, tarih: null, kaynak: null };
  const tablo = kapiDeger('ORNEK_KURLAR', KAPI_ENVANTER, typeof ORNEK_KURLAR !== 'undefined' ? ORNEK_KURLAR : undefined);
  const oran = tablo && tablo.oranlar ? Number(tablo.oranlar[kod]) : NaN;
  return Number.isFinite(oran) && oran > 0 ? { oran, tarih: tablo.tarih, kaynak: tablo.kaynak } : null;
}

/* TL karşılığı (tam TL'ye yukarı yuvarlı; müşteri aleyhine aşağı
   yuvarlanmış bir tahmin göstermemek için). Kur yoksa null. */
function kapiTLKarsiligi(tutar, paraBirimi) {
  const k = kapiKur(paraBirimi);
  const t = Number(tutar);
  if (!k || !Number.isFinite(t)) return null;
  return (paraBirimi || 'TRY') === 'TRY' ? t : Math.ceil(t * k.oran);
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

/* ---------------- rezervasyon ----------------
   Hesap booking-engine.js'te (saf). Kapı, ürünü ve günün kurunu verip
   teklifi alıyor, kontenjanı soruyor ve rezervasyonu yazıyor.

   Backend geldiğinde:
     fiyatTeklifi        POST /api/teklif        (aynı girdi, aynı cevap)
     rezervasyonOlustur  POST /api/rezervasyon   → ödeme sağlayıcısının
                         3D Secure sayfası → dönüşte onay
     rezervasyon(kod)    GET  /api/rezervasyon/:kod
   Bugün rezervasyon BU TARAYICIDA tutuluyor (localStorage) ve kart
   çekimi yok: onay ekranı bunu açıkça söylüyor. Kimlik numarası ve kart
   bilgisi hiçbir yere yazılmıyor. */
function kapiRezFn(ad) {
  return kapiFn(ad, KAPI_REZ, typeof globalThis !== 'undefined' ? globalThis[ad] : undefined);
}
function kapiRezDeger(ad) {
  if (KAPI_REZ && KAPI_REZ[ad] !== undefined) return KAPI_REZ[ad];
  try {
    /* const tablolar globalThis'te değil; betik kapsamında. */
    return ({ REZ_KAMPANYALAR: typeof REZ_KAMPANYALAR !== 'undefined' ? REZ_KAMPANYALAR : null,
      REZ_TAKSIT: typeof REZ_TAKSIT !== 'undefined' ? REZ_TAKSIT : null,
      REZ_KAPORA: typeof REZ_KAPORA !== 'undefined' ? REZ_KAPORA : null })[ad] || null;
  } catch (_) { return null; }
}

/* Kalan yer: teklifin kontenjan isteği ({ item, date, time, cikis,
   istenen }) kontenjan cevabında aranıyor. Satır yoksa "bilinmiyor" —
   satış engellenmez (sözleşme bölüm 6). */
function kapiKontenjanKontrol(tip, slug, istek, bugun) {
  if (!istek || !istek.item || !istek.date) return Promise.resolve({ durum: 'bilinmiyor', kalan: null });
  const son = istek.cikis ? kapiGunEkle(istek.cikis, -1) : istek.date;
  return kapiMusaitlik(tip, slug, { from: istek.date, to: son, today: bugun }).then(m => {
    let kalan = null;
    if (istek.cikis) kalan = konaklamaKalan(m, istek.item, istek.date, istek.cikis);
    else {
      const r = musaitlikKaydi(m, istek.item, istek.date, istek.time ? istek.time : undefined);
      kalan = r ? r.remaining : null;
    }
    return kontenjanDurumu(kalan, istek.istenen, 3);
  });
}

function kapiFiyatTeklifi(tip, slug, secim, secenek, bugun) {
  return Promise.resolve().then(() => {
    const teklifFn = kapiRezFn('rezTeklif');
    const kayit = kapiUrun(tip, slug);
    if (!teklifFn) return { tip, slug, satilabilir: false, hatalar: ['Ödeme adımı bu sayfada yüklenmedi.'] };
    const gun = kapiISO(bugun || new Date());
    /* Üyelik bağlamını ekran değil kapı veriyor (sunucuda oturumdan):
       kişisel kupon ve "ilk rezervasyon" kuralı buna bakıyor. */
    secenek = Object.assign({}, secenek || {}, { uye: kapiUyeBaglami() });
    const teklif = teklifFn(tip, kayit, secim, secenek, gun, { kur: kayit ? kapiKur(kayit.currency) : null,
      simdi: bugun instanceof Date ? bugun : null });
    if (!teklif.satilabilir || !teklif.kontenjan) return teklif;
    return kapiKontenjanKontrol(tip, slug, teklif.kontenjan, gun).then(d => {
      teklif.kontenjanDurumu = d;
      if (d.durum === 'doldu') {
        teklif.satilabilir = false;
        teklif.hatalar.push('Seçilen tarih doldu. Ürün sayfasından başka bir tarih seçin.');
      } else if (d.durum === 'yetersiz') {
        teklif.satilabilir = false;
        teklif.hatalar.push('Bu seçim için yalnızca ' + d.kalan + ' ' + (teklif.kontenjan.birim || 'yer') + ' kaldı.');
      }
      return teklif;
    });
  });
}

/* Tarayıcı deposu: localStorage; yoksa (Node, kapalı depo) bellek.
   Backend geldiğinde bu iki fonksiyonun yerini API çağrıları alacak. */
const KAPI_DEPO = {
  rezervasyonlar: 'mola360.rezervasyonlar',
  hesaplar: 'mola360.hesaplar',
  oturum: 'mola360.oturum',
  favoriler: 'mola360.favoriler',
  bildirim: 'mola360.bildirimDurumu',
  yorumlar: 'mola360.yorumlar'
};
const KAPI_BELLEK = {};
function kapiDepoOku(anahtar, varsayilan) {
  try {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(anahtar);
      if (v !== null) return JSON.parse(v);
      return varsayilan;
    }
  } catch (_) { /* kapalı depo: bellekten */ }
  return Object.prototype.hasOwnProperty.call(KAPI_BELLEK, anahtar) ? JSON.parse(KAPI_BELLEK[anahtar]) : varsayilan;
}
function kapiDepoYaz(anahtar, deger) {
  KAPI_BELLEK[anahtar] = JSON.stringify(deger);
  try {
    if (typeof localStorage !== 'undefined') {
      if (deger === null) localStorage.removeItem(anahtar);
      else localStorage.setItem(anahtar, JSON.stringify(deger));
    }
  } catch (_) { /* kota ya da kapalı depo: bellekte kalır */ }
}
function kapiRezOku() {
  const v = kapiDepoOku(KAPI_DEPO.rezervasyonlar, []);
  return Array.isArray(v) ? v : [];
}
function kapiRezYaz(liste) {
  kapiDepoYaz(KAPI_DEPO.rezervasyonlar, liste.slice(0, 50));
}

/* istek: { tip, slug, secim, secenek, form, beklenenTahsilat, bugun }
   Cevap (Promise): { tamam: true, kod, rezervasyon } ya da
   { tamam: false, hatalar: [{ alan, mesaj }], teklif }. Teklif yeniden
   hesaplanıyor: ekranın gösterdiği tutar değiştiyse (kur, kampanya,
   kontenjan) rezervasyon YAZILMIYOR, müşteri yeni tutarı görüyor. */
function kapiRezervasyonOlustur(istek) {
  const i = istek || {};
  return kapiFiyatTeklifi(i.tip, i.slug, i.secim, i.secenek, i.bugun).then(teklif => {
    const formHatalari = kapiRezFn('rezFormHatalari');
    const hatalar = (teklif.hatalar || []).map(m => ({ alan: null, mesaj: m }))
      .concat(teklif.satilabilir && formHatalari ? formHatalari(teklif, i.form) : []);
    if (!hatalar.length && i.beklenenTahsilat !== undefined && Number(i.beklenenTahsilat) !== teklif.tahsilat) {
      hatalar.push({ alan: null, mesaj: 'Tutar güncellendi. Yeni tutarı kontrol edip tekrar onaylayın.' });
    }
    if (hatalar.length) return { tamam: false, hatalar, teklif };

    const liste = kapiRezOku();
    const uret = kapiRezFn('rezKodUret');
    let kod = uret();
    while (liste.some(r => r.kod === kod)) kod = uret();
    const f = i.form || {};
    const il = f.iletisim || {};
    const hesap = kapiOturum();
    const kayit = {
      kod,
      hesapId: hesap ? hesap.id : null,
      olusturma: new Date().toISOString(),
      durum: 'odeme-bekliyor',
      deneme: true,
      tip: teklif.tip,
      slug: teklif.slug,
      baslik: teklif.baslik,
      secim: teklif.secim,
      ozet: teklif.ozet,
      baslangic: teklif.baslangic,
      paraBirimi: teklif.paraBirimi,
      kur: teklif.kur,
      satirlar: teklif.satirlar,
      araToplam: teklif.araToplam,
      araToplamTL: teklif.araToplamTL,
      indirimler: teklif.indirimler,
      toplam: teklif.toplam,
      odeme: teklif.odeme,
      taksit: { aile: teklif.taksit.aile, secilen: teklif.taksit.secilen },
      tahsilat: teklif.tahsilat,
      iptalKosullari: teklif.iptal,
      iletisim: { ad: String(il.ad || '').trim(), soyad: String(il.soyad || '').trim(),
        eposta: String(il.eposta || '').trim(), telefon: String(il.telefon || '').trim() },
      /* Yalnızca ad ve yaş; kimlik numarası saklanmıyor. */
      katilimcilar: (teklif.katilimcilar || []).map((s, n) => {
        const k = (f.katilimcilar || [])[n] || {};
        return { rol: s.rol, ad: s.adsiz ? '' : String(k.ad || '').trim(), soyad: s.adsiz ? '' : String(k.soyad || '').trim(),
          yas: s.yas ? Number(k.yas) : null };
      }),
      fatura: f.fatura && f.fatura.tur === 'kurumsal'
        ? { tur: 'kurumsal', unvan: String(f.fatura.unvan || '').trim() }
        : { tur: 'bireysel' },
      not: String(f.not || '').trim().slice(0, 500)
    };
    kapiRezYaz([kayit].concat(liste));
    const kisisel = (teklif.indirimler || []).find(x => x.kupon && hesap && (hesap.kuponlar || []).some(k => k.kod === x.kupon));
    if (kisisel) kapiHesapKaydet(kapiHspFn('hspKuponKullan')(hesap, kisisel.kupon, kod));
    return { tamam: true, kod, rezervasyon: kayit };
  });
}

function kapiRezervasyon(kod) {
  const k = String(kod || '').trim().toUpperCase();
  return Promise.resolve().then(() => kapiRezOku().find(r => r.kod === k) || null);
}

/* ---------------- hesap ----------------
   Üyelik, favoriler, bildirim durumu ve yorumlar. Kurallar
   account-engine.js'te (saf); burası depolama. Bugün BU TARAYICIDA
   (localStorage). Backend geldiğinde:
     oturum()             sayfaya gömülü oturum (çerez)
     uyeOl, girisYap      POST /api/uyelik, /api/giris (e-posta doğrulama,
                          şifre ya da tek kullanımlık kod)
     favoriDegistir       PUT/DELETE /api/hesap/favoriler/:tip/:slug
     hesapPaneli          GET /api/hesap (tek çağrı; panelin bütün verisi)
     rezervasyonIptal     POST /api/rezervasyon/:kod/iptal (iade sağlayıcıda)
   DENEME SÜRÜMÜNDE ŞİFRE YOK: şifre alınmıyor, saklanmıyor; giriş yalnızca
   bu tarayıcıdaki hesabı açıyor. Ekran bunu açıkça söylüyor. */
function kapiHspFn(ad) {
  return kapiFn(ad, KAPI_HESAP, typeof globalThis !== 'undefined' ? globalThis[ad] : undefined);
}
function kapiHesaplar() {
  const v = kapiDepoOku(KAPI_DEPO.hesaplar, []);
  return Array.isArray(v) ? v : [];
}
function kapiOturum() {
  const id = kapiDepoOku(KAPI_DEPO.oturum, null);
  return id ? (kapiHesaplar().find(h => h.id === id) || null) : null;
}
function kapiHesapKaydet(hesap) {
  if (!hesap) return;
  kapiDepoYaz(KAPI_DEPO.hesaplar, [hesap].concat(kapiHesaplar().filter(h => h.id !== hesap.id)));
}
function kapiHesapOlay(ad, ayrinti) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent('mola360:' + ad, { detail: ayrinti || null }));
}
function kapiHesabinRezervasyonlari(hesap) {
  const f = kapiHspFn('hspHesabinRezervasyonlari');
  return f ? f(hesap, kapiRezOku()) : [];
}
function kapiUyeBaglami() {
  const hesap = kapiOturum();
  const f = kapiHspFn('hspUyeBaglami');
  return hesap && f ? f(hesap, kapiHesabinRezervasyonlari(hesap)) : null;
}

function kapiUyeOl(form, simdi) {
  return Promise.resolve().then(() => {
    const hatalar = kapiHspFn('hspUyelikHatalari')(form);
    const eposta = String((form || {}).eposta || '').trim().toLowerCase();
    if (!hatalar.length && kapiHesaplar().some(h => h.eposta === eposta)) {
      hatalar.push({ alan: 'eposta', mesaj: 'Bu e-postayla bir hesap var; giriş yap.' });
    }
    if (hatalar.length) return { tamam: false, hatalar };
    const hesap = kapiHspFn('hspYeniHesap')(form, simdi || new Date());
    kapiHesapKaydet(hesap);
    kapiDepoYaz(KAPI_DEPO.oturum, hesap.id);
    kapiHesapOlay('oturum', { hesap });
    return { tamam: true, hesap };
  });
}

function kapiGirisYap(eposta) {
  return Promise.resolve().then(() => {
    const e = String(eposta || '').trim().toLowerCase();
    const hesap = kapiHesaplar().find(h => h.eposta === e);
    if (!hesap) return { tamam: false, hatalar: [{ alan: 'eposta', mesaj: 'Bu tarayıcıda bu e-postayla bir hesap yok. Üye olabilirsin.' }] };
    kapiDepoYaz(KAPI_DEPO.oturum, hesap.id);
    kapiHesapOlay('oturum', { hesap });
    return { tamam: true, hesap };
  });
}

function kapiCikisYap() {
  return Promise.resolve().then(() => {
    kapiDepoYaz(KAPI_DEPO.oturum, null);
    kapiHesapOlay('oturum', { hesap: null });
    return { tamam: true };
  });
}

/* Kişisel bilgiler: ad, soyad, e-posta, telefon; izinler ayrı. */
function kapiProfilGuncelle(alanlar) {
  return Promise.resolve().then(() => {
    const hesap = kapiOturum();
    if (!hesap) return { tamam: false, hatalar: [{ alan: null, mesaj: 'Oturum kapalı.' }] };
    const yeni = Object.assign({}, hesap, {
      ad: String(alanlar.ad || '').trim(), soyad: String(alanlar.soyad || '').trim(),
      eposta: String(alanlar.eposta || '').trim().toLowerCase(), telefon: String(alanlar.telefon || '').trim()
    });
    const hatalar = kapiHspFn('hspUyelikHatalari')(Object.assign({}, yeni, { kvkk: true }));
    if (!hatalar.length && kapiHesaplar().some(h => h.id !== hesap.id && h.eposta === yeni.eposta)) {
      hatalar.push({ alan: 'eposta', mesaj: 'Bu e-posta başka bir hesapta kayıtlı.' });
    }
    if (hatalar.length) return { tamam: false, hatalar };
    kapiHesapKaydet(yeni);
    kapiHesapOlay('oturum', { hesap: yeni });
    return { tamam: true, hesap: yeni };
  });
}

function kapiIzinGuncelle(izinler) {
  return Promise.resolve().then(() => {
    const hesap = kapiOturum();
    if (!hesap) return { tamam: false };
    const yeni = Object.assign({}, hesap, { izinler: { eposta: !!(izinler || {}).eposta, sms: !!(izinler || {}).sms } });
    kapiHesapKaydet(yeni);
    return { tamam: true, hesap: yeni };
  });
}

/* Hesabı sil: hesap ve oturum bu tarayıcıdan kalkar. Rezervasyonlar
   kalır (satış kaydı); hesaba bağları çözülür. */
function kapiHesabiSil() {
  return Promise.resolve().then(() => {
    const hesap = kapiOturum();
    if (!hesap) return { tamam: false };
    kapiDepoYaz(KAPI_DEPO.hesaplar, kapiHesaplar().filter(h => h.id !== hesap.id));
    kapiDepoYaz(KAPI_DEPO.oturum, null);
    kapiRezYaz(kapiRezOku().map(r => r.hesapId === hesap.id ? Object.assign({}, r, { hesapId: null }) : r));
    kapiHesapOlay('oturum', { hesap: null });
    return { tamam: true };
  });
}

/* Favoriler: misafir de ekleyebilir (bu tarayıcıda); yayından kalkan
   ürün listeden düşer. */
function kapiFavoriler() {
  const v = kapiDepoOku(KAPI_DEPO.favoriler, []);
  return (Array.isArray(v) ? v : []).filter(x => x && kapiUrun(x.tip, x.slug));
}
function kapiFavoriMi(tip, slug) {
  return kapiFavoriler().some(x => x.tip === tip && x.slug === slug);
}
function kapiFavoriDegistir(tip, slug, simdi) {
  return Promise.resolve().then(() => {
    if (!kapiUrun(tip, slug)) return false;
    const liste = kapiHspFn('hspFavoriDegistir')(kapiFavoriler(), tip, slug, simdi || new Date());
    kapiDepoYaz(KAPI_DEPO.favoriler, liste);
    const var_ = liste.some(x => x.tip === tip && x.slug === slug);
    kapiHesapOlay('favori', { tip, slug, favori: var_ });
    return var_;
  });
}

/* Bildirimler (sayfa yükü): hesabın durumundan türetilmiş liste +
   okundu/kaldırıldı işaretleri. Misafirde favori bildirimleri. */
function kapiBildirimDurumu() {
  const v = kapiDepoOku(KAPI_DEPO.bildirim, {});
  return { okunan: (v && v.okunan) || [], kaldirilan: (v && v.kaldirilan) || [] };
}
function kapiBildirimler(simdi) {
  const uret = kapiHspFn('hspBildirimler');
  if (!uret) return [];
  const hesap = kapiOturum();
  const an = simdi || new Date();
  const favoriler = kapiFavoriler().map(f => {
    const kayit = kapiUrun(f.tip, f.slug);
    return Object.assign({}, f, { baslik: kayit.title, ozet: kapiOzet(kayit, kapiISO(an)), yol: (KAPI_TIPLER[f.tip] ? kapiTaksonomi().types[f.tip].path + '/' + f.slug + '/' : null) });
  });
  const durum = kapiBildirimDurumu();
  return uret({ hesap, rezervasyonlar: hesap ? kapiHesabinRezervasyonlari(hesap) : [], favoriler, urunBul: kapiUrun, simdi: an })
    .filter(n => durum.kaldirilan.indexOf(n.id) === -1)
    .map(n => Object.assign(n, { unread: durum.okunan.indexOf(n.id) === -1 }));
}
function kapiBildirimIsaretle(idler, tur) {
  const durum = kapiBildirimDurumu();
  const liste = tur === 'kaldir' ? durum.kaldirilan : durum.okunan;
  (Array.isArray(idler) ? idler : [idler]).forEach(id => { if (id && liste.indexOf(id) === -1) liste.push(id); });
  /* Sınırsız büyümesin: son 300 işaret. */
  kapiDepoYaz(KAPI_DEPO.bildirim, { okunan: durum.okunan.slice(-300), kaldirilan: durum.kaldirilan.slice(-300) });
}

function kapiYorumlar() {
  const v = kapiDepoOku(KAPI_DEPO.yorumlar, []);
  return Array.isArray(v) ? v : [];
}

/* Panelin bütün verisi (tek çağrı). simdi: Date. */
function kapiHesapPaneli(simdi) {
  return Promise.resolve().then(() => {
    const an = simdi || new Date();
    const H = (ad) => kapiHspFn(ad);
    const hesap = kapiOturum();
    const favoriler = kapiFavoriler().map(f => Object.assign({}, f, { kayit: kapiUrun(f.tip, f.slug) }));
    if (!hesap) return { hesap: null, favoriler, bildirimler: kapiBildirimler(an) };
    const yorumlar = kapiYorumlar().filter(y => y.hesapId === hesap.id);
    const rezervasyonlar = kapiHesabinRezervasyonlari(hesap)
      .sort((a, b) => String(((a.baslangic || {}).tarih) || '').localeCompare(String(((b.baslangic || {}).tarih) || '')))
      .map(r => Object.assign({}, r, {
        durumu: H('hspRezervasyonDurumu')(r, an),
        iptalOnizleme: H('hspIptalOnizleme')(r, an),
        yorumYazilabilir: H('hspYorumYazilabilir')(r, yorumlar, an)
      }));
    const hareketler = H('hspPuanHareketleri')(rezervasyonlar, kapiUrun, an);
    const puan = H('hspPuanOzeti')(hareketler);
    return {
      hesap,
      rezervasyonlar,
      biletler: rezervasyonlar.filter(r => r.durumu === 'yaklasan').reduce((t, r) => t.concat(H('hspBiletler')(r)), []),
      puan: Object.assign({ hareketler, seviye: H('hspSeviye')(puan.bakiye) }, puan),
      kuponlar: H('hspKuponlar')(hesap, an),
      favoriler,
      yorumlar,
      bildirimler: kapiBildirimler(an)
    };
  });
}

function kapiRezervasyonIptal(kod, simdi) {
  return Promise.resolve().then(() => {
    const hesap = kapiOturum();
    const liste = kapiRezOku();
    const r = liste.find(x => x.kod === String(kod || '').toUpperCase());
    const benim = r && hesap && kapiHspFn('hspHesabinRezervasyonlari')(hesap, [r]).length > 0;
    if (!benim) return { tamam: false, mesaj: 'Rezervasyon bu hesapta değil.' };
    const yeni = kapiHspFn('hspIptalEt')(r, simdi || new Date());
    if (!yeni) return { tamam: false, mesaj: kapiHspFn('hspIptalOnizleme')(r, simdi || new Date()).neden };
    kapiRezYaz(liste.map(x => x.kod === r.kod ? yeni : x));
    kapiHesapOlay('rezervasyon', { kod: r.kod });
    return { tamam: true, rezervasyon: yeni };
  });
}

/* Misafirin rezervasyonunu bulması: kod + e-posta ikisi birden. */
function kapiRezervasyonSorgula(kod, eposta) {
  return Promise.resolve().then(() => {
    const k = String(kod || '').trim().toUpperCase();
    const e = String(eposta || '').trim().toLowerCase();
    if (!k || !e) return null;
    return kapiRezOku().find(r => r.kod === k && String((r.iletisim || {}).eposta || '').toLowerCase() === e) || null;
  });
}

function kapiYorumYaz(yorum, simdi) {
  return Promise.resolve().then(() => {
    const hesap = kapiOturum();
    if (!hesap) return { tamam: false, hatalar: [{ alan: null, mesaj: 'Yorum için giriş yap.' }] };
    const y = yorum || {};
    const r = kapiHesabinRezervasyonlari(hesap).find(x => x.kod === y.kod);
    const yorumlar = kapiYorumlar();
    if (!r || !kapiHspFn('hspYorumYazilabilir')(r, yorumlar.filter(x => x.hesapId === hesap.id), simdi || new Date())) {
      return { tamam: false, hatalar: [{ alan: null, mesaj: 'Bu rezervasyona yorum yazılamaz.' }] };
    }
    const hatalar = kapiHspFn('hspYorumHatalari')(y);
    if (hatalar.length) return { tamam: false, hatalar };
    const kayit = { kod: r.kod, hesapId: hesap.id, tip: r.tip, slug: r.slug, baslik: r.baslik,
      puan: Number(y.puan), metin: String(y.metin).trim(), t: (simdi || new Date()).toISOString(), durum: 'onay-bekliyor' };
    kapiDepoYaz(KAPI_DEPO.yorumlar, [kayit].concat(yorumlar));
    return { tamam: true, yorum: kayit };
  });
}

/* Yürürlükteki kampanyalar (sayfa yükü): kampanyalar sayfası, ana sayfa
   bantları. kalanGun: bitişe bir haftadan az kaldıysa gün sayısı. */
function kapiKampanyalar(bugun) {
  const aktif = kapiRezFn('rezAktifKampanyalar');
  const kalan = kapiRezFn('rezKalanGun');
  if (!aktif) return [];
  const gun = kapiISO(bugun || new Date());
  return aktif(gun).map(k => Object.assign({}, k, { kalanGun: kalan ? kalan(k, gun) : null }));
}

/* Ödeme adresinden ürün ve seçim: ?urun=tur/efes-sirince&tarih=… */
function kapiOdemeAdresiOku(sorgu) {
  const oku = kapiRezFn('rezSecimOku');
  const coz = kapiRezFn('rezUrunCoz');
  if (!oku || !coz) return null;
  const m = String(sorgu || '').match(/[?&]urun=([^&#]*)/);
  let deger = m ? m[1] : '';
  try { deger = decodeURIComponent(deger); } catch (_) { /* olduğu gibi */ }
  const u = coz(deger);
  if (!u || !kapiUrun(u.tip, u.slug)) return null;
  return { tip: u.tip, slug: u.slug, secim: oku(u.tip, sorgu) };
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
  kur: kapiKur,
  tlKarsiligi: kapiTLKarsiligi,
  /* liste sayfaları (sayfa yükü) */
  adres: kapiAdres,
  listeYolu: kapiListeYolu,
  haftaAjandasi: kapiHaftaAjandasi,
  hizliAra: kapiHizliAra,
  aramaModeli: kapiAramaModeli,
  aramaSayfalari: kapiAramaSayfalari,
  benzerler: kapiBenzerler,
  sayfaModeli: kapiSayfaModeli,
  listeSeo: kapiListeSeo,
  yuzeyTanimlari: kapiYuzeyTanimlari,
  listeSatiri: kapiListeSatiri,
  /* rezervasyon (sayfa yükü) */
  kampanyalar: kapiKampanyalar,
  kartAileleri: () => ((kapiRezDeger('REZ_TAKSIT') || {}).aileler || []).slice(),
  taksitTablosu: (tutar) => { const f = kapiRezFn('rezTaksitTablosu'); return f ? f(tutar) : null; },
  odemeYolu: (tip, slug, secim) => { const f = kapiRezFn('rezOdemeYolu'); return f ? f(tip, slug, secim) : ''; },
  odemeAdresiOku: kapiOdemeAdresiOku,
  /* canlı sorgu (Promise) */
  liste: kapiListeSorgusu,
  musaitlik: kapiMusaitlik,
  fiyatTeklifi: kapiFiyatTeklifi,
  rezervasyonOlustur: kapiRezervasyonOlustur,
  rezervasyon: kapiRezervasyon,
  rezervasyonlar: () => Promise.resolve().then(() => kapiRezOku()),
  rezervasyonSorgula: kapiRezervasyonSorgula,
  rezervasyonIptal: kapiRezervasyonIptal,
  /* hesap: sayfa yükü (oturum, favori, bildirim) + işlemler (Promise) */
  oturum: kapiOturum,
  uyeOl: kapiUyeOl,
  girisYap: kapiGirisYap,
  cikisYap: kapiCikisYap,
  profilGuncelle: kapiProfilGuncelle,
  izinGuncelle: kapiIzinGuncelle,
  hesabiSil: kapiHesabiSil,
  favoriler: kapiFavoriler,
  favoriMi: kapiFavoriMi,
  favoriDegistir: kapiFavoriDegistir,
  bildirimler: kapiBildirimler,
  bildirimOkundu: (idler) => kapiBildirimIsaretle(idler, 'oku'),
  bildirimKaldir: (idler) => kapiBildirimIsaretle(idler, 'kaldir'),
  hesapPaneli: kapiHesapPaneli,
  yorumYaz: kapiYorumYaz
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
    kapiNormal,
    kapiAramaPuani,
    kapiPuan5,
    kapiSabitTarihler,
    musaitlikKaydi,
    saatAnahtari,
    konaklamaKalan,
    tarihDoluMu,
    kontenjanDurumu
  };
}
