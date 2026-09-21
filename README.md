# mola360
Gezi, etkinlik ve konaklama rezervasyon platformu. Frontend + backend + admin paneli.

## Dokümanlar

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
