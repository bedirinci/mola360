/* ---------------- anasayfa ara bloklari ----------------
   Kart seritlerinin arasina giren bloklarin verisi, saf yardimcilari ve
   isaretlemesi. app.js'ten ONCE yuklenir; isaretleme uretici fonksiyonlar
   app.js'teki svg() ve cardImages'i cagrildiklari anda kullanir.

   Bloklarin sayfadaki yeri HOME_BLOCK_PLACEMENT ile belirlenir: anahtar
   kart seridinin basligi, deger o seritten SONRA gelecek bloklar.
   Bir blogu kaldirmak icin buradaki satirini silmek yeterli. */

const HOME_BLOCK_PLACEMENT = {
  'Popüler Etkinlikler': ['weekend'],
  'Yaklaşan Etkinlikler': ['promo'],
  'Günübirlik Turlar': ['themes'],
  'Aktiviteler': ['trust'],
  'Oteller': ['collectionGrid', 'newsletter']
};

/* ---- Bu hafta sonu ne var? ---- */
const WEEKEND_DAYS = [
  { key: 'bugun',     label: 'Bugün' },
  { key: 'yarin',     label: 'Yarın' },
  { key: 'cumartesi', label: 'Cumartesi' },
  { key: 'pazar',     label: 'Pazar' }
];

const WEEKEND_ITEMS = [
  { day:'bugun',     img:'concert1',  tag:'Konser',   time:'20:30', title:'Kültürpark Akşam Konseri',   place:'Kültürpark, Bursa',   price:'320' },
  { day:'bugun',     img:'coffee1',   tag:'Festival', time:'11:00', title:'Bursa Kahve Festivali',      place:'Sukaypark',           price:'180' },
  { day:'bugun',     img:'standup1',  tag:'Stand Up', time:'21:00', title:'Efsane 90\'lar Gecesi',      place:'BAOB Sahne',          price:'210' },
  { day:'yarin',     img:'theatre1',  tag:'Tiyatro',  time:'20:00', title:'7 Kocalı Hürmüz Müzikali',   place:'Açıkhava Tiyatrosu',  price:'1150' },
  { day:'yarin',     img:'market1',   tag:'Pazar',    time:'10:00', title:'Cumalıkızık Yöresel Pazar',  place:'Cumalıkızık',         price:'50' },
  { day:'yarin',     img:'run1',      tag:'Spor',     time:'19:00', title:'Bursa Gece Koşusu',          place:'İznik Gölü Kıyısı',   price:'150' },
  { day:'cumartesi', img:'sapanca2',  tag:'Günübirlik', time:'07:30', title:'Sapanca ve Masukiye Turu', place:'Bursa Çıkışlı',       price:'480' },
  { day:'cumartesi', img:'concert2',  tag:'Konser',   time:'20:00', title:'Sonbahar Caz Akşamları',     place:'Merinos AKM',         price:'400' },
  { day:'cumartesi', img:'rafting3',  tag:'Aktivite', time:'09:00', title:'Köprülü Kanyon Rafting',     place:'Yarım gün · Ekipman dahil', price:'850' },
  { day:'pazar',     img:'iznik2',    tag:'Günübirlik', time:'08:00', title:'İznik Gölü ve Antik Kent', place:'Bursa Çıkışlı',       price:'450' },
  { day:'pazar',     img:'abant2',    tag:'Doğa',     time:'08:30', title:'Abant Gölü Doğa Yürüyüşü',   place:'Kahvaltı dahil',      price:'520' },
  { day:'pazar',     img:'festival1', tag:'Festival', time:'12:00', title:'Uludağ Kar Festivali',       place:'Uludağ · Tüm gün',    price:'250' }
];

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

/* ---- Neden mola360 / güven şeridi ---- */
const TRUST_ITEMS = [
  { icon:'lock',    title:'Güvenli ödeme',  text:'Kart bilgilerin 256-bit SSL ile korunur.' },
  { icon:'refresh', title:'Ücretsiz iptal', text:'Seçili turlarda 24 saat öncesine kadar.' },
  { icon:'headset', title:'7/24 destek',    text:'Yoldayken bile bize ulaşabilirsin.' },
  { icon:'wallet',  title:'En iyi fiyat',   text:'Aynı turu ucuz bulursan farkı iade.' }
];

/* ---- Kampanya bandı ---- */
const PROMO_BAND = {
  img: 'karadeniz2',
  badge: 'Son 3 gün',
  title: 'Yayla ve doğa turlarında %40\'a varan indirim',
  text: 'Eylül sonuna kadar seçili Karadeniz turlarında geçerli.',
  cta: 'Fırsatları gör'
};

/* ---------------- saf yardimcilar ---------------- */
function filterWeekendItems(items, day) {
  const list = Array.isArray(items) ? items : [];
  if (!day) return list.slice();
  return list.filter(item => item.day === day);
}

/* Basit ve sert olmayan bir kontrol: bosluk yok, tek @, alan adinda nokta. */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

function homeBlockImage(key) {
  const map = (typeof cardImages !== 'undefined' && cardImages) ? cardImages : {};
  return map[key] || ('https://picsum.photos/seed/' + key + '/600/400');
}

/* ---------------- isaretleme ---------------- */
function homeSectionHead(title, link) {
  return `<div class="section-head"><h2>${title}</h2>${link ? `<a class="see-all" href="#">${link} <span class="icon">${svg('chevRight')}</span></a>` : ''}</div>`;
}

function weekendCardsMarkup(day) {
  const items = filterWeekendItems(WEEKEND_ITEMS, day);
  if (!items.length) return '<p class="weekend-empty">Bu gün için planlanmış bir şey yok.</p>';
  return items.map(item => `
    <article class="weekend-card">
      <div class="weekend-card-media">
        <img src="${homeBlockImage(item.img)}" alt="" loading="lazy">
        <span class="weekend-card-time"><span class="icon">${svg('clock')}</span>${item.time}</span>
      </div>
      <div class="weekend-card-body">
        <span class="weekend-card-tag">${item.tag}</span>
        <h3>${item.title}</h3>
        <p><span class="icon">${svg('mapPin')}</span>${item.place}</p>
        <span class="weekend-card-price">${item.price} TL</span>
      </div>
    </article>`).join('');
}

const HOME_BLOCK_MARKUP = {
  weekend: () => `
    <section class="section home-weekend">
      ${homeSectionHead('Bu Hafta Sonu Ne Var?', 'Tümünü Gör')}
      <div class="weekend-days" id="weekendDays" role="tablist" aria-label="Gün seçimi">
        ${WEEKEND_DAYS.map((d, i) => `<button class="weekend-day${i === 0 ? ' active' : ''}" type="button" role="tab" aria-selected="${i === 0}" data-weekend-day="${d.key}">${d.label}</button>`).join('')}
      </div>
      <div class="weekend-list" id="weekendList">${weekendCardsMarkup(WEEKEND_DAYS[0].key)}</div>
    </section>`,

  promo: () => `
    <section class="section home-promo-section">
      <a class="home-promo" href="#">
        <img src="${homeBlockImage(PROMO_BAND.img)}" alt="" loading="lazy">
        <span class="home-promo-shade"></span>
        <span class="home-promo-content">
          <span class="home-promo-badge">${PROMO_BAND.badge}</span>
          <strong>${PROMO_BAND.title}</strong>
          <span class="home-promo-text">${PROMO_BAND.text}</span>
          <span class="home-promo-cta">${PROMO_BAND.cta} <span class="icon">${svg('chevRight')}</span></span>
        </span>
      </a>
    </section>`,

  themes: () => `
    <section class="section home-themes">
      ${homeSectionHead('Temaya Göre Keşfet', 'Tümünü Gör')}
      <div class="theme-scroll">
        ${THEME_COLLECTIONS.map(c => `
          <a class="theme-card" href="#">
            <img src="${homeBlockImage(c.img)}" alt="" loading="lazy">
            <span class="theme-card-shade"></span>
            <span class="theme-card-text"><strong>${c.title}</strong><span>${c.count}</span></span>
          </a>`).join('')}
      </div>
    </section>`,

  trust: () => `
    <section class="home-trust" aria-label="Neden mola360">
      <div class="home-trust-inner">
        <h2>Neden mola360?</h2>
        <div class="home-trust-grid">
          ${TRUST_ITEMS.map(t => `
            <div class="home-trust-item">
              <span class="home-trust-icon">${svg(t.icon)}</span>
              <strong>${t.title}</strong>
              <p>${t.text}</p>
            </div>`).join('')}
        </div>
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

  newsletter: () => `
    <section class="section home-newsletter-section">
      <div class="home-newsletter">
        <span class="home-newsletter-icon">${svg('percent')}</span>
        <h2>Fırsatları ilk sen öğren</h2>
        <p>Haftada bir e-posta: sadece seçili indirimler ve yeni eklenen turlar.</p>
        <form class="home-newsletter-form" id="homeNewsletterForm" novalidate>
          <input type="email" id="homeNewsletterEmail" placeholder="ornek@eposta.com" autocomplete="email" aria-label="E-posta adresin">
          <button class="btn-primary" type="submit">Kaydol</button>
        </form>
        <p class="home-newsletter-note" id="homeNewsletterNote">İstediğin zaman tek tıkla çıkabilirsin.</p>
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
    WEEKEND_DAYS,
    WEEKEND_ITEMS,
    THEME_COLLECTIONS,
    GRID_COLLECTIONS,
    TRUST_ITEMS,
    filterWeekendItems,
    isValidEmail
  };
}
