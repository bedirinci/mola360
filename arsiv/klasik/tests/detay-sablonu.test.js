/* Ürün detayı şablonu (assets/js/detail-shell.js).

   Dosyası olmayan ürün adresi yönlendiriciye düşüyor ve ürün sayfası
   oradan kuruluyor. İki şey ölçülüyor:

   1) Tam kaydın iskeleti TEK kaynakta ve bugünkü statik sayfalarla aynı:
      bölümler, erişilebilirlik etiketleri, başlık, kırıntı, stil ve
      betik dosyaları. Statik sayfa ile iskelet ayrışırsa yönlendiriciden
      açılan ürün eksik bölümle açılırdı.
   2) Örnek özet kaydın sayfası yalnızca kaydın taşıdığı bilgiyi
      gösteriyor ve satış açmıyor; benzer ürünler kurala göre. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const D = require('../assets/js/detail-shell.js');
const { MolaVeri } = require('../assets/js/data-gateway.js');
const { SAMPLE_PRODUCTS } = require('../assets/js/sample-catalog-data.js');

const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');
const BUGUN = '2026-09-21';

const KABUKLAR = [
  ['tour', 'efes-sirince', 'tur/efes-sirince/index.html'],
  ['tour', 'kapadokya-3-gece', 'tur/kapadokya-3-gece/index.html'],
  ['hotel', 'kordon-butik-otel', 'otel/kordon-butik-otel/index.html'],
  ['activity', 'kapadokya-balon-turu', 'aktivite/kapadokya-balon-turu/index.html'],
  ['event', 'aspendos-opera-bale-festivali', 'etkinlik/aspendos-opera-bale-festivali/index.html'],
  ['venue', 'kum-beach-club', 'mekan/kum-beach-club/index.html'],
  ['venue', 'kordon-spa-masaj', 'mekan/kordon-spa-masaj/index.html']
];

/* İki işaretlemenin karşılaştırılan yüzü: sıralı kimlikler, etiketler,
   başlık metinleri ve bağlar. Yorumlar ve boşluk dışarıda. */
function yuz(html) {
  const govde = html.includes('<body') ? html.slice(html.indexOf('<body')) : html;
  const temiz = govde.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<footer[\s\S]*?<\/footer>/g, '');
  return {
    kimlikler: [...temiz.matchAll(/ id="([^"]+)"/g)].map(m => m[1]),
    etiketler: [...temiz.matchAll(/aria-label="([^"]+)"/g)].map(m => m[1]),
    h1: (temiz.match(/<h1>([^<]*)<\/h1>/) || [])[1],
    lead: (temiz.match(/<p class="tour-lead">([^<]*)<\/p>/) || [])[1],
    mobilBaslik: (temiz.match(/<span class="tour-mobile-title">([^<]*)<\/span>/) || [])[1],
    mobilAlt: (temiz.match(/<span class="tour-mobile-subtitle">([^<]*)<\/span>/) || [])[1],
    kirinti: [...(temiz.match(/<nav class="tour-crumbs"[\s\S]*?<\/nav>/) || [''])[0].matchAll(/<li[^>]*>(?:<a href="([^"]+)">)?([^<]*)/g)]
      .map(m => [m[1] || null, m[2]])
  };
}

const kacisCoz = (s) => String(s || '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');

describe('tam kaydın iskeleti', () => {
  it('statik sayfalarla aynı bölümler, etiketler, başlıklar ve kırıntı', () => {
    KABUKLAR.forEach(([tip, slug, dosya]) => {
      const kayit = MolaVeri.urun(tip, slug);
      const listeYolu = MolaVeri.listeYolu(kayit);
      const listeAdi = MolaVeri.sayfaModeli(MolaVeri.adres(listeYolu), BUGUN).baslik;
      const statik = yuz(oku(dosya));
      const uretilen = yuz(D.dtyIskelet(tip, kayit, '../../', listeYolu, listeAdi));
      expect(uretilen.kimlikler, dosya).toEqual(statik.kimlikler);
      expect(uretilen.etiketler.map(kacisCoz), dosya).toEqual(statik.etiketler);
      expect(kacisCoz(uretilen.h1), dosya).toBe(statik.h1);
      expect(kacisCoz(uretilen.lead), dosya).toBe(statik.lead);
      expect(kacisCoz(uretilen.mobilBaslik), dosya).toBe(statik.mobilBaslik);
      expect(kacisCoz(uretilen.mobilAlt), dosya).toBe(statik.mobilAlt);
      expect(uretilen.kirinti.map(([h, a]) => [h, kacisCoz(a)]), dosya).toEqual(statik.kirinti);
    });
  });

  it('stil ve betik dosyaları statik sayfanınkiyle aynı', () => {
    KABUKLAR.forEach(([tip, , dosya]) => {
      const html = oku(dosya);
      const stiller = [...html.matchAll(/assets\/css\/([a-z-]+\.css)/g)].map(m => m[1]).filter(d => d !== 'style.css');
      expect(D.DTY_TIPLER[tip].css, dosya).toEqual(stiller);
      const betikler = [...html.matchAll(/assets\/js\/([a-z-]+\.js)/g)].map(m => m[1]);
      const sayfaninKendi = betikler.slice(betikler.indexOf('catalog.js') + 1).filter(d => d !== 'ui.js');
      expect(D.DTY_TIPLER[tip].js, dosya).toEqual(sayfaninKendi);
    });
  });

  it('yönlendirici detay şablonunu listing-page.js\'ten önce yüklüyor', () => {
    const y = oku('404.html');
    expect(y.indexOf('src="assets/js/detail-shell.js"')).toBeGreaterThan(0);
    expect(y.indexOf('src="assets/js/detail-shell.js"')).toBeLessThan(y.indexOf('src="assets/js/listing-page.js"'));
  });
});

describe('örnek kaydın özet sayfası', () => {
  const ornekler = Object.entries(SAMPLE_PRODUCTS)
    .flatMap(([tip, kume]) => Object.values(kume).map(k => [tip, k]));

  it('her örnek kaydın kendi seçenekleri var (uydurma yok)', () => {
    ornekler.forEach(([tip, k]) => {
      const s = D.dtySecenekler(tip, k);
      expect(s.length, k.slug).toBeGreaterThan(0);
      s.forEach(x => {
        expect(x.deger, k.slug + ' ' + x.ad).toBeTruthy();
        expect(String(x.deger), k.slug).not.toContain('undefined');
      });
    });
  });

  it('seçeneklerdeki fiyat kaydın kendi fiyatı ve para birimi', () => {
    const ege = SAMPLE_PRODUCTS.tour['ege-adalari-balayi'];
    expect(D.dtySecenekler('tour', ege)[0]).toEqual({ ad: 'Kişi başı', deger: '€149' });
    const otel = SAMPLE_PRODUCTS.hotel['sealight-resort'];
    expect(D.dtySecenekler('hotel', otel)[0].deger).toBe('2.100 TL / gece');
  });

  it('sınıflandırma çipleri gerçek sayfalara gidiyor', () => {
    ornekler.forEach(([tip, k]) => D.dtyCipler(tip, k).forEach(c =>
      expect(MolaVeri.adres(c.path), k.slug + ' → ' + c.path).toBeTruthy()));
  });

  it('satış açılmıyor: rezervasyon düğmesi pasif, detay şablonunun düğmesi yok', () => {
    const [tip, k] = ornekler[0];
    const html = D.dtyOzetMarkup(tip, k, { kart: {}, satir: { price: 780 }, tarihler: ['Yarın'] });
    expect(html).toMatch(/<button class="btn-primary dty-cta" type="button" disabled>/);
    expect(html).not.toContain('tourReserve');
    expect(html).toContain('Ayrıntılı sayfa hazırlanıyor');
  });

  it('başlık kaçışlı', () => {
    const html = D.dtyOzetMarkup('tour', { title: '<b>x</b>', slug: 'x' }, {});
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});

describe('benzer ürünler', () => {
  it('aynı tipten, kendisi hariç, ortak bir yanı olan', () => {
    MolaVeri.urunler().forEach(k => {
      const tip = MolaVeri.icerikTipi(k);
      const t = k.taxonomy || {};
      MolaVeri.benzerler(k, BUGUN, 4).forEach(b => {
        expect(MolaVeri.icerikTipi(b), k.slug).toBe(tip);
        expect(b.slug).not.toBe(k.slug);
        const bt = b.taxonomy || {};
        const ortak = (t.categories || []).some(c => (bt.categories || []).includes(c))
          || (t.themes || []).some(x => (bt.themes || []).includes(x))
          || (MolaVeri.bolge(k) && MolaVeri.bolge(b) && MolaVeri.bolge(k).slug === MolaVeri.bolge(b).slug)
          || (tip === 'tour' && k.type === b.type);
        expect(ortak, k.slug + ' ~ ' + b.slug).toBeTruthy();
      });
    });
  });

  it('ana kategorisi ortak olan önde', () => {
    const ege = MolaVeri.benzerler(MolaVeri.urun('tour', 'alacati-pazar-turu'), BUGUN, 3).map(k => k.slug);
    ege.forEach(s => expect(MolaVeri.urun('tour', s).taxonomy.categories).toContain('ege-turlari'));
  });
});
