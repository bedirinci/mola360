import { describe, it, expect } from 'vitest';
import {
  HOME_BLOCK_PLACEMENT,
  UPCOMING_FILTERS,
  UPCOMING_DAY_KEYS,
  THEME_COLLECTIONS,
  GRID_COLLECTIONS,
  VENUES,
  PROMO_BANDS,
  NEWSLETTER_PERKS,
  CONTACT,
  filterUpcomingItems,
  isValidEmail,
  isValidPhone,
} from '../assets/js/home-blocks.js';

const ornek = [
  { title: 'Uzak',      inDays: 12 },
  { title: 'Cumartesi', inDays: 1, dayKey: 'cumartesi' },
  { title: 'Cuma',      inDays: 0, dayKey: 'cuma' },
  { title: 'Pazar',     inDays: 2, dayKey: 'pazar' },
  { title: 'Üç gün',    inDays: 3 },
];

describe('filterUpcomingItems', () => {
  it('"tümü" listenin tamamını en yakın tarihten uzağa sıralar', () => {
    expect(filterUpcomingItems(ornek, 'tumu').map(i => i.title))
      .toEqual(['Cuma', 'Cumartesi', 'Pazar', 'Üç gün', 'Uzak']);
  });

  it('bilinmeyen anahtar da tüm listeyi sıralı döndürür', () => {
    expect(filterUpcomingItems(ornek, 'yok')).toHaveLength(5);
  });

  it('gün filtreleri yalnızca o günün kayıtlarını alır', () => {
    expect(filterUpcomingItems(ornek, 'cuma').map(i => i.title)).toEqual(['Cuma']);
    expect(filterUpcomingItems(ornek, 'cumartesi').map(i => i.title)).toEqual(['Cumartesi']);
    expect(filterUpcomingItems(ornek, 'pazar').map(i => i.title)).toEqual(['Pazar']);
  });

  it('günü olmayan kayıtlar gün filtrelerine düşmez', () => {
    UPCOMING_DAY_KEYS.forEach(gun => {
      filterUpcomingItems(ornek, gun).forEach(item => expect(item.dayKey).toBe(gun));
    });
  });

  it('kaynağı değiştirmez', () => {
    filterUpcomingItems(ornek, 'tumu').pop();
    expect(ornek).toHaveLength(5);
    expect(ornek[0].title).toBe('Uzak');
  });

  it('geçersiz girdide boş liste döndürür', () => {
    expect(filterUpcomingItems(null, 'tumu')).toEqual([]);
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
  it('filtre listesi "tümü" ile başlar ve anahtarları tekildir', () => {
    const anahtarlar = UPCOMING_FILTERS.map(f => f.key);
    expect(anahtarlar[0]).toBe('tumu');
    expect(new Set(anahtarlar).size).toBe(anahtarlar.length);
  });

  it('gün filtreleri listedeki anahtarlarla birebir örtüşür', () => {
    const gunler = UPCOMING_FILTERS.slice(1).map(f => f.key);
    expect(gunler).toEqual(UPCOMING_DAY_KEYS);
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

  it('kampanya bandı yaklaşan planların altında geliyor', () => {
    expect(HOME_BLOCK_PLACEMENT['Yaklaşan Planlar']).toContain('promo');
    expect(HOME_BLOCK_PLACEMENT['Günübirlik Turlar']).not.toContain('promo');
  });

  it('kampanya kartlarında gerekli alanlar var', () => {
    expect(PROMO_BANDS.length).toBeGreaterThan(1);
    PROMO_BANDS.forEach(kampanya => {
      ['img', 'badge', 'title', 'text', 'cta'].forEach(alan => {
        expect(String(kampanya[alan] || '')).not.toBe('');
      });
    });
  });

  it('bülten ve iletişim ayrı bloklar olarak yerleşir', () => {
    const otelAltinda = HOME_BLOCK_PLACEMENT['Oteller'];
    expect(otelAltinda).toContain('newsletter');
    expect(otelAltinda).toContain('support');
    expect(NEWSLETTER_PERKS.length).toBeGreaterThan(0);
  });

  it('iletişim bağlantıları doğru biçimde', () => {
    expect(CONTACT.phoneHref.startsWith('tel:')).toBe(true);
    expect(CONTACT.whatsappHref.startsWith('https://wa.me/')).toBe(true);
  });
});
