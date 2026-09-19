/* ===== site-loader ===== */
(function () {
  const loader = document.getElementById('siteLoader');
  if (!loader) return;

  // Loader tam 3 saniye ekranda kalır; ardından kısa bir fade-out ile kapanır.
  const hideLoader = () => {
    loader.classList.add('is-hidden');
    window.setTimeout(() => loader.remove(), 400);
  };

  window.setTimeout(hideLoader, 3000);
})();

/* ===== thumb-autohide ===== */
/* Yüzen kaydırma tutamaçları için ortak "kaybolma" davranışı.
   Hem sidebar hem sayfa tutamacı bunu kullanır.
   Uyanma: kaydırma, tutamacın üzerine gelme, sağ kenara yaklaşma.
   Uyuma: hareketsizlikten belirli süre sonra — ancak imleç üzerindeyken
   veya sürükleme sürerken asla. */
window.m360AutoHideThumb = function (thumb, options) {
  const opts = options || {};
  const delay = opts.delay || 1100;
  const isNear = typeof opts.isNear === 'function' ? opts.isNear : null;

  let timer = 0;
  let held = false;

  function sleep() {
    if (!held) thumb.classList.add('is-idle');
  }

  function wake() {
    thumb.classList.remove('is-idle');
    clearTimeout(timer);
    if (!held) timer = setTimeout(sleep, delay);
  }

  /* hold(true): sürükleme veya imleç üzerindeyken uykuya dalmasın. */
  function hold(on) {
    held = !!on;
    if (held) {
      clearTimeout(timer);
      thumb.classList.remove('is-idle');
    } else {
      wake();
    }
  }

  thumb.addEventListener('pointerenter', function () { hold(true); });
  thumb.addEventListener('pointerleave', function () { hold(false); });

  /* Tutamaç uykudayken pointer-events:none olduğu için üzerine gelinerek
     uyandırılamaz; bu yüzden yakınlık kontrolü pencere düzeyinde yapılır. */
  if (isNear) {
    window.addEventListener('pointermove', function (e) {
      if (isNear(e)) wake();
    }, { passive: true });
  }

  wake();
  return { wake: wake, hold: hold };
};

/* ===== page-scrollbar ===== */
/* Ana ekranın (viewport) yüzen kaydırma tutamacı. Sidebar'daki ile aynı
   mantık, ama hedef eleman yerine belgenin kendisi kaydırılıyor ve
   tutamaç sabit başlığın altından başlıyor. Yalnızca masaüstü/tablet
   genişliğinde; mobilde işletim sisteminin kendi çubuğu kullanılır. */
(function () {
  const DESKTOP_MIN = 681;
  const MIN_HEIGHT = 40;

  const thumb = document.createElement('div');
  thumb.className = 'page-scroll-thumb';
  thumb.setAttribute('aria-hidden', 'true');

  let queued = false;
  let headerIsFixed = null;
  let autoHide = null;

  function attach() {
    if (!thumb.parentElement && document.body) document.body.appendChild(thumb);
  }

  /* getComputedStyle pahalı; her karede değil yalnızca ölçü değişince. */
  function measureChrome() {
    const header = document.querySelector('.site-header');
    headerIsFixed = !!(header && getComputedStyle(header).position === 'fixed');
  }

  function metrics() {
    const doc = document.documentElement;
    const header = document.querySelector('.site-header');
    const areaTop = (headerIsFixed && header)
      ? header.getBoundingClientRect().height
      : 0;
    const viewH = doc.clientHeight;
    return {
      areaTop,
      areaH: Math.max(0, viewH - areaTop),
      viewH,
      contentH: doc.scrollHeight,
      scrollable: doc.scrollHeight - viewH
    };
  }

  function render() {
    queued = false;
    if (!thumb.parentElement) return;

    /* Sayfa kilitliyken (çekmece/modal açık) body position:fixed olur ve
       scrollHeight çöker. Tutamacı son konumunda dondur. */
    if (document.body.classList.contains('m360-scroll-locked')) return;

    if (window.innerWidth < DESKTOP_MIN) {
      thumb.classList.remove('is-visible');
      return;
    }

    const m = metrics();
    if (m.areaH <= 0 || m.scrollable <= 1) {
      thumb.classList.remove('is-visible');
      return;
    }

    const h = Math.max(MIN_HEIGHT, Math.round(m.areaH * m.viewH / m.contentH));
    const maxTop = m.areaH - h;
    const y = maxTop > 0 ? (document.documentElement.scrollTop / m.scrollable) * maxTop : 0;
    thumb.style.height = h + 'px';
    thumb.style.transform = 'translateY(' + (m.areaTop + y) + 'px)';
    thumb.classList.add('is-visible');
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  function refresh() { measureChrome(); schedule(); }

  function onScroll() {
    if (autoHide) autoHide.wake();
    schedule();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('orientationchange', refresh, { passive: true });

  /* Sayfa yüksekliği görsel yüklenmesi, bölüm açılması veya filtre
     değişimiyle değişebilir. */
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(schedule);
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);
  }

  /* Tutamacı sürükleyerek kaydırma. */
  thumb.addEventListener('pointerdown', function (e) {
    const m = metrics();
    const h = thumb.getBoundingClientRect().height;
    const maxTop = m.areaH - h;
    if (m.scrollable <= 1 || maxTop <= 0) return;

    e.preventDefault();
    const startY = e.clientY;
    const startTop = document.documentElement.scrollTop;
    thumb.classList.add('is-dragging');
    if (autoHide) autoHide.hold(true);
    try { thumb.setPointerCapture(e.pointerId); } catch (err) {}

    function move(ev) {
      const next = startTop + ((ev.clientY - startY) / maxTop) * m.scrollable;
      window.scrollTo(0, Math.max(0, Math.min(next, m.scrollable)));
    }
    function end(ev) {
      thumb.classList.remove('is-dragging');
      if (autoHide) autoHide.hold(false);
      try { thumb.releasePointerCapture(ev.pointerId); } catch (err) {}
      thumb.removeEventListener('pointermove', move);
      thumb.removeEventListener('pointerup', end);
      thumb.removeEventListener('pointercancel', end);
    }
    thumb.addEventListener('pointermove', move);
    thumb.addEventListener('pointerup', end);
    thumb.addEventListener('pointercancel', end);
  });

  function boot() {
    attach();
    /* İmleç sağ kenara yaklaşınca tutamaç belirsin ve yakalanabilsin. */
    if (window.m360AutoHideThumb) {
      autoHide = window.m360AutoHideThumb(thumb, {
        isNear: function (e) { return e.clientX >= window.innerWidth - 28; }
      });
    }
    refresh();
  }

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });

  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refresh).catch(function () {});
  }
})();

/* ===== sidebar-scrollbar ===== */
/* Masaüstü sidebar'ı için yüzen kaydırma tutamacı.
   Yerleşik kaydırma çubuğu 6px yer ayırdığı için içerik sağ kenara
   ulaşamıyor, lacivert profil kartının yanında beyaz bir şerit kalıyordu.
   Yerleşik çubuk CSS ile gizlendi; konum ve boy burada hesaplanıp
   içeriğin üzerinde duran bir tutamaca yazılıyor. */
(function () {
  function setup() {
    const sidebar = document.getElementById('desktopSidebar');
    const scrollEl = sidebar && sidebar.querySelector('.desktop-sidebar-scroll');
    if (!sidebar || !scrollEl) return false;
    if (sidebar.querySelector('.desktop-sidebar-thumb')) return true;

    const MIN_HEIGHT = 40;
    const thumb = document.createElement('div');
    thumb.className = 'desktop-sidebar-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    sidebar.appendChild(thumb);

    let queued = false;
    let sidebarRight = 0;

    /* İmleç sidebar'ın sağ kenarına yaklaşınca tutamaç belirsin.
       Kenar konumu her karede değil, yalnızca ölçü değişince okunur. */
    const autoHide = window.m360AutoHideThumb
      ? window.m360AutoHideThumb(thumb, {
          isNear: function (e) {
            return sidebarRight > 0
              && e.clientX >= sidebarRight - 28
              && e.clientX <= sidebarRight + 4;
          }
        })
      : null;

    function metrics() {
      const areaTop = scrollEl.offsetTop;
      const areaH = scrollEl.clientHeight;
      const contentH = scrollEl.scrollHeight;
      return { areaTop, areaH, contentH, scrollable: contentH - areaH };
    }

    function measureEdge() {
      sidebarRight = sidebar.getBoundingClientRect().right;
    }

    function render() {
      queued = false;
      const m = metrics();
      if (m.areaH <= 0 || m.scrollable <= 1) {
        thumb.classList.remove('is-visible');
        return;
      }
      const h = Math.max(MIN_HEIGHT, Math.round(m.areaH * m.areaH / m.contentH));
      const maxTop = m.areaH - h;
      const y = maxTop > 0 ? (scrollEl.scrollTop / m.scrollable) * maxTop : 0;
      thumb.style.height = h + 'px';
      thumb.style.transform = 'translateY(' + (m.areaTop + y) + 'px)';
      thumb.classList.add('is-visible');
      measureEdge();
    }

    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(render);
    }

    function onScroll() {
      if (autoHide) autoHide.wake();
      schedule();
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(schedule);
      ro.observe(scrollEl);
      Array.prototype.forEach.call(scrollEl.children, function (child) { ro.observe(child); });
    }

    /* "Daha fazla göster" gibi açılır bölümler içerik yüksekliğini değiştirir.
       Tutamaç sidebar'ın çocuğu, scrollEl'in içinde değil; bu yüzden kendi
       stil güncellemesi gözlemciyi tekrar tetiklemiyor. */
    if (window.MutationObserver) {
      new MutationObserver(schedule).observe(scrollEl, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    /* Tutamacı sürükleyerek kaydırma. */
    thumb.addEventListener('pointerdown', function (e) {
      const m = metrics();
      const h = thumb.getBoundingClientRect().height;
      const maxTop = m.areaH - h;
      if (m.scrollable <= 1 || maxTop <= 0) return;

      e.preventDefault();
      const startY = e.clientY;
      const startTop = scrollEl.scrollTop;
      thumb.classList.add('is-dragging');
      if (autoHide) autoHide.hold(true);
      try { thumb.setPointerCapture(e.pointerId); } catch (err) {}

      function move(ev) {
        scrollEl.scrollTop = startTop + ((ev.clientY - startY) / maxTop) * m.scrollable;
      }
      function end(ev) {
        thumb.classList.remove('is-dragging');
        if (autoHide) autoHide.hold(false);
        try { thumb.releasePointerCapture(ev.pointerId); } catch (err) {}
        thumb.removeEventListener('pointermove', move);
        thumb.removeEventListener('pointerup', end);
        thumb.removeEventListener('pointercancel', end);
      }
      thumb.addEventListener('pointermove', move);
      thumb.addEventListener('pointerup', end);
      thumb.addEventListener('pointercancel', end);
    });

    schedule();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(schedule).catch(function () {});
    }
    return true;
  }

  if (!setup()) {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  }
})();

/* ===== sticky-filterbar ===== */
/* Filtre çubuğu, mobilde arama kutusunun hemen altına yapışır.
   Arama kutusunun yüksekliği sabit yazılmaz; ölçülüp --m360-search-h
   değişkenine yazılır. Böylece font boyutu, güvenli alan veya kutunun
   içeriği değişse bile çubuk her zaman tam altında kalır. */
(function () {
  const searchBar = document.querySelector('.mobile-search-bar');
  const filterBar = document.querySelector('.filter-bar');
  if (!filterBar) return;

  const root = document.documentElement;
  let stuck = false;
  let queued = false;

  function syncHeight() {
    /* Kutu mobilde display:block, masaüstünde display:none -> yükseklik 0. */
    const h = searchBar ? searchBar.getBoundingClientRect().height : 0;
    root.style.setProperty('--m360-search-h', Math.round(h) + 'px');
  }

  function syncStuck() {
    queued = false;
    /* Kilitliyken sticky devre dışı; o sırada durumu değiştirmeyelim. */
    if (document.body.classList.contains('m360-scroll-locked')) return;

    const limit = parseFloat(getComputedStyle(filterBar).top);
    const isStuck = window.innerWidth <= 680
      && Number.isFinite(limit)
      && filterBar.getBoundingClientRect().top <= limit + 0.5;

    if (isStuck !== stuck) {
      stuck = isStuck;
      filterBar.classList.toggle('is-stuck', stuck);
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(syncStuck);
  }

  function refresh() { syncHeight(); schedule(); }

  refresh();

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('orientationchange', refresh, { passive: true });

  /* Arama kutusunun yüksekliği sonradan değişirse (font yüklenmesi,
     klavye, içerik) otomatik yakala. */
  if (window.ResizeObserver && searchBar) {
    new ResizeObserver(refresh).observe(searchBar);
  }

  /* Web fontları geç yüklenirse yükseklik kayabilir. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refresh).catch(function () {});
  }
})();

/* ===== hero-slider ===== */
(function () {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
  const dots   = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
  if (slides.length < 2) return;

  const INTERVAL = 5000;
  const SWIPE_MIN = 40;          /* yatay kaydirmanin sayilmasi icin en az mesafe */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = Math.max(0, slides.findIndex(el => el.classList.contains('active')));
  let timer = null;

  function render() {
    slides.forEach((el, i) => {
      const on = i === index;
      el.classList.toggle('active', on);
      /* Gorunmeyen slaytlar ekran okuyucuya ve klavyeye kapali kalsin. */
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
      el.querySelectorAll('a, button').forEach(node => {
        if (on) node.removeAttribute('tabindex');
        else node.setAttribute('tabindex', '-1');
      });
    });
    dots.forEach((dot, i) => {
      const on = i === index;
      dot.classList.toggle('active', on);
      if (on) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function goTo(next) {
    const total = slides.length;
    index = ((next % total) + total) % total;
    render();
  }

  function stop() {
    if (timer) { window.clearInterval(timer); timer = null; }
  }

  function start() {
    stop();
    if (reduceMotion || document.hidden) return;
    timer = window.setInterval(() => goTo(index + 1), INTERVAL);
  }

  /* Kullanici mudahale ettiginde sayac bastan baslasin. */
  function restart() { start(); }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', event => {
      event.preventDefault();
      goTo(i);
      restart();
    });
  });

  /* Yatay kaydirma. Hero'da touch-action: pan-y oldugu icin yatay
     hareket zaten sayfayi kaydirmaz; preventDefault gerekmez. */
  let startX = 0, startY = 0, tracking = false;

  hero.addEventListener('touchstart', event => {
    if (!event.touches || event.touches.length !== 1) { tracking = false; return; }
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  hero.addEventListener('touchend', event => {
    if (!tracking) return;
    tracking = false;
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    /* Dikey hareket baskinsa kaydirma sayilmaz. */
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return;
    goTo(index + (dx < 0 ? 1 : -1));
    restart();
  }, { passive: true });

  hero.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });

  /* Masaustunde uzerine gelince dursun. Dokunmatikte tek dokunus da
     mouseenter uretebildigi icin yalnizca gercek hover destegi varsa
     baglanir; aksi halde otomatik gecis kalici olarak duruyordu. */
  if (window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
  }

  /* Sekme arka plana dustugunde bos yere donmesin. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  render();
  start();
})();

/* ===== image-fallback =====
   Onceki surum dinleyicileri DOMContentLoaded'da tek tek her <img>'e
   bagliyordu. Iki sorunu vardi:
     1) 404 yaniti cogu zaman DOMContentLoaded'dan ONCE donuyor; dinleyici
        takildiginda hata coktan gecmis oluyor ve kart tarayicinin kirik
        gorsel simgesiyle kaliyordu.
     2) Kartlarin bir kismi JS ile sonradan uretiliyor; o <img>'lere
        dinleyici hic baglanmiyordu.
   Cozum: yakalama (capture) asamasinda TEK bir dinleyici. error olayi
   baloncuklanmaz ama capture asamasinda document'e ulasir; bu sayede
   sonradan eklenen gorseller de kapsanir. Ayrica sayfa yuklendiginde
   zaten bozulmus olanlar taranir.

   Yedek gorsel artik uzaktaki bir fotograf degil, yerel ve notr bir
   yer tutucu: olu bir URL'in yerine alakasiz bir fotograf koymak
   sorunu gizliyordu. */
(function () {
  const PLACEHOLDER =
    'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#eef1f7"/><stop offset="1" stop-color="#dfe4ee"/>' +
      '</linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#g)"/>' +
      '<g fill="none" stroke="#9aa5bd" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="152" y="116" width="96" height="72" rx="8"/>' +
      '<circle cx="176" cy="140" r="8"/>' +
      '<path d="M152 172l28-24 20 16 16-12 32 24"/>' +
      '</g></svg>'
    );

  function uygula(img) {
    if (!img || img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';
    img.src = PLACEHOLDER;
  }

  /* error baloncuklanmaz; capture asamasinda yakalanir. */
  document.addEventListener('error', function (event) {
    const hedef = event.target;
    if (hedef && hedef.tagName === 'IMG') uygula(hedef);
  }, true);

  /* Dinleyici baglanmadan once bozulmus olanlari topla. */
  function taramaYap() {
    document.querySelectorAll('img').forEach(img => {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) uygula(img);
    });
  }
  document.addEventListener('DOMContentLoaded', taramaYap);
  window.addEventListener('load', taramaYap);
})();

/* ===== filter-sheet-drag ===== */
(function () {
  const MOBILE_MAX = 680;
  /* Kapanma esigi: bu kadar asagi cekilirse ya da hizli bir savurma
     yapilirsa cekmece kapanir. */
  const CLOSE_DISTANCE = 110;
  const CLOSE_VELOCITY = 0.55;      /* px / ms */
  const START_THRESHOLD = 5;        /* yon anlasilana kadar beklenen mesafe */
  const SNAP_MS = 240;
  /* Cekmecenin icindeki tek kayan katman (CSS ile ayni). */
  const SCROLLER_SELECTOR = '.generic-filter-options, .date-cal-grid';

  function isMobile() {
    return window.matchMedia('(max-width: ' + MOBILE_MAX + 'px)').matches;
  }

  function getOverlay(panel) {
    const wrap = panel._m360FilterWrap;
    return wrap ? (wrap._dropdownOverlay ||
      wrap.querySelector('.filter-generic-overlay, .date-cal-overlay')) : null;
  }

  function resetSheet(panel) {
    panel.classList.remove('m360-sheet-dragging', 'm360-sheet-snapping');
    panel.style.removeProperty('--m360-sheet-drag');
    panel.style.removeProperty('touch-action');
    const overlay = getOverlay(panel);
    if (overlay) overlay.classList.remove('m360-overlay-closing');
  }

  document.querySelectorAll('.filter-dropdown-panel').forEach(panel => {
    /* Tek bir surukleme durumu: touch ve pointer olaylari ayni state'i
       paylasir, boylede iki yol ayni anda tetiklenip catismaz. */
    const st = {
      id: null,          /* aktif parmak/pointer kimligi */
      armed: false,      /* dokunuldu, yon henuz belli degil */
      dragging: false,
      startY: 0,
      lastY: 0,
      lastT: 0,
      velocity: 0,
      dragY: 0,
      scroller: null,
      blockClickUntil: 0
    };

    function begin(id, clientY, target) {
      if (!isMobile() || !panel.classList.contains('is-open')) return;
      if (st.id !== null) return;

      st.id = id;
      st.armed = true;
      st.dragging = false;
      st.startY = clientY;
      st.lastY = clientY;
      st.lastT = Date.now();
      st.velocity = 0;
      st.dragY = 0;
      /* Parmak kayan listenin uzerindeyse, surukleme yalnizca liste
         en ustteyken (scrollTop 0) devreye girer; aksi halde normal
         liste kaydirmasi calisir. Liste disindan (tutamac, baslik,
         footer) her zaman suruklenebilir. */
      st.scroller = target && target.closest
        ? target.closest(SCROLLER_SELECTOR)
        : null;
      if (st.scroller && !panel.contains(st.scroller)) st.scroller = null;
    }

    /* @return true -> olayin varsayilan davranisi engellenmeli */
    function move(id, clientY) {
      if (st.id !== id) return false;

      const dy = clientY - st.startY;
      const now = Date.now();
      const dt = now - st.lastT;
      if (dt > 0) st.velocity = (clientY - st.lastY) / dt;
      st.lastY = clientY;
      st.lastT = now;

      if (st.armed && !st.dragging) {
        /* Yukari hareket ya da liste ortasindan baslayan hareket:
           surukleme degil, normal kaydirma. */
        if (dy < 0 || (st.scroller && st.scroller.scrollTop > 0)) {
          st.armed = false;
          st.id = null;
          return false;
        }
        if (Math.abs(dy) < START_THRESHOLD) {
          /* Yon asagi ve liste en ustte: esik dolana kadar tarayicinin
             kendi lastik efektini bastir, aksi halde iOS kaydirmayi
             baslatinca surukleme hic devreye giremiyor. */
          return dy > 0;
        }
        st.armed = false;
        st.dragging = true;
        panel.style.touchAction = 'none';
        panel.classList.add('m360-sheet-dragging');
      }

      if (!st.dragging) return false;

      st.dragY = Math.max(0, dy);
      panel.style.setProperty('--m360-sheet-drag', st.dragY + 'px');
      return true;
    }

    function end(id) {
      if (st.id !== id) return;
      const wasDragging = st.dragging;
      const dragY = st.dragY;
      const velocity = st.velocity;

      st.id = null;
      st.armed = false;
      st.dragging = false;
      st.dragY = 0;

      if (!wasDragging) return;

      /* Surukleme bittiyse hemen ardindan gelen "click" yutulur ki
         parmagin bittigi yerdeki secenek yanlislikla secilmesin. */
      st.blockClickUntil = Date.now() + 400;

      const wrap = panel._m360FilterWrap;
      const shouldClose = dragY >= CLOSE_DISTANCE || velocity >= CLOSE_VELOCITY;

      panel.classList.remove('m360-sheet-dragging');
      panel.classList.add('m360-sheet-snapping');
      panel.style.removeProperty('touch-action');

      if (shouldClose && wrap && typeof closeFilterDropdown === 'function') {
        /* Tam panel yuksekligi kadar asagi kaydir: ekranin altindan
           temizce cikar, karartma da ayni surede soner. */
        const height = panel.getBoundingClientRect().height || window.innerHeight;
        const overlay = getOverlay(panel);
        if (overlay) overlay.classList.add('m360-overlay-closing');
        panel.style.setProperty('--m360-sheet-drag', (height + 40) + 'px');
        window.setTimeout(function () {
          closeFilterDropdown(wrap);
          resetSheet(panel);
        }, SNAP_MS);
      } else {
        /* Esik asilmadi: cekmece yerine geri otursun. */
        panel.style.setProperty('--m360-sheet-drag', '0px');
        window.setTimeout(function () { resetSheet(panel); }, SNAP_MS);
      }
    }

    panel.addEventListener('touchstart', function (event) {
      if (!event.touches || event.touches.length !== 1) return;
      const touch = event.touches[0];
      begin('t' + touch.identifier, touch.clientY, event.target);
    }, { passive: true });

    panel.addEventListener('touchmove', function (event) {
      if (!event.touches || !event.touches.length) return;
      const touch = event.touches[0];
      if (move('t' + touch.identifier, touch.clientY)) event.preventDefault();
    }, { passive: false });

    panel.addEventListener('touchend', function (event) {
      const touch = (event.changedTouches && event.changedTouches[0]) || null;
      end(touch ? 't' + touch.identifier : st.id);
    }, { passive: true });

    panel.addEventListener('touchcancel', function (event) {
      const touch = (event.changedTouches && event.changedTouches[0]) || null;
      end(touch ? 't' + touch.identifier : st.id);
    }, { passive: true });

    /* Touch olaylari olmayan dokunmatik cihazlar (bazi Windows/Android
       tarayicilari) icin ayni mantik pointer olaylariyla. */
    const hasTouch = 'ontouchstart' in window;

    panel.addEventListener('pointerdown', function (event) {
      if (hasTouch || event.pointerType === 'mouse') return;
      begin('p' + event.pointerId, event.clientY, event.target);
      if (panel.setPointerCapture) {
        try { panel.setPointerCapture(event.pointerId); } catch (e) {}
      }
    });

    panel.addEventListener('pointermove', function (event) {
      if (hasTouch || event.pointerType === 'mouse') return;
      if (move('p' + event.pointerId, event.clientY)) event.preventDefault();
    });

    function pointerFinish(event) {
      if (hasTouch || event.pointerType === 'mouse') return;
      end('p' + event.pointerId);
    }

    panel.addEventListener('pointerup', pointerFinish);
    panel.addEventListener('pointercancel', pointerFinish);

    panel.addEventListener('click', function (event) {
      if (Date.now() < st.blockClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  });

  document.addEventListener('click', function () {
    document.querySelectorAll('.filter-dropdown-panel:not(.is-open)').forEach(resetSheet);
  }, true);
})();
/* ===== cift dokunusla yakinlastirma ===== */
/* Olculdu: `touch-action: manipulation` iOS Safari'de bu hareketi
   durdurmuyor. Anasayfada hareketin olmamasinin sebebi o degil, viewport
   etiketindeki `user-scalable=no` -- ama o etiket IKI PARMAKLA
   yakinlastirmayi da kapatiyor ve gozu iyi gormeyen kullaniciyi sayfadan
   disliyor. Bu yuzden tur sayfalarina kopyalanmadi.

   Burada yalnizca IKINCI dokunusun varsayilan davranisi iptal ediliyor:
   cift dokunus kapaniyor, pinch aynen calisiyor.

   Iki parmaga hic dokunulmuyor -- ekranda baska parmak varsa veya ayni
   anda birden fazla parmak kalkiyorsa dinleyici erken cikiyor.

   TEKRAR listesi: touchend'de preventDefault cagirmak o dokunusun
   click'ini de yutar. Ayni noktaya hizli iki kez basmanin ANLAMLI oldugu
   kontroller (kisi sayisi tuslari, form alanlari, acik/kapali dugmeler)
   bu yuzden disarida tutuluyor. Bag ve galeri hucresi gibi seylerde
   ikinci dokunus zaten bir sey yapmadigi icin orada yutmak serbest --
   ki galeri seridi tam da yakinlastirmanin hedef aldigi blok. */
(function () {
  const ARA = 350;   // iki dokunus arasi en fazla sure (ms)
  const KAYMA = 30;  // iki dokunus arasi en fazla uzaklik (px)
  const TEKRAR = 'input, textarea, select, [contenteditable], [data-step], [aria-pressed]';

  let sonZaman = 0;
  let sonX = 0;
  let sonY = 0;

  document.addEventListener('touchend', function (olay) {
    if (olay.touches.length || olay.changedTouches.length !== 1) return;

    const dokunus = olay.changedTouches[0];
    const simdi = olay.timeStamp;
    const cift = simdi - sonZaman <= ARA &&
      Math.abs(dokunus.clientX - sonX) <= KAYMA &&
      Math.abs(dokunus.clientY - sonY) <= KAYMA;

    sonZaman = simdi;
    sonX = dokunus.clientX;
    sonY = dokunus.clientY;

    if (!cift) return;

    const hedef = olay.target;
    if (hedef && hedef.closest && hedef.closest(TEKRAR)) return;

    olay.preventDefault();
  }, { passive: false });
})();
