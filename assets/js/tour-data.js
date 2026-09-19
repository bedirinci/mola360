/* ---------------- tur içerik sayfası: veri ve saf yardımcılar ----------------
   tur.html'in bütün içeriği burada durur; tour-page.js yalnızca bu veriyi
   işaretlemeye çevirir ve etkileşimleri bağlar. Sayfada görünen hiçbir metin
   tour-page.js'in içine yazılmaz — bir turu değiştirmek için tek dosya yeter.

   Fiyat, tarih, iade ve puan hesapları saf fonksiyon: DOM'a hiç dokunmazlar,
   tests/tour.test.js onları doğrudan çağırır. Sayfa bir tuşa basıldığında
   yeniden hesap yapmaz, bu fonksiyonların sonucunu basar.

   Yeni tur eklemek: TOURS'a bir kayıt daha. Sayfa ?tur=<slug> ile o kaydı
   açar, slug bilinmiyorsa DEFAULT_TOUR_SLUG'a düşer. */

/* ---------------- görseller ----------------
   Adresler Wikimedia Commons dosya adından deterministik olarak kurulur;
   yöntem ve gerekçe docs/gorsel-kaynaklari.md içinde. Dosya adı konuyu
   anlattığı için hangi fotoğrafın geldiği adından bellidir.

   app.js'teki cardImages ile ortak olan kayıtlarda dosya adı birebir
   aynıdır; iki dosyada aynı adresi iki kez yazmak yerine ikisi de aynı
   dosya adından üretir. */
const TOUR_IMAGE_FILES = {
  efesKutuphane:  { dosya: 'Ephesus Celsus Library Façade.jpg',    ad: 'Efes — Celsus Kütüphanesi' },
  efesTiyatro:    { dosya: 'Ephesus Great Theatre.jpg',            ad: 'Efes — Büyük Tiyatro' },
  efesYamacEvler: { dosya: 'Terrace Houses Ephesus.jpg',           ad: 'Efes — Yamaç Evler' },
  meryemAna:      { dosya: 'House of the Virgin Mary Ephesus.jpg', ad: 'Meryem Ana Evi' },
  artemis:        { dosya: 'Temple of Artemis Ephesus.jpg',        ad: 'Artemis Tapınağı' },
  sirince:        { dosya: 'Sirince Izmir Turkey.jpg',             ad: 'Şirince Köyü' },
  /* Benzer turlar şeridi: dosya adları cardImages'tekilerle birebir aynı. */
  pamukkale:      { dosya: 'Pamukkale Travertines.jpg',            ad: 'Pamukkale travertenleri' },
  alacati:        { dosya: 'Alaçatı değirmenler 01.jpg',           ad: 'Alaçatı değirmenleri' },
  bodrum:         { dosya: 'Bodrum Hafen.jpg',                     ad: 'Bodrum limanı' },
  kemeralti:      { dosya: 'Kemeraltı market 02.jpg',              ad: 'Kemeraltı Çarşısı' }
};

function commonsImageUrl(dosya, width) {
  const w = Math.max(1, Math.round(Number(width) || 800));
  return 'https://commons.wikimedia.org/wiki/Special:FilePath/'
    + encodeURIComponent(String(dosya).replace(/ /g, '_')) + '?width=' + w;
}

function commonsFileUrl(dosya) {
  return 'https://commons.wikimedia.org/wiki/File:'
    + encodeURIComponent(String(dosya).replace(/ /g, '_'));
}

/* Kayıtsız anahtar boş dizi döndürür: ui.js'teki yedek mekanizma boş src'yi
   yer tutucuya çevirmez, bu yüzden kayıtsız anahtar sessizce geçmesin diye
   tests/tour.test.js kullanılan her anahtarı burada arar. */
function tourImage(key, width) {
  const kayit = TOUR_IMAGE_FILES[key];
  return kayit ? commonsImageUrl(kayit.dosya, width) : '';
}

/* ---------------- ikonlar ----------------
   Sayfa app.js'i yüklemediği (o dosya anasayfanın DOM'una bağlı) için
   kendi ikon seti var. Anasayfayla ortak olanlar birebir aynı çizim. */
const TOUR_ICONS = {
  check:      '<polyline points="4.5 12.5 9.5 17.5 19.5 6.5"/>',
  close:      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  chevDown:   '<polyline points="6 9 12 15 18 9"/>',
  chevUp:     '<polyline points="6 15 12 9 18 15"/>',
  chevLeft:   '<polyline points="15 6 9 12 15 18"/>',
  chevRight:  '<polyline points="9 6 15 12 9 18"/>',
  star:       '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"/>',
  heart:      '<path d="M12 20.5s-7.5-4.6-10-9.3C0.4 8 2 4.5 5.6 4c2.1-0.3 4 0.7 6.4 3 2.4-2.3 4.3-3.3 6.4-3C21.9 4.5 23.6 8 22 11.2c-2.5 4.7-10 9.3-10 9.3z"/>',
  mapPin:     '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.6"/>',
  clock:      '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  calendar:   '<rect x="3" y="5" width="18" height="16" rx="2.5"/><line x1="8" y1="3" x2="8" y2="7.5"/><line x1="16" y1="3" x2="16" y2="7.5"/><line x1="3" y1="10" x2="21" y2="10"/>',
  users:      '<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 3-5.6 6.5-5.6s6.5 2 6.5 5.6"/><path d="M16.4 5.3a3.4 3.4 0 0 1 0 6.5"/><path d="M18 14.7c2.1.6 3.5 2.3 3.5 5.3"/>',
  globe:      '<circle cx="12" cy="12" r="9"/><line x1="3.2" y1="9.5" x2="20.8" y2="9.5"/><line x1="3.2" y1="14.5" x2="20.8" y2="14.5"/><path d="M12 3c2.6 3 2.6 15 0 18-2.6-3-2.6-15 0-18z"/>',
  bus:        '<rect x="4" y="4" width="16" height="12" rx="2.5"/><line x1="4" y1="10.5" x2="20" y2="10.5"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/><line x1="6.5" y1="16" x2="6.5" y2="17.5"/><line x1="17.5" y1="16" x2="17.5" y2="17.5"/>',
  bolt:       '<polygon points="13 2 5 13.5 11 13.5 10 22 19 10 13 10"/>',
  shield:     '<path d="M12 2.8 19.5 6v6c0 4.4-3.1 7.7-7.5 9.2C7.6 19.7 4.5 16.4 4.5 12V6z"/>',
  refresh:    '<path d="M4 12a8 8 0 0 1 14-5.3L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3L4 16"/><path d="M4 20v-4h4"/>',
  info:       '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.8" r=".95" fill="currentColor" stroke="none"/>',
  camera:     '<path d="M4 8.5h3L8.5 6.3h7L17 8.5h3a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z"/><circle cx="12" cy="13.5" r="3.5"/>',
  image:      '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="M4 17.5 8.5 13.4l3.2 2.6 3-2.4 5.3 4.5"/>',
  share:      '<circle cx="18" cy="5.5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="18.5" r="2.6"/><line x1="8.3" y1="10.8" x2="15.7" y2="6.7"/><line x1="8.3" y1="13.2" x2="15.7" y2="17.3"/>',
  plus:       '<line x1="12" y1="5.5" x2="12" y2="18.5"/><line x1="5.5" y1="12" x2="18.5" y2="12"/>',
  minus:      '<line x1="5.5" y1="12" x2="18.5" y2="12"/>',
  food:       '<path d="M6 3v7a2.5 2.5 0 0 0 5 0V3"/><line x1="8.5" y1="10.5" x2="8.5" y2="21"/><path d="M17.5 3c-1.7 1.2-2.5 3-2.5 5.5s.8 3.5 2.5 3.5V21"/>',
  wallet:     '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 8h13.5A2.5 2.5 0 0 1 20 10.5v3H16a2 2 0 0 1 0-4h4"/><circle cx="16" cy="11.5" r=".7" fill="currentColor" stroke="none"/>',
  phone:      '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.9z"/>',
  quote:      '<path d="M9.8 6.4C6.7 7.6 5.2 10 5.2 13.4V18h5.5v-5.6H8.1c0-2.1.8-3.5 2.4-4.2z"/><path d="M19.3 6.4c-3.1 1.2-4.6 3.6-4.6 7V18h5.5v-5.6h-2.6c0-2.1.8-3.5 2.4-4.2z"/>',
  sparkle:    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  sun:        '<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/><line x1="5.3" y1="5.3" x2="7" y2="7"/><line x1="17" y1="17" x2="18.7" y2="18.7"/><line x1="5.3" y1="18.7" x2="7" y2="17"/><line x1="17" y1="7" x2="18.7" y2="5.3"/>'
};

function tourSvg(name) {
  return '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"'
    + ' stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
    + (TOUR_ICONS[name] || '') + '</svg>';
}

/* ---------------- sayı ve tarih biçimi ----------------
   Intl kullanılmıyor: tarayıcı ve test ortamının yerel ayarı farklıysa
   aynı veri iki farklı metin üretir. Biçim burada sabit. */
const AYLAR_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const GUNLER_TR_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/* 1290 -> "1.290". Kuruş gösterilmez; fiyatlar tam TL. */
function formatNumberTR(value) {
  const tam = Math.round(Number(value) || 0);
  const basamaklar = String(Math.abs(tam));
  let out = '';
  for (let i = 0; i < basamaklar.length; i++) {
    if (i > 0 && (basamaklar.length - i) % 3 === 0) out += '.';
    out += basamaklar[i];
  }
  return (tam < 0 ? '-' : '') + out;
}

function formatTRY(value) {
  return formatNumberTR(value) + ' TL';
}

/* Date | "2026-10-11" -> Date (yerel gece yarısı).
   Yerel kurulum şart: UTC ile kurulunca +03 saat diliminde tarih bir gün
   geriye kayıyor ve seçilen gün ile gösterilen gün ayrışıyor. */
function asDate(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  /* Yalnizca metin ve sayi denenir: new Date(null) 1 Ocak 1970'e dusuyor,
     yani "tarih yok" sessizce gecerli bir tarihe donusuyordu. */
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toISODate(value) {
  const d = asDate(value);
  if (!d) return '';
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const gun = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + ay + '-' + gun;
}

/* "2026-10-11" -> "11 Ekim Cumartesi" */
function formatTrDate(value) {
  const d = asDate(value);
  if (!d) return '';
  return d.getDate() + ' ' + AYLAR_TR[d.getMonth()] + ' ' + GUNLER_TR[d.getDay()];
}

/* Tarih çipleri için kısa biçim: { gun: "11", ay: "Ekim", hafta: "Cmt" } */
function trDateParts(value) {
  const d = asDate(value);
  if (!d) return { gun: '', ay: '', hafta: '', iso: '' };
  return {
    gun: String(d.getDate()),
    ay: AYLAR_TR[d.getMonth()],
    hafta: GUNLER_TR_KISA[d.getDay()],
    iso: toISODate(d)
  };
}

/* Tur yalnızca belirli günler kalkıyor; takvim de yalnızca o günleri
   göstermeli. weekdays: Date.getDay() değerleri (0 = pazar).
   leadDays: en erken kaç gün sonrası satılabilir (aynı gün satılmaz). */
function nextDepartureDates(from, weekdays, count, leadDays) {
  const gunler = (Array.isArray(weekdays) && weekdays.length) ? weekdays : [0, 1, 2, 3, 4, 5, 6];
  const baslangic = asDate(from) || new Date();
  const adet = Math.max(0, Math.round(Number(count) || 0));
  const bekleme = Number.isFinite(Number(leadDays)) ? Math.max(0, Math.round(Number(leadDays))) : 1;
  const imlec = new Date(baslangic.getFullYear(), baslangic.getMonth(), baslangic.getDate() + bekleme);
  const out = [];
  /* Üst sınır: haftada tek kalkış olsa bile bir yıl içinde adet dolar. */
  for (let i = 0; i < 400 && out.length < adet; i++) {
    if (gunler.indexOf(imlec.getDay()) !== -1) out.push(toISODate(imlec));
    imlec.setDate(imlec.getDate() + 1);
  }
  return out;
}

/* Kalan kontenjan tarihten türetilir. Rastgele sayı kullanılsa rakam her
   sayfa yenilemesinde zıplar ve "acele et" mesajı inandırıcılığını
   kaybeder; aynı tarih her zaman aynı sayıyı verir. */
function seatsLeft(iso, total) {
  const kapasite = Math.max(1, Math.round(Number(total) || 1));
  const metin = String(iso || '');
  let h = 7;
  for (let i = 0; i < metin.length; i++) h = (h * 31 + metin.charCodeAt(i)) % 9973;
  const ust = Math.min(kapasite, 9);
  return 2 + (h % Math.max(1, ust - 1));
}

/* ---------------- fiyat ----------------
   Kişi sayısı sınırları tek yerde: hem sayaç butonları hem toplam hesabı
   bu fonksiyonu kullanır, böylece ekranda görünen sayı ile hesaplanan
   sayı ayrışamaz. */
function clampParty(tour, party) {
  const p = (tour && tour.pricing) || {};
  const enFazlaKisi = Math.max(1, Math.round(Number(p.maxGuests) || 9));
  const enFazlaBebek = Math.max(0, Math.round(Number(p.maxInfants) || 2));
  const sec = party || {};

  let yetiskin = Math.max(1, Math.floor(Number(sec.adults) || 1));
  yetiskin = Math.min(yetiskin, enFazlaKisi);

  let cocuk = Math.max(0, Math.floor(Number(sec.children) || 0));
  cocuk = Math.min(cocuk, enFazlaKisi - yetiskin);

  /* Her bebeğe bir yetişkin: kucakta seyahat ediyor. */
  let bebek = Math.max(0, Math.floor(Number(sec.infants) || 0));
  bebek = Math.min(bebek, enFazlaBebek, yetiskin);

  return { adults: yetiskin, children: cocuk, infants: bebek };
}

/* Ek seçenek "guest" ise ücretli kişi sayısıyla, "booking" ise bir kez
   çarpılır. Bebekler ücretli sayılmaz. */
function calcTotal(tour, secim) {
  const p = (tour && tour.pricing) || {};
  const party = clampParty(tour, secim);
  const secilen = Array.isArray(secim && secim.addons) ? secim.addons : [];
  const ucretliKisi = party.adults + party.children;

  const yetiskinToplam = party.adults * (Number(p.adult) || 0);
  const cocukToplam = party.children * (Number(p.child) || 0);
  const araToplam = yetiskinToplam + cocukToplam;

  const listeToplam = party.adults * (Number(p.adultList) || Number(p.adult) || 0)
    + party.children * (Number(p.childList) || Number(p.child) || 0);

  const ekler = ((tour && tour.addons) || [])
    .filter(a => secilen.indexOf(a.id) !== -1)
    .map(a => ({
      id: a.id,
      label: a.label,
      amount: a.per === 'guest' ? (Number(a.price) || 0) * ucretliKisi : (Number(a.price) || 0)
    }));
  const eklerToplam = ekler.reduce((toplam, a) => toplam + a.amount, 0);

  return {
    adults: party.adults,
    children: party.children,
    infants: party.infants,
    payingGuests: ucretliKisi,
    guests: ucretliKisi + party.infants,
    adultTotal: yetiskinToplam,
    childTotal: cocukToplam,
    subtotal: araToplam,
    listSubtotal: listeToplam,
    saving: Math.max(0, listeToplam - araToplam),
    addons: ekler,
    addonsTotal: eklerToplam,
    total: araToplam + eklerToplam
  };
}

function discountPercent(listPrice, price) {
  const liste = Number(listPrice) || 0;
  const guncel = Number(price) || 0;
  if (liste <= 0 || guncel <= 0 || guncel >= liste) return 0;
  return Math.round(((liste - guncel) / liste) * 100);
}

/* ---------------- iptal / iade ----------------
   Basamaklar veride sıralı yazılmış olmak zorunda değil; burada
   büyükten küçüğe sıralanıp ilk eşleşen basamak döndürülür.
   Negatif saat (tur başlamış) en alt basamağa düşer. */
function refundTier(hoursBefore, tiers) {
  const liste = (Array.isArray(tiers) ? tiers.slice() : [])
    .sort((a, b) => (Number(b.minHours) || 0) - (Number(a.minHours) || 0));
  if (!liste.length) return null;
  const saat = Number(hoursBefore);
  const olcu = Number.isFinite(saat) ? saat : 0;
  for (let i = 0; i < liste.length; i++) {
    if (olcu >= (Number(liste[i].minHours) || 0)) return liste[i];
  }
  return liste[liste.length - 1];
}

function refundAmount(total, hoursBefore, tiers) {
  const basamak = refundTier(hoursBefore, tiers);
  const oran = basamak ? (Number(basamak.rate) || 0) : 0;
  return Math.round((Number(total) || 0) * oran);
}

/* ---------------- puanlar ----------------
   Ortalama yıldız dağılımından hesaplanır; veride ayrıca "4.8" yazıp
   dağılımı başka bir ortalamaya götüren bir kayıt tutmuyoruz. */
function ratingSummary(breakdown) {
  const rows = [5, 4, 3, 2, 1].map(star => ({
    star: star,
    count: Math.max(0, Math.round(Number(breakdown && breakdown[star]) || 0))
  }));
  const total = rows.reduce((toplam, r) => toplam + r.count, 0);
  const agirlikli = rows.reduce((toplam, r) => toplam + r.star * r.count, 0);
  rows.forEach(r => { r.percent = total ? Math.round((r.count / total) * 100) : 0; });
  return {
    total: total,
    average: total ? Math.round((agirlikli / total) * 10) / 10 : 0,
    rows: rows
  };
}

/* star: 0 / null -> tüm yorumlar. Kaynak dizi değiştirilmez. */
function filterReviews(reviews, star) {
  const liste = Array.isArray(reviews) ? reviews : [];
  const yildiz = Math.round(Number(star) || 0);
  if (!yildiz) return liste.slice();
  return liste.filter(r => Math.round(Number(r.rating) || 0) === yildiz);
}

/* "Bedir İnci" -> "Bİ" (yorum kartlarındaki avatar) */
function reviewerInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toLocaleUpperCase('tr-TR'))
    .join('');
}

/* ?tur=efes-sirince -> "efes-sirince". URLSearchParams yerine düz regex:
   fonksiyon saf kalıyor, test için tarayıcı nesnesi gerekmiyor. */
function tourSlugFromQuery(query) {
  const m = String(query || '').match(/[?&]tur=([^&#]*)/);
  if (!m) return '';
  try {
    return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
  } catch (_) {
    return '';
  }
}

/* ---------------- turlar ----------------
   Tek kayıt tek tur. Sayfadaki her başlık, her madde ve her fiyat bu
   nesneden gelir; tour-page.js içinde sabit metin yok.

   NOT: buradaki tur kurgusaldır (gerçek envanter bağlanana kadar örnek
   içerik). Bu yüzden tur.html'de Product/Offer/AggregateRating yapısal
   verisi YOK — gerekçesi docs/tur-sayfasi.md ve docs/seo-arastirma.md
   (madde 2) içinde: uydurma fiyat ve puanı işaretlemek yanıltıcı yapısal
   veridir. Yalnızca doğru olan işaretlenir (BreadcrumbList). */
const TOURS = {
  'efes-sirince': {
    slug: 'efes-sirince',
    title: 'Efes Antik Kenti, Meryem Ana Evi ve Şirince Turu',
    tagline: 'İzmir çıkışlı tam gün, küçük grup, lisanslı rehber',
    category: 'Günübirlik Tur',
    categoryHref: 'index.html#turlar',
    area: 'Selçuk, İzmir',
    region: 'Ege',
    code: 'MLA-EFS-01',

    badges: [
      { icon: 'bolt',    label: 'Anında onay' },
      { icon: 'refresh', label: '48 saate kadar ücretsiz iptal' },
      { icon: 'users',   label: 'En fazla 16 kişi' },
      { icon: 'shield',  label: 'Mobil bilet' }
    ],

    /* Üst şerit: turun "künyesi". Altı kutu, mobilde ikili ızgara. */
    facts: [
      { icon: 'clock',    label: 'Süre',    value: '9 saat',            note: 'Tam gün' },
      { icon: 'users',    label: 'Grup',    value: 'En fazla 16 kişi',  note: 'Küçük grup' },
      { icon: 'globe',    label: 'Dil',     value: 'Türkçe, İngilizce', note: 'Lisanslı rehber' },
      { icon: 'calendar', label: 'Kalkış',  value: '08:15',             note: 'Salı, Perşembe, Cumartesi, Pazar' },
      { icon: 'bus',      label: 'Ulaşım',  value: 'Klimalı minibüs',   note: 'İzmir merkezden alım' },
      { icon: 'food',     label: 'Yemek',   value: 'Öğle yemeği dahil', note: 'Vejetaryen seçenek var' }
    ],

    gallery: [
      { key: 'efesKutuphane',  caption: 'Celsus Kütüphanesi, Efes' },
      { key: 'efesTiyatro',    caption: '24 bin kişilik Büyük Tiyatro' },
      { key: 'sirince',        caption: 'Şirince’nin taş sokakları' },
      { key: 'meryemAna',      caption: 'Meryem Ana Evi, Bülbül Dağı' },
      { key: 'efesYamacEvler', caption: 'Yamaç Evler’in mozaikleri' },
      { key: 'artemis',        caption: 'Artemis Tapınağı’ndan kalan sütun' }
    ],

    highlights: [
      'Celsus Kütüphanesi, Kuretler Caddesi ve 24 bin kişilik Büyük Tiyatro’yu lisanslı rehberle gezin',
      'Üst kapıdan alt kapıya yokuş aşağı rota: 3 kilometre, 2 saat 15 dakika, dik tırmanış yok',
      'Meryem Ana Evi’nde kalabalıktan uzak 45 dakika',
      'Artemis Tapınağı’nda fotoğraf molası — yedi harikadan ayakta kalan tek sütun',
      'Şirince’de meyve şarabı tadımı ve köy pazarında serbest zaman',
      'Klimalı 16 koltuklu araç, Alsancak–Konak–Bornova’dan biniş'
    ],

    /* Üç paragraf, her biri kendi başına anlaşılan bir pasaj: docs/
       seo-arastirma.md madde 2'deki 130-170 kelimelik pasaj yapısı. */
    description: [
      'Efes, Roma İmparatorluğu’nun Asya eyaletinin başkentiydi; bir zamanlar 200 bine yakın insan bu sokaklarda yaşadı. Tur antik kentin üst kapısından başlayıp yokuş aşağı ilerlediği için yorucu değil: Odeon, Domitian Tapınağı, Kuretler Caddesi ve Hadrian Tapınağı’nı sırayla görür, Celsus Kütüphanesi’nin cephesinde durur, günü 24 bin kişilik Büyük Tiyatro’da bitirirsiniz.',
      'Öğleden sonra rota yükseklere çıkıyor. Bülbül Dağı’ndaki Meryem Ana Evi, Katolik Kilisesi’nin hac yeri olarak tanıdığı küçük bir taş yapı; antik kentin kalabalığından sonra sessiz bir mola. Ardından Artemis Tapınağı için kısa bir fotoğraf durağı var: dünyanın yedi harikasından biriydi, bugün geriye tek bir sütun kaldı.',
      'Gün Şirince’de bitiyor. Rumlardan kalan taş evler, meyve şarabı üreten küçük imalathaneler ve el işi tezgâhlarıyla köy, günün en rahat saatini geçirmek için doğru yer. Bir kadeh tadım turun içinde; kalan bir buçuk saatte ne yapacağınız size kalmış.'
    ],

    /* Program: saat + başlık + açıklama. badge alanı "bu durak fiyata
       dahil" bilgisini durağın yanında tutar; misafir dahil olanlar
       listesine gitmek zorunda kalmaz. */
    itinerary: [
      { time: '08:15', title: 'Alsancak Gündoğdu Meydanı’ndan hareket',
        text: 'Konak Saat Kulesi 08:30, Bornova metro çıkışı 08:45. Araç klimalı ve 16 koltukludur; koltuklar biniş sırasına göre serbesttir.' },
      { time: '09:45', title: 'Meryem Ana Evi (Bülbül Dağı)', duration: '45 dk', badge: 'Giriş dahil',
        text: 'Şapel küçük olduğu için içeride sessizlik istenir. Çıkışta çeşme başı ve dilek duvarı var; omuz ve diz kapalı kıyafet gerekir.' },
      { time: '11:00', title: 'Efes Antik Kenti — üst kapıdan giriş', duration: '2 sa 15 dk', badge: 'Giriş dahil',
        text: 'Odeon, Domitian Tapınağı, Kuretler Caddesi, Hadrian Tapınağı, Celsus Kütüphanesi ve Büyük Tiyatro. Rota baştan sona yokuş aşağı; arada gölgeli duraklar var.' },
      { time: '13:15', title: 'Selçuk’ta öğle yemeği', duration: '1 saat', badge: 'Yemek dahil',
        text: 'Köy usulü açık büfe: mevsim sebzeleri, ev yapımı mantı, ızgara. Vejetaryen ve glutensiz seçenek var, içecekler ayrı.' },
      { time: '14:30', title: 'Artemis Tapınağı', duration: '20 dk',
        text: 'Fotoğraf molası. Alan tamamen açık ve gölgesiz; yaz aylarında şapka işe yarar. Karşı yakada Selçuk Kalesi ve İsa Bey Camii görünür.' },
      { time: '15:15', title: 'Şirince Köyü', duration: '1 sa 30 dk', badge: 'Tadım dahil',
        text: 'Bir kadeh meyve şarabı tadımı dahil. Taş sokaklar, köy pazarı ve Aziz Yahya Kilisesi serbest zamanda gezilir.' },
      { time: '17:00', title: 'İzmir’e dönüş',
        text: 'Yol yaklaşık 1 saat 15 dakika; cuma ve pazar akşamları trafik nedeniyle 20 dakika kadar uzayabilir.' },
      { time: '18:30', title: 'Alsancak’ta bitiş',
        text: 'Sabah bindiğiniz noktada iniş. Otelden alım seçeneğini aldıysanız otel kapısına bırakılırsınız.' }
    ],

    included: [
      'Klimalı minibüsle İzmir merkezden gidiş-dönüş',
      'Lisanslı profesyonel rehber (Türkçe / İngilizce)',
      'Efes Antik Kenti giriş ücreti',
      'Meryem Ana Evi giriş ücreti',
      'Öğle yemeği (köy usulü açık büfe)',
      'Şirince’de bir kadeh meyve şarabı tadımı',
      'Zorunlu seyahat sigortası',
      'Araçta kişi başı 1 şişe su'
    ],

    excluded: [
      'Yamaç Evler ek bileti — rezervasyonda eklenebilir',
      'Öğle yemeğinde içecekler',
      'Kişisel harcamalar ve hediyelik alışverişi',
      'Rehber ve şoför bahşişi (isteğe bağlı)',
      'İzmir merkez dışındaki tesislerden alım'
    ],

    meeting: {
      title: 'Alsancak — Gündoğdu Meydanı',
      address: 'Gündoğdu Meydanı, Cumhuriyet Bulvarı, Alsancak / Konak, İzmir',
      note: 'Meydandaki mola360 tabelalı minibüsü arayın. Rehber 08:00’de alanda olur, araç 08:15’te hareket eder. Geç kalan misafir beklenemiyor; yola çıkmadan önce destek hattını aramanız yeterli, sizi bir sonraki biniş noktasında alırız.',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu%20Meydan%C4%B1%20Alsancak%20%C4%B0zmir',
      points: [
        { time: '08:15', name: 'Alsancak — Gündoğdu Meydanı', detail: 'Ana kalkış noktası' },
        { time: '08:30', name: 'Konak — Saat Kulesi durakları', detail: 'Vapur iskelesine 3 dakika' },
        { time: '08:45', name: 'Bornova — metro çıkışı', detail: 'Son biniş noktası' }
      ],
      dropoff: '18:30 civarında aynı noktalarda iniş.'
    },

    bring: [
      'Kaygan olmayan tabanlı rahat ayakkabı',
      'Şapka ve güneş kremi — antik kentte gölge az',
      'Doldurulabilir su şişesi',
      'Kimlik veya pasaport',
      'Yağmurluk (kasım – mart)'
    ],

    important: [
      'Antik kentte zemin mermer ve taş döşeli; tekerlekli sandalye erişimi kısıtlıdır. Alt kapıdan kısaltılmış rota için rezervasyon notuna yazmanız yeterli.',
      '0-2 yaş ücretsiz, kucakta seyahat eder. Bebek koltuğu talebini rezervasyon notuna ekleyin.',
      'Meryem Ana Evi bir ibadet yeridir; omuz ve diz kapalı kıyafet gerekir.',
      'Tur 4 kişinin altında kalırsa en geç 48 saat önce iptal edilir; ücretin tamamı iade edilir veya başka bir tarihe aktarılır.',
      'Resmî tatillerde antik kent daha kalabalık olur, durak süreleri 15-20 dakika kayabilir.'
    ],

    cancellation: {
      tiers: [
        { minHours: 48, rate: 1,   label: '48 saat ve öncesi', text: 'Ücretin tamamı iade edilir.' },
        { minHours: 24, rate: 0.5, label: '24 – 48 saat arası', text: 'Ücretin yarısı iade edilir.' },
        { minHours: 0,  rate: 0,   label: 'Son 24 saat',        text: 'İade yapılmaz; tarih değişikliği için destek hattını arayın.' }
      ],
      note: 'Hava koşulları veya yol kapanması nedeniyle tur mola360 tarafından iptal edilirse ücretin tamamı iade edilir; dilerseniz başka bir tarihe aktarılır.',
      /* Örnek iade tutarı bu tur fiyatı üzerinden gösterilir. */
      exampleTotal: 1290
    },

    pricing: {
      adult: 1290,
      adultList: 1690,
      child: 890,
      childList: 1190,
      infant: 0,
      childAges: '3 – 11 yaş',
      infantAges: '0 – 2 yaş',
      maxGuests: 9,
      maxInfants: 2,
      unitNote: 'kişi başı',
      seatsPerDeparture: 16,
      /* Date.getDay(): 0 pazar, 2 salı, 4 perşembe, 6 cumartesi */
      departureDays: [2, 4, 6, 0],
      leadDays: 1,
      startTime: '08:15'
    },

    addons: [
      { id: 'yamacEvler', per: 'guest',   price: 380, label: 'Yamaç Evler ek bileti',
        text: 'Mozaikli Roma konutları, rehber eşliğinde 30 dakika' },
      { id: 'otelAlim',   per: 'booking', price: 250, label: 'Otelden alım ve bırakma',
        text: 'İzmir merkez otellerinde geçerli' },
      { id: 'fotograf',   per: 'booking', price: 900, label: 'Profesyonel fotoğraf paketi',
        text: '40+ düzenlenmiş kare, 48 saatte teslim' }
    ],

    trust: [
      { icon: 'bolt',    text: 'Anında onay — e-bilet hemen oluşur' },
      { icon: 'refresh', text: '48 saat öncesine kadar ücretsiz iptal' },
      { icon: 'shield',  text: 'Güvenli ödeme, 3D Secure' }
    ],

    /* Kıtlık ve sosyal kanıt: rakamlar veriden gelir, arayüzde üretilmez. */
    social: { viewedLast24h: 37, bookedThisWeek: 19 },

    ratingBreakdown: { 5: 1065, 4: 140, 3: 26, 2: 10, 1: 6 },

    ratingAspects: [
      { label: 'Rehber',            value: 4.9 },
      { label: 'Program akışı',     value: 4.8 },
      { label: 'Fiyat / performans', value: 4.7 },
      { label: 'Ulaşım',            value: 4.6 }
    ],

    reviews: [
      { name: 'Elif Karaca', date: '2026-09-07', rating: 5, party: 'Çift olarak',
        title: 'Üst kapıdan başlamak her şeyi değiştiriyor',
        text: 'Daha önce Efes’e kendi başımıza gitmiştik ve alt kapıdan yukarı tırmanıp yarısında pes etmiştik. Bu turda rota tersten, yokuş aşağı. Rehber Serkan her yapının ne işe yaradığını anlatınca taş yığını olmaktan çıkıyor. Şirince’de kalan bir buçuk saat de tam yetti.' },
      { name: 'Mehmet Şahin', date: '2026-09-02', rating: 5, party: 'Ailece',
        title: 'Çocuklar sıkılmadı',
        text: '9 ve 12 yaşında iki çocukla katıldık. Tiyatroda oturup dinlenmek, sonra yemekte açık büfe olması iyi oldu. Yamaç Evler biletini de aldık, mozaikler çocukların en çok konuştuğu şey oldu. Araç serin, şoför sakin.' },
      { name: 'Ayşe Demir', date: '2026-08-24', rating: 4, party: 'Arkadaş grubu',
        title: 'Güzel tur, öğle arası kısa',
        text: 'Program çok iyi kurulmuş, rehber gerçekten bilgili. Tek eksik öğle yemeği için ayrılan bir saat; sıcakta sıraya girince acele etmek zorunda kaldık. Şirince’de tadım yapan yer de çok kalabalıktı ama kahve içecek sakin bir köşe bulduk.' },
      { name: 'Can Özdemir', date: '2026-08-19', rating: 5, party: 'Tek başına',
        title: 'Küçük grup sözü tutuldu',
        text: 'On üç kişiydik, kulaklık gerekmedi, rehberi her yerde rahat duyduk. Meryem Ana Evi’nde kalabalık yoktu çünkü sabah erken gidiyoruz. Tek başına katılan biri için de rahat bir tur, kimse yalnız bırakmadı.' },
      { name: 'Zeynep Aydın', date: '2026-08-11', rating: 5, party: 'Çift olarak',
        title: 'Fotoğraf paketi beklediğimden iyi çıktı',
        text: 'Ek paketi merakla aldık, 52 kare geldi ve iki günde e-postaya düştü. Kütüphane cephesinde ışık öğleye doğru tam karşıdan geliyor, fotoğrafçı bunu bildiği için bizi doğru saatte oraya götürdü.' },
      { name: 'Burak Yıldız', date: '2026-07-29', rating: 4, party: 'Ailece',
        title: 'Sıcakla ilgili uyarıyı ciddiye alın',
        text: 'Temmuzda gittik, tur kusursuz ama antik kentte gerçekten gölge yok. Şapka ve iki litre su şart. Araçta verilen şişe yetmiyor, Selçuk’ta ek su aldık. Onun dışında program, rehber ve yemek gayet iyiydi.' },
      { name: 'Deniz Koç', date: '2026-07-15', rating: 3, party: 'Arkadaş grubu',
        title: 'Bornova’dan biniş sıkıntılı oldu',
        text: 'Turun içeriğine söyleyecek sözüm yok, güzel. Ama Bornova’dan binenler için sabah 08:45 buluşması metro çıkışında tam nerede olduğu belirsizdi, on dakika telefonla aradık. Kalkış noktasının tarifi biraz daha net yazılabilir.' },
      { name: 'Gamze Arslan', date: '2026-07-06', rating: 5, party: 'Çift olarak',
        title: 'İptal değişikliği sorunsuz halledildi',
        text: 'Tarihi bir hafta önce değiştirmek zorunda kaldık, tek telefonla oldu ve ek ücret istenmedi. Turda da her şey yazıldığı gibiydi: kalkış saati, duraklar, dönüş. Beklenti yönetimi iyi yapılmış.' }
    ],

    faq: [
      { q: 'Efes Antik Kenti girişi fiyata dahil mi?',
        a: 'Evet. Efes Antik Kenti ve Meryem Ana Evi giriş ücretleri tur fiyatına dahildir. Yalnızca Yamaç Evler ayrı biletle geziliyor; bu bileti rezervasyon sırasında ek seçenek olarak ekleyebilir ya da alanda kendiniz alabilirsiniz.' },
      { q: 'Turda ne kadar yürüyoruz?',
        a: 'Antik kent içinde yaklaşık 3 kilometre, üst kapıdan alt kapıya doğru ve büyük bölümü yokuş aşağı. Ortalama tempoda 2 saat 15 dakika sürer, arada gölgeli duraklar var. Kaygan olmayan rahat bir ayakkabı yeterli; özel bir kondisyon gerekmiyor.' },
      { q: 'Çocuklarla katılabilir miyiz?',
        a: '3-11 yaş çocuklar indirimli tarifeden katılır, 0-2 yaş ücretsizdir. Bebek arabası taş zeminde zorlanıyor, kanguru taşıyıcı daha rahat olur. Öğle yemeğinde çocuk porsiyonu isteyebilirsiniz; ek ücret alınmaz.' },
      { q: 'Otelden alınabilir miyiz?',
        a: 'İzmir merkezdeki oteller için rezervasyona “Otelden alım ve bırakma” seçeneğini ekleyin; sabah otel kapısından alınır, akşam aynı yere bırakılırsınız. Merkez dışındaki tesisler için önce destek hattından teyit almanız gerekir.' },
      { q: 'Tur hangi günler kalkıyor?',
        a: 'Salı, perşembe, cumartesi ve pazar günleri. Rezervasyon takviminde yalnızca kalkış olan günler seçilebilir. Grup 4 kişinin altında kalırsa tur en geç 48 saat önce iptal edilir ve ücretin tamamı iade edilir.' },
      { q: 'Yağmur yağarsa tur yapılıyor mu?',
        a: 'Hafif yağışta program aynen uygulanır; antik kentte üstü kapalı alan az olduğu için yağmurluk getirmenizi öneririz. Sağanak veya fırtına güvenlik riski oluşturursa tur iptal edilir ve ücretin tamamı iade edilir.' }
    ],

    operator: {
      name: 'Ege Rota Turizm',
      since: 2014,
      tours: 38,
      guests: '6.400+',
      rating: 4.8,
      response: 'Mesajlara ortalama 1 saat içinde yanıt veriyor',
      about: 'İzmir merkezli, yalnızca Ege rotalarında çalışan küçük grup operatörü. Rehberlerin tamamı profesyonel turist rehberi belgesine sahiptir.'
    },

    similar: [
      { key: 'pamukkale', title: 'Pamukkale ve Hierapolis Turu', meta: 'İzmir çıkışlı · 12 saat', rating: '4.7', price: 1890 },
      { key: 'alacati',   title: 'Alaçatı ve Çeşme Turu',        meta: 'İzmir çıkışlı · 8 saat',  rating: '4.6', price: 990 },
      { key: 'bodrum',    title: 'Bodrum Tekne Turu',            meta: 'Bodrum çıkışlı · 6 saat', rating: '4.8', price: 1150 },
      { key: 'kemeralti', title: 'İzmir Şehir Turu: Kemeraltı ve Konak', meta: 'İzmir çıkışlı · 5 saat', rating: '4.5', price: 690 }
    ]
  }
};

const DEFAULT_TOUR_SLUG = 'efes-sirince';

function resolveTour(slug) {
  const anahtar = String(slug || '').trim().toLowerCase();
  if (anahtar && Object.prototype.hasOwnProperty.call(TOURS, anahtar)) return TOURS[anahtar];
  return TOURS[DEFAULT_TOUR_SLUG] || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TOUR_IMAGE_FILES,
    TOUR_ICONS,
    TOURS,
    DEFAULT_TOUR_SLUG,
    AYLAR_TR,
    GUNLER_TR,
    GUNLER_TR_KISA,
    commonsImageUrl,
    commonsFileUrl,
    tourImage,
    tourSvg,
    formatNumberTR,
    formatTRY,
    asDate,
    toISODate,
    formatTrDate,
    trDateParts,
    nextDepartureDates,
    seatsLeft,
    clampParty,
    calcTotal,
    discountPercent,
    refundTier,
    refundAmount,
    ratingSummary,
    filterReviews,
    reviewerInitials,
    tourSlugFromQuery,
    resolveTour
  };
}
