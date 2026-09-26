/* Slug testleri.

   Slug adresin kendisi: bir kez yayınlanıp paylaşıldıktan sonra değişmesi
   eski bağları kırar. Bu yüzden üretici katı ve öngörülebilir olmalı:
   aynı başlık her zaman aynı adresi, Türkçe harfler her zaman aynı ASCII
   harfi vermeli ve sonuç backend'in is_slug() kısıtından geçmeli. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  slugOlustur,
  slugGecerli,
  benzersizSlug,
  SLUG_EN_UZUN,
} from '../assets/js/slug-utils.js';

describe('slugOlustur', () => {
  it('belgedeki örnek', () => {
    expect(slugOlustur('Karadeniz Yaylaları ve Batum Turu')).toBe('karadeniz-yaylalari-ve-batum-turu');
  });

  it('büyük İ ve I bozuk karakter bırakmıyor', () => {
    /* 'İ'.toLowerCase() "i" + U+0307 üretir; slug'da görünmez bir
       karakter kalırdı. */
    expect(slugOlustur('İSTANBUL')).toBe('istanbul');
    expect(slugOlustur('IĞDIR')).toBe('igdir');
    expect(slugOlustur('Iğdır')).toBe('igdir');
    expect(slugOlustur('İzmir')).toBe('izmir');
    for (const s of ['İSTANBUL', 'IĞDIR', 'İNCİ', 'ŞİRİNCE']) {
      expect(slugOlustur(s)).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('bütün Türkçe harfler', () => {
    expect(slugOlustur('Çeşme Şirince Ğ Ü Ö ç ş ğ ü ö ı')).toBe('cesme-sirince-g-u-o-c-s-g-u-o-i');
    expect(slugOlustur('Kâğıt Hamamı')).toBe('kagit-hamami');
  });

  it('noktalama ve boşluk tek tireye iniyor', () => {
    expect(slugOlustur('  Kapadokya — 3 Gece / 4 Gün!  ')).toBe('kapadokya-3-gece-4-gun');
    expect(slugOlustur('Efes & Şirince (Tam Gün)')).toBe('efes-sirince-tam-gun');
    expect(slugOlustur('Doğa & Yayla')).toBe('doga-yayla');
  });

  it('diğer dillerdeki aksanlar harfin kendisine iniyor', () => {
    expect(slugOlustur('Café Noël São')).toBe('cafe-noel-sao');
  });

  it('boş ve anlamsız girdi boş slug veriyor', () => {
    expect(slugOlustur('')).toBe('');
    expect(slugOlustur(null)).toBe('');
    expect(slugOlustur(undefined)).toBe('');
    expect(slugOlustur('— / !')).toBe('');
  });

  it('uzun başlık sınırda kesiliyor ve sonda tire kalmıyor', () => {
    const uzun = 'Karadeniz Yaylaları '.repeat(10);
    const s = slugOlustur(uzun);
    expect(s.length).toBeLessThanOrEqual(SLUG_EN_UZUN);
    expect(s.endsWith('-')).toBe(false);
    expect(slugGecerli(s)).toBe(true);
  });

  it('ürettiği her slug backend kısıtından geçiyor', () => {
    const ornekler = ['Kapadokya Turu — 3 Gece 4 Gün', 'Kum Beach Club', 'Kordon Spa & Masaj',
      'Aspendos Opera ve Bale Festivali', 'Uzak Doğu Turları', 'GAP Turları', '1001 Gece'];
    for (const o of ornekler) expect(slugGecerli(slugOlustur(o)), o).toBe(true);
  });
});

describe('slugGecerli', () => {
  it('backend is_slug() ile aynı kural', () => {
    expect(slugGecerli('kapadokya-3-gece')).toBe(true);
    expect(slugGecerli('a')).toBe(true);
    expect(slugGecerli('')).toBe(false);
    expect(slugGecerli('-bas')).toBe(false);
    expect(slugGecerli('son-')).toBe(false);
    expect(slugGecerli('cift--tire')).toBe(false);
    expect(slugGecerli('Buyuk')).toBe(false);
    expect(slugGecerli('çeşme')).toBe(false);
  });
});

describe('benzersizSlug', () => {
  it('çakışma yoksa taban', () => {
    expect(benzersizSlug('Efes Turu', [])).toBe('efes-turu');
  });

  it('çakışmada sayı ekliyor, üzerine yazmıyor', () => {
    expect(benzersizSlug('Efes Turu', ['efes-turu'])).toBe('efes-turu-2');
    expect(benzersizSlug('Efes Turu', new Set(['efes-turu', 'efes-turu-2']))).toBe('efes-turu-3');
  });

  it('sayı eklenince sınır aşılmıyor', () => {
    const uzun = 'a'.repeat(SLUG_EN_UZUN);
    const s = benzersizSlug(uzun, [uzun]);
    expect(s.length).toBeLessThanOrEqual(SLUG_EN_UZUN);
    expect(s.endsWith('-2')).toBe(true);
    expect(slugGecerli(s)).toBe(true);
  });

  it('boş başlık yine geçerli bir slug veriyor', () => {
    expect(slugGecerli(benzersizSlug('!!!', []))).toBe(true);
  });
});

/* Göç betiği mevcut veriyi aktarırken aynı algoritmayı kullanıyor. İki
   uygulama ayrışırsa panelin önerdiği adres ile göçün yazdığı adres
   farklı olur. Betik veritabanına bağlandığı için doğrudan içe
   aktarılamıyor; fonksiyon kaynaktan çıkarılıp tek başına çalıştırılıyor. */
describe('backend ile aynı sonuç', () => {
  const kaynak = readFileSync(new URL('../backend/scripts/import-legacy.js', import.meta.url), 'utf8');
  const harf = kaynak.match(/const TR_HARF = \{[\s\S]*?\};/);
  const fonk = kaynak.match(/function slugla\(v\) \{[\s\S]*?\n\}/);

  it('göç betiğinde slug fonksiyonu bulunuyor', () => {
    expect(harf).toBeTruthy();
    expect(fonk).toBeTruthy();
  });

  it('aynı girdiler aynı slug', () => {
    const ctx = vm.createContext({ String });
    vm.runInContext(
      'const metin = (v) => (v === undefined || v === null ? "" : String(v));\n'
      + harf[0] + '\n' + fonk[0], ctx);
    const girdiler = ['Karadeniz Yaylaları ve Batum Turu', 'İSTANBUL', 'Iğdır', 'Kâğıt Hamamı',
      'Café Noël', '  Kapadokya — 3 Gece / 4 Gün!  ', '', 'Karadeniz Yaylaları '.repeat(10)];
    for (const g of girdiler) {
      ctx.girdi = g;
      expect(vm.runInContext('slugla(girdi)', ctx), JSON.stringify(g)).toBe(slugOlustur(g));
    }
  });
});
