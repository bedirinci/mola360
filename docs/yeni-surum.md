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

`v2/index.html`: Keşfet (anasayfa) ve tam ekran menü, tek dosya.

- Veriler sayfanın içinde ve ÖRNEK: ürün adları ve fiyatlar örnek
  katalogdan alındı; kalkış tarihleri, etkinlik saatleri ve yedi yurt
  dışı turu uydurma.
- Favoriler yalnızca tarayıcıda (`localStorage`, `m360-fav`).
- Molapuan ve seviye indirimi ÖNERİ kurallarıyla gösteriliyor: 100 TL = 1
  puan, 1 puan = 1 TL, Kâşif %10, Mola Ustası %15. v2'nin kuralları
  kesinleşince burada yazılacak.
- Alttaki "Görünüm: Misafir / Gezgin / Kâşif" düğmeleri önizleme içindir.

## Sıradaki adımlar

PROJE.md §18 Faz 1 (Foundation) ile başlıyor:

1. `v2/index.html`'i görünümü değiştirmeden `css/` ve `js/` dosyalarına
   bölmek; bugünkü CSS değişkenleri `tokens.css` olur.
2. v2'nin kendi veri katmanı (`js/api.js`): bugün örnek veriyi döndürür,
   alan adları backend şemasına (`content`) göre seçilir.
3. v2'nin kurallarını yazmak (ürün, fiyat, puan, seviye, iptal).
4. Liste, ürün, seçim ve ödeme, hesap sayfaları; masaüstü düzeni.
