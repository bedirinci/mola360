# vendor

Disaridan alinan, elle DEGISTIRILMEYEN dosyalar.

| dosya | kaynak | surum | ne ise yarar |
|---|---|---|---|
| `pdfmake.min.js` | [pdfmake](https://github.com/bpampuch/pdfmake) (MIT) | 0.3.11 | PDF uretimi |
| `vfs_fonts.js` | pdfmake dagitimi | 0.3.11 | Roboto (Turkce karakterleri kapsiyor) |

Ikisi de **yalnizca "PDF indir" dugmesine basilinca** yukleniyor
(`assets/js/tour-pdf.js`); sayfayi normal gezen ziyaretciye maliyeti yok.

`pdfmake.min.js` icindeki `sourceMappingURL` satiri silindi: .map dosyasi
depoya alinmadigi icin tarayici konsolunda 404 birakiyordu.

Guncellerken: `npm pack pdfmake@<surum>` ile indirip `build/` altindaki
iki dosyayi oldugu gibi kopyalayin, sourceMappingURL satirini silin ve
bu tabloyu guncelleyin.
