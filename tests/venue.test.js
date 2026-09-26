/* Mekan icerik sayfasi (/mekan/<slug>/) testleri.

   Mekanin diger dort turden farki: bir TARIHI degil bir YERI var, ve
   satilan sey mekana gore degisiyor. Tek sayfa iki rezervasyon modeline
   hizmet ediyor ve bu dosya ikisini de ayri ayri sinamak icin iki kayit
   kullaniyor:

     masa     Kum Beach Club    -> gun + saat + ALAN + kisi, kapora
     randevu  Kordon Spa & Masaj -> gun + saat + HIZMET + kisi, mekanda odeme

   Mekana ozgu uc kural burada bekcilik ediliyor: gece yarisini asan
   calisma saatleri, minimum harcamanin odenecek tutara GIRMEMESI ve
   hizmet tanimi geregi sabit kisi sayisi. */
import { describe, it, expect } from 'vitest';
import { MolaVeri, KAPI_SITE_ADRESI } from '../assets/js/data-gateway.js';
import { readFileSync, existsSync } from 'node:fs';
import {
  PLACES,
  DEFAULT_VENUE_SLUG,
  VENUE_IMAGE_FILES,
  venueImage,
  venueHoursFor,
  venueOpenNow,
  venueOptions,
  venueOption,
  venueSlots,
  venueSlot,
  clampVenueParty,
  venueAddonLines,
  calcVenueBooking,
  venuePriceFrom,
  venuePriceUnit,
  venueSlugFromPath,
  resolveVenue,
} from '../assets/js/venue-data.js';
import { TOUR_ICONS, ratingSummary } from '../assets/js/tour-data.js';
import { catalogCards, catalogAllCards, venueCatalogCard } from '../assets/js/catalog.js';

const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');

const sayfaJs = oku('assets/js/venue-page.js');
const veriJs = oku('assets/js/venue-data.js');
const app = oku('assets/js/app.js');
const bloklar = oku('assets/js/home-blocks.js');
const mekanStil = oku('assets/css/venue.css');
const turStil = oku('assets/css/tour.css');

const sayfalar = Object.keys(PLACES).map(slug => ({
  slug,
  mekan: PLACES[slug],
  html: oku('mekan/' + slug + '/index.html')
}));

const plaj = PLACES['kum-beach-club'];
const spa = PLACES['kordon-spa-masaj'];
const BUGUN = '2026-09-21';

/* ---------------- calisma saatleri ---------------- */
describe('calisma saatleri', () => {
  it('gunun kaydi okunuyor', () => {
    /* 0 = pazar. */
    expect(venueHoursFor(plaj, 1).open).toBe('09:00');
    expect(venueHoursFor(spa, 0).closed).toBe(true);
  });

  it('gunduz acik, sabaha karsi kapali', () => {
    expect(venueOpenNow(plaj, new Date(2026, 8, 22, 13, 0)).open).toBe(true);
    expect(venueOpenNow(plaj, new Date(2026, 8, 22, 5, 0)).open).toBe(false);
  });

  it('gece yarisini asan vardiya duna ait sayiliyor', () => {
    /* Kulup 09:00 - 02:00 calisiyor; saat 01:30'da mekan ACIK ama o
       saat DUNUN vardiyasina ait. Dunun kaydina bakilmazsa gece gelen
       ziyaretci "kapali" gorur -- mekan sayfasinin en pahali hatasi. */
    const gece = venueOpenNow(plaj, new Date(2026, 8, 22, 1, 30));
    expect(gece.open).toBe(true);
    expect(gece.close).toBe('02:00');
  });

  it('gece yarisini asmayan mekanda ayni saat kapali', () => {
    /* Spa 10:00 - 21:00; saat 01:30 kapali olmali. */
    expect(venueOpenNow(spa, new Date(2026, 8, 22, 1, 30)).open).toBe(false);
  });

  it('kapali gunde bir sonraki acilis yaziyor', () => {
    /* "Kapali" demek tek basina ise yaramiyor; ne zaman acilacagi lazim.
       20 Eylul 2026 pazar: spa kapali, ertesi gun 10:00'da aciliyor. */
    const durum = venueOpenNow(spa, new Date(2026, 8, 20, 12, 0));
    expect(durum.open).toBe(false);
    expect(durum.text).toContain('Pazartesi');
    expect(durum.text).toContain('10:00');
  });

  it('acilistan once bugunun saatini soyluyor', () => {
    const durum = venueOpenNow(spa, new Date(2026, 8, 21 + 1, 8, 0));
    expect(durum.open).toBe(false);
    expect(durum.text).toContain('Bugün');
  });

  it('gecersiz zaman sessizce kapali donuyor', () => {
    expect(venueOpenNow(plaj, 'olmayan-tarih').open).toBe(false);
  });

  it('her gun icin kayit var', () => {
    Object.values(PLACES).forEach(m => {
      const gunler = m.hours.map(h => h.day).sort();
      expect(gunler, m.slug + ' eksik gun').toEqual([0, 1, 2, 3, 4, 5, 6]);
      m.hours.forEach(h => {
        expect(h.label, m.slug + ' gun adi yok').toBeTruthy();
        if (!h.closed) {
          expect(h.open, m.slug + ' acilis yok').toMatch(/^\d{2}:\d{2}$/);
          expect(h.close, m.slug + ' kapanis yok').toMatch(/^\d{2}:\d{2}$/);
        }
      });
    });
  });
});

/* ---------------- alan / hizmet ---------------- */
describe('alan ve hizmet secimi', () => {
  it('model kaydin booking alanindan geliyor', () => {
    expect(plaj.booking).toBe('masa');
    expect(spa.booking).toBe('randevu');
    expect(venueOptions(plaj)).toBe(plaj.areas);
    expect(venueOptions(spa)).toBe(spa.services);
  });

  it('taninmayan kimlik ilk kayda duser', () => {
    expect(venueOption(plaj, 'yok').id).toBe(plaj.areas[0].id);
    expect(venueOption(spa, '').id).toBe(spa.services[0].id);
  });

  it('masa modelinde her alanin minimumu ve kaporasi var', () => {
    plaj.areas.forEach(a => {
      expect(a.minSpend, a.id + ' minimum yok').toBeGreaterThan(0);
      expect(a.deposit, a.id + ' kapora yok').toBeGreaterThan(0);
      /* Kapora minimumdan kucuk olmali; buyuk olsaydi "kapora
         harcamadan dusulur" cumlesi anlamsizlasirdi. */
      expect(a.deposit, a.id + ' kapora minimumdan buyuk').toBeLessThan(a.minSpend);
    });
  });

  it('randevu modelinde her hizmetin suresi ve fiyati var', () => {
    spa.services.forEach(h => {
      expect(h.duration, h.id + ' sure yok').toBeTruthy();
      expect(h.price, h.id + ' fiyat yok').toBeGreaterThan(0);
    });
  });
});

/* ---------------- saatler ---------------- */
describe('rezervasyon saatleri', () => {
  it('hafta sonu ayri liste kullanilabiliyor', () => {
    /* 2026-09-26 cumartesi, 2026-09-22 sali. */
    expect(venueSlots(plaj, '2026-09-26')).toEqual(plaj.pricing.weekendSlots);
    expect(venueSlots(plaj, '2026-09-22')).toEqual(plaj.pricing.slots);
  });

  it('hafta sonu listesi olmayan mekan tek liste kullaniyor', () => {
    expect(venueSlots(spa, '2026-09-26')).toEqual(spa.pricing.slots);
  });

  it('o gunde olmayan saat ilk saate duser', () => {
    /* Gun degisince saat listesi de degisebiliyor; secili saat o gunde
       yoksa sayfa olmayan bir saati secili gostermemeli. */
    expect(venueSlot(plaj, '2026-09-26', '10:00')).toBe(plaj.pricing.weekendSlots[0]);
    expect(venueSlot(plaj, '2026-09-22', '12:00')).toBe('12:00');
  });
});

/* ---------------- kisi sayisi ---------------- */
describe('kisi sayisi sinirlari', () => {
  it('alanin kapasitesi asilamaz', () => {
    expect(clampVenueParty(plaj, { option: 'sezlong', guests: 6 }).guests).toBe(2);
    expect(clampVenueParty(plaj, { option: 'loca', guests: 6 }).guests).toBe(6);
    expect(clampVenueParty(plaj, { option: 'loca', guests: 99 }).guests).toBe(8);
  });

  it('en az bir kisi kaliyor', () => {
    expect(clampVenueParty(plaj, { option: 'sedir', guests: 0 }).guests).toBe(1);
    expect(clampVenueParty(plaj, { option: 'sedir', guests: -4 }).guests).toBe(1);
  });

  it('hizmet tanimi geregi sabit kisi sayisi kilitleniyor', () => {
    /* Cift masaji iki kisilik: sayac ne artiyor ne azaliyor. */
    const tek = clampVenueParty(spa, { option: 'cift', guests: 1 });
    expect(tek.guests).toBe(2);
    expect(tek.fixedGuests).toBe(true);
    const cok = clampVenueParty(spa, { option: 'cift', guests: 5 });
    expect(cok.guests).toBe(2);
  });

  it('sabit olmayan hizmette sayac serbest', () => {
    const plan = clampVenueParty(spa, { option: 'klasik', guests: 2 });
    expect(plan.fixedGuests).toBe(false);
    expect(plan.guests).toBe(2);
  });
});

/* ---------------- tutar ---------------- */
describe('masa modeli tutari', () => {
  const secim = { option: 'sedir', guests: 4, addons: [] };

  it('odenecek tutar KAPORA, minimum harcama degil', () => {
    /* Minimum harcama masada beklenen harcama; tutara eklenseydi
       misafir bugun odemeyecegi bir rakami odeyecekmis gibi gorurdu. */
    const hesap = calcVenueBooking(plaj, secim);
    const alan = venueOption(plaj, 'sedir');
    expect(hesap.total).toBe(alan.deposit);
    expect(hesap.minSpend).toBe(alan.minSpend);
    expect(hesap.total).not.toBe(alan.minSpend);
  });

  it('minimum harcama satir olarak dokume girmiyor', () => {
    const hesap = calcVenueBooking(plaj, secim);
    const toplam = hesap.lines.reduce((t, l) => t + l.amount, 0);
    expect(toplam).toBe(hesap.total);
    expect(hesap.lines.some(l => l.amount === hesap.minSpend)).toBe(false);
  });

  it('ek hizmetin iki carpani birbirinden farkli', () => {
    const hesap = calcVenueBooking(plaj, { ...secim, addons: ['havluSeti', 'transfer'] });
    const tutar = (id) => hesap.addons.find(a => a.id === id).amount;
    expect(tutar('havluSeti')).toBe(150 * 4);   // kisi basina
    expect(tutar('transfer')).toBe(600);        // rezervasyon basina
    expect(hesap.total).toBe(1000 + 600 + 600);
  });

  it('secilmeyen ek hizmet tutara girmiyor', () => {
    expect(venueAddonLines(plaj, { ...secim, addons: [] })).toEqual([]);
  });

  it('mekanda odeme bayragi masa modelinde kapali', () => {
    expect(calcVenueBooking(plaj, secim).payAtVenue).toBe(false);
  });
});

describe('randevu modeli tutari', () => {
  const secim = { option: 'klasik', guests: 1, addons: [] };

  it('hizmet fiyati kisi ile carpiliyor', () => {
    const hesap = calcVenueBooking(spa, { ...secim, guests: 2 });
    expect(hesap.serviceTotal).toBe(2 * venueOption(spa, 'klasik').price);
    expect(hesap.total).toBe(hesap.serviceTotal);
  });

  it('cift masajinda kisi sabit, tutar iki kisilik', () => {
    const hesap = calcVenueBooking(spa, { option: 'cift', guests: 1, addons: [] });
    expect(hesap.guests).toBe(2);
    expect(hesap.total).toBe(2 * venueOption(spa, 'cift').price);
  });

  it('on odeme yok: tutar mekanda odenecek', () => {
    /* Masa modelinde "simdi odenecek kapora", randevuda "mekanda
       odenecek". Ayni cumleyi kullanmak ikisinden birini yanlis
       anlatirdi. */
    const hesap = calcVenueBooking(spa, secim);
    expect(hesap.payAtVenue).toBe(true);
    expect(hesap.deposit).toBe(0);
    expect(hesap.minSpend).toBe(0);
  });

  it('ucretsiz ek hizmet tutara eklenmiyor', () => {
    /* Hediye paketi 0 TL: satir gorunuyor ama tutari artirmiyor. */
    const hesap = calcVenueBooking(spa, { ...secim, addons: ['hediyeKarti'] });
    expect(hesap.addons.find(a => a.id === 'hediyeKarti').amount).toBe(0);
    expect(hesap.total).toBe(venueOption(spa, 'klasik').price);
  });

  it('ozet satirlarinin toplami odenecek tutara esit', () => {
    const hesap = calcVenueBooking(spa, { option: 'aroma', guests: 2,
      addons: ['peeling', 'uzatma', 'hediyeKarti'] });
    const toplam = hesap.lines.reduce((t, l) => t + l.amount, 0);
    expect(toplam).toBe(hesap.total);
  });
});

describe('karttaki fiyat', () => {
  it('masa modelinde en dusuk minimum, randevuda en ucuz hizmet', () => {
    expect(venuePriceFrom(plaj)).toBe(Math.min(...plaj.areas.map(a => a.minSpend)));
    expect(venuePriceFrom(spa)).toBe(Math.min(...spa.services.map(h => h.price)));
  });

  it('birim metni modele gore degisiyor', () => {
    expect(venuePriceUnit(plaj)).toBe('masada en az');
    expect(venuePriceUnit(spa)).toBe('hizmet başı');
  });
});

/* ---------------- kontenjan ----------------
   Kalan yer artık uydurulmuyor. Önceki venueSeatsLeft() tarih metninin karma
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
    expect(sayfaJs).toMatch(/MolaVeri\.urun\('venue',\s/);
    expect(sayfaJs).not.toMatch(/resolveVenue\(/);
    expect(sayfaJs).toContain("MolaVeri.musaitlik('venue', ");
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
      expect(yer('venue-page.js'), s.slug).toBeGreaterThan(yer('data-gateway.js'));
    }
  });
});

/* ---------------- adres ---------------- */
describe('adres ve kayit cozumleme', () => {
  it('slug adresten okunuyor', () => {
    expect(venueSlugFromPath('/mekan/kum-beach-club/')).toBe('kum-beach-club');
    expect(venueSlugFromPath('/mola360/mekan/kordon-spa-masaj/index.html')).toBe('kordon-spa-masaj');
  });

  it('baska turden adres bos donuyor', () => {
    expect(venueSlugFromPath('/otel/kordon-butik-otel/')).toBe('');
    expect(venueSlugFromPath('/mekan/index.html')).toBe('');
    expect(venueSlugFromPath('')).toBe('');
  });

  it('taninmayan slug varsayilana duser', () => {
    expect(resolveVenue('yok').slug).toBe(DEFAULT_VENUE_SLUG);
  });

  it('her kaydin anahtari kendi slug alaniyla ayni', () => {
    Object.keys(PLACES).forEach(slug => expect(PLACES[slug].slug).toBe(slug));
  });
});

/* ---------------- ad cakismasi ---------------- */
describe('genel kapsam adlari', () => {
  it('kayit adi VENUES degil', () => {
    /* home-blocks.js zaten `const VENUES` tanimliyor ve anasayfada iki
       dosya da yukleniyor. Klasik <script> etiketleri ust kapsami
       paylasir; ayni adi ikinci kez tanimlamak butun sayfayi oldururdu.
       (Tum betiklerin tek kapsamda calistigi test
       tests/katalog.test.js icinde.) */
    expect(veriJs).toContain('const PLACES');
    expect(veriJs).not.toMatch(/^const VENUES\b/m);
    expect(bloklar).toMatch(/^const VENUES\b/m);
  });
});

/* ---------------- gorseller ve ikonlar ---------------- */
describe('gorseller ve ikonlar', () => {
  it('kullanilan her gorsel anahtari kayitli', () => {
    Object.values(PLACES).forEach(m => {
      const kullanilan = new Set();
      m.gallery.forEach(g => kullanilan.add(g.key));
      m.similar.forEach(s => kullanilan.add(s.key));
      venueOptions(m).forEach(o => kullanilan.add(o.key));
      [...kullanilan].forEach(k =>
        expect(VENUE_IMAGE_FILES[k], m.slug + ' kayitsiz gorsel: ' + k).toBeTruthy());
    });
  });

  it('kayitsiz anahtar bos adres donduruyor', () => {
    expect(venueImage('yok', 400)).toBe('');
    expect(venueImage('sezlong', 400)).toContain('Special:FilePath');
  });

  it('kart gorseli anasayfada kayitli', () => {
    const kayitli = new Set([...app.match(/const cardImages = \{([\s\S]*?)\n\};/)[1]
      .matchAll(/"([^"]+)":/g)].map(m => m[1]));
    Object.values(PLACES).forEach(m =>
      expect(kayitli.has(m.card.img), m.slug + ' kart gorseli cardImages icinde yok').toBe(true));
  });

  it('kullanilan her ikon TOUR_ICONS icinde tanimli', () => {
    const kullanilan = new Set();
    for (const mm of sayfaJs.matchAll(/(?:ic|tourSvg)\('([a-zA-Z0-9]+)'\)/g)) kullanilan.add(mm[1]);
    Object.values(PLACES).forEach(m => {
      [m.badges, m.facts, m.trust, m.rules, m.location.access].forEach(liste =>
        liste.forEach(x => { if (x.icon) kullanilan.add(x.icon); }));
    });
    const eksik = [...kullanilan].filter(k => !TOUR_ICONS[k]);
    expect(eksik, 'tanimsiz ikon: ' + eksik.join(', ')).toEqual([]);
  });

  it('ciplak tourSvg kullanan her sinifin svg olcu kurali var', () => {
    const ciplak = [...sayfaJs.matchAll(/class="([a-z0-9 -]+)"[^>]*>\$\{tourSvg\(/g)]
      .map(m => m[1].split(/\s+/)[0]);
    expect(ciplak.length, 'oruntu hic eslesmedi').toBeGreaterThan(2);
    [...new Set(ciplak)].forEach(sinif => {
      const kural = new RegExp('\\.' + sinif + '\\s+svg\\b');
      expect(kural.test(turStil) || kural.test(mekanStil),
        '.' + sinif + ' ciplak <svg> basiyor ama olcu kurali yok').toBe(true);
    });
  });
});

/* ---------------- sayfa ile kayit tutarliligi ---------------- */
describe('sayfa ve kayit tutarliligi', () => {
  it('her mekan kaydinin kendi sayfasi var', () => {
    Object.keys(PLACES).forEach(slug =>
      expect(existsSync(new URL('../mekan/' + slug + '/index.html', import.meta.url)),
        slug + ' sayfasi yok').toBe(true));
  });

  it('H1 ve alt baslik kayitla birebir ayni', () => {
    sayfalar.forEach(({ slug, mekan, html }) => {
      expect(html, slug + ' H1 farkli').toContain('<h1>' + mekan.title + '</h1>');
      expect(html, slug + ' alt baslik farkli')
        .toContain('<p class="tour-lead">' + mekan.tagline + '</p>');
    });
  });

  it('mobil baslik kayitla ayni', () => {
    sayfalar.forEach(({ slug, mekan, html }) => {
      expect(html, slug + ' mobil baslik farkli')
        .toContain('<span class="tour-mobile-title">' + mekan.title + '</span>');
      expect(html, slug + ' mobil alt baslik farkli')
        .toContain('<span class="tour-mobile-subtitle">' + mekan.categoryShort + ' · ' + mekan.area + '</span>');
    });
  });

  it('kirilma noktalari kayitla ayni', () => {
    sayfalar.forEach(({ slug, mekan, html }) => {
      const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
      expect(ld['@type']).toBe('BreadcrumbList');
      expect(ld.itemListElement.map(i => i.name)).toEqual(['Anasayfa', mekan.categoryPlural, mekan.title]);
      expect(ld.itemListElement[1].item).toBe(KAPI_SITE_ADRESI + MolaVeri.listeYolu(mekan) + '/');
      expect(ld.itemListElement[2].item).toContain('/mekan/' + slug + '/');
    });
  });

  it('uydurma adres, saat ve puan yapisal veri olarak isaretlenmiyor', () => {
    /* Calisma saati ozellikle riskli: arama sonucunda "acik" yazan bir
       mekana gidip kapali bulmak, yanlis bilginin en pahali hali. */
    sayfalar.forEach(({ slug, html }) => {
      (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).forEach(blok => {
        ['LocalBusiness', 'Restaurant', 'HealthAndBeautyBusiness', 'AggregateRating',
         '"Offer"', 'openingHours', 'telephone'].forEach(tip =>
          expect(blok.includes(tip), slug + ' icinde ' + tip).toBe(false));
      });
    });
  });

  it('her sayfa kendi modelinin bolumunu tasiyor', () => {
    /* Masa modelinde "alanlar" ve "menu", randevuda "hizmetler". */
    const plajHtml = sayfalar.find(s => s.slug === 'kum-beach-club').html;
    const spaHtml = sayfalar.find(s => s.slug === 'kordon-spa-masaj').html;
    expect(plajHtml).toContain('id="alanlar"');
    expect(plajHtml).toContain('id="menu"');
    expect(plajHtml).not.toContain('id="hizmetler"');
    expect(spaHtml).toContain('id="hizmetler"');
    expect(spaHtml).not.toContain('id="alanlar"');
    expect(spaHtml).not.toContain('id="menu"');
  });

  it('ortak bolumler iki sayfada da var', () => {
    ['genel-bakis', 'saatler', 'konum', 'bilgiler', 'yorumlar', 'sss',
     'tourSimilar', 'tourTags'].forEach(id =>
      sayfalar.forEach(({ slug, html }) =>
        expect(html, slug + ' icinde #' + id + ' yok').toContain('id="' + id + '"')));
  });

  it('doldurulan her kabin sayfada karsiligi var', () => {
    /* Model bazli kaplar (alanlar/hizmetler/menu) haric: onlar zaten
       yukaridaki testte sayfa sayfa dogrulaniyor. */
    const kaplar = [...sayfaJs.matchAll(/fill\('([a-zA-Z-]+)'/g)].map(m => m[1])
      .filter(id => ['alanlar', 'hizmetler', 'menu'].indexOf(id) === -1);
    expect(kaplar.length).toBeGreaterThan(7);
    sayfalar.forEach(({ slug, html }) => {
      kaplar.forEach(id =>
        expect(html, slug + ' icinde #' + id + ' yok').toContain('id="' + id + '"'));
    });
  });

  it('dosyalar dogru sirada yukleniyor', () => {
    sayfalar.forEach(({ slug, html }) => {
      const sira = ['assets/js/tour-data.js', 'assets/js/venue-data.js', 'assets/js/venue-page.js']
        .map(yol => html.indexOf(yol));
      sira.forEach((yer, i) => expect(yer, slug + ' ' + i + '. dosya yuklenmiyor').toBeGreaterThan(-1));
      expect(sira[0]).toBeLessThan(sira[1]);
      expect(sira[1]).toBeLessThan(sira[2]);
      expect(html).toContain('assets/css/tour.css');
      expect(html).toContain('assets/css/venue.css');
    });
  });

  it('baska turun sayfa dosyalari yuklenmiyor', () => {
    sayfalar.forEach(({ slug, html }) => {
      ['assets/js/tour-page.js', 'assets/js/hotel-page.js', 'assets/js/activity-page.js',
       'assets/js/event-page.js'].forEach(dosya =>
        expect(html, slug + ' ' + dosya + ' yukluyor').not.toContain(dosya));
    });
  });
});

/* ---------------- sayfa etiketleri ---------------- */
describe('sayfa etiketleri', () => {
  it('hedefi olmayan cip yok', () => {
    sayfalar.forEach(({ slug, mekan, html }) => {
      (mekan.tags || []).forEach(t => {
        if (t.href.charAt(0) === '#') {
          expect(html, slug + ' -> ' + t.href + ' sayfada yok')
            .toContain('id="' + t.href.slice(1) + '"');
          return;
        }
        const dosya = t.href.split('#')[0];
        const yol = dosya.endsWith('/') ? dosya + 'index.html' : dosya;
        expect(existsSync(new URL('../' + yol, import.meta.url)),
          slug + ' -> ' + t.href + ' diskte yok').toBe(true);
      });
    });
  });

  it('anasayfadaki #mekanlar capasi gercekten var', () => {
    /* Kirilma noktasi ve etiketler index.html#mekanlar adresine
       gidiyor; capa olmadan o baglar sayfanin tepesine duserdi. */
    expect(bloklar).toContain('id="mekanlar"');
  });

  it('benzer kartlarin adresi diskte var', () => {
    Object.values(PLACES).forEach(m =>
      m.similar.filter(s => s.href).forEach(s => {
        const yol = s.href.endsWith('/') ? s.href + 'index.html' : s.href;
        expect(existsSync(new URL('../' + yol, import.meta.url)), s.href + ' diskte yok').toBe(true);
      }));
  });
});

/* ---------------- anasayfa baglantisi ---------------- */
describe('anasayfa baglantisi', () => {
  const kartlar = catalogAllCards(BUGUN).filter(k => k.href && k.href.startsWith('mekan/'));

  it('her mekan anasayfaya kendiliginden giriyor', () => {
    const baglar = kartlar.map(k => k.href);
    Object.keys(PLACES).forEach(slug =>
      expect(baglar, slug + ' anasayfaya girmiyor').toContain('mekan/' + slug + '/'));
  });

  it('Mekanlar blogu katalogdan besleniyor', () => {
    /* Blok home-blocks.js icinde; katalog yuklenmemis bir sayfada
       kosul sessizce bos dizi veriyor. */
    expect(bloklar).toContain("typeof catalogCards === 'function' ? catalogCards('mekanlar') : []");
    expect(bloklar).toContain('href="${v.href || \'#\'}"');
  });

  it('kart fiyati kaydin en dusuk fiyati', () => {
    kartlar.forEach(kart => {
      const slug = kart.href.replace(/^mekan\//, '').replace(/\/$/, '');
      expect(Number(kart.priceMain)).toBe(venuePriceFrom(PLACES[slug]));
    });
  });

  it('kart puani kayittan geliyor', () => {
    kartlar.forEach(kart => {
      const slug = kart.href.replace(/^mekan\//, '').replace(/\/$/, '');
      expect(kart.rating).toBe(String(ratingSummary(PLACES[slug].ratingBreakdown).average));
    });
  });

  it('kart acik/kapali durumu saate gore degisiyor', () => {
    /* Mekan kartinda tarih yok, "su an acik mi" var. */
    const gunduz = venueCatalogCard(plaj, new Date(2026, 8, 22, 13, 0));
    const sabaha = venueCatalogCard(plaj, new Date(2026, 8, 22, 6, 0));
    expect(gunduz.open).toBe(true);
    expect(gunduz.meta2).toBe('Şu an açık');
    expect(sabaha.open).toBe(false);
    expect(sabaha.meta2).not.toBe('Şu an açık');
  });

  it('mekan kendi seridine giriyor, yaklasan planlara girmiyor', () => {
    const mekanlar = catalogCards('mekanlar', BUGUN).map(k => k.href);
    Object.keys(PLACES).forEach(slug =>
      expect(mekanlar).toContain('mekan/' + slug + '/'));
    const yaklasan = catalogCards('yaklasan-planlar', BUGUN).map(k => k.href);
    expect(yaklasan.some(h => h.startsWith('mekan/'))).toBe(false);
  });

  it('arama kaynagi seridi olmayan kayitlari da kapsiyor', () => {
    /* Mekanlarin cardSections'ta seridi yok; arama yalnizca
       cardSections'a bakiyor olsaydi mekan sayfasina aramadan
       ulasilamazdi. */
    expect(app).toContain('function aramaKayitlari()');
    expect(app).toContain('catalogAllCards()');
    const fn = app.match(/function aramaKayitlari\(\) \{([\s\S]*?)\n\}/)[1];
    expect(fn).toContain('cardSections.forEach');
    expect(fn).toContain('gorulen.has(k)');
    /* Uc arama yolu da ayni kaynagi kullaniyor. */
    expect((app.match(/aramaKayitlari\(\)/g) || []).length).toBeGreaterThanOrEqual(3);
  });
});

/* ---------------- metin tek kaynakta ---------------- */
describe('metin tek kaynakta', () => {
  it('alan/hizmet adlari ve fiyatlari yalnizca veride', () => {
    /* Yorumlar eleniyor: bir kuralin NEDEN boyle oldugunu anlatirken
       alan adi gecmesi sorun degil -- aranan sey isaretlemeye yazilmis
       ICERIK. (Ayni yaklasim CSS parlama testinde de var.)

       Arama harf siniriyla yapiliyor: duz "Loca" aramasi
       `toLocaleLowerCase` icindeki "Loca"yi yakalayip testi bosa
       dusuruyordu. Once boyle yazildi ve tam olarak bu oldu. */
    const kod = sayfaJs.replace(/\/\*[\s\S]*?\*\//g, '');
    const harf = 'A-Za-zÇĞİÖŞÜçğıöşü';
    const gecerMi = (metin) =>
      new RegExp('(^|[^' + harf + '])' + metin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(kod);
    Object.values(PLACES).forEach(m => {
      venueOptions(m).forEach(o => {
        expect(gecerMi(o.name), o.name + ' isaretlemeye yazilmis').toBe(false);
      });
      expect(gecerMi(m.title), m.title + ' isaretlemeye yazilmis').toBe(false);
      expect(kod.includes(m.location.address)).toBe(false);
    });
  });

  it('fiyatlar kayittan basiliyor, isaretlemeye yazilmiyor', () => {
    /* Ham sayi aramak yanilticiydi: 1200 hem bir hizmet fiyati hem
       galeri gorsel genisligi (GALLERY_WIDTHS.hero). Aranan sey
       ISARETLEMEYE yazilmis bir TL tutari; fiyatin kendisi kayittan
       geliyor mu, ona bakiliyor. */
    const kod = sayfaJs.replace(/\/\*[\s\S]*?\*\//g, '');
    const elleYazilan = kod.match(/\d[\d.]*\s?TL/g) || [];
    expect(elleYazilan, 'isaretlemede sabit tutar: ' + elleYazilan.join(', ')).toEqual([]);
    expect(kod).toContain('formatTRY(randevu ? secenek.price : secenek.minSpend)');
    expect(kod).toContain('formatTRY(secenek.deposit)');
  });

  it('bicimlendirme ve hesaplar tekrar yazilmamis', () => {
    ['function formatTRY', 'function formatTrDate', 'function ratingSummary',
     'function refundAmount', 'function reviewerInitials']
      .forEach(fn => expect(veriJs, fn + ' mekan tarafinda tekrar tanimlanmis').not.toContain(fn));
    expect(veriJs).toContain("require('./tour-data.js')");
  });

  it('destek numarasi ortak kaynaktan geliyor', () => {
    expect(sayfaJs).toContain('CONTACT.phoneHref');
    expect(sayfaJs).not.toMatch(/0850\s*000/);
  });
});

/* ---------------- iki model tek sayfa ---------------- */
describe('tek sayfa iki model', () => {
  it('model kaydin booking alanindan okunuyor', () => {
    expect(sayfaJs).toContain("const randevu = place.booking === 'randevu'");
  });

  it('ozetin alt satiri modele gore degisiyor', () => {
    const fn = sayfaJs.match(/function summaryMarkup\(hesap\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain("randevu ? 'Mekânda ödenecek' : 'Şimdi ödenecek'");
    expect(fn).toContain('mkn-min-harcama');
  });

  it('minimum harcama toplamin disinda gosteriliyor', () => {
    /* Toplam satiriyla ayni yerde olsaydi "simdi odenecek" ile
       karisirdi. */
    expect(mekanStil).toContain('.mkn-min-harcama {');
    const fn = sayfaJs.match(/function summaryMarkup\(hesap\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn.indexOf('mkn-min-harcama')).toBeLessThan(fn.indexOf('tour-sum-total'));
  });

  it('kapali gun secilemiyor', () => {
    /* Kapali bir gune rezervasyon almak misafiri kapidan cevirmek
       demek; cip duruyor ama pasif. */
    const fn = sayfaJs.match(/function dateChipsMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('kapali');
    expect(fn).toContain('disabled');
    expect(mekanStil).toContain('.mkn-date-chip.is-kapali');
  });

  it('acik/kapali rozeti dakikada bir tazeleniyor', () => {
    /* Sayfa acik dururken kapanis saati gecebiliyor. */
    expect(sayfaJs).toContain('function initOpenStatus()');
    expect(sayfaJs).toContain('60000');
  });

  it('gun degisince saat listesi yenileniyor', () => {
    expect(sayfaJs).toContain('state.slot = venueSlot(place, state.date, state.slot)');
  });
});

/* ---------------- katman kilidi ---------------- */
describe('katman kilidi', () => {
  const kilit = sayfaJs.match(/function lockScroll\(on\) \{([\s\S]*?)\n  \}/)[1];

  it('govde sabitleniyor', () => {
    expect(kilit).toContain("govde.style.position = 'fixed'");
    expect(kilit).toContain('window.scrollTo(0, kilitliY)');
  });

  it('ust uste acilan katmanlar icin sayac var', () => {
    expect(kilit).toContain('kilitSayaci += 1');
    expect(kilit).toContain('if (kilitSayaci > 1) return;');
  });

  it('her acilan katman kilidi aciyor', () => {
    expect((sayfaJs.match(/lockScroll\((true|false)\)/g) || []).length).toBe(4);
  });
});

/* ---------------- gorunum kurallari ---------------- */
describe('parlama efekti yok', () => {
  const temiz = mekanStil.replace(/\/\*[\s\S]*?\*\//g, '');

  it('text-shadow yok', () => {
    const bulunan = (temiz.match(/text-shadow\s*:\s*[^;]+/g) || []).filter(k => !/none/.test(k));
    expect(bulunan, 'venue.css icinde text-shadow: ' + bulunan.join(' | ')).toEqual([]);
  });

  it('marka rengiyle eslesen bulanik golge yok', () => {
    const markaRenkleri = [/140\s*,\s*198\s*,\s*63/, /37\s*,\s*211\s*,\s*102/, /var\(--green/];
    (temiz.match(/box-shadow\s*:\s*[^;]+/g) || []).forEach(kural => {
      kural.split(/,(?![^(]*\))/).forEach(kat => {
        const oncesi = kat
          .replace(/rgba?\([^)]*\)|var\([^)]*\)|#[0-9a-fA-F]{3,8}/g, ' ')
          .replace(/box-shadow\s*:|inset/g, ' ');
        const olcu = (oncesi.match(/-?[\d.]+/g) || []).map(Number);
        if (!(olcu.length >= 3 && olcu[2] > 0)) return;
        markaRenkleri.forEach(renk =>
          expect(renk.test(kat), 'venue.css icinde renkli parlama: ' + kat.trim()).toBe(false));
      });
    });
  });

  it('kendi renk paletini kurmuyor', () => {
    expect(temiz).not.toMatch(/:root\s*\{/);
    expect(temiz).toContain('var(--border)');
  });

  it('secenek karti gorseli akistan cikmis', () => {
    const kural = mekanStil.match(/\.mkn-secenek-media img \{([\s\S]*?)\n\}/)[1];
    expect(kural).toContain('position: absolute');
    expect(kural).toContain('object-fit: cover');
  });

  it('kapali gun ve pasif satir doygunlukla ayriliyor', () => {
    expect(mekanStil).toMatch(/\.mkn-date-chip\.is-kapali[\s\S]{0,80}opacity/);
    expect(mekanStil).toMatch(/\.tour-party-row\.is-pasif[\s\S]{0,60}opacity/);
  });
});
