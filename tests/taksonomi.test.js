/* Sınıflandırma (taksonomi) testleri.

   taxonomy-data.js ürünlerin nasıl gruplandığının tek kaynağı: kategori,
   tema, koleksiyon, destinasyon, özellik, liste sayfası ve menü. Buradaki
   testler üç sözü koruyor:

   1) Her bağ gerçek bir kayda gidiyor. Ürün ya da liste sayfası var
      olmayan bir temaya, şehre veya kategoriye işaret edemez.
   2) Adres alanı çakışmıyor. /turlar/<slug>/ hem kategori hem liste
      sayfası olabileceği için aynı kökte aynı slug iki şeye gidemez.
   3) Menünün her satırı bir hedefe çözülüyor. Hedefi olmayan menü satırı
      yazılamıyor; menüde olması gereken bir kategori de unutulamıyor. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  TAXONOMY_REGIONS,
  TAXONOMY_CITIES,
  TAXONOMY_TYPES,
  TAXONOMY_TOUR_KINDS,
  TAXONOMY_CATEGORIES,
  TAXONOMY_THEMES,
  TAXONOMY_COLLECTIONS,
  TAXONOMY_FACETS,
  TAXONOMY_LISTINGS,
  TAXONOMY_MENU,
  taxonomyCityRegion,
  taxonomyCategory,
  taxonomyCategoryWithDescendants,
  taxonomyCategoryPath,
  taxonomyBoardByCode,
  taxonomyResolvePath,
} from '../assets/js/taxonomy-data.js';
import { slugGecerli } from '../assets/js/slug-utils.js';
import { TOURS } from '../assets/js/tour-data.js';
import { HOTELS } from '../assets/js/hotel-data.js';
import { ACTIVITIES } from '../assets/js/activity-data.js';
import { EVENTS } from '../assets/js/event-data.js';
import { PLACES } from '../assets/js/venue-data.js';

const URUNLER = [
  ...Object.values(TOURS).map(k => ({ tip: 'tour', k })),
  ...Object.values(HOTELS).map(k => ({ tip: 'hotel', k })),
  ...Object.values(ACTIVITIES).map(k => ({ tip: 'activity', k })),
  ...Object.values(EVENTS).map(k => ({ tip: 'event', k })),
  ...Object.values(PLACES).map(k => ({ tip: 'venue', k })),
];

const tekil = (liste, anahtar) => {
  const gorulen = new Set();
  const cift = [];
  for (const x of liste) {
    const a = anahtar(x);
    if (gorulen.has(a)) cift.push(a);
    gorulen.add(a);
  }
  return cift;
};

/* app.js'teki görsel sözlüğünün anahtarları: tema ve koleksiyon kartları
   görsellerini oradan alıyor. */
const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const gorselBlogu = app.match(/const cardImages = \{([\s\S]*?)\n\};/)[1];
const GORSEL_ANAHTARLARI = new Set([...gorselBlogu.matchAll(/^\s*"?([A-Za-z0-9]+)"?\s*:/gm)].map(m => m[1]));

describe('ana veri biçimi', () => {
  it('bütün slug\'lar backend kısıtından geçiyor', () => {
    const hepsi = [
      ...TAXONOMY_REGIONS, ...TAXONOMY_CITIES, ...TAXONOMY_CATEGORIES,
      ...TAXONOMY_THEMES, ...TAXONOMY_COLLECTIONS, ...TAXONOMY_LISTINGS,
      ...TAXONOMY_FACETS.transport, ...TAXONOMY_FACETS.board,
    ];
    for (const x of hepsi) expect(slugGecerli(x.slug), x.slug).toBe(true);
  });

  it('tekil olması gerekenler tekil', () => {
    expect(tekil(TAXONOMY_REGIONS, r => r.slug)).toEqual([]);
    expect(tekil(TAXONOMY_CITIES, c => c.slug)).toEqual([]);
    expect(tekil(TAXONOMY_CATEGORIES, c => c.type + '/' + c.slug)).toEqual([]);
    expect(tekil(TAXONOMY_THEMES, t => t.slug)).toEqual([]);
    expect(tekil(TAXONOMY_COLLECTIONS, c => c.slug)).toEqual([]);
    expect(tekil(TAXONOMY_LISTINGS, l => l.base + '/' + l.slug)).toEqual([]);
  });

  it('her şehrin bölgesi tanımlı', () => {
    for (const c of TAXONOMY_CITIES) expect(taxonomyCityRegion(c.slug), c.slug).toBeTruthy();
  });

  it('kategoriler bilinen tipte ve üst kategorisi aynı tipte', () => {
    for (const k of TAXONOMY_CATEGORIES) {
      expect(TAXONOMY_TYPES[k.type], k.slug).toBeTruthy();
      if (k.parent) expect(taxonomyCategory(k.type, k.parent), k.slug + ' → ' + k.parent).toBeTruthy();
      expect(k.name && k.nameShort, k.slug).toBeTruthy();
    }
  });

  it('kategori ağacında döngü yok', () => {
    for (const k of TAXONOMY_CATEGORIES) {
      const yol = taxonomyCategoryPath(k.type, k.slug);
      expect(yol[yol.length - 1].slug).toBe(k.slug);
      expect(yol[0].parent).toBeNull();
    }
  });

  it('tema ve koleksiyon görselleri görsel sözlüğünde var', () => {
    expect(GORSEL_ANAHTARLARI.size).toBeGreaterThan(20);
    for (const x of [...TAXONOMY_THEMES, ...TAXONOMY_COLLECTIONS]) {
      expect(GORSEL_ANAHTARLARI.has(x.img), x.slug + ' · ' + x.img).toBe(true);
    }
  });
});

describe('koleksiyonlar', () => {
  it('elle çalışanın kuralı yok, kurala göre çalışanın kuralı var', () => {
    for (const c of TAXONOMY_COLLECTIONS) {
      if (c.mode === 'manual') expect(c.rule, c.slug).toBeUndefined();
      else {
        expect(c.mode, c.slug).toBe('rule');
        expect(Object.keys(c.rule || {}).length, c.slug).toBeGreaterThan(0);
      }
    }
  });

  it('kural metni kuralın kendisiyle aynı şeyi söylüyor', () => {
    /* "500 TL altı seçenekler" yazısı kuraldaki sınırla ayrışırsa kart
       yalan söyler. */
    const butce = TAXONOMY_COLLECTIONS.find(c => c.slug === 'butce-dostu');
    expect(butce.text).toContain(String(butce.rule.maxPrice) + ' TL');
    const uzun = TAXONOMY_COLLECTIONS.find(c => c.slug === 'uzun-hafta-sonu');
    expect(uzun.text).toContain(uzun.rule.minNights + '-' + uzun.rule.maxNights + ' gece');
  });

  it('kurala göre koleksiyon ürün kaydına elle yazılmamış', () => {
    const kurallar = new Set(TAXONOMY_COLLECTIONS.filter(c => c.mode === 'rule').map(c => c.slug));
    for (const { k } of URUNLER) {
      for (const s of k.taxonomy.collections) expect(kurallar.has(s), k.slug + ' · ' + s).toBe(false);
    }
  });
});

describe('liste sayfaları', () => {
  const BASE_TIP = Object.fromEntries(Object.entries(TAXONOMY_TYPES).map(([t, v]) => [v.base, t]));

  it('aynı kökte kategoriyle aynı adreste değil', () => {
    for (const l of TAXONOMY_LISTINGS) {
      const tip = BASE_TIP[l.base];
      if (tip) expect(taxonomyCategory(tip, l.slug), l.base + '/' + l.slug).toBeNull();
    }
  });

  it('filtre yalnızca var olan kayıtlara işaret ediyor', () => {
    const bilinen = new Set(['type', 'tourKind', 'category', 'theme', 'collection', 'region', 'city',
      'abroad', 'transport', 'board', 'weekend', 'discounted', 'earlyBooking']);
    for (const l of TAXONOMY_LISTINGS) {
      const f = l.filter || {};
      for (const a of Object.keys(f)) expect(bilinen.has(a), l.slug + ' · ' + a).toBe(true);
      if (f.type) expect(TAXONOMY_TYPES[f.type], l.slug).toBeTruthy();
      if (f.tourKind) expect(TAXONOMY_TOUR_KINDS[f.tourKind], l.slug).toBeTruthy();
      if (f.theme) expect(TAXONOMY_THEMES.some(t => t.slug === f.theme), l.slug).toBe(true);
      if (f.collection) expect(TAXONOMY_COLLECTIONS.some(c => c.slug === f.collection), l.slug).toBe(true);
      if (f.region) expect(TAXONOMY_REGIONS.some(r => r.slug === f.region), l.slug).toBe(true);
      if (f.city) expect(TAXONOMY_CITIES.some(c => c.slug === f.city), l.slug).toBe(true);
      if (f.transport) expect(TAXONOMY_FACETS.transport.some(x => x.slug === f.transport), l.slug).toBe(true);
      if (f.board) expect(TAXONOMY_FACETS.board.some(x => x.slug === f.board), l.slug).toBe(true);
      if (f.category) expect(taxonomyCategory(f.type, f.category), l.slug).toBeTruthy();
      if (BASE_TIP[l.base]) expect(f.type, l.slug + ' kendi kökünün tipinde').toBe(BASE_TIP[l.base]);
    }
  });

  it('tur tipinin liste sayfası var', () => {
    for (const [tip, v] of Object.entries(TAXONOMY_TOUR_KINDS)) {
      const l = TAXONOMY_LISTINGS.find(x => x.base === 'turlar' && x.slug === v.listing);
      expect(l, tip).toBeTruthy();
      expect(l.filter.tourKind).toBe(tip);
      expect(l.name).toBe(v.plural);
    }
  });
});

describe('menü', () => {
  const satirlar = [];
  (function gez(liste) {
    for (const x of liste) { satirlar.push(x); if (x.children) gez(x.children); }
  })(TAXONOMY_MENU);

  it('her satırın adresi bir hedefe çözülüyor', () => {
    for (const s of satirlar) expect(taxonomyResolvePath(s.path), s.label + ' → ' + s.path).toBeTruthy();
  });

  it('menüde olması gereken her kategori ve liste sayfası menüde', () => {
    const adresler = new Set(satirlar.map(s => s.path));
    for (const k of TAXONOMY_CATEGORIES.filter(x => x.menu !== false)) {
      const yol = TAXONOMY_TYPES[k.type].base + '/' + k.slug;
      expect(adresler.has(yol), yol).toBe(true);
    }
    for (const l of TAXONOMY_LISTINGS.filter(x => x.menu !== false)) {
      const yol = l.base + '/' + l.slug;
      expect(adresler.has(yol), yol).toBe(true);
    }
  });

  it('"menu: false" işaretli olanlar gerçekten menüde yok', () => {
    const adresler = new Set(satirlar.map(s => s.path));
    for (const k of TAXONOMY_CATEGORIES.filter(x => x.menu === false)) {
      expect(adresler.has(TAXONOMY_TYPES[k.type].base + '/' + k.slug), k.slug).toBe(false);
    }
  });

  it('Son Dakika tek tanımla: koleksiyona gidiyor', () => {
    const son = satirlar.find(s => s.label === 'Son Dakika');
    expect(son.path).toBe('koleksiyonlar/son-dakika');
    expect(TAXONOMY_LISTINGS.some(l => l.slug === 'son-dakika')).toBe(false);
  });
});

describe('adres çözümü', () => {
  it('ürün tipi listesi, kategori, liste sayfası, tema, koleksiyon', () => {
    expect(taxonomyResolvePath('turlar')).toEqual({ kind: 'type-list', type: 'tour' });
    expect(taxonomyResolvePath('/turlar/')).toEqual({ kind: 'type-list', type: 'tour' });
    expect(taxonomyResolvePath('turlar/karadeniz-turlari').kind).toBe('category');
    expect(taxonomyResolvePath('turlar/otobuslu-turlar').kind).toBe('listing');
    expect(taxonomyResolvePath('oteller/butik-oteller').category.slug).toBe('butik-oteller');
    expect(taxonomyResolvePath('temalar/doga-yayla').theme.name).toBe('Doğa & Yayla');
    expect(taxonomyResolvePath('koleksiyonlar/ailece').collection.name).toBe('Ailece');
    expect(taxonomyResolvePath('kurumsal/kvkk').kind).toBe('static');
    expect(taxonomyResolvePath('firsatlar/indirimli-turlar').kind).toBe('listing');
  });

  it('bilinmeyen adres null (404)', () => {
    expect(taxonomyResolvePath('turlar/yok-boyle-bir-sey')).toBeNull();
    expect(taxonomyResolvePath('oteller/karadeniz-turlari')).toBeNull();
    expect(taxonomyResolvePath('turlar/karadeniz-turlari/fazla')).toBeNull();
    expect(taxonomyResolvePath('temalar/yok')).toBeNull();
    expect(taxonomyResolvePath('')).toBeNull();
    expect(taxonomyResolvePath('bilinmeyen')).toBeNull();
  });

  it('üst kategori alt kategorileri kapsıyor', () => {
    const yurtIci = taxonomyCategoryWithDescendants('tour', 'yurt-ici-turlar');
    expect(yurtIci).toContain('yurt-ici-turlar');
    expect(yurtIci).toContain('karadeniz-turlari');
    expect(yurtIci).not.toContain('balkan-turlari');
    expect(taxonomyCategoryWithDescendants('tour', 'ege-turlari')).toEqual(['ege-turlari']);
  });

  it('pansiyon kodu standart koddan çözülüyor', () => {
    expect(taxonomyBoardByCode('BB').slug).toBe('oda-kahvalti');
    expect(taxonomyBoardByCode('ai').slug).toBe('her-sey-dahil');
    expect(taxonomyBoardByCode('xx')).toBeNull();
  });
});

describe('ürünlerin sınıflandırması', () => {
  it('her ürünün taxonomy alanı eksiksiz ve geçerli', () => {
    for (const { tip, k } of URUNLER) {
      const t = k.taxonomy;
      expect(t, k.slug).toBeTruthy();
      expect(t.categories.length, k.slug + ' en az bir kategori').toBeGreaterThan(0);
      for (const s of t.categories) expect(taxonomyCategory(tip, s), k.slug + ' · ' + s).toBeTruthy();
      for (const s of t.themes) expect(TAXONOMY_THEMES.some(x => x.slug === s), k.slug + ' · ' + s).toBe(true);
      for (const s of t.collections) expect(TAXONOMY_COLLECTIONS.some(x => x.slug === s), k.slug + ' · ' + s).toBe(true);
      expect(taxonomyCityRegion(t.city), k.slug + ' · ' + t.city).toBeTruthy();
      for (const s of (t.facets.transport || [])) {
        expect(TAXONOMY_FACETS.transport.some(x => x.slug === s), k.slug + ' · ' + s).toBe(true);
      }
      for (const s of (t.facets.departFrom || [])) {
        expect(TAXONOMY_CITIES.some(x => x.slug === s), k.slug + ' · ' + s).toBe(true);
      }
      expect(tekil(t.categories, x => x), k.slug).toEqual([]);
      expect(tekil(t.themes, x => x), k.slug).toEqual([]);
      expect(tekil(t.collections, x => x), k.slug).toEqual([]);
    }
  });

  it('kalkış şehri iki yerde yazılmıyor', () => {
    /* Konaklamalı turda kalkış şehirleri departureCities'te; aynı bilgi
       taxonomy.facets.departFrom'a da yazılırsa ikisi ayrışabilir. */
    for (const { k } of URUNLER) {
      if (k.departureCities) {
        expect(k.taxonomy.facets.departFrom, k.slug).toBeUndefined();
        for (const d of k.departureCities) {
          expect(TAXONOMY_CITIES.some(c => c.slug === d.city), k.slug + ' · ' + d.label).toBe(true);
        }
      }
    }
  });

  it('otel pansiyon kodları standart kodlardan', () => {
    for (const k of Object.values(HOTELS)) {
      for (const b of k.boards) expect(taxonomyBoardByCode(b.id), k.slug + ' · ' + b.id).toBeTruthy();
    }
  });

  it('para birimi bilinen biri', () => {
    for (const { k } of URUNLER) expect(['TRY', 'EUR', 'USD'], k.slug).toContain(k.currency);
  });
});
