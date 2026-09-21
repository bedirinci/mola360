# İçerik kataloğu (`assets/js/catalog.js`)

İçerik sayfası olan her kayıt — tur, otel, aktivite, etkinlik, mekân —
anasayfada **kendiliğinden** görünür. Bu belge mekanizmayı ve
neden böyle kurulduğunu anlatıyor.

## Sorun

Anasayfadaki bütün listeler `app.js`'teki `cardSections`'tan besleniyor:
şeritler, kategori sonuçları ve arama ekranı. İçerik sayfası olan bir
kayıt oraya **elle** yazılıyordu ve bu iki şeyi bozuyordu.

**1. Sayfa var ama siteden görünmüyor.** Yeni bir tur/otel sayfası
yazmak iki dosyaya dokunmayı gerektiriyordu: kaydın kendisi ve
`app.js`. İkincisi unutulursa sayfa yayında duruyor ama siteden hiçbir
yerden ulaşılamıyordu.

**2. Kart eskiyor.** Kartta yazan fiyat, puan, yorum sayısı ve tarih
kayıttan **kopyalanmıştı**. Kayıt değişince kart olduğu yerde kalıyordu.
Somut örnekler bu işte bulundu:

| Kartta yazan | Gerçek |
|---|---|
| Kapadokya kartında `meta2:'20 Ekim, Salı'` | Sabit tarih; kalkış takvimiyle ilgisi yok, bugünden önce de olabilir |
| Otel kartında `meta2:'Bugün'` | Otel aynı gün giriş satmıyor (`leadDays: 1`), en erken yarın |

İkisi de "yanlış" değil, **eski**. Elle yazılmış bir kopyanın kaderi bu.

## Çözüm

`catalog.js` kayıtları okuyup anasayfanın kart biçimine çeviriyor ve
`cardSections`'a karıştırıyor:

```
tour-data.js ─┐
              ├─→ catalog.js ─→ cardSections ─→ şeritler
hotel-data.js ┘                              ├─→ kategori sonuçları
                                             └─→ arama ekranı
```

Anasayfanın üç listesi de aynı diziden beslendiği için kayıt **üçüne
birden** giriyor; ayrıca bir iş yapmak gerekmiyor.

`app.js` içindeki tek satır:

```js
if (typeof mergeCatalogCards === 'function') mergeCatalogCards(cardSections);
```

Koşul, katalogu yüklemeyen sayfalar için: tur ve otel içerik sayfaları
`app.js`'i yüklüyor ama katalogu yüklemiyor, orada satır sessizce
atlanıyor.

## Kart nereden geliyor

| Alan | Kaynak |
|---|---|
| `href` | `tur/<slug>/` · `otel/<slug>/` — kaydın slug'ı |
| `priceMain` | turda `basePrice()`, otelde en ucuz odanın gecelik ücreti |
| `rating` | turda yorum ortalaması (5), otelde `hotelScore` (10) |
| `reviews` | yorum dağılımının toplamı, kısaltılmış ("1,2b+") |
| `meta2` | turda kalkış takviminin ilk günü, otelde en erken giriş günü |
| `inDays` / `dayKey` | aynı tarihten; "Yaklaşan Planlar" sıralaması ve gün filtresi |
| `img`, `title`, `badges`, `meta1` | kaydın kendi `card` alanı |

İlk altısı **türetiliyor**, yani elle yazılamıyor, dolayısıyla
eskiyemiyor. Son satırdakiler türetilemez:

```js
card: {
  img: 'efes',                                   // anasayfanın görsel anahtarı
  title: 'Efes Antik Kenti ve Şirince Turu',     // dar karta sığan kısa ad
  badges: ['Günübirlik'],
  meta1: 'İzmir Çıkışlı · Rehberli · Yemek Dahil'
}
```

`title` isteğe bağlı: yazılmazsa kaydın tam başlığı kullanılıyor. Kısa ad
var çünkü kartın başlığı iki satır; "Efes Antik Kenti, Meryem Ana Evi ve
Şirince Turu" orada üç satıra taşıyor.

### Yorum sayısı neden kısaltılıyor

"1.247 değerlendirme" kart genişliğine sığmıyor ve o hassasiyetin kartta
bir değeri yok. Yuvarlama **her zaman aşağı**: kart hiçbir zaman
olduğundan fazla yorum olduğunu söylemiyor (`1247 → 1,2b+`,
`974 → 970+`). Test bunu bütün eşik değerlerinde ölçüyor.

### Tarih neden iki biçimde

Yakın günler gün adıyla ("Yarın", "Bu Cumartesi"), uzak günler tarihle
("20 Ekim, Salı"). "Bu Cumartesi" 34 gün sonrası için anlamsız, "20
Ekim, Salı" da yarın için gereksiz.

Hafta sonu filtreleri (`Bu Cuma / Bu Cumartesi / Bu Pazar`) yalnızca bu
haftanın o gününü kapsıyor: iki hafta sonraki cumartesi o filtreye
düşerse filtre yalan söyler.

## Kayıtlı türler

| Şerit | Kaynak | Not |
|---|---|---|
| Günübirlik Turlar | `TOURS`, `type: 'daily'` | |
| Konaklamalı Turlar | `TOURS`, `type: 'stay'` | |
| Oteller | `HOTELS` | |
| Aktiviteler | `ACTIVITIES` | |
| Popüler Etkinlikler | `EVENTS` | Sezonu biten etkinlik kart üretmiyor |
| Popüler Mekanlar | `PLACES` | Kart açık/kapalı durumunu da taşıyor |
| Yaklaşan Planlar | `TOURS` + `EVENTS` | Otel, aktivite ve mekan burada **yok**: hiçbirinin yaklaşan tek bir tarihi yok — biri her gün açık, biri her sabah yapılıyor, biri çalışma saatlerinde açık. Şerit türü değil zamanı gösteriyor; etkinliğin sayılı temsilleri olduğu için o burada. |

### Kart üretici `null` dönebilir

Sezonu bitmiş bir etkinlik anasayfada görünmemeli. Kütükteki satır
duruyor (kayıtlar yüklü), ama kart üretici o kayıt için `null` dönüyor
ve `catalogCards` onu atlıyor. Geçmiş bir festivali "yaklaşan" diye
kartta tutmak, elle yazılmış kartların düştüğü tuzağın ta kendisi
olurdu.

### Kart bir tür için fazladan alan taşıyabilir

Mekan kartı diğerlerinden bir alan fazla üretiyor: **açık/kapalı
durumu** (`open`, `hours`, `venueType`, `area`). Şeridin kendi
işaretlemesi bu alanları zaten bekliyordu — elle yazılmış mekan
kartlarında da durum yazıyordu, ama sabit bir metin olarak. Katalog
kartı aynı alanları **kayıttan ve o andaki saatten** dolduruyor.

Ortak alanlar (fiyat, puan, yorum, tarih) her türde aynı; fazladan
alanlar yalnızca o şeridin işaretlemesinin okuduğu yerde duruyor. Kart
üreticisi saf fonksiyon olduğu için bu alanlar da doğrudan testli
(`tests/venue.test.js`).

## Yeni içerik türü eklemek

Kütüğe bir satır:

```js
{ anchor: 'etkinlikler', kayitlar: () => EVENTS, kart: eventCatalogCard }
```

| Alan | Anlamı |
|---|---|
| `anchor` | anasayfadaki şeridin çapası (`app.js`/`cardSections`) |
| `kayitlar` | kayıt nesnesini döndürür; **yüklü değilse satır atlanır** |
| `filtre` | aynı kümeden yalnızca bazı kayıtlar bu şeride giriyorsa |
| `kart` | kaydı anasayfa kartına çeviren saf fonksiyon |

Aynı kayıt birden çok şeride girebilir: turlar hem kendi kategorisinde
hem "Yaklaşan Planlar"da. Otel orada yok, çünkü sabit bir tarihi yok —
şerit türü değil **zamanı** gösteriyor.

"Yüklü değilse atlanır" kuralı, katalogu yükleyip o veri dosyasını
yüklemeyen bir sayfanın patlamaması için. Testi var.

## Eksik veri dosyası: bir kez kırıldı

Aktivite sayfası eklenirken anasayfa `activity-data.js`'i yüklemiyordu
ve `catalog.js` **yüklenirken** ölüyordu:

```
Uncaught ReferenceError: activityPriceFrom is not defined
```

Sebep, yardımcıların dosyanın en üstünde çözülmesiydi:

```js
const kAktiviteFiyat = KATALOG_AKTIVITE_VERI ? KATALOG_AKTIVITE_VERI.activityPriceFrom
                                             : activityPriceFrom;   // <-- burada patlıyor
```

Sonuç, eksik olan tek türün değil, anasayfadaki **bütün** türetilmiş
kartların birden kaybolmasıydı — kütüğün "kayıt kümesi yüklü değilse
satır atlanır" sözü, satıra hiç gelinemediği için işe yaramıyordu.

Çözüm: çözümleme **tembel ve korumalı** (`katalogYardimci`). Ad
modülde de genel kapsamda da yoksa `null` dönüyor; o kaynağın kayıtları
zaten yüklü olmadığı için satır sessizce atlanıyor ve diğer türler
çalışmaya devam ediyor.

`tests/katalog.test.js` bunu tarayıcıyı taklit ederek ölçüyor: dosyalar
tek bir kapsamda peş peşe çalıştırılıyor (klasik `<script>` etiketleri
gibi) ve otel ile aktivite verisi bilerek yüklenmiyor — katalog
yüklenirken patlamıyor, turlar üretilmeye devam ediyor, diğer şeritler
boş dönüyor.

**Düzeltmenin kendisi ikinci bir hata doğurdu.** `globalThis` araması
`const` ile tanımlanmış adları **bulamaz** — globalThis'e yalnızca
`function` bildirimleri yazılır. `GUNLER_TR` bulunamayınca anasayfadaki
kartın tarihi **"Bu undefined"** oldu; Node'da adlar modülden geldiği
için testler görmedi, tarayıcıda görüldü.

Şimdiki çözüm ikisini birden kapatıyor: **`typeof` ile korunmuş doğrudan
ad**. `typeof` tanımsız bir ad için hata atmaz, `const` bağlamalarını da
görür. Aynı vm testi artık gün adının çözüldüğünü de ölçüyor
(`cardDateText` → "Bu Cumartesi"); mutasyonla doğrulandı.

## Ad çakışması: tek kapsamın ikinci tuzağı

Mekan kayıtları önce `VENUES` adıyla yazıldı. `home-blocks.js` **zaten**
`VENUES` adlı bir dizi tutuyor (şeritteki gezilecek yer kartları).
Anasayfadaki bütün betikler klasik `<script>` ile **tek bir kapsama**
yükleniyor: ikinci `const VENUES` tanımı `SyntaxError` atardı ve bu kez
tek bir tür değil, anasayfanın **tüm** betikleri düşerdi.

Eksik dosya hatasıyla aynı kökten: tek kapsam, Node'un modül sınırlarını
vermiyor. Testler de aynı sebeple göremezdi — vitest'te her dosya kendi
modülü, adlar çakışmıyor.

Ad `PLACES` oldu. `tests/katalog.test.js` artık anasayfanın **bütün**
betiklerini `node:vm` ile tek kapsamda çalıştırıp çakışma olmadığını
ölçüyor; `tests/venue.test.js` de veri dosyasında `const PLACES` arıyor.
İkisi de `PLACES`'ı `VENUES` yapan bir mutasyonla doğrulandı.

Yeni bir veri dosyası eklerken kural: **dışa açılan her üst düzey ad,
anasayfaya yüklenen diğer dosyalardaki adlarla çakışmamalı.** vm testi
bunu kendiliğinden yakalıyor.

## Kopya koruması

Türetilmiş kartlar şeridin **başına** giriyor: içerik sayfası olan
kayıt, sayfası olmayan örnek kartın önünde durmalı.

Elle yazılmış bir kart aynı adresi **ya da** aynı başlığı taşıyorsa
düşüyor. Bu bir güvenlik ağı: aynı otelin iki kez görünmemesi, elle
yazılmış satırın silinmiş olmasına bağlı kalmıyor.

## Aramadan içerik sayfasına geçiş

Arama sonuçlarının hepsi `<button>`'dı ve tıklayınca yalnızca arama
kutusuna başlığı yazıyordu — yani **içerik sayfası olan bir kayda
aramadan ulaşılamıyordu**. Artık sayfası olan sonuç gerçek bir `<a>`:
tıklayınca sayfa açılıyor. Sayfası olmayan örnek kartlar eskisi gibi
aramayı dolduruyor.

Bağın öneki `<body data-root>` değerinden geliyor; anasayfada nitelik
yok, önek boş kalıyor.

İşaretleme tek yerde (`searchResultMarkup`): aynı kart üç ayrı yerde
(öne çıkanlar, kategori sonuçları, arama sonuçları) ayrı ayrı basılıyordu
ve üç kopya birbirinden ayrışabiliyordu.

**Sonuç kartındaki tür etiketi** artık kayıttan geliyor (`type: 'Tur'`).
Önceden şeridin başlığından tahmin ediliyordu ve katalog bir turu
"Yaklaşan Planlar"a da koyduğu için o şeritte aynı tur "Etkinlik" diye
etiketleniyordu.

## Kompakt kart da tıklanabilir

"Yaklaşan Planlar" şeridinde kompakt kart kullanılıyor ve onda bağ
desteği yoktu. Aynı tur hem kendi şeridinde hem orada duruyor; birinde
tıklanıp diğerinde tıklanmaması olmazdı. Kompakt kart da artık başlıkta
gerçek bir `<a>` ve kartın tamamında `data-href` taşıyor.

## Bedeli

Anasayfa artık beş veri dosyasını da yüklüyor — `tour-data.js`,
`hotel-data.js`, `activity-data.js`, `event-data.js`, `venue-data.js`
(kart için gereken alanlar o kayıtların içinde). Bu, anasayfaya
sıkıştırılmamış ~220 KB ekliyor ve kayıtların çoğu (program, yorumlar,
SSS, menü) anasayfada kullanılmıyor. Her yeni içerik türü bu sayıyı
büyütüyor; altıncı türde tekrar bakılmalı.

Şimdilik kabul edildi: tek kaynak olmasının değeri, bu boyuttan büyük.
Envanter bir sunucudan gelmeye başladığında doğru çözüm, kart alanlarını
taşıyan küçük bir katalog dosyasının **üretilmesi** olur; o zaman
anasayfa yalnızca onu yükler. Elle yazılan ikinci bir liste tutmak ise
bu belgenin başındaki soruna geri dönmek demektir.

## Ölçülenler

Chromium, dış ağ kesik (390×844 ve 1440×900):

- Şeritler: Efes "Günübirlik Turlar"da, Kapadokya "Konaklamalı
  Turlar"da, Kordon Butik Otel "Oteller"de; ikisi de "Yaklaşan
  Planlar"da. 35 kartın hiçbir şeridinde kopya yok.
- Karttaki tarihler kayıttan: "Yarın" (Efes, ertesi gün kalkış),
  "Bu Perşembe" (Kapadokya), "Yarın" (otel, `leadDays: 1`).
- Arama ekranında "kordon" araması otel sayfasına giden bir bağ
  veriyor; tıklandığında `/otel/kordon-butik-otel/` açılıyor.
- "Oteller" kategorisi seçilince sonuçların başında Kordon Butik Otel
  çıkıyor.
- "Popüler Mekanlar" şeridinde Kum Beach Club ve Kordon Spa & Masaj,
  elle yazılmış mekan kartlarının **önünde** ve durumları canlı
  ("Açık"); "beach" araması `/mekan/kum-beach-club/`'a giden bir bağ
  veriyor.
- Konsolda hata yok, yatay taşma yok.
