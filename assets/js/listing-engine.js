/* ---------------- liste motoru: süzme, sayım, sıralama, adres ----------------
   Liste sayfalarının (/turlar/, /turlar/karadeniz-turlari/, /temalar/…)
   süzgeç mantığı. SAF: DOM'a, veri dosyalarına ve taksonomiye
   dokunmuyor. Girdisi "liste satırları" (veri kapısı üretiyor,
   data-gateway.js kapiListeSatiri) ve alan tanımları; çıktısı süzülmüş,
   sıralanmış satırlar ve her seçeneğin kaç sonuç vereceği.

   Neden ayrı dosya: backend geldiğinde süzme ve sayım sunucuda
   yapılacak (tek sorgu, sonuç + sayımlar). Bu dosya o sorgunun
   tanımı; aynı kurallar oraya taşınacak, ekran değişmeyecek.

   KURALLAR
     - Bir alan içindeki seçenekler VEYA: Bölge = Ege, Akdeniz → ikisinden
       biri.
     - Alanlar arası VE: Bölge = Ege VE Ulaşım = Otobüs.
     - Seçeneğin yanındaki sayı, O ALAN HARİÇ diğer seçimler geçerliyken
       o seçeneğin sonuç sayısı. "Ege (4)" gördüysen tıklayınca 4 sonuç
       çıkar; kendi alanındaki diğer seçim sayıyı değiştirmez, çünkü
       alan içi VEYA.
     - Satırdaki değer null ise o alan satır için "her değer": her gün
       açık bir otel her aya uyar. Boş dizi ise "hiçbiri": turun süre
       dilimi var, otelin yok.
     - Hiçbir sonucu daraltmayan alan gösterilmiyor (bütün turlar
       otobüslüyse "Ulaşım: Otobüs" süzgeci gürültüdür).

   ADRES: seçimler sorgu dizisinde durur (?bolge=ege,akdeniz&sirala=
   fiyat-artan). Sıra alan tanımının sırası, böylece aynı seçim hep aynı
   adresi üretir. Motora ait olmayan parametreler (utm_source gibi)
   ekranda korunur; burada yazılmaz.

   ADLAR: klasik <script> etiketleri üst kapsamı paylaştığı için bu
   dosyanın bütün üst seviye adları SUZ_ / suz ile başlıyor. */

/* Sayfa başına kart. "Daha fazla göster" bir sayfa daha açar; adres
   ?sayfa=N ile açılan sayfa sayısını tutar (geri gelen ziyaretçi
   kaldığı yerde). */
const SUZ_SAYFA_BOYU = 24;

const SUZ_SIRALAMALAR = [
  { slug: 'onerilen',     name: 'Önerilen' },
  { slug: 'fiyat-artan',  name: 'Fiyat: Artan' },
  { slug: 'fiyat-azalan', name: 'Fiyat: Azalan' },
  { slug: 'tarih',        name: 'En yakın tarih' },
  { slug: 'puan',         name: 'Puan: Yüksek' }
];

/* Süre dilimleri: turun gece sayısından. Günübirlik tur 0 gece. */
const SUZ_SURE_DILIMLERI = [
  { slug: 'gunubirlik',  name: 'Günübirlik', min: 0, max: 0 },
  { slug: '1-2-gece',    name: '1-2 gece',   min: 1, max: 2 },
  { slug: '3-5-gece',    name: '3-5 gece',   min: 3, max: 5 },
  { slug: '6-gece-ustu', name: '6 gece ve üzeri', min: 6, max: Infinity }
];

/* Fiyat dilimleri TL: [alt, üst). Tahsilat TL olduğu için döviz fiyatlı
   ürün TL karşılığıyla (günün kuru) aranıyor; bağlayıcı kur
   rezervasyonda sabitleniyor (docs/veri-sozlesmesi.md bölüm 7). Adres
   serbest aralık da kabul ediyor: ?fiyat=500-2000. */
const SUZ_FIYAT_DILIMLERI = [
  { slug: '0-1000',      name: '1.000 TL altı' },
  { slug: '1000-2500',   name: '1.000 – 2.500 TL' },
  { slug: '2500-5000',   name: '2.500 – 5.000 TL' },
  { slug: '5000-10000',  name: '5.000 – 10.000 TL' },
  { slug: '10000-',      name: '10.000 TL üstü' }
];

/* Puan eşikleri 5 üzerinden; otelin 10'luk puanı satırda 5'liğe
   çevrilmiş olarak durur. */
const SUZ_PUAN_ESIKLERI = [
  { slug: '4.5', name: '4,5 ve üzeri' },
  { slug: '4',   name: '4 ve üzeri' }
];

/* "Önerilen" sıralamanın ağırlığı: az yorumlu yüksek puan, çok yorumlu
   biraz daha düşük puanın önüne geçmesin diye puan, sitenin ortalama
   puanına doğru yorum sayısıyla orantılı çekiliyor (Bayes ortalaması).
   Backend geldiğinde satış verisi de girecek. */
const SUZ_ONERI = { ortalama: 4.3, agirlik: 50 };

/* ---------------- küçük yardımcılar ---------------- */
function suzBinlik(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/* "500-2000" → { alt: 500, ust: 2000 }; "10000-" → { alt: 10000, ust: null }.
   Geçersizse null. */
function suzAralik(metin) {
  const m = String(metin || '').match(/^(\d*)-(\d*)$/);
  if (!m || (m[1] === '' && m[2] === '')) return null;
  const alt = m[1] === '' ? 0 : Number(m[1]);
  const ust = m[2] === '' ? null : Number(m[2]);
  if (ust !== null && ust <= alt) return null;
  return { alt, ust };
}

function suzAralikAdi(metin, birim) {
  const a = suzAralik(metin);
  if (!a) return '';
  const b = birim || 'TL';
  if (!a.alt) return suzBinlik(a.ust) + ' ' + b + ' altı';
  if (a.ust === null) return suzBinlik(a.alt) + ' ' + b + ' üstü';
  return suzBinlik(a.alt) + ' – ' + suzBinlik(a.ust) + ' ' + b;
}

function suzSureDilimi(geceler) {
  if (geceler === null || geceler === undefined || !Number.isFinite(Number(geceler))) return null;
  const g = Math.max(0, Math.round(Number(geceler)));
  const d = SUZ_SURE_DILIMLERI.find(x => g >= x.min && g <= x.max);
  return d ? d.slug : null;
}

/* ---------------- eşleşme ----------------
   Alan türleri:
     coklu   satir.facets[key] dizisi seçilenlerden birini içeriyor mu
             (null → her değere uyar)
     aralik  satir[field] sayısı [alt, üst) içinde mi (currency verilmişse
             yalnızca o para birimindeki satırlar)
   notKosulu: alanın notu ne zaman görünür — 'joker' (listede "her
   değer" satırı var), 'doviz' (döviz fiyatlı satır var), yoksa her zaman.
     esik    satir[field] >= değer
     bayrak  satir[field] doğru mu */
function suzEslesir(satir, alan, degerler) {
  if (!degerler || !degerler.length) return true;
  const tur = alan.kind || 'coklu';
  if (tur === 'coklu') {
    const v = satir.facets ? satir.facets[alan.key] : undefined;
    if (v === null) return true;
    if (!Array.isArray(v)) return false;
    return degerler.some(d => v.indexOf(d) !== -1);
  }
  if (tur === 'aralik') {
    const a = suzAralik(degerler[0]);
    if (!a) return true;
    if (alan.currency && (satir.currency || 'TRY') !== alan.currency) return false;
    const p = Number(satir[alan.field]) || 0;
    return p > 0 && p >= a.alt && (a.ust === null || p < a.ust);
  }
  if (tur === 'esik') {
    const x = satir[alan.field];
    return x !== null && x !== undefined && Number(x) >= Number(degerler[0]);
  }
  if (tur === 'bayrak') return !!satir[alan.field];
  return true;
}

/* Seçimlerin hepsine uyan satırlar. haric: sayım için bir alanı dışarıda
   bırakır. */
function suzUygula(satirlar, alanlar, secim, haric) {
  const s = secim || {};
  const etkin = (alanlar || []).filter(a => a.key !== haric && s[a.key] && s[a.key].length);
  if (!etkin.length) return (satirlar || []).slice();
  return (satirlar || []).filter(satir => etkin.every(a => suzEslesir(satir, a, s[a.key])));
}

/* ---------------- yüzeyler (seçenek + sayı) ----------------
   Her alan için: görünür mü, seçenekleri, her seçeneğin sonuç sayısı ve
   seçili olup olmadığı. Sayısı 0 olan seçilmemiş seçenek listelenmiyor
   (menüdeki 9 bölgeden yalnızca bu sayfada ürünü olanlar). */
function suzYuzeyler(satirlar, alanlar, secim) {
  const s = secim || {};
  return (alanlar || []).map(alan => {
    const taban = suzUygula(satirlar, alanlar, s, alan.key);
    const secili = s[alan.key] || [];
    const secenekler = (alan.options || []).map(o => ({
      slug: o.slug,
      name: o.name,
      adet: taban.filter(satir => suzEslesir(satir, alan, [o.slug])).length,
      secili: secili.indexOf(o.slug) !== -1
    }));
    /* Adresten gelen serbest fiyat aralığı seçeneklerde yoksa görünür
       kalsın (kaldırılabilsin). */
    secili.forEach(d => {
      if (secenekler.some(o => o.slug === d)) return;
      secenekler.push({
        slug: d,
        name: alan.kind === 'aralik' ? suzAralikAdi(d) : d,
        adet: taban.filter(satir => suzEslesir(satir, alan, [d])).length,
        secili: true
      });
    });
    const gorunenler = secenekler.filter(o => o.adet > 0 || o.secili);
    const daraltir = gorunenler.some(o => o.adet > 0 && o.adet < taban.length);
    /* Alanın notu yalnızca işe yaradığı sayfada: "her gün satılanlar her
       ayda listelenir" notu yalnızca listede öyle ürün varsa, "döviz
       fiyatlılar TL süzgecinde yok" notu yalnızca döviz fiyatlı ürün
       varsa. */
    const tur = alan.kind || 'coklu';
    const notGerekli = alan.notKosulu === 'joker'
      ? taban.some(satir => satir.facets && satir.facets[alan.key] === null)
      : (alan.notKosulu === 'doviz'
        ? taban.some(satir => (satir.currency || 'TRY') !== 'TRY')
        : true);
    return {
      key: alan.key,
      name: alan.name,
      kind: tur,
      note: alan.note && notGerekli ? alan.note : '',
      gorunur: secili.length > 0 || daraltir,
      secenekler: gorunenler
    };
  });
}

/* Seçili süzgeçlerin etiketleri (sonuçların üstündeki kaldırılabilir
   çipler). */
function suzEtiketler(alanlar, secim) {
  const s = secim || {};
  const out = [];
  (alanlar || []).forEach(alan => {
    (s[alan.key] || []).forEach(d => {
      /* Seçeneğin kısa etiketi varsa çipte o yazıyor ("Yalnızca
         indirimliler" yerine "İndirimli"). */
      const o = (alan.options || []).find(x => x.slug === d);
      const ad = o ? (o.etiket || o.name) : (alan.kind === 'aralik' ? suzAralikAdi(d) : d);
      out.push({ key: alan.key, slug: d, name: ad });
    });
  });
  return out;
}

/* ---------------- sıralama ---------------- */
function suzOneriPuani(satir) {
  const r = Number(satir.rating);
  const v = Math.max(0, Number(satir.ratingCount) || 0);
  if (!Number.isFinite(r) || satir.rating === null || satir.rating === undefined) {
    return SUZ_ONERI.ortalama * 0.9;
  }
  return (r * v + SUZ_ONERI.ortalama * SUZ_ONERI.agirlik) / (v + SUZ_ONERI.agirlik);
}

function suzBaslikKarsilastir(a, b) {
  return String(a.title || '').localeCompare(String(b.title || ''), 'tr');
}

/* Fiyat sıralaması TL karşılığıyla (priceTRY; tahsilat TL). TL
   karşılığı bilinmeyen döviz fiyatlı satır (kur yok) sonda kendi
   içinde; fiyatı olmayan (0) en sonda. */
function suzFiyatAnahtari(satir) {
  const tl = satir.priceTRY !== undefined && satir.priceTRY !== null
    ? Number(satir.priceTRY) || 0
    : ((satir.currency || 'TRY') === 'TRY' ? Number(satir.price) || 0 : null);
  if (tl === null) return [1, (Number(satir.price) || 0) > 0 ? 0 : 1, Number(satir.price) || 0];
  return [0, tl > 0 ? 0 : 1, tl];
}

function suzSirala(satirlar, anahtar) {
  const liste = (satirlar || []).slice();
  const oneri = (a, b) => (suzOneriPuani(b) - suzOneriPuani(a))
    || ((Number(b.ratingCount) || 0) - (Number(a.ratingCount) || 0))
    || suzBaslikKarsilastir(a, b);
  const fiyat = (yon) => (a, b) => {
    const x = suzFiyatAnahtari(a), y = suzFiyatAnahtari(b);
    return (x[0] - y[0]) || (x[1] - y[1]) || (yon * (x[2] - y[2])) || oneri(a, b);
  };
  const sirala = {
    'onerilen': oneri,
    'fiyat-artan': fiyat(1),
    'fiyat-azalan': fiyat(-1),
    'tarih': (a, b) => {
      if (a.nextDate && b.nextDate && a.nextDate !== b.nextDate) return a.nextDate < b.nextDate ? -1 : 1;
      if (!!a.nextDate !== !!b.nextDate) return a.nextDate ? -1 : 1;
      return oneri(a, b);
    },
    'puan': (a, b) => {
      const x = a.rating === null || a.rating === undefined ? -1 : Number(a.rating);
      const y = b.rating === null || b.rating === undefined ? -1 : Number(b.rating);
      return (y - x) || ((Number(b.ratingCount) || 0) - (Number(a.ratingCount) || 0)) || suzBaslikKarsilastir(a, b);
    }
  }[anahtar] || oneri;
  return liste.sort(sirala);
}

/* ---------------- adres: sorgu dizisi ↔ durum ----------------
   durum = { secim: { bolge: ['ege'] … }, siralama: 'onerilen', sayfa: 1 }
   Tanınmayan değer atılır (?bolge=xyz sessizce yok sayılır); sayfa
   kırılmaz. */
function suzParametreler(sorgu) {
  const out = {};
  String(sorgu || '').replace(/^\?/, '').split('&').forEach(parca => {
    if (!parca) return;
    const i = parca.indexOf('=');
    const ham = i === -1 ? [parca, ''] : [parca.slice(0, i), parca.slice(i + 1)];
    let k, v;
    try {
      k = decodeURIComponent(ham[0].replace(/\+/g, ' '));
      v = decodeURIComponent(ham[1].replace(/\+/g, ' '));
    } catch (_) { return; }
    if (!(k in out)) out[k] = v;
  });
  return out;
}

function suzOku(sorgu, alanlar) {
  const p = suzParametreler(sorgu);
  const secim = {};
  (alanlar || []).forEach(alan => {
    const ham = p[alan.key];
    if (ham === undefined || ham === '') return;
    const tur = alan.kind || 'coklu';
    const gecerli = (alan.options || []).map(o => o.slug);
    let degerler = [];
    if (tur === 'coklu') {
      degerler = ham.split(',').map(x => x.trim()).filter((x, i, d) => x && d.indexOf(x) === i && gecerli.indexOf(x) !== -1);
    } else if (tur === 'aralik') {
      if (suzAralik(ham)) degerler = [ham];
    } else if (tur === 'esik') {
      if (gecerli.indexOf(ham) !== -1) degerler = [ham];
    } else if (tur === 'bayrak') {
      if (ham === '1') degerler = ['1'];
    }
    if (degerler.length) secim[alan.key] = degerler;
  });
  const siralama = SUZ_SIRALAMALAR.some(x => x.slug === p.sirala) ? p.sirala : 'onerilen';
  const sayfa = /^\d+$/.test(p.sayfa || '') ? Math.max(1, Math.min(50, Number(p.sayfa))) : 1;
  return { secim, siralama, sayfa };
}

/* Motora ait parametre adları: ekran adresi yeniden yazarken bunların
   dışındakileri korur. */
function suzSahipOlunanlar(alanlar) {
  return (alanlar || []).map(a => a.key).concat(['sirala', 'sayfa']);
}

function suzYaz(durum, alanlar) {
  const d = durum || {};
  const s = d.secim || {};
  const out = [];
  (alanlar || []).forEach(alan => {
    const v = s[alan.key];
    if (v && v.length) out.push(alan.key + '=' + v.map(x => encodeURIComponent(x)).join(','));
  });
  if (d.siralama && d.siralama !== 'onerilen') out.push('sirala=' + d.siralama);
  if (d.sayfa && d.sayfa > 1) out.push('sayfa=' + d.sayfa);
  return out.join('&');
}

/* Bir seçeneği aç/kapat; yeni durum döner (eskisi değişmez). Tek
   seçimli alanlarda (aralik, esik, bayrak) yeni değer eskisinin yerine
   geçer. Seçim değişince sayfa 1'e döner. */
function suzDegistir(durum, alan, deger) {
  const d = durum || {};
  const secim = Object.assign({}, d.secim || {});
  const eski = secim[alan.key] || [];
  let yeni;
  if ((alan.kind || 'coklu') === 'coklu') {
    yeni = eski.indexOf(deger) !== -1 ? eski.filter(x => x !== deger) : eski.concat([deger]);
  } else {
    yeni = eski.indexOf(deger) !== -1 ? [] : [deger];
  }
  if (yeni.length) secim[alan.key] = yeni;
  else delete secim[alan.key];
  return { secim, siralama: d.siralama || 'onerilen', sayfa: 1 };
}

/* ---------------- tek çağrı ----------------
   Ekranın ihtiyacı olan her şey: toplam, gösterilecek satırlar (sayfa
   sayfa), yüzeyler ve etiketler. */
function suzListe(satirlar, alanlar, durum) {
  const d = durum || {};
  const secim = d.secim || {};
  const suzulen = suzUygula(satirlar, alanlar, secim);
  const sirali = suzSirala(suzulen, d.siralama);
  const sayfa = Math.max(1, Number(d.sayfa) || 1);
  const boy = SUZ_SAYFA_BOYU * sayfa;
  return {
    toplam: sirali.length,
    satirlar: sirali.slice(0, boy),
    dahaVar: sirali.length > boy,
    yuzeyler: suzYuzeyler(satirlar, alanlar, secim),
    etiketler: suzEtiketler(alanlar, secim),
    siralama: d.siralama || 'onerilen',
    sayfa
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUZ_SAYFA_BOYU,
    SUZ_SIRALAMALAR,
    SUZ_SURE_DILIMLERI,
    SUZ_FIYAT_DILIMLERI,
    SUZ_PUAN_ESIKLERI,
    SUZ_ONERI,
    suzBinlik,
    suzAralik,
    suzAralikAdi,
    suzSureDilimi,
    suzEslesir,
    suzUygula,
    suzYuzeyler,
    suzEtiketler,
    suzOneriPuani,
    suzSirala,
    suzParametreler,
    suzOku,
    suzSahipOlunanlar,
    suzYaz,
    suzDegistir,
    suzListe
  };
}
