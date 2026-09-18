# Görsel kaynakları

## Yöntem

Bu ortamın ağ politikası görsel sunucularına erişimi engelliyor, yani bir
fotoğrafın içeriği **açılıp görülerek** doğrulanamadı. Bunun yerine
konuya göre internette araştırma yapıldı ve Wikimedia Commons seçildi.
Sebebi şu: Commons'ta **dosya adı konuyu anlatır**. `Ephesus Celsus
Library Façade.jpg` adlı dosyanın Efes'teki Celsus Kütüphanesi'nin
cephesini gösterdiği adından bellidir. Unsplash kimlikleri
(`photo-1564501049412-61c2a3083791`) ise hiçbir anlam taşımaz; içeriği
açmadan bilinemez.

Adresler `Special:FilePath` ile kuruluyor:

```
https://commons.wikimedia.org/wiki/Special:FilePath/<Dosya_Adi>?width=800
```

Bu adres dosya adından deterministik olarak üretilir ve Commons doğru
boyuttaki küçük görsele yönlendirir. API anahtarı gerekmez.

## Eklenen görseller

| Anahtar | Dosya | Kullanıldığı yer |
|---|---|---|
| `efes` | `Ephesus Celsus Library Façade.jpg` | Efes Antik Kent mekânı, Efes turu |
| `kemeralti` | `Kemeraltı market 02.jpg` | Kemeraltı Çarşısı mekânı |
| `izmirKordon` | `Izmir Alsancak Kordon 6339.jpg` | Kordon Boyu mekânı |
| `izmirKonak` | `Izmir Konak Square.jpg` | Saat Kulesi ve Konak Meydanı mekânı |
| `izmirMuze` | `İzmir Archaeological Museum 2462 1.jpg` | İzmir Arkeoloji Müzesi mekânı |
| `alacati` | `Alaçatı değirmenler 01.jpg` | Alaçatı Taş Sokaklar mekânı |
| `aspendos` | `Aspendos Turkey.JPG` | Aspendos Opera ve Bale Festivali |
| `erciyes` | `Erciyes Dağı Kayseri.JPG` | Erciyes Kayak Haftası |

## Bunlar hangi sorunu çözdü

Önceden tek bir fotoğraf birbiriyle ilgisiz iki konuya hizmet ediyordu.
Artık her konunun kendi fotoğrafı var:

| Anahtar | Önce | Sonra |
|---|---|---|
| `bodrum` | Bodrum tekne turu **ve** İzmir Kordon | yalnız Bodrum turu |
| `market1` | Alaçatı pazar turu **ve** Kemeraltı | yalnız pazar turu |
| `iznik` | İznik turu **ve** Konak Meydanı | yalnız İznik turu |
| `ege2` | Ege adaları turu **ve** Arkeoloji Müzesi | yalnız Ege turu |
| `cunda2` | Cunda turu **ve** Alaçatı | yalnız Cunda turu |
| `theatre1` | Tiyatro **ve** Aspendos | yalnız tiyatro |
| `kayak3` | Uludağ kayak **ve** Erciyes | yalnız Uludağ |

## Yayına almadan önce yapılması gerekenler

**1. Lisans ve yazar doğrulaması.** Commons dosyalarının çoğu CC BY veya
CC BY-SA lisanslıdır ve **yazar adının belirtilmesini** ister. Sayfadaki
"Görseller: Wikimedia Commons" satırı her dosyanın kendi sayfasına
bağlanıyor; yazar ve lisans orada yazılı. Ancak bu ortamdan o sayfalar
açılamadığı için **yazar adları ve lisans türleri doğrulanmadı**. Ticari
kullanımdan önce sekiz dosyanın her biri açılıp yazar adı ve lisans
sayfaya yazılmalıdır. Bilinen tek örnek: `Kemeraltı market 02.jpg` —
Francisco Anzola, CC BY 2.0.

**2. Kendi sunucunuza alın.** Commons'tan doğrudan bağlantı (hotlink)
düşük trafikte çalışır ama Wikimedia bunu üretim için önermez. Görseller
indirilip `assets/img/` altına konmalı ve WebP'ye çevrilmelidir. Bu aynı
zamanda sayfa hızını da artırır.

**3. Görselleri bir kez gözle kontrol edin.** Dosya adı konuyu anlatıyor
ama kadraj, çözünürlük ve en-boy oranı görülmeden bilinemez. Özellikle
dikey çekilmiş fotoğraflar yatay kartlarda kötü kırpılabilir.

## Geri kalan görseller

Unsplash'ten gelen diğer kayıtlar olduğu gibi duruyor; hangi anahtarın
hangi konuyu göstermesi gerektiği `docs/gorsel-ihtiyaclari.md` içinde
yazılı. Onlar da aynı yöntemle tek tek değiştirilebilir.
