/* Ortak site cercevesi testleri.

   Header, bildirim paneli, profil menusu, mobil arama cubugu, tam ekran
   arama ve giris modali TEK kaynakta (assets/js/site-chrome.js) duruyor;
   her sayfa ayni dosyayi yukluyor. Buradaki testler o tekligi ve onu
   mumkun kilan iki sarti koruyor:

   1) Hicbir sayfa basligin kendi kopyasini tasimayacak.
   2) app.js artik yalnizca anasayfada degil icerik sayfalarinda (tur ve
      otel) da yuklendigi icin, anasayfaya ozgu elemanlara korumasiz
      dokunmayacak -- yoksa o sayfalarda ilk hatada butun betik duruyor
      ve baslik olu kaliyor. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');

const cerceve = oku('assets/js/site-chrome.js');
const app = oku('assets/js/app.js');
const anasayfa = oku('index.html');
const turSayfalari = [
  ['tur/efes-sirince/', oku('tur/efes-sirince/index.html')],
  ['tur/kapadokya-3-gece/', oku('tur/kapadokya-3-gece/index.html')],
  /* Otel icerik sayfasi da ayni cerceveyi yukluyor: baslik, arama,
     bildirimler ve giris modali orada da calisiyor. Liste artik
     "alt klasordeki icerik sayfalari" listesi; tur/otel ayrimi yok. */
  ['otel/kordon-butik-otel/', oku('otel/kordon-butik-otel/index.html')]
];
const sayfalar = [['index.html', anasayfa], ...turSayfalari];

describe('ortak çerçeve tek kaynak', () => {
  it('her sayfa çerçeveyi yüklüyor', () => {
    sayfalar.forEach(([ad, html]) => {
      expect(html, ad + ' çerçeveyi yüklemiyor').toMatch(/src="(\.\.\/\.\.\/)?assets\/js\/site-chrome\.js"/);
    });
  });

  it('hiçbir sayfada başlığın elle yazılmış kopyası yok', () => {
    /* Kopya kalırsa iki başlık birden basılır ve ikisi zamanla ayrışır. */
    sayfalar.forEach(([ad, html]) => {
      expect(html, ad + ' içinde başlık kopyası var').not.toContain('<header class="site-header"');
      expect(html, ad + ' içinde header-inner kopyası var').not.toContain('class="header-inner"');
    });
  });

  it('çerçeve app.js’ten önce yükleniyor', () => {
    /* app.js en üst seviyede bu işaretlemedeki ID’leri arıyor. */
    sayfalar.forEach(([ad, html]) => {
      expect(html.indexOf('site-chrome.js'), ad + ' sıralaması ters').toBeLessThan(html.indexOf('assets/js/app.js'));
    });
  });

  it('app.js’in beklediği kimlikler çerçevede var', () => {
    /* app.js’in doğrudan aradığı, çerçeveye ait kimlikler. Biri
       işaretlemeden düşerse o özellik her sayfada sessizce ölür. */
    ['headerSearchTrigger', 'headerRegisterBtn', 'notifBtn',
     'profileBtn', 'headerProfileAvatar', 'mobileMenuBtn', 'mobileSearchTrigger',
     'notifPanel', 'notifList', 'notifFilters', 'notifPanelSubtitle', 'notifMarkAll',
     'notifPanelBack', 'notifPanelClose', 'profilePanel', 'profileMenuAvatar',
     'profileMenuName', 'profileLogoutBtn', 'searchOverlay', 'searchOverlayInput',
     'searchOverlayBack', 'searchOverlayClear', 'searchOverlayClose',
     'searchOverlayBody', 'searchHomeContent', 'authModalOverlay', 'authModal',
     'authModalCloseBtn', 'authModalBackBtn']
      .forEach(id => {
        expect(cerceve, id + ' çerçevede yok').toContain('id="' + id + '"');
        expect(app, id + ' app.js’te kullanılmıyor').toContain("'" + id + "'");
      });
  });

  it('başlıktaki favori düğmesi işaretlemede duruyor', () => {
    /* NOT: #favoritesBtn'un app.js'te dinleyicisi YOK -- bu ortak
       çerçeveye taşımadan önce de böyleydi, düğme anasayfada da
       tıklanınca bir şey yapmıyor. Test yalnızca düğmenin yerinde
       durduğunu koruyor; davranış eklenince buraya dinleyici
       beklentisi de yazılmalı. */
    expect(cerceve).toContain('id="favoritesBtn"');
  });

  it('alt klasördeki sayfalar için görsel yolu data-root ile önekleniyor', () => {
    /* Çerçeve koke göre yazılmış; /tur/<slug>/ iki dizin içeride. */
    expect(cerceve).toContain('data-root');
    expect(cerceve).toMatch(/replace\(\/\(src\|href\)="assets\\\//);
    turSayfalari.forEach(([slug, html]) => {
      expect(html, slug + ' kökünü bildirmiyor').toContain('data-root="../../"');
    });
  });

  it('çerçeve kendi etiketinin yerine basılıyor', () => {
    /* Sayfa sonuna eklenirse başlık gövdenin altında kalır. */
    expect(cerceve).toContain('document.currentScript');
    expect(cerceve).toContain("insertAdjacentHTML(\"afterend\"");
  });
});

describe('app.js sayfadan bağımsız', () => {
  /* app.js anasayfa dışında da yükleniyor. Orada olmayan bir elemana
     korumasız dokunmak ilk satırda TypeError atar ve dosyanın geri
     kalanı hiç çalışmaz: başlık, arama, bildirimler, profil ve giriş
     modalı topluca ölür. Bu yüzden zincirleme erişim yasak. */
  it('zincirleme getElementById kullanımı yok', () => {
    const zincir = app.match(/document\.getElementById\('[^']+'\)\s*\./g) || [];
    expect(zincir, 'korumasız erişim: ' + zincir.join(', ')).toEqual([]);
  });

  it('korumalı erişim yardımcıları tanımlı', () => {
    expect(app).toMatch(/function byId\(id\)/);
    expect(app).toMatch(/function onId\(id, olay, fn, opts\)/);
    /* onId eksik elemanda sessizce dönmeli. */
    const govde = app.match(/function onId\(id, olay, fn, opts\) \{([\s\S]*?)\n\}/)[1];
    expect(govde).toContain('if (el)');
  });

  it('anasayfaya özgü bölümler korumalı basılıyor', () => {
    /* Bu üç kap yalnızca anasayfada var. */
    ['top10Scroll', 'catScroll', 'cardSections']
      .forEach(id => expect(app, id + ' korumasız').toContain("if (byId('" + id + "')) byId('" + id + "')"));
  });

  it('mobil menü eksik olduğunda sessizce geçiliyor', () => {
    /* Tur sayfasının kendi mobil başlığı var; drawer işaretlemesi yok. */
    const govde = app.match(/function toggleDrawer\(\) \{([\s\S]*?)\n\}/)[1];
    expect(govde).toContain('if (!drawer || !overlay) return;');
    expect(app).toContain('if (overlay) overlay.addEventListener');
  });
});
