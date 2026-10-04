/* ÖRNEK VERİ. Ürün adları ve fiyatlar örnek katalogdan; kalkış tarihleri,
   etkinlik saatleri ve yurt dışı turları uydurma (docs/yeni-surum.md).
   Bu dosya ileride yerini tek veri katmanına (api.js) bırakacak. */

/* Fotoğraflar: ürün adı (ya da "tema:<id>") → v2/img/ altındaki dosya.
   Fotoğrafı olmayan her şey renk geçişiyle görünür; fotoğraf yüklenemezse
   de geçiş arkada kalır. Kural (docs/yeni-surum.md "Fotoğraf kuralı"):
   4:5, en az 1200×1500, webp ya da jpg, 200 KB altı; konu ortada, alt
   üçte bir sakin (yazı oraya biner). Kaynak ve lisans v2/img/KAYNAK.md'de. */
export const IMG={};

/* Görsel yer tutucu renk geçişleri (gerçek fotoğraf gelene kadar) */
export const G={kapadokya:'linear-gradient(160deg,#EBC79B,#B97648 48%,#5B6B92)',efes:'linear-gradient(160deg,#EDDFC2,#B8925B 50%,#6E93AE)',sapanca:'linear-gradient(160deg,#B7D79A,#4F8F5B 55%,#2D5570)',
ege:'linear-gradient(160deg,#9ED8EC,#2F8DBA 55%,#E9D6AE)',karadeniz:'linear-gradient(160deg,#A9CFA0,#3F7A52 50%,#475E7A)',dogu:'linear-gradient(160deg,#EEF2F7,#9AA9C2 45%,#6B3F3F)',
erciyes:'linear-gradient(160deg,#F1F4F9,#AFC2DA 50%,#40577E)',bogaz:'linear-gradient(160deg,#9CC7E4,#3A6FA5 55%,#223A66)',parasut:'linear-gradient(160deg,#BFE6F2,#43A7CF 50%,#2E7D5B)',
rafting:'linear-gradient(160deg,#A8D8C8,#2F8F86 55%,#35506E)',bodrum:'linear-gradient(160deg,#BDE7F0,#3796C0 55%,#F0E1BE)',kayak:'linear-gradient(160deg,#F3F6FA,#B8C8DE 50%,#5A6F93)',
pamukkale:'linear-gradient(160deg,#F7F8FA,#CFE3EE 45%,#79A9C6)',aspendos:'linear-gradient(160deg,#3A2F66,#8A4F7A 55%,#E0A060)',harbiye:'linear-gradient(160deg,#1C2640,#3A5F8A 55%,#9CC0DC)',
caz:'linear-gradient(160deg,#2B2140,#6E4A7E 55%,#D8A66A)',kahve:'linear-gradient(160deg,#E8D3B5,#8A5A3A 55%,#3E2A22)',goreme:'linear-gradient(160deg,#F0D2A8,#C08050 50%,#6D5C84)',
sealight:'linear-gradient(160deg,#9CD9EE,#2E8CB8 50%,#E7D7B0)',kordon:'linear-gradient(160deg,#9CC8E0,#3F86A8 50%,#E8D9B5)',termal:'linear-gradient(160deg,#DCEBEF,#7FB3BF 50%,#4E6E86)',
batum:'linear-gradient(160deg,#BFD9E8,#4F7FA8 50%,#2F4F4A)',midilli:'linear-gradient(160deg,#F2E6C8,#6FB3C9 50%,#2E6F8E)',balkan:'linear-gradient(160deg,#D9E3C8,#7C9A6A 45%,#5A4A3A)',
dubai:'linear-gradient(160deg,#F6DDB0,#D39A55 45%,#5B6E9A)',italya:'linear-gradient(160deg,#F1D9B8,#C0704A 50%,#5C7A5A)',ispanya:'linear-gradient(160deg,#F7D98A,#D0603A 50%,#7A3A4A)',fransa:'linear-gradient(160deg,#E4E8F2,#8FA3C8 45%,#4A4F7A)',
ayder:'linear-gradient(160deg,#CFE6C2,#5E9A6A 50%,#3B5C70)',kaleici:'linear-gradient(160deg,#F2D7AE,#B5683F 50%,#4A3A5A)',dagevi:'linear-gradient(160deg,#F4EEE6,#B99A7E 50%,#4B3E56)',
akustik:'linear-gradient(160deg,#2A2446,#5B4A8E 55%,#E0B070)',masukiye:'linear-gradient(160deg,#D5E8B8,#5F9A54 50%,#2F5A4E)'};

/* Puanlar örnek katalogdaki 5'lik ortalamaların 10'luğa çevrilmiş hali; kalkış ve etkinlik tarihleri örnek.
   Yorum sayısı olmayan üründe puan gösterilmiyor, "Yeni" yazıyor. */
export const ITEMS=[
 {k:'Aktivite',b:'saat',t:'İstanbul Boğaz Turu',a:'Eminönü, İstanbul',facts:['2 saat','Standart paket'],p:650,g:'bogaz'},
 {k:'Mekân',b:'saat',t:'Kordon Spa & Masaj',a:'Alsancak, İzmir',facts:['Klasik masaj · 60 dk','Randevulu'],p:1200,s:9.5,c:346,g:'termal',u:'seans'},
 {k:'Etkinlik',b:'saat',t:'Kordon Caz Akşamları',cat:'Caz',a:'Kordon Açıkhava, İzmir',facts:['Cmt 3 Eki · 20:00','Genel giriş'],p:480,s:9.4,c:120,g:'caz',u:'bilet'},
 {k:'Aktivite',b:'saat',t:'Ölüdeniz Yamaç Paraşütü',a:'Fethiye, Muğla',facts:['20 dk uçuş','Tandem'],p:1450,s:9.8,c:1200,g:'parasut'},
 {k:'Etkinlik',b:'saat',t:'Stand Up Gecesi',cat:'Stand up',a:'Jolly Joker, Ankara',facts:['Cum 2 Eki · 21:30','Genel giriş'],p:420,g:'harbiye',u:'bilet'},
 {k:'Aktivite',b:'saat',t:'Uludağ Kayak Dersi',a:'Uludağ, Bursa',facts:['2 saat','Özel ders'],p:750,s:9.0,c:330,g:'kayak'},
 {k:'Tur',b:'gun',t:'Efes ve Şirince Turu',a:'İzmir çıkışlı · rehberli',info:'Günübirlik',p:1290,old:1690,s:9.6,c:1200,g:'efes',dates:[['Per','1 Eki'],['Cmt','3 Eki'],['Paz','4 Eki']],more:'+12'},
 {k:'Mekân',b:'gun',t:'Kum Beach Club',a:'Alaçatı, Çeşme',facts:['Tam gün','Şezlong · 2 kişi'],p:1500,s:9.3,c:824,g:'bodrum',u:'min. harcama'},
 {k:'Aktivite',b:'gun',t:'Bodrum Tekne Turu',a:'Bodrum, Muğla',facts:['6 saat','Kalkış 10:30'],p:1150,g:'ege'},
 {k:'Etkinlik',b:'gun',t:'Çeşme Yaz Festivali',cat:'Festival',a:'Alaçatı Sahil, İzmir',facts:['Cmt 3 Eki · tüm gün','Günlük bilet'],p:650,s:9.2,c:310,g:'aspendos',u:'bilet'},
 {k:'Tur',b:'gun',t:'Sapanca ve Maşukiye Turu',a:'İstanbul çıkışlı · 07:30',info:'Günübirlik',tr:'otobus',p:780,s:9.2,c:75,g:'sapanca',dates:[['Cmt','3 Eki'],['Cmt','10 Eki'],['Cmt','17 Eki']],more:'+9'},
 {k:'Aktivite',b:'gun',t:'Köprülü Kanyon Rafting',a:'Manavgat, Antalya',facts:['Yarım gün','Standart paket'],p:850,s:9.6,c:440,g:'rafting'},
 {k:'Tur',b:'gun',t:'Pamukkale ve Hierapolis',a:'İzmir çıkışlı · 12 saat',info:'Günübirlik',p:1890,g:'pamukkale',dates:[['Cmt','3 Eki'],['Çar','7 Eki'],['Cmt','10 Eki']],more:'+14'},
 {k:'Tur',b:'hs',t:'Ege Adaları Balayı Kaçamağı',a:'Sakız Adası · İzmir çıkışlı',info:'2 gece 3 gün',tr:'feribot',visa:'Kapıda vize',abroad:1,reg:'avrupa',p:7450,s:9.8,c:288,g:'ege',dates:[['Cum','2 Eki'],['Cum','9 Eki'],['Cum','16 Eki']],more:'+4'},
 {k:'Otel',b:'hs',t:'Göreme Mağara Otel',a:'Göreme, Nevşehir',facts:['2 – 4 Eki · 2 gece','Kahvaltı dahil'],p:4900,s:9.4,c:96,g:'goreme',u:'2 gece toplam'},
 {k:'Otel',b:'hs',t:'Sealight Resort',a:'Kemer, Antalya',facts:['2 – 4 Eki · 2 gece','Her şey dahil'],p:4200,s:9.2,c:340,g:'sealight',u:'2 gece toplam'},
 {k:'Tur',b:'hs',t:'Midilli Adası Kaçamağı',a:'Midilli · Ayvalık çıkışlı',info:'2 gece 3 gün',tr:'feribot',visa:'Kapıda vize',abroad:1,reg:'avrupa',p:8450,g:'midilli',dates:[['Cum','9 Eki'],['Cum','16 Eki'],['Cum','23 Eki']],more:'+3',sample:1},
 {k:'Tur',b:'uzun',t:'Batum ve Acara Turu',a:'Batum, Gürcistan · Trabzon çıkışlı',info:'3 gece 4 gün',tr:'otobus',visa:'Kimlikle geçiş',abroad:1,reg:'kafkas',p:6900,g:'batum',dates:[['Per','8 Eki'],['Per','15 Eki'],['Per','22 Eki']],more:'+5',sample:1},
 {k:'Tur',b:'uzun',t:'Balkanlar: Saraybosna ve Mostar',a:'Bosna-Hersek · İstanbul çıkışlı',info:'4 gece 5 gün',tr:'ucak',visa:'Vizesiz',abroad:1,reg:'avrupa',p:18900,g:'balkan',dates:[['Pzt','12 Eki'],['Pzt','26 Eki'],['Pzt','9 Kas']],more:'+2',sample:1},
 {k:'Tur',b:'uzun',t:'Dubai Turu',a:'Birleşik Arap Emirlikleri · İstanbul çıkışlı',info:'4 gece 5 gün',tr:'ucak',visa:'E-vize',visaReq:1,abroad:1,reg:'uzak',p:32900,g:'dubai',dates:[['Per','15 Eki'],['Per','29 Eki'],['Per','12 Kas']],more:'+6',sample:1},
 {k:'Tur',b:'uzun',t:'İtalya: Roma, Floransa ve Venedik',a:'İtalya · İstanbul çıkışlı',info:'5 gece 6 gün',tr:'ucak',visa:'Schengen vizesi',visaReq:1,abroad:1,reg:'avrupa',p:39900,g:'italya',dates:[['Cmt','17 Eki'],['Cmt','31 Eki'],['Cmt','14 Kas']],more:'+4',sample:1},
 {k:'Tur',b:'uzun',t:'İspanya: Barselona ve Madrid',a:'İspanya · İstanbul çıkışlı',info:'5 gece 6 gün',tr:'ucak',visa:'Schengen vizesi',visaReq:1,abroad:1,reg:'avrupa',p:41500,g:'ispanya',dates:[['Paz','18 Eki'],['Paz','1 Kas'],['Paz','15 Kas']],more:'+3',sample:1},
 {k:'Tur',b:'uzun',t:'Fransa: Paris ve Loire Şatoları',a:'Fransa · İstanbul çıkışlı',info:'4 gece 5 gün',tr:'ucak',visa:'Schengen vizesi',visaReq:1,abroad:1,reg:'avrupa',p:36750,g:'fransa',dates:[['Cum','23 Eki'],['Cum','6 Kas'],['Cum','20 Kas']],more:'+4',sample:1},
 {k:'Tur',b:'uzun',t:'Kapadokya Turu',a:'Göreme · İstanbul, İzmir, Ankara çıkışlı',info:'3 gece 4 gün',tr:'ucak',p:8990,old:10900,s:9.4,c:974,g:'kapadokya',dates:[['Pzt','5 Eki'],['Cum','9 Eki'],['Pzt','12 Eki']],more:'+8'},
 {k:'Tur',b:'uzun',t:'Karadeniz Yaylaları Turu',a:'Ayder, Rize · İstanbul çıkışlı',info:'4 gece 5 gün',tr:'ucak',p:12500,g:'karadeniz',dates:[['Paz','11 Eki'],['Paz','18 Eki'],['Paz','25 Eki']],more:'+6'},
 {k:'Tur',b:'uzun',t:'Turistik Doğu Ekspresi',a:'Kars · Ankara çıkışlı',info:'5 gece 6 gün',tr:'tren',p:9750,s:9.2,c:450,g:'dogu',dates:[['Sal','20 Eki'],['Sal','3 Kas'],['Sal','17 Kas']],more:'+5'},
 {k:'Tur',b:'uzun',t:'Erciyes Kayak Haftası',a:'Kayseri · İstanbul çıkışlı',info:'4 gece 5 gün',tr:'ucak',p:6400,s:9.2,c:140,g:'erciyes',dates:[['Paz','11 Eki'],['Paz','18 Eki'],['Paz','25 Eki']],more:'+2'}
];
/* Ne kadar molan var? [adres anahtarı, seçenek, liste başlığı] */
export const BUCKETS=[['saat','Birkaç saat','Birkaç saate sığanlar'],['gun','Bir gün','Bir güne sığanlar'],['hs','Hafta sonu','Hafta sonuna sığanlar'],['uzun','4 gün +','Uzun molalar']];
export const PL={Tur:'Turlar',Otel:'Oteller',Etkinlik:'Etkinlikler',Aktivite:'Aktiviteler','Mekân':'Mekânlar'};

/* Bölümler: etkinlik, otel, mekân */
export const EV=[['CUM','2','Konser','Harbiye Açıkhava Konserleri','21:00 · Harbiye, İstanbul',890,'harbiye'],
 ['CMT','3','Opera · Bale','Aspendos Opera ve Bale Festivali','20:30 · Aspendos, Antalya',420,'aspendos'],
 ['CMT','3','Caz','Kordon Caz Akşamları','20:00 · Alsancak, İzmir',480,'caz'],
 ['PAZ','4','Festival','İstanbul Kahve Festivali','11:00 · Maçka, İstanbul',290,'kahve']];
export const HT=[['★★★★★','Göreme Mağara Otel','Göreme, Nevşehir · Tarihi doku',9.4,96,'Kahvaltı dahil',2450,'goreme'],
 ['★★★★★','Sealight Resort','Kemer, Antalya · Denize sıfır',9.2,340,'Her şey dahil',2100,'sealight'],
 ['★★★★','Kordon Butik Otel','Alsancak, İzmir · Denize 120 m',8.9,214,'Kahvaltı dahil',1989,'kordon'],
 ['★★★★','Termal Vadi Resort','Termal, Yalova · Termal havuz',0,0,'Kahvaltı dahil',1590,'termal'],
 ['★★★','Ayder Yayla Evi','Ayder, Rize · Yayla manzarası',9.3,182,'Kahvaltı dahil',1450,'ayder']];
export const VN=[{t:'Kordon Spa & Masaj',a:'Alsancak, İzmir · Masaj salonu',s:9.5,c:346,g:'termal',mode:'Randevulu',opts:[['Klasik masaj · 60 dk',1200],['Sıcak taş · 75 dk',1650]]},
 {t:'Kum Beach Club',a:'Alaçatı, Çeşme · Plaj kulübü',s:9.3,c:824,g:'bodrum',mode:'Masa ve şezlong',opts:[['Şezlong · 2 kişi',1500],['Sedir · 4 kişi',3000],['Loca · 8 kişi',9000]]},
 {t:'Maşukiye Dere Evi',a:'Maşukiye, Sapanca · Dere kenarında kahvaltı',s:9.1,c:412,g:'masukiye',mode:'Masa rezervasyonu',slots:['09:00','10:30','12:00','14:00'],opts:[['Serpme kahvaltı',650],['Mangal menüsü',950]]},
 {t:'Kaleiçi Konak Restoran',a:'Kaleiçi, Antalya · Tarihi konakta akşam yemeği',s:9.4,c:268,g:'kaleici',mode:'Masa rezervasyonu',slots:['19:00','21:00'],opts:[['Akşam menüsü',1350],['Şarap eşleşmeli menü',1950]]},
 {t:'Erciyes Dağ Evi',a:'Erciyes, Kayseri · Şömineli dağ evi',s:9.0,c:154,g:'dagevi',mode:'Masa rezervasyonu',slots:['10:00','13:00','19:00'],opts:[['Fondü menüsü',900],['Dağ kahvaltısı',550]]},
 {t:'Kadıköy Akustik Sahne',a:'Kadıköy, İstanbul · Canlı müzik ve bar',s:9.2,c:530,g:'akustik',mode:'Masa rezervasyonu',u:'min. harcama',opts:[['Masa · 2 kişi',900],['Loca · 6 kişi',3600]]}];

/* Yurt dışı bölümünün sırası */
export const ABO=['Ege Adaları Balayı Kaçamağı','İtalya: Roma, Floransa ve Venedik','Dubai Turu','Balkanlar: Saraybosna ve Mostar','İspanya: Barselona ve Madrid','Midilli Adası Kaçamağı','Fransa: Paris ve Loire Şatoları','Batum ve Acara Turu'];

/* Arama kutusu: sekmeye göre alan adları */

/* Tam ekran menü: ürün türleri */
export const MENU=[['Turlar','tur','Günübirlik, hafta sonu, uzun'],['Oteller','otel','Butik, termal, resort'],
 ['Etkinlikler','etkinlik','Konser, festival, sahne'],['Aktiviteler','aktivite','Rafting, paraşüt, tekne'],
 ['Mekânlar','mekan','Spa, beach club'],['Fırsatlar','firsat','Kampanyalar']];

/* Güven şeridi açıklamaları */
export const TRUST={iptal:['Ücretsiz iptal','Çoğu tur, otel, etkinlik ve aktivitede belirli bir tarihe kadar ücretsiz iptal edebilirsin. Son iptal tarihi ürün sayfasında ve ödeme adımında yazar.'],
 taksit:['3 taksit, vade farksız','Anlaşmalı kredi kartlarıyla 3 taksite kadar vade farkı yok. Kartına göre diğer taksit seçenekleri ödeme adımında listelenir.'],
 kapora:['%20 kaporayla yer ayırt','Turlarda tutarın %20\'sini ödeyip yerini ayırtırsın, kalanını kalkıştan önce ödersin. Örneğin 8.990 TL\'lik Kapadokya turunda 1.798 TL.'],
 puan:['Molapuan · her rezervasyonda kazan','Her rezervasyonda puan kazanırsın; 1 puan = 1 TL olarak sonraki rezervasyonunda kullanılır. Gezgin, Kâşif ve Mola Ustası seviyelerinde avantajların artar.']};

/* Kiminle: keşif filtresi (kategori değil). Hangi ürünün kime uygun olduğu
   ÖRNEK; gerçekte işletme ve değerlendirmelerden gelecek. */
export const WITH=[['yalniz','Tek başıma'],['sevgili','Sevgilimle'],['arkadas','Arkadaşlarla'],['aile','Ailemle'],['cocuk','Çocuklarla'],['is','İş arkadaşlarımla']];
export const KIMLE={'İstanbul Boğaz Turu':'yalniz sevgili arkadas aile cocuk is','Kordon Spa & Masaj':'yalniz sevgili','Kordon Caz Akşamları':'yalniz sevgili arkadas is',
 'Ölüdeniz Yamaç Paraşütü':'yalniz sevgili arkadas','Stand Up Gecesi':'sevgili arkadas is','Uludağ Kayak Dersi':'yalniz arkadas aile cocuk','Efes ve Şirince Turu':'yalniz sevgili arkadas aile',
 'Kum Beach Club':'sevgili arkadas is','Bodrum Tekne Turu':'arkadas aile cocuk is','Çeşme Yaz Festivali':'sevgili arkadas','Sapanca ve Maşukiye Turu':'sevgili aile cocuk is',
 'Köprülü Kanyon Rafting':'arkadas is','Pamukkale ve Hierapolis':'yalniz sevgili aile cocuk','Ege Adaları Balayı Kaçamağı':'sevgili','Göreme Mağara Otel':'sevgili',
 'Sealight Resort':'sevgili aile cocuk is','Midilli Adası Kaçamağı':'sevgili arkadas','Batum ve Acara Turu':'yalniz arkadas','Balkanlar: Saraybosna ve Mostar':'yalniz sevgili arkadas',
 'Dubai Turu':'sevgili aile cocuk','İtalya: Roma, Floransa ve Venedik':'yalniz sevgili','İspanya: Barselona ve Madrid':'sevgili arkadas','Fransa: Paris ve Loire Şatoları':'sevgili',
 'Kapadokya Turu':'sevgili aile is','Karadeniz Yaylaları Turu':'yalniz arkadas aile','Turistik Doğu Ekspresi':'yalniz sevgili arkadas','Erciyes Kayak Haftası':'arkadas aile cocuk',
 'Harbiye Açıkhava Konserleri':'yalniz sevgili arkadas','Aspendos Opera ve Bale Festivali':'sevgili aile','İstanbul Kahve Festivali':'yalniz arkadas',
 'Kordon Butik Otel':'yalniz sevgili is','Termal Vadi Resort':'sevgili aile cocuk is','Ayder Yayla Evi':'yalniz sevgili arkadas aile',
 'Maşukiye Dere Evi':'sevgili arkadas aile cocuk','Kaleiçi Konak Restoran':'sevgili arkadas aile is','Erciyes Dağ Evi':'sevgili arkadas aile','Kadıköy Akustik Sahne':'yalniz sevgili arkadas is'};

/* Temalar: tür karışık koleksiyonlar (kategori de filtre de değil). Hangi
   ürünün hangi temada olduğu ÖRNEK. [adres anahtarı, ad, renk geçişi,
   ürünler, tema sayfasının iki cümlelik girişi] */
export const THEMES=[
 ['doga','Doğa ve yayla','linear-gradient(160deg,#9CC38A,#3E7A55 55%,#27465E)',['Sapanca ve Maşukiye Turu','Ayder Yayla Evi','Köprülü Kanyon Rafting','Maşukiye Dere Evi','Karadeniz Yaylaları Turu','Pamukkale ve Hierapolis','Ölüdeniz Yamaç Paraşütü','Göreme Mağara Otel','Turistik Doğu Ekspresi'],'Şehrin gürültüsünden uzak yaylalar, dereler ve kanyonlar. Günübirlik kaçamaktan yayla evinde birkaç güne kadar, doğada geçen molalar.'],
 ['deniz','Deniz ve tekne','linear-gradient(160deg,#8FD0E6,#2E86B0 55%,#1C3F70)',['Bodrum Tekne Turu','Sealight Resort','Kum Beach Club','Ege Adaları Balayı Kaçamağı','Çeşme Yaz Festivali','İstanbul Boğaz Turu','Kordon Butik Otel','Midilli Adası Kaçamağı'],'Ege ve Akdeniz\'in koyları, tekne turları ve deniz kenarında konaklama. Güne denizde başlayıp gün batımını sahilde bitirenler için.'],
 ['kultur','Kültür ve tarih','linear-gradient(160deg,#E6C99A,#B0764A 55%,#5A4A6E)',['Efes ve Şirince Turu','Aspendos Opera ve Bale Festivali','Göreme Mağara Otel','Kaleiçi Konak Restoran','İstanbul Boğaz Turu','Kapadokya Turu','Pamukkale ve Hierapolis','Balkanlar: Saraybosna ve Mostar','İtalya: Roma, Floransa ve Venedik','Fransa: Paris ve Loire Şatoları','İspanya: Barselona ve Madrid'],'Antik kentler, tarihi konaklar ve rehberli turlar. Gezdiğin yerin hikâyesini dinleyerek yaşamak isteyenler için.'],
 ['kis','Kış ve kayak','linear-gradient(160deg,#E9EEF5,#9DB2CC 50%,#3F5478)',['Erciyes Kayak Haftası','Uludağ Kayak Dersi','Erciyes Dağ Evi','Ayder Yayla Evi','Termal Vadi Resort','Turistik Doğu Ekspresi'],'Kayak, dağ evleri ve karlı yollar. Pistte geçen bir günden sobalı bir dağ evindeki uzun akşamlara kadar.'],
 ['termal','Termal ve spa','linear-gradient(160deg,#DCEBEF,#7FB3BF 50%,#4E6E86)',['Termal Vadi Resort','Kordon Spa & Masaj','Pamukkale ve Hierapolis','Sealight Resort'],'Termal sular, spa ve masaj. Yorgunluğu atmak için yavaş geçen bir gün ya da birkaç gecelik dinlenme.'],
 ['macera','Macera ve spor','linear-gradient(160deg,#BFE6F2,#43A7CF 50%,#2E7D5B)',['Ölüdeniz Yamaç Paraşütü','Köprülü Kanyon Rafting','Ayder Yayla Evi','Uludağ Kayak Dersi','Karadeniz Yaylaları Turu','Erciyes Kayak Haftası','Erciyes Dağ Evi','Turistik Doğu Ekspresi'],'Yamaç paraşütü, rafting ve yayla yürüyüşleri. Hafta sonunu hareket ederek geçirmek isteyenler için.'],
 ['festival','Konser ve festival','linear-gradient(160deg,#2B2140,#6E4A7E 55%,#D8A66A)',['Harbiye Açıkhava Konserleri','Kadıköy Akustik Sahne','Kordon Caz Akşamları','Kordon Butik Otel','Çeşme Yaz Festivali','Kum Beach Club','İstanbul Kahve Festivali'],'Açıkhava konserleri, caz geceleri ve festivaller. Müziği canlı dinlemek, kalabalığın enerjisine karışmak isteyenler için.'],
 ['sahne','Sahne ve gösteri','linear-gradient(160deg,#3A2F66,#8A4F7A 55%,#E0A060)',['Stand Up Gecesi','Kadıköy Akustik Sahne','Aspendos Opera ve Bale Festivali','Harbiye Açıkhava Konserleri'],'Stand up, opera, bale ve küçük sahnelerde akustik geceler. Bir akşamı sahnenin önünde geçirmek isteyenler için.'],
 ['lezzet','Yeme içme','linear-gradient(160deg,#E8D3B5,#8A5A3A 55%,#3E2A22)',['Kaleiçi Konak Restoran','İstanbul Kahve Festivali','Efes ve Şirince Turu','Maşukiye Dere Evi','Bodrum Tekne Turu','Erciyes Dağ Evi','Kum Beach Club'],'Serpme kahvaltıdan konak sofralarına, kahve festivalinden teknede ızgara balığa. Gittiği yeri tadıyla hatırlayanlar için.'],
 ['balayi','Balayı','linear-gradient(160deg,#F3C9C0,#C0707A 55%,#5A3F6E)',['Ege Adaları Balayı Kaçamağı','Göreme Mağara Otel','Kordon Spa & Masaj','Kordon Caz Akşamları','İstanbul Boğaz Turu','Kaleiçi Konak Restoran','Kapadokya Turu','Kordon Butik Otel','İtalya: Roma, Floransa ve Venedik','Sealight Resort'],'Mağara otelleri, ada kaçamakları ve baş başa akşamlar. İkiniz için sakin ve özenli molalar.'],
 ['gece','Gece hayatı','linear-gradient(160deg,#1C2640,#3A3F8A 55%,#C06AA0)',['Kadıköy Akustik Sahne','Stand Up Gecesi','Kum Beach Club','Kordon Caz Akşamları','Kaleiçi Konak Restoran','Harbiye Açıkhava Konserleri'],'Akustik sahneler, stand up, beach club ve caz. Gün bittiğinde başlayan planlar için.']];

/* Bağlan: ÖRNEK paylaşımlar. Kullanıcılar ve metinler uydurma; her paylaşım
   Mola360'daki bir ürüne (ürün adıyla) bağlı. "gitti": paylaşan kişi bu
   deneyimi Mola360'tan rezerve edip yaşamış (doğrulanmış katılımcı).
   "img": paylaşımın fotoğrafı (v2/img/ altında; yoksa renk geçişi).
   "g2": paylaşımdaki öteki görsellerin renk geçişleri; her paylaşımda en
   az 2 görsel olur. */
export const USERS={
 deniz:{ad:'Deniz Aksoy',kul:'deniz.yolda',ini:'DA',renk:'#3A6FA5'},
 selin:{ad:'Selin ve Can',kul:'selinilecan',ini:'SC',renk:'#8C5A34'},
 mert:{ad:'Mert Kaya',kul:'mertkampta',ini:'MK',renk:'#3E7A55'},
 elif:{ad:'Elif Demir',kul:'elif.mola',ini:'ED',renk:'#8A4F7A'},
 kaan:{ad:'Kaan Öztürk',kul:'kaanrota',ini:'KÖ',renk:'#216B64'},
 zeynep:{ad:'Zeynep Arslan',kul:'zeynepgezer',ini:'ZA',renk:'#9A4F2E'},
 burak:{ad:'Burak Şen',kul:'burakdalista',ini:'BŞ',renk:'#2F5D8A'},
 ceren:{ad:'Ceren Yıldız',kul:'cerenkacamak',ini:'CY',renk:'#7A4E8C'},
 ozan:{ad:'Ozan Er',kul:'ozanpatika',ini:'OE',renk:'#4D7A3A'},
 irem:{ad:'İrem Koç',kul:'iremvebavul',ini:'İK',renk:'#A0573A'}};
/* Başkalarının profili: şehir, kısa tanıtım, takipçi, takip */
export const PROFIL={
 deniz:['Ankara','Tarih ve müze turlarının peşinde. Her şehirde bir rehber arkadaşım var.',842,213],
 selin:['İstanbul','İki kişilik kaçamaklar, erken kalkılan sabahlar.',1240,310],
 mert:['Fethiye','Yamaç paraşütü, tekne, kamp. Hafta sonu evde durmam.',2310,402],
 elif:['İzmir','Caz, Kordon ve iyi yemek. Akşam planı lazımsa bana sor.',968,355],
 kaan:['Antalya','Arkadaş grubuyla doğa ve macera.',611,248],
 zeynep:['Kocaeli','İki çocuk, bir bavul. Aile dostu oteller ve yaylalar.',1530,190],
 burak:['İzmir','İzmir ve çevresinde ne yapılır, hepsini denedim.',734,288],
 ceren:['Bursa','Kısa kaçamaklar, uzun yürüyüşler.',512,301],
 ozan:['Trabzon','Patikalar, yaylalar, çadır.',689,144],
 irem:['İstanbul','Konser, festival, şehir kaçamağı.',455,276]};
/* Paylaşım sayfasındaki yorumlar: kişi, yorum, ne zaman */
/* paylaşım sahibinin ilk yoruma yanıtı (yorumlarda "Yanıtları gör") */
export const YANITLAR=['Kesinlikle öneririm, rehberimiz çok ilgiliydi.','Teşekkürler! Bir dahakine birlikte gidelim.','Sabah erken çıkın, kalabalık olmuyor.','Çok keyifliydi, fiyatına da değdi.'];
export const YORUMLAR=[
 ['deniz','Fotoğraflar harika! Hangi ayda gittiniz?','2 sa'],['elif','Listeme ekledim, bu yaz mutlaka.','5 sa'],
 ['kaan','Rehber kimdi? Biz de aynı turu düşünüyoruz.','1 g'],['zeynep','Çocukla gitmeye uygun mu sizce?','1 g'],
 ['mert','Bir daha gidersen haber ver, biz de gelelim.','2 g'],['selin','Gün doğumu ayrı güzel olmuş.','3 g'],
 ['burak','Fiyat/performans nasıldı?','3 g'],['ceren','Kıskandım resmen 😍','4 g']];
/* Haftanın gezgini: geçen haftanın etkileşim toplamı (beğeni + yorum + kayıt + paylaşım) en yüksek paylaşımı.
   Paylaşımlardaki kay/pay geçen haftanın kayıt ve paylaşım sayısı. Kazanan HAFTA.puan Molapuan alır. */
export const HAFTA={puan:250};
/* Bağlan'da "Yeni insanlar keşfet": kişi, neden önerildiği, Mola360 ile gitti mi */
export const ONERI=[
 ['ceren','Senin gibi Kapadokya\'ya gitti',1],['burak','İzmir\'de · 14 deneyim',1],['zeynep','elif.mola takip ediyor',0],
 ['ozan','Doğa yürüyüşleri paylaşıyor',1],['irem','Kordon Caz Akşamları\'na gitti',1],['kaan','deniz.yolda takip ediyor',0]];
export const POSTS=[
 {u:'selin',yer:'Göreme, Nevşehir',ne:'2 gün önce',g:'kapadokya',g2:['goreme','dagevi'],urun:'Kapadokya Turu',gitti:1,kay:97,pay:30,
  metin:'Gün doğumunda balonlar havalanırken terastaydık. Hayatımın en güzel sabahlarından biri.',beg:248,yor:31},
 {u:'mert',yer:'Fethiye, Muğla',ne:'5 saat önce',g:'parasut',g2:['ege'],urun:'Ölüdeniz Yamaç Paraşütü',gitti:1,kay:186,pay:64,
  metin:'Babadağ\'dan atladık, 20 dakika boyunca altımızda Ölüdeniz. Korkuyordum, bir daha yaparım.',beg:412,yor:58},
 {u:'elif',yer:'Alsancak, İzmir',ne:'Dün',g:'caz',g2:['kordon'],urun:'Kordon Caz Akşamları',gitti:1,
  metin:'Kordon\'da gün batımı ve canlı caz. İzmir\'de cumartesi akşamı için daha iyisi yok.',beg:96,yor:12},
 {u:'deniz',yer:'Selçuk, İzmir',ne:'3 gün önce',g:'efes',g2:['aspendos'],urun:'Efes ve Şirince Turu',gitti:1,
  metin:'Rehberimiz Celsus Kütüphanesi\'ni öyle anlattı ki bir saat ayrılamadık. Şirince şarabı da bonus.',beg:173,yor:19},
 {u:'kaan',yer:'Manavgat, Antalya',ne:'1 hafta önce',g:'rafting',g2:['sapanca'],urun:'Köprülü Kanyon Rafting',gitti:0,
  metin:'Arkadaş grubuyla rafting, sonra nehir kenarında alabalık. Hafta sonu için birebir.',beg:134,yor:22},
 {u:'zeynep',yer:'Kemer, Antalya',ne:'4 gün önce',g:'sealight',g2:['ege'],urun:'Sealight Resort',gitti:1,
  metin:'Ekim\'de deniz hâlâ sıcak. Çocuklar havuzdan, biz plajdan çıkmadık.',beg:88,yor:9},
 {u:'kaan',yer:'Göreme, Nevşehir',ne:'1 hafta önce',g:'goreme',g2:['kapadokya'],urun:'Kapadokya Turu',gitti:1,
  metin:'Balonlar kalkmadan vadide yürüdük, rehber her kayanın hikâyesini biliyordu. İki gün az bile geldi.',beg:157,yor:14},
 {u:'zeynep',yer:'Ayder, Rize',ne:'2 gün önce',g:'ayder',g2:['karadeniz'],urun:'Ayder Yayla Evi',gitti:1,
  metin:'Sabah sis, öğlen güneş, akşam sobada mısır ekmeği. Telefonu çantadan hiç çıkarmadık.',beg:121,yor:16},
 {u:'mert',yer:'Bodrum, Muğla',ne:'3 gün önce',g:'ege',g2:['bodrum'],urun:'Bodrum Tekne Turu',gitti:1,
  metin:'Dört koy, iki yüzme molası, teknede ızgara balık. Akşama tuzlu ve mutlu döndük.',beg:203,yor:21},
 {u:'elif',yer:'Kaleiçi, Antalya',ne:'6 gün önce',g:'kaleici',g2:['kahve'],urun:'Kaleiçi Konak Restoran',gitti:0,
  metin:'Avluda yemek, sonra dar sokaklarda yürüyüş. Doğum günü için güzel bir akşamdı.',beg:64,yor:7},
 {u:'selin',yer:'Maşukiye, Sakarya',ne:'Dün',g:'masukiye',g2:['sapanca'],urun:'Maşukiye Dere Evi',gitti:1,
  metin:'Dere kenarında serpme kahvaltı, sonra göl kıyısında kısa bir yürüyüş. Pazar sabahı için tam kıvamında.',beg:77,yor:8},
 {u:'deniz',yer:'Kavaklıdere, Ankara',ne:'3 hafta önce',g:'harbiye',g2:['akustik'],urun:'Stand Up Gecesi',gitti:0,
  metin:'Geçen ayki gösteriye gittik, salon kahkahadan yıkıldı. Bu cuma yine oradayız.',beg:58,yor:6},
 {u:'ceren',yer:'Uçhisar, Nevşehir',ne:'5 gün önce',g:'kapadokya',g2:['goreme'],urun:'Kapadokya Turu',gitti:1,
  metin:'İlk kez balon izledim, hava soğuktu ama değdi. Akşam çömlek atölyesi de çok tatlıydı.',beg:91,yor:6},
 {u:'burak',yer:'Alsancak, İzmir',ne:'2 gün önce',g:'kordon',g2:['caz'],urun:'Kordon Spa & Masaj',gitti:1,
  metin:'Haftanın yorgunluğunu bir saatte attım. Çıkışta Kordon\'da yürüyüş şart.',beg:58,yor:4},
 {u:'ozan',yer:'Uzungöl, Trabzon',ne:'1 hafta önce',g:'karadeniz',g2:['ayder'],urun:'Karadeniz Yaylaları Turu',gitti:1,
  metin:'Üç yayla, bir sürü sis ve en güzel muhlama. Rehberimiz her patikayı biliyordu.',beg:146,yor:11},
 {u:'irem',yer:'Alsancak, İzmir',ne:'4 gün önce',g:'caz',g2:['kordon'],urun:'Kordon Caz Akşamları',gitti:1,
  metin:'Sahneye bu kadar yakın oturunca caz bambaşka. Bir dahaki ay yine geliyorum.',beg:67,yor:5}
];

/* Yerler: arama önerileri için. Bir ürün, adında ya da yerinde (kalkış
   şehri sayılmaz) bu adlardan biri geçiyorsa o yerdedir. Liste ÖRNEK;
   gerçekte ürünün konum verisinden gelecek. [adres anahtarı, ad, alt satır, eş adlar] */
export const DESTS=[
 ['istanbul','İstanbul','Marmara',['İstanbul','Eminönü','Harbiye','Maçka','Kadıköy']],
 ['izmir','İzmir','Ege · Alsancak, Çeşme, Efes',['İzmir','Alsancak','Çeşme','Alaçatı','Efes','Şirince']],
 ['kapadokya','Kapadokya','Nevşehir · Göreme',['Kapadokya','Göreme','Nevşehir']],
 ['antalya','Antalya','Akdeniz · Kemer, Kaleiçi',['Antalya','Kemer','Manavgat','Aspendos','Kaleiçi']],
 ['mugla','Muğla','Ege · Bodrum, Fethiye',['Muğla','Bodrum','Fethiye','Ölüdeniz']],
 ['pamukkale','Pamukkale','Denizli',['Pamukkale','Hierapolis','Denizli']],
 ['sapanca','Sapanca','Sakarya · Maşukiye',['Sapanca','Maşukiye']],
 ['bursa','Bursa','Uludağ',['Bursa','Uludağ']],
 ['yalova','Yalova','Marmara · termal',['Yalova']],
 ['ankara','Ankara','İç Anadolu',['Ankara']],
 ['kayseri','Kayseri','İç Anadolu · Erciyes',['Kayseri','Erciyes']],
 ['karadeniz','Karadeniz','Rize · Ayder',['Karadeniz','Rize','Ayder']],
 ['kars','Kars','Doğu Anadolu',['Kars','Doğu Ekspresi']],
 ['yunan-adalari','Yunan adaları','Yurt dışı · Sakız, Midilli',['Sakız','Midilli']],
 ['gurcistan','Gürcistan','Yurt dışı · Batum',['Gürcistan','Batum']],
 ['balkanlar','Balkanlar','Yurt dışı · Saraybosna, Mostar',['Balkanlar','Bosna','Saraybosna']],
 ['dubai','Dubai','Yurt dışı · Birleşik Arap Emirlikleri',['Dubai']],
 ['italya','İtalya','Yurt dışı · Roma, Floransa, Venedik',['İtalya']],
 ['ispanya','İspanya','Yurt dışı · Barselona, Madrid',['İspanya']],
 ['fransa','Fransa','Yurt dışı · Paris, Loire',['Fransa']]];

/* Popüler aramalar: sekmeye göre. ÖRNEK; gerçekte arama verisinden gelecek.
   Yer adıysa yer seçilir, değilse metinle aranır; sonucu olmayan gösterilmez. */
export const POP={tur:['Kapadokya','Karadeniz','Yunan adaları','Balkanlar','Dubai','İtalya','Pamukkale'],
 otel:['Antalya','Kapadokya','İzmir','Termal','Karadeniz','Butik'],
 etkinlik:['İstanbul','İzmir','Konser','Festival','Stand up'],
 aktivite:['Yamaç paraşütü','Tekne turu','Rafting','Kayak','Boğaz'],
 mekan:['Spa','Beach club','Restoran','Akustik','Dağ evi']};

/* Yakınımda: yer adlarının yaklaşık koordinatları [enlem, boylam]. Ürünün
   konumu adında ya da yerinde geçen ilk addan (özelden genele sıralı).
   ÖRNEK; gerçekte her ürünün kendi konumu olacak. */
export const GEO={'Eminönü':[41.017,28.970],'Harbiye':[41.045,28.988],'Maçka':[41.043,28.993],'Kadıköy':[40.990,29.027],'İstanbul':[41.010,28.980],
 'Alsancak':[38.437,27.143],'Alaçatı':[38.270,26.374],'Çeşme':[38.323,26.303],'Efes':[37.941,27.341],'İzmir':[38.420,27.140],
 'Göreme':[38.643,34.829],'Kapadokya':[38.643,34.829],'Kemer':[36.598,30.560],'Manavgat':[36.787,31.443],'Aspendos':[36.939,31.172],'Kaleiçi':[36.884,30.706],'Antalya':[36.897,30.713],
 'Bodrum':[37.034,27.430],'Fethiye':[36.621,29.116],'Pamukkale':[37.920,29.120],'Maşukiye':[40.700,30.150],'Sapanca':[40.690,30.268],'Uludağ':[40.100,29.130],'Bursa':[40.183,29.067],
 'Termal':[40.609,29.172],'Yalova':[40.655,29.270],'Ankara':[39.920,32.854],'Erciyes':[38.530,35.450],'Kayseri':[38.720,35.480],'Ayder':[40.953,41.100],'Rize':[41.025,40.517],'Kars':[40.601,43.097],
 'Sakız':[38.368,26.136],'Midilli':[39.110,26.555],'Batum':[41.643,41.637],'Saraybosna':[43.856,18.413],'Dubai':[25.205,55.271],'İtalya':[41.903,12.496],'İspanya':[41.390,2.170],'Fransa':[48.857,2.352]};

/* Ne zaman: arama penceresi. Örnek takvim 3 Ekim 2026'da yaşıyor.
   [adres anahtarı, ad, alt satır, başlangıç, bitiş] (ay 0'dan) */
export const WHEN=[
 ['bu-hs','Bu hafta sonu','2 – 4 Ekim',[2026,9,2],[2026,9,4]],
 ['gelecek-hs','Gelecek hafta sonu','9 – 11 Ekim',[2026,9,9],[2026,9,11]],
 ['ekim','Ekim içinde','1 – 31 Ekim',[2026,9,1],[2026,9,31]],
 ['kasim','Kasım içinde','1 – 30 Kasım',[2026,10,1],[2026,10,30]]];

/* ÖRNEK Molapuan durumu, taslak görünümüne göre: [puan, son 24 aydaki rezervasyon].
   Seviye eşikleri (ÖNERİ): Gezgin 1, Kâşif 3, Mola Ustası 6 rezervasyon. */
export const PUAN={guest:[0,0],gezgin:[320,1],kasif:[1240,3]};
export const SEVIYE=[['Gezgin',1,'Puan kazanır','Gezgin\'e','puan kazanmaya başla'],['Kâşif',3,'%10 indirim','Kâşif\'e','%10 indirim kazan'],['Mola Ustası',6,'%15 indirim','Mola Ustası\'na','%15 indirim kazan']];

/* Bağlan hikayeleri: ÖRNEK. Takip edilen kişilerin son 24 saatteki kısa
   anları; her biri Mola360'daki bir ürüne (ürün adıyla) bağlı.
   kare: [görselin renk geçişi (G), kısa yazı]. */
export const HIKAYE=[
 {u:'selin',ne:'18 dk',yer:'Göreme',urun:'Kapadokya Turu',gitti:1,kare:[['kapadokya','Balonlar kalktı, terastayız'],['goreme','Vadide sabah yürüyüşü']]},
 {u:'mert',ne:'1 sa',yer:'Ölüdeniz',urun:'Ölüdeniz Yamaç Paraşütü',gitti:1,kare:[['parasut','Babadağ, kalkışa 5 dakika'],['ege','Altımızda Ölüdeniz']]},
 {u:'elif',ne:'3 sa',yer:'Alsancak',urun:'Kordon Caz Akşamları',gitti:1,kare:[['caz','Kordon\'da ilk set başladı'],['kordon','Gün batımı ve caz']]},
 {u:'zeynep',ne:'6 sa',yer:'Ayder',urun:'Ayder Yayla Evi',gitti:1,kare:[['ayder','Sis kalkıyor, yayla uyanıyor'],['karadeniz','Sobada mısır ekmeği']]},
 {u:'kaan',ne:'9 sa',yer:'Manavgat',urun:'Köprülü Kanyon Rafting',gitti:0,kare:[['rafting','Kanyonda ilk dalga'],['sapanca','Nehir kenarında alabalık']]}];
