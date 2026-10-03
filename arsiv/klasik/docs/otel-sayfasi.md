# Otel içerik sayfası (`/otel/<slug>/`)

Anasayfadaki "Oteller" şeridi bir liste; bu sayfa konaklama kararının
verildiği yer. Belge sayfanın neden böyle kurulduğunu, tur sayfasıyla
neyi paylaşıp neyi paylaşmadığını ve gerçek envanter bağlandığında ne
yapılacağını yazıyor.

Tur sayfasının belgesi (`docs/tur-sayfasi.md`) burada tekrar edilmiyor;
ortak olan kararlar oradan geçerli, bu belge **farkları** anlatıyor.

## Dosyalar ve sorumlulukları

| Dosya | Ne yapar |
|---|---|
| `otel/<slug>/index.html` | Her otelin kendi sayfası: iskelet, statik SEO bilgisi, bölüm kapları, `BreadcrumbList` |
| `assets/js/hotel-data.js` | Tüm otellerin içeriği + saf hesaplar (gece, oda, pansiyon, vergi, puan) |
| `assets/js/hotel-page.js` | Veriyi işaretlemeye çevirir, etkileşimleri bağlar |
| `assets/css/hotel.css` | Yalnızca otele ait bileşenler: oda kartı, olanak grupları, yakın çevre, kural kartları |
| `tests/hotel.test.js` | Saf fonksiyonlar + sayfanın kendi otel kaydıyla tutarlılığı |

Sayfada görünen **hiçbir metin** `hotel-page.js` içinde değil. Bir oteli
değiştirmek için tek dosya (`hotel-data.js`) yeter; test bunu bekçilik
ediyor (oda adı, oda fiyatı, otel adı ve adresi işaretlemede aranıyor ve
bulunmaması gerekiyor).

## Ne paylaşılıyor, ne paylaşılmıyor

Bu sayfanın tur sayfasıyla ilişkisi bilerek **asimetrik**:

| Katman | Durum | Neden |
|---|---|---|
| Biçimlendirme, tarih, iade, puan hesapları | **Paylaşılıyor** (`tour-data.js`) | Aynı işi yapan ikinci bir kopya kaçınılmaz olarak ayrışır |
| İkon seti (`TOUR_ICONS`, `tourSvg`) | **Paylaşılıyor** | Aynı çizim iki yerde iki farklı çizime dönüşmesin |
| Görsel kabuk (`tour.css`) | **Paylaşılıyor** | Galeri, künye, blok başlıkları, rezervasyon kartı, yapışkan şerit, ışık kutusu birebir aynı bileşenler |
| Ortak site çerçevesi (`site-chrome.js`) | **Paylaşılıyor** | Başlık, arama, bildirimler, giriş modalı zaten tek kaynakta |
| İşaretleme üreteci (`tour-page.js`) | **Paylaşılmıyor** | Aşağıda |

### `tour.css` neden otel sayfasında da yükleniyor

Sınıf adlarındaki `tour-` öneki **tarihsel**: o dosya artık "tur
sayfasının stili" değil, **içerik sayfalarının ortak kabuğu**. Galeri,
künye kutuları, blok başlıkları, rezervasyon kartı, yapışkan alt şerit,
ışık kutusu ve rezervasyon özeti iki sayfada da aynı bileşen — ikinci
bir kopya çıkarmak, iki dosyayı elle eşit tutmak demekti.

Öneki değiştirmek 2200 satır CSS ve 1500 satır JS'i aynı anda
dokunmayı gerektiriyor ve tur sayfasının 240 testinin bir bölümü sınıf
adlarına bakıyor. Bu iş **bilerek ertelendi**; ertelemenin bedeli
yalnızca isim, davranış değil.

`hotel.css` içinde yalnızca otele ait bileşenler var ve yeni bir renk
paleti kurmuyor (test `:root` tanımını yasaklıyor); renk, yarıçap ve
gölge `style.css`'teki değişkenlerden geliyor.

### `tour-page.js` neden paylaşılmıyor

Satılan şey farklı, dolayısıyla rezervasyon kartının **tamamı** farklı:

| | tur | otel |
|---|---|---|
| Ne seçilir | bir tarih + kişi sayısı | tarih **aralığı** + oda tipi + oda sayısı + pansiyon |
| Fiyat birimi | kişi başı / iki kişilik odada kişi başı | oda başı gecelik |
| Bölümler | program, buluşma, dahil olanlar | odalar, olanaklar, konum, kurallar |

`tour-page.js` zaten iki tur tipine (`daily`, `stay`) hizmet ediyor ve
her farkı bir `if (stay)` ile taşıyor. Üçüncü bir tip eklemek o
dalları ikiye katlardı; otelin "tur tipi" gibi davranması da kavramsal
olarak yanlış olurdu.

**Bedeli var ve saklanmıyor:** ışık kutusu, rezervasyon özeti, arka
sayfa kilidi, bölüm menüsü ve yapışkan şerit iki dosyada **iki kez**
duruyor. Bu kopyaların sessizce bozulmaması için `tests/hotel.test.js`
içinde kilit mekanizmasının kendi testi var: gövdenin sabitlendiğini
(`position: fixed`), sayacın bulunduğunu ve dört `lockScroll` çağrısını
doğruluyor. Yani kopya, tur tarafında öğrenilen hataya (iOS Safari'de
`overflow: hidden`'ın işe yaramaması) geri dönemiyor.

**Sonraki adım:** bu beş parça ortak bir dosyaya (`content-overlays.js`
gibi) çıkarılabilir. Çıkarılmadı çünkü `tour-page.js`'in içeriğine
bakan 56 test var ve taşıma o testlerin hepsini yeniden yönlendirmeyi
gerektiriyor — otel sayfasıyla aynı işte yapılacak bir değişiklik
değil.

## Adresler: `/otel/<slug>/`

Sayfalar `otel/<slug>/index.html` olarak duruyor, yani adres
`/otel/kordon-butik-otel/` — uzantısız ve paylaşılabilir. Slug adresin
kendisinden okunuyor (`hotelSlugFromPath`), depo adı veya alt dizin fark
etmiyor. Sayfa iki dizin içeride olduğu için varlıklara `../../assets/`
ile bağlanıyor; anasayfaya giden bağlantılar `<body data-root="../../">`
değerinden kuruluyor.

Turdan farklı olarak **eski adres yönlendirmesi yok**: bu sayfanın
önceki bir adresi hiç olmadı.

## Dosya yükleme sırası

```
tour-data.js   →  hotel-data.js  →  hotel-page.js
```

`hotel-data.js` tarayıcıda `tour-data.js`'teki adları (tarih, para,
puan yardımcıları) doğrudan kullanıyor; Node/vitest tarafında aynı
adlar `require('./tour-data.js')` ile geliyor. Köprü tek bir koşul:

```js
const TUR_VERI = (typeof require === 'function' && ...) ? require('./tour-data.js') : null;
const oAsDate = TUR_VERI ? TUR_VERI.asDate : asDate;
```

Koşulun yalnızca bir dalı çalıştığı için diğer daldaki ad hiç okunmaz.
Sıra bozulursa sayfa ilk satırda ölür; `tests/hotel.test.js` sırayı
doğruluyor.

`tour-page.js` ve `tour-pdf.js` bu sayfaya **yüklenmiyor** — kapları
bulamayacakları gibi, pdfmake ile birlikte boşuna ~2 MB inerdi. Test
ikisinin de yüklenmediğini doğruluyor.

## Fiyat kuralları

Dördü de ayrı ayrı test ediliyor:

| Kalem | Kural |
|---|---|
| Oda | gecelik oda fiyatı × oda sayısı × gece |
| Pansiyon | kişi başı gecelik fark × kişi × gece; **çocuk tarifesi ayrı** |
| Ek hizmet | üç çarpandan biri: `stay` (bir kez), `night` (gece başına), `guest` (kişi başına) |
| Vergi | konaklama vergisi %2; matrah **oda + pansiyon**, ek hizmetler hariç |

**Vergi neden ayrı satır.** Türkiye'de konaklama vergisi fatura üzerinde
ayrı gösteriliyor; fiyatın içine gizlenmesi, otelde çıkan sürprizin
kaynağı. Özet dökümünde kendi satırı var ve toplam ona dahil.

**Matrah neden dar.** Transfer ve otopark tesis dışı/yan hizmet olarak
fiyatlanıyor; matraha girmiyorlar. Kural değişirse tek yer değişiyor
(`calcHotelTotal` içindeki `araToplam`), test de o davranışı ölçüyor.

**Ek hizmetin üç çarpanı bilerek farklı.** "Kişi başına" ek hizmet
konaklamanın tamamı için bir kez alınıyor, gece ile çarpılmıyor: teras
akşam yemeği tek seferlik bir hizmet. Otopark ise gece başına.

**Ek hizmet fiyatı seçime göre büyüyor.** Satırda "+250 /gece" yazan
otopark, üç gecelik konaklamada "+750 · 3 gece" oluyor. Tutarı ancak
özette görmek, hizmeti işaretlemeden önce kararı zorlaştırıyordu.

### Oda ve misafir sınırları

`clampStay` üç adımı bu sırayla uyguluyor:

1. Gece sayısı otelin alt/üst sınırına çekiliyor (1 – 14).
2. Oda sayısı misafiri **alacak** kadar yükseltiliyor (oda kapasitesi).
3. Oda sayısı tesis sınırını (3) aşarsa misafir sayısı geri çekiliyor —
   önce çocuk, sonra yetişkin; en az bir yetişkin kalıyor.

Üçüncü adım olmasaydı ekranda "en fazla 3 oda" yazarken sekiz kişilik
bir hesap çıkıyordu. Sıra da önemli: oda sayısı misafirden türediği
için önce oda, sonra sınır.

Sınıra gelen sayaç düğmeleri pasifleşiyor ve nedeni altındaki satırda
yazıyor — tıklanıp hiçbir şey olmaması yerine.

## Oda seçimi: tek durum, iki yüzey

Oda hem "Odalar" bölümündeki karttan hem rezervasyon kartındaki çipten
seçilebiliyor, ama durum **tek**: `state.room`. İki ayrı durum tutulsaydı
ikisini eşit tutmak gerekirdi.

Kartlar her seçimde yeniden çizilmiyor; yalnızca seçili rozeti, düğme
metni ve kalan oda satırı güncelleniyor. Baştan `innerHTML` yazmak
sayfanın kaydırma konumunu ve klavye odağını bozuyor.

**Seçtikten sonra sayfa rezervasyon kartına fırlatılmıyor.** Listede
kalıp diğer odalara bakmak isteyen misafir rahatsız oluyordu; düğme ikinci
dokunuşta ("Rezervasyona git") götürüyor.

## Kalan oda sayısı

Veri kapısının kontenjan cevabından geliyor (`MolaVeri.musaitlik`,
docs/veri-sozlesmesi.md bölüm 6) ve konaklamanın **her gecesinin en küçüğü** (`konaklamaKalan`).
Önceki sürüm sayıyı tarihin karma değerinden üretiyordu (`roomsLeft`) ve
yalnızca giriş gecesine bakıyordu: üçüncü gecesi dolu bir oda "3 oda
kaldı" diyerek satılabiliyordu. Seçili tarihlerde oda doluysa ya da
istenen oda sayısı kalandan fazlaysa rezervasyon düğmesi pasifleşiyor;
hiçbir oda tipinde yer olmayan gece giriş günü olarak seçilemiyor.

Azalınca satır rengi değişiyor ama kutu kırmızıya boyanmıyor: sahte
aciliyet üretmeden haber veriyor.

## Puan: 10 üzerinden, ama tek kaynaktan

Otelde alışılmış gösterim 10 üzerinden ("8,9"), turda 5 üzerinden.
Yorumlar iki sayfada da 5 yıldız veriyor; 10'luk skor o dağılımdan
**türetiliyor** (`hotelScore`), veride ikinci bir puan tutulmuyor — iki
sayı tutulsaydı biri güncellenip diğeri unutulurdu.

Anasayfadaki otel kartında yazan `rating:'8.9'` de bu sayıyla aynı olmak
zorunda; `tests/hotel.test.js` ikisini karşılaştırıyor. Aynı test kart
fiyatının **en ucuz odanın gecelik ücreti** olduğunu da doğruluyor —
listede bir fiyat, detayda başka bir fiyat görmek güveni bitirir.

## Anasayfa bağlantısı

Otel kartı anasayfaya **elle yazılmıyor**: `assets/js/catalog.js` onu
`HOTELS` kaydından üretip "Oteller" şeridine koyuyor; kategori sonuçları
ve arama ekranı da aynı diziden beslendiği için otel oraya da giriyor.
Kartın gecelik fiyatı (en ucuz oda), 10'luk puanı, yorum sayısı ve
müsaitlik tarihi kayıttan türetiliyor — kopyalanmadıkları için
eskiyemiyorlar. Mekanizmanın tamamı `docs/icerik-katalogu.md` içinde.

Kayda eklenen tek şey türetilemeyenler: `card.img` (anasayfanın görsel
anahtarı), `card.title` (dar karta sığan kısa ad), `card.badges` ve
`card.meta1`.

`tests/hotel.test.js` her otelin anasayfaya ve kendi kategori şeridine
girdiğini, kart fiyatının/puanının kayıttan geldiğini doğruluyor.

## Sayfa etiketleri

Kural turla aynı: **hedefi olmayan çip eklenmez.** Test bunu bekçilik
ediyor ve ilk yazımda gerçekten yakaladı: `index.html#mekanlar` çipi
konulmuştu ama anasayfada `mekanlar` diye bir şerit çapası yok
(Mekanlar bir kategori, şerit değil). Çip `#aktiviteler` ile
değiştirildi.

## Yapısal veri

Sayfada yalnızca `BreadcrumbList` var. `Hotel`, `Offer` ve
`AggregateRating` **bilerek yok**: bu otel gerçek envanter bağlanana
kadar örnek içerik; uydurma fiyatı, müsaitliği ve puanı işaretlemek
yanıltıcı yapısal veridir ve elle işlem riski taşır
(`docs/seo-arastirma.md`, madde 2 ile aynı gerekçe). Test, bu üç tipin
sayfaya sızmadığını doğruluyor.

Gerçek envanter geldiğinde eklenecekler:

- `Hotel` — `name`, `address` (PostalAddress), `geo`, `starRating`,
  `checkinTime`, `checkoutTime`, `amenityFeature`
- `Offer` — gerçek gecelik fiyat, para birimi, `priceValidUntil`,
  `availability`
- `AggregateRating` — gerçek misafir puanı ve yorum sayısı
- `Review` — gerçek ve doğrulanmış yorumlar

## Ölçülenler

Chromium, dış ağ kesilmiş hâlde (390×844 ve 1440×900):

- Dokuz bölüm kabının **hepsi dolu**, bölüm menüsünde yedi sekme, her
  sekmenin sayfada karşılığı var.
- Dört oda kartı, beş olanak grubu, sekiz yakın çevre kaydı, altı kural
  kartı basılıyor.
- Varsayılan seçim (1 gece, standart oda, kahvaltı): **1.989 TL** =
  1.950 + %2 vergi. Yapışkan şerit aynı tutarı gösteriyor.
- Üç gece + yarım pansiyon + Çatı Katı Suit: **13.311 TL** =
  3.450×3 + 450×2×3 + %2 vergi. Seçili kart `suit`'e geçiyor, çıkış
  tarihi notu üç gece sonrasını yazıyor.
- Rezervasyon özeti açılınca gövde `fixed`, Escape ile kapanınca
  `relative` — arka sayfa kilidi çalışıyor.
- İki genişlikte de **yatay taşma yok**.

## Doğrulanamayanlar

**Görsel dosya adları.** Bu ortamın ağ politikası
`commons.wikimedia.org`'a CONNECT'i reddediyor; `HOTEL_IMAGE_FILES`
içindeki dosyaların o adla var olduğu kontrol edilemedi. Ad yanlışsa
sayfa bozulmaz — `ui.js`'teki yedek nötr yer tutucuya düşürür, kırık
resim simgesi çıkmaz. Ayrıntı `docs/gorsel-kaynaklari.md` (beşinci tur).

**Gerçek cihaz.** Arka sayfa kilidi ve dokunmatik hareketler tur
sayfasında ölçülmüş çözümlerin aynısı; otel sayfasında gerçek iOS
Safari'de tekrar denenmedi.

## Bilerek yapılmayanlar

- **PDF belgesi yok.** Tur programı yola çıkarken elde taşınan bir şey;
  otel rezervasyonunun karşılığı, ödeme adımı bağlandığında oluşacak
  **onay belgesi** olur. Ondan önce üretilecek bir belge yok.
- **Serbest takvim yok.** Giriş tarihi, turdaki gibi çiplerden
  seçiliyor (18 güne kadar) ve gece sayısı sayaçla veriliyor. İki
  ayrı tarih alanı ("giriş" ve "çıkış") ikisini tutarlı tutmayı
  gerektiriyor; çıkış giriş + gece sayısından türetiliyor ve
  ayrışamıyor. Gerçek müsaitlik bağlandığında takvim gerekecek.
- **Müsaitlik örnek veriden.** Kalan oda sayısı örnek rezervasyonlardan
  hesaplanıyor (`assets/js/inventory-data.js`); backend gelince gerçek
  rezervasyonlardan gelecek, sayfa değişmeyecek.
- **İkinci otel sayfası yok.** `HOTELS`'e kayıt eklemek ve
  `otel/<slug>/index.html` yazmak yeterli; testler yeni kaydı
  kendiliğinden kapsıyor (sayfa yoksa düşüyor).
