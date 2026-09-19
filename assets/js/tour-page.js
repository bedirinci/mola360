/* ---------------- tur içerik sayfası: işaretleme ve etkileşimler ----------------
   Veri ve saf hesaplar tour-data.js'te; bu dosya onları işaretlemeye çevirir
   ve davranışları bağlar. Buraya sayfada görünen metin yazılmaz.

   app.js yüklenmiyor: o dosya anasayfanın DOM'una (top10Scroll, catScroll,
   cardSections) doğrudan bağlı ve tur sayfasında ilk satırında patlar.
   Bu yüzden ikon seti ve biçimlendirme tour-data.js'te kendi başına duruyor.
   ui.js yüklenir — içindeki tüm bloklar eleman yoksa sessizce çıkar ve
   görsel yedek mekanizması (bozuk URL -> yer tutucu) burada da çalışır.

   Aynı dosya iki tur tipine hizmet eder:
     daily  günübirlik — saat saat program, kişi başı tek tarife
     stay   konaklamalı — gün gün program, konaklama bloğu, oda bazlı fiyat
   Ayrım tour.type ile yapılır; ortak olan her şey (galeri, künye, yorumlar,
   SSS, iade tablosu) tek kod yolundan geçer. */
(function () {

  /* Sayfa /tur/<slug>/ adresinde duruyor, slug adresten okunuyor.
     Eski tur.html?tur=... adresi de çalışmaya devam etsin diye sorgu
     dizisi yedek olarak kalıyor. */
  const tour = resolveTour(
    tourSlugFromPath(window.location.pathname) || tourSlugFromQuery(window.location.search)
  );
  if (!tour) return;

  const stay = tour.type === 'stay';

  /* Sayfa kökü: /tur/<slug>/index.html iki dizin içeride olduğu için
     anasayfaya ve diğer turlara giden bağlantılar buradan kurulur.
     Değer sayfanın <body data-root="..."> niteliğinden gelir; tahmin
     edilmez, böylece depo alt dizinde yayınlansa da doğru kalır. */
  const KOK = (document.body && document.body.getAttribute('data-root')) || '';

  /* Bölüm menüsü ve kaydırma takibi bu listeden beslenir. Sayfada
     karşılığı OLMAYAN kayıt listeden düşer: konaklamalı turun
     "Konaklama" bölümü var, günübirliğin yok, ikisi de aynı listeyi
     kullanabiliyor. tests/tour.test.js her tur tipinin gerektirdiği
     bölümlerin sayfasında bulunduğunu doğrular. */
  const TUM_SECTIONS = [
    { id: 'genel-bakis',   label: 'Genel Bakış' },
    { id: 'program',       label: 'Program' },
    { id: 'konaklama',     label: 'Konaklama' },
    { id: 'dahil-olanlar', label: 'Dahil Olanlar' },
    { id: 'bulusma',       label: 'Buluşma' },
    { id: 'bilgiler',      label: 'Önemli Bilgiler' },
    { id: 'yorumlar',      label: 'Yorumlar' },
    { id: 'sss',           label: 'SSS' }
  ];
  const SECTIONS = TUM_SECTIONS.filter(sec => document.getElementById(sec.id));

  const GALLERY_WIDTHS = { hero: 1200, thumb: 600, full: 1600 };
  const REVIEWS_STEP = 3;
  const DATE_CHIPS_SHORT = 6;
  const DATE_CHIPS_ALL = 18;

  const p = tour.pricing;
  const puan = ratingSummary(tour.ratingBreakdown);
  const temelFiyat = basePrice(tour);
  const listeFiyat = baseListPrice(tour);
  const indirim = discountPercent(listeFiyat, temelFiyat);
  const tarihler = nextDepartureDates(new Date(), p.departureDays, DATE_CHIPS_ALL, p.leadDays);
  const sehirler = tour.departureCities || [];

  const state = {
    date: tarihler[0] || '',
    adults: 2,
    children: 0,
    infants: 0,
    addons: [],
    /* Konaklamalı tura özel: kalkış şehri ve tek kişilik oda tercihi. */
    city: sehirler.length ? sehirler[0].id : '',
    singleRoom: false,
    allDates: false,
    reviewStar: 0,
    reviewsShown: REVIEWS_STEP,
    photo: 0
  };

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));
  const ic = (name) => '<span class="icon">' + tourSvg(name) + '</span>';

  function fill(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
    return el;
  }

  /* ---------------- galeri ----------------
     Hücreler tek düz liste: masaüstünde ızgara (ilk kare iki satır
     kaplar, beşinciden sonrası gizlenir), mobilde tam genişlikte
     yatay kaydırmalı şerit. İç içe iki kapsayıcı olsaydı mobilde tek
     bir şerit kurulamazdı. */
  function galleryMarkup() {
    const foto = tour.gallery;
    const kalan = Math.max(0, foto.length - 5);
    return `
      <div class="tour-gallery-grid" role="group" aria-label="Tur fotoğrafları">
        ${foto.map((item, i) => `
          <button class="tour-gallery-cell${i >= 5 ? ' is-extra' : ''}" type="button"
                  data-photo="${i}" aria-label="${item.caption} — büyüt">
            <img src="${tourImage(item.key, i === 0 ? GALLERY_WIDTHS.hero : GALLERY_WIDTHS.thumb)}"
                 alt="${item.caption}"${i === 0 ? '' : ' loading="lazy"'}>
            ${i === 4 && kalan ? `<span class="tour-gallery-more">${ic('image')}+${kalan} fotoğraf</span>` : ''}
          </button>`).join('')}
      </div>
      <span class="tour-gallery-count" id="tourGalleryCount" aria-hidden="true"></span>
      <button class="tour-gallery-all" type="button" data-photo="0">
        ${ic('camera')}Tüm fotoğraflar<span class="count">${foto.length}</span>
      </button>`;
  }

  /* ---------------- başlık bloğu ---------------- */
  function headlineMarkup() {
    return `
      <div class="tour-head-row">
        <div class="tour-head-chips">
          <span class="tour-chip solid">${tour.category}</span>
          ${tour.badges.map(b => `<span class="tour-chip">${ic(b.icon)}${b.label}</span>`).join('')}
        </div>
        <div class="tour-head-actions">
          <button class="tour-icon-btn" type="button" id="tourFavBtn"
                  aria-pressed="false" aria-label="Favorilere ekle">${ic('heart')}</button>
          <button class="tour-icon-btn" type="button" id="tourShareBtn"
                  aria-label="Turu paylaş">${ic('share')}</button>
        </div>
      </div>`;
  }

  function headMetaMarkup() {
    return `
      <a class="tour-head-rating" href="#yorumlar">
        <span class="tour-head-score">${ic('star')}${String(puan.average).replace('.', ',')}</span>
        <span class="tour-head-count">${formatNumberTR(puan.total)} değerlendirme</span>
      </a>
      <span class="tour-head-meta-item">${ic('mapPin')}${tour.area}</span>
      <span class="tour-head-meta-item">${ic('clock')}${p.startTime} kalkış · ${tour.durationLabel}</span>
      <span class="tour-head-meta-item muted">Tur kodu ${tour.code}</span>`;
  }

  function factsMarkup() {
    return tour.facts.map(f => `
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
    const fazla = tour.description.slice(1);
    return blockHead('Genel bakış', tour.tagline) + `
      <ul class="tour-highlights">
        ${tour.highlights.map(h => `<li>${ic('check')}<span>${h}</span></li>`).join('')}
      </ul>
      <div class="tour-prose" id="tourProse">
        <p>${tour.description[0]}</p>
        <div class="tour-prose-rest" id="tourProseRest" hidden>
          ${fazla.map(t => `<p>${t}</p>`).join('')}
        </div>
      </div>
      ${fazla.length ? `<button class="tour-text-btn" type="button" id="tourProseToggle"
        aria-expanded="false" aria-controls="tourProseRest">Devamını oku${ic('chevDown')}</button>` : ''}`;
  }

  /* Günübirlik tur: saat saat duraklar. */
  function dailyItineraryMarkup() {
    return blockHead('Günün programı',
      `${tour.itinerary.length} durak · toplam ${tour.durationLabel}`) + `
      <ol class="tour-timeline">
        ${tour.itinerary.map(stop => `
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
      </ol>`;
  }

  /* Konaklamalı tur: gün gün. Saat yerine "1. GÜN" rozeti, her günün
     altında o gün dahil olan öğünler ve nerede kalındığı. Saat saat
     dökmek dört günlük bir programı okunmaz hâle getiriyor. */
  function stayProgramMarkup() {
    const ogun = (gunler) => (gunler || []).filter(m => m && m !== '—');
    return blockHead('Gün gün program',
      `${tour.days} gün · ${tour.nights} gece · ${tour.program.length} günlük akış`) + `
      <ol class="tour-days">
        ${tour.program.map(gun => {
          const ogunler = ogun(gun.meals);
          return `
          <li class="tour-day">
            <span class="tour-day-no"><strong>${gun.day}</strong><span>gün</span></span>
            <div class="tour-day-body">
              <h3>${gun.title}</h3>
              <p>${gun.text}</p>
              <div class="tour-day-tags">
                ${ogunler.length
                  ? ogunler.map(m => `<span class="tour-stop-badge">${ic('food')}${m} dahil</span>`).join('')
                  : `<span class="tour-stop-duration">${ic('food')}Öğün dahil değil</span>`}
                ${gun.overnight && gun.overnight !== '—'
                  ? `<span class="tour-stop-duration">${ic('home')}Konaklama: ${gun.overnight}</span>`
                  : `<span class="tour-stop-duration">${ic('bus')}Dönüş günü</span>`}
              </div>
            </div>
          </li>`;
        }).join('')}
      </ol>`;
  }

  function itineraryMarkup() {
    return stay ? stayProgramMarkup() : dailyItineraryMarkup();
  }

  /* ---------------- konaklama (yalnızca konaklamalı tur) ---------------- */
  function accommodationMarkup() {
    const k = tour.accommodation;
    if (!k) return '';
    return blockHead('Konaklama', `${tour.nights} gece · ${k.board}`) + `
      ${k.hotels.map(h => `
        <div class="tour-hotel">
          <span class="tour-hotel-icon">${tourSvg('home')}</span>
          <div class="tour-hotel-body">
            <div class="tour-hotel-head">
              <strong>${h.name}</strong>
              <span class="tour-hotel-stars" aria-label="${h.stars} yıldız">
                ${Array.from({ length: h.stars }, () => ic('star')).join('')}
              </span>
            </div>
            <p class="tour-hotel-area">${ic('mapPin')}${h.area} · ${h.nights} gece</p>
            <p>${h.note}</p>
          </div>
        </div>`).join('')}

      <div class="tour-room-grid">
        ${k.rooms.map(o => `
          <div class="tour-room">
            <strong>${o.label}</strong>
            <span>${o.text}</span>
          </div>`).join('')}
      </div>

      <ul class="tour-board-facts">
        <li>${ic('food')}<span><strong>${k.board}</strong>${k.boardNote}</span></li>
        <li>${ic('clock')}<span><strong>Giriş ${k.checkIn} · Çıkış ${k.checkOut}</strong>Otel kuralı; erken giriş müsaitliğe bağlı.</span></li>
      </ul>`;
  }

  function includedMarkup() {
    return blockHead('Fiyata dahil olanlar ve olmayanlar',
      'Ek seçenekleri rezervasyon kartından ekleyebilirsiniz.') + `
      <div class="tour-included-grid">
        <div class="tour-included-col yes">
          <h3>${ic('check')}Dahil</h3>
          <ul>${tour.included.map(i => `<li>${ic('check')}<span>${i}</span></li>`).join('')}</ul>
        </div>
        <div class="tour-included-col no">
          <h3>${ic('close')}Dahil değil</h3>
          <ul>${tour.excluded.map(i => `<li>${ic('close')}<span>${i}</span></li>`).join('')}</ul>
        </div>
      </div>`;
  }

  function meetingMarkup() {
    const m = tour.meeting;
    return blockHead('Buluşma ve biniş noktaları', m.dropoff) + `
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

  function infoMarkup() {
    const iptal = tour.cancellation;
    const ornek = Number(iptal.exampleTotal) || p.adult;
    const basamak = iptal.tiers.slice().sort((a, b) => b.minHours - a.minHours);

    return blockHead('Önemli bilgiler', 'Yola çıkmadan önce iki dakikada okunur.') + `
      <div class="tour-info-grid">
        <div class="tour-info-card">
          <h3>${ic('sun')}Yanınıza alın</h3>
          <ul class="tour-dot-list">${tour.bring.map(b => `<li>${b}</li>`).join('')}</ul>
        </div>
        <div class="tour-info-card">
          <h3>${ic('info')}Katılım koşulları</h3>
          <ul class="tour-dot-list">${tour.important.map(b => `<li>${b}</li>`).join('')}</ul>
        </div>
      </div>

      <div class="tour-refund">
        <h3>${ic('refresh')}İptal ve iade</h3>
        <p class="tour-refund-lead">Tur saatine kalan süreye göre iade oranı.
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
        <p class="tour-note">${ic('shield')}<span>${iptal.note}</span></p>
      </div>`;
  }

  function reviewsMarkup() {
    const yildizSayilari = [5, 4, 3, 2, 1].map(s => filterReviews(tour.reviews, s).length);
    const cipler = [{ star: 0, label: 'Tümü', count: tour.reviews.length }]
      .concat([5, 4, 3, 2, 1].map((s, i) => ({ star: s, label: s + ' yıldız', count: yildizSayilari[i] })))
      .filter(c => c.count > 0);

    return blockHead('Katılanlar ne diyor',
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
          ${tour.ratingAspects.map(a => `
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
    const liste = filterReviews(tour.reviews, state.reviewStar);
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
        ${tour.faq.map((f, i) => `
          <div class="tour-faq-item">
            <button class="tour-faq-q" type="button" aria-expanded="false" aria-controls="tourFaqA${i}">
              <span>${f.q}</span>${ic('chevDown')}
            </button>
            <div class="tour-faq-a" id="tourFaqA${i}" hidden><p>${f.a}</p></div>
          </div>`).join('')}
      </div>`;
  }

  function operatorMarkup() {
    const o = tour.operator;
    return `
      <div class="tour-operator">
        <span class="tour-operator-avatar" aria-hidden="true">${reviewerInitials(o.name)}</span>
        <div class="tour-operator-body">
          <span class="tour-operator-label">Turu düzenleyen</span>
          <strong>${o.name}</strong>
          <p>${o.about}</p>
          <ul class="tour-operator-stats">
            <li><strong>${o.since}</strong><span>bu yıldan beri</span></li>
            <li><strong>${o.tours}</strong><span>farklı tur</span></li>
            <li><strong>${o.guests}</strong><span>misafir</span></li>
            <li><strong>${String(o.rating).replace('.', ',')}</strong><span>operatör puanı</span></li>
          </ul>
          <p class="tour-operator-response">${ic('clock')}${o.response}</p>
        </div>
      </div>`;
  }

  function similarMarkup() {
    return `
      <div class="tour-block-head"><h2>Benzer turlar</h2><p>Aynı bölgede, aynı günübirlik tempoda.</p></div>
      <div class="tour-similar-grid">
        ${tour.similar.map(s => `
          <a class="tour-similar-card" href="${s.slug ? KOK + 'tur/' + s.slug + '/' : KOK + 'index.html'}">
            <span class="tour-similar-media">
              <img src="${tourImage(s.key, GALLERY_WIDTHS.thumb)}" alt="${s.title}" loading="lazy">
              <span class="tour-similar-rating">${ic('star')}${s.rating}</span>
            </span>
            <span class="tour-similar-body">
              <strong>${s.title}</strong>
              <span class="tour-similar-meta">${s.meta}</span>
              <span class="tour-similar-price">${formatTRY(s.price)}<span>${p.unitNote}</span></span>
            </span>
          </a>`).join('')}
      </div>`;
  }

  /* ---------------- rezervasyon kartı ----------------
     Kart bir kez kurulur, sonra yalnızca değişen parçalar güncellenir.
     Her tuşta innerHTML'i baştan yazmak onay kutusundaki klavye odağını
     düşürüyor; bu yüzden sync* fonksiyonları sınıf ve metin değiştirir,
     tam yeniden çizim yalnızca tarih listesi açılıp kapanırken olur. */
  const PARTY_ROWS = [
    { key: 'adults',   label: 'Yetişkin', note: stay ? p.unitNote : '12 yaş ve üzeri', price: temelFiyat },
    { key: 'children', label: 'Çocuk',    note: p.childAges,  price: Number(p.child) || 0 },
    { key: 'infants',  label: 'Bebek',    note: p.infantAges, price: Number(p.infant) || 0 }
  ];

  const bookingEl = document.createElement('section');
  bookingEl.className = 'tour-booking';
  bookingEl.id = 'tourBooking';
  bookingEl.setAttribute('aria-label', 'Rezervasyon');

  function dateChipsMarkup() {
    const liste = tarihler.slice(0, state.allDates ? DATE_CHIPS_ALL : DATE_CHIPS_SHORT);
    return liste.map(iso => {
      const parca = trDateParts(iso);
      const on = iso === state.date;
      return `
        <button class="tour-date-chip${on ? ' active' : ''}" type="button"
                data-date="${iso}" aria-pressed="${on}"
                aria-label="${formatTrDate(iso)}">
          <span class="tour-date-day">${parca.hafta}</span>
          <strong>${parca.gun}</strong>
          <span class="tour-date-month">${parca.ay}</span>
        </button>`;
    }).join('');
  }

  function partyRowsMarkup() {
    return PARTY_ROWS.map(row => `
      <div class="tour-party-row" data-party="${row.key}">
        <span class="tour-party-body">
          <strong>${row.label}</strong>
          <span>${row.note} · ${row.price > 0 ? formatTRY(row.price) : 'Ücretsiz'}</span>
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
    return tour.addons.map(a => `
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

  /* Özet satırları tour-data.js'teki hesaptan gelir (hesap.lines):
     ekranda görünen döküm ile toplanan tutar tek kaynaktan beslenir,
     ikisi ayrışamaz. */
  function summaryMarkup(hesap) {
    const satir = (l) => `
      <li class="${l.kind}"><span>${l.label}</span><span>${
        l.kind === 'free' ? 'Ücretsiz' : formatTRY(l.amount)
      }</span></li>`;

    const kisiler = [
      hesap.adults + ' yetişkin',
      hesap.children ? hesap.children + ' çocuk' : '',
      hesap.infants ? hesap.infants + ' bebek' : ''
    ].filter(Boolean).join(' · ');

    return `
      <ul class="tour-sum-lines">${hesap.lines.map(satir).join('')}</ul>
      ${hesap.saving > 0 ? `<p class="tour-sum-save">${ic('sparkle')}Liste fiyatına göre
        <strong>${formatTRY(hesap.saving)}</strong> avantaj</p>` : ''}
      <div class="tour-sum-total">
        <span>Toplam</span>
        <strong>${formatTRY(hesap.total)}</strong>
      </div>
      <p class="tour-sum-note">Vergiler dahil · ${kisiler} · ${dateRangeText()}</p>`;
  }

  /* Günübirlikte tek tarih, konaklamalıda kalkış – dönüş aralığı. */
  function dateRangeText() {
    if (!stay) return formatTrDate(state.date);
    const donus = stayReturnDate(tour, state.date);
    return formatTrDate(state.date) + ' – ' + formatTrDate(donus);
  }

  /* ---- konaklamalı tura özel alanlar ---- */
  function cityFieldMarkup() {
    if (!stay || !sehirler.length) return '';
    return `
      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('bus')}Kalkış şehri</span>
        <div class="tour-city-chips" role="group" aria-label="Kalkış şehri">
          ${sehirler.map(c => `
            <button class="tour-city-chip${c.id === state.city ? ' active' : ''}" type="button"
                    data-city="${c.id}" aria-pressed="${c.id === state.city ? 'true' : 'false'}">
              <strong>${c.label}</strong>
              <span>${c.note}</span>
              <span class="tour-city-fee">${c.fee > 0 ? '+' + formatTRY(c.fee) + ' / kişi' : 'Fark yok'}</span>
            </button>`).join('')}
        </div>
      </div>`;
  }

  function roomFieldMarkup() {
    if (!stay) return '';
    return `
      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('home')}Oda düzeni</span>
        <label class="tour-addon" for="tourSingleRoom">
          <input type="checkbox" id="tourSingleRoom" data-single-room>
          <span class="tour-addon-box">${tourSvg('check')}</span>
          <span class="tour-addon-body">
            <strong>Tek kişilik oda</strong>
            <span id="tourSingleNote"></span>
          </span>
          <span class="tour-addon-price">+${formatTRY(p.singleSupplement)}<span>/kişi</span></span>
        </label>
        <p class="tour-room-plan" id="tourRoomPlan"></p>
      </div>`;
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
          ${tour.social.viewedLast24h} kişi bu turu görüntüledi · bu hafta
          ${tour.social.bookedThisWeek} rezervasyon</p>
      </div>

      <div class="tour-booking-field">
        <div class="tour-field-head">
          <span class="tour-field-label">${ic('calendar')}${stay ? 'Kalkış tarihi' : 'Tarih seçin'}</span>
          <button class="tour-text-btn small" type="button" id="tourAllDates"
                  aria-expanded="false">Tüm tarihler</button>
        </div>
        <div class="tour-date-chips" id="tourDateChips" role="group"
             aria-label="Kalkış tarihleri">${dateChipsMarkup()}</div>
        <p class="tour-date-note">${ic('clock')}Kalkış ${p.startTime} ·
          ${p.departureNote}</p>
        ${stay ? `<p class="tour-date-note" id="tourReturnNote"></p>` : ''}
        <div class="tour-seats" id="tourSeats"></div>
      </div>

      ${cityFieldMarkup()}

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('users')}Kişi sayısı</span>
        <div class="tour-party">${partyRowsMarkup()}</div>
        <p class="tour-party-limit" id="tourPartyLimit"></p>
      </div>

      ${roomFieldMarkup()}

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('plus')}Ek seçenekler</span>
        <div class="tour-addons">${addonRowsMarkup()}</div>
      </div>

      <div class="tour-summary" id="tourSummary"></div>

      <button class="tour-cta" type="button" id="tourReserve">
        Rezervasyon yap${ic('chevRight')}</button>

      <ul class="tour-booking-trust">
        ${tour.trust.map(t => `<li>${ic(t.icon)}<span>${t.text}</span></li>`).join('')}
      </ul>

      <a class="tour-booking-help" href="${CONTACT.phoneHref}">
        ${ic('phone')}<span><strong>${CONTACT.phoneLabel}</strong>${CONTACT.hours}</span></a>`;
  }

  /* Kontenjan çubuğu: kalan yer tarihten türetilir (tour-data.js/seatsLeft),
     böylece sayfa yenilendiğinde rakam zıplamaz. */
  function syncSeats() {
    const el = document.getElementById('tourSeats');
    if (!el) return;
    const kapasite = Math.max(1, Number(p.seatsPerDeparture) || 1);
    const kalan = seatsLeft(state.date, kapasite);
    const dolu = Math.max(0, Math.min(100, Math.round(((kapasite - kalan) / kapasite) * 100)));
    el.classList.toggle('is-low', kalan <= 4);
    el.innerHTML = `
      <span class="tour-seats-bar"><span class="tour-seats-fill" style="width:${dolu}%"></span></span>
      <span class="tour-seats-text">${ic('users')}Bu tarihte
        <strong>${kalan} kişilik</strong> yer kaldı</span>`;
  }

  function syncBooking() {
    const hesap = calcTotal(tour, state);
    /* clampParty sınırları uyguluyor; ekrandaki sayı hesapla aynı kalsın. */
    state.adults = hesap.adults;
    state.children = hesap.children;
    state.infants = hesap.infants;

    $$('#tourBooking [data-date]').forEach(btn => {
      const on = btn.getAttribute('data-date') === state.date;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    PARTY_ROWS.forEach(row => {
      const out = bookingEl.querySelector('[data-count="' + row.key + '"]');
      if (out) out.textContent = String(state[row.key]);
    });

    /* Sınıra gelen butonlar pasifleşir: tıklanıp hiçbir şey olmaması yerine
       neden olmadığı alttaki satırda yazıyor. */
    const enFazla = Math.max(1, Number(p.maxGuests) || 9);
    const doluluk = state.adults + state.children;
    bookingEl.querySelectorAll('[data-step]').forEach(btn => {
      const hedef = btn.getAttribute('data-target');
      const yon = Number(btn.getAttribute('data-step'));
      const deneme = Object.assign({}, state);
      deneme[hedef] = state[hedef] + yon;
      const sonuc = clampParty(tour, deneme);
      btn.disabled = sonuc[hedef] === state[hedef];
    });

    const limitEl = document.getElementById('tourPartyLimit');
    if (limitEl) {
      limitEl.textContent = doluluk >= enFazla
        ? 'Bu tur en fazla ' + enFazla + ' kişilik rezervasyon alıyor. Daha kalabalık gruplar için destek hattını arayın.'
        : 'En fazla ' + enFazla + ' kişi · bebekler kucakta ve ücretsiz';
    }

    tour.addons.forEach(a => {
      const fiyatEl = bookingEl.querySelector('[data-addon-price="' + a.id + '"]');
      if (fiyatEl && a.per === 'guest') {
        const tutar = (Number(a.price) || 0) * hesap.payingGuests;
        fiyatEl.innerHTML = '+' + formatTRY(tutar) + '<span>' + hesap.payingGuests + ' kişi</span>';
      }
      const kutu = bookingEl.querySelector('[data-addon="' + a.id + '"]');
      if (kutu) kutu.checked = state.addons.indexOf(a.id) !== -1;
    });

    /* Konaklamalı tura özel alanlar: kalkış şehri, oda düzeni, dönüş
       tarihi. Günübirlik turda bu elemanlar hiç basılmadığı için
       koşullar sessizce atlanır. */
    if (stay) {
      bookingEl.querySelectorAll('[data-city]').forEach(btn => {
        const on = btn.getAttribute('data-city') === state.city;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      const kutu = document.getElementById('tourSingleRoom');
      if (kutu) {
        kutu.checked = hesap.singleRoom;
        /* Tek yetişkin tek kişilik odada kalır: kutu işaretli ve pasif.
           Tıklanıp hiçbir şey olmaması yerine nedeni altında yazıyor. */
        kutu.disabled = hesap.singleForced;
      }
      const not = document.getElementById('tourSingleNote');
      if (not) {
        not.textContent = hesap.singleForced
          ? 'Tek başına katıldığınız için zorunlu'
          : 'İşaretlemezseniz iki kişilik odada kalırsınız';
      }
      const plan = document.getElementById('tourRoomPlan');
      if (plan) plan.textContent = roomPlanText(hesap);

      const donus = document.getElementById('tourReturnNote');
      if (donus) {
        donus.innerHTML = ic('calendar') + 'Dönüş ' + formatTrDate(stayReturnDate(tour, state.date))
          + ' · ' + tour.nights + ' gece';
      }
    }

    const ozet = document.getElementById('tourSummary');
    if (ozet) ozet.innerHTML = summaryMarkup(hesap);

    syncSeats();
    syncStickyBar(hesap);
  }

  /* Oda düzeninin insan diliyle özeti. */
  function roomPlanText(hesap) {
    if (hesap.singleRoom) {
      return hesap.singleRooms + ' tek kişilik oda'
        + (hesap.children ? ', çocuklar ailesiyle aynı odada' : '');
    }
    if (hesap.thirdAdults) {
      return '1 adet 3 kişilik oda — 3. kişi indirimli tarifeden';
    }
    const oda = Math.ceil(hesap.adults / 2);
    return oda + ' adet 2 kişilik oda'
      + (hesap.children ? ', çocuklar ailesiyle aynı odada' : '');
  }

  /* ---------------- yapışkan alt şerit (mobil) ---------------- */
  function syncStickyBar(hesap) {
    const bar = document.getElementById('tourStickyBar');
    if (!bar) return;
    const toplam = hesap || calcTotal(tour, state);
    bar.innerHTML = `
      <div class="tour-sticky-info">
        <strong>${formatTRY(toplam.total)}</strong>
        <span>${dateRangeText()} · ${toplam.guests} kişi</span>
      </div>
      <button class="tour-cta small" type="button" id="tourStickyCta">Rezervasyon yap</button>`;
  }

  /* ---------------- fotoğraf büyütme (lightbox) ---------------- */
  let sonOdak = null;
  let kilitliY = 0;

  function lockScroll(on) {
    if (on) {
      kilitliY = window.scrollY || document.documentElement.scrollTop || 0;
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.removeProperty('overflow');
      window.scrollTo(0, kilitliY);
    }
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
            ${tour.gallery.map((g, i) => `
              <button class="tour-lb-thumb" type="button" data-lb-go="${i}" aria-label="${g.caption}">
                <img src="${tourImage(g.key, 300)}" alt="" loading="lazy">
              </button>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function showPhoto(index) {
    const toplam = tour.gallery.length;
    state.photo = ((Math.round(Number(index) || 0) % toplam) + toplam) % toplam;
    const foto = tour.gallery[state.photo];
    const img = document.getElementById('tourLbImg');
    if (img) {
      img.src = tourImage(foto.key, GALLERY_WIDTHS.full);
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
    const hesap = calcTotal(tour, state);
    const satir = (label, value) => `<li><span>${label}</span><strong>${value}</strong></li>`;

    sheet.innerHTML = `
      <div class="tour-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="tourSheetTitle">
        <div class="tour-sheet-head">
          <h2 id="tourSheetTitle">Rezervasyon özeti</h2>
          <button class="tour-icon-btn" type="button" data-sheet="close" aria-label="Kapat">${tourSvg('close')}</button>
        </div>
        <p class="tour-sheet-tour">${tour.title}</p>
        <ul class="tour-sheet-lines">
          ${satir(stay ? 'Tarih aralığı' : 'Tarih', dateRangeText())}
          ${stay ? satir('Konaklama', tour.nights + ' gece · ' + tour.accommodation.board) : ''}
          ${stay && hesap.city ? satir('Kalkış', hesap.city.label + ' · ' + p.startTime) : ''}
          ${stay ? satir('Oda düzeni', roomPlanText(hesap)) : ''}
          ${!stay ? satir('Kalkış', p.startTime + ' · ' + tour.meeting.title) : ''}
          ${satir('Kişi', hesap.adults + ' yetişkin'
            + (hesap.children ? ' · ' + hesap.children + ' çocuk' : '')
            + (hesap.infants ? ' · ' + hesap.infants + ' bebek' : ''))}
          ${hesap.addons.map(a => satir(a.label, formatTRY(a.amount))).join('')}
          ${satir('Ödenecek tutar', formatTRY(hesap.total))}
        </ul>
        <p class="tour-sheet-note">${ic('info')}<span>Ödeme adımı henüz bağlı değil.
          Yukarıdaki özet, ödeme ekranına taşınacak bilgilerin tamamıdır.</span></p>
        <div class="tour-sheet-actions">
          <a class="tour-cta ghost" href="${CONTACT.phoneHref}">${ic('phone')}Destek hattını ara</a>
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

  /* Kısa bilgi balonu: paylaşma/kopyalama gibi sonucu görünmeyen
     işlemlerin geri bildirimi. alert() sayfayı kilitliyor, bu yüzden yok. */
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

  /* Kullanici hareketi azaltmayi sectiyse yumusak kaydirma yapilmaz. */
  function scrollToY(top) {
    const azalt = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: azalt ? 'auto' : 'smooth' });
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    scrollToY(window.scrollY + el.getBoundingClientRect().top - stickyOffset() - 14);
  }

  /* Rezervasyon kartina goturur. */
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
    function sync() {
      queued = false;
      const esik = stickyOffset() + 24;
      let aktif = bolumler[0].id;
      bolumler.forEach(b => { if (b.getBoundingClientRect().top <= esik) aktif = b.id; });
      /* Sayfa sonunda son bölüm kısa kalırsa yine de o işaretlenir. */
      const dip = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
      if (dip) aktif = bolumler[bolumler.length - 1].id;

      nav.querySelectorAll('[data-nav]').forEach(link => {
        const on = link.getAttribute('data-nav') === aktif;
        link.classList.toggle('active', on);
        if (on && nav.scrollWidth > nav.clientWidth + 2) {
          const sol = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
          nav.scrollTo({ left: Math.max(0, sol), behavior: 'smooth' });
        }
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

  /* Mobil galeride kaçıncı fotoğrafta olduğumuzu gösteren sayaç. */
  function initGalleryCounter() {
    const grid = document.querySelector('.tour-gallery-grid');
    const sayac = document.getElementById('tourGalleryCount');
    if (!grid || !sayac) return;
    const toplam = tour.gallery.length;
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

  /* Rezervasyon kartı tek bir DOM düğümü; masaüstünde sağ sütuna,
     mobilde akışın içine taşınır. Klonlanmadığı için dinleyiciler ve
     seçilmiş tarih/kişi sayısı taşınırken korunur. */
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
    /* Galeriden fotoğraf açma. Katmanların kendi kapanma kontrolü
       document'te DEĞİL, katmanın kendi üzerinde duruyor: aksi hâlde
       katmanı açan tıklama document'e kadar baloncuklanıp "panelin
       dışına tıklandı" sayılıyor ve katman açıldığı anda kapanıyor. */
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
        /* Fotoğrafın yanındaki boşluğa tıklamak kapatır. */
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

    /* Lightbox'ta yatay parmak hareketi fotoğraf değiştirir. */
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

    /* Bölüm menüsü */
    const nav = document.getElementById('tourSectionNav');
    if (nav) {
      nav.addEventListener('click', (e) => {
        const link = e.target.closest('[data-nav]');
        if (!link) return;
        e.preventDefault();
        scrollToSection(link.getAttribute('data-nav'));
      });
    }

    /* Açıklama, SSS, yorumlar */
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

      const faqBtn = e.target.closest('.tour-faq-q');
      if (faqBtn) {
        const cevap = document.getElementById(faqBtn.getAttribute('aria-controls'));
        const acik = faqBtn.getAttribute('aria-expanded') === 'true';
        /* Tek soru açık kalır: uzun cevaplarda liste okunur kalıyor. */
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

    /* Favori ve paylaş */
    const favBtn = document.getElementById('tourFavBtn');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        const on = favBtn.getAttribute('aria-pressed') === 'true';
        favBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
        favBtn.classList.toggle('on', !on);
        favBtn.setAttribute('aria-label', on ? 'Favorilere ekle' : 'Favorilerden çıkar');
        toast(on ? 'Favorilerden çıkarıldı' : 'Favorilerine eklendi');
      });
    }

    const shareBtn = document.getElementById('tourShareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const veri = { title: tour.title, text: tour.tagline, url: window.location.href };
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
      });
    }

    /* Rezervasyon kartı: tek delege dinleyici, kart yeniden çizilse de
       bağlı kalır. */
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

      const sehir = e.target.closest('[data-city]');
      if (sehir) {
        state.city = sehir.getAttribute('data-city');
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
      if (e.target.closest('[data-single-room]')) {
        state.singleRoom = !!e.target.checked;
        syncBooking();
        return;
      }
      const kutu = e.target.closest('[data-addon]');
      if (!kutu) return;
      const id = kutu.getAttribute('data-addon');
      const yer = state.addons.indexOf(id);
      if (kutu.checked && yer === -1) state.addons.push(id);
      if (!kutu.checked && yer !== -1) state.addons.splice(yer, 1);
      syncBooking();
    });

    /* Yapışkan şerit her yeniden çizildiği için delege dinleyici. */
    const bar = document.getElementById('tourStickyBar');
    if (bar) {
      bar.addEventListener('click', (e) => {
        if (!e.target.closest('#tourStickyCta')) return;
        /* Kart ekranda değilse önce ona götür: kişi/tarih seçimi
           görülmeden özet açmak kafa karıştırıyor. */
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
  fill('program', itineraryMarkup());
  fill('konaklama', accommodationMarkup());
  fill('dahil-olanlar', includedMarkup());
  fill('bulusma', meetingMarkup());
  fill('bilgiler', infoMarkup());
  fill('yorumlar', reviewsMarkup());
  fill('sss', faqMarkup());
  fill('operator', operatorMarkup());
  fill('tourSimilar', similarMarkup());

  bookingEl.innerHTML = bookingMarkup();
  syncBookingPlacement();

  renderReviews();
  syncBooking();
  initEvents();
  initSectionNav();
  initGalleryCounter();
  initStickyBar();

})();
