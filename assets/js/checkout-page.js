/* ---------------- ödeme ve onay ekranları ----------------
   /rezervasyon/?urun=tur/efes-sirince&tarih=…  ödeme (tek sayfa)
   /rezervasyon/onay/?kod=M360-…                onay

   Tek yönlendiriciden (404.html) açılıyor; lspBaslat adresi çözüp
   buraya veriyor. Hesabın tamamı booking-engine.js'te, veri ve
   kontenjan MolaVeri'de; bu dosya yalnızca ekran.

   Ödeme sağlayıcısı henüz bağlı değil. "Ödemeye geç" rezervasyon
   talebini oluşturup onay ekranına gidiyor ve iki ekran da bunu açıkça
   söylüyor. Backend geldiğinde buradaki tek değişiklik: onaya değil,
   sağlayıcının 3D Secure sayfasına gidilecek. Kart numarası bu sayfada
   HİÇ sorulmuyor; sağlayıcının güvenli alanında girilecek.

   ADLAR: üst seviye adlar ODM_ / odm ile başlıyor. */

/* Motor fonksiyonları: tarayıcıda üst kapsamdan, Node'da (testler)
   modülden. */
const ODM_REZ = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./booking-engine.js') : null;
function odmRez(ad) {
  if (ODM_REZ && typeof ODM_REZ[ad] === 'function') return ODM_REZ[ad];
  const g = (typeof globalThis !== 'undefined') ? globalThis : {};
  return typeof g[ad] === 'function' ? g[ad] : null;
}
function odmTarih(iso, yilsiz) {
  const f = odmRez('rezTarihMetni');
  return f ? f(iso, yilsiz) : String(iso || '');
}

const ODM_TIP_ADI = { tour: 'Tur', hotel: 'Otel', activity: 'Aktivite', event: 'Etkinlik', venue: 'Mekân' };
const ODM_KATILIMCI_BASLIK = { tour: 'Katılımcılar', hotel: 'Misafirler', activity: 'Katılımcılar', event: 'Bilet sahibi', venue: 'Rezervasyon sahibi' };

function odmKacis(metin) {
  return String(metin === undefined || metin === null ? '' : metin)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function odmHref(yol) {
  return yol ? String(yol).replace(/\/+$/, '') + '/' : './';
}
function odmPara(tutar, birim, kurus) {
  const f = odmRez('rezPara');
  return f ? f(tutar, birim, kurus) : String(tutar) + ' TL';
}
/* Taksitli tutarlar kuruşlu; tam TL ise kuruş yazılmıyor. */
function odmTL(tutar) {
  return odmPara(tutar, 'TRY', Math.round(Number(tutar) * 100) % 100 !== 0);
}

/* ---------------- saf işaretleme ----------------
   Testler bu fonksiyonları DOM'suz çağırıyor. */

function odmKatilimciMarkup(sablonlar, tip) {
  const sayac = {};
  return sablonlar.map((s, i) => {
    sayac[s.rol] = (sayac[s.rol] || 0) + 1;
    const coklu = sablonlar.filter(x => x.rol === s.rol).length > 1;
    const baslik = s.rol === 'oda' ? s.ad : (coklu ? sayac[s.rol] + '. ' : '') + s.ad;
    const on = 'katilimci.' + i + '.';
    const alan = (ad, etiket, ek) => '<label class="odm-field"><span>' + etiket + '</span>'
      + '<input name="' + on + ad + '" ' + (ek || '') + '>'
      + '<small class="odm-error" data-hata="' + on + ad + '"></small></label>';
    let yas = '';
    if (s.yas) {
      const secenek = [];
      for (let y = s.yas.alt; y <= s.yas.ust; y++) secenek.push('<option value="' + y + '">' + y + ' yaş</option>');
      yas = '<label class="odm-field odm-field-age"><span>Yaşı</span>'
        + '<select name="' + on + 'yas" data-fiyat-etkiler="' + (tip === 'hotel' ? '1' : '') + '">'
        + '<option value="">Seçin</option>' + secenek.join('') + '</select>'
        + '<small class="odm-hint">' + s.yas.alt + ' – ' + s.yas.ust + ' yaş</small>'
        + '<small class="odm-error" data-hata="' + on + 'yas"></small></label>';
    }
    const kimlik = s.kimlik
      ? '<div class="odm-id" data-kimlik="' + i + '">'
        + alan('tc', 'T.C. kimlik no', 'inputmode="numeric" autocomplete="off" maxlength="11" pattern="[0-9]*"')
        + '<label class="odm-field odm-passport" hidden><span>Pasaport no</span>'
        + '<input name="' + on + 'pasaport" autocomplete="off" maxlength="12">'
        + '<small class="odm-error" data-hata="' + on + 'pasaport"></small></label>'
        + '<label class="odm-check"><input type="checkbox" name="' + on + 'yabanci"><span>T.C. vatandaşı değilim</span></label>'
        + '</div>'
      : '';
    /* İlk kişi çoğu zaman rezervasyonu yapanın kendisi: "Bu kişi benim"
       işaretliyken ad ve soyad iletişim bilgilerinden yazılıyor, alanları
       gizli (form yarıya iniyor). İşaret kalkınca alanlar açılıyor. */
    const ben = (i === 0 && !s.adsiz)
      ? '<label class="odm-check odm-ben"><input type="checkbox" data-ben checked><span>Bu kişi benim (iletişim bilgilerimdeki ad ve soyad)</span></label>'
      : '';
    const adlar = s.adsiz ? ''
      : '<div class="odm-row"' + (i === 0 ? ' data-ben-adlar hidden' : '') + '>'
        + alan('ad', 'Ad', 'autocomplete="' + (i === 0 ? 'given-name' : 'off') + '" maxlength="50"')
        + alan('soyad', 'Soyad', 'autocomplete="' + (i === 0 ? 'family-name' : 'off') + '" maxlength="50"')
        + '</div>';
    return '<fieldset class="odm-person"><legend>' + odmKacis(baslik) + '</legend>'
      + ben + adlar + (yas ? '<div class="odm-row">' + yas + '</div>' : '') + kimlik + '</fieldset>';
  }).join('');
}

/* Ödeme planı: tamamı / kapora (+ kalan tercihi) ya da mekânda. */
function odmPlanMarkup(t, secenek, kapora) {
  const o = t.odeme;
  if (o.sekil === 'mekanda') {
    return '<p class="odm-info">Bu rezervasyonda ön ödeme yok. ' + odmKacis(odmPara(t.toplam))
      + ' tutarındaki ücret hizmetten sonra mekânda ödenir; şimdi kartınızdan çekim yapılmaz.</p>';
  }
  const radyo = (ad, deger, baslik, alt, secili) => '<label class="odm-option' + (secili ? ' is-selected' : '') + '">'
    + '<input type="radio" name="' + ad + '" value="' + deger + '"' + (secili ? ' checked' : '') + '>'
    + '<span class="odm-option-body"><strong>' + baslik + '</strong><span>' + alt + '</span></span></label>';
  let html = '<div class="odm-options" role="radiogroup" aria-label="Ödeme planı">'
    + radyo('odeme', 'tam', 'Tamamını öde', odmKacis(odmPara(t.toplam)) + ' şimdi', o.sekil === 'tam');
  if (o.kaporaUygun) {
    html += radyo('odeme', 'kapora', '%' + Math.round(o.kaporaOrani * 100) + ' kapora öde',
      odmKacis(odmPara(o.kaporaTutari)) + ' şimdi, kalan ' + odmKacis(odmPara(t.toplam - o.kaporaTutari)) + ' sonra',
      o.sekil === 'kapora');
  }
  html += '</div>';
  if (!o.kaporaUygun && o.kaporaNeden) html += '<p class="odm-hint-line">' + odmKacis(o.kaporaNeden) + '</p>';
  if (o.sekil === 'kapora' && kapora) {
    html += '<div class="odm-remaining"><p class="odm-subtitle">Kalan ' + odmKacis(odmPara(o.kalan)) + ' ne zaman ödensin?</p>'
      + '<div class="odm-options odm-options-compact" role="radiogroup" aria-label="Kalan ödeme">'
      + kapora.kalanSecenekleri.map(k => {
        const gunEkle = odmRez('rezGunEkle');
        const tarih = k.id === 'bir-gun-once' ? (gunEkle ? gunEkle(t.baslangic.tarih, -1) : '') : t.baslangic.tarih;
        return radyo('kalan', k.id, k.ad, odmKacis(odmTarih(tarih, true))
          + ' · ' + odmKacis(k.aciklama), o.kalanTercih === k.id);
      }).join('')
      + '</div><p class="odm-info">' + odmKacis(kapora.arama)
      + (o.aramaTarihi ? ' Arama günü: ' + odmKacis(odmTarih(o.aramaTarihi, true)) + '.' : '')
      + '</p></div>';
  }
  return html;
}

/* Kart ailesi ve taksit. secenek.aile boşsa tek çekim. */
function odmTaksitMarkup(t, aileler, secenek, altSinir, digerNot) {
  if (t.odeme.sekil === 'mekanda') return '';
  const aile = secenek.aile || '';
  const cip = (id, ad, alt) => '<button type="button" class="odm-chip' + (aile === id ? ' is-active' : '') + '" data-aile="' + id + '"'
    + ' aria-pressed="' + (aile === id ? 'true' : 'false') + '"><strong>' + odmKacis(ad) + '</strong>'
    + (alt ? '<span>' + odmKacis(alt) + '</span>' : '') + '</button>';
  let html = '<p class="odm-subtitle">Kartınızın ailesi</p><div class="odm-chips">'
    + aileler.map(a => cip(a.id, a.ad, a.banka)).join('')
    + cip('', 'Diğer', 'Banka kartı, yurt dışı') + '</div>';
  if (!t.taksit.uygun) {
    html += '<p class="odm-hint-line">' + odmKacis(odmPara(altSinir)) + ' altındaki ödemede taksit yapılmaz; tek çekim.</p>';
  } else if (!aile) {
    html += '<p class="odm-hint-line">' + odmKacis(digerNot) + ' Taksit için kart ailesini seçin.</p>';
  }
  const secilen = t.taksit.secilen.taksit;
  html += '<div class="odm-installments" role="radiogroup" aria-label="Taksit">'
    + t.taksit.secenekler.map(s => {
      const secili = s.taksit === secilen;
      const baslik = s.taksit === 1 ? 'Tek çekim' : s.taksit + ' taksit';
      const alt = s.taksit === 1 ? odmTL(s.toplam)
        : s.taksit + ' × ' + odmTL(s.aylik) + ' = ' + odmTL(s.toplam);
      const rozet = s.taksit > 1 && s.oran === 0 ? '<em class="odm-badge">Vade farksız</em>'
        : (s.oran > 0 ? '<em class="odm-badge odm-badge-muted">+%' + (s.oran * 100).toFixed(2).replace('.', ',') + '</em>' : '');
      return '<label class="odm-installment' + (secili ? ' is-selected' : '') + '">'
        + '<input type="radio" name="taksit" value="' + s.taksit + '"' + (secili ? ' checked' : '') + '>'
        + '<span class="odm-installment-name">' + baslik + '</span>'
        + '<span class="odm-installment-amount">' + alt + '</span>' + rozet + '</label>';
    }).join('') + '</div>';
  return html;
}

/* Bütün kart ailelerinin taksit tablosu (açılır bölüm). */
function odmTaksitTablosuMarkup(tablo) {
  if (!tablo || !tablo.uygun) return '';
  return '<details class="odm-table-wrap"><summary>Bütün kartların taksit tablosu</summary>'
    + '<div class="odm-table-scroll"><table class="odm-table"><thead><tr><th scope="col">Taksit</th>'
    + tablo.aileler.map(a => '<th scope="col">' + odmKacis(a.ad) + '</th>').join('') + '</tr></thead><tbody>'
    + tablo.sayilar.map((n, i) => '<tr><th scope="row">' + (n === 1 ? 'Tek çekim' : n + ' taksit') + '</th>'
      + tablo.aileler.map(a => {
        const h = a.hucreler[i];
        return '<td>' + (h ? (n === 1 ? odmTL(h.toplam) : odmTL(h.aylik) + '<small>' + odmTL(h.toplam) + '</small>') : '—') + '</td>';
      }).join('') + '</tr>').join('')
    + '</tbody></table></div></details>';
}

/* Sağdaki (mobilde üstteki) özet. Fiyat ayrıntısı ve iptal koşulları
   açılır bölümde: mobilde kapalı başlıyor (form aşağı itilmesin),
   masaüstünde açık. acik: bölümün başlangıç durumu. */
/* Ödeme adımında onaylatılan belgeler. Konaklamalı turda (paket tur)
   paket tur sözleşmesi de var (booking-engine.js, rezPaketTurMu). */
function odmBelgeleri(t) {
  const liste = [['on-bilgilendirme', 'Ön bilgilendirme formu'], ['mesafeli-satis-sozlesmesi', 'Mesafeli satış sözleşmesi']];
  if (t && t.paketTur) liste.push(['paket-tur-sozlesmesi', 'Paket tur sözleşmesi']);
  return liste;
}
function odmBelgeAdlariMetni(t) {
  return t && t.paketTur
    ? 'ön bilgilendirme formunu, mesafeli satış sözleşmesini ve paket tur sözleşmesini'
    : 'ön bilgilendirme formunu ve mesafeli satış sözleşmesini';
}

function odmOzetMarkup(t, kart, gorsel, acik) {
  const pb = t.paraBirimi;
  const satir = (ad, deger, sinif) => '<li' + (sinif ? ' class="' + sinif + '"' : '') + '><span>' + ad + '</span><strong>' + deger + '</strong></li>';
  const o = t.odeme;
  let html = '<div class="odm-summary-head">'
    + (kart && kart.img ? '<img src="' + odmKacis(gorsel(kart.img)) + '" alt="" loading="lazy">' : '')
    + '<div><span class="odm-type">' + odmKacis(ODM_TIP_ADI[t.tip] || '') + '</span>'
    + '<h2>' + odmKacis(t.baslik) + '</h2></div></div>'
    + '<details class="odm-more"' + (acik === false ? '' : ' open') + '><summary>Ayrıntılar ve iptal koşulları</summary>'
    + '<ul class="odm-facts">' + t.ozet.filter(x => x.deger).map(x => satir(odmKacis(x.ad), odmKacis(x.deger))).join('') + '</ul>'
    + '<ul class="odm-lines">'
    + t.satirlar.map(l => satir(odmKacis(l.label), l.kind === 'free' ? 'Dahil' : odmKacis(odmPara(l.amount, pb)))).join('');
  if (pb !== 'TRY' && t.kur) {
    html += satir('Toplam (' + odmKacis(pb) + ')', odmKacis(odmPara(t.araToplam, pb)))
      + satir('Kur: 1 ' + odmKacis(pb) + ' = ' + odmKacis(odmPara(t.kur.oran)), odmKacis(odmPara(t.araToplamTL)), 'odm-line-note');
  }
  t.indirimler.forEach(x => { html += satir(odmKacis(x.ad), '−' + odmKacis(odmPara(x.tutar)), 'odm-line-discount'); });
  html += '</ul>';
  if (t.iptal && t.iptal.length) {
    html += '<div class="odm-cancel"><h3>İptal koşulları</h3><ol>'
      + t.iptal.map((k, i) => {
        const zaman = k.sonAnMetni ? odmKacis(k.sonAnMetni) + '’e kadar' : (i === 0 ? 'Her zaman' : 'Sonrasında');
        const iade = o.sekil === 'mekanda' ? odmKacis(k.metin)
          : (k.iade > 0 ? 'Ödediğiniz ' + odmKacis(odmPara(o.simdi)) + ' içinden ' + odmKacis(odmPara(k.iade)) + ' iade' : 'İade yok');
        return '<li><strong>' + zaman + '</strong><span>' + iade + '</span></li>';
      }).join('') + '</ol>'
      + (o.sekil === 'kapora' ? '<p>Kaporalı rezervasyonda kesinti toplam tutar üzerinden hesaplanır; ödediğinizden fazlası istenmez.</p>' : '')
      + '</div>';
  }
  html += '</details><ul class="odm-totals">' + satir('Toplam', odmKacis(odmPara(t.toplam)), 'odm-total');
  if (o.sekil === 'kapora') {
    html += satir('Şimdi (%' + Math.round(o.kaporaOrani * 100) + ' kapora)', odmKacis(odmPara(o.simdi)))
      + satir('Kalan', odmKacis(odmPara(o.kalan)) + '<small>' + (o.kalanTercih === 'aracta' ? 'Tur günü araçta' : 'Turdan 1 gün önce')
        + (o.kalanTarihi ? ' · ' + odmKacis(odmTarih(o.kalanTarihi, true)) : '') + '</small>');
  } else if (o.sekil === 'mekanda') {
    html += satir('Şimdi', odmKacis(odmPara(0))) + satir('Mekânda', odmKacis(odmPara(o.kalan)));
  }
  if (t.taksit.vadeFarki > 0) html += satir('Vade farkı (' + t.taksit.secilen.taksit + ' taksit)', '+' + odmTL(t.taksit.vadeFarki));
  if (o.sekil !== 'mekanda') {
    html += satir('Karttan çekilecek', odmTL(t.tahsilat)
      + (t.taksit.secilen.taksit > 1 ? '<small>' + t.taksit.secilen.taksit + ' × ' + odmTL(t.taksit.secilen.aylik) + '</small>' : ''), 'odm-charge');
  }
  html += '</ul>';
  if (t.kontenjanDurumu && t.kontenjanDurumu.durum === 'az') {
    html += '<p class="odm-stock">Bu seçim için son ' + t.kontenjanDurumu.kalan + ' ' + odmKacis((t.kontenjan && t.kontenjan.birim) || 'yer') + '</p>';
  }
  return html;
}

/* Formu okuma: adlar "iletisim.ad", "katilimci.0.tc" … */
function odmFormOku(form) {
  const v = { iletisim: {}, katilimcilar: [], fatura: { tur: 'bireysel' }, not: '', sozlesme: false };
  if (!form) return v;
  Array.prototype.forEach.call(form.elements, el => {
    if (!el.name) return;
    const deger = el.type === 'checkbox' ? el.checked : el.value;
    if (el.type === 'radio' && !el.checked) return;
    const p = el.name.split('.');
    if (p[0] === 'iletisim') v.iletisim[p[1]] = deger;
    else if (p[0] === 'katilimci') {
      const n = Number(p[1]);
      v.katilimcilar[n] = v.katilimcilar[n] || {};
      v.katilimcilar[n][p[2]] = deger;
    } else if (p[0] === 'fatura') v.fatura[p[1]] = deger;
    else if (el.name === 'not') v.not = deger;
    else if (el.name === 'sozlesme') v.sozlesme = deger;
  });
  return v;
}

/* ---------------- üyelik ----------------
   Üyede iletişim alanları hesaptan doluyor ve kullanılabilir kuponlar
   çip olarak çıkıyor; misafire giriş önerisi. Kuponun geçerliliğine
   yine teklif karar veriyor (kapı üyelik bağlamını kendisi ekliyor). */
function odmOturum() {
  return (typeof MolaVeri !== 'undefined' && MolaVeri.oturum) ? MolaVeri.oturum() : null;
}
/* Misafir üye olursa bu rezervasyonda kazanacağı: yürürlükteki yeni üye
   kampanyasının (üyeye özel, ilk rezervasyon) oranı ve üst sınırı bu
   toplamdan. Kampanya yoksa 0; kod üyelikle hesaba düşüyor ve kupon
   çiplerinde çıkıyor, geçerliliğine yine teklif karar veriyor. */
function odmUyeKazanci(t, bugun) {
  if (!t || typeof MolaVeri === 'undefined' || !MolaVeri.kampanyalar) return 0;
  const k = MolaVeri.kampanyalar(bugun || new Date())
    .find(x => x.uyeOzel && x.ilkRezervasyon && x.indirim && Number(x.indirim.oran) > 0);
  if (!k) return 0;
  const tutar = Math.round((Number(t.toplam) || 0) * Number(k.indirim.oran));
  return k.indirim.enFazla ? Math.min(tutar, Number(k.indirim.enFazla)) : tutar;
}
function odmUyeSeridi(t, bugun) {
  const h = odmOturum();
  if (h) return '<p class="odm-member">' + odmKacis(h.ad) + ', bilgilerin hesabından yazıldı. Rezervasyon ve biletler Hesabım\'da görünecek.</p>';
  const kazanc = odmUyeKazanci(t, bugun);
  if (kazanc > 0) {
    return '<p class="odm-member odm-member-kazanc">Üye olursan bu rezervasyonda <strong>' + odmKacis(odmTL(kazanc)) + '</strong> indirim: '
      + 'yeni üyelere ilk rezervasyonda. <button type="button" class="odm-member-btn" data-giris="register">Ücretsiz üye ol</button> · '
      + '<button type="button" class="odm-member-btn" data-giris="login">Giriş yap</button></p>';
  }
  return '<p class="odm-member">Üye misin? <button type="button" class="odm-member-btn" data-giris="login">Giriş yap</button> ya da '
    + '<button type="button" class="odm-member-btn" data-giris="register">üye ol</button>: kişisel kuponların ve Molapuanın hesabına işlesin.</p>';
}
function odmKuponCipleri() {
  const h = odmOturum();
  const liste = (h && typeof hspKuponlar === 'function') ? hspKuponlar(h, new Date()).filter(k => k.kisisel && k.durum === 'gecerli') : [];
  if (!liste.length) return '';
  return '<div class="odm-coupon-chips"><span>Kuponların:</span>' + liste.map(k =>
    '<button type="button" class="odm-chip" data-kupon-cip="' + odmKacis(k.kod) + '"><strong>' + odmKacis(k.kod) + '</strong><span>' + odmKacis(k.ad) + '</span></button>').join('') + '</div>';
}
function odmUyeBilgileriniYaz(form) {
  const h = odmOturum();
  if (!h || !form) return;
  [['iletisim.ad', h.ad], ['iletisim.soyad', h.soyad], ['iletisim.eposta', h.eposta], ['iletisim.telefon', h.telefon],
    ['katilimci.0.ad', h.ad], ['katilimci.0.soyad', h.soyad]].forEach(([ad, deger]) => {
    const el = form.querySelector('[name="' + ad + '"]');
    if (el && !el.value && deger) el.value = deger;
  });
}

/* ---------------- ödeme ekranı ---------------- */
function odmKur(kok, bugun) {
  if (typeof document === 'undefined') return null;
  document.title = 'Ödeme — mola360';
  if (typeof lspMetaYaz === 'function') {
    lspMetaYaz({ title: 'Ödeme — mola360', description: 'Rezervasyon ve ödeme.', noindex: true, canonical: null });
  }
  const adres = MolaVeri.odemeAdresiOku(location.search);
  /* Ödeme adımında odak çubuğu: arama, menü ve alt menü yok; geri,
     güvenli ödeme notu ve WhatsApp desteği var (listing-page.js). */
  const mobil = (baslik, alt, geri) => (typeof lspMobilBaslikMarkup === 'function' ? lspMobilBaslikMarkup(baslik, alt, geri, { odak: true }) : '');
  if (!adres) {
    kok.innerHTML = mobil('Ödeme', 'mola360', '')
      + (typeof lspBosSayfaMarkup === 'function' ? lspBosSayfaMarkup({
        rozet: 'Ödeme',
        baslik: 'Seçili ürün yok',
        metin: 'Ödeme sayfası bir ürün sayfasından açılır. Tarih ve kişi sayısını seçip "Rezervasyon yap" deyin.',
        baglar: (typeof TAXONOMY_TYPES !== 'undefined')
          ? Object.keys(TAXONOMY_TYPES).map(t => ({ name: TAXONOMY_TYPES[t].plural, path: TAXONOMY_TYPES[t].base })) : []
      }) : '');
    return Promise.resolve(null);
  }

  const kayit = MolaVeri.urun(adres.tip, adres.slug);
  const urunYolu = (typeof TAXONOMY_TYPES !== 'undefined' && TAXONOMY_TYPES[adres.tip])
    ? TAXONOMY_TYPES[adres.tip].path + '/' + adres.slug : '';
  const kart = (typeof catalogRefCard === 'function') ? catalogRefCard(adres.tip + '/' + adres.slug, bugun) : null;
  const gorsel = (typeof homeBlockImage === 'function') ? homeBlockImage : (x => x);
  const kapora = (typeof REZ_KAPORA !== 'undefined') ? REZ_KAPORA : null;
  const taksitAyar = (typeof REZ_TAKSIT !== 'undefined') ? REZ_TAKSIT : { aileler: [], altSinir: 0, digerNot: '' };
  const secenek = { odeme: 'tam', kalan: kapora ? kapora.kalanSecenekleri[0].id : '', aile: '', taksit: 1, kupon: '', cocukYaslari: [] };
  let teklif = null;
  let denendi = false;
  let sira = 0;

  kok.innerHTML = mobil('Ödeme', kayit ? kayit.title : '', urunYolu)
    + '<main class="odm-page" id="odmPage">'
    + (typeof lspKirintiMarkup === 'function' ? lspKirintiMarkup([{ name: 'Anasayfa', path: '' },
      { name: kayit ? kayit.title : '', path: urunYolu }, { name: 'Ödeme', path: 'rezervasyon' }]) : '')
    + '<h1 class="odm-title">Rezervasyonu tamamla</h1>'
    + '<ol class="odm-steps" aria-label="Adımlar"><li class="is-done">Seçim</li><li class="is-current" aria-current="step">Bilgiler ve ödeme</li><li>Onay</li></ol>'
    + '<div class="odm-layout"><div class="odm-main" id="odmMain"><p class="odm-loading">Fiyat hesaplanıyor…</p></div>'
    + '<aside class="odm-summary" id="odmSummary" aria-label="Rezervasyon özeti"></aside></div>'
    + '</main>'
    + '<div class="odm-bar" id="odmBar" hidden></div>';
  const ana = document.getElementById('odmMain');
  const ozet = document.getElementById('odmSummary');
  const bar = document.getElementById('odmBar');

  function hataCiz(hatalar) {
    const form = document.getElementById('odmForm');
    if (!form) return;
    form.querySelectorAll('[data-hata]').forEach(el => { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    const genel = [];
    hatalar.forEach(h => {
      const yer = h.alan ? form.querySelector('[data-hata="' + h.alan + '"]') : null;
      const girdi = h.alan ? form.querySelector('[name="' + h.alan + '"]') : null;
      if (yer) yer.textContent = h.mesaj; else genel.push(h.mesaj);
      if (girdi) girdi.setAttribute('aria-invalid', 'true');
    });
    const kutu = document.getElementById('odmErrors');
    kutu.hidden = !genel.length;
    kutu.innerHTML = genel.map(m => '<p>' + odmKacis(m) + '</p>').join('');
    return hatalar;
  }

  function dogrula() {
    const formHatalari = odmRez('rezFormHatalari');
    if (!teklif || !formHatalari) return [];
    return hataCiz(formHatalari(teklif, odmFormOku(document.getElementById('odmForm'))));
  }

  function dinamikCiz() {
    const plan = document.getElementById('odmPlan');
    const taksit = document.getElementById('odmTaksit');
    if (plan) plan.innerHTML = odmPlanMarkup(teklif, secenek, kapora);
    if (taksit) {
      taksit.innerHTML = odmTaksitMarkup(teklif, taksitAyar.aileler, secenek, taksitAyar.altSinir, taksitAyar.digerNot)
        + odmTaksitTablosuMarkup(MolaVeri.taksitTablosu(teklif.odeme.simdi));
      taksit.closest('section').hidden = teklif.odeme.sekil === 'mekanda';
    }
    const kupon = document.getElementById('odmKuponMesaj');
    if (kupon) {
      kupon.textContent = teklif.kupon ? teklif.kupon.mesaj : '';
      kupon.className = 'odm-coupon-msg' + (teklif.kupon ? (teklif.kupon.gecerli ? ' is-ok' : ' is-bad') : '');
    }
    const eski = ozet.querySelector('.odm-more');
    const acik = eski ? eski.open : !(window.matchMedia && window.matchMedia('(max-width: 1024px)').matches);
    ozet.innerHTML = odmOzetMarkup(teklif, kart, gorsel, acik);
    /* Ön bilgilendirme ve sözleşme rezervasyonun kendi bilgileriyle
       (corporate-page.js); tutar ya da plan değişince yeniden yazılıyor.
       Açık olan bölüm açık kalıyor. */
    const belgeler = document.getElementById('odmBelgeler');
    if (belgeler && typeof krsSozlesmeMarkup === 'function') {
      const acikBelgeler = Array.from(belgeler.querySelectorAll('details[open]')).map(d => d.getAttribute('data-belge'));
      belgeler.innerHTML = odmBelgeleri(teklif)
        .map(([slug, ad]) => '<details class="odm-doc" data-belge="' + slug + '"' + (acikBelgeler.indexOf(slug) !== -1 ? ' open' : '') + '><summary>' + ad + '</summary>'
          + krsSozlesmeMarkup(slug, teklif) + '</details>').join('');
    }
    const onayAdlari = document.getElementById('odmBelgeAdlari');
    if (onayAdlari) onayAdlari.textContent = odmBelgeAdlariMetni(teklif);
    const tutar = teklif.odeme.sekil === 'mekanda' ? 'Rezervasyonu tamamla' : 'Ödemeye geç · ' + odmTL(teklif.tahsilat);
    const dugme = document.getElementById('odmSubmit');
    if (dugme) dugme.textContent = tutar;
    bar.hidden = false;
    bar.innerHTML = '<div class="odm-bar-amount"><span>' + (teklif.odeme.sekil === 'mekanda' ? 'Şimdi ödenecek' : 'Karttan çekilecek')
      + '</span><strong>' + (teklif.odeme.sekil === 'mekanda' ? odmTL(0) : odmTL(teklif.tahsilat)) + '</strong></div>'
      + '<button type="submit" form="odmForm" class="btn-primary odm-bar-btn">' + (teklif.odeme.sekil === 'mekanda' ? 'Tamamla' : 'Ödemeye geç') + '</button>';
  }

  function formCiz() {
    const t = teklif;
    const kurNotu = t.paraBirimi !== 'TRY' && t.kur
      ? '<p class="odm-info">Fiyat ' + odmKacis(t.paraBirimi) + ' cinsinden; tahsilat TL. Kur (1 ' + odmKacis(t.paraBirimi) + ' = '
        + odmKacis(odmPara(t.kur.oran)) + ') rezervasyonla sabitlenir, kalan ödeme de bu kurla.</p>' : '';
    ana.innerHTML = '<form class="odm-form" id="odmForm" novalidate>'
      + '<div class="odm-errors" id="odmErrors" role="alert" hidden></div>'
      + odmUyeSeridi(t, bugun)
      + '<section class="odm-card"><h2>İletişim bilgileri</h2>'
      + '<p class="odm-lead">Rezervasyon onayı ve bilet bu adrese gönderilir.</p>'
      + '<div class="odm-row">'
      + '<label class="odm-field"><span>Ad</span><input name="iletisim.ad" autocomplete="given-name" maxlength="50" required><small class="odm-error" data-hata="iletisim.ad"></small></label>'
      + '<label class="odm-field"><span>Soyad</span><input name="iletisim.soyad" autocomplete="family-name" maxlength="50" required><small class="odm-error" data-hata="iletisim.soyad"></small></label>'
      + '</div><div class="odm-row">'
      + '<label class="odm-field"><span>E-posta</span><input name="iletisim.eposta" type="email" autocomplete="email" maxlength="120" required><small class="odm-error" data-hata="iletisim.eposta"></small></label>'
      + '<label class="odm-field"><span>Cep telefonu</span><input name="iletisim.telefon" type="tel" autocomplete="tel" inputmode="tel" placeholder="5xx xxx xx xx" maxlength="20" required><small class="odm-error" data-hata="iletisim.telefon"></small></label>'
      + '</div></section>'
      + '<section class="odm-card"><h2>' + odmKacis(ODM_KATILIMCI_BASLIK[t.tip] || 'Katılımcılar') + '</h2>'
      + (t.tip === 'tour' ? '<p class="odm-lead">Yolcu listesi ve seyahat sigortası için. Yetişkinlerde kimlik numarası gerekli.</p>' : '')
      + (t.tip === 'hotel' && kayit && kayit.pricing && Number.isFinite(Number(kayit.pricing.freeChildMaxAge))
        ? '<p class="odm-lead">0 – ' + kayit.pricing.freeChildMaxAge + ' yaş çocuklar pansiyon farkı ödemez; yaşı seçince tutar güncellenir.</p>' : '')
      + odmKatilimciMarkup(t.katilimcilar, t.tip) + '</section>'
      + '<section class="odm-card"><h2>Ödeme planı</h2>' + kurNotu + '<div id="odmPlan"></div></section>'
      + '<section class="odm-card"><h2>Kart ve taksit</h2><div id="odmTaksit"></div>'
      + '<p class="odm-secure">Kart bilgileri bir sonraki adımda bankanın 3D Secure sayfasında girilir; mola360 kart numaranızı görmez ve saklamaz.'
      + (taksitAyar.ornek ? ' Taksit oranları örnektir, banka anlaşmalarıyla güncellenecek.' : '') + '</p></section>'
      /* Kupon alanı bağın arkasında: hep açık alan, kodu olmayanı kod
         aramaya gönderip sayfadan çıkarabiliyor. Üyenin kuponu varsa ya da
         bir kod girilmişse açık. */
      + '<section class="odm-card odm-coupon-card"><details class="odm-coupon-toggle"'
      + (secenek.kupon || odmKuponCipleri() ? ' open' : '') + '><summary>Kupon kodun var mı?</summary><div class="odm-coupon">'
      + '<label class="odm-field"><span class="lst-visually-hidden">Kupon kodu</span><input id="odmKupon" placeholder="Kupon kodu" autocomplete="off" maxlength="20" value="' + odmKacis(secenek.kupon || '') + '"></label>'
      + '<button type="button" class="odm-coupon-btn" id="odmKuponUygula">Uygula</button></div>'
      + '<p class="odm-coupon-msg" id="odmKuponMesaj" role="status"></p>' + odmKuponCipleri() + '</details></section>'
      + '<section class="odm-card"><h2>Fatura</h2><div class="odm-options odm-options-compact odm-invoice" role="radiogroup" aria-label="Fatura türü">'
      + '<label class="odm-option is-selected"><input type="radio" name="fatura.tur" value="bireysel" checked><span class="odm-option-body"><strong>Bireysel</strong><span>İletişim bilgilerinize</span></span></label>'
      + '<label class="odm-option"><input type="radio" name="fatura.tur" value="kurumsal"><span class="odm-option-body"><strong>Kurumsal</strong><span>Firma adına</span></span></label>'
      + '</div><div class="odm-corporate" id="odmKurumsal" hidden><div class="odm-row">'
      + '<label class="odm-field"><span>Firma unvanı</span><input name="fatura.unvan" maxlength="120" autocomplete="organization"><small class="odm-error" data-hata="fatura.unvan"></small></label>'
      + '</div><div class="odm-row">'
      + '<label class="odm-field"><span>Vergi dairesi</span><input name="fatura.vergiDairesi" maxlength="60"><small class="odm-error" data-hata="fatura.vergiDairesi"></small></label>'
      + '<label class="odm-field"><span>Vergi no</span><input name="fatura.vergiNo" inputmode="numeric" maxlength="11"><small class="odm-error" data-hata="fatura.vergiNo"></small></label>'
      + '</div></div>'
      + '<label class="odm-field"><span>Özel istek (isteğe bağlı)</span><textarea name="not" rows="2" maxlength="500" placeholder="Ör. vejetaryen menü, bebek koltuğu"></textarea></label>'
      + '</section>'
      + '<section class="odm-card odm-confirm">'
      + '<div class="odm-docs" id="odmBelgeler"></div>'
      + '<label class="odm-check"><input type="checkbox" name="sozlesme"><span>Yukarıdaki <span id="odmBelgeAdlari">' + odmKacis(odmBelgeAdlariMetni(teklif)) + '</span> okudum, onaylıyorum. <a href="kurumsal/iptal-iade/" target="_blank" rel="noopener">İptal ve iade koşulları</a>'
      + ' ve <a href="kurumsal/kvkk/" target="_blank" rel="noopener">kişisel verilerin işlenmesi</a> hakkında bilgilendirildim.</span></label>'
      + '<small class="odm-error" data-hata="sozlesme"></small>'
      + '<p class="odm-demo">Deneme sürümü: ödeme altyapısı henüz bağlı değil. Bu düğme rezervasyon talebini oluşturur; kartınızdan çekim yapılmaz.</p>'
      + '<button type="submit" class="btn-primary odm-submit" id="odmSubmit">Ödemeye geç</button>'
      + '</section></form>';

    const form = document.getElementById('odmForm');
    odmUyeBilgileriniYaz(form);
    /* "Bu kişi benim" işaretliyken iletişimdeki ad ve soyad ilk kişiye
       yazılıyor; işaret kalkınca ilk kişinin alanları boş açılıyor. */
    const ben = form.querySelector('[data-ben]');
    const benYaz = () => {
      if (!ben || !ben.checked) return;
      ['ad', 'soyad'].forEach(k => {
        const hedef = form.querySelector('[name="katilimci.0.' + k + '"]');
        const kaynak = form.querySelector('[name="iletisim.' + k + '"]');
        if (hedef && kaynak) hedef.value = kaynak.value;
      });
    };
    benYaz();
    form.addEventListener('input', (e) => {
      const ad = e.target.name || '';
      if (ad === 'iletisim.ad' || ad === 'iletisim.soyad') benYaz();
      if (denendi) dogrula();
    });
    form.addEventListener('change', (e) => {
      const el = e.target;
      if (el.hasAttribute('data-ben')) {
        const alanlar = form.querySelector('[data-ben-adlar]');
        if (alanlar) alanlar.hidden = el.checked;
        if (el.checked) benYaz();
        else {
          ['ad', 'soyad'].forEach(k => { const h = form.querySelector('[name="katilimci.0.' + k + '"]'); if (h) h.value = ''; });
          const ilk = form.querySelector('[name="katilimci.0.ad"]');
          if (ilk) ilk.focus();
        }
      }
      if (el.name === 'odeme') { secenek.odeme = el.value; yenile(); }
      if (el.name === 'kalan') { secenek.kalan = el.value; yenile(); }
      if (el.name === 'taksit') { secenek.taksit = Number(el.value) || 1; yenile(); }
      if (el.name === 'fatura.tur') {
        document.getElementById('odmKurumsal').hidden = el.value !== 'kurumsal';
        form.querySelectorAll('.odm-invoice .odm-option').forEach(o => o.classList.toggle('is-selected', o.querySelector('input').checked));
      }
      if (/^katilimci\.\d+\.yabanci$/.test(el.name)) {
        const kutu = el.closest('.odm-id');
        kutu.querySelector('.odm-passport').hidden = !el.checked;
        kutu.querySelector('[name$=".tc"]').closest('.odm-field').hidden = el.checked;
      }
      if (el.getAttribute('data-fiyat-etkiler') === '1') {
        secenek.cocukYaslari = t.katilimcilar.map((s, i) => s.yas ? form.querySelector('[name="katilimci.' + i + '.yas"]').value : null)
          .filter(x => x !== null).map(x => x === '' ? '' : Number(x));
        yenile();
      }
      if (denendi) dogrula();
    });
    ana.addEventListener('click', (e) => {
      const cip = e.target.closest('[data-aile]');
      if (cip) {
        secenek.aile = cip.getAttribute('data-aile');
        if (!secenek.aile) secenek.taksit = 1;
        yenile();
      }
      const kuponCip = e.target.closest('[data-kupon-cip]');
      if (kuponCip) {
        document.getElementById('odmKupon').value = kuponCip.getAttribute('data-kupon-cip');
        secenek.kupon = kuponCip.getAttribute('data-kupon-cip');
        yenile();
        return;
      }
      const girisBtn = e.target.closest('[data-giris]');
      if (girisBtn && typeof openAuthModal === 'function') { openAuthModal(girisBtn.getAttribute('data-giris')); return; }
      if (e.target.closest('#odmKuponUygula')) {
        secenek.kupon = document.getElementById('odmKupon').value.trim();
        yenile();
      }
    });
    document.getElementById('odmKupon').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('odmKuponUygula').click(); }
    });
    form.addEventListener('submit', gonder);
  }

  function gonder(e) {
    e.preventDefault();
    denendi = true;
    const form = document.getElementById('odmForm');
    const hatalar = dogrula();
    if (hatalar.length) {
      const ilk = hatalar.find(h => h.alan && form.querySelector('[name="' + h.alan + '"]'));
      if (ilk) form.querySelector('[name="' + ilk.alan + '"]').focus();
      else document.getElementById('odmErrors').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const dugmeler = document.querySelectorAll('#odmSubmit, .odm-bar-btn');
    dugmeler.forEach(d => { d.disabled = true; });
    MolaVeri.rezervasyonOlustur({
      tip: adres.tip, slug: adres.slug, secim: adres.secim, secenek: Object.assign({}, secenek),
      form: odmFormOku(form), beklenenTahsilat: teklif.tahsilat, bugun
    }).then(sonuc => {
      if (sonuc.tamam) {
        location.href = 'rezervasyon/onay/?kod=' + encodeURIComponent(sonuc.kod);
        return;
      }
      dugmeler.forEach(d => { d.disabled = false; });
      if (sonuc.teklif) { teklif = sonuc.teklif; if (teklif.satilabilir) dinamikCiz(); }
      hataCiz(sonuc.hatalar);
      document.getElementById('odmErrors').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function engelCiz(t) {
    ana.innerHTML = '<section class="odm-card odm-blocked" role="alert"><h2>Bu seçimle devam edilemiyor</h2>'
      + (t.hatalar || []).map(m => '<p>' + odmKacis(m) + '</p>').join('')
      + '<a class="btn-primary odm-back" href="' + odmHref(urunYolu) + '">Ürün sayfasına dön</a></section>';
    if (t.hesap) ozet.innerHTML = odmOzetMarkup(Object.assign({ indirimler: [], odeme: { sekil: 'tam' }, taksit: { vadeFarki: 0, secilen: { taksit: 1 } }, iptal: [] }, t), kart, gorsel);
    bar.hidden = true;
  }

  /* Giriş/çıkış olunca form üye bilgileri ve kuponlarıyla yeniden kurulur. */
  window.addEventListener('mola360:oturum', () => { teklif = null; yenile(); });

  function yenile() {
    const benim = ++sira;
    return MolaVeri.fiyatTeklifi(adres.tip, adres.slug, adres.secim, secenek, bugun).then(t => {
      if (benim !== sira) return t;
      const ilk = !teklif;
      teklif = t;
      if (!t.satilabilir) { engelCiz(t); return t; }
      /* Seçenek motorun düzelttiği hâline çekiliyor (uygun olmayan
         kapora, ailesinde olmayan taksit). */
      secenek.odeme = t.odeme.sekil === 'kapora' ? 'kapora' : 'tam';
      secenek.taksit = t.taksit.secilen.taksit;
      if (ilk || !document.getElementById('odmForm')) formCiz();
      dinamikCiz();
      return t;
    });
  }
  return yenile();
}

/* ---------------- onay ekranı ---------------- */
/* Rezervasyonun iptal kademeleri (ilk sürümün kayıtlarında "iptal"). */
function odmIptalKosullari(r) {
  if (Array.isArray(r.iptalKosullari)) return r.iptalKosullari;
  return Array.isArray(r.iptal) ? r.iptal : [];
}
function odmOnayMarkup(r) {
  const o = r.odeme || {};
  const satir = (ad, deger) => '<li><span>' + ad + '</span><strong>' + deger + '</strong></li>';
  const tarih = (iso) => odmTarih(iso, true);
  const yol = (typeof TAXONOMY_TYPES !== 'undefined' && TAXONOMY_TYPES[r.tip]) ? TAXONOMY_TYPES[r.tip].path + '/' + r.slug : '';
  let plan = '';
  if (o.sekil === 'kapora') {
    plan = satir('Kapora (%' + Math.round((o.kaporaOrani || 0) * 100) + ')', odmKacis(odmPara(o.simdi)))
      + satir('Kalan', odmKacis(odmPara(o.kalan)) + '<small>' + (o.kalanTercih === 'aracta' ? 'Tur günü araçta' : 'Turdan 1 gün önce')
        + (o.kalanTarihi ? ' · ' + odmKacis(tarih(o.kalanTarihi)) : '') + '</small>');
  } else if (o.sekil === 'mekanda') {
    plan = satir('Ödeme', 'Mekânda · ' + odmKacis(odmPara(o.kalan)));
  } else {
    plan = satir('Ödeme', 'Tamamı · ' + odmKacis(odmPara(o.simdi)));
  }
  const tk = (r.taksit && r.taksit.secilen) || { taksit: 1 };
  if (o.sekil !== 'mekanda') {
    plan += satir('Karttan çekilecek', odmTL(r.tahsilat) + (tk.taksit > 1 ? '<small>' + tk.taksit + ' × ' + odmTL(tk.aylik) + '</small>' : ''));
  }
  const kisiler = (r.katilimcilar || []).filter(k => k.ad || k.yas !== null)
    .map(k => '<li>' + odmKacis([k.ad, k.soyad].filter(Boolean).join(' ') || 'Çocuk') + (k.yas !== null && k.yas !== undefined ? ' · ' + k.yas + ' yaş' : '') + '</li>').join('');
  return '<section class="odm-done">'
    + '<span class="odm-done-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>'
    + '<h1>Rezervasyon talebiniz alındı</h1>'
    + '<p class="odm-code">Rezervasyon kodu <strong>' + odmKacis(r.kod) + '</strong></p>'
    + '<p class="odm-demo">Deneme sürümü: ödeme altyapısı henüz bağlı değil. Kartınızdan çekim yapılmadı; bu rezervasyon yalnızca bu tarayıcıda deneme kaydı olarak duruyor.</p>'
    + '</section>'
    + '<div class="odm-layout odm-layout-done"><div class="odm-main">'
    + '<section class="odm-card"><h2>' + odmKacis(r.baslik) + '</h2><ul class="odm-facts">'
    + (r.ozet || []).filter(x => x.deger).map(x => satir(odmKacis(x.ad), odmKacis(x.deger))).join('') + '</ul></section>'
    + '<section class="odm-card"><h2>Ödeme</h2><ul class="odm-totals">'
    + satir('Toplam', odmKacis(odmPara(r.toplam)))
    + (r.indirimler || []).map(x => satir(odmKacis(x.ad), '−' + odmKacis(odmPara(x.tutar)))).join('')
    + plan + '</ul>'
    + (o.sekil === 'kapora' && typeof REZ_KAPORA !== 'undefined'
      ? '<p class="odm-info">' + odmKacis(REZ_KAPORA.arama) + (o.aramaTarihi ? ' Arama günü: ' + odmKacis(tarih(o.aramaTarihi)) + ', ' + odmKacis((r.iletisim || {}).telefon || '') + '.' : '') + '</p>'
      : '')
    + (r.kur ? '<p class="odm-info">Kur rezervasyonla sabitlendi: 1 ' + odmKacis(r.paraBirimi) + ' = ' + odmKacis(odmPara(r.kur.oran)) + '.</p>' : '')
    + '</section>'
    + (kisiler ? '<section class="odm-card"><h2>Katılımcılar</h2><ul class="odm-people">' + kisiler + '</ul></section>' : '')
    + '<section class="odm-card"><h2>Sırada ne var</h2><ol class="odm-next">'
    + '<li>Onay e-postası <strong>' + odmKacis((r.iletisim || {}).eposta || '') + '</strong> adresine gider.</li>'
    + '<li>Ödeme tamamlanınca bilet ya da voucher e-postanıza ve hesabınıza düşer.</li>'
    + (o.sekil === 'kapora' ? '<li>Kalkıştan bir gün önce kalan ödeme için sizi arıyoruz.</li>' : '')
    + '</ol></section>'
    + '</div><aside class="odm-summary">'
    + (odmIptalKosullari(r).length ? '<div class="odm-cancel"><h3>İptal koşulları</h3><ol>'
      + odmIptalKosullari(r).map((k, i) => '<li><strong>' + (k.sonAnMetni ? odmKacis(k.sonAnMetni) + '’e kadar' : (i === 0 ? 'Her zaman' : 'Sonrasında'))
        + '</strong><span>' + (o.sekil === 'mekanda' ? odmKacis(k.metin) : (k.iade > 0 ? odmKacis(odmPara(k.iade)) + ' iade' : 'İade yok')) + '</span></li>').join('')
      + '</ol></div>' : '')
    + (odmOturum()
      ? '<p class="odm-info">Rezervasyon ve biletler <a href="hesabim/?bolum=rezervasyonlarim">Hesabım</a> sayfanda.</p>'
      : '<p class="odm-info">Bu e-postayla üye olursan rezervasyon hesabında görünür. <button type="button" class="odm-member-btn" data-giris="register">Üye ol</button></p>')
    + '<div class="odm-done-actions">'
    + (yol ? '<a class="odm-coupon-btn" href="' + odmHref(yol) + '">Ürün sayfası</a>' : '')
    + '<button type="button" class="odm-coupon-btn" data-yazdir>Yazdır</button>'
    + '<a class="btn-primary odm-back" href="./">Anasayfaya dön</a></div>'
    + '</aside></div>';
}

function odmOnayKur(kok) {
  if (typeof document === 'undefined') return null;
  if (typeof lspMetaYaz === 'function') {
    lspMetaYaz({ title: 'Rezervasyon onayı — mola360', description: 'Rezervasyon onayı.', noindex: true, canonical: null });
  }
  const m = String(location.search).match(/[?&]kod=([^&#]*)/);
  let kod = m ? m[1] : '';
  try { kod = decodeURIComponent(kod); } catch (_) { /* olduğu gibi */ }
  const mobil = (typeof lspMobilBaslikMarkup === 'function') ? lspMobilBaslikMarkup('Rezervasyon', kod || 'mola360', '') : '';
  return MolaVeri.rezervasyon(kod).then(r => {
    if (!r) {
      kok.innerHTML = mobil + (typeof lspBosSayfaMarkup === 'function' ? lspBosSayfaMarkup({
        rozet: 'Rezervasyon',
        baslik: 'Rezervasyon bulunamadı',
        metin: 'Deneme rezervasyonları yalnızca oluşturuldukları tarayıcıda görünür. Kodu kontrol edin ya da destek hattını arayın.',
        baglar: []
      }) : '');
      return null;
    }
    kok.innerHTML = mobil + '<main class="odm-page" id="odmPage">'
      + '<ol class="odm-steps" aria-label="Adımlar"><li class="is-done">Seçim</li><li class="is-done">Bilgiler ve ödeme</li><li class="is-current" aria-current="step">Onay</li></ol>'
      + odmOnayMarkup(r) + '</main>';
    const yazdir = kok.querySelector('[data-yazdir]');
    if (yazdir) yazdir.addEventListener('click', () => window.print());
    kok.addEventListener('click', (e) => {
      const giris = e.target.closest('[data-giris]');
      if (giris && typeof openAuthModal === 'function') openAuthModal(giris.getAttribute('data-giris'));
    });
    return r;
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ODM_TIP_ADI, odmKacis, odmTL, odmKatilimciMarkup, odmPlanMarkup, odmTaksitMarkup,
    odmTaksitTablosuMarkup, odmOzetMarkup, odmOnayMarkup, odmBelgeleri, odmBelgeAdlariMetni,
    odmUyeKazanci
  };
}
