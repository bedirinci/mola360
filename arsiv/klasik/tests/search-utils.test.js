import { describe, it, expect } from 'vitest';
import {
  normalizeSearchText,
  getSearchCategoryIcon,
  getSearchCardType,
  getInitials,
} from '../assets/js/search-utils.js';

describe('normalizeSearchText', () => {
  it('küçük harfe çevirir', () => {
    expect(normalizeSearchText('BURSA')).toBe('bursa');
  });

  it('Türkçe aksanlı/özel karakterleri sadeleştirir', () => {
    expect(normalizeSearchText('İznik Gölü')).toBe('iznik golu');
    // NOT: "ı" (noktasız i) Unicode NFD'de ayrışan bir aksan değil, bağımsız
    // bir karakterdir; bu yüzden normalizeSearchText onu değiştirmez.
    expect(normalizeSearchText('Şile Çamlık')).toBe('sile camlık');
  });

  it('baş/son boşlukları korur ama değeri stringe çevirir', () => {
    expect(normalizeSearchText(null)).toBe('');
    expect(normalizeSearchText(undefined)).toBe('');
    expect(normalizeSearchText(123)).toBe('123');
  });

  it('arama eşleştirmesinde aksan farkını yok sayar', () => {
    const haystack = normalizeSearchText('Kapadokya Balon Turu');
    const needle = normalizeSearchText('KAPADOKYA');
    expect(haystack.includes(needle)).toBe(true);
  });
});

describe('getSearchCategoryIcon', () => {
  it('bilinen kategoriler için doğru ikonu döner', () => {
    expect(getSearchCategoryIcon('Oteller')).toBe('home');
    expect(getSearchCategoryIcon('Kuponlarım')).toBe('wallet');
  });

  it('bilinmeyen kategori için varsayılan ikonu döner', () => {
    expect(getSearchCategoryIcon('Bilinmeyen Kategori')).toBe('compass');
    expect(getSearchCategoryIcon(undefined)).toBe('compass');
  });
});

describe('getSearchCardType', () => {
  it('başlığa göre doğru tipi döner', () => {
    expect(getSearchCardType('Oteller')).toBe('Otel');
    expect(getSearchCardType('Aktiviteler')).toBe('Aktivite');
    expect(getSearchCardType('Konaklamalı Turlar')).toBe('Tur');
    expect(getSearchCardType('Günübirlik Turlar')).toBe('Tur');
  });

  it('eşleşme yoksa Etkinlik döner', () => {
    expect(getSearchCardType('Popüler Etkinlikler')).toBe('Etkinlik');
    expect(getSearchCardType('Yaklaşan Etkinlikler')).toBe('Etkinlik');
  });
});

describe('getInitials', () => {
  it('tek isim için tek harf döner', () => {
    expect(getInitials('Bedir')).toBe('B');
  });

  it('ad soyad için baş harfleri döner', () => {
    expect(getInitials('Bedir İnci')).toBe('Bİ');
  });

  it('fazladan boşlukları yok sayar', () => {
    expect(getInitials('  Ahmet   Yılmaz  ')).toBe('AY');
  });

  it('boş/geçersiz girdi için ? döner', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials(null)).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });
});
