/* ---------------- mekân içerik sayfası: işaretleme ve etkileşimler ----------------
   Veri ve saf hesaplar venue-data.js'te; bu dosya onları işaretlemeye
   çevirir. Buraya sayfada görünen metin yazılmaz.

   Ortak olanlar tekrar yazılmadı: biçimlendirme/tarih/iade/puan
   hesapları ve ikon seti tour-data.js'ten, görsel kabuk tour.css'ten
   (docs/otel-sayfasi.md).

   TEK SAYFA İKİ REZERVASYON MODELİNE hizmet ediyor — tour-page.js'in
   daily/stay ayrımıyla aynı yaklaşım:

     masa     gün + saat + ALAN + kişi   -> kapora ödenir
     randevu  gün + saat + HİZMET + kişi -> mekânda ödenir

   Ayrım kaydın `booking` alanında; ortak olan her şey (galeri, künye,
   saatler, konum, kurallar, yorumlar, SSS) tek kod yolundan geçiyor. */
(function () {

  /* Kayıt veri kapısından (docs/veri-sozlesmesi.md); yayında olmayan veya
     bilinmeyen mekân null. */
  const place = MolaVeri.urun('venue', venueSlugFromPath(window.location.pathname));
  if (!place) return;

  const randevu = place.booking === 'randevu';
  const KOK = (document.body && document.body.getAttribute('data-root')) || '';

  /* Bölüm menüsü: sayfada karşılığı OLMAYAN kayıt listeden düşüyor.
     Masa modelinde "Alanlar" ve "Menü", randevu modelinde "Hizmetler"
     bölümü var; ikisi de aynı listeden besleniyor. */
  const TUM_SECTIONS = [
    { id: 'genel-bakis', label: 'Genel Bakış' },
    { id: 'alanlar',     label: 'Alanlar' },
    { id: 'hizmetler',   label: 'Hizmetler' },
    { id: 'menu',        label: 'Menü' },
    { id: 'saatler',     label: 'Saatler' },
    { id: 'konum',       label: 'Konum' },
    { id: 'bilgiler',    label: 'Kurallar' },
    { id: 'yorumlar',    label: 'Yorumlar' },
    { id: 'sss',         label: 'SSS' }
  ];
  const SECTIONS = TUM_SECTIONS.filter(sec => document.getElementById(sec.id));

  const GALLERY_WIDTHS = { hero: 1200, thumb: 600, full: 1600 };
  const REVIEWS_STEP = 3;
  const DATE_CHIPS_SHORT = 6;
  const DATE_CHIPS_ALL = 14;

  const p = place.pricing;
  const puan = ratingSummary(place.ratingBreakdown);
  const temelFiyat = venuePriceFrom(place);
  const birimNot = venuePriceUnit(place);
  const tarihler = nextDepartureDates(new Date(), [], DATE_CHIPS_ALL, p.leadDays);

  /* Mekânın kapalı olduğu gün (ör. spa pazar kapalı). */
  const kapaliGun = (iso) => {
    const gun = asDate(iso);
    const kayit = gun ? venueHoursFor(place, gun.getDay()) : null;
    return !!(kayit && kayit.closed);
  };

  const state = {
    /* Varsayılan gün ilk AÇIK gün. Önceki sürüm ilk günü seçiyordu; bugün
       kapalı günse çip pasif görünürken rezervasyon o güne kuruluyordu. */
    date: tarihler.find(iso => !kapaliGun(iso)) || tarihler[0] || '',
    slot: '',
    option: venueOptions(place)[0].id,
    guests: 2,
    addons: [],
    allDates: false,
    favorite: false,
    reviewStar: 0,
    reviewsShown: REVIEWS_STEP,
    photo: 0
  };
  state.slot = venueSlot(place, state.date, '');

  /* Kontenjan canlı sorgu (sözleşme bölüm 6): cevap gelene kadar null,
     kalan yer satırları gizli, satış açık. Birim alan/hizmet × seans. */
  let musaitlik = null;
  let satisEngeli = null;
  const secenekKalan = (secenekId) => {
    const r = musaitlikKaydi(musaitlik, secenekId, state.date, state.slot);
    return r ? r.remaining : null;
  };

  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));
  const ic = (name) => '<span class="icon">' + tourSvg(name) + '</span>';

  const whatsappIkon = () =>
    '<span class="icon tour-wa-icon"><svg aria-hidden="true" focusable="false"'
    + ' viewBox="0 0 24 24"><path d="' + WHATSAPP_ICON_PATH + '"/></svg></span>';

  function destekDurumu() {
    const acik = supportOnline(new Date(), CONTACT.whatsappOpenHour, CONTACT.whatsappCloseHour);
    const metin = acik
      ? 'Çevrimiçi'
      : `Şu an kapalı · ${String(CONTACT.whatsappOpenHour).padStart(2, '0')}:00'da açılır`;
    return `<span class="tour-durum${acik ? ' is-acik' : ''}">`
         + `<i aria-hidden="true"></i>${metin}</span>`;
  }

  function fill(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
    return el;
  }

  /* ---------------- galeri ---------------- */
  function galleryMarkup() {
    const foto = place.gallery;
    const kalan = Math.max(0, foto.length - 5);
    return `
      <div class="tour-gallery-grid" role="group" aria-label="Mekân fotoğrafları">
        ${foto.map((item, i) => `
          <button class="tour-gallery-cell${i >= 5 ? ' is-extra' : ''}" type="button"
                  data-photo="${i}" aria-label="${item.caption} — büyüt">
            <img src="${venueImage(item.key, i === 0 ? GALLERY_WIDTHS.hero : GALLERY_WIDTHS.thumb)}"
                 alt="${item.caption}"${i === 0 ? '' : ' loading="lazy"'}>
            ${i === 4 && kalan ? `<span class="tour-gallery-more">${ic('image')}+${kalan} fotoğraf</span>` : ''}
          </button>`).join('')}
      </div>
      <div class="tour-gallery-actions">
        <button class="tour-gallery-fav" type="button" id="tourGalleryFav"
                aria-pressed="false" aria-label="Favorilere ekle">${ic('heart')}</button>
        <button class="tour-gallery-share" type="button" id="tourGalleryShare"
                aria-label="Mekânı paylaş">${ic('share')}</button>
      </div>
      <span class="tour-gallery-count" id="tourGalleryCount" aria-hidden="true"></span>
      <button class="tour-gallery-all" type="button" data-photo="0">
        ${ic('camera')}Tüm fotoğraflar<span class="count">${foto.length}</span>
      </button>`;
  }

  function headlineMarkup() {
    return `
      <div class="tour-head-row">
        <div class="tour-head-chips">
          <span class="tour-chip solid">${place.categoryShort}</span>
          <span class="tour-chip mkn-fiyat-chip" aria-label="Fiyat aralığı">${place.priceLevel}</span>
          ${place.badges.map(b => `<span class="tour-chip">${ic(b.icon)}${b.label}</span>`).join('')}
        </div>
      </div>`;
  }

  /* Mekânın en çok sorulan bilgisi "şu an açık mı": künyede ilk sırada
     ve saat saat değişen tek satır bu. Kapalıyken bir sonraki açılış
     yazıyor — "kapalı" demek tek başına işe yaramıyor. */
  function headMetaMarkup() {
    const durum = venueOpenNow(place, new Date());
    return `
      <a class="tour-head-rating" href="#yorumlar">
        <span class="tour-head-score">${ic('star')}${String(puan.average).replace('.', ',')}</span>
        <span class="tour-head-count">${formatNumberTR(puan.total)} değerlendirme</span>
      </a>
      <span class="mkn-durum${durum.open ? ' is-acik' : ''}" id="mknDurum">
        <i aria-hidden="true"></i>${durum.open ? 'Şu an açık' : 'Şu an kapalı'}${
          durum.text ? ' · ' + durum.text : ''}</span>
      <span class="tour-head-meta-item">${ic('mapPin')}${place.area}</span>
      <span class="tour-head-meta-item muted">Mekân kodu ${place.code}</span>`;
  }

  function factsMarkup() {
    return place.facts.map(f => `
      <div class="tour-fact">
        <span class="tour-fact-icon">${tourSvg(f.icon)}</span>
        <span class="tour-fact-body">
          <span class="tour-fact-label">${f.label}</span>
          <strong class="tour-fact-value">${f.value}</strong>
          <span class="tour-fact-note">${f.note}</span>
        </span>
      </div>`).join('');
  }

  function sectionNavMarkup() {
    return SECTIONS.map((s, i) => `
      <a class="tour-nav-link${i === 0 ? ' active' : ''}" href="#${s.id}" data-nav="${s.id}">${s.label}</a>`
    ).join('');
  }

  /* ---------------- içerik blokları ---------------- */
  function blockHead(title, note) {
    return `<div class="tour-block-head"><h2>${title}</h2>${note ? `<p>${note}</p>` : ''}</div>`;
  }

  function overviewMarkup() {
    const fazla = place.description.slice(1);
    return blockHead('Genel bakış', place.tagline) + `
      <ul class="tour-highlights">
        ${place.highlights.map(h => `<li>${ic('check')}<span>${h}</span></li>`).join('')}
      </ul>
      <div class="tour-prose" id="tourProse">
        <p>${place.description[0]}</p>
        <div class="tour-prose-rest" id="tourProseRest" hidden>
          ${fazla.map(t => `<p>${t}</p>`).join('')}
        </div>
      </div>
      ${fazla.length ? `<button class="tour-text-btn" type="button" id="tourProseToggle"
        aria-expanded="false" aria-controls="tourProseRest">Devamını oku${ic('chevDown')}</button>` : ''}`;
  }

  /* ---------------- alanlar / hizmetler ----------------
     İki model tek kart bileşeni kullanıyor; değişen yalnızca sağ alttaki
     fiyat satırının ne anlattığı:
       masa     "masada en az" (minimum harcama) + kapora bilgisi
       randevu  hizmetin fiyatı + süresi */
  function optionCardMarkup(secenek) {
    const secili = secenek.id === state.option;
    const indirimOran = randevu ? discountPercent(secenek.priceList, secenek.price) : 0;
    return `
      <article class="mkn-secenek${secili ? ' is-secili' : ''}" data-option-card="${secenek.id}">
        <div class="mkn-secenek-media">
          <img src="${venueImage(secenek.key, GALLERY_WIDTHS.thumb)}" alt="${secenek.name}" loading="lazy">
        </div>
        <div class="mkn-secenek-body">
          <div class="mkn-secenek-head">
            <h3>${secenek.name}</h3>
            ${secili ? `<span class="mkn-secenek-secili">${ic('check')}Seçili</span>` : ''}
          </div>
          <div class="mkn-secenek-meta">
            ${randevu
              ? `<span>${ic('clock')}${secenek.duration}</span>
                 <span>${ic('users')}${secenek.requiredGuests
                   ? secenek.requiredGuests + ' kişilik'
                   : 'En fazla ' + secenek.capacity + ' kişi'}</span>`
              : `<span>${ic('users')}${secenek.capacity} kişiye kadar</span>
                 <span>${ic('wallet')}Kapora ${formatTRY(secenek.deposit)}</span>`}
          </div>
          <ul class="mkn-secenek-ozellik">
            ${secenek.features.map(f => `<li>${ic('check')}<span>${f}</span></li>`).join('')}
          </ul>
          <p class="mkn-secenek-not">${ic('info')}<span>${secenek.note}</span></p>
          <div class="mkn-secenek-alt">
            <span class="mkn-secenek-fiyat">
              ${indirimOran > 0 ? `<span class="tour-price-was">${formatTRY(secenek.priceList)}</span>` : ''}
              <strong>${formatTRY(randevu ? secenek.price : secenek.minSpend)}</strong>
              <span>${randevu ? secenek.duration : 'masada en az'}</span>
            </span>
            <button class="tour-cta small${secili ? ' ghost' : ''}" type="button" data-option-pick="${secenek.id}">
              ${secili ? 'Rezervasyona git' : (randevu ? 'Bu hizmeti seç' : 'Bu alanı seç')}${ic('chevRight')}
            </button>
          </div>
          <p class="mkn-secenek-kalan" data-option-left="${secenek.id}"></p>
        </div>
      </article>`;
  }

  function optionsMarkup() {
    const liste = venueOptions(place);
    const baslik = randevu ? 'Hizmetler ve süreler' : 'Alanlar ve minimum harcama';
    const not = randevu
      ? liste.length + ' hizmet · ödeme mekânda yapılır'
      : liste.length + ' alan · kapora masadaki harcamadan düşülür';
    return blockHead(baslik, not)
      + `<div class="mkn-secenek-list" id="mknSecenekList">
           ${liste.map(optionCardMarkup).join('')}
         </div>
         <p class="tour-note">${ic('info')}<span>${randevu
           ? p.payAtVenueNote + '.'
           : 'Minimum harcama yiyecek ve içeceğin toplamıdır; altında kalınırsa aradaki fark hesaba yazılır. ' + p.depositNote + '.'}</span></p>`;
  }

  /* Kartlar yeniden çizilmiyor: yalnızca seçim rozeti, düğme metni ve
     kalan yer satırı güncelleniyor. */
  function syncOptionCards() {
    venueOptions(place).forEach(secenek => {
      const kart = document.querySelector('[data-option-card="' + secenek.id + '"]');
      if (kart) kart.classList.toggle('is-secili', secenek.id === state.option);

      const bas = kart && kart.querySelector('.mkn-secenek-head');
      if (bas) {
        const eski = bas.querySelector('.mkn-secenek-secili');
        if (secenek.id === state.option && !eski) {
          bas.insertAdjacentHTML('beforeend',
            '<span class="mkn-secenek-secili">' + ic('check') + 'Seçili</span>');
        }
        if (secenek.id !== state.option && eski) eski.remove();
      }

      const btn = document.querySelector('[data-option-pick="' + secenek.id + '"]');
      if (btn) {
        btn.classList.toggle('ghost', secenek.id === state.option);
        btn.innerHTML = (secenek.id === state.option
          ? 'Rezervasyona git'
          : (randevu ? 'Bu hizmeti seç' : 'Bu alanı seç')) + ic('chevRight');
      }

      const kalanEl = document.querySelector('[data-option-left="' + secenek.id + '"]');
      if (kalanEl) {
        const kalan = secenekKalan(secenek.id);
        const birim = randevu ? 'randevu' : secenek.name.toLocaleLowerCase('tr-TR');
        kalanEl.hidden = kalan === null;
        kalanEl.className = 'mkn-secenek-kalan' + (kalan !== null && kalan <= 3 ? ' is-low' : '');
        kalanEl.innerHTML = kalan === null ? ''
          : kalan === 0 ? ic('bolt') + 'Seçili saatte <strong>' + birim + ' kalmadı</strong>'
          : ic('bolt') + 'Seçili saatte <strong>' + kalan + ' ' + birim + '</strong> kaldı';
      }
    });
  }

  /* ---------------- menü (yalnızca masa modeli) ----------------
     Tam menü değil, fiyat bandını gösteren bir kesit: minimum harcama
     ancak menü fiyatları görülünce anlam kazanıyor. */
  function menuMarkup() {
    const gruplar = place.menu || [];
    if (!gruplar.length) return '';
    return blockHead('Menüden seçmeler', 'Tam menü değil; minimum harcamayı anlamlandıran bir kesit.') + `
      <div class="mkn-menu-grid">
        ${gruplar.map(g => `
          <section class="mkn-menu">
            <h3>${ic('food')}${g.title}</h3>
            <ul>
              ${g.items.map(i => `
                <li><span>${i.name}</span><strong>${formatTRY(i.price)}</strong></li>`).join('')}
            </ul>
          </section>`).join('')}
      </div>`;
  }

  /* ---------------- çalışma saatleri ----------------
     Bugünün satırı işaretli; kapalı günler de listede, çünkü "pazar
     kapalı" bilgisi listede görünmezse misafir kapıdan dönüyor. */
  function hoursMarkup() {
    const bugun = new Date().getDay();
    const durum = venueOpenNow(place, new Date());
    return blockHead('Çalışma saatleri', durum.open
      ? 'Şu an açık · ' + durum.text
      : (durum.text || 'Şu an kapalı')) + `
      <ul class="mkn-saat-list">
        ${place.hours.slice().sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7)).map(h => `
          <li class="mkn-saat${h.day === bugun ? ' is-bugun' : ''}${h.closed ? ' is-kapali' : ''}">
            <span class="mkn-saat-gun">${h.label}${h.day === bugun ? ' <em>bugün</em>' : ''}</span>
            <span class="mkn-saat-deger">${h.closed ? 'Kapalı' : h.open + ' – ' + h.close}</span>
          </li>`).join('')}
      </ul>
      ${randevu
        ? `<p class="tour-note">${ic('calendar')}<span>Son randevu kapanıştan bir saat önce başlar.</span></p>`
        : `<p class="tour-note">${ic('food')}<span>Mutfak 12:00 – 23:00 arası açık; bar servisi kapanıştan yarım saat öncesine kadar sürer.</span></p>`}`;
  }

  /* ---------------- konum ---------------- */
  function locationMarkup() {
    const k = place.location;
    return blockHead('Konum ve ulaşım', place.area) + `
      <div class="tour-meeting">
        <div class="tour-meeting-card">
          <span class="tour-meeting-pin">${tourSvg('mapPin')}</span>
          <div class="tour-meeting-body">
            <strong>${k.title}</strong>
            <p class="tour-meeting-address">${k.address}</p>
            <a class="tour-meeting-link" href="${k.mapUrl}" target="_blank" rel="noopener">
              Haritada aç ve yol tarifi al${ic('chevRight')}</a>
          </div>
        </div>
        <ul class="mkn-ulasim">
          ${k.access.map(a => `<li>${ic(a.icon)}<span>${a.text}</span></li>`).join('')}
        </ul>
        <p class="tour-note">${ic('info')}<span>${k.note}</span></p>
      </div>`;
  }

  /* ---------------- kurallar ve iptal ---------------- */
  function infoMarkup() {
    const iptal = place.cancellation;
    const ornek = Number(iptal.exampleTotal) || temelFiyat;
    const basamak = iptal.tiers.slice().sort((a, b) => b.minHours - a.minHours);

    return blockHead('Mekân kuralları ve iptal', 'Kapıda sürpriz olmasın diye hepsi burada.') + `
      <div class="mkn-kural-grid">
        ${place.rules.map(k => `
          <div class="tour-info-card">
            <h3>${ic(k.icon)}${k.title}</h3>
            <p>${k.text}</p>
          </div>`).join('')}
      </div>

      <div class="tour-refund">
        <h3>${ic('refresh')}İptal</h3>
        <p class="tour-refund-lead">${randevu
          ? 'Ön ödeme alınmadığı için iptalde para iadesi gerekmiyor; kademeler randevunun ne kadar önceden bırakıldığını anlatıyor.'
          : 'Rezervasyon saatine kalan süreye göre kapora iadesi. Sağdaki tutarlar '
            + formatTRY(ornek) + ' tutarında bir kapora içindir.'}</p>
        <ul class="tour-refund-list">
          ${basamak.map(t => {
            const oran = Math.round((Number(t.rate) || 0) * 100);
            const iadeTutar = refundAmount(ornek, t.minHours, iptal.tiers);
            return `
            <li class="tour-refund-row${oran === 100 ? ' full' : (oran === 0 ? ' none' : '')}">
              <span class="tour-refund-when"><strong>${t.label}</strong><span>${t.text}</span></span>
              <span class="tour-refund-amount"><strong>%${oran}</strong>${randevu
                ? '' : `<span>${formatTRY(iadeTutar)}</span>`}</span>
            </li>`;
          }).join('')}
        </ul>
        <p class="tour-note">${ic('shield')}<span>${iptal.note}</span></p>
      </div>`;
  }

  /* ---------------- yorumlar ---------------- */
  function reviewsMarkup() {
    const yildizSayilari = [5, 4, 3, 2, 1].map(s => filterReviews(place.reviews, s).length);
    const cipler = [{ star: 0, label: 'Tümü', count: place.reviews.length }]
      .concat([5, 4, 3, 2, 1].map((s, i) => ({ star: s, label: s + ' yıldız', count: yildizSayilari[i] })))
      .filter(c => c.count > 0);

    return blockHead('Misafirler ne diyor',
      `${formatNumberTR(puan.total)} değerlendirmenin ortalaması ${String(puan.average).replace('.', ',')} / 5`) + `
      <div class="tour-review-summary">
        <div class="tour-review-score">
          <strong>${String(puan.average).replace('.', ',')}</strong>
          <span class="tour-review-stars">${[1,2,3,4,5].map(i =>
            `<span class="icon${i <= Math.round(puan.average) ? ' on' : ''}">${tourSvg('star')}</span>`).join('')}</span>
          <span class="tour-review-total">${formatNumberTR(puan.total)} değerlendirme</span>
        </div>
        <ul class="tour-review-bars">
          ${puan.rows.map(r => `
            <li>
              <span class="tour-bar-label">${r.star}${ic('star')}</span>
              <span class="tour-bar"><span class="tour-bar-fill" style="width:${r.percent}%"></span></span>
              <span class="tour-bar-value">%${r.percent}</span>
            </li>`).join('')}
        </ul>
        <ul class="tour-review-aspects">
          ${place.ratingAspects.map(a => `
            <li>
              <span class="tour-aspect-label">${a.label}</span>
              <span class="tour-bar"><span class="tour-bar-fill" style="width:${Math.round(a.value / 5 * 100)}%"></span></span>
              <span class="tour-bar-value">${String(a.value).replace('.', ',')}</span>
            </li>`).join('')}
        </ul>
      </div>

      <div class="tour-review-filter" role="tablist" aria-label="Yorum filtresi">
        ${cipler.map(c => `
          <button class="tour-filter-chip${c.star === state.reviewStar ? ' active' : ''}" type="button"
                  role="tab" aria-selected="${c.star === state.reviewStar}" data-star="${c.star}">
            ${c.label}<span class="count">${c.count}</span>
          </button>`).join('')}
      </div>

      <div class="tour-review-list" id="tourReviewList"></div>`;
  }

  function reviewCardMarkup(r) {
    return `
      <article class="tour-review">
        <div class="tour-review-head">
          <span class="tour-review-avatar" aria-hidden="true">${reviewerInitials(r.name)}</span>
          <span class="tour-review-who">
            <strong>${r.name}</strong>
            <span>${formatTrDate(r.date)} · ${r.party}</span>
          </span>
          <span class="tour-review-rating">${ic('star')}${r.rating}</span>
        </div>
        <h3 class="tour-review-title">${r.title}</h3>
        <p class="tour-review-text">${r.text}</p>
        <span class="tour-review-verified">${ic('shield')}Doğrulanmış ziyaret</span>
      </article>`;
  }

  function renderReviews() {
    const liste = filterReviews(place.reviews, state.reviewStar);
    const gorunen = liste.slice(0, state.reviewsShown);
    const kalan = liste.length - gorunen.length;
    const el = document.getElementById('tourReviewList');
    if (!el) return;

    el.innerHTML = (gorunen.length
      ? gorunen.map(reviewCardMarkup).join('')
      : `<p class="tour-empty">Bu puana ait yorum yok.</p>`)
      + (kalan > 0
        ? `<button class="tour-more-btn" type="button" id="tourMoreReviews">
             ${kalan} yorum daha göster${ic('chevDown')}</button>`
        : '');
  }

  function faqMarkup() {
    return blockHead('Sıkça sorulan sorular', 'Cevabını bulamadığınız soru için destek hattı açık.') + `
      <div class="tour-faq">
        ${place.faq.map((f, i) => `
          <div class="tour-faq-item">
            <button class="tour-faq-q" type="button" aria-expanded="false" aria-controls="tourFaqA${i}">
              <span>${f.q}</span>${ic('chevDown')}
            </button>
            <div class="tour-faq-a" id="tourFaqA${i}" hidden><p>${f.a}</p></div>
          </div>`).join('')}
      </div>`;
  }

  /* Benzer şeridi: elle seçilmiş öneriler + kurala dayalı benzerler,
     kartlar ürünlerin kendi kaydından (catalog.js/catalogBenzerMarkup).
     Katalog yüklü değilse ya da benzer yoksa bölüm gizleniyor. */
  function similarMarkup() {
    if (typeof catalogBenzerMarkup !== 'function') return '';
    return catalogBenzerMarkup(place, {
      kok: KOK,
      yildiz: ic('star'),
      gorsel: (anahtar) => (typeof cardImages !== 'undefined' && cardImages[anahtar]) || ''
    });
  }

  function tagHref(t) {
    return String(t.href).charAt(0) === '#' ? t.href : KOK + t.href;
  }

  function tagsMarkup() {
    const etiketler = place.tags || [];
    if (!etiketler.length) return '';
    return `
      <div class="tour-block-head"><h2>Sayfa etiketleri</h2><p>Bu mekânla ilgili bölümler ve yakın kategoriler.</p></div>
      <ul class="seo-chip-list tour-tag-list">
        ${etiketler.map(t => `<li><a class="seo-chip" href="${tagHref(t)}">${t.label}</a></li>`).join('')}
      </ul>`;
  }

  /* ---------------- rezervasyon kartı ---------------- */
  const bookingEl = document.createElement('section');
  bookingEl.className = 'tour-booking';
  bookingEl.id = 'tourBooking';
  bookingEl.setAttribute('aria-label', randevu ? 'Randevu' : 'Rezervasyon');

  function dateChipsMarkup() {
    const liste = tarihler.slice(0, state.allDates ? DATE_CHIPS_ALL : DATE_CHIPS_SHORT);
    return liste.map(iso => {
      const parca = trDateParts(iso);
      const on = iso === state.date;
      const kapali = kapaliGun(iso);
      /* Kapalı gün seçilemiyor: kapalı bir güne rezervasyon almak,
         misafiri kapıdan çevirmek demek. Bütün seansları dolu gün de. */
      const dolu = !kapali && tarihDoluMu(musaitlik, iso);
      return `
        <button class="tour-date-chip mkn-date-chip${on ? ' active' : ''}${kapali ? ' is-kapali' : ''}${dolu ? ' is-dolu' : ''}"
                type="button" data-date="${iso}" aria-pressed="${on}"${kapali || dolu ? ' disabled' : ''}
                aria-label="${formatTrDate(iso)}${kapali ? ' — kapalı' : ''}${dolu ? ' — dolu' : ''}">
          <span class="tour-date-day">${parca.hafta}</span>
          <strong>${parca.gun}</strong>
          <span class="tour-date-month">${kapali ? 'kapalı' : (dolu ? 'dolu' : parca.ay)}</span>
        </button>`;
    }).join('');
  }

  function slotChipsMarkup() {
    /* Bütün alanları/hizmetleri dolu seans seçilemiyor. */
    return venueSlots(place, state.date).map(saat => {
      const dolu = tarihDoluMu(musaitlik, state.date, saat);
      return `
      <button class="mkn-saat-chip${saat === state.slot ? ' active' : ''}${dolu ? ' is-dolu' : ''}" type="button"
              data-slot="${saat}" aria-pressed="${saat === state.slot ? 'true' : 'false'}"${dolu ? ' disabled' : ''}>${saat}</button>`;
    }).join('');
  }

  function optionChipsMarkup() {
    return venueOptions(place).map(o => `
      <button class="tour-city-chip mkn-secenek-chip${o.id === state.option ? ' active' : ''}" type="button"
              data-option="${o.id}" aria-pressed="${o.id === state.option ? 'true' : 'false'}">
        <strong>${o.name}</strong>
        <span>${randevu ? o.duration : o.capacity + ' kişiye kadar'}</span>
        <span class="tour-city-fee">${randevu
          ? formatTRY(o.price) + ' / hizmet'
          : 'Kapora ' + formatTRY(o.deposit)}</span>
      </button>`).join('');
  }

  function addonRowsMarkup() {
    return place.addons.map(a => `
      <label class="tour-addon" for="addon-${a.id}">
        <input type="checkbox" id="addon-${a.id}" data-addon="${a.id}">
        <span class="tour-addon-box">${tourSvg('check')}</span>
        <span class="tour-addon-body">
          <strong>${a.label}</strong>
          <span>${a.text}</span>
        </span>
        <span class="tour-addon-price" data-addon-price="${a.id}">
          ${Number(a.price) > 0 ? '+' + formatTRY(a.price) : 'Ücretsiz'}<span>${
            Number(a.price) > 0 ? (a.per === 'guest' ? '/kişi' : '/rezervasyon') : ''}</span>
        </span>
      </label>`).join('');
  }

  /* Özetin alt satırı iki modelde farklı şeyi söylüyor ve fark
     bilinçli: masa modelinde ödenen KAPORA, randevuda mekânda ödenecek
     tutar. Aynı cümleyi kullanmak, ikisinden birini yanlış anlatırdı. */
  function summaryMarkup(hesap) {
    const satir = (l) => `
      <li class="${l.kind}"><span>${l.label}</span><span>${
        Number(l.amount) === 0 ? 'Ücretsiz' : formatTRY(l.amount)}</span></li>`;

    return `
      <ul class="tour-sum-lines">${hesap.lines.map(satir).join('')}</ul>
      ${!randevu && hesap.minSpend ? `<p class="mkn-min-harcama">${ic('wallet')}
        Masada en az <strong>${formatTRY(hesap.minSpend)}</strong> harcama bekleniyor;
        kaporanız bu tutardan düşülür.</p>` : ''}
      <div class="tour-sum-total">
        <span>${randevu ? 'Mekânda ödenecek' : 'Şimdi ödenecek'}</span>
        <strong>${formatTRY(hesap.total)}</strong>
      </div>
      <p class="tour-sum-note">${randevu
        ? p.payAtVenueNote
        : p.depositNote} · ${hesap.guests} kişi · ${formatTrDate(state.date)} ${state.slot}</p>`;
  }

  function bookingMarkup() {
    return `
      <div class="tour-booking-top">
        <div class="tour-price">
          <strong class="tour-price-now">${formatTRY(temelFiyat)}</strong>
          <span class="tour-price-unit">${birimNot}</span>
        </div>
        <p class="tour-booking-social">${ic('sparkle')}Son 24 saatte
          ${place.social.viewedLast24h} kişi bu mekâna baktı · bu hafta
          ${place.social.bookedThisWeek} rezervasyon</p>
      </div>

      <div class="tour-booking-field">
        <div class="tour-field-head">
          <span class="tour-field-label">${ic('calendar')}Gün</span>
          <button class="tour-text-btn small" type="button" id="tourAllDates"
                  aria-expanded="false">Tüm günler</button>
        </div>
        <div class="tour-date-chips" id="tourDateChips" role="group"
             aria-label="Rezervasyon günü">${dateChipsMarkup()}</div>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('clock')}Saat</span>
        <div class="mkn-saat-chips" id="mknSlotChips" role="group"
             aria-label="Rezervasyon saati">${slotChipsMarkup()}</div>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${randevu ? ic('sparkle') + 'Hizmet' : ic('home') + 'Alan'}</span>
        <div class="tour-city-chips" role="group"
             aria-label="${randevu ? 'Hizmet' : 'Alan'}">${optionChipsMarkup()}</div>
        <div class="tour-seats" id="tourSeats"></div>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('users')}Kişi sayısı</span>
        <div class="tour-party">
          <div class="tour-party-row" data-party="guests">
            <span class="tour-party-body">
              <strong>Kişi</strong>
              <span data-row-note="guests"></span>
            </span>
            <span class="tour-stepper">
              <button class="tour-step-btn" type="button" data-step="-1" data-target="guests"
                      aria-label="Kişi sayısını azalt">${tourSvg('minus')}</button>
              <output class="tour-step-value" data-count="guests">${state.guests}</output>
              <button class="tour-step-btn" type="button" data-step="1" data-target="guests"
                      aria-label="Kişi sayısını artır">${tourSvg('plus')}</button>
            </span>
          </div>
        </div>
        <p class="tour-party-limit" id="tourPartyLimit"></p>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('plus')}Ek hizmetler</span>
        <div class="tour-addons">${addonRowsMarkup()}</div>
      </div>

      <div class="tour-summary" id="tourSummary"></div>

      <button class="tour-cta" type="button" id="tourReserve">
        ${randevu ? 'Randevu al' : 'Masa ayırt'}${ic('chevRight')}</button>

      <ul class="tour-booking-trust">
        ${place.trust.map(t => `<li>${ic(t.icon)}<span>${t.text}</span></li>`).join('')}
      </ul>

      <div class="tour-booking-contact">
        <a class="tour-booking-help" href="${CONTACT.phoneHref}">
          ${ic('phone')}<span><strong>${CONTACT.phoneLabel}</strong>${CONTACT.hours}</span></a>
        <a class="tour-booking-help" href="${CONTACT.whatsappHref}"
           target="_blank" rel="noopener">
          ${whatsappIkon()}<span><strong>WhatsApp'tan yaz</strong>${destekDurumu()}</span></a>
      </div>`;
  }

  /* Kalan yer: kontenjan cevabından, seçili gün, seans ve alan/hizmet
     için. İstenen: masa modelinde bir alan (şezlong/sedir/loca tek
     birim), randevuda kişi sayısı kadar terapist seansı. */
  function syncSeats(hesap) {
    const secenek = hesap.option || venueOptions(place)[0];
    const istenen = randevu ? hesap.guests : 1;
    const durum = kontenjanDurumu(secenekKalan(secenek.id), istenen, 3);
    satisEngeli = (durum.durum === 'doldu' || durum.durum === 'yetersiz') ? durum.durum : null;
    const dugme = document.getElementById('tourReserve');
    if (dugme) dugme.disabled = !!satisEngeli;

    const el = document.getElementById('tourSeats');
    if (!el) return;
    el.hidden = durum.durum === 'bilinmiyor';
    if (el.hidden) { el.innerHTML = ''; return; }
    const kapasite = Math.max(1, Number(secenek.count) || 1);
    const dolu = Math.max(0, Math.min(100, Math.round(((kapasite - durum.kalan) / kapasite) * 100)));
    const birim = randevu ? 'randevu' : 'yer';
    el.classList.toggle('is-low', durum.durum !== 'var');
    const metin = {
      doldu: state.slot + ' için <strong>' + birim + ' kalmadı</strong> · başka bir saat seçin',
      yetersiz: state.slot + ' için en fazla <strong>' + durum.kalan + ' ' + birim + '</strong> var'
    }[durum.durum] || state.slot + ' için <strong>' + durum.kalan + ' ' + birim + '</strong> kaldı';
    el.innerHTML = `
      <span class="tour-seats-bar"><span class="tour-seats-fill" style="width:${dolu}%"></span></span>
      <span class="tour-seats-text">${ic(randevu ? 'calendar' : 'users')}<span>${metin}</span></span>`;
  }

  function syncBooking() {
    const hesap = calcVenueBooking(place, state);
    state.guests = hesap.guests;

    bookingEl.querySelectorAll('[data-date]').forEach(btn => {
      const on = btn.getAttribute('data-date') === state.date;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    bookingEl.querySelectorAll('[data-slot]').forEach(btn => {
      const on = btn.getAttribute('data-slot') === state.slot;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    bookingEl.querySelectorAll('[data-option]').forEach(btn => {
      const on = btn.getAttribute('data-option') === state.option;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    const out = bookingEl.querySelector('[data-count="guests"]');
    if (out) out.textContent = String(state.guests);

    /* Kişi sayısı hizmetin tanımına bağlıysa (çift masajı) sayaç
       kilitleniyor: tıklanıp hiçbir şey olmaması yerine neden
       olmadığı altta yazıyor. */
    bookingEl.querySelectorAll('[data-step]').forEach(btn => {
      const yon = Number(btn.getAttribute('data-step'));
      const deneme = Object.assign({}, state, { guests: state.guests + yon });
      btn.disabled = hesap.fixedGuests || clampVenueParty(place, deneme).guests === state.guests;
    });
    const satir = bookingEl.querySelector('[data-party="guests"]');
    if (satir) satir.classList.toggle('is-pasif', hesap.fixedGuests);

    const not = bookingEl.querySelector('[data-row-note="guests"]');
    if (not) {
      not.textContent = hesap.fixedGuests
        ? hesap.option.name + ' tanımı gereği ' + hesap.guests + ' kişilik'
        : hesap.option.name + ' en fazla ' + hesap.option.capacity + ' kişi alıyor';
    }

    const limitEl = document.getElementById('tourPartyLimit');
    if (limitEl) {
      limitEl.textContent = randevu
        ? 'Terapist tercihinizi rezervasyon notuna yazabilirsiniz'
        : 'Daha kalabalık gruplar için mekânı arayın; iki alan yan yana ayrılabiliyor';
    }

    place.addons.forEach(a => {
      const fiyatEl = bookingEl.querySelector('[data-addon-price="' + a.id + '"]');
      if (fiyatEl && a.per === 'guest' && Number(a.price) > 0) {
        fiyatEl.innerHTML = '+' + formatTRY((Number(a.price) || 0) * hesap.guests)
          + '<span>' + hesap.guests + ' kişi</span>';
      }
      const kutu = bookingEl.querySelector('[data-addon="' + a.id + '"]');
      if (kutu) kutu.checked = state.addons.indexOf(a.id) !== -1;
    });

    const ozet = document.getElementById('tourSummary');
    if (ozet) ozet.innerHTML = summaryMarkup(hesap);

    syncSeats(hesap);
    syncOptionCards();
    syncStickyBar(hesap);
  }

  /* ---------------- yapışkan alt şerit (mobil) ---------------- */
  function syncStickyBar(hesap) {
    const bar = document.getElementById('tourStickyBar');
    if (!bar) return;
    const toplam = hesap || calcVenueBooking(place, state);
    bar.innerHTML = `
      <div class="tour-sticky-info">
        <span class="tour-sticky-price">
          <strong>${formatTRY(toplam.total)}</strong>
          <span class="tour-sticky-guests">${randevu ? 'mekânda' : 'kapora'}</span>
        </span>
        <span class="tour-sticky-date">${formatTrDateRangeShort(state.date, '')} · ${state.slot}</span>
      </div>
      <button class="tour-cta small" type="button" id="tourStickyCta"${satisEngeli ? ' disabled' : ''}>${
        randevu ? 'Randevu al' : 'Masa ayırt'}</button>`;
  }

  /* ---------------- fotoğraf büyütme (lightbox) ---------------- */
  let sonOdak = null;
  let kilitliY = 0;
  let kilitSayaci = 0;

  /* Katman açıkken arka sayfa kaymasın. iOS Safari html'deki
     "overflow: hidden" kuralını dokunmatik kaydırmada uygulamıyor;
     çalışan yol GÖVDEYİ SABİTLEMEK. Sayaç iki katman üst üste
     açıldığında konumun sıfırlanmaması için (docs/tur-sayfasi.md). */
  function lockScroll(on) {
    const govde = document.body;

    if (on) {
      kilitSayaci += 1;
      if (kilitSayaci > 1) return;

      kilitliY = window.scrollY || document.documentElement.scrollTop || 0;
      govde.style.position = 'fixed';
      govde.style.top = -kilitliY + 'px';
      govde.style.left = '0';
      govde.style.right = '0';
      govde.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
      return;
    }

    kilitSayaci = Math.max(0, kilitSayaci - 1);
    if (kilitSayaci > 0) return;

    govde.style.removeProperty('position');
    govde.style.removeProperty('top');
    govde.style.removeProperty('left');
    govde.style.removeProperty('right');
    govde.style.removeProperty('width');
    document.documentElement.style.removeProperty('overflow');
    window.scrollTo(0, kilitliY);
  }

  function lightboxMarkup() {
    return `
      <div class="tour-lb-panel" role="dialog" aria-modal="true" aria-label="Fotoğraf galerisi">
        <div class="tour-lb-bar">
          <span class="tour-lb-count" id="tourLbCount"></span>
          <button class="tour-lb-btn" type="button" data-lb="close" aria-label="Kapat">${tourSvg('close')}</button>
        </div>
        <div class="tour-lb-stage">
          <button class="tour-lb-nav prev" type="button" data-lb="prev" aria-label="Önceki fotoğraf">${tourSvg('chevLeft')}</button>
          <img id="tourLbImg" src="" alt="">
          <button class="tour-lb-nav next" type="button" data-lb="next" aria-label="Sonraki fotoğraf">${tourSvg('chevRight')}</button>
        </div>
        <div class="tour-lb-foot">
          <p id="tourLbCaption"></p>
          <div class="tour-lb-thumbs" id="tourLbThumbs">
            ${place.gallery.map((g, i) => `
              <button class="tour-lb-thumb" type="button" data-lb-go="${i}" aria-label="${g.caption}">
                <img src="${venueImage(g.key, 300)}" alt="" loading="lazy">
              </button>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function showPhoto(index) {
    const toplam = place.gallery.length;
    state.photo = ((Math.round(Number(index) || 0) % toplam) + toplam) % toplam;
    const foto = place.gallery[state.photo];
    const img = document.getElementById('tourLbImg');
    if (img) {
      img.src = venueImage(foto.key, GALLERY_WIDTHS.full);
      img.alt = foto.caption;
    }
    const caption = document.getElementById('tourLbCaption');
    if (caption) caption.textContent = foto.caption;
    const count = document.getElementById('tourLbCount');
    if (count) count.textContent = (state.photo + 1) + ' / ' + toplam;
    $$('#tourLbThumbs [data-lb-go]').forEach(btn => {
      btn.classList.toggle('active', Number(btn.getAttribute('data-lb-go')) === state.photo);
    });
  }

  function openLightbox(index) {
    const lb = document.getElementById('tourLightbox');
    if (!lb) return;
    sonOdak = document.activeElement;
    if (!lb.dataset.ready) {
      lb.innerHTML = lightboxMarkup();
      lb.dataset.ready = '1';
    }
    showPhoto(index);
    lb.classList.add('open');
    lockScroll(true);
    const kapat = lb.querySelector('[data-lb="close"]');
    if (kapat) kapat.focus();
  }

  function closeLightbox() {
    const lb = document.getElementById('tourLightbox');
    if (!lb || !lb.classList.contains('open')) return;
    lb.classList.remove('open');
    lockScroll(false);
    if (sonOdak && typeof sonOdak.focus === 'function') sonOdak.focus();
    sonOdak = null;
  }

  /* ---------------- rezervasyon özeti sayfası ---------------- */
  function openSheet() {
    const sheet = document.getElementById('tourSheet');
    if (!sheet) return;
    const hesap = calcVenueBooking(place, state);
    const satir = (label, value) => `<li><span>${label}</span><strong>${value}</strong></li>`;

    sheet.innerHTML = `
      <div class="tour-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="tourSheetTitle">
        <div class="tour-sheet-head">
          <h2 id="tourSheetTitle">${randevu ? 'Randevu özeti' : 'Rezervasyon özeti'}</h2>
          <button class="tour-icon-btn" type="button" data-sheet="close" aria-label="Kapat">${ic('close')}</button>
        </div>
        <p class="tour-sheet-tour">${place.title}</p>
        <ul class="tour-sheet-lines">
          ${satir('Gün ve saat', formatTrDate(state.date) + ' · ' + state.slot)}
          ${satir(randevu ? 'Hizmet' : 'Alan', hesap.option.name
            + (randevu ? ' · ' + hesap.option.duration : ''))}
          ${satir('Kişi', hesap.guests + ' kişi')}
          ${hesap.addons.map(a => satir(a.label,
            Number(a.amount) === 0 ? 'Ücretsiz' : formatTRY(a.amount))).join('')}
          ${!randevu && hesap.minSpend
            ? satir('Masada en az', formatTRY(hesap.minSpend)) : ''}
          ${satir(randevu ? 'Mekânda ödenecek' : 'Şimdi ödenecek kapora', formatTRY(hesap.total))}
        </ul>
        <p class="tour-sheet-note">${ic('info')}<span>Ödeme adımı henüz bağlı değil.
          Yukarıdaki özet, ödeme ekranına taşınacak bilgilerin tamamıdır.</span></p>
        <div class="tour-sheet-actions">
          <a class="tour-cta ghost" href="${CONTACT.phoneHref}">${ic('phone')}Destek hattını ara</a>
          <a class="tour-cta ghost" href="${CONTACT.whatsappHref}"
             target="_blank" rel="noopener">${whatsappIkon()}WhatsApp'tan yaz</a>
          <button class="tour-cta" type="button" data-sheet="close">Anladım</button>
        </div>
      </div>`;

    sonOdak = document.activeElement;
    sheet.classList.add('open');
    lockScroll(true);
    const kapat = sheet.querySelector('[data-sheet="close"]');
    if (kapat) kapat.focus();
  }

  function closeSheet() {
    const sheet = document.getElementById('tourSheet');
    if (!sheet || !sheet.classList.contains('open')) return;
    sheet.classList.remove('open');
    lockScroll(false);
    if (sonOdak && typeof sonOdak.focus === 'function') sonOdak.focus();
    sonOdak = null;
  }

  let toastTimer = 0;
  function toast(mesaj) {
    let el = document.getElementById('tourToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tourToast';
      el.className = 'tour-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = mesaj;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------------- bölüm menüsü ve kaydırma takibi ---------------- */
  function stickyOffset() {
    const header = document.querySelector('.site-header');
    const nav = document.getElementById('tourSectionNav');
    const headerH = (header && getComputedStyle(header).position === 'fixed')
      ? header.getBoundingClientRect().height : 0;
    const navH = nav ? nav.getBoundingClientRect().height : 0;
    return headerH + navH;
  }

  function azaltilmisHareket() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function scrollToY(top) {
    window.scrollTo({ top: Math.max(0, top), behavior: azaltilmisHareket() ? 'auto' : 'smooth' });
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    scrollToY(window.scrollY + el.getBoundingClientRect().top - stickyOffset() - 14);
  }

  function scrollToBooking() {
    const kart = document.getElementById('tourBooking');
    if (!kart) return;
    scrollToY(window.scrollY + kart.getBoundingClientRect().top - stickyOffset() - 14);
  }

  function initSectionNav() {
    const nav = document.getElementById('tourSectionNav');
    if (!nav) return;
    const bolumler = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);
    if (!bolumler.length) return;

    let queued = false;
    let sonAktif = '';

    function sync() {
      queued = false;
      const esik = stickyOffset() + 24;
      let aktif = bolumler[0].id;
      bolumler.forEach(b => { if (b.getBoundingClientRect().top <= esik) aktif = b.id; });
      const dip = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
      if (dip) aktif = bolumler[bolumler.length - 1].id;

      const yapiskanUst = parseFloat(getComputedStyle(nav).top) || 0;
      nav.classList.toggle('is-stuck', nav.getBoundingClientRect().top <= yapiskanUst + 1);

      nav.querySelectorAll('[data-nav]').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-nav') === aktif);
      });

      if (aktif !== sonAktif) {
        sonAktif = aktif;
        ortala(aktif);
      }
    }

    function ortala(id) {
      const link = nav.querySelector('[data-nav="' + id + '"]');
      if (!link || nav.scrollWidth <= nav.clientWidth + 2) return;

      const pay = 12;
      const solKenar = link.offsetLeft - nav.scrollLeft;
      const sagKenar = solKenar + link.offsetWidth;
      if (solKenar >= pay && sagKenar <= nav.clientWidth - pay) return;

      const hedef = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
      const enFazla = nav.scrollWidth - nav.clientWidth;
      nav.scrollTo({
        left: Math.max(0, Math.min(hedef, enFazla)),
        behavior: azaltilmisHareket() ? 'auto' : 'smooth'
      });
    }

    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sync);
    }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  function syncHeaderHeight() {
    const h = document.querySelector('.tour-mobile-header');
    const yukseklik = (h && getComputedStyle(h).display !== 'none')
      ? Math.round(h.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--tour-header-h', yukseklik + 'px');
  }

  function initGalleryCounter() {
    const grid = document.querySelector('.tour-gallery-grid');
    const sayac = document.getElementById('tourGalleryCount');
    if (!grid || !sayac) return;
    const toplam = place.gallery.length;
    let queued = false;
    function sync() {
      queued = false;
      const genislik = grid.clientWidth || 1;
      const i = Math.min(toplam - 1, Math.max(0, Math.round(grid.scrollLeft / genislik)));
      sayac.textContent = (i + 1) + ' / ' + toplam;
    }
    grid.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sync);
    }, { passive: true });
    sync();
  }

  const genisEkran = window.matchMedia('(min-width: 1025px)');
  function syncBookingPlacement() {
    const hedef = document.getElementById(genisEkran.matches ? 'tourBookingDesktop' : 'tourBookingMobile');
    if (hedef && bookingEl.parentElement !== hedef) hedef.appendChild(bookingEl);
  }

  function initStickyBar() {
    const bar = document.getElementById('tourStickyBar');
    const cta = document.getElementById('tourReserve');
    if (!bar || !cta) return;
    if (typeof IntersectionObserver !== 'function') {
      bar.classList.add('is-visible');
      return;
    }
    const gozlemci = new IntersectionObserver(kayitlar => {
      kayitlar.forEach(k => bar.classList.toggle('is-visible', !k.isIntersecting));
    }, { threshold: 0.35 });
    gozlemci.observe(cta);
  }

  /* Künyedeki "şu an açık" satırı dakikada bir tazeleniyor: mekân
     sayfası açık dururken kapanış saati geçebiliyor ve sayfa yanlış
     bilgi göstermeye devam ediyordu. */
  function initOpenStatus() {
    window.setInterval(() => {
      const el = document.getElementById('mknDurum');
      if (!el) return;
      const durum = venueOpenNow(place, new Date());
      el.classList.toggle('is-acik', durum.open);
      el.innerHTML = '<i aria-hidden="true"></i>'
        + (durum.open ? 'Şu an açık' : 'Şu an kapalı')
        + (durum.text ? ' · ' + durum.text : '');
    }, 60000);
  }

  /* ---------------- etkileşimler ---------------- */
  function initEvents() {
    document.addEventListener('click', (e) => {
      const hucre = e.target.closest('[data-photo]');
      if (hucre) openLightbox(Number(hucre.getAttribute('data-photo')) || 0);
    });

    const lbEl = document.getElementById('tourLightbox');
    if (lbEl) {
      lbEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-lb]');
        if (btn) {
          const eylem = btn.getAttribute('data-lb');
          if (eylem === 'close') closeLightbox();
          if (eylem === 'prev') showPhoto(state.photo - 1);
          if (eylem === 'next') showPhoto(state.photo + 1);
          return;
        }
        const kucuk = e.target.closest('[data-lb-go]');
        if (kucuk) { showPhoto(Number(kucuk.getAttribute('data-lb-go')) || 0); return; }
        if (e.target.classList.contains('tour-lb-stage')) closeLightbox();
      });
    }

    const sheetEl = document.getElementById('tourSheet');
    if (sheetEl) {
      sheetEl.addEventListener('click', (e) => {
        if (e.target.closest('[data-sheet="close"]') || !e.target.closest('.tour-sheet-panel')) closeSheet();
      });
    }

    document.addEventListener('keydown', (e) => {
      const lb = document.getElementById('tourLightbox');
      const sheet = document.getElementById('tourSheet');
      if (e.key === 'Escape') {
        if (lb && lb.classList.contains('open')) { closeLightbox(); return; }
        if (sheet && sheet.classList.contains('open')) { closeSheet(); return; }
      }
      if (lb && lb.classList.contains('open')) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(state.photo - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); showPhoto(state.photo + 1); }
      }
    });

    (function () {
      const lb = document.getElementById('tourLightbox');
      if (!lb) return;
      let x0 = 0, y0 = 0, izle = false;
      lb.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { izle = false; return; }
        x0 = e.touches[0].clientX;
        y0 = e.touches[0].clientY;
        izle = true;
      }, { passive: true });
      lb.addEventListener('touchend', (e) => {
        if (!izle) return;
        izle = false;
        const dokunus = e.changedTouches && e.changedTouches[0];
        if (!dokunus) return;
        const dx = dokunus.clientX - x0;
        const dy = dokunus.clientY - y0;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
        showPhoto(state.photo + (dx < 0 ? 1 : -1));
      }, { passive: true });
    })();

    const nav = document.getElementById('tourSectionNav');
    if (nav) {
      nav.addEventListener('click', (e) => {
        const link = e.target.closest('[data-nav]');
        if (!link) return;
        e.preventDefault();
        scrollToSection(link.getAttribute('data-nav'));
      });
    }

    document.addEventListener('click', (e) => {
      const proseBtn = e.target.closest('#tourProseToggle');
      if (proseBtn) {
        const rest = document.getElementById('tourProseRest');
        if (!rest) return;
        const acik = !rest.hidden;
        rest.hidden = acik;
        proseBtn.setAttribute('aria-expanded', acik ? 'false' : 'true');
        proseBtn.innerHTML = (acik ? 'Devamını oku' : 'Daha az göster') + ic(acik ? 'chevDown' : 'chevUp');
        return;
      }

      const secenekBtn = e.target.closest('[data-option-pick]');
      if (secenekBtn) {
        const id = secenekBtn.getAttribute('data-option-pick');
        if (id === state.option) { scrollToBooking(); return; }
        state.option = id;
        syncBooking();
        toast(venueOption(place, id).name + ' seçildi');
        return;
      }

      const faqBtn = e.target.closest('.tour-faq-q');
      if (faqBtn) {
        const cevap = document.getElementById(faqBtn.getAttribute('aria-controls'));
        const acik = faqBtn.getAttribute('aria-expanded') === 'true';
        $$('.tour-faq-q').forEach(btn => {
          btn.setAttribute('aria-expanded', 'false');
          const c = document.getElementById(btn.getAttribute('aria-controls'));
          if (c) c.hidden = true;
        });
        if (!acik && cevap) {
          faqBtn.setAttribute('aria-expanded', 'true');
          cevap.hidden = false;
        }
        return;
      }

      const starBtn = e.target.closest('[data-star]');
      if (starBtn) {
        state.reviewStar = Number(starBtn.getAttribute('data-star')) || 0;
        state.reviewsShown = REVIEWS_STEP;
        $$('[data-star]').forEach(btn => {
          const on = btn === starBtn;
          btn.classList.toggle('active', on);
          btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        renderReviews();
        return;
      }

      if (e.target.closest('#tourMoreReviews')) {
        state.reviewsShown += REVIEWS_STEP;
        renderReviews();
      }
    });

    function syncFav() {
      const btn = document.getElementById('tourGalleryFav');
      if (!btn) return;
      btn.classList.toggle('on', state.favorite);
      btn.setAttribute('aria-pressed', state.favorite ? 'true' : 'false');
      btn.setAttribute('aria-label', state.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle');
    }

    const favBtn = document.getElementById('tourGalleryFav');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        state.favorite = !state.favorite;
        syncFav();
        toast(state.favorite ? 'Favorilerine eklendi' : 'Favorilerden çıkarıldı');
      });
    }
    syncFav();

    function paylas() {
      const veri = { title: place.title, text: place.tagline, url: window.location.href };
      if (navigator.share) {
        navigator.share(veri).catch(() => {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href)
          .then(() => toast('Bağlantı kopyalandı'))
          .catch(() => toast('Bağlantı kopyalanamadı'));
        return;
      }
      toast('Bu tarayıcı paylaşmayı desteklemiyor');
    }

    const shareBtn = document.getElementById('tourGalleryShare');
    if (shareBtn) shareBtn.addEventListener('click', paylas);

    bookingEl.addEventListener('click', (e) => {
      const tarih = e.target.closest('[data-date]');
      if (tarih) {
        state.date = tarih.getAttribute('data-date');
        /* Gün değişince saat listesi de değişebiliyor (hafta sonu ayrı
           liste); seçili saat o günde yoksa ilk saate düşüyor. */
        state.slot = venueSlot(place, state.date, state.slot);
        const kap = document.getElementById('mknSlotChips');
        if (kap) kap.innerHTML = slotChipsMarkup();
        syncBooking();
        return;
      }

      const saat = e.target.closest('[data-slot]');
      if (saat) {
        state.slot = saat.getAttribute('data-slot');
        syncBooking();
        return;
      }

      const adim = e.target.closest('[data-step]');
      if (adim) {
        state.guests = (Number(state.guests) || 0) + (Number(adim.getAttribute('data-step')) || 0);
        syncBooking();
        return;
      }

      const secenek = e.target.closest('[data-option]');
      if (secenek) {
        state.option = secenek.getAttribute('data-option');
        syncBooking();
        return;
      }

      const tumTarih = e.target.closest('#tourAllDates');
      if (tumTarih) {
        state.allDates = !state.allDates;
        const kap = document.getElementById('tourDateChips');
        if (kap) kap.innerHTML = dateChipsMarkup();
        tumTarih.textContent = state.allDates ? 'Daha az gün' : 'Tüm günler';
        tumTarih.setAttribute('aria-expanded', state.allDates ? 'true' : 'false');
        syncBooking();
        return;
      }

      if (e.target.closest('#tourReserve')) openSheet();
    });

    bookingEl.addEventListener('change', (e) => {
      const kutu = e.target.closest('[data-addon]');
      if (!kutu) return;
      const id = kutu.getAttribute('data-addon');
      const yer = state.addons.indexOf(id);
      if (kutu.checked && yer === -1) state.addons.push(id);
      if (!kutu.checked && yer !== -1) state.addons.splice(yer, 1);
      syncBooking();
    });

    const bar = document.getElementById('tourStickyBar');
    if (bar) {
      bar.addEventListener('click', (e) => {
        if (!e.target.closest('#tourStickyCta')) return;
        const kart = document.getElementById('tourBooking');
        const gorunur = kart && kart.getBoundingClientRect().top < window.innerHeight * 0.8
          && kart.getBoundingClientRect().bottom > 0;
        if (gorunur) openSheet();
        else scrollToBooking();
      });
    }

    if (genisEkran.addEventListener) genisEkran.addEventListener('change', syncBookingPlacement);
    else if (genisEkran.addListener) genisEkran.addListener(syncBookingPlacement);
  }

  /* ---------------- kurulum ---------------- */
  fill('tourGallery', galleryMarkup());
  fill('tourHeadline', headlineMarkup());
  fill('tourHeadMeta', headMetaMarkup());
  fill('tourFacts', factsMarkup());
  fill('tourSectionNav', sectionNavMarkup());
  fill('genel-bakis', overviewMarkup());
  fill(randevu ? 'hizmetler' : 'alanlar', optionsMarkup());
  fill('menu', menuMarkup());
  fill('saatler', hoursMarkup());
  fill('konum', locationMarkup());
  fill('bilgiler', infoMarkup());
  fill('yorumlar', reviewsMarkup());
  fill('sss', faqMarkup());
  const benzerIcerik = similarMarkup();
  fill('tourSimilar', benzerIcerik);
  if (!benzerIcerik && document.getElementById('tourSimilar')) document.getElementById('tourSimilar').hidden = true;
  fill('tourTags', tagsMarkup());

  bookingEl.innerHTML = bookingMarkup();
  syncBookingPlacement();

  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);
  window.addEventListener('orientationchange', syncHeaderHeight);

  renderReviews();
  syncBooking();
  initEvents();
  initSectionNav();
  initGalleryCounter();
  initStickyBar();
  initOpenStatus();

  /* Kontenjan: takvimde görünebilecek bütün günler için tek sorgu. Seçili
     seans tamamen doluysa aynı günün ilk müsait seansına geçiliyor. */
  MolaVeri.musaitlik('venue', place.slug, { from: tarihler[0], to: tarihler[tarihler.length - 1] })
    .then(cevap => {
      musaitlik = cevap;
      if (tarihDoluMu(musaitlik, state.date)) {
        const ilk = tarihler.find(iso => !kapaliGun(iso) && !tarihDoluMu(musaitlik, iso));
        if (ilk) { state.date = ilk; state.slot = venueSlot(place, ilk, state.slot); }
      }
      if (tarihDoluMu(musaitlik, state.date, state.slot)) {
        const saat = venueSlots(place, state.date).find(x => !tarihDoluMu(musaitlik, state.date, x));
        if (saat) state.slot = saat;
      }
      const tarihKap = document.getElementById('tourDateChips');
      if (tarihKap) tarihKap.innerHTML = dateChipsMarkup();
      const saatKap = document.getElementById('mknSlotChips');
      if (saatKap) saatKap.innerHTML = slotChipsMarkup();
      syncBooking();
    })
    .catch(() => { /* Kontenjan bilinmiyor: satırlar gizli, satış açık. */ });

})();
