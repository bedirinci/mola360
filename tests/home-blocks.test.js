import { describe, it, expect } from 'vitest';
import {
  HOME_BLOCK_PLACEMENT,
  UPCOMING_FILTERS,
  THEME_COLLECTIONS,
  GRID_COLLECTIONS,
  VENUES,
  CONTACT,
  filterUpcomingItems,
  isValidEmail,
  isValidPhone,
} from '../assets/js/home-blocks.js';

const ornek = [
  { title: 'Uzak',      inDays: 12 },
  { title: 'Cumartesi', inDays: 1, dayKey: 'cumartesi' },
  { title: 'Bugün',     inDays: 0 },
  { title: 'Pazar',     inDays: 2, dayKey: 'pazar' },
  { title: 'Üç gün',    inDays: 3 },
];

describe('filterUpcomingItems', () => {
  it('"en yakın" tümünü en yakın tarihten uzağa sıralar', () => {
    expect(filterUpcomingItems(ornek, 'enyakin').map(i => i.title))
      .toEqual(['Bugün', 'Cumartesi', 'Pazar', 'Üç gün', 'Uzak']);
  });

  it('bilinmeyen anahtar da tüm listeyi sıralı döndürür', () => {
    expect(filterUpcomingItems(ornek, 'yok')).toHaveLength(5);
  });

  it('"3 gün içinde" yalnızca 3 gün ve altını alır', () => {
    expect(filterUpcomingItems(ornek, 'ucgun').map(i => i.title))
      .toEqual(['Bugün', 'Cumartesi', 'Pazar', 'Üç gün']);
  });

  it('gün filtreleri yalnızca o günün kayıtlarını alır', () => {
    expect(filterUpcomingItems(ornek, 'cumartesi').map(i => i.title)).toEqual(['Cumartesi']);
    expect(filterUpcomingItems(ornek, 'pazar').map(i => i.title)).toEqual(['Pazar']);
  });

  it('kaynağı değiştirmez', () => {
    filterUpcomingItems(ornek, 'enyakin').pop();
    expect(ornek).toHaveLength(5);
    expect(ornek[0].title).toBe('Uzak');
  });

  it('geçersiz girdide boş liste döndürür', () => {
    expect(filterUpcomingItems(null, 'enyakin')).toEqual([]);
  });
});

describe('isValidEmail', () => {
  it('geçerli adresleri kabul eder', () => {
    expect(isValidEmail('bedir@ornek.com')).toBe(true);
    expect(isValidEmail('  a.b@alt.ornek.com.tr  ')).toBe(true);
  });

  it('geçersiz adresleri reddeder', () => {
    ['', 'yanlis', 'a@b', 'a@b.c', 'bosluk var@ornek.com', '@ornek.com', null, undefined]
      .forEach(deger => expect(isValidEmail(deger)).toBe(false));
  });
});

describe('isValidPhone', () => {
  it('yazım biçiminden bağımsız olarak Türkiye numaralarını kabul eder', () => {
    ['05551112233', '5551112233', '0555 111 22 33', '+90 555 111 22 33', '(0555) 111-22-33']
      .forEach(deger => expect(isValidPhone(deger)).toBe(true));
  });

  it('eksik, fazla veya hatalı numaraları reddeder', () => {
    ['', '123', '555111223', '05551112233444', '0055511122', null, undefined]
      .forEach(deger => expect(isValidPhone(deger)).toBe(false));
  });
});

describe('blok verileri', () => {
  it('filtre listesi "en yakın" ile başlar ve anahtarları tekildir', () => {
    const anahtarlar = UPCOMING_FILTERS.map(f => f.key);
    expect(anahtarlar[0]).toBe('enyakin');
    expect(new Set(anahtarlar).size).toBe(anahtarlar.length);
  });

  it('kaldırılan bloklar yerleşim haritasında yok', () => {
    const yerlesenler = Object.values(HOME_BLOCK_PLACEMENT).flat();
    expect(yerlesenler).not.toContain('weekend');
    expect(yerlesenler).not.toContain('trust');
  });

  it('koleksiyon blokları boş değil', () => {
    expect(THEME_COLLECTIONS.length).toBeGreaterThan(0);
    expect(GRID_COLLECTIONS.length).toBeGreaterThan(0);
  });

  it('mekan kayıtlarında gerekli alanlar var ve başlıklar tekil', () => {
    expect(VENUES.length).toBeGreaterThan(0);
    VENUES.forEach(mekan => {
      ['img', 'type', 'title', 'area', 'rating', 'reviews', 'hours'].forEach(alan => {
        expect(String(mekan[alan] || '')).not.toBe('');
      });
      expect(typeof mekan.open).toBe('boolean');
    });
    const basliklar = VENUES.map(m => m.title);
    expect(new Set(basliklar).size).toBe(basliklar.length);
  });

  it('kampanya bandı günübirlik turlardan sonra geliyor', () => {
    expect(HOME_BLOCK_PLACEMENT['Günübirlik Turlar'][0]).toBe('promo');
    expect(HOME_BLOCK_PLACEMENT['Yaklaşan Etkinlikler']).toBeUndefined();
  });

  it('iletişim bağlantıları doğru biçimde', () => {
    expect(CONTACT.phoneHref.startsWith('tel:')).toBe(true);
    expect(CONTACT.whatsappHref.startsWith('https://wa.me/')).toBe(true);
  });
});
