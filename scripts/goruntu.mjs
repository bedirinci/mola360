#!/usr/bin/env node
/* Sayfaların ekran görüntüsü ve hızlı sağlık denetimi (npm run goruntu).

   NEDEN: her değişiklikten sonra "nasıl görünüyor?" sorusunun cevabı tek
   komut olsun. Kendi sunucusunu açar (scripts/sunucu.js), sayfaları
   telefon genişliğinde Chromium'da açar, görüntüleri .goruntu/ altına
   yazar ve her sayfa için iki şeyi söyler: konsolda hata var mı, sayfa
   yana taşıyor mu.

   Kullanım:
     npm run goruntu                         varsayılan sayfalar, 390 px
     npm run goruntu -- urun/?id=kapadokya-turu karadeniz-turlari/
     npm run goruntu -- --en 320 --tam       dar ekran, sayfanın tamamı
     npm run goruntu -- --ad once            dosya adlarının önüne "once-"
     npm run goruntu -- --js-yok             JavaScript kapalı (arama motoru gibi)
     npm run goruntu -- --kaydir .kat-seo    görüntüden önce bu öğeye kaydır

   Sayfa adresi v2/'ye göredir ("" Keşfet). Chromium kurulu olmalı
   (npx playwright install chromium). */
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { sun } = require('./sunucu.js');
const KOK = fileURLToPath(new URL('..', import.meta.url));
const VARSAYILAN = ['', 'liste/?tur=tur', 'karadeniz-turlari/', 'urun/?id=kapadokya-turu', 'baglan/', 'planlarim/', 'profil/', 'rezervasyon/?id=kapadokya-turu'];

const arg = process.argv.slice(2), sayfalar = [];
let en = 390, tam = false, ad = '', js = true, kaydir = '';
for (let i = 0; i < arg.length; i++) {
  const a = arg[i];
  if (a === '--en') en = Number(arg[++i]);
  else if (a === '--tam') tam = true;
  else if (a === '--ad') ad = arg[++i] + '-';
  else if (a === '--js-yok') js = false;
  else if (a === '--kaydir') kaydir = arg[++i];
  else sayfalar.push(a.replace(/^\/?(v2\/)?/, ''));
}
if (!sayfalar.length) sayfalar.push(...VARSAYILAN);

const klasor = join(KOK, '.goruntu');
mkdirSync(klasor, { recursive: true });
const sunucu = createServer(sun);
await new Promise(r => sunucu.listen(0, '127.0.0.1', r));
const kok = 'http://127.0.0.1:' + sunucu.address().port + '/v2/';
const tarayici = await chromium.launch();
let sorunlu = 0;
try {
  for (const s of sayfalar) {
    const ctx = await tarayici.newContext({ viewport: { width: en, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, javaScriptEnabled: js });
    const page = await ctx.newPage(), hata = [];
    page.on('pageerror', e => hata.push(e.message));
    page.on('console', m => { if (m.type() === 'error') hata.push(m.text()); });
    const yanit = await page.goto(kok + s, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    if (kaydir) await page.evaluate(q => { const e = document.querySelector(q); if (e) e.scrollIntoView(); }, kaydir);
    const tasma = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const dosya = join(klasor, ad + (s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'kesfet') + '-' + en + (js ? '' : '-jsyok') + '.png');
    await page.screenshot({ path: dosya, fullPage: tam });
    const sorun = [yanit.status() >= 400 && 'durum ' + yanit.status(), tasma > 0 && 'yana ' + tasma + ' px taşıyor', ...hata].filter(Boolean);
    if (sorun.length) sorunlu++;
    console.log((sorun.length ? '✗ ' : '✓ ') + ('/' + s).padEnd(36) + ' ' + dosya.slice(KOK.length) + (sorun.length ? '\n    ' + sorun.join('\n    ') : ''));
    await ctx.close();
  }
} finally {
  await tarayici.close();
  sunucu.close();
}
process.exitCode = sorunlu ? 1 : 0;
