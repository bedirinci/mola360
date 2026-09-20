
/* ---------------- desktop/tablet sabit sidebar ----------------
   Mobil drawer tek kaynak olarak kalır. Masaüstü sidebar onun içeriğini
   klonlar; böylece menü başlıkları, ikonlar, kartlar ve sıralama iki yerde
   kendiliğinden aynı kalır. */
(function initDesktopSidebar(){
  const drawer = document.getElementById('mobileDrawer');
  const sourceScroll = drawer && drawer.querySelector('.drawer-sidebar-scroll');
  if (!drawer || !sourceScroll) return;

  const sidebar = document.createElement('aside');
  sidebar.className = 'desktop-sidebar';
  sidebar.id = 'desktopSidebar';
  sidebar.setAttribute('aria-label','Ana navigasyon');

  const scroll = document.createElement('div');
  scroll.className = 'desktop-sidebar-scroll';
  scroll.innerHTML = sourceScroll.innerHTML;

  // Mobil drawer'a ait ID'leri kopyada bırakma; tekil masaüstü kimlikleri kullan.
  scroll.querySelectorAll('[id]').forEach(el => {
    const id = el.id;
    if (id === 'drawerUserAvatar') el.id = 'sidebarUserAvatar';
    else if (id === 'drawerUserName') el.id = 'sidebarUserName';
    else el.removeAttribute('id');
  });

  // Masaüstünde kompakt sidebar kullanıcı kartı yerine, mobildeki gibi header'a
  // ve kenarlara yapışık profil özeti (istatistikler + puan durumu) kullanılır.
  const compactUserCard = scroll.querySelector('.sidebar-user');
  if (compactUserCard) compactUserCard.remove();
  const mobileProfile = scroll.querySelector('.mobile-profile-card');
  if (mobileProfile) mobileProfile.id = 'desktopProfileCard';

  // Promo slider masaüstünde dikey kart listesine dönüşür.
  const promoTrack = scroll.querySelector('.drawer-promo-track');
  if (promoTrack) {
    promoTrack.removeAttribute('id');

    // Kartların sağına/soluna küçük yuvarlak kaydırma butonları ekle.
    // Sağ buton kaydırılabilir içerik olduğu sürece görünür; sol buton
    // yalnızca kullanıcı sağa kaydırıp geri dönüş mümkün olduğunda belirir.
    const promoSlider = promoTrack.closest('.drawer-promo-slider');
    if (promoSlider) {
      const leftBtn = document.createElement('button');
      leftBtn.type = 'button';
      leftBtn.className = 'drawer-promo-arrow left is-hidden';
      leftBtn.setAttribute('aria-label', 'Geri');
      leftBtn.innerHTML = '<span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"></polyline></svg></span>';

      const rightBtn = document.createElement('button');
      rightBtn.type = 'button';
      rightBtn.className = 'drawer-promo-arrow right is-hidden';
      rightBtn.setAttribute('aria-label', 'İleri');
      rightBtn.innerHTML = '<span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg></span>';

      promoSlider.appendChild(leftBtn);
      promoSlider.appendChild(rightBtn);

      // Kampanya oklarında kart bazlı gezinme kullanılır. Her tıklama yalnızca
      // komşu karta gider; hızlı art arda tıklamalar birden fazla kart atlamaz.
      const promoCards = () => Array.from(promoTrack.querySelectorAll('.drawer-promo-card'));
      const promoPositions = () => {
        const cards = promoCards();
        if (!cards.length) return [];
        const firstLeft = cards[0].offsetLeft;
        const maxScroll = Math.max(0, promoTrack.scrollWidth - promoTrack.clientWidth);
        return cards.map(card => Math.max(0, Math.min(card.offsetLeft - firstLeft, maxScroll)));
      };

      let promoIndex = 0;
      let promoAnimating = false;
      let promoUnlockTimer = null;

      const getNearestPromoIndex = () => {
        const positions = promoPositions();
        if (!positions.length) return 0;
        const current = promoTrack.scrollLeft;
        let nearest = 0;
        let distance = Infinity;
        positions.forEach((position, i) => {
          const d = Math.abs(position - current);
          if (d < distance) {
            distance = d;
            nearest = i;
          }
        });
        return nearest;
      };

      const updatePromoArrows = () => {
        const positions = promoPositions();
        const canScroll = positions.length > 1 && promoTrack.scrollWidth > promoTrack.clientWidth + 2;
        if (!canScroll) {
          promoIndex = 0;
          leftBtn.classList.add('is-hidden');
          rightBtn.classList.add('is-hidden');
          return;
        }

        promoIndex = getNearestPromoIndex();
        leftBtn.classList.toggle('is-hidden', promoIndex <= 0);
        rightBtn.classList.toggle('is-hidden', promoIndex >= positions.length - 1);
        leftBtn.disabled = promoAnimating;
        rightBtn.disabled = promoAnimating;
        promoSlider.classList.toggle('is-promo-animating', promoAnimating);
      };

      const finishPromoAnimation = () => {
        promoAnimating = false;
        if (promoUnlockTimer) {
          clearTimeout(promoUnlockTimer);
          promoUnlockTimer = null;
        }
        promoIndex = getNearestPromoIndex();
        updatePromoArrows();
      };

      const scrollPromoByCard = (direction) => {
        if (promoAnimating) return;
        const positions = promoPositions();
        if (positions.length < 2) return;

        const currentIndex = getNearestPromoIndex();
        const nextIndex = Math.max(0, Math.min(currentIndex + direction, positions.length - 1));
        if (nextIndex === currentIndex) return;

        promoIndex = nextIndex;
        promoAnimating = true;
        updatePromoArrows();
        promoTrack.scrollTo({ left: positions[nextIndex], behavior: 'smooth' });

        // scrollend bazı tarayıcılarda güvenilir şekilde gelmeyebilir.
        // Güvenlik kilidi, animasyon tamamlandıktan sonra mutlaka çözülür.
        promoUnlockTimer = setTimeout(finishPromoAnimation, 500);
      };

      leftBtn.addEventListener('click', () => scrollPromoByCard(-1));
      rightBtn.addEventListener('click', () => scrollPromoByCard(1));
      promoTrack.addEventListener('scrollend', finishPromoAnimation);

      promoTrack.addEventListener('scroll', updatePromoArrows, { passive: true });
      window.addEventListener('resize', updatePromoArrows);
      requestAnimationFrame(updatePromoArrows);
    }
  }

  sidebar.appendChild(scroll);

  const sourceFooter = drawer.querySelector('.drawer-footer');
  if (sourceFooter) {
    const footer = document.createElement('div');
    footer.className = 'desktop-sidebar-footer';
    footer.innerHTML = sourceFooter.innerHTML;
    const auth = footer.querySelector('#drawerAuthBtn');
    if (auth) { auth.removeAttribute('id'); auth.id = 'sidebarAuthBtn'; }
    footer.querySelectorAll('[id]').forEach(el => { if (el.id !== 'sidebarAuthBtn') el.removeAttribute('id'); });
    sidebar.appendChild(footer);
  }

  // main'in dışına ekle: header tam genişlikte kalır, içerik sidebar kadar içeri kayar.
  const frame = document.getElementById('deviceFrame');
  if (frame && frame.parentNode) frame.parentNode.insertBefore(sidebar, frame);
})();

/* ---------------- sayfa scroll kilidi (giriş yap popup / yan menü) ----------------
   NOT: <html> elementinde overflow-y:scroll sabit tanımlı olduğu için body'ye
   overflow:hidden vermek tek başına sayfa kaydırmasını durdurmuyor (viewport
   scroll'unu html yönetiyor). Bu yüzden wheel/touch/klavye olaylarını
   doğrudan engelliyoruz; scrollbar ise html'in overflow-y:scroll +
   scrollbar-gutter:stable ayarı sayesinde kaybolmadan sabit kalıyor.
   Drawer içeriği (.drawer-content) ve giriş modalı içeriği (.auth-modal-body)
   kendi içlerinde kaydırılabilir kalmaya devam eder. */
/* ---------------- oturum açan kullanıcı (profil avatarı) ----------------
   Profil görseli yüklenmediğinde (avatarUrl boşsa) avatarda ismin baş
   harfi gösterilir; görsel yüklendiğinde onun yerine o görsel basılır. */
const Mola360App = window.Mola360App = {
  version: 'p2-refactor-1.0',
  state: {
    ui: { activeRoute: 'explore', searchOpen: false, drawerOpen: false },
    filters: null,
    favorites: new Set()
  },
  routes: Object.freeze({
    explore: '/',
    favorites: '/favorilerim',
    tickets: '/biletlerim',
    account: '/hesabim'
  })
};

/* ---------------- sayfaya gore koruma ----------------
   Bu dosya artik yalnizca anasayfada degil, tur icerik sayfalarinda da
   yukleniyor (header/arama/bildirim/profil tek kaynaktan gelsin diye).
   Tur sayfasinda anasayfaya ozgu bolumler -- top10 seridi, kategori
   seridi, kart bolumleri, mobil menu, filtre cubugu, tarih takvimi --
   DOM'da yok. Asagidaki iki yardimci eksik elemanda sessizce geri
   doner; boylece header ve acilir katmanlar her sayfada calisir.
   Anasayfada eleman her zaman bulundugu icin davranis degismez. */
function byId(id) { return document.getElementById(id); }
function onId(id, olay, fn, opts) {
  const el = byId(id);
  if (el) el.addEventListener(olay, fn, opts);
  return el;
}

const currentUser = {
  name: 'Bedir İnci',
  avatarUrl: null
};

function setCssVars(el, vars){
  if(!el) return;
  Object.entries(vars).forEach(([name, value]) => {
    if(value === null || value === undefined || value === '') el.style.removeProperty(name);
    else el.style.setProperty(name, String(value));
  });
}
/* normalizeSearchText, getSearchCategoryIcon, getSearchCardType, getInitials
   artık assets/js/search-utils.js içinde (bu dosyadan önce yüklenir). */
function renderProfileAvatar(el){
  if(!el) return;
  if(currentUser.avatarUrl){
    el.innerHTML = '<img src="' + currentUser.avatarUrl + '" alt="' + currentUser.name + '">';
  } else {
    el.textContent = getInitials(currentUser.name);
  }
}

/* ---------------- sayfa kaydırma kilidi (yeniden yazıldı) ----------------
   ÖNCEKİ SORUN: kilit, wheel/touchmove/keydown olaylarında preventDefault
   çağırarak ve bir sayaç tutarak uygulanıyordu. Sayaç bir kez bile
   senkronunu kaybettiğinde (ör. giriş popup'ı iki kez açılınca, ya da
   açılışta kilitlenip kapanışta iki kez serbest bırakılınca) sayfa KALICI
   olarak kaydırılamaz hâle geliyor; yalnızca "izin verilen" alanlar
   (sol sabit menü) kaymaya devam ediyordu.

   YENİ YAKLAŞIM: kilit durumu sayaçtan değil, doğrudan DOM'un gerçek
   durumundan türetilir (tek doğruluk kaynağı). Bu yüzden kendini onarır:
   hiçbir popup açık değilse kilit otomatik olarak kalkar. */
let __lockedScrollY = 0;

function isMobileViewport() {
  return window.matchMedia('(max-width: 680px)').matches;
}

/* Kilit gerekli mi? Yalnızca DOM'a bakarak karar verilir. */
function __shouldLockScroll() {
  const q = (sel) => document.querySelector(sel);
  const isOpen = (sel) => { const el = q(sel); return !!(el && el.classList.contains('open')); };

  /* Giriş/kayıt popup'ı her ekran boyutunda sayfayı kilitler. */
  if (isOpen('#authModalOverlay')) return true;

  /* Diğer tüm popup/paneller yalnızca mobilde kilitler; masaüstünde
     tetikleyicilerine sabitlendikleri için sayfa serbest kalmalıdır. */
  if (!isMobileViewport()) return false;

  return isOpen('#mobileDrawer')
      || isOpen('#searchOverlay')
      || isOpen('#notifPanel')
      || isOpen('#profilePanel')
      || !!q('.filter-dropdown-wrap.open');
}

/* Kilit sırasında görsel konumu korunacak yapışkan elemanlar.
   (CSS tarafındaki "body.m360-scroll-locked ..." kuralıyla eşleşir.) */
const M360_STICKY_FREEZE_TARGETS = [
  ['.mobile-search-bar', '--m360-sticky-freeze'],
  ['.filter-bar',        '--m360-filterbar-freeze']
];

function refreshScrollLock() {
  const want = __shouldLockScroll();
  const locked = document.body.classList.contains('m360-scroll-locked');
  if (want === locked) return;

  if (want) {
    __lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;

    /* 1) Kilitten HEMEN ÖNCE yapışkan elemanların ekrandaki gerçek konumu. */
    const frozen = M360_STICKY_FREEZE_TARGETS.map(([selector, cssVar]) => {
      const el = document.querySelector(selector);
      return { el, cssVar, topBefore: el ? el.getBoundingClientRect().top : 0 };
    });

    /* 2) Kilidi uygula (bu anda sticky bozulur, elemanlar akıştaki yerine döner). */
    document.body.style.setProperty('--m360-lock-top', `-${__lockedScrollY}px`);
    frozen.forEach(f => document.body.style.setProperty(f.cssVar, '0px'));
    document.body.classList.add('m360-scroll-locked');

    /* 3) Aradaki farkı telafi et: her eleman bir önceki kareyle birebir aynı
          piksel konumunda kalır, ekranda hiçbir sıçrama olmaz.
          (relative offset komşuların düzenini etkilemediği için sırayla
          ölçmek güvenli.) */
    frozen.forEach(f => {
      if (!f.el) return;
      const shift = f.topBefore - f.el.getBoundingClientRect().top;
      if (Math.abs(shift) > 0.5) {
        document.body.style.setProperty(f.cssVar, `${shift}px`);
      }
    });
  } else {
    document.body.classList.remove('m360-scroll-locked');
    document.body.style.removeProperty('--m360-lock-top');
    M360_STICKY_FREEZE_TARGETS.forEach(([, cssVar]) => {
      document.body.style.removeProperty(cssVar);
    });
    window.scrollTo(0, __lockedScrollY);
  }
}


/* Güvenlik ağı: ekran döndürme / boyut değişimi / sekmeye dönüş gibi
   durumlarda kilit gerçek duruma göre yeniden senkronlanır. Böylece
   kilit hiçbir senaryoda takılı kalamaz. */
window.addEventListener('resize', refreshScrollLock);
window.addEventListener('orientationchange', refreshScrollLock);
window.addEventListener('pageshow', refreshScrollLock);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshScrollLock();
});

/* ---------------- icon library ---------------- */
const ICONS = {
  search:'<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  menu:'<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
  close:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  chevDown:'<polyline points="6 9 12 15 18 9"/>',
  chevRight:'<polyline points="9 6 15 12 9 18"/>',
  chevLeft:'<polyline points="15 6 9 12 15 18"/>',
  sort:'<line x1="5" y1="7" x2="19" y2="7"/><line x1="8" y1="12" x2="19" y2="12"/><line x1="11" y1="17" x2="19" y2="17"/>',
  wallet:'<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 8h13.5A2.5 2.5 0 0 1 20 10.5v3H16a2 2 0 0 1 0-4h4"/><circle cx="16" cy="11.5" r=".7" fill="currentColor" stroke="none"/>',
  filter:'<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><circle cx="4" cy="12" r="1.8"/><circle cx="12" cy="10" r="1.8"/><circle cx="20" cy="14" r="1.8"/>',
  flame:'<path d="M12 2c1.2 3.8-2.6 5-2.6 8.6a2.6 2.6 0 0 0 5.2 0c0-.9-.6-1.7-.6-2.5 1.8 1 2.8 2.8 2.8 4.7A5.2 5.2 0 0 1 6.6 12.8C6.6 8 10.6 6.8 12 2z"/>',
  star:'<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"/>',
  mapPin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><line x1="8" y1="3" x2="8" y2="7.5"/><line x1="16" y1="3" x2="16" y2="7.5"/><line x1="3" y1="10" x2="21" y2="10"/>',
  home:'<path d="M3.5 11 12 3.5 20.5 11"/><path d="M5.5 9.8V20h13V9.8"/>',
  compass:'<circle cx="12" cy="12" r="9"/><polygon points="15 9 13 13 9 15 11 11"/>',
  ticket:'<path d="M3 8.5A2 2 0 0 1 5 6.5h14a2 2 0 0 1 2 2v2a2.2 2.2 0 0 0 0 4.4v2A2 2 0 0 1 19 19H5a2 2 0 0 1-2-2v-2a2.2 2.2 0 0 0 0-4.4z"/><line x1="9.5" y1="6.5" x2="9.5" y2="19" stroke-dasharray="2.2 2.2"/>',
  percent:'<line x1="19" y1="5" x2="5" y2="19"/><circle cx="7" cy="7" r="2.4"/><circle cx="17" cy="17" r="2.4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4.1 3.6-6.5 7.5-6.5s7.5 2.4 7.5 6.5"/>',
  lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  headset:'<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4.5" height="6" rx="1.5"/><rect x="16.5" y="13" width="4.5" height="6" rx="1.5"/>',
  check:'<polyline points="4.5 12.5 9.5 17.5 19.5 6.5"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.9z"/>',
  refresh:'<path d="M4 12a8 8 0 0 1 14-5.3L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3L4 16"/><path d="M4 20v-4h4"/>',
  apple:'<path d="M16.5 7.2c-1.1-.1-2 .6-2.6.6-.6 0-1.4-.6-2.4-.6-1.2 0-2.4.7-3 1.9-1.3 2.3-.3 5.7 1 7.6.6 1 1.4 2 2.4 2 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-1 2.3-2c.7-1 1-2 1-2.1-.1 0-2-.8-2-3 0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.4-2.7-1.5z"/><path d="M14 4.5c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1.1-.4.5-.8 1.3-.7 2.1.8.1 1.6-.4 2.1-1z"/>',
  play:'<polygon points="5 3 19 12 5 21"/>',
  ig:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/>',
  yt:'<rect x="3" y="6" width="18" height="12" rx="3"/><polygon points="10.5 9.5 15.5 12 10.5 14.5"/>',
  x:'<line x1="5" y1="5" x2="19" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/>',
  basket:'<path d="M4.5 8h15l-1.4 10.8a2 2 0 0 1-2 1.7H7.9a2 2 0 0 1-2-1.7L4.5 8z"/><path d="M8.5 8V6.2a3.5 3.5 0 0 1 7 0V8"/>',
  heart:'<path d="M12 20.5s-7.5-4.6-10-9.3C0.4 8 2 4.5 5.6 4c2.1-0.3 4 0.7 6.4 3 2.4-2.3 4.3-3.3 6.4-3C21.9 4.5 23.6 8 22 11.2c-2.5 4.7-10 9.3-10 9.3z"/>',
  moon:'<path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2z"/>',
  /* activity: "Aktiviteler" kavramina ait. Turlar compass kullandigi icin
     ikisi ayrildi; ayni ikon iki farkli kavrami temsil etmez. */
  activity:'<path d="M3 12h3.5l2.2-6 3.6 12 2.4-7.5 1.6 1.5H21"/>',
  /* sparkle: "Yeni Eklenenler". Daha once star kullaniyordu, ama star
     puanlama rozetlerinin ikonu; ayni ikon iki anlam tasiyamaz. */
  sparkle:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  sun:'<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/><line x1="5.3" y1="5.3" x2="7" y2="7"/><line x1="17" y1="17" x2="18.7" y2="18.7"/><line x1="5.3" y1="18.7" x2="7" y2="17"/><line x1="17" y1="7" x2="18.7" y2="5.3"/>',
};
function svg(name){ return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||''}</svg>`; }

document.querySelectorAll('[id^="ic-"], [id^="tab-ic-"], [id^="drawer-ic-"]').forEach(el=>{
  const map = {
    'ic-search-1':'search','ic-search-2':'search','ic-search-3':'search','ic-menu':'menu', 'ic-close':'close',
    'ic-chev-1':'chevDown','ic-chev-2':'chevDown','ic-chev-3':'chevDown','ic-chev-4':'chevDown','ic-chev-5':'chevDown','ic-chev-6':'chevDown',
    'ic-sort':'sort','ic-wallet':'wallet','ic-clock':'clock','ic-tema':'compass','ic-flame':'flame','ic-ig':'ig','ic-yt':'yt','ic-x':'x','ic-calendar':'calendar','ic-region':'mapPin',
    'ic-apple':'apple','ic-play':'play','ic-lock':'lock','ic-headset':'headset','ic-refresh':'refresh',
    'tab-ic-1':'compass','tab-ic-2':'percent','tab-ic-3':'ticket','tab-ic-4':'user',
    'drawer-ic-user':'user', 'drawer-ic-compass':'compass', 'drawer-ic-home':'home', 'drawer-ic-ticket':'ticket',
    'drawer-ic-pin1':'mapPin', 'drawer-ic-pin2':'mapPin', 'drawer-ic-pin3':'mapPin', 'drawer-ic-star':'star',
    'drawer-ic-headset':'headset', 'drawer-ic-refresh':'refresh'
  };
  if(map[el.id]) el.innerHTML = svg(map[el.id]);
});

/* ---------------- content data ---------------- */
const cardImages = {
  "kapadokya": "https://commons.wikimedia.org/wiki/Special:FilePath/Hot_air_balloons_in_Cappadocia.jpg?width=800",
  "pamukkale": "https://commons.wikimedia.org/wiki/Special:FilePath/Pamukkale_Travertines.jpg?width=800",
  "bodrum": "https://commons.wikimedia.org/wiki/Special:FilePath/Bodrum_Hafen.jpg?width=800",
  "efes": "https://commons.wikimedia.org/wiki/Special:FilePath/Ephesus_Celsus_Library_Fa%C3%A7ade.jpg?width=800",
  "uludag": "https://commons.wikimedia.org/wiki/Special:FilePath/View_of_Bursa_from_the_hills_of_Mount_Uludag.jpg?width=800",
  "bogaz": "https://commons.wikimedia.org/wiki/Special:FilePath/Bosphorus_Bridge%2C_Istanbul_-_Turkey.jpg?width=800",
  "ayder": "https://commons.wikimedia.org/wiki/Special:FilePath/Ayder_Yaylasi_%40_Rize-Turkey.JPG?width=800",
  "assos": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&h=600&q=85",
  "sile": "https://commons.wikimedia.org/wiki/Special:FilePath/%C5%9Eile_sahil_panorama.jpg?width=800",
  "iznik": "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=500&h=600&q=85",
  "concert1": "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=500&h=350&q=85",
  "festival1": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&h=350&q=85",
  "standup1": "https://commons.wikimedia.org/wiki/Special:FilePath/Stand-up_comedy_-_Stage.jpg?width=800",
  "coffee1": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&h=350&q=85",
  "concert2": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&h=350&q=85",
  "theatre1": "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=500&h=350&q=85",
  "market1": "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=500&h=350&q=85",
  "run1": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=500&h=350&q=85",
  "kapadokya2": "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=500&h=350&q=85",
  "karadeniz2": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&h=350&q=85",
  "ege2": "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=500&h=350&q=85",
  "dogu2": "https://images.unsplash.com/photo-1474487548417-37f4473bba4e?auto=format&fit=crop&w=500&h=350&q=85",
  "iznik2": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=500&h=350&q=85",
  "sapanca2": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&h=350&q=85",
  "abant2": "https://commons.wikimedia.org/wiki/Special:FilePath/Abant_Bolu_Province.jpg?width=800",
  "cunda2": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=500&h=350&q=85",
  "rafting3": "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=500&h=350&q=85",
  "paraglide3": "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=500&h=350&q=85",
  "balloon3": "https://commons.wikimedia.org/wiki/Special:FilePath/Hot_air_balloon_ride_at_sunrise_in_Cappadocia_2.JPG?width=800",
  "kayak3": "https://images.unsplash.com/photo-1605540436563-5bca919ae766?auto=format&fit=crop&w=500&h=350&q=85",
  "hotel4": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&h=350&q=85",
  "hotel5": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&h=350&q=85",
  "hotel6": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&h=350&q=85",
  "hotel7": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=500&h=350&q=85",

  /* ---- Wikimedia Commons gorselleri ----
     Special:FilePath adresi dosya adindan deterministik olarak kurulur;
     dosya adi konuyu anlattigi icin hangi fotografin geldigi adindan
     bellidir. Yazar ve lisans bilgisi icin docs/gorsel-kaynaklari.md. */
  "kemeralti": "https://commons.wikimedia.org/wiki/Special:FilePath/Kemeralt%C4%B1_market_02.jpg?width=800",
  "izmirKonak": "https://commons.wikimedia.org/wiki/Special:FilePath/Izmir_Konak_Square.jpg?width=800",
  "izmirKordon": "https://commons.wikimedia.org/wiki/Special:FilePath/A_panoramic_view_of_the_Alsancak_quarter_in_Izmir.jpg?width=800",
  "izmirMuze": "https://commons.wikimedia.org/wiki/Special:FilePath/%C4%B0zmir_Archaeological_Museum_2462_1.jpg?width=800",
  "alacati": "https://commons.wikimedia.org/wiki/Special:FilePath/Ala%C3%A7at%C4%B1_de%C4%9Firmenler_01.jpg?width=800",
  "aspendos": "https://commons.wikimedia.org/wiki/Special:FilePath/Aspendos_Turkey.JPG?width=800",
  "erciyes": "https://commons.wikimedia.org/wiki/Special:FilePath/Erciyes_Da%C4%9F%C4%B1_Kayseri.JPG?width=800"
};

const top10 = [
  {img:'kapadokya',t:'Kapadokya Balon Turu',p:'2.450₺'},{img:'pamukkale',t:'Pamukkale Termal Tatili',p:'1.890₺'},
  {img:'bodrum',t:'Bodrum Tekne Turu',p:'980₺'},{img:'efes',t:'Efes Antik Kent Turu',p:'750₺'},
  {img:'uludag',t:'Uludağ Kayak Paketi',p:'3.200₺'},{img:'bogaz',t:'İstanbul Boğaz Turu',p:'650₺'},
  {img:'ayder',t:'Karadeniz Yayla Turu',p:'2.100₺'},{img:'assos',t:'Assos Gün Batımı Turu',p:'1.150₺'},
  {img:'sile',t:'Şile Kamp Deneyimi',p:'890₺'},{img:'iznik',t:'İznik Kültür Turu',p:'520₺'},
];
const CAT_ICONS = {
  "firsatlar": "assets/img/kategori/firsatlar.webp",
  "turlar": "assets/img/kategori/turlar.webp",
  "etkinlikler": "assets/img/kategori/etkinlikler.webp",
  "oteller": "assets/img/kategori/oteller.webp",
  "aktiviteler": "assets/img/kategori/aktiviteler.webp",
  "mekanlar": "assets/img/kategori/mekanlar.webp",
  "kuponlarim": "assets/img/kategori/kuponlarim.webp",
  "yenieklenenler": "assets/img/kategori/yenieklenenler.webp",
  "buhafta": "assets/img/kategori/buhafta.webp",
}


const categories = [
  {name:'Fırsatlar', icon:'percent', img:'firsatlar'},
  {name:'Turlar', icon:'compass', img:'turlar'},
  {name:'Etkinlikler', icon:'ticket', img:'etkinlikler'},
  {name:'Oteller', icon:'home', img:'oteller'},
  {name:'Aktiviteler', icon:'activity', img:'aktiviteler'},
  {name:'Mekanlar', icon:'mapPin', img:'mekanlar'},
  {name:'Kuponlarım', icon:'wallet', img:'kuponlarim'},
  {name:'Yeni Eklenenler', icon:'sparkle', img:'yenieklenenler'},
  {name:'Bu Hafta', icon:'calendar', img:'buhafta'},
];

// Arama ekranında gösterilecek kategori listesi yalnızca bu dört kategoriden oluşur.
const searchCategories = [
  {name:'Turlar', icon:'compass'},
  {name:'Etkinlikler', icon:'ticket'},
  {name:'Oteller', icon:'home'},
  {name:'Aktiviteler', icon:'activity'},
  {name:'Mekanlar', icon:'mapPin'},
];

// Arama ekranında örnek olarak gösterilen son aramalar.
const recentSearchTerms = [
  'İstanbul konserleri',
  'Kapadokya otelleri',
  'İzmir mekanları'
];

// Arama ekranında gösterilen önerilen aramalar (trend/öneri niteliğinde, sabit liste).
const suggestedSearchTerms = [
  'Kapadokya balon turu',
  'Hafta sonu kaçamağı',
  'Termal otel',
  'Boğaz turu',
  'Kamp alanları'
];
const cardSections = [
  /* Etkinlikler Turkiye geneli: farkli sehirlerden programlar. */
  {title:'Popüler Etkinlikler', anchor:'etkinlikler', titleIcon:'flame', meta1Icon:'clock', meta2Label:'En yakın:', items:[
    {img:'concert1', badges:['Konser'], rating:'4.8', reviews:'640+', title:'Harbiye Açıkhava Konserleri', meta1:'Cemil Topuzlu Sahnesi, İstanbul · 21:00', meta2:'12 Eylül, Cuma', priceMain:'890'},
    {img:'festival1', badges:['Festival'], rating:'4.6', reviews:'310+', title:'Çeşme Yaz Festivali', meta1:'Alaçatı Sahil, İzmir · Tüm gün', meta2:'19 Eylül, Cuma', priceMain:'650'},
    {img:'standup1', badges:['Stand Up'], sponsored:true, title:'Stand Up Gecesi', meta1:'Jolly Joker, Ankara · 21:30', meta2:'21 Eylül, Pazartesi', priceMain:'420'},
    {img:'aspendos', badges:['Sahne'], rating:'4.9', reviews:'180+', title:'Aspendos Opera ve Bale Festivali', meta1:'Aspendos Antik Tiyatro, Antalya · 20:30', meta2:'26 Eylül, Cumartesi', priceMain:'750'},
  ]},
  /* filterKey: bu seride baslik altinda zaman filtresi cikar (UPCOMING_FILTERS).
     inDays = etkinlige kac gun kaldigi, dayKey = hafta sonu filtreleri icin gun. */
  /* Serit hem etkinlikleri hem turlari tasidigi icin baslik "Planlar".
     Icerik Turkiye geneli: her gun filtresinde farkli sehirler bulunur. */
  {title:'Yaklaşan Planlar', anchor:'yaklasan-planlar', titleIcon:'calendar', meta1Icon:'clock', meta2Label:'Tarih:', filterKey:'upcoming', cardStyle:'compact', items:[
    /* dayKey: gun filtreleri (Bu Cuma / Bu Cumartesi / Bu Pazar) bununla suzer.
       inDays: siralama icin kalan gun. meta2: kartta gorunen tarih metni. */
    {img:'run1', badges:['Spor'], rating:'4.6', reviews:'240+', title:'İstanbul Gece Yarısı Koşusu', meta1:'Kadıköy Sahil, İstanbul · 21:00', meta2:'Bu Cuma', priceMain:'350', inDays:0, dayKey:'cuma'},
    {img:'standup1', badges:['Stand Up'], sponsored:true, title:'Stand Up Gecesi', meta1:'Jolly Joker, Ankara · 21:30', meta2:'Bu Cuma', priceMain:'420', inDays:0, dayKey:'cuma'},
    {img:'concert1', badges:['Konser'], rating:'4.8', reviews:'640+', title:'Harbiye Açıkhava Konserleri', meta1:'Harbiye, İstanbul · 21:00', meta2:'Bu Cuma', priceMain:'890', inDays:0, dayKey:'cuma'},
    {img:'aspendos', badges:['Sahne'], rating:'4.9', reviews:'180+', title:'Aspendos Opera ve Bale Festivali', meta1:'Aspendos, Antalya · 20:30', meta2:'Bu Cumartesi', priceMain:'750', inDays:1, dayKey:'cumartesi'},
    {img:'concert2', badges:['Konser'], rating:'4.7', reviews:'120+', title:'Kordon Caz Akşamları', meta1:'Alsancak, İzmir · 20:00', meta2:'Bu Cumartesi', priceMain:'480', inDays:1, dayKey:'cumartesi'},
    {img:'sapanca2', badges:['Günübirlik'], rating:'4.6', reviews:'75+', title:'Sapanca ve Maşukiye Turu', meta1:'İstanbul Çıkışlı · 07:30', meta2:'Bu Cumartesi', priceMain:'780', inDays:1, dayKey:'cumartesi'},
    {img:'market1', badges:['Günübirlik'], rating:'4.4', reviews:'96+', title:'Alaçatı Pazar Turu', meta1:'İzmir Çıkışlı · 09:00', meta2:'Bu Pazar', priceMain:'350', inDays:2, dayKey:'pazar'},
    {img:'coffee1', badges:['Festival'], rating:'4.5', reviews:'210+', title:'İstanbul Kahve Festivali', meta1:'Küçükçiftlik Park · 11:00', meta2:'Bu Pazar', priceMain:'290', inDays:2, dayKey:'pazar'},
    {img:'iznik2', badges:['Günübirlik'], rating:'4.5', reviews:'70+', title:'İznik Gölü ve Antik Kent', meta1:'Bursa Çıkışlı · 08:00', meta2:'Bu Pazar', priceMain:'450', inDays:2, dayKey:'pazar'},
    {img:'abant2', badges:['Doğa Turu'], rating:'4.4', reviews:'155+', title:'Abant Gölü Doğa Yürüyüşü', meta1:'Ankara Çıkışlı · 08:30', meta2:'3 gün kaldı', priceMain:'620', inDays:3},
    {img:'kapadokya2', badges:['Konaklamalı'], rating:'4.8', reviews:'910+', title:'Kapadokya 3 Gece Turu', meta1:'3 Gece 4 Gün · Uçaklı', meta2:'9 gün kaldı', priceMain:'8990', inDays:9},
    {img:'erciyes', badges:['Kış Sporu'], rating:'4.6', reviews:'140+', title:'Erciyes Kayak Haftası', meta1:'Kayseri · 4 Gece 5 Gün', meta2:'12 gün kaldı', priceMain:'6400', inDays:12},
  ]},
  /* Turlar Turkiye geneli: kalkis noktalari farkli sehirlerden.
     titleIcon konaklamayi (moon), meta1Icon kalkis noktasini (mapPin)
     anlatir; ayni ikon iki anlam tasimaz. */
  {title:'Konaklamalı Turlar', anchor:'konaklamali-turlar', titleIcon:'moon', meta1Icon:'mapPin', meta2Label:'En yakın:', items:[
    {img:'kapadokya2', href:'tur/kapadokya-3-gece/', badges:['Kültür','Yurt İçi'], rating:'4.7', reviews:'970+', title:'Kapadokya Turu — 3 Gece 4 Gün', meta1:'3 Gece 4 Gün · İstanbul, İzmir ve Ankara Çıkışlı', meta2:'20 Ekim, Salı', priceMain:'8990'},
    {img:'karadeniz2', badges:['Doğa'], sponsored:true, title:'Karadeniz Yaylaları Turu', meta1:'4 Gece 5 Gün · Uçaklı, İstanbul Çıkışlı', meta2:'2 Kasım, Pazar', priceMain:'12500'},
    {img:'ege2', badges:['Balayı'], rating:'4.9', reviews:'288+', title:'Ege Adaları Balayı Kaçamağı', meta1:'2 Gece 3 Gün · Feribotlu, İzmir Çıkışlı', meta2:'15 Eylül, Salı', priceMain:'6990'},
    {img:'dogu2', badges:['Doğu Ekspresi'], rating:'4.6', reviews:'450+', title:'Turistik Doğu Ekspresi Turu', meta1:'5 Gece 6 Gün · Trenli, Ankara Çıkışlı', meta2:'8 Aralık, Salı', priceMain:'9750'},
  ]},
  {title:'Günübirlik Turlar', anchor:'turlar', titleIcon:'sun', meta1Icon:'mapPin', meta2Label:'En yakın:', items:[
    /* href tasiyan kart, icerik sayfasi yazilmis tur demek. Adres
       /tur/<slug>/ bicimindedir ve slug tour-data.js'teki TOURS anahtariyla
       ayni olmak zorundadir; fiyat da o kaydin fiyatiyla ayni olmalidir.
       tests/tour.test.js ikisini de karsilastirir. */
    {img:'efes', href:'tur/efes-sirince/', badges:['Günübirlik'], rating:'4.8', reviews:'1,2b+', title:'Efes Antik Kenti ve Şirince Turu', meta1:'İzmir Çıkışlı · Rehberli · Yemek Dahil', meta2:'Bu Cumartesi', priceMain:'1290'},
    {img:'sile', badges:['Günübirlik'], rating:'4.5', reviews:'190+', title:'Şile ve Ağva Turu', meta1:'İstanbul Çıkışlı · Öğle Yemeği Dahil', meta2:'Bu Cumartesi', priceMain:'690'},
    {img:'cunda2', badges:['Günübirlik'], sponsored:true, title:'Cunda Adası ve Ayvalık', meta1:'İzmir Çıkışlı · Tekne Dahil', meta2:'Bu Pazar', priceMain:'890'},
    {img:'abant2', badges:['Günübirlik'], rating:'4.4', reviews:'155+', title:'Abant ve Gölcük Turu', meta1:'Ankara Çıkışlı · Kahvaltı Dahil', meta2:'12 Ekim, Pazar', priceMain:'620'},
    {img:'iznik2', badges:['Günübirlik'], rating:'4.5', reviews:'70+', title:'İznik Gölü ve Antik Kent', meta1:'Bursa Çıkışlı · Rehberli', meta2:'19 Ekim, Pazar', priceMain:'450'},
  ]},
  /* Aktiviteler Turkiye geneli; titleIcon kategoriyle ayni (activity). */
  {title:'Aktiviteler', anchor:'aktiviteler', titleIcon:'activity', meta1Icon:'clock', meta2Label:'En yakın:', items:[
    {img:'rafting3', badges:['Su Sporları'], rating:'4.8', reviews:'440+', title:'Köprülü Kanyon Rafting', meta1:'Antalya, Manavgat · Yarım Gün', meta2:'Her gün', priceMain:'850'},
    {img:'paraglide3', badges:['Macera'], rating:'4.9', reviews:'1,2b+', title:'Ölüdeniz Yamaç Paraşütü', meta1:'Fethiye, Muğla · 20 dk Uçuş', meta2:'Her gün', priceMain:'1450'},
    {img:'balloon3', badges:['Macera'], sponsored:true, title:'Kapadokya Sıcak Hava Balonu', meta1:'Göreme, Nevşehir · 1 Saat Uçuş', meta2:'Her sabah', priceMain:'2990'},
    {img:'kayak3', badges:['Kış Sporu'], rating:'4.5', reviews:'330+', title:'Uludağ Kayak Dersi', meta1:'Bursa, Uludağ · 2 Saat Özel Ders', meta2:'Hafta içi', priceMain:'750'},
  ]},
  {title:'Oteller', anchor:'oteller', titleIcon:'home', meta1Icon:'mapPin', meta2Label:'Müsait:', items:[
    {img:'hotel4', badges:['Her Şey Dahil'], rating:'9.2', reviews:'340+', title:'Sealight Resort', meta1:'Kemer, Antalya · Denize Sıfır', meta2:'Bu hafta', priceMain:'2100', unit:'/gece'},
    /* href tasiyan kart, icerik sayfasi yazilmis otel demek. Adres
       /otel/<slug>/ bicimindedir ve slug hotel-data.js'teki HOTELS
       anahtariyla ayni olmak zorundadir; fiyat o otelin EN UCUZ odasinin
       gecelik ucreti, puan da yorum dagilimindan turetilen 10'luk skor
       olmak zorunda. tests/hotel.test.js ucunu de karsilastirir. */
    {img:'hotel5', href:'otel/kordon-butik-otel/', badges:['Şehir Oteli'], rating:'8.9', reviews:'210+', title:'Kordon Butik Otel', meta1:'Alsancak, İzmir · Sahile Yürüme Mesafesi', meta2:'Bugün', priceMain:'1950', unit:'/gece'},
    {img:'hotel6', badges:['Termal'], sponsored:true, title:'Termal Vadi Resort', meta1:'Termal, Yalova · Termal Havuz Dahil', meta2:'Bu ay', priceMain:'1590', unit:'/gece'},
    {img:'hotel7', badges:['Butik'], rating:'9.4', reviews:'96+', title:'Göreme Mağara Otel', meta1:'Göreme, Nevşehir · Tarihi Doku', meta2:'Bu hafta', priceMain:'2450', unit:'/gece'},
  ]},
];

/* ---------------- paylaşılan resize yayını ----------------
   Daha önce her yatay şerit ve her ok grubu için ayrı bir
   window.addEventListener('resize', ...) ekleniyordu (onlarca dinleyici).
   Artık tek bir dinleyici var ve rAF ile kısılıyor. */
const __resizeSubscribers = new Set();
let __resizeRaf = 0;
function onViewportResize(fn) {
  __resizeSubscribers.add(fn);
  return fn;
}
window.addEventListener('resize', () => {
  if (__resizeRaf) return;
  __resizeRaf = requestAnimationFrame(() => {
    __resizeRaf = 0;
    __resizeSubscribers.forEach(fn => { try { fn(); } catch (_) {} });
  });
});

/* ---------------- yatay kaydırma okları (masaüstü) ---------------- */
function initHscrollArrows() {
  const isDesktop = () => window.matchMedia('(min-width: 681px)').matches;

  document.querySelectorAll('.hscroll-wrap').forEach(wrap => {
    if (wrap._hscrollBound) return;
    wrap._hscrollBound = true;

    /* Kart şeritleri dışında kampanya ve tema şeritleri de aynı okları
       kullanır. */
    const track = wrap.querySelector('.h-scroll, .promo-scroll, .theme-scroll');
    const leftBtn = wrap.querySelector('.hscroll-arrow.left');
    const rightBtn = wrap.querySelector('.hscroll-arrow.right');
    if (!track || !leftBtn || !rightBtn) return;

    function update() {
      if (!isDesktop()) {
        wrap.classList.remove('is-scrollable');
        leftBtn.classList.add('is-hidden');
        leftBtn.classList.remove('is-visible');
        rightBtn.classList.add('is-hidden');
        rightBtn.classList.remove('is-visible');
        track.classList.remove('is-overflow-visible');
        return;
      }

      // Ekrana sığan bölgelerde kaydırmayı tamamen kapat.
      const canScroll = track.scrollWidth > track.clientWidth + 2;
      if (!canScroll) {
        wrap.classList.remove('is-scrollable');
        leftBtn.classList.add('is-hidden');
        leftBtn.classList.remove('is-visible');
        rightBtn.classList.add('is-hidden');
        rightBtn.classList.remove('is-visible');
        track.classList.add('is-overflow-visible');
        return;
      }

      track.classList.remove('is-overflow-visible');
      wrap.classList.add('is-scrollable');

      const atStart = track.scrollLeft <= 1;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      leftBtn.classList.toggle('is-hidden', atStart);
      leftBtn.classList.toggle('is-visible', !atStart);
      rightBtn.classList.toggle('is-hidden', atEnd);
      rightBtn.classList.toggle('is-visible', !atEnd);
    }

    /* Bir tıklamada ne kadar kayacağı: kart genişliğinin katı olarak
       hesaplanır, böylece kaydırma kartların kenarında biter.
       Snap'li şeritlerde (kampanyalar) tıklama başına tam bir kart kayar;
       sabit oranla kaydırınca bir tıklamada iki kart atlanıyordu. */
    function adimGenisligi() {
      const kart = track.firstElementChild;
      if (!kart) return track.clientWidth * 0.8;
      const stil = getComputedStyle(track);
      const bosluk = parseFloat(stil.columnGap || stil.gap) || 0;
      const kartAdimi = kart.getBoundingClientRect().width + bosluk;
      if (!kartAdimi) return track.clientWidth * 0.8;

      const snapTuru = stil.scrollSnapType || 'none';
      if (snapTuru !== 'none' && snapTuru.indexOf('x') === 0) return kartAdimi;

      /* Snap yoksa ekrana tam sığan kart sayısı kadar kaydır. */
      const siganKart = Math.max(1, Math.floor((track.clientWidth + bosluk) / kartAdimi));
      return siganKart * kartAdimi;
    }

    leftBtn.addEventListener('click', () => {
      track.scrollBy({ left: -adimGenisligi(), behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', () => {
      track.scrollBy({ left: adimGenisligi(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', update, {passive:true});
    onViewportResize(update);
    /* Serit icerigi sonradan degisirse (zaman filtresi) ok gorunurlugu
       disaridan tazelenebilsin. */
    wrap._hscrollUpdate = update;
    update();
  });
}

/* ---------------- responsive category count ---------------- */
function updateCategoryLayout() {
  const track = document.getElementById('catScroll');
  if (!track) return;

  const items = track.querySelectorAll('.cat-item');
  if (!items.length) return;

  const style = getComputedStyle(track);
  const gap = 20;
  const paddingX = parseFloat(style.paddingLeft || 0) + parseFloat(style.paddingRight || 0);
  const available = Math.max(0, track.clientWidth - paddingX);
  const minCard = 60;
  const peek = 0.70;

  // İlk ekranda tam kartların ardından sonraki kartın yaklaşık %40'ı görünsün.
  // Önce minimum kart genişliğiyle kaç tam kartın sığdığını bul, sonra
  // CSS'teki (count + peek) hesabıyla alanı tam olarak dağıt.
  let count = Math.floor((available + gap - peek * minCard) / (minCard + gap));
  count = Math.max(1, Math.min(count, items.length));

  const hasMore = items.length > count;
  setCssVars(track, { '--cat-count': count, '--cat-peek': hasMore ? peek : 0 });
}

/* ---------------- render ---------------- */
if (byId('top10Scroll')) byId('top10Scroll').innerHTML = top10.map((it,i)=>`
  <a class="top10-card" href="#">
    <div class="top10-media">
      <span class="top10-rank">${i+1}</span>
      <img src="${cardImages[it.img] || ('https://picsum.photos/seed/'+it.img+'/236/296')}" alt="${it.t}">
    </div>
    <div class="top10-info"><h3>${it.t}</h3></div>
  </a>`).join('');

if (byId('catScroll')) byId('catScroll').innerHTML = categories.map(c=>`
  <a class="cat-item" href="#">
    <span class="cat-icon-wrap"><img class="cat-icon-img" src="${CAT_ICONS[c.img]}" alt="${c.name}"></span>
    <span>${c.name}</span>
  </a>`).join('');
updateCategoryLayout();
onViewportResize(updateCategoryLayout);

/* Tek bir kartin isaretlemesi. Zaman filtresi olan seritlerde liste filtre
   degistikce bu fonksiyonla yeniden cizildigi icin ayri tutuluyor. */
function poiCardMarkup(sec, it){
  /* Icerik sayfasi olan turda baslik gercek bir <a>: klavyeyle
     gezilebilir ve tarayici/arama motoru bagi gorebilir. data-href ise
     kartin tamaminin tiklanabilmesi icin (asagidaki delege dinleyici);
     ikisi ayni hedefi gosterir. */
  const baslik = it.href
    ? `<a href="${it.href}">${it.title}</a>`
    : it.title;
  return `
        <article class="poi-card"${it.href ? ` data-href="${it.href}"` : ''}>
          <div class="poi-media">
            <img src="${cardImages[it.img] || ('https://picsum.photos/seed/'+it.img+'/400/300')}" alt="">
            <div class="poi-badges">${it.badges.map(b=>`<span class="poi-badge">${b}</span>`).join('')}</div>
            <button class="poi-fav-btn" type="button" aria-label="Favorilere ekle"><span class="icon">${svg('heart')}</span></button>
          </div>
          ${it.sponsored
            ? `<div class="poi-status-badge sponsored">Sponsorlu</div>`
            : `<div class="poi-status-badge"><span class="icon">${svg('star')}</span>${it.rating}<span class="count">(${it.reviews})</span></div>`}
          <div class="poi-body">
            <h3 class="poi-title">${baslik}</h3>
            <p class="poi-meta-row"><span class="icon">${svg(sec.meta1Icon)}</span><span class="poi-meta-text">${it.meta1}</span></p>
            <p class="poi-meta-row"><span class="icon">${svg('calendar')}</span><strong>${sec.meta2Label}</strong><span class="poi-meta-text">${it.meta2}</span></p>
          </div>
          <div class="poi-price-bar">
            <span class="poi-price"><span class="main">${it.priceMain}</span><span class="decimals">.00</span><span class="currency">TL</span>${it.unit ? `<span class="unit">${it.unit}</span>` : ''}</span>
            <button class="poi-cart-btn"><span class="icon">${svg('basket')}</span></button>
          </div>
        </article>`;
}

/* Kompakt kart: gorsel uzerinde tarih rozeti, altinda tur etiketi, baslik,
   yer ve fiyat. cardStyle:'compact' tasiyan seritlerde kullanilir. */
function compactCardMarkup(sec, it){
  return `
        <article class="compact-card">
          <div class="compact-card-media">
            <img src="${cardImages[it.img] || ('https://picsum.photos/seed/'+it.img+'/400/300')}" alt="" loading="lazy">
            <span class="compact-card-when"><span class="icon">${svg('calendar')}</span>${it.meta2}</span>
            <button class="poi-fav-btn compact-card-fav" type="button" aria-label="Favorilere ekle"><span class="icon">${svg('heart')}</span></button>
          </div>
          <div class="compact-card-body">
            <div class="compact-card-top">
              <span class="compact-card-tag">${(it.badges && it.badges[0]) || ''}</span>
              ${it.sponsored
                ? `<span class="compact-card-sponsored">Sponsorlu</span>`
                : `<span class="compact-card-rating"><span class="icon">${svg('star')}</span>${it.rating}</span>`}
            </div>
            <h3 class="compact-card-title">${it.title}</h3>
            <p class="compact-card-place"><span class="icon">${svg('mapPin')}</span><span>${it.meta1}</span></p>
            <span class="compact-card-price">${it.priceMain} TL</span>
          </div>
        </article>`;
}

/* Seritteki kartlar. filterKey tasiyan seritlerde secime gore suzulur. */
function sectionCardsMarkup(sec, filterKey){
  const items = sec.filterKey ? filterUpcomingItems(sec.items, filterKey) : sec.items;
  if (!items.length) return '<p class="section-empty">Bu seçim için uygun etkinlik yok.</p>';
  const kart = sec.cardStyle === 'compact' ? compactCardMarkup : poiCardMarkup;
  return items.map(it => kart(sec, it)).join('');
}

/* Baslik altindaki zaman filtresi cipleri. */
function sectionFilterMarkup(sec){
  if (!sec.filterKey) return '';
  return `<div class="section-filter-row" data-section-filters="${sec.filterKey}" role="tablist" aria-label="${sec.title} zaman filtresi">
      ${UPCOMING_FILTERS.map((f, i)=>`<button class="section-filter-chip${i === 0 ? ' active' : ''}" type="button" role="tab" aria-selected="${i === 0}" data-filter-value="${f.key}">${f.label}</button>`).join('')}
    </div>`;
}

if (byId('cardSections')) byId('cardSections').innerHTML = cardSections.map(sec=>`
  <section class="section"${sec.anchor ? ` id="${sec.anchor}"` : ''}>
    <div class="section-head"><h2>${sec.title}</h2><a class="see-all" href="#">Tümünü Gör <span class="icon">${svg('chevRight')}</span></a></div>
    ${sectionFilterMarkup(sec)}
    <div class="hscroll-wrap">
    <div class="h-scroll"${sec.filterKey ? ` data-section-list="${sec.filterKey}"` : ''}>${sectionCardsMarkup(sec, UPCOMING_FILTERS[0].key)}</div>
    <button class="hscroll-arrow left" type="button" data-dir="left" aria-label="Geri"><span class="icon">${svg('chevLeft')}</span></button>
    <button class="hscroll-arrow right" type="button" data-dir="right" aria-label="İleri"><span class="icon">${svg('chevRight')}</span></button>
    </div>
  </section>
  ${homeBlocksAfter(sec.title)}`).join('');

initHscrollArrows();
initHomeBlocks();

/* Icerik sayfasi olan kartlarin her yeri tiklanabilir. Favori ve sepet
   butonlari ile basliktaki baglanti kendi islerini yapmaya devam eder;
   bu yuzden once onlar elenir. Tek delege dinleyici: kartlar sonradan
   yeniden cizildiginde (zaman filtreleri) yeniden baglanmak gerekmez. */
document.addEventListener('click', (e) => {
  const kart = e.target.closest('.poi-card[data-href]');
  if (!kart || e.target.closest('a, button')) return;
  window.location.href = kart.getAttribute('data-href');
});

/* ---------------- anasayfa ara bloklarının etkileşimleri ----------------
   Blokların verisi ve işaretlemesi home-blocks.js'te; burada yalnızca
   yerleştirildikten sonraki davranışları bağlanır. Bir blok
   HOME_BLOCK_PLACEMENT'tan çıkarılırsa buradaki kod sessizce atlanır. */
/* iOS'ta klavye açılınca yalnızca "visual viewport" küçülür; sayfanın
   düzen (layout) viewport'u aynı kaldığı için programatik olarak
   odaklanan alan klavyenin arkasında kalabiliyor. Odaktan sonra alanı
   görünür yüksekliğin üst tarafına kaydırıyoruz; klavye açıldığında
   viewport bir kez daha küçüldüğü için kaydırmayı o an tekrarlıyoruz. */
function focusAndRevealInput(input){
  if (!input) return;
  input.focus();

  const reveal = () => {
    const vv = window.visualViewport;
    const gorunurYukseklik = vv ? vv.height : window.innerHeight;
    /* Sayfanın yapışkan arama + filtre çubukları üstte ~110-130px yer
       kaplıyor; alan hiçbir koşulda onların altında kalmasın. */
    const ustBosluk = Math.max(165, Math.round(gorunurYukseklik * 0.32));
    const hedef = window.scrollY + input.getBoundingClientRect().top - ustBosluk;
    window.scrollTo({ top: Math.max(0, hedef), behavior: 'smooth' });
  };

  reveal();

  const vv = window.visualViewport;
  if (!vv) {
    window.setTimeout(reveal, 350);
    return;
  }
  /* Klavyenin açılması viewport'u yeniden boyutlandırır; ilk boyut
     değişiminde konumu düzeltip dinlemeyi bırakıyoruz. */
  const onResize = () => {
    reveal();
    vv.removeEventListener('resize', onResize);
  };
  vv.addEventListener('resize', onResize);
  window.setTimeout(() => vv.removeEventListener('resize', onResize), 1500);
}

function initHomeBlocks(){
  /* --- Şerit zaman filtresi (Yaklaşan Etkinlikler) --- */
  document.querySelectorAll('[data-section-filters]').forEach(row => {
    const anahtar = row.dataset.sectionFilters;
    const liste = document.querySelector(`[data-section-list="${anahtar}"]`);
    const bolum = cardSections.find(sec => sec.filterKey === anahtar);
    if (!liste || !bolum) return;

    /* Şerit yatay kaydırılabilir olduğu için, tarayıcı geri/ileri gidişte
       eski kaydırma konumunu geri yükleyebiliyor; o durumda seçili ilk çip
       ("En yakın") ekranın solunda kalıp hiçbir şey seçili değilmiş gibi
       görünüyordu. Açılışta şerit her zaman başa sarılır. */
    row.scrollLeft = 0;

    row.addEventListener('click', (e)=>{
      const chip = e.target.closest('[data-filter-value]');
      if (!chip || chip.classList.contains('active')) return;
      row.querySelectorAll('[data-filter-value]').forEach(el => {
        const secili = el === chip;
        el.classList.toggle('active', secili);
        el.setAttribute('aria-selected', String(secili));
      });
      liste.innerHTML = sectionCardsMarkup(bolum, chip.dataset.filterValue);
      liste.scrollLeft = 0;
      /* Kart sayısı değiştiği için masaüstündeki okların görünürlüğü yeniden
         hesaplanmalı. */
      const wrap = liste.closest('.hscroll-wrap');
      if (wrap && typeof wrap._hscrollUpdate === 'function') wrap._hscrollUpdate();
    });
  });

  /* --- E-bülten: arka uç yok; geçerli adreste form yerini teşekkür alır. --- */
  const form = document.getElementById('homeNewsletterForm');
  const note = document.getElementById('homeNewsletterNote');
  if (form) {
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const input = document.getElementById('homeNewsletterEmail');
      if (!isValidEmail(input ? input.value : '')) {
        form.classList.add('has-error');
        if (note) {
          note.textContent = 'Geçerli bir e-posta adresi gir.';
          note.classList.add('is-error');
        }
        focusAndRevealInput(input);
        return;
      }
      form.classList.remove('has-error');
      form.remove();
      if (note) {
        note.textContent = 'Kaydın alındı. Fırsatlar artık e-postana gelecek.';
        note.classList.remove('is-error');
        note.classList.add('is-success');
      }
    });
  }

  /* --- Beni ara: buton formu açar, gönderimde numara doğrulanır. --- */
  const callbackBtn = document.getElementById('homeCallbackBtn');
  const callbackForm = document.getElementById('homeCallbackForm');
  const callbackNote = document.getElementById('homeCallbackNote');
  if (callbackBtn && callbackForm) {
    callbackBtn.addEventListener('click', ()=>{
      const acik = !callbackForm.hidden;
      callbackForm.hidden = acik;
      callbackBtn.classList.toggle('is-open', !acik);
      callbackBtn.setAttribute('aria-expanded', String(!acik));
      if (!acik) {
        focusAndRevealInput(document.getElementById('homeCallbackPhone'));
      }
    });

    callbackForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const input = document.getElementById('homeCallbackPhone');
      if (!isValidPhone(input ? input.value : '')) {
        callbackForm.classList.add('has-error');
        if (callbackNote) {
          callbackNote.textContent = 'Numaranı 05XX XXX XX XX biçiminde gir.';
          callbackNote.classList.add('is-error');
        }
        focusAndRevealInput(input);
        return;
      }
      callbackForm.classList.remove('has-error');
      const satir = callbackForm.querySelector('.home-callback-row');
      const etiket = callbackForm.querySelector('label');
      if (satir) satir.remove();
      if (etiket) etiket.remove();
      if (callbackNote) {
        callbackNote.textContent = 'Talebin alındı. En kısa sürede seni arayacağız.';
        callbackNote.classList.remove('is-error');
        callbackNote.classList.add('is-success');
      }
    });
  }

  /* Alt SEO metni: "Devamını oku" yalnızca görünür yüksekliği açar.
     Metin hiçbir zaman display:none ile gizlenmez; arama motoru için
     tamamı DOM'da ve okunabilir durumda kalır. */
  const seoToggle = document.getElementById('homeSeoToggle');
  const seoBody = document.getElementById('homeSeoBody');
  if (seoToggle && seoBody) {
    const etiket = seoToggle.querySelector('.seo-toggle-label');
    seoToggle.addEventListener('click', () => {
      const acik = seoBody.classList.toggle('is-expanded');
      seoToggle.setAttribute('aria-expanded', acik ? 'true' : 'false');
      if (etiket) etiket.textContent = acik ? 'Daha az göster' : 'Devamını oku';
      if (!acik) {
        /* Kapatirken baslik ekrandan kacmasin. */
        const ust = seoBody.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: Math.max(0, ust), behavior: 'smooth' });
      }
    });
  }
}

/* ---------------- mouse / touch drag ile yatay kaydırma ----------------
   Tüm yatay kaydırılabilir alanlarda kartın/şeridin üzerine basılı tutup
   sürükleyerek kaydırma yapılır. Mouse wheel ile yatay kaydırma eklenmez. */
function initDragScroll() {
  document.querySelectorAll('.h-scroll, .cat-scroll, .filter-group, .promo-scroll, .theme-scroll').forEach(track => {
    if (track._dragScrollBound) return;
    track._dragScrollBound = true;

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScrollLeft = 0;
    let pointerId = null;

    const isHorizontallyScrollable = () => track.scrollWidth > track.clientWidth + 2;
    const updateDragCursor = () => {
      const scrollable = isHorizontallyScrollable();
      track.classList.toggle('is-drag-scrollable', scrollable);
      if (!scrollable && dragging) {
        dragging = false;
        track.classList.remove('is-dragging');
      }
    };

    updateDragCursor();
    onViewportResize(updateDragCursor);
    track.addEventListener('scroll', updateDragCursor, {passive:true});

    track.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') return; // mobilde native momentum scroll kullan
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (!isHorizontallyScrollable()) return;
      if (event.target.closest('button, input, textarea, select')) return;

      dragging = true;
      moved = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = track.scrollLeft;
      track.classList.add('is-dragging');
      /* Pointer capture BASMA aninda alinmaz, ilk gercek hareketle alinir.
         Basma aninda alindiginda tarayici sonraki mouseup ve click
         olaylarini da seride yonlendiriyor; click'in target'i basilan kart
         degil seridin kendisi oluyor ve kart uzerindeki delege
         dinleyiciler (ornegin icerik sayfasina gitme) hic tetiklenmiyordu.
         Suruklemenin kendisi icin capture yeterince erken: 5 pikselden
         sonra, imlec hala seridin uzerindeyken aliniyor. */
    });

    track.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 5 && !moved) {
        moved = true;
        /* Imlec seridin disina cikarsa da hareketler gelmeye devam etsin. */
        if (track.setPointerCapture) {
          try { track.setPointerCapture(pointerId); } catch (_) {}
        }
      }
      if (!moved) return;
      event.preventDefault();
      track.scrollLeft = startScrollLeft - dx;
    });

    const stopDragging = event => {
      if (!dragging) return;
      if (event && pointerId !== null && event.pointerId !== undefined && event.pointerId !== pointerId) return;
      dragging = false;
      track.classList.remove('is-dragging');
      try { if (pointerId !== null && track.releasePointerCapture) track.releasePointerCapture(pointerId); } catch (_) {}
      pointerId = null;
      if (moved) track.dataset.suppressClickUntil = String(Date.now() + 180);
    };

    track.addEventListener('pointerup', stopDragging);
    track.addEventListener('pointercancel', stopDragging);
    track.addEventListener('lostpointercapture', stopDragging);

    track.addEventListener('click', event => {
      const until = Number(track.dataset.suppressClickUntil || 0);
      if (until > Date.now()) {
        event.preventDefault();
        event.stopPropagation();
        track.dataset.suppressClickUntil = '0';
      }
    }, true);
  });
}

initDragScroll();


/* ---------------- mobile drawer toggle ---------------- */
const drawer = document.getElementById('mobileDrawer');
const overlay = document.getElementById('drawerOverlay');

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenuIcon = document.getElementById('ic-menu');
const siteHeader = document.querySelector('.site-header');

/* Drawer'ın başlangıç çizgisi ana header'ın gerçek alt sınırına bağlanır. */
function syncMobileDrawerPosition() {
  if (!siteHeader) return;
  const headerHeight = siteHeader.getBoundingClientRect().height;
  setCssVars(document.documentElement, { '--mobile-header-height': `${headerHeight}px` });
}

function syncMobileMenuButton(isOpen) {
  if (!mobileMenuBtn || !mobileMenuIcon) return;
  mobileMenuIcon.innerHTML = svg(isOpen ? 'close' : 'menu');
  mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
  mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
}

function toggleDrawer() {
  if (!drawer || !overlay) return;
  const isOpen = drawer.classList.contains('open');

  if (isOpen) {
    closeDrawer();
  } else {
    syncMobileDrawerPosition();
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('drawer-open-lock');
    refreshScrollLock();
    syncMobileMenuButton(true);
  }
}

/* Drawer'ı kapatan aynı 4 satır iki ayrı yerde tekrarlanıyordu. */
function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.classList.remove('drawer-open-lock');
  refreshScrollLock();
  syncMobileMenuButton(false);
}
window.closeMola360Drawer = closeDrawer;

syncMobileDrawerPosition();
if (typeof ResizeObserver !== 'undefined' && siteHeader) {
  new ResizeObserver(syncMobileDrawerPosition).observe(siteHeader);
}
onViewportResize(syncMobileDrawerPosition);

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleDrawer);
if (overlay) overlay.addEventListener('click', toggleDrawer);

/* ---------------- sidebar "Devamını gör" açılır listeler ---------------- */
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-more-toggle]');
  if (!toggle) return;
  const section = toggle.closest('.sidebar-section');
  if (!section) return;
  const expanded = section.classList.toggle('is-expanded');
  const label = toggle.querySelector('.label');
  if (label) label.textContent = expanded ? 'Daha az göster' : 'Devamını gör';
});

/* ---------------- full-screen search overlay ---------------- */
const searchOverlay = document.getElementById('searchOverlay');
const searchOverlayInput = document.getElementById('searchOverlayInput');
const searchOverlayClose = document.getElementById('searchOverlayClose');
/* Markup degisirse tum arama bloğu sessizce cokmesin diye korumali erisim. */
if (searchOverlayInput) searchOverlayInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const term = searchOverlayInput.value.trim();
    if (term) renderSearchResults(term);
    searchOverlayInput.blur();
  }
});

const searchOverlayClear = document.getElementById('searchOverlayClear');

/* normalizeSearchText, getSearchCategoryIcon, getSearchCardType artık
   assets/js/search-utils.js içinde (bu dosyadan önce yüklenir). */
function getSearchImage(item) {
  return cardImages[item.img] || ('https://picsum.photos/seed/'+encodeURIComponent(item.img)+'/400/300');
}

// Arama ekranında seçili olan kategori (varsa). Kategoriye tıklanınca
// diğer bölümler (Son Aramalar, Popüler Aramalar, Öne Çıkanlar) kaybolmaz;
// sadece seçilen kategori görsel olarak işaretlenir ve sonuçlar altta gösterilir.
let activeSearchCategory = null;

function renderSearchHome() {
  const home = document.getElementById('searchHomeContent');
  if (!home) return;

  const categoryHtml = searchCategories.map(c => `
    <button type="button" class="m360-category-card${activeSearchCategory === c.name ? ' active' : ''}" data-search-term="${c.name}" data-category="${c.name}">
      <span class="icon">${svg(getSearchCategoryIcon(c.name))}</span>
      <span>${c.name}</span>
    </button>
  `).join('');

  const suggestedHtml = suggestedSearchTerms.map(term => `
    <button type="button" class="m360-pill" data-search-term="${term}">${term}</button>
  `).join('');

  const recentHtml = recentSearchTerms.map(term => `
    <button type="button" class="search-recent-item m360-recent-search-item" data-search-term="${term}">
      <span class="icon clock-icon">${svg('clock')}</span>
      <span class="recent-term">${term}</span>
      <span class="search-recent-remove" aria-label="Aramayı sil">${svg('close')}</span>
    </button>
  `).join('');

  const featured = cardSections.flatMap(sec =>
    sec.items.slice(0, 2).map(item => ({...item, sectionTitle:sec.title}))
  ).slice(0, 4);

  const featuredHtml = featured.map(item => `
    <button type="button" class="m360-search-result" data-search-term="${item.title}">
      <span class="m360-search-result-media"><img src="${getSearchImage(item)}" alt="${item.title}" loading="lazy"></span>
      <span class="m360-search-result-info">
        <span class="type">${getSearchCardType(item.sectionTitle)}</span>
        <strong>${item.title}</strong>
        <p>${item.meta1 || ''}</p>
      </span>
    </button>
  `).join('');

  // Bir kategori seçiliyse, kategoriye ait sonuçları en altta ayrı bir
  // bölüm olarak gösteriyoruz; üstteki bölümler (Kategoriler, Önerilen
  // Aramalar, Son Aramalar, Öne Çıkanlar) her zaman yerinde kalır.
  let categoryResultsHtml = '';
  if (activeSearchCategory) {
    const q = normalizeSearchText(activeSearchCategory);
    const catResults = [];
    cardSections.forEach(sec => {
      sec.items.forEach(item => {
        const haystack = normalizeSearchText([
          item.title, sec.title, ...(item.badges || []), item.meta1, item.meta2
        ].join(' '));
        if (haystack.includes(q)) catResults.push({...item, sectionTitle:sec.title});
      });
    });

    const catResultHtml = catResults.map(item => `
      <button type="button" class="m360-search-result" data-search-term="${item.title}">
        <span class="m360-search-result-media"><img src="${getSearchImage(item)}" alt="${item.title}" loading="lazy"></span>
        <span class="m360-search-result-info">
          <span class="type">${getSearchCardType(item.sectionTitle)}</span>
          <strong>${item.title}</strong>
          <p>${item.meta1 || ''}</p>
        </span>
      </button>
    `).join('');

    categoryResultsHtml = `
      <section class="m360-search-section" id="m360CategoryResults">
        <div class="m360-search-section-title">
          <h3>${activeSearchCategory} için sonuçlar</h3><span>${catResults.length} eşleşme</span>
        </div>
        ${catResultHtml ? `<div class="m360-search-list">${catResultHtml}</div>` : `
          <div class="m360-search-empty">
            <strong>${activeSearchCategory} kategorisinde sonuç bulunamadı.</strong>
          </div>`}
      </section>`;
  }

  home.innerHTML = `
    <section class="m360-search-section">
      <div class="m360-search-section-title">
        <h3>Kategoriler</h3>
      </div>
      <div class="m360-category-grid">${categoryHtml}</div>
    </section>

    <section class="m360-search-section">
      <div class="m360-search-section-title">
        <h3>Popüler Aramalar</h3>
      </div>
      <div class="m360-pill-list">${suggestedHtml}</div>
    </section>

    <section class="m360-search-section">
      <div class="m360-search-section-title">
        <h3>Son Aramalar</h3><button class="m360-see-all" type="button">Tümünü Gör</button>
      </div>
      <div class="search-recent-list m360-search-list">${recentHtml}</div>
    </section>

    <section class="m360-search-section">
      <div class="m360-search-section-title">
        <h3>Öne Çıkanlar</h3><button class="m360-see-all" type="button">Tümünü Gör</button>
      </div>
      <div class="m360-search-list">${featuredHtml}</div>
    </section>

    ${categoryResultsHtml}
  `;
}

function renderSearchResults(query) {
  const home = document.getElementById('searchHomeContent');
  if (!home) return;

  activeSearchCategory = null;

  const q = normalizeSearchText(query).trim();
  if (!q) {
    renderSearchHome();
    return;
  }

  const categoryMatches = searchCategories.filter(c => normalizeSearchText(c.name).includes(q));
  const results = [];

  cardSections.forEach(sec => {
    sec.items.forEach(item => {
      const haystack = normalizeSearchText([
        item.title, sec.title, ...(item.badges || []), item.meta1, item.meta2
      ].join(' '));
      if (haystack.includes(q)) results.push({...item, sectionTitle:sec.title});
    });
  });

  const catHtml = categoryMatches.length ? `
    <section class="m360-search-section">
      <div class="m360-search-section-title"><h3>Kategoriler</h3></div>
      <div class="m360-category-grid">
        ${categoryMatches.map(c => `
          <button type="button" class="m360-category-card" data-search-term="${c.name}">
            <span class="icon">${svg(getSearchCategoryIcon(c.name))}</span>
            <span>${c.name}</span>
          </button>
        `).join('')}
      </div>
    </section>` : '';

  const resultHtml = results.slice(0, 12).map(item => `
    <button type="button" class="m360-search-result" data-search-term="${item.title}">
      <span class="m360-search-result-media"><img src="${getSearchImage(item)}" alt="${item.title}" loading="lazy"></span>
      <span class="m360-search-result-info">
        <span class="type">${getSearchCardType(item.sectionTitle)}</span>
        <strong>${item.title}</strong>
        <p>${item.meta1 || ''}</p>
      </span>
    </button>
  `).join('');

  const resultsHtml = resultHtml ? `
    <section class="m360-search-section">
      <div class="m360-search-section-title"><h3>Sonuçlar</h3><span>${results.length} eşleşme</span></div>
      <div class="m360-search-list">${resultHtml}</div>
    </section>` : `
    <div class="m360-search-empty">
      <strong>Aradığın şeyi bulamadık.</strong>
      <span>Etkinlik, tur, otel, aktivite veya kategori adıyla tekrar deneyebilirsin.</span>
    </div>`;

  home.innerHTML = catHtml + resultsHtml;
}

/* Arama ekranının kendi ayrı kilit mekanizması vardı; kullandığı
   '.search-scroll-locked' sınıfı CSS'te hiç tanımlı olmadığı için fiilen
   hiçbir şey yapmıyordu. Artık merkezî kilit sistemine bağlı. */
function lockSearchPageScroll()   { refreshScrollLock(); }
function unlockSearchPageScroll() { refreshScrollLock(); }

function openSearchOverlay() {
  activeSearchCategory = null;
  renderSearchHome();
  searchOverlay.classList.add('open');
  document.body.classList.add('search-modal-open');
  lockSearchPageScroll();

  /* iOS'ta klavye açılırken zoom oluşmaması için 16px input + kısa gecikme. */
  setTimeout(() => {
    searchOverlayInput.focus({preventScroll:true});
  }, 120);
}

// Arama paneli dışına tıklanınca kapat
document.addEventListener('click', (event) => {
  if (!searchOverlay.classList.contains('open')) return;
  const target = event.target;
  if (target.closest('.search-overlay')) return;
  if (target.closest('.header-search, .mobile-search-bar')) return;
  closeSearchOverlay();
}, true);

function closeSearchOverlay() {
  searchOverlay.classList.remove('open');
  document.body.classList.remove('search-modal-open');
  searchOverlayInput.blur();
  unlockSearchPageScroll();
}

if (searchOverlayClose) {
  searchOverlayClose.addEventListener('click', closeSearchOverlay);
}

/* iOS'ta klavye açıldığında visual viewport küçülür ama düzen (layout)
   viewport'u değişmediği için scroll alanının altı klavyenin arkasında
   kalır. Klavye yüksekliği kadar ekstra alt boşluk ekleyip kapanınca
   geri alıyoruz, böylece en alttaki içerik de görünür/erişilebilir olur. */
const searchOverlayBody = document.getElementById('searchOverlayBody');
function updateSearchOverlayKeyboardInset() {
  if (!searchOverlayBody || !window.visualViewport) return;
  if (!searchOverlay.classList.contains('open')) return;
  const vv = window.visualViewport;
  const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  if (keyboardInset > 0) {
    setCssVars(searchOverlayBody, { '--keyboard-inset-padding': `calc(28px + env(safe-area-inset-bottom) + ${keyboardInset}px)` });
    searchOverlayBody.classList.add('has-keyboard-inset');
  } else {
    setCssVars(searchOverlayBody, { '--keyboard-inset-padding': null });
    searchOverlayBody.classList.remove('has-keyboard-inset');
  }
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateSearchOverlayKeyboardInset, { passive: true });
  window.visualViewport.addEventListener('scroll', updateSearchOverlayKeyboardInset, { passive: true });
}
searchOverlayInput.addEventListener('focus', () => setTimeout(updateSearchOverlayKeyboardInset, 300));
searchOverlayInput.addEventListener('blur', () => setTimeout(updateSearchOverlayKeyboardInset, 300));

onId('headerSearchTrigger', 'click', openSearchOverlay);
onId('headerSearchTrigger', 'keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openSearchOverlay(); } });
onId('mobileSearchTrigger', 'click', openSearchOverlay);
onId('mobileSearchTrigger', 'keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openSearchOverlay(); } });
onId('searchOverlayBack', 'click', closeSearchOverlay);

searchOverlayInput.addEventListener('input', ()=>{
  const value = searchOverlayInput.value;
  searchOverlayClear.classList.toggle('show', value.length > 0);
  renderSearchResults(value);
});

searchOverlayClear.addEventListener('click', ()=>{
  searchOverlayInput.value = '';
  searchOverlayClear.classList.remove('show');
  activeSearchCategory = null;
  renderSearchHome();
  searchOverlayInput.focus({preventScroll:true});
});

onId('searchHomeContent', 'click', (e)=>{
  const removeButton = e.target.closest('.search-recent-remove');
  if (removeButton) {
    e.preventDefault();
    e.stopPropagation();
    const item = removeButton.closest('[data-search-term]');
    const term = item?.dataset.searchTerm || '';
    const index = recentSearchTerms.indexOf(term);
    if (index !== -1) recentSearchTerms.splice(index, 1);
    renderSearchHome();
    return;
  }

  const categoryBtn = e.target.closest('.m360-category-card[data-category]');
  if (categoryBtn) {
    const catName = categoryBtn.dataset.category;
    // Aynı kategoriye tekrar tıklanırsa seçimi kaldır (toggle); değilse seç.
    activeSearchCategory = (activeSearchCategory === catName) ? null : catName;
    renderSearchHome();
    // Sonuç bölümü ekranın altında kaldığı için, seçim yapıldığında
    // kullanıcının değişikliği fark etmesi için o bölüme kaydır.
    if (activeSearchCategory) {
      const resultsSection = document.getElementById('m360CategoryResults');
      if (resultsSection) {
        resultsSection.scrollIntoView({behavior:'smooth', block:'start'});
      }
    }
    return;
  }

  const target = e.target.closest('[data-search-term]');
  if (!target) return;
  const term = target.dataset.searchTerm || '';
  searchOverlayInput.value = term;
  searchOverlayClear.classList.add('show');
  renderSearchResults(term);
  searchOverlayInput.focus({preventScroll:true});
});

/* ---------------- bildirimler ----------------
   Liste tek kaynaktan (bu dizi) uretilir; filtreleme, gruplama ve sayac
   metinleri notif-utils.js'teki saf fonksiyonlardan gelir.
   group: 'today' | 'week' | 'earlier'  ·  type: filtre cipleriyle ayni anahtar */
const notifications = [
  {id:'n1',  type:'deal',     group:'today',   time:'5 dakika önce', unread:true,  title:'Kapadokya Balon Turu\'nda %20 indirim!'},
  {id:'n2',  type:'booking',  group:'today',   time:'1 saat önce',   unread:true,  title:'Rezervasyonunuz onaylandı: Pamukkale Termal Tatili'},
  {id:'n3',  type:'event',    group:'today',   time:'3 saat önce',   unread:true,  title:'Yeni etkinlik: Bodrum Tekne Turu yakında başlıyor'},
  {id:'n4',  type:'favorite', group:'week',    time:'Dün',           unread:true,  title:'Favorilediğiniz Efes Turu\'nda yer sayısı azalıyor'},
  {id:'n5',  type:'system',   group:'week',    time:'2 gün önce',    unread:true,  title:'Hesap bilgilerinizi güncellemeyi unutmayın'},
  {id:'n6',  type:'deal',     group:'week',    time:'2 gün önce',    unread:true,  title:'Antalya Tekne Turu\'nda son 3 gün: %15 indirim'},
  {id:'n7',  type:'booking',  group:'week',    time:'2 gün önce',    unread:false, title:'Rezervasyonunuz onaylandı: Fethiye Yamaç Paraşütü'},
  {id:'n8',  type:'event',    group:'week',    time:'3 gün önce',    unread:false, title:'Yeni etkinlik: Pamukkale Gün Doğumu Turu eklendi'},
  {id:'n9',  type:'favorite', group:'week',    time:'3 gün önce',    unread:false, title:'Favorilediğiniz Kapadokya Balon Turu\'nda fiyat düştü'},
  {id:'n10', type:'system',   group:'week',    time:'3 gün önce',    unread:false, title:'Ödeme yönteminizin süresi yakında doluyor'},
  {id:'n11', type:'deal',     group:'week',    time:'4 gün önce',    unread:false, title:'Hafta sonuna özel: Bursa Uludağ Turu\'nda %10 indirim'},
  {id:'n12', type:'booking',  group:'week',    time:'4 gün önce',    unread:false, title:'Rezervasyon hatırlatması: İzmir Efes Turu yarın'},
  {id:'n13', type:'event',    group:'week',    time:'5 gün önce',    unread:false, title:'Yeni etkinlik: Bodrum Gece Turu programı yayında'},
  {id:'n14', type:'favorite', group:'week',    time:'5 gün önce',    unread:false, title:'Favorilediğiniz Pamukkale Termal Tatili\'nde son 5 kontenjan'},
  {id:'n15', type:'system',   group:'week',    time:'6 gün önce',    unread:false, title:'Gizlilik politikamızda güncelleme yapıldı'},
  {id:'n16', type:'deal',     group:'earlier', time:'1 hafta önce',  unread:false, title:'Erken rezervasyon fırsatı: Fethiye Tekne Turu\'nda %25 indirim'},
  {id:'n17', type:'booking',  group:'earlier', time:'1 hafta önce',  unread:false, title:'Rezervasyonunuz onaylandı: Kapadokya Balon Turu'},
  {id:'n18', type:'event',    group:'earlier', time:'1 hafta önce',  unread:false, title:'Yeni etkinlik: Antalya Rafting Turu takvime eklendi'},
  {id:'n19', type:'system',   group:'earlier', time:'1 hafta önce',  unread:false, title:'Uygulamamızın yeni sürümü yayında, güncellemeyi unutmayın'},
  {id:'n20', type:'favorite', group:'earlier', time:'1 hafta önce',  unread:false, title:'Favorilediğiniz Bodrum Tekne Turu\'nda yeni tarihler eklendi'}
];

const notifTypeIcons = {
  deal:     '<circle cx="7.5" cy="7.5" r="1.6"></circle><circle cx="16.5" cy="16.5" r="1.6"></circle><line x1="18" y1="6" x2="6" y2="18"></line>',
  booking:  '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"></rect><line x1="3" y1="9.5" x2="21" y2="9.5"></line><line x1="8" y1="2.5" x2="8" y2="6.5"></line><line x1="16" y1="2.5" x2="16" y2="6.5"></line><polyline points="9 14.5 11 16.5 15 12.5"></polyline>',
  event:    '<path d="M3 8.5A2 2 0 0 1 5 6.5h14a2 2 0 0 1 2 2v2a2.2 2.2 0 0 0 0 4.4v2A2 2 0 0 1 19 19H5a2 2 0 0 1-2-2v-2a2.2 2.2 0 0 0 0-4.4z"></path><line x1="9.5" y1="6.5" x2="9.5" y2="19" stroke-dasharray="2.2 2.2"></line>',
  favorite: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"></path>',
  system:   '<circle cx="12" cy="12" r="9"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
};
function notifIconSvg(paths){
  return '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
}

const notifBtn = document.getElementById('notifBtn');
const notifPanel = document.getElementById('notifPanel');
const notifPanelInner = notifPanel.querySelector('.notif-panel-inner');
const notifListEl = document.getElementById('notifList');
const notifFiltersEl = document.getElementById('notifFilters');
const notifSubtitleEl = document.getElementById('notifPanelSubtitle');
const notifMarkAllBtn = document.getElementById('notifMarkAll');
const notifBackBtn = document.getElementById('notifPanelBack');
const notifBadgeEl = document.querySelector('.notif-badge');
let notifFilter = 'all';

function notifItemMarkup(item){
  return `<div class="notif-item${item.unread ? ' unread' : ''}" data-notif-id="${item.id}" role="button" tabindex="0" aria-label="${getNotifTypeLabel(item.type)}: ${item.title}">
    <span class="notif-icon ${item.type}"><span class="icon">${notifIconSvg(notifTypeIcons[item.type] || notifTypeIcons.system)}</span></span>
    <span class="notif-text">
      <span class="notif-meta"><span class="notif-type">${getNotifTypeLabel(item.type)}</span><span class="notif-meta-dot"></span><span class="notif-time">${item.time}</span></span>
      <span class="notif-title">${item.title}</span>
    </span>
    <button class="notif-dismiss" type="button" data-notif-dismiss="${item.id}" aria-label="Bildirimi kaldır">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  </div>`;
}

function notifEmptyMarkup(){
  const text = notifFilter === 'unread'
    ? 'Okunmamış bildirimin kalmadı. Yeni bir şey olduğunda burada göreceksin.'
    : 'Bu filtrede gösterilecek bildirim yok. Başka bir filtre deneyebilirsin.';
  return `<div class="notif-empty">
    <span class="notif-empty-icon">${notifIconSvg('<path d="M18 8a6 6 0 0 0-9.3-5"></path><path d="M6.2 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h13"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path><line x1="3" y1="3" x2="21" y2="21"></line>')}</span>
    <p class="notif-empty-title">Bildirim yok</p>
    <p class="notif-empty-text">${text}</p>
  </div>`;
}

function renderNotifFilters(){
  notifFiltersEl.innerHTML = NOTIF_FILTERS.map(f => `<button class="notif-filter-chip${f.key === notifFilter ? ' active' : ''}" type="button" role="tab" aria-selected="${f.key === notifFilter}" data-notif-filter="${f.key}">${f.label}<span class="notif-filter-count"></span></button>`).join('');
}

function renderNotifList(){
  const groups = groupNotifications(filterNotifications(notifications, notifFilter));
  notifListEl.innerHTML = groups.length
    ? groups.map(g => `<div class="notif-group"><div class="notif-group-head">${g.label}</div>${g.items.map(notifItemMarkup).join('')}</div>`).join('')
    : notifEmptyMarkup();
}

/* Rozet, ozet satiri ve cip sayaclari tek yerden guncellenir. */
function refreshNotifChrome(){
  const unread = countUnreadNotifications(notifications);
  if (notifBadgeEl){
    notifBadgeEl.textContent = formatNotifCount(unread);
    notifBadgeEl.classList.toggle('is-hidden', unread === 0);
  }
  if (notifSubtitleEl) notifSubtitleEl.textContent = notifSummaryText(unread);
  if (notifMarkAllBtn) notifMarkAllBtn.disabled = unread === 0;
  notifBtn.setAttribute('aria-label', unread > 0 ? `Bildirimler (${unread} okunmamış)` : 'Bildirimler');
  notifFiltersEl.querySelectorAll('[data-notif-filter]').forEach(chip => {
    const countEl = chip.querySelector('.notif-filter-count');
    if (!countEl) return;
    const count = filterNotifications(notifications, chip.dataset.notifFilter).length;
    countEl.textContent = count;
    chip.classList.toggle('is-empty', count === 0);
  });
}

function renderNotifications(){
  renderNotifFilters();
  renderNotifList();
  refreshNotifChrome();
}
renderNotifications();

function markNotifRead(id, itemEl){
  const item = notifications.find(n => n.id === id);
  if (!item || !item.unread) return;
  item.unread = false;
  /* Liste yeniden cizilmez; kullanicinin kaydirma konumu korunur. */
  if (itemEl) itemEl.classList.remove('unread');
  refreshNotifChrome();
}

function dismissNotification(id, itemEl){
  const index = notifications.findIndex(n => n.id === id);
  if (index > -1) notifications.splice(index, 1);
  refreshNotifChrome();
  if (!itemEl) { renderNotifList(); return; }
  itemEl.classList.add('is-removing');
  window.setTimeout(() => {
    const group = itemEl.closest('.notif-group');
    itemEl.remove();
    if (group && !group.querySelector('.notif-item')) group.remove();
    if (!notifListEl.querySelector('.notif-item')) renderNotifList();
  }, 180);
}

function closeNotifPanel(){
  const wasOpen = notifPanel.classList.contains('open');
  notifPanel.classList.remove('open');
  notifBtn.setAttribute('aria-expanded','false');
  document.body.classList.remove('notif-modal-open');
  refreshScrollLock();
  /* Tam ekran sayfadan cikarken odak zil ikonuna geri doner. */
  if (wasOpen && isMobileViewport()) notifBtn.focus({preventScroll:true});
}
notifBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  const isOpen = notifPanel.classList.contains('open');
  if(isOpen){
    closeNotifPanel();
  } else {
    /* Profil menüsü açıksa önce onu kapat, ikisi aynı anda açık kalmasın. */
    if (typeof closeProfilePanel === 'function') closeProfilePanel();
    profilePanel.classList.remove('open');
    profileBtn.classList.remove('open');
    document.body.classList.remove('profile-modal-open');
    /* Masaüstü/tablet: dikey konum header ile aynı sabit sistemde
       (CSS'te top:66px, arama ekranındaki gibi); burada sadece panelin
       zil ikonunun altına denk gelmesi için yatay (sağ) boşluk hesaplanır.
       Mobilde panel tam ekran açıldığı için bu değer kullanılmaz. */
    const rect = notifBtn.getBoundingClientRect();
    const right = Math.max(12, Math.round(window.innerWidth - rect.right) - 15);
    setCssVars(notifPanelInner, { '--notif-dd-right': right + 'px' });
    notifListEl.scrollTop = 0;
    /* Panel yalnızca mobilde tam ekran ve sayfayı kilitleyen bir diyalog;
       masaüstünde header'a bitişik bir açılır menü. */
    notifPanel.setAttribute('aria-modal', isMobileViewport() ? 'true' : 'false');
    notifPanel.classList.add('open');
    notifBtn.setAttribute('aria-expanded','true');
    document.body.classList.add('notif-modal-open');
    refreshScrollLock();
    /* Odak, geri butonuna değil diyalog kapsayıcısına taşınır: buton
       odaklandığında iOS Safari butonun çevresine kendi mavi odak halkasını
       çiziyordu. Kapsayıcı görsel bir kontrol olmadığı için halkası CSS'te
       kapatılabiliyor; ekran okuyucu yine diyaloğun içine giriyor. */
    if (isMobileViewport()) notifPanel.focus({preventScroll:true});
  }
});
notifPanelInner.addEventListener('click', (e)=> e.stopPropagation());
/* Aynı 4 satırlık kapatma mantığı dört ayrı yerde tekrarlanıyordu;
   tek fonksiyona indirildi. */
notifPanel.addEventListener('click', ()=> closeNotifPanel());
/* Masaüstü/tablette dış overlay artık tüm ekranı kaplamadığı (statik, sayfa
   akışında sıfır boyutlu) için dışarı tıklamayı document seviyesinde yakalıyoruz. */
document.addEventListener('click', (e)=>{
  if (!notifPanel.classList.contains('open')) return;
  if (notifBtn.contains(e.target) || notifPanelInner.contains(e.target)) return;
  closeNotifPanel();
});
if (notifBackBtn) notifBackBtn.addEventListener('click', (e)=>{ e.stopPropagation(); closeNotifPanel(); });
onId('notifPanelClose', 'click', (e)=>{
  e.stopPropagation();
  closeNotifPanel();
});
notifMarkAllBtn.addEventListener('click', ()=>{
  notifications.forEach(item => { item.unread = false; });
  notifListEl.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  if (notifFilter === 'unread') renderNotifList();
  refreshNotifChrome();
});
notifFiltersEl.addEventListener('click', (e)=>{
  const chip = e.target.closest('[data-notif-filter]');
  if (!chip || chip.dataset.notifFilter === notifFilter) return;
  notifFilter = chip.dataset.notifFilter;
  renderNotifFilters();
  renderNotifList();
  refreshNotifChrome();
  notifListEl.scrollTop = 0;
});
notifListEl.addEventListener('click', (e)=>{
  const dismissBtn = e.target.closest('[data-notif-dismiss]');
  if (dismissBtn){
    e.stopPropagation();
    dismissNotification(dismissBtn.dataset.notifDismiss, dismissBtn.closest('.notif-item'));
    return;
  }
  const item = e.target.closest('.notif-item');
  if (!item) return;
  markNotifRead(item.dataset.notifId, item);
});
notifListEl.addEventListener('keydown', (e)=>{
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const item = e.target.closest('.notif-item');
  if (!item) return;
  e.preventDefault();
  markNotifRead(item.dataset.notifId, item);
});

/* ---------------- profil menüsü toggle ---------------- */
renderProfileAvatar(document.getElementById('headerProfileAvatar'));
renderProfileAvatar(document.getElementById('profileMenuAvatar'));
renderProfileAvatar(document.getElementById('sidebarUserAvatar'));
const sidebarUserNameEl = document.getElementById('sidebarUserName');
if (sidebarUserNameEl) sidebarUserNameEl.textContent = currentUser.name;
const drawerProfileNameEl = document.getElementById('drawerProfileName');
const drawerProfileAvatarEl = document.getElementById('drawerProfileAvatar');
if (drawerProfileNameEl) {
  // textContent tüm alt öğeleri (doğrulanmış rozet dahil) silip düz metinle
  // değiştirirdi; bu yüzden yalnızca isim span'ının metni güncellenir.
  const nameSpan = drawerProfileNameEl.querySelector('span:first-of-type');
  if (nameSpan) nameSpan.textContent = currentUser.name;
  else drawerProfileNameEl.textContent = currentUser.name;
}
if (drawerProfileAvatarEl) drawerProfileAvatarEl.textContent = getInitials(currentUser.name);
const profileMenuNameEl = byId('profileMenuName');
if (profileMenuNameEl) profileMenuNameEl.textContent = currentUser.name;

const profileBtn = document.getElementById('profileBtn');
const profilePanel = document.getElementById('profilePanel');
const profilePanelInner = profilePanel.querySelector('.profile-panel-inner');
function closeProfilePanel(){
  profilePanel.classList.remove('open');
  profilePanelInner.classList.remove('is-mobile-positioned');
  profileBtn.classList.remove('open');
  profileBtn.setAttribute('aria-expanded','false');
  document.body.classList.remove('profile-modal-open');
  refreshScrollLock();
}
profileBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  const isOpen = profilePanel.classList.contains('open');
  if(isOpen){
    closeProfilePanel();
  } else {
    /* Bildirim paneli açıksa önce onu kapat, ikisi aynı anda açık kalmasın. */
    closeNotifPanel();
    const rect = profileBtn.getBoundingClientRect();
    const gap = 10;
    const viewportTop = Math.round(rect.bottom + gap);
    const right = Math.max(12, Math.round(window.innerWidth - rect.right) - 15);
    setCssVars(profilePanelInner, { '--profile-mobile-top': viewportTop + 'px' });
    profilePanelInner.classList.add('is-mobile-positioned');
    setCssVars(profilePanelInner, { '--profile-dd-right': right + 'px' });
    profilePanel.classList.add('open');
    profileBtn.classList.add('open');
    profileBtn.setAttribute('aria-expanded','true');
    document.body.classList.add('profile-modal-open');
    refreshScrollLock();
  }
});
profilePanelInner.addEventListener('click', (e)=> e.stopPropagation());
profilePanel.addEventListener('click', closeProfilePanel);
document.addEventListener('click', (e)=>{
  if (!profilePanel.classList.contains('open')) return;
  if (profileBtn.contains(e.target) || profilePanelInner.contains(e.target)) return;
  closeProfilePanel();
});
document.querySelectorAll('.profile-menu-item[data-bottom-tab], .profile-menu-item[data-profile-tab]').forEach(item=>{
  item.addEventListener('click', (e)=>{
    e.preventDefault();
    closeProfilePanel();
  });
});
onId('profileLogoutBtn', 'click', closeProfilePanel);

/* ---------------- favorite (heart) toggle ---------------- */
onId('cardSections', 'click', e=>{
  const btn = e.target.closest('.poi-fav-btn');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();
  btn.classList.toggle('active');
  const card = btn.closest('.poi-card');
  const key = card?.querySelector('.poi-title')?.textContent?.trim();
  if(key){
    if(btn.classList.contains('active')) Mola360App.state.favorites.add(key);
    else Mola360App.state.favorites.delete(key);
  }
});

/* Mobilde fotoğraflarda uzun basma kaynaklı menü/drag/önizleme açılmasını engelle. */
document.addEventListener('contextmenu', e=>{
  if(e.target.closest('img')) e.preventDefault();
});
document.addEventListener('dragstart', e=>{
  if(e.target.closest('img')) e.preventDefault();
});

/* ---------------- filter dropdowns ---------------- */
Mola360App.state.filters = {
  tarih: null,
  bolge: null,
  tema: null,
  sure: null,
  tutar: null,
  siralama: null,
  popular: false
};
const filterState = Mola360App.state.filters;

const filterDefaults = {
  tarih: 'Tarih',
  bolge: 'Bölge',
  tema: 'Tema',
  sure: 'Süre',
  tutar: 'Maks. Tutar',
  siralama: 'Sırala'
};

function updateClearAllVisibility() {
  const hasActive = Object.values(filterState).some(Boolean);
  const clearBtn = document.getElementById('clearAllFilters');
  if (clearBtn) clearBtn.classList.toggle('visible', hasActive);
}

function setChipActive(key, active, value) {
  const wrap = key === 'popular'
    ? null
    : document.querySelector(`[data-dropdown="${key}"]`);

  const btn = wrap
    ? wrap.querySelector('[data-dropdown-trigger]')
    : document.getElementById('popularFilterBtn');

  if (!btn) return;

  btn.classList.toggle('filter-chip-active', active);

  if (key === 'popular') {
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  } else {
    const label = btn.querySelector(`[data-label-for="${key}"]`);
    if (label) label.textContent = active ? value : filterDefaults[key];
  }
}

function getFilterPanel(wrap) {
  return wrap && (wrap._dropdownPanel || wrap.querySelector('.filter-dropdown-panel'));
}

function getFilterOverlay(wrap) {
  return wrap && (wrap._dropdownOverlay ||
    wrap.querySelector('.filter-generic-overlay, .date-cal-overlay'));
}

function positionDesktopDropdown(trigger, panel) {
  if (!trigger || !panel) return;

  const rect = trigger.getBoundingClientRect();
  const gap = 8;

  if (isMobileViewport()) {
    panel.classList.remove('dropdown-open-up');
    panel.style.top = 'auto';
    panel.style.left = '0px';
    panel.style.right = '0px';
    panel.style.bottom = '0px';
    panel.style.width = '100%';
    panel.style.maxWidth = '100%';
    return;
  }

  panel.classList.remove('dropdown-open-up');

  const panelWidth = Math.min(
    panel.offsetWidth || 270,
    Math.max(270, window.innerWidth - 24)
  );
  const panelHeight = panel.offsetHeight || 0;

  let left = rect.left;
  let top = rect.bottom + gap;

  left = Math.max(12, Math.min(left, window.innerWidth - panelWidth - 12));

  const fitsBelow = !panelHeight ||
    (top + panelHeight <= window.innerHeight - 12);

  const fitsAbove = !panelHeight ||
    (rect.top - gap - panelHeight >= 12);

  if (!fitsBelow && fitsAbove) {
    top = rect.top - gap - panelHeight;
    panel.classList.add('dropdown-open-up');
  }

  /* Ne aşağı ne yukarı tam sığmadığında (kısa ekran) panel görünür alana
     kenetlenir; aksi hâlde alt kenarı ekranın dışında kalabiliyordu. */
  if (panelHeight) {
    top = Math.max(12, Math.min(top, window.innerHeight - panelHeight - 12));
  }

  /* Fixed + viewport coordinates: the panel is no longer geometrically
     related to .filter-group or any horizontal overflow container. */
  panel.style.left = Math.round(left) + 'px';
  panel.style.top = Math.round(top) + 'px';
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
}

function closeFilterDropdown(wrap) {
  if (!wrap) return;

  wrap.classList.remove('open');

  const panel = getFilterPanel(wrap);
  const overlay = getFilterOverlay(wrap);

  if (panel) {
    panel.classList.remove('is-open', 'dropdown-open-up');
  }

  if (overlay) {
    overlay.classList.remove('is-open');
  }

  const bar = wrap.closest('.filter-bar');
  if (bar) bar.classList.remove('filter-bar-raised');

  document.body.classList.remove('date-cal-open-lock');
  refreshScrollLock();
}

function closeAllFilterDropdowns(except = null) {
  document.querySelectorAll('.filter-dropdown-wrap.open').forEach(wrap => {
    if (except && wrap === except) return;
    closeFilterDropdown(wrap);
  });
}

function openFilterDropdown(wrap) {
  if (!wrap) return;

  const panel = wrap._dropdownPanel || wrap.querySelector('.filter-dropdown-panel');
  const trigger = wrap.querySelector('[data-dropdown-trigger]');
  const overlay = wrap._dropdownOverlay ||
    wrap.querySelector('.filter-generic-overlay, .date-cal-overlay');

  if (!panel || !trigger) return;

  closeAllFilterDropdowns(wrap);

  /* Mobilde "İptal et" için açılış anındaki seçimi sakla.
     Seçenekler panel açıkken anlık olarak chip'e yansıyabilir; iptal edilirse
     bu değer geri yüklenir. */
  if (wrap.dataset.dropdown !== 'tarih') {
    wrap._filterDraftValue = filterState[wrap.dataset.dropdown];
  }

  /* The panel is portalled once and stays under <body>. It never becomes a
     child of .filter-group, so horizontal overflow can never clip it. */
  if (!wrap._dropdownPanel) wrap._dropdownPanel = panel;
  if (overlay && !wrap._dropdownOverlay) wrap._dropdownOverlay = overlay;
  panel._m360FilterWrap = wrap;

  if (panel.parentElement !== document.body) {
    document.body.appendChild(panel);
  }
  if (overlay && overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }

  wrap.classList.add('open');
  panel.classList.add('dropdown-portal', 'is-open');
  panel.classList.remove('dropdown-desktop-anchored', 'dropdown-floating',
    'dropdown-open-up');

  if (overlay) {
    overlay.classList.add('dropdown-portal-overlay', 'is-open');
  }

  /* No overflow manipulation and no scrollLeft save/restore:
     the filter strip remains a normal horizontal scroller. */
  const bar = wrap.closest('.filter-bar');
  if (bar) bar.classList.remove('filter-bar-raised');

  document.body.classList.add('date-cal-open-lock');
  refreshScrollLock();

  requestAnimationFrame(() => {
    positionDesktopDropdown(trigger, panel);
  });

  if (wrap.dataset.dropdown === 'tarih' && typeof renderDateCalendar === 'function') {
    renderDateCalendar();
    requestAnimationFrame(() => positionDesktopDropdown(trigger, panel));
  }
}

function clearFilter(key) {
  if (key === 'popular') {
    filterState.popular = false;
    setChipActive('popular', false);
    updateClearAllVisibility();
    return;
  }

  if (!(key in filterState)) return;

  filterState[key] = null;
  if (key === 'tarih' && typeof resetDateRange === 'function') { resetDateRange(); }

  const wrap = document.querySelector(`[data-dropdown="${key}"]`);
  if (wrap) {
    const panel = getFilterPanel(wrap);
    if (panel) {
      panel.querySelectorAll('button[data-value]')
        .forEach(button => button.classList.remove('selected'));
    }

    setChipActive(key, false);
    closeFilterDropdown(wrap);
  }

  updateClearAllVisibility();
}

function clearAllFilters() {
  // Önce bütün dropdownları kapat.
  closeAllFilterDropdowns();

  // State'i tek seferde temizle.
  Object.keys(filterState).forEach(key => {
    filterState[key] = key === 'popular' ? false : null;
  });
  if (typeof resetDateRange === 'function') resetDateRange();

  // UI'daki bütün seçimleri kaldır ve chip'leri varsayılana döndür.
  Object.keys(filterDefaults).forEach(key => {
    const wrap = document.querySelector(`[data-dropdown="${key}"]`);
    if (!wrap) return;

    const panel = getFilterPanel(wrap);
    if (panel) {
      panel.querySelectorAll('button[data-value]')
        .forEach(button => button.classList.remove('selected'));
    }

    setChipActive(key, false);
  });

  setChipActive('popular', false);
  updateClearAllVisibility();
}

document.querySelectorAll('.filter-dropdown-wrap').forEach(wrap => {
  const trigger = wrap.querySelector('[data-dropdown-trigger]');
  const panel = wrap.querySelector('.filter-dropdown-panel');
  const overlay = wrap.querySelector('.filter-generic-overlay, .date-cal-overlay');
  const key = wrap.dataset.dropdown;

  if (!trigger || !panel || !key) return;

  /* Portal immediately at startup. The wrapper keeps the trigger only;
     panel/overlay are siblings of the page content under <body>. */
  wrap._dropdownPanel = panel;
  wrap._dropdownOverlay = overlay || null;

  if (panel.parentElement !== document.body) {
    document.body.appendChild(panel);
  }
  if (overlay && overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }

  panel.classList.add('dropdown-portal');
  if (overlay) overlay.classList.add('dropdown-portal-overlay');

  trigger.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();

    const isOpen = wrap.classList.contains('open');

    if (isOpen) {
      closeFilterDropdown(wrap);
    } else {
      openFilterDropdown(wrap);
    }
  });

  panel.addEventListener('click', event => {
    const option = event.target.closest('button[data-value]');
    if (!option) return;

    event.preventDefault();
    event.stopPropagation();

    const value = option.dataset.value;
    const neutral = key === 'tarih' && value === 'Tüm Tarihler';

    panel.querySelectorAll('button[data-value]')
      .forEach(button => button.classList.remove('selected'));

    if (neutral) {
      filterState[key] = null;
      setChipActive(key, false);
    } else {
      filterState[key] = value;
      option.classList.add('selected');
      setChipActive(key, true, value);
    }

    /* Mobilde jenerik filtreler (Sırala, Süre, Bölge, Tema, Maks. Tutar)
       alt sayfa (bottom sheet) olarak açılır ve seçenek dokununca hemen
       kapanmaz; kullanıcı seçimini görüp "Uygula" ile (veya karartılmış
       alanı/tutamacı kullanarak) kendisi kapatır. Masaüstünde ve tarih
       panelinde önceki davranış (seçince anında kapanma) korunur. */
    const isGenericMobileSheet = isMobileViewport() && panel.classList.contains('generic-filter-panel');
    if (!isGenericMobileSheet) {
      closeFilterDropdown(wrap);
    }
    updateClearAllVisibility();
  });
});

document.querySelectorAll('[data-generic-close]').forEach(button => {
  const key = button.dataset.genericClose;
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const wrap = document.querySelector(`.filter-dropdown-wrap[data-dropdown="${key}"]`);
    closeFilterDropdown(wrap);
  });
});

/* Jenerik filtrelerde seçim panel açıkken hazırlanır. "İptal et"
   açılıştaki değere döner; "Uygula" ise mevcut seçimi kabul eder. */
document.querySelectorAll('[data-generic-cancel]').forEach(button => {
  const key = button.dataset.genericCancel;
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();

    const wrap = document.querySelector(`.filter-dropdown-wrap[data-dropdown="${key}"]`);
    if (!wrap) return;

    const originalValue = wrap._filterDraftValue ?? null;
    filterState[key] = originalValue;

    const panel = getFilterPanel(wrap);
    if (panel) {
      panel.querySelectorAll('button[data-value]').forEach(option => {
        option.classList.toggle('selected', option.dataset.value === originalValue);
      });
    }

    setChipActive(key, Boolean(originalValue), originalValue);
    updateClearAllVisibility();
    closeFilterDropdown(wrap);
    delete wrap._filterDraftValue;
  });
});

document.querySelectorAll('[data-generic-apply]').forEach(button => {
  const key = button.dataset.genericApply;
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const wrap = document.querySelector(`.filter-dropdown-wrap[data-dropdown="${key}"]`);
    closeFilterDropdown(wrap);
    if (wrap) delete wrap._filterDraftValue;
  });
});

document.querySelectorAll('[data-generic-overlay]').forEach(overlay => {
  const key = overlay.dataset.genericOverlay;
  overlay.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const wrap = document.querySelector(`.filter-dropdown-wrap[data-dropdown="${key}"]`);
    closeFilterDropdown(wrap);
  });
});

document.querySelectorAll('[data-filter-clear]').forEach(button => {
  button.innerHTML = svg('close');

  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    clearFilter(button.dataset.filterClear);
  });
});

/* NOT: '#popularFilterBtn' ("En Popüler" chip'i) arayüzden kaldırılmıştı
   ama JS'te referansları kalmıştı. Bloğun tamamı koşullu olduğu için hata
   vermiyordu; yine de ölü kod olarak burada tutuluyor ve buton yeniden
   eklenirse çalışmaya devam eder. */
const popularBtn = document.getElementById('popularFilterBtn');
if (popularBtn) {
  popularBtn.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();

    filterState.popular = !filterState.popular;
    setChipActive('popular', filterState.popular);
    updateClearAllVisibility();

    closeAllFilterDropdowns();
  });
}

const clearAllBtn = document.getElementById('clearAllFilters');
if (clearAllBtn) {
  clearAllBtn.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    clearAllFilters();
  });
}

// Dropdown body'ye taşındığı için klasik "panel dışı" kontrolü
// artık panelin wrapper içinde olup olmamasına bakmadan çalışır.
document.addEventListener('pointerdown', event => {
  const clickedInsideDropdown =
    event.target.closest('.filter-dropdown-wrap') ||
    event.target.closest('.filter-dropdown-panel') ||
    event.target.closest('.dropdown-portal-overlay');

  if (!clickedInsideDropdown) {
    closeAllFilterDropdowns();
  }
}, true);

// ESC ile de açık dropdown kapanır.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeAllFilterDropdowns();
});

// Ekran genişliği değişirse (mobil/masaüstü arası geçiş) açık paneli
// yeniden konumlandır.
onViewportResize(() => {
  const openWrap = document.querySelector('.filter-dropdown-wrap.open');
  if (!openWrap) return;
  const panel = getFilterPanel(openWrap);
  const trigger = openWrap.querySelector('[data-dropdown-trigger]');
  if (panel && trigger) positionDesktopDropdown(trigger, panel);
});

// Sayfa kaydırılırken dropdown açık kalabilir. Panel wrapper içinde olduğu
// için masaüstünde tetikleyiciyle birlikte doğal olarak hareket eder.

updateClearAllVisibility();

/* ---------------- özel tarih aralığı takvimi (Türkçe) ---------------- */
const dateCalMonthsTR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const dateCalToday = new Date();
dateCalToday.setHours(0,0,0,0);

let dateCalViewYear = dateCalToday.getFullYear();
let dateCalViewMonth = dateCalToday.getMonth();
let dateCalRangeStart = null; // Date
let dateCalRangeEnd = null;   // Date

function dateCalKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function dateCalFormat(d) {
  return new Intl.DateTimeFormat('tr-TR', { day:'numeric', month:'short', year:'numeric' }).format(d);
}

function renderDateCalendar() {
  const grid = document.getElementById('dateCalGrid');
  const title = document.getElementById('dateCalTitle');
  if (!grid || !title) return;

  title.textContent = dateCalMonthsTR[dateCalViewMonth] + ' ' + dateCalViewYear;

  const firstDay = new Date(dateCalViewYear, dateCalViewMonth, 1);
  // Pazartesi başlangıçlı hafta indexi (0=Pt ... 6=Pz)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(dateCalViewYear, dateCalViewMonth + 1, 0).getDate();

  // Önceki ayın son günleri — griden gösterilir ama tıklanabilir (gerçek tarih).
  const prevMonthDate = new Date(dateCalViewYear, dateCalViewMonth, 0);
  const prevMonthDays = prevMonthDate.getDate();
  const prevMonthIndex = dateCalViewMonth === 0 ? 11 : dateCalViewMonth - 1;
  const prevMonthYear = dateCalViewMonth === 0 ? dateCalViewYear - 1 : dateCalViewYear;

  // Sonraki ayın ilk günleri.
  const nextMonthIndex = dateCalViewMonth === 11 ? 0 : dateCalViewMonth + 1;
  const nextMonthYear = dateCalViewMonth === 11 ? dateCalViewYear + 1 : dateCalViewYear;

  const filledCells = startOffset + daysInMonth;
  const trailingCells = (7 - (filledCells % 7)) % 7;

  function renderDay(d, day, adjacent) {
    const classes = ['date-cal-day'];
    if (adjacent) classes.push('date-cal-day-adjacent');

    const isPast = d < dateCalToday;
    const isToday = d.getTime() === dateCalToday.getTime();
    const isStart = dateCalRangeStart && d.getTime() === dateCalRangeStart.getTime();
    const isEnd = dateCalRangeEnd && d.getTime() === dateCalRangeEnd.getTime();

    if (isPast) classes.push('date-cal-day-disabled');
    if (isToday) classes.push('date-cal-day-today');
    if (isStart) classes.push('date-cal-day-selected', 'date-cal-day-range-start');
    if (isEnd) classes.push('date-cal-day-selected', 'date-cal-day-range-end');
    if (dateCalRangeStart && dateCalRangeEnd && d > dateCalRangeStart && d < dateCalRangeEnd) {
      classes.push('date-cal-day-in-range');
    }

    return `<button type="button" class="${classes.join(' ')}" data-date="${dateCalKey(d)}"${isPast ? ' disabled' : ''}>${day}</button>`;
  }

  let html = '';

  for (let i = startOffset; i > 0; i--) {
    const day = prevMonthDays - i + 1;
    const d = new Date(prevMonthYear, prevMonthIndex, day);
    html += renderDay(d, day, true);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(dateCalViewYear, dateCalViewMonth, day);
    html += renderDay(d, day, false);
  }

  for (let day = 1; day <= trailingCells; day++) {
    const d = new Date(nextMonthYear, nextMonthIndex, day);
    html += renderDay(d, day, true);
  }

  grid.innerHTML = html;
  updateDateCalFooter();
}

function updateDateCalFooter() {
  const label = document.getElementById('dateCalRangeLabel');
  const applyBtn = document.getElementById('dateCalApply');
  if (!label || !applyBtn) return;

  if (dateCalRangeStart && dateCalRangeEnd) {
    label.textContent = dateCalFormat(dateCalRangeStart) + ' – ' + dateCalFormat(dateCalRangeEnd);
    applyBtn.disabled = false;
  } else if (dateCalRangeStart) {
    label.textContent = dateCalFormat(dateCalRangeStart) + ' – bitiş tarihi seçin';
    applyBtn.disabled = true;
  } else {
    label.textContent = 'Tarih aralığı seçin';
    applyBtn.disabled = true;
  }
}

function resetDateRange() {
  dateCalRangeStart = null;
  dateCalRangeEnd = null;
  dateCalViewYear = dateCalToday.getFullYear();
  dateCalViewMonth = dateCalToday.getMonth();
  filterState.tarih = null;
  renderDateCalendar();
}

onId('dateCalPrev', 'click', () => {
  dateCalViewMonth--;
  if (dateCalViewMonth < 0) { dateCalViewMonth = 11; dateCalViewYear--; }
  renderDateCalendar();
});

onId('dateCalNext', 'click', () => {
  dateCalViewMonth++;
  if (dateCalViewMonth > 11) { dateCalViewMonth = 0; dateCalViewYear++; }
  renderDateCalendar();
});

onId('dateCalGrid', 'click', event => {
  const btn = event.target.closest('.date-cal-day[data-date]');
  if (!btn || btn.disabled) return;

  const [y,m,d] = btn.dataset.date.split('-').map(Number);
  const clicked = new Date(y, m-1, d);

  if (!dateCalRangeStart || (dateCalRangeStart && dateCalRangeEnd)) {
    // Yeni seçim başlat.
    dateCalRangeStart = clicked;
    dateCalRangeEnd = null;
  } else if (clicked < dateCalRangeStart) {
    // Başlangıçtan önceki bir tarihe tıklandıysa başlangıcı değiştir.
    dateCalRangeStart = clicked;
  } else {
    dateCalRangeEnd = clicked;
  }

  // Komşu ay günü seçildiyse takvim görünümünü o aya kaydır.
  if (btn.classList.contains('date-cal-day-adjacent')) {
    dateCalViewYear = y;
    dateCalViewMonth = m - 1;
  }

  renderDateCalendar();
});

onId('dateCalClear', 'click', event => {
  event.preventDefault();
  event.stopPropagation();
  resetDateRange();
});

onId('dateCalApply', 'click', event => {
  event.preventDefault();
  event.stopPropagation();
  if (!dateCalRangeStart || !dateCalRangeEnd) return;

  const label = dateCalFormat(dateCalRangeStart) + ' – ' + dateCalFormat(dateCalRangeEnd);
  filterState.tarih = { start: dateCalKey(dateCalRangeStart), end: dateCalKey(dateCalRangeEnd) };

  const wrap = document.querySelector('[data-dropdown="tarih"]');
  if (wrap) {
    setChipActive('tarih', true, label);
    closeFilterDropdown(wrap);
  }
  updateClearAllVisibility();
});

// Tarih popup'ı: karartılmış overlay'e veya kapatma (X) butonuna tıklanınca kapanır.
const dateCalOverlay = document.getElementById('dateCalOverlay');
if (dateCalOverlay) {
  dateCalOverlay.addEventListener('click', () => {
    const wrap = document.querySelector('[data-dropdown="tarih"]');
    if (wrap) closeFilterDropdown(wrap);
  });
}
const dateCalClose = document.getElementById('dateCalClose');
if (dateCalClose) {
  dateCalClose.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const wrap = document.querySelector('[data-dropdown="tarih"]');
    if (wrap) closeFilterDropdown(wrap);
  });
}

renderDateCalendar();

/* ---------------- auth (login/register) modal ---------------- */
const authOverlay = document.getElementById('authModalOverlay');
function openAuthModal(tab){
  /* Zaten açıkken yeniden açılırsa yalnızca sekme değişsin; eski sürümde
     her çağrıda kilit sayacı bir artıyor, tek kapatma ile sıfırlanamıyor
     ve sayfa kalıcı olarak kaydırılamaz hâle geliyordu. */
  if (!authOverlay.classList.contains('open')) {
    authOverlay.classList.add('open');
    document.body.classList.add('auth-modal-open');
    refreshScrollLock();
    /* Mobilde ekran tam sayfa açıldığı için odak diyaloğun kendisine taşınır;
       böylece klavye açılmaz, ekran okuyucu diyaloğun içine girer ve iOS
       Safari geri butonunun çevresine odak halkası çizmez. */
    const dialog = document.getElementById('authModal');
    if (dialog && isMobileViewport()) dialog.focus({preventScroll:true});
  }
  setAuthTab(tab || 'login');
}
function closeAuthModal(){
  if (!authOverlay.classList.contains('open')) return;
  authOverlay.classList.remove('open');
  document.body.classList.remove('auth-modal-open');
  refreshScrollLock();
}
/* ESC ile kapatma: daha önce hiçbir modalda yoktu. */
document.addEventListener('keydown', (e)=>{
  if (e.key !== 'Escape') return;
  if (authOverlay.classList.contains('open')) { closeAuthModal(); return; }
  if (typeof searchOverlay !== 'undefined' && searchOverlay.classList.contains('open')) { closeSearchOverlay(); return; }
  if (notifPanel.classList.contains('open')) { closeNotifPanel(); return; }
  if (profilePanel.classList.contains('open')) { closeProfilePanel(); return; }
});
function setAuthTab(tab){
  document.querySelectorAll('.auth-modal-tab').forEach(t=> t.classList.toggle('active', t.dataset.authTab===tab));
  document.querySelectorAll('.auth-modal-panel').forEach(p=> p.classList.toggle('active', p.dataset.authPanel===tab));
  /* Şifre sıfırlama ayrı bir adım; sekme çubuğu gizlenir, ekranın kendi
     başlığı ve "Giriş yap"a dönüş bağlantısı devreye girer. */
  authOverlay.classList.toggle('is-reset', tab === 'reset');
}
onId('headerRegisterBtn', 'click', ()=> openAuthModal('login'));
onId('drawerAuthBtn', 'click', ()=> openAuthModal('login'));
const sidebarAuthBtn = document.getElementById('sidebarAuthBtn');
if (sidebarAuthBtn) sidebarAuthBtn.addEventListener('click', ()=> openAuthModal('login'));

/* ---------------- masaüstü sabit menü: birincil sekme aktif durumu ---------------- */
(function initSidebarPrimaryNav(){
  const sidebarNavs = document.querySelectorAll('.sidebar-primary-nav');
  if (!sidebarNavs.length) return;
  sidebarNavs.forEach(sidebarNav => {
    sidebarNav.addEventListener('click', e=>{
      const link = e.target.closest('a[data-sidebar-tab]');
      if (!link) return;
      e.preventDefault();
      // Masaüstü ve mobil drawer aynı aktif durumu paylaşır.
      sidebarNavs.forEach(nav => nav.querySelectorAll('a[data-sidebar-tab]').forEach(a => {
        a.classList.toggle('active', a.dataset.sidebarTab === link.dataset.sidebarTab);
      }));
      // Alt menü de aynı sekmeyle senkron kalır.
      const bottomTab = document.querySelector('.bottom-tab-bar .tab-item[data-bottom-tab="' + link.dataset.sidebarTab + '"]');
      if (bottomTab) {
        document.querySelectorAll('.bottom-tab-bar .tab-item').forEach(t=> t.classList.remove('active'));
        bottomTab.classList.add('active');
      }
      // Mobil drawer içinden seçim yapıldığında menüyü kapat; kullanıcı seçimini görür.
      if (link.closest('#mobileDrawer') && typeof window.closeMola360Drawer === 'function') {
        window.closeMola360Drawer();
      }
    });
  });
})();
onId('authModalCloseBtn', 'click', closeAuthModal);
/* Mobil tam ekran başlığındaki geri oku da aynı kapatmayı çalıştırır. */
onId('authModalBackBtn', 'click', closeAuthModal);
authOverlay.addEventListener('click', e=>{ if(e.target === authOverlay) closeAuthModal(); });
document.querySelectorAll('.auth-modal-tab').forEach(tabBtn=>{
  tabBtn.addEventListener('click', ()=> setAuthTab(tabBtn.dataset.authTab));
});
document.querySelectorAll('[data-auth-switch]').forEach(link=>{
  link.addEventListener('click', e=>{ e.preventDefault(); setAuthTab(link.dataset.authSwitch); });
});

// Alt menü: tek ve güncel navigasyon kaynağı. Eski önizleme sürümlerinin
// DOM'u değiştirmesi durumunda bile doğru isim ve ikonları korur.
(function ensureBottomNavigation(){
  const nav = document.querySelector('.bottom-tab-bar');
  if (!nav) return;
  const items = [
    ['explore','Keşfet',
      '<circle cx="12" cy="12" r="9"></circle><polygon points="15 9 13 13 9 15 11 11"></polygon>',
      '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="currentColor"></circle><polygon points="15 9 13 13 9 15 11 11" fill="#fff" stroke="#fff"></polygon>'],
    ['favorites','Favorilerim',
      '<path d="M20.8 8.9c0 5.5-8.8 10.2-8.8 10.2S3.2 14.4 3.2 8.9A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 2.4Z"></path>',
      '<path d="M20.8 8.9c0 5.5-8.8 10.2-8.8 10.2S3.2 14.4 3.2 8.9A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 2.4Z" fill="currentColor" stroke="currentColor"></path>'],
    ['tickets','Biletlerim',
      '<path d="M3 8.5A2 2 0 0 1 5 6.5h14a2 2 0 0 1 2 2v2a2.2 2.2 0 0 0 0 4.4v2A2 2 0 0 1 19 19H5a2 2 0 0 1-2-2v-2a2.2 2.2 0 0 0 0-4.4z"></path><line x1="9.5" y1="6.5" x2="9.5" y2="19" stroke-dasharray="2.2 2.2"></line>',
      '<path d="M3 8.5A2 2 0 0 1 5 6.5h14a2 2 0 0 1 2 2v2a2.2 2.2 0 0 0 0 4.4v2A2 2 0 0 1 19 19H5a2 2 0 0 1-2-2v-2a2.2 2.2 0 0 0 0-4.4z" fill="currentColor" stroke="currentColor"></path><line x1="9.5" y1="6.5" x2="9.5" y2="19" stroke="#fff" stroke-width="1.5" stroke-dasharray="2.2 2.2"></line>'],
    ['account','Hesabım',
      '<circle cx="12" cy="8" r="4"></circle><path d="M4.5 20.5c0-4.1 3.6-6.5 7.5-6.5s7.5 2.4 7.5 6.5"></path>',
      '<circle cx="12" cy="8" r="4" fill="currentColor" stroke="currentColor"></circle><path d="M4.5 20.5c0-4.1 3.6-6.5 7.5-6.5s7.5 2.4 7.5 6.5Z" fill="currentColor" stroke="currentColor"></path>']
  ];
  nav.innerHTML = items.map(([key,label,outline,filled],i)=>`<a href="#" class="tab-item${i===0?' active':''}" data-bottom-tab="${key}" aria-label="${label}"><span class="icon"><svg aria-hidden="true" focusable="false" class="icon-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${outline}</svg><svg aria-hidden="true" focusable="false" class="icon-filled" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${filled}</svg></span><span>${label}</span></a>`).join('');
  nav.addEventListener('click', e=>{
    const item=e.target.closest('.tab-item');
    if(!item) return;
    e.preventDefault();
    nav.querySelectorAll('.tab-item').forEach(x=>x.classList.remove('active'));
    item.classList.add('active');
    Mola360App.state.ui.activeRoute = item.dataset.bottomTab || 'explore';
    // Sidebar/drawer menüsü de aynı sekmeyle senkron kalır.
    document.querySelectorAll('.sidebar-primary-nav a[data-sidebar-tab]').forEach(a=>{
      a.classList.toggle('active', a.dataset.sidebarTab === item.dataset.bottomTab);
    });
  });
})();
