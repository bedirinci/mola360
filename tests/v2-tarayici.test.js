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
import { listProducts, listPosts, listCollections, TYPES } from '../v2/js/api.js';

const VAR = existsSync(chromium.executablePath());
const SAYFALAR = ['', 'baglan/', 'liste/', 'liste/?tur=otel', 'liste/?tarih=bu-hs', 'liste/?tema=doga', 'liste/?yer=kapadokya&tur=tur', 'liste/?ara=deniz',
  'liste/?sure=hs&kimle=sevgili', 'planlarim/', 'planlarim/#gecmis', 'planlarim/#favoriler', 'profil/', 'mesajlar/', 'bildirimler/', 'favoriler/', 'rezervasyonlar/',
  'urun/?id=yok', 'rezervasyon/', 'gonderi/?id=yok', 'kisi/?u=yok', 'sohbet/?k=yok', 'profil/?gorunum=misafir', 'planlarim/?gorunum=gezgin',
  ...listProducts().flatMap(p => ['urun/?id=' + p.id, 'rezervasyon/?id=' + p.id]),
  ...Object.values(USERS).map(u => 'kisi/?u=' + u.kul), ...Object.keys(USERS).map(k => 'sohbet/?k=' + k),
  ...listPosts().map(p => 'gonderi/?id=' + p.id), 'gonderi/?id=a1', 'gonderi/?id=a4',
  ...TYPES.flatMap(([t]) => listCollections(t).map(c => c.slug + '/'))];

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
    const adres = t => listCollections(t).map(c => c.slug + '/');
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

  it('kategori sayfası: kendi adresinde açılır; yalnızca kategorinin deneyimleri ve süzgeçleri', async () => {
    const api = await import('../v2/js/api.js');
    const ctx = await baglam(), page = await ctx.newPage(), sorun = izle(page);
    await page.goto(base + 'kultur-turlari/', { waitUntil: 'networkidle' });
    /* üst kısım HTML'deki gibi kalır: kapak, sayfa yolu, başlık, giriş */
    expect(await page.textContent('#lsTitle')).toBe('Kültür turları');
    expect(await page.textContent('.bc')).toBe('KeşfetTurlar');
    const K = api.listCollections('tur').find(c => c.slug === 'kultur-turlari');
    expect(await page.textContent('#lsSub')).toBe(K.intro);
    expect(await page.$eval('header.pg-top', h => h.classList.contains('cover'))).toBe(true);
    expect(await page.title()).toBe('Kültür turları — fiyatlar ve tarihler | mola360');
    expect(await page.getAttribute('link[rel=canonical]', 'href')).toBe(base + 'kultur-turlari/');
    /* kategori satırı ve kiminle süzgeci yok; süre süzgeci yalnızca kategoride olan süreler */
    expect(await page.$('#cats')).toBeNull();
    expect(await page.$$('[data-kimle]')).toHaveLength(0);
    const l = api.listProducts({ type: 'tur', tema: 'kultur' });
    expect(await page.$$eval('[data-sure]', a => a.map(b => b.dataset.sure))).toEqual(api.BUCKETS.map(b => b[0]).filter(b => l.some(p => p.b === b)));
    expect(await page.$$eval('#list .vk', a => a.length)).toBe(l.length);
    /* açıklama, SSS ve ilgili kategoriler açık; SSS açılır kapanır */
    const kat = () => page.$$eval('body [data-kat]', a => a.map(e => e.hidden));
    expect(await kat()).toEqual([false, false, false]);
    await page.click('.kat-seo details summary');
    expect(await page.$eval('.kat-seo details', d => d.open)).toBe(true);
    /* Keşfet'teki kart bu sayfaya gider */
    await page.goto(base, { waitUntil: 'networkidle' });
    expect(await page.getAttribute('.koll-g:not([hidden]) .kl[href="kultur-turlari/"]', 'href')).toBe('kultur-turlari/');
    await page.goto(base + 'kultur-turlari/', { waitUntil: 'networkidle' });
    /* süre seçilince adres kategori sayfasında kalır; liste kategorinin tamamı olmadığı için alttaki bölümler gizlenir */
    const sure = await page.getAttribute('[data-sure]', 'data-sure');
    await page.click('[data-sure="' + sure + '"]');
    expect(page.url()).toBe(base + 'kultur-turlari/?sure=' + sure);
    expect(await page.$$eval('#list .vk', a => a.length)).toBe(l.filter(p => p.b === sure).length);
    expect(await kat()).toEqual([true, true, true]);
    expect(await page.textContent('#lsTitle')).toBe('Kültür turları');
    /* adresle açılınca da süre seçili gelir; süre kalkınca adres yalın */
    await page.goto(base + 'kultur-turlari/?sure=' + sure, { waitUntil: 'networkidle' });
    expect(await page.getAttribute('[data-sure="' + sure + '"]', 'aria-pressed')).toBe('true');
    await page.click('[data-sure="' + sure + '"]');
    expect(page.url()).toBe(base + 'kultur-turlari/');
    expect(await kat()).toEqual([false, false, false]);
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
