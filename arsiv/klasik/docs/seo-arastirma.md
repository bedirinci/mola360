# Anasayfa alt SEO bloğu — araştırma notları

Eylül 2026'da yapılan araştırmanın bulguları ve bunların koda nasıl
yansıdığı. Kaynaklar en altta.

## 1. FAQ zengin sonuçları artık yok

Google, FAQ zengin sonuçlarını önce Ağustos 2023'te yalnızca tanınmış
kamu ve sağlık sitelerine daralttı, **7 Mayıs 2026'da ise tamamen
kaldırdı**. Search Console raporlaması Haziran 2026'da, API desteği
Ağustos 2026'da sona eriyor.

**Sonuç:** Sayfadaki `FAQPage` yapısal verisi artık arama sonucunda
açılır soru-cevap görünümü üretmez. Buna rağmen tutuluyor, çünkü:

- `FAQPage` hâlâ geçerli bir schema.org türü ve Google sayfayı anlamak
  için okumaya devam ettiğini açıkça söyledi.
- Üretken arama motorları (AI Overviews, ChatGPT, Perplexity) yapısal
  veriyi aday seçiminde kullanıyor.

**Yapılmaması gereken:** Bu işaretlemeyi "zengin sonuç getirir" diye
sunmak. Getirmiyor.

## 2. Üretken arama sayfayı bölüm bölüm okuyor

En önemli bulgu: AI Overviews bir sayfayı bütün olarak değil, **her
bölümü bağımsız olarak** alıp puanlıyor. Ölçülen kalıplar:

| Bulgu | Değer |
|---|---|
| Alınan pasajların tercih edilen uzunluğu | 134–167 kelime |
| Öne çıkan içeriğin çoğunluğu | 100–300 kelime aralığında |
| 15+ bağlantılı adı geçen varlık içeren içerik | 4,8× daha yüksek seçilme olasılığı |
| Net biçimlendirilmiş içerik | %28–40 daha çok alıntılanıyor |

**Koda yansıması** (`SEO_ARTICLE`):

- Her bölüm kendi başına anlaşılan **130–170 kelimelik** bir pasaj.
  11/11 bölüm bu bandda; test bunu doğruluyor.
- Başlıklar **soru biçimli** (11/11) — kullanıcının yazdığı sorguya
  doğrudan eşleşsin diye.
- **Varlık yoğunluğu** bilinçli olarak yüksek: metinde 49 ayrı yer adı
  geçiyor (Efes, Kemeraltı, Alaçatı, Göreme, Ölüdeniz, Köprülü Kanyon,
  Aspendos, Karahayıt…). Eşik 15; test en az 30 arıyor.

## 3. Alt metin bloğu hâlâ işe yarıyor, ama uzunluk bir denge meselesi

2026 rehberleri kategori sayfalarının altındaki metin bloğunu hâlâ
öneriyor; tavsiye edilen uzunluk **300–500 kelime**. John Mueller'in
uyarısı da tekrarlanıyor: aşırıya kaçmak Google'ın sayfanın konusunu
anlamasını zorlaştırıyor.

Bizim blok **1.524 kelime** — bu tavsiyenin belirgin şekilde üzerinde.
Bilerek böyle bırakıldı, çünkü:

- Uzunluk isteği açıkça belirtildi.
- Asıl ölçüt toplam uzunluk değil, **pasaj yapısı**; 11 bağımsız pasajın
  her biri kendi başına hedef bandda.

**Yine de bilinmeli:** Kategori/hub sayfaları açıldığında derinlik oraya
taşınmalı, anasayfadaki blok 400–500 kelimeye inmeli. Anasayfa marka ve
geniş terimleri hedefler; derinlik hub sayfalarının işidir.

## 4. Asıl değer metinde değil, iç bağlantı ağında

Kategori sayfası "bir satış sayfası değil, bir hub" olmalı; ilgili alt
kategorilere ve bilgi içeriğine bağlanmalı. Uzun kuyruk trafiği tek bir
sayfadan değil, birbirine bağlı çok sayıda hub sayfasından gelir.

Blokta **68 iç bağlantı** var (şehir, kategori, tema, plan + uzun kuyruk
çip bulutu). **Ancak bunların hepsi şu an `#/...` hash rotası.** Bu
ağın SEO değeri, hedefler sunucudan servis edilen taranabilir URL'lere
dönene kadar sıfırdır. Sıradaki en yüksek getirili iş budur.

## 5. Sıradaki adımlar (etkiye göre sıralı)

1. **Hub sayfalarını gerçek URL yap.** 68 bağlantının hedefi yok.
   Taksonomi: `/sehir/izmir`, `/kategori/konser-biletleri`,
   `/tema/doga-yayla-turlari`, `/plan/bu-hafta-sonu`.
2. **`Event` yapısal verisi ekle.** Etkinlikler için zengin sonuç hâlâ
   çalışıyor. Zorunlu alanlar: `name`, `startDate` (ISO 8601, saat
   dilimiyle), fiziksel `location`. Önerilen: `endDate`, `image`,
   `offers` (fiyat düz sayı, `priceCurrency` = TRY), `performer`,
   `organizer`.
   **Kritik koşul:** işaretlenen her veri sayfada görünür olmalı ve
   fiyat yazıyorsa sayfada da yazmalı. Ayrıca **gerçek envanter
   gelmeden eklenmemeli** — uydurma etkinlikleri işaretlemek yanıltıcı
   yapısal veridir ve elle işlem riski taşır. Bu yüzden şu an eklenmedi.
3. **`BreadcrumbList`** hub sayfaları açıldığında.
4. **`ItemList`** listeleme sayfalarında.
5. SSS cevaplarındaki iptal/iade/ödeme ifadelerini gerçek politika
   metinleriyle değiştir.

## Kaynaklar

- https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/
- https://developers.google.com/search/docs/appearance/structured-data/event
- https://gofishdigital.com/blog/ecommerce-category-page-seo/
- https://www.lawrencehitches.com/ecommerce-internal-linking-strategy/
- https://www.digitalapplied.com/blog/seo-after-ai-overviews-complete-strategy-guide-2026
- https://yyyokel.com/ai-citation-capture-geo-playbook-2026/
