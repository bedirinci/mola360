/* İç sayfa ekranları (ürün, liste, ödeme, Hesabım). Ölçülenler:
     - ürün sayfasında rezervasyon kutusu mobilde kısa; seçimler alttan
       açılan çekmecede adım adım (ui.js), beş ürün tipinde aynı kod
     - ürün sayfasında alt menü yok, künye tek kartta kısa liste
     - uydurma "son 24 saatte N kişi" satırı yok; yazılı yorumlar ayrı sayılı
     - "Sayfa etiketleri" yerine yalnızca başka sayfalara giden ilgili bağlar
     - liste kartında puan rozeti kırmızı değil; yaklaşık fiyatın kaynağı yazıyor
     - ödeme: "Bu kişi benim", kupon bağın arkasında, misafire somut kazanç
     - Hesabım: kampanya metni kampanyadan, misafirde iki sekme */
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');
const yorumsuz = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const { MolaVeri } = require('../assets/js/data-gateway.js');
const O = require('../assets/js/checkout-page.js');

const SAYFALAR = ['tour', 'hotel', 'activity', 'event', 'venue'];
const sayfa = Object.fromEntries(SAYFALAR.map(a => [a, oku('assets/js/' + a + '-page.js')]));
const ui = oku('assets/js/ui.js');
const turStil = yorumsuz(oku('assets/css/tour.css'));
const stil = yorumsuz(oku('assets/css/style.css'));

describe('ürün sayfası: rezervasyon çekmecesi', () => {
  it('beş sayfada kutuda "… seç" düğmesi; yapışkan şerit düğmesi pasif değil', () => {
    SAYFALAR.forEach(a => {
      expect(sayfa[a], a).toMatch(/<button class="tour-rez-ac" type="button" data-rez-ac>Tarih ve [a-zçğıöşü]+ seç<\/button>/);
      expect(sayfa[a], a).toContain('id="tourStickyCta">');
    });
  });

  it('1024 px ve altında kutu sayfada kısa: alanlar, döküm ve düğme çekmecede', () => {
    expect(turStil).toMatch(/@media \(max-width: 1024px\) \{\s*\.tour-booking:not\(\.is-cekmecede\) > \.tour-booking-field,\s*\.tour-booking:not\(\.is-cekmecede\) > \.tour-summary,\s*\.tour-booking:not\(\.is-cekmecede\) > \.tour-cta \{ display: none; \}/);
    /* Çekmecede yalnızca o adımın alanı; döküm ve güven satırları son adımda. */
    expect(turStil).toContain('.rez-cekmece .tour-booking > .tour-booking-field:not(.is-rez-aktif)');
    expect(turStil).toContain('.rez-cekmece .tour-booking:not(.is-rez-son) > .tour-summary');
  });

  it('adımlar kutunun alanlarından; kutu taşınıyor, kopyalanmıyor', () => {
    expect(ui).toContain("kart.querySelectorAll(':scope > .tour-booking-field')");
    expect(ui).toContain("parca('[data-rez-govde]').appendChild(kart);");
    expect(ui).toContain("yer = document.createComment('rezervasyon kutusu');");
    expect(ui).not.toMatch(/kart\.cloneNode/);
    /* Son adım sayfanın kendi özetini açıyor. */
    expect(ui).toMatch(/function ileri\(\) \{[\s\S]*?kapat\(true\);\s*rez\.click\(\);/);
  });

  it('yapışkan şeridin düğmesi dar ekranda çekmeceyi açıyor (yakalama evresi)', () => {
    expect(ui).toContain("e.target.closest('#tourStickyCta, [data-rez-ac]')");
    expect(ui).toMatch(/if \(ac\(\)\) \{ e\.preventDefault\(\); e\.stopPropagation\(\); \}\s*\}, true\);/);
  });

  it('aşağı çekince kapanıyor: ortak alt çekmece listesinde', () => {
    expect(ui).toMatch(/\{ secici: '\.rez-cekmece-panel', genislik: 1024, sinif: true,/);
  });
});

describe('ürün sayfası: alt menü ve künye', () => {
  it('ürün sayfasında alt menü yok; şerit en altta', () => {
    expect(turStil).toContain('body:has(#tourStickyBar) .bottom-tab-bar { display: none; }');
    expect(turStil).toMatch(/body:has\(#tourStickyBar\) \.tour-sticky-bar \{\s*bottom: 0;/);
  });

  it('künye mobilde tek kartta kısa liste; ayrıntı satırı yok', () => {
    const blok = turStil.match(/@media \(max-width: 680px\) \{\s*\.tour-facts \{[\s\S]*?\n\}/)[0];
    expect(blok).toContain('.tour-fact-note { display: none; }');
    expect(blok).toMatch(/\.tour-fact \{[^}]*box-shadow: none;/);
  });
});

describe('güven: uydurma sayı yok', () => {
  it('"son 24 saatte N kişi" satırı ve verisi yok', () => {
    SAYFALAR.forEach(a => {
      expect(sayfa[a], a).not.toContain('Son 24 saatte');
      expect(oku('assets/js/' + a + '-data.js'), a).not.toContain('viewedLast24h');
    });
  });

  it('yazılı yorumlar ayrıca sayılıyor (puan dağılımı bütün puanlardan)', () => {
    const v = { tour: 'tour', hotel: 'hotel', activity: 'activity', event: 'event', venue: 'place' };
    SAYFALAR.forEach(a => expect(sayfa[a], a)
      .toContain('<h3 class="tour-review-yazili">Yazılı yorumlar <span>${formatNumberTR(' + v[a] + '.reviews.length)}</span></h3>'));
  });
});

describe('ilgili kategoriler', () => {
  it('"Sayfa etiketleri" yok; sayfa içi bölüm bağları sekmelerde kaldı', () => {
    SAYFALAR.forEach(a => {
      expect(sayfa[a], a).not.toContain('Sayfa etiketleri');
      expect(sayfa[a], a).toContain('<h2>İlgili kategoriler</h2>');
      expect(sayfa[a], a).toContain(".filter(t => String(t.href).charAt(0) !== '#')");
    });
  });
});

describe('liste kartı', () => {
  const app = oku('assets/js/app.js');

  it('puan rozeti beyaz, sarı yıldızlı (kırmızı indirimin rengi)', () => {
    expect(stil).toMatch(/\.poi-status-badge \{[^}]*background: #fff;[^}]*color: var\(--navy-deep\);/);
    expect(stil).not.toMatch(/\.poi-status-badge \{[^}]*#E23B3F/);
  });

  it('yaklaşık fiyatın altında ürünün kendi fiyatı', () => {
    const fn = new Function('paraBirimiEtiketi', app.match(/function kartKaynakFiyati\(tutar, paraBirimi\)\{[\s\S]*?\n\}/)[0] + '; return kartKaynakFiyati;')(
      (k) => ({ TRY: 'TL', EUR: 'EUR', USD: 'USD' })[k] || k);
    expect(fn(199, 'EUR')).toBe('199 EUR');
    expect(fn(1290.4, 'USD')).toBe('1.290 USD');
    expect(app).toContain('${fiyat.yaklasik ? `<span class="poi-price-kaynak">${kartKaynakFiyati(it.priceMain, it.currency)} karşılığı</span>` : \'\'}');
  });
});

describe('rezervasyon özeti', () => {
  it('destek bağları beş sayfada ana düğmenin altında, küçük', () => {
    SAYFALAR.forEach(a => {
      const blok = sayfa[a].match(/<div class="tour-sheet-actions">([\s\S]*?)<\/div>/)[1];
      expect(blok.indexOf('Ödemeye geç'), a).toBeLessThan(blok.indexOf('phoneHref'));
      expect(blok, a).not.toContain('tour-cta ghost');
    });
  });
});

describe('ödeme', () => {
  const odeme = oku('assets/js/checkout-page.js');
  afterEach(() => { delete globalThis.MolaVeri; });

  it('"Bu kişi benim": ilk kişide işaretli; ad ve soyad gizli, iletişimden', () => {
    const html = O.odmKatilimciMarkup([{ rol: 'yetiskin', ad: 'Yetişkin', kimlik: true }, { rol: 'yetiskin', ad: 'Yetişkin', kimlik: true }], 'tour');
    expect(html.match(/data-ben checked/g)).toHaveLength(1);
    expect(html).toContain('<div class="odm-row" data-ben-adlar hidden>');
    /* İkinci kişinin alanları açık. */
    expect(html.match(/data-ben-adlar/g)).toHaveLength(1);
    expect(odeme).toMatch(/const benYaz = \(\) => \{\s*if \(!ben \|\| !ben\.checked\) return;/);
    expect(yorumsuz(oku('assets/css/checkout.css'))).toContain('.odm-row[hidden] { display: none; }');
  });

  it('kupon "Kupon kodun var mı?" bağının arkasında; kod ya da kupon varsa açık', () => {
    expect(odeme).toContain('<details class="odm-coupon-toggle"');
    expect(odeme).toContain("(secenek.kupon || odmKuponCipleri() ? ' open' : '') + '><summary>Kupon kodun var mı?</summary>");
  });

  it('misafire üyelikle bu rezervasyondaki kazanç: kampanyanın oranı ve üst sınırı', () => {
    globalThis.MolaVeri = MolaVeri;
    const bugun = new Date(2026, 9, 1);
    expect(O.odmUyeKazanci({ toplam: 4000 }, bugun)).toBe(600);      // %15
    expect(O.odmUyeKazanci({ toplam: 17980 }, bugun)).toBe(1500);    // en fazla 1.500 TL
    delete globalThis.MolaVeri;
    expect(O.odmUyeKazanci({ toplam: 4000 }, bugun)).toBe(0);
  });

  it('odak çubuğundaki WhatsApp başlıktaki gibi: arka plansız, iki renkli', () => {
    const L = require('../assets/js/listing-page.js');
    const c = L.lspMobilBaslikMarkup('Ödeme', 'mola360', '', { odak: true });
    expect(c).toContain('<path fill="#25D366"');
    expect(stil).toContain('.cubuk-dugme.cubuk-wa { background: transparent; }');
  });
});

describe('Hesabım (misafir)', () => {
  const P = require('../assets/js/account-page.js');
  afterEach(() => { delete globalThis.MolaVeri; });

  it('kampanya cümlesi kampanyadan; kampanya yoksa yok', () => {
    globalThis.MolaVeri = MolaVeri;
    expect(P.hsaMisafirMarkup(new Date(2026, 9, 1))).toContain('Yeni üyelere: İlk rezervasyonda %15 indirim.');
    delete globalThis.MolaVeri;
    expect(P.hsaMisafirMarkup(new Date(2026, 9, 1))).not.toContain('%');
  });
});
