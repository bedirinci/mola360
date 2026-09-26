# Yönetim sistemi — mimari ve yol haritası

mola360'ı tek bir ürün hâline getiren katman: **veritabanı tek gerçek
kaynak**, iş mantığı ortak servislerde, panel yönetim katmanı, site
kullanıcı katmanı.

Bu belge mimariyi, verilen kararların **gerekçesini** ve hangi fazın
tamamlandığını anlatıyor.

## Neden ayrı bir backend

Site GitHub Pages'te yayınlanıyor. Pages **statik dosya sunar, süreç
çalıştırmaz**. İstenen şeylerin çoğu — sunucu tarafı kimlik doğrulama,
RBAC, SQL veritabanı, envanter transaction'ları, hold süresini dolduran
zamanlanmış iş, ödeme webhook'ları, hız sınırı, dosya yükleme — çalışan
bir sunucu gerektiriyor.

Bu yüzden sistem ikiye ayrıldı:

```
┌─────────────────────────────┐      ┌──────────────────────────┐
│ backend/  (Node + Postgres) │      │ Statik site (Pages)      │
│                             │      │                          │
│  • Yönetim API'si           │      │  /tur/<slug>/            │
│  • Kimlik doğrulama, RBAC   │──┐   │  /otel/<slug>/           │
│  • Envanter, fiyat, booking │  │   │  /aktivite/<slug>/       │
│  • Denetim, iş kuyruğu      │  │   │  /etkinlik/<slug>/       │
└─────────────────────────────┘  │   │  /mekan/<slug>/          │
              │                  │   └──────────────────────────┘
              ▼                  │            ▲          ▲
      ┌──────────────┐           │            │          │
      │  PostgreSQL  │           └── yayınla ─┘          │
      │ TEK KAYNAK   │           (veri dosyalarını üretir)│
      └──────────────┘                                    │
              └──── müsaitlik / rezervasyon (runtime API) ─┘
```

> **Bu karar değişti (dinamik adres mimarisi).** Aşağıdaki "statik
> üretim" kararı iptal edildi: yeni ürün eklemek yeni bir HTML dosyası,
> klasör veya sayfa üretmeyecek. Ürün yalnızca veritabanına bir kayıt;
> `/tur/<slug>/` gibi adresler tek bir şablon tarafından karşılanacak ve
> sayfa kaydı sunucudan alacak. Ön yüz bu geçişe hazırlanıyor: bütün
> ekranlar veriyi tek bir veri kapısından istiyor, backend geldiğinde
> yalnızca o kapının içi değişecek (`docs/veri-sozlesmesi.md`). Mevcut
> 7 ürün sayfasının HTML kabuğu, sosyal medya önizlemesi bozulmasın diye
> sunucu gelene kadar duruyor; yenisi yazılmayacak. Aşağıdaki paragraf
> kararın tarihçesi olarak bırakıldı.

~~**Statik üretim** seçildi~~ (iptal): "Yayınla" işlemi veritabanından okuyup
`assets/js/*-data.js` dosyalarını ve içerik sayfalarını **yeniden
üretiyor**. Böylece:

- Mevcut frontend harfiyen korunuyor; kart tasarımı, filtre mantığı,
  mobil menü, SEO/URL yapısı değişmiyor.
- Site statik kalıyor: sayfa açılışı sunucuya bağımlı değil.
- **Çift veri yok.** Üretilen dosyalar veritabanının türevi; elle
  düzenlenmiyorlar ve tek kaynak veritabanı.

Müsaitlik ve rezervasyon gibi **anlık** bilgi statik dosyaya yazılamaz;
onlar çalışma anında API'den geliyor.

## Katmanlar

```
backend/
  migrations/        sıralı SQL; her biri kendi transaction'ında
  src/
    config/          ortam değişkenleri, AÇILIŞTA doğrulanıyor
    db/              havuz, transaction yardımcısı, göç çalıştırıcısı
    lib/             hata biçimi, şifre özeti, günlük
    middleware/      oturum, yetki, doğrulama, hız sınırı, hata
    services/        iş mantığı (auth, rbac, audit …)
    routes/          HTTP uç noktaları
  scripts/           migrate, seed, import-legacy
  tests/             GERÇEK PostgreSQL'e karşı
```

## Verilen kararlar ve gerekçeleri

### Müşteri ve yönetici ayrı tabloda

Tek bir `users` tablosunda tutmak, panele giriş yetkisini bir `is_admin`
sütununa indirger; o sütunu yanlışlıkla `true` yapan tek bir UPDATE
bütün siteyi açar. İki tablo, iki oturum kümesi, iki kimlik doğrulama
yolu — yetki yükseltme kazası mümkün değil.

### Şifre scrypt ile, oturum jetonu özetlenerek

Şifre `scrypt` (Node'un içinde, RFC 7914, bellek-sert) ile tuzlanıp
özetleniyor. Oturum jetonunun **kendisi değil SHA-256 özeti** saklanıyor:
veritabanı yedeği sızsa bile oturumlar taklit edilemez. Jeton `httpOnly`
çerezle taşınıyor — `localStorage`'a konan bir jeton herhangi bir XSS
açığıyla okunabilir.

### Çift satış engeli veritabanında

```sql
available int GENERATED ALWAYS AS (capacity - held - reserved - sold - blocked) STORED
CONSTRAINT inventory_not_oversold CHECK (held + reserved + sold + blocked <= capacity)
```

`available` **türetiliyor** — uygulama onu yazamaz, dolayısıyla kapasite
ile satılan miktar ayrışamaz. Kısıt ise son savunma hattı: uygulama
katmanı hatalı olsa, bir script elle SQL çalıştırsa veya ileride ikinci
bir servis eklense bile fazla satış veritabanınca reddedilir.

Uygulama ayrıca `SELECT … FOR UPDATE` ile satırı kilitliyor; ikisi
birlikte çalışıyor. `tests/schema.test.js` iki eşzamanlı rezervasyonun
son koltuğu ikiye bölemediğini ölçüyor.

> **Bir hata bu yüzden yakalandı.** İlk sürümde tekillik kısıtı
> `UNIQUE (content_id, item_type, item_id, on_date, start_time)` idi.
> SQL'de `NULL ≠ NULL` olduğu için saati olmayan iki satır çakışma
> sayılmıyordu; aynı otel odası için aynı tarihte iki envanter satırı
> açılabiliyor ve **kapasite ikiye katlanıyordu**. `018` göçü bunu
> `NULLS NOT DISTINCT` ile onardı (aynı hata kalkış ve temsil
> tarihlerinde de vardı).

### Rezervasyon durum makinesi veritabanında

İzin verilen geçişler `booking_status_transitions` tablosunda; bir
tetikleyici her `UPDATE`'te doğruluyor. `pending → completed` gibi bir
geçiş — ödemeyi ve onayı atlayan — reddediliyor.

Yalnızca uygulama katmanında kontrol edilseydi, bir script veya ileride
eklenecek ikinci bir servis rezervasyonu iptalden doğrudan tamamlandıya
taşıyabilirdi. Para ve kontenjanla ilgili bir kaydın tutarlılığı tek bir
uygulamanın dikkatine bırakılamaz.

### Kart verisi saklanmıyor

`payments` tablosunda kart numarası, CVV veya son kullanma tarihi için
sütun **yok ve olmayacak**. Sağlayıcının işlem kimliği ve token'ı
yeterli; hosted/redirect/tokenized yöntemler için soyutlama var.

### content_blocks neden genel bir tablo

`highlights`, `description`, `badges`, `facts`, `trust`, `included`,
`excluded`, `bring`, `important`, `requirements`, `rules`, `policies`,
`amenities` — on üç alan. Hepsi "sıralı küçük kayıt listesi" ve hiçbiri
içerikten **bağımsız sorgulanmıyor**; her zaman kaydın tamamıyla
okunuyorlar. On üç ayrı tablo, on üç kez aynı şemayı yazmak olurdu.

Bağımsız sorgulanan şeyler **ayrı tabloda**: SSS (moderasyon), yorumlar
(moderasyon + puan), medya (kullanım raporu), ilişkiler (çift yönlü
gezinme), SEO (ayrı yetki), etiketler (filtre), ek hizmetler (fiyat).

### İlişkiler ID üzerinden

Eski veride "benzer içerikler" slug ve **başlık kopyalayarak**
tutuluyordu; başlık değişince kopya eskiyordu — `docs/icerik-katalogu.md`
içindeki "kart eskiyor" sorununun aynısı. Artık `content_relations`
hedefin **id**'sini tutuyor.

## Göç: mevcut veriden veritabanına

`backend/scripts/import-legacy.js`

**Tek sözü var: hiçbir alan sessizce kaybolmaz.** Script bunu tahminle
değil **ölçerek** yapıyor: her kaydın üst seviye anahtarları toplanıyor,
işlenen her anahtar işaretleniyor, sonunda işaretlenmeyenler rapora
düşüyor.

İlk çalıştırmada rapor üç alanın hedefsiz kaldığını gösterdi —
`program`, `accommodation`, `departureCities`. Üçü de gerçek veriydi,
ikisi **fiyatı etkiliyordu** (İzmir çıkışlı tur +350 TL). `017` göçü
`tour_departure_cities` tablosunu açtı ve program `tour_itinerary_days`'e
bağlandı. Şimdiki rapor:

```
AKTARILMAYAN ALANLAR (0)
  yok — kaydın her alanı bir hedefe yazıldı.
```

Bu güvence `backend/tests/migration.test.js` içinde **kaynaktan sayılarak**
ayrıca doğrulanıyor: script'in kendi raporuna güvenilmiyor.

Göç **tekrar çalıştırılabilir**; yarım kalmış bir göçü baştan almak
mümkün ve ikinci çalıştırma kayıtları ikiye katlamıyor. (Bu test de
gerçek bir hata yakaladı: 017'de eklenen tablo temizlik listesine
konmamıştı.)

## Roller

| Rol | Ne yapabilir |
|---|---|
| `SUPER_ADMIN` | Her şey; yedek geri yükleme ve oturum sonlandırma dâhil |
| `ADMIN` | Yedekleme dışında her şey |
| `CONTENT_MANAGER` | İçerik, medya, SEO, anasayfa; **yayınlayabilir** |
| `EDITOR` | İçerik yazar ve düzenler; **yayınlayamaz**, kullanıcı/ödeme göremez |
| `RESERVATION_MANAGER` | Rezervasyon, kontenjan, iade; içerik düzenleyemez |
| `MARKETING_MANAGER` | Kampanya, kupon, anasayfa, raporlar |
| `SUPPORT` | Rezervasyon/müşteri görüntüleme, yorum moderasyonu; **iade yapamaz** |

34 izin `<alan>.<eylem>` biçiminde, tek kaynakta
(`backend/src/services/rbac.js`). İzinler **her istekte** veritabanından
çözülüyor, oturuma gömülmüyor: yetkisi alınan kişi oturumu boyunca
yetkili kalmasın.

Yetki kontrolü **yalnızca sunucuda**. Panelin düğmeyi gizlemesi bir
kolaylıktır, koruma değildir — saldırgan düğmeye basmaz, isteği doğrudan
atar.

## Fazlar

| Faz | Kapsam | Durum |
|---|---|---|
| 1 | Repo analizi, veri modeli, backend, şema, auth, RBAC | **tamam** |
| 8a | Mevcut verinin göçü + eşleme raporu | **tamam** |
| 2 | Dashboard, içerik listesi, içerik CRUD | sırada |
| 3 | Tur / otel / aktivite / etkinlik / mekân modülleri | |
| 4 | Medya, SEO, SSS, yorum, ilişkiler | |
| 5 | Takvim, müsaitlik, fiyat motoru, rezervasyon | |
| 6 | Kampanya, kupon, anasayfa yönetimi | |
| 7 | Raporlar, denetim, bildirim, yedekleme | |
| 8b | ~~Statik üretim~~ → dinamik adresler (tek şablon + veritabanı), üretim sertleştirme, E2E | |

**Şema fazların tamamını kapsıyor** (84 tablo; bu belgede önceden 38 yazıyordu, göç dosyalarından sayılınca 019 öncesi 77 çıktı): şema değişikliği en pahalı
göç türü, bu yüzden temel baştan tam kuruldu. Fazlar API ve arayüzü
ekliyor.

## Şu an ne çalışıyor

- 19 göç, 84 tablo, gerçek PostgreSQL (019: sınıflandırma — çoklu
  kategori, tema, koleksiyon, liste sayfası, özellik, para birimi)
- Kimlik doğrulama: scrypt, sunucu oturumu, hesap kilidi, hız sınırı,
  oturum sonlandırma, şifre değişikliğinde toplu çıkış
- RBAC: 7 rol, 34 izin, middleware seviyesinde uygulama
- Denetim kaydı (öncesi/sonrası farkı)
- Mevcut 7 içeriğin tam göçü, sıfır kayıp
- 82 backend testi, gerçek veritabanına karşı

## Henüz olmayan

Bunlar **bilerek** sonraki fazlarda:

- İçerik CRUD uç noktaları ve panel arayüzü (`/admin/` hâlâ eski,
  statik dosyaları okuyan sürüm — `docs/admin-paneli.md`)
- Dinamik adresler: sunucunun `/tur/<slug>/` gibi adresleri tek şablonla
  karşılaması (statik üretimin yerine)
- Rezervasyon, ödeme ve envanter **servisleri** (şema hazır, iş mantığı yok)
- Medya yükleme (şema ve soyutlama hazır, storage sürücüsü yok)
- Zamanlanmış iş çalıştırıcısı (`jobs` tablosu hazır)

Panel bu geçiş boyunca çalışmaya devam ediyor.
