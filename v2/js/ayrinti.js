/* Ürün sayfasının ayrıntı içeriği (ÖRNEK): öne çıkanlar, yanına al, ek hizmetler,
   önemli koşullar, katılım şartları, kurallar, konum ve yakındaki yerler, pansiyon,
   çalışma saatleri, menü… Anahtar ürün adıdır. Gerçekte işletmeden gelecek.
   Yazılmamış alan ürün sayfasında görünmez ya da api.js türe göre varsayılan verir. */

/* Öne çıkanlar: "neden bu deneyim", 3 kısa madde */
export const ONE={
 'Efes ve Şirince Turu':['Celsus Kütüphanesi ve 24 bin kişilik Büyük Tiyatro, lisanslı rehberle','Üst kapıdan alt kapıya yokuş aşağı rota; dik tırmanış yok','Şirince\'de şarap ve zeytinyağı tadımı'],
 'Pamukkale ve Hierapolis':['Beyaz travertenlerde çıplak ayakla yürüyüş','Hierapolis\'in antik tiyatrosu ve nekropolü rehberle','İsteyene Kleopatra\'nın Antik Havuzu\'nda yüzme'],
 'Bergama ve Asklepion Turu':['Akropole teleferikle çıkış, en dik antik tiyatro','Antik dünyanın şifa merkezi Asklepion','Öğlen gerçek Bergama köftesi'],
 'Sapanca ve Maşukiye Turu':['Sapanca Gölü kıyısında sabah yürüyüşü','Maşukiye\'de dere kenarında alabalık','Kartepe\'den körfez manzarası'],
 'İzmir Şehir Turu: Kemeraltı ve Kadifekale':['Kemeraltı\'nın hanlarında boyoz ve kahve molası','Kadifekale\'den bütün körfez','Tarihi Asansör\'de gün sonu'],
 'Ege Adaları Balayı Kaçamağı':['Çeşme\'den feribotla 30 dakikada Sakız Adası','Mesta ve Pirgi\'nin desenli taş köyleri','Deniz kenarında iki akşam yemeği'],
 'Midilli Adası Kaçamağı':['Ayvalık\'tan feribotla kısa bir geçiş','Molivos\'un kalesi ve gün batımı','Petra\'da Ege usulü meze sofrası'],
 'Batum ve Acara Turu':['Sarp\'tan kimlikle geçiş, pasaport şart değil','Batum Bulvarı ve Botanik Bahçesi','Acara şelaleleri ve hacapuri'],
 'Kapadokya Turu':['Göreme\'de mağara otelde 3 gece; terasından sabah balonları','Ihlara Vadisi\'nde ırmak boyunca 3 km yürüyüş','Derinkuyu Yeraltı Şehri lisanslı rehberle'],
 'Karadeniz Yaylaları Turu':['Ayder ve Pokut yaylaları','Uzungöl ve Fırtına Vadisi\'nde taş köprüler','Zil Kale\'ye sisin içinden yürüyüş'],
 'Turistik Doğu Ekspresi':['Yataklı kompartımanda Ankara\'dan Kars\'a','Ani Ören Yeri ve Çıldır Gölü','Duraklarda Erzincan ve Erzurum gezileri'],
 'Erciyes Kayak Haftası':['3 tam gün kayak, 34 km pist','Başlayanlara her gün 2 saat grup dersi','Pist dibinde otel; kayakla çıkış'],
 'Balkanlar: Saraybosna ve Mostar':['Başçarşı\'da Osmanlı izleri','Mostar Köprüsü\'nde dalış gösterisi','Kravice Şelaleleri\'nde serbest zaman'],
 'Dubai Turu':['Burj Khalifa 124. kat seyir terası','Çöl safarisi ve kamp akşam yemeği','Eski Dubai\'de abra ile dere geçişi'],
 'İtalya: Roma, Floransa ve Venedik':['Kolezyum ve Vatikan Müzeleri rehberle','Floransa\'da Uffizi ve Duomo','Venedik\'te Rialto ve San Marco'],
 'İspanya: Barselona ve Madrid':['Sagrada Família ve Park Güell rehberle','Madrid\'de Prado Müzesi','Bir akşam flamenko gösterisi'],
 'Fransa: Paris ve Loire Şatoları':['Loire Vadisi\'nde Chambord ve Chenonceau','Versay Sarayı ve bahçeleri','Paris\'te Seine üzerinde tekne turu'],
 'Kordon Caz Akşamları':['Kordon\'da gün batımında açık hava','Dörtlü ve konuk vokal','Sahne önünde oturma alanı'],
 'Kültürpark Açıkhava Konserleri':['Ağaçların arasında açık hava amfisi','Her hafta farklı sanatçı','Numaralı koltuk seçeneği'],
 'İzmir Senfoni Gecesi':['Saygun\'un akustiği güçlü büyük salonu','Uvertür, keman konçertosu ve senfoni','Öğrenciye indirimli bilet'],
 'Bornova Stand Up Gecesi':['Üç komedyen, 90 dakika','Küçük salon, sahneye yakın','Metroya 5 dakika'],
 'Konak Sahnesi Tiyatro Akşamı':['İki perdelik komedi','Sahne seyirciye çok yakın','Arada fuayede çay ve kahve'],
 'Karşıyaka Çocuk Tiyatrosu':['3–10 yaş için müzikli masal','Fuayede boyama köşesi','Oyundan sonra oyuncularla tanışma'],
 'Çeşme Yaz Festivali':['Gün boyu iki sahne','Sörf gösterileri ve gün batımı setleri','Bileklikle çıkıp yeniden giriş'],
 'Urla Bağbozumu Şenliği':['Ayakla üzüm ezme','Üreticilerin tezgâhları ve bağ sofrası','Akşamüstü bağda konser'],
 'İzmir Kahve Festivali':['40\'tan fazla kavurmacı ve barista','Demleme atölyeleri','Latte art yarışması'],
 'Alaçatı Rüzgar Sörfü Dersi':['Sığ ve sakin öğrenme alanı','Kumda simülatörle başlangıç','Dersin sonunda yelkeni kaldırıp gidiyorsun'],
 'Alaçatı Kitesurf Dersi':['IKO sertifikalı eğitmen','Telsizli kask ile suda yönlendirme','Bütün ekipman dahil'],
 'Sığacık SUP Turu':['Kalenin önünden sakin koylara','İlk kez binenlere kıyıda anlatım','Su geçirmez telefon kılıfı dahil'],
 'Foça Tekne Turu':['Siren Kayalıkları','Üç adada yüzme molası','Teknede balık ya da tavuk ızgara'],
 'Körfez Gün Batımı Tekne Turu':['Gün batımı denizden','Kordon ve Karşıyaka açıkları','Teknede çay ve kurabiye ikramı'],
 'Çeşme Koylar Tekne Turu':['Üç koyda yüzme','Aya Yorgi\'nin turkuaz suyu','Teknede öğle yemeği'],
 'Urla Bağ Turu ve Şarap Tadımı':['Üç bağ, üç mahzen','Bornova misketi ve foça karası gibi yerel üzümler','Terasta peynir tabağıyla tadım'],
 'Kemeraltı Lezzet Yürüyüşü':['8 durakta 12 tadım','Boyozdan kumruya İzmir klasikleri','Hanların hikâyesi rehberden'],
 'Bornova Ege Mutfağı Atölyesi':['Ege otlarıyla dört tabak','En fazla 10 kişilik grup','Sonunda hep birlikte sofra'],
 'Urla Seramik Atölyesi':['Çarkta kendi kâsen ya da fincanın','Önceden pişmiş parçayı sırlama','Kargoyla eve teslim seçeneği'],
 'Kemeraltı Ebru Atölyesi':['Ebru ustasıyla teknenin başında','İlk kez deneyenler için','Eserini zarfta götürürsün'],
 'Kordon Spa & Masaj':['Deneyimli terapistler, randevulu','Masajdan sonra sauna ve dinlenme odası','Alsancak\'ın ortasında sakin bir salon'],
 'Kum Beach Club':['Sığ ve berrak koy','Şezlong, sedir ya da loca; gün boyu senin','Ödediğin tutar harcamandan düşülür'],
 'Kemeraltı Han Kahvesi':['Tarihi han avlusunda közde kahve','Sabahları han kahvaltısı','Çarşının kalabalığından uzak'],
 'Alaçatı Taş Avlu Kahvaltı':['Begonvillerin altında taş avlu','30 çeşitlik serpme kahvaltı','Ege otlu tabaklar'],
 'Bostanlı Sahil Kahvaltısı':['Körfeze bakan masalar','Sınırsız çay','Bebek arabasıyla rahat giriş'],
 'Bornova Köşk Bahçesi':['Levanten köşkünün bahçesi','Çınarların altında masalar','Hafta sonu brunch'],
 'Sığacık Liman Balıkçısı':['Kalenin dibinde liman','Günün avından balık','Öğlen de akşam da açık'],
 'Urla İskele Balıkçısı':['Masalar suya birkaç adım','Gün batımına yakın erken oturum','Altı tabaklık şef menüsü'],
 'Çeşme Liman Meyhanesi':['Kaleye bakan masalar','Altı soğuk meze, iki ara sıcak','Günün balığı'],
 'Urla Bağ Yolu Sofrası':['Bağların içinde tek oturum','Yedi tabaklık tadım menüsü','Bağın kendi şaraplarıyla eşleşme'],
 'Asansör Teras Restoran':['Bütün körfeze bakan teras','Tarihi asansörle çıkış','Gün batımı menüsü'],
 'Kordon Meyhanesi':['Kordon\'a bakan masalar','Cuma ve cumartesi canlı fasıl','Ara sıcaklar ve günün balığı'],
 'Alsancak Akustik Sahne':['Her akşam canlı akustik müzik','Masada yemek ve içki','Ödediğin tutar harcamandan düşülür'],
 'Kıbrıs Şehitleri Caz Bar':['Her akşam canlı caz','İmza kokteyller','Ödediğin tutar harcamandan düşülür'],
 'Balçova Termal Hamam':['Kaynağından termal su','Geleneksel kese ve köpük','Dinlenme salonunda çay'],
 'Kordon Butik Otel':['Yüksek tavanlı eski bir Rum evi','Kordon 120 metre','Avluda kahvaltı'],
 'Alaçatı Taş Otel':['On odalı avlulu taş ev','Çarşıya 3 dakika','Ücretsiz bisiklet'],
 'Ilıca Aile Resort':['Sığ, ince kumlu özel plaj','Kapalı termal havuz','4–12 yaş çocuk kulübü'],
 'Urla Bağ Evi Otel':['Bağların ortasında sekiz oda','Havuz başında kahvaltı','Şarap tadımı otelde'],
 'Eski Foça Pansiyon':['Denize 50 metre','Terastan liman ve adalar','Aile işletmesi, altı oda'],
 'Şirince Köy Evi':['Restore taş köy evi','Asma altında köy kahvaltısı','Vadiye bakan teras'],
 'Balçova Termal Otel':['Açık ve kapalı termal havuz','Hamam ve sauna dahil','Konak\'a 12 km'],
 'Bostanlı Körfez Otel':['Sahil yolu kapının önünde','Vapur iskelesine 5 dakika','Körfez manzaralı odalar'],
 'Sığacık Kale Evi':['Kale surlarının içinde','Limana 2 dakika','Pazar günü üretici pazarı'],
 'Göreme Mağara Otel':['Peri bacasına oyulmuş odalar','Terastan sabah balonları','Otelde hamam'],
 'Sealight Resort':['Denize sıfır, özel plaj','Aquapark ve çocuk kulübü','Her şey dahil'],
 'Termal Vadi Resort':['Ormanlık vadide termal havuzlar','İstanbul\'dan feribotla 1,5 saat','Sauna ve buhar odası'],
 'Ayder Yayla Evi':['Kaçkarlar\'ın eteğinde ahşap ev','Ayder kaplıcasına 300 m','Şömine başında Karadeniz sofrası']};

/* Yanına al (tur, aktivite). Yazılmamışsa api.js türe göre varsayılan verir. */
export const YANINA={
 'Efes ve Şirince Turu':['Kaygan olmayan tabanlı rahat ayakkabı','Şapka ve güneş kremi; antik kentte gölge az','Doldurulabilir su şişesi','Kimlik'],
 'Pamukkale ve Hierapolis':['Elde taşınabilir hafif ayakkabı','Mayo ve havlu','Güneş gözlüğü; travertenler parlak','Kimlik'],
 'Bergama ve Asklepion Turu':['Rahat ayakkabı','Şapka ve su','Müze kartın varsa','Kimlik'],
 'Kapadokya Turu':['Yürüyüş için rahat ayakkabı','Sabah balonu için rüzgâr geçirmez üstlük','Şapka ve güneş kremi','Kimlik (uçuş için zorunlu)'],
 'Karadeniz Yaylaları Turu':['Yağmurluk','Su geçirmez yürüyüş ayakkabısı','Kalın bir üstlük','Kimlik (uçuş için zorunlu)'],
 'Turistik Doğu Ekspresi':['Kalın mont, bere ve eldiven','Trende giymek için rahat kıyafet','Powerbank','Kimlik'],
 'Erciyes Kayak Haftası':['Kayak kıyafeti (mont ve pantolon)','Termal içlik ve kalın çorap','Kayak gözlüğü ve eldiven','Kimlik (uçuş için zorunlu)'],
 'Ege Adaları Balayı Kaçamağı':['Pasaport','Mayo ve havlu','Euro nakit (adada kart her yerde geçmez)'],
 'Midilli Adası Kaçamağı':['Pasaport','Mayo ve havlu','Euro nakit'],
 'Batum ve Acara Turu':['Yeni tip kimlik kartı ya da pasaport','Yağmurluk','Lari ya da dolar nakit'],
 'Alaçatı Rüzgar Sörfü Dersi':['Mayo ve havlu','Güneş kremi','Yedek kıyafet'],
 'Alaçatı Kitesurf Dersi':['Mayo ve havlu','Güneş kremi','Yedek kıyafet'],
 'Sığacık SUP Turu':['Mayo','Yedek kıyafet','Güneş kremi'],
 'Foça Tekne Turu':['Mayo ve havlu','Güneş kremi ve şapka','Deniz ayakkabısı'],
 'Çeşme Koylar Tekne Turu':['Mayo ve havlu','Güneş kremi ve şapka','Deniz ayakkabısı'],
 'Körfez Gün Batımı Tekne Turu':['İnce bir mont','Fotoğraf için şarjlı telefon'],
 'Urla Bağ Turu ve Şarap Tadımı':['Kimlik (18 yaş kontrolü)','Bağda yürümek için düz ayakkabı'],
 'Kemeraltı Lezzet Yürüyüşü':['Rahat ayakkabı','Aç bir mide'],
 'Urla Seramik Atölyesi':['Kirlenebilecek kıyafet'],
 'Bornova Ege Mutfağı Atölyesi':['Saçını toplamak için toka']};

/* Ek hizmetler: [ad, fiyat, birim (kisi | rez | gece), kısa not] */
export const EK={
 'Efes ve Şirince Turu':[['Yamaç Evler ek bileti',380,'kisi','Efes\'in mozaikli evleri, rehberle 30 dakika'],['Efes girişi',900,'kisi','Gişe sırası beklemeden']],
 'Pamukkale ve Hierapolis':[['Antik Havuz girişi',600,'kisi','Havlu ve dolap dahil'],['Yamaç paraşütü',2500,'kisi','Travertenlerin üstünde 25 dakika uçuş']],
 'Bergama ve Asklepion Turu':[['Ören yeri girişleri ve teleferik',1150,'kisi','Akropol, Asklepion ve teleferik birlikte']],
 'Sapanca ve Maşukiye Turu':[['Maşukiye\'de zipline',450,'kisi','Dere üstünde 300 metre']],
 'Kapadokya Turu':[['Sıcak hava balonu',2990,'kisi','Gün doğumunda 1 saat uçuş, otelden alış'],['ATV ile vadi turu',1200,'kisi','Gün batımında 2 saat']],
 'Karadeniz Yaylaları Turu':[['Fırtına Deresi rafting',950,'kisi','Ekipman ve eğitmen dahil']],
 'Erciyes Kayak Haftası':[['Kayak ekipmanı kiralama',1800,'kisi','3 gün kayak, bot ve baton'],['Özel kayak dersi',1500,'kisi','2 saat, birebir eğitmen']],
 'Dubai Turu':[['Dubai Marina akşam yemekli tekne',2200,'kisi','2 saat, açık büfe']],
 'İtalya: Roma, Floransa ve Venedik':[['Venedik\'te gondol',1600,'kisi','30 dakika, 6 kişilik gondolda'],['Vatikan Müzeleri hızlı giriş',950,'kisi','Sıra beklemeden']],
 'İspanya: Barselona ve Madrid':[['Flamenko gösterisi ve tapas',1900,'kisi','Madrid\'de bir akşam']],
 'Fransa: Paris ve Loire Şatoları':[['Eyfel Kulesi zirve bileti',1700,'kisi','Asansörle en üst kat']],
 'Alaçatı Rüzgar Sörfü Dersi':[['Fotoğraf ve video paketi',600,'rez','Ders boyunca kıyıdan çekim']],
 'Alaçatı Kitesurf Dersi':[['Fotoğraf ve video paketi',800,'rez','Ders boyunca kıyıdan çekim']],
 'Foça Tekne Turu':[['Teknede içecek paketi',350,'kisi','Gün boyu meşrubat ve çay']],
 'Çeşme Koylar Tekne Turu':[['Teknede içecek paketi',350,'kisi','Gün boyu meşrubat ve çay']],
 'Urla Bağ Turu ve Şarap Tadımı':[['Bağdan şarap şişesi',650,'rez','Turun sonunda seçtiğin bağdan']],
 'Urla Seramik Atölyesi':[['İkinci parça',300,'kisi','Bir kâse ya da fincan daha']],
 'Kordon Spa & Masaj':[['Yüz bakımı · 30 dk',700,'kisi','Masajdan sonra'],['Aromaterapi yağı',200,'kisi','Lavanta, okaliptüs ya da portakal']],
 'Balçova Termal Hamam':[['Köpük masajı',350,'kisi','Kese sonrası 15 dakika']],
 'Kum Beach Club':[['Vale',300,'rez','Girişte aracını bırakırsın']],
 'Asansör Teras Restoran':[['Pasta ve çiçek sürprizi',750,'rez','Doğum günü ya da yıl dönümü için']],
 'Urla Bağ Yolu Sofrası':[['Urla merkeze dönüş servisi',250,'kisi','Yemekten sonra']],
 'Kordon Butik Otel':[['Geç çıkış · 16:00\'ya kadar',600,'rez','Müsaitliğe bağlı'],['Havalimanı transferi',1200,'rez','Tek yön, 3 kişiye kadar']],
 'Alaçatı Taş Otel':[['Odada şarap ve meyve',850,'rez','Varışta odanda'],['Havalimanı transferi',2200,'rez','Tek yön, 3 kişiye kadar']],
 'Ilıca Aile Resort':[['Spa paketi',1500,'kisi','Masaj ve hamam, 60 dakika']],
 'Urla Bağ Evi Otel':[['Bağ evinde şarap tadımı',900,'kisi','Akşamüstü, beş şarap']],
 'Göreme Mağara Otel':[['Sıcak hava balonu',2990,'kisi','Otelden alış, 1 saat uçuş'],['Havalimanı transferi',1400,'rez','Kayseri, tek yön']],
 'Sealight Resort':[['Spa paketi',1400,'kisi','Masaj ve hamam, 60 dakika']],
 'Balçova Termal Otel':[['Masaj · 45 dk',900,'kisi','Otelin spa merkezinde']]};

/* Turda konaklama: oteller [ad, yıldız, bölge, gece, not], pansiyon [ad, not] */
export const KONAK={
 'Ege Adaları Balayı Kaçamağı':{oteller:[['Chios Harbour Boutique',4,'Sakız merkez, liman',2,'Limana bakan balkonlu odalar; çiftlere çift kişilik yatak.']],pansiyon:['Oda + kahvaltı','İki kahvaltı ve iki akşam yemeği dahil; öğle yemekleri sana ait.']},
 'Midilli Adası Kaçamağı':{oteller:[['Molivos View Hotel',4,'Molivos',2,'Kaleye ve denize bakan teraslı otel; havuzlu.']],pansiyon:['Oda + kahvaltı','İki kahvaltı dahil.']},
 'Batum ve Acara Turu':{oteller:[['Batumi Boulevard Hotel',4,'Batum, sahil bulvarı',3,'Bulvara 2 dakika yürüme; odalarda balkon.']],pansiyon:['Oda + kahvaltı','Üç kahvaltı ve bir Gürcü akşam yemeği dahil.']},
 'Kapadokya Turu':{oteller:[['Göreme Mağara Konağı',4,'Göreme, Nevşehir',3,'Kayaya oyulmuş odalar, taş avlu ve balon manzaralı teras.']],pansiyon:['Oda + kahvaltı','Üç kahvaltı dahil; üçüncü gün Ihlara Vadisi\'nde öğle yemeği de dahil.']},
 'Karadeniz Yaylaları Turu':{oteller:[['Trabzon Zorlu Grand',5,'Trabzon merkez',1,'Meydan Parkı\'na yürüme mesafesi.'],['Ayder Kuşpuni Dağ Evi',3,'Ayder, Rize',3,'Ahşap dağ evi; kaplıcaya 5 dakika.']],pansiyon:['Yarım pansiyon','Dört kahvaltı ve dört akşam yemeği dahil.']},
 'Turistik Doğu Ekspresi':{oteller:[['Yataklı kompartıman',0,'Doğu Ekspresi',2,'İki kişilik kompartıman; çarşaf ve battaniye dahil.'],['Kars Kar Otel',4,'Kars merkez',2,'Taş bina, şehir merkezinde.'],['Erzurum Palandöken Otel',4,'Erzurum',1,'Şehre 10 dakika.']],pansiyon:['Oda + kahvaltı','Beş kahvaltı ve trende iki akşam yemeği dahil.']},
 'Erciyes Kayak Haftası':{oteller:[['Erciyes Ski Lodge',4,'Erciyes, Tekir kapısı',4,'Pist dibinde; kayakla çıkış, kayak dolabı.']],pansiyon:['Yarım pansiyon','Dört kahvaltı ve dört akşam yemeği dahil.']},
 'Balkanlar: Saraybosna ve Mostar':{oteller:[['Hotel Europe',4,'Saraybosna, Başçarşı',3,'Başçarşı\'ya 3 dakika yürüme.'],['Hotel Kriva Ćuprija',3,'Mostar, eski şehir',1,'Köprüye 2 dakika.']],pansiyon:['Oda + kahvaltı','Dört kahvaltı dahil.']},
 'Dubai Turu':{oteller:[['Rove Downtown',4,'Downtown Dubai',4,'Burj Khalifa\'ya 10 dakika yürüme; havuzlu.']],pansiyon:['Oda + kahvaltı','Dört kahvaltı ve çöl kampında bir akşam yemeği dahil.']},
 'İtalya: Roma, Floransa ve Venedik':{oteller:[['Hotel Quirinale',4,'Roma, Termini',2,'Termini İstasyonu\'na 5 dakika.'],['Hotel Spadai',4,'Floransa, Duomo',2,'Duomo\'ya 2 dakika.'],['Hotel Ai Mori d\'Oriente',4,'Venedik, Cannaregio',1,'Kanal kenarında.']],pansiyon:['Oda + kahvaltı','Beş kahvaltı dahil.']},
 'İspanya: Barselona ve Madrid':{oteller:[['Hotel Catalonia Eixample',4,'Barselona, Eixample',3,'Passeig de Gràcia\'ya 5 dakika.'],['Hotel Liabeny',4,'Madrid, Gran Vía',2,'Puerta del Sol\'e 3 dakika.']],pansiyon:['Oda + kahvaltı','Beş kahvaltı dahil.']},
 'Fransa: Paris ve Loire Şatoları':{oteller:[['Hotel Mercure Paris Opéra',4,'Paris, Opéra',3,'Opéra\'ya 4 dakika yürüme.'],['Hotel Le Bon Laboureur',4,'Chenonceaux, Loire',1,'Şatoya 5 dakika.']],pansiyon:['Oda + kahvaltı','Dört kahvaltı dahil.']}};

/* Program durakları: programla aynı sırada [süre, rozet]; rozet "Giriş dahil" | "Ücretli" */
export const DURAK={
 'Efes ve Şirince Turu':[null,['2,5 saat','Ücretli'],['1 saat',''],['2,5 saat','Tadım dahil'],null],
 'Pamukkale ve Hierapolis':[null,['1,5 saat','Ücretli'],['1,5 saat',''],['1 saat','Yemek dahil'],null],
 'Bergama ve Asklepion Turu':[null,['2 saat','Ücretli'],['1 saat','Yemek dahil'],['1,5 saat','Ücretli'],null],
 'Sapanca ve Maşukiye Turu':[null,['2 saat',''],['2 saat',''],['1,5 saat',''],null],
 'İzmir Şehir Turu: Kemeraltı ve Kadifekale':[['30 dk',''],['1,5 saat','İkram dahil'],['45 dk','Ücretli'],['1 saat',''],['45 dk','Giriş dahil']],
 'Foça Tekne Turu':[null,['30 dk',''],['1 saat','Yüzme'],['3 saat','Yemek dahil'],null],
 'Çeşme Koylar Tekne Turu':[null,['1 saat','Yüzme'],['2 saat','Yemek dahil'],['1,5 saat','Yüzme'],null],
 'Kemeraltı Lezzet Yürüyüşü':[null,['50 dk','Tadım dahil'],['50 dk','Tadım dahil'],['50 dk','Tadım dahil']]};

/* Dönüş: çok günlü turlarda; günübirlikte programın son adımından yazılır */
export const DONUS={
 'Ege Adaları Balayı Kaçamağı':'3. gün 18:30 civarı Çeşme Limanı\'nda, servisle 20:00\'de Konak\'ta biter.',
 'Midilli Adası Kaçamağı':'3. gün 18:00 civarı Ayvalık Limanı\'nda biter.',
 'Batum ve Acara Turu':'4. gün 19:00 civarı Trabzon Meydan Parkı önünde biter.',
 'Kapadokya Turu':'4. günün akşamı İstanbul Havalimanı\'nda biter.',
 'Karadeniz Yaylaları Turu':'5. günün akşamı İstanbul Havalimanı\'nda biter.',
 'Turistik Doğu Ekspresi':'6. gün öğleden sonra Erzurum\'dan uçakla Ankara\'ya dönülür.',
 'Erciyes Kayak Haftası':'5. günün akşamı İstanbul Havalimanı\'nda biter.',
 'Balkanlar: Saraybosna ve Mostar':'5. günün akşamı İstanbul Havalimanı\'nda biter.',
 'Dubai Turu':'5. günün gecesi İstanbul Havalimanı\'nda biter.',
 'İtalya: Roma, Floransa ve Venedik':'6. gün Venedik\'ten uçakla, akşam İstanbul Havalimanı\'nda biter.',
 'İspanya: Barselona ve Madrid':'6. gün Madrid\'den uçakla, akşam İstanbul Havalimanı\'nda biter.',
 'Fransa: Paris ve Loire Şatoları':'5. günün akşamı İstanbul Havalimanı\'nda biter.'};

/* Önemli koşullar (tur, aktivite). Turlarda minimum katılım kuralını api.js ekler. */
export const ONEMLI={
 'Efes ve Şirince Turu':['Antik kentte zemin mermer ve taş; tekerlekli sandalye erişimi kısıtlı. Kısaltılmış rota için rezervasyonda not düş.','Meryem Ana Evi\'ne uğranırsa omuz ve diz kapalı kıyafet gerekir.'],
 'Pamukkale ve Hierapolis':['Travertenler kaygandır; yürüme güçlüğü olanlar üst terastan izleyebilir.'],
 'Bergama ve Asklepion Turu':['Akropol\'de dik basamaklar var; hareket kısıtı olan misafir teleferik istasyonunda bekleyebilir.'],
 'Kapadokya Turu':['Ihlara Vadisi\'ne iniş 400 basamak, asansör yok; hareket kısıtı olan misafir Belisırma\'da gruba katılır.','Derinkuyu\'da geçitler dar ve basık; kapalı alan rahatsızlığı olanlar için uygun değil.','Mağara odalar serin ve nemli; standart oda istersen rezervasyonda yaz.'],
 'Karadeniz Yaylaları Turu':['Yayla yolları virajlı; araç tutması olanlar ön koltuk için rezervasyonda not düşsün.'],
 'Turistik Doğu Ekspresi':['Tren saatleri TCDD\'ye bağlı; gecikmelerde program kaydırılır.','Kompartımanlar iki kişilik; tek kişi katılırsan tek kişilik oda farkı alınır.'],
 'Erciyes Kayak Haftası':['Pistler kara bağlı; kalkıştan 7 gün önce açılmazsa ödemenin tamamı iade edilir.'],
 'Ege Adaları Balayı Kaçamağı':['Feribot seferleri hava koşuluna bağlı; iptalde ertesi sefere aktarılırsın.'],
 'Midilli Adası Kaçamağı':['Feribot seferleri hava koşuluna bağlı; iptalde ertesi sefere aktarılırsın.'],
 'Dubai Turu':['Cami ziyaretlerinde kadınlar için başörtüsü ve uzun kıyafet gerekir.'],
 'Alaçatı Kitesurf Dersi':['Ders rüzgâra göre planlanır; sabah 08:00\'de saat teyidi gönderilir.'],
 'Foça Tekne Turu':['Teknede tuvalet var; tekerlekli sandalyeyle biniş mümkün değil.'],
 'Çeşme Koylar Tekne Turu':['Teknede tuvalet var; tekerlekli sandalyeyle biniş mümkün değil.']};

/* Aktivite: katılım şartları [başlık, metin] */
export const SART={
 'Alaçatı Rüzgar Sörfü Dersi':[['Yaş','8 yaş ve üzeri; 14 yaş altı veliyle gelir.'],['Yüzme','Yüzme bilmek gerekir; can yeleği verilir.'],['Sağlık','Hamileler ve bel fıtığı olanlar için önerilmez.']],
 'Alaçatı Kitesurf Dersi':[['Yaş','14 yaş ve üzeri.'],['Kilo','En az 40, en fazla 110 kg.'],['Yüzme','Yüzme bilmek gerekir.'],['Sağlık','Hamileler, kalp ve omuz rahatsızlığı olanlar katılamaz.']],
 'Sığacık SUP Turu':[['Yaş','10 yaş ve üzeri; 14 yaş altı yetişkinle.'],['Yüzme','Yüzme bilmek gerekir; can yeleği verilir.'],['Kilo','Tahta en fazla 110 kg taşır.']],
 'Foça Tekne Turu':[['Yaş','Her yaş katılabilir; çocuklara can yeleği verilir.']],
 'Çeşme Koylar Tekne Turu':[['Yaş','Her yaş katılabilir; çocuklara can yeleği verilir.']],
 'Körfez Gün Batımı Tekne Turu':[['Yaş','Her yaş katılabilir.']],
 'Urla Bağ Turu ve Şarap Tadımı':[['Yaş','18 yaş ve üzeri; girişte kimlik sorulur.']],
 'Kemeraltı Lezzet Yürüyüşü':[['Yürüyüş','Yaklaşık 2,5 km, düz zemin.'],['Beslenme','Vejetaryen seçenek var; glütensiz tadım sınırlı.']],
 'Bornova Ege Mutfağı Atölyesi':[['Yaş','12 yaş ve üzeri; şarap eşleşmesi 18 yaş ve üzeri.'],['Beslenme','Vejetaryen menü istenirse uyarlanır.']],
 'Urla Seramik Atölyesi':[['Yaş','7 yaş ve üzeri; 12 yaş altı yetişkinle.']],
 'Kemeraltı Ebru Atölyesi':[['Yaş','6 yaş ve üzeri; 12 yaş altı yetişkinle.']]};

/* Hava koşulu iadesi (açık hava aktiviteleri) */
export const HAVA={
 'Alaçatı Rüzgar Sörfü Dersi':'Rüzgâr ders için uygun değilse ücretin tamamı iade edilir ya da ek ücret olmadan başka saate alınır.',
 'Alaçatı Kitesurf Dersi':'Rüzgâr uygun değilse ücretin tamamı iade edilir ya da ek ücret olmadan başka güne alınır.',
 'Sığacık SUP Turu':'Rüzgâr sertse ücretin tamamı iade edilir ya da başka saate alınır.',
 'Foça Tekne Turu':'Kötü havada tekne kalkmazsa ücretin tamamı iade edilir. Karar sabah 08:00\'de bildirilir.',
 'Körfez Gün Batımı Tekne Turu':'Kötü havada tekne kalkmazsa ücretin tamamı iade edilir.',
 'Çeşme Koylar Tekne Turu':'Kötü havada tekne kalkmazsa ücretin tamamı iade edilir. Karar sabah 08:00\'de bildirilir.'};

/* Etkinlik ve mekân kuralları [başlık, metin] */
export const KURAL={
 'Kordon Caz Akşamları':[['Yaş','12 yaş altı ücretsiz, yetişkinle girer.'],['Yiyecek','Dışarıdan yiyecek ve içecek alınmaz; alanda büfe var.']],
 'Kültürpark Açıkhava Konserleri':[['Yaş','7 yaş ve üzeri herkes bilet alır.'],['Kayıt','Profesyonel kamera ve tripod alınmaz.']],
 'İzmir Senfoni Gecesi':[['Geç kalma','Konser başladıktan sonra salona ilk arada alınırsın.'],['Kayıt','Konser sırasında fotoğraf ve video çekilmez.'],['Kıyafet','Kıyafet serbest; ceket şart değil.']],
 'Bornova Stand Up Gecesi':[['Yaş','18 yaş ve üzeri; girişte kimlik sorulabilir.'],['Geç kalma','Gösteri başladıktan sonra salona alınmaz.'],['Telefon','Gösteri sırasında video çekilmez.']],
 'Konak Sahnesi Tiyatro Akşamı':[['Geç kalma','Oyun başladıktan sonra salona arada alınırsın.'],['Kayıt','Oyun sırasında fotoğraf ve video çekilmez.']],
 'Karşıyaka Çocuk Tiyatrosu':[['Yaş','3 yaş ve üzeri herkes bilet alır; 3 yaş altı kucakta ücretsiz.'],['Bebek arabası','Fuayede bırakılır.']],
 'Çeşme Yaz Festivali':[['Giriş','Bileklikle gün içinde çıkıp yeniden girebilirsin.'],['Yasak','Cam şişe ve dışarıdan alkol alınmaz.']],
 'Urla Bağbozumu Şenliği':[['Yaş','Tadım alanına 18 yaş altı girmez.'],['Evcil hayvan','Tasmalı köpekler girebilir.']],
 'İzmir Kahve Festivali':[['Kupa','Kendi kupanı getirebilirsin; tadımlar ona da doldurulur.'],['Evcil hayvan','Tasmalı köpekler girebilir.']],
 'Kum Beach Club':[['Minimum harcama','Fiyat seçtiğin alanın minimum harcaması; yediğin içtiğin bundan düşülür, altında kalırsan fark iade edilmez.'],['Çocuklar','Gündüz kabul edilir; 21:00\'den sonra müzik yükselir.'],['Kıyafet','Akşam restoranda mayoyla oturulmaz.']],
 'Alsancak Akustik Sahne':[['Yaş','18 yaş ve üzeri.'],['Minimum harcama','Masanın minimum harcaması hesabından düşülür.']],
 'Kıbrıs Şehitleri Caz Bar':[['Yaş','18 yaş ve üzeri.'],['Minimum harcama','Masanın minimum harcaması hesabından düşülür.']],
 'Balçova Termal Hamam':[['Havuz','Mayo ve bone gerekir.'],['Sağlık','Kalp ya da tansiyon rahatsızlığın varsa doktoruna danış.']],
 'Kordon Meyhanesi':[['Yaş','18 yaş altı yetişkinle, 22:00\'ye kadar.']],
 'Çeşme Liman Meyhanesi':[['Süre','Masan 2,5 saat senin.']]};

/* Etkinlik: nasıl gidilir */
export const ULASIM={
 'Kordon Caz Akşamları':['Otopark yok; Alsancak Garı otoparkı 600 m.','Kapılar 19:00\'da açılır.'],
 'Kültürpark Açıkhava Konserleri':['Kültürpark otoparkı ücretli ve erken dolar.','Kapılar 19:30\'da açılır.'],
 'İzmir Senfoni Gecesi':['Saygun otoparkı ücretsiz, 120 araç.','Kapılar 19:15\'te açılır.'],
 'Bornova Stand Up Gecesi':['Kapılar 20:30\'da açılır.'],
 'Konak Sahnesi Tiyatro Akşamı':['Kapılar 19:45\'te açılır.'],
 'Karşıyaka Çocuk Tiyatrosu':['Kapılar 10:30\'da açılır.'],
 'Çeşme Yaz Festivali':['Alaçatı merkezden 20 dakikada bir ücretsiz servis.','Otopark sınırlı; servis öneriyoruz.','Kapılar 12:00\'de açılır.'],
 'Urla Bağbozumu Şenliği':['Urla merkezden saatte bir festival servisi.','Bağ yolunda otopark sınırlı.'],
 'İzmir Kahve Festivali':['Kapılar 11:00\'de açılır.']};

/* Etkinlik: yağmur yağarsa (açık hava) */
export const YAGMUR={
 'Kordon Caz Akşamları':'Hafif yağışta konser sürer. Sağanakta ertelenir; biletin yeni tarihte geçerli kalır ya da tamamı iade edilir.',
 'Kültürpark Açıkhava Konserleri':'Sağanakta konser ertelenir; biletin yeni tarihte geçerli kalır ya da tamamı iade edilir.',
 'Çeşme Yaz Festivali':'Festival yağmurda da sürer; ana sahne çadırla örtülüdür. Fırtınada iptal edilirse bilet iade edilir.',
 'Urla Bağbozumu Şenliği':'Yağmurda etkinlikler bağın kapalı mahzenlerine alınır; şenlik iptal edilirse bilet iade edilir.'};

/* Festival ve konser serisi takvimi: yaklaşan tarihlere sırayla [ad, ayrıntı] */
export const TAKVIM={
 'Kültürpark Açıkhava Konserleri':[['Fazıl Say','Piyano resitali'],['Kardeş Türküler','Anadolu ezgileri'],['Bülent Ortaçgil','Akustik'],['İzmir Devlet Senfoni','Film müzikleri gecesi']],
 'Çeşme Yaz Festivali':[['Mor ve Ötesi','Ana sahne 21:00'],['Gaye Su Akyol','Ana sahne 21:00'],['Büyük Ev Ablukada','Ana sahne 21:00'],['Adamlar','Ana sahne 21:00']],
 'Urla Bağbozumu Şenliği':[['Ece Seçkin','Bağ konseri 17:00'],['Cem Adrian','Bağ konseri 17:00'],['Kalben','Bağ konseri 17:00'],['Pinhani','Bağ konseri 17:00']],
 'İzmir Kahve Festivali':[['Filtre kahve günü','V60 ve Chemex atölyeleri'],['Espresso günü','Latte art yarışması'],['Türk kahvesi günü','Közde pişirme atölyesi'],['Soğuk kahve günü','Cold brew tadımı']]};

/* Otel: konum ve yakındaki yerler [ad, mesafe, ayrıntı] */
export const KONUM={
 'Kordon Butik Otel':{adres:'Mimar Sinan Mah. 1453 Sok. No: 12, Alsancak, Konak, İzmir',yakin:[['Kordon yürüyüş yolu','120 m','2 dakika yürüme'],['Kıbrıs Şehitleri Caddesi','300 m','Kafe ve mağazalar'],['Alsancak Garı','450 m','İZBAN ve tramvay'],['Konak Meydanı','2,1 km','Tramvayla 8 dakika']]},
 'Alaçatı Taş Otel':{adres:'Hacı Memiş Mah. 3030 Sok. No: 8, Alaçatı, Çeşme, İzmir',yakin:[['Alaçatı çarşısı','250 m','3 dakika yürüme'],['Alaçatı yel değirmenleri','600 m','Gün batımı'],['Alaçatı sörf plajı','4 km','Araçla 8 dakika'],['Adnan Menderes Havalimanı','85 km','Araçla 1 saat']]},
 'Ilıca Aile Resort':{adres:'Ilıca Mah. Plaj Cad. No: 4, Çeşme, İzmir',yakin:[['Ilıca plajı','0 m','Otelin önünde'],['Çeşme Kalesi','6 km','Araçla 10 dakika'],['Alaçatı','8 km','Araçla 12 dakika'],['Adnan Menderes Havalimanı','90 km','Araçla 1 saat 5 dakika']]},
 'Urla Bağ Evi Otel':{adres:'Bağ Yolu, Kuşçular Mah., Urla, İzmir',yakin:[['Urla Bağ Yolu bağları','0 m','Otel bağların içinde'],['Urla merkez','7 km','Araçla 10 dakika'],['Urla İskele','11 km','Araçla 15 dakika'],['Adnan Menderes Havalimanı','60 km','Araçla 45 dakika']]},
 'Eski Foça Pansiyon':{adres:'Küçükdeniz Mah. 182 Sok. No: 5, Foça, İzmir',yakin:[['Küçükdeniz limanı','50 m','1 dakika yürüme'],['Beşkapılar Kalesi','400 m','5 dakika yürüme'],['Siren Kayalıkları','Tekneyle','Limandan günlük turlar'],['İzmir merkez','70 km','Araçla 1 saat']]},
 'Şirince Köy Evi':{adres:'Şirince Köyü, Selçuk, İzmir',yakin:[['Şirince köy meydanı','300 m','4 dakika yürüme'],['Efes Antik Kenti','12 km','Araçla 15 dakika'],['Selçuk merkez','8 km','Araçla 12 dakika'],['Adnan Menderes Havalimanı','65 km','Araçla 50 dakika']]},
 'Balçova Termal Otel':{adres:'Termal Mah. Vali Hüsnü Tuğlu Cad. No: 2, Balçova, İzmir',yakin:[['Balçova teleferik','1,5 km','Araçla 4 dakika'],['Agora AVM','2 km','Araçla 5 dakika'],['Konak','12 km','Araçla 20 dakika'],['Adnan Menderes Havalimanı','25 km','Araçla 25 dakika']]},
 'Bostanlı Körfez Otel':{adres:'Bostanlı Mah. Cemal Gürsel Cad. No: 410, Karşıyaka, İzmir',yakin:[['Bostanlı vapur iskelesi','400 m','5 dakika yürüme'],['Bostanlı sahil yürüyüş yolu','0 m','Otelin önünde'],['Karşıyaka çarşısı','2,5 km','Tramvayla 10 dakika'],['Adnan Menderes Havalimanı','30 km','Araçla 30 dakika']]},
 'Sığacık Kale Evi':{adres:'Sığacık Mah. Kale İçi No: 21, Seferihisar, İzmir',yakin:[['Sığacık limanı','150 m','2 dakika yürüme'],['Teos Antik Kenti','5 km','Araçla 8 dakika'],['Akkum plajı','6 km','Araçla 10 dakika'],['İzmir merkez','50 km','Araçla 50 dakika']]},
 'Göreme Mağara Otel':{adres:'Aydınlı Mah. Uzundere Cad. No: 15, Göreme, Nevşehir',yakin:[['Göreme merkez','400 m','5 dakika yürüme'],['Göreme Açık Hava Müzesi','1,5 km','Araçla 4 dakika'],['Uçhisar Kalesi','5 km','Araçla 8 dakika'],['Kayseri Havalimanı','70 km','Araçla 1 saat']]},
 'Sealight Resort':{adres:'Göynük Mah. Sahil Cad., Kemer, Antalya',yakin:[['Özel plaj','0 m','Otelin önünde'],['Kemer Marina','6 km','Araçla 10 dakika'],['Göynük Kanyonu','4 km','Araçla 8 dakika'],['Antalya Havalimanı','55 km','Araçla 50 dakika']]},
 'Termal Vadi Resort':{adres:'Gökçedere Mah., Termal, Yalova',yakin:[['Yalova Termal Kaplıcaları','800 m','10 dakika yürüme'],['Sudüşen Şelalesi','3 km','Araçla 6 dakika'],['Yalova iskelesi','12 km','Araçla 15 dakika']]},
 'Ayder Yayla Evi':{adres:'Ayder Yaylası, Çamlıhemşin, Rize',yakin:[['Ayder kaplıcası','300 m','4 dakika yürüme'],['Gelin Tülü Şelalesi','500 m','6 dakika yürüme'],['Pokut Yaylası','14 km','Araçla 40 dakika'],['Rize-Artvin Havalimanı','85 km','Araçla 1,5 saat']]}};

/* Otel pansiyon seçenekleri [ad, kişi başı gecelik fark, not]; ilki fiyata dahil */
export const PANSIYON={
 'Kordon Butik Otel':[['Oda + kahvaltı',0,'Avluda serpme kahvaltı'],['Sadece oda',-150,'Kahvaltısız']],
 'Alaçatı Taş Otel':[['Oda + kahvaltı',0,'Avluda Ege kahvaltısı'],['Yarım pansiyon',600,'Akşam avluda üç tabak set menü; içecekler ayrı']],
 'Ilıca Aile Resort':[['Her şey dahil',0,'Yemekler, yerli içecekler ve dondurma']],
 'Urla Bağ Evi Otel':[['Oda + kahvaltı',0,'Havuz başında kahvaltı'],['Yarım pansiyon',750,'Bağ evinde akşam sofrası']],
 'Eski Foça Pansiyon':[['Oda + kahvaltı',0,'Terasta kahvaltı']],
 'Şirince Köy Evi':[['Oda + kahvaltı',0,'Asma altında köy kahvaltısı'],['Yarım pansiyon',450,'Akşam köy sofrası']],
 'Balçova Termal Otel':[['Yarım pansiyon',0,'Açık büfe kahvaltı ve akşam yemeği'],['Tam pansiyon',300,'Öğle yemeği de dahil']],
 'Bostanlı Körfez Otel':[['Oda + kahvaltı',0,'Açık büfe kahvaltı'],['Sadece oda',-200,'Kahvaltısız']],
 'Sığacık Kale Evi':[['Oda + kahvaltı',0,'Avluda köy kahvaltısı']],
 'Göreme Mağara Otel':[['Oda + kahvaltı',0,'Terasta serpme kahvaltı'],['Yarım pansiyon',550,'Akşam otelde Kapadokya mutfağı']],
 'Sealight Resort':[['Her şey dahil',0,'Yemekler, yerli içecekler, aquapark'],['Ultra her şey dahil',650,'Yabancı içecekler ve à la carte restoranlar']],
 'Termal Vadi Resort':[['Oda + kahvaltı',0,'Açık büfe kahvaltı'],['Yarım pansiyon',400,'Akşam açık büfe']],
 'Ayder Yayla Evi':[['Oda + kahvaltı',0,'Karadeniz kahvaltısı'],['Yarım pansiyon',350,'Akşam şömine başında Karadeniz sofrası']]};

/* Otel: odada bulunanlar (olanaklar "Odada" ve "Tesiste" diye ayrılır) */
export const ODADA={
 'Kordon Butik Otel':['Klima','Minibar','Kasa','Çay ve kahve seti','Saç kurutma makinesi'],
 'Alaçatı Taş Otel':['Klima','Minibar','Çay ve kahve seti','Organik banyo ürünleri'],
 'Ilıca Aile Resort':['Klima','Minibar','Kasa','Balkon','Bebek karyolası (istek üzerine)'],
 'Urla Bağ Evi Otel':['Klima','Kahve makinesi','Bağ manzarası'],
 'Eski Foça Pansiyon':['Klima','Duş','Çay seti'],
 'Şirince Köy Evi':['Vantilatör','Çay seti','Vadi manzarası'],
 'Balçova Termal Otel':['Klima','Minibar','Balkon','Termal sulu duş'],
 'Bostanlı Körfez Otel':['Klima','Çalışma masası','Minibar','Kasa'],
 'Sığacık Kale Evi':['Klima','Çay seti'],
 'Göreme Mağara Otel':['Doğal taş duvarlar','Çay ve kahve seti','Saç kurutma makinesi'],
 'Sealight Resort':['Klima','Minibar','Kasa','Balkon'],
 'Termal Vadi Resort':['Klima','Minibar','Termal sulu banyo'],
 'Ayder Yayla Evi':['Balkon','Elektrikli ısıtıcı','Çay seti']};

/* Mekân: çalışma saatleri Pazartesi'den Pazar'a [açılış, kapanış] (null: kapalı) ve fiyat seviyesi */
const H7=(a,b,c,d)=>[[a,b],[a,b],[a,b],[a,b],[c||a,d||b],[c||a,d||b],[a,b]];
export const SAAT={
 'Kordon Spa & Masaj':{h:H7('10:00','22:00'),f:'₺₺₺'},
 'Kum Beach Club':{h:H7('09:00','02:00','09:00','03:00'),f:'₺₺₺₺'},
 'Kemeraltı Han Kahvesi':{h:[null,['08:30','19:00'],['08:30','19:00'],['08:30','19:00'],['08:30','19:00'],['08:30','20:00'],['09:00','18:00']],f:'₺'},
 'Alaçatı Taş Avlu Kahvaltı':{h:H7('08:30','15:00'),f:'₺₺'},
 'Bostanlı Sahil Kahvaltısı':{h:H7('08:00','16:00'),f:'₺₺'},
 'Bornova Köşk Bahçesi':{h:[null,['09:00','17:00'],['09:00','17:00'],['09:00','17:00'],['09:00','17:00'],['09:00','18:00'],['09:00','18:00']],f:'₺₺'},
 'Sığacık Liman Balıkçısı':{h:H7('12:00','23:30'),f:'₺₺₺'},
 'Urla İskele Balıkçısı':{h:H7('17:00','00:00'),f:'₺₺₺'},
 'Çeşme Liman Meyhanesi':{h:H7('18:00','01:00'),f:'₺₺₺'},
 'Urla Bağ Yolu Sofrası':{h:[null,null,['19:00','23:00'],['19:00','23:00'],['19:00','23:00'],['19:00','23:00'],['19:00','23:00']],f:'₺₺₺₺'},
 'Asansör Teras Restoran':{h:H7('12:00','00:00'),f:'₺₺₺'},
 'Kordon Meyhanesi':{h:H7('17:00','01:00','17:00','02:00'),f:'₺₺₺'},
 'Alsancak Akustik Sahne':{h:[null,['20:00','01:00'],['20:00','01:00'],['20:00','01:00'],['20:00','02:00'],['20:00','02:00'],['20:00','01:00']],f:'₺₺'},
 'Kıbrıs Şehitleri Caz Bar':{h:[null,['20:00','02:00'],['20:00','02:00'],['20:00','02:00'],['20:00','03:00'],['20:00','03:00'],['20:00','02:00']],f:'₺₺₺'},
 'Balçova Termal Hamam':{h:H7('08:00','22:00'),f:'₺'}};

/* Mekân: menü [bölüm, [[ad, fiyat]]] */
export const MENU={
 'Kemeraltı Han Kahvesi':[['Kahve',[['Közde Türk kahvesi',120],['Damla sakızlı kahve',140],['Dibek kahvesi',130]]],['Kahvaltı',[['Han kahvaltısı',420],['Menemen',220],['Boyoz ve yumurta',180]]]],
 'Alaçatı Taş Avlu Kahvaltı':[['Kahvaltı',[['Serpme kahvaltı · kişi',750],['Ege otlu kahvaltı · 2 kişi',1400]]],['Ekstra',[['Otlu gözleme',260],['Sakızlı muhallebi',190]]]],
 'Bostanlı Sahil Kahvaltısı':[['Kahvaltı',[['Serpme kahvaltı · kişi',560],['Gözleme ve çay',240]]],['Sıcak',[['Sucuklu yumurta',230],['Pişi tabağı',210]]]],
 'Bornova Köşk Bahçesi':[['Kahvaltı',[['Köşk kahvaltısı',620],['Brunch tabağı',480]]],['Tatlı',[['Bornova lokması',160],['Köşk keki',140]]]],
 'Sığacık Liman Balıkçısı':[['Başlangıç',[['Deniz börülcesi',260],['Ahtapot salata',420],['Balık köftesi',340]]],['Ana yemek',[['Günün balığı (kg)',2200],['Kalamar tava',480]]]],
 'Urla İskele Balıkçısı':[['Başlangıç',[['Urla enginarı',320],['Ahtapot ızgara',780],['Levrek marin',380]]],['Ana yemek',[['Günün balığı (kg)',2400],['Karides güveç',560]]]],
 'Çeşme Liman Meyhanesi':[['Soğuk meze',[['Girit ezmesi',220],['Atom',180],['Fava',200]]],['Ara sıcak',[['Paçanga böreği',280],['Kalamar tava',460]]]],
 'Asansör Teras Restoran':[['Başlangıç',[['Ege otları tabağı',340],['Levrek carpaccio',420]]],['Ana yemek',[['Kuzu incik',890],['Deniz mahsullü risotto',720]]],['Tatlı',[['Sakızlı muhallebi',220],['Fırın sütlaç',200]]]],
 'Kordon Meyhanesi':[['Soğuk meze',[['Humus',190],['Haydari',170],['Deniz börülcesi',240]]],['Ara sıcak',[['Arnavut ciğeri',380],['Midye tava',360]]]],
 'Kum Beach Club':[['Yemek',[['Ahtapot ızgara',780],['Deniz mahsullü makarna',640],['Kulüp sandviç',420]]],['İçecek',[['Ev limonatası',180],['Kokteyl',420]]]],
 'Alsancak Akustik Sahne':[['Tabaklar',[['Peynir tabağı',380],['Patates kroket',240]]],['İçecek',[['Yerel bira',190],['Kadeh şarap',260]]]],
 'Kıbrıs Şehitleri Caz Bar':[['Tabaklar',[['Bruschetta tabağı',280],['Peynir ve şarküteri',460]]],['Kokteyl',[['Negroni',420],['Caz bar imza kokteyli',460]]]]};
