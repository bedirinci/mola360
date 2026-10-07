/* v2 gerçek bir tarayıcıda (Chromium): bütün sayfalar hatasız açılır ve
   kullanıcının yazdığı metin hiçbir ekranda HTML olarak çalışmaz.

   Sayfa başına: konsol hatası, yakalanmamış hata, yüklenemeyen dosya,
   yatay taşma, başlıksız (h1) ya da boş sayfa olmamalı. Sayfalar örnek
   veriden çıkar: her ürün, her ürünün rezervasyonu, her kişi, her sohbet,
   her paylaşım. Yazı tipi isteği dışarı çıkmaz (boş yanıtlanır).

   Tarayıcı kurulu değilse atlanır (npx playwright install chromium); CI
   kurar (.github/workflows/ci.yml). */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import sunucu from '../scripts/sunucu.js';
import { USERS } from '../v2/js/data.js';
import { listProducts, listPosts } from '../v2/js/api.js';

const VAR = existsSync(chromium.executablePath());
const SAYFALAR = ['', 'baglan/', 'liste/', 'liste/?tur=otel', 'liste/?tarih=bu-hs', 'liste/?tema=doga', 'liste/?yer=kapadokya&tur=tur', 'liste/?ara=deniz',
  'liste/?sure=hs&kimle=sevgili', 'planlarim/', 'planlarim/#gecmis', 'planlarim/#favoriler', 'profil/', 'mesajlar/', 'bildirimler/', 'favoriler/', 'rezervasyonlar/',
  'urun/?id=yok', 'rezervasyon/', 'gonderi/?id=yok', 'kisi/?u=yok', 'sohbet/?k=yok', 'profil/?gorunum=misafir', 'planlarim/?gorunum=gezgin',
  ...listProducts().flatMap(p => ['urun/?id=' + p.id, 'rezervasyon/?id=' + p.id]),
  ...Object.values(USERS).map(u => 'kisi/?u=' + u.kul), ...Object.keys(USERS).map(k => 'sohbet/?k=' + k),
  ...listPosts().map(p => 'gonderi/?id=' + p.id), 'gonderi/?id=a1', 'gonderi/?id=a4'];

describe.skipIf(!VAR)('v2 tarayıcıda', () => {
  let server, base, browser;
  beforeAll(async () => {
    server = createServer(sunucu.sun);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = 'http://127.0.0.1:' + server.address().port + '/v2/';
    browser = await chromium.launch();
  });
  afterAll(async () => { if (browser) await browser.close(); if (server) server.close(); });

  const baglam = async () => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, locale: 'tr-TR', timezoneId: 'Europe/Istanbul' });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    return ctx;
  };
  const izle = page => {
    const sorun = [];
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
