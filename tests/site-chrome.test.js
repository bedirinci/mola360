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
  ['otel/kordon-butik-otel/', oku('otel/kordon-butik-otel/index.html')],
  ['aktivite/kapadokya-balon-turu/', oku('aktivite/kapadokya-balon-turu/index.html')],
  ['etkinlik/aspendos-opera-bale-festivali/', oku('etkinlik/aspendos-opera-bale-festivali/index.html')]
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

/* ---------------- ana menü ----------------
   Menü ağacı taksonomide tek kaynak (TAXONOMY_MENU); masaüstü satırı ve
   mobil çekmece aynı ağaçtan basılıyor. Her satırın hedefi gerçek bir
   sayfa (dosya ya da yönlendiricinin tanıdığı adres). */
import { createRequire } from 'node:module';
const gerekli = createRequire(import.meta.url);
const menuCerceve = gerekli('../assets/js/site-chrome.js');
const { TAXONOMY_MENU, TAXONOMY_TYPES } = gerekli('../assets/js/taxonomy-data.js');
const { MolaVeri: menuKapi } = gerekli('../assets/js/data-gateway.js');

function menuDugumleri(liste = TAXONOMY_MENU, out = []) {
  liste.forEach(d => { out.push(d); if (d.children) menuDugumleri(d.children, out); });
  return out;
}

describe('ana menü', () => {
  it('masaüstü satırı menüdeki her adrese bağ veriyor', () => {
    const html = menuCerceve.siteMenuMasaustu(TAXONOMY_MENU, '', '', TAXONOMY_TYPES);
    menuDugumleri().forEach(d => expect(html, d.label).toContain('href="' + d.path + '/"'));
    /* Üst satırda her bölüm bir kez. */
    expect((html.match(/class="site-nav-item/g) || []).length).toBe(TAXONOMY_MENU.length);
  });

  it('içerik sayfasında bağlar kökten (../../)', () => {
    const html = menuCerceve.siteMenuMasaustu(TAXONOMY_MENU, '../../', '', TAXONOMY_TYPES);
    expect(html).toContain('href="../../turlar/ege-turlari/"');
    expect(html).not.toMatch(/href="turlar\//);
  });

  it('mobil ağaç aynı adresleri taşıyor; "Tüm …" yalnızca eksikse', () => {
    const html = menuCerceve.siteMenuAgac(TAXONOMY_MENU, '', '');
    menuDugumleri().forEach(d => expect(html, d.label).toContain('href="' + d.path + '/"'));
    /* Turlar'ın çocuklarında kendi sayfası yok: "Tüm Turlar" ekleniyor.
       Oteller'in çocuklarında "Tüm Oteller" zaten var: ikinci kez yok. */
    expect(html).toContain('>Tüm Turlar<');
    expect((html.match(/href="oteller\/"/g) || []).length).toBe(1);
  });

  it('bulunulan bölüm: liste sayfası da ürün sayfası da kendi bölümünde', () => {
    const turlar = TAXONOMY_MENU.find(d => d.path === 'turlar');
    expect(menuCerceve.siteMenuBolumu('turlar/ege-turlari', turlar, TAXONOMY_TYPES)).toBe(true);
    expect(menuCerceve.siteMenuBolumu('tur/efes-sirince', turlar, TAXONOMY_TYPES)).toBe(true);
    expect(menuCerceve.siteMenuBolumu('otel/kordon-butik-otel', turlar, TAXONOMY_TYPES)).toBe(false);
    expect(menuCerceve.siteMenuBolumu('', turlar, TAXONOMY_TYPES)).toBe(false);
  });

  it('her menü satırı yönlendiricide bir sayfaya çözülüyor', () => {
    menuDugumleri().forEach(d => expect(menuKapi.adres(d.path), d.path).toBeTruthy());
  });

  it('başlıkta menünün yeri var; çekmecede mobil ağaç', () => {
    expect(cerceve).toContain('id="siteNav"');
    expect(anasayfa).toContain('data-site-menu');
  });

  it('logo anasayfaya gidiyor', () => {
    expect(cerceve).toContain('href="./" class="logo"');
  });
});

describe('anasayfa bağları', () => {
  it('"Tümünü Gör" her şeritte gerçek bir sayfaya', () => {
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    const hepsi = [...blok.matchAll(/hepsi:'([^']+)'/g)].map(m => m[1]);
    const seritSayisi = (blok.match(/\{title:'/g) || []).length;
    expect(hepsi.length).toBe(seritSayisi);
    hepsi.forEach(yol => expect(menuKapi.adres(yol), yol).toBeTruthy());
  });

  it('kategori ikonlarının sayfası var (Kuponlarım hesabın içinde)', () => {
    const blok = app.match(/const categories = \[([\s\S]*?)\n\];/)[1];
    [...blok.matchAll(/path:'([^']+)'/g)].map(m => m[1])
      .forEach(yol => expect(menuKapi.adres(yol), yol).toBeTruthy());
  });
});

describe('anasayfa blok bağları', () => {
  const blok = gerekli('../assets/js/home-blocks.js');
  it('kampanya bantları gerçek sayfalara gidiyor (üyelik bandı hariç)', () => {
    blok.PROMO_BANDS.filter(p => p.path).forEach(p =>
      expect(menuKapi.adres(p.path), p.title).toBeTruthy());
    expect(blok.PROMO_BANDS.filter(p => !p.path).map(p => p.cta)).toEqual(['Üye ol']);
  });
  it('tema ve koleksiyon kartları kendi sayfasına', () => {
    blok.homeThemeCards().forEach(t => expect(menuKapi.adres('temalar/' + t.slug), t.slug).toBeTruthy());
    blok.homeCollectionCards().forEach(c => expect(menuKapi.adres('koleksiyonlar/' + c.slug), c.slug).toBeTruthy());
  });
});
