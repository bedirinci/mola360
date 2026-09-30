# Yeni mola360 (/v2/)

https://bedirinci.github.io/mola360/v2/

v2, klasik siteden **bağımsız, tamamen yeni bir site**. Kuralları ayrı:

- Klasik sitenin verisini, motorlarını (`assets/js/`), stillerini
  (`assets/css/`) ve sayfalarını kullanmıyor; onlara bağ vermiyor.
- Klasik sitenin testleri `v2/` klasörünü taramıyor
  (`tests/baglar.test.js`). v2'nin kuralları `tests/v2.test.js`'te.
- Yeni sitede henüz yapılmamış sayfalara giden bağlar `#yakinda`;
  dokununca "Bu sayfa yeni mola360'ta hazırlanıyor" bildirimi çıkar.
  Sayfa yapıldıkça bağ gerçek adrese döner.
- Yayına hazır olana kadar `noindex`.
- Aynı depoda ve aynı yayın akışında (`main` → GitHub Pages) duruyor;
  bu yalnızca barınma. İleride ayrı bir depoya taşınabilir.

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

1. v2'nin kurallarını yazmak (ürün, fiyat, puan, seviye, iptal).
2. v2'nin kendi veri katmanı.
3. Liste, ürün, seçim ve ödeme, hesap sayfaları.
4. Masaüstü düzeni.
