/* ---------------- otel içerik sayfası: veri ve saf yardımcılar ----------------
   /otel/<slug>/ sayfasının bütün içeriği burada durur; hotel-page.js yalnızca
   bu veriyi işaretlemeye çevirir ve etkileşimleri bağlar. Sayfada görünen
   hiçbir metin hotel-page.js'in içine yazılmaz — bir oteli değiştirmek için
   tek dosya yeter. Tur sayfasındaki kural (docs/tur-sayfasi.md) burada da
   aynen geçerli.

   Biçimlendirme ve genel hesaplar TEKRAR YAZILMIYOR: tarih, para, iade, puan
   ve ikon işleri tour-data.js'te duruyor ve bu dosya onları kullanıyor.
   Tarayıcıda tour-data.js bu dosyadan ÖNCE yükleniyor (aynı adlar genel
   kapsamda), Node/vitest tarafında ise require ile alınıyor. İki kopya
   tutmamanın bedeli tek satırlık bu köprü.

   Yeni otel eklemek: HOTELS'e bir kayıt daha ve otel/<slug>/index.html. */

/* Node (vitest) tarafında paylaşılan yardımcılar require ile gelir;
   tarayıcıda tour-data.js önce yüklendiği için aynı adlar zaten tanımlı.
   Koşulun yalnızca BİR dalı çalıştığı için diğer daldaki ad hiç okunmaz. */
const TUR_VERI = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./tour-data.js')
  : null;

const oAsDate      = TUR_VERI ? TUR_VERI.asDate      : asDate;
const oToISODate   = TUR_VERI ? TUR_VERI.toISODate   : toISODate;
const oSeatsLeft   = TUR_VERI ? TUR_VERI.seatsLeft   : seatsLeft;
const oCommonsUrl  = TUR_VERI ? TUR_VERI.commonsImageUrl : commonsImageUrl;

/* ---------------- görseller ----------------
   Yöntem tur sayfasıyla aynı: adres Wikimedia Commons dosya adından
   deterministik kurulur (docs/gorsel-kaynaklari.md). cardImages veya
   TOUR_IMAGE_FILES ile ORTAK olan kayıtlarda dosya adı birebir aynıdır;
   tests/hotel.test.js aynı anahtarın iki dosyada aynı adresi ürettiğini
   doğrular, yani aynı fotoğraf iki ayrı adrese gitmez. */
const HOTEL_IMAGE_FILES = {
  kordonBoyu:   { dosya: 'Izmir Alsancak Kordon 6339.jpg',        ad: 'Alsancak Kordon boyu' },
  izmirKonak:   { dosya: 'Izmir Konak Square.jpg',                ad: 'Konak Meydanı ve Saat Kulesi' },
  kemeralti:    { dosya: 'Kemeraltı market 02.jpg',               ad: 'Kemeraltı Çarşısı' },
  izmirMuze:    { dosya: 'İzmir Archaeological Museum 2462 1.jpg', ad: 'İzmir Arkeoloji Müzesi' },
  otelOda:      { dosya: 'Hotel room with double bed.jpg',        ad: 'Otel odası' },
  otelSuit:     { dosya: 'Hotel suite interior.jpg',              ad: 'Suit oda' },
  otelTeras:    { dosya: 'Hotel rooftop terrace.jpg',             ad: 'Çatı terası' },
  otelKahvalti: { dosya: 'Turkish breakfast.jpg',                 ad: 'Açık büfe kahvaltı' },
  otelLobi:     { dosya: 'Hotel lobby.jpg',                       ad: 'Lobi' },
  /* Benzer oteller şeridi */
  kemerMarina:  { dosya: 'Kemer Marina.jpg',                      ad: 'Kemer Marina' },
  termalYalova: { dosya: 'Termal Yalova.jpg',                     ad: 'Yalova Termal' },
  goreme:       { dosya: 'Goreme Open Air Museum.jpg',            ad: 'Göreme' }
};

/* Kayıtsız anahtar boş dizi döndürür: ui.js'teki yedek boş src'yi yer
   tutucuya çevirmediği için tests/hotel.test.js kullanılan her anahtarı
   burada arar. */
function hotelImage(key, width) {
  const kayit = HOTEL_IMAGE_FILES[key];
  return kayit ? oCommonsUrl(kayit.dosya, width) : '';
}

/* ---------------- tarih ----------------
   Otelde tarih tek bir gün değil bir ARALIK: giriş günü + gece sayısı.
   Çıkış tarihi ayrı bir alan olarak tutulmuyor, giriş ve gece sayısından
   türetiliyor — iki alanı elle tutarlı tutmaya çalışmak (giriş ileri
   alınınca çıkışın geride kalması) kaçınılmaz olarak ayrışıyor. */
function hotelCheckout(iso, nights) {
  const d = oAsDate(iso);
  if (!d) return '';
  const gece = Math.max(1, Math.round(Number(nights) || 1));
  return oToISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + gece));
}

/* İki tarih arasındaki gece sayısı. Çıkış girişten önceyse veya eşitse 0
   döner; çağıran taraf en az bir geceye yuvarlamak zorunda kalmasın diye
   burada zorlama yapılmıyor — "geçersiz aralık" bilgisinin kendisi lazım. */
function nightsBetween(inISO, outISO) {
  const giris = oAsDate(inISO);
  const cikis = oAsDate(outISO);
  if (!giris || !cikis) return 0;
  const fark = (cikis.getTime() - giris.getTime()) / 86400000;
  return fark > 0 ? Math.round(fark) : 0;
}

/* ---------------- oda ve pansiyon ----------------
   Tanınmayan kimlik ilk kayda düşer: adres çubuğundan ya da eski bir
   bağlantıdan gelen yanlış değer sayfayı boş bırakmaz. */
function hotelRoom(hotel, roomId) {
  const liste = (hotel && hotel.rooms) || [];
  if (!liste.length) return null;
  const id = String(roomId || '');
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) return liste[i];
  }
  return liste[0];
}

function hotelBoard(hotel, boardId) {
  const liste = (hotel && hotel.boards) || [];
  if (!liste.length) return null;
  const id = String(boardId || '');
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) return liste[i];
  }
  return liste[0];
}

/* ---------------- seçim sınırları ----------------
   Tek yerde: hem sayaç butonları hem tutar bu fonksiyondan geçiyor,
   böylece ekranda görünen sayı ile hesaplanan sayı ayrışamaz.

   Sıra önemli:
     1. gece sayısı otelin alt/üst sınırına çekilir,
     2. oda sayısı misafiri ALACAK kadar yükseltilir (oda kapasitesi),
     3. oda sayısı tesis sınırını aşarsa misafir sayısı geri çekilir —
        önce çocuk, sonra yetişkin; en az bir yetişkin kalır.
   Üçüncü adım olmasaydı "3 oda sınırı" ekranda yazarken sekiz kişilik
   bir hesap çıkıyordu. */
function clampStay(hotel, secim) {
  const p = (hotel && hotel.pricing) || {};
  const sec = secim || {};
  const oda = hotelRoom(hotel, sec.room);
  const pansiyon = hotelBoard(hotel, sec.board);

  const enAzGece = Math.max(1, Math.round(Number(p.minNights) || 1));
  const enFazlaGece = Math.max(enAzGece, Math.round(Number(p.maxNights) || 14));
  let gece = Math.round(Number(sec.nights) || enAzGece);
  gece = Math.min(Math.max(gece, enAzGece), enFazlaGece);

  const enFazlaOda = Math.max(1, Math.round(Number(p.maxRooms) || 3));
  const odaKapasite = Math.max(1, Math.round(Number(oda && oda.maxGuests) || 2));
  const enFazlaKisi = Math.min(
    Math.max(1, Math.round(Number(p.maxGuests) || 8)),
    enFazlaOda * odaKapasite
  );

  let yetiskin = Math.max(1, Math.floor(Number(sec.adults) || 1));
  yetiskin = Math.min(yetiskin, enFazlaKisi);
  let cocuk = Math.max(0, Math.floor(Number(sec.children) || 0));
  cocuk = Math.min(cocuk, enFazlaKisi - yetiskin);

  const kisi = yetiskin + cocuk;
  const gerekenOda = Math.ceil(kisi / odaKapasite);
  let odaSayisi = Math.max(1, Math.floor(Number(sec.rooms) || 1));
  odaSayisi = Math.min(Math.max(odaSayisi, gerekenOda), enFazlaOda);

  return {
    checkIn: oToISODate(sec.checkIn) || '',
    nights: gece,
    rooms: odaSayisi,
    adults: yetiskin,
    children: cocuk,
    guests: kisi,
    room: oda,
    board: pansiyon,
    roomCapacity: odaKapasite,
    maxGuests: enFazlaKisi,
    maxRooms: enFazlaOda
  };
}

/* ---------------- ek hizmetler ----------------
   Üç çarpan var ve üçü BİLEREK farklı:
     stay   bir kez (havalimanı transferi)
     night  gece başına (otopark)
     guest  kişi başına, konaklamanın tamamı için (teras akşam yemeği)
   Turdaki addonLines ile aynı işi yapmıyor: orada gece kavramı yok. */
function hotelAddonLines(hotel, secim, plan) {
  const secili = (secim && Array.isArray(secim.addons)) ? secim.addons : [];
  const konaklama = plan || clampStay(hotel, secim);
  return ((hotel && hotel.addons) || [])
    .filter(a => secili.indexOf(a.id) !== -1)
    .map(a => {
      const birim = Number(a.price) || 0;
      const carpan = a.per === 'night' ? konaklama.nights
        : (a.per === 'guest' ? konaklama.guests : 1);
      const ek = a.per === 'night' ? konaklama.nights + ' gece'
        : (a.per === 'guest' ? konaklama.guests + ' kişi' : 'rezervasyon');
      return {
        id: a.id,
        label: a.label + ' × ' + ek,
        amount: birim * carpan,
        kind: 'addon'
      };
    });
}

/* ---------------- tutar ----------------
   Kurallar ve her birinin ayrı testi var:

   oda        gecelik oda fiyatı × oda sayısı × gece
   pansiyon   kişi başı gecelik fark × kişi × gece (çocuk tarifesi ayrı)
   ek hizmet  yukarıdaki üç çarpandan biri
   vergi      konaklama vergisi; matrah oda + pansiyon, ek hizmetler HARİÇ

   Verginin ayrı satır olması bilinçli: Türkiye'de konaklama vergisi fatura
   üzerinde ayrı gösterilir, fiyatın içine gizlenmez. Ek hizmetler matraha
   girmiyor çünkü transfer ve otopark tesis dışı/yan hizmet olarak
   fiyatlanıyor; kural değişirse tek yer değişir (taxBase). */
function calcHotelTotal(hotel, secim) {
  const p = (hotel && hotel.pricing) || {};
  const plan = clampStay(hotel, secim);
  const oda = plan.room || {};
  const pansiyon = plan.board || {};

  const gecelik = Number(oda.nightly) || 0;
  const gecelikListe = Number(oda.nightlyList) || gecelik;
  const odaToplam = gecelik * plan.rooms * plan.nights;
  const odaListeToplam = gecelikListe * plan.rooms * plan.nights;

  const yetiskinPansiyon = (Number(pansiyon.adultNight) || 0) * plan.adults * plan.nights;
  const cocukPansiyon = (Number(pansiyon.childNight) || 0) * plan.children * plan.nights;
  const pansiyonToplam = yetiskinPansiyon + cocukPansiyon;

  const araToplam = odaToplam + pansiyonToplam;
  const vergi = Math.round(araToplam * (Number(p.taxRate) || 0));

  const ekler = hotelAddonLines(hotel, secim, plan);
  const eklerToplam = ekler.reduce((toplam, a) => toplam + a.amount, 0);

  const satirlar = [];
  satirlar.push({
    label: oda.name + ' × ' + plan.rooms + ' oda × ' + plan.nights + ' gece',
    amount: odaToplam,
    kind: 'base'
  });
  if (pansiyonToplam > 0) {
    satirlar.push({
      label: pansiyon.label + ' × ' + plan.guests + ' kişi × ' + plan.nights + ' gece',
      amount: pansiyonToplam,
      kind: 'base'
    });
  } else {
    satirlar.push({ label: pansiyon.label, amount: 0, kind: 'free' });
  }
  ekler.forEach(a => satirlar.push(a));
  if (vergi > 0) {
    satirlar.push({
      label: 'Konaklama vergisi (%' + Math.round((Number(p.taxRate) || 0) * 100) + ')',
      amount: vergi,
      kind: 'fee'
    });
  }

  return {
    checkIn: plan.checkIn,
    checkOut: hotelCheckout(plan.checkIn, plan.nights),
    nights: plan.nights,
    rooms: plan.rooms,
    adults: plan.adults,
    children: plan.children,
    guests: plan.guests,
    room: plan.room,
    board: plan.board,
    roomTotal: odaToplam,
    boardTotal: pansiyonToplam,
    subtotal: araToplam,
    listSubtotal: odaListeToplam + pansiyonToplam,
    saving: Math.max(0, odaListeToplam - odaToplam),
    addons: ekler,
    addonsTotal: eklerToplam,
    tax: vergi,
    lines: satirlar,
    total: araToplam + eklerToplam + vergi
  };
}

/* Kartlarda ve rezervasyon kartının tepesinde görünen "…TL'den başlayan"
   fiyat: en ucuz odanın gecelik ücreti. Anasayfadaki otel kartının fiyatı
   da bu olmak zorunda; tests/hotel.test.js ikisini karşılaştırır. */
function hotelNightlyFrom(hotel) {
  const liste = (hotel && hotel.rooms) || [];
  if (!liste.length) return 0;
  return liste.reduce((enAz, o) => Math.min(enAz, Number(o.nightly) || 0),
    Number(liste[0].nightly) || 0);
}

function hotelNightlyListFrom(hotel) {
  const liste = (hotel && hotel.rooms) || [];
  if (!liste.length) return 0;
  const ucuz = liste.reduce((secili, o) =>
    (Number(o.nightly) || 0) < (Number(secili.nightly) || 0) ? o : secili, liste[0]);
  return Number(ucuz.nightlyList) || Number(ucuz.nightly) || 0;
}

/* ---------------- puan ----------------
   Otelde alışılmış gösterim 10 üzerinden ("8,9"), turda 5 üzerinden.
   Yorumlar iki sayfada da 5 yıldız veriyor; 10'luk skor o dağılımdan
   TÜRETİLİYOR, veride ikinci bir sayı tutulmuyor — iki sayı tutulsaydı
   biri güncellenip diğeri unutulurdu. */
function hotelScore(breakdown) {
  const satirlar = [5, 4, 3, 2, 1].map(star => ({
    star: star,
    count: Math.max(0, Math.round(Number(breakdown && breakdown[star]) || 0))
  }));
  const toplam = satirlar.reduce((t, r) => t + r.count, 0);
  if (!toplam) return 0;
  const agirlikli = satirlar.reduce((t, r) => t + r.star * r.count, 0);
  return Math.round((agirlikli / toplam) * 2 * 10) / 10;
}

/* Virgüllü gösterim: "8,9". Skoru basan üç yer (başlık, yorum bölümü,
   benzer oteller) aynı biçimi kullansın diye burada. */
function hotelScoreText(breakdown) {
  return String(hotelScore(breakdown)).replace('.', ',');
}

/* Kalan oda sayısı tarihten VE oda tipinden türetilir: aynı tarihte her
   oda tipi farklı, ama aynı oda aynı tarihte her yenilemede aynı sayıyı
   verir. Rastgele sayı kullanılsaydı "son 2 oda" uyarısı her yenilemede
   zıplar ve inandırıcılığını kaybederdi. */
function roomsLeft(iso, roomId, total) {
  return oSeatsLeft(String(iso || '') + '|' + String(roomId || ''), total);
}

/* /mola360/otel/kordon-butik-otel/ -> "kordon-butik-otel" */
function hotelSlugFromPath(pathname) {
  const m = String(pathname || '').match(/\/otel\/([^/?#]+)/);
  if (!m) return '';
  const parca = m[1];
  /* /otel/index.html gibi bir adres otel slug'ı değildir. */
  if (/\.html?$/i.test(parca)) return '';
  try {
    return decodeURIComponent(parca).trim().toLowerCase();
  } catch (_) {
    return '';
  }
}

/* ---------------- oteller ----------------
   Tek kayıt tek otel. Sayfadaki her başlık, her madde ve her fiyat bu
   nesneden gelir; hotel-page.js içinde sabit metin yok.

   NOT: buradaki otel kurgusaldır (gerçek envanter bağlanana kadar örnek
   içerik). Bu yüzden sayfada Hotel/Offer/AggregateRating yapısal verisi
   YOK — gerekçesi docs/otel-sayfasi.md ve docs/seo-arastirma.md (madde 2)
   içinde: uydurma fiyatı ve puanı işaretlemek yanıltıcı yapısal veridir. */
const HOTELS = {
  'kordon-butik-otel': {
    slug: 'kordon-butik-otel',
    type: 'hotel',
    title: 'Kordon Butik Otel',
    tagline: 'Alsancak’ta, Kordon’a iki sokak: 28 odalı butik şehir oteli',
    category: 'Şehir Oteli',
    /* Dar yerlerde (mobil başlık alt satırı, kategori rozeti) uzun ad
       sığmıyor; kısa biçim ayrı tutuluyor. */
    categoryShort: 'Şehir Oteli',
    categoryPlural: 'Oteller',
    categoryAnchor: 'oteller',
    stars: 4,
    area: 'Alsancak, İzmir',
    region: 'Ege',
    code: 'MLA-OTL-01',
    /* Başlık satırında ve künyede geçen kısa konum cümlesi. */
    distanceLabel: 'Kordon’a 120 m',

    badges: [
      { icon: 'bolt',    label: 'Anında onay' },
      { icon: 'refresh', label: '72 saate kadar ücretsiz iptal' },
      { icon: 'food',    label: 'Kahvaltı dahil' },
      { icon: 'shield',  label: 'Güvenli ödeme' }
    ],

    /* Üst şerit: otelin künyesi. Altı kutu, mobilde ikili ızgara. */
    facts: [
      { icon: 'clock',    label: 'Giriş / Çıkış', value: '14:00 / 12:00',      note: 'Erken giriş müsaitliğe bağlı' },
      { icon: 'home',     label: 'Tesis',         value: '28 oda · 5 kat',     note: '2019’da yenilendi' },
      { icon: 'food',     label: 'Kahvaltı',      value: 'Açık büfe, dahil',   note: 'Teras katta 07:30 – 10:30' },
      { icon: 'mapPin',   label: 'Konum',         value: 'Kordon’a 120 m',     note: 'Sahile 2 dakika yürüyüş' },
      { icon: 'bus',      label: 'Ulaşım',        value: 'Havalimanı 19 km',   note: 'Tramvay durağı 300 m' },
      { icon: 'globe',    label: 'İnternet',      value: 'Ücretsiz fiber',     note: 'Odalarda ve ortak alanlarda' }
    ],

    gallery: [
      { key: 'kordonBoyu',   caption: 'Otelin sokağının ucundaki Kordon boyu' },
      { key: 'otelOda',      caption: 'Kordon Standart Oda' },
      { key: 'otelTeras',    caption: 'Teras kat — kahvaltı ve akşam servisi' },
      { key: 'otelKahvalti', caption: 'Açık büfe kahvaltı' },
      { key: 'otelLobi',     caption: 'Lobi ve 7/24 resepsiyon' },
      { key: 'otelSuit',     caption: 'Çatı Katı Suit' },
      { key: 'izmirKonak',   caption: 'Konak Meydanı — otele 2,1 km' }
    ],

    highlights: [
      'Kordon sahiline 120 metre; Alsancak’ın kafe ve meyhane sokakları otelin çevresinde',
      'Teras katta körfez manzaralı açık büfe kahvaltı — fiyata dahil',
      '28 odanın tamamı sigarasız, blackout perdeli ve sessiz iç avluya veya denize bakıyor',
      'Alsancak Tren İstasyonu 450 m, tramvay durağı 300 m, havalimanı 19 km',
      'Vale ile kapalı otopark ve 7/24 resepsiyon',
      '72 saat öncesine kadar ücretsiz iptal, anında onay'
    ],

    /* Üç paragraf, her biri kendi başına anlaşılan bir pasaj:
       docs/seo-arastirma.md madde 2'deki 130-170 kelimelik yapı. */
    description: [
      'Kordon Butik Otel, Alsancak’ın Atatürk Caddesi’ne paralel sakin sokaklarından birinde, deniz kıyısındaki Kordon yürüyüş yoluna 120 metre mesafede duruyor. 1950’lerden kalma bir apartman 2019’da baştan yenilenerek 28 odalı bir şehir oteline çevrildi; cephe ve merdiven boşluğu korundu, odalar tümüyle yeniden kuruldu. Otel küçük olduğu için resepsiyon misafiri adıyla tanıyor, bu da onu zincir otellerden ayıran asıl şey.',
      'Odalar üç tipe ayrılıyor. Kordon Standart Oda iç avluya bakıyor ve caddenin sesini almıyor; Deniz Manzaralı Oda körfeze bakan cephede, akşamüstü gün batımını odadan görüyorsunuz. Çatı Katı Suit’in kendi terası var. Hepsinde klima, minibar, kasa, çay-kahve seti ve blackout perde standart. Aile Odası dört kişiye kadar tek odada konaklamaya uygun; ilave yatak talebi rezervasyon notuna yazılıyor.',
      'Kahvaltı teras katta, körfez manzaralı salonda veriliyor ve fiyata dahil: peynir tabağı, köy yumurtası, günlük ekmek ve mevsim meyveleri. Akşamları aynı teras sınırlı sayıda masayla set menü servisine geçiyor; yarım pansiyon seçeneği rezervasyon kartından eklenebiliyor. Otelin restoranı dışında yürüme mesafesinde onlarca seçenek var — Kıbrıs Şehitleri Caddesi 300 metre ötede.'
    ],

    /* Oda tipleri: hem "Odalar" bölümünü hem rezervasyon kartındaki
       seçimi besler. nightly = gecelik oda fiyatı (kişi başı DEĞİL). */
    rooms: [
      {
        id: 'standart',
        name: 'Kordon Standart Oda',
        key: 'otelOda',
        size: '24 m²',
        view: 'İç avlu manzarası',
        maxGuests: 2,
        beds: '1 çift kişilik yatak',
        nightly: 1950,
        nightlyList: 2450,
        count: 12,
        features: ['Blackout perde', 'Klima', 'Minibar ve kasa', 'Çay-kahve seti', 'Duşakabinli banyo'],
        note: 'Sessiz iç avluya bakar; caddenin gece sesini almaz.'
      },
      {
        id: 'deniz',
        name: 'Deniz Manzaralı Oda',
        key: 'otelTeras',
        size: '28 m²',
        view: 'Körfez manzarası',
        maxGuests: 2,
        beds: '1 çift kişilik veya 2 tek kişilik yatak',
        nightly: 2450,
        nightlyList: 2950,
        count: 8,
        features: ['Körfez manzarası', 'Fransız balkon', 'Klima', 'Minibar ve kasa', 'Küvetli banyo'],
        note: 'Cephe odalarıdır; gün batımı odadan görünür.'
      },
      {
        id: 'aile',
        name: 'Aile Odası',
        key: 'otelLobi',
        size: '34 m²',
        view: 'İç avlu manzarası',
        maxGuests: 4,
        beds: '1 çift kişilik + 2 tek kişilik yatak',
        nightly: 3150,
        nightlyList: 3600,
        count: 5,
        features: ['Dört kişiye kadar', 'Bölmeli yatak alanı', 'Klima', 'Mini mutfak köşesi', 'Küvetli banyo'],
        note: 'İki çocuklu aileler için tek odada çözüm; ilave yatak gerekmez.'
      },
      {
        id: 'suit',
        name: 'Çatı Katı Suit',
        key: 'otelSuit',
        size: '42 m²',
        view: 'Körfez manzaralı özel teras',
        maxGuests: 3,
        beds: '1 çift kişilik yatak + çekyat',
        nightly: 3450,
        nightlyList: 3950,
        count: 3,
        features: ['Özel teras', 'Oturma alanı', 'Espresso makinesi', 'Küvetli banyo', 'Geç çıkış önceliği'],
        note: 'Tek katta üç suit var; terası otelin en sessiz köşesi.'
      }
    ],

    /* Pansiyon: kişi başı GECELİK fark. Kahvaltı dahil olduğu için temel
       seçeneğin farkı sıfır — "dahil" bilgisini ayrı bir metin olarak
       yazmak yerine fiyatın kendisi söylüyor. */
    boards: [
      { id: 'bb', label: 'Oda + kahvaltı', adultNight: 0, childNight: 0,
        note: 'Teras katta açık büfe kahvaltı, fiyata dahil' },
      { id: 'hb', label: 'Yarım pansiyon', adultNight: 450, childNight: 250,
        note: 'Akşam teras restoranda üç kap set menü; içecekler ayrı' }
    ],

    /* Olanaklar gruplu: tek uzun liste yerine misafirin aradığı başlık
       altında. Her grubun ikonu TOUR_ICONS içinde tanımlı olmak zorunda;
       tests/hotel.test.js doğruluyor. */
    amenities: [
      { icon: 'home', title: 'Odada',
        items: ['Klima', 'Minibar', 'Kasa', 'Çay ve kahve seti', 'Blackout perde',
                'Ücretsiz fiber wifi', 'Saç kurutma makinesi', 'Sigarasız oda'] },
      { icon: 'sparkle', title: 'Tesiste',
        items: ['7/24 resepsiyon', 'Teras kahvaltı salonu', 'Asansör', 'Bagaj odası',
                'Çamaşır ve ütü servisi', 'Toplantı odası (12 kişi)'] },
      { icon: 'food', title: 'Yeme – içme',
        items: ['Açık büfe kahvaltı 07:30 – 10:30', 'Teras set menü 19:00 – 22:00',
                'Oda servisi 23:00’e kadar', 'Glutensiz ve vejetaryen seçenek'] },
      { icon: 'bus', title: 'Ulaşım ve otopark',
        items: ['Vale ile kapalı otopark (ücretli)', 'Havalimanı transferi (ücretli)',
                'Tramvay durağı 300 m', 'Bisiklet kiralama anlaşması'] },
      { icon: 'users', title: 'Erişilebilirlik ve aile',
        items: ['Tekerlekli sandalye erişimli giriş', 'Engelli misafir odası (1 adet)',
                'Bebek karyolası (ücretsiz, talep üzerine)', 'Çocuk sandalyesi'] }
    ],

    location: {
      title: 'Alsancak — Atatürk Caddesi arka sokağı',
      address: 'Mimar Sinan Mahallesi, 1453 Sokak No: 12, Alsancak / Konak, İzmir',
      note: 'Otelin kendi girişi sokakta; araçla gelen misafir kapıda bırakabilir, vale otoparka çeker. Sokak trafiğe açık ama akşam 20:00’den sonra sakin.',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Alsancak%20Kordon%20%C4%B0zmir',
      nearby: [
        { name: 'Kordon yürüyüş yolu ve sahil', distance: '120 m', detail: '2 dakika yürüyüş' },
        { name: 'Kıbrıs Şehitleri Caddesi', distance: '300 m', detail: 'Kafe ve mağazalar' },
        { name: 'Alsancak Tren İstasyonu', distance: '450 m', detail: 'İZBAN ve tramvay' },
        { name: 'Konak Meydanı ve Saat Kulesi', distance: '2,1 km', detail: 'Tramvayla 8 dakika' },
        { name: 'Kemeraltı Çarşısı', distance: '2,4 km', detail: 'Yürüyerek 28 dakika' },
        { name: 'İzmir Arkeoloji Müzesi', distance: '3,2 km', detail: 'Konak üzerinden' },
        { name: 'Adnan Menderes Havalimanı', distance: '19 km', detail: 'Araçla 25 – 35 dakika' },
        { name: 'Efes Antik Kenti', distance: '79 km', detail: 'Günübirlik tur kalkışı otele 900 m' }
      ],
      transport: [
        { icon: 'bus',      text: 'Havalimanından İZBAN ile Alsancak: 45 dakika, aktarmasız.' },
        { icon: 'mapPin',   text: 'Tramvay Alsancak durağı 300 m; Konak ve Fahrettin Altay yönüne doğrudan.' },
        { icon: 'wallet',   text: 'Vale otopark gecelik 250 TL; sokakta ücretli park saat 08:00 – 20:00 arası.' }
      ]
    },

    /* Otel kuralları: misafirin "acaba olur mu" diye sorduğu her şey.
       Cevabın "hayır" olduğu yerler de yazılı — sayfada görünmeyen kural
       resepsiyonda sürpriz oluyor. */
    policies: [
      { icon: 'clock',    title: 'Giriş ve çıkış',
        text: 'Giriş 14:00’ten, çıkış 12:00’a kadar. Erken giriş ve geç çıkış müsaitliğe bağlıdır; geç çıkış 18:00’e kadar ek hizmet olarak alınabilir. Bagajınız giriş saatinden önce ve çıkıştan sonra ücretsiz saklanır.' },
      { icon: 'users',    title: 'Çocuklar ve ilave yatak',
        text: '0 – 6 yaş çocuklar ailesiyle aynı odada ücretsiz konaklar, bebek karyolası talep üzerine ücretsizdir. 7 – 12 yaş için pansiyon farkı çocuk tarifesinden alınır. Aile Odası dışındaki odalara ilave yatak konmaz.' },
      { icon: 'heart',    title: 'Evcil hayvan',
        text: '10 kilogramın altındaki evcil hayvanlar kabul edilir; gecelik 200 TL temizlik bedeli vardır. Kahvaltı salonu ve teras restoranda evcil hayvan bulunamaz, rehber köpekler bu kuralın dışındadır.' },
      { icon: 'info',     title: 'Sessizlik ve sigara',
        text: 'Tüm odalar ve ortak alanlar sigarasızdır; sigara yalnızca teras katın açık bölümünde içilebilir. 23:00 – 08:00 arası sessizlik saatleridir.' },
      { icon: 'wallet',   title: 'Ödeme',
        text: 'Kredi kartı ve havale kabul edilir; girişte kart üzerinden 1.000 TL tutarında bloke alınır ve çıkışta çözülür. Konaklama vergisi rezervasyon özetinde ayrı satır olarak görünür.' },
      { icon: 'shield',   title: 'Güvenlik',
        text: 'Giriş ve ortak alanlar 7/24 kameralıdır, kat koridorları kartlı geçişle çalışır. Odalarda dijital kasa bulunur.' }
    ],

    cancellation: {
      tiers: [
        { minHours: 72, rate: 1,   label: '72 saat ve öncesi', text: 'Ücretin tamamı iade edilir.' },
        { minHours: 24, rate: 0.5, label: '24 – 72 saat arası', text: 'İlk gece bedeli kesilir, kalanı iade edilir.' },
        { minHours: 0,  rate: 0,   label: 'Son 24 saat',        text: 'İade yapılmaz; tarih değişikliği için resepsiyonu arayın.' }
      ],
      note: 'Otel kaynaklı bir sebeple (aşırı rezervasyon, tesis arızası) konaklama sağlanamazsa ücretin tamamı iade edilir ve aynı sınıfta bir otelde konaklamanız sağlanır.',
      /* Örnek iade tutarı en ucuz odanın bir gecesi üzerinden gösterilir. */
      exampleTotal: 1950
    },

    pricing: {
      unitNote: 'gecelik, oda başı',
      /* Konaklama vergisi ayrı satır: fatura üzerinde de böyle görünür. */
      taxRate: 0.02,
      minNights: 1,
      maxNights: 14,
      maxRooms: 3,
      maxGuests: 8,
      /* Aynı gün giriş satılmıyor; en erken yarın. */
      leadDays: 1,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      dateNote: 'Her gün giriş yapılabilir'
    },

    addons: [
      { id: 'transfer', per: 'stay',  price: 850, label: 'Havalimanı transferi',
        text: 'Adnan Menderes Havalimanı – otel, tek yön, özel araç' },
      { id: 'otopark',  per: 'night', price: 250, label: 'Vale ile kapalı otopark',
        text: 'Otelin 150 m yanındaki kapalı otoparkta' },
      { id: 'terasMenu', per: 'guest', price: 780, label: 'Teras akşam yemeği (bir kez)',
        text: 'Körfez manzaralı terasta üç kap set menü' }
    ],

    trust: [
      { icon: 'bolt',    text: 'Anında onay — rezervasyon hemen kesinleşir' },
      { icon: 'refresh', text: '72 saat öncesine kadar ücretsiz iptal' },
      { icon: 'shield',  text: 'Güvenli ödeme, 3D Secure' }
    ],

    /* Kıtlık ve sosyal kanıt: rakamlar veriden gelir, arayüzde üretilmez. */
    social: { viewedLast24h: 52, bookedThisWeek: 23 },

    /* 10'luk skor bu dağılımdan türetilir (hotelScore): 8,9.
       Anasayfadaki otel kartının puanı da aynı sayı olmak zorunda;
       tests/hotel.test.js ikisini karşılaştırır. */
    ratingBreakdown: { 5: 128, 4: 64, 3: 13, 2: 5, 1: 4 },

    ratingAspects: [
      { label: 'Konum',          value: 4.9 },
      { label: 'Temizlik',       value: 4.7 },
      { label: 'Personel',       value: 4.8 },
      { label: 'Kahvaltı',       value: 4.6 },
      { label: 'Fiyat / performans', value: 4.3 }
    ],

    reviews: [
      { name: 'Seda Yalçın', date: '2026-09-11', rating: 5, party: 'Çift olarak',
        title: 'Kordon’a çıkıp sahilde kahvaltı sonrası yürüyüş',
        text: 'Konum tarif edildiği gibi: sokağın ucundan çıkınca deniz. Teras kahvaltı küçük ama her şey taze, peynirler yerel. Oda sessizdi, avluya bakan tarafı bilerek istedik. Alsancak’ta hafta sonu gürültü olur diye çekiniyorduk, hiç duymadık.' },
      { name: 'Onur Bayraktar', date: '2026-09-04', rating: 5, party: 'İş seyahati',
        title: 'İki gecelik iş için ideal',
        text: 'Havalimanı transferini otelden aldım, şoför uçuş saatine göre bekledi. Odada masa var ve wifi gerçekten hızlı — video görüşmesi sorunsuz. Resepsiyon sabah 6’da kahve hazırladı. Tek eksik: otopark ayrı ücretli, fiyata dahil sanmıştım.' },
      { name: 'Merve Aksoy', date: '2026-08-27', rating: 4, party: 'Ailece',
        title: 'Aile odası dört kişiye yetiyor ama banyo tek',
        text: 'İki çocukla kaldık, aile odası beklediğimizden genişti, bölmeli yatak alanı işe yaradı. Sabah kahvaltıda çocuk sandalyesi hazır geldi. Tek zorluk banyonun tek olması, sabah sıraya girdik. Havuz yok, bunu bilerek gidin.' },
      { name: 'Kaan Erdoğan', date: '2026-08-18', rating: 5, party: 'Tek başına',
        title: 'Suit’in terası beklentinin üstünde',
        text: 'Çatı katı suitte üç gece kaldım. Teras gerçekten özel, akşam gün batımını orada seyrettim. Espresso makinesi küçük bir detay ama fark yaratıyor. Personel adımı ikinci gün ezbere biliyordu, zincir otelde böyle olmuyor.' },
      { name: 'Pelin Şimşek', date: '2026-08-09', rating: 4, party: 'Çift olarak',
        title: 'Deniz manzaralı oda değerdi, asansör dar',
        text: 'Cephe odası aldık, manzara fotoğraftakiyle aynı. Bina eski bir apartmandan dönüştürülmüş, asansör iki kişi ve bavul alıyor ancak. Yenileme işçiliği iyi, banyo yepyeni. Kahvaltı 10:30’da bitiyor, geç kalkan için erken olabilir.' },
      { name: 'Emre Doğan', date: '2026-07-30', rating: 5, party: 'Çift olarak',
        title: 'Geç check-in sorun olmadı',
        text: 'Uçağımız gecikti, 01:30’da vardık. Resepsiyon açıktı, oda hazırdı, kimse yüzünü ekşitmedi. Ertesi sabah kahvaltıyı kaçırmayalım diye uyandırma servisi önerdiler. Konum Alsancak’ta gezmek için tam merkezde.' },
      { name: 'Buse Tekin', date: '2026-07-21', rating: 3, party: 'Arkadaş grubu',
        title: 'Oda güzel ama sokakta park sorunu',
        text: 'Otelin kendisiyle ilgili şikâyetim yok; oda temiz, kahvaltı iyi. Ama kendi arabamızla gittik ve vale otopark gecelik 250 TL, sokakta yer bulmak imkânsız. Üç gecede beklemediğimiz bir masraf çıktı. Rezervasyonda daha görünür yazılabilir.' },
      { name: 'Hakan Uysal', date: '2026-07-12', rating: 5, party: 'Ailece',
        title: 'İptal kuralı dediği gibi işledi',
        text: 'Tarihi bir hafta önce değiştirmek zorunda kaldık, 72 saatten önce olduğu için ücret kesilmedi. Yeni tarihte aynı odayı verdiler. Otelde kalırken de her şey yazıldığı gibiydi: kahvaltı saati, giriş saati, otopark.' }
    ],

    faq: [
      { q: 'Kahvaltı fiyata dahil mi?',
        a: 'Evet. Teras kattaki açık büfe kahvaltı her oda tipinde fiyata dahildir ve 07:30 – 10:30 arasında verilir. Akşam yemeği dahil değildir; yarım pansiyon seçeneğini rezervasyon kartından ekleyerek kişi başı gecelik farkla alabilirsiniz.' },
      { q: 'Otelin otoparkı var mı?',
        a: 'Otelin kendi otoparkı yok; 150 metre ötedeki kapalı otoparkla anlaşma var ve araç vale ile çekiliyor. Gecelik 250 TL’dir ve rezervasyon kartından ek hizmet olarak eklenebilir. Sokakta 08:00 – 20:00 arası ücretli park uygulanıyor.' },
      { q: 'Havalimanından otele nasıl gelinir?',
        a: 'Adnan Menderes Havalimanı 19 kilometre uzakta; araçla 25 – 35 dakika sürer. İZBAN ile Alsancak istasyonuna aktarmasız 45 dakikada gelinir, istasyon otele 450 metre. Özel araç transferi ek hizmet olarak tek yön 850 TL’dir.' },
      { q: 'Çocuklar için ücret alınıyor mu?',
        a: '0 – 6 yaş çocuklar ailesiyle aynı odada ücretsiz konaklar, bebek karyolası talep üzerine ücretsizdir. 7 – 12 yaş için yalnızca pansiyon farkı çocuk tarifesinden alınır. Dört kişilik konaklama için Aile Odası’nı seçmeniz gerekir; diğer odalara ilave yatak konmuyor.' },
      { q: 'Odalar denize mi bakıyor?',
        a: 'Deniz Manzaralı Oda ve Çatı Katı Suit körfeze bakan cephededir. Kordon Standart Oda ve Aile Odası iç avluya bakar; manzarası yoktur ama caddenin gece sesini almadığı için daha sessizdir. Oda tipi rezervasyon sırasında seçilir, dağıtımla belirlenmez.' },
      { q: 'Rezervasyonu ücretsiz iptal edebilir miyim?',
        a: 'Giriş tarihine 72 saatten fazla varsa iptal ücretsizdir ve ödediğiniz tutarın tamamı iade edilir. 24 – 72 saat arasında ilk gece bedeli kesilir. Son 24 saatte iade yapılmaz; tarih değişikliği için resepsiyonu aramanız gerekir.' }
    ],

    /* slug taşıyan kayıt gerçek bir içerik sayfasına gider; taşımayan
       kayıt anasayfaya. Yeni otel sayfası yazıldıkça slug eklenir. */
    similar: [
      { key: 'kemerMarina',  title: 'Sealight Resort',    meta: 'Kemer, Antalya · Her şey dahil', score: '9,2', price: 2100 },
      { key: 'termalYalova', title: 'Termal Vadi Resort', meta: 'Termal, Yalova · Termal havuz',  score: '8,7', price: 1590 },
      { key: 'goreme',       title: 'Göreme Mağara Otel', meta: 'Göreme, Nevşehir · Butik',       score: '9,4', price: 2450 },
      { key: 'kemeralti',    title: 'Kemeraltı Konak Otel', meta: 'Konak, İzmir · Tarihi konak',  score: '8,5', price: 1450 }
    ],

    /* Sayfa etiketleri: sayfanın en altındaki çip bulutu.
       HEPSİ gerçek bir hedefe gidiyor — ya anasayfadaki şerit çapasına,
       ya bu sayfanın bir bölümüne, ya da yazılmış bir tur sayfasına.
       Hedefi olmayan anahtar kelime çipi eklenmez: docs/seo-arastirma.md
       madde 4. href kök-göreli yazılır, '#' ile başlayanlar olduğu gibi
       kalır. */
    tags: [
      { label: 'Oteller',            href: 'index.html#oteller' },
      { label: 'Günübirlik turlar',  href: 'index.html#turlar' },
      { label: 'Konaklamalı turlar', href: 'index.html#konaklamali-turlar' },
      { label: 'Aktiviteler',        href: 'index.html#aktiviteler' },
      { label: 'Oda tipleri',        href: '#odalar' },
      { label: 'Otel olanakları',    href: '#olanaklar' },
      { label: 'Konum ve ulaşım',    href: '#konum' },
      { label: 'Otel kuralları',     href: '#politikalar' },
      { label: 'Misafir yorumları',  href: '#yorumlar' },
      { label: 'Efes ve Şirince turu', href: 'tur/efes-sirince/' }
    ]
  }
};

const DEFAULT_HOTEL_SLUG = 'kordon-butik-otel';

function resolveHotel(slug) {
  const anahtar = String(slug || '').trim().toLowerCase();
  if (anahtar && Object.prototype.hasOwnProperty.call(HOTELS, anahtar)) return HOTELS[anahtar];
  return HOTELS[DEFAULT_HOTEL_SLUG] || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HOTEL_IMAGE_FILES,
    HOTELS,
    DEFAULT_HOTEL_SLUG,
    hotelImage,
    hotelCheckout,
    nightsBetween,
    hotelRoom,
    hotelBoard,
    clampStay,
    hotelAddonLines,
    calcHotelTotal,
    hotelNightlyFrom,
    hotelNightlyListFrom,
    hotelScore,
    hotelScoreText,
    roomsLeft,
    hotelSlugFromPath,
    resolveHotel
  };
}
