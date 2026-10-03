/* Arayüz düzeni (7. adım): kart fiyatı ve indirim, anasayfa süzgeçleri,
   açılış ekranı, dil/para tercihi ve paket tur sözleşmesi. Ölçülenler:
     - indirimli kartta liste fiyatı ve yüzde ürünün kendi kaydından
     - kartta sepet düğmesi yok; ok ürüne gidiyor; fiyat binlik ayırıcılı
     - anasayfada elle yazılmış sonuç sayısı ve süzgeç seçeneği yok;
       seçenekler ve sonuçlar liste motorundan
     - açılış ekranı yalnızca ilk girişte
     - para birimi tercihi kuru bilinen birimlerle sınırlı; karşılık
       yaklaşık ve tahsilat TL
     - paket tur sözleşmesi yalnızca konaklamalı turda */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');
const C = require('../assets/js/catalog.js');
const R = require('../assets/js/booking-engine.js');
const S = require('../assets/js/corporate-page.js');
const K = require('../assets/js/corporate-data.js');
const O = require('../assets/js/checkout-page.js');
const { MolaVeri } = require('../assets/js/data-gateway.js');

const app = oku('assets/js/app.js');
const anasayfa = oku('index.html');
const BUGUN = new Date('2026-09-27T10:00:00');

describe('kart: indirim ve fiyat', () => {
  const kartlar = C.catalogAllCards(BUGUN);

  it('indirimli kartın liste fiyatı ve yüzdesi ürün özetiyle aynı', () => {
    const indirimli = kartlar.filter(k => k.discountPct);
    expect(indirimli.length).toBeGreaterThan(0);
    indirimli.forEach(k => {
      expect(Number(k.listPrice)).toBeGreaterThan(Number(k.priceMain));
      const beklenen = Math.round((1 - Number(k.priceMain) / Number(k.listPrice)) * 100);
      expect(k.discountPct, k.title).toBe(beklenen);
    });
    const efes = kartlar.find(k => /Efes Antik Kenti/.test(k.title));
    expect(efes).toMatchObject({ priceMain: '1290', listPrice: '1690', discountPct: 24 });
  });

  it('indirimi olmayan kartta eski fiyat yok', () => {
    kartlar.filter(k => !k.discountPct).forEach(k => expect(k.listPrice, k.title).toBeUndefined());
  });

  it('kartta sepet düğmesi ve sabit ".00" yok; ok ürüne gidiyor', () => {
    expect(app).not.toContain('poi-cart-btn');
    expect(app).not.toContain("svg('basket')");
    expect(app).not.toContain('<span class="decimals">.00</span>');
    expect(app).toMatch(/<a class="poi-go-btn" href="\$\{it\.href\}"/);
    expect(app).toContain('poi-badge-indirim');
    expect(app).toContain("toLocaleString('tr-TR')");
  });
});

describe('anasayfa süzgeçleri', () => {
  it('elle yazılmış sonuç sayısı ve seçenek yok', () => {
    expect(anasayfa).not.toContain('248 sonuç');
    expect(anasayfa).not.toMatch(/data-value="/);
    expect(anasayfa).toContain('id="homeResults"');
  });

  it('liste motoru anasayfada yükleniyor, veri kapısından önce', () => {
    const motor = anasayfa.indexOf('assets/js/listing-engine.js');
    expect(motor).toBeGreaterThan(-1);
    expect(motor).toBeLessThan(anasayfa.indexOf('assets/js/data-gateway.js'));
  });

  it('sonuçlar liste sayfasıyla aynı sorgudan', () => {
    expect(app).toContain('MolaVeri.liste(anaSuzgecSorgusu())');
    expect(app).toContain('MolaVeri.liste({ bugun: new Date() })');
  });

  it('seçim motorun alanlarına çevriliyor; tarih aralığı sabit tarihli ürünü eliyor', async () => {
    const hepsi = await MolaVeri.liste({ bugun: BUGUN });
    const ege = await MolaVeri.liste({ bugun: BUGUN, durum: { secim: { bolge: ['ege'], fiyat: ['0-2500'] }, siralama: 'fiyat-artan' } });
    expect(ege.toplam).toBeGreaterThan(0);
    expect(ege.toplam).toBeLessThan(hepsi.toplam);
    ege.satirlar.forEach(s => {
      expect(s.facets.bolge).toContain('ege');
      expect(s.priceTRY).toBeLessThan(2500);
    });
    const fiyatlar = ege.satirlar.map(s => s.priceTRY);
    expect(fiyatlar).toEqual(fiyatlar.slice().sort((a, b) => a - b));
    const dar = await MolaVeri.liste({ bugun: BUGUN, tarihAraligi: { start: '2026-10-05', end: '2026-10-05' } });
    expect(dar.toplam).toBeLessThan(hepsi.toplam);
    /* Her gün satılan ürün (otel) her aralığa uyar. */
    expect(dar.satirlar.some(s => s.type === 'hotel')).toBe(true);
  });
});

describe('açılış ekranı yalnızca ilk girişte', () => {
  it('daha önce görüldüyse boyanmadan kaldırılıyor; bayrak ilk gösterimde yazılıyor', () => {
    const bas = anasayfa.indexOf('id="siteLoader"');
    const betik = anasayfa.slice(bas, bas + 900);
    expect(betik).toContain("localStorage.getItem('mola360.acilisGoruldu')");
    expect(oku('assets/js/ui.js')).toContain("localStorage.setItem('mola360.acilisGoruldu', '1')");
    expect(K.KRM_DEPO.map(d => d.anahtar)).toContain('mola360.acilisGoruldu');
  });
});

describe('dil ve para birimi', () => {
  beforeEach(() => { MolaVeri.tercihKaydet({ dil: 'tr', para: 'TRY' }); });

  it('varsayılan Türkçe ve TL; yalnızca kuru bilinen para birimi seçilebiliyor', () => {
    expect(MolaVeri.tercihler()).toEqual({ dil: 'tr', para: 'TRY', etiket: 'TR · ₺' });
    expect(MolaVeri.paraBirimleri().map(p => p.kod)).toEqual(['TRY', 'EUR', 'USD']);
    expect(MolaVeri.tercihKaydet({ para: 'GBP' }).tamam).toBe(false);
    expect(MolaVeri.tercihKaydet({ dil: 'en' }).tamam).toBe(false);
    const r = MolaVeri.tercihKaydet({ para: 'EUR' });
    expect(r).toMatchObject({ tamam: true, degisti: true, tercihler: { para: 'EUR', etiket: 'TR · €' } });
  });

  it('karşılık yaklaşık; aynı para biriminde tutar aynen', () => {
    expect(MolaVeri.fiyatGosterimi(1290, 'TRY')).toMatchObject({ tutar: 1290, kisa: 'TL', yaklasik: false });
    const kur = MolaVeri.kur('EUR').oran;
    expect(MolaVeri.fiyatGosterimi(149, 'EUR')).toMatchObject({ tutar: Math.ceil(149 * kur), kisa: 'TL', yaklasik: true });
    expect(MolaVeri.fiyatGosterimi(1290, 'TRY', 'EUR')).toMatchObject({ tutar: Math.round(1290 / kur), kisa: 'EUR', yaklasik: true });
  });

  it('çekmece sol menüden açılıyor; tercih bu tarayıcıda', () => {
    const cerceve = oku('assets/js/site-chrome.js');
    expect(cerceve).toContain('id="tercihCekmece"');
    expect(cerceve).toMatch(/data-tercih-ac[^>]*>.*data-tercih-etiket/);
    expect(cerceve).toContain('Ürün sayfası ve ödeme Türk lirasıyla');
    expect(K.KRM_DEPO.map(d => d.anahtar)).toContain('mola360.tercihler');
  });
});

describe('paket tur sözleşmesi', () => {
  const kapadokya = MolaVeri.urun('tour', 'kapadokya-3-gece');
  const efes = MolaVeri.urun('tour', 'efes-sirince');

  it('yalnızca konaklamalı tur paket tur', () => {
    expect(R.rezPaketTurMu('tour', kapadokya)).toBe(true);
    expect(R.rezPaketTurMu('tour', efes)).toBe(false);
    expect(R.rezPaketTurMu('hotel', MolaVeri.urun('hotel', 'kordon-butik-otel'))).toBe(false);
  });

  it('ödeme adımında konaklamalı turda üçüncü belge ve onay metni', () => {
    const t = R.rezTeklif('tour', kapadokya, { date: '2026-10-15', adults: 2 }, {}, '2026-09-27');
    const g = R.rezTeklif('tour', efes, { date: '2026-10-06', adults: 2 }, {}, '2026-09-27');
    expect(t.paketTur).toBe(true);
    expect(O.odmBelgeleri(t).map(b => b[0])).toEqual(['on-bilgilendirme', 'mesafeli-satis-sozlesmesi', 'paket-tur-sozlesmesi']);
    expect(O.odmBelgeleri(g).map(b => b[0])).toEqual(['on-bilgilendirme', 'mesafeli-satis-sozlesmesi']);
    expect(O.odmBelgeAdlariMetni(t)).toContain('paket tur sözleşmesini');
    expect(O.odmBelgeAdlariMetni(g)).not.toContain('paket tur');
  });

  it('sözleşme rezervasyonun bilgileriyle; bölüm kimlikleri belgeye özgü', () => {
    const t = R.rezTeklif('tour', kapadokya, { date: '2026-10-15', adults: 2 }, {}, '2026-09-27');
    const html = S.krsSozlesmeMarkup('paket-tur-sozlesmesi', t);
    expect(html).toContain('Kapadokya');
    ['esaslı unsurlarında değişiklik', 'Rezervasyonun devri', 'yedi gün', 'Düzenleyicinin sorumluluğu', 'artırılmaz']
      .forEach(x => expect(html, x).toContain(x));
    const ids = [...['on-bilgilendirme', 'mesafeli-satis-sozlesmesi', 'paket-tur-sozlesmesi']
      .map(slug => S.krsSozlesmeMarkup(slug, t)).join('').matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mesafeli satış sözleşmesi paket tur sözleşmesine bağlanıyor', () => {
    const m = K.krmSayfa('mesafeli-satis-sozlesmesi');
    expect(JSON.stringify(m.bolumler)).toContain('(kurumsal/paket-tur-sozlesmesi/)');
    expect(MolaVeri.adres('kurumsal/paket-tur-sozlesmesi/')).toMatchObject({ kind: 'corporate', slug: 'paket-tur-sozlesmesi' });
  });
});

describe('anasayfa bölüm başlıklarının açıklaması', () => {
  it('her şeridin başlığının altında açıklama var', () => {
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    const basliklar = (blok.match(/\{title:'/g) || []).length;
    expect(basliklar).toBeGreaterThan(0);
    expect((blok.match(/subtitle:'[^']+/g) || []).length).toBe(basliklar);
  });

  it('ek bloklarda ve sabit bölümlerde de açıklama var', () => {
    const bloklar = oku('assets/js/home-blocks.js');
    [...bloklar.matchAll(/homeSectionHead\(("[^"]*"|'[^']*'), '[^']*', '([^']*)'/g)]
      .forEach(m => expect(m[2], m[1]).not.toBe(''));
    expect(bloklar).toContain('class="seo-links-lead"');
    expect(anasayfa).toMatch(/<h2>Günün En Çok Satanları<\/h2><p class="section-subtitle">[^<]+<\/p>/);
  });
});

describe('sayfa ilk çizilirken (JS öncesi)', () => {
  it('bildirim rozetinde sabit sayı yok; sayıyı JS yazıyor', () => {
    const cerceve = oku('assets/js/site-chrome.js');
    expect(cerceve).toContain('<span class="notif-badge is-hidden" aria-hidden="true"></span>');
    expect(cerceve).not.toMatch(/class="notif-badge[^"]*">\d+</);
  });

  it('mobilde kaydırma okları hiç yok (stilsiz ikon ekranı kaplamasın)', () => {
    expect(oku('assets/css/style.css')).toMatch(/@media \(max-width: 680px\) \{\s*\.hscroll-arrow, \.hscroll-arrow\.is-visible \{ display: none; \}/);
  });
});
