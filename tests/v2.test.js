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

  it('kategori bağlantıları sayfanın HTML\'inde ve veriyle aynı (arama motorları için)', async () => {
    const { kategoriHtml, kategoriSayfalari, uretilmis, BAS, SON } = await import('../scripts/kategoriler.mjs');
    const s = oku(join(V2, 'index.html')), a = s.indexOf(BAS), b = s.indexOf(SON);
    expect(a > 0 && b > a, 'v2/index.html kategori işaretleri').toBe(true);
    expect(s.slice(a + BAS.length, b).trim(), 'veri değişti: npm run kategoriler').toBe((await kategoriHtml()).trim());
    /* her kategorinin kendi sayfası (v2/karadeniz-turlari/): diskteki veriyle aynı, eskiyen yok */
    const sayfa = await kategoriSayfalari();
    expect(uretilmis().sort(), 'npm run kategoriler').toEqual(sayfa.map(x => x.slug).sort());
    sayfa.forEach(({ slug, html }) => expect(oku(join(V2, slug, 'index.html')) === html, slug + ': npm run kategoriler').toBe(true));
    /* sayfada başlık, açıklama, asıl adres, ana başlık ve ürün bağlantıları HTML'de */
    const k = oku(join(V2, 'karadeniz-turlari', 'index.html'));
    expect(k).toContain('<title>Karadeniz turları — fiyatlar ve tarihler | mola360</title>');
    expect(k).toContain('<link rel="canonical" href="https://bedirinci.github.io/mola360/v2/karadeniz-turlari/">');
    expect(k).toContain('<h1 id="lsTitle">Karadeniz turları</h1>');
    expect(k).toContain('href="../urun/?id=karadeniz-yaylalari-turu"');
    expect(s).toContain('<a class="kl" href="karadeniz-turlari/"');
    /* site haritasında Keşfet ve bütün kategori sayfaları */
    const { siteHaritasi, SITE } = await import('../scripts/kategoriler.mjs');
    expect(oku(join(V2, 'sitemap.xml')), 'npm run kategoriler').toBe(await siteHaritasi());
    expect([...oku(join(V2, 'sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]))
      .toEqual([SITE, ...sayfa.map(x => SITE + x.slug + '/')]);
    /* her sekmenin bölümü var; yalnızca ilki (Turlar) açık */
    const api = await import('../v2/js/api.js');
    expect([...s.matchAll(/class="koll-g" data-tur="([a-z]+)"[^>]*?( hidden)?>/g)].map(m => m[1] + (m[2] ? '-' : '+')))
      .toEqual(api.TYPES.map(([t], i) => t + (i ? '-' : '+')));
  });

  it('kategori sayfaları arama motoruna hazır: başlık, açıklama, önizleme, yapısal veri, sayfa yolu, SSS', async () => {
    const { kategoriSayfalari, SITE } = await import('../scripts/kategoriler.mjs');
    const api = await import('../v2/js/api.js');
    const coz = t => t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const meta = (html, k) => { const m = new RegExp('<meta (?:name|property)="' + k + '" content="([^"]*)">').exec(html); return m && coz(m[1]); };
    const basliklar = new Set(), aciklamalar = new Set(), sayfalar = await kategoriSayfalari();
    for (const { slug, html } of sayfalar) {
      const c = api.TYPES.flatMap(([t]) => api.listCollections(t)).find(x => x.slug === slug), url = SITE + slug + '/';
      const baslik = coz(/<title>([^<]*)<\/title>/.exec(html)[1]), desc = meta(html, 'description');
      /* başlık önce kategorinin adı; açıklama 160 harfi aşmıyor; ikisi de sayfaya özgü */
      expect(baslik, slug).toBe(api.collectionTitle(c));
      expect(baslik.startsWith(c.name + ' — '), slug).toBe(true);
      expect(desc.length, slug).toBeLessThanOrEqual(160);
      expect(desc.startsWith(c.name), slug).toBe(true);
      basliklar.add(baslik); aciklamalar.add(desc);
      expect(html.match(/<h1[ >]/g), slug + ': tek ana başlık').toHaveLength(1);
      /* paylaşım önizlemesi asıl adresle aynı */
      expect(html, slug).toContain('<link rel="canonical" href="' + url + '">');
      expect(meta(html, 'og:url'), slug).toBe(url);
      expect(meta(html, 'og:title'), slug).toBe(baslik.replace(/ \| mola360$/, ''));
      expect(meta(html, 'og:description'), slug).toBe(desc);
      expect(meta(html, 'og:locale'), slug).toBe('tr_TR');
      /* yapısal veri: geçerli JSON; liste kartlarla, SSS görünen sorularla aynı */
      const ld = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)[1]);
      const g = Object.fromEntries(ld['@graph'].map(x => [x['@type'], x]));
      expect(Object.keys(g), slug).toEqual(['CollectionPage', 'BreadcrumbList', 'ItemList', 'FAQPage']);
      expect(g.CollectionPage.url, slug).toBe(url);
      const kartlar = [...html.matchAll(/<a class="lk" href="\.\.\/urun\/\?id=([^"]+)"/g)].map(m => m[1]);
      expect(g.ItemList.itemListElement.map(x => x.url), slug).toEqual(kartlar.map(id => SITE + 'urun/?id=' + id));
      expect(g.ItemList.numberOfItems, slug).toBe(kartlar.length);
      expect(g.BreadcrumbList.itemListElement.map(x => x.name), slug).toEqual(['Keşfet', api.TYPES.find(t => t[0] === c.q.tur)[2], c.name]);
      const sorular = [...html.matchAll(/<summary><h3>([^<]+)<\/h3>/g)].map(m => coz(m[1]));
      const yanitlar = [...html.matchAll(/<\/summary><p>([^<]+)<\/p>/g)].map(m => coz(m[1]));
      expect(g.FAQPage.mainEntity.map(x => x.name), slug).toEqual(sorular);
      expect(g.FAQPage.mainEntity.map(x => x.acceptedAnswer.text), slug).toEqual(yanitlar);
      expect(sorular.length, slug).toBeGreaterThanOrEqual(3);
      /* görünen sayfa yolu ve kategoriyi anlatan bölümler (liste.js süzgeçte gizler) */
      expect(html, slug).toContain('<nav class="bc" aria-label="Sayfa yolu" data-kat>');
      expect(html, slug).toContain('<body data-q="' + Object.entries(c.q).map(([k, v]) => k + '=' + v).join('&amp;') + '" data-kat="' + slug + '">');
      expect(html.match(/<section class="box kat-seo"[^>]* data-kat>/g).length, slug).toBeGreaterThanOrEqual(2);
      /* ilgili kategoriler var olan sayfalara gider */
      [...html.matchAll(/<li><a href="\.\.\/([a-z0-9-]+)\/">/g)].forEach(m => expect(existsSync(join(V2, m[1], 'index.html')), slug + ' → ' + m[1]).toBe(true));
    }
    expect(basliklar.size, 'her sayfanın başlığı kendine').toBe(sayfalar.length);
    expect(aciklamalar.size, 'her sayfanın açıklaması kendine').toBe(sayfalar.length);
  });

  it('kategori sayfaları tarihten bağımsız: sabit HTML ertesi gün eskimez', async () => {
    /* tarih bugüne göre hesaplanır (etkinlik günü); sayfaya yazılsaydı her gün değişirdi */
    const AY = /\b\d{1,2} (Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)\b/;
    const once = await (await import('../scripts/kategoriler.mjs')).kategoriSayfalari();
    once.forEach(({ slug, html }) => expect(html.match(AY), slug + ': sayfada gün').toBeNull());
    /* saat 45 gün ileri: üretilen sayfalar aynı */
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date(Date.now() + 45 * 864e5));
      vi.resetModules();
      const sonra = await (await import('../scripts/kategoriler.mjs')).kategoriSayfalari();
      expect(sonra.map(x => x.slug)).toEqual(once.map(x => x.slug));
      sonra.forEach(({ slug, html }, i) => expect(html === once[i].html, slug + ': tarih değişince sayfa değişti').toBe(true));
    } finally {
      vi.useRealTimers();
      vi.resetModules();
    }
  });

  it('arama kartının koleksiyonları: her sekmede gerçek, kategori ve süzgeç ayrı (kural 3)', async () => {
    const api = await import('../v2/js/api.js');
    api.TYPES.forEach(([t]) => {
      const l = api.listCollections(t);
      expect(l.length, t).toBeGreaterThan(0);
      l.forEach(c => {
        /* adresin kategorisi sekmenin kendisi; süzgeç yalnızca yer ya da tema, gerçekten var */
        const { tur, ...f } = c.q;
        expect(tur, c.name).toBe(t);
        expect(Object.keys(f), c.name).toHaveLength(1);
        expect(f.yer ? api.getDestination(f.yer) : api.getTheme(f.tema), c.name).toBeTruthy();
        /* sayı, liste sayfasının göstereceğiyle aynı; görseli var */
        expect(c.count, c.name).toBe(api.listProducts({ type: t, ...f }).length);
        expect(c.count, c.name).toBeGreaterThan(0);
        expect(c.bg, c.name).toBeTruthy();
      });
    });
    /* liste sayfası kartın adını başlık yapar */
    expect(api.findCollection('tur', { yer: 'karadeniz' })).toMatchObject({ name: 'Karadeniz turları', slug: 'karadeniz-turlari' });
    expect(api.findCollection('otel', { tema: 'kultur' })).toBe(null);
    /* yurt dışı bir yer olarak aranabiliyor: bütün yurt dışı turları */
    expect(api.listProducts({ yer: 'yurt-disi' }).map(p => p.id).sort())
      .toEqual(api.listProducts({ type: 'tur' }).filter(p => p.abroad).map(p => p.id).sort());
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

