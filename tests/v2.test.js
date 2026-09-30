/* Yeni sürüm önizlemesi (/v2/).

   Klasik site yayındayken yeni tasarım /v2/ adresinde büyüyor. Arama
   motoru iki sürümü birden dizine almasın diye sayfa noindex; ziyaretçi
   de her an klasik siteye dönebilmeli. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../v2/index.html', import.meta.url), 'utf8');

describe('v2 önizlemesi', () => {
  it('arama motorlarına kapalı', () => {
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow">/);
  });

  it('klasik siteye dönüş bağı var', () => {
    expect(html).toContain('href="../index.html"');
  });

  it('boş (#) bağ bırakılmamış', () => {
    expect(html).not.toContain('href="#"');
  });
});
