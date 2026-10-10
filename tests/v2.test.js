/* Yeni mola360 (/v2/).

   v2 klasik siteden bağımsız, ayrı bir site: arşivdeki klasik sitenin
   verisini, motorlarını ve sayfalarını kullanmıyor, ona bağ vermiyor.
   v2 birden çok sayfadan oluşuyor (v2/index.html, v2/baglan/, v2/urun/ …);
   ortak stil v2/css/, betikler v2/js/ altında. Kurallar her dosya için. */
import { describe, it, expect, vi } from 'vitest';
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
  it('yatay kayan şeritler yalnızca sağa sola kayar (aşağı yukarı kaymaz)', () => {
    kodlar.filter(f => f.endsWith('.css')).forEach(f => {
      (oku(f).match(/[^{}]+\{[^}]*overflow-x:\s*(auto|scroll)[^}]*\}/g) || [])
        .forEach(k => expect(k, relative(V2, f) + ': ' + k.trim().slice(0, 40)).toMatch(/overflow-y:\s*hidden/));
    });
  });

  it('yazılar sığdığı halde alt satıra kaymaz (text-wrap:balance yok)', () => {
    // Safari balance ile tek satıra sığan başlığı da ikiye bölüyor.
    kodlar.forEach(f => expect(oku(f), relative(V2, f)).not.toMatch(/text-wrap(-style)?:\s*balance\s*[;}]/));
  });

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
      /* sitenin kendi yayın adresi yalnızca kategori sayfalarının asıl adresinde (canonical) */
      .forEach(h => expect(['wa.me', 'bedirinci.github.io']).toContain(h)));
  });

  it('yazı tipi cihazın kendi fontu; web fontu yüklenmiyor', () => {
    /* Bedir 2026-10-07: Plus Jakarta Sans kalktı (PROJE.md karar kaydı) */
    expect(oku(join(V2, 'css', 'tokens.css'))).toMatch(/--font:system-ui,/);
    dosyalar.filter(f => /\.(css|html|js)$/.test(f)).forEach(f =>
      expect(oku(f), relative(V2, f)).not.toMatch(/@font-face|@import|fonts\.googleapis|fonts\.gstatic|Jakarta/));
  });

  it('her sayfa ortak tokenları ve kendi modülünü yüklüyor', () => {
    sayfalar.forEach(f => {
      const b = bagları(f);
      expect(b.some(x => x.endsWith('css/tokens.css')), relative(V2, f)).toBe(true);
      expect(b.some(x => /js\/[a-z]+\.js$/.test(x)), relative(V2, f)).toBe(true);
    });
  });

  it('yazı boyutu ve köşe yuvarlaklığı tasarım tokenlarından geliyor', () => {
    /* ham px değeri yalnızca tokens.css'te; başka yerde var(--fs-…) / var(--r-…) */
    dosyalar.filter(f => /\.(css|html|js)$/.test(f) && !f.endsWith('tokens.css')).forEach(f => {
      const ham = oku(f).match(/(font-size|border-radius):[^;}"']*\d+(\.\d+)?px/g) || [];
      expect(ham.filter(x => !x.includes('clamp(')), relative(V2, f)).toEqual([]);
    });
  });

  it('yazı kalınlığı tasarım tokenlarından geliyor', () => {
    /* sayı yalnızca tokens.css'te; başka yerde var(--fw-…) */
    dosyalar.filter(f => /\.(css|html|js)$/.test(f) && !f.endsWith('tokens.css')).forEach(f => {
      expect(oku(f).match(/font-weight:\s*\d+/g) || [], relative(V2, f)).toEqual([]);
    });
  });

  it('satır yüksekliği ve harf aralığı tasarım tokenlarından geliyor', () => {
    /* ham değer yalnızca tokens.css'te; başka yerde var(--lh-…) / var(--ls-…), ya da 0 */
    const izin = { 'line-height': /^(var\(--lh-[a-z]+\)|normal|inherit)$/, 'letter-spacing': /^(var\(--ls-[a-z]+\)|0|normal|inherit)$/ };
    dosyalar.filter(f => /\.(css|html|js)$/.test(f) && !f.endsWith('tokens.css')).forEach(f => {
      const ham = [...oku(f).matchAll(/(line-height|letter-spacing):\s*([^;}"']+)/g)].map(m => [m[1], m[2].trim()]).filter(([k, v]) => !izin[k].test(v));
      expect(ham.map(x => x.join(':')), relative(V2, f)).toEqual([]);
    });
    /* kullanılan her token tanımlı */
    const tok = oku(join(V2, 'css', 'tokens.css'));
    dosyalar.filter(f => /\.(css|html|js)$/.test(f)).forEach(f => [...oku(f).matchAll(/var\((--(?:lh|ls|sp)-[a-z]+)\)/g)]
      .forEach(m => expect(tok, relative(V2, f) + ': ' + m[1]).toContain(m[1] + ':')));
  });

  it('arama yer, metin ve tarihle süzüyor; kategori ayrı kalıyor (kural 3)', async () => {
    const api = await import('../v2/js/api.js');
    expect(api.suggest('kapa').dests.map(d => d.id)).toContain('kapadokya');
    expect(api.suggest('goreme').products.map(p => p.id)).toContain('kapadokya-turu');
    const kap = api.listProducts({ yer: 'kapadokya' });
    expect(kap.length).toBeGreaterThan(0);
    expect(api.listProducts({ type: 'tur', yer: 'kapadokya' }).every(p => p.type === 'Tur')).toBe(true);
    /* tarihi olan ürün pencereye düşmeli (gün gün sınama tests/v2-takvim.test.js'te, saat sabitlenmiş) */
    const [a, b] = api.WHEN.find(w => w[0] === 'bu-hs').slice(3);
    api.listProducts({ type: 'tur', tarih: 'bu-hs' }).forEach(p =>
      expect(p.dates.some(x => { const d = api.parseDay(x[1]); return d >= a && d <= b; }), p.title).toBe(true));
  });

  it('SEO sayfaları diskte üreticiyle aynı; Keşfet bağları, site haritası ve robots veriyle aynı', async () => {
    const seo = await import('../scripts/seo.mjs');
    const s = oku(join(V2, 'index.html'));
    for (const [a, b, f, ad] of [[seo.BAS, seo.SON, seo.kategoriHtml, 'kategori'], [seo.SBAS, seo.SSON, seo.sehirHtml, 'şehir']]) {
      const i = s.indexOf(a), j = s.indexOf(b);
      expect(i > 0 && j > i, 'v2/index.html ' + ad + ' işaretleri').toBe(true);
      expect(s.slice(i + a.length, j).trim(), ad + ': npm run seo').toBe((await f()).trim());
    }
    /* üretilen her sayfa diskte aynı; eskiyen ya da elle eklenmiş üretilmiş sayfa yok */
    const sayfa = await seo.seoSayfalari();
    expect(seo.uretilmis().sort(), 'npm run seo').toEqual(sayfa.map(x => x.yol).sort());
    sayfa.forEach(({ yol, html }) => expect(oku(join(V2, yol, 'index.html')) === html, yol + ': npm run seo').toBe(true));
    /* site haritası: Keşfet, bütün sayfalar ve deneyimler */
    expect(oku(join(V2, 'sitemap.xml')), 'npm run seo').toBe(await seo.siteHaritasi());
    expect([...oku(join(V2, 'sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])).toEqual([seo.SITE, ...sayfa.map(x => seo.SITE + x.yol)]);
    /* robots: her sayfa tek politikaya uyar (YAYIN kapalıyken hepsi kapalı) */
    seo.sayfaDosyalari().forEach(f => { const h = oku(join(V2, f)); expect(h, f).toContain('<meta name="robots" content="' + seo.robotsOf(f, h.includes(seo.IZ)) + '">'); });
    /* her sekmenin koleksiyon bölümü var; yalnızca ilki (Turlar) açık */
    const api = await import('../v2/js/api.js');
    expect([...s.matchAll(/class="koll-g" data-tur="([a-z]+)"[^>]*?( hidden)?>/g)].map(m => m[1] + (m[2] ? '-' : '+')))
      .toEqual(api.TYPES.map(([t], i) => t + (i ? '-' : '+')));
    expect(s).toContain('<a class="kl" href="izmir/mekanlar/kahvalti/"');
    expect(s).toContain('<a href="izmir/" class="all">Tümü →</a>');
  });

  it('sayfa ağacı: eşik, kapı sayfası yok, ad ve girişler kendine özgü; deneyim adresleri doğru ağaçta', async () => {
    const api = await import('../v2/js/api.js'), S = await import('../v2/js/sehirler.js');
    const tum = api.listPages(), alt = tum.filter(pg => pg.kind !== 'sehir');
    /* her sayfa en az ESIK deneyimle; iki sayfa birebir aynı deneyimleri göstermez (docs/seo.md) */
    alt.forEach(pg => expect(pg.count, pg.path).toBeGreaterThanOrEqual(S.ESIK));
    const kume = alt.map(pg => [...pg.ids].sort().join());
    expect(new Set(kume).size, 'aynı deneyimleri gösteren iki sayfa').toBe(kume.length);
    for (const k of ['path', 'name', 'intro']) expect(new Set(tum.map(pg => pg[k])).size, k + ' kendine özgü').toBe(tum.length);
    tum.forEach(pg => expect(pg.intro.length, pg.path + ': giriş metni').toBeGreaterThan(60));
    expect(tum.map(pg => pg.path)).toEqual(expect.arrayContaining(['izmir/', 'izmir/mekanlar/', 'izmir/mekanlar/kahvalti/', 'izmir/sevgiliyle-yapilacaklar/',
      'izmir/alsancak/', 'izmir/oteller/', 'oteller/', 'turlar/', 'turlar/izmir-cikisli/', 'turlar/yurt-disi/']));
    /* kural 3: sayfanın süzgeci tür ve en çok bir süzgeç (niyette kiminle + şehrin içi) */
    tum.forEach(pg => { const { tur, sehir, ...f } = pg.q; expect(Object.keys(f).length, pg.path).toBeLessThanOrEqual(pg.kind === 'niyet' ? 2 : 1); });
    /* mekân, etkinlik ve aktivite İzmir'de, şehrin altında; oteller ve turlar bütün şehirlerden, kendi ağacında (Bedir 2026-10-08) */
    ['mekan', 'etkinlik', 'aktivite'].forEach(t => api.listProducts({ type: t }).forEach(p => {
      expect(p.sehir, p.title).toBe('izmir');
      expect(p.path, p.title).toBe('izmir/' + S.TUR_YOL[t] + '/' + p.id + '/');
    }));
    api.listProducts({ type: 'otel' }).forEach(p => expect(p.path).toBe('oteller/' + p.id + '/'));
    api.listProducts({ type: 'tur' }).forEach(p => expect(p.path).toBe('turlar/' + p.id + '/'));
    expect(api.listProducts({ type: 'otel' }).some(p => !p.sehir), 'İzmir dışından otel').toBe(true);
    expect(new Set(api.listProducts({ type: 'tur' }).map(p => p.kalkis)).size, 'birden çok kalkış şehri').toBeGreaterThan(2);
    /* uygulamadaki bağlar kalıcı adrese gider */
    expect(api.productUrl('/', 'Kum Beach Club')).toBe('/izmir/mekanlar/kum-beach-club/');
    expect(api.productUrl('/', 'Kapadokya Turu')).toBe('/turlar/kapadokya-turu/');
    /* Keşfet koleksiyonları: sekmenin özellik ve kalkış sayfaları ("tümü" sayfası değil) */
    api.TYPES.forEach(([t]) => {
      const l = api.listCollections(t);
      expect(l.length, t).toBeGreaterThan(0);
      l.forEach(pg => { expect(pg.q.tur, pg.path).toBe(t); expect(['oz', 'kalkis'], pg.path).toContain(pg.kind); });
    });
    /* liste adresi bir sayfaya denk gelirse başlık ve asıl adres o sayfanın */
    expect(api.findCityPage({ tur: 'mekan', oz: 'kahvalti', sehir: 'izmir' }).path).toBe('izmir/mekanlar/kahvalti/');
    expect(api.findCityPage({ tur: 'otel', oz: 'kultur' })).toBe(null);
    /* yurt dışı bir yer olarak aranabiliyor: bütün yurt dışı turları */
    expect(api.listProducts({ yer: 'yurt-disi' }).map(p => p.id).sort())
      .toEqual(api.listProducts({ type: 'tur' }).filter(p => p.abroad).map(p => p.id).sort());
  });

  it('liste ve şehir sayfaları arama motoruna hazır: başlık, açıklama, önizleme, yapısal veri, sayfa yolu, SSS', async () => {
    const seo = await import('../scripts/seo.mjs'), api = await import('../v2/js/api.js'), S = seo.SITE;
    const coz = t => t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const meta = (html, k) => { const m = new RegExp('<meta (?:name|property)="' + k + '" content="([^"]*)">').exec(html); return m && coz(m[1]); };
    const sayfa = Object.fromEntries((await seo.seoSayfalari()).map(x => [x.yol, x.html])), aciklamalar = new Set();
    for (const pg of api.listPages()) {
      const html = sayfa[pg.path], url = S + pg.path, yol = pg.path;
      const baslik = coz(/<title>([^<]*)<\/title>/.exec(html)[1]), desc = meta(html, 'description');
      expect(baslik, yol).toBe(api.pageTitle(pg));
      expect(baslik.startsWith(pg.name), yol).toBe(true);
      expect(desc.length, yol).toBeLessThanOrEqual(160);
      aciklamalar.add(desc);
      expect(html.match(/<h1[ >]/g), yol + ': tek ana başlık').toHaveLength(1);
      expect(html, yol).toContain('>' + coz(pg.name).replace(/'/g, '&#39;') + '</h1>');
      expect(html, yol).toContain('<link rel="canonical" href="' + url + '">');
      expect(meta(html, 'og:url'), yol).toBe(url);
      expect(meta(html, 'og:title'), yol).toBe(baslik.replace(/ \| mola360$/, ''));
      expect(meta(html, 'og:description'), yol).toBe(desc);
      expect(meta(html, 'og:locale'), yol).toBe('tr_TR');
      /* üst kısım: kapak, sayfa yolu, başlık, giriş; kategori satırı yok */
      expect(html, yol).toContain('<header class="pg-top slim cover" style="--g:');
      expect(html, yol).toMatch(/<nav class="bc" aria-label="Sayfa yolu"><ol><li><a href="(\.\.\/)+">Keşfet<\/a><\/li>/);
      expect(html, yol).toContain('<p id="lsSub">' + pg.intro.replace(/'/g, '&#39;').replace(/&(?!#39;)/g, '&amp;') + '</p>');
      expect(html, yol).not.toContain('id="cats"');
      /* yapısal veri: geçerli JSON; sayfa yolu görünenle, SSS görünen sorularla aynı */
      const ld = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)[1]);
      const g = Object.fromEntries(ld['@graph'].map(x => [x['@type'], x]));
      expect(Object.keys(g), yol).toEqual(['CollectionPage', 'BreadcrumbList', 'ItemList', 'FAQPage']);
      expect(g.CollectionPage.url, yol).toBe(url);
      const yolAd = [...html.matchAll(/<nav class="bc"[^>]*><ol>(.*?)<\/ol><\/nav>/g)][0][1].match(/>([^<>]+)<\/a>/g).map(x => coz(x.slice(1, -4)));
      expect(g.BreadcrumbList.itemListElement.map(x => x.name), yol).toEqual([...yolAd, pg.name]);
      const sorular = [...html.matchAll(/<summary><h3>([^<]+)<\/h3>/g)].map(m => coz(m[1]));
      const yanitlar = [...html.matchAll(/<\/summary><p>(.*?)<\/p>/g)].map(m => coz(m[1].replace(/<[^>]+>/g, '')));
      expect(g.FAQPage.mainEntity.map(x => x.name), yol).toEqual(sorular);
      expect(g.FAQPage.mainEntity.map(x => x.acceptedAnswer.text), yol).toEqual(yanitlar);
      expect(sorular.length, yol).toBeGreaterThanOrEqual(3);
      /* bağlar var olan sayfalara gider */
      [...html.matchAll(/href="((?:\.\.\/)+[^"?#]*)"/g)].forEach(m => {
        const hedef = new URL(m[1], 'https://x/v2/' + pg.path).pathname.replace(/^\/v2\//, '');
        expect(existsSync(join(V2, hedef, hedef.endsWith('.css') || hedef.endsWith('.js') || hedef.endsWith('.webp') ? '' : 'index.html')), yol + ' → ' + hedef).toBe(true);
      });
      if (pg.kind === 'sehir') {
        /* şehir sayfası: türlerin rayları, kiminle, semtler, tanıtım */
        expect(html, yol).toContain('<script type="module" src="../js/sehir.js"></script>');
        expect(g.ItemList.itemListElement.map(x => x.url), yol).toEqual(expect.arrayContaining([S + 'izmir/mekanlar/', S + 'turlar/izmir-cikisli/']));
        continue;
      }
      /* liste: kartlar önerilen sırayla, yapısal verideki listeyle aynı */
      const kartlar = [...html.matchAll(/<a class="lk" href="([^"]+)"/g)].map(m => new URL(m[1], url).href);
      expect(kartlar, yol).toEqual(pg.ids.map(i => S + api.getProduct(i).path));
      expect(g.ItemList.itemListElement.map(x => x.url), yol).toEqual(kartlar);
      expect(html, yol).toContain('<body data-q="' + Object.entries(pg.q).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&amp;') + '" data-kat="' + pg.path + '">');
      expect(html.match(/<section class="box kat-seo"[^>]* data-kat>/g).length, yol).toBeGreaterThanOrEqual(2);
    }
    expect(aciklamalar.size, 'her sayfanın açıklaması kendine').toBe(api.listPages().length);
  });

  it('deneyim sayfaları: başlık, açıklama, yapısal veri, sayfa yolu ve içerik HTML\'de', async () => {
    const seo = await import('../scripts/seo.mjs'), api = await import('../v2/js/api.js'), S = seo.SITE;
    const sayfa = Object.fromEntries((await seo.seoSayfalari()).map(x => [x.yol, x.html]));
    const TIP = { otel: ['Hotel'], tur: ['TouristTrip'], etkinlik: ['Product'], aktivite: ['Product'], mekan: ['Restaurant', 'BarOrPub', 'DaySpa', 'CafeOrCoffeeShop', 'LocalBusiness'] };
    const urunler = api.listProducts().filter(p => p.path);
    expect(urunler.length, 'her deneyimin kalıcı sayfası var').toBe(api.listProducts().length);
    for (const p of urunler) {
      const html = sayfa[p.path], url = S + p.path, t = api.typeKey(p.type);
      expect(html, p.path).toContain('<title>' + p.title.replace(/&/g, '&amp;') + ' ');
      expect(/<title>([^<]*)<\/title>/.exec(html)[1].replace(/&amp;/g, '&'), p.path).toBe(api.productTitle(p));
      expect(/<meta name="description" content="([^"]*)">/.exec(html)[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').length, p.path).toBeLessThanOrEqual(160);
      expect(html, p.path).toContain('<link rel="canonical" href="' + url + '">');
      expect(html, p.path).toContain('<body class="no-nav" data-id="' + p.id + '">');
      expect(html.match(/<h1[ >]/g), p.path).toHaveLength(1);
      const g = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)[1])['@graph'];
      expect(TIP[t], p.path).toContain(g[0]['@type']);
      expect(g[0].name, p.path).toBe(p.title);
      /* örnek veride puan yapısal veriye girmez (gerçek değerlendirme değil) */
      expect(g[0].aggregateRating, p.path).toBeUndefined();
      expect(g[1]['@type'], p.path).toBe('BreadcrumbList');
      expect(g[1].itemListElement.at(-1).name, p.path).toBe(p.title);
      if (t === 'otel' || t === 'tur') expect(g[0].offers || g[0].priceRange, p.path).toBeTruthy();
      /* bulunduğu sayfalar var olan sayfalara gider */
      [...html.matchAll(/<li><a href="((?:\.\.\/)+[^"]+)">/g)].forEach(m => {
        const hedef = new URL(m[1], 'https://x/v2/' + p.path).pathname.replace(/^\/v2\//, '');
        expect(existsSync(join(V2, hedef, 'index.html')), p.path + ' → ' + hedef).toBe(true);
      });
    }
  });

  it('SEO sayfaları tarihten bağımsız: sabit HTML ertesi gün eskimez', async () => {
    /* tarih bugüne göre hesaplanır (etkinlik günü, otelde giriş); sayfaya yazılsaydı her gün değişirdi */
    const AY = /\b\d{1,2} (Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)\b/;
    const once = await (await import('../scripts/seo.mjs')).seoSayfalari();
    once.forEach(({ yol, html }) => expect(html.match(AY), yol + ': sayfada gün').toBeNull());
    /* saat 45 gün ileri: üretilen sayfalar aynı */
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date(Date.now() + 45 * 864e5));
      vi.resetModules();
      const sonra = await (await import('../scripts/seo.mjs')).seoSayfalari();
      expect(sonra.map(x => x.yol)).toEqual(once.map(x => x.yol));
      sonra.forEach(({ yol, html }, i) => expect(html === once[i].html, yol + ': tarih değişince sayfa değişti').toBe(true));
    } finally {
      vi.useRealTimers();
      vi.resetModules();
    }
  });

  it('ürün sayfasında her deneyimin içeriği var, iptal günü tarihe göre', async () => {
    const api = await import('../v2/js/api.js');
    api.listProducts().forEach(p => {
      const d = api.productDetails(p);
      expect(d.about && (d.program.length || (api.bookingSpec(p).hotel || {rooms: []}).rooms.length) && d.dahil.length && d.place[0], p.title).toBeTruthy();
    });
    /* son ücretsiz iptal günü: turda kalkıştan 7 gün önce (bugüne göre; sabit gün sınaması v2-takvim'de) */
    const k = api.getProduct('kapadokya-turu'), lbl = d => d.getDate() + ' ' + ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][d.getMonth()];
    expect(api.cancelBy(k, lbl(api.addDays(api.today(), 10))).past).toBe(false);
    expect(api.cancelBy(k, lbl(api.addDays(api.today(), 3))).past).toBe(true);
  });

  it('keşfet: kiminle seçenekleri, tür karışık temalar, sahnede ve yakınımda', async () => {
    const api = await import('../v2/js/api.js');
    expect(api.WITH.map(w => w[1])).toEqual(['Tek başıma', 'Sevgilimle', 'Arkadaşlarla', 'Ailemle', 'Çocuklarla', 'İş arkadaşlarımla']);
    api.WITH.forEach(w => expect(api.listProducts({ kimle: w[0] }).length, w[1]).toBeGreaterThan(0));
    api.listThemes().forEach(t => expect(t.types.length, t.name).toBeGreaterThan(1));
    const ev = api.listEvents();
    expect(ev.length).toBeGreaterThan(0);
    ev.forEach((e, i) => { expect(e.type).toBe('Etkinlik'); if (i) expect(ev[i - 1].day <= e.day).toBe(true); });
    /* İzmir'de: en yakın deneyimler İzmir'de, uzaklığa göre sıralı */
    const yakin = api.listNearby([38.43, 27.14]);
    expect(yakin[0].km).toBeLessThan(5);
    expect(yakin.every((p, i) => !i || yakin[i - 1].km <= p.km)).toBe(true);
    expect(api.nearestPlace([38.43, 27.14]).id).toBe('izmir');
  });

  it('fotoğraf kuralı, tema girişi ve paylaşımdan ürüne bağ', async () => {
    const { IMG } = await import('../v2/js/data.js');
    const api = await import('../v2/js/api.js');
    /* fotoğraf: v2/img/ altında, kurala uygun ad ve boyut; bağlı olduğu ürün ya da tema var */
    expect(existsSync(join(V2, 'img/KAYNAK.md'))).toBe(true);
    Object.entries(IMG).forEach(([k, f]) => {
      expect(k.startsWith('tema:') ? api.getTheme(k.slice(5)) : api.findByTitle(k), k).toBeTruthy();
      expect(f, k).toMatch(/^[a-z0-9-]+\.(webp|jpe?g)$/);
      expect(existsSync(join(V2, 'img', f)), f).toBe(true);
      expect(statSync(join(V2, 'img', f)).size, f).toBeLessThanOrEqual(200 * 1024);
    });
    /* fotoğraf renk geçişinin üstüne biner; yoksa geçiş kalır */
    expect(api.photo('a.webp', 'linear-gradient(red,blue)')).toMatch(/^url\(\S+\/img\/a\.webp\) center\/cover no-repeat,linear-gradient\(red,blue\)$/);
    expect(api.photo(undefined, 'linear-gradient(red,blue)')).toBe('linear-gradient(red,blue)');
    /* tema vitrini: iki cümlelik giriş */
    api.listThemes().forEach(t => expect((t.intro.match(/[.!?](\s|$)/g) || []).length, t.name).toBe(2));
    /* her paylaşım bir ürüne bağlı ve o ürünün paylaşımları arasında */
    api.listPosts().forEach(p => {
      expect(p.product, p.id).toBeTruthy();
      expect(api.listPosts({ productId: p.product.id }).map(x => x.id)).toContain(p.id);
    });
    /* kişiye göre sıra için uzaklık: konumu bilinmeyen üründe null */
    expect(api.kmTo([38.43, 27.14], api.getProduct('kordon-caz-aksamlari'))).toBeLessThan(10);
    expect(api.kmTo(null, api.getProduct('kordon-caz-aksamlari'))).toBeNull();
  });

  it('örnek veri kodda ÖRNEK diye işaretli, arayüzde etiket yok (kural 4)', () => {
    expect(oku(join(V2, 'js/data.js'))).toMatch(/ÖRNEK/);
    expect(oku(join(V2, 'js/icerik.js'))).toMatch(/ÖRNEK/);
    /* site yayındaymış gibi görünür: ÖRNEK rozeti, taslak görünüm düğmeleri, "Önizleme" yok */
    const dosyalar = [...readdirSync(join(V2, 'js')).map(f => join(V2, 'js', f)),
      join(V2, 'index.html'), ...readdirSync(V2, { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(join(V2, d.name, 'index.html'))).map(d => join(V2, d.name, 'index.html'))];
    dosyalar.forEach(f => {
      const t = oku(f);
      expect(t, f).not.toMatch(/class="ornek"|class="demo"|Önizleme\.|yeni mola360\\'ta hazırlanıyor|\(Taslak:/);
    });
  });

  it('alt menü dört sekme, arama yok; Paylaş ayrı düğme', () => {
    const shell = oku(join(V2, 'js/shell.js'));
    const nav = shell.slice(shell.indexOf('const NAV='), shell.indexOf('const navHtml'));
    expect([...nav.matchAll(/^ \['([a-z]+)'/gm)].map(m => m[1])).toEqual(['kesfet', 'baglan', 'planlarim', 'profil']);
    expect(shell).toMatch(/id="shareBtn"/);
    /* eski adresler Planlarım'a gidiyor */
    expect(oku(join(V2, 'favoriler/index.html'))).toMatch(/planlarim\/#favoriler/);
    expect(oku(join(V2, 'rezervasyonlar/index.html'))).toMatch(/planlarim\/#yaklasan/);
  });

  it('paylaşım rozeti yalnızca Mola360 ile yaşanmış deneyimde (kural 4)', async () => {
    const api = await import('../v2/js/api.js');
    const past = api.listPastBookings();
    expect(past.length).toBeGreaterThan(0);
    past.forEach(b => expect(b.product, b.productId).toBeTruthy());
    expect(api.createPost({ productId: 'yok' })).toBe(null);
    /* Ayşe'nin önceki paylaşımları dahil: rozet yalnızca geçmiş rezervasyondaki deneyimde */
    const went = new Set(past.map(b => b.productId));
    const rozetli = api.listProfilePosts().filter(p => p.verified);
    expect(rozetli.length).toBeGreaterThan(0);
    rozetli.forEach(p => expect(went.has(p.product.id), p.id + ' ' + p.product.id).toBe(true));
  });

  it('kullanıcının yazdığı metin HTML\'e kaçışlanarak basılır; kaçış yardımcısı tek', async () => {
    const { esc } = await import('../v2/js/ui.js');
    expect(esc(`<img src=x onerror="a('b')">&`)).toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
    /* sayfalar kendi kopyasını tutmaz (eksik kopyalar hataya yol açmıştı); api.js'teki hx ui.js'i içe aktaramadığı için ayrı */
    readdirSync(join(V2, 'js')).filter(f => f !== 'ui.js').forEach(f => expect(oku(join(V2, 'js', f)), f).not.toMatch(/const (h|esc)=t=>String\(t\)/));
  });
});

