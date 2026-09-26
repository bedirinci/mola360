/* ---------------- tek yönlendirici: liste, dizin ve "bulunamadı" ----------------
   GitHub Pages'te dosyası olmayan her adres 404.html'e düşüyor; o sayfa
   bu dosyayı yüklüyor. Burada adres veri kapısına soruluyor
   (MolaVeri.adres) ve cevaba göre ekran kuruluyor:

     type-list, category, listing,  → liste şablonu: başlık, alt sayfa
     theme, collection                çipleri, süzgeçler, sıralama, kartlar
     theme-index, collection-index  → tema/koleksiyon kartları
     product                        → ürün detayı (detail-shell.js)
     static                         → içerik sayfası (henüz yazılmadı)
     null                           → "bulunamadı"

   Yeni kategori, liste sayfası, tema veya ürün eklemek için HTML dosyası
   YAZILMIYOR: kaydı eklemek yetiyor, adres kendiliğinden çalışıyor.

   BİLİNEN SINIR: GitHub Pages bu sayfayı 404 durum koduyla sunuyor.
   Ziyaretçi için fark yok; arama motoru ise bu adresleri dizine almaz.
   Sunucu geldiğinde aynı ekran 200 ile ve sunucuda doldurulmuş olarak
   gelecek (docs/veri-sozlesmesi.md bölüm 12).

   Metin yazılmıyor: başlık, kırıntı, çip ve süzgeç adları taksonomiden;
   sayılar ve fiyatlar kayıtlardan. Burada yalnızca ekran kalıbı var.

   ADLAR: klasik <script> etiketleri üst kapsamı paylaştığı için üst
   seviye adlar LSP_ / lsp ile başlıyor. */

const LSP_NODE = (typeof require === 'function' && typeof module !== 'undefined' && module.exports);
const LSP_MOTOR = LSP_NODE ? require('./listing-engine.js') : null;

/* Motor fonksiyonları: Node'da modülden, tarayıcıda üst kapsamdan. */
function lspMotor(ad) {
  if (LSP_MOTOR && typeof LSP_MOTOR[ad] === 'function') return LSP_MOTOR[ad];
  const kapsam = (typeof globalThis !== 'undefined') ? globalThis : null;
  return kapsam && typeof kapsam[ad] === 'function' ? kapsam[ad] : null;
}

/* Kartın tipe göre satır simgesi ve tarih etiketi: anasayfa şeritleriyle
   aynı (app.js/cardSections). */
const LSP_KART_AYARI = {
  tour:     { meta1Icon: 'mapPin', meta2Label: 'En yakın:' },
  hotel:    { meta1Icon: 'mapPin', meta2Label: 'Müsait:' },
  activity: { meta1Icon: 'clock',  meta2Label: 'En yakın:' },
  event:    { meta1Icon: 'clock',  meta2Label: 'En yakın:' },
  venue:    { meta1Icon: 'mapPin', meta2Label: '' }
};

/* Bir süzgeç grubunda ilk bakışta görünen seçenek sayısı; fazlası
   "Tümünü göster" ile açılır. */
const LSP_GORUNEN_SECENEK = 6;

const LSP_IKON = {
  geri: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
  ara: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  suzgec: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="10" y1="18" x2="14" y2="18"></line></svg>',
  kapat: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  asagi: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>'
};

/* ---------------- saf yardımcılar ---------------- */
function lspKacis(metin) {
  return String(metin === undefined || metin === null ? '' : metin)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Sayfa kökü (<base>) altındaki yol. "/mola360/turlar/ege-turlari/" ve
   kök "/mola360/" → "turlar/ege-turlari/". Kök dışındaysa olduğu gibi. */
function lspGoreliYol(pathname, kokYol) {
  const p = String(pathname || '/');
  const k = String(kokYol || '/');
  return p.indexOf(k) === 0 ? p.slice(k.length) : p.replace(/^\/+/, '');
}

/* Kök göreli bağ: '' anasayfa, diğerleri sonda eğik çizgiyle (GitHub
   Pages dizin adresini öyle sunuyor). */
function lspHref(yol) {
  return yol ? yol.replace(/\/+$/, '') + '/' : './';
}

function lspSayimMetni(adet, birim) {
  return adet + ' ' + birim;
}

function lspKirintiMarkup(kirinti) {
  const son = kirinti.length - 1;
  return '<nav class="lst-crumbs" aria-label="Sayfa yolu"><ol>'
    + kirinti.map((k, i) => i === son || k.path === null
      ? '<li' + (i === son ? ' aria-current="page"' : '') + '>' + lspKacis(k.name) + '</li>'
      : '<li><a href="' + lspHref(k.path) + '">' + lspKacis(k.name) + '</a></li>').join('')
    + '</ol></nav>';
}

function lspCiplerMarkup(altlar) {
  if (!altlar || !altlar.length) return '';
  return '<nav class="lst-chips" aria-label="Alt sayfalar">'
    + altlar.map(c => '<a class="lst-chip' + (c.aktif ? ' is-active' : '') + '" href="' + lspHref(c.path) + '"'
      + (c.aktif ? ' aria-current="page"' : '') + '>' + lspKacis(c.name)
      + (c.adet !== null && c.adet !== undefined ? '<span class="lst-chip-count">' + c.adet + '</span>' : '')
      + '</a>').join('')
    + '</nav>';
}

/* Süzgeç grupları. acik: kapatılmış grupların kümesi değil, AÇILMIŞ
   "tümünü göster"lerin kümesi; kapaliGruplar: başlığından kapatılmış
   gruplar. İkisi yeniden çizimde korunur. */
function lspSuzgecMarkup(yuzeyler, kapaliGruplar, tumuAcik) {
  const gorunen = (yuzeyler || []).filter(y => y.gorunur);
  if (!gorunen.length) return '<p class="lst-filters-empty">Bu sayfada daraltılacak bir seçenek yok.</p>';
  return gorunen.map(y => {
    const kapali = kapaliGruplar && kapaliGruplar.has(y.key);
    const hepsi = tumuAcik && tumuAcik.has(y.key);
    const tek = y.kind === 'aralik' || y.kind === 'esik';
    const secenekler = y.secenekler.map((o, i) => {
      const gizli = !hepsi && i >= LSP_GORUNEN_SECENEK && !o.secili;
      return '<label class="lst-opt' + (tek ? ' is-single' : '') + (o.adet === 0 ? ' is-zero' : '') + '"' + (gizli ? ' hidden' : '') + '>'
        + '<input type="checkbox" data-alan="' + lspKacis(y.key) + '" value="' + lspKacis(o.slug) + '"' + (o.secili ? ' checked' : '') + '>'
        + '<span class="lst-opt-box" aria-hidden="true"></span>'
        + '<span class="lst-opt-name">' + lspKacis(o.name) + '</span>'
        + '<span class="lst-opt-count">' + o.adet + '</span>'
        + '</label>';
    }).join('');
    const fazla = y.secenekler.length - LSP_GORUNEN_SECENEK;
    const tumu = fazla > 0 && !hepsi
      ? '<button class="lst-opt-more" type="button" data-tumu="' + lspKacis(y.key) + '">Tümünü göster (' + y.secenekler.length + ')</button>'
      : '';
    return '<fieldset class="lst-fgroup' + (kapali ? ' is-collapsed' : '') + '" data-grup="' + lspKacis(y.key) + '">'
      + '<legend class="lst-visually-hidden">' + lspKacis(y.name) + '</legend>'
      + '<button class="lst-fgroup-head" type="button" data-grup-ac="' + lspKacis(y.key) + '" aria-expanded="' + (!kapali) + '">'
      + '<span>' + lspKacis(y.name) + '</span><span class="lst-fgroup-chev">' + LSP_IKON.asagi + '</span></button>'
      + '<div class="lst-fgroup-body">' + secenekler + tumu
      + (y.note ? '<p class="lst-fnote">' + lspKacis(y.note) + '</p>' : '')
      + '</div></fieldset>';
  }).join('');
}

function lspEtiketMarkup(etiketler) {
  if (!etiketler || !etiketler.length) return '';
  return etiketler.map(e => '<button class="lst-pill" type="button" data-kaldir="' + lspKacis(e.key) + '" data-deger="' + lspKacis(e.slug) + '"'
    + ' aria-label="' + lspKacis(e.name) + ' filtresini kaldır">' + lspKacis(e.name) + '<span class="lst-pill-x">' + LSP_IKON.kapat + '</span></button>').join('')
    + '<button class="lst-pill-clear" type="button" data-temizle>Tümünü temizle</button>';
}

function lspSiralamaMarkup(siralamalar, secili) {
  return (siralamalar || []).map(s => '<option value="' + lspKacis(s.slug) + '"' + (s.slug === secili ? ' selected' : '') + '>'
    + lspKacis(s.name) + '</option>').join('');
}

/* Satırdan kart: anasayfanın kart üreticisi (catalog.js) ve kart
   işaretlemesi (app.js/poiCardMarkup) kullanılıyor; liste sayfası ayrı
   bir kart tasarımı taşımıyor. İkisi de yüklü değilse boş. */
function lspKartlarMarkup(satirlar, bugun) {
  const kartUret = (typeof KATALOG_KART !== 'undefined') ? KATALOG_KART : null;
  const isaretle = (typeof poiCardMarkup === 'function') ? poiCardMarkup : null;
  if (!kartUret || !isaretle) return '';
  return (satirlar || []).map(s => {
    const uret = kartUret[s.type];
    const kart = uret ? uret(s.kayit, bugun) : null;
    return kart ? isaretle(LSP_KART_AYARI[s.type] || LSP_KART_AYARI.tour, kart) : '';
  }).join('');
}

/* Arama motoru için: sayfa yolu ve listedeki ürünler (yalnızca sayfası
   olanlar; bağsız bir öğe listelemek yanlış yapısal veri olurdu). */
function lspYapisalVeri(model, seo, satirlar, siteAdresi) {
  const kok = siteAdresi || '';
  const yol = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: model.kirinti.map((k, i) => {
      const oge = { '@type': 'ListItem', position: i + 1, name: k.name };
      if (k.path !== null) oge.item = kok + (k.path ? k.path + '/' : '');
      return oge;
    })
  };
  const out = [yol];
  const bagli = (satirlar || []).filter(s => s.kayit && !s.kayit.sample);
  if (seo && bagli.length) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: model.baslik,
      numberOfItems: bagli.length,
      itemListElement: bagli.map((s, i) => ({
        '@type': 'ListItem', position: i + 1, name: s.title, url: kok + s.path + '/'
      }))
    });
  }
  return out;
}

/* ---------------- ekran ---------------- */

/* Kanonik adreslerin kökü veri kapısında tek satır (KAPI_SITE_ADRESI). */
function lspSiteAdresi() {
  return (typeof KAPI_SITE_ADRESI !== 'undefined') ? KAPI_SITE_ADRESI : '';
}

/* Mobil üst çubuğun yüksekliği: yapışkan sonuç çubuğu onun altına
   oturuyor. Yükseklik güvenli alanla (çentik) değiştiği için ölçülüyor. */
function lspBaslikYuksekligi() {
  const b = document.querySelector('.lst-mobile-header');
  const h = b && b.offsetHeight ? b.offsetHeight : 0;
  document.body.style.setProperty('--lst-mh', h + 'px');
}

/* <head> alanları: sunucu geldiğinde bunları sunucu yazacak; bugün
   yönlendirici yazıyor. */
function lspMetaYaz(seo) {
  if (typeof document === 'undefined' || !seo) return;
  document.title = seo.title;
  const meta = (nitelik, ad, deger) => {
    let el = document.head.querySelector('meta[' + nitelik + '="' + ad + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(nitelik, ad);
      document.head.appendChild(el);
    }
    el.setAttribute('content', deger);
  };
  meta('name', 'description', seo.description);
  meta('name', 'robots', seo.noindex ? 'noindex, follow' : 'index, follow');
  meta('property', 'og:title', seo.ogTitle || seo.title);
  meta('property', 'og:description', seo.description);
  if (seo.canonical) meta('property', 'og:url', seo.canonical);
  let link = document.head.querySelector('link[rel="canonical"]');
  if (seo.canonical) {
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', seo.canonical);
  } else if (link) {
    link.remove();
  }
}

function lspYapisalYaz(veri) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('lspYapisal');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'lspYapisal';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(veri.length === 1 ? veri[0] : veri);
}

/* Mobil başlık: tur sayfasındakiyle aynı düzen (geri oku, iki satırlık
   başlık), sağda arama. */
function lspMobilBaslikMarkup(baslik, altBaslik, geriYol) {
  return '<div class="lst-mobile-header">'
    + '<a class="lst-mobile-back" href="' + lspHref(geriYol) + '" aria-label="Geri"><span class="icon">' + LSP_IKON.geri + '</span></a>'
    + '<div class="lst-mobile-heading"><span class="lst-mobile-title">' + lspKacis(baslik) + '</span>'
    + '<span class="lst-mobile-subtitle" id="lstMobileSub">' + lspKacis(altBaslik) + '</span></div>'
    + '<button class="lst-mobile-search" type="button" id="lstMobileSearch" aria-label="Ara"><span class="icon">' + LSP_IKON.ara + '</span></button>'
    + '</div>';
}

function lspGeriYolu(kirinti) {
  const onceki = (kirinti || []).slice(0, -1).reverse().find(k => k.path !== null);
  return onceki ? onceki.path : '';
}

/* Bulunamadı / yakında: aynı kalıp, farklı metin. oneriler: kart
   satırları (benzer ürünler). */
function lspBosSayfaMarkup(o) {
  return '<main class="lst-page lst-page-empty" id="lstPage">'
    + (o.kirinti ? lspKirintiMarkup(o.kirinti) : '')
    + '<section class="lst-state">'
    + '<span class="lst-state-code">' + lspKacis(o.rozet) + '</span>'
    + '<h1>' + lspKacis(o.baslik) + '</h1>'
    + '<p>' + lspKacis(o.metin) + '</p>'
    + '<div class="lst-state-actions">'
    + '<a class="btn-primary lst-state-btn" href="./">Anasayfaya dön</a>'
    + '<button class="lst-state-btn lst-state-ghost" type="button" data-ara>Sitede ara</button>'
    + '</div>'
    + (o.baglar && o.baglar.length
      ? '<nav class="lst-chips lst-state-links" aria-label="Öne çıkan sayfalar">'
        + o.baglar.map(b => '<a class="lst-chip" href="' + lspHref(b.path) + '">' + lspKacis(b.name) + '</a>').join('') + '</nav>'
      : '')
    + '</section>'
    + (o.oneriBaslik && o.oneriler
      ? '<section class="lst-suggest"><h2>' + lspKacis(o.oneriBaslik) + '</h2><div class="lst-grid">' + o.oneriler + '</div></section>'
      : '')
    + '</main>';
}

function lspDizinMarkup(model) {
  const gorsel = (typeof homeBlockImage === 'function') ? homeBlockImage : (x => x);
  return '<main class="lst-page" id="lstPage">'
    + lspKirintiMarkup(model.kirinti)
    + '<header class="lst-head"><h1>' + lspKacis(model.baslik) + '</h1></header>'
    + '<div class="collection-grid lst-index-grid">'
    + model.kartlar.map(k => '<a class="collection-tile" href="' + lspHref(k.path) + '">'
      + '<img src="' + lspKacis(gorsel(k.img)) + '" alt="" loading="lazy">'
      + '<span class="collection-tile-shade"></span>'
      + '<span class="collection-tile-text"><strong>' + lspKacis(k.name) + '</strong><span>'
      + lspKacis(k.text ? k.text + ' · ' + k.adetMetni : k.adetMetni) + '</span></span></a>').join('')
    + '</div></main>';
}

/* Hiç ürünü olmayan liste (henüz turu olmayan bir kategori): süzgeç
   ve sıralama gösterilmiyor, çünkü süzülecek bir şey yok. Kardeş
   sayfaların çipleri üstte kalıyor; ziyaretçi oradan devam eder. */
function lspBosListeMarkup(model) {
  return '<main class="lst-page" id="lstPage">'
    + lspKirintiMarkup(model.kirinti)
    + '<header class="lst-head"><h1>' + lspKacis(model.baslik) + '</h1></header>'
    + lspCiplerMarkup(model.altlar)
    + '<div class="lst-empty"><strong>' + lspKacis(model.baslik) + ' için şu an yayında ' + lspKacis(model.birim) + ' yok.</strong>'
    + '<p>Yeni seçenekler eklendiğinde burada görünecek. O zamana kadar yukarıdaki sayfalara göz atabilirsin.</p>'
    + '<a class="lst-state-btn lst-state-ghost" href="' + lspHref(lspGeriYolu(model.kirinti)) + '">'
    + lspKacis((model.kirinti[model.kirinti.length - 2] || { name: 'Anasayfa' }).name) + ' sayfasına dön</a></div>'
    + '</main>';
}

/* Arama sayfasının kutusu: GET formu, JS olmadan da çalışır. */
function lspAramaFormu(q) {
  return '<form class="lst-search" action="arama/" method="get" role="search">'
    + '<span class="icon" aria-hidden="true">' + LSP_IKON.ara + '</span>'
    + '<input type="search" name="q" value="' + lspKacis(q || '') + '" placeholder="Tur, otel, etkinlik, şehir ara…" aria-label="Arama" autocomplete="off" enterkeyhint="search">'
    + '<button class="btn-primary" type="submit">Ara</button></form>';
}

function lspListeIskeleti(model, seo) {
  return '<main class="lst-page" id="lstPage">'
    + lspKirintiMarkup(model.kirinti)
    + (model.kind === 'search' ? lspAramaFormu(model.q) : '')
    + '<header class="lst-head"><h1>' + lspKacis(model.baslik) + '</h1>'
    + '<p class="lst-summary">' + lspKacis(lspSayimMetni(seo.adet, model.birim)
      + (seo.enDusuk ? ' · en düşük ' + seo.enDusuk : '')) + '</p></header>'
    + lspCiplerMarkup(model.altlar)
    + '<div class="lst-layout">'
    + '<div class="lst-sheet-overlay" id="lstSheetOverlay" hidden></div>'
    + '<aside class="lst-filters" id="lstFilters" aria-label="Filtreler" tabindex="-1">'
    + '<div class="lst-filters-head"><strong>Filtreler</strong>'
    + '<button class="lst-link" type="button" data-temizle id="lstClearTop">Temizle</button>'
    + '<button class="lst-sheet-close" type="button" id="lstSheetClose" aria-label="Kapat">' + LSP_IKON.kapat + '</button></div>'
    + '<div class="lst-filters-body" id="lstFilterBody"></div>'
    + '<div class="lst-filters-foot"><button class="lst-link" type="button" data-temizle>Temizle</button>'
    + '<button class="btn-primary lst-apply" type="button" id="lstApply">Sonuçları gör</button></div>'
    + '</aside>'
    + '<section class="lst-results" aria-label="Sonuçlar">'
    + '<div class="lst-toolbar">'
    + '<span class="lst-count" id="lstCount" aria-live="polite"></span>'
    + '<div class="lst-toolbar-actions">'
    + '<button class="lst-tool-btn lst-filter-btn" type="button" id="lstFilterBtn" aria-controls="lstFilters" aria-expanded="false">'
    + '<span class="icon">' + LSP_IKON.suzgec + '</span>Filtrele<span class="lst-badge" id="lstBadge" hidden></span></button>'
    + '<label class="lst-tool-btn lst-sort"><span class="lst-visually-hidden">Sırala</span>'
    + '<select id="lstSort"></select><span class="icon lst-sort-chev">' + LSP_IKON.asagi + '</span></label>'
    + '</div></div>'
    + '<div class="lst-active" id="lstActive"></div>'
    + '<div class="lst-grid" id="lstGrid"></div>'
    + '<div class="lst-empty" id="lstEmpty" hidden></div>'
    + '<div class="lst-more-wrap"><button class="lst-more" type="button" id="lstMore" hidden>Daha fazla göster</button></div>'
    + '</section></div></main>';
}

/* Liste ekranını kurar ve süzgeçleri bağlar. */
function lspListeKur(kok, model, seo, bugun) {
  /* Arama sayfasında varsayılan sıralama "en alakalı"; diğer
     sayfalarda bu seçenek yok. */
  const arama = model.kind === 'search';
  const varsayilan = arama ? 'alaka' : 'onerilen';
  const alanlar = MolaVeri.yuzeyTanimlari(bugun);
  const oku = lspMotor('suzOku');
  const yaz = lspMotor('suzYaz');
  const degistir = lspMotor('suzDegistir');
  const sahip = lspMotor('suzSahipOlunanlar');
  const siralamalar = ((typeof SUZ_SIRALAMALAR !== 'undefined') ? SUZ_SIRALAMALAR : [])
    .filter(x => arama || !x.arama);
  let durum = oku(location.search, alanlar, varsayilan);
  const kapaliGruplar = new Set();
  const tumuAcik = new Set();
  let sayac = 0;
  let sonSonuc = null;

  kok.innerHTML = lspMobilBaslikMarkup(model.baslik, lspSayimMetni(seo.adet, model.birim), lspGeriYolu(model.kirinti))
    + lspListeIskeleti(model, seo);
  const $ = (id) => document.getElementById(id);
  $('lstSort').innerHTML = lspSiralamaMarkup(siralamalar, durum.siralama);

  /* Adres: motorun parametreleri yeniden yazılıyor, diğerleri (utm_*)
     korunuyor. Geçmişe yeni kayıt eklenmiyor: geri tuşu önceki SAYFAYA
     gitmeli, önceki süzgece değil. */
  const adresiYaz = () => {
    const sahipOlunan = sahip(alanlar);
    const yabanci = location.search.replace(/^\?/, '').split('&')
      .filter(p => p && sahipOlunan.indexOf(decodeURIComponent(p.split('=')[0])) === -1);
    const qs = [yaz(durum, alanlar, varsayilan)].concat(yabanci).filter(Boolean).join('&');
    history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  };

  const ciz = (sonuc) => {
    sonSonuc = sonuc;
    const birim = model.birim;
    const suzuldu = sonuc.etiketler.length > 0;
    $('lstCount').textContent = suzuldu
      ? sonuc.toplam + ' sonuç'
      : lspSayimMetni(sonuc.toplam, birim);
    const alt = $('lstMobileSub');
    if (alt) alt.textContent = (suzuldu ? sonuc.toplam + ' sonuç' : lspSayimMetni(sonuc.toplam, birim));

    /* Süzgeçler yeniden çiziliyor; odaktaki kutu yeniden odaklanıyor
       (klavyeyle gezen kullanıcı yerini kaybetmesin). */
    const odak = document.activeElement && document.activeElement.matches && document.activeElement.matches('input[data-alan]')
      ? [document.activeElement.getAttribute('data-alan'), document.activeElement.value] : null;
    $('lstFilterBody').innerHTML = lspSuzgecMarkup(sonuc.yuzeyler, kapaliGruplar, tumuAcik);
    if (odak) {
      const geri = $('lstFilterBody').querySelector('input[data-alan="' + odak[0] + '"][value="' + odak[1] + '"]');
      if (geri) geri.focus();
    }
    $('lstActive').innerHTML = lspEtiketMarkup(sonuc.etiketler);
    const secimSayisi = sonuc.etiketler.length;
    $('lstBadge').hidden = !secimSayisi;
    $('lstBadge').textContent = String(secimSayisi);
    $('lstApply').textContent = sonuc.toplam ? sonuc.toplam + ' sonucu gör' : 'Sonuç yok';
    document.querySelectorAll('[data-temizle]').forEach(b => { b.hidden = !secimSayisi; });

    $('lstGrid').innerHTML = lspKartlarMarkup(sonuc.satirlar, bugun);
    $('lstMore').hidden = !sonuc.dahaVar;
    const bos = $('lstEmpty');
    if (!sonuc.toplam) {
      bos.hidden = false;
      bos.innerHTML = suzuldu
        ? '<strong>Bu seçimle eşleşen ' + lspKacis(birim) + ' yok.</strong><p>Bir filtreyi kaldırmayı dene.</p>'
          + '<button class="lst-state-btn lst-state-ghost" type="button" data-temizle>Filtreleri temizle</button>'
        : '<strong>' + lspKacis(model.baslik) + ' için şu an yayında ' + lspKacis(birim) + ' yok.</strong>'
          + '<p>Yeni seçenekler eklendiğinde burada görünecek. O zamana kadar yukarıdaki sayfalara göz atabilirsin.</p>';
    } else {
      bos.hidden = true;
      bos.innerHTML = '';
    }
    lspYapisalYaz(lspYapisalVeri(model, seo, sonuc.satirlar, lspSiteAdresi()));
  };

  const sorgula = () => {
    const istek = ++sayac;
    return MolaVeri.liste({ temel: model.temel, alanlar, durum, bugun }).then(sonuc => {
      /* Arka arkaya iki tıklama: yalnızca SON sorgunun cevabı çizilir. */
      if (istek !== sayac || !sonuc) return;
      ciz(sonuc);
    });
  };

  const uygula = (yeni) => {
    durum = yeni;
    adresiYaz();
    sorgula();
  };

  /* ---- olaylar (tek delege dinleyici) ---- */
  const sayfa = $('lstPage');
  sayfa.addEventListener('change', (e) => {
    const kutu = e.target.closest('input[data-alan]');
    if (kutu) {
      const alan = alanlar.find(a => a.key === kutu.getAttribute('data-alan'));
      if (alan) uygula(degistir(durum, alan, kutu.value));
      return;
    }
    if (e.target.id === 'lstSort') {
      uygula({ secim: durum.secim, siralama: e.target.value, sayfa: 1 });
    }
  });

  sayfa.addEventListener('click', (e) => {
    const kaldir = e.target.closest('[data-kaldir]');
    if (kaldir) {
      const alan = alanlar.find(a => a.key === kaldir.getAttribute('data-kaldir'));
      if (alan) uygula(degistir(durum, alan, kaldir.getAttribute('data-deger')));
      return;
    }
    if (e.target.closest('[data-temizle]')) {
      uygula({ secim: {}, siralama: durum.siralama, sayfa: 1 });
      return;
    }
    const grup = e.target.closest('[data-grup-ac]');
    if (grup) {
      const k = grup.getAttribute('data-grup-ac');
      const fs = grup.closest('.lst-fgroup');
      const kapali = fs.classList.toggle('is-collapsed');
      grup.setAttribute('aria-expanded', String(!kapali));
      if (kapali) kapaliGruplar.add(k); else kapaliGruplar.delete(k);
      return;
    }
    const tumu = e.target.closest('[data-tumu]');
    if (tumu) {
      tumuAcik.add(tumu.getAttribute('data-tumu'));
      if (sonSonuc) ciz(sonSonuc);
      return;
    }
    if (e.target.closest('#lstMore')) {
      uygula({ secim: durum.secim, siralama: durum.siralama, sayfa: (durum.sayfa || 1) + 1 });
      return;
    }
    if (e.target.closest('#lstFilterBtn')) { lspSuzgecAc(true); return; }
    if (e.target.closest('#lstSheetClose') || e.target.closest('#lstApply') || e.target.id === 'lstSheetOverlay') {
      lspSuzgecAc(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('lst-sheet-open')) lspSuzgecAc(false);
  });

  return sorgula();
}

/* Mobilde süzgeçler alttan açılan sayfa. Masaüstünde yan sütun; bu
   fonksiyon orada görünür bir şey değiştirmez. */
function lspSuzgecAc(ac) {
  const panel = document.getElementById('lstFilters');
  const ortu = document.getElementById('lstSheetOverlay');
  const dugme = document.getElementById('lstFilterBtn');
  if (!panel) return;
  panel.classList.toggle('is-open', ac);
  if (ortu) ortu.hidden = !ac;
  document.body.classList.toggle('lst-sheet-open', ac);
  if (dugme) dugme.setAttribute('aria-expanded', String(ac));
  if (ac) panel.focus();
  else if (dugme) dugme.focus();
}

/* Bulunamadı: adres bir ürün adresine benziyorsa (tur/<slug>) o tipin
   öne çıkanları öneriliyor; ziyaretçi boş bir sayfada bırakılmıyor. */
function lspBulunamadi(kok, goreli, bugun) {
  const T = (typeof TAXONOMY_TYPES !== 'undefined') ? TAXONOMY_TYPES : {};
  const ilk = String(goreli || '').replace(/^\/+/, '').split('/')[0];
  const tip = Object.keys(T).find(t => T[t].path === ilk || T[t].base === ilk) || null;
  const baglar = Object.keys(T).map(t => ({ name: T[t].plural, path: T[t].base }))
    .concat([{ name: 'Fırsatlar', path: 'firsatlar' }]);
  const birim = tip ? T[tip].name.toLocaleLowerCase('tr-TR') : '';
  const sayfa = { title: 'Sayfa bulunamadı — mola360', description: 'Aradığın sayfa bulunamadı.', noindex: true, canonical: null };
  lspMetaYaz(sayfa);
  const tamam = (oneriler) => {
    kok.innerHTML = lspMobilBaslikMarkup('Sayfa bulunamadı', 'mola360', '')
      + lspBosSayfaMarkup({
        rozet: '404',
        baslik: tip && ilk === T[tip].path ? 'Bu ' + birim + ' yayında değil' : 'Aradığın sayfayı bulamadık',
        metin: tip && ilk === T[tip].path
          ? 'Adres değişmiş ya da ' + birim + ' satıştan kalkmış olabilir. Benzer seçeneklere göz atabilirsin.'
          : 'Bağlantı eskimiş ya da adres yanlış yazılmış olabilir. Aşağıdaki sayfalardan devam edebilirsin.',
        baglar,
        oneriBaslik: oneriler ? (tip ? 'Öne çıkan ' + T[tip].plural.toLocaleLowerCase('tr-TR') : 'Öne çıkanlar') : null,
        oneriler
      });
  };
  if (typeof MolaVeri === 'undefined') { tamam(null); return Promise.resolve(); }
  return MolaVeri.liste({ temel: tip ? { type: tip } : {}, durum: { secim: {}, siralama: 'onerilen', sayfa: 1 }, bugun })
    .then(sonuc => {
      const markup = sonuc ? lspKartlarMarkup(sonuc.satirlar.slice(0, 4), bugun) : '';
      tamam(markup || null);
    });
}

function lspYakinda(kok, model) {
  lspMetaYaz({ title: model.baslik + ' — mola360', description: model.baslik + ' — mola360.', noindex: true,
    canonical: null });
  kok.innerHTML = lspMobilBaslikMarkup(model.baslik, 'mola360', lspGeriYolu(model.kirinti))
    + lspBosSayfaMarkup({
      kirinti: model.kirinti,
      rozet: 'Yakında',
      baslik: model.baslik,
      metin: 'Bu sayfa hazırlanıyor. O zamana kadar aşağıdaki sayfalardan devam edebilirsin.',
      baglar: (typeof TAXONOMY_TYPES !== 'undefined')
        ? Object.keys(TAXONOMY_TYPES).map(t => ({ name: TAXONOMY_TYPES[t].plural, path: TAXONOMY_TYPES[t].base }))
        : []
    });
}

/* ---------------- arama sayfası ----------------
   /arama/?q=kapadokya — liste şablonu, temel süzgeç metin araması
   (veri kapısı: kapiAramaPuani). Sorgu yoksa ya da sonuç çıkmazsa
   kutu ve öneriler. Arama sayfası dizine girmez. */
function lspSorgu(arama) {
  const p = (typeof suzParametreler === 'function') ? suzParametreler(arama) : {};
  return String(p.q || '').trim().slice(0, 80);
}

function lspAramaKur(kok, bugun) {
  const q = lspSorgu(location.search);
  const model = MolaVeri.aramaModeli(q);
  const seo = MolaVeri.listeSeo(Object.assign({}, model, { temel: model.temel || { q: '' } }), bugun) || {};
  const adet = q ? MolaVeri.listele({ q }, bugun).length : 0;
  lspMetaYaz({ title: model.baslik + ' — mola360', description: 'mola360 içinde ara: tur, otel, aktivite, etkinlik ve mekân.',
    noindex: true, canonical: null });
  if (q && typeof gecAramaEkle === 'function') gecAramaEkle(q);
  if (q && adet) {
    const bitti = lspListeKur(kok, model, Object.assign({}, seo, { adet }), bugun);
    lspBaslikYuksekligi();
    window.addEventListener('resize', lspBaslikYuksekligi);
    return bitti;
  }
  /* Sorgu yok ya da sonuç yok: kutu, eşleşen sayfalar ve öne çıkanlar. */
  const T = (typeof TAXONOMY_TYPES !== 'undefined') ? TAXONOMY_TYPES : {};
  const baglar = model.altlar.length ? model.altlar
    : Object.keys(T).map(t => ({ name: T[t].plural, path: T[t].base }));
  return MolaVeri.liste({ temel: {}, durum: { secim: {}, siralama: 'onerilen', sayfa: 1 }, bugun }).then(sonuc => {
    kok.innerHTML = lspMobilBaslikMarkup('Arama', q ? 'Sonuç yok' : 'mola360', '')
      + '<main class="lst-page" id="lstPage">' + lspKirintiMarkup(model.kirinti)
      + lspAramaFormu(q)
      + '<section class="lst-state lst-state-search">'
      + '<h1>' + lspKacis(q ? '“' + q + '” için sonuç bulamadık' : 'Ne aramıştın?') + '</h1>'
      + '<p>' + (q ? 'Yazımı kontrol edebilir, daha genel bir kelime deneyebilir ya da aşağıdaki sayfalara göz atabilirsin.'
        : 'Tur, otel, etkinlik, aktivite, mekân ya da şehir adı yazabilirsin.') + '</p>'
      + '<nav class="lst-chips lst-state-links" aria-label="Öne çıkan sayfalar">'
      + baglar.map(b => '<a class="lst-chip" href="' + lspHref(b.path) + '">' + lspKacis(b.name) + '</a>').join('') + '</nav>'
      + '</section>'
      + '<section class="lst-suggest"><h2>Öne çıkanlar</h2><div class="lst-grid">'
      + lspKartlarMarkup(sonuc ? sonuc.satirlar.slice(0, 8) : [], bugun) + '</div></section>'
      + '</main>';
  });
}

/* ---------------- açılış ----------------
   Yalnızca yönlendirici sayfada (<body data-sayfa="yonlendirici">)
   çalışır; başka sayfa bu dosyayı yüklese bile bir şey yapmaz. */
function lspBaslat() {
  if (typeof document === 'undefined' || typeof location === 'undefined') return null;
  const govde = document.body;
  const kok = document.getElementById('sayfaKoku');
  if (!govde || govde.getAttribute('data-sayfa') !== 'yonlendirici' || !kok) return null;
  const bugun = new Date();
  const kokYol = (() => { try { return new URL(document.baseURI).pathname; } catch (_) { return '/'; } })();
  const goreli = lspGoreliYol(location.pathname, kokYol);

  /* Sayfa içi bağlar (#yorumlar gibi): <base> kökü gösterdiği için
     tarayıcı onları ANASAYFAYA çözer. Başka bir dinleyici (bölüm menüsü)
     işi üstlenmediyse burada sayfa içinde kaydırılıyor. Belgenin
     kabarcık aşamasında: önce öğenin kendi dinleyicileri çalışıyor. */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    const bag = e.target.closest && e.target.closest('a[href^="#"]');
    if (!bag) return;
    e.preventDefault();
    const id = bag.getAttribute('href').slice(1);
    const hedef = id ? document.getElementById(id) : null;
    if (hedef) {
      hedef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(history.state, '', location.pathname + location.search + '#' + id);
    }
  });

  /* Başlıktaki arama ve boş sayfadaki "Sitede ara" düğmesi aynı ekranı
     açar (app.js). */
  kok.addEventListener('click', (e) => {
    if (e.target.closest('[data-ara], #lstMobileSearch') && typeof openSearchOverlay === 'function') openSearchOverlay();
  });

  if (typeof MolaVeri === 'undefined') return lspBulunamadi(kok, goreli, bugun);
  const adres = MolaVeri.adres(goreli);
  if (!adres) return lspBulunamadi(kok, goreli, bugun);

  /* Kanonik yazım: sonda eğik çizgi, küçük harf, index.html'siz. Aynı
     sayfanın iki adresi olmasın. */
  const kanonik = adres.path ? adres.path + '/' : '';
  if (goreli !== kanonik) {
    history.replaceState(history.state, '', kokYol + kanonik + location.search + location.hash);
  }
  if (adres.kind === 'home') { location.replace(kokYol + location.search + location.hash); return null; }
  govde.setAttribute('data-rota', adres.kind);

  if (adres.kind === 'product') {
    /* Ürün detayı: detail-shell.js yüklüyse o kurar. */
    if (typeof dtyKur === 'function') return dtyKur(kok, adres, bugun);
    return lspBulunamadi(kok, goreli, bugun);
  }

  if (adres.kind === 'search') return lspAramaKur(kok, bugun);

  const model = MolaVeri.sayfaModeli(adres, bugun);
  if (!model) return lspBulunamadi(kok, goreli, bugun);
  if (adres.kind === 'static') { lspYakinda(kok, model); return null; }

  const seo = MolaVeri.listeSeo(model, bugun);
  lspMetaYaz(seo);
  if (model.kartlar) {
    kok.innerHTML = lspMobilBaslikMarkup(model.baslik, model.kartlar.length + ' seçenek', lspGeriYolu(model.kirinti))
      + lspDizinMarkup(model);
    lspYapisalYaz(lspYapisalVeri(model, null, [], lspSiteAdresi()));
    return null;
  }
  if (!seo.adet) {
    kok.innerHTML = lspMobilBaslikMarkup(model.baslik, 'Henüz ' + model.birim + ' yok', lspGeriYolu(model.kirinti))
      + lspBosListeMarkup(model);
    lspYapisalYaz(lspYapisalVeri(model, null, [], lspSiteAdresi()));
    return null;
  }
  const bitti = lspListeKur(kok, model, seo, bugun);
  lspBaslikYuksekligi();
  window.addEventListener('resize', lspBaslikYuksekligi);
  return bitti;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  lspBaslat();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LSP_KART_AYARI,
    lspKacis,
    lspGoreliYol,
    lspHref,
    lspKirintiMarkup,
    lspCiplerMarkup,
    lspSuzgecMarkup,
    lspEtiketMarkup,
    lspSiralamaMarkup,
    lspKartlarMarkup,
    lspYapisalVeri,
    lspGeriYolu
  };
}
