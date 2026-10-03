# Aktivite içerik sayfası (`/aktivite/<slug>/`)

Anasayfadaki "Aktiviteler" şeridi bir listeydi; tıklanacak sayfa yoktu.
Bu belge sayfanın nasıl kurulduğunu, tur ve otel sayfalarından nerede
ayrıldığını ve gerçek envanter bağlandığında ne yapılacağını yazıyor.

Ortak kararlar `docs/tur-sayfasi.md` ve `docs/otel-sayfasi.md` içinde;
burada **farklar** var.

## Dosyalar ve sorumlulukları

| Dosya | Ne yapar |
|---|---|
| `aktivite/<slug>/index.html` | Sayfanın iskeleti, statik SEO bilgisi, bölüm kapları, `BreadcrumbList` |
| `assets/js/activity-data.js` | Aktivite kayıtları + saf hesaplar (paket, seans, katılım, tutar, hava iadesi) |
| `assets/js/activity-page.js` | Veriyi işaretlemeye çevirir, etkileşimleri bağlar |
| `assets/css/activity.css` | Yalnızca aktiviteye ait bileşenler: paket kartı, şart ızgarası, hava kutusu |
| `tests/activity.test.js` | Saf fonksiyonlar + sayfanın kendi kaydıyla tutarlılığı |

Sayfada görünen **hiçbir metin** `activity-page.js` içinde değil; test
paket adlarını, fiyatları, aktivite adını ve adresi işaretlemede arıyor
ve bulunmamasını bekliyor.

## Neden bu aktivite

Kapadokya turu balon uçuşunu zaten **2.990 TL'ye ek hizmet olarak**
satıyordu (`tour-data.js`, `addons.balon`). Aynı ürünün kendi sayfası
olunca iki kayıt arasında gerçek bir tutarlılık kuralı doğuyor:
`tests/activity.test.js` turun ek hizmet fiyatının aktivitenin en ucuz
paket fiyatıyla aynı olmasını şart koşuyor. Ayrışırlarsa müşteri turda
bir, sayfada başka bir rakam görür.

Kapadokya turunun etiketlerine de bu sayfaya giden bir bağ eklendi; bağ
hedefi diskte aranıyor (`tests/baglar.test.js`).

## Satılan şeyin ekseni

| | tur | otel | aktivite |
|---|---|---|---|
| Ne seçilir | tarih + kişi | tarih aralığı + oda + pansiyon | tarih + **seans** + **paket** + kişi |
| Fiyat birimi | kişi başı | oda başı gecelik | kişi başı |
| Bölümler | program, buluşma, dahil olanlar | odalar, olanaklar, konum, kurallar | paketler, program, buluşma, katılım |

Bu yüzden rezervasyon kartı ve hesap ayrı yazıldı. Sayfanın **kabuğu**
(galeri, künye, blok başlıkları, zaman çizgisi, ışık kutusu, özet
sayfası) `tour.css`'ten geliyor; gerekçe ve sınırları
`docs/otel-sayfasi.md` içinde.

## Fiyat kuralları

| Kalem | Kural |
|---|---|
| Yetişkin | seçilen paketin kişi başı fiyatı |
| Çocuk | paketin **kendi** çocuk tarifesi (6 – 11 yaş) |
| Seans | kalkışa göre kişi başı fark; **negatif olabilir** |
| Ek hizmet | bir kez (`booking`) ya da kişi başına (`guest`) |

**Seans farkı neden negatif olabiliyor.** Aynı sabahın iki kalkışı var:
gün doğumu kalkışı ve ondan sonraki ikinci tur. İkincisi daha ucuz, yani
fark eksi. Hesap bunu eksi tutarlı bir **indirim satırı** olarak basıyor
(`kind: 'discount'`), toplam geriliyor ve satır yeşil görünüyor. Farkı
sıfır olan seans için satır hiç basılmıyor — "0 TL fark" dökümü boşuna
uzatıyordu.

**Vergi satırı yok.** Otelde konaklama vergisi ayrı satırdı, çünkü
faturada da öyle görünüyor. Aktivite fiyatı KDV dahil tek tutar olarak
satılıyor. İki sayfanın farkı bilinçli ve testle sabit.

**Gece kavramı da yok**, dolayısıyla otelin üçüncü ek hizmet çarpanı
(`night`) burada yok. İki çarpan yetiyor.

### Katılım sınırları

`clampActivityParty` üç şeyi birden uyguluyor:

1. Tek rezervasyonda en fazla 8 kişi.
2. Seçilen paketin kapasitesi daha küçükse o geçerli — Özel Uçuş 4
   kişilik, genel sınır 8 olsa bile orada 4'ü geçemiyor.
3. **Refakatsiz çocuk kabul edilmiyor**: bir yetişkin en fazla iki
   çocuğa refakat edebilir. Bu sınır olmasaydı "1 yetişkin, 5 çocuk"
   gibi satılamayacak bir seçim hesaba girerdi.

Sınıra gelen sayaç düğmeleri pasifleşiyor ve nedeni altındaki satırda
yazıyor.

## Hava koşulu: iptalden ayrı bir şey

Aktivitede "iptal" iki ayrı durum ve karıştırılırsa sayfa yalan söyler:

| | Kim iptal etti | Sonuç |
|---|---|---|
| Misafir iptali | misafir | kademeli iade (72/24 saat) |
| Hava iptali | işletme, o sabah | **koşulsuz tam iade** |

Son 24 saatte misafir iptalinde iade yok; aynı saatte hava iptalinde tam
iade var. Bu yüzden hava iadesi **iade tablosunun içinde değil**, ondan
önce gelen kendi kutusunda (`.akt-hava`). Tablonun içine konsaydı "son
24 saat: iade yok" satırının yanında durur ve koşulsuzluğu kaybolurdu.

Oran kodda sabit değil, kayıtta: `cancellation.weatherRefund`. Kayıtta
değer yoksa **tam iade varsayılıyor** — eksik veri yüzünden misafirin
parasının yanması kabul edilemez. Üçü de ayrı test.

## Paket seçimi: tek durum, iki yüzey

Paket hem "Uçuş paketleri" bölümündeki karttan hem rezervasyon
kartındaki çipten seçiliyor, ama durum tek: `state.pack`. Kartlar her
seçimde yeniden çizilmiyor; yalnızca seçili rozeti, düğme metni ve kalan
yer satırı güncelleniyor.

Seçtikten sonra sayfa rezervasyon kartına fırlatılmıyor: listede kalıp
diğer paketlere bakmak isteyen misafir rahatsız oluyordu. Düğme ikinci
dokunuşta ("Rezervasyona git") götürüyor.

## Kalan yer

Veri kapısının kontenjan cevabından geliyor (`MolaVeri.musaitlik`,
docs/veri-sozlesmesi.md bölüm 6); birim **paket × seans**. Önceki sürüm sayıyı tarihin karma
değerinden üretiyordu (`activitySeatsLeft`). Seçili seansta paket doluysa
ya da sepete yer yetmiyorsa rezervasyon düğmesi pasifleşiyor; bütün
paketleri dolu seans ve bütün seansları dolu gün seçilemiyor.

## Anasayfa bağlantısı

Kart elle yazılmıyor: `assets/js/catalog.js` kaydı görüp "Aktiviteler"
şeridine kendisi koyuyor, kategori sonuçları ve arama ekranı da aynı
diziden besleniyor (`docs/icerik-katalogu.md`). Fiyat en ucuz paketin
kişi başı ücretinden, puan ve yorum sayısı yorum dağılımından, "müsait"
tarihi de `leadDays`'ten türetiliyor.

**Aktivite "Yaklaşan Planlar" şeridine girmiyor.** O şerit yaklaşan bir
tarihi olan içeriği gösteriyor; balon her sabah uçuyor, yani belirli bir
tarihi yok — otelde olduğu gibi.

**Sponsorluk türetilmiyor**, kaydın `card.sponsored` alanından geçiyor:
ticari bir anlaşma, veriden hesaplanacak bir şey değil. Kartın
anasayfadaki mevcut davranışı (puan yerine "Sponsorlu" rozeti) bu
sayede aynen korundu.

## Yapısal veri

Yalnızca `BreadcrumbList`. `Event`, `Offer` ve `AggregateRating`
**bilerek yok**: içerik gerçek envanter bağlanana kadar örnek; uydurma
fiyatı, müsaitliği ve puanı işaretlemek yanıltıcı yapısal veridir
(`docs/seo-arastirma.md`, madde 2). Ayrıca kalkış saati her sabah
kaydığı için sabit bir `startDate` işaretlemek ayrıca yanlış olurdu.

Gerçek envanter geldiğinde eklenecekler: `TouristAttraction` /
`Event` (gerçek kalkış saatleriyle), `Offer` (gerçek fiyat, para birimi,
`availability`), `AggregateRating` ve `Review`.

## Ölçülenler

Chromium, dış ağ kesik (390×844 ve 1440×900):

- Dokuz bölüm kabının hepsi dolu, menüde yedi sekme, üç paket kartı,
  altı katılım şartı kartı basılıyor.
- Varsayılan seçim (2 yetişkin, standart sepet, gün doğumu):
  **5.980 TL** = 2 × 2.990, ek satır yok.
- Konfor sepet + 1 çocuk + ikinci kalkış: **9.720 TL** =
  2×3.790 + 3.190 − 3×350. İndirim satırı eksi tutarla ve yeşil
  görünüyor.
- Hava kutusu "2.990 TL iade" yazıyor (tam iade), iade tablosundan önce
  duruyor.
- Rezervasyon özeti açıkken gövde `fixed`, Escape'te `relative`.
- İki genişlikte de yatay taşma yok, konsolda hata yok.
- Anasayfada kart "Sponsorlu" rozetiyle, 2.990 TL ve "Yarın" ile
  çıkıyor; mobil dokunuşta sayfa açılıyor.

## Bu işte yakalanan hata

İlk denemede anasayfa `activity-data.js`'i yüklemiyordu ve `catalog.js`
**yüklenirken** ölüyordu (`activityPriceFrom is not defined`). Sonuç,
eksik olan tek türün değil, anasayfadaki **bütün** türetilmiş kartların
birden kaybolmasıydı. Katalogdaki yardımcı çözümleme tembel ve korumalı
hâle getirildi; ayrıntı ve testi `docs/icerik-katalogu.md` içinde.

## Bilerek yapılmayanlar

- **Müsaitlik örnek veriden.** Kalan yer örnek rezervasyonlardan
  hesaplanıyor (`assets/js/inventory-data.js`); backend gelince gerçek
  rezervasyonlardan gelecek, sayfa değişmeyecek.
- **Hava durumu servisi bağlı değil.** Sayfa "hava koşuluna bağlı"
  diyor ve iade kuralını yazıyor; o sabahın tahminini göstermiyor.
  Gerçek tahmin göstermek, tutmadığında güveni bitirir.
- **İkinci aktivite sayfası yok.** `ACTIVITIES`'e kayıt eklemek ve
  `aktivite/<slug>/index.html` yazmak yeterli; testler yeni kaydı
  kendiliğinden kapsıyor.
