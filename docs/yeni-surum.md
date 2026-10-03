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
   filtre keşif kriteri (Bu hafta sonu, Yakınımda, Çiftler …). İkisi aynı
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
| Keşfet | `v2/` | Arama, "Kaldığın yerden" (yalnızca daha önce ürüne bakıldıysa), "Ne kadar molan var?" + "Kiminle?", Bağlan önizlemesi, "Bu hafta sonu için" (otel · mekân · yurt dışı), etkinlikler, temalar |
| Bağlan | `v2/baglan/` | Paylaşım akışı; her paylaşım bağlı olduğu ürünle |
| Ürün | `v2/urun/?id=<slug>` | Tek şablon: görsel, tarih seçimi, iptal ve ödeme, değerlendirme, "Bu deneyimi yaşayanlar" |
| Liste | `v2/liste/?tur=otel&sure=hs&kimle=cift&tema=doga` | Kategori satırı (`tur`), filtre satırı (`sure`, `kimle`) ve tema (`tema`) ayrı parametreler |
| Favoriler | `v2/favoriler/` | Kalple saklananlar, boş durum |
| Rezervasyonlar | `v2/rezervasyonlar/` | Yaklaşan ve geçmiş; geçmişte "Deneyimini paylaş" |
| Profil | `v2/profil/` | Kimlik, sayılar, Molapuan, paylaşımlar ve deneyimler |

Kod düzeni:

- `css/tokens.css` (tasarım tokenları), `base.css`, `components.css`
  (ortak bileşenler), `kesfet.css` (anasayfa), `sayfalar.css` (alt sayfalar).
- `js/shell.js`: her sayfada aynı olan alt menü, tam ekran menü, bildirim.
- `js/api.js`: bütün sayfaların okuduğu tek veri katmanı (ürünler,
  etkinlikler, temalar, paylaşımlar, son bakılanlar). Bugün `js/data.js`
  içindeki ÖRNEK veriyi tek ürün şekline çeviriyor; ürün kimliği addan
  türeyen `slug`. Backend gelince yalnızca içi değişecek.
- `js/cards.js`: görsel ağırlıklı ürün kartı (görsel, tür, ad, yer · süre, puan, fiyat; tarih, vize, ulaşım ürün sayfasında), paylaşım kartı, paylaşıma bağlı ürün.
- Her sayfanın kendi modülü: `kesfet.js`, `baglan.js`, `urun.js` …

Notlar:

- Veriler ÖRNEK ve sayfalarda öyle işaretli: ürün adları ve fiyatlar örnek
  katalogdan; kalkış tarihleri, etkinlik saatleri, yurt dışı turları,
  paylaşımlar, kullanıcılar ve rezervasyonlar uydurma.
- Favoriler ve son bakılanlar yalnızca tarayıcıda (`localStorage`,
  `m360-fav`, `m360-son`). "Kaldığın yerden" bölümündeki "Temizle" son
  bakılanları siler.
- Hangi ürünün kime uygun olduğu (çiftler, arkadaşlarla, çocuklu) ve hangi
  temada olduğu ÖRNEK; gerçekte işletme bilgisinden ve değerlendirmelerden
  gelecek.
- Beğen, takip et, kaydet yalnızca ekranda değişir; kaydedilmez.
- Molapuan ve seviye indirimi ÖNERİ kurallarıyla gösteriliyor: 100 TL = 1
  puan, 1 puan = 1 TL, Kâşif %10, Mola Ustası %15.
- Keşfet'in altındaki "Görünüm: Misafir / Gezgin / Kâşif" düğmeleri
  önizleme içindir.

## Sıradaki adımlar

1. Tasarım sistemi: tokenları tamamlamak (tip ölçeği, boşluk ölçeği) ve
   bileşenleri tek bir vitrin sayfasında toplamak.
2. Tarih/kişi seçimi → ödeme akışı; giriş ve kayıt; paylaşım oluşturma.
3. Kalan filtreler: "Yakınımda" (konum izni) ve fiyat aralığı; sıralama.
4. v2'nin kurallarını yazmak (ürün, fiyat, puan, seviye, iptal).
5. Masaüstü düzeni.
