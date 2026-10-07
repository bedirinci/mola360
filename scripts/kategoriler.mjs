#!/usr/bin/env node
/* Kategori (koleksiyon) sayfalarını ve Keşfet'teki kategori bağlantılarını
   veriden üretir. Kaynak: v2/js/data.js KOLEKSIYON (api.listCollections).

   NEDEN: arama motorları için her kategorinin kendi adresi ve kendi sayfası
   var: v2/karadeniz-turlari/ gibi. Sayfanın başlığı, açıklaması, ana
   başlığı, asıl adresi (canonical) ve ürün bağlantıları HTML'de durur;
   JavaScript çalıştırmayan arama motoru da görür. Sayfa Liste'nin aynısıdır
   (v2/liste/index.html şablon), seçimi body data-q'dan okur. Keşfet'teki
   bütün sekmelerin kategori bağlantıları da v2/index.html'de durur;
   koleksiyon.js yalnızca seçili sekmeninkini gösterir.

   Veri ya da Liste sayfası değişince: npm run kategoriler.
   tests/v2.test.js diskteki sayfaların veriyle aynı olduğunu denetler. */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const V2 = fileURLToPath(new URL('../v2/', import.meta.url));
/* yayındaki adres (asıl adres için); alan adı gelince değişir */
export const SITE = 'https://bedirinci.github.io/mola360/v2/';
export const BAS = '<!-- kategoriler: npm run kategoriler üretir, elle değiştirme -->';
export const SON = '<!-- /kategoriler -->';
/* üretilen sayfanın ilk satırı; eskiyen sayfalar bundan tanınıp silinir */
export const IZ = '<!-- kategori sayfası: npm run kategoriler üretir, elle değiştirme -->';
const h = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const q = o => Object.entries(o).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
const tek = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('şablonda bir kez yok: ' + a); return s.replace(a, () => b); };

async function veri() {
  const api = await import('../v2/js/api.js');
  const { productCard } = await import('../v2/js/cards.js');
  const { ROOT } = await import('../v2/js/root.js');
  const all = api.TYPES.flatMap(([t]) => api.listCollections(t));
  /* adres benzersiz olmalı ve sitenin kendi sayfalarıyla çakışmamalı */
  const slugs = all.map(c => c.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error('aynı adlı iki kategori');
  return { api, productCard, ROOT, all };
}

/* Keşfet: her sekmeye bir bölüm; ilki (Turlar) açık, ötekiler gizli */
export async function kategoriHtml() {
  const { api, ROOT } = await veri(), yerel = t => t.split(ROOT).join('');
  return api.TYPES.map(([t, ad], i) => '<section class="koll-g" data-tur="' + t + '" aria-labelledby="kh-' + t + '"' + (i ? ' hidden' : '') + '>'
    + '<h2 class="sr" id="kh-' + t + '">' + ad + ' çeşitleri</h2>'
    + api.listCollections(t).map(c => '<a class="kl" href="' + c.slug + '/" style="background:' + yerel(c.bg) + '"><b>' + h(c.name) + '</b></a>').join('')
    + '</section>').join('\n');
}

/* her kategorinin sayfası: [{ slug, html }] */
export async function kategoriSayfalari() {
  const { api, productCard, ROOT, all } = await veri(), yerel = t => t.split(ROOT).join('../');
  const tpl = readFileSync(join(V2, 'liste', 'index.html'), 'utf8');
  return all.map(c => {
    const { tur, ...f } = c.q, th = f.tema ? api.getTheme(f.tema) : null;
    /* liste.js ile aynı sıra: temada temanın sırası */
    const l = api.listProducts({ type: tur, ...f });
    if (th) l.sort((a, b) => th.ids.indexOf(a.id) - th.ids.indexOf(b.id));
    const ilk = l.slice(0, 3).map(p => p.title).join(', ') + (l.length > 3 ? ' ve diğerleri' : '');
    const desc = c.name + ': ' + ilk + '. Tarihleri, fiyatları ve yaşayanların paylaşımlarıyla mola360\'ta.';
    let s = tpl.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n' + IZ);
    s = tek(s, /<title>[^<]*<\/title>/.exec(s)[0], '<title>' + h(c.name) + ' — mola360</title>');
    s = tek(s, /<meta name="description" content="[^"]*">/.exec(s)[0], '<meta name="description" content="' + h(desc) + '">\n<link rel="canonical" href="' + SITE + c.slug + '/">');
    s = tek(s, '<body>', '<body data-q="' + h(q(c.q)) + '">');
    s = tek(s, '<header class="pg-top slim">', th ? '<header class="pg-top slim cover" style="--g:' + yerel(th.bg) + '">' : '<header class="pg-top slim">');
    s = tek(s, '<h1 id="lsTitle">Keşfet</h1>', '<h1 id="lsTitle">' + h(c.name) + '</h1>');
    s = tek(s, '<p id="lsSub"></p>', th ? '<p id="lsSub">' + h(th.intro) + '</p>' : '<p id="lsSub" hidden></p>');
    s = tek(s, '<span id="lsCount"></span>', '<span id="lsCount">' + l.length + ' deneyim</span>');
    s = tek(s, '<div class="stack" id="list"></div>', '<div class="stack" id="list">' + yerel(l.map(productCard).join('')) + '</div>');
    return { slug: c.slug, html: s };
  });
}

/* diskte kategori sayfası olan klasörler (üretilmiş olanlar) */
export const uretilmis = () => readdirSync(V2, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(V2, d.name, 'index.html')) && readFileSync(join(V2, d.name, 'index.html'), 'utf8').includes(IZ))
  .map(d => d.name);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const s = readFileSync(join(V2, 'index.html'), 'utf8'), a = s.indexOf(BAS), b = s.indexOf(SON);
  if (a < 0 || b < a) throw new Error('v2/index.html içinde kategori işaretleri yok');
  writeFileSync(join(V2, 'index.html'), s.slice(0, a + BAS.length) + '\n' + await kategoriHtml() + '\n' + s.slice(b));
  const sayfalar = await kategoriSayfalari(), yeni = new Set(sayfalar.map(x => x.slug)), eski = uretilmis();
  for (const { slug, html } of sayfalar) {
    const yol = join(V2, slug);
    if (existsSync(join(yol, 'index.html')) && !eski.includes(slug)) throw new Error('v2/' + slug + '/ sitenin kendi sayfası, kategori adı değişmeli');
    mkdirSync(yol, { recursive: true });
    writeFileSync(join(yol, 'index.html'), html);
  }
  for (const d of eski) if (!yeni.has(d)) rmSync(join(V2, d), { recursive: true });
  console.log('v2/index.html ve ' + sayfalar.length + ' kategori sayfası güncellendi');
}
