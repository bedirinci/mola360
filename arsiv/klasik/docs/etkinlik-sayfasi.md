# Etkinlik içerik sayfası (`/etkinlik/<slug>/`)

Anasayfadaki "Popüler Etkinlikler" şeridi bir listeydi; tıklanacak sayfa
yoktu. Bu belge sayfanın nasıl kurulduğunu ve diğer üç içerik türünden
nerede ayrıldığını yazıyor. Ortak kararlar `docs/tur-sayfasi.md`,
`docs/otel-sayfasi.md` ve `docs/aktivite-sayfasi.md` içinde.

## Dosyalar ve sorumlulukları

| Dosya | Ne yapar |
|---|---|
| `etkinlik/<slug>/index.html` | İskelet, statik SEO bilgisi, bölüm kapları, `BreadcrumbList` |
| `assets/js/event-data.js` | Etkinlik kayıtları + saf hesaplar (temsil, bilet, hizmet bedeli) |
| `assets/js/event-page.js` | Veriyi işaretlemeye çevirir, etkileşimleri bağlar |
| `assets/css/event.css` | Temsil satırları, bilet kategorisi kartları, yağmur kutusu, sezon paneli |
| `tests/event.test.js` | Saf fonksiyonlar + sayfanın kendi kaydıyla tutarlılığı |

## Etkinliği ayıran şey: sabit tarihler

| | tur | otel | aktivite | **etkinlik** |
|---|---|---|---|---|
| Zaman | haftanın belirli günleri | her gün açık | her sabah | **sayılı temsil, biter** |
| Ne seçilir | tarih + kişi | tarih aralığı + oda + pansiyon | tarih + seans + paket + kişi | **temsil + blok + bilet** |
| Fiyat birimi | kişi başı | oda başı gecelik | kişi başı | bilet başı |

Bu fark üç somut davranış doğuruyor:

**1. Tarih çipleri takvimden değil temsil listesinden geliyor.** Boş bir
takvim göstermek, satılmayan geceleri satılıyor gibi gösterirdi. Çipte
tarihin yanında **eserin adı** da var: aynı festivalin iki gecesi farklı
yapıt, tarih tek başına seçtirmiyor.

**2. Sezon bitince etkinlik anasayfada görünmüyor.** `catalog.js` kart
üreticisi `null` döndürüyor ve katalog o kaydı atlıyor. Geçmiş bir
festivali "yaklaşan" diye kartta tutmak, elle yazılmış kartların düştüğü
tuzağın ta kendisi olurdu (`docs/icerik-katalogu.md`).

**3. Sayfa da sezon bittiğini söylüyor.** Bilet kartının yerini "Bu
sezonun programı tamamlandı" paneli alıyor. Satın alınamayan bir forma
bakmak "tükendi mi, bozuk mu" sorusunu doğuruyordu.

**Etkinlik "Yaklaşan Planlar" şeridine giriyor** — otel ve aktivite
girmiyor. O şerit türü değil zamanı gösteriyor; sayılı temsili olan tek
tür bu.

## Temsil takvimi

Geçmiş temsiller listede **duruyor ama soluk ve seçilemez**: "bu festival
neler oynadı" bilgisi sayfanın değeri, ama satın alınabilir gibi
durmamalı. Fark renkle değil doygunlukla veriliyor; kırmızı bir "geçti"
rozeti hata gibi okunuyordu.

Bugünün temsili hâlâ yaklaşan sayılıyor: gösteri akşam 20:30'da, sabah
bakan biri için gün geçmiş değil.

Satırlar klavyeyle de seçilebiliyor (`role="button"`, Enter/Space) ve
odak halkası duruyor.

## Fiyat kuralları

| Kalem | Kural |
|---|---|
| Tam bilet | seçilen bloğun fiyatı |
| Öğrenci | bloğun **kendi** öğrenci tarifesi |
| Hizmet bedeli | **bilet başına**, ayrı satır |
| Ek hizmet | bir kez (`booking`) ya da bilet başına (`ticket`) |

**Öğrenci bileti her blokta satılmıyor.** Locada öğrenci tarifesi yok;
o blok seçildiğinde sayaç sıfırlanıyor, satır soluklaşıyor ve nedeni
altında yazıyor ("Loca için öğrenci tarifesi yok"). Kural veride
(`categories[].student`), kodda değil.

**Hizmet bedeli neden ayrı satır.** Biletlemede fatura üzerinde ayrı
gösteriliyor; fiyatın içine gizlenirse ilan edilen fiyat ile ödenen
tutar ayrışıyor. Otelin konaklama vergisiyle aynı gerekçe. Aktivitede
böyle bir kalem yok — üç sayfanın farkı bilinçli ve testli.

## Yağmur: iptal değil aktarım

Etkinlikte de hava koşulunun kendi kutusu var (`.etk-hava`), iade
tablosundan **önce**. Ama sonucu aktivitedekinden farklı:

| | aktivite (balon) | etkinlik (festival) |
|---|---|---|
| Hava uygun değilse | uçulmaz, **koşulsuz tam iade** | temsil **yeni tarihe aktarılır**, gelemeyene tam iade |

İkisi de kendi kaydından okunuyor; kodda sabit bir kural yok. Tablonun
içine konsaydı "son 24 saat: iade yok" satırının yanında durur ve ayrı
bir kural olduğu kaybolurdu.

## Anasayfa bağlantısı

Kart elle yazılmıyor. Daha önce **iki** şeritte iki ayrı elle yazılmış
Aspendos kartı vardı ve ikisi de aynı veriden kopyalanmıştı; ikisinde de
sabit bir tarih (`26 Eylül, Cumartesi` / `Bu Cumartesi`) duruyordu.
İkisi de kaldırıldı; katalog kaydı görüp her iki şeride de kendisi
koyuyor ve tarih temsil takviminden geliyor.

Kart puanı ve yorum sayısı da kayıttan türetiliyor. Dağılım, anasayfada
uzun süredir yazan 4,9 / "180+" değerlerini verecek şekilde yazıldı;
artık iki yerde iki sayı tutulmuyor.

## Yapısal veri

Yalnızca `BreadcrumbList`. `Event`, `Offer`, `AggregateRating` ve
`startDate` **bilerek yok**: içerik örnek olduğu sürece uydurma fiyat ve
puanı işaretlemek yanıltıcı (`docs/seo-arastirma.md`, madde 2), temsil
tarihleri de kurgusal olduğu için `Event.startDate` işaretlemek arama
sonuçlarında **olmayan bir gösteriyi duyurmak** olurdu. Test bu dördünü
birden yasaklıyor.

## Ölçülenler

Chromium, dış ağ kesik (390×844 ve 1440×900):

- Dokuz bölüm kabının hepsi dolu, menüde yedi sekme, altı temsil satırı,
  dört bilet kategorisi kartı.
- Künye "Sıradaki temsil 26 Eylül Cumartesi · 20:30" yazıyor; tarih
  çiplerinde eser adları görünüyor (Carmen, Kuğu Gölü, Aida…).
- Loca seçilince öğrenci satırı soluklaşıyor ve "Loca için öğrenci
  tarifesi yok" yazıyor.
- 10 Ekim temsili seçilince not "Aida · Opera · 20:30 · Kapılar 19:00'da
  açılır" oluyor.
- 2 loca bileti: **2.990 TL** = 2×1.450 + 2×45 hizmet bedeli.
- Bilet özeti açıkken gövde `fixed`, Escape'te `relative`; yatay taşma
  ve konsol hatası yok.
- Anasayfada kart **iki şeritte de** "Bu Cumartesi" ve 420 TL ile
  çıkıyor; mobil dokunuşta sayfa açılıyor.

## Bu işte yakalanan hata

Aktivite turunda katalog yardımcıları `globalThis` üzerinden aranır hâle
gelmişti. Ama `const` ile tanımlanmış bir ad **globalThis'te durmaz**
(yalnızca `function` bildirimleri durur): `GUNLER_TR` bulunamayınca
anasayfadaki kart **"Bu undefined"** yazdı. Node tarafında adlar
modülden geldiği için testler bunu görmedi.

Çözüm, `typeof` ile korunmuş doğrudan ad: tanımsız bir ad için `typeof`
hata atmaz, yani hem eksik dosya çökmesi hem `const` görünmezliği
kapanıyor. `tests/katalog.test.js` artık dosyaları `node:vm` ile **tek
kapsamda** çalıştırıp (tarayıcıdaki klasik `<script>` etiketleri gibi)
gün adının çözüldüğünü ölçüyor; mutasyonla doğrulandı.

## Bilerek yapılmayanlar

- **Salon planı (koltuk seçimi) yok.** Blok seçiliyor, koltuk numarası
  e-bilette veriliyor. Gerçek koltuk haritası envanter bağlanmadan
  anlamsız.
- **Takvim/ICS çıktısı yok.** Gerçek tarihler bağlandığında eklenecek
  ilk şeylerden biri.
- **İkinci etkinlik sayfası yok.** `EVENTS`'e kayıt eklemek ve
  `etkinlik/<slug>/index.html` yazmak yeterli.
