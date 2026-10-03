# Yönetim paneli (`/admin/`)

İçerik kayıtlarını — tur, otel, aktivite, etkinlik ve mekân — tek
ekrandan görmek, denetlemek ve düzenlemek için. Bu belge panelin ne
yaptığını, **neden böyle kurulduğunu** ve nelerin bilerek yapılmadığını
anlatıyor.

## Açmak

```bash
npm run dev
# http://localhost:8000/admin/
```

Varsayılan şifre: **`mola360`**. Panelden değiştirilebilir (Yardım ve
ayarlar → Panel şifresi); yeni şifrenin SHA-256 özeti tarayıcınızda
saklanır, şifrenin kendisi hiçbir yere yazılmaz.

**`admin/index.html`'i çift tıklayıp açmayın.** Anasayfada olduğu gibi
(bkz. README) `file://` ile açılan sayfa çalışmaz: panel şifreyi
doğrulamak için `crypto.subtle` kullanıyor ve tarayıcılar onu yalnızca
**güvenli bağlamda** (https veya localhost) çalıştırıyor. `npm run dev`
tam da bunu veriyor.

## Panelin tek sözü: kendi veri kopyasını tutmaz

Listede, kartta, denetimde görünen **her sayı** sitenin yayındaki veri
dosyalarından okunuyor:

```
tour-data.js ─┐
hotel-data.js ├─→ admin-data.js ─→ panel ekranları
activity-…    │        ↑
event-…       │        └── catalog.js (kart üretimi)
venue-data.js ┘
```

Fiyat `basePrice()` / `hotelNightlyFrom()` ile, puan `ratingSummary()` /
`hotelScore()` ile, kart `tourCatalogCard()` / `hotelCatalogCard()` ile
üretiliyor — yani **ziyaretçinin gördüğü kartla aynı fonksiyondan**.

Panel ayrı bir veri kopyası veya ayrı bir hesap tutsaydı, panelde görünen
ile sitede görünen kaçınılmaz olarak ayrışırdı. Bu tam olarak
`docs/icerik-katalogu.md`'de anlatılan "kart eskiyor" sorununun yönetim
tarafındaki hâli; aynı hatayı ikinci kez yapmamak için panel
**türetiyor, saklamıyor**.

`tests/admin.test.js` bunu ölçüyor: panelin fiyatı ile `basePrice()`
sonucu birbirinden ayrılırsa test düşer.

## Düzenleme neden doğrudan kaydetmiyor

Site **statik** olarak yayınlanıyor (GitHub Pages) ve arka ucu yok.
Tarayıcı depoya dosya yazamaz. Bu yüzden akış şöyle:

```
düzenle  →  taslak (tarayıcıda)  →  dışa aktar  →  veri dosyasına yapıştır
                                                →  npm test  →  commit  →  main
```

Taslak **kaydın kopyasını değil, yalnızca değişen yolları** tutuyor:

```js
{ 'title': 'Yeni ad', 'pricing.taxRate': 0.03 }
```

Neden: taslak kaydın kopyası olsaydı, veri dosyasında sonradan yapılan
bir düzeltme (bir yazım hatası, bir fiyat güncellemesi) taslak açıkken
kaybolurdu — taslağı uygulamak eski kopyayı geri yazardı. Yol/değer
tutunca yalnızca elle değiştirilen alan üzerine biniyor, kaydın geri
kalanı güncel kalıyor.

**Taslak tarayıcınızda duruyor, sitede değil.** Tarayıcı verisini
temizlerseniz bekleyen taslaklar kaybolur.

## Bölümler

| Bölüm | Ne yapar |
|---|---|
| **Panel** | Kayıt sayıları, içerik sağlığı, ortalama puan, fiyat aralığı, bekleyen taslak; yayını engelleyen hatalar en üstte |
| **İçerikler** | Beş türün tek listesi. Tür/bölge süzgeci, Türkçe'ye duyarlı arama, her sütundan sıralama |
| **Kayıt düzenleyici** | Künye · Anasayfa kartı · İçerik · Fiyat · SSS sekmeleri; sağda kartın **canlı önizlemesi** |
| **Anasayfa düzeni** | Hangi kaydın hangi şeride girdiği. Şeride giriş elle yapılmıyor, `catalog.js` yapıyor |
| **Medya** | Görsel anahtarları, nerede kullanıldıkları, hiç kullanılmayanlar |
| **Denetim** | İçerik bütünlüğü raporu (aşağıda) |
| **Taslaklar** | Bekleyen değişiklikler, toplu dışa aktarma |
| **Yeni kayıt** | Yeni bir içerik için iskelet + atlanmaması gereken adımlar |

### Düzenlenebilir alanlar

Form `admin-data.js` içindeki **şemadan** çiziliyor; `admin-page.js`
hiçbir alanı kendi eliyle yazmıyor. Bir alanı düzenlenebilir yapmak için
`ADMIN_ORTAK_ALANLAR` veya `ADMIN_TUR_ALANLARI` içine bir satır yeter —
form, taslak, fark ve dışa aktarma o satırı kendiliğinden tanır.
`tests/admin.test.js` şemadaki her yolun gerçek kayıtlarda karşılığı
olduğunu doğruluyor: ölü bir şema satırı formda sonsuza kadar boş bir
kutu çizer ve doldurulunca kayda alakasız bir alan ekler.

**Slug ve tür formda değiştirilemez.** Slug değiştirmek hem kayıt
anahtarını hem `<tür>/<slug>/` dizinini birlikte taşımayı gerektirir;
yarısı yapılırsa anasayfadaki kart ölü bağa gider. Bu yüzden depoda
yapılıyor.

## Denetim

Testlerin panel karşılığı: aynı hatayı CI'ya gitmeden, içeriği yazan
kişinin ekranında gösteriyor. Üç seviye var ve ayrımları bilinçli.

**Hata** — sitede görünür bir bozukluk üretir, yayına çıkmamalı:

| Kural | Sitede ne olur |
|---|---|
| Kayıt anahtarı ≠ `slug` | Kartın bağı ile sayfanın adresi farklı olur |
| Zorunlu alan boş (`title`, `tagline`, `category`, `area`, `code`) | Sayfada boşluk |
| `card.img` yok veya `cardImages`'te yok | Kart alakasız bir yedek fotoğrafa düşer |
| Galeri / benzer kart anahtarı görsel sözlüğünde yok | O kare boş gelir |
| Tanımsız ikon adı | İkon hiç çizilmez |
| Başlangıç fiyatı 0 | Kartta "0 TL" yazar |
| Liste fiyatı satış fiyatının altında | Üstü çizili fiyat daha ucuz görünür |
| Aynı ürün kodu iki kayıtta | — |
| İçerik sayfası açılmıyor | Kart anasayfada çıkar ama bağ ölüdür |

**Uyarı** — çalışır ama içerik ölçütünün altında kalır: az öne çıkan
madde, az SSS, az galeri fotoğrafı, az etiket, 90 karakteri geçen özet
cümle, dar karta sığmayan kart başlığı, %50'yi aşan indirim, gelecek
tarihli yorum.

**Bilgi** — dikkat çekmeye değer, yanlış değil: paragraf ortalamasının
üretken aramanın aldığı 130–170 kelimelik pasaj bandının altında kalması
(`docs/seo-arastirma.md`, madde 2), eskimiş yorum bölümü.

Paragraf uzunluğu bilerek **kayıt başına tek bilgi satırı** olarak
veriliyor. İlk sürüm her paragrafı ayrı uyarı yazıyordu; yedi kaydın
yirmi bir paragrafı da bandın altında olduğu için liste tek bir konudan
ibaret hâle geldi ve gerçek bir hata o yığının içinde görünmezdi.
Denetimin işe yaraması, **az ve ayırt edici** bulgu vermesine bağlı.

### Sayfa yoklaması

"Bağ ölü" kuralı, içerik sayfası adreslerinin gerçekten açılıp
açılmadığına bakıyor; panel bunu tarayıcıdan `HEAD` isteğiyle yokluyor.
Yoklama yapılamazsa (çevrimdışı, `file://`) kural **atlanıyor** ve panel
bunu ekranda söylüyor. Eksik bilgiyle "sayfa yok" demek, olmayan bir
hatayı bildirmekten kötüdür: yedi kaydın yedisi birden kırık görünürdü.

## Yeni kayıt

Panel iskeleti üretir, dosyaları **siz** oluşturursunuz:

1. `<tür>-data.js` içindeki kayıt nesnesine bloğu ekleyin.
2. `<tür>/<slug>/index.html` dizinini oluşturun (şablon sayfayı kopyalayıp
   başlık, açıklama ve canonical adresi değiştirin).
3. Şablondan kopyalanan içeriği değiştirin: açıklama, öne çıkanlar,
   galeri anahtarları, SSS ve yorumlar hâlâ şablon kaydına aittir.
4. `npm test` → commit.

**Anasayfaya ayrıca kart eklemeniz gerekmiyor**; `catalog.js` kaydı okuyup
ilgili şeride kendisi koyuyor (`docs/icerik-katalogu.md`).

## Kilit gerçek koruma değil

Panelin giriş ekranı bunu **ekranda yazıyor** ve bu bilerek böyle.

Site statik yayınlandığı için sunucu tarafında kimlik doğrulaması yok.
Şifre tarayıcıda, JavaScript içinde karşılaştırılıyor; kaynak kod açık,
özet de orada. Kilit yalnızca panelin **yanlışlıkla** açılmasını
engelliyor.

Bunu gizlemek, olmayan bir güvenliğe güvenilmesine yol açardı — asıl
tehlikeli olan bu. Panelde görünen bütün veriler zaten sitenin herkese
açık dosyalarından geliyor; şu hâliyle panel yeni bir bilgi sızdırmıyor.

**Gerçekten korunması gereken bir işlem** (rezervasyon görüntüleme,
ödeme, kullanıcı verisi) panele eklenmeden önce arka uç kimlik
doğrulaması şart. Sayfa ayrıca `noindex, nofollow` ile arama motorlarına
kapalı ve sitenin menüsünden bağlanmıyor.

## Arka uç geldiğinde ne değişir

Panel bu geçişe hazırlanarak yazıldı. Okuma ve denetim katmanı
(`adminKayitlar`, `adminDenetim`, `adminIstatistik`, `adminMedya`)
**olduğu gibi kalır**; değişmesi gereken yerler:

| Şimdi | Sonra |
|---|---|
| `adminTaslakUygula` + "dışa aktar" | Kaydı API'ye `PUT` |
| `localStorage` taslakları | Sunucuda taslak / sürüm geçmişi |
| Tarayıcıdaki şifre karşılaştırması | Sunucu tarafı oturum, rol ve yetki |
| Veri dosyalarından okuma | API'den okuma (aynı kayıt biçimiyle) |

## Dosyalar

| Dosya | Ne |
|---|---|
| `admin/index.html` | Panelin kabuğu; veri dosyalarını sitedeki sırayla yükler |
| `assets/js/admin-data.js` | Bütün mantık: kayıt toplama, süzme, istatistik, denetim, taslak, dışa aktarma |
| `assets/js/admin-page.js` | Ekran çizimi ve etkileşimler; burada hesap yok |
| `assets/css/admin.css` | Panelin görünümü (site kabuğundan ayrı, aynı renk değerleriyle) |
| `tests/admin.test.js` | Yukarıdaki sözlerin testleri |

`app.js` panelde **çalıştırılmıyor**: anasayfayı kuran yüzlerce satır DOM
işi panelde anlamsız ve kırılgan. Kart görselleri sözlüğü o dosyadan
**metin olarak** okunup ayrıştırılıyor — `tests/icerik.test.js` de aynı
yolu izliyor.
