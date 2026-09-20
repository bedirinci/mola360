/* ---------------- otel içerik sayfası: işaretleme ve etkileşimler ----------------
   Veri ve saf hesaplar hotel-data.js'te; bu dosya onları işaretlemeye çevirir
   ve davranışları bağlar. Buraya sayfada görünen metin yazılmaz.

   Tur sayfasıyla ORTAK olanlar tekrar yazılmadı:
     - biçimlendirme, tarih, iade, puan hesapları  -> tour-data.js
     - ikon seti (tourSvg / TOUR_ICONS)            -> tour-data.js
     - sayfanın görsel kabuğu (galeri, künye, blok başlıkları, rezervasyon
       kartı, yapışkan şerit, ışık kutusu, özet sayfası) -> assets/css/tour.css
   Sınıf adlarındaki "tour-" öneki tarihsel: o dosya artık içerik
   sayfalarının ORTAK kabuğu. Gerekçesi ve sınırları docs/otel-sayfasi.md
   içinde yazılı.

   Otelin turdan farkı yalnızca içerik değil, satılan şey:
     tur   bir tarih + kişi sayısı
     otel  bir tarih ARALIĞI + oda tipi + oda sayısı + pansiyon
   Bu yüzden rezervasyon kartı ve hesap ayrı; bölümler de ayrı
   (program/buluşma yerine odalar/olanaklar/konum/kurallar). */
(function () {

  /* Sayfa /otel/<slug>/ adresinde duruyor, slug adresten okunuyor. */
  const hotel = resolveHotel(hotelSlugFromPath(window.location.pathname));
  if (!hotel) return;

  /* Sayfa kökü: /otel/<slug>/index.html iki dizin içeride olduğu için
     anasayfaya ve diğer sayfalara giden bağlantılar buradan kurulur.
     Değer <body data-root="..."> niteliğinden gelir; tahmin edilmez,
     böylece depo alt dizinde yayınlansa da doğru kalır. */
  const KOK = (document.body && document.body.getAttribute('data-root')) || '';

  /* Bölüm menüsü ve kaydırma takibi bu listeden beslenir. Sayfada
     karşılığı OLMAYAN kayıt listeden düşer. */
  const TUM_SECTIONS = [
    { id: 'genel-bakis',  label: 'Genel Bakış' },
    { id: 'odalar',       label: 'Odalar' },
    { id: 'olanaklar',    label: 'Olanaklar' },
    { id: 'konum',        label: 'Konum' },
    { id: 'politikalar',  label: 'Otel Kuralları' },
    { id: 'yorumlar',     label: 'Yorumlar' },
    { id: 'sss',          label: 'SSS' }
  ];
  const SECTIONS = TUM_SECTIONS.filter(sec => document.getElementById(sec.id));

  const GALLERY_WIDTHS = { hero: 1200, thumb: 600, full: 1600 };
  const REVIEWS_STEP = 3;
  const DATE_CHIPS_SHORT = 6;
  const DATE_CHIPS_ALL = 18;

  const p = hotel.pricing;
  const puan = ratingSummary(hotel.ratingBreakdown);
  const skor = hotelScoreText(hotel.ratingBreakdown);
  const temelFiyat = hotelNightlyFrom(hotel);
  const listeFiyat = hotelNightlyListFrom(hotel);
  const indirim = discountPercent(listeFiyat, temelFiyat);
  /* Otelde her gün giriş var; tur takviminin gün filtresi burada boş
     geçiliyor ve fonksiyon tüm günleri döndürüyor. */
  const tarihler = nextDepartureDates(new Date(), [], DATE_CHIPS_ALL, p.leadDays);

  const state = {
    checkIn: tarihler[0] || '',
    nights: p.minNights || 1,
    rooms: 1,
    adults: 2,
    children: 0,
    room: hotel.rooms[0].id,
    board: hotel.boards[0].id,
    addons: [],
    allDates: false,
    favorite: false,
    reviewStar: 0,
    reviewsShown: REVIEWS_STEP,
    photo: 0
  };

  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));
  const ic = (name) => '<span class="icon">' + tourSvg(name) + '</span>';

  /* WhatsApp ikonu TOUR_ICONS'ta değil: o setteki ikonlar ÇİZGİ ile
     çiziliyor, WhatsApp logosu DOLU bir şekil. Dolgu "tour-wa-icon"
     sınıfıyla veriliyor, svg'ye fill niteliği koyarak değil — sunum
     nitelikleri CSS'e yenilir (gerekçe: docs/tur-sayfasi.md). */
  const whatsappIkon = () =>
    '<span class="icon tour-wa-icon"><svg aria-hidden="true" focusable="false"'
    + ' viewBox="0 0 24 24"><path d="' + WHATSAPP_ICON_PATH + '"/></svg></span>';

  /* WhatsApp kartının alt satırı: yeşil ışık + "Çevrimiçi". Işık destek
     saatine bağlı; sabit yeşil olsaydı gece 3'te de "Çevrimiçi" yazardı. */
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
    const foto = hotel.gallery;
    const kalan = Math.max(0, foto.length - 5);
    return `
      <div class="tour-gallery-grid" role="group" aria-label="Otel fotoğrafları">
        ${foto.map((item, i) => `
          <button class="tour-gallery-cell${i >= 5 ? ' is-extra' : ''}" type="button"
                  data-photo="${i}" aria-label="${item.caption} — büyüt">
            <img src="${hotelImage(item.key, i === 0 ? GALLERY_WIDTHS.hero : GALLERY_WIDTHS.thumb)}"
                 alt="${item.caption}"${i === 0 ? '' : ' loading="lazy"'}>
            ${i === 4 && kalan ? `<span class="tour-gallery-more">${ic('image')}+${kalan} fotoğraf</span>` : ''}
          </button>`).join('')}
      </div>
      <div class="tour-gallery-actions">
        <button class="tour-gallery-fav" type="button" id="tourGalleryFav"
                aria-pressed="false" aria-label="Favorilere ekle">${ic('heart')}</button>
        <button class="tour-gallery-share" type="button" id="tourGalleryShare"
                aria-label="Oteli paylaş">${ic('share')}</button>
      </div>
      <span class="tour-gallery-count" id="tourGalleryCount" aria-hidden="true"></span>
      <button class="tour-gallery-all" type="button" data-photo="0">
        ${ic('camera')}Tüm fotoğraflar<span class="count">${foto.length}</span>
      </button>`;
  }

  /* ---------------- başlık bloğu ----------------
     Yıldızlar kategori rozetinin yanında: otelde sınıf bilgisi ilk
     bakışta okunması gereken bir şey. */
  function headlineMarkup() {
    return `
      <div class="tour-head-row">
        <div class="tour-head-chips">
          <span class="tour-chip solid">${hotel.categoryShort}</span>
          <span class="tour-chip otel-star-chip" aria-label="${hotel.stars} yıldızlı otel">
            ${Array.from({ length: hotel.stars }, () => ic('star')).join('')}
          </span>
          ${hotel.badges.map(b => `<span class="tour-chip">${ic(b.icon)}${b.label}</span>`).join('')}
        </div>
      </div>`;
  }

  /* Otel puanı 10 üzerinden yazılıyor (sektörde alışılmış gösterim);
     sayı yorum dağılımından türetiliyor, veride ikinci bir puan yok. */
  function headMetaMarkup() {
    return `
      <a class="tour-head-rating" href="#yorumlar">
        <span class="tour-head-score">${skor}<span class="otel-score-scale">/10</span></span>
        <span class="tour-head-count">${formatNumberTR(puan.total)} değerlendirme</span>
      </a>
      <span class="tour-head-meta-item">${ic('mapPin')}${hotel.area} · ${hotel.distanceLabel}</span>
      <span class="tour-head-meta-item">${ic('clock')}Giriş ${p.checkInTime} · Çıkış ${p.checkOutTime}</span>
      <span class="tour-head-meta-item muted">Tesis kodu ${hotel.code}</span>`;
  }

  function factsMarkup() {
    return hotel.facts.map(f => `
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
    const fazla = hotel.description.slice(1);
    return blockHead('Genel bakış', hotel.tagline) + `
      <ul class="tour-highlights">
        ${hotel.highlights.map(h => `<li>${ic('check')}<span>${h}</span></li>`).join('')}
      </ul>
      <div class="tour-prose" id="tourProse">
        <p>${hotel.description[0]}</p>
        <div class="tour-prose-rest" id="tourProseRest" hidden>
          ${fazla.map(t => `<p>${t}</p>`).join('')}
        </div>
      </div>
      ${fazla.length ? `<button class="tour-text-btn" type="button" id="tourProseToggle"
        aria-expanded="false" aria-controls="tourProseRest">Devamını oku${ic('chevDown')}</button>` : ''}`;
  }

  /* ---------------- odalar ----------------
     Her oda kartı hem bilgi hem SEÇİM: "Bu odayı seç" düğmesi rezervasyon
     kartındaki oda tipini değiştiriyor. İki ayrı yerde oda seçmek
     (listede bir, kartta bir) ikisini eşit tutmayı gerektirirdi; tek
     durum var, iki yüzey onu gösteriyor. */
  function roomCardMarkup(o) {
    const secili = o.id === state.room;
    const indirimOran = discountPercent(o.nightlyList, o.nightly);
    return `
      <article class="otel-oda${secili ? ' is-secili' : ''}" data-room-card="${o.id}">
        <div class="otel-oda-media">
          <img src="${hotelImage(o.key, GALLERY_WIDTHS.thumb)}" alt="${o.name}" loading="lazy">
        </div>
        <div class="otel-oda-body">
          <div class="otel-oda-head">
            <h3>${o.name}</h3>
            ${secili ? `<span class="otel-oda-secili">${ic('check')}Seçili</span>` : ''}
          </div>
          <div class="otel-oda-meta">
            <span>${ic('home')}${o.size}</span>
            <span>${ic('image')}${o.view}</span>
            <span>${ic('users')}En fazla ${o.maxGuests} kişi</span>
            <span>${ic('star')}${o.beds}</span>
          </div>
          <ul class="otel-oda-ozellik">
            ${o.features.map(f => `<li>${ic('check')}<span>${f}</span></li>`).join('')}
          </ul>
          <p class="otel-oda-not">${ic('info')}<span>${o.note}</span></p>
          <div class="otel-oda-alt">
            <span class="otel-oda-fiyat">
              ${indirimOran > 0 ? `<span class="tour-price-was">${formatTRY(o.nightlyList)}</span>` : ''}
              <strong>${formatTRY(o.nightly)}</strong>
              <span>${p.unitNote}</span>
            </span>
            <button class="tour-cta small${secili ? ' ghost' : ''}" type="button" data-room-pick="${o.id}">
              ${secili ? 'Rezervasyona git' : 'Bu odayı seç'}${ic('chevRight')}
            </button>
          </div>
          <p class="otel-oda-kalan" data-room-left="${o.id}"></p>
        </div>
      </article>`;
  }

  function roomsMarkup() {
    return blockHead('Oda tipleri',
      `${hotel.rooms.length} oda tipi · toplam ${hotel.rooms.reduce((t, o) => t + (Number(o.count) || 0), 0)} oda`)
      + `<div class="otel-oda-list" id="otelOdaList">
           ${hotel.rooms.map(roomCardMarkup).join('')}
         </div>
         <p class="tour-note">${ic('info')}<span>Fiyatlar oda başına gecelik, kahvaltı dahildir.
           Konaklama vergisi rezervasyon özetinde ayrı satır olarak görünür.</span></p>`;
  }

  /* Oda kartları yeniden çizilmeden yalnızca seçim ve kalan oda satırı
     güncelleniyor: her tuşta innerHTML yazmak sayfanın o anki kaydırma
     konumunu ve klavye odağını bozuyor. */
  function syncRoomCards() {
    hotel.rooms.forEach(o => {
      const kart = document.querySelector('[data-room-card="' + o.id + '"]');
      if (kart) kart.classList.toggle('is-secili', o.id === state.room);

      const rozet = kart && kart.querySelector('.otel-oda-head');
      if (rozet) {
        const eski = rozet.querySelector('.otel-oda-secili');
        if (o.id === state.room && !eski) {
          rozet.insertAdjacentHTML('beforeend',
            '<span class="otel-oda-secili">' + ic('check') + 'Seçili</span>');
        }
        if (o.id !== state.room && eski) eski.remove();
      }

      const btn = document.querySelector('[data-room-pick="' + o.id + '"]');
      if (btn) {
        btn.classList.toggle('ghost', o.id === state.room);
        btn.innerHTML = (o.id === state.room ? 'Rezervasyona git' : 'Bu odayı seç') + ic('chevRight');
      }

      const kalanEl = document.querySelector('[data-room-left="' + o.id + '"]');
      if (kalanEl) {
        const kalan = roomsLeft(state.checkIn, o.id, o.count);
        kalanEl.className = 'otel-oda-kalan' + (kalan <= 3 ? ' is-low' : '');
        kalanEl.innerHTML = ic('bolt') + 'Seçili tarihte <strong>' + kalan + ' oda</strong> kaldı';
      }
    });
  }

  /* ---------------- olanaklar ---------------- */
  function amenitiesMarkup() {
    return blockHead('Otel olanakları', 'Odada ve tesiste ne var, ne yok.') + `
      <div class="otel-olanak-grid">
        ${hotel.amenities.map(g => `
          <section class="otel-olanak">
            <h3>${ic(g.icon)}${g.title}</h3>
            <ul>${g.items.map(i => `<li>${ic('check')}<span>${i}</span></li>`).join('')}</ul>
          </section>`).join('')}
      </div>
      <p class="tour-note">${ic('info')}<span>Tesiste havuz, spa ve fitness salonu
        <strong>yoktur</strong>. Listede olmayan bir hizmeti aramadan önce
        burada göremiyorsanız, muhtemelen yoktur.</span></p>`;
  }

  /* ---------------- konum ---------------- */
  function locationMarkup() {
    const k = hotel.location;
    return blockHead('Konum ve ulaşım', hotel.distanceLabel + ' · ' + hotel.area) + `
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
        <ul class="otel-yakin">
          ${k.nearby.map(y => `
            <li>
              <span class="otel-yakin-mesafe">${y.distance}</span>
              <span class="otel-yakin-body"><strong>${y.name}</strong><span>${y.detail}</span></span>
            </li>`).join('')}
        </ul>
        <ul class="otel-ulasim">
          ${k.transport.map(t => `<li>${ic(t.icon)}<span>${t.text}</span></li>`).join('')}
        </ul>
        <p class="tour-note">${ic('info')}<span>${k.note}</span></p>
      </div>`;
  }

  /* ---------------- otel kuralları ve iade ---------------- */
  function policiesMarkup() {
    const iptal = hotel.cancellation;
    const ornek = Number(iptal.exampleTotal) || temelFiyat;
    const basamak = iptal.tiers.slice().sort((a, b) => b.minHours - a.minHours);

    return blockHead('Otel kuralları', 'Resepsiyonda sürpriz olmasın diye hepsi burada.') + `
      <div class="otel-kural-grid">
        ${hotel.policies.map(k => `
          <div class="tour-info-card">
            <h3>${ic(k.icon)}${k.title}</h3>
            <p>${k.text}</p>
          </div>`).join('')}
      </div>

      <div class="tour-refund">
        <h3>${ic('refresh')}İptal ve iade</h3>
        <p class="tour-refund-lead">Giriş tarihine kalan süreye göre iade oranı.
          Sağdaki tutarlar ${formatTRY(ornek)} tutarında tek gecelik bir rezervasyon içindir.</p>
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

  /* ---------------- yorumlar ---------------- */
  function reviewsMarkup() {
    const yildizSayilari = [5, 4, 3, 2, 1].map(s => filterReviews(hotel.reviews, s).length);
    const cipler = [{ star: 0, label: 'Tümü', count: hotel.reviews.length }]
      .concat([5, 4, 3, 2, 1].map((s, i) => ({ star: s, label: s + ' yıldız', count: yildizSayilari[i] })))
      .filter(c => c.count > 0);

    return blockHead('Misafirler ne diyor',
      `${formatNumberTR(puan.total)} değerlendirmenin ortalaması ${skor} / 10`) + `
      <div class="tour-review-summary">
        <div class="tour-review-score">
          <strong>${skor}</strong>
          <span class="tour-review-stars">${[1,2,3,4,5].map(i =>
            `<span class="icon${i <= Math.round(puan.average) ? ' on' : ''}">${tourSvg('star')}</span>`).join('')}</span>
          <span class="tour-review-total">${formatNumberTR(puan.total)} değerlendirme · 10 üzerinden</span>
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
          ${hotel.ratingAspects.map(a => `
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
        <span class="tour-review-verified">${ic('shield')}Doğrulanmış konaklama</span>
      </article>`;
  }

  function renderReviews() {
    const liste = filterReviews(hotel.reviews, state.reviewStar);
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
        ${hotel.faq.map((f, i) => `
          <div class="tour-faq-item">
            <button class="tour-faq-q" type="button" aria-expanded="false" aria-controls="tourFaqA${i}">
              <span>${f.q}</span>${ic('chevDown')}
            </button>
            <div class="tour-faq-a" id="tourFaqA${i}" hidden><p>${f.a}</p></div>
          </div>`).join('')}
      </div>`;
  }

  function similarMarkup() {
    return `
      <div class="tour-block-head"><h2>Benzer oteller</h2><p>Aynı fiyat aralığında, farklı şehirlerde.</p></div>
      <div class="tour-similar-grid">
        ${hotel.similar.map(s => `
          <a class="tour-similar-card" href="${s.slug ? KOK + 'otel/' + s.slug + '/' : KOK + 'index.html#oteller'}">
            <span class="tour-similar-media">
              <img src="${hotelImage(s.key, GALLERY_WIDTHS.thumb)}" alt="${s.title}" loading="lazy">
              <span class="tour-similar-rating">${s.score}</span>
            </span>
            <span class="tour-similar-body">
              <strong>${s.title}</strong>
              <span class="tour-similar-meta">${s.meta}</span>
              <span class="tour-similar-price">${formatTRY(s.price)}<span>${p.unitNote}</span></span>
            </span>
          </a>`).join('')}
      </div>`;
  }

  /* ---------------- sayfa etiketleri ----------------
     Kökten gelen bağlantılar KOK ile öneklenir; '#' ile başlayanlar bu
     sayfanın kendi bölümü olduğu için olduğu gibi kalır. Çip görünümü
     anasayfadaki "ilgili aramalar" bulutuyla ORTAK (.seo-chip). */
  function tagHref(t) {
    return String(t.href).charAt(0) === '#' ? t.href : KOK + t.href;
  }

  function tagsMarkup() {
    const etiketler = hotel.tags || [];
    if (!etiketler.length) return '';
    return `
      <div class="tour-block-head"><h2>Sayfa etiketleri</h2><p>Bu otelle ilgili bölümler ve yakın kategoriler.</p></div>
      <ul class="seo-chip-list tour-tag-list">
        ${etiketler.map(t => `<li><a class="seo-chip" href="${tagHref(t)}">${t.label}</a></li>`).join('')}
      </ul>`;
  }

  /* ---------------- rezervasyon kartı ----------------
     Kart bir kez kurulur, sonra yalnızca değişen parçalar güncellenir.
     Her tuşta innerHTML'i baştan yazmak onay kutusundaki klavye odağını
     düşürüyor; tam yeniden çizim yalnızca tarih listesi açılıp
     kapanırken oluyor. */
  const PARTY_ROWS = [
    { key: 'adults',   label: 'Yetişkin', note: '13 yaş ve üzeri' },
    { key: 'children', label: 'Çocuk',    note: '0 – 12 yaş' }
  ];

  const bookingEl = document.createElement('section');
  bookingEl.className = 'tour-booking';
  bookingEl.id = 'tourBooking';
  bookingEl.setAttribute('aria-label', 'Rezervasyon');

  function dateChipsMarkup() {
    const liste = tarihler.slice(0, state.allDates ? DATE_CHIPS_ALL : DATE_CHIPS_SHORT);
    return liste.map(iso => {
      const parca = trDateParts(iso);
      const on = iso === state.checkIn;
      return `
        <button class="tour-date-chip${on ? ' active' : ''}" type="button"
                data-date="${iso}" aria-pressed="${on}"
                aria-label="${formatTrDate(iso)} girişli">
          <span class="tour-date-day">${parca.hafta}</span>
          <strong>${parca.gun}</strong>
          <span class="tour-date-month">${parca.ay}</span>
        </button>`;
    }).join('');
  }

  /* Gece sayısı ve oda sayısı aynı sayaç bileşeniyle; çocuk/yetişkin
     satırlarıyla aynı görünüm, farklı anlam. */
  function stepperRowMarkup(key, label, note) {
    return `
      <div class="tour-party-row" data-party="${key}">
        <span class="tour-party-body">
          <strong>${label}</strong>
          <span data-row-note="${key}">${note}</span>
        </span>
        <span class="tour-stepper">
          <button class="tour-step-btn" type="button" data-step="-1" data-target="${key}"
                  aria-label="${label} azalt">${tourSvg('minus')}</button>
          <output class="tour-step-value" data-count="${key}">${state[key]}</output>
          <button class="tour-step-btn" type="button" data-step="1" data-target="${key}"
                  aria-label="${label} artır">${tourSvg('plus')}</button>
        </span>
      </div>`;
  }

  function roomChipsMarkup() {
    return hotel.rooms.map(o => `
      <button class="tour-city-chip otel-room-chip${o.id === state.room ? ' active' : ''}" type="button"
              data-room="${o.id}" aria-pressed="${o.id === state.room ? 'true' : 'false'}">
        <strong>${o.name}</strong>
        <span>${o.size} · ${o.view} · en fazla ${o.maxGuests} kişi</span>
        <span class="tour-city-fee">${formatTRY(o.nightly)} / gece</span>
      </button>`).join('');
  }

  function boardChipsMarkup() {
    return hotel.boards.map(b => `
      <button class="tour-city-chip otel-board-chip${b.id === state.board ? ' active' : ''}" type="button"
              data-board="${b.id}" aria-pressed="${b.id === state.board ? 'true' : 'false'}">
        <strong>${b.label}</strong>
        <span>${b.note}</span>
        <span class="tour-city-fee">${Number(b.adultNight) > 0
          ? '+' + formatTRY(b.adultNight) + ' / kişi / gece'
          : 'Fiyata dahil'}</span>
      </button>`).join('');
  }

  function addonRowsMarkup() {
    const birim = { stay: '/rezervasyon', night: '/gece', guest: '/kişi' };
    return hotel.addons.map(a => `
      <label class="tour-addon" for="addon-${a.id}">
        <input type="checkbox" id="addon-${a.id}" data-addon="${a.id}">
        <span class="tour-addon-box">${tourSvg('check')}</span>
        <span class="tour-addon-body">
          <strong>${a.label}</strong>
          <span>${a.text}</span>
        </span>
        <span class="tour-addon-price" data-addon-price="${a.id}">
          +${formatTRY(a.price)}<span>${birim[a.per] || '/rezervasyon'}</span>
        </span>
      </label>`).join('');
  }

  /* Özet satırları hotel-data.js'teki hesaptan gelir (hesap.lines):
     ekranda görünen döküm ile toplanan tutar tek kaynaktan beslenir. */
  function summaryMarkup(hesap) {
    const satir = (l) => `
      <li class="${l.kind}"><span>${l.label}</span><span>${
        l.kind === 'free' ? 'Dahil' : formatTRY(l.amount)
      }</span></li>`;

    const kisiler = [
      hesap.adults + ' yetişkin',
      hesap.children ? hesap.children + ' çocuk' : '',
      hesap.rooms + ' oda'
    ].filter(Boolean).join(' · ');

    return `
      <ul class="tour-sum-lines">${hesap.lines.map(satir).join('')}</ul>
      ${hesap.saving > 0 ? `<p class="tour-sum-save">${ic('sparkle')}Liste fiyatına göre
        <strong>${formatTRY(hesap.saving)}</strong> avantaj</p>` : ''}
      <div class="tour-sum-total">
        <span>Toplam</span>
        <strong>${formatTRY(hesap.total)}</strong>
      </div>
      <p class="tour-sum-note">Konaklama vergisi dahil · ${kisiler} · ${dateRangeText()}</p>`;
  }

  /* Giriş – çıkış aralığı. kisa=true dar alanlar için: yapışkan alt
     şeritte tam biçim sığmayıp kesiliyor (turda ölçülmüş bir durum,
     aynı kısaltma burada da kullanılıyor). */
  function dateRangeText(kisa) {
    const cikis = hotelCheckout(state.checkIn, state.nights);
    if (kisa) return formatTrDateRangeShort(state.checkIn, cikis);
    return formatTrDate(state.checkIn) + ' – ' + formatTrDate(cikis);
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
          ${hotel.social.viewedLast24h} kişi bu oteli görüntüledi · bu hafta
          ${hotel.social.bookedThisWeek} rezervasyon</p>
      </div>

      <div class="tour-booking-field">
        <div class="tour-field-head">
          <span class="tour-field-label">${ic('calendar')}Giriş tarihi</span>
          <button class="tour-text-btn small" type="button" id="tourAllDates"
                  aria-expanded="false">Tüm tarihler</button>
        </div>
        <div class="tour-date-chips" id="tourDateChips" role="group"
             aria-label="Giriş tarihleri">${dateChipsMarkup()}</div>
        <p class="tour-date-note">${ic('clock')}Giriş ${p.checkInTime} ·
          Çıkış ${p.checkOutTime} · ${p.dateNote}</p>
        <div class="otel-gece">${stepperRowMarkup('nights', 'Gece sayısı', '')}</div>
        <p class="tour-date-note" id="otelStayNote"></p>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('home')}Oda tipi</span>
        <div class="tour-city-chips" role="group" aria-label="Oda tipi">${roomChipsMarkup()}</div>
        <div class="tour-seats" id="tourSeats"></div>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('users')}Misafir ve oda</span>
        <div class="tour-party">
          ${PARTY_ROWS.map(r => stepperRowMarkup(r.key, r.label, r.note)).join('')}
          ${stepperRowMarkup('rooms', 'Oda sayısı', '')}
        </div>
        <p class="tour-party-limit" id="tourPartyLimit"></p>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('food')}Pansiyon</span>
        <div class="tour-city-chips" role="group" aria-label="Pansiyon">${boardChipsMarkup()}</div>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('plus')}Ek hizmetler</span>
        <div class="tour-addons">${addonRowsMarkup()}</div>
      </div>

      <div class="tour-summary" id="tourSummary"></div>

      <button class="tour-cta" type="button" id="tourReserve">
        Rezervasyon yap${ic('chevRight')}</button>

      <ul class="tour-booking-trust">
        ${hotel.trust.map(t => `<li>${ic(t.icon)}<span>${t.text}</span></li>`).join('')}
      </ul>

      <div class="tour-booking-contact">
        <a class="tour-booking-help" href="${CONTACT.phoneHref}">
          ${ic('phone')}<span><strong>${CONTACT.phoneLabel}</strong>${CONTACT.hours}</span></a>
        <a class="tour-booking-help" href="${CONTACT.whatsappHref}"
           target="_blank" rel="noopener">
          ${whatsappIkon()}<span><strong>WhatsApp'tan yaz</strong>${destekDurumu()}</span></a>
      </div>`;
  }

  /* Kalan oda çubuğu: sayı tarihten ve oda tipinden türetiliyor
     (hotel-data.js/roomsLeft), böylece sayfa yenilendiğinde zıplamıyor. */
  function syncSeats(hesap) {
    const el = document.getElementById('tourSeats');
    if (!el) return;
    const oda = hesap.room || hotel.rooms[0];
    const kapasite = Math.max(1, Number(oda.count) || 1);
    const kalan = roomsLeft(state.checkIn, oda.id, kapasite);
    const dolu = Math.max(0, Math.min(100, Math.round(((kapasite - kalan) / kapasite) * 100)));
    el.classList.toggle('is-low', kalan <= 3);
    el.innerHTML = `
      <span class="tour-seats-bar"><span class="tour-seats-fill" style="width:${dolu}%"></span></span>
      <span class="tour-seats-text">${ic('home')}Bu tarihte
        <strong>${kalan} ${oda.name}</strong> kaldı</span>`;
  }

  function syncBooking() {
    const hesap = calcHotelTotal(hotel, state);
    /* clampStay sınırları uyguluyor; ekrandaki sayı hesapla aynı kalsın. */
    state.nights = hesap.nights;
    state.rooms = hesap.rooms;
    state.adults = hesap.adults;
    state.children = hesap.children;

    bookingEl.querySelectorAll('[data-date]').forEach(btn => {
      const on = btn.getAttribute('data-date') === state.checkIn;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    ['adults', 'children', 'rooms', 'nights'].forEach(key => {
      const out = bookingEl.querySelector('[data-count="' + key + '"]');
      if (out) out.textContent = String(state[key]);
    });

    /* Sınıra gelen butonlar pasifleşir: tıklanıp hiçbir şey olmaması
       yerine neden olmadığı alttaki satırda yazıyor. */
    bookingEl.querySelectorAll('[data-step]').forEach(btn => {
      const hedef = btn.getAttribute('data-target');
      const yon = Number(btn.getAttribute('data-step'));
      const deneme = Object.assign({}, state);
      deneme[hedef] = state[hedef] + yon;
      const sonuc = clampStay(hotel, deneme);
      btn.disabled = sonuc[hedef] === state[hedef];
    });

    const geceNot = bookingEl.querySelector('[data-row-note="nights"]');
    if (geceNot) geceNot.textContent = 'En fazla ' + p.maxNights + ' gece';
    const odaNot = bookingEl.querySelector('[data-row-note="rooms"]');
    if (odaNot) {
      odaNot.textContent = 'En fazla ' + hesap.room.maxGuests + ' kişi / oda · tesiste en fazla '
        + p.maxRooms + ' oda';
    }

    const stayNot = document.getElementById('otelStayNote');
    if (stayNot) {
      stayNot.innerHTML = ic('calendar') + 'Çıkış ' + formatTrDate(hesap.checkOut)
        + ' · ' + hesap.nights + ' gece';
    }

    const limitEl = document.getElementById('tourPartyLimit');
    if (limitEl) {
      const gerekli = Math.ceil(hesap.guests / hesap.room.maxGuests);
      limitEl.textContent = hesap.rooms > 1 || gerekli > 1
        ? hesap.guests + ' misafir için ' + hesap.rooms + ' oda ayrılıyor — '
          + hesap.room.name + ' en fazla ' + hesap.room.maxGuests + ' kişi alıyor.'
        : '0 – 6 yaş çocuklar ailesiyle aynı odada ücretsiz konaklar.';
    }

    bookingEl.querySelectorAll('[data-room]').forEach(btn => {
      const on = btn.getAttribute('data-room') === state.room;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    bookingEl.querySelectorAll('[data-board]').forEach(btn => {
      const on = btn.getAttribute('data-board') === state.board;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    /* Ek hizmet fiyatı seçime göre büyüyor: "+250 /gece" yazan satır üç
       gecelik konaklamada "+750 · 3 gece" oluyor. Tutarı ancak özette
       görmek, ek hizmeti işaretlemeden önce kararı zorlaştırıyordu. */
    hotel.addons.forEach(a => {
      const fiyatEl = bookingEl.querySelector('[data-addon-price="' + a.id + '"]');
      if (fiyatEl && a.per !== 'stay') {
        const carpan = a.per === 'night' ? hesap.nights : hesap.guests;
        const ek = a.per === 'night' ? hesap.nights + ' gece' : hesap.guests + ' kişi';
        fiyatEl.innerHTML = '+' + formatTRY((Number(a.price) || 0) * carpan) + '<span>' + ek + '</span>';
      }
      const kutu = bookingEl.querySelector('[data-addon="' + a.id + '"]');
      if (kutu) kutu.checked = state.addons.indexOf(a.id) !== -1;
    });

    const ozet = document.getElementById('tourSummary');
    if (ozet) ozet.innerHTML = summaryMarkup(hesap);

    syncSeats(hesap);
    syncRoomCards();
    syncStickyBar(hesap);
  }

  /* ---------------- yapışkan alt şerit (mobil) ---------------- */
  function syncStickyBar(hesap) {
    const bar = document.getElementById('tourStickyBar');
    if (!bar) return;
    const toplam = hesap || calcHotelTotal(hotel, state);
    bar.innerHTML = `
      <div class="tour-sticky-info">
        <span class="tour-sticky-price">
          <strong>${formatTRY(toplam.total)}</strong>
          <span class="tour-sticky-guests">/ ${toplam.nights} gece</span>
        </span>
        <span class="tour-sticky-date">${dateRangeText(true)}</span>
      </div>
      <button class="tour-cta small" type="button" id="tourStickyCta">Rezervasyon yap</button>`;
  }

  /* ---------------- fotoğraf büyütme (lightbox) ---------------- */
  let sonOdak = null;
  let kilitliY = 0;
  let kilitSayaci = 0;

  /* Katman açıkken arkadaki sayfa kaymasın.

     Yalnızca html'e "overflow: hidden" yazmak YETMİYOR: iOS Safari o
     kuralı dokunmatik kaydırmada uygulamıyor. Çalışan yol GÖVDEYİ
     SABİTLEMEK: body "fixed" olunca belgenin kaydırılacak yüksekliği
     kalmıyor. Sayfa yukarı zıplamasın diye o anki konum "top: -Ypx" ile
     korunuyor ve kilit açılınca geri veriliyor.

     Sayaç iki katman üst üste açıldığında konumun SIFIRLANMAMASI için:
     yalnızca ilk kilit konumu okur, yalnızca son açma kilidi kaldırır.

     Ölçüm ve gerekçenin tamamı docs/tur-sayfasi.md içinde; burada aynı
     çözüm kullanılıyor, çünkü sorun da aynı. */
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
            ${hotel.gallery.map((g, i) => `
              <button class="tour-lb-thumb" type="button" data-lb-go="${i}" aria-label="${g.caption}">
                <img src="${hotelImage(g.key, 300)}" alt="" loading="lazy">
              </button>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function showPhoto(index) {
    const toplam = hotel.gallery.length;
    state.photo = ((Math.round(Number(index) || 0) % toplam) + toplam) % toplam;
    const foto = hotel.gallery[state.photo];
    const img = document.getElementById('tourLbImg');
    if (img) {
      img.src = hotelImage(foto.key, GALLERY_WIDTHS.full);
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
    const hesap = calcHotelTotal(hotel, state);
    const satir = (label, value) => `<li><span>${label}</span><strong>${value}</strong></li>`;

    sheet.innerHTML = `
      <div class="tour-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="tourSheetTitle">
        <div class="tour-sheet-head">
          <h2 id="tourSheetTitle">Rezervasyon özeti</h2>
          <button class="tour-icon-btn" type="button" data-sheet="close" aria-label="Kapat">${ic('close')}</button>
        </div>
        <p class="tour-sheet-tour">${hotel.title}</p>
        <ul class="tour-sheet-lines">
          ${satir('Giriş – çıkış', dateRangeText())}
          ${satir('Konaklama', hesap.nights + ' gece · ' + hesap.board.label)}
          ${satir('Oda', hesap.room.name + ' × ' + hesap.rooms)}
          ${satir('Misafir', hesap.adults + ' yetişkin'
            + (hesap.children ? ' · ' + hesap.children + ' çocuk' : ''))}
          ${hesap.addons.map(a => satir(a.label, formatTRY(a.amount))).join('')}
          ${satir('Konaklama vergisi', formatTRY(hesap.tax))}
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

  /* Kısa bilgi balonu: sonucu görünmeyen işlemlerin geri bildirimi.
     alert() sayfayı kilitliyor, bu yüzden yok. */
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

      /* Menü tepeye yapıştığında kenarlara kadar uzayıp köşeleri
         düzleşiyor (CSS .is-stuck). CSS'te "yapıştı" seçicisi olmadığı
         için durum burada ölçülüyor. */
      const yapiskanUst = parseFloat(getComputedStyle(nav).top) || 0;
      nav.classList.toggle('is-stuck', nav.getBoundingClientRect().top <= yapiskanUst + 1);

      nav.querySelectorAll('[data-nav]').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-nav') === aktif);
      });

      /* Kaydırma YALNIZCA aktif sekme değiştiğinde: her karede
         scrollTo({behavior:'smooth'}) çağırmak animasyonu baştan
         başlatıyor ve menü sürüklenerek takılıyor. */
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

  /* Mobil başlık banner'ın üzerine bindiği için banner üzerindeki
     düğmeler onun altında kalmamalı. Yükseklik cihazdan cihaza
     değiştiğinden ölçülüp CSS değişkenine yazılıyor; masaüstünde başlık
     gizli olduğundan değer 0 olur. */
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
    const toplam = hotel.gallery.length;
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
     mobilde akışın içine taşınıyor. Klonlanmadığı için dinleyiciler ve
     seçilmiş tarih/oda taşınırken korunuyor. */
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
       document'te DEĞİL, katmanın üzerinde: aksi hâlde katmanı açan
       tıklama document'e kadar baloncuklanıp "dışına tıklandı" sayılır
       ve katman açıldığı anda kapanır. */
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

    /* Işık kutusunda yatay parmak hareketi fotoğraf değiştirir. */
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

    /* Açıklama, SSS, yorumlar, oda kartları */
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

      /* Oda kartındaki düğme: seçili değilse seçer, seçiliyse rezervasyon
         kartına götürür. Seçtikten sonra sayfanın tepesine fırlatmak
         (listede kalmak isteyen misafiri) rahatsız ediyordu; tarayıcı
         yalnızca ikinci dokunuşta hareket ediyor. */
      const odaBtn = e.target.closest('[data-room-pick]');
      if (odaBtn) {
        const id = odaBtn.getAttribute('data-room-pick');
        if (id === state.room) { scrollToBooking(); return; }
        state.room = id;
        syncBooking();
        toast(hotelRoom(hotel, id).name + ' seçildi');
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

    /* Favori ve paylaş: tek yerde, banner'ın sağ üst köşesinde. */
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
      const veri = { title: hotel.title, text: hotel.tagline, url: window.location.href };
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

    /* Rezervasyon kartı: tek delege dinleyici, kart yeniden çizilse de
       bağlı kalır. */
    bookingEl.addEventListener('click', (e) => {
      const tarih = e.target.closest('[data-date]');
      if (tarih) {
        state.checkIn = tarih.getAttribute('data-date');
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

      const oda = e.target.closest('[data-room]');
      if (oda) {
        state.room = oda.getAttribute('data-room');
        syncBooking();
        return;
      }

      const pansiyon = e.target.closest('[data-board]');
      if (pansiyon) {
        state.board = pansiyon.getAttribute('data-board');
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

    /* Yapışkan şerit her yeniden çizildiği için delege dinleyici. */
    const bar = document.getElementById('tourStickyBar');
    if (bar) {
      bar.addEventListener('click', (e) => {
        if (!e.target.closest('#tourStickyCta')) return;
        /* Kart ekranda değilse önce ona götür: oda/tarih seçimi
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
  fill('odalar', roomsMarkup());
  fill('olanaklar', amenitiesMarkup());
  fill('konum', locationMarkup());
  fill('politikalar', policiesMarkup());
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

})();
