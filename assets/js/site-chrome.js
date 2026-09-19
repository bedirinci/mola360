/* ---------------- ortak site cercevesi ----------------
   Header, bildirim paneli, profil menusu, mobil arama cubugu, tam ekran
   arama ve giris modali. TEK KAYNAK: her sayfa bu dosyayi yukler, boylece
   anasayfa ile tur icerik sayfalarinin basligi tanimi geregi aynidir --
   iki kopyayi elle esit tutmaya calismak yok.

   Dosya kendi <script> etiketinin YERINE isaretlemeyi basar; etiket
   sayfada header nerede duracaksa oraya konur. Senkron calistigi icin
   tarayici geri kalan sayfayi ayristirmadan once header DOM da hazir:
   statik isaretlemeye gore gorunur bir gecikme olusmuyor.

   Gorsel yollari koke gore yazilmis; alt klasordeki sayfalar (tur/<slug>/)
   <body data-root="../../"> ile onekini bildirir.

   app.js bu isaretlemedeki ID leri kullanir, dolayisiyla bu dosya ONDAN
   once yuklenmek zorunda. */

(function () {
  const SITE_CHROME_MARKUP = `
  <div class="auth-modal-overlay" id="authModalOverlay">
    <div class="auth-modal" id="authModal" role="dialog" aria-modal="true" aria-label="Giriş yap" tabindex="-1">
      <button class="auth-modal-close" id="authModalCloseBtn" aria-label="Kapat"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg></span></button>
      <!-- Mobilde tam ekran acilan giris ekraninin lacivert basligi.
           Masaustunde gizlenir; orada sag ustteki kapatma butonu kullanilir. -->
      <div class="auth-modal-hero">
        <button class="auth-modal-back" id="authModalBackBtn" type="button" aria-label="Geri">
          <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></span>
        </button>
        <div class="auth-modal-hero-text">
          <strong>Mola360'a hoş geldin</strong>
          <span>Fırsatlar ve biletlerin tek yerde.</span>
        </div>
      </div>
      <div class="auth-modal-tabs">
        <button class="auth-modal-tab active" data-auth-tab="login" id="authTabLogin">Giriş Yap</button>
        <button class="auth-modal-tab" data-auth-tab="register" id="authTabRegister">Üye Ol</button>
      </div>
      <div class="auth-modal-body">
        <div class="auth-modal-panel active" data-auth-panel="login">
          <label for="authLoginEmail">E-posta</label>
          <input type="email" id="authLoginEmail" placeholder="ornek@eposta.com">
          <label for="authLoginPassword">Şifre</label>
          <input type="password" id="authLoginPassword" placeholder="••••••••">
          <div class="auth-modal-forgot"><a href="#" data-auth-switch="reset">Şifremi unuttum</a></div>
          <button class="btn-primary" type="button">Giriş Yap</button>
          <div class="auth-modal-divider">veya</div>
          <div class="auth-social-list">
            <button class="auth-social-btn auth-social-google" type="button">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="#4285F4" stroke="none" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" stroke="none" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A10.99 10.99 0 0 0 12 23z"/><path fill="#FBBC05" stroke="none" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.85z"/><path fill="#EA4335" stroke="none" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/></svg></span>
              Google ile devam et
            </button>
            <button class="auth-social-btn auth-social-facebook" type="button">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13.6 22.5v-8.6h2.9l.43-3.36H13.6V8.4c0-.97.27-1.63 1.66-1.63h1.77V3.76c-.31-.04-1.36-.13-2.58-.13-2.56 0-4.31 1.56-4.31 4.43v2.47H7.4v3.36h2.74v8.6h3.46z"></path></svg></span>
              Facebook ile devam et
            </button>
            <button class="auth-social-btn auth-social-instagram" type="button">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line></svg></span>
              Instagram ile devam et
            </button>
            <button class="auth-social-btn auth-social-phone" type="button">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></span>
              Telefon numarası ile devam et
            </button>
          </div>
          <div class="auth-modal-switch">Hesabın yok mu? <a href="#" data-auth-switch="register">Üye ol</a></div>
        </div>
        <div class="auth-modal-panel" data-auth-panel="reset">
          <strong class="auth-reset-title">Şifreni mi unuttun?</strong>
          <p class="auth-reset-intro">E-posta adresini gir, şifreni yenilemen için sana bir bağlantı gönderelim.</p>
          <label for="authResetEmail">E-posta</label>
          <input type="email" id="authResetEmail" placeholder="ornek@eposta.com">
          <button class="btn-primary" type="button">Sıfırlama bağlantısı gönder</button>
          <div class="auth-modal-switch">Şifreni hatırladın mı? <a href="#" data-auth-switch="login">Giriş yap</a></div>
        </div>
        <div class="auth-modal-panel" data-auth-panel="register">
          <label for="authRegName">Ad Soyad</label>
          <input type="text" id="authRegName" placeholder="Adın Soyadın">
          <label for="authRegEmail">E-posta</label>
          <input type="email" id="authRegEmail" placeholder="ornek@eposta.com">
          <label for="authRegPassword">Şifre</label>
          <input type="password" id="authRegPassword" placeholder="••••••••">
          <button class="btn-primary" type="button">Üye Ol</button>
          <div class="auth-modal-divider">veya</div>
          <div class="auth-social-list">
            <button class="auth-social-btn auth-social-google" type="button">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="#4285F4" stroke="none" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" stroke="none" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A10.99 10.99 0 0 0 12 23z"/><path fill="#FBBC05" stroke="none" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.85z"/><path fill="#EA4335" stroke="none" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/></svg></span>
              Google ile devam et
            </button>
            <button class="auth-social-btn auth-social-facebook" type="button">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13.6 22.5v-8.6h2.9l.43-3.36H13.6V8.4c0-.97.27-1.63 1.66-1.63h1.77V3.76c-.31-.04-1.36-.13-2.58-.13-2.56 0-4.31 1.56-4.31 4.43v2.47H7.4v3.36h2.74v8.6h3.46z"></path></svg></span>
              Facebook ile devam et
            </button>
            <button class="auth-social-btn auth-social-instagram" type="button">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line></svg></span>
              Instagram ile devam et
            </button>
            <button class="auth-social-btn auth-social-phone" type="button">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></span>
              Telefon numarası ile devam et
            </button>
          </div>
          <div class="auth-modal-switch">Zaten üye misin? <a href="#" data-auth-switch="login">Giriş yap</a></div>
        </div>
      </div>
    </div>
  </div>

  <header class="site-header">
    <div class="header-inner">
      <div class="header-logo-group">
        <a href="#" class="logo">
          <img src="assets/img/logo.png" alt="mola360">
        </a>
      </div>
      <div class="header-search" id="headerSearchTrigger" role="button" tabindex="0">
        <span class="icon" id="ic-search-1"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
        <input type="text" placeholder="Etkinlik, otel, aktivite veya mekan ara…" aria-label="Arama" readonly enterkeyhint="search">
      </div>
      <div class="header-right">
        <div class="header-actions">
          <button class="btn-primary" id="headerRegisterBtn">Giriş Yap / Üye Ol</button>
        </div>
        <button class="header-quick-btn" id="favoritesBtn" aria-label="Favorilerim">
          <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-10-9.3C0.4 8 2 4.5 5.6 4c2.1-0.3 4 0.7 6.4 3 2.4-2.3 4.3-3.3 6.4-3C21.9 4.5 23.6 8 22 11.2c-2.5 4.7-10 9.3-10 9.3z"></path></svg></span>
        </button>
        <button class="header-mobile-btn header-notif-btn" id="notifBtn" type="button" aria-label="Bildirimler" aria-expanded="false" aria-haspopup="menu">
          <span class="icon" id="ic-bell"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></span>
          <span class="notif-badge">20</span>
        </button>
        <button class="header-quick-btn header-profile-btn" id="profileBtn" aria-label="Profilim" aria-haspopup="true" aria-expanded="false">
          <span class="header-profile-avatar" id="headerProfileAvatar"></span>
        </button>
        <button class="header-mobile-btn" id="mobileMenuBtn" aria-label="Menü"><span class="icon" id="ic-menu"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg></span></button>
      </div>
    </div>
  </header>
  <!-- Bildirimler: mobilde tam ekran bildirim sayfasi, masaustunde header'a
       bitisik acilir panel. Liste app.js'teki "notifications" verisinden
       uretilir; filtreleme/gruplama notif-utils.js'teki saf fonksiyonlarla
       hesaplanir. Header disinda durur ki tam ekran overlay z-index
       zincirinin (bottom-tab-bar dahil) uzerinde kalsin. -->
  <div class="notif-panel" id="notifPanel" role="dialog" aria-modal="true" aria-label="Bildirimler" tabindex="-1">
    <div class="notif-panel-inner">
      <div class="notif-panel-header">
        <button class="notif-panel-back" id="notifPanelBack" type="button" aria-label="Geri">
          <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></span>
        </button>
        <div class="notif-panel-heading">
          <span class="notif-panel-title">Bildirimler</span>
          <span class="notif-panel-subtitle" id="notifPanelSubtitle">Tüm bildirimler okundu</span>
        </div>
        <button class="notif-mark-all" id="notifMarkAll" type="button">Tümünü oku</button>
        <button class="notif-panel-close" id="notifPanelClose" type="button" aria-label="Kapat">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="notif-filter-row" id="notifFilters" role="tablist" aria-label="Bildirim filtreleri"></div>
      <div class="notif-list" id="notifList"></div>
    </div>
  </div>

  <!-- Profil menüsü: bildirim paneliyle aynı sistemde, header'a bitişik açılır. -->
        <div class="profile-panel" id="profilePanel" role="dialog" aria-label="Hesap menüsü">
         <div class="profile-panel-inner">
          <div class="profile-menu-header">
            <span class="profile-menu-avatar" id="profileMenuAvatar"></span>
            <span class="profile-menu-name" id="profileMenuName"></span>
          </div>
          <div class="profile-menu-list">
            <a href="#" class="profile-menu-item" data-bottom-tab="account">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 20.5c0-4.1 3.6-6.5 7.5-6.5s7.5 2.4 7.5 6.5"></path></svg></span>
              <span>Hesap Bilgilerim</span>
            </a>
            <a href="#" class="profile-menu-item" data-profile-tab="notifications">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 5.5-2.2 7-2.2 7h16.4S18 13.5 18 8z"></path><path d="M10.3 19.5a1.9 1.9 0 0 0 3.4 0"></path></svg></span>
              <span>Bildirim Ayarları</span>
            </a>
            <a href="#" class="profile-menu-item" data-profile-tab="security">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9.5" rx="2"></rect><path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3"></path></svg></span>
              <span>Şifre ve Güvenlik</span>
            </a>
            <a href="#" class="profile-menu-item" data-profile-tab="help">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-1a8 8 0 0 1 16 0v1"></path><rect x="3" y="13" width="4.5" height="6" rx="1.5"></rect><rect x="16.5" y="13" width="4.5" height="6" rx="1.5"></rect></svg></span>
              <span>Yardım &amp; Destek</span>
            </a>
            <div class="profile-menu-divider"></div>
            <button type="button" class="profile-menu-item logout" id="profileLogoutBtn">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></span>
              <span>Çıkış Yap</span>
            </button>
          </div>
         </div>
        </div>

  <div class="mobile-search-bar" id="mobileSearchPanel">
    <div class="header-search" id="mobileSearchTrigger" role="button" tabindex="0">
      <span class="icon" id="ic-search-3"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
      <input type="text" placeholder="Etkinlik, otel, aktivite veya mekan ara…" aria-label="Arama" readonly enterkeyhint="search">
    </div>
  </div>

  <!-- =============== FULL-SCREEN SEARCH OVERLAY =============== -->
  <div class="search-overlay" id="searchOverlay" role="dialog" aria-modal="true" aria-label="Arama">
    <div class="search-overlay-top">
      <div class="search-overlay-bar">
        <button class="search-overlay-back" id="searchOverlayBack" type="button" aria-label="Geri">
          <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></span>
        </button>
        <div class="search-overlay-input-wrap">
          <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
          <input type="text" inputmode="search" id="searchOverlayInput" placeholder="Etkinlik, otel, aktivite veya mekan ara…" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="search">
          <button class="search-overlay-clear" id="searchOverlayClear" type="button" aria-label="Temizle">
            <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
          </button>
        </div>
      </div>
    </div>

    <div class="search-overlay-body" id="searchOverlayBody">
      <button class="search-overlay-close" id="searchOverlayClose" type="button" aria-label="Aramayı kapat">
        <span aria-hidden="true">×</span>
      </button>
      <div class="m360-search-home" id="searchHomeContent"></div>
    </div>
  </div>
`;

  const script = document.currentScript;
  if (!script) return;

  /* data-root sayfanin koke uzakligi. Anasayfada bos, tur sayfasinda
     "../../". Yalnizca kok-goreli assets/ yollari onekleniyor. */
  const kok = (document.body && document.body.getAttribute("data-root")) || "";
  const markup = kok
    ? SITE_CHROME_MARKUP.replace(/(src|href)="assets\//g, "$1=\"" + kok + "assets/")
    : SITE_CHROME_MARKUP;

  script.insertAdjacentHTML("afterend", markup);
})();
