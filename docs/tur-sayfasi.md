# Tur içerik sayfası (`tur.html`)

Anasayfa bir liste; bu sayfa satın alma kararının verildiği yer. Bu belge
sayfanın neden böyle kurulduğunu, hangi kararın nerede durduğunu ve gerçek
envanter bağlandığında ne yapılacağını yazıyor.

## Dosyalar ve sorumlulukları

| Dosya | Ne yapar |
|---|---|
| `tur/<slug>/index.html` | Her turun kendi sayfası: iskelet, statik SEO bilgisi, bölüm kapları, `BreadcrumbList` |
| `tur.html` | Eski adresten yeni adrese yönlendirme (aşağıda) |
| `assets/js/tour-data.js` | Tüm turların içeriği + saf hesaplar (fiyat, tarih, iade, puan) + ikon seti |
| `assets/js/tour-page.js` | Veriyi işaretlemeye çevirir, etkileşimleri bağlar; iki tur tipine hizmet eder |
| `assets/css/tour.css` | Yalnızca bu sayfalara ait bileşenler; renk/yarıçap/gölge `style.css`'teki `:root`'tan |
| `tests/tour.test.js` | Saf fonksiyonlar + her sayfanın kendi tur kaydıyla tutarlılığı |

Sayfada görünen **hiçbir metin** `tour-page.js` içinde değil. Bir turu
değiştirmek için tek dosya (`tour-data.js`) yeter.

## Adresler: `/tur/<slug>/`

Sayfalar `tur/<slug>/index.html` olarak duruyor, yani adres
`/tur/kapadokya-3-gece/` — uzantısız, okunur ve paylaşılabilir. GitHub
Pages dizin adresini kendiliğinden `index.html`'e çözüyor; sunucu tarafı
kural gerekmiyor (yerel HTTP sunucusunda doğrulandı).

Slug adresin kendisinden okunuyor (`tourSlugFromPath`), depo adı veya alt
dizin fark etmiyor. Sayfa iki dizin içeride olduğu için varlıklara
`../../assets/...` ile bağlanıyor; anasayfaya ve diğer turlara giden
bağlantılar ise `<body data-root="../../">` değerinden kuruluyor — tahmin
edilmiyor, böylece depo başka bir alt dizine taşınsa da doğru kalıyor.

**Eski adres çalışmaya devam ediyor.** İlk sürümde sayfa `tur.html` (ve
`tur.html?tur=<slug>`) adresindeydi. GitHub Pages 301 yönlendirme
yapamadığı için `tur.html` artık `canonical` + `noindex` + `meta refresh`
+ JS taşıyan bir yönlendirme sayfası: slug taşıyorsa o turun yeni
adresine, taşımıyorsa varsayılan tura gidiyor.

### Neden `app.js` yüklenmiyor

`app.js` ilk satırlarında `document.getElementById('top10Scroll').innerHTML`
gibi doğrudan anasayfa DOM'una yazıyor; tur sayfasında ilk satırında
patlar. Bu yüzden ikon seti ve biçimlendirme `tour-data.js` içinde kendi
başına duruyor.

`ui.js` **yüklenir**: içindeki blokların hepsi eleman yoksa sessizce
çıkıyor ve görsel yedek mekanizması (ölü URL → nötr yer tutucu) burada da
çalışıyor. `home-blocks.js` de yüklenir; tek ihtiyaç `CONTACT` — destek
numarası iki sayfada ayrı ayrı yazılmasın diye.

## İki tur tipi, tek kalıp

`tour.type` iki değer alıyor ve sayfa ona göre uyarlanıyor:

| | `daily` (günübirlik) | `stay` (konaklamalı) |
|---|---|---|
| Program | saat saat duraklar (`itinerary`) | gün gün akış (`program`) |
| Konaklama bölümü | yok | otel, oda tipleri, pansiyon |
| Fiyat temeli | kişi başı (`adult`) | iki kişilik odada kişi başı (`perPerson`) |
| Rezervasyon alanları | tarih, kişi, ek seçenek | + kalkış şehri, oda düzeni |
| Tarih | tek gün | kalkış – dönüş aralığı |
| İptal basamakları | saat (48 / 24) | gün (21 / 14 / 7) |

Galeri, künye, dahil olanlar, buluşma, önemli bilgiler, iade tablosu,
yorumlar, SSS, operatör ve benzer turlar **tek kod yolundan** geçiyor.

Bölüm menüsü sayfada karşılığı olmayan sekmeyi kendiliğinden düşürüyor:
`TUM_SECTIONS` listesi ortak, `SECTIONS` ise yalnızca o sayfada
`<section>` olarak bulunanlardan oluşuyor. Bu yüzden konaklamalı turun
"Konaklama" sekmesi var, günübirliğin yok — iki sayfa aynı kodu
kullanıyor.

### Konaklamalı fiyat kuralları

Bu turlar kişi başı değil **"iki kişilik odada kişi başı"** satılıyor.
Dört kural var, hepsi `calcStayTotal` içinde ve her biri ayrı test
ediliyor:

| Kural | Ne zaman |
|---|---|
| `perPerson` | iki kişilik odada her yetişkin |
| `singleSupplement` | tek kişilik odada kalan **her** yetişkin |
| `thirdAdult` | yalnızca 3 yetişkin **ve** oda paylaşımlı olduğunda |
| `child` | ailesiyle aynı odada, ilave yatakta |

Üstüne kalkış şehri farkı (`cityFee`) ücretli kişi başına biniyor.

İki ayrıntı bilinçli:

- **Tek yetişkin = zorunlu tek kişilik oda.** Onay kutusu işaretli ve
  pasif geliyor, nedeni altında yazıyor. Tıklanıp hiçbir şey olmaması
  yerine neden olmadığı görünüyor.
- **Tek kişilik oda seçilirse 3. kişi indirimi kalkıyor.** İndirim oda
  paylaşımından geliyor; paylaşım yoksa indirim de yok.

`saving` (liste fiyatına göre avantaj) yalnızca indirime konu kalemlerden
hesaplanıyor. Tek kişilik oda farkı ve şehir farkı birer **ek ücret**,
indirimli fiyat değil; karşılaştırmaya girseydi "avantaj" şişerdi.

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

**Özet satırları işaretlemede değil saf hesapta kuruluyor**
(`hesap.lines`). Ekranda görünen döküm ile toplanan tutar tek kaynaktan
besleniyor; test satır toplamının `total` ile aynı olduğunu doğruluyor,
yani ikisi ayrışamıyor.

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

1. `TOURS`'a bir kayıt: anahtar slug olur, `slug` alanı da aynı olmalı.
   `type` alanı `daily` veya `stay`.
2. Görsel anahtarları `TOUR_IMAGE_FILES` içinde tanımlı olmalı.
3. `tur/<slug>/index.html` oluştur. En kolayı mevcut bir sayfayı
   kopyalayıp şu yedi yeri değiştirmek: `<title>`, `meta description`,
   `canonical`, `og:*`, `BreadcrumbList`, görünür kırılma noktaları,
   `<h1>` + `.tour-lead`. Konaklamalı turda ayrıca
   `<section id="konaklama">` bloğunu ekle.
4. `app.js`'te o turun kartına `href:'tur/<slug>/'` ekle. Karttaki fiyat
   `basePrice()` ile aynı olmak zorunda — test karşılaştırıyor.
5. Kırılma noktasındaki orta adım anasayfadaki şeridin `anchor`'una
   gitmeli ve kayıttaki `categoryAnchor` ile aynı olmalı; test bunu da
   kontrol ediyor.

Adım 3'teki elle iş, sayfa sayısı azken bilinçli bir tercih: statik HTML
sayesinde JS çalışmadan da sayfanın ne olduğu okunuyor, ve
`describe.each` ile yazılan testler her sayfanın statik bilgisini kendi
tur kaydına kilitliyor — kayma sessizce geçemiyor. **Katalog bir elin
parmaklarını aşarsa** bu dosyalar `tour-data.js`'ten üretilmeli (küçük
bir `tools/build-tour-pages.js`); o noktada elle kopyalamak
sürdürülebilir olmaktan çıkar.

## İkinci turda çıkan hata: tanımsız ikon

Konaklamalı tur eklenirken `home` ikonu `TOUR_ICONS` içinde yoktu.
`tourSvg('home')` boş bir `<svg>` döndürdüğü için otel kartındaki
lacivert kare **içi boş** çıktı — kırık değil, sadece boş, yani gözden
kaçabilecek bir hata.

`tests/tour.test.js` içindeki ikon bütünlüğü testi bunu tam olarak
yakaladı (`tanımsız ikon: home`). Test zaten bu amaçla yazılmıştı:
kullanılan her ikon adını dosya metninden toplayıp `TOUR_ICONS` ile
karşılaştırıyor. İkon eklendi; `home` artık anasayfadaki "Oteller"
şeridiyle aynı çizim.

Not: hatayı önce hesaplanmış CSS değerlerine bakarak teşhis etmeye
çalıştım ve yanlış sonuca vardım — `stroke`, `fill`, boyut ve renk
çalışan bir ikonla birebir aynıydı, çünkü sorun stilde değil boş
gövdedeydi. Yakınlaştırılmış ekran görüntüsü karenin içinin boş olduğunu
gösterene kadar hata görünmedi.

## Sıradaki işler

1. **Ödeme adımı.** `Rezervasyon yap` şu an özet katmanını açıyor ve
   ödeme adımının bağlı olmadığını açıkça yazıyor. Uydurma bir başarı
   ekranı göstermemek bilinçli.
2. **Gerçek envanter + yapısal veri.** Yukarıdaki alan listesi.
3. **Yorumlar sunucudan.** Her turda 8 örnek yorum ve dağılım veride
   sabit; `ratingSummary()` ortalamayı dağılımdan hesaplıyor, yani
   dağılım değiştiğinde ekrandaki puan kendiliğinden düzeliyor.
4. **Sayfaları üretmeye geç.** Katalog büyüdüğünde
   `tur/<slug>/index.html` dosyaları elle değil veriden üretilmeli.
5. **Konaklamalı turda oda sayısı.** Şu an oda düzeni kişi sayısından
   türetiliyor (2'li odalar, 3 yetişkinde tek üçlü oda). Gerçek
   envanterde "2 oda + 1 tek kişilik" gibi karma düzenler gerekebilir; o
   zaman oda listesi ayrı bir seçim alanı olmalı.
6. **Harita.** Buluşma noktası şu an Google Maps'e bağlanıyor; gömülü
   harita katmanı çerez/izleme kararı gerektirdiği için eklenmedi.
7. **Favori kalıcılığı.** Kalp yalnızca sayfa içinde çalışıyor; anasayfada
   da öyle (`Mola360App.state.favorites`). Ortak bir kalıcı katman
   gerektiğinde ikisi birlikte bağlanmalı.
