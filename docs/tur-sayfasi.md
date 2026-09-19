# Tur içerik sayfası (`tur.html`)

Anasayfa bir liste; bu sayfa satın alma kararının verildiği yer. Bu belge
sayfanın neden böyle kurulduğunu, hangi kararın nerede durduğunu ve gerçek
envanter bağlandığında ne yapılacağını yazıyor.

## Dosyalar ve sorumlulukları

| Dosya | Ne yapar |
|---|---|
| `tur.html` | İskelet: header, kırılma noktaları, H1, bölüm kapları, footer, `BreadcrumbList` |
| `assets/js/tour-data.js` | Turun tüm içeriği + saf hesaplar (fiyat, tarih, iade, puan) + ikon seti |
| `assets/js/tour-page.js` | Veriyi işaretlemeye çevirir, etkileşimleri bağlar |
| `assets/css/tour.css` | Yalnızca bu sayfaya ait bileşenler; renk/yarıçap/gölge `style.css`'teki `:root`'tan |
| `tests/tour.test.js` | Saf fonksiyonlar + sayfa ile veri arasındaki bağların tutarlılığı |

Sayfada görünen **hiçbir metin** `tour-page.js` içinde değil. Bir turu
değiştirmek için tek dosya (`tour-data.js`) yeter.

### Neden `app.js` yüklenmiyor

`app.js` ilk satırlarında `document.getElementById('top10Scroll').innerHTML`
gibi doğrudan anasayfa DOM'una yazıyor; tur sayfasında ilk satırında
patlar. Bu yüzden ikon seti ve biçimlendirme `tour-data.js` içinde kendi
başına duruyor.

`ui.js` **yüklenir**: içindeki blokların hepsi eleman yoksa sessizce
çıkıyor ve görsel yedek mekanizması (ölü URL → nötr yer tutucu) burada da
çalışıyor. `home-blocks.js` de yüklenir; tek ihtiyaç `CONTACT` — destek
numarası iki sayfada ayrı ayrı yazılmasın diye.

## Yerleşim kararları

**Rezervasyon kartı tek DOM düğümü.** Masaüstünde sağ sütunda yapışkan
durur, mobilde künyenin hemen altına, akışın içine taşınır. İki kopya
değil, `tour-page.js` aynı düğümü iki yuva arasında taşıyor
(`#tourBookingDesktop` / `#tourBookingMobile`). Kopyalanmadığı için
seçilmiş tarih, kişi sayısı ve dinleyiciler ekran döndürülünce kaybolmaz.

**Kart yeniden çizilmiyor, parçaları güncelleniyor.** Her tuşta
`innerHTML`'i baştan yazmak onay kutusundaki klavye odağını düşürüyordu.
`syncBooking()` sınıf ve metin değiştiriyor; tam yeniden çizim yalnızca
tarih listesi açılıp kapanırken oluyor.

**Kalan kontenjan tarihten türetiliyor** (`seatsLeft`). Rastgele sayı
kullanılsa rakam her sayfa yenilemesinde zıplar ve "acele et" mesajı
inandırıcılığını kaybeder. Aynı tarih her zaman aynı sayıyı verir.

**Galeri hücreleri tek düz liste.** Masaüstünde ızgara (ilk kare iki satır
kaplar, beşinciden sonrası gizlenir), mobilde tam genişlikte yatay
kaydırmalı şerit. İç içe iki kapsayıcı olsaydı mobilde tek bir şerit
kurulamazdı.

**Katmanların kapanma kontrolü `document`'te değil, katmanın kendi
üzerinde.** Aksi hâlde katmanı açan tıklama `document`'e kadar
baloncuklanıp "panelin dışına tıklandı" sayılıyor ve katman açıldığı anda
kapanıyordu.

**Metin seçimi.** `style.css` tüm belgede seçimi kapatıyor (uzun basınca
çıkan tarayıcı menüsünü engellemek için). İçerik sayfasında buluşma adresi
ve saat kopyalanabilmeli; bu yüzden yalnızca metin bloklarında geri
açılıyor.

## Yapısal veri: neden `Product` yok

Sayfada yalnızca **`BreadcrumbList`** var. `Product`, `Offer` ve
`AggregateRating` **bilerek** eklenmedi.

Bu sayfadaki tur, gerçek envanter bağlanana kadar örnek içerik. Uydurma
fiyat, stok ve puanı işaretlemek yanıltıcı yapısal veridir ve elle işlem
riski taşır — `docs/seo-arastirma.md` madde 2'de `Event` işaretlemesi için
yazılan gerekçenin aynısı. `tests/tour.test.js` bu kararı kilitliyor:
sayfaya `Offer`, `AggregateRating` veya `Product` girerse test kırmızıya
döner.

**Gerçek envanter geldiğinde eklenecekler** (hepsi sayfada görünür olmak
zorunda; görünmeyen veriyi işaretlemek ihlal):

- `Product` / `TouristTrip`: `name`, `description`, `image`, `sku`
  (`tour.code`), `touristType`, `itinerary`
- `Offer`: `price` (düz sayı), `priceCurrency: "TRY"`, `availability`,
  `validFrom`, `url`, `priceValidUntil`
- `AggregateRating`: `ratingValue`, `reviewCount` — **gerçek** yorum
  sayısıyla; `ratingSummary()` bunu dağılımdan hesaplıyor
- `Review`: yalnızca sayfada basılı olan yorumlar
- `FAQPage`: SSS bölümü gerçek politika metinlerine bağlandıktan sonra

## Görseller

Adresler Wikimedia Commons dosya adından deterministik kuruluyor
(`commonsImageUrl`), yöntem `docs/gorsel-kaynaklari.md` içinde. `app.js`
ile ortak olan anahtarlarda (`pamukkale`, `alacati`, `bodrum`,
`kemeralti`) dosya adı birebir aynı; test iki dosyanın aynı adrese
gittiğini doğruluyor.

**Bu ortamdan `commons.wikimedia.org` açılamıyor** (ağ politikası CONNECT'i
403 ile reddediyor), yani yeni dosya adları **doğrulanamadı**. Yanlış olan
bir ad sayfayı bozmaz: `ui.js`'teki yedek onu nötr yer tutucuya düşürür.
Doğrulanmış tek kayıt `efesKutuphane`; diğer beşi
(`efesTiyatro`, `efesYamacEvler`, `meryemAna`, `artemis`, `sirince`)
kontrol edilmeli. Yanlış olanın anahtarını söylemek yeterli, aynı
yöntemle değiştirilir — `TOUR_IMAGE_FILES` içinde tek satır.

## Anasayfa bağlantısı ve yol boyunca çıkan hata

Tur şeritlerine gerçek bağ hedefi (`id`) verildi: `#turlar`, `#oteller`,
`#aktiviteler`... `tur.html`'deki kırılma noktası artık boşluğa değil bu
hedefe bağlanıyor. İçerik sayfası yazılmış tur, şeridin ilk kartı; kartın
başlığı gerçek bir `<a>` (klavyeyle gezilebilir, arama motoru görür),
kartın tamamı da tıklanabilir.

Bunu bağlarken `initDragScroll` içinde bir hata çıktı: `setPointerCapture`
**basma** anında alınıyordu. Pointer capture alındığı andan sonra tarayıcı
`mouseup` ve `click` olaylarını da şeride yönlendiriyor, yani
`click.target` basılan kart değil şeridin kendisi oluyor. Sonuç: yatay
şeritteki bir kartta fareyle yapılan hiçbir delege tıklama çalışmıyordu
(favori/sepet butonları çalışıyordu, çünkü onlarda `pointerdown` erken
`return` ediyor). Capture artık ilk gerçek harekette, 5 pikselden sonra
alınıyor — sürükleme aynı şekilde çalışıyor, tıklama da geri geldi.
`tests/tour.test.js` bu düzeltmeyi kilitliyor.

## Yeni tur eklemek

1. `TOURS`'a bir kayıt daha; anahtar slug olur.
2. Görsel anahtarları `TOUR_IMAGE_FILES` içinde tanımlı olmalı.
3. Sayfa `tur.html?tur=<slug>` ile o kaydı açar; bilinmeyen slug
   `DEFAULT_TOUR_SLUG`'a düşer.
4. `app.js`'te o turun kartına `href:'tur.html?tur=<slug>'` eklenir.
   Karttaki fiyat tur kaydındaki `pricing.adult` ile aynı olmak zorunda —
   test bunu karşılaştırıyor (listede bir fiyat, detayda başka bir fiyat
   görmek güveni bitirir).

`tur.html` şu an tek turu statik olarak da taşıyor: H1, sekme başlığı,
açıklama ve kırılma noktası HTML'de yazılı, JS çalışmadan da sayfanın ne
olduğu okunuyor. Bu metinler `TOURS[DEFAULT_TOUR_SLUG]` ile birebir aynı
olmak zorunda; test ikisini karşılaştırıyor. Birden fazla tur yayına
girecekse bu statik blok ya sunucu tarafında üretilmeli ya da her tur için
kendi HTML dosyasını almalı.

## Sıradaki işler

1. **Ödeme adımı.** `Rezervasyon yap` şu an özet katmanını açıyor ve
   ödeme adımının bağlı olmadığını açıkça yazıyor. Uydurma bir başarı
   ekranı göstermemek bilinçli.
2. **Gerçek envanter + yapısal veri.** Yukarıdaki alan listesi.
3. **Yorumlar sunucudan.** Şu an 8 örnek yorum ve dağılım veride sabit;
   `ratingSummary()` ortalamayı dağılımdan hesaplıyor, yani dağılım
   değiştiğinde ekrandaki puan kendiliğinden düzeliyor.
4. **Harita.** Buluşma noktası şu an Google Maps'e bağlanıyor; gömülü
   harita katmanı çerez/izleme kararı gerektirdiği için eklenmedi.
5. **Favori kalıcılığı.** Kalp yalnızca sayfa içinde çalışıyor; anasayfada
   da öyle (`Mola360App.state.favorites`). Ortak bir kalıcı katman
   gerektiğinde ikisi birlikte bağlanmalı.
