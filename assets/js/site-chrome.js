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
          <form class="auth-form" id="authLoginForm" novalidate>
            <label for="authLoginEmail">E-posta</label>
            <input type="email" id="authLoginEmail" name="eposta" placeholder="ornek@eposta.com" autocomplete="email">
            <p class="auth-form-error" data-auth-hata="eposta" role="alert"></p>
            <p class="auth-demo-note">Deneme sürümü: hesap bu tarayıcıda tutulur, şifre alınmaz. Gerçek girişte e-posta doğrulaması ve şifre ya da tek kullanımlık kod olacak.</p>
            <button class="btn-primary" type="submit">Giriş Yap</button>
          </form>
          <div class="auth-modal-divider">veya</div>
          <div class="auth-social-list">
            <button class="auth-social-btn auth-social-google" type="button" disabled aria-describedby="authSocialSoon">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="#4285F4" stroke="none" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" stroke="none" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A10.99 10.99 0 0 0 12 23z"/><path fill="#FBBC05" stroke="none" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.85z"/><path fill="#EA4335" stroke="none" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/></svg></span>
              Google ile devam et
            </button>
            <button class="auth-social-btn auth-social-facebook" type="button" disabled aria-describedby="authSocialSoon">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13.6 22.5v-8.6h2.9l.43-3.36H13.6V8.4c0-.97.27-1.63 1.66-1.63h1.77V3.76c-.31-.04-1.36-.13-2.58-.13-2.56 0-4.31 1.56-4.31 4.43v2.47H7.4v3.36h2.74v8.6h3.46z"></path></svg></span>
              Facebook ile devam et
            </button>
            <button class="auth-social-btn auth-social-instagram" type="button" disabled aria-describedby="authSocialSoon">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line></svg></span>
              Instagram ile devam et
            </button>
            <button class="auth-social-btn auth-social-phone" type="button" disabled aria-describedby="authSocialSoon">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></span>
              Telefon numarası ile devam et
            </button>
          </div>
          <p class="auth-social-soon" id="authSocialSoon">Google, Facebook, Instagram ve telefonla giriş sunucu bağlanınca açılacak.</p>
          <div class="auth-modal-switch">Hesabın yok mu? <a href="#" data-auth-switch="register">Üye ol</a></div>
        </div>
        <div class="auth-modal-panel" data-auth-panel="register">
          <form class="auth-form" id="authRegisterForm" novalidate>
            <div class="auth-form-row">
              <span><label for="authRegName">Ad</label>
              <input type="text" id="authRegName" name="ad" placeholder="Adın" autocomplete="given-name" maxlength="50">
              <p class="auth-form-error" data-auth-hata="ad" role="alert"></p></span>
              <span><label for="authRegSurname">Soyad</label>
              <input type="text" id="authRegSurname" name="soyad" placeholder="Soyadın" autocomplete="family-name" maxlength="50">
              <p class="auth-form-error" data-auth-hata="soyad" role="alert"></p></span>
            </div>
            <label for="authRegEmail">E-posta</label>
            <input type="email" id="authRegEmail" name="eposta" placeholder="ornek@eposta.com" autocomplete="email">
            <p class="auth-form-error" data-auth-hata="eposta" role="alert"></p>
            <label for="authRegPhone">Cep telefonu (isteğe bağlı)</label>
            <input type="tel" id="authRegPhone" name="telefon" placeholder="5xx xxx xx xx" autocomplete="tel" maxlength="20">
            <p class="auth-form-error" data-auth-hata="telefon" role="alert"></p>
            <label class="auth-check"><input type="checkbox" name="kvkk"><span><a href="kurumsal/kvkk/">Aydınlatma metnini</a> okudum; üyelik için kişisel verilerimin işlenmesini onaylıyorum.</span></label>
            <p class="auth-form-error" data-auth-hata="kvkk" role="alert"></p>
            <label class="auth-check"><input type="checkbox" name="izinEposta"><span>Kampanya ve fırsat e-postaları almak istiyorum (isteğe bağlı).</span></label>
            <p class="auth-demo-note">Deneme sürümü: hesap bu tarayıcıda tutulur, şifre alınmaz. Üye olunca ilk rezervasyonuna özel %15 indirim kodun hesabına eklenir.</p>
            <button class="btn-primary" type="submit">Üye Ol</button>
          </form>
          <div class="auth-modal-divider">veya</div>
          <div class="auth-social-list">
            <button class="auth-social-btn auth-social-google" type="button" disabled aria-describedby="authSocialSoon">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="#4285F4" stroke="none" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" stroke="none" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A10.99 10.99 0 0 0 12 23z"/><path fill="#FBBC05" stroke="none" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.85z"/><path fill="#EA4335" stroke="none" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/></svg></span>
              Google ile devam et
            </button>
            <button class="auth-social-btn auth-social-facebook" type="button" disabled aria-describedby="authSocialSoon">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13.6 22.5v-8.6h2.9l.43-3.36H13.6V8.4c0-.97.27-1.63 1.66-1.63h1.77V3.76c-.31-.04-1.36-.13-2.58-.13-2.56 0-4.31 1.56-4.31 4.43v2.47H7.4v3.36h2.74v8.6h3.46z"></path></svg></span>
              Facebook ile devam et
            </button>
            <button class="auth-social-btn auth-social-instagram" type="button" disabled aria-describedby="authSocialSoon">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line></svg></span>
              Instagram ile devam et
            </button>
            <button class="auth-social-btn auth-social-phone" type="button" disabled aria-describedby="authSocialSoon">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></span>
              Telefon numarası ile devam et
            </button>
          </div>
          <p class="auth-social-soon">Google, Facebook, Instagram ve telefonla üyelik sunucu bağlanınca açılacak.</p>
          <div class="auth-modal-switch">Zaten üye misin? <a href="#" data-auth-switch="login">Giriş yap</a></div>
        </div>
      </div>
    </div>
  </div>

  <header class="site-header">
    <div class="header-inner">
      <div class="header-logo-group">
        <a href="./" class="logo" aria-label="mola360 anasayfa">
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
    <!-- Ana menü (681px ve üstü). Satırlar taksonomideki menü ağacından
         (TAXONOMY_MENU) sayfa yüklenince basılıyor; burada yalnızca yeri
         var. Mobilde aynı ağaç anasayfa çekmecesinde. -->
    <nav class="site-nav" id="siteNav" aria-label="Ana menü"></nav>
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
          <!-- Bağlar Hesabım panelinin bölümlerine (tek panel, ?bolum=). -->
          <div class="profile-menu-list">
            <a href="hesabim/" class="profile-menu-item">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 20.5c0-4.1 3.6-6.5 7.5-6.5s7.5 2.4 7.5 6.5"></path></svg></span>
              <span>Hesabım</span>
            </a>
            <a href="hesabim/?bolum=rezervasyonlarim" class="profile-menu-item">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16.5" rx="2.5"></rect><line x1="3" y1="9.5" x2="21" y2="9.5"></line><line x1="8" y1="2.5" x2="8" y2="6.5"></line><line x1="16" y1="2.5" x2="16" y2="6.5"></line></svg></span>
              <span>Rezervasyonlarım</span>
            </a>
            <a href="hesabim/?bolum=biletlerim" class="profile-menu-item">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2 2 0 0 1 5 6.5h14a2 2 0 0 1 2 2v2a2.2 2.2 0 0 0 0 4.4v2A2 2 0 0 1 19 19H5a2 2 0 0 1-2-2v-2a2.2 2.2 0 0 0 0-4.4z"></path><line x1="9.5" y1="6.5" x2="9.5" y2="19" stroke-dasharray="2.2 2.2"></line></svg></span>
              <span>Biletlerim</span>
            </a>
            <a href="hesabim/?bolum=favorilerim" class="profile-menu-item">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 8.9c0 5.5-8.8 10.2-8.8 10.2S3.2 14.4 3.2 8.9A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 2.4Z"></path></svg></span>
              <span>Favorilerim</span>
            </a>
            <a href="hesabim/?bolum=kuponlarim" class="profile-menu-item">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path><path d="M4 8h13.5A2.5 2.5 0 0 1 20 10.5v3H16a2 2 0 0 1 0-4h4"></path></svg></span>
              <span>Kuponlarım</span>
            </a>
            <a href="hesabim/?bolum=puanlarim" class="profile-menu-item">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"></polygon></svg></span>
              <span>Mola Puanlarım</span>
            </a>
            <a href="hesabim/?bolum=ayarlar" class="profile-menu-item">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9.5" rx="2"></rect><path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3"></path></svg></span>
              <span>Ayarlar</span>
            </a>
            <a href="kurumsal/yardim/" class="profile-menu-item">
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

  /* Node'da (testler menü fonksiyonlarını yüklüyor) belge yok. */
  if (typeof document === "undefined") return;
  const script = document.currentScript;
  if (!script) return;

  /* data-root sayfanin koke uzakligi. Anasayfada bos, tur sayfasinda
     "../../". Yalnizca kok-goreli assets/ yollari onekleniyor. */
  const kok = (document.body && document.body.getAttribute("data-root")) || "";
  const markup = kok
    ? SITE_CHROME_MARKUP.replace(/(src|href)="(assets|hesabim|kurumsal)\//g, "$1=\"" + kok + "$2/").replace('href="./" class="logo"', 'href="' + kok + '" class="logo"')
    : SITE_CHROME_MARKUP;

  script.insertAdjacentHTML("afterend", markup);

  /* Menü ağacı taksonomi dosyası yüklendikten sonra basılıyor (o dosya
     sayfanın sonunda). */
  const doldur = () => siteMenuDoldur(kok);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", doldur);
  else doldur();
})();

/* ---------------- ana menü ----------------
   Menü ağacı TEK kaynaktan: taxonomy-data.js/TAXONOMY_MENU. Masaüstünde
   başlığın altındaki satır (üzerine gelince açılan paneller), mobilde
   anasayfa çekmecesindeki açılır liste. İkisi aynı ağacı okuyor; menüye
   satır eklemek taksonomiye bir satır.

   Bağlar sayfa köküne göre (data-root): anasayfada "turlar/", içerik
   sayfasında "../../turlar/". */
function siteMenuHref(kok, yol) {
  return (kok || "") + (yol ? String(yol).replace(/\/+$/, "") + "/" : "");
}

function siteMenuKacis(metin) {
  return String(metin || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Bulunulan sayfanın kök göreli yolu: "turlar/ege-turlari". */
function siteMenuSimdikiYol(kok) {
  try {
    const kokYol = new URL(kok || "./", document.baseURI).pathname;
    const p = window.location.pathname;
    return (p.indexOf(kokYol) === 0 ? p.slice(kokYol.length) : p)
      .replace(/index\.html?$/i, "").replace(/^\/+|\/+$/g, "").toLowerCase();
  } catch (_) {
    return "";
  }
}

/* Üst satırın hangi bölümü "bulunduğun yer": /turlar/… ve /tur/<slug>/
   ikisi de Turlar. */
function siteMenuBolumu(simdiki, dugum, tipler) {
  if (!simdiki) return false;
  const bas = String(dugum.path || "").split("/")[0];
  const ilk = simdiki.split("/")[0];
  if (ilk === bas) return true;
  const tip = Object.keys(tipler || {}).find(t => tipler[t].base === bas);
  return !!tip && tipler[tip].path === ilk;
}

function siteMenuMasaustu(menu, kok, simdiki, tipler) {
  const bag = (d, sinif) => '<a' + (sinif ? ' class="' + sinif + '"' : "") + ' href="' + siteMenuHref(kok, d.path) + '"'
    + (d.path === simdiki ? ' aria-current="page"' : "") + ">" + siteMenuKacis(d.label) + "</a>";
  return '<ul class="site-nav-list">' + menu.map(d => {
    const cocuk = d.children || [];
    const aktif = siteMenuBolumu(simdiki, d, tipler) ? " is-current" : "";
    if (!cocuk.length) return '<li class="site-nav-item' + aktif + '">' + bag(d, "site-nav-link") + "</li>";
    const gruplu = cocuk.filter(c => c.children && c.children.length);
    let panel;
    if (gruplu.length) {
      /* Geniş panel: alt ağacı olan her çocuk bir sütun, yapraklar son
         sütunda. */
      const yapraklar = cocuk.filter(c => !(c.children && c.children.length));
      panel = '<div class="site-nav-panel is-mega">'
        + gruplu.map(g => '<div class="site-nav-col">' + bag(g, "site-nav-col-title")
          + g.children.filter(c => c.path !== g.path).map(c => bag(c)).join("")
          + '<a class="site-nav-all" href="' + siteMenuHref(kok, g.path) + '">Tümünü gör</a></div>').join("")
        + (yapraklar.length ? '<div class="site-nav-col is-plain">' + yapraklar.map(c => bag(c)).join("") + "</div>" : "")
        + "</div>";
    } else {
      panel = '<div class="site-nav-panel">' + cocuk.map(c => bag(c)).join("") + "</div>";
    }
    return '<li class="site-nav-item has-panel' + aktif + '">'
      + '<a class="site-nav-link" href="' + siteMenuHref(kok, d.path) + '" aria-haspopup="true">' + siteMenuKacis(d.label)
      + '<svg class="site-nav-chev" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></a>'
      + panel + "</li>";
  }).join("") + "</ul>";
}

/* Mobil çekmece: iç içe açılır liste (details/summary; JS gerekmez). */
function siteMenuAgac(menu, kok, simdiki) {
  const dal = (d, derin) => {
    const cocuk = d.children || [];
    if (!cocuk.length) {
      return '<a class="smt-link" href="' + siteMenuHref(kok, d.path) + '"'
        + (d.path === simdiki ? ' aria-current="page"' : "") + ">" + siteMenuKacis(d.label) + "</a>";
    }
    /* Düğümün kendi sayfası çocuklarda yoksa en üste "Tümü" bağı. */
    const kendisi = cocuk.some(c => c.path === d.path) ? ""
      : '<a class="smt-link smt-all" href="' + siteMenuHref(kok, d.path) + '">Tüm ' + siteMenuKacis(d.label) + "</a>";
    return '<details class="smt-group smt-level-' + derin + '"><summary>' + siteMenuKacis(d.label) + "</summary>"
      + '<div class="smt-body">' + kendisi + cocuk.map(c => dal(c, derin + 1)).join("") + "</div></details>";
  };
  return menu.map(d => dal(d, 0)).join("");
}

function siteMenuDoldur(kok) {
  const menu = (typeof TAXONOMY_MENU !== "undefined") ? TAXONOMY_MENU : null;
  const tipler = (typeof TAXONOMY_TYPES !== "undefined") ? TAXONOMY_TYPES : {};
  const nav = document.getElementById("siteNav");
  if (!menu) {
    if (nav) nav.hidden = true;
    return;
  }
  const simdiki = siteMenuSimdikiYol(kok);
  if (nav) nav.innerHTML = siteMenuMasaustu(menu, kok, simdiki, tipler);
  document.querySelectorAll("[data-site-menu]").forEach(el => {
    el.innerHTML = siteMenuAgac(menu, kok, simdiki);
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { siteMenuHref, siteMenuMasaustu, siteMenuAgac, siteMenuBolumu };
}
