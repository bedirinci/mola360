/* Liste motoru (assets/js/listing-engine.js) testleri.

   Motor saf: satır ve alan tanımı alıp süzülmüş, sıralanmış satırlar ve
   seçenek sayıları döndürüyor. Backend geldiğinde aynı kurallar sunucuya
   taşınacak; buradaki testler o kuralların tanımı:

   1) Alan içi VEYA, alanlar arası VE; null "her değer", [] "hiçbiri".
   2) Seçeneğin sayısı, kendi alanı hariç diğer seçimler geçerliyken o
      seçeneğin vereceği sonuç sayısı.
   3) Daraltmayan alan gizli; sayısı 0 olan seçilmemiş seçenek gizli.
   4) Adres parametreleri: tanınmayan değer atılıyor, aynı seçim hep aynı
      adresi üretiyor.
   5) Sıralama: önerilen (Bayes), fiyat (TL önce), tarih, puan. */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const M = require('../assets/js/listing-engine.js');

const ALANLAR = [
  { key: 'tip', name: 'Tür', kind: 'coklu', options: [{ slug: 'tur', name: 'Turlar' }, { slug: 'otel', name: 'Oteller' }] },
  { key: 'ay', name: 'Tarih', kind: 'coklu', options: [{ slug: '2026-10', name: 'Ekim 2026' }, { slug: '2026-11', name: 'Kasım 2026' }],
    note: 'Her gün satılanlar her ayda listelenir.', notKosulu: 'joker' },
  { key: 'bolge', name: 'Bölge', kind: 'coklu', options: [
    { slug: 'ege', name: 'Ege' }, { slug: 'akdeniz', name: 'Akdeniz' }, { slug: 'karadeniz', name: 'Karadeniz' }] },
  { key: 'ulasim', name: 'Ulaşım', kind: 'coklu', options: [{ slug: 'otobus', name: 'Otobüs' }, { slug: 'ucak', name: 'Uçak' }] },
  { key: 'fiyat', name: 'Fiyat', kind: 'aralik', field: 'price', currency: 'TRY', options: M.SUZ_FIYAT_DILIMLERI,
    note: 'Döviz fiyatlılar TL süzgecinde yok.', notKosulu: 'doviz' },
  { key: 'puan', name: 'Puan', kind: 'esik', field: 'rating', options: M.SUZ_PUAN_ESIKLERI },
  { key: 'indirimli', name: 'Fırsat', kind: 'bayrak', field: 'discounted',
    options: [{ slug: '1', name: 'Yalnızca indirimliler', etiket: 'İndirimli' }] }
];

const satir = (o) => Object.assign({
  type: 'tour', slug: o.slug, title: o.title || o.slug, price: 1000, currency: 'TRY',
  discounted: false, rating: null, ratingCount: 0, nextDate: null,
  facets: { tip: ['tur'], ay: ['2026-10'], bolge: [], ulasim: [] }
}, o, { facets: Object.assign({ tip: ['tur'], ay: ['2026-10'], bolge: [], ulasim: [] }, o.facets || {}) });

const SATIRLAR = [
  satir({ slug: 'a', price: 500, rating: 4.8, ratingCount: 900, nextDate: '2026-10-03',
    facets: { bolge: ['ege'], ulasim: ['otobus'], ay: ['2026-10', '2026-11'] } }),
  satir({ slug: 'b', price: 2000, rating: 4.9, ratingCount: 4, nextDate: '2026-10-01', discounted: true,
    facets: { bolge: ['ege'], ulasim: ['ucak'], ay: ['2026-11'] } }),
  satir({ slug: 'c', price: 8000, rating: 4.2, ratingCount: 300, nextDate: '2026-10-20',
    facets: { bolge: ['akdeniz'], ulasim: ['otobus'] } }),
  satir({ slug: 'd', price: 149, currency: 'EUR', rating: 4.6, ratingCount: 50, nextDate: '2026-10-05',
    facets: { bolge: ['karadeniz'], ulasim: ['ucak'] } }),
  /* Her gün satılan otel: tarih alanı null → her aya uyar; ulaşımı yok. */
  satir({ slug: 'e', type: 'hotel', price: 1500, rating: 4.4, ratingCount: 120,
    facets: { tip: ['otel'], ay: null, bolge: ['ege'], ulasim: [] } })
];
const slugs = (liste) => liste.map(s => s.slug);

describe('eşleşme kuralları', () => {
  it('alan içi VEYA, alanlar arası VE', () => {
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { bolge: ['ege', 'akdeniz'] }))).toEqual(['a', 'b', 'c', 'e']);
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { bolge: ['ege'], ulasim: ['otobus'] }))).toEqual(['a']);
  });

  it('null "her değer": her gün açık otel her aya uyuyor', () => {
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { ay: ['2026-11'] }))).toEqual(['a', 'b', 'e']);
  });

  it('boş dizi "hiçbiri": ulaşımı olmayan otel ulaşım süzgecine uymuyor', () => {
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { ulasim: ['otobus', 'ucak'] }))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('fiyat aralığı [alt, üst) ve yalnızca TL', () => {
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { fiyat: ['0-1000'] }))).toEqual(['a']);
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { fiyat: ['1000-2500'] }))).toEqual(['b', 'e']);
    /* 149 EUR, 1.000 TL altı diliminde DEĞİL: kur çevrilmiyor. */
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { fiyat: ['0-1000'] }))).not.toContain('d');
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { fiyat: ['5000-'] }))).toEqual(['c']);
  });

  it('puan eşiği ve indirim bayrağı', () => {
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { puan: ['4.5'] }))).toEqual(['a', 'b', 'd']);
    expect(slugs(M.suzUygula(SATIRLAR, ALANLAR, { indirimli: ['1'] }))).toEqual(['b']);
  });

  it('süre dilimi gece sayısından', () => {
    expect(M.suzSureDilimi(0)).toBe('gunubirlik');
    expect(M.suzSureDilimi(2)).toBe('1-2-gece');
    expect(M.suzSureDilimi(3)).toBe('3-5-gece');
    expect(M.suzSureDilimi(9)).toBe('6-gece-ustu');
    expect(M.suzSureDilimi(null)).toBe(null);
  });
});

describe('seçenek sayıları', () => {
  const yuzey = (secim, key) => M.suzYuzeyler(SATIRLAR, ALANLAR, secim).find(y => y.key === key);
  const adet = (y, slug) => (y.secenekler.find(o => o.slug === slug) || { adet: 0 }).adet;

  it('kendi alanı hariç: Ege seçiliyken Akdeniz yine 1 gösteriyor', () => {
    const b = yuzey({ bolge: ['ege'] }, 'bolge');
    expect(adet(b, 'ege')).toBe(3);
    expect(adet(b, 'akdeniz')).toBe(1);
  });

  it('başka alanın seçimi sayıyı daraltıyor', () => {
    const b = yuzey({ ulasim: ['ucak'] }, 'bolge');
    expect(adet(b, 'ege')).toBe(1);
    expect(adet(b, 'akdeniz')).toBe(0);
    /* Sayısı 0 olan seçilmemiş seçenek listelenmiyor. */
    expect(b.secenekler.map(o => o.slug)).not.toContain('akdeniz');
  });

  it('seçeneğin sayısı tıklanınca çıkan sonuç sayısına eşit', () => {
    const yuzeyler = M.suzYuzeyler(SATIRLAR, ALANLAR, { bolge: ['ege'] });
    yuzeyler.filter(y => y.kind === 'coklu').forEach(y => y.secenekler.forEach(o => {
      if (o.secili) return;
      const alan = ALANLAR.find(a => a.key === y.key);
      const yeni = M.suzDegistir({ secim: { bolge: ['ege'] } }, alan, o.slug).secim;
      expect(M.suzUygula(SATIRLAR, ALANLAR, yeni).length, y.key + '=' + o.slug).toBe(
        y.key === 'bolge' ? M.suzUygula(SATIRLAR, ALANLAR, { bolge: ['ege', o.slug] }).length : o.adet);
    }));
  });

  it('daraltmayan alan gizli', () => {
    const tekTip = SATIRLAR.filter(s => s.type === 'tour');
    const tip = M.suzYuzeyler(tekTip, ALANLAR, {}).find(y => y.key === 'tip');
    expect(tip.gorunur).toBe(false);
    const karma = M.suzYuzeyler(SATIRLAR, ALANLAR, {}).find(y => y.key === 'tip');
    expect(karma.gorunur).toBe(true);
  });

  it('not yalnızca işe yaradığı listede', () => {
    const turlar = SATIRLAR.filter(s => s.type === 'tour');
    expect(M.suzYuzeyler(turlar, ALANLAR, {}).find(y => y.key === 'ay').note).toBe('');
    expect(M.suzYuzeyler(SATIRLAR, ALANLAR, {}).find(y => y.key === 'ay').note).toBeTruthy();
    const tl = SATIRLAR.filter(s => s.currency === 'TRY');
    expect(M.suzYuzeyler(tl, ALANLAR, {}).find(y => y.key === 'fiyat').note).toBe('');
    expect(M.suzYuzeyler(SATIRLAR, ALANLAR, {}).find(y => y.key === 'fiyat').note).toBeTruthy();
  });

  it('adresten gelen serbest fiyat aralığı seçenek olarak görünüyor', () => {
    const f = yuzey({ fiyat: ['400-1600'] }, 'fiyat');
    const o = f.secenekler.find(x => x.slug === '400-1600');
    expect(o.secili).toBe(true);
    expect(o.name).toBe('400 – 1.600 TL');
    expect(o.adet).toBe(2);
  });

  it('etiketler: kısa etiket varsa o', () => {
    expect(M.suzEtiketler(ALANLAR, { bolge: ['ege'], indirimli: ['1'], fiyat: ['0-1000'] }))
      .toEqual([
        { key: 'bolge', slug: 'ege', name: 'Ege' },
        { key: 'fiyat', slug: '0-1000', name: '1.000 TL altı' },
        { key: 'indirimli', slug: '1', name: 'İndirimli' }
      ]);
  });
});

describe('adres parametreleri', () => {
  it('okuma: tanınmayan değer ve tekrar atılıyor', () => {
    const d = M.suzOku('?bolge=ege,xyz,ege&ulasim=&fiyat=abc&puan=3&indirimli=1&sirala=yok&sayfa=0', ALANLAR);
    expect(d.secim).toEqual({ bolge: ['ege'], indirimli: ['1'] });
    expect(d.siralama).toBe('onerilen');
    expect(d.sayfa).toBe(1);
  });

  it('yazma: alan sırası, varsayılan sıralama ve 1. sayfa yazılmıyor', () => {
    expect(M.suzYaz({ secim: { ulasim: ['ucak'], bolge: ['ege', 'akdeniz'] }, siralama: 'onerilen', sayfa: 1 }, ALANLAR))
      .toBe('bolge=ege,akdeniz&ulasim=ucak');
    expect(M.suzYaz({ secim: {}, siralama: 'fiyat-artan', sayfa: 3 }, ALANLAR)).toBe('sirala=fiyat-artan&sayfa=3');
  });

  it('gidiş-dönüş aynı durumu veriyor', () => {
    const d = { secim: { bolge: ['akdeniz'], fiyat: ['1000-2500'], puan: ['4'] }, siralama: 'puan', sayfa: 2 };
    expect(M.suzOku(M.suzYaz(d, ALANLAR), ALANLAR)).toEqual(d);
  });

  it('Türkçe ve kodlanmış karakterler bozulmuyor', () => {
    expect(M.suzParametreler('?q=%C5%9File+a%C4%9Fva&x')).toEqual({ q: 'şile ağva', x: '' });
  });

  it('motora ait olmayan parametreler ayırt ediliyor', () => {
    expect(M.suzSahipOlunanlar(ALANLAR)).toContain('bolge');
    expect(M.suzSahipOlunanlar(ALANLAR)).toContain('sirala');
    expect(M.suzSahipOlunanlar(ALANLAR)).not.toContain('utm_source');
  });

  it('değiştirme: çoklu ekler/çıkarır, tekli yerine geçer, sayfa 1\'e döner', () => {
    const bolge = ALANLAR.find(a => a.key === 'bolge');
    const fiyat = ALANLAR.find(a => a.key === 'fiyat');
    let d = { secim: {}, siralama: 'tarih', sayfa: 3 };
    d = M.suzDegistir(d, bolge, 'ege');
    d = M.suzDegistir(d, bolge, 'akdeniz');
    expect(d.secim.bolge).toEqual(['ege', 'akdeniz']);
    expect(d.sayfa).toBe(1);
    expect(d.siralama).toBe('tarih');
    d = M.suzDegistir(d, bolge, 'ege');
    expect(d.secim.bolge).toEqual(['akdeniz']);
    d = M.suzDegistir(d, fiyat, '0-1000');
    d = M.suzDegistir(d, fiyat, '1000-2500');
    expect(d.secim.fiyat).toEqual(['1000-2500']);
    d = M.suzDegistir(d, fiyat, '1000-2500');
    expect(d.secim.fiyat).toBeUndefined();
  });

  it('aralık okuma', () => {
    expect(M.suzAralik('500-2000')).toEqual({ alt: 500, ust: 2000 });
    expect(M.suzAralik('10000-')).toEqual({ alt: 10000, ust: null });
    expect(M.suzAralik('-800')).toEqual({ alt: 0, ust: 800 });
    expect(M.suzAralik('-')).toBe(null);
    expect(M.suzAralik('900-100')).toBe(null);
  });
});

describe('sıralama', () => {
  it('önerilen: az yorumlu yüksek puan çok yorumlunun önüne geçmiyor', () => {
    const sira = slugs(M.suzSirala(SATIRLAR, 'onerilen'));
    /* b 4,9 ama 4 yorum; a 4,8 ve 900 yorum. */
    expect(sira.indexOf('a')).toBeLessThan(sira.indexOf('b'));
  });

  it('fiyat: TL fiyatlılar önce, döviz sonra', () => {
    expect(slugs(M.suzSirala(SATIRLAR, 'fiyat-artan'))).toEqual(['a', 'e', 'b', 'c', 'd']);
    expect(slugs(M.suzSirala(SATIRLAR, 'fiyat-azalan'))).toEqual(['c', 'b', 'e', 'a', 'd']);
  });

  it('tarih: tarihsiz en sonda', () => {
    expect(slugs(M.suzSirala(SATIRLAR, 'tarih'))).toEqual(['b', 'a', 'd', 'c', 'e']);
  });

  it('puan: yüksekten düşüğe', () => {
    expect(slugs(M.suzSirala(SATIRLAR, 'puan'))).toEqual(['b', 'a', 'd', 'e', 'c']);
  });

  it('kaynak dizi değişmiyor', () => {
    const once = slugs(SATIRLAR);
    M.suzSirala(SATIRLAR, 'fiyat-artan');
    expect(slugs(SATIRLAR)).toEqual(once);
  });
});

describe('TL karşılığı (tahsilat TL)', () => {
  /* Gerçek sayfada fiyat alanı priceTRY: döviz fiyatlı ürün günün
     kuruyla TL'ye çevrilmiş olarak süzülüyor ve sıralanıyor. */
  const TL_ALAN = [{ key: 'fiyat', name: 'Fiyat', kind: 'aralik', field: 'priceTRY', options: M.SUZ_FIYAT_DILIMLERI }];
  const S = [
    satir({ slug: 'tl', price: 7000, priceTRY: 7000 }),
    satir({ slug: 'eur', price: 149, currency: 'EUR', priceTRY: 7450 }),
    satir({ slug: 'kursuz', price: 99, currency: 'USD', priceTRY: null })
  ];
  it('döviz fiyatlı ürün TL diliminde karşılığıyla', () => {
    expect(slugs(M.suzUygula(S, TL_ALAN, { fiyat: ['5000-10000'] }))).toEqual(['tl', 'eur']);
    expect(slugs(M.suzUygula(S, TL_ALAN, { fiyat: ['0-1000'] }))).toEqual([]);
  });
  it('sıralama TL karşılığıyla; kuru bilinmeyen sonda', () => {
    expect(slugs(M.suzSirala(S, 'fiyat-artan'))).toEqual(['tl', 'eur', 'kursuz']);
    expect(slugs(M.suzSirala(S, 'fiyat-azalan'))).toEqual(['eur', 'tl', 'kursuz']);
  });
});

describe('sayfalama', () => {
  it('sayfa N ilk N sayfayı gösteriyor', () => {
    const cok = Array.from({ length: 60 }, (_, i) => satir({ slug: 's' + i, title: 'Ürün ' + String(i).padStart(2, '0') }));
    const s1 = M.suzListe(cok, ALANLAR, { secim: {}, sayfa: 1 });
    expect(s1.toplam).toBe(60);
    expect(s1.satirlar.length).toBe(M.SUZ_SAYFA_BOYU);
    expect(s1.dahaVar).toBe(true);
    const s3 = M.suzListe(cok, ALANLAR, { secim: {}, sayfa: 3 });
    expect(s3.satirlar.length).toBe(60);
    expect(s3.dahaVar).toBe(false);
  });
});
