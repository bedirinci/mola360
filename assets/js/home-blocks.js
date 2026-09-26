/* ---------------- anasayfa ara bloklari ----------------
   Kart seritlerinin arasina giren bloklarin verisi, saf yardimcilari ve
   isaretlemesi. app.js'ten ONCE yuklenir; isaretleme uretici fonksiyonlar
   app.js'teki svg() ve cardImages'i cagrildiklari anda kullanir.

   Bloklarin sayfadaki yeri HOME_BLOCK_PLACEMENT ile belirlenir: anahtar
   kart seridinin basligi, deger o seritten SONRA gelecek bloklar.
   Bir blogu kaldirmak icin buradaki satirini silmek yeterli. */

const HOME_BLOCK_PLACEMENT = {
  'Yaklaşan Planlar': ['promo'],
  'Günübirlik Turlar': ['themes'],
  'Aktiviteler': ['venues'],
  'Oteller': ['collectionGrid', 'newsletter', 'support', 'seo']
};

/* ---- Yaklasan Etkinlikler seridideki zaman filtreleri ----
   Ilk siradaki secenek varsayilan olarak acilir. */
const UPCOMING_FILTERS = [
  { key: 'tumu',      label: 'Tümü' },
  { key: 'cuma',      label: 'Bu Cuma' },
  { key: 'cumartesi', label: 'Bu Cumartesi' },
  { key: 'pazar',     label: 'Bu Pazar' }
];

/* Gun filtreleri: kayittaki dayKey bu anahtarlarla eslesir. */
const UPCOMING_DAY_KEYS = ['cuma', 'cumartesi', 'pazar'];

/* ---- Temalar ve koleksiyonlar ----
   Liste taxonomy-data.js'ten (temalar NE yapmak istediğin, koleksiyonlar
   KİMİNLE / nasıl bir kaçamak). Bu dosya ondan ÖNCE yüklendiği için
   listeler çağrı anında okunuyor.

   Tema kartındaki sayı temadaki ürünlerden HESAPLANIYOR
   (MolaVeri.temaUrunleri). Önceki sürümde "31 tur", "15 etkinlik" gibi
   sayılar elle yazılıydı ve hiçbir ürüne karşılık gelmiyordu. Ürünü
   olmayan tema anasayfada GÖSTERİLMİYOR: "0 tur" yazan bir kart boş kutu. */
const HB_NODE = (typeof require === 'function' && typeof module !== 'undefined' && module.exports);
const HB_TAKSONOMI = HB_NODE ? require('./taxonomy-data.js') : null;
const HB_KAPI = HB_NODE ? require('./data-gateway.js') : null;

function hbTaksonomi(ad) {
  if (HB_TAKSONOMI && HB_TAKSONOMI[ad]) return HB_TAKSONOMI[ad];
  if (ad === 'TAXONOMY_THEMES' && typeof TAXONOMY_THEMES !== 'undefined') return TAXONOMY_THEMES;
  if (ad === 'TAXONOMY_COLLECTIONS' && typeof TAXONOMY_COLLECTIONS !== 'undefined') return TAXONOMY_COLLECTIONS;
  return [];
}
function hbKapi() {
  if (HB_KAPI && HB_KAPI.MolaVeri) return HB_KAPI.MolaVeri;
  return (typeof MolaVeri !== 'undefined') ? MolaVeri : null;
}

const TEMA_BIRIMLERI = { tour: 'tur', hotel: 'otel', activity: 'aktivite', event: 'etkinlik', venue: 'mekan' };

/* "12 tur", "4 etkinlik"; farklı tipler karışıksa "9 seçenek". Birim
   ürünlerin kendisinden; karışık bir listeye "tur" demek yanlış olurdu. */
function temaSayisiMetni(urunler, kapi) {
  const tipler = new Set(urunler.map(u => kapi.icerikTipi(u)));
  const birim = tipler.size === 1 ? TEMA_BIRIMLERI[[...tipler][0]] : 'seçenek';
  return urunler.length + ' ' + birim;
}

function homeThemeCards(bugun) {
  const kapi = hbKapi();
  if (!kapi) return [];
  return hbTaksonomi('TAXONOMY_THEMES').map(t => {
    const urunler = kapi.temaUrunleri(t.slug, bugun);
    return { slug: t.slug, img: t.img, title: t.name, adet: urunler.length,
             count: urunler.length ? temaSayisiMetni(urunler, kapi) : '' };
  }).filter(t => t.adet > 0);
}

function homeCollectionCards() {
  return hbTaksonomi('TAXONOMY_COLLECTIONS').map(c => ({ slug: c.slug, img: c.img, title: c.name, text: c.text }));
}

/* ---- Mekanlar ----
   Diger seritlerden farkli olarak dikey liste: gorsel solda, bilgi sagda.
   open:true olan mekan "Açık" rozetiyle isaretlenir. */
/* ---- Mekanlar: Izmir ----
   Her mekanin kendi fotografi var; gorseller Wikimedia Commons'tan,
   dosya adi konuyu anlatacak sekilde secildi. Kaynak ve lisans listesi:
   docs/gorsel-kaynaklari.md */
const VENUES = [
  { img:'efes',    type:'Ören Yeri',    title:'Efes Antik Kent',        area:'Selçuk, İzmir',   rating:'4.9', reviews:'12b+',  hours:'08:00 – 19:00', open:true },
  { img:'kemeralti', type:'Çarşı',      title:'Kemeraltı Çarşısı',      area:'Konak, İzmir',    rating:'4.7', reviews:'6,4b+', hours:'09:00 – 20:00', open:true },
  { img:'izmirKordon', type:'Sahil',    title:'Kordon Boyu',            area:'Alsancak, İzmir', rating:'4.8', reviews:'9,1b+', hours:'Her zaman açık', open:true },
  { img:'alacati', type:'Gezi Noktası', title:'Alaçatı Yel Değirmenleri', area:'Çeşme, İzmir',    rating:'4.7', reviews:'3,2b+', hours:'Her zaman açık', open:true },
  { img:'izmirKonak', type:'Tarihi Doku', title:'Saat Kulesi ve Konak Meydanı', area:'Konak, İzmir', rating:'4.6', reviews:'5,8b+', hours:'Her zaman açık', open:true },
  { img:'izmirMuze', type:'Müze',       title:'İzmir Arkeoloji Müzesi', area:'Konak, İzmir',    rating:'4.5', reviews:'740+',  hours:'08:30 – 17:30', open:false }
];

/* ---- Kampanyalar (yatay kaydirilabilir) ---- */
const PROMO_BANDS = [
  { img:'karadeniz2', badge:'Son 3 gün',         title:'Yayla ve doğa turlarında %40\'a varan indirim', text:'Eylül sonuna kadar seçili Karadeniz turlarında geçerli.', cta:'Fırsatları gör' },
  { img:'kapadokya',  badge:'Erken rezervasyon', title:'Kapadokya turlarında 500 TL indirim',           text:'30 gün öncesinden alan herkese, tüm kalkışlarda.',        cta:'Turları gör' },
  { img:'hotel4',     badge:'Hafta sonu',        title:'Otellerde 2 gece kal, 1 gece öde',              text:'Seçili termal ve şehir otellerinde geçerli.',             cta:'Otelleri gör' },
  { img:'balloon3',   badge:'Yeni üyelere',      title:'İlk rezervasyonda %15 indirim',                 text:'Üye ol, indirim kodu e-postana gelsin.',                  cta:'Üye ol' }
];

/* ---- Bulten karti: kisa fayda listesi ---- */
const NEWSLETTER_PERKS = [
  'Üyelere özel indirim kodları',
  'Haftada tek e-posta, spam yok',
  'Tek tıkla çıkış'
];

/* ---- Iletisim bilgileri (tek yerden degistirilir) ---- */
const CONTACT = {
  phoneLabel: '0850 000 00 00',
  phoneHref: 'tel:+908500000000',
  /* Telefon hattinin saatleri. Yalnizca ekranda yaziyor, bir mantigi
     beslemiyor. */
  hours: 'Her Gün 09:00 – 22:00',
  whatsappHref: 'https://wa.me/900000000000',
  /* WhatsApp'in saatleri TELEFONDAN AYRI ve daha genis: 08:00 - 23:59.
     Bunlar ekranda yazmiyor, WhatsApp kartindaki yesil isigi besliyor.

     Kapanis 24: "gece yarisina kadar" demek. 23:59'da isik hala yanmali,
     bu yuzden 23.98 gibi bir deger degil 24 yazildi -- supportOnline
     ust siniri disarida biraktigi icin (saat < kapanis) 23:59:59'a
     kadar acik, 00:00'da kapali oluyor. */
  whatsappOpenHour: 8,
  whatsappCloseHour: 24
};

/* Destek su anda acik mi? Saatler TURKIYE saatine gore; ziyaretcinin
   cihaz saati baska bir ulkede olabilir, o yuzden yerel saat degil
   Europe/Istanbul okunuyor.

   Saf fonksiyon: "simdi"yi disaridan aliyor, boylece test edilebiliyor. */
function supportOnline(simdi, acilis, kapanis) {
  const saat = istanbulSaati(simdi);
  if (saat === null) return false;          // saat okunamadiysa "acik" deme
  return saat >= acilis && saat < kapanis;
}

/* Verilen anin Turkiye'deki saatini (0-23, ondalikli) dondurur. */
function istanbulSaati(simdi) {
  try {
    const parcalar = new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(simdi);
    const al = (tur) => Number(parcalar.find(p => p.type === tur).value);
    const s = al('hour'), d = al('minute');
    if (!Number.isFinite(s) || !Number.isFinite(d)) return null;
    return s + d / 60;
  } catch (e) {
    return null;
  }
}

/* WhatsApp logosu. Dis baloncuk r=10, ic delik r=8.13, ikisi de (12.04,12)
   merkezli -- halka her noktada ayni kalinlikta (~1.87).

   Onceki surumde ic yayin BASLANGIC NOKTASI merkeze 8.39 uzaktaydi, yani
   kendi dairesinin disindaydi. SVG yayi iki uc noktadan gecmek zorunda
   oldugu icin merkez (12.06, 12.60)'a kayiyor, delik asagi iniyor ve
   halka TEPEDE 2.48 / DIPTE 1.27 birim cikiyordu: kucuk olculerde iki
   ikon ust uste binmis gibi gorunuyordu. Iki baloncuk konturu bu yuzden
   tam geometriyle yeniden uretildi; ahize alt yolu aynen korundu. */
const WHATSAPP_ICON_PATH = 'M3.319 16.894L2 22L7.222 20.763A10 10 0 1 0 3.319 16.894ZM4.95 15.979A8.13 8.13 0 1 1 8.123 19.124L4.14 19.46ZM16.51 14.05c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3s-.85.83-.85 2.02.87 2.35.99 2.51c.12.16 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z';

/* ---------------- saf yardimcilar ---------------- */

/* Yaklasan etkinlikler her durumda en yakin tarihten uzaga dogru siralanir;
   filtre yalnizca hangilerinin listelenecegini belirler. */
function filterUpcomingItems(items, key) {
  const list = Array.isArray(items) ? items : [];
  const byDistance = (a, b) => (Number(a.inDays) || 0) - (Number(b.inDays) || 0);
  const sonuc = UPCOMING_DAY_KEYS.includes(key)
    ? list.filter(item => item.dayKey === key)
    : list;
  return sonuc.slice().sort(byDistance);
}

/* Basit ve sert olmayan bir kontrol: bosluk yok, tek @, alan adinda nokta. */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

/* Turkiye numarasi: bosluk/parantez/tire serbest, basindaki 0 veya +90
   atilir, geriye 10 hane kalmalidir. */
function isValidPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('90')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return /^[1-9]\d{9}$/.test(digits);
}

function homeBlockImage(key) {
  const map = (typeof cardImages !== 'undefined' && cardImages) ? cardImages : {};
  return map[key] || ('https://picsum.photos/seed/' + key + '/600/400');
}

/* ---------------- isaretleme ---------------- */
/* Aciklama satiri yalnizca verildiginde eklenir; diger bolumlerin
   basligi oldugu gibi kalir. */
function homeSectionHead(title, link, subtitle) {
  const baslik = subtitle
    ? `<div class="section-head-text"><h2>${title}</h2><p class="section-subtitle">${subtitle}</p></div>`
    : `<h2>${title}</h2>`;
  return `<div class="section-head">${baslik}${link ? `<a class="see-all" href="#">${link} <span class="icon">${svg('chevRight')}</span></a>` : ''}</div>`;
}

/* =======================================================================
   ANASAYFA ALT SEO BLOGU
   Iki isi birden yapar:
   1) Uzun, baslikli tanitim metni (klasik "alt SEO yazisi").
   2) Yogun ic baglanti agi: her sehir/kategori/tema/donem kombinasyonu
      kendi hub sayfasina gider. Uzun kuyruk trafigi metinden degil bu
      agdan gelir; metin tek basina siralama getirmez.
   Baglantilar simdilik hash rotalari; gercek SEO degeri icin her birinin
   sunucu tarafindan servis edilen, taranabilir bir URL'e donmesi gerekir.
   ======================================================================= */

/* Ic baglanti agi. Her grup bir sutun olur; tek tek satir silinerek
   veya eklenerek buyutulup kucultulebilir. */
const SEO_LINK_GROUPS = [
  {
    title: 'Şehre göre',
    links: [
      { label: 'İstanbul etkinlikleri',      href: '#/istanbul-etkinlikleri' },
      { label: 'Bursa etkinlikleri',         href: '#/bursa-etkinlikleri' },
      { label: 'İzmir turları',              href: '#/izmir-turlari' },
      { label: 'Ankara konserleri',          href: '#/ankara-konserleri' },
      { label: 'Antalya otelleri',           href: '#/antalya-otelleri' },
      { label: 'Muğla tekne turları',        href: '#/mugla-tekne-turlari' },
      { label: 'Trabzon yayla turları',      href: '#/trabzon-yayla-turlari' },
      { label: 'Rize yayla turları',         href: '#/rize-yayla-turlari' },
      { label: 'Nevşehir balon turları',     href: '#/nevsehir-balon-turlari' },
      { label: 'Çanakkale günübirlik turlar',href: '#/canakkale-gunubirlik-turlar' },
      { label: 'Denizli termal otelleri',    href: '#/denizli-termal-otelleri' },
      { label: 'Balıkesir bungalov evleri',  href: '#/balikesir-bungalov' }
    ]
  },
  {
    title: 'Kategoriye göre',
    links: [
      { label: 'Konser biletleri',           href: '#/konser-biletleri' },
      { label: 'Festival biletleri',         href: '#/festival-biletleri' },
      { label: 'Tiyatro biletleri',          href: '#/tiyatro-biletleri' },
      { label: 'Stand up biletleri',         href: '#/stand-up-biletleri' },
      { label: 'Günübirlik turlar',          href: '#/gunubirlik-turlar' },
      { label: 'Yurt içi turlar',            href: '#/yurt-ici-turlar' },
      { label: 'Kültür turları',             href: '#/kultur-turlari' },
      { label: 'Butik oteller',              href: '#/butik-oteller' },
      { label: 'Termal oteller',             href: '#/termal-oteller' },
      { label: 'Bungalov & doğa evleri',     href: '#/bungalov-doga-evleri' },
      { label: 'Aktiviteler & atölyeler',    href: '#/aktiviteler' },
      { label: 'Müze ve ören yerleri',       href: '#/muze-oren-yerleri' },
      { label: 'İzmir gezilecek yerler',     href: '#/izmir-gezilecek-yerler' },
      { label: 'Efes Antik Kent',            href: '#/efes-antik-kent' }
    ]
  },
  {
    title: 'Temaya göre',
    links: [
      { label: 'Doğa & yayla turları',       href: '#/doga-yayla-turlari' },
      { label: 'Kültür & tarih turları',     href: '#/kultur-tarih-turlari' },
      { label: 'Deniz & tekne turları',      href: '#/deniz-tekne-turlari' },
      { label: 'Kış sporları & kayak',       href: '#/kis-sporlari-kayak' },
      { label: 'Gastronomi turları',         href: '#/gastronomi-turlari' },
      { label: 'Macera & adrenalin',         href: '#/macera-adrenalin' },
      { label: 'Yamaç paraşütü',             href: '#/yamac-parasutu' },
      { label: 'Sıcak hava balonu',          href: '#/sicak-hava-balonu' },
      { label: 'Rafting turları',            href: '#/rafting-turlari' },
      { label: 'Dalış turları',              href: '#/dalis-turlari' },
      { label: 'Fotoğraf turları',           href: '#/fotograf-turlari' },
      { label: 'Kamp & karavan',             href: '#/kamp-karavan' }
    ]
  },
  {
    title: 'Plana göre',
    links: [
      { label: 'Bu hafta sonu ne var?',      href: '#/bu-hafta-sonu' },
      { label: 'Bu Cuma',                    href: '#/bu-cuma' },
      { label: 'Bu Cumartesi',               href: '#/bu-cumartesi' },
      { label: 'Bu Pazar',                   href: '#/bu-pazar' },
      { label: 'Son dakika fırsatları',      href: '#/son-dakika-firsatlari' },
      { label: 'Uzun hafta sonu planları',   href: '#/uzun-hafta-sonu' },
      { label: 'Ailece gezilecek yerler',    href: '#/ailece' },
      { label: 'Romantik kaçamaklar',        href: '#/romantik-kacamaklar' },
      { label: 'Bütçe dostu planlar',        href: '#/butce-dostu' },
      { label: 'Tek başına seyahat',         href: '#/tek-basina-seyahat' },
      { label: 'Arkadaş grubuyla',           href: '#/arkadas-grubu' },
      { label: 'Yeni başlayanlar için',      href: '#/yeni-baslayanlar' }
    ]
  }
];

/* Uzun kuyruk arama ifadeleri. Kullanicinin gercekte aradigi cumleler;
   her biri bir hub sayfasina baglanir. */
const SEO_RELATED_SEARCHES = [
  { label: 'kapadokya balon turu fiyatları',      href: '#/kapadokya-balon-turu-fiyatlari' },
  { label: 'bursa hafta sonu kaçamağı',           href: '#/bursa-hafta-sonu-kacamagi' },
  { label: 'istanbul yakınında günübirlik turlar',href: '#/istanbul-gunubirlik-turlar' },
  { label: 'uludağ kayak paketi',                 href: '#/uludag-kayak-paketi' },
  { label: 'ayder yaylası turu',                  href: '#/ayder-yaylasi-turu' },
  { label: 'pamukkale termal tatili',             href: '#/pamukkale-termal-tatili' },
  { label: 'bodrum tekne turu günübirlik',        href: '#/bodrum-tekne-turu' },
  { label: 'efes antik kent turu',                href: '#/efes-antik-kent-turu' },
  { label: 'fethiye yamaç paraşütü',              href: '#/fethiye-yamac-parasutu' },
  { label: 'çeşme konser takvimi',                href: '#/cesme-konser-takvimi' },
  { label: 'ucuz konser bileti',                  href: '#/ucuz-konser-bileti' },
  { label: 'çocuklu aileler için gezi',           href: '#/cocuklu-aileler-icin-gezi' },
  { label: 'sevgililer günü kaçamağı',            href: '#/sevgililer-gunu' },
  { label: 'bayram tatili turları',               href: '#/bayram-tatili-turlari' },
  { label: 'doğada bungalov tatili',              href: '#/bungalov-tatili' },
  { label: 'İzmir çevresi gezilecek yerler',      href: '#/izmir-cevresi-gezilecek-yerler' },
  { label: 'karadeniz yayla turu 3 gün',          href: '#/karadeniz-yayla-turu' },
  { label: 'son dakika otel fırsatı',             href: '#/son-dakika-otel' },
  { label: 'açık hava sineması etkinlikleri',     href: '#/acik-hava-sinemasi' },
  { label: 'kahve ve gastronomi festivali',       href: '#/gastronomi-festivali' },
  { label: 'izmir kemeraltı çarşısı',             href: '#/izmir-kemeralti' },
  { label: 'alaçatı taş sokaklar',                href: '#/alacati-tas-sokaklar' },
  { label: 'aspendos opera ve bale festivali',    href: '#/aspendos-festivali' },
  { label: 'erciyes kayak paketi',                href: '#/erciyes-kayak-paketi' }
];

/* Uzun tanitim metni.
   Yapisi arastirmaya gore kuruldu (bkz. docs/seo-arastirma.md):
   - Her bolum KENDI BASINA anlasilan 130-170 kelimelik bir pasaj. Uretken
     arama motorlari sayfayi butun olarak degil, bolum bolum alip
     puanliyor; bu araliktaki pasajlar belirgin sekilde daha cok aliniyor.
   - Basliklar SORU bicimli; kullanicinin yazdigi sorguya dogrudan eslesir.
   - Pasajlarda adi gecen yer/marka sayisi (varlik yogunlugu) bilinerek
     yuksek tutuldu; secilme olasiligini en cok bu belirliyor.
   Ilk bolum acilista gorunur, geri kalani "Devamını oku" ile acilir;
   metnin tamami her zaman DOM'da durur ki gizlenmis icerik olmasin. */
const SEO_ARTICLE = [
  {
    h: 'mola360 nedir, ne işe yarar?',
    p: [
      'mola360, Türkiye genelindeki etkinlikleri, turları, otelleri, aktiviteleri ve gezilecek mekanları tek bir aramada toplayan bir gezi ve rezervasyon platformudur. İstanbul\'daki bir konser bileti, Kapadokya\'da balon turu, Antalya\'da rafting ve İzmir\'de bir hafta sonu kaçamağı aynı listede yan yana çıkar.',
      'Amacımız "bu hafta sonu ne yapsak?" sorusunu onlarca sekme açmadan yanıtlamak. Bunun için etkinlik takvimini, tur programlarını ve konaklama seçeneklerini aynı ekranda birleştiriyor; her planın tarihini, süresini, kalkış şehrini ve fiyatını ilk bakışta görebileceğiniz biçimde gösteriyoruz.',
      'Listelenen her tur, etkinlik ve tesis; program içeriği, iptal koşulları ve iletişim bilgileri kontrol edildikten sonra yayına alınır. Puanlar yalnızca o planı gerçekten satın almış kullanıcılardan toplanır, bu yüzden listelerdeki 4,5 ve üzeri puanlar gerçek deneyimi yansıtır.',
      'Platform mobilde ve masaüstünde aynı içeriği sunar. Arama kutusuna doğrudan bir yer adı (Kapadokya, Alaçatı, Uludağ), bir kategori (konser bileti, günübirlik tur, termal otel) veya bir tarih aralığı yazabilirsiniz; sonuçlar üç başlıkta toplanır ve tek dokunuşla filtrelenir.'
    ]
  },
  {
    h: 'Etkinlik ve konser bileti nasıl alınır?',
    p: [
      'Konser, festival, tiyatro ve stand up biletleri mola360 üzerinden dakikalar içinde alınır. Etkinliği arama kutusundan veya şehir takviminden bulun, kategori ve kişi sayısını seçin, ödeme adımında varsa kupon kodunuzu uygulayın. Onaydan sonra karekodlu e-bilet hesabınızdaki Biletlerim bölümüne ve e-postanıza düşer; çıktı almanız gerekmez.',
      'Şehir takvimleri sayesinde İstanbul Harbiye Cemil Topuzlu Açıkhava Sahnesi, Ankara Jolly Joker, İzmir Alsancak ve Antalya Aspendos Antik Tiyatro gibi mekanlarda o hafta sahne alan programları tek sayfada görebilirsiniz.',
      'Her etkinlik sayfasında salon yerleşimi, kapı açılış saati ve yaş sınırı ayrı ayrı yazar. Popüler konserlerde kontenjan hızlı dolduğu için favorilediğiniz etkinliklerde son biletlere yaklaşıldığında bildirim gönderilir.',
      'Bilet fiyatı kategoriye ve sahneye uzaklığa göre değişir. Sahne yerleşimi olan etkinliklerde koltuk bloklarını fiyatlarıyla birlikte görür, seçiminizi ödeme adımından önce değiştirebilirsiniz. Öğrenci, erken kuş ve grup indirimleri varsa aynı ekranda listelenir.'
    ]
  },
  {
    h: 'Günübirlik tur ile konaklamalı tur arasındaki fark nedir?',
    p: [
      'Günübirlik turlar tek güne sığar: sabah kalkış, akşam dönüş. Ulaşım ve rehberlik fiyata dahildir, çoğu programda öğle yemeği de vardır. İstanbul çıkışlı Şile ve Ağva turu, İzmir çıkışlı Cunda Adası ve Ayvalık turu, Ankara çıkışlı Abant ve Gölcük turu ile Bursa çıkışlı İznik Gölü turu en çok tercih edilen örneklerdir.',
      'Konaklamalı turlar iki ile beş gün arasında sürer ve otel konaklamasını içerir. Kapadokya 3 gece turu, Karadeniz yaylaları turu, Ege adaları kaçamağı ve Turistik Doğu Ekspresi bu gruptadır; ulaşım otobüs, uçak, feribot veya tren olabilir.',
      'Karar verirken iki şeye bakın: toplam yol süresi ve programın temposu. Her tur sayfasında rota gün gün açıklanır, yürüyüş mesafeleri ve rakım bilgisi verilir.',
      'Fiyata neyin dahil olduğu da farklıdır. Günübirlik turlarda ulaşım ve rehberlik standarttır; müze ve ören yeri girişleri ile isteğe bağlı aktiviteler ayrıca belirtilir. Konaklamalı turlarda otel, kahvaltı ve çoğu programda akşam yemeği fiyata dahildir.'
    ]
  },
  {
    h: 'Hangi şehirden hangi turlara katılabilirim?',
    p: [
      'Turların çoğunda birden fazla kalkış noktası bulunur; rezervasyon sırasında size en yakın binme noktasını seçersiniz. Kapadokya turları İstanbul, İzmir ve Ankara çıkışlı düzenlenir. Karadeniz yaylaları turu uçaklı olarak İstanbul\'dan, Ege adaları kaçamağı feribotlu olarak İzmir\'den, Turistik Doğu Ekspresi ise trenle Ankara\'dan hareket eder.',
      'Günübirlik programlarda kalkış şehri turun kendisini belirler: İstanbul çıkışlılar Şile, Ağva, Sapanca ve Maşukiye yönüne; İzmir çıkışlılar Alaçatı, Çeşme, Ayvalık ve Cunda yönüne; Ankara çıkışlılar Abant, Gölcük ve Beypazarı yönüne gider.',
      'Kalkış saati, buluşma noktasının tam adresi, haritadaki konumu ve tahmini dönüş saati her tur sayfasında yazar. Araç tipi ve kapasitesi de belirtilir; kalabalık bir grupla mı yoksa küçük bir grupla mı yola çıkacağınızı önceden bilirsiniz.',
      'Şehir dışından katılacaklar için kalkış noktasına yakın otel önerileri tur sayfasından listelenir. Uçaklı ve trenli programlarda bilet turun içinde mi yoksa ayrı mı alınacak, rezervasyon ekranında açıkça yazar.'
    ]
  },
  {
    h: 'Otel, bungalov ve termal tesis nasıl seçilir?',
    p: [
      'Konaklamada butik oteller, termal tesisler, bungalov ve doğa evleri ile kamp alanları aynı listede karşılaştırılır. Fiyatlar vergiler dahil gösterilir, ödeme adımında gizli ücret eklenmez.',
      'Bölgeye göre öne çıkanlar farklıdır: Antalya Kemer ve Belek çevresinde her şey dahil tatil köyleri, İzmir Alsancak ve Çeşme\'de sahile yakın şehir ve butik oteller, Yalova Termal ile Denizli Karahayıt\'ta termal tesisler, Nevşehir Göreme\'de mağara otelleri, Bolu ve Karadeniz çevresinde bungalov evleri bulunur.',
      'Tesis sayfalarında oda tipleri, kahvaltı ve yemek düzeni, evcil hayvan kabulü, otopark ve çocuk politikası standart bir düzende listelenir. Aynı bölgedeki tesisleri karşılaştırırken bu başlıklar hep aynı yerde durduğu için sayfalar arasında gidip gelmeden karar verebilirsiniz. Ödeme şekli de fiyatın yanında yazar: rezervasyonda tam ödeme veya tesiste ödeme.',
      'Konaklamayı turla birleştirmek isterseniz aynı bölgedeki programlar tesis sayfasının altında önerilir; ikisini tek rezervasyonda toplayabilirsiniz.'
    ]
  },
  {
    h: 'Hangi aktiviteler nerede yapılır?',
    p: [
      'Aktiviteler bölümü, bir güne veya birkaç saate sığan deneyimleri toplar. Rafting Antalya Manavgat\'taki Köprülü Kanyon\'da, yamaç paraşütü Muğla Fethiye\'deki Ölüdeniz Babadağ\'da, sıcak hava balonu Nevşehir Göreme\'de, kayak dersi ise Bursa Uludağ\'da yapılır.',
      'Bunların yanında dalış, tekne turu, doğa yürüyüşü, fotoğraf turu ve gastronomi atölyeleri gibi programlar da listelenir. Her aktivitede süre, zorluk seviyesi, yaş ve kilo sınırı ile hava koşuluna bağlı iptal kuralı ilan edilir; sürpriz çıkmaz.',
      'Ekipman çoğu programda fiyata dahildir; dahil olmadığı durumlarda kiralama ücreti ürün sayfasında ayrıca gösterilir. Hava nedeniyle yapılamayan yamaç paraşütü, balon ve dalış programlarında alternatif tarih veya tam iade seçeneği sunulur. İlk kez deneyecekler için rehberli başlangıç programları ayrı bir koleksiyonda toplanır.',
      'Aktivitelerin çoğu sabah ve öğleden sonra olmak üzere iki seansla düzenlenir. Balon turları yalnızca gün doğumunda kalkar, bu yüzden bir önceki gece bölgede konaklamak gerekir; tekne ve dalış programları ise mevsime bağlı çalışır.'
    ]
  },
  {
    h: 'İzmir\'de hangi mekanlar gezilir?',
    p: [
      'Mekanlar bölümü şu an İzmir\'e odaklanır ve şehrin en çok ziyaret edilen noktalarını tanıtır. Selçuk\'taki Efes Antik Kent, Konak\'taki Kemeraltı Çarşısı, Alsancak\'taki Kordon Boyu, Çeşme\'ye bağlı Alaçatı\'nın taş sokakları, Konak Meydanı ve Saat Kulesi ile İzmir Arkeoloji Müzesi listede yer alır.',
      'Her mekân sayfasında açılış saatleri, güncel açık veya kapalı durumu, bulunduğu ilçe, ziyaretçi puanı ve ulaşım bilgisi bulunur. İzmir Metro, İZBAN ve vapur hatlarıyla nasıl gidileceği ayrıca yazar.',
      'Mekân sayfasından o noktada veya yakınında yaklaşan etkinliklere, çevredeki kafe ve restoran önerilerine ve aynı hafta sonu için konaklama seçeneklerine geçebilirsiniz. Sık gittiğiniz mekanları favorilerinize eklerseniz yeni etkinlik açıldığında bildirim alırsınız.',
      'Bir günde birden fazla noktayı gezmek isteyenler için hazır rotalar bulunur: Konak Meydanı, Kemeraltı ve Asansör bir arada; Selçuk\'ta Efes Antik Kent, Meryem Ana Evi ve Şirince bir arada gezilebilir. Çeşme ve Alaçatı ise günübirlik tek rota olarak listelenir.'
    ]
  },
  {
    h: 'Arama sonuçları nasıl filtrelenir?',
    p: [
      'Listeleme sayfalarındaki filtre çubuğu sıralama, tarih, süre, bölge, tema ve maksimum tutar seçeneklerini birlikte çalıştırır. Örneğin "bu hafta sonu, Ege bölgesi, deniz ve tekne teması, 1.500 TL altı" kombinasyonunu tek seferde uygulayabilirsiniz.',
      'Sıralama seçenekleri en popüler, en yeni, fiyata göre artan, fiyata göre azalan ve puana göre yüksek şeklindedir. Sonuç sayısı listenin üstünde anlık güncellenir; filtreyi fazla daralttığınızda hemen fark eder, bir kademe geri alabilirsiniz.',
      'Seçtiğiniz filtreler etiket olarak üstte görünür ve tek dokunuşla kaldırılabilir, böylece aramayı sıfırdan kurmanız gerekmez. Yaklaşan Planlar şeridinde ayrıca Tümü, Bu Cuma, Bu Cumartesi ve Bu Pazar hızlı filtreleri bulunur; yalnızca uygun olduğunuz güne bakmak istediğinizde en pratik yol budur.',
      'Filtreler mobilde alt sayfa, masaüstünde açılır panel olarak çalışır ve seçiminiz iki görünümde de korunur. Arama sonucunu daha sonra tekrar açmak isterseniz favorilerinize ekleyebilirsiniz; kaydettiğiniz aramaya yeni bir program eklendiğinde bildirim gönderilir.'
    ]
  },
  {
    h: 'Ödeme, e-bilet ve iptal nasıl işliyor?',
    p: [
      'Ödemeler 3D Secure ile korunan altyapı üzerinden alınır ve kart bilgileriniz saklanmaz. Satın alma tamamlandığı anda e-bilet veya rezervasyon onayı hem e-postanıza hem de uygulamadaki Biletlerim bölümüne düşer; girişte telefonunuzdaki karekodu göstermeniz yeterlidir.',
      'İptal, değişiklik ve iade koşulları her ürünün kendi sayfasında açıkça belirtilir; tur, etkinlik ve konaklamada koşullar birbirinden farklı olabilir. İptal talebinizi Biletlerim bölümünden oluşturabilir, sürecin hangi aşamada olduğunu aynı ekrandan izleyebilirsiniz.',
      'Etkinlik organizatör tarafından iptal edilirse ödemeniz ek işlem yapmanıza gerek kalmadan iade sürecine alınır ve size bildirim gönderilir. Etkinlik ertelenirse biletiniz yeni tarihte geçerli olmaya devam eder; yeni tarih size uymuyorsa iade talebinde bulunabilirsiniz. Grup ve kurumsal rezervasyonlar için WhatsApp destek hattından özel fiyat alınabilir.',
      'Fiyatlarda vergiler dahildir ve listede gördüğünüz tutar ödeme adımında değişmez; isteğe bağlı ek hizmetler varsa ayrı ve açık şekilde gösterilir. Kupon kodları ödeme adımındaki alana yazılır, indirim tutarı onaydan önce toplamda görünür.'
    ]
  },
  {
    h: 'Hafta sonu kaçamağı nasıl planlanır?',
    p: [
      'İyi bir hafta sonu planı üç soruyla kurulur: ne kadar zamanım var, ne kadar uzağa gidebilirim, bütçem ne? mola360 bu üç soruyu doğrudan filtrelerle karşılar. Gün filtresiyle zamana, bölge filtresiyle mesafeye, maksimum tutar filtresiyle bütçeye göre daraltırsınız.',
      'Kararsız kalanlar için hazır koleksiyonlar vardır: ailece gezilecek yerler, romantik kaçamaklar, bütçe dostu planlar, tek başına seyahat, arkadaş grubuyla yapılacaklar ve yeni başlayanlar için programlar. Her koleksiyon o profile uyan turları, etkinlikleri ve konaklamaları bir arada gösterir.',
      'Turu ve oteli aynı sepette birleştirebilirsiniz; örneğin Cumartesi Alaçatı turu ve Çeşme\'de bir gece konaklama tek rezervasyonda toplanır. Şehir dışından geliyorsanız etkinlik sayfası size aynı hafta sonu için yakın konaklama seçeneklerini de önerir.',
      'Yola çıkmadan önce iki şeyi kontrol edin: buluşma saati ve dönüş saati. Pazar akşamı dönüşlü programlarda trafiğe bağlı gecikme payı tur sayfasında belirtilir, ertesi gün işe yetişmesi gerekenler için bu bilgi belirleyici olur.'
    ]
  },
  {
    h: 'Mevsime göre nereye gidilir?',
    p: [
      'İlkbaharda yayla ve doğa turları, göl çevresi yürüyüşleri ve fotoğraf turları öne çıkar; Abant, Sapanca, İznik ve Karadeniz yaylaları bu dönemde en çok aranan yerlerdir.',
      'Yazın tekne turları, açık hava konserleri, festivaller ve dalış programları yoğunlaşır. Bodrum, Fethiye Ölüdeniz, Ayvalık Cunda ve Çeşme Alaçatı yaz aylarının merkezidir.',
      'Sonbahar gastronomi turları, bağ bozumu etkinlikleri ve termal tatil için en dengeli dönemdir; Pamukkale, Yalova Termal ve Denizli Karahayıt kalabalığın azaldığı bu aylarda daha rahat gezilir.',
      'Kışın Uludağ, Erciyes, Palandöken ve Kartalkaya kayak paketleri ile şömineli bungalov evleri öne çıkar. Yılbaşı, sömestr ve bayram tatili gibi yoğun dönemlerde erken rezervasyon hem fiyat hem yer bulma açısından belirgin avantaj sağlar; ana sayfadaki koleksiyonlar da o döneme uygun planlara göre güncellenir.',
      'Hangi mevsimde olursanız olun tarih filtresiyle yalnızca gitmeyi düşündüğünüz aralığa bakabilir, Yaklaşan Planlar şeridinden o hafta içindeki programları hızla tarayabilirsiniz.'
    ]
  }
];

/* SSS. Buradaki sorular index.html icindeki FAQPage yapisal verisiyle
   birebir ayni olmalidir; testler bunu dogrular. */
const SEO_FAQ = [
  {
    q: 'mola360 üzerinden bilet nasıl satın alınır?',
    a: 'Aramak istediğiniz etkinliği, turu veya oteli arama kutusundan ya da kategori sayfalarından bulun, tarih ve kişi sayısını seçip sepete ekleyin. Ödeme adımında varsa kupon kodunuzu uygulayın ve 3D Secure ile ödemeyi tamamlayın. Onay ekranının ardından e-biletiniz oluşturulur.'
  },
  {
    q: 'Satın aldığım bileti nereden görüntülerim?',
    a: 'Tüm biletleriniz ve rezervasyonlarınız hesabınızdaki Biletlerim bölümünde karekodlu olarak durur. Aynı bilet satın alma sırasında verdiğiniz e-posta adresine de gönderilir. Etkinlik girişinde telefonunuzdaki karekodu göstermeniz yeterlidir.'
  },
  {
    q: 'Rezervasyonumu iptal edebilir miyim, ücret iadesi nasıl işler?',
    a: 'İptal ve iade koşulları her ürünün kendi sayfasında ayrıca belirtilir; tur, etkinlik ve konaklamada koşullar farklılık gösterebilir. Ürün sayfasındaki koşullar kapsamında iptal talebinizi Biletlerim bölümünden oluşturabilir, süreci aynı ekrandan takip edebilirsiniz.'
  },
  {
    q: 'Günübirlik tur fiyatına neler dahil?',
    a: 'Günübirlik turlarda ulaşım ve rehberlik hizmeti standart olarak fiyata dahildir. Öğle yemeği, müze ve ören yeri giriş ücretleri ile isteğe bağlı aktiviteler programdan programa değişir; her turun sayfasında "Fiyata dahil olanlar" ve "Dahil olmayanlar" başlıkları ayrı ayrı listelenir.'
  },
  {
    q: 'Etkinlik iptal edilir veya ertelenirse ne oluyor?',
    a: 'Etkinlik organizatör tarafından iptal edilirse ödemeniz ek bir işlem yapmanıza gerek kalmadan iade sürecine alınır ve bilgilendirme bildirimi gönderilir. Etkinlik ertelenirse biletiniz yeni tarih için geçerli olmaya devam eder; yeni tarih size uymuyorsa iade talebinde bulunabilirsiniz.'
  },
  {
    q: 'Otel rezervasyonunda ödemeyi ne zaman yapıyorum?',
    a: 'Tesise ve seçtiğiniz tarifeye göre iki seçenek sunulur: rezervasyon anında tam ödeme veya tesiste ödeme. Hangisinin geçerli olduğu fiyatın hemen yanında yazar; ödeme adımına geçmeden önce görebilirsiniz.'
  },
  {
    q: 'Kupon kodunu nerede kullanabilirim?',
    a: 'Kupon kodları ödeme adımındaki "Kupon kodu" alanına yazılır. Kod geçerliyse indirim tutarı toplam fiyatın altında anında güncellenir. Kuponlarınızı ve son kullanma tarihlerini hesabınızdaki Kuponlarım bölümünden görebilirsiniz.'
  },
  {
    q: 'Grup veya kurumsal rezervasyon yapabilir miyim?',
    a: 'Evet. Belirli bir kişi sayısının üzerindeki gruplar ve şirket organizasyonları için özel fiyatlandırma yapılabilir. Talebinizi WhatsApp canlı destek üzerinden veya Beni Ara formunu doldurarak iletebilirsiniz; ekibimiz size özel bir program hazırlar.'
  },
  {
    q: 'Fiyatlara vergiler dahil mi?',
    a: 'Listelerde ve ürün sayfalarında gördüğünüz fiyatlar vergiler dahil tutarlardır. Ödeme adımında sürpriz bir ek ücret eklenmez; varsa isteğe bağlı ek hizmetler ayrıca ve açıkça gösterilir.'
  },
  {
    q: 'Müşteri hizmetlerine nasıl ulaşırım?',
    a: 'Yukarıdaki Yardım bölümünden telefonla arayabilir, WhatsApp canlı destek hattından yazabilir veya Beni Ara formuna numaranızı bırakabilirsiniz. Çalışma saatleri içinde bıraktığınız numaralara kısa süre içinde dönüş yapılır.'
  }
];

/* Wikimedia Commons'tan alinan gorsellerin kaynaklari.
   CC lisanslari atif ister; asagidaki satir sayfada gorunur ve her
   gorselin dosya sayfasina baglanir. Yazar ve lisans bilgisi o
   sayfalarda yazili — yayina almadan once docs/gorsel-kaynaklari.md
   icindeki notu okuyun. */
const IMAGE_CREDITS = [
  { ad: 'Efes Celsus Kütüphanesi', dosya: 'Ephesus Celsus Library Façade.jpg' },
  { ad: 'Kemeraltı Çarşısı',       dosya: 'Kemeraltı market 02.jpg' },
  { ad: 'Konak Meydanı',           dosya: 'Izmir Konak Square.jpg' },
  { ad: 'Kordon, Alsancak',        dosya: 'Izmir Alsancak Kordon 6339.jpg' },
  { ad: 'İzmir Arkeoloji Müzesi',  dosya: 'İzmir Archaeological Museum 2462 1.jpg' },
  { ad: 'Alaçatı değirmenleri',    dosya: 'Alaçatı değirmenler 01.jpg' },
  { ad: 'Aspendos Antik Tiyatro',  dosya: 'Aspendos Turkey.JPG' },
  { ad: 'Erciyes Dağı',            dosya: 'Erciyes Dağı Kayseri.JPG' }
];

function commonsDosyaUrl(dosya) {
  return 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(dosya.replace(/ /g, '_'));
}

/* ---- SEO blogu isaretlemesi ---- */
function seoLinkGroupMarkup(group) {
  const links = group.links
    .map(l => `<li><a href="${l.href}">${l.label}</a></li>`)
    .join('');
  return `
    <div class="seo-link-group">
      <h3 class="seo-link-title">${group.title}</h3>
      <ul class="seo-link-list">${links}</ul>
    </div>`;
}

function seoArticleMarkup(section, index) {
  const govde = section.p.map(metin => `<p>${metin}</p>`).join('');
  return `
    <div class="seo-article-part${index === 0 ? ' is-lead' : ''}">
      <h3>${section.h}</h3>
      ${govde}
    </div>`;
}

function seoFaqMarkup(item, index) {
  return `
    <details class="seo-faq-item"${index === 0 ? ' open' : ''}>
      <summary><span>${item.q}</span><span class="icon seo-faq-chev">${svg('chevDown')}</span></summary>
      <p>${item.a}</p>
    </details>`;
}

const HOME_BLOCK_MARKUP = {
  /* Mekanlar: yatay kaydirma yok; her mekan tam genislikte bir satir. */
  /* Mekanlar blogu: icerik sayfasi OLAN mekanlar katalogdan geliyor ve
     listenin basinda duruyor; sayfasi olmayan gezi noktalari (VENUES)
     arkalarinda kaliyor. Katalog yuklenmemis bir sayfada (ornegin tur
     sayfasi) kosul sessizce bos dizi veriyor.

     Bolumun id'si var cunku mekan sayfalarinin kirilma noktasi ve
     etiketleri index.html#mekanlar adresine gidiyor; capa olmadan o
     baglar sayfanin tepesine dusuyordu. */
  venues: () => `
    <section class="section home-venues" id="mekanlar">
      ${homeSectionHead('Mekanlar', 'Tümünü Gör')}
      <div class="venue-list">
        ${(typeof catalogCards === 'function' ? catalogCards('mekanlar') : [])
          .concat(VENUES).map(v => `
          <a class="venue-card" href="${v.href || '#'}">
            <span class="venue-media"><img src="${homeBlockImage(v.img)}" alt="" loading="lazy"></span>
            <span class="venue-body">
              <span class="venue-top">
                <span class="venue-type">${v.venueType || v.type}</span>
                <span class="venue-status${v.open ? ' is-open' : ''}">${v.open ? 'Açık' : 'Kapalı'}</span>
              </span>
              <strong class="venue-title">${v.title}</strong>
              <span class="venue-meta"><span class="icon">${svg('mapPin')}</span>${v.area}</span>
              <span class="venue-foot">
                <span class="venue-rating"><span class="icon">${svg('star')}</span>${v.rating}<span class="venue-reviews">(${v.reviews})</span></span>
                <span class="venue-hours"><span class="icon">${svg('clock')}</span>${v.hours}</span>
              </span>
            </span>
          </a>`).join('')}
      </div>
    </section>`,

  /* Kampanyalar: kart seritleri gibi yatay kaydirilir, kenar bosluklarinin
     uzerine tasar. */
  promo: () => `
    <section class="section home-promo-section">
      <div class="hscroll-wrap">
      <div class="promo-scroll">
        ${PROMO_BANDS.map(p => `
          <a class="home-promo" href="#">
            <img src="${homeBlockImage(p.img)}" alt="" loading="lazy">
            <span class="home-promo-shade"></span>
            <span class="home-promo-content">
              <span class="home-promo-badge">${p.badge}</span>
              <strong>${p.title}</strong>
              <span class="home-promo-text">${p.text}</span>
              <span class="home-promo-cta">${p.cta} <span class="icon">${svg('chevRight')}</span></span>
            </span>
          </a>`).join('')}
      </div>
        <button class="hscroll-arrow left" type="button" data-dir="left" aria-label="Geri"><span class="icon">${svg('chevLeft')}</span></button>
        <button class="hscroll-arrow right" type="button" data-dir="right" aria-label="İleri"><span class="icon">${svg('chevRight')}</span></button>
      </div>
    </section>`,

  themes: () => `
    <section class="section home-themes">
      ${homeSectionHead('Temaya Göre Keşfet', 'Tümünü Gör', 'Ne yapmak istediğine göre seç')}
      <div class="hscroll-wrap">
      <div class="theme-scroll">
        ${homeThemeCards().map(c => `
          <a class="theme-card" href="#">
            <img src="${homeBlockImage(c.img)}" alt="" loading="lazy">
            <span class="theme-card-shade"></span>
            <span class="theme-card-text"><strong>${c.title}</strong><span>${c.count}</span></span>
          </a>`).join('')}
      </div>
        <button class="hscroll-arrow left" type="button" data-dir="left" aria-label="Geri"><span class="icon">${svg('chevLeft')}</span></button>
        <button class="hscroll-arrow right" type="button" data-dir="right" aria-label="İleri"><span class="icon">${svg('chevRight')}</span></button>
      </div>
    </section>`,

  collectionGrid: () => `
    <section class="section home-collections">
      ${homeSectionHead('Koleksiyonlar', 'Tümünü Gör', 'Kiminle ve nasıl bir kaçamak istediğine göre')}
      <div class="collection-grid">
        ${homeCollectionCards().map(c => `
          <a class="collection-tile" href="#">
            <img src="${homeBlockImage(c.img)}" alt="" loading="lazy">
            <span class="collection-tile-shade"></span>
            <span class="collection-tile-text"><strong>${c.title}</strong><span>${c.text}</span></span>
          </a>`).join('')}
      </div>
    </section>`,

  /* E-bulten: lacivert vurgu karti. */
  newsletter: () => `
    <section class="section home-newsletter-section">
      <div class="home-newsletter">
        <span class="home-newsletter-badge"><span class="icon">${svg('percent')}</span>Bülten</span>
        <h2>Fırsatları herkesten önce gör</h2>
        <p class="home-newsletter-lead">Haftada bir e-posta: seçili indirimler, yeni eklenen turlar ve son dakika fırsatları.</p>
        <form class="home-newsletter-form" id="homeNewsletterForm" novalidate>
          <input type="email" id="homeNewsletterEmail" placeholder="ornek@eposta.com" autocomplete="email" aria-label="E-posta adresin">
          <button class="btn-primary" type="submit">Kaydol</button>
        </form>
        <p class="home-newsletter-note" id="homeNewsletterNote">İstediğin zaman tek tıkla çıkabilirsin.</p>
        <ul class="home-newsletter-perks">
          ${NEWSLETTER_PERKS.map(perk => `<li><span class="icon">${svg('check')}</span>${perk}</li>`).join('')}
        </ul>
      </div>
    </section>`,

  /* Iletisim: telefon, WhatsApp ve geri arama talebi. */
  support: () => `
    <section class="section home-support-section">
      <div class="home-support">
        <div class="home-support-head">
          <span class="home-support-icon">${svg('headset')}</span>
          <div class="home-support-head-text">
            <h2>Yardıma mı ihtiyacın var?</h2>
            <p>Rezervasyon, iptal ya da öneri — her konuda buradayız.</p>
          </div>
        </div>

        <div class="home-support-row">
        <a class="home-support-phone" href="${CONTACT.phoneHref}">
          <span class="home-support-phone-icon">${svg('phone')}</span>
          <span class="home-support-phone-text">
            <strong>${CONTACT.phoneLabel}</strong>
            <span>${CONTACT.hours}</span>
          </span>
          <span class="icon home-support-phone-chev">${svg('chevRight')}</span>
        </a>

        <div class="home-support-actions">
          <a class="home-support-btn is-whatsapp" href="${CONTACT.whatsappHref}" target="_blank" rel="noopener">
            <span class="icon home-support-wa-icon"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="${WHATSAPP_ICON_PATH}"></path></svg></span>
            WhatsApp Canlı Destek
          </a>
          <button class="home-support-btn is-callback" type="button" id="homeCallbackBtn" aria-expanded="false" aria-controls="homeCallbackForm">
            <span class="icon">${svg('phone')}</span>
            Beni Ara
          </button>
        </div>
        </div>

        <form class="home-callback-form" id="homeCallbackForm" novalidate hidden>
          <label for="homeCallbackPhone">Telefon numaran</label>
          <div class="home-callback-row">
            <input type="tel" id="homeCallbackPhone" inputmode="tel" placeholder="05XX XXX XX XX" autocomplete="tel">
            <button class="btn-primary" type="submit">Gönder</button>
          </div>
          <p class="home-callback-note" id="homeCallbackNote">Çalışma saatleri içinde 15 dakika içinde arıyoruz.</p>
        </form>
      </div>
    </section>`
  ,

  /* Alt SEO blogu: ic baglanti agi + uzun metin + SSS.
     Metnin tamami DOM'da durur; "Devamını oku" yalnizca gorunur
     yuksekligi acar (display:none ile gizlenmez). */
  seo: () => `
    <section class="section home-seo-section" aria-labelledby="homeSeoHeading">
      <div class="home-seo">

        <div class="seo-links">
          <h2 class="seo-links-heading">Popüler kategoriler ve aramalar</h2>
          <div class="seo-link-groups">
            ${SEO_LINK_GROUPS.map(seoLinkGroupMarkup).join('')}
          </div>

          <div class="seo-related">
            <h3 class="seo-link-title">İlgili aramalar</h3>
            <ul class="seo-chip-list">
              ${SEO_RELATED_SEARCHES.map(a => `<li><a class="seo-chip" href="${a.href}">${a.label}</a></li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="seo-article">
          <h2 id="homeSeoHeading">Türkiye'nin gezi, etkinlik ve konaklama rehberi</h2>
          <div class="seo-article-body" id="homeSeoBody">
            ${SEO_ARTICLE.map(seoArticleMarkup).join('')}
          </div>
          <button class="seo-article-toggle" type="button" id="homeSeoToggle"
                  aria-expanded="false" aria-controls="homeSeoBody">
            <span class="seo-toggle-label">Devamını oku</span>
            <span class="icon seo-toggle-chev">${svg('chevDown')}</span>
          </button>
        </div>

        <div class="seo-faq">
          <h2>Sık sorulan sorular</h2>
          <div class="seo-faq-list">
            ${SEO_FAQ.map(seoFaqMarkup).join('')}
          </div>
        </div>

        <p class="seo-credits">
          Görseller: Wikimedia Commons —
          ${IMAGE_CREDITS.map(k => `<a href="${commonsDosyaUrl(k.dosya)}" target="_blank" rel="noopener">${k.ad}</a>`).join(', ')}
        </p>

      </div>
    </section>`
};

/* Bir kart seridinden sonra gelecek bloklarin isaretlemesi. */
function homeBlocksAfter(sectionTitle) {
  return (HOME_BLOCK_PLACEMENT[sectionTitle] || [])
    .map(key => (HOME_BLOCK_MARKUP[key] ? HOME_BLOCK_MARKUP[key]() : ''))
    .join('');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HOME_BLOCK_PLACEMENT,
    UPCOMING_FILTERS,
    UPCOMING_DAY_KEYS,
    homeThemeCards,
    homeCollectionCards,
    temaSayisiMetni,
    VENUES,
    PROMO_BANDS,
    NEWSLETTER_PERKS,
    CONTACT,
    SEO_LINK_GROUPS,
    SEO_RELATED_SEARCHES,
    SEO_ARTICLE,
    SEO_FAQ,
    filterUpcomingItems,
    isValidEmail,
    isValidPhone,
    supportOnline,
    istanbulSaati
  };
}
