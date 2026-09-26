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

Diğer adresler (2. ve 3. adımda açılacak): `/temalar/<slug>/`,
`/koleksiyonlar/<slug>/`, `/firsatlar/<slug>/`, `/yeni-eklenenler/`,
`/bu-hafta/`, `/arama/`, `/hesabim/…`.

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
| `category`, `categoryShort`, `categoryPlural`, `categoryAnchor` | Turda tur tipi (günübirlik/konaklamalı), diğerlerinde ana kategori. Adı yanıltıcı; 2. adımda liste sayfaları açılınca yeniden adlandırılacak. |

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

**Onayına sunulanlar:**

1. **Spa & Masaj** mekân kategorisi menüde yok, ama mevcut ürün
   (`/mekan/kordon-spa-masaj/`) bir masaj salonu. Kategori olarak eklendi.
2. **Son Dakika** hem koleksiyon hem Fırsatlar başlığı. Tek tanım
   tutuldu (kurala göre koleksiyon); Fırsatlar menüsündeki bağlantı aynı
   listeye gidiyor. İki ayrı tanım zamanla ayrışırdı.

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

Saf yardımcılar (`inventory-data.js`, ekranlar bunları kullanır):

- `musaitlikKaydi(musaitlik, item, date, time)` → tek satır veya `null`
- `konaklamaKalan(musaitlik, item, giris, cikis)` → otelde **her gecenin
  en küçüğü**. Önceki sürüm yalnızca giriş gecesine bakıyordu; üçüncü
  gecesi dolu bir oda satılabiliyordu.
- `kontenjanDurumu(kalan, istenen)` →
  `{ durum: 'bilinmiyor' | 'doldu' | 'yetersiz' | 'az' | 'var', kalan }`

Ekranlardaki kural:

- `doldu` → "Bu tarihte yer kalmadı", rezervasyon düğmesi pasif.
- `yetersiz` (istenen kişi > kalan) → "Bu tarihte en fazla N kişilik yer
  var", düğme pasif.
- `bilinmiyor` (cevap henüz gelmedi veya kayıt yok) → kontenjan satırı
  gizli, satış **engellenmez**; son kontrol ödeme adımında.

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
- Rezervasyon anında kur sabitlenir ve rezervasyona yazılır (4. adım).
  **Açık soru:** Döviz fiyatlı turda müşterinin kartından TL mi
  çekilecek, döviz mi?
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
| `urunler(type?)` | senkron | Ürün kayıtları dizisi | Ana sayfa yükü |
| `kategoriler(type)` | senkron | Kategori ağacı (düz dizi, `parent` ile) | Önbellekli uç nokta |
| `kategori(type, slug)` | senkron | Tek kategori veya `null` | 〃 |
| `temalar()`, `tema(slug)` | senkron | Tema(lar) | 〃 |
| `koleksiyonlar()`, `koleksiyon(slug)` | senkron | Koleksiyon(lar) | 〃 |
| `listeSayfasi(type, slug)` | senkron | Adresi çözer: `{ kind: 'category' \| 'listing', … }` veya `null` | 〃 |
| `temaUrunleri(slug)`, `koleksiyonUrunleri(slug)` | senkron | Ürün dizisi | Liste uç noktası |
| `musaitlik(type, slug, { from, to })` | **Promise** | Bölüm 6 | `GET /api/…/musaitlik` |

2. adımdan itibaren eklenecekler (aynı kurala göre): `liste(filtre)` ve
`ara(sorgu)` **Promise**; `fiyatTeklifi(secim)` ve `rezervasyonOlustur`
**Promise** ve sunucuda hesaplanır.

## 10. Bu adımda ne değişti, ne değişmedi

**Değişti**

- Beş sayfa kaydı `MolaVeri.urun` üzerinden okuyor.
- Kalan yer örnek rezervasyonlardan hesaplanıyor; doldu ve yetersiz
  durumları ilk kez ekranda karşılık buluyor.
- Otelde kalan oda her gecenin en küçüğü.
- Her ürün kaydında `taxonomy`, `currency` ve `seo` var.
- Tema sayıları ürünlerden hesaplanıyor.

**Değişmedi**

- Tasarım, sayfa yapısı, adresler.
- Mevcut 7 ürün sayfasının HTML kabuğu (`tur/<slug>/index.html` vb.).
  WhatsApp ve sosyal medya önizlemesi bu kabuktaki başlıktan okunduğu için
  sunucu gelene kadar duruyor. Kabuktaki başlık ile kaydın `seo` alanı
  arasındaki eşitliği test ölçüyor; **yeni ürün için kabuk yazılmayacak**
  (2. adım: tek yönlendirici sayfa).

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
