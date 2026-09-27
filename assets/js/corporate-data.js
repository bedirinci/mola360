/* ---------------- kurumsal ve yasal içerik ----------------
   /kurumsal/* sayfalarının, SSS'nin ve ödeme ekranındaki ön
   bilgilendirme formu ile mesafeli satış sözleşmesinin TEK kaynağı.
   Backend gelince bu içerik yönetim panelinden düzenlenecek (sayfa
   kayıtları); biçim aynı kalacak.

   KURALLAR:
     - Şirket kimliği UYDURULMAZ. KRM_SIRKET'teki boş alanlar sayfada
       "yayından önce eklenecek" diye işaretli görünür ve yasal
       sayfalar "taslak" uyarısı taşır.
     - Metindeki kural sayıları (kapora oranı, taksit alt sınırı, kart
       aileleri, hoş geldin kuponu) KURAL TABLOSUNDAN gelir: {kaporaOrani}
       gibi yer tutucular booking-engine.js'teki değerlerle doldurulur.
       Kural değişince metin kendiliğinden değişir.
     - Bağ: [metin](kök göreli yol). Vurgu yok; düz metin.
     - Yasal metinler TASLAKTIR; yayından önce hukukçu incelemesinden
       geçmeli (docs/veri-sozlesmesi.md bölüm 15).

   ADLAR: üst seviye adlar KRM_ / krm ile başlıyor. */

/* Şirket kimliği: yayından önce doldurulacak. null = bilinmiyor. */
const KRM_SIRKET = {
  marka: 'mola360',
  unvan: null,
  adres: null,
  mersisNo: null,
  vergiDairesi: null,
  vergiNo: null,
  /* Tur düzenleyen seyahat acentasının Kültür ve Turizm Bakanlığı /
     TÜRSAB belge numarası. */
  tursabBelgeNo: null,
  kep: null,
  eposta: null,
  /* Elektronik Ticaret Bilgi Sistemi kaydı. */
  etbisNo: null
};
const KRM_SIRKET_ALANLARI = [
  ['unvan', 'Ticari unvan'],
  ['adres', 'Adres'],
  ['mersisNo', 'MERSİS numarası'],
  ['vergiDairesi', 'Vergi dairesi'],
  ['vergiNo', 'Vergi numarası'],
  ['tursabBelgeNo', 'TÜRSAB belge numarası'],
  ['kep', 'KEP adresi'],
  ['eposta', 'E-posta'],
  ['etbisNo', 'ETBİS kaydı']
];
const KRM_GUNCELLEME = '2026-09-27';

/* ---------------- SSS ----------------
   anasayfa: true olanlar anasayfanın SSS bloğunda ve index.html'deki
   FAQPage yapısal verisinde (birebir aynı; tests/home-blocks.test.js).
   Anasayfadakiler düz metin: yer tutucu ve bağ yok. */
const KRM_SSS_KATEGORILER = [
  { id: 'rezervasyon', ad: 'Rezervasyon' },
  { id: 'odeme', ad: 'Ödeme ve taksit' },
  { id: 'iptal', ad: 'İptal ve iade' },
  { id: 'bilet', ad: 'Biletler' },
  { id: 'hesap', ad: 'Hesap ve üyelik' },
  { id: 'kampanya', ad: 'Kampanya ve kupon' },
  { id: 'puan', ad: 'Molapuan' },
  { id: 'urun', ad: 'Tur, otel ve etkinlik' },
  { id: 'destek', ad: 'İletişim ve destek' }
];

const KRM_SSS = [
  { id: 'nasil-rezervasyon', kategori: 'rezervasyon', anasayfa: true,
    soru: 'mola360 üzerinden nasıl rezervasyon yapılır?',
    cevap: 'Turu, oteli, aktiviteyi ya da etkinliği arama kutusundan veya kategori sayfalarından bulun. Ürün sayfasında tarihi ve kişi sayısını seçip Rezervasyon yap deyin, özeti kontrol edip ödeme adımına geçin. Ödeme adımında katılımcı bilgilerini girer, ödeme planını ve varsa taksidi seçersiniz; kart bilgileri bankanızın 3D Secure sayfasında girilir. Onaydan sonra rezervasyon kodunuzu alırsınız.' },
  { id: 'bilet-nerede', kategori: 'bilet', anasayfa: true,
    soru: 'Biletimi nereden görüntülerim?',
    cevap: 'Biletler Hesabım sayfasındaki Biletlerim bölümünde karekodlu olarak durur: etkinlikte her bilet, tur ve aktivitede her katılımcı için ayrı karekod oluşur. Aynı bilgiler rezervasyonda verdiğiniz e-posta adresine de gönderilir. Girişte ya da araçta telefonunuzdaki karekodu göstermeniz yeterlidir.' },
  { id: 'iptal-iade', kategori: 'iptal', anasayfa: true,
    soru: 'Rezervasyonumu iptal edebilir miyim, iade nasıl işler?',
    cevap: 'Her ürünün iptal koşulları kendi sayfasında ve ödeme adımında tarihleriyle yazar: başlangıca ne kadar süre kala iptal ederseniz ödediğiniz tutarın ne kadarının iade edileceği bellidir. Üyeyseniz Hesabım bölümündeki Rezervasyonlarım ekranından iptal edebilir, iade tutarını iptalden önce görebilirsiniz. İade, ödemenin yapıldığı karta yapılır.' },
  { id: 'kapora', kategori: 'odeme', anasayfa: true,
    soru: 'Turlarda kaporayla rezervasyon yapabilir miyim?',
    cevap: 'Evet. Turlarda tutarın %20\'sini kapora olarak ödeyip yerinizi ayırtabilirsiniz. Kalanı tercihinize göre turdan bir gün önce ya da tur günü araçta ödersiniz; kalkıştan bir gün önce sizi arayıp kalan ödemeyi birlikte netleştiriyoruz. Kalkışa iki günden az kaldıysa tutarın tamamı ödenir.' },
  { id: 'gunubirlik-dahil', kategori: 'urun', anasayfa: true,
    soru: 'Günübirlik tur fiyatına neler dahil?',
    cevap: 'Günübirlik turlarda ulaşım ve rehberlik hizmeti standart olarak fiyata dahildir. Öğle yemeği, müze ve ören yeri giriş ücretleri ile isteğe bağlı aktiviteler programdan programa değişir; her turun sayfasında "Fiyata dahil olanlar" ve "Dahil olmayanlar" başlıkları ayrı ayrı listelenir.' },
  { id: 'etkinlik-iptal', kategori: 'urun', anasayfa: true,
    soru: 'Etkinlik iptal edilir veya ertelenirse ne oluyor?',
    cevap: 'Etkinlik düzenleyen tarafından iptal edilirse ödediğiniz tutarın tamamı iade edilir ve size haber verilir. Etkinlik ertelenirse biletiniz yeni tarihte geçerlidir; yeni tarih size uymuyorsa iade isteyebilirsiniz.' },
  { id: 'otel-odeme', kategori: 'odeme', anasayfa: true,
    soru: 'Otel rezervasyonunda ödemeyi ne zaman yapıyorum?',
    cevap: 'Otel rezervasyonunda tutarın tamamı rezervasyon sırasında ödenir; uygun kartlarda taksit seçebilirsiniz. Konaklama vergisi ödeme özetinde ayrı satır olarak görünür ve toplama dahildir.' },
  { id: 'kupon', kategori: 'kampanya', anasayfa: true,
    soru: 'Kupon kodunu nerede kullanabilirim?',
    cevap: 'Kupon kodu ödeme adımındaki Kupon kodu alanına yazılır; geçerliyse indirim toplamda hemen görünür. Erken rezervasyon gibi otomatik kampanyalar ayrıca kendiliğinden uygulanır. Kişiye özel kuponlarınız Hesabım bölümündeki Kuponlarım ekranındadır.' },
  { id: 'grup', kategori: 'destek', anasayfa: true,
    soru: 'Grup veya kurumsal rezervasyon yapabilir miyim?',
    cevap: 'Evet. Kalabalık gruplar ve şirket organizasyonları için telefonla, WhatsApp\'tan ya da İletişim sayfasındaki formdan bize yazın; programı ve fiyatı birlikte netleştirelim.' },
  { id: 'vergi', kategori: 'odeme', anasayfa: true,
    soru: 'Fiyatlara vergiler dahil mi?',
    cevap: 'Tur, aktivite ve etkinlik fiyatlarına vergiler dahildir. Otellerde konaklama vergisi ödeme özetinde ayrı satır olarak eklenir. Toplam tutar ödeme adımına geçmeden önce ürün sayfasındaki özette görünür; isteğe bağlı ek hizmetler ayrıca ve açıkça yazar.' },
  { id: 'destek', kategori: 'destek', anasayfa: true,
    soru: 'Müşteri hizmetlerine nasıl ulaşırım?',
    cevap: 'Telefonla arayabilir, WhatsApp\'tan yazabilir, anasayfadaki Beni Ara formuna numaranızı bırakabilir ya da İletişim sayfasındaki formu kullanabilirsiniz. Çalışma saatleri İletişim sayfasında yazar.' },

  { id: 'taksit', kategori: 'odeme',
    soru: 'Hangi kartlarla taksit yapabilirim?',
    cevap: '{kartAileleri} kart ailelerinde taksit seçenekleri ödeme adımında listelenir; 2 ve 3 taksit vade farksızdır, daha uzun taksitlerde vade farkı tabloda yazar. Banka kartı, ticari kart ve yurt dışı kartlarla tek çekim yapılır. {taksitAltSinir} altındaki ödemelerde taksit yoktur.' },
  { id: 'doviz', kategori: 'odeme',
    soru: 'Döviz fiyatlı turlarda nasıl ödüyorum?',
    cevap: 'Yurt dışı turların fiyatı euro ya da dolar olarak yazar, ödemeyi Türk lirasıyla yaparsınız. TL tutar rezervasyon günündeki kurla hesaplanır ve rezervasyona yazılır; kalan ödeme de aynı kurla yapılır, sonradan kur değişse de tutarınız değişmez.' },
  { id: 'kart-saklama', kategori: 'odeme',
    soru: 'Kart bilgilerim saklanıyor mu?',
    cevap: 'Hayır. Kart bilgileri {marka}\'da tutulmaz; ödeme sırasında bankanızın ve ödeme kuruluşunun güvenli sayfasında girilir.' },
  { id: 'cocuk', kategori: 'rezervasyon',
    soru: 'Çocuklar için fiyat nasıl hesaplanıyor?',
    cevap: 'Turlarda ve aktivitelerde çocuk ve bebek tarifeleri ürün sayfasında yaş aralığıyla birlikte yazar; ödeme adımında her çocuğun yaşını seçersiniz. Otellerin çocuk politikası otel sayfasındaki kurallarda yazar; yaşları girince tutar buna göre hesaplanır.' },
  { id: 'tek-kisi', kategori: 'rezervasyon',
    soru: 'Konaklamalı tura tek başıma katılırsam fark öder miyim?',
    cevap: 'Evet, konaklamalı turlarda tek kişilik oda farkı uygulanır ve tur sayfasında yazar. Tek başınıza katılırsanız ya da tek kişilik oda seçerseniz fark toplamınıza kendiliğinden eklenir.' },
  { id: 'tarih-degisikligi', kategori: 'rezervasyon',
    soru: 'Rezervasyon tarihimi değiştirebilir miyim?',
    cevap: 'Tarih değişikliği yeni tarihteki kontenjana bağlıdır. Rezervasyon kodunuzla destek hattından ya da WhatsApp\'tan bize ulaşın.' },
  { id: 'uyesiz', kategori: 'rezervasyon',
    soru: 'Üye olmadan rezervasyon yapabilir miyim?',
    cevap: 'Evet. Rezervasyonunuzu daha sonra [Hesabım](hesabim/) sayfasındaki Rezervasyonunu bul bölümünden kod ve e-postanızla görüntüleyebilirsiniz. Aynı e-postayla üye olursanız rezervasyon hesabınızda da görünür.' },
  { id: 'kapora-iptal', kategori: 'iptal',
    soru: 'Kaporalı rezervasyonu iptal edersem ne kadar iade alırım?',
    cevap: 'Kesinti, iptal koşullarındaki oranla toplam tutar üzerinden hesaplanır; iade, ödediğiniz kaporadan bu kesinti düşülerek yapılır ve sizden ek ödeme istenmez. Tutarı iptal etmeden önce [Rezervasyonlarım](hesabim/?bolum=rezervasyonlarim) ekranında görürsünüz.' },
  { id: 'hava', kategori: 'iptal',
    soru: 'Balon uçuşu hava koşulu nedeniyle yapılamazsa ne olur?',
    cevap: 'Uçuş hava koşulu nedeniyle yapılamazsa ücretin tamamı iade edilir. Kararı sabah kalkış alanında pilot verir.' },
  { id: 'iade-suresi', kategori: 'iptal',
    soru: 'İade ne zaman kartıma geçer?',
    cevap: 'İade, ödemenin yapıldığı karta yapılır. Tutarın kartınıza yansıma süresi bankanıza bağlıdır; taksitli ödemelerde iade, banka tarafından taksitlere yansıtılır.' },
  { id: 'karekod', kategori: 'bilet',
    soru: 'Karekodu yazdırmam gerekiyor mu?',
    cevap: 'Hayır, telefonunuzdaki karekod yeterlidir. İsterseniz [Biletlerim](hesabim/?bolum=biletlerim) ekranındaki Biletleri yazdır düğmesiyle çıktı alabilirsiniz.' },
  { id: 'uyelik', kategori: 'hesap',
    soru: 'Üyelik ücretli mi?',
    cevap: 'Hayır, üyelik ücretsizdir. Üye olduğunuzda ilk rezervasyonunuza özel {hosgeldinOrani} indirim kodu hesabınıza eklenir; kod {hosgeldinGun} gün geçerlidir.' },
  { id: 'favoriler', kategori: 'hesap',
    soru: 'Favorilerimi nerede görürüm?',
    cevap: 'Kartlardaki ve ürün sayfalarındaki kalp simgesiyle eklediğiniz ürünler [Favorilerim](hesabim/?bolum=favorilerim) ekranındadır.' },
  { id: 'kampanya-birlesme', kategori: 'kampanya',
    soru: 'Birden fazla kampanya birleşir mi?',
    cevap: 'Otomatik kampanyalardan size en avantajlı olanı uygulanır; bir kupon kodu bunun üstüne eklenebilir. Kişiye özel kuponlar yalnızca sahibinin hesabında ve bir kez kullanılır. Yürürlükteki kampanyalar [Kampanyalar](kampanyalar/) sayfasında.' },
  { id: 'molapuan', kategori: 'puan',
    soru: 'Molapuan nedir, nasıl kazanılır?',
    cevap: 'Molapuan, turlarımıza katıldıkça kazandığınız puandır; her turun kazandırdığı puan farklıdır. Puan tur tamamlanınca hesabınıza geçer; iptal edilen rezervasyon puan kazandırmaz.' },
  { id: 'molapuan-kullanim', kategori: 'puan',
    soru: 'Molapuanı nasıl kullanırım?',
    cevap: 'Puanla ödeme kuralları belirlendiğinde bu sayfada ve Hesabım\'da duyurulacak. O zamana kadar puanlarınız hesabınızda birikir.' },
  { id: 'sikayet', kategori: 'destek',
    soru: 'Şikâyetimi nasıl iletirim?',
    cevap: '[İletişim](kurumsal/iletisim/) sayfasındaki formda konu olarak Öneri ve şikâyet\'i seçin ya da destek hattını arayın. Tüketici olarak başvuru hakkınız saklıdır: uyuşmazlıklarda Tüketici Hakem Heyetlerine ve Tüketici Mahkemelerine başvurabilirsiniz.' }
];

/* ---------------- sayfalar ----------------
   icerik: dizi. Öğeler:
     'paragraf'                    düz metin (yer tutucu ve bağ olabilir)
     { liste: [...] }              madde listesi
     { tablo: { basliklar, satirlar } }
     { ozel: 'ad' }                ekranın ürettiği blok (sirket,
                                   iletisim-kanallari, iletisim-formu,
                                   yardim, sss, iptal-tablosu, depo-listesi,
                                   rezervasyon-ozeti, iptal-kosullari)
   yasal: true → şirket bilgisi eksikse "taslak" uyarısı. */
const KRM_SAYFALAR = [
  {
    slug: 'hakkimizda', baslik: 'Hakkımızda',
    aciklama: 'mola360: tur, otel, aktivite, etkinlik ve mekân rezervasyonu tek yerde.',
    bolumler: [
      { id: 'biz', baslik: '{marka} nedir', icerik: [
        '{marka}, Türkiye\'de tur, otel, aktivite, etkinlik ve mekân rezervasyonunu tek yerde toplayan bir seyahat platformudur. Günübirlik kültür turlarından konaklamalı turlara, butik otellerden balon uçuşuna ve açık hava konserlerine kadar planını tek bir hesapla yapabilir, tek ödeme ekranından tamamlayabilirsin.',
        'Rezervasyonun muhatabı doğrudan {marka}\'dır: turlarımızı kendimiz düzenliyor, otel, aktivite, etkinlik ve mekân rezervasyonlarını da kendimiz alıp takip ediyoruz. Bir sorun olduğunda seni başka bir satıcıya yönlendirmiyoruz.'
      ] },
      { id: 'nasil', baslik: 'Nasıl çalışıyoruz', icerik: [
        { liste: [
          'Fiyat ne ise o: fiyata dahil olanlar ve olmayanlar ürün sayfasında ayrı ayrı yazar; ödeme adımında sürpriz ücret eklenmez.',
          'Gerçek kontenjan: dolu tarih satılmaz; son kontrol ödeme adımında yapılır.',
          'Turlarda {kaporaOrani} kapora ile yer ayırtabilir, kalanı turdan bir gün önce ya da tur günü araçta ödeyebilirsin.',
          'Kart ailene göre taksit; döviz fiyatlı turlarda Türk lirasıyla, rezervasyon günündeki kurla ödeme.',
          'İptal koşulları tarihleriyle: ne zamana kadar iptal edersen ne kadar iade alacağını rezervasyondan önce görürsün.',
          'Kampanyalar kurala bağlı: [Kampanyalar](kampanyalar/) sayfasında yazan koşul, ödeme adımında uygulanan koşulla aynıdır.'
        ] }
      ] },
      { id: 'molapuan', baslik: 'Molapuan', icerik: [
        'Turlarımıza katıldıkça Molapuan kazanırsın; her turun puanı farklıdır ve puan tur tamamlanınca [hesabına](hesabim/?bolum=puanlarim) geçer.'
      ] },
      { id: 'ulasim', baslik: 'Bize ulaş', icerik: [
        'Sorun için [Yardım Merkezi](kurumsal/yardim/) ve [Sık Sorulan Sorular](kurumsal/sss/) sayfalarına bakabilir, [İletişim](kurumsal/iletisim/) sayfasından bize yazabilirsin.'
      ] },
      { id: 'sirket', baslik: 'Şirket bilgileri', icerik: [{ ozel: 'sirket' }] }
    ]
  },
  {
    slug: 'iletisim', baslik: 'İletişim',
    aciklama: 'mola360 destek hattı, WhatsApp ve iletişim formu.',
    bolumler: [
      { id: 'kanallar', baslik: 'Bize ulaşın', icerik: [{ ozel: 'iletisim-kanallari' }] },
      { id: 'rezervasyon', baslik: 'Rezervasyonunla ilgiliyse', icerik: [
        'Rezervasyon kodun hazırsa işlem daha hızlı ilerler. Üyeysen [Rezervasyonlarım](hesabim/?bolum=rezervasyonlarim) ekranından, değilsen [Rezervasyonunu bul](hesabim/) bölümünden kod ve e-postanla rezervasyonuna ulaşabilirsin.'
      ] },
      { id: 'form', baslik: 'Mesaj gönder', icerik: [{ ozel: 'iletisim-formu' }] },
      { id: 'sirket', baslik: 'Şirket bilgileri', icerik: [{ ozel: 'sirket' }] }
    ]
  },
  {
    slug: 'yardim', baslik: 'Yardım Merkezi',
    aciklama: 'Rezervasyon, ödeme, iptal, bilet ve hesap hakkında yardım.',
    bolumler: [
      { id: 'yardim', baslik: 'Nasıl yardımcı olabiliriz?', icerik: [{ ozel: 'yardim' }] },
      { id: 'ulasim', baslik: 'Cevabı bulamadın mı?', icerik: [
        '[İletişim](kurumsal/iletisim/) sayfasından bize yazabilir ya da destek hattını arayabilirsin.'
      ] }
    ]
  },
  {
    slug: 'sss', baslik: 'Sık Sorulan Sorular',
    aciklama: 'mola360 rezervasyon, ödeme, iptal, bilet ve hesap hakkında sık sorulan sorular.',
    bolumler: [{ id: 'sss', baslik: '', icerik: [{ ozel: 'sss' }] }]
  },
  {
    slug: 'iptal-iade', baslik: 'İptal ve İade', yasal: true,
    aciklama: 'mola360 iptal ve iade koşulları: kademeli iade, kaporalı rezervasyon, iadenin yapılışı.',
    bolumler: [
      { id: 'genel', baslik: 'Genel kural', icerik: [
        'Her ürünün kendi kademeli iptal koşulları vardır ve ürün sayfasında, ödeme adımında ve rezervasyon onayında tarihleriyle yazar. Rezervasyonun, onay anındaki koşullara tabidir; ürünün koşulları sonradan değişse bile rezervasyonun kendi koşullarıyla işlem görür.',
        'Kademe, başlangıç saatine kalan süreye göre belirlenir. Otellerde başlangıç giriş günü ve saatidir; turlarda kalkış, etkinlikte temsil, aktivite ve mekânda seans saatidir.'
      ] },
      { id: 'urunler', baslik: 'Satıştaki ürünlerin koşulları', icerik: [{ ozel: 'iptal-tablosu' }] },
      { id: 'kapora', baslik: 'Kaporalı rezervasyonlarda', icerik: [
        'Kesinti, kademenin oranıyla toplam tutar üzerinden hesaplanır; iade, ödediğin kaporadan bu kesinti düşülerek yapılır. Kesinti ödediğin tutarı aşarsa iade yapılmaz, ancak senden ek ödeme istenmez.'
      ] },
      { id: 'nasil', baslik: 'Nasıl iptal edilir', icerik: [
        { liste: [
          'Üyeysen: [Rezervasyonlarım](hesabim/?bolum=rezervasyonlarim) ekranında İptal et. İade tutarı iptalden önce gösterilir.',
          'Üye değilsen: rezervasyon kodunla destek hattını ara ya da [İletişim](kurumsal/iletisim/) sayfasından yaz.',
          'Başlangıç saati geçmiş rezervasyon iptal edilemez.'
        ] }
      ] },
      { id: 'iade', baslik: 'İadenin yapılışı', icerik: [
        'İade, ödemenin yapıldığı karta yapılır. Tutarın kartına yansıma süresi bankana bağlıdır; taksitli ödemelerde iade banka tarafından taksitlere yansıtılır. Ön ödemesiz (ücreti mekânda ödenen) rezervasyonlarda iade söz konusu değildir.'
      ] },
      { id: 'bizden', baslik: 'Bizden kaynaklanan iptal', icerik: [
        'Tur, etkinlik ya da hizmet bizim veya düzenleyenin kararıyla yapılamazsa ödediğin tutarın tamamı iade edilir ve sana haber verilir. Hava koşuluna bağlı aktivitelerde (ör. balon uçuşu) uçuş yapılamazsa ücretin tamamı iade edilir.'
      ] },
      { id: 'degisiklik', baslik: 'Tarih değişikliği', icerik: [
        'Tarih değişikliği yeni tarihteki kontenjana bağlıdır. Rezervasyon kodunla destek hattına ulaş.'
      ] },
      { id: 'cayma', baslik: 'Cayma hakkı', icerik: [
        'Belirli bir tarihte ya da dönemde yapılması gereken konaklama, ulaşım ve eğlence veya dinlenme amaçlı hizmetlerde, Mesafeli Sözleşmeler Yönetmeliği\'nin 15. maddesi gereği cayma hakkı bulunmaz; bu rezervasyonlarda yukarıdaki iptal koşulları uygulanır. Paket turlarda Paket Tur Sözleşmeleri Yönetmeliği hükümleri saklıdır.'
      ] }
    ]
  },
  {
    slug: 'kullanim-kosullari', baslik: 'Kullanım Koşulları', yasal: true,
    aciklama: 'mola360 sitesinin kullanım koşulları.',
    bolumler: [
      { id: 'taraflar', baslik: 'Taraflar ve kapsam', icerik: [
        'Bu koşullar, {unvan} ({marka}) tarafından işletilen internet sitesinin ve sunulan rezervasyon hizmetlerinin kullanımını düzenler. Siteyi kullanan herkes bu koşulları kabul etmiş sayılır. Her rezervasyon için ayrıca ön bilgilendirme formu ve mesafeli satış sözleşmesi düzenlenir.'
      ] },
      { id: 'uyelik', baslik: 'Üyelik', icerik: [
        { liste: [
          'Üyelik ücretsizdir. Üye, verdiği bilgilerin doğru ve güncel olmasından sorumludur.',
          'Hesabın güvenliğinden üye sorumludur; hesabın izinsiz kullanıldığını fark edersen hemen bize bildir.',
          'Kişiye özel kuponlar ve Molapuan başkasına devredilemez.'
        ] }
      ] },
      { id: 'fiyat', baslik: 'Fiyatlar ve para birimi', icerik: [
        'Fiyatlar ürün sayfasında gösterildiği gibidir; isteğe bağlı ek hizmetler ayrıca yazar. Tahsilat Türk lirasıyla yapılır. Döviz fiyatlı ürünlerde Türk lirası tutarı rezervasyon anındaki kurla hesaplanır ve rezervasyona yazılır; kalan ödeme de bu kurla yapılır.',
        'Açık bir hata sonucu yanlış yayınlanan fiyatla yapılan rezervasyonlarda seni bilgilendirir, doğru fiyatla devam etme ya da ücretsiz iptal seçeneği sunarız.'
      ] },
      { id: 'rezervasyon', baslik: 'Rezervasyon ve ödeme', icerik: [
        { liste: [
          'Rezervasyon, ödemenin (ya da kaporanın) onaylanmasıyla kesinleşir. Kontenjan son olarak ödeme adımında kontrol edilir.',
          'Turlarda tutarın {kaporaOrani} kadarı kapora olarak ödenebilir; kalan tutar tercihe göre turdan bir gün önce ya da tur günü araçta ödenir. Kalkışa {kaporaEnAzGun} günden az kaldıysa tutarın tamamı ödenir.',
          'Taksit seçenekleri kart ailesine göre değişir ve ödeme adımında vade farkıyla birlikte gösterilir; {taksitAltSinir} altındaki ödemelerde taksit yapılmaz.',
          'Kart bilgileri {marka}\'da saklanmaz; ödeme, bankanın 3D Secure doğrulamasıyla ödeme kuruluşunun güvenli sayfasında yapılır.',
          'Katılımcı bilgilerinin (ad, soyad, kimlik ya da pasaport numarası, çocuk yaşı) doğru verilmesi rezervasyon sahibinin sorumluluğundadır; yanlış bilgi nedeniyle hizmetten yararlanılamaması iptal koşullarına tabidir.'
        ] }
      ] },
      { id: 'kampanya', baslik: 'Kampanyalar, kuponlar ve Molapuan', icerik: [
        'Kampanya koşulları [Kampanyalar](kampanyalar/) sayfasında yazar ve ödeme adımında aynen uygulanır. Otomatik kampanyalardan en avantajlısı uygulanır; bir kupon kodu bunun üstüne eklenebilir. Kişiye özel kuponlar tek kullanımlıktır. Molapuan tura katılımla kazanılır; puanın kullanım koşulları ayrıca duyurulur.'
      ] },
      { id: 'iptal', baslik: 'İptal ve iade', icerik: [
        'İptal ve iade [İptal ve İade](kurumsal/iptal-iade/) sayfasındaki koşullara göre yapılır.'
      ] },
      { id: 'icerik', baslik: 'İçerik ve fikri mülkiyet', icerik: [
        'Sitedeki metin, tasarım ve yazılımlar {marka}\'ya aittir; izinsiz kopyalanamaz. Kaynağı belirtilen görseller kendi lisanslarıyla kullanılır. Kullanıcı yorumları yayından önce incelenir; yasaya ya da genel ahlaka aykırı içerik yayınlanmaz.'
      ] },
      { id: 'sorumluluk', baslik: 'Sorumluluk', icerik: [
        'Deprem, sel, salgın, resmî makam kararı gibi mücbir sebeplerle hizmetin yapılamaması hâlinde seni bilgilendirir, alternatif tarih ya da iade sunarız. Üçüncü kişilerin sitelerine verilen bağların içeriğinden {marka} sorumlu değildir.'
      ] },
      { id: 'uyusmazlik', baslik: 'Uyuşmazlıklar', icerik: [
        'Bu koşullara Türkiye Cumhuriyeti kanunları uygulanır. Tüketici uyuşmazlıklarında, Ticaret Bakanlığı\'nca her yıl belirlenen parasal sınırlar içinde Tüketici Hakem Heyetlerine, bu sınırların üzerinde Tüketici Mahkemelerine başvurulabilir.'
      ] },
      { id: 'degisiklik', baslik: 'Değişiklikler', icerik: [
        'Bu koşullar güncellenebilir; güncel metin bu sayfada yayınlanır. Yapılmış rezervasyonlar, rezervasyon anındaki koşullara tabidir.'
      ] }
    ]
  },
  {
    slug: 'on-bilgilendirme', baslik: 'Ön Bilgilendirme Formu', yasal: true, menu: false,
    aciklama: 'Mesafeli sözleşmeler için ön bilgilendirme formu.',
    bolumler: [
      { id: 'satici', baslik: '1. Satıcı', icerik: [{ ozel: 'sirket' }] },
      { id: 'hizmet', baslik: '2. Hizmet', icerik: [{ ozel: 'rezervasyon-ozeti' }] },
      { id: 'bedel', baslik: '3. Toplam bedel ve ödeme', icerik: [{ ozel: 'bedel' }] },
      { id: 'ifa', baslik: '4. İfa', icerik: [
        'Hizmet, rezervasyonda yazan tarih ve saatte, ürün sayfasında yazan buluşma noktasında ya da tesiste verilir. Biletler ve rezervasyon belgesi Hesabım bölümünde ve rezervasyonda verilen e-posta adresinde bulunur.'
      ] },
      { id: 'iptal', baslik: '5. İptal koşulları', icerik: [{ ozel: 'iptal-kosullari' }] },
      { id: 'cayma', baslik: '6. Cayma hakkı', icerik: [
        'Belirli bir tarihte ya da dönemde yapılması gereken konaklama, ulaşım ve eğlence veya dinlenme amaçlı hizmetlerde, Mesafeli Sözleşmeler Yönetmeliği\'nin 15. maddesi gereği cayma hakkı bulunmaz. İptal hâlinde yukarıdaki koşullar uygulanır.'
      ] },
      { id: 'sikayet', baslik: '7. Şikâyet ve itiraz', icerik: [
        'Şikâyetlerini [İletişim](kurumsal/iletisim/) sayfasından iletebilirsin. Uyuşmazlıklarda Ticaret Bakanlığı\'nca belirlenen parasal sınırlar içinde Tüketici Hakem Heyetlerine, üzerinde Tüketici Mahkemelerine başvurabilirsin.'
      ] }
    ]
  },
  {
    slug: 'mesafeli-satis-sozlesmesi', baslik: 'Mesafeli Satış Sözleşmesi', yasal: true, menu: false,
    aciklama: 'mola360 mesafeli satış sözleşmesi.',
    bolumler: [
      { id: 'taraflar', baslik: '1. Taraflar', icerik: [
        'Satıcı: aşağıda bilgileri yazan {unvan}. Alıcı: rezervasyonu yapan ve ödeme adımında ad, soyad, e-posta ve telefon bilgilerini veren kişi.',
        { ozel: 'sirket' }
      ] },
      { id: 'konu', baslik: '2. Konu', icerik: [
        'Bu sözleşmenin konusu, alıcının internet sitesinden rezervasyonunu yaptığı aşağıdaki hizmetin satışı ve ifasına ilişkin tarafların hak ve yükümlülükleridir.',
        { ozel: 'rezervasyon-ozeti' }
      ] },
      { id: 'bedel', baslik: '3. Bedel ve ödeme', icerik: [{ ozel: 'bedel' }] },
      { id: 'ifa', baslik: '4. Hizmetin ifası', icerik: [
        'Satıcı, hizmeti rezervasyonda yazan tarih ve saatte, ürün sayfasında açıklanan içerikle sunar. Alıcı, katılımcı bilgilerini doğru vermekle ve ürün sayfasındaki kurallara (buluşma saati, yaş sınırı, kimlik ibrazı gibi) uymakla yükümlüdür.'
      ] },
      { id: 'iptal', baslik: '5. İptal ve iade', icerik: [
        { ozel: 'iptal-kosullari' },
        'Satıcı kaynaklı iptalde ödenen tutarın tamamı iade edilir. İade, ödemenin yapıldığı karta yapılır.'
      ] },
      { id: 'cayma', baslik: '6. Cayma hakkı', icerik: [
        'Hizmet belirli bir tarihte ya da dönemde yapılması gereken konaklama, ulaşım ve eğlence veya dinlenme amaçlı bir hizmet olduğundan, Mesafeli Sözleşmeler Yönetmeliği\'nin 15. maddesi gereği cayma hakkı bulunmaz. Paket turlarda Paket Tur Sözleşmeleri Yönetmeliği hükümleri saklıdır.'
      ] },
      { id: 'uyusmazlik', baslik: '7. Uyuşmazlık', icerik: [
        'Bu sözleşmeye Türkiye Cumhuriyeti kanunları uygulanır. Uyuşmazlıklarda Ticaret Bakanlığı\'nca belirlenen parasal sınırlar içinde Tüketici Hakem Heyetleri, üzerinde Tüketici Mahkemeleri yetkilidir.'
      ] },
      { id: 'yururluk', baslik: '8. Yürürlük', icerik: [
        'Alıcı, ödeme adımında bu sözleşmeyi ve ön bilgilendirme formunu okuyup onayladığında sözleşme kurulur; rezervasyon ödemenin onaylanmasıyla kesinleşir.'
      ] }
    ]
  },
  {
    slug: 'kvkk', baslik: 'KVKK Aydınlatma Metni', menuAdi: 'KVKK', yasal: true,
    aciklama: 'Kişisel verilerin korunması hakkında aydınlatma metni.',
    bolumler: [
      { id: 'sorumlu', baslik: 'Veri sorumlusu', icerik: [
        '6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca kişisel verilerin, veri sorumlusu sıfatıyla {unvan} ({marka}) tarafından aşağıda açıklanan şekilde işlenir.',
        { ozel: 'sirket' }
      ] },
      { id: 'veriler', baslik: 'İşlenen veriler', icerik: [
        { tablo: { basliklar: ['Kategori', 'Veriler', 'Ne zaman'], satirlar: [
          ['Kimlik', 'Ad, soyad; turlarda T.C. kimlik ya da pasaport numarası; katılımcı yaşı', 'Rezervasyonda'],
          ['İletişim', 'E-posta, cep telefonu', 'Üyelikte ve rezervasyonda'],
          ['Müşteri işlem', 'Rezervasyon, ödeme planı ve durumu, kuponlar, Molapuan, favoriler, yorumlar, iletişim talepleri', 'Siteyi kullandıkça'],
          ['Finans', 'Ödeme tutarı, taksit ve iade bilgisi; kurumsal faturada unvan, vergi dairesi ve numarası. Kart numarası işlenmez; ödeme kuruluşu işler.', 'Ödemede'],
          ['Pazarlama', 'Kampanya e-postası ve SMS izni', 'İzin verirsen']
        ] } }
      ] },
      { id: 'amac', baslik: 'İşleme amaçları ve hukuki sebepler', icerik: [
        { liste: [
          'Rezervasyonun yapılması, ödemenin alınması, biletin düzenlenmesi ve hizmetin verilmesi (KVKK md. 5/2-c: sözleşmenin kurulması ve ifası).',
          'Yolcu listesi, konaklama bildirimleri, fatura ve muhasebe kayıtları gibi yasal yükümlülüklerin yerine getirilmesi (md. 5/2-ç).',
          'Rezervasyonla ilgili bilgilendirme, kalan ödeme için arama ve müşteri desteği (md. 5/2-c ve 5/2-f: meşru menfaat).',
          'Kampanya ve fırsat iletileri (md. 5/1: açık rıza; iznini istediğin zaman geri alabilirsin).'
        ] }
      ] },
      { id: 'aktarim', baslik: 'Aktarım', icerik: [
        'Verilerin, yalnızca yukarıdaki amaçlar için gerekli olduğu ölçüde şunlara aktarılabilir: ödeme kuruluşu ve bankalar; hizmetin verildiği konaklama tesisleri, ulaşım ve etkinlik sağlayıcıları; seyahat sigortası sağlayan sigorta şirketi; barındırma, e-posta ve SMS hizmeti aldığımız tedarikçiler; talep hâlinde yetkili kamu kurum ve kuruluşları.',
        'Yurt dışı turlarda, hizmetin verilebilmesi için gerekli veriler yurt dışındaki konaklama ve ulaşım sağlayıcılarına, KVKK\'nın 9. maddesindeki şartlara uygun olarak aktarılır.'
      ] },
      { id: 'toplama', baslik: 'Toplama yöntemi', icerik: [
        'Veriler, internet sitesindeki formlar (üyelik, rezervasyon, iletişim), destek hattı ve WhatsApp üzerinden, elektronik ortamda toplanır.'
      ] },
      { id: 'sure', baslik: 'Saklama süresi', icerik: [
        'Veriler, işleme amacının gerektirdiği süre ve Türk Ticaret Kanunu ile Vergi Usul Kanunu gibi mevzuattaki saklama süreleri boyunca saklanır; süre bitince silinir, yok edilir ya da anonim hâle getirilir.'
      ] },
      { id: 'haklar', baslik: 'Hakların (KVKK md. 11)', icerik: [
        { liste: [
          'Verilerinin işlenip işlenmediğini öğrenme ve işlenmişse bilgi isteme,',
          'İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,',
          'Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,',
          'Eksik veya yanlış işlenmişse düzeltilmesini, şartları oluşmuşsa silinmesini veya yok edilmesini isteme ve bunların aktarıldığı kişilere bildirilmesini isteme,',
          'Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç çıkmasına itiraz etme,',
          'Kanuna aykırı işleme nedeniyle zarara uğrarsan zararın giderilmesini talep etme.'
        ] }
      ] },
      { id: 'basvuru', baslik: 'Başvuru', icerik: [
        'Başvurunu, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ\'e uygun olarak yazılı olarak {adres} adresine, KEP ile {kep} adresine ya da sistemimizde kayıtlı e-posta adresinden {eposta} adresine iletebilirsin. Başvurular en geç 30 gün içinde ücretsiz sonuçlandırılır.',
        'Hesap ayarlarındaki Hesabı sil düğmesi hesabını ve kişisel kuponlarını siler; yasal saklama yükümlülüğü olan rezervasyon kayıtları saklama süresi boyunca tutulur.'
      ] }
    ]
  },
  {
    slug: 'cerez-politikasi', baslik: 'Çerez Politikası', menuAdi: 'Çerezler', yasal: true,
    aciklama: 'mola360 sitesinde kullanılan çerezler ve tarayıcı deposu.',
    bolumler: [
      { id: 'cerez', baslik: 'Çerez kullanıyor muyuz?', icerik: [
        'Sitemiz bugün çerez (cookie) kullanmıyor; reklam ve ölçüm (analitik) aracı da yok. Siteyi kullanırken bazı bilgiler yalnızca senin tarayıcının deposunda (localStorage) tutulur, sunucumuza gönderilmez.'
      ] },
      { id: 'depo', baslik: 'Tarayıcı deposunda tutulanlar', icerik: [{ ozel: 'depo-listesi' },
        'Bu bilgileri tarayıcının site verilerini temizleyerek silebilirsin. Ölçüm ya da reklam çerezi eklenirse önce bu sayfa güncellenecek ve senden izin istenecek.'
      ] },
      { id: 'ucuncu', baslik: 'Üçüncü taraf içerikler', icerik: [
        'Yazı tipleri Google Fonts\'tan, bazı görseller Wikimedia Commons ve Unsplash\'ten, görseli henüz eklenmemiş kartların yer tutucu görselleri Picsum\'dan yüklenir. Bu içerikler yüklenirken tarayıcın, IP adresi gibi teknik bilgileri bu sağlayıcılara iletir.',
        'Harita bağlantıları Google Haritalar\'ı, WhatsApp bağlantısı WhatsApp\'ı açar; oradaki işlemler bu hizmetlerin kendi koşullarına tabidir.'
      ] }
    ]
  }
];

/* Tarayıcı deposundaki anahtarlar (çerez politikası). Yeni anahtar
   eklenince buraya da yazılmalı; tests/kurumsal.test.js koddaki
   anahtarlarla bu listeyi karşılaştırıyor. */
const KRM_DEPO = [
  { anahtar: 'mola360.sonAramalar', amac: 'Son aramaların (en fazla 8)' },
  { anahtar: 'mola360.sonGorulenler', amac: 'Son görüntülediğin ürünler (en fazla 12)' },
  { anahtar: 'mola360.favoriler', amac: 'Favorilerin' },
  { anahtar: 'mola360.hesaplar', amac: 'Bu tarayıcıda açılan deneme hesabı' },
  { anahtar: 'mola360.oturum', amac: 'Oturumun açık olduğu hesap' },
  { anahtar: 'mola360.rezervasyonlar', amac: 'Deneme rezervasyonların' },
  { anahtar: 'mola360.bildirimDurumu', amac: 'Okuduğun ve kaldırdığın bildirimler' },
  { anahtar: 'mola360.yorumlar', amac: 'Onay bekleyen yorumların' },
  { anahtar: 'mola360.talepler', amac: 'İletişim ve geri arama taleplerin' },
  { anahtar: 'm360-admin-taslaklar', amac: 'Yalnızca yönetim ekranını kullananlarda: kaydedilmemiş içerik taslakları' },
  { anahtar: 'm360-admin-kilit', amac: 'Yalnızca yönetim ekranını kullananlarda: ekran kilidi' },
  { anahtar: 'm360-admin-oturum', amac: 'Yalnızca yönetim ekranını kullananlarda: oturum (sekme kapanınca silinir)' }
];

/* ---------------- metin ---------------- */
function krmKacis(m) {
  return String(m === undefined || m === null ? '' : m)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Metni HTML'e çevir: kaçış, {yer tutucu} ve [bağ](yol). Değeri
   bilinmeyen şirket alanı işaretli yer tutucu olur. baglam: krmBaglam(). */
function krmMetin(metin, baglam) {
  const b = baglam || {};
  let html = krmKacis(metin);
  html = html.replace(/\{([a-zA-Z]+)\}/g, (tam, ad) => {
    if (Object.prototype.hasOwnProperty.call(b, ad) && b[ad] !== null && b[ad] !== undefined && b[ad] !== '') return krmKacis(b[ad]);
    const alan = KRM_SIRKET_ALANLARI.find(a => a[0] === ad);
    return '<mark class="krm-eksik">[' + krmKacis(alan ? alan[1] : ad) + ' eklenecek]</mark>';
  });
  html = html.replace(/\[([^\]]+)\]\(([a-z0-9/?=&#._-]*)\)/gi, (tam, yazi, yol) => '<a href="' + yol + '">' + yazi + '</a>');
  return html;
}
/* Düz metin (yapısal veri, meta açıklama): yer tutucu çözülür, bağ yazısı kalır. */
function krmDuzMetin(metin, baglam) {
  const b = baglam || {};
  return String(metin || '')
    .replace(/\{([a-zA-Z]+)\}/g, (tam, ad) => (b[ad] !== null && b[ad] !== undefined && b[ad] !== '') ? String(b[ad]) : '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

/* Yer tutucuların değerleri: şirket, iletişim ve kural tabloları.
   kaynak: { sirket, contact, kapora, taksit, kampanyalar, hosgeldin, para } */
function krmBaglam(kaynak) {
  const k = kaynak || {};
  const s = k.sirket || KRM_SIRKET;
  const para = k.para || (n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' TL');
  const kap = k.kapora || {};
  const tak = k.taksit || {};
  const hos = (k.kampanyalar || []).find(x => x.kod === 'yeni-uye') || null;
  return Object.assign({}, s, {
    telefon: k.contact ? k.contact.phoneLabel : null,
    telefonSaatleri: k.contact ? k.contact.hours : null,
    kaporaOrani: kap.oran ? '%' + Math.round(kap.oran * 100) : null,
    kaporaEnAzGun: kap.enAzGun || null,
    taksitAltSinir: tak.altSinir ? para(tak.altSinir) : null,
    kartAileleri: tak.aileler ? tak.aileler.map(a => a.ad).join(', ') : null,
    hosgeldinOrani: hos && hos.indirim && hos.indirim.oran ? '%' + Math.round(hos.indirim.oran * 100) : null,
    hosgeldinGun: k.hosgeldin ? k.hosgeldin.gun : null
  });
}

/* Şirket kimliğinde eksik alanlar (yasal sayfaların taslak uyarısı). */
function krmEksikAlanlar(sirket) {
  const s = sirket || KRM_SIRKET;
  return KRM_SIRKET_ALANLARI.filter(([ad]) => !s[ad]).map(([ad, etiket]) => ({ ad, etiket }));
}

function krmSayfa(slug) {
  return KRM_SAYFALAR.find(s => s.slug === slug) || null;
}
function krmSssKategorisi(id) {
  return KRM_SSS_KATEGORILER.find(k => k.id === id) || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    KRM_SIRKET, KRM_SIRKET_ALANLARI, KRM_GUNCELLEME, KRM_SSS_KATEGORILER, KRM_SSS, KRM_SAYFALAR, KRM_DEPO,
    krmKacis, krmMetin, krmDuzMetin, krmBaglam, krmEksikAlanlar, krmSayfa, krmSssKategorisi
  };
}
