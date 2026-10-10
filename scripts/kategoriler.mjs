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

   Arama motoru için sayfada ayrıca: türüne göre başlık (Karadeniz turları —
   fiyatlar ve tarihler), fiyat içeren açıklama, paylaşım önizlemesi (Open
   Graph), yapısal veri (JSON-LD: koleksiyon sayfası, ürün listesi, sayfa
   yolu, SSS), görünen sayfa yolu, veriden yazılmış açıklama ve sık sorulan
   sorular, ilgili kategorilere bağlar ve site haritası (v2/sitemap.xml).
   Üst kısım her kategoride aynı: kapak, sayfa yolu, başlık, giriş metni
   (KOLEKSIYON'un üçüncü öğesi). Kategori satırı ve kiminle süzgeçleri
   yok; süre süzgeci yalnızca kategoride olan süreler (liste.js). Süre
   seçilince adres kategori sayfasında kalır (?sure=hs); listenin altındaki
   bölümler (data-kat) liste kategorinin tamamı olmadığı için gizlenir.

   Sayfa tarihten bağımsızdır: tarih bugüne göre hesaplanır (etkinlik
   kartındaki gün), sabit HTML'e yazılsa ertesi gün eskirdi. Kartta
   etkinliğin yalnızca saati durur, günü JavaScript çizince gelir.

   Veri ya da Liste sayfası değişince: npm run kategoriler.
   tests/v2.test.js diskteki sayfaların veriyle aynı olduğunu (tarih
   ileri alınsa da) denetler. */
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
const tekil = a => [...new Set(a.filter(Boolean))];
/* "A, B ve C" */
const ve = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ve ' + a[a.length - 1];
/* cümle içinde küçük harfle; özel adlar (Schengen) olduğu gibi */
const kucuk = t => /^Schengen/.test(t) ? t : t.charAt(0).toLocaleLowerCase('tr') + t.slice(1);
const tl = n => n.toLocaleString('tr-TR') + ' TL';
/* fiyatın birimi cümle içinde */
const BIRIM = { 'kişi başı': 'kişi başı', '2 gece toplam': '2 gece toplam', bilet: 'bilet başına', seans: 'seans başına', 'min. harcama': 'minimum harcama' };
/* "Göreme, Nevşehir · Denize 120 m" → ["Göreme", "Nevşehir"] */
const konum = p => { const a = p.place.split(' · ')[0].split(', '); return a.length > 1 ? [a.slice(0, -1).join(', '), a[a.length - 1]] : [a[0], '']; };
/* aynı şehirdekiler bir arada: "Göreme (Nevşehir) ve Kemer (Antalya)", "Harbiye ve Maçka (İstanbul); Kordon Açıkhava (İzmir)" */
const konumlar = l => { const m = new Map(); l.forEach(p => { const [y, s] = konum(p); m.set(s, tekil([...(m.get(s) || []), y])); });
  const g = [...m].map(([s, y]) => ve(y) + (s ? ' (' + s + ')' : ''));
  return [...m.values()].some(y => y.length > 1) ? g.join('; ') : ve(g); };
/* etkinliğin saati ("20:00", "tüm gün"); gün bugüne göre değiştiği için ayrı */
const saat = p => p.time ? p.facts[0].split(' · ').slice(1).join(' · ') : '';
const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
/* yapısal veri; metindeki "<" kaçar ki </script> betiği kapatmasın */
const LD = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';

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

/* Sık sorulan sorular: yalnızca veriden; tarih yok. [[soru, yanıt]] */
function sorular(api, c, l) {
  const t = c.q.tur, ad = c.name, ps = l.map(p => p.price), lo = Math.min(...ps), hi = Math.max(...ps);
  const u = tekil(l.map(p => p.unit)), en = l.find(p => p.price === lo), bir = l.length === 1;
  const fiyat = (bir ? 'Fiyat ' : 'Fiyatlar ') + (u.length === 1 ? BIRIM[u[0]] + ' ' : '') + (lo === hi ? tl(lo) : tl(lo) + ' ile ' + tl(hi) + ' arasında') + '.'
    + (u.length > 1 ? ' Birim deneyime göre değişiyor: ' + ve(u.map(x => BIRIM[x])) + '.' : '')
    + (bir || lo === hi ? '' : ' En uygun seçenek ' + en.title + ', ' + BIRIM[en.unit] + ' ' + tl(lo) + '.');
  /* "Göreme Mağara Otel (kahvaltı dahil), Sealight Resort (her şey dahil)" */
  const her = f => ve(l.map(p => p.title + ' (' + f(p) + ')')) + '.';
  const s = [[ad + ' fiyatları ne kadar?', fiyat]];
  if (t === 'tur') {
    const k = tekil(l.flatMap(p => p.place.split(' · ').filter(x => / çıkışlı$/.test(x)).map(x => x.replace(/ çıkışlı$/, ''))));
    if (k.length) s.push([ad + ' nereden kalkıyor?', (k.length > 1 ? 'Kalkış şehirleri: ' : 'Kalkış şehri: ') + ve(k) + '.']);
    const d = tekil(l.map(p => p.info));
    if (d.length) s.push([ad + ' kaç gün sürüyor?', (d.length > 1 ? 'Süreler: ' : 'Süre: ') + ve(d.map(kucuk)) + '.']);
    if (l.some(p => p.visa)) s.push([ad + ' için vize gerekiyor mu?', her(p => p.visa ? kucuk(p.visa) : 'vize gerekmiyor')]);
  } else if (t === 'etkinlik') {
    s.push([ad + ' nerede ve saat kaçta?', her(p => p.place.split(' · ')[0] + (saat(p) ? ' · ' + saat(p) : '')) + ' Tarihler her etkinliğin kendi sayfasında.']);
  } else {
    s.push([ad + ' nerede?', 'Konum' + (l.length > 1 ? 'lar' : '') + ': ' + konumlar(l) + '.']);
    if (t === 'otel') s.push([ad + ' kahvaltı dahil mi?', her(p => kucuk(p.facts[1]))]);
    if (t === 'aktivite') s.push([ad + ' ne kadar sürüyor?', her(p => kucuk(p.facts[0]))]);
    if (t === 'mekan') s.push([ad + ' için hangi seçenekler var?', her(p => ve((p.opts ? p.opts.map(o => o[0]) : p.facts).map(kucuk)))]);
  }
  const ip = l.map(p => api.bookingSpec(p).cancel);
  s.push([ad + ' için iptal koşulları neler?', tekil(ip).length === 1 ? ip[0] + ' hakkı var.' : her(p => kucuk(api.bookingSpec(p).cancel))]);
  return s;
}

/* her deneyimin kendi sayfasında ne var (türüne göre) */
const ICERIK = {
  tur: 'kalkış tarihleri, kalkış noktaları, fiyatlar ve yaşayanların paylaşımları',
  otel: 'giriş tarihleri, odalar, olanaklar ve yaşayanların paylaşımları',
  etkinlik: 'tarihler, saatler, bilet fiyatları ve yaşayanların paylaşımları',
  aktivite: 'seanslar, fiyatlar ve yaşayanların paylaşımları',
  mekan: 'seçenekler, fiyatlar ve yaşayanların paylaşımları'
};

/* her kategorinin sayfası: [{ slug, html }] */
export async function kategoriSayfalari() {
  const { api, productCard, ROOT, all } = await veri(), yerel = t => t.split(ROOT).join('../');
  const tpl = readFileSync(join(V2, 'liste', 'index.html'), 'utf8');
  return all.map(c => {
    const { tur, ...f } = c.q, th = f.tema ? api.getTheme(f.tema) : null;
    /* liste.js ile aynı sıra: temada temanın sırası */
    const l = api.listProducts({ type: tur, ...f });
    if (th) l.sort((a, b) => th.ids.indexOf(a.id) - th.ids.indexOf(b.id));
    const url = SITE + c.slug + '/', TURLER = api.TYPES.find(x => x[0] === tur)[2], baslik = api.collectionTitle(c);
    /* açıklama en çok 160 harf: ad, sığdığı kadar deneyim, başlangıç fiyatı */
    const son = ' Fiyatlar ' + tl(Math.min(...l.map(p => p.price))) + '\'den başlıyor; ayrıntılar ve yaşayanların paylaşımları mola360\'ta.';
    const ozet = k => c.name + (k ? ': ' + l.slice(0, k).map(p => p.title).join(', ') + (k < l.length ? ' ve diğerleri' : '') : '') + '.' + son;
    let n = l.length;
    while (n && ozet(n).length > 160) n--;
    const desc = ozet(n), sss = sorular(api, c, l);
    /* ilgili kategoriler: önce aynı yer ya da temanın başka türleri (Karadeniz otelleri), sonra aynı türün ötekileri */
    const ilgili = [...all.filter(x => x.q.tur !== tur && (f.yer ? x.q.yer === f.yer : x.q.tema === f.tema)), ...all.filter(x => x.q.tur === tur && x !== c)];
    /* kartta etkinliğin günü yerine yalnızca saati: gün bugüne göre değişir, JavaScript çizince gelir */
    const kart = p => productCard(saat(p) ? { ...p, facts: [saat(p), ...p.facts.slice(1)] } : p);
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', '@id': url, url, name: baslik, description: desc, inLanguage: 'tr-TR',
        isPartOf: { '@type': 'WebSite', name: 'mola360', url: SITE }, breadcrumb: { '@id': url + '#sayfa-yolu' }, mainEntity: { '@id': url + '#liste' } },
      { '@type': 'BreadcrumbList', '@id': url + '#sayfa-yolu', itemListElement: [['Keşfet', SITE], [TURLER, SITE + 'liste/?tur=' + tur], [c.name]]
        .map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(item ? { item } : {}) })) },
      { '@type': 'ItemList', '@id': url + '#liste', name: c.name, numberOfItems: l.length,
        itemListElement: l.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + 'urun/?id=' + p.id, name: p.title })) },
      { '@type': 'FAQPage', '@id': url + '#sss', mainEntity: sss.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) }
    ] };
    let s = tpl.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n' + IZ);
    s = tek(s, /<title>[^<]*<\/title>/.exec(s)[0], '<title>' + h(baslik) + '</title>');
    s = tek(s, /<meta name="description" content="[^"]*">/.exec(s)[0], '<meta name="description" content="' + h(desc) + '">\n<link rel="canonical" href="' + url + '">'
      + '\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="mola360">\n<meta property="og:locale" content="tr_TR">'
      + '\n<meta property="og:title" content="' + h(baslik.replace(/ \| mola360$/, '')) + '">\n<meta property="og:description" content="' + h(desc) + '">'
      + '\n<meta property="og:url" content="' + url + '">\n<meta name="twitter:card" content="summary">\n' + LD(ld));
    s = tek(s, '<body>', '<body data-q="' + h(q(c.q)) + '" data-kat="' + c.slug + '">');
    /* üst kısım her kategoride aynı: kapak (temanın ya da ilk deneyimin görseli),
       sayfa yolu, başlık ve kategorinin kendi giriş metni */
    s = tek(s, '<header class="pg-top slim">', '<header class="pg-top slim cover" style="--g:' + yerel(c.bg) + '">');
    /* görünen sayfa yolu başlığın üstünde; son adım (bu sayfa) başlığın kendisi */
    s = tek(s, '<h1 id="lsTitle">Keşfet</h1>', '<nav class="bc" aria-label="Sayfa yolu"><ol><li><a href="../">Keşfet</a></li><li><a href="../liste/?tur=' + tur + '">' + TURLER + '</a></li></ol></nav>\n  '
      + '<h1 id="lsTitle">' + h(c.name) + '</h1>');
    s = tek(s, '<p id="lsSub"></p>', '<p id="lsSub">' + h(c.intro) + '</p>');
    /* kategori satırı (Tümü, Turlar, Oteller …) yok: sayfada yalnızca bu kategorinin deneyimleri */
    s = tek(s, '<nav class="cats" aria-label="Kategori" id="cats"></nav>\n', '');
    s = tek(s, '<span id="lsCount"></span>', '<span id="lsCount">' + l.length + ' deneyim</span>');
    s = tek(s, '<div class="stack" id="list"></div>', '<div class="stack" id="list">' + yerel(l.map(kart).join('')) + '</div>\n'
      + '<section class="box kat-seo" aria-labelledby="kat-h" data-kat><h2 id="kat-h">' + h(c.name) + ' hakkında</h2>'
      + '<p>Bu sayfada ' + ve(l.map(p => '<a href="../urun/?id=' + p.id + '">' + h(p.title) + '</a>')) + ' var. ' + (l.length > 1 ? 'Her birinin' : 'Kendi') + ' sayfasında ' + ICERIK[tur]
      + ' bulunuyor; rezervasyonu doğrudan mola360\'ta yapabilirsin.</p></section>\n'
      + '<section class="box kat-seo" aria-labelledby="kat-sss" data-kat><h2 id="kat-sss">Sık sorulan sorular</h2><div class="u-faq">'
      + sss.map(([q, a]) => '<details><summary><h3>' + h(q) + '</h3>' + CHEV + '</summary><p>' + h(a) + '</p></details>').join('') + '</div></section>\n'
      + (ilgili.length ? '<section class="box kat-seo" aria-labelledby="kat-il" data-kat><h2 id="kat-il">İlgili kategoriler</h2><ul class="kat-il">'
        + ilgili.map(x => '<li><a href="../' + x.slug + '/">' + h(x.name) + '</a></li>').join('') + '</ul></section>' : ''));
    return { slug: c.slug, html: s };
  });
}

/* site haritası: Keşfet ve kategori sayfaları (tarih yok; adresler değişince yeniden üretilir) */
export async function siteHaritasi() {
  const { all } = await veri();
  return '<?xml version="1.0" encoding="UTF-8"?>\n<!-- npm run kategoriler üretir, elle değiştirme -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + [SITE, ...all.map(c => SITE + c.slug + '/')].map(u => '  <url><loc>' + u + '</loc></url>\n').join('') + '</urlset>\n';
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
  writeFileSync(join(V2, 'sitemap.xml'), await siteHaritasi());
  console.log('v2/index.html, v2/sitemap.xml ve ' + sayfalar.length + ' kategori sayfası güncellendi');
}
