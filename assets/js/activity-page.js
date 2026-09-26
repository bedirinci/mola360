/* ---------------- aktivite içerik sayfası: işaretleme ve etkileşimler ----------------
   Veri ve saf hesaplar activity-data.js'te; bu dosya onları işaretlemeye
   çevirir ve davranışları bağlar. Buraya sayfada görünen metin yazılmaz.

   Tur ve otel sayfalarıyla ORTAK olanlar tekrar yazılmadı:
     - biçimlendirme, tarih, iade, puan hesapları  -> tour-data.js
     - ikon seti (tourSvg / TOUR_ICONS)            -> tour-data.js
     - sayfanın görsel kabuğu                      -> assets/css/tour.css
   Sınıf adlarındaki "tour-" öneki tarihsel: o dosya içerik sayfalarının
   ortak kabuğu (docs/otel-sayfasi.md).

   Aktivitenin turdan ve otelden farkı, satılan şeyin ekseni:
     tur      bir tarih + kişi sayısı
     otel     tarih aralığı + oda + pansiyon
     aktivite bir tarih + SEANS + PAKET + kişi sayısı
   Bu yüzden rezervasyon kartı ve hesap ayrı; bölümler de ayrı
   (paketler, program, katılım şartları). */
(function () {

  /* Kayıt veri kapısından (docs/veri-sozlesmesi.md); yayında olmayan veya
     bilinmeyen aktivite null. */
  const activity = MolaVeri.urun('activity', activitySlugFromPath(window.location.pathname));
  if (!activity) return;

  /* Sayfa kökü: /aktivite/<slug>/index.html iki dizin içeride olduğu
     için anasayfaya giden bağlantılar buradan kuruluyor. Değer
     <body data-root="..."> niteliğinden geliyor, tahmin edilmiyor. */
  const KOK = (document.body && document.body.getAttribute('data-root')) || '';

  const TUM_SECTIONS = [
    { id: 'genel-bakis', label: 'Genel Bakış' },
    { id: 'paketler',    label: 'Paketler' },
    { id: 'program',     label: 'Program' },
    { id: 'bulusma',     label: 'Buluşma' },
    { id: 'bilgiler',    label: 'Katılım ve İade' },
    { id: 'yorumlar',    label: 'Yorumlar' },
    { id: 'sss',         label: 'SSS' }
  ];
  const SECTIONS = TUM_SECTIONS.filter(sec => document.getElementById(sec.id));

  const GALLERY_WIDTHS = { hero: 1200, thumb: 600, full: 1600 };
  const REVIEWS_STEP = 3;
  const DATE_CHIPS_SHORT = 6;
  const DATE_CHIPS_ALL = 18;

  const p = activity.pricing;
  const puan = ratingSummary(activity.ratingBreakdown);
  const temelFiyat = activityPriceFrom(activity);
  const listeFiyat = activityListPriceFrom(activity);
  const indirim = discountPercent(listeFiyat, temelFiyat);
  /* Her sabah uçuş var; tur takviminin gün filtresi boş geçiliyor ve
     fonksiyon bütün günleri döndürüyor. */
  const tarihler = nextDepartureDates(new Date(), [], DATE_CHIPS_ALL, p.leadDays);

  const state = {
    date: tarihler[0] || '',
    session: activity.sessions[0].id,
    pack: activity.packages[0].id,
    adults: 2,
    children: 0,
    addons: [],
    allDates: false,
    favorite: false,
    reviewStar: 0,
    reviewsShown: REVIEWS_STEP,
    photo: 0
  };

  /* Kontenjan canlı sorgu (sözleşme bölüm 6): cevap gelene kadar null,
     kalan yer satırları gizli, satış açık. Birim paket × seans:
     kontenjan satırının anahtarı paket id'si, tarih ve seansın saati. */
  let musaitlik = null;
  let satisEngeli = null;
  const seansSaati = (seansId) => saatAnahtari((activitySession(activity, seansId) || {}).time);
  const paketKalan = (paketId) => {
    const r = musaitlikKaydi(musaitlik, paketId, state.date, seansSaati(state.session));
    return r ? r.remaining : null;
  };

  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));
  const ic = (name) => '<span class="icon">' + tourSvg(name) + '</span>';

  /* WhatsApp logosu DOLU bir şekil; TOUR_ICONS'taki ikonlar çizgiyle
     çiziliyor. Dolgu sınıfla veriliyor, svg niteliğiyle değil —
     sunum nitelikleri CSS'e yenilir (docs/tur-sayfasi.md). */
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
    const foto = activity.gallery;
    const kalan = Math.max(0, foto.length - 5);
    return `
      <div class="tour-gallery-grid" role="group" aria-label="Aktivite fotoğrafları">
        ${foto.map((item, i) => `
          <button class="tour-gallery-cell${i >= 5 ? ' is-extra' : ''}" type="button"
                  data-photo="${i}" aria-label="${item.caption} — büyüt">
            <img src="${activityImage(item.key, i === 0 ? GALLERY_WIDTHS.hero : GALLERY_WIDTHS.thumb)}"
                 alt="${item.caption}"${i === 0 ? '' : ' loading="lazy"'}>
            ${i === 4 && kalan ? `<span class="tour-gallery-more">${ic('image')}+${kalan} fotoğraf</span>` : ''}
          </button>`).join('')}
      </div>
      <div class="tour-gallery-actions">
        <button class="tour-gallery-fav" type="button" id="tourGalleryFav"
                aria-pressed="false" aria-label="Favorilere ekle">${ic('heart')}</button>
        <button class="tour-gallery-share" type="button" id="tourGalleryShare"
                aria-label="Aktiviteyi paylaş">${ic('share')}</button>
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
          <span class="tour-chip solid">${activity.categoryShort}</span>
          ${activity.badges.map(b => `<span class="tour-chip">${ic(b.icon)}${b.label}</span>`).join('')}
        </div>
      </div>`;
  }

  function headMetaMarkup() {
    return `
      <a class="tour-head-rating" href="#yorumlar">
        <span class="tour-head-score">${ic('star')}${String(puan.average).replace('.', ',')}</span>
        <span class="tour-head-count">${formatNumberTR(puan.total)} değerlendirme</span>
      </a>
      <span class="tour-head-meta-item">${ic('mapPin')}${activity.area}</span>
      <span class="tour-head-meta-item">${ic('clock')}${activity.activityLabel}</span>
      <span class="tour-head-meta-item muted">Aktivite kodu ${activity.code}</span>`;
  }

  function factsMarkup() {
    return activity.facts.map(f => `
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
    const fazla = activity.description.slice(1);
    return blockHead('Genel bakış', activity.tagline) + `
      <ul class="tour-highlights">
        ${activity.highlights.map(h => `<li>${ic('check')}<span>${h}</span></li>`).join('')}
      </ul>
      <div class="tour-prose" id="tourProse">
        <p>${activity.description[0]}</p>
        <div class="tour-prose-rest" id="tourProseRest" hidden>
          ${fazla.map(t => `<p>${t}</p>`).join('')}
        </div>
      </div>
      ${fazla.length ? `<button class="tour-text-btn" type="button" id="tourProseToggle"
        aria-expanded="false" aria-controls="tourProseRest">Devamını oku${ic('chevDown')}</button>` : ''}`;
  }

  /* ---------------- paketler ----------------
     Oda kartlarının (otel sayfası) karşılığı: her kart hem bilgi hem
     SEÇİM. Durum tek — state.pack — iki yüzey onu gösteriyor. */
  function packCardMarkup(paket) {
    const secili = paket.id === state.pack;
    const indirimOran = discountPercent(paket.perPersonList, paket.perPerson);
    return `
      <article class="akt-paket${secili ? ' is-secili' : ''}" data-pack-card="${paket.id}">
        <div class="akt-paket-media">
          <img src="${activityImage(paket.key, GALLERY_WIDTHS.thumb)}" alt="${paket.name}" loading="lazy">
        </div>
        <div class="akt-paket-body">
          <div class="akt-paket-head">
            <h3>${paket.name}</h3>
            ${secili ? `<span class="akt-paket-secili">${ic('check')}Seçili</span>` : ''}
          </div>
          <div class="akt-paket-meta">
            <span>${ic('clock')}${paket.duration}</span>
            <span>${ic('users')}${paket.groupLabel}</span>
          </div>
          <ul class="akt-paket-ozellik">
            ${paket.features.map(f => `<li>${ic('check')}<span>${f}</span></li>`).join('')}
          </ul>
          <p class="akt-paket-not">${ic('info')}<span>${paket.note}</span></p>
          <div class="akt-paket-alt">
            <span class="akt-paket-fiyat">
              ${indirimOran > 0 ? `<span class="tour-price-was">${formatTRY(paket.perPersonList)}</span>` : ''}
              <strong>${formatTRY(paket.perPerson)}</strong>
              <span>${p.unitNote}</span>
            </span>
            <button class="tour-cta small${secili ? ' ghost' : ''}" type="button" data-pack-pick="${paket.id}">
              ${secili ? 'Rezervasyona git' : 'Bu paketi seç'}${ic('chevRight')}
            </button>
          </div>
          <p class="akt-paket-kalan" data-pack-left="${paket.id}"></p>
        </div>
      </article>`;
  }

  function packsMarkup() {
    return blockHead('Uçuş paketleri',
      `${activity.packages.length} paket · fark sepetteki yer ve uçuş süresi`)
      + `<div class="akt-paket-list" id="aktPaketList">
           ${activity.packages.map(packCardMarkup).join('')}
         </div>
         <p class="tour-note">${ic('info')}<span>Fiyatlar kişi başı ve KDV dahildir;
           manzara üç pakette de aynıdır. Çocuk tarifesi ${p.childAges} için geçerlidir.</span></p>`;
  }

  /* Kartlar yeniden çizilmiyor: yalnızca seçim rozeti, düğme metni ve
     kalan yer satırı güncelleniyor. Baştan innerHTML yazmak sayfanın
     kaydırma konumunu ve klavye odağını bozuyor. */
  function syncPackCards() {
    activity.packages.forEach(paket => {
      const kart = document.querySelector('[data-pack-card="' + paket.id + '"]');
      if (kart) kart.classList.toggle('is-secili', paket.id === state.pack);

      const basliklar = kart && kart.querySelector('.akt-paket-head');
      if (basliklar) {
        const eski = basliklar.querySelector('.akt-paket-secili');
        if (paket.id === state.pack && !eski) {
          basliklar.insertAdjacentHTML('beforeend',
            '<span class="akt-paket-secili">' + ic('check') + 'Seçili</span>');
        }
        if (paket.id !== state.pack && eski) eski.remove();
      }

      const btn = document.querySelector('[data-pack-pick="' + paket.id + '"]');
      if (btn) {
        btn.classList.toggle('ghost', paket.id === state.pack);
        btn.innerHTML = (paket.id === state.pack ? 'Rezervasyona git' : 'Bu paketi seç') + ic('chevRight');
      }

      const kalanEl = document.querySelector('[data-pack-left="' + paket.id + '"]');
      if (kalanEl) {
        const kalan = paketKalan(paket.id);
        kalanEl.hidden = kalan === null;
        kalanEl.className = 'akt-paket-kalan' + (kalan !== null && kalan <= 3 ? ' is-low' : '');
        kalanEl.innerHTML = kalan === null ? ''
          : kalan === 0 ? ic('bolt') + 'Seçili seansta <strong>bu paket dolu</strong>'
          : ic('bolt') + 'Seçili sabah <strong>' + kalan + ' kişilik</strong> yer kaldı';
      }
    });
  }

  /* ---------------- program ---------------- */
  function itineraryMarkup() {
    return blockHead('Sabahın programı',
      `${activity.itinerary.length} adım · toplam ${activity.durationLabel}`) + `
      <ol class="tour-timeline">
        ${activity.itinerary.map(stop => `
          <li class="tour-stop">
            <span class="tour-stop-time">${stop.time}</span>
            <div class="tour-stop-body">
              <div class="tour-stop-head">
                <h3>${stop.title}</h3>
                ${stop.duration ? `<span class="tour-stop-duration">${ic('clock')}${stop.duration}</span>` : ''}
                ${stop.badge ? `<span class="tour-stop-badge">${ic('check')}${stop.badge}</span>` : ''}
              </div>
              <p>${stop.text}</p>
            </div>
          </li>`).join('')}
      </ol>
      <p class="tour-note">${ic('sun')}<span>Saatler gün doğumuna göre her hafta kayar;
        kesin alım saati bir gün önce akşam mesajla teyit edilir.</span></p>`;
  }

  /* ---------------- buluşma ve alım ---------------- */
  function meetingMarkup() {
    const m = activity.meeting;
    return blockHead('Buluşma ve alım noktaları', m.dropoff) + `
      <div class="tour-meeting">
        <div class="tour-meeting-card">
          <span class="tour-meeting-pin">${tourSvg('mapPin')}</span>
          <div class="tour-meeting-body">
            <strong>${m.title}</strong>
            <p class="tour-meeting-address">${m.address}</p>
            <a class="tour-meeting-link" href="${m.mapUrl}" target="_blank" rel="noopener">
              Haritada aç ve yol tarifi al${ic('chevRight')}</a>
          </div>
        </div>
        <ol class="tour-pickups">
          ${m.points.map(pt => `
            <li>
              <span class="tour-pickup-time">${pt.time}</span>
              <span class="tour-pickup-body"><strong>${pt.name}</strong><span>${pt.detail}</span></span>
            </li>`).join('')}
        </ol>
        <p class="tour-note">${ic('info')}<span>${m.note}</span></p>
      </div>`;
  }

  /* ---------------- katılım şartları, hava ve iade ----------------
     Hava iptali misafir iptalinden AYRI bir kutuda: aynı tabloya
     konsaydı "son 24 saat: iade yok" satırının yanında durur ve
     koşulsuz tam iade olduğu kaybolurdu. */
  function infoMarkup() {
    const iptal = activity.cancellation;
    const ornek = Number(iptal.exampleTotal) || temelFiyat;
    const basamak = iptal.tiers.slice().sort((a, b) => b.minHours - a.minHours);
    const havaIade = weatherRefundAmount(activity, ornek);

    return blockHead('Katılım şartları ve iade', 'Uçuştan önce iki dakikada okunur.') + `
      <div class="akt-sart-grid">
        ${activity.requirements.map(k => `
          <div class="tour-info-card">
            <h3>${ic(k.icon)}${k.title}</h3>
            <p>${k.text}</p>
          </div>`).join('')}
      </div>

      <div class="tour-info-grid">
        <div class="tour-info-card">
          <h3>${ic('sun')}Yanınıza alın</h3>
          <ul class="tour-dot-list">${activity.bring.map(b => `<li>${b}</li>`).join('')}</ul>
        </div>
        <div class="tour-info-card">
          <h3>${ic('info')}Bilmeniz gerekenler</h3>
          <ul class="tour-dot-list">${activity.important.map(b => `<li>${b}</li>`).join('')}</ul>
        </div>
      </div>

      <div class="akt-hava">
        <span class="akt-hava-ikon">${tourSvg('refresh')}</span>
        <div class="akt-hava-body">
          <strong>Hava koşulu nedeniyle uçulmazsa: ${formatTRY(havaIade)} iade</strong>
          <p>${iptal.note}</p>
        </div>
      </div>

      <div class="tour-refund">
        <h3>${ic('calendar')}Misafir iptali</h3>
        <p class="tour-refund-lead">Uçuş saatine kalan süreye göre iade oranı.
          Sağdaki tutarlar ${formatTRY(ornek)} tutarında tek kişilik bir rezervasyon içindir.</p>
        <ul class="tour-refund-list">
          ${basamak.map(t => {
            const iadeTutar = refundAmount(ornek, t.minHours, iptal.tiers);
            const oran = Math.round((Number(t.rate) || 0) * 100);
            return `
            <li class="tour-refund-row${oran === 100 ? ' full' : (oran === 0 ? ' none' : '')}">
              <span class="tour-refund-when"><strong>${t.label}</strong><span>${t.text}</span></span>
              <span class="tour-refund-amount"><strong>%${oran}</strong><span>${formatTRY(iadeTutar)}</span></span>
            </li>`;
          }).join('')}
        </ul>
        <p class="tour-note">${ic('shield')}<span>Hava nedeniyle yapılamayan uçuş misafir
          iptali sayılmaz; yukarıdaki kademeler yalnızca sizin iptal ettiğiniz durumda işler.</span></p>
      </div>`;
  }

  /* ---------------- yorumlar ---------------- */
  function reviewsMarkup() {
    const yildizSayilari = [5, 4, 3, 2, 1].map(s => filterReviews(activity.reviews, s).length);
    const cipler = [{ star: 0, label: 'Tümü', count: activity.reviews.length }]
      .concat([5, 4, 3, 2, 1].map((s, i) => ({ star: s, label: s + ' yıldız', count: yildizSayilari[i] })))
      .filter(c => c.count > 0);

    return blockHead('Uçanlar ne diyor',
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
          ${activity.ratingAspects.map(a => `
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
        <span class="tour-review-verified">${ic('shield')}Doğrulanmış katılımcı</span>
      </article>`;
  }

  function renderReviews() {
    const liste = filterReviews(activity.reviews, state.reviewStar);
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
        ${activity.faq.map((f, i) => `
          <div class="tour-faq-item">
            <button class="tour-faq-q" type="button" aria-expanded="false" aria-controls="tourFaqA${i}">
              <span>${f.q}</span>${ic('chevDown')}
            </button>
            <div class="tour-faq-a" id="tourFaqA${i}" hidden><p>${f.a}</p></div>
          </div>`).join('')}
      </div>`;
  }

  /* Benzer içerik başka TÜRDEN de olabiliyor (tur, otel, aktivite); bu
     yüzden adres kayıtta doğrudan yazılı, tür öneki burada üretilmiyor. */
  function similarMarkup() {
    return `
      <div class="tour-block-head"><h2>Aynı bölgede</h2><p>Kapadokya’da aynı sabaha ekleyebileceğiniz planlar.</p></div>
      <div class="tour-similar-grid">
        ${activity.similar.map(s => `
          <a class="tour-similar-card" href="${s.href ? KOK + s.href : KOK + 'index.html#aktiviteler'}">
            <span class="tour-similar-media">
              <img src="${activityImage(s.key, GALLERY_WIDTHS.thumb)}" alt="${s.title}" loading="lazy">
              <span class="tour-similar-rating">${ic('star')}${s.rating}</span>
            </span>
            <span class="tour-similar-body">
              <strong>${s.title}</strong>
              <span class="tour-similar-meta">${s.meta}</span>
              <span class="tour-similar-price">${formatTRY(s.price)}<span>${s.unit}</span></span>
            </span>
          </a>`).join('')}
      </div>`;
  }

  function tagHref(t) {
    return String(t.href).charAt(0) === '#' ? t.href : KOK + t.href;
  }

  function tagsMarkup() {
    const etiketler = activity.tags || [];
    if (!etiketler.length) return '';
    return `
      <div class="tour-block-head"><h2>Sayfa etiketleri</h2><p>Bu aktiviteyle ilgili bölümler ve yakın kategoriler.</p></div>
      <ul class="seo-chip-list tour-tag-list">
        ${etiketler.map(t => `<li><a class="seo-chip" href="${tagHref(t)}">${t.label}</a></li>`).join('')}
      </ul>`;
  }

  /* ---------------- rezervasyon kartı ---------------- */
  const bookingEl = document.createElement('section');
  bookingEl.className = 'tour-booking';
  bookingEl.id = 'tourBooking';
  bookingEl.setAttribute('aria-label', 'Rezervasyon');

  function dateChipsMarkup() {
    const liste = tarihler.slice(0, state.allDates ? DATE_CHIPS_ALL : DATE_CHIPS_SHORT);
    return liste.map(iso => {
      const parca = trDateParts(iso);
      const on = iso === state.date;
      /* O sabah bütün paketler ve seanslar doluysa gün seçilemiyor. */
      const dolu = tarihDoluMu(musaitlik, iso);
      return `
        <button class="tour-date-chip${on ? ' active' : ''}${dolu ? ' is-dolu' : ''}" type="button"
                data-date="${iso}" aria-pressed="${on}"${dolu ? ' disabled' : ''}
                aria-label="${formatTrDate(iso)} sabahı${dolu ? ' — dolu' : ''}">
          <span class="tour-date-day">${parca.hafta}</span>
          <strong>${parca.gun}</strong>
          <span class="tour-date-month">${dolu ? 'dolu' : parca.ay}</span>
        </button>`;
    }).join('');
  }

  function sessionChipsMarkup() {
    return activity.sessions.map(s => {
      /* Seçili sabah bu seansın bütün paketleri doluysa seans seçilemiyor. */
      const dolu = tarihDoluMu(musaitlik, state.date, saatAnahtari(s.time));
      return `
      <button class="tour-city-chip akt-seans-chip${s.id === state.session ? ' active' : ''}${dolu ? ' is-dolu' : ''}" type="button"
              data-session="${s.id}" aria-pressed="${s.id === state.session ? 'true' : 'false'}"${dolu ? ' disabled' : ''}>
        <strong>${s.label} · ${s.time}</strong>
        <span>${s.note}</span>
        <span class="tour-city-fee">${Number(s.fee) === 0
          ? 'Fark yok'
          : (Number(s.fee) < 0
            ? formatTRY(Math.abs(Number(s.fee))) + ' indirim / kişi'
            : '+' + formatTRY(Number(s.fee)) + ' / kişi')}</span>
      </button>`;
    }).join('');
  }

  function packChipsMarkup() {
    return activity.packages.map(paket => `
      <button class="tour-city-chip akt-paket-chip${paket.id === state.pack ? ' active' : ''}" type="button"
              data-pack="${paket.id}" aria-pressed="${paket.id === state.pack ? 'true' : 'false'}">
        <strong>${paket.name}</strong>
        <span>${paket.duration} · ${paket.groupLabel}</span>
        <span class="tour-city-fee">${formatTRY(paket.perPerson)} / kişi</span>
      </button>`).join('');
  }

  const PARTY_ROWS = [
    { key: 'adults',   label: 'Yetişkin', note: '12 yaş ve üzeri' },
    { key: 'children', label: 'Çocuk',    note: p.childAges }
  ];

  function partyRowsMarkup() {
    return PARTY_ROWS.map(row => `
      <div class="tour-party-row" data-party="${row.key}">
        <span class="tour-party-body">
          <strong>${row.label}</strong>
          <span data-row-note="${row.key}">${row.note}</span>
        </span>
        <span class="tour-stepper">
          <button class="tour-step-btn" type="button" data-step="-1" data-target="${row.key}"
                  aria-label="${row.label} sayısını azalt">${tourSvg('minus')}</button>
          <output class="tour-step-value" data-count="${row.key}">${state[row.key]}</output>
          <button class="tour-step-btn" type="button" data-step="1" data-target="${row.key}"
                  aria-label="${row.label} sayısını artır">${tourSvg('plus')}</button>
        </span>
      </div>`).join('');
  }

  function addonRowsMarkup() {
    return activity.addons.map(a => `
      <label class="tour-addon" for="addon-${a.id}">
        <input type="checkbox" id="addon-${a.id}" data-addon="${a.id}">
        <span class="tour-addon-box">${tourSvg('check')}</span>
        <span class="tour-addon-body">
          <strong>${a.label}</strong>
          <span>${a.text}</span>
        </span>
        <span class="tour-addon-price" data-addon-price="${a.id}">
          +${formatTRY(a.price)}<span>${a.per === 'guest' ? '/kişi' : '/rezervasyon'}</span>
        </span>
      </label>`).join('');
  }

  function summaryMarkup(hesap) {
    const satir = (l) => `
      <li class="${l.kind}"><span>${l.label}</span><span>${formatTRY(l.amount)}</span></li>`;

    const kisiler = [
      hesap.adults + ' yetişkin',
      hesap.children ? hesap.children + ' çocuk' : ''
    ].filter(Boolean).join(' · ');

    return `
      <ul class="tour-sum-lines">${hesap.lines.map(satir).join('')}</ul>
      ${hesap.saving > 0 ? `<p class="tour-sum-save">${ic('sparkle')}Liste fiyatına göre
        <strong>${formatTRY(hesap.saving)}</strong> avantaj</p>` : ''}
      <div class="tour-sum-total">
        <span>Toplam</span>
        <strong>${formatTRY(hesap.total)}</strong>
      </div>
      <p class="tour-sum-note">KDV dahil · ${kisiler} · ${formatTrDate(state.date)}</p>`;
  }

  function bookingMarkup() {
    return `
      <div class="tour-booking-top">
        <div class="tour-price">
          ${indirim > 0 ? `<span class="tour-price-was">${formatTRY(listeFiyat)}</span>` : ''}
          <strong class="tour-price-now">${formatTRY(temelFiyat)}</strong>
          <span class="tour-price-unit">${p.unitNote}</span>
          ${indirim > 0 ? `<span class="tour-price-off">%${indirim} indirim</span>` : ''}
        </div>
        <p class="tour-booking-social">${ic('sparkle')}Son 24 saatte
          ${activity.social.viewedLast24h} kişi bu aktiviteyi görüntüledi · bu hafta
          ${activity.social.bookedThisWeek} rezervasyon</p>
      </div>

      <div class="tour-booking-field">
        <div class="tour-field-head">
          <span class="tour-field-label">${ic('calendar')}Uçuş sabahı</span>
          <button class="tour-text-btn small" type="button" id="tourAllDates"
                  aria-expanded="false">Tüm tarihler</button>
        </div>
        <div class="tour-date-chips" id="tourDateChips" role="group"
             aria-label="Uçuş tarihleri">${dateChipsMarkup()}</div>
        <p class="tour-date-note">${ic('sun')}${p.operatingNote}</p>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('clock')}Kalkış</span>
        <div class="tour-city-chips" role="group" aria-label="Kalkış seansı">${sessionChipsMarkup()}</div>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('bolt')}Paket</span>
        <div class="tour-city-chips" role="group" aria-label="Uçuş paketi">${packChipsMarkup()}</div>
        <div class="tour-seats" id="tourSeats"></div>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('users')}Kişi sayısı</span>
        <div class="tour-party">${partyRowsMarkup()}</div>
        <p class="tour-party-limit" id="tourPartyLimit"></p>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('plus')}Ek hizmetler</span>
        <div class="tour-addons">${addonRowsMarkup()}</div>
      </div>

      <div class="tour-summary" id="tourSummary"></div>

      <button class="tour-cta" type="button" id="tourReserve">
        Rezervasyon yap${ic('chevRight')}</button>

      <ul class="tour-booking-trust">
        ${activity.trust.map(t => `<li>${ic(t.icon)}<span>${t.text}</span></li>`).join('')}
      </ul>

      <div class="tour-booking-contact">
        <a class="tour-booking-help" href="${CONTACT.phoneHref}">
          ${ic('phone')}<span><strong>${CONTACT.phoneLabel}</strong>${CONTACT.hours}</span></a>
        <a class="tour-booking-help" href="${CONTACT.whatsappHref}"
           target="_blank" rel="noopener">
          ${whatsappIkon()}<span><strong>WhatsApp'tan yaz</strong>${destekDurumu()}</span></a>
      </div>`;
  }

  /* Kalan yer: kontenjan cevabından, seçili paket ve seans için. İstenen:
     sepetteki kişi sayısı (yetişkin + çocuk). */
  function syncSeats(hesap) {
    const paket = hesap.pack || activity.packages[0];
    const durum = kontenjanDurumu(paketKalan(paket.id), hesap.adults + hesap.children, 3);
    satisEngeli = (durum.durum === 'doldu' || durum.durum === 'yetersiz') ? durum.durum : null;
    const dugme = document.getElementById('tourReserve');
    if (dugme) dugme.disabled = !!satisEngeli;

    const el = document.getElementById('tourSeats');
    if (!el) return;
    el.hidden = durum.durum === 'bilinmiyor';
    if (el.hidden) { el.innerHTML = ''; return; }
    const kapasite = Math.max(1, Number(paket.capacity) || 1);
    const dolu = Math.max(0, Math.min(100, Math.round(((kapasite - durum.kalan) / kapasite) * 100)));
    el.classList.toggle('is-low', durum.durum !== 'var');
    const metin = {
      doldu: 'Bu seansta <strong>yer kalmadı</strong> · başka bir seans, paket veya gün seçin',
      yetersiz: 'Bu seansta en fazla <strong>' + durum.kalan + ' kişilik</strong> yer var'
    }[durum.durum] || 'Bu sabah <strong>' + durum.kalan + ' kişilik</strong> yer kaldı';
    el.innerHTML = `
      <span class="tour-seats-bar"><span class="tour-seats-fill" style="width:${dolu}%"></span></span>
      <span class="tour-seats-text">${ic('users')}<span>${metin}</span></span>`;
  }

  function syncBooking() {
    const hesap = calcActivityTotal(activity, state);
    /* clampActivityParty sınırları uyguluyor; ekrandaki sayı hesapla
       aynı kalsın. */
    state.adults = hesap.adults;
    state.children = hesap.children;

    bookingEl.querySelectorAll('[data-date]').forEach(btn => {
      const on = btn.getAttribute('data-date') === state.date;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    ['adults', 'children'].forEach(key => {
      const out = bookingEl.querySelector('[data-count="' + key + '"]');
      if (out) out.textContent = String(state[key]);
    });

    bookingEl.querySelectorAll('[data-step]').forEach(btn => {
      const hedef = btn.getAttribute('data-target');
      const yon = Number(btn.getAttribute('data-step'));
      const deneme = Object.assign({}, state);
      deneme[hedef] = state[hedef] + yon;
      const sonuc = clampActivityParty(activity, deneme);
      btn.disabled = sonuc[hedef] === state[hedef];
    });

    const cocukNot = bookingEl.querySelector('[data-row-note="children"]');
    if (cocukNot) {
      cocukNot.textContent = p.childAges + ' · her yetişkine en fazla '
        + p.childrenPerAdult + ' çocuk';
    }

    const limitEl = document.getElementById('tourPartyLimit');
    if (limitEl) {
      limitEl.textContent = hesap.guests >= (hesap.pack.capacity < p.maxGuests ? hesap.pack.capacity : p.maxGuests)
        ? 'Tek rezervasyonda en fazla ' + Math.min(hesap.pack.capacity, p.maxGuests)
          + ' kişi seçilebilir. Daha kalabalık gruplar için destek hattını arayın.'
        : p.minAge + ' yaş altı katılamaz · refakatsiz çocuk kabul edilmiyor';
    }

    bookingEl.querySelectorAll('[data-session]').forEach(btn => {
      const on = btn.getAttribute('data-session') === state.session;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      /* Seansın doluluğu seçili güne bağlı: gün değişince yeniden bakılıyor. */
      const dolu = tarihDoluMu(musaitlik, state.date, seansSaati(btn.getAttribute('data-session')));
      btn.classList.toggle('is-dolu', dolu);
      btn.disabled = dolu;
    });
    bookingEl.querySelectorAll('[data-pack]').forEach(btn => {
      const on = btn.getAttribute('data-pack') === state.pack;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    activity.addons.forEach(a => {
      const fiyatEl = bookingEl.querySelector('[data-addon-price="' + a.id + '"]');
      if (fiyatEl && a.per === 'guest') {
        fiyatEl.innerHTML = '+' + formatTRY((Number(a.price) || 0) * hesap.guests)
          + '<span>' + hesap.guests + ' kişi</span>';
      }
      const kutu = bookingEl.querySelector('[data-addon="' + a.id + '"]');
      if (kutu) kutu.checked = state.addons.indexOf(a.id) !== -1;
    });

    const ozet = document.getElementById('tourSummary');
    if (ozet) ozet.innerHTML = summaryMarkup(hesap);

    syncSeats(hesap);
    syncPackCards();
    syncStickyBar(hesap);
  }

  /* ---------------- yapışkan alt şerit (mobil) ---------------- */
  function syncStickyBar(hesap) {
    const bar = document.getElementById('tourStickyBar');
    if (!bar) return;
    const toplam = hesap || calcActivityTotal(activity, state);
    bar.innerHTML = `
      <div class="tour-sticky-info">
        <span class="tour-sticky-price">
          <strong>${formatTRY(toplam.total)}</strong>
          <span class="tour-sticky-guests">/ ${toplam.guests} kişi</span>
        </span>
        <span class="tour-sticky-date">${formatTrDateRangeShort(state.date, '')}</span>
      </div>
      <button class="tour-cta small" type="button" id="tourStickyCta"${satisEngeli ? ' disabled' : ''}>Rezervasyon yap</button>`;
  }

  /* ---------------- fotoğraf büyütme (lightbox) ---------------- */
  let sonOdak = null;
  let kilitliY = 0;
  let kilitSayaci = 0;

  /* Katman açıkken arka sayfa kaymasın. iOS Safari html'deki
     "overflow: hidden" kuralını dokunmatik kaydırmada uygulamıyor;
     çalışan yol GÖVDEYİ SABİTLEMEK. Sayaç iki katman üst üste
     açıldığında konumun sıfırlanmaması için. Ölçüm ve gerekçenin
     tamamı docs/tur-sayfasi.md içinde. */
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
            ${activity.gallery.map((g, i) => `
              <button class="tour-lb-thumb" type="button" data-lb-go="${i}" aria-label="${g.caption}">
                <img src="${activityImage(g.key, 300)}" alt="" loading="lazy">
              </button>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function showPhoto(index) {
    const toplam = activity.gallery.length;
    state.photo = ((Math.round(Number(index) || 0) % toplam) + toplam) % toplam;
    const foto = activity.gallery[state.photo];
    const img = document.getElementById('tourLbImg');
    if (img) {
      img.src = activityImage(foto.key, GALLERY_WIDTHS.full);
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
    const hesap = calcActivityTotal(activity, state);
    const satir = (label, value) => `<li><span>${label}</span><strong>${value}</strong></li>`;

    sheet.innerHTML = `
      <div class="tour-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="tourSheetTitle">
        <div class="tour-sheet-head">
          <h2 id="tourSheetTitle">Rezervasyon özeti</h2>
          <button class="tour-icon-btn" type="button" data-sheet="close" aria-label="Kapat">${ic('close')}</button>
        </div>
        <p class="tour-sheet-tour">${activity.title}</p>
        <ul class="tour-sheet-lines">
          ${satir('Tarih', formatTrDate(state.date))}
          ${satir('Kalkış', hesap.session.label + ' · ' + hesap.session.time)}
          ${satir('Paket', hesap.pack.name + ' · ' + hesap.pack.duration)}
          ${satir('Kişi', hesap.adults + ' yetişkin'
            + (hesap.children ? ' · ' + hesap.children + ' çocuk' : ''))}
          ${hesap.addons.map(a => satir(a.label, formatTRY(a.amount))).join('')}
          ${satir('Ödenecek tutar', formatTRY(hesap.total))}
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

      /* Kaydırma yalnızca aktif sekme değiştiğinde: her karede
         scrollTo({behavior:'smooth'}) çağırmak animasyonu baştan
         başlatıyor ve menü takılarak sürükleniyor. */
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
    const toplam = activity.gallery.length;
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

      /* Paket kartındaki düğme: seçili değilse seçer, seçiliyse
         rezervasyon kartına götürür. Seçer seçmez sayfayı yukarı
         fırlatmak, listede kalıp diğer paketlere bakmak isteyeni
         rahatsız ediyordu. */
      const paketBtn = e.target.closest('[data-pack-pick]');
      if (paketBtn) {
        const id = paketBtn.getAttribute('data-pack-pick');
        if (id === state.pack) { scrollToBooking(); return; }
        state.pack = id;
        syncBooking();
        toast(activityPackage(activity, id).name + ' seçildi');
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
      const veri = { title: activity.title, text: activity.tagline, url: window.location.href };
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
        syncBooking();
        return;
      }

      const adim = e.target.closest('[data-step]');
      if (adim) {
        const hedef = adim.getAttribute('data-target');
        state[hedef] = (Number(state[hedef]) || 0) + (Number(adim.getAttribute('data-step')) || 0);
        syncBooking();
        return;
      }

      const seans = e.target.closest('[data-session]');
      if (seans) {
        state.session = seans.getAttribute('data-session');
        syncBooking();
        return;
      }

      const paket = e.target.closest('[data-pack]');
      if (paket) {
        state.pack = paket.getAttribute('data-pack');
        syncBooking();
        return;
      }

      const tumTarih = e.target.closest('#tourAllDates');
      if (tumTarih) {
        state.allDates = !state.allDates;
        const kap = document.getElementById('tourDateChips');
        if (kap) kap.innerHTML = dateChipsMarkup();
        tumTarih.textContent = state.allDates ? 'Daha az tarih' : 'Tüm tarihler';
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
  fill('paketler', packsMarkup());
  fill('program', itineraryMarkup());
  fill('bulusma', meetingMarkup());
  fill('bilgiler', infoMarkup());
  fill('yorumlar', reviewsMarkup());
  fill('sss', faqMarkup());
  fill('tourSimilar', similarMarkup());
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

  /* Kontenjan: takvimde görünebilecek bütün sabahlar için tek sorgu.
     Varsayılan gün tamamen doluysa ilk müsait güne geçiliyor. */
  MolaVeri.musaitlik('activity', activity.slug, { from: tarihler[0], to: tarihler[tarihler.length - 1] })
    .then(cevap => {
      musaitlik = cevap;
      if (tarihDoluMu(musaitlik, state.date)) {
        const ilk = tarihler.find(iso => !tarihDoluMu(musaitlik, iso));
        if (ilk) state.date = ilk;
      }
      const kap = document.getElementById('tourDateChips');
      if (kap) kap.innerHTML = dateChipsMarkup();
      syncBooking();
    })
    .catch(() => { /* Kontenjan bilinmiyor: satırlar gizli, satış açık. */ });

})();
