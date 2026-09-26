# Veri sözleşmesi

Ön yüz ile ileride gelecek backend arasındaki **tek anlaşma**. Bir ekranın
hangi veriyi hangi biçimde aldığı burada yazılı. Bugün cevaplar depodaki
örnek veriden geliyor; backend geldiğinde aynı cevapları API verecek ve
**yalnızca veri kapısı** (`assets/js/data-gateway.js`) değişecek. Ekranlar
değişmeyecek.

Bu belge mevcut veritabanı şemasıyla (`backend/migrations/`) uyumlu
yazıldı. Şemada karşılığı olmayan alanlar "backend'e eklenecek" diye
ayrıca işaretli (bölüm 11).

## 1. Katmanlar

```
 Ekranlar  (tour-page.js, hotel-page.js, …, app.js, catalog.js)
    │   veriyi YALNIZCA MolaVeri'den ister
    ▼
 Veri kapısı  assets/js/data-gateway.js  → MolaVeri
    │
    ├── bugün:  örnek veri
    │     tour-data.js, hotel-data.js, activity-data.js,
    │     event-data.js, venue-data.js   (ürün kayıtları)
    │     sample-catalog-data.js         (henüz sayfası olmayan örnek ürünler)
    │     taxonomy-data.js               (kategori, tema, koleksiyon, destinasyon, liste sayfası)
    │     inventory-data.js              (örnek rezervasyonlar → kontenjan)
    │
    └── backend gelince:
          sayfa yükü  → sunucu sayfaya gömer (SSR)
          canlı sorgu → fetch('/api/…')
```

### Sayfa yükü ve canlı sorgu

Kapıdan iki tür okuma yapılıyor ve farkları bilerek:

| | Sayfa yükü | Canlı sorgu |
|---|---|---|
| Örnek | Ürün kaydı, kategori ağacı, ana sayfa kartları | Kontenjan, arama, filtreli liste, fiyat teklifi |
| Değişme sıklığı | İçerik yayınlandığında | Her an (biri satın aldığında) |
| Kapıdaki biçimi | **Senkron** dönüş | **Promise** dönüş |
| Bugün | Depodaki veri dosyası | Depodaki örnek veriden hesap |
| Backend gelince | Sunucu sayfayı üretirken içine gömer | `fetch` ile API |

Ürün kaydını Promise ile döndürmek, sayfaların tamamını asenkron yazmayı
gerektirirdi; oysa backend geldiğinde de ürün kaydı sayfayla birlikte
gelecek (SEO için sayfanın sunucuda üretilmesi zaten şart). Kontenjan
ise sayfaya gömülemez: sayfa önbellekten gelebilir, kontenjan ise saniyeler
içinde değişir. Bu yüzden kontenjan **her zaman** canlı sorgu.

**Kural:** Ekranda gösterilen fiyat ve kontenjan bilgi amaçlıdır. Ödeme
adımında backend fiyatı ve kontenjanı **yeniden hesaplar**; ekrandaki
değere güvenmez.

## 2. Ürün tipleri ve adresler

| Tip (`type`) | Detay adresi | Liste adresi | Kayıt dosyası |
|---|---|---|---|
| `tour` | `/tur/<slug>/` | `/turlar/`, `/turlar/<liste>/` | `tour-data.js` (`TOURS`) |
| `hotel` | `/otel/<slug>/` | `/oteller/`, `/oteller/<liste>/` | `hotel-data.js` (`HOTELS`) |
| `activity` | `/aktivite/<slug>/` | `/aktiviteler/`, `/aktiviteler/<liste>/` | `activity-data.js` (`ACTIVITIES`) |
| `event` | `/etkinlik/<slug>/` | `/etkinlikler/`, `/etkinlikler/<liste>/` | `event-data.js` (`EVENTS`) |
| `venue` | `/mekan/<slug>/` | `/mekanlar/`, `/mekanlar/<liste>/` | `venue-data.js` (`PLACES`) |

Tip adları backend'deki `content.type` ile birebir aynı.

Diğer adresler: `/temalar/`, `/temalar/<slug>/`, `/koleksiyonlar/`,
`/koleksiyonlar/<slug>/`, `/firsatlar/`, `/firsatlar/<slug>/` (2. adımda
açıldı); `/yeni-eklenenler/`, `/bu-hafta/`, `/arama/` (3. adım),
`/hesabim/…` (5. adım), `/kurumsal/…` (6. adım). Henüz içeriği olmayan
menü adresleri "yakında" ekranını açar.

**Tek yönlendirici.** Dosyası olmayan her adres `404.html`'e düşer
(GitHub Pages ve `npm run dev` aynı davranır) ve
`MolaVeri.adres(yol)` sayfanın ne olduğuna karar verir (bölüm 12).
Ürün adresinin dosyası varsa (bugünkü 7 ürün) o dosya açılır; yoksa
aynı detay şablonu yönlendiriciden kurulur. Ürün, kategori veya liste
sayfası için HTML dosyası yazılmıyor.

`<liste>` hem bir **kategori** hem bir **liste sayfası** olabilir (bölüm 5).
İkisi aynı adres alanını paylaştığı için aynı tip içinde slug'ları
çakışamaz; `tests/taksonomi.test.js` bunu ölçüyor.

## 3. Slug kuralları

`assets/js/slug-utils.js` → `slugOlustur(metin)`

- Türkçe harfler **küçültmeden önce** çevrilir: `İ→i`, `I→i`, `ı→i`,
  `Ş→s`, `Ğ→g`, `Ü→u`, `Ö→o`, `Ç→c`. Sebep: JavaScript'te
  `'İ'.toLowerCase()` düz `i` değil, `i` + birleşik nokta (U+0307) üretir
  ve adreste bozuk karakter kalır.
- Harf ve rakam dışındaki her şey tek tireye iner, baştaki ve sondaki
  tireler atılır: `"Karadeniz Yaylaları & Batum Turu!"` →
  `karadeniz-yaylalari-batum-turu`.
- Slug **tip içinde** tekil (`/tur/x` ile `/otel/x` birlikte var olabilir).
  Çakışmada `benzersizSlug(taban, mevcutlar)` sonuna `-2`, `-3` ekler;
  yönetim paneli admini ayrıca uyarır.
- Slug değişirse eski adres ölmez: backend `url_redirects` tablosuna 301
  kaydı yazar.

## 4. Ürün kaydı: ortak alanlar

Her ürün kaydı bu alanları taşır. Tipe özgü alanlar ilgili sayfa belgesinde
(`docs/tur-sayfasi.md`, `docs/otel-sayfasi.md`, `docs/aktivite-sayfasi.md`,
`docs/etkinlik-sayfasi.md`, `docs/mekan-sayfasi.md`) ve bölüm 4.3'te.

### 4.1 Kimlik ve görünüm

| Alan | Anlamı | Backend |
|---|---|---|
| `slug` | Adres parçası (bölüm 3) | `content.slug` |
| `type` | Turda `daily`/`stay`, diğerlerinde tip adı | `content.type`, `tours.kind` |
| `title`, `tagline` | Başlık ve alt başlık | `content.title`, `content.tagline` |
| `code` | Ürün kodu (`MLA-EFS-01`) | `content.product_code` |
| `area` | İnsanın yazdığı konum cümlesi ("Selçuk, İzmir") | `content.area` |
| `card` | Kartın türetilemeyen alanları: `img`, kısa `title`, `badges`, `meta1`, `sponsored` | `content.card_*` |
| `seo` | `title`, `description`, `ogTitle`, `ogDescription`, `ogImage` | `content_seo` |
| `currency` | Fiyatların para birimi: `TRY`, `EUR`, `USD` | **eklenecek** |

### 4.2 Sınıflandırma: `taxonomy`

```js
taxonomy: {
  categories:  ['ege-turlari', 'kultur-turlari'], // tip içinde; ilki ana kategori (breadcrumb)
  themes:      ['kultur-tarih'],                  // tipler arası
  collections: ['ailece'],                        // yalnızca ELLE seçilen koleksiyonlar
  city:        'izmir',                           // bölge şehirden türetilir
  facets:      { transport: ['minibus'], departFrom: ['izmir'] }
}
```

Beş kavram birbirine karışmıyor (bölüm 5). Kayıttaki eski görüntü alanları
(`region: 'Ege'`, `category: 'Günübirlik Tur'` gibi) ekranlar değişmesin
diye yerinde duruyor, ama artık **türetilmiş** sayılıyor: testler bu
metinlerin `taxonomy`'den çıkan değerle aynı olduğunu ölçüyor. İkisi
ayrışamaz.

| Eski alan | Artık neyin görüntüsü |
|---|---|
| `region` | `taxonomy.city` → şehrin bölgesinin adı |
| `category`, `categoryShort`, `categoryPlural`, `categoryAnchor` (tur) | Tur tipi: günübirlik / konaklamalı (`TAXONOMY_TOUR_KINDS`) |
| `categoryShort` (diğer tipler) | Ana kategorinin kısa adı (`nameShort`) |
| `categoryPlural`, `categoryAnchor` (diğer tipler) | Tipin çoğul adı ve anasayfa çapası (`TAXONOMY_TYPES`) |

Diğer tiplerdeki `category` metni ("Sahne Sanatları", "Mekan") henüz
tutarlı bir kurala bağlı değil; yalnızca yönetim panelinin listesinde
görünüyor. 2. adımda liste sayfaları açılınca kaldırılacak.

### 4.3 Satış ve deneyim

| Alan | Anlamı |
|---|---|
| `pricing` | Tipe özgü fiyat alanları. Turda `adult`/`perPerson`…, otelde odalar ve pansiyonlar, aktivitede paketler ve seanslar, etkinlikte bilet kategorileri, mekânda alanlar veya hizmetler |
| `addons` | Ek hizmetler: `id`, `label`, `price`, `per: 'guest' \| 'booking'` |
| `cancellation.tiers` | Kademeli iade: `{ minHours, rate, label, text }`. Rezervasyon anındaki hâli rezervasyona kopyalanır (4. adım) |
| `ratingBreakdown` | Yıldız dağılımı. Ortalama ve yorum sayısı **buradan hesaplanır**, ayrıca yazılmaz |
| `reviews`, `faq`, `gallery`, `highlights`, `description`, `included`, `excluded` | İçerik |
| `similar` | Benzer ürünler. Hedefin **slug'ı** tutulur; başlık, puan ve fiyat hedef kayıttan okunur (kopya tutulmaz) |
| `social` | "Son 24 saatte N kişi baktı" gibi sayılar. **Örnek veri.** Canlıda gerçek ölçümden gelmeli; ölçüm yoksa gösterilmez |

### 4.4 Sonraki adımlarda eklenecek alanlar

Biçim şimdiden sabit, veri ilgili adımda doldurulacak:

```js
deposit:  { mode: 'percent' | 'amount', value: 20, balanceDueDays: 14 }, // kapora (4. adım)
loyalty:  { points: 150 },                                              // Molapuan (5. adım), yalnızca turlar
```

## 5. Sınıflandırma kavramları

`assets/js/taxonomy-data.js` → `TAXONOMY`

| Kavram | Neyi anlatır | Örnek | Tipler | Adres |
|---|---|---|---|---|
| **Kategori** | Ürünün ne olduğu / nereye ait olduğu | Karadeniz Turları, Butik Oteller, Konserler | Tip içinde, iç içe (`parent`) | `/turlar/karadeniz-turlari/` |
| **Tema** | Ne yapmak istediğin | Doğa & Yayla, Gastronomi | Tipler arası | `/temalar/doga-yayla/` |
| **Koleksiyon** | Kiminle, nasıl bir kaçamak | Ailece, Bütçe Dostu | Tipler arası | `/koleksiyonlar/ailece/` |
| **Destinasyon** | Nerede | Ege → İzmir | Tipler arası | `/destinasyon/izmir/` (sonra) |
| **Özellik** (`facets`) | Filtrelenen nitelik | Ulaşım: otobüs, Pansiyon: her şey dahil | Tipe özgü | `?ulasim=otobus` |
| **Liste sayfası** | Kayıtlı bir filtre + SEO metni | Otobüslü Turlar = `ulasim: otobüs` | Tip içinde | `/turlar/otobuslu-turlar/` |

### Koleksiyon iki şekilde çalışır

- **Elle** (`mode: 'manual'`): ürün kaydının `taxonomy.collections`
  listesinde adı geçer.
- **Kurala göre** (`mode: 'rule'`): kural koleksiyonun kendi kaydında
  durur, ürün kaydına yazılmaz. Örnek: Bütçe Dostu = başlangıç fiyatı
  500 TL altı; Son Dakika = 7 gün içinde müsait tarihi var; Uzun Hafta
  Sonu = 2–3 gece.

Kurala göre koleksiyon ürüne elle **yazılamaz** (test ölçüyor): fiyat
değişince ürün koleksiyondan kendiliğinden çıkmalı.

### Menü nasıl eşleşti

`SONRA_BUNU_OKU` belgesindeki menü ağacının her satırı bir kavrama bağlandı:

| Menü | Kavram | Not |
|---|---|---|
| Yurt İçi Turlar, Yurt Dışı Turlar | Kategori (üst) | "Tüm Yurt İçi Turlar" = üst kategorinin sayfası |
| Karadeniz, Kapadokya, Ege… / Balkan, İtalya, Dubai… | Kategori (alt) | |
| Kültür Turları | Liste sayfası: `tema = kültür & tarih` | Temayla aynı ürünleri gösterir, tur tipine süzülmüş hâli |
| Günübirlik Turlar | Liste sayfası: tur tipi `daily` | |
| Hafta Sonu Turları | Liste sayfası: cuma/cumartesi kalkışlı, en fazla 2 gece | |
| Otobüslü / Uçaklı Turlar | Liste sayfası: `ulasim = otobüs / uçak` | |
| Butik Oteller, Termal Oteller, Bungalovlar | Kategori (tesis tipi) | |
| Yurt İçi Oteller, Kıbrıs Otelleri | Liste sayfası: destinasyon | |
| Balayı Otelleri, Aile Otelleri | Liste sayfası: koleksiyon (Romantik, Ailece) | |
| Her Şey Dahil Oteller | Liste sayfası: `pansiyon = her şey dahil` | |
| Aktiviteler, Etkinlikler, Mekanlar alt başlıkları | Kategori | |
| Fırsatlar alt başlıkları | Liste sayfası (tipler arası, `/firsatlar/…`) | |

**Onaylananlar** (kullanıcı kararı, 2. adımdan sonra):

1. **Dört kategori menüye girdi:** Spa & Masaj (Kordon Spa & Masaj),
   Sahne Sanatları (Aspendos; festival olduğu için Festivaller'de de),
   Şehir Otelleri (Kordon Butik Otel; Butik Oteller'de de), Resort
   Oteller (Sealight Resort).
2. **Üç yeni yurt içi kategori:** Marmara Turları (Sapanca, İznik),
   Doğu Anadolu Turları (Doğu Ekspresi), Kış Turları (Erciyes).
3. **Son Dakika** tek tanımla (kurala göre koleksiyon); Fırsatlar
   menüsündeki bağlantı aynı listeye gidiyor. İki ayrı tanım zamanla
   ayrışırdı.

## 6. Kontenjan (müsaitlik)

Kalan yer **hiçbir zaman ekranda hesaplanmaz veya uydurulmaz.** Veri
kapısından gelir. Önceki sürümde kalan yer tarihin karma değerinden
üretiliyordu (`seatsLeft`); bu, gerçek bir kontenjanla ilgisi olmayan bir
"son 3 yer" yazısıydı ve kaldırıldı.

```
MolaVeri.musaitlik(type, slug, { from: '2026-10-01', to: '2026-12-31' })
  → Promise<{
      type, slug, from, to,
      items: [
        { item: 'standart', date: '2026-10-03', time: '05:30',
          capacity: 20, remaining: 7, status: 'open' }
      ]
    }>
```

| Tip | `item` | `date` | `time` | `capacity` kaynağı | Backend `inventory.item_type` |
|---|---|---|---|---|---|
| Tur | `departure` | kalkış günü | kalkış saati | `pricing.seatsPerDeparture` | `tour_departure` |
| Otel | oda `id` | **gece** | yok | oda `count` | `hotel_room` |
| Aktivite | paket `id` | gün | seans saati | paket `capacity` | `activity_package` |
| Etkinlik | bilet kategorisi `id` | temsil günü | temsil saati | kategori `seats` | `event_ticket` |
| Mekân | alan veya hizmet `id` | gün | seans saati | alan/hizmet `count` | `venue_area` / `venue_service` |

Cevabı okuyan saf yardımcılar `data-gateway.js` içinde; ekranlar
kontenjanı yalnızca bunlarla okur. Backend geldiğinde de kalırlar
(`inventory-data.js` ise silinir):

- `musaitlikKaydi(musaitlik, item, date, time)` → tek satır veya `null`
- `konaklamaKalan(musaitlik, item, giris, cikis)` → otelde **her gecenin
  en küçüğü**. Önceki sürüm yalnızca giriş gecesine bakıyordu; üçüncü
  gecesi dolu bir oda satılabiliyordu.
- `tarihDoluMu(musaitlik, date, time?)` → o günün (veya seansın) bütün
  birimleri dolu mu; tarih ve seans çiplerini pasifleştirmek için
- `kontenjanDurumu(kalan, istenen, azEsigi)` →
  `{ durum: 'bilinmiyor' | 'doldu' | 'yetersiz' | 'az' | 'var', kalan }`
- `saatAnahtari("≈ 05:45")` → `"05:45"` (seans saatini satır anahtarına
  çevirir)

İstenen miktar tipe göre: turda ve aktivitede yetişkin + çocuk (bebek
kucakta), otelde oda sayısı, etkinlikte bilet adedi, mekânın masa
modelinde 1 alan, randevu modelinde kişi sayısı.

Ekranlardaki kural:

- `doldu` → "Bu tarihte yer kalmadı", rezervasyon düğmesi pasif.
- `yetersiz` (istenen kişi > kalan) → "Bu tarihte en fazla N kişilik yer
  var", düğme pasif.
- `bilinmiyor` (cevap henüz gelmedi veya kayıt yok) → kontenjan satırı
  gizli, satış **engellenmez**; son kontrol ödeme adımında.
- Tarihin (veya seansın) bütün birimleri doluysa çip takvimde kalır ama
  seçilemez ("dolu", etkinlikte "tükendi").
- Sayfa açılırken varsayılan tarih doluysa ilk müsait tarihe geçilir.

**Bugün:** `inventory-data.js` içindeki `SAMPLE_BOOKINGS` (örnek
rezervasyonlar) kapasiteden düşülerek kalan hesaplanıyor; tıpkı backend'in
satılan rezervasyonlardan hesaplayacağı gibi. Örnek rezervasyonlar
"ilk müsait kalkış", "ikinci müsait kalkış" diye **sıraya göre**
yazılıyor ki tarihler geçtikçe bayatlamasın.

## 7. Fiyat ve para birimi

- Fiyatlar kaydın `currency` alanındaki para biriminde. Yurt içi `TRY`,
  yurt dışı turlar `EUR` veya `USD`.
- Karttaki "başlangıç fiyatı" tipin kendi fonksiyonundan türetilir
  (`basePrice`, `hotelNightlyFrom`, `activityPriceFrom`,
  `eventPriceFrom`, `venuePriceFrom`). Kartta fiyat elle yazılmaz.
- **Tahsilat TL** (kullanıcı kararı): döviz fiyatlı üründe fiyat kendi
  para biriminde gösterilir, müşterinin kartından TL çekilir. Kur
  rezervasyon anında sabitlenir ve rezervasyona yazılır (4. adım);
  sonradan kur değişse de rezervasyon kendi kuruyla kalır.
- Listede TL fiyat süzgeci ve fiyat sıralaması döviz fiyatlı ürünün
  **TL karşılığıyla** çalışır (`listeSatiri.priceTRY`, günün kuru,
  tam TL'ye yukarı yuvarlı). Özet sayfası "yaklaşık TL karşılığı"nı
  gösterir. Kur `MolaVeri.kur(paraBirimi)` → `{ oran, tarih, kaynak }`;
  bugün örnek değer (`inventory-data.js` `ORNEK_KURLAR`), canlıda
  sözleşmeli bankanın günlük satış kuru (backend yazar).
- SEO açıklamasındaki "fiyatlar X TL'den başlıyor" yalnızca TL fiyatlı
  ürünlerden (kesin tutar); döviz karşılığı tahmin olduğu için oraya
  girmez.
- Kapora (`deposit`) ve taksit bilgisi veri olarak tutulur, koda sabit
  yazılmaz (4. adım). Taksit seçenekleri ürüne değil **bankaya/kart
  ailesine** bağlıdır; ayrı bir tablo olacak.

## 8. İptal kuralı

`cancellation.tiers` kalkıştan önceki saate göre iade oranını verir
(`refundTier`, `refundAmount`). Aktivitede hava koşulu iptali ayrıdır
(`cancellation.weatherRefund`). Rezervasyon anındaki kurallar
rezervasyona kopyalanır; ürünün kuralı sonradan değişse bile eski
rezervasyon kendi kuralıyla iade alır.

## 9. Veri kapısı: `MolaVeri`

| Fonksiyon | Tür | Döner | Backend gelince |
|---|---|---|---|
| `urun(type, slug)` | senkron | Ürün kaydı veya `null` (yayında değil / yok) | Sayfaya gömülü kayıt |
| `urunler(type?)` | senkron | Ürün kayıtları dizisi (örnekler dahil) | Ana sayfa yükü |
| `icerikTipi(kayit)` | senkron | Kaydın içerik tipi (turda `type` tur tipini taşıdığı için) | — |
| `ozet(kayit, bugun)` | senkron | Filtre ve kurallar için: başlangıç fiyatı, liste fiyatı, para birimi, gece, ilk tarih | — |
| `kategoriler(type)` | senkron | Kategori ağacı (düz dizi, `parent` ile) | Önbellekli uç nokta |
| `kategori(type, slug)` | senkron | Tek kategori veya `null` | 〃 |
| `temalar()`, `tema(slug)` | senkron | Tema(lar) | 〃 |
| `koleksiyonlar()`, `koleksiyon(slug)` | senkron | Koleksiyon(lar) | 〃 |
| `listeSayfasi(type, slug)` | senkron | Adresi çözer: `{ kind: 'category' \| 'listing', … }` veya `null` | 〃 |
| `temaUrunleri(slug)`, `koleksiyonUrunleri(slug)` | senkron | Ürün dizisi | Liste uç noktası |
| `adres(yol)` | senkron | Adresin karşılığı: `{ kind: 'product' \| 'type-list' \| 'category' \| 'listing' \| 'theme' \| 'collection' \| 'theme-index' \| 'collection-index' \| 'static' \| 'home', … }` veya `null` (bulunamadı) | Sunucunun yönlendiricisi |
| `sayfaModeli(adres, bugun)` | senkron | Liste sayfasının başlığı, temel süzgeci, kırıntısı ve alt sayfa çipleri | Sayfaya gömülü |
| `listeSeo(model, bugun)` | senkron | Başlık, açıklama (sayı ve en düşük fiyattan), kanonik adres, `noindex` | Sunucu `<head>`'e yazar |
| `yuzeyTanimlari(bugun)` | senkron | Süzgeç alanları ve seçenekleri (bölüm 12) | Önbellekli uç nokta |
| `listeSatiri(kayit, bugun)` | senkron | Ürünün süzülen/sıralanan nitelikleri (arama dizininin satırı) | Arama dizini |
| `liste({ temel, durum, bugun })` | **Promise** | `{ toplam, satirlar, dahaVar, yuzeyler, etiketler }` | `GET /api/liste?…` |
| `listeYolu(kayit)` | senkron | Ürünün liste sayfası (`turlar/gunubirlik-turlar`): kırıntının orta halkası | — |
| `benzerler(kayit, bugun, adet)` | senkron | Kurala dayalı benzer ürünler (ortak kategori, tema, bölge) | Satış/görüntülenme verisiyle sunucuda |
| `musaitlik(type, slug, { from, to })` | **Promise** | Bölüm 6 | `GET /api/…/musaitlik` |

Sonraki adımlarda eklenecekler (aynı kurala göre): `ara(sorgu)`
**Promise** (3. adım); `fiyatTeklifi(secim)` ve `rezervasyonOlustur`
**Promise** ve sunucuda hesaplanır (4. adım).

**Örnek ürünler** (`sample-catalog-data.js`, `sample: true`): anasayfadaki
eski elle yazılmış kartların kayıt hâli. Gerçek ürünle aynı alanları ve
aynı sınıflandırmayı taşıyorlar; listelerde, temalarda, koleksiyonlarda
ve aramada sayılıyorlar. Kartları tıklanabilir ve bir **özet sayfası**
açar (`detail-shell.js`): görsel, fiyat, kaydın kendi seçenekleri
(oda, paket, bilet), yaklaşan tarihler, sınıflandırma çipleri ve benzer
ürünler. Ayrıntılı içerik olmadığı için bu sayfada rezervasyon açık
değil ve sayfa dizine girmiyor. Yönetim paneli ve backend geldiğinde
yerlerini gerçek ürünler alacak.

## 10. Adım adım ne değişti

### 2. adım: adresler, liste sayfaları, menü

- `404.html` tek yönlendirici: liste, tema/koleksiyon dizini, ürün
  detayı, "yakında" ve "bulunamadı" ekranlarını adrese göre kuruyor.
- Liste şablonu: kırıntı, alt sayfa çipleri (menü ağacından), süzgeçler
  (sayılarıyla), sıralama, "daha fazla göster", boş durum. Mobilde
  süzgeçler alttan açılan sayfa.
- Süzme motoru (`listing-engine.js`) saf ve ayrı dosyada; kuralları
  bölüm 12'de.
- Ana menü taksonomideki ağaçtan: masaüstünde başlığın altında, mobilde
  anasayfa çekmecesinde. Anasayfanın "Tümünü Gör", kategori ikonları,
  kampanya bantları, tema/koleksiyon kartları ve alt bilgi gerçek
  sayfalara gidiyor. Detay sayfalarının kırıntısı ürünün liste
  sayfasına gidiyor.
- Dosyası olmayan ürün adresi aynı detay şablonuyla açılıyor; iskelet
  tek kaynakta (`detail-shell.js`) ve bugünkü 7 statik sayfayla aynı
  olduğu test ediliyor.
- Bilinmeyen slug'ı varsayılan ürüne düşüren `resolveTour` vb.
  kaldırıldı.
- Sezonu biten etkinlik listelerde, tema sayılarında ve koleksiyonlarda
  sayılmıyor (sayfası açılmaya devam ediyor).
- Yorumu olmayan üründe kartta "0" puan yazmıyor.

### 1. adım: veri sözleşmesi ve veri kapısı

**Değişti**

- Beş detay sayfası kaydı `MolaVeri.urun` üzerinden okuyor.
- Kalan yer örnek rezervasyonlardan hesaplanıyor; dolu tarih/seans
  seçilemiyor, dolu veya yetmeyen kontenjanda rezervasyon düğmesi pasif.
  Tarihin karma değerinden "son N yer" üreten fonksiyonlar kaldırıldı.
- Otelde kalan oda her gecenin en küçüğü; mekânda varsayılan gün ilk açık
  gün.
- Her ürün kaydında `taxonomy`, `currency` ve `seo` var; görüntü
  alanlarının ve sayfa kabuğundaki SEO başlığının kayıtla ayrışmadığı
  test ediliyor.
- Anasayfadaki 27 elle yazılmış kart ve "Günün En Çok Satanları" ürün
  kaydına dönüştü; şeritler artık ürün seçiyor (`picks`), kart metni
  yazmıyor. Taşımada hiçbir alanın kaybolmadığı
  `tests/ornek-katalog.test.js`'te ölçülüyor.
- Tema kartlarındaki sayılar ("31 tur" gibi) ürünlerden hesaplanıyor;
  koleksiyonlar sınıflandırmadan geliyor.
- Başlıktaki arama bütün ürünleri (örnekler dahil) buluyor. Bunun için
  içerik sayfaları da beş veri dosyasını yüklüyor; backend gelince
  arama uç noktasına geçilecek ve bu yük kalkacak.

**Değişmedi**

- Tasarım, sayfa yapısı, adresler.
- Mevcut 7 ürün sayfasının HTML kabuğu (`tur/<slug>/index.html` vb.).
  WhatsApp ve sosyal medya önizlemesi bu kabuktaki başlıktan okunduğu için
  sunucu gelene kadar duruyor. Kabuktaki başlık ile kaydın `seo` alanı
  arasındaki eşitliği test ölçüyor; **yeni ürün için kabuk yazılmayacak**
  (2. adım: tek yönlendirici sayfa).

**Sonraki adımlara kalan elle yazılmış veri** (bilinçli; yeri belli):

| Ne | Nerede | Adım |
|---|---|---|
| Detay sayfalarındaki "Benzer" şeritleri: başlık, puan ve fiyat kopya | `*-data.js` içindeki `similar` | 3 (kural `MolaVeri.benzerler` olarak hazır; özet sayfası kullanıyor, detay şablonları 3. adımda geçecek) |
| Anasayfa alt SEO bloğundaki şehir bağları ("İzmir turları" …) | `home-blocks.js` `SEO_LINK_GROUPS` | 3 (şehir sayfaları; bugün `#/…` yer tutucu) |
| Kenar çubuğundaki "Son Görüntülenenler" | `index.html` | 3 (ziyaretçinin kendi geçmişinden) |
| Anasayfadaki "Mekanlar" bloğunun gezi noktaları (Efes, Kemeraltı …) | `home-blocks.js` `VENUES` | 3 (rezervasyonlu mekân değiller; yeri ayrıca kararlaştırılacak) |
| Kampanya bantları ("Son 3 gün" …): metin ve indirim | `home-blocks.js` `PROMO_BANDS` | 4 (kampanya kaydı; bant bugün ilgili listeye gidiyor) |
| "Son 24 saatte N kişi baktı" sayıları | kayıtlardaki `social` | Canlıda ölçümden; ölçüm yoksa gösterilmeyecek |

## 11. Backend'e eklenecekler

Mevcut şemada karşılığı olmayanlar. Göç numaraları kesin değil:

| Konu | Öneri |
|---|---|
| Tema | `themes` + `content_themes (content_id, theme_id)` |
| Koleksiyon | `collections (mode, rule jsonb)` + `content_collections` (yalnızca `manual` için) |
| Çoklu kategori | `content_categories (content_id, category_id, is_primary)`; `content.category_id` ana kategori olarak kalabilir |
| Liste sayfası | `listing_pages (content_type, slug, name, filter jsonb, seo_title, seo_description)` |
| Özellikler | `content_facets (content_id, facet, value)` veya `taxonomy_terms` genişletmesi (`transport` zaten var) |
| Para birimi | `content.currency char(3)` |
| Kapora | `deposit_policies` veya ürün tipine özgü sütunlar |
| Molapuan | Ürün başı `loyalty_points` + müşteri için hareket defteri `loyalty_ledger` |
| Taksit | `installment_plans (bank, card_family, count, rate)` |
| Liste sorgusu | `GET /api/liste?<temel süzgeç>&<seçimler>` → bölüm 12'deki cevap. Süzme ve sayım arama dizininde (`listeSatiri` biçimi), aynı kurallarla |
| Yönlendirici | Sunucu `/turlar/…`, `/temalar/…` ve dosyasız ürün adreslerini 200 ile ve `<head>` alanları doldurulmuş olarak sunar (bugün 404.html) |

## 12. Liste sayfaları ve adres parametreleri

**Adres çözümü** (`MolaVeri.adres`): `/<tip kökü>/` tipin bütün
ürünleri; `/<tip kökü>/<slug>/` kategori ya da liste sayfası (bölüm 5);
`/temalar/<slug>/`, `/koleksiyonlar/<slug>/`; `/temalar/` ve
`/koleksiyonlar/` dizin; `/firsatlar/` indirimli ürünler; `/<tip
yolu>/<slug>/` ürün. Büyük harf, sondaki eğik çizginin eksikliği ve
`index.html` tek kanonik yazıma çevrilir.

**Süzgeçler** adresin sorgu dizisinde durur; kanonik adres parametresiz
olduğu için süzülmüş kombinasyonlar ayrı sayfa olarak dizine girmez.

| Parametre | Anlamı | Örnek |
|---|---|---|
| `tip` | İçerik tipi (karışık listelerde) | `tip=tur,etkinlik` |
| `ay` | Satış tarihi o ayda (bu ay + 5 ay). Her gün satılan ürün her aya uyar | `ay=2026-10` |
| `sure` | Tur süresi: `gunubirlik`, `1-2-gece`, `3-5-gece`, `6-gece-ustu` | `sure=gunubirlik` |
| `bolge` | Bölge (şehirden türetilir) | `bolge=ege,akdeniz` |
| `kalkis` | Kalkış şehri | `kalkis=izmir` |
| `ulasim` | Ulaşım | `ulasim=otobus` |
| `pansiyon` | Pansiyon (otelin pansiyon kodlarından) | `pansiyon=her-sey-dahil` |
| `tema` | Tema | `tema=doga-yayla` |
| `kimle` | Elle koleksiyon (Ailece, Romantik …) | `kimle=ailece` |
| `fiyat` | TL fiyat aralığı `[alt, üst)`; döviz fiyatlı ürün TL aralığında aranmaz | `fiyat=1000-2500`, `fiyat=10000-` |
| `puan` | En az puan (5 üzerinden; otelin 10'luk puanı yarıya) | `puan=4.5` |
| `indirimli` | Liste fiyatının altında satılanlar | `indirimli=1` |
| `sirala` | `onerilen` (varsayılan), `fiyat-artan`, `fiyat-azalan`, `tarih`, `puan` | `sirala=fiyat-artan` |
| `sayfa` | Açılan sayfa sayısı (24'er) | `sayfa=2` |

**Kurallar:** alan içindeki seçenekler VEYA, alanlar arası VE. Seçeneğin
yanındaki sayı, o alan hariç diğer seçimler geçerliyken o seçeneğin
sonuç sayısı. Sonucu daraltmayan alan gösterilmez. Tanınmayan değer
sessizce atılır; motora ait olmayan parametreler (`utm_*`) korunur.

**Önerilen sıralama:** puan, yorum sayısıyla sitenin ortalamasına doğru
çekilerek (Bayes ortalaması; az yorumlu yüksek puan önde değil).
Fiyat sıralamasında TL fiyatlılar önce. Backend geldiğinde satış verisi
de girecek.

**SEO:** Başlık "<ad> — mola360"; açıklama ürün sayısından ve en düşük
TL fiyattan türetilir. Ürünü olmayan liste, örnek özet sayfası ve
"bulunamadı" `noindex`. Yapısal veri: `BreadcrumbList` ve yalnızca
sayfası olan ürünlerle `ItemList`.

**Bilinen sınır:** GitHub Pages yönlendirici sayfayı 404 koduyla
sunuyor. Ziyaretçi için fark yok; arama motoru bu adresleri dizine
almaz. Sunucu geldiğinde aynı ekranlar 200 ile gelecek.
