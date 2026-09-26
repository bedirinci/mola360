/* Veri kapısı (MolaVeri) testleri.

   Kapı ekranların veriye ulaştığı TEK yer; backend geldiğinde içi
   değişecek, dışı değişmeyecek. Buradaki testler kapının dışını
   ölçüyor:

   1) Kayıtlar kapıdan eksiksiz geliyor, yayında olmayan gelmiyor.
   2) Türetilmiş görüntü alanları (region, category*) sınıflandırmayla
      ayrışamıyor.
   3) Sayfa kabuklarındaki SEO başlığı kayıttaki seo alanıyla aynı; fiyat
      değişince açıklama da değişiyor.
   4) Liste sayfaları, temalar ve koleksiyonlar doğru ürünleri topluyor.
   5) Kontenjan cevabı sözleşmedeki biçimde ve sayfanın takvimiyle aynı
      kuraldan üretiliyor; kalan yer uydurulmuyor, satılandan
      hesaplanıyor. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

/* Hepsi AYNI yoldan (require) yükleniyor: kapı veri dosyalarını require
   ile alıyor; test onları ESM import ile alsaydı vitest aynı dosyanın
   iki ayrı kopyasını üretir, testin değiştirdiği kayıt kapının gördüğü
   kayıt olmazdı. */
const require = createRequire(import.meta.url);
const {
  MolaVeri,
  KAPI_SITE_ADRESI,
  kapiFiyatMetni,
  kapiPansiyonlar,
  kapiKalkisSehirleri,
  musaitlikKaydi,
  konaklamaKalan,
  tarihDoluMu,
  kontenjanDurumu,
} = require('../assets/js/data-gateway.js');
const {
  TAXONOMY_TYPES,
  TAXONOMY_TOUR_KINDS,
  TAXONOMY_LISTINGS,
  taxonomyCategory,
  taxonomyCityRegion,
} = require('../assets/js/taxonomy-data.js');
const { SAMPLE_BOOKINGS, envanterBirimleri } = require('../assets/js/inventory-data.js');
const { SAMPLE_PRODUCTS } = require('../assets/js/sample-catalog-data.js');
const { TOURS, nextDepartureDates } = require('../assets/js/tour-data.js');
const { HOTELS } = require('../assets/js/hotel-data.js');
const { ACTIVITIES } = require('../assets/js/activity-data.js');
const { EVENTS } = require('../assets/js/event-data.js');
const { PLACES } = require('../assets/js/venue-data.js');

/* 21 Eylül 2026 bir pazartesi. Tarih üreten testler sabit bir günle
   çalışıyor; gerçek tarihle çalışan test, çalıştığı güne göre başka
   sonuç verir. */
const BUGUN = '2026-09-21';

const KUMELER = { tour: TOURS, hotel: HOTELS, activity: ACTIVITIES, event: EVENTS, venue: PLACES };
const URUNLER = Object.entries(KUMELER)
  .flatMap(([tip, kume]) => Object.values(kume).map(k => ({ tip, k })));
/* Beklenen listeler SAYFASI OLAN ürünler üzerinden yazılıyor: örnek özet
   kayıtlar (sample-catalog-data.js) aynı süzgeçten geçiyor ama sayıları
   anasayfanın örnek içeriği değiştikçe değişir. Örneklerin süzgeçte
   sayıldığı ayrıca ölçülüyor (aşağıda "örnek kayıtlar"). */
const slugs = (liste) => liste.filter(k => !k.sample).map(k => k.slug).sort();

describe('ürün okuma', () => {
  it('her kayıt kapıdan geliyor', () => {
    for (const { tip, k } of URUNLER) expect(MolaVeri.urun(tip, k.slug), tip + '/' + k.slug).toBe(k);
    const ornekSayisi = Object.values(SAMPLE_PRODUCTS).reduce((t, g) => t + Object.keys(g).length, 0);
    expect(MolaVeri.urunler()).toHaveLength(URUNLER.length + ornekSayisi);
    expect(slugs(MolaVeri.urunler('tour'))).toEqual(Object.keys(TOURS).sort());
  });

  it('adresten gelen slug büyük harf veya boşluk taşısa da çözülüyor', () => {
    expect(MolaVeri.urun('tour', '  Efes-Sirince ')).toBe(TOURS['efes-sirince']);
  });

  it('bilinmeyen kayıt null: başka bir ürüne düşmüyor', () => {
    /* Eski resolveTour bilinmeyen slug'ı varsayılan tura düşürüyordu;
       yanlış adreste başka bir ürün göstermek yanıltıcı. Kapı null
       döndürüyor, sayfa "bulunamadı" diyecek (2. adım). */
    expect(MolaVeri.urun('tour', 'yok-boyle-bir-tur')).toBeNull();
    expect(MolaVeri.urun('tour', 'kordon-butik-otel')).toBeNull();
    expect(MolaVeri.urun('bilinmeyen', 'efes-sirince')).toBeNull();
    expect(MolaVeri.urun('tour', '')).toBeNull();
  });

  it('yayında olmayan kayıt gelmiyor', () => {
    const k = TOURS['efes-sirince'];
    try {
      for (const durum of ['draft', 'unpublished', 'archived']) {
        k.status = durum;
        expect(MolaVeri.urun('tour', 'efes-sirince'), durum).toBeNull();
        expect(MolaVeri.urunler('tour'), durum).not.toContain(k);
      }
      k.status = 'published';
      expect(MolaVeri.urun('tour', 'efes-sirince')).toBe(k);
    } finally {
      delete k.status;
    }
  });

  it('içerik tipi kayıttan okunuyor (turda type tur tipini taşıyor)', () => {
    expect(MolaVeri.icerikTipi(TOURS['efes-sirince'])).toBe('tour');
    expect(MolaVeri.icerikTipi(TOURS['kapadokya-3-gece'])).toBe('tour');
    expect(MolaVeri.icerikTipi(HOTELS['kordon-butik-otel'])).toBe('hotel');
    expect(MolaVeri.icerikTipi(PLACES['kum-beach-club'])).toBe('venue');
    expect(MolaVeri.icerikTipi(null)).toBeNull();
  });
});

describe('görüntü alanları sınıflandırmanın türevi', () => {
  it('region şehrin bölgesi', () => {
    for (const { k } of URUNLER) {
      expect(k.region, k.slug).toBe(taxonomyCityRegion(k.taxonomy.city).name);
      expect(MolaVeri.bolge(k).name, k.slug).toBe(k.region);
    }
  });

  it('turda category* tur tipinin etiketleri', () => {
    for (const k of Object.values(TOURS)) {
      const tt = TAXONOMY_TOUR_KINDS[k.type];
      expect(tt, k.slug).toBeTruthy();
      expect(k.category, k.slug).toBe(tt.name);
      expect(k.categoryShort, k.slug).toBe(tt.nameShort);
      expect(k.categoryPlural, k.slug).toBe(tt.plural);
      expect(k.categoryAnchor, k.slug).toBe(tt.anchor);
    }
  });

  it('diğer tiplerde rozet ana kategoriden, çoğul ad ve çapa tipten', () => {
    for (const { tip, k } of URUNLER.filter(x => x.tip !== 'tour')) {
      const ana = taxonomyCategory(tip, k.taxonomy.categories[0]);
      expect(k.categoryShort, k.slug).toBe(ana.nameShort);
      expect(k.categoryPlural, k.slug).toBe(TAXONOMY_TYPES[tip].plural);
      expect(k.categoryAnchor, k.slug).toBe(TAXONOMY_TYPES[tip].anchor);
    }
  });
});

/* ---------------- SEO ----------------
   Ürün sayfalarının HTML kabuğu (tur/<slug>/index.html vb.) sunucu gelene
   kadar duruyor: WhatsApp ve sosyal medya önizlemesi başlığı oradan
   okuyor. Kabuktaki başlık ile kaydın seo alanı ayrışırsa iki kaynak
   olur; bu test ayrışmayı yakalıyor. */
describe('SEO', () => {
  const coz = (m) => String(m)
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const kabuk = (tip, slug) =>
    readFileSync(new URL('../' + TAXONOMY_TYPES[tip].path + '/' + slug + '/index.html', import.meta.url), 'utf8');
  const meta = (html, desen) => {
    const m = html.match(desen);
    return m ? coz(m[1]) : null;
  };

  it('kabuktaki başlık, açıklama ve paylaşım bilgisi kayıttan türetilenle aynı', () => {
    for (const { tip, k } of URUNLER) {
      const html = kabuk(tip, k.slug);
      const seo = MolaVeri.seo(tip, k);
      expect(meta(html, /<title>([^<]*)<\/title>/), k.slug + ' title').toBe(seo.title);
      expect(meta(html, /<meta name="description" content="([^"]*)"/), k.slug + ' description').toBe(seo.description);
      expect(meta(html, /<link rel="canonical" href="([^"]*)"/), k.slug + ' canonical').toBe(seo.canonical);
      expect(meta(html, /<meta property="og:title" content="([^"]*)"/), k.slug + ' og:title').toBe(seo.ogTitle);
      expect(meta(html, /<meta property="og:description" content="([^"]*)"/), k.slug + ' og:description').toBe(seo.ogDescription);
      expect(meta(html, /<meta property="og:url" content="([^"]*)"/), k.slug + ' og:url').toBe(seo.canonical);
      expect(meta(html, /<meta property="og:image" content="([^"]*)"/), k.slug + ' og:image').toBe(seo.ogImage);
    }
  });

  it('açıklamadaki fiyat güncel fiyattan: fiyat değişince açıklama eskimiyor', () => {
    const otel = HOTELS['kordon-butik-otel'];
    const oda = otel.rooms.reduce((a, b) => (b.nightly < a.nightly ? b : a));
    const eski = oda.nightly;
    try {
      oda.nightly = 2250;
      expect(MolaVeri.seo('hotel', otel).description).toContain('gecelik 2.250 TL\'den');
    } finally {
      oda.nightly = eski;
    }
    expect(MolaVeri.seo('hotel', otel).description).not.toContain('{fiyat}');
  });

  it('kanonik adres tip yolu ve slug\'dan', () => {
    expect(MolaVeri.seo('tour', TOURS['efes-sirince']).canonical).toBe(KAPI_SITE_ADRESI + 'tur/efes-sirince/');
    expect(MolaVeri.seo('venue', PLACES['kum-beach-club']).path).toBe('mekan/kum-beach-club/');
  });

  it('fiyat metni para birimine göre', () => {
    expect(kapiFiyatMetni(1950, 'TRY')).toBe('1.950 TL');
    expect(kapiFiyatMetni(420)).toBe('420 TL');
    expect(kapiFiyatMetni(1290, 'EUR')).toBe('€1.290');
    expect(kapiFiyatMetni(99, 'USD')).toBe('$99');
  });
});

describe('liste sayfaları, temalar ve koleksiyonlar', () => {
  const listeSlug = (base, slug) => {
    const c = MolaVeri.listeSayfasi(base, slug);
    return slugs(MolaVeri.listele(c.filter, BUGUN));
  };

  it('adres kategoriye veya liste sayfasına çözülüyor', () => {
    expect(MolaVeri.listeSayfasi('turlar', 'otobuslu-turlar').kind).toBe('listing');
    expect(MolaVeri.listeSayfasi('turlar', 'kapadokya-turlari').kind).toBe('category');
    expect(MolaVeri.listeSayfasi('turlar', 'yok')).toBeNull();
    expect(MolaVeri.listeSayfasi('oteller', 'kapadokya-turlari')).toBeNull();
  });

  it('tur tipi liste sayfaları', () => {
    expect(listeSlug('turlar', 'gunubirlik-turlar')).toEqual(['efes-sirince']);
    expect(listeSlug('turlar', 'konaklamali-turlar')).toEqual(['kapadokya-3-gece']);
    expect(listeSlug('turlar', 'ucakli-turlar')).toEqual(['kapadokya-3-gece']);
  });

  it('hafta sonu turu: cuma-pazar kalkışlı ve en fazla 2 gece', () => {
    /* Efes cumartesi ve pazar kalkıyor; Kapadokya pazartesi/perşembe ve 3 gece. */
    expect(listeSlug('turlar', 'hafta-sonu-turlari')).toEqual(['efes-sirince']);
  });

  it('üst kategori alt kategorilerin ürünlerini topluyor', () => {
    expect(listeSlug('turlar', 'yurt-ici-turlar')).toEqual(['efes-sirince', 'kapadokya-3-gece']);
    expect(listeSlug('turlar', 'ege-turlari')).toEqual(['efes-sirince']);
    expect(listeSlug('turlar', 'yurt-disi-turlar')).toEqual([]);
  });

  it('otel liste sayfaları: kategori, destinasyon, koleksiyon, pansiyon', () => {
    expect(listeSlug('oteller', 'butik-oteller')).toEqual(['kordon-butik-otel']);
    expect(listeSlug('oteller', 'yurt-ici-oteller')).toEqual(['kordon-butik-otel']);
    expect(listeSlug('oteller', 'kibris-otelleri')).toEqual([]);
    expect(listeSlug('oteller', 'balayi-otelleri')).toEqual(['kordon-butik-otel']);
    /* Kordon'un pansiyonları BB ve HB: her şey dahil değil. */
    expect(kapiPansiyonlar(HOTELS['kordon-butik-otel'])).toEqual(['oda-kahvalti', 'yarim-pansiyon']);
    expect(listeSlug('oteller', 'her-sey-dahil-oteller')).toEqual([]);
  });

  it('indirimli ürünler liste fiyatının altında satılanlar', () => {
    for (const k of MolaVeri.listele({ discounted: true }, BUGUN)) {
      const o = MolaVeri.ozet(k, BUGUN);
      expect(o.listPrice, k.slug).toBeGreaterThan(o.price);
    }
    expect(listeSlug('firsatlar', 'indirimli-turlar')).toEqual(['efes-sirince', 'kapadokya-3-gece']);
  });

  it('tema tipler arası topluyor', () => {
    expect(slugs(MolaVeri.temaUrunleri('kultur-tarih', BUGUN)))
      .toEqual(['aspendos-opera-bale-festivali', 'efes-sirince', 'kapadokya-3-gece']);
  });

  it('elle koleksiyon kayıttaki listeden', () => {
    expect(slugs(MolaVeri.koleksiyonUrunleri('ailece', BUGUN))).toEqual(['efes-sirince', 'kapadokya-3-gece']);
  });

  it('kurala göre koleksiyon kuraldan: gece sayısı', () => {
    expect(slugs(MolaVeri.koleksiyonUrunleri('uzun-hafta-sonu', BUGUN))).toEqual(['kapadokya-3-gece']);
  });

  it('kurala göre koleksiyon kuraldan: fiyat değişince ürün girip çıkıyor', () => {
    const efes = TOURS['efes-sirince'];
    const eski = efes.pricing.adult;
    try {
      expect(MolaVeri.koleksiyonUrunleri('butce-dostu', BUGUN)).not.toContain(efes);
      efes.pricing.adult = 450;
      expect(MolaVeri.koleksiyonUrunleri('butce-dostu', BUGUN)).toContain(efes);
    } finally {
      efes.pricing.adult = eski;
    }
  });

  it('son dakika yalnızca sabit tarihli ürünler ve 7 gün içinde', () => {
    /* 21 Eylül'de Efes 22'sinde, Kapadokya 24'ünde kalkıyor, Aspendos'un
       ilk temsili 26'sında. Otel ve aktivite her gün satıldığı için
       kapsam dışı. */
    expect(slugs(MolaVeri.koleksiyonUrunleri('son-dakika', BUGUN)))
      .toEqual(['aspendos-opera-bale-festivali', 'efes-sirince', 'kapadokya-3-gece']);
    /* Sezonun son temsili 31 Ekim: kasımda Aspendos son dakika değil. */
    expect(slugs(MolaVeri.koleksiyonUrunleri('son-dakika', '2026-11-02')))
      .not.toContain('aspendos-opera-bale-festivali');
  });

  it('kalkış şehirleri tek kaynaktan', () => {
    expect(kapiKalkisSehirleri(TOURS['kapadokya-3-gece'])).toEqual(['istanbul', 'izmir', 'ankara']);
    expect(kapiKalkisSehirleri(TOURS['efes-sirince'])).toEqual(['izmir']);
  });

  it('her liste sayfasının filtresi çalışıyor (hata atmıyor)', () => {
    for (const l of TAXONOMY_LISTINGS) {
      expect(() => MolaVeri.listele(l.filter, BUGUN), l.slug).not.toThrow();
    }
  });
});

describe('örnek kayıtlar', () => {
  const ORNEKLER = Object.entries(SAMPLE_PRODUCTS)
    .flatMap(([tip, g]) => Object.values(g).map(k => ({ tip, k })));

  it('kapıdan geliyor ve örnek olarak işaretli', () => {
    for (const { tip, k } of ORNEKLER) {
      expect(MolaVeri.urun(tip, k.slug), k.slug).toBe(k);
      expect(k.sample, k.slug).toBe(true);
      expect(MolaVeri.icerikTipi(k), k.slug).toBe(tip);
    }
  });

  it('sayfası olan kayıtla aynı slug\'ı taşımıyor', () => {
    for (const { tip, k } of ORNEKLER) {
      expect(KUMELER[tip][k.slug], k.slug + ' iki kez tanımlı').toBeUndefined();
    }
  });

  it('süzgeçlerde sayfası olan ürünlerle birlikte sayılıyor', () => {
    const hepsi = MolaVeri.listele({ theme: 'kis-sporlari' }, BUGUN).map(k => k.slug).sort();
    expect(hepsi).toEqual(['erciyes-kayak-haftasi', 'uludag-kayak-dersi', 'uludag-kayak-paketi']);
    expect(MolaVeri.koleksiyonUrunleri('butce-dostu', BUGUN).map(k => k.slug).sort())
      /* Aspendos'un en ucuz bileti 420 TL: sayfası olan ürün de kurala
         göre koleksiyona kendiliğinden giriyor. */
      .toEqual(['alacati-pazar-turu', 'aspendos-opera-bale-festivali', 'iznik-golu-antik-kent',
        'istanbul-gece-yarisi-kosusu', 'istanbul-kahve-festivali', 'kordon-caz-aksamlari',
        'stand-up-gecesi'].sort());
  });

  it('yurt dışı örnek tur döviz fiyatlı ve TL eşiğine takılmıyor', () => {
    const ege = SAMPLE_PRODUCTS.tour['ege-adalari-balayi'];
    expect(ege.currency).toBe('EUR');
    expect(MolaVeri.bolge(ege).abroad).toBe(true);
    /* 149 EUR, 500 TL sınırlı "Bütçe Dostu"na para birimi farklı olduğu
       için girmiyor (kur çevrimi 4. adımda). */
    expect(MolaVeri.koleksiyonUrunleri('butce-dostu', BUGUN)).not.toContain(ege);
  });
});

describe('kontenjan', () => {
  const aralik = (bit) => ({ today: BUGUN, from: BUGUN, to: bit });

  it('Promise döndürüyor; bilinmeyen ürün null', async () => {
    const soz = MolaVeri.musaitlik('tour', 'efes-sirince', aralik('2026-10-31'));
    expect(soz).toBeInstanceOf(Promise);
    expect(await MolaVeri.musaitlik('tour', 'yok', aralik('2026-10-31'))).toBeNull();
  });

  it('cevap sözleşmedeki biçimde', async () => {
    const m = await MolaVeri.musaitlik('tour', 'efes-sirince', aralik('2026-10-31'));
    expect(m).toMatchObject({ type: 'tour', slug: 'efes-sirince', from: BUGUN, to: '2026-10-31' });
    expect(m.items.length).toBeGreaterThan(0);
    for (const r of m.items) {
      expect(Object.keys(r).sort()).toEqual(['capacity', 'date', 'item', 'remaining', 'status', 'time']);
      expect(r.remaining).toBeGreaterThanOrEqual(0);
      expect(r.remaining).toBeLessThanOrEqual(r.capacity);
    }
  });

  it('tur takvimi sayfanın takvimiyle aynı kuraldan', async () => {
    const efes = TOURS['efes-sirince'];
    const m = await MolaVeri.musaitlik('tour', 'efes-sirince', aralik('2026-10-31'));
    const sayfa = nextDepartureDates(BUGUN, efes.pricing.departureDays, 60, efes.pricing.leadDays)
      .filter(g => g <= '2026-10-31');
    expect(m.items.map(r => r.date)).toEqual(sayfa);
    expect(m.items.every(r => r.capacity === efes.pricing.seatsPerDeparture)).toBe(true);
  });

  it('kalan yer satılandan hesaplanıyor', async () => {
    /* Örnek rezervasyonlar: ilk kalkışta 12 kişi, ikincide 16 (dolu). */
    const m = await MolaVeri.musaitlik('tour', 'efes-sirince', aralik('2026-10-31'));
    expect(m.items[0].remaining).toBe(16 - 12);
    expect(m.items[1].remaining).toBe(0);
    expect(m.items[2].remaining).toBe(16);
  });

  it('otelde kalan oda her gecenin en küçüğü', async () => {
    const m = await MolaVeri.musaitlik('hotel', 'kordon-butik-otel', aralik('2026-10-31'));
    /* Standart oda: 1. gece 3 boş, 2. gece dolu. */
    const ilk = m.items.filter(r => r.item === 'standart')[0].date;
    const ikinci = m.items.filter(r => r.item === 'standart')[1].date;
    const ucuncu = m.items.filter(r => r.item === 'standart')[2].date;
    expect(konaklamaKalan(m, 'standart', ilk, ikinci)).toBe(3);
    /* Eski hesap yalnızca giriş gecesine bakıyordu: 2 gecelik konaklama
       "3 oda kaldı" diyerek dolu bir geceyi satıyordu. */
    expect(konaklamaKalan(m, 'standart', ilk, ucuncu)).toBe(0);
    expect(konaklamaKalan(m, 'standart', ikinci, ikinci)).toBeNull();
    expect(konaklamaKalan(m, 'standart', ilk, '2027-06-01')).toBeNull();
  });

  it('aktivitede birim paket × seans', async () => {
    const a = ACTIVITIES['kapadokya-balon-turu'];
    const m = await MolaVeri.musaitlik('activity', 'kapadokya-balon-turu', aralik('2026-09-30'));
    const ilkGun = m.items[0].date;
    expect(m.items.filter(r => r.date === ilkGun)).toHaveLength(a.packages.length * a.sessions.length);
    expect(musaitlikKaydi(m, 'standart', ilkGun, '05:45').remaining).toBe(20 - 17);
    expect(musaitlikKaydi(m, 'ozel', ilkGun, '05:45').remaining).toBe(0);
    expect(musaitlikKaydi(m, 'ozel', ilkGun, '07:15').remaining).toBe(4);
  });

  it('etkinlikte birim temsil × bilet kategorisi', async () => {
    const e = EVENTS['aspendos-opera-bale-festivali'];
    const m = await MolaVeri.musaitlik('event', 'aspendos-opera-bale-festivali', aralik('2026-12-31'));
    const tarihler = [...new Set(m.items.map(r => r.date))];
    expect(tarihler).toEqual(e.performances.map(t => t.date));
    expect(musaitlikKaydi(m, 'orkestra', '2026-09-26').remaining).toBe(0);
    expect(musaitlikKaydi(m, 'loca', '2026-09-26').remaining).toBe(3);
    expect(musaitlikKaydi(m, 'loca', '2026-09-26').capacity).toBe(120);
  });

  it('mekânda kapalı günde kontenjan yok', async () => {
    const m = await MolaVeri.musaitlik('venue', 'kordon-spa-masaj', aralik('2026-10-04'));
    /* 27 Eylül ve 4 Ekim pazar: spa kapalı. */
    expect(m.items.some(r => r.date === '2026-09-27')).toBe(false);
    expect(m.items.some(r => r.date === '2026-10-04')).toBe(false);
    expect(m.items.some(r => r.date === '2026-09-28')).toBe(true);
  });

  it('mekânda seans hafta sonu listesinden', async () => {
    const k = PLACES['kum-beach-club'];
    const m = await MolaVeri.musaitlik('venue', 'kum-beach-club', aralik('2026-09-27'));
    const cumartesi = [...new Set(m.items.filter(r => r.date === '2026-09-26').map(r => r.time))];
    expect(cumartesi).toEqual(k.pricing.weekendSlots);
    const sali = [...new Set(m.items.filter(r => r.date === '2026-09-22').map(r => r.time))];
    expect(sali).toEqual(k.pricing.slots);
  });

  it('aralık dışı tarih cevaba girmiyor ama sıra bugünden sayılıyor', async () => {
    const tam = await MolaVeri.musaitlik('tour', 'efes-sirince', aralik('2026-10-31'));
    const kesit = await MolaVeri.musaitlik('tour', 'efes-sirince',
      { today: BUGUN, from: tam.items[1].date, to: '2026-10-31' });
    expect(kesit.items[0]).toEqual(tam.items[1]);
  });

  it('her örnek rezervasyon gerçek bir ürüne ve birime denk geliyor', () => {
    /* Birimi olmayan örnek rezervasyon sessizce hiçbir şey göstermez. */
    for (const r of SAMPLE_BOOKINGS) {
      const kayit = MolaVeri.urun(r.type, r.slug);
      expect(kayit, r.slug).toBeTruthy();
      const gunler = envanterBirimleri(r.type, kayit, BUGUN, '2027-03-31');
      const gun = gunler[r.order];
      expect(gun, r.slug + ' sıra ' + r.order).toBeTruthy();
      const birimler = gun.units.filter(b => b.item === r.item);
      expect(birimler.length, r.slug + ' · ' + r.item).toBeGreaterThan(0);
      if (r.slotIndex !== undefined) {
        expect(birimler.some(b => b.slotIndex === r.slotIndex), r.slug + ' seans').toBe(true);
      }
      if (r.session !== undefined) {
        expect(birimler.some(b => b.session === r.session), r.slug + ' seans').toBe(true);
      }
      expect(r.quantity, r.slug).toBeLessThanOrEqual(birimler[0].capacity);
    }
  });
});

describe('kontenjan durumu', () => {
  it('bilinmiyor, doldu, yetersiz, az, var', () => {
    expect(kontenjanDurumu(null, 2, 4).durum).toBe('bilinmiyor');
    expect(kontenjanDurumu(undefined, 2, 4).durum).toBe('bilinmiyor');
    expect(kontenjanDurumu(0, 2, 4)).toEqual({ durum: 'doldu', kalan: 0 });
    expect(kontenjanDurumu(3, 5, 4)).toEqual({ durum: 'yetersiz', kalan: 3 });
    expect(kontenjanDurumu(3, 2, 4)).toEqual({ durum: 'az', kalan: 3 });
    expect(kontenjanDurumu(12, 2, 4)).toEqual({ durum: 'var', kalan: 12 });
  });

  it('istenen tam kalan kadarsa yeterli', () => {
    expect(kontenjanDurumu(4, 4, 0).durum).toBe('var');
  });

  it('tarih ancak bütün birimleri doluysa dolu', () => {
    const m = { items: [
      { item: 'a', date: '2026-10-01', remaining: 0 },
      { item: 'b', date: '2026-10-01', remaining: 2 },
      { item: 'a', date: '2026-10-02', remaining: 0 },
    ] };
    expect(tarihDoluMu(m, '2026-10-01')).toBe(false);
    expect(tarihDoluMu(m, '2026-10-02')).toBe(true);
    expect(tarihDoluMu(m, '2026-10-03')).toBe(false);
    expect(tarihDoluMu(null, '2026-10-02')).toBe(false);
  });
});
