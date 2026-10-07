#!/usr/bin/env node
/* SEO sayfaları: şehir ağacı, deneyim sayfaları, Keşfet bağları, site
   haritası ve robots etiketleri (npm run seo). Kural kitabı: docs/seo.md.

   Veriden (v2/js/api.js, v2/js/sehirler.js) üretir:
   - açık her şehrin sayfa ağacı: v2/izmir/ (şehir), tür (v2/izmir/mekanlar/),
     tür + özellik (v2/izmir/mekanlar/kahvalti/), niyet
     (v2/izmir/sevgiliyle-yapilacaklar/) ve bölge (v2/izmir/alsancak/)
   - şehirdeki her deneyimin kalıcı sayfası (v2/izmir/mekanlar/kum-beach-club/)
   - Keşfet'teki bağlar (v2/index.html): arama kartının ardındaki
     koleksiyonlar ve "İzmir'de ne yapılır?" bölümü
   - site haritası (v2/sitemap.xml) ve bütün sayfaların robots etiketi (YAYIN)

   Liste sayfaları v2/liste/index.html'den, deneyim sayfaları
   v2/urun/index.html'den, şehir sayfası kendi düzeniyle üretilir. Hepsinde
   başlık, açıklama, asıl adres, Open Graph, yapısal veri (JSON-LD), görünen
   sayfa yolu ve içerik JavaScript olmadan HTML'dedir. Sayfaya tarih
   yazılmaz: tarih bugünden hesaplanır, sabit HTML ertesi gün eskirdi
   (etkinlik kartında yalnızca saat; gün JavaScript çizince gelir).

   Veri, şablon ya da şehir sayfaları değişince: npm run seo.
   tests/v2.test.js diskteki sayfaların üreticiyle aynı olduğunu (saat ileri
   alınsa da) denetler. */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const V2 = fileURLToPath(new URL('../v2/', import.meta.url));
/* yayındaki adres (asıl adres ve site haritası için); alan adı gelince değişir */
export const SITE = 'https://bedirinci.github.io/mola360/v2/';
/* Dizine ekleme. Yayına hazır olana kadar kapalı: bütün sayfalar "noindex,
   nofollow" (Bedir 2026-10-07: şimdilik kalsın). true olunca (docs/seo.md)
   Keşfet, şehir ve deneyim sayfaları "index, follow"; Liste, Ürün (?id=) ve
   Bağlan "noindex, follow"; kişisel sayfalar "noindex, nofollow". */
export const YAYIN = false;
/* üretilen sayfanın ikinci satırı; eskiyen sayfalar bundan tanınıp silinir */
export const IZ = '<!-- seo sayfası: npm run seo üretir, elle değiştirme -->';
const ESKI_IZ = '<!-- kategori sayfası: npm run kategoriler üretir, elle değiştirme -->';
export const BAS = '<!-- kategoriler: npm run seo üretir, elle değiştirme -->';
export const SON = '<!-- /kategoriler -->';
export const SBAS = '<!-- sehir: npm run seo üretir, elle değiştirme -->';
export const SSON = '<!-- /sehir -->';

const h = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const tek = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('şablonda bir kez yok: ' + a); return s.replace(a, () => b); };
const tekil = a => [...new Set(a.filter(Boolean))];
/* "A, B ve C" */
const ve = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ve ' + a[a.length - 1];
/* cümle içinde küçük harfle; özel adlar (Schengen) olduğu gibi */
const kucuk = t => /^Schengen/.test(t) ? t : t.charAt(0).toLocaleLowerCase('tr') + t.slice(1);
const buyuk = t => t.charAt(0).toLocaleUpperCase('tr') + t.slice(1);
const tl = n => n.toLocaleString('tr-TR') + ' TL';
/* uzun metni kelime sınırında kes */
const kes = (t, n) => t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n - 1)).replace(/[,;:·—-]$/, '') + '…';
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
const derinlik = yol => yol.split('/').filter(Boolean).length;

/* robots etiketi: rel v2/ altındaki dosya yolu (izmir/index.html), uretilen SEO sayfası mı */
export const robotsOf = (rel, uretilen) => !YAYIN ? 'noindex, nofollow'
  : uretilen || rel === 'index.html' ? 'index, follow'
    : /^(liste|urun|baglan)\//.test(rel) ? 'noindex, follow' : 'noindex, nofollow';

async function veri() {
  const api = await import('../v2/js/api.js');
  const { productCard } = await import('../v2/js/cards.js');
  const { ROOT } = await import('../v2/js/root.js');
  const S = await import('../v2/js/sehirler.js');
  const sehirler = api.listCities().map(c => ({ ...c, sayfalar: api.listCityPages(c.id) }));
  /* adresler benzersiz; deneyim adresi şehir sayfasıyla çakışmaz */
  const yollar = [...sehirler.flatMap(c => c.sayfalar.map(p => p.path)), ...sehirler.flatMap(c => api.listProducts({ sehir: c.id }).map(p => p.path))];
  if (new Set(yollar).size !== yollar.length) throw new Error('aynı adreste iki sayfa: ' + yollar.filter((y, i) => yollar.indexOf(y) !== i));
  return { api, productCard, ROOT, S, sehirler };
}

/* şablonu sayfanın derinliğine göre oku: "../" bağları önek olur */
const sablon = (ad, onek) => readFileSync(join(V2, ad, 'index.html'), 'utf8').replace(/(href|src)="\.\.\//g, '$1="' + onek);

/* <head>: başlık, açıklama, asıl adres, robots, Open Graph, yapısal veri */
function bas(s, { baslik, desc, url, ld }) {
  s = s.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n' + IZ);
  s = tek(s, /<meta name="robots" content="[^"]*">/.exec(s)[0], '<meta name="robots" content="' + robotsOf('', true) + '">');
  s = tek(s, /<title>[^<]*<\/title>/.exec(s)[0], '<title>' + h(baslik) + '</title>');
  return tek(s, /<meta name="description" content="[^"]*">/.exec(s)[0], '<meta name="description" content="' + h(desc) + '">\n<link rel="canonical" href="' + url + '">'
    + '\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="mola360">\n<meta property="og:locale" content="tr_TR">'
    + '\n<meta property="og:title" content="' + h(baslik.replace(/ \| mola360$/, '')) + '">\n<meta property="og:description" content="' + h(desc) + '">'
    + '\n<meta property="og:url" content="' + url + '">\n<meta name="twitter:card" content="summary">\n' + LD(ld));
}

const yolHtml = (adimlar, onek) => '<nav class="bc" aria-label="Sayfa yolu"><ol>' + adimlar.map(([ad, yol]) => '<li><a href="' + onek + yol + '">' + h(ad) + '</a></li>').join('') + '</ol></nav>';
const yolLd = (url, adimlar, son) => ({ '@type': 'BreadcrumbList', '@id': url + '#sayfa-yolu',
  itemListElement: [...adimlar.map(([name, yol]) => [name, SITE + yol]), [son]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(item ? { item } : {}) })) });
const cipler = (l, onek) => '<ul class="kat-il">' + l.map(pg => '<li><a href="' + onek + pg.path + '">' + h(pg.kisa || pg.name) + '</a></li>').join('') + '</ul>';
const sss = l => '<div class="u-faq">' + l.map(([q, a]) => '<details><summary><h3>' + h(q) + '</h3>' + CHEV + '</summary><p>' + h(a) + '</p></details>').join('') + '</div>';
const sssLd = (url, l) => ({ '@type': 'FAQPage', '@id': url + '#sss', mainEntity: l.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) });

/* Sık sorulan sorular: yalnızca veriden; tarih yok. [[soru, yanıt]] */
function sorular(api, pg, l) {
  const ad = pg.name, ps = l.map(p => p.price), lo = Math.min(...ps), hi = Math.max(...ps), bir = l.length === 1;
  const u = tekil(l.map(p => p.unit)), en = l.find(p => p.price === lo);
  /* "Göreme Mağara Otel (kahvaltı dahil), Sealight Resort (her şey dahil)" */
  const her = f => ve(l.map(p => p.title + ' (' + f(p) + ')')) + '.';
  const ip = l.map(p => api.bookingSpec(p).cancel);
  const iptal = [ad + ' için iptal koşulları neler?', tekil(ip).length === 1 ? ip[0] + ' hakkı var.' : her(p => kucuk(api.bookingSpec(p).cancel))];
  if (!pg.q.tur) {
    /* tür karışık sayfa (niyet, bölge): türlere göre öne çıkanlar ve en uygun fiyatlar */
    const turler = api.TYPES.filter(([t]) => l.some(p => api.typeKey(p.type) === t));
    const soru = ad.replace(/ yapılacaklar$/, ' neler yapılır?');
    return [
      [soru === ad ? ad + ' neler?' : soru, turler.map(([t, , cok]) => cok + ': ' + ve(l.filter(p => api.typeKey(p.type) === t).slice(0, 3).map(p => p.title)) + '.').join(' ')],
      [ad + ' için fiyatlar ne kadar?', 'En uygun seçenekler: ' + ve(turler.map(([t, , cok]) => { const x = l.filter(p => api.typeKey(p.type) === t).sort((a, b) => a.price - b.price)[0];
        return kucuk(cok) + ' için ' + x.title + ', ' + BIRIM[x.unit] + ' ' + tl(x.price); })) + '.'],
      iptal];
  }
  const t = pg.q.tur;
  const fiyat = (bir ? 'Fiyat ' : 'Fiyatlar ') + (u.length === 1 ? BIRIM[u[0]] + ' ' : '') + (lo === hi ? tl(lo) : tl(lo) + ' ile ' + tl(hi) + ' arasında') + '.'
    + (u.length > 1 ? ' Birim deneyime göre değişiyor: ' + ve(u.map(x => BIRIM[x])) + '.' : '')
    + (bir || lo === hi ? '' : ' En uygun seçenek ' + en.title + ', ' + BIRIM[en.unit] + ' ' + tl(lo) + '.');
  const s = [[ad + ' için fiyatlar ne kadar?', fiyat]];
  if (t === 'tur') {
    const duraklar = tekil(l.flatMap(p => { const d = api.bookingSpec(p).dep; return d && d.city ? d.stops.map(x => x.yer) : []; }));
    if (duraklar.length) s.push([ad + ' nereden kalkıyor?', 'Kalkış noktaları: ' + ve(duraklar.slice(0, 6)) + '. Hangi turun nereden kalktığı turun sayfasında.']);
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
  s.push(iptal);
  return s;
}

/* her deneyimin kendi sayfasında ne var (türüne göre) */
const ICERIK = {
  tur: 'kalkış tarihleri, kalkış noktaları, program, fiyatlar ve yaşayanların paylaşımları',
  otel: 'giriş tarihleri, odalar, olanaklar ve yaşayanların paylaşımları',
  etkinlik: 'tarihler, saatler, bilet fiyatları ve yaşayanların paylaşımları',
  aktivite: 'seanslar, fiyatlar ve yaşayanların paylaşımları',
  mekan: 'seçenekler, fiyatlar ve yaşayanların paylaşımları'
};

/* Keşfet kartındaki kısa ad: şehir adı düşer ("İzmir kahvaltı mekânları" → "Kahvaltı mekânları") */
const kisaAd = (pg, c) => buyuk(pg.name.replace(new RegExp('^' + c.ad + '(\'(de|da|te|ta)|( çıkışlı))? '), ''));
/* sayfanın ilgili sayfaları: aynı türün öteki sayfaları önce, sonra deneyimleri en çok örtüşenler */
function ilgili(pg, sayfalar) {
  const ort = x => x.ids.filter(i => pg.ids.includes(i)).length;
  return sayfalar.filter(x => x !== pg && x.kind !== 'sehir' && (ort(x) || (pg.q.tur && x.q.tur === pg.q.tur)))
    .map(x => [x, (pg.q.tur && x.q.tur === pg.q.tur ? 100 : 0) + (x.kind === pg.kind ? 10 : 0) + ort(x)])
    .sort((a, b) => b[1] - a[1]).slice(0, 12).map(([x]) => x);
}

/* tür, tür + özellik, niyet ve bölge sayfası (Liste şablonu) */
function listeSayfasi(ctx, c, pg) {
  const { api, productCard, ROOT } = ctx, onek = '../'.repeat(derinlik(pg.path)), yerel = t => t.split(ROOT).join(onek);
  const l = pg.ids.map(api.getProduct), url = SITE + pg.path, baslik = api.pageTitle(pg);
  const turSayfa = pg.kind === 'oz' ? c.sayfalar.find(x => x.kind === 'tur' && x.q.tur === pg.q.tur) : null;
  const adimlar = [['Keşfet', ''], [c.ad, c.id + '/'], ...(turSayfa ? [[api.TYPES.find(t => t[0] === pg.q.tur)[2], turSayfa.path]] : [])];
  /* açıklama en çok 160 harf: ad, sığdığı kadar deneyim, başlangıç fiyatı */
  const son = ' Fiyatlar ' + tl(Math.min(...l.map(p => p.price))) + '\'den başlıyor; ayrıntılar ve yaşayanların paylaşımları mola360\'ta.';
  const ozet = k => pg.name + (k ? ': ' + l.slice(0, k).map(p => p.title).join(', ') + (k < l.length ? ' ve diğerleri' : '') : '') + '.' + son;
  let n = l.length;
  while (n && ozet(n).length > 160) n--;
  const desc = ozet(n), soru = sorular(api, pg, l), il = ilgili(pg, c.sayfalar);
  const kart = p => productCard(saat(p) ? { ...p, facts: [saat(p), ...p.facts.slice(1)] } : p);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': url, url, name: baslik, description: desc, inLanguage: 'tr-TR',
      isPartOf: { '@type': 'WebSite', name: 'mola360', url: SITE }, breadcrumb: { '@id': url + '#sayfa-yolu' }, mainEntity: { '@id': url + '#liste' } },
    yolLd(url, adimlar, pg.name),
    { '@type': 'ItemList', '@id': url + '#liste', name: pg.name, numberOfItems: l.length,
      itemListElement: l.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + p.path, name: p.title })) },
    sssLd(url, soru)] };
  let s = bas(sablon('liste', onek), { baslik, desc, url, ld });
  s = tek(s, '<body>', '<body data-q="' + h(Object.entries(pg.q).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&')) + '" data-kat="' + pg.path + '">');
  s = tek(s, '<header class="pg-top slim">', '<header class="pg-top slim cover" style="--g:' + yerel(pg.bg) + '">');
  s = tek(s, '<h1 id="lsTitle">Keşfet</h1>', yolHtml(adimlar, onek) + '\n  <h1 id="lsTitle">' + h(pg.name) + '</h1>');
  s = tek(s, '<p id="lsSub"></p>', '<p id="lsSub">' + h(pg.intro) + '</p>');
  /* kategori satırı (Tümü, Turlar, Oteller …) yok: sayfada yalnızca bu sayfanın deneyimleri */
  s = tek(s, '<nav class="cats" aria-label="Kategori" id="cats"></nav>\n', '');
  s = tek(s, '<span id="lsCount"></span>', '<span id="lsCount">' + l.length + ' deneyim</span>');
  s = tek(s, '<div class="stack" id="list"></div>', '<div class="stack" id="list">' + yerel(l.map(kart).join('')) + '</div>\n'
    + '<section class="box kat-seo" aria-labelledby="kat-h" data-kat><h2 id="kat-h">' + h(pg.name) + ' hakkında</h2>'
    + '<p>Bu sayfada ' + ve(l.map(p => '<a href="' + onek + p.path + '">' + h(p.title) + '</a>')) + ' var. '
    + (l.length > 1 ? 'Her birinin' : 'Kendi') + ' sayfasında ' + (pg.q.tur ? ICERIK[pg.q.tur] : 'tarihler, fiyatlar ve yaşayanların paylaşımları')
    + ' bulunuyor; rezervasyonu doğrudan mola360\'ta yapabilirsin.</p></section>\n'
    + '<section class="box kat-seo" aria-labelledby="kat-sss" data-kat><h2 id="kat-sss">Sık sorulan sorular</h2>' + sss(soru) + '</section>\n'
    + (il.length ? '<section class="box kat-seo" aria-labelledby="kat-il" data-kat><h2 id="kat-il">İlgili sayfalar</h2>' + cipler(il, onek) + '</section>' : ''));
  return s;
}

/* şehir sayfası: türlere göre öne çıkanlar, kiminle, semtler, tanıtım ve SSS */
function sehirSayfasi(ctx, c) {
  const { api, productCard, ROOT } = ctx, pg = c.sayfalar.find(x => x.kind === 'sehir'), onek = '../', yerel = t => t.split(ROOT).join(onek);
  const url = SITE + pg.path, baslik = api.pageTitle(pg), tur = c.sayfalar.filter(x => x.kind === 'tur');
  const desc = kes(pg.intro + ' Etkinlik, mekân, otel, aktivite ve tur; tarihleri ve fiyatlarıyla.', 160);
  const kart = p => productCard(saat(p) ? { ...p, facts: [saat(p), ...p.facts.slice(1)] } : p);
  /* sorusu olan sayfalar: soru, öne çıkan üç deneyim ve sayfanın kendisi */
  const soru = c.sayfalar.filter(x => x.soru).map(x => [x.soru, 'Öne çıkanlar: ' + ve(x.ids.slice(0, 3).map(i => api.getProduct(i).title)) + '. Tamamı için: ' + x.name + '.', x]);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': url, url, name: baslik, description: desc, inLanguage: 'tr-TR',
      isPartOf: { '@type': 'WebSite', name: 'mola360', url: SITE }, breadcrumb: { '@id': url + '#sayfa-yolu' },
      about: { '@type': 'City', name: c.ad, address: { '@type': 'PostalAddress', addressLocality: c.ad, addressCountry: 'TR' } } },
    yolLd(url, [['Keşfet', '']], pg.name),
    { '@type': 'ItemList', '@id': url + '#sayfalar', name: pg.name, numberOfItems: c.sayfalar.length - 1,
      itemListElement: c.sayfalar.filter(x => x !== pg).map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + x.path, name: x.name })) },
    sssLd(url, soru)] };
  let s = bas(sablon('liste', onek), { baslik, desc, url, ld });
  s = tek(s, '<body>', '<body data-sehir="' + c.id + '">');
  s = tek(s, '<header class="pg-top slim">', '<header class="pg-top slim cover" style="--g:' + c.bg + '">');
  s = tek(s, '<h1 id="lsTitle">Keşfet</h1>', yolHtml([['Keşfet', '']], onek) + '\n  <h1 id="lsTitle">' + h(pg.name) + '</h1>');
  s = tek(s, '<p id="lsSub"></p>', '<p id="lsSub">' + h(pg.intro) + '</p>');
  s = tek(s, '<nav class="cats" aria-label="Kategori" id="cats"></nav>\n', '');
  const bolum = (id, baslik, ic) => '<section class="sec sh-sec" aria-labelledby="sh-' + id + '"><div class="hd"><h2 id="sh-' + id + '">' + baslik + '</h2></div>' + ic + '</section>\n';
  const main = '<main class="sh">\n<nav class="sh-tur" aria-label="Türler">' + cipler(tur, onek) + '</nav>\n'
    + tur.map(x => { const oz = c.sayfalar.filter(y => y.kind === 'oz' && y.q.tur === x.q.tur).map(y => ({ ...y, kisa: kisaAd(y, c) }));
      return '<section class="sh-sec" aria-labelledby="sh-' + x.yol + '"><div class="sec"><div class="hd"><h2 id="sh-' + x.yol + '">' + h(x.name) + '</h2><div class="more-l"><a class="all" href="' + onek + x.path + '">Tümü →</a>'
        + '<div class="arrows" data-for="r-' + x.yol + '"></div></div></div></div>'
        + '<div class="rail" id="r-' + x.yol + '">' + yerel(x.ids.slice(0, 8).map(i => kart(api.getProduct(i))).join('')) + '</div>'
        + (oz.length ? '<div class="sh-oz">' + cipler(oz, onek) + '</div>' : '') + '</section>\n'; }).join('')
    + bolum('kim', 'Kiminle?', cipler(c.sayfalar.filter(x => x.kind === 'niyet'), onek))
    + bolum('bolge', 'Semt ve ilçeler', cipler(c.sayfalar.filter(x => x.kind === 'bolge'), onek))
    + '<section class="box kat-seo" aria-labelledby="kat-h"><h2 id="kat-h">' + h(c.ad) + ' hakkında</h2><p>' + h(c.hakkinda) + '</p></section>\n'
    + '<section class="box kat-seo" aria-labelledby="kat-sss"><h2 id="kat-sss">Sık sorulan sorular</h2><div class="u-faq">'
    + soru.map(([q, a, x]) => '<details><summary><h3>' + h(q) + '</h3>' + CHEV + '</summary><p>' + h(a.slice(0, -(x.name.length + 1))) + '<a href="' + onek + x.path + '">' + h(x.name) + '</a>.</p></details>').join('')
    + '</div></section>\n</main>';
  s = tek(s, /<main>[\s\S]*<\/main>/.exec(s)[0], main);
  return tek(s, 'src="../js/liste.js"', 'src="../js/sehir.js"');
}

/* deneyimin yapısal verisi: türüne göre schema.org tipi; puan yalnızca gerçek veride (örnek veride yok) */
function deneyimLd(api, p, url, info) {
  const t = api.typeKey(p.type), S = api.bookingSpec(p), [yer, il] = konum(p), geo = p.geo;
  const adres = { '@type': 'PostalAddress', addressLocality: yer, addressRegion: il || 'İzmir', addressCountry: 'TR' };
  const teklif = { '@type': 'Offer', price: p.price, priceCurrency: 'TRY', availability: 'https://schema.org/InStock', url };
  const ortak = { '@id': url + '#deneyim', name: p.title, description: info.about || p.place, url,
    ...(!p.sample && p.count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.score, bestRating: 10, ratingCount: p.count } } : {}) };
  const yerli = { address: adres, ...(geo ? { geo: { '@type': 'GeoCoordinates', latitude: geo[0], longitude: geo[1] } } : {}) };
  if (t === 'otel') return { '@type': 'Hotel', ...ortak, ...yerli, priceRange: tl(S.hotel.rooms[0].fiyat) + '\'den, gecelik',
    starRating: { '@type': 'Rating', ratingValue: (p.stars || '').length }, checkinTime: S.hotel.giris, checkoutTime: S.hotel.cikis,
    amenityFeature: S.hotel.olanak.map(name => ({ '@type': 'LocationFeatureSpecification', name, value: true })) };
  if (t === 'mekan') return { '@type': /Spa|Hamam|Masaj/.test(p.title) ? 'DaySpa' : /Bar|Akustik|Meyhane/.test(p.title) ? 'BarOrPub' : /Kahve/.test(p.title) ? 'CafeOrCoffeeShop'
    : /Beach/.test(p.title) ? 'LocalBusiness' : 'Restaurant', ...ortak, ...yerli, priceRange: (S.opts.length ? tl(Math.min(...S.opts.map(o => o[1]))) + ' – ' + tl(Math.max(...S.opts.map(o => o[1]))) : tl(p.price)) };
  if (t === 'tur') return { '@type': 'TouristTrip', ...ortak, touristType: tekil(p.with.map(w => ({ yalniz: 'Tek başına', sevgili: 'Çiftler', arkadas: 'Arkadaş grupları', aile: 'Aileler', cocuk: 'Çocuklu aileler', is: 'İş grupları' })[w])),
    ...(info.program.length ? { itinerary: { '@type': 'ItemList', itemListElement: info.program.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[1] })) } } : {}),
    provider: { '@type': 'Organization', name: 'mola360', url: SITE }, offers: teklif };
  /* etkinlikte tarih bugünden hesaplanır: Event verisini ürün sayfası JavaScript'le ekler (urun.js) */
  if (t === 'etkinlik') return { '@type': 'Product', ...ortak, category: 'Etkinlik bileti', offers: teklif };
  return { '@type': 'Product', ...ortak, category: 'Aktivite', offers: teklif };
}

/* deneyimin kalıcı sayfası (Ürün şablonu): içerik HTML'de, urun.js aynı içeriği çizer */
function deneyimSayfasi(ctx, c, p) {
  const { api } = ctx, onek = '../'.repeat(derinlik(p.path)), url = SITE + p.path, t = api.typeKey(p.type);
  const info = api.productDetails(p), S = api.bookingSpec(p), turSayfa = c.sayfalar.find(x => x.kind === 'tur' && x.q.tur === t);
  const adimlar = [['Keşfet', ''], [c.ad, c.id + '/'], ...(turSayfa ? [[api.TYPES.find(x => x[0] === t)[2], turSayfa.path]] : [])];
  const fiyat = (p.unit === 'kişi başı' ? 'Kişi başı ' : buyuk(BIRIM[p.unit] || p.unit) + ' ') + tl(p.price) + (S.opts.length > 1 || (S.hotel && S.hotel.rooms.length > 1) ? '\'den başlayan fiyatlarla.' : '.');
  const desc = kes((info.about || p.place) + ' ' + fiyat, 160);
  const ld = { '@context': 'https://schema.org', '@graph': [deneyimLd(api, p, url, info), yolLd(url, adimlar, p.title)] };
  const sayfalar = c.sayfalar.filter(x => x.kind !== 'sehir' && x.ids.includes(p.id));
  const sure = t === 'tur' ? p.info : t === 'etkinlik' ? saat(p) : t === 'otel' ? p.facts[1] : p.facts[0];
  const liste = a => '<ul>' + a.map(x => '<li>' + h(x) + '</li>').join('') + '</ul>';
  let s = bas(sablon('urun', onek), { baslik: api.productTitle(p), desc, url, ld });
  s = tek(s, '<body class="no-nav">', '<body class="no-nav" data-id="' + p.id + '">');
  s = tek(s, '<main id="urun"></main>', '<main id="urun">\n<header class="pg-top slim cover u-st" style="--g:' + p.bg.split(ctx.ROOT).join(onek) + '">'
    + yolHtml(adimlar, onek) + '<h1>' + h(p.title) + '</h1><p>' + h(p.type + ' · ' + p.place + (sure ? ' · ' + sure : '')) + '</p></header>\n'
    + '<section class="box"><h2>Hakkında</h2>' + (info.about ? '<p class="u-about">' + h(info.about) + '</p>' : '') + '<p>' + h(fiyat) + ' ' + h(S.cancel) + '.</p></section>\n'
    + (t === 'otel' ? '<section class="box"><h2>Odalar</h2>' + liste(S.hotel.rooms.map(r => r.ad + ': ' + r.alt + ', gecelik ' + tl(r.fiyat))) + '</section>\n'
      : info.program.length ? '<section class="box"><h2>' + h(info.progTitle) + '</h2>' + liste(info.program.map(x => [x[0], x[1], x[2]].filter(Boolean).join(' · '))) + '</section>\n' : '')
    + (info.dahil.length ? '<section class="box"><h2>Fiyata dahil</h2>' + liste(info.dahil) + (info.haric.length ? '<h3>Dahil değil</h3>' + liste(info.haric) : '') + '</section>\n' : '')
    + '<section class="box"><h2>' + h(info.placeTitle) + '</h2><p>' + h(info.place.filter(Boolean).join('. ')) + '</p></section>\n</main>\n'
    /* ilgili sayfalar ürün sayfasının dışında: urun.js içeriği yeniden çizince de kalır */
    + (sayfalar.length ? '<nav class="box kat-seo u-ilgili" aria-labelledby="u-il"><h2 id="u-il">Bu deneyimin bulunduğu sayfalar</h2>' + cipler(sayfalar, onek) + '</nav>' : ''));
  return s;
}

/* Keşfet: arama kartının ardındaki koleksiyonlar (sekmenin tür + özellik sayfaları); ilki (Turlar) açık */
export async function kategoriHtml() {
  const { api, ROOT, sehirler } = await veri(), yerel = t => t.split(ROOT).join('');
  return api.TYPES.map(([t, ad], i) => '<section class="koll-g" data-tur="' + t + '" aria-labelledby="kh-' + t + '"' + (i ? ' hidden' : '') + '>'
    + '<h2 class="sr" id="kh-' + t + '">' + ad + ' çeşitleri</h2>'
    + sehirler.flatMap(c => c.sayfalar.filter(pg => pg.kind === 'oz' && pg.q.tur === t).map(pg => '<a class="kl" href="' + pg.path + '" style="background:' + yerel(pg.bg) + '"><b>' + h(kisaAd(pg, c)) + '</b></a>')).join('')
    + '</section>').join('\n');
}

/* Keşfet: şehrin bütün sayfalarına bağlar ("İzmir'de ne yapılır?") */
export async function sehirHtml() {
  const { sehirler } = await veri();
  return sehirler.map(c => '<section class="sh-kesfet" aria-labelledby="h-' + c.id + '"><div class="sec"><div class="hd"><h2 id="h-' + c.id + '">' + h(c.de) + ' ne yapılır?</h2><a href="' + c.id + '/" class="all">Tümü →</a></div>'
    + ['tur', 'niyet', 'bolge'].map(k => cipler(c.sayfalar.filter(pg => pg.kind === k), '')).join('') + '</div></section>').join('\n');
}

/* bütün üretilen sayfalar: [{ yol (v2/ altında), html }] */
export async function seoSayfalari() {
  const ctx = await veri(), out = [];
  for (const c of ctx.sehirler) {
    out.push({ yol: c.id + '/', html: sehirSayfasi(ctx, c) });
    c.sayfalar.filter(pg => pg.kind !== 'sehir').forEach(pg => out.push({ yol: pg.path, html: listeSayfasi(ctx, c, pg) }));
    ctx.api.listProducts({ sehir: c.id }).forEach(p => out.push({ yol: p.path, html: deneyimSayfasi(ctx, c, p) }));
  }
  return out;
}

/* site haritası: Keşfet, şehir sayfaları ve deneyim sayfaları (tarih yok) */
export async function siteHaritasi() {
  const { api, sehirler } = await veri();
  const yollar = ['', ...sehirler.flatMap(c => [...c.sayfalar.map(pg => pg.path), ...api.listProducts({ sehir: c.id }).map(p => p.path)])];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<!-- npm run seo üretir, elle değiştirme -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + yollar.map(u => '  <url><loc>' + SITE + u + '</loc></url>\n').join('') + '</urlset>\n';
}

/* v2/ altındaki bütün sayfalar (rel: "izmir/mekanlar/index.html") */
export const sayfaDosyalari = () => {
  const out = [], gez = d => readdirSync(d, { withFileTypes: true }).forEach(e => {
    const f = join(d, e.name);
    if (e.isDirectory()) { if (!['css', 'js', 'img'].includes(e.name)) gez(f); } else if (e.name === 'index.html') out.push(relative(V2, f).split('\\').join('/'));
  });
  gez(V2);
  return out.sort();
};
/* diskte üretilmiş sayfalar (eski kategori sayfaları dahil) */
export const uretilmis = () => sayfaDosyalari().filter(f => { const s = readFileSync(join(V2, f), 'utf8'); return s.includes(IZ) || s.includes(ESKI_IZ); })
  .map(f => f.replace(/index\.html$/, ''));

const blokYaz = (s, a, b, ic, ad) => { const i = s.indexOf(a), j = s.indexOf(b); if (i < 0 || j < i) throw new Error('v2/index.html içinde ' + ad + ' işaretleri yok'); return s.slice(0, i + a.length) + '\n' + ic + '\n' + s.slice(j); };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let k = readFileSync(join(V2, 'index.html'), 'utf8');
  k = blokYaz(k, BAS, SON, await kategoriHtml(), 'kategori');
  k = blokYaz(k, SBAS, SSON, await sehirHtml(), 'şehir');
  writeFileSync(join(V2, 'index.html'), k);
  const sayfalar = await seoSayfalari(), yeni = new Set(sayfalar.map(x => x.yol)), eski = uretilmis();
  const elle = new Set(sayfaDosyalari().map(f => f.replace(/index\.html$/, '')).filter(y => !eski.includes(y)));
  for (const { yol, html } of sayfalar) {
    if (elle.has(yol)) throw new Error('v2/' + yol + ' sitenin kendi sayfası; şehir sayfası adı değişmeli');
    mkdirSync(join(V2, yol), { recursive: true });
    writeFileSync(join(V2, yol, 'index.html'), html);
  }
  /* eskiyen sayfalar ve boş kalan klasörleri */
  for (const y of eski) if (!yeni.has(y)) {
    rmSync(join(V2, y, 'index.html'));
    let d = join(V2, y);
    while (d.startsWith(V2) && d !== V2 && existsSync(d) && !readdirSync(d).length) { rmSync(d, { recursive: true }); d = dirname(d); }
  }
  /* robots: elle yazılan sayfalar da politikaya uyar (YAYIN) */
  for (const f of sayfaDosyalari()) {
    const yol = join(V2, f), s = readFileSync(yol, 'utf8'), r = '<meta name="robots" content="' + robotsOf(f, s.includes(IZ)) + '">';
    const t = s.replace(/<meta name="robots" content="[^"]*">/, r);
    if (t !== s) writeFileSync(yol, t);
  }
  writeFileSync(join(V2, 'sitemap.xml'), await siteHaritasi());
  console.log('v2/index.html, v2/sitemap.xml ve ' + sayfalar.length + ' SEO sayfası güncellendi');
}
