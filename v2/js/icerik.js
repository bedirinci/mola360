/* ÖRNEK İÇERİK: ürün sayfasındaki açıklama, program, dahil/hariç, buluşma
   noktası ve örnek değerlendirmeler. Metinler uydurma; gerçekte işletmenin
   girdiği ürün verisinden gelecek. Sayfalar bunu doğrudan değil api.js'in
   productDetails() işleviyle okur.

   Her ürün: about (açıklama), program ([etiket, başlık, açıklama]),
   yer ([adres, not]), dahil, haric, bilgi (bilmen gerekenler). */

export const DETAY={
 'Kapadokya Turu':{about:'Peri bacaları, yeraltı şehirleri ve vadi yürüyüşleriyle dört günlük bir Kapadokya molası. Konaklama Göreme\'de mağara odalı bir otelde; sabahları balonları terastan izleyebilirsin.',
  program:[['1. gün','Varış ve Göreme','Kayseri Havalimanı\'nda karşılama, otele transfer. Öğleden sonra Göreme Açık Hava Müzesi ve Uçhisar Kalesi.'],
   ['2. gün','Yeraltı şehri ve Ihlara Vadisi','Derinkuyu Yeraltı Şehri, Ihlara Vadisi\'nde 4 km yürüyüş ve Selime Manastırı.'],
   ['3. gün','Peri bacaları ve Avanos','İsteğe bağlı sabah balon turu. Paşabağ, Devrent Vadisi ve Avanos\'ta çömlek atölyesi.'],
   ['4. gün','Dönüş','Kahvaltıdan sonra serbest zaman, öğleden sonra havalimanına transfer.']],
  yer:['İstanbul Havalimanı, iç hatlar','Uçuştan 2 saat önce Mola360 karşılama noktasında.'],
  dahil:['Gidiş-dönüş uçak bileti','3 gece mağara otelde konaklama, kahvaltı dahil','Havalimanı transferleri ve gezi ulaşımı','Profesyonel rehberlik'],
  haric:['Balon turu (isteğe bağlı)','Müze ve ören yeri girişleri','Öğle ve akşam yemekleri'],
  bilgi:['Vadi yürüyüşü için rahat ayakkabı getir.','Balon uçuşu hava koşuluna bağlı; uçulmazsa balon ücreti iade edilir.']},

 'Efes ve Şirince Turu':{about:'Antik Efes\'in mermer caddelerinde rehberle yürüyüş, ardından Şirince\'nin taş evleri arasında serbest zaman. Bir günde iki farklı Ege.',
  program:[['08:00','İzmir\'den hareket','Konak ve Bornova\'dan alış.'],['10:00','Efes Antik Kenti','Celsus Kütüphanesi, Büyük Tiyatro ve Kuretler Caddesi; yaklaşık 2,5 saat rehberli gezi.'],
   ['13:00','Öğle yemeği','Selçuk\'ta ev yemekleri.'],['14:30','Şirince','Köyde serbest zaman, şarap ve zeytinyağı tadımı.'],['18:30','İzmir\'e dönüş','Alış noktalarına bırakış.']],
  yer:['Konak, İzmir · Saat Kulesi önü','Sabah 08:00. Bornova\'dan katılanlar 07:40\'ta metro çıkışından alınır.'],
  dahil:['Klimalı araçla ulaşım','Profesyonel rehber','Öğle yemeği'],haric:['Efes Antik Kenti girişi','İçecekler','Tadım ürünleri'],
  bilgi:['Ören yerinde gölge az; şapka ve su getir.']},

 'Sapanca ve Maşukiye Turu':{about:'Şehirden bir günlüğüne çık: Sapanca Gölü kıyısında kahvaltı ve yürüyüş, Maşukiye\'de dere kenarında öğle yemeği.',
  program:[['07:30','İstanbul\'dan hareket','Kadıköy ve Ataşehir\'den alış.'],['10:00','Sapanca Gölü','Göl kıyısında kahvaltı ve yürüyüş.'],
   ['13:00','Maşukiye','Dere kenarında öğle molası, isteyene zipline.'],['16:00','Kartepe','Teleferik ya da kahve molası.'],['19:30','Dönüş','İstanbul\'a varış.']],
  yer:['Kadıköy, İstanbul · Söğütlüçeşme metrobüs durağı','Sabah 07:30. Ataşehir\'den 07:50\'de alış.'],
  dahil:['Otobüsle ulaşım','Rehberlik','Serpme kahvaltı'],haric:['Öğle yemeği','Zipline ve teleferik'],
  bilgi:['Göl kıyısı serin olabilir; ince bir mont al.']},

 'Pamukkale ve Hierapolis':{about:'Beyaz travertenlerde çıplak ayakla yürüyüş, Hierapolis Antik Kenti ve isteyene Antik Havuz\'da yüzme.',
  program:[['06:30','İzmir\'den hareket','Konak ve Karşıyaka\'dan alış.'],['10:30','Hierapolis','Antik tiyatro ve Kuzey Nekropol, rehberli.'],
   ['12:30','Travertenler','Serbest zaman, isteyene Antik Havuz.'],['14:00','Öğle yemeği','Karahayıt\'ta açık büfe.'],['18:30','Dönüş','İzmir\'e varış.']],
  yer:['Konak, İzmir · Saat Kulesi önü','Sabah 06:30. Karşıyaka\'dan 06:10\'da, Bornova\'dan 06:50\'de alış.'],
  dahil:['Klimalı araçla ulaşım','Rehberlik','Öğle yemeği'],haric:['Ören yeri girişi','Antik Havuz girişi'],
  bilgi:['Travertenlerde ayakkabıyla yürünmez; çıkarıp elinde taşırsın.','Mayo ve havlu getir.']},

 'Ege Adaları Balayı Kaçamağı':{about:'Çeşme\'den feribotla kısa bir geçiş: Sakız Adası\'nın sakız köyleri, Mesta\'nın dar sokakları ve deniz kenarında iki akşam yemeği. Çiftler için tasarlandı.',
  program:[['1. gün','Feribot ve Sakız','Çeşme Limanı\'ndan feribot, butik otele yerleşme, limanda akşam yemeği.'],
   ['2. gün','Sakız köyleri','Pirgi\'nin desenli evleri, Mesta ve Mavra Volia plajı.'],['3. gün','Dönüş','Serbest sabah, öğleden sonra feribotla Çeşme.']],
  yer:['Çeşme Limanı, İzmir','Pasaport kontrolü için feribottan 1 saat önce limanda ol.'],
  dahil:['Gidiş-dönüş feribot','2 gece butik otel, kahvaltı dahil','Ada turu ve rehberlik','İki kişilik akşam yemeği'],haric:['Kapıda vize ücreti','Öğle yemekleri'],
  bilgi:['Pasaportun dönüşten sonra en az 6 ay geçerli olmalı.','Kapıda vize uygulaması dönemsel; yola çıkmadan geçerli olup olmadığını teyit ederiz.']},

 'Midilli Adası Kaçamağı':{about:'Ayvalık\'tan feribotla Midilli: taş köyler, zeytinlikler ve Molivos\'ta gün batımı.',
  program:[['1. gün','Feribot ve Midilli','Ayvalık\'tan feribot, otele yerleşme, Midilli kordonunda akşam.'],
   ['2. gün','Molivos ve Petra','Kalenin altındaki balıkçı köyü Molivos ve Petra plajı.'],['3. gün','Dönüş','Serbest sabah, feribotla Ayvalık.']],
  yer:['Ayvalık Limanı, Balıkesir','Pasaport kontrolü için feribottan 1 saat önce limanda ol.'],
  dahil:['Gidiş-dönüş feribot','2 gece otel, kahvaltı dahil','Ada turu'],haric:['Kapıda vize ücreti','Öğle ve akşam yemekleri'],
  bilgi:['Pasaportun dönüşten sonra en az 6 ay geçerli olmalı.']},

 'Batum ve Acara Turu':{about:'Sarp sınır kapısından kimlikle geçip Batum\'un sahil bulvarına: Acara\'nın şelaleleri, botanik bahçesi ve Gürcü mutfağı.',
  program:[['1. gün','Trabzon\'dan Batum\'a','Sarp kapısından geçiş, otele yerleşme, akşam Batum Bulvarı.'],['2. gün','Batum','Avrupa Meydanı, Ali ve Nino heykeli, teleferik.'],
   ['3. gün','Acara','Makhuntseti Şelalesi ve Batum Botanik Bahçesi.'],['4. gün','Dönüş','Öğleden sonra Trabzon\'a varış.']],
  yer:['Trabzon · Meydan Parkı önü','Sabah 08:00.'],
  dahil:['Otobüsle ulaşım','3 gece otel, kahvaltı dahil','Rehberlik'],haric:['Teleferik ve müze girişleri','Öğle ve akşam yemekleri'],
  bilgi:['Yeni tip kimlik kartıyla ya da pasaportla geçilir.']},

 'Balkanlar: Saraybosna ve Mostar':{about:'Saraybosna\'nın Başçarşı\'sı, Mostar Köprüsü ve Bosna\'nın yeşil vadileri. Osmanlı izleriyle Avrupa\'nın buluştuğu beş gün.',
  program:[['1. gün','Saraybosna\'ya varış','Havalimanında karşılama, Başçarşı\'da akşam yürüyüşü.'],['2. gün','Saraybosna','Gazi Hüsrev Bey Camii, Latin Köprüsü ve Tünel Müzesi.'],
   ['3. gün','Mostar','Konjic üzerinden Mostar, Stari Most ve eski çarşı.'],['4. gün','Blagaj ve Kravice','Blagaj Tekkesi ve Kravice şelaleleri.'],['5. gün','Dönüş','Saraybosna\'dan İstanbul\'a uçuş.']],
  yer:['İstanbul Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['Gidiş-dönüş uçak bileti','4 gece otel, kahvaltı dahil','Programdaki ulaşım','Rehberlik'],haric:['Müze girişleri','Öğle ve akşam yemekleri'],
  bilgi:['Türk vatandaşları vizesiz girer; pasaport en az 6 ay geçerli olmalı.']},

 'Dubai Turu':{about:'Burj Khalifa\'nın seyir katı, çöl safarisi ve eski Dubai\'nin baharat çarşısı. Ailelere uygun, sakin bir tempo.',
  program:[['1. gün','Varış','Otele transfer, akşam Dubai Marina.'],['2. gün','Eski Dubai','Abra ile Creek geçişi, Altın ve Baharat Çarşısı.'],
   ['3. gün','Çöl safarisi','Öğleden sonra kum tepeleri, kamp ve akşam yemeği.'],['4. gün','Burj Khalifa','Dubai Mall ve seyir katı.'],['5. gün','Dönüş','İstanbul\'a uçuş.']],
  yer:['İstanbul Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['Gidiş-dönüş uçak bileti','4 gece otel, kahvaltı dahil','Çöl safarisi ve akşam yemeği','Rehberlik'],haric:['E-vize ücreti','Burj Khalifa girişi','Öğle yemekleri'],
  bilgi:['E-vize başvurusunu kalkıştan en az 10 gün önce yap; başvuruda yardımcı oluruz.']},

 'İtalya: Roma, Floransa ve Venedik':{about:'Kolezyum\'dan Uffizi\'ye, Rialto Köprüsü\'nden Toskana tepelerine: İtalya\'nın üç büyük şehri tek rotada.',
  program:[['1. gün','Roma','Varış, Trevi Çeşmesi ve İspanyol Merdivenleri.'],['2. gün','Roma ve Vatikan','Kolezyum, Roma Forumu ve Vatikan Müzeleri.'],
   ['3. gün','Floransa','Hızlı trenle Floransa, Duomo ve Ponte Vecchio.'],['4. gün','Toskana','Siena ve Pisa\'ya günübirlik.'],
   ['5. gün','Venedik','Trenle Venedik, San Marco Meydanı ve gondol.'],['6. gün','Dönüş','Venedik\'ten İstanbul\'a uçuş.']],
  yer:['İstanbul Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['Gidiş-dönüş uçak bileti','5 gece otel, kahvaltı dahil','Şehirler arası hızlı tren','Rehberlik'],haric:['Schengen vize ücreti','Müze girişleri','Şehir konaklama vergisi'],
  bilgi:['Schengen vizesine kalkıştan en az 1 ay önce başvur.']},

 'İspanya: Barselona ve Madrid':{about:'Gaudí\'nin Barselona\'sı ve Prado\'nun Madrid\'i; arada tapas ve flamenko.',
  program:[['1. gün','Barselona','Varış, Gotik Mahalle ve La Rambla.'],['2. gün','Gaudí günü','Sagrada Família, Park Güell ve Passeig de Gràcia.'],
   ['3. gün','Serbest gün','İsteyene Montserrat gezisi.'],['4. gün','Madrid','Hızlı trenle Madrid, Plaza Mayor.'],
   ['5. gün','Madrid','Prado Müzesi, Retiro Parkı, akşam flamenko.'],['6. gün','Dönüş','Madrid\'den İstanbul\'a uçuş.']],
  yer:['İstanbul Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['Gidiş-dönüş uçak bileti','5 gece otel, kahvaltı dahil','Barselona – Madrid hızlı tren','Rehberlik'],haric:['Schengen vize ücreti','Müze girişleri','Montserrat gezisi'],
  bilgi:['Schengen vizesine kalkıştan en az 1 ay önce başvur.']},

 'Fransa: Paris ve Loire Şatoları':{about:'Paris\'in bulvarları ve Loire Vadisi\'nin şatoları: Chambord, Chenonceau ve Versay.',
  program:[['1. gün','Paris','Varış, Eyfel Kulesi ve Seine kıyısı.'],['2. gün','Paris','Louvre, Marais ve Montmartre.'],
   ['3. gün','Loire şatoları','Chambord ve Chenonceau\'ya günübirlik.'],['4. gün','Versay','Versay Sarayı ve bahçeleri, akşam serbest.'],['5. gün','Dönüş','İstanbul\'a uçuş.']],
  yer:['İstanbul Havalimanı, dış hatlar','Uçuştan 3 saat önce Mola360 karşılama noktasında.'],
  dahil:['Gidiş-dönüş uçak bileti','4 gece otel, kahvaltı dahil','Loire ve Versay ulaşımı','Rehberlik'],haric:['Schengen vize ücreti','Saray ve müze girişleri'],
  bilgi:['Schengen vizesine kalkıştan en az 1 ay önce başvur.']},

 'Karadeniz Yaylaları Turu':{about:'Ayder\'in sisli yaylaları, Uzungöl, Zil Kale ve Fırtına Vadisi. Karadeniz\'in yeşili beş günde.',
  program:[['1. gün','Trabzon','Havalimanında karşılama, Sümela Manastırı.'],['2. gün','Uzungöl','Göl çevresinde yürüyüş, Çaykara.'],
   ['3. gün','Ayder','Ayder Yaylası, Gelintülü Şelalesi, kaplıca.'],['4. gün','Fırtına Vadisi','Zil Kale, Palovit Şelalesi ve Çamlıhemşin.'],['5. gün','Dönüş','Rize-Artvin Havalimanı\'ndan uçuş.']],
  yer:['İstanbul Havalimanı, iç hatlar','Uçuştan 2 saat önce Mola360 karşılama noktasında.'],
  dahil:['Gidiş-dönüş uçak bileti','4 gece otel, sabah ve akşam yemeği','Programdaki ulaşım','Rehberlik'],haric:['Sümela Manastırı girişi','Öğle yemekleri'],
  bilgi:['Yaylada hava çabuk değişir; yağmurluk al.']},

 'Turistik Doğu Ekspresi':{about:'Ankara\'dan Kars\'a yataklı trenle yolculuk; duraklarda kısa geziler, Kars\'ta Ani Ören Yeri ve Çıldır Gölü.',
  program:[['1. gün','Ankara\'dan kalkış','Yataklı vagona yerleşme, akşam yemeği trende.'],['2. gün','İliç ve Erzincan','Duraklarda kısa geziler, Fırat vadisi manzarası.'],
   ['3. gün','Kars','Varış, Kars Kalesi ve Baltık mimarisi.'],['4. gün','Ani ve Çıldır','Ani Ören Yeri ve Çıldır Gölü.'],
   ['5. gün','Erzurum','Çifte Minareli Medrese ve cağ kebabı.'],['6. gün','Dönüş','Erzurum\'dan Ankara\'ya uçuş.']],
  yer:['Ankara Garı','Kalkıştan 1 saat önce peronda.'],
  dahil:['Yataklı vagon, iki kişilik kompartıman','Kars ve Erzurum\'da 3 gece otel, kahvaltı dahil','Duraklardaki geziler','Dönüş uçak bileti'],haric:['Trendeki yemekler','Ören yeri girişleri'],
  bilgi:['Kasımdan itibaren Kars çok soğuk; kalın giyin.']},

 'Erciyes Kayak Haftası':{about:'Erciyes\'in uzun pistlerinde üç gün kayak: başlayanlara grup dersi, deneyimlilere serbest kayak.',
  program:[['1. gün','Kayseri','Havalimanında karşılama, pist dibindeki otele yerleşme, ekipman provası.'],['2. gün','Kayak','Seviyene göre grup dersi ya da serbest kayak.'],
   ['3. gün','Kayak','Tekir ve Hacılar kapılarındaki pistler.'],['4. gün','Kayak ve Kayseri','Öğleden sonra şehirde mantı ve pastırma molası.'],['5. gün','Dönüş','İstanbul\'a uçuş.']],
  yer:['İstanbul Havalimanı, iç hatlar','Uçuştan 2 saat önce Mola360 karşılama noktasında.'],
  dahil:['Gidiş-dönüş uçak bileti','4 gece otel, sabah ve akşam yemeği','Havalimanı transferleri','3 günlük skipass'],haric:['Kayak ekipmanı kiralama','Kayak dersi'],
  bilgi:['Pistlerin açılışı kara bağlı; kalkıştan 7 gün önce netleşir, açılmazsa ödemen iade edilir.']},

 'İstanbul Boğaz Turu':{about:'Eminönü\'nden kalkan teknede iki saat: Dolmabahçe, Ortaköy, Rumeli Hisarı ve iki köprünün altından geçiş.',
  program:[['Kalkış','Eminönü İskelesi','Biniş kalkıştan 15 dakika önce başlar.'],['30. dk','Ortaköy ve 15 Temmuz Şehitler Köprüsü','Dolmabahçe ve Çırağan önünden geçiş.'],
   ['1. saat','Rumeli Hisarı','Fatih Sultan Mehmet Köprüsü\'nde tekne döner.'],['2. saat','Eminönü\'ne dönüş','Asya kıyısı boyunca.']],
  yer:['Eminönü İskelesi, İstanbul','Kalkıştan 15 dakika önce iskelede ol.'],
  dahil:['2 saatlik tekne turu','Çay ve simit ikramı'],haric:['Diğer içecekler','Otel transferi'],
  bilgi:['Kötü havada tur iptal edilir ve ücretin iade edilir.']},

 'Ölüdeniz Yamaç Paraşütü':{about:'Babadağ\'ın 1.700 metresinden lisanslı bir pilotla tandem uçuş. Altında Ölüdeniz ve Kelebekler Vadisi.',
  program:[['Alış','Otelinden alınış','Fethiye ve Ölüdeniz otellerinden.'],['45 dk','Babadağ\'a çıkış','Arazi aracıyla zirveye.'],
   ['10 dk','Brifing','Pilotunla tanışma ve güvenlik anlatımı.'],['20 dk','Uçuş','Ölüdeniz plajına iniş.']],
  yer:['Ölüdeniz, Fethiye','Fethiye ve Ölüdeniz\'deki otellerden ücretsiz alış; saati rezervasyonda seçersin.'],
  dahil:['Lisanslı pilotla tandem uçuş','Ekipman ve sigorta','Otel transferi'],haric:['Fotoğraf ve video paketi'],
  bilgi:['120 kg üstü ve 7 yaş altı uçamaz.','Rüzgâr uygun değilse uçuş ertelenir ya da ücretin iade edilir.']},

 'Uludağ Kayak Dersi':{about:'Sertifikalı eğitmenle iki saatlik özel ders. İlk kez kayacaklar için güvenli bir başlangıç.',
  program:[['Buluşma','Kayak okulu','Ekipman teslimi ve ısınma.'],['30 dk','Temel teknikler','Durma, dönüş ve düşünce kalkma.'],['90 dk','Pistte uygulama','Başlangıç pistinde eğitmenle.']],
  yer:['Uludağ 2. Oteller Bölgesi, Bursa','Dersten 20 dakika önce kayak okulunun önünde.'],
  dahil:['2 saat özel ders','Kayak ve bot kiralama'],haric:['Skipass','Ulaşım'],
  bilgi:['Kar durumu dersten 24 saat önce netleşir; ders yapılamazsa ücretin iade edilir.']},

 'Bodrum Tekne Turu':{about:'Bodrum koylarında altı saat: Karaada\'nın sıcak su mağarası, Akvaryum Koyu ve teknede öğle yemeği.',
  program:[['10:30','Bodrum Limanı','Kalkış.'],['11:30','Karaada','Sıcak su mağarası ve yüzme.'],['13:00','Akvaryum Koyu','Öğle yemeği ve şnorkel.'],
   ['15:00','Kara Burun','Yüzme molası.'],['16:30','Dönüş','Bodrum Limanı.']],
  yer:['Bodrum Limanı, Kale önü','Kalkıştan 20 dakika önce teknede ol.'],
  dahil:['Tekne turu','Öğle yemeği','Şnorkel ekipmanı'],haric:['İçecekler','Otel transferi'],
  bilgi:['Havlu ve güneş kremi getir.']},

 'Köprülü Kanyon Rafting':{about:'Köprüçay\'ın kanyonunda 14 km rafting. İlk kez yapacaklara uygun, eğlencesi bol.',
  program:[['09:00','Otelden alış','Antalya, Side ve Manavgat\'tan.'],['10:30','Brifing','Ekipman ve güvenlik eğitimi.'],
   ['11:00','Rafting','Yaklaşık 2,5 saat, molalarla.'],['14:00','Öğle yemeği','Nehir kenarında.']],
  yer:['Beşkonak, Manavgat','Antalya, Side ve Manavgat otellerinden alış.'],
  dahil:['Rafting ve rehber','Ekipman ve sigorta','Öğle yemeği','Otel transferi'],haric:['Fotoğraf paketi','İçecekler'],
  bilgi:['Yüzme bilmek gerekmiyor; can yeleği zorunlu.','Islanacaksın; yedek kıyafet getir.']},

 'Kordon Caz Akşamları':{about:'Kordon\'da gün batımında açık havada caz. Bu akşam bir dörtlü ve konuk vokal sahnede.',
  program:[['19:00','Kapı açılışı',''],['20:00','Konser','Ara dahil yaklaşık 2 saat.'],['22:15','Kapanış','']],
  yer:['Kordon Açıkhava, Alsancak, İzmir','Alsancak vapur iskelesine 5 dakika yürüme.'],
  dahil:['Genel giriş, oturma ve ayakta alan'],haric:['Yiyecek ve içecek'],
  bilgi:['Biletin telefonunda; girişte QR kod okutulur.','Yağmurda konser ertelenir, biletin geçerli kalır.']},

 'Stand Up Gecesi':{about:'Üç komedyen, tek gece: kısa setlerle 90 dakikalık stand-up.',
  program:[['20:30','Kapı açılışı',''],['21:30','Gösteri','Yaklaşık 90 dakika, arasız.']],
  yer:['Jolly Joker, Kavaklıdere, Ankara','Kızılay metrosuna 10 dakika yürüme.'],
  dahil:['Genel giriş, numarasız oturma'],haric:['İçecekler'],
  bilgi:['18 yaş sınırı var.','Gösteri başladıktan sonra salona alınmaz.']},

 'Çeşme Yaz Festivali':{about:'Alaçatı sahilinde gün boyu müzik, sokak lezzetleri ve sörf gösterileri.',
  program:[['12:00','Kapı açılışı',''],['14:00','Sörf gösterileri',''],['18:00','Gün batımı setleri','DJ performansları.'],['21:00','Ana sahne','Gecenin konseri.']],
  yer:['Alaçatı Sahil, Çeşme','Otopark sınırlı; Alaçatı merkezden servis var.'],
  dahil:['Günlük giriş, tüm sahneler'],haric:['Yiyecek ve içecek','Servis'],
  bilgi:['Bileklikle gün içinde çıkıp yeniden girebilirsin.']},

 'Harbiye Açıkhava Konserleri':{about:'Cemil Topuzlu Açıkhava Tiyatrosu\'nda yıldızların altında bir yaz akşamı konseri.',
  program:[['19:30','Kapı açılışı',''],['21:00','Konser','Yaklaşık 2 saat.']],
  yer:['Cemil Topuzlu Açıkhava Tiyatrosu, Harbiye','Osmanbey metrosuna 7 dakika yürüme.'],
  dahil:['Konser girişi'],haric:['Yiyecek ve içecek','Otopark'],
  bilgi:['Akşam serin olur; ince bir hırka al.']},

 'Aspendos Opera ve Bale Festivali':{about:'İki bin yıllık Aspendos Antik Tiyatrosu\'nda açık havada opera ve bale.',
  program:[['19:00','Kapı açılışı',''],['20:30','Gösteri','Bir arayla yaklaşık 2,5 saat.']],
  yer:['Aspendos Antik Tiyatrosu, Serik, Antalya','Antalya merkezden 45 dakika; festival servisi var.'],
  dahil:['Gösteri girişi'],haric:['Servis','Minder'],
  bilgi:['Taş basamaklarda oturulur; minder getirebilirsin.']},

 'İstanbul Kahve Festivali':{about:'Kavurmacılar, baristalar ve demleme atölyeleri bir arada. Bütün gün tadım.',
  program:[['11:00','Kapı açılışı',''],['13:00','Demleme atölyeleri','Saat başı; yerler sınırlı.'],['16:00','Latte art yarışması',''],['20:00','Kapanış','']],
  yer:['KüçükÇiftlik Park, Maçka, İstanbul','Osmanbey metrosuna 10 dakika yürüme.'],
  dahil:['Günlük giriş','5 tadım kuponu'],haric:['Atölye ücretleri','Satın aldığın ürünler'],
  bilgi:['12 yaş altı ücretsiz.']},

 'Göreme Mağara Otel':{about:'Peri bacalarının içine oyulmuş mağara odalar ve Göreme\'ye bakan bir teras. Sabah balonlar tam karşında havalanıyor.',
  program:[['Oda','Mağara oda','Doğal taş, 25 m², çift kişilik yatak.'],['Kahvaltı','Terasta serpme kahvaltı','Balonların kalktığı saatte başlar.'],['Olanaklar','Teras, hamam, ücretsiz Wi-Fi','']],
  yer:['Göreme, Nevşehir','Göreme merkezine 5 dakika yürüme. Kayseri Havalimanı 70 km.'],
  dahil:['2 gece konaklama','Kahvaltı','Wi-Fi'],haric:['Havalimanı transferi','Hamam ve masaj'],
  bilgi:['Giriş 14:00, çıkış 12:00.','Mağara odalara merdivenle çıkılır.']},

 'Sealight Resort':{about:'Kemer\'de denize sıfır bir tatil köyü: özel plaj, aquapark ve çocuk kulübü. Ekim\'de deniz hâlâ sıcak.',
  program:[['Oda','Deniz manzaralı standart oda','28 m², balkonlu.'],['Yeme içme','Her şey dahil','Ana restoran, üç alakart restoran ve barlar.'],['Olanaklar','Özel plaj, aquapark, çocuk kulübü','']],
  yer:['Kemer, Antalya','Antalya Havalimanı 55 km.'],
  dahil:['2 gece konaklama','Her şey dahil yeme içme','Plaj ve havuz kullanımı'],haric:['Havalimanı transferi','Spa hizmetleri'],
  bilgi:['Giriş 14:00, çıkış 12:00.']},

 'Kordon Butik Otel':{about:'Alsancak\'ın ara sokaklarında yüksek tavanlı eski bir Rum evi. Kordon 120 metre ötede.',
  program:[['Oda','Butik oda','Yüksek tavanlı, 20 m².'],['Kahvaltı','Avluda kahvaltı',''],['Konum','Kordon\'a 120 m','Alsancak\'ın kafeleri kapının önünde.']],
  yer:['Alsancak, İzmir','Alsancak Garı\'na 6 dakika yürüme.'],
  dahil:['2 gece konaklama','Kahvaltı','Wi-Fi'],haric:['Otopark','Havalimanı transferi'],
  bilgi:['Giriş 14:00, çıkış 11:00.','Asansör yok; odalar ikinci kata kadar.']},

 'Termal Vadi Resort':{about:'Yalova\'nın ormanlık vadisinde termal havuzlarıyla bir hafta sonu dinlenmesi.',
  program:[['Oda','Standart oda','Orman manzaralı.'],['Termal','Açık ve kapalı termal havuz','Konaklamaya dahil.'],['Kahvaltı','Açık büfe kahvaltı','']],
  yer:['Termal, Yalova','Yalova iskelesine 12 km; İstanbul\'dan feribotla 1,5 saat.'],
  dahil:['2 gece konaklama','Kahvaltı','Termal havuz kullanımı'],haric:['Masaj ve kese','Akşam yemeği'],
  bilgi:['Giriş 14:00, çıkış 12:00.','Termal havuza 12 yaş altı yetişkinle girer.']},

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

 'Ayder Yayla Evi':{about:'Kaçkarlar\'ın eteğinde ahşap bir yayla evi. Sabah sisin içinden yayla, akşam şöminenin başında Karadeniz sofrası.',
  program:[['Oda','Ahşap oda, yayla manzarası','Çift kişilik ya da aile odası; balkonlu.'],['Kahvaltı','Karadeniz kahvaltısı','Muhlama, yayla tereyağı ve köy yumurtası.'],['Çevre','Ayder kaplıcası 300 m','Gelin Tülü Şelalesi\'ne yürüyerek 15 dakika.']],
  yer:['Ayder, Çamlıhemşin, Rize','Rize-Artvin Havalimanı\'na 85 km; otopark var.'],
  dahil:['2 gece konaklama','Kahvaltı'],haric:['Akşam yemeği','Kaplıca girişi'],
  bilgi:['Yaylada akşamlar serin; kalın bir şey getir.','Giriş 14:00, çıkış 12:00.']},

 'Maşukiye Dere Evi':{about:'Maşukiye\'de dere kenarında, ağaçların altında serpme kahvaltı ya da mangal. Şehirden kaçmak için kısa bir mola.',
  program:[['Kahvaltı','Serpme kahvaltı','Köy peyniri, bal-kaymak, gözleme; sınırsız çay.'],['Öğle ve akşam','Mangal menüsü','Köfte, tavuk şiş, közde sebze.'],['Bahçe','Dere kenarı masalar','Çocuklar için oyun alanı.']],
  yer:['Maşukiye, Kartepe, Kocaeli','Sapanca Gölü\'ne 10 km; otopark var.'],
  dahil:['Seçtiğin menü','Sınırsız çay'],haric:['Diğer içecekler'],
  bilgi:['Hafta sonu dere kenarı masalar erken doluyor; saatinde gel.']},

 'Kaleiçi Konak Restoran':{about:'Kaleiçi\'nde 19. yüzyıldan kalma bir konağın avlusunda Akdeniz mutfağı. Akşam yemeği limana bakan terasta.',
  program:[['Başlangıç','Mezeler','Zeytinyağlılar ve sıcak başlangıçlar.'],['Ana yemek','Günün balığı ya da kuzu','Yerel üreticiden mevsim ürünleriyle.'],['Tatlı','Ev yapımı tatlı','İsteyene şarap eşleşmesi.']],
  yer:['Kaleiçi, Muratpaşa, Antalya','Hadrian Kapısı\'na 5 dakika yürüme; araç girişi yok.'],
  dahil:['Seçtiğin menü, kişi başı'],haric:['Menü dışı içecekler','Servis ücreti'],
  bilgi:['Teras masaları rezervasyonla; 19:00 ve 21:00 oturumları var.']},

 'Erciyes Dağ Evi':{about:'Erciyes\'in eteğinde şömineli bir dağ evi. Pistten iner inmez fondü, sabahları dağ kahvaltısı.',
  program:[['Akşam','Fondü menüsü','Peynir fondü, sıcak şarap ya da sahlep.'],['Sabah','Dağ kahvaltısı','Pastırmalı yumurta ve Kayseri mantısı.'],['Salon','Şömine başı masalar','Pist manzaralı pencere kenarı.']],
  yer:['Tekir Kapı, Erciyes, Kayseri','Kayseri merkeze 25 km; teleferik istasyonuna 200 m.'],
  dahil:['Seçtiğin menü'],haric:['Diğer içecekler'],
  bilgi:['Kış sezonunda yol için zincir bulundur.']},

 'Kadıköy Akustik Sahne':{about:'Kadıköy\'de küçük bir sahne: her akşam canlı akustik müzik, masada yemek ve içki.',
  program:[['20:30','Kapı açılışı','Masana geç, menüden seç.'],['21:30','Canlı müzik','İki set; araya 15 dakika mola.'],['00:00','Kapanış','']],
  yer:['Moda, Kadıköy, İstanbul','Kadıköy iskelesine 10 dakika yürüme.'],
  dahil:['Seçtiğin masa, akşam boyunca'],haric:['Minimum harcamayı aşan tutar'],
  bilgi:['18 yaş sınırı var.','Fiyat masanın minimum harcaması; yediğin içtiğin bundan düşülür.']}
};

/* Tur kalkış noktaları (ÖRNEK): tur hangi şehirden çıkıyorsa o şehrin
   durakları [saat, durak, adres, not]. Burada olmayan turda tek kalkış
   noktası DETAY'daki "yer"den gelir. */
export const KALKIS={
 'Efes ve Şirince Turu':['İzmir','Otobüsle',[
   ['07:40','Bornova Metro','Ege Üniversitesi metro çıkışı, Bornova','Otobüs metro çıkışının karşısında bekler.'],
   ['08:00','Konak Saat Kulesi','Konak Meydanı, Konak','Rehberin Mola360 bayrağıyla otobüsün önünde karşılar.'],
   ['08:20','Gaziemir Optimum','Optimum AVM otoparkı girişi, Gaziemir','Otopark girişindeki otobüs cebinde.']]],
 'Sapanca ve Maşukiye Turu':['İstanbul','Otobüsle',[
   ['07:30','Kadıköy Söğütlüçeşme','Söğütlüçeşme metrobüs durağı, Kadıköy','Otobüs durağın Fikirtepe tarafında bekler.'],
   ['07:50','Ataşehir Metropol','Metropol İstanbul AVM önü, Ataşehir','AVM\'nin Bulvar girişinin önünde.'],
   ['08:15','Kartal Metro','Kartal metro istasyonu, D-100 çıkışı','Metro çıkışındaki otobüs cebinde.']]],
 'Pamukkale ve Hierapolis':['İzmir','Otobüsle',[
   ['06:10','Karşıyaka İskele','Karşıyaka İskelesi önü, Karşıyaka','İskele meydanındaki taksi durağının yanında.'],
   ['06:30','Konak Saat Kulesi','Konak Meydanı, Konak','Rehberin Mola360 bayrağıyla otobüsün önünde karşılar.'],
   ['06:50','Bornova Metro','Ege Üniversitesi metro çıkışı, Bornova','Otobüs metro çıkışının karşısında bekler.']]],
 'Batum ve Acara Turu':['Trabzon','Otobüsle',[
   ['08:00','Meydan Parkı','Meydan Parkı önü, Ortahisar','Otobüs parkın Uzun Sokak tarafında bekler.'],
   ['08:20','Trabzon Havalimanı','Dış hatlar terminali önü','Uçakla gelenler için.'],
   ['09:15','Rize Merkez','Rize Belediyesi önü, Rize','Yol üzerindeki son durak.']]],
 'Kapadokya Turu':['İstanbul','Uçakla',[
   ['05:30','İstanbul Havalimanı','İç hatlar gidiş katı, 4 numaralı kapı','Uçuştan 2 saat önce Mola360 karşılama noktasında.'],
   ['06:00','Sabiha Gökçen Havalimanı','İç hatlar gidiş katı, A kapısı','Uçuştan 2 saat önce Mola360 karşılama noktasında.']]]
};

/* Ürün türüne göre bölüm başlıkları: program ve konum */
export const BASLIK={tur:['Program','Kalkış noktası'],otel:['Konaklama','Konum'],etkinlik:['Akış','Etkinlik alanı'],aktivite:['Nasıl geçiyor?','Buluşma noktası'],mekan:['Hizmetler','Konum']};

/* Örnek değerlendirmeler: türe göre iki tane. Gerçekte yalnızca
   rezervasyonu tamamlayanlar yazar. */
export const YORUM={
 tur:[['selin',9.6,'Rehberimiz her durakta zamanı iyi ayarladı, kimse koşturmadı. Anlatımı çok keyifliydi.'],['kaan',8.8,'Program dolu ama yorucu değil. Buluşma noktası net anlatılmıştı.']],
 otel:[['zeynep',9.4,'Oda fotoğraflardaki gibiydi, kahvaltı çeşitliydi.'],['deniz',9.0,'Personel ilgiliydi; girişte bekletmediler.']],
 etkinlik:[['elif',9.5,'Ses çok iyiydi, girişte QR ile hızlıca geçtik.'],['mert',9.0,'Erken gidin; iyi yerler çabuk doluyor.']],
 aktivite:[['mert',9.8,'Ekip işini çok ciddiye alıyor, güvenlik anlatımı net ve uzundu.'],['kaan',9.2,'Otelden alış tam saatinde oldu.']],
 mekan:[['elif',9.4,'Randevu saatinde başladı, ortam çok sakindi.'],['selin',9.0,'Fiyat neyse o; sonradan bir şey eklenmedi.']]};
