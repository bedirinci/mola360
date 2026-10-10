# Mola360 — çalışma kuralları

- Ürünün tek kaynağı `docs/PROJE.md`; vizyon `docs/VIZYON.md`. Bir işe
  başlamadan önce ikisini oku.
- Ürün v2'de (`v2/`). v2'nin bağlayıcı kuralları `docs/yeni-surum.md`
  "Bağlayıcı kurallar" bölümünde; her değişiklik onlara uyar.
- Bu aşamada öncelik v2'nin arayüzü (frontend).
- Klasik site `arsiv/klasik/` altında ve yayında değil. Ona kod ekleme,
  v2'ye ondan kod kopyalama; yalnızca başvuru kaynağı.
- Backend (`backend/`) korunuyor; mimarisi `docs/yonetim-sistemi.md`.
- Ürün kararı alınınca `docs/PROJE.md`'nin "Karar kaydı"na nedeni,
  etkilediği alanlar, teknik ve UX sonucuyla yazılır.
- Kullanıcıyla Türkçe konuşulur.

## Hızlı ve eksiksiz çalışma (Bedir, 2026-10-07)

Amaç: bir istek bekletmeden, eksiksiz ve doğru teslim edilir.

- **Teslim akışı, her istekte varsayılan; ayrıca sorulmaz:**
  1. `main`'den yeni dal açılır (`claude/<kısa-konu>`).
  2. Kod, test ve belge (Karar kaydı) aynı committe olur.
  3. Push, PR, CI yeşil olunca squash ile birleştirme. Site `main`'den
     kendiliğinden yayınlanır.
  - Soru yalnızca karar gerçekten Bedir'e aitse sorulur (ürün yönü, geri
    alınamaz iş). Geri kalanında makul varsayılan seçilir, sonuçta
    söylenir.
  - Asla: force-push, `arsiv/klasik/`'e kod, commit ya da PR'da model adı.
- **Komutlar:**
  - `npm run hizli`: tarayıcısız testler (~2 sn); çalışırken.
  - `npm test`: bütün testler (~45 sn); push'tan önce bir kez.
  - `npm run goruntu -- <sayfa…>`: telefon genişliğinde ekran görüntüsü
    (`.goruntu/`), konsol hatası ve yana taşma denetimi.
    - `--en 320`: dar ekran.
    - `--tam`: sayfanın tamamı.
    - `--ad once`: önce/sonra karşılaştırması için dosya adı öneki.
    - `--js-yok`: JavaScript kapalı.
    - `--kaydir <seçici>`: görüntüden önce o öğeye kaydırır.
  - `npm run seo`: veri, `v2/js/sehirler.js` ya da Liste/Ürün şablonu
    değişince SEO sayfalarını, Keşfet bağlarını ve site haritasını yeniden
    üretir. SEO kuralları `docs/seo.md`.
- **Nerede ne var (v2):**
  - **Tasarım tokenları:** `v2/css/tokens.css`. Yazı boyutu, kalınlık,
    satır yüksekliği, harf aralığı ve köşe burada; başka yerde ham değer
    yazılmaz, test yakalar.
  - **Stil dosyaları:**
    - `base.css`: sıfırlama ve gövde;
    - `components.css`: ortak bileşenler;
    - `sayfalar.css`: Liste, Ürün, Rezervasyon, Profil, Mesajlar…;
    - `kesfet.css`, `hikaye.css`.
  - **Veri:**
    - `v2/js/data.js`: ÖRNEK veri;
    - `v2/js/api.js`: tek veri katmanı;
    - `v2/js/icerik.js`: ürün sayfası içeriği;
    - `v2/js/sehirler.js`: şehirler ve SEO sayfa tanımları.
  - **Sayfa modülleri:** `v2/js/<sayfa>.js`. Ortak modüller: `shell.js`,
    `cards.js`, `ui.js`, `icons.js`.
  - **Üretilen dosyalar (elle değiştirilmez):**
    - `v2/izmir/…`, `v2/oteller/…`, `v2/turlar/…` (`npm run seo`);
    - `v2/sitemap.xml`;
    - `v2/index.html` içindeki kategori ve şehir blokları.
  - **Testler:**
    - `tests/v2.test.js`: statik kurallar;
    - `tests/v2-tarayici.test.js`: Chromium;
    - `tests/v2-takvim.test.js`.
- **Okuma:** `docs/PROJE.md` uzun. İşle ilgili bölüm ve Karar kaydının son
  girişleri yeterli: §14 tasarım, §15 teknik durum.
