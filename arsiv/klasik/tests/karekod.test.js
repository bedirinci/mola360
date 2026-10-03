/* Karekod üretici (assets/js/qr-code.js). Doğruluk bağımsız bir
   çözücüyle ölçülüyor: jsQR (yalnızca test bağımlılığı) üretilen
   matrisi görüntüden okuyup metni geri veriyor. */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Q = require('../assets/js/qr-code.js');
const jsQR = require('jsqr');

/* Matrisi 4 piksel/modül, 4 modül sessiz alanla RGBA görüntüye çevir. */
function oku(m) {
  const olcek = 4, kenar = 4;
  const w = (m.boyut + kenar * 2) * olcek;
  const px = new Uint8ClampedArray(w * w * 4).fill(255);
  for (let y = 0; y < m.boyut; y++) {
    for (let x = 0; x < m.boyut; x++) {
      if (!m.koyu[y][x]) continue;
      for (let dy = 0; dy < olcek; dy++) {
        for (let dx = 0; dx < olcek; dx++) {
          const i = (((y + kenar) * olcek + dy) * w + (x + kenar) * olcek + dx) * 4;
          px[i] = px[i + 1] = px[i + 2] = 0;
        }
      }
    }
  }
  const r = jsQR(px, w, w, { inversionAttempts: 'dontInvert' });
  return r ? r.data : null;
}

describe('karekod', () => {
  it('bilet numarası okunuyor', () => {
    /* 14 bayt: sürüm 1'in (21 × 21) sınırı. */
    const m = Q.karekodMatris('M360-ABCDEF-01');
    expect(m.surum).toBe(1);
    expect(m.boyut).toBe(21);
    expect(oku(m)).toBe('M360-ABCDEF-01');
    expect(Q.karekodMatris('M360-ABCDEF-012').surum).toBe(2);
  });

  it('sürüm 1 – 10 ve her maske okunuyor', () => {
    /* Her sürümün sınırına yakın uzunluk: blok yapısı (tek/çok blok,
       kısa/uzun blok) ve sürüm bilgisi (7+) hepsi deneniyor. */
    [1, 14, 20, 26, 40, 60, 80, 100, 120, 150, 178, 213].forEach(n => {
      const metin = Array.from({ length: n }, (_, i) => 'M360-BILET'.charAt(i % 10)).join('');
      const m = Q.karekodMatris(metin);
      expect(m, 'uzunluk ' + n).toBeTruthy();
      expect(oku(m), 'uzunluk ' + n + ' sürüm ' + m.surum).toBe(metin);
    });
    for (let maske = 0; maske < 8; maske++) {
      expect(oku(Q.karekodMatris('https://bedirinci.github.io/mola360/', maske)), 'maske ' + maske).toBe('https://bedirinci.github.io/mola360/');
    }
  });

  it('Türkçe karakterler UTF-8 ile', () => {
    expect(oku(Q.karekodMatris('Şirince · Çağla Öztürk'))).toBe('Şirince · Çağla Öztürk');
  });

  it('sürüm seçimi kapasiteye göre; sığmayan metin null', () => {
    expect(Q.karekodSurum(14)).toBe(1);
    expect(Q.karekodSurum(15)).toBe(2);
    expect(Q.karekodSurum(213)).toBe(10);
    expect(Q.karekodSurum(214)).toBe(0);
    expect(Q.karekodMatris('x'.repeat(300))).toBe(null);
  });

  it('Reed-Solomon: bilinen örnek (standart ek I, 1-M)', () => {
    /* ISO 18004 ek I: "01234567" sürüm 1-M veri sözcükleri ve 10 hata
       düzeltme sözcüğü. */
    const veri = [16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17];
    expect(Q.karekodKalan(veri, Q.karekodBolen(10))).toEqual([165, 36, 212, 193, 237, 54, 199, 135, 44, 85]);
  });

  it('SVG tek yol, erişilebilir etiketli', () => {
    const svg = Q.karekodSvg('M360-ABCDEF-01', 'Bilet <1>');
    expect(svg).toMatch(/^<svg class="karekod" viewBox="0 0 29 29" role="img" aria-label="Bilet &lt;1>"/);
    expect((svg.match(/<path/g) || []).length).toBe(1);
    expect(Q.karekodSvg('x'.repeat(300))).toBe('');
  });
});
