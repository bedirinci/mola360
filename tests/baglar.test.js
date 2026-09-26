/* Bag butunlugu testleri.

   "Karta tikliyorum, sayfa acilmiyor" sikayeti bu dosyanin sebebi.
   O seferki sebep yayinla ilgiliydi (is main'e girmemisti), ama ayni
   belirtiyi uretebilecek KOD tarafli iki durum var ve ikisi de sessiz:

     1. Kart bir adrese gidiyor ama o adreste dosya yok (yazim hatasi,
        tasinmis sayfa, silinmis slug).
     2. Sayfa icindeki bir bag (kirilma noktasi, alt bilgi, "benzer"
        kartlari) diskte olmayan bir dosyayi gosteriyor.

   Ikisi de tarayicida ancak TIKLAYARAK goruluyor; burada dosya sistemi
   uzerinden dogrulaniyor. Dizin adresi (/otel/<slug>/) index.html'e
   cozuluyor -- GitHub Pages de, npm run dev de boyle davraniyor. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { catalogAllCards } from '../assets/js/catalog.js';
import { MolaVeri } from '../assets/js/data-gateway.js';
import { istenenDosya } from '../scripts/sunucu.js';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (yol) => readFileSync(path.join(KOK, yol), 'utf8');
const BUGUN = '2026-09-21';

/* Bir adresin diskte karsiligi var mi? Dizin adresi index.html'e coz. */
function diskteVar(gorece) {
  const temiz = gorece.split('#')[0].split('?')[0];
  if (!temiz) return true;
  const tam = path.resolve(KOK, temiz);
  if (!existsSync(tam)) return false;
  return statSync(tam).isDirectory() ? existsSync(path.join(tam, 'index.html')) : true;
}

/* Depodaki butun HTML sayfalari (_backup yedekleri haric). */
function htmlSayfalari(dizin = KOK, toplam = []) {
  readdirSync(dizin, { withFileTypes: true }).forEach(giris => {
    if (giris.name.startsWith('.') || giris.name === 'node_modules' || giris.name === '_backup') return;
    const tam = path.join(dizin, giris.name);
    if (giris.isDirectory()) htmlSayfalari(tam, toplam);
    else if (giris.name.endsWith('.html')) toplam.push(path.relative(KOK, tam));
  });
  return toplam;
}

const sayfalar = htmlSayfalari();

describe('kart baglari', () => {
  it('her kart bagi diskte gercek bir sayfaya gidiyor', () => {
    /* Katalogdan uretilen kartlar: adres kaydin slug'indan kuruluyor,
       yani slug ile klasor adi ayrisirsa kart olu bir adrese gider. */
    const kartlar = catalogAllCards(BUGUN).filter(k => k.href);
    expect(kartlar.length).toBeGreaterThan(0);
    kartlar.forEach(kart =>
      expect(diskteVar(kart.href), kart.title + ' -> ' + kart.href + ' diskte yok').toBe(true));
  });

  it('bagi olmayan kart yalnizca sayfasi olmayan ornek urun', () => {
    /* Ornek ozet kaydin (sample: true) detay sayfasi yok; karti bilerek
       baglantisiz. Sayfasi olan bir urunun karti baglantisiz kalamaz. */
    const kapi = MolaVeri;
    const bagsiz = catalogAllCards(BUGUN).filter(k => !k.href);
    expect(bagsiz.length).toBeGreaterThan(0);
    for (const kart of bagsiz) {
      const eslesen = kapi.urunler().filter(k => (k.card && k.card.title || k.title) === kart.title);
      expect(eslesen.length, kart.title).toBeGreaterThan(0);
      expect(eslesen.every(k => k.sample), kart.title + ' sayfasi olan bir urun').toBe(true);
    }
  });

  it('anasayfaya elle yazilmis kart baglari da diskte var', () => {
    /* Su an elle yazilmis icerik bagi yok (katalog uretiyor), ama biri
       eklerse bu test onu da kapsar. */
    const app = oku('assets/js/app.js');
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    [...blok.matchAll(/href:'([^']+)'/g)].map(m => m[1]).forEach(href =>
      expect(diskteVar(href), 'elle yazilmis bag ' + href + ' diskte yok').toBe(true));
  });
});

describe('sayfa ici baglar', () => {
  /* Disa giden adresler (http, tel, mailto), sayfa ici capalar ve
     JS'in kurdugu adresler disarida: burada yalnizca isaretlemeye
     yazilmis GORECE dosya yollari denetleniyor. */
  const atla = (adres) =>
    !adres
    || /^(https?:|tel:|mailto:|data:|javascript:|#|\/\/)/i.test(adres);

  it('her sayfadaki gorece bag diskte var', () => {
    expect(sayfalar.length).toBeGreaterThan(2);
    const kirik = [];
    sayfalar.forEach(sayfa => {
      const html = oku(sayfa);
      const klasor = path.dirname(path.join(KOK, sayfa));
      [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]).forEach(adres => {
        if (atla(adres)) return;
        const hedef = path.relative(KOK, path.resolve(klasor, adres.split('#')[0].split('?')[0]));
        if (!diskteVar(hedef)) kirik.push(sayfa + ' -> ' + adres);
      });
    });
    expect(kirik, 'kirik bag: ' + kirik.join(' | ')).toEqual([]);
  });

  it('her icerik sayfasi anasayfaya geri donebiliyor', () => {
    /* Mobil baslikta geri oku, kirilma noktalarinda anasayfa bagi. */
    sayfalar.filter(s => s.includes('/')).forEach(sayfa => {
      const html = oku(sayfa);
      expect(html, sayfa + ' anasayfaya donmuyor').toMatch(/href="(\.\.\/)+index\.html"/);
    });
  });
});

describe('yerel onizleme sunucusu', () => {
  /* index.html'i cift tiklayip acmak (file://) dizin adreslerini
     cozemedigi icin bagler olu gorunuyor. npm run dev bu sunucuyu
     kaldiriyor ve GitHub Pages gibi davraniyor. */
  it('dizin adresi index.html\'e cozuluyor', () => {
    expect(istenenDosya('/otel/kordon-butik-otel/'))
      .toBe(path.join(KOK, 'otel', 'kordon-butik-otel', 'index.html'));
    expect(istenenDosya('/')).toBe(path.join(KOK, 'index.html'));
    expect(istenenDosya('/tur/efes-sirince/'))
      .toBe(path.join(KOK, 'tur', 'efes-sirince', 'index.html'));
  });

  it('sorgu ve capa atiliyor', () => {
    /* Yayindaki dosyalar ?v=<commit> damgasi tasiyor. */
    expect(istenenDosya('/assets/css/style.css?v=abc1234'))
      .toBe(path.join(KOK, 'assets', 'css', 'style.css'));
    expect(istenenDosya('/otel/kordon-butik-otel/#odalar'))
      .toBe(path.join(KOK, 'otel', 'kordon-butik-otel', 'index.html'));
  });

  it('kok disina cikilamiyor', () => {
    const cikis = istenenDosya('/../../../etc/passwd');
    expect(cikis === null || cikis.startsWith(KOK)).toBe(true);
  });

  it('npm run dev bu sunucuyu calistiriyor', () => {
    const paket = JSON.parse(oku('package.json'));
    expect(paket.scripts.dev).toBe('node scripts/sunucu.js');
  });
});
