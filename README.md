# mola360
Gezi, etkinlik ve konaklama rezervasyon platformu. Frontend + backend + admin paneli.

## Dokümanlar

- `docs/veri-sozlesmesi.md` — ön yüz ile backend arasındaki veri sözleşmesi (veri kapısı, sınıflandırma, kontenjan)
- `docs/yonetim-sistemi.md` — yönetim sistemi mimarisi (backend, veritabanı, fazlar)
- `docs/admin-paneli.md` — yönetim paneli (`/admin/`)
- `docs/arayuz-kurallari.md` — site geneli görsel kurallar (parlama yok)
- `docs/tur-sayfasi.md` — tur içerik sayfası
- `docs/otel-sayfasi.md` — otel içerik sayfası
- `docs/aktivite-sayfasi.md` — aktivite içerik sayfası
- `docs/etkinlik-sayfasi.md` — etkinlik içerik sayfası
- `docs/mekan-sayfasi.md` — mekan içerik sayfası
- `docs/icerik-katalogu.md` — içerik kayıtlarının anasayfaya akışı
- `docs/seo-arastirma.md` — SEO kararları
- `docs/gorsel-kaynaklari.md` — görsel kaynakları

## Yerelde çalıştırma

```bash
npm install
npm run dev      # http://localhost:8000
npm test
```

Yönetim paneli: http://localhost:8000/admin/ (varsayılan şifre
`mola360`, ayrıntısı `docs/admin-paneli.md`).

## Yönetim sistemi (backend + veritabanı)

```bash
docker compose up
# API   http://localhost:4000/api/admin/health
# Site  http://localhost:8000
```

Hedef mimari **dinamik adresler**: yeni ürün yalnızca veritabanına bir
kayıt olacak, `/tur/<slug>/` gibi adresleri tek bir şablon karşılayacak;
ürün başına HTML dosyası üretilmeyecek. Ön yüz bugün GitHub Pages'te
statik çalışıyor ve veriyi tek bir veri kapısından alıyor
(`assets/js/data-gateway.js`); backend geldiğinde yalnızca o kapının içi
değişecek. Sözleşme `docs/veri-sozlesmesi.md`, backend mimarisi
`docs/yonetim-sistemi.md`, backend'in kendi belgesi `backend/README.md`.

**`index.html`'i çift tıklayıp açmayın.** `file://` ile açılan sayfada
kart bağları ölü görünür: bağlar `/otel/<slug>/` gibi **dizin
adresleridir** ve onları `index.html`'e çözen bir sunucu gerekir.
`npm run dev` tam da bunu yapar — GitHub Pages ne yapıyorsa aynısını.

## Yayın

Site **yalnızca `main` dalından** yayınlanır
(`.github/workflows/pages.yml`). Bir dala push etmek yayındaki siteyi
değiştirmez; değişiklik ancak `main`'e girdikten sonra
https://bedirinci.github.io/mola360/ adresinde görünür. Yayında
görmediğiniz bir şeyi aramadan önce `git log origin/main` ile o işin
`main`'de olup olmadığına bakın.

Her push ve PR'da testler çalışır (`.github/workflows/ci.yml`).
