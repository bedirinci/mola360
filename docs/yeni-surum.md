# Yeni sürüm (/v2/)

Yeni tasarım, klasik site yayındayken `/v2/` adresinde adım adım kuruluyor:
https://bedirinci.github.io/mola360/v2/

- Sayfa `noindex`; arama motoru iki sürümü birden dizine almıyor.
- Üstteki şeritten klasik siteye dönülüyor.
- Klasik sitenin son hali `v1-klasik` etiketiyle saklanıyor.
- Hazır olunca `/v2/` köke taşınacak ve eski adresler yönlendirilecek.

## Şu an ne var

`v2/index.html`: Keşfet (anasayfa) ve tam ekran menü, tek dosya.

- Kartlar klasik sitenin ürün sayfalarına gidiyor. Sayfası olmayan örnek
  yurt dışı turları (Midilli, Batum, Balkanlar, Dubai, İtalya, İspanya,
  Fransa) ilgili kategori listesine gidiyor.
- Veriler şimdilik sayfanın içinde. Fiyat ve ad örnek katalogdan; kalkış
  tarihleri, etkinlik saatleri ve yedi yurt dışı turu ÖRNEK.
- Favoriler yalnızca tarayıcıda (`localStorage`, `m360-fav`).
- Molapuan ve seviye indirimi ÖNERİ kurallarıyla gösteriliyor: 100 TL = 1
  puan, 1 puan = 1 TL, Kâşif %10, Mola Ustası %15. Kurallar kesinleşmedi;
  hesap motoru (`account-engine.js`) hâlâ yalnızca tur puanını hesaplıyor.
- Alttaki "Görünüm: Misafir / Gezgin / Kâşif" düğmeleri önizleme içindir.

## Sıradaki adımlar

1. Keşfet verisini veri kapısından (`MolaVeri`) okumak.
2. Liste sayfası, ürün sayfası, seçim ve ödeme, hesap ekranları.
3. Masaüstü düzeni.
4. Köke geçiş.
