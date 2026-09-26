/* ---------------- sınıflandırma (taksonomi) ----------------
   Ürünlerin nasıl gruplandığı: kategori, tema, koleksiyon, destinasyon,
   özellik ve liste sayfası. Kavramların tanımı ve neden ayrı tutuldukları
   docs/veri-sozlesmesi.md bölüm 5'te.

   Beş kavram BİR ALANA DOLDURULMUYOR. "Karadeniz Turları" bir kategori,
   "Doğa & Yayla" bir tema, "Ailece" bir koleksiyon, "Rize" bir
   destinasyon, "otobüslü" bir özellik. Hepsi tek bir `category` alanına
   yazılsaydı bir ürün ancak birinde olabilirdi ve "Karadeniz'de, doğa
   temalı, aileye uygun, otobüslü turlar" sorusu cevaplanamazdı.

   Ürün kaydı bu dosyadaki kayıtlara SLUG ile bağlanıyor
   (kayit.taxonomy.categories = ['ege-turlari'] gibi). Ad, görsel veya
   sayı kopyalanmıyor; tema kartındaki "31 tur" gibi sayılar ürünlerden
   hesaplanıyor (data-gateway.js).

   Backend geldiğinde bu dosyanın karşılığı categories, themes,
   collections, regions, cities ve listing_pages tabloları
   (docs/veri-sozlesmesi.md bölüm 11). */

/* ---- destinasyon: bölge → şehir ----
   Bölge şehirden türetiliyor; ürün kaydında yalnızca şehir yazıyor.
   Kayıttaki "region: 'Ege'" görüntü metni testte buna karşı ölçülüyor. */
const TAXONOMY_REGIONS = [
  { slug: 'marmara',           name: 'Marmara',           abroad: false },
  { slug: 'ege',               name: 'Ege',               abroad: false },
  { slug: 'akdeniz',           name: 'Akdeniz',           abroad: false },
  { slug: 'ic-anadolu',        name: 'İç Anadolu',        abroad: false },
  { slug: 'karadeniz',         name: 'Karadeniz',         abroad: false },
  { slug: 'dogu-anadolu',      name: 'Doğu Anadolu',      abroad: false },
  { slug: 'guneydogu-anadolu', name: 'Güneydoğu Anadolu', abroad: false },
  /* Yurt dışı: menüdeki Kıbrıs Otelleri ve Yunan Adaları Turları için. */
  { slug: 'kibris',            name: 'Kıbrıs',            abroad: true },
  { slug: 'yunanistan',        name: 'Yunanistan',        abroad: true }
];

const TAXONOMY_CITIES = [
  { slug: 'istanbul',    name: 'İstanbul',    region: 'marmara' },
  { slug: 'bursa',       name: 'Bursa',       region: 'marmara' },
  { slug: 'sakarya',     name: 'Sakarya',     region: 'marmara' },
  { slug: 'yalova',      name: 'Yalova',      region: 'marmara' },
  { slug: 'canakkale',   name: 'Çanakkale',   region: 'marmara' },
  { slug: 'balikesir',   name: 'Balıkesir',   region: 'marmara' },
  { slug: 'izmir',       name: 'İzmir',       region: 'ege' },
  { slug: 'mugla',       name: 'Muğla',       region: 'ege' },
  { slug: 'denizli',     name: 'Denizli',     region: 'ege' },
  { slug: 'antalya',     name: 'Antalya',     region: 'akdeniz' },
  { slug: 'nevsehir',    name: 'Nevşehir',    region: 'ic-anadolu' },
  { slug: 'ankara',      name: 'Ankara',      region: 'ic-anadolu' },
  { slug: 'kayseri',     name: 'Kayseri',     region: 'ic-anadolu' },
  { slug: 'bolu',        name: 'Bolu',        region: 'karadeniz' },
  { slug: 'rize',        name: 'Rize',        region: 'karadeniz' },
  { slug: 'trabzon',     name: 'Trabzon',     region: 'karadeniz' },
  { slug: 'kars',        name: 'Kars',        region: 'dogu-anadolu' },
  { slug: 'girne',       name: 'Girne',       region: 'kibris' },
  { slug: 'sakiz-adasi', name: 'Sakız Adası', region: 'yunanistan' }
];

/* ---- ürün tipi etiketleri ----
   Liste adresinin kökü ve sayfalarda görünen tip adları. Turda iki alt
   tip var (günübirlik/konaklamalı); kayıttaki category, categoryShort,
   categoryPlural ve categoryAnchor alanları turda BUNUN görüntüsü. */
/* cityTitle: şehir sayfasının başlığındaki ek ("İzmir Turları",
   "Antalya Otelleri"); Türkçe iyelik eki tipten tipe değiştiği için
   veride yazılı. */
const TAXONOMY_TYPES = {
  tour:     { path: 'tur',      base: 'turlar',      name: 'Tur',      plural: 'Turlar',      anchor: 'turlar',      cityTitle: 'Turları' },
  hotel:    { path: 'otel',     base: 'oteller',     name: 'Otel',     plural: 'Oteller',     anchor: 'oteller',     cityTitle: 'Otelleri' },
  activity: { path: 'aktivite', base: 'aktiviteler', name: 'Aktivite', plural: 'Aktiviteler', anchor: 'aktiviteler', cityTitle: 'Aktiviteleri' },
  event:    { path: 'etkinlik', base: 'etkinlikler', name: 'Etkinlik', plural: 'Etkinlikler', anchor: 'etkinlikler', cityTitle: 'Etkinlikleri' },
  venue:    { path: 'mekan',    base: 'mekanlar',    name: 'Mekan',    plural: 'Mekanlar',    anchor: 'mekanlar',    cityTitle: 'Mekanları' }
};

const TAXONOMY_TOUR_KINDS = {
  daily: { name: 'Günübirlik Tur',  nameShort: 'Günübirlik',  plural: 'Günübirlik Turlar',  anchor: 'turlar',             listing: 'gunubirlik-turlar' },
  stay:  { name: 'Konaklamalı Tur', nameShort: 'Konaklamalı', plural: 'Konaklamalı Turlar', anchor: 'konaklamali-turlar', listing: 'konaklamali-turlar' }
};

/* ---- kategoriler ----
   Tip içinde, iç içe (parent). Bir ürün birden fazla kategoride
   olabilir; kayıttaki ilk kategori ANA kategori (breadcrumb ve kart
   rozeti). Üst kategorinin sayfası alt kategorilerin ürünlerini de
   listeler: "Tüm Yurt İçi Turlar" = yurt-ici-turlar.

   name       liste başlığı (çoğul): "Konserler"
   nameShort  rozet/çip (tekil, kısa): "Konser"
   menu:false adresi olan ama menüde görünmeyen kategori. Bugün yok:
              onaya sunulan dört kategori (Şehir Otelleri, Resort
              Oteller, Sahne Sanatları, Spa & Masaj) onaylanıp menüye
              girdi. */
const TAXONOMY_CATEGORIES = [
  /* ---- turlar: destinasyona göre ---- */
  { type: 'tour', slug: 'yurt-ici-turlar',        name: 'Yurt İçi Turlar',        nameShort: 'Yurt İçi',       parent: null },
  { type: 'tour', slug: 'karadeniz-turlari',      name: 'Karadeniz Turları',      nameShort: 'Karadeniz',      parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'bati-karadeniz-turlari', name: 'Batı Karadeniz Turları', nameShort: 'Batı Karadeniz', parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'kapadokya-turlari',      name: 'Kapadokya Turları',      nameShort: 'Kapadokya',      parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'fethiye-turlari',        name: 'Fethiye Turları',        nameShort: 'Fethiye',        parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'olympos-turlari',        name: 'Olympos Turları',        nameShort: 'Olympos',        parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'marmaris-turlari',       name: 'Marmaris Turları',       nameShort: 'Marmaris',       parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'istanbul-turlari',       name: 'İstanbul Turları',       nameShort: 'İstanbul',       parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'gap-turlari',            name: 'GAP Turları',            nameShort: 'GAP',            parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'ege-turlari',            name: 'Ege Turları',            nameShort: 'Ege',            parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'akdeniz-turlari',        name: 'Akdeniz Turları',        nameShort: 'Akdeniz',        parent: 'yurt-ici-turlar' },
  /* Kullanıcı onayıyla eklendi (2. adım sonrası): menüdeki bölgelerin
     hiçbirine girmeyen yurt içi turlar için. */
  { type: 'tour', slug: 'marmara-turlari',        name: 'Marmara Turları',        nameShort: 'Marmara',        parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'dogu-anadolu-turlari',   name: 'Doğu Anadolu Turları',   nameShort: 'Doğu Anadolu',   parent: 'yurt-ici-turlar' },
  { type: 'tour', slug: 'kis-turlari',            name: 'Kış Turları',            nameShort: 'Kış',            parent: 'yurt-ici-turlar' },

  { type: 'tour', slug: 'yurt-disi-turlar',       name: 'Yurt Dışı Turlar',       nameShort: 'Yurt Dışı',      parent: null },
  { type: 'tour', slug: 'balkan-turlari',         name: 'Balkan Turları',         nameShort: 'Balkanlar',      parent: 'yurt-disi-turlar' },
  { type: 'tour', slug: 'avrupa-turlari',         name: 'Avrupa Turları',         nameShort: 'Avrupa',         parent: 'yurt-disi-turlar' },
  { type: 'tour', slug: 'italya-turlari',         name: 'İtalya Turları',         nameShort: 'İtalya',         parent: 'yurt-disi-turlar' },
  { type: 'tour', slug: 'ispanya-turlari',        name: 'İspanya Turları',        nameShort: 'İspanya',        parent: 'yurt-disi-turlar' },
  { type: 'tour', slug: 'fransa-turlari',         name: 'Fransa Turları',         nameShort: 'Fransa',         parent: 'yurt-disi-turlar' },
  { type: 'tour', slug: 'yunan-adalari-turlari',  name: 'Yunan Adaları Turları',  nameShort: 'Yunan Adaları',  parent: 'yurt-disi-turlar' },
  { type: 'tour', slug: 'dubai-turlari',          name: 'Dubai Turları',          nameShort: 'Dubai',          parent: 'yurt-disi-turlar' },
  { type: 'tour', slug: 'misir-turlari',          name: 'Mısır Turları',          nameShort: 'Mısır',          parent: 'yurt-disi-turlar' },
  { type: 'tour', slug: 'uzak-dogu-turlari',      name: 'Uzak Doğu Turları',      nameShort: 'Uzak Doğu',      parent: 'yurt-disi-turlar' },
  { type: 'tour', slug: 'orta-avrupa-turlari',    name: 'Orta Avrupa Turları',    nameShort: 'Orta Avrupa',    parent: 'yurt-disi-turlar' },

  /* ---- oteller: tesis tipine göre ---- */
  { type: 'hotel', slug: 'butik-oteller',  name: 'Butik Oteller',  nameShort: 'Butik Otel',  parent: null },
  { type: 'hotel', slug: 'termal-oteller', name: 'Termal Oteller', nameShort: 'Termal Otel', parent: null },
  { type: 'hotel', slug: 'bungalovlar',    name: 'Bungalovlar',    nameShort: 'Bungalov',    parent: null },
  { type: 'hotel', slug: 'sehir-otelleri', name: 'Şehir Otelleri', nameShort: 'Şehir Oteli', parent: null },
  { type: 'hotel', slug: 'resort-oteller', name: 'Resort Oteller',  nameShort: 'Resort',      parent: null },

  /* ---- aktiviteler: aktivite türüne göre ---- */
  { type: 'activity', slug: 'tekne-turlari', name: 'Tekne Turları',  nameShort: 'Tekne Turu', parent: null },
  { type: 'activity', slug: 'su-sporlari',   name: 'Su Sporları',    nameShort: 'Su Sporları', parent: null },
  { type: 'activity', slug: 'doga-macera',   name: 'Doğa & Macera',  nameShort: 'Macera',     parent: null },
  { type: 'activity', slug: 'eglence',       name: 'Eğlence',        nameShort: 'Eğlence',    parent: null },
  { type: 'activity', slug: 'gastronomi',    name: 'Gastronomi',     nameShort: 'Gastronomi', parent: null },
  { type: 'activity', slug: 'kultur',        name: 'Kültür',         nameShort: 'Kültür',     parent: null },
  { type: 'activity', slug: 'spor',          name: 'Spor',           nameShort: 'Spor',       parent: null },

  /* ---- etkinlikler: etkinlik türüne göre ---- */
  { type: 'event', slug: 'konserler',          name: 'Konserler',          nameShort: 'Konser',   parent: null },
  { type: 'event', slug: 'festivaller',        name: 'Festivaller',        nameShort: 'Festival', parent: null },
  { type: 'event', slug: 'tiyatro',            name: 'Tiyatro',            nameShort: 'Tiyatro',  parent: null },
  { type: 'event', slug: 'stand-up',           name: 'Stand-up',           nameShort: 'Stand Up', parent: null },
  { type: 'event', slug: 'sergiler',           name: 'Sergiler',           nameShort: 'Sergi',    parent: null },
  { type: 'event', slug: 'spor-etkinlikleri',  name: 'Spor Etkinlikleri',  nameShort: 'Spor',     parent: null },
  { type: 'event', slug: 'cocuk-etkinlikleri', name: 'Çocuk Etkinlikleri', nameShort: 'Çocuk',    parent: null },
  { type: 'event', slug: 'sahne-sanatlari',    name: 'Sahne Sanatları',    nameShort: 'Sahne',    parent: null },

  /* ---- mekânlar: mekân türüne göre ---- */
  { type: 'venue', slug: 'restoranlar',        name: 'Restoranlar',        nameShort: 'Restoran',     parent: null },
  { type: 'venue', slug: 'kafeler',            name: 'Kafeler',            nameShort: 'Kafe',         parent: null },
  { type: 'venue', slug: 'beach-club',         name: 'Beach Club',         nameShort: 'Beach Club',   parent: null },
  { type: 'venue', slug: 'eglence-mekanlari',  name: 'Eğlence Mekanları',  nameShort: 'Eğlence',      parent: null },
  { type: 'venue', slug: 'kahvalti-mekanlari', name: 'Kahvaltı Mekanları', nameShort: 'Kahvaltı',     parent: null },
  { type: 'venue', slug: 'spa-masaj',          name: 'Spa & Masaj',        nameShort: 'Masaj Salonu', parent: null }
];

/* ---- temalar: NE yapmak istediğin ----
   Tipler arası: bir tema turu, aktiviteyi ve etkinliği birlikte
   toplayabilir. img anasayfanın görsel anahtarı (app.js/cardImages). */
const TAXONOMY_THEMES = [
  { slug: 'doga-yayla',       name: 'Doğa & Yayla',       img: 'iznik2' },
  { slug: 'kultur-tarih',     name: 'Kültür & Tarih',     img: 'efes' },
  { slug: 'deniz-tekne',      name: 'Deniz & Tekne',      img: 'cunda2' },
  { slug: 'kis-sporlari',     name: 'Kış Sporları',       img: 'uludag' },
  { slug: 'gastronomi',       name: 'Gastronomi',         img: 'coffee1' },
  { slug: 'macera-adrenalin', name: 'Macera & Adrenalin', img: 'paraglide3' }
];

/* ---- koleksiyonlar: KİMİNLE, nasıl bir kaçamak ----
   mode 'manual' → ürün kaydının taxonomy.collections listesinde adı geçer.
   mode 'rule'   → kural burada durur, ürüne YAZILMAZ; fiyat veya takvim
                   değişince ürün koleksiyona kendiliğinden girer/çıkar.

   Kural alanları:
     maxPrice         başlangıç fiyatı bu tutarın altında (currency ile)
     nextDateWithin   ilk satılabilir tarih bugünden en fazla N gün sonra
     types            kuralın uygulandığı ürün tipleri (yazılmazsa hepsi)
     minNights/maxNights  gece sayısı aralığı (konaklamalı tur, paket) */
const TAXONOMY_COLLECTIONS = [
  { slug: 'ailece',           name: 'Ailece',           text: 'Çocuklu ailelere uygun', img: 'abant2',     mode: 'manual' },
  { slug: 'romantik',         name: 'Romantik',         text: 'İki kişilik kaçamaklar', img: 'assos',      mode: 'manual' },
  { slug: 'butce-dostu',      name: 'Bütçe Dostu',      text: '500 TL altı seçenekler', img: 'market1',    mode: 'rule',
    rule: { maxPrice: 500, currency: 'TRY' } },
  { slug: 'tek-basina',       name: 'Tek Başına',       text: 'Yalnız gezenler için',   img: 'dogu2',      mode: 'manual' },
  { slug: 'arkadas-grubu',    name: 'Arkadaş Grubu',    text: 'Kalabalık gruplara',     img: 'rafting3',   mode: 'manual' },
  /* Yalnızca sabit tarihi olan ürünler: her gün satılan otel veya
     aktivite "son dakika" sayılsaydı koleksiyon her şeyi kapsardı. */
  { slug: 'son-dakika',       name: 'Son Dakika',       text: 'Bu hafta kalkanlar',     img: 'sapanca2',   mode: 'rule',
    rule: { nextDateWithin: 7, types: ['tour', 'event'] } },
  { slug: 'uzun-hafta-sonu',  name: 'Uzun Hafta Sonu',  text: '2-3 gecelik kaçışlar',   img: 'kapadokya2', mode: 'rule',
    rule: { minNights: 2, maxNights: 3 } },
  { slug: 'yeni-baslayanlar', name: 'Yeni Başlayanlar', text: 'İlk kez deneyenlere',    img: 'balloon3',   mode: 'manual' }
];

/* ---- özellikler (facets) ----
   Filtrelenen nitelikler. Ulaşım ürün kaydında yazılı
   (taxonomy.facets.transport); pansiyon ise otelin kendi pansiyon
   kayıtlarından türetiliyor (boards[].id sektörün standart kodları:
   BB, HB, FB, AI, RO) — ayrıca yazılsaydı iki kaynak olurdu. */
const TAXONOMY_FACETS = {
  transport: [
    { slug: 'otobus',  name: 'Otobüs' },
    { slug: 'minibus', name: 'Minibüs' },
    { slug: 'ucak',    name: 'Uçak' },
    { slug: 'tren',    name: 'Tren' },
    { slug: 'feribot', name: 'Feribot' }
  ],
  board: [
    { slug: 'sadece-oda',     name: 'Sadece oda',     code: 'ro' },
    { slug: 'oda-kahvalti',   name: 'Oda + kahvaltı', code: 'bb' },
    { slug: 'yarim-pansiyon', name: 'Yarım pansiyon', code: 'hb' },
    { slug: 'tam-pansiyon',   name: 'Tam pansiyon',   code: 'fb' },
    { slug: 'her-sey-dahil',  name: 'Her şey dahil',  code: 'ai' }
  ]
};

/* ---- liste sayfaları ----
   Kayıtlı bir filtre + SEO metni. Menüdeki "Otobüslü Turlar" bir
   kategori DEĞİL: "ulaşımı otobüs olan turlar" sorusunun kalıcı adresi.
   Böylece menü kullanıcının istediği gibi kalıyor, veri de normalize
   kalıyor.

   base   adresin kökü: /<base>/<slug>/
   filter ürün süzgeci. Anahtarlar:
     type, tourKind, category, theme, collection, region, city, abroad,
     transport, board, weekend (cuma-pazar kalkışlı ve en fazla 2 gece),
     discounted (liste fiyatının altında), earlyBooking (erken rezervasyon
     indirimi olan; fiyat kuralları 4. adımda)

   Aynı <base> altında liste sayfası ile kategori slug'ı ÇAKIŞAMAZ; ikisi
   aynı adres alanını paylaşıyor (tests/taksonomi.test.js). */
const TAXONOMY_LISTINGS = [
  { base: 'turlar', slug: 'kultur-turlari',      name: 'Kültür Turları',     filter: { type: 'tour', theme: 'kultur-tarih' } },
  { base: 'turlar', slug: 'gunubirlik-turlar',   name: 'Günübirlik Turlar',  filter: { type: 'tour', tourKind: 'daily' } },
  /* Menüde yok ama anasayfanın "Konaklamalı Turlar" şeridinin
     "Tümünü Gör" bağlantısı buraya gidecek. */
  { base: 'turlar', slug: 'konaklamali-turlar',  name: 'Konaklamalı Turlar', filter: { type: 'tour', tourKind: 'stay' }, menu: false },
  { base: 'turlar', slug: 'hafta-sonu-turlari',  name: 'Hafta Sonu Turları', filter: { type: 'tour', weekend: true } },
  { base: 'turlar', slug: 'otobuslu-turlar',     name: 'Otobüslü Turlar',    filter: { type: 'tour', transport: 'otobus' } },
  { base: 'turlar', slug: 'ucakli-turlar',       name: 'Uçaklı Turlar',      filter: { type: 'tour', transport: 'ucak' } },

  { base: 'oteller', slug: 'yurt-ici-oteller',      name: 'Yurt İçi Oteller',      filter: { type: 'hotel', abroad: false } },
  { base: 'oteller', slug: 'kibris-otelleri',       name: 'Kıbrıs Otelleri',       filter: { type: 'hotel', region: 'kibris' } },
  { base: 'oteller', slug: 'balayi-otelleri',       name: 'Balayı Otelleri',       filter: { type: 'hotel', collection: 'romantik' } },
  { base: 'oteller', slug: 'aile-otelleri',         name: 'Aile Otelleri',         filter: { type: 'hotel', collection: 'ailece' } },
  { base: 'oteller', slug: 'her-sey-dahil-oteller', name: 'Her Şey Dahil Oteller', filter: { type: 'hotel', board: 'her-sey-dahil' } },

  /* Fırsatlar tipler arası. "Son Dakika" burada YOK: aynı kavram
     koleksiyon olarak tanımlı ve menü oraya bağlanıyor. İki tanım
     zamanla ayrışırdı. */
  { base: 'firsatlar', slug: 'gunun-firsatlari',  name: 'Günün Fırsatları',  filter: { discounted: true } },
  { base: 'firsatlar', slug: 'erken-rezervasyon', name: 'Erken Rezervasyon', filter: { earlyBooking: true } },
  { base: 'firsatlar', slug: 'indirimli-turlar',  name: 'İndirimli Turlar',  filter: { type: 'tour', discounted: true } },
  { base: 'firsatlar', slug: 'indirimli-oteller', name: 'İndirimli Oteller', filter: { type: 'hotel', discounted: true } }
];

/* ---- içerik dışı sayfalar ----
   Taksonomiden gelmeyen ama menüde duran adresler. Hepsi tek şablonla
   veya tek bir içerik kaydıyla açılacak (2.-6. adım). */
const TAXONOMY_STATIC_PAGES = [
  'yeni-eklenenler', 'bu-hafta', 'kampanyalar', 'blog',
  'kurumsal/hakkimizda', 'kurumsal/iletisim', 'kurumsal/yardim', 'kurumsal/sss',
  'kurumsal/iptal-iade', 'kurumsal/kullanim-kosullari', 'kurumsal/kvkk'
];

/* ---- menü ----
   SONRA_BUNU_OKU belgesindeki ağaç + onaylanan eklemeler (Marmara, Doğu
   Anadolu ve Kış Turları; Şehir/Resort Oteller, Sahne Sanatları, Spa &
   Masaj). Her satırın bir
   adresi var ve tests/taksonomi.test.js o adresin bir kategoriye, liste
   sayfasına, temaya, koleksiyona veya içerik dışı sayfaya ÇÖZÜLDÜĞÜNÜ
   ölçüyor: hedefi olmayan menü satırı yazılamıyor. */
const TAXONOMY_MENU = [
  { label: 'Turlar', path: 'turlar', children: [
    { label: 'Yurt İçi Turlar', path: 'turlar/yurt-ici-turlar', children: [
      { label: 'Kültür Turları',          path: 'turlar/kultur-turlari' },
      { label: 'Karadeniz Turları',       path: 'turlar/karadeniz-turlari' },
      { label: 'Batı Karadeniz Turları',  path: 'turlar/bati-karadeniz-turlari' },
      { label: 'Kapadokya Turları',       path: 'turlar/kapadokya-turlari' },
      { label: 'Fethiye Turları',         path: 'turlar/fethiye-turlari' },
      { label: 'Olympos Turları',         path: 'turlar/olympos-turlari' },
      { label: 'Marmaris Turları',        path: 'turlar/marmaris-turlari' },
      { label: 'İstanbul Turları',        path: 'turlar/istanbul-turlari' },
      { label: 'GAP Turları',             path: 'turlar/gap-turlari' },
      { label: 'Ege Turları',             path: 'turlar/ege-turlari' },
      { label: 'Akdeniz Turları',         path: 'turlar/akdeniz-turlari' },
      { label: 'Marmara Turları',         path: 'turlar/marmara-turlari' },
      { label: 'Doğu Anadolu Turları',    path: 'turlar/dogu-anadolu-turlari' },
      { label: 'Kış Turları',             path: 'turlar/kis-turlari' },
      { label: 'Tüm Yurt İçi Turlar',     path: 'turlar/yurt-ici-turlar' }
    ] },
    { label: 'Yurt Dışı Turlar', path: 'turlar/yurt-disi-turlar', children: [
      { label: 'Balkan Turları',          path: 'turlar/balkan-turlari' },
      { label: 'Avrupa Turları',          path: 'turlar/avrupa-turlari' },
      { label: 'İtalya Turları',          path: 'turlar/italya-turlari' },
      { label: 'İspanya Turları',         path: 'turlar/ispanya-turlari' },
      { label: 'Fransa Turları',          path: 'turlar/fransa-turlari' },
      { label: 'Yunan Adaları Turları',   path: 'turlar/yunan-adalari-turlari' },
      { label: 'Dubai Turları',           path: 'turlar/dubai-turlari' },
      { label: 'Mısır Turları',           path: 'turlar/misir-turlari' },
      { label: 'Uzak Doğu Turları',       path: 'turlar/uzak-dogu-turlari' },
      { label: 'Orta Avrupa Turları',     path: 'turlar/orta-avrupa-turlari' },
      { label: 'Tüm Yurt Dışı Turlar',    path: 'turlar/yurt-disi-turlar' }
    ] },
    { label: 'Günübirlik Turlar',  path: 'turlar/gunubirlik-turlar' },
    { label: 'Hafta Sonu Turları', path: 'turlar/hafta-sonu-turlari' },
    { label: 'Otobüslü Turlar',    path: 'turlar/otobuslu-turlar' },
    { label: 'Uçaklı Turlar',      path: 'turlar/ucakli-turlar' }
  ] },
  { label: 'Oteller', path: 'oteller', children: [
    { label: 'Yurt İçi Oteller',      path: 'oteller/yurt-ici-oteller' },
    { label: 'Kıbrıs Otelleri',       path: 'oteller/kibris-otelleri' },
    { label: 'Termal Oteller',        path: 'oteller/termal-oteller' },
    { label: 'Bungalovlar',           path: 'oteller/bungalovlar' },
    { label: 'Butik Oteller',         path: 'oteller/butik-oteller' },
    { label: 'Şehir Otelleri',        path: 'oteller/sehir-otelleri' },
    { label: 'Resort Oteller',        path: 'oteller/resort-oteller' },
    { label: 'Balayı Otelleri',       path: 'oteller/balayi-otelleri' },
    { label: 'Aile Otelleri',         path: 'oteller/aile-otelleri' },
    { label: 'Her Şey Dahil Oteller', path: 'oteller/her-sey-dahil-oteller' },
    { label: 'Tüm Oteller',           path: 'oteller' }
  ] },
  { label: 'Aktiviteler', path: 'aktiviteler', children: [
    { label: 'Tekne Turları',   path: 'aktiviteler/tekne-turlari' },
    { label: 'Su Sporları',     path: 'aktiviteler/su-sporlari' },
    { label: 'Doğa & Macera',   path: 'aktiviteler/doga-macera' },
    { label: 'Eğlence',         path: 'aktiviteler/eglence' },
    { label: 'Gastronomi',      path: 'aktiviteler/gastronomi' },
    { label: 'Kültür',          path: 'aktiviteler/kultur' },
    { label: 'Spor',            path: 'aktiviteler/spor' },
    { label: 'Tüm Aktiviteler', path: 'aktiviteler' }
  ] },
  { label: 'Etkinlikler', path: 'etkinlikler', children: [
    { label: 'Konserler',          path: 'etkinlikler/konserler' },
    { label: 'Festivaller',        path: 'etkinlikler/festivaller' },
    { label: 'Tiyatro',            path: 'etkinlikler/tiyatro' },
    { label: 'Stand-up',           path: 'etkinlikler/stand-up' },
    { label: 'Sergiler',           path: 'etkinlikler/sergiler' },
    { label: 'Spor Etkinlikleri',  path: 'etkinlikler/spor-etkinlikleri' },
    { label: 'Çocuk Etkinlikleri', path: 'etkinlikler/cocuk-etkinlikleri' },
    { label: 'Sahne Sanatları',    path: 'etkinlikler/sahne-sanatlari' },
    { label: 'Tüm Etkinlikler',    path: 'etkinlikler' }
  ] },
  { label: 'Mekanlar', path: 'mekanlar', children: [
    { label: 'Restoranlar',        path: 'mekanlar/restoranlar' },
    { label: 'Kafeler',            path: 'mekanlar/kafeler' },
    { label: 'Beach Club',         path: 'mekanlar/beach-club' },
    { label: 'Eğlence Mekanları',  path: 'mekanlar/eglence-mekanlari' },
    { label: 'Kahvaltı Mekanları', path: 'mekanlar/kahvalti-mekanlari' },
    { label: 'Spa & Masaj',        path: 'mekanlar/spa-masaj' },
    { label: 'Tüm Mekanlar',       path: 'mekanlar' }
  ] },
  { label: 'Fırsatlar', path: 'firsatlar', children: [
    { label: 'Günün Fırsatları',  path: 'firsatlar/gunun-firsatlari' },
    { label: 'Son Dakika',        path: 'koleksiyonlar/son-dakika' },
    { label: 'Erken Rezervasyon', path: 'firsatlar/erken-rezervasyon' },
    { label: 'İndirimli Turlar',  path: 'firsatlar/indirimli-turlar' },
    { label: 'İndirimli Oteller', path: 'firsatlar/indirimli-oteller' },
    { label: 'Kampanyalar',       path: 'kampanyalar' }
  ] },
  { label: 'Yeni Eklenenler', path: 'yeni-eklenenler' },
  { label: 'Bu Hafta',        path: 'bu-hafta' },
  { label: 'Blog / Gezi Rehberi', path: 'blog' },
  { label: 'Kurumsal', path: 'kurumsal/hakkimizda', children: [
    { label: 'Hakkımızda',         path: 'kurumsal/hakkimizda' },
    { label: 'İletişim',           path: 'kurumsal/iletisim' },
    { label: 'Yardım Merkezi',     path: 'kurumsal/yardim' },
    { label: 'Sık Sorulan Sorular', path: 'kurumsal/sss' },
    { label: 'İptal / İade',       path: 'kurumsal/iptal-iade' },
    { label: 'Kullanım Koşulları', path: 'kurumsal/kullanim-kosullari' },
    { label: 'KVKK',               path: 'kurumsal/kvkk' }
  ] }
];

/* ---------------- saf yardımcılar ---------------- */

function taxonomyRegion(slug) {
  return TAXONOMY_REGIONS.find(r => r.slug === slug) || null;
}

function taxonomyCity(slug) {
  return TAXONOMY_CITIES.find(c => c.slug === slug) || null;
}

/* Şehrin bölgesi. Bilinmeyen şehir null. */
function taxonomyCityRegion(citySlug) {
  const sehir = taxonomyCity(citySlug);
  return sehir ? taxonomyRegion(sehir.region) : null;
}

function taxonomyCategory(type, slug) {
  return TAXONOMY_CATEGORIES.find(c => c.type === type && c.slug === slug) || null;
}

/* Kategori ve bütün alt kategorileri: üst kategorinin sayfası altındaki
   ürünleri de listeler. Döngü korumalı (veri hatası sonsuz döngü
   üretmesin). */
function taxonomyCategoryWithDescendants(type, slug) {
  const out = [];
  const kuyruk = [slug];
  while (kuyruk.length) {
    const s = kuyruk.shift();
    if (out.indexOf(s) !== -1) continue;
    out.push(s);
    TAXONOMY_CATEGORIES
      .filter(c => c.type === type && c.parent === s)
      .forEach(c => kuyruk.push(c.slug));
  }
  return out;
}

/* Breadcrumb için: kök → yaprak. */
function taxonomyCategoryPath(type, slug) {
  const yol = [];
  let k = taxonomyCategory(type, slug);
  while (k && yol.indexOf(k) === -1) {
    yol.unshift(k);
    k = k.parent ? taxonomyCategory(type, k.parent) : null;
  }
  return yol;
}

function taxonomyTheme(slug) {
  return TAXONOMY_THEMES.find(t => t.slug === slug) || null;
}

function taxonomyCollection(slug) {
  return TAXONOMY_COLLECTIONS.find(c => c.slug === slug) || null;
}

function taxonomyListing(base, slug) {
  return TAXONOMY_LISTINGS.find(l => l.base === base && l.slug === slug) || null;
}

/* Otelin pansiyon kodundan (bb, hb …) özellik kaydı. */
function taxonomyBoardByCode(code) {
  const k = String(code || '').toLowerCase();
  return TAXONOMY_FACETS.board.find(b => b.code === k) || null;
}

/* Adres çözümü: "turlar/otobuslu-turlar" neye karşılık geliyor?
   Liste adresinin (/<base>/<slug>/) tek karar noktası; 2. adımdaki
   yönlendirici de bunu kullanacak.

   Dönüş: { kind: 'type-list' | 'category' | 'listing' | 'city' |
            'theme' | 'collection' | 'static', … } veya null (bulunamadı
            → 404). Aynı kök altında sıra: liste sayfası, kategori, şehir;
            slug'ları çakışamaz (tests/taksonomi.test.js). */
function taxonomyResolvePath(yol) {
  const temiz = String(yol || '').replace(/^\/+|\/+$/g, '');
  if (!temiz) return null;
  const [bas, slug, fazla] = temiz.split('/');

  if (TAXONOMY_STATIC_PAGES.indexOf(temiz) !== -1) return { kind: 'static', path: temiz };
  if (fazla !== undefined) return null;

  if (bas === 'temalar' && slug) {
    const t = taxonomyTheme(slug);
    return t ? { kind: 'theme', theme: t } : null;
  }
  if (bas === 'koleksiyonlar' && slug) {
    const c = taxonomyCollection(slug);
    return c ? { kind: 'collection', collection: c } : null;
  }

  const tip = Object.keys(TAXONOMY_TYPES).find(t => TAXONOMY_TYPES[t].base === bas) || null;
  if (!slug) {
    if (tip) return { kind: 'type-list', type: tip };
    if (bas === 'firsatlar') return { kind: 'type-list', type: null, base: 'firsatlar' };
    return null;
  }

  const liste = taxonomyListing(bas, slug);
  if (liste) return { kind: 'listing', listing: liste };
  if (tip) {
    const k = taxonomyCategory(tip, slug);
    if (k) return { kind: 'category', type: tip, category: k };
    /* Şehir sayfası: /turlar/izmir/, /oteller/antalya/. Ürünün
       destinasyon şehri (taxonomy.city); kalkış şehri değil. */
    const sehir = taxonomyCity(slug);
    if (sehir) return { kind: 'city', type: tip, city: sehir };
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TAXONOMY_REGIONS,
    TAXONOMY_CITIES,
    TAXONOMY_TYPES,
    TAXONOMY_TOUR_KINDS,
    TAXONOMY_CATEGORIES,
    TAXONOMY_THEMES,
    TAXONOMY_COLLECTIONS,
    TAXONOMY_FACETS,
    TAXONOMY_LISTINGS,
    TAXONOMY_STATIC_PAGES,
    TAXONOMY_MENU,
    taxonomyRegion,
    taxonomyCity,
    taxonomyCityRegion,
    taxonomyCategory,
    taxonomyCategoryWithDescendants,
    taxonomyCategoryPath,
    taxonomyTheme,
    taxonomyCollection,
    taxonomyListing,
    taxonomyBoardByCode,
    taxonomyResolvePath
  };
}
