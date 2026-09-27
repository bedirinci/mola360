/* ---------------- kurumsal sayfalar ----------------
   /kurumsal/<slug>/ — içerik corporate-data.js'te (KRM_SAYFALAR), bu
   dosya ekran. Aynı işaretleme ödeme ekranında da kullanılıyor: ön
   bilgilendirme formu ve mesafeli satış sözleşmesi rezervasyonun kendi
   bilgileriyle doldurulup gösteriliyor (krsSozlesmeMarkup).

   ADLAR: üst seviye adlar KRS_ / krs ile başlıyor. */

const KRS_NODE = (typeof require === 'function' && typeof module !== 'undefined' && module.exports);
const KRS_MODUL = KRS_NODE ? Object.assign({}, require('./corporate-data.js'), require('./booking-engine.js'),
  { CONTACT: require('./home-blocks.js').CONTACT, HSP_HOSGELDIN: require('./account-engine.js').HSP_HOSGELDIN }) : null;
/* Ad çözümü: Node'da modülden; tarayıcıda üst kapsamdan (function
   bildirimleri globalThis'te, const tablolar betik kapsamında). */
function krsAd(ad) {
  if (KRS_MODUL && KRS_MODUL[ad] !== undefined) return KRS_MODUL[ad];
  const g = (typeof globalThis !== 'undefined') ? globalThis : {};
  if (typeof g[ad] === 'function') return g[ad];
  const tablolar = {
    KRM_SIRKET: typeof KRM_SIRKET !== 'undefined' ? KRM_SIRKET : null,
    KRM_SIRKET_ALANLARI: typeof KRM_SIRKET_ALANLARI !== 'undefined' ? KRM_SIRKET_ALANLARI : null,
    KRM_SAYFALAR: typeof KRM_SAYFALAR !== 'undefined' ? KRM_SAYFALAR : null,
    KRM_SSS: typeof KRM_SSS !== 'undefined' ? KRM_SSS : null,
    KRM_SSS_KATEGORILER: typeof KRM_SSS_KATEGORILER !== 'undefined' ? KRM_SSS_KATEGORILER : null,
    KRM_DEPO: typeof KRM_DEPO !== 'undefined' ? KRM_DEPO : null,
    KRM_GUNCELLEME: typeof KRM_GUNCELLEME !== 'undefined' ? KRM_GUNCELLEME : null,
    REZ_KAPORA: typeof REZ_KAPORA !== 'undefined' ? REZ_KAPORA : null,
    REZ_TAKSIT: typeof REZ_TAKSIT !== 'undefined' ? REZ_TAKSIT : null,
    REZ_KAMPANYALAR: typeof REZ_KAMPANYALAR !== 'undefined' ? REZ_KAMPANYALAR : null,
    CONTACT: typeof CONTACT !== 'undefined' ? CONTACT : null,
    HSP_HOSGELDIN: typeof HSP_HOSGELDIN !== 'undefined' ? HSP_HOSGELDIN : null
  };
  return tablolar[ad] === undefined ? null : tablolar[ad];
}
function krsK(m) { return krsAd('krmKacis')(m); }

/* Yer tutucu değerleri: şirket, iletişim ve kural tabloları. */
function krsBaglam() {
  return krsAd('krmBaglam')({
    sirket: krsAd('KRM_SIRKET'), contact: krsAd('CONTACT'),
    kapora: krsAd('REZ_KAPORA'), taksit: krsAd('REZ_TAKSIT'), kampanyalar: krsAd('REZ_KAMPANYALAR'),
    hosgeldin: krsAd('HSP_HOSGELDIN'),
    para: krsAd('rezPara') || undefined
  });
}
function krsMetin(m, b) { return krsAd('krmMetin')(m, b); }
function krsPara(n) { const f = krsAd('rezPara'); return f ? f(n) : n + ' TL'; }
function krsTarih(iso, yilsiz) { const f = krsAd('rezTarihMetni'); return f ? f(iso, yilsiz) : String(iso || ''); }

/* ---------------- özel bloklar ---------------- */
function krsSirketMarkup(b) {
  const alanlar = krsAd('KRM_SIRKET_ALANLARI') || [];
  return '<table class="krs-table krs-company"><tbody>'
    + '<tr><th scope="row">Marka</th><td>' + krsK(b.marka) + '</td></tr>'
    + alanlar.map(([ad, etiket]) => '<tr><th scope="row">' + krsK(etiket) + '</th><td>'
      + (b[ad] ? krsK(b[ad]) : '<mark class="krm-eksik">[yayından önce eklenecek]</mark>') + '</td></tr>').join('')
    + '</tbody></table>';
}

function krsIletisimKanallariMarkup(b) {
  const c = krsAd('CONTACT') || {};
  const saat = (s) => String(s).padStart(2, '0') + ':00';
  const kart = (baslik, deger, alt, href) => '<div class="krs-channel">' + '<span class="krs-channel-label">' + baslik + '</span>'
    + (href ? '<a href="' + krsK(href) + '"' + (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' + deger + '</a>' : '<strong>' + deger + '</strong>')
    + (alt ? '<span>' + alt + '</span>' : '') + '</div>';
  return '<div class="krs-channels">'
    + kart('Telefon', krsK(c.phoneLabel || ''), krsK(c.hours || ''), c.phoneHref)
    + kart('WhatsApp', 'Mesaj yaz', c.whatsappOpenHour !== undefined ? 'Her gün ' + saat(c.whatsappOpenHour) + ' – ' + (c.whatsappCloseHour === 24 ? '24:00' : saat(c.whatsappCloseHour)) : '', c.whatsappHref)
    + kart('E-posta', b.eposta ? krsK(b.eposta) : '<mark class="krm-eksik">[e-posta eklenecek]</mark>', '', b.eposta ? 'mailto:' + b.eposta : null)
    + kart('Adres', b.adres ? krsK(b.adres) : '<mark class="krm-eksik">[adres eklenecek]</mark>', '', null)
    + '</div>'
    + (c.yerTutucu ? '<p class="krs-note">Telefon ve WhatsApp numaraları yer tutucu; hat kurulunca güncellenecek.</p>' : '');
}

function krsIletisimFormuMarkup(konular) {
  const alan = (ad, etiket, ek) => '<label class="odm-field"><span>' + etiket + '</span><input name="' + ad + '" ' + (ek || '') + '>'
    + '<small class="odm-error" data-hata="' + ad + '"></small></label>';
  return '<form class="krs-form" data-iletisim novalidate><div class="odm-row">'
    + alan('ad', 'Ad soyad', 'autocomplete="name" maxlength="80"') + alan('eposta', 'E-posta', 'type="email" autocomplete="email" maxlength="120"')
    + '</div><div class="odm-row">'
    + alan('telefon', 'Cep telefonu (isteğe bağlı)', 'type="tel" autocomplete="tel" maxlength="20"')
    + alan('rezervasyonKodu', 'Rezervasyon kodu (varsa)', 'maxlength="12" placeholder="M360-XXXXXX" autocomplete="off"')
    + '</div><label class="odm-field"><span>Konu</span><select name="konu"><option value="">Seçin</option>'
    + (konular || []).map(k => '<option>' + krsK(k) + '</option>').join('') + '</select><small class="odm-error" data-hata="konu"></small></label>'
    + '<label class="odm-field"><span>Mesajın</span><textarea name="mesaj" rows="4" maxlength="2000"></textarea><small class="odm-error" data-hata="mesaj"></small></label>'
    + '<label class="odm-check"><input type="checkbox" name="kvkk"><span><a href="kurumsal/kvkk/">Aydınlatma metnini</a> okudum; talebimin yanıtlanması için bilgilerimin işlenmesini onaylıyorum.</span></label>'
    + '<small class="odm-error" data-hata="kvkk"></small>'
    + '<p class="krs-note">Deneme sürümü: mesajlar bu tarayıcıda kaydedilir, henüz ekibe iletilmez.</p>'
    + '<p class="krs-ok" data-gonderildi role="status"></p>'
    + '<button type="submit" class="btn-primary krs-btn">Gönder</button></form>';
}

function krsSssMarkup(liste, kategoriler, b, q) {
  const ara = String(q || '').trim();
  const norm = (s) => String(s).toLocaleLowerCase('tr-TR');
  const esles = (x) => !ara || norm(x.soru + ' ' + krsAd('krmDuzMetin')(x.cevap, b)).indexOf(norm(ara)) !== -1;
  const gruplar = kategoriler.map(k => ({ k, sorular: liste.filter(x => x.kategori === k.id && esles(x)) })).filter(g => g.sorular.length);
  return '<form class="krs-search" role="search" data-sss-ara><label class="lst-visually-hidden" for="krsSssAra">SSS\'de ara</label>'
    + '<input id="krsSssAra" name="q" type="search" placeholder="Soru ara: kapora, iptal, taksit…" value="' + krsK(ara) + '" autocomplete="off"></form>'
    + '<nav class="lst-chips krs-cats" aria-label="Konular">' + kategoriler.map(k => '<a class="lst-chip" href="kurumsal/sss/#' + k.id + '">' + krsK(k.ad) + '</a>').join('') + '</nav>'
    + (gruplar.length ? gruplar.map(g => '<section class="krs-faq-group" id="' + g.k.id + '"><h2>' + krsK(g.k.ad) + '</h2>'
      + g.sorular.map(x => '<details class="krs-faq" id="' + x.id + '"' + (ara ? ' open' : '') + '><summary>' + krsK(x.soru) + '</summary><p>' + krsMetin(x.cevap, b) + '</p></details>').join('')
      + '</section>').join('')
      : '<p class="krs-note">“' + krsK(ara) + '” için soru bulunamadı. <a href="kurumsal/iletisim/">Bize yaz</a>.</p>');
}

function krsYardimMarkup(liste, kategoriler) {
  const say = (id) => liste.filter(x => x.kategori === id).length;
  const hizli = [
    ['hesabim/?bolum=rezervasyonlarim', 'Rezervasyonlarım', 'İptal, ayrıntı ve ödeme planı'],
    ['hesabim/', 'Rezervasyonunu bul', 'Üye olmadan kod ve e-postayla'],
    ['hesabim/?bolum=biletlerim', 'Biletlerim', 'Karekodlu biletler'],
    ['kurumsal/iptal-iade/', 'İptal ve iade', 'Kademeler ve iadenin yapılışı'],
    ['kampanyalar/', 'Kampanyalar', 'Yürürlükteki indirimler'],
    ['kurumsal/iletisim/', 'İletişim', 'Telefon, WhatsApp ve form']
  ];
  return '<form class="krs-search" role="search" action="kurumsal/sss/" data-yardim-ara><label class="lst-visually-hidden" for="krsYardimAra">Yardım ara</label>'
    + '<input id="krsYardimAra" name="q" type="search" placeholder="Ne arıyorsun? Kapora, iptal, taksit…" autocomplete="off"></form>'
    + '<div class="krs-quick">' + hizli.map(([yol, ad, alt]) => '<a class="krs-quick-item" href="' + yol + '"><strong>' + ad + '</strong><span>' + alt + '</span></a>').join('') + '</div>'
    + '<h2 class="krs-subtitle">Konular</h2><div class="krs-topics">' + kategoriler.map(k => '<a class="krs-topic" href="kurumsal/sss/#' + k.id + '"><strong>'
      + krsK(k.ad) + '</strong><span>' + say(k.id) + ' soru</span></a>').join('') + '</div>';
}

/* İptal koşulları: satıştaki (örnek olmayan) ürünlerin kendi kademeleri. */
function krsIadeMetni(oran) {
  if (oran >= 1) return 'Tamamı iade';
  if (oran <= 0) return 'İade yok';
  return '%' + Math.round(oran * 100) + ' iade';
}
function krsIptalTablosuMarkup(urunler, tipAdi, yolu) {
  if (!urunler.length) return '<p class="krs-note">Satışta ürün yok.</p>';
  return '<div class="krs-table-scroll"><table class="krs-table"><thead><tr><th scope="col">Ürün</th><th scope="col">İptal zamanı ve iade</th></tr></thead><tbody>'
    + urunler.map(k => '<tr><th scope="row"><a href="' + yolu(k) + '">' + krsK(k.title) + '</a><small>' + krsK(tipAdi(k)) + '</small></th><td><ul class="krs-tiers">'
      + ((k.cancellation || {}).tiers || []).slice().sort((a, b) => (b.minHours || 0) - (a.minHours || 0))
        .map(t => '<li><span>' + krsK(t.label) + '</span><strong>' + krsIadeMetni(Number(t.rate) || 0) + '</strong></li>').join('')
      + (Number((k.cancellation || {}).weatherRefund) >= 1 ? '<li><span>Hava koşulu nedeniyle yapılamazsa</span><strong>Tamamı iade</strong></li>' : '')
      + '</ul></td></tr>').join('')
    + '</tbody></table></div>';
}

function krsDepoMarkup(depo) {
  return '<div class="krs-table-scroll"><table class="krs-table"><thead><tr><th scope="col">Anahtar</th><th scope="col">Ne için</th></tr></thead><tbody>'
    + (depo || []).map(d => '<tr><td><code>' + krsK(d.anahtar) + '</code></td><td>' + krsK(d.amac) + '</td></tr>').join('') + '</tbody></table></div>';
}

/* Sözleşme blokları: teklif verilirse rezervasyonun kendi bilgileri,
   verilmezse (sayfa) genel açıklama. */
function krsRezervasyonOzetiMarkup(t) {
  if (!t) return '<p>Hizmet, ödeme adımındaki rezervasyon özetinde yazan ürün, tarih, saat ve kişi sayısıdır; ürünün içeriği, fiyata dahil olanlar ve kurallar ürün sayfasında yazar.</p>';
  return '<table class="krs-table"><tbody><tr><th scope="row">Hizmet</th><td>' + krsK(t.baslik) + '</td></tr>'
    + (t.ozet || []).filter(x => x.deger).map(x => '<tr><th scope="row">' + krsK(x.ad) + '</th><td>' + krsK(x.deger) + '</td></tr>').join('')
    + '</tbody></table>';
}
function krsBedelMarkup(t) {
  if (!t) return '<p>Toplam bedel, vergiler ve varsa ek hizmetler dahil olarak ödeme adımında gösterilen tutardır. Tahsilat Türk lirasıyla yapılır; döviz fiyatlı ürünlerde tutar rezervasyon anındaki kurla hesaplanır. Turlarda kapora seçilirse kalan tutar, seçilen tarihte ödenir. Taksitli ödemede vade farkı ödeme adımında ayrıca gösterilir.</p>';
  const o = t.odeme || {};
  const satirlar = [['Toplam (vergiler dahil)', krsPara(t.toplam)]];
  (t.indirimler || []).forEach(x => satirlar.push([x.ad, '−' + krsPara(x.tutar)]));
  if (t.kur) satirlar.push(['Kur', '1 ' + t.paraBirimi + ' = ' + krsPara(t.kur.oran) + ' (rezervasyonla sabitlenir)']);
  if (o.sekil === 'kapora') {
    satirlar.push(['Şimdi ödenecek kapora', krsPara(o.simdi)]);
    satirlar.push(['Kalan', krsPara(o.kalan) + ' · ' + (o.kalanTercih === 'aracta' ? 'tur günü araçta' : 'turdan 1 gün önce') + (o.kalanTarihi ? ' (' + krsTarih(o.kalanTarihi, true) + ')' : '')]);
  } else if (o.sekil === 'mekanda') {
    satirlar.push(['Ödeme', 'Mekânda, hizmetten sonra']);
  } else satirlar.push(['Şimdi ödenecek', krsPara(o.simdi)]);
  if (t.taksit && t.taksit.secilen && t.taksit.secilen.taksit > 1) {
    satirlar.push(['Taksit', t.taksit.secilen.taksit + ' taksit, vade farkı ' + krsPara(t.taksit.vadeFarki) + ', karttan çekilecek ' + krsPara(t.tahsilat)]);
  }
  return '<table class="krs-table"><tbody>' + satirlar.map(([a, d]) => '<tr><th scope="row">' + krsK(a) + '</th><td>' + krsK(d) + '</td></tr>').join('') + '</tbody></table>';
}
function krsIptalKosullariMarkup(t) {
  if (!t) return '<p>Ürünün kademeli iptal koşulları ürün sayfasında ve ödeme adımında tarihleriyle yazar; rezervasyon, onay anındaki koşullara tabidir. Ayrıntı: <a href="kurumsal/iptal-iade/">İptal ve İade</a>.</p>';
  const o = t.odeme || {};
  return '<ul class="krs-tiers">' + (t.iptal || []).map((k, i) => '<li><span>' + (k.sonAnMetni ? krsK(k.sonAnMetni) + '’e kadar' : (i === 0 ? 'Her zaman' : 'Sonrasında'))
    + '</span><strong>' + (o.sekil === 'mekanda' ? krsK(k.metin) : (k.iade > 0 ? krsPara(k.iade) + ' iade' : 'İade yok')) + '</strong></li>').join('') + '</ul>'
    + (o.sekil === 'kapora' ? '<p>Kaporalı rezervasyonda kesinti toplam tutar üzerinden hesaplanır; ödenenden fazlası istenmez.</p>' : '');
}

/* ---------------- sayfa ---------------- */
function krsIcerikMarkup(oge, b, ozel) {
  if (typeof oge === 'string') return '<p>' + krsMetin(oge, b) + '</p>';
  if (oge.liste) return '<ul class="krs-list">' + oge.liste.map(x => '<li>' + krsMetin(x, b) + '</li>').join('') + '</ul>';
  if (oge.tablo) {
    return '<div class="krs-table-scroll"><table class="krs-table"><thead><tr>' + oge.tablo.basliklar.map(x => '<th scope="col">' + krsK(x) + '</th>').join('')
      + '</tr></thead><tbody>' + oge.tablo.satirlar.map(r => '<tr>' + r.map((x, i) => i === 0 ? '<th scope="row">' + krsMetin(x, b) + '</th>' : '<td>' + krsMetin(x, b) + '</td>').join('') + '</tr>').join('')
      + '</tbody></table></div>';
  }
  if (oge.ozel) return (ozel && ozel[oge.ozel]) ? ozel[oge.ozel]() : '';
  return '';
}

function krsBolumlerMarkup(sayfa, b, ozel, baslikSeviyesi) {
  const h = baslikSeviyesi || 'h2';
  return sayfa.bolumler.map(bl => '<section class="krs-section" id="' + krsK(bl.id) + '">'
    + (bl.baslik ? '<' + h + '>' + krsMetin(bl.baslik, b) + '</' + h + '>' : '')
    + bl.icerik.map(x => krsIcerikMarkup(x, b, ozel)).join('') + '</section>').join('');
}

/* Ödeme ekranı: rezervasyonun kendi bilgileriyle doldurulmuş belge. */
function krsSozlesmeMarkup(slug, teklif) {
  const sayfa = krsAd('krmSayfa')(slug);
  if (!sayfa) return '';
  const b = krsBaglam();
  const ozel = {
    sirket: () => krsSirketMarkup(b),
    'rezervasyon-ozeti': () => krsRezervasyonOzetiMarkup(teklif),
    bedel: () => krsBedelMarkup(teklif),
    'iptal-kosullari': () => krsIptalKosullariMarkup(teklif)
  };
  return '<div class="krs-doc">' + krsBolumlerMarkup(sayfa, b, ozel, 'h4') + '</div>';
}

function krsNavMarkup(aktif) {
  return '<nav class="hsa-nav krs-nav" aria-label="Kurumsal sayfalar"><ul>'
    + (krsAd('KRM_SAYFALAR') || []).filter(s => s.menu !== false).map(s => '<li><a href="kurumsal/' + s.slug + '/"'
      + (s.slug === aktif ? ' class="is-active" aria-current="page"' : '') + '>' + krsK(s.menuAdi || s.baslik) + '</a></li>').join('')
    + '</ul></nav>';
}

function krsKur(kok, adres) {
  if (typeof document === 'undefined') return null;
  const sayfa = krsAd('krmSayfa')(adres.slug);
  const b = krsBaglam();
  const model = (typeof MolaVeri !== 'undefined') ? MolaVeri.sayfaModeli(adres, new Date()) : { kirinti: [] };
  const q = new URLSearchParams(location.search).get('q') || '';
  const site = (typeof lspSiteAdresi === 'function') ? lspSiteAdresi() : '';
  if (typeof lspMetaYaz === 'function') {
    lspMetaYaz({ title: sayfa.baslik + ' — mola360', description: sayfa.aciklama || sayfa.baslik, noindex: false,
      canonical: site ? site + adres.path + '/' : null });
  }
  const urunler = (typeof MolaVeri !== 'undefined') ? MolaVeri.urunler().filter(k => !k.sample) : [];
  const tipAdi = (k) => ({ tour: 'Tur', hotel: 'Otel', activity: 'Aktivite', event: 'Etkinlik', venue: 'Mekân' })[MolaVeri.icerikTipi(k)] || '';
  const yolu = (k) => { const s = MolaVeri.seo(MolaVeri.icerikTipi(k), k); return s ? s.path : ''; };
  const ozel = {
    sirket: () => krsSirketMarkup(b),
    'iletisim-kanallari': () => krsIletisimKanallariMarkup(b),
    'iletisim-formu': () => krsIletisimFormuMarkup(MolaVeri.talepKonulari ? MolaVeri.talepKonulari() : []),
    yardim: () => krsYardimMarkup(krsAd('KRM_SSS') || [], krsAd('KRM_SSS_KATEGORILER') || []),
    sss: () => krsSssMarkup(krsAd('KRM_SSS') || [], krsAd('KRM_SSS_KATEGORILER') || [], b, q),
    'iptal-tablosu': () => krsIptalTablosuMarkup(urunler, tipAdi, yolu),
    'depo-listesi': () => krsDepoMarkup(krsAd('KRM_DEPO')),
    'rezervasyon-ozeti': () => krsRezervasyonOzetiMarkup(null),
    bedel: () => krsBedelMarkup(null),
    'iptal-kosullari': () => krsIptalKosullariMarkup(null)
  };
  const eksik = sayfa.yasal ? krsAd('krmEksikAlanlar')(krsAd('KRM_SIRKET')) : [];
  const icindekiler = sayfa.yasal && sayfa.bolumler.length > 3
    ? '<nav class="krs-toc" aria-label="İçindekiler"><strong>İçindekiler</strong><ol>' + sayfa.bolumler.filter(x => x.baslik)
      .map(x => '<li><a href="#' + krsK(x.id) + '">' + krsMetin(x.baslik, b).replace(/<[^>]+>/g, '') + '</a></li>').join('') + '</ol></nav>'
    : '';
  kok.innerHTML = (typeof lspMobilBaslikMarkup === 'function' ? lspMobilBaslikMarkup(sayfa.baslik, 'mola360', model.kirinti.length > 1 ? '' : '') : '')
    + '<main class="hsa-page krs-page" id="krsPage">'
    + (typeof lspKirintiMarkup === 'function' ? lspKirintiMarkup(model.kirinti) : '')
    + '<div class="hsa-layout">' + krsNavMarkup(sayfa.slug)
    + '<article class="krs-article"><header class="krs-head"><h1>' + krsK(sayfa.baslik) + '</h1>'
    + (sayfa.yasal ? '<p class="krs-date">Son güncelleme: ' + krsK(krsTarih(krsAd('KRM_GUNCELLEME'))) + '</p>' : '') + '</header>'
    + (eksik.length ? '<p class="krs-draft" role="note">Taslak: şirket bilgileri (' + eksik.map(x => krsK(x.etiket)).join(', ') + ') eklenince yürürlüğe girecek.</p>' : '')
    + icindekiler + krsBolumlerMarkup(sayfa, b, ozel) + '</article></div></main>';

  if (sayfa.slug === 'sss' && typeof lspYapisalYaz === 'function') {
    const duz = krsAd('krmDuzMetin');
    lspYapisalYaz([{ '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: (krsAd('KRM_SSS') || []).map(x => ({ '@type': 'Question', name: x.soru, acceptedAnswer: { '@type': 'Answer', text: duz(x.cevap, b) } })) }]);
  }

  kok.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.matches('[data-sss-ara]')) {
      e.preventDefault();
      const deger = form.q.value.trim();
      history.replaceState(history.state, '', 'kurumsal/sss/' + (deger ? '?q=' + encodeURIComponent(deger) : ''));
      const yeni = krsSssMarkup(krsAd('KRM_SSS') || [], krsAd('KRM_SSS_KATEGORILER') || [], b, deger);
      const bolum = kok.querySelector('#sss');
      if (bolum) { bolum.innerHTML = yeni; const g = kok.querySelector('#krsSssAra'); if (g) g.focus(); }
    } else if (form.matches('[data-iletisim]')) {
      e.preventDefault();
      const v = { tur: 'mesaj', ad: form.ad.value, eposta: form.eposta.value, telefon: form.telefon.value,
        rezervasyonKodu: form.rezervasyonKodu.value, konu: form.konu.value, mesaj: form.mesaj.value, kvkk: form.kvkk.checked };
      form.querySelectorAll('[data-hata]').forEach(x => { x.textContent = ''; });
      MolaVeri.iletisimTalebi(v).then(r => {
        if (!r.tamam) {
          r.hatalar.forEach(h => { const x = form.querySelector('[data-hata="' + h.alan + '"]'); if (x) x.textContent = h.mesaj; });
          const ilk = r.hatalar[0] && form.querySelector('[name="' + r.hatalar[0].alan + '"]');
          if (ilk) ilk.focus();
          return;
        }
        form.reset();
        form.querySelector('[data-gonderildi]').textContent = 'Mesajın kaydedildi (' + r.kod + '). Deneme sürümü: henüz ekibe iletilmiyor.';
      });
    }
  });
  if (location.hash) {
    const hedef = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (hedef) { if (hedef.tagName === 'DETAILS') hedef.open = true; hedef.scrollIntoView({ block: 'start' }); }
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    krsBaglam, krsSirketMarkup, krsIletisimKanallariMarkup, krsIletisimFormuMarkup, krsSssMarkup, krsYardimMarkup,
    krsIadeMetni, krsIptalTablosuMarkup, krsDepoMarkup, krsRezervasyonOzetiMarkup, krsBedelMarkup, krsIptalKosullariMarkup,
    krsBolumlerMarkup, krsSozlesmeMarkup, krsNavMarkup
  };
}
