/* ---------------- ürün detayı: yönlendiriciden açılan ürün sayfası ----------------
   /tur/<slug>/ gibi bir ürün adresinin DOSYASI yoksa GitHub Pages
   404.html'i sunuyor ve yönlendirici (listing-page.js) buraya soruyor
   (dtyKur). İki durum var:

   1) Sayfası olan tam kayıt (TOURS, HOTELS … içinde, dosyası yok):
      tipin detay şablonu kuruluyor. İskelet bu dosyada TEK yerde
      üretiliyor (dtyIskelet); stil ve betik (tour-page.js …) sonradan
      yükleniyor. Yeni ürün eklemek için HTML dosyası yazılmıyor.
      tests/detay-sablonu.test.js bugünkü statik sayfaların iskeletle
      aynı bölümleri taşıdığını ölçüyor: iki kopya ayrışamıyor.

   2) Örnek özet kayıt (sample: true): detay şablonunun istediği içerik
      (program, galeri, yorumlar …) yok. Boş kutularla dolu bir sayfa
      yerine kaydın gerçekten taşıdığı bilgiyle bir ÖZET sayfası:
      görsel, fiyat, seçenekler (oda/paket/bilet), yaklaşan tarihler,
      sınıflandırma çipleri ve benzer ürünler. Rezervasyon düğmesi
      yok: ayrıntılı sayfa hazır olmadan satış açılmıyor.

   ADLAR: üst seviye adlar DTY_ / dty ile başlıyor (klasik betikler üst
   kapsamı paylaşıyor). */

const DTY_NODE = (typeof require === 'function' && typeof module !== 'undefined' && module.exports);
const DTY_TAKSONOMI = DTY_NODE ? require('./taxonomy-data.js') : null;
const DTY_KAPI = DTY_NODE ? require('./data-gateway.js') : null;

/* Taksonomi adları: Node'da modülden, tarayıcıda üst kapsamdan. */
function dtyTaks(ad) {
  if (DTY_TAKSONOMI && DTY_TAKSONOMI[ad] !== undefined) return DTY_TAKSONOMI[ad];
  const kapsam = (typeof globalThis !== 'undefined') ? globalThis : {};
  if (ad === 'TAXONOMY_TYPES') return (typeof TAXONOMY_TYPES !== 'undefined') ? TAXONOMY_TYPES : null;
  return typeof kapsam[ad] === 'function' ? kapsam[ad] : null;
}

/* Tipin şablonu: sayfada görünen ad (erişilebilirlik etiketleri), stil
   ve betik dosyaları. Sıra önemli: tour-pdf.js tour-page.js'ten önce. */
const DTY_TIPLER = {
  tour:     { isim: 'Tur',      css: ['tour.css'],                 js: ['tour-pdf.js', 'tour-page.js'] },
  hotel:    { isim: 'Otel',     css: ['tour.css', 'hotel.css'],    js: ['hotel-page.js'] },
  activity: { isim: 'Aktivite', css: ['tour.css', 'activity.css'], js: ['activity-page.js'] },
  event:    { isim: 'Etkinlik', css: ['tour.css', 'event.css'],    js: ['event-page.js'] },
  venue:    { isim: 'Mekân',    css: ['tour.css', 'venue.css'],    js: ['venue-page.js'] }
};

/* Bölümler: sayfa betiği bölüm menüsünü DOM'da bulduğu bölümlerden
   kuruyor; hangi bölümlerin olacağına şablon karar veriyor. */
function dtyBolumler(tip, kayit) {
  const k = kayit || {};
  if (tip === 'tour') {
    return ['genel-bakis', 'program'].concat(k.type === 'stay' ? ['konaklama'] : [])
      .concat(['dahil-olanlar', 'bulusma', 'bilgiler', 'yorumlar', 'sss']);
  }
  if (tip === 'hotel') return ['genel-bakis', 'odalar', 'olanaklar', 'konum', 'politikalar', 'yorumlar', 'sss'];
  if (tip === 'activity') return ['genel-bakis', 'paketler', 'program', 'bulusma', 'bilgiler', 'yorumlar', 'sss'];
  if (tip === 'event') return ['genel-bakis', 'program', 'biletler', 'mekan', 'bilgiler', 'yorumlar', 'sss'];
  if (tip === 'venue') {
    return k.booking === 'randevu'
      ? ['genel-bakis', 'hizmetler', 'saatler', 'konum', 'bilgiler', 'yorumlar', 'sss']
      : ['genel-bakis', 'alanlar', 'menu', 'saatler', 'konum', 'bilgiler', 'yorumlar', 'sss'];
  }
  return [];
}

function dtyKacis(metin) {
  return String(metin === undefined || metin === null ? '' : metin)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const DTY_GERI_IKON = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';

/* Tam kaydın iskeleti: statik sayfa kabuğunun <body> içeriği (başlık ve
   alt bilgi hariç; onlar yönlendirici sayfada zaten var).
   kok: sayfa köküne göre önek ("" yönlendiricide, "../../" statik
   sayfada). listeYolu/listeAdi: kırıntının orta halkası. */
function dtyIskelet(tip, kayit, kok, listeYolu, listeAdi) {
  const ayar = DTY_TIPLER[tip];
  if (!ayar || !kayit) return '';
  const k = kok || '';
  const isim = ayar.isim;
  return '<div class="tour-mobile-header">'
    + '<a class="tour-mobile-back" href="' + k + 'index.html" aria-label="Anasayfaya don"><span class="icon">' + DTY_GERI_IKON + '</span></a>'
    + '<div class="tour-mobile-heading">'
    + '<span class="tour-mobile-title">' + dtyKacis(kayit.title) + '</span>'
    + '<span class="tour-mobile-subtitle">' + dtyKacis(kayit.categoryShort + ' · ' + kayit.area) + '</span>'
    + '</div></div>'
    + '<main class="tour-page">'
    + '<nav class="tour-crumbs" aria-label="Sayfa yolu"><ol>'
    + '<li><a href="' + k + 'index.html">Anasayfa</a></li>'
    + '<li><a href="' + k + listeYolu + '/">' + dtyKacis(listeAdi) + '</a></li>'
    + '<li aria-current="page">' + dtyKacis(kayit.title) + '</li>'
    + '</ol></nav>'
    + '<section class="tour-gallery" id="tourGallery" aria-label="' + isim + ' fotoğrafları"></section>'
    + '<div class="tour-layout"><div class="tour-main">'
    + '<header class="tour-headline"><div id="tourHeadline"></div>'
    + '<h1>' + dtyKacis(kayit.title) + '</h1>'
    + '<p class="tour-lead">' + dtyKacis(kayit.tagline) + '</p>'
    + '<div class="tour-head-meta" id="tourHeadMeta"></div></header>'
    + '<section class="tour-facts" id="tourFacts" aria-label="' + isim + ' künyesi"></section>'
    + '<div class="tour-booking-slot" id="tourBookingMobile"></div>'
    + '<nav class="tour-section-nav" id="tourSectionNav" aria-label="' + isim + ' bölümleri"></nav>'
    + dtyBolumler(tip, kayit).map(id => '<section class="tour-block" id="' + id + '"></section>').join('')
    + '</div><aside class="tour-aside"><div class="tour-aside-sticky tour-booking-slot" id="tourBookingDesktop"></div></aside></div>'
    + '<section class="tour-block tour-similar" id="tourSimilar"></section>'
    + '<section class="tour-block tour-tags" id="tourTags"></section>'
    + '</main>'
    + '<div class="tour-sticky-bar" id="tourStickyBar"></div>'
    + '<div class="tour-lightbox" id="tourLightbox"></div>'
    + '<div class="tour-sheet" id="tourSheet"></div>';
}

/* ---------------- örnek kayıt: özet sayfası ---------------- */

const DTY_GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/* Fiyat metni veri kapısının biçimiyle (1.290 TL, €149). */
function dtyTutar(tutar, paraBirimi) {
  if (DTY_KAPI && DTY_KAPI.kapiFiyatMetni) return DTY_KAPI.kapiFiyatMetni(tutar, paraBirimi);
  if (typeof kapiFiyatMetni === 'function') return kapiFiyatMetni(tutar, paraBirimi);
  return String(tutar) + ' ' + (paraBirimi || 'TL');
}

/* Kaydın kendi seçenekleri: odalar, paketler, bilet kategorileri,
   kalkış günleri. Özet kayıt bunları taşıyor; uydurma yok. */
function dtySecenekler(tip, kayit) {
  const para = kayit.currency || 'TRY';
  const satir = (ad, deger) => ({ ad, deger });
  if (tip === 'hotel') {
    return (kayit.rooms || []).map(r => satir(r.name, dtyTutar(r.nightly, para) + ' / gece'))
      .concat((kayit.boards || []).length ? [satir('Pansiyon', kayit.boards.map(b => b.label).join(', '))] : []);
  }
  if (tip === 'activity') {
    return (kayit.packages || []).map(p => satir(p.name, dtyTutar(p.perPerson, para) + ' / kişi'))
      .concat((kayit.sessions || []).length
        ? [satir('Seanslar', kayit.sessions.map(s => s.label + ' ' + s.time).join(', '))] : []);
  }
  if (tip === 'event') {
    return (kayit.categories || []).map(c => satir(c.name, dtyTutar(c.price, para) + ' / bilet'))
      .concat(kayit.venueName ? [satir('Mekân', kayit.venueName)] : []);
  }
  if (tip === 'tour') {
    const p = kayit.pricing || {};
    const fiyat = p.adult || p.perPerson;
    const gunler = (p.departureDays || []).map(g => DTY_GUNLER[g]).filter(Boolean);
    return [].concat(fiyat ? [satir('Kişi başı', dtyTutar(fiyat, para))] : [])
      .concat(gunler.length ? [satir('Kalkış', 'Her ' + gunler.join(', ') + (p.startTime ? ' · ' + p.startTime : ''))] : [])
      .concat(kayit.durationLabel ? [satir('Süre', kayit.durationLabel)] : []);
  }
  return [];
}

/* Kaydın sınıflandırmasından bağlı çipler: kategori, temalar, "kimin
   için" ve bölge. Her çip gerçek bir liste sayfasına gider. */
function dtyCipler(tip, kayit) {
  const T = dtyTaks('TAXONOMY_TYPES');
  const kategori = dtyTaks('taxonomyCategory');
  const tema = dtyTaks('taxonomyTheme');
  const koleksiyon = dtyTaks('taxonomyCollection');
  const t = kayit.taxonomy || {};
  const out = [];
  const kat = kategori && T ? kategori(tip, (t.categories || [])[0]) : null;
  if (kat) out.push({ name: kat.name, path: T[tip].base + '/' + kat.slug });
  (t.themes || []).forEach(s => {
    const x = tema ? tema(s) : null;
    if (x) out.push({ name: x.name, path: 'temalar/' + x.slug });
  });
  (t.collections || []).forEach(s => {
    const x = koleksiyon ? koleksiyon(s) : null;
    if (x) out.push({ name: x.name, path: 'koleksiyonlar/' + x.slug });
  });
  return out;
}

function dtyOzetMarkup(tip, kayit, secenek) {
  const o = secenek || {};
  const kart = o.kart || {};
  const satir = o.satir || {};
  const gorsel = o.gorsel || '';
  const para = kayit.currency || 'TRY';
  const fiyat = satir.price ? dtyTutar(satir.price, para) : '';
  const liste = satir.discounted && satir.listPrice ? dtyTutar(satir.listPrice, para) : '';
  const birim = { tour: 'kişi başı', hotel: 'gece başı', activity: 'kişi başı', event: 'bilet başı', venue: '' }[tip] || '';
  const puan = kart.rating
    ? '<span class="dty-rating"><span aria-hidden="true">★</span> ' + dtyKacis(kart.rating)
      + (kart.reviews ? ' <span class="dty-muted">(' + dtyKacis(kart.reviews) + ' değerlendirme)</span>' : '') + '</span>'
    : '';
  const secenekler = dtySecenekler(tip, kayit);
  const cipler = dtyCipler(tip, kayit);
  const tarihler = o.tarihler || [];
  return '<main class="lst-page dty-page" id="lstPage">'
    + (o.kirinti ? o.kirinti : '')
    + '<article class="dty-ozet">'
    + '<div class="dty-hero"><img src="' + dtyKacis(gorsel) + '" alt="' + dtyKacis(kayit.title) + '">'
    + '<div class="dty-badges">' + (kart.badges || []).map(b => '<span class="poi-badge">' + dtyKacis(b) + '</span>').join('') + '</div></div>'
    + '<div class="dty-grid">'
    + '<div class="dty-main">'
    + '<h1>' + dtyKacis(kayit.title) + '</h1>'
    + '<p class="dty-meta">' + [dtyKacis(kart.meta1 || kayit.area), puan].filter(Boolean).join('<span class="dty-dot" aria-hidden="true">·</span>') + '</p>'
    + (secenekler.length
      ? '<dl class="dty-facts">' + secenekler.map(s => '<div><dt>' + dtyKacis(s.ad) + '</dt><dd>' + dtyKacis(s.deger) + '</dd></div>').join('') + '</dl>'
      : '')
    + (cipler.length
      ? '<nav class="lst-chips dty-chips" aria-label="Sınıflandırma">' + cipler.map(c => '<a class="lst-chip" href="' + dtyKacis(c.path) + '/">' + dtyKacis(c.name) + '</a>').join('') + '</nav>'
      : '')
    + '<div class="dty-note"><strong>Ayrıntılı sayfa hazırlanıyor.</strong>'
    + '<p>Program, fiyata dahil olanlar ve iptal koşulları eklendiğinde bu sayfada yer alacak ve rezervasyon açılacak.</p></div>'
    + '</div>'
    + '<aside class="dty-card" aria-label="Fiyat">'
    + (fiyat ? '<span class="dty-card-label">Başlangıç fiyatı</span>'
      + '<div class="dty-price">' + (liste ? '<s>' + dtyKacis(liste) + '</s>' : '') + '<strong>' + dtyKacis(fiyat) + '</strong>'
      + (birim ? '<span>' + birim + '</span>' : '') + '</div>'
      + (o.tlKarsiligi ? '<p class="dty-tl">Ödeme TL alınır: bugünkü kurla yaklaşık <strong>' + dtyKacis(o.tlKarsiligi)
        + '</strong>. Kur rezervasyon anında sabitlenir.</p>' : '') : '')
    + (tarihler.length
      ? '<span class="dty-card-label">Yaklaşan tarihler</span><div class="dty-dates">'
        + tarihler.map(t => '<span class="dty-date">' + dtyKacis(t) + '</span>').join('') + '</div>'
      : (o.herGun ? '<p class="dty-muted dty-everyday">' + dtyKacis(o.herGun) + '</p>' : ''))
    + '<button class="btn-primary dty-cta" type="button" disabled>Rezervasyon yakında</button>'
    + (o.listeYolu ? '<a class="dty-list-link" href="' + dtyKacis(o.listeYolu) + '/">' + dtyKacis(o.listeAdi) + ' sayfasına dön</a>' : '')
    + '</aside>'
    + '</div></article>'
    + (o.benzerler ? '<section class="lst-suggest"><h2>' + dtyKacis(o.benzerBaslik) + '</h2><div class="lst-grid">' + o.benzerler + '</div></section>' : '')
    + '</main>';
}

/* ---------------- kurulum (tarayıcı) ---------------- */

/* Yayında basılan sürüm damgası (?v=…): yönlendiricinin kendi betiğinden
   okunuyor; sonradan yüklenen dosyalar aynı damgayı alıyor. */
function dtySurum() {
  const el = document.querySelector('script[src*="listing-page.js"]');
  const m = el ? String(el.getAttribute('src')).match(/\?v=[^"&#]+/) : null;
  return m ? m[0] : '';
}

function dtyStilYukle(dosya, surum) {
  return new Promise(coz => {
    const yol = 'assets/css/' + dosya;
    if (document.querySelector('link[href^="' + yol + '"]')) { coz(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = yol + surum;
    link.onload = link.onerror = () => coz();
    document.head.appendChild(link);
  });
}

function dtyBetikYukle(dosya, surum) {
  return new Promise(coz => {
    const s = document.createElement('script');
    s.src = 'assets/js/' + dosya + surum;
    s.async = false;
    s.onload = s.onerror = () => coz();
    document.body.appendChild(s);
  });
}

function dtyKur(kok, adres, bugun) {
  const tip = adres.type;
  const kayit = MolaVeri.urun(tip, adres.slug);
  if (!kayit) return null;
  const listeYolu = MolaVeri.listeYolu(kayit);
  const listeModeli = MolaVeri.sayfaModeli(MolaVeri.adres(listeYolu), bugun);
  const listeAdi = listeModeli ? listeModeli.baslik : '';
  const seo = MolaVeri.seo(tip, kayit);
  const site = (typeof KAPI_SITE_ADRESI !== 'undefined') ? KAPI_SITE_ADRESI : '';
  if (typeof lspMetaYaz === 'function') {
    lspMetaYaz({
      title: seo.title + ' — mola360',
      description: seo.description,
      ogTitle: seo.ogTitle,
      canonical: seo.canonical,
      /* Özet sayfası ince içerik: dizine girmesin. */
      noindex: !!kayit.sample
    });
  }
  const kirinti = [{ name: 'Anasayfa', path: '' }, { name: listeAdi, path: listeYolu }, { name: kayit.title, path: seo.path.replace(/\/$/, '') }];
  if (typeof lspYapisalYaz === 'function' && typeof lspYapisalVeri === 'function') {
    lspYapisalYaz(lspYapisalVeri({ kirinti, baslik: kayit.title }, null, [], site));
  }

  if (!kayit.sample) {
    /* Tam kayıt: tipin detay şablonu. Stil yüklenmeden iskelet
       basılmıyor (biçimsiz bir an görünmesin). */
    const ayar = DTY_TIPLER[tip];
    const surum = dtySurum();
    document.body.classList.remove('lst-body');
    document.body.classList.add('tour-body');
    return Promise.all(ayar.css.map(d => dtyStilYukle(d, surum))).then(() => {
      kok.innerHTML = dtyIskelet(tip, kayit, '', listeYolu, listeAdi);
      return ayar.js.reduce((zincir, d) => zincir.then(() => dtyBetikYukle(d, surum)), Promise.resolve());
    });
  }

  /* Örnek kayıt: özet sayfası. */
  const kartUret = (typeof KATALOG_KART !== 'undefined') ? KATALOG_KART[tip] : null;
  const kart = kartUret ? kartUret(kayit, bugun) || {} : {};
  const satir = MolaVeri.listeSatiri(kayit, bugun) || {};
  const gorsel = (typeof cardImages !== 'undefined' && cardImages[kart.img]) || '';
  const tarihler = [];
  if (satir.facets && satir.facets.ay !== null && typeof cardDateText === 'function') {
    /* Sabit tarihli ürün: ilk altı satış tarihi. */
    const liste = (typeof kapiSabitTarihler === 'function') ? (kapiSabitTarihler(kayit, tip, bugun) || []) : [];
    liste.slice(0, 6).forEach(d => tarihler.push(cardDateText(d, bugun)));
  }
  /* Döviz fiyatlı ürün: tahsilat TL, yaklaşık karşılık gösteriliyor. */
  const tl = (kayit.currency || 'TRY') !== 'TRY' && satir.priceTRY
    ? dtyTutar(satir.priceTRY, 'TRY') : '';
  const herGun = satir.facets && satir.facets.ay === null
    ? (tip === 'hotel' ? 'Her gün giriş yapılabilir.' : 'Her gün yapılıyor.') : '';
  const benzer = MolaVeri.benzerler(kayit, bugun, 4);
  const T = (typeof TAXONOMY_TYPES !== 'undefined') ? TAXONOMY_TYPES : {};
  const cogul = T[tip] ? T[tip].plural.toLocaleLowerCase('tr-TR') : '';
  const kartlar = (typeof lspKartlarMarkup === 'function')
    ? lspKartlarMarkup((benzer.length ? benzer : MolaVeri.listele({ type: tip }, bugun).filter(k => k.slug !== kayit.slug).slice(0, 4))
      .map(k => MolaVeri.listeSatiri(k, bugun)), bugun)
    : '';
  const altBaslik = (kart.badges && kart.badges[0] ? kart.badges[0] + ' · ' : '') + (kayit.area || '');
  kok.innerHTML = (typeof lspMobilBaslikMarkup === 'function' ? lspMobilBaslikMarkup(kayit.title, altBaslik, listeYolu) : '')
    + dtyOzetMarkup(tip, kayit, {
      kart, satir, gorsel, tarihler, herGun, listeYolu, listeAdi, tlKarsiligi: tl,
      kirinti: (typeof lspKirintiMarkup === 'function') ? lspKirintiMarkup(kirinti) : '',
      benzerler: kartlar || null,
      benzerBaslik: benzer.length ? 'Benzer ' + cogul : 'Diğer ' + cogul
    });
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DTY_TIPLER, dtyBolumler, dtyIskelet, dtySecenekler, dtyCipler, dtyOzetMarkup, dtyKacis };
}
