/* Tur icerik sayfasi (tur.html) testleri.

   Iki bolum var:
   1) Saf fonksiyonlar — fiyat, tarih, iade, puan. Bunlar DOM'a dokunmadigi
      icin dogrudan cagrilir.
   2) Icerik butunlugu — tur.html, tour-page.js ve app.js metin olarak
      okunup birbirine bagli yerler karsilastirilir: menude hedefi olmayan
      sekme, sayfada karsiligi olmayan kap, anasayfada tur sayfasindan
      farkli bir fiyat gibi sessiz kaymalar burada yakalanir. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  TOURS,
  DEFAULT_TOUR_SLUG,
  TOUR_IMAGE_FILES,
  TOUR_ICONS,
  AYLAR_TR,
  GUNLER_TR,
  GUNLER_TR_KISA,
  commonsImageUrl,
  tourImage,
  formatNumberTR,
  formatTRY,
  asDate,
  toISODate,
  formatTrDate,
  trDateParts,
  nextDepartureDates,
  seatsLeft,
  clampParty,
  calcTotal,
  discountPercent,
  refundTier,
  refundAmount,
  ratingSummary,
  filterReviews,
  reviewerInitials,
  tourSlugFromQuery,
  resolveTour,
} from '../assets/js/tour-data.js';

const sayfa = readFileSync(new URL('../tur.html', import.meta.url), 'utf8');
const sayfaJs = readFileSync(new URL('../assets/js/tour-page.js', import.meta.url), 'utf8');
const veriJs = readFileSync(new URL('../assets/js/tour-data.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');

const tur = TOURS[DEFAULT_TOUR_SLUG];

/* ---------------- sayi ve tarih ---------------- */
describe('biçimlendirme', () => {
  it('binlik ayırıcı nokta, kuruş yok', () => {
    expect(formatNumberTR(0)).toBe('0');
    expect(formatNumberTR(890)).toBe('890');
    expect(formatNumberTR(1290)).toBe('1.290');
    expect(formatNumberTR(1234567)).toBe('1.234.567');
    expect(formatNumberTR(1290.6)).toBe('1.291');
    expect(formatNumberTR(-250)).toBe('-250');
    expect(formatTRY(1290)).toBe('1.290 TL');
  });

  it('geçersiz girdide sıfırlanır, patlamaz', () => {
    expect(formatNumberTR(undefined)).toBe('0');
    expect(formatNumberTR('abc')).toBe('0');
    expect(formatTRY(null)).toBe('0 TL');
  });

  it('ay ve gün adları eksiksiz', () => {
    expect(AYLAR_TR).toHaveLength(12);
    expect(GUNLER_TR).toHaveLength(7);
    expect(GUNLER_TR_KISA).toHaveLength(7);
    expect(GUNLER_TR[0]).toBe('Pazar');
  });

  it('ISO tarih yerel gece yarısından kurulur (gün kaymaz)', () => {
    /* UTC ile kurulunca +03 saat diliminde tarih bir gun geriye kayiyordu. */
    const d = asDate('2026-10-11');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(11);
    expect(toISODate(d)).toBe('2026-10-11');
    expect(toISODate('2026-01-05')).toBe('2026-01-05');
  });

  it('tarih metni Türkçe ve tam', () => {
    expect(formatTrDate('2026-10-11')).toBe('11 Ekim Pazar');
    expect(formatTrDate('2026-09-19')).toBe('19 Eylül Cumartesi');
    expect(trDateParts('2026-10-11')).toEqual({ gun: '11', ay: 'Ekim', hafta: 'Paz', iso: '2026-10-11' });
  });

  it('bozuk tarih boş döner', () => {
    expect(formatTrDate('')).toBe('');
    expect(formatTrDate('abc')).toBe('');
    expect(toISODate(null)).toBe('');
  });
});

describe('nextDepartureDates', () => {
  const gunler = tur.pricing.departureDays;

  it('yalnızca kalkış günlerini döndürür', () => {
    const liste = nextDepartureDates('2026-09-19', gunler, 12, 1);
    expect(liste).toHaveLength(12);
    liste.forEach(iso => expect(gunler).toContain(asDate(iso).getDay()));
  });

  it('bugünü satmaz: en erken leadDays sonrası', () => {
    /* 2026-09-19 cumartesi; kalkis gunu olsa bile leadDays=1 ile atlanir. */
    const liste = nextDepartureDates('2026-09-19', gunler, 3, 1);
    expect(liste[0]).toBe('2026-09-20');
    expect(nextDepartureDates('2026-09-19', gunler, 1, 0)[0]).toBe('2026-09-19');
  });

  it('sıralı ve tekrarsız', () => {
    const liste = nextDepartureDates('2026-09-19', gunler, 18, 1);
    expect(new Set(liste).size).toBe(18);
    expect(liste.slice().sort()).toEqual(liste);
  });

  it('gün listesi boşsa her günü verir, adet 0 ise boş döner', () => {
    expect(nextDepartureDates('2026-09-19', [], 3, 1)).toEqual(['2026-09-20', '2026-09-21', '2026-09-22']);
    expect(nextDepartureDates('2026-09-19', gunler, 0, 1)).toEqual([]);
  });

  it('ay ve yıl sınırını geçer', () => {
    const liste = nextDepartureDates('2026-12-28', gunler, 4, 1);
    expect(liste[0].startsWith('2026-12')).toBe(true);
    expect(liste.some(iso => iso.startsWith('2027-01'))).toBe(true);
  });
});

describe('seatsLeft', () => {
  it('aynı tarih her zaman aynı sayıyı verir', () => {
    expect(seatsLeft('2026-10-11', 16)).toBe(seatsLeft('2026-10-11', 16));
  });

  it('2 ile kapasite (en çok 9) arasında kalır', () => {
    nextDepartureDates('2026-09-19', tur.pricing.departureDays, 30, 1).forEach(iso => {
      const kalan = seatsLeft(iso, 16);
      expect(kalan).toBeGreaterThanOrEqual(2);
      expect(kalan).toBeLessThanOrEqual(9);
    });
  });

  it('farklı tarihler farklı sayılar üretebilir', () => {
    const liste = nextDepartureDates('2026-09-19', tur.pricing.departureDays, 12, 1)
      .map(iso => seatsLeft(iso, 16));
    expect(new Set(liste).size).toBeGreaterThan(1);
  });
});

/* ---------------- fiyat ---------------- */
describe('clampParty', () => {
  it('en az bir yetişkin kalır', () => {
    expect(clampParty(tur, { adults: 0 }).adults).toBe(1);
    expect(clampParty(tur, { adults: -5 }).adults).toBe(1);
    expect(clampParty(tur, {}).adults).toBe(1);
  });

  it('yetişkin + çocuk üst sınırı geçmez', () => {
    const enFazla = tur.pricing.maxGuests;
    const sonuc = clampParty(tur, { adults: 20, children: 20 });
    expect(sonuc.adults).toBe(enFazla);
    expect(sonuc.children).toBe(0);
    const ikinci = clampParty(tur, { adults: 2, children: 20 });
    expect(ikinci.adults + ikinci.children).toBe(enFazla);
  });

  it('bebek sayısı yetişkin sayısını ve üst sınırı geçmez', () => {
    expect(clampParty(tur, { adults: 1, infants: 3 }).infants).toBe(1);
    expect(clampParty(tur, { adults: 4, infants: 9 }).infants).toBe(tur.pricing.maxInfants);
    expect(clampParty(tur, { adults: 2, infants: -1 }).infants).toBe(0);
  });

  it('ondalık girdi aşağı yuvarlanır', () => {
    expect(clampParty(tur, { adults: 2.9, children: 1.7 })).toEqual({ adults: 2, children: 1, infants: 0 });
  });
});

describe('calcTotal', () => {
  it('yetişkin ve çocuk ayrı tarifeden toplanır', () => {
    const h = calcTotal(tur, { adults: 2, children: 1 });
    expect(h.adultTotal).toBe(2 * tur.pricing.adult);
    expect(h.childTotal).toBe(1 * tur.pricing.child);
    expect(h.subtotal).toBe(h.adultTotal + h.childTotal);
    expect(h.total).toBe(h.subtotal);
  });

  it('bebek ücret eklemez ama kişi sayısına girer', () => {
    const h = calcTotal(tur, { adults: 2, infants: 1 });
    expect(h.total).toBe(2 * tur.pricing.adult);
    expect(h.payingGuests).toBe(2);
    expect(h.guests).toBe(3);
  });

  it('kişi başı ek seçenek ücretli kişi sayısıyla çarpılır', () => {
    const ek = tur.addons.find(a => a.per === 'guest');
    const h = calcTotal(tur, { adults: 2, children: 1, infants: 1, addons: [ek.id] });
    expect(h.addonsTotal).toBe(ek.price * 3);
    expect(h.total).toBe(h.subtotal + ek.price * 3);
  });

  it('rezervasyon başı ek seçenek bir kez eklenir', () => {
    const ek = tur.addons.find(a => a.per === 'booking');
    const h = calcTotal(tur, { adults: 4, addons: [ek.id] });
    expect(h.addonsTotal).toBe(ek.price);
  });

  it('bilinmeyen ek seçenek yok sayılır', () => {
    const h = calcTotal(tur, { adults: 1, addons: ['yok', 'hicbiri'] });
    expect(h.addons).toEqual([]);
    expect(h.addonsTotal).toBe(0);
  });

  it('liste fiyatına göre avantaj hesaplanır ve toplama karışmaz', () => {
    const h = calcTotal(tur, { adults: 2, children: 2 });
    const beklenen = 2 * (tur.pricing.adultList - tur.pricing.adult)
      + 2 * (tur.pricing.childList - tur.pricing.child);
    expect(h.saving).toBe(beklenen);
    expect(h.total).toBe(h.subtotal);
    expect(h.listSubtotal).toBe(h.subtotal + h.saving);
  });

  it('sınırlar uygulanmış hâliyle döner (ekrandaki sayı ile aynı)', () => {
    const h = calcTotal(tur, { adults: 99, children: 99, infants: 99 });
    expect(h.adults + h.children).toBe(tur.pricing.maxGuests);
    expect(h.infants).toBeLessThanOrEqual(tur.pricing.maxInfants);
  });

  it('veri nesnesini değiştirmez', () => {
    const once = JSON.stringify(tur);
    calcTotal(tur, { adults: 3, children: 2, addons: tur.addons.map(a => a.id) });
    expect(JSON.stringify(tur)).toBe(once);
  });
});

describe('discountPercent', () => {
  it('liste fiyatına göre indirim yüzdesi', () => {
    expect(discountPercent(1690, 1290)).toBe(24);
    expect(discountPercent(1000, 750)).toBe(25);
  });

  it('indirim yoksa sıfır', () => {
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(1000, 1200)).toBe(0);
    expect(discountPercent(0, 500)).toBe(0);
    expect(discountPercent(undefined, undefined)).toBe(0);
  });
});

/* ---------------- iptal / iade ---------------- */
describe('iade basamakları', () => {
  const tiers = tur.cancellation.tiers;

  it('kalan süreye göre doğru basamak', () => {
    expect(refundTier(72, tiers).rate).toBe(1);
    expect(refundTier(48, tiers).rate).toBe(1);
    expect(refundTier(47, tiers).rate).toBe(0.5);
    expect(refundTier(24, tiers).rate).toBe(0.5);
    expect(refundTier(23, tiers).rate).toBe(0);
    expect(refundTier(0, tiers).rate).toBe(0);
  });

  it('tur başlamışsa (negatif saat) iade yok', () => {
    expect(refundTier(-5, tiers).rate).toBe(0);
    expect(refundAmount(1290, -5, tiers)).toBe(0);
  });

  it('basamaklar veride sırasız yazılmış olsa da doğru çalışır', () => {
    const karisik = tiers.slice().reverse();
    expect(refundTier(72, karisik).rate).toBe(1);
    expect(refundTier(30, karisik).rate).toBe(0.5);
  });

  it('iade tutarı tam TL', () => {
    expect(refundAmount(1290, 72, tiers)).toBe(1290);
    expect(refundAmount(1290, 30, tiers)).toBe(645);
    expect(refundAmount(1295, 30, tiers)).toBe(648);
  });

  it('basamak yoksa güvenli döner', () => {
    expect(refundTier(10, [])).toBe(null);
    expect(refundAmount(1000, 10, [])).toBe(0);
  });

  it('veride oranlar 0-1 arası ve en alt basamak 0 saatten başlar', () => {
    tiers.forEach(t => {
      expect(t.rate).toBeGreaterThanOrEqual(0);
      expect(t.rate).toBeLessThanOrEqual(1);
      expect(t.label).toBeTruthy();
      expect(t.text).toBeTruthy();
    });
    expect(Math.min.apply(null, tiers.map(t => t.minHours))).toBe(0);
  });
});

/* ---------------- puanlar ve yorumlar ---------------- */
describe('ratingSummary', () => {
  it('ortalama dağılımdan hesaplanır', () => {
    const o = ratingSummary({ 5: 1, 4: 1 });
    expect(o.total).toBe(2);
    expect(o.average).toBe(4.5);
  });

  it('yüzdeler dağılımla tutarlı, satırlar 5’ten 1’e', () => {
    const o = ratingSummary(tur.ratingBreakdown);
    expect(o.rows.map(r => r.star)).toEqual([5, 4, 3, 2, 1]);
    expect(o.total).toBe(Object.values(tur.ratingBreakdown).reduce((a, b) => a + b, 0));
    o.rows.forEach(r => {
      expect(r.percent).toBe(Math.round((r.count / o.total) * 100));
    });
  });

  it('boş dağılımda sıfıra düşer, bölme hatası vermez', () => {
    const o = ratingSummary({});
    expect(o.total).toBe(0);
    expect(o.average).toBe(0);
    expect(o.rows.every(r => r.percent === 0)).toBe(true);
    expect(ratingSummary(undefined).average).toBe(0);
  });
});

describe('filterReviews', () => {
  it('yıldız verilmezse tüm yorumlar', () => {
    expect(filterReviews(tur.reviews, 0)).toHaveLength(tur.reviews.length);
    expect(filterReviews(tur.reviews, null)).toHaveLength(tur.reviews.length);
  });

  it('yıldıza göre süzer', () => {
    filterReviews(tur.reviews, 5).forEach(r => expect(r.rating).toBe(5));
    const parcalar = [5, 4, 3, 2, 1].reduce((t, s) => t + filterReviews(tur.reviews, s).length, 0);
    expect(parcalar).toBe(tur.reviews.length);
  });

  it('kaynağı değiştirmez, geçersiz girdide boş döner', () => {
    filterReviews(tur.reviews, 0).pop();
    expect(tur.reviews).toHaveLength(8);
    expect(filterReviews(null, 0)).toEqual([]);
  });
});

describe('reviewerInitials', () => {
  it('en çok iki harf, Türkçe büyütme', () => {
    expect(reviewerInitials('Bedir İnci')).toBe('Bİ');
    expect(reviewerInitials('elif karaca')).toBe('EK');
    expect(reviewerInitials('ismail hakkı uzun')).toBe('İH');
    expect(reviewerInitials('Can')).toBe('C');
    expect(reviewerInitials('')).toBe('');
  });
});

/* ---------------- tur çözümleme ---------------- */
describe('slug çözümleme', () => {
  it('?tur=... okunur', () => {
    expect(tourSlugFromQuery('?tur=efes-sirince')).toBe('efes-sirince');
    expect(tourSlugFromQuery('?a=1&tur=efes-sirince&b=2')).toBe('efes-sirince');
    expect(tourSlugFromQuery('?tur=efes-sirince#program')).toBe('efes-sirince');
    expect(tourSlugFromQuery('')).toBe('');
    expect(tourSlugFromQuery('?baska=1')).toBe('');
  });

  it('bozuk yüzde kodlaması patlamaz', () => {
    expect(tourSlugFromQuery('?tur=%E0%A4%A')).toBe('');
  });

  it('bilinmeyen veya boş slug varsayılan tura düşer', () => {
    expect(resolveTour('efes-sirince')).toBe(tur);
    expect(resolveTour('EFES-SIRINCE'.toLowerCase())).toBe(tur);
    expect(resolveTour('olmayan-tur')).toBe(tur);
    expect(resolveTour('')).toBe(tur);
    expect(resolveTour(undefined)).toBe(tur);
  });

  it('prototip anahtarları tur sanılmaz', () => {
    expect(resolveTour('constructor')).toBe(tur);
    expect(resolveTour('__proto__')).toBe(tur);
  });
});

/* ---------------- görseller ---------------- */
describe('görseller', () => {
  it('adres Commons dosya adından deterministik kurulur', () => {
    expect(commonsImageUrl('Ephesus Celsus Library Façade.jpg', 800))
      .toBe('https://commons.wikimedia.org/wiki/Special:FilePath/Ephesus_Celsus_Library_Fa%C3%A7ade.jpg?width=800');
  });

  it('app.js ile ortak anahtarlarda adres birebir aynı', () => {
    /* Ayni fotograf iki dosyada iki farkli adrese gitmesin. */
    const ortak = ['pamukkale', 'alacati', 'bodrum', 'kemeralti'];
    ortak.forEach(anahtar => {
      expect(app, anahtar + ' cardImages icinde yok').toContain('"' + anahtar + '": "' + tourImage(anahtar, 800) + '"');
    });
  });

  it('kullanılan her görsel anahtarı kayıtlı', () => {
    const kullanilan = new Set();
    tur.gallery.forEach(g => kullanilan.add(g.key));
    tur.similar.forEach(s => kullanilan.add(s.key));
    const eksik = [...kullanilan].filter(k => !TOUR_IMAGE_FILES[k]);
    expect(eksik, 'kayıtsız görsel anahtarı: ' + eksik.join(', ')).toEqual([]);
    kullanilan.forEach(k => expect(tourImage(k, 800)).toMatch(/^https:\/\/commons\.wikimedia\.org\//));
  });

  it('her kayıtlı görselin dosya adı ve açıklaması var', () => {
    Object.entries(TOUR_IMAGE_FILES).forEach(([anahtar, kayit]) => {
      expect(kayit.dosya, anahtar).toMatch(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/);
      expect(kayit.ad, anahtar).toBeTruthy();
    });
  });

  it('kayıtsız anahtar sessizce rastgele fotoğrafa düşmez', () => {
    expect(tourImage('olmayan', 800)).toBe('');
  });
});

/* ---------------- ikonlar ---------------- */
describe('ikonlar', () => {
  it('kullanılan her ikon TOUR_ICONS içinde tanımlı', () => {
    const kullanilan = new Set();
    for (const m of sayfaJs.matchAll(/(?:ic|tourSvg)\('([a-zA-Z0-9]+)'\)/g)) kullanilan.add(m[1]);
    for (const m of veriJs.matchAll(/icon:\s*'([a-zA-Z0-9]+)'/g)) kullanilan.add(m[1]);
    const eksik = [...kullanilan].filter(k => !TOUR_ICONS[k]);
    expect(eksik, 'tanımsız ikon: ' + eksik.join(', ')).toEqual([]);
    expect(kullanilan.size).toBeGreaterThan(12);
  });

  it('her ikon geçerli bir SVG gövdesi', () => {
    Object.entries(TOUR_ICONS).forEach(([ad, govde]) => {
      expect(govde, ad).toMatch(/^<(path|circle|rect|line|polyline|polygon)/);
    });
  });
});

/* ---------------- tur içeriği ---------------- */
describe('tur içeriği', () => {
  it('zorunlu alanların hepsi dolu', () => {
    ['slug', 'title', 'tagline', 'category', 'area', 'code'].forEach(alan => {
      expect(String(tur[alan] || '').length, alan + ' boş').toBeGreaterThan(0);
    });
    ['gallery', 'highlights', 'description', 'itinerary', 'included', 'excluded',
      'bring', 'important', 'faq', 'reviews', 'similar', 'addons', 'facts', 'badges', 'trust']
      .forEach(liste => {
        expect(Array.isArray(tur[liste]), liste + ' dizi değil').toBe(true);
        expect(tur[liste].length, liste + ' boş').toBeGreaterThan(0);
      });
  });

  it('program saatleri ilerler (durak sırası bozulmaz)', () => {
    const dakika = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
    tur.itinerary.forEach(stop => expect(stop.time, stop.title).toMatch(/^\d{2}:\d{2}$/));
    for (let i = 1; i < tur.itinerary.length; i++) {
      expect(dakika(tur.itinerary[i].time), tur.itinerary[i].title)
        .toBeGreaterThan(dakika(tur.itinerary[i - 1].time));
    }
  });

  it('program ilk durağı kalkış saatiyle başlar', () => {
    expect(tur.itinerary[0].time).toBe(tur.pricing.startTime);
    expect(tur.meeting.points[0].time).toBe(tur.pricing.startTime);
  });

  it('her ek seçeneğin kimliği tekil ve çarpan biçimi tanımlı', () => {
    const idler = tur.addons.map(a => a.id);
    expect(new Set(idler).size).toBe(idler.length);
    tur.addons.forEach(a => {
      expect(['guest', 'booking'], a.id).toContain(a.per);
      expect(a.price, a.id).toBeGreaterThan(0);
      expect(a.label, a.id).toBeTruthy();
    });
  });

  it('çocuk tarifesi yetişkinden düşük, liste fiyatları güncelin üstünde', () => {
    const p = tur.pricing;
    expect(p.child).toBeLessThan(p.adult);
    expect(p.adultList).toBeGreaterThan(p.adult);
    expect(p.childList).toBeGreaterThan(p.child);
    expect(p.infant).toBe(0);
  });

  it('kalkış günleri geçerli hafta günü numarası', () => {
    expect(tur.pricing.departureDays.length).toBeGreaterThan(0);
    tur.pricing.departureDays.forEach(g => {
      expect(Number.isInteger(g)).toBe(true);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(6);
    });
  });

  it('yorumlardaki puanlar 1-5 arası ve tarihleri ISO', () => {
    tur.reviews.forEach(r => {
      expect(r.rating, r.name).toBeGreaterThanOrEqual(1);
      expect(r.rating, r.name).toBeLessThanOrEqual(5);
      expect(r.date, r.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formatTrDate(r.date), r.name).not.toBe('');
      expect(r.text.length, r.name).toBeGreaterThan(60);
    });
  });

  it('her SSS sorusu soru işaretiyle biter ve cevabı yeterince açık', () => {
    tur.faq.forEach(f => {
      expect(f.q.trim().endsWith('?'), f.q).toBe(true);
      expect(f.a.length, f.q).toBeGreaterThan(80);
    });
  });

  it('kısım puanları 1-5 arası', () => {
    tur.ratingAspects.forEach(a => {
      expect(a.value, a.label).toBeGreaterThan(1);
      expect(a.value, a.label).toBeLessThanOrEqual(5);
    });
  });
});

/* ---------------- sayfa ile veri arasındaki bağlar ---------------- */
describe('tur.html ile veri bağı', () => {
  it('H1 ve alt başlık veriyle birebir aynı', () => {
    /* Sayfada elle yazili baslik ile veri ayrisirsa arama sonucu bir sey,
       sayfa baska bir sey soyler. */
    expect(sayfa).toContain('<h1>' + tur.title + '</h1>');
    expect(sayfa).toContain('<p class="tour-lead">' + tur.tagline + '</p>');
  });

  it('sekme başlığı ve açıklama dolu, tur adını taşıyor', () => {
    const baslik = sayfa.match(/<title>([^<]+)<\/title>/)[1];
    expect(baslik).toContain(tur.title);
    const aciklama = sayfa.match(/<meta name="description" content="([^"]+)">/)[1];
    expect(aciklama.length).toBeGreaterThan(80);
    expect(aciklama.length).toBeLessThan(320);
  });

  it('kırılma noktası (breadcrumb) yapısal verisi sayfadaki yolla aynı', () => {
    const ldBlok = sayfa.match(/"@type": "BreadcrumbList"[\s\S]*?\n  <\/script>/)[0];
    expect(ldBlok).toContain('"name": "Anasayfa"');
    expect(ldBlok).toContain('"name": "' + tur.category + 'lar"');
    expect(ldBlok).toContain('"name": "' + tur.title + '"');
    /* Gorunur yol da ayni adimlari tasir. */
    const yol = sayfa.match(/<nav class="tour-crumbs"[\s\S]*?<\/nav>/)[0];
    expect(yol).toContain('Anasayfa');
    expect(yol).toContain(tur.title);
  });

  it('uydurma envanter yapısal veriyle işaretlenmez', () => {
    /* Gercek fiyat ve stok baglanana kadar Product/Offer/AggregateRating
       eklenmemeli; gerekcesi docs/tur-sayfasi.md ve tur.html'deki not. */
    expect(sayfa).not.toContain('"@type": "Offer"');
    expect(sayfa).not.toContain('"@type": "AggregateRating"');
    expect(sayfa).not.toContain('"@type": "Product"');
  });

  it('JSON-LD blokları geçerli JSON', () => {
    const bloklar = [...sayfa.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(bloklar.length).toBeGreaterThan(0);
    bloklar.forEach(b => expect(() => JSON.parse(b[1])).not.toThrow());
  });

  it('bölüm menüsündeki her sekmenin sayfada hedefi var', () => {
    const blok = sayfaJs.match(/const SECTIONS = \[([\s\S]*?)\n  \];/)[1];
    const idler = [...blok.matchAll(/id:\s*'([a-z-]+)'/g)].map(m => m[1]);
    expect(idler.length).toBeGreaterThan(4);
    idler.forEach(id => expect(sayfa, id + ' bölümü tur.html içinde yok').toContain('id="' + id + '"'));
  });

  it('JS’in doldurduğu her kabın sayfada karşılığı var', () => {
    const kaplar = [...sayfaJs.matchAll(/fill\('([a-zA-Z-]+)'/g)].map(m => m[1]);
    expect(kaplar.length).toBeGreaterThan(10);
    kaplar.forEach(id => expect(sayfa, id + ' kabı tur.html içinde yok').toContain('id="' + id + '"'));
  });

  it('rezervasyon kartının iki yuvası da sayfada', () => {
    expect(sayfa).toContain('id="tourBookingMobile"');
    expect(sayfa).toContain('id="tourBookingDesktop"');
  });

  it('gereken betikler yüklü, anasayfaya ait olan yüklenmiyor', () => {
    ['assets/js/home-blocks.js', 'assets/js/tour-data.js', 'assets/js/tour-page.js', 'assets/js/ui.js']
      .forEach(src => expect(sayfa, src + ' yüklenmiyor').toContain('src="' + src + '"'));
    /* app.js ilk satirinda anasayfanin DOM'unu arar; burada patlar. */
    expect(sayfa).not.toContain('src="assets/js/app.js"');
  });

  it('sayfa kendi stil dosyasını ve ortak stili yükler', () => {
    expect(sayfa).toContain('href="assets/css/style.css"');
    expect(sayfa).toContain('href="assets/css/tour.css"');
  });
});

describe('anasayfa bağlantısı', () => {
  it('tur şeridinin gerçek bir bağ hedefi var', () => {
    expect(app).toContain("anchor:'turlar'");
    expect(app).toContain('${sec.anchor ? ` id="${sec.anchor}"` : \'\'}');
    expect(sayfa).toContain('index.html#turlar');
  });

  it('şerit bağ hedefleri tekil', () => {
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    const ankrajlar = [...blok.matchAll(/anchor:'([a-z-]+)'/g)].map(m => m[1]);
    expect(ankrajlar.length).toBeGreaterThan(3);
    expect(new Set(ankrajlar).size).toBe(ankrajlar.length);
  });

  it('içerik sayfasına bağlanan kart tur.html’i gösterir', () => {
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    const baglar = [...blok.matchAll(/href:'([^']+)'/g)].map(m => m[1]);
    expect(baglar).toContain('tur.html');
    baglar.forEach(h => expect(h).toBe('tur.html'));
  });

  it('anasayfadaki fiyat tur sayfasındaki fiyatla aynı', () => {
    /* Listede bir fiyat, detayda baska bir fiyat gormek guveni bitirir. */
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    const kart = blok.split('\n').find(satir => satir.includes("href:'tur.html'"));
    expect(kart).toBeTruthy();
    const fiyat = kart.match(/priceMain:'(\d+)'/)[1];
    expect(Number(fiyat)).toBe(tur.pricing.adult);
  });

  it('kart başlığı bağ varken gerçek bir <a> olur', () => {
    expect(app).toContain('<a href="${it.href}">${it.title}</a>');
    expect(app).toContain('.poi-card[data-href]');
  });

  it('yatay şeritte pointer capture basma anında alınmaz', () => {
    /* Basma aninda alindiginda tarayici sonraki click olayini seride
       yonlendiriyor; click.target basilan kart yerine seridin kendisi
       oluyor ve karta bagli delege dinleyici hic tetiklenmiyor.
       Capture ilk gercek harekete kadar beklemeli. */
    const basma = app.match(/track\.addEventListener\('pointerdown'[\s\S]*?\n    \}\);/)[0];
    expect(basma).not.toContain('setPointerCapture');
    const hareket = app.match(/track\.addEventListener\('pointermove'[\s\S]*?\n    \}\);/)[0];
    expect(hareket).toContain('setPointerCapture');
  });
});
