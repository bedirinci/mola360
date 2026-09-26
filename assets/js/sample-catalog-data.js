/* ---------------- örnek ürünler (henüz sayfası olmayanlar) ----------------
   Anasayfadaki kartların çoğu elle yazılmıştı: başlık, fiyat, puan ve
   tarih kartın içinde duruyordu ve hiçbir kayda bağlı değildi. "Bu Cuma"
   yazan bir kart her hafta "Bu Cuma" diyordu; aynı ürün iki şeritte iki
   farklı adla, iki farklı fiyatla görünebiliyordu.

   Bu dosya o kartların KAYIT hâli. Her biri gerçek bir ürün kaydının
   özeti: aynı alan adları, aynı sınıflandırma, aynı fiyat fonksiyonları.
   Kart artık buradan TÜRETİLİYOR (catalog.js); fiyat, puan ve tarih
   kartta yazılmıyor.

   sample: true → "örnek özet kayıt, detay sayfası henüz yok". Kartı
   tıklanamıyor (içerik sayfası olmadan bağ vermek ölü bağ olurdu). Yönetim
   paneli ve backend geldiğinde bu kayıtların yerini gerçek ürünler alacak;
   ekranlar değişmeyecek, çünkü hepsi veri kapısından (MolaVeri) okuyor.

   Kayıtlar kurgusal örnek içeriktir. Aynı ürünün eski kartlarda birden
   fazla sürümü vardıysa hangisinin seçildiği tests/ornek-katalog.test.js
   içinde tek tek yazılı. */

/* Haftalık tekrar eden örnek etkinliğin temsilleri. Tarihler bugüne göre
   DEĞİL sabit bir sezon aralığında üretiliyor: bugüne göre üretilen veri
   testleri çalıştıkları güne bağımlı yapar. Sezon 2027 yazına kadar
   sürüyor; o zamana kadar gerçek etkinlikler backend'den gelecek. */
function ornekTemsiller(bas, son, gunler, saat, baslik, tur) {
  const out = [];
  const m1 = String(bas).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const m2 = String(son).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m1 || !m2) return out;
  const d = new Date(Number(m1[1]), Number(m1[2]) - 1, Number(m1[3]));
  const bitis = new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]));
  for (let i = 0; d <= bitis && i < 800; i++) {
    if (gunler.indexOf(d.getDay()) !== -1) {
      out.push({
        date: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'),
        time: saat, title: baslik, kind: tur || '', detail: ''
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const ORNEK_SEZON = ['2026-09-01', '2027-06-30'];

/* Tipler kayıt dosyalarıyla aynı düzende: tur kaydında `type` tur tipini
   (daily/stay) taşıyor, diğerlerinde içerik tipini. */
const SAMPLE_PRODUCTS = {
  tour: {
    'sapanca-masukiye': {
      slug: 'sapanca-masukiye', type: 'daily', sample: true,
      title: 'Sapanca ve Maşukiye Turu', area: 'Sapanca, Sakarya', durationLabel: 'Tam gün',
      card: { img: 'sapanca2', badges: ['Günübirlik'], meta1: 'İstanbul Çıkışlı · 07:30' },
      taxonomy: { categories: ['marmara-turlari'], themes: ['doga-yayla'], collections: ['ailece'],
        city: 'sakarya', facets: { transport: ['otobus'], departFrom: ['istanbul'] } },
      currency: 'TRY',
      pricing: { adult: 780, departureDays: [6], leadDays: 1, startTime: '07:30' },
      rating: { average: 4.6, count: 75 }
    },
    'alacati-pazar-turu': {
      slug: 'alacati-pazar-turu', type: 'daily', sample: true,
      title: 'Alaçatı Pazar Turu', area: 'Alaçatı, İzmir', durationLabel: 'Yarım gün',
      card: { img: 'market1', badges: ['Günübirlik'], meta1: 'İzmir Çıkışlı · 09:00' },
      taxonomy: { categories: ['ege-turlari'], themes: ['gastronomi'], collections: [],
        city: 'izmir', facets: { transport: ['minibus'], departFrom: ['izmir'] } },
      currency: 'TRY',
      pricing: { adult: 350, departureDays: [0], leadDays: 1, startTime: '09:00' },
      rating: { average: 4.4, count: 96 }
    },
    'iznik-golu-antik-kent': {
      slug: 'iznik-golu-antik-kent', type: 'daily', sample: true,
      title: 'İznik Gölü ve Antik Kent', area: 'İznik, Bursa', durationLabel: 'Tam gün',
      card: { img: 'iznik2', badges: ['Günübirlik'], meta1: 'Bursa Çıkışlı · Rehberli' },
      taxonomy: { categories: ['marmara-turlari'], themes: ['kultur-tarih', 'doga-yayla'], collections: [],
        city: 'bursa', facets: { transport: ['minibus'], departFrom: ['bursa'] } },
      currency: 'TRY',
      pricing: { adult: 450, departureDays: [0], leadDays: 1, startTime: '08:00' },
      rating: { average: 4.5, count: 70 }
    },
    'abant-golcuk': {
      slug: 'abant-golcuk', type: 'daily', sample: true,
      title: 'Abant ve Gölcük Turu', area: 'Abant, Bolu', durationLabel: 'Tam gün',
      card: { img: 'abant2', badges: ['Günübirlik'], meta1: 'Ankara Çıkışlı · Kahvaltı Dahil' },
      taxonomy: { categories: ['bati-karadeniz-turlari'], themes: ['doga-yayla'], collections: ['ailece'],
        city: 'bolu', facets: { transport: ['otobus'], departFrom: ['ankara'] } },
      currency: 'TRY',
      pricing: { adult: 620, departureDays: [0], leadDays: 1, startTime: '08:30' },
      rating: { average: 4.4, count: 155 }
    },
    'sile-agva': {
      slug: 'sile-agva', type: 'daily', sample: true,
      title: 'Şile ve Ağva Turu', area: 'Şile, İstanbul', durationLabel: 'Tam gün',
      card: { img: 'sile', badges: ['Günübirlik'], meta1: 'İstanbul Çıkışlı · Öğle Yemeği Dahil' },
      taxonomy: { categories: ['istanbul-turlari'], themes: ['deniz-tekne', 'doga-yayla'], collections: ['ailece'],
        city: 'istanbul', facets: { transport: ['otobus'], departFrom: ['istanbul'] } },
      currency: 'TRY',
      pricing: { adult: 690, departureDays: [6], leadDays: 1, startTime: '08:00' },
      rating: { average: 4.5, count: 190 }
    },
    'cunda-ayvalik': {
      slug: 'cunda-ayvalik', type: 'daily', sample: true,
      title: 'Cunda Adası ve Ayvalık', area: 'Ayvalık, Balıkesir', durationLabel: 'Tam gün',
      card: { img: 'cunda2', badges: ['Günübirlik'], meta1: 'İzmir Çıkışlı · Tekne Dahil', sponsored: true },
      taxonomy: { categories: ['ege-turlari'], themes: ['deniz-tekne'], collections: [],
        city: 'balikesir', facets: { transport: ['minibus'], departFrom: ['izmir'] } },
      currency: 'TRY',
      pricing: { adult: 890, departureDays: [0], leadDays: 1, startTime: '07:30' }
    },
    'pamukkale-hierapolis': {
      slug: 'pamukkale-hierapolis', type: 'daily', sample: true,
      title: 'Pamukkale ve Hierapolis Turu', area: 'Pamukkale, Denizli', durationLabel: '12 saat',
      card: { img: 'pamukkale', badges: ['Günübirlik'], meta1: 'İzmir Çıkışlı · 12 Saat' },
      taxonomy: { categories: ['ege-turlari'], themes: ['kultur-tarih'], collections: [],
        city: 'denizli', facets: { transport: ['minibus'], departFrom: ['izmir'] } },
      currency: 'TRY',
      pricing: { adult: 1890, departureDays: [3, 6], leadDays: 1, startTime: '07:00' },
      rating: { average: 4.7, count: null }
    },
    'assos-gun-batimi': {
      slug: 'assos-gun-batimi', type: 'daily', sample: true,
      title: 'Assos Gün Batımı Turu', area: 'Assos, Çanakkale', durationLabel: 'Tam gün',
      card: { img: 'assos', badges: ['Günübirlik'], meta1: 'Ayvalık Çıkışlı · Gün Batımı' },
      taxonomy: { categories: ['ege-turlari'], themes: ['kultur-tarih', 'deniz-tekne'], collections: ['romantik'],
        city: 'canakkale', facets: { transport: ['minibus'], departFrom: ['balikesir'] } },
      currency: 'TRY',
      pricing: { adult: 1150, departureDays: [6], leadDays: 1, startTime: '12:00' }
    },
    'erciyes-kayak-haftasi': {
      slug: 'erciyes-kayak-haftasi', type: 'stay', sample: true,
      title: 'Erciyes Kayak Haftası', area: 'Erciyes, Kayseri', durationLabel: '4 gece 5 gün',
      nights: 4, days: 5,
      card: { img: 'erciyes', badges: ['Kış Sporu'], meta1: 'Kayseri · 4 Gece 5 Gün' },
      taxonomy: { categories: ['kis-turlari'], themes: ['kis-sporlari'], collections: ['arkadas-grubu'],
        city: 'kayseri', facets: { transport: ['ucak'], departFrom: ['istanbul'] } },
      currency: 'TRY',
      pricing: { perPerson: 6400, departureDays: [0], leadDays: 7, startTime: '07:00' },
      rating: { average: 4.6, count: 140 }
    },
    'karadeniz-yaylalari': {
      slug: 'karadeniz-yaylalari', type: 'stay', sample: true,
      title: 'Karadeniz Yaylaları Turu', area: 'Ayder, Rize', durationLabel: '4 gece 5 gün',
      nights: 4, days: 5,
      card: { img: 'karadeniz2', badges: ['Doğa'], meta1: '4 Gece 5 Gün · Uçaklı, İstanbul Çıkışlı', sponsored: true },
      taxonomy: { categories: ['karadeniz-turlari'], themes: ['doga-yayla'], collections: ['ailece'],
        city: 'rize', facets: { transport: ['ucak'], departFrom: ['istanbul'] } },
      currency: 'TRY',
      pricing: { perPerson: 12500, departureDays: [0], leadDays: 7, startTime: '06:30' }
    },
    /* Yurt dışı: fiyat döviz (EUR). Eski kartta "6990 TL" yazıyordu;
       kullanıcı kararı yurt dışı turların döviz fiyatlı olması. */
    'ege-adalari-balayi': {
      slug: 'ege-adalari-balayi', type: 'stay', sample: true,
      title: 'Ege Adaları Balayı Kaçamağı', area: 'Sakız Adası, Yunanistan', durationLabel: '2 gece 3 gün',
      nights: 2, days: 3,
      card: { img: 'ege2', badges: ['Balayı'], meta1: '2 Gece 3 Gün · Feribotlu, İzmir Çıkışlı' },
      taxonomy: { categories: ['yunan-adalari-turlari'], themes: ['deniz-tekne'], collections: ['romantik'],
        city: 'sakiz-adasi', facets: { transport: ['feribot'], departFrom: ['izmir'] } },
      currency: 'EUR',
      pricing: { perPerson: 149, departureDays: [2], leadDays: 7, startTime: '08:00' },
      rating: { average: 4.9, count: 288 }
    },
    'dogu-ekspresi': {
      slug: 'dogu-ekspresi', type: 'stay', sample: true,
      title: 'Turistik Doğu Ekspresi Turu', area: 'Kars', durationLabel: '5 gece 6 gün',
      nights: 5, days: 6,
      card: { img: 'dogu2', badges: ['Doğu Ekspresi'], meta1: '5 Gece 6 Gün · Trenli, Ankara Çıkışlı' },
      taxonomy: { categories: ['dogu-anadolu-turlari'], themes: ['kultur-tarih', 'doga-yayla'], collections: ['tek-basina'],
        city: 'kars', facets: { transport: ['tren'], departFrom: ['ankara'] } },
      currency: 'TRY',
      pricing: { perPerson: 9750, departureDays: [2], leadDays: 14, startTime: '15:55' },
      rating: { average: 4.6, count: 450 }
    }
  },

  hotel: {
    'sealight-resort': {
      slug: 'sealight-resort', type: 'hotel', sample: true,
      title: 'Sealight Resort', area: 'Kemer, Antalya',
      card: { img: 'hotel4', badges: ['Her Şey Dahil'], meta1: 'Kemer, Antalya · Denize Sıfır' },
      taxonomy: { categories: ['resort-oteller'], themes: ['deniz-tekne'], collections: ['ailece'],
        city: 'antalya', facets: {} },
      currency: 'TRY',
      rooms: [{ id: 'standart', name: 'Standart Oda', nightly: 2100, count: 40 }],
      boards: [{ id: 'ai', label: 'Her şey dahil' }],
      pricing: { leadDays: 1 },
      /* Otelde puan 10 üzerinden (hotelScore ile aynı ölçek). */
      rating: { average: 9.2, count: 340 }
    },
    'termal-vadi-resort': {
      slug: 'termal-vadi-resort', type: 'hotel', sample: true,
      title: 'Termal Vadi Resort', area: 'Termal, Yalova',
      card: { img: 'hotel6', badges: ['Termal'], meta1: 'Termal, Yalova · Termal Havuz Dahil', sponsored: true },
      taxonomy: { categories: ['termal-oteller'], themes: [], collections: [],
        city: 'yalova', facets: {} },
      currency: 'TRY',
      rooms: [{ id: 'standart', name: 'Standart Oda', nightly: 1590, count: 30 }],
      boards: [{ id: 'bb', label: 'Oda + kahvaltı' }],
      pricing: { leadDays: 1 }
    },
    'goreme-magara-otel': {
      slug: 'goreme-magara-otel', type: 'hotel', sample: true,
      title: 'Göreme Mağara Otel', area: 'Göreme, Nevşehir',
      card: { img: 'hotel7', badges: ['Butik'], meta1: 'Göreme, Nevşehir · Tarihi Doku' },
      taxonomy: { categories: ['butik-oteller'], themes: ['kultur-tarih'], collections: ['romantik'],
        city: 'nevsehir', facets: {} },
      currency: 'TRY',
      rooms: [{ id: 'magara', name: 'Mağara Oda', nightly: 2450, count: 12 }],
      boards: [{ id: 'bb', label: 'Oda + kahvaltı' }],
      pricing: { leadDays: 1 },
      rating: { average: 9.4, count: 96 }
    }
  },

  activity: {
    'koprulu-kanyon-rafting': {
      slug: 'koprulu-kanyon-rafting', type: 'activity', sample: true,
      title: 'Köprülü Kanyon Rafting', area: 'Manavgat, Antalya', durationLabel: 'Yarım gün',
      card: { img: 'rafting3', badges: ['Su Sporları'], meta1: 'Antalya, Manavgat · Yarım Gün' },
      taxonomy: { categories: ['su-sporlari'], themes: ['macera-adrenalin'], collections: ['arkadas-grubu'],
        city: 'antalya', facets: {} },
      currency: 'TRY',
      packages: [{ id: 'standart', name: 'Standart', perPerson: 850, capacity: 40 }],
      sessions: [{ id: 'sabah', label: 'Sabah', time: '09:30' }],
      pricing: { leadDays: 1 },
      rating: { average: 4.8, count: 440 }
    },
    'oludeniz-yamac-parasutu': {
      slug: 'oludeniz-yamac-parasutu', type: 'activity', sample: true,
      title: 'Ölüdeniz Yamaç Paraşütü', area: 'Fethiye, Muğla', durationLabel: '20 dk uçuş',
      card: { img: 'paraglide3', badges: ['Macera'], meta1: 'Fethiye, Muğla · 20 dk Uçuş' },
      taxonomy: { categories: ['doga-macera'], themes: ['macera-adrenalin'], collections: [],
        city: 'mugla', facets: {} },
      currency: 'TRY',
      packages: [{ id: 'tandem', name: 'Tandem uçuş', perPerson: 1450, capacity: 10 }],
      sessions: [{ id: 'sabah', label: 'Sabah', time: '10:00' }],
      pricing: { leadDays: 1 },
      rating: { average: 4.9, count: 1200 }
    },
    'uludag-kayak-dersi': {
      slug: 'uludag-kayak-dersi', type: 'activity', sample: true,
      title: 'Uludağ Kayak Dersi', area: 'Uludağ, Bursa', durationLabel: '2 saat',
      card: { img: 'kayak3', badges: ['Kış Sporu'], meta1: 'Bursa, Uludağ · 2 Saat Özel Ders' },
      taxonomy: { categories: ['spor'], themes: ['kis-sporlari'], collections: ['yeni-baslayanlar'],
        city: 'bursa', facets: {} },
      currency: 'TRY',
      packages: [{ id: 'ozel', name: 'Özel ders', perPerson: 750, capacity: 6 }],
      sessions: [{ id: 'sabah', label: 'Sabah', time: '10:00' }],
      pricing: { leadDays: 1 },
      rating: { average: 4.5, count: 330 }
    },
    'uludag-kayak-paketi': {
      slug: 'uludag-kayak-paketi', type: 'activity', sample: true,
      title: 'Uludağ Kayak Paketi', area: 'Uludağ, Bursa', durationLabel: 'Tam gün',
      card: { img: 'uludag', badges: ['Kış Sporu'], meta1: 'Bursa, Uludağ · Skipass ve Ekipman' },
      taxonomy: { categories: ['spor'], themes: ['kis-sporlari'], collections: [],
        city: 'bursa', facets: {} },
      currency: 'TRY',
      packages: [{ id: 'gunluk', name: 'Günlük paket', perPerson: 3200, capacity: 30 }],
      sessions: [{ id: 'sabah', label: 'Sabah', time: '09:00' }],
      pricing: { leadDays: 1 }
    },
    'istanbul-bogaz-turu': {
      slug: 'istanbul-bogaz-turu', type: 'activity', sample: true,
      title: 'İstanbul Boğaz Turu', area: 'Eminönü, İstanbul', durationLabel: '2 saat',
      card: { img: 'bogaz', badges: ['Tekne Turu'], meta1: 'Eminönü, İstanbul · 2 Saat' },
      taxonomy: { categories: ['tekne-turlari'], themes: ['deniz-tekne'], collections: ['romantik'],
        city: 'istanbul', facets: {} },
      currency: 'TRY',
      packages: [{ id: 'standart', name: 'Standart', perPerson: 650, capacity: 80 }],
      sessions: [{ id: 'gunduz', label: 'Gündüz', time: '14:00' }],
      pricing: { leadDays: 0 }
    },
    'sile-kamp-deneyimi': {
      slug: 'sile-kamp-deneyimi', type: 'activity', sample: true,
      title: 'Şile Kamp Deneyimi', area: 'Şile, İstanbul', durationLabel: '1 gece',
      card: { img: 'sile', badges: ['Doğa'], meta1: 'Şile, İstanbul · Çadır ve Ekipman Dahil' },
      taxonomy: { categories: ['doga-macera'], themes: ['doga-yayla'], collections: ['arkadas-grubu'],
        city: 'istanbul', facets: {} },
      currency: 'TRY',
      packages: [{ id: 'cadir', name: 'Çadır', perPerson: 890, capacity: 20 }],
      sessions: [{ id: 'aksam', label: 'Akşam', time: '17:00' }],
      pricing: { leadDays: 1 }
    },
    'bodrum-tekne-turu': {
      slug: 'bodrum-tekne-turu', type: 'activity', sample: true,
      title: 'Bodrum Tekne Turu', area: 'Bodrum, Muğla', durationLabel: '6 saat',
      card: { img: 'bodrum', badges: ['Tekne Turu'], meta1: 'Bodrum Çıkışlı · 6 Saat' },
      taxonomy: { categories: ['tekne-turlari'], themes: ['deniz-tekne'], collections: ['ailece'],
        city: 'mugla', facets: {} },
      currency: 'TRY',
      packages: [{ id: 'standart', name: 'Standart', perPerson: 1150, capacity: 40 }],
      sessions: [{ id: 'sabah', label: 'Sabah', time: '10:30' }],
      pricing: { leadDays: 1 },
      rating: { average: 4.8, count: null }
    }
  },

  event: {
    'harbiye-acikhava-konserleri': {
      slug: 'harbiye-acikhava-konserleri', type: 'event', sample: true,
      title: 'Harbiye Açıkhava Konserleri', area: 'Harbiye, İstanbul',
      venueName: 'Cemil Topuzlu Açıkhava Tiyatrosu',
      card: { img: 'concert1', badges: ['Konser'], meta1: 'Cemil Topuzlu Sahnesi, İstanbul · 21:00' },
      taxonomy: { categories: ['konserler'], themes: [], collections: ['romantik'],
        city: 'istanbul', facets: {} },
      currency: 'TRY',
      performances: ornekTemsiller(ORNEK_SEZON[0], ORNEK_SEZON[1], [5], '21:00', 'Açıkhava konseri', 'Konser'),
      categories: [{ id: 'genel', name: 'Genel giriş', price: 890, seats: 4000 }],
      rating: { average: 4.8, count: 640 }
    },
    'cesme-yaz-festivali': {
      slug: 'cesme-yaz-festivali', type: 'event', sample: true,
      title: 'Çeşme Yaz Festivali', area: 'Alaçatı, İzmir', venueName: 'Alaçatı Sahil',
      card: { img: 'festival1', badges: ['Festival'], meta1: 'Alaçatı Sahil, İzmir · Tüm gün' },
      taxonomy: { categories: ['festivaller'], themes: [], collections: ['arkadas-grubu'],
        city: 'izmir', facets: {} },
      currency: 'TRY',
      performances: ornekTemsiller(ORNEK_SEZON[0], ORNEK_SEZON[1], [5], '12:00', 'Festival günü', 'Festival'),
      categories: [{ id: 'gunluk', name: 'Günlük bilet', price: 650, seats: 3000 }],
      rating: { average: 4.6, count: 310 }
    },
    'stand-up-gecesi': {
      slug: 'stand-up-gecesi', type: 'event', sample: true,
      title: 'Stand Up Gecesi', area: 'Çankaya, Ankara', venueName: 'Jolly Joker Ankara',
      card: { img: 'standup1', badges: ['Stand Up'], meta1: 'Jolly Joker, Ankara · 21:30', sponsored: true },
      taxonomy: { categories: ['stand-up'], themes: [], collections: ['arkadas-grubu'],
        city: 'ankara', facets: {} },
      currency: 'TRY',
      performances: ornekTemsiller(ORNEK_SEZON[0], ORNEK_SEZON[1], [5], '21:30', 'Stand up gecesi', 'Stand Up'),
      categories: [{ id: 'genel', name: 'Genel giriş', price: 420, seats: 600 }]
    },
    'istanbul-gece-yarisi-kosusu': {
      slug: 'istanbul-gece-yarisi-kosusu', type: 'event', sample: true,
      title: 'İstanbul Gece Yarısı Koşusu', area: 'Kadıköy, İstanbul', venueName: 'Kadıköy Sahil',
      card: { img: 'run1', badges: ['Spor'], meta1: 'Kadıköy Sahil, İstanbul · 21:00' },
      taxonomy: { categories: ['spor-etkinlikleri'], themes: ['macera-adrenalin'], collections: ['arkadas-grubu'],
        city: 'istanbul', facets: {} },
      currency: 'TRY',
      performances: ornekTemsiller(ORNEK_SEZON[0], ORNEK_SEZON[1], [5], '21:00', 'Gece koşusu', 'Spor'),
      categories: [{ id: 'kosucu', name: 'Koşucu kaydı', price: 350, seats: 2000 }],
      rating: { average: 4.6, count: 240 }
    },
    'kordon-caz-aksamlari': {
      slug: 'kordon-caz-aksamlari', type: 'event', sample: true,
      title: 'Kordon Caz Akşamları', area: 'Alsancak, İzmir', venueName: 'Kordon Açıkhava',
      card: { img: 'concert2', badges: ['Konser'], meta1: 'Alsancak, İzmir · 20:00' },
      taxonomy: { categories: ['konserler'], themes: [], collections: ['romantik'],
        city: 'izmir', facets: {} },
      currency: 'TRY',
      performances: ornekTemsiller(ORNEK_SEZON[0], ORNEK_SEZON[1], [6], '20:00', 'Caz akşamı', 'Konser'),
      categories: [{ id: 'genel', name: 'Genel giriş', price: 480, seats: 500 }],
      rating: { average: 4.7, count: 120 }
    },
    'istanbul-kahve-festivali': {
      slug: 'istanbul-kahve-festivali', type: 'event', sample: true,
      title: 'İstanbul Kahve Festivali', area: 'Maçka, İstanbul', venueName: 'Küçükçiftlik Park',
      card: { img: 'coffee1', badges: ['Festival'], meta1: 'Küçükçiftlik Park · 11:00' },
      taxonomy: { categories: ['festivaller'], themes: ['gastronomi'], collections: [],
        city: 'istanbul', facets: {} },
      currency: 'TRY',
      performances: ornekTemsiller(ORNEK_SEZON[0], ORNEK_SEZON[1], [0], '11:00', 'Festival günü', 'Festival'),
      categories: [{ id: 'gunluk', name: 'Günlük bilet', price: 290, seats: 5000 }],
      rating: { average: 4.5, count: 210 }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAMPLE_PRODUCTS, ornekTemsiller, ORNEK_SEZON };
}
