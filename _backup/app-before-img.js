
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
function getInitials(name){
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '?';
  if(parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
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
  refresh:'<path d="M4 12a8 8 0 0 1 14-5.3L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3L4 16"/><path d="M4 20v-4h4"/>',
  apple:'<path d="M16.5 7.2c-1.1-.1-2 .6-2.6.6-.6 0-1.4-.6-2.4-.6-1.2 0-2.4.7-3 1.9-1.3 2.3-.3 5.7 1 7.6.6 1 1.4 2 2.4 2 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-1 2.3-2c.7-1 1-2 1-2.1-.1 0-2-.8-2-3 0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.4-2.7-1.5z"/><path d="M14 4.5c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1.1-.4.5-.8 1.3-.7 2.1.8.1 1.6-.4 2.1-1z"/>',
  play:'<polygon points="5 3 19 12 5 21"/>',
  ig:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/>',
  yt:'<rect x="3" y="6" width="18" height="12" rx="3"/><polygon points="10.5 9.5 15.5 12 10.5 14.5"/>',
  x:'<line x1="5" y1="5" x2="19" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/>',
  basket:'<path d="M4.5 8h15l-1.4 10.8a2 2 0 0 1-2 1.7H7.9a2 2 0 0 1-2-1.7L4.5 8z"/><path d="M8.5 8V6.2a3.5 3.5 0 0 1 7 0V8"/>',
  heart:'<path d="M12 20.5s-7.5-4.6-10-9.3C0.4 8 2 4.5 5.6 4c2.1-0.3 4 0.7 6.4 3 2.4-2.3 4.3-3.3 6.4-3C21.9 4.5 23.6 8 22 11.2c-2.5 4.7-10 9.3-10 9.3z"/>',
  moon:'<path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2z"/>',
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
  "kapadokya": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=500&h=600&q=85",
  "pamukkale": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=500&h=600&q=85",
  "bodrum": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=500&h=600&q=85",
  "efes": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=500&h=600&q=85",
  "uludag": "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=500&h=600&q=85",
  "bogaz": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=500&h=600&q=85",
  "ayder": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=500&h=600&q=85",
  "assos": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&h=600&q=85",
  "sile": "https://images.unsplash.com/photo-1478131143081-80f7f84ac63a?auto=format&fit=crop&w=500&h=600&q=85",
  "iznik": "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=500&h=600&q=85",
  "concert1": "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=500&h=350&q=85",
  "festival1": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&h=350&q=85",
  "standup1": "https://images.unsplash.com/photo-1516280440614-6697288d5d38?auto=format&fit=crop&w=500&h=350&q=85",
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
  "abant2": "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=500&h=350&q=85",
  "cunda2": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=500&h=350&q=85",
  "rafting3": "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=500&h=350&q=85",
  "paraglide3": "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=500&h=350&q=85",
  "balloon3": "https://images.unsplash.com/photo-1504198453319-5ce911bdbd5e?auto=format&fit=crop&w=500&h=350&q=85",
  "kayak3": "https://images.unsplash.com/photo-1605540436563-5bca919ae766?auto=format&fit=crop&w=500&h=350&q=85",
  "hotel4": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&h=350&q=85",
  "hotel5": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&h=350&q=85",
  "hotel6": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&h=350&q=85",
  "hotel7": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=500&h=350&q=85"
};

const top10 = [
  {img:'kapadokya',t:'Kapadokya Balon Turu',p:'2.450₺'},{img:'pamukkale',t:'Pamukkale Termal Tatili',p:'1.890₺'},
  {img:'bodrum',t:'Bodrum Tekne Turu',p:'980₺'},{img:'efes',t:'Efes Antik Kent Turu',p:'750₺'},
  {img:'uludag',t:'Uludağ Kayak Paketi',p:'3.200₺'},{img:'bogaz',t:'İstanbul Boğaz Turu',p:'650₺'},
  {img:'ayder',t:'Karadeniz Yayla Turu',p:'2.100₺'},{img:'assos',t:'Assos Gün Batımı Turu',p:'1.150₺'},
  {img:'sile',t:'Şile Kamp Deneyimi',p:'890₺'},{img:'iznik',t:'İznik Kültür Turu',p:'520₺'},
];
const CAT_ICONS = {
  "firsatlar": "data:image/webp;base64,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",
  "turlar": "data:image/webp;base64,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",
  "etkinlikler": "data:image/webp;base64,UklGRnAgAABXRUJQVlA4WAoAAAAQAAAAxwAAxwAAQUxQSBgQAAABx6egbSPnEv6wb/0AEBEZfKAU2ct9yVLlr4TDSFLDhj+IhEZO/wULpBYi+j8B1qudbaPbERGde7UPjTjNzP1YHTTrSc3PXa9HRizf+wkicy13l0BCCKS9IO1KgkOCoOxUAHN299wWSNrH3C+ikZ72VpkiHm4pJ+yogCuQZnU5IQF+v4NiI0mfZXJKIc1jrWNZZu7i0c0yI4RevSCi4UDyZo2IuJC8gzHGX+3n/4KDMVR/n5mt5WYMBm0jOYr5w776BUBETEBzpy2hJW2iXSzolAmdm3dTpTtyKemWa+FHuo4PdBlu1SWDO1VcMOkCzdkzzsIK7dts6be2bdW2bdtKqc+5mcEB9oFR3k5tw7a0DVrMe2ShVa61NTkiJgDTtm3L20i67uf7JEsyQxKHsaqamZlx1z372c52fgLDdv5E75iZubuYK8xmJ5YlWdL33gvJliwnXkfEBHBeIcCmb0QeCorkwsn0DQCbw6xQom9UarXa5OT4+HitkgVFu93aabcaze16o9Fo0yvAhxDJGKAyOz8zd2R+YXZmerJWLucRQiQXyUW7Vd/c3FhdXlleWq+3AQT4EKHICqA8d+aJs8cX56dnJkoZ4QCDQSBAYCendn19ZX3pxvVbdx7ugGR8KFBkguri2SfffP7UkcmxjISx6S96BWZXCYnO1tba5TdeevXepgnS408hGHvz19777nNz4yVsYxC7CsvIYo8GDCLUbdWvvvbCi2/cQ4FGR8+jLCB/4p/+++c3p8tyAgnLjKaNFU7NG688/fQLTRQjgyDgMZRBzH3y33505WGrmQAJwIyybQGN6y/OtesdYkSkfAopMXbpgx997+laUhIvIutBSPD1tnHl9z975iExEoiXM4ZN9X2f//gT01lBiP7uAIGEUOvW77/z102j/fJyTAVMf/SLH71QxoTYXQgbBjAZpZt//Nl6nZD3peghAo5+8qsfOB3JksSBK5tEdJdn0uYDa//OKFH76jc+OhcFEvJejGEjmeSYmJ9prW45nOIRQvCu/3utQUEAYs9GYnYBg21V58tbS803Z5xQgnP/8qvNxkMFYmC5bgQGjCqzlfXvggcLWPznb91tbNUbRgwojRHINoScTUz+67e8HUoETH3oS++bNiA6ZXgAa5lXtuxsnNs3d6RHkKXEk5977xwpgkHlwMlZaefuXWeS9GgRzL3tncexGFjWNQuBqbJ8oxECP0pkTnz4XGZiMDm2HdX6FbriURqweH4GxMBydKtUPFm17EdGkC0ey7pmYDmnpM+AsxNPzoAeFWLqX6eE7EHkmEZIFyDs2VPjJB80USh44v/vJSnYuxxYovckIVyem8XayzLK4PiZSgGxSc4sI0U2Nw06YGDiyGLuBKE1nMsOAeHJaeEDBaTykdkg4wxZYnS1llkHR0hUZscJAGmVwZkVFrRPSYDLs1WEDoYxTC7ktnqaw2A5oKSnLKfa0TEOpvpMLJQQgFcIZE6WGG1MVKZyLC8mSAhPlJMAiflhethZKJSN5QhdS3qLJAAxwpmxrGN6Vbi7gyDrCPo0uwIIS6Z0QAEyIpAoNhpKo4QQZmfbfXrdJquAAbyoDQikzoOOjEZFGEmtlY5Bdo0O1VxsSW1HARt67c5KW7ZHRaBoLddtRjQMtBD2DoAtxtaDm4jRFereaSbs0QjDwmmFraV7pFERhOfWomDwtAVnnNGKNYzQrft4JIQUaeZD2HigxiQAAuHcqbQarJ0rDzQaQqnyoTOBGdQGqUq4XzUup/AIgNhaA6akdnhb0qIUGzcYAdl5dzUFOiKVW1cmv3OLUVCx3hYoN69tqRX9xpqmkVqXt3N2V8hNzbRj+5nGy0mRXrqCtUu45hloDTm/90xec4Krf3aYwXND6Wq39cIXzM3S9++E2TW3RgakhfaPPzczaP080h5ab4nMwPnvP4sTotv64JWaLTeddIQWioVjm+GhifXF9//nIfvcTjcbkhzN4ox5RIaidnSJYYfXjpYzJo8gPUpnSzvycLL6xNGCkeG+09QpicqFTWsgQZG65zJGhht3HBDFsfIm7lCA9fm5pL5w48pUKc5vEW0CUrt12uw9l/NHIA6RTnskeWZyWWlCAPenJpL2dothb51cSu+bBGTttRNJPJazj4pJ3X9nS69uVicSo5/dIkC2wTF7lXcthijWjoLQas5JV9ITzMUMSiGBQMYozd3jfQugG5oqxOhnVAwLi45ZUSnXD7HF8tXJ8EEYHoC4QGTdDEEs/pVXC7G2Nt8VBzJjCCMD6QJchqADutX/tJnLedk8au0C6Q1hce2xsv/9UhvUuvOLN3eIU0amC1nfDtBbPuXYzbre+cGbbgBZSgupKa7Xn2pfL1m7KF2ZeiHoarK0XMNhU/rI+1O2S7a2OvUm9xg3cgydo1/EEiB4sShf3CAut7MU7ZI+Ml+I3ui8XhV3afap25Old7ydMJB07+5UAW7haoLbWEOxRZ3pd2PR+0Kz5F2y2jHFBsS7ywWAfP49KQB3uFHbOsVbZ+nDO093Qu7TLaTbmqM4e5EAUnw4DO4hbnDI1KAYfxu9nnw3waPXm3vEqYsp9Lhs4i21QgRvnkmyDyqXekDpwnlC5gORxCN1UOhWMfcUGc7eitAjWdfVt+PwsTOIw65z5Hgyd3BxPh1SRCvzzxwtxMWJxGE/LRwxXCqjw4trKE3Nk+IM9qHEy6JKE/N0p49zOJXmTBs7AQtHkA4jEx0Bi7AwW7B3H4lNg+fLzE+lAY7pJTvZtuBshSMVy48gKWcfXEnMTbAoSwOJ27VmG3AdPD2VLTJoOG5aLGWVqj3psEdpaqo6gwZAxaNAAC/HFhOTY1MMKs82GZOqE+VJa4CqDyUMVjZerpnh5qGMtlXKKsN6ki4AWaVSZdAQIPvlLtIjq5aX0QCEhBNmSADJaoATylY5xFBzgpHhGs4c4rEZjugYA4nHZtg9BXSEgCJ19VgIB0wBHGDkTmvnMRBu0O0vvyTHO69dAje++VIOny0EZ4AdWEX9my+Sw+0pQ9PSr07j68/ksdgzVa36159z+GwhgCtZjY1vPj1YLpsKIN0ZYp/YfPjVx+cKmyd2kSZL1dXtbz7AAZ7hgANmLrdY45Av9ay0WO3Kg+ijAhHcL1ipi0O+TfsurG3GYQ+yB3dgaV1pkIAPKC2O5dvE6gqDKucVcprQKHPnnrLW8iByYLnmKKHzWiPELfCezux5OiO9SpjrbWlvnqiop0hIm6lfxuZGIxjQUUL2OmbotbON62CuroYHGC3gTulxIyBNxrp6O7rW/eukUZBytunOJiGhM5B4tRlydF5hpDcKWJGjWjt/p+/To7V3Kod1vvQ0ycALG+HHQzhzihduy8K6+WKW9s8mdwn1bJQBNr+pZ4Bj608kMkeeokS78vW/GwPyn5tZYqr0elsy0vlzrygBTjz/Ur4/ck5L2UTKdsAfNyIJcNx9hn2V44TNerPNvxDCxpF+38wGqHsI5E6cvf4PJQPI/OVK9tYXcpHFZQ4CYVtLacO/WouCvilu/sH2Eap2ZYI0ZtCBY/n7GNxDpB9svtLXbMfMJiB3UMRvn1USvQLWLkTal/Y4zMj2Lme1/82Lskw0q/Y+xYoMl0O6VlH56y9bkNLD66W0HwmAkZnHwJWMvsOLRqGNH2tf1jyCl6XT2CuXedcCkb65kqeDJdtLWC//mV60m7/8JpIPkgx1ISNYyEJp7P7veNdBtL/xMN8PcYuVDctbdv5bZA/6xe+ixzGyhyttquZ3CPq6O+eSABS7QPbMDi6Uxo4vmYFeOlJOgGB6ZEXHQJaxFBZWWthqxjCy5tZiIREIO46KriULK1XKd9AQJG6XK0kh4Y5La2txvZkxuBCt+3MSIy14OELiUqnmW0LqEBFxk/E0pJwFstfyKZu43BEMQkHF/YVIhj3NYnptOfcwECTd35l+o9+SS1hKSSCnKkqt121AdvWGr+V5woNUs8QNWknv+QPvkNHWg3tzSdqbVp6iPVlx/OO+k6nXOhWDdpNnqvxD88jU6FyuBWAD8ljTO9+EzDVL9ybMIVfdEx+TmC1drpeL4fgYhD5w1LFA64VWnrB9z1FcOmtGMVt5NgWimCeSFp9AoyChc1OdAESvDyMrqhfLlkYBpcqT1b3gs6B0YSJhRgKlhYulpIHyDMyTxwlGUoA5ccLsVg4PYeE8aHQQc5WkAZ6hKM/mlkCj4J5Ctcns0GFTGpONMOgsjI2JhWoyHoq1zDHHkVJWATBCBhBn9DXKJ7Mk1CetmUMWEzIl4KwSlsEygLJilLKJ3HKXdGaU1LOMgDNkKa9l9I2sLFGaKAvT0Z8xsp5Mt6mVcT8WN6VxHGZngLS7lOMEVjC4KM4DYqdrYlOcJt2ugZeJlneMBuNSdBZFkZekpWgTZNaqs6LdLRiiIFcZKTYY/NFXBnsAW4A0yKYGSMbYorHcxUNAFFlQgq8+/powDbLbNYyV0cZymyF6gSmWJEHw9vGHOAAcI+e1WF/tMqTJUg2QIB17x2nSEPqDDHazaNzbREOpOyy1apDGL1yoyPs2032ciI2XV8D7MjwAiljCSp25C2aYWQXdwiYpLV9fR+y7Q8pBrinInfKVIjxYY5y0q8m2XrneljkYQgDxYuir4ubdZngYKYCzXMr9knznmas2BzUUYwiNEvWbK2RpsPq0pU2vyeovvbiJDk4xIP2NV19tBhliNjB4yagUWnr6tY7EQQ4DhWQ1X//DG7xPBlxdDSkOMGDn26+/vIp49Aog17tHT9cw2pMFc3FAzKjRBqeUFTf+9F8QPE5ZFI04cqLsJA1UN7aELVPG7d/8ZYmXkWMrvNOsLCyUjHaRXqmHDY3zbP2vP3+hqdf/kfOGqAdQ2t6qzMyXEggQgGPC6pZNlOpP//wfm8ggJw79LMvFg61ifj63ESC9Qi4bJvJs848//t0yYYOcV67qAYHUXdvujM+ORUqSQyRH7rt/+VP7pgWYg/eYvoLu+nKjPFXNCPYgkKUMdh7bV//6rEXIFgfTeSkMGu6u31/djokf+v+ATYsHm0yd5eeevT8OyMYc0CAKjhsdpM1bt5Y/8t4zY3aSQAfAJEW0V159/savvgW+aFas6BKA4eJagGgvH3nqYx9680LFhQk0YglU7qy99sy17gSgdCr1sLK6HhJQO/WWd73zqcUaLgBiACNrACNjQ2Sh+tW/v7o1CUgGtqwbEcKWwkTl2FNvfsuTJ+erYNuAAJm+svrYfaxwSG6vX3/l2oNqgLAZLF4U1wCCuAVIKlA+e+rYmadOnD45VcoC7GRshEWvQFjKwKnbWL938/V1Jkogkdj/lVBxC1kgbIipidmTZ06dOrkwWSmXS1mw95Q63dTZfri5vrR07U5MlgEFTgxdRNCK8wIBIrgBsgAENpBVxqbnZqdnpqenp6rlsTyllIruzk5zp7XVbDdW1jbrjfZOAiQnzPBFQK6FFQ2yc59egWyDgsjz6lipnJmi6BbtTqdIHcIpARlgJ4QZrpe6BZwkVlA4IDIQAAAQTACdASrIAMgAPmEqkEWkIqGVukZ0QAYEoIdNvzMg3djPrWNNdnyf/I/JToAucPBf5U9M4hDtb/k/cz8JPWB+mv+Z7g/6zdLrzB/0P/OfsT7x//F/XT3c/3b1AP2N60D0CP49/hPTm9lj+x/8/9rfah///WAdPf2a/wf4zfqB4PZGffC3wcAX5Pw19yZxp8yT+xf931b9ET1p7A/8p/pf+8/vHtMezH0J/12S+FBfYmViHWN/JvX8iGNMxOtGQof246d/kxPezplHW6Xu7feyqUt2B/SwSLmqImZgsa/Tez6QlRJZphw/E60U3y5ymtnKgOFwYZ7yEzG4CQcCwMFecbIETRq6ucNznFhcAxgc3caFv3uAMyv2GoFny1HlvnTpsj60ap+3uT8dGJMBkZObYenc0Dr/VSQH7m5/XFRwLI1HhV6On3v/nflyncFoXfkSa7nyaJ+KxST0S/XUn24idO5kvTMlTYcErGy2Tm3NonDgj3oj2EJFR8AhLL5e0JqJr2aYDrv9pvQc2G8CNk+c149hrCL6NVhhK5qNqw/Q3kaNzkoiauC/724tamWUBMNWvdziCDsLvj6yCb+CjDHKOZytrGrWwKHN4RAFsmxJrvi7DOol0NoQGYN98GWHyAJ0ig/41iVwbEetyJ+qHry7qWv5lajNl+EDBXaow1o0s4AM8sBbfoWlzrcKQWtXcFxsnRS2Z2OUzWA0SzTr4NMMnbNup16H8rb+yMi3JNhBAZn6u7e2eN23ATyD8XXc1xozwRm8Ypjbk/clcaLRyCwNmKpu2rhZkgEmDwitB8BgfMxvuQCCpjU9QAD+6U+JL+2CJh0HpL9zC0Hgb3PHi3Ey0oHhqFhMeHU1K4SKFtjsd8IslGskQ9B79g4ATkmxrp+6oU50EhhDDuUuPRRTlzLNhIWyzIiDxbICcRuMCah61WJoom/R3Ve954UZeQBNMMjhPnozf7YX7iw6Cafz5b4o+s/r+1+vPGljv9DI+iVfFn/8T0LTuedDXBMUX9QNtfMLPrwKk4/BQ9Q7xOUPzaT094zHyqzI+n/wNqIitrXwMJ1IYlEVU3/QeaMOvothDju1dh+z6AWroQyZwQK0k2wbJuZ/w+0+wlXuQHnTFNCTRgX9hPXcp9/X/Q2WNv2JW6Q9jG4AAj5PQ0BLrhp6uQpRYO03jnJD2d51MvCCqWBE4SHNxkg+B+oUZFYbUbmvxOvXv/zy+2BDfpc+SRs7S8KPTQ29364dlYenJDTRioaZyUbGXQYlZp12ISQTRc95/+a0/LAP/+NC//4y1//+NEBqr8xSKv+2C9/2wn4tN/qr5fRzi4sKdDLacH7TYQPtZSKwsMUxx/0mP47S7ywEQ/f69cQnxda2hjs04O7Y04IKI1fyYEF09d8E7lHJHAACCuBSU2m3uMuQjP0QAPKQ8eEKGxRMGg8nNOF1eXIp/ooxZeYFgseKPu1aVGiccjo3AuK+46lMzrvfWZHBjCZuJrLSyVKO5IStOwkkS+/XyY8RnBOXlLbqo14F96I06dSCojr4FJDcuI4KknLMkadqrzphZYXmz6/idZh0Rhg1ipuyPPzieNVp2pjSgAO7tSBX84QuvyiW/z9C5z6S/GbnoCkODKh6EeP0mChpFr/7uCld8xfz/i9wx9hYeLTXhyyz6ef3DYyalLVI3poQJ8A15aGYAZRazAy7+qTkqf/xlMNBDTBm4GgV/4Y1u1i3kCkQZf8kpyZEB6lqGHqgSGp0qJESXV7/7OvDqbafVx/auSlEDtA3zsnIMMZRzxSFoZQx4+evDvQv94Psqh/Ag6fvLPdYJzaBhVIyjScmVCn40rpmBWYRm14hYv9J1e84BV+VU+pAb5ML3sclpdm0PSgVInSnJkFo0NQ9w6Pw+ofYR5wkmb09aQCOPEGJ6BcDh7Nx5Dc3deto6sDAcP3MjY47535PfsUtuvnHd9CG5AF44s4E6TuIYcN4cefQXGIlYjkVAP6aFTgX0m3mwIbFPTf+atwpIsSWo7LBgso96ZIuVCkwhWRalAvoxrNfrAglM/cfmZaXH6cKMppAX68fYFqbFXuPKizK0fzk6FBVZiTsGuI+c2/AJIUMJaInUSWkujNdx7+guiAO6uZFf3sT7ywjF9lQtMZl5E1jmQvFGQwkWBQjjS4UJafRdPBPr6Ytw76jf8jjYJkYKUw0UU1KcWzPn+qfspvMLkJ+zvdEAEdWd0Bf6uXTs55vAN/GwiV8ymGmiHbJI6gIOEHTwtjGmHHzS2YNH5J0IiWRl0+gNtM8dKH7f57tyyDGIbhC5Bm3BEUGRXHwL3+C3OBVPIK1DkId/lC3yYAL8praJJ78sLTR7Kp4cqUGDFcIiydIP/qYVAFIoXMQr76016zT1DPRbbazNScfLuUD4HfP7fLAv6/e74W6FFDNPtnOCUHK/fnndhwGvsPq8Bo3RRFd78kY19BxNwXAAW6R2xf4HuudqWg8MiXkNY8kdhsjLxZ9Ab/QJyBgU5ePPih2RP3EVs4dejlfwAe+eD6+qmqW/PrIPp05AgyAoIJt2KFZndfIBILrDuig76eQYiUaKSsH9Dcts+T9S0eWbVhGOuOPa51QtELzX313x0/+0fdVv0Qv3K73IWu7+Sk3u0kpHqKTrm0zc60Cj5F2DLtHJhTQEwExdDlAIxmhfu7KfjYCDYT517BYx0RR33FTKJ1ITyUzouNXxp4FvMvNhT7K3i3hrpw//BcgaKOlW2Omt6/TTLRl+mPMmsLrV+T6ka2UM3coL4FmyI1xqC0z1yC/PoZuBS17MSJOqHlknDzFsM004CROA9Y8xY/ElBDvgZt1caCz2Ir6qXRvxiy8lfxYR6XC0KL9C3o6Bf76OWwrKSINWJuC5tbdOgSGoDXhDvaKX+7lOkjFpUcYMcfhbgk2inmrtnxTzkkhVXCtePbOxt46dcXQooOmrpiJbprzY0nxc/MJvIsUnjSmOGWfTn4OqvnuL8KZa5KbwuHwWYAHsdjQUtFcriWCjYG1ZUkALElsEX/sC4fP/ITCl0ypAkzVkK4Ee03d5T2lv4voXue8eNVustqMaiMiCkWBFgtrXyamgk4to/EHi8li+q8LJiDtGEBh/WgtL65bb6G3INiTY+PGdTbCsNKLxePLmE6A2KJ75Vav7nXmFweiGqmw5cLD0NUl8G0AYLFHsrNbLUGzUKAYp0Njvy7oac5Oo0CBedEMmCIvEsyfL3bxCV9+cLDbxjL6AbwTHAisbpTujEgxrZ2ure0WchFvs9y1o+GsyiPmgSckMy7cTAufXt4aY0mS8W+hcoRew/qsSRp4G9lpUPXlxqEWnYZx0Sh169YnDDujO99BFNfF1GOyeS/JeFHe7VWDCSuTb8OhOow91G0ZPD8Hu9eimjO7RR1l0LXsptbYtfSXR8dAFU6UtO9yyZkR76UU2v2fNjPnb/9OetJC8XXjvyTP/4uVJOtUxXmPhXKixfJ6cmdTUvoyIytmn3NOVHoAwhy5ATnUE9kEk9ef13pBiGwMXaW35Z2s9uNB7JcPR9XTDKRgrgCdypHZFEs/SaiFRJfQ2U/60Ii6X506YlOzUvWh2dGxDnh5f7Szu5P7ChpKvyXZhWNnZ7sRStEPO3pq7I9QALnWftMzjNRl6t8RlieTxbVzRxy0zz546czkSayMmAIEgOB3v7YLeZwiXin6p6s1u0juEtGF1MxTLCkT2f8ChZlfORdGSvKcR9HujjhobV+X0l6f9C011eb8kIqr+CQLmtPbqcBF9hPN6+QvDhuUUHjvH/m3Cyzolhmqn1/hcgyT76m1MP932PcCqIeXWlXziLupsHb8bDx+XYyqXvc82jPbX0ev5pVXIe7oqdrp0nDMOTWarifuXtm5ZUnPm2F7EVSqbCoJStSZmxmNXAAw9MH2+qloaD+w5cz18VAuO7pst1+frKBYXzKDbOom1Ey2Gb7digOJhn9+jh412bFi/a2rTVpsE/aK6QVkxAm5DkCgccaB3/QanOnfLtQfbaqeaHA7ortfFrQ/ttD5d0ov6hTkd35ULUUOdYTNPIrHqvM42aAO7EYR1wolfv/FM78/z5hU44DJlrFUn3NAxwSvQDHt2k07r4gMJGe/qaZnor41nphjKRPTIVeb84+HKC8BCSyNB6Qv4MpAypiLEkaos1ndD4HOG131qvwUWuJk/J7sAzgNGk2i/13ks2nhotwG/VinfYFIXd4I3DVKJIDepHTPLO/fVLuyMQ2utdDdKdpOVahuwfuIOt+BB5BHTh5toF3EotiBlOdKj7ATzt71VVFVjlt98ccvgQt0w4TFDn/GjwPLlwrSuBkI/iBOVLxsF7j65kx8NB3LlpywMv+RLcpcXL8MjYI+WFlj7E2E7YfF/aRfxMxnoPT70WEggH+Qihdtzpw2f+t0iBmnQX+IfXOn3/0IaiPmZ+qs9aYklK9a41G+2YIwVvQlfBjLY0YxzbLpEyLpXXCe/IDK4JSu/f4WOn/mwTmwEN63JMiO68TDo3T+kmcu8eyV8y24fYyKxN6u7Kl6ocf//0fABo9YtFSxm+k+BMxjb2Dcp10Z1Jb0Ektxmsj5vPz1kdcE/VOkbIJC9DQvx5nF8TeggBiV4tzypfZxn6TCr8SYCkKFvpgAOWr0WQzcHOyQamsnpUuOYYBMsUvRAftmV71qsW/WN8aIzy3Q2C/i96IBujYPMR7HOs3vDEtae5cxn12acxDJIdXOwHgsc0lH5ykT55MocSTzHXX1IAJgO4o2FVZRiE2IC8q3/dKPLAgomt9Wke43gCZyHncflNKnv8ZSZvzDX8XpdrQzbaoznb8wK2wkTHR1cbOPyLtwzHj1RY60l0ZIymJZtO6Pl8SG+zO/do8clZBsUR4mpR6Wvpxp7qnkQ1oUTZxQNfTojGSddyw01hDrsBsXf//+L4EtGW+NyUUm3ud2/mlMq+uGz8xwVxqEaYh5s6gM3f9GC5LpRzWdSif8fS+olijJ5fasQXJNJh1cdGzv8dHbTfuBQ5NkYzTWYeHDGn2eAUAuMRYtZNMJDpLTZyCFpIbcupRZrr2cFl1ItOBVjphmp9AXTii0zD8bSv6AhxxiyiSQ3Srky5yG4dDgJ24LI3wOkcPyZAOAWt0sSMWORLapFlpvxiVuM/ltOH4/HsaR/++YD68aXGtHQXSwD//gUTy+jEWOkkmHlVJ/40dPgsLN0p0kAASPuXYAfFrzfT3PBZD04/r77dMMA9Pm7VjeHkNJ8cJhuFvM9wykH3aOnm7HGE046fFm3Qm4vpYwFlWkL4XOVm597nDoisPbwRtdoeWAyBeH+OmLy3TAGY3cOWdT/AuozheUpOPaaCKcitQjumzVVH4vUTz5xSd0ol7VCI8GAGeIdyjiydgfUR1QvL4cU21xEfd07HsOUdBVLaluw6Vh1WBNvOwZCVaDcjIZ7ab0rmTQGT9LNE5DtcxI2VwW8LpBBClfvmb9KfZf3lDbI9f7arHAB9LspI/OLiV2hUubWiOiRHx7yVJpJ5XKUE1U/KmeFym9xhWCHTt4CAHf+UyAAAA=",
  "oteller": "data:image/webp;base64,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",
  "aktiviteler": "data:image/webp;base64,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",
  "mekanlar": "data:image/webp;base64,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",
  "kuponlarim": "data:image/webp;base64,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",
  "yenieklenenler": "data:image/webp;base64,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",
  "buhafta": "data:image/webp;base64,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",
}


const categories = [
  {name:'Fırsatlar', icon:'percent', img:'firsatlar'},
  {name:'Turlar', icon:'compass', img:'turlar'},
  {name:'Etkinlikler', icon:'ticket', img:'etkinlikler'},
  {name:'Oteller', icon:'home', img:'oteller'},
  {name:'Aktiviteler', icon:'compass', img:'aktiviteler'},
  {name:'Mekanlar', icon:'mapPin', img:'mekanlar'},
  {name:'Kuponlarım', icon:'wallet', img:'kuponlarim'},
  {name:'Yeni Eklenenler', icon:'star', img:'yenieklenenler'},
  {name:'Bu Hafta', icon:'calendar', img:'buhafta'},
];

// Arama ekranında gösterilecek kategori listesi yalnızca bu dört kategoriden oluşur.
const searchCategories = [
  {name:'Turlar', icon:'compass'},
  {name:'Etkinlikler', icon:'ticket'},
  {name:'Oteller', icon:'home'},
  {name:'Aktiviteler', icon:'compass'},
  {name:'Mekanlar', icon:'mapPin'},
];

// Arama ekranında örnek olarak gösterilen son aramalar.
const recentSearchTerms = [
  'Bursa konserleri',
  'Uludağ otelleri',
  'Bursa aktiviteleri'
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
  {title:'Popüler Etkinlikler', titleIcon:'flame', meta1Icon:'clock', meta2Label:'En yakın:', items:[
    {img:'concert1', badges:['Konser'], rating:'4.8', reviews:'64+', title:'Bursa Kültürpark Konserleri', meta1:'Kültürpark · 20:30', meta2:'Bu Cuma', priceMain:'320'},
    {img:'festival1', badges:['Festival'], rating:'4.6', reviews:'40+', title:'Uludağ Kar Festivali', meta1:'Uludağ · Tüm gün', meta2:'13 Aralık, Pazar', priceMain:'250'},
    {img:'standup1', badges:['Stand Up'], sponsored:true, title:'Efsane 90\'lar Gecesi', meta1:'BAOB Sahne · 21:00', meta2:'21 Eylül, Pazartesi', priceMain:'210'},
    {img:'coffee1', badges:['Festival'], rating:'4.5', reviews:'18+', title:'Bursa Kahve Festivali', meta1:'Sukaypark · 11:00', meta2:'11 Eylül, Cuma', priceMain:'180'},
  ]},
  {title:'Yaklaşan Etkinlikler', titleIcon:'calendar', meta1Icon:'clock', meta2Label:'Etkinlik:', items:[
    {img:'concert2', badges:['Konser'], rating:'4.9', reviews:'52+', title:'Sonbahar Caz Akşamları', meta1:'Merinos AKM · 20:00', meta2:'12 gün sonra', priceMain:'400'},
    {img:'theatre1', badges:['Tiyatro'], rating:'4.7', reviews:'96+', title:'7 Kocalı Hürmüz Müzikali', meta1:'Açıkhava Tiyatrosu', meta2:'5 gün sonra', priceMain:'1150'},
    {img:'market1', badges:['Pazar'], rating:'4.4', reviews:'12+', title:'Cumalıkızık Yöresel Pazar', meta1:'Cumalıkızık · 10:00', meta2:'3 gün sonra', priceMain:'50'},
    {img:'run1', badges:['Spor'], rating:'4.6', reviews:'30+', title:'Bursa Gece Koşusu', meta1:'İznik Gölü Kıyısı', meta2:'9 gün sonra', priceMain:'150'},
  ]},
  {title:'Konaklamalı Turlar', titleIcon:'moon', meta1Icon:'moon', meta2Label:'En yakın:', items:[
    {img:'kapadokya2', badges:['Kültür','Yurt İçi'], rating:'4.8', reviews:'210+', title:'Kapadokya 3 Gece Turu', meta1:'3 Gece 4 Gün · Bursa Hareketli', meta2:'20 Ekim, Salı', priceMain:'3399'},
    {img:'karadeniz2', badges:['Doğa'], sponsored:true, title:'Karadeniz Yaylaları Turu', meta1:'4 Gece 5 Gün · Uçaklı', meta2:'2 Kasım, Pazar', priceMain:'5100'},
    {img:'ege2', badges:['Balayı'], rating:'4.9', reviews:'88+', title:'Ege Adaları Balayı Kaçamağı', meta1:'2 Gece 3 Gün · Bursa Hareketli', meta2:'15 Eylül, Salı', priceMain:'2990'},
    {img:'dogu2', badges:['Doğu Ekspresi'], rating:'4.6', reviews:'150+', title:'Turistik Doğu Ekspresi Turu', meta1:'5 Gece 6 Gün · Trenli', meta2:'8 Aralık, Salı', priceMain:'6750'},
  ]},
  {title:'Günübirlik Turlar', titleIcon:'sun', meta1Icon:'sun', meta2Label:'En yakın:', items:[
    {img:'iznik2', badges:['Günübirlik'], rating:'4.5', reviews:'70+', title:'İznik Gölü ve Antik Kent', meta1:'Günübirlik · Bursa Çıkışlı', meta2:'Bu Pazar', priceMain:'450'},
    {img:'sapanca2', badges:['Günübirlik'], sponsored:true, title:'Sapanca ve Masukiye Turu', meta1:'Günübirlik · Bursa Çıkışlı', meta2:'Bu Cumartesi', priceMain:'480'},
    {img:'abant2', badges:['Günübirlik'], rating:'4.4', reviews:'55+', title:'Abant Gölü Doğa Yürüyüşü', meta1:'Günübirlik · Kahvaltı Dahil', meta2:'12 Ekim, Pazar', priceMain:'520'},
    {img:'cunda2', badges:['Günübirlik'], rating:'4.7', reviews:'64+', title:'Cunda Adası ve Ayvalık', meta1:'Günübirlik · Tekne Dahil', meta2:'19 Ekim, Pazar', priceMain:'690'},
  ]},
  {title:'Aktiviteler', titleIcon:'compass', meta1Icon:'clock', meta2Label:'En yakın:', items:[
    {img:'rafting3', badges:['Su Sporları'], rating:'4.8', reviews:'44+', title:'Köprülü Kanyon Rafting', meta1:'Yarım Gün · Ekipman Dahil', meta2:'Bu hafta s', priceMain:'850'},
    {img:'paraglide3', badges:['Macera'], rating:'4.9', reviews:'120+', title:'Ölüdeniz Yamaç Paraşütü', meta1:'20 dk Uçuş · Fotoğraf Dahil', meta2:'Her gün', priceMain:'1450'},
    {img:'balloon3', badges:['Macera'], sponsored:true, title:'Kapadokya Sıcak Hava Balonu', meta1:'1 Saat Uçuş · Kahvaltı Dahil', meta2:'Her sabah', priceMain:'2990'},
    {img:'kayak3', badges:['Kış Sporu'], rating:'4.5', reviews:'33+', title:'Uludağ Kayak Dersi', meta1:'2 Saat · Ekipman Dahil', meta2:'Hafta içi', priceMain:'750'},
  ]},
  {title:'Oteller', titleIcon:'home', meta1Icon:'mapPin', meta2Label:'Müsait:', items:[
    {img:'hotel4', badges:['Her Şey Dahil'], rating:'9.2', reviews:'340+', title:'Sealight Resort Antalya', meta1:'Antalya, Kemer · Denize Sıfır', meta2:'Bu hafta', priceMain:'2100', unit:'/gece'},
    {img:'hotel5', badges:['Şehir Oteli'], rating:'8.9', reviews:'210+', title:'Divan Bursa', meta1:'Osmangazi, Bursa · Merkezi', meta2:'Bugün', priceMain:'1450', unit:'/gece'},
    {img:'hotel6', badges:['Termal'], sponsored:true, title:'Termal Vadi Resort', meta1:'Yalova · Termal Havuz Dahil', meta2:'Bu ay', priceMain:'1590', unit:'/gece'},
    {img:'hotel7', badges:['Butik'], rating:'9.4', reviews:'96+', title:'Cumalıkızık Konak Otel', meta1:'Bursa, Cumalıkızık · Tarihi Doku', meta2:'Bu hafta', priceMain:'1750', unit:'/gece'},
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

    const track = wrap.querySelector('.h-scroll');
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

    leftBtn.addEventListener('click', () => {
      track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', () => {
      track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' });
    });

    track.addEventListener('scroll', update, {passive:true});
    onViewportResize(update);
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
document.getElementById('top10Scroll').innerHTML = top10.map((it,i)=>`
  <a class="top10-card" href="#">
    <div class="top10-media">
      <span class="top10-rank">${i+1}</span>
      <img src="${cardImages[it.img] || ('https://picsum.photos/seed/'+it.img+'/236/296')}" alt="${it.t}">
    </div>
    <div class="top10-info"><h3>${it.t}</h3></div>
  </a>`).join('');

document.getElementById('catScroll').innerHTML = categories.map(c=>`
  <a class="cat-item" href="#">
    <span class="cat-icon-wrap"><img class="cat-icon-img" src="${CAT_ICONS[c.img]}" alt="${c.name}"></span>
    <span>${c.name}</span>
  </a>`).join('');
updateCategoryLayout();
onViewportResize(updateCategoryLayout);

document.getElementById('cardSections').innerHTML = cardSections.map(sec=>`
  <section class="section">
    <div class="section-head"><h2>${sec.title}</h2><a class="see-all" href="#">Tümünü Gör <span class="icon">${svg('chevRight')}</span></a></div>
    <div class="hscroll-wrap">
    <div class="h-scroll">
      ${sec.items.map(it=>`
        <article class="poi-card">
          <div class="poi-media">
            <img src="${cardImages[it.img] || ('https://picsum.photos/seed/'+it.img+'/400/300')}" alt="">
            <div class="poi-badges">${it.badges.map(b=>`<span class="poi-badge">${b}</span>`).join('')}</div>
            <button class="poi-fav-btn" type="button" aria-label="Favorilere ekle"><span class="icon">${svg('heart')}</span></button>
          </div>
          ${it.sponsored
            ? `<div class="poi-status-badge sponsored">Sponsorlu</div>`
            : `<div class="poi-status-badge"><span class="icon">${svg('star')}</span>${it.rating}<span class="count">(${it.reviews})</span></div>`}
          <div class="poi-body">
            <h3 class="poi-title">${it.title}</h3>
            <p class="poi-meta-row"><span class="icon">${svg(sec.meta1Icon)}</span><span class="poi-meta-text">${it.meta1}</span></p>
            <p class="poi-meta-row"><span class="icon">${svg('calendar')}</span><strong>${sec.meta2Label}</strong><span class="poi-meta-text">${it.meta2}</span></p>
          </div>
          <div class="poi-price-bar">
            <span class="poi-price"><span class="main">${it.priceMain}</span><span class="decimals">.00</span><span class="currency">TL</span>${it.unit ? `<span class="unit">${it.unit}</span>` : ''}</span>
            <button class="poi-cart-btn"><span class="icon">${svg('basket')}</span></button>
          </div>
        </article>`).join('')}
    </div>
    <button class="hscroll-arrow left" type="button" data-dir="left" aria-label="Geri"><span class="icon">${svg('chevLeft')}</span></button>
    <button class="hscroll-arrow right" type="button" data-dir="right" aria-label="İleri"><span class="icon">${svg('chevRight')}</span></button>
    </div>
  </section>`).join('');

initHscrollArrows();

/* ---------------- mouse / touch drag ile yatay kaydırma ----------------
   Tüm yatay kaydırılabilir alanlarda kartın/şeridin üzerine basılı tutup
   sürükleyerek kaydırma yapılır. Mouse wheel ile yatay kaydırma eklenmez. */
function initDragScroll() {
  document.querySelectorAll('.h-scroll, .cat-scroll, .filter-group').forEach(track => {
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
      if (track.setPointerCapture) track.setPointerCapture(pointerId);
    });

    track.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
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
overlay.addEventListener('click', toggleDrawer);

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

function normalizeSearchText(value) {
  return String(value || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getSearchCategoryIcon(name) {
  const iconMap = {
    'Fırsatlar':'percent',
    'Etkinlikler':'ticket',
    'Oteller':'home',
    'Aktiviteler':'compass',
    'Mekanlar':'mapPin',
    'Kuponlarım':'wallet',
    'Yeni Eklenenler':'star',
    'Bu Hafta':'calendar'
  };
  return iconMap[name] || 'compass';
}

function getSearchCardType(sectionTitle) {
  if (sectionTitle.includes('Otel')) return 'Otel';
  if (sectionTitle.includes('Aktivit')) return 'Aktivite';
  if (sectionTitle.includes('Tur')) return 'Tur';
  return 'Etkinlik';
}

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

document.getElementById('headerSearchTrigger').addEventListener('click', openSearchOverlay);
document.getElementById('headerSearchTrigger').addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openSearchOverlay(); } });
document.getElementById('mobileSearchTrigger').addEventListener('click', openSearchOverlay);
document.getElementById('mobileSearchTrigger').addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openSearchOverlay(); } });
document.getElementById('searchOverlayBack').addEventListener('click', closeSearchOverlay);

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

document.getElementById('searchHomeContent').addEventListener('click', (e)=>{
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

/* ---------------- notification panel toggle ---------------- */
const notifBtn = document.getElementById('notifBtn');
const notifPanel = document.getElementById('notifPanel');
const notifPanelInner = notifPanel.querySelector('.notif-panel-inner');
function closeNotifPanel(){
  notifPanel.classList.remove('open');
  notifPanelInner.classList.remove('is-mobile-positioned');
  notifBtn.setAttribute('aria-expanded','false');
  document.body.classList.remove('notif-modal-open');
  refreshScrollLock();
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
    const rect = notifBtn.getBoundingClientRect();
    const gap = 10;
    const viewportTop = Math.round(rect.bottom + gap);
    const right = Math.max(12, Math.round(window.innerWidth - rect.right) - 15);
    const maxH = Math.max(240, window.innerHeight - viewportTop - 20) + 'px';
    /* Mobil (ortalanmış, kararmış popup) için */
    setCssVars(notifPanelInner, { '--notif-mobile-top': viewportTop + 'px', '--notif-mobile-max-height': maxH });
    notifPanelInner.classList.add('is-mobile-positioned');
    /* Masaüstü/tablet: dikey konum artık header ile aynı sabit sistemde
       (CSS'te top:66px, arama ekranındaki gibi); burada sadece panelin
       zil ikonunun altına denk gelmesi için yatay (sağ) boşluk hesaplanır. */
    setCssVars(notifPanelInner, { '--notif-dd-right': right + 'px' });
    notifPanel.classList.add('open');
    notifBtn.setAttribute('aria-expanded','true');
    document.body.classList.add('notif-modal-open');
    refreshScrollLock();
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
document.getElementById('notifPanelClose').addEventListener('click', (e)=>{
  e.stopPropagation();
  closeNotifPanel();
});
document.getElementById('notifMarkAll').addEventListener('click', ()=>{
  document.querySelectorAll('.notif-item.unread').forEach(item=>{
    item.classList.remove('unread');
  });
  document.querySelector('.notif-badge')?.classList.add('is-hidden');
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
document.getElementById('profileMenuName').textContent = currentUser.name;

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
document.getElementById('profileLogoutBtn').addEventListener('click', closeProfilePanel);

/* ---------------- favorite (heart) toggle ---------------- */
document.getElementById('cardSections').addEventListener('click', e=>{
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

document.getElementById('dateCalPrev').addEventListener('click', () => {
  dateCalViewMonth--;
  if (dateCalViewMonth < 0) { dateCalViewMonth = 11; dateCalViewYear--; }
  renderDateCalendar();
});

document.getElementById('dateCalNext').addEventListener('click', () => {
  dateCalViewMonth++;
  if (dateCalViewMonth > 11) { dateCalViewMonth = 0; dateCalViewYear++; }
  renderDateCalendar();
});

document.getElementById('dateCalGrid').addEventListener('click', event => {
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

document.getElementById('dateCalClear').addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  resetDateRange();
});

document.getElementById('dateCalApply').addEventListener('click', event => {
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
}
document.getElementById('headerRegisterBtn').addEventListener('click', ()=> openAuthModal('login'));
document.getElementById('drawerAuthBtn').addEventListener('click', ()=> openAuthModal('login'));
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
document.getElementById('authModalCloseBtn').addEventListener('click', closeAuthModal);
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
