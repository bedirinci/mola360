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
const LSP_REZ = LSP_NODE ? require('./booking-engine.js') : null;
/* Rezervasyon motoru (kampanyalar sayfası): Node'da modülden. */
function lspRez(ad) {
  if (LSP_REZ && typeof LSP_REZ[ad] === 'function') return LSP_REZ[ad];
  const kapsam = (typeof globalThis !== 'undefined') ? globalThis : null;
  return kapsam && typeof kapsam[ad] === 'function' ? kapsam[ad] : null;
}

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
  asagi: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
  takvim: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16.5" rx="2.5"></rect><line x1="3" y1="9.5" x2="21" y2="9.5"></line><line x1="8" y1="2.5" x2="8" y2="6.5"></line><line x1="16" y1="2.5" x2="16" y2="6.5"></line></svg>',
  kisiler: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"></path><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"></path><path d="M18 14.3c2.2.7 3.5 2.8 3.5 5.7"></path></svg>',
  sirala: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16"></path><polyline points="3 8 7 4 11 8"></polyline><path d="M17 20V4"></path><polyline points="13 16 17 20 21 16"></polyline></svg>',
  tik: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 17.5 19 7"></polyline></svg>',
  menu: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg>',
  kilit: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>',
  whatsapp: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.28A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.13c-1.6 0-3.13-.43-4.46-1.24l-.32-.19-3.12.76.78-3.05-.2-.31A8.13 8.13 0 1 1 20.17 12a8.14 8.14 0 0 1-8.13 8.13Zm4.47-6.08c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3s-.85.83-.85 2.02.87 2.35.99 2.51c.12.16 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z"/></svg>'
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

/* Sıralama seçenekleri: çekmecedeki radyo satırları (anasayfa süzgeç
   çekmecesinin seçenekleriyle aynı görünüm). */
function lspSiralamaMarkup(siralamalar, secili) {
  return (siralamalar || []).map(s => '<button class="lst-sort-secenek" type="button" role="radio" data-sirala="' + lspKacis(s.slug) + '"'
    + ' aria-checked="' + (s.slug === secili ? 'true' : 'false') + '">' + lspKacis(s.name) + '</button>').join('');
}

/* Başlığın altındaki güven çipleri (MolaVeri.listeSeo → avantajlar):
   ürünlerin kendi kurallarından. Ürün sayısı araç çubuğunda yazıyor,
   burada tekrarlanmıyor. */
function lspAvantajMarkup(avantajlar) {
  if (!avantajlar || !avantajlar.length) return '';
  return '<ul class="lst-avantajlar" aria-label="Bu listede">'
    + avantajlar.map(a => '<li class="lst-avantaj" data-avantaj="' + lspKacis(a.kod) + '"' + (a.ipucu ? ' title="' + lspKacis(a.ipucu) + '"' : '') + '>'
      + '<span class="icon">' + LSP_IKON.tik + '</span>' + lspKacis(a.metin) + '</li>').join('')
    + '</ul>';
}

/* Satırdan kart: anasayfanın kart üreticisi (catalog.js) ve kart
   işaretlemesi (app.js/poiCardMarkup) kullanılıyor; liste sayfası ayrı
   bir kart tasarımı taşımıyor. İkisi de yüklü değilse boş. */
function lspKartlarMarkup(satirlar, bugun, plan, bant) {
  const kartUret = (typeof KATALOG_KART !== 'undefined') ? KATALOG_KART : null;
  const isaretle = (typeof poiCardMarkup === 'function') ? poiCardMarkup : null;
  if (!kartUret || !isaretle) return '';
  /* "Ne zaman, kaç kişi?" seçimi kart bağıyla ürün sayfasına geçer. */
  const bagla = (typeof katalogPlanBagi === 'function') ? katalogPlanBagi : (h) => h;
  const kartlar = (satirlar || []).map(s => {
    const uret = kartUret[s.type];
    const kart = uret ? uret(s.kayit, bugun) : null;
    if (!kart) return '';
    return isaretle(LSP_KART_AYARI[s.type] || LSP_KART_AYARI.tour, plan ? Object.assign({}, kart, { href: bagla(kart.href, plan) }) : kart);
  }).filter(Boolean);
  /* Bant (üyelik çağrısı) dördüncü karttan sonra; daha az kart varsa
     sonda. Listenin başını kapatmıyor: önce ürünler. */
  if (bant && kartlar.length) kartlar.splice(Math.min(LSP_BANT_SIRASI, kartlar.length), 0, bant);
  return kartlar.join('');
}

/* Misafire liste arasında üyelik çağrısı: üyeye özel ilk rezervasyon
   kampanyası (booking-engine.js, REZ_KAMPANYALAR; uyeOzel +
   ilkRezervasyon). Kampanya yürürlükte değilse bant yok. */
const LSP_BANT_SIRASI = 4;
function lspUyelikBandiMarkup(kampanya) {
  if (!kampanya) return '';
  return '<aside class="lst-uyelik" data-uyelik-bandi aria-label="Üyelere özel">'
    + '<span class="lst-uyelik-ikon" aria-hidden="true">%</span>'
    + '<div class="lst-uyelik-metin"><strong>Üyelere özel: ' + lspKacis(kampanya.ad) + '</strong>'
    + '<span>' + lspKacis(kampanya.aciklama || '') + '</span></div>'
    + '<button class="btn-primary lst-uyelik-btn" type="button" data-uyelik-ol>Ücretsiz üye ol</button>'
    + '</aside>';
}

/* Yalnızca otellerden oluşan liste: tarih giriş–çıkış günü. */
function lspKonaklamaMi(model) {
  return !!(model && model.temel && model.temel.type === 'hotel');
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

/* Mobil sayfa çubuğu: [geri] [logo → başlık] [ara] [menü].
   Sayfa açılınca ortada logo duruyor, sayfanın büyük başlığı (h1)
   çubuğun altına kayınca logonun yerini başlık alıyor (app.js,
   .is-baslikli); aynı başlık iki kez görünmüyor. Aşağı kaydırınca çubuk
   gizleniyor, yukarı kaydırınca geri geliyor (data-cubuk-gizlenir).
   Geri oku site içinden gelindiyse tarayıcı geçmişine dönüyor; dışarıdan
   gelindiyse bağın adresine, bir üst sayfaya gidiyor (data-akilli-geri).

   odak: true → ödeme ekranı: arama ve menü yok, yerlerinde "güvenli
   ödeme" notu ve WhatsApp desteği; çubuk gizlenmiyor. */
function lspMobilBaslikMarkup(baslik, altBaslik, geriYol, secenek) {
  const odak = !!(secenek && secenek.odak);
  /* "mola360" alt satırı logo varken tekrar; boş geçiliyor. */
  const alt = altBaslik && altBaslik !== 'mola360' ? altBaslik : '';
  const sag = odak
    ? '<a class="cubuk-dugme cubuk-wa" href="' + lspKacis(typeof CONTACT !== 'undefined' ? CONTACT.whatsappHref : '#') + '" data-destek-whatsapp target="_blank" rel="noopener" aria-label="WhatsApp canlı destek"><span class="icon">' + LSP_IKON.whatsapp + '</span></a>'
    : '<button class="lst-mobile-search cubuk-dugme" type="button" id="lstMobileSearch" aria-label="Ara"><span class="icon">' + LSP_IKON.ara + '</span></button>'
      + '<button class="cubuk-dugme cubuk-menu" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span class="icon" data-menu-ikon>' + LSP_IKON.menu + '</span></button>';
  return '<div class="lst-mobile-header" data-sayfa-cubugu' + (odak ? ' data-cubuk-odak' : ' data-cubuk-gizlenir') + '>'
    + '<a class="lst-mobile-back" href="' + lspHref(geriYol) + '" data-akilli-geri aria-label="Geri"><span class="icon">' + LSP_IKON.geri + '</span></a>'
    + '<div class="lst-mobile-heading">'
    + '<a class="cubuk-logo" href="./" aria-label="mola360 anasayfa"><img src="assets/img/logo.png" alt="mola360" width="82" height="34"></a>'
    + '<span class="cubuk-baslik"><span class="lst-mobile-title">' + lspKacis(baslik) + '</span>'
    + '<span class="lst-mobile-subtitle" id="lstMobileSub"' + (alt ? '' : ' hidden') + '>' + lspKacis(alt) + '</span></span>'
    + '</div>'
    + (odak ? '<span class="cubuk-guvenli"><span class="icon">' + LSP_IKON.kilit + '</span>Güvenli ödeme</span>' : '')
    + sag
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

/* ---------------- ne zaman, kaç kişi? ----------------
   Liste ve arama sayfasının üstündeki özet kutusu: seçili tarih ve kişi
   sayısı tek bakışta; dokununca düzenleme paneli açılıyor (mobilde alttan,
   masaüstünde kutunun altında). Seçim adreste (?tarih=&bitis=&kisi=,
   catalog.js katalogPlan*): tarih listeyi o aralıkta satışı olanlarla
   sınırlıyor (MolaVeri.liste, tarihAraligi), ikisi birlikte kart
   bağlarıyla ürün sayfasına geçiyor ve rezervasyon kutusu onunla açılıyor.
   Otel listesinde tarih giriş–çıkış günü. */
const LSP_AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const LSP_VARSAYILAN_KISI = 2;

function lspISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function lspGunEkle(iso, gun) {
  const [y, a, g] = iso.split('-').map(Number);
  return lspISO(new Date(y, a - 1, g + gun));
}
function lspTarihKisa(iso) {
  const [, a, g] = iso.split('-').map(Number);
  return g + ' ' + LSP_AY_KISA[a - 1];
}
function lspGeceSayisi(a, b) {
  const gun = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((gun(b) - gun(a)) / 86400000);
}

/* Kutunun iki satırı: { tarih, kisi }. */
function lspPlanEtiketi(plan, konaklama) {
  const p = plan || {};
  let tarih;
  if (!p.tarih) tarih = konaklama ? 'Giriş – çıkış seç' : 'Tüm tarihler';
  else if (!p.bitis) tarih = lspTarihKisa(p.tarih);
  else if (p.tarih.slice(0, 7) === p.bitis.slice(0, 7)) {
    tarih = Number(p.tarih.slice(8)) + '–' + Number(p.bitis.slice(8)) + ' ' + LSP_AY_KISA[Number(p.bitis.slice(5, 7)) - 1];
  } else tarih = lspTarihKisa(p.tarih) + ' – ' + lspTarihKisa(p.bitis);
  if (konaklama && p.tarih && p.bitis) tarih += ' · ' + lspGeceSayisi(p.tarih, p.bitis) + ' gece';
  return { tarih, kisi: (p.kisi || LSP_VARSAYILAN_KISI) + ' kişi' };
}

/* Hızlı seçimler (bugüne göre). Otelde giriş–çıkış: hafta sonu cuma
   girişi, pazar çıkışı; cumartesi günü açılırsa o geceden. */
function lspPlanOnAyarlari(bugun, konaklama) {
  const b = lspISO(bugun);
  const g = bugun.getDay();
  if (konaklama) {
    const cuma = g === 6 ? b : lspGunEkle(b, (5 - g + 7) % 7);
    const pazar = lspGunEkle(b, (7 - g) % 7 || 7);
    const buHafta = { slug: 'haftasonu', name: 'Bu hafta sonu', tarih: g === 0 ? lspGunEkle(b, 5) : cuma, bitis: g === 0 ? lspGunEkle(b, 7) : pazar };
    /* Gelecek hafta sonu her zaman cuma–pazar (2 gece). */
    const gelecekCuma = g === 6 ? lspGunEkle(b, 6) : lspGunEkle(buHafta.tarih, 7);
    return [buHafta, { slug: 'gelecek-haftasonu', name: 'Gelecek hafta sonu', tarih: gelecekCuma, bitis: lspGunEkle(gelecekCuma, 2) }];
  }
  const cumartesi = g === 0 ? b : lspGunEkle(b, 6 - g);
  const pazar = g === 0 ? b : lspGunEkle(b, 7 - g);
  return [
    { slug: 'haftasonu', name: 'Bu hafta sonu', tarih: cumartesi, bitis: pazar === cumartesi ? null : pazar },
    { slug: '7-gun', name: 'Önümüzdeki 7 gün', tarih: b, bitis: lspGunEkle(b, 6) },
    { slug: '30-gun', name: 'Önümüzdeki 30 gün', tarih: b, bitis: lspGunEkle(b, 29) }
  ];
}

function lspPlanKutusuMarkup(plan, konaklama) {
  const e = lspPlanEtiketi(plan, konaklama);
  return '<div class="lst-plan" id="lstPlan">'
    + '<button class="lst-plan-kutu" type="button" id="lstPlanBtn" aria-haspopup="dialog" aria-expanded="false" aria-controls="lstPlanPanel">'
    + '<span class="lst-plan-alan"><span class="icon">' + LSP_IKON.takvim + '</span><span class="lst-plan-metin"><small>' + (konaklama ? 'Giriş – çıkış' : 'Ne zaman?') + '</small>'
    + '<strong id="lstPlanTarihMetni">' + lspKacis(e.tarih) + '</strong></span></span>'
    + '<span class="lst-plan-alan"><span class="icon">' + LSP_IKON.kisiler + '</span><span class="lst-plan-metin"><small>Kaç kişi?</small>'
    + '<strong id="lstPlanKisiMetni">' + lspKacis(e.kisi) + '</strong></span></span>'
    + '<span class="lst-plan-ara" aria-hidden="true">' + LSP_IKON.ara + '</span>'
    + '<span class="lst-visually-hidden">Tarihi ve kişi sayısını değiştir</span>'
    + '</button>'
    + lspPlanPaneliMarkup(konaklama)
    + '</div>';
}

function lspPlanPaneliMarkup(konaklama) {
  return '<div class="lst-plan-katman" id="lstPlanKatman" hidden></div>'
    + '<div class="lst-plan-panel" id="lstPlanPanel" role="dialog" aria-modal="true" aria-labelledby="lstPlanBaslik" tabindex="-1" hidden>'
    + '<div class="lst-plan-bas"><h2 id="lstPlanBaslik">Ne zaman, kaç kişi?</h2>'
    + '<button class="lst-plan-kapat" type="button" data-plan-kapat aria-label="Kapat"><span class="icon">' + LSP_IKON.kapat + '</span></button></div>'
    + '<fieldset class="lst-plan-grup"><legend>' + (konaklama ? 'Giriş – çıkış' : 'Tarih') + '</legend>'
    + '<div class="lst-plan-hizli" id="lstPlanHizli"></div>'
    + '<div class="lst-plan-aralik">'
    + '<label><span>' + (konaklama ? 'Giriş' : 'Başlangıç') + '</span><input type="date" id="lstPlanTarih"></label>'
    + '<label><span>' + (konaklama ? 'Çıkış' : 'Bitiş (isteğe bağlı)') + '</span><input type="date" id="lstPlanBitis"></label>'
    + '</div></fieldset>'
    + '<fieldset class="lst-plan-grup"><legend>Kişi sayısı</legend>'
    + '<div class="lst-plan-sayac">'
    + '<button type="button" data-plan-kisi="-1" aria-label="Bir kişi azalt">−</button>'
    + '<output id="lstPlanKisi" aria-live="polite">' + LSP_VARSAYILAN_KISI + '</output>'
    + '<button type="button" data-plan-kisi="1" aria-label="Bir kişi artır">+</button></div>'
    + '<p class="lst-plan-not">Seçimin ürün sayfasındaki rezervasyon kutusuna taşınır; çocuk ve oda sayısını orada seçersin.</p>'
    + '</fieldset>'
    + '<div class="lst-plan-alt"><button class="lst-clear-btn" type="button" data-plan-temizle>Temizle</button>'
    + '<button class="btn-primary" type="button" data-plan-uygula>Uygula</button></div>'
    + '</div>';
}

/* Arama sayfasının kutusu: GET formu, JS olmadan da çalışır. */
function lspAramaFormu(q) {
  return '<form class="lst-search" action="arama/" method="get" role="search">'
    + '<span class="icon" aria-hidden="true">' + LSP_IKON.ara + '</span>'
    + '<input type="search" name="q" value="' + lspKacis(q || '') + '" placeholder="Tur, otel, etkinlik, şehir ara…" aria-label="Arama" autocomplete="off" enterkeyhint="search">'
    + '<button class="btn-primary" type="submit">Ara</button></form>';
}

function lspListeIskeleti(model, seo, plan) {
  return '<main class="lst-page" id="lstPage">'
    + lspKirintiMarkup(model.kirinti)
    + (model.kind === 'search' ? lspAramaFormu(model.q) : '')
    + '<header class="lst-head"><h1>' + lspKacis(model.baslik) + '</h1>'
    + lspAvantajMarkup(seo.avantajlar) + '</header>'
    + lspPlanKutusuMarkup(plan, lspKonaklamaMi(model))
    + lspCiplerMarkup(model.altlar)
    + '<div class="lst-layout">'
    + '<div class="lst-sheet-overlay" id="lstSheetOverlay" hidden></div>'
    + '<aside class="lst-filters" id="lstFilters" aria-label="Filtreler" tabindex="-1">'
    + '<div class="lst-filters-head"><strong>Filtreler</strong>'
    + '<button class="lst-link" type="button" data-temizle id="lstClearTop">Temizle</button>'
    + '<button class="lst-sheet-close" type="button" id="lstSheetClose" aria-label="Kapat">' + LSP_IKON.kapat + '</button></div>'
    + '<div class="lst-filters-body" id="lstFilterBody"></div>'
    + '<div class="lst-filters-foot"><button class="lst-clear-btn" type="button" data-temizle data-temizle-sabit disabled>Temizle</button>'
    + '<button class="btn-primary lst-apply" type="button" id="lstApply">Sonuçları gör</button></div>'
    + '</aside>'
    + '<section class="lst-results" aria-label="Sonuçlar">'
    + '<div class="lst-toolbar">'
    + '<span class="lst-count" id="lstCount" aria-live="polite"></span>'
    + '<div class="lst-toolbar-actions">'
    + '<button class="lst-tool-btn lst-filter-btn" type="button" id="lstFilterBtn" aria-controls="lstFilters" aria-expanded="false">'
    + '<span class="icon">' + LSP_IKON.suzgec + '</span>Filtrele<span class="lst-badge" id="lstBadge" hidden></span></button>'
    + '<div class="lst-sort">'
    + '<button class="lst-tool-btn lst-sort-btn" type="button" id="lstSortBtn" aria-haspopup="dialog" aria-expanded="false" aria-controls="lstSortPanel">'
    + '<span class="icon">' + LSP_IKON.sirala + '</span><span class="lst-visually-hidden">Sıralama: </span><span id="lstSortLabel"></span></button>'
    + '<div class="lst-sort-katman" id="lstSortKatman" hidden></div>'
    + '<div class="lst-sort-panel" id="lstSortPanel" role="dialog" aria-modal="true" aria-labelledby="lstSortBaslik" tabindex="-1" hidden>'
    + '<div class="lst-sort-bas"><h2 id="lstSortBaslik">Sırala</h2>'
    + '<button class="lst-sheet-close lst-sort-kapat" type="button" data-sirala-kapat aria-label="Kapat">' + LSP_IKON.kapat + '</button></div>'
    + '<div class="lst-sort-liste" id="lstSortListe" role="radiogroup" aria-labelledby="lstSortBaslik"></div>'
    + '</div></div>'
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
  const varsayilan = arama ? 'alaka' : (model.varsayilanSiralama || 'onerilen');
  const alanlar = MolaVeri.yuzeyTanimlari(bugun);
  const oku = lspMotor('suzOku');
  const yaz = lspMotor('suzYaz');
  const degistir = lspMotor('suzDegistir');
  const sahip = lspMotor('suzSahipOlunanlar');
  const siralamalar = ((typeof SUZ_SIRALAMALAR !== 'undefined') ? SUZ_SIRALAMALAR : [])
    .filter(x => arama || !x.arama);
  let durum = oku(location.search, alanlar, varsayilan);
  /* "Ne zaman, kaç kişi?" seçimi (catalog.js); motorun süzgeçlerinden
     ayrı, kendi adres parametreleriyle. */
  let plan = (typeof katalogPlanOku === 'function') ? katalogPlanOku(location.search) : {};
  const kapaliGruplar = new Set();
  const tumuAcik = new Set();
  let sayac = 0;
  let sonSonuc = null;

  kok.innerHTML = lspMobilBaslikMarkup(model.baslik, lspSayimMetni(seo.adet, model.birim), lspGeriYolu(model.kirinti))
    + lspListeIskeleti(model, seo, plan);
  const $ = (id) => document.getElementById(id);
  /* Sıralama düğmesinin yazısı ve çekmecedeki seçili satır. */
  const siralamaYaz = () => {
    const secili = siralamalar.find(x => x.slug === durum.siralama) || siralamalar[0];
    $('lstSortLabel').textContent = secili ? secili.name : 'Sırala';
    $('lstSortListe').innerHTML = lspSiralamaMarkup(siralamalar, secili ? secili.slug : '');
  };
  siralamaYaz();

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
    /* Çekmecenin altındaki Temizle hep yerinde: seçim yoksa pasif (gri),
       varsa etkin. Diğer Temizle bağları seçim yokken gizli. */
    document.querySelectorAll('[data-temizle]').forEach(b => {
      if (b.hasAttribute('data-temizle-sabit')) b.disabled = !secimSayisi;
      else b.hidden = !secimSayisi;
    });

    $('lstGrid').innerHTML = lspKartlarMarkup(sonuc.satirlar, bugun, plan, uyelikBandi());
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

  /* Üyelik bandı yalnızca misafire; giriş yapılınca kalkıyor. */
  const uyelikBandi = () => {
    if (typeof MolaVeri === 'undefined' || !MolaVeri.kampanyalar || (MolaVeri.oturum && MolaVeri.oturum())) return '';
    return lspUyelikBandiMarkup(MolaVeri.kampanyalar(bugun).find(k => k.uyeOzel && k.ilkRezervasyon) || null);
  };
  window.addEventListener('mola360:oturum', () => {
    document.querySelectorAll('[data-uyelik-bandi]').forEach(b => { if (!uyelikBandi()) b.remove(); });
  });

  const sorgula = () => {
    const istek = ++sayac;
    const tarihAraligi = plan.tarih ? { start: plan.tarih, end: plan.bitis || plan.tarih } : null;
    return MolaVeri.liste({ temel: model.temel, alanlar, durum, bugun, tarihAraligi }).then(sonuc => {
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
    if (e.target.closest('[data-uyelik-ol]') && typeof openAuthModal === 'function') { openAuthModal('register'); return; }
    if (e.target.closest('#lstSheetClose') || e.target.closest('#lstApply') || e.target.id === 'lstSheetOverlay') {
      lspSuzgecAc(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('lst-sheet-open')) lspSuzgecAc(false);
  });

  /* ---- ne zaman, kaç kişi? ---- */
  const konaklama = lspKonaklamaMi(model);
  const kisiSiniri = (typeof KATALOG_KISI_SINIRI !== 'undefined') ? KATALOG_KISI_SINIRI : 20;
  const bugunISO = lspISO(bugun);
  const onAyarlar = lspPlanOnAyarlari(bugun, konaklama);
  const planKutu = $('lstPlan');
  const planPanel = $('lstPlanPanel');
  const planKatman = $('lstPlanKatman');
  const planBtn = $('lstPlanBtn');
  const tarihKutusu = $('lstPlanTarih');
  const bitisKutusu = $('lstPlanBitis');
  let taslakKisi = LSP_VARSAYILAN_KISI;
  tarihKutusu.min = bugunISO;
  bitisKutusu.min = bugunISO;
  $('lstPlanHizli').innerHTML = [{ slug: '', name: konaklama ? 'Tarih yok' : 'Tüm tarihler' }].concat(onAyarlar)
    .map(o => '<button class="lst-plan-cip" type="button" data-plan-hizli="' + o.slug + '" aria-pressed="false">' + lspKacis(o.name) + '</button>').join('');

  const planAdresiYaz = () => {
    const digerleri = location.search.replace(/^\?/, '').split('&')
      .filter(p => p && ['tarih', 'bitis', 'kisi'].indexOf(decodeURIComponent(p.split('=')[0])) === -1);
    const ek = (typeof katalogPlanSorgusu === 'function') ? katalogPlanSorgusu(plan) : '';
    const qs = digerleri.concat(ek ? [ek] : []).join('&');
    history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  };
  const basiliYaz = () => {
    const t = tarihKutusu.value || null;
    const b = bitisKutusu.value || null;
    planPanel.querySelectorAll('[data-plan-hizli]').forEach(dugme => {
      const o = onAyarlar.find(x => x.slug === dugme.getAttribute('data-plan-hizli'));
      const uyuyor = o ? (o.tarih === t && (o.bitis || null) === b) : (!t && !b);
      dugme.setAttribute('aria-pressed', String(uyuyor));
    });
    bitisKutusu.min = t ? lspGunEkle(t, konaklama ? 1 : 0) : bugunISO;
    temizleYaz();
  };
  /* Temizle: uygulanmış bir seçim ya da paneldeki taslakta bir değer
     varsa etkin, yoksa pasif. */
  const temizleYaz = () => {
    const dolu = !!(plan.tarih || plan.kisi || tarihKutusu.value || bitisKutusu.value || taslakKisi !== LSP_VARSAYILAN_KISI);
    planPanel.querySelector('[data-plan-temizle]').disabled = !dolu;
  };
  const kisiYaz = () => {
    $('lstPlanKisi').textContent = String(taslakKisi);
    planPanel.querySelector('[data-plan-kisi="-1"]').disabled = taslakKisi <= 1;
    planPanel.querySelector('[data-plan-kisi="1"]').disabled = taslakKisi >= kisiSiniri;
    temizleYaz();
  };
  const panelAc = (ac) => {
    if (ac) {
      tarihKutusu.value = plan.tarih || '';
      bitisKutusu.value = plan.bitis || '';
      taslakKisi = plan.kisi || LSP_VARSAYILAN_KISI;
      basiliYaz();
      kisiYaz();
    }
    planPanel.hidden = !ac;
    planKatman.hidden = !ac;
    planBtn.setAttribute('aria-expanded', String(ac));
    document.body.classList.toggle('lst-plan-open', ac);
    if (ac) planPanel.focus();
    else planBtn.focus();
  };
  const planUygula = (yeni) => {
    plan = yeni;
    const etiket = lspPlanEtiketi(plan, konaklama);
    $('lstPlanTarihMetni').textContent = etiket.tarih;
    $('lstPlanKisiMetni').textContent = etiket.kisi;
    planKutu.classList.toggle('is-secili', !!(plan.tarih || plan.kisi));
    planAdresiYaz();
    panelAc(false);
    uygula({ secim: durum.secim, siralama: durum.siralama, sayfa: 1 });
  };
  planKutu.classList.toggle('is-secili', !!(plan.tarih || plan.kisi));

  planKutu.addEventListener('click', (e) => {
    if (e.target.closest('#lstPlanBtn')) { panelAc(planPanel.hidden); return; }
    if (e.target.closest('[data-plan-kapat]') || e.target === planKatman) { panelAc(false); return; }
    const hizli = e.target.closest('[data-plan-hizli]');
    if (hizli) {
      const o = onAyarlar.find(x => x.slug === hizli.getAttribute('data-plan-hizli'));
      tarihKutusu.value = o ? o.tarih : '';
      bitisKutusu.value = o && o.bitis ? o.bitis : '';
      basiliYaz();
      return;
    }
    const kisi = e.target.closest('[data-plan-kisi]');
    if (kisi) {
      taslakKisi = Math.min(kisiSiniri, Math.max(1, taslakKisi + Number(kisi.getAttribute('data-plan-kisi'))));
      kisiYaz();
      return;
    }
    if (e.target.closest('[data-plan-temizle]')) { planUygula({ tarih: null, bitis: null, kisi: null }); return; }
    if (e.target.closest('[data-plan-uygula]')) {
      let t = tarihKutusu.value || null;
      let b = bitisKutusu.value || null;
      if (!t && b) { t = b; b = null; }
      if (t && t < bugunISO) t = bugunISO;
      if (t && b && b < t) { const x = t; t = b; b = x; }
      if (t && b && b === t) b = null;
      /* Otelde çıkış günü yoksa bir gece. */
      if (konaklama && t && !b) b = lspGunEkle(t, 1);
      planUygula({ tarih: t, bitis: b, kisi: taslakKisi !== LSP_VARSAYILAN_KISI ? taslakKisi : null });
    }
  });
  tarihKutusu.addEventListener('change', () => {
    if (bitisKutusu.value && bitisKutusu.value < tarihKutusu.value) bitisKutusu.value = '';
    basiliYaz();
  });
  bitisKutusu.addEventListener('change', basiliYaz);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !planPanel.hidden) panelAc(false);
  });

  /* ---- sıralama ----
     "Filtrele" ile aynı düğme. Mobilde ve tablette süzgeç çekmecesiyle
     aynı dilde alt çekmece, masaüstünde düğmenin altında küçük panel.
     Seçince hemen uygulanıyor. Dar ekranda araç çubuğu yapışkan (kendi
     katmanı) olduğu için çekmece açılırken <body>'ye taşınıyor; yoksa alt
     menünün ve üst çubuğun altında kalırdı. */
  const siralaKutu = document.querySelector('.lst-sort');
  const siralaPanel = $('lstSortPanel');
  const siralaKatman = $('lstSortKatman');
  const siralaBtn = $('lstSortBtn');
  const siralaAc = (ac) => {
    if (ac) {
      const hedef = window.matchMedia('(max-width: 1024px)').matches ? document.body : siralaKutu;
      if (siralaPanel.parentElement !== hedef) { hedef.appendChild(siralaKatman); hedef.appendChild(siralaPanel); }
    }
    siralaPanel.hidden = !ac;
    siralaKatman.hidden = !ac;
    siralaBtn.setAttribute('aria-expanded', String(ac));
    document.body.classList.toggle('lst-sort-open', ac);
    if (ac) (siralaPanel.querySelector('[aria-checked="true"]') || siralaPanel).focus();
    else siralaBtn.focus();
  };
  siralaBtn.addEventListener('click', () => siralaAc(siralaPanel.hidden));
  siralaKatman.addEventListener('click', () => siralaAc(false));
  siralaPanel.addEventListener('click', (e) => {
    if (e.target.closest('[data-sirala-kapat]')) { siralaAc(false); return; }
    const secenek = e.target.closest('[data-sirala]');
    if (!secenek) return;
    const slug = secenek.getAttribute('data-sirala');
    siralaAc(false);
    if (slug === durum.siralama) return;
    uygula({ secim: durum.secim, siralama: slug, sayfa: 1 });
    siralamaYaz();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !siralaPanel.hidden) siralaAc(false);
  });

  /* Üründen geri dönünce liste kaldığı yerden: kartlar sorgudan sonra
     çizildiği için tarayıcının kendi kaydırma geri yüklemesi sayfa henüz
     kısayken çalışıp yeri kaybediyor. Konum geçmiş kaydında
     (history.state) saklanıyor; depoya bir şey yazılmıyor. */
  const kaydirmaYaz = () => {
    try { history.replaceState(Object.assign({}, history.state, { mola360Kaydirma: window.scrollY }), ''); } catch (_) { /* yok say */ }
  };
  sayfa.addEventListener('click', (e) => { if (e.target.closest('a[href]')) kaydirmaYaz(); }, true);
  window.addEventListener('pagehide', kaydirmaYaz);
  let hedefY = 0;
  try {
    const gezinme = performance.getEntriesByType('navigation')[0];
    if (gezinme && gezinme.type === 'back_forward' && history.state) hedefY = Number(history.state.mola360Kaydirma) || 0;
  } catch (_) { hedefY = 0; }
  if (hedefY && 'scrollRestoration' in history) history.scrollRestoration = 'manual';

  return sorgula().then(() => { if (hedefY) window.scrollTo(0, hedefY); });
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

/* ---------------- kampanyalar ----------------
   /kampanyalar/ — yürürlükteki kampanyalar, kurallarıyla birlikte
   (booking-engine.js, REZ_KAMPANYALAR). Sayfadaki koşul metni ile ödeme
   adımında uygulanan kural aynı kayıttan: ikisi ayrışamaz. */
function lspKampanyaKosullari(k, bugun) {
  const para = lspRez('rezPara') || (n => n + ' TL');
  const tarih = lspRez('rezTarihMetni') || (x => x);
  const liste = [];
  if (k.uyeOzel) liste.push('Üyelere özel; kod e-postayla gelir');
  else if (k.tur === 'kupon') liste.push('Kupon kodu: ' + (k.kuponKodu || '—') + ' (ödeme adımındaki alana yazılır)');
  else liste.push('Ödeme adımında kendiliğinden uygulanır');
  const kosul = k.kosul || {};
  if (kosul.enAzGunOnce) liste.push('Kalkışa en az ' + kosul.enAzGunOnce + ' gün kala');
  if (kosul.enAzTutar) liste.push('En az ' + para(kosul.enAzTutar) + ' tutarında');
  if (kosul.cumaCumartesi) liste.push('Cuma ve cumartesi gecesini kapsayan konaklamada');
  const ind = k.indirim || {};
  if (ind.enFazla) liste.push('En fazla ' + para(ind.enFazla));
  liste.push(k.bitis ? 'Son gün: ' + tarih(k.bitis) : 'Süre sınırı yok');
  return liste;
}

function lspKampanyalarMarkup(kampanyalar, bugun) {
  return '<main class="lst-page" id="lstPage">'
    + lspKirintiMarkup([{ name: 'Anasayfa', path: '' }, { name: 'Kampanyalar', path: 'kampanyalar' }])
    + '<header class="lst-head"><h1>Kampanyalar</h1>'
    + '<p class="lst-summary">Yürürlükteki indirimler ve koşulları. Otomatik indirimler ödeme adımında kendiliğinden düşer; en avantajlı olanı uygulanır, kupon ayrıca eklenir.</p></header>'
    + (kampanyalar.length
      ? '<div class="kmp-grid">' + kampanyalar.map(k => '<article class="kmp-card">'
        + '<span class="kmp-badge">' + lspKacis(k.etiket || 'Kampanya') + (k.kalanGun ? ' · Son ' + k.kalanGun + ' gün' : '') + '</span>'
        + '<h2>' + lspKacis(k.ad) + '</h2>'
        + '<p>' + lspKacis(k.aciklama || '') + '</p>'
        + '<ul class="kmp-rules">' + lspKampanyaKosullari(k, bugun).map(x => '<li>' + lspKacis(x) + '</li>').join('') + '</ul>'
        + (k.sayfa ? '<a class="kmp-link" href="' + lspHref(k.sayfa) + '">Kapsamdaki ürünler</a>' : '')
        + '</article>').join('') + '</div>'
      : '<p class="lst-summary">Şu an yürürlükte kampanya yok.</p>')
    + '</main>';
}

function lspKampanyalarKur(kok, bugun) {
  const liste = (typeof MolaVeri !== 'undefined' && MolaVeri.kampanyalar) ? MolaVeri.kampanyalar(bugun) : [];
  lspMetaYaz({ title: 'Kampanyalar — mola360', description: 'Tur, otel ve etkinliklerde yürürlükteki indirimler ve koşulları.',
    noindex: false, canonical: lspSiteAdresi() + 'kampanyalar/' });
  kok.innerHTML = lspMobilBaslikMarkup('Kampanyalar', liste.length + ' kampanya', '') + lspKampanyalarMarkup(liste, bugun);
  return null;
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

/* ---------------- bu hafta: ajanda ----------------
   Önümüzdeki 7 günün sabit saatli planları, gün gün (veri kapısı:
   haftaAjandasi). Gün başlıklarının kimliği gün adı (#cuma): anasayfanın
   "Bu Cuma" bağı doğrudan o güne iner. */
function lspHaftaKartlari(ogeler, bugun) {
  const kartUret = (typeof KATALOG_KART !== 'undefined') ? KATALOG_KART : null;
  const isaretle = (typeof compactCardMarkup === 'function') ? compactCardMarkup : null;
  if (!kartUret || !isaretle) return '';
  return ogeler.map(o => {
    const tip = MolaVeri.icerikTipi(o.kayit);
    const kart = kartUret[tip] ? kartUret[tip](o.kayit, bugun) : null;
    /* Kartın tarih rozeti o günün saati: ajandada gün zaten başlıkta. */
    return kart ? isaretle({}, Object.assign({}, kart, { meta2: o.saat || kart.meta2 })) : '';
  }).join('');
}

function lspHaftaKur(kok, adres, bugun) {
  const model = MolaVeri.sayfaModeli(adres, bugun);
  const gunler = MolaVeri.haftaAjandasi(bugun, 7);
  const toplam = gunler.reduce((t, g) => t + g.ogeler.length, 0);
  lspMetaYaz({ title: model.baslik + ' — mola360',
    description: 'Önümüzdeki 7 günün turları ve etkinlikleri, gün gün: ' + toplam + ' plan.',
    canonical: lspSiteAdresi() + adres.path + '/', noindex: toplam === 0 });
  const dolu = gunler.filter(g => g.ogeler.length);
  kok.innerHTML = lspMobilBaslikMarkup(model.baslik, toplam + ' plan · 7 gün', '')
    + '<main class="lst-page lst-week" id="lstPage">'
    + lspKirintiMarkup(model.kirinti)
    + '<header class="lst-head"><h1>' + lspKacis(model.baslik) + '</h1>'
    + '<p class="lst-summary">Bugünden itibaren 7 gün · ' + toplam + ' tur ve etkinlik</p></header>'
    + '<nav class="lst-chips" aria-label="Günler">'
    + gunler.map(g => '<a class="lst-chip' + (g.ogeler.length ? '' : ' is-empty') + '" href="#' + g.slug + '">'
      + lspKacis(g.etiket) + '<span class="lst-chip-count">' + g.ogeler.length + '</span></a>').join('')
    + '</nav>'
    + (dolu.length ? '' : '<div class="lst-empty"><strong>Bu hafta için planlanmış tur veya etkinlik yok.</strong></div>')
    + gunler.map(g => '<section class="lst-day" id="' + g.slug + '" aria-labelledby="gun-' + g.slug + '">'
      + '<h2 id="gun-' + g.slug + '"><span>' + lspKacis(g.etiket) + '</span>'
      + '<small>' + lspKacis(g.tarihMetni) + '</small></h2>'
      + (g.ogeler.length
        ? '<div class="lst-grid lst-grid-compact">' + lspHaftaKartlari(g.ogeler, bugun) + '</div>'
        : '<p class="lst-day-empty">Bu gün için plan yok.</p>')
      + '</section>').join('')
    + '<p class="lst-week-note">Oteller, aktiviteler ve mekânlar her gün satışta; onlar için '
    + '<a href="aktiviteler/">aktivitelere</a>, <a href="oteller/">otellere</a> ve <a href="mekanlar/">mekânlara</a> göz at.</p>'
    + '</main>';
  lspBaslikYuksekligi();
  /* Adresteki güne in (#cuma). */
  if (location.hash) {
    const hedef = document.getElementById(location.hash.slice(1));
    if (hedef) setTimeout(() => hedef.scrollIntoView({ block: 'start' }), 0);
  }
  return null;
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
    /* /favorilerim/ gibi kısa adres: panelin bölümü adres satırına. */
    const arama = adres.kind === 'account' && adres.bolum ? '?bolum=' + adres.bolum : location.search;
    history.replaceState(history.state, '', kokYol + kanonik + arama + location.hash);
  }
  if (adres.kind === 'home') { location.replace(kokYol + location.search + location.hash); return null; }
  govde.setAttribute('data-rota', adres.kind);

  if (adres.kind === 'product') {
    /* Ürün detayı: detail-shell.js yüklüyse o kurar. */
    if (typeof dtyKur === 'function') return dtyKur(kok, adres, bugun);
    return lspBulunamadi(kok, goreli, bugun);
  }

  if (adres.kind === 'search') return lspAramaKur(kok, bugun);
  /* Ödeme ve onay: checkout-page.js. Yüklenmemişse bulunamadı. */
  if (adres.kind === 'checkout') return typeof odmKur === 'function' ? odmKur(kok, bugun) : lspBulunamadi(kok, goreli, bugun);
  if (adres.kind === 'confirmation') return typeof odmOnayKur === 'function' ? odmOnayKur(kok) : lspBulunamadi(kok, goreli, bugun);
  if (adres.kind === 'campaigns') return lspKampanyalarKur(kok, bugun);
  if (adres.kind === 'account') return typeof hsaKur === 'function' ? hsaKur(kok, adres, bugun) : lspBulunamadi(kok, goreli, bugun);
  if (adres.kind === 'corporate') return typeof krsKur === 'function' ? krsKur(kok, adres) : lspBulunamadi(kok, goreli, bugun);
  if (adres.kind === 'week') return lspHaftaKur(kok, adres, bugun);

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
    lspAvantajMarkup,
    lspKartlarMarkup,
    lspMobilBaslikMarkup,
    lspPlanEtiketi,
    lspPlanOnAyarlari,
    lspPlanKutusuMarkup,
    lspUyelikBandiMarkup,
    lspKonaklamaMi,
    LSP_BANT_SIRASI,
    lspYapisalVeri,
    lspGeriYolu,
    lspKampanyaKosullari,
    lspKampanyalarMarkup
  };
}
