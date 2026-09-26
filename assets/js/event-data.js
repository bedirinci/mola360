/* ---------------- etkinlik içerik sayfası: veri ve saf yardımcılar ----------------
   /etkinlik/<slug>/ sayfasının bütün içeriği burada durur; event-page.js
   yalnızca bu veriyi işaretlemeye çevirir. Sayfada görünen hiçbir metin
   event-page.js'in içine yazılmaz — kural tur, otel ve aktivite
   sayfalarıyla aynı.

   Biçimlendirme, tarih, iade ve puan hesapları TEKRAR YAZILMIYOR:
   tour-data.js'te duruyorlar. Tarayıcıda o dosya önce yükleniyor,
   Node/vitest tarafında require ile geliyor.

   ETKİNLİĞİ DİĞER ÜÇ TÜRDEN AYIRAN ŞEY: sabit tarihleri var. Tur haftanın
   belirli günleri kalkıyor, otel her gün açık, aktivite her sabah
   yapılıyor — ama bir festivalin temsilleri sayılıdır ve biter. Bu yüzden
   burada "yaklaşan temsil" kavramı var ve sezon tamamlandığında etkinlik
   anasayfada GÖRÜNMEZ (catalog.js kartı üretmez). Geçmiş bir tarihi
   "yaklaşan" diye göstermek, elle yazılmış kartların düştüğü tuzağın ta
   kendisiydi. */

const ETKINLIK_TUR_VERI = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./tour-data.js')
  : null;

const eAsDate     = ETKINLIK_TUR_VERI ? ETKINLIK_TUR_VERI.asDate : asDate;
const eCommonsUrl = ETKINLIK_TUR_VERI ? ETKINLIK_TUR_VERI.commonsImageUrl : commonsImageUrl;

/* ---------------- görseller ----------------
   Yöntem diğer içerik sayfalarıyla aynı (docs/gorsel-kaynaklari.md).
   cardImages ile ORTAK olan anahtarda dosya adı birebir aynı. */
const EVENT_IMAGE_FILES = {
  aspendos:      { dosya: 'Aspendos Turkey.JPG',              ad: 'Aspendos Antik Tiyatro' },
  aspendosSahne: { dosya: 'Aspendos theatre stage.jpg',       ad: 'Sahne ve skene duvarı' },
  aspendosGece:  { dosya: 'Aspendos theatre at night.jpg',    ad: 'Gece ışıklandırması' },
  opera:         { dosya: 'Opera performance on stage.jpg',   ad: 'Opera temsili' },
  bale:          { dosya: 'Ballet performance on stage.jpg',  ad: 'Bale temsili' },
  orkestra:      { dosya: 'Symphony orchestra in concert.jpg', ad: 'Orkestra' },
  kaleici:       { dosya: 'Kaleici Antalya.jpg',              ad: 'Antalya Kaleiçi' }
};

function eventImage(key, width) {
  const kayit = EVENT_IMAGE_FILES[key];
  return kayit ? eCommonsUrl(kayit.dosya, width) : '';
}

/* ---------------- temsiller ----------------
   Etkinliğin tarihleri veride sayılı duruyor. "Yaklaşan" olanı ayıran
   fonksiyon saf: sayfa da, anasayfa kartı da, test de aynı kuralı
   okuyor.

   Bugünün temsili HÂLÂ yaklaşan sayılıyor (akşam 20:30'da başlıyor,
   sabah bakan biri için hâlâ bugün). Dün ve öncesi düşüyor. */
function upcomingPerformances(event, bugun) {
  const liste = (event && event.performances) || [];
  const bas = eAsDate(bugun) || new Date();
  const esik = eAsDate(bas).getTime();
  return liste
    .filter(t => {
      const d = eAsDate(t.date);
      return d && d.getTime() >= esik;
    })
    .sort((a, b) => eAsDate(a.date).getTime() - eAsDate(b.date).getTime());
}

function nextPerformance(event, bugun) {
  return upcomingPerformances(event, bugun)[0] || null;
}

/* Sezon bitti mi? Bitti ise sayfa rezervasyon yerine "program
   tamamlandı" diyor ve anasayfa kartı hiç üretilmiyor. */
function seasonOver(event, bugun) {
  return upcomingPerformances(event, bugun).length === 0;
}

/* Tanınmayan tarih ilk YAKLAŞAN temsile düşer: sayfa geçmiş bir temsili
   seçili göstermez. Hiç yaklaşan temsil yoksa null döner. */
function eventPerformance(event, tarih, bugun) {
  const liste = upcomingPerformances(event, bugun);
  if (!liste.length) return null;
  const iso = String(tarih || '');
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].date === iso) return liste[i];
  }
  return liste[0];
}

function eventCategory(event, katId) {
  const liste = (event && event.categories) || [];
  if (!liste.length) return null;
  const id = String(katId || '');
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) return liste[i];
  }
  return liste[0];
}

/* ---------------- bilet sayısı sınırları ----------------
   Tek yerde: hem sayaç butonları hem tutar bu fonksiyondan geçiyor.

   İki kural var:
     - tek rezervasyonda en fazla maxTickets bilet (karaborsa önlemi),
     - öğrenci bileti YALNIZCA kategori izin veriyorsa satılıyor;
       locada öğrenci tarifesi yok, o yüzden orada sayaç sıfırlanıyor. */
function clampTickets(event, secim) {
  const p = (event && event.pricing) || {};
  const sec = secim || {};
  const kategori = eventCategory(event, sec.category);
  const enFazla = Math.max(1, Math.round(Number(p.maxTickets) || 6));
  const ogrenciVar = !!(kategori && Number(kategori.student) > 0);

  let tam = Math.max(1, Math.floor(Number(sec.full) || 1));
  tam = Math.min(tam, enFazla);

  let ogrenci = ogrenciVar ? Math.max(0, Math.floor(Number(sec.student) || 0)) : 0;
  ogrenci = Math.min(ogrenci, enFazla - tam);

  return {
    full: tam,
    student: ogrenci,
    tickets: tam + ogrenci,
    category: kategori,
    studentAllowed: ogrenciVar,
    maxTickets: enFazla
  };
}

/* ---------------- ek hizmetler ----------------
   booking  bir kez (program kitapçığı, otopark)
   ticket   bilet başına (ara ikramı)
   Otelin "gece", aktivitenin "kişi" çarpanının karşılığı bilet. */
function eventAddonLines(event, secim, bilet) {
  const secili = (secim && Array.isArray(secim.addons)) ? secim.addons : [];
  const sayim = bilet || clampTickets(event, secim);
  return ((event && event.addons) || [])
    .filter(a => secili.indexOf(a.id) !== -1)
    .map(a => {
      const birim = Number(a.price) || 0;
      const carpan = a.per === 'ticket' ? sayim.tickets : 1;
      return {
        id: a.id,
        label: a.label + (a.per === 'ticket' ? ' × ' + sayim.tickets + ' bilet' : ''),
        amount: birim * carpan,
        kind: 'addon'
      };
    });
}

/* ---------------- tutar ----------------
   Kurallar ve her birinin ayrı testi var:

   tam bilet    seçilen kategorinin fiyatı
   öğrenci      kategorinin öğrenci tarifesi (yoksa satılmıyor)
   hizmet bedeli BİLET BAŞINA, ayrı satır
   ek hizmet    bir kez ya da bilet başına

   Hizmet bedeli neden ayrı satır: biletlemede fatura üzerinde ayrı
   gösteriliyor ve fiyatın içine gizlenirse "ilan edilen fiyat" ile
   ödenen tutar ayrışıyor. Otelin konaklama vergisiyle aynı gerekçe,
   aktivitede ise böyle bir kalem yok — üç sayfanın farkı bilinçli. */
function calcEventTotal(event, secim) {
  const p = (event && event.pricing) || {};
  const bilet = clampTickets(event, secim);
  const kategori = bilet.category || {};

  const tamBirim = Number(kategori.price) || 0;
  const ogrenciBirim = Number(kategori.student) || 0;
  const tamToplam = bilet.full * tamBirim;
  const ogrenciToplam = bilet.student * ogrenciBirim;

  const hizmetBirim = Math.max(0, Number(p.servicePerTicket) || 0);
  const hizmetToplam = hizmetBirim * bilet.tickets;

  const araToplam = tamToplam + ogrenciToplam;
  const listeToplam = bilet.full * (Number(kategori.priceList) || tamBirim)
    + bilet.student * (Number(kategori.studentList) || ogrenciBirim);

  const ekler = eventAddonLines(event, secim, bilet);
  const eklerToplam = ekler.reduce((toplam, a) => toplam + a.amount, 0);

  const satirlar = [];
  satirlar.push({
    label: kategori.name + ' · tam × ' + bilet.full,
    amount: tamToplam,
    kind: 'base'
  });
  if (bilet.student) {
    satirlar.push({
      label: 'Öğrenci × ' + bilet.student,
      amount: ogrenciToplam,
      kind: 'base'
    });
  }
  ekler.forEach(a => satirlar.push(a));
  if (hizmetToplam) {
    satirlar.push({
      label: 'Hizmet bedeli × ' + bilet.tickets + ' bilet',
      amount: hizmetToplam,
      kind: 'fee'
    });
  }

  return {
    full: bilet.full,
    student: bilet.student,
    tickets: bilet.tickets,
    category: bilet.category,
    studentAllowed: bilet.studentAllowed,
    fullTotal: tamToplam,
    studentTotal: ogrenciToplam,
    serviceTotal: hizmetToplam,
    subtotal: araToplam,
    listSubtotal: listeToplam,
    saving: Math.max(0, listeToplam - araToplam),
    addons: ekler,
    addonsTotal: eklerToplam,
    lines: satirlar,
    total: araToplam + eklerToplam + hizmetToplam
  };
}

/* Kartlarda ve rezervasyon kartının tepesinde görünen "…TL'den başlayan"
   fiyat: en ucuz kategorinin tam bilet ücreti. Anasayfadaki etkinlik
   kartının fiyatı da bu olmak zorunda. */
function eventPriceFrom(event) {
  const liste = (event && event.categories) || [];
  if (!liste.length) return 0;
  return liste.reduce((enAz, k) => Math.min(enAz, Number(k.price) || 0),
    Number(liste[0].price) || 0);
}

function eventListPriceFrom(event) {
  const liste = (event && event.categories) || [];
  if (!liste.length) return 0;
  const ucuz = liste.reduce((secili, k) =>
    (Number(k.price) || 0) < (Number(secili.price) || 0) ? k : secili, liste[0]);
  return Number(ucuz.priceList) || Number(ucuz.price) || 0;
}

/* Kalan koltuk burada hesaplanmıyor: veri kapısının kontenjan
   cevabından (MolaVeri.musaitlik; birim temsil × bilet kategorisi). */

/* /mola360/etkinlik/aspendos-opera-bale-festivali/ -> slug */
function eventSlugFromPath(pathname) {
  const m = String(pathname || '').match(/\/etkinlik\/([^/?#]+)/);
  if (!m) return '';
  const parca = m[1];
  if (/\.html?$/i.test(parca)) return '';
  try {
    return decodeURIComponent(parca).trim().toLowerCase();
  } catch (_) {
    return '';
  }
}

/* ---------------- etkinlikler ----------------
   NOT: buradaki etkinlik kurgusaldır (gerçek envanter bağlanana kadar
   örnek içerik). Bu yüzden sayfada Event/Offer/AggregateRating yapısal
   verisi YOK — gerekçesi docs/etkinlik-sayfasi.md ve
   docs/seo-arastirma.md (madde 2) içinde. */
const EVENTS = {
  'aspendos-opera-bale-festivali': {
    slug: 'aspendos-opera-bale-festivali',
    type: 'event',
    title: 'Aspendos Opera ve Bale Festivali',
    tagline: 'İki bin yıllık Roma tiyatrosunda açık hava opera ve bale gecesi',
    category: 'Sahne Sanatları',
    categoryShort: 'Sahne',
    categoryPlural: 'Etkinlikler',
    categoryAnchor: 'etkinlikler',
    area: 'Serik, Antalya',
    region: 'Akdeniz',
    code: 'MLA-ETK-01',

    /* Sınıflandırma, para birimi ve arama motoru bilgisi:
       docs/veri-sozlesmesi.md bölüm 4. Opera ve bale menüdeki etkinlik
       türlerine sığmadığı için "Sahne Sanatları" kategorisi açıldı
       (menüde yok, onaya sunulu); festival olduğu için Festivaller'de de. */
    taxonomy: {
      categories: ['sahne-sanatlari', 'festivaller'],
      themes: ['kultur-tarih'],
      collections: ['romantik'],
      city: 'antalya',
      facets: {}
    },
    currency: 'TRY',
    seo: {
      title: 'Aspendos Opera ve Bale Festivali — Antik Tiyatro | mola360',
      description: 'Aspendos Antik Tiyatro\'da açık hava opera ve bale gecesi: numaralı koltuk, dört bilet bloğu, {fiyat}\'den başlayan fiyatlar. Yağmurda yeni tarihe ücretsiz aktarım.',
      ogTitle: 'Aspendos Opera ve Bale Festivali',
      ogDescription: 'İki bin yıllık Roma tiyatrosunda açık hava opera ve bale gecesi. Numaralı koltuk, {fiyat}\'den başlayan biletler.'
    },
    venueName: 'Aspendos Antik Tiyatro',
    durationLabel: '≈ 2 saat 30 dk · bir ara',
    doorsLabel: 'Kapılar 19:00’da açılır',

    /* Anasayfa kartı: bu kayıt catalog.js tarafından "Popüler
       Etkinlikler" ve "Yaklaşan Planlar" şeritlerine kendiliğinden
       giriyor. Fiyat, puan, yorum sayısı ve TARİH kayıttan türetiliyor;
       tarih temsil takviminden geliyor, elle yazılmıyor. */
    card: {
      img: 'aspendos',
      title: 'Aspendos Opera ve Bale Festivali',
      badges: ['Sahne'],
      meta1: 'Aspendos Antik Tiyatro, Antalya · 20:30'
    },

    badges: [
      { icon: 'bolt',    label: 'Anında e-bilet' },
      { icon: 'calendar', label: 'Numaralı koltuk' },
      { icon: 'refresh', label: 'Yağmurda yeni tarihe aktarım' },
      { icon: 'shield',  label: 'Güvenli ödeme' }
    ],

    facts: [
      { icon: 'clock',    label: 'Başlangıç', value: '20:30',              note: 'Kapılar 19:00’da açılır' },
      { icon: 'calendar', label: 'Süre',      value: '≈ 2 sa 30 dk',       note: '20 dakika ara' },
      { icon: 'mapPin',   label: 'Mekân',     value: 'Aspendos Antik Tiyatro', note: 'Serik, Antalya’ya 47 km' },
      { icon: 'users',    label: 'Kapasite',  value: '7.000 kişi',         note: 'Numaralı ve minderli oturma' },
      { icon: 'info',     label: 'Yaş',       value: '6 yaş ve üzeri',     note: '0 – 5 yaş kabul edilmiyor' },
      { icon: 'bus',      label: 'Ulaşım',    value: 'Otopark ücretli',    note: 'Antalya merkezden 50 dk' }
    ],

    gallery: [
      { key: 'aspendos',      caption: 'Aspendos Antik Tiyatro, gün batımında' },
      { key: 'aspendosSahne', caption: 'Sahne ve skene duvarı' },
      { key: 'opera',         caption: 'Festivalden bir opera temsili' },
      { key: 'bale',          caption: 'Bale gecesi' },
      { key: 'orkestra',      caption: 'Orkestra çukuru' },
      { key: 'aspendosGece',  caption: 'Gece ışıklandırması' },
      { key: 'kaleici',       caption: 'Antalya Kaleiçi — gösteri sonrası' }
    ],

    highlights: [
      'MS 155 yılında yapılmış, dünyanın en iyi korunmuş Roma tiyatrosunda temsil',
      'Akustik öyle ki sahnenin ortasındaki fısıltı en üst sıradan duyulur — hoparlör gerekmez',
      'Her temsil için numaralı koltuk; blok seçimi rezervasyonda yapılır',
      'Devlet Opera ve Balesi’nin orkestra ve dans topluluğu',
      'Kapılar 19:00’da açılıyor; gün batımını tiyatronun üst sıralarından izleyebilirsiniz',
      'Yağmur nedeniyle iptal edilen temsil yeni tarihe ücretsiz aktarılır'
    ],

    description: [
      'Aspendos Antik Tiyatrosu MS 155 yılında Roma İmparatoru Marcus Aurelius döneminde yapıldı ve bugün dünyada en iyi korunmuş Roma tiyatrosu sayılıyor. Sahne binası, oturma basamakları ve galerisiyle neredeyse eksiksiz ayakta; bu yüzden burada verilen temsiller bir yeniden canlandırma değil, yapının kendi işini yapmaya devam etmesi. Festival her sonbahar bir ay boyunca opera, bale ve senfoni programlarıyla sürüyor.',
      'Akustik tiyatronun asıl sürprizi. Taş basamaklar sesi yukarı taşıyor ve sahnenin ortasında konuşan birinin sesi en üst sıradan duyuluyor; elektronik ses sistemi kullanılmıyor. Oturma yerleri orijinal taş basamaklar olduğu için festival minder veriyor, ama sırt dayanağı yok — bu, iki buçuk saat boyunca hatırlanacak bir ayrıntı.',
      'Temsil 20:30’da başlıyor, kapılar 19:00’da açılıyor. Erken gelmek iki işe yarıyor: gün batımını üst sıralardan izlemek ve otoparktan tiyatroya olan yokuşu acele etmeden çıkmak. Ara 20 dakika; tiyatronun girişinde ikram alanı var. Gösteri sonrası Antalya merkeze dönüş yaklaşık 50 dakika.'
    ],

    /* Temsil takvimi. Kartta ve sayfada görünen tarih BURADAN geliyor;
       elle yazılmış bir "26 Eylül, Cumartesi" metni yok. Sezon
       tamamlandığında etkinlik anasayfada görünmüyor. */
    performances: [
      { date: '2026-09-26', time: '20:30', title: 'Carmen', kind: 'Opera',
        detail: 'Bizet · Devlet Opera ve Balesi Orkestrası, üç perde' },
      { date: '2026-10-03', time: '20:30', title: 'Kuğu Gölü', kind: 'Bale',
        detail: 'Çaykovski · dört perde, 20 dakika ara' },
      { date: '2026-10-10', time: '20:30', title: 'Aida', kind: 'Opera',
        detail: 'Verdi · koro ve orkestra, dört perde' },
      { date: '2026-10-17', time: '20:30', title: 'Senfonik Gala', kind: 'Konser',
        detail: 'Beethoven 9. Senfoni · koro eşliğinde' },
      { date: '2026-10-24', time: '20:30', title: 'Romeo ve Juliet', kind: 'Bale',
        detail: 'Prokofyev · üç perde' },
      { date: '2026-10-31', time: '20:00', title: 'Kapanış Gecesi', kind: 'Gala',
        detail: 'Festival topluluklarından seçmeler; erken başlangıç' }
    ],

    /* Bilet kategorileri: blok, fiyat ve öğrenci tarifesi. student
       değeri yoksa o kategoride öğrenci bileti SATILMIYOR. */
    categories: [
      {
        id: 'loca', name: 'Loca', key: 'aspendosSahne', block: 'Sahne karşısı, orta aks',
        price: 1450, priceList: 1750, student: 0, seats: 120,
        note: 'İki kişilik locada kişi başı; sırt dayanaklı koltuk ve ayrı giriş.',
        features: ['Sırt dayanaklı koltuk', 'Ayrı giriş', 'Ara ikramı dahil', 'Minder gerekmez']
      },
      {
        id: 'orkestra', name: 'Orkestra Blok (A)', key: 'orkestra', block: 'İlk 12 sıra',
        price: 980, priceList: 1150, student: 620, seats: 900,
        note: 'Sahneye en yakın blok; orkestra çukuru görüş alanında.',
        features: ['Sahneye en yakın', 'Numaralı taş basamak', 'Minder dahil']
      },
      {
        id: 'orta', name: 'Orta Kademe (B)', key: 'aspendos', block: '13 – 26. sıra',
        price: 750, priceList: 890, student: 480, seats: 2200,
        note: 'Akustiğin en dengeli olduğu blok; sahnenin tamamı görülür.',
        features: ['Dengeli akustik', 'Sahnenin tamamı görünür', 'Minder dahil']
      },
      {
        id: 'ust', name: 'Üst Kademe (C)', key: 'aspendosGece', block: '27. sıra ve üzeri',
        price: 420, priceList: 520, student: 260, seats: 3500,
        note: 'En uygun fiyatlı blok; gün batımı manzarası buradan görülür.',
        features: ['Gün batımı manzarası', 'Galeri gölgesi', 'Minder dahil']
      }
    ],

    venue: {
      title: 'Aspendos Antik Tiyatro',
      address: 'Belkıs Mahallesi, Aspendos Yolu, Serik / Antalya',
      note: 'Otoparktan tiyatro girişine yaklaşık 300 metrelik eğimli bir yol var; rahat ayakkabı işe yarıyor. Giriş kapıları 19:00’da açılıyor ve temsil başladıktan sonra yerleştirme yalnızca arada yapılıyor.',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Aspendos%20Antik%20Tiyatro%20Serik%20Antalya',
      access: [
        { icon: 'bus',    text: 'Antalya merkezden araçla ≈ 50 dakika; D400 karayolu Serik çıkışı.' },
        { icon: 'wallet', text: 'Ziyaretçi otoparkı ücretli (250 TL); rezervasyon kartından önceden alınabiliyor.' },
        { icon: 'mapPin', text: 'Antalya Havalimanı 40 km; gösteri gecesi taksi dönüşü için önceden anlaşmak gerekiyor.' },
        { icon: 'clock',  text: 'Kapılar 19:00’da açılıyor; 20:15’ten sonra gelenler arada yerleştiriliyor.' }
      ]
    },

    /* Mekân kuralları: cevabı "hayır" olanlar da yazılı. */
    rules: [
      { icon: 'users',  title: 'Yaş sınırı',
        text: '6 yaş ve üzeri katılabilir; 0 – 5 yaş için bilet satılmıyor ve kucakta giriş yapılamıyor. Her çocuğun ayrı bileti olmalı.' },
      { icon: 'camera', title: 'Fotoğraf ve kayıt',
        text: 'Temsil sırasında flaşlı fotoğraf ve video kaydı yasak; ara ve gösteri öncesi serbest. Profesyonel ekipman ve tripod için önceden izin gerekiyor.' },
      { icon: 'clock',  title: 'Geç kalma',
        text: 'Temsil 20:30’da başlıyor ve kapılar kapanıyor. Geç gelen misafirler ilk aranın sonuna kadar bekliyor, sonra kendi koltuklarına yerleştiriliyor.' },
      { icon: 'food',   title: 'Yiyecek ve içecek',
        text: 'Dışarıdan yiyecek ve içecek girişi yok; su serbest. Tiyatro girişindeki ikram alanı 19:00 – 20:20 arası ve arada açık.' },
      { icon: 'sun',    title: 'Oturma ve hava',
        text: 'Oturma yerleri orijinal taş basamaklar; minder festival tarafından veriliyor ama sırt dayanağı yok. Akşam serinliği için ince bir üst katman öneriliyor.' },
      { icon: 'shield', title: 'Güvenlik',
        text: 'Girişte çanta kontrolü var; cam şişe, lazer işaretçi ve drone kabul edilmiyor. Kayıp bilet yeniden basılmıyor, e-bileti telefonunuzda bulundurun.' }
    ],

    /* Yağmur, etkinliğin kendi "hava koşulu" kuralı: iptal DEĞİL,
       aktarım. Aktivitedeki koşulsuz iadeden bilerek farklı ve sebebi
       yazılı. */
    weather: {
      title: 'Yağmur yağarsa',
      text: 'Temsil açık havada yapılıyor. Hafif yağışta program aynen uygulanıyor; sağanak nedeniyle iptal edilen temsil festivalin ilan edeceği yeni tarihe ücretsiz aktarılıyor. Yeni tarihte gelemiyorsanız bilet bedelinin tamamı iade ediliyor. Karar temsil saatinde festival yönetimi tarafından veriliyor ve misafir iptali sayılmıyor.'
    },

    cancellation: {
      tiers: [
        { minHours: 72, rate: 1,   label: '72 saat ve öncesi', text: 'Bilet bedelinin tamamı iade edilir.' },
        { minHours: 24, rate: 0.5, label: '24 – 72 saat arası', text: 'Bilet bedelinin yarısı iade edilir.' },
        { minHours: 0,  rate: 0,   label: 'Son 24 saat',        text: 'İade yapılmaz; bilet devredilebilir, ad değişikliği için destek hattını arayın.' }
      ],
      note: 'Hizmet bedeli her durumda iade edilmez; iade oranları bilet bedeli üzerinden hesaplanır.',
      exampleTotal: 750
    },

    pricing: {
      unitNote: 'bilet başı',
      maxTickets: 6,
      /* Hizmet bedeli bilet başına ve ayrı satır: biletlemede fatura
         üzerinde de ayrı görünüyor. */
      servicePerTicket: 45,
      studentNote: 'Öğrenci bileti için geçerli öğrenci belgesi girişte istenir',
      startTime: '20:30',
      doorsTime: '19:00'
    },

    addons: [
      { id: 'otopark',  per: 'booking', price: 250, label: 'Ziyaretçi otoparkı',
        text: 'Tiyatro otoparkında ayrılmış yer, gösteri gecesi geçerli' },
      { id: 'program',  per: 'booking', price: 120, label: 'Program kitapçığı',
        text: 'Eser, kadro ve libretto özeti; girişte teslim' },
      { id: 'ikram',    per: 'ticket',  price: 220, label: 'Arada ikram paketi',
        text: 'Sıcak içecek ve kuru pasta; ara kuyruğu beklemeden' }
    ],

    trust: [
      { icon: 'bolt',    text: 'Anında e-bilet — telefonunuza hemen düşer' },
      { icon: 'refresh', text: 'Yağmurda yeni tarihe ücretsiz aktarım' },
      { icon: 'shield',  text: 'Güvenli ödeme, 3D Secure' }
    ],

    social: { viewedLast24h: 63, bookedThisWeek: 31 },

    /* Dağılım anasayfada uzun süredir yazan 4,9 puanı veriyor
       (ortalama 4,85 → 4,9) ve toplam 187 yorum "180+" olarak
       kısalıyor; kartta elle yazılı olan iki değer de artık buradan
       türetiliyor. */
    ratingBreakdown: { 5: 168, 4: 14, 3: 3, 2: 1, 1: 1 },

    ratingAspects: [
      { label: 'Mekân',              value: 4.9 },
      { label: 'Akustik',            value: 4.9 },
      { label: 'Sahne performansı',  value: 4.8 },
      { label: 'Oturma rahatlığı',   value: 4.0 }
    ],

    reviews: [
      { name: 'Nihal Erdem', date: '2026-09-15', rating: 5, party: 'Çift olarak',
        title: 'Akustik anlatılanın ötesinde',
        text: 'Hoparlör yok ve C blokta, en üst sıralardaydık; şarkıcının nefesini duyduk. Carmen’i burada izlemek konser salonundan bambaşka bir şey. Gün batımını da üst sıradan gördük, 19:00’da girmek iyi fikirdi.' },
      { name: 'Volkan Tümer', date: '2026-09-09', rating: 5, party: 'Ailece',
        title: 'Çocuklar için loca doğru karar',
        text: '9 ve 13 yaşında iki çocukla gittik. Locada sırt dayanağı olması iki buçuk saat için fark yarattı, taş basamakta zor olurdu. Ara ikramı locaya dahil, kuyrukta beklemedik. Yalnız 6 yaş altı alınmıyor, bunu bilerek gidin.' },
      { name: 'Deniz Aksu', date: '2026-08-30', rating: 4, party: 'Arkadaş grubu',
        title: 'Muhteşem gece, minder yetmiyor',
        text: 'B blok gerçekten dengeli; sahnenin tamamı görünüyor ve ses tam ortada toplanıyor. Ama taş basamak taş basamak, verilen minder ince. Bir dahakine ekstra bir şey götürürüm. Ara 20 dakika, ikram alanı çok kalabalıktı.' },
      { name: 'Sevgi Balcı', date: '2026-08-21', rating: 5, party: 'Tek başına',
        title: 'Tek başına gitmek de gayet keyifli',
        text: 'Öğrenci bileti aldım, C blok 260 TL. Kapıda öğrenci belgesi sordular, hazırdı. Yalnız gitmek hiç sorun olmadı; herkes sahneye bakıyor. Dönüşte taksi bulmak zor oldu, önceden anlaşın.' },
      { name: 'Kerem Tunç', date: '2026-08-12', rating: 5, party: 'Çift olarak',
        title: 'Yağmur aktarımı sorunsuz işledi',
        text: 'İlk aldığımız temsil sağanak nedeniyle iptal oldu. Aynı hafta yeni tarih ilan edildi, biletler otomatik aktarıldı, fark istenmedi. İkinci denemede hava mükemmeldi. İletişim iyi, mesajla haber verdiler.' },
      { name: 'Aslı Yurdakul', date: '2026-07-28', rating: 5, party: 'Ailece',
        title: 'Kuğu Gölü’nü burada izlemek',
        text: 'Bale için A blok aldık, dansçıların ayak sesleri duyuluyor — bu bile atmosferin parçası. Sahne ışığı taş duvara vurunca dekor gerekmiyor. Otoparkı önceden aldık, yokuşu acele etmeden çıktık.' },
      { name: 'Mert Sancak', date: '2026-07-19', rating: 3, party: 'Arkadaş grubu',
        title: 'Geç kalınca arayı beklemek zorunda kaldık',
        text: 'Trafikte kaldık, 20:40’ta vardık ve kapılar kapalıydı. Kural yazılıymış, okumamışız; ilk aranın sonuna kadar dışarıda bekledik. Sonrasında gösteri harikaydı ama ilk perdeyi kaçırdık. Erken çıkın.' },
      { name: 'Gülşah Ok', date: '2026-07-06', rating: 5, party: 'Çift olarak',
        title: 'İki bin yıllık taşın üstünde Beethoven',
        text: 'Senfonik gala gecesine gittik. Koro tiyatronun üst galerisine yerleşti, ses her yerden geldi. Böyle bir şeyi kapalı salonda yaşamak mümkün değil. Antalya’ya sırf bunun için gelmeye değer.' }
    ],

    faq: [
      { q: 'Biletler numaralı mı?',
        a: 'Evet. Her bilet bir blok ve koltuk numarası taşır; blok seçimi rezervasyon sırasında yapılır, koltuk numarası e-biletinizde yazar. Loca dışındaki bloklarda oturma yeri orijinal taş basamaklardır ve minder festival tarafından verilir.' },
      { q: 'Yağmur yağarsa ne oluyor?',
        a: 'Hafif yağışta program aynen uygulanır. Sağanak nedeniyle iptal edilen temsil, festivalin ilan edeceği yeni tarihe ücretsiz aktarılır; yeni tarihte gelemiyorsanız bilet bedelinin tamamı iade edilir. Bu karar temsil saatinde festival yönetimi tarafından verilir ve misafir iptali sayılmaz.' },
      { q: 'Öğrenci bileti nasıl alınır?',
        a: 'Orkestra, orta ve üst kademe bloklarında öğrenci tarifesi vardır; rezervasyon kartında öğrenci sayacını kullanmanız yeterli. Locada öğrenci tarifesi yoktur. Girişte geçerli öğrenci belgesi istenir; belgesi olmayan misafir aradaki farkı öder.' },
      { q: 'Çocuklar gelebilir mi?',
        a: '6 yaş ve üzeri katılabilir ve her çocuğun ayrı bileti olmalıdır. 0 – 5 yaş için bilet satılmaz, kucakta giriş yapılamaz. İki buçuk saatlik bir program olduğu için sırt dayanaklı loca, küçük çocuklu aileler için daha rahat oluyor.' },
      { q: 'Tiyatroya nasıl gidilir, otopark var mı?',
        a: 'Antalya merkezden araçla yaklaşık 50 dakika; D400 üzerinden Serik çıkışı kullanılır. Ziyaretçi otoparkı ücretlidir (250 TL) ve rezervasyon kartından önceden alınabilir. Otoparktan tiyatro girişine 300 metrelik eğimli bir yol vardır.' },
      { q: 'Geç kalırsam içeri alınır mıyım?',
        a: 'Temsil 20:30’da başlar ve kapılar kapanır. Geç gelen misafirler ilk aranın sonuna kadar bekler, sonra kendi koltuklarına yerleştirilir. Bilet geçerliliğini yitirmez ama kaçırılan perde için iade yapılmaz.' }
    ],

    similar: [
      { key: 'opera',    title: 'İstanbul Opera Festivali',  meta: 'Harbiye, İstanbul · 20:00', rating: '4,8', price: 890, unit: 'bilet başı' },
      { key: 'orkestra', title: 'Efes Antik Tiyatro Konseri', meta: 'Selçuk, İzmir · 21:00',    rating: '4,7', price: 680, unit: 'bilet başı' },
      { key: 'bale',     title: 'Ankara Bale Gecesi',        meta: 'Opera Sahnesi · 20:00',    rating: '4,6', price: 520, unit: 'bilet başı' },
      { key: 'kaleici',  title: 'Kaleiçi Akşam Turu',        meta: 'Antalya · 2 saat',         rating: '4,5', price: 380, unit: 'kişi başı' }
    ],

    tags: [
      { label: 'Etkinlikler',        href: 'index.html#etkinlikler' },
      { label: 'Yaklaşan planlar',   href: 'index.html#yaklasan-planlar' },
      { label: 'Aktiviteler',        href: 'index.html#aktiviteler' },
      { label: 'Oteller',            href: 'index.html#oteller' },
      { label: 'Temsil takvimi',     href: '#program' },
      { label: 'Bilet kategorileri', href: '#biletler' },
      { label: 'Mekân ve ulaşım',    href: '#mekan' },
      { label: 'Mekân kuralları',    href: '#bilgiler' },
      { label: 'İzleyici yorumları', href: '#yorumlar' },
      { label: 'Kapadokya balon turu', href: 'aktivite/kapadokya-balon-turu/' }
    ]
  }
};

const DEFAULT_EVENT_SLUG = 'aspendos-opera-bale-festivali';


if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EVENT_IMAGE_FILES,
    EVENTS,
    DEFAULT_EVENT_SLUG,
    eventImage,
    upcomingPerformances,
    nextPerformance,
    seasonOver,
    eventPerformance,
    eventCategory,
    clampTickets,
    eventAddonLines,
    calcEventTotal,
    eventPriceFrom,
    eventListPriceFrom,
    eventSlugFromPath
  };
}
