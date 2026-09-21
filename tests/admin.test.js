/* Yonetim paneli testleri.

   Panelin bir tek sozu var: KENDI VERI KOPYASINI TUTMAZ. Listede,
   kartta ve denetimde gorunen her sayi sitenin kendi veri dosyalarindan
   ve kendi fonksiyonlarindan gelir. Panel ayri bir hesap yapsaydi,
   panelde gorunen fiyat ile ziyaretcinin gordugu fiyat kacinilmaz
   olarak ayrisirdi -- docs/icerik-katalogu.md'de anlatilan "kart
   eskiyor" sorununun yonetim tarafindaki hali.

   Buradaki testler o sozu koruyor:
   1) Panel butun icerik turlerini goruyor ve hicbirini kacirmiyor.
   2) Fiyat, puan ve kart sitenin kendi fonksiyonlarindan turetiliyor.
   3) Denetim gercek bozukluklari yakaliyor, saglam veride susuyor.
   4) Taslak yayindaki kaydi DEGISTIRMIYOR ve yalnizca degisen alani
      tutuyor.
   5) Disa aktarilan blok veri dosyasina yapistirilinca calisiyor. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  ADMIN_TURLER,
  ADMIN_GRUPLAR,
  adminTur,
  adminKayitlar,
  adminKayitSatiri,
  adminSuz,
  adminBolgeler,
  adminIstatistik,
  adminDenetim,
  adminDenetimOzeti,
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
  adminIkonKullanimlari,
  adminKelimeSayisi,
  adminIndirim,
} from '../assets/js/admin-data.js';

import { TOURS, TOUR_ICONS, basePrice, ratingSummary } from '../assets/js/tour-data.js';
import { HOTELS, hotelNightlyFrom, hotelScore } from '../assets/js/hotel-data.js';
import { ACTIVITIES, activityPriceFrom } from '../assets/js/activity-data.js';
import { EVENTS, eventPriceFrom } from '../assets/js/event-data.js';
import { PLACES, venuePriceFrom } from '../assets/js/venue-data.js';
import { hotelCatalogCard, tourCatalogCard } from '../assets/js/catalog.js';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (yol) => readFileSync(path.join(KOK, yol), 'utf8');

/* Tarih ureten testler sabit bir "bugun" kullaniyor: gercek tarihle
   calisan bir test, calistigi gune gore baska sonuc verir. */
const BUGUN = '2026-09-21';
const KAYITLAR = adminKayitlar(BUGUN);

/* Denetimin "bag olu" kurali icin: sayfasi diskte gercekten olan
   adresler. Tarayicida panel ayni kumeyi adresleri yoklayarak kuruyor. */
function yasayanSayfalar() {
  const kume = new Set();
  KAYITLAR.forEach(k => {
    if (existsSync(path.join(KOK, k.adres, 'index.html'))) kume.add(k.adres);
  });
  return kume;
}

function kartGorselAnahtarlari() {
  const app = oku('assets/js/app.js');
  const blok = app.match(/const cardImages = \{([\s\S]*?)\n\};/)[1];
  return new Set([...blok.matchAll(/"([^"]+)":/g)].map(m => m[1]));
}

const DENETIM_SECENEK = {
  kartGorselleri: kartGorselAnahtarlari(),
  sayfalar: yasayanSayfalar(),
  bugun: BUGUN
};

/* ---------------- kayit toplama ---------------- */
describe('panel butun icerigi goruyor', () => {
  it('bes icerik turunun de kaydi listede', () => {
    const turler = new Set(KAYITLAR.map(k => k.tur));
    expect([...turler].sort()).toEqual(['aktivite', 'etkinlik', 'mekan', 'otel', 'tur']);
  });

  it('hicbir kayit atlanmiyor', () => {
    /* Panelin kayit sayisi, veri dosyalarindaki kayit sayisinin
       toplamiyla birebir ayni olmali: bir tur eklenip panele
       baglanmayi unutulursa bu test duser. */
    const beklenen = Object.keys(TOURS).length + Object.keys(HOTELS).length
      + Object.keys(ACTIVITIES).length + Object.keys(EVENTS).length + Object.keys(PLACES).length;
    expect(KAYITLAR.length).toBe(beklenen);
  });

  it('her turun veri dosyasi ve degiskeni depoda gercekten var', () => {
    /* Disa aktarma ekrani "su dosyadaki su nesneyi degistirin" diyor;
       yanlis dosya adi kullaniciyi bos yere arattirir. */
    ADMIN_TURLER.forEach(t => {
      const kaynak = oku(t.veriDosyasi);
      expect(kaynak, t.veriDosyasi).toContain('const ' + t.degisken + ' = {');
      expect(existsSync(path.join(KOK, t.dizin)), t.dizin + ' dizini yok').toBe(true);
    });
  });

  it('kaydin adresi tur dizini + slug', () => {
    KAYITLAR.forEach(k => {
      expect(k.adres).toBe(adminTur(k.tur).dizin + '/' + k.slug + '/');
    });
  });
});

/* ---------------- turetilen alanlar ---------------- */
describe('panel kendi hesabini yapmiyor', () => {
  it('fiyat sitenin kendi fonksiyonundan geliyor', () => {
    const bak = (turKey, kume, fn) => {
      Object.keys(kume).forEach(anahtar => {
        const satir = KAYITLAR.find(k => k.tur === turKey && k.anahtar === anahtar);
        expect(satir.fiyat, turKey + '/' + anahtar).toBe(fn(kume[anahtar]));
      });
    };
    bak('tur', TOURS, basePrice);
    bak('otel', HOTELS, hotelNightlyFrom);
    bak('aktivite', ACTIVITIES, activityPriceFrom);
    bak('etkinlik', EVENTS, eventPriceFrom);
    bak('mekan', PLACES, venuePriceFrom);
  });

  it('otel puani 10, digerleri 5 uzerinden -- sitedeki gosterimin aynisi', () => {
    const otel = KAYITLAR.find(k => k.tur === 'otel');
    expect(otel.puanOlcek).toBe(10);
    expect(otel.puan).toBe(hotelScore(HOTELS[otel.anahtar].ratingBreakdown));

    const tur = KAYITLAR.find(k => k.tur === 'tur');
    expect(tur.puanOlcek).toBe(5);
    expect(tur.puan).toBe(ratingSummary(TOURS[tur.anahtar].ratingBreakdown).average);
  });

  it('siralama her turde ayni olcekle yapiliyor', () => {
    /* 9,2 ile 4,6 ayni sutunda yan yana siralanamaz; puan5 bu yuzden
       ayrica tutuluyor. */
    KAYITLAR.forEach(k => {
      expect(k.puan5).toBe(ratingSummary(k.ham.ratingBreakdown).average);
      expect(k.puan5).toBeLessThanOrEqual(5);
    });
  });

  it('kart onizlemesi anasayfadaki kartin kendisi', () => {
    const otel = KAYITLAR.find(k => k.tur === 'otel');
    expect(otel.kart).toEqual(hotelCatalogCard(HOTELS[otel.anahtar], BUGUN));
    const tur = KAYITLAR.find(k => k.tur === 'tur');
    expect(tur.kart).toEqual(tourCatalogCard(TOURS[tur.anahtar], BUGUN));
  });

  it('indirim yuzdesi tek yerden', () => {
    expect(adminIndirim(800, 1000)).toBe(20);
    expect(adminIndirim(1000, 1000)).toBe(0);   /* indirim yok */
    expect(adminIndirim(1200, 1000)).toBe(0);   /* liste daha ucuz: indirim degil */
    expect(adminIndirim(0, 1000)).toBe(0);
    KAYITLAR.forEach(k => expect(k.indirim).toBe(adminIndirim(k.fiyat, k.listeFiyat)));
  });
});

/* ---------------- istatistik ---------------- */
describe('istatistik', () => {
  it('ortalama puan AGIRLIKLI', () => {
    /* 4 yorumlu bir kayit ile 900 yorumlu bir kayit esit agirlikta
       sayilsaydi site ortalamasi gercegi anlatmazdi. */
    const ist = adminIstatistik(KAYITLAR);
    const toplamYorum = KAYITLAR.reduce((t, k) => t + k.yorumSayisi, 0);
    const agirlikli = KAYITLAR.reduce((t, k) => t + k.puan5 * k.yorumSayisi, 0);
    expect(ist.ortalamaPuan).toBe(Math.round((agirlikli / toplamYorum) * 10) / 10);
    expect(ist.yorumToplam).toBe(toplamYorum);
  });

  it('tur sayilari kayitlarla ayni', () => {
    const ist = adminIstatistik(KAYITLAR);
    ist.turBazinda.forEach(t => {
      expect(t.adet).toBe(KAYITLAR.filter(k => k.tur === t.key).length);
    });
    expect(ist.turBazinda.reduce((t, x) => t + x.adet, 0)).toBe(ist.toplam);
  });

  it('bos listede bolme hatasi yok', () => {
    const ist = adminIstatistik([]);
    expect(ist.ortalamaPuan).toBe(0);
    expect(ist.ortalamaFiyat).toBe(0);
    expect(ist.enDusukFiyat).toBe(0);
  });
});

/* ---------------- denetim ---------------- */
describe('denetim saglam veride susuyor', () => {
  it('yayindaki veride tek bir hata yok', () => {
    const bulgular = adminDenetim(KAYITLAR, DENETIM_SECENEK);
    const hatalar = bulgular.filter(b => b.seviye === 'hata');
    expect(hatalar.map(h => h.tur + '/' + h.slug + ' ' + h.alan + ': ' + h.mesaj)).toEqual([]);
  });

  it('saglik yuzdesi hatasiz kayit orani', () => {
    const bulgular = adminDenetim(KAYITLAR, DENETIM_SECENEK);
    expect(adminDenetimOzeti(KAYITLAR, bulgular).saglik).toBe(100);
  });

  it('uyarilar listeyi bogmuyor', () => {
    /* Denetimin ise yaramasi az ve ayirt edici bulgu vermesine bagli.
       Ilk surum her paragrafi ayri uyari yaziyordu: yedi kaydin yirmi
       bir paragrafi da ayni konudandi ve liste tek bir konudan ibaret
       hale geliyordu. */
    const bulgular = adminDenetim(KAYITLAR, DENETIM_SECENEK);
    expect(bulgular.length).toBeLessThan(KAYITLAR.length * 3);
  });
});

/* Denetim kurallarini tek tek olcmek icin: gercek bir kaydin kopyasini
   bozup panelin ne dedigine bakiyoruz. Kopya uzerinde calisiliyor,
   yayindaki kayit degismiyor. */
function bozukKayit(degistir) {
  const ham = adminKopya(HOTELS['kordon-butik-otel']);
  degistir(ham);
  return adminKayitSatiri(adminTur('otel'), ham.slug, ham, BUGUN);
}
function bulgular(kayit, ek) {
  return adminDenetim([kayit], Object.assign({}, DENETIM_SECENEK, ek || {}));
}
function hataVar(kayit, alan, ek) {
  return bulgular(kayit, ek).some(b => b.seviye === 'hata' && b.alan === alan);
}

describe('denetim gercek bozukluklari yakaliyor', () => {
  it('kayit anahtari ile slug ayrisinca', () => {
    const ham = adminKopya(HOTELS['kordon-butik-otel']);
    ham.slug = 'baska-slug';
    const kayit = adminKayitSatiri(adminTur('otel'), 'kordon-butik-otel', ham, BUGUN);
    expect(hataVar(kayit, 'slug')).toBe(true);
  });

  it('zorunlu alan bosalinca', () => {
    expect(hataVar(bozukKayit(h => { h.title = ''; }), 'title')).toBe(true);
    expect(hataVar(bozukKayit(h => { h.code = ''; }), 'code')).toBe(true);
    expect(hataVar(bozukKayit(h => { h.area = ''; }), 'area')).toBe(true);
  });

  it('kart gorseli cardImages listesinde yoksa', () => {
    /* Kayitsiz anahtar sitede alakasiz bir yedek fotografa duser;
       tests/icerik.test.js ayni kurali anasayfa icin koruyor. */
    const kayit = bozukKayit(h => { h.card.img = 'boyleBirAnahtarYok'; });
    expect(hataVar(kayit, 'card.img')).toBe(true);
  });

  it('kart gorseli hic yazilmamissa', () => {
    expect(hataVar(bozukKayit(h => { h.card.img = ''; }), 'card.img')).toBe(true);
  });

  it('galeri anahtari gorsel sozlugunde yoksa', () => {
    const kayit = bozukKayit(h => { h.gallery[0].key = 'olmayanAnahtar'; });
    expect(hataVar(kayit, 'gallery[0]')).toBe(true);
  });

  it('tanimsiz ikon kullanilinca', () => {
    const kayit = bozukKayit(h => { h.badges[0].icon = 'boyleIkonYok'; });
    expect(hataVar(kayit, 'badges[0]')).toBe(true);
  });

  it('fiyat sifira duserse', () => {
    const kayit = bozukKayit(h => { h.rooms.forEach(o => { o.nightly = 0; }); });
    expect(hataVar(kayit, 'pricing')).toBe(true);
  });

  it('liste fiyati satis fiyatinin altina inerse', () => {
    /* Ustu cizili fiyatin daha ucuz gorunmesi kartta acik bir celiski. */
    const kayit = bozukKayit(h => { h.rooms[0].nightlyList = h.rooms[0].nightly - 500; });
    expect(hataVar(kayit, 'pricing')).toBe(true);
  });

  it('ayni urun kodu iki kayitta', () => {
    const a = adminKayitSatiri(adminTur('otel'), 'kordon-butik-otel',
      adminKopya(HOTELS['kordon-butik-otel']), BUGUN);
    const ikinci = adminKopya(HOTELS['kordon-butik-otel']);
    ikinci.slug = 'ikinci-otel';
    const b = adminKayitSatiri(adminTur('otel'), 'ikinci-otel', ikinci, BUGUN);
    const bulgu = adminDenetim([a, b], DENETIM_SECENEK).filter(x => x.alan === 'code');
    expect(bulgu.length).toBe(2);
  });

  it('icerik sayfasi acilmiyorsa', () => {
    const kayit = KAYITLAR[0];
    expect(hataVar(kayit, 'sayfa', { sayfalar: new Set() })).toBe(true);
  });

  it('sayfa kumesi verilmezse bag kurali ATLANIYOR', () => {
    /* Eksik bilgiyle "sayfa yok" demek, olmayan bir hatayi bildirmekten
       kotudur: panel cevrimdisiyken yedi kaydin yedisini de kirik
       gosterirdi. */
    const kayit = KAYITLAR[0];
    expect(hataVar(kayit, 'sayfa', { sayfalar: null })).toBe(false);
  });

  it('kart gorsel kumesi verilmezse o kural da atlaniyor', () => {
    const kayit = bozukKayit(h => { h.card.img = 'boyleBirAnahtarYok'; });
    expect(hataVar(kayit, 'card.img', { kartGorselleri: null })).toBe(false);
  });

  it('ikon taramasi ikon olmayan alanlari toplamiyor', () => {
    /* Kaydin her yerinde `icon` anahtari aramak, gorsel anahtarlarini da
       ikon sanip yanlis hata uretirdi. */
    const adlar = adminIkonKullanimlari(HOTELS['kordon-butik-otel']).map(x => x.ad);
    expect(adlar.length).toBeGreaterThan(5);
    adlar.forEach(ad => expect(TOUR_ICONS[ad], ad + ' TOUR_ICONS icinde yok').toBeTruthy());
  });
});

/* ---------------- arama ve suzme ---------------- */
describe('arama ve suzme', () => {
  it('Turkce buyuk/kucuk harf ayrimi aramayi bozmuyor', () => {
    /* toLowerCase() tek basina 'I' harfini yanlis kuculturur ve "İZMİR"
       aramasini bos dondururdu. */
    const a = adminSuz(KAYITLAR, { q: 'İzmir' }).map(k => k.slug);
    const b = adminSuz(KAYITLAR, { q: 'izmir' }).map(k => k.slug);
    const c = adminSuz(KAYITLAR, { q: 'İZMİR' }).map(k => k.slug);
    expect(a.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it('slug, kod ve etiketten de buluyor', () => {
    const kayit = KAYITLAR[0];
    expect(adminSuz(KAYITLAR, { q: kayit.kod }).map(k => k.slug)).toContain(kayit.slug);
    expect(adminSuz(KAYITLAR, { q: kayit.slug }).map(k => k.slug)).toContain(kayit.slug);
    if (kayit.etiketler.length) {
      expect(adminSuz(KAYITLAR, { q: kayit.etiketler[0] }).map(k => k.slug)).toContain(kayit.slug);
    }
  });

  it('tur suzgeci yalnizca o turu birakiyor', () => {
    const liste = adminSuz(KAYITLAR, { tur: 'otel' });
    expect(liste.length).toBe(Object.keys(HOTELS).length);
    liste.forEach(k => expect(k.tur).toBe('otel'));
  });

  it('bos arama hicbir kaydi elemiyor', () => {
    expect(adminSuz(KAYITLAR, { q: '' }).length).toBe(KAYITLAR.length);
    expect(adminSuz(KAYITLAR, {}).length).toBe(KAYITLAR.length);
  });

  it('siralama yonu tersine cevrilebiliyor', () => {
    const artan = adminSuz(KAYITLAR, { sirala: 'fiyat' }).map(k => k.fiyat);
    const azalan = adminSuz(KAYITLAR, { sirala: 'fiyat', yon: 'azalan' }).map(k => k.fiyat);
    expect(artan).toEqual([...artan].sort((a, b) => a - b));
    expect(azalan).toEqual([...artan].reverse());
  });

  it('bolge listesi tekrarsiz ve sirali', () => {
    const bolgeler = adminBolgeler(KAYITLAR);
    expect(new Set(bolgeler).size).toBe(bolgeler.length);
    expect(bolgeler).toEqual([...bolgeler].sort((a, b) => a.localeCompare(b, 'tr')));
  });
});

/* ---------------- taslak ---------------- */
describe('taslak yayindaki kayda dokunmuyor', () => {
  it('taslak uygulamak orijinali DEGISTIRMIYOR', () => {
    const otel = HOTELS['kordon-butik-otel'];
    const once = JSON.stringify(otel);
    const yeni = adminTaslakUygula(otel, { title: 'Baska Ad', 'pricing.taxRate': 0.05 });
    expect(JSON.stringify(otel)).toBe(once);
    expect(yeni.title).toBe('Baska Ad');
    expect(yeni.pricing.taxRate).toBe(0.05);
    /* Dokunulmayan alanlar oldugu gibi duruyor. */
    expect(yeni.rooms).toEqual(otel.rooms);
  });

  it('taslak yalnizca DEGISEN yollari tutuyor', () => {
    /* Taslak kaydin kopyasi olsaydi, veri dosyasinda sonradan yapilan
       bir duzeltme taslak acikken kaybolurdu. */
    const otel = HOTELS['kordon-butik-otel'];
    const temiz = adminTaslakTemizle(otel, { title: otel.title, area: 'Yeni Konum' });
    expect(Object.keys(temiz)).toEqual(['area']);
  });

  it('degeri geri alinca fark kayboluyor', () => {
    const otel = HOTELS['kordon-butik-otel'];
    expect(adminFark(otel, { title: otel.title })).toEqual([]);
    expect(adminFark(otel, { title: otel.title + '!' }).length).toBe(1);
  });

  it('dizi alani butunuyle tutuluyor', () => {
    const otel = HOTELS['kordon-butik-otel'];
    const yeniSSS = adminKopya(otel.faq);
    yeniSSS[0].a = 'Yeni cevap.';
    const yeni = adminTaslakUygula(otel, { faq: yeniSSS });
    expect(yeni.faq[0].a).toBe('Yeni cevap.');
    expect(yeni.faq.length).toBe(otel.faq.length);
    expect(otel.faq[0].a).not.toBe('Yeni cevap.');
  });

  it('nokta yolu olmayan dali kurup yaziyor', () => {
    const nesne = {};
    adminYaz(nesne, 'card.img', 'efes');
    expect(nesne).toEqual({ card: { img: 'efes' } });
    expect(adminOku(nesne, 'card.img')).toBe('efes');
    expect(adminOku(nesne, 'card.yok.derin')).toBeUndefined();
  });
});

/* ---------------- disa aktarma ---------------- */
describe('disa aktarilan blok veri dosyasina yapistirilabilir', () => {
  it('uretilen blok geri okununca ayni kaydi veriyor', () => {
    const otel = adminTaslakUygula(HOTELS['kordon-butik-otel'], { title: 'Yeni Ad' });
    const kod = adminJsKaynak('kordon-butik-otel', otel);
    /* Blok bir nesne govdesinin ICINE yapistirilmak uzere uretiliyor:
       sondaki virguluyle birlikte gecerli olmali. */
    const geri = eval('({' + kod + '})');
    expect(geri['kordon-butik-otel']).toEqual(otel);
  });

  it('tek tirnak iceren metin kacisliyor', () => {
    /* Kacislanmasaydi uretilen blok soz dizimi hatasi verirdi ve bu,
       panelin en kolay gozden kacan hatasi olurdu. */
    const kod = adminJsDeger({ not: "Kordon'a 120 m" }, 0);
    expect(kod).toContain("\\'");
    expect(eval('(' + kod + ')')).toEqual({ not: "Kordon'a 120 m" });
  });

  it('ters bolu de kacisliyor', () => {
    const kod = adminJsDeger({ yol: 'a\\b' }, 0);
    expect(eval('(' + kod + ')')).toEqual({ yol: 'a\\b' });
  });

  it('sayisal ve tireli anahtarlar tirnaklaniyor', () => {
    /* ratingBreakdown'in '5' anahtari ve slug benzeri anahtarlar
       tirnaksiz gecerli degil. */
    expect(adminJsAnahtar('5')).toBe("'5'");
    expect(adminJsAnahtar('kordon-butik-otel')).toBe("'kordon-butik-otel'");
    expect(adminJsAnahtar('title')).toBe('title');
    const kod = adminJsDeger({ 1: 4, 5: 128 }, 0);
    expect(eval('(' + kod + ')')).toEqual({ 1: 4, 5: 128 });
  });

  it('bos dizi ve bos nesne tek satir', () => {
    expect(adminJsDeger([], 0)).toBe('[]');
    expect(adminJsDeger({}, 0)).toBe('{}');
  });

  it('veri dosyasinin girinti bicimine uyuyor', () => {
    /* Kayitlar dosyada iki bosluk girintiyle basliyor. */
    const kod = adminJsKaynak('kordon-butik-otel', HOTELS['kordon-butik-otel']);
    expect(kod.startsWith("  'kordon-butik-otel': {")).toBe(true);
    expect(kod.endsWith('},')).toBe(true);
    expect(kod).toContain("\n    slug: 'kordon-butik-otel',");
  });

  it('butun kayitlar sorunsuz aktariliyor', () => {
    KAYITLAR.forEach(k => {
      const geri = eval('({' + adminJsKaynak(k.anahtar, k.ham) + '})');
      expect(geri[k.anahtar], k.tur + '/' + k.slug).toEqual(k.ham);
    });
  });
});

/* ---------------- duzenlenebilir alan semasi ---------------- */
describe('form semasi gercek alanlari gosteriyor', () => {
  it('her sema yolunun kayitta karsiligi var', () => {
    /* Olu bir sema satiri formda sonsuza kadar bos bir kutu cizer ve
       doldurulunca kayda ALAKASIZ bir alan ekler. */
    ADMIN_TURLER.forEach(t => {
      const kayitlar = KAYITLAR.filter(k => k.tur === t.key);
      adminAlanlar(t.key).forEach(a => {
        const varMi = kayitlar.some(k => adminOku(k.ham, a.yol) !== undefined);
        expect(varMi, t.key + ' icin olu sema yolu: ' + a.yol).toBe(true);
      });
    });
  });

  it('her alan tanimli bir sekmeye ait', () => {
    const gruplar = new Set(ADMIN_GRUPLAR.map(g => g.key));
    ADMIN_TURLER.forEach(t => {
      adminAlanlar(t.key).forEach(a => {
        expect(gruplar.has(a.grup), a.yol + ' bilinmeyen sekmede: ' + a.grup).toBe(true);
      });
    });
  });

  it('ayni yol iki kez tanimlanmiyor', () => {
    ADMIN_TURLER.forEach(t => {
      const yollar = adminAlanlar(t.key).map(a => a.yol);
      expect(new Set(yollar).size, t.key + ' icinde tekrar eden yol').toBe(yollar.length);
    });
  });

  it('fiyat tablosu her kayitta dolu geliyor', () => {
    KAYITLAR.forEach(k => {
      const tablo = adminTur(k.tur).fiyatTablosu(k.ham);
      if (tablo.tip === 'duz') {
        tablo.alanlar.forEach(a =>
          expect(adminOku(k.ham, a.yol), k.slug + ' · ' + a.yol).not.toBeUndefined());
      } else {
        const liste = adminOku(k.ham, tablo.yol);
        expect(Array.isArray(liste) && liste.length, k.slug + ' · ' + tablo.yol).toBeTruthy();
        tablo.alanlar.forEach(a =>
          expect(liste.some(s => s[a.ad] !== undefined),
            k.slug + ' · ' + tablo.yol + '.' + a.ad).toBe(true));
      }
    });
  });

  it('slug ve tur formda DEGISTIRILEMEZ', () => {
    /* Slug'i formdan degistirmek kayit anahtari ile sayfa dizinini
       ayristirir ve karti olu baga gonderir. */
    ADMIN_TURLER.forEach(t => {
      const yollar = adminAlanlar(t.key).map(a => a.yol);
      expect(yollar).not.toContain('slug');
      expect(yollar).not.toContain('type');
    });
  });
});

/* ---------------- medya ---------------- */
describe('medya', () => {
  it('her turun gorsel sozlugu listeleniyor', () => {
    const medya = adminMedya(KAYITLAR);
    ADMIN_TURLER.forEach(t => {
      const sozluk = t.gorseller();
      const sayi = medya.filter(m => m.tur === t.key).length;
      expect(sayi, t.key).toBe(Object.keys(sozluk).length);
    });
  });

  it('kullanim yerleri gercek kayitlara isaret ediyor', () => {
    const sluglar = new Set(KAYITLAR.map(k => k.slug));
    adminMedya(KAYITLAR).forEach(m => {
      m.kullanim.forEach(yer => {
        expect(sluglar.has(yer.split(' · ')[0]), yer).toBe(true);
      });
    });
  });
});

/* ---------------- yardimcilar ---------------- */
describe('yardimcilar', () => {
  it('kelime sayisi bos ve coklu boslukla bas ediyor', () => {
    expect(adminKelimeSayisi('')).toBe(0);
    expect(adminKelimeSayisi('   ')).toBe(0);
    expect(adminKelimeSayisi('bir  iki\n uc')).toBe(3);
    expect(adminKelimeSayisi(null)).toBe(0);
  });
});

/* ---------------- panel sayfasi ---------------- */
describe('panel sayfasi', () => {
  const sayfa = oku('admin/index.html');

  it('arama motorlarina kapali', () => {
    expect(sayfa).toMatch(/<meta name="robots" content="noindex/);
  });

  it('veri dosyalari sitedeki SIRAYLA yukleniyor', () => {
    /* tour-data.js once gelmek zorunda: digerleri onun yardimcilarini
       genel kapsamdan okuyor (bkz. hotel-data.js basindaki not). */
    const sira = ['tour-data.js', 'hotel-data.js', 'activity-data.js', 'event-data.js',
      'venue-data.js', 'catalog.js', 'admin-data.js', 'admin-page.js']
      .map(ad => sayfa.indexOf('assets/js/' + ad));
    sira.forEach((yer, i) => expect(yer, sira[i] + ' yuklenmiyor').toBeGreaterThan(-1));
    expect(sira).toEqual([...sira].sort((a, b) => a - b));
  });

  it('app.js CALISTIRILMIYOR', () => {
    /* app.js anasayfayi kuran yuzlerce satir DOM isi yapiyor; panelde
       calistirilmasi anlamsiz ve kirilgan. Kart gorselleri oradan METIN
       olarak okunuyor. */
    expect(sayfa).not.toMatch(/<script src="[^"]*assets\/js\/app\.js"/);
    expect(oku('assets/js/admin-page.js')).toContain("fetch('../assets/js/app.js')");
  });

  it('panel sitenin menusunden baglanmiyor', () => {
    /* Yonetim paneli ziyaretciye gosterilen bir sayfa degil. */
    expect(oku('index.html')).not.toContain('admin/');
  });

  it('kilidin gercek koruma olmadigi sayfada YAZIYOR', () => {
    /* Gizlemek, olmayan bir guvenlige guvenilmesine yol acardi. */
    expect(sayfa).toMatch(/Bu kilit tarayıcıda çalışır/);
  });

  it('panelin kendi stili var, site kabugunu yuklemiyor', () => {
    expect(sayfa).toContain('assets/css/admin.css');
    expect(sayfa).not.toContain('assets/css/style.css');
  });
});
