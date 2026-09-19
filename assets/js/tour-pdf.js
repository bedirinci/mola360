/* ---------------- tur belgesini PDF olarak indir ----------------

   Dugmeye basilinca PDF dosyasi DOGRUDAN iniyor; tarayicinin yazdirma
   penceresi acilmiyor. Tarayici kendi baski ciktisini programa
   vermedigi icin belge burada bastan uretiliyor (pdfmake).

   Kutuphane sayfayla birlikte YUKLENMIYOR: ~1,9 MB'lik iki dosya
   yalnizca dugmeye ilk basista, bir kez indiriliyor. Sayfayi normal
   gezen ziyaretciye maliyeti sifir.

   Metin vektorel kaliyor -- secilebilir, aranabilir, her olcekte net.
   Fotograflar PDF'e gomulebilmek icin once veri adresine cevriliyor;
   uzak sunucu izin vermezse belge fotografsiz uretiliyor, hic
   uretilmemesindense.

   Ekrandaki isaretlemeden uretilmiyor, tur kaydindan uretiliyor:
   assets/css/tour.css'teki @media print belgesiyle ayni veriyi
   kullaniyor, tests/tour.test.js ikisinin ayni bolumleri tasidigini
   dogruluyor. */

window.Mola360TourPdf = (function () {
  'use strict';

  const KOK = document.body.getAttribute('data-root') || '';
  const BETIKLER = [KOK + 'assets/js/vendor/pdfmake.min.js',
                    KOK + 'assets/js/vendor/vfs_fonts.js'];

  /* Marka renkleri. style.css'teki degiskenlerin karsiligi; pdfmake
     CSS degiskeni okuyamadigi icin burada birebir tekrarlaniyor. */
  const R = {
    lacivert:     '#10193C',
    lacivertKoyu: '#1B2547',
    metin:        '#1B2547',
    soluk:        '#6B7490',
    yesil:        '#2F7D32',
    yesilAcik:    '#9BD34F',
    cizgi:        '#DDE3F2',
    cizgiAcik:    '#E6EAF5',
    zeminAcik:    '#FAFBFE',
    zeminMavi:    '#F2F5FC',
    beyaz:        '#FFFFFF'
  };

  const SAYFA_GENISLIK = 595.28 - 72;   // A4 - kenar bosluklari (pt)

  /* ---- kutuphaneyi bir kez yukle ---- */
  let yuklendi = null;
  function betikYukle(src) {
    return new Promise((tamam, hata) => {
      const el = document.createElement('script');
      el.src = src;
      el.onload = tamam;
      el.onerror = () => hata(new Error(src + ' yüklenemedi'));
      document.head.appendChild(el);
    });
  }
  function kutuphane() {
    /* Sirali yukleniyor: vfs_fonts kendini pdfMake'e kaydediyor,
       dolayisiyla pdfmake ondan ONCE hazir olmali. */
    if (!yuklendi) yuklendi = BETIKLER.reduce(
      (zincir, src) => zincir.then(() => betikYukle(src)), Promise.resolve());
    return yuklendi;
  }

  /* ---- fotograflari veri adresine cevir ---- */
  function gorselAl(url) {
    return fetch(url, { mode: 'cors' })
      .then(y => { if (!y.ok) throw new Error(y.status); return y.blob(); })
      .then(blob => new Promise((tamam, hata) => {
        const okuyucu = new FileReader();
        okuyucu.onload = () => tamam(okuyucu.result);
        okuyucu.onerror = hata;
        okuyucu.readAsDataURL(blob);
      }));
  }

  /* Hicbiri gelmezse belge fotografsiz uretilir. */
  function gorselleriAl(adresler) {
    return Promise.all(adresler.map(u => gorselAl(u).catch(() => null)));
  }

  /* ---- ikon ---- */
  /* tourSvg currentColor kullaniyor; pdfmake bunu cozemedigi icin renk
     yerine yaziliyor. */
  function ikon(ad, renk, boyut) {
    return { svg: tourSvg(ad).replace(/currentColor/g, renk), width: boyut || 11 };
  }

  /* ---- kucuk yapi taslari ---- */
  function baslik(metin) {
    return {
      text: metin,
      style: 'h2',
      margin: [0, 14, 0, 6],
      /* Baslik sayfanin dibinde yalniz kalmasin. */
      headlineLevel: 1
    };
  }

  /* Ince bir alt cizgi: ekrandaki yesil ayrac. */
  function ayrac() {
    return {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: SAYFA_GENISLIK, y2: 0,
                 lineWidth: 1.5, lineColor: R.yesilAcik }],
      margin: [0, 0, 0, 7]
    };
  }

  function bolumBasligi(metin) {
    return { stack: [baslik(metin), ayrac()], unbreakable: false };
  }

  /* Bir bilgi bolumu sayfa ortasinda IKIYE BOLUNMESIN: sigmiyorsa
     tamami sonraki sayfaya gecsin. "Fiyata dahil olanlar"in yarisi bir
     sayfada yarisi digerinde kaliyordu.

     Program bu sarmalayiciya girmiyor: sekiz duraklik bir program tek
     sayfaya sigmayabiliyor, sigmayan bir unbreakable blok ise tasip
     kirpilir. Orada bolunme serbest ama HER DURAK kendi icinde
     butun -- program() icindeki dontBreakRows bunu sagliyor. */
  function bolum(baslikMetni, ...icerik) {
    return {
      stack: [bolumBasligi(baslikMetni), ...icerik.filter(Boolean)],
      unbreakable: true
    };
  }

  /* Cizgisiz tablo: yalnizca satir alti ince ayrac. */
  const DUZ = {
    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0 : 0.5,
    vLineWidth: () => 0,
    hLineColor: () => R.cizgiAcik,
    paddingLeft: () => 0,
    paddingRight: (i, node) => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4
  };

  /* Tamamen bos tablo duzeni: kart izgaralari icin. */
  const BOS = {
    hLineWidth: () => 0, vLineWidth: () => 0,
    paddingLeft: () => 0, paddingRight: () => 0,
    paddingTop: () => 0, paddingBottom: () => 0
  };

  function isaretliListe(ogeler, ad, renk) {
    return {
      table: {
        widths: [12, '*'],
        body: ogeler.map(m => [
          { ...ikon(ad, renk, 9), margin: [0, 2, 0, 0] },
          { text: m, style: 'govde' }
        ])
      },
      layout: { ...BOS, paddingBottom: () => 3.5, paddingRight: () => 4 }
    };
  }

  /* ---- belgenin bolumleri ---- */

  function kapak(tur, heroVeri, logoVeri) {
    const ustBlok = heroVeri
      ? { image: heroVeri, width: SAYFA_GENISLIK, height: 150, cover: { width: SAYFA_GENISLIK, height: 150 } }
      : { canvas: [{ type: 'rect', x: 0, y: 0, w: SAYFA_GENISLIK, h: 12, color: R.yesilAcik }] };

    const cipler = [tur.category, tur.area, tur.durationLabel, 'Tur kodu ' + tur.code];

    /* Gercek logo. Dosya kendi sunucumuzda oldugu icin her zaman
       geliyor; yine de gelmezse marka adi yaziyla basiliyor. */
    const marka = logoVeri
      ? { image: logoVeri, width: 74, margin: [0, 0, 0, 5] }
      : { text: 'MOLA360', style: 'marka' };

    return [
      ustBlok,
      {
        table: {
          widths: ['*'],
          body: [[{
            stack: [
              marka,
              { text: tur.title, style: 'h1' },
              { text: tur.tagline, style: 'kapakAlt' },
              { text: cipler.join('   ·   '), style: 'kapakCip', margin: [0, 7, 0, 0] }
            ],
            fillColor: R.lacivert,
            margin: [14, 12, 14, 13],
            border: [false, false, false, false]
          }]]
        },
        layout: BOS,
        margin: [0, 0, 0, 12]
      }
    ];
  }

  function fiyatSeridi(tur) {
    const p = tur.pricing;
    /* Grup buyuklugu BURADA yazilmaz: pricing.maxGuests tek bir
       rezervasyonun sinirini (6-9), seatsPerDeparture ise kalkistaki
       grubu (16-18) gosteriyor. Ilki "Grup" diye yazilinca kunye
       kartiyla celisiyordu; grup bilgisi facts'ten geliyor. */
    const sag = [
      ['Süre', tur.durationLabel],
      ['Kalkış günleri', p.departureNote],
      ['Kalkış saati', p.startTime]
    ];
    return {
      table: {
        widths: ['*', 'auto'],
        body: [[
          {
            stack: [
              { text: 'Başlangıç fiyatı', style: 'kucukEtiket' },
              { text: formatTRY(basePrice(tur)), style: 'fiyat' },
              { text: p.unitNote, style: 'kucukEtiket' }
            ],
            fillColor: R.zeminMavi, margin: [12, 9, 6, 9], border: [false, false, false, false]
          },
          {
            columns: sag.map(([e, d]) => ({
              width: 'auto',
              stack: [{ text: e, style: 'kucukEtiket', alignment: 'right' },
                      { text: d, style: 'seritDeger', alignment: 'right' }],
              margin: [10, 0, 0, 0]
            })),
            fillColor: R.zeminMavi, margin: [0, 11, 12, 9], border: [false, false, false, false]
          }
        ]]
      },
      layout: BOS,
      margin: [0, 0, 0, 4],
      unbreakable: true
    };
  }

  function kunyeKartlari(tur) {
    const kart = (o) => ({
      stack: [
        { ...ikon(o.icon, R.yesil, 12), margin: [0, 0, 0, 3] },
        { text: o.label.toUpperCase(), style: 'kartEtiket' },
        { text: o.value, style: 'kartDeger' },
        o.note ? { text: o.note, style: 'kartNot' } : {}
      ],
      fillColor: R.zeminAcik,
      margin: [8, 7, 8, 7]
    });
    const satirlar = [];
    for (let i = 0; i < tur.facts.length; i += 3) {
      satirlar.push(tur.facts.slice(i, i + 3).map(kart));
      while (satirlar[satirlar.length - 1].length < 3) satirlar[satirlar.length - 1].push({ text: '' });
    }
    return {
      table: { widths: ['*', '*', '*'], body: satirlar },
      layout: {
        hLineWidth: () => 4, vLineWidth: () => 4,
        hLineColor: () => R.beyaz, vLineColor: () => R.beyaz,
        paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0
      }
    };
  }

  function fotografSeridi(veriler, kareler) {
    const gelen = veriler.map((v, i) => ({ v: v, alt: kareler[i] && kareler[i].caption }))
      .filter(x => x.v);
    if (!gelen.length) return null;
    const g = (SAYFA_GENISLIK - (gelen.length - 1) * 6) / gelen.length;
    return {
      columns: gelen.map((x, i) => ({
        width: g,
        stack: [
          { image: x.v, width: g, height: 78, cover: { width: g, height: 78 } },
          { text: x.alt || '', style: 'altYazi', margin: [0, 3, 0, 0] }
        ],
        margin: [i ? 6 : 0, 0, 0, 0]
      })),
      margin: [0, 2, 0, 0],
      unbreakable: true
    };
  }

  function program(tur, konaklamali) {
    const satirlar = konaklamali
      ? tur.program.map(g => [g.day + '. gün', g.title, g.text,
          'Öğünler: ' + g.meals.join(', ') + ' · Konaklama: ' + g.overnight])
      : tur.itinerary.map(d => [d.time, d.title, d.text, '']);

    return {
      table: {
        /* Her durak/gun kendi icinde butun: satir sayfa ortasinda
           ikiye bolunmesin, sigmiyorsa tamami sonraki sayfaya gecsin. */
        dontBreakRows: true,
        widths: [52, '*'],
        body: satirlar.map(([etiket, bas, metin, alt]) => [
          { text: etiket, style: 'zaman' },
          {
            stack: [
              { text: bas, style: 'h3' },
              { text: metin, style: 'govde', margin: [0, 2, 0, 0] },
              alt ? { text: alt, style: 'altYazi', margin: [0, 2, 0, 0] } : {}
            ],
            margin: [9, 0, 0, 0]
          }
        ])
      },
      /* Solda tek bir dikey cizgi: duraklar tek akis gibi okunuyor. */
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (i) => (i === 1 ? 1.5 : 0),
        vLineColor: () => R.cizgiAcik,
        paddingLeft: () => 0, paddingRight: () => 0,
        paddingTop: () => 2, paddingBottom: () => 8
      }
    };
  }

  function bilgiTablosu(satirlar) {
    const dolu = satirlar.filter(s => s[1]);
    if (!dolu.length) return { text: '' };
    return {
      table: { widths: [130, '*'], body: dolu.map(([a, b]) => [
        { text: a, style: 'tabloBaslik' }, { text: b, style: 'govde' }]) },
      layout: DUZ,
      margin: [0, 4, 0, 0]
    };
  }

  function vurguKart(stack) {
    return {
      table: { widths: ['*'], body: [[{ stack: stack, fillColor: '#F6FAEF', margin: [10, 8, 10, 8] }]] },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (i) => (i === 0 ? 2 : 0),
        vLineColor: () => R.yesilAcik,
        paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0
      },
      margin: [0, 4, 0, 6],
      unbreakable: true
    };
  }

  function iptalKademeleri(tur) {
    return {
      table: {
        widths: [46, '*'],
        body: tur.cancellation.tiers.map(k => {
          const sifir = k.rate === 0;
          return [
            {
              table: { widths: ['*'], body: [[{
                text: '%' + Math.round(k.rate * 100),
                style: 'oran',
                color: sifir ? R.soluk : '#256B29',
                fillColor: sifir ? '#F1F2F6' : '#E8F4E4',
                margin: [0, 3, 0, 3]
              }]] },
              layout: BOS
            },
            {
              stack: [{ text: k.label, style: 'h3' },
                      { text: k.text, style: 'govde', margin: [0, 1, 0, 0] }],
              margin: [9, 1, 0, 0]
            }
          ];
        })
      },
      layout: { ...DUZ, paddingTop: () => 5, paddingBottom: () => 5 }
    };
  }

  function altBilgi(tur) {
    const adres = window.location.href.split('#')[0];
    return {
      table: { widths: ['*'], body: [[{
        stack: [
          { text: [
              { text: 'Bu belge bir bilet veya rezervasyon onayı değildir. ', color: R.yesilAcik, bold: true },
              { text: 'Bilgi amaçlıdır; fiyatlar ve program değişebilir. Güncel hâli için sayfayı ziyaret edin.' }
            ], style: 'altBilgi' },
          { text: adres, style: 'altBilgi', margin: [0, 3, 0, 0] },
          { text: 'Destek: ' + CONTACT.phoneLabel + ' · ' + CONTACT.hours +
                  ' · Belge tarihi: ' + formatTrDate(new Date()), style: 'altBilgi' }
        ],
        fillColor: R.lacivert, margin: [11, 9, 11, 9], border: [false, false, false, false]
      }]] },
      layout: BOS,
      margin: [0, 16, 0, 0],
      unbreakable: true
    };
  }

  /* ---- belgenin tamami ---- */
  function belge(tur, gorseller, logoVeri) {
    const konaklamali = tur.type === 'stay';
    const icerik = [];

    kapak(tur, gorseller[0], logoVeri).forEach(b => icerik.push(b));
    icerik.push(fiyatSeridi(tur));

    icerik.push(bolum('Öne çıkanlar',
      isaretliListe(tur.highlights, 'check', R.yesil)));

    icerik.push(bolum('Tur bilgileri', kunyeKartlari(tur)));

    const serit = fotografSeridi(gorseller.slice(1), tur.gallery.slice(1, 4));
    if (serit) icerik.push(serit);

    /* Program tek sayfaya sigmayabilir; bolum() sarmalayicisina
       girmiyor. Bolunme serbest, ama her durak kendi icinde butun. */
    icerik.push(bolumBasligi(konaklamali ? 'Gün gün program' : 'Günün programı'));
    icerik.push(program(tur, konaklamali));

    if (konaklamali) {
      const k = tur.accommodation;
      icerik.push(bolum('Konaklama',
        ...k.hotels.map(o => vurguKart([
          { text: o.name, style: 'h3' },
          { text: o.area + ' · ' + o.stars + ' yıldız · ' + o.nights + ' gece', style: 'altYazi' },
          { text: o.note, style: 'govde', margin: [0, 2, 0, 0] }
        ])),
        bilgiTablosu([
          ['Pansiyon', k.board], ['Kapsam', k.boardNote],
          ['Giriş / çıkış', k.checkIn + ' / ' + k.checkOut]
        ])));
    }

    /* Iki sutun AYNI hizadan bassin. Sag sutunda "Dahil olmayanlar"
       basligi varken sol sutunda yoktu; sag taraftaki liste bir satir
       asagidan basliyor ve baslik kaymis gorunuyordu. Artik iki sutunun
       da kendi basligi var, bolum basligi da ustune gore duzeltildi. */
    icerik.push(bolum('Fiyat kapsamı', {
      columns: [
        { width: '*', stack: [
            { text: 'Dahil olanlar', style: 'h3', margin: [0, 0, 0, 4] },
            isaretliListe(tur.included, 'check', R.yesil)
          ] },
        { width: '*', stack: [
            { text: 'Dahil olmayanlar', style: 'h3', margin: [0, 0, 0, 4] },
            isaretliListe(tur.excluded, 'close', '#98A0B5')
          ], margin: [14, 0, 0, 0] }
      ]
    }));

    const b = tur.meeting;
    icerik.push(bolum('Buluşma noktası',
      vurguKart([
        { text: b.title, style: 'h3' },
        { text: b.address, style: 'govde', margin: [0, 2, 0, 0] },
        b.dropoff ? { text: 'Dönüş: ' + b.dropoff, style: 'altYazi', margin: [0, 2, 0, 0] } : {}
      ]),
      (b.points && b.points.length)
        ? bilgiTablosu(b.points.map(n => [n.time, n.name + (n.note ? ' — ' + n.note : '')]))
        : null,
      { text: b.note, style: 'govde', margin: [0, 6, 0, 0] }));

    icerik.push(bolum('Yanınıza alın', isaretliListe(tur.bring, 'check', R.yesil)));

    /* Onemli bilgiler uyari, ozellik degil: tik yerine bilgi ikonu. */
    icerik.push(bolum('Önemli bilgiler', isaretliListe(tur.important, 'info', R.soluk)));

    icerik.push(bolum('İptal ve iade',
      iptalKademeleri(tur),
      { text: tur.cancellation.note, style: 'govde', margin: [0, 6, 0, 0] }));

    icerik.push(altBilgi(tur));

    return {
      info: {
        title: tur.title + ' — mola360',
        subject: tur.category + ' · Tur kodu ' + tur.code,
        author: 'mola360'
      },
      pageSize: 'A4',
      pageMargins: [36, 36, 36, 36],
      /* Bolum basligi sayfanin en altinda TEK BASINA kalmasin: altinda
         hicbir sey kalmadiysa basligi sonraki sayfaya at. baslik()
         icindeki headlineLevel bu kontrol icin konuyor. */
      pageBreakBefore: (simdiki, sonrakiler) =>
        simdiki.headlineLevel === 1 && sonrakiler.length === 0,
      content: icerik,
      defaultStyle: { font: 'Roboto', fontSize: 9, lineHeight: 1.35, color: R.metin },
      styles: {
        marka:       { fontSize: 8, bold: true, color: R.yesilAcik, characterSpacing: 1.2 },
        h1:          { fontSize: 17, bold: true, color: R.beyaz, margin: [0, 3, 0, 2], lineHeight: 1.15 },
        kapakAlt:    { fontSize: 9.5, color: '#D6DCF0' },
        kapakCip:    { fontSize: 8, color: '#AEB9DE' },
        h2:          { fontSize: 12.5, bold: true, color: R.lacivertKoyu },
        h3:          { fontSize: 9.5, bold: true, color: R.lacivertKoyu },
        govde:       { fontSize: 9 },
        altYazi:     { fontSize: 7.5, color: R.soluk },
        kucukEtiket: { fontSize: 7.5, color: R.soluk },
        fiyat:       { fontSize: 17, bold: true, color: R.lacivertKoyu, margin: [0, 1, 0, 1] },
        seritDeger:  { fontSize: 9, bold: true },
        kartEtiket:  { fontSize: 6.5, color: R.soluk, characterSpacing: .5 },
        kartDeger:   { fontSize: 9.5, bold: true, margin: [0, 1, 0, 0] },
        kartNot:     { fontSize: 7.5, color: R.soluk },
        zaman:       { fontSize: 9.5, bold: true, color: R.yesil },
        tabloBaslik: { fontSize: 9, bold: true, color: '#4A5372' },
        oran:        { fontSize: 9, bold: true, alignment: 'center' },
        altBilgi:    { fontSize: 7.5, color: '#C9D0E8' }
      }
    };
  }

  /* ---- belgeyi hazirla ---- */
  function hazirla(tur) {
    const adresler = [tur.gallery[0], ...tur.gallery.slice(1, 4)]
      .map(f => tourImage(f.key, 1000));
    return kutuphane()
      /* Logo kendi sunucumuzda: her zaman geliyor. Fotograflar uzak;
         gelmeyenin yerine null geciyor. */
      .then(() => Promise.all([
        gorselleriAl(adresler),
        gorselAl(KOK + 'assets/img/logo.png').catch(() => null)
      ]))
      .then(([gorseller, logo]) => pdfMake.createPdf(belge(tur, gorseller, logo)));
  }

  /* ---- disariya acilan fonksiyonlar ---- */

  /* Uretilen belge saklaniyor: ikinci dokunusta aninda sunuluyor.
     Asagidaki "dokunus suresi" sorununun cozumu de bu. */
  let hazirBlob = null;

  function dosyaAdi(tur) { return 'mola360-' + tur.slug + '.pdf'; }

  /* Son care: gizli bir bagla indir. */
  function bagIleIndir(blob, ad) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ad;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* Belgeyi kullaniciya SUNMA yolu, platforma gore degisiyor:

     1) Paylasim sayfasi (iPhone, Android). iOS'ta asil dogru yol bu:
        "Dosyalara Kaydet", "Hizli Bak" gibi secenekleri olan sistem
        sayfasi aciliyor. Blob adresli bir <a download> iOS Safari'de
        calismiyor -- dosyayi indirmek yerine sekmede aciyor, sikayet
        edilen davranis tam olarak buydu.

     2) Kaydetme penceresi (masaustu Chrome/Edge): nereye kaydedilecegi
        soruluyor.

     3) Digerleri: dogrudan indirme.

     Hem paylasim hem kaydetme penceresi KULLANICI HAREKETI icinde
     cagrilmak zorunda. Belge ilk uretimde birkac saniye suruyor ve o
     sure dolabiliyor; tarayici NotAllowedError atiyor. O durumda
     "tekrar" bildiriliyor: belge artik hazir oldugu icin kullanicinin
     ikinci dokunusu aninda sonuclaniyor. */
  function sun(tur, blob, bildir) {
    const ad = dosyaAdi(tur);

    if (navigator.canShare && typeof navigator.share === 'function') {
      let dosya = null;
      try { dosya = new File([blob], ad, { type: 'application/pdf' }); } catch (_) {}
      if (dosya && navigator.canShare({ files: [dosya] })) {
        return navigator.share({ files: [dosya], title: tur.title })
          .then(() => bildir('bitti'))
          .catch(h => {
            if (h && h.name === 'AbortError') return bildir('iptal');
            if (h && h.name === 'NotAllowedError') return bildir('tekrar');
            bagIleIndir(blob, ad);
            bildir('bitti');
          });
      }
    }

    if (typeof window.showSaveFilePicker === 'function') {
      return window.showSaveFilePicker({
        suggestedName: ad,
        types: [{ description: 'PDF belgesi', accept: { 'application/pdf': ['.pdf'] } }]
      })
        .then(tutamac => tutamac.createWritable()
          .then(yazici => yazici.write(blob).then(() => yazici.close())))
        .then(() => bildir('bitti'))
        .catch(h => {
          if (h && h.name === 'AbortError') return bildir('iptal');
          if (h && h.name === 'SecurityError') return bildir('tekrar');
          bagIleIndir(blob, ad);
          bildir('bitti');
        });
    }

    bagIleIndir(blob, ad);
    return Promise.resolve(bildir('bitti'));
  }

  function indir(tur, durum) {
    const bildir = (m) => { if (typeof durum === 'function') durum(m); return m; };

    /* Belge hazirsa dokunus henuz taze: paylasim/kaydetme hemen acilir. */
    if (hazirBlob) return Promise.resolve(sun(tur, hazirBlob, bildir));

    bildir('yukleniyor');
    return hazirla(tur)
      .then(pdf => pdf.getBlob())
      .then(blob => { hazirBlob = blob; return sun(tur, blob, bildir); })
      .catch(hata => { bildir('hata'); throw hata; });
  }

  /* Ctrl+P sayfayi degil BU belgeyi yazdirsin. pdfmake urettigi PDF'i
     gizli bir cerceveye koyup onu yazdiriyor.

     Sinir: yalnizca klavye kisayolu yakalanabiliyor. Tarayicinin kendi
     menusunden verilen yazdirma emri sayfayi basar -- bu yuzden
     tour.css'teki sade @media print blogu duruyor. */
  function yazdir(tur, durum) {
    const bildir = (m) => { if (typeof durum === 'function') durum(m); };
    bildir('yukleniyor');
    return hazirla(tur)
      .then(pdf => { pdf.print(); bildir('bitti'); })
      .catch(hata => { bildir('hata'); throw hata; });
  }

  return { indir: indir, yazdir: yazdir };
})();
