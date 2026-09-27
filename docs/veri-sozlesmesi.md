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
`/koleksiyonlar/<slug>/`, `/firsatlar/`, `/firsatlar/<slug>/` (2. adım);
şehir sayfaları `/<tip kökü>/<şehir>/` (`/turlar/izmir/`,
`/oteller/antalya/`), `/arama/?q=`, `/yeni-eklenenler/`, `/bu-hafta/`
(3. adım); `/hesabim/…` (5. adım), `/kurumsal/…` (6. adım). Henüz
içeriği olmayan menü adresleri "yakında" ekranını açar.

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
| `currency` | Fiyatların para birimi: `TRY`, `EUR`, `USD` (tahsilat her zaman TL, bölüm 7) | `content.currency` |
| `publishedAt` | Yayına giriş günü (`YYYY-AA-GG`); "Yeni Eklenenler" ve "En yeni" sıralaması | `content.published_at` |
| `similar` | Elle seçilmiş benzerler: yalnızca kimlik (`{ slug }` aynı tipten, `{ href }` başka tipten); kalanı kural doldurur | `content_relations` |

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
loyalty:  { points: 150 },   // Molapuan (5. adım), yalnızca turlar
```

Kapora ürün kaydında **tutulmuyor**: kural tip bazında ve tek yerde
(`booking-engine.js` `REZ_KAPORA`, bölüm 13). Ürüne özel kapora
gerekirse o zaman kayda `deposit` alanı eklenecek.

Otelde çocuk politikası `pricing.childAges` ('0 – 12 yaş') ve
`pricing.freeChildMaxAge` (bu yaşa kadar pansiyon farkı yok).

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
- Kapora ve taksit kural tablolarında (bölüm 13). Taksit seçenekleri
  ürüne değil **kart ailesine** bağlı. Döviz fiyatlı üründe kapora da
  kalan da rezervasyon kuruyla TL.

## 8. İptal kuralı

`cancellation.tiers` kalkıştan önceki saate göre iade oranını verir
(`refundTier`, `refundAmount`). Aktivitede hava koşulu iptali ayrıdır
(`cancellation.weatherRefund`). Rezervasyon anındaki kurallar
rezervasyona kopyalanır; ürünün kuralı sonradan değişse bile eski
rezervasyon kendi kuralıyla iade alır.

Ödeme ekranı kademeleri **tarihe çevirerek** gösteriyor ("29 Eylül
08:15'e kadar: 694 TL iade"; `rezIptalTakvimi`). Kaporalı
rezervasyonda kesinti toplam üzerinden: `kesinti = toplam × (1 − oran)`,
`iade = ödenen − kesinti` (eksiye düşmez, müşteriden ek tahsilat
istenmez). Süresi geçmiş kademe gösterilmez (kalkışa 30 saat kala
alınan rezervasyona "48 saat öncesine kadar tamamı iade" yazılmaz).

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
| `adres(yol)` | senkron | Adresin karşılığı: `{ kind: 'product' \| 'type-list' \| 'category' \| 'listing' \| 'city' \| 'theme' \| 'collection' \| 'theme-index' \| 'collection-index' \| 'search' \| 'new' \| 'week' \| 'checkout' \| 'confirmation' \| 'campaigns' \| 'account' \| 'corporate' \| 'static' \| 'home', … }` veya `null` (bulunamadı) | Sunucunun yönlendiricisi |
| `sayfaModeli(adres, bugun)` | senkron | Liste sayfasının başlığı, temel süzgeci, kırıntısı ve alt sayfa çipleri | Sayfaya gömülü |
| `listeSeo(model, bugun)` | senkron | Başlık, açıklama (sayı ve en düşük fiyattan), kanonik adres, `noindex` | Sunucu `<head>`'e yazar |
| `yuzeyTanimlari(bugun)` | senkron | Süzgeç alanları ve seçenekleri (bölüm 12) | Önbellekli uç nokta |
| `listeSatiri(kayit, bugun)` | senkron | Ürünün süzülen/sıralanan nitelikleri (arama dizininin satırı) | Arama dizini |
| `liste({ temel, durum, bugun, tarihAraligi? })` | **Promise** | `{ toplam, satirlar, dahaVar, yuzeyler, etiketler }`; `tarihAraligi { start, end }` sabit tarihli ürünü o aralıkta tarihi olana indirir (anasayfa süzgeci) | `GET /api/liste?…` |
| `listeYolu(kayit)` | senkron | Ürünün liste sayfası (`turlar/gunubirlik-turlar`): kırıntının orta halkası | — |
| `hizliAra(q, bugun, adet)` | senkron | Başlıktaki kutunun anlık sonuçları (ürün kayıtları, alakaya göre) | `GET /api/ara?q=` |
| `aramaModeli(q)`, `aramaSayfalari(q)` | senkron | Arama sayfasının başlığı/temel süzgeci; adı eşleşen liste sayfaları | — |
| `haftaAjandasi(bugun, gun)` | senkron | Bu Hafta: gün gün tur kalkışları ve etkinlik temsilleri | Ajanda uç noktası |
| `kur(paraBirimi)`, `tlKarsiligi(tutar, paraBirimi)` | senkron | Günün kuru `{ oran, tarih, kaynak }`; TL karşılığı (yukarı yuvarlı) | Sunucu sayfaya gömer (banka kuru) |
| `tercihler()`, `tercihKaydet({ dil, para })`, `diller()`, `paraBirimleri()` | senkron | Ziyaretçinin dil ve para birimi tercihi (bu tarayıcıda); yalnızca hazır dil ve kuru bilinen para birimi kabul edilir | Hesaba bağlı tercih |
| `fiyatGosterimi(tutar, paraBirimi, hedef?)` | senkron | `{ tutar, kod, kisa, sembol, yaklasik }`: tercih edilen birimde gösterim; çevrildiyse `yaklasik: true`. Tahsilat her zaman TL | — |
| `benzerler(kayit, bugun, adet)` | senkron | Kurala dayalı benzer ürünler (ortak kategori, tema, bölge) | Satış/görüntülenme verisiyle sunucuda |
| `musaitlik(type, slug, { from, to })` | **Promise** | Bölüm 6 | `GET /api/…/musaitlik` |
| `kampanyalar(bugun)` | senkron | Yürürlükteki kampanyalar (+ `kalanGun`) | Kampanya tablosu |
| `kartAileleri()`, `taksitTablosu(tutar)` | senkron | Kart aileleri; bütün ailelerin taksit tablosu | Ödeme sağlayıcısının BIN/taksit sorgusu |
| `odemeYolu(type, slug, secim)`, `odemeAdresiOku(sorgu)` | senkron | Ödeme ekranının adresi (`rezervasyon/?urun=tur/efes-sirince&tarih=…`) ve tersi | — |
| `fiyatTeklifi(type, slug, secim, secenek, bugun)` | **Promise** | Teklif (bölüm 13) + `kontenjanDurumu` | `POST /api/teklif` |
| `rezervasyonOlustur(istek)` | **Promise** | `{ tamam, kod, rezervasyon }` veya `{ tamam: false, hatalar, teklif }` | `POST /api/rezervasyon` → 3D Secure |
| `rezervasyon(kod)`, `rezervasyonlar()` | **Promise** | Rezervasyon kaydı (bugün bu tarayıcıda) | `GET /api/rezervasyon/:kod`, hesap |
| `rezervasyonSorgula(kod, eposta)` | **Promise** | Misafirin rezervasyonu (kod + e-posta ikisi birden) | `POST /api/rezervasyon/sorgula` |
| `rezervasyonIptal(kod, simdi)` | **Promise** | İptal ve iade (yalnızca hesabın rezervasyonu) | `POST /api/rezervasyon/:kod/iptal` |
| `oturum()` | senkron | Oturumdaki hesap veya `null` | Sayfaya gömülü oturum (çerez) |
| `uyeOl(form)`, `girisYap(eposta)`, `cikisYap()` | **Promise** | `{ tamam, hesap }` / `{ tamam: false, hatalar }` | `POST /api/uyelik`, `/api/giris`, `/api/cikis` |
| `profilGuncelle(alanlar)`, `izinGuncelle(izinler)`, `hesabiSil()` | **Promise** | Güncel hesap | `PATCH /api/hesap`, `DELETE /api/hesap` |
| `favoriler()`, `favoriMi(tip, slug)` | senkron | Favori kimlikleri (yayından kalkan düşer) | Sayfaya gömülü |
| `favoriDegistir(tip, slug)` | **Promise** | Yeni durum (`true` = favoride) | `PUT/DELETE /api/hesap/favoriler/:tip/:slug` |
| `bildirimler(simdi)`, `bildirimOkundu(id)`, `bildirimKaldir(id)` | senkron | Türetilmiş bildirimler + okundu/kaldırıldı | `GET /api/hesap/bildirimler` |
| `hesapPaneli(simdi)` | **Promise** | Panelin bütün verisi (bölüm 14) | `GET /api/hesap` |
| `yorumYaz({ kod, puan, metin })` | **Promise** | Onay bekleyen yorum | `POST /api/yorum` |
| `talepKonulari()`, `iletisimTalebi(talep)` | senkron / **Promise** | İletişim formu ve "Beni ara" (bugün bu tarayıcıda, ekibe iletilmiyor) | `POST /api/iletisim` |

Arama sayfası aynı eşleşmeyi `liste({ temel: { q } })` ile alır (tek
kural: `kapiAramaPuani`, bölüm 12).

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

### 7. adım: arayüz düzeni

- **Menü:** masaüstünde başlığın altındaki menü satırı kaldırıldı; ana
  menü sol menüde. Sol menü (çekmece) artık ortak çerçevede
  (`site-chrome.js`), yani her sayfada var: anasayfada sabit sol menü,
  diğer sayfalarda başlıktaki menü düğmesiyle açılan panel, mobilde
  çekmece. "Kategoriler" bölümü kaldırıldı; menünün üst satırları ikonlu
  düğme, alt sayfalar düğmenin altında açılıyor.
- **Yardım & Destek:** Bize Ulaşın, İptal ve İade, Canlı Destek, Blog360,
  Kurumsal ve dil/para düğmesi tek bölümde. Blog360 ve Kurumsal
  taksonomide `grup: 'destek'` ile işaretli; ana menü ağacına girmiyor.
- **Alt satır:** misafirde "Giriş Yap / Üye Ol", oturum açıkken "Çıkış
  Yap"; yanında WhatsApp, Facebook, Instagram. Sosyal hesap adresleri
  `CONTACT.social` (home-blocks.js); boşken düğme pasif ve "yakında
  eklenecek" diyor.
- **Dil ve para birimi:** "TR · ₺" alt çekmece açıyor
  (`MolaVeri.tercihler / tercihKaydet / fiyatGosterimi`). Kartlardaki
  fiyat seçilen para biriminde yaklaşık karşılık (≈); ürün sayfası ve
  ödeme TL. Yalnızca kuru bilinen para birimi seçilebiliyor; İngilizce
  çeviri gelene kadar pasif.
- **Kartlar:** indirimli üründe "%N indirim" etiketi, üstü çizili liste
  fiyatı ve yeni fiyat (liste fiyatı ürünün kendi kaydından,
  `catalog.js/katalogIndirimEkle`). Fiyat binlik ayırıcılı ve kuruşsuz
  ("1.290 TL"). İşlevsiz sepet düğmesi yerine ürüne giden ok.
- **Anasayfa süzgeçleri:** seçenekler ve sonuçlar liste sayfalarıyla
  aynı motordan (`MolaVeri.liste`); sonuçlar aynı sayfada, süzgeç
  çubuğunun altında. Elle yazılmış "248 sonuç" kaldırıldı; sayı yalnızca
  süzgeç seçiliyken ve gerçek. Tarih aralığı sabit tarihli ürünü
  (tur kalkışı, etkinlik temsili) eliyor; her gün satılan ürün her
  aralığa uyuyor.
- **Paket tur sözleşmesi:** konaklamalı turlarda (`rezPaketTurMu`)
  ödeme adımında üçüncü belge olarak, rezervasyonun bilgileriyle.
- **Açılış ekranı** yalnızca ilk girişte (`mola360.acilisGoruldu`).
- **Düzeltmeler:** Hesabım'da bölüm değişince sayfa aşağı kaymıyor;
  dokunmatik ekranda arama ve sıralama kutuları 16 px (iOS odakta
  sayfayı yakınlaştırıyordu); ödeme ekranındaki belgelerde yinelenen
  bölüm kimlikleri önekli.

### 6. adım: kurumsal ve yasal sayfalar

- `/kurumsal/*` içerikli: Hakkımızda, İletişim (form), Yardım Merkezi
  (arama ve konular), Sık Sorulan Sorular (arama, FAQPage yapısal
  verisi), İptal ve İade (satıştaki ürünlerin kademeleri verilerden),
  Kullanım Koşulları, KVKK Aydınlatma Metni, Çerez Politikası, Ön
  Bilgilendirme Formu, Mesafeli Satış Sözleşmesi (bölüm 15).
- Ödeme ekranında ön bilgilendirme formu ve mesafeli satış sözleşmesi
  rezervasyonun kendi bilgileriyle (ürün, tarih, tutar, kapora ve kalan,
  taksit, tarihli iptal koşulları) gösteriliyor ve onaylanıyor.
- SSS tek kaynakta (`corporate-data.js`); anasayfa SSS'si ve
  `index.html`'deki FAQPage yapısal verisi oradan. Gerçekle çelişen
  cevaplar düzeldi: "sepete ekleyin" (sepet yok), otelde "tesiste
  ödeme" (yok), "Biletlerim'den iptal" (Rezervasyonlarım'dan).
- Alt bilgide "7/24 destek" çalışma saatleriyle çelişiyordu: "Her gün
  destek". Gizlilik, Çerezler ve Kullanım Koşulları bağlandı.
- "Beni ara" formu numarayı hiçbir yere göndermeden "arayacağız"
  diyordu; talep artık kaydediliyor ve ekran deneme olduğunu söylüyor.
- Anasayfa alt bilgisindeki logo bir görsel barındırma sitesinden
  yükleniyordu; yerel dosyaya alındı.

### 5. adım: Hesabım

- `/hesabim/` TEK panel (talimattaki gibi); bölümler `?bolum=` ile:
  Genel Bakış, Rezervasyonlarım, Biletlerim, Favorilerim, Kuponlarım,
  Mola Puanlarım, Üyelik Seviyem, Yorumlarım, Bildirimlerim, Kişisel
  Bilgilerim, Ödeme Yöntemlerim, Ayarlar. `/favorilerim/`,
  `/biletlerim/`, `/kuponlarim/` panelin ilgili bölümüne gidiyor.
- Üyelik ve giriş penceresi çalışıyor (deneme: hesap bu tarayıcıda,
  şifre yok; pencere bunu söylüyor). Henüz çalışmayan sosyal girişler
  pasif.
- Karekodlu biletler (`qr-code.js`, bağımlılıksız üretici; testte jsQR
  ile okunuyor). Rezervasyon iptali iade tutarını önceden gösteriyor.
- Favoriler bütün kartlarda ve ürün sayfalarında gerçek (misafirde de).
- Yeni üyeye kişiye özel %15 kupon; ödeme ekranında üye bilgileri ve
  kuponlar hazır.
- Molapuan tura katılınca kazanılıyor, tura göre (bölüm 14).
- Elle yazılmış veriler kalktı: başlıktaki "Bedir İnci", profil
  kartındaki 14 bilet / 27 favori / Gold / 2.480 puan, 20 örnek
  bildirim, çekmecedeki kuralsız kampanya kartları ("%40'a varan",
  "Gold üyeye %25", "3 al 2 öde").

### 4. adım: rezervasyon ve ödeme ekranları, kampanyalar

- Beş ürün sayfasının rezervasyon özeti **"Ödemeye geç"** ile ödeme
  ekranına gidiyor; seçim adres satırında taşınıyor
  (`/rezervasyon/?urun=tur/efes-sirince&tarih=…`).
- Ödeme ekranı (`checkout-page.js`, tek sayfa): iletişim, katılımcılar
  (turda yetişkin kimlik no ya da pasaport, çocuk/bebek yaşı), ödeme
  planı (tamamı / %20 kapora + kalan tercihi), kart ailesi ve taksit,
  kupon, fatura (bireysel/kurumsal), sözleşme onayı; yanda fiyat
  ayrıntısı, indirimler, karttan çekilecek tutar ve tarihli iptal
  koşulları. Onay ekranı `/rezervasyon/onay/?kod=`.
- Hesap tek yerde ve saf: `booking-engine.js` (bölüm 13). Kapı teklifi
  hesaplatıp kontenjanı soruyor; dolu ya da yetmeyen tarihte ödeme
  açılmıyor (bölüm 6'daki "son kontrol ödeme adımında" sözü).
- Otelde çocuk yaşı fiyatı etkiliyor (0 – 6 yaş pansiyon farkı yok);
  ürün sayfasındaki tutar üst sınır, ödeme adımında ancak düşer.
- Kampanyalar kural kaydı: `/kampanyalar/` sayfası, ana sayfa bantları
  ve ödeme adımındaki indirim aynı kayıttan. "Erken Rezervasyon" listesi
  artık dolu (erken rezervasyon kampanyasının kapsamı).
- Ana sayfadaki "Yayla ve doğa turlarında %40'a varan indirim" bandı
  kaldırıldı: verideki en yüksek indirim %18'di. Yerine fırsatlar
  sayfasına giden, indirim vaat etmeyen bir bant geldi.
- **Ödeme sağlayıcısı bağlı değil.** "Ödemeye geç" rezervasyon talebini
  bu tarayıcıda deneme kaydı olarak yazıyor, kart çekimi yok; iki ekran
  da bunu açıkça söylüyor.

### 3. adım: arama, şehir sayfaları, keşif sayfaları, ziyaretçi geçmişi

- **Arama:** başlıktaki kutu ve `/arama/?q=` sayfası tek kuralla eşleşiyor
  (başlık, sınıflandırma, yer; Türkçe harf ve ek farkı yok sayılıyor).
  Enter tam sonuç sayfasına gidiyor; arama sayfasında süzgeçler ve "en
  alakalı" sıralaması var. Masaüstünde arama kutusuna yazılamıyordu
  (salt okunur kutu); düzeldi.
- **Şehir sayfaları:** `/turlar/izmir/` gibi; ürünün destinasyon şehri.
  Her listede `?sehir=` süzgeci.
- **Yeni Eklenenler** (`publishedAt`, en yeni başta) ve **Bu Hafta**
  (önümüzdeki 7 günün kalkış ve temsilleri, gün gün ajanda).
- **Son Aramalar ve Son Görüntülenenler** ziyaretçinin kendi geçmişi
  (`visitor-history.js`, bu tarayıcıda); elle yazılmış örnek listeler
  kaldırıldı.
- **Benzer şeridi** detay sayfalarında kuraldan (`MolaVeri.benzerler`) +
  kaydın elle seçtiği öneriler (yalnızca kimlik). Başlık/puan/fiyat
  kopyaları kalktı.
- Anasayfa: alt SEO bölümündeki 74 bağ gerçek sayfalara gidiyor;
  "Mekanlar" bloğu yalnızca rezervasyonlu mekânlar, gezi noktaları
  (`GEZI_NOKTALARI`) ayrı blokta ve uydurma puansız.
- Onaylanan kategoriler menüde; tahsilat TL kararı (bölüm 7).

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
| ~~Kampanya bantları~~ | 4. adımda kural kaydına bağlandı (`kampanya` alanı) | — |
| "Son 24 saatte N kişi baktı" sayıları | kayıtlardaki `social` | Canlıda ölçümden; ölçüm yoksa gösterilmeyecek |
| ~~Anasayfa kenar çubuğundaki profil kartı ve bildirimler~~ | 5. adımda hesaptan ve türetilmiş bildirimlerden | — |
| Arama kutusundaki "Popüler Aramalar" | `app.js` `suggestedSearchTerms` | Editör listesi olarak kalabilir; canlıda arama kayıtlarından |

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
| Kapora | `deposit_policies (content_type, rate, min_days, balance_options)`; bugünkü karşılığı `REZ_KAPORA` |
| Molapuan | Ürün başı puan: `tours.loyalty_points` (göç 020, eklendi); müşteri için hareket defteri `loyalty_ledger` (aşağıda) |
| Taksit | `installment_plans (card_family, count, rate, valid_from)`; aile tespiti ödeme sağlayıcısının BIN sorgusuyla |
| Kampanya ve kupon | `campaigns (code, kind, scope jsonb, conditions jsonb, discount jsonb, starts_at, ends_at, member_only)`; kupon kodu sunucuda doğrulanır, kullanım sayısı tutulur |
| Rezervasyon | `bookings` (kod, seçim, teklif anının satırları, indirimler, kur, ödeme planı, iptal kademeleri — hepsi o anki hâliyle) + `booking_guests` (ad, yaş, kimlik **şifreli**) + `payments` (kapora/kalan/iade hareketleri) |
| Kalan ödeme araması | Kaporalı rezervasyonlar için kalkıştan 1 gün önceki arama listesi (çağrı merkezi ekranı, yönetim paneli) |
| Ödeme sağlayıcısı | 3D Secure ile tahsilat; kart bilgisi sağlayıcının alanında girilir, sitede hiç tutulmaz |
| Liste sorgusu | `GET /api/liste?<temel süzgeç>&<seçimler>` → bölüm 12'deki cevap. Süzme ve sayım arama dizininde (`listeSatiri` biçimi), aynı kurallarla |
| Arama | Aynı dizinde metin araması (Türkçe normalleştirme ve ek kuralıyla); arama kayıtları "Popüler Aramalar"ı besler |
| Kur | Günlük banka satış kuru tablosu (`fx_rates (currency, rate, date, source)`); rezervasyona o anki kur yazılır |
| Ziyaretçi geçmişi | Üye girişinde son görüntülenenler ve son aramalar hesaba da yazılır |
| Üyelik | `users (email unique, name, phone, email_verified_at, consents jsonb)`; giriş e-posta doğrulaması + şifre ya da tek kullanımlık kod; oturum çerezi |
| Favori | `favorites (user_id, content_id, created_at)`; misafirin tarayıcıdaki favorileri girişte hesaba taşınır |
| Kişisel kupon | `user_coupons (user_id, code unique, campaign_id, expires_at, used_booking_id)` |
| Molapuan | `loyalty_ledger (user_id, booking_id, points, status: pending/earned/cancelled)`; tur tamamlanınca iş kuyruğu `earned` yapar |
| Yorum | `reviews (booking_id unique, user_id, rating, body, status: pending/published/rejected)`; yayın yönetim panelinden |
| Bilet | `tickets (booking_id, number unique, holder, signature)`; karekod = numara + sunucu imzası, girişte doğrulanır |
| Bildirim | Olaylardan (`booking_created`, `balance_reminder`, `points_earned` …) üretilir; okundu durumu `notification_reads` |
| Yönlendirici | Sunucu `/turlar/…`, `/temalar/…` ve dosyasız ürün adreslerini 200 ile ve `<head>` alanları doldurulmuş olarak sunar (bugün 404.html) |

## 12. Liste sayfaları ve adres parametreleri

**Adres çözümü** (`MolaVeri.adres`): `/<tip kökü>/` tipin bütün
ürünleri; `/<tip kökü>/<slug>/` sırasıyla liste sayfası, kategori ya da
şehir (bölüm 5; slug'lar çakışamaz);
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
| `sehir` | Destinasyon şehri | `sehir=antalya` |
| `kalkis` | Kalkış şehri | `kalkis=izmir` |
| `ulasim` | Ulaşım | `ulasim=otobus` |
| `pansiyon` | Pansiyon (otelin pansiyon kodlarından) | `pansiyon=her-sey-dahil` |
| `tema` | Tema | `tema=doga-yayla` |
| `kimle` | Elle koleksiyon (Ailece, Romantik …) | `kimle=ailece` |
| `fiyat` | TL fiyat aralığı `[alt, üst)`; döviz fiyatlı ürün TL aralığında aranmaz | `fiyat=1000-2500`, `fiyat=10000-` |
| `puan` | En az puan (5 üzerinden; otelin 10'luk puanı yarıya) | `puan=4.5` |
| `indirimli` | Liste fiyatının altında satılanlar | `indirimli=1` |
| `sirala` | `onerilen` (varsayılan), `fiyat-artan`, `fiyat-azalan`, `tarih`, `yeni`, `puan`; arama sayfasında `alaka` (orada varsayılan) | `sirala=fiyat-artan` |
| `q` | Metin araması (yalnızca `/arama/`) | `q=kapadokya+balon` |
| `sayfa` | Açılan sayfa sayısı (24'er) | `sayfa=2` |

**Kurallar:** alan içindeki seçenekler VEYA, alanlar arası VE. Seçeneğin
yanındaki sayı, o alan hariç diğer seçimler geçerliyken o seçeneğin
sonuç sayısı. Sonucu daraltmayan alan gösterilmez. Tanınmayan değer
sessizce atılır; motora ait olmayan parametreler (`utm_*`) korunur.

**Arama** (`kapiAramaPuani`): sorgudaki her kelime bir yerde geçmeli
(VE). Ağırlıklar: başlıkta kelime başı 5, başlığın içinde 3,
sınıflandırma (kategori, tema, koleksiyon, şehir, bölge, tip adı) 2, yer
ve kart satırı 1. Büyük/küçük harf, şapka ve Türkçe harf farkı yok
sayılır; sorgu kelimesi en az 4 harflik bir kelimeyle başlıyorsa da
eşleşir ("kapadokyada" → "kapadokya"). Arama sayfası dizine girmez.

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

## 13. Rezervasyon ve ödeme

Hesabın tamamı `assets/js/booking-engine.js`'te ve saf: aynı seçim ve
aynı gün her yerde aynı teklifi verir. Backend geldiğinde bağlayıcı
hesap sunucuda yapılacak (`POST /api/teklif`); ekran bu dosyayla ön
izleme göstermeye devam edecek, iki sonuç ayrışırsa sunucununki geçerli.
`rezervasyonOlustur` teklifi zaten yeniden hesaplıyor ve ekranın
gösterdiği tutar değiştiyse rezervasyon yazmıyor.

### Teklif

`rezTeklif(tip, kayit, secim, secenek, bugun, { kur, simdi })`:

| Alan | Anlamı |
|---|---|
| `satilabilir`, `hatalar` | Tarih/saat geçersiz, kalkış günü değil, mekân kapalı, saat geçti, kur yok, örnek ürün … |
| `ozet` | Seçimin okunur satırları (tarih, kalkış, oda, kişi) |
| `satirlar`, `araToplam` | Kaydın kendi hesap fonksiyonundan (ürünün para biriminde) |
| `araToplamTL`, `kur` | TL karşılığı; döviz üründe kur teklife yazılır |
| `indirimler`, `kupon`, `toplam` | Kampanya/kupon indirimi ve net TL toplam |
| `odeme` | `sekil: 'tam' \| 'kapora' \| 'mekanda'`, `simdi`, `kalan`, `kalanTercih`, `kalanTarihi`, `aramaTarihi`, `kaporaUygun`, `kaporaNeden` |
| `taksit`, `tahsilat` | Seçilen kart ailesi ve taksit; karttan çekilecek tutar (vade farkıyla) |
| `iptal` | Tarihli iptal kademeleri ve her birinde iade tutarı (bölüm 8) |
| `katilimcilar` | Formun şablonu: rol, kimlik gerekli mi, yaş aralığı |
| `kontenjan` | Kapının kontenjan sorgusu için istek (birim, tarih, saat, adet) |

`secenek`: `{ odeme, kalan, aile, taksit, kupon, cocukYaslari, uye }`.

### Kapora ve kalan ödeme (kullanıcı kararı)

- Turlarda **%20 kapora** (yukarı yuvarlı tam TL). Diğer tiplerde tamamı
  ödenir; mekânda ön ödemesiz randevu "mekânda ödeme"dir, kart çekimi
  yoktur.
- Kalan tutar müşterinin tercihine göre **turdan 1 gün önce** (kart ya da
  havale) veya **tur günü araçta**. Kalkıştan 1 gün önce müşteri aranır
  ve kalan ödeme netleştirilir (`aramaTarihi`).
- Kalkışa 2 günden az kaldıysa kapora seçeneği yok (arayacak zaman yok).
- Kapora, indirimler düşüldükten sonraki toplamdan hesaplanır.
- Kural tablosu: `REZ_KAPORA` (`oran`, `tipler`, `enAzGun`,
  `kalanSecenekleri`).

### Taksit

`REZ_TAKSIT` kart aileleri ve vade farkı oranları: Bonus, World,
Maximum, Axess, CardFinans, Paraf, Bankkart. **Tablo örnek**; oranlar
ve taksit sayıları banka anlaşmaları ve BDDK sınırlarıyla
güncellenecek. Ailesi bilinmeyen kart (banka kartı, ticari, yurt dışı)
ve 500 TL altı çekim tek çekimdir. Taksit bugün çekilen tutara (kapora
ya da tamamı) uygulanır. Aylık taksit kuruşa aşağı yuvarlanır, artan
kuruş ilk taksitte.

Kart numarası sitede **hiç sorulmuyor**: sağlayıcının 3D Secure
sayfasında girilecek. Canlıda aile tespiti de sağlayıcının BIN
sorgusundan gelecek.

### Kampanya ve kupon

`REZ_KAMPANYALAR` (örnek kayıtlar):

| Kod | Tür | Kural |
|---|---|---|
| `kapadokya-erken` | otomatik | Kapadokya turlarında kalkışa ≥ 30 gün kala 500 TL |
| `otel-hafta-sonu` | otomatik | Termal ve şehir otellerinde cuma + cumartesi gecesini kapsayan konaklamada bir gecenin oda bedeli (vergisiyle) |
| `yeni-uye` | kupon, üyeye özel | İlk rezervasyonda %15, en fazla 1.500 TL (üyelik 5. adımda) |
| `mola100` | kupon | `MOLA100`: 1.000 TL ve üzeri rezervasyonda 100 TL (**örnek kod**, mekân hariç) |

Otomatik kampanyalardan en avantajlısı uygulanır; kupon onun üstüne
eklenir. İndirim toplamı aşmaz. `/kampanyalar/` sayfası, ana sayfa
bantları (`PROMO_BANDS.kampanya`) ve "Erken Rezervasyon" listesi aynı
kayıttan okuyor; bant metninin kuralla aynı şeyi söylediği
`tests/rezervasyon.test.js`'te ölçülüyor.

### Form

Zorunlu: iletişim (ad, soyad, e-posta, cep telefonu), turda yetişkinlerin
T.C. kimlik numarası (sağlama kontrolüyle) ya da pasaport, çocuk ve
bebek yaşı (kaydın yaş aralığında), otelde oda başına bir misafir ve
çocuk yaşları, kurumsal faturada unvan/vergi dairesi/numara, sözleşme
onayı. Kurallar `rezFormHatalari`'nda; ekran ve kapı aynı fonksiyonu
kullanıyor.

### Rezervasyon kaydı

Bugün `localStorage` (`mola360.rezervasyonlar`, en fazla 30) ve
`deneme: true`, `durum: 'odeme-bekliyor'`. Kaydedilen: kod
(`M360-XXXXXX`, karışan harfler yok), seçim, teklif anının satırları,
indirimler, kur, ödeme planı, taksit, iptal kademeleri, iletişim,
katılımcıların **yalnızca adı ve yaşı**. Kimlik/pasaport numarası ve
kart bilgisi yazılmıyor.

## 14. Hesabım

Panel `/hesabim/` (`account-page.js`), kurallar `account-engine.js`
(saf), depolama veri kapısında. Bugün hesap, favoriler, bildirim
durumu ve yorumlar **bu tarayıcıda** (localStorage); rezervasyonlar
4. adımdaki gibi.

### Üyelik (deneme)

- Üye ol: ad, soyad, e-posta, telefon (isteğe bağlı), aydınlatma onayı
  (zorunlu), kampanya e-postası izni (isteğe bağlı).
- **Şifre yok.** Giriş, bu tarayıcıda o e-postayla açılmış hesabı açar.
  Pencere ve Ayarlar bunu açıkça söylüyor. Gerçek girişte e-posta
  doğrulaması ve şifre ya da tek kullanımlık kod olacak.
- Hesabın rezervasyonları: hesapla yapılanlar + aynı e-postayla misafir
  olarak yapılanlar. Misafir, rezervasyonunu kod + e-postayla bulabilir.

### Rezervasyon durumu ve iptal

`yaklasan` → dönüş günü geçince `tamamlandi`; iptalde `iptal`.
Kayıtta iki ayrı alan: `iptalKosullari` (rezervasyon anındaki
kademeler ve her birinin iadesi) ve `iptalBilgisi` (`{ t, iade,
kademe }`). İptal, şimdiki kademenin iadesini önceden gösterir;
başlangıç saati geçtiyse iptal yok.

### Biletler

Etkinlikte bilet başına, tur ve aktivitede katılımcı başına, otel ve
mekânda rezervasyon başına bir karekod. Numara `M360-XXXXXX-01`.
Karekod bugün numarayı taşıyor; canlıda numara + sunucu imzası
olacak (sahte bilet üretilemesin). Ödeme alınmadığı için deneme
biletleri "DENEME" damgalı ve "geçerli değil" yazıyor.

### Molapuan ve seviye

- **Kural (kullanıcı):** puan tura katılınca kazanılır ve tura göre
  değişir: ürün kaydında `loyalty: { points }`. Bugün Efes 60, Kapadokya
  3 Gece 250 (**örnek**). Puan rezervasyon başına (hesap sahibinin
  katılımı); tur bitince `kazanildi`, öncesinde `bekliyor`, iptalde
  düşer.
- Puan harcama kuralı ve seviye avantajları **belirlenmedi**. Seviye
  eşikleri örnek (Classic 0, Silver 500, Gold 1.500, Platinum 3.000
  kazanılmış puan); panel avantaj vaat etmiyor.

### Kuponlar

Üyeliğe kişiye özel `HOSGELDIN-XXXXX` kodu: kampanya `yeni-uye` (%15,
en fazla 1.500 TL), **yalnızca ilk rezervasyonda** (iptal edilmemiş
rezervasyonu olmayan üye), 90 gün, tek kullanım. Kod başkasının
hesabında çalışmaz; kullanılınca rezervasyon koduyla işaretlenir.
Kuponlarım herkese açık kodları (örnek `MOLA100`) da listeler.

### Favoriler

Misafir de ekleyebilir (bu tarayıcıda). Kart kalpleri kartın bağından
ürünü bulur (`mola360KartUrunu`); sonradan çizilen kartlar da boyanır.

### Bildirimler

Elle yazılmış bildirim yok; hepsi durumdan türetiliyor: hoş geldin,
kişisel kupon (ve son 7 gün), rezervasyon talebi, yaklaşan tur
(3 gün içinde), kalan ödeme ve arama günü (7 gün içinde), iptal ve
iade, kazanılan puan, favorideki indirim. Kimlik kararlı; okundu ve
kaldırıldı işaretleri kalıcı.

### Ödeme yöntemleri

Kart bilgisi sitede tutulmaz. Kart kaydı ödeme kuruluşunun kasasında
(tokenizasyon) olacak; panel yalnızca son dört haneyi ve aileyi
gösterecek.

## 15. Kurumsal ve yasal sayfalar

İçerik `assets/js/corporate-data.js` (`KRM_SAYFALAR`, `KRM_SSS`), ekran
`assets/js/corporate-page.js`. Backend gelince sayfa kayıtları yönetim
panelinden düzenlenecek; biçim aynı.

### Kurallar

- **Şirket kimliği uydurulmaz.** `KRM_SIRKET`'teki boş alanlar (ticari
  unvan, adres, MERSİS, vergi dairesi ve numarası, TÜRSAB belge
  numarası, KEP, e-posta, ETBİS kaydı) sayfada "yayından önce eklenecek"
  diye işaretli; yasal sayfalar "taslak" uyarısı taşır. Telefon ve
  WhatsApp numaraları da yer tutucu (`CONTACT.yerTutucu`) ve İletişim
  sayfası bunu söylüyor.
- **Metindeki kural sayıları kural tablosundan:** `{kaporaOrani}`,
  `{kaporaEnAzGun}`, `{taksitAltSinir}`, `{kartAileleri}`,
  `{hosgeldinOrani}`, `{hosgeldinGun}` booking-engine.js ve
  account-engine.js'teki değerlerle doldurulur. Anasayfa SSS'si düz
  metin olduğu için sayıları test kural tablosuyla karşılaştırıyor.
- İptal ve İade sayfasındaki tablo satıştaki ürünlerin kendi
  kademelerinden üretiliyor.
- Çerez Politikası gerçeği söylüyor: çerez yok, analitik ve reklam aracı
  yok; tarayıcı deposundaki anahtarlar (`KRM_DEPO`) ve yüklenen dış
  kaynaklar (Google Fonts, Wikimedia, Unsplash, Picsum; bağlantı olarak
  Google Haritalar ve WhatsApp) listeli. Kod yeni bir anahtar ya da dış
  kaynak eklerse test kırılır.
- **Yasal metinler taslaktır; yayından önce hukukçu incelemesinden
  geçmelidir.** Cayma hakkı istisnası (Mesafeli Sözleşmeler
  Yönetmeliği md. 15), paket tur hükümleri, KVKK aydınlatma içeriği ve
  tüketici hakem heyeti bilgisi genel çerçevedir.
- **Paket tur sözleşmesi** (`paket-tur-sozlesmesi`) konaklamalı turlarda
  mesafeli satış sözleşmesine ek olarak onaylatılır: içerik, fiyatın
  sonradan artırılmaması, esaslı değişiklikte dönme hakkı, düzenleyicinin
  iptali, 7 gün önceden devir, sorumluluk, yardım, formaliteler.

### Yayından önce gerekenler

| Bilgi | Nerede |
|---|---|
| Ticari unvan, adres, MERSİS, vergi dairesi ve numarası | `KRM_SIRKET` |
| TÜRSAB / Kültür ve Turizm Bakanlığı belge numarası | `KRM_SIRKET.tursabBelgeNo` |
| KEP adresi ve destek e-postası | `KRM_SIRKET.kep`, `.eposta` |
| ETBİS kaydı | `KRM_SIRKET.etbisNo` |
| Gerçek telefon ve WhatsApp numarası | `home-blocks.js` `CONTACT` (ve `yerTutucu: false`) |
| Sosyal medya hesap adresleri | `home-blocks.js` `CONTACT.social` |
| Hukukçu incelemesi | Kullanım Koşulları, KVKK, Ön Bilgilendirme, Mesafeli Satış, Paket Tur, İptal ve İade |

