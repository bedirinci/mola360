/* v2 gerçek bir tarayıcıda (Chromium): bütün sayfalar hatasız açılır ve
   kullanıcının yazdığı metin hiçbir ekranda HTML olarak çalışmaz.

   Sayfa başına: konsol hatası, yakalanmamış hata, yüklenemeyen dosya,
   yatay taşma, başlıksız (h1) ya da boş sayfa olmamalı. Sayfalar örnek
   veriden çıkar: her ürün, her ürünün rezervasyonu, her kişi, her sohbet,
   her paylaşım. Sayfa dışarıya istek atmaz (yazı tipi cihazın kendi fontu).

   Tarayıcı kurulu değilse atlanır (npx playwright install chromium); CI
   kurar (.github/workflows/ci.yml). */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import sunucu from '../scripts/sunucu.js';
import { USERS } from '../v2/js/data.js';
import { listProducts, listPosts, listCollections, listPages } from '../v2/js/api.js';

const VAR = existsSync(chromium.executablePath());
const SAYFALAR = ['', 'baglan/', 'liste/', 'liste/?tur=otel', 'liste/?tarih=bu-hs', 'liste/?tema=doga', 'liste/?yer=kapadokya&tur=tur', 'liste/?ara=deniz',
  'liste/?sure=hs&kimle=sevgili', 'planlarim/', 'planlarim/#gecmis', 'planlarim/#favoriler', 'profil/', 'mesajlar/', 'bildirimler/', 'favoriler/', 'rezervasyonlar/',
  'urun/?id=yok', 'rezervasyon/', 'gonderi/?id=yok', 'kisi/?u=yok', 'sohbet/?k=yok', 'profil/?gorunum=misafir', 'planlarim/?gorunum=gezgin',
  ...listProducts().flatMap(p => ['urun/?id=' + p.id, 'rezervasyon/?id=' + p.id]),
  ...Object.values(USERS).map(u => 'kisi/?u=' + u.kul), ...Object.keys(USERS).map(k => 'sohbet/?k=' + k),
  ...listPosts().map(p => 'gonderi/?id=' + p.id), 'gonderi/?id=a1', 'gonderi/?id=a4',
  /* SEO sayfaları (scripts/seo.mjs): şehir, otel ve tur sayfaları, her deneyimin kalıcı sayfası */
  ...listPages().map(pg => pg.path), ...listProducts().map(p => p.path)];

describe.skipIf(!VAR)('v2 tarayıcıda', () => {
  let server, base, browser;
  beforeAll(async () => {
    server = createServer(sunucu.sun);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = 'http://127.0.0.1:' + server.address().port + '/v2/';
    browser = await chromium.launch();
  });
  afterAll(async () => { if (browser) await browser.close(); if (server) server.close(); });

  const baglam = () => browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, locale: 'tr-TR', timezoneId: 'Europe/Istanbul' });
  const izle = page => {
    const sorun = [];
    page.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith(new URL(base).origin)) sorun.push('dış istek: ' + r.url()); });
    page.on('console', m => { if (m.type() === 'error') sorun.push('konsol: ' + m.text()); });
    page.on('pageerror', e => sorun.push('hata: ' + e.message));
    page.on('requestfailed', r => sorun.push('yüklenemedi: ' + r.url()));
    page.on('response', r => { if (r.status() >= 400) sorun.push(r.status() + ': ' + r.url()); });
    return sorun;
  };

  it('bütün sayfalar hatasız açılıyor, taşmıyor, başlığı ve içeriği var', async () => {
    const ctx = await baglam(), bulgular = [];
    const bak = async yol => {
      const page = await ctx.newPage(), sorun = izle(page);
      await page.goto(base + yol, { waitUntil: 'networkidle' });
      const d = await page.evaluate(() => ({
        tasma: document.documentElement.scrollWidth - innerWidth,
        h1: !!document.querySelector('h1'),
        bos: ((document.querySelector('main') || document.body).innerText || '').trim().length < 5,
      }));
      if (d.tasma > 0) sorun.push('yatay taşma ' + d.tasma + 'px');
      if (!d.h1) sorun.push('h1 yok');
      if (d.bos) sorun.push('içerik boş');
      if (sorun.length) bulgular.push(yol + '\n  ' + sorun.join('\n  '));
      await page.close();
    };
    /* sekizer sayfa birlikte */
    for (let i = 0; i < SAYFALAR.length; i += 8) await Promise.all(SAYFALAR.slice(i, i + 8).map(bak));
    await ctx.close();
    expect(bulgular, bulgular.join('\n')).toEqual([]);
    expect(SAYFALAR.length).toBeGreaterThan(100);
  }, 240000);

  /* bu cihazda tutulan, kullanıcının yazdığı metin: sayfa açılmadan yazılır */
  const KOD = '</textarea><img src=x data-xss>';
  const ile = async (kayit, yol) => {
    const ctx = await baglam(), page = await ctx.newPage(), sorun = izle(page);
    await page.addInitScript(k => { for (const [a, v] of Object.entries(k)) localStorage.setItem(a, JSON.stringify(v)); }, kayit);
    await page.goto(base + yol, { waitUntil: 'networkidle' });
    return { ctx, page, sorun, xss: () => page.evaluate(() => document.querySelectorAll('img[data-xss]').length) };
  };

  it('mesaj önizlemesi metni yazıldığı gibi gösteriyor', async () => {
    const { ctx, page, sorun, xss } = await ile({ 'm360-mesaj': { ek: { selin: [{ text: KOD, at: '10:00', t: Date.now() }] } } }, 'mesajlar/');
    expect(await xss()).toBe(0);
    expect(await page.textContent('.ms-r .pv')).toBe('Sen: ' + KOD);
    await page.goto(base + 'sohbet/?k=selin', { waitUntil: 'networkidle' });
    expect(await xss()).toBe(0);
    expect(sorun).toEqual([]);
    await ctx.close();
  }, 30000);

  it('değerlendirme metni çekmecede yazıldığı gibi', async () => {
    const { ctx, page, sorun, xss } = await ile({ 'm360-degerlendir': { 'kapadokya-turu': { puan: 9, metin: KOD, alt: {}, t: 0 } } }, 'planlarim/#gecmis');
    await page.click('[data-rate="kapadokya-turu"]');
    await page.waitForSelector('#plSheet.open');
    expect(await xss()).toBe(0);
    expect(await page.inputValue('#rvTxt')).toBe(KOD);
    expect(sorun).toEqual([]);
    await ctx.close();
  }, 30000);

  it('yorum ve paylaşım metni akışta yazıldığı gibi', async () => {
    const { ctx, page, sorun, xss } = await ile({
      'm360-yorum': { p1: [{ text: KOD, at: Date.now(), to: '' }] },
      'm360-paylas': [{ id: 'mx', productId: 'kapadokya-turu', title: '', text: KOD, with: KOD, thumbs: [], media: 2, video: false, created: Date.now() }],
    }, 'gonderi/?id=p1');
    expect(await xss()).toBe(0);
    await page.goto(base + 'baglan/', { waitUntil: 'networkidle' });
    expect(await xss()).toBe(0);
    expect(await page.textContent('[data-post="mx"] .txt')).toContain(KOD);
    expect(sorun).toEqual([]);
    await ctx.close();
  }, 30000);

  it('Keşfet: arama kartı yana kayar, ipucu her açılışta ve sekme değişince, kategoriler sekmeyle eşleşir', async () => {
    const ctx = await baglam(), page = await ctx.newPage(), sorun = izle(page);
    const sx = f => page.evaluate(f);
    const oynuyor = () => sx(() => document.getElementById('sx').classList.contains('nudge'));
    const ipucu = () => page.waitForFunction(() => document.getElementById('sx').classList.contains('nudge'), null, { timeout: 3000 }).then(() => true, () => false);
    const bitti = () => page.waitForFunction(() => !document.getElementById('sx').classList.contains('nudge'), null, { timeout: 4000 });
    const kartlar = () => page.$$eval('.koll-g:not([hidden]) .kl', a => a.map(x => x.getAttribute('href')));

    /* açılış: ipucu oynar; kartlar seçili sekmenin (Turlar) kategorileri */
    await page.goto(base, { waitUntil: 'networkidle' });
    expect(await ipucu()).toBe(true);
    const adres = t => listCollections(t).map(pg => pg.path);
    expect(await kartlar()).toEqual(adres('tur'));
    expect(await page.textContent('.koll-g:not([hidden]) h2')).toBe('Tur çeşitleri');
    await bitti();
    /* sekme değişince kartlar değişir, ipucu yeniden oynar */
    await page.click('#tab-otel');
    expect(await kartlar()).toEqual(adres('otel'));
    expect(await page.textContent('.koll-g:not([hidden]) h2')).toBe('Otel çeşitleri');
    expect(await ipucu()).toBe(true);
    await bitti();
    /* her girişte yeniden */
    await page.reload({ waitUntil: 'networkidle' });
    expect(await ipucu()).toBe(true);
    await bitti();

    /* şeridin sonunda son kart kenar boşluğu (16 px) kadar içeride; sütunlar küsuratlı, kaydırma tam sayı */
    await sx(() => document.getElementById('sx').scrollTo({ left: 99999 }));
    await page.waitForTimeout(300);
    const bosluk = await sx(() => innerWidth - Math.max(...[...document.querySelectorAll('.koll-g:not([hidden]) .kl')].map(k => k.getBoundingClientRect().right)));
    expect(bosluk).toBeGreaterThanOrEqual(15);
    expect(bosluk).toBeLessThan(18);
    /* kartlardayken sekme değişince yalnızca kartlar yenilenir (form görünmüyor) */
    await page.click('#tab-etkinlik');
    expect(await kartlar()).toEqual(adres('etkinlik'));
    await page.waitForTimeout(600);
    expect(await oynuyor()).toBe(false);
    expect(sorun).toEqual([]);
    await ctx.close();

    /* hareketi azalt açıksa ipucu yok */
    const sakin = await browser.newContext({ viewport: { width: 360, height: 780 }, reducedMotion: 'reduce' });
    const p2 = await sakin.newPage();
    await p2.goto(base, { waitUntil: 'networkidle' });
    await p2.click('#tab-otel');
    expect(await p2.waitForFunction(() => document.getElementById('sx').classList.contains('nudge'), null, { timeout: 1500 }).then(() => true, () => false)).toBe(false);
    await sakin.close();
  }, 40000);

  it('Keşfet açılırken kaymıyor: JavaScript geç gelse de yerleşim kayması (CLS) 0,1 altında', async () => {
    for (const width of [390, 320]) {
      const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, locale: 'tr-TR', timezoneId: 'Europe/Istanbul' });
      const page = await ctx.newPage();
      /* yavaş bağlantı: sayfa önce JavaScript'siz boyanır, modüller sonra gelir */
      await page.route(/\/js\/[a-z0-9-]+\.js/, async r => { await new Promise(t => setTimeout(t, 300)); await r.continue(); });
      await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; }))
        .observe({ type: 'layout-shift', buffered: true }); });
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.waitForSelector('#timeRail > *');
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => window.__cls), width + 'px').toBeLessThan(0.1);
      await ctx.close();
    }
  }, 30000);

  it('SEO sayfası: kendi adresinde açılır; yalnızca sayfanın deneyimleri ve süzgeçleri', async () => {
    const api = await import('../v2/js/api.js');
    const pg = api.listPages().find(x => x.path === 'turlar/kultur/');
    const ctx = await baglam(), page = await ctx.newPage(), sorun = izle(page);
    await page.goto(base + pg.path, { waitUntil: 'networkidle' });
    /* üst kısım HTML'deki gibi kalır: kapak, sayfa yolu, başlık, giriş */
    expect(await page.textContent('#lsTitle')).toBe('Kültür turları');
    expect(await page.textContent('.bc')).toBe('KeşfetTurlar');
    expect(await page.textContent('#lsSub')).toBe(pg.intro);
    expect(await page.$eval('header.pg-top', h => h.classList.contains('cover'))).toBe(true);
    expect(await page.title()).toBe(api.pageTitle(pg));
    expect(await page.getAttribute('link[rel=canonical]', 'href')).toBe('https://bedirinci.github.io/mola360/v2/turlar/kultur/');
    /* kategori satırı ve kiminle süzgeci yok; süre süzgeci yalnızca sayfada olan süreler; sıra önerilen */
    expect(await page.$('#cats')).toBeNull();
    const l = pg.ids.map(api.getProduct);
    /* süzgeçler Filtreler çekmecesinde */
    await page.click('#ltFilter');
    expect(await page.$$('#lfBody [data-k="kimle"]')).toHaveLength(0);
    expect(await page.$$eval('#lfBody [data-k="sure"]', a => a.map(b => b.dataset.v))).toEqual(api.BUCKETS.map(b => b[0]).filter(b => l.some(p => p.b === b)));
    await page.click('#lfSheet [data-x]');
    expect(await page.$$eval('#list .vk h3', a => a.map(x => x.textContent))).toEqual(l.map(p => p.title));
    /* açıklama, SSS ve ilgili sayfalar açık; SSS açılır kapanır */
    const kat = () => page.$$eval('body [data-kat]', a => a.map(e => e.hidden));
    expect(await kat()).toEqual([false, false, false]);
    await page.click('.kat-seo details summary');
    expect(await page.$eval('.kat-seo details', d => d.open)).toBe(true);
    /* Keşfet'teki kart bu sayfaya gider */
    await page.goto(base, { waitUntil: 'networkidle' });
    expect(await page.getAttribute('.koll-g:not([hidden]) .kl[href="turlar/kultur/"]', 'href')).toBe('turlar/kultur/');
    await page.goto(base + pg.path, { waitUntil: 'networkidle' });
    /* süre seçilince adres sayfada kalır; liste sayfanın tamamı olmadığı için alttaki bölümler gizlenir */
    await page.click('#ltFilter');
    const sure = await page.getAttribute('#lfBody [data-k="sure"]', 'data-v');
    await page.click('#lfBody [data-k="sure"][data-v="' + sure + '"]');
    await page.click('#lfOk');
    expect(page.url()).toBe(base + pg.path + '?sure=' + sure);
    expect(await page.$$eval('#list .vk', a => a.length)).toBe(l.filter(p => p.b === sure).length);
    expect(await kat()).toEqual([true, true, true]);
    expect(await page.textContent('#lsTitle')).toBe('Kültür turları');
    /* adresle açılınca da süre seçili gelir; süre kalkınca adres yalın */
    await page.goto(base + pg.path + '?sure=' + sure, { waitUntil: 'networkidle' });
    expect(await page.textContent('#ltN')).toBe('1');
    await page.click('#filters [data-off="sure"]');
    expect(page.url()).toBe(base + pg.path);
    expect(await kat()).toEqual([false, false, false]);
    expect(sorun).toEqual([]);
    await ctx.close();
  }, 30000);

  it('deneyim sayfası: kalıcı adreste tam sayfa çizilir, sayfa yolu kalır; etkinliğin tarihli yapısal verisi', async () => {
    const api = await import('../v2/js/api.js');
    const ctx = await baglam(), page = await ctx.newPage(), sorun = izle(page);
    const p = api.getProduct('kordon-caz-aksamlari');
    await page.goto(base + p.path, { waitUntil: 'networkidle' });
    /* urun.js aynı deneyimi tam haliyle çizer; başlık ve asıl adres kalıcı sayfanın */
    expect(await page.textContent('.u-hd h1')).toBe(p.title);
    expect(await page.textContent('.u-hd .bc')).toBe('KeşfetİzmirEtkinlikler');
    expect(await page.title()).toBe(api.productTitle(p));
    expect(await page.$$eval('link[rel=canonical]', a => a.map(x => x.getAttribute('href')))).toEqual(['https://bedirinci.github.io/mola360/v2/' + p.path]);
    /* bulunduğu sayfalar ürün sayfasının dışında, yeniden çizimde kalır */
    expect(await page.$$eval('.u-ilgili a', a => a.length)).toBeGreaterThan(0);
    /* etkinlik: yaklaşan her tarih için schema.org Event, saatiyle */
    const ev = JSON.parse(await page.textContent('#ldEtkinlik'))['@graph'];
    expect(ev.length).toBeGreaterThan(0);
    ev.forEach(e => { expect(e['@type']).toBe('Event'); expect(e.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T20:00:00\+03:00$/); expect(e.offers.url).toBe(base + p.path); });
    /* uygulama adresi (urun/?id=) asıl adres olarak kalıcı sayfayı gösterir */
    await page.goto(base + 'urun/?id=kum-beach-club', { waitUntil: 'networkidle' });
    expect(await page.getAttribute('link[rel=canonical]', 'href')).toBe(base + 'izmir/mekanlar/kum-beach-club/');
    /* kartlar kalıcı adrese gider */
    await page.goto(base + 'izmir/', { waitUntil: 'networkidle' });
    expect(await page.$$eval('.rail .vk .lk', a => a.every(x => !x.getAttribute('href').includes('urun/?id=')))).toBe(true);
    expect(sorun).toEqual([]);
    await ctx.close();
  }, 30000);

  it('rezervasyon özetinde ad ve e-posta yazıldığı gibi', async () => {
    const { ctx, page, sorun, xss } = await ile({}, 'rezervasyon/?id=kum-beach-club');
    await page.click('#bkDate [data-gun]');
    await page.click('#ctaGo');
    await page.waitForSelector('#bkForm');
    await page.fill('#name', KOD + ' Yılmaz');
    await page.fill('#email', '<img/src=x/data-xss>@ornek.com');
    await page.waitForTimeout(500);
    await page.click('#ctaGo');
    await page.waitForSelector('#okBox');
    expect(await xss()).toBe(0);
    expect(await page.textContent('.bk-sum')).toContain(KOD + ' Yılmaz');
    expect(sorun).toEqual([]);
    await ctx.close();
  }, 30000);
});
