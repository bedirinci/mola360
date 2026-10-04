/* Yeni mola360 (/v2/).

   v2 klasik siteden bağımsız, ayrı bir site: arşivdeki klasik sitenin
   verisini, motorlarını ve sayfalarını kullanmıyor, ona bağ vermiyor.
   v2 birden çok sayfadan oluşuyor (v2/index.html, v2/baglan/, v2/urun/ …);
   ortak stil v2/css/, betikler v2/js/ altında. Kurallar her dosya için. */
import { describe, it, expect } from 'vitest';
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
      .forEach(h => expect(['fonts.googleapis.com', 'wa.me']).toContain(h)));
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
    /* tarihi olan ürün pencereye düşmeli: Kapadokya Turu kasımda kalkmıyor */
    expect(api.listProducts({ yer: 'kapadokya', type: 'tur', tarih: 'kasim' })).toEqual([]);
    expect(api.firstDateIn(api.getProduct('kapadokya-turu'), 'gelecek-hs')).toBe('Cum 9 Eki');
  });

  it('ürün sayfasında her deneyimin içeriği var, iptal günü tarihe göre', async () => {
    const api = await import('../v2/js/api.js');
    api.listProducts().forEach(p => {
      const d = api.productDetails(p);
      expect(d.about && d.program.length && d.dahil.length && d.place[0], p.title).toBeTruthy();
    });
    const k = api.getProduct('kapadokya-turu');
    expect(api.cancelBy(k, 'Pzt 12 Eki')).toEqual({ date: '5 Ekim Pazartesi', past: false });
    expect(api.cancelBy(k, 'Pzt 5 Eki').past).toBe(true);
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
      expect(t, f).not.toMatch(/class="ornek"|class="demo"|Önizleme\.|yeni mola360\\'ta hazırlanıyor/);
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
  });
});

