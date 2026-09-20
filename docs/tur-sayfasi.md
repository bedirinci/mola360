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

### Masaüstü başlığı: tek kaynak

Masaüstünde tur sayfasının başlığı anasayfanınkiyle **aynı** — benzer
değil, aynı. İşaretleme `assets/js/site-chrome.js` içinde tek kopya
duruyor ve her sayfa o dosyayı yüklüyor; dosya kendi `<script>`
etiketinin yerine basıyor, yani başlık sayfanın neresinde duracaksa
etiket oraya konuyor. Senkron çalıştığı için tarayıcı sayfanın geri
kalanını ayrıştırmadan önce başlık DOM'da hazır: statik işaretlemeye
göre görünür bir gecikme yok.

Çerçeve yalnızca başlığı değil, ona bağlı katmanları da taşıyor: bildirim
paneli, profil menüsü, mobil arama çubuğu, tam ekran arama ve giriş
modalı. Böylece tur sayfasında da arama açılıyor, bildirimler okunuyor,
"Giriş Yap / Üye Ol" çalışıyor.

Görsel yolları köke göre yazılmış; alt dizindeki sayfalar
`<body data-root="../../">` ile önekini bildiriyor ve çerçeve `assets/`
yollarını o önekle yeniden yazıyor.

İki kopyayı elle eşit tutmaya çalışmak yok: `tests/site-chrome.test.js`
hiçbir sayfada elle yazılmış bir `<header class="site-header">` kalmadığını
doğruluyor.

### Favori ve paylaş: tek yerde, banner'ın sağ üst köşesinde

Bir dönem favori iki yerdeydi (banner + başlık kartı) ve paylaş da iki
yerdeydi (başlık kartı + mobil başlık). Aynı işi yapan iki düğme hem
fazlalıktı hem de durumlarını birbirine eşit tutmayı gerektiriyordu.

Şimdi her ikisi de banner'ın sağ üst köşesinde, yan yana ve **her iki
ekran boyutunda da aynı yerde**: solda favori, sağda paylaş. Mobil
başlıktaki paylaş düğmesi de kaldırıldı, orada artık yalnızca geri oku
ve iki satırlık başlık var — başlık böylece daha uzun tur adını
gösterebiliyor.

Konum düğmelerin kendisinde değil `.tour-gallery-actions` sarmalayıcıda:
ikisi aynı hizada kalıyor ve aradaki boşluk tek yerden geliyor. Sıra
işaretlemeden geliyor (satır yönlü flex), ayrı bir kural gerekmiyor. Üst
konum `--tour-header-h`'den hesaplanıyor — mobilde başlık banner'ın
üzerine bindiği için sabit bir değer verilse düğmeler onun altında
kalırdı.

Ölçüler ekrana göre: masaüstünde 38px düğme / 20px ikon, mobilde 34px
düğme / 18px ikon ve aradaki boşluk 8px yerine 7px. Mobil ölçü kuralı
galerinin kendi `@media (max-width: 680px)` bloğunda, yani temel
tanımdan SONRA.

**Bir dönem paylaş mobilde gizleniyordu ve o kural işe yaramıyordu.**
`.tour-gallery-share { display: none }` medya sorgusunun içindeydi ama
temel `display: flex` kuralı dosyada ondan SONRA geliyordu ve aynı
ağırlıktaydı. Kural yazıldı, test geçti, ekran görüntüsü düğmenin
mobilde hâlâ durduğunu gösterdi. Kural artık tümden kalktı (paylaş
mobilde de görünüyor), ama tuzak duruyor: **bu dosyada iki ayrı mobil
blok var ve baştaki, galeri düğmelerinin temel tanımının ÖNÜNDE.**
Düğmelerin mobil ölçüsünü ezmek isteyen bir kuralı oraya yazmak sessizce
işe yaramaz. `tests/tour.test.js` artık yalnızca kuralın varlığını değil,
temel tanımdan sonra geldiğini de doğruluyor — kural yukarı taşınırsa
test düşüyor.

### Benzer tur kartlarında fotoğraf yüksekliği

Kart sütun yönlü bir flex kabı, fotoğraf kutusu da flex öğesi. Görsel
akışta kalırsa öğenin otomatik en küçük boyutu içeriğe göre belirlendiği
için **dikey bir fotoğraf kutuyu `aspect-ratio`'nun üstüne çıkarıyor** ve
o kartın görseli diğerlerinden uzun duruyor. Canlıda tam olarak bu oldu:
dört karttan biri (dikey çekilmiş bir fotoğraf) belirgin şekilde uzundu.

Çözüm iki parça: `flex: none` (öğe ne büyüsün ne küçülsün) ve görseli
`position: absolute` ile akıştan çıkarmak. İzole bir sayfada ölçüldü —
eski kuralla yükseklikler `142, 142, 315, 142`, yeni kuralla
`142, 142, 142, 142`.

Anasayfadaki `.poi-media` bu hatadan etkilenmiyor: orada yükseklik sabit
(`150px`), oran hesabı yok.

### Sayfa etiketleri

Sayfanın en altında bir çip bulutu (`#tourTags`). İçerik tur kaydındaki
`tags` alanından geliyor; her çip `{ label, href }`.

**Kural: hedefi olmayan çip eklenmez.** `docs/seo-arastirma.md` madde 4,
iç bağlantı ağının değerinin hedefler gerçek olana kadar sıfır olduğunu
söylüyor. Bu yüzden her adres üç şeyden biri: anasayfadaki şerit çapası,
bu sayfanın kendi bölümü, ya da diğer tur sayfası. `tests/tour.test.js`
bunu doğruluyor — sayfa içi çapa gerçekten o sayfada, dışa giden adres
de diskte olmalı; olmazsa test düşüyor.

Adresler veride **kök-göreli** duruyor ve `KOK` ile önekleniyor;
`#` ile başlayanlar olduğu gibi kalıyor. Çip görünümü anasayfadaki
"ilgili aramalar" bulutuyla ortak (`.seo-chip`, `style.css`).

### PDF belgesi

Sayfanın altındaki kart **dosyayı doğrudan indiriyor**; yazdırma
penceresi açılmıyor. Belgeyi `assets/js/tour-pdf.js` pdfmake ile
üretiyor.

**Neden kütüphane.** Tarayıcı kendi baskı çıktısını programa vermiyor —
`window.print()` tek API ve dosya üretmiyor. Gerçek indirme için PDF'i
JS'in kurması gerekiyor. Ölçülen seçenekler: pdfmake ~1,9 MB (sayfalama
kendinde), jsPDF ~720 KB (sayfalama elle). İçerik uzunluğu turdan tura
değiştiği için (8 durak / 4 gün, farklı sayıda madde) **sayfalama asıl
zor kısım**; pdfmake o yüzden seçildi.

**Kütüphane sayfayla yüklenmiyor.** `assets/js/vendor/` altındaki iki
dosya yalnızca düğmeye ilk basışta, bir kez iniyor. Sayfayı normal gezen
ziyaretçiye maliyeti sıfır. Sıra önemli: `vfs_fonts` kendini `pdfMake`e
kaydettiği için `pdfmake.min.js` ondan önce gelmeli.

**Fotoğraflar.** PDF'e gömülebilmek için önce veri adresine çevriliyor
(`fetch` → blob → dataURL). Uzak sunucu izin vermezse belge
**fotoğrafsız** üretiliyor — hiç üretilmemesindense. Kapakta fotoğraf
yoksa yerine ince yeşil bir şerit geçiyor.

**iPhone'da paylaşım sayfası.** Blob adresli bir `<a download>` iOS
Safari'de dosyayı indirmiyor, **sekmede açıyor** — bildirilen şikâyet tam
olarak buydu. Doğru yol sistem paylaşım sayfası: `navigator.share` ile
PDF dosyası verilince iOS'un kendi sayfası açılıyor ve "Dosyalara
Kaydet" oradan çıkıyor. Sunum sırası: **paylaşım sayfası → kaydetme
penceresi (masaüstü Chrome/Edge) → doğrudan indirme**.

**Dokunuş süresi.** Hem paylaşım hem kaydetme penceresi kullanıcı
hareketi içinde çağrılmak zorunda; belge ilk üretimde birkaç saniye
sürüyor ve süre dolabiliyor (`NotAllowedError`). Üretilen belge
saklandığı için ikinci dokunuş anında sonuçlanıyor; kullanıcıya
"Kaydetmek için bir kez daha dokunun" deniyor. Yani ilk kullanımda iki
dokunuş, sonrasında tek.

**Hiçbir bilgi bölümü ikiye bölünmüyor.** Her bölüm `bolum()`
sarmalayıcısıyla `unbreakable`; sığmıyorsa tamamı sonraki sayfaya
geçiyor. "Fiyata dahil olanlar"ın yarısı bir sayfada yarısı diğerinde
kalıyordu.

**Program bu sarmalayıcıya girmez.** Sekiz duraklık bir program tek
sayfaya sığmayabiliyor ve sığmayan bir `unbreakable` blok kırpılır.
Orada bölünme serbest, ama `dontBreakRows: true` ile **her durak/gün
kendi içinde bütün** — 3. günün yarısı 2. sayfada kalmıyor.

**Kapakta gerçek logo.** `assets/img/logo.png` alınıp gömülüyor; dosya
kendi sunucumuzda olduğu için her zaman geliyor, yine de gelmezse marka
adı yazıyla basılıyor. Logo beyaz + yeşil ve saydam zeminli, lacivert
kapakta okunuyor.

**İki sütun aynı hizadan başlar.** Sağ sütunda "Dahil olmayanlar"
başlığı varken solda yoktu; sağdaki liste bir satır aşağıdan başlıyor ve
başlık kaymış görünüyordu. Artık iki sütunun da başlığı var, bölüm
başlığı da "Fiyat kapsamı" oldu.

**`getBlob` söz döndürür.** pdfmake 0.3'te geri çağırma değil söz
(0.2'de geri çağırmaydı). Geri çağırma beklemek **hata fırlatmadan**
sonsuza kadar asılı bırakıyor; düğme "Hazırlanıyor…" hâlinde kalıyordu.

**Belge tur kaydından üretiliyor**, ekrandaki işaretlemeden değil.
İçerik: kapak (fotoğraf + lacivert başlık bloğu), fiyat şeridi, öne
çıkanlar, ikonlu künye kartları, üçlü fotoğraf şeridi, zaman çizgili
program, konaklama, iki sütunlu dahil/hariç, buluşma noktası ve biniş
durakları, yanınıza alın, önemli bilgiler, renkli iptal kademeleri,
lacivert alt bilgi.

**Sayfa sonları — ikisi de gerçek çıktıda görülüp düzeltildi:**

- `pageBreakBefore` ile bölüm başlığı sayfanın dibinde **yalnız
  kalmıyor**; altında hiçbir şey kalmadıysa başlık sonraki sayfaya
  atılıyor (`baslik()` içindeki `headlineLevel` bu kontrol için).
- İptal kademeleri `unbreakable`; bölününce üçüncü kademe öksüz
  kalıyordu.

**Fiyat şeridinde grup büyüklüğü yazılmaz.** `pricing.maxGuests` tek bir
rezervasyonda seçilebilecek en fazla kişi (6–9); kalkıştaki grup
büyüklüğü `seatsPerDeparture` (16–18). İlki bir sürüm boyunca "Grup"
diye yazıldı ve belgenin **kendi künye kartıyla** çelişti. Test şeridin
`maxGuests` kullanmasını engelliyor.

**Belge bilet değil.** Alt bilgide "bir bilet veya rezervasyon onayı
değildir, fiyatlar ve program değişebilir" yazıyor ve belge tarihi
basılıyor. Fiyat "başlangıç fiyatı" olarak geçiyor: seçilen tarihe, kişi
sayısına ve ek hizmetlere göre değiştiği için belgeye bir toplam yazmak
yanıltıcı olurdu.

**Ctrl+P sayfayı değil belgeyi yazdırır.** Kısayol yakalanıp
`pdf.print()` çağrılıyor. Sınır: yalnızca klavye kısayolu
yakalanabiliyor; tarayıcının kendi menüsünden verilen yazdırma emri
sayfayı basar — bu yüzden `tour.css`'teki sade `@media print` bloğu
duruyor.

**İkinci bir belge kopyası tutulmuyor.** Bir dönem aynı veriden HTML bir
baskı sayfası kuruluyor ve `@media print` onu basıyordu. İndirme gelince
o kopya kaldırıldı: aynı veriden üretilen iki belgeyi elle eşit tutmak
kaçınılmaz olarak ayrışıyor. Ctrl+P artık sayfanın kendisini basıyor;
`tour.css` yalnızca yapışkan katmanları ve etkileşim düğmelerini
gizliyor.

**Doğrulanamayan:** bu ortamdan Wikimedia'ya çıkılamadığı için
denetlenen PDF'lerde fotoğrafların yerinde örnek görseller var. Fotoğraf
boru hattı (istek → dataURL → PDF'e gömme) yerel görsellerle uçtan uca
denendi; PDF'te 8 görüntü nesnesi sayıldı. Gerçek cihazda Wikimedia'nın
CORS başlığı gerekiyor; gelmezse belge fotoğrafsız iniyor.

### Çift dokunuşla yakınlaştırma

`* { touch-action: manipulation }` ile kapalı. `manipulation` bilerek
seçildi: kaydırma ve **iki parmakla** yakınlaştırma çalışmaya devam
ediyor, yalnızca çift dokunuş hareketi kalkıyor. Aynı şeyi viewport
etiketine `user-scalable=no` yazarak yapmak mümkündü ama o,
yakınlaştırmayı tümden kapatıp az gören kullanıcıyı dışlıyor — test bunu
da bekçilik ediyor.

**Asıl işi yapan JS, CSS değil.** İki sürüm boyunca bu yalnızca CSS ile
çözülmeye çalışıldı ve iOS Safari'de olmadı. Sonunda ölçülen şey şu:
**anasayfada çift dokunuşun olmamasının sebebi `touch-action` değil**,
viewport etiketindeki `user-scalable=no`. Tur sayfalarında o etiket yok,
bu yüzden orada hareket sürüyordu.

| | viewport etiketi | çift dokunuş |
|---|---|---|
| `index.html` | `… maximum-scale=1.0, user-scalable=no …` | yok |
| `tur/<slug>/` | `width=device-width, initial-scale=1.0, viewport-fit=cover` | **vardı** |

O etiketi kopyalamak hareketi kapatırdı ama **iki parmakla yakınlaştırmayı
da** kapatırdı. Bunun yerine `ui.js` içinde ikinci dokunuşun varsayılan
davranışı iptal ediliyor: çift dokunuş kapanıyor, pinch aynen çalışıyor.

Dikkat edilen üç şey:

- `{ passive: false }` olmadan `preventDefault` hiçbir şey yapmaz.
- Ekranda başka parmak varsa dinleyici erken çıkıyor — pinch'e hiç
  dokunulmuyor.
- `touchend`'de `preventDefault` o dokunuşun **click'ini de yutar**. Aynı
  noktaya hızlı iki kez basmanın anlamlı olduğu kontroller (`[data-step]`
  kişi sayısı tuşları, form alanları, `[aria-pressed]` açık/kapalı
  düğmeler) bu yüzden dışarıda tutuluyor. Gerçek dokunuşlarla denendi:
  kişi sayısı iki dokunuşta 2 → 3 → 4.

CSS kuralı yine de duruyor: Android/Chrome'da çift dokunuşu kapatıyor ve
her yerde ~300ms'lik tıklama gecikmesini kaldırıyor.

**Neden evrensel seçici — bu bir kez yanlış yapıldı.** Kural ilk sürümde
yalnızca `html`'e verildi ve iOS Safari'de hiç işe yaramadı: kullanıcı
sağ taraflarda çift dokununca sayfa yakınlaşıp yana kayıyordu.

Sebep: **`touch-action` kalıtsal bir özellik değil.** Tarayıcı, dokunulan
elemandan yukarı doğru yalnızca onu kapsayan **kaydırma kabına** kadar
bakıyor. Bu sayfadaki dört blok — galeri şeridi, rozet şeridi, bölüm
menüsü, yorum filtresi — kendileri yatay kaydırma kabı olduğu için zincir
orada bitiyor. Tarayıcıda ölçüldü: dördünün de değeri `auto` idi. Çift
dokunuş o bloğun **içerik** genişliğine (galeride 2340px) yakınlaşıyor,
sayfa yana kayıyordu.

Evrensel seçiciyle ölçüm: üç sayfada da `auto` kalan **tek bir eleman
yok**. Yatay şeritler bundan zarar görmüyor — `manipulation` = `pan-x` +
`pan-y` + `pinch-zoom`, yana kaydırma dokunmatik olaylarla test edildi ve
çalışıyor.

Özgül seçicili kurallar (örn. `.promo-scroll { touch-action: pan-y }`)
evrensel kuralı ezmeye devam eder; `*`'ın ağırlığı sıfır. `auto` dışındaki
her değer çift dokunuşu kapattığı için onlar da sorun değil — test
`touch-action: auto` yazan bir kural eklenmesini engelliyor.

**Not:** `index.html`'in viewport etiketinde `maximum-scale=1.0,
user-scalable=no` **hâlâ duruyor** (bu değişiklikten önce de vardı).
Yani anasayfada iki parmakla yakınlaştırma kapalı. Tur sayfalarında öyle
değil. Bir erişilebilirlik kaybı; ayrı bir işte ele alınmalı.

### Ekran görüntüsü karşılaştırırken dış ağı kes

Bu ortamda `images.unsplash.com` ve `commons.wikimedia.org` egress
politikasıyla engelli. Görseller yüklenmeyince `ui.js` nötr yer tutucuya
düşüyor — ama **reddedilme süresi her çalıştırmada biraz farklı**, yani
yedeğe geçiş anı da farklı. Sonuç: aynı kodun iki ekran görüntüsü birkaç
pikselde ayrışabiliyor ve bu, olmayan bir gerilemeyi varmış gibi
gösteriyor. (Bu dosyada iki kez böyle bir iz sürüldü; ikisi de sahte
çıktı.)

Çözüm, karşılaştırma yaparken 127.0.0.1 dışındaki her isteği tarayıcıda
anında kesmek:

```js
await page.route('**/*', r =>
  r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
```

Böylece render tamamen belirlenimci oluyor ve "değişiklikli/değişiklik
öncesi" karşılaştırması bayt bayt anlam taşıyor.

### `app.js` artık her sayfada yükleniyor

Başlık, arama, bildirimler, profil ve giriş modalının davranışı `app.js`
içinde. Davranışı ikinci kez yazmak yerine dosyanın kendisi sayfadan
bağımsız hâle getirildi: anasayfaya özgü kaplara (`top10Scroll`,
`catScroll`, `cardSections`, mobil menü, filtre çubuğu, tarih takvimi)
erişim `byId`/`onId` üzerinden korumalı. Eleman yoksa o satır sessizce
geçiyor.

Bu korumanın sebebi somut: `app.js` en üst seviyede çalışan tek bir
betik. Korumasız bir `document.getElementById('x').addEventListener(...)`
tur sayfasında `TypeError` atınca dosyanın **geri kalanı hiç
çalışmıyor** — başlık, arama, bildirimler, profil, giriş modalı topluca
ölüyor. Bu yüzden `tests/site-chrome.test.js` zincirleme
`document.getElementById('...').` kullanımını tümden yasaklıyor.

Anasayfada eleman her zaman bulunduğu için davranış değişmedi; doğrulama
için anasayfanın masaüstü ve mobil ekran görüntüleri değişiklik
öncesi/sonrası piksel piksel karşılaştırıldı ve birebir aynı çıktı.

`ui.js` de yüklenir: içindeki blokların hepsi eleman yoksa sessizce
çıkıyor ve görsel yedek mekanizması (ölü URL → nötr yer tutucu) burada da
çalışıyor. `home-blocks.js` `app.js`'ten önce gelmek zorunda; ayrıca
`CONTACT` oradan okunuyor — destek numarası iki sayfada ayrı ayrı
yazılmasın diye.

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

## Yan çevirince yazı ölçüleri bozuluyordu

Telefon yatay tutulduğunda bazı paragraflar kendiliğinden büyüyor,
gövde metni üstündeki **kalın** etiketten daha iri görünüyordu. Hepsi
birden büyümediği için ölçüler birbirine göre bozuluyordu — asıl
şikâyet de buydu.

Sebep WebKit'in "metin otomatik büyütme" (text autosizing) davranışı:
dar ekrana sığdırılmış geniş blokların yazısını okunur kılmak için
tarayıcı kendiliğinden büyütüyor, ama bunu **blok blok** uyguluyor.

Bunun neden yalnızca tur sayfalarında görüldüğü, hatayı bulmayı
kolaylaştıran ipucu oldu: anasayfanın `viewport` etiketinde
`user-scalable=no` var ve WebKit yakınlaştırılamayan sayfalarda bu
büyütmeyi hiç uygulamıyor. Tur sayfalarında o etiket **bilerek** yok
(çift dokunuşla yakınlaştırma işinde alınan karar; `tests/tour.test.js`
içindeki viewport testi koruyor).

Bu yüzden çözüm olarak `user-scalable=no` kopyalanmadı — hatayı
kapatırdı ama kullanıcının parmakla yakınlaştırmasını da elinden
alırdı. Onun yerine `assets/css/style.css` içindeki `html` kuralına:

```css
-webkit-text-size-adjust: 100%;
text-size-adjust: 100%;
```

`100%` = "yazı boyutlarını olduğu gibi bırak". Kullanıcının kendi
yakınlaştırmasını engellemez; yalnızca tarayıcının kendi kafasına göre
yaptığı büyütmeyi kapatır.

Ölçüm (dikey 390×844 → yatay 844×390): gövde ve etiket ölçülerinin
tamamı birebir aynı kaldı; yalnızca bilerek `clamp(...vw...)` ile
yazılmış başlıklar ölçekleniyor (`h1` 21 → 26.2px, `h2` 17 → 17.7px).

**Doğrulanamayan kısım:** WebKit'in otomatik büyütmesi buradaki
Chromium'da yeniden üretilemiyor, dolayısıyla düzeltme gerçek iOS
Safari'de sınanmadı. Yukarıdaki ölçüm yalnızca bir gerileme olmadığını
gösteriyor.

## Rezervasyon özetindeki iki hata

**Kapatma ikonu görünmüyordu.** Başlıktaki düğme `${tourSvg('close')}`
yazıyordu; `tourSvg()` çıplak bir `<svg>` döndürüyor, CSS'te ise
yalnızca `.tour-icon-btn .icon { width: 19px; height: 19px }` var. Sarmalayıcı
`<span class="icon">` olmadığı için kural hiç eşleşmedi ve çarpı 19px
yerine 38px çıkıp dairenin dışına taştı. `ic('close')` (sarmalayan
yardımcı) ile düzeltildi: ölçülen svg 38×38 → 19×19.

`ikon ölçüleri` testi bunu genel bir kurala bağlıyor: çıplak `tourSvg()`
basan her sınıfın `tour.css` içinde bir `.<sınıf> svg` ölçü kuralı
olmak zorunda. Böylece aynı tuzak başka bir düğmede tekrarlanırsa test
düşer.

**WhatsApp düğmesi eklendi.** Telefonun altına, o da beyaz (`ghost`).
İkon `TOUR_ICONS`'a konmadı: o setteki ikonlar çizgiyle çiziliyor
(`fill: none`), WhatsApp logosu ise dolu bir şekil. Yol
`home-blocks.js`'teki `WHATSAPP_ICON_PATH`'ten geliyor; anasayfadaki
WhatsApp düğmesiyle aynı kaynak, iki kopya tutulmuyor.

Üçüncü düğme eklenince masaüstündeki 2 sütunlu grid dengesiz kaldı:
"Anladım" yarım genişlikte durup sağında boşluk bıraktı. Onay düğmesi
artık `grid-column: 1 / -1` ile alt satırı tek başına kaplıyor.

## WhatsApp iki yerde

Rezervasyon **özetinde** (katman) ve rezervasyon **panelinde** (sağ
sütun/sayfa içi kart), her ikisinde de telefonun hemen altında.

Paneldeki kart telefon kartıyla aynı biçimi kullanıyor
(`.tour-booking-help`); ikisi `.tour-booking-contact` sarmalayıcısında
duruyor ve aradaki boşluk oradan geliyor. Sarmalayıcı olmasaydı boşluk
panelin kendi boşluğuna kalırdı ve aynı işi gören iki kart birbirinden
uzak dururdu.

Alt satır ikisinde de `CONTACT.hours` — aynı destek masası, ayrı bir
saat bilgisi uydurulmadı.

## Sunum niteliği CSS'i yenemez — WhatsApp logosu iki kez yanlış çizildi

İlk sürümde dolgu `<svg fill="currentColor">` **niteliğiyle** verilmişti.
Ekranda hiçbir şey değişmedi: `fill` ve `stroke` birer *sunum niteliği*
(presentation attribute), CSS'in en altında durur ve **herhangi bir**
kural onları yener. `style.css`'teki

```css
.icon svg { fill: none; stroke: currentColor; stroke-width: 1.8; }
```

kazandı; logo dolgu yerine 1.8px çizgiyle çizildi ve 19px'e inince
ahizenin ince detayı tıkanıp tanınmaz bir yumruya dönüştü.

Doğrusu kuralı CSS'ten geri almak — anasayfa bunu zaten yapıyordu
(`.home-support-wa-icon svg`). Tur sayfasında karşılığı:

```css
.tour-wa-icon.icon svg { fill: currentColor; stroke: none; }
```

Seçici bilerek iki sınıflı: `.icon svg` ile aynı özgüllükte olsaydı
kazanması dosya sırasına kalırdı.

**Bu hatayı ilk turda kendi doğrulamam kaçırdı.** Tarayıcıda
`svg.getAttribute('fill')` okudum ve `"currentColor"` görüp geçtim —
oysa o yalnızca kaynakta ne yazdığını söyler, ne uygulandığını değil.
`getComputedStyle(svg).fill` okunsaydı `none` çıkardı. Ders: bir stilin
**uygulandığını** doğrulamak için hesaplanan değere bakılır, niteliğe
değil.

Test de aynı hatayı yapıyordu: kaynakta `fill="currentColor"` arıyordu,
yani tam olarak işe yaramayan şeyi doğruluyor ve geçiyordu. Artık
niteliği değil CSS kuralını arıyor, üstelik niteliğin geri gelmesini
ayrıca yasaklıyor (işe yaramaz ama yaradığı sanılır).

## Logonun halkası bir yanda kalınlaşıyordu

Küçük ölçüde "iki ikon üst üste binmiş" gibi görünüyordu. Sebep stil
değil, **yolun geometrisi**.

Logo iç içe iki daireden oluşuyor: dış baloncuk (r=10) ve onu halka
yapan delik (r=8.13). İkisinin eşmerkezli olması gerekir. Değillerdi:
deliği çizen yayın **başlangıç noktası** merkeze 8.39 uzaktaydı, yani
kendi dairesinin dışında duruyordu. SVG yayı iki uç noktadan geçmek
zorunda olduğu için merkez `(12.06, 12.60)`'a — dış merkezden 0.61 birim
aşağı — kayıyordu.

Rasterleştirip halka kalınlığını 5 derecede bir ölçtüm:

| açı | kalınlık |
|---|---|
| tepe | 2.48 birim |
| sağ / sol | 1.87 birim |
| dip | 1.27 birim |

En kalın/en ince oranı **1.74×**. Şikâyet edilen şey buydu.

Önce yay başlangıcını daireye oturtmayı denedim; oran 2.98×'e **çıktı**,
çünkü uç noktalar değişince yay bayrakları diğer merkez adayını
seçiyordu. Bayrak kombinasyonlarını tarayınca da temiz bir sonuç
çıkmadı — "en iyi" görünen adaylarda delik tümden kapanmıştı.

Sonuçta iki baloncuk konturu tam geometriyle **yeniden üretildi**: her
iki yay da `(12.04, 12)` merkezli, yarıçaplar 10 ve 8.13, kuyruk
uçları korundu. Ahize alt yolu aynen bırakıldı. Ölçüm: kalınlık
1.845–1.904, oran **1.03×**.

Yol `home-blocks.js`'te tek kopya olduğu için anasayfadaki WhatsApp
düğmesi de aynı düzeltmeden yararlandı; orada da aynı hata vardı.

`tests/home-blocks.test.js` artık yolu ayrıştırıp eşmerkezliliği
doğruluyor: dış yayın iki ucundan merkezi çözüyor, sonra deliğin
uçlarının o merkeze 8.13 uzaklıkta olduğunu sınıyor. Eski hatalı yol
geri konulduğunda test düşüyor.

### Ölçüm yöntemine dair iki hata

Bu işte kendi ölçümümü iki kez yanlış kurdum, ikisi de yanıltıcı sonuç
verdi:

1. Halkayı **merkezden dışarı** tararken ışın ahizeye çarpıyordu ve
   kalınlık 0.1 birim gibi saçma değerler çıkıyordu. Doğrusu dışarıdan
   içeri taramak — ahize halka bölgesine girmiyor.
2. Ekran görüntüsü kırparken `clip`'e `getBoundingClientRect()` değerini
   verdim. `clip` **belge** koordinatı ister, o ise **görünüm**
   koordinatı döndürür; sayfanın 5200px aşağısındaki düğme yerine en
   üstteki logo çıktı ve bir an "düğmenin üstünü bir katman kapatıyor"
   sandım. Kaydırma farkı eklenince düzeldi.

## WhatsApp kartındaki çevrimiçi ışığı

Alt satırda yeşil bir nokta ve "Çevrimiçi" yazıyor. **Işık sabit değil,
saate bağlı.** Sabit yeşil olsaydı gece 3'te de "Çevrimiçi" yazardı —
sitede duran yanlış bir bilgi olurdu.

**WhatsApp'ın saatleri telefon hattından ayrı ve daha geniş:**

| kanal | saatler | nerede duruyor |
|---|---|---|
| telefon | 09:00 – 22:00 | `CONTACT.hours`, yalnızca ekranda yazıyor |
| WhatsApp | 08:00 – 23:59 | `whatsappOpenHour` / `whatsappCloseHour`, ışığı besliyor |

| durum | ışık | metin |
|---|---|---|
| 08:00 – 23:59 | yeşil | Çevrimiçi |
| dışında | sönük gri | Şu an kapalı · 08:00'da açılır |

Yani sabah 08:30'da telefon kartı "09:00 – 22:00" yazarken WhatsApp
"Çevrimiçi" diyor. Çelişki değil: WhatsApp penceresi bilerek daha
geniş. Test bu ilişkiyi kilitliyor — WhatsApp penceresi telefonunkini
**kapsamak zorunda**; daraltılırsa test düşüyor.

`whatsappCloseHour: 24` "gece yarısına kadar" demek. İstenen üst sınır
23:59 ve `supportOnline` üst sınırı dışarıda bıraktığı için
(`saat < kapanis`) 23:59:59'a kadar açık, 00:00'da kapalı oluyor.
`23.98` gibi bir değer 23:59'u dışarıda bırakırdı.

Üç karar:

**Saat Türkiye'ye göre okunuyor**, ziyaretçinin cihaz saatine göre
değil (`Intl.DateTimeFormat` + `Europe/Istanbul`). Yurt dışından giren
biri kendi saatiyle yanlış bir durum görmesin diye.

**Saatler `CONTACT` içinde hem metin hem sayı olarak duruyor**
(`hours` ekranda görünen, `supportOpenHour`/`supportCloseHour` mantık).
Ekrandaki metni ayrıştırmak kırılgan olurdu. İkisi birbirini tutmazsa
test düşüyor — birini değiştirip ötekini unutmak mümkün değil.

**Renk tek başına bilgi taşımıyor.** Kapalıyken yalnızca nokta sönmüyor,
metin de değişiyor; rengi ayırt edemeyen biri için de anlaşılır.

Işığa parlama/hale eklenmedi: `docs/arayuz-kurallari.md` bunu site
genelinde yasaklıyor. Nokta düz bir daire.

### Yine aynı cascade tuzağı

Durum satırı ilk yazıldığında ışık yazının **üstüne** binip ortalandı.
Sebep `.tour-booking-help span` kuralı: o kural sütun yönlü flex veriyor
ve `(0,1,1)` özgüllüğüyle tek sınıflı `.tour-durum`'u `(0,1,0)` yeniyor.
Geri alan kural bu yüzden `.tour-booking-help .tour-durum` olarak
yazıldı ve `flex-direction: row` açıkça belirtildi.

Bu, bu depoda üçüncü kez aynı biçimde çıkan hata — bir kuralın varlığı
yetmiyor, **kazandığını** da doğrulamak gerekiyor.

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
