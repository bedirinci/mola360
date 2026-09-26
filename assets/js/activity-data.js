/* ---------------- aktivite içerik sayfası: veri ve saf yardımcılar ----------------
   /aktivite/<slug>/ sayfasının bütün içeriği burada durur; activity-page.js
   yalnızca bu veriyi işaretlemeye çevirir. Sayfada görünen hiçbir metin
   activity-page.js'in içine yazılmaz — bir aktiviteyi değiştirmek için tek
   dosya yeter. Kural tur ve otel sayfalarıyla aynı (docs/tur-sayfasi.md,
   docs/otel-sayfasi.md).

   Biçimlendirme, tarih, iade ve puan hesapları TEKRAR YAZILMIYOR:
   tour-data.js'te duruyorlar ve bu dosya onları kullanıyor. Tarayıcıda
   tour-data.js önce yükleniyor, Node/vitest tarafında require ile geliyor.

   Yeni aktivite eklemek: ACTIVITIES'e bir kayıt daha ve
   aktivite/<slug>/index.html. Anasayfaya girmesi için bir şey yapmak
   gerekmiyor — catalog.js kaydı görüp kartı kendisi üretiyor. */

const AKTIVITE_TUR_VERI = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
  ? require('./tour-data.js')
  : null;

const aAsDate     = AKTIVITE_TUR_VERI ? AKTIVITE_TUR_VERI.asDate : asDate;
const aCommonsUrl = AKTIVITE_TUR_VERI ? AKTIVITE_TUR_VERI.commonsImageUrl : commonsImageUrl;

/* ---------------- görseller ----------------
   Yöntem tur ve otel sayfalarıyla aynı (docs/gorsel-kaynaklari.md).
   TOUR_IMAGE_FILES ile ORTAK olan anahtarlarda dosya adı birebir aynı;
   tests/activity.test.js iki dosyanın aynı adresi ürettiğini doğruluyor. */
const ACTIVITY_IMAGE_FILES = {
  kapadokyaBalon: { dosya: 'Hot air balloons in Cappadocia.jpg',   ad: 'Kapadokya — sabah balonları' },
  balonUcus:      { dosya: 'Hot air balloon ride at sunrise in Cappadocia 2.JPG', ad: 'Gün doğumunda balon uçuşu' },
  balonSisirme:   { dosya: 'Hot air balloon inflation Cappadocia.jpg', ad: 'Kalkış alanında şişirme' },
  guvercinlik:    { dosya: 'Pigeon Valley Cappadocia.jpg',         ad: 'Güvercinlik Vadisi' },
  kizilVadi:      { dosya: 'Red Valley Cappadocia.jpg',            ad: 'Kızıl Vadi' },
  goreme:         { dosya: 'Goreme Open Air Museum.jpg',           ad: 'Göreme Açık Hava Müzesi' },
  uchisar:        { dosya: 'Uchisar Castle Cappadocia.jpg',        ad: 'Uçhisar Kalesi' }
};

function activityImage(key, width) {
  const kayit = ACTIVITY_IMAGE_FILES[key];
  return kayit ? aCommonsUrl(kayit.dosya, width) : '';
}

/* ---------------- paket ve seans ----------------
   Aktivitede iki ayrı seçim var ve ikisi de fiyatı etkiliyor:

     paket  sepet büyüklüğü ve uçuş süresi (kişi başı fiyatı belirler)
     seans  hangi kalkış (ilk uçuş gün doğumunda, ikincisi daha ucuz)

   Tanınmayan kimlik ilk kayda düşer: adres çubuğundan ya da eski bir
   bağlantıdan gelen yanlış değer sayfayı boş bırakmaz. */
function activityPackage(aktivite, paketId) {
  const liste = (aktivite && aktivite.packages) || [];
  if (!liste.length) return null;
  const id = String(paketId || '');
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) return liste[i];
  }
  return liste[0];
}

function activitySession(aktivite, seansId) {
  const liste = (aktivite && aktivite.sessions) || [];
  if (!liste.length) return null;
  const id = String(seansId || '');
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) return liste[i];
  }
  return liste[0];
}

/* ---------------- katılım sınırları ----------------
   Tek yerde: hem sayaç butonları hem tutar bu fonksiyondan geçiyor.

   Çocuk sayısı YETİŞKİNE BAĞLI: refakatsiz çocuk kabul edilmiyor ve
   kural sayfada yazılı. Sınır burada uygulanmasaydı "2 yetişkin, 6
   çocuk" gibi satılamayacak bir seçim hesaba girerdi. */
function clampActivityParty(aktivite, secim) {
  const p = (aktivite && aktivite.pricing) || {};
  const sec = secim || {};
  const paket = activityPackage(aktivite, sec.pack);
  const seans = activitySession(aktivite, sec.session);

  const enFazla = Math.min(
    Math.max(1, Math.round(Number(p.maxGuests) || 8)),
    Math.max(1, Math.round(Number(paket && paket.capacity) || 8))
  );
  const cocukBasina = Math.max(1, Math.round(Number(p.childrenPerAdult) || 2));

  let yetiskin = Math.max(1, Math.floor(Number(sec.adults) || 1));
  yetiskin = Math.min(yetiskin, enFazla);

  let cocuk = Math.max(0, Math.floor(Number(sec.children) || 0));
  cocuk = Math.min(cocuk, enFazla - yetiskin, yetiskin * cocukBasina);

  return {
    adults: yetiskin,
    children: cocuk,
    guests: yetiskin + cocuk,
    pack: paket,
    session: seans,
    maxGuests: enFazla
  };
}

/* ---------------- ek hizmetler ----------------
   İki çarpan var:
     booking  bir kez (fotoğraf-video paketi, özel transfer)
     guest    kişi başına (hediye paketi)
   Otelde üçüncü bir çarpan (gece başına) vardı; aktivitede gece yok,
   o yüzden burada da yok. */
function activityAddonLines(aktivite, secim, katilim) {
  const secili = (secim && Array.isArray(secim.addons)) ? secim.addons : [];
  const kisi = katilim || clampActivityParty(aktivite, secim);
  return ((aktivite && aktivite.addons) || [])
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
   Kurallar ve her birinin ayrı testi var:

   yetişkin   paketin kişi başı fiyatı
   çocuk      paketin kendi çocuk tarifesi (yaş sınırı pricing'te)
   seans      kalkışa göre fark; İKİNCİ UÇUŞ İNDİRİMLİ, yani fark
              negatif olabilir ve özet dökümünde indirim satırı olarak
              görünür
   ek hizmet  bir kez ya da kişi başına

   Vergi satırı YOK: otelde konaklama vergisi fatura üzerinde ayrı
   gösterildiği için ayrı satırdı; aktivite fiyatı KDV dahil tek tutar
   olarak satılıyor. İki sayfanın farkı bilinçli. */
function calcActivityTotal(aktivite, secim) {
  const katilim = clampActivityParty(aktivite, secim);
  const paket = katilim.pack || {};
  const seans = katilim.session || {};

  const yetiskinBirim = Number(paket.perPerson) || 0;
  const cocukBirim = Number(paket.child) || 0;
  const yetiskinToplam = katilim.adults * yetiskinBirim;
  const cocukToplam = katilim.children * cocukBirim;

  const seansBirim = Number(seans.fee) || 0;
  const seansToplam = seansBirim * katilim.guests;

  const araToplam = yetiskinToplam + cocukToplam + seansToplam;

  /* Liste fiyatı karşılaştırması yalnızca indirime konu kalemler
     üzerinden: seans farkı bir tarife farkı, indirimli fiyat değil. */
  const listeToplam = katilim.adults * (Number(paket.perPersonList) || yetiskinBirim)
    + katilim.children * (Number(paket.childList) || cocukBirim);

  const ekler = activityAddonLines(aktivite, secim, katilim);
  const eklerToplam = ekler.reduce((toplam, a) => toplam + a.amount, 0);

  const satirlar = [];
  satirlar.push({
    label: paket.name + ' · yetişkin × ' + katilim.adults,
    amount: yetiskinToplam,
    kind: 'base'
  });
  if (katilim.children) {
    satirlar.push({
      label: 'Çocuk × ' + katilim.children + ' (' + ((aktivite.pricing || {}).childAges || '') + ')',
      amount: cocukToplam,
      kind: 'base'
    });
  }
  if (seansToplam) {
    satirlar.push({
      label: seans.label + (seansToplam < 0 ? ' indirimi' : ' farkı') + ' × ' + katilim.guests,
      amount: seansToplam,
      kind: seansToplam < 0 ? 'discount' : 'fee'
    });
  }
  ekler.forEach(a => satirlar.push(a));

  return {
    adults: katilim.adults,
    children: katilim.children,
    guests: katilim.guests,
    pack: katilim.pack,
    session: katilim.session,
    adultTotal: yetiskinToplam,
    childTotal: cocukToplam,
    sessionTotal: seansToplam,
    subtotal: araToplam,
    listSubtotal: listeToplam,
    saving: Math.max(0, listeToplam - (yetiskinToplam + cocukToplam)),
    addons: ekler,
    addonsTotal: eklerToplam,
    lines: satirlar,
    total: araToplam + eklerToplam
  };
}

/* Kartlarda ve rezervasyon kartının tepesinde görünen "…TL'den başlayan"
   fiyat: en ucuz paketin kişi başı ücreti. Anasayfadaki aktivite kartının
   fiyatı da bu olmak zorunda; tests/activity.test.js karşılaştırıyor. */
function activityPriceFrom(aktivite) {
  const liste = (aktivite && aktivite.packages) || [];
  if (!liste.length) return 0;
  return liste.reduce((enAz, p) => Math.min(enAz, Number(p.perPerson) || 0),
    Number(liste[0].perPerson) || 0);
}

function activityListPriceFrom(aktivite) {
  const liste = (aktivite && aktivite.packages) || [];
  if (!liste.length) return 0;
  const ucuz = liste.reduce((secili, p) =>
    (Number(p.perPerson) || 0) < (Number(secili.perPerson) || 0) ? p : secili, liste[0]);
  return Number(ucuz.perPersonList) || Number(ucuz.perPerson) || 0;
}

/* Kalan yer burada hesaplanmıyor: veri kapısının kontenjan cevabından
   (MolaVeri.musaitlik; birim paket × seans). */

/* Aktivite her gün yapılıyor ama hava koşuluna bağlı. Uçuşun yapılıp
   yapılmayacağı ancak o sabah belli oluyor; bu yüzden "iptal" iki ayrı
   şey ve ikisi ayrı ayrı yazılı:
     misafir iptali  -> kademeli iade (cancellation.tiers)
     hava iptali     -> koşulsuz TAM iade (weatherRefund)
   Fonksiyon ikincisini tek yerde tutuyor; sayfa da, test de buradan
   okuyor. */
function weatherRefundAmount(aktivite, total) {
  const oran = (aktivite && aktivite.cancellation && Number(aktivite.cancellation.weatherRefund));
  const carpan = Number.isFinite(oran) ? Math.max(0, Math.min(1, oran)) : 1;
  return Math.round((Number(total) || 0) * carpan);
}

/* /mola360/aktivite/kapadokya-balon-turu/ -> "kapadokya-balon-turu" */
function activitySlugFromPath(pathname) {
  const m = String(pathname || '').match(/\/aktivite\/([^/?#]+)/);
  if (!m) return '';
  const parca = m[1];
  if (/\.html?$/i.test(parca)) return '';
  try {
    return decodeURIComponent(parca).trim().toLowerCase();
  } catch (_) {
    return '';
  }
}

/* ---------------- aktiviteler ----------------
   NOT: buradaki aktivite kurgusaldır (gerçek envanter bağlanana kadar
   örnek içerik). Bu yüzden sayfada Event/Offer/AggregateRating yapısal
   verisi YOK — gerekçesi docs/aktivite-sayfasi.md ve
   docs/seo-arastirma.md (madde 2) içinde. */
const ACTIVITIES = {
  'kapadokya-balon-turu': {
    slug: 'kapadokya-balon-turu',
    type: 'activity',
    title: 'Kapadokya Sıcak Hava Balonu Turu',
    tagline: 'Göreme’de gün doğumunda bir saat uçuş, otelden alım dahil',
    category: 'Aktivite',
    categoryShort: 'Macera',
    categoryPlural: 'Aktiviteler',
    categoryAnchor: 'aktiviteler',
    area: 'Göreme, Nevşehir',
    region: 'İç Anadolu',
    code: 'MLA-AKT-01',

    /* Sınıflandırma, para birimi ve arama motoru bilgisi:
       docs/veri-sozlesmesi.md bölüm 4. */
    taxonomy: {
      categories: ['doga-macera'],
      themes: ['macera-adrenalin'],
      collections: ['romantik', 'yeni-baslayanlar'],
      city: 'nevsehir',
      facets: {}
    },
    currency: 'TRY',
    seo: {
      title: 'Kapadokya Sıcak Hava Balonu Turu — Göreme | mola360',
      description: 'Göreme\'de gün doğumunda bir saat balon uçuşu: otelden alım, kahvaltı, köpüklü ikram ve uçuş sertifikası dahil. Üç paket, {fiyat}\'den başlayan fiyatlar, hava koşulunda tam iade.',
      ogTitle: 'Kapadokya Sıcak Hava Balonu Turu — Göreme',
      ogDescription: 'Gün doğumunda bir saat uçuş, otelden alım dahil. Hava koşulunda koşulsuz tam iade.'
    },
    durationLabel: '1 saat uçuş · 3 saat toplam',
    /* Başlık satırında geçen kısa süre cümlesi. */
    activityLabel: 'Gün doğumunda 1 saat uçuş',

    /* Anasayfa kartı: bu kayıt catalog.js tarafından "Aktiviteler"
       şeridine kendiliğinden giriyor. Fiyat, puan, yorum sayısı ve
       tarih KAYITTAN türetiliyor; burada yalnızca türetilemeyenler.
       sponsored, kartın anasayfadaki mevcut davranışını koruyor. */
    card: {
      img: 'balloon3',
      title: 'Kapadokya Sıcak Hava Balonu',
      badges: ['Macera'],
      meta1: 'Göreme, Nevşehir · 1 Saat Uçuş',
      sponsored: true
    },

    badges: [
      { icon: 'bolt',    label: 'Anında onay' },
      { icon: 'refresh', label: 'Hava koşulunda tam iade' },
      { icon: 'bus',     label: 'Otelden alım dahil' },
      { icon: 'shield',  label: 'Sigorta ve sertifika' }
    ],

    /* Üst şerit: aktivitenin künyesi. Altı kutu, mobilde ikili ızgara. */
    facts: [
      { icon: 'clock',    label: 'Süre',       value: '1 saat uçuş',        note: 'Alım dahil 3 saat' },
      { icon: 'sun',      label: 'Kalkış',     value: 'Gün doğumundan önce', note: 'Mevsime göre 04:30 – 06:00' },
      { icon: 'users',    label: 'Sepet',      value: '4 – 20 kişi',        note: 'Pakete göre değişir' },
      { icon: 'info',     label: 'Katılım',    value: '6 yaş ve üzeri',     note: 'En fazla 120 kg' },
      { icon: 'bus',      label: 'Alım',       value: 'Otelden alım dahil', note: 'Göreme, Ürgüp, Uçhisar, Avanos' },
      { icon: 'globe',    label: 'Dil',        value: 'Türkçe, İngilizce',  note: 'Lisanslı balon pilotu' }
    ],

    gallery: [
      { key: 'kapadokyaBalon', caption: 'Gün doğarken vadideki balonlar' },
      { key: 'balonUcus',      caption: 'Sepetten peribacaları manzarası' },
      { key: 'balonSisirme',   caption: 'Kalkış alanında şişirme' },
      { key: 'guvercinlik',    caption: 'Güvercinlik Vadisi üzerinde' },
      { key: 'kizilVadi',      caption: 'Kızıl Vadi’nin sabah ışığı' },
      { key: 'goreme',         caption: 'Göreme Açık Hava Müzesi' },
      { key: 'uchisar',        caption: 'Uçhisar Kalesi’nin üzerinden' }
    ],

    highlights: [
      'Gün doğumundan önce havalanıp peribacalarının üzerinde bir saat uçuş',
      'Göreme, Kızıl Vadi, Güvercinlik ve Aşk Vadisi rotası — rüzgâr yönü belirler',
      'Otelden alım ve uçuş sonrası otele bırakma fiyata dahil',
      'Kalkış alanında sıcak içecek ve hafif kahvaltı',
      'İnişte köpüklü ikram ve pilot imzalı uçuş sertifikası',
      'Sivil Havacılık lisanslı pilot, zorunlu uçuş sigortası'
    ],

    description: [
      'Kapadokya’da balon uçuşu gün doğumundan önce başlar: rüzgâr sabahın ilk saatlerinde en sakin haldedir ve vadiler o saatte ışık alır. Otelinizden alındıktan sonra kalkış alanına geçilir, sıcak içecek ve hafif bir kahvaltıdan sonra balonun şişirilişini baştan sona izlersiniz. Sepete binmeden önce pilot kısa bir güvenlik bilgilendirmesi yapar.',
      'Uçuş yaklaşık bir saat sürer. Rota rüzgâr yönüne göre belirlenir — pilot yüksekliği değiştirerek yön seçer, bu yüzden her sabah aynı vadi görülmez. Genellikle Göreme, Kızıl Vadi, Güvercinlik ve Aşk Vadisi hattı uçulur; balon zaman zaman peribacalarının arasına iner, zaman zaman bin metrenin üzerine çıkar. Yükseklik korkusu olanlar için sepet kenarı göğüs hizasındadır ve sepet sallanmaz.',
      'İniş sonrası ekip balonu toplarken köpüklü ikram yapılır ve pilot imzalı uçuş sertifikanız verilir. Ardından otelinize bırakılırsınız; program genellikle sabah 08:00 – 08:30 arasında biter, yani günün geri kalanı size kalır. Uçuş hava koşuluna bağlıdır: rüzgâr veya görüş uygun değilse kalkış yapılmaz ve ücretin tamamı iade edilir.'
    ],

    /* Program: saat + başlık + açıklama. Saatler mevsime göre kayıyor,
       bu yüzden "gün doğumundan önce" ifadesi künyede duruyor. */
    itinerary: [
      { time: '04:30', title: 'Otelden alım',
        text: 'Göreme, Ürgüp, Uçhisar, Avanos ve Çavuşin’deki otellerden alınırsınız. Alım saati mevsime ve gün doğumuna göre 04:00 – 05:30 arasında değişir; bir gün önce akşam teyit mesajı gelir.' },
      { time: '05:00', title: 'Kalkış alanında kahvaltı', duration: '30 dk', badge: 'Dahil',
        text: 'Sıcak içecek, poğaça ve mevsim meyveleri. Bu sırada ekip balonu serer ve şişirmeye başlar; şişirme aşaması fotoğraf için en iyi anlardan biridir.' },
      { time: '05:45', title: 'Güvenlik bilgilendirmesi ve biniş', duration: '15 dk',
        text: 'Pilot iniş pozisyonunu ve sepet içi kurallarını anlatır. Sepete biniş basamak yardımıyla yapılır; hareket kısıtı olan misafirler için önceden bilgi vermek gerekir.' },
      { time: '06:00', title: 'Uçuş', duration: '1 saat', badge: 'Ana program',
        text: 'Peribacalarının üzerinde bir saat. Rota rüzgâra göre belirlenir: Göreme, Kızıl Vadi, Güvercinlik ve Aşk Vadisi en sık uçulan hat. Yükseklik zaman zaman 50 metreye iner, zaman zaman 1.000 metreyi aşar.' },
      { time: '07:00', title: 'İniş, ikram ve sertifika', duration: '30 dk', badge: 'Dahil',
        text: 'Balon römorka indirilirken köpüklü ikram yapılır ve pilot imzalı uçuş sertifikası verilir. Fotoğraf-video paketi alındıysa kayıtlar aynı gün paylaşılır.' },
      { time: '07:45', title: 'Otele dönüş',
        text: 'Alındığınız noktaya bırakılırsınız. Program mevsime göre 08:00 – 08:30 arasında biter.' }
    ],

    /* Paketler: sepet büyüklüğü ve uçuş süresi. Kişi başı fiyatı bu
       seçim belirliyor; capacity aynı zamanda tek rezervasyonda
       seçilebilecek en fazla kişi sayısının üst sınırı. */
    packages: [
      {
        id: 'standart',
        name: 'Standart Sepet',
        key: 'kapadokyaBalon',
        capacity: 20,
        groupLabel: '16 – 20 kişi',
        duration: '60 dakika',
        perPerson: 2990,
        perPersonList: 3490,
        child: 2490,
        childList: 2890,
        features: ['60 dakika uçuş', 'Otelden alım ve bırakma', 'Kahvaltı ve köpüklü ikram',
                   'Uçuş sertifikası', 'Zorunlu uçuş sigortası'],
        note: 'En çok tercih edilen paket; sepet dört bölmeli, her bölmede dört-beş kişi.'
      },
      {
        id: 'konfor',
        name: 'Konfor Sepet',
        key: 'balonUcus',
        capacity: 12,
        groupLabel: '10 – 12 kişi',
        duration: '70 dakika',
        perPerson: 3790,
        perPersonList: 4290,
        child: 3190,
        childList: 3590,
        features: ['70 dakika uçuş', 'Daha geniş sepet bölmesi', 'Otelden alım ve bırakma',
                   'Kahvaltı ve köpüklü ikram', 'Uçuş sertifikası'],
        note: 'Bölme başına üç kişi; fotoğraf çekmek için kenar boşluğu daha rahat.'
      },
      {
        id: 'ozel',
        name: 'Özel Uçuş',
        key: 'guvercinlik',
        capacity: 4,
        groupLabel: '2 – 4 kişi',
        duration: '75 dakika',
        perPerson: 8900,
        perPersonList: 9900,
        child: 7900,
        childList: 8600,
        features: ['75 dakika uçuş', 'Sepette yalnızca sizin grubunuz', 'Pilotla rota tercihi',
                   'Otelden özel araçla alım', 'Uçuş sertifikası ve fotoğraf'],
        note: 'Evlilik teklifi ve yıldönümü için ayrı düzenleme yapılabilir; rezervasyon notuna yazın.'
      }
    ],

    /* Seanslar: aynı sabahın iki kalkışı. İkinci uçuş gün doğumundan
       sonra olduğu için daha ucuz — fark NEGATİF ve özet dökümünde
       indirim satırı olarak görünüyor. */
    sessions: [
      { id: 'gun-dogumu', label: 'Gün doğumu kalkışı', time: '≈ 05:45', fee: 0,
        note: 'İlk kalkış; güneş ufuktayken havadasınız' },
      { id: 'ikinci-tur', label: 'İkinci kalkış', time: '≈ 07:15', fee: -350,
        note: 'Gün doğumundan sonra; ışık daha sert, fiyat daha uygun' }
    ],

    /* Katılım şartları: cevabı "hayır" olan yerler de yazılı — sahada
       öğrenilen kural iptal demek. */
    requirements: [
      { icon: 'users',  title: 'Yaş',
        text: '6 yaş ve üzeri katılabilir. 6 – 11 yaş çocuklar indirimli tarifeden uçar ve refakatsiz kabul edilmez; her yetişkin en fazla iki çocuğa refakat edebilir.' },
      { icon: 'info',   title: 'Kilo ve boy',
        text: 'En fazla 120 kilogram. Sepet kenarı yaklaşık 1,20 metre; 1,10 metrenin altındaki çocuklar dışarıyı göremediği için uçuş önerilmiyor.' },
      { icon: 'shield', title: 'Sağlık',
        text: 'Hamileler, yakın zamanda ameliyat geçirenler ve alçısı olanlar uçamaz. Kalp ve tansiyon rahatsızlığı olan misafirlerin doktor onayı getirmesi gerekir.' },
      { icon: 'clock',  title: 'Hareket kabiliyeti',
        text: 'Sepete biniş basamak yardımıyla yapılır ve iniş sırasında kısa süre çömelmek gerekir. Tekerlekli sandalye kullanan misafirler için önceden bilgi verilmesi şart.' },
      { icon: 'close',  title: 'Alkol',
        text: 'Uçuş öncesi alkol alan misafirler sepete alınmaz; güvenlik kuralıdır ve ücret iadesi yapılmaz.' },
      { icon: 'camera', title: 'Ekipman',
        text: 'Telefon ve fotoğraf makinesi serbest; selfie çubuğu ve drone yasak. Sivil havacılık kuralı gereği kalkış alanında drone uçurulamaz.' }
    ],

    bring: [
      'Kapalı ve düz tabanlı ayakkabı — iniş alanı toprak',
      'İnce mont veya polar; sabah 500 metrede hava serin',
      'Güneş gözlüğü (gün doğumu kalkışında ufuk parlak)',
      'Kimlik veya pasaport',
      'Şapka takmayın — brülör ısısı ve rüzgâr nedeniyle sepette istenmiyor'
    ],

    important: [
      'Uçuş hava koşuluna bağlıdır. Rüzgâr, görüş veya yağış uygun değilse kalkış yapılmaz; karar sabah kalkış alanında pilot tarafından verilir.',
      'Hava nedeniyle iptalde ücretin tamamı iade edilir ya da uygun ilk sabaha aktarılır; aradaki fark talep edilmez.',
      'Kapadokya’da balonlar Sivil Havacılık Genel Müdürlüğü kotasıyla uçar; yoğun dönemde (nisan – ekim) yer bulmak için en az bir hafta önce rezervasyon önerilir.',
      'Alım saati bir gün önce akşam mesajla teyit edilir; otel resepsiyonuna da bildirilir.',
      'Uçuş süresi hava koşuluna göre 45 – 75 dakika arasında değişebilir; 45 dakikanın altında kalan uçuşlarda fark iade edilir.'
    ],

    meeting: {
      title: 'Otelden alım — Göreme ve çevresi',
      address: 'Göreme, Ürgüp, Uçhisar, Avanos ve Çavuşin’deki oteller; kalkış alanı Göreme çıkışı',
      note: 'Alım saatleri gün doğumuna göre her hafta kayar; bir gün önce akşam saat teyidi gönderilir. Otelinizin araç giremeyeceği bir sokakta olması hâlinde en yakın buluşma noktası mesajda belirtilir.',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=G%C3%B6reme%20Nev%C5%9Fehir',
      points: [
        { time: '04:30', name: 'Göreme merkez otelleri', detail: 'İlk alım noktası' },
        { time: '04:45', name: 'Uçhisar ve Çavuşin', detail: 'Yol üzeri' },
        { time: '05:00', name: 'Ürgüp ve Avanos', detail: 'Son alım; kalkış alanına 20 dakika' }
      ],
      dropoff: '08:00 – 08:30 arasında alındığınız noktaya bırakılırsınız.'
    },

    cancellation: {
      tiers: [
        { minHours: 48, rate: 1,   label: '48 saat ve öncesi', text: 'Ücretin tamamı iade edilir.' },
        { minHours: 24, rate: 0.5, label: '24 – 48 saat arası', text: 'Ücretin yarısı iade edilir.' },
        { minHours: 0,  rate: 0,   label: 'Son 24 saat',        text: 'İade yapılmaz; uygun ilk sabaha aktarım için destek hattını arayın.' }
      ],
      /* Hava iptali misafir iptalinden AYRI ve koşulsuz: 1 = tam iade.
         Tek yerde duruyor, sayfa ve test aynı değeri okuyor. */
      weatherRefund: 1,
      note: 'Hava koşulu nedeniyle uçuş yapılamazsa ücretin tamamı iade edilir; dilerseniz ek ücret olmadan uygun ilk sabaha aktarılır. Bu karar kalkış alanında verilir ve misafir iptali sayılmaz.',
      exampleTotal: 2990
    },

    pricing: {
      unitNote: 'kişi başı',
      maxGuests: 8,
      /* Refakatsiz çocuk kabul edilmiyor; bir yetişkin en fazla iki
         çocuğa refakat edebilir. */
      childrenPerAdult: 2,
      childAges: '6 – 11 yaş',
      minAge: 6,
      maxWeight: 120,
      leadDays: 1,
      /* Her sabah uçuş var; takvimde bütün günler seçilebilir. */
      operatingNote: 'Her sabah, hava koşuluna bağlı',
      seatsPerSession: 20
    },

    addons: [
      { id: 'fotoVideo',    per: 'booking', price: 1200, label: 'Fotoğraf ve video paketi',
        text: 'Kalkıştan inişe çekim, aynı gün dijital teslim' },
      { id: 'ozelTransfer', per: 'booking', price: 900,  label: 'Özel araç transferi',
        text: 'Gruptan ayrı, size özel araçla alım ve bırakma' },
      { id: 'hediyePaketi', per: 'guest',   price: 350,  label: 'Hediye paketi',
        text: 'Çerçeveli sertifika, madalyon ve fotoğraf baskısı' }
    ],

    trust: [
      { icon: 'bolt',    text: 'Anında onay — yer hemen ayrılır' },
      { icon: 'refresh', text: 'Hava koşulunda koşulsuz tam iade' },
      { icon: 'shield',  text: 'Lisanslı pilot ve zorunlu uçuş sigortası' }
    ],

    social: { viewedLast24h: 84, bookedThisWeek: 46 },

    ratingBreakdown: { 5: 1480, 4: 132, 3: 24, 2: 9, 1: 7 },

    ratingAspects: [
      { label: 'Manzara',            value: 4.9 },
      { label: 'Pilot',              value: 4.9 },
      { label: 'Organizasyon',       value: 4.7 },
      { label: 'Fiyat / performans', value: 4.5 }
    ],

    reviews: [
      { name: 'İrem Aktaş', date: '2026-09-14', rating: 5, party: 'Çift olarak',
        title: 'Sabahın körü ama her dakikası değdi',
        text: '04:30’da alındık, açıkçası uykusuz olacağız diye çekinmiştik. Şişirme aşamasını izlemek bile başlı başına bir şey. Pilot balonu peribacalarının arasına indirip sonra tekrar yükseltti, o an herkes sustu. İniş çok yumuşaktı, sertifikayı da hemen verdiler.' },
      { name: 'Serkan Uçar', date: '2026-09-08', rating: 5, party: 'Ailece',
        title: 'Konfor sepeti çocuklu aile için doğru seçim',
        text: '9 ve 12 yaşında iki çocukla uçtuk. Standartta bölme başına beş kişi varmış, konforda üç; çocuklar kenardan rahat baktı. Kahvaltı basit ama sıcak çay iyi geldi. Fotoğraf paketini aldık, akşam olmadan bütün kareler telefona düştü.' },
      { name: 'Aylin Gür', date: '2026-08-30', rating: 4, party: 'Arkadaş grubu',
        title: 'Uçuş harika, bekleme uzun',
        text: 'Uçuşun kendisine söyleyecek söz yok. Ama kalkış alanında rüzgâr ölçümü nedeniyle 40 dakika bekledik, kimse bilgi vermedi. Sonunda uçtuk ve pilot gecikmeyi telafi etmek için biraz uzun uçurdu. Bilgilendirme biraz daha iyi olabilir.' },
      { name: 'Murat Şen', date: '2026-08-22', rating: 5, party: 'Tek başına',
        title: 'İkinci kalkış da gayet iyi',
        text: 'Gün doğumu kalkışı doluydu, ikinci turu aldım ve 350 TL daha ucuza geldi. Işık daha sert, o doğru; ama vadiler yine muhteşem ve balon sayısı azaldığı için gökyüzü daha sakin. Bütçesi kısıtlı olan tereddüt etmesin.' },
      { name: 'Ceyda Korkmaz', date: '2026-08-11', rating: 5, party: 'Çift olarak',
        title: 'Hava iptalinde para aynı gün iade edildi',
        text: 'İlk sabah rüzgâr yüzünden uçulmadı, alanda söylediler. İki seçenek sundular: tam iade ya da ertesi sabah. Ertesi sabahı seçtik, fark istemediler ve o gün hava mükemmeldi. Sözünü tutan bir işletme.' },
      { name: 'Barış Ertem', date: '2026-07-29', rating: 3, party: 'Ailece',
        title: 'Kalabalık sepet beklediğimden sıkışıktı',
        text: 'Standart pakette 20 kişiydik, bölmede beş kişi olunca fotoğraf çekmek için sıra beklemek gerekti. Uçuş ve pilot iyiydi. Bir dahakine konfor sepetini alırım; aradaki fark bence gerçekten karşılığını veriyor.' },
      { name: 'Ece Duran', date: '2026-07-18', rating: 5, party: 'Çift olarak',
        title: 'Özel uçuşta teklif ettim',
        text: 'Evlilik teklifi için özel uçuş aldık. Pilotla önceden konuşmuşlar, doğru anda sepeti Aşk Vadisi üzerine getirdi ve fotoğrafçı her şeyi çekti. Pahalı ama tek seferlik bir an için doğru karar oldu.' },
      { name: 'Kemal Aydoğan', date: '2026-07-05', rating: 5, party: 'Arkadaş grubu',
        title: 'Otelden alım saatinde geldi',
        text: 'Ürgüp’te kalıyorduk, 05:00 dediler 04:58’de kapıdaydılar. Dönüşte de otele bıraktılar, taksi derdi olmadı. Kapadokya’ya gelip bunu yapmadan dönmeyin.' }
    ],

    faq: [
      { q: 'Uçuş hava nedeniyle iptal olursa ne oluyor?',
        a: 'Karar kalkış alanında pilot tarafından verilir. Uçuş yapılamazsa ücretin tamamı iade edilir ya da ek ücret olmadan uygun ilk sabaha aktarılır. Bu bir misafir iptali sayılmaz, iade kademelerine girmez.' },
      { q: 'Yükseklik korkum var, uçabilir miyim?',
        a: 'Balon uçuşu yükseklik korkusu olan çoğu kişi için sanıldığından kolaydır: sepet sallanmaz, titreşim yoktur ve kenarı göğüs hizasındadır. Rüzgârla aynı hızda gittiğiniz için sepette rüzgâr hissedilmez. Yine de tedirginseniz pilota söyleyin, sizi sepetin iç tarafına alır.' },
      { q: 'Kalkış saati neden her gün değişiyor?',
        a: 'Uçuş gün doğumuna göre planlanır ve gün doğumu her hafta kayar. Yaz aylarında alım 04:00’a kadar erkene, kış aylarında 05:30’a kadar geçe gidebilir. Kesin saat bir gün önce akşam mesajla teyit edilir.' },
      { q: 'Çocuklar katılabilir mi?',
        a: '6 yaş ve üzeri çocuklar indirimli tarifeden uçabilir. Refakatsiz çocuk kabul edilmiyor ve bir yetişkin en fazla iki çocuğa refakat edebilir. Sepet kenarı yaklaşık 1,20 metre olduğu için 1,10 metrenin altındaki çocuklar dışarıyı göremiyor; bu boyun altındaki çocuklar için uçuş önerilmiyor.' },
      { q: 'Standart ile konfor sepet arasındaki fark ne?',
        a: 'Standart sepette 16 – 20 kişi uçar, bölme başına dört-beş kişi düşer ve uçuş 60 dakikadır. Konfor sepette 10 – 12 kişi olur, bölme başına üç kişi düşer ve uçuş 70 dakika sürer. Manzara aynı; fark sepetteki yer ve süre.' },
      { q: 'Otelden alım fiyata dahil mi?',
        a: 'Evet. Göreme, Ürgüp, Uçhisar, Avanos ve Çavuşin’deki otellerden alım ve uçuş sonrası bırakma fiyata dahildir. Gruptan ayrı, size özel araç isterseniz rezervasyon kartından özel transfer seçeneğini ekleyebilirsiniz.' }
    ],

    /* href taşıyan kayıt gerçek bir içerik sayfasına gider; taşımayan
       kayıt anasayfaya. Tur ve otel sayfalarındaki "similar" alanından
       farkı: burada adres doğrudan yazılır, çünkü benzer içerik başka
       bir TÜRDEN de olabiliyor (tur, otel, aktivite). */
    similar: [
      { key: 'kapadokyaBalon', href: 'tur/kapadokya-3-gece/', title: 'Kapadokya Turu — 3 Gece 4 Gün',
        meta: 'Uçaklı · 3 gece', rating: '4,7', price: 8990, unit: 'kişi başı' },
      { key: 'uchisar',  title: 'Kapadokya Gün Batımı ATV Turu', meta: 'Göreme çıkışlı · 2 saat',
        rating: '4,7', price: 750, unit: 'kişi başı' },
      { key: 'goreme',   title: 'Göreme Açık Hava Müzesi Turu',  meta: 'Rehberli · 3 saat',
        rating: '4,8', price: 620, unit: 'kişi başı' },
      { key: 'kizilVadi', title: 'Kızıl Vadi Gün Batımı Yürüyüşü', meta: 'Çavuşin çıkışlı · 3 saat',
        rating: '4,6', price: 480, unit: 'kişi başı' }
    ],

    /* Sayfa etiketleri: hepsi gerçek bir hedefe gidiyor — anasayfadaki
       şerit çapası, bu sayfanın bölümü ya da yazılmış bir içerik
       sayfası. docs/seo-arastirma.md madde 4. */
    tags: [
      { label: 'Aktiviteler',          href: 'index.html#aktiviteler' },
      { label: 'Konaklamalı turlar',   href: 'index.html#konaklamali-turlar' },
      { label: 'Günübirlik turlar',    href: 'index.html#turlar' },
      { label: 'Oteller',              href: 'index.html#oteller' },
      { label: 'Uçuş paketleri',       href: '#paketler' },
      { label: 'Sabahın programı',     href: '#program' },
      { label: 'Katılım şartları',     href: '#bilgiler' },
      { label: 'Buluşma ve alım',      href: '#bulusma' },
      { label: 'Uçanlar ne diyor',     href: '#yorumlar' },
      { label: 'Kapadokya turu',       href: 'tur/kapadokya-3-gece/' }
    ]
  }
};

const DEFAULT_ACTIVITY_SLUG = 'kapadokya-balon-turu';


if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ACTIVITY_IMAGE_FILES,
    ACTIVITIES,
    DEFAULT_ACTIVITY_SLUG,
    activityImage,
    activityPackage,
    activitySession,
    clampActivityParty,
    activityAddonLines,
    calcActivityTotal,
    activityPriceFrom,
    activityListPriceFrom,
    weatherRefundAmount,
    activitySlugFromPath
  };
}
