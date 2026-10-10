/* ÖRNEK İÇERİK: ürün sayfasındaki açıklama, program, dahil/hariç, buluşma
   noktası ve örnek değerlendirmeler. Metinler uydurma; gerçekte işletmenin
   girdiği ürün verisinden gelecek. Sayfalar bunu doğrudan değil api.js'in
   productDetails() işleviyle okur.

   Her ürün: about (açıklama), program ([etiket, başlık, açıklama]),
   yer ([adres, not]), dahil, haric, bilgi (bilmen gerekenler). */

export const DETAY={
 /* Turlar: hepsi İzmir çıkışlı */
 'Efes ve Şirince Turu':{about:'Antik Efes\'in mermer caddelerinde rehberle yürüyüş, ardından Şirince\'nin taş evleri arasında serbest zaman. Bir günde iki farklı Ege.',
  program:[['08:00','İzmir\'den hareket','Bornova, Konak ve Gaziemir\'den alış.'],['10:00','Efes Antik Kenti','Celsus Kütüphanesi, Büyük Tiyatro ve Kuretler Caddesi; yaklaşık 2,5 saat rehberli gezi.'],
   ['13:00','Öğle yemeği','Selçuk\'ta ev yemekleri.'],['14:30','Şirince','Köyde serbest zaman, şarap ve zeytinyağı tadımı.'],['18:30','İzmir\'e dönüş','Alış noktalarına bırakış.']],
  yer:['Konak, İzmir · Saat Kulesi önü','Sabah 08:00. Bornova\'dan 07:40\'ta, Gaziemir\'den 08:20\'de alış.'],
  dahil:['Klimalı araçla ulaşım','Profesyonel rehber','Öğle yemeği'],haric:['Efes Antik Kenti girişi','İçecekler','Tadım ürünleri'],
  bilgi:['Ören yerinde gölge az; şapka ve su getir.']},

 'Pamukkale ve Hierapolis':{about:'Beyaz travertenlerde çıplak ayakla yürüyüş, Hierapolis Antik Kenti ve isteyene Antik Havuz\'da yüzme.',
  program:[['07:30','İzmir\'den hareket','Karşıyaka, Konak ve Bornova\'dan alış.'],['11:30','Hierapolis','Antik tiyatro ve Kuzey Nekropol, rehberli.'],
   ['13:00','Travertenler','Serbest zaman, isteyene Antik Havuz.'],['14:30','Öğle yemeği','Karahayıt\'ta açık büfe.'],['19:30','İzmir\'e varış','Yolda bir mola; alış noktalarına bırakış.']],
  yer:['Konak, İzmir · Saat Kulesi önü','Sabah 07:30. Karşıyaka\'dan 07:00\'de, Bornova\'dan 07:50\'de alış.'],
  dahil:['Klimalı araçla ulaşım','Rehberlik','Öğle yemeği'],haric:['Ören yeri girişi','Antik Havuz girişi'],
  bilgi:['Travertenlerde ayakkabıyla yürünmez; çıkarıp elinde taşırsın.','Mayo ve havlu getir.']},

 'Bergama ve Asklepion Turu':{about:'Bergama Akropolü\'nün dik tiyatrosu ve Trajan Tapınağı, ardından antik dünyanın ünlü sağlık merkezi Asklepion. Rehberle, sakin bir tempoda bir gün.',
  program:[['08:00','İzmir\'den hareket','Bornova, Konak ve Karşıyaka\'dan alış.'],['10:00','Bergama Akropolü','Teleferikle çıkış; Trajan Tapınağı, tiyatro ve kütüphane kalıntıları.'],
   ['12:30','Öğle yemeği','Bergama\'da ev yemekleri ve Bergama köftesi.'],['14:00','Asklepion','Kutsal yol, şifa tüneli ve tiyatro; yaklaşık 1,5 saat rehberli gezi.'],['18:00','İzmir\'e dönüş','Alış noktalarına bırakış.']],
  yer:['Konak, İzmir · Saat Kulesi önü','Sabah 08:00. Bornova\'dan 07:40\'ta, Karşıyaka\'dan 08:25\'te alış.'],
  dahil:['Klimalı otobüsle ulaşım','Profesyonel rehber','Öğle yemeği'],haric:['Ören yeri girişleri','Akropol teleferiği','İçecekler'],
  bilgi:['Akropol\'de basamaklar dik ve taş; rahat ayakkabı giy.','Müze kartın varsa yanına al; ören yeri girişlerinde geçerli.']},

 'İzmir Şehir Turu: Kemeraltı ve Kadifekale':{about:'Konak\'tan Kemeraltı\'nın hanlarına, Agora\'dan Kadifekale\'ye: İzmir\'in eski şehrini rehberle yarım günde gez. Tur, Asansör\'de körfeze bakarak biter.',
  program:[['09:30','Konak Meydanı','Saat Kulesi ve Yalı Camii; rehberle tanışma.'],['10:00','Kemeraltı','Kızlarağası Hanı, Hisar Camii ve çarşı; han avlusunda kahve molası.'],
   ['11:30','Agora','Smyrna Agorası\'nın sütunlu galerileri.'],['12:15','Kadifekale','Minibüsle çıkış; surlar ve bütün körfezin manzarası.'],['13:15','Asansör ve Karataş','Tarihi asansör ve Dario Moreno Sokağı; 14:00\'te Konak\'ta bitiş.']],
  yer:['Konak, İzmir · Saat Kulesi önü','Sabah 09:30. Bornova ve Karşıyaka\'dan servisle alış ve bırakış.'],
  dahil:['Minibüsle ulaşım','Profesyonel rehber','Kahve ve boyoz ikramı'],haric:['Agora girişi','Öğle yemeği'],
  bilgi:['Yaklaşık 3 km yürünür; rahat ayakkabı giy.','Pazar günü Kemeraltı\'ndaki dükkânların bir kısmı kapalı olur.']},

 'Ege Adaları Balayı Kaçamağı':{about:'Çeşme\'den feribotla kısa bir geçiş: Sakız Adası\'nın sakız köyleri, Mesta\'nın dar sokakları ve deniz kenarında iki akşam yemeği. Çiftler için tasarlandı.',
  program:[['1. gün','Feribot ve Sakız','İzmir\'den servisle Çeşme Limanı\'na, feribotla Sakız. Butik otele yerleşme, limanda akşam yemeği.'],
   ['2. gün','Sakız köyleri','Pirgi\'nin desenli evleri, Mesta ve Mavra Volia plajı.'],['3. gün','Dönüş','Serbest sabah, öğleden sonra feribotla Çeşme ve servisle İzmir.']],
  yer:['Çeşme Limanı, İzmir','Pasaport kontrolü için feribottan 1 saat önce limanda ol. Konak\'tan servis var.'],
  dahil:['Gidiş-dönüş feribot','Konak – Çeşme Limanı servisi','2 gece butik otel, kahvaltı dahil','Ada turu ve rehberlik','İki akşam yemeği'],haric:['Kapıda vize ücreti','Öğle yemekleri'],
  bilgi:['Pasaportun dönüşten sonra en az 6 ay geçerli olmalı.','Kapıda vize uygulaması dönemsel; yola çıkmadan geçerli olup olmadığını teyit ederiz.']},

 'Midilli Adası Kaçamağı':{about:'Dikili\'den feribotla Midilli: taş köyler, zeytinlikler ve Molivos\'ta gün batımı.',
  program:[['1. gün','Feribot ve Midilli','İzmir\'den servisle Dikili Limanı\'na, feribotla Midilli. Otele yerleşme, Midilli kordonunda akşam.'],
   ['2. gün','Molivos ve Petra','Kalenin altındaki balıkçı köyü Molivos ve Petra plajı.'],['3. gün','Dönüş','Serbest sabah, feribotla Dikili ve servisle İzmir.']],
  yer:['Dikili Limanı, İzmir','Pasaport kontrolü için feribottan 1 saat önce limanda ol. Konak ve Karşıyaka\'dan servis var.'],
  dahil:['Gidiş-dönüş feribot','İzmir – Dikili Limanı servisi','2 gece otel, kahvaltı dahil','Ada turu'],haric:['Kapıda vize ücreti','Öğle ve akşam yemekleri'],
  bilgi:['Pasaportun dönüşten sonra en az 6 ay geçerli olmalı.','Kapıda vize uygulaması dönemsel; yola çıkmadan geçerli olup olmadığını teyit ederiz.']},

 'Kapadokya Turu':{about:'Peri bacaları, yeraltı şehirleri ve vadi yürüyüşleriyle dört günlük bir Kapadokya molası. Konaklama Göreme\'de mağara odalı bir otelde; sabahları balonları terastan izleyebilirsin.',
  program:[['1. gün','İzmir\'den Kayseri\'ye','Adnan Menderes Havalimanı\'ndan sabah uçuşu; Kayseri\'de karşılama, otele transfer. Öğleden sonra Göreme Açık Hava Müzesi ve Uçhisar Kalesi.'],
   ['2. gün','Yeraltı şehri ve Ihlara Vadisi','Derinkuyu Yeraltı Şehri, Ihlara Vadisi\'nde 4 km yürüyüş ve Selime Manastırı.'],
   ['3. gün','Peri bacaları ve Avanos','İsteğe bağlı sabah balon turu. Paşabağ, Devrent Vadisi ve Avanos\'ta çömlek atölyesi.'],
   ['4. gün','Dönüş','Kahvaltıdan sonra serbest zaman, öğleden sonra Kayseri Havalimanı\'na transfer ve İzmir\'e uçuş.']],
  yer:['İzmir Adnan Menderes Havalimanı, iç hatlar','Uçuştan 2 saat önce Mola360 karşılama noktasında.'],
  dahil:['İzmir – Kayseri gidiş-dönüş uçak bileti','3 gece mağara otelde konaklama, kahvaltı dahil','Havalimanı transferleri ve gezi ulaşımı','Profesyonel rehberlik'],
  haric:['Balon turu (isteğe bağlı)','Müze ve ören yeri girişleri','Öğle ve akşam yemekleri'],
  bilgi:['Vadi yürüyüşü için rahat ayakkabı getir.','Balon uçuşu hava koşuluna bağlı; uçulmazsa balon ücreti iade edilir.']},

 'Karadeniz Yaylaları Turu':{about:'Ayder\'in sisli yaylaları, Uzungöl, Zil Kale ve Fırtına Vadisi. Karadeniz\'in yeşili beş günde.',
  program:[['1. gün','İzmir\'den Trabzon\'a','Adnan Menderes Havalimanı\'ndan uçuş; Trabzon\'da karşılama, öğleden sonra Sümela Manastırı.'],['2. gün','Uzungöl','Göl çevresinde yürüyüş, Çaykara.'],
   ['3. gün','Ayder','Ayder Yaylası, Gelintülü Şelalesi, kaplıca.'],['4. gün','Fırtına Vadisi','Zil Kale, Palovit Şelalesi ve Çamlıhemşin.'],['5. gün','Dönüş','Sabah Trabzon Havalimanı\'na transfer, İzmir\'e uçuş.']],
  yer:['İzmir Adnan Menderes Havalimanı, iç hatlar','Uçuştan 2 saat önce Mola360 karşılama noktasında.'],
  dahil:['İzmir – Trabzon gidiş-dönüş uçak bileti','4 gece otel, sabah ve akşam yemeği','Programdaki ulaşım','Rehberlik'],haric:['Sümela Manastırı girişi','Öğle yemekleri'],
  bilgi:['Yaylada hava çabuk değişir; yağmurluk al.']},

 'Turistik Doğu Ekspresi':{about:'İzmir\'den Ankara\'ya uçup oradan Kars\'a yataklı trenle yolculuk; duraklarda kısa geziler, Kars\'ta Ani Ören Yeri ve Çıldır Gölü.',
  program:[['1. gün','İzmir\'den Ankara\'ya','Sabah Adnan Menderes Havalimanı\'ndan Ankara\'ya uçuş, Ankara Garı\'na transfer. Öğleden sonra yataklı vagona yerleşme, akşam yemeği trende.'],
   ['2. gün','İliç ve Erzincan','Duraklarda kısa geziler, Fırat vadisi manzarası.'],
   ['3. gün','Kars','Varış, Kars Kalesi ve Baltık mimarisi.'],['4. gün','Ani ve Çıldır','Ani Ören Yeri ve Çıldır Gölü.'],
   ['5. gün','Erzurum','Çifte Minareli Medrese ve cağ kebabı.'],['6. gün','Dönüş','Erzurum\'dan İzmir\'e uçuş.']],
  yer:['İzmir Adnan Menderes Havalimanı, iç hatlar','Ankara uçuşundan 2 saat önce Mola360 karşılama noktasında.'],
  dahil:['İzmir – Ankara ve Erzurum – İzmir uçak biletleri','Yataklı vagon, iki kişilik kompartıman','Kars ve Erzurum\'da 3 gece otel, kahvaltı dahil','Duraklardaki geziler','Havalimanı ve gar transferleri'],
  haric:['Trendeki yemekler','Ören yeri girişleri'],
  bilgi:['Kasımdan itibaren Kars çok soğuk; kalın giyin.','Kompartımanda bavul yeri dar; orta boy bir valiz yeterli.']},

 'Erciyes Kayak Haftası':{about:'Erciyes\'in uzun pistlerinde üç gün kayak: başlayanlara grup dersi, deneyimlilere serbest kayak.',
  program:[['1. gün','İzmir\'den Kayseri\'ye','Adnan Menderes Havalimanı\'ndan uçuş; Kayseri\'de karşılama, pist dibindeki otele yerleşme, ekipman provası.'],['2. gün','Kayak','Seviyene göre grup dersi ya da serbest kayak.'],
   ['3. gün','Kayak','Tekir ve Hacılar kapılarındaki pistler.'],['4. gün','Kayak ve Kayseri','Öğleden sonra şehirde mantı ve pastırma molası.'],['5. gün','Dönüş','Kayseri\'den İzmir\'e uçuş.']],
  yer:['İzmir Adnan Menderes Havalimanı, iç hatlar','Uçuştan 2 saat önce Mola360 karşılama noktasında.'],
  dahil:['İzmir – Kayseri gidiş-dönüş uçak bileti','4 gece otel, sabah ve akşam yemeği','Havalimanı transferleri','3 günlük skipass'],haric:['Kayak ekipmanı kiralama','Kayak dersi'],
  bilgi:['Pistlerin açılışı kara bağlı; kalkıştan 7 gün önce netleşir, açılmazsa ödemen iade edilir.']},

 'Balkanlar: Saraybosna ve Mostar':{about:'Saraybosna\'nın Başçarşı\'sı, Mostar Köprüsü ve Bosna\'nın yeşil vadileri. Osmanlı izleriyle Avrupa\'nın buluştuğu beş gün.',
  program:[['1. gün','İzmir\'den Saraybosna\'ya','Adnan Menderes Havalimanı\'ndan uçuş, karşılama, Başçarşı\'da akşam yürüyüşü.'],['2. gün','Saraybosna','Gazi Hüsrev Bey Camii, Latin Köprüsü ve Tünel Müzesi.'],
   ['3. gün','Mostar','Konjic üzerinden Mostar, Stari Most ve eski çarşı.'],['4. gün','Blagaj ve Kravice','Blagaj Tekkesi ve Kravice şelaleleri.'],['5. gün','Dönüş','Saraybosna\'dan İzmir\'e uçuş.']],
  yer:['İzmir Adnan Menderes Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['İzmir – Saraybosna gidiş-dönüş uçak bileti','4 gece otel, kahvaltı dahil','Programdaki ulaşım','Rehberlik'],haric:['Müze girişleri','Öğle ve akşam yemekleri'],
  bilgi:['Türk vatandaşları vizesiz girer; pasaport en az 6 ay geçerli olmalı.']},

 'Dubai Turu':{about:'Burj Khalifa\'nın seyir katı, çöl safarisi ve eski Dubai\'nin baharat çarşısı. Ailelere uygun, sakin bir tempo.',
  program:[['1. gün','İzmir\'den Dubai\'ye','Adnan Menderes Havalimanı\'ndan uçuş, otele transfer, akşam Dubai Marina.'],['2. gün','Eski Dubai','Abra ile Creek geçişi, Altın ve Baharat Çarşısı.'],
   ['3. gün','Çöl safarisi','Öğleden sonra kum tepeleri, kamp ve akşam yemeği.'],['4. gün','Burj Khalifa','Dubai Mall ve seyir katı.'],['5. gün','Dönüş','Dubai\'den İzmir\'e uçuş.']],
  yer:['İzmir Adnan Menderes Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['İzmir – Dubai gidiş-dönüş uçak bileti','4 gece otel, kahvaltı dahil','Çöl safarisi ve akşam yemeği','Rehberlik'],haric:['E-vize ücreti','Burj Khalifa girişi','Öğle yemekleri'],
  bilgi:['E-vize başvurusunu kalkıştan en az 10 gün önce yap; başvuruda yardımcı oluruz.']},

 'İtalya: Roma, Floransa ve Venedik':{about:'Kolezyum\'dan Uffizi\'ye, Rialto Köprüsü\'nden Toskana tepelerine: İtalya\'nın üç büyük şehri tek rotada.',
  program:[['1. gün','İzmir\'den Roma\'ya','Adnan Menderes Havalimanı\'ndan uçuş; Trevi Çeşmesi ve İspanyol Merdivenleri.'],['2. gün','Roma ve Vatikan','Kolezyum, Roma Forumu ve Vatikan Müzeleri.'],
   ['3. gün','Floransa','Hızlı trenle Floransa, Duomo ve Ponte Vecchio.'],['4. gün','Toskana','Siena ve Pisa\'ya günübirlik.'],
   ['5. gün','Venedik','Trenle Venedik, San Marco Meydanı ve gondol.'],['6. gün','Dönüş','Venedik\'ten İzmir\'e uçuş.']],
  yer:['İzmir Adnan Menderes Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['İzmir – Roma, Venedik – İzmir uçak biletleri','5 gece otel, kahvaltı dahil','Şehirler arası hızlı tren','Rehberlik'],haric:['Schengen vize ücreti','Müze girişleri','Şehir konaklama vergisi'],
  bilgi:['Schengen vizesine kalkıştan en az 1 ay önce başvur.']},

 'İspanya: Barselona ve Madrid':{about:'Gaudí\'nin Barselona\'sı ve Prado\'nun Madrid\'i; arada tapas ve flamenko.',
  program:[['1. gün','İzmir\'den Barselona\'ya','Adnan Menderes Havalimanı\'ndan uçuş; Gotik Mahalle ve La Rambla.'],['2. gün','Gaudí günü','Sagrada Família, Park Güell ve Passeig de Gràcia.'],
   ['3. gün','Serbest gün','İsteyene Montserrat gezisi.'],['4. gün','Madrid','Hızlı trenle Madrid, Plaza Mayor.'],
   ['5. gün','Madrid','Prado Müzesi, Retiro Parkı, akşam flamenko.'],['6. gün','Dönüş','Madrid\'den İzmir\'e uçuş.']],
  yer:['İzmir Adnan Menderes Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['İzmir – Barselona, Madrid – İzmir uçak biletleri','5 gece otel, kahvaltı dahil','Barselona – Madrid hızlı tren','Rehberlik'],haric:['Schengen vize ücreti','Müze girişleri','Montserrat gezisi'],
  bilgi:['Schengen vizesine kalkıştan en az 1 ay önce başvur.']},

 'Fransa: Paris ve Loire Şatoları':{about:'Paris\'in bulvarları ve Loire Vadisi\'nin şatoları: Chambord, Chenonceau ve Versay.',
  program:[['1. gün','İzmir\'den Paris\'e','Adnan Menderes Havalimanı\'ndan uçuş; Eyfel Kulesi ve Seine kıyısı.'],['2. gün','Paris','Louvre, Marais ve Montmartre.'],
   ['3. gün','Loire şatoları','Chambord ve Chenonceau\'ya günübirlik.'],['4. gün','Versay','Versay Sarayı ve bahçeleri, akşam serbest.'],['5. gün','Dönüş','Paris\'ten İzmir\'e uçuş.']],
  yer:['İzmir Adnan Menderes Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['İzmir – Paris gidiş-dönüş uçak bileti','4 gece otel, kahvaltı dahil','Loire ve Versay ulaşımı','Rehberlik'],haric:['Schengen vize ücreti','Saray ve müze girişleri'],
  bilgi:['Schengen vizesine kalkıştan en az 1 ay önce başvur.']},

 /* Etkinlikler */
 'Kordon Caz Akşamları':{about:'Kordon\'da gün batımında açık havada caz. Bu akşam bir dörtlü ve konuk vokal sahnede.',
  program:[['19:00','Kapı açılışı',''],['20:00','Konser','Ara dahil yaklaşık 2 saat.'],['22:15','Kapanış','']],
  yer:['Kordon Açıkhava, Alsancak, İzmir','Alsancak vapur iskelesine 5 dakika yürüme.'],
  dahil:['Genel giriş, oturma ve ayakta alan'],haric:['Yiyecek ve içecek'],
  bilgi:['Biletin telefonunda; girişte QR kod okutulur.','Yağmurda konser ertelenir, biletin geçerli kalır.']},

 'Kültürpark Açıkhava Konserleri':{about:'Kültürpark Açıkhava Tiyatrosu\'nda yıldızların altında bir akşam konseri. Ağaçların arasındaki amfide açık havada canlı müzik.',
  program:[['19:30','Kapı açılışı',''],['21:00','Konser','Yaklaşık 2 saat.']],
  yer:['Kültürpark Açıkhava Tiyatrosu, Konak, İzmir','Montrö Kapısı\'ndan girilir; Basmane\'ye 10 dakika yürüme.'],
  dahil:['Konser girişi, tribünde numarasız oturma'],haric:['Yiyecek ve içecek','Otopark'],
  bilgi:['Akşam serin olur; ince bir hırka al.','Yağmurda konser ertelenir, biletin geçerli kalır.']},

 'İzmir Senfoni Gecesi':{about:'Saygun Sanat Merkezi\'nin büyük salonunda senfoni orkestrasıyla bir akşam: ilk bölümde bir uvertür ve keman konçertosu, ikinci bölümde bir senfoni.',
  program:[['19:15','Kapı açılışı',''],['20:00','1. bölüm','Uvertür ve keman konçertosu.'],['20:50','Ara','20 dakika.'],['21:10','2. bölüm','Senfoni; 22:00 civarı biter.']],
  yer:['Saygun Sanat Merkezi, Güzelyalı, İzmir','Mithatpaşa Caddesi üzerinde; Göztepe vapur iskelesine 10 dakika yürüme.'],
  dahil:['Konser girişi, numaralı koltuk'],haric:['Otopark','Fuayedeki ikramlar'],
  bilgi:['Konser başladıktan sonra salona ilk arada alınırsın.','Konser sırasında fotoğraf ve video çekilmez.']},

 'Bornova Stand Up Gecesi':{about:'Üç komedyen, tek gece: kısa setlerle 90 dakikalık stand-up.',
  program:[['20:30','Kapı açılışı',''],['21:30','Gösteri','Yaklaşık 90 dakika, arasız.']],
  yer:['Bornova Sahnesi, Bornova, İzmir','Bornova metrosuna 5 dakika yürüme.'],
  dahil:['Genel giriş, numarasız oturma'],haric:['İçecekler'],
  bilgi:['18 yaş sınırı var.','Gösteri başladıktan sonra salona alınmaz.']},

 'Konak Sahnesi Tiyatro Akşamı':{about:'Konak\'ta küçük bir salonda iki perdelik bir komedi. Sahne seyirciye çok yakın; her koltuktan iyi görülür.',
  program:[['19:45','Kapı açılışı',''],['20:30','1. perde','Yaklaşık 55 dakika.'],['21:25','Ara','15 dakika; fuayede çay ve kahve.'],['21:40','2. perde','22:30 civarı biter.']],
  yer:['Konak Sahnesi, Konak, İzmir','Konak metrosuna 5 dakika yürüme; Konak vapur iskelesi yakın.'],
  dahil:['Oyun girişi, numaralı koltuk'],haric:['Fuayedeki ikramlar'],
  bilgi:['Oyun başladıktan sonra salona arada alınırsın.','Oyun sırasında fotoğraf ve video çekilmez.']},

 'Karşıyaka Çocuk Tiyatrosu':{about:'Pazar sabahı çocuklar için müzikli bir masal oyunu. 3–10 yaş için; oyun bitince oyuncularla tanışma.',
  program:[['10:30','Kapı açılışı','Fuayede boyama köşesi.'],['11:00','Oyun','Yaklaşık 50 dakika, arasız.'],['11:50','Tanışma','Oyuncularla fotoğraf.']],
  yer:['Karşıyaka Sahnesi, Karşıyaka, İzmir','Karşıyaka vapur iskelesine 8 dakika yürüme.'],
  dahil:['Oyun girişi'],haric:['Fuayedeki ikramlar'],
  bilgi:['Her çocuk ve yetişkin için ayrı bilet alınır; 3 yaş altı kucakta ücretsiz.','Bebek arabaları fuayede bırakılır.']},

 'Çeşme Yaz Festivali':{about:'Alaçatı sahilinde gün boyu müzik, sokak lezzetleri ve sörf gösterileri.',
  program:[['12:00','Kapı açılışı',''],['14:00','Sörf gösterileri',''],['18:00','Gün batımı setleri','DJ performansları.'],['21:00','Ana sahne','Gecenin konseri.']],
  yer:['Alaçatı Sahil, Çeşme','Otopark sınırlı; Alaçatı merkezden servis var.'],
  dahil:['Günlük giriş, tüm sahneler'],haric:['Yiyecek ve içecek','Servis'],
  bilgi:['Bileklikle gün içinde çıkıp yeniden girebilirsin.']},

 'Urla Bağbozumu Şenliği':{about:'Urla\'nın bağ yolunda bir gün: ayakla üzüm ezme, üreticilerin tezgâhları, bağ sofrası ve akşamüstü küçük bir konser.',
  program:[['10:00','Kapı açılışı','Bağlar arası servis başlar.'],['11:00','Üzüm ezme','Ayakla, eski usul; çocuklar da katılır.'],['13:00','Bağ sofrası ve pazar','Yerel üreticilerin tezgâhları.'],
   ['15:00','Çocuk atölyeleri','Üzüm baskısı ve toprak boyama.'],['17:00','Konser','Bağda akustik konser; 19:00\'da kapanış.']],
  yer:['Urla Bağ Yolu, Urla','Urla merkezden festival servisi var; bağ yolunda otopark sınırlı.'],
  dahil:['Günlük giriş, tüm alanlar','Bağlar arası servis'],haric:['Şarap tadımı (tadımlı bilette dahil)','Yiyecek ve içecek'],
  bilgi:['Tadım alanına 18 yaş altı girmez.','Bağ yolları toprak; rahat ayakkabı giy.']},

 'İzmir Kahve Festivali':{about:'Kavurmacılar, baristalar ve demleme atölyeleri Kültürpark\'ta bir arada. Bütün gün tadım.',
  program:[['11:00','Kapı açılışı',''],['13:00','Demleme atölyeleri','Saat başı; atölye dahil bilette yerin ayrılır.'],['16:00','Latte art yarışması',''],['20:00','Kapanış','']],
  yer:['Kültürpark, Konak, İzmir','Lozan Kapısı\'ndan girilir; Basmane\'ye 10 dakika yürüme.'],
  dahil:['Günlük giriş','5 tadım kuponu'],haric:['Atölye (atölye dahil bilette var)','Satın aldığın ürünler'],
  bilgi:['Kendi kupanı getirebilirsin; tadımlar ona da doldurulur.']},

 /* Aktiviteler */
 'Alaçatı Rüzgar Sörfü Dersi':{about:'Alaçatı\'nın düzenli rüzgârında, sığ ve sakin bir alanda başlangıç dersi. İki saatin sonunda yelkeni kaldırıp kısa mesafe gidebiliyorsun.',
  program:[['15 dk','Tanışma ve ekipman','Islak elbise, can yeleği, tahta ve yelken seçimi.'],['30 dk','Kumda simülatör','Yelkeni kaldırma, duruş ve dönüş.'],['75 dk','Suda uygulama','Sığ alanda eğitmen yanında.']],
  yer:['Alaçatı sörf plajı, Çeşme','Alaçatı merkeze 4 km; sörf okulunun otoparkı var.'],
  dahil:['2 saat ders','Islak elbise, tahta ve yelken','Can yeleği ve sigorta'],haric:['Ulaşım','Dersten sonra ekipman kiralama'],
  bilgi:['Yüzme bilmen gerekir.','Rüzgâr çok sert ya da hiç yoksa ders başka saate alınır ya da ücretin iade edilir.']},

 'Alaçatı Kitesurf Dersi':{about:'Pırlanta Plajı\'nda üç saatlik başlangıç dersi: önce karada uçurtma kontrolü, sonra suda eğitmenle ilk denemeler.',
  program:[['20 dk','Güvenlik ve rüzgâr','Rüzgâr penceresi, güvenlik sistemi ve el işaretleri.'],['60 dk','Karada uçurtma kontrolü','Küçük eğitim uçurtmasıyla.'],['100 dk','Suda uygulama','Telsizli kaskla, eğitmen yanında.']],
  yer:['Pırlanta Plajı, Alaçatı, Çeşme','Plaj girişindeki kite okulunda buluşulur; otopark var.'],
  dahil:['3 saat ders','Uçurtma, bar ve trapez','Islak elbise, kask ve can yeleği','Telsizle iletişim'],haric:['Ulaşım','Ekipman kiralama'],
  bilgi:['Yüzme bilmen gerekir.','Rüzgâr uygun değilse ders başka güne alınır ya da ücretin iade edilir.']},

 'Sığacık SUP Turu':{about:'Sığacık Kalesi\'nin önünden sakin koylara doğru iki saatlik kürek turu. İlk kez binenler kıyıda kısa bir anlatımla başlıyor.',
  program:[['15 dk','Kıyıda anlatım','Kürek tutuşu, dengede durma ve düşünce tekrar binme.'],['90 dk','Kürek','Kale önünden Akkum koyuna doğru, sakin suda.'],['15 dk','Dönüş','Limana dönüş ve duş.']],
  yer:['Sığacık Limanı, Seferihisar','Kalenin deniz tarafındaki iskelede buluşulur; köy girişinde otopark var.'],
  dahil:['SUP tahtası ve kürek','Can yeleği','Rehber','Su geçirmez telefon kılıfı'],haric:['Ulaşım','Fotoğraf'],
  bilgi:['Islanabilirsin; mayo ve yedek kıyafet getir.','Rüzgâr sertse tur başka saate alınır ya da ücretin iade edilir.']},

 'Foça Tekne Turu':{about:'Eski Foça\'dan kalkan teknede altı saat: Siren Kayalıkları, adaların arasında yüzme molaları ve teknede öğle yemeği.',
  program:[['10:30','Eski Foça Limanı','Kalkış.'],['11:30','Siren Kayalıkları','Koruma alanı; tekneden izlenir, yüzülmez.'],['12:30','İncir Adası','Yüzme molası.'],
   ['13:30','Orak Adası','Öğle yemeği ve yüzme.'],['16:30','Dönüş','Eski Foça Limanı.']],
  yer:['Eski Foça Limanı, Foça','Kalkıştan 20 dakika önce teknede ol; limanın arkasında otopark var.'],
  dahil:['6 saatlik tekne turu','Öğle yemeği','Çay ve meyve'],haric:['Diğer içecekler','Ulaşım'],
  bilgi:['Havlu ve güneş kremi getir.','Kötü havada tur iptal edilir ve ücretin iade edilir.']},

 'Körfez Gün Batımı Tekne Turu':{about:'Pasaport İskelesi\'nden kalkan teknede iki saat: Kordon boyunca körfeze açılıp gün batımını denizden izle.',
  program:[['Kalkış','Pasaport İskelesi','Biniş kalkıştan 15 dakika önce başlar.'],['30. dk','Kordon ve Karşıyaka açıkları','Kordon boyunca kuzeye.'],
   ['1. saat','Körfezin ortası','Gün batımı; motor kısılır.'],['2. saat','Pasaport\'a dönüş','Işıkları yanan Kordon boyunca.']],
  yer:['Pasaport İskelesi, Alsancak, İzmir','Kalkıştan 15 dakika önce iskelede ol; Konak\'tan 10 dakika yürüme.'],
  dahil:['2 saatlik tekne turu','Çay ve kurabiye ikramı'],haric:['Diğer içecekler'],
  bilgi:['Akşam denizde serin olur; ince bir mont al.','Kötü havada tur iptal edilir ve ücretin iade edilir.']},

 'Çeşme Koylar Tekne Turu':{about:'Çeşme Limanı\'ndan kalkan teknede üç koy, yüzme molaları ve teknede öğle yemeği.',
  program:[['10:30','Çeşme Limanı','Kalkış.'],['11:30','Kocakarı Koyu','Yüzme ve şnorkel molası.'],['13:00','Paşa Limanı','Öğle yemeği ve yüzme.'],
   ['15:00','Aya Yorgi Koyu','Son yüzme molası.'],['16:30','Dönüş','Çeşme Limanı.']],
  yer:['Çeşme Limanı, Çeşme','Kale önündeki tekne iskelesi; kalkıştan 20 dakika önce teknede ol.'],
  dahil:['6 saatlik tekne turu','Öğle yemeği','Şnorkel ekipmanı'],haric:['İçecekler','Ulaşım'],
  bilgi:['Havlu ve güneş kremi getir.','Kötü havada tur iptal edilir ve ücretin iade edilir.']},

 'Urla Bağ Turu ve Şarap Tadımı':{about:'Urla Bağ Yolu\'nda üç bağ, mahzen gezileri ve bölgenin eski üzümlerinden şaraplar. Rehberle, minibüsle bağdan bağa.',
  program:[['Buluşma','Bağ yolu girişi','Minibüse biniş, rehberle tanışma.'],['1. bağ','Bağ ve mahzen','Üzüm çeşitleri ve üretim; iki tadım.'],
   ['2. bağ','Yerel üzümler','Bölgenin eski üzümleri; üç tadım.'],['3. bağ','Terasta tadım','Peynir tabağı eşliğinde üç tadım; sonra başlangıç noktasına dönüş.']],
  yer:['Urla Bağ Yolu, Urla','Bağ yolunun girişinde buluşulur; otopark var. Urla merkeze 8 km.'],
  dahil:['Üç bağ ziyareti','Sekiz tadım','Peynir tabağı','Bağlar arası minibüs','Rehber'],haric:['Satın aldığın şaraplar','Urla\'ya ulaşım'],
  bilgi:['18 yaş sınırı var; kimlik sorulur.','Tadımdan sonra araç kullanma; isteyene Urla merkeze bırakış ücretsiz.']},

 'Kemeraltı Lezzet Yürüyüşü':{about:'Kemeraltı\'nın hanları ve ara sokaklarında rehberle sekiz durak: boyozdan kumruya, közde kahveden şambaliye.',
  program:[['Buluşma','Konak Saat Kulesi','Rehberle tanışma.'],['1–3. durak','Boyoz, gevrek ve kumru','Çarşının sabahtan beri açık tezgâhları.'],
   ['4–6. durak','Söğüş ve kahve','Kızlarağası Hanı\'nda közde Türk kahvesi.'],['7–8. durak','Şambali ve lokma','Tatlıyla bitiş; Hisar Camii önü.']],
  yer:['Konak Saat Kulesi önü, Konak, İzmir','Rehberin elinde Mola360 bayrağı olur; Konak metrosuna 2 dakika yürüme.'],
  dahil:['Rehberli yürüyüş','8 durakta tadım','Su'],haric:['Ek siparişler','Ulaşım'],
  bilgi:['Tadımlar doyurucu; öncesinde ağır bir şey yeme.','Alerjin ya da beslenme tercihin varsa rezervasyonda yaz.']},

 'Bornova Ege Mutfağı Atölyesi':{about:'Bornova\'da küçük bir mutfak atölyesinde Ege otları ve zeytinyağlılarla dört tabak pişir, sonra hep birlikte sofraya otur.',
  program:[['30 dk','Pazar sepeti','Mevsim otlarını ve zeytinyağını tanıma.'],['90 dk','Pişirme','Otlu börek, zeytinyağlı ve iki mevsim tabağı.'],['60 dk','Sofra','Pişirdiklerini birlikte ye; tarifler e-postayla gelir.']],
  yer:['Bornova, İzmir','Atölye Bornova Küçükpark\'a 5 dakika yürüme; Bornova metrosu yakın.'],
  dahil:['Malzemeler ve önlük','Dört tabaklık sofra','Tarifler'],haric:['Alkollü içecekler (eşleşmeli pakette dahil)','Ulaşım'],
  bilgi:['Vejetaryen menü istersen rezervasyonda yaz.','Grup en fazla 10 kişi.']},

 'Urla Seramik Atölyesi':{about:'Urla\'da bir seramik atölyesinde iki saat: çarkta kendi kâseni ya da fincanını yap, önceden pişmiş bir parçayı sırla.',
  program:[['15 dk','Çamuru tanıma','Yoğurma ve merkezleme.'],['60 dk','Çark','Eğitmenle bir kâse ya da fincan.'],['45 dk','Sırlama','Daha önce pişmiş bir parçayı renklendirme.']],
  yer:['Urla merkez, Urla','Atölye Urla Sanat Sokağı\'nda; meydana 5 dakika yürüme.'],
  dahil:['Çamur, sır ve ekipman','Önlük','İki parçanın pişirilmesi'],haric:['Ek parçalar','Ulaşım'],
  bilgi:['Parçaların pişip sırlanması iki hafta sürer; atölyeden alırsın ya da kargoyla gönderilir.','Kirlenebilecek kıyafet giy.']},

 'Kemeraltı Ebru Atölyesi':{about:'Kemeraltı\'nda küçük bir ebru atölyesinde, teknenin başında kendi ebrunu yap. İlk kez deneyenler için.',
  program:[['15 dk','Ebrunun hikâyesi','Tekne, boya ve fırçalar.'],['30 dk','İlk denemeler','Battal ve gel-git desenleri.'],['45 dk','Kendi ebrun','İki eser; biri lale desenli.']],
  yer:['Kemeraltı, Konak, İzmir','Atölye Kızlarağası Hanı\'nın yakınında, birinci katta; Konak metrosuna 7 dakika yürüme.'],
  dahil:['Malzemeler','Önlük','İki ebru eseri'],haric:['Ulaşım'],
  bilgi:['Eserler kuruyunca kâğıt zarfta teslim edilir.']},

 /* Mekânlar */
 'Kordon Spa & Masaj':{about:'Alsancak\'ta sakin bir masaj salonu: deneyimli terapistler, randevuyla, beklemeden.',
  program:[['Karşılama','Bitki çayı ve kısa görüşme','Hassas bölgelerini terapistine söylersin.'],['Bakım','Seçtiğin masaj','Klasik 60 dk ya da sıcak taş 75 dk.'],['Dinlenme','Sauna ve dinlenme odası','Bakımdan sonra 30 dakika.']],
  yer:['Alsancak, İzmir','Kıbrıs Şehitleri Caddesi\'ne 2 dakika yürüme.'],
  dahil:['Seçtiğin masaj','Sauna ve dinlenme alanı','Havlu ve terlik'],haric:['Ek bakımlar'],
  bilgi:['Randevudan 10 dakika önce gel.']},

 'Kum Beach Club':{about:'Alaçatı\'da sığ, berrak bir koyda plaj kulübü. Şezlong, sedir ya da loca; gün boyu senin.',
  program:[['Alan','Şezlong, sedir ya da loca','Seçtiğin alan tam gün senin.'],['Yeme içme','Restoran ve bar','Harcaman minimum tutardan düşülür.'],['Plaj','Duş, soyunma kabini, havlu','']],
  yer:['Alaçatı, Çeşme','Alaçatı merkeze 4 km; otopark var.'],
  dahil:['Seçtiğin alan, tam gün','Havlu ve duş'],haric:['Minimum harcamayı aşan tutar'],
  bilgi:['Fiyat seçtiğin alanın minimum harcaması; yediğin içtiğin bundan düşülür.']},

 'Kemeraltı Han Kahvesi':{about:'Kemeraltı\'nda tarihi bir hanın avlusunda közde Türk kahvesi, sabahları han kahvaltısı. Çarşının kalabalığından birkaç adım uzakta.',
  program:[['Kahve','Közde Türk kahvesi','Lokum ve su ile.'],['Kahvaltı','Han kahvaltısı','Boyoz, gevrek, Ege peynirleri ve zeytin; sınırsız çay.'],['Avlu','Han avlusunda masalar','Kemerlerin altında, gölgede.']],
  yer:['Kemeraltı, Konak, İzmir','Han, çarşının içinde; Konak metrosuna 6 dakika yürüme.'],
  dahil:['Seçtiğin menü'],haric:['Ek siparişler'],
  bilgi:['Han kahvaltısı 09:00 ve 11:00 oturumlarında servis edilir.']},

 'Alaçatı Taş Avlu Kahvaltı':{about:'Alaçatı\'nın taş evlerinden birinin avlusunda, begonvillerin altında uzun bir Ege kahvaltısı.',
  program:[['Kahvaltı','Serpme kahvaltı','Ege peynirleri, zeytinyağlılar, reçeller ve sıcaklar; sınırsız çay.'],['Ege otlu','Otlu kahvaltı · 2 kişi','Mevsim otlarıyla börek, otlu omlet ve gözleme.'],['Avlu','Taş avluda masalar','Gölgelik; çocuklar için yüksek sandalye var.']],
  yer:['Alaçatı, Çeşme','Alaçatı çarşısının içinde; araçla gelenler köy girişindeki otoparka bırakır.'],
  dahil:['Seçtiğin menü','Sınırsız çay'],haric:['Kahve ve taze sıkma meyve suyu'],
  bilgi:['Masan 90 dakika senin; sonra bir sonraki oturum başlar.']},

 'Bostanlı Sahil Kahvaltısı':{about:'Bostanlı sahilinde, körfeze bakan masalarda serpme kahvaltı. Kahvaltıdan sonra sahil yolunda yürüyüş.',
  program:[['Kahvaltı','Serpme kahvaltı','Peynirler, zeytin, bal-kaymak ve sıcaklar; sınırsız çay.'],['Hafif','Gözleme ve çay','Peynirli ya da patatesli gözleme.'],['Masalar','Körfez manzaralı','Deniz kenarında; kapalı bölüm de var.']],
  yer:['Bostanlı, Karşıyaka, İzmir','Bostanlı vapur iskelesine 5 dakika yürüme.'],
  dahil:['Seçtiğin menü','Sınırsız çay'],haric:['Diğer içecekler'],
  bilgi:['Bebek arabasıyla rahat girilir; çocuklar için yüksek sandalye var.']},

 'Bornova Köşk Bahçesi':{about:'Bornova\'da eski bir Levanten köşkünün bahçesinde, çınarların altında kahvaltı ve brunch.',
  program:[['Kahvaltı','Köşk kahvaltısı','Ev reçelleri, Ege peynirleri ve sıcak pişi; sınırsız çay.'],['Brunch','Brunch tabağı','Yumurta, ekşi maya ekmek, avokado ve salata.'],['Bahçe','Çınar altında masalar','Çocuklar için çimen alan.']],
  yer:['Bornova, İzmir','Bornova metrosuna 8 dakika yürüme; sokakta park yeri sınırlı.'],
  dahil:['Seçtiğin menü','Çay'],haric:['Kahve ve meyve suları'],
  bilgi:['8 kişi ve üstü grupsan rezervasyonda not düş; masalar birleştirilir.']},

 'Sığacık Liman Balıkçısı':{about:'Sığacık Kalesi\'nin dibinde, limana bakan masalarda günün balığı. Öğlen de akşam da açık.',
  program:[['Balık menüsü','Günün balığı, salata ve tatlı','Izgara ya da buğulama; mevsimine göre.'],['Meze ve balık','Mezelerle balık menüsü','Deniz börülcesi, fava, kalamar ve günün balığı.'],['Masalar','Liman kenarı','Akşam tekneler limana dönerken.']],
  yer:['Sığacık Limanı, Seferihisar','Kale kapısına 2 dakika yürüme; köy girişinde otopark var.'],
  dahil:['Seçtiğin menü, kişi başı','Su ve ekmek'],haric:['İçecekler','Menü dışı siparişler'],
  bilgi:['Balık türü günün avına göre değişir; garsonun söyler.']},

 'Urla İskele Balıkçısı':{about:'Urla İskele\'de, denize bakan bir balıkçı. Masalar suya birkaç adım; erken oturum gün batımına yakın.',
  program:[['Balık menüsü','Mezeler ve günün balığı','Üç soğuk meze, ara sıcak ve ızgara balık.'],['Şef menüsü','Altı tabaklık tadım','Şefin o günkü avla hazırladığı tabaklar.'],['Masalar','İskele kenarı','Rüzgârlı akşamlarda kapalı terasta.']],
  yer:['Urla İskele, Urla','Urla merkeze 5 km; iskele meydanında otopark var.'],
  dahil:['Seçtiğin menü, kişi başı'],haric:['İçecekler','Menü dışı siparişler'],
  bilgi:['Balık türü günün avına göre değişir; garsonun söyler.']},

 'Çeşme Liman Meyhanesi':{about:'Çeşme Limanı\'nda, kaleye bakan bir meyhane: soğuk mezeler, ara sıcaklar ve günün balığı.',
  program:[['Meze menüsü','Altı soğuk meze ve iki ara sıcak','Haydari, deniz börülcesi, ahtapot salatası; kalamar ve paçanga.'],['Balık ve meze','Mezelerin üstüne günün balığı','Izgara; mevsimine göre.'],['Masalar','Liman ve kale manzarası','']],
  yer:['Çeşme Limanı, Çeşme','Kale meydanına 3 dakika yürüme; liman otoparkı ücretli.'],
  dahil:['Seçtiğin menü, kişi başı'],haric:['İçecekler','Menü dışı siparişler'],
  bilgi:['Masan 2,5 saat senin; 21:30 oturumu kapanışa kadar sürer.']},

 'Urla Bağ Yolu Sofrası':{about:'Urla\'da bağların içinde tek oturumluk akşam sofrası: bağdan ve bahçeden gelenlerle yedi tabaklık tadım menüsü.',
  program:[['19:30','Karşılama','Bağ terasında ilk ikram.'],['20:00','Tadım menüsü','Yedi tabak; mevsim sebzeleri, zeytinyağlılar, et ya da balık.'],['Eşleşme','Şarap eşleşmesi','Seçersen her tabağa bir kadeh yerel şarap.']],
  yer:['Urla Bağ Yolu, Urla','Urla merkeze 8 km; bağın otoparkı var.'],
  dahil:['Yedi tabaklık tadım menüsü','Su'],haric:['Eşleşme dışındaki içecekler'],
  bilgi:['Tek oturum 19:30\'da başlar, yaklaşık 2,5 saat sürer.','Şarap eşleşmesi 18 yaş ve üzeri içindir.','Alerjin varsa rezervasyonda yaz; menü uyarlanır.']},

 'Asansör Teras Restoran':{about:'Tarihi Asansör\'ün tepesinde, bütün körfeze bakan bir teras. Akşam yemeği İzmir\'in ışıkları yanarken.',
  program:[['Akşam menüsü','Başlangıç, ana yemek ve tatlı','Ege otları, günün balığı ya da kuzu, ev tatlısı.'],['Gün batımı menüsü','İki kişilik paylaşım menüsü','Mezeler, iki ana yemek ve tatlı.'],['Teras','Körfez manzaralı masalar','Asansörle ya da Dario Moreno Sokağı\'ndan çıkılır.']],
  yer:['Asansör, Karataş, Konak, İzmir','Mithatpaşa Caddesi\'ndeki girişten tarihi asansörle çıkılır.'],
  dahil:['Seçtiğin menü'],haric:['İçecekler'],
  bilgi:['Teras rüzgârlı olabilir; akşam için ince bir hırka al.']},

 'Kordon Meyhanesi':{about:'Kordon\'da denize bakan bir meyhane: soğuk mezeler, ara sıcaklar ve canlı fasıl.',
  program:[['Meze','Meze menüsü','Sekiz soğuk meze, iki ara sıcak.'],['Fasıl','Fasıl gecesi menüsü','Meze menüsü ve sahneye yakın masa; fasıl 21:00\'de başlar.'],['Masalar','Kordon manzaralı','Kaldırımdaki masalar denize bakar.']],
  yer:['Kordon, Alsancak, İzmir','Alsancak vapur iskelesine 8 dakika yürüme.'],
  dahil:['Seçtiğin menü, kişi başı'],haric:['İçecekler'],
  bilgi:['Fasılda müzik yüksek olur; sohbet için 19:00 oturumu daha sakin.']},

 'Alsancak Akustik Sahne':{about:'Alsancak\'ta küçük bir sahne: her akşam canlı akustik müzik, masada yemek ve içki.',
  program:[['20:30','Kapı açılışı','Masana geç, menüden seç.'],['21:30','Canlı müzik','İki set; araya 15 dakika mola.'],['00:00','Kapanış','']],
  yer:['Alsancak, Konak, İzmir','Kıbrıs Şehitleri Caddesi\'ne 3 dakika yürüme.'],
  dahil:['Seçtiğin masa, akşam boyunca'],haric:['Minimum harcamayı aşan tutar'],
  bilgi:['18 yaş sınırı var.','Fiyat masanın minimum harcaması; yediğin içtiğin bundan düşülür.']},

 'Kıbrıs Şehitleri Caz Bar':{about:'Alsancak\'ın ara sokağında küçük bir caz barı: her akşam canlı caz, kokteyller ve hafif tabaklar.',
  program:[['21:00','Kapı açılışı',''],['22:00','Canlı caz','Trio ya da dörtlü; iki set.'],['01:00','Kapanış','']],
  yer:['Kıbrıs Şehitleri Caddesi, Alsancak, İzmir','Alsancak Garı\'na 7 dakika yürüme.'],
  dahil:['Seçtiğin masa, akşam boyunca'],haric:['Minimum harcamayı aşan tutar'],
  bilgi:['18 yaş sınırı var.','Fiyat masanın minimum harcaması; yediğin içtiğin bundan düşülür.']},

 'Balçova Termal Hamam':{about:'Balçova\'nın termal suyuyla kapalı havuz ve geleneksel hamam. Kese ve köpükten sonra dinlenme salonunda çay.',
  program:[['Havuz','Kapalı termal havuz','İki saat kullanım.'],['Hamam','Kese ve köpük','Natır ya da tellak eşliğinde, yaklaşık 30 dakika.'],['Dinlenme','Dinlenme salonu','Bitki çayı ve havlu.']],
  yer:['Balçova, İzmir','Termal tesislerin içinde; otopark var.'],
  dahil:['Seçtiğin hizmet','Havlu, peştamal ve terlik','Dolap'],haric:['Masaj','Ek bakımlar'],
  bilgi:['Havuz için mayo ve bone gerekir.','Kalp ya da tansiyon rahatsızlığın varsa termal havuza girmeden önce doktoruna danış.']},

 /* Oteller: program yerine sayfada OTEL'deki odalar görünür */
 'Kordon Butik Otel':{about:'Alsancak\'ın ara sokaklarında yüksek tavanlı eski bir Rum evi. Kordon 120 metre ötede.',
  program:[['Oda','Butik oda','Yüksek tavanlı, 20 m².'],['Kahvaltı','Avluda kahvaltı',''],['Konum','Kordon\'a 120 m','Alsancak\'ın kafeleri kapının önünde.']],
  yer:['Alsancak, İzmir','Alsancak Garı\'na 6 dakika yürüme.'],
  dahil:['Konaklama','Kahvaltı','Wi-Fi'],haric:['Otopark','Havalimanı transferi'],
  bilgi:['Giriş 14:00, çıkış 11:00.','Asansör yok; odalar ikinci kata kadar.']},

 'Alaçatı Taş Otel':{about:'Alaçatı\'nın taş sokaklarında, avlulu eski bir taş evden dönüştürülmüş on odalı bir otel. Çarşı ve kafeler yürüme mesafesinde.',
  program:[['Oda','Taş oda','Kalın taş duvarlar, ahşap tavan, 22 m².'],['Kahvaltı','Avluda Ege kahvaltısı','Ev reçelleri, otlu börek ve Ege peynirleri.'],['Konum','Alaçatı çarşısına 3 dakika','Sörf plajına 4 km.']],
  yer:['Alaçatı, Çeşme','Alaçatı çarşısına 3 dakika yürüme; İzmir Adnan Menderes Havalimanı 85 km.'],
  dahil:['Konaklama','Kahvaltı','Wi-Fi'],haric:['Otopark','Havalimanı transferi'],
  bilgi:['Giriş 14:00, çıkış 11:00.','Odalar avlunun çevresinde; bazılarına dar taş merdivenle çıkılır.']},

 'Ilıca Aile Resort':{about:'Ilıca\'nın sığ, ince kumlu plajında denize sıfır bir aile oteli: özel plaj, açık havuz, çocuk kulübü ve kapalı termal havuz.',
  program:[['Oda','Standart ya da deniz manzaralı oda','Balkonlu; aile odaları iki bölmeli.'],['Yeme içme','Her şey dahil','Ana restoran, iki alakart restoran ve barlar.'],['Olanaklar','Özel plaj, havuzlar, çocuk kulübü','Kapalı havuzda Ilıca\'nın termal suyu.']],
  yer:['Ilıca, Çeşme','Ilıca plajında; Çeşme merkeze 6 km, İzmir Adnan Menderes Havalimanı 90 km.'],
  dahil:['Konaklama','Her şey dahil yeme içme','Plaj ve havuz kullanımı','Çocuk kulübü'],haric:['Havalimanı transferi','Spa hizmetleri'],
  bilgi:['Giriş 14:00, çıkış 12:00.','Çocuk kulübü 4–12 yaş için, 10:00–17:00 arası açık.']},

 'Urla Bağ Evi Otel':{about:'Urla\'da bağların ortasında sekiz odalı bir bağ evi. Havuz başında kahvaltı, akşam bağların üstünde gün batımı.',
  program:[['Oda','Bağ odası','Taş ve ahşap, 24 m², bağ manzaralı.'],['Kahvaltı','Havuz başında kahvaltı','Bahçeden sebze ve otlar.'],['Konum','Urla Bağ Yolu üzerinde','Urla merkeze 7 km; bağlar yürüme mesafesinde.']],
  yer:['Urla Bağ Yolu, Urla','Urla merkeze 7 km; İzmir Adnan Menderes Havalimanı 60 km. Ücretsiz otopark var.'],
  dahil:['Konaklama','Kahvaltı','Havuz kullanımı','Wi-Fi'],haric:['Akşam yemeği','Bağ turları ve tadım'],
  bilgi:['Giriş 15:00, çıkış 11:00.','Havuz 09:00–19:00 arası açık; havlu odanda.']},

 'Eski Foça Pansiyon':{about:'Eski Foça\'nın taş evlerinden birinde altı odalı bir pansiyon. Denize 50 metre; terastan limanı ve adaları görürsün.',
  program:[['Oda','Taş oda','16–22 m², bazıları deniz manzaralı.'],['Kahvaltı','Terasta kahvaltı','Ev yapımı reçel, Foça zeytini ve peynirleri.'],['Konum','Limana 2 dakika','Tekne turları limandan kalkar.']],
  yer:['Eski Foça, Foça','Limana 2 dakika yürüme; İzmir merkeze 70 km. Sokakta park yeri sınırlı.'],
  dahil:['Konaklama','Kahvaltı','Wi-Fi'],haric:['Otopark','Akşam yemeği'],
  bilgi:['Giriş 14:00, çıkış 11:00.','Asansör yok; odalar iki katlı taş evde.']},

 'Şirince Köy Evi':{about:'Şirince\'nin yamacında restore edilmiş bir taş köy evi: beş oda, asmalı bir avlu ve vadiye bakan kahvaltı terası.',
  program:[['Oda','Köy odası','Taş duvar, ahşap tavan, 20 m².'],['Kahvaltı','Asma altında köy kahvaltısı','Köy yumurtası, ev reçelleri ve zeytinyağlılar.'],['Konum','Köy meydanına 4 dakika','Efes Antik Kenti 10 km.']],
  yer:['Şirince, Selçuk','Köy meydanına 4 dakika yürüme; araçlar köy girişindeki otoparka bırakılır. Selçuk 8 km.'],
  dahil:['Konaklama','Kahvaltı','Wi-Fi'],haric:['Otopark (köy girişinde)','Akşam yemeği'],
  bilgi:['Giriş 14:00, çıkış 11:00.','Köyün sokakları yokuşlu ve taş; tekerlekli valiz zor ilerler.']},

 'Balçova Termal Otel':{about:'Balçova\'nın termal kaynağında bir otel: açık ve kapalı termal havuzlar, hamam ve sauna. Şehir merkezine yarım saat.',
  program:[['Oda','Standart oda','24 m², bahçe manzaralı.'],['Yeme içme','Yarım pansiyon','Açık büfe kahvaltı ve akşam yemeği.'],['Termal','Açık ve kapalı termal havuz','Konaklamaya dahil.']],
  yer:['Balçova, İzmir','Konak\'a 12 km; İzmir Adnan Menderes Havalimanı 25 km. Ücretsiz otopark var.'],
  dahil:['Konaklama','Kahvaltı ve akşam yemeği','Termal havuz, hamam ve sauna'],haric:['Masaj ve kese','İçecekler'],
  bilgi:['Giriş 14:00, çıkış 12:00.','Termal havuza 12 yaş altı yetişkinle girer.']},

 'Bostanlı Körfez Otel':{about:'Bostanlı sahilinde körfeze bakan bir şehir oteli. Sahil yolu kapının önünde, vapur iskelesi 5 dakika.',
  program:[['Oda','Standart ya da körfez manzaralı oda','22–24 m²; körfez manzaralı odalar balkonlu.'],['Kahvaltı','Açık büfe kahvaltı','Körfeze bakan salonda.'],['Konum','Bostanlı iskelesine 5 dakika','Vapurla Konak\'a yaklaşık 25 dakika.']],
  yer:['Bostanlı, Karşıyaka, İzmir','Bostanlı vapur iskelesine 5 dakika yürüme; İzmir Adnan Menderes Havalimanı 30 km.'],
  dahil:['Konaklama','Kahvaltı','Wi-Fi','Otopark'],haric:['Havalimanı transferi','Akşam yemeği'],
  bilgi:['Giriş 14:00, çıkış 12:00.','Körfez manzaralı odalar ön cephede; rezervasyonda oda tipini seç.']},

 'Sığacık Kale Evi':{about:'Sığacık Kalesi\'nin surları içinde, taş bir evde yedi odalı küçük bir otel. Liman ve balıkçılar birkaç adım ötede.',
  program:[['Oda','Taş oda','Kalın taş duvarlar, 18 m².'],['Kahvaltı','Avluda köy kahvaltısı','Seferihisar mandalinası reçeli ve köy peynirleri.'],['Konum','Limana 2 dakika','Akkum plajı 3 km.']],
  yer:['Sığacık, Seferihisar','Kale içine araç girmez; köy girişindeki otoparktan 3 dakika yürüme. İzmir merkeze 50 km.'],
  dahil:['Konaklama','Kahvaltı','Wi-Fi'],haric:['Otopark','Akşam yemeği'],
  bilgi:['Giriş 14:00, çıkış 11:00.','Pazar günleri kale çevresinde üretici pazarı kurulur; sokaklar kalabalık olur.']}
};

/* Aktivite seansları ve paketleri, etkinlik bilet türleri (ÖRNEK):
   slots başlangıç saatleri, opts [ad, kişi ya da bilet başı fiyat], not kişi/bilet notu.
   İlk seçeneğin fiyatı kartta görünen fiyattır (data.js p). */
export const SEANS={
 'Alaçatı Rüzgar Sörfü Dersi':{slots:['10:00','13:00','16:00'],opts:[['Başlangıç dersi · grup',1350],['Özel ders',2200]],not:'Kişi başı. 8 yaş ve üzeri; yüzme bilmek gerekir.'},
 'Alaçatı Kitesurf Dersi':{slots:['10:00','14:00'],opts:[['Başlangıç dersi · grup',2400],['Özel ders',3600]],not:'Kişi başı. 14 yaş ve üzeri, en az 40 kg; yüzme bilmek gerekir.'},
 'Sığacık SUP Turu':{slots:['09:00','11:00','17:00'],opts:[['Grup turu',750],['Özel tur',1100]],not:'Kişi başı. 10 yaş ve üzeri; yüzme bilmek gerekir.'},
 'Foça Tekne Turu':{slots:['10:30'],opts:[['Standart tur',1100],['Balık menülü tur',1400]],not:'Kişi başı. 0–6 yaş ücretsiz; çocuklara can yeleği verilir.'},
 'Körfez Gün Batımı Tekne Turu':{slots:['17:30'],opts:[['Standart tur',690],['Tur ve meze tabağı',990]],not:'Kişi başı. 0–6 yaş kucakta ücretsiz.'},
 'Çeşme Koylar Tekne Turu':{slots:['10:30'],opts:[['Standart tur',1250],['Balık menülü tur',1550]],not:'Kişi başı. 0–6 yaş ücretsiz; çocuklara can yeleği verilir.'},
 'Urla Bağ Turu ve Şarap Tadımı':{slots:['11:00','15:00'],opts:[['Üç bağ ve tadım',1600],['Üç bağ, tadım ve bağ sofrası',2400]],not:'Kişi başı. 18 yaş ve üzeri.'},
 'Kemeraltı Lezzet Yürüyüşü':{slots:['10:00','13:00'],opts:[['Rehberli grup · 8 durak',950],['Özel rehberli yürüyüş',1450]],not:'Kişi başı. 6 yaş altı ücretsiz.'},
 'Bornova Ege Mutfağı Atölyesi':{slots:['11:00','18:00'],opts:[['Atölye ve sofra',1200],['Atölye, sofra ve şarap eşleşmesi',1550]],not:'Kişi başı. 12 yaş ve üzeri; şarap eşleşmesi 18 yaş ve üzeri içindir.'},
 'Urla Seramik Atölyesi':{slots:['10:30','14:00','16:30'],opts:[['Çark ve sırlama · atölyeden teslim',900],['Çark ve sırlama · kargoyla teslim',1050]],not:'Kişi başı. 7 yaş ve üzeri; 12 yaş altı yetişkinle katılır.'},
 'Kemeraltı Ebru Atölyesi':{slots:['11:00','14:00','16:00'],opts:[['Ebru atölyesi',650],['Ebru atölyesi ve çerçeve',800]],not:'Kişi başı. 6 yaş ve üzeri; 12 yaş altı yetişkinle katılır.'},
 'Kordon Caz Akşamları':{opts:[['Genel giriş',480],['Sahne önü oturma',720]],not:'12 yaş altı ücretsiz, yetişkinle girer.'},
 'Kültürpark Açıkhava Konserleri':{opts:[['Tribün',850],['Numaralı koltuk',1250]],not:'7 yaş ve üzeri herkes bilet alır.'},
 'İzmir Senfoni Gecesi':{opts:[['Salon',520],['Salon · ön sıralar',780]],not:'7 yaş ve üzeri herkes bilet alır.'},
 'Bornova Stand Up Gecesi':{opts:[['Genel giriş',450],['Ön sıra',650]],not:'18 yaş ve üzeri.'},
 'Konak Sahnesi Tiyatro Akşamı':{opts:[['Salon',380],['Salon · ilk üç sıra',520]],not:'7 yaş ve üzeri herkes bilet alır.'},
 'Karşıyaka Çocuk Tiyatrosu':{opts:[['Salon',220],['Salon · ön sıralar',300]],not:'3 yaş ve üzeri herkes bilet alır; çocuklar yetişkinle girer.'},
 'Çeşme Yaz Festivali':{opts:[['Günlük bilet',650],['İki günlük kombine',1100]],not:'12 yaş altı ücretsiz, yetişkinle girer.'},
 'Urla Bağbozumu Şenliği':{opts:[['Günlük bilet',550],['Tadımlı bilet',850]],not:'12 yaş altı ücretsiz, yetişkinle girer. Tadımlı bilet 18 yaş ve üzeri içindir.'},
 'İzmir Kahve Festivali':{opts:[['Günlük giriş',290],['Atölye dahil giriş',490]],not:'12 yaş altı ücretsiz.'}};

/* Otel odaları ve kuralları (ÖRNEK): giriş ve çıkış saati, odalar
   [ad, açıklama, en fazla kişi (2 yaş ve üzeri), gecelik oda fiyatı, öne çıkanlar],
   olanaklar, çocuk: [bu yaşa kadar ücretsiz, 12 yaşa kadar ek yatak gecelik], evcil hayvan.
   İlk odanın gecelik fiyatı data.js HT'deki gecelik fiyattır. */
export const OTEL={
 'Kordon Butik Otel':{giris:'14:00',cikis:'11:00',
  odalar:[['Butik oda','20 m² · çift kişilik yatak',2,1989,['Yüksek tavan','Klima']],
   ['Kordon manzaralı oda','24 m² · fransız balkonlu',2,2390,['Deniz manzarası','Fransız balkon']]],
  olanak:['Ücretsiz Wi-Fi','Avluda kahvaltı','Klima','24 saat resepsiyon','Bagaj saklama'],
  cocuk:[6,400],evcil:true},
 'Alaçatı Taş Otel':{giris:'14:00',cikis:'11:00',
  odalar:[['Taş oda','22 m² · çift kişilik yatak',2,3450,['Taş duvarlar','Klima']],
   ['Avlu odası','26 m² · avluya açılan kapı',2,3890,['Avluya çıkış','Oturma köşesi']],
   ['Çatı odası','30 m² · özel teraslı',3,4450,['Özel teras','Çatı manzarası']]],
  olanak:['Ücretsiz Wi-Fi','Avluda kahvaltı','Klima','Bisiklet (ücretsiz)','Bagaj saklama'],
  cocuk:[6,500],evcil:false},
 'Ilıca Aile Resort':{giris:'14:00',cikis:'12:00',
  odalar:[['Standart oda','28 m² · bahçe manzaralı',3,4200,['Balkon','Klima']],
   ['Deniz manzaralı oda','30 m² · balkonlu',3,4790,['Deniz manzarası','Balkon']],
   ['Aile odası','42 m² · iki bölmeli',4,5890,['İki bölme','Deniz manzarası']]],
  olanak:['Özel plaj','Açık havuz','Kapalı termal havuz','Çocuk havuzu ve kaydırak','Çocuk kulübü','Spa (ücretli)','Ücretsiz Wi-Fi','Ücretsiz otopark'],
  cocuk:[6,650],evcil:false},
 'Urla Bağ Evi Otel':{giris:'15:00',cikis:'11:00',
  odalar:[['Bağ odası','24 m² · bağ manzaralı',2,3200,['Bağ manzarası','Klima']],
   ['Havuz odası','28 m² · havuza açılan teraslı',2,3790,['Havuza çıkış','Teras']],
   ['Bağ evi süiti','40 m² · oturma alanlı',3,4900,['Oturma alanı','Bağ manzaralı balkon']]],
  olanak:['Açık havuz','Bahçede kahvaltı','Ücretsiz Wi-Fi','Ücretsiz otopark','Bisiklet (ücretsiz)','Şarap tadımı (ücretli)'],
  cocuk:[6,500],evcil:false},
 'Eski Foça Pansiyon':{giris:'14:00',cikis:'11:00',
  odalar:[['Standart oda','16 m² · çift kişilik yatak',2,1750,['Klima','Duş']],
   ['Deniz manzaralı oda','20 m² · limana bakan pencere',2,2150,['Deniz manzarası','Klima']],
   ['Teraslı oda','22 m² · özel teraslı',3,2550,['Deniz manzaralı teras','Oturma köşesi']]],
  olanak:['Deniz manzaralı teras','Terasta kahvaltı','Ücretsiz Wi-Fi','Klima','Bagaj saklama'],
  cocuk:[6,300],evcil:true},
 'Şirince Köy Evi':{giris:'14:00',cikis:'11:00',
  odalar:[['Köy odası','20 m² · çift kişilik yatak',2,1900,['Taş duvarlar','Vadi manzarası']],
   ['Aile odası','30 m² · iki yatak',4,2600,['İki yatak','Avluya çıkış']]],
  olanak:['Asmalı avlu','Kahvaltı terası','Ücretsiz Wi-Fi','Bagaj saklama'],
  cocuk:[6,300],evcil:true},
 'Balçova Termal Otel':{giris:'14:00',cikis:'12:00',
  odalar:[['Standart oda','24 m² · bahçe manzaralı',3,2100,['Balkon','Klima']],
   ['Aile odası','36 m² · iki bölmeli',4,2900,['İki bölme','Balkon']],
   ['Termal süit','38 m² · odada termal küvet',3,3190,['Termal küvet','Oturma alanı']]],
  olanak:['Açık ve kapalı termal havuz','Hamam, sauna ve buhar odası','Çocuk havuzu','Toplantı salonu','Ücretsiz Wi-Fi','Ücretsiz otopark','Masaj (ücretli)'],
  cocuk:[6,400],evcil:false},
 'Bostanlı Körfez Otel':{giris:'14:00',cikis:'12:00',
  odalar:[['Standart oda','22 m² · şehir manzaralı',2,2350,['Klima','Çalışma masası']],
   ['Körfez manzaralı oda','24 m² · balkonlu',2,2790,['Deniz manzarası','Balkon']],
   ['Aile odası','34 m² · iki yatak',4,3450,['İki yatak','Körfez manzarası']]],
  olanak:['Ücretsiz Wi-Fi','Ücretsiz otopark','Toplantı salonu','Spor salonu','24 saat resepsiyon','Bagaj saklama'],
  cocuk:[6,450],evcil:false},
 'Sığacık Kale Evi':{giris:'14:00',cikis:'11:00',
  odalar:[['Taş oda','18 m² · çift kişilik yatak',2,1850,['Taş duvarlar','Klima']],
   ['Avlu odası','22 m² · avluya açılan',3,2250,['Avluya çıkış','Klima']]],
  olanak:['Avluda kahvaltı','Ücretsiz Wi-Fi','Klima','Bisiklet (ücretsiz)'],
  cocuk:[6,300],evcil:true}};

/* Tur kalkış noktaları (ÖRNEK): tur hangi şehirden çıkıyorsa o şehrin
   durakları [saat, durak, adres, not]. Burada olmayan turda tek kalkış
   noktası DETAY'daki "yer"den gelir. */
export const KALKIS={
 'Efes ve Şirince Turu':['İzmir','Otobüsle',[
   ['07:40','Bornova Metro','Ege Üniversitesi metro çıkışı, Bornova','Otobüs metro çıkışının karşısında bekler.'],
   ['08:00','Konak Saat Kulesi','Konak Meydanı, Konak','Rehberin Mola360 bayrağıyla otobüsün önünde karşılar.'],
   ['08:20','Gaziemir','Akçay Caddesi, Gaziemir Belediyesi önü','Otobüs belediye binasının karşısındaki cepte bekler.']]],
 'Pamukkale ve Hierapolis':['İzmir','Otobüsle',[
   ['07:00','Karşıyaka İskele','Karşıyaka İskelesi önü, Karşıyaka','İskele meydanındaki taksi durağının yanında.'],
   ['07:30','Konak Saat Kulesi','Konak Meydanı, Konak','Rehberin Mola360 bayrağıyla otobüsün önünde karşılar.'],
   ['07:50','Bornova Metro','Ege Üniversitesi metro çıkışı, Bornova','Otobüs metro çıkışının karşısında bekler.']]],
 'Bergama ve Asklepion Turu':['İzmir','Otobüsle',[
   ['07:40','Bornova Metro','Ege Üniversitesi metro çıkışı, Bornova','Otobüs metro çıkışının karşısında bekler.'],
   ['08:00','Konak Saat Kulesi','Konak Meydanı, Konak','Rehberin Mola360 bayrağıyla otobüsün önünde karşılar.'],
   ['08:25','Karşıyaka İskele','Karşıyaka İskelesi önü, Karşıyaka','Kuzeye çıkmadan önceki son durak.']]],
 'İzmir Şehir Turu: Kemeraltı ve Kadifekale':['İzmir','Otobüsle',[
   ['08:50','Bornova Metro','Ege Üniversitesi metro çıkışı, Bornova','Minibüs metro çıkışının karşısında bekler.'],
   ['09:10','Karşıyaka İskele','Karşıyaka İskelesi önü, Karşıyaka','İskele meydanındaki taksi durağının yanında.'],
   ['09:30','Konak Saat Kulesi','Konak Meydanı, Konak','Tur burada başlar; rehberin Mola360 bayrağıyla karşılar.']]],
 'Ege Adaları Balayı Kaçamağı':['İzmir','Feribotla',[
   ['06:45','Konak Saat Kulesi','Konak Meydanı, Konak','Çeşme Limanı\'na servis; yaklaşık 1 saat 15 dakika.'],
   ['08:00','Çeşme Limanı','Yolcu salonu girişi, Çeşme','Kendi aracınla gelirsen; feribottan 1 saat önce pasaport kontrolü.']]],
 'Midilli Adası Kaçamağı':['İzmir','Feribotla',[
   ['06:30','Konak Saat Kulesi','Konak Meydanı, Konak','Dikili Limanı\'na servis; yaklaşık 2 saat.'],
   ['06:50','Karşıyaka İskele','Karşıyaka İskelesi önü, Karşıyaka','Servisin kuzeye çıkmadan önceki son durağı.'],
   ['08:30','Dikili Limanı','Yolcu salonu girişi, Dikili','Kendi aracınla gelirsen; feribottan 1 saat önce pasaport kontrolü.']]],
 'Kapadokya Turu':['İzmir','Uçakla',[
   ['05:30','Adnan Menderes Havalimanı','İç hatlar terminali gidiş katı, Gaziemir','Uçuştan 2 saat önce Mola360 karşılama noktasında.']]],
 'Karadeniz Yaylaları Turu':['İzmir','Uçakla',[
   ['06:00','Adnan Menderes Havalimanı','İç hatlar terminali gidiş katı, Gaziemir','Uçuştan 2 saat önce Mola360 karşılama noktasında.']]],
 'Turistik Doğu Ekspresi':['İzmir','Uçakla',[
   ['09:30','Adnan Menderes Havalimanı','İç hatlar terminali gidiş katı, Gaziemir','Ankara uçuşundan 2 saat önce Mola360 karşılama noktasında. Ankara\'dan Kars\'a yataklı trenle.']]],
 'Erciyes Kayak Haftası':['İzmir','Uçakla',[
   ['07:00','Adnan Menderes Havalimanı','İç hatlar terminali gidiş katı, Gaziemir','Uçuştan 2 saat önce Mola360 karşılama noktasında.']]],
 'Balkanlar: Saraybosna ve Mostar':['İzmir','Uçakla',[
   ['06:30','Adnan Menderes Havalimanı','Dış hatlar terminali gidiş katı, Gaziemir','Uçuştan 3 saat önce Mola360 karşılama noktasında.']]],
 'Dubai Turu':['İzmir','Uçakla',[
   ['10:00','Adnan Menderes Havalimanı','Dış hatlar terminali gidiş katı, Gaziemir','Uçuştan 3 saat önce Mola360 karşılama noktasında.']]],
 'İtalya: Roma, Floransa ve Venedik':['İzmir','Uçakla',[
   ['05:30','Adnan Menderes Havalimanı','Dış hatlar terminali gidiş katı, Gaziemir','Uçuştan 3 saat önce Mola360 karşılama noktasında.']]],
 'İspanya: Barselona ve Madrid':['İzmir','Uçakla',[
   ['06:00','Adnan Menderes Havalimanı','Dış hatlar terminali gidiş katı, Gaziemir','Uçuştan 3 saat önce Mola360 karşılama noktasında.']]],
 'Fransa: Paris ve Loire Şatoları':['İzmir','Uçakla',[
   ['06:30','Adnan Menderes Havalimanı','Dış hatlar terminali gidiş katı, Gaziemir','Uçuştan 3 saat önce Mola360 karşılama noktasında.']]]
};

/* Ürün türüne göre bölüm başlıkları: program ve konum */
export const BASLIK={tur:['Program','Kalkış noktası'],otel:['Odalar','Konum'],etkinlik:['Akış','Etkinlik alanı'],aktivite:['Nasıl geçiyor?','Buluşma noktası'],mekan:['Hizmetler','Konum']};

/* Örnek değerlendirmeler: türe göre iki tane. Gerçekte yalnızca
   rezervasyonu tamamlayanlar yazar. */
export const YORUM={
 tur:[['selin',9.6,'Rehberimiz her durakta zamanı iyi ayarladı, kimse koşturmadı. Anlatımı çok keyifliydi.'],['kaan',8.8,'Program dolu ama yorucu değil. Buluşma noktası net anlatılmıştı.']],
 otel:[['zeynep',9.4,'Oda fotoğraflardaki gibiydi, kahvaltı çeşitliydi.'],['deniz',9.0,'Personel ilgiliydi; girişte bekletmediler.']],
 etkinlik:[['elif',9.5,'Ses çok iyiydi, girişte QR ile hızlıca geçtik.'],['mert',9.0,'Erken gidin; iyi yerler çabuk doluyor.']],
 aktivite:[['mert',9.8,'Ekip işini çok ciddiye alıyor, güvenlik anlatımı net ve uzundu.'],['kaan',9.2,'Otelden alış tam saatinde oldu.']],
 mekan:[['elif',9.4,'Randevu saatinde başladı, ortam çok sakindi.'],['selin',9.0,'Fiyat neyse o; sonradan bir şey eklenmedi.']]};
