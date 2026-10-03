# Arayüz kuralları

Site genelinde geçerli, teste bağlı görsel kararlar.

## Parlama (glow) yok

Düğmelerde ve yazılarda parlama efekti kullanılmıyor.

**Neden ayrı bir kural:** parlama iki farklı teknikle sızıyordu ve ikisi de
"gölge" adı altında göze çarpmıyordu.

### 1. Rengi elemanla eşleşen gölge

Yeşil bir düğmenin altına yeşil gölge koyunca gölge değil **hale**
oluyor. Kaldırılanlar:

| eleman | kaldırılan |
|---|---|
| `.tour-cta` (Rezervasyon yap) | `0 6px 16px rgba(140,198,63,.32)` |
| `.drawer-whatsapp-btn` | `0 5px 14px rgba(37,211,102,.3)` |
| `.tour-stop-body::before` (program noktası) | dıştaki `0 0 0 5px rgba(140,198,63,.22)` halkası |

**Nötr (lacivert) yükseklik gölgeleri parlama değildir ve duruyor** —
`--shadow` ve `--shadow-lg`. Hepsi silinseydi arayüz düzleşirdi.

### 2. `text-shadow`

Bu sitede yazı gölgesi hep parlama olarak görünüyordu. Hiçbir yerde
kalmadı:

| eleman | kaldırılan | yerine |
|---|---|---|
| `.home-promo-content` (kampanya kartı, **düğme yazısı dahil**) | `0 1px 10px rgba(11,18,48,.55)` | perde zaten yeterli |
| `.mobile-drawer .drawer-promo-title` | `0 1px 3px` + `0 1px 10px` | kartın kendi perdesi (altta `.95`) |
| `.desktop-sidebar .drawer-promo-title` | `0 1px 4px rgba(0,0,0,.7)` | aynı |
| `.tour-gallery-more` | `0 1px 3px rgba(0,0,0,.35)` | üstündeki karartma katmanı |

**Fotoğraf üzerindeki yazı kontrastı perdeden gelir, gölgeden değil.**
Kampanya kartında perde bir dönem hafifletilip kaybolan kontrast gölgeyle
geri verilmişti; gölge kalkınca perde olduğu gibi bırakıldı — bilerek
açık tonlu bir fotoğraf konup bakıldı, yazılar gölgesiz de okunuyor.
Yazılar perdenin koyu ucunda duruyor.

### Dokunulmayanlar

- **Odak halkaları** (`:focus-visible { outline: 3px solid … }`) —
  klavye erişilebilirliği; gölge değil, solid çerçeve.
- **Bulanıklığı olmayan halkalar** (`0 0 0 Npx`) — kenarlık/ayraç işi
  görüyorlar, parlama değiller.

### Test

`tests/tour.test.js` içindeki "parlama efekti yok" bölümü hem
`text-shadow`'u hem marka rengiyle eşleşen bulanık gölgeyi yasaklıyor.

**Testin ilk sürümü yanlıştı:** gölgenin bulanıklığını `px` ekli
değerleri sayarak buluyordu, ama `0 6px 16px` yazımında ilk değerin
birimi yok. Bu yüzden yeşil parlama geri konduğunda test görmedi.
Artık renk ve anahtar kelimeler atılıp **sayılar** okunuyor; mutasyonla
doğrulandı.
