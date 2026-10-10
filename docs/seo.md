# Mola360 SEO kural kitabı

Bedir'in SEO çalışmasından (2026-10-08) ve kararlarından çıkan kurallar.
Kod `scripts/seo.mjs` (üretici), `v2/js/sehirler.js` (sayfa tanımları) ve
`v2/js/api.js` (veri) içinde; testler (`tests/v2.test.js`,
`tests/v2-tarayici.test.js`) bu kuralları denetler.

## 1. Hedef

Mola360'ın SEO'su Booking gibi yalnızca rezervasyon kelimelerine kurulmaz.
Hedef "keşif motoru" SEO'sudur: insanın boş zamanında ne yapabileceğini
sorduğu bütün aramalar. Örnek aramalar:

- "İzmir'de yapılacaklar", "İzmir'de bu hafta sonu ne yapılır";
- "İzmir'de sevgiliyle yapılacaklar", "Alsancak'ta yapılacaklar";
- "İzmir kahvaltı mekânları", "İzmir butik otelleri";
- "Kapadokya turları", "İzmir çıkışlı turlar".

Model şu sitelerin birleşimidir:

| Örnek site | Mola360'ın ondan aldığı |
|---|---|
| Tripadvisor | Mekân + deneyim + kullanıcı yorumu + keşif |
| GetYourGuide | Şehir → aktivite → deneyim |
| Yelp | Yerel işletme + kategori + konum |
| Pinterest, Reddit | Kullanıcı içeriği |
| Etstur, Enuygun | Destinasyon ve şehir merkezli sayfalar |
| Sahibinden, Akakçe | Veri mimarisi ve özellik sayfaları |
| Time Out | Editoryal "şehirde ne yapılır" |

## 2. Kapsam (Bedir 2026-10-07/08)

- **Mekân, etkinlik ve aktivite** şehre bağlıdır. Mola360 önce İzmir'de
  açılır; öteki şehirler sırası gelince aynı yapıyla eklenir
  (`sehirler.js` `SEHIRLER`'e şehir, `SAYFA`'ya sayfaları, `aktif:true`).
- **Oteller ve turlar** bütün şehirlerdendir; kendi ağaçları vardır.

## 3. Adres yapısı

| Sayfa | Adres | Örnek |
|---|---|---|
| Şehir | `/<şehir>/` | `/izmir/` "İzmir'de yapılacaklar" |
| Şehir + tür | `/<şehir>/<tür>/` | `/izmir/mekanlar/` |
| Şehir + tür + özellik | `/<şehir>/<tür>/<özellik>/` | `/izmir/mekanlar/kahvalti/` |
| Şehir + niyet | `/<şehir>/<niyet>/` | `/izmir/sevgiliyle-yapilacaklar/` |
| Şehir + bölge | `/<şehir>/<bölge>/` | `/izmir/alsancak/` |
| Şehirdeki deneyim | `/<şehir>/<tür>/<deneyim>/` | `/izmir/mekanlar/kum-beach-club/` |
| Bütün oteller / turlar | `/oteller/`, `/turlar/` | |
| Tur + özellik | `/turlar/<özellik>/` | `/turlar/yurt-disi/` |
| Kalkış şehrine göre turlar | `/turlar/<şehir>-cikisli/` | `/turlar/izmir-cikisli/` |
| Otel / tur | `/oteller/<otel>/`, `/turlar/<tur>/` | `/turlar/kapadokya-turu/` |

Adres kuralları:

- Adresler Türkçe karakterleri sadeleştirilmiş, küçük harfli,
  tirelidir; sonda `/` vardır.
- Sorgu (`?`) arama motoruna gösterilen adreste yoktur.
- Bir deneyimin tek kalıcı adresi vardır. Uygulama adresi (`urun/?id=`)
  asıl adres olarak kalıcı sayfayı gösterir.
- Bütün kartlar ve bağlar (`api.urunUrl`, `api.productUrl`) kalıcı adrese
  gider.

## 4. Sayfa ne zaman yayımlanır (kapı sayfası yok)

Google, yalnızca sıralanmak için üretilmiş, birbirinin benzeri sayfaları
"scaled content abuse" ve "doorway" sayar. Bu yüzden:

- **Eşik:** sayfa en az `ESIK` (3) deneyimle yayımlanır. Altında kalan
  tanım üretilmez; deneyim gelince kendiliğinden açılır.
- **Aynı küme olmaz:** deneyimleri öteki bir sayfayla birebir aynı olan
  sayfa yayımlanmaz.
- **Metinler kendine özgüdür:** her sayfanın adı, giriş metni ve açıklaması
  başka hiçbir sayfada yoktur. Giriş metni o sayfadaki gerçek deneyimleri
  anlatır.
- **Kural 3 (kategori ≠ filtre):** sayfanın süzgeci tür ve en çok bir
  süzgeçtir (özellik, kalkış, kiminle ya da bölge).

## 5. Her sayfada

Hepsi JavaScript olmadan HTML'dedir; testler denetler.

- **Başlık (`<title>`):** önce sayfanın adı, sonra sayfada ne bulunacağı,
  en çok 60 harf ("İzmir mekânları — fiyatlar ve rezervasyon | mola360").
  Sığmazsa yalnızca ad ve marka.
- **Açıklama:** en çok 160 harf; ad, sığdığı kadar deneyim, başlangıç
  fiyatı.
- **Tek `h1`:** sayfanın adı.
- **Keşfet** (`v2/index.html`): asıl adres, Open Graph ve sitenin
  yapısal verisi (`WebSite`, `Organization`) `<!-- bas -->` bloğunda;
  `npm run seo` üretir.
- **Asıl adres (canonical)** ve aynı adresle Open Graph (`og:title`,
  `og:description`, `og:url`, `og:locale` tr_TR) ile `twitter:card`.
- **Görünen sayfa yolu** başlığın üstünde (Keşfet › İzmir › Mekânlar).
  JSON-LD'deki sayfa yolu bununla aynıdır.
- **Yapısal veri (JSON-LD):**
  - liste ve şehir sayfasında `CollectionPage`, `BreadcrumbList`,
    `ItemList` (kartlarla aynı sırada) ve `FAQPage` (görünen sorularla
    birebir);
  - deneyim sayfasında türüne göre:
    - otel `Hotel`;
    - tur `TouristTrip`;
    - mekân `Restaurant`, `BarOrPub`, `DaySpa`, `CafeOrCoffeeShop` ya da
      `LocalBusiness`;
    - aktivite `Product`;
    - etkinlik `Product`, ayrıca tarayıcıda her yaklaşan tarih için
      `Event`;
  - deneyim sayfasında ayrıca `BreadcrumbList`.
- **Puan:** `aggregateRating` yalnızca gerçek değerlendirmede yer alır
  (`sample` olmayan veri). Örnek puan yapısal veriye girmez.
- **Tarih yok:** sabit HTML'e gün yazılmaz (etkinlik kartında yalnızca
  saat), çünkü sayfa ertesi gün eskirdi. Etkinlik tarihleri JavaScript
  çizince gelir. Test, saati 45 gün ileri alıp sayfaların değişmediğini
  denetler.
- **İç bağlar:**
  - liste sayfasında "… hakkında" (deneyimlere bağ), "Sık sorulan
    sorular" ve "İlgili sayfalar";
  - deneyim sayfasında "Bu deneyimin bulunduğu sayfalar";
  - şehir sayfasında türlerin rayları, özellik çipleri, kiminle ve
    semtler;
  - Keşfet'te arama kartının ardındaki koleksiyonlar ve
    "İzmir'de ne yapılır?" bölümü.

## 6. Dizine ekleme ve site haritası

- **`YAYIN` anahtarı:** `scripts/seo.mjs` içinde. Yayına hazır olana kadar
  `false`; bütün sayfalar `noindex, nofollow` olur (Bedir: şimdilik
  kalsın).
- **`true` olunca** (`npm run seo` ile her sayfa güncellenir):
  - Keşfet: `index, follow`;
  - şehir, otel, tur ve deneyim sayfaları yalnızca **gerçek veriyle**
    `index, follow` (aşağıda "Örnek veri dizine girmez"); örnek veriyle
    `noindex, follow`;
  - Liste, Ürün (`?id=`) ve Bağlan: `noindex, follow`;
  - kişisel sayfalar (profil, mesajlar, rezervasyon …):
    `noindex, nofollow`.
- **Süzgeçli adres:** süzgeçli adres (`/turlar/kultur/?sure=uzun`) asıl
  adres olarak yalın sayfayı gösterir.
- **Örnek veri dizine girmez (2026-10-10):** uydurma işletme, fiyat,
  puan ya da müsaitlik arama sonucuna çıkmaz. `api.js`'te `sample:true`
  olan deneyimin sayfası dizine girmez; liste sayfası en az `ESIK` gerçek
  deneyimle, şehir sayfası şehrin sayfalarında en az `ESIK` gerçek
  deneyimle dizine girer (`scripts/seo.mjs` `acikYollar`). Bugün bütün
  deneyimler örnek olduğu için `YAYIN = true` olsa da yalnızca Keşfet
  dizine girer. Gerçek iş ortağı verisi geldikçe sayfalar kendiliğinden
  açılır.
- **Site haritası:** `v2/sitemap.xml` yalnızca dizine eklenebilir
  (`index`) sayfaları içerir; `YAYIN` kapalıyken boştur. `lastmod` yazılmaz
  (gerçek değişiklik tarihi yok). Search Console'a gönderilir.
- **`robots.txt`:** site alanın kökünde olmadığı için
  (`bedirinci.github.io/mola360/`) yazılamıyor; alan adı gelince eklenir.

## 7. Hız ve kullanıcı deneyimi

Google'ın iyi deneyim eşikleri: LCP < 2,5 sn, INP < 200 ms, CLS < 0,1.

- Web fontu yüklenmez.
- Görseller 200 KB altıdır (fotoğraf kuralı, `docs/yeni-surum.md`).
- Sayfa içeriği HTML'de durur; JavaScript yalnızca etkileşim ekler.

## 8. Yeni şehir ya da sayfa eklemek

1. Deneyim verisini ekle; bölgeleri `data.js` `DESTS`'e şehir alanıyla
   gir.
2. `sehirler.js`: `SEHIRLER`'e şehri (`aktif:true`, ekli halleri,
   tanıtım), `SAYFA`'ya sayfalarını ekle. Her sayfanın adı ve giriş metni
   kendine özgü olmalı.
3. `npm run seo` ile sayfaları, Keşfet bağlarını ve site haritasını
   üret.
4. `npm test` ile eşik, kapı sayfası, başlık ve yapısal veri
   denetimlerinin geçtiğini gör.

## 9. Sıradakiler

- **"Bu hafta sonu İzmir'de ne var?"** Editoryal ve güncel sayfa; tarihli
  içerik JavaScript'le çizilir.
- **Bölge + tür sayfaları** ("Alsancak mekânları"); deneyim sayısı eşiği
  geçince.
- **Görseller:** gerçek fotoğraflar gelince `og:image` ve yapısal veride
  `image`.
- **Gerçek değerlendirmeler** gelince `aggregateRating` ve yorum
  parçacıkları.
- **Alan adı ve yayın:** alan adı, `robots.txt`, Search Console ve
  `YAYIN = true`. Denetim raporu ve yol haritası (2026-10-10):
  proje klasöründe `docs/seo/denetim-2026-10-10.md`.
- **Keşfet'te yerleşim kayması:** yavaş bağlantıda JavaScript'le çizilen
  bölümler (süre rayı, Kiminle, Yakınımda) ilk boyamadan sonra gelip
  içeriği kaydırıyor (yerel laboratuvar ölçümünde CLS 0,45; eşik 0,1).
  Bölümlere yer ayrılmalı.
