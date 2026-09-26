/* Etkinlik icerik sayfasi (/etkinlik/<slug>/) testleri.

   Yapisi tur, otel ve aktivite testleriyle ayni. Etkinligin kendine
   ozgu kurallari burada bekcilik ediliyor:

   1) SABIT TARIHLER. Temsiller sayilidir ve biter; "yaklasan" olan
      kayittan hesaplanir, elle yazilmaz.
   2) SEZON BITINCE ANASAYFADA GORUNMEZ. Gecmis bir festivali
      "yaklasan" diye kartta tutmak, elle yazilmis kartlarin dustugu
      tuzagin ta kendisi.
   3) OGRENCI BILETI her blokta satilmaz (locada yok).
   4) HIZMET BEDELI bilet basina ve ayri satir. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import {
  EVENTS,
  DEFAULT_EVENT_SLUG,
  EVENT_IMAGE_FILES,
  eventImage,
  upcomingPerformances,
  nextPerformance,
  seasonOver,
  eventPerformance,
  eventCategory,
  clampTickets,
  eventAddonLines,
  calcEventTotal,
  eventPriceFrom,
  eventListPriceFrom,
  eventSlugFromPath,
  resolveEvent,
} from '../assets/js/event-data.js';
import { TOUR_ICONS, ratingSummary, refundAmount } from '../assets/js/tour-data.js';
import { catalogCards, catalogAllCards, cardDateText, eventCatalogCard } from '../assets/js/catalog.js';

const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');

const sayfaJs = oku('assets/js/event-page.js');
const veriJs = oku('assets/js/event-data.js');
const app = oku('assets/js/app.js');
const etkinlikStil = oku('assets/css/event.css');
const turStil = oku('assets/css/tour.css');

const sayfalar = Object.keys(EVENTS).map(slug => ({
  slug,
  etkinlik: EVENTS[slug],
  html: oku('etkinlik/' + slug + '/index.html')
}));

const etkinlik = EVENTS[DEFAULT_EVENT_SLUG];
const sayfa = sayfalar.find(s => s.slug === DEFAULT_EVENT_SLUG).html;
const BUGUN = '2026-09-21';
const SONRASI = '2027-01-01';

const secim = { full: 2, student: 0, category: 'orta', addons: [] };

/* ---------------- temsiller ---------------- */
describe('temsil takvimi', () => {
  it('yaklasan temsiller tarihe gore sirali', () => {
    const liste = upcomingPerformances(etkinlik, BUGUN);
    expect(liste.length).toBeGreaterThan(1);
    for (let i = 1; i < liste.length; i++) {
      expect(liste[i - 1].date < liste[i].date, 'sira bozuk').toBe(true);
    }
  });

  it('gecmis temsil listeden duser', () => {
    /* 10 Ekim'de bakan biri icin eylul temsilleri gecmistir. */
    const liste = upcomingPerformances(etkinlik, '2026-10-10');
    expect(liste.every(t => t.date >= '2026-10-10')).toBe(true);
    expect(liste.some(t => t.date === '2026-09-26')).toBe(false);
  });

  it('bugunun temsili hala yaklasan sayiliyor', () => {
    /* Temsil aksam 20:30'da; sabah bakan biri icin hala bugun. */
    const liste = upcomingPerformances(etkinlik, '2026-09-26');
    expect(liste[0].date).toBe('2026-09-26');
  });

  it('sezon bitince yaklasan temsil kalmiyor', () => {
    expect(upcomingPerformances(etkinlik, SONRASI)).toEqual([]);
    expect(nextPerformance(etkinlik, SONRASI)).toBe(null);
    expect(seasonOver(etkinlik, SONRASI)).toBe(true);
    expect(seasonOver(etkinlik, BUGUN)).toBe(false);
  });

  it('taninmayan tarih ilk YAKLASAN temsile duser', () => {
    /* Sayfa gecmis bir temsili secili gostermesin. */
    expect(eventPerformance(etkinlik, '2020-01-01', BUGUN).date)
      .toBe(nextPerformance(etkinlik, BUGUN).date);
    expect(eventPerformance(etkinlik, '', BUGUN).date)
      .toBe(nextPerformance(etkinlik, BUGUN).date);
    expect(eventPerformance(etkinlik, '2026-10-10', BUGUN).date).toBe('2026-10-10');
  });

  it('sezon bittiginde secilecek temsil yok', () => {
    expect(eventPerformance(etkinlik, '2026-10-10', SONRASI)).toBe(null);
  });

  it('her temsilin tarihi, saati, adi ve turu var', () => {
    etkinlik.performances.forEach(t => {
      expect(t.date, 'tarih yok').toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.time, t.date + ' saati yok').toBeTruthy();
      expect(t.title, t.date + ' eser adi yok').toBeTruthy();
      expect(t.kind, t.date + ' turu yok').toBeTruthy();
    });
  });
});

/* ---------------- bilet sinirlari ---------------- */
describe('bilet sinirlari', () => {
  it('tek rezervasyonda en fazla maxTickets bilet', () => {
    const bilet = clampTickets(etkinlik, { ...secim, full: 12, student: 4 });
    expect(bilet.tickets).toBe(etkinlik.pricing.maxTickets);
  });

  it('en az bir tam bilet kaliyor', () => {
    expect(clampTickets(etkinlik, { ...secim, full: 0 }).full).toBe(1);
    expect(clampTickets(etkinlik, { ...secim, full: -3 }).full).toBe(1);
  });

  it('ogrenci tarifesi olmayan blokta ogrenci bileti satilmiyor', () => {
    /* Locada ogrenci tarifesi yok: sayac sifirlaniyor. */
    const loca = clampTickets(etkinlik, { ...secim, category: 'loca', full: 1, student: 3 });
    expect(loca.studentAllowed).toBe(false);
    expect(loca.student).toBe(0);

    const orta = clampTickets(etkinlik, { ...secim, category: 'orta', full: 1, student: 3 });
    expect(orta.studentAllowed).toBe(true);
    expect(orta.student).toBe(3);
  });

  it('taninmayan kategori ilk kayda duser', () => {
    expect(eventCategory(etkinlik, 'yok').id).toBe(etkinlik.categories[0].id);
  });
});

/* ---------------- tutar ---------------- */
describe('bilet tutari', () => {
  it('tam bilet secili kategorinin fiyati', () => {
    const hesap = calcEventTotal(etkinlik, { ...secim, full: 3 });
    expect(hesap.fullTotal).toBe(3 * eventCategory(etkinlik, 'orta').price);
  });

  it('ogrenci bileti kategorinin ogrenci tarifesi', () => {
    const hesap = calcEventTotal(etkinlik, { ...secim, full: 1, student: 2, category: 'ust' });
    expect(hesap.studentTotal).toBe(2 * eventCategory(etkinlik, 'ust').student);
  });

  it('hizmet bedeli bilet basina ve ayri satir', () => {
    const hesap = calcEventTotal(etkinlik, { ...secim, full: 2, student: 1 });
    expect(hesap.serviceTotal).toBe(3 * etkinlik.pricing.servicePerTicket);
    const satir = hesap.lines.find(l => l.kind === 'fee');
    expect(satir, 'hizmet bedeli satiri yok').toBeTruthy();
    expect(satir.amount).toBe(hesap.serviceTotal);
  });

  it('ek hizmetin iki carpani birbirinden farkli', () => {
    const hesap = calcEventTotal(etkinlik, { ...secim, full: 2, student: 1,
      addons: ['otopark', 'ikram'] });
    const tutar = (id) => hesap.addons.find(a => a.id === id).amount;
    expect(tutar('otopark')).toBe(250);       // rezervasyon basina
    expect(tutar('ikram')).toBe(220 * 3);     // bilet basina
  });

  it('secilmeyen ek hizmet tutara girmiyor', () => {
    expect(eventAddonLines(etkinlik, { ...secim, addons: [] })).toEqual([]);
    expect(calcEventTotal(etkinlik, secim).addonsTotal).toBe(0);
  });

  it('ozet satirlarinin toplami odenecek tutara esit', () => {
    const hesap = calcEventTotal(etkinlik, { full: 2, student: 2, category: 'orkestra',
      addons: ['otopark', 'program', 'ikram'] });
    const toplam = hesap.lines.reduce((t, l) => t + l.amount, 0);
    expect(toplam).toBe(hesap.total);
  });

  it('avantaj yalnizca bilet bedeli uzerinden', () => {
    /* Hizmet bedeli bir ek kalem, indirime konu degil. */
    const hesap = calcEventTotal(etkinlik, { ...secim, full: 2 });
    const kat = eventCategory(etkinlik, 'orta');
    expect(hesap.saving).toBe(2 * (kat.priceList - kat.price));
  });

  it('hesap kendi sinirlarini uyguluyor', () => {
    const hesap = calcEventTotal(etkinlik, { ...secim, full: 20, student: 9, category: 'loca' });
    expect(hesap.tickets).toBeLessThanOrEqual(etkinlik.pricing.maxTickets);
    expect(hesap.student).toBe(0);
  });

  it('en ucuz kategori fiyati ve liste fiyati', () => {
    const enUcuz = etkinlik.categories.reduce((a, b) => (a.price <= b.price ? a : b));
    expect(eventPriceFrom(etkinlik)).toBe(enUcuz.price);
    expect(eventListPriceFrom(etkinlik)).toBe(enUcuz.priceList);
  });
});

/* ---------------- yagmur ve iade ---------------- */
describe('yagmur ve iade', () => {
  it('yagmur kurali iade degil AKTARIM', () => {
    /* Aktivitedeki hava kutusuyla ayni yer, farkli sonuc: orada
       kosulsuz iade, burada yeni tarihe aktarim. */
    expect(etkinlik.weather.text).toMatch(/aktarıl/i);
    expect(sayfaJs).toContain('etk-hava');
    expect(sayfaJs).toContain('event.weather.text');
  });

  it('misafir iptali kademeli', () => {
    const tiers = etkinlik.cancellation.tiers;
    expect(refundAmount(750, 96, tiers)).toBe(750);
    expect(refundAmount(750, 36, tiers)).toBe(375);
    expect(refundAmount(750, 2, tiers)).toBe(0);
  });

  it('yagmur kutusu iade tablosundan once geliyor', () => {
    /* Tablonun icine konsaydi "son 24 saat: iade yok" satirinin
       yaninda kaybolurdu. */
    const fn = sayfaJs.match(/function infoMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn.indexOf('etk-hava')).toBeLessThan(fn.indexOf('tour-refund'));
  });
});

/* ---------------- kontenjan ----------------
   Kalan yer artık uydurulmuyor. Önceki eventSeatsLeft() tarih metninin karma
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
    expect(sayfaJs).toMatch(/MolaVeri\.urun\('event',\s/);
    expect(sayfaJs).not.toMatch(/resolveEvent\(/);
    expect(sayfaJs).toContain("MolaVeri.musaitlik('event', ");
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
      expect(yer('event-page.js'), s.slug).toBeGreaterThan(yer('data-gateway.js'));
    }
  });
});

/* ---------------- adres ---------------- */
describe('adres ve kayit cozumleme', () => {
  it('slug adresten okunuyor', () => {
    expect(eventSlugFromPath('/etkinlik/aspendos-opera-bale-festivali/'))
      .toBe('aspendos-opera-bale-festivali');
    expect(eventSlugFromPath('/mola360/etkinlik/aspendos-opera-bale-festivali/index.html'))
      .toBe('aspendos-opera-bale-festivali');
  });

  it('baska turden adres bos donuyor', () => {
    expect(eventSlugFromPath('/aktivite/kapadokya-balon-turu/')).toBe('');
    expect(eventSlugFromPath('/etkinlik/index.html')).toBe('');
    expect(eventSlugFromPath('')).toBe('');
  });

  it('taninmayan slug varsayilana duser', () => {
    expect(resolveEvent('yok').slug).toBe(DEFAULT_EVENT_SLUG);
  });

  it('her kaydin anahtari kendi slug alaniyla ayni', () => {
    Object.keys(EVENTS).forEach(slug => expect(EVENTS[slug].slug).toBe(slug));
  });
});

/* ---------------- gorseller ve ikonlar ---------------- */
describe('gorseller ve ikonlar', () => {
  it('kullanilan her gorsel anahtari kayitli', () => {
    const kullanilan = new Set();
    etkinlik.gallery.forEach(g => kullanilan.add(g.key));
    etkinlik.similar.forEach(s => kullanilan.add(s.key));
    etkinlik.categories.forEach(k => kullanilan.add(k.key));
    [...kullanilan].forEach(k =>
      expect(EVENT_IMAGE_FILES[k], 'kayitsiz gorsel anahtari: ' + k).toBeTruthy());
  });

  it('kayitsiz anahtar bos adres donduruyor', () => {
    expect(eventImage('yok', 400)).toBe('');
    expect(eventImage('aspendos', 400)).toContain('Special:FilePath');
  });

  it('anasayfadaki aspendos gorseliyle ayni dosya', () => {
    /* app.js'teki cardImages'te aspendos Commons adresi tutuyor; ayni
       fotograf iki farkli adrese gitmesin. */
    const kayitli = app.match(/"aspendos":\s*"([^"]+)"/)[1];
    expect(eventImage('aspendos', 800)).toBe(kayitli);
  });

  it('kullanilan her ikon TOUR_ICONS icinde tanimli', () => {
    const kullanilan = new Set();
    for (const m of sayfaJs.matchAll(/(?:ic|tourSvg)\('([a-zA-Z0-9]+)'\)/g)) kullanilan.add(m[1]);
    [etkinlik.badges, etkinlik.facts, etkinlik.trust, etkinlik.rules, etkinlik.venue.access]
      .forEach(liste => liste.forEach(x => { if (x.icon) kullanilan.add(x.icon); }));
    const eksik = [...kullanilan].filter(k => !TOUR_ICONS[k]);
    expect(eksik, 'tanimsiz ikon: ' + eksik.join(', ')).toEqual([]);
  });

  it('ciplak tourSvg kullanan her sinifin svg olcu kurali var', () => {
    const ciplak = [...sayfaJs.matchAll(/class="([a-z0-9 -]+)"[^>]*>\$\{tourSvg\(/g)]
      .map(m => m[1].split(/\s+/)[0]);
    expect(ciplak.length, 'oruntu hic eslesmedi, test olmus olabilir').toBeGreaterThan(2);
    [...new Set(ciplak)].forEach(sinif => {
      const kural = new RegExp('\\.' + sinif + '\\s+svg\\b');
      expect(kural.test(turStil) || kural.test(etkinlikStil),
        '.' + sinif + ' ciplak <svg> basiyor ama olcu kurali yok').toBe(true);
    });
  });
});

/* ---------------- sayfa ile kayit tutarliligi ---------------- */
describe('sayfa ve kayit tutarliligi', () => {
  it('her etkinlik kaydinin kendi sayfasi var', () => {
    Object.keys(EVENTS).forEach(slug =>
      expect(existsSync(new URL('../etkinlik/' + slug + '/index.html', import.meta.url)),
        slug + ' sayfasi yok').toBe(true));
  });

  it('H1 ve alt baslik kayitla birebir ayni', () => {
    sayfalar.forEach(({ slug, etkinlik: e, html }) => {
      expect(html, slug + ' H1 farkli').toContain('<h1>' + e.title + '</h1>');
      expect(html, slug + ' alt baslik farkli')
        .toContain('<p class="tour-lead">' + e.tagline + '</p>');
    });
  });

  it('mobil baslik kayitla ayni', () => {
    sayfalar.forEach(({ slug, etkinlik: e, html }) => {
      expect(html, slug + ' mobil baslik farkli')
        .toContain('<span class="tour-mobile-title">' + e.title + '</span>');
      expect(html, slug + ' mobil alt baslik farkli')
        .toContain('<span class="tour-mobile-subtitle">' + e.categoryShort + ' · ' + e.area + '</span>');
    });
  });

  it('kirilma noktalari kayitla ayni', () => {
    sayfalar.forEach(({ slug, etkinlik: e, html }) => {
      const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
      expect(ld['@type']).toBe('BreadcrumbList');
      expect(ld.itemListElement.map(i => i.name)).toEqual(['Anasayfa', e.categoryPlural, e.title]);
      expect(ld.itemListElement[1].item).toContain('#' + e.categoryAnchor);
      expect(ld.itemListElement[2].item).toContain('/etkinlik/' + slug + '/');
    });
  });

  it('uydurma tarih ve fiyat yapisal veri olarak isaretlenmiyor', () => {
    /* Event.startDate isaretlemek, arama sonuclarinda olmayan bir
       gosteriyi duyurmak olurdu. */
    sayfalar.forEach(({ slug, html }) => {
      (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).forEach(blok => {
        ['"@type": "Event"', 'AggregateRating', '"Offer"', 'startDate'].forEach(tip =>
          expect(blok.includes(tip), slug + ' icinde ' + tip).toBe(false));
      });
    });
  });

  it('doldurulan her kabin sayfada karsiligi var', () => {
    const kaplar = [...sayfaJs.matchAll(/fill\('([a-zA-Z-]+)'/g)].map(m => m[1]);
    expect(kaplar.length).toBeGreaterThan(8);
    sayfalar.forEach(({ slug, html }) => {
      kaplar.forEach(id =>
        expect(html, slug + ' icinde #' + id + ' yok').toContain('id="' + id + '"'));
    });
  });

  it('bolum menusundeki her sekmenin sayfada karsiligi var', () => {
    const blok = sayfaJs.match(/const TUM_SECTIONS = \[([\s\S]*?)\n  \];/)[1];
    const idler = [...blok.matchAll(/id: '([a-z-]+)'/g)].map(m => m[1]);
    expect(idler.length).toBeGreaterThan(5);
    sayfalar.forEach(({ slug, html }) => {
      idler.forEach(id =>
        expect(html, slug + ' icinde #' + id + ' bolumu yok').toContain('id="' + id + '"'));
    });
  });

  it('dosyalar dogru sirada yukleniyor', () => {
    sayfalar.forEach(({ slug, html }) => {
      const sira = ['assets/js/tour-data.js', 'assets/js/event-data.js', 'assets/js/event-page.js']
        .map(yol => html.indexOf(yol));
      sira.forEach((yer, i) => expect(yer, slug + ' ' + i + '. dosya yuklenmiyor').toBeGreaterThan(-1));
      expect(sira[0]).toBeLessThan(sira[1]);
      expect(sira[1]).toBeLessThan(sira[2]);
      expect(html).toContain('assets/css/tour.css');
      expect(html).toContain('assets/css/event.css');
    });
  });

  it('baska turun sayfa dosyalari yuklenmiyor', () => {
    sayfalar.forEach(({ slug, html }) => {
      ['assets/js/tour-page.js', 'assets/js/tour-pdf.js', 'assets/js/hotel-page.js',
       'assets/js/activity-page.js']
        .forEach(dosya => expect(html, slug + ' ' + dosya + ' yukluyor').not.toContain(dosya));
    });
  });
});

/* ---------------- sayfa etiketleri ---------------- */
describe('sayfa etiketleri', () => {
  it('hedefi olmayan cip yok', () => {
    sayfalar.forEach(({ slug, etkinlik: e, html }) => {
      (e.tags || []).forEach(t => {
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
});

/* ---------------- anasayfa baglantisi ---------------- */
describe('anasayfa baglantisi', () => {
  const kartlar = catalogAllCards(BUGUN).filter(k => k.href.startsWith('etkinlik/'));

  it('her etkinlik anasayfaya kendiliginden giriyor', () => {
    const baglar = kartlar.map(k => k.href);
    Object.keys(EVENTS).forEach(slug =>
      expect(baglar, slug + ' anasayfaya girmiyor').toContain('etkinlik/' + slug + '/'));
  });

  it('etkinlik hem kendi seridinde hem yaklasan planlarda', () => {
    /* Sayili temsili oldugu icin "Yaklasan Planlar"a giriyor -- otel ve
       aktivite oraya girmiyor, onlarin sabit tarihi yok. */
    const kendi = catalogCards('etkinlikler', BUGUN).map(k => k.href);
    const yaklasan = catalogCards('yaklasan-planlar', BUGUN).map(k => k.href);
    expect(kendi).toContain('etkinlik/' + DEFAULT_EVENT_SLUG + '/');
    expect(yaklasan).toContain('etkinlik/' + DEFAULT_EVENT_SLUG + '/');
  });

  it('kart fiyati en ucuz kategorinin bilet ucreti', () => {
    kartlar.forEach(kart => {
      const slug = kart.href.replace(/^etkinlik\//, '').replace(/\/$/, '');
      expect(Number(kart.priceMain), slug + ' kart fiyati farkli')
        .toBe(eventPriceFrom(EVENTS[slug]));
    });
  });

  it('kart puani kayittan geliyor', () => {
    kartlar.forEach(kart => {
      const slug = kart.href.replace(/^etkinlik\//, '').replace(/\/$/, '');
      expect(kart.rating).toBe(String(ratingSummary(EVENTS[slug].ratingBreakdown).average));
    });
  });

  it('karttaki tarih sonraki temsilden geliyor', () => {
    /* Elle yazilan "26 Eylul, Cumartesi" birkac hafta sonra gecmis bir
       gunu gosteriyordu; artik takvimden turetiliyor. */
    kartlar.forEach(kart => {
      const slug = kart.href.replace(/^etkinlik\//, '').replace(/\/$/, '');
      const sonraki = nextPerformance(EVENTS[slug], BUGUN);
      expect(kart.meta2).toBe(cardDateText(sonraki.date, BUGUN));
      expect(kart.inDays).toBe(5);
      expect(kart.dayKey).toBe('cumartesi');
    });
  });

  it('sezonu biten etkinlik kart uretmiyor', () => {
    /* Gecmis bir festivali "yaklasan" diye anasayfada tutmak, elle
       yazilmis kartlarin dustugu tuzagin ta kendisi olurdu. */
    expect(eventCatalogCard(etkinlik, SONRASI)).toBe(null);
    expect(catalogCards('etkinlikler', SONRASI)).toEqual([]);
    expect(catalogCards('yaklasan-planlar', SONRASI).every(k => !k.href.startsWith('etkinlik/')))
      .toBe(true);
  });

  it('anasayfada elle yazilmis etkinlik karti kalmamis', () => {
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    expect(blok.includes(etkinlik.title), 'elle yazilmis Aspendos karti duruyor').toBe(false);
  });
});

/* ---------------- metin tek kaynakta ---------------- */
describe('metin tek kaynakta', () => {
  it('kategori adlari ve fiyatlari yalnizca veride', () => {
    etkinlik.categories.forEach(k => {
      expect(sayfaJs, k.name + ' isaretlemeye yazilmis').not.toContain(k.name);
      expect(sayfaJs, k.price + ' fiyati isaretlemeye yazilmis').not.toContain(String(k.price));
    });
  });

  it('temsil adlari ve mekan adresi isaretlemeye yazilmamis', () => {
    etkinlik.performances.forEach(t =>
      expect(sayfaJs, t.title + ' isaretlemeye yazilmis').not.toContain(t.title));
    expect(sayfaJs).not.toContain(etkinlik.venue.address);
    expect(sayfaJs).not.toContain(etkinlik.title);
  });

  it('bicimlendirme ve hesaplar tekrar yazilmamis', () => {
    ['function formatTRY', 'function formatTrDate', 'function ratingSummary',
     'function refundAmount', 'function reviewerInitials']
      .forEach(fn => expect(veriJs, fn + ' etkinlik tarafinda tekrar tanimlanmis').not.toContain(fn));
    expect(veriJs).toContain("require('./tour-data.js')");
  });

  it('destek numarasi ortak kaynaktan geliyor', () => {
    expect(sayfaJs).toContain('CONTACT.phoneHref');
    expect(sayfaJs).not.toMatch(/0850\s*000/);
  });
});

/* ---------------- sezon bitti paneli ---------------- */
describe('sezon tamamlandiginda', () => {
  it('bilet karti yerine panel basiliyor', () => {
    /* Satin alinamayan bir forma bakmak "tukendi mi, bozuk mu"
       sorusunu doguruyordu. */
    const fn = sayfaJs.match(/function bookingMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('if (sezonBitti) return seasonOverMarkup();');
    expect(sayfaJs).toContain('function seasonOverMarkup()');
    expect(etkinlikStil).toContain('.etk-sezon-bitti {');
  });

  it('yapiskan serit de sezon bittigini soyluyor', () => {
    const fn = sayfaJs.match(/function syncStickyBar\(hesap\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('if (sezonBitti)');
  });

  it('ozet sayfasi sezon bittiginde acilmiyor', () => {
    const fn = sayfaJs.match(/function openSheet\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('sezonBitti');
  });
});

/* ---------------- katman kilidi ---------------- */
describe('katman kilidi', () => {
  const kilit = sayfaJs.match(/function lockScroll\(on\) \{([\s\S]*?)\n  \}/)[1];

  it('govde sabitleniyor, yalnizca overflow ile yetinilmiyor', () => {
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
  const temiz = etkinlikStil.replace(/\/\*[\s\S]*?\*\//g, '');

  it('text-shadow yok', () => {
    const bulunan = (temiz.match(/text-shadow\s*:\s*[^;]+/g) || []).filter(k => !/none/.test(k));
    expect(bulunan, 'event.css icinde text-shadow: ' + bulunan.join(' | ')).toEqual([]);
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
          expect(renk.test(kat), 'event.css icinde renkli parlama: ' + kat.trim()).toBe(false));
      });
    });
  });

  it('kendi renk paletini kurmuyor', () => {
    expect(temiz).not.toMatch(/:root\s*\{/);
    expect(temiz).toContain('var(--border)');
  });

  it('gecmis temsil renkle degil doygunlukla ayriliyor', () => {
    /* Kirmizi bir "gecti" rozeti hata gibi okunuyordu. */
    const kural = etkinlikStil.match(/\.etk-temsil\.is-gecmis \{([\s\S]*?)\n\}/)[1];
    expect(kural).toContain('opacity');
    expect(kural).not.toMatch(/#C2410C|red/i);
  });

  it('kategori karti gorseli akistan cikmis', () => {
    const kural = etkinlikStil.match(/\.etk-kategori-media img \{([\s\S]*?)\n\}/)[1];
    expect(kural).toContain('position: absolute');
    expect(kural).toContain('object-fit: cover');
  });

  it('temsil satirinda odak halkasi duruyor', () => {
    /* Satir klavyeyle secilebiliyor (role="button"). */
    expect(etkinlikStil).toMatch(/\.etk-temsil:focus-visible[\s\S]{0,80}outline:\s*\d+px solid/);
    expect(sayfaJs).toContain('role="button"');
  });
});

/* ---------------- bilet karti ---------------- */
describe('bilet karti', () => {
  it('kart tek DOM dugumu olarak tasiniyor', () => {
    expect(sayfaJs).toContain('hedef.appendChild(bookingEl)');
    expect(sayfaJs).not.toContain('cloneNode');
    expect(sayfa).toContain('id="tourBookingMobile"');
    expect(sayfa).toContain('id="tourBookingDesktop"');
  });

  it('tarih cipleri takvimden degil temsil listesinden', () => {
    /* Etkinlik yalnizca o gecelerde var; bos bir takvim gostermek
       satilmayan gunleri satiliyor gibi gosterirdi. */
    const fn = sayfaJs.match(/function dateChipsMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('yaklasan');
    expect(fn).not.toContain('nextDepartureDates');
  });

  it('secili temsilin eseri tarih ciplerinde ve notta gorunuyor', () => {
    expect(sayfaJs).toContain('etk-date-eser');
    expect(sayfaJs).toContain("getElementById('etkTemsilNot')");
  });

  it('sinira gelen sayac dugmesi pasiflesiyor', () => {
    expect(sayfaJs).toContain('btn.disabled = sonuc[hedef] === state[hedef]');
    expect(sayfaJs).toContain("getElementById('tourPartyLimit')");
  });

  it('kategori secimi tek durumdan besleniyor', () => {
    expect(sayfaJs).toContain('state.category = id');
    expect(sayfaJs).toContain("state.category = kategori.getAttribute('data-category')");
    expect(sayfaJs).toContain('function syncCategoryCards()');
  });
});
