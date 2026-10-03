# Mola360 — Proje Dokümanı

| | |
|---|---|
| Doküman türü | Ana proje / ürün dokümanı |
| Sürüm | 0.1 — Başlangıç |
| Tarih | 3 Ekim 2026 |
| Proje | Mola360 |
| Repository | bedirinci/mola360 |

> Bu doküman Mola360'ın **tek kaynağıdır** ve v2 için bağlayıcıdır.
> Kuralların kısa listesi: [`docs/yeni-surum.md`](yeni-surum.md).
> Vizyon metni: [`docs/VIZYON.md`](VIZYON.md).
> Alınan kararlar en alttaki **Karar kaydı**na işlenir (bölüm 23).

---

## 1. Dokümanın Amacı

Bu doküman Mola360'ın tek bir proje kaynağı olarak kullanılacaktır.

Mola360'ın ürün vizyonu, hedefleri, kullanıcı deneyimi, fonksiyonları,
teknik mimarisi, veri modeli, tasarım sistemi, iş modeli, büyüme
yaklaşımı ve geliştirme yol haritası burada tanımlanacaktır.

Bu dokümanda alınan kararlar ilerleyen geliştirme aşamalarında referans
alınacaktır.

**Temel prensip**

Mola360 geliştirilirken yalnızca mevcut arayüzü büyütmek yerine, ürünün
işlevsel ve teknik temeli birlikte tasarlanacaktır.

---

## 2. Mola360 Nedir?

Mola360; insanların boş zamanlarında yapabilecekleri deneyimleri
keşfettiği, gerçek insanların deneyimlerinden ilham aldığı ve keşfettiği
deneyimleri doğrudan rezerve edebildiği sosyal keşif ve deneyim
platformudur.

Mola360'ın temel deneyimi iki ana alan üzerine kuruludur:

- **Keşfet:** Turlar, etkinlikler, aktiviteler, oteller ve mekanları
  keşfetme ve rezervasyon.
- **Bağlan:** Bu deneyimlerle ilgilenen insanların fotoğraf, video ve
  deneyimlerini paylaşabildiği sosyal alan.

Mola360'ın temel fikri, sosyal keşif ile ticari keşfi aynı ekosistemde
birbirine bağlamaktır.

---

## 3. Problem

Kullanıcıların boş zamanlarını değerlendirmek için kullandığı dijital
deneyim parçalıdır.

Bir kullanıcı:

1. Sosyal medyada bir deneyim görebilir.
2. Deneyimin ne olduğunu araştırabilir.
3. Başka bir platformda ürün veya mekan arayabilir.
4. Fiyat ve uygunluk kontrolü yapabilir.
5. Başka bir platformdan rezervasyon gerçekleştirebilir.
6. Deneyim sonrasında tekrar sosyal medyaya dönerek deneyimini
   paylaşabilir.

Mola360 bu parçalı akışı tek bir ürün deneyiminde birleştirmeyi
hedefler.

---

## 4. Çözüm

Mola360 şu döngüyü oluşturmayı hedefler:

> Keşfet → İlham al → İncele → Rezervasyon yap → Deneyimi yaşa → Paylaş
> → Başkalarına ilham ver

Bu döngünün temel bağlantısı sosyal içerik ile ticari deneyim arasındaki
ilişkidir.

Örneğin bir kullanıcı Kapadokya'da yaptığı bir balon turunun fotoğrafını
paylaşabilir. Paylaşım, ilgili deneyim/ürün ile ilişkilendirilebilir.
Başka bir kullanıcı içeriği gördüğünde ilgili ürünü inceleyebilir ve
rezervasyon gerçekleştirebilir.

---

## 5. Ürün Vizyonu

Mola360 yalnızca bir rezervasyon sitesi veya yalnızca bir sosyal ağ
olarak konumlandırılmayacaktır.

Uzun vadeli ürün modeli:

> Sosyal keşif + deneyim keşfi + rezervasyon + kullanıcı üretimli içerik

Mola360'ın merkezindeki kavram **deneyim** olacaktır.

---

## 6. Ana Ürün Alanları

### 6.1 Keşfet

Keşfet, Mola360'ın deneyim ve ticaret tarafıdır.

Ana ürün kategorileri:

- Turlar
- Etkinlikler
- Aktiviteler
- Oteller
- Mekanlar

Temel özellikler:

- Arama
- Kategori keşfi
- Filtreleme
- Sıralama
- Ürün listeleme
- Ürün detayları
- Favoriler
- Uygunluk
- Fiyat
- Rezervasyon
- Ödeme
- Kullanıcı değerlendirmeleri

**Kategori ve filtre ayrımı**

Kategori, ürünün ne olduğunu belirtir.

Örnek:

- Tur
- Otel
- Aktivite

Filtre ise kullanıcının keşif kriteridir.

Örnek:

- Bugün
- Bu hafta
- Hafta sonu
- Yakınımda
- Fiyat aralığı
- Popüler
- Çocuklu
- Çiftler
- Arkadaşlarla

Kategori ve filtre sistemi birbirine karıştırılmayacaktır.

---

## 7. Bağlan

Bağlan, Mola360'ın sosyal keşif alanıdır.

Kullanıcılar:

- Fotoğraf paylaşabilir.
- Video paylaşabilir.
- Deneyimlerini anlatabilir.
- Başka kullanıcıları takip edebilir.
- Beğenebilir.
- Yorum yapabilir.
- İçerik kaydedebilir.
- İçerik paylaşabilir.
- Lokasyon ekleyebilir.
- Deneyim/ürün etiketleyebilir.

**Bağlan'ın temel farkı**

Mola360 sosyal ağının amacı genel amaçlı bir sosyal medya kopyası olmak
değildir.

Sosyal içerik, Mola360'daki gerçek deneyimlerle ilişkilendirilebilir.

Örnek:

Paylaşım

> Kapadokya'da gün doğumunda balon turu. Muhteşemdi.

Bağlı deneyim

> Kapadokya Gün Doğumu Balon Turu
> Puan
> Fiyat
> Uygunluk
> Deneyimi keşfet

Böylece içerik, keşfe; keşif ise rezervasyona dönüşebilir.

---

## 8. Keşfet ↔ Bağlan Döngüsü

Mola360'ın temel ürün döngüsü:

```
                 MOLA360
                    |
          +---------+---------+
          |                   |
       KEŞFET              BAĞLAN
          |                   |
      Ürünler             İnsanlar
          |               İçerikler
          |                   |
          +---------+---------+
                    |
               REZERVASYON
                    |
                 DENEYİM
                    |
                  PAYLAŞ
                    |
              YENİ KEŞİF
                    |
                    +---->
```

Bu döngünün teknik olarak da desteklenmesi gerekir.

Önemli ilişkiler:

- Post → Product
- Product → Related Posts
- User → Interests
- User → Saved Products
- User → Bookings
- Location → Products
- Location → Posts

---

## 9. Kullanıcı Deneyimi

Temel kullanıcı yolculuğu:

**Aşama 1 — Keşif.** Kullanıcı Mola360'a gelir.

**Aşama 2 — İlham.** Kullanıcı ürün veya sosyal içerik görür.

**Aşama 3 — Değerlendirme.** Kullanıcı fotoğrafları, açıklamayı,
fiyatı, tarihi, lokasyonu, değerlendirmeleri ve uygunluğu inceler.

**Aşama 4 — Aksiyon.** Kullanıcı favoriler, paylaşır, ürün detayına
gider, rezervasyon yapar.

**Aşama 5 — Deneyim.** Kullanıcı deneyimi gerçekleştirir.

**Aşama 6 — İçerik.** Kullanıcı deneyimini Mola360'daki sosyal alanda
paylaşabilir.

---

## 10. Kullanıcı Profili

Profil alanı zaman içinde şu bilgileri içerebilir:

- Profil fotoğrafı
- Kullanıcı adı
- Biyografi
- Takipçiler
- Takip edilenler
- Paylaşımlar
- Kaydedilenler
- Favoriler
- Rezervasyonlar
- Deneyimler
- İlgi alanları
- Sadakat / puan durumu

Profil yalnızca sosyal kimlik değil, kullanıcının Mola360'daki deneyim
geçmişinin merkezi olacaktır.

---

## 11. İşletme Ekosistemi

Uzun vadede Mola360 yalnızca kullanıcı tarafı uygulaması olmayacaktır.

İşletmeler için yönetim alanı planlanabilir.

İşletme tarafında:

- Ürün oluşturma
- Ürün düzenleme
- Fiyat
- Kontenjan
- Uygunluk
- Rezervasyon yönetimi
- Kampanya
- Görsel yönetimi
- Müşteri değerlendirmeleri
- Performans/analitik

gibi işlevler bulunabilir.

---

## 12. İş Modeli

Başlangıçta değerlendirilebilecek temel gelir modeli:

**Rezervasyon komisyonu** — Mola360 üzerinden gerçekleşen
rezervasyonlardan komisyon geliri.

İlerleyen aşamalarda test edilebilecek modeller:

- İşletme hizmetleri
- Öne çıkarma
- Sponsorlu keşif alanları
- İşletme abonelikleri
- Kampanya hizmetleri
- İçerik üreticisi / işletme iş birlikleri
- Sadakat ekosistemi

Bu modellerin hangilerinin uygulanacağı kullanıcı ve işletme verileri
üzerinden doğrulanacaktır.

---

## 13. Growth / Kullanıcı Döngüsü

Mola360'ın büyüme döngüsü:

> Keşif → Etkileşim → Rezervasyon → Deneyim → Paylaşım → Yeni keşif

Takip edilecek temel davranışlar:

- Kullanıcı aktivasyonu
- Arama
- Ürün görüntüleme
- Favoriye ekleme
- Rezervasyon
- Rezervasyon tamamlama
- Paylaşım
- Beğeni
- Yorum
- Takip
- Kaydetme
- Sosyal içerikten ürüne geçiş
- Ürün görüntülemeden rezervasyona geçiş

---

## 14. Tasarım Sistemi

Mola360'ın kendi tasarım dili oluşturulacaktır.

Unilayk projesi yalnızca referans niteliğindedir. Mola360, Unilayk'ın
yeniden adlandırılmış hali olarak konumlandırılmayacaktır.

Tasarım sisteminde:

- Renk tokenları
- Tipografi
- Spacing
- Radius
- Shadow
- Iconography
- Buttons
- Cards
- Inputs
- Navigation
- Modal
- Bottom sheet
- Badge
- Filter
- Product card
- Social post
- Profile
- Empty state
- Error state

tanımlanacaktır.

---

## 15. Teknik Mevcut Durum

Mevcut V2 frontend'i kapsamlı bir HTML prototipi niteliğindedir.

Mevcut V2'de HTML, CSS ve JavaScript aynı dosyada bulunmaktadır.

V2'nin sonraki aşamada modülerleştirilmesi planlanmaktadır.

Hedef ayrım:

```
v2/
├── index.html
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── components.css
│   ├── discover.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── api.js
│   ├── navigation.js
│   ├── discover.js
│   ├── favorites.js
│   └── ...
└── components/
```

Framework değişikliği ayrıca değerlendirilecektir; mevcut prototip
doğrudan başka bir framework'e taşınmadan önce mimari analizi
yapılacaktır.

---

## 16. Backend

Mevcut repository'de PostgreSQL tabanlı backend yapısı ve
rezervasyon/ürün odaklı migration'lar bulunmaktadır.

Mevcut sistemin temel alanları arasında:

- Kullanıcı
- Ürün
- Tur
- Otel
- Aktivite
- Etkinlik
- Mekan
- Inventory
- Booking
- Marketing
- Loyalty
- Taxonomy

gibi alanlar bulunmaktadır.

Mevcut backend temelinin korunması ve Mola360'ın yeni sosyal katmanıyla
genişletilmesi değerlendirilecektir.

---

## 17. Sosyal Veri Modeli — Planlanan

Mola360'ın sosyal katmanı için aşağıdaki temel varlıklar
planlanmaktadır:

User, Profile, Post, PostMedia, Follow, Like, Comment, Save, Share,
Hashtag, Location, ProductTag, Notification, Report, Moderation, Feed

Önemli ilişkiler:

```
User
 ├── Posts
 ├── Followers
 ├── Following
 ├── Bookings
 ├── Favorites
 └── Interests

Post
 ├── User
 ├── Media
 ├── Location
 ├── Product
 ├── Likes
 ├── Comments
 └── Shares

Product
 ├── Provider
 ├── Inventory
 ├── Booking
 └── Related Posts
```

Bu bölüm teknik tasarım aşamasında kesinleştirilecektir.

---

## 18. MVP Yol Haritası

**Faz 1 — Foundation**
- V2 kod analizi
- HTML/CSS/JS ayrımı
- Design system
- Component yapısı
- API katmanı
- Gerçek veri modeli

**Faz 2 — Keşfet**
- Arama
- Kategoriler
- Listeleme
- Filtre
- Ürün detay
- Favoriler
- Uygunluk
- Rezervasyon
- Ödeme

**Faz 3 — Kullanıcı**
- Authentication
- Profil
- Rezervasyonlar
- Favoriler
- Bildirimler
- Sadakat

**Faz 4 — Bağlan**
- Feed
- Profil
- Follow
- Post
- Fotoğraf/video
- Like
- Comment
- Save
- Share
- Location
- Product tagging

**Faz 5 — Keşfet + Bağlan entegrasyonu**
- Post → Product
- Product → Related Posts
- User → Interests
- Personalized Feed
- Personalized Discovery

**Faz 6 — Business**
- İşletme paneli
- Ürün yönetimi
- Inventory
- Rezervasyon
- Kampanya
- Analitik

---

## 19. Analitik

Mola360 yalnızca toplam kullanıcı sayısını takip etmeyecektir.

Temel funnel:

```
Visit
 ↓
Search / Discovery
 ↓
Product View
 ↓
Save
 ↓
Booking
 ↓
Completed Experience
 ↓
Post
 ↓
Engagement
 ↓
New Product View
```

Önemli metrikler:

- DAU / MAU
- Activation
- Search → Product View
- Product View → Save
- Product View → Booking
- Booking → Completed Experience
- Experience → Post
- Post → Engagement
- Post → Product View
- Product View → Booking

---

## 20. Güven ve UX İlkeleri

Mola360 kullanıcı davranışını anlamaya ve dönüşümü artırmaya
çalışacaktır; ancak kullanıcıyı yanıltan dark pattern'ler
kullanılmayacaktır.

Kullanılabilecek mekanikler:

- Gerçek stok bilgisi
- Gerçek zamanlı uygunluk
- Gerçek kullanıcı değerlendirmeleri
- Şeffaf fiyat
- Açık iptal koşulları
- Gerçek sosyal kanıt
- Gerçek kampanya süresi
- Kişiselleştirilmiş öneriler

Kullanıcıya yanlış kıtlık, sahte sayaç, sahte bildirim veya gizli ücret
gösterilmeyecektir.

---

## 21. Mola360'ın Ürün Döngüsü

Mola360'ın temel ürün döngüsü:

> **Ne yapacağını keşfet → İnsanların deneyimlerinden ilham al →
> Deneyimi incele → Rezervasyon yap → Deneyimi yaşa → Paylaş → Başka
> insanlara ilham ver.**

---

## 22. Marka Vaadi

**Kısa ifade**

> Ne yapacağını keşfet. İnsanlarla bağlan. Deneyimini yaşa.

**Ürün tanımı**

Mola360, insanların boş zamanlarında ne yapacaklarını keşfettiği,
gerçek insanların deneyimlerinden ilham aldığı ve keşfettiği deneyimleri
doğrudan yaşayabildiği sosyal keşif platformudur.

---

## 23. Doküman Yönetimi

Bu doküman Mola360'ın ana proje dokümanı olarak kullanılacaktır.

Yeni bir ürün veya teknik karar alındığında ilgili bölüm
güncellenecektir.

Önemli kararlar mevcut sistemle çelişiyorsa, kararın:

- nedeni,
- etkilediği alanlar,
- teknik sonucu,
- UX sonucu

dokümana işlenecektir.

Bu doküman statik bir sunum dosyası değil, Mola360 geliştikçe
güncellenecek yaşayan proje dokümanıdır.

---

## Karar kaydı

### 2026-10-03 — Klasik site arşivlendi, önce v2 arayüzü

- **Karar:** Klasik site `arsiv/klasik/` altına taşındı ve yayından
  kalktı. Mola360 yeni vizyonla v2 olarak devam ediyor. Yolun başında
  olduğumuz için önce v2'nin arayüzü (frontend) bitirilecek.
- **Neden:** Klasik site "rezervasyon sitesi" olarak kurgulanmıştı; yeni
  vizyon Keşfet + Bağlan. İki siteyi birlikte yürütmek dikkati bölüyordu.
- **Etkilediği alanlar:** Kök adres (`/mola360/`) artık `v2/`'ye
  yönlendiriyor. Klasik sayfaların adresleri (`/tur/…`, `/otel/…`,
  `/admin/` …) yayında değil. Klasik testler çalıştırılmıyor.
- **Teknik sonuç:** Backend korunuyor. Göç betiği (`import:legacy`)
  klasik verileri artık `arsiv/klasik/assets/js/` altından okuyor.
  Klasik sitedeki kurallar (fiyat, kontenjan, iptal, veri sözleşmesi:
  `arsiv/klasik/docs/veri-sozlesmesi.md`) v2 için başvuru kaynağı olarak
  duruyor; kod v2'ye kopyalanmıyor.
- **UX sonucu:** Ziyaretçi her zaman v2'yi görüyor. v2'de henüz
  yapılmamış sayfalar "hazırlanıyor" bildirimi gösteriyor.

### 2026-10-03 — v2 arayüz iskeleti: çok sayfa, alt menüde Bağlan

- **Karar:** v2 tek dosyadan çok sayfalı bir iskelete geçti: Keşfet,
  Bağlan, ürün, liste, favoriler, rezervasyonlar, profil. Alt menü
  Keşfet · Bağlan · Favoriler · Rezervasyonlar · Profil oldu ("Hesabım"
  yerine "Profil", §10). Keşfet'e Bağlan önizleme rayı, ürün sayfasına
  "Bu deneyimi yaşayanlar" bölümü eklendi.
- **Neden:** Bedir İnci'nin kararıyla bu aşamada öncelik arayüz
  iskeleti. İki kalbin (§6, §7) ve aradaki döngünün (§8) ekranda
  görünmesi gerekiyordu; önceki v2'de Bağlan yoktu ve her kart
  "hazırlanıyor" bildirimine çıkıyordu.
- **Etkilediği alanlar:** `v2/` klasör yapısı (her sayfa kendi
  klasöründe), `v2/css/`, `v2/js/`, `tests/v2.test.js` (artık tüm
  sayfaları tarıyor). §15'teki hedef yapı uygulandı; `components/`
  klasörü yerine bileşenler `js/cards.js` ve `js/shell.js`'te fonksiyon.
- **Teknik sonuç:** Derleme yok, ES modülleri; GitHub Pages'te olduğu
  gibi çalışıyor. Yeni sayfalar veriyi yalnızca `js/api.js`'ten okuyor
  (kural 6); ürün adresi `urun/?id=<slug>`, backend'in `content.slug`
  alanına karşılık geliyor. Framework kararı hâlâ verilmedi (kural 7).
- **UX sonucu:** Kart dokununca ürün sayfası açılıyor; arama ve "Tümü"
  bağları listeye gidiyor. Paylaşımlar bağlı oldukları ürünü puan ve
  fiyatla gösteriyor ("Mola360 ile gitti" rozeti yalnızca deneyimi
  Mola360'tan yaşayanlarda). Ödeme, giriş, paylaşım oluşturma henüz
  "hazırlanıyor".

### 2026-10-03 — Keşfet sadeleşti: görsel ağırlıklı kart, 6 bölüm

- **Karar:** Ürün kartı görsel ağırlıklı oldu: görselin üstünde tür,
  favori, ad, yer · süre, puan ve fiyat. Tarihler, vize, ulaşım ve
  üyelik rozeti yalnızca ürün sayfasında. Keşfet 14 bölümden 6'ya indi:
  arama, "Ne kadar molan var?", Bağlan önizlemesi, "Bu hafta sonu için"
  (Oteller · Mekânlar · Yurt dışı), etkinlikler, temalar. Güven şeridi
  ve popüler aramalar kaldırıldı; "Planlarken yanındayız" kutusu ürün
  sayfasına taşındı.
- **Neden:** Bedir İnci Keşfet'i kalabalık buldu ve kart için "görsel
  ağırlıklı" seçeneği seçti. Kalabalığı hem kartlardaki bilgi yükü hem
  de bölüm sayısı yaratıyordu; keşif ekranı görselle karar verdirmeli
  (§6), ayrıntı ürün sayfasında.
- **Etkilediği alanlar:** `v2/index.html`, `v2/js/kesfet.js`,
  `v2/js/cards.js`, `v2/js/help.js`, `v2/js/urun.js`, `v2/css/` (eski
  kart ve kullanılmayan kurallar silindi).
- **Teknik sonuç:** Liste, favoriler ve benzer deneyimler aynı kartı
  kullanıyor. Yardım kutusu `renderHelp()` ile ürün sayfasına
  ekleniyor. Yurt dışı rayı `api.js`'teki `abroad` alanından süzülüyor.
- **UX sonucu:** Keşfet yaklaşık yarı boyuna indi; kartta en fazla iki
  satır metin ve tek fiyat var. Karar için gereken ayrıntı (tarih, vize,
  arama, WhatsApp) ürün sayfasında, "Tarih seç" düğmesinin yanında.

### 2026-10-03 — Keşfet tamamlandı: kiminle filtresi, kaldığın yerden, tema listeleri

- **Karar:** Keşfet'e "Kiminle?" filtresi (Çiftler · Arkadaşlarla ·
  Çocuklu) "Ne kadar molan var?" ile birlikte çalışacak şekilde eklendi;
  aynı filtre listede de var. Daha önce ürüne bakan kullanıcıya en üstte
  küçük kartlı "Kaldığın yerden" rayı çıkıyor. Tema kartları artık kendi
  listesine gidiyor (`liste/?tema=`). "Ailece" teması kaldırıldı, çünkü
  artık bir filtre. Keşfet veriyi yalnızca `api.js`'ten okuyor.
- **Neden:** Bedir İnci Keşfet'in yeterli olup olmadığını sordu;
  değerlendirmede §6.1'deki keşif filtrelerinin (Çiftler, Arkadaşlarla,
  Çocuklu) eksik olduğu, geri dönen kullanıcıya bir şey sunulmadığı,
  temaların "hazırlanıyor"a çıktığı ve Keşfet'in kural 6'ya uymadığı
  görüldü. Bedir önce Keşfet'in tamamlanmasını, sonra rezervasyon akışını
  seçti.
- **Etkilediği alanlar:** `v2/index.html`, `v2/js/kesfet.js`,
  `v2/js/liste.js`, `v2/js/urun.js` (bakılan ürünü kaydeder),
  `v2/js/api.js` (`listEvents`, `listThemes`, `getTheme`, `listRecent`,
  `markViewed`, `clearRecent`; `listProducts` artık `kimle` ve `tema`
  alıyor), `v2/js/data.js` (ÖRNEK kiminle ve tema eşlemeleri; kullanılmayan
  popüler aramalar silindi), `v2/css/kesfet.css`.
- **Teknik sonuç:** Kategori, filtre ve tema ayrı adres parametreleri
  (kural 3). Son bakılanlar yalnızca bu cihazda tutuluyor (`m360-son`, en
  fazla 12). Backend gelince kullanıcı geçmişinden okunacak.
- **UX sonucu:** Yeni kullanıcı aynı sade Keşfet'i görüyor. Geri dönen
  kullanıcı baktığı ürüne tek dokunuşla dönüyor ve listeyi "Temizle" ile
  silebiliyor. Süre ve kiminle seçilince sayılar ve ray birlikte
  daralıyor; "Tümü" iki filtreyi de listeye taşıyor. Sahte sayı ya da
  sıkıştırma yok; sayılar gerçek (örnek) katalogdan sayılıyor.

### 2026-10-03 — Rezervasyon akışının arayüzü

- **Karar:** Ürün sayfasındaki "Devam et" / "Rezervasyon yap" artık
  `rezervasyon/?id=` sayfasına gidiyor. Akış üç adım ve bir onay ekranı:
  seçim (tarih, saat, seçenek, adet, turda %20 kapora ya da tam ödeme),
  iletişim bilgileri, özet + fiyat dökümü + iptal + ödeme. Ödeme
  altyapısı gelene kadar kart bilgisi istenmiyor ve ödeme alınmıyor;
  rezervasyon "TASLAK" olarak yalnızca bu cihazda tutuluyor ve
  Rezervasyonlar'da görünüyor.
- **Neden:** Bedir İnci Keşfet'ten sonra rezervasyon akışını seçti.
  Keşif → rezervasyon → deneyim → paylaşım döngüsünün (§8, §13) en büyük
  boşluğu buydu; ürün sayfası "hazırlanıyor" bildiriminde bitiyordu.
- **Etkilediği alanlar:** yeni `v2/rezervasyon/` ve `v2/js/rezervasyon.js`;
  `v2/js/api.js` (`bookingSpec`, `createBooking`, `listBookings`,
  `cancelBooking`), `v2/js/urun.js`, `v2/js/rezervasyonlar.js`,
  `v2/css/sayfalar.css`.
- **Teknik sonuç:** Türüne göre kurallar tek yerde (`bookingSpec`): tur
  kalkış tarihleri ve kapora, otelde oda, etkinlikte bilet, aktivite ve
  mekânda saat, min. harcamalı mekânda alan. Kapora oranı, iptal süreleri,
  saatler ve adet sınırları ÖRNEK KURAL; v2'nin kuralları yazılınca bu
  fonksiyon değişecek. Adımlar tarayıcı geçmişine yazılıyor, geri tuşu
  önceki adıma dönüyor.
- **UX sonucu:** Toplam ilk adımdan son adıma aynı; hizmet bedeli 0 TL ve
  "sonradan eklenen ücret yok" açıkça yazıyor (§20). Sözleşme onayı
  işaretsiz geliyor. Onay ekranı kullanıcıyı Rezervasyonlar'a ve
  döndükten sonra paylaşmaya yönlendiriyor; "Birlikte gideceklere gönder"
  ile deneyim paylaşılabiliyor.

### 2026-10-03 — Tasarım sistemi ölçekleri bağlayıcı

- **Karar:** Yazı boyutu 8 adımlı bir ölçekte (`--fs-xs` 11px …
  `--fs-3xl` 30px), köşe yuvarlaklığı 6 adımda (`--r-xs` … `--r-pill`).
  Boşluk, gölge ve hareket de token oldu. v2'de bu değerler ham px ile
  yazılmıyor; `tests/v2.test.js` yakalıyor. Liste ve favorilerde kart
  yatay ve sık; raylardaki ilerleme çubukları kalktı; dokunma ve fareyle
  üstüne gelme tepkileri eklendi.
- **Neden:** Bedir İnci arayüz kalitesinin yükseltilmesini istedi.
  İncelemede CSS'te 24 farklı yazı boyutu ve 13 farklı köşe değeri
  çıktı; göz bunu düzensizlik olarak okuyordu. Liste sayfasında 15 turu
  görmek beş ekran kaydırma istiyordu. Tasarım sistemi önce yapıldı,
  çünkü sıradaki işler (gerçek etkileşimler, masaüstü düzeni) aynı
  ölçekleri kullanacak.
- **Etkilediği alanlar:** `v2/css/` (hepsi), `v2/js/ui.js` (ilerleme
  çubuğu kodu silindi), `v2/index.html`, `tests/v2.test.js`.
- **Teknik sonuç:** Yeni stil yazan herkes token kullanır; ölçek
  değişecekse yalnızca `tokens.css` değişir. Hareketler
  `prefers-reduced-motion` ayarına uyuyor.
- **UX sonucu:** Başlık ve metin hiyerarşisi tutarlı. Kartlar basınca
  hafifçe çöküyor, böylece dokunuşun alındığı görülüyor. Liste bir
  ekranda iki kat fazla deneyim gösteriyor. Görsel solda, karşılaştırma
  bilgisi sağda.

### 2026-10-03 — Arama çalışıyor, ürün sayfası içerikle doldu

- **Karar:** Keşfet'teki arama kutusunun üç alanı da alttan açılan bir
  çekmece. "Nereye" yazdıkça yer ve deneyim önerir (yer adı, ilçe ya da
  bölgeyle; Türkçe harf farkı yok sayılır), boşken son aramaları ve o
  kategoride deneyimi olan yerleri sayısıyla gösterir. "Ne zaman" bu hafta
  sonu, gelecek hafta sonu, ekim, kasım ya da esnek; her seçeneğin yanında
  kaç deneyim olduğu yazar. "Kaç kişi" sekmeye göre yetişkin ve çocuk, oda
  ya da bilet sayar; otelde odaya sığmayan yetişkin için oda kendiliğinden
  artar. Arama listeye `yer`, `ara` ve `tarih` parametreleriyle gider; tarih
  ve kişi sayısı sekme açık kaldıkça ürün sayfasına (tarih hazır seçili)
  ve rezervasyona (adet hazır) taşınır. Ürün sayfasındaki iskelet çizgiler
  yerine açıklama, program, dahil/hariç, buluşma noktası, bilmen
  gerekenler ve örnek değerlendirmeler geldi; iptal kutusu seçilen tarihe
  göre son ücretsiz iptal gününü yazıyor, süre dolduysa bunu açıkça
  söylüyor.
- **Neden:** Bedir İnci arayüz kalitesinin yükseltilmesini istedi;
  tasarım sisteminden sonra sıradaki paket olarak önerilen "gerçek
  etkileşimler" için "devam et" dedi. İncelemede arama alanları dokununca hiçbir şey yapmıyor,
  ürün sayfası en çok merak edilen bilgiler (ne dahil, nerede buluşuyoruz)
  yerine gri çizgiler gösteriyordu. Kullanıcı yolculuğunun değerlendirme
  aşaması (§9) bu bilgilerle karar veriyor.
- **Etkilediği alanlar:** `v2/js/arama.js` (yeni), `v2/js/icerik.js`
  (yeni, ÖRNEK içerik), `v2/js/api.js` (yerler, öneri, tarih penceresi,
  iptal günü, ürün içeriği, arama durumu), `v2/js/data.js` (`DESTS`,
  `WHEN`), `v2/js/liste.js`, `v2/js/urun.js`, `v2/js/rezervasyon.js`,
  `v2/js/ui.js` (`makeSheet`), `v2/js/help.js`, `v2/css/`.
- **Teknik sonuç:** Kategori ≠ filtre korunuyor: tarih bir filtre, yer ve
  metin arama; kategori ayrı satırda. Tarihi olan ürün (tur kalkışı,
  etkinlik) pencereye düşmeli; otel, aktivite ve mekân her gün açık sayılıyor
  (ÖRNEK). Örnek takvim 1 Ekim 2026'da yaşıyor; backend gelince gerçek gün
  ve uygunluk `api.js`'in içinden gelecek. Çekmece davranışı tek yerde
  (`makeSheet`).
- **UX sonucu:** Arama artık bir karar aracı: kullanıcı yazmadan önce nerede
  ne olduğunu görüyor, sonuç vermeyecek seçimi baştan fark ediyor, bir
  kategoride bulamadığını diğer kategorilerde buluyor. Seçtiği tarih ve
  kişi sayısını bir daha girmiyor. İptal koşulu ödeme öncesinde tarihle
  birlikte netleşiyor; süresi geçmiş ücretsiz iptal gizlenmiyor (§20).

### 2026-10-03 — Yüzen alt menü, Planlarım ve Paylaş

- **Karar:** Alt menü dört sekmeli yüzen bir hap oldu: Keşfet · Bağlan ·
  Planlarım · Profil. Menüde arama yok; arama Keşfet'in en üstünde ve
  Keşfet'teyken Keşfet'e yeniden dokunmak sayfayı başa alıp aramayı
  açıyor. Menünün yanında yuvarlak bir **Paylaş** düğmesi var: Bağlan'a
  gerçek bir deneyime bağlı paylaşım ekliyor (fotoğraf/video, bağlı
  deneyim, kiminle, kısa not). Favoriler ve Rezervasyonlar, Planlarım'ın
  içinde Yaklaşan · Geçmiş · Favoriler sekmeleri oldu.
- **Neden:** Bedir İnci 2026'nın son çeyreğindeki alt menü eğilimlerini
  sordu ("Mantıklı. Hadi bunu yapalım"). Arama zaten Keşfet'in üstünde
  olduğu için menüde ikinci kez durması fazlalıktı. Döngünün en zayıf
  halkası "yaşa → paylaş" adımıydı; düğme onu her sayfada elin altına
  getiriyor.
- **Etkilediği alanlar:** `v2/js/shell.js` (alt menü, kaydırınca küçülme,
  Paylaş giriş noktaları), `v2/js/paylas.js` (yeni), `v2/js/planlarim.js`
  ve `v2/planlarim/` (yeni), `v2/js/api.js` (`ME`, `listPastBookings`,
  `createPost`, `listMyPosts`), `v2/js/cards.js`, `v2/js/baglan.js`,
  `v2/css/components.css`. Eski `favoriler/` ve `rezervasyonlar/`
  adresleri Planlarım'a yönleniyor.
- **Teknik sonuç:** Paylaşım çekmecesi ilk dokunuşta yükleniyor ve her
  sayfadan açılabiliyor: menüdeki düğme, `data-paylas="ürün id"` taşıyan
  öğe ya da adresteki `?paylas=ürün id`. Taslakta paylaşım yalnızca bu
  cihazda (localStorage `m360-paylas`, küçültülmüş önizlemeyle) tutuluyor;
  backend gelince yükleme `api.js`'in içinden değişecek.
- **UX sonucu:** İçerik ekranın tamamını kullanıyor: aşağı kaydırınca menü
  yalnızca ikonlara iniyor, yukarı kaydırınca geri geliyor. "Mola360 ile
  gitti" rozeti yalnızca Mola360'tan rezerve edip yaşanmış deneyime
  bağlanan paylaşımda çıkıyor; başka bir deneyime bağlanan paylaşım
  rozetsiz (dark pattern yok, §20). Geçmiş rezervasyondaki "Paylaş"
  çekmeceyi o deneyim seçili açıyor.
