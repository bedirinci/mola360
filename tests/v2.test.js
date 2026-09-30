/* Yeni mola360 (/v2/).

   v2 klasik siteden bağımsız, ayrı bir site: klasik sitenin verisini,
   motorlarını ve sayfalarını kullanmıyor, ona bağ vermiyor. Klasik
   sitenin testleri v2/'yi taramıyor (tests/baglar.test.js); v2'nin
   kuralları burada. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../v2/index.html', import.meta.url), 'utf8');
const baglar = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);

describe('v2', () => {
  it('yayına hazır olana kadar arama motorlarına kapalı', () => {
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow">/);
  });

  it('klasik siteye bağ vermiyor', () => {
    const disari = baglar.filter(b => b.startsWith('../') || b.startsWith('/') || /bedirinci\.github\.io\/mola360\/(?!v2)/.test(b));
    expect(disari).toEqual([]);
  });

  it('klasik sitenin dosyalarını yüklemiyor', () => {
    expect(html).not.toMatch(/assets\/(js|css)\//);
  });

  it('henüz yapılmamış sayfalar "hazırlanıyor" bağıyla işaretli, boş bağ yok', () => {
    expect(baglar).not.toContain('#');
    baglar.filter(b => b.startsWith('#')).forEach(b => expect(b).toBe('#yakinda'));
  });

  it('dış bağlar yalnızca izinli adreslere', () => {
    const hostlar = new Set(baglar.filter(b => /^https?:/.test(b)).map(b => new URL(b).host));
    hostlar.forEach(h => expect(['fonts.googleapis.com', 'wa.me']).toContain(h));
  });
});
