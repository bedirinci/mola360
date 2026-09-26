/* Tur icerik sayfasi (tur.html) testleri.

   Iki bolum var:
   1) Saf fonksiyonlar — fiyat, tarih, iade, puan. Bunlar DOM'a dokunmadigi
      icin dogrudan cagrilir.
   2) Icerik butunlugu — tur.html, tour-page.js ve app.js metin olarak
      okunup birbirine bagli yerler karsilastirilir: menude hedefi olmayan
      sekme, sayfada karsiligi olmayan kap, anasayfada tur sayfasindan
      farkli bir fiyat gibi sessiz kaymalar burada yakalanir. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
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
  formatTrDateRangeShort,
  trDateParts,
  nextDepartureDates,
  clampParty,
  calcDailyTotal,
  calcStayTotal,
  stayRoomPlan,
  departureCity,
  calcTotal,
  basePrice,
  baseListPrice,
  stayReturnDate,
  discountPercent,
  refundTier,
  refundAmount,
  ratingSummary,
  filterReviews,
  reviewerInitials,
  tourSlugFromPath,
  tourSlugFromQuery,
  resolveTour,
} from '../assets/js/tour-data.js';
import { catalogCards, catalogAllCards, cardDateText, formatReviewCount } from '../assets/js/catalog.js';

/* Tarih türeten testler sabit bir "bugün" kullanıyor: gerçek tarihle
   çalışan bir test, çalıştığı güne göre başka sonuç verir. */
const BUGUN = '2026-09-21';

const sayfaJs = readFileSync(new URL('../assets/js/tour-page.js', import.meta.url), 'utf8');
const veriJs = readFileSync(new URL('../assets/js/tour-data.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const yonlendirme = readFileSync(new URL('../tur.html', import.meta.url), 'utf8');
const ortakStil = readFileSync(new URL('../assets/css/style.css', import.meta.url), 'utf8');
const turStil = readFileSync(new URL('../assets/css/tour.css', import.meta.url), 'utf8');
const arayuz = readFileSync(new URL('../assets/js/ui.js', import.meta.url), 'utf8');
const pdfJs = readFileSync(new URL('../assets/js/tour-pdf.js', import.meta.url), 'utf8');
const bloklar = readFileSync(new URL('../assets/js/home-blocks.js', import.meta.url), 'utf8');

/* Her turun kendi HTML dosyası var: /tur/<slug>/index.html. Statik
   bilgiler (H1, sekme başlığı, kırılma noktaları) elle yazıldığı için
   aşağıdaki testler her sayfayı kendi tur kaydıyla karşılaştırır. */
const sayfalar = Object.keys(TOURS).map(slug => ({
  slug,
  tur: TOURS[slug],
  html: readFileSync(new URL('../tur/' + slug + '/index.html', import.meta.url), 'utf8')
}));

const tur = TOURS[DEFAULT_TOUR_SLUG];
const konaklamali = TOURS['kapadokya-3-gece'];
const sayfa = sayfalar.find(s => s.slug === DEFAULT_TOUR_SLUG).html;

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

/* ---------------- kontenjan ----------------
   Kalan yer artık uydurulmuyor. Önceki seatsLeft() tarih metninin karma
   değerinden bir "son N yer" sayısı üretiyordu; hiçbir satışla ilgisi
   yoktu ve dolu durumu hiç oluşmuyordu. Kalan yer veri kapısının
   kontenjan cevabından geliyor (MolaVeri.musaitlik). Cevabın kendisi ve
   hesap tests/veri-kapisi.test.js'te; burada sayfanın onu kullandığı
   ölçülüyor. */
describe('kontenjan', () => {
  const kontenjanFn = () => sayfaJs.match(/function syncSeats\(hesap\) \{([\s\S]*?)\n  \}/)[1];

  it('karma değerden kalan yer üreten fonksiyon yok', () => {
    expect(veriJs).not.toMatch(/function \w*(seatsLeft|SeatsLeft|roomsLeft)\(/);
    expect(sayfaJs).not.toMatch(/(seatsLeft|SeatsLeft|roomsLeft)\(/);
  });

  it('kayıt ve kalan yer veri kapısından', () => {
    expect(sayfaJs).toMatch(/MolaVeri\.urun\('tour',\s/);
    expect(sayfaJs).not.toMatch(/resolveTour\(/);
    expect(sayfaJs).toContain("MolaVeri.musaitlik('tour', ");
    expect(kontenjanFn()).toContain('kontenjanDurumu(');
  });

  it('dolu tarih takvimde kalıyor ama seçilemiyor', () => {
    const fn = sayfaJs.match(/function dateChipsMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('tarihDoluMu(musaitlik, ');
    expect(fn).toContain('is-dolu');
    expect(fn).toContain('disabled');
  });

  it('dolu veya yetmeyen kontenjanda rezervasyon düğmeleri pasif', () => {
    const fn = kontenjanFn();
    expect(fn).toContain("durum.durum === 'doldu' || durum.durum === 'yetersiz'");
    expect(fn).toContain('dugme.disabled = !!satisEngeli');
    expect(sayfaJs).toMatch(/id="tourStickyCta"\$\{satisEngeli \? ' disabled' : ''\}/);
  });

  it('cevap gelmeden kontenjan satırı gizli, satış engellenmiyor', () => {
    expect(kontenjanFn()).toContain("el.hidden = durum.durum === 'bilinmiyor'");
    expect(readFileSync(new URL('../assets/css/tour.css', import.meta.url), 'utf8'))
      .toContain('.tour-seats[hidden] { display: none; }');
  });

  it('her sayfa veri kapısını kendi betiğinden önce yüklüyor', () => {
    for (const s of sayfalar) {
      const yer = (ad) => s.html.indexOf('assets/js/' + ad + '"');
      expect(yer('taxonomy-data.js'), s.slug).toBeGreaterThan(-1);
      expect(yer('inventory-data.js'), s.slug).toBeGreaterThan(yer('taxonomy-data.js'));
      expect(yer('data-gateway.js'), s.slug).toBeGreaterThan(yer('inventory-data.js'));
      expect(yer('tour-page.js'), s.slug).toBeGreaterThan(yer('data-gateway.js'));
    }
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
describe.each(sayfalar)('$slug sayfası', ({ slug, tur: t, html }) => {
  it('H1 ve alt başlık veriyle birebir aynı', () => {
    /* Sayfada elle yazılı başlık ile veri ayrışırsa arama sonucu bir şey,
       sayfa başka bir şey söyler. */
    expect(html).toContain('<h1>' + t.title + '</h1>');
    expect(html).toContain('<p class="tour-lead">' + t.tagline + '</p>');
  });

  it('sekme başlığı ve açıklama dolu, tur adını taşıyor', () => {
    const baslik = html.match(/<title>([^<]+)<\/title>/)[1];
    expect(baslik).toContain(t.title);
    const aciklama = html.match(/<meta name="description" content="([^"]+)">/)[1];
    expect(aciklama.length).toBeGreaterThan(80);
    expect(aciklama.length).toBeLessThan(340);
  });

  it('kanonik adres ve OG adresi /tur/<slug>/ biçiminde', () => {
    const hedef = 'https://bedirinci.github.io/mola360/tur/' + slug + '/';
    expect(html).toContain('<link rel="canonical" href="' + hedef + '">');
    expect(html).toContain('<meta property="og:url" content="' + hedef + '">');
  });

  it('kırılma noktası yapısal verisi görünür yolla aynı', () => {
    const ldBlok = html.match(/"@type": "BreadcrumbList"[\s\S]*?\n  <\/script>/)[0];
    expect(ldBlok).toContain('"name": "Anasayfa"');
    expect(ldBlok).toContain('"name": "' + t.categoryPlural + '"');
    expect(ldBlok).toContain('"name": "' + t.title + '"');
    expect(ldBlok).toContain('/tur/' + slug + '/');

    const yol = html.match(/<nav class="tour-crumbs"[\s\S]*?<\/nav>/)[0];
    expect(yol).toContain('Anasayfa');
    expect(yol).toContain(t.categoryPlural);
    expect(yol).toContain(t.title);
    /* Orta adım anasayfadaki şeridin gerçek çapasına gider. */
    expect(yol).toContain('#' + t.categoryAnchor);
  });

  it('uydurma envanter yapısal veriyle işaretlenmez', () => {
    /* Gerçek fiyat ve stok bağlanana kadar Product/Offer/AggregateRating
       eklenmemeli; gerekçesi docs/tur-sayfasi.md ve sayfadaki not. */
    expect(html).not.toContain('"@type": "Offer"');
    expect(html).not.toContain('"@type": "AggregateRating"');
    expect(html).not.toContain('"@type": "Product"');
  });

  it('JSON-LD blokları geçerli JSON', () => {
    const bloklar = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(bloklar.length).toBeGreaterThan(0);
    bloklar.forEach(b => expect(() => JSON.parse(b[1])).not.toThrow());
  });

  it('JS’in doldurduğu her kabın sayfada karşılığı var', () => {
    const kaplar = [...sayfaJs.matchAll(/fill\('([a-zA-Z-]+)'/g)].map(m => m[1]);
    expect(kaplar.length).toBeGreaterThan(10);
    /* konaklama kabı yalnızca konaklamalı turda bulunur; tour-page.js
       sayfada karşılığı olmayan bölümü menüden de düşürür. */
    kaplar
      .filter(id => id !== 'konaklama' || t.type === 'stay')
      .forEach(id => expect(html, id + ' kabı ' + slug + ' sayfasında yok').toContain('id="' + id + '"'));
  });

  it('tur tipinin gerektirdiği bölümler sayfada', () => {
    const ortak = ['genel-bakis', 'program', 'dahil-olanlar', 'bulusma', 'bilgiler', 'yorumlar', 'sss'];
    ortak.forEach(id => expect(html, id + ' yok').toContain('id="' + id + '"'));
    if (t.type === 'stay') {
      expect(html, 'konaklamalı turda konaklama bölümü yok').toContain('id="konaklama"');
    } else {
      expect(html, 'günübirlik turda konaklama bölümü olmamalı').not.toContain('id="konaklama"');
    }
  });

  it('bölüm menüsündeki her sekme bir bölüm listesinden gelir', () => {
    const blok = sayfaJs.match(/const TUM_SECTIONS = \[([\s\S]*?)\n  \];/)[1];
    const idler = [...blok.matchAll(/id:\s*'([a-z-]+)'/g)].map(m => m[1]);
    expect(idler.length).toBeGreaterThan(4);
    /* Sayfada bulunan her bölüm listede olmalı, aksi hâlde menüde hiç
       görünmez. */
    const sayfadakiler = [...html.matchAll(/<section class="tour-block" id="([a-z-]+)"/g)].map(m => m[1]);
    /* İstisna yok: sayfadaki her bloğun menüde bir karşılığı olmalı,
       yoksa kullanıcı o bölüme menüden hiç ulaşamaz. */
    sayfadakiler.forEach(id => {
      expect(idler, id + ' TUM_SECTIONS içinde yok').toContain(id);
    });
  });

  it('mobil başlık metni tur kaydıyla aynı', () => {
    /* Mobilde başlık bildirimler ekranınınkiyle aynı düzende: geri oku,
       iki satırlık başlık, sağda tek eylem. Metin elle yazıldığı için
       veriyle karşılaştırılır. */
    expect(html).toContain('<span class="tour-mobile-title">' + t.title + '</span>');
    /* Dar satırda "Tur" ekini tekrar etmeye gerek yok: "Günübirlik Tur"
       yerine "Günübirlik". */
    expect(html).toContain('<span class="tour-mobile-subtitle">' + t.categoryShort + ' · ' + t.area + '</span>');
  });

  it('mobil başlıkta geri oku var, sağda eylem yok', () => {
    const blok = html.match(/<div class="tour-mobile-header">[\s\S]*?\n<\/div>/);
    expect(blok, 'mobil başlık bloğu bulunamadı').toBeTruthy();
    const metin = blok[0];
    expect(metin).toContain('class="tour-mobile-back"');
    expect(metin).toContain('href="../../index.html"');
    /* Paylaş banner'a, favorinin sağına taşındı; başlıkta düğme yok. */
    expect(metin).not.toContain('tourHeaderShare');
    expect(metin).not.toContain('tour-mobile-action');
    expect((metin.match(/<button/g) || []).length).toBe(0);
  });

  it('rezervasyon kartının iki yuvası da sayfada', () => {
    expect(html).toContain('id="tourBookingMobile"');
    expect(html).toContain('id="tourBookingDesktop"');
  });

  it('sayfa kökü tanımlı ve varlıklar iki dizin yukarıdan geliyor', () => {
    /* /tur/<slug>/index.html iki dizin içeride; bağlantılar bu değerden
       kurulur, tahmin edilmez. */
    expect(html).toContain('data-root="../../"');
    expect(html).not.toMatch(/(?:href|src)="assets\//);
    expect(html).not.toMatch(/href="index\.html/);
  });

  it('gereken betikler yüklü', () => {
    /* app.js de yükleniyor: başlık, arama, bildirimler, profil ve giriş
       modalı onun üzerinden çalışıyor. Anasayfaya özgü bölümler burada
       olmadığı için app.js byId/onId ile korumalı erişiyor. */
    ['site-chrome.js', 'search-utils.js', 'notif-utils.js', 'home-blocks.js',
     'app.js', 'tour-data.js', 'tour-page.js', 'ui.js']
      .forEach(ad => expect(html, ad + ' yüklenmiyor').toContain('src="../../assets/js/' + ad + '"'));
  });

  it('ortak çerçeve app.js\'ten ÖNCE yükleniyor', () => {
    /* app.js en üst seviyede bu işaretlemedeki ID\'leri arıyor;
       sonra yüklenirse başlık ölü kalır. */
    expect(html.indexOf('site-chrome.js')).toBeLessThan(html.indexOf('app.js'));
  });

  it('masaüstü başlığının kopyası sayfada yok', () => {
    /* Başlık tek kaynaktan (site-chrome.js) geliyor; sayfaya elle
       yazılmış bir kopya kalırsa iki başlık birden basılır. */
    expect(html).not.toContain('<header class="site-header"');
    expect(html).not.toContain('class="header-inner"');
  });

  it('sayfa kendi stil dosyasını ve ortak stili yükler', () => {
    expect(html).toContain('href="../../assets/css/style.css"');
    expect(html).toContain('href="../../assets/css/tour.css"');
  });
});

describe('eski tur.html adresi', () => {
  it('yönlendirme sayfası, içerik sayfası değil', () => {
    expect(yonlendirme).toContain('http-equiv="refresh"');
    expect(yonlendirme).toContain('tur/efes-sirince/');
    expect(yonlendirme).toContain('rel="canonical"');
    expect(yonlendirme).toContain('noindex');
    /* İçerik sayfası olmadığından kapları da olmamalı. */
    expect(yonlendirme).not.toContain('id="tourGallery"');
  });

  it('slug taşıyan eski adres o turun yeni adresine gider', () => {
    /* tur.html?tur=kapadokya-3-gece -> tur/kapadokya-3-gece/ */
    expect(yonlendirme).toMatch(/tur=\(\[\^&#\]\*\)|\[\?&\]tur=/);
    expect(yonlendirme).toContain("window.location.replace('tur/' + slug + '/')");
  });
});

describe('anasayfa bağlantısı', () => {
  const kartBloku = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
  /* Tur kartlari anasayfaya ELLE yazilmiyor: catalog.js onlari TOURS
     kayitlarindan uretip seritlere karistiriyor (docs/icerik-katalogu.md).
     Bu yuzden asagidaki testler app.js metnine degil, uretilen kartlara
     bakiyor. Katalogun kendi kurallari tests/katalog.test.js icinde. */
  const turKartlari = catalogAllCards(BUGUN).filter(k => k.href.startsWith('tur/'));

  it('şerit bağ hedefleri tekil ve tur sayfalarındaki çapalarla eşleşiyor', () => {
    const ankrajlar = [...kartBloku.matchAll(/anchor:'([a-z-]+)'/g)].map(m => m[1]);
    expect(ankrajlar.length).toBeGreaterThan(3);
    expect(new Set(ankrajlar).size).toBe(ankrajlar.length);
    expect(app).toContain('${sec.anchor ? ` id="${sec.anchor}"` : \'\'}');

    /* Her turun kirilma noktasindaki capa anasayfada gercekten var. */
    Object.values(TOURS).forEach(t => {
      expect(ankrajlar, t.slug + ' için ' + t.categoryAnchor + ' çapası yok')
        .toContain(t.categoryAnchor);
    });
  });

  it('her tur anasayfaya kendiliğinden giriyor', () => {
    /* Yeni bir tur kaydı eklemek anasayfaya dokunmayı gerektirmemeli:
       sayfası olan ama hiçbir yerden görünmeyen tur olmasın. */
    const baglar = turKartlari.map(k => k.href);
    Object.keys(TOURS).forEach(slug => {
      expect(baglar, slug + ' anasayfaya girmiyor').toContain('tur/' + slug + '/');
    });
  });

  it('her tur kendi kategori şeridine giriyor', () => {
    /* Günübirlik tur "Günübirlik Turlar" şeridine, konaklamalı olan
       "Konaklamalı Turlar" şeridine. Kaydın categoryAnchor'ı ile
       katalogun koyduğu şerit ayrışamaz. */
    Object.values(TOURS).forEach(t => {
      const seritte = catalogCards(t.categoryAnchor, BUGUN).map(k => k.href);
      expect(seritte, t.slug + ' -> #' + t.categoryAnchor + ' şeridinde yok')
        .toContain('tur/' + t.slug + '/');
    });
  });

  it('bağlar /tur/<slug>/ biçiminde ve slug gerçek bir tur', () => {
    turKartlari.forEach(kart => {
      expect(kart.href, kart.href + ' /tur/<slug>/ biçiminde değil').toMatch(/^tur\/[a-z0-9-]+\/$/);
      const slug = kart.href.replace(/^tur\//, '').replace(/\/$/, '');
      expect(TOURS[slug], slug + ' TOURS içinde yok').toBeTruthy();
      expect(TOURS[slug].slug).toBe(slug);
    });
  });

  it('anasayfadaki fiyat tur sayfasındaki fiyatla aynı', () => {
    /* Listede bir fiyat, detayda başka bir fiyat görmek güveni bitirir.
       Kart fiyatı elle yazılmadığı için kopyalanıp eskiyemiyor; test
       yine de türetmenin doğru alanı okuduğunu doğruluyor.
       basePrice() tur tipini bilir: günübirlikte yetişkin tarifesi,
       konaklamalıda iki kişilik odada kişi başı. */
    turKartlari.forEach(kart => {
      const slug = kart.href.replace(/^tur\//, '').replace(/\/$/, '');
      expect(Number(kart.priceMain), slug + ' kart fiyatı tur fiyatıyla aynı değil')
        .toBe(basePrice(TOURS[slug]));
    });
  });

  it('anasayfadaki puan ve yorum sayısı tur kaydından geliyor', () => {
    turKartlari.forEach(kart => {
      const slug = kart.href.replace(/^tur\//, '').replace(/\/$/, '');
      const puan = ratingSummary(TOURS[slug].ratingBreakdown);
      expect(kart.rating, slug + ' kart puanı farklı').toBe(String(puan.average));
      expect(kart.reviews, slug + ' yorum sayısı farklı').toBe(formatReviewCount(puan.total));
    });
  });

  it('karttaki tarih tur sayfasındaki ilk kalkışla aynı gün', () => {
    /* Elle yazılan tarih ("20 Ekim, Salı") birkaç hafta sonra geçmiş bir
       günü gösteriyordu. Artık kalkış takviminden türetiliyor. */
    turKartlari.forEach(kart => {
      const slug = kart.href.replace(/^tur\//, '').replace(/\/$/, '');
      const t = TOURS[slug];
      const ilk = nextDepartureDates(BUGUN, t.pricing.departureDays, 1, t.pricing.leadDays)[0];
      expect(kart.meta2, slug + ' kart tarihi kalkıştan farklı').toBe(cardDateText(ilk, BUGUN));
      expect(kart.meta2).not.toBe('');
    });
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

/* ---------------- konaklamalı tur ---------------- */
describe('tourSlugFromPath', () => {
  it('/tur/<slug>/ adresinden slug okur', () => {
    expect(tourSlugFromPath('/tur/efes-sirince/')).toBe('efes-sirince');
    expect(tourSlugFromPath('/mola360/tur/kapadokya-3-gece/')).toBe('kapadokya-3-gece');
    expect(tourSlugFromPath('/tur/efes-sirince/index.html')).toBe('efes-sirince');
    expect(tourSlugFromPath('/tur/EFES-SIRINCE/')).toBe('efes-sirince');
  });

  it('tur sayfası olmayan adreslerde boş döner', () => {
    expect(tourSlugFromPath('/mola360/index.html')).toBe('');
    expect(tourSlugFromPath('/tur.html')).toBe('');
    expect(tourSlugFromPath('/tur/index.html')).toBe('');
    expect(tourSlugFromPath('')).toBe('');
    expect(tourSlugFromPath(null)).toBe('');
  });

  it('adres slug taşımıyorsa sorgu dizisi yedeğe düşer', () => {
    /* tour-page.js önce adrese, sonra sorguya bakar. */
    expect(sayfaJs).toContain('tourSlugFromPath(window.location.pathname) || tourSlugFromQuery(window.location.search)');
  });
});

describe('basePrice / baseListPrice', () => {
  it('tur tipine göre doğru tarifeyi verir', () => {
    expect(basePrice(tur)).toBe(tur.pricing.adult);
    expect(baseListPrice(tur)).toBe(tur.pricing.adultList);
    expect(basePrice(konaklamali)).toBe(konaklamali.pricing.perPerson);
    expect(baseListPrice(konaklamali)).toBe(konaklamali.pricing.perPersonList);
  });

  it('eksik veride sıfıra düşer', () => {
    expect(basePrice(null)).toBe(0);
    expect(basePrice({ type: 'stay', pricing: {} })).toBe(0);
  });
});

describe('stayReturnDate', () => {
  it('kalkış tarihine gece sayısı eklenir', () => {
    expect(stayReturnDate(konaklamali, '2026-10-05')).toBe('2026-10-08');
    /* Ay sınırını geçer. */
    expect(stayReturnDate(konaklamali, '2026-10-30')).toBe('2026-11-02');
  });

  it('günübirlik turda dönüş tarihi yok', () => {
    expect(stayReturnDate(tur, '2026-10-05')).toBe('');
  });

  it('bozuk tarihte boş döner', () => {
    expect(stayReturnDate(konaklamali, '')).toBe('');
    expect(stayReturnDate(konaklamali, 'abc')).toBe('');
  });
});

describe('departureCity', () => {
  it('seçilen şehri döndürür', () => {
    expect(departureCity(konaklamali, 'izm').label).toBe('İzmir');
  });

  it('seçim yok veya tanınmıyorsa ilk şehir', () => {
    expect(departureCity(konaklamali, '').id).toBe(konaklamali.departureCities[0].id);
    expect(departureCity(konaklamali, 'yok').id).toBe(konaklamali.departureCities[0].id);
  });

  it('şehir listesi olmayan turda null', () => {
    expect(departureCity(tur, 'ist')).toBe(null);
  });
});

describe('stayRoomPlan', () => {
  it('tek yetişkinde tek kişilik oda zorunlu', () => {
    const plan = stayRoomPlan(konaklamali, { adults: 1 });
    expect(plan.singleRoom).toBe(true);
    expect(plan.singleForced).toBe(true);
    expect(plan.singleRooms).toBe(1);
  });

  it('iki yetişkinde varsayılan iki kişilik oda', () => {
    const plan = stayRoomPlan(konaklamali, { adults: 2 });
    expect(plan.singleRoom).toBe(false);
    expect(plan.singleForced).toBe(false);
    expect(plan.singleRooms).toBe(0);
  });

  it('3. kişi indirimi yalnızca üç yetişkin ve paylaşımlı odada', () => {
    expect(stayRoomPlan(konaklamali, { adults: 3 }).thirdAdults).toBe(1);
    expect(stayRoomPlan(konaklamali, { adults: 2 }).thirdAdults).toBe(0);
    expect(stayRoomPlan(konaklamali, { adults: 4 }).thirdAdults).toBe(0);
    /* Tek kişilik oda seçilirse oda paylaşımı yok, indirim de yok. */
    expect(stayRoomPlan(konaklamali, { adults: 3, singleRoom: true }).thirdAdults).toBe(0);
  });

  it('standart ve indirimli yetişkin sayısı toplamı yetişkin sayısı', () => {
    [1, 2, 3, 4, 5, 6].forEach(n => {
      const plan = stayRoomPlan(konaklamali, { adults: n });
      expect(plan.standardAdults + plan.thirdAdults).toBe(plan.adults);
    });
  });
});

describe('calcStayTotal', () => {
  const p = () => konaklamali.pricing;

  it('iki kişilik odada kişi başı tarifeden toplanır', () => {
    const h = calcStayTotal(konaklamali, { adults: 2, city: 'ist' });
    expect(h.total).toBe(2 * p().perPerson);
    expect(h.singleTotal).toBe(0);
    expect(h.cityTotal).toBe(0);
  });

  it('tek yetişkine oda farkı kendiliğinden eklenir', () => {
    const h = calcStayTotal(konaklamali, { adults: 1, city: 'ist' });
    expect(h.total).toBe(p().perPerson + p().singleSupplement);
    expect(h.singleForced).toBe(true);
  });

  it('tek kişilik oda seçilince her yetişkine fark eklenir', () => {
    const h = calcStayTotal(konaklamali, { adults: 3, city: 'ist', singleRoom: true });
    expect(h.singleRooms).toBe(3);
    expect(h.singleTotal).toBe(3 * p().singleSupplement);
    /* Oda paylaşımı olmadığı için 3. kişi indirimi uygulanmaz. */
    expect(h.thirdAdults).toBe(0);
    expect(h.total).toBe(3 * p().perPerson + 3 * p().singleSupplement);
  });

  it('üç yetişkinde 3. kişi indirimli tarifeden', () => {
    const h = calcStayTotal(konaklamali, { adults: 3, city: 'ist' });
    expect(h.thirdAdults).toBe(1);
    expect(h.total).toBe(2 * p().perPerson + p().thirdAdult);
    expect(h.total).toBeLessThan(3 * p().perPerson);
  });

  it('çocuk indirimli, bebek ücretsiz', () => {
    const h = calcStayTotal(konaklamali, { adults: 2, children: 1, infants: 1, city: 'ist' });
    expect(h.childTotal).toBe(p().child);
    expect(h.total).toBe(2 * p().perPerson + p().child);
    expect(h.payingGuests).toBe(3);
    expect(h.guests).toBe(4);
  });

  it('kalkış şehri farkı ücretli kişi başına eklenir', () => {
    const h = calcStayTotal(konaklamali, { adults: 2, children: 1, city: 'izm' });
    const fark = departureCity(konaklamali, 'izm').fee;
    expect(h.cityTotal).toBe(3 * fark);
    expect(h.city.label).toBe('İzmir');
    /* Farkı olmayan şehirde satır hiç oluşmaz. */
    const ist = calcStayTotal(konaklamali, { adults: 2, city: 'ist' });
    expect(ist.lines.some(l => l.kind === 'fee')).toBe(false);
  });

  it('ek seçenekler kişi başı ve rezervasyon başı doğru çarpılır', () => {
    const kisiBasi = konaklamali.addons.find(a => a.per === 'guest');
    const rezervasyon = konaklamali.addons.find(a => a.per === 'booking');
    const h = calcStayTotal(konaklamali, {
      adults: 2, children: 1, city: 'ist', addons: [kisiBasi.id, rezervasyon.id]
    });
    expect(h.addonsTotal).toBe(kisiBasi.price * 3 + rezervasyon.price);
  });

  it('avantaj yalnızca indirime konu kalemlerden hesaplanır', () => {
    /* Tek kişilik oda farkı ve şehir farkı birer ek ücret; liste fiyatı
       karşılaştırmasına girmemeli, yoksa "avantaj" şişer. */
    const sade = calcStayTotal(konaklamali, { adults: 2, city: 'ist' });
    const farkli = calcStayTotal(konaklamali, { adults: 2, city: 'izm', singleRoom: true });
    expect(farkli.saving).toBe(sade.saving);
    expect(sade.saving).toBe(2 * (p().perPersonList - p().perPerson));
  });

  it('özet satırları toplamla tutarlı', () => {
    const h = calcStayTotal(konaklamali, {
      adults: 3, children: 1, infants: 1, city: 'izm', addons: ['balon', 'ozelTransfer']
    });
    const satirToplam = h.lines.reduce((t, l) => t + l.amount, 0);
    expect(satirToplam).toBe(h.total);
    expect(h.lines.every(l => l.label && typeof l.amount === 'number')).toBe(true);
    expect(h.lines.map(l => l.kind).every(k => ['base', 'free', 'fee', 'addon'].includes(k))).toBe(true);
  });

  it('kişi sınırı konaklamalı turda da uygulanır', () => {
    const h = calcStayTotal(konaklamali, { adults: 99, children: 99, city: 'ist' });
    expect(h.adults + h.children).toBe(konaklamali.pricing.maxGuests);
  });
});

describe('calcTotal tipe göre dağıtır', () => {
  it('günübirlik tur günübirlik hesabı kullanır', () => {
    const h = calcTotal(tur, { adults: 2 });
    expect(h.type).toBe('daily');
    expect(h.total).toBe(calcDailyTotal(tur, { adults: 2 }).total);
  });

  it('konaklamalı tur konaklamalı hesabı kullanır', () => {
    const h = calcTotal(konaklamali, { adults: 2, city: 'ist' });
    expect(h.type).toBe('stay');
    expect(h.total).toBe(calcStayTotal(konaklamali, { adults: 2, city: 'ist' }).total);
  });

  it('iki tipte de ortak alanlar dolu', () => {
    [tur, konaklamali].forEach(t => {
      const h = calcTotal(t, { adults: 2 });
      ['lines', 'subtotal', 'listSubtotal', 'saving', 'addons', 'addonsTotal', 'total', 'guests']
        .forEach(alan => expect(h[alan], t.slug + ' -> ' + alan).not.toBe(undefined));
      const satirToplam = h.lines.reduce((toplam, l) => toplam + l.amount, 0);
      expect(satirToplam, t.slug + ' satır toplamı').toBe(h.total);
    });
  });
});

describe('konaklamalı tur içeriği', () => {
  it('gün sayısı, gece sayısı ve program tutarlı', () => {
    expect(konaklamali.nights).toBe(konaklamali.days - 1);
    expect(konaklamali.program).toHaveLength(konaklamali.days);
    konaklamali.program.forEach((gun, i) => {
      expect(gun.day, 'gün numarası sıralı değil').toBe(i + 1);
      expect(gun.title).toBeTruthy();
      expect(gun.text.length).toBeGreaterThan(80);
      expect(Array.isArray(gun.meals)).toBe(true);
    });
  });

  it('son gün dönüş günü, diğer günler konaklamalı', () => {
    const son = konaklamali.program[konaklamali.program.length - 1];
    expect(son.overnight).toBe('—');
    konaklamali.program.slice(0, -1).forEach(gun => expect(gun.overnight).not.toBe('—'));
  });

  it('konaklama bilgisi eksiksiz', () => {
    const k = konaklamali.accommodation;
    expect(k.board).toBeTruthy();
    expect(k.boardNote).toBeTruthy();
    expect(k.checkIn).toMatch(/^\d{2}:\d{2}$/);
    expect(k.checkOut).toMatch(/^\d{2}:\d{2}$/);
    expect(k.hotels.length).toBeGreaterThan(0);
    /* Otellerde geçirilen gece sayısı turun gece sayısına eşit. */
    const geceler = k.hotels.reduce((t, h) => t + h.nights, 0);
    expect(geceler).toBe(konaklamali.nights);
    k.hotels.forEach(h => {
      expect(h.stars).toBeGreaterThanOrEqual(1);
      expect(h.stars).toBeLessThanOrEqual(5);
      expect(h.name && h.area && h.note).toBeTruthy();
    });
    expect(k.rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('kalkış şehirlerinin kimliği tekil, farkı negatif değil', () => {
    const idler = konaklamali.departureCities.map(c => c.id);
    expect(new Set(idler).size).toBe(idler.length);
    konaklamali.departureCities.forEach(c => {
      expect(c.label).toBeTruthy();
      expect(c.note).toBeTruthy();
      expect(c.fee).toBeGreaterThanOrEqual(0);
    });
  });

  it('konaklamalı fiyat kademeleri mantıklı', () => {
    const p = konaklamali.pricing;
    expect(p.thirdAdult).toBeLessThan(p.perPerson);
    expect(p.child).toBeLessThan(p.thirdAdult);
    expect(p.perPersonList).toBeGreaterThan(p.perPerson);
    expect(p.singleSupplement).toBeGreaterThan(0);
    expect(p.infant).toBe(0);
    /* Konaklamalı turda bugün satılmaz: hazırlık süresi gerekiyor. */
    expect(p.leadDays).toBeGreaterThan(1);
  });

  it('iptal basamakları günübirlikten daha uzun vadeli', () => {
    const enUzun = Math.max.apply(null, konaklamali.cancellation.tiers.map(t => t.minHours));
    const gunubirlik = Math.max.apply(null, tur.cancellation.tiers.map(t => t.minHours));
    expect(enUzun).toBeGreaterThan(gunubirlik);
  });

  it('kategori bilgisi günübirlikten ayrı', () => {
    expect(konaklamali.type).toBe('stay');
    expect(tur.type).toBe('daily');
    expect(konaklamali.categoryAnchor).not.toBe(tur.categoryAnchor);
  });
});

describe('her turun ortak alanları', () => {
  it('slug, tip, kategori ve süre etiketi dolu', () => {
    Object.entries(TOURS).forEach(([anahtar, t]) => {
      expect(t.slug, anahtar + ' slug anahtarla aynı değil').toBe(anahtar);
      expect(['daily', 'stay'], anahtar).toContain(t.type);
      ['title', 'tagline', 'category', 'categoryShort', 'categoryPlural', 'categoryAnchor', 'durationLabel', 'code']
        .forEach(alan => expect(String(t[alan] || '').length, anahtar + '.' + alan + ' boş').toBeGreaterThan(0));
      expect(t.pricing.departureNote, anahtar + ' kalkış notu yok').toBeTruthy();
    });
  });

  it('kısa kategori etiketi gerçekten kısa ve "Tur" eki taşımıyor', () => {
    Object.entries(TOURS).forEach(([anahtar, t]) => {
      expect(t.categoryShort.length, anahtar).toBeLessThan(t.category.length);
      expect(t.categoryShort, anahtar + ' kısa etikette "Tur" eki var').not.toMatch(/\bTur\b/);
      /* Uzun biçimin başlangıcı olmalı: "Günübirlik Tur" -> "Günübirlik" */
      expect(t.category.startsWith(t.categoryShort), anahtar).toBe(true);
    });
  });

  it('tur kodları tekil', () => {
    const kodlar = Object.values(TOURS).map(t => t.code);
    expect(new Set(kodlar).size).toBe(kodlar.length);
  });

  it('her turun görsel anahtarları kayıtlı', () => {
    Object.entries(TOURS).forEach(([anahtar, t]) => {
      const kullanilan = t.gallery.map(g => g.key).concat(t.similar.map(x => x.key));
      const eksik = kullanilan.filter(k => !TOUR_IMAGE_FILES[k]);
      expect(eksik, anahtar + ' kayıtsız görsel: ' + eksik.join(', ')).toEqual([]);
    });
  });

  it('benzer turlardaki slug gerçek bir tur ve kendisi değil', () => {
    Object.entries(TOURS).forEach(([anahtar, t]) => {
      t.similar.filter(x => x.slug).forEach(x => {
        expect(TOURS[x.slug], anahtar + ' -> ' + x.slug + ' yok').toBeTruthy();
        expect(x.slug, anahtar + ' kendine benzer tur olarak bağlanmış').not.toBe(anahtar);
        /* Kart fiyatı hedef turun fiyatıyla aynı olmalı. */
        expect(x.price, anahtar + ' -> ' + x.slug + ' fiyatı tutmuyor').toBe(basePrice(TOURS[x.slug]));
      });
    });
  });

  it('turlar birbirine bağlı (çapraz bağlantı var)', () => {
    Object.values(TOURS).forEach(t => {
      expect(t.similar.some(x => x.slug), t.slug + ' başka bir tur sayfasına hiç bağlanmıyor').toBe(true);
    });
  });
});

/* ---------------- ortak mobil ekran başlığı ---------------- */
describe('mobil başlık stili', () => {
  it('üç ekran tek tanımı paylaşır, kopya yok', () => {
    /* Bildirimler, giriş/üye ol ve tur sayfası aynı başlığı kullanıyor.
       Eskiden ölçüler her biri için ayrı yazılıydı ve yanında "biri
       değişirse diğeri de güncellenmeli" notu vardı; artık tek tanım. */
    const kapsayici = ortakStil.match(
      /\.notif-panel-header,\s*\n\.auth-modal-hero,\s*\n\.tour-mobile-header \{([\s\S]*?)\}/);
    expect(kapsayici, 'ortak başlık tanımı bulunamadı').toBeTruthy();
    /* Görünümü belirleyen değerler ortak blokta olmalı. */
    ['background: var(--navy)', 'border-bottom-left-radius', 'box-shadow', 'gap: 10px']
      .forEach(deger => expect(kapsayici[1], deger + ' ortak tanımda yok').toContain(deger));
  });

  it('geri oku, başlık yığını ve alt başlık da ortak', () => {
    [
      /\.notif-panel-back,\s*\n\.auth-modal-back,\s*\n\.tour-mobile-back \{/,
      /\.notif-panel-heading,\s*\n\.auth-modal-hero-text,\s*\n\.tour-mobile-heading \{/,
      /\.notif-panel-title,\s*\n\.auth-modal-hero-text strong,\s*\n\.tour-mobile-title \{/,
      /\.notif-panel-subtitle,\s*\n\.auth-modal-hero-text span,\s*\n\.tour-mobile-subtitle \{/
    ].forEach(kalip => expect(ortakStil, 'ortak değil: ' + kalip).toMatch(kalip));
    /* Sağdaki eylem artık yalnızca bildirimlerde; tur başlığındaki
       paylaş banner'a taşındı ve sınıfı hiçbir yerde kalmadı. */
    expect(ortakStil.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('.tour-mobile-action');
    expect(turStil.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('.tour-mobile-action');
  });

  it('giriş ekranı başlığı kendi kopyasını taşımıyor', () => {
    /* .auth-modal-hero yalnızca görünürlük kuralı tutmalı; ölçüleri
       tekrar yazarsa iki ekran birbirinden ayrışır. */
    const blok = ortakStil.match(/\n\.auth-modal-hero \{([\s\S]*?)\}/)[1];
    expect(blok).toContain('display: none');
    ['padding', 'background', 'box-shadow', 'border-bottom-left-radius']
      .forEach(deger => expect(blok, deger + ' kopyalanmış').not.toContain(deger));
  });

  it('mobil başlık yalnızca mobilde, masaüstü başlığı yalnızca masaüstünde', () => {
    expect(turStil).toMatch(/\.tour-mobile-header \{ display: none; \}/);
    const mobil = turStil.match(/@media \(max-width: 680px\) \{([\s\S]*?)\n\}/)[1];
    expect(mobil).toContain('.tour-body .site-header { display: none; }');
    expect(mobil).toContain('.tour-mobile-header { display: flex; }');
    /* Ortak çerçeveyle gelen mobil arama çubuğu akışta yer kaplamasın. */
    expect(mobil).toContain('.tour-body .mobile-search-bar { display: none; }');
  });

  it('mobilde başlık banner’ın üzerine biniyor', () => {
    /* Başlık akıştan çıkmazsa oval alt köşelerin içinden sayfa zemini
       görünüyor ve çentikler boş duruyor. Akıştan çıkınca galeri en
       üstten başlıyor ve çentiklerden fotoğrafın kendisi görünüyor.

       "fixed", "absolute" değil: tur adı kaydırırken yukarıda kalsın
       diye. İkisi de akıştan çıkarıyor, yani yukarıdaki gerekçe aynen
       geçerli; fark yalnızca sayfayla birlikte kayıp kaymaması. */
    const mobil = turStil.match(/@media \(max-width: 680px\) \{([\s\S]*?)\n\}/)[1];
    /* Tek kural olmalı; ikiye bölünürse biri diğerini ezebilir. */
    const kurallar = mobil.match(/\.tour-mobile-header \{\n/g) || [];
    expect(kurallar.length, 'konum için birden fazla kural var').toBe(1);
    const kural = mobil.match(/\.tour-mobile-header \{\n([\s\S]*?)\}/)[1];
    expect(kural).toContain('position: fixed');
    expect(kural).toContain('top: 0');
    /* Başlık .site-header'ın içindeyken aldığı yığılma değeriyle aynı
       kalmalı; düşerse galerinin altında kalır. */
    expect(kural).toContain('z-index: 3000');
    /* Başlık yer kaplamadığı için sayfanın üst boşluğu da sıfır olmalı,
       yoksa galeri aşağı kayıp çentikler yine boşa düşer. */
    expect(mobil).toContain('.tour-body .tour-page { padding-top: 0; }');
  });

  it('basitleştirilmiş başlığın stilleri geride kalmadı', () => {
    /* Masaüstü başlığı ortak çerçeveye taşınınca bu sınıfların
       işaretlemesi kalktı; kuralları da kalkmalı. */
    /* Yorumlar elenerek bakılıyor: kuralın kalkma nedeni yorumda
       anlatılıyor, orada geçmesi sorun değil. */
    const kurallar = turStil.replace(/\/\*[\s\S]*?\*\//g, '');
    ['.tour-header-search', '.header-search-text', '.tour-back']
      .forEach(sinif => expect(kurallar, sinif + ' kuralı geride kalmış').not.toContain(sinif));
  });

  it('kırılma noktaları mobilde gizli ama işaretlemede duruyor', () => {
    const mobil = turStil.match(/@media \(max-width: 680px\) \{([\s\S]*?)\n\}/)[1];
    expect(mobil).toContain('.tour-body .tour-crumbs { display: none; }');
    /* Gizlemek silmek değil: işaretleme ve BreadcrumbList yerinde. */
    sayfalar.forEach(({ slug, html }) => {
      expect(html, slug + ' kırılma noktası işaretlemesi silinmiş').toContain('<nav class="tour-crumbs"');
      expect(html, slug + ' BreadcrumbList silinmiş').toContain('"@type": "BreadcrumbList"');
    });
  });
});

/* ---------------- yapışkan alt şerit ---------------- */
describe('formatTrDateRangeShort', () => {
  it('aynı ayda ay bir kez yazılır', () => {
    expect(formatTrDateRangeShort('2026-09-24', '2026-09-27')).toBe('24 – 27 Eylül');
  });

  it('ay değişince iki ay da yazılır', () => {
    expect(formatTrDateRangeShort('2026-09-30', '2026-10-03')).toBe('30 Eylül – 3 Ekim');
  });

  it('yıl değişince de doğru çalışır', () => {
    expect(formatTrDateRangeShort('2026-12-30', '2027-01-02')).toBe('30 Aralık – 2 Ocak');
  });

  it('bitiş yoksa tek tarihe düşer', () => {
    expect(formatTrDateRangeShort('2026-09-24', '')).toBe('24 Eylül Perşembe');
  });

  it('geçersiz girdide boş döner', () => {
    expect(formatTrDateRangeShort('', '')).toBe('');
    expect(formatTrDateRangeShort(null, null)).toBe('');
  });

  it('tam biçimden kısa — dar şeritte sığsın diye', () => {
    const kisa = formatTrDateRangeShort('2026-09-24', '2026-09-27');
    const tam = formatTrDate('2026-09-24') + ' – ' + formatTrDate('2026-09-27');
    expect(kisa.length).toBeLessThan(tam.length);
  });
});

describe('yapışkan alt şerit düzeni', () => {
  it('kişi sayısı fiyatın yanında, alt satırda yalnızca tarih', () => {
    const blok = sayfaJs.match(/bar\.innerHTML = `([\s\S]*?)`;/)[1];
    /* Kişi sayısı fiyat satırının İÇİNDE olmalı. */
    const fiyatSatiri = blok.match(/<span class="tour-sticky-price">([\s\S]*?)<\/span>\s*<span class="tour-sticky-date">/);
    expect(fiyatSatiri, 'fiyat satırı bulunamadı').toBeTruthy();
    expect(fiyatSatiri[1]).toContain('tour-sticky-guests');
    expect(fiyatSatiri[1]).toContain('formatTRY(toplam.total)');
    /* Tarih satırında kişi sayısı KALMAMALI. */
    const tarihSatiri = blok.match(/<span class="tour-sticky-date">([\s\S]*?)<\/span>/)[1];
    expect(tarihSatiri).toContain('dateRangeText');
    expect(tarihSatiri, 'tarih satırında kişi sayısı kalmış').not.toContain('kişi');
  });

  it('şerit kısa tarih biçimini kullanır', () => {
    const blok = sayfaJs.match(/bar\.innerHTML = `([\s\S]*?)`;/)[1];
    expect(blok).toContain('dateRangeText(true)');
  });

  it('fiyat ve kişi sayısı taban hizasında yan yana', () => {
    const kural = turStil.match(/\.tour-sticky-price \{([\s\S]*?)\}/)[1];
    expect(kural).toContain('display: flex');
    expect(kural).toContain('align-items: baseline');
  });

  it('şerit butonu iki satıra sarmaz', () => {
    const kural = turStil.match(/\.tour-cta\.small \{([\s\S]*?)\}/)[1];
    expect(kural).toContain('white-space: nowrap');
  });
});

/* ---------------- banner düğmeleri ve yapışan bölüm menüsü ---------------- */
describe('banner düğmeleri', () => {
  it('galeride favori ve paylaş düğmeleri var, ikisi de erişilebilir', () => {
    const galeri = sayfaJs.match(/function galleryMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(galeri).toContain('tour-gallery-fav');
    expect(galeri).toContain('aria-pressed="false"');
    expect(galeri).toContain("aria-label=\"Favorilere ekle\"");
    /* Paylaş masaüstünde favorinin yanında; ikisi aynı sarmalayıcıda. */
    expect(galeri).toContain('tour-gallery-actions');
    expect(galeri).toContain('id="tourGalleryShare"');
    expect(galeri).toContain("aria-label=\"Turu paylaş\"");
  });

  it('başlık kartında ikinci bir favori/paylaş kalmadı', () => {
    /* İkisi de banner'a taşındı; aynı işi yapan ikinci bir düğme hem
       fazlalık hem de iki düğmenin durumunu eşit tutmayı gerektirir. */
    expect(sayfaJs).not.toContain('tour-head-actions');
    expect(sayfaJs).not.toContain('id="tourFavBtn"');
    expect(sayfaJs).not.toContain('id="tourShareBtn"');
    /* Yorumlar elenerek bakılıyor: kuralın neden kalktığı yorumda
       anlatılıyor, orada geçmesi sorun değil. */
    expect(turStil.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('.tour-head-actions');
  });

  it('favori durumu tek kaynaktan besleniyor', () => {
    expect(sayfaJs).toContain('state.favorite');
    const sync = sayfaJs.match(/function syncFav\(\) \{([\s\S]*?)\n    \}/)[1];
    expect(sync).toContain("getElementById('tourGalleryFav')");
    expect(sync).toContain('state.favorite');
  });

  it('paylaş tek düğme: her iki ekran boyutunda da bannerda', () => {
    /* Mobil başlıktaki ikinci paylaş kaldırıldı; iki düğme aynı işi
       yaparsa biri zamanla diğerinden ayrışır. */
    expect(sayfaJs).toContain("getElementById('tourGalleryShare')");
    expect(sayfaJs).not.toContain('tourHeaderShare');
    /* Mobilde gizleyen bir kural kalmamalı: paylaş orada da görünür. */
    expect(turStil.replace(/\/\*[\s\S]*?\*\//g, ''))
      .not.toMatch(/\.tour-gallery-share \{ display: none/);
  });

  it('banner düğmeleri mobilde daha küçük', () => {
    /* Dar ekranda 34px, masaüstünde 38px. */
    const mobilKural = '.tour-gallery-fav,\n  .tour-gallery-share { width: 34px; height: 34px; }';
    const mobilBloklar = [...turStil.matchAll(/@media \(max-width: 680px\) \{([\s\S]*?)\n\}/g)]
      .map(m => m[1]);
    expect(mobilBloklar.some(b => b.includes(mobilKural)),
      'mobil ölçü kuralı bir mobil blokta değil').toBe(true);
    /* Temel ölçü masaüstünde durmalı. */
    const temel = turStil.match(/\n\.tour-gallery-fav,\n\.tour-gallery-share \{([\s\S]*?)\}/)[1];
    expect(temel).toContain('width: 38px');

    /* ASIL ŞART: mobil kural temel tanımdan SONRA gelmeli. Aynı
       ağırlıktalar; önce gelirse sessizce eziliyor ve düğmeler mobilde
       de 38px kalıyor. Bu dosyada tam olarak böyle bir hata yaşandı. */
    expect(turStil.indexOf(mobilKural))
      .toBeGreaterThan(turStil.indexOf('\n.tour-gallery-fav,\n.tour-gallery-share {'));
  });

  it('favori solda, paylaş sağda', () => {
    /* Sıra işaretlemeden geliyor (flex, satır yönü); favori önce. */
    const galeri = sayfaJs.match(/function galleryMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(galeri.indexOf('id="tourGalleryFav"'))
      .toBeLessThan(galeri.indexOf('id="tourGalleryShare"'));
  });

  it('banner düğmeleri banner’ın üstünde, başlığın altında konumlanıyor', () => {
    /* Mobilde başlık banner'ın üzerine bindiği için düğmelerin üst
       konumu ölçülen başlık yüksekliğinden hesaplanıyor; sabit değer
       verilseydi başlığın altında kalırlardı. Konum sarmalayıcıda:
       iki düğme aynı hizada kalsın diye. */
    const kural = turStil.match(/\.tour-gallery-actions \{([\s\S]*?)\}/)[1];
    expect(kural).toContain('position: absolute');
    expect(kural).toContain('var(--tour-header-h');
    expect(kural).toContain('display: flex');
    expect(sayfaJs).toContain("setProperty('--tour-header-h'");
    /* Ölçüm ekran döndürülünce de tazelenmeli. */
    expect(sayfaJs).toContain("window.addEventListener('resize', syncHeaderHeight)");
  });
});

describe('yapışan bölüm menüsü', () => {
  it('yapışma durumu ölçülüp sınıf olarak veriliyor', () => {
    /* CSS'te "yapıştı" seçicisi yok; durum elemanın üst kenarının kendi
       top değerine oturmasından anlaşılıyor. */
    expect(sayfaJs).toContain("nav.classList.toggle('is-stuck'");
    expect(sayfaJs).toContain('getComputedStyle(nav).top');
  });

  it('kutu kenarlara uzarken çipler yerinde kalıyor', () => {
    /* Yalnızca negatif kenar boşluğu verilseydi çipler de o kadar sola
       kayar, menü yapıştığı anda yanal bir sıçrama olurdu. Dışarı taşan
       kadarı iç boşluğa ekleniyor. */
    const kural = turStil.match(/\.tour-section-nav\.is-stuck \{([\s\S]*?)\}/)[1];
    expect(kural).toContain('padding-left: calc(var(--tour-nav-pad) + var(--page-gutter))');
    expect(kural).toContain('padding-right: calc(var(--tour-nav-pad) + var(--page-gutter))');
    /* Temel iç boşluk aynı değişkenden gelmeli, yoksa telafi tutmaz. */
    const temel = turStil.match(/\.tour-section-nav \{([\s\S]*?)\}/)[1];
    expect(temel).toContain('--tour-nav-pad:');
    expect(temel).toContain('padding: var(--tour-nav-pad)');
  });

  it('yan kenarlıklar kaldırılmıyor, saydamlaştırılıyor', () => {
    /* Kaldırılsaydı kutu modeli 1'er piksel daralır ve çipler o kadar
       kayardı; ekranın en kenarında oldukları için zaten görünmüyorlar. */
    const kural = turStil.match(/\.tour-section-nav\.is-stuck \{([\s\S]*?)\}/)[1];
    expect(kural).toContain('border-left-color: transparent');
    expect(kural).toContain('border-right-color: transparent');
    expect(kural, 'kenarlık kaldırılmış').not.toMatch(/border-left:\s*0/);
    expect(kural, 'kenarlık kaldırılmış').not.toMatch(/border-right:\s*0/);
  });

  it('yapışınca kenarlara uzayıp köşeleri düzleşiyor — yalnızca mobilde', () => {
    const kural = turStil.match(/\.tour-section-nav\.is-stuck \{([\s\S]*?)\}/);
    expect(kural, 'is-stuck kuralı yok').toBeTruthy();
    expect(kural[1]).toContain('border-radius: 0');
    expect(kural[1]).toContain('margin-left: calc(var(--page-gutter) * -1)');
    expect(kural[1]).toContain('margin-right: calc(var(--page-gutter) * -1)');
    /* Kural mobil medya sorgusunun içinde olmalı; masaüstünde menü hap
       biçimini koruyor. */
    const konum = turStil.indexOf('.tour-section-nav.is-stuck');
    const mobilBlok = turStil.lastIndexOf('@media (max-width: 680px)', konum);
    expect(mobilBlok, 'is-stuck kuralı mobil bloğun dışında').toBeGreaterThan(-1);
    expect(turStil.slice(mobilBlok, konum)).not.toContain('@media (min-width');
  });
});

describe('bölüm menüsü otomatik kaydırma', () => {
  it('yalnızca aktif sekme değişince kaydırılıyor', () => {
    /* Önceden her kaydırma karesinde scrollTo({behavior:"smooth"})
       çağrılıyordu; her çağrı yumuşak animasyonu baştan başlattığı için
       menü hiç tamamlanamıyor, yavaş ve takılarak sürükleniyordu. */
    const blok = sayfaJs.match(/function initSectionNav\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(blok).toContain('let sonAktif');
    expect(blok).toMatch(/if \(aktif !== sonAktif\) \{/);
    /* Sınıf güncellemesinin içinde kaydırma KALMAMALI. */
    const sinifDongusu = blok.match(/nav\.querySelectorAll\('\[data-nav\]'\)\.forEach\(link => \{([\s\S]*?)\}\);/)[1];
    expect(sinifDongusu, 'kaydırma hâlâ her karede çalışıyor').not.toContain('scrollTo');
  });

  it('zaten görünen sekme için kaydırma yapılmıyor', () => {
    /* Gereksiz animasyon da takılma hissi veriyor. */
    const blok = sayfaJs.match(/function ortala\(id\) \{([\s\S]*?)\n    \}/)[1];
    expect(blok).toContain('nav.clientWidth - pay');
    expect(blok).toContain('return;');
    /* Hedef, kaydırılabilir aralığın dışına taşmamalı. */
    expect(blok).toContain('Math.min(hedef, enFazla)');
  });

  it('hareket azaltma tercihi burada da geçerli', () => {
    const blok = sayfaJs.match(/function ortala\(id\) \{([\s\S]*?)\n    \}/)[1];
    expect(blok).toContain('azaltilmisHareket()');
  });
});

/* ---------------- benzer turlar, dokunma, sayfa etiketleri ---------------- */
describe('benzer tur kartları', () => {
  it('fotoğraf kutusu içeriğe göre uzayamaz', () => {
    /* Kart sütun yönlü bir flex kabı, medya kutusu da flex öğesi.
       Görsel akışta kalırsa öğenin otomatik en küçük boyutu içeriğe
       göre belirlendiği için DİKEY bir fotoğraf kutuyu aspect-ratio'nun
       üstüne çıkarıyor ve o kartın görseli diğerlerinden uzun duruyor.
       Bu gerçekten yaşandı: dört karttan biri belirgin şekilde uzundu. */
    const kutu = turStil.match(/\.tour-similar-media \{([\s\S]*?)\}/)[1];
    expect(kutu).toContain('aspect-ratio: 4 / 3');
    expect(kutu, 'flex öğesi büyüyebilir durumda').toContain('flex: none');
    expect(kutu).toContain('overflow: hidden');

    const resim = turStil.match(/\.tour-similar-media img \{([\s\S]*?)\}/)[1];
    expect(resim, 'görsel akıştan çıkarılmamış').toContain('position: absolute');
    expect(resim).toContain('object-fit: cover');
  });
});

describe('çift dokunuşla yakınlaştırma', () => {
  it('kural EVRENSEL seçiciyle veriliyor', () => {
    /* touch-action KALITSAL DEĞİL. Kural bir sürüm boyunca yalnızca
       html'e verildi ve iOS Safari'de hiç işe yaramadı: tarayıcı
       dokunulan elemandan yukarı doğru yalnızca onu kapsayan KAYDIRMA
       KABINA kadar bakıyor. Galeri şeridi, rozet şeridi, bölüm menüsü
       ve yorum filtresi kendileri yatay kaydırma kabı olduğu için
       zincir orada bitiyor ve değerleri "auto" kalıyordu; çift dokunuş
       o bloğun içerik genişliğine yakınlaşıp sayfayı yana kaydırıyordu.
       Kuralı html'e geri daraltmak bu hatayı geri getirir. */
    expect(ortakStil).toContain('* { touch-action: manipulation; }');
  });

  it('hiçbir kural touch-action’ı auto’ya geri çevirmiyor', () => {
    /* "auto" dışındaki her değer çift dokunuşu kapatır; auto onu geri
       açar. Özgül seçicili pan-x/pan-y kuralları sorun değil. */
    [['style.css', ortakStil], ['tour.css', turStil]].forEach(([ad, stil]) => {
      expect(stil.replace(/\/\*[\s\S]*?\*\//g, ''), ad + ' auto geri vermiş')
        .not.toContain('touch-action: auto');
    });
  });

  it('ikinci dokunuş JS ile iptal ediliyor', () => {
    /* ÖLÇÜLDÜ: touch-action: manipulation iOS Safari'de bu hareketi
       durdurmuyor. Anasayfada hareketin olmamasının sebebi o değil,
       viewport etiketindeki user-scalable=no -- ama o etiket iki
       parmakla yakınlaştırmayı da kapatıyor. Bu yüzden tur sayfalarına
       kopyalanmadı; yerine ikinci dokunuş JS'te iptal ediliyor. */
    const blok = arayuz.match(/\/\* ===== cift dokunusla yakinlastirma ===== \*\/[\s\S]*$/);
    expect(blok, 'çift dokunuş koruması yok').toBeTruthy();
    const kod = blok[0];

    /* passive: false olmadan preventDefault hiçbir şey yapmaz. */
    expect(kod, 'dinleyici passive').toContain('{ passive: false }');
    expect(kod).toContain("addEventListener('touchend'");
    expect(kod).toContain('preventDefault()');

    /* İki parmağa dokunulmamalı: pinch çalışmaya devam etsin. */
    expect(kod, 'çok parmaklı dokunuş elenmiyor')
      .toContain('if (olay.touches.length || olay.changedTouches.length !== 1) return;');

    /* touchend'de preventDefault o dokunuşun click'ini de yutar. Aynı
       noktaya hızlı iki kez basmanın anlamlı olduğu kontroller dışarıda
       kalmalı, yoksa kişi sayısı tuşları bozulur. */
    const liste = kod.match(/const TEKRAR = '([^']+)'/)[1];
    ['input', '[data-step]', '[aria-pressed]']
      .forEach(sec => expect(liste, sec + ' korunmuyor').toContain(sec));
  });

  it('yatay şeritler parmakla kaymaya devam ediyor', () => {
    /* "manipulation" = pan-x + pan-y + pinch-zoom; yana kaydırma açık
       kalır. Şeritlere yanlışlıkla "none" verilirse kaydırma ölür. */
    const stil = ortakStil + turStil;
    ['.tour-gallery-grid', '.tour-head-chips', '.tour-section-nav', '.h-scroll']
      .forEach(sec => {
        const kural = new RegExp(sec.replace('.', '\\.') + '[^{]*\\{[^}]*touch-action: none');
        expect(stil, sec + ' kaydırması kapatılmış').not.toMatch(kural);
      });
  });

  it('iki parmakla yakınlaştırma tur sayfalarında açık kalıyor', () => {
    /* user-scalable=no yakınlaştırmayı TÜMDEN kapatır ve az gören
       kullanıcıyı sayfadan dışlar; istenen yalnızca çift dokunuştu. */
    sayfalar.forEach(({ slug, html }) => {
      const viewport = html.match(/<meta name="viewport"[^>]*>/)[0];
      expect(viewport, slug + ' yakınlaştırmayı tümden kapatıyor').not.toContain('user-scalable=no');
      expect(viewport, slug + ' yakınlaştırmayı tümden kapatıyor').not.toContain('maximum-scale');
    });
  });
});

describe('sayfa etiketleri', () => {
  it('her turun etiketleri var ve sayfada bir yuvası var', () => {
    Object.values(TOURS).forEach(t => {
      expect(t.tags, t.slug + ' etiketsiz').toBeTruthy();
      expect(t.tags.length, t.slug + ' etiketi az').toBeGreaterThanOrEqual(6);
    });
    sayfalar.forEach(({ slug, html }) => {
      expect(html, slug + ' etiket yuvası yok').toContain('id="tourTags"');
    });
    expect(sayfaJs).toContain("fill('tourTags', tagsMarkup())");
  });

  it('çip görünümü anasayfayla ortak, ayrı bir kopya değil', () => {
    /* İki yerde ayrı çip tanımı tutmak ikisini zamanla ayrıştırır. */
    expect(sayfaJs).toContain('class="seo-chip"');
    expect(sayfaJs).toContain('class="seo-chip-list tour-tag-list"');
    expect(ortakStil).toMatch(/\.seo-chip \{/);
  });

  it('HİÇBİR etiket boşluğa gitmiyor', () => {
    /* docs/seo-arastirma.md madde 4: hedefi olmayan bağlantı ağının
       SEO değeri sıfır. Sayfa içi çapa gerçekten o sayfada, dışa giden
       adres de diskte olmalı. */
    const anaAnkrajlar = new Set(
      [...app.matchAll(/anchor:'([a-z-]+)'/g)].map(m => m[1]));

    sayfalar.forEach(({ slug, html }) => {
      const sayfaCapalari = new Set(
        [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));

      TOURS[slug].tags.forEach(({ label, href }) => {
        expect(label.trim().length, slug + ' boş etiket').toBeGreaterThan(0);

        if (href.charAt(0) === '#') {
          expect(sayfaCapalari, slug + ' -> ' + href + ' çapası sayfada yok')
            .toContain(href.slice(1));
          return;
        }

        const [yol, capa] = href.split('#');
        expect(existsSync(new URL('../' + yol, import.meta.url)),
          slug + ' -> ' + yol + ' diskte yok').toBe(true);
        if (capa) {
          expect(anaAnkrajlar, slug + ' -> #' + capa + ' anasayfada yok').toContain(capa);
        }
      });
    });
  });

  it('kök-göreli adresler sayfanın kökünden kuruluyor', () => {
    /* /tur/<slug>/ iki dizin içeride; etiket adresleri veride kök-göreli
       duruyor ve KOK ile önekleniyor. */
    expect(sayfaJs).toContain("KOK + t.href");
    Object.values(TOURS).forEach(t => {
      t.tags.forEach(({ href }) => {
        expect(href, t.slug + ' -> ' + href + ' zaten göreli önek taşıyor')
          .not.toContain('../');
      });
    });
  });
});

/* ---------------- PDF belgesi ---------------- */
describe('PDF belgesi', () => {
  it('düğme dosyayı veriyor, sayfayı yazdırmıyor', () => {
    expect(pdfJs).toContain("'mola360-' + tur.slug + '.pdf'");
    expect(sayfaJs, 'sayfa yazdırma hâlâ açılıyor').not.toContain('window.print()');
    expect(sayfaJs).toContain('Mola360TourPdf.indir(tour');
  });

  it('indirme blob’u application/octet-stream', () => {
    /* ASIL DUZELTME BURADA. Blob "application/pdf" tipiyle verilince
       Safari dosyayi TANIYOR ve indirmek yerine sekmede aciyor --
       sikayet edilen davranis buydu.

       "application/octet-stream" ile tarayici dosyayi gosteremiyor ve
       kendi indirme onayini aciyor: "... dosyasini indirmek istiyor
       musunuz? / Goruntule / Indir". Tip geri "application/pdf"
       yapilirsa hata sessizce geri gelir; bu yuzden kilitli. */
    const govde = pdfJs.match(/function bagIleIndir\(pdfBlob, ad\) \{([\s\S]*?)\n  \}/)[1];
    expect(govde, 'baytlar yeniden sarılmıyor')
      .toMatch(/new Blob\(\[pdfBlob\], \{ type: 'application\/octet-stream' \}\)/);
    expect(govde).toContain('a.download = ad');
  });

  it('indir düğmesi paylaşım sayfasını AÇMIYOR', () => {
    /* Indir ve paylas ayri dugmeler. Indir dosyayi indirmeli; paylasim
       sayfasini acmak paylas dugmesinin isi. */
    const govde = pdfJs.match(/function kaydet\(tur, blob, bildir\) \{([\s\S]*?)\n  \}/)[1];
    expect(govde, 'indirme yolunda paylaşım var').not.toContain('navigator.share');
    expect(govde, 'indirme yolunda paylaşım var').not.toContain('navigator.canShare');
    /* Sira: masaustu kaydetme penceresi -> dogrudan indirme. */
    expect(govde.indexOf('showSaveFilePicker')).toBeLessThan(govde.lastIndexOf('bagIleIndir'));
  });

  it('paylaşım yolu yalnızca paylaş düğmesinde', () => {
    /* navigator.share YALNIZCA paylas() icinde gecmeli; indir yoluna
       sizarsa iOS'ta yine paylasim sayfasi acilir. */
    const paylasGovde = pdfJs.match(/function paylas\(tur, durum\) \{([\s\S]*?)\n  \}\n/)[1];
    expect(paylasGovde).toContain('navigator.share');
    /* Paylasilan dosya GERCEK tipini korumali: alici uygulama onu PDF
       olarak tanisin. octet-stream yalnizca indirme icin.

       GONDERILEN dosya hedefleniyor. Duz "application/pdf gectiI mi"
       aramasi yetmiyordu: ayni metin yetenek yoklamasindaki sahte
       dosyada da geciyor ve gercek paylasim octet-stream'e cevrilse
       bile test geciyordu. */
    expect(paylasGovde, 'paylaşılan dosyanın tipi PDF değil').toMatch(
      /files: \[new File\(\[blob\], dosyaAdi\(tur\), \{ type: 'application\/pdf' \}\)\]/);
    /* Yetenek yoklamasi da PDF ile yapilmali: bir tarayici metin
       paylasip PDF paylasmiyor olabilir, o zaman yanlis sonuc cikar. */
    expect(paylasGovde, 'yetenek yoklaması PDF ile yapılmıyor')
      .toMatch(/new File\(\[new Blob\(\[\]\)\], '[^']*\.pdf', \{ type: 'application\/pdf' \}\)/);
    expect(pdfJs, 'eski sun() geri gelmiş').not.toContain('function sun(');
  });

  it('dokunuş süresi dolarsa ikinci dokunuş anında çalışır', () => {
    /* Paylaşım ve kaydetme penceresi kullanıcı hareketi içinde
       çağrılmak zorunda; belge üretimi birkaç saniye sürüyor ve süre
       dolabiliyor (NotAllowedError). Belge saklandığı için ikinci
       dokunuş anında sonuçlanıyor. */
    expect(pdfJs).toContain('let hazirBlob = null');
    expect(pdfJs).toContain("if (hazirBlob) return Promise.resolve(kaydet(");
    /* Kaydetme penceresi SecurityError, paylasim NotAllowedError
       atiyor; ikisi de "tekrar"a dusuyor. */
    expect(pdfJs).toContain("'SecurityError'");
    expect(pdfJs).toContain("'NotAllowedError'");
    expect(pdfJs).toContain("bildir('tekrar')");
    expect(sayfaJs).toContain("d === 'tekrar'");
  });

  it('getBlob SÖZ olarak kullanılıyor', () => {
    /* pdfmake 0.3'te getBlob söz döndürüyor (0.2'de geri çağırmaydı).
       Geri çağırma beklemek hata fırlatmadan sonsuza kadar asılı
       bırakıyor; düğme "Hazırlanıyor…" hâlinde kalıyordu. */
    expect(pdfJs).toContain('pdf.getBlob()');
    expect(pdfJs, 'geri çağırma biçimi geri gelmiş').not.toMatch(/getBlob\(\s*(blob|function|\()/);
  });

  it('Ctrl+P sayfayı değil belgeyi yazdırıyor', () => {
    expect(pdfJs).toContain('function yazdir(');
    expect(pdfJs).toContain('pdf.print()');
    expect(sayfaJs).toContain("String(e.key).toLowerCase() !== 'p'");
    expect(sayfaJs).toContain('Mola360TourPdf.yazdir(tour');
  });

  it('kapakta gerçek logo var', () => {
    /* Marka adı yazıyla değil, gerçek logoyla. Logo kendi sunucumuzda
       olduğu için her zaman geliyor; yine de gelmezse yazıya düşüyor. */
    expect(pdfJs).toContain("assets/img/logo.png");
    const kapakGovde = pdfJs.match(/function kapak\(tur, heroVeri, logoVeri\) \{([\s\S]*?)\n  \}/)[1];
    expect(kapakGovde).toContain('image: logoVeri');
    expect(kapakGovde, 'logo gelmezse yazıya düşmüyor').toContain("text: 'MOLA360'");
    expect(existsSync(new URL('../assets/img/logo.png', import.meta.url))).toBe(true);
  });

  it('hiçbir bilgi bölümü ikiye bölünmüyor', () => {
    /* "Fiyata dahil olanlar"ın yarısı bir sayfada yarısı diğerinde
       kalıyordu. Sığmayan bölüm tamamen sonraki sayfaya geçmeli. */
    const govde = pdfJs.match(/function bolum\(baslikMetni, \.\.\.icerik\) \{([\s\S]*?)\n  \}/)[1];
    expect(govde).toContain('unbreakable: true');
    /* Program bu sarmalayıcıya GİRMEZ: sekiz duraklık bir program tek
       sayfaya sığmayabiliyor, sığmayan unbreakable blok ise kırpılır.
       Orada bölünme serbest ama her durak kendi içinde bütün. */
    const prog = pdfJs.match(/function program\(tur, konaklamali\) \{([\s\S]*?)\n  \}/)[1];
    expect(prog, 'duraklar bölünebilir durumda').toContain('dontBreakRows: true');
    const belgeGovde = pdfJs.match(/function belge\(tur, gorseller, logoVeri\) \{([\s\S]*?)\n\n    return \{/)[1];
    expect(belgeGovde, 'program unbreakable sarmalayıcıya girmiş')
      .toContain("icerik.push(bolumBasligi(konaklamali ? 'Gün gün program'");
  });

  it('iki sütun aynı hizadan başlıyor', () => {
    /* Sağ sütunda başlık varken solda yoktu; sağdaki liste bir satır
       aşağıdan başlıyor ve başlık kaymış görünüyordu. */
    const belgeGovde = pdfJs.match(/function belge\(tur, gorseller, logoVeri\) \{([\s\S]*?)\n\n    return \{/)[1];
    expect(belgeGovde).toContain("text: 'Dahil olanlar'");
    expect(belgeGovde).toContain("text: 'Dahil olmayanlar'");
  });

  it('her sayfada iki betik var, sırası doğru', () => {
    sayfalar.forEach(({ slug, html }) => {
      expect(html, slug + ' tour-pdf.js yüklenmiyor').toContain('src="../../assets/js/tour-pdf.js"');
      /* tour-pdf.js, tour-page.js'ten ÖNCE: düğme bağlanırken
         window.Mola360TourPdf hazır olmalı. */
      /* Yorumlarda da adi geciyor; <script src=> uzerinden bakiliyor. */
      expect(html.indexOf('src="../../assets/js/tour-pdf.js"'), slug + ' betik sırası ters')
        .toBeLessThan(html.indexOf('src="../../assets/js/tour-page.js"'));
      /* Kütüphane sayfayla birlikte YÜKLENMEMELİ. */
      expect(html, slug + ' pdfmake sayfayla yükleniyor').not.toContain('vendor/pdfmake');
    });
  });

  it('kütüphane yalnızca düğmeye basılınca, bir kez yükleniyor', () => {
    /* ~1,9 MB. Sayfayı normal gezen ziyaretçiye maliyeti olmamalı. */
    expect(pdfJs).toContain("vendor/pdfmake.min.js");
    expect(pdfJs).toContain("vendor/vfs_fonts.js");
    expect(pdfJs).toContain('let yuklendi = null');
    /* vfs_fonts kendini pdfMake'e kaydediyor; pdfmake ondan önce gelmeli. */
    expect(pdfJs.indexOf('pdfmake.min.js')).toBeLessThan(pdfJs.indexOf('vfs_fonts.js'));
  });

  it('fotoğraf gelmezse belge yine üretiliyor', () => {
    /* Uzak sunucu izin vermezse belge fotoğrafsız çıkmalı, hiç
       çıkmamasındansa. */
    expect(pdfJs).toContain('.catch(() => null)');
    const kapak = pdfJs.match(/function kapak\(tur, heroVeri, logoVeri\) \{([\s\S]*?)\n  \}/)[1];
    expect(kapak, 'fotoğrafsız durum ele alınmamış').toContain('heroVeri');
    expect(kapak).toContain('?');
  });

  it('belge tur kaydından üretiliyor, elle yazılmıyor', () => {
    ['tur.title', 'tur.code', 'tur.included', 'tur.excluded',
     'tur.meeting', 'tur.important', 'tur.cancellation.tiers', 'tur.facts',
     'tur.highlights', 'tur.bring']
      .forEach(alan => expect(pdfJs, alan + ' belgede kullanılmıyor').toContain(alan));
    const govde = pdfJs.match(/function program\(tur, konaklamali\) \{([\s\S]*?)\n  \}/)[1];
    expect(govde).toContain('tur.program');
    expect(govde).toContain('tur.itinerary');
  });

  it('fiyat şeridi grup büyüklüğü yazmıyor', () => {
    /* pricing.maxGuests tek bir rezervasyonda seçilebilecek en fazla kişi
       (6-9); kalkıştaki grup büyüklüğü seatsPerDeparture (16-18). İlki
       "Grup" diye yazılınca belgenin KENDİ künye kartıyla çelişiyordu. */
    /* Tuzagin nedeni yorumda anlatiliyor; kod tarafina bakiliyor. */
    const band = pdfJs.match(/function fiyatSeridi\(tur\) \{([\s\S]*?)\n  \}/)[1]
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(band, 'grup büyüklüğü yanlış alandan yazılmış').not.toContain('maxGuests');
    Object.values(TOURS).forEach(t => {
      const grup = t.facts.find(f => f.label === 'Grup');
      expect(grup, t.slug + ' künyede grup yok').toBeTruthy();
      expect(grup.value).toContain(String(t.pricing.seatsPerDeparture));
    });
  });

  it('sayfa sonu kontrolleri var', () => {
    /* Bölüm başlığı sayfanın dibinde yalnız kalmasın; iptal kademeleri
       ikiye bölünmesin. İkisi de gerçek çıktıda görüldü ve düzeltildi. */
    expect(pdfJs).toContain('pageBreakBefore');
    expect(pdfJs).toContain('headlineLevel === 1 && sonrakiler.length === 0');
    expect(pdfJs).toContain('unbreakable: true');
  });

  it('belge bilet olmadığını söylüyor', () => {
    expect(pdfJs).toContain('bilet veya rezervasyon onayı değildir');
    expect(pdfJs).toContain('fiyatlar ve program değişebilir');
  });

  it('indirme ikonu ikon setinde tanımlı', () => {
    /* Tanımsız ikon boş bir <svg> basar; bu hata bu projede bir kez
       yaşandı (home ikonu). Belge de ikon setinden besleniyor. */
    expect(TOUR_ICONS.download, 'download ikonu yok').toBeTruthy();
    const kullanilan = [...pdfJs.matchAll(/ikon\('([a-zA-Z]+)'/g)].map(m => m[1]);
    const digerleri = [...pdfJs.matchAll(/isaretliListe\([^,]+, '([a-zA-Z]+)'/g)].map(m => m[1]);
    [...new Set([...kullanilan, ...digerleri])].forEach(ad =>
      expect(TOUR_ICONS[ad], ad + ' ikonu tanımsız').toBeTruthy());
  });

  it('ikinci bir belge kopyası geride kalmadı', () => {
    /* Aynı veriden üretilen iki belge elle eşit tutulamaz; HTML baskı
       sayfası indirme gelince kaldırıldı. */
    expect(sayfaJs, 'HTML belge üreticisi duruyor').not.toContain('printSheetMarkup');
    expect(turStil.replace(/\/\*[\s\S]*?\*\//g, ''), 'baskı sayfası stili duruyor')
      .not.toContain('.tour-print-sheet');
    sayfalar.forEach(({ slug, html }) =>
      expect(html, slug + ' belge yuvası duruyor').not.toContain('tourPrintSheet'));
  });

  it('Ctrl+P hâlâ makul bir çıktı veriyor', () => {
    /* Belge kalktı ama yazdırma büsbütün bozulmamalı: yapışkan
       katmanlar ve etkileşim düğmeleri kâğıda düşmesin. */
    const baski = turStil.match(/@media print \{([\s\S]*?)\n\}/)[1];
    ['.site-header', '.tour-sticky-bar', '.tour-section-nav', '.tour-print']
      .forEach(sec => expect(baski, sec + ' kâğıda düşüyor').toContain(sec));
  });

  it('vendor dosyaları yerinde ve belgelenmiş', () => {
    ['assets/js/vendor/pdfmake.min.js', 'assets/js/vendor/vfs_fonts.js',
     'assets/js/vendor/README.md']
      .forEach(y => expect(existsSync(new URL('../' + y, import.meta.url)), y + ' yok').toBe(true));
  });
});

/* ---------------- glow (parlama) ---------------- */
describe('parlama efekti yok', () => {
  /* Yorumlar eleniyor: bir kuralin NEDEN kalktigi yorumda anlatiliyor,
     orada gecmesi sorun degil. */
  const temiz = (stil) => stil.replace(/\/\*[\s\S]*?\*\//g, '');
  const stiller = [['style.css', temiz(ortakStil)], ['tour.css', temiz(turStil)]];

  it('hicbir yerde text-shadow yok', () => {
    /* Yazi golgesi bu sitede hep parlama olarak gorunuyordu -- kampanya
       kartindaki dugme yazisi buna ornekti. Fotograf uzerindeki basliklar
       kontrasti PERDEDEN aliyor, golgeden degil. */
    stiller.forEach(([ad, stil]) => {
      const bulunan = (stil.match(/text-shadow\s*:\s*[^;]+/g) || [])
        .filter(k => !/none/.test(k));
      expect(bulunan, ad + ' icinde text-shadow: ' + bulunan.join(' | ')).toEqual([]);
    });
  });

  it('renkli (marka rengiyle eslesen) golge yok', () => {
    /* Yesil dugmenin altinda yesil golge halo yapiyor. Notr lacivert
       yukseklik golgeleri sorun degil, onlar parlama degil. */
    const markaRenkleri = [
      /140\s*,\s*198\s*,\s*63/,   // --green
      /155\s*,\s*211\s*,\s*79/,   // acik yesil
      /37\s*,\s*211\s*,\s*102/,   // whatsapp yesili
      /var\(--green/
    ];
    stiller.forEach(([ad, stil]) => {
      (stil.match(/box-shadow\s*:\s*[^;]+/g) || []).forEach(kural => {
        kural.split(/,(?![^(]*\))/).forEach(kat => {
          /* Once renk/anahtar kelimeler atiliyor, sonra SAYILAR
             okunuyor. "0 6px 16px" yaziminda ilk degerin birimi yok;
             yalnizca px'leri saymak bu golgeyi tamamen kacirir -- ilk
             surumde tam olarak bu oldu ve test yesil parlamayi
             goremedi. */
          const oncesi = kat
            .replace(/rgba?\([^)]*\)|var\([^)]*\)|#[0-9a-fA-F]{3,8}/g, ' ')
            .replace(/box-shadow\s*:|inset/g, ' ');
          const olcu = (oncesi.match(/-?[\d.]+/g) || []).map(Number);
          /* Bulanikligi olmayan (0 0 0 Npx) bir golge halkadir,
             parlama degil; kenarlik ve odak halkalari oyle. */
          const bulanik = olcu.length >= 3 && olcu[2] > 0;
          if (!bulanik) return;
          markaRenkleri.forEach(renk => {
            expect(renk.test(kat), ad + ' icinde renkli parlama: ' + kat.trim()).toBe(false);
          });
        });
      });
    });
  });

  it('odak halkalari duruyor', () => {
    /* Parlama temizligi klavye erisilebilirligini bozmamali: odak
       gostergeleri solid outline, golge degil. */
    expect(turStil).toMatch(/:focus-visible[\s\S]{0,120}outline:\s*\d+px solid/);
  });

  it('yukseklik golgeleri korundu', () => {
    /* Kartlarin notr golgesi parlama degil; hepsi silinseydi arayuz
       duzlesirdi. */
    expect(ortakStil).toMatch(/--shadow:\s*0 3px 12px rgba\(21,32,72/);
    expect(ortakStil).toMatch(/--shadow-lg:\s*0 8px 22px rgba\(21,32,72/);
  });
});

/* ---------------- yan cevirme, ikon olculeri, iletisim ---------------- */
describe('yan çevirince yazı ölçüleri', () => {
  it('tarayıcının kendi yazı büyütmesi kapalı', () => {
    /* Telefon yan çevrilince WebKit "metin otomatik büyütme" devreye
       girip BAZI paragrafları büyütüyordu: gövde metni üstündeki kalın
       etiketten daha iri görünüyordu. Hepsi birden büyümediği için
       ölçüler birbirine göre bozuluyor.

       Neden yalnızca tur sayfalarında görülüyor: anasayfanın viewport
       etiketinde user-scalable=no var, WebKit de yakınlaştırılamayan
       sayfalarda bu büyütmeyi hiç uygulamıyor. Tur sayfalarında o etiket
       bilerek yok (aşağıdaki viewport testi bunu koruyor), dolayısıyla
       çözüm CSS'ten gelmeli: user-scalable=no kopyalamak hatayı
       kapatırdı ama kullanıcının parmakla yakınlaştırmasını da alırdı. */
    const kural = ortakStil.match(/\nhtml \{([\s\S]*?)\n\}/)[1];
    /* Iki ayri satir aranirken duz "toContain" ise yaramaz: eki olan
       "-webkit-text-size-adjust" metni standart adi da icerdigi icin
       standart satir silinse bile test gecerdi. Satir basina bakiliyor. */
    const satirlar = kural.split('\n').map(s => s.trim());
    expect(satirlar).toContain('-webkit-text-size-adjust: 100%;');
    expect(satirlar).toContain('text-size-adjust: 100%;');
  });

  it('akışkan yazı ölçüleri clamp ile sınırlı', () => {
    /* vw tabanlı ölçüler yan çevrilince üç katına çıkabilir; alt ve üst
       sınır olmadan başlıklar ekranı doldurur. */
    const vwOlculeri = turStil.match(/font-size:[^;]*vw[^;]*/g) || [];
    expect(vwOlculeri.length).toBeGreaterThan(0);
    vwOlculeri.forEach(k =>
      expect(k, 'sınırsız vw ölçüsü: ' + k).toContain('clamp('));
  });
});

describe('ikon ölçüleri', () => {
  /* ic() ikonu <span class="icon"> icine sarar; tourSvg() ciplak bir
     <svg> dondurur. CSS yalnizca ".X .icon" boyutu veriyorsa ciplak svg
     o kuraldan etkilenmez ve dugmeyi baştan basa kaplar.

     Rezervasyon ozeti sayfasinin kapatma dugmesinde tam olarak bu oldu:
     19px olmasi gereken carpi 38px cikti ve dairenin disina tasti. */
  const ciplak = [...sayfaJs.matchAll(
    /class="([a-z0-9 -]+)"[^>]*>\$\{tourSvg\(/g)].map(m => m[1].split(/\s+/)[0]);

  it('çıplak tourSvg kullanan her sınıfın svg ölçü kuralı var', () => {
    expect(ciplak.length, 'örüntü hiç eşleşmedi, test ölmüş olabilir')
      .toBeGreaterThan(3);
    [...new Set(ciplak)].forEach(sinif => {
      const kural = new RegExp('\\.' + sinif + '\\s+svg\\b');
      expect(kural.test(turStil),
        '.' + sinif + ' çıplak <svg> basıyor ama ".' + sinif +
        ' svg" ölçü kuralı yok').toBe(true);
    });
  });

  it('rezervasyon özeti kapatma düğmesi ic() kullanıyor', () => {
    const blok = sayfaJs.match(/data-sheet="close" aria-label="Kapat">([^<]*)</)[1];
    expect(blok, 'çıplak tourSvg geri gelmiş').toContain("ic('close')");
  });
});

describe('PDF indirme ve paylaşma düğmeleri', () => {
  it('düğme satırı program bölümünün EN ALTINDA', () => {
    /* Bir donem kendi bolumu vardi (#tourPrint) ve sayfanin %90'indaydi.
       Bolum kaldirildi; iki dugme programin sonuna eklendi. */
    const fn = sayfaJs.match(/function itineraryMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn, 'düğmeler programın sonuna eklenmiyor').toContain('docActionsMarkup()');
    expect(sayfaJs, 'eski kart geri gelmiş').not.toContain('printCardMarkup');
    expect(sayfaJs, 'eski bölüm doldurması geri gelmiş').not.toContain("fill('tourPrint'");
  });

  it('eski PDF bölümü hiçbir sayfada kalmadı', () => {
    sayfalar.forEach(({ slug, html }) => {
      expect(html, slug + ' hâlâ #tourPrint taşıyor').not.toContain('id="tourPrint"');
    });
  });

  it('indir ve paylaş ayrı düğmeler, ayrı işlevler', () => {
    const fn = sayfaJs.match(/function docActionsMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('Tur programını PDF indir');
    expect(fn, 'indir düğmesi yok').toMatch(/<button[^>]*\bdata-pdf\b[^>]*>/);
    expect(fn, 'paylaş düğmesi yok').toMatch(/<button[^>]*\bdata-pdf-share\b[^>]*>/);
    /* Ikon-only dugme ekran okuyucuda adsiz kalmasin. */
    expect(fn, 'paylaş düğmesinin erişilebilir adı yok').toContain('aria-label=');
    /* Iki dugme AYRI isleve baglanmali; ikisi de indir() cagirsaydi
       paylas dugmesi anlamsiz olurdu. */
    expect(sayfaJs).toContain('Mola360TourPdf.indir(tour, d)');
    expect(sayfaJs).toContain('Mola360TourPdf.paylas(tour, d)');
  });

  it('kare düğmenin metni ezilmiyor', () => {
    /* "Hazirlaniyor..." metni genis dugmede gosteriliyor; kare dugmeye
       yazilsaydi ikonu silip kutuyu bozardi. */
    const fn = sayfaJs.match(/function belgeyiAc\(dugme, is\) \{([\s\S]*?)\n    \}/)[1];
    expect(fn).toContain("hasAttribute('data-pdf-share')");
    /* IKI yer de korunmali: metni yazan satir ve geri alan satir.
       Tek bir "if (!ikonlu) dugme.innerHTML" aramasi yetmiyordu --
       biri korumasiz kalsa oteki eslesip testi geciriyordu. */
    expect(fn, 'kare düğmeye de "Hazırlanıyor" yazılıyor')
      .toMatch(/if \(!ikonlu\) dugme\.innerHTML = ic\('download'\)/);
    expect(fn, 'kare düğmenin içeriği geri yazılıyor')
      .toMatch(/if \(!ikonlu\) dugme\.innerHTML = ilkMetin/);
  });

  it('paylaş düğmesi kare: genişlik yükseklikten türüyor', () => {
    /* Sabit "width" yazilsaydi indir dugmesinin yuksekligi degisince
       kare bozulurdu; nitekim once 46x52 ve 21x52 cikti. Grid satiri +
       height:100% + aspect-ratio bunu kesin yapiyor. */
    const satir = turStil.match(/\.tour-doc-actions \{([^}]*)\}/)[1];
    expect(satir, 'grid değil — kare genişliği içerikten hesaplanır').toContain('display: grid');
    const kare = turStil.match(/\.tour-doc-actions \.tour-doc-share \{([^}]*)\}/);
    expect(kare, 'kare düğme kuralı düşük özgüllükte').not.toBe(null);
    expect(kare[1]).toContain('aspect-ratio: 1');
    expect(kare[1]).toContain('height: 100%');
  });

  it('dosya paylaşımı yoksa bağlantı paylaşılıyor', () => {
    /* Firefox ve eski surumler dosya paylasamiyor. Belgeyi bosuna
       uretmek yerine sayfanin baglantisi paylasiliyor. */
    expect(pdfJs, 'paylas dışa aktarılmamış').toMatch(/paylas:\s*paylas/);
    expect(pdfJs).toContain("bildir('dosyasiz')");
    expect(sayfaJs, '"dosyasiz" durumu karşılanmıyor').toMatch(/'dosyasiz'\)\s*paylas\(\)/);
  });
});

describe('katman açıkken arka sayfa kilidi', () => {
  const kilit = () => sayfaJs.match(/function lockScroll\(on\) \{([\s\S]*?)\n  \}/)[1];

  it('gövde sabitleniyor — html overflow tek başına yetmiyor', () => {
    /* iOS Safari "html { overflow: hidden }" kuralini dokunmatik
       kaydirmada uygulamiyor; sayfa parmakla yine kayiyordu. Calisan
       yol govdeyi sabitlemek: belgenin kaydirilacak yuksekligi
       kalmiyor. */
    const k = kilit();
    expect(k, 'gövde sabitlenmiyor').toMatch(/govde\.style\.position = 'fixed'/);
    expect(k, 'konum korunmuyor — sayfa yukarı zıplar')
      .toMatch(/govde\.style\.top = -kilitliY \+ 'px'/);
  });

  it('kilit açılınca konum geri veriliyor', () => {
    const k = kilit();
    expect(k).toMatch(/govde\.style\.removeProperty\('position'\)/);
    expect(k).toMatch(/govde\.style\.removeProperty\('top'\)/);
    expect(k, 'sayfa eski konumuna dönmüyor').toMatch(/window\.scrollTo\(0, kilitliY\)/);
  });

  it('üst üste iki katmanda konum kaybolmuyor', () => {
    /* Ikinci kilit konumu yeniden okusaydi 0 yazardi (govde zaten
       sabit, scrollY 0). Sayac ilk kilidi ve son acmayi ayirt ediyor. */
    const k = kilit();
    expect(k, 'kilit sayacı yok').toContain('kilitSayaci');
    expect(k, 'ikinci kilit konumu eziyor').toMatch(/kilitSayaci > 1\)\s*return/);
    expect(k, 'ilk açma kilidi erken kaldırıyor').toMatch(/kilitSayaci > 0\)\s*return/);
  });

  it('hem rezervasyon özeti hem ışık kutusu kilitliyor', () => {
    /* Ikisi de tam ekran katman; ikisinde de arka sayfa durmali. */
    const ac = sayfaJs.match(/function openSheet\(\) \{([\s\S]*?)\n  \}/)[1];
    const kapa = sayfaJs.match(/function closeSheet\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(ac).toContain('lockScroll(true)');
    expect(kapa).toContain('lockScroll(false)');
    /* lockScroll dort yerde cagriliyor: iki katman x ac/kapa. */
    expect((sayfaJs.match(/lockScroll\((true|false)\)/g) || []).length).toBe(4);
  });

  it('panelin kendi kaydırması kapanmıyor', () => {
    /* Govde sabitlenince sayfa duruyor ama katman panelinin icindeki
       kaydirma calismaya devam etmeli, yoksa uzun ozet okunamaz. */
    const kural = turStil.match(/\.tour-sheet-panel \{([\s\S]*?)\}/)[1];
    expect(kural).toMatch(/overflow-y:\s*auto/);
    expect(kural).toMatch(/max-height:/);
  });
});

describe('yapışkan tur başlığı', () => {
  it('başlık sayfayla kaymıyor', () => {
    /* Musteri hangi turu inceledigini kaybetmesin diye tur adi yukarida
       kaliyor. Onceden "absolute"ti ve banner'la birlikte kayboluyordu. */
    const mobil = turStil.match(/@media \(max-width: 680px\) \{([\s\S]*?)\n\}/)[1];
    const kural = mobil.match(/\.tour-mobile-header \{\n([\s\S]*?)\}/)[1];
    expect(kural).toContain('position: fixed');
  });

  it('bölüm menüsü başlığın altına yapışıyor, üstüne binmiyor', () => {
    /* Ikisi de top:0 olsaydi menu sabit basligin altinda kalirdi.
       Masaustunde baslik gizli oldugu icin degisken 0. */
    const kural = turStil.match(/\.tour-section-nav \{([\s\S]*?)\}/)[1];
    expect(kural).toMatch(/top:\s*var\(--tour-header-h/);
  });

  it('sabit başlık her kaydırma konumunda aynı görünüyor', () => {
    /* Baslik bir sure "daralıyordu": asagi kaydirinca alt satir gizlenip
       yukseklik dusuyordu. Musteri ayni turun basligini iki ayri
       bicimde goruyordu; tur icerigi basligiyla ayni olmasi istendi.
       Bu yuzden daraltmanin HEM kurallari HEM kancasi kalkti. */
    expect(turStil, 'daraltma kuralları geri gelmiş').not.toContain('is-daralmis');
    expect(sayfaJs, 'daraltma kancası geri gelmiş').not.toContain('is-daralmis');
    expect(sayfaJs, 'daraltma kancası geri gelmiş').not.toContain('initStickyHeader');
    /* Yukseklik artik sabit ama guvenli alan payi ve donme ile
       degisebiliyor; olcum duruyor. */
    expect(sayfaJs).toContain('window.addEventListener(\'resize\', syncHeaderHeight)');
    expect(sayfaJs).toContain('window.addEventListener(\'orientationchange\', syncHeaderHeight)');
    /* Yuvarlaklik da her konumda duruyor: hicbir kural onu sifirlamiyor. */
    expect(turStil).not.toMatch(/\.tour-mobile-header[^{]*\{[^}]*border-bottom-left-radius:\s*0/);
  });

  it('başlığın alt köşe yarıçapı tek bir belirteçten geliyor', () => {
    /* Menunun kose oyugunu dolduran serit, yaricapin TAM boyunda olmak
       zorunda: kisa kalirsa oyuk durur, uzun olursa serit basligin
       altindan tasar. Iki yerde ayri ayri yazilsaydi biri degistiginde
       digeri sessizce yanlis kalirdi. */
    expect(ortakStil, 'ortak yuvarlaklık belirteci yok')
      .toMatch(/--m360-header-radius:\s*22px/);
    expect(ortakStil, 'ortak başlık kuralı belirteci kullanmıyor').toMatch(
      /\.tour-mobile-header \{[^}]*border-bottom-left-radius:\s*var\(--m360-header-radius\)/);
    expect(ortakStil, 'ortak başlık kuralı belirteci kullanmıyor').toMatch(
      /\.tour-mobile-header \{[^}]*border-bottom-right-radius:\s*var\(--m360-header-radius\)/);
  });

  it('yapışık menü başlığın köşe oyuğunu KENDİ zeminiyle dolduruyor', () => {
    /* Baslik yuvarlak, menu yapisikken duz: birlestikleri yerde iki
       kosede birer oyuk kaliyor ve oradan arkadaki icerik goruruyordu.
       Anasayfada arama kutusuyla filtre cubugunun bulustugu yerdeki
       cozumun ayni (.filter-bar.is-stuck::before).

       Dolgu, menunun KENDI zemini: oyuk hemen altindaki cubugun devami
       gibi gorunsun diye. Sayfa zemini (--bg) denendi ve oyuk gri bir
       kama olarak ayri okunuyordu; anasayfada iki yuzey zaten ayni renk
       oldugu icin orada bu ayrim hic dogmuyor. */
    const kural = turStil.match(
      /\.tour-section-nav\.is-stuck \{([\s\S]*?)\n  \}/)[1];
    const golge = kural.match(/box-shadow:([\s\S]*?);/)[1];
    /* Dolgu serit: yukari dogru, bulaniksiz, yaricapla AYNI yukseklikte
       ve cubugun zemin degiskeninde. */
    expect(golge, 'dolgu şeridi yok ya da yanlış renkte/yükseklikte')
      .toMatch(/0 calc\(-1 \* \(var\(--m360-header-radius\) \+ 1px\)\) 0 var\(--tour-nav-bg\)/);
    /* Normal dusen golge DURUYOR: dolgu onun yerine gecmiyor. */
    expect(golge, 'menünün düşen gölgesi kaybolmuş')
      .toMatch(/0 4px 14px rgba\(21,32,72,\.1\)/);
    /* Serit once yaziliyor: dusen golgenin yukari tasan bulanikligini
       kapatsin diye. Sonra yazilsaydi golge seridin ustune binerdi. */
    expect(golge.indexOf('var(--tour-nav-bg)'))
      .toBeLessThan(golge.indexOf('rgba(21,32,72,.1)'));
    /* Cubugun zemini o degiskenden geliyor; boylece oyuk ile cubuk
       farkli bir renge kayamaz. */
    const taban = turStil.match(/\.tour-section-nav \{([\s\S]*?)\n\}/)[1];
    expect(taban, 'çubuğun zemini değişkenden gelmiyor')
      .toMatch(/background:\s*var\(--tour-nav-bg\)/);
    expect(kural, 'yapışık haldeki zemin değişkeni tanımlanmamış')
      .toMatch(/--tour-nav-bg:\s*rgba\(255,255,255,\.97\)/);
    /* Ust kenarlik saydam: 1 px'lik gri cizgi oyugu asagidaki cubuktan
       ayiran bir dikis gibi goruruyordu. */
    expect(kural, 'üst kenarlık saydamlaştırılmamış')
      .toMatch(/border-top-color:\s*transparent/);
    /* YALNIZCA yapisikken: sayfanin en ustunde oyuklarin arkasinda
       banner fotografi var, orada beyaz bir serit yanlis olurdu. */
    expect(taban, 'dolgu şeridi yapışık olmayan menüye de uygulanmış')
      .not.toContain('--m360-header-radius');
  });

  it('köşe oyuğu ::before ile değil gölgeyle dolduruluyor', () => {
    /* Menude overflow-x: auto var (cipler yana kayiyor). Bu, kutunun
       DISINA tasan mutlak konumlu cocuklari kirpar; anasayfadaki
       .filter-bar.is-stuck::before seridinin buradaki karsiligi
       gorunmez olurdu -- anasayfada kaydirma ayri bir ic kutuda oldugu
       icin orada sorun cikmiyor. Elemanin KENDI golgesi kirpilmaz. */
    /* DIKKAT: kuralin GOVDESI ayiklanip orada aranir. Dogrudan
       /\.tour-section-nav \{[\s\S]*?overflow-x/ yazilsaydi tembel eslesme
       kapanis suslu parantezini asip ilerideki BASKA bir kuraldaki
       overflow-x'e uzanir ve sav bosa cikardi. */
    const nav = turStil.match(/\.tour-section-nav \{([\s\S]*?)\n\}/)[1];
    expect(nav, 'yana kaydırma yok; kırpma gerekçesi de yok')
      .toMatch(/overflow-x:\s*auto/);
    expect(turStil, 'kırpılacak bir ::before eklenmiş')
      .not.toContain('.tour-section-nav.is-stuck::before');
  });
});

describe('rezervasyon panelindeki iletişim kartları', () => {
  const blok = () => sayfaJs.match(
    /<div class="tour-booking-contact">([\s\S]*?)<\/div>/)[1];

  it('telefonun altında WhatsApp kartı var, ikisi aynı biçimde', () => {
    const b = blok();
    expect(b).toContain('CONTACT.phoneHref');
    expect(b).toContain('CONTACT.whatsappHref');
    /* Sira: once telefon, sonra WhatsApp. */
    expect(b.indexOf('phoneHref')).toBeLessThan(b.indexOf('whatsappHref'));
    /* Ikisi de ayni kart bicimini kullaniyor. */
    expect(b.match(/class="tour-booking-help"/g)).toHaveLength(2);
    /* Disa acilan baglanti guvenli. */
    expect(b).toContain('rel="noopener"');
  });

  it('WhatsApp kartı dolgulu logo yardımcısını kullanıyor', () => {
    /* ic() cizgi ikonu basar; WhatsApp logosu dolu bir sekil oldugu icin
       kendi yardimcisi var (dolguyu CSS kurali veriyor). */
    const b = blok();
    expect(b, 'çizgi ikonu kullanılmış').toContain('whatsappIkon()');
    expect(b).not.toMatch(/ic\('whatsapp'\)/);
  });

  it('WhatsApp kartının alt satırı durum ışığı', () => {
    const b = blok();
    expect(b, 'alt satır hâlâ düz saat metni').toContain('destekDurumu()');
    const fn = sayfaJs.match(/function destekDurumu\(\)\s*\{([\s\S]*?)\n  \}/)[1];
    /* Isik SAATE bagli olmali; sabit yesil yanlis bilgi olurdu. */
    expect(fn, 'ışık saate bağlı değil').toContain('supportOnline(');
    /* Cagrinin TAM sekli sinaniyor: iki saat de CONTACT'tan gelmeli.
       Parca parca "toContain" ile bakmak yetmiyordu -- acilis sabit
       sayiya cevrildiginde metin asagidaki kapali mesajinda hala
       gectigi icin test geciyordu. */
    expect(fn, 'saatler CONTACT\'tan gelmiyor ya da çağrı değişmiş').toMatch(
      /supportOnline\(\s*new Date\(\)\s*,\s*CONTACT\.whatsappOpenHour\s*,\s*CONTACT\.whatsappCloseHour\s*\)/);
    expect(fn).toContain('Çevrimiçi');
    /* Renk tek basina bilgi tasimasin: kapaliyken metin de degissin. */
    expect(fn, 'kapalıyken metin değişmiyor').toMatch(/Şu an kapalı/);
  });

  it('durum ışığında parlama yok ve satır yatay', () => {
    /* docs/arayuz-kurallari.md: sitede hale/glow yok. */
    const kural = turStil.match(/\.tour-durum i \{([^}]*)\}/);
    expect(kural, '.tour-durum i kuralı yok').not.toBe(null);
    expect(kural[1], 'ışığa gölge/parlama eklenmiş').not.toMatch(/box-shadow/);
    /* ".tour-booking-help span" kuralı bu span'i SUTUN yapiyordu;
       geri alan kural iki sınıflı olmak zorunda. */
    const yon = turStil.match(/\.tour-booking-help \.tour-durum \{([^}]*)\}/);
    expect(yon, 'düşük özgüllüklü seçici — üstteki kural kazanır').not.toBe(null);
    expect(yon[1].replace(/\s+/g, ' ')).toMatch(/flex-direction:\s*row/);
  });

  it('iki kart arasındaki boşluk sarmalayıcıdan geliyor', () => {
    const kural = turStil.match(/\.tour-booking-contact\s*\{([^}]*)\}/);
    expect(kural, '.tour-booking-contact kuralı yok').not.toBe(null);
    expect(kural[1].replace(/\s+/g, ' ')).toMatch(/gap:\s*\d/);
  });
});

describe('rezervasyon özetindeki iletişim düğmeleri', () => {
  it('telefonun altında WhatsApp düğmesi var, ikisi de beyaz', () => {
    const blok = sayfaJs.match(/<div class="tour-sheet-actions">([\s\S]*?)<\/div>/)[1];
    expect(blok).toContain('CONTACT.phoneHref');
    expect(blok).toContain('CONTACT.whatsappHref');
    /* Sira: once telefon, sonra WhatsApp. */
    expect(blok.indexOf('phoneHref')).toBeLessThan(blok.indexOf('whatsappHref'));
    /* Ikisi de beyaz (ghost); yesil olan yalnizca "Anladim". */
    const wa = blok.match(/<a class="([^"]+)" href="\$\{CONTACT\.whatsappHref\}/)[1];
    expect(wa).toContain('ghost');
    expect(blok).toContain('rel="noopener"');
  });

  it('masaüstünde onay düğmesi alt satırı tek başına kaplıyor', () => {
    /* 681px ustunde dugmeler 2 sutunlu grid'e giriyor. WhatsApp eklenene
       kadar dugme sayisi 2'ydi ve satir kendiliginden doluyordu; 3 olunca
       "Anladim" yarim genislikte kalip saginda bosluk biraktı. */
    const blok = turStil.match(
      /@media \(min-width: 681px\) \{\s*\.tour-sheet-actions \{[^}]*\}([\s\S]*?)\n\}/);
    expect(blok, '681px bloğu bulunamadı').not.toBe(null);
    expect(blok[1].replace(/\s+/g, ' '), 'onay düğmesi tüm sütunları kaplamıyor')
      .toMatch(/\[data-sheet="close"\][^{]*\{[^}]*grid-column:\s*1\s*\/\s*-1/);
  });

  it('WhatsApp logosunun yolu tek kaynaktan geliyor', () => {
    const govde = sayfaJs.match(/const whatsappIkon = \(\) =>([\s\S]*?);\n/)[1];
    expect(govde, 'yol elle kopyalanmış').toContain('WHATSAPP_ICON_PATH');
    /* Kaynak home-blocks.js; tur sayfasi onu zaten yukluyor. */
    expect(bloklar).toContain('const WHATSAPP_ICON_PATH');
  });

  it('WhatsApp logosu DOLU çiziliyor — dolgu CSS kuralından geliyor', () => {
    /* TOUR_ICONS ikonlari CIZGI ile ciziliyor; style.css'te
       ".icon svg { fill: none; stroke: currentColor }" var. WhatsApp
       logosu DOLU bir sekil oldugu icin o kural geri alinmali.

       Bu testin ilk hali yanlisti: svg'de fill="currentColor" NITELIGI
       arıyordu. Nitelik kaynakta duruyordu, test geciyordu, ama ekranda
       hicbir sey degismiyordu -- fill/stroke birer sunum niteligi ve
       herhangi bir CSS kurali onlari yener. Logo cizgiyle cizilip
       19px'te tikanmis bir yumru olarak cikiyordu. Bu yuzden test artik
       niteligi degil, ise yarayan tek seyi arıyor: CSS kuralini. */
    const govde = sayfaJs.match(/const whatsappIkon = \(\) =>([\s\S]*?);\n/)[1];

    /* Sarmalayici span'in "icon" disinda bir sinifi olmali; kural ona bagli. */
    const sinifOzniteligi = govde.match(/class="icon ([a-z0-9-]+)"/);
    expect(sinifOzniteligi, 'sarmalayicida ayirt edici sinif yok').not.toBe(null);
    const sinif = sinifOzniteligi[1];

    /* O sinif icin tour.css'te svg kurali var mi ve dolguyu veriyor mu? */
    const kural = turStil.match(
      new RegExp('\\.' + sinif + '[^{]*svg\\s*\\{([^}]*)\\}'));
    expect(kural, '.' + sinif + ' icin svg kurali yok').not.toBe(null);
    expect(kural[1].replace(/\s+/g, ' '), 'dolgu verilmemis')
      .toMatch(/fill:\s*currentColor/);
    expect(kural[1].replace(/\s+/g, ' '), 'cizgi kapatilmamis')
      .toMatch(/stroke:\s*none/);

    /* Nitelik yeniden eklenirse bu yanilticidir: ise yaramaz ama
       yaradigi sanilir. Ozellikle yasaklaniyor. */
    expect(govde, 'fill niteligi CSS\'i yenemez, kurala guven')
      .not.toContain('fill="');
  });
});
