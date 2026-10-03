/* ÖRNEK VERİ. Ürün adları ve fiyatlar örnek katalogdan; kalkış tarihleri,
   etkinlik saatleri ve yurt dışı turları uydurma (docs/yeni-surum.md).
   Bu dosya ileride yerini tek veri katmanına (api.js) bırakacak. */
import { CLOCK } from './icons.js';

/* Görsel yer tutucu renk geçişleri (gerçek fotoğraf gelene kadar) */
export const G={kapadokya:'linear-gradient(160deg,#EBC79B,#B97648 48%,#5B6B92)',efes:'linear-gradient(160deg,#EDDFC2,#B8925B 50%,#6E93AE)',sapanca:'linear-gradient(160deg,#B7D79A,#4F8F5B 55%,#2D5570)',
ege:'linear-gradient(160deg,#9ED8EC,#2F8DBA 55%,#E9D6AE)',karadeniz:'linear-gradient(160deg,#A9CFA0,#3F7A52 50%,#475E7A)',dogu:'linear-gradient(160deg,#EEF2F7,#9AA9C2 45%,#6B3F3F)',
erciyes:'linear-gradient(160deg,#F1F4F9,#AFC2DA 50%,#40577E)',bogaz:'linear-gradient(160deg,#9CC7E4,#3A6FA5 55%,#223A66)',parasut:'linear-gradient(160deg,#BFE6F2,#43A7CF 50%,#2E7D5B)',
rafting:'linear-gradient(160deg,#A8D8C8,#2F8F86 55%,#35506E)',bodrum:'linear-gradient(160deg,#BDE7F0,#3796C0 55%,#F0E1BE)',kayak:'linear-gradient(160deg,#F3F6FA,#B8C8DE 50%,#5A6F93)',
pamukkale:'linear-gradient(160deg,#F7F8FA,#CFE3EE 45%,#79A9C6)',aspendos:'linear-gradient(160deg,#3A2F66,#8A4F7A 55%,#E0A060)',harbiye:'linear-gradient(160deg,#1C2640,#3A5F8A 55%,#9CC0DC)',
caz:'linear-gradient(160deg,#2B2140,#6E4A7E 55%,#D8A66A)',kahve:'linear-gradient(160deg,#E8D3B5,#8A5A3A 55%,#3E2A22)',goreme:'linear-gradient(160deg,#F0D2A8,#C08050 50%,#6D5C84)',
sealight:'linear-gradient(160deg,#9CD9EE,#2E8CB8 50%,#E7D7B0)',kordon:'linear-gradient(160deg,#9CC8E0,#3F86A8 50%,#E8D9B5)',termal:'linear-gradient(160deg,#DCEBEF,#7FB3BF 50%,#4E6E86)',
batum:'linear-gradient(160deg,#BFD9E8,#4F7FA8 50%,#2F4F4A)',midilli:'linear-gradient(160deg,#F2E6C8,#6FB3C9 50%,#2E6F8E)',balkan:'linear-gradient(160deg,#D9E3C8,#7C9A6A 45%,#5A4A3A)',
dubai:'linear-gradient(160deg,#F6DDB0,#D39A55 45%,#5B6E9A)',italya:'linear-gradient(160deg,#F1D9B8,#C0704A 50%,#5C7A5A)',ispanya:'linear-gradient(160deg,#F7D98A,#D0603A 50%,#7A3A4A)',fransa:'linear-gradient(160deg,#E4E8F2,#8FA3C8 45%,#4A4F7A)'};

/* Puanlar örnek katalogdaki 5'lik ortalamaların 10'luğa çevrilmiş hali; kalkış ve etkinlik tarihleri örnek.
   Yorum sayısı olmayan üründe puan gösterilmiyor, "Yeni" yazıyor. */
export const ITEMS=[
 {k:'Aktivite',b:'saat',t:'İstanbul Boğaz Turu',a:'Eminönü, İstanbul',facts:['2 saat','Standart paket'],p:650,g:'bogaz'},
 {k:'Mekân',b:'saat',t:'Kordon Spa & Masaj',a:'Alsancak, İzmir',facts:['Klasik masaj · 60 dk','Randevulu'],p:1200,s:9.5,c:346,g:'termal',u:'seans'},
 {k:'Etkinlik',b:'saat',t:'Kordon Caz Akşamları',a:'Kordon Açıkhava, İzmir',facts:['Cmt 3 Eki · 20:00','Genel giriş'],p:480,s:9.4,c:120,g:'caz',u:'bilet'},
 {k:'Aktivite',b:'saat',t:'Ölüdeniz Yamaç Paraşütü',a:'Fethiye, Muğla',facts:['20 dk uçuş','Tandem'],p:1450,s:9.8,c:1200,g:'parasut'},
 {k:'Etkinlik',b:'saat',t:'Stand Up Gecesi',a:'Jolly Joker, Ankara',facts:['Cum 2 Eki · 21:30','Genel giriş'],p:420,g:'harbiye',u:'bilet'},
 {k:'Aktivite',b:'saat',t:'Uludağ Kayak Dersi',a:'Uludağ, Bursa',facts:['2 saat','Özel ders'],p:750,s:9.0,c:330,g:'kayak'},
 {k:'Tur',b:'gun',t:'Efes ve Şirince Turu',a:'İzmir çıkışlı · rehberli',info:'Günübirlik',p:1290,old:1690,s:9.6,c:1200,g:'efes',dates:[['Per','1 Eki'],['Cmt','3 Eki'],['Paz','4 Eki']],more:'+12'},
 {k:'Mekân',b:'gun',t:'Kum Beach Club',a:'Alaçatı, Çeşme',facts:['Tam gün','Şezlong · 2 kişi'],p:1500,s:9.3,c:824,g:'bodrum',u:'min. harcama'},
 {k:'Aktivite',b:'gun',t:'Bodrum Tekne Turu',a:'Bodrum, Muğla',facts:['6 saat','Kalkış 10:30'],p:1150,g:'ege'},
 {k:'Etkinlik',b:'gun',t:'Çeşme Yaz Festivali',a:'Alaçatı Sahil, İzmir',facts:['Cmt 3 Eki · tüm gün','Günlük bilet'],p:650,s:9.2,c:310,g:'aspendos',u:'bilet'},
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
export const BUCKETS=[['saat',CLOCK,'Birkaç saat','Birkaç saate sığanlar'],['gun','1','gün','Bir güne sığanlar'],['hs','2–3','hafta sonu','Hafta sonuna sığanlar'],['uzun','4 +','gün','4 gün + uzun molalar']];
export const PL={Tur:'Turlar',Otel:'Oteller',Etkinlik:'Etkinlikler',Aktivite:'Aktiviteler','Mekân':'Mekânlar'};

/* Bölümler: etkinlik, otel, mekân */
export const EV=[['CUM','2','Konser','Harbiye Açıkhava Konserleri','21:00 · Harbiye, İstanbul',890,'harbiye'],
 ['CMT','3','Opera · Bale','Aspendos Opera ve Bale Festivali','20:30 · Aspendos, Antalya',420,'aspendos'],
 ['CMT','3','Caz','Kordon Caz Akşamları','20:00 · Alsancak, İzmir',480,'caz'],
 ['PAZ','4','Festival','İstanbul Kahve Festivali','11:00 · Maçka, İstanbul',290,'kahve']];
export const HT=[['★★★★★','Göreme Mağara Otel','Göreme, Nevşehir · Tarihi doku',9.4,96,'Kahvaltı dahil',2450,'goreme'],
 ['★★★★★','Sealight Resort','Kemer, Antalya · Denize sıfır',9.2,340,'Her şey dahil',2100,'sealight'],
 ['★★★★','Kordon Butik Otel','Alsancak, İzmir · Denize 120 m',8.9,214,'Kahvaltı dahil',1989,'kordon'],
 ['★★★★','Termal Vadi Resort','Termal, Yalova · Termal havuz',0,0,'Kahvaltı dahil',1590,'termal']];
export const VN=[{t:'Kordon Spa & Masaj',a:'Alsancak, İzmir · Masaj salonu',s:9.5,c:346,g:'termal',mode:'Randevulu',opts:[['Klasik masaj · 60 dk',1200],['Sıcak taş · 75 dk',1650]]},
 {t:'Kum Beach Club',a:'Alaçatı, Çeşme · Plaj kulübü',s:9.3,c:824,g:'bodrum',mode:'Masa ve şezlong',opts:[['Şezlong · 2 kişi',1500],['Sedir · 4 kişi',3000],['Loca · 8 kişi',9000]]}];

/* Yurt dışı bölümünün sırası */
export const ABO=['Ege Adaları Balayı Kaçamağı','İtalya: Roma, Floransa ve Venedik','Dubai Turu','Balkanlar: Saraybosna ve Mostar','İspanya: Barselona ve Madrid','Midilli Adası Kaçamağı','Fransa: Paris ve Loire Şatoları','Batum ve Acara Turu'];

/* Arama kutusu: sekmeye göre alan adları */
export const TABS={tur:['NEREYE','Şehir, bölge veya tur adı','NE ZAMAN','Ekim, esnek','KİŞİ','2 yetişkin','Molamı bul'],
 otel:['NEREYE','Şehir, bölge veya otel adı','GİRİŞ – ÇIKIŞ','2 – 4 Eki · 2 gece','ODA · KİŞİ','1 oda · 2 yetişkin','Otel bul'],
 etkinlik:['ŞEHİR','Tüm şehirler','NE ZAMAN','Bu hafta sonu','BİLET','2 bilet','Etkinlik bul'],
 aktivite:['NEREYE','Şehir veya aktivite','NE ZAMAN','Bu hafta sonu','KİŞİ','2 kişi','Aktivite bul'],
 mekan:['NEREYE','Şehir veya mekân adı','NE ZAMAN','Bugün','KİŞİ','2 kişi','Mekân bul']};
/* Popüler aramalar: seçili sekmeye göre değişir; dokununca "Nereye" alanına yazılır. */
export const POP={tur:['Yurt dışı','Güneydoğu','Karadeniz','Antalya','Kapadokya','Ege adaları','Balkanlar','Dubai'],
 otel:['Antalya','Bodrum','Kapadokya','Termal oteller','Sapanca','Çeşme','Kemer'],
 etkinlik:['İstanbul','İzmir','Konser','Festival','Tiyatro','Stand-up'],
 aktivite:['Yamaç paraşütü','Rafting','Tekne turu','Balon turu','Dalış','Kayak'],
 mekan:['Spa ve masaj','Beach club','Hamam','Brunch','Çeşme','Bodrum']};

/* Tam ekran menü: ürün türleri */
export const MENU=[['Turlar','tur','Günübirlik, hafta sonu, uzun'],['Oteller','otel','Butik, termal, resort'],
 ['Etkinlikler','etkinlik','Konser, festival, sahne'],['Aktiviteler','aktivite','Rafting, paraşüt, tekne'],
 ['Mekânlar','mekan','Spa, beach club'],['Fırsatlar','firsat','Kampanyalar']];

/* Güven şeridi açıklamaları */
export const TRUST={iptal:['Ücretsiz iptal','Çoğu tur, otel, etkinlik ve aktivitede belirli bir tarihe kadar ücretsiz iptal edebilirsin. Son iptal tarihi ürün sayfasında ve ödeme adımında yazar.'],
 taksit:['3 taksit, vade farksız','Anlaşmalı kredi kartlarıyla 3 taksite kadar vade farkı yok. Kartına göre diğer taksit seçenekleri ödeme adımında listelenir.'],
 kapora:['%20 kaporayla yer ayırt','Turlarda tutarın %20\'sini ödeyip yerini ayırtırsın, kalanını kalkıştan önce ödersin. Örneğin 8.990 TL\'lik Kapadokya turunda 1.798 TL.'],
 puan:['Molapuan · her rezervasyonda kazan','Her rezervasyonda puan kazanırsın; 1 puan = 1 TL olarak sonraki rezervasyonunda kullanılır. Gezgin, Kâşif ve Mola Ustası seviyelerinde avantajların artar.']};

/* Bağlan: ÖRNEK paylaşımlar. Kullanıcılar ve metinler uydurma; her paylaşım
   Mola360'daki bir ürüne (ürün adıyla) bağlı. "gitti": paylaşan kişi bu
   deneyimi Mola360'tan rezerve edip yaşamış (doğrulanmış katılımcı). */
export const USERS={
 deniz:{ad:'Deniz Aksoy',kul:'deniz.yolda',ini:'DA',renk:'#3A6FA5'},
 selin:{ad:'Selin ve Can',kul:'selinilecan',ini:'SC',renk:'#B0764A'},
 mert:{ad:'Mert Kaya',kul:'mertkampta',ini:'MK',renk:'#3E7A55'},
 elif:{ad:'Elif Demir',kul:'elif.mola',ini:'ED',renk:'#8A4F7A'},
 kaan:{ad:'Kaan Öztürk',kul:'kaanrota',ini:'KÖ',renk:'#2F8F86'},
 zeynep:{ad:'Zeynep Arslan',kul:'zeynepgezer',ini:'ZA',renk:'#C0704A'}};
export const POSTS=[
 {u:'selin',yer:'Göreme, Nevşehir',ne:'2 gün önce',g:'kapadokya',urun:'Kapadokya Turu',gitti:1,
  metin:'Gün doğumunda balonlar havalanırken terastaydık. Hayatımın en güzel sabahlarından biri.',beg:248,yor:31},
 {u:'mert',yer:'Fethiye, Muğla',ne:'5 saat önce',g:'parasut',urun:'Ölüdeniz Yamaç Paraşütü',gitti:1,
  metin:'Babadağ\'dan atladık, 20 dakika boyunca altımızda Ölüdeniz. Korkuyordum, bir daha yaparım.',beg:412,yor:58},
 {u:'elif',yer:'Alsancak, İzmir',ne:'Dün',g:'caz',urun:'Kordon Caz Akşamları',gitti:1,
  metin:'Kordon\'da gün batımı ve canlı caz. İzmir\'de cumartesi akşamı için daha iyisi yok.',beg:96,yor:12},
 {u:'deniz',yer:'Selçuk, İzmir',ne:'3 gün önce',g:'efes',urun:'Efes ve Şirince Turu',gitti:1,
  metin:'Rehberimiz Celsus Kütüphanesi\'ni öyle anlattı ki bir saat ayrılamadık. Şirince şarabı da bonus.',beg:173,yor:19},
 {u:'kaan',yer:'Manavgat, Antalya',ne:'1 hafta önce',g:'rafting',urun:'Köprülü Kanyon Rafting',gitti:0,
  metin:'Arkadaş grubuyla rafting, sonra nehir kenarında alabalık. Hafta sonu için birebir.',beg:134,yor:22},
 {u:'zeynep',yer:'Kemer, Antalya',ne:'4 gün önce',g:'sealight',urun:'Sealight Resort',gitti:1,
  metin:'Ekim\'de deniz hâlâ sıcak. Çocuklar havuzdan, biz plajdan çıkmadık.',beg:88,yor:9}];
