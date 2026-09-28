/* Sayfa başlıkları ve liste sayfası (8. adım). Ölçülenler:
     - masaüstü başlıkta dil/para, Yardım menüsü (WhatsApp + yardım
       sayfaları); misafirde yalnızca giriş düğmesi, profil ve zil üyede
     - mobil sayfa çubuğu: akıllı geri, logo → başlık, arama ve menü;
       ödeme adımında odak çubuğu (arama/menü yok, güvenli ödeme, WhatsApp)
     - ürün sayfalarının çubuğu (statik kabuk ve şablon) liste sayfasına
       dönüyor, arama ve menü taşıyor; favori/paylaş banner'da kalıyor
     - "Ne zaman, kaç kişi?" seçimi adreste; kart bağıyla ürün sayfasına
       geçiyor, ürün sayfası rezervasyon kutusunu onunla açıyor
     - kartta kampanya satırı rezervasyon motorundaki kampanyadan
     - misafire liste arasında üyelik bandı, kampanyadan */
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');
const L = require('../assets/js/listing-page.js');
const C = require('../assets/js/catalog.js');
const R = require('../assets/js/booking-engine.js');
const D = require('../assets/js/detail-shell.js');
const { MolaVeri } = require('../assets/js/data-gateway.js');

const cerceve = oku('assets/js/site-chrome.js');
const app = oku('assets/js/app.js');
const stil = oku('assets/css/style.css');
const listeStil = oku('assets/css/listing.css');
const odemeStil = oku('assets/css/checkout.css');
const yorumsuz = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('masaüstü başlık', () => {
  const baslik = cerceve.match(/<header class="site-header">[\s\S]*?<\/header>/)[0];

  it('dil/para düğmesi tercih çekmecesini açıyor ve etiketi taşıyor', () => {
    expect(baslik).toMatch(/class="header-pref-btn" data-tercih-ac/);
    expect(baslik).toContain('<span data-tercih-etiket>TR · ₺</span>');
  });

  it('Yardım menüsünde WhatsApp canlı destek ve yardım sayfaları', () => {
    const panel = baslik.match(/<div class="header-help-panel"[\s\S]*?<\/div>\s*<\/div>/)[0];
    expect(baslik).toMatch(/id="headerHelpBtn"[^>]*aria-expanded="false"[^>]*aria-controls="headerHelpPanel"/);
    expect(panel).toContain('data-destek-whatsapp');
    expect(panel).toContain('data-destek-saat');
    expect(panel).toContain('data-destek-durum');
    ['kurumsal/yardim/', 'kurumsal/sss/', 'kurumsal/iptal-iade/', 'kurumsal/iletisim/']
      .forEach(yol => expect(panel).toContain('href="' + yol + '"'));
    /* Paneldeki bağlar gerçek sayfalar. */
    ['yardim', 'sss', 'iptal-iade', 'iletisim'].forEach(slug => expect(MolaVeri.adres('kurumsal/' + slug)).toBeTruthy());
    /* Açma/kapama, dışarı tıklama ve Escape app.js'te. */
    expect(app).toContain("getElementById('headerHelpBtn')");
    expect(app).toMatch(/initYardimMenusu[\s\S]*?Escape/);
  });

  it('WhatsApp saatleri ve durumu iletişim kaydından', () => {
    const blok = app.match(/function destekBaglariniDoldur\(\)\{[\s\S]*?\n\}\)\(\);/)[0];
    expect(blok).toContain('c.whatsappOpenHour');
    expect(blok).toContain('c.whatsappCloseHour');
    expect(blok).toContain('supportOnline(');
  });

  it('misafirde yalnızca giriş düğmesi; profil ve zil üyede', () => {
    const css = yorumsuz(stil);
    expect(css).toMatch(/body:not\(\.is-uye\) \.header-profile-btn \{ display: none; \}/);
    expect(css).toMatch(/body:not\(\.is-uye\) \.header-notif-btn:not\(\.has-notif\) \{ display: none; \}/);
    expect(css).toContain('body.is-uye #headerRegisterBtn { display: none; }');
    /* Misafirde zil, gösterecek bildirimi varsa görünüyor. */
    expect(app).toContain("zil.classList.toggle('has-notif', notifications.length > 0)");
    /* Giriş düğmesi dar ekranda kısalıyor: "/ Üye Ol" ayrı parçada. */
    expect(baslik).toContain('Giriş Yap<span class="header-register-long"> / Üye Ol</span>');
    expect(css).toContain('@media (max-width: 680px) {\n  .header-right { gap: 6px; }\n  .header-register-long { display: none; }');
  });

  it('bozuk mobil düğme seçicisi düzeltildi', () => {
    expect(stil).not.toContain('.header-actions  .header-actions .btn-primary');
  });

  it('mobil anasayfa başlığında WhatsApp düğmesi', () => {
    expect(baslik).toMatch(/class="header-wa-btn" data-destek-whatsapp target="_blank" rel="noopener" aria-label="WhatsApp canlı destek"/);
  });
});

describe('ödeme adımı: odak başlığı', () => {
  it('masaüstünde arama, menü, tercih, hesap ve bildirim gizli; güvenli ödeme ve Yardım kalıyor', () => {
    const css = yorumsuz(stil);
    ['.header-search', '.header-menu-btn', '.header-pref-btn', '.header-quick-btn', '.header-notif-btn', '.header-actions']
      .forEach(sec => expect(css).toContain('body[data-rota="checkout"] ' + sec));
    expect(css).not.toContain('body[data-rota="checkout"] .header-help');
    expect(css).toMatch(/body\[data-rota="checkout"\] \.header-guvenli \{\s*display: inline-flex;/);
    expect(cerceve).toContain('class="header-guvenli"');
  });

  it('mobilde alt menü gizli, ödeme çubuğu en altta', () => {
    expect(yorumsuz(stil)).toContain('body[data-rota="checkout"] .bottom-tab-bar { display: none !important; }');
    expect(yorumsuz(odemeStil)).toMatch(/body\[data-rota="checkout"\] \.odm-bar:not\(\[hidden\]\) \{\s*bottom: 0;/);
  });

  it('ödeme ekranı odak çubuğunu kullanıyor', () => {
    expect(oku('assets/js/checkout-page.js')).toContain('lspMobilBaslikMarkup(baslik, alt, geri, { odak: true })');
  });
});

describe('mobil sayfa çubuğu', () => {
  const cubuk = L.lspMobilBaslikMarkup('Turlar', '14 tur', 'turlar/kapadokya-turlari');

  it('geri oku bir üst sayfaya gidiyor ve akıllı', () => {
    expect(cubuk).toContain('<a class="lst-mobile-back" href="turlar/kapadokya-turlari/" data-akilli-geri aria-label="Geri">');
  });

  it('başta logo, sonra başlık; arama ve menü', () => {
    expect(cubuk).toMatch(/^<div class="lst-mobile-header" data-sayfa-cubugu data-cubuk-gizlenir>/);
    expect(cubuk).toContain('class="cubuk-logo" href="./"');
    expect(cubuk).toContain('<span class="lst-mobile-title">Turlar</span>');
    expect(cubuk).toContain('id="lstMobileSearch"');
    expect(cubuk).toMatch(/data-menu-ac aria-expanded="false" aria-label="Menüyü aç"/);
    expect(cubuk).toContain('data-menu-ikon');
  });

  it('"mola360" alt satırı logo varken tekrarlanmıyor', () => {
    const c = L.lspMobilBaslikMarkup('Hakkımızda', 'mola360', '');
    expect(c).toContain('<span class="lst-mobile-subtitle" id="lstMobileSub" hidden></span>');
  });

  it('odak çubuğu: arama ve menü yok; güvenli ödeme ve WhatsApp var; gizlenmiyor', () => {
    const c = L.lspMobilBaslikMarkup('Ödeme', 'Efes', 'tur/efes-sirince', { odak: true });
    expect(c).toContain('data-cubuk-odak');
    expect(c).not.toContain('data-cubuk-gizlenir');
    expect(c).not.toContain('lstMobileSearch');
    expect(c).not.toContain('data-menu-ac');
    expect(c).toContain('Güvenli ödeme');
    expect(c).toMatch(/class="cubuk-dugme cubuk-wa" href="[^"]+" data-destek-whatsapp/);
  });

  it('başlık geçişi, gizlenme ve menü davranışı app.js\'te', () => {
    expect(app).toContain('function mola360SayfaCubugu()');
    expect(app).toContain("cubuk.classList.toggle('is-baslikli'");
    expect(app).toContain("cubuk.hasAttribute('data-cubuk-gizlenir')");
    expect(app).toMatch(/closest\('\[data-menu-ac\]'\)\) toggleDrawer\(\)/);
    /* Menü çubuğun altından açılıyor: çekmece çizgisi görünen çubuğa göre. */
    expect(app).toMatch(/function syncMobileDrawerPosition\(\) \{[\s\S]*?mola360SayfaCubugu\(\)/);
    /* Menü açıkken sayfa kilitlenince çubuk yerinde donuyor. */
    expect(app).toContain("['.lst-mobile-header', '--m360-cubuk-freeze']");
    expect(yorumsuz(stil)).toContain('body.m360-scroll-locked .lst-mobile-header { position: relative; top: var(--m360-cubuk-freeze, 0px); }');
    expect(yorumsuz(stil)).toContain('body.cubuk-gizli .lst-toolbar { top: 0; }');
  });

  it('akıllı geri yalnızca site içinden gelindiyse geçmişe dönüyor', () => {
    const f = app.match(/function mola360OncekiSayfaSitede\(\) \{[\s\S]*?\n\}/)[0];
    expect(f).toContain('document.referrer');
    expect(f).toContain('onceki.origin === location.origin');
    expect(app).toMatch(/\[data-akilli-geri\][\s\S]*?window\.history\.back\(\)/);
  });
});

describe('ürün sayfası çubuğu', () => {
  const KABUKLAR = [
    ['tour', 'efes-sirince', 'tur/efes-sirince/index.html'],
    ['hotel', 'kordon-butik-otel', 'otel/kordon-butik-otel/index.html'],
    ['venue', 'kum-beach-club', 'mekan/kum-beach-club/index.html']
  ];

  it('statik kabukta ve şablonda aynı: liste sayfasına akıllı geri, arama ve menü', () => {
    KABUKLAR.forEach(([tip, slug, dosya]) => {
      const kayit = MolaVeri.urun(tip, slug);
      const listeYolu = MolaVeri.listeYolu(kayit);
      const statik = oku(dosya).match(/<div class="tour-mobile-header" data-sayfa-cubugu>[\s\S]*?\n<\/div>/)[0];
      expect(statik, dosya).toContain('href="../../' + listeYolu + '/" data-akilli-geri aria-label="Geri"');
      const uretilen = D.dtyIskelet(tip, kayit, '../../', listeYolu, 'Liste').match(/<div class="tour-mobile-header"[\s\S]*?<main/)[0];
      expect(uretilen, dosya).toContain('href="../../' + listeYolu + '/" data-akilli-geri aria-label="Geri"');
      [statik, uretilen].forEach(m => {
        expect(m).toContain('data-ara-ac');
        expect(m).toContain('data-menu-ac');
        expect(m).not.toContain('tourGalleryFav');
      });
    });
    expect(app).toMatch(/closest\('\[data-ara-ac\]'\) && typeof openSearchOverlay === 'function'\) openSearchOverlay\(\)/);
  });
});

describe('ne zaman, kaç kişi?', () => {
  it('adres okunuyor ve doğrulanıyor', () => {
    expect(C.katalogPlanOku('?tarih=2026-10-10&bitis=2026-10-12&kisi=3&q=x'))
      .toEqual({ tarih: '2026-10-10', bitis: '2026-10-12', kisi: 3 });
    /* Olmayan gün, sıfır kişi, sınır üstü ve tersine aralık düşüyor. */
    expect(C.katalogPlanOku('tarih=2026-02-30&kisi=0')).toEqual({ tarih: null, bitis: null, kisi: null });
    expect(C.katalogPlanOku('tarih=2026-10-10&bitis=2026-10-09&kisi=21')).toEqual({ tarih: '2026-10-10', bitis: null, kisi: null });
    expect(C.katalogPlanOku('bitis=2026-10-12&kisi=2.5')).toEqual({ tarih: null, bitis: null, kisi: null });
  });

  it('bağa ekleniyor; seçim yoksa bağ aynı', () => {
    expect(C.katalogPlanBagi('tur/efes-sirince/', { tarih: '2026-10-10', kisi: 3 })).toBe('tur/efes-sirince/?tarih=2026-10-10&kisi=3');
    expect(C.katalogPlanBagi('arama/?q=a#x', { tarih: '2026-10-10', bitis: '2026-10-11' })).toBe('arama/?q=a&tarih=2026-10-10&bitis=2026-10-11#x');
    expect(C.katalogPlanBagi('tur/efes-sirince/', {})).toBe('tur/efes-sirince/');
  });

  it('ürünün satış tarihlerinden aralığa uyan ilk gün ve otelde gece sayısı', () => {
    expect(C.katalogPlanTarihi(['2026-10-06', '2026-10-13'], { tarih: '2026-10-10', bitis: '2026-10-14' })).toBe('2026-10-13');
    expect(C.katalogPlanTarihi(['2026-10-06'], { tarih: '2026-10-10' })).toBe(null);
    expect(C.katalogPlanGecesi({ tarih: '2026-10-10', bitis: '2026-10-13' })).toBe(3);
    expect(C.katalogPlanGecesi({ tarih: '2026-10-10' })).toBe(null);
  });

  it('kutunun metni', () => {
    expect(L.lspPlanEtiketi({}, false)).toEqual({ tarih: 'Tüm tarihler', kisi: '2 kişi' });
    expect(L.lspPlanEtiketi({ tarih: '2026-10-03', bitis: '2026-10-04', kisi: 4 }, false)).toEqual({ tarih: '3–4 Eki', kisi: '4 kişi' });
    expect(L.lspPlanEtiketi({ tarih: '2026-10-30', bitis: '2026-11-01' }, true).tarih).toBe('30 Eki – 1 Kas · 2 gece');
    expect(L.lspPlanEtiketi({}, true).tarih).toBe('Giriş – çıkış seç');
  });

  it('hızlı seçimler bugüne göre', () => {
    const pazartesi = L.lspPlanOnAyarlari(new Date('2026-09-28T10:00:00'), false);
    expect(pazartesi.map(o => [o.slug, o.tarih, o.bitis])).toEqual([
      ['haftasonu', '2026-10-03', '2026-10-04'],
      ['7-gun', '2026-09-28', '2026-10-04'],
      ['30-gun', '2026-09-28', '2026-10-27']
    ]);
    /* Pazar günü "bu hafta sonu" yalnızca bugün. */
    expect(L.lspPlanOnAyarlari(new Date('2026-10-04T10:00:00'), false)[0]).toMatchObject({ tarih: '2026-10-04', bitis: null });
    /* Otel: cuma girişi, pazar çıkışı; cumartesi açılırsa o geceden. */
    expect(L.lspPlanOnAyarlari(new Date('2026-09-28T10:00:00'), true).map(o => o.tarih + '>' + o.bitis))
      .toEqual(['2026-10-02>2026-10-04', '2026-10-09>2026-10-11']);
    expect(L.lspPlanOnAyarlari(new Date('2026-10-03T10:00:00'), true).map(o => o.tarih + '>' + o.bitis))
      .toEqual(['2026-10-03>2026-10-04', '2026-10-09>2026-10-11']);
  });

  it('kutu otel listesinde giriş–çıkış diyor', () => {
    expect(L.lspKonaklamaMi({ temel: { type: 'hotel' } })).toBe(true);
    expect(L.lspKonaklamaMi({ temel: { type: 'tour' } })).toBe(false);
    expect(L.lspPlanKutusuMarkup({}, true)).toContain('<small>Giriş – çıkış</small>');
    expect(L.lspPlanKutusuMarkup({}, false)).toContain('<small>Ne zaman?</small>');
    expect(L.lspPlanKutusuMarkup({}, false)).toMatch(/id="lstPlanBtn" aria-haspopup="dialog" aria-expanded="false" aria-controls="lstPlanPanel"/);
  });

  it('seçim tarih aralığıyla listeyi süzüyor', async () => {
    const temel = { type: 'tour' };
    const tumu = await MolaVeri.liste({ temel, bugun: new Date('2026-09-28T10:00:00') });
    const haftasonu = await MolaVeri.liste({ temel, bugun: new Date('2026-09-28T10:00:00'), tarihAraligi: { start: '2026-10-03', end: '2026-10-04' } });
    expect(haftasonu.toplam).toBeGreaterThan(0);
    expect(haftasonu.toplam).toBeLessThan(tumu.toplam);
    expect(oku('assets/js/listing-page.js')).toContain('tarihAraligi = plan.tarih ? { start: plan.tarih, end: plan.bitis || plan.tarih } : null');
  });

  it('ürün sayfaları rezervasyon kutusunu seçimle açıyor', () => {
    [['tour', 'adults: plan.kisi || 2'], ['hotel', 'adults: plan.kisi || 2'], ['activity', 'adults: plan.kisi || 2'],
      ['event', 'full: plan.kisi || 2'], ['venue', 'guests: plan.kisi || 2']].forEach(([tip, kisi]) => {
      const js = oku('assets/js/' + tip + '-page.js');
      expect(js, tip).toContain('katalogPlanOku(window.location.search)');
      expect(js, tip).toContain(kisi);
    });
    /* Seçilen gün kısa listede değilse tarih listesi açık başlıyor ve
       düğmenin yazısı durumu söylüyor. */
    const tur = oku('assets/js/tour-page.js');
    expect(tur).toContain('allDates: tarihler.indexOf(planTarihi) >= DATE_CHIPS_SHORT');
    expect(tur).toContain('aria-expanded="${state.allDates}">${state.allDates ? \'Daha az tarih\' : \'Tüm tarihler\'}</button>');
    /* Otelde tarih giriş, bitiş çıkış: gece sayısı sınırlar içindeyse. */
    expect(oku('assets/js/hotel-page.js')).toMatch(/nights: planGecesi && planGecesi >= \(p\.minNights \|\| 1\) && \(!p\.maxNights \|\| planGecesi <= p\.maxNights\)/);
  });
});

describe('liste kartları: seçim bağı ve üyelik bandı', () => {
  afterEach(() => {
    delete globalThis.KATALOG_KART;
    delete globalThis.poiCardMarkup;
    delete globalThis.katalogPlanBagi;
  });
  const kur = () => {
    globalThis.KATALOG_KART = { tour: (k) => ({ href: 'tur/' + k.slug + '/' }) };
    globalThis.poiCardMarkup = (sec, k) => '<a href="' + k.href + '"></a>';
    globalThis.katalogPlanBagi = C.katalogPlanBagi;
  };
  const satirlar = (n) => Array.from({ length: n }, (_, i) => ({ type: 'tour', kayit: { slug: 'u' + i } }));

  it('seçim kart bağlarına geçiyor', () => {
    kur();
    const m = L.lspKartlarMarkup(satirlar(2), new Date(), { tarih: '2026-10-10', kisi: 3 });
    expect(m).toBe('<a href="tur/u0/?tarih=2026-10-10&kisi=3"></a><a href="tur/u1/?tarih=2026-10-10&kisi=3"></a>');
  });

  it('bant dördüncü karttan sonra; az kartta sonda; kart yoksa yok', () => {
    kur();
    const bant = '<aside data-uyelik-bandi></aside>';
    const sirasi = (m) => m.split(/(?=<a |<aside)/).indexOf(bant);
    expect(L.LSP_BANT_SIRASI).toBe(4);
    expect(sirasi(L.lspKartlarMarkup(satirlar(9), new Date(), null, bant))).toBe(4);
    expect(sirasi(L.lspKartlarMarkup(satirlar(2), new Date(), null, bant))).toBe(2);
    expect(L.lspKartlarMarkup([], new Date(), null, bant)).toBe('');
  });

  it('bant üyeye özel ilk rezervasyon kampanyasından; kampanya yoksa boş', () => {
    const k = MolaVeri.kampanyalar(new Date('2026-09-28T10:00:00')).find(x => x.uyeOzel && x.ilkRezervasyon);
    const m = L.lspUyelikBandiMarkup(k);
    expect(m).toContain('Üyelere özel: ' + k.ad);
    expect(m).toContain('data-uyelik-ol');
    expect(L.lspUyelikBandiMarkup(null)).toBe('');
    /* Yalnızca misafire; giriş yapılınca kalkıyor. */
    const js = oku('assets/js/listing-page.js');
    expect(js).toContain('(MolaVeri.oturum && MolaVeri.oturum())');
    expect(js).toContain("window.addEventListener('mola360:oturum'");
    /* Izgara "dense": bant dolu bir satırın altına oturuyor. */
    expect(yorumsuz(listeStil)).toContain('.lst-grid { grid-auto-flow: row dense; }');
    expect(yorumsuz(listeStil)).toMatch(/\.lst-uyelik \{\s*grid-column: 1 \/ -1;/);
  });
});

describe('kart: kampanya satırı', () => {
  const BUGUN = '2026-09-28';

  it('ürüne kendiliğinden uygulanabilen yürürlükteki kampanya', () => {
    expect(R.rezUrunKampanyasi('tour', MolaVeri.urun('tour', 'kapadokya-3-gece'), BUGUN))
      .toMatchObject({ kod: 'kapadokya-erken', kisa: '30 gün önceden 500 TL indirim' });
    expect(R.rezUrunKampanyasi('hotel', MolaVeri.urun('hotel', 'kordon-butik-otel'), BUGUN))
      .toMatchObject({ kod: 'otel-hafta-sonu', kisa: 'Hafta sonu 2 gece kal, 1 gece öde' });
    expect(R.rezUrunKampanyasi('tour', MolaVeri.urun('tour', 'efes-sirince'), BUGUN)).toBe(null);
  });

  it('üyeye özel ve kupon kampanyaları kartta yok', () => {
    R.REZ_KAMPANYALAR.filter(k => k.tur !== 'otomatik' || k.uyeOzel).forEach(k => {
      ['tour', 'hotel', 'activity', 'event', 'venue'].forEach(tip => {
        const bulunan = R.rezUrunKampanyasi(tip, { slug: 'x', taxonomy: {} }, BUGUN);
        expect(bulunan && bulunan.kod).not.toBe(k.kod);
      });
    });
  });

  it('kart kampanyayı taşıyor ve işaretlemede tek satır', () => {
    expect(C.tourCatalogCard(MolaVeri.urun('tour', 'kapadokya-3-gece')).campaign).toBe('30 gün önceden 500 TL indirim');
    expect(C.tourCatalogCard(MolaVeri.urun('tour', 'efes-sirince')).campaign).toBeUndefined();
    expect(app).toContain('${it.campaign ? `<p class="poi-campaign"><span class="icon">${svg(\'percent\')}</span>${it.campaign}</p>` : \'\'}');
  });
});

describe('mobil menü', () => {
  const css = yorumsuz(stil);

  it('en üstte aşağı çekince esnemiyor (iOS)', () => {
    expect(css).toMatch(/\.mobile-drawer \.drawer-sidebar-scroll \{[^}]*overscroll-behavior: none;/);
  });

  it('dil/para düğmesi yanındaki yardım bağlarıyla aynı boyda', () => {
    const mobilBag = css.match(/\.mobile-drawer \.sidebar-section-help \.sidebar-link \{[^}]*font-size: ([\d.]+px)/)[1];
    expect(css).toContain('.mobile-drawer .sidebar-section-help button.sidebar-link { font-size: ' + mobilBag + ';');
    const masaBag = css.match(/\.desktop-sidebar \.sidebar-section-help \.sidebar-link \{[^}]*font-size:([\d.]+px)/)[1];
    expect(css).toContain('.desktop-sidebar .sidebar-section-help button.sidebar-link { font-size: ' + masaBag + ';');
  });

  it('uzun rota adı ızgarayı taşırmıyor', () => {
    expect(css).toMatch(/\.mobile-drawer \.sidebar-route-list\.sidebar-route-grid \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\);/);
  });
});

describe('alt çekmeceler', () => {
  const ui = oku('assets/js/ui.js');
  const turStil = oku('assets/css/tour.css');

  it('bütün alt çekmeceler aşağı çekince kapanıyor (tek ortak kod)', () => {
    ['.filter-dropdown-panel', '.lst-filters', '.lst-plan-panel', '.tercih-cekmece', '.tour-sheet-panel']
      .forEach(sec => expect(ui, sec).toContain("secici: '" + sec + "'"));
    /* Anasayfaya özel eski kopya kalmadı. */
    expect(ui).not.toContain('filter-sheet-drag');
    /* Kapatma çekmecenin kendi düğmesiyle; hayalet tık koruması onu yutmuyor. */
    expect(ui).toContain("dugmeyeBas('#lstSheetClose')");
    expect(ui).toContain("dugmeyeBas('[data-tercih-kapat]')");
    expect(ui).toMatch(/st\.blockClickUntil = 0;\s*ayar\.kapat\(panel\);/);
  });

  it('sürükleme translate ile; yerine oturunca açılış animasyonu yeniden oynamıyor', () => {
    const css = yorumsuz(stil);
    expect(css).toMatch(/\.m360-cekmece\.m360-sheet-dragging \{[^}]*translate: 0 var\(--m360-sheet-drag, 0px\);/);
    expect(css).not.toMatch(/m360-sheet-(dragging|snapping) \{[^}]*animation: none/);
  });

  it('açılış anasayfa süzgeç çekmecesiyle aynı: alttan 0,28 sn, tutamaç', () => {
    const liste = yorumsuz(listeStil);
    expect(liste).toContain('transition: transform .28s ease-out, visibility 0s linear .28s;');
    expect(liste).toMatch(/\.lst-filters::before \{[^}]*width: 40px;/);
    expect(liste).toMatch(/\.lst-plan-panel \{[^}]*animation: m360SheetUp \.28s ease-out;/);
    expect(yorumsuz(turStil)).toContain('.tour-sheet.open .tour-sheet-panel { animation: m360SheetUp .28s ease-out; }');
    expect(yorumsuz(stil)).toMatch(/\.tercih-cekmece \{[^}]*transition: transform \.28s ease-out;/);
  });
});

describe('süzgeç çekmecesinde Temizle', () => {
  const js = oku('assets/js/listing-page.js');

  it('hep yerinde; seçim yokken pasif, varken etkin', () => {
    expect(js).toContain('<button class="lst-clear-btn" type="button" data-temizle data-temizle-sabit disabled>Temizle</button>');
    expect(js).toContain("if (b.hasAttribute('data-temizle-sabit')) b.disabled = !secimSayisi;");
    const css = yorumsuz(listeStil);
    expect(css).toMatch(/\.lst-clear-btn \{[^}]*background: #fff;/);
    expect(css).toMatch(/\.lst-clear-btn:disabled \{[^}]*color: #A3A9BA;/);
  });

  it('"Ne zaman, kaç kişi?" panelinde de aynı düğme', () => {
    expect(js).toContain('<button class="lst-clear-btn" type="button" data-plan-temizle>Temizle</button>');
    expect(js).toContain("planPanel.querySelector('[data-plan-temizle]').disabled = !dolu;");
  });
});

describe('liste başlığı ve sıralama', () => {
  const js = oku('assets/js/listing-page.js');
  const ui = oku('assets/js/ui.js');
  const BUGUN_T = new Date('2026-09-28T10:00:00');
  const avantaj = (yol) => MolaVeri.listeSeo(MolaVeri.sayfaModeli(MolaVeri.adres(yol), BUGUN_T), BUGUN_T).avantajlar;

  it('başlığın altında ürün sayısı ve en düşük fiyat yok; güven çipleri var', () => {
    expect(js).not.toContain("' · en düşük ' + seo.enDusuk");
    expect(js).toContain('lspAvantajMarkup(seo.avantajlar)');
    const m = L.lspAvantajMarkup([{ kod: 'kapora', metin: '%20 kaporayla yer ayırt', ipucu: 'x' }]);
    expect(m).toContain('<li class="lst-avantaj" data-avantaj="kapora" title="x">');
    expect(L.lspAvantajMarkup([])).toBe('');
  });

  it('çipler listedeki ürünlerin kurallarından', () => {
    expect(avantaj('turlar/karadeniz-turlari').map(a => a.kod)).toEqual(['kapora', 'taksit']);
    expect(avantaj('turlar').map(a => a.kod)).toEqual(['kapora', 'iptal', 'taksit', 'kampanya']);
    /* Kapora yalnızca turda; otelde yok. */
    expect(avantaj('oteller').map(a => a.kod)).not.toContain('kapora');
    const tur = avantaj('turlar');
    expect(tur.find(a => a.kod === 'kapora').metin).toBe('%' + Math.round(R.REZ_KAPORA.oran * 100) + ' kaporayla yer ayırt');
    /* Taksit: bütün kart ailelerinde vade farksız olan en yüksek sayı. */
    const ortak = Math.min(...R.REZ_TAKSIT.aileler.map(a => Math.max(1, ...Object.keys(a.oranlar).filter(n => a.oranlar[n] === 0).map(Number))));
    expect(tur.find(a => a.kod === 'taksit').metin).toBe(ortak + ' taksit, vade farksız');
    expect(tur.find(a => a.kod === 'kampanya').metin).toBe('30 gün önceden 500 TL indirim');
  });

  it('sıralama "Filtrele" ile aynı düğme ve çekmece olarak açılıyor', () => {
    expect(js).toContain('<button class="lst-tool-btn lst-sort-btn" type="button" id="lstSortBtn" aria-haspopup="dialog" aria-expanded="false" aria-controls="lstSortPanel">');
    expect(js).not.toContain('<select id="lstSort">');
    const secenekler = L.lspSiralamaMarkup([{ slug: 'onerilen', name: 'Önerilen' }, { slug: 'fiyat-artan', name: 'Fiyat: Artan' }], 'fiyat-artan');
    expect(secenekler).toContain('data-sirala="onerilen" aria-checked="false">Önerilen</button>');
    expect(secenekler).toContain('data-sirala="fiyat-artan" aria-checked="true">Fiyat: Artan</button>');
    /* Dar ekranda alt çekmece; aşağı çekince kapanıyor. */
    expect(yorumsuz(listeStil)).toMatch(/@media \(max-width: 1024px\) \{\s*\.lst-sort-panel \{[^}]*animation: m360SheetUp \.28s ease-out;/);
    expect(ui).toContain("secici: '.lst-sort-panel'");
    /* Yapışkan araç çubuğunun katmanında kalmasın diye <body>'ye taşınıyor. */
    expect(js).toContain("window.matchMedia('(max-width: 1024px)').matches ? document.body : siralaKutu");
  });
});

describe('"Ne zaman, kaç kişi?" takvimi', () => {
  const js = oku('assets/js/listing-page.js');
  /* app.js tarayıcı betiği; saf fonksiyonlar kaynaktan alınıp çalıştırılıyor. */
  const fonk = (ad) => app.match(new RegExp('function ' + ad + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}'))[0];
  const takvimSecimi = new Function(fonk('takvimSecimi') + '; return takvimSecimi;')();
  const takvimGunleriMarkup = new Function(
    'function dateCalKey(d) { return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }\n'
    + fonk('takvimGunleriMarkup') + '; return takvimGunleriMarkup;')();
  const g = (iso) => { const [y, a, d] = iso.split('-').map(Number); return new Date(y, a - 1, d); };

  it('panelde tarih kutuları yok; anasayfa takviminin ızgarası var', () => {
    const panel = L.lspPlanKutusuMarkup({}, false);
    expect(panel).not.toContain('type="date"');
    expect(panel).toContain('class="date-cal-grid" id="lstPlanGunler"');
    expect(panel).toContain('data-takvim-ay="-1"');
    expect(js).toContain('takvimGunleriMarkup(gorunum.yil, gorunum.ay');
    /* Anasayfa da aynı ızgarayı ve seçim kuralını kullanıyor. */
    expect(fonk('renderDateCalendar')).toContain('takvimGunleriMarkup(dateCalViewYear, dateCalViewMonth');
    expect(app).toContain('takvimSecimi(dateCalRangeStart, dateCalRangeEnd');
  });

  it('seçim kuralı: ilk dokunuş başlangıç, sonraki bitiş, önceye dokunuş yeni başlangıç', () => {
    expect(takvimSecimi(null, null, g('2026-10-10'))).toEqual({ bas: g('2026-10-10'), bit: null });
    expect(takvimSecimi(g('2026-10-10'), null, g('2026-10-14'))).toEqual({ bas: g('2026-10-10'), bit: g('2026-10-14') });
    expect(takvimSecimi(g('2026-10-10'), null, g('2026-10-05'))).toEqual({ bas: g('2026-10-05'), bit: null });
    expect(takvimSecimi(g('2026-10-10'), g('2026-10-14'), g('2026-10-20'))).toEqual({ bas: g('2026-10-20'), bit: null });
  });

  it('ızgara: Pazartesi başlangıçlı, geçmiş günler kapalı, aralık işaretli', () => {
    const m = takvimGunleriMarkup(2026, 9, g('2026-10-05'), g('2026-10-10'), g('2026-10-12'));
    const gunler = [...m.matchAll(/data-date="([^"]+)"/g)].map(x => x[1]);
    expect(gunler[0]).toBe('2026-09-28');          // 1 Ekim 2026 Perşembe; hafta Pazartesi başlıyor
    expect(gunler.length % 7).toBe(0);
    expect(m).toMatch(/date-cal-day-disabled" data-date="2026-10-04" disabled/);
    expect(m).toMatch(/date-cal-day-selected date-cal-day-range-start" data-date="2026-10-10"/);
    expect(m).toMatch(/date-cal-day-in-range" data-date="2026-10-11"/);
    expect(m).toMatch(/date-cal-day-selected date-cal-day-range-end" data-date="2026-10-12"/);
  });

  it('takvimin altındaki satır', () => {
    expect(L.lspPlanSecimMetni(null, null, false)).toBe('Bir gün ya da tarih aralığı seç');
    expect(L.lspPlanSecimMetni('2026-10-03', null, true)).toBe('3 Eki Cmt · çıkış gününü seç');
    expect(L.lspPlanSecimMetni('2026-10-02', '2026-10-04', true)).toBe('2 Eki Cum – 4 Eki Paz · 2 gece');
  });

  it('hızlı seçimler tek satırda yana kayıyor', () => {
    const css = yorumsuz(listeStil);
    expect(css).toMatch(/\.lst-plan-hizli \{[^}]*overflow-x: auto;/);
    expect(css).toMatch(/\.lst-plan-cip \{[^}]*flex-shrink: 0;[^}]*white-space: nowrap;/);
    /* fieldset içeriğiyle genişleyip paneli taşırmasın. */
    expect(css).toMatch(/\.lst-plan-grup \{[^}]*min-width: 0;/);
  });
});

describe('anasayfa filtreleri: seçim "Uygula" ile', () => {
  const sayfa = oku('index.html');
  const fonk = (ad) => app.match(new RegExp('function ' + ad + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}'))[0];
  const dinleyici = (bas, son = '\n});') => { const i = app.indexOf(bas); return app.slice(i, app.indexOf(son, i)); };

  it('şeridin sonundaki "Filtreleri temizle" yok; sonuçlardaki düğmenin adı "Filtreleri temizle"', () => {
    expect(sayfa).not.toContain('clearAllFilters');
    expect(app).not.toContain("getElementById('clearAllFilters')");
    expect(stil).not.toContain('.filter-clear-all');
    expect(sayfa.replace(/<!--[\s\S]*?-->/g, '')).not.toMatch(/süzgeç/i);
    expect(sayfa.match(/data-home-results-clear>Filtreleri temizle</g)).toHaveLength(2);
  });

  it('mobil çekmecede dokunulan seçenek taslak; filtre ve çip değişmiyor', () => {
    const secim = dinleyici("    if (isMobileViewport() && panel.classList.contains('generic-filter-panel')) {", '\n    }\n');
    expect(secim).toContain('wrap._filterTaslak = secili ? null : value;');
    expect(secim).toContain('return;');
    expect(secim).not.toContain('filterState');
    expect(secim).not.toContain('setChipActive');
  });

  it('"Uygula" taslağı uyguluyor; çekmece her açılışta uygulanmış seçimle başlıyor', () => {
    const uygula = dinleyici("document.querySelectorAll('[data-generic-apply]')");
    expect(uygula).toContain('filterState[key] = deger;');
    expect(uygula).toContain('setChipActive(key, Boolean(deger), deger);');
    const ac = fonk('openFilterDropdown');
    expect(ac).toContain('delete wrap._filterTaslak;');
    expect(ac).toContain("button.dataset.value === filterState[wrap.dataset.dropdown]");
    expect(ac).toContain('takvimTaslaginiYukle();');
  });

  it('jenerik çekmecelerde "İptal et" yerine Temizle: yalnızca taslağı siliyor', () => {
    expect(sayfa).not.toContain('İptal et');
    expect(sayfa.match(/class="generic-filter-clear date-cal-btn date-cal-btn-ghost" data-generic-temizle="[a-z]+" disabled>Temizle</g)).toHaveLength(5);
    const temizle = dinleyici("document.querySelectorAll('[data-generic-temizle]')");
    expect(temizle).toContain('wrap._filterTaslak = null;');
    expect(temizle).not.toContain('filterState');
    expect(temizle).not.toContain('closeFilterDropdown');
  });

  it('takvimde Temizle yalnızca taslağı siliyor; seçim boşken Uygula tarih filtresini kaldırıyor', () => {
    const temizle = dinleyici("onId('dateCalClear'");
    expect(temizle).not.toContain('filterState');
    expect(temizle).not.toContain('resetDateRange');
    expect(dinleyici("onId('dateCalApply'")).toContain("if (!dateCalRangeStart && filterState.tarih) { clearFilter('tarih'); return; }");
  });

  it('takvim altı: Temizle seçim yokken pasif; Uygula tam aralıkta ya da uygulanmış filtre kaldırılırken etkin', () => {
    const calistir = (bas, bit, tarih) => {
      const el = { dateCalRangeLabel: { textContent: '' }, dateCalApply: { disabled: null }, dateCalClear: { disabled: null } };
      new Function('document', 'filterState', 'dateCalRangeStart', 'dateCalRangeEnd', 'dateCalFormat',
        fonk('updateDateCalFooter') + '; updateDateCalFooter();')(
        { getElementById: (id) => el[id] }, { tarih }, bas, bit, (d) => d.getDate() + ' Eki');
      return { temizle: el.dateCalClear.disabled, uygula: el.dateCalApply.disabled, etiket: el.dateCalRangeLabel.textContent };
    };
    const gun = (d) => new Date(2026, 9, d);
    expect(calistir(null, null, null)).toEqual({ temizle: true, uygula: true, etiket: 'Tarih aralığı seçin' });
    expect(calistir(gun(3), null, null)).toEqual({ temizle: false, uygula: true, etiket: '3 Eki – bitiş tarihi seçin' });
    expect(calistir(gun(3), gun(6), null)).toEqual({ temizle: false, uygula: false, etiket: '3 Eki – 6 Eki' });
    expect(calistir(null, null, { start: '2026-10-03', end: '2026-10-06' })).toEqual({ temizle: true, uygula: false, etiket: 'Tarih aralığı seçin' });
  });

  it('Temizle düğmeleri süzgeç çekmecesindeki gibi: beyaz, lacivert çerçeve, boşken grimsi', () => {
    const css = yorumsuz(stil);
    expect(css).toMatch(/\.date-cal-btn-ghost \{[^}]*background: #fff;[^}]*border: 1\.5px solid var\(--navy-deep\);/);
    expect(css).toMatch(/\.date-cal-btn-ghost:disabled \{[^}]*background: #F6F7FA;[^}]*color: #A3A9BA;/);
    expect(sayfa).toContain('id="dateCalClear" disabled>Temizle<');
  });
});
