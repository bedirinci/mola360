/* ---------------- karekod (QR) üretici ----------------
   Biletin karekodu. Dış kütüphane yok; ISO/IEC 18004'ün bilet için
   gereken kısmı: bayt kipi (UTF-8), hata düzeltme seviyesi M (%15),
   sürüm 1 – 10 (en fazla 213 bayt). Bilet numarası gibi kısa metinler
   sürüm 2'ye sığıyor.

   Doğruluk testte bağımsız bir çözücüyle ölçülüyor
   (tests/karekod.test.js, jsQR): üretilen her karekod okunup aynı metin
   geri alınıyor.

   Karekodun İÇERİĞİ bugün bilet numarası. Canlıda sunucu imzalı bir
   değer olacak (numara + imza); girişte okutulan kod sunucuda
   doğrulanır, sahte kod üretilemez (sözleşme bölüm 14).

   ADLAR: üst seviye adlar KAREKOD_ / karekod ile başlıyor. */

/* Seviye M: [toplam kod sözcüğü, blok başına hata düzeltme sözcüğü,
   blok sayısı] sürüm 1 – 10. */
const KAREKOD_M = [
  null,
  [26, 10, 1], [44, 16, 1], [70, 26, 1], [100, 18, 2], [134, 24, 2],
  [172, 16, 4], [196, 18, 4], [242, 22, 4], [292, 22, 5], [346, 26, 5]
];
const KAREKOD_HIZALAMA = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

/* ---------------- GF(256) ve Reed-Solomon ---------------- */
function karekodCarp(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xFF;
}
function karekodBolen(derece) {
  const sonuc = new Array(derece).fill(0);
  sonuc[derece - 1] = 1;
  let kok = 1;
  for (let i = 0; i < derece; i++) {
    for (let j = 0; j < sonuc.length; j++) {
      sonuc[j] = karekodCarp(sonuc[j], kok);
      if (j + 1 < sonuc.length) sonuc[j] ^= sonuc[j + 1];
    }
    kok = karekodCarp(kok, 0x02);
  }
  return sonuc;
}
function karekodKalan(veri, bolen) {
  const sonuc = new Array(bolen.length).fill(0);
  veri.forEach(b => {
    const f = b ^ sonuc.shift();
    sonuc.push(0);
    bolen.forEach((c, i) => { sonuc[i] ^= karekodCarp(c, f); });
  });
  return sonuc;
}

/* ---------------- metin → kod sözcükleri ---------------- */
function karekodBaytlar(metin) {
  const s = String(metin === undefined || metin === null ? '' : metin);
  if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(s));
  return Array.from(unescape(encodeURIComponent(s))).map(c => c.charCodeAt(0));
}
function karekodVeriSozcugu(surum) {
  const [toplam, ecc, blok] = KAREKOD_M[surum];
  return toplam - ecc * blok;
}
/* Metnin sığdığı en küçük sürüm; sığmıyorsa 0. */
function karekodSurum(baytAdedi) {
  for (let v = 1; v <= 10; v++) {
    const bit = karekodVeriSozcugu(v) * 8;
    if (4 + (v < 10 ? 8 : 16) + baytAdedi * 8 <= bit) return v;
  }
  return 0;
}
function karekodSozcukler(baytlar, surum) {
  const bitler = [];
  const ekle = (deger, uzunluk) => { for (let i = uzunluk - 1; i >= 0; i--) bitler.push((deger >>> i) & 1); };
  ekle(0b0100, 4);
  ekle(baytlar.length, surum < 10 ? 8 : 16);
  baytlar.forEach(b => ekle(b, 8));
  const kapasite = karekodVeriSozcugu(surum) * 8;
  ekle(0, Math.min(4, kapasite - bitler.length));
  ekle(0, (8 - bitler.length % 8) % 8);
  for (let dolgu = 0xEC; bitler.length < kapasite; dolgu ^= 0xEC ^ 0x11) ekle(dolgu, 8);
  const veri = [];
  for (let i = 0; i < bitler.length; i += 8) veri.push(parseInt(bitler.slice(i, i + 8).join(''), 2));

  /* Bloklara böl, her bloğa hata düzeltme ekle, sütun sütun ör. */
  const [toplam, ecc, blokSayisi] = KAREKOD_M[surum];
  const kisaAdet = blokSayisi - toplam % blokSayisi;
  const kisaUzunluk = Math.floor(toplam / blokSayisi);
  const bolen = karekodBolen(ecc);
  const bloklar = [];
  for (let i = 0, k = 0; i < blokSayisi; i++) {
    const uzunluk = kisaUzunluk - ecc + (i < kisaAdet ? 0 : 1);
    const parca = veri.slice(k, k + uzunluk);
    k += uzunluk;
    bloklar.push({ veri: parca, ecc: karekodKalan(parca, bolen) });
  }
  const sonuc = [];
  const enUzun = Math.max(...bloklar.map(b => b.veri.length));
  for (let i = 0; i < enUzun; i++) bloklar.forEach(b => { if (i < b.veri.length) sonuc.push(b.veri[i]); });
  for (let i = 0; i < ecc; i++) bloklar.forEach(b => sonuc.push(b.ecc[i]));
  return sonuc;
}

/* ---------------- matris ---------------- */
function karekodIskelet(surum) {
  const n = surum * 4 + 17;
  const koyu = Array.from({ length: n }, () => new Array(n).fill(false));
  const sabit = Array.from({ length: n }, () => new Array(n).fill(false));
  const koy = (x, y, d) => { koyu[y][x] = !!d; sabit[y][x] = true; };

  for (let i = 0; i < n; i++) { koy(6, i, i % 2 === 0); koy(i, 6, i % 2 === 0); }
  const bulucu = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const u = Math.max(Math.abs(dx), Math.abs(dy));
        koy(x, y, u !== 2 && u !== 4);
      }
    }
  };
  bulucu(3, 3); bulucu(n - 4, 3); bulucu(3, n - 4);
  const hiza = KAREKOD_HIZALAMA[surum];
  hiza.forEach((a, i) => hiza.forEach((b, j) => {
    const kose = (i === 0 && j === 0) || (i === 0 && j === hiza.length - 1) || (i === hiza.length - 1 && j === 0);
    if (kose) return;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) koy(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }));
  /* Biçim alanları şimdilik ayrılıyor; maske seçilince yazılacak. */
  karekodBicim(koyu, sabit, 0, koy);
  if (surum >= 7) {
    let r = surum;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
    const bit = (surum << 12) | r;
    for (let i = 0; i < 18; i++) {
      const d = (bit >>> i) & 1, a = n - 11 + i % 3, b = Math.floor(i / 3);
      koy(a, b, d); koy(b, a, d);
    }
  }
  return { n, koyu, sabit };
}

/* Biçim bilgisi: seviye M (00) + maske, BCH(15,5). */
function karekodBicim(koyu, sabit, maske, koy) {
  const n = koyu.length;
  const veri = (0 << 3) | maske;
  let r = veri;
  for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
  const bit = ((veri << 10) | r) ^ 0x5412;
  const b = (i) => (bit >>> i) & 1;
  const yaz = koy || ((x, y, d) => { koyu[y][x] = !!d; sabit[y][x] = true; });
  for (let i = 0; i <= 5; i++) yaz(8, i, b(i));
  yaz(8, 7, b(6)); yaz(8, 8, b(7)); yaz(7, 8, b(8));
  for (let i = 9; i < 15; i++) yaz(14 - i, 8, b(i));
  for (let i = 0; i < 8; i++) yaz(n - 1 - i, 8, b(i));
  for (let i = 8; i < 15; i++) yaz(8, n - 15 + i, b(i));
  yaz(8, n - 8, 1);
}

const KAREKOD_MASKELER = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
  (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
  (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0
];

function karekodYerlestir(koyu, sabit, sozcukler) {
  const n = koyu.length;
  let i = 0;
  for (let sag = n - 1; sag >= 1; sag -= 2) {
    if (sag === 6) sag = 5;
    for (let d = 0; d < n; d++) {
      for (let j = 0; j < 2; j++) {
        const x = sag - j;
        const yukari = ((sag + 1) & 2) === 0;
        const y = yukari ? n - 1 - d : d;
        if (!sabit[y][x] && i < sozcukler.length * 8) {
          koyu[y][x] = ((sozcukler[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }
}

/* Okunabilirlik cezası (standardın dört kuralı); en düşük maske seçilir. */
function karekodCeza(koyu) {
  const n = koyu.length;
  let ceza = 0;
  const satirlar = [];
  for (let y = 0; y < n; y++) satirlar.push(koyu[y]);
  for (let x = 0; x < n; x++) satirlar.push(koyu.map(r => r[x]));
  const desen1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const desen2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  satirlar.forEach(s => {
    let uzunluk = 1;
    for (let i = 1; i <= n; i++) {
      if (i < n && s[i] === s[i - 1]) uzunluk++;
      else { if (uzunluk >= 5) ceza += uzunluk - 2; uzunluk = 1; }
    }
    for (let i = 0; i + 11 <= n; i++) {
      if (desen1.every((b, k) => (s[i + k] ? 1 : 0) === b) || desen2.every((b, k) => (s[i + k] ? 1 : 0) === b)) ceza += 40;
    }
  });
  for (let y = 0; y + 1 < n; y++) {
    for (let x = 0; x + 1 < n; x++) {
      const c = koyu[y][x];
      if (c === koyu[y][x + 1] && c === koyu[y + 1][x] && c === koyu[y + 1][x + 1]) ceza += 3;
    }
  }
  let koyuSay = 0;
  koyu.forEach(r => r.forEach(c => { if (c) koyuSay++; }));
  const toplam = n * n;
  ceza += (Math.ceil(Math.abs(koyuSay * 20 - toplam * 10) / toplam) - 1) * 10;
  return ceza;
}

/* Metnin karekod matrisi: { boyut, surum, maske, koyu: boolean[][] }.
   Sığmayan metin (213 bayttan uzun) için null. */
function karekodMatris(metin, zorlaMaske) {
  const baytlar = karekodBaytlar(metin);
  const surum = karekodSurum(baytlar.length);
  if (!surum) return null;
  const sozcukler = karekodSozcukler(baytlar, surum);
  let enIyi = null;
  const maskeler = (zorlaMaske >= 0 && zorlaMaske < 8) ? [zorlaMaske] : [0, 1, 2, 3, 4, 5, 6, 7];
  maskeler.forEach(m => {
    const { koyu, sabit } = karekodIskelet(surum);
    karekodYerlestir(koyu, sabit, sozcukler);
    const f = KAREKOD_MASKELER[m];
    for (let y = 0; y < koyu.length; y++) {
      for (let x = 0; x < koyu.length; x++) if (!sabit[y][x] && f(x, y)) koyu[y][x] = !koyu[y][x];
    }
    karekodBicim(koyu, sabit, m);
    const ceza = karekodCeza(koyu);
    if (!enIyi || ceza < enIyi.ceza) enIyi = { ceza, koyu, maske: m };
  });
  return { boyut: enIyi.koyu.length, surum, maske: enIyi.maske, koyu: enIyi.koyu };
}

/* SVG: tek yol, 4 modül sessiz alan. etiket: ekran okuyucu metni. */
function karekodSvg(metin, etiket) {
  const m = karekodMatris(metin);
  if (!m) return '';
  const kenar = 4;
  const boyut = m.boyut + kenar * 2;
  let yol = '';
  m.koyu.forEach((satir, y) => satir.forEach((d, x) => {
    if (d) yol += 'M' + (x + kenar) + ' ' + (y + kenar) + 'h1v1h-1z';
  }));
  const ad = String(etiket || 'Karekod').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return '<svg class="karekod" viewBox="0 0 ' + boyut + ' ' + boyut + '" role="img" aria-label="' + ad + '"'
    + ' shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">'
    + '<rect width="' + boyut + '" height="' + boyut + '" fill="#fff"/>'
    + '<path d="' + yol + '" fill="#000"/></svg>';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KAREKOD_M, karekodMatris, karekodSvg, karekodSurum, karekodBaytlar, karekodBolen, karekodKalan };
}
