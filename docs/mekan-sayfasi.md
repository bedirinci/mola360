# Mekan içerik sayfası (`/mekan/<slug>/`)

Anasayfadaki "Popüler Mekanlar" şeridi bir listeydi; tıklanacak sayfa
yoktu. Mekan, dört içerik türünden **ikisine birden** benzemediği için
kendi sayfasını gerektirdi: tur/aktivite/etkinlik gibi bir seans
satılmıyor, otel gibi bir gece de satılmıyor. Ortak kararlar
`docs/tur-sayfasi.md`, `docs/otel-sayfasi.md`,
`docs/aktivite-sayfasi.md` ve `docs/etkinlik-sayfasi.md` içinde.

## Dosyalar ve sorumlulukları

| Dosya | Ne yapar |
|---|---|
| `mekan/<slug>/index.html` | İskelet, statik SEO bilgisi, bölüm kapları, `BreadcrumbList` |
| `assets/js/venue-data.js` | Mekan kayıtları + saf hesaplar (açık/kapalı, seans, tutar) |
| `assets/js/venue-page.js` | Veriyi işaretlemeye çevirir, etkileşimleri bağlar |
| `assets/css/venue.css` | Durum rozeti, alan/hizmet kartları, saat tablosu, menü |
| `tests/venue.test.js` | Saf fonksiyonlar + sayfanın kendi kaydıyla tutarlılığı |

Sayfa iskeleti yine `assets/css/tour.css` üstüne kuruluyor; `venue.css`
yalnızca mekâna özgü parçaları ekliyor.

## Mekanı ayıran iki şey

| | tur | otel | aktivite | etkinlik | **mekan** |
|---|---|---|---|---|---|
| Zaman | belirli günler | her gün açık | her sabah | sayılı temsil | **çalışma saatleri** |
| Ne seçilir | tarih + kişi | tarih aralığı + oda | tarih + seans + paket | temsil + blok + bilet | **tarih + saat + alan/hizmet** |
| Şimdi ödenen | tamamı | tamamı | tamamı | tamamı | **kapora** ya da **hiç** |

**1. Mekânın açık/kapalı olması bir durum, bir stok değil.** Diğer dört
türde "bugün var mı" sorusunun cevabı bir listede duruyor. Mekânda cevap
saate bağlı ve dakikası dakikasına değişiyor; künyedeki rozet bunu
söylüyor ve `initOpenStatus()` her 60 saniyede bir tazeliyor.

**2. Tek bir mekan şablonu iki ayrı rezervasyon modeli taşıyor.**
Gece kulübü, restoran ve beach club **masa** tutar; kuaför, masaj salonu
ve güzellik merkezi **randevu** verir. İkisi ayrı sayfa tipi yapılsaydı
aynı künye, galeri, saat tablosu, kural ve yorum kodu iki kez yazılırdı.
Fark tek bir alanda: `booking: 'masa' | 'randevu'`.

## İki rezervasyon modeli

| | `masa` (Kum Beach Club) | `randevu` (Kordon Spa) |
|---|---|---|
| Seçilen | alan (şezlong / sedir / loca) | hizmet (klasik, sıcak taş, aromaterapi, çift) |
| Fiyat ekseni | `minSpend` + `deposit` | `price` (kişi başı) |
| Şimdi ödenen | **kapora** | **yok** |
| Özet etiketi | "Şimdi ödenecek" | "Mekânda ödenecek" |
| Karttaki fiyat | en düşük minimum harcama | en ucuz hizmet |
| Fiyat birimi | "masada en az" | "hizmet başı" |

**Minimum harcama toplama girmiyor.** Locada 9.000 TL minimum var ama
şimdi ödenen 2.500 TL kapora. Minimumu toplama katmak, ödenmeyecek bir
tutarı ödeme ekranında göstermek olurdu; hiç göstermemek de kapıda
öğrenilen bir sürpriz bırakırdı. Bu yüzden kendi kutusunda, toplamın
**üstünde** duruyor: "Masada en az 1.500 TL harcama bekleniyor;
kaporanız bu tutardan düşülür."

**Randevuda hiçbir şey tahsil edilmiyor.** `payAtVenue: true` ve özet
"Mekânda ödenecek" diyor. Masaj salonunun gerçek pratiği bu; "Şimdi
ödenecek" yazıp ödeme almamak formun ne yaptığı konusunda yalan olurdu.

**Giriş ücreti ayrı satır.** `pricing.entryFee` kişi başı, kaporadan
ayrı görünüyor (bu kayıtta 0, ama alan var ve testli): otelin konaklama
vergisi, etkinliğin hizmet bedeliyle aynı gerekçe — ilan edilen fiyat
ile ödenen tutar ayrışmasın.

## Çalışma saatleri ve gece yarısı

Beach club 02:00'de (hafta sonu 03:00) kapanıyor. Yani kapanış saati
açılış saatinden **küçük**: vardiya gece yarısını aşıyor.
`venueOpenNow(place, when)` sırayla bakıyor:

1. Bugünün vardiyası sürüyor mu,
2. **dünün** vardiyası gece yarısını aşıp hâlâ sürüyor mu
   (gece 01:30'da mekân açık, ama "bugünün" vardiyası daha başlamadı),
3. ikisi de değilse bir sonraki açılış ne zaman.

Üçüncü hâlde rozet "Kapalı" demekle kalmıyor, ne zaman açılacağını da
söylüyor: pazar kapalı olan spa için "Pazartesi 10:00". Yalnızca
"Kapalı" yazmak, kullanıcıyı saat tablosunu kendi okumaya zorluyordu.

Kapalı günler tarih çiplerinde de **görünüyor ama seçilemiyor**
(`.mkn-date-chip.is-kapali`). Günü listeden çıkarmak "neden pazar yok"
sorusunu doğuruyordu.

Seans listesi de güne bağlı: `venueSlots()` hafta sonu `weekendSlots`,
hafta içi `slots` döndürüyor. Beach club hafta sonu 09:00'da başlayıp
22:00'ye kadar, hafta içi 10:00 – 21:00 arası seans veriyor.

## Kişi sayısı: kapasite ve sabit kişi

`clampVenueParty()` iki kuralı birden uyguluyor:

- **Kapasite**: locada 8, şezlongda 2 kişi. Alan değişince sayı
  kendiliğinden sınıra çekiliyor.
- **Sabit kişi** (`requiredGuests`): **çift masajı tanımı gereği 2
  kişilik**. O hizmet seçilince sayaç 2'ye kilitleniyor, satır
  soluklaşıyor, artı düğmesi kapanıyor ve nedeni altında yazıyor.

Kural veride, kodda değil — "çift" kelimesini koddan tanımak, veri
değişince sessizce bozulacak bir bağ olurdu.

## Menü: yalnızca yiyecek satan mekânda

Beach club sayfasında `Menü` sekmesi var, spa sayfasında yok. Bölüm
kapları sayfaya göre değişiyor ve `venue-page.js` **kabı olmayan
bölümü atlıyor** — iki ayrı şablon değil, bir şablon ve iki iskelet.
Aynı mantık `alanlar` / `hizmetler` kabı için de geçerli.

## Anasayfa bağlantısı

Kart elle yazılmıyor. `catalog.js` içindeki `mekanlar` kaynağı kaydı
görüp "Popüler Mekanlar" şeridine kendisi koyuyor; şeride
`id="mekanlar"` verildi ki künyedeki kategori bağı bir yere gitsin.

Mekan kartı diğer türlerden bir alan fazla taşıyor: **açık/kapalı
durumu**. Kartta "Şu an açık", kapalıyken bir sonraki açılış yazıyor —
şeritte duran diğer mekan kartlarıyla aynı görünüm, ama bu ikisinde
değer canlı.

**Mekan "Yaklaşan Planlar" şeridine girmiyor.** O şerit sayılı tarihi
olan içerik için; mekân her gün açık.

## Yapısal veri

Yalnızca `BreadcrumbList`. `LocalBusiness`, `Restaurant`, `Offer`,
`AggregateRating`, `openingHours` ve `telephone` **bilerek yok**:
içerik örnek olduğu sürece uydurma fiyat ve puanı işaretlemek yanıltıcı
(`docs/seo-arastirma.md`, madde 2). `openingHours` ve `telephone` ayrı
bir sebeple de yasak — Google bunları harita kartında doğrudan
gösteriyor; olmayan bir mekânın saatini ve telefonunu oraya koymak,
arayan birini yanlış yere yollamak olurdu. Test altısını birden
yasaklıyor.

## Ölçülenler

Chromium, dış ağ kesik (390×844 ve 1440×900):

- Beach club: sekiz sekme (`Genel Bakış, Alanlar, Menü, Saatler, Konum,
  Kurallar, Yorumlar, SSS`), üç alan kartı, üç menü grubu, yedi saat
  satırı — bugünkü satır vurgulu — ve altı seans çipi.
- Künye "Şu an açık · 02:00'de kapanıyor" yazıyor.
- Şezlong: **500 TL** "Şimdi ödenecek" + "masada en az 1.500 TL".
  Loca seçilince 2.500 TL / en az 9.000 TL.
- Spa: yedi sekme (Menü yok), dört hizmet kartı, özet etiketi
  **"Mekânda ödenecek"**, minimum harcama kutusu yok.
- Çift masajı seçilince kişi sayısı 2'de kilitli, satır `is-pasif`,
  "Çift masajı tanımı gereği 2 kişilik", toplam 4.400 TL.
- Rezervasyon özeti açıkken gövde `fixed`, Escape'te `relative`; yatay
  taşma ve konsol hatası yok.
- Anasayfada her iki mekân da "Popüler Mekanlar" şeridinde, durumu
  "Açık", bağları `mekan/<slug>/`.
- "beach" aramasında Kum Beach Club bağ olarak çıkıyor; tıklayınca
  `/mekan/kum-beach-club/` açılıyor.

## Bu işte yakalanan hata

Kayıtlar önce `VENUES` adıyla yazıldı. `home-blocks.js` **zaten**
`VENUES` adlı bir dizi tutuyor (şeritteki gezilecek yer kartları) ve
ikisi de klasik `<script>` ile aynı kapsama yükleniyor: ikinci
`const VENUES` tanımı `SyntaxError` atıp **anasayfanın tüm betiklerini**
düşürürdü. Node tarafında adlar modülden geldiği için testler bunu
göremezdi.

Ad `PLACES` oldu ve iki koruma eklendi: `tests/venue.test.js` veri
dosyasında `const PLACES` arıyor, `tests/katalog.test.js` ise anasayfanın
bütün betiklerini `node:vm` ile **tek kapsamda** çalıştırıp çakışma
olmadığını ölçüyor. İkincisi `PLACES`'ı `VENUES` yapan bir mutasyonla
doğrulandı — test kırmızıya döndü.

## Bilerek yapılmayanlar

- **Masa planı yok.** Alan seçiliyor, masa numarası mekânda veriliyor.
- **Canlı doluluk yok.** Kalan yer tarihten, saatten ve alandan
  türetiliyor; aynı seçim her yenilemede aynı sayıyı veriyor.
- **Telefonla arama düğmesi yok.** Numara kurgusal olduğu sürece arama
  başlatan bir düğme koymak doğru değil.
- **Üçüncü mekan sayfası yok.** `PLACES`'a kayıt eklemek ve
  `mekan/<slug>/index.html` yazmak yeterli; gece kulübü ve restoran
  `masa`, güzellik merkezi `randevu` modeline oturuyor.
