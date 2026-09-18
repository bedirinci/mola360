import { describe, it, expect } from 'vitest';
import {
  HOME_BLOCK_PLACEMENT,
  WEEKEND_DAYS,
  WEEKEND_ITEMS,
  THEME_COLLECTIONS,
  GRID_COLLECTIONS,
  TRUST_ITEMS,
  filterWeekendItems,
  isValidEmail,
} from '../assets/js/home-blocks.js';

describe('filterWeekendItems', () => {
  const ornek = [
    { day: 'bugun', title: 'A' },
    { day: 'pazar', title: 'B' },
    { day: 'bugun', title: 'C' },
  ];

  it('verilen güne ait kayıtları döndürür', () => {
    expect(filterWeekendItems(ornek, 'bugun').map(i => i.title)).toEqual(['A', 'C']);
  });

  it('gün verilmezse tümünü döndürür', () => {
    expect(filterWeekendItems(ornek)).toHaveLength(3);
  });

  it('eşleşme yoksa boş liste döndürür', () => {
    expect(filterWeekendItems(ornek, 'cumartesi')).toEqual([]);
  });

  it('kaynağı değiştirmez', () => {
    filterWeekendItems(ornek).pop();
    expect(ornek).toHaveLength(3);
  });

  it('geçersiz girdide boş liste döndürür', () => {
    expect(filterWeekendItems(null, 'bugun')).toEqual([]);
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

describe('blok verileri', () => {
  it('her hafta sonu günü için en az bir kayıt vardır', () => {
    WEEKEND_DAYS.forEach(gun => {
      expect(filterWeekendItems(WEEKEND_ITEMS, gun.key).length).toBeGreaterThan(0);
    });
  });

  it('hafta sonu kayıtlarının günü tanımlı günlerden biridir', () => {
    const gecerli = WEEKEND_DAYS.map(g => g.key);
    WEEKEND_ITEMS.forEach(item => expect(gecerli).toContain(item.day));
  });

  it('yerleşim haritasındaki bölüm başlıkları tekildir', () => {
    const anahtarlar = Object.keys(HOME_BLOCK_PLACEMENT);
    expect(new Set(anahtarlar).size).toBe(anahtarlar.length);
  });

  it('koleksiyon ve güven blokları boş değildir', () => {
    expect(THEME_COLLECTIONS.length).toBeGreaterThan(0);
    expect(GRID_COLLECTIONS.length).toBeGreaterThan(0);
    expect(TRUST_ITEMS.length).toBeGreaterThan(0);
  });
});
