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
   ve kampanya süresi gerçek veriden gelir. Örnek veri kodda (`data.js`,
   `icerik.js`) ÖRNEK diye işaretlenir. Arayüzde ÖRNEK rozeti, taslak notu
   ya da önizleme düğmesi gösterilmez; site yayındaymış gibi görünür
   (Bedir, 2026-10-04).
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

Otomatik kontroller `tests/` altında: `v2.test.js` (kurallar, veri
katmanı, kaçış), `v2-takvim.test.js` (takvim; saat sabitlenerek farklı
günlerde) ve `v2-tarayici.test.js` (bütün sayfalar gerçek Chromium'da
hatasız açılır; kullanıcının yazdığı metin hiçbir ekranda HTML olarak
çalışmaz; tarayıcı yoksa atlanır, CI kurar).
- Yeni sitede henüz yapılmamış sayfalara giden bağlar `#yakinda`;
  dokununca "Çok yakında." bildirimi çıkar.
  Sayfa yapıldıkça bağ gerçek adrese döner.
- Yayına hazır olana kadar `noindex`.
- `main` → GitHub Pages ile yayınlanıyor.

## Şu an ne var

v2 çok sayfalı bir arayüz iskeleti. Her sayfa kendi klasöründe, derleme
yok; GitHub Pages'te olduğu gibi çalışır (yerelde `npm run dev`).

| Sayfa | Adres | Ne var |
|---|---|---|
| Keşfet | `v2/` | Arama (nereye: yazdıkça yer ve deneyim önerisi, son aramalar, popüler aramalar; ne zaman; kaç kişi). Arama kartı yana kayar: formun ardından seçili sekmenin bütün koleksiyonları gelir (ör. Yurt dışı, Kültür, Karadeniz turları; yer ya da temayla, boş olan gösterilmez), temalar gibi yana kayan kartlar: üç sıra, yalnızca adı; sekme değişince kartlar da değişir. Kayabildiği her açılışta ve sekme her değiştiğinde kartın iki kez kısa kıpırdamasıyla gösterilir (hareketi azalt açıksa gösterilmez). "Kaldığın yerden" (yalnızca daha önce ürüne bakıldıysa), "Ne kadar molan var?" + "Kiminle?", Molapuan kartı, Bağlan önizlemesi, "Yakınımda ne var?" (konum ya da şehir), "Bu hafta sonu için" (bütün kategoriler), "Bu hafta sahnede" (7 günün etkinlikleri), temalar. Süre ve kiminle seçimini hatırlar. Kiminle aramaya binmez, yalnızca rayların içindeki sırayı belirler; konum yalnızca "Yakınımda" rayını doldurur, yakındaki yer "Nereye?"nin başında önerilir. Bölümlerin sırası sabit |
| Bağlan | `v2/baglan/` | Hikayeler (Mola360'ın ve takip edilenlerin; tam ekran oluşturucu), Haftanın gezgini, paylaşım akışı (her paylaşım bağlı olduğu ürünle; beğen, yorum, Gönder, kaydet, ⋯ menüsü), "Ben de gitmek istiyorum", "Birlikte gidelim", "Yeni insanlar keşfet" |
| Gönderi | `v2/gonderi/?id=` | Paylaşım ve yorumları; yanıt, kendi gönderini düzenle ya da sil |
| Kişi | `v2/kisi/?u=` | Başkasının profili: paylaşımları, Mola360 ile yaşadığı deneyimler, takip, mesaj |
| Ürün | `v2/urun/?id=<slug>` | Tek şablon: görsel, bölüm sekmeleri, tarih seçimi (ilk üç tarih ve "Tüm tarihler" çekmecesi), otelde gece ve odalar, seçenek/bilet/paket, hakkında, program, dahil/hariç, kişi başı fiyat, kalkış noktaları ya da konum, bilmen gerekenler, iptal (seçilen tarihe göre son ücretsiz iptal günü) ve ödeme, değerlendirmeler, SSS, "Bu deneyimi yaşayanlar" (`#paylasimlar`), benzer deneyimler |
| Rezervasyon | `v2/rezervasyon/?id=<slug>&tarih=` | Seçim (tarih, saat, seçenek, adet ya da yaşa göre kişi, kalkış noktası, oda düzeni, kapora) → iletişim ve katılımcı bilgileri → özet, iptal ve ödeme → onay. Ödeme alınmaz, kart bilgisi istenmez |
| Liste | `v2/liste/?tur=otel&yer=kapadokya&tarih=bu-hs&sure=hs&kimle=sevgili&tema=doga` | Kategori satırı (`tur`), arama (`yer` ya da `ara`), filtre satırı (`tarih`, `sure`, `kimle`) ve tema (`tema`) ayrı parametreler; aramadan gelen seçimler filtre satırının başında, dokununca kalkar. `tema` seçiliyse sayfa temanın vitrini: kapak, iki cümlelik giriş, yalnızca temada olan kategoriler, temanın sırasıyla deneyimler ve araya "Bu temada paylaşılanlar" |
| Planlarım | `v2/planlarim/` | Yaklaşan (bilet ve karekod, buluşma noktası, kalan ödeme, iptal), Geçmiş (paylaş, değerlendir; tarihi geçen rezervasyon buraya geçer), Favoriler. Eski `favoriler/` ve `rezervasyonlar/` adresleri buraya yönlenir |
| Profil | `v2/profil/` | Kimlik, sayılar (takipçi ve takip çekmecesi), Molapuan, paylaşımlar, Mola360 ile yaşanan deneyimler, kaydedilenler, hesap ve ayarlar |
| Mesajlar | `v2/mesajlar/`, `v2/sohbet/?k=` | Sohbetler, istekler ve arşiv (sola kaydırınca: daha fazla, sessize al, arşivle); sohbette deneyim ve paylaşım kartı, "Birlikte gidelim" daveti |
| Bildirimler | `v2/bildirimler/` | Bağlan ve Planlarım bildirimleri (yaklaşan mola, kalan ödeme, değerlendirme dahil), bildirim ayarları |

Kod düzeni:

- `css/tokens.css` (tasarım tokenları: renk, yazı tipi `--font` (cihazın
  kendi fontu, web fontu yok), 8 adımlı yazı ölçeği
  `--fs-*` ve ekranla küçülen bölüm başlıkları `--fs-h2`, `--fs-h3`, köşe `--r-*`, boşluk `--s-*`, gölge, hareket). Yazı boyutu ve
  köşe için ham px yalnızca burada; test başka yerde yakalar.
- `base.css`, `components.css`
  (ortak bileşenler), `kesfet.css` (anasayfa), `sayfalar.css` (alt sayfalar).
- `js/shell.js`: her sayfada aynı olan alt menü ve Paylaş düğmesi,
  başlıktaki zil ve mesaj sayısı, bildirim (toast), geri oku.
- `js/ui.js`: ortak yardımcılar. `esc` kullanıcının yazdığı metni HTML'e
  kaçışlar; innerHTML'e giren her kullanıcı metni ondan geçer (sayfalar
  kendi kopyasını tutmaz, test denetler).
- `js/api.js`: bütün sayfaların okuduğu tek veri katmanı (ürünler,
  etkinlikler, temalar, yerler, arama önerileri, takvim, rezervasyonlar,
  paylaşımlar, mesajlar, bildirimler, son bakılanlar, ürün içeriği).
  Bugün `js/data.js` içindeki ÖRNEK veriyi tek ürün şekline çeviriyor;
  ürün kimliği addan türeyen `slug`. Backend gelince yalnızca içi değişecek.
- `js/koleksiyon.js`: Keşfet'te yana kayan arama kartında formun ardından
  gelen koleksiyonlar (seçili sekmenin, `api.listCollections`, veri
  `KOLEKSIYON`) ve kayabildiğini gösteren ipucu.
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

- Veriler ÖRNEK; bu yalnızca kodda işaretli, sayfalarda etiket yok. Ürün adları ve fiyatlar örnek
  katalogdan; kalkış tarihleri, etkinlik saatleri, yurt dışı turları,
  paylaşımlar, kullanıcılar ve rezervasyonlar uydurma.
- Kullanıcının yaptığı her şey yalnızca bu tarayıcıda (`localStorage`):
  favoriler (`m360-fav`), son bakılanlar (`m360-son`), son aramalar
  (`m360-aramalar`), "Yakınımda" seçimi (`m360-yakin`), Keşfet'teki süre ve
  kiminle (`m360-kesfet`), rezervasyonlar ve durumları (`m360-rez`,
  `m360-rez-durum`), değerlendirmeler (`m360-degerlendir`), paylaşımlar,
  düzenlemeler ve silinenler (`m360-paylas`, `m360-duzen`, `m360-silinen`),
  hikayen (`m360-hikayem`, görülenler `m360-hikaye`), yorumlar
  (`m360-yorum`), mesajlar (`m360-mesaj`), takip ettiklerin (`m360-takip`),
  bildirimler ve ayarları (`m360-bildirim`, `m360-bildirim-ayar`), kapatılan
  Haftanın gezgini (`m360-hafta`), Molapuan kartının açık kalması
  (`m360-mp`). Konumun kendisi ve konumdan çıkan yer saklanmaz. Aramadaki tarih ve kişi sayısı sekme
  açık kaldıkça (`sessionStorage`, `m360-arama`) liste, ürün ve
  rezervasyon sayfalarına taşınır; başlıktaki geri okunun yolu da öyle
  (`m360-yol`, `m360-yolh`). Yarım kalan rezervasyon (seçimler ve form,
  iletişim bilgileri dahil) yalnızca sekme açıkken tutulur
  (`sessionStorage`, `m360bk:<ürün>`) ve rezervasyon bitince ya da "Çık"la
  silinir; iletişim bilgileri kalıcı saklanmaz. "Kaldığın yerden"
  bölümündeki "Temizle" son bakılanları siler.
- Takvim bugünden hesaplanır (`api.js`): aramadaki "Bu hafta sonu",
  "Gelecek hafta sonu", bu ayın kalanı ve gelecek ay; etkinliklerin ve otel
  konaklamasının tarihleri; hesaptaki örnek rezervasyon. Tur kalkışları
  1 Ekim 2026 haftası için yazıldı (ÖRNEK), haftanın aynı günlerinde
  bugünün haftasına taşınır; geçmişteki kalkış gösterilmez. Etikette yıl
  yok ("Cum 9 Eki"); bugüne en yakın yıl seçilir, rezervasyon ayrıca
  yılıyla saklanır. Son ücretsiz iptal günü seçilen tarihe göre. Yerler
  (`DESTS`) ve ürün içeriği ÖRNEK.
- Hangi ürünün kime uygun olduğu (tek başıma, sevgilimle, arkadaşlarla,
  ailemle, çocuklarla, iş arkadaşlarımla), hangi temada olduğu ve
  yaklaşık konumu (`GEO`) ÖRNEK; gerçekte işletme bilgisinden ve
  değerlendirmelerden gelecek.
- Akıştaki beğen, kaydet ve "Takip et" yalnızca ekranda değişir;
  takipçi ve takip çekmecesindeki seçim bu cihazda (`m360-takip`).
- Oturumdaki kullanıcı Ayşe (Kâşif). Misafir ve Gezgin görünümü adresle
  denenir: `?gorunum=misafir|gezgin|kasif` (sekme açık kaldıkça hatırlanır,
  `sessionStorage` `m360-gorunum`). Keşfet'in altındaki görünüm düğmeleri
  kaldırıldı.
- Molapuan ve seviye indirimi ÖNERİ kurallarıyla gösteriliyor: 100 TL = 1
  puan, 1 puan = 1 TL, Kâşif %10, Mola Ustası %15. Seviye son 24 aydaki
  rezervasyon sayısıyla: Gezgin 1, Kâşif 3, Mola Ustası 6.

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
3. Gerçek ödeme (3D Secure) ve müsaitlik takvimi; gerçek giriş ve kayıt
   (bugün arayüzü var: Google, Apple, telefon çekmecesi); paylaşımın ve
   mesajın sunucuya gitmesi (bugün yalnızca bu cihazda).
4. Kalan filtreler: listede "Yakınımda" ve fiyat aralığı; sıralama;
   aramada gerçek takvim (gün seçimi).
5. v2'nin kurallarını yazmak (ürün, fiyat, puan, seviye, iptal).
6. Masaüstü düzeni (bilerek en son; önce mobil).
