# Yeni mola360 (/v2/)

https://bedirinci.github.io/mola360/v2/

Mola360 v2 olarak devam ediyor. Klasik site `arsiv/klasik/` altında,
yayında değil; kök adres `v2/`'ye yönlendiriyor.

## Bağlayıcı kurallar

v2'de yapılan her iş bu kurallara uyar. Kaynakları:
[`docs/PROJE.md`](PROJE.md) (tek kaynak) ve [`docs/VIZYON.md`](VIZYON.md).
Bir kural değişecekse önce PROJE.md değişir; karar, nedeni, etkilediği
alanlar, teknik ve UX sonucuyla PROJE.md'nin **Karar kaydı**na yazılır.

1. **Merkez deneyim.** Mola360 bir rezervasyon sitesi, biletleme
   platformu ya da sosyal medya kopyası değil; bu üçünün kesişiminde bir
   sosyal keşif platformu. Ekranlar "Neyi satın alabilirsin?" değil,
   "Bu hafta sonu ne yapabilirim?" sorusundan yola çıkar.
2. **İki kalp: Keşfet ve Bağlan.** Keşfet ticari taraf (tur, etkinlik,
   aktivite, otel, mekân). Bağlan sosyal taraf; paylaşım Mola360'daki
   gerçek bir ürüne bağlanabilir. Yeni bir ekran ya da veri alanı bu iki
   alandan birine ve aralarındaki döngüye hizmet eder.
3. **Kategori ≠ filtre.** Kategori ürünün ne olduğu (Tur, Otel …),
   filtre keşif kriteri (Bu hafta sonu, Yakınımda, Sevgilimle …). İkisi aynı
   bileşende, aynı veri alanında karıştırılmaz.
4. **Dark pattern yok.** Yanlış kıtlık, sahte sayaç, sahte bildirim,
   gizli ücret gösterilmez. Stok, uygunluk, değerlendirme, sosyal kanıt
   ve kampanya süresi gerçek veriden gelir. Örnek veri ÖRNEK diye
   işaretlenir.
5. **Kendi tasarım dili.** Unilayk yalnızca referans: rengi, logosu,
   bileşenleri kopyalanmaz. Tasarım sistemi (renk, tipografi, boşluk,
   köşe, gölge ve bileşenler) tokenlarla tanımlanır (PROJE.md §14).
6. **Önce arayüz.** Bu aşamada iş v2'nin arayüzünü (frontend) bitirmek.
   Backend korunuyor ama arayüz ondan beklemez: veri, ileride yalnızca
   içi değişecek tek bir veri katmanından okunur.
7. **Framework kararı analizsiz verilmez.** Prototip başka bir
   framework'e taşınmadan önce mimari analizi yapılır (PROJE.md §15).
8. **Klasik site yalnızca başvuru kaynağı.** v2 arşivdeki kodu, veriyi,
   stilleri yüklemez, kopyalamaz, onlara bağ vermez. Arşivdeki kurallar
   (fiyat, kontenjan, iptal: `arsiv/klasik/docs/veri-sozlesmesi.md`)
   okunup v2'nin kendi kuralı olarak yeniden yazılabilir.

Otomatik kontroller `tests/v2.test.js`'te.
- Yeni sitede henüz yapılmamış sayfalara giden bağlar `#yakinda`;
  dokununca "Bu sayfa yeni mola360'ta hazırlanıyor" bildirimi çıkar.
  Sayfa yapıldıkça bağ gerçek adrese döner.
- Yayına hazır olana kadar `noindex`.
- `main` → GitHub Pages ile yayınlanıyor.

## Şu an ne var

v2 çok sayfalı bir arayüz iskeleti. Her sayfa kendi klasöründe, derleme
yok; GitHub Pages'te olduğu gibi çalışır (yerelde `npm run dev`).

| Sayfa | Adres | Ne var |
|---|---|---|
| Keşfet | `v2/` | Arama (nereye: yazdıkça yer ve deneyim önerisi, son aramalar; ne zaman; kaç kişi), "Kaldığın yerden" (yalnızca daha önce ürüne bakıldıysa), "Ne kadar molan var?" + "Kiminle?", "Yakınımda ne var?" (konum ya da şehir), Bağlan önizlemesi, "Bu hafta sonu için" (bütün kategoriler), "Bu hafta sahnede" (7 günün etkinlikleri), temalar. Süre ve kiminle seçimini hatırlar; kiminle aramaya biner (formda kaldırılabilir çip, kişi sayısının başlangıcı, listede `kimle`), yakındaki yer "Nereye?"nin başında önerilir. Bölümlerin sırası sabit; içlerindeki deneyimler kiminle seçimine ve yakınlığa göre sıralanır |
| Bağlan | `v2/baglan/` | Paylaşım akışı; her paylaşım bağlı olduğu ürünle |
| Ürün | `v2/urun/?id=<slug>` | Tek şablon: görsel, tarih seçimi, hakkında, program, dahil/hariç, buluşma noktası ve bilmen gerekenler, iptal (seçilen tarihe göre son ücretsiz iptal günü) ve ödeme, değerlendirme, "Bu deneyimi yaşayanlar" (`#paylasimlar`) |
| Rezervasyon | `v2/rezervasyon/?id=<slug>&tarih=` | Seçim (tarih, saat, seçenek, adet, kapora) → iletişim bilgileri → özet, iptal ve ödeme → onay. Taslakta ödeme alınmaz, kart bilgisi istenmez |
| Liste | `v2/liste/?tur=otel&yer=kapadokya&tarih=bu-hs&sure=hs&kimle=sevgili&tema=doga` | Kategori satırı (`tur`), arama (`yer` ya da `ara`), filtre satırı (`tarih`, `sure`, `kimle`) ve tema (`tema`) ayrı parametreler; aramadan gelen seçimler filtre satırının başında, dokununca kalkar. `tema` seçiliyse sayfa temanın vitrini: kapak, iki cümlelik giriş, yalnızca temada olan kategoriler, temanın sırasıyla deneyimler ve araya "Bu temada paylaşılanlar" |
| Favoriler | `v2/favoriler/` | Kalple saklananlar, boş durum |
| Rezervasyonlar | `v2/rezervasyonlar/` | Yaklaşan (akıştan yapılan taslak rezervasyonlar en üstte) ve geçmiş; geçmişte "Deneyimini paylaş" |
| Profil | `v2/profil/` | Kimlik, sayılar, Molapuan, paylaşımlar ve deneyimler |

Kod düzeni:

- `css/tokens.css` (tasarım tokenları: renk, 8 adımlı yazı ölçeği
  `--fs-*` ve ekranla küçülen bölüm başlıkları `--fs-h2`, `--fs-h3`, köşe `--r-*`, boşluk `--s-*`, gölge, hareket). Yazı boyutu ve
  köşe için ham px yalnızca burada; test başka yerde yakalar.
- `base.css`, `components.css`
  (ortak bileşenler), `kesfet.css` (anasayfa), `sayfalar.css` (alt sayfalar).
- `js/shell.js`: her sayfada aynı olan alt menü, tam ekran menü, bildirim.
- `js/api.js`: bütün sayfaların okuduğu tek veri katmanı (ürünler,
  etkinlikler, temalar, yerler, arama önerileri, tarih penceresi,
  paylaşımlar, son bakılanlar, ürün içeriği). Bugün `js/data.js`
  içindeki ÖRNEK veriyi tek ürün şekline çeviriyor; ürün kimliği addan
  türeyen `slug`. Backend gelince yalnızca içi değişecek.
- `js/molapuan.js`: Molapuan kartı (ince yatay kart; puan, seviye rozeti, sıradaki hedef, açılıp kapanan seviye yolu). Keşfet'te arama kartının altında, Profil'de üstte. Veri `api.getPoints(level)`.
- `js/cards.js`: görsel ağırlıklı ürün kartı (görsel, tür, ad, yer · süre, puan, fiyat; tarih, vize, ulaşım ürün sayfasında; listede yatay; deneyimin paylaşımı varsa "N paylaşım", ürün sayfasındaki paylaşımlara gider), "Kaldığın yerden" kartı, bilet, paylaşım kartı, paylaşımdaki deneyim.
- `js/icerik.js`: ürün sayfasının ÖRNEK içeriği (açıklama, program,
  dahil/hariç, buluşma noktası, örnek değerlendirmeler); sayfalar
  `api.js` üzerinden okur.
- `js/arama.js`: Keşfet'teki arama çekmeceleri. Çekmece davranışı
  (odak, Esc, aşağı çekip kapatma) `ui.js`'teki `makeSheet`'te; yardım
  kutusunun saat çekmecesi de onu kullanıyor.
- Her sayfanın kendi modülü: `kesfet.js`, `baglan.js`, `urun.js` …

Notlar:

- Veriler ÖRNEK ve sayfalarda öyle işaretli: ürün adları ve fiyatlar örnek
  katalogdan; kalkış tarihleri, etkinlik saatleri, yurt dışı turları,
  paylaşımlar, kullanıcılar ve rezervasyonlar uydurma.
- Favoriler, son bakılanlar, son aramalar, "Yakınımda" seçimi, Keşfet'teki
  süre ve kiminle seçimi ve taslak rezervasyonlar yalnızca tarayıcıda
  (`localStorage`, `m360-fav`, `m360-son`, `m360-aramalar`, `m360-yakin`,
  `m360-kesfet`, `m360-rez`). Konumun kendisi ve konumdan çıkan yer
  saklanmaz. Aramadaki tarih ve kişi sayısı sekme
  açık kaldıkça (`sessionStorage`, `m360-arama`) liste, ürün ve
  rezervasyon sayfalarına taşınır. İletişim bilgileri
  saklanmaz. "Kaldığın yerden" bölümündeki "Temizle" son
  bakılanları siler.
- Örnek takvim 1 Ekim 2026'da yaşıyor: "Bu hafta sonu" 2 – 4 Ekim, son
  ücretsiz iptal günü bu tarihe göre hesaplanıyor. Yerler (`DESTS`) ve
  ürün içeriği ÖRNEK.
- Hangi ürünün kime uygun olduğu (tek başıma, sevgilimle, arkadaşlarla,
  ailemle, çocuklarla, iş arkadaşlarımla), hangi temada olduğu ve
  yaklaşık konumu (`GEO`) ÖRNEK; gerçekte işletme bilgisinden ve
  değerlendirmelerden gelecek.
- Beğen, takip et, kaydet yalnızca ekranda değişir; kaydedilmez.
- Molapuan ve seviye indirimi ÖNERİ kurallarıyla gösteriliyor: 100 TL = 1
  puan, 1 puan = 1 TL, Kâşif %10, Mola Ustası %15. Seviye son 24 aydaki
  rezervasyon sayısıyla: Gezgin 1, Kâşif 3, Mola Ustası 6.
- Keşfet'in altındaki "Görünüm: Misafir / Gezgin / Kâşif" düğmeleri
  önizleme içindir.

## Fotoğraf kuralı

Kartlar, raylar ve ürün sayfası görseli tek bir `bg` değerinden okur:
fotoğraf varsa renk geçişinin üstüne biner, yoksa ya da yüklenemezse
geçiş görünür. Fotoğraf eklemek için dosya `v2/img/` altına konur ve
`js/data.js` içindeki `IMG` haritasına yazılır (ürün adı ya da
`tema:<id>` → dosya adı); paylaşımın fotoğrafı `POSTS` içinde `img`.

- **Oran ve boyut:** 4:5 dikey, en az 1200×1500 px; webp (olmazsa jpg),
  en çok 200 KB. Test boyutu ve dosyanın varlığını denetler.
- **Kırpma:** kartta 3:4, listede kare, ürün sayfasında geniş görünür;
  konu ortada durur, kenarlar kırpılabilir.
- **Okunurluk:** alt üçte bir sakin (gökyüzü, su, düz zemin); yazı oraya
  biner ve altına koyu bir geçiş konur. Fotoğrafta yazı, logo, filigran
  olmaz; yüzü tanınan kişi yalnızca izinle.
- **Doğruluk:** fotoğraf o deneyimin kendisini ya da gerçekleştiği yeri
  gösterir; başka bir yerin fotoğrafı kullanılmaz (kural 4).
- **Ad:** ürünün adresteki adı (`kapadokya-turu.webp`), tema için
  `tema-doga.webp`. Fotoğraf değişince yeni ad verilir (`-2`), çünkü
  dosyalar tarayıcıda önbelleğe alınır.
- **Lisans:** her dosyanın kaynağı, lisansı ve çekeni `v2/img/KAYNAK.md`
  içinde. Lisansı belirsiz fotoğraf eklenmez.

## Sıradaki adımlar

1. Gerçek fotoğraflar: kural ve altyapı hazır; kaynak (kendi çekimimiz ya
   da ücretsiz lisanslı stok) kararı bekleniyor.
2. Tasarım sistemi: bileşenleri tek bir vitrin sayfasında toplamak; koyu
   tema.
3. Gerçek ödeme (3D Secure) ve takvim; giriş ve kayıt; paylaşım oluşturma.
4. Kalan filtreler: listede "Yakınımda" ve fiyat aralığı; sıralama;
   aramada gerçek takvim (gün seçimi).
5. v2'nin kurallarını yazmak (ürün, fiyat, puan, seviye, iptal).
6. Masaüstü düzeni (bilerek en son; önce mobil).
