# mola360 backend

Yönetim API'si, veritabanı ve iş mantığı. Mimari ve gerekçeler:
`../docs/yonetim-sistemi.md`.

## Çalıştırma

En kolayı — depo kökünden:

```bash
docker compose up
# API   http://localhost:4000/api/admin/health
# Site  http://localhost:8000
```

İlk açılışta göçler çalışır, roller/izinler kurulur ve mevcut içerik
verisi aktarılır.

### Docker olmadan

```bash
cd backend
cp .env.example .env          # DATABASE_URL'i kendinize göre düzenleyin
npm install
npm run migrate               # şemayı kur
npm run seed                  # roller, izinler, ana veri, ilk yönetici
npm run import:legacy         # mevcut JS veri dosyalarını aktar
npm run dev
```

`npm run seed` ilk yöneticiyi oluşturur. `ADMIN_PASSWORD` vermezseniz
rastgele bir şifre üretir ve **bir kez** ekrana yazar.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Sunucuyu `--watch` ile başlatır |
| `npm run migrate` | Bekleyen göçleri uygular |
| `npm run migrate:status` | Hangi göç uygulandı, hangisi bekliyor |
| `npm run seed` | Rol, izin, ana veri, ilk yönetici |
| `npm run import:legacy` | Mevcut veriyi aktarır + eşleme raporu |
| `npm run reset` | Şemayı sıfırlar, kurar, doldurur (**üretimde çalışmaz**) |
| `npm test` | Testler — gerçek PostgreSQL gerektirir |

## Test

Testler **gerçek PostgreSQL'e** karşı koşuyor. Sahte bir katman, tam da
bu şemanın en kritik güvencelerini (CHECK kısıtları, türetilen sütunlar,
durum makinesi tetikleyicisi) test dışında bırakırdı.

```bash
createdb mola360_test
TEST_DATABASE_URL=postgres://mola360:mola360@127.0.0.1:5432/mola360_test npm test
```

## Göç yazarken

- Çalışmış bir göç **düzenlenmez**. Çalıştırıcı dosyanın sha256'sını
  tutuyor ve değişmişse hata veriyor; değişikliği yeni bir dosyaya yazın.
- Türe ait yeni bir tablo eklerseniz `scripts/import-legacy.js` içindeki
  `TIP_ALT_TABLOLAR` listesine de ekleyin — yoksa göç ikinci kez
  çalıştığında tekil kısıt hatası verir.

## API biçimi

Başarılı: `{ "success": true, "data": … }`

Hata: `{ "success": false, "error": { "code", "message", "fieldErrors" } }`

| Kod | HTTP |
|---|---|
| `VALIDATION_ERROR` | 422 |
| `UNAUTHENTICATED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `ACCOUNT_LOCKED` | 423 |
| `RATE_LIMITED` | 429 |
| `INTERNAL_ERROR` | 500 |

Beklenmeyen hataların mesajı **yanıta yazılmaz** — şema, dosya yolu veya
sorgu metni sızdırabilir. Günlüğe tam hâliyle düşer.
