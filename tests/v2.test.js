/* Yeni mola360 (/v2/).

   v2 klasik siteden bağımsız, ayrı bir site: arşivdeki klasik sitenin
   verisini, motorlarını ve sayfalarını kullanmıyor, ona bağ vermiyor.
   v2 birden çok sayfadan oluşuyor (v2/index.html, v2/baglan/, v2/urun/ …);
   ortak stil v2/css/, betikler v2/js/ altında. Kurallar her dosya için. */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const V2 = fileURLToPath(new URL('../v2/', import.meta.url));
const tara = d => readdirSync(d).flatMap(f => {
  const y = join(d, f);
  return statSync(y).isDirectory() ? tara(y) : [y];
});
const dosyalar = tara(V2);
const sayfalar = dosyalar.filter(f => f.endsWith('.html'));
const kodlar = dosyalar.filter(f => /\.(js|css)$/.test(f));
const oku = f => readFileSync(f, 'utf8');
const bagları = f => [...oku(f).matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);

describe('v2', () => {
  it('birden çok sayfa var ve hepsi yayına hazır olana kadar arama motorlarına kapalı', () => {
    expect(sayfalar.length).toBeGreaterThan(1);
    sayfalar.forEach(f => expect(oku(f), relative(V2, f)).toMatch(/<meta name="robots" content="noindex, nofollow">/));
  });

  it('sayfalardaki iç bağlar v2/ dışına çıkmıyor ve var olan bir dosyaya gidiyor', () => {
    sayfalar.forEach(f => bagları(f)
      .filter(b => !/^(https?:|#)/.test(b))
      .forEach(b => {
        const hedef = resolve(dirname(f), b.split(/[?#]/)[0]);
        expect(relative(V2, hedef).startsWith('..'), `${relative(V2, f)} → ${b}`).toBe(false);
        const dosya = b.split(/[?#]/)[0].endsWith('/') || b.split(/[?#]/)[0] === '' ? join(hedef, 'index.html') : hedef;
        expect(existsSync(dosya), `${relative(V2, f)} → ${b}`).toBe(true);
      }));
  });

  it('klasik sitenin dosyalarını yüklemiyor, arşive bağ vermiyor', () => {
    [...sayfalar, ...kodlar].forEach(f => {
      expect(oku(f), relative(V2, f)).not.toMatch(/assets\/(js|css)\//);
      expect(oku(f), relative(V2, f)).not.toMatch(/arsiv\/|bedirinci\.github\.io\/mola360\/(?!v2)/);
    });
  });

  it('henüz yapılmamış sayfalar "hazırlanıyor" bağıyla işaretli, boş bağ yok', () => {
    sayfalar.forEach(f => {
      const b = bagları(f);
      expect(b, relative(V2, f)).not.toContain('#');
      b.filter(x => x.startsWith('#')).forEach(x => expect(x).toBe('#yakinda'));
    });
  });

  it('dış bağlar yalnızca izinli adreslere', () => {
    sayfalar.forEach(f => new Set(bagları(f).filter(b => /^https?:/.test(b)).map(b => new URL(b).host))
      .forEach(h => expect(['fonts.googleapis.com', 'wa.me']).toContain(h)));
  });

  it('her sayfa ortak tokenları ve kendi modülünü yüklüyor', () => {
    sayfalar.forEach(f => {
      const b = bagları(f);
      expect(b.some(x => x.endsWith('css/tokens.css')), relative(V2, f)).toBe(true);
      expect(b.some(x => /js\/[a-z]+\.js$/.test(x)), relative(V2, f)).toBe(true);
    });
  });

  it('örnek veri ÖRNEK diye işaretli (kural 4)', () => {
    expect(oku(join(V2, 'js/data.js'))).toMatch(/ÖRNEK/);
    ['baglan', 'urun', 'liste', 'rezervasyonlar', 'profil'].forEach(s =>
      expect(oku(join(V2, 'js', s + '.js')), s).toMatch(/ÖRNEK/));
  });
});
