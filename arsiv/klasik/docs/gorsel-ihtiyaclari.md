# Görsel ihtiyaçları

## Neden bu liste var

Bu oturumdaki ağ politikası `images.unsplash.com`, `unsplash.com` ve
`commons.wikimedia.org` dahil bütün görsel kaynaklarına erişimi
engelliyor (proxy CONNECT'e 403 dönüyor). Yani:

- Kayıtlı bir fotoğrafın **neyi gösterdiği doğrulanamıyor**.
- Yeni fotoğraf **aranamıyor**.

Bu yüzden fotoğraf kimlikleri ezberden değiştirilmedi. Doğrulamadan
yazılan bir Unsplash kimliği, düzeltilmek istenen "alakasız görsel"
sorununu birebir yeniden üretir. Aşağıda hangi kartta ne konuda bir
fotoğraf gerektiği yazıyor; erişimi olan bir ortamda tek tek
değiştirilebilir.

Kayıt yeri: `assets/js/app.js` → `cardImages`.

## Konu olarak yanlış eşleşen görseller (öncelikli)

Bu anahtarlar birden fazla, birbiriyle ilgisiz konuya hizmet ediyor.
Her biri için ayrı bir fotoğraf gerekiyor:

| Anahtar | Şu an nerede kullanılıyor | Sorun |
|---|---|---|
| `bodrum` | Hem Bodrum tekne turu hem **İzmir Kordon Boyu** mekânı | Kordon için ayrı fotoğraf gerek (`izmir-kordon`) |
| `iznik` | Hem İznik turu hem **İzmir Saat Kulesi / Konak Meydanı** | Konak Meydanı için ayrı fotoğraf gerek (`izmir-konak`) |
| `ege2` | Hem Ege adaları turu hem **İzmir Arkeoloji Müzesi** | Müze için ayrı fotoğraf gerek (`izmir-muze`) |
| `cunda2` | Hem Cunda turu hem **Alaçatı taş sokaklar** | Alaçatı için ayrı fotoğraf gerek (`alacati`) |
| `market1` | Hem Alaçatı pazar turu hem **Kemeraltı Çarşısı** | Kemeraltı için ayrı fotoğraf gerek (`kemeralti`) |
| `theatre1` | Hem Aspendos etkinliği hem genel sahne | Aspendos için ayrı fotoğraf iyi olur (`aspendos`) |

## Yeni gereken görseller ve konuları

| Yeni anahtar | Fotoğraf ne göstermeli |
|---|---|
| `izmir-kordon` | Alsancak Kordon sahil yürüyüş yolu, palmiyeler, körfez |
| `izmir-konak` | Konak Meydanı ve Saat Kulesi |
| `izmir-muze` | İzmir Arkeoloji Müzesi (bina veya sergi salonu) |
| `kemeralti` | Kemeraltı Çarşısı'nın kalabalık kapalı sokakları |
| `alacati` | Alaçatı'nın taş evleri, mavi-beyaz kepenkler, begonvil |
| `aspendos` | Aspendos Antik Tiyatro, sahne ve oturma basamakları |
| `erciyes` | Erciyes kayak merkezi pistleri |
| `harbiye` | Açık hava konseri, gece sahne ve kalabalık |

## Mevcut anahtarların olması gereken konusu

Doğrulama yapılamadığı için bunlar **iddia değil, beklenti**. Erişimi
olan biri tek tek açıp konuyla eşleşmeyeni değiştirmeli:

`kapadokya`, `kapadokya2` → peri bacaları / balonlar ·
`pamukkale` → travertenler · `bodrum` → Ege koyu ve tekne ·
`efes` → Efes Antik Kent (Celsus Kütüphanesi) · `uludag` → karlı dağ ·
`bogaz` → İstanbul Boğazı · `ayder`, `karadeniz2` → sisli yayla ·
`assos` → Assos / gün batımı · `sile` → Karadeniz kıyısı ·
`iznik`, `iznik2` → İznik Gölü / antik doku · `concert1`, `concert2` →
konser sahnesi · `festival1` → festival kalabalığı · `standup1` → stand
up sahnesi · `theatre1` → tiyatro sahnesi · `market1` → pazar tezgâhı ·
`run1` → gece koşusu · `coffee1` → kahve festivali ·
`ege2` → Ege adaları · `dogu2` → tren / Doğu Anadolu ·
`sapanca2` → Sapanca Gölü · `abant2` → Abant Gölü ·
`cunda2` → Cunda / Ayvalık · `rafting3` → rafting ·
`paraglide3` → yamaç paraşütü · `balloon3` → sıcak hava balonu ·
`kayak3` → kayak · `hotel4`–`hotel7` → otel odası / tesis

## Kural

`cardImages` içinde karşılığı olmayan bir `img` anahtarı kullanılırsa
kart sessizce **rastgele** bir picsum fotoğrafına düşer. Bu, alakasız
görselin en sık kaynağıdır. `tests/home-blocks.test.js` içindeki test
bunu engeller: her `img` anahtarının kayıtta bulunması zorunludur.
