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
  <!-- Ana menü (çekmece): TEK KAYNAK burası; her sayfada var. Mobilde
       başlıktaki menü düğmesiyle, masaüstünde anasayfada sabit sol menü
       olarak (app.js kopyalıyor), diğer sayfalarda başlıktaki menü
       düğmesiyle açılan sol panel olarak görünüyor. -->
  <div class="drawer-overlay" id="drawerOverlay" aria-hidden="true"></div>
  <aside class="mobile-drawer" id="mobileDrawer" role="dialog" aria-modal="true" aria-label="Ana menü">
    <div class="sidebar-scroll drawer-sidebar-scroll">

      <!-- Mobil profil kartı: profil ekranındaki üst bölümle aynı görsel dil -->
      <!-- Profil kartları hesaptan dolduruluyor (app.js, MolaVeri.hesapPaneli):
           sayılar, puan ve seviye gerçek; misafirde giriş çağrısı. Burada
           elle yazılmış sayı yok. -->
      <div class="mobile-profile-card" id="drawerProfileCard">
        <div class="mobile-profile-hero">
          <div class="mobile-profile-top">
            <div class="mobile-profile-avatar" id="drawerProfileAvatar" data-hesap-avatar></div>
            <div class="mobile-profile-main">
              <strong id="drawerProfileName"><span data-hesap-ad>Misafir</span></strong>
              <div class="mobile-profile-badges">
                <span class="mobile-profile-badge gold" data-hesap-seviye-rozet hidden><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"></polygon></svg></span><span data-hesap-seviye-adi></span></span>
              </div>
            </div>
            <div class="mobile-profile-actions" data-hesap-uye hidden>
              <a class="mobile-profile-edit" href="hesabim/?bolum=bilgilerim" aria-label="Kişisel bilgilerim"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg></span></a>
              <a class="mobile-profile-edit" href="hesabim/?bolum=ayarlar" aria-label="Ayarlar"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"></path></svg></span></a>
            </div>
          </div>
        </div>
        <div class="mobile-profile-guest" data-hesap-misafir>
          <p>Rezervasyonların, biletlerin ve Molapuanın tek yerde. Yeni üyelere ilk rezervasyonda %15 indirim.</p>
        </div>
        <div class="mobile-profile-stats" data-hesap-uye hidden>
          <a href="hesabim/?bolum=rezervasyonlarim"><strong data-hesap-sayi="rezervasyon">0</strong><span>Rezervasyon</span></a>
          <a href="hesabim/?bolum=biletlerim"><strong data-hesap-sayi="yaklasan">0</strong><span>Yaklaşan</span></a>
          <a href="hesabim/?bolum=favorilerim"><strong data-hesap-sayi="favori">0</strong><span>Favorilerim</span></a>
          <a href="hesabim/?bolum=kuponlarim"><strong data-hesap-sayi="kupon">0</strong><span>Kuponlarım</span></a>
        </div>
        <a class="mobile-profile-loyalty" href="hesabim/?bolum=puanlarim" data-hesap-uye hidden>
          <div class="mobile-profile-loyalty-head"><strong data-hesap-seviye-metni></strong><span data-hesap-sonraki></span></div>
          <div class="mobile-profile-progress"><span data-hesap-ilerleme></span></div>
          <div class="mobile-profile-loyalty-foot"><strong data-hesap-puan>0</strong><span>Molapuan</span><span class="reward" data-hesap-bekleyen></span></div>
        </a>
      </div>

      <div class="sidebar-user" id="drawerUserCard">
        <div class="sidebar-user-top">
          <span class="sidebar-user-avatar" id="drawerUserAvatar" data-hesap-avatar></span>
          <span class="sidebar-user-info">
            <strong id="drawerUserName" data-hesap-ad>Misafir</strong>
            <a href="hesabim/" data-hesap-uye hidden>Hesabıma git</a>
            <button type="button" class="sidebar-user-login" data-hesap-giris data-hesap-misafir>Giriş yap / Üye ol</button>
          </span>
        </div>
        <a class="sidebar-user-loyalty" href="hesabim/?bolum=puanlarim" data-hesap-uye hidden>
          <span class="sidebar-user-loyalty-icon"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"></polygon></svg></span></span>
          <div class="sidebar-user-loyalty-info">
            <strong><span data-hesap-puan>0</span> Molapuan</strong>
            <span data-hesap-sonraki></span>
            <div class="sidebar-user-loyalty-bar"><div class="sidebar-user-loyalty-bar-fill" data-hesap-ilerleme></div></div>
          </div>
        </a>
      </div>

      <!-- Birincil menü: mobildeki alt sekme çubuğuyla aynı 4 ana bölüm -->
      <nav class="sidebar-primary-nav" aria-label="Ana bölümler">
        <a href="./" data-sidebar-tab="explore"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><polygon points="15 9 13 13 9 15 11 11"></polygon></svg></span>Keşfet</a>
        <a href="hesabim/?bolum=favorilerim" data-sidebar-tab="favorites"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 8.9c0 5.5-8.8 10.2-8.8 10.2S3.2 14.4 3.2 8.9A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 2.4Z"></path></svg></span>Favorilerim</a>
        <a href="hesabim/?bolum=biletlerim" data-sidebar-tab="tickets"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2 2 0 0 1 5 6.5h14a2 2 0 0 1 2 2v2a2.2 2.2 0 0 0 0 4.4v2A2 2 0 0 1 19 19H5a2 2 0 0 1-2-2v-2a2.2 2.2 0 0 0 0-4.4z"></path><line x1="9.5" y1="6.5" x2="9.5" y2="19" stroke-dasharray="2.2 2.2"></line></svg></span>Biletlerim</a>
        <a href="hesabim/" data-sidebar-tab="account"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 20.5c0-4.1 3.6-6.5 7.5-6.5s7.5 2.4 7.5 6.5"></path></svg></span>Hesabım</a>
      </nav>

      <!-- Kampanya slider'ı: birincil menü ile kategoriler arasında, yatay kaydırmalı kampanya kartları -->
      <div class="drawer-promo-slider">
        <!-- Kartlar yürürlükteki kampanya kurallarının (booking-engine.js,
             REZ_KAMPANYALAR) aynısı; kuralı olmayan indirim yazılmıyor
             (tests/rezervasyon.test.js). -->
        <div class="drawer-promo-track" id="drawerPromoTrack">
          <a href="turlar/kapadokya-turlari/" class="drawer-promo-card">
            <img loading="lazy" class="drawer-promo-bg" src="https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=508&h=244&q=75" alt="Kapadokya balon turu görseli">
            <div class="drawer-promo-content">
              <span class="drawer-promo-badge">Erken rezervasyon</span>
              <div>
                <div class="drawer-promo-title">Kapadokya turlarında</div>
                <div class="drawer-promo-bottom">
                  <span class="drawer-promo-discount"><span class="num">500 TL</span><span class="unit">indirim</span></span>
                  <span class="drawer-promo-cta">İncele</span>
                </div>
              </div>
            </div>
          </a>
          <a href="oteller/" class="drawer-promo-card">
            <img loading="lazy" class="drawer-promo-bg" src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=508&h=244&q=75" alt="Ferah bir otel odası ve yapılmış yatak">
            <div class="drawer-promo-content">
              <span class="drawer-promo-badge">Hafta sonu</span>
              <div>
                <div class="drawer-promo-title">Otellerde 2 gece kal</div>
                <div class="drawer-promo-bottom">
                  <span class="drawer-promo-discount"><span class="num">1 gece</span><span class="unit">bizden</span></span>
                  <span class="drawer-promo-cta">İncele</span>
                </div>
              </div>
            </div>
          </a>
          <a href="hesabim/" class="drawer-promo-card">
            <img loading="lazy" class="drawer-promo-bg" src="https://images.unsplash.com/photo-1705229643252-2e2694a193b0?auto=format&fit=crop&w=508&h=244&q=75" alt="Ayder Yaylası'nda sisli yeşil tepeler">
            <div class="drawer-promo-content">
              <span class="drawer-promo-badge">Yeni üyelere</span>
              <div>
                <div class="drawer-promo-title">İlk rezervasyonda</div>
                <div class="drawer-promo-bottom">
                  <span class="drawer-promo-discount"><span class="num">%15</span><span class="unit">indirim</span></span>
                  <span class="drawer-promo-cta">İncele</span>
                </div>
              </div>
            </div>
          </a>
          <a href="kampanyalar/" class="drawer-promo-card">
            <img loading="lazy" class="drawer-promo-bg" src="https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=508&h=244&q=75" alt="Ege'de mavi bir koyda demirlemiş gezi teknesi">
            <div class="drawer-promo-content">
              <span class="drawer-promo-badge">Kampanyalar</span>
              <div>
                <div class="drawer-promo-title">Bütün kampanyalar</div>
                <div class="drawer-promo-bottom">
                  <span class="drawer-promo-discount"><span class="num">Tümü</span><span class="unit">ve koşulları</span></span>
                  <span class="drawer-promo-cta">İncele</span>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>

      <div class="sidebar-divider"></div>

      <!-- Ana menü: taksonomideki ağaç (TAXONOMY_MENU), ikonlu düğmeler;
           alt sayfalar düğmenin altında açılıyor. İçeriği siteMenuDoldur
           basıyor. Masaüstünde başlıkta ayrı bir menü satırı yok. -->
      <div class="sidebar-section sidebar-section-menu">
        <h4>Menü</h4>
        <nav class="site-menu-tree" data-site-menu aria-label="Tüm kategoriler"></nav>
      </div>

      <div class="sidebar-section">
        <h4>Popüler Rotalar</h4>
        <div class="sidebar-route-list sidebar-route-grid">
          <a href="turlar/karadeniz-turlari/" class="sidebar-route"><span class="sidebar-route-thumb"><img loading="lazy" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&amp;fit=crop&amp;w=120&amp;h=120&amp;q=70" alt=""></span><span class="sidebar-route-info"><strong>Karadeniz Rüyası</strong><span>Yayla &amp; doğa turları</span></span></a>
          <a href="turlar/kapadokya-turlari/" class="sidebar-route"><span class="sidebar-route-thumb"><img loading="lazy" src="https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&amp;fit=crop&amp;w=120&amp;h=120&amp;q=70" alt=""></span><span class="sidebar-route-info"><strong>Kapadokya &amp; Erciyes</strong><span>Balon turları &amp; kayak</span></span></a>
          <a href="turlar/ege-turlari/" class="sidebar-route"><span class="sidebar-route-thumb"><img loading="lazy" src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&amp;fit=crop&amp;w=120&amp;h=120&amp;q=70" alt=""></span><span class="sidebar-route-info"><strong>Ege &amp; Bodrum</strong><span>Tekne turları &amp; koylar</span></span></a>
          <a href="koleksiyonlar/" class="sidebar-route"><span class="sidebar-route-thumb sidebar-route-thumb-star"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"></polygon></svg></span></span><span class="sidebar-route-info"><strong>Momo'nun Seçtikleri</strong><span>Editörden özel öneriler</span></span></a>
          <a href="temalar/doga-yayla/" class="sidebar-route sidebar-more-item"><span class="sidebar-route-thumb"><img loading="lazy" src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&amp;fit=crop&amp;w=120&amp;h=120&amp;q=70" alt=""></span><span class="sidebar-route-info"><strong>Karadeniz Yaylaları</strong><span>Doğa &amp; kamp rotaları</span></span></a>
          <a href="temalar/deniz-tekne/" class="sidebar-route sidebar-more-item"><span class="sidebar-route-thumb"><img loading="lazy" src="https://images.unsplash.com/photo-1601751818856-8ba24a2e0d84?auto=format&amp;fit=crop&amp;w=120&amp;h=120&amp;q=70" alt=""></span><span class="sidebar-route-info"><strong>Antalya Sahilleri</strong><span>Plaj &amp; tekne aktiviteleri</span></span></a>
        </div>
        <button type="button" class="sidebar-more-toggle" data-more-toggle>
          <span class="label">Devamını gör</span>
          <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
        </button>
      </div>

      <!-- Son Görüntülenenler: ziyaretçinin kendi geçmişi (visitor-history.js,
           bu tarayıcıda). Kartlar ürünün kendi kaydından app.js'te
           basılıyor; geçmiş yoksa bölüm gizli kalıyor. -->
      <div class="sidebar-section" data-son-gorulenler-bolum hidden>
        <h4>Son Görüntülenenler</h4>
        <div class="sidebar-recent-list" data-son-gorulenler></div>
      </div>

      <!-- Yardım & Destek: destek bağları, Blog360 ve Kurumsal tek bölümde.
           Blog360 ve Kurumsal taksonominin "destek" grubundan
           (TAXONOMY_MENU, grup: 'destek') siteMenuDoldur ile basılıyor.
           Canlı Destek'in adresi CONTACT.whatsappHref (app.js). -->
      <div class="sidebar-section sidebar-section-help">
        <h4>Yardım &amp; Destek</h4>
        <a href="kurumsal/iletisim/" class="sidebar-link"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-1a8 8 0 0 1 16 0v1"></path><rect x="3" y="13" width="4.5" height="6" rx="1.5"></rect><rect x="16.5" y="13" width="4.5" height="6" rx="1.5"></rect></svg></span>Bize Ulaşın</a>
        <a href="kurumsal/iptal-iade/" class="sidebar-link"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3L20 8"></path><path d="M20 4v4h-4"></path><path d="M20 12a8 8 0 0 1-14 5.3L4 16"></path><path d="M4 20v-4h4"></path></svg></span>İptal ve İade</a>
        <a href="#" class="sidebar-link" data-destek-whatsapp target="_blank" rel="noopener"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 3 6.2L4 20l1.4-3.4A8 8 0 0 1 4 12Z"></path><line x1="8.5" y1="10.5" x2="15.5" y2="10.5"></line><line x1="8.5" y1="13.5" x2="13" y2="13.5"></line></svg></span>Canlı Destek</a>
        <div class="sidebar-destek-menu" data-site-destek></div>
        <button type="button" class="sidebar-link" data-tercih-ac aria-haspopup="dialog"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="3" y1="12" x2="21" y2="12"></line><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"></path></svg></span><span data-tercih-etiket>TR · ₺</span></button>
      </div>

      <div class="drawer-social-footer">
        <span class="drawer-copyright">© 2026 Mola360. Tüm hakları saklıdır.</span>
      </div>

    </div>

    <div class="drawer-footer sidebar-footer">
      <!-- Oturum açıkken giriş düğmesi yerine çıkış düğmesi (data-hesap-*).
           Sosyal hesap adresleri CONTACT.social (home-blocks.js); adres
           girilmemişse düğme pasif ve bunu söylüyor (app.js). -->
      <div class="drawer-footer-row">
        <button class="btn-primary" id="drawerAuthBtn" data-hesap-misafir>Giriş Yap / Üye Ol</button>
        <button type="button" class="btn-primary drawer-logout-btn" data-hesap-cikis data-hesap-uye hidden><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>Çıkış Yap</button>
        <a href="#" target="_blank" rel="noopener" class="drawer-social-btn drawer-whatsapp-btn" data-destek-whatsapp aria-label="WhatsApp destek">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.28A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.13c-1.6 0-3.13-.43-4.46-1.24l-.32-.19-3.12.76.78-3.05-.2-.31A8.13 8.13 0 1 1 20.17 12a8.14 8.14 0 0 1-8.13 8.13Zm4.47-6.08c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3s-.85.83-.85 2.02.87 2.35.99 2.51c.12.16 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z"/></svg>
        </a>
        <a href="#" target="_blank" rel="noopener" class="drawer-social-btn drawer-facebook-btn" data-sosyal="facebook" aria-label="Facebook">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46h1.6V4.3c-.28-.04-1.23-.12-2.34-.12-2.32 0-3.9 1.42-3.9 4.02v2.3H8v3h2.36V21h3.14Z"/></svg>
        </a>
        <a href="#" target="_blank" rel="noopener" class="drawer-social-btn drawer-instagram-btn" data-sosyal="instagram" aria-label="Instagram">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.6" cy="7.4" r=".9" fill="currentColor" stroke="none"/></svg>
        </a>
      </div>
    </div>
  </aside>
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

  <!-- Dil ve para birimi: sol menüdeki "TR · ₺" düğmesiyle açılan alt
       çekmece. Seçenekler veri kapısından (MolaVeri.diller,
       MolaVeri.paraBirimleri); seçim bu tarayıcıda saklanıyor (app.js). -->
  <div class="tercih-katman" id="tercihKatman" hidden></div>
  <div class="tercih-cekmece" id="tercihCekmece" role="dialog" aria-modal="true" aria-labelledby="tercihBaslik" hidden>
    <span class="tercih-tutamac" aria-hidden="true"></span>
    <div class="tercih-bas">
      <h2 id="tercihBaslik">Dil ve para birimi</h2>
      <button type="button" class="tercih-kapat" data-tercih-kapat aria-label="Kapat"><span aria-hidden="true">×</span></button>
    </div>
    <form class="tercih-form" id="tercihForm">
      <fieldset>
        <legend>Dil</legend>
        <div class="tercih-secenekler" data-tercih-diller></div>
      </fieldset>
      <fieldset>
        <legend>Para birimi</legend>
        <div class="tercih-secenekler" data-tercih-paralar></div>
      </fieldset>
      <p class="tercih-not">Kartlardaki fiyatlar seçtiğin para biriminde yaklaşık karşılık (≈) olarak gösterilir. Ürün sayfası ve ödeme Türk lirasıyla; kur rezervasyonda sabitlenir.</p>
      <button type="submit" class="btn-primary tercih-kaydet">Kaydet</button>
    </form>
  </div>

  <header class="site-header">
    <div class="header-inner">
      <div class="header-logo-group">
        <!-- Masaüstü menü düğmesi: sabit sol menüsü olmayan sayfalarda
             (anasayfa dışı) sol menüyü açıp kapatıyor. -->
        <button class="header-menu-btn" id="headerMenuBtn" type="button" aria-label="Menüyü aç" aria-expanded="false"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg></span></button>
        <a href="./" class="logo" aria-label="mola360 anasayfa">
          <img src="assets/img/logo.png" alt="mola360">
        </a>
      </div>
      <div class="header-search" id="headerSearchTrigger" role="button" tabindex="0">
        <span class="icon" id="ic-search-1"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
        <input type="text" placeholder="Etkinlik, otel, aktivite veya mekan ara…" aria-label="Arama" readonly enterkeyhint="search">
      </div>
      <div class="header-right">
        <!-- Masaüstünde dil/para tercihi ve Yardım menüsü başlıkta; mobilde
             ikisi de menünün (çekmece) Yardım & Destek bölümünde. -->
        <!-- Ödeme adımında (body[data-rota="checkout"]) başlık sadeleşiyor:
             arama, menü ve hesap düğmeleri yerine bu not ve Yardım. -->
        <span class="header-guvenli"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg></span>Güvenli ödeme</span>
        <button type="button" class="header-pref-btn" data-tercih-ac aria-haspopup="dialog" aria-label="Dil ve para birimi"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="3" y1="12" x2="21" y2="12"></line><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"></path></svg></span><span data-tercih-etiket>TR · ₺</span></button>
        <div class="header-help">
          <button type="button" class="header-help-btn" id="headerHelpBtn" aria-expanded="false" aria-controls="headerHelpPanel"><span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-1a8 8 0 0 1 16 0v1"></path><rect x="3" y="13" width="4.5" height="6" rx="1.5"></rect><rect x="16.5" y="13" width="4.5" height="6" rx="1.5"></rect></svg></span><span class="header-help-label">Yardım</span><span class="icon header-help-chev"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span></button>
          <div class="header-help-panel" id="headerHelpPanel" hidden>
            <a href="#" class="header-help-wa" data-destek-whatsapp target="_blank" rel="noopener">
              <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.28A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.13c-1.6 0-3.13-.43-4.46-1.24l-.32-.19-3.12.76.78-3.05-.2-.31A8.13 8.13 0 1 1 20.17 12a8.14 8.14 0 0 1-8.13 8.13Zm4.47-6.08c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3s-.85.83-.85 2.02.87 2.35.99 2.51c.12.16 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z"/></svg></span>
              <span class="header-help-wa-text"><strong>WhatsApp Canlı Destek</strong><small data-destek-saat></small></span>
              <span class="header-help-durum" data-destek-durum></span>
            </a>
            <a href="kurumsal/yardim/" class="header-help-link">Yardım Merkezi</a>
            <a href="kurumsal/sss/" class="header-help-link">Sık Sorulan Sorular</a>
            <a href="kurumsal/iptal-iade/" class="header-help-link">İptal ve İade</a>
            <a href="kurumsal/iletisim/" class="header-help-link">Bize Ulaşın</a>
          </div>
        </div>
        <!-- Mobilde başlıkta WhatsApp: telefon hattı gibi, satın almadan
             önce soru soran müşteri için en kısa yol. -->
        <a href="#" class="header-wa-btn" data-destek-whatsapp target="_blank" rel="noopener" aria-label="WhatsApp canlı destek"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.28A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.13c-1.6 0-3.13-.43-4.46-1.24l-.32-.19-3.12.76.78-3.05-.2-.31A8.13 8.13 0 1 1 20.17 12a8.14 8.14 0 0 1-8.13 8.13Zm4.47-6.08c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3s-.85.83-.85 2.02.87 2.35.99 2.51c.12.16 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z"/></svg></a>
        <button class="header-quick-btn" id="favoritesBtn" aria-label="Favorilerim">
          <span class="icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-10-9.3C0.4 8 2 4.5 5.6 4c2.1-0.3 4 0.7 6.4 3 2.4-2.3 4.3-3.3 6.4-3C21.9 4.5 23.6 8 22 11.2c-2.5 4.7-10 9.3-10 9.3z"></path></svg></span>
        </button>
        <button class="header-mobile-btn header-notif-btn" id="notifBtn" type="button" aria-label="Bildirimler" aria-expanded="false" aria-haspopup="menu">
          <span class="icon" id="ic-bell"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></span>
          <span class="notif-badge is-hidden" aria-hidden="true"></span>
        </button>
        <!-- Misafirde yalnızca giriş düğmesi; üyede profil (avatar). İkisi
             aynı anda görünmüyor (body.is-uye, style.css). -->
        <div class="header-actions">
          <button class="btn-primary" id="headerRegisterBtn">Giriş Yap<span class="header-register-long"> / Üye Ol</span></button>
        </div>
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

  <!-- Mobil alt menü: her sayfada (Keşfet, Favorilerim, Biletlerim,
       Hesabım). Düğmeleri app.js basıyor ve bulunulan sayfanınkini
       işaretliyor. 681px ve üstünde gizli. -->
  <nav class="bottom-tab-bar" aria-label="Alt menü"></nav>
`;

  /* Node'da (testler menü fonksiyonlarını yüklüyor) belge yok. */
  if (typeof document === "undefined") return;
  const script = document.currentScript;
  if (!script) return;

  /* data-root sayfanin koke uzakligi. Anasayfada bos, tur sayfasinda
     "../../". Cercevedeki butun goreli yollar koke gore yazildigi icin
     (assets/, turlar/, kurumsal/, ./ …) hepsi onekleniyor; tam adresler
     (https:, tel:), # ve / ile baslayanlar dokunulmadan kaliyor. */
  const kok = (document.body && document.body.getAttribute("data-root")) || "";
  const markup = siteCerceveOneki(SITE_CHROME_MARKUP, kok);

  script.insertAdjacentHTML("afterend", markup);

  /* Menü ağacı taksonomi dosyası yüklendikten sonra basılıyor (o dosya
     sayfanın sonunda). */
  const doldur = () => siteMenuDoldur(kok);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", doldur);
  else doldur();
})();

/* Çerçevedeki göreli yolları sayfa köküne göre önekle (data-root). */
function siteCerceveOneki(markup, kok) {
  if (!kok) return markup;
  return markup.replace(/(src|href)="(?![a-z][a-z0-9+.-]*:|#|\/)([^"]*)"/gi, (m, nitelik, yol) =>
    nitelik + '="' + kok + (yol === "./" ? "" : yol) + '"');
}

/* ---------------- ana menü ----------------
   Menü ağacı TEK kaynaktan: taxonomy-data.js/TAXONOMY_MENU. Sol menüde
   (mobil çekmece ve masaüstü sol menü) üst satırlar ikonlu düğme, alt
   sayfalar düğmenin altında açılan liste. grup: 'destek' işaretli
   satırlar (Blog360, Kurumsal) "Yardım & Destek" bölümünde.

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

/* Üst satırların ikonları; yolun ilk parçasına göre. Listede olmayan
   satır genel ikonla çiziliyor. */
const SITE_MENU_IKON_BAS = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';
const SITE_MENU_IKONLAR = {
  turlar: '<circle cx="12" cy="12" r="9"></circle><polygon points="15 9 13 13 9 15 11 11"></polygon>',
  oteller: '<path d="M3.5 11 12 3.5 20.5 11"></path><path d="M5.5 9.8V20h13V9.8"></path><path d="M10 20v-5h4v5"></path>',
  aktiviteler: '<path d="M3 20 9.5 9.5l3.5 5.5 2.5-3.5L21 20Z"></path><path d="M9.5 9.5V4l4.5 1.8-4.5 1.8"></path>',
  etkinlikler: '<path d="M3 8.5A2 2 0 0 1 5 6.5h14a2 2 0 0 1 2 2v2a2.2 2.2 0 0 0 0 4.4v2A2 2 0 0 1 19 19H5a2 2 0 0 1-2-2v-2a2.2 2.2 0 0 0 0-4.4z"></path><line x1="9.5" y1="6.5" x2="9.5" y2="19" stroke-dasharray="2.2 2.2"></line>',
  mekanlar: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="2.6"></circle>',
  firsatlar: '<line x1="19" y1="5" x2="5" y2="19"></line><circle cx="7" cy="7" r="2.4"></circle><circle cx="17" cy="17" r="2.4"></circle>',
  "yeni-eklenenler": '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"></polygon>',
  "bu-hafta": '<rect x="3" y="5" width="18" height="16" rx="2.5"></rect><line x1="8" y1="3" x2="8" y2="7.5"></line><line x1="16" y1="3" x2="16" y2="7.5"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
  blog: '<path d="M4 5.5h11a2 2 0 0 1 2 2v13l-3-2-3 2-3-2-3 2v-13a2 2 0 0 1 2-2Z"></path><line x1="7.5" y1="9" x2="13.5" y2="9"></line><line x1="7.5" y1="12.2" x2="13.5" y2="12.2"></line>',
  kurumsal: '<path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5V21"></path><path d="M16 10h2.5a1.5 1.5 0 0 1 1.5 1.5V21"></path><line x1="3" y1="21" x2="21" y2="21"></line><line x1="8" y1="8" x2="12" y2="8"></line><line x1="8" y1="12" x2="12" y2="12"></line><line x1="8" y1="16" x2="12" y2="16"></line>',
  genel: '<circle cx="12" cy="12" r="9"></circle><line x1="8" y1="12" x2="16" y2="12"></line>'
};
function siteMenuIkonu(yol) {
  const bas = String(yol || "").split("/")[0];
  return '<span class="icon">' + SITE_MENU_IKON_BAS + (SITE_MENU_IKONLAR[bas] || SITE_MENU_IKONLAR.genel) + "</svg></span>";
}

/* Satır bulunulan sayfa ya da onun altı mı: /turlar/ege-turlari/ Turlar
   düğmesini, /tur/efes-sirince/ de (tur tipi turlar altında) işaretler. */
function siteMenuBolumu(simdiki, dugum, tipler) {
  if (!simdiki) return false;
  const bas = String(dugum.path || "").split("/")[0];
  const ilk = simdiki.split("/")[0];
  if (ilk === bas) return true;
  const tip = Object.keys(tipler || {}).find(t => tipler[t].base === bas);
  return !!tip && tipler[tip].path === ilk;
}

/* Sol menü: üst satırlar ikonlu düğme; alt sayfaları olan satır
   details/summary ile açılıyor (JS gerekmez). */
function siteMenuAgac(menu, kok, simdiki, tipler) {
  const dal = (d, derin) => {
    const cocuk = d.children || [];
    const ust = derin === 0;
    const bolum = ust && siteMenuBolumu(simdiki, d, tipler);
    const icerik = ust ? siteMenuIkonu(d.path) + '<span class="smt-ad">' + siteMenuKacis(d.label) + "</span>" : siteMenuKacis(d.label);
    if (!cocuk.length) {
      return '<a class="' + (ust ? "smt-top" + (bolum ? " is-current" : "") : "smt-link") + '" href="' + siteMenuHref(kok, d.path) + '"'
        + (d.path === simdiki ? ' aria-current="page"' : "") + ">" + icerik + "</a>";
    }
    /* Düğümün kendi sayfası çocuklarda yoksa en üste "Tümü" bağı. */
    const kendisi = cocuk.some(c => c.path === d.path) ? ""
      : '<a class="smt-link smt-all" href="' + siteMenuHref(kok, d.path) + '">Tüm ' + siteMenuKacis(d.label) + "</a>";
    return '<details class="smt-group smt-level-' + derin + (bolum ? " is-current" : "") + '">'
      + "<summary" + (ust ? ' class="smt-top"' : "") + ">" + icerik + "</summary>"
      + '<div class="smt-body">' + kendisi + cocuk.map(c => dal(c, derin + 1)).join("") + "</div></details>";
  };
  return (menu || []).filter(d => d.grup !== "destek").map(d => dal(d, 0)).join("");
}

/* "Yardım & Destek" bölümündeki taksonomi satırları (Blog360, Kurumsal):
   bölümün diğer bağlarıyla aynı düğme. Kurumsal'ın alt sayfaları kendi
   sayfasındaki kurumsal menüde. */
function siteMenuDestek(menu, kok, simdiki) {
  return (menu || []).filter(d => d.grup === "destek").map(d =>
    '<a class="sidebar-link" href="' + siteMenuHref(kok, d.path) + '"'
      + (d.path === simdiki ? ' aria-current="page"' : "") + ">" + siteMenuIkonu(d.path)
      + siteMenuKacis(d.label) + "</a>").join("");
}

function siteMenuDoldur(kok) {
  const menu = (typeof TAXONOMY_MENU !== "undefined") ? TAXONOMY_MENU : null;
  const tipler = (typeof TAXONOMY_TYPES !== "undefined") ? TAXONOMY_TYPES : {};
  if (!menu) return;
  const simdiki = siteMenuSimdikiYol(kok);
  document.querySelectorAll("[data-site-menu]").forEach(el => {
    el.innerHTML = siteMenuAgac(menu, kok, simdiki, tipler);
  });
  document.querySelectorAll("[data-site-destek]").forEach(el => {
    el.innerHTML = siteMenuDestek(menu, kok, simdiki);
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { siteMenuHref, siteMenuAgac, siteMenuDestek, siteMenuBolumu, siteCerceveOneki };
}
