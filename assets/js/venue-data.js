/* ---------------- mekân içerik sayfası: veri ve saf yardımcılar ----------------
   /mekan/<slug>/ sayfasının bütün içeriği burada durur; venue-page.js
   yalnızca bu veriyi işaretlemeye çevirir.

   KAYIT ADI NEDEN "PLACES": home-blocks.js zaten `const VENUES`
   tanımlıyor ve anasayfada iki dosya da yükleniyor. Klasik <script>
   etiketleri ÜST KAPSAMI PAYLAŞIR, yani aynı adı ikinci kez tanımlamak
   "Identifier 'VENUES' has already been declared" ile bütün sayfayı
   öldürürdü. Node tarafında modüller ayrı kapsamda olduğu için test bunu
   göremezdi; bu yüzden tests/katalog.test.js bütün anasayfa betiklerini
   node:vm ile TEK kapsamda çalıştırıp çakışma olmadığını doğruluyor.

   Mekânın diğer dört türden farkı: mekân bir YER, bir tarih değil.
   Satılan şey de mekâna göre değişiyor ve iki model var:

     masa     restoran, gece kulübü, beach club, kahvaltı salonu
              -> gün + saat + ALAN (şezlong/sedir/loca) + kişi
              -> kapora alınır, minimum harcamadan düşülür
     randevu  güzellik merkezi, masaj salonu
              -> gün + saat + HİZMET (süre/fiyat) + kişi
              -> ön ödeme yok, mekânda ödenir

   Kayıttaki `booking` alanı hangi modelin çalışacağını söylüyor; tek
   sayfa ikisine birden hizmet ediyor (tour-page.js'in daily/stay
   ayrımıyla aynı yaklaşım). */

const MEKAN_TUR_VERI = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./tour-data.js')
  : null;

const mAsDate     = MEKAN_TUR_VERI ? MEKAN_TUR_VERI.asDate : asDate;
const mCommonsUrl = MEKAN_TUR_VERI ? MEKAN_TUR_VERI.commonsImageUrl : commonsImageUrl;

/* ---------------- görseller ---------------- */
const VENUE_IMAGE_FILES = {
  cesmePlaj:    { dosya: 'Cesme beach Izmir.jpg',            ad: 'Çeşme sahili' },
  sezlong:      { dosya: 'Beach club sunbeds.jpg',           ad: 'Şezlong alanı' },
  beachBar:     { dosya: 'Beach bar at sunset.jpg',          ad: 'Sahil barı' },
  denizManzara: { dosya: 'Aegean sea view Turkey.jpg',       ad: 'Ege denizi manzarası' },
  alacati:      { dosya: 'Alaçatı değirmenler 01.jpg',       ad: 'Alaçatı değirmenleri' },
  masajOda:     { dosya: 'Massage room in spa.jpg',          ad: 'Masaj odası' },
  spaKarsilama: { dosya: 'Spa reception area.jpg',           ad: 'Karşılama alanı' },
  sicakTas:     { dosya: 'Hot stone massage.jpg',            ad: 'Sıcak taş masajı' },
  aromaYag:     { dosya: 'Aromatherapy massage oils.jpg',    ad: 'Aromaterapi yağları' },
  kordonBoyu:   { dosya: 'Izmir Alsancak Kordon 6339.jpg',   ad: 'Alsancak Kordon boyu' },
  kemeralti:    { dosya: 'Kemeraltı market 02.jpg',          ad: 'Kemeraltı Çarşısı' }
};

function venueImage(key, width) {
  const kayit = VENUE_IMAGE_FILES[key];
  return kayit ? mCommonsUrl(kayit.dosya, width) : '';
}

/* ---------------- çalışma saatleri ----------------
   Mekânın en çok sorulan bilgisi "şu an açık mı". Kayıt gün gün saat
   tutuyor (0 = pazar) ve kapanış saati açılıştan KÜÇÜK olabiliyor:
   gece kulübü 22:00'de açılıp 04:00'te kapanıyor.

   Gece yarısını aşan vardiya bu fonksiyonun asıl işi: saat 01:30'da
   mekân açıktır ama o saat BUGÜNÜN değil DÜNÜN vardiyasına aittir.
   Dünün kaydına bakılmazsa gece gelen ziyaretçi "kapalı" görür. */
function venueHoursFor(place, weekday) {
  const liste = (place && place.hours) || [];
  const gun = ((Math.round(Number(weekday) || 0) % 7) + 7) % 7;
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].day === gun) return liste[i];
  }
  return null;
}

/* "22:00" -> 1320 (dakika). Geçersiz değer null döner. */
function saatDakika(metin) {
  const m = String(metin || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function venueOpenNow(place, when) {
  const simdi = (when instanceof Date) ? when : new Date(when || Date.now());
  if (isNaN(simdi.getTime())) return { open: false, text: '' };
  const dakika = simdi.getHours() * 60 + simdi.getMinutes();

  /* Önce bugünün vardiyası, sonra dünden sarkan vardiya. */
  const bugun = venueHoursFor(place, simdi.getDay());
  if (bugun && !bugun.closed) {
    const acilis = saatDakika(bugun.open);
    const kapanis = saatDakika(bugun.close);
    if (acilis !== null && kapanis !== null) {
      const geceyiAsan = kapanis <= acilis;
      if (dakika >= acilis && (geceyiAsan || dakika < kapanis)) {
        return { open: true, text: bugun.close + '’de kapanıyor', close: bugun.close };
      }
    }
  }

  const dun = venueHoursFor(place, (simdi.getDay() + 6) % 7);
  if (dun && !dun.closed) {
    const acilis = saatDakika(dun.open);
    const kapanis = saatDakika(dun.close);
    if (acilis !== null && kapanis !== null && kapanis <= acilis && dakika < kapanis) {
      return { open: true, text: dun.close + '’de kapanıyor', close: dun.close };
    }
  }

  /* Kapalı: bir sonraki açılış gününü söylemek "kapalı" demekten iyi. */
  for (let i = 0; i < 7; i++) {
    const kayit = venueHoursFor(place, (simdi.getDay() + i) % 7);
    if (!kayit || kayit.closed) continue;
    if (i === 0 && saatDakika(kayit.open) !== null && dakika < saatDakika(kayit.open)) {
      return { open: false, text: 'Bugün ' + kayit.open + '’de açılıyor', open_at: kayit.open };
    }
    if (i > 0) {
      return { open: false, text: kayit.label + ' ' + kayit.open + '’de açılıyor', open_at: kayit.open };
    }
  }
  return { open: false, text: 'Şu an kapalı' };
}

/* ---------------- alan / hizmet ----------------
   İki rezervasyon modeli iki ayrı listeden besleniyor; hangisinin
   geçerli olduğunu kaydın `booking` alanı söylüyor. Çağıran taraf
   modeli bilmek zorunda kalmasın diye tek giriş noktası var. */
function venueOptions(place) {
  if (!place) return [];
  return place.booking === 'randevu' ? (place.services || []) : (place.areas || []);
}

function venueOption(place, id) {
  const liste = venueOptions(place);
  if (!liste.length) return null;
  const anahtar = String(id || '');
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === anahtar) return liste[i];
  }
  return liste[0];
}

/* Rezervasyon saatleri kayıttan; hafta sonu için ayrı liste
   tanımlanabiliyor (beach club sabah erken açılıyor, kulüp geç). */
function venueSlots(place, iso) {
  const p = (place && place.pricing) || {};
  const d = mAsDate(iso);
  const haftaSonu = d ? (d.getDay() === 0 || d.getDay() === 6) : false;
  const liste = (haftaSonu && p.weekendSlots) ? p.weekendSlots : (p.slots || []);
  return liste.slice();
}

function venueSlot(place, iso, saat) {
  const liste = venueSlots(place, iso);
  if (!liste.length) return '';
  return liste.indexOf(String(saat || '')) !== -1 ? String(saat) : liste[0];
}

/* ---------------- kişi sayısı sınırları ----------------
   Tek yerde: hem sayaç butonları hem tutar buradan geçiyor.

   Üç kural var:
     - alan/hizmetin kendi kapasitesi (loca 8 kişi, şezlong 2 kişi),
     - mekânın genel sınırı,
     - SABİT KİŞİ SAYISI: çift masajı tanımı gereği iki kişilik, sayaç
       orada 2'de kilitleniyor. */
function clampVenueParty(place, secim) {
  const p = (place && place.pricing) || {};
  const sec = secim || {};
  const secenek = venueOption(place, sec.option);

  const sabit = Number(secenek && secenek.requiredGuests) || 0;
  const kapasite = Math.max(1, Math.round(Number(secenek && secenek.capacity) || 1));
  const enFazla = Math.min(kapasite, Math.max(1, Math.round(Number(p.maxGuests) || 10)));

  let kisi = sabit || Math.max(1, Math.floor(Number(sec.guests) || 1));
  kisi = Math.min(kisi, enFazla);

  return {
    guests: kisi,
    option: secenek,
    fixedGuests: sabit > 0,
    maxGuests: enFazla
  };
}

/* ---------------- ek hizmetler ----------------
   booking  bir kez · guest  kişi başına */
function venueAddonLines(place, secim, katilim) {
  const secili = (secim && Array.isArray(secim.addons)) ? secim.addons : [];
  const kisi = katilim || clampVenueParty(place, secim);
  return ((place && place.addons) || [])
    .filter(a => secili.indexOf(a.id) !== -1)
    .map(a => {
      const birim = Number(a.price) || 0;
      const carpan = a.per === 'guest' ? kisi.guests : 1;
      return {
        id: a.id,
        label: a.label + (a.per === 'guest' ? ' × ' + kisi.guests + ' kişi' : ''),
        amount: birim * carpan,
        kind: 'addon'
      };
    });
}

/* ---------------- tutar ----------------
   İki model, iki ayrı "ödenecek tutar" tanımı — ve fark bilinçli:

   masa     ŞİMDİ ödenen KAPORA (+ varsa giriş ücreti + ek hizmet).
            Minimum harcama tutara EKLENMEZ: o, masada beklenen harcama
            ve kapora ondan düşülüyor. Toplama eklenseydi misafir
            bugün ödemeyeceği bir rakamı ödeyecekmiş gibi görürdü.

   randevu  mekânda ödenecek hizmet bedeli. Ön ödeme yok; kartın
            altındaki not bunu yazıyor, aksi hâlde "Toplam" satırı
            şimdi çekilecek para sanılıyor. */
function calcVenueBooking(place, secim) {
  const p = (place && place.pricing) || {};
  const katilim = clampVenueParty(place, secim);
  const secenek = katilim.option || {};
  const randevu = place && place.booking === 'randevu';

  const ekler = venueAddonLines(place, secim, katilim);
  const eklerToplam = ekler.reduce((toplam, a) => toplam + a.amount, 0);

  const satirlar = [];
  let hizmetToplam = 0;
  let kapora = 0;
  let girisToplam = 0;
  let minHarcama = 0;

  if (randevu) {
    const birim = Number(secenek.price) || 0;
    hizmetToplam = birim * katilim.guests;
    satirlar.push({
      label: secenek.name + ' · ' + secenek.duration + ' × ' + katilim.guests + ' kişi',
      amount: hizmetToplam,
      kind: 'base'
    });
  } else {
    kapora = Number(secenek.deposit) || 0;
    minHarcama = Number(secenek.minSpend) || 0;
    const girisBirim = Number(p.entryFee) || 0;
    girisToplam = girisBirim * katilim.guests;

    satirlar.push({
      label: secenek.name + ' kaporası',
      amount: kapora,
      kind: 'base'
    });
    if (girisToplam) {
      satirlar.push({
        label: 'Giriş × ' + katilim.guests + ' kişi',
        amount: girisToplam,
        kind: 'fee'
      });
    }
  }

  ekler.forEach(a => satirlar.push(a));

  const araToplam = randevu ? hizmetToplam : (kapora + girisToplam);

  return {
    mode: randevu ? 'randevu' : 'masa',
    guests: katilim.guests,
    fixedGuests: katilim.fixedGuests,
    option: katilim.option,
    serviceTotal: hizmetToplam,
    deposit: kapora,
    entryTotal: girisToplam,
    /* Minimum harcama bilgidir, tutara girmez. */
    minSpend: minHarcama,
    payAtVenue: randevu,
    addons: ekler,
    addonsTotal: eklerToplam,
    lines: satirlar,
    subtotal: araToplam,
    total: araToplam + eklerToplam
  };
}

/* Kartlarda ve rezervasyon kartının tepesinde görünen fiyat:
     masa     en düşük minimum harcama ("masada en az")
     randevu  en ucuz hizmetin fiyatı
   İki modelin kartta gösterdiği sayı farklı ama ikisi de "buradan
   başlıyor" anlamına geliyor. */
function venuePriceFrom(place) {
  const liste = venueOptions(place);
  if (!liste.length) return 0;
  const alan = (place && place.booking === 'randevu') ? 'price' : 'minSpend';
  return liste.reduce((enAz, o) => Math.min(enAz, Number(o[alan]) || 0),
    Number(liste[0][alan]) || 0);
}

function venuePriceUnit(place) {
  const p = (place && place.pricing) || {};
  return p.unitNote || (place && place.booking === 'randevu' ? 'hizmet başı' : 'masada en az');
}

/* Kalan yer burada hesaplanmıyor: veri kapısının kontenjan cevabından
   (MolaVeri.musaitlik; birim alan/hizmet × seans). */

/* /mola360/mekan/kum-beach-club/ -> "kum-beach-club" */
function venueSlugFromPath(pathname) {
  const m = String(pathname || '').match(/\/mekan\/([^/?#]+)/);
  if (!m) return '';
  const parca = m[1];
  if (/\.html?$/i.test(parca)) return '';
  try {
    return decodeURIComponent(parca).trim().toLowerCase();
  } catch (_) {
    return '';
  }
}

/* ---------------- mekânlar ----------------
   NOT: buradaki mekânlar kurgusaldır (gerçek envanter bağlanana kadar
   örnek içerik). Bu yüzden sayfada LocalBusiness/Offer/AggregateRating
   yapısal verisi YOK — gerekçesi docs/mekan-sayfasi.md ve
   docs/seo-arastirma.md (madde 2) içinde.

   İki kayıt bilerek farklı modelde: biri masa, diğeri randevu. Yeni bir
   restoran ya da güzellik merkezi eklemek, doğru modeli seçip kayıt
   yazmaktan ibaret. */
const PLACES = {
  'kum-beach-club': {
    slug: 'kum-beach-club',
    type: 'venue',
    kind: 'beach-club',
    booking: 'masa',
    title: 'Kum Beach Club',
    tagline: 'Alaçatı koyunda şezlong, sedir ve loca; gün boyu DJ, akşam mutfak',
    category: 'Mekan',
    categoryShort: 'Beach Club',
    categoryPlural: 'Mekanlar',
    categoryAnchor: 'mekanlar',
    area: 'Alaçatı, Çeşme',
    region: 'Ege',
    code: 'MLA-MKN-01',

    /* Sınıflandırma, para birimi ve arama motoru bilgisi:
       docs/veri-sozlesmesi.md bölüm 4. Paylaşım görseli galerinin ilki
       değil, Alaçatı değirmenleri (ogImage). */
    taxonomy: {
      categories: ['beach-club'],
      themes: ['deniz-tekne'],
      collections: ['arkadas-grubu'],
      city: 'izmir',
      facets: {}
    },
    currency: 'TRY',
    /* Yayına giriş tarihi: sayfanın depoya girdiği gün (git geçmişi).
       "Yeni Eklenenler" ve "En yeni" sıralaması bununla. */
    publishedAt: '2026-09-21',
    seo: {
      title: 'Kum Beach Club | mola360',
      description: 'Alaçatı koyunda denize sıfır beach club: şezlong, sedir ve loca alanları, {fiyat}\'den başlayan minimum harcama, kapora masadaki hesaptan düşer. Gün boyu DJ, mutfak 23:00\'e kadar açık.',
      ogTitle: 'Kum Beach Club — Alaçatı, Çeşme',
      ogDescription: 'Denize sıfır koyda şezlong, sedir ve loca. Kapora masadaki harcamadan düşer.',
      ogImage: 'alacati'
    },
    priceLevel: '₺₺₺',
    /* Künyede ve kartta geçen kısa tanım. */
    kindLabel: 'Beach Club',

    card: {
      img: 'alacati',
      title: 'Kum Beach Club',
      badges: ['Beach Club'],
      meta1: 'Alaçatı, Çeşme · Denize sıfır'
    },

    badges: [
      { icon: 'bolt',    label: 'Anında onay' },
      { icon: 'sun',     label: 'Denize sıfır' },
      { icon: 'wallet',  label: 'Kapora harcamadan düşer' },
      { icon: 'refresh', label: '24 saate kadar ücretsiz iptal' }
    ],

    facts: [
      { icon: 'clock',  label: 'Saatler',    value: '09:00 – 02:00',      note: 'Hafta sonu 03:00’e kadar' },
      { icon: 'users',  label: 'Alanlar',    value: 'Şezlong, sedir, loca', note: '2 – 8 kişi' },
      { icon: 'wallet', label: 'Minimum',    value: '1.500 TL’den',        note: 'Masada beklenen harcama' },
      { icon: 'food',   label: 'Mutfak',     value: 'Ege ve deniz',        note: 'Mutfak 23:00’te kapanır' },
      { icon: 'mapPin', label: 'Konum',      value: 'Alaçatı koyu',        note: 'Çeşme merkeze 9 km' },
      { icon: 'bus',    label: 'Otopark',    value: 'Vale ücretsiz',       note: 'Rezervasyonlu misafirlere' }
    ],

    gallery: [
      { key: 'cesmePlaj',    caption: 'Koydaki kumsal' },
      { key: 'sezlong',      caption: 'Şezlong alanı' },
      { key: 'beachBar',     caption: 'Gün batımında sahil barı' },
      { key: 'denizManzara', caption: 'Ege’ye bakan teras' },
      { key: 'alacati',      caption: 'Alaçatı değirmenleri — 4 km' },
      { key: 'kemeralti',    caption: 'Dönüşte Kemeraltı’na uğrayanlar için' }
    ],

    highlights: [
      'Alaçatı koyunda denize sıfır, dalgasız ve sığ giriş',
      'Şezlong, sedir ve locadan oluşan üç ayrı alan; hepsinde gölgelik',
      'Kapora rezervasyonda alınıyor ve masadaki harcamadan düşülüyor',
      'Gün boyu DJ, gün batımında canlı set',
      'Mutfak 12:00 – 23:00 arası açık; Ege otları ve günlük balık',
      'Rezervasyonlu misafirlere ücretsiz vale'
    ],

    description: [
      'Kum Beach Club, Alaçatı’nın rüzgârdan korunan küçük koylarından birinde. Kumsal dar ama deniz girişi sığ ve dalgasız olduğu için çocuklu aileler gün boyu rahat ediyor. Alan üçe ayrılmış: kumsala yakın şezlonglar, arkadaki gölgeli sedirler ve terastaki localar. Üçünde de gölgelik, havlu ve servis var; fark oturma düzeni ve masada beklenen harcama.',
      'Rezervasyon kaporayla kesinleşiyor ve kapora masadaki hesaptan düşülüyor — yani ödediğiniz para mekânda size geri dönüyor. Minimum harcama alan başına belirli: şezlongda 1.500, sedirde 3.000, locada 9.000 TL. Bu tutar yiyecek ve içeceğin toplamı; altında kalırsanız aradaki fark hesaba yazılıyor. Kural sayfada açık yazıyor, çünkü kapıda öğrenilen minimum harcama günün tadını kaçırıyor.',
      'Mutfak öğlen açılıyor ve 23:00’te kapanıyor; menüde Ege otları, günlük balık ve taş fırın var. Müzik gün boyu DJ, gün batımında canlı set. Gece 02:00’de (hafta sonu 03:00) kapanıyor, son servis kapanıştan yarım saat önce. Çeşme merkeze 9 kilometre, Alaçatı’ya 4; rezervasyonlu misafirler için vale ücretsiz.'
    ],

    /* Çalışma saatleri: 0 = pazar. Kapanış açılıştan küçükse vardiya
       gece yarısını aşıyor demektir (venueOpenNow bunu çözüyor). */
    hours: [
      { day: 1, label: 'Pazartesi', open: '09:00', close: '02:00' },
      { day: 2, label: 'Salı',      open: '09:00', close: '02:00' },
      { day: 3, label: 'Çarşamba',  open: '09:00', close: '02:00' },
      { day: 4, label: 'Perşembe',  open: '09:00', close: '02:00' },
      { day: 5, label: 'Cuma',      open: '09:00', close: '03:00' },
      { day: 6, label: 'Cumartesi', open: '09:00', close: '03:00' },
      { day: 0, label: 'Pazar',     open: '09:00', close: '02:00' }
    ],

    /* Alanlar: masa modelinin fiyat ekseni. minSpend masada beklenen
       harcama, deposit rezervasyonda alınan ve o harcamadan düşülen
       kapora. */
    areas: [
      {
        id: 'sezlong', name: 'Şezlong', key: 'sezlong', capacity: 2,
        minSpend: 1500, deposit: 500, count: 60,
        features: ['İki şezlong', 'Gölgelik', 'Havlu', 'Kumsala yakın'],
        note: 'Kumsalın ilk sırasında; sabah 11’den sonra doluyor.'
      },
      {
        id: 'sedir', name: 'Sedir', key: 'beachBar', capacity: 4,
        minSpend: 3000, deposit: 1000, count: 24,
        features: ['Dört kişilik sedir', 'Gölgelik ve yastık', 'Havlu', 'Sabit masa'],
        note: 'Arka sırada, gölgede; öğle yemeği için en rahat alan.'
      },
      {
        id: 'loca', name: 'Loca', key: 'denizManzara', capacity: 8,
        minSpend: 9000, deposit: 2500, count: 8,
        features: ['Sekiz kişiye kadar', 'Terasta, denize bakan', 'Ayrı servis',
                   'Şemsiye ve serinletme'],
        note: 'Terasın ön sırası; gün batımı localardan görünür.'
      }
    ],

    /* Menüden öne çıkanlar: fiyat bandını göstermek minimum harcamayı
       anlamlı kılıyor. Tam menü değil, örnek. */
    menu: [
      { title: 'Başlangıç', items: [
        { name: 'Ege otları mezesi', price: 320 },
        { name: 'Deniz börülcesi', price: 280 },
        { name: 'Ahtapot ızgara', price: 780 }
      ] },
      { title: 'Ana yemek', items: [
        { name: 'Günün balığı (kilo fiyatı)', price: 1450 },
        { name: 'Taş fırın pide', price: 420 },
        { name: 'Sebzeli risotto', price: 540 }
      ] },
      { title: 'İçecek', items: [
        { name: 'Ev limonatası', price: 180 },
        { name: 'Kadeh şarap', price: 380 },
        { name: 'Şişe şarap (yerli)', price: 1600 }
      ] }
    ],

    rules: [
      { icon: 'wallet', title: 'Minimum harcama',
        text: 'Her alanın masada beklenen bir harcaması var (şezlong 1.500, sedir 3.000, loca 9.000 TL). Bu tutar yiyecek ve içeceğin toplamıdır; altında kalınırsa aradaki fark hesaba yazılır. Rezervasyon kaporanız bu tutardan düşülür.' },
      { icon: 'users',  title: 'Çocuklar',
        text: 'Çocuklar gün boyu kabul edilir; deniz girişi sığ ve dalgasızdır. 21:00’den sonra müzik seviyesi yükseldiği için küçük çocuklu aileler için gündüz öneriliyor. Bebek bakım masası karşılamada.' },
      { icon: 'info',   title: 'Kıyafet',
        text: 'Gündüz mayo serbest; akşam servisinde (19:00 sonrası) masaya üst giyilmesi isteniyor. Sahil dışında ayakkabı zorunlu değil.' },
      { icon: 'close',  title: 'Dışarıdan yiyecek',
        text: 'Dışarıdan yiyecek ve içecek kabul edilmiyor; bebek maması ve özel diyet gerektiren ürünler bunun dışında. Cam şişe kumsala sokulamıyor.' },
      { icon: 'heart',  title: 'Evcil hayvan',
        text: 'Teras ve sedir alanında evcil hayvan kabul ediliyor, kumsalda kabul edilmiyor. Tasma zorunlu, su kabı mekân tarafından veriliyor.' },
      { icon: 'sun',    title: 'Hava',
        text: 'Yağmur ya da kuvvetli rüzgâr nedeniyle alan kapanırsa kapora iade edilir veya dilediğiniz başka bir güne aktarılır. Karar sabah 10:00’da veriliyor ve mesajla bildiriliyor.' }
    ],

    location: {
      title: 'Alaçatı koyu',
      address: '2. Koy Mevkii, Alaçatı, Çeşme / İzmir',
      note: 'Girişte vale var; rezervasyonlu misafirler için ücretsiz. Yol sonu toprak, alçak araçlar yavaş girmeli.',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Ala%C3%A7at%C4%B1%20%C3%87e%C5%9Fme%20%C4%B0zmir',
      access: [
        { icon: 'bus',    text: 'Çeşme merkezden 9 km, Alaçatı’dan 4 km; araçla 12 dakika.' },
        { icon: 'mapPin', text: 'İzmir merkezden 85 km, otoyolla yaklaşık 1 saat 10 dakika.' },
        { icon: 'wallet', text: 'Vale rezervasyonlu misafirlere ücretsiz; günübirlik park alanı 150 TL.' },
        { icon: 'clock',  text: 'Şezlong ve sedirler 11:00’den sonra doluyor; hafta sonu için önceden rezervasyon öneriliyor.' }
      ]
    },

    cancellation: {
      tiers: [
        { minHours: 24, rate: 1,   label: '24 saat ve öncesi', text: 'Kaporanın tamamı iade edilir.' },
        { minHours: 4,  rate: 0.5, label: '4 – 24 saat arası', text: 'Kaporanın yarısı iade edilir.' },
        { minHours: 0,  rate: 0,   label: 'Son 4 saat',        text: 'Kapora iade edilmez; başka bir güne aktarım için mekânı arayın.' }
      ],
      note: 'Hava koşulu nedeniyle alan kapanırsa kapora koşulsuz iade edilir ya da dilediğiniz güne aktarılır; bu misafir iptali sayılmaz.',
      exampleTotal: 500
    },

    pricing: {
      unitNote: 'masada en az',
      maxGuests: 8,
      leadDays: 0,
      entryFee: 0,
      depositNote: 'Kapora masadaki harcamadan düşülür',
      slots: ['10:00', '12:00', '14:00', '16:00', '19:00', '21:00'],
      weekendSlots: ['09:00', '11:00', '13:00', '15:00', '18:00', '20:00', '22:00']
    },

    addons: [
      { id: 'havluSeti',  per: 'guest',   price: 150, label: 'Havlu ve terlik seti',
        text: 'Gün boyu kullanım, çıkışta teslim' },
      { id: 'transfer',   per: 'booking', price: 600, label: 'Alaçatı içi transfer',
        text: 'Otelinizden alım ve bırakma' },
      { id: 'dogumGunu',  per: 'booking', price: 900, label: 'Doğum günü düzenlemesi',
        text: 'Masa süslemesi, pasta ve maytap servisi' }
    ],

    trust: [
      { icon: 'bolt',    text: 'Anında onay — masanız hemen ayrılır' },
      { icon: 'wallet',  text: 'Kapora masadaki harcamadan düşülür' },
      { icon: 'refresh', text: '24 saat öncesine kadar ücretsiz iptal' }
    ],

    social: { viewedLast24h: 96, bookedThisWeek: 58 },

    ratingBreakdown: { 5: 612, 4: 148, 3: 41, 2: 14, 1: 9 },

    ratingAspects: [
      { label: 'Konum',      value: 4.8 },
      { label: 'Servis',     value: 4.5 },
      { label: 'Mutfak',     value: 4.4 },
      { label: 'Fiyat / performans', value: 4.0 }
    ],

    reviews: [
      { name: 'Burcu Önal', date: '2026-09-12', rating: 5, party: 'Arkadaş grubu',
        title: 'Sedir alanı gölgeli ve sakin',
        text: 'Altı kişiydik, iki sedir tuttuk. Gölge gün boyu duruyor, servis sık geliyor. Minimum harcamayı zaten yemekle dolduruyorsunuz, kapora da düşülüyor; yani sürpriz yok. Deniz girişi çocuklar için çok rahat.' },
      { name: 'Tolga Şeker', date: '2026-09-05', rating: 4, party: 'Çift olarak',
        title: 'Şezlong iyi ama 11’den sonra yer yok',
        text: 'Rezervasyonsuz gittik, şezlong kalmamıştı; sediri aldık, o da güzeldi. Bir dahakine önceden ayırtırım. Gün batımı localardan daha iyi görünüyor ama loca minimumu yüksek.' },
      { name: 'Melis Arda', date: '2026-08-28', rating: 5, party: 'Ailece',
        title: 'Çocuklu aile için doğru koy',
        text: 'Deniz sığ ve dalga yok, 5 yaşındaki çocuk rahat oynadı. Mutfak gerçekten iyi, ahtapot ızgara öne çıkıyor. Akşam müzik yükseliyor, biz 20:00 gibi çıktık.' },
      { name: 'Emre Kılıç', date: '2026-08-19', rating: 3, party: 'Arkadaş grubu',
        title: 'Loca güzel, minimum yüksek',
        text: 'Sekiz kişilik loca aldık, 9.000 minimum var. Yemek ve içecekle doluyor ama bütçe planlamadan gitmeyin. Servis kalabalık saatte yavaşlıyor. Manzara ve müzik tartışmasız iyi.' },
      { name: 'Sinem Ata', date: '2026-08-07', rating: 5, party: 'Çift olarak',
        title: 'Hava iptali sorunsuz halledildi',
        text: 'Rüzgâr nedeniyle alan kapandı, sabah 10’da mesaj attılar. Kaporayı iki gün sonrasına aktardılar, fark istemediler. İkinci gün hava mükemmeldi.' },
      { name: 'Onur Deniz', date: '2026-07-26', rating: 4, party: 'Ailece',
        title: 'Vale ve otopark rahat',
        text: 'Yol sonu toprak, alçak araçla yavaş gidin. Vale rezervasyonluya ücretsiz. Havlu setini aldık, gerek yokmuş; kendi havlunuzu götürün.' },
      { name: 'Pınar Yalın', date: '2026-07-14', rating: 5, party: 'Arkadaş grubu',
        title: 'Gün batımı seti',
        text: 'DJ gün boyu sakin çalıyor, 19:30 civarı canlı sete geçiyor. Kalabalık ama itiş kakış yok. Kadeh şarap 380, fiyatlar menüde yazıldığı gibi.' },
      { name: 'Cem Bulut', date: '2026-07-02', rating: 5, party: 'Çift olarak',
        title: 'Kapora mantığı iyi kurgulanmış',
        text: 'Rezervasyonda 500 TL kapora alındı, hesaba yazıldı. Yani masraf değil ön ödeme. Bunu açıkça yazan az yer var, doğru bir yaklaşım.' }
    ],

    faq: [
      { q: 'Kapora ne oluyor, geri alıyor muyum?',
        a: 'Kapora rezervasyonu kesinleştiriyor ve mekânda masadaki hesabınızdan düşülüyor; yani harcamanızın bir parçası oluyor, ayrıca ücret değil. Rezervasyonu 24 saatten önce iptal ederseniz kaporanın tamamı iade edilir.' },
      { q: 'Minimum harcama ne demek?',
        a: 'Her alanın masada beklenen bir harcaması var: şezlongda 1.500, sedirde 3.000, locada 9.000 TL. Yiyecek ve içeceğin toplamı bu tutarı geçmezse aradaki fark hesaba yazılır. Kaporanız bu tutardan düşülür.' },
      { q: 'Rezervasyonsuz gelebilir miyim?',
        a: 'Gelebilirsiniz ama hafta sonu ve tatil günlerinde şezlong ve sedirler 11:00’den sonra doluyor. Rezervasyon alanınızı ve saatinizi garantiliyor; ayrıca rezervasyonlu misafirlere vale ücretsiz.' },
      { q: 'Çocuk ve evcil hayvan kabul ediliyor mu?',
        a: 'Çocuklar gün boyu kabul ediliyor, deniz girişi sığ ve dalgasız. Evcil hayvanlar teras ve sedir alanında kabul ediliyor, kumsalda kabul edilmiyor; tasma zorunlu.' },
      { q: 'Hava bozarsa ne oluyor?',
        a: 'Yağmur ya da kuvvetli rüzgâr nedeniyle alan kapanırsa kapora koşulsuz iade edilir veya dilediğiniz başka bir güne aktarılır. Karar sabah 10:00’da veriliyor ve rezervasyon sahibine mesajla bildiriliyor.' },
      { q: 'Mutfak saat kaça kadar açık?',
        a: 'Mutfak 12:00 – 23:00 arası açık. Mekân hafta içi 02:00’de, cuma ve cumartesi 03:00’te kapanıyor; bar servisi kapanıştan yarım saat öncesine kadar sürüyor.' }
    ],

    similar: [
      { key: 'denizManzara', title: 'Çeşme Marina Teras',  meta: 'Çeşme · Restoran',    rating: '4,6', price: 1200, unit: 'masada en az' },
      { key: 'beachBar',     title: 'Ilıca Sahil Kulübü',  meta: 'Ilıca · Beach club',  rating: '4,4', price: 1800, unit: 'masada en az' },
      { key: 'kordonBoyu',   href: 'mekan/kordon-spa-masaj/', title: 'Kordon Spa & Masaj',
        meta: 'Alsancak, İzmir · Masaj', rating: '4,8', price: 1200, unit: 'hizmet başı' },
      { key: 'alacati',      title: 'Alaçatı Kahvaltı Bahçesi', meta: 'Alaçatı · Kahvaltı', rating: '4,7', price: 650, unit: 'kişi başı' }
    ],

    tags: [
      { label: 'Mekanlar',           href: 'index.html#mekanlar' },
      { label: 'Aktiviteler',        href: 'index.html#aktiviteler' },
      { label: 'Oteller',            href: 'index.html#oteller' },
      { label: 'Günübirlik turlar',  href: 'index.html#turlar' },
      { label: 'Alanlar ve minimum', href: '#alanlar' },
      { label: 'Menüden seçmeler',   href: '#menu' },
      { label: 'Çalışma saatleri',   href: '#saatler' },
      { label: 'Mekân kuralları',    href: '#bilgiler' },
      { label: 'Misafir yorumları',  href: '#yorumlar' },
      { label: 'Kordon Spa & Masaj', href: 'mekan/kordon-spa-masaj/' }
    ]
  },

  /* ---- Randevu modeli ----
     Masa modelinden farkı yalnızca içerik değil: burada alan değil
     HİZMET seçiliyor, kişi sayısı hizmetin tanımına bağlı (çift masajı
     iki kişilik) ve ön ödeme yok — ödeme mekânda. */
  'kordon-spa-masaj': {
    slug: 'kordon-spa-masaj',
    type: 'venue',
    kind: 'masaj-salonu',
    booking: 'randevu',
    title: 'Kordon Spa & Masaj',
    tagline: 'Alsancak’ta randevulu masaj ve bakım; sessiz kabinler, sertifikalı terapistler',
    category: 'Mekan',
    categoryShort: 'Masaj Salonu',
    categoryPlural: 'Mekanlar',
    categoryAnchor: 'mekanlar',
    area: 'Alsancak, İzmir',
    region: 'Ege',
    code: 'MLA-MKN-02',

    /* Sınıflandırma: menüde spa kategorisi yok; "Spa & Masaj" bu kayıt
       için açıldı (onaya sunulu, docs/veri-sozlesmesi.md bölüm 5). */
    taxonomy: {
      categories: ['spa-masaj'],
      themes: [],
      collections: ['romantik'],
      city: 'izmir',
      facets: {}
    },
    currency: 'TRY',
    /* Yayına giriş tarihi: sayfanın depoya girdiği gün (git geçmişi).
       "Yeni Eklenenler" ve "En yeni" sıralaması bununla. */
    publishedAt: '2026-09-21',
    seo: {
      title: 'Kordon Spa & Masaj | mola360',
      description: 'Alsancak\'ta randevulu masaj salonu: klasik, sıcak taş, aromaterapi ve çift masajı. {fiyat}\'den başlayan fiyatlar, ön ödeme yok, 6 saate kadar ücretsiz iptal.',
      ogTitle: 'Kordon Spa & Masaj — Alsancak, İzmir',
      ogDescription: 'Randevulu masaj ve bakım; sertifikalı terapistler, ön ödeme yok.'
    },
    priceLevel: '₺₺',
    kindLabel: 'Masaj ve Bakım',

    card: {
      img: 'izmirKordon',
      title: 'Kordon Spa & Masaj',
      badges: ['Masaj Salonu'],
      meta1: 'Alsancak, İzmir · Randevulu'
    },

    badges: [
      { icon: 'calendar', label: 'Randevulu çalışır' },
      { icon: 'shield',   label: 'Sertifikalı terapist' },
      { icon: 'wallet',   label: 'Ön ödeme yok' },
      { icon: 'refresh',  label: '6 saate kadar ücretsiz iptal' }
    ],

    facts: [
      { icon: 'clock',    label: 'Saatler',    value: '10:00 – 21:00',   note: 'Pazar kapalı' },
      { icon: 'home',     label: 'Kabin',      value: '5 sessiz kabin',  note: 'İkisi çift kabini' },
      { icon: 'users',    label: 'Terapist',   value: '6 kişilik ekip',  note: 'Kadın/erkek tercihi alınır' },
      { icon: 'wallet',   label: 'Ödeme',      value: 'Mekânda',         note: 'Ön ödeme alınmıyor' },
      { icon: 'mapPin',   label: 'Konum',      value: 'Kordon’a 200 m',  note: 'Alsancak merkez' },
      { icon: 'info',     label: 'Yaş',        value: '16 yaş ve üzeri', note: '16 – 18 yaş veli onayıyla' }
    ],

    gallery: [
      { key: 'masajOda',     caption: 'Masaj kabini' },
      { key: 'spaKarsilama', caption: 'Karşılama ve dinlenme alanı' },
      { key: 'sicakTas',     caption: 'Sıcak taş uygulaması' },
      { key: 'aromaYag',     caption: 'Aromaterapi yağları' },
      { key: 'kordonBoyu',   caption: 'Kordon boyu — 200 metre' }
    ],

    highlights: [
      'Alsancak’ta Kordon’a 200 metre, randevulu çalışan beş kabinli salon',
      'Sertifikalı terapistler; kadın ya da erkek terapist tercihi alınıyor',
      'Çift kabininde iki kişi aynı anda; çift masajı tanımı gereği iki kişilik',
      'Randevuda ön ödeme yok — ödeme hizmet sonrası mekânda',
      'Seans öncesi kısa değerlendirme: basınç tercihi ve sakınılacak bölgeler',
      'Randevular arası 15 dakika temizlik ve havalandırma payı'
    ],

    description: [
      'Kordon Spa & Masaj, Alsancak’ın ara sokaklarından birinde, Kordon’a 200 metre mesafede. Beş kabinin ikisi çift kabini; diğerleri tek kişilik ve sokak sesini almayan iç cephede. Salon randevuyla çalışıyor, yani kapıdan girip sıra beklemek yok — her randevu arasında 15 dakikalık temizlik ve havalandırma payı bırakılıyor.',
      'Hizmetler süreye göre ayrılmış: klasik masaj 60 dakika, sıcak taş 75 dakika, aromaterapi 90 dakika. Seans öncesi kısa bir değerlendirme yapılıyor — basınç tercihi, ağrıyan bölgeler ve sakınılması gereken yerler konuşuluyor. Kadın ya da erkek terapist tercihinizi rezervasyon notuna yazabilirsiniz; ekipte altı terapist var.',
      'Ön ödeme alınmıyor: randevu onaylandığında bir şey ödemiyorsunuz, ödeme hizmet sonrası mekânda yapılıyor. Randevuyu altı saat öncesine kadar ücretsiz iptal edebiliyorsunuz. Geç kalınan süre seanstan düşülüyor, çünkü arkanızdaki randevu kayıyor.'
    ],

    hours: [
      { day: 1, label: 'Pazartesi', open: '10:00', close: '21:00' },
      { day: 2, label: 'Salı',      open: '10:00', close: '21:00' },
      { day: 3, label: 'Çarşamba',  open: '10:00', close: '21:00' },
      { day: 4, label: 'Perşembe',  open: '10:00', close: '21:00' },
      { day: 5, label: 'Cuma',      open: '10:00', close: '22:00' },
      { day: 6, label: 'Cumartesi', open: '10:00', close: '22:00' },
      { day: 0, label: 'Pazar',     closed: true }
    ],

    /* Hizmetler: randevu modelinin fiyat ekseni. requiredGuests, kişi
       sayısının hizmet tanımına bağlı olduğu durumlar için. */
    services: [
      {
        id: 'klasik', name: 'Klasik masaj', key: 'masajOda', duration: '60 dakika',
        capacity: 2, price: 1200, priceList: 1400, count: 12,
        features: ['Tüm vücut', 'Basınç tercihi alınır', 'Bitkisel yağ', 'Duş kullanımı'],
        note: 'İlk kez gelenler için önerilen seans; sırt ve boyun ağırlıklı çalışılıyor.'
      },
      {
        id: 'sicakTas', name: 'Sıcak taş masajı', key: 'sicakTas', duration: '75 dakika',
        capacity: 2, price: 1650, priceList: 1850, count: 8,
        features: ['Bazalt taş', 'Kas gevşetici', 'Sırt ve bacak ağırlıklı', 'Duş kullanımı'],
        note: 'Kas tutulması ve uzun yolculuk sonrası tercih ediliyor.'
      },
      {
        id: 'aroma', name: 'Aromaterapi', key: 'aromaYag', duration: '90 dakika',
        capacity: 2, price: 1800, priceList: 2100, count: 8,
        features: ['Yağ seçimi sizde', 'Yavaş tempo', 'Tüm vücut', 'Duş kullanımı'],
        note: 'Uyku düzeni ve stres için; seans sonunda bitki çayı ikramı var.'
      },
      {
        id: 'cift', name: 'Çift masajı', key: 'spaKarsilama', duration: '60 dakika',
        capacity: 2, requiredGuests: 2, price: 2200, priceList: 2500, count: 4,
        features: ['İki kişi aynı kabinde', 'İki terapist', 'Bitki çayı ikramı', 'Duş kullanımı'],
        note: 'Tanımı gereği iki kişilik; kişi sayısı seçilemez, sabittir.'
      }
    ],

    rules: [
      { icon: 'clock',  title: 'Geç kalma',
        text: 'Randevular arası 15 dakika temizlik payı var; geç kalınan süre seanstan düşülür, çünkü arkanızdaki randevu kayar. 20 dakikadan fazla gecikmede randevu iptal sayılır.' },
      { icon: 'wallet', title: 'Ödeme',
        text: 'Ön ödeme alınmıyor. Ödeme hizmet sonrası mekânda, kredi kartı veya nakit olarak yapılıyor. Rezervasyon sırasında kart bilgisi istenmiyor.' },
      { icon: 'users',  title: 'Yaş ve refakat',
        text: '16 yaş ve üzeri kabul ediliyor; 16 – 18 yaş için veli onayı gerekiyor. Salon içinde refakatçi bekleme alanında oturuyor, kabine girmiyor.' },
      { icon: 'shield', title: 'Sağlık',
        text: 'Hamilelik, yakın zamanda geçirilmiş ameliyat, açık yara, ateşli hastalık ve tromboz öyküsü varsa masaj yapılmıyor. Kronik rahatsızlıklarınızı randevu notuna yazın; terapist uygulamayı ona göre düzenler.' },
      { icon: 'info',   title: 'Terapist tercihi',
        text: 'Kadın ya da erkek terapist tercihinizi rezervasyon notuna yazabilirsiniz. Tercih edilen terapist doluysa randevu saati önerilerek teyit isteniyor; kendiliğinden değiştirilmiyor.' },
      { icon: 'close',  title: 'Kapsam dışı',
        text: 'Salon yalnızca klasik masaj ve bakım hizmeti veriyor. Tıbbi tedavi, fizyoterapi ve enjeksiyon uygulamaları yapılmıyor; bu talepler için sağlık kuruluşuna yönlendiriliyorsunuz.' }
    ],

    location: {
      title: 'Alsancak — Kordon arkası',
      address: 'Kıbrıs Şehitleri Caddesi arka sokağı, Alsancak / Konak, İzmir',
      note: 'Bina girişinde asansör var, salon ikinci katta. Sokakta ücretli park uygulanıyor; 150 metredeki kapalı otoparkla anlaşma mevcut.',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Alsancak%20Kordon%20%C4%B0zmir',
      access: [
        { icon: 'mapPin', text: 'Kordon yürüyüş yoluna 200 m; Alsancak Tren İstasyonu 600 m.' },
        { icon: 'bus',    text: 'Tramvay Alsancak durağı 350 m; İZBAN ile havalimanından 45 dakika.' },
        { icon: 'wallet', text: 'Sokakta ücretli park 08:00 – 20:00; anlaşmalı kapalı otopark saatlik 80 TL.' },
        { icon: 'clock',  text: 'Randevudan 10 dakika önce gelmeniz yeterli; değerlendirme kısa sürüyor.' }
      ]
    },

    cancellation: {
      tiers: [
        { minHours: 6, rate: 1,   label: '6 saat ve öncesi', text: 'Ücretsiz iptal; ön ödeme alınmadığı için iade söz konusu değil.' },
        { minHours: 2, rate: 0.5, label: '2 – 6 saat arası', text: 'Randevu bir kez ücretsiz ertelenebilir.' },
        { minHours: 0, rate: 0,   label: 'Son 2 saat',       text: 'Randevu düşer; sık tekrarında sonraki rezervasyonlarda kapora istenebilir.' }
      ],
      note: 'Ön ödeme alınmadığı için iptalde para iadesi gerekmiyor. Kademeler randevunun ne kadar önceden bırakıldığını ve erteleme hakkını anlatıyor.',
      exampleTotal: 1200
    },

    pricing: {
      unitNote: 'hizmet başı',
      maxGuests: 2,
      leadDays: 0,
      payAtVenueNote: 'Ödeme hizmet sonrası mekânda yapılır; şimdi ödeme alınmıyor',
      slots: ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:00']
    },

    addons: [
      { id: 'peeling',  per: 'guest',   price: 350, label: 'Kese ve peeling',
        text: 'Seans öncesi 20 dakika' },
      { id: 'uzatma',   per: 'guest',   price: 300, label: '15 dakika uzatma',
        text: 'Seans süresine eklenir' },
      { id: 'hediyeKarti', per: 'booking', price: 0, label: 'Hediye olarak paketle',
        text: 'Randevu bilgisi hediye kartı olarak düzenlenir, ücretsiz' }
    ],

    trust: [
      { icon: 'wallet',   text: 'Ön ödeme yok — ödeme mekânda' },
      { icon: 'refresh',  text: '6 saat öncesine kadar ücretsiz iptal' },
      { icon: 'shield',   text: 'Sertifikalı terapist, tek kullanımlık örtü' }
    ],

    social: { viewedLast24h: 41, bookedThisWeek: 27 },

    ratingBreakdown: { 5: 288, 4: 44, 3: 9, 2: 3, 1: 2 },

    ratingAspects: [
      { label: 'Terapist',   value: 4.9 },
      { label: 'Temizlik',   value: 4.9 },
      { label: 'Randevuya uyum', value: 4.7 },
      { label: 'Fiyat / performans', value: 4.5 }
    ],

    reviews: [
      { name: 'Zeynep Hakyemez', date: '2026-09-16', rating: 5, party: 'Tek başına',
        title: 'Randevu saatinde başladı',
        text: 'Saat 16:00 randevum vardı, 15:58’de kabine alındım. Seans öncesi basınç tercihimi sordular, ağrıyan omzuma ağırlık verildi. Ön ödeme yok, çıkışta ödedim. Alsancak’ta bu düzeni bulmak kolay değil.' },
      { name: 'Ahmet Yıldırım', date: '2026-09-07', rating: 5, party: 'Çift olarak',
        title: 'Çift masajı için geniş kabin',
        text: 'Eşimle çift masajı aldık, iki terapist aynı anda girdi. Kabin gerçekten iki kişilik, sıkışık değil. Sonrasında bitki çayı ikram ettiler. Yıl dönümü için iyi bir fikirdi.' },
      { name: 'Derya Sönmez', date: '2026-08-29', rating: 4, party: 'Tek başına',
        title: 'Sıcak taş iyi ama 75 dakika kısa geldi',
        text: 'Uygulama profesyonel, taşların sıcaklığı tam kıvamında. Yalnız 75 dakika bana kısa geldi, bir dahakine aromaterapiyi (90 dk) deneyeceğim. Uzatma seçeneği varmış, sonradan gördüm.' },
      { name: 'Kaan Berk', date: '2026-08-18', rating: 5, party: 'Tek başına',
        title: 'Terapist tercihi ciddiye alınıyor',
        text: 'Erkek terapist tercihimi yazmıştım; o saatte müsait değilmiş, beni arayıp yarım saat sonrasını önerdiler. Kendiliğinden değiştirmemeleri hoşuma gitti.' },
      { name: 'Şeyma Aksoy', date: '2026-08-06', rating: 5, party: 'Arkadaş grubu',
        title: 'İki arkadaş yan kabinlerde',
        text: 'Aynı saate iki ayrı randevu aldık, yan kabinlere verdiler. Bekleme alanı sessiz. Kese peeling eklemesini de aldık, seans öncesi 20 dakika sürdü.' },
      { name: 'Levent Aras', date: '2026-07-25', rating: 3, party: 'Tek başına',
        title: 'Geç kaldım, süre düştü',
        text: 'Trafikte kaldım, 15 dakika geç geldim ve o süre seanstan düşüldü. Kural sayfada yazıyormuş, okumamışım. Uygulamanın kendisi iyiydi, yalnız süre kısalınca tadı kaçtı.' },
      { name: 'Nalan Bilgin', date: '2026-07-11', rating: 5, party: 'Tek başına',
        title: 'Temizlik konusunda titizler',
        text: 'Her randevu arasında havalandırma yapıyorlar, örtüler tek kullanımlık. Kabin kokusu ağır değil. Hamilelik için uygulama yapmadıklarını da açıkça söylediler, doğru yaklaşım.' },
      { name: 'Uğur Demirel', date: '2026-07-01', rating: 5, party: 'Çift olarak',
        title: 'Ön ödeme istememeleri güven verdi',
        text: 'Rezervasyonda kart bilgisi istenmedi, randevu mesajla onaylandı. Gitmeseydik ceza da yokmuş; altı saat öncesine kadar serbest. Gittik ve memnun kaldık.' }
    ],

    faq: [
      { q: 'Rezervasyonda ödeme alıyor musunuz?',
        a: 'Hayır. Randevu onaylanırken ön ödeme ya da kart bilgisi istenmiyor; ödeme hizmet sonrası mekânda kredi kartı veya nakit olarak yapılıyor. Randevuyu altı saat öncesine kadar ücretsiz iptal edebilirsiniz.' },
      { q: 'Kadın ya da erkek terapist seçebilir miyim?',
        a: 'Evet. Tercihinizi rezervasyon notuna yazmanız yeterli. Tercih ettiğiniz terapist o saatte doluysa size alternatif saat önerilir ve teyidiniz alınır; terapist kendiliğinden değiştirilmez.' },
      { q: 'Çift masajı için kaç kişi seçmeliyim?',
        a: 'Çift masajı tanımı gereği iki kişiliktir; kişi sayısı sabittir ve seçilemez. İki terapist aynı anda çalışır, kabin iki kişiliktir. Tek kişilik seans istiyorsanız klasik masaj, sıcak taş veya aromaterapiyi seçin.' },
      { q: 'Geç kalırsam ne oluyor?',
        a: 'Randevular arasında 15 dakikalık temizlik payı var, bu yüzden geç kalınan süre seanstan düşülür. 20 dakikadan fazla gecikmede randevu iptal sayılır ve ücret alınmaz, ancak sık tekrarında sonraki rezervasyonlar için kapora istenebilir.' },
      { q: 'Hamileyim, masaj yaptırabilir miyim?',
        a: 'Salonumuzda hamilelik döneminde masaj uygulanmıyor. Yakın zamanda ameliyat geçirenler, açık yarası, ateşli hastalığı veya tromboz öyküsü olanlar için de uygulama yapılmıyor. Kronik rahatsızlığınızı randevu notuna yazarsanız terapist uygulamayı ona göre düzenler.' },
      { q: 'Pazar günü açık mısınız?',
        a: 'Hayır, pazar günleri kapalıyız. Hafta içi 10:00 – 21:00, cuma ve cumartesi 10:00 – 22:00 arası hizmet veriyoruz. Son randevu kapanıştan bir saat önce başlar.' }
    ],

    similar: [
      { key: 'spaKarsilama', title: 'Alsancak Güzellik Merkezi', meta: 'Alsancak · Cilt bakımı', rating: '4,6', price: 950, unit: 'hizmet başı' },
      { key: 'sicakTas',     title: 'Çeşme Termal Spa',          meta: 'Çeşme · Spa',          rating: '4,7', price: 1400, unit: 'hizmet başı' },
      { key: 'alacati',      href: 'mekan/kum-beach-club/', title: 'Kum Beach Club',
        meta: 'Alaçatı, Çeşme · Beach club', rating: '4,5', price: 1500, unit: 'masada en az' },
      { key: 'kordonBoyu',   href: 'otel/kordon-butik-otel/', title: 'Kordon Butik Otel',
        meta: 'Alsancak, İzmir · Şehir oteli', rating: '8,9', price: 1950, unit: 'gecelik' }
    ],

    tags: [
      { label: 'Mekanlar',          href: 'index.html#mekanlar' },
      { label: 'Oteller',           href: 'index.html#oteller' },
      { label: 'Aktiviteler',       href: 'index.html#aktiviteler' },
      { label: 'Etkinlikler',       href: 'index.html#etkinlikler' },
      { label: 'Hizmetler ve süreler', href: '#hizmetler' },
      { label: 'Çalışma saatleri',  href: '#saatler' },
      { label: 'Salon kuralları',   href: '#bilgiler' },
      { label: 'Konum ve ulaşım',   href: '#konum' },
      { label: 'Misafir yorumları', href: '#yorumlar' },
      { label: 'Kum Beach Club',    href: 'mekan/kum-beach-club/' }
    ]
  }
};

const DEFAULT_VENUE_SLUG = 'kum-beach-club';


if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VENUE_IMAGE_FILES,
    PLACES,
    DEFAULT_VENUE_SLUG,
    venueImage,
    venueHoursFor,
    venueOpenNow,
    venueOptions,
    venueOption,
    venueSlots,
    venueSlot,
    clampVenueParty,
    venueAddonLines,
    calcVenueBooking,
    venuePriceFrom,
    venuePriceUnit,
    venueSlugFromPath
  };
}
