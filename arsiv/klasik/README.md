# Klasik mola360 (arşiv)

3 Ekim 2026'da arşivlendi; yayında değil. Mola360 yeni vizyonla `v2/`
olarak devam ediyor (`docs/PROJE.md`, "Karar kaydı").

Neden duruyor:
- Backend'in göç betiği (`npm run import:legacy`) ve testleri, buradaki
  `assets/js/*-data.js` dosyalarını okuyor.
- Kurallar başvuru kaynağı: veri sözleşmesi (`docs/veri-sozlesmesi.md`),
  rezervasyon hesabı (`assets/js/booking-engine.js`), liste motoru
  (`assets/js/listing-engine.js`) ve sayfa belgeleri (`docs/`).

Buradaki dosyalar adreslerini depo köküne göre yazdığı için bu klasörden
çalışmaz, testleri (`tests/`) de çalıştırılmıyor. Son çalışan hali:
`1f29ce6` commit'i (`git checkout 1f29ce6`, ardından `npm run dev`).
