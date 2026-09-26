/* Icerik butunlugu testleri: gorsel ve ikon hatalarini derlemeden once
   yakalar. app.js bir modul olmadigi icin dosya metin olarak okunur. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MolaVeri } from '../assets/js/data-gateway.js';

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const bloklar = readFileSync(new URL('../assets/js/home-blocks.js', import.meta.url), 'utf8');

function kayitliGorseller() {
  const blok = app.match(/const cardImages = \{([\s\S]*?)\n\};/)[1];
  return new Set([...blok.matchAll(/"([^"]+)":/g)].map(m => m[1]));
}
function kategoriGorselleri() {
  const blok = app.match(/const CAT_ICONS = \{([\s\S]*?)\n\}/)[1];
  return new Set([...blok.matchAll(/"([^"]+)":/g)].map(m => m[1]));
}
function ikonAdlari() {
  const blok = app.match(/const ICONS = \{([\s\S]*?)\n\};/)[1];
  return new Set([...blok.matchAll(/^\s*([a-zA-Z0-9]+):/gm)].map(m => m[1]));
}

describe('içerik bütünlüğü', () => {
  it('her kart görseli kayıtlı — sessizce rastgele fotoğrafa düşen yok', () => {
    /* cardImages'te karsiligi olmayan anahtar picsum'a duser: alakasiz
       gorselin en sik kaynagi budur. */
    const kayitli = kayitliGorseller();
    const kategori = kategoriGorselleri();
    const kullanilan = new Set();
    [app, bloklar].forEach(kaynak => {
      for (const m of kaynak.matchAll(/img:\s*'([a-zA-Z0-9_]+)'/g)) kullanilan.add(m[1]);
    });
    const eksik = [...kullanilan].filter(k => !kayitli.has(k) && !kategori.has(k));
    expect(eksik, 'kayıtsız görsel anahtarı: ' + eksik.join(', ')).toEqual([]);
  });

  it('kullanılan her ikon ICONS içinde tanımlı', () => {
    const tanimli = ikonAdlari();
    const kullanilan = new Set();
    for (const m of app.matchAll(/(?:titleIcon|meta1Icon|icon):\s*'([a-zA-Z0-9]+)'/g)) kullanilan.add(m[1]);
    for (const kaynak of [app, bloklar]) {
      for (const m of kaynak.matchAll(/svg\('([a-zA-Z0-9]+)'\)/g)) kullanilan.add(m[1]);
    }
    const eksik = [...kullanilan].filter(k => !tanimli.has(k));
    expect(eksik, 'tanımsız ikon: ' + eksik.join(', ')).toEqual([]);
  });

  it('iki farklı kategori aynı ikonu paylaşmaz', () => {
    const blok = app.match(/const categories = \[([\s\S]*?)\n\];/)[1];
    const esler = [...blok.matchAll(/name:'([^']+)', icon:'([a-zA-Z0-9]+)'/g)];
    const sayac = {};
    esler.forEach(([, ad, ikon]) => { (sayac[ikon] = sayac[ikon] || []).push(ad); });
    const cakisan = Object.entries(sayac).filter(([, a]) => a.length > 1);
    expect(cakisan, 'çakışan: ' + JSON.stringify(cakisan)).toEqual([]);
  });

  it('bir şeritte başlık ikonu ile meta ikonu aynı olmaz', () => {
    const esler = [...app.matchAll(/titleIcon:'([a-zA-Z0-9]+)', meta1Icon:'([a-zA-Z0-9]+)'/g)];
    expect(esler.length).toBeGreaterThan(3);
    esler.forEach(([, baslik, meta]) => expect(baslik).not.toBe(meta));
  });

  it('puanlama yıldızı başka bir kavram için kullanılmaz', () => {
    /* star = puan rozetinin ikonu; kategori vb. baska anlamda kullanilamaz. */
    const blok = app.match(/const categories = \[([\s\S]*?)\n\];/)[1];
    expect(blok).not.toMatch(/icon:'star'/);
  });

  it('gezi noktaları İzmir odaklı', () => {
    const blok = bloklar.match(/const GEZI_NOKTALARI = \[([\s\S]*?)\n\];/)[1];
    const alanlar = [...blok.matchAll(/area:'([^']+)'/g)].map(m => m[1]);
    expect(alanlar.length).toBeGreaterThanOrEqual(6);
    alanlar.forEach(a => expect(a, a).toMatch(/İzmir/));
  });

  it('turlar ve etkinlikler Türkiye geneline yayılır', () => {
    /* Şeritler artık ürün kayıtlarını seçiyor (picks); şehir kartın
       metninde değil kaydın sınıflandırmasında. */
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    const secimler = [...blok.matchAll(/'(tour|hotel|activity|event|venue)\/([a-z0-9-]+)'/g)];
    expect(secimler.length).toBeGreaterThan(10);
    const sehirler = new Set(secimler.map(([, tip, slug]) => {
      const kayit = MolaVeri.urun(tip, slug);
      expect(kayit, tip + '/' + slug + ' kaydı yok').toBeTruthy();
      return kayit.taxonomy.city;
    }));
    ['istanbul', 'izmir', 'ankara', 'antalya'].forEach(s => expect(sehirler.has(s), s + ' geçmiyor').toBe(true));
  });
});
