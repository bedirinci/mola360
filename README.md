# mola360

> Ne yapacağını keşfet. İnsanlarla bağlan. Deneyimini yaşa.

Mola360; insanların boş zamanlarında ne yapacaklarını keşfettiği, gerçek
insanların deneyimlerinden ilham aldığı ve keşfettiği deneyimi doğrudan
rezerve edebildiği bir sosyal keşif platformu. İki kalbi var: **Keşfet**
(tur, etkinlik, aktivite, otel, mekân) ve **Bağlan** (gerçek ürünlere
bağlanan paylaşımlar).

## Dokümanlar

- `docs/PROJE.md` — **ana proje dokümanı, tek kaynak** (karar kaydı en altta)
- `docs/VIZYON.md` — vizyon metni
- `docs/yeni-surum.md` — v2 ve v2'nin **bağlayıcı kuralları**
- `docs/yonetim-sistemi.md` — backend mimarisi (kendi faz planıyla)
- `backend/README.md` — backend'in kendi belgesi

## Depo

| Klasör | Ne |
|---|---|
| `v2/` | Mola360 — üzerinde çalışılan site |
| `backend/` | PostgreSQL şeması, yönetim API'si |
| `arsiv/klasik/` | Klasik site, **arşiv**, yayında değil (`arsiv/klasik/README.md`) |
| `tests/` | v2 testleri |

Kök adres (`index.html`) `v2/`'ye yönlendiriyor.

## Yerelde çalıştırma

```bash
npm install
npm run dev      # http://localhost:8000/v2/
npm test
```

Backend için:

```bash
docker compose up
# API   http://localhost:4000/api/admin/health
```

## Yayın

Site **yalnızca `main` dalından** yayınlanır
(`.github/workflows/pages.yml`): https://bedirinci.github.io/mola360/v2/
Backend ve `arsiv/` yayına çıkmaz. Bir dala push etmek yayındaki siteyi
değiştirmez.

Her push ve PR'da testler çalışır (`.github/workflows/ci.yml`).
