/* Aktivite icerik sayfasi (/aktivite/<slug>/) testleri.

   Yapisi tur ve otel testleriyle ayni:
   1) Saf fonksiyonlar — paket, seans, katilim sinirlari, tutar, hava
      iadesi. DOM'a dokunmadiklari icin dogrudan cagriliyorlar.
   2) Icerik butunlugu — sayfa, activity-page.js, activity-data.js ve
      app.js metin olarak okunup birbirine bagli yerler karsilastiriliyor.

   Aktivitenin kendine ozgu iki kurali var ve ikisi de burada bekcilik
   ediliyor: seans farkinin NEGATIF olabilmesi (ikinci kalkis indirimli)
   ve hava iptalinin misafir iptalinden AYRI, kosulsuz tam iade olmasi. */
import { describe, it, expect } from 'vitest';
import { MolaVeri, KAPI_SITE_ADRESI } from '../assets/js/data-gateway.js';
import { readFileSync, existsSync } from 'node:fs';
import {
  ACTIVITIES,
  DEFAULT_ACTIVITY_SLUG,
  ACTIVITY_IMAGE_FILES,
  activityImage,
  activityPackage,
  activitySession,
  clampActivityParty,
  activityAddonLines,
  calcActivityTotal,
  activityPriceFrom,
  activityListPriceFrom,
  weatherRefundAmount,
  activitySlugFromPath,
} from '../assets/js/activity-data.js';
import { TOUR_ICONS, TOUR_IMAGE_FILES, TOURS, commonsImageUrl, ratingSummary, refundAmount } from '../assets/js/tour-data.js';
import { catalogCards, catalogAllCards, cardDateText } from '../assets/js/catalog.js';

const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');

const sayfaJs = oku('assets/js/activity-page.js');
const veriJs = oku('assets/js/activity-data.js');
const app = oku('assets/js/app.js');
const aktiviteStil = oku('assets/css/activity.css');
const turStil = oku('assets/css/tour.css');

const sayfalar = Object.keys(ACTIVITIES).map(slug => ({
  slug,
  aktivite: ACTIVITIES[slug],
  html: oku('aktivite/' + slug + '/index.html')
}));

const aktivite = ACTIVITIES[DEFAULT_ACTIVITY_SLUG];
const sayfa = sayfalar.find(s => s.slug === DEFAULT_ACTIVITY_SLUG).html;
const BUGUN = '2026-09-21';

const secim = { adults: 2, children: 0, pack: 'standart', session: 'gun-dogumu', addons: [] };

/* ---------------- paket ve seans ---------------- */
describe('paket ve seans cozumleme', () => {
  it('kimlikle dogru kayit geliyor', () => {
    expect(activityPackage(aktivite, 'konfor').id).toBe('konfor');
    expect(activitySession(aktivite, 'ikinci-tur').id).toBe('ikinci-tur');
  });

  it('taninmayan kimlik ilk kayda duser', () => {
    /* Adres cubugundan ya da eski bir bagdan gelen yanlis deger sayfayi
       bos birakmasin. */
    expect(activityPackage(aktivite, 'yok').id).toBe(aktivite.packages[0].id);
    expect(activitySession(aktivite, '').id).toBe(aktivite.sessions[0].id);
  });

  it('her paketin fiyati, kapasitesi ve cocuk tarifesi var', () => {
    aktivite.packages.forEach(p => {
      expect(p.perPerson, p.id + ' fiyati yok').toBeGreaterThan(0);
      expect(p.child, p.id + ' cocuk tarifesi yok').toBeGreaterThan(0);
      expect(p.capacity, p.id + ' kapasitesi yok').toBeGreaterThan(0);
      /* Cocuk tarifesi yetiskinden ucuz olmali; esit ya da pahali
         olsaydi "indirimli" demek yanlis olurdu. */
      expect(p.child, p.id + ' cocuk tarifesi yetiskinden ucuz degil').toBeLessThan(p.perPerson);
    });
  });
});

/* ---------------- katilim sinirlari ---------------- */
describe('katilim sinirlari', () => {
  it('refakatsiz cocuk kabul edilmiyor', () => {
    /* Bir yetiskin en fazla iki cocuga refakat edebilir; sinir
       uygulanmasaydi "1 yetiskin, 5 cocuk" satilamayacak bir secim
       hesaba girerdi. */
    const plan = clampActivityParty(aktivite, { ...secim, adults: 1, children: 5 });
    expect(plan.children).toBe(aktivite.pricing.childrenPerAdult);
    expect(plan.adults).toBe(1);
  });

  it('en az bir yetiskin kaliyor', () => {
    expect(clampActivityParty(aktivite, { ...secim, adults: 0 }).adults).toBe(1);
    expect(clampActivityParty(aktivite, { ...secim, adults: -2 }).adults).toBe(1);
  });

  it('tek rezervasyon siniri asilamaz', () => {
    const plan = clampActivityParty(aktivite, { ...secim, adults: 20, children: 4 });
    expect(plan.guests).toBeLessThanOrEqual(aktivite.pricing.maxGuests);
  });

  it('kucuk sepet kendi kapasitesini dayatiyor', () => {
    /* Ozel ucus 4 kisilik; genel sinir 8 olsa bile o pakette 4'u
       gecemiyor. */
    const ozel = activityPackage(aktivite, 'ozel');
    const plan = clampActivityParty(aktivite, { ...secim, pack: 'ozel', adults: 8 });
    expect(plan.guests).toBeLessThanOrEqual(ozel.capacity);
  });
});

/* ---------------- tutar ---------------- */
describe('ucus tutari', () => {
  it('yetiskin tutari paketin kisi basi fiyati', () => {
    const hesap = calcActivityTotal(aktivite, { ...secim, adults: 3 });
    expect(hesap.adultTotal).toBe(3 * activityPackage(aktivite, 'standart').perPerson);
  });

  it('cocuk paketin kendi cocuk tarifesinden', () => {
    const hesap = calcActivityTotal(aktivite, { ...secim, adults: 2, children: 2, pack: 'konfor' });
    expect(hesap.childTotal).toBe(2 * activityPackage(aktivite, 'konfor').child);
  });

  it('ikinci kalkis indirimi tutari dusuruyor', () => {
    /* Seans farki NEGATIF olabiliyor; hesap bunu eksi tutarli bir
       satir olarak basiyor ve toplam geriliyor. */
    const ilk = calcActivityTotal(aktivite, { ...secim, session: 'gun-dogumu' });
    const ikinci = calcActivityTotal(aktivite, { ...secim, session: 'ikinci-tur' });
    const fark = Number(activitySession(aktivite, 'ikinci-tur').fee);
    expect(fark).toBeLessThan(0);
    expect(ikinci.total).toBe(ilk.total + fark * ikinci.guests);
    const indirimSatiri = ikinci.lines.find(l => l.kind === 'discount');
    expect(indirimSatiri, 'indirim satiri yok').toBeTruthy();
    expect(indirimSatiri.amount).toBeLessThan(0);
  });

  it('gun dogumu kalkisi ek satir uretmiyor', () => {
    /* Farki sifir olan seans icin "0 TL fark" satiri basmak dokumu
       gereksiz uzatiyordu. */
    const hesap = calcActivityTotal(aktivite, secim);
    expect(hesap.sessionTotal).toBe(0);
    expect(hesap.lines.some(l => l.kind === 'fee' || l.kind === 'discount')).toBe(false);
  });

  it('ek hizmetin iki carpani birbirinden farkli', () => {
    const hesap = calcActivityTotal(aktivite, { ...secim, adults: 2, children: 1, pack: 'konfor',
      addons: ['fotoVideo', 'hediyePaketi'] });
    const tutar = (id) => hesap.addons.find(a => a.id === id).amount;
    expect(tutar('fotoVideo')).toBe(1200);        // rezervasyon basina
    expect(tutar('hediyePaketi')).toBe(350 * 3);  // kisi basina
  });

  it('secilmeyen ek hizmet tutara girmiyor', () => {
    expect(activityAddonLines(aktivite, { ...secim, addons: [] })).toEqual([]);
    expect(calcActivityTotal(aktivite, secim).addonsTotal).toBe(0);
  });

  it('vergi satiri yok', () => {
    /* Otelde konaklama vergisi ayri satirdi (faturada oyle gorunuyor);
       aktivite fiyati KDV dahil tek tutar. Iki sayfanin farki bilincli. */
    const hesap = calcActivityTotal(aktivite, { ...secim, addons: ['fotoVideo'] });
    expect(hesap.lines.some(l => /vergi/i.test(l.label))).toBe(false);
    expect(hesap.total).toBe(hesap.subtotal + hesap.addonsTotal);
  });

  it('avantaj yalnizca kisi basi tarifeler uzerinden', () => {
    /* Seans farki bir tarife farki, indirimli fiyat degil. */
    const hesap = calcActivityTotal(aktivite, { ...secim, adults: 2, session: 'ikinci-tur' });
    const paket = activityPackage(aktivite, 'standart');
    expect(hesap.saving).toBe(2 * (paket.perPersonList - paket.perPerson));
  });

  it('ozet satirlarinin toplami odenecek tutara esit', () => {
    const hesap = calcActivityTotal(aktivite, { adults: 2, children: 2, pack: 'konfor',
      session: 'ikinci-tur', addons: ['fotoVideo', 'ozelTransfer', 'hediyePaketi'] });
    const toplam = hesap.lines.reduce((t, l) => t + l.amount, 0);
    expect(toplam).toBe(hesap.total);
  });

  it('hesap kendi sinirlarini uyguluyor', () => {
    const hesap = calcActivityTotal(aktivite, { ...secim, adults: 30, children: 9 });
    expect(hesap.guests).toBeLessThanOrEqual(aktivite.pricing.maxGuests);
  });

  it('en ucuz paket fiyati ve liste fiyati', () => {
    const enUcuz = aktivite.packages.reduce((a, b) => (a.perPerson <= b.perPerson ? a : b));
    expect(activityPriceFrom(aktivite)).toBe(enUcuz.perPerson);
    expect(activityListPriceFrom(aktivite)).toBe(enUcuz.perPersonList);
  });
});

/* ---------------- hava iptali ---------------- */
describe('hava kosulu iadesi', () => {
  it('hava iptalinde tam iade', () => {
    /* Kural misafir iptalinden AYRI: kademe tablosuna bakmiyor. */
    expect(weatherRefundAmount(aktivite, 2990)).toBe(2990);
    expect(weatherRefundAmount(aktivite, 11970)).toBe(11970);
  });

  it('misafir iptali kademeli, hava iptali degil', () => {
    /* Son 24 saatte misafir iptalinde iade yok; ayni saatte hava
       iptalinde tam iade var. Ikisi karistirilirsa sayfa yalan soyler. */
    const tiers = aktivite.cancellation.tiers;
    expect(refundAmount(2990, 2, tiers)).toBe(0);
    expect(weatherRefundAmount(aktivite, 2990)).toBe(2990);
  });

  it('oran kayittan okunuyor, kodda sabit degil', () => {
    expect(aktivite.cancellation.weatherRefund).toBe(1);
    const yarim = { cancellation: { weatherRefund: 0.5 } };
    expect(weatherRefundAmount(yarim, 1000)).toBe(500);
    /* Kayitta deger yoksa tam iade varsayiliyor: eksik veri yuzunden
       misafirin parasinin yanmasi kabul edilemez. */
    expect(weatherRefundAmount({}, 1000)).toBe(1000);
  });

  it('sayfa hava iadesini ayri bir kutuda gosteriyor', () => {
    expect(sayfaJs).toContain('akt-hava');
    expect(sayfaJs).toContain('weatherRefundAmount(activity, ornek)');
    expect(aktiviteStil).toContain('.akt-hava {');
  });
});

/* ---------------- kontenjan ----------------
   Kalan yer artık uydurulmuyor. Önceki activitySeatsLeft() tarih metninin karma
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
    expect(sayfaJs).toMatch(/MolaVeri\.urun\('activity',\s/);
    expect(sayfaJs).not.toMatch(/resolveActivity\(/);
    expect(sayfaJs).toContain("MolaVeri.musaitlik('activity', ");
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
      expect(yer('activity-page.js'), s.slug).toBeGreaterThan(yer('data-gateway.js'));
    }
  });
});

/* ---------------- adres ---------------- */
describe('adres ve kayit cozumleme', () => {
  it('slug adresten okunuyor', () => {
    expect(activitySlugFromPath('/aktivite/kapadokya-balon-turu/')).toBe('kapadokya-balon-turu');
    expect(activitySlugFromPath('/mola360/aktivite/kapadokya-balon-turu/index.html')).toBe('kapadokya-balon-turu');
  });

  it('baska turden adres bos donuyor', () => {
    expect(activitySlugFromPath('/otel/kordon-butik-otel/')).toBe('');
    expect(activitySlugFromPath('/aktivite/index.html')).toBe('');
    expect(activitySlugFromPath('')).toBe('');
  });

  it('taninmayan slug varsayilana DUSMUYOR', () => {
    expect(MolaVeri.urun('activity', 'yok')).toBe(null);
    expect(MolaVeri.urun('activity', '')).toBe(null);
  });

  it('her kaydin anahtari kendi slug alaniyla ayni', () => {
    Object.keys(ACTIVITIES).forEach(slug => expect(ACTIVITIES[slug].slug).toBe(slug));
  });
});

/* ---------------- gorseller ve ikonlar ---------------- */
describe('gorseller ve ikonlar', () => {
  it('kullanilan her gorsel anahtari kayitli', () => {
    const kullanilan = new Set();
    aktivite.gallery.forEach(g => kullanilan.add(g.key));
    aktivite.similar.forEach(s => kullanilan.add(s.key));
    aktivite.packages.forEach(p => kullanilan.add(p.key));
    [...kullanilan].forEach(k =>
      expect(ACTIVITY_IMAGE_FILES[k], 'kayitsiz gorsel anahtari: ' + k).toBeTruthy());
  });

  it('ortak gorseller iki dosyada da ayni adresi uretiyor', () => {
    Object.keys(ACTIVITY_IMAGE_FILES).forEach(anahtar => {
      const turKayit = TOUR_IMAGE_FILES[anahtar];
      if (!turKayit) return;
      expect(activityImage(anahtar, 800), anahtar + ' iki dosyada farkli')
        .toBe(commonsImageUrl(turKayit.dosya, 800));
    });
  });

  it('kayitsiz anahtar bos adres donduruyor', () => {
    expect(activityImage('yok', 400)).toBe('');
    expect(activityImage('kapadokyaBalon', 400)).toContain('Special:FilePath');
  });

  it('kullanilan her ikon TOUR_ICONS icinde tanimli', () => {
    const kullanilan = new Set();
    for (const m of sayfaJs.matchAll(/(?:ic|tourSvg)\('([a-zA-Z0-9]+)'\)/g)) kullanilan.add(m[1]);
    [aktivite.badges, aktivite.facts, aktivite.trust, aktivite.requirements].forEach(liste =>
      liste.forEach(x => { if (x.icon) kullanilan.add(x.icon); }));
    const eksik = [...kullanilan].filter(k => !TOUR_ICONS[k]);
    expect(eksik, 'tanimsiz ikon: ' + eksik.join(', ')).toEqual([]);
  });

  it('ciplak tourSvg kullanan her sinifin svg olcu kurali var', () => {
    const ciplak = [...sayfaJs.matchAll(/class="([a-z0-9 -]+)"[^>]*>\$\{tourSvg\(/g)]
      .map(m => m[1].split(/\s+/)[0]);
    expect(ciplak.length, 'oruntu hic eslesmedi, test olmus olabilir').toBeGreaterThan(2);
    [...new Set(ciplak)].forEach(sinif => {
      const kural = new RegExp('\\.' + sinif + '\\s+svg\\b');
      expect(kural.test(turStil) || kural.test(aktiviteStil),
        '.' + sinif + ' ciplak <svg> basiyor ama olcu kurali yok').toBe(true);
    });
  });
});

/* ---------------- sayfa ile kayit tutarliligi ---------------- */
describe('sayfa ve kayit tutarliligi', () => {
  it('her aktivite kaydinin kendi sayfasi var', () => {
    Object.keys(ACTIVITIES).forEach(slug =>
      expect(existsSync(new URL('../aktivite/' + slug + '/index.html', import.meta.url)),
        slug + ' sayfasi yok').toBe(true));
  });

  it('H1 ve alt baslik kayitla birebir ayni', () => {
    sayfalar.forEach(({ slug, aktivite: a, html }) => {
      expect(html, slug + ' H1 farkli').toContain('<h1>' + a.title + '</h1>');
      expect(html, slug + ' alt baslik farkli')
        .toContain('<p class="tour-lead">' + a.tagline + '</p>');
    });
  });

  it('mobil baslik kayitla ayni', () => {
    sayfalar.forEach(({ slug, aktivite: a, html }) => {
      expect(html, slug + ' mobil baslik farkli')
        .toContain('<span class="tour-mobile-title">' + a.title + '</span>');
      expect(html, slug + ' mobil alt baslik farkli')
        .toContain('<span class="tour-mobile-subtitle">' + a.categoryShort + ' · ' + a.area + '</span>');
    });
  });

  it('kirilma noktalari kayitla ayni', () => {
    sayfalar.forEach(({ slug, aktivite: a, html }) => {
      const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
      expect(ld['@type']).toBe('BreadcrumbList');
      expect(ld.itemListElement.map(i => i.name)).toEqual(['Anasayfa', a.categoryPlural, a.title]);
      expect(ld.itemListElement[1].item).toBe(KAPI_SITE_ADRESI + MolaVeri.listeYolu(a) + '/');
      expect(ld.itemListElement[2].item).toContain('/aktivite/' + slug + '/');
    });
  });

  it('uydurma fiyat ve puan yapisal veri olarak isaretlenmiyor', () => {
    sayfalar.forEach(({ slug, html }) => {
      (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).forEach(blok => {
        ['"@type": "Event"', 'AggregateRating', '"Offer"'].forEach(tip =>
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
      const sira = ['assets/js/tour-data.js', 'assets/js/activity-data.js', 'assets/js/activity-page.js']
        .map(yol => html.indexOf(yol));
      sira.forEach((yer, i) => expect(yer, slug + ' ' + i + '. dosya yuklenmiyor').toBeGreaterThan(-1));
      expect(sira[0], slug + ' tour-data.js sonra geliyor').toBeLessThan(sira[1]);
      expect(sira[1], slug + ' activity-data.js sonra geliyor').toBeLessThan(sira[2]);
      expect(html).toContain('assets/css/tour.css');
      expect(html).toContain('assets/css/activity.css');
    });
  });

  it('baska turun sayfa dosyalari yuklenmiyor', () => {
    sayfalar.forEach(({ slug, html }) => {
      ['assets/js/tour-page.js', 'assets/js/tour-pdf.js', 'assets/js/hotel-page.js']
        .forEach(dosya => expect(html, slug + ' ' + dosya + ' yukluyor').not.toContain(dosya));
    });
  });
});

/* ---------------- sayfa etiketleri ---------------- */
describe('sayfa etiketleri', () => {
  it('hedefi olmayan cip yok', () => {
    sayfalar.forEach(({ slug, aktivite: a, html }) => {
      (a.tags || []).forEach(t => {
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

  it('benzer kartlarin adresi diskte var', () => {
    /* Benzer icerik baska turden olabildigi icin adres kayitta
       dogrudan yazili; yazim hatasi olu bag demek. */
    aktivite.similar.filter(s => s.href).forEach(s => {
      const yol = s.href.endsWith('/') ? s.href + 'index.html' : s.href;
      expect(existsSync(new URL('../' + yol, import.meta.url)), s.href + ' diskte yok').toBe(true);
    });
  });
});

/* ---------------- anasayfa ve tur baglantisi ---------------- */
describe('anasayfa baglantisi', () => {
  const aktiviteKartlari = catalogAllCards(BUGUN).filter(k => k.href && !k.ornek && k.href.startsWith('aktivite/'));

  it('her aktivite anasayfaya kendiliginden giriyor', () => {
    const baglar = aktiviteKartlari.map(k => k.href);
    Object.keys(ACTIVITIES).forEach(slug =>
      expect(baglar, slug + ' anasayfaya girmiyor').toContain('aktivite/' + slug + '/'));
  });

  it('her aktivite kendi kategori seridine giriyor', () => {
    Object.values(ACTIVITIES).forEach(a => {
      const seritte = catalogCards(a.categoryAnchor, BUGUN).map(k => k.href);
      expect(seritte, a.slug + ' -> #' + a.categoryAnchor + ' seridinde yok')
        .toContain('aktivite/' + a.slug + '/');
    });
  });

  it('kart fiyati en ucuz paketin kisi basi ucreti', () => {
    aktiviteKartlari.forEach(kart => {
      const slug = kart.href.replace(/^aktivite\//, '').replace(/\/$/, '');
      expect(Number(kart.priceMain), slug + ' kart fiyati farkli')
        .toBe(activityPriceFrom(ACTIVITIES[slug]));
    });
  });

  it('kart puani ve yorum sayisi kayittan geliyor', () => {
    aktiviteKartlari.forEach(kart => {
      const slug = kart.href.replace(/^aktivite\//, '').replace(/\/$/, '');
      const puan = ratingSummary(ACTIVITIES[slug].ratingBreakdown);
      expect(kart.rating, slug + ' kart puani farkli').toBe(String(puan.average));
    });
  });

  it('musaitlik tarihi kaydin kendi kuralindan', () => {
    aktiviteKartlari.forEach(kart => {
      const slug = kart.href.replace(/^aktivite\//, '').replace(/\/$/, '');
      const gun = ACTIVITIES[slug].pricing.leadDays;
      const ilk = new Date(2026, 8, 21 + gun);
      const iso = ilk.getFullYear() + '-' + String(ilk.getMonth() + 1).padStart(2, '0')
        + '-' + String(ilk.getDate()).padStart(2, '0');
      expect(kart.meta2, slug + ' musaitlik metni farkli').toBe(cardDateText(iso, BUGUN));
    });
  });

  it('sponsorluk kayittan geciyor, turetilmiyor', () => {
    /* Sponsorluk ticari bir anlasma; kaydin card alaninda duruyor. */
    aktiviteKartlari.forEach(kart => {
      const slug = kart.href.replace(/^aktivite\//, '').replace(/\/$/, '');
      expect(kart.sponsored).toBe(!!(ACTIVITIES[slug].card || {}).sponsored);
    });
  });

  it('anasayfada elle yazilmis aktivite karti kalmamis', () => {
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    const satir = blok.split('\n').find(s => s.includes('Kapadokya Sıcak Hava Balonu'));
    expect(satir, 'elle yazilmis balon karti hala duruyor: ' + satir).toBeUndefined();
  });
});

describe('tur kaydiyla tutarlilik', () => {
  const kapadokya = TOURS['kapadokya-3-gece'];

  it('turun balon ek hizmeti aktivitenin fiyatiyla ayni', () => {
    /* Ayni urun iki yerde satiliyor: Kapadokya turunun ek hizmeti ve bu
       aktivite sayfasi. Iki fiyat ayrisirsa musteri turda bir, sayfada
       baska bir rakam gorur. */
    const balon = kapadokya.addons.find(a => a.id === 'balon');
    expect(balon, 'turda balon ek hizmeti yok').toBeTruthy();
    expect(balon.price, 'tur ek hizmeti ile aktivite fiyati ayristi')
      .toBe(activityPriceFrom(aktivite));
  });

  it('tur sayfasi aktiviteye baglaniyor', () => {
    const bag = (kapadokya.tags || []).find(t => t.href === 'aktivite/' + aktivite.slug + '/');
    expect(bag, 'Kapadokya turu balon sayfasina baglanmiyor').toBeTruthy();
  });
});

/* ---------------- metin tek kaynakta ---------------- */
describe('metin tek kaynakta', () => {
  it('paket adlari ve fiyatlari yalnizca veride', () => {
    aktivite.packages.forEach(p => {
      expect(sayfaJs, p.name + ' isaretlemeye yazilmis').not.toContain(p.name);
      expect(sayfaJs, p.perPerson + ' fiyati isaretlemeye yazilmis').not.toContain(String(p.perPerson));
    });
  });

  it('aktivite adi isaretlemeye yazilmamis', () => {
    expect(sayfaJs).not.toContain(aktivite.title);
    expect(sayfaJs).not.toContain(aktivite.meeting.address);
  });

  it('bicimlendirme ve hesaplar tekrar yazilmamis', () => {
    ['function formatTRY', 'function formatTrDate', 'function ratingSummary',
     'function refundAmount', 'function reviewerInitials']
      .forEach(fn => expect(veriJs, fn + ' aktivite tarafinda tekrar tanimlanmis').not.toContain(fn));
    expect(veriJs).toContain("require('./tour-data.js')");
  });

  it('destek numarasi ortak kaynaktan geliyor', () => {
    expect(sayfaJs).toContain('CONTACT.phoneHref');
    expect(sayfaJs).not.toMatch(/0850\s*000/);
  });
});

/* ---------------- katman kilidi ---------------- */
describe('katman kilidi', () => {
  const kilit = sayfaJs.match(/function lockScroll\(on\) \{([\s\S]*?)\n  \}/)[1];

  it('govde sabitleniyor, yalnizca overflow ile yetinilmiyor', () => {
    expect(kilit).toContain("govde.style.position = 'fixed'");
    expect(kilit).toContain("govde.style.top = -kilitliY + 'px'");
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
  const temiz = aktiviteStil.replace(/\/\*[\s\S]*?\*\//g, '');

  it('text-shadow yok', () => {
    const bulunan = (temiz.match(/text-shadow\s*:\s*[^;]+/g) || []).filter(k => !/none/.test(k));
    expect(bulunan, 'activity.css icinde text-shadow: ' + bulunan.join(' | ')).toEqual([]);
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
          expect(renk.test(kat), 'activity.css icinde renkli parlama: ' + kat.trim()).toBe(false));
      });
    });
  });

  it('kendi renk paletini kurmuyor', () => {
    expect(temiz).not.toMatch(/:root\s*\{/);
    expect(temiz).toContain('var(--border)');
    expect(temiz).toContain('var(--radius)');
  });

  it('paket karti gorseli akistan cikmis', () => {
    const kural = aktiviteStil.match(/\.akt-paket-media img \{([\s\S]*?)\n\}/)[1];
    expect(kural).toContain('position: absolute');
    expect(kural).toContain('object-fit: cover');
  });
});

/* ---------------- rezervasyon karti ---------------- */
describe('rezervasyon karti', () => {
  it('kart tek DOM dugumu olarak tasiniyor', () => {
    expect(sayfaJs).toContain('hedef.appendChild(bookingEl)');
    expect(sayfaJs).not.toContain('cloneNode');
    expect(sayfa).toContain('id="tourBookingMobile"');
    expect(sayfa).toContain('id="tourBookingDesktop"');
  });

  it('sinira gelen sayac dugmesi pasiflesiyor', () => {
    expect(sayfaJs).toContain('btn.disabled = sonuc[hedef] === state[hedef]');
    expect(sayfaJs).toContain("getElementById('tourPartyLimit')");
  });

  it('ozet dokumu hesaptan besleniyor', () => {
    const fn = sayfaJs.match(/function summaryMarkup\(hesap\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('hesap.lines.map');
    expect(fn).toContain('formatTRY(hesap.total)');
  });

  it('paket secimi tek durumdan besleniyor', () => {
    /* Paket hem listeden hem karttan secilebiliyor; durum tek. */
    expect(sayfaJs).toContain('state.pack = id');
    expect(sayfaJs).toContain("state.pack = paket.getAttribute('data-pack')");
    expect(sayfaJs).toContain('function syncPackCards()');
  });
});
