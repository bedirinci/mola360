/* ===== site-loader ===== */
(function () {
  const loader = document.getElementById('siteLoader');
  if (!loader) return;

  /* Yalnızca ilk girişte: daha önce görüldüyse index.html'deki satır içi
     betik öğeyi zaten kaldırdı. Buraya geldiysek ilk giriş; bayrak hemen
     yazılır ki açılış sırasında yenilenen sayfa ekranı tekrar göstermesin.
     Depo kapalıysa (gizli pencere) ekran her girişte gösterilir. */
  try { localStorage.setItem('mola360.acilisGoruldu', '1'); } catch (e) { /* depo yok */ }

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

/* ===== alt çekmeceler: aşağı çekince kapanma (ortak) =====
   Sitedeki bütün alt çekmeceler (anasayfa süzgeçleri, liste süzgeçleri
   ve sıralaması, "Ne zaman, kaç kişi?", dil/para, rezervasyon çekmecesi
   ve özeti)
   aynı davranıyor:
   tutamaçtan, başlıktan ya da en üstteki listeden aşağı çekilince parmağı
   izliyor; yeterince çekilince (ya da hızlı savrulunca) aşağı kayıp
   kapanıyor, çekilmezse yerine oturuyor.

   Her çekmece CEKMECELER'de bir satır: hangi öğe, ne zaman açık, içindeki
   kayan liste, karartma katmanı ve nasıl kapanacağı. Kapatma çekmecenin
   KENDİ kapatma düğmesiyle yapılıyor; odak, adres ve kilit gibi işleri
   sahibi yürütüyor, burada tekrar yazılmıyor.

   Çekmeceler sayfa kurulurken ya da açılırken sonradan çizilebildiği
   için dinleyiciler ilk dokunuşta bağlanıyor. */
(function () {
  /* Kapanma eşiği: bu kadar aşağı çekilirse ya da hızlı bir savurma
     yapılırsa çekmece kapanır. */
  const CLOSE_DISTANCE = 110;
  const CLOSE_VELOCITY = 0.55;      /* px / ms */
  const START_THRESHOLD = 5;        /* yön anlaşılana kadar beklenen mesafe */
  const SNAP_MS = 240;

  const dugmeyeBas = (secici) => (panel) => {
    const dugme = panel.querySelector(secici) || document.querySelector(secici);
    if (dugme) dugme.click();
  };

  /* sinif: true → ortak sürükleme stili (style.css, .m360-cekmece).
     Anasayfa süzgeç panelinin kendi stili var (transform). */
  const CEKMECELER = [
    { secici: '.filter-dropdown-panel', genislik: 680, sinif: false,
      acik: (p) => p.classList.contains('is-open'),
      kaydirici: '.generic-filter-options, .date-cal-grid',
      katman: (p) => {
        const wrap = p._m360FilterWrap;
        return wrap ? (wrap._dropdownOverlay || wrap.querySelector('.filter-generic-overlay, .date-cal-overlay')) : null;
      },
      kapat: (p) => { if (p._m360FilterWrap && typeof closeFilterDropdown === 'function') closeFilterDropdown(p._m360FilterWrap); } },
    { secici: '.lst-filters', genislik: 1024, sinif: true,
      acik: (p) => p.classList.contains('is-open'),
      kaydirici: '.lst-filters-body',
      katman: () => document.getElementById('lstSheetOverlay'),
      kapat: dugmeyeBas('#lstSheetClose') },
    { secici: '.lst-plan-panel', genislik: 680, sinif: true,
      acik: (p) => !p.hidden,
      kaydirici: 'self',
      katman: () => document.getElementById('lstPlanKatman'),
      kapat: dugmeyeBas('[data-plan-kapat]') },
    { secici: '.lst-sort-panel', genislik: 1024, sinif: true,
      acik: (p) => !p.hidden,
      kaydirici: 'self',
      katman: () => document.getElementById('lstSortKatman'),
      kapat: dugmeyeBas('[data-sirala-kapat]') },
    { secici: '.tercih-cekmece', genislik: null, sinif: true,
      acik: (p) => p.classList.contains('open'),
      kaydirici: 'self',
      katman: () => document.getElementById('tercihKatman'),
      kapat: dugmeyeBas('[data-tercih-kapat]') },
    { secici: '.tour-sheet-panel', genislik: 680, sinif: true,
      acik: (p) => !!p.closest('.tour-sheet.open'),
      kaydirici: 'self',
      katman: (p) => p.closest('.tour-sheet'),
      kapat: dugmeyeBas('[data-sheet="close"]') },
    { secici: '.rez-cekmece-panel', genislik: 1024, sinif: true,
      acik: (p) => !!p.closest('.rez-cekmece.is-acik'),
      kaydirici: '.rez-cekmece-govde',
      katman: (p) => p.parentElement.querySelector('.rez-cekmece-katman'),
      kapat: dugmeyeBas('.rez-cekmece-kapat') }
  ];

  const durumlar = new WeakMap();

  function genislikUygun(ayar) {
    return !ayar.genislik || window.matchMedia('(max-width: ' + ayar.genislik + 'px)').matches;
  }

  function bul(hedef) {
    if (!hedef || !hedef.closest) return null;
    for (const ayar of CEKMECELER) {
      const panel = hedef.closest(ayar.secici);
      if (panel && ayar.acik(panel) && genislikUygun(ayar)) return { panel, ayar };
    }
    return null;
  }

  function resetSheet(panel, ayar) {
    panel.classList.remove('m360-sheet-dragging', 'm360-sheet-snapping');
    panel.style.removeProperty('--m360-sheet-drag');
    panel.style.removeProperty('touch-action');
    const katman = ayar.katman(panel);
    if (katman) katman.classList.remove('m360-overlay-closing');
  }

  function durumu(panel, ayar) {
    let st = durumlar.get(panel);
    if (st) return st;
    /* Tek bir sürükleme durumu: touch ve pointer olayları aynı durumu
       paylaşır, böylece iki yol aynı anda tetiklenip çatışmaz. */
    st = {
      id: null,          /* aktif parmak/pointer kimliği */
      armed: false,      /* dokunuldu, yön henüz belli değil */
      dragging: false,
      startY: 0,
      lastY: 0,
      lastT: 0,
      velocity: 0,
      dragY: 0,
      scroller: null,
      blockClickUntil: 0
    };
    durumlar.set(panel, st);
    if (ayar.sinif) panel.classList.add('m360-cekmece');

    panel.addEventListener('touchmove', function (event) {
      if (!event.touches || !event.touches.length) return;
      const touch = event.touches[0];
      if (move(panel, st, 't' + touch.identifier, touch.clientY)) event.preventDefault();
    }, { passive: false });
    const touchBitti = function (event) {
      const touch = (event.changedTouches && event.changedTouches[0]) || null;
      end(panel, ayar, st, touch ? 't' + touch.identifier : st.id);
    };
    panel.addEventListener('touchend', touchBitti, { passive: true });
    panel.addEventListener('touchcancel', touchBitti, { passive: true });

    panel.addEventListener('pointermove', function (event) {
      if (hasTouch || event.pointerType === 'mouse') return;
      if (move(panel, st, 'p' + event.pointerId, event.clientY)) event.preventDefault();
    });
    const pointerBitti = function (event) {
      if (hasTouch || event.pointerType === 'mouse') return;
      end(panel, ayar, st, 'p' + event.pointerId);
    };
    panel.addEventListener('pointerup', pointerBitti);
    panel.addEventListener('pointercancel', pointerBitti);

    /* Sürükleme bittiyse hemen ardından gelen "click" yutulur ki parmağın
       bittiği yerdeki seçenek yanlışlıkla seçilmesin. */
    panel.addEventListener('click', function (event) {
      if (Date.now() < st.blockClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
    return st;
  }

  function begin(panel, ayar, st, id, clientY, target) {
    if (st.id !== null) return;
    st.id = id;
    st.armed = true;
    st.dragging = false;
    st.startY = clientY;
    st.lastY = clientY;
    st.lastT = Date.now();
    st.velocity = 0;
    st.dragY = 0;
    /* Parmak kayan listenin üzerindeyse sürükleme yalnızca liste en
       üstteyken (scrollTop 0) devreye girer; aksi halde normal liste
       kaydırması çalışır. Liste dışından (tutamaç, başlık, alt çubuk)
       her zaman sürüklenebilir. Çekmecenin tamamı kayıyorsa ("self")
       çekmecenin kendisi liste sayılır. */
    if (ayar.kaydirici === 'self') st.scroller = panel;
    else {
      const liste = ayar.kaydirici && target && target.closest ? target.closest(ayar.kaydirici) : null;
      st.scroller = liste && panel.contains(liste) ? liste : null;
    }
  }

  /* @return true -> olayın varsayılan davranışı engellenmeli */
  function move(panel, st, id, clientY) {
    if (st.id !== id) return false;

    const dy = clientY - st.startY;
    const now = Date.now();
    const dt = now - st.lastT;
    if (dt > 0) st.velocity = (clientY - st.lastY) / dt;
    st.lastY = clientY;
    st.lastT = now;

    if (st.armed && !st.dragging) {
      /* Yukarı hareket ya da liste ortasından başlayan hareket:
         sürükleme değil, normal kaydırma. */
      if (dy < 0 || (st.scroller && st.scroller.scrollTop > 0)) {
        st.armed = false;
        st.id = null;
        return false;
      }
      if (Math.abs(dy) < START_THRESHOLD) {
        /* Yön aşağı ve liste en üstte: eşik dolana kadar tarayıcının
           kendi lastik efektini bastır, aksi halde iOS kaydırmayı
           başlatınca sürükleme hiç devreye giremiyor. */
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

  function end(panel, ayar, st, id) {
    if (st.id !== id) return;
    const wasDragging = st.dragging;
    const dragY = st.dragY;
    const velocity = st.velocity;

    st.id = null;
    st.armed = false;
    st.dragging = false;
    st.dragY = 0;

    if (!wasDragging) return;

    st.blockClickUntil = Date.now() + 400;
    const shouldClose = dragY >= CLOSE_DISTANCE || velocity >= CLOSE_VELOCITY;

    panel.classList.remove('m360-sheet-dragging');
    panel.classList.add('m360-sheet-snapping');
    panel.style.removeProperty('touch-action');

    if (shouldClose) {
      /* Tam çekmece yüksekliği kadar aşağı kaydır: ekranın altından
         temizce çıkar, karartma da aynı sürede söner. */
      const height = panel.getBoundingClientRect().height || window.innerHeight;
      const katman = ayar.katman(panel);
      if (katman) katman.classList.add('m360-overlay-closing');
      panel.style.setProperty('--m360-sheet-drag', (height + 40) + 'px');
      window.setTimeout(function () {
        /* Kapatma çekmecenin kendi düğmesine basarak yapılıyor; o
           tıklamayı yukarıdaki "hayalet tık" koruması yutmasın. */
        st.blockClickUntil = 0;
        ayar.kapat(panel);
        resetSheet(panel, ayar);
      }, SNAP_MS);
    } else {
      /* Eşik aşılmadı: çekmece yerine geri otursun. */
      panel.style.setProperty('--m360-sheet-drag', '0px');
      window.setTimeout(function () { resetSheet(panel, ayar); }, SNAP_MS);
    }
  }

  /* Touch olayları olmayan dokunmatik cihazlar (bazı Windows/Android
     tarayıcıları) için aynı mantık pointer olaylarıyla. */
  const hasTouch = 'ontouchstart' in window;

  document.addEventListener('touchstart', function (event) {
    if (!event.touches || event.touches.length !== 1) return;
    const bulunan = bul(event.target);
    if (!bulunan) return;
    const st = durumu(bulunan.panel, bulunan.ayar);
    const touch = event.touches[0];
    begin(bulunan.panel, bulunan.ayar, st, 't' + touch.identifier, touch.clientY, event.target);
  }, { passive: true, capture: true });

  document.addEventListener('pointerdown', function (event) {
    if (hasTouch || event.pointerType === 'mouse') return;
    const bulunan = bul(event.target);
    if (!bulunan) return;
    const st = durumu(bulunan.panel, bulunan.ayar);
    begin(bulunan.panel, bulunan.ayar, st, 'p' + event.pointerId, event.clientY, event.target);
    if (bulunan.panel.setPointerCapture) {
      try { bulunan.panel.setPointerCapture(event.pointerId); } catch (e) {}
    }
  }, true);

  /* Anasayfa süzgeç paneli kapandıktan sonra sürükleme izi kalmasın. */
  document.addEventListener('click', function () {
    document.querySelectorAll('.filter-dropdown-panel:not(.is-open)').forEach(p => resetSheet(p, CEKMECELER[0]));
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

/* ===== rezervasyon çekmecesi (ürün sayfaları, 1024 px ve altı) =====
   Tur, otel, aktivite, etkinlik ve mekân sayfalarında rezervasyon kutusu
   sayfada kısa: fiyat, "Tarih ve kişi seç" ve güven satırları (tour.css).
   Seçimler alttan açılan çekmecede adım adım yapılıyor: kutunun her alanı
   (.tour-booking-field: tarih, kalkış şehri, kişi, oda, ek seçenekler…)
   bir adım; son adımda fiyat dökümü ve "Rezervasyon yap".

   Kutunun kendisi (#tourBooking) çekmeceye taşınıyor, kapanınca yerine
   dönüyor: tek DOM düğümü, sayfanın dinleyicileri ve seçimler korunuyor,
   iki kopya tutulmuyor. "Rezervasyon yap" çekmeceyi kapatıp sayfanın
   kendi rezervasyon özetini (Ödemeye geç) açıyor. Alttaki yapışkan
   şeridin düğmesi de bu çekmeceyi açıyor. */
(function () {
  const DAR = window.matchMedia('(max-width: 1024px)');
  const KAPAT_IKON = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  let kok = null;
  let kart = null;
  let yer = null;
  let adim = 0;
  let oncekiOdak = null;
  let kilitY = 0;
  let kapanis = null;

  const kacis = (m) => String(m).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const parca = (sec) => kok.querySelector(sec);

  function alanlar() {
    return kart ? Array.from(kart.querySelectorAll(':scope > .tour-booking-field')) : [];
  }
  function baslik(alan) {
    const etiket = alan && alan.querySelector('.tour-field-label');
    return etiket ? etiket.textContent.replace(/\s+/g, ' ').trim() : 'Seçim';
  }

  /* Ürün sayfasının kendi kilidiyle aynı yol: gövde sabitleniyor
     (iOS'ta html'e overflow:hidden yetmiyor), konum geri veriliyor. */
  function kilit(ac) {
    const govde = document.body;
    if (ac) {
      kilitY = window.scrollY || document.documentElement.scrollTop || 0;
      govde.style.position = 'fixed';
      govde.style.top = -kilitY + 'px';
      govde.style.left = '0';
      govde.style.right = '0';
      govde.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
      return;
    }
    ['position', 'top', 'left', 'right', 'width'].forEach(o => govde.style.removeProperty(o));
    document.documentElement.style.removeProperty('overflow');
    window.scrollTo(0, kilitY);
  }

  function kur() {
    if (kok) return;
    kok = document.createElement('div');
    kok.className = 'rez-cekmece';
    kok.id = 'rezCekmece';
    kok.hidden = true;
    kok.innerHTML = '<div class="rez-cekmece-katman" data-rez-kapat></div>'
      + '<div class="rez-cekmece-panel" role="dialog" aria-modal="true" aria-labelledby="rezCekmeceBaslik" tabindex="-1">'
      +   '<div class="rez-cekmece-ust">'
      +     '<div class="rez-cekmece-baslik"><span data-rez-sayac></span><strong id="rezCekmeceBaslik"></strong></div>'
      +     '<button type="button" class="rez-cekmece-kapat" data-rez-kapat aria-label="Kapat">' + KAPAT_IKON + '</button>'
      +   '</div>'
      +   '<div class="rez-cekmece-adimlar" data-rez-adimlar></div>'
      +   '<div class="rez-cekmece-govde" data-rez-govde></div>'
      +   '<div class="rez-cekmece-alt">'
      +     '<div class="rez-cekmece-toplam"><span>Toplam</span><strong data-rez-toplam></strong></div>'
      +     '<button type="button" class="rez-cekmece-geri" data-rez-geri>Geri</button>'
      +     '<button type="button" class="rez-cekmece-devam" data-rez-devam>Devam</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(kok);

    kok.addEventListener('click', (e) => {
      if (e.target.closest('[data-rez-kapat]')) { kapat(false); return; }
      if (e.target.closest('[data-rez-geri]')) { git(adim - 1); return; }
      const nokta = e.target.closest('[data-rez-git]');
      if (nokta) { git(Number(nokta.getAttribute('data-rez-git')) || 0); return; }
      if (e.target.closest('[data-rez-devam]')) { ileri(); return; }
      /* Kutudaki seçim (sayfanın kendi dinleyicisi) toplamı değiştirmiş
         olabilir. */
      window.setTimeout(guncelle, 0);
    });
    kok.addEventListener('change', () => window.setTimeout(guncelle, 0));
  }

  function ciz() {
    const liste = alanlar();
    const n = liste.length;
    if (!n) return;
    adim = Math.max(0, Math.min(adim, n - 1));
    const son = adim === n - 1;
    liste.forEach((a, i) => a.classList.toggle('is-rez-aktif', i === adim));
    kart.classList.toggle('is-rez-son', son);
    parca('[data-rez-sayac]').textContent = 'Adım ' + (adim + 1) + ' / ' + n;
    parca('#rezCekmeceBaslik').textContent = baslik(liste[adim]);
    parca('[data-rez-adimlar]').innerHTML = liste.map((a, i) =>
      '<button type="button" class="rez-cekmece-nokta' + (i < adim ? ' is-gecti' : i === adim ? ' is-simdi' : '') + '"'
      + ' data-rez-git="' + i + '" aria-label="' + (i + 1) + '. adım: ' + kacis(baslik(a)) + '"'
      + (i === adim ? ' aria-current="step"' : '') + '></button>').join('');
    parca('[data-rez-geri]').hidden = adim === 0;
    parca('[data-rez-devam]').textContent = son ? 'Rezervasyon yap' : 'Devam';
    parca('[data-rez-govde]').scrollTop = 0;
    guncelle();
  }

  /* Alttaki toplam sayfanın kendi hesabından (kutudaki özet); son adımda
     satış engeli (yer kalmadı, kişi sayısı fazla) varsa düğme pasif. */
  function guncelle() {
    if (!kok || kok.hidden || !kart) return;
    const toplam = kart.querySelector('.tour-summary .tour-sum-total strong')
      || document.querySelector('#tourStickyBar .tour-sticky-price strong');
    parca('[data-rez-toplam]').textContent = toplam ? toplam.textContent.trim() : '';
    const rez = kart.querySelector('#tourReserve');
    parca('[data-rez-devam]').disabled = adim === alanlar().length - 1 && !!(rez && rez.disabled);
  }

  function git(i) { adim = i; ciz(); }

  function ileri() {
    if (adim < alanlar().length - 1) { git(adim + 1); return; }
    const rez = kart.querySelector('#tourReserve');
    if (!rez || rez.disabled) return;
    kapat(true);
    rez.click();
  }

  function ac() {
    if (kapanis) { window.clearTimeout(kapanis); kapanis = null; geriKoy(); }
    kart = document.getElementById('tourBooking');
    if (!kart || !kart.querySelector(':scope > .tour-booking-field')) return false;
    kur();
    if (kok.hidden) {
      yer = document.createComment('rezervasyon kutusu');
      kart.parentNode.insertBefore(yer, kart);
      parca('[data-rez-govde]').appendChild(kart);
      kart.classList.add('is-cekmecede');
      oncekiOdak = document.activeElement;
      kilit(true);
      kok.hidden = false;
    }
    adim = 0;
    ciz();
    window.requestAnimationFrame(() => kok.classList.add('is-acik'));
    parca('.rez-cekmece-panel').focus({ preventScroll: true });
    return true;
  }

  function geriKoy() {
    if (!kart) return;
    kart.classList.remove('is-cekmecede', 'is-rez-son');
    alanlar().forEach(a => a.classList.remove('is-rez-aktif'));
    /* Ekran genişleyince sayfa kutuyu sağ sütuna kendisi taşımış
       olabilir; o zaman eski yere geri konmuyor. */
    if (yer && yer.parentNode && kok.contains(kart)) yer.parentNode.insertBefore(kart, yer);
    if (yer) yer.remove();
    yer = null;
    kok.hidden = true;
    kilit(false);
  }

  /* hemen: "Rezervasyon yap" sonrası özet açılacak; kilit ve kutu anında
     bırakılıyor ki sayfanın kendi kilidi doğru konumu okusun. */
  function kapat(hemen) {
    if (!kok || kok.hidden || kapanis) return;
    kok.classList.remove('is-acik');
    const bitir = () => {
      kapanis = null;
      geriKoy();
      if (!hemen && oncekiOdak && typeof oncekiOdak.focus === 'function') oncekiOdak.focus({ preventScroll: true });
      oncekiOdak = null;
    };
    const azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hemen || azHareket) bitir();
    else kapanis = window.setTimeout(bitir, 280);
  }

  /* Yapan: kutudaki "Tarih ve kişi seç" ve yapışkan şeridin düğmesi.
     Yakalama evresinde: şeridin kendi dinleyicisi (kutuya kaydırma ya da
     doğrudan özet) dar ekranda çalışmıyor. */
  document.addEventListener('click', (e) => {
    if (!DAR.matches) return;
    const hedef = e.target.closest && e.target.closest('#tourStickyCta, [data-rez-ac]');
    if (!hedef || (kok && kok.contains(hedef))) return;
    if (ac()) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && kok && !kok.hidden) kapat(false);
  });

  const genisledi = () => { if (!DAR.matches) kapat(true); };
  if (DAR.addEventListener) DAR.addEventListener('change', genisledi);
  else if (DAR.addListener) DAR.addListener(genisledi);
})();
