/* ---------------- etkinlik içerik sayfası: işaretleme ve etkileşimler ----------------
   Veri ve saf hesaplar event-data.js'te; bu dosya onları işaretlemeye
   çevirir ve davranışları bağlar. Buraya sayfada görünen metin yazılmaz.

   Ortak olanlar tekrar yazılmadı: biçimlendirme/tarih/iade/puan
   hesapları ve ikon seti tour-data.js'ten, görsel kabuk tour.css'ten
   geliyor (docs/otel-sayfasi.md).

   Etkinliğin diğer üç türden farkı SABİT TARİHLER:
     tur      haftanın belirli günleri kalkar
     otel     her gün açık
     aktivite her sabah yapılır
     etkinlik sayılı temsil; biter
   Bu yüzden tarih çipleri takvimden değil TEMSİL LİSTESİNDEN geliyor ve
   sezon tamamlandıysa rezervasyon kartının yerini "program tamamlandı"
   paneli alıyor. */
(function () {

  /* Kayıt veri kapısından (docs/veri-sozlesmesi.md); yayında olmayan veya
     bilinmeyen etkinlik null. */
  const event = MolaVeri.urun('event', eventSlugFromPath(window.location.pathname));
  if (!event) return;

  const KOK = (document.body && document.body.getAttribute('data-root')) || '';

  const TUM_SECTIONS = [
    { id: 'genel-bakis', label: 'Genel Bakış' },
    { id: 'program',     label: 'Temsiller' },
    { id: 'biletler',    label: 'Biletler' },
    { id: 'mekan',       label: 'Mekân' },
    { id: 'bilgiler',    label: 'Kurallar ve İade' },
    { id: 'yorumlar',    label: 'Yorumlar' },
    { id: 'sss',         label: 'SSS' }
  ];
  const SECTIONS = TUM_SECTIONS.filter(sec => document.getElementById(sec.id));

  const GALLERY_WIDTHS = { hero: 1200, thumb: 600, full: 1600 };
  const REVIEWS_STEP = 3;
  const DATE_CHIPS_SHORT = 4;

  const p = event.pricing;
  const puan = ratingSummary(event.ratingBreakdown);
  const temelFiyat = eventPriceFrom(event);
  const listeFiyat = eventListPriceFrom(event);
  const indirim = discountPercent(listeFiyat, temelFiyat);

  /* Yaklaşan temsiller bir kez hesaplanıyor; sayfanın tamamı (tarih
     çipleri, künye, program bölümü, kart) aynı listeyi kullanıyor ki
     geçmiş bir temsil hiçbir yerde seçilebilir görünmesin. */
  const yaklasan = upcomingPerformances(event, new Date());
  const sezonBitti = yaklasan.length === 0;

  const state = {
    date: sezonBitti ? '' : yaklasan[0].date,
    category: event.categories[0].id,
    full: 2,
    student: 0,
    addons: [],
    allDates: false,
    favorite: false,
    reviewStar: 0,
    reviewsShown: REVIEWS_STEP,
    photo: 0
  };

  /* Kontenjan canlı sorgu (sözleşme bölüm 6): cevap gelene kadar null,
     kalan koltuk satırları gizli, satış açık. Birim temsil × bilet
     kategorisi: satırın anahtarı kategori id'si, temsil günü ve saati. */
  let musaitlik = null;
  let satisEngeli = null;
  const temsilSaati = (tarih) => saatAnahtari((yaklasan.find(t => t.date === tarih) || {}).time);
  const kategoriKalan = (katId) => {
    const r = musaitlikKaydi(musaitlik, katId, state.date, temsilSaati(state.date));
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

  const secimTemsil = () => eventPerformance(event, state.date, new Date());

  /* ---------------- galeri ---------------- */
  function galleryMarkup() {
    const foto = event.gallery;
    const kalan = Math.max(0, foto.length - 5);
    return `
      <div class="tour-gallery-grid" role="group" aria-label="Etkinlik fotoğrafları">
        ${foto.map((item, i) => `
          <button class="tour-gallery-cell${i >= 5 ? ' is-extra' : ''}" type="button"
                  data-photo="${i}" aria-label="${item.caption} — büyüt">
            <img src="${eventImage(item.key, i === 0 ? GALLERY_WIDTHS.hero : GALLERY_WIDTHS.thumb)}"
                 alt="${item.caption}"${i === 0 ? '' : ' loading="lazy"'}>
            ${i === 4 && kalan ? `<span class="tour-gallery-more">${ic('image')}+${kalan} fotoğraf</span>` : ''}
          </button>`).join('')}
      </div>
      <div class="tour-gallery-actions">
        <button class="tour-gallery-fav" type="button" id="tourGalleryFav"
                aria-pressed="false" aria-label="Favorilere ekle">${ic('heart')}</button>
        <button class="tour-gallery-share" type="button" id="tourGalleryShare"
                aria-label="Etkinliği paylaş">${ic('share')}</button>
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
          <span class="tour-chip solid">${event.categoryShort}</span>
          ${event.badges.map(b => `<span class="tour-chip">${ic(b.icon)}${b.label}</span>`).join('')}
        </div>
      </div>`;
  }

  /* Künyedeki tarih satırı yaklaşan temsilden geliyor; sezon bittiyse
     onun yerine tamamlandığını yazıyor. */
  function headMetaMarkup() {
    const ilk = yaklasan[0];
    return `
      <a class="tour-head-rating" href="#yorumlar">
        <span class="tour-head-score">${ic('star')}${String(puan.average).replace('.', ',')}</span>
        <span class="tour-head-count">${formatNumberTR(puan.total)} değerlendirme</span>
      </a>
      <span class="tour-head-meta-item">${ic('mapPin')}${event.venueName} · ${event.area}</span>
      <span class="tour-head-meta-item">${ic('calendar')}${ilk
        ? 'Sıradaki temsil ' + formatTrDate(ilk.date) + ' · ' + ilk.time
        : 'Bu sezonun programı tamamlandı'}</span>
      <span class="tour-head-meta-item muted">Etkinlik kodu ${event.code}</span>`;
  }

  function factsMarkup() {
    return event.facts.map(f => `
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
    const fazla = event.description.slice(1);
    return blockHead('Genel bakış', event.tagline) + `
      <ul class="tour-highlights">
        ${event.highlights.map(h => `<li>${ic('check')}<span>${h}</span></li>`).join('')}
      </ul>
      <div class="tour-prose" id="tourProse">
        <p>${event.description[0]}</p>
        <div class="tour-prose-rest" id="tourProseRest" hidden>
          ${fazla.map(t => `<p>${t}</p>`).join('')}
        </div>
      </div>
      ${fazla.length ? `<button class="tour-text-btn" type="button" id="tourProseToggle"
        aria-expanded="false" aria-controls="tourProseRest">Devamını oku${ic('chevDown')}</button>` : ''}`;
  }

  /* ---------------- temsil takvimi ----------------
     GEÇMİŞ TEMSİL DE GÖSTERİLİYOR ama soluk ve seçilemez: "bu festival
     neler oynadı" bilgisi sayfanın değeri, ama satın alınabilir gibi
     durmamalı. Yaklaşan satırlar tıklanınca o temsil seçiliyor. */
  function performanceRowMarkup(t) {
    const gecti = yaklasan.indexOf(t) === -1;
    const secili = !gecti && t.date === state.date;
    const parca = trDateParts(t.date);
    return `
      <li class="etk-temsil${gecti ? ' is-gecmis' : ''}${secili ? ' is-secili' : ''}"
          data-perf="${t.date}"${gecti ? '' : ' tabindex="0" role="button"'}>
        <span class="etk-temsil-tarih">
          <strong>${parca.gun}</strong>
          <span>${parca.ay}</span>
          <span class="etk-temsil-gun">${parca.hafta}</span>
        </span>
        <span class="etk-temsil-body">
          <span class="etk-temsil-head">
            <strong>${t.title}</strong>
            <span class="tour-stop-badge">${t.kind}</span>
            ${secili ? `<span class="etk-temsil-secili">${ic('check')}Seçili</span>` : ''}
            ${gecti ? `<span class="etk-temsil-gecmis">Geçti</span>` : ''}
          </span>
          <span class="etk-temsil-detay">${t.detail}</span>
        </span>
        <span class="etk-temsil-saat">${ic('clock')}${t.time}</span>
      </li>`;
  }

  function programMarkup() {
    const not = sezonBitti
      ? 'Bu sezonun programı tamamlandı; yeni takvim açıklandığında burada görünecek.'
      : yaklasan.length + ' temsil kaldı · ' + event.durationLabel;
    return blockHead('Temsil takvimi', not) + `
      <ul class="etk-temsil-list" id="etkTemsilList">
        ${event.performances.map(performanceRowMarkup).join('')}
      </ul>
      <p class="tour-note">${ic('info')}<span>${event.doorsLabel}; temsil
        ${p.startTime}’da başlar. Geç gelen misafirler ilk aranın sonuna kadar bekler.</span></p>`;
  }

  /* Satırlar yeniden çizilmiyor: yalnızca seçim sınıfı ve rozeti
     güncelleniyor (kaydırma konumu ve odak bozulmasın). */
  function syncPerformanceRows() {
    $$('#etkTemsilList [data-perf]').forEach(satir => {
      const tarih = satir.getAttribute('data-perf');
      const gecmis = satir.classList.contains('is-gecmis');
      const secili = !gecmis && tarih === state.date;
      satir.classList.toggle('is-secili', secili);
      const bas = satir.querySelector('.etk-temsil-head');
      if (!bas) return;
      const eski = bas.querySelector('.etk-temsil-secili');
      if (secili && !eski) {
        bas.insertAdjacentHTML('beforeend',
          '<span class="etk-temsil-secili">' + ic('check') + 'Seçili</span>');
      }
      if (!secili && eski) eski.remove();
    });
  }

  /* ---------------- bilet kategorileri ---------------- */
  function categoryCardMarkup(kat) {
    const secili = kat.id === state.category;
    const indirimOran = discountPercent(kat.priceList, kat.price);
    return `
      <article class="etk-kategori${secili ? ' is-secili' : ''}" data-cat-card="${kat.id}">
        <div class="etk-kategori-media">
          <img src="${eventImage(kat.key, GALLERY_WIDTHS.thumb)}" alt="${kat.name}" loading="lazy">
        </div>
        <div class="etk-kategori-body">
          <div class="etk-kategori-head">
            <h3>${kat.name}</h3>
            ${secili ? `<span class="etk-kategori-secili">${ic('check')}Seçili</span>` : ''}
          </div>
          <div class="etk-kategori-meta">
            <span>${ic('mapPin')}${kat.block}</span>
            <span>${ic('users')}${formatNumberTR(kat.seats)} koltuk</span>
            <span>${ic('info')}${Number(kat.student) > 0
              ? 'Öğrenci ' + formatTRY(kat.student)
              : 'Öğrenci tarifesi yok'}</span>
          </div>
          <ul class="etk-kategori-ozellik">
            ${kat.features.map(f => `<li>${ic('check')}<span>${f}</span></li>`).join('')}
          </ul>
          <p class="etk-kategori-not">${ic('info')}<span>${kat.note}</span></p>
          <div class="etk-kategori-alt">
            <span class="etk-kategori-fiyat">
              ${indirimOran > 0 ? `<span class="tour-price-was">${formatTRY(kat.priceList)}</span>` : ''}
              <strong>${formatTRY(kat.price)}</strong>
              <span>${p.unitNote}</span>
            </span>
            <button class="tour-cta small${secili ? ' ghost' : ''}" type="button" data-cat-pick="${kat.id}"
                    ${sezonBitti ? 'disabled' : ''}>
              ${secili ? 'Bilete git' : 'Bu bloğu seç'}${ic('chevRight')}
            </button>
          </div>
          <p class="etk-kategori-kalan" data-cat-left="${kat.id}"></p>
        </div>
      </article>`;
  }

  function categoriesMarkup() {
    return blockHead('Bilet kategorileri',
      `${event.categories.length} blok · ${formatTRY(temelFiyat)}’den başlayan fiyatlar`)
      + `<div class="etk-kategori-list" id="etkKategoriList">
           ${event.categories.map(categoryCardMarkup).join('')}
         </div>
         <p class="tour-note">${ic('info')}<span>Fiyatlar bilet başıdır;
           hizmet bedeli (${formatTRY(p.servicePerTicket)} / bilet) rezervasyon özetinde
           ayrı satır olarak görünür. ${p.studentNote}.</span></p>`;
  }

  function syncCategoryCards() {
    event.categories.forEach(kat => {
      const kart = document.querySelector('[data-cat-card="' + kat.id + '"]');
      if (kart) kart.classList.toggle('is-secili', kat.id === state.category);

      const bas = kart && kart.querySelector('.etk-kategori-head');
      if (bas) {
        const eski = bas.querySelector('.etk-kategori-secili');
        if (kat.id === state.category && !eski) {
          bas.insertAdjacentHTML('beforeend',
            '<span class="etk-kategori-secili">' + ic('check') + 'Seçili</span>');
        }
        if (kat.id !== state.category && eski) eski.remove();
      }

      const btn = document.querySelector('[data-cat-pick="' + kat.id + '"]');
      if (btn) {
        btn.classList.toggle('ghost', kat.id === state.category);
        btn.innerHTML = (kat.id === state.category ? 'Bilete git' : 'Bu bloğu seç') + ic('chevRight');
      }

      const kalanEl = document.querySelector('[data-cat-left="' + kat.id + '"]');
      if (kalanEl) {
        if (sezonBitti) { kalanEl.textContent = ''; return; }
        const kalan = kategoriKalan(kat.id);
        kalanEl.hidden = kalan === null;
        kalanEl.className = 'etk-kategori-kalan' + (kalan !== null && kalan <= 3 ? ' is-low' : '');
        kalanEl.innerHTML = kalan === null ? ''
          : kalan === 0 ? ic('bolt') + 'Seçili temsilde <strong>bu blok tükendi</strong>'
          : ic('bolt') + 'Seçili temsilde <strong>' + kalan + ' koltuk</strong> kaldı';
      }
    });
  }

  /* ---------------- mekân ---------------- */
  function venueMarkup() {
    const v = event.venue;
    return blockHead('Mekân ve ulaşım', event.venueName + ' · ' + event.area) + `
      <div class="tour-meeting">
        <div class="tour-meeting-card">
          <span class="tour-meeting-pin">${tourSvg('mapPin')}</span>
          <div class="tour-meeting-body">
            <strong>${v.title}</strong>
            <p class="tour-meeting-address">${v.address}</p>
            <a class="tour-meeting-link" href="${v.mapUrl}" target="_blank" rel="noopener">
              Haritada aç ve yol tarifi al${ic('chevRight')}</a>
          </div>
        </div>
        <ul class="etk-ulasim">
          ${v.access.map(a => `<li>${ic(a.icon)}<span>${a.text}</span></li>`).join('')}
        </ul>
        <p class="tour-note">${ic('info')}<span>${v.note}</span></p>
      </div>`;
  }

  /* ---------------- kurallar, yağmur ve iade ----------------
     Yağmur kuralı iade tablosunun içinde değil, kendi kutusunda: iptal
     değil AKTARIM, ve tablonun içine konsaydı "son 24 saat: iade yok"
     satırının yanında kaybolurdu. Aktivitedeki hava kutusunun
     karşılığı, ama sonucu farklı (orada koşulsuz iade, burada yeni
     tarihe aktarım) -- ikisi de kendi kaydından okunuyor. */
  function infoMarkup() {
    const iptal = event.cancellation;
    const ornek = Number(iptal.exampleTotal) || temelFiyat;
    const basamak = iptal.tiers.slice().sort((a, b) => b.minHours - a.minHours);

    return blockHead('Mekân kuralları ve iade', 'Yola çıkmadan önce iki dakikada okunur.') + `
      <div class="etk-kural-grid">
        ${event.rules.map(k => `
          <div class="tour-info-card">
            <h3>${ic(k.icon)}${k.title}</h3>
            <p>${k.text}</p>
          </div>`).join('')}
      </div>

      <div class="etk-hava">
        <span class="etk-hava-ikon">${tourSvg('refresh')}</span>
        <div class="etk-hava-body">
          <strong>${event.weather.title}</strong>
          <p>${event.weather.text}</p>
        </div>
      </div>

      <div class="tour-refund">
        <h3>${ic('calendar')}Misafir iptali</h3>
        <p class="tour-refund-lead">Temsil saatine kalan süreye göre iade oranı.
          Sağdaki tutarlar ${formatTRY(ornek)} tutarında tek bilet içindir.</p>
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
        <p class="tour-note">${ic('info')}<span>${iptal.note}</span></p>
      </div>`;
  }

  /* ---------------- yorumlar ---------------- */
  function reviewsMarkup() {
    const yildizSayilari = [5, 4, 3, 2, 1].map(s => filterReviews(event.reviews, s).length);
    const cipler = [{ star: 0, label: 'Tümü', count: event.reviews.length }]
      .concat([5, 4, 3, 2, 1].map((s, i) => ({ star: s, label: s + ' yıldız', count: yildizSayilari[i] })))
      .filter(c => c.count > 0);

    return blockHead('İzleyiciler ne diyor',
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
          ${event.ratingAspects.map(a => `
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
        <span class="tour-review-verified">${ic('shield')}Doğrulanmış izleyici</span>
      </article>`;
  }

  function renderReviews() {
    const liste = filterReviews(event.reviews, state.reviewStar);
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
        ${event.faq.map((f, i) => `
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
    return catalogBenzerMarkup(event, {
      kok: KOK,
      yildiz: ic('star'),
      gorsel: (anahtar) => (typeof cardImages !== 'undefined' && cardImages[anahtar]) || ''
    });
  }

  function tagHref(t) {
    return String(t.href).charAt(0) === '#' ? t.href : KOK + t.href;
  }

  function tagsMarkup() {
    const etiketler = event.tags || [];
    if (!etiketler.length) return '';
    return `
      <div class="tour-block-head"><h2>Sayfa etiketleri</h2><p>Bu etkinlikle ilgili bölümler ve yakın kategoriler.</p></div>
      <ul class="seo-chip-list tour-tag-list">
        ${etiketler.map(t => `<li><a class="seo-chip" href="${tagHref(t)}">${t.label}</a></li>`).join('')}
      </ul>`;
  }

  /* ---------------- rezervasyon kartı ---------------- */
  const bookingEl = document.createElement('section');
  bookingEl.className = 'tour-booking';
  bookingEl.id = 'tourBooking';
  bookingEl.setAttribute('aria-label', 'Bilet');

  /* Tarih çipleri TAKVİMDEN DEĞİL temsil listesinden geliyor: etkinlik
     yalnızca o gecelerde var. */
  function dateChipsMarkup() {
    const liste = state.allDates ? yaklasan : yaklasan.slice(0, DATE_CHIPS_SHORT);
    return liste.map(t => {
      const parca = trDateParts(t.date);
      const on = t.date === state.date;
      /* Bütün blokları satılmış temsil: çip duruyor, seçilemiyor. */
      const dolu = tarihDoluMu(musaitlik, t.date);
      return `
        <button class="tour-date-chip etk-date-chip${on ? ' active' : ''}${dolu ? ' is-dolu' : ''}" type="button"
                data-date="${t.date}" aria-pressed="${on}"${dolu ? ' disabled' : ''}
                aria-label="${formatTrDate(t.date)} · ${t.title}${dolu ? ' — tükendi' : ''}">
          <span class="tour-date-day">${parca.hafta}</span>
          <strong>${parca.gun}</strong>
          <span class="tour-date-month">${dolu ? 'tükendi' : parca.ay}</span>
          <span class="etk-date-eser">${t.title}</span>
        </button>`;
    }).join('');
  }

  function categoryChipsMarkup() {
    return event.categories.map(kat => `
      <button class="tour-city-chip etk-kategori-chip${kat.id === state.category ? ' active' : ''}" type="button"
              data-category="${kat.id}" aria-pressed="${kat.id === state.category ? 'true' : 'false'}">
        <strong>${kat.name}</strong>
        <span>${kat.block}</span>
        <span class="tour-city-fee">${formatTRY(kat.price)} / bilet</span>
      </button>`).join('');
  }

  const TICKET_ROWS = [
    { key: 'full',    label: 'Tam bilet', note: 'Standart tarife' },
    { key: 'student', label: 'Öğrenci',   note: p.studentNote }
  ];

  function ticketRowsMarkup() {
    return TICKET_ROWS.map(row => `
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
    return event.addons.map(a => `
      <label class="tour-addon" for="addon-${a.id}">
        <input type="checkbox" id="addon-${a.id}" data-addon="${a.id}">
        <span class="tour-addon-box">${tourSvg('check')}</span>
        <span class="tour-addon-body">
          <strong>${a.label}</strong>
          <span>${a.text}</span>
        </span>
        <span class="tour-addon-price" data-addon-price="${a.id}">
          +${formatTRY(a.price)}<span>${a.per === 'ticket' ? '/bilet' : '/rezervasyon'}</span>
        </span>
      </label>`).join('');
  }

  function summaryMarkup(hesap) {
    const satir = (l) => `
      <li class="${l.kind}"><span>${l.label}</span><span>${formatTRY(l.amount)}</span></li>`;

    const temsil = secimTemsil();
    const biletler = [
      hesap.full + ' tam',
      hesap.student ? hesap.student + ' öğrenci' : ''
    ].filter(Boolean).join(' · ');

    return `
      <ul class="tour-sum-lines">${hesap.lines.map(satir).join('')}</ul>
      ${hesap.saving > 0 ? `<p class="tour-sum-save">${ic('sparkle')}Liste fiyatına göre
        <strong>${formatTRY(hesap.saving)}</strong> avantaj</p>` : ''}
      <div class="tour-sum-total">
        <span>Toplam</span>
        <strong>${formatTRY(hesap.total)}</strong>
      </div>
      <p class="tour-sum-note">Hizmet bedeli dahil · ${biletler} · ${temsil
        ? formatTrDate(temsil.date) + ' ' + temsil.time : ''}</p>`;
  }

  /* Sezon bittiğinde kartın yerini bu panel alıyor: satın alınamayan bir
     forma bakmak, "tükendi mi, bozuk mu" sorusunu doğuruyordu. */
  function seasonOverMarkup() {
    return `
      <div class="etk-sezon-bitti">
        <span class="etk-sezon-ikon">${tourSvg('calendar')}</span>
        <strong>Bu sezonun programı tamamlandı</strong>
        <p>${event.title} için yeni takvim açıklandığında biletler burada satışa açılacak.
          Favorilere eklerseniz yeni tarihler ilan edildiğinde haber veriyoruz.</p>
        <a class="tour-cta ghost" href="${KOK}etkinlikler/">
          ${ic('chevLeft')}Diğer etkinliklere bak</a>
      </div>
      <div class="tour-booking-contact">
        <a class="tour-booking-help" href="${CONTACT.phoneHref}">
          ${ic('phone')}<span><strong>${CONTACT.phoneLabel}</strong>${CONTACT.hours}</span></a>
      </div>`;
  }

  function bookingMarkup() {
    if (sezonBitti) return seasonOverMarkup();
    return `
      <div class="tour-booking-top">
        <div class="tour-price">
          ${indirim > 0 ? `<span class="tour-price-was">${formatTRY(listeFiyat)}</span>` : ''}
          <strong class="tour-price-now">${formatTRY(temelFiyat)}</strong>
          <span class="tour-price-unit">${p.unitNote}</span>
          ${indirim > 0 ? `<span class="tour-price-off">%${indirim} indirim</span>` : ''}
        </div>
        <p class="tour-booking-social">${ic('sparkle')}Son 24 saatte
          ${event.social.viewedLast24h} kişi bu etkinliği görüntüledi · bu hafta
          ${event.social.bookedThisWeek} bilet</p>
      </div>

      <div class="tour-booking-field">
        <div class="tour-field-head">
          <span class="tour-field-label">${ic('calendar')}Temsil</span>
          ${yaklasan.length > DATE_CHIPS_SHORT
            ? `<button class="tour-text-btn small" type="button" id="tourAllDates"
                 aria-expanded="false">Tüm temsiller</button>`
            : ''}
        </div>
        <div class="tour-date-chips" id="tourDateChips" role="group"
             aria-label="Temsil tarihleri">${dateChipsMarkup()}</div>
        <p class="tour-date-note" id="etkTemsilNot"></p>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('mapPin')}Blok</span>
        <div class="tour-city-chips" role="group" aria-label="Bilet kategorisi">${categoryChipsMarkup()}</div>
        <div class="tour-seats" id="tourSeats"></div>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('users')}Bilet</span>
        <div class="tour-party">${ticketRowsMarkup()}</div>
        <p class="tour-party-limit" id="tourPartyLimit"></p>
      </div>

      <div class="tour-booking-field">
        <span class="tour-field-label">${ic('plus')}Ek hizmetler</span>
        <div class="tour-addons">${addonRowsMarkup()}</div>
      </div>

      <div class="tour-summary" id="tourSummary"></div>

      <button class="tour-cta" type="button" id="tourReserve">
        Bileti al${ic('chevRight')}</button>

      <ul class="tour-booking-trust">
        ${event.trust.map(t => `<li>${ic(t.icon)}<span>${t.text}</span></li>`).join('')}
      </ul>

      <div class="tour-booking-contact">
        <a class="tour-booking-help" href="${CONTACT.phoneHref}">
          ${ic('phone')}<span><strong>${CONTACT.phoneLabel}</strong>${CONTACT.hours}</span></a>
        <a class="tour-booking-help" href="${CONTACT.whatsappHref}"
           target="_blank" rel="noopener">
          ${whatsappIkon()}<span><strong>WhatsApp'tan yaz</strong>${destekDurumu()}</span></a>
      </div>`;
  }

  /* Kalan koltuk: kontenjan cevabından, seçili temsil ve blok için.
     İstenen: bilet adedi (tam + öğrenci). Önceki sürüm kapasiteyi 40'ta
     kesiyordu, çünkü karma değerden üretilen sayı zaten 9'u geçmiyordu;
     artık bloğun gerçek koltuk sayısı. */
  function syncSeats(hesap) {
    const kat = hesap.category || event.categories[0];
    const durum = kontenjanDurumu(kategoriKalan(kat.id), hesap.tickets, 10);
    satisEngeli = (durum.durum === 'doldu' || durum.durum === 'yetersiz') ? durum.durum : null;
    const dugme = document.getElementById('tourReserve');
    if (dugme) dugme.disabled = !!satisEngeli;

    const el = document.getElementById('tourSeats');
    if (!el) return;
    el.hidden = durum.durum === 'bilinmiyor';
    if (el.hidden) { el.innerHTML = ''; return; }
    const kapasite = Math.max(1, Number(kat.seats) || 1);
    const dolu = Math.max(0, Math.min(100, Math.round(((kapasite - durum.kalan) / kapasite) * 100)));
    el.classList.toggle('is-low', durum.durum !== 'var');
    const metin = {
      doldu: 'Bu temsilde <strong>' + kat.name + ' tükendi</strong> · başka bir blok veya temsil seçin',
      yetersiz: 'Bu temsilde bu blokta en fazla <strong>' + durum.kalan + ' koltuk</strong> var'
    }[durum.durum] || 'Bu temsilde <strong>' + durum.kalan + ' koltuk</strong> kaldı';
    el.innerHTML = `
      <span class="tour-seats-bar"><span class="tour-seats-fill" style="width:${dolu}%"></span></span>
      <span class="tour-seats-text">${ic('users')}<span>${metin}</span></span>`;
  }

  function syncBooking() {
    if (sezonBitti) { syncStickyBar(null); return; }

    const hesap = calcEventTotal(event, state);
    state.full = hesap.full;
    state.student = hesap.student;

    bookingEl.querySelectorAll('[data-date]').forEach(btn => {
      const on = btn.getAttribute('data-date') === state.date;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    ['full', 'student'].forEach(key => {
      const out = bookingEl.querySelector('[data-count="' + key + '"]');
      if (out) out.textContent = String(state[key]);
    });

    bookingEl.querySelectorAll('[data-step]').forEach(btn => {
      const hedef = btn.getAttribute('data-target');
      const yon = Number(btn.getAttribute('data-step'));
      const deneme = Object.assign({}, state);
      deneme[hedef] = state[hedef] + yon;
      const sonuc = clampTickets(event, deneme);
      btn.disabled = sonuc[hedef] === state[hedef];
    });

    /* Öğrenci satırı locada satılmıyor: sayaç sıfırda kalıyor ve nedeni
       satırın altında yazıyor. */
    const ogrenciNot = bookingEl.querySelector('[data-row-note="student"]');
    if (ogrenciNot) {
      ogrenciNot.textContent = hesap.studentAllowed
        ? p.studentNote
        : hesap.category.name + ' için öğrenci tarifesi yok';
    }
    const ogrenciSatir = bookingEl.querySelector('[data-party="student"]');
    if (ogrenciSatir) ogrenciSatir.classList.toggle('is-pasif', !hesap.studentAllowed);

    const temsil = secimTemsil();
    const not = document.getElementById('etkTemsilNot');
    if (not && temsil) {
      not.innerHTML = ic('star') + temsil.title + ' · ' + temsil.kind
        + ' · ' + temsil.time + ' · ' + event.doorsLabel;
    }

    const limitEl = document.getElementById('tourPartyLimit');
    if (limitEl) {
      limitEl.textContent = hesap.tickets >= p.maxTickets
        ? 'Tek rezervasyonda en fazla ' + p.maxTickets + ' bilet alınabilir.'
        : 'Her çocuğun ayrı bileti olmalı · 0 – 5 yaş kabul edilmiyor';
    }

    bookingEl.querySelectorAll('[data-category]').forEach(btn => {
      const on = btn.getAttribute('data-category') === state.category;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      /* Seçili temsilde tükenen blok seçilemiyor; temsil değişince
         yeniden bakılıyor. */
      const tukendi = kategoriKalan(btn.getAttribute('data-category')) === 0;
      btn.classList.toggle('is-dolu', tukendi);
      btn.disabled = tukendi;
    });

    event.addons.forEach(a => {
      const fiyatEl = bookingEl.querySelector('[data-addon-price="' + a.id + '"]');
      if (fiyatEl && a.per === 'ticket') {
        fiyatEl.innerHTML = '+' + formatTRY((Number(a.price) || 0) * hesap.tickets)
          + '<span>' + hesap.tickets + ' bilet</span>';
      }
      const kutu = bookingEl.querySelector('[data-addon="' + a.id + '"]');
      if (kutu) kutu.checked = state.addons.indexOf(a.id) !== -1;
    });

    const ozet = document.getElementById('tourSummary');
    if (ozet) ozet.innerHTML = summaryMarkup(hesap);

    syncSeats(hesap);
    syncCategoryCards();
    syncPerformanceRows();
    syncStickyBar(hesap);
  }

  /* ---------------- yapışkan alt şerit (mobil) ---------------- */
  function syncStickyBar(hesap) {
    const bar = document.getElementById('tourStickyBar');
    if (!bar) return;
    if (sezonBitti) {
      bar.innerHTML = `
        <div class="tour-sticky-info">
          <span class="tour-sticky-date">Bu sezonun programı tamamlandı</span>
        </div>
        <a class="tour-cta small" href="${KOK}etkinlikler/">Etkinlikler</a>`;
      return;
    }
    const toplam = hesap || calcEventTotal(event, state);
    const temsil = secimTemsil();
    bar.innerHTML = `
      <div class="tour-sticky-info">
        <span class="tour-sticky-price">
          <strong>${formatTRY(toplam.total)}</strong>
          <span class="tour-sticky-guests">/ ${toplam.tickets} bilet</span>
        </span>
        <span class="tour-sticky-date">${temsil ? formatTrDateRangeShort(temsil.date, '') : ''}</span>
      </div>
      <button class="tour-cta small" type="button" id="tourStickyCta"${satisEngeli ? ' disabled' : ''}>Bileti al</button>`;
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
            ${event.gallery.map((g, i) => `
              <button class="tour-lb-thumb" type="button" data-lb-go="${i}" aria-label="${g.caption}">
                <img src="${eventImage(g.key, 300)}" alt="" loading="lazy">
              </button>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function showPhoto(index) {
    const toplam = event.gallery.length;
    state.photo = ((Math.round(Number(index) || 0) % toplam) + toplam) % toplam;
    const foto = event.gallery[state.photo];
    const img = document.getElementById('tourLbImg');
    if (img) {
      img.src = eventImage(foto.key, GALLERY_WIDTHS.full);
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

  /* ---------------- bilet özeti sayfası ---------------- */
  function openSheet() {
    const sheet = document.getElementById('tourSheet');
    if (!sheet || sezonBitti) return;
    const hesap = calcEventTotal(event, state);
    const temsil = secimTemsil();
    const satir = (label, value) => `<li><span>${label}</span><strong>${value}</strong></li>`;

    sheet.innerHTML = `
      <div class="tour-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="tourSheetTitle">
        <div class="tour-sheet-head">
          <h2 id="tourSheetTitle">Bilet özeti</h2>
          <button class="tour-icon-btn" type="button" data-sheet="close" aria-label="Kapat">${ic('close')}</button>
        </div>
        <p class="tour-sheet-tour">${event.title}</p>
        <ul class="tour-sheet-lines">
          ${temsil ? satir('Temsil', temsil.title + ' · ' + temsil.kind) : ''}
          ${temsil ? satir('Tarih', formatTrDate(temsil.date) + ' · ' + temsil.time) : ''}
          ${satir('Mekân', event.venueName)}
          ${satir('Blok', hesap.category.name + ' · ' + hesap.category.block)}
          ${satir('Bilet', hesap.full + ' tam'
            + (hesap.student ? ' · ' + hesap.student + ' öğrenci' : ''))}
          ${hesap.addons.map(a => satir(a.label, formatTRY(a.amount))).join('')}
          ${satir('Hizmet bedeli', formatTRY(hesap.serviceTotal))}
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
    const toplam = event.gallery.length;
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
    const cta = document.getElementById('tourReserve') || document.getElementById('tourBooking');
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

      /* Temsil satırına tıklamak o geceyi seçiyor; geçmiş satırlar
         seçilemiyor (data-perf taşıyor ama is-gecmis). */
      const temsilSatir = e.target.closest('#etkTemsilList [data-perf]');
      if (temsilSatir) {
        if (temsilSatir.classList.contains('is-gecmis') || sezonBitti) return;
        state.date = temsilSatir.getAttribute('data-perf');
        const kap = document.getElementById('tourDateChips');
        if (kap) kap.innerHTML = dateChipsMarkup();
        syncBooking();
        const secilen = secimTemsil();
        if (secilen) toast(formatTrDate(secilen.date) + ' · ' + secilen.title + ' seçildi');
        return;
      }

      const katBtn = e.target.closest('[data-cat-pick]');
      if (katBtn) {
        const id = katBtn.getAttribute('data-cat-pick');
        if (id === state.category) { scrollToBooking(); return; }
        state.category = id;
        syncBooking();
        toast(eventCategory(event, id).name + ' seçildi');
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

    /* Temsil satırı klavyeyle de seçilebiliyor (role="button"). */
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const satir = e.target.closest && e.target.closest('#etkTemsilList [data-perf]');
      if (!satir || satir.classList.contains('is-gecmis')) return;
      e.preventDefault();
      satir.click();
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
      const veri = { title: event.title, text: event.tagline, url: window.location.href };
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

      const kategori = e.target.closest('[data-category]');
      if (kategori) {
        state.category = kategori.getAttribute('data-category');
        syncBooking();
        return;
      }

      const tumTarih = e.target.closest('#tourAllDates');
      if (tumTarih) {
        state.allDates = !state.allDates;
        const kap = document.getElementById('tourDateChips');
        if (kap) kap.innerHTML = dateChipsMarkup();
        tumTarih.textContent = state.allDates ? 'Daha az temsil' : 'Tüm temsiller';
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
  fill('program', programMarkup());
  fill('biletler', categoriesMarkup());
  fill('mekan', venueMarkup());
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

  /* Kontenjan: yaklaşan bütün temsiller için tek sorgu. Varsayılan
     temsil tamamen tükenmişse ilk müsait temsile, seçili blok o temsilde
     tükenmişse müsait ilk bloğa geçiliyor. */
  if (!sezonBitti) {
    MolaVeri.musaitlik('event', event.slug, { from: yaklasan[0].date, to: yaklasan[yaklasan.length - 1].date })
      .then(cevap => {
        musaitlik = cevap;
        if (tarihDoluMu(musaitlik, state.date)) {
          const ilk = yaklasan.find(t => !tarihDoluMu(musaitlik, t.date));
          if (ilk) state.date = ilk.date;
        }
        if (kategoriKalan(state.category) === 0) {
          const blok = event.categories.find(k => kategoriKalan(k.id) !== 0);
          if (blok) state.category = blok.id;
        }
        const kap = document.getElementById('tourDateChips');
        if (kap) kap.innerHTML = dateChipsMarkup();
        syncBooking();
      })
      .catch(() => { /* Kontenjan bilinmiyor: satırlar gizli, satış açık. */ });
  }

})();
