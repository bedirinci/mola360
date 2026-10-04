/* v2 bilet karekodu: üretilen her kod bağımsız bir çözücüyle (jsQR)
   okunup aynı metin geri alınıyor. */
import { describe, it, expect } from 'vitest';
import jsQR from 'jsqr';
import { karekod } from '../v2/js/karekod.js';

function oku(m) {
  const k = 4, q = 4, n = m.length, w = (n + 2 * q) * k;
  const px = new Uint8ClampedArray(w * w * 4).fill(255);
  m.forEach((row, y) => row.forEach((on, x) => {
    if (!on) return;
    for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) {
      const i = (((y + q) * k + dy) * w + (x + q) * k + dx) * 4;
      px[i] = px[i + 1] = px[i + 2] = 0;
    }
  }));
  const r = jsQR(px, w, w);
  return r && r.data;
}

describe('karekod', () => {
  ['M360-48211', 'M360-T51234', 'M360-T00000', 'Mola360 bileti ğüşiöç', 'x'].forEach(t =>
    it(t, () => expect(oku(karekod(t))).toBe(t)));
  it('uzun metin hata verir', () => expect(() => karekod('x'.repeat(40))).toThrow());
});
