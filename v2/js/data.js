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
akustik:'linear-gradient(160deg,#2A2446,#5B4A8E 55%,#E0B070)',masukiye:'linear-gradient(160deg,#D5E8B8,#5F9A54 50%,#2F5A4E)',
alacati:'linear-gradient(160deg,#F4E3C4,#C9A06A 50%,#5E86A6)',
korfez:'linear-gradient(160deg,#BFDDEB,#4C8DB5 50%,#E9C79A)',
kosk:'linear-gradient(160deg,#E7E0C8,#9A9A68 50%,#5C6B4A)',
liman:'linear-gradient(160deg,#CDE7EE,#4E9AB2 50%,#2F4E6A)',
urla:'linear-gradient(160deg,#F2D2A6,#D08A5A 45%,#3F6C8E)',
cesme:'linear-gradient(160deg,#D6EEF3,#3C9BC2 50%,#F0DDB4)',
bag:'linear-gradient(160deg,#D9D2A0,#7E8F4A 45%,#6A3A4E)',
asansor:'linear-gradient(160deg,#F0C9A0,#B9705A 45%,#2E4870)',
senfoni:'linear-gradient(160deg,#1E2238,#4A4E86 55%,#C7A86A)',
sahne:'linear-gradient(160deg,#2A1E3E,#7A3F6E 55%,#E0905A)',
tiyatro:'linear-gradient(160deg,#3A1F2E,#8E3A4A 55%,#E3B070)',
cocuk:'linear-gradient(160deg,#FBE3A8,#F0A35A 50%,#6E8FC8)',
sorf:'linear-gradient(160deg,#CFF0F5,#2FA6C8 50%,#1E5F86)',
kite:'linear-gradient(160deg,#E2F4F8,#53B5D6 45%,#F2C46A)',
foca:'linear-gradient(160deg,#D7ECEE,#5A9EB0 45%,#7A6A5A)',
kemeralti:'linear-gradient(160deg,#F1D6A4,#C27A42 50%,#6A3E3A)',
mutfak:'linear-gradient(160deg,#EAD9B0,#A8734A 50%,#4E5A3A)',
seramik:'linear-gradient(160deg,#EEDCCB,#B8805E 50%,#5A6E7E)',
ebru:'linear-gradient(160deg,#D8E6F4,#6A8EC8 45%,#B05A7A)',
resort:'linear-gradient(160deg,#BFEAF2,#2E9CC0 50%,#E8D5A8)',
sirince:'linear-gradient(160deg,#EAD8B8,#A97A4E 50%,#4E6A52)',
bergama:'linear-gradient(160deg,#EDE3CF,#B49A6A 50%,#6A6E8A)'};

/* Puanlar örnek katalogdaki 5'lik ortalamaların 10'luğa çevrilmiş hali; kalkış ve etkinlik tarihleri örnek.
   Tarihler 1 Ekim 2026 haftası için yazıldı; api.js onları haftanın aynı günlerinde bugüne taşır.
   Yorum sayısı olmayan üründe puan gösterilmiyor, "Yeni" yazıyor.
   Mola360 önce İzmir'de açılır (Bedir 2026-10-07): otel, etkinlik, mekân ve
   aktivitelerin hepsi İzmir'de; turlar İzmir çıkışlı. */
export const ITEMS=[
 {k:'Tur',b:'gun',t:'Efes ve Şirince Turu',a:'İzmir çıkışlı · rehberli',info:'Günübirlik',p:1290,old:1690,s:9.6,c:1200,g:'efes',dates:[['Per','1 Eki'],['Cmt','3 Eki'],['Paz','4 Eki']],more:'+12'},
 {k:'Tur',b:'gun',t:'Pamukkale ve Hierapolis',a:'İzmir çıkışlı · 12 saat',info:'Günübirlik',p:1890,g:'pamukkale',dates:[['Cmt','3 Eki'],['Çar','7 Eki'],['Cmt','10 Eki']],more:'+14'},
 {k:'Tur',b:'gun',t:'Bergama ve Asklepion Turu',a:'İzmir çıkışlı · rehberli',info:'Günübirlik',tr:'otobus',p:1390,s:9.4,c:286,g:'bergama',dates:[['Paz','4 Eki'],['Çar','7 Eki'],['Paz','11 Eki']],more:'+10'},
 {k:'Tur',b:'saat',t:'İzmir Şehir Turu: Kemeraltı ve Kadifekale',a:'Konak, İzmir · rehberli',info:'Yarım gün',p:690,s:9.2,c:198,g:'kemeralti',dates:[['Cmt','3 Eki'],['Paz','4 Eki'],['Cmt','10 Eki']],more:'+12'},
 {k:'Tur',b:'hs',t:'Ege Adaları Balayı Kaçamağı',a:'Sakız Adası · İzmir çıkışlı',info:'2 gece 3 gün',tr:'feribot',visa:'Kapıda vize',abroad:1,p:7450,s:9.8,c:288,g:'ege',dates:[['Cum','2 Eki'],['Cum','9 Eki'],['Cum','16 Eki']],more:'+4'},
 {k:'Tur',b:'hs',t:'Midilli Adası Kaçamağı',a:'Midilli · İzmir çıkışlı',info:'2 gece 3 gün',tr:'feribot',visa:'Kapıda vize',abroad:1,p:8450,g:'midilli',dates:[['Cum','9 Eki'],['Cum','16 Eki'],['Cum','23 Eki']],more:'+3'},
 {k:'Tur',b:'uzun',t:'Kapadokya Turu',a:'Göreme · İzmir çıkışlı',info:'3 gece 4 gün',tr:'ucak',p:8990,old:10900,s:9.4,c:974,g:'kapadokya',dates:[['Pzt','5 Eki'],['Cum','9 Eki'],['Pzt','12 Eki']],more:'+8'},
 {k:'Tur',b:'uzun',t:'Karadeniz Yaylaları Turu',a:'Ayder, Rize · İzmir çıkışlı',info:'4 gece 5 gün',tr:'ucak',p:12500,g:'karadeniz',dates:[['Paz','11 Eki'],['Paz','18 Eki'],['Paz','25 Eki']],more:'+6'},
 {k:'Tur',b:'uzun',t:'Turistik Doğu Ekspresi',a:'Kars · İzmir çıkışlı',info:'5 gece 6 gün',tr:'tren',p:9750,s:9.2,c:450,g:'dogu',dates:[['Sal','20 Eki'],['Sal','3 Kas'],['Sal','17 Kas']],more:'+5'},
 {k:'Tur',b:'uzun',t:'Erciyes Kayak Haftası',a:'Kayseri · İzmir çıkışlı',info:'4 gece 5 gün',tr:'ucak',p:6400,s:9.2,c:140,g:'erciyes',dates:[['Paz','11 Eki'],['Paz','18 Eki'],['Paz','25 Eki']],more:'+2'},
 {k:'Tur',b:'uzun',t:'Balkanlar: Saraybosna ve Mostar',a:'Bosna-Hersek · İzmir çıkışlı',info:'4 gece 5 gün',tr:'ucak',visa:'Vizesiz',abroad:1,p:18900,g:'balkan',dates:[['Pzt','12 Eki'],['Pzt','26 Eki'],['Pzt','9 Kas']],more:'+2'},
 {k:'Tur',b:'uzun',t:'Dubai Turu',a:'Birleşik Arap Emirlikleri · İzmir çıkışlı',info:'4 gece 5 gün',tr:'ucak',visa:'E-vize',visaReq:1,abroad:1,p:32900,g:'dubai',dates:[['Per','15 Eki'],['Per','29 Eki'],['Per','12 Kas']],more:'+6'},
 {k:'Tur',b:'uzun',t:'İtalya: Roma, Floransa ve Venedik',a:'İtalya · İzmir çıkışlı',info:'5 gece 6 gün',tr:'ucak',visa:'Schengen vizesi',visaReq:1,abroad:1,p:39900,g:'italya',dates:[['Cmt','17 Eki'],['Cmt','31 Eki'],['Cmt','14 Kas']],more:'+4'},
 {k:'Tur',b:'uzun',t:'İspanya: Barselona ve Madrid',a:'İspanya · İzmir çıkışlı',info:'5 gece 6 gün',tr:'ucak',visa:'Schengen vizesi',visaReq:1,abroad:1,p:41500,g:'ispanya',dates:[['Paz','18 Eki'],['Paz','1 Kas'],['Paz','15 Kas']],more:'+3'},
 {k:'Tur',b:'uzun',t:'Fransa: Paris ve Loire Şatoları',a:'Fransa · İzmir çıkışlı',info:'4 gece 5 gün',tr:'ucak',visa:'Schengen vizesi',visaReq:1,abroad:1,p:36750,g:'fransa',dates:[['Cum','23 Eki'],['Cum','6 Kas'],['Cum','20 Kas']],more:'+4'},

 {k:'Etkinlik',b:'saat',t:'Kordon Caz Akşamları',cat:'Caz',a:'Kordon Açıkhava, Alsancak',facts:['Cmt 3 Eki · 20:00','Genel giriş'],p:480,s:9.4,c:120,g:'caz',u:'bilet'},
 {k:'Etkinlik',b:'saat',t:'Kültürpark Açıkhava Konserleri',cat:'Konser',a:'Kültürpark Açıkhava, Konak',facts:['Cum 2 Eki · 21:00','Tribün'],p:850,s:9.3,c:410,g:'harbiye',u:'bilet'},
 {k:'Etkinlik',b:'saat',t:'İzmir Senfoni Gecesi',cat:'Klasik müzik',a:'Saygun Sanat Merkezi, Güzelyalı',facts:['Per 1 Eki · 20:00','Salon'],p:520,s:9.6,c:188,g:'senfoni',u:'bilet'},
 {k:'Etkinlik',b:'saat',t:'Bornova Stand Up Gecesi',cat:'Stand up',a:'Bornova Sahnesi, Bornova',facts:['Cum 2 Eki · 21:30','Genel giriş'],p:450,g:'sahne',u:'bilet'},
 {k:'Etkinlik',b:'saat',t:'Konak Sahnesi Tiyatro Akşamı',cat:'Tiyatro',a:'Konak Sahnesi, Konak',facts:['Cmt 3 Eki · 20:30','Salon'],p:380,s:9.1,c:142,g:'tiyatro',u:'bilet'},
 {k:'Etkinlik',b:'saat',t:'Karşıyaka Çocuk Tiyatrosu',cat:'Çocuk',a:'Karşıyaka Sahnesi, Karşıyaka',facts:['Paz 4 Eki · 11:00','Salon'],p:220,s:9.4,c:96,g:'cocuk',u:'bilet'},
 {k:'Etkinlik',b:'gun',t:'Çeşme Yaz Festivali',cat:'Festival',a:'Alaçatı Sahil, Çeşme',facts:['Cmt 3 Eki · tüm gün','Günlük bilet'],p:650,s:9.2,c:310,g:'aspendos',u:'bilet'},
 {k:'Etkinlik',b:'gun',t:'Urla Bağbozumu Şenliği',cat:'Festival',a:'Urla Bağ Yolu, Urla',facts:['Paz 4 Eki · tüm gün','Günlük bilet'],p:550,s:9.3,c:204,g:'bag',u:'bilet'},
 {k:'Etkinlik',b:'saat',t:'İzmir Kahve Festivali',cat:'Festival',a:'Kültürpark, Konak',facts:['Paz 4 Eki · 11:00','Günlük giriş'],p:290,g:'kahve',u:'bilet'},

 {k:'Aktivite',b:'saat',t:'Alaçatı Rüzgar Sörfü Dersi',a:'Alaçatı, Çeşme',facts:['2 saat','Başlangıç dersi'],p:1350,s:9.6,c:512,g:'sorf'},
 {k:'Aktivite',b:'saat',t:'Alaçatı Kitesurf Dersi',a:'Pırlanta Plajı, Alaçatı',facts:['3 saat','Başlangıç dersi'],p:2400,s:9.4,c:206,g:'kite'},
 {k:'Aktivite',b:'saat',t:'Sığacık SUP Turu',a:'Sığacık, Seferihisar',facts:['2 saat','Ekipman dahil'],p:750,s:9.2,c:134,g:'liman'},
 {k:'Aktivite',b:'gun',t:'Foça Tekne Turu',a:'Eski Foça, Foça',facts:['6 saat','Öğle yemeği dahil'],p:1100,s:9.3,c:688,g:'foca'},
 {k:'Aktivite',b:'saat',t:'Körfez Gün Batımı Tekne Turu',a:'Pasaport İskelesi, Alsancak',facts:['2 saat','Gün batımı'],p:690,s:9.1,c:254,g:'korfez'},
 {k:'Aktivite',b:'gun',t:'Çeşme Koylar Tekne Turu',a:'Çeşme Limanı, Çeşme',facts:['6 saat','Üç koy, öğle yemeği'],p:1250,s:9.2,c:471,g:'ege'},
 {k:'Aktivite',b:'saat',t:'Urla Bağ Turu ve Şarap Tadımı',a:'Urla Bağ Yolu, Urla',facts:['3 saat','Üç bağ, tadım'],p:1600,s:9.7,c:318,g:'bag'},
 {k:'Aktivite',b:'saat',t:'Kemeraltı Lezzet Yürüyüşü',a:'Kemeraltı, Konak',facts:['3 saat','Rehberli, 8 durak'],p:950,s:9.6,c:742,g:'kemeralti'},
 {k:'Aktivite',b:'saat',t:'Bornova Ege Mutfağı Atölyesi',a:'Bornova',facts:['3 saat','Pişir ve ye'],p:1200,s:9.3,c:88,g:'mutfak'},
 {k:'Aktivite',b:'saat',t:'Urla Seramik Atölyesi',a:'Urla',facts:['2 saat','Çark ve sırlama'],p:900,s:9.5,c:164,g:'seramik'},
 {k:'Aktivite',b:'saat',t:'Kemeraltı Ebru Atölyesi',a:'Kemeraltı, Konak',facts:['1,5 saat','Kendi ebrunu yap'],p:650,s:9.4,c:121,g:'ebru'},

 {k:'Mekân',b:'saat',t:'Kordon Spa & Masaj',a:'Alsancak, Konak',facts:['Klasik masaj · 60 dk','Randevulu'],p:1200,s:9.5,c:346,g:'termal',u:'seans'},
 {k:'Mekân',b:'gun',t:'Kum Beach Club',a:'Alaçatı, Çeşme',facts:['Tam gün','Şezlong · 2 kişi'],p:1500,s:9.3,c:824,g:'bodrum',u:'min. harcama'}
];
/* Ne kadar molan var? [adres anahtarı, seçenek, liste başlığı] */
export const BUCKETS=[['saat','Birkaç saat','Birkaç saate sığanlar'],['gun','Bir gün','Bir güne sığanlar'],['hs','Hafta sonu','Hafta sonuna sığanlar'],['uzun','4 gün +','Uzun molalar']];

/* Bölümler: etkinlik, otel, mekân */
export const EV=[];
export const HT=[['★★★★','Kordon Butik Otel','Alsancak, Konak · Denize 120 m',8.9,214,'Kahvaltı dahil',1989,'kordon'],
 ['★★★★','Alaçatı Taş Otel','Alaçatı, Çeşme · Taş ev, avlulu',9.3,402,'Kahvaltı dahil',3450,'alacati'],
 ['★★★★★','Ilıca Aile Resort','Ilıca, Çeşme · Denize sıfır',9.1,688,'Her şey dahil',4200,'resort'],
 ['★★★★','Urla Bağ Evi Otel','Urla · Bağların içinde, havuzlu',9.4,176,'Kahvaltı dahil',3200,'bag'],
 ['★★★','Eski Foça Pansiyon','Eski Foça, Foça · Denize 50 m',9.0,233,'Kahvaltı dahil',1750,'foca'],
 ['★★★','Şirince Köy Evi','Şirince, Selçuk · Taş köy evi',9.2,154,'Kahvaltı dahil',1900,'sirince'],
 ['★★★★','Balçova Termal Otel','Balçova · Termal havuz',8.7,312,'Yarım pansiyon',2100,'termal'],
 ['★★★★','Bostanlı Körfez Otel','Bostanlı, Karşıyaka · Körfez manzaralı',8.8,198,'Kahvaltı dahil',2350,'korfez'],
 ['★★★','Sığacık Kale Evi','Sığacık, Seferihisar · Kale içinde',9.1,141,'Kahvaltı dahil',1850,'liman']];
export const VN=[{t:'Kordon Spa & Masaj',a:'Alsancak, Konak · Masaj salonu',s:9.5,c:346,g:'termal',mode:'Randevulu',opts:[['Klasik masaj · 60 dk',1200],['Sıcak taş · 75 dk',1650]]},
 {t:'Kum Beach Club',a:'Alaçatı, Çeşme · Plaj kulübü',s:9.3,c:824,g:'bodrum',mode:'Masa ve şezlong',opts:[['Şezlong · 2 kişi',1500],['Sedir · 4 kişi',3000],['Loca · 8 kişi',9000]]},
 {t:'Kemeraltı Han Kahvesi',a:'Kemeraltı, Konak · Tarihi han avlusu',s:9.3,c:612,g:'kahve',mode:'Masa rezervasyonu',slots:['09:00','11:00','14:00','17:00'],opts:[['Türk kahvesi ve lokum',140],['Han kahvaltısı',420]]},
 {t:'Alaçatı Taş Avlu Kahvaltı',a:'Alaçatı, Çeşme · Taş avluda kahvaltı',s:9.4,c:538,g:'alacati',mode:'Masa rezervasyonu',slots:['09:00','10:30','12:00'],opts:[['Serpme kahvaltı',750],['Ege otlu kahvaltı · 2 kişi',1400]]},
 {t:'Bostanlı Sahil Kahvaltısı',a:'Bostanlı, Karşıyaka · Deniz kenarında kahvaltı',s:9.0,c:287,g:'korfez',mode:'Masa rezervasyonu',slots:['08:30','10:00','11:30'],opts:[['Serpme kahvaltı',560],['Gözleme ve çay',280]]},
 {t:'Bornova Köşk Bahçesi',a:'Bornova · Tarihi köşk bahçesinde kahvaltı',s:8.9,c:196,g:'kosk',mode:'Masa rezervasyonu',slots:['09:00','10:30','12:00'],opts:[['Köşk kahvaltısı',620],['Brunch tabağı',480]]},
 {t:'Sığacık Liman Balıkçısı',a:'Sığacık, Seferihisar · Liman kenarında balık',s:9.2,c:341,g:'liman',mode:'Masa rezervasyonu',slots:['13:00','19:00','21:00'],opts:[['Balık menüsü',1250],['Meze ve balık menüsü',1650]]},
 {t:'Urla İskele Balıkçısı',a:'Urla İskele, Urla · Gün batımında balık',s:9.3,c:402,g:'urla',mode:'Masa rezervasyonu',slots:['19:00','21:00'],opts:[['Balık menüsü',1350],['Şef menüsü',1900]]},
 {t:'Çeşme Liman Meyhanesi',a:'Çeşme · Limanda meze ve balık',s:9.1,c:274,g:'cesme',mode:'Masa rezervasyonu',slots:['19:00','21:30'],opts:[['Meze menüsü',1100],['Balık ve meze menüsü',1600]]},
 {t:'Urla Bağ Yolu Sofrası',a:'Urla · Bağların içinde akşam yemeği',s:9.5,c:233,g:'bag',mode:'Masa rezervasyonu',slots:['19:30'],opts:[['Tadım menüsü',1850],['Şarap eşleşmeli tadım menüsü',2650]]},
 {t:'Asansör Teras Restoran',a:'Karataş, Konak · Körfeze bakan teras',s:9.2,c:509,g:'asansor',mode:'Masa rezervasyonu',slots:['18:30','20:30'],opts:[['Akşam menüsü',1450],['Gün batımı menüsü · 2 kişi',2700]]},
 {t:'Kordon Meyhanesi',a:'Alsancak, Konak · Kordon\'da meze ve fasıl',s:9.0,c:388,g:'kordon',mode:'Masa rezervasyonu',slots:['19:00','21:00'],opts:[['Meze menüsü',1150],['Fasıl gecesi menüsü',1550]]},
 {t:'Alsancak Akustik Sahne',a:'Alsancak, Konak · Canlı müzik ve bar',s:9.2,c:530,g:'akustik',mode:'Masa rezervasyonu',u:'min. harcama',opts:[['Masa · 2 kişi',800],['Loca · 6 kişi',3200]]},
 {t:'Kıbrıs Şehitleri Caz Bar',a:'Alsancak, Konak · Caz ve kokteyl',s:9.1,c:216,g:'caz',mode:'Masa rezervasyonu',u:'min. harcama',opts:[['Masa · 2 kişi',700],['Bar önü · 4 kişi',1400]]},
 {t:'Balçova Termal Hamam',a:'Balçova · Termal havuz ve hamam',s:8.8,c:177,g:'termal',mode:'Randevulu',slots:['10:00','13:00','16:00'],opts:[['Termal havuz girişi',450],['Hamam ve kese',850]]}];

/* Tam ekran menü: ürün türleri */
export const MENU=[['Turlar','tur','İzmir çıkışlı: günübirlik, yurt içi, yurt dışı'],['Oteller','otel','Butik, havuzlu, termal'],
 ['Etkinlikler','etkinlik','Konser, festival, tiyatro'],['Aktiviteler','aktivite','Tekne, sörf, atölye, tadım'],
 ['Mekânlar','mekan','Kahvaltı, balık, canlı müzik'],['Fırsatlar','firsat','Kampanyalar']];

/* Güven şeridi açıklamaları */
export const TRUST={iptal:['Ücretsiz iptal','Çoğu tur, otel, etkinlik ve aktivitede belirli bir tarihe kadar ücretsiz iptal edebilirsin. Son iptal tarihi ürün sayfasında ve ödeme adımında yazar.'],
 taksit:['3 taksit, vade farksız','Anlaşmalı kredi kartlarıyla 3 taksite kadar vade farkı yok. Kartına göre diğer taksit seçenekleri ödeme adımında listelenir.'],
 kapora:['%20 kaporayla yer ayırt','Turlarda tutarın %20\'sini ödeyip yerini ayırtırsın, kalanını kalkıştan önce ödersin. Örneğin 8.990 TL\'lik Kapadokya turunda 1.798 TL.'],
 puan:['Molapuan · her rezervasyonda kazan','Her rezervasyonda puan kazanırsın; 1 puan = 1 TL olarak sonraki rezervasyonunda kullanılır. Gezgin, Kâşif ve Mola Ustası seviyelerinde avantajların artar.']};

/* Kiminle: keşif filtresi (kategori değil). Hangi ürünün kime uygun olduğu
   ÖRNEK; gerçekte işletme ve değerlendirmelerden gelecek. */
export const WITH=[['yalniz','Tek başıma'],['sevgili','Sevgilimle'],['arkadas','Arkadaşlarla'],['aile','Ailemle'],['cocuk','Çocuklarla'],['is','İş arkadaşlarımla']];
export const KIMLE={'Efes ve Şirince Turu':'yalniz sevgili arkadas aile',
 'Pamukkale ve Hierapolis':'yalniz sevgili aile cocuk',
 'Bergama ve Asklepion Turu':'yalniz arkadas aile',
 'İzmir Şehir Turu: Kemeraltı ve Kadifekale':'yalniz arkadas aile cocuk',
 'Ege Adaları Balayı Kaçamağı':'sevgili',
 'Midilli Adası Kaçamağı':'sevgili arkadas',
 'Kapadokya Turu':'sevgili aile is',
 'Karadeniz Yaylaları Turu':'yalniz arkadas aile',
 'Turistik Doğu Ekspresi':'yalniz sevgili arkadas',
 'Erciyes Kayak Haftası':'arkadas aile cocuk',
 'Balkanlar: Saraybosna ve Mostar':'yalniz sevgili arkadas',
 'Dubai Turu':'sevgili aile cocuk',
 'İtalya: Roma, Floransa ve Venedik':'yalniz sevgili',
 'İspanya: Barselona ve Madrid':'sevgili arkadas',
 'Fransa: Paris ve Loire Şatoları':'sevgili',
 'Kordon Caz Akşamları':'yalniz sevgili arkadas is',
 'Kültürpark Açıkhava Konserleri':'yalniz sevgili arkadas',
 'İzmir Senfoni Gecesi':'yalniz sevgili aile',
 'Bornova Stand Up Gecesi':'sevgili arkadas is',
 'Konak Sahnesi Tiyatro Akşamı':'yalniz sevgili arkadas aile',
 'Karşıyaka Çocuk Tiyatrosu':'aile cocuk',
 'Çeşme Yaz Festivali':'sevgili arkadas',
 'Urla Bağbozumu Şenliği':'sevgili arkadas aile cocuk',
 'İzmir Kahve Festivali':'yalniz arkadas',
 'Alaçatı Rüzgar Sörfü Dersi':'yalniz arkadas cocuk',
 'Alaçatı Kitesurf Dersi':'yalniz arkadas',
 'Sığacık SUP Turu':'yalniz sevgili arkadas',
 'Foça Tekne Turu':'sevgili arkadas aile cocuk',
 'Körfez Gün Batımı Tekne Turu':'sevgili arkadas is',
 'Çeşme Koylar Tekne Turu':'arkadas aile cocuk is',
 'Urla Bağ Turu ve Şarap Tadımı':'sevgili arkadas',
 'Kemeraltı Lezzet Yürüyüşü':'yalniz sevgili arkadas',
 'Bornova Ege Mutfağı Atölyesi':'yalniz arkadas is',
 'Urla Seramik Atölyesi':'yalniz sevgili cocuk',
 'Kemeraltı Ebru Atölyesi':'yalniz aile cocuk',
 'Kordon Spa & Masaj':'yalniz sevgili',
 'Kum Beach Club':'sevgili arkadas is',
 'Kemeraltı Han Kahvesi':'yalniz sevgili arkadas aile',
 'Alaçatı Taş Avlu Kahvaltı':'sevgili arkadas aile cocuk',
 'Bostanlı Sahil Kahvaltısı':'yalniz sevgili arkadas aile cocuk',
 'Bornova Köşk Bahçesi':'arkadas aile cocuk is',
 'Sığacık Liman Balıkçısı':'sevgili arkadas aile',
 'Urla İskele Balıkçısı':'sevgili arkadas',
 'Çeşme Liman Meyhanesi':'arkadas is',
 'Urla Bağ Yolu Sofrası':'sevgili arkadas',
 'Asansör Teras Restoran':'sevgili aile is',
 'Kordon Meyhanesi':'arkadas is',
 'Alsancak Akustik Sahne':'yalniz sevgili arkadas',
 'Kıbrıs Şehitleri Caz Bar':'yalniz sevgili arkadas',
 'Balçova Termal Hamam':'yalniz sevgili aile',
 'Kordon Butik Otel':'yalniz sevgili is',
 'Alaçatı Taş Otel':'sevgili arkadas',
 'Ilıca Aile Resort':'aile cocuk',
 'Urla Bağ Evi Otel':'sevgili',
 'Eski Foça Pansiyon':'yalniz sevgili arkadas',
 'Şirince Köy Evi':'sevgili aile',
 'Balçova Termal Otel':'sevgili aile cocuk is',
 'Bostanlı Körfez Otel':'yalniz aile is',
 'Sığacık Kale Evi':'sevgili arkadas'};

/* Özellik: ürünün arama niyetine dönük nitelikleri (kahvaltı, balık, butik,
   havuzlu, tekne turu …). Kategori değil, süzgeç (kural 3); şehir sayfaları
   (şehir + tür + özellik) buradan üretilir. ÖRNEK; gerçekte işletme verisinden. */
export const OZ={'Efes ve Şirince Turu':'gunubirlik kultur',
 'Pamukkale ve Hierapolis':'gunubirlik kultur doga',
 'Bergama ve Asklepion Turu':'gunubirlik kultur',
 'İzmir Şehir Turu: Kemeraltı ve Kadifekale':'gunubirlik kultur',
 'Ege Adaları Balayı Kaçamağı':'yurt-disi',
 'Midilli Adası Kaçamağı':'yurt-disi',
 'Kapadokya Turu':'kultur doga',
 'Karadeniz Yaylaları Turu':'doga',
 'Turistik Doğu Ekspresi':'doga',
 'Erciyes Kayak Haftası':'',
 'Balkanlar: Saraybosna ve Mostar':'yurt-disi kultur',
 'Dubai Turu':'yurt-disi',
 'İtalya: Roma, Floransa ve Venedik':'yurt-disi kultur',
 'İspanya: Barselona ve Madrid':'yurt-disi kultur',
 'Fransa: Paris ve Loire Şatoları':'yurt-disi kultur',
 'Kordon Caz Akşamları':'konser',
 'Kültürpark Açıkhava Konserleri':'konser',
 'İzmir Senfoni Gecesi':'konser',
 'Bornova Stand Up Gecesi':'',
 'Konak Sahnesi Tiyatro Akşamı':'tiyatro',
 'Karşıyaka Çocuk Tiyatrosu':'tiyatro',
 'Çeşme Yaz Festivali':'festival',
 'Urla Bağbozumu Şenliği':'festival',
 'İzmir Kahve Festivali':'festival',
 'Alaçatı Rüzgar Sörfü Dersi':'su-sporlari',
 'Alaçatı Kitesurf Dersi':'su-sporlari',
 'Sığacık SUP Turu':'su-sporlari',
 'Foça Tekne Turu':'tekne-turu',
 'Körfez Gün Batımı Tekne Turu':'tekne-turu',
 'Çeşme Koylar Tekne Turu':'tekne-turu',
 'Urla Bağ Turu ve Şarap Tadımı':'tadim',
 'Kemeraltı Lezzet Yürüyüşü':'tadim',
 'Bornova Ege Mutfağı Atölyesi':'atolye tadim',
 'Urla Seramik Atölyesi':'atolye',
 'Kemeraltı Ebru Atölyesi':'atolye',
 'Kordon Spa & Masaj':'romantik',
 'Kum Beach Club':'deniz-manzarali',
 'Kemeraltı Han Kahvesi':'kahvalti',
 'Alaçatı Taş Avlu Kahvaltı':'kahvalti',
 'Bostanlı Sahil Kahvaltısı':'kahvalti deniz-manzarali',
 'Bornova Köşk Bahçesi':'kahvalti',
 'Sığacık Liman Balıkçısı':'balik deniz-manzarali',
 'Urla İskele Balıkçısı':'balik deniz-manzarali romantik',
 'Çeşme Liman Meyhanesi':'balik deniz-manzarali',
 'Urla Bağ Yolu Sofrası':'romantik',
 'Asansör Teras Restoran':'romantik deniz-manzarali',
 'Kordon Meyhanesi':'canli-muzik deniz-manzarali',
 'Alsancak Akustik Sahne':'canli-muzik',
 'Kıbrıs Şehitleri Caz Bar':'canli-muzik',
 'Balçova Termal Hamam':'',
 'Kordon Butik Otel':'butik',
 'Alaçatı Taş Otel':'butik',
 'Ilıca Aile Resort':'havuzlu deniz-manzarali',
 'Urla Bağ Evi Otel':'butik havuzlu',
 'Eski Foça Pansiyon':'butik deniz-manzarali',
 'Şirince Köy Evi':'butik',
 'Balçova Termal Otel':'havuzlu',
 'Bostanlı Körfez Otel':'deniz-manzarali',
 'Sığacık Kale Evi':'butik'};

/* Temalar: tür karışık koleksiyonlar (kategori de filtre de değil). Hangi
   ürünün hangi temada olduğu ÖRNEK. [adres anahtarı, ad, renk geçişi,
   ürünler, tema sayfasının iki cümlelik girişi] */
export const THEMES=[
 ['doga','Doğa ve yayla','linear-gradient(160deg,#9CC38A,#3E7A55 55%,#27465E)',['Şirince Köy Evi','Urla Bağ Evi Otel','Foça Tekne Turu','Sığacık SUP Turu','Pamukkale ve Hierapolis','Karadeniz Yaylaları Turu','Kapadokya Turu','Urla Bağ Turu ve Şarap Tadımı','Turistik Doğu Ekspresi'],'Bağ yolları, zeytinlikler, sakin koylar ve yaylalar. Şehirden bir günlüğüne kaçmaktan birkaç günlük doğa turuna kadar, yeşilin içinde geçen molalar.'],
 ['deniz','Deniz ve tekne','linear-gradient(160deg,#8FD0E6,#2E86B0 55%,#1C3F70)',['Foça Tekne Turu','Çeşme Koylar Tekne Turu','Körfez Gün Batımı Tekne Turu','Kum Beach Club','Ilıca Aile Resort','Eski Foça Pansiyon','Alaçatı Rüzgar Sörfü Dersi','Sığacık Liman Balıkçısı','Bostanlı Körfez Otel'],'Foça\'nın koyları, Çeşme\'de tekne turları ve körfezde gün batımı. Güne denizde başlayıp akşamı sahilde bitirenler için.'],
 ['kultur','Kültür ve tarih','linear-gradient(160deg,#E6C99A,#B0764A 55%,#5A4A6E)',['Efes ve Şirince Turu','Bergama ve Asklepion Turu','İzmir Şehir Turu: Kemeraltı ve Kadifekale','Kemeraltı Lezzet Yürüyüşü','Pamukkale ve Hierapolis','Kapadokya Turu','Kemeraltı Han Kahvesi','Şirince Köy Evi','Balkanlar: Saraybosna ve Mostar','İtalya: Roma, Floransa ve Venedik','Fransa: Paris ve Loire Şatoları','İspanya: Barselona ve Madrid'],'Efes\'ten Bergama\'ya antik kentler, Kemeraltı\'nın hanları ve rehberli turlar. Gezdiğin yerin hikâyesini dinleyerek yaşamak isteyenler için.'],
 ['kis','Kış ve kayak','linear-gradient(160deg,#E9EEF5,#9DB2CC 50%,#3F5478)',['Erciyes Kayak Haftası','Turistik Doğu Ekspresi','Balçova Termal Otel','Balçova Termal Hamam'],'Erciyes\'te kayak, Doğu Ekspresi\'yle karlı yollar ve Balçova\'da sıcak termal sular. Kışı soğuktan kaçarak değil, tadını çıkararak geçirmek için.'],
 ['termal','Termal ve spa','linear-gradient(160deg,#DCEBEF,#7FB3BF 50%,#4E6E86)',['Balçova Termal Otel','Balçova Termal Hamam','Kordon Spa & Masaj','Pamukkale ve Hierapolis','Ilıca Aile Resort'],'Balçova\'nın termal suları, Alsancak\'ta masaj ve hamam. Yorgunluğu atmak için yavaş geçen bir gün ya da birkaç gecelik dinlenme.'],
 ['macera','Macera ve spor','linear-gradient(160deg,#BFE6F2,#43A7CF 50%,#2E7D5B)',['Alaçatı Kitesurf Dersi','Alaçatı Rüzgar Sörfü Dersi','Sığacık SUP Turu','Foça Tekne Turu','Karadeniz Yaylaları Turu','Erciyes Kayak Haftası'],'Alaçatı\'nın rüzgârında sörf ve kitesurf, Sığacık\'ta kürek. Hafta sonunu hareket ederek geçirmek isteyenler için.'],
 ['festival','Konser ve festival','linear-gradient(160deg,#2B2140,#6E4A7E 55%,#D8A66A)',['Kordon Caz Akşamları','Kültürpark Açıkhava Konserleri','Çeşme Yaz Festivali','Urla Bağbozumu Şenliği','İzmir Kahve Festivali','İzmir Senfoni Gecesi','Kum Beach Club'],'Kordon\'da caz, Kültürpark\'ta açıkhava konserleri, Urla\'da bağbozumu. Müziği canlı dinlemek, kalabalığın enerjisine karışmak isteyenler için.'],
 ['sahne','Sahne ve gösteri','linear-gradient(160deg,#3A2F66,#8A4F7A 55%,#E0A060)',['Konak Sahnesi Tiyatro Akşamı','Bornova Stand Up Gecesi','İzmir Senfoni Gecesi','Alsancak Akustik Sahne','Karşıyaka Çocuk Tiyatrosu','Kültürpark Açıkhava Konserleri'],'Tiyatro, stand up, senfoni ve akustik geceler. Bir akşamı sahnenin önünde geçirmek isteyenler için.'],
 ['lezzet','Yeme içme','linear-gradient(160deg,#E8D3B5,#8A5A3A 55%,#3E2A22)',['Kemeraltı Lezzet Yürüyüşü','Urla Bağ Turu ve Şarap Tadımı','Urla Bağ Yolu Sofrası','Alaçatı Taş Avlu Kahvaltı','Sığacık Liman Balıkçısı','Çeşme Liman Meyhanesi','Bornova Ege Mutfağı Atölyesi','İzmir Kahve Festivali','Kemeraltı Han Kahvesi'],'Kemeraltı\'nda boyoz ve kumru, Urla\'da bağ sofrası, limanda balık. Gittiği yeri tadıyla hatırlayanlar için.'],
 ['balayi','Balayı','linear-gradient(160deg,#F3C9C0,#C0707A 55%,#5A3F6E)',['Ege Adaları Balayı Kaçamağı','Urla Bağ Evi Otel','Alaçatı Taş Otel','Asansör Teras Restoran','Kordon Spa & Masaj','Urla Bağ Yolu Sofrası','Körfez Gün Batımı Tekne Turu','Kapadokya Turu','İtalya: Roma, Floransa ve Venedik'],'Bağ evinde sakin geceler, körfezde gün batımı ve ada kaçamakları. İkiniz için sakin ve özenli molalar.'],
 ['gece','Gece hayatı','linear-gradient(160deg,#1C2640,#3A3F8A 55%,#C06AA0)',['Alsancak Akustik Sahne','Kıbrıs Şehitleri Caz Bar','Kordon Meyhanesi','Kordon Caz Akşamları','Bornova Stand Up Gecesi','Kum Beach Club','Çeşme Liman Meyhanesi'],'Alsancak\'ta canlı müzik ve caz, Kordon\'da fasıl, Çeşme\'de liman akşamları. Gün bittiğinde başlayan planlar için.']];

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
 deniz:['Karşıyaka','Tarih ve müze turlarının peşinde. Her şehirde bir rehber arkadaşım var.',842,213],
 selin:['Bornova','İki kişilik kaçamaklar, erken kalkılan sabahlar.',1240,310],
 mert:['Çeşme','Sörf, tekne, kamp. Hafta sonu evde durmam.',2310,402],
 elif:['İzmir','Caz, Kordon ve iyi yemek. Akşam planı lazımsa bana sor.',968,355],
 kaan:['Urla','Arkadaş grubuyla doğa ve macera.',611,248],
 zeynep:['Buca','İki çocuk, bir bavul. Aile dostu oteller ve yaylalar.',1530,190],
 burak:['İzmir','İzmir ve çevresinde ne yapılır, hepsini denedim.',734,288],
 ceren:['Alsancak','Kısa kaçamaklar, uzun yürüyüşler.',512,301],
 ozan:['Bayraklı','Patikalar, yaylalar, çadır.',689,144],
 irem:['Karşıyaka','Konser, festival, şehir kaçamağı.',455,276]};
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
 {u:'mert',yer:'Alaçatı, Çeşme',ne:'5 saat önce',g:'sorf',g2:['kite'],urun:'Alaçatı Rüzgar Sörfü Dersi',gitti:1,kay:186,pay:64,
  metin:'Alaçatı\'da ilk sörf dersim: iki saatin sonunda tahtanın üstünde ayakta kalabildim. Rüzgâr tam kıvamındaydı.',beg:412,yor:58},
 {u:'elif',yer:'Alsancak, İzmir',ne:'Dün',g:'caz',g2:['kordon'],urun:'Kordon Caz Akşamları',gitti:1,
  metin:'Kordon\'da gün batımı ve canlı caz. İzmir\'de cumartesi akşamı için daha iyisi yok.',beg:96,yor:12},
 {u:'deniz',yer:'Selçuk, İzmir',ne:'3 gün önce',g:'efes',g2:['aspendos'],urun:'Efes ve Şirince Turu',gitti:1,
  metin:'Rehberimiz Celsus Kütüphanesi\'ni öyle anlattı ki bir saat ayrılamadık. Şirince şarabı da bonus.',beg:173,yor:19},
 {u:'kaan',yer:'Foça, İzmir',ne:'1 hafta önce',g:'foca',g2:['ege'],urun:'Foça Tekne Turu',gitti:0,
  metin:'Arkadaş grubuyla Foça\'da tekne, Siren Kayalıkları önünde yüzme molası. Hafta sonu için birebir.',beg:134,yor:22},
 {u:'zeynep',yer:'Ilıca, Çeşme',ne:'4 gün önce',g:'resort',g2:['ege'],urun:'Ilıca Aile Resort',gitti:1,
  metin:'Ekim\'de deniz hâlâ sıcak. Çocuklar havuzdan, biz plajdan çıkmadık.',beg:88,yor:9},
 {u:'kaan',yer:'Göreme, Nevşehir',ne:'1 hafta önce',g:'goreme',g2:['kapadokya'],urun:'Kapadokya Turu',gitti:1,
  metin:'Balonlar kalkmadan vadide yürüdük, rehber her kayanın hikâyesini biliyordu. İki gün az bile geldi.',beg:157,yor:14},
 {u:'zeynep',yer:'Şirince, Selçuk',ne:'2 gün önce',g:'sirince',g2:['efes'],urun:'Şirince Köy Evi',gitti:1,
  metin:'Sabah bahçede köy kahvaltısı, akşam taş sokaklarda yürüyüş. Telefonu çantadan hiç çıkarmadık.',beg:121,yor:16},
 {u:'mert',yer:'Çeşme, İzmir',ne:'3 gün önce',g:'ege',g2:['cesme'],urun:'Çeşme Koylar Tekne Turu',gitti:1,
  metin:'Dört koy, iki yüzme molası, teknede ızgara balık. Akşama tuzlu ve mutlu döndük.',beg:203,yor:21},
 {u:'elif',yer:'Karataş, İzmir',ne:'6 gün önce',g:'asansor',g2:['korfez'],urun:'Asansör Teras Restoran',gitti:0,
  metin:'Asansörle terasa çıkıp körfeze karşı akşam yemeği. Doğum günü için güzel bir akşamdı.',beg:64,yor:7},
 {u:'selin',yer:'Alaçatı, Çeşme',ne:'Dün',g:'alacati',g2:['kosk'],urun:'Alaçatı Taş Avlu Kahvaltı',gitti:1,
  metin:'Taş avluda serpme kahvaltı, sonra Alaçatı sokaklarında kısa bir yürüyüş. Pazar sabahı için tam kıvamında.',beg:77,yor:8},
 {u:'deniz',yer:'Bornova, İzmir',ne:'3 hafta önce',g:'sahne',g2:['akustik'],urun:'Bornova Stand Up Gecesi',gitti:0,
  metin:'Geçen ayki gösteriye gittik, salon kahkahadan yıkıldı. Bu cuma yine oradayız.',beg:58,yor:6},
 {u:'ceren',yer:'Uçhisar, Nevşehir',ne:'5 gün önce',g:'kapadokya',g2:['goreme'],urun:'Kapadokya Turu',gitti:1,
  metin:'İlk kez balon izledim, hava soğuktu ama değdi. Akşam çömlek atölyesi de çok tatlıydı.',beg:91,yor:6},
 {u:'burak',yer:'Alsancak, İzmir',ne:'2 gün önce',g:'kordon',g2:['caz'],urun:'Kordon Spa & Masaj',gitti:1,
  metin:'Haftanın yorgunluğunu bir saatte attım. Çıkışta Kordon\'da yürüyüş şart.',beg:58,yor:4},
 {u:'ozan',yer:'Uzungöl, Trabzon',ne:'1 hafta önce',g:'karadeniz',g2:['ayder'],urun:'Karadeniz Yaylaları Turu',gitti:1,
  metin:'Üç yayla, bir sürü sis ve en güzel muhlama. Rehberimiz her patikayı biliyordu.',beg:146,yor:11},
 {u:'irem',yer:'Alsancak, İzmir',ne:'4 gün önce',g:'caz',g2:['kordon'],urun:'Kordon Caz Akşamları',gitti:1,
  metin:'Sahneye bu kadar yakın oturunca caz bambaşka. Bir dahaki ay yine geliyorum.',beg:67,yor:5},
 {u:'burak',yer:'Kemeraltı, İzmir',ne:'5 gün önce',g:'kemeralti',g2:['kahve'],urun:'Kemeraltı Lezzet Yürüyüşü',gitti:1,
  metin:'Boyozla başladık, kumru ve lokmayla bitirdik. Sekiz durak, her birinin bir hikâyesi var; aç gelin.',beg:118,yor:13},
 {u:'irem',yer:'Urla, İzmir',ne:'1 hafta önce',g:'bag',g2:['urla'],urun:'Urla Bağ Turu ve Şarap Tadımı',gitti:1,
  metin:'Üç bağ, bağcıların kendi anlattığı hikâyeler ve gün batımında tadım. Urla\'yı bir de böyle görün.',beg:96,yor:9}
];

/* Yerler: arama önerileri için. Bir ürün, adında ya da yerinde (kalkış
   şehri sayılmaz) bu adlardan biri geçiyorsa o yerdedir. Liste ÖRNEK;
   gerçekte ürünün konum verisinden gelecek. [adres anahtarı, ad, alt satır,
   eş adlar, şehir]: şehri olan yer o şehrin bölgesidir (İzmir'de Alsancak,
   Urla …); şehri boş olanlar şehrin kendisi ya da turların gittiği yerler. */
export const DESTS=[
 ['izmir','İzmir','Ege · Alsancak, Çeşme, Urla',['İzmir','Alsancak','Kordon','Pasaport','Kıbrıs Şehitleri','Konak','Kemeraltı','Karataş','Güzelyalı','Kültürpark','Kadifekale','Karşıyaka','Bostanlı','Bornova','Balçova','Urla','Çeşme','Alaçatı','Ilıca','Pırlanta','Seferihisar','Sığacık','Foça','Selçuk','Şirince','Efes','Bergama','Asklepion'],''],
 ['alsancak','Alsancak','Konak · İzmir',['Alsancak','Kordon','Pasaport','Kıbrıs Şehitleri'],'izmir'],
 ['kemeralti','Kemeraltı','Konak · İzmir',['Kemeraltı'],'izmir'],
 ['konak','Konak','İzmir · Alsancak, Kemeraltı, Karataş',['Konak','Alsancak','Kordon','Pasaport','Kıbrıs Şehitleri','Kemeraltı','Karataş','Güzelyalı','Kültürpark','Kadifekale'],'izmir'],
 ['karsiyaka','Karşıyaka','İzmir · Bostanlı',['Karşıyaka','Bostanlı'],'izmir'],
 ['bornova','Bornova','İzmir',['Bornova'],'izmir'],
 ['urla','Urla','İzmir · Bağ yolu, İskele',['Urla'],'izmir'],
 ['cesme','Çeşme','İzmir · Alaçatı, Ilıca',['Çeşme','Alaçatı','Ilıca','Pırlanta'],'izmir'],
 ['alacati','Alaçatı','Çeşme · İzmir',['Alaçatı','Pırlanta'],'izmir'],
 ['seferihisar','Seferihisar','İzmir · Sığacık',['Seferihisar','Sığacık'],'izmir'],
 ['foca','Foça','İzmir · Eski Foça',['Foça'],'izmir'],
 ['selcuk','Selçuk','İzmir · Efes, Şirince',['Selçuk','Şirince','Efes'],'izmir'],
 ['balcova','Balçova','İzmir · termal',['Balçova'],'izmir'],
 ['bergama','Bergama','İzmir · antik kent',['Bergama','Asklepion'],'izmir'],
 ['kapadokya','Kapadokya','Nevşehir · Göreme',['Kapadokya','Göreme','Nevşehir'],''],
 ['pamukkale','Pamukkale','Denizli',['Pamukkale','Hierapolis','Denizli'],''],
 ['karadeniz','Karadeniz','Rize · Ayder',['Karadeniz','Rize','Ayder'],''],
 ['kars','Kars','Doğu Anadolu',['Kars','Doğu Ekspresi'],''],
 ['kayseri','Kayseri','İç Anadolu · Erciyes',['Kayseri','Erciyes'],''],
 ['yurt-disi','Yurt dışı','Adalar, Balkanlar, Avrupa, Dubai',['Sakız','Midilli','Balkanlar','Bosna','Saraybosna','Dubai','İtalya','İspanya','Fransa'],''],
 ['yunan-adalari','Yunan adaları','Yurt dışı · Sakız, Midilli',['Sakız','Midilli'],''],
 ['balkanlar','Balkanlar','Yurt dışı · Saraybosna, Mostar',['Balkanlar','Bosna','Saraybosna'],''],
 ['dubai','Dubai','Yurt dışı · Birleşik Arap Emirlikleri',['Dubai'],''],
 ['italya','İtalya','Yurt dışı · Roma, Floransa, Venedik',['İtalya'],''],
 ['ispanya','İspanya','Yurt dışı · Barselona, Madrid',['İspanya'],''],
 ['fransa','Fransa','Yurt dışı · Paris, Loire',['Fransa'],'']];

/* Popüler aramalar: sekmeye göre. ÖRNEK; gerçekte arama verisinden gelecek.
   Yer adıysa yer seçilir, değilse metinle aranır; sonucu olmayan gösterilmez. */
export const POP={tur:['Efes','Kapadokya','Pamukkale','Yunan adaları','Karadeniz','İtalya'],
 otel:['Alaçatı','Çeşme','Urla','Alsancak','Termal','Butik'],
 etkinlik:['Alsancak','Konser','Festival','Tiyatro','Stand up'],
 aktivite:['Tekne','Sörf','Şarap','Atölye','Alaçatı'],
 mekan:['Kahvaltı','Balık','Alsancak','Urla','Canlı müzik']};

/* Keşfet'te arama kartı sola kaydırılınca: seçili sekmenin koleksiyonları
   [ad, liste süzgeci]. Kategori sekmeden gelir, süzgeç yalnızca yer ya da
   tema (kural 3). Deneyimi olmayan koleksiyon gösterilmez. ÖRNEK */
export const KOLEKSIYON={
 tur:[['Yurt dışı turları',{yer:'yurt-disi'}],['Kültür turları',{tema:'kultur'}],['Karadeniz turları',{yer:'karadeniz'}],['Doğa turları',{tema:'doga'}],
  ['Kapadokya turları',{yer:'kapadokya'}],['Macera turları',{tema:'macera'}],['Kış turları',{tema:'kis'}],['Balayı turları',{tema:'balayi'}],
  ['Yunan adaları turları',{yer:'yunan-adalari'}],['Doğu Anadolu turları',{yer:'kars'}]],
 otel:[['Balayı otelleri',{tema:'balayi'}],['Deniz kenarı oteller',{tema:'deniz'}],['Termal oteller',{tema:'termal'}],['Doğada konaklama',{tema:'doga'}],
  ['Kış otelleri',{tema:'kis'}],['Kapadokya otelleri',{yer:'kapadokya'}],['Antalya otelleri',{yer:'antalya'}],['İzmir otelleri',{yer:'izmir'}],['Karadeniz otelleri',{yer:'karadeniz'}]],
 etkinlik:[['Konser ve festival',{tema:'festival'}],['Sahne ve gösteri',{tema:'sahne'}],['Gece etkinlikleri',{tema:'gece'}],['İstanbul etkinlikleri',{yer:'istanbul'}],
  ['İzmir etkinlikleri',{yer:'izmir'}],['Ankara etkinlikleri',{yer:'ankara'}],['Antalya etkinlikleri',{yer:'antalya'}],['Lezzet etkinlikleri',{tema:'lezzet'}]],
 aktivite:[['Macera ve spor',{tema:'macera'}],['Deniz ve tekne',{tema:'deniz'}],['Doğa aktiviteleri',{tema:'doga'}],['Kayak',{tema:'kis'}],
  ['Muğla aktiviteleri',{yer:'mugla'}],['İstanbul aktiviteleri',{yer:'istanbul'}],['Antalya aktiviteleri',{yer:'antalya'}]],
 mekan:[['Yeme içme',{tema:'lezzet'}],['Gece mekânları',{tema:'gece'}],['Canlı müzik',{tema:'sahne'}],['Spa ve masaj',{tema:'termal'}],['Balayı mekânları',{tema:'balayi'}],
  ['Doğada mekânlar',{tema:'doga'}],['İstanbul mekânları',{yer:'istanbul'}],['İzmir mekânları',{yer:'izmir'}],['Antalya mekânları',{yer:'antalya'}]]};

/* Yakınımda: yer adlarının yaklaşık koordinatları [enlem, boylam]. Ürünün
   konumu adında ya da yerinde geçen ilk addan (özelden genele sıralı).
   ÖRNEK; gerçekte her ürünün kendi konumu olacak. */
export const GEO={'Pasaport':[38.428,27.137],'Kıbrıs Şehitleri':[38.437,27.144],'Kordon':[38.433,27.138],'Alsancak':[38.437,27.143],
 'Kemeraltı':[38.419,27.130],'Karataş':[38.409,27.115],'Güzelyalı':[38.395,27.083],'Kültürpark':[38.428,27.146],'Kadifekale':[38.411,27.146],'Konak':[38.418,27.128],
 'Bostanlı':[38.456,27.098],'Karşıyaka':[38.459,27.112],'Bornova':[38.462,27.216],'Balçova':[38.389,27.050],
 'Pırlanta':[38.246,26.372],'Alaçatı':[38.270,26.374],'Ilıca':[38.307,26.373],'Çeşme':[38.323,26.303],'Urla':[38.323,26.765],
 'Sığacık':[38.198,26.787],'Seferihisar':[38.197,26.836],'Foça':[38.670,26.757],'Şirince':[37.944,27.433],'Efes':[37.941,27.341],'Selçuk':[37.951,27.368],
 'Bergama':[39.121,27.180],'İzmir':[38.420,27.140],
 'Göreme':[38.643,34.829],'Kapadokya':[38.643,34.829],'Pamukkale':[37.920,29.120],'Erciyes':[38.530,35.450],'Kayseri':[38.720,35.480],
 'Ayder':[40.953,41.100],'Rize':[41.025,40.517],'Kars':[40.601,43.097],
 'Sakız':[38.368,26.136],'Midilli':[39.110,26.555],'Saraybosna':[43.856,18.413],'Dubai':[25.205,55.271],'İtalya':[41.903,12.496],'İspanya':[41.390,2.170],'Fransa':[48.857,2.352]};

/* ÖRNEK Molapuan durumu, taslak görünümüne göre: [puan, son 24 aydaki rezervasyon].
   Seviye eşikleri (ÖNERİ): Gezgin 1, Kâşif 3, Mola Ustası 6 rezervasyon. */
export const PUAN={guest:[0,0],gezgin:[320,1],kasif:[1240,3]};
export const SEVIYE=[['Gezgin',1,'Puan kazanır','Gezgin\'e','puan kazanmaya başla'],['Kâşif',3,'%10 indirim','Kâşif\'e','%10 indirim kazan'],['Mola Ustası',6,'%15 indirim','Mola Ustası\'na','%15 indirim kazan']];

/* Bağlan hikayeleri: ÖRNEK. Takip edilen kişilerin son 24 saatteki kısa
   anları; her biri Mola360'daki bir ürüne (ürün adıyla) bağlı.
   kare: [görselin renk geçişi (G), kısa yazı]. */
export const HIKAYE=[
 {u:'selin',ne:'18 dk',yer:'Göreme',urun:'Kapadokya Turu',gitti:1,kare:[['kapadokya','Balonlar kalktı, terastayız'],['goreme','Vadide sabah yürüyüşü']]},
 {u:'mert',ne:'1 sa',yer:'Alaçatı',urun:'Alaçatı Rüzgar Sörfü Dersi',gitti:1,kare:[['sorf','Rüzgâr tam kıvamında'],['kite','Plajda ilk deneme']]},
 {u:'elif',ne:'3 sa',yer:'Alsancak',urun:'Kordon Caz Akşamları',gitti:1,kare:[['caz','Kordon\'da ilk set başladı'],['kordon','Gün batımı ve caz']]},
 {u:'zeynep',ne:'6 sa',yer:'Şirince',urun:'Şirince Köy Evi',gitti:1,kare:[['sirince','Bahçede köy kahvaltısı'],['efes','Akşamüstü taş sokaklar']]},
 {u:'kaan',ne:'9 sa',yer:'Foça',urun:'Foça Tekne Turu',gitti:0,kare:[['foca','Siren Kayalıkları önünde'],['ege','Teknede öğle yemeği']]}];
/* Mesajlar (ÖRNEK): Ayşe'nin sohbetleri, en yeniden eskiye. k: kişi (USERS),
   ist: mesaj isteği (takip etmediği biri yazmış), yeni: okunmamış mesaj sayısı,
   durum: Ayşe'nin son mesajı karşıya ulaştı ama okunmadıysa 'iletildi' (yoksa görüldü).
   m: {gun:'Dün'} gün ayracı ya da [kim (o: karşı taraf, b: Ayşe), metin, saat, ek];
   ek {urun:'Ürün adı'} deneyim kartı, davet:1 ile "Birlikte gidelim" daveti,
   {post:'p1'} Bağlan paylaşımı. */
export const SOHBET=[
 {k:'selin',yeni:2,m:[{gun:'Dün'},
   ['o','Kapadokya fotoğraflarına bayıldık! Hangi turla gitmiştin?','21:14'],
   ['b','Bununla gittim, rehberimiz harikaydı:','21:20',{urun:'Kapadokya Turu'}],
   ['o','Çok teşekkürler, hemen bakıyoruz 😊','21:31'],{gun:'Bugün'},
   ['o','Biz de gittik, balonlar inanılmazdı!','10:40'],
   ['o','','10:41',{post:'p1'}]]},
 {k:'mert',yeni:1,m:[{gun:'Dün'},
   ['o','Bunu birlikte yapalım mı?','18:22',{urun:'Alaçatı Rüzgar Sörfü Dersi',davet:1}],
   ['b','Ben varım! Ekim sonu olur mu?','19:05'],{gun:'Bugün'},
   ['o','Olur, 24 Ekim cumartesi ikimize de uyuyor.','09:12']]},
 {k:'elif',m:[{gun:'Cuma'},
   ['o','Cumartesi akşamı Kordon\'da mıyız?','17:40'],
   ['b','Evet! Caz akşamına biletimi aldım 🎷','17:52'],
   ['o','Süper, 19:30\'da girişte buluşalım.','17:55']]},
 {k:'deniz',m:[{gun:'Çarşamba'},
   ['o','Efes\'i soruyordun ya, bu paylaşımı gördün mü?','12:10',{post:'p4'}],
   ['b','Gördüm, listeme ekledim. Teşekkürler 🙏','12:31']]},
 {k:'zeynep',durum:'iletildi',m:[{gun:'28 Eylül'},
   ['b','Şirince\'de nerede kaldınız?','14:02'],
   ['o','Köy evinde kaldık, sabah bahçede kahvaltı bambaşka.','14:20',{urun:'Şirince Köy Evi'}],
   ['b','Harika, kaydettim!','14:22']]},
 {k:'ceren',ist:1,yeni:1,m:[{gun:'Bugün'},
   ['o','Merhaba Ayşe! Kapadokya paylaşımını gördüm. Kaldığın otelden memnun kaldın mı?','08:47']]},
 {k:'ozan',ist:1,yeni:1,m:[{gun:'Dün'},
   ['o','Selam! Doğa yürüyüşü paylaşımlarına bayıldım. Hafta sonu Nif Dağı\'nda yürüyoruz, gelmek ister misin?','16:03']]}];
/* Bildirimler (ÖRNEK): Ayşe'ye gelenler, en yeniden eskiye. Rezervasyon
   hatırlatmaları (yaklaşan tur, kalan ödeme, değerlendirme) burada değil,
   rezervasyonlardan hesaplanır (api.js listNotifs).
   tur: begeni | yorum | bahset | takip | davet | istek | gezgin | indirim | puan | seviye
   k: kişiler (USERS), n: öteki kişilerin sayısı, post: paylaşım id, urun: ürün adı,
   ne: ne zaman, g: bugun | hafta | once, oku:1 zaten okunmuş */
export const BILDIRIM=[
 {id:'n1',tur:'begeni',k:['selin','mert'],n:246,post:'a1',ne:'12 dk',g:'bugun'},
 {id:'n2',tur:'yorum',k:['deniz'],post:'a1',metin:'Fotoğraflar harika! Hangi ayda gittiniz?',ne:'2 sa',g:'bugun'},
 {id:'n3',tur:'istek',k:['ceren'],ne:'3 sa',g:'bugun'},
 {id:'n4',tur:'takip',k:['ceren'],ne:'3 sa',g:'bugun'},
 {id:'n5',oku:1,tur:'davet',k:['mert'],urun:'Alaçatı Rüzgar Sörfü Dersi',ne:'Dün',g:'hafta'},
 {id:'n6',oku:1,tur:'bahset',k:['elif'],post:'p3',metin:'@ayse.molada bir dahakine sen de gel!',ne:'Dün',g:'hafta'},
 {id:'n7',oku:1,tur:'indirim',urun:'Efes ve Şirince Turu',ne:'2 g',g:'hafta'},
 {id:'n8',oku:1,tur:'gezgin',ne:'3 g',g:'hafta'},
 {id:'n9',oku:1,tur:'begeni',k:['zeynep','kaan'],n:39,post:'a2',ne:'4 g',g:'hafta'},
 {id:'n10',oku:1,tur:'takip',k:['burak'],ne:'5 g',g:'hafta'},
 {id:'n11',tur:'puan',urun:'Kapadokya Turu',puan:179,ne:'16 Eyl',g:'once'},
 {id:'n12',tur:'seviye',ne:'16 Eyl',g:'once'}];
