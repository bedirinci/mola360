/* Tek yönlendirici sayfa (404.html + assets/js/listing-page.js) ve
   liste sayfalarının veri kapısı tarafı.

   GitHub Pages dosyası olmayan her adreste 404.html'i sunuyor. O sayfa
   adresi veri kapısına soruyor (MolaVeri.adres) ve ekranı kuruyor. Bu
   dosya şunu ölçüyor:

   1) Sayfa kökü (<base>) GitHub Pages proje adresinde ve kendi alan
      adında doğru.
   2) Menüdeki her satır ve her kategori/liste/tema/koleksiyon bir
      sayfaya çözülüyor; bilinmeyen adres "bulunamadı".
   3) Sayfa modeli (başlık, kırıntı, çipler, temel süzgeç) taksonomiden;
      liste sorgusu kapının süzgeciyle aynı ürünleri veriyor.
   4) SEO alanları ürünlerden türetiliyor; ürünsüz liste dizine girmiyor.
   5) Yönlendiricinin betikleri tek kapsamda çakışmıyor ve doğru sırada.
   6) Yerel sunucu dosyası olmayan adreste 404.html'i 404 koduyla veriyor. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import http from 'node:http';
import vm from 'node:vm';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { MolaVeri, KAPI_SITE_ADRESI, kapiYolTemizle, kapiPuan5, kapiSabitTarihler, kapiFiltreyeUyar } =
  require('../assets/js/data-gateway.js');
const {
  TAXONOMY_MENU, TAXONOMY_CATEGORIES, TAXONOMY_LISTINGS, TAXONOMY_THEMES, TAXONOMY_COLLECTIONS, TAXONOMY_TYPES
} = require('../assets/js/taxonomy-data.js');
const L = require('../assets/js/listing-page.js');
const { sun, KOK } = require('../scripts/sunucu.js');
const { TOURS } = require('../assets/js/tour-data.js');
const { EVENTS } = require('../assets/js/event-data.js');

const oku = (yol) => readFileSync(path.join(KOK, yol), 'utf8');
const yonlendirici = oku('404.html');
const BUGUN = '2026-09-21';

function menuYollari(liste = TAXONOMY_MENU, out = []) {
  liste.forEach(d => { out.push(d.path); if (d.children) menuYollari(d.children, out); });
  return out;
}

describe('sayfa kökü (<base>)', () => {
  /* Satır içi betik sayfanın başında çalışıyor; burada sahte bir
     location/document ile iki ortamda çalıştırılıyor. */
  const betik = yonlendirici.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const kok = (hostname, pathname) => {
    const eklenen = [];
    const ctx = vm.createContext({
      location: { hostname, pathname },
      document: { createElement: () => ({}), head: { appendChild: (el) => eklenen.push(el) } }
    });
    vm.runInContext(betik, ctx);
    return eklenen[0].href;
  };

  it('GitHub Pages proje adresinde depo klasörü', () => {
    expect(kok('bedirinci.github.io', '/mola360/turlar/ege-turlari/')).toBe('/mola360/');
    expect(kok('bedirinci.github.io', '/mola360/tur/yok')).toBe('/mola360/');
  });

  it('kendi alan adında ve yerelde kök', () => {
    expect(kok('mola360.com', '/turlar/ege-turlari/')).toBe('/');
    expect(kok('localhost', '/temalar/doga-yayla/')).toBe('/');
  });

  it('<base> bütün göreli bağlardan önce kuruluyor', () => {
    const baseYeri = yonlendirici.indexOf('createElement(\'base\')');
    const ilkBag = yonlendirici.search(/(href|src)="assets\//);
    expect(baseYeri).toBeGreaterThan(0);
    expect(baseYeri).toBeLessThan(ilkBag);
  });

  it('kanonik kök, Pages kökünün aynısı', () => {
    expect(new URL(KAPI_SITE_ADRESI).pathname).toBe('/mola360/');
  });

  it('göreli yol kökten ayrılıyor', () => {
    expect(L.lspGoreliYol('/mola360/turlar/ege-turlari/', '/mola360/')).toBe('turlar/ege-turlari/');
    expect(L.lspGoreliYol('/turlar/', '/')).toBe('turlar/');
    expect(L.lspHref('')).toBe('./');
    expect(L.lspHref('turlar/ege-turlari')).toBe('turlar/ege-turlari/');
  });
});

describe('adres çözümü', () => {
  it('menüdeki her satır bir sayfaya çözülüyor', () => {
    menuYollari().forEach(yol => {
      const a = MolaVeri.adres(yol);
      expect(a, yol).toBeTruthy();
      expect(MolaVeri.sayfaModeli(a, BUGUN), yol).toBeTruthy();
    });
  });

  it('her kategori, liste sayfası, tema ve koleksiyon çözülüyor', () => {
    const yollar = []
      .concat(TAXONOMY_CATEGORIES.map(k => TAXONOMY_TYPES[k.type].base + '/' + k.slug))
      .concat(TAXONOMY_LISTINGS.map(l => l.base + '/' + l.slug))
      .concat(TAXONOMY_THEMES.map(t => 'temalar/' + t.slug))
      .concat(TAXONOMY_COLLECTIONS.map(c => 'koleksiyonlar/' + c.slug))
      .concat(Object.values(TAXONOMY_TYPES).map(t => t.base))
      .concat(['firsatlar', 'temalar', 'koleksiyonlar']);
    yollar.forEach(yol => {
      const m = MolaVeri.sayfaModeli(MolaVeri.adres(yol), BUGUN);
      expect(m, yol).toBeTruthy();
      expect(m.path, yol).toBe(yol);
      /* Kırıntının son halkası sayfanın kendisi. */
      expect(m.kirinti[m.kirinti.length - 1].name, yol).toBe(m.baslik);
      expect(m.kirinti[0]).toEqual({ name: 'Anasayfa', path: '' });
    });
  });

  it('ürün adresi yalnızca yayındaki ürüne çözülüyor', () => {
    expect(MolaVeri.adres('tur/efes-sirince')).toEqual({ kind: 'product', type: 'tour', slug: 'efes-sirince', path: 'tur/efes-sirince' });
    expect(MolaVeri.adres('tur/sapanca-masukiye').kind).toBe('product');
    expect(MolaVeri.adres('tur/olmayan-tur')).toBe(null);
    expect(MolaVeri.adres('tur/efes-sirince/fazla')).toBe(null);
    const kayit = TOURS['efes-sirince'];
    const eski = kayit.status;
    kayit.status = 'draft';
    try {
      expect(MolaVeri.adres('tur/efes-sirince')).toBe(null);
    } finally {
      if (eski === undefined) delete kayit.status; else kayit.status = eski;
    }
  });

  it('bilinmeyen adres bulunamadı', () => {
    ['turlar/olmayan', 'temalar/olmayan', 'koleksiyonlar/x', 'boyle/bir/sey', 'otellerr', 'turlar/ege-turlari/fazla']
      .forEach(yol => expect(MolaVeri.adres(yol), yol).toBe(null));
  });

  it('yazım farkları aynı sayfaya çıkıyor', () => {
    expect(kapiYolTemizle('/Turlar/Ege-Turlari')).toBe('turlar/ege-turlari');
    expect(kapiYolTemizle('turlar/index.html')).toBe('turlar');
    expect(kapiYolTemizle('//turlar//ege-turlari/?bolge=ege#x')).toBe('turlar/ege-turlari');
    expect(kapiYolTemizle('')).toBe('');
    expect(MolaVeri.adres('/').kind).toBe('home');
  });
});

describe('sayfa modeli', () => {
  const model = (yol) => MolaVeri.sayfaModeli(MolaVeri.adres(yol), BUGUN);

  it('kategori: kırıntı üst kategoriden geçiyor, temel süzgeç alt kategorileri kapsıyor', () => {
    const m = model('turlar/karadeniz-turlari');
    expect(m.kirinti.map(k => k.name)).toEqual(['Anasayfa', 'Turlar', 'Yurt İçi Turlar', 'Karadeniz Turları']);
    expect(m.temel).toEqual({ type: 'tour', category: 'karadeniz-turlari' });
    expect(m.birim).toBe('tur');
    const ust = model('turlar/yurt-ici-turlar');
    const alt = MolaVeri.listele(model('turlar/ege-turlari').temel, BUGUN).map(k => k.slug);
    const hepsi = MolaVeri.listele(ust.temel, BUGUN).map(k => k.slug);
    alt.forEach(s => expect(hepsi).toContain(s));
  });

  it('çipler: düğümün çocukları ya da yaprağın kardeşleri; bulunduğun sayfa işaretli', () => {
    const turlar = model('turlar');
    expect(turlar.altlar.map(c => c.path)).toContain('turlar/yurt-ici-turlar');
    expect(turlar.altlar.some(c => c.aktif)).toBe(false);
    const ege = model('turlar/ege-turlari');
    const aktif = ege.altlar.filter(c => c.aktif);
    expect(aktif.map(c => c.path)).toEqual(['turlar/ege-turlari']);
    /* Yaprakta "Tüm Yurt İçi Turlar" üst sayfaya dönüş çipi olarak var. */
    expect(ege.altlar.map(c => c.name)).toContain('Tüm Yurt İçi Turlar');
    /* Düğümün kendi sayfasında kendine giden "Tüm …" çipi yok. */
    expect(model('turlar/yurt-ici-turlar').altlar.map(c => c.path)).not.toContain('turlar/yurt-ici-turlar');
  });

  it('çip sayısı o sayfanın ürün sayısı; ürünsüz çip gizli', () => {
    model('turlar').altlar.forEach(c => {
      expect(c.adet, c.path).toBe(MolaVeri.listele(model(c.path).temel, BUGUN).length);
      expect(c.adet, c.path).toBeGreaterThan(0);
    });
    /* Balkan Turları'nda ürün yok: kardeş sayfalarda çipi görünmüyor,
       kendi sayfasında görünüyor (işaretli). */
    expect(model('turlar/yunan-adalari-turlari').altlar.map(c => c.path)).not.toContain('turlar/balkan-turlari');
    expect(model('turlar/balkan-turlari').altlar.find(c => c.aktif).adet).toBe(0);
  });

  it('menüde olmayan kategori tipin kök çiplerini gösteriyor', () => {
    const m = model('oteller/resort-oteller');
    expect(m.baslik).toBe('Resort Oteller');
    expect(m.altlar.map(c => c.path)).toContain('oteller/butik-oteller');
  });

  it('tema ve koleksiyon sayfası kendi ailesini çip olarak gösteriyor', () => {
    expect(model('temalar/doga-yayla').altlar.find(c => c.aktif).path).toBe('temalar/doga-yayla');
    expect(model('koleksiyonlar/ailece').kirinti.map(k => k.name)).toEqual(['Anasayfa', 'Koleksiyonlar', 'Ailece']);
  });

  it('dizin sayfası: ürünü olan temalar, sayı birimiyle', () => {
    const m = model('temalar');
    expect(m.kartlar.length).toBeGreaterThan(0);
    m.kartlar.forEach(k => {
      expect(k.adet).toBe(MolaVeri.temaUrunleri(k.path.split('/')[1], BUGUN).length);
      expect(k.adetMetni).toMatch(/^\d+ (tur|otel|aktivite|etkinlik|mekan|seçenek)$/);
    });
  });

  it('içerik sayfası (kurumsal) menüdeki adıyla', () => {
    const m = model('kurumsal/iptal-iade');
    expect(m.baslik).toBe('İptal / İade');
    expect(m.kirinti.map(k => k.name)).toEqual(['Anasayfa', 'Kurumsal', 'İptal / İade']);
    expect(m.temel).toBe(null);
  });
});

describe('liste sorgusu', () => {
  it('temel süzgeçle aynı ürünler, satır biçiminde', async () => {
    const temel = { type: 'tour', category: 'ege-turlari' };
    const sonuc = await MolaVeri.liste({ temel, durum: { secim: {}, sayfa: 1 }, bugun: BUGUN });
    const beklenen = MolaVeri.listele(temel, BUGUN).map(k => k.slug).sort();
    expect(sonuc.toplam).toBe(beklenen.length);
    expect(sonuc.satirlar.map(s => s.slug).sort()).toEqual(beklenen);
    sonuc.satirlar.forEach(s => {
      expect(s.kayit.slug).toBe(s.slug);
      expect(s.path).toBe('tur/' + s.slug);
      expect(Object.keys(s.facets).sort())
        .toEqual(['ay', 'bolge', 'kalkis', 'kimle', 'pansiyon', 'sure', 'tema', 'tip', 'ulasim']);
    });
  });

  it('adresteki süzgeç ürünün kendi sınıflandırmasıyla uyuşuyor', async () => {
    const alanlar = MolaVeri.yuzeyTanimlari(BUGUN);
    const sonuc = await MolaVeri.liste({ temel: { type: 'tour' }, alanlar,
      durum: { secim: { ulasim: ['otobus'] }, sayfa: 1 }, bugun: BUGUN });
    const beklenen = MolaVeri.listele({ type: 'tour', transport: 'otobus' }, BUGUN).map(k => k.slug).sort();
    expect(sonuc.satirlar.map(s => s.slug).sort()).toEqual(beklenen);
  });

  it('bölge ve kalkış seçenekleri taksonomiden; sayılar ürünlerden', async () => {
    const sonuc = await MolaVeri.liste({ temel: { type: 'tour' }, durum: { secim: {}, sayfa: 1 }, bugun: BUGUN });
    const bolge = sonuc.yuzeyler.find(y => y.key === 'bolge');
    const toplam = bolge.secenekler.reduce((t, o) => t + o.adet, 0);
    /* Her turun tek bölgesi var: sayıların toplamı tur sayısı. */
    expect(toplam).toBe(sonuc.toplam);
  });

  it('satır: otel puanı 5 üzerinden, sabit tarihli ürünün ayları', () => {
    const otel = MolaVeri.urun('hotel', 'sealight-resort');
    expect(kapiPuan5(otel, 'hotel').ortalama).toBe(4.6);
    const efes = MolaVeri.listeSatiri(MolaVeri.urun('tour', 'efes-sirince'), BUGUN);
    expect(efes.facets.ay[0]).toBe('2026-09');
    expect(efes.facets.sure).toEqual(['gunubirlik']);
    expect(efes.facets.tip).toEqual(['tur']);
    /* Her gün satılan otelin tarihi "her ay". */
    expect(MolaVeri.listeSatiri(otel, BUGUN).facets.ay).toBe(null);
    /* Ufuk 6 ay: son tarih 6. ayın sonunu geçmiyor. */
    const tarihler = kapiSabitTarihler(MolaVeri.urun('tour', 'efes-sirince'), 'tour', BUGUN);
    expect(tarihler[tarihler.length - 1] < '2027-03-01').toBe(true);
  });

  it('sezonu biten etkinlik listelenmiyor ama sayfası açılıyor', () => {
    const aspendos = EVENTS['aspendos-opera-bale-festivali'];
    const son = aspendos.performances.map(p => p.date).sort().pop();
    const sonra = String(Number(son.slice(0, 4)) + 1) + '-01-15';
    expect(MolaVeri.listele({ type: 'event' }, BUGUN).map(k => k.slug)).toContain('aspendos-opera-bale-festivali');
    expect(MolaVeri.listele({ type: 'event' }, sonra).map(k => k.slug)).not.toContain('aspendos-opera-bale-festivali');
    expect(MolaVeri.urun('event', 'aspendos-opera-bale-festivali')).toBeTruthy();
    /* Süzgecin kendisi değişmedi: kural yalnızca listelemede. */
    expect(kapiFiltreyeUyar(aspendos, { type: 'event' }, sonra)).toBe(true);
  });
});

describe('liste sayfası SEO', () => {
  const seo = (yol) => MolaVeri.listeSeo(MolaVeri.sayfaModeli(MolaVeri.adres(yol), BUGUN), BUGUN);

  it('açıklama sayıdan ve en düşük TL fiyattan', () => {
    const s = seo('turlar/ege-turlari');
    const urunler = MolaVeri.listele({ type: 'tour', category: 'ege-turlari' }, BUGUN);
    expect(s.title).toBe('Ege Turları — mola360');
    expect(s.description).toContain(urunler.length + ' tur');
    const enDusuk = Math.min(...urunler.map(k => MolaVeri.ozet(k, BUGUN)).filter(o => o.currency === 'TRY').map(o => o.price));
    expect(s.enDusuk.replace(/\D/g, '')).toBe(String(enDusuk));
    expect(s.canonical).toBe(KAPI_SITE_ADRESI + 'turlar/ege-turlari/');
    expect(s.noindex).toBe(false);
  });

  it('ürünsüz liste dizine girmiyor', () => {
    expect(seo('turlar/balkan-turlari').noindex).toBe(true);
    expect(seo('turlar/balkan-turlari').adet).toBe(0);
  });

  it('kanonik adreste süzgeç parametresi yok', () => {
    expect(seo('turlar').canonical).toBe(KAPI_SITE_ADRESI + 'turlar/');
  });

  it('yapısal veri: kırıntı ve yalnızca sayfası olan ürünler', async () => {
    const m = MolaVeri.sayfaModeli(MolaVeri.adres('turlar/ege-turlari'), BUGUN);
    const sonuc = await MolaVeri.liste({ temel: m.temel, durum: { secim: {}, sayfa: 1 }, bugun: BUGUN });
    const veri = L.lspYapisalVeri(m, seo('turlar/ege-turlari'), sonuc.satirlar, KAPI_SITE_ADRESI);
    expect(veri[0]['@type']).toBe('BreadcrumbList');
    expect(veri[0].itemListElement.map(x => x.name)).toEqual(m.kirinti.map(k => k.name));
    expect(veri[0].itemListElement[0].item).toBe(KAPI_SITE_ADRESI);
    const liste = veri.find(v => v['@type'] === 'ItemList');
    expect(liste.itemListElement.map(x => x.url)).toContain(KAPI_SITE_ADRESI + 'tur/efes-sirince/');
    liste.itemListElement.forEach(x => {
      const slug = x.url.split('/').slice(-2)[0];
      expect(TOURS[slug], x.url + ' sayfası olan ürün değil').toBeTruthy();
    });
  });
});

describe('ekran parçaları', () => {
  it('kırıntı kaçışlı ve son halka bağsız', () => {
    const html = L.lspKirintiMarkup([{ name: 'Anasayfa', path: '' }, { name: '<b>X</b>', path: 'x' }, { name: 'Y & Z', path: 'x/y' }]);
    expect(html).toContain('href="./"');
    expect(html).toContain('&lt;b&gt;X&lt;/b&gt;');
    expect(html).toContain('<li aria-current="page">Y &amp; Z</li>');
  });

  it('süzgeç: gizli alan çizilmiyor, fazla seçenek katlanıyor', () => {
    const yuzeyler = [
      { key: 'a', name: 'A', kind: 'coklu', gorunur: false, secenekler: [{ slug: 'x', name: 'X', adet: 3 }] },
      { key: 'b', name: 'B', kind: 'coklu', gorunur: true,
        secenekler: Array.from({ length: 9 }, (_, i) => ({ slug: 's' + i, name: 'S' + i, adet: 1, secili: i === 8 })) }
    ];
    const html = L.lspSuzgecMarkup(yuzeyler, new Set(), new Set());
    expect(html).not.toContain('data-grup="a"');
    expect((html.match(/<label class="lst-opt"(?![^>]*hidden)/g) || []).length).toBe(7);
    expect(html).toContain('Tümünü göster (9)');
  });
});

describe('yönlendirici sayfası', () => {
  const betikler = [...yonlendirici.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

  it('betik sırası: motor kapıdan, katalog ve app.js ekrandan önce', () => {
    const sira = (ad) => betikler.findIndex(b => b.endsWith(ad));
    expect(sira('listing-engine.js')).toBeLessThan(sira('data-gateway.js'));
    expect(sira('taxonomy-data.js')).toBeLessThan(sira('data-gateway.js'));
    expect(sira('data-gateway.js')).toBeLessThan(sira('catalog.js'));
    expect(sira('catalog.js')).toBeLessThan(sira('app.js'));
    expect(sira('app.js')).toBeLessThan(sira('listing-page.js'));
    expect(sira('site-chrome.js')).toBe(0);
  });

  it('betikler tek kapsamda çakışmıyor', () => {
    const domsuz = betikler.filter(y => !/site-chrome|ui\.js|app\.js/.test(y));
    const ctx = vm.createContext({ Math, Date, JSON, Object, Array, Number, String, isNaN, console, Promise, Set, URL });
    const kod = domsuz.map(d => oku(d)).join('\n');
    expect(() => vm.runInContext(kod + '\n1', ctx)).not.toThrow();
    const sonuc = vm.runInContext('JSON.stringify(MolaVeri.adres("turlar/ege-turlari"))', ctx);
    expect(JSON.parse(sonuc).kind).toBe('category');
    /* Tek kapsamda motor da kapı da çalışıyor. */
    const say = vm.runInContext('suzListe(MolaVeri.listele({type:"tour"},"' + BUGUN + '").map(k => MolaVeri.listeSatiri(k,"' + BUGUN + '")), MolaVeri.yuzeyTanimlari("' + BUGUN + '"), {secim:{}}).toplam', ctx);
    expect(say).toBe(MolaVeri.listele({ type: 'tour' }, BUGUN).length);
  });

  it('yönlendirici olarak işaretli ve kök bağı ""', () => {
    expect(yonlendirici).toMatch(/<body[^>]*data-sayfa="yonlendirici"/);
    expect(yonlendirici).toMatch(/<body[^>]*data-root=""/);
    expect(yonlendirici).toContain('id="sayfaKoku"');
  });

  it('yayın adımı 404.html\'deki varlıklara da sürüm damgası basıyor', () => {
    const is = oku('.github/workflows/pages.yml');
    const desen = is.match(/sed -E -i 's#(.*?)#/)[1];
    const re = new RegExp(desen.replace(/\\\?/g, '?'));
    expect(re.test('href="assets/css/listing.css"')).toBe(true);
    expect(re.test('src="assets/js/listing-page.js"')).toBe(true);
  });
});

describe('yerel sunucu', () => {
  const iste = (adres) => new Promise((coz, reddet) => {
    const sunucu = http.createServer(sun).listen(0, () => {
      http.get('http://127.0.0.1:' + sunucu.address().port + adres, (res) => {
        let govde = '';
        res.on('data', p => { govde += p; });
        res.on('end', () => { sunucu.close(); coz({ durum: res.statusCode, govde }); });
      }).on('error', (e) => { sunucu.close(); reddet(e); });
    });
  });

  it('dosyası olmayan adreste 404.html, 404 koduyla (GitHub Pages gibi)', async () => {
    const r = await iste('/turlar/ege-turlari/');
    expect(r.durum).toBe(404);
    expect(r.govde).toContain('data-sayfa="yonlendirici"');
  });

  it('dosyası olan sayfa olduğu gibi', async () => {
    const r = await iste('/tur/efes-sirince/');
    expect(r.durum).toBe(200);
    expect(r.govde).not.toContain('data-sayfa="yonlendirici"');
  });
});
