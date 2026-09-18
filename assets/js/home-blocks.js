/* ---------------- anasayfa ara bloklari ----------------
   Kart seritlerinin arasina giren bloklarin verisi, saf yardimcilari ve
   isaretlemesi. app.js'ten ONCE yuklenir; isaretleme uretici fonksiyonlar
   app.js'teki svg() ve cardImages'i cagrildiklari anda kullanir.

   Bloklarin sayfadaki yeri HOME_BLOCK_PLACEMENT ile belirlenir: anahtar
   kart seridinin basligi, deger o seritten SONRA gelecek bloklar.
   Bir blogu kaldirmak icin buradaki satirini silmek yeterli. */

const HOME_BLOCK_PLACEMENT = {
  'Yaklaşan Planlar': ['promo'],
  'Günübirlik Turlar': ['themes'],
  'Aktiviteler': ['venues'],
  'Oteller': ['collectionGrid', 'newsletter', 'support']
};

/* ---- Yaklasan Etkinlikler seridideki zaman filtreleri ----
   Ilk siradaki secenek varsayilan olarak acilir. */
const UPCOMING_FILTERS = [
  { key: 'tumu',      label: 'Tümü' },
  { key: 'cuma',      label: 'Bu Cuma' },
  { key: 'cumartesi', label: 'Bu Cumartesi' },
  { key: 'pazar',     label: 'Bu Pazar' }
];

/* Gun filtreleri: kayittaki dayKey bu anahtarlarla eslesir. */
const UPCOMING_DAY_KEYS = ['cuma', 'cumartesi', 'pazar'];

/* ---- Temaya göre koleksiyonlar (yatay şerit) ---- */
const THEME_COLLECTIONS = [
  { img:'ege2',       title:'Balayı Kaçamakları', count:'24 tur' },
  { img:'uludag',     title:'Kış & Kayak',        count:'12 tur' },
  { img:'iznik2',     title:'Doğa Yürüyüşü',      count:'31 tur' },
  { img:'bogaz',      title:'Şehir Turları',      count:'18 tur' },
  { img:'kapadokya',  title:'Fotoğraf Rotaları',  count:'9 tur' },
  { img:'coffee1',    title:'Lezzet Durakları',   count:'15 etkinlik' }
];

/* ---- Koleksiyon ızgarası (kaydırmasız) ---- */
const GRID_COLLECTIONS = [
  { img:'abant2',     title:'Ailece',      text:'Çocuklu ailelere uygun' },
  { img:'assos',      title:'Romantik',    text:'İki kişilik kaçamaklar' },
  { img:'market1',    title:'Bütçe Dostu', text:'500 TL altı seçenekler' },
  { img:'paraglide3', title:'Adrenalin',   text:'Cesaret isteyenlere' }
];

/* ---- Mekanlar ----
   Diger seritlerden farkli olarak dikey liste: gorsel solda, bilgi sagda.
   open:true olan mekan "Açık" rozetiyle isaretlenir. */
const VENUES = [
  { img:'coffee1',  type:'Kahvaltı',     title:'Cumalıkızık Köy Kahvaltısı', area:'Cumalıkızık, Yıldırım', rating:'4.7', reviews:'320+', hours:'08:00 – 18:00', open:true },
  { img:'uludag',   type:'Gezi Noktası', title:'Uludağ Teleferik',           area:'Teferrüç, Osmangazi',   rating:'4.8', reviews:'1,2b+', hours:'09:00 – 20:00', open:true },
  { img:'theatre1', type:'Müze',         title:'Bursa Kent Müzesi',          area:'Heykel, Osmangazi',     rating:'4.6', reviews:'180+',  hours:'09:00 – 17:00', open:false },
  { img:'market1',  type:'Çarşı',        title:'Kapalıçarşı ve Koza Han',    area:'Osmangazi',             rating:'4.7', reviews:'640+',  hours:'10:00 – 19:00', open:true },
  { img:'iznik',    type:'Tarihi Doku',  title:'İnkaya Çınarı',              area:'Çekirge, Osmangazi',    rating:'4.5', reviews:'90+',   hours:'Her zaman açık', open:true }
];

/* ---- Kampanyalar (yatay kaydirilabilir) ---- */
const PROMO_BANDS = [
  { img:'karadeniz2', badge:'Son 3 gün',         title:'Yayla ve doğa turlarında %40\'a varan indirim', text:'Eylül sonuna kadar seçili Karadeniz turlarında geçerli.', cta:'Fırsatları gör' },
  { img:'kapadokya',  badge:'Erken rezervasyon', title:'Kapadokya turlarında 500 TL indirim',           text:'30 gün öncesinden alan herkese, tüm kalkışlarda.',        cta:'Turları gör' },
  { img:'hotel4',     badge:'Hafta sonu',        title:'Otellerde 2 gece kal, 1 gece öde',              text:'Seçili termal ve şehir otellerinde geçerli.',             cta:'Otelleri gör' },
  { img:'balloon3',   badge:'Yeni üyelere',      title:'İlk rezervasyonda %15 indirim',                 text:'Üye ol, indirim kodu e-postana gelsin.',                  cta:'Üye ol' }
];

/* ---- Bulten karti: kisa fayda listesi ---- */
const NEWSLETTER_PERKS = [
  'Üyelere özel indirim kodları',
  'Haftada tek e-posta, spam yok',
  'Tek tıkla çıkış'
];

/* ---- Iletisim bilgileri (tek yerden degistirilir) ---- */
const CONTACT = {
  phoneLabel: '0850 000 00 00',
  phoneHref: 'tel:+908500000000',
  hours: 'Her Gün 09:00 – 22:00',
  whatsappHref: 'https://wa.me/900000000000'
};

const WHATSAPP_ICON_PATH = 'M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.28A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.13c-1.6 0-3.13-.43-4.46-1.24l-.32-.19-3.12.76.78-3.05-.2-.31A8.13 8.13 0 1 1 20.17 12a8.14 8.14 0 0 1-8.13 8.13Zm4.47-6.08c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3s-.85.83-.85 2.02.87 2.35.99 2.51c.12.16 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z';

/* ---------------- saf yardimcilar ---------------- */

/* Yaklasan etkinlikler her durumda en yakin tarihten uzaga dogru siralanir;
   filtre yalnizca hangilerinin listelenecegini belirler. */
function filterUpcomingItems(items, key) {
  const list = Array.isArray(items) ? items : [];
  const byDistance = (a, b) => (Number(a.inDays) || 0) - (Number(b.inDays) || 0);
  const sonuc = UPCOMING_DAY_KEYS.includes(key)
    ? list.filter(item => item.dayKey === key)
    : list;
  return sonuc.slice().sort(byDistance);
}

/* Basit ve sert olmayan bir kontrol: bosluk yok, tek @, alan adinda nokta. */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

/* Turkiye numarasi: bosluk/parantez/tire serbest, basindaki 0 veya +90
   atilir, geriye 10 hane kalmalidir. */
function isValidPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('90')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return /^[1-9]\d{9}$/.test(digits);
}

function homeBlockImage(key) {
  const map = (typeof cardImages !== 'undefined' && cardImages) ? cardImages : {};
  return map[key] || ('https://picsum.photos/seed/' + key + '/600/400');
}

/* ---------------- isaretleme ---------------- */
function homeSectionHead(title, link) {
  return `<div class="section-head"><h2>${title}</h2>${link ? `<a class="see-all" href="#">${link} <span class="icon">${svg('chevRight')}</span></a>` : ''}</div>`;
}

const HOME_BLOCK_MARKUP = {
  /* Mekanlar: yatay kaydirma yok; her mekan tam genislikte bir satir. */
  venues: () => `
    <section class="section home-venues">
      ${homeSectionHead('Mekanlar', 'Tümünü Gör')}
      <div class="venue-list">
        ${VENUES.map(v => `
          <a class="venue-card" href="#">
            <span class="venue-media"><img src="${homeBlockImage(v.img)}" alt="" loading="lazy"></span>
            <span class="venue-body">
              <span class="venue-top">
                <span class="venue-type">${v.type}</span>
                <span class="venue-status${v.open ? ' is-open' : ''}">${v.open ? 'Açık' : 'Kapalı'}</span>
              </span>
              <strong class="venue-title">${v.title}</strong>
              <span class="venue-meta"><span class="icon">${svg('mapPin')}</span>${v.area}</span>
              <span class="venue-foot">
                <span class="venue-rating"><span class="icon">${svg('star')}</span>${v.rating}<span class="venue-reviews">(${v.reviews})</span></span>
                <span class="venue-hours"><span class="icon">${svg('clock')}</span>${v.hours}</span>
              </span>
            </span>
          </a>`).join('')}
      </div>
    </section>`,

  /* Kampanyalar: kart seritleri gibi yatay kaydirilir, kenar bosluklarinin
     uzerine tasar. */
  promo: () => `
    <section class="section home-promo-section">
      <div class="hscroll-wrap">
      <div class="promo-scroll">
        ${PROMO_BANDS.map(p => `
          <a class="home-promo" href="#">
            <img src="${homeBlockImage(p.img)}" alt="" loading="lazy">
            <span class="home-promo-shade"></span>
            <span class="home-promo-content">
              <span class="home-promo-badge">${p.badge}</span>
              <strong>${p.title}</strong>
              <span class="home-promo-text">${p.text}</span>
              <span class="home-promo-cta">${p.cta} <span class="icon">${svg('chevRight')}</span></span>
            </span>
          </a>`).join('')}
      </div>
        <button class="hscroll-arrow left" type="button" data-dir="left" aria-label="Geri"><span class="icon">${svg('chevLeft')}</span></button>
        <button class="hscroll-arrow right" type="button" data-dir="right" aria-label="İleri"><span class="icon">${svg('chevRight')}</span></button>
      </div>
    </section>`,

  themes: () => `
    <section class="section home-themes">
      ${homeSectionHead('Temaya Göre Keşfet', 'Tümünü Gör')}
      <div class="hscroll-wrap">
      <div class="theme-scroll">
        ${THEME_COLLECTIONS.map(c => `
          <a class="theme-card" href="#">
            <img src="${homeBlockImage(c.img)}" alt="" loading="lazy">
            <span class="theme-card-shade"></span>
            <span class="theme-card-text"><strong>${c.title}</strong><span>${c.count}</span></span>
          </a>`).join('')}
      </div>
        <button class="hscroll-arrow left" type="button" data-dir="left" aria-label="Geri"><span class="icon">${svg('chevLeft')}</span></button>
        <button class="hscroll-arrow right" type="button" data-dir="right" aria-label="İleri"><span class="icon">${svg('chevRight')}</span></button>
      </div>
    </section>`,

  collectionGrid: () => `
    <section class="section home-collections">
      ${homeSectionHead('Koleksiyonlar', 'Tümünü Gör')}
      <div class="collection-grid">
        ${GRID_COLLECTIONS.map(c => `
          <a class="collection-tile" href="#">
            <img src="${homeBlockImage(c.img)}" alt="" loading="lazy">
            <span class="collection-tile-shade"></span>
            <span class="collection-tile-text"><strong>${c.title}</strong><span>${c.text}</span></span>
          </a>`).join('')}
      </div>
    </section>`,

  /* E-bulten: lacivert vurgu karti. */
  newsletter: () => `
    <section class="section home-newsletter-section">
      <div class="home-newsletter">
        <span class="home-newsletter-badge"><span class="icon">${svg('percent')}</span>Bülten</span>
        <h2>Fırsatları herkesten önce gör</h2>
        <p class="home-newsletter-lead">Haftada bir e-posta: seçili indirimler, yeni eklenen turlar ve son dakika fırsatları.</p>
        <form class="home-newsletter-form" id="homeNewsletterForm" novalidate>
          <input type="email" id="homeNewsletterEmail" placeholder="ornek@eposta.com" autocomplete="email" aria-label="E-posta adresin">
          <button class="btn-primary" type="submit">Kaydol</button>
        </form>
        <p class="home-newsletter-note" id="homeNewsletterNote">İstediğin zaman tek tıkla çıkabilirsin.</p>
        <ul class="home-newsletter-perks">
          ${NEWSLETTER_PERKS.map(perk => `<li><span class="icon">${svg('check')}</span>${perk}</li>`).join('')}
        </ul>
      </div>
    </section>`,

  /* Iletisim: telefon, WhatsApp ve geri arama talebi. */
  support: () => `
    <section class="section home-support-section">
      <div class="home-support">
        <div class="home-support-head">
          <span class="home-support-icon">${svg('headset')}</span>
          <div class="home-support-head-text">
            <h2>Yardıma mı ihtiyacın var?</h2>
            <p>Rezervasyon, iptal ya da öneri — her konuda buradayız.</p>
          </div>
        </div>

        <div class="home-support-row">
        <a class="home-support-phone" href="${CONTACT.phoneHref}">
          <span class="home-support-phone-icon">${svg('phone')}</span>
          <span class="home-support-phone-text">
            <strong>${CONTACT.phoneLabel}</strong>
            <span>${CONTACT.hours}</span>
          </span>
          <span class="icon home-support-phone-chev">${svg('chevRight')}</span>
        </a>

        <div class="home-support-actions">
          <a class="home-support-btn is-whatsapp" href="${CONTACT.whatsappHref}" target="_blank" rel="noopener">
            <span class="icon home-support-wa-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="${WHATSAPP_ICON_PATH}"></path></svg></span>
            WhatsApp Canlı Destek
          </a>
          <button class="home-support-btn is-callback" type="button" id="homeCallbackBtn" aria-expanded="false" aria-controls="homeCallbackForm">
            <span class="icon">${svg('phone')}</span>
            Beni Ara
          </button>
        </div>
        </div>

        <form class="home-callback-form" id="homeCallbackForm" novalidate hidden>
          <label for="homeCallbackPhone">Telefon numaran</label>
          <div class="home-callback-row">
            <input type="tel" id="homeCallbackPhone" inputmode="tel" placeholder="05XX XXX XX XX" autocomplete="tel">
            <button class="btn-primary" type="submit">Gönder</button>
          </div>
          <p class="home-callback-note" id="homeCallbackNote">Çalışma saatleri içinde 15 dakika içinde arıyoruz.</p>
        </form>
      </div>
    </section>`
};

/* Bir kart seridinden sonra gelecek bloklarin isaretlemesi. */
function homeBlocksAfter(sectionTitle) {
  return (HOME_BLOCK_PLACEMENT[sectionTitle] || [])
    .map(key => (HOME_BLOCK_MARKUP[key] ? HOME_BLOCK_MARKUP[key]() : ''))
    .join('');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HOME_BLOCK_PLACEMENT,
    UPCOMING_FILTERS,
    UPCOMING_DAY_KEYS,
    THEME_COLLECTIONS,
    GRID_COLLECTIONS,
    VENUES,
    PROMO_BANDS,
    NEWSLETTER_PERKS,
    CONTACT,
    filterUpcomingItems,
    isValidEmail,
    isValidPhone
  };
}
