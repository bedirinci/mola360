# Görsel kaynakları

## Yöntem

Bu ortamın ağ politikası görsel sunucularına erişimi engelliyor, yani bir
fotoğrafın içeriği **açılıp görülerek** doğrulanamadı. Bunun yerine
konuya göre internette araştırma yapıldı ve Wikimedia Commons seçildi.
Sebebi şu: Commons'ta **dosya adı konuyu anlatır**. `Ephesus Celsus
Library Façade.jpg` adlı dosyanın Efes'teki Celsus Kütüphanesi'nin
cephesini gösterdiği adından bellidir. Unsplash kimlikleri
(`photo-1564501049412-61c2a3083791`) ise hiçbir anlam taşımaz; içeriği
açmadan bilinemez.

Adresler `Special:FilePath` ile kuruluyor:

```
https://commons.wikimedia.org/wiki/Special:FilePath/<Dosya_Adi>?width=800
```

Bu adres dosya adından deterministik olarak üretilir ve Commons doğru
boyuttaki küçük görsele yönlendirir. API anahtarı gerekmez.

## Eklenen görseller

| Anahtar | Dosya | Kullanıldığı yer |
|---|---|---|
| `efes` | `Ephesus Celsus Library Façade.jpg` | Efes Antik Kent mekânı, Efes turu |
| `kemeralti` | `Kemeraltı market 02.jpg` | Kemeraltı Çarşısı mekânı |
| `izmirKordon` | `Izmir Alsancak Kordon 6339.jpg` | Kordon Boyu mekânı |
| `izmirKonak` | `Izmir Konak Square.jpg` | Saat Kulesi ve Konak Meydanı mekânı |
| `izmirMuze` | `İzmir Archaeological Museum 2462 1.jpg` | İzmir Arkeoloji Müzesi mekânı |
| `alacati` | `Alaçatı değirmenler 01.jpg` | Alaçatı Taş Sokaklar mekânı |
| `aspendos` | `Aspendos Turkey.JPG` | Aspendos Opera ve Bale Festivali |
| `erciyes` | `Erciyes Dağı Kayseri.JPG` | Erciyes Kayak Haftası |

## Bunlar hangi sorunu çözdü

Önceden tek bir fotoğraf birbiriyle ilgisiz iki konuya hizmet ediyordu.
Artık her konunun kendi fotoğrafı var:

| Anahtar | Önce | Sonra |
|---|---|---|
| `bodrum` | Bodrum tekne turu **ve** İzmir Kordon | yalnız Bodrum turu |
| `market1` | Alaçatı pazar turu **ve** Kemeraltı | yalnız pazar turu |
| `iznik` | İznik turu **ve** Konak Meydanı | yalnız İznik turu |
| `ege2` | Ege adaları turu **ve** Arkeoloji Müzesi | yalnız Ege turu |
| `cunda2` | Cunda turu **ve** Alaçatı | yalnız Cunda turu |
| `theatre1` | Tiyatro **ve** Aspendos | yalnız tiyatro |
| `kayak3` | Uludağ kayak **ve** Erciyes | yalnız Uludağ |

## Yayına almadan önce yapılması gerekenler

**1. Lisans ve yazar doğrulaması.** Commons dosyalarının çoğu CC BY veya
CC BY-SA lisanslıdır ve **yazar adının belirtilmesini** ister. Sayfadaki
"Görseller: Wikimedia Commons" satırı her dosyanın kendi sayfasına
bağlanıyor; yazar ve lisans orada yazılı. Ancak bu ortamdan o sayfalar
açılamadığı için **yazar adları ve lisans türleri doğrulanmadı**. Ticari
kullanımdan önce sekiz dosyanın her biri açılıp yazar adı ve lisans
sayfaya yazılmalıdır. Bilinen tek örnek: `Kemeraltı market 02.jpg` —
Francisco Anzola, CC BY 2.0.

**2. Kendi sunucunuza alın.** Commons'tan doğrudan bağlantı (hotlink)
düşük trafikte çalışır ama Wikimedia bunu üretim için önermez. Görseller
indirilip `assets/img/` altına konmalı ve WebP'ye çevrilmelidir. Bu aynı
zamanda sayfa hızını da artırır.

**3. Görselleri bir kez gözle kontrol edin.** Dosya adı konuyu anlatıyor
ama kadraj, çözünürlük ve en-boy oranı görülmeden bilinemez. Özellikle
dikey çekilmiş fotoğraflar yatay kartlarda kötü kırpılabilir.

## Geri kalan görseller

Unsplash'ten gelen diğer kayıtlar olduğu gibi duruyor; hangi anahtarın
hangi konuyu göstermesi gerektiği `docs/gorsel-ihtiyaclari.md` içinde
yazılı. Onlar da aynı yöntemle tek tek değiştirilebilir.


## İkinci tur: ölü URL'ler ve yedek mekanizma hatası

Kullanıcı ekran görüntüsü gönderdi ve iki kart tarayıcının kırık görsel
simgesiyle ("?") görünüyordu. Bu, tahmin değil **kanıt**:

| Anahtar | Kart | Durum |
|---|---|---|
| `standup1` | Stand Up Gecesi | Unsplash URL'i ölü |
| `sile` | Şile Kamp Deneyimi | Unsplash URL'i ölü |

### Asıl hata: yedek mekanizma hiç çalışmıyordu

`ui.js` içindeki yedek, dinleyicileri `DOMContentLoaded` anında tek tek
her `<img>` etiketine bağlıyordu. İki kusuru vardı:

1. **Yarış durumu.** 404 yanıtı çoğu zaman `DOMContentLoaded`'dan önce
   döner. Dinleyici takıldığında hata çoktan geçmiştir, bir daha
   tetiklenmez — kart kırık simgeyle kalır. Ekran görüntüsündeki durum
   tam olarak budur.
2. **Sonradan üretilen kartlar.** JS ile sonradan eklenen `<img>`
   etiketlerine dinleyici hiç bağlanmıyordu.

**Çözüm:** `document` üzerinde **yakalama (capture) aşamasında** tek bir
dinleyici. `error` olayı baloncuklanmaz ama capture aşamasında
`document`'e ulaşır, böylece sonradan eklenen görseller de kapsanır.
Ayrıca sayfa yüklendiğinde `img.complete && img.naturalWidth === 0`
olanlar taranarak dinleyici bağlanmadan önce bozulmuş olanlar yakalanır.

**Yedek görsel değişti.** Eskiden ölü bir URL'in yerine uzaktaki genel
bir seyahat fotoğrafı konuyordu. Bu, sorunu çözmüyor **gizliyordu**:
alakasız bir fotoğraf gösteriliyor, kimse bir şeyin bozuk olduğunu fark
etmiyordu. Artık yerel, gömülü (data URI) ve nötr bir yer tutucu var —
asla 404 vermez ve gerçek fotoğraf gibi durmaz.

Ölçüm (390×844, bu ortamda tüm uzak görseller başarısız): 104 görselin
**0'ı kırık**, 82'si yer tutucuya düşüyor. Düzeltmeden önce bu 82'si
tarayıcının kırık simgesiyle görünürdü.

### Bu turda değiştirilen görseller

Ölü olanlar ve adı geçen yerler Commons'a taşındı:

| Anahtar | Dosya |
|---|---|
| `sile` | Şile sahil panorama.jpg |
| `standup1` | Stand-up comedy - Stage.jpg |
| `pamukkale` | Pamukkale Travertines.jpg |
| `bodrum` | Bodrum Hafen.jpg |
| `kapadokya` | Hot air balloons in Cappadocia.jpg |
| `balloon3` | Hot air balloon ride at sunrise in Cappadocia 2.JPG |
| `ayder` | Ayder Yaylasi @ Rize-Turkey.JPG |
| `bogaz` | Bosphorus Bridge, Istanbul - Turkey.jpg |
| `abant2` | Abant Bolu Province.jpg |
| `uludag` | View of Bursa from the hills of Mount Uludag.jpg |

Bilinen lisanslar: `Stand-up comedy - Stage.jpg` — Carlos Delgado,
CC BY-SA 3.0. `Kemeraltı market 02.jpg` — Francisco Anzola, CC BY 2.0.
Diğerleri yayına almadan önce doğrulanmalı.

### Hâlâ Unsplash'te kalanlar

`efes` dışındaki antik/doğa görselleri değişti; geriye kalanlar:
`concert1`, `concert2`, `festival1`, `theatre1`, `market1`, `run1`,
`coffee1`, `assos`, `iznik`, `iznik2`, `kapadokya2`, `karadeniz2`,
`ege2`, `dogu2`, `sapanca2`, `cunda2`, `rafting3`, `paraglide3`,
`kayak3`, `hotel4`–`hotel7`.

Bunlar ekran görüntüsünde bozuk görünmüyordu, yani URL'leri çalışıyor.
Konu uyumu doğrulanamadı; biri yanlışsa anahtarını söylemek yeterli,
aynı yöntemle Commons'tan değiştirilir.


## Üçüncü tur: tur içerik sayfasının görselleri

`tur.html` için altı yeni kayıt eklendi. Bunlar `app.js`'teki
`cardImages`'te değil, `assets/js/tour-data.js` içindeki
`TOUR_IMAGE_FILES` içinde duruyor; adres iki dosyada da aynı yöntemle
(`Special:FilePath`) dosya adından üretiliyor, yani aynı fotoğraf iki
farklı adrese gitmiyor. `tests/tour.test.js` ortak anahtarlarda
(`pamukkale`, `alacati`, `bodrum`, `kemeralti`) iki dosyanın birebir aynı
adresi ürettiğini doğruluyor.

| Anahtar | Dosya | Durum |
|---|---|---|
| `efesKutuphane` | `Ephesus Celsus Library Façade.jpg` | Zaten kullanımdaydı (`efes`) |
| `efesTiyatro` | `Ephesus Great Theatre.jpg` | **Doğrulanmadı** |
| `efesYamacEvler` | `Terrace Houses Ephesus.jpg` | **Doğrulanmadı** |
| `meryemAna` | `House of the Virgin Mary Ephesus.jpg` | **Doğrulanmadı** |
| `artemis` | `Temple of Artemis Ephesus.jpg` | **Doğrulanmadı** |
| `sirince` | `Sirince Izmir Turkey.jpg` | **Doğrulanmadı** |

"Doğrulanmadı" şu demek: bu ortamın ağ politikası
`commons.wikimedia.org`'a CONNECT'i 403 ile reddediyor, dosyanın gerçekten
o adla var olduğu **kontrol edilemedi**. Ad yanlışsa sayfa bozulmaz —
`ui.js`'teki yedek görseli nötr yer tutucuya düşürür, tarayıcının kırık
resim simgesi çıkmaz. Yanlış olanın anahtarını söylemek yeterli:
`TOUR_IMAGE_FILES` içinde tek satır değişir.

Yayına almadan önce bu belgenin başındaki üç madde (lisans/yazar
doğrulaması, kendi sunucuya alma, gözle kontrol) bu altı dosya için de
geçerli.


## Dördüncü tur: konaklamalı tur sayfasının görselleri

`tur/kapadokya-3-gece/` için dört yeni kayıt. İki kayıt (`kapadokyaBalon`,
`balonUcus`) zaten `cardImages` içinde kullanılan dosyaları gösteriyor;
dosya adları birebir aynı, adres iki yerde de `Special:FilePath` ile
üretiliyor.

| Anahtar | Dosya | Durum |
|---|---|---|
| `kapadokyaBalon` | `Hot air balloons in Cappadocia.jpg` | Zaten kullanımdaydı (`kapadokya`) |
| `balonUcus` | `Hot air balloon ride at sunrise in Cappadocia 2.JPG` | Zaten kullanımdaydı (`balloon3`) |
| `goreme` | `Goreme Open Air Museum.jpg` | **Doğrulanmadı** |
| `ihlara` | `Ihlara Valley.jpg` | **Doğrulanmadı** |
| `derinkuyu` | `Derinkuyu Underground City.jpg` | **Doğrulanmadı** |
| `uchisar` | `Uchisar Castle Cappadocia.jpg` | **Doğrulanmadı** |

Doğrulanmama sebebi öncekiyle aynı: ağ politikası
`commons.wikimedia.org`'a CONNECT'i 403 ile reddediyor. Ad yanlışsa
`ui.js`'teki yedek nötr yer tutucuya düşürür, kırık resim simgesi çıkmaz.

Böylece doğrulanması gereken dosya sayısı dokuza çıktı: Efes turundan
beş (`efesTiyatro`, `efesYamacEvler`, `meryemAna`, `artemis`, `sirince`),
Kapadokya turundan dört. Hepsi `TOUR_IMAGE_FILES` içinde tek satır.


## Beşinci tur: otel içerik sayfasının görselleri

`otel/kordon-butik-otel/` için `assets/js/hotel-data.js` içinde
`HOTEL_IMAGE_FILES` adlı üçüncü bir kayıt seti açıldı. Adres yine
`Special:FilePath` ile dosya adından üretiliyor; `TOUR_IMAGE_FILES` ile
ORTAK olan anahtarlarda dosya adı birebir aynı yazıldı ve
`tests/hotel.test.js` iki dosyanın aynı adresi ürettiğini doğruluyor.

| Anahtar | Dosya | Durum |
|---|---|---|
| `kordonBoyu` | `Izmir Alsancak Kordon 6339.jpg` | Zaten kullanımdaydı (`izmirKordon`) |
| `izmirKonak` | `Izmir Konak Square.jpg` | Zaten kullanımdaydı |
| `kemeralti` | `Kemeraltı market 02.jpg` | Zaten kullanımdaydı (lisans bilinen tek dosya) |
| `izmirMuze` | `İzmir Archaeological Museum 2462 1.jpg` | Zaten kullanımdaydı |
| `goreme` | `Goreme Open Air Museum.jpg` | `TOUR_IMAGE_FILES` ile ortak |
| `otelOda` | `Hotel room with double bed.jpg` | **Doğrulanmadı** |
| `otelSuit` | `Hotel suite interior.jpg` | **Doğrulanmadı** |
| `otelTeras` | `Hotel rooftop terrace.jpg` | **Doğrulanmadı** |
| `otelKahvalti` | `Turkish breakfast.jpg` | **Doğrulanmadı** |
| `otelLobi` | `Hotel lobby.jpg` | **Doğrulanmadı** |
| `kemerMarina` | `Kemer Marina.jpg` | **Doğrulanmadı** |
| `termalYalova` | `Termal Yalova.jpg` | **Doğrulanmadı** |

Doğrulanmama sebebi öncekilerle aynı: ağ politikası
`commons.wikimedia.org`'a CONNECT'i 403 ile reddediyor.

**Bu turda bir fark var ve saklanmıyor.** Önceki turlarda dosya adları
belirli bir yeri (Efes, Şirince, Göreme) anlatıyordu; burada yedi kayıt
**genel** konuları anlatıyor (otel odası, kahvaltı, lobi). Genel adlı bir
dosyanın Commons'ta o adla var olma ihtimali, özel adlı bir dosyaya göre
daha düşük. Ad tutmazsa sayfa bozulmuyor — `ui.js`'in nötr yer tutucusu
devreye giriyor ve tarayıcının kırık resim simgesi çıkmıyor; tarayıcıda
ölçüldü. Yine de **otelin gerçek fotoğrafları bağlanana kadar bu yedi
kayıt geçici sayılmalı**: bir otel sayfasında stok fotoğraf, yanlış
fotoğraftan yalnızca bir adım iyidir.

Doğrulanması gereken dosya sayısı böylece dokuzdan on altıya çıktı.
Yayına almadan önce bu belgenin başındaki üç madde (lisans/yazar
doğrulaması, kendi sunucuya alma, gözle kontrol) bunlar için de geçerli.


## Altıncı tur: aktivite içerik sayfasının görselleri

`aktivite/kapadokya-balon-turu/` için `assets/js/activity-data.js`
içinde `ACTIVITY_IMAGE_FILES` adlı dördüncü kayıt seti açıldı. Yöntem
aynı: adres `Special:FilePath` ile dosya adından üretiliyor ve
`TOUR_IMAGE_FILES` ile ortak olan anahtarlarda dosya adı birebir aynı
yazıldı; `tests/activity.test.js` iki dosyanın aynı adresi ürettiğini
doğruluyor.

| Anahtar | Dosya | Durum |
|---|---|---|
| `kapadokyaBalon` | `Hot air balloons in Cappadocia.jpg` | Zaten kullanımdaydı |
| `balonUcus` | `Hot air balloon ride at sunrise in Cappadocia 2.JPG` | Zaten kullanımdaydı |
| `goreme` | `Goreme Open Air Museum.jpg` | Zaten kullanımdaydı |
| `uchisar` | `Uchisar Castle Cappadocia.jpg` | Zaten kullanımdaydı |
| `balonSisirme` | `Hot air balloon inflation Cappadocia.jpg` | **Doğrulanmadı** |
| `guvercinlik` | `Pigeon Valley Cappadocia.jpg` | **Doğrulanmadı** |
| `kizilVadi` | `Red Valley Cappadocia.jpg` | **Doğrulanmadı** |

Bu turda eklenen **üç** yeni dosyanın üçü de yer adı taşıyor (Güvercinlik
Vadisi, Kızıl Vadi) ya da konuyu doğrudan anlatıyor (balon şişirme);
otel turundaki genel adlı stok görsellere göre Commons'ta karşılığının
bulunma ihtimali daha yüksek. Yine de doğrulanamadı: ağ politikası
`commons.wikimedia.org`'a CONNECT'i reddediyor. Ad tutmazsa `ui.js`'in
nötr yer tutucusu devreye giriyor, kırık resim simgesi çıkmıyor.

Doğrulanması gereken dosya sayısı on altıdan on dokuza çıktı.


## Yedinci tur: etkinlik içerik sayfasının görselleri

`etkinlik/aspendos-opera-bale-festivali/` için `assets/js/event-data.js`
içinde `EVENT_IMAGE_FILES` adlı beşinci kayıt seti açıldı. Yöntem aynı.

| Anahtar | Dosya | Durum |
|---|---|---|
| `aspendos` | `Aspendos Turkey.JPG` | Zaten kullanımdaydı (`cardImages`) |
| `aspendosSahne` | `Aspendos theatre stage.jpg` | **Doğrulanmadı** |
| `aspendosGece` | `Aspendos theatre at night.jpg` | **Doğrulanmadı** |
| `opera` | `Opera performance on stage.jpg` | **Doğrulanmadı** |
| `bale` | `Ballet performance on stage.jpg` | **Doğrulanmadı** |
| `orkestra` | `Symphony orchestra in concert.jpg` | **Doğrulanmadı** |
| `kaleici` | `Kaleici Antalya.jpg` | **Doğrulanmadı** |

`tests/event.test.js` `aspendos` anahtarının `app.js`'teki `cardImages`
kaydıyla **birebir aynı adresi** ürettiğini doğruluyor; aynı fotoğraf iki
farklı adrese gitmiyor.

Bu turdaki altı yeni addan üçü yer adı taşıyor (Aspendos, Kaleiçi),
üçü genel sahne konusu (opera, bale, orkestra) — ikincilerin Commons'ta
o adla bulunma ihtimali daha düşük. Ad tutmazsa `ui.js`'in nötr yer
tutucusu devreye giriyor, kırık resim simgesi çıkmıyor.

Doğrulanması gereken dosya sayısı on dokuzdan yirmi beşe çıktı.


## Sekizinci tur: mekan içerik sayfasının görselleri

`mekan/kum-beach-club/` ve `mekan/kordon-spa-masaj/` için
`assets/js/venue-data.js` içinde `VENUE_IMAGE_FILES` adlı altıncı kayıt
seti açıldı. Yöntem aynı: adres `Special:FilePath` ile dosya adından
üretiliyor ve daha önceki setlerle ortak olan anahtarlarda dosya adı
birebir aynı yazıldı.

| Anahtar | Dosya | Durum |
|---|---|---|
| `alacati` | `Alaçatı değirmenler 01.jpg` | Zaten kullanımdaydı |
| `kemeralti` | `Kemeraltı market 02.jpg` | Zaten kullanımdaydı |
| `kordonBoyu` | `Izmir Alsancak Kordon 6339.jpg` | Zaten kullanımdaydı |
| `cesmePlaj` | `Cesme beach Izmir.jpg` | Zaten kullanımdaydı |
| `sezlong` | `Beach club sunbeds.jpg` | **Doğrulanmadı** |
| `beachBar` | `Beach bar at sunset.jpg` | **Doğrulanmadı** |
| `denizManzara` | `Aegean sea view Turkey.jpg` | **Doğrulanmadı** |
| `masajOda` | `Massage room in spa.jpg` | **Doğrulanmadı** |
| `spaKarsilama` | `Spa reception area.jpg` | **Doğrulanmadı** |
| `sicakTas` | `Hot stone massage.jpg` | **Doğrulanmadı** |
| `aromaYag` | `Aromatherapy massage oils.jpg` | **Doğrulanmadı** |

`tests/venue.test.js` dört ortak anahtarın önceki setlerle **birebir
aynı adresi** ürettiğini doğruluyor.

Bu turda eklenen yedi yeni adın hepsi **genel konu adı** (şezlong,
sahil barı, masaj odası…) — yer adı taşıyan dosyalara göre Commons'ta
o adla bulunma ihtimali en düşük grup bu. Mekan içeriğinin doğası gereği
böyle: bir beach club'ın iç mekânı, bir masaj odası Commons'ta yer adıyla
aranamıyor. Ad tutmazsa `ui.js`'in nötr yer tutucusu devreye giriyor,
kırık resim simgesi çıkmıyor.

Doğrulanması gereken dosya sayısı yirmi beşten otuz ikiye çıktı.
