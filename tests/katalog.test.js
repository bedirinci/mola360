/* Icerik katalogu testleri.

   Katalog, icerik kayitlarini (TOURS, HOTELS ve ileride etkinlik/
   aktivite/mekan kayitlari) anasayfanin kart bicimine cevirip
   cardSections'a karistiriyor. Boylece yeni bir icerik sayfasi yazmak
   anasayfaya dokunmayi gerektirmiyor ve karttaki fiyat/puan/tarih
   kaydin kendisinden geliyor.

   Buradaki testler o sozu koruyor:
   1) Kayit eklemek yeterli -- kart kendiliginden olusuyor.
   2) Turetilen alanlar kaydin alanlariyla ayrisamiyor.
   3) Elle yazilmis bir kopya kalsa bile kart iki kez gorunmuyor.
   4) Anasayfanin butun listeleri (serit, kategori, arama) ayni kaynaktan
      besleniyor. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  KATALOG_KAYNAKLARI,
  formatReviewCount,
  cardDateText,
  cardDaysUntil,
  cardDayKey,
  tourCatalogCard,
  hotelCatalogCard,
  catalogCards,
  catalogAllCards,
  mergeCatalogCards,
} from '../assets/js/catalog.js';
import { TOURS, ratingSummary, basePrice } from '../assets/js/tour-data.js';
import { HOTELS, hotelScore, hotelNightlyFrom } from '../assets/js/hotel-data.js';

const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');
const app = oku('assets/js/app.js');
const anasayfa = oku('index.html');
const katalogJs = oku('assets/js/catalog.js');

/* Tarih ureten testler sabit bir "bugun" kullaniyor: gercek tarihle
   calisan bir test, calistigi gune gore baska sonuc verir. 21 Eylul 2026
   bir pazartesi. */
const BUGUN = '2026-09-21';

/* ---------------- yorum sayisi bicimi ---------------- */
describe('yorum sayisi bicimi', () => {
  it('binden buyuk sayi kisaltiliyor', () => {
    expect(formatReviewCount(1247)).toBe('1,2b+');
    expect(formatReviewCount(1000)).toBe('1b+');
    expect(formatReviewCount(12400)).toBe('12,4b+');
  });

  it('kucuk sayilar onluga yuvarlaniyor', () => {
    expect(formatReviewCount(974)).toBe('970+');
    expect(formatReviewCount(214)).toBe('210+');
    expect(formatReviewCount(96)).toBe('90+');
  });

  it('yuvarlama her zaman asagi', () => {
    /* Kart hicbir zaman olandan fazla yorum oldugunu soylemesin. */
    for (const n of [7, 19, 199, 999, 1099, 1999]) {
      const metin = formatReviewCount(n);
      const sayi = metin.includes('b')
        ? Number(metin.replace('b+', '').replace(',', '.')) * 1000
        : Number(metin.replace('+', ''));
      expect(sayi, n + ' -> ' + metin + ' yukari yuvarlanmis').toBeLessThanOrEqual(n);
    }
  });

  it('on altindaki sayi oldugu gibi', () => {
    expect(formatReviewCount(0)).toBe('0');
    expect(formatReviewCount(9)).toBe('9');
  });
});

/* ---------------- tarih metni ---------------- */
describe('kart tarihi', () => {
  it('yakin gunler gun adiyla, uzak gunler tarihle', () => {
    expect(cardDateText('2026-09-21', BUGUN)).toBe('Bugün');
    expect(cardDateText('2026-09-22', BUGUN)).toBe('Yarın');
    expect(cardDateText('2026-09-26', BUGUN)).toBe('Bu Cumartesi');
    /* Bir haftadan uzagi "Bu Cumartesi" diye yazmak yaniltici olurdu. */
    expect(cardDateText('2026-10-20', BUGUN)).toBe('20 Ekim, Salı');
  });

  it('gecmis tarih bugun gibi okunur', () => {
    /* Kayittan gelen tarih hicbir zaman gecmis olmamali; olursa kart
       "3 gun once" yazmaktansa bugunu gostersin. */
    expect(cardDateText('2026-09-18', BUGUN)).toBe('Bugün');
  });

  it('bos tarih bos metin', () => {
    expect(cardDateText('', BUGUN)).toBe('');
  });

  it('kalan gun sayisi sirali', () => {
    expect(cardDaysUntil('2026-09-21', BUGUN)).toBe(0);
    expect(cardDaysUntil('2026-09-24', BUGUN)).toBe(3);
    expect(cardDaysUntil('2026-10-01', BUGUN)).toBe(10);
  });

  it('hafta sonu filtresi yalnizca bu haftayi kapsiyor', () => {
    /* "Bu Cumartesi" filtresi iki hafta sonraki cumartesiyi gosterirse
       filtre yalan soyler. */
    expect(cardDayKey('2026-09-25', BUGUN)).toBe('cuma');
    expect(cardDayKey('2026-09-26', BUGUN)).toBe('cumartesi');
    expect(cardDayKey('2026-09-27', BUGUN)).toBe('pazar');
    expect(cardDayKey('2026-10-03', BUGUN)).toBe('');   // gelecek cumartesi
    expect(cardDayKey('2026-09-22', BUGUN)).toBe('');   // sali
  });
});

/* ---------------- turetilen kartlar ---------------- */
describe('kayittan kart uretimi', () => {
  it('her tur kaydi kart uretiyor', () => {
    Object.values(TOURS).forEach(t => {
      const kart = tourCatalogCard(t, BUGUN);
      expect(kart.href).toBe('tur/' + t.slug + '/');
      expect(kart.title).toBeTruthy();
      expect(kart.img, t.slug + ' kart gorseli yok').toBeTruthy();
      expect(kart.badges.length).toBeGreaterThan(0);
      expect(kart.type).toBe('Tur');
    });
  });

  it('her otel kaydi kart uretiyor', () => {
    Object.values(HOTELS).forEach(o => {
      const kart = hotelCatalogCard(o, BUGUN);
      expect(kart.href).toBe('otel/' + o.slug + '/');
      expect(kart.img, o.slug + ' kart gorseli yok').toBeTruthy();
      expect(kart.unit).toBe('/gece');
      expect(kart.type).toBe('Otel');
    });
  });

  it('fiyat, puan ve yorum sayisi kayittan geliyor', () => {
    const t = TOURS['efes-sirince'];
    const kart = tourCatalogCard(t, BUGUN);
    const puan = ratingSummary(t.ratingBreakdown);
    expect(Number(kart.priceMain)).toBe(basePrice(t));
    expect(kart.rating).toBe(String(puan.average));
    expect(kart.reviews).toBe(formatReviewCount(puan.total));

    const o = HOTELS['kordon-butik-otel'];
    const otelKart = hotelCatalogCard(o, BUGUN);
    expect(Number(otelKart.priceMain)).toBe(hotelNightlyFrom(o));
    expect(Number(otelKart.rating)).toBe(hotelScore(o.ratingBreakdown));
  });

  it('kart gorsel anahtari anasayfada kayitli', () => {
    /* Kayitsiz anahtar app.js'te rastgele bir picsum fotografina duser:
       alakasiz gorselin en sik kaynagi budur. */
    const kayitli = new Set([...app.match(/const cardImages = \{([\s\S]*?)\n\};/)[1]
      .matchAll(/"([^"]+)":/g)].map(m => m[1]));
    catalogAllCards(BUGUN).forEach(kart =>
      expect(kayitli.has(kart.img), kart.href + ' gorseli (' + kart.img + ') cardImages icinde yok')
        .toBe(true));
  });

  it('kart basligi kartta okunabilir uzunlukta', () => {
    /* Dar kartta uzun baslik uc satira tasiyor; kayit isterse kisa ad
       verebiliyor (card.title). */
    catalogAllCards(BUGUN).forEach(kart =>
      expect(kart.title.length, kart.href + ' kart basligi cok uzun').toBeLessThanOrEqual(60));
  });
});

/* ---------------- seritlere dagilim ---------------- */
describe('seritlere dagilim', () => {
  it('gunubirlik ve konaklamali tur ayri seritlerde', () => {
    const gunubirlik = catalogCards('turlar', BUGUN).map(k => k.href);
    const konaklamali = catalogCards('konaklamali-turlar', BUGUN).map(k => k.href);
    expect(gunubirlik).toContain('tur/efes-sirince/');
    expect(gunubirlik).not.toContain('tur/kapadokya-3-gece/');
    expect(konaklamali).toContain('tur/kapadokya-3-gece/');
    expect(konaklamali).not.toContain('tur/efes-sirince/');
  });

  it('turlar yaklasan planlar seridine de giriyor', () => {
    /* Serit turu degil zamani gosteriyor: tarihi olan her icerik girer. */
    const yaklasan = catalogCards('yaklasan-planlar', BUGUN).map(k => k.href);
    Object.keys(TOURS).forEach(slug =>
      expect(yaklasan, slug + ' yaklasan planlarda yok').toContain('tur/' + slug + '/'));
  });

  it('otelin sabit tarihi olmadigi icin yaklasan planlarda yok', () => {
    const yaklasan = catalogCards('yaklasan-planlar', BUGUN).map(k => k.href);
    Object.keys(HOTELS).forEach(slug =>
      expect(yaklasan).not.toContain('otel/' + slug + '/'));
  });

  it('yaklasan planlara giren kartta siralama alanlari dolu', () => {
    catalogCards('yaklasan-planlar', BUGUN).forEach(kart => {
      expect(typeof kart.inDays, kart.href + ' inDays yok').toBe('number');
      expect(kart.meta2, kart.href + ' tarih metni bos').toBeTruthy();
    });
  });

  it('taninmayan serit bos donuyor', () => {
    /* Katalogda karsiligi olmayan bir serit (ornegin "Etkinlikler",
       henuz icerik sayfasi yok) elle yazilmis kartlariyla kaliyor. */
    expect(catalogCards('etkinlikler', BUGUN)).toEqual([]);
    expect(catalogCards('yok-boyle-bir-serit', BUGUN)).toEqual([]);
  });

  it('kaynak kutugu ileride eklenecek turler icin hazir', () => {
    /* Her kaynagin uc alani var ve kayit kumesi yuklu degilse satir
       sessizce atlaniyor -- katalogu yukleyen ama o veri dosyasini
       yuklemeyen bir sayfa patlamamali. */
    KATALOG_KAYNAKLARI.forEach(k => {
      expect(typeof k.anchor).toBe('string');
      expect(typeof k.kayitlar).toBe('function');
      expect(typeof k.kart).toBe('function');
    });
    const bos = { anchor: 'deneme', kayitlar: () => null, kart: () => ({}) };
    KATALOG_KAYNAKLARI.push(bos);
    expect(catalogCards('deneme', BUGUN)).toEqual([]);
    KATALOG_KAYNAKLARI.pop();
  });
});

/* ---------------- birlestirme ---------------- */
describe('seritlerle birlestirme', () => {
  const serit = () => ([
    { anchor: 'oteller', items: [
      { title: 'Sealight Resort', priceMain: '2100' },
      { title: 'Termal Vadi Resort', priceMain: '1590' }
    ]},
    { anchor: 'etkinlikler', items: [{ title: 'Harbiye Konserleri', priceMain: '890' }] }
  ]);

  it('turetilen kart seridin basina giriyor', () => {
    /* Icerik sayfasi olan kayit, sayfasi olmayan ornek kartin onunde. */
    const s = mergeCatalogCards(serit(), BUGUN);
    expect(s[0].items[0].href).toBe('otel/kordon-butik-otel/');
    expect(s[0].items).toHaveLength(3);
  });

  it('elle yazilmis kopya eleniyor', () => {
    /* Ayni otel iki kez gorunmesin: elle yazilmis satir ayni adresi ya da
       ayni basligi tasiyorsa dusuyor. */
    const adresli = serit();
    adresli[0].items.unshift({ title: 'Kordon Butik Otel', href: 'otel/kordon-butik-otel/', priceMain: '1950' });
    const s1 = mergeCatalogCards(adresli, BUGUN);
    expect(s1[0].items.filter(i => i.href === 'otel/kordon-butik-otel/')).toHaveLength(1);

    const baslikli = serit();
    baslikli[0].items.unshift({ title: 'kordon butik otel', priceMain: '1950' });
    const s2 = mergeCatalogCards(baslikli, BUGUN);
    expect(s2[0].items.filter(i => /kordon butik otel/i.test(i.title))).toHaveLength(1);
  });

  it('katalogda karsiligi olmayan serit dokunulmadan kaliyor', () => {
    const s = mergeCatalogCards(serit(), BUGUN);
    expect(s[1].items).toHaveLength(1);
    expect(s[1].items[0].title).toBe('Harbiye Konserleri');
  });

  it('bos veya gecersiz girdi patlamiyor', () => {
    expect(() => mergeCatalogCards(null, BUGUN)).not.toThrow();
    expect(() => mergeCatalogCards([{ anchor: 'oteller' }], BUGUN)).not.toThrow();
  });
});

/* ---------------- anasayfaya baglanma ---------------- */
describe('anasayfa katalogu yukluyor', () => {
  it('veri dosyalari app.js\'ten once yukleniyor', () => {
    /* catalog.js kayitlarin adlarini kullaniyor, app.js de katalogu. */
    /* Dosya adlari yorumlarda da geciyor; bakilan sey <script> etiketleri. */
    const betikler = [...anasayfa.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
    const sira = ['assets/js/tour-data.js', 'assets/js/hotel-data.js',
      'assets/js/catalog.js', 'assets/js/app.js'].map(y => betikler.indexOf(y));
    sira.forEach((yer, i) => expect(yer, i + '. dosya anasayfada yuklenmiyor').toBeGreaterThan(-1));
    for (let i = 1; i < sira.length; i++) expect(sira[i - 1]).toBeLessThan(sira[i]);
  });

  it('app.js seritleri katalogla birlestiriyor', () => {
    expect(app).toContain("if (typeof mergeCatalogCards === 'function') mergeCatalogCards(cardSections);");
  });

  it('katalogu yuklemeyen sayfa app.js\'te patlamiyor', () => {
    /* Tur ve otel icerik sayfalari app.js'i yukluyor ama katalogu
       yuklemiyor; cagri korumali olmak zorunda. */
    expect(app).toMatch(/typeof mergeCatalogCards === 'function'/);
    ['tur/efes-sirince/index.html', 'otel/kordon-butik-otel/index.html'].forEach(yol =>
      expect(oku(yol), yol + ' katalogu yukluyor').not.toContain('assets/js/catalog.js'));
  });

  it('icerik kartlari anasayfaya elle yazilmamis', () => {
    /* Elle yazilmis bir kart kaydin fiyatindan/puanindan kopyalanmis
       demektir ve zamanla ondan ayrisir. cardSections icinde icerik
       sayfasina giden bir href kalmamali. */
    const kartBloku = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    const elleBaglar = [...kartBloku.matchAll(/href:'((?:tur|otel)\/[^']*)'/g)].map(m => m[1]);
    expect(elleBaglar, 'elle yazilmis icerik bagi: ' + elleBaglar.join(', ')).toEqual([]);
  });

  it('arama sonucu icerik sayfasina gidiyor', () => {
    /* Once butun sonuclar <button> idi ve tiklayinca yalnizca arama
       kutusunu dolduruyordu: sayfasi olan bir kayda aramadan
       ulasilamiyordu. */
    const fn = app.match(/function searchResultMarkup\(item\) \{([\s\S]*?)\n\}/)[1];
    expect(fn).toContain('class="m360-search-result" href=');
    expect(fn).toContain('${SITE_KOK}${item.href}');
    expect(fn).toContain('getSearchCardType(item.sectionTitle, item.type)');
    /* Uc ayri yerde kart basiliyordu; tek isaretleme kaldi ve uc yer de
       onu cagiriyor. */
    expect((app.match(/\$\{searchResultMarkup\(item\)\}/g) || []).length).toBe(3);
  });

  it('kompakt kart da icerik sayfasina gidiyor', () => {
    /* Ayni tur hem kendi seridinde hem yaklasan planlarda duruyor;
       birinde tiklanip digerinde tiklanmamasi olmaz. */
    expect(app).toContain('.poi-card[data-href], .compact-card[data-href]');
    const fn = app.match(/function compactCardMarkup\(sec, it\)\s*\{([\s\S]*?)\n\}/)[1];
    expect(fn).toContain('data-href');
    expect(fn).toContain('<a href="${it.href}">${it.title}</a>');
  });
});

/* ---------------- metin tek kaynakta ---------------- */
describe('katalog metin uretmiyor', () => {
  it('otel ve tur adlari katalogda yazili degil', () => {
    Object.values(TOURS).forEach(t => expect(katalogJs).not.toContain(t.title));
    Object.values(HOTELS).forEach(o => expect(katalogJs).not.toContain(o.title));
  });

  it('fiyatlar katalogda yazili degil', () => {
    Object.values(HOTELS).forEach(o =>
      o.rooms.forEach(r => expect(katalogJs).not.toContain(String(r.nightly))));
  });
});
