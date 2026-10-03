/* ---------------- yönetim paneli: ekran ----------------
   admin-data.js'in ürettiğini çizer ve etkileşimleri bağlar. Burada
   HESAP YOK: sayfada görünen her sayı admin-data.js'ten geliyor. Kural
   sitenin içerik sayfalarıyla aynı (docs/tur-sayfasi.md).

   Panel tek sayfa; bölümler adres çubuğundaki # ile değişiyor
   (#/icerikler, #/kayit/otel/kordon-butik-otel). Böylece bir kaydın
   düzenleme ekranı PAYLAŞILABİLİR bir adres oluyor ve tarayıcının geri
   düğmesi çalışıyor. */

/* ---------------- ikonlar ----------------
   Sitenin ikon kümesi (TOUR_ICONS) panelde de kullanılıyor; yalnızca
   panele özgü olanlar burada. İki küme tutmamak için ad çakışması
   YOK: aFmIkon önce buraya, sonra TOUR_ICONS'a bakıyor. */
const ADMIN_IKON = {
  pano:    '<rect x="3" y="3" width="7.5" height="9" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.6"/><rect x="3" y="15" width="7.5" height="6" rx="1.6"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.6"/>',
  liste:   '<line x1="8" y1="6.5" x2="20.5" y2="6.5"/><line x1="8" y1="12" x2="20.5" y2="12"/><line x1="8" y1="17.5" x2="20.5" y2="17.5"/><circle cx="4.2" cy="6.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.2" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.2" cy="17.5" r="1.3" fill="currentColor" stroke="none"/>',
  ara:     '<circle cx="11" cy="11" r="7"/><line x1="16.2" y1="16.2" x2="21" y2="21"/>',
  menu:    '<line x1="3.5" y1="7" x2="20.5" y2="7"/><line x1="3.5" y1="12" x2="20.5" y2="12"/><line x1="3.5" y1="17" x2="20.5" y2="17"/>',
  uyari:   '<path d="M12 3.6 22 20H2z"/><line x1="12" y1="10" x2="12" y2="14.5"/><circle cx="12" cy="17.4" r=".95" fill="currentColor" stroke="none"/>',
  kalem:   '<path d="M15.5 4.5 19.5 8.5 8 20H4v-4z"/><line x1="13.5" y1="6.5" x2="17.5" y2="10.5"/>',
  kopya:   '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 5.5v-.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h.5"/>',
  cop:     '<path d="M4.5 6.5h15"/><path d="M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7"/><path d="M6.5 6.5 7.4 20a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3l.9-13.5"/>',
  disari:  '<path d="M14 4.5h5.5V10"/><line x1="19.5" y1="4.5" x2="11.5" y2="12.5"/><path d="M18 14v4.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2H10"/>',
  kilit:   '<rect x="4.5" y="10" width="15" height="10.5" rx="2.2"/><path d="M8 10V7.6a4 4 0 0 1 8 0V10"/>',
  grafik:  '<line x1="3.5" y1="20.5" x2="20.5" y2="20.5"/><rect x="5.5" y="12" width="3.4" height="6"/><rect x="10.3" y="7.5" width="3.4" height="10.5"/><rect x="15.1" y="4" width="3.4" height="14"/>',
  kaydet:  '<path d="M5 3.5h11L20.5 8v11a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z"/><path d="M7.5 3.5v6h9v-6"/><rect x="7.5" y="13" width="9" height="7.5"/>',
  geri:    '<path d="M4 12a8 8 0 0 1 14-5.3L20 8"/><path d="M20 4v4h-4"/>',
  soru:    '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.4a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.2-2.6 3.9"/><circle cx="12" cy="17.2" r=".95" fill="currentColor" stroke="none"/>',
  compass: '<circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 13.6 13.6 8.5 15.5 10.4 10.4"/>',
  ticket:  '<path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h14a1.5 1.5 0 0 1 1.5 1.5v1.6a2 2 0 0 0 0 3.8v1.6A1.5 1.5 0 0 1 19 17H5a1.5 1.5 0 0 1-1.5-1.5v-1.6a2 2 0 0 0 0-3.8z"/><line x1="12" y1="8.5" x2="12" y2="15.5" stroke-dasharray="1.6 2"/>',
  activity:'<polyline points="2.5 12.5 7 12.5 9.8 5.5 14.2 18.5 16.8 12.5 21.5 12.5"/>',
  yuzde:   '<line x1="6" y1="18" x2="18" y2="6"/><circle cx="7.6" cy="7.6" r="2.6"/><circle cx="16.4" cy="16.4" r="2.6"/>'
};

function aIkonYolu(ad) {
  if (ADMIN_IKON[ad]) return ADMIN_IKON[ad];
  const kume = (typeof TOUR_ICONS !== 'undefined') ? TOUR_ICONS : {};
  return kume[ad] || '';
}
function aIkon(ad) {
  return '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"'
    + ' stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
    + aIkonYolu(ad) + '</svg>';
}

/* ---------------- küçük yardımcılar ---------------- */
const aEl = (id) => document.getElementById(id);
/* Metin ekrana basılmadan önce kaçışlanıyor. Kayıtlardaki metinler
   bizim yazdığımız veri, ama taslaklar KULLANICININ yazdığı metin:
   düzenleyiciye < işareti yazan biri paneli bozmasın. */
function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let aBildirimSaat = 0;
function bildir(metin) {
  const k = aEl('aBildirim');
  if (!k) return;
  k.textContent = metin;
  k.classList.add('gorunur');
  clearTimeout(aBildirimSaat);
  aBildirimSaat = setTimeout(() => k.classList.remove('gorunur'), 2400);
}

async function panoyaKopyala(metin, basariMetni) {
  try {
    await navigator.clipboard.writeText(metin);
    bildir(basariMetni || 'Panoya kopyalandı');
  } catch (_) {
    /* İzin verilmeyen ortamda (bazı tarayıcılarda http) sessiz kalmak
       yerine seçilebilir hâle getiriliyor: kullanıcı elle kopyalasın. */
    bildir('Kopyalanamadı — metni seçip elle kopyalayın');
  }
}

function dosyaIndir(ad, metin, tip) {
  const blob = new Blob([metin], { type: tip || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ad;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------- yerel depo ----------------
   Gizli sekmede ve depo kapalıyken localStorage erişimi HATA ATAR.
   Her okuma/yazma korumalı: panel deposuz da açılmalı, yalnızca taslak
   tutamaz. */
function depoOku(anahtar, yedek) {
  try {
    const ham = localStorage.getItem(anahtar);
    return ham ? JSON.parse(ham) : yedek;
  } catch (_) { return yedek; }
}
function depoYaz(anahtar, deger) {
  try { localStorage.setItem(anahtar, JSON.stringify(deger)); return true; }
  catch (_) { return false; }
}

const ANAHTAR_TASLAK = 'm360-admin-taslaklar';
const ANAHTAR_KILIT  = 'm360-admin-kilit';
const ANAHTAR_OTURUM = 'm360-admin-oturum';

/* ---------------- kilit ----------------
   Şifre düz metin olarak DEĞİL, SHA-256 özeti olarak karşılaştırılıyor.
   Bu bir güvenlik önlemi değil — kaynak kodu açık, özet de orada — ama
   şifrenin dosyada okunur hâlde durmamasını sağlıyor.

   Panelin kendisi giriş ekranında bu kilidin tarayıcıda çalıştığını ve
   gerçek koruma olmadığını yazıyor. Yazmasaydı, panel olmayan bir
   güvenliği varmış gibi gösterirdi; asıl tehlikeli olan bu. */
const VARSAYILAN_OZET = 'e6d8dd9e4ff0ebfef8519cec223ee77eae4314ddfe89c879d2100629fa7b92ad';

async function sha256(metin) {
  const veri = new TextEncoder().encode(String(metin));
  const tampon = await crypto.subtle.digest('SHA-256', veri);
  return [...new Uint8Array(tampon)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function kilitOzeti() {
  return depoOku(ANAHTAR_KILIT, null) || VARSAYILAN_OZET;
}
function oturumAcikMi() {
  try { return sessionStorage.getItem(ANAHTAR_OTURUM) === '1'; } catch (_) { return false; }
}
function oturumAc() { try { sessionStorage.setItem(ANAHTAR_OTURUM, '1'); } catch (_) {} }
function oturumKapat() { try { sessionStorage.removeItem(ANAHTAR_OTURUM); } catch (_) {} }

/* ---------------- durum ---------------- */
const D = {
  kayitlar: [],
  bugun: '',
  kartGorselleri: new Map(),   /* anahtar -> adres (app.js'teki cardImages) */
  sayfalar: null,              /* yaşayan içerik sayfaları; yoklanana kadar null */
  taslaklar: depoOku(ANAHTAR_TASLAK, {}),
  suzgec: { q: '', tur: 'hepsi', bolge: 'hepsi', sirala: 'baslik', yon: 'artan', yalnizTaslak: false },
  sekme: 'kunye',
  rota: { ad: 'panel', arg: [] }
};

function taslakAnahtari(tur, slug) { return tur + '/' + slug; }
function taslakAl(tur, slug) {
  const t = D.taslaklar[taslakAnahtari(tur, slug)];
  return (t && t.alanlar) || {};
}
function taslakYaz(tur, slug, alanlar) {
  const ad = taslakAnahtari(tur, slug);
  if (!alanlar || !Object.keys(alanlar).length) delete D.taslaklar[ad];
  else D.taslaklar[ad] = { alanlar: alanlar, guncel: new Date().toISOString() };
  if (!depoYaz(ANAHTAR_TASLAK, D.taslaklar)) {
    bildir('Taslak kaydedilemedi: tarayıcı deposu kapalı');
  }
}
function taslakliMi(kayit) { return Object.keys(taslakAl(kayit.tur, kayit.slug)).length > 0; }
function taslakliSayi() {
  return D.kayitlar.filter(taslakliMi).length;
}
/* Kaydın taslakla birleşmiş hâli: düzenleyici, önizleme ve dışa
   aktarma hep bunu okuyor — üçü ayrışamaz. */
function kayitGuncelHali(kayit) {
  return adminTaslakUygula(kayit.ham, taslakAl(kayit.tur, kayit.slug));
}

/* ---------------- görseller ----------------
   Kart görselleri app.js içindeki cardImages sözlüğünde duruyor ve o
   dosya bir modül değil. Panel app.js'i ÇALIŞTIRMIYOR (anasayfayı
   kuran yüzlerce satır DOM işi panelde anlamsız), metin olarak okuyup
   sözlüğü ayrıştırıyor — tests/icerik.test.js de aynı yolu izliyor. */
async function kartGorselleriniYukle() {
  try {
    const cevap = await fetch('../assets/js/app.js');
    if (!cevap.ok) return;
    const metin = await cevap.text();
    const blok = metin.match(/const cardImages = \{([\s\S]*?)\n\};/);
    if (!blok) return;
    for (const m of blok[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
      D.kartGorselleri.set(m[1], m[2]);
    }
  } catch (_) { /* çevrimdışı: kart önizlemesi yer tutucuya düşer */ }
}

function kartGorselAdresi(anahtar) {
  return D.kartGorselleri.get(anahtar) || '';
}
/* Galeri/oda anahtarları Wikimedia dosya adından deterministik kuruluyor
   (docs/gorsel-kaynaklari.md); aynı fonksiyon sitede de kullanılıyor. */
function medyaAdresi(dosya, genislik) {
  return (typeof commonsImageUrl === 'function') ? commonsImageUrl(dosya, genislik || 400) : '';
}

/* İçerik sayfası gerçekten açılıyor mu: adres yoklanıyor. Denetimdeki
   "bağ ölü" bulgusu buna dayanıyor. Yoklama başarısız olursa küme null
   kalıyor ve denetim o kuralı ATLIYOR — eksik bilgiyle "sayfa yok"
   demek, olmayan bir hatayı bildirmek olurdu. */
async function sayfalariYokla() {
  const yasayan = new Set();
  try {
    await Promise.all(D.kayitlar.map(async k => {
      try {
        const cevap = await fetch('../' + k.adres, { method: 'HEAD' });
        if (cevap.ok) yasayan.add(k.adres);
      } catch (_) {}
    }));
    D.sayfalar = yasayan;
  } catch (_) { D.sayfalar = null; }
}

/* ---------------- denetim (önbellekli) ----------------
   Denetim her çizimde yeniden koşuyor; kayıt sayısı küçük olduğu için
   ucuz, ama menüdeki hata sayacı her ekran değişiminde yeniden
   hesaplanmasın diye sonuç saklanıyor. Taslak değişince geçersiz
   kılınıyor: panelin gösterdiği hata sayısı hep o anki veriye ait. */
let aDenetimOnbellek = null;
function denetimSonucu() {
  if (aDenetimOnbellek) return aDenetimOnbellek;
  const bulgular = adminDenetim(D.kayitlar, {
    kartGorselleri: D.kartGorselleri.size ? new Set(D.kartGorselleri.keys()) : null,
    sayfalar: D.sayfalar,
    bugun: D.bugun
  });
  aDenetimOnbellek = { bulgular: bulgular, ozet: adminDenetimOzeti(D.kayitlar, bulgular) };
  return aDenetimOnbellek;
}
function denetimiTazele() { aDenetimOnbellek = null; }

/* ---------------- yönlendirici ---------------- */
const ROTALAR = [
  { ad: 'panel',     yol: '#/panel',     etiket: 'Panel',            ikon: 'pano',    grup: 'genel' },
  { ad: 'icerikler', yol: '#/icerikler', etiket: 'İçerikler',        ikon: 'liste',   grup: 'genel' },
  { ad: 'anasayfa',  yol: '#/anasayfa',  etiket: 'Anasayfa düzeni',  ikon: 'grafik',  grup: 'genel' },
  { ad: 'medya',     yol: '#/medya',     etiket: 'Medya',            ikon: 'image',   grup: 'genel' },
  { ad: 'denetim',   yol: '#/denetim',   etiket: 'Denetim',          ikon: 'shield',  grup: 'kalite' },
  { ad: 'taslaklar', yol: '#/taslaklar', etiket: 'Taslaklar',        ikon: 'kaydet',  grup: 'kalite' },
  { ad: 'yeni',      yol: '#/yeni',      etiket: 'Yeni kayıt',       ikon: 'plus',    grup: 'kalite' },
  { ad: 'yardim',    yol: '#/yardim',    etiket: 'Yardım ve ayarlar', ikon: 'soru',   grup: 'kalite' }
];

function rotayiOku() {
  const ham = String(location.hash || '').replace(/^#\/?/, '');
  const parca = ham.split('/').filter(Boolean).map(decodeURIComponent);
  if (!parca.length) return { ad: 'panel', arg: [] };
  return { ad: parca[0], arg: parca.slice(1) };
}

function git(yol) { location.hash = yol; }

/* ---------------- menü ---------------- */
function menuyuCiz() {
  const ozet = denetimSonucu().ozet;
  const taslak = taslakliSayi();
  const sayilar = { icerikler: D.kayitlar.length, denetim: ozet.hata, taslaklar: taslak };
  const gruplar = [
    { key: 'genel', etiket: 'İçerik' },
    { key: 'kalite', etiket: 'Kalite ve araçlar' }
  ];
  aEl('aMenu').innerHTML = gruplar.map(g => {
    const satirlar = ROTALAR.filter(r => r.grup === g.key).map(r => {
      const sayi = sayilar[r.ad];
      const vurgu = r.ad === 'denetim' && ozet.hata > 0 ? ' uyari' : '';
      /* Kayıt düzenleme ekranı menüde ayrı bir satır değil; oradayken
         "İçerikler" açık görünüyor ki kullanıcı nerede olduğunu bilsin. */
      const acik = D.rota.ad === r.ad || (D.rota.ad === 'kayit' && r.ad === 'icerikler');
      return '<a href="' + r.yol + '" class="' + (acik ? 'acik' : '') + '">'
        + aIkon(r.ikon) + '<span>' + esc(r.etiket) + '</span>'
        + (sayi ? '<span class="a-menu-sayi' + vurgu + '">' + sayi + '</span>' : '')
        + '</a>';
    }).join('');
    return '<div class="a-menu-baslik">' + esc(g.etiket) + '</div>' + satirlar;
  }).join('');
}

function basligiYaz(baslik, alt) {
  aEl('aBaslik').textContent = baslik;
  aEl('aBaslikAlt').textContent = alt || '';
  document.title = baslik + ' | mola360 Yönetim Paneli';
}

/* ---------------- ortak parçalar ---------------- */
function kutu(ikon, etiket, sayi, alt) {
  /* Uzun değer kutuda iki satıra taşıyor; ölçü değere göre küçülüyor. */
  const uzun = String(sayi).length > 11 ? ' uzun' : '';
  return '<div class="a-kutu">'
    + '<div class="a-kutu-ust">' + aIkon(ikon) + '<span>' + esc(etiket) + '</span></div>'
    + '<div class="a-kutu-sayi' + uzun + '">' + esc(sayi) + '</div>'
    + '<div class="a-kutu-alt">' + esc(alt || '') + '</div>'
    + '</div>';
}

function bosDurum(metin, ikon) {
  return '<div class="a-bos">' + aIkon(ikon || 'ara') + '<p>' + esc(metin) + '</p></div>';
}

function turNoktasi(kayit) {
  return '<span class="a-nokta" style="background:' + esc(kayit.renk) + '"></span>';
}

function puanMetni(kayit) {
  if (!kayit.yorumSayisi) return '—';
  return String(kayit.puan).replace('.', ',') + ' / ' + kayit.puanOlcek;
}

/* ---------------- görünüm: panel ---------------- */
function ciz_panel() {
  const ist = adminIstatistik(D.kayitlar);
  const { bulgular, ozet } = denetimSonucu();
  const taslak = taslakliSayi();

  const kutular = [
    kutu('liste', 'Toplam kayıt', ist.toplam,
      ADMIN_TURLER.map(t => ist.turBazinda.find(x => x.key === t.key).adet + ' ' + t.cogul.toLowerCase()).join(' · ')),
    kutu('shield', 'İçerik sağlığı', '%' + ozet.saglik,
      ozet.hata ? ozet.hata + ' hata, ' + ozet.uyari + ' uyarı' : 'Hata yok, ' + ozet.uyari + ' uyarı'),
    kutu('star', 'Ortalama puan', String(ist.ortalamaPuan).replace('.', ','),
      adminSayiTR(ist.yorumToplam) + ' yorumun ağırlıklı ortalaması'),
    kutu('wallet', 'Fiyat aralığı', adminParaTR(ist.enDusukFiyat) + ' – ' + adminParaTR(ist.enYuksekFiyat),
      'Ortalama ' + adminParaTR(ist.ortalamaFiyat)),
    kutu('yuzde', 'İndirimli kayıt', ist.indirimliAdet,
      ist.indirimliAdet ? 'Ortalama %' + ist.ortalamaIndirim + ' indirim' : 'İndirimli kayıt yok'),
    kutu('kaydet', 'Bekleyen taslak', taslak,
      taslak ? 'Veri dosyasına işlenmeyi bekliyor' : 'Yayındaki veriyle birebir aynı')
  ].join('');

  const turKutulari = ist.turBazinda.map(t =>
    '<a class="a-tur-kutu" href="#/icerikler/' + t.key + '">'
    + '<span class="a-nokta" style="background:' + esc(t.renk) + '"></span>'
    + '<span><b>' + t.adet + '</b> <span>' + esc(t.cogul) + '</span></span></a>'
  ).join('');

  /* Panelde bütün bulgular değil, yalnızca HATALAR duruyor: açılış
     ekranı yapılacak iş listesi, denetim raporu değil. Tam liste
     Denetim bölümünde. */
  const hatalar = bulgular.filter(b => b.seviye === 'hata').slice(0, 6);
  const hataListesi = hatalar.length
    ? hatalar.map(bulguSatiri).join('')
    : '<div class="a-bos">' + aIkon('check')
      + '<p>Yayını engelleyen bir hata yok. ' + ozet.uyari + ' uyarı ve '
      + ozet.bilgi + ' bilgi notu Denetim bölümünde.</p></div>';

  /* En çok yorum alan kayıtlar: hangi içeriğin gerçekten talep gördüğü
     panelde ilk bakışta görünsün. */
  const populer = D.kayitlar.slice().sort((a, b) => b.yorumSayisi - a.yorumSayisi).slice(0, 5);

  return '<div class="a-kutular">' + kutular + '</div>'

    + '<div class="a-bolum-ara"><h2>İçerik türleri</h2>'
    + '<p>Listeye tür süzgeciyle girmek için tıklayın.</p></div>'
    + '<div class="a-tur-kutular">' + turKutulari + '</div>'

    + '<div class="a-bolum-ara"><h2>Önce bunlar</h2>'
    + '<p>Sitede görünür bir bozukluk üreten bulgular.</p></div>'
    + '<div class="a-kart">' + hataListesi + '</div>'

    + '<div class="a-bolum-ara"><h2>En çok yorum alanlar</h2></div>'
    + '<div class="a-kart"><div class="a-tablo-sar"><table class="a-tablo">'
    + '<thead><tr><th>Kayıt</th><th>Tür</th><th class="sag">Puan</th><th class="sag">Yorum</th>'
    + '<th class="sag">Fiyat</th></tr></thead><tbody>'
    + populer.map(k =>
        '<tr><td>' + satirAdi(k) + '</td>'
        + '<td>' + turNoktasi(k) + ' ' + esc(k.turTekil) + '</td>'
        + '<td class="sag">' + esc(puanMetni(k)) + '</td>'
        + '<td class="sag">' + adminSayiTR(k.yorumSayisi) + '</td>'
        + '<td class="sag">' + adminParaTR(k.fiyat) + '</td></tr>'
      ).join('')
    + '</tbody></table></div></div>';
}

function satirAdi(kayit) {
  const adres = kartGorselAdresi(kayit.kartGorseli);
  return '<a class="a-satir-ad" href="#/kayit/' + esc(kayit.tur) + '/' + esc(kayit.slug) + '">'
    + (adres ? '<img class="a-satir-gorsel" src="' + esc(adres) + '" alt="" loading="lazy">'
             : '<span class="a-satir-gorsel"></span>')
    + '<span><b>' + esc(kayit.baslik) + '</b><span>' + esc(kayit.adres) + '</span></span>'
    + (taslakliMi(kayit) ? ' <span class="a-rozet taslak">taslak</span>' : '')
    + '</a>';
}

/* ---------------- görünüm: içerikler ---------------- */
function ciz_icerikler() {
  const s = D.suzgec;
  const liste = adminSuz(D.kayitlar, {
    q: s.q, tur: s.tur, bolge: s.bolge, sirala: s.sirala, yon: s.yon,
    taslakli: s.yalnizTaslak ? taslakliMi : null
  });
  const bolgeler = adminBolgeler(D.kayitlar);

  const turCipleri = ['<button class="a-cip ' + (s.tur === 'hepsi' ? 'acik' : '') + '" data-tur="hepsi">'
    + 'Hepsi <span class="a-menu-sayi">' + D.kayitlar.length + '</span></button>']
    .concat(ADMIN_TURLER.map(t => {
      const adet = D.kayitlar.filter(k => k.tur === t.key).length;
      return '<button class="a-cip ' + (s.tur === t.key ? 'acik' : '') + '" data-tur="' + t.key + '">'
        + '<span class="a-nokta" style="background:' + t.renk + '"></span>'
        + esc(t.cogul) + ' <span class="a-menu-sayi">' + adet + '</span></button>';
    })).join('');

  const basliklar = [
    { ad: 'baslik', etiket: 'Kayıt' },
    { ad: 'tur', etiket: 'Tür' },
    { ad: 'bolge', etiket: 'Bölge' },
    { ad: 'fiyat', etiket: 'Fiyat', sag: true },
    { ad: 'puan', etiket: 'Puan', sag: true },
    { ad: 'yorum', etiket: 'Yorum', sag: true }
  ].map(b => '<th class="' + (b.sag ? 'sag' : '') + '">'
    + '<button type="button" data-sirala="' + b.ad + '">' + esc(b.etiket)
    + (s.sirala === b.ad ? aIkon(s.yon === 'artan' ? 'chevUp' : 'chevDown') : '')
    + '</button></th>').join('');

  const satirlar = liste.map(k => {
    const indirim = k.indirim
      ? ' <span class="a-rozet ok">%' + k.indirim + '</span>' : '';
    return '<tr>'
      + '<td>' + satirAdi(k) + '</td>'
      + '<td><span style="white-space:nowrap">' + turNoktasi(k) + ' ' + esc(k.turTekil) + '</span></td>'
      + '<td>' + esc(k.bolge || '—') + '<br><span style="color:var(--a-faint);font-size:11.5px">'
        + esc(k.alan) + '</span></td>'
      + '<td class="sag">' + adminParaTR(k.fiyat) + indirim
        + '<br><span style="color:var(--a-faint);font-size:11.5px">' + esc(k.birim || '') + '</span></td>'
      + '<td class="sag" style="white-space:nowrap">' + esc(puanMetni(k)) + '</td>'
      + '<td class="sag">' + adminSayiTR(k.yorumSayisi) + '</td>'
      + '<td class="sag"><span class="a-satir-islem">'
        + '<a class="a-btn kucuk" href="#/kayit/' + esc(k.tur) + '/' + esc(k.slug) + '">'
          + aIkon('kalem') + 'Düzenle</a>'
        + '<a class="a-btn kucuk" href="../' + esc(k.adres) + '" target="_blank" rel="noopener" '
          + 'title="Sayfayı yeni sekmede aç">' + aIkon('disari') + '</a>'
      + '</span></td></tr>';
  }).join('');

  return '<div class="a-kart">'
    + '<div class="a-suzgec" id="aSuzgec">'
      + turCipleri
      + '<select id="aBolge"><option value="hepsi">Tüm bölgeler</option>'
        + bolgeler.map(b => '<option value="' + esc(b) + '"' + (s.bolge === b ? ' selected' : '') + '>'
          + esc(b) + '</option>').join('')
      + '</select>'
      + '<button class="a-cip ' + (s.yalnizTaslak ? 'acik' : '') + '" id="aYalnizTaslak">'
        + 'Yalnızca taslaklı</button>'
      + '<span class="a-sag">' + liste.length + ' / ' + D.kayitlar.length + ' kayıt</span>'
    + '</div>'
    + (liste.length
      ? '<div class="a-tablo-sar"><table class="a-tablo"><thead><tr>' + basliklar
        + '<th class="sag">İşlem</th></tr></thead><tbody>' + satirlar + '</tbody></table></div>'
      : bosDurum('Süzgece uyan kayıt yok. Arama kutusunu veya tür süzgecini değiştirin.'))
    + '</div>';
}

/* ---------------- görünüm: kayıt düzenleyici ---------------- */
function kaydiBul(tur, slug) {
  return D.kayitlar.find(k => k.tur === tur && k.slug === slug) || null;
}

function ciz_kayit(tur, slug) {
  const kayit = kaydiBul(tur, slug);
  if (!kayit) {
    return '<div class="a-kart">' + bosDurum('Böyle bir kayıt yok: ' + tur + '/' + slug, 'uyari') + '</div>';
  }
  const taslak = taslakAl(tur, slug);
  const fark = adminFark(kayit.ham, taslak);
  const guncel = kayitGuncelHali(kayit);
  const turBilgi = adminTur(tur);
  const adres = kartGorselAdresi((guncel.card && guncel.card.img) || '');

  const sekmeler = ADMIN_GRUPLAR.map(g =>
    '<button class="a-sekme ' + (D.sekme === g.key ? 'acik' : '') + '" data-sekme="' + g.key + '">'
    + esc(g.etiket) + '</button>').join('');

  return '<div class="a-kart">'
    + '<div class="a-duzen-ust">'
      + (adres ? '<img src="' + esc(adres) + '" alt="">' : '<span class="a-satir-gorsel"></span>')
      + '<div>'
        + '<h2>' + esc(guncel.title || kayit.baslik) + '</h2>'
        + '<p>' + turNoktasi(kayit) + ' ' + esc(kayit.turTekil) + ' · <code>' + esc(kayit.adres) + '</code>'
          + ' · ' + esc(turBilgi.veriDosyasi) + '</p>'
        + '<p style="margin-top:6px" id="aDurumRozet">' + durumRozeti(fark.length) + '</p>'
      + '</div>'
      + '<div class="a-sag">'
        + '<a class="a-btn" href="../' + esc(kayit.adres) + '" target="_blank" rel="noopener">'
          + aIkon('disari') + 'Sayfayı aç</a>'
        + '<button class="a-btn" id="aTaslakSifirla"' + (fark.length ? '' : ' disabled') + '>'
          + aIkon('geri') + 'Taslağı sıfırla</button>'
        + '<button class="a-btn yesil" id="aDisaAktar">' + aIkon('download') + 'Dışa aktar</button>'
      + '</div>'
    + '</div>'
    + '<div class="a-sekmeler" id="aSekmeler">' + sekmeler + '</div>'
    + '<div class="a-duzen-govde">'
      + '<div class="a-form" id="aForm" data-kayit-tur="' + esc(tur) + '" data-slug="' + esc(slug) + '">'
        + formIcerigi(kayit, guncel, taslak)
      + '</div>'
      + '<aside class="a-duzen-yan">' + onizlemeBloku(kayit, guncel) + '</aside>'
    + '</div>'
    + '</div>'
    + (fark.length ? farkBloku(fark) : '');
}

function durumRozeti(farkSayisi) {
  return farkSayisi
    ? '<span class="a-rozet taslak">' + farkSayisi + ' alanda taslak değişiklik</span>'
    : '<span class="a-rozet ok">Yayındaki veriyle aynı</span>';
}

function formIcerigi(kayit, guncel, taslak) {
  const alanlar = adminAlanlar(kayit.tur).filter(a => a.grup === D.sekme);
  let html = alanlar.map(a => alanCiz(a, guncel, taslak)).join('');

  /* Fiyat sekmesinde şema alanlarının yanında, türe göre değişen fiyat
     TABLOSU da var: otelde odalar, etkinlikte bilet kategorileri,
     mekânda alanlar/hizmetler. Bunlar kayıt içinde dizi olduğu için
     düz alan şemasıyla anlatılamıyor. */
  if (D.sekme === 'fiyat') {
    html = fiyatTablosuCiz(kayit, guncel) + html;
  }
  if (D.sekme === 'kunye') {
    html = kimlikBloku(kayit) + html;
  }
  return html || '<p class="a-ipucu">Bu sekmede düzenlenebilir alan yok.</p>';
}

/* Değiştirilemeyen kimlik alanları: slug ve tür. Formda düzenlenebilir
   olsalardı kayıt anahtarı ile sayfa dizini ayrışırdı ve kart ölü bağa
   giderdi — panel bunları GÖSTERİYOR ama değiştirmiyor. Slug değişimi
   dizin taşımayı gerektirdiği için depoda yapılacak bir iş. */
function kimlikBloku(kayit) {
  return '<div class="a-alan genis">'
    + '<label>Kimlik <span style="font-weight:500;color:var(--a-muted)">(panelden değiştirilemez)</span></label>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      + '<span class="a-rozet">slug: ' + esc(kayit.slug) + '</span>'
      + '<span class="a-rozet">tür: ' + esc(kayit.turTekil) + '</span>'
      + '<span class="a-rozet">adres: /' + esc(kayit.adres) + '</span>'
    + '</div>'
    + '<p class="a-ipucu">Slug değiştirmek <code>' + esc(kayit.adres)
      + '</code> dizinini taşımayı ve kayıt anahtarını birlikte değiştirmeyi gerektirir; '
      + 'yarısı yapılırsa anasayfadaki kart ölü bağa gider. Bu yüzden depoda yapılıyor.</p>'
    + '</div>';
}

function alanCiz(alan, guncel, taslak) {
  const deger = adminOku(guncel, alan.yol);
  const degisti = Object.prototype.hasOwnProperty.call(taslak, alan.yol);
  const genis = (alan.tip === 'paragraflar' || alan.tip === 'satirlar'
    || alan.tip === 'nesneListesi' || alan.tip === 'metinUzun');
  const etiket = '<label for="f-' + esc(alan.yol) + '">' + esc(alan.etiket)
    + (alan.zorunlu ? '<span class="a-zorunlu" title="Zorunlu alan">*</span>' : '') + '</label>';
  const ipucu = alan.ipucu ? '<p class="a-ipucu">' + esc(alan.ipucu) + '</p>' : '';

  return '<div class="a-alan ' + (genis ? 'genis ' : '') + (degisti ? 'degisti' : '') + '">'
    + etiket + girdiCiz(alan, deger) + ipucu + '</div>';
}

function girdiCiz(alan, deger) {
  const id = 'f-' + esc(alan.yol);
  const yol = ' data-yol="' + esc(alan.yol) + '" data-tip="' + esc(alan.tip) + '"';

  switch (alan.tip) {
    case 'metinUzun':
      return '<textarea id="' + id + '"' + yol + ' rows="3">' + esc(deger) + '</textarea>'
        + (alan.sinir ? sayac(deger, alan.sinir) : '');
    case 'sayi':
      return '<input id="' + id + '" type="number" step="1"' + yol + ' value="' + esc(deger) + '">';
    case 'oran':
      return '<input id="' + id + '" type="number" step="0.001" min="0" max="1"' + yol
        + ' value="' + esc(deger) + '">';
    case 'satirlar':
      return '<textarea id="' + id + '"' + yol + ' rows="' + Math.max(3, (deger || []).length + 1)
        + '" placeholder="Her satır bir madde">' + esc((deger || []).join('\n')) + '</textarea>'
        + '<p class="a-sayac">' + (deger || []).length + ' madde · her satır bir madde</p>';
    case 'paragraflar':
      return '<textarea id="' + id + '"' + yol + ' rows="10" '
        + 'placeholder="Paragrafları BOŞ SATIRLA ayırın">'
        + esc((deger || []).join('\n\n')) + '</textarea>'
        + '<p class="a-sayac">' + (deger || []).length + ' paragraf · '
        + (deger || []).reduce((t, p) => t + adminKelimeSayisi(p), 0) + ' kelime · '
        + 'paragrafları boş satırla ayırın</p>';
    case 'gorselAnahtari':
      return gorselAnahtariCiz(id, yol, deger);
    case 'nesneListesi':
      return nesneListesiCiz(alan, deger);
    default:
      return '<input id="' + id + '" type="text"' + yol + ' value="' + esc(deger) + '">'
        + (alan.sinir ? sayac(deger, alan.sinir) : '');
  }
}

/* Karakter sayacı yalnızca sınırı OLAN alanlarda: sınırsız bir alanda
   sayaç göstermek, olmayan bir kurala uyulduğu izlenimi verir. */
function sayac(deger, sinir) {
  const n = String(deger || '').length;
  return '<p class="a-sayac' + (n > sinir ? ' asiri' : '') + '">' + n + ' / ' + sinir
    + ' karakter' + (n > sinir ? ' — başlık altında iki satıra taşar' : '') + '</p>';
}

function gorselAnahtariCiz(id, yol, deger) {
  const anahtarlar = [...D.kartGorselleri.keys()].sort();
  const adres = kartGorselAdresi(deger);
  return '<div style="display:flex;gap:10px;align-items:flex-start">'
    + (adres ? '<img src="' + esc(adres) + '" alt="" style="width:74px;height:56px;'
        + 'object-fit:cover;border-radius:8px;border:1px solid var(--a-border)">' : '')
    + '<div style="flex:1">'
      + '<input id="' + id + '" type="text" list="aGorselListe"' + yol + ' value="' + esc(deger) + '">'
      + (anahtarlar.length
        ? '<datalist id="aGorselListe">'
          + anahtarlar.map(a => '<option value="' + esc(a) + '">').join('') + '</datalist>'
        : '')
      + (deger && anahtarlar.length && anahtarlar.indexOf(deger) === -1
        ? '<p class="a-sayac asiri">Bu anahtar cardImages listesinde yok; kart yedek fotoğrafa düşer.</p>'
        : '')
    + '</div></div>';
}

function nesneListesiCiz(alan, deger) {
  const liste = Array.isArray(deger) ? deger : [];
  const satirlar = liste.map((satir, i) =>
    '<div class="a-nesne-satir">'
      + '<div class="a-nesne-satir-ust"><b>' + (i + 1) + '. ' + esc(alan.etiket) + '</b>'
      + '<span class="a-sag"><button type="button" class="a-btn kucuk tehlike" '
        + 'data-sil="' + esc(alan.yol) + '" data-indeks="' + i + '">' + aIkon('cop') + 'Sil</button></span></div>'
      + alan.alanlar.map(x =>
        '<div class="a-alan"><label>' + esc(x.etiket) + '</label>'
        + (x.tip === 'metinUzun'
          ? '<textarea rows="3" data-yol="' + esc(alan.yol) + '" data-indeks="' + i
            + '" data-ad="' + esc(x.ad) + '" data-tip="nesne">' + esc(satir[x.ad]) + '</textarea>'
          : '<input type="text" data-yol="' + esc(alan.yol) + '" data-indeks="' + i
            + '" data-ad="' + esc(x.ad) + '" data-tip="nesne" value="' + esc(satir[x.ad]) + '">')
        + '</div>').join('')
    + '</div>').join('');

  return satirlar
    + '<button type="button" class="a-btn" data-ekle="' + esc(alan.yol) + '">'
    + aIkon('plus') + 'Satır ekle</button>';
}

function fiyatTablosuCiz(kayit, guncel) {
  const turBilgi = adminTur(kayit.tur);
  const tablo = turBilgi.fiyatTablosu(guncel);
  if (!tablo) return '';

  if (tablo.tip === 'duz') {
    return '<div class="a-alan genis"><label>' + esc(tablo.etiket) + '</label>'
      + '<table class="a-fiyat-tablo"><tbody>'
      + tablo.alanlar.map(a =>
        '<tr><td>' + esc(a.etiket) + '</td><td><input type="number" step="1" '
        + 'data-yol="' + esc(a.yol) + '" data-tip="sayi" value="'
        + esc(adminOku(guncel, a.yol)) + '"></td></tr>').join('')
      + '</tbody></table>'
      + '<p class="a-ipucu">Kartta görünen "başlangıç fiyatı" bu tablodan türetiliyor; '
      + 'elle yazılmıyor, dolayısıyla eskiyemiyor (docs/icerik-katalogu.md).</p></div>';
  }

  const liste = adminOku(guncel, tablo.yol) || [];
  return '<div class="a-alan genis"><label>' + esc(tablo.etiket) + '</label>'
    + '<div class="a-tablo-sar"><table class="a-fiyat-tablo"><thead><tr><th>Ad</th>'
    + tablo.alanlar.map(a => '<th>' + esc(a.etiket) + '</th>').join('')
    + '</tr></thead><tbody>'
    + liste.map((satir, i) =>
      '<tr><td>' + esc(satir[tablo.ad]) + '</td>'
      + tablo.alanlar.map(a =>
        '<td><input type="number" step="1" data-yol="' + esc(tablo.yol) + '" data-indeks="' + i
        + '" data-ad="' + esc(a.ad) + '" data-tip="nesneSayi" value="' + esc(satir[a.ad]) + '"></td>'
      ).join('') + '</tr>').join('')
    + '</tbody></table></div>'
    + '<p class="a-ipucu">Kartta görünen "başlangıç fiyatı" bu tablodaki EN UCUZ satırdan '
    + 'türetiliyor; elle yazılmıyor, dolayısıyla eskiyemiyor (docs/icerik-katalogu.md).</p></div>';
}

/* Kart önizlemesi kaydın TASLAKLI hâlinden, sitenin kendi kart
   fonksiyonuyla üretiliyor: panelde gördüğünüz kart anasayfada
   çıkacak kartın kendisi. Panelin ayrı bir kart çizimi olsaydı ikisi
   ayrışırdı. */
function onizlemeBloku(kayit, guncel) {
  const turBilgi = adminTur(kayit.tur);
  let kart = null;
  try { kart = turBilgi.kart(guncel, D.bugun); } catch (_) {}
  if (!kart) return '';

  const adres = kartGorselAdresi(kart.img);
  const listeFiyat = Number(turBilgi.listeFiyat ? turBilgi.listeFiyat(guncel) : 0) || 0;
  const fiyat = Number(kart.priceMain) || 0;

  return '<div class="a-alan"><label>Anasayfa kartı — canlı önizleme</label>'
    + '<div class="a-onizleme"><div class="a-onizleme-kart">'
      + '<div class="a-onizleme-medya">'
        + (adres ? '<img src="' + esc(adres) + '" alt="">' : '')
        + '<div class="a-onizleme-rozetler">'
          + (kart.badges || []).map(b => '<span class="a-onizleme-rozet">' + esc(b) + '</span>').join('')
        + '</div>'
      + '</div>'
      + '<div class="a-onizleme-govde">'
        + '<h3>' + esc(kart.title) + '</h3>'
        + '<p class="a-onizleme-meta">' + esc(kart.meta1) + '</p>'
        + '<p class="a-onizleme-meta">' + esc(kart.meta2) + '</p>'
        + (Number(kart.rating)
          ? '<span class="a-onizleme-puan">' + aIkon('star')
            + String(kart.rating).replace('.', ',')
            + '<span>(' + esc(kart.reviews) + ')</span></span>' : '')
        + '<div class="a-onizleme-fiyat">' + adminParaTR(fiyat)
          + (listeFiyat > fiyat ? '<s>' + adminParaTR(listeFiyat) + '</s>' : '')
          + (kart.unit ? '<small>' + esc(kart.unit) + '</small>' : '')
        + '</div>'
      + '</div>'
    + '</div>'
    + '<p class="a-onizleme-not">Fiyat, puan, yorum sayısı ve tarih kayıttan türetiliyor; '
    + 'kartta elle yazılamaz. Yalnızca fotoğraf, kısa ad, rozetler ve alt satır '
    + '<code>card</code> alanından geliyor.</p></div></div>';
}

function farkBloku(fark) {
  return '<div class="a-kart" style="margin-top:16px">'
    + '<div class="a-kart-baslik"><h2>Taslaktaki değişiklikler</h2>'
    + '<p>' + fark.length + ' alan · yalnızca değişen alanlar tutuluyor</p></div>'
    + '<div class="a-tablo-sar"><table class="a-tablo"><thead><tr>'
    + '<th>Alan</th><th>Yayındaki</th><th>Taslaktaki</th></tr></thead><tbody>'
    + fark.map(f => '<tr><td><span class="a-bulgu-alan">' + esc(f.yol) + '</span></td>'
      + '<td style="max-width:320px">' + esc(kisalt(f.eski)) + '</td>'
      + '<td style="max-width:320px"><b>' + esc(kisalt(f.yeni)) + '</b></td></tr>').join('')
    + '</tbody></table></div></div>';
}

function kisalt(deger) {
  const metin = (typeof deger === 'string') ? deger : JSON.stringify(deger);
  const s = String(metin === undefined ? '' : metin);
  return s.length > 140 ? s.slice(0, 140) + '…' : s;
}

/* ---------------- görünüm: anasayfa düzeni ----------------
   Hangi kaydın anasayfanın hangi şeridine girdiğini gösteriyor. Şeride
   giriş ELLE yapılmıyor: catalog.js kayıtları okuyup karta çeviriyor
   (docs/icerik-katalogu.md). Panelde bu görünür olmayınca, "kayıt var
   ama anasayfada göremiyorum" sorusunun cevabı koda bakmaktan geçiyordu. */
function ciz_anasayfa() {
  const kaynaklar = (typeof KATALOG_KAYNAKLARI !== 'undefined') ? KATALOG_KAYNAKLARI : [];
  const seritler = [];
  kaynaklar.forEach(k => {
    let serit = seritler.find(s => s.anchor === k.anchor);
    if (!serit) { serit = { anchor: k.anchor, kartlar: [] }; seritler.push(serit); }
    let kartlar = [];
    try { kartlar = catalogCards(k.anchor, D.bugun) || []; } catch (_) {}
    kartlar.forEach(kart => {
      if (!serit.kartlar.some(x => x.href === kart.href)) serit.kartlar.push(kart);
    });
  });

  const html = seritler.map(s => {
    const kartlar = s.kartlar.map(kart => {
      const adres = kartGorselAdresi(kart.img);
      return '<a class="a-mini" href="#/kayit/' + esc(kartRotasi(kart.href)) + '">'
        + (adres ? '<img src="' + esc(adres) + '" alt="" loading="lazy">' : '<span></span>')
        + '<div class="a-mini-govde"><b>' + esc(kart.title) + '</b>'
        + '<span>' + esc(kart.meta2 || '') + ' · ' + adminParaTR(Number(kart.priceMain) || 0) + '</span>'
        + '<span class="a-mini-etiket turetilen">kayıttan türetildi</span></div></a>';
    }).join('');
    return '<div class="a-serit">'
      + '<div class="a-serit-ust">' + aIkon('grafik') + '<b>' + esc(seritAdi(s.anchor)) + '</b>'
      + '<code>#' + esc(s.anchor) + '</code>'
      + '<span class="a-sag a-rozet">' + s.kartlar.length + ' kayıt</span></div>'
      + (s.kartlar.length ? '<div class="a-serit-liste">' + kartlar + '</div>'
        : bosDurum('Bu şeride giren kayıt yok.'))
      + '</div>';
  }).join('');

  return '<div class="a-serit-uyari">' + aIkon('info')
    + '<p><b>Şeritlere kayıt elle eklenmiyor.</b> Bir kaydı yazdığınızda '
    + '<code>catalog.js</code> onu okuyup anasayfanın kart biçimine çeviriyor ve ilgili şeride '
    + 'karıştırıyor. Burada görünen kartlar anasayfada çıkacak olanların aynısı. '
    + 'Şeritte ayrıca <b>elle yazılmış örnek kartlar</b> da var; onlar '
    + '<code>app.js</code> içindeki <code>cardSections</code> dizisinde duruyor ve içerik '
    + 'sayfaları olmadığı için panelde listelenmiyor.</p></div>' + html;
}

function seritAdi(anchor) {
  const adlar = {
    turlar: 'Günübirlik Turlar',
    'konaklamali-turlar': 'Konaklamalı Turlar',
    oteller: 'Oteller',
    mekanlar: 'Mekanlar',
    etkinlikler: 'Popüler Etkinlikler',
    aktiviteler: 'Aktiviteler',
    'yaklasan-planlar': 'Yaklaşan Planlar'
  };
  return adlar[anchor] || anchor;
}

/* 'otel/kordon-butik-otel/' -> 'otel/kordon-butik-otel' */
function kartRotasi(href) {
  return String(href || '').replace(/\/$/, '');
}

/* ---------------- görünüm: medya ---------------- */
function ciz_medya() {
  const medya = adminMedya(D.kayitlar);
  const s = D.suzgec;
  const terim = adminNormalize(s.q);
  const suzulen = medya.filter(m => {
    if (s.tur !== 'hepsi' && m.tur !== s.tur) return false;
    if (!terim) return true;
    return adminNormalize(m.anahtar + ' ' + m.ad + ' ' + m.dosya).indexOf(terim) !== -1;
  });
  const kullanilmayan = suzulen.filter(m => !m.kullanim.length);

  const cipler = ['<button class="a-cip ' + (s.tur === 'hepsi' ? 'acik' : '') + '" data-tur="hepsi">'
    + 'Hepsi</button>'].concat(ADMIN_TURLER.map(t =>
      '<button class="a-cip ' + (s.tur === t.key ? 'acik' : '') + '" data-tur="' + t.key + '">'
      + '<span class="a-nokta" style="background:' + t.renk + '"></span>' + esc(t.cogul) + '</button>'
    )).join('');

  const kartlar = suzulen.map(m => {
    const adres = medyaAdresi(m.dosya, 400);
    return '<div class="a-medya-kart">'
      + (adres ? '<img src="' + esc(adres) + '" alt="" loading="lazy">' : '<span></span>')
      + '<div class="a-medya-govde">'
        + '<b>' + esc(m.anahtar) + '</b><span>' + esc(m.ad) + '</span>'
        + '<p class="a-medya-kullanim">'
          + (m.kullanim.length
            ? esc(m.kullanim.length + ' yerde: ' + m.kullanim.slice(0, 3).join(', ')
              + (m.kullanim.length > 3 ? '…' : ''))
            : '<span class="a-rozet uyari">kullanılmıyor</span>')
        + '</p>'
      + '</div></div>';
  }).join('');

  return '<div class="a-kart">'
    + '<div class="a-suzgec">' + cipler
      + '<span class="a-sag">' + suzulen.length + ' görsel · '
      + kullanilmayan.length + ' tanesi hiçbir kayıtta kullanılmıyor</span></div>'
    + '<div class="a-kart-govde">'
      + (suzulen.length ? '<div class="a-medya-izgara">' + kartlar + '</div>'
        : bosDurum('Süzgece uyan görsel yok.'))
    + '</div></div>'
    + '<div class="a-serit-uyari" style="margin-top:16px">' + aIkon('info')
    + '<p><b>Görseller depoda durmuyor.</b> Adres, Wikimedia Commons dosya adından '
    + 'deterministik olarak kuruluyor (<code>docs/gorsel-kaynaklari.md</code>). Yeni bir görsel '
    + 'eklemek = ilgili veri dosyasındaki görsel sözlüğüne bir satır; dosya yüklemek '
    + 'gerekmiyor. Kullanılmayan anahtarlar zarar vermiyor ama sözlüğü şişiriyor.</p></div>';
}

/* ---------------- görünüm: denetim ---------------- */
function bulguSatiri(b) {
  const tur = adminTur(b.tur);
  return '<div class="a-bulgu ' + esc(b.seviye) + '">'
    + '<span class="a-bulgu-ikon">' + aIkon(b.seviye === 'bilgi' ? 'info' : 'uyari') + '</span>'
    + '<div style="flex:1">'
      + '<div class="a-bulgu-ust">'
        + '<span class="a-nokta" style="background:' + esc(tur ? tur.renk : '#999') + '"></span>'
        + '<b>' + esc(b.baslik) + '</b>'
        + '<span class="a-bulgu-alan">' + esc(b.alan) + '</span>'
        + '<a class="a-bulgu-git" href="#/kayit/' + esc(b.tur) + '/' + esc(b.slug) + '">Kayda git →</a>'
      + '</div>'
      + '<p>' + esc(b.mesaj) + '</p>'
    + '</div></div>';
}

function ciz_denetim() {
  const { bulgular, ozet } = denetimSonucu();
  const seviyeler = [
    { key: 'hata', etiket: 'Hata', aciklama: 'Sitede görünür bir bozukluk üretir; yayına çıkmamalı.' },
    { key: 'uyari', etiket: 'Uyarı', aciklama: 'Çalışır ama içerik ölçütünün altında kalır.' },
    { key: 'bilgi', etiket: 'Bilgi', aciklama: 'Dikkat çekmeye değer, yanlış değil.' }
  ];

  const kutular = '<div class="a-kutular">'
    + kutu('shield', 'İçerik sağlığı', '%' + ozet.saglik,
        ozet.temizKayit + ' / ' + ozet.toplam + ' kayıt hatasız')
    + kutu('uyari', 'Hata', ozet.hata, ozet.hataliKayit + ' kayıtta')
    + kutu('info', 'Uyarı', ozet.uyari, ozet.uyariliKayit + ' kayıtta')
    + kutu('info', 'Bilgi', ozet.bilgi, 'Bilgi notu')
    + '</div>';

  const bloklar = seviyeler.map(s => {
    const liste = bulgular.filter(b => b.seviye === s.key);
    return '<div class="a-bolum-ara"><h2>' + esc(s.etiket) + ' (' + liste.length + ')</h2>'
      + '<p>' + esc(s.aciklama) + '</p></div>'
      + '<div class="a-kart">'
      + (liste.length ? liste.map(bulguSatiri).join('')
        : '<div class="a-bos">' + aIkon('check') + '<p>Bu seviyede bulgu yok.</p></div>')
      + '</div>';
  }).join('');

  const sayfaNotu = D.sayfalar
    ? ''
    : '<div class="a-serit-uyari">' + aIkon('info')
      + '<p><b>Sayfa yoklaması yapılamadı.</b> İçerik sayfalarının gerçekten açılıp açılmadığı '
      + 'kontrol edilemedi, bu yüzden "bağ ölü" kuralı atlandı. Paneli <code>npm run dev</code> '
      + 'ile açtığınızda yoklama çalışır.</p></div>';

  return kutular + sayfaNotu
    + '<div class="a-serit-uyari" style="margin-top:16px">' + aIkon('info')
    + '<p><b>Denetim, testlerin panel karşılığı.</b> Buradaki kuralların çoğu '
    + '<code>tests/</code> altında da koşuyor; panel aynı hatayı CI\'ya gitmeden, içeriği yazan '
    + 'kişinin ekranında gösteriyor. Panel <b>taslakları değil yayındaki veriyi</b> denetler: '
    + 'taslak henüz veri dosyasına işlenmediği için sitede görünmüyor.</p></div>'
    + bloklar;
}

/* ---------------- görünüm: taslaklar ---------------- */
function ciz_taslaklar() {
  const taslakli = D.kayitlar.filter(taslakliMi);
  if (!taslakli.length) {
    return '<div class="a-kart">' + bosDurum(
      'Bekleyen taslak yok. Bir kaydı düzenlediğinizde değişiklikler burada toplanır.', 'kaydet')
      + '</div>' + taslakAciklamasi();
  }

  const satirlar = taslakli.map(k => {
    const fark = adminFark(k.ham, taslakAl(k.tur, k.slug));
    const bilgi = D.taslaklar[taslakAnahtari(k.tur, k.slug)] || {};
    return '<tr><td>' + satirAdi(k) + '</td>'
      + '<td>' + turNoktasi(k) + ' ' + esc(k.turTekil) + '</td>'
      + '<td>' + fark.map(f => '<span class="a-bulgu-alan">' + esc(f.yol) + '</span>').join(' ') + '</td>'
      + '<td>' + esc(tarihMetni(bilgi.guncel)) + '</td>'
      + '<td class="sag"><span class="a-satir-islem">'
        + '<a class="a-btn kucuk" href="#/kayit/' + esc(k.tur) + '/' + esc(k.slug) + '">'
        + aIkon('kalem') + 'Aç</a>'
        + '<button class="a-btn kucuk tehlike" data-taslak-sil="'
        + esc(taslakAnahtari(k.tur, k.slug)) + '">' + aIkon('cop') + '</button>'
      + '</span></td></tr>';
  }).join('');

  return '<div class="a-kart">'
    + '<div class="a-kart-baslik"><h2>Bekleyen taslaklar</h2>'
      + '<p>' + taslakli.length + ' kayıt · tarayıcınızda duruyor, sitede görünmüyor</p>'
      + '<span class="a-sag">'
      + '<button class="a-btn" id="aHepsiniAktar">' + aIkon('download') + 'Hepsini dışa aktar</button>'
      + '<button class="a-btn tehlike" id="aHepsiniSil">' + aIkon('cop') + 'Hepsini sil</button>'
      + '</span></div>'
    + '<div class="a-tablo-sar"><table class="a-tablo"><thead><tr>'
    + '<th>Kayıt</th><th>Tür</th><th>Değişen alanlar</th><th>Son düzenleme</th><th class="sag">İşlem</th>'
    + '</tr></thead><tbody>' + satirlar + '</tbody></table></div></div>'
    + taslakAciklamasi();
}

function taslakAciklamasi() {
  return '<div class="a-serit-uyari" style="margin-top:16px">' + aIkon('uyari')
    + '<p><b>Taslak tarayıcınızda duruyor, sitede değil.</b> Site statik olarak yayınlanıyor '
    + '(GitHub Pages) ve arka ucu yok; panel depoya dosya yazamaz. Bir değişikliğin yayına '
    + 'girmesi için panelin ürettiği bloğu ilgili veri dosyasına yapıştırıp commit etmeniz '
    + 'gerekiyor. Tarayıcı verisini temizlerseniz bekleyen taslaklar kaybolur.</p></div>';
}

function tarihMetni(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const iki = (n) => String(n).padStart(2, '0');
  return iki(d.getDate()) + '.' + iki(d.getMonth() + 1) + '.' + d.getFullYear()
    + ' ' + iki(d.getHours()) + ':' + iki(d.getMinutes());
}

/* ---------------- görünüm: yeni kayıt ----------------
   Yeni bir içerik yazmak iki dosyaya dokunmayı gerektiriyor: veri
   dosyasındaki kayıt ve içerik sayfasının index.html'i
   (docs/icerik-katalogu.md). Panel bunu adım adım gösteriyor ve
   iskeleti üretiyor; hangi adımın atlandığını hatırlamak zorunda
   kalmamak için. */
function ciz_yeni() {
  const turSecenek = ADMIN_TURLER.map(t =>
    '<option value="' + t.key + '">' + esc(t.tekil) + '</option>').join('');
  const sablonSecenek = D.kayitlar.map(k =>
    '<option value="' + esc(k.tur + '/' + k.slug) + '" data-tur="' + esc(k.tur) + '">'
    + esc(k.turTekil + ' — ' + k.baslik) + '</option>').join('');

  return '<div class="a-serit-uyari">' + aIkon('info')
    + '<p><b>Panel yeni kaydı depoya yazamaz</b> — site statik. Aşağıdaki form, veri dosyasına '
    + 'yapıştırılacak <b>iskeleti</b> üretiyor. İskelet seçtiğiniz kaydın yapısını kopyalar: '
    + 'künye alanları formdan gelir, geri kalan içerik (açıklama, galeri, yorumlar) '
    + '<b>şablondan kopyalanır ve elle değiştirilmelidir</b>.</p></div>'

    + '<div class="a-kart"><div class="a-kart-baslik"><h2>Yeni kayıt iskeleti</h2></div>'
    + '<div class="a-form" id="aYeniForm">'
      + yeniAlan('yeniTur', 'Tür', '<select id="yeniTur">' + turSecenek + '</select>')
      + yeniAlan('yeniSablon', 'Şablon kayıt',
        '<select id="yeniSablon">' + sablonSecenek + '</select>',
        'Yapısı kopyalanacak kayıt. Aynı türden birini seçin.')
      + yeniAlan('yeniSlug', 'Slug', '<input id="yeniSlug" type="text" placeholder="alacati-ruzgar-sorfu">',
        'Küçük harf, tire ile ayrılmış. Adres bundan kuruluyor.')
      + yeniAlan('yeniBaslik', 'Başlık', '<input id="yeniBaslik" type="text">')
      + yeniAlan('yeniOzet', 'Özet cümle', '<textarea id="yeniOzet" rows="2"></textarea>')
      + yeniAlan('yeniKategori', 'Kategori', '<input id="yeniKategori" type="text">')
      + yeniAlan('yeniAlan2', 'Konum', '<input id="yeniAlan2" type="text" placeholder="Alaçatı, İzmir">')
      + yeniAlan('yeniBolge', 'Bölge', '<input id="yeniBolge" type="text" placeholder="Ege">')
      + yeniAlan('yeniKod', 'Ürün kodu', '<input id="yeniKod" type="text" placeholder="MLA-AKT-02">',
        'Kayıtlar arasında tekil olmalı.')
      + '<div class="a-alan genis"><button class="a-btn yesil" id="aYeniUret">'
        + aIkon('kaydet') + 'İskeleti üret</button></div>'
    + '</div></div>'
    + '<div id="aYeniSonuc"></div>';
}

function yeniAlan(id, etiket, girdi, ipucu) {
  return '<div class="a-alan"><label for="' + id + '">' + esc(etiket) + '</label>' + girdi
    + (ipucu ? '<p class="a-ipucu">' + esc(ipucu) + '</p>' : '') + '</div>';
}

/* ---------------- görünüm: yardım ve ayarlar ---------------- */
function ciz_yardim() {
  return '<div class="a-kart"><div class="a-kart-baslik"><h2>Panel nasıl çalışıyor</h2></div>'
    + '<div class="a-kart-govde">'
    + adim(1, 'Panel kendi veri kopyasını tutmuyor. Listede, kartta ve denetimde gördüğünüz '
      + 'her sayı sitenin yayındaki veri dosyalarından okunuyor ve kartı üreten fonksiyonlar '
      + 'sitenin kendi fonksiyonları. Panelde gördüğünüz fiyat ile ziyaretçinin gördüğü fiyat '
      + 'ayrışamaz.')
    + adim(2, 'Düzenlediğiniz alanlar TASLAK olarak tarayıcınızda birikiyor. Taslak yalnızca '
      + 'değişen alanları tutuyor, kaydın kopyasını değil: veri dosyasında sonradan yapılan bir '
      + 'düzeltme taslak açıkken kaybolmasın diye.')
    + adim(3, 'Bir değişikliğin yayına girmesi için "Dışa aktar" ile üretilen bloğu ilgili veri '
      + 'dosyasına yapıştırıp commit etmeniz gerekiyor. Site statik olarak yayınlandığı için '
      + '(GitHub Pages) panelin depoya yazma yolu yok.')
    + adim(4, 'Değişiklik main dalına girene kadar yayındaki sitede görünmez. Yayın yalnızca '
      + 'main dalından yapılıyor.')
    + '</div></div>'

    + '<div class="a-bolum-ara"><h2>Panel şifresi</h2>'
    + '<p>Şifrenin SHA-256 özeti tarayıcınızda saklanır; şifrenin kendisi hiçbir yere yazılmaz.</p></div>'
    + '<div class="a-kart"><div class="a-kart-govde">'
      + '<div class="a-serit-uyari">' + aIkon('uyari')
      + '<p><b>Bu kilit gerçek koruma değil.</b> Site statik yayınlandığı için sunucu tarafında '
      + 'kimlik doğrulaması yok; kilit yalnızca panelin yanlışlıkla açılmasını engeller. Panelde '
      + 'görünen veriler zaten sitenin herkese açık dosyalarından geliyor. Gerçekten korunması '
      + 'gereken bir işlem (rezervasyon, ödeme, kullanıcı verisi) panele eklenmeden önce arka uç '
      + 'kimlik doğrulaması şart.</p></div>'
      + '<div class="a-form" style="padding:0">'
        + yeniAlan('aYeniSifre', 'Yeni şifre', '<input id="aYeniSifre" type="password">')
        + yeniAlan('aYeniSifre2', 'Yeni şifre (tekrar)', '<input id="aYeniSifre2" type="password">')
        + '<div class="a-alan"><label>&nbsp;</label>'
          + '<button class="a-btn birincil" id="aSifreKaydet">' + aIkon('kilit') + 'Şifreyi değiştir</button>'
          + '<p class="a-ipucu">Varsayılana dönmek için alanları boş bırakıp kaydedin.</p></div>'
      + '</div>'
    + '</div></div>'

    + '<div class="a-bolum-ara"><h2>Belgeler</h2></div>'
    + '<div class="a-kart"><div class="a-kart-govde">'
      + '<p style="font-size:13px;line-height:1.7">'
      + 'Panelin kendi belgesi <code>docs/admin-paneli.md</code>. İçerik kayıtlarının anasayfaya '
      + 'nasıl aktığı <code>docs/icerik-katalogu.md</code>, sayfa yapıları '
      + '<code>docs/tur-sayfasi.md</code>, <code>docs/otel-sayfasi.md</code>, '
      + '<code>docs/aktivite-sayfasi.md</code>, <code>docs/etkinlik-sayfasi.md</code> ve '
      + '<code>docs/mekan-sayfasi.md</code> içinde. Görsellerin nereden geldiği '
      + '<code>docs/gorsel-kaynaklari.md</code>, görsel kuralları '
      + '<code>docs/arayuz-kurallari.md</code>.</p>'
    + '</div></div>';
}

function adim(no, metin) {
  return '<div class="a-adim"><span class="a-adim-no">' + no + '</span><p>' + metin + '</p></div>';
}

/* ---------------- dışa aktarma ---------------- */
function disaAktarmayiGoster(kayit) {
  const guncel = kayitGuncelHali(kayit);
  const fark = adminFark(kayit.ham, taslakAl(kayit.tur, kayit.slug));
  const turBilgi = adminTur(kayit.tur);
  const kod = adminJsKaynak(kayit.anahtar, guncel);

  const kutuHtml = '<div class="a-kart" style="margin-top:16px" id="aAktarKutu">'
    + '<div class="a-kart-baslik"><h2>Dışa aktar</h2>'
      + '<p>' + esc(turBilgi.veriDosyasi) + ' → <code>' + esc(turBilgi.degisken) + '</code></p>'
      + '<span class="a-sag">'
      + '<button class="a-btn" id="aKodKopyala">' + aIkon('kopya') + 'Kodu kopyala</button>'
      + '<button class="a-btn" id="aJsonIndir">' + aIkon('download') + 'JSON indir</button>'
      + '</span></div>'
    + '<div class="a-kart-govde">'
      + adim(1, 'Depoda <code>' + esc(turBilgi.veriDosyasi) + '</code> dosyasını açın.')
      + adim(2, '<code>' + esc(turBilgi.degisken) + '</code> nesnesi içindeki <code>'
        + esc(kayit.anahtar) + '</code> kaydını aşağıdaki blokla değiştirin.')
      + adim(3, '<code>npm test</code> çalıştırın; görsel anahtarı, ikon ve bağ bütünlüğü '
        + 'testleri bu değişikliği doğrular.')
      + adim(4, 'Commit edip main dalına aldığınızda değişiklik yayına girer.')
      + (fark.length
        ? '<p class="a-ipucu" style="margin:10px 0 12px">Bu blokta ' + fark.length
          + ' alan taslaktan geliyor: ' + esc(fark.map(f => f.yol).join(', ')) + '.</p>'
        : '<p class="a-ipucu" style="margin:10px 0 12px">Taslak yok; blok yayındaki kaydın '
          + 'birebir aynısı.</p>')
      + '<pre class="a-kod" id="aKod">' + esc(kod) + '</pre>'
    + '</div></div>';

  const eski = aEl('aAktarKutu');
  if (eski) eski.remove();
  aEl('aIcerik').insertAdjacentHTML('beforeend', kutuHtml);
  aEl('aAktarKutu').scrollIntoView({ behavior: 'smooth', block: 'start' });

  aEl('aKodKopyala').onclick = () => panoyaKopyala(kod, 'Kod panoya kopyalandı');
  aEl('aJsonIndir').onclick = () => dosyaIndir(kayit.tur + '-' + kayit.slug + '.json',
    JSON.stringify(guncel, null, 2), 'application/json;charset=utf-8');
}

function hepsiniDisaAktar() {
  const taslakli = D.kayitlar.filter(taslakliMi);
  const bloklar = taslakli.map(k => {
    const turBilgi = adminTur(k.tur);
    return '/* ' + turBilgi.veriDosyasi + ' → ' + turBilgi.degisken + ' */\n'
      + adminJsKaynak(k.anahtar, kayitGuncelHali(k));
  }).join('\n\n');
  dosyaIndir('mola360-taslaklar.js', bloklar, 'text/javascript;charset=utf-8');
  bildir(taslakli.length + ' kayıt indirildi');
}

/* ---------------- form olayları ----------------
   Girdiler DEĞİŞTİKÇE taslağa yazılıyor; "kaydet" düğmesi yok, çünkü
   taslak zaten geçici bir şey ve kaydedilmemiş bir düzenlemenin sekme
   kapanınca kaybolması panelin en can sıkıcı davranışı olurdu.

   Ekran her tuşta YENİDEN ÇİZİLMİYOR: yeniden çizim yazarken odağı ve
   imleç konumunu kaybettirir. Yalnızca önizleme, sayaçlar ve başlıktaki
   taslak rozeti güncelleniyor. */
function girdiDegeri(el) {
  const tip = el.dataset.tip;
  if (tip === 'sayi' || tip === 'nesneSayi') {
    const s = el.value.trim();
    return s === '' ? 0 : Number(s);
  }
  if (tip === 'oran') return Number(el.value) || 0;
  if (tip === 'satirlar') return el.value.split('\n').map(s => s.trim()).filter(Boolean);
  if (tip === 'paragraflar') {
    return el.value.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  }
  return el.value;
}

function formOlayiBagla() {
  const form = aEl('aForm');
  if (!form) return;
  const tur = form.dataset.kayitTur;
  const slug = form.dataset.slug;
  const kayit = kaydiBul(tur, slug);
  if (!kayit) return;

  form.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.yol) return;
    const taslak = Object.assign({}, taslakAl(tur, slug));

    if (el.dataset.tip === 'nesne' || el.dataset.tip === 'nesneSayi') {
      /* Dizi alanı: kaydın GÜNCEL hâlinden kopyalanıp tek satır
         değiştiriliyor. Dizinin tamamı taslağa yazılıyor, çünkü
         'faq[2].a' gibi bir yol yazmak diziyi bölerdi. */
      const guncel = adminTaslakUygula(kayit.ham, taslak);
      const liste = (adminOku(guncel, el.dataset.yol) || []).map(x => Object.assign({}, x));
      const i = Number(el.dataset.indeks);
      if (liste[i]) {
        liste[i][el.dataset.ad] = girdiDegeri(el);
        taslak[el.dataset.yol] = liste;
      }
    } else {
      taslak[el.dataset.yol] = girdiDegeri(el);
    }

    taslakYaz(tur, slug, adminTaslakTemizle(kayit.ham, taslak));
    denetimiTazele();
    onizlemeyiTazele(kayit, el);
  });

  /* Satır ekleme/silme yeniden çizim gerektiriyor: satır sayısı
     değişince form yapısı değişiyor. */
  form.addEventListener('click', (e) => {
    const ekle = e.target.closest('[data-ekle]');
    const sil = e.target.closest('[data-sil]');
    if (!ekle && !sil) return;
    e.preventDefault();

    const yol = (ekle || sil).dataset[ekle ? 'ekle' : 'sil'];
    const taslak = Object.assign({}, taslakAl(tur, slug));
    const guncel = adminTaslakUygula(kayit.ham, taslak);
    const liste = (adminOku(guncel, yol) || []).map(x => Object.assign({}, x));

    if (ekle) {
      const alan = adminAlanlar(tur).find(a => a.yol === yol);
      const bos = {};
      (alan.alanlar || []).forEach(x => { bos[x.ad] = ''; });
      liste.push(bos);
    } else {
      liste.splice(Number(sil.dataset.indeks), 1);
    }
    taslak[yol] = liste;
    taslakYaz(tur, slug, adminTaslakTemizle(kayit.ham, taslak));
    denetimiTazele();
    ciz();
  });
}

function onizlemeyiTazele(kayit, kaynakEl) {
  const guncel = kayitGuncelHali(kayit);
  const kutu = document.querySelector('.a-onizleme');
  if (kutu) {
    const yeni = document.createElement('div');
    yeni.innerHTML = onizlemeBloku(kayit, guncel);
    const icerik = yeni.querySelector('.a-onizleme');
    if (icerik) kutu.replaceWith(icerik);
  }
  /* Başlıktaki durum rozeti ve "Taslağı sıfırla" düğmesi de canlı
     güncelleniyor. Güncellenmediklerinde, kullanıcı bir alanı
     değiştirdikten sonra başlıkta hâlâ "Yayındaki veriyle aynı" yazıyor
     ve sıfırlama düğmesi kapalı kalıyordu — ikisi de yalan. */
  const fark = adminFark(kayit.ham, taslakAl(kayit.tur, kayit.slug));
  const rozet = aEl('aDurumRozet');
  if (rozet) rozet.innerHTML = durumRozeti(fark.length);
  const sifirla = aEl('aTaslakSifirla');
  if (sifirla) sifirla.disabled = !fark.length;

  /* Sayaç ve "değişti" rozeti yalnızca yazılan alanda tazeleniyor. */
  const alanKutusu = kaynakEl.closest('.a-alan');
  if (alanKutusu) {
    const taslak = taslakAl(kayit.tur, kayit.slug);
    alanKutusu.classList.toggle('degisti',
      Object.prototype.hasOwnProperty.call(taslak, kaynakEl.dataset.yol));
    const sayacEl = alanKutusu.querySelector('.a-sayac');
    if (sayacEl && kaynakEl.dataset.tip === 'satirlar') {
      const n = girdiDegeri(kaynakEl).length;
      sayacEl.textContent = n + ' madde · her satır bir madde';
    } else if (sayacEl && kaynakEl.dataset.tip === 'paragraflar') {
      const p = girdiDegeri(kaynakEl);
      sayacEl.textContent = p.length + ' paragraf · '
        + p.reduce((t, x) => t + adminKelimeSayisi(x), 0)
        + ' kelime · paragrafları boş satırla ayırın';
    } else if (sayacEl) {
      const n = kaynakEl.value.length;
      sayacEl.textContent = n + ' / 90 karakter';
      sayacEl.classList.toggle('asiri', n > 90);
    }
  }
  menuyuCiz();
}

/* ---------------- yeni kayıt iskeleti ---------------- */
function yeniIskeletUret() {
  const sablonAd = aEl('yeniSablon').value;
  const [sTur, sSlug] = sablonAd.split('/');
  const sablon = kaydiBul(sTur, sSlug);
  const slug = aEl('yeniSlug').value.trim();

  if (!sablon) { bildir('Şablon kayıt bulunamadı'); return; }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    bildir('Slug küçük harf ve tire olmalı: alacati-ruzgar-sorfu');
    return;
  }
  const tur = adminTur(aEl('yeniTur').value);
  if (tur.key !== sablon.tur) {
    bildir('Şablon ile tür farklı: aynı türden bir şablon seçin');
    return;
  }
  if (kaydiBul(tur.key, slug)) { bildir('Bu slug zaten kullanılıyor'); return; }

  const iskelet = adminKopya(sablon.ham);
  iskelet.slug = slug;
  const yaz = (yol, deger) => { if (deger) adminYaz(iskelet, yol, deger); };
  yaz('title', aEl('yeniBaslik').value.trim());
  yaz('tagline', aEl('yeniOzet').value.trim());
  yaz('category', aEl('yeniKategori').value.trim());
  yaz('categoryShort', aEl('yeniKategori').value.trim());
  yaz('area', aEl('yeniAlan2').value.trim());
  yaz('region', aEl('yeniBolge').value.trim());
  yaz('code', aEl('yeniKod').value.trim());
  yaz('card.title', aEl('yeniBaslik').value.trim());

  const kod = adminJsKaynak(slug, iskelet);
  aEl('aYeniSonuc').innerHTML = '<div class="a-kart" style="margin-top:16px">'
    + '<div class="a-kart-baslik"><h2>İskelet hazır</h2>'
      + '<p>' + esc(tur.veriDosyasi) + ' → <code>' + esc(tur.degisken) + '</code></p>'
      + '<span class="a-sag"><button class="a-btn" id="aYeniKopyala">'
      + aIkon('kopya') + 'Kodu kopyala</button></span></div>'
    + '<div class="a-kart-govde">'
      + adim(1, '<code>' + esc(tur.veriDosyasi) + '</code> içindeki <code>' + esc(tur.degisken)
        + '</code> nesnesine aşağıdaki bloğu ekleyin.')
      + adim(2, '<code>' + esc(tur.dizin + '/' + slug) + '/index.html</code> dizinini oluşturun; '
        + '<code>' + esc(sablon.adres) + 'index.html</code> dosyasını kopyalayıp başlık, açıklama '
        + 've canonical adresini değiştirin.')
      + adim(3, '<b>Şablondan kopyalanan içeriği değiştirin:</b> açıklama paragrafları, öne '
        + 'çıkanlar, galeri anahtarları, SSS ve yorumlar hâlâ '
        + '<code>' + esc(sablon.slug) + '</code> kaydına ait.')
      + adim(4, '<code>npm test</code> çalıştırın, sonra commit edin. Anasayfaya ayrıca kart '
        + 'eklemeniz gerekmiyor: <code>catalog.js</code> kaydı okuyup ilgili şeride kendisi '
        + 'koyuyor.')
      + '<pre class="a-kod">' + esc(kod) + '</pre>'
    + '</div></div>';
  aEl('aYeniKopyala').onclick = () => panoyaKopyala(kod, 'İskelet panoya kopyalandı');
  aEl('aYeniSonuc').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------- çizim ---------------- */
const GORUNUMLER = {
  panel:     { baslik: 'Panel', alt: 'Sitenin içerik durumu bir bakışta', ciz: ciz_panel },
  icerikler: { baslik: 'İçerikler', alt: 'Bütün tur, otel, aktivite, etkinlik ve mekân kayıtları', ciz: ciz_icerikler },
  anasayfa:  { baslik: 'Anasayfa düzeni', alt: 'Hangi kayıt hangi şeride giriyor', ciz: ciz_anasayfa },
  medya:     { baslik: 'Medya', alt: 'Görsel anahtarları ve nerede kullanıldıkları', ciz: ciz_medya },
  denetim:   { baslik: 'Denetim', alt: 'İçerik bütünlüğü raporu', ciz: ciz_denetim },
  taslaklar: { baslik: 'Taslaklar', alt: 'Veri dosyasına işlenmeyi bekleyen değişiklikler', ciz: ciz_taslaklar },
  yeni:      { baslik: 'Yeni kayıt', alt: 'Yeni bir içerik kaydı için iskelet', ciz: ciz_yeni },
  yardim:    { baslik: 'Yardım ve ayarlar', alt: 'Panel nasıl çalışıyor', ciz: ciz_yardim }
};

let aSonEkran = '';

/* Adrese gitmek: adres zaten oradaysa hashchange tetiklenmez, o yüzden
   elle çiziliyor. */
function gitVeyaCiz(yol) {
  if (location.hash === yol) ciz();
  else location.hash = yol;
}

function ciz() {
  const oncekiRota = D.rota;
  D.rota = rotayiOku();
  const ekran = D.rota.ad + '/' + D.rota.arg.join('/');
  const ekranDegisti = ekran !== aSonEkran;
  aSonEkran = ekran;
  const icerik = aEl('aIcerik');

  if (D.rota.ad === 'kayit') {
    const [tur, slug] = D.rota.arg;
    const kayit = kaydiBul(tur, slug);
    basligiYaz(kayit ? kayit.baslik : 'Kayıt', kayit ? kayit.turTekil + ' · ' + kayit.adres : '');
    icerik.innerHTML = ciz_kayit(tur, slug);
    sekmeOlaylari();
    formOlayiBagla();
    kayitOlaylari(kayit);
  } else if (D.rota.ad === 'icerikler') {
    /* #/icerikler/otel — panelden tür kutusuna tıklayınca süzgeç açık
       gelsin. Yalnızca ADRES değiştiğinde uygulanıyor: her çizimde
       uygulansaydı, süzgeci ekrandan değiştirmek imkânsız olurdu. */
    if (ekranDegisti) {
      D.suzgec.tur = (D.rota.arg[0] && adminTur(D.rota.arg[0])) ? D.rota.arg[0] : 'hepsi';
    }
    const g = GORUNUMLER.icerikler;
    basligiYaz(g.baslik, g.alt);
    icerik.innerHTML = g.ciz();
  } else {
    const g = GORUNUMLER[D.rota.ad] || GORUNUMLER.panel;
    if (!GORUNUMLER[D.rota.ad]) D.rota.ad = 'panel';
    basligiYaz(g.baslik, g.alt);
    icerik.innerHTML = g.ciz();
    if (D.rota.ad === 'taslaklar') taslakOlaylari();
    if (D.rota.ad === 'yeni') aEl('aYeniUret').onclick = yeniIskeletUret;
    if (D.rota.ad === 'yardim') aEl('aSifreKaydet').onclick = sifreDegistir;
  }

  menuyuCiz();
  document.body.classList.remove('a-menu-acik');
  /* Kaydırma yalnızca BAŞKA bir ekrana geçerken başa alınıyor. Aynı
     ekranın yeniden çizimi (SSS satırı eklemek, süzgeç değiştirmek)
     sayfayı yukarı fırlatmasın. */
  if (ekranDegisti || !oncekiRota) window.scrollTo(0, 0);
}

function sekmeOlaylari() {
  const kutu = aEl('aSekmeler');
  if (!kutu) return;
  kutu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sekme]');
    if (!b) return;
    D.sekme = b.dataset.sekme;
    ciz();
  });
}

/* İçerik alanındaki tıklamalar TEK bir dinleyiciyle karşılanıyor ve bu
   dinleyici panel açılırken BİR KEZ bağlanıyor.

   İlk sürüm her çizimde yeniden bağlıyordu: #aIcerik her çizimde
   yeniden DOLDURULUYOR ama kendisi aynı eleman olarak kaldığı için
   dinleyiciler üst üste birikiyordu. Sonuç, listeye üçüncü girişte
   sıralama okunun bir tıklamayla üç kez dönmesiydi — yani hiç
   dönmemesi. */
function icerikOlaylariniBagla() {
  const kutu = aEl('aIcerik');

  kutu.addEventListener('click', (e) => {
    const cip = e.target.closest('[data-tur]');
    if (cip) {
      D.suzgec.tur = cip.dataset.tur;
      /* Listede tür süzgeci adrese de yazılıyor: aksi hâlde bir sonraki
         çizim adresteki eski türü geri okur ve süzgeç kendiliğinden
         eski hâline döner. */
      if (D.rota.ad === 'medya') ciz();
      else gitVeyaCiz('#/icerikler' + (cip.dataset.tur === 'hepsi' ? '' : '/' + cip.dataset.tur));
      return;
    }
    if (e.target.closest('#aYalnizTaslak')) {
      D.suzgec.yalnizTaslak = !D.suzgec.yalnizTaslak;
      ciz();
      return;
    }
    const sirala = e.target.closest('[data-sirala]');
    if (sirala) {
      const ad = sirala.dataset.sirala;
      if (D.suzgec.sirala === ad) D.suzgec.yon = D.suzgec.yon === 'artan' ? 'azalan' : 'artan';
      else { D.suzgec.sirala = ad; D.suzgec.yon = 'artan'; }
      ciz();
      return;
    }
    const taslakSil = e.target.closest('[data-taslak-sil]');
    if (taslakSil) {
      if (!confirm('Bu kaydın taslağı silinsin mi?')) return;
      delete D.taslaklar[taslakSil.dataset.taslakSil];
      depoYaz(ANAHTAR_TASLAK, D.taslaklar);
      denetimiTazele();
      ciz();
    }
  });

  kutu.addEventListener('change', (e) => {
    if (e.target.id === 'aBolge') { D.suzgec.bolge = e.target.value; ciz(); }
  });
}

function kayitOlaylari(kayit) {
  if (!kayit) return;
  const sifirla = aEl('aTaslakSifirla');
  if (sifirla) sifirla.onclick = () => {
    if (!confirm('Bu kaydın taslağı silinsin mi? Yayındaki veriye dönülür.')) return;
    taslakYaz(kayit.tur, kayit.slug, null);
    denetimiTazele();
    bildir('Taslak sıfırlandı');
    ciz();
  };
  const aktar = aEl('aDisaAktar');
  if (aktar) aktar.onclick = () => disaAktarmayiGoster(kayit);
}

function taslakOlaylari() {
  const hepsi = aEl('aHepsiniAktar');
  if (hepsi) hepsi.onclick = hepsiniDisaAktar;
  const sil = aEl('aHepsiniSil');
  if (sil) sil.onclick = () => {
    if (!confirm('Bütün taslaklar silinsin mi? Bu geri alınamaz.')) return;
    D.taslaklar = {};
    depoYaz(ANAHTAR_TASLAK, D.taslaklar);
    denetimiTazele();
    bildir('Taslaklar silindi');
    ciz();
  };
}

async function sifreDegistir() {
  const a = aEl('aYeniSifre').value;
  const b = aEl('aYeniSifre2').value;
  if (!a && !b) {
    try { localStorage.removeItem(ANAHTAR_KILIT); } catch (_) {}
    bildir('Varsayılan şifreye dönüldü');
    return;
  }
  if (a !== b) { bildir('Şifreler eşleşmiyor'); return; }
  if (a.length < 4) { bildir('Şifre en az 4 karakter olmalı'); return; }
  depoYaz(ANAHTAR_KILIT, await sha256(a));
  aEl('aYeniSifre').value = '';
  aEl('aYeniSifre2').value = '';
  bildir('Şifre değiştirildi');
}

/* ---------------- başlangıç ---------------- */
function bugunISO() {
  const d = new Date();
  const iki = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate());
}

async function paneliBaslat() {
  aEl('aGiris').classList.add('a-gizli');
  aEl('aKabuk').classList.remove('a-gizli');

  D.bugun = bugunISO();
  await kartGorselleriniYukle();
  D.kayitlar = adminKayitlar(D.bugun);
  denetimiTazele();
  ciz();

  /* Sayfa yoklaması ağ işi: panel onu BEKLEMEDEN açılıyor, sonuç
     gelince denetim tazeleniyor. Beklenseydi panel ağ hızına bağlı
     olarak geç açılırdı. */
  sayfalariYokla().then(() => {
    denetimiTazele();
    if (D.rota.ad === 'denetim' || D.rota.ad === 'panel') ciz();
    else menuyuCiz();
  });

  aEl('aAra').addEventListener('input', (e) => {
    D.suzgec.q = e.target.value;
    if (D.rota.ad !== 'icerikler' && D.rota.ad !== 'medya') git('#/icerikler');
    else ciz();
  });
  icerikOlaylariniBagla();
  aEl('aMenuAc').innerHTML = aIkon('menu');
  aEl('aMenuAc').onclick = () => document.body.classList.toggle('a-menu-acik');
  aEl('aCikis').onclick = () => { oturumKapat(); location.reload(); };
  aEl('aSiteyeGit').innerHTML = aIkon('disari') + '<span>Siteyi yeni sekmede aç</span>';
  aEl('aCikis').innerHTML = aIkon('kilit') + '<span>Oturumu kapat</span>';
  aEl('aAra').insertAdjacentHTML('beforebegin', aIkon('ara'));

  window.addEventListener('hashchange', ciz);
}

function girisiBagla() {
  aEl('aGirisForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const hata = aEl('aGirisHata');
    try {
      const ozet = await sha256(aEl('aPin').value);
      if (ozet !== kilitOzeti()) {
        hata.textContent = 'Şifre yanlış.';
        aEl('aPin').select();
        return;
      }
    } catch (_) {
      /* crypto.subtle yalnızca güvenli bağlamda (https veya localhost)
         çalışır. Panel açılamaz duruma düşmesin diye sebep yazılıyor. */
      hata.textContent = 'Şifre doğrulanamadı: panel https veya localhost üzerinden açılmalı.';
      return;
    }
    oturumAc();
    paneliBaslat();
  });
}

if (oturumAcikMi()) paneliBaslat();
else girisiBagla();
