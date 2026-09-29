/* ---------------- Hesabım paneli ----------------
   /hesabim/ — TEK panel (talimat: "hepsi aynı dashboard içinde"). Bölüm
   adres satırında: /hesabim/?bolum=biletlerim. Bölüm değişince sayfa
   yenilenmiyor (history.pushState); geri tuşu önceki bölüme döner.

   Veri MolaVeri.hesapPaneli()'nden (tek çağrı), kurallar
   account-engine.js'te. Bu dosya yalnızca ekran.

   ADLAR: üst seviye adlar HSA_ / hsa ile başlıyor. */

const HSA_BOLUMLER = [
  /* Misafirde iki sekme: Genel Bakış (giriş ve rezervasyon bulma) ve
     Favorilerim; tek başına duran "Favorilerim" çipi boş görünüyordu. */
  { id: 'genel', ad: 'Genel Bakış', misafir: true },
  { id: 'rezervasyonlarim', ad: 'Rezervasyonlarım' },
  { id: 'biletlerim', ad: 'Biletlerim' },
  { id: 'favorilerim', ad: 'Favorilerim', misafir: true },
  { id: 'kuponlarim', ad: 'Kuponlarım' },
  { id: 'puanlarim', ad: 'Mola Puanlarım' },
  { id: 'seviye', ad: 'Üyelik Seviyem' },
  { id: 'yorumlarim', ad: 'Yorumlarım' },
  { id: 'bildirimlerim', ad: 'Bildirimlerim' },
  { id: 'bilgilerim', ad: 'Kişisel Bilgilerim' },
  { id: 'odeme', ad: 'Ödeme Yöntemlerim' },
  { id: 'ayarlar', ad: 'Ayarlar' }
];
const HSA_DURUM = { yaklasan: 'Yaklaşan', tamamlandi: 'Tamamlandı', iptal: 'İptal edildi' };
const HSA_TIP = { tour: 'Tur', hotel: 'Otel', activity: 'Aktivite', event: 'Etkinlik', venue: 'Mekân' };

const HSA_NODE = (typeof require === 'function' && typeof module !== 'undefined' && module.exports);
const HSA_MODUL = HSA_NODE ? Object.assign({}, require('./booking-engine.js'), require('./qr-code.js')) : null;
function hsaFn(ad) {
  if (HSA_MODUL && typeof HSA_MODUL[ad] === 'function') return HSA_MODUL[ad];
  const g = (typeof globalThis !== 'undefined') ? globalThis : {};
  return typeof g[ad] === 'function' ? g[ad] : null;
}
function hsaKacis(m) {
  return String(m === undefined || m === null ? '' : m)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function hsaPara(n) { const f = hsaFn('rezPara'); return f ? f(n) : n + ' TL'; }
function hsaTarih(iso, yilsiz) { const f = hsaFn('rezTarihMetni'); return f ? f(iso, yilsiz) : String(iso || ''); }
function hsaUrunYolu(tip, slug) {
  const yol = { tour: 'tur', hotel: 'otel', activity: 'aktivite', event: 'etkinlik', venue: 'mekan' }[tip];
  return yol ? yol + '/' + slug + '/' : '';
}
function hsaBolum(id) { return HSA_BOLUMLER.find(b => b.id === id) || HSA_BOLUMLER[0]; }
function hsaBos(baslik, metin, bag) {
  return '<div class="hsa-empty"><strong>' + hsaKacis(baslik) + '</strong><p>' + hsaKacis(metin) + '</p>'
    + (bag ? '<a class="btn-primary hsa-btn" href="' + bag.href + '">' + hsaKacis(bag.ad) + '</a>' : '') + '</div>';
}

/* ---------------- saf işaretleme ---------------- */
function hsaNavMarkup(aktif, uye) {
  return '<nav class="hsa-nav" aria-label="Hesap bölümleri"><ul>'
    + HSA_BOLUMLER.filter(b => uye || b.misafir).map(b => '<li><a href="hesabim/?bolum=' + b.id + '" data-bolum="' + b.id + '"'
      + (b.id === aktif ? ' class="is-active" aria-current="page"' : '') + '>' + hsaKacis(b.ad) + '</a></li>').join('')
    + '</ul></nav>';
}

function hsaRezervasyonOzet(r) {
  const b = r.baslangic || {};
  const tarih = b.bitis ? hsaTarih(b.tarih, true) + ' – ' + hsaTarih(b.bitis, true) : hsaTarih(b.tarih, true) + (b.saat ? ' · ' + b.saat : '');
  return tarih;
}

function hsaGenelMarkup(p, simdi) {
  const h = p.hesap;
  const yaklasan = p.rezervasyonlar.filter(r => r.durumu === 'yaklasan');
  const sonraki = yaklasan[0] || null;
  const gecerliKupon = p.kuponlar.filter(k => k.durum === 'gecerli' && k.kisisel).length;
  const sv = p.puan.seviye;
  let html = '<p class="hsa-lead">Merhaba ' + hsaKacis(h.ad) + '. Hesabının özeti:</p><div class="hsa-tiles">';
  html += '<a class="hsa-tile hsa-tile-wide" href="hesabim/?bolum=' + (sonraki ? 'biletlerim' : 'rezervasyonlarim') + '" data-bolum="' + (sonraki ? 'biletlerim' : 'rezervasyonlarim') + '">'
    + '<span class="hsa-tile-label">Sıradaki plan</span>'
    + (sonraki
      ? '<strong>' + hsaKacis(sonraki.baslik) + '</strong><span>' + hsaKacis(hsaRezervasyonOzet(sonraki)) + '</span>'
      : '<strong>Yaklaşan rezervasyonun yok</strong><span>Yeni bir plan için turlara ve etkinliklere göz at.</span>')
    + '</a>';
  html += '<a class="hsa-tile" href="hesabim/?bolum=puanlarim" data-bolum="puanlarim"><span class="hsa-tile-label">Molapuan</span><strong>' + p.puan.bakiye + '</strong>'
    + '<span>' + (p.puan.bekleyen ? p.puan.bekleyen + ' puan tur sonrası gelecek' : sv.seviye.ad + ' seviye') + '</span></a>';
  html += '<a class="hsa-tile" href="hesabim/?bolum=rezervasyonlarim" data-bolum="rezervasyonlarim"><span class="hsa-tile-label">Rezervasyon</span><strong>' + p.rezervasyonlar.length + '</strong><span>' + yaklasan.length + ' yaklaşan</span></a>';
  html += '<a class="hsa-tile" href="hesabim/?bolum=kuponlarim" data-bolum="kuponlarim"><span class="hsa-tile-label">Kupon</span><strong>' + gecerliKupon + '</strong><span>kullanılabilir kişisel kupon</span></a>';
  html += '<a class="hsa-tile" href="hesabim/?bolum=favorilerim" data-bolum="favorilerim"><span class="hsa-tile-label">Favori</span><strong>' + p.favoriler.length + '</strong><span>kaydedilen ürün</span></a>';
  html += '</div>';
  const okunmamis = (p.bildirimler || []).filter(n => n.unread).slice(0, 3);
  if (okunmamis.length) {
    html += '<h3 class="hsa-subtitle">Son bildirimler</h3>' + hsaBildirimListesi(okunmamis);
  }
  return html;
}

function hsaRezervasyonKart(r) {
  const o = r.odeme || {};
  const ip = r.iptalOnizleme || {};
  let odeme = '';
  if (o.sekil === 'kapora') {
    odeme = 'Kapora ' + hsaPara(o.simdi) + ' · kalan ' + hsaPara(o.kalan) + ' ' + (o.kalanTercih === 'aracta' ? 'tur günü araçta' : 'turdan 1 gün önce');
  } else if (o.sekil === 'mekanda') {
    odeme = 'Ödeme mekânda · ' + hsaPara(o.kalan);
  } else {
    odeme = 'Tamamı · ' + hsaPara(o.simdi);
  }
  const eylem = [];
  eylem.push('<a class="hsa-link" href="rezervasyon/onay/?kod=' + encodeURIComponent(r.kod) + '">Ayrıntı</a>');
  if (r.durumu === 'yaklasan') eylem.push('<a class="hsa-link" href="hesabim/?bolum=biletlerim#' + hsaKacis(r.kod) + '" data-bolum="biletlerim">Biletler</a>');
  if (r.yorumYazilabilir) eylem.push('<a class="hsa-link" href="hesabim/?bolum=yorumlarim" data-bolum="yorumlarim">Yorum yaz</a>');
  if (r.durumu === 'yaklasan' && ip.mumkun) eylem.push('<button type="button" class="hsa-link hsa-link-danger" data-iptal-ac="' + hsaKacis(r.kod) + '">İptal et</button>');
  return '<article class="hsa-card hsa-rez" id="rez-' + hsaKacis(r.kod) + '">'
    + '<div class="hsa-rez-head"><span class="hsa-badge hsa-badge-' + r.durumu + '">' + (HSA_DURUM[r.durumu] || '') + '</span>'
    + '<span class="hsa-rez-kod">' + hsaKacis(r.kod) + '</span></div>'
    + '<h3><a href="' + hsaUrunYolu(r.tip, r.slug) + '">' + hsaKacis(r.baslik) + '</a></h3>'
    + '<p class="hsa-rez-date">' + hsaKacis(HSA_TIP[r.tip] || '') + ' · ' + hsaKacis(hsaRezervasyonOzet(r)) + '</p>'
    + '<p class="hsa-rez-pay">Toplam ' + hsaPara(r.toplam) + ' · ' + hsaKacis(odeme) + '</p>'
    + (r.iptalBilgisi ? '<p class="hsa-rez-note">İptal edildi' + (r.iptalBilgisi.iade ? '; ' + hsaPara(r.iptalBilgisi.iade) + ' iade edilecek.' : '; iade yok.') + '</p>' : '')
    + (r.deneme ? '<p class="hsa-rez-note">Deneme kaydı: ödeme alınmadı.</p>' : '')
    + '<div class="hsa-rez-actions">' + eylem.join('') + '</div>'
    + (r.durumu === 'yaklasan' && ip.mumkun
      ? '<div class="hsa-confirm" data-iptal-kutu="' + hsaKacis(r.kod) + '" hidden><p>Şimdi iptal edersen ödediğin '
        + hsaPara(ip.odenen) + ' içinden <strong>' + hsaPara(ip.iade) + '</strong> iade edilir'
        + (ip.kademe && ip.kademe.etiket ? ' (' + hsaKacis(ip.kademe.etiket) + ')' : '') + '.</p>'
        + '<div class="hsa-confirm-actions"><button type="button" class="hsa-btn-danger" data-iptal-onay="' + hsaKacis(r.kod) + '">İptal et</button>'
        + '<button type="button" class="hsa-btn-ghost" data-iptal-vazgec="' + hsaKacis(r.kod) + '">Vazgeç</button></div></div>'
      : '')
    + '</article>';
}

function hsaRezervasyonlarMarkup(p, sekme) {
  const s = ['yaklasan', 'tamamlandi', 'iptal'].indexOf(sekme) === -1 ? 'yaklasan' : sekme;
  const say = (d) => p.rezervasyonlar.filter(r => r.durumu === d).length;
  const liste = p.rezervasyonlar.filter(r => r.durumu === s);
  if (s === 'tamamlandi' || s === 'iptal') liste.reverse();
  return '<div class="hsa-tabs" role="tablist">'
    + [['yaklasan', 'Yaklaşan'], ['tamamlandi', 'Geçmiş'], ['iptal', 'İptal']].map(([id, ad]) =>
      '<button type="button" role="tab" data-sekme="' + id + '" aria-selected="' + (id === s) + '" class="hsa-tab' + (id === s ? ' is-active' : '') + '">'
      + ad + ' <span>' + say(id) + '</span></button>').join('')
    + '</div>'
    + (liste.length ? '<div class="hsa-list">' + liste.map(hsaRezervasyonKart).join('') + '</div>'
      : hsaBos(s === 'yaklasan' ? 'Yaklaşan rezervasyonun yok' : 'Burada rezervasyon yok',
        'Yaptığın rezervasyonlar ve aynı e-postayla verdiğin rezervasyonlar burada görünür.', s === 'yaklasan' ? { href: './', ad: 'Keşfetmeye başla' } : null));
}

function hsaBiletlerMarkup(p) {
  const svg = hsaFn('karekodSvg');
  if (!p.biletler.length) return hsaBos('Aktif biletin yok', 'Yaklaşan rezervasyonlarının karekodlu biletleri burada durur.', { href: './', ad: 'Keşfetmeye başla' });
  let onceki = null;
  return '<p class="hsa-lead">Girişte ya da araçta karekodu göster. Ekran parlaklığını artırmak okumayı hızlandırır.</p>'
    + '<div class="hsa-tickets">' + p.biletler.map(b => {
      const baslik = b.kod !== onceki ? ' id="' + hsaKacis(b.kod) + '"' : '';
      onceki = b.kod;
      return '<article class="hsa-ticket"' + baslik + '>'
        + '<div class="hsa-ticket-qr">' + (svg ? svg(b.no, 'Bilet karekodu ' + b.no) : '') + (b.deneme ? '<span class="hsa-ticket-stamp">DENEME</span>' : '') + '</div>'
        + '<div class="hsa-ticket-body"><span class="hsa-type">' + hsaKacis(b.tur) + '</span>'
        + '<h3>' + hsaKacis(b.baslik) + '</h3>'
        + '<p>' + hsaKacis(hsaTarih(b.tarih)) + (b.saat ? ' · ' + hsaKacis(b.saat) : '') + '</p>'
        + (b.ad ? '<p class="hsa-ticket-name">' + hsaKacis(b.ad) + '</p>' : '')
        + '<p class="hsa-ticket-no">' + hsaKacis(b.no) + '</p>'
        + (b.deneme ? '<p class="hsa-ticket-note">Ödeme alınmadığı için bu bilet geçerli değil.</p>' : '')
        + '</div></article>';
    }).join('') + '</div>'
    + '<button type="button" class="hsa-btn-ghost hsa-print" data-yazdir>Biletleri yazdır</button>';
}

function hsaFavorilerMarkup(favoriler, bugun) {
  if (!favoriler.length) {
    return hsaBos('Favorin yok', 'Kartlardaki ve ürün sayfalarındaki kalp simgesiyle ürünleri buraya kaydedebilirsin.', { href: './', ad: 'Keşfet' });
  }
  const kartlar = (typeof lspKartlarMarkup === 'function')
    ? lspKartlarMarkup(favoriler.map(f => ({ type: f.tip, kayit: f.kayit })), bugun) : '';
  return '<div class="lst-grid hsa-fav-grid">' + (kartlar || favoriler.map(f =>
    '<a class="hsa-card" href="' + hsaUrunYolu(f.tip, f.slug) + '">' + hsaKacis(f.kayit.title) + '</a>').join('')) + '</div>';
}

function hsaKuponlarMarkup(kuponlar) {
  const durum = { gecerli: 'Kullanılabilir', kullanildi: 'Kullanıldı', 'suresi-doldu': 'Süresi doldu' };
  if (!kuponlar.length) return hsaBos('Kuponun yok', 'Kampanyalar sayfasında yürürlükteki indirimleri görebilirsin.', { href: 'kampanyalar/', ad: 'Kampanyalar' });
  return '<p class="hsa-lead">Kuponu ödeme adımındaki "Kupon kodu" alanına yaz. Otomatik kampanyalar ayrıca kendiliğinden uygulanır.</p>'
    + '<div class="hsa-coupons">' + kuponlar.map(k => '<article class="hsa-coupon is-' + k.durum + '">'
      + '<div class="hsa-coupon-code"><strong>' + hsaKacis(k.kod) + '</strong>'
      + (k.durum === 'gecerli' ? '<button type="button" class="hsa-link" data-kopyala="' + hsaKacis(k.kod) + '">Kopyala</button>' : '') + '</div>'
      + '<h3>' + hsaKacis(k.ad) + '</h3>'
      + (k.aciklama ? '<p>' + hsaKacis(k.aciklama) + '</p>' : '')
      + '<p class="hsa-coupon-meta"><span class="hsa-badge hsa-badge-' + k.durum + '">' + (durum[k.durum] || '') + '</span>'
      + (k.kisisel ? ' Kişiye özel' : ' Herkese açık') + (k.sonGun ? ' · son gün ' + hsaKacis(hsaTarih(k.sonGun, false)) : '')
      + (k.kullanildi ? ' · ' + hsaKacis(k.kullanildi) : '') + '</p></article>').join('') + '</div>';
}

function hsaPuanMarkup(puan) {
  const durum = { kazanildi: 'Kazanıldı', bekliyor: 'Tur sonrası', iptal: 'İptal' };
  return '<div class="hsa-tiles"><div class="hsa-tile"><span class="hsa-tile-label">Bakiye</span><strong>' + puan.bakiye + '</strong><span>Molapuan</span></div>'
    + '<div class="hsa-tile"><span class="hsa-tile-label">Bekleyen</span><strong>' + puan.bekleyen + '</strong><span>tur tamamlanınca eklenecek</span></div></div>'
    + '<p class="hsa-lead">Molapuan tura katılınca kazanılır; her turun puanı kendi sayfasında. Puanla ödeme kuralı belirlenince ödeme adımına eklenecek.</p>'
    + (puan.hareketler.length
      ? '<ul class="hsa-ledger">' + puan.hareketler.map(h => '<li><span><strong>' + hsaKacis(h.baslik) + '</strong><small>'
        + hsaKacis(h.kod) + ' · ' + hsaKacis(hsaTarih(h.tarih, true)) + '</small></span><span class="hsa-ledger-amount is-' + h.durum + '">'
        + (h.durum === 'iptal' ? '' : '+') + h.puan + '<small>' + durum[h.durum] + '</small></span></li>').join('') + '</ul>'
      : hsaBos('Henüz puan hareketin yok', 'Turlarımıza katıldıkça puanların burada birikir.', { href: 'turlar/', ad: 'Turlar' }));
}

function hsaSeviyeMarkup(puan, seviyeler) {
  const sv = puan.seviye;
  return '<div class="hsa-level"><span class="hsa-tile-label">Seviyen</span><strong>' + hsaKacis(sv.seviye.ad) + '</strong>'
    + (sv.sonraki ? '<p>' + hsaKacis(sv.sonraki.ad) + ' seviyesine ' + sv.kalan + ' puan kaldı.</p>' : '<p>En üst seviyedesin.</p>')
    + '<div class="hsa-progress"><span style="width:' + Math.round(sv.ilerleme * 100) + '%"></span></div></div>'
    + '<table class="hsa-table"><thead><tr><th scope="col">Seviye</th><th scope="col">Kazanılmış puan</th></tr></thead><tbody>'
    + (seviyeler || []).map(s => '<tr' + (s.id === sv.seviye.id ? ' class="is-current"' : '') + '><td>' + hsaKacis(s.ad) + '</td><td>' + s.enAz + '+</td></tr>').join('')
    + '</tbody></table><p class="hsa-note">Eşikler örnek; seviye avantajları belirlenince burada yazacak.</p>';
}

function hsaYorumlarMarkup(p) {
  const bekleyen = p.rezervasyonlar.filter(r => r.yorumYazilabilir);
  let html = '';
  if (bekleyen.length) {
    html += '<h3 class="hsa-subtitle">Yorum bekleyen</h3>' + bekleyen.map(r => '<form class="hsa-card hsa-review-form" data-yorum="' + hsaKacis(r.kod) + '">'
      + '<h3>' + hsaKacis(r.baslik) + '</h3><p class="hsa-rez-date">' + hsaKacis(hsaRezervasyonOzet(r)) + '</p>'
      + '<fieldset class="hsa-stars"><legend>Puanın</legend>' + [1, 2, 3, 4, 5].map(n =>
        '<label><input type="radio" name="puan" value="' + n + '"><span aria-hidden="true">★</span><span class="lst-visually-hidden">' + n + ' yıldız</span></label>').join('') + '</fieldset>'
      + '<label class="odm-field"><span>Yorumun</span><textarea name="metin" rows="3" maxlength="1000" placeholder="Rehber, program, ulaşım… (en az 20 karakter)"></textarea></label>'
      + '<p class="hsa-error" data-yorum-hata></p><button type="submit" class="btn-primary hsa-btn">Gönder</button></form>').join('');
  }
  html += '<h3 class="hsa-subtitle">Yorumlarım</h3>' + (p.yorumlar.length
    ? '<div class="hsa-list">' + p.yorumlar.map(y => '<article class="hsa-card"><div class="hsa-rez-head"><span class="hsa-badge">Onay bekliyor</span>'
      + '<span class="hsa-stars-read" aria-label="' + y.puan + ' yıldız">' + '★'.repeat(y.puan) + '<span>' + '★'.repeat(5 - y.puan) + '</span></span></div>'
      + '<h3>' + hsaKacis(y.baslik) + '</h3><p>' + hsaKacis(y.metin) + '</p></article>').join('') + '</div>'
    : '<p class="hsa-lead">Tamamlanan rezervasyonlarına yorum yazabilirsin. Yorumlar yayına girmeden önce incelenir.</p>');
  return html;
}

function hsaBildirimListesi(liste) {
  return '<ul class="hsa-notifs">' + liste.map(n => '<li class="' + (n.unread ? 'is-unread' : '') + '">'
    + '<a href="' + hsaKacis(n.href || 'hesabim/') + '" data-bildirim="' + hsaKacis(n.id) + '">'
    + '<span class="hsa-notif-meta">' + hsaKacis(n.time) + '</span><span>' + hsaKacis(n.title) + '</span></a></li>').join('') + '</ul>';
}

function hsaBildirimlerMarkup(liste) {
  if (!liste.length) return hsaBos('Bildirim yok', 'Rezervasyon, ödeme, kupon ve puan hatırlatmaların burada görünür.');
  return (liste.some(n => n.unread) ? '<button type="button" class="hsa-link" data-bildirim-hepsi>Tümünü okundu say</button>' : '')
    + hsaBildirimListesi(liste);
}

function hsaBilgilerMarkup(h) {
  const alan = (ad, etiket, deger, ek) => '<label class="odm-field"><span>' + etiket + '</span><input name="' + ad + '" value="' + hsaKacis(deger) + '" ' + (ek || '') + '>'
    + '<small class="odm-error" data-hata="' + ad + '"></small></label>';
  return '<form class="hsa-card hsa-form" data-bilgiler novalidate><div class="odm-row">'
    + alan('ad', 'Ad', h.ad, 'autocomplete="given-name" maxlength="50"') + alan('soyad', 'Soyad', h.soyad, 'autocomplete="family-name" maxlength="50"')
    + '</div><div class="odm-row">'
    + alan('eposta', 'E-posta', h.eposta, 'type="email" autocomplete="email" maxlength="120"') + alan('telefon', 'Cep telefonu', h.telefon, 'type="tel" autocomplete="tel" maxlength="20"')
    + '</div><p class="hsa-ok" data-kaydedildi role="status"></p><button type="submit" class="btn-primary hsa-btn">Kaydet</button></form>'
    + '<p class="hsa-note">Bu bilgiler ödeme adımında iletişim alanlarına kendiliğinden yazılır.</p>';
}

function hsaOdemeMarkup() {
  return '<div class="hsa-card"><h3>Kayıtlı kartın yok</h3>'
    + '<p>Kart bilgileri mola360\'ta tutulmaz. Kart kaydı, ödeme kuruluşunun güvenli kasasında (tokenizasyon) ödeme altyapısı bağlandığında açılacak; burada yalnızca kartın son dört hanesi ve ailesi görünecek.</p></div>';
}

function hsaAyarlarMarkup(h) {
  const izin = h.izinler || {};
  return '<div class="hsa-card"><h3>İletişim izinleri</h3>'
    + '<label class="odm-check"><input type="checkbox" data-izin="eposta"' + (izin.eposta ? ' checked' : '') + '><span>Kampanya ve fırsat e-postaları almak istiyorum.</span></label>'
    + '<label class="odm-check"><input type="checkbox" data-izin="sms"' + (izin.sms ? ' checked' : '') + '><span>Kampanya SMS\'leri almak istiyorum.</span></label>'
    + '<p class="hsa-note">Rezervasyon, ödeme ve iptal bildirimleri izinden bağımsız gönderilir.</p></div>'
    + '<div class="hsa-card"><h3>Şifre ve güvenlik</h3><p>Deneme sürümünde şifre yok: hesap bu tarayıcıda tutuluyor. Gerçek girişte e-posta doğrulaması ve şifre ya da tek kullanımlık kod olacak.</p></div>'
    + '<div class="hsa-card"><h3>Oturum</h3><button type="button" class="hsa-btn-ghost" data-cikis>Çıkış yap</button></div>'
    + '<div class="hsa-card"><h3>Hesabı sil</h3><p>Hesap ve kişisel kuponların bu tarayıcıdan silinir; rezervasyon kayıtları satış kaydı olarak kalır.</p>'
    + '<button type="button" class="hsa-btn-danger" data-sil-ac>Hesabı sil</button>'
    + '<div class="hsa-confirm" data-sil-kutu hidden><p>Emin misin? Bu işlem geri alınamaz.</p><div class="hsa-confirm-actions">'
    + '<button type="button" class="hsa-btn-danger" data-sil-onay>Evet, sil</button><button type="button" class="hsa-btn-ghost" data-sil-vazgec>Vazgeç</button></div></div></div>';
}

/* Yeni üye kampanyası metni yürürlükteki kampanyadan (menüdeki kart ve
   liste bandıyla aynı kaynak); kampanya yoksa cümle yok. */
function hsaUyelikKampanyasi(bugun) {
  if (typeof MolaVeri === 'undefined' || !MolaVeri.kampanyalar) return '';
  const k = MolaVeri.kampanyalar(bugun || new Date()).find(x => x.uyeOzel && x.ilkRezervasyon);
  return k ? ' ' + hsaKacis(k.etiket) + ': ' + hsaKacis(k.ad) + '.' : '';
}

function hsaMisafirMarkup(bugun) {
  return '<section class="hsa-guest"><h2>Hesabına giriş yap</h2>'
    + '<p>Rezervasyonların, karekodlu biletlerin, kuponların ve Molapuanın tek yerde.' + hsaUyelikKampanyasi(bugun) + '</p>'
    + '<div class="hsa-guest-actions"><button type="button" class="btn-primary hsa-btn" data-giris="login">Giriş yap</button>'
    + '<button type="button" class="hsa-btn-ghost" data-giris="register">Üye ol</button></div></section>'
    + '<section class="hsa-card"><h3>Rezervasyonunu bul</h3><p>Üye olmadan yaptığın rezervasyonu kod ve e-postayla görüntüle.</p>'
    + '<form class="hsa-find" data-sorgula novalidate><div class="odm-row">'
    + '<label class="odm-field"><span>Rezervasyon kodu</span><input name="kod" placeholder="M360-XXXXXX" autocomplete="off" maxlength="12"></label>'
    + '<label class="odm-field"><span>E-posta</span><input name="eposta" type="email" autocomplete="email"></label>'
    + '</div><p class="hsa-error" data-sorgu-sonuc role="status"></p><button type="submit" class="hsa-btn-ghost">Bul</button></form></section>';
}

/* ---------------- ekran ---------------- */
function hsaKur(kok, adres, bugun) {
  if (typeof document === 'undefined' || typeof MolaVeri === 'undefined') return null;
  if (typeof lspMetaYaz === 'function') lspMetaYaz({ title: 'Hesabım — mola360', description: 'Rezervasyonların, biletlerin, kuponların ve Molapuanın.', noindex: true, canonical: null });
  const baslangicBolumu = (adres && adres.bolum) || new URLSearchParams(location.search).get('bolum') || 'genel';
  if (adres && adres.bolum) history.replaceState(history.state, '', 'hesabim/?bolum=' + adres.bolum + location.hash);
  let bolum = hsaBolum(baslangicBolumu).id;
  let sekme = 'yaklasan';
  let panel = null;

  function iskelet() {
    const uye = !!(panel && panel.hesap);
    const b = hsaBolum(bolum);
    kok.innerHTML = (typeof lspMobilBaslikMarkup === 'function' ? lspMobilBaslikMarkup('Hesabım', uye ? b.ad : 'mola360', '') : '')
      + '<main class="hsa-page" id="hsaPage">'
      + (typeof lspKirintiMarkup === 'function' ? lspKirintiMarkup([{ name: 'Anasayfa', path: '' }, { name: 'Hesabım', path: 'hesabim' }]) : '')
      + '<header class="hsa-head"><div class="hsa-avatar" aria-hidden="true">' + hsaKacis(uye ? (panel.hesap.ad.charAt(0) + panel.hesap.soyad.charAt(0)).toLocaleUpperCase('tr-TR') : '') + '</div>'
      + '<div><h1>' + (uye ? hsaKacis(panel.hesap.ad + ' ' + panel.hesap.soyad) : 'Hesabım') + '</h1>'
      + (uye ? '<p>' + hsaKacis(panel.hesap.eposta) + ' · ' + hsaKacis(panel.puan.seviye.seviye.ad) + ' · ' + panel.puan.bakiye + ' Molapuan</p>' : '')
      + '</div></header>'
      + (uye ? '<p class="hsa-demo">Deneme sürümü: hesap ve rezervasyonlar bu tarayıcıda tutuluyor; ödeme alınmıyor.</p>' : '')
      + '<div class="hsa-layout">' + hsaNavMarkup(bolum, uye) + '<section class="hsa-main" id="hsaMain" aria-live="polite"></section></div></main>';
    ciz();
  }

  function ciz() {
    const ana = document.getElementById('hsaMain');
    if (!ana) return;
    const uye = !!panel.hesap;
    const b = hsaBolum(bolum);
    document.querySelectorAll('.hsa-nav a').forEach(a => {
      const aktif = a.getAttribute('data-bolum') === bolum;
      a.classList.toggle('is-active', aktif);
      if (aktif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const sub = document.getElementById('lstMobileSub');
    if (sub) sub.textContent = uye ? b.ad : 'mola360';
    let icerik;
    if (!uye) {
      icerik = bolum === 'favorilerim'
        ? '<h2 class="hsa-title">Favorilerim</h2><p class="hsa-lead">Favorilerin bu tarayıcıda duruyor; üye olunca hesabınla birlikte görünür.</p>' + hsaFavorilerMarkup(panel.favoriler, bugun)
        : hsaMisafirMarkup(bugun) + (panel.favoriler.length ? '<h2 class="hsa-title">Favorilerim</h2>' + hsaFavorilerMarkup(panel.favoriler, bugun) : '');
    } else {
      const baslik = '<h2 class="hsa-title">' + hsaKacis(b.ad) + '</h2>';
      const seviyeler = (typeof HSP_SEVIYELER !== 'undefined') ? HSP_SEVIYELER : [];
      icerik = baslik + ({
        genel: () => hsaGenelMarkup(panel, bugun),
        rezervasyonlarim: () => hsaRezervasyonlarMarkup(panel, sekme),
        biletlerim: () => hsaBiletlerMarkup(panel),
        favorilerim: () => hsaFavorilerMarkup(panel.favoriler, bugun),
        kuponlarim: () => hsaKuponlarMarkup(panel.kuponlar),
        puanlarim: () => hsaPuanMarkup(panel.puan),
        seviye: () => hsaSeviyeMarkup(panel.puan, seviyeler),
        yorumlarim: () => hsaYorumlarMarkup(panel),
        bildirimlerim: () => hsaBildirimlerMarkup(panel.bildirimler),
        bilgilerim: () => hsaBilgilerMarkup(panel.hesap),
        odeme: () => hsaOdemeMarkup(),
        ayarlar: () => hsaAyarlarMarkup(panel.hesap)
      }[bolum] || (() => ''))();
    }
    ana.innerHTML = icerik;
    if (typeof mola360KalpleriBoya === 'function') mola360KalpleriBoya(ana);
    if (location.hash) {
      const hedef = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (hedef) hedef.scrollIntoView({ block: 'start' });
    }
  }

  function yukle() {
    return MolaVeri.hesapPaneli(new Date()).then(p => {
      panel = p;
      if (!p.hesap && !hsaBolum(bolum).misafir) bolum = 'genel';
      iskelet();
      return p;
    });
  }

  function git(yeni, itme) {
    bolum = hsaBolum(yeni).id;
    if (itme) history.pushState({ bolum }, '', 'hesabim/?bolum=' + bolum);
    ciz();
    if (itme) menuyuGoster();
  }

  /* Bölüm değişince sayfa AŞAĞI kaymaz. Yalnızca bölüm menüsü yapışkan
     başlığın altında kaldıysa (içeriğin aşağısındaki bir bağla gelindiyse)
     menü görünecek kadar yukarı çıkılır. Mobildeki yatay şeritte seçilen
     düğme ortaya alınır; bu da dikey kaydırma yapmaz. */
  function menuyuGoster() {
    const duzen = kok.querySelector('.hsa-layout');
    if (!duzen) return;
    const baslikAlti = ['.lst-mobile-header', '.site-header'].reduce((enAlt, sec) => {
      const el = document.querySelector(sec);
      if (!el || !el.offsetHeight || !/fixed|sticky/.test(getComputedStyle(el).position)) return enAlt;
      return Math.max(enAlt, el.getBoundingClientRect().bottom);
    }, 0);
    const ust = duzen.getBoundingClientRect().top - baslikAlti - 12;
    if (ust < 0) window.scrollBy(0, ust);
    const serit = kok.querySelector('.hsa-nav ul');
    const aktif = serit && serit.querySelector('a.is-active');
    if (aktif && serit.scrollWidth > serit.clientWidth) {
      const s = serit.getBoundingClientRect();
      const a = aktif.getBoundingClientRect();
      serit.scrollLeft += (a.left - s.left) - (serit.clientWidth - a.width) / 2;
    }
  }

  kok.addEventListener('click', (e) => {
    const bolumBag = e.target.closest('[data-bolum]');
    if (bolumBag && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      const hedef = bolumBag.getAttribute('data-bolum');
      const hash = (bolumBag.getAttribute('href') || '').split('#')[1];
      git(hedef, true);
      if (hash) {
        history.replaceState(history.state, '', 'hesabim/?bolum=' + hedef + '#' + hash);
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ block: 'start' });
      }
      return;
    }
    const sekmeBtn = e.target.closest('[data-sekme]');
    if (sekmeBtn) { sekme = sekmeBtn.getAttribute('data-sekme'); ciz(); return; }
    const ac = e.target.closest('[data-iptal-ac]');
    if (ac) { const k = kok.querySelector('[data-iptal-kutu="' + ac.getAttribute('data-iptal-ac') + '"]'); if (k) k.hidden = false; return; }
    const vazgec = e.target.closest('[data-iptal-vazgec]');
    if (vazgec) { const k = kok.querySelector('[data-iptal-kutu="' + vazgec.getAttribute('data-iptal-vazgec') + '"]'); if (k) k.hidden = true; return; }
    const onay = e.target.closest('[data-iptal-onay]');
    if (onay) {
      onay.disabled = true;
      MolaVeri.rezervasyonIptal(onay.getAttribute('data-iptal-onay'), new Date()).then(sonuc => {
        if (!sonuc.tamam) { onay.disabled = false; onay.closest('.hsa-confirm').querySelector('p').textContent = sonuc.mesaj || 'İptal edilemedi.'; return; }
        sekme = 'iptal';
        yukle();
      });
      return;
    }
    const kopyala = e.target.closest('[data-kopyala]');
    if (kopyala) {
      const kod = kopyala.getAttribute('data-kopyala');
      const bitti = () => { kopyala.textContent = 'Kopyalandı'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(kod).then(bitti, bitti); else bitti();
      return;
    }
    if (e.target.closest('[data-yazdir]')) { window.print(); return; }
    const bildirim = e.target.closest('[data-bildirim]');
    if (bildirim) { MolaVeri.bildirimOkundu(bildirim.getAttribute('data-bildirim')); return; }
    if (e.target.closest('[data-bildirim-hepsi]')) {
      MolaVeri.bildirimOkundu(panel.bildirimler.map(n => n.id));
      yukle();
      return;
    }
    const giris = e.target.closest('[data-giris]');
    if (giris && typeof openAuthModal === 'function') { openAuthModal(giris.getAttribute('data-giris')); return; }
    if (e.target.closest('[data-cikis]')) { MolaVeri.cikisYap(); return; }
    if (e.target.closest('[data-sil-ac]')) { kok.querySelector('[data-sil-kutu]').hidden = false; return; }
    if (e.target.closest('[data-sil-vazgec]')) { kok.querySelector('[data-sil-kutu]').hidden = true; return; }
    if (e.target.closest('[data-sil-onay]')) { MolaVeri.hesabiSil(); return; }
  });

  kok.addEventListener('change', (e) => {
    const izin = e.target.closest('[data-izin]');
    if (izin) {
      const kutular = kok.querySelectorAll('[data-izin]');
      const deger = {};
      kutular.forEach(k => { deger[k.getAttribute('data-izin')] = k.checked; });
      MolaVeri.izinGuncelle(deger);
    }
  });

  kok.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.matches('[data-bilgiler]')) {
      e.preventDefault();
      const v = { ad: form.ad.value, soyad: form.soyad.value, eposta: form.eposta.value, telefon: form.telefon.value };
      form.querySelectorAll('[data-hata]').forEach(x => { x.textContent = ''; });
      MolaVeri.profilGuncelle(v).then(sonuc => {
        if (!sonuc.tamam) {
          (sonuc.hatalar || []).forEach(h => { const x = form.querySelector('[data-hata="' + h.alan + '"]'); if (x) x.textContent = h.mesaj; });
          return;
        }
        form.querySelector('[data-kaydedildi]').textContent = 'Kaydedildi.';
      });
    } else if (form.matches('[data-yorum]')) {
      e.preventDefault();
      const secili = form.querySelector('input[name="puan"]:checked');
      MolaVeri.yorumYaz({ kod: form.getAttribute('data-yorum'), puan: secili ? Number(secili.value) : 0, metin: form.metin.value }, new Date()).then(sonuc => {
        if (!sonuc.tamam) { form.querySelector('[data-yorum-hata]').textContent = sonuc.hatalar.map(h => h.mesaj).join(' '); return; }
        yukle();
      });
    } else if (form.matches('[data-sorgula]')) {
      e.preventDefault();
      const cikti = form.querySelector('[data-sorgu-sonuc]');
      MolaVeri.rezervasyonSorgula(form.kod.value, form.eposta.value).then(r => {
        cikti.innerHTML = r
          ? 'Bulundu: <a href="rezervasyon/onay/?kod=' + encodeURIComponent(r.kod) + '">' + hsaKacis(r.baslik) + ' (' + hsaKacis(r.kod) + ')</a>'
          : 'Bu kod ve e-postayla bir rezervasyon bulunamadı.';
      });
    }
  });

  window.addEventListener('popstate', () => {
    const b = new URLSearchParams(location.search).get('bolum') || 'genel';
    bolum = hsaBolum(b).id;
    ciz();
  });
  ['oturum', 'favori', 'rezervasyon'].forEach(ad => window.addEventListener('mola360:' + ad, () => {
    if (ad === 'oturum') bolum = hsaBolum(new URLSearchParams(location.search).get('bolum') || 'genel').id;
    yukle();
  }));
  return yukle();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HSA_BOLUMLER, hsaNavMarkup, hsaGenelMarkup, hsaRezervasyonKart, hsaRezervasyonlarMarkup, hsaBiletlerMarkup,
    hsaFavorilerMarkup, hsaKuponlarMarkup, hsaPuanMarkup, hsaSeviyeMarkup, hsaYorumlarMarkup, hsaBildirimlerMarkup,
    hsaBilgilerMarkup, hsaOdemeMarkup, hsaAyarlarMarkup, hsaMisafirMarkup
  };
}
