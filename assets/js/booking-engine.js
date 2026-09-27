/* ---------------- rezervasyon motoru: teklif, kapora, taksit, kampanya ----------------
   Ödeme ekranının bütün hesabı burada ve SAF: aynı seçim + aynı gün
   her yerde aynı teklifi verir (ürün sayfası özeti, ödeme ekranı,
   onay ekranı, testler). Backend geldiğinde bu hesabın bağlayıcı olanı
   sunucuda yapılacak; ekran yine bu dosyayla ön izleme gösterecek ve
   iki sonuç ayrışırsa sunucununki geçerli (sözleşme bölüm 13).

   KARARLAR (kullanıcı, 4. adım):
     - Tahsilat TL. Döviz fiyatlı üründe kur rezervasyonda sabitlenir;
       kapora da kalan da o kurla TL.
     - Turlarda %20 kapora. Kalan ödeme müşterinin tercihine göre
       turdan 1 gün önce ya da araçta; netleştirmek için kalkıştan 1 gün
       önce müşteri aranır.
     - Kart aileleri ve taksit oranları ÖRNEK; banka anlaşmalarına göre
       düzenlenecek (REZ_TAKSIT).

   Veri dosyaları (tour-data.js …) bu dosyadan ÖNCE yüklenir; adlar
   çağrı anında çözülüyor (Node'da modülden, tarayıcıda üst kapsamdan).

   ADLAR: üst seviye adlar REZ_ / rez ile başlıyor. */

const REZ_NODE = (typeof require === 'function' && typeof module !== 'undefined' && module.exports);
function rezModul(yol) {
  if (!REZ_NODE) return null;
  try { return require(yol); } catch (_) { return null; }
}
const REZ_VERI = {
  tour: rezModul('./tour-data.js'),
  hotel: rezModul('./hotel-data.js'),
  activity: rezModul('./activity-data.js'),
  event: rezModul('./event-data.js'),
  venue: rezModul('./venue-data.js')
};
/* Tarayıcıda üst kapsamdaki fonksiyon. Klasik betiklerin üst seviye
   function bildirimleri globalThis'te (const/let değil; buradan çağrılan
   adların hepsi function). O tipin veri dosyasını yüklemeyen sayfada ad
   yok: null döner, o tip "hesaplanamadı" sayılır. */
function rezFn(tip, ad) {
  const m = REZ_VERI[tip];
  if (m && typeof m[ad] === 'function') return m[ad];
  const g = (typeof globalThis !== 'undefined') ? globalThis : {};
  return typeof g[ad] === 'function' ? g[ad] : null;
}

/* ---------------- kurallar ---------------- */

/* Kapora: yalnızca turlarda. Kalkışa REZ_KAPORA.enAzGun'den az kaldıysa
   tamamı ödenir (kalanı arayıp netleştirecek zaman yok). */
const REZ_KAPORA = {
  oran: 0.20,
  tipler: ['tour'],
  enAzGun: 2,
  kalanSecenekleri: [
    { id: 'bir-gun-once', ad: 'Turdan 1 gün önce',
      aciklama: 'Kalan tutar kalkıştan bir gün önce kartla ya da havaleyle ödenir.' },
    { id: 'aracta', ad: 'Tur günü araçta',
      aciklama: 'Kalan tutar tur günü araçta rehbere nakit ya da kartla ödenir.' }
  ],
  arama: 'Kalkıştan bir gün önce sizi arayıp kalan ödemeyi seçtiğiniz şekilde netleştiriyoruz.'
};

/* Taksit: kart ailesine göre. BU TABLO ÖRNEK — oranlar ve taksit
   sayıları banka anlaşmaları ve BDDK sınırlarıyla güncellenecek. Oran,
   çekilen tutara eklenen vade farkı (0,0699 = %6,99). Ailesi bilinmeyen
   kart (banka kartı, ticari kart, yurt dışı kartı) tek çekim. */
const REZ_TAKSIT = {
  ornek: true,
  altSinir: 500,
  aileler: [
    { id: 'bonus',      ad: 'Bonus',      banka: 'Garanti BBVA',   oranlar: { 2: 0, 3: 0, 6: 0.0699, 9: 0.1049, 12: 0.1399 } },
    { id: 'world',      ad: 'World',      banka: 'Yapı Kredi',     oranlar: { 2: 0, 3: 0, 6: 0.0699, 9: 0.1049, 12: 0.1399 } },
    { id: 'maximum',    ad: 'Maximum',    banka: 'İş Bankası',     oranlar: { 2: 0, 3: 0, 6: 0.0689, 9: 0.1039, 12: 0.1389 } },
    { id: 'axess',      ad: 'Axess',      banka: 'Akbank',         oranlar: { 2: 0, 3: 0, 6: 0.0719, 9: 0.1079 } },
    { id: 'cardfinans', ad: 'CardFinans', banka: 'QNB',            oranlar: { 2: 0, 3: 0, 6: 0.0749, 9: 0.1099 } },
    { id: 'paraf',      ad: 'Paraf',      banka: 'Halkbank',       oranlar: { 2: 0, 3: 0, 6: 0.0709, 9: 0.1069 } },
    { id: 'bankkart',   ad: 'Bankkart',   banka: 'Ziraat Bankası', oranlar: { 2: 0, 3: 0, 6: 0.0729, 9: 0.1089 } }
  ],
  digerNot: 'Banka kartı, ticari kart ve yurt dışı kartlarla tek çekim yapılır.'
};

/* Kampanyalar. tur:
     otomatik  koşulu tutan rezervasyona kendiliğinden uygulanır
     kupon     kodu ödeme ekranında yazılınca uygulanır
   kapsam  tipler, kategoriler, temalar, urunler ('tip/slug'); boş = hepsi
   kosul   enAzGunOnce (kalkış/girişe en az N gün), enAzTutar (TL),
           cumaCumartesi (konaklama cuma VE cumartesi gecesini kapsıyor)
   indirim tutar (TL) | oran (+ enFazla TL) | geceOda (N gecelik oda bedeli)
   baslangic/bitis  geçerlilik (bugün dahil); boş = süresiz
   uyeOzel  yalnızca üyeye; kod kişiye özel (hesaptaki kuponlar)
   ilkRezervasyon  üyenin iptal edilmemiş rezervasyonu yoksa
   BU TABLO ÖRNEK; kampanyalar backend'de yönetilecek, kupon kodu
   sunucuda doğrulanacak. */
const REZ_KAMPANYALAR = [
  { kod: 'kapadokya-erken', tur: 'otomatik', etiket: 'Erken rezervasyon',
    ad: 'Kapadokya turlarında 500 TL erken rezervasyon indirimi',
    aciklama: 'Kalkışa 30 gün ve daha fazla varken alınan her Kapadokya turu rezervasyonunda, tüm kalkışlarda.',
    kapsam: { tipler: ['tour'], kategoriler: ['kapadokya-turlari'] },
    kosul: { enAzGunOnce: 30 },
    indirim: { tutar: 500 },
    sayfa: 'turlar/kapadokya-turlari' },
  { kod: 'otel-hafta-sonu', tur: 'otomatik', etiket: 'Hafta sonu',
    ad: 'Otellerde hafta sonu 2 gece kal, 1 gece öde',
    aciklama: 'Cuma ve cumartesi gecesini birlikte kapsayan konaklamada bir gecenin oda bedeli düşülür. Seçili termal ve şehir otellerinde.',
    kapsam: { tipler: ['hotel'], kategoriler: ['termal-oteller', 'sehir-otelleri'] },
    kosul: { cumaCumartesi: true },
    indirim: { geceOda: 1 },
    sayfa: 'oteller' },
  { kod: 'yeni-uye', tur: 'kupon', etiket: 'Yeni üyelere', uyeOzel: true, ilkRezervasyon: true,
    ad: 'İlk rezervasyonda %15 indirim',
    aciklama: 'Üyelikle birlikte kişiye özel kod e-postayla gönderilir; en fazla 1.500 TL.',
    kapsam: {}, kosul: {}, indirim: { oran: 0.15, enFazla: 1500 },
    sayfa: null },
  { kod: 'mola100', tur: 'kupon', kuponKodu: 'MOLA100', etiket: 'Kupon', ornek: true,
    ad: '1.000 TL ve üzeri rezervasyonda 100 TL indirim',
    aciklama: 'Tur, otel, aktivite ve etkinlik rezervasyonlarında; mekân kaporasında geçmez.',
    kapsam: { tipler: ['tour', 'hotel', 'activity', 'event'] },
    kosul: { enAzTutar: 1000 },
    indirim: { tutar: 100 },
    bitis: '2026-12-31',
    sayfa: null }
];

/* ---------------- tarih ve biçim ---------------- */
const REZ_AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz',
  'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const REZ_GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function rezISO(deger) {
  if (!deger) return '';
  if (deger instanceof Date) {
    if (isNaN(deger.getTime())) return '';
    return deger.getFullYear() + '-' + String(deger.getMonth() + 1).padStart(2, '0')
      + '-' + String(deger.getDate()).padStart(2, '0');
  }
  const m = String(deger).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return (d.getMonth() === Number(m[2]) - 1) ? m[1] + '-' + m[2] + '-' + m[3] : '';
}
function rezTarih(iso, saat) {
  const s = rezISO(iso);
  if (!s) return null;
  const [y, a, g] = s.split('-').map(Number);
  const hm = String(saat || '').match(/(\d{1,2}):(\d{2})/);
  return new Date(y, a - 1, g, hm ? Number(hm[1]) : 0, hm ? Number(hm[2]) : 0);
}
function rezGunEkle(iso, gun) {
  const d = rezTarih(iso);
  if (!d) return '';
  return rezISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + Math.round(Number(gun) || 0)));
}
function rezGunFarki(a, b) {
  const x = rezTarih(a), y = rezTarih(b);
  if (!x || !y) return null;
  return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate())
    - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000);
}
/* "1 Ekim 2026 Perşembe" (yıl, onay belgesinde gerekli) */
function rezTarihMetni(iso, yilsiz) {
  const d = rezTarih(iso);
  if (!d) return '';
  return d.getDate() + ' ' + REZ_AYLAR[d.getMonth()] + (yilsiz ? '' : ' ' + d.getFullYear())
    + ' ' + REZ_GUNLER[d.getDay()];
}
function rezSaat(metin) {
  const m = String(metin || '').match(/(\d{1,2}):(\d{2})/);
  return m ? m[1].padStart(2, '0') + ':' + m[2] : '';
}

/* Tutar: tam TL "1.290 TL", kuruşlu "1.290,50 TL". Döviz "€149". */
function rezSayi(n, kurus) {
  const t = Number(n) || 0;
  const tam = Math.floor(Math.abs(t));
  const k = Math.round((Math.abs(t) - tam) * 100);
  const binli = String(k === 100 ? tam + 1 : tam).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const isaret = t < 0 ? '-' : '';
  if (!kurus && k === 0) return isaret + binli;
  return isaret + binli + ',' + String(k === 100 ? 0 : k).padStart(2, '0');
}
function rezPara(tutar, birim, kurus) {
  const b = birim || 'TRY';
  if (b === 'EUR') return '€' + rezSayi(tutar, kurus);
  if (b === 'USD') return '$' + rezSayi(tutar, kurus);
  return rezSayi(tutar, kurus) + ' TL';
}
const rezKurus = (n) => Math.round((Number(n) || 0) * 100) / 100;

/* "3 – 11 yaş" -> { alt: 3, ust: 11 } */
function rezYasAraligi(metin) {
  const m = String(metin || '').match(/(\d{1,2})\s*[–-]\s*(\d{1,2})/);
  if (!m) return null;
  const alt = Number(m[1]), ust = Number(m[2]);
  return alt <= ust ? { alt, ust } : null;
}

/* ---------------- seçim: adres satırı ----------------
   Ürün sayfasındaki seçim ödeme ekranına adres satırıyla taşınıyor;
   paylaşılabilir ve geri tuşuyla bozulmuyor. Alanın türü:
     metin  tek değer   sayi  tam sayı   liste  virgüllü   bayrak  1/yok */
const REZ_ALANLAR = {
  tour: [['tarih', 'date', 'metin'], ['yetiskin', 'adults', 'sayi'], ['cocuk', 'children', 'sayi'],
    ['bebek', 'infants', 'sayi'], ['kalkis', 'city', 'metin'], ['tek', 'singleRoom', 'bayrak'],
    ['ek', 'addons', 'liste']],
  hotel: [['giris', 'checkIn', 'metin'], ['gece', 'nights', 'sayi'], ['oda', 'room', 'metin'],
    ['odaSayisi', 'rooms', 'sayi'], ['pansiyon', 'board', 'metin'], ['yetiskin', 'adults', 'sayi'],
    ['cocuk', 'children', 'sayi'], ['ek', 'addons', 'liste']],
  activity: [['tarih', 'date', 'metin'], ['seans', 'session', 'metin'], ['paket', 'pack', 'metin'],
    ['yetiskin', 'adults', 'sayi'], ['cocuk', 'children', 'sayi'], ['ek', 'addons', 'liste']],
  event: [['tarih', 'date', 'metin'], ['kategori', 'category', 'metin'], ['tam', 'full', 'sayi'],
    ['ogrenci', 'student', 'sayi'], ['ek', 'addons', 'liste']],
  venue: [['tarih', 'date', 'metin'], ['saat', 'slot', 'metin'], ['secenek', 'option', 'metin'],
    ['kisi', 'guests', 'sayi'], ['ek', 'addons', 'liste']]
};
const REZ_YOLLAR = { tour: 'tur', hotel: 'otel', activity: 'aktivite', event: 'etkinlik', venue: 'mekan' };

function rezSecimYaz(tip, secim) {
  const alanlar = REZ_ALANLAR[tip] || [];
  const s = secim || {};
  const parca = [];
  alanlar.forEach(([anahtar, alan, tur]) => {
    const v = s[alan];
    let yaz = '';
    if (tur === 'liste') yaz = (Array.isArray(v) ? v : []).filter(Boolean).join(',');
    else if (tur === 'bayrak') yaz = v ? '1' : '';
    else if (tur === 'sayi') yaz = (v === undefined || v === null || v === '') ? '' : String(Math.max(0, Math.floor(Number(v) || 0)));
    else yaz = v ? String(v) : '';
    if (yaz !== '') parca.push(anahtar + '=' + encodeURIComponent(yaz));
  });
  return parca.join('&');
}

/* Sorgu: '?a=b&…', URLSearchParams ya da düz nesne. */
function rezSorguNesnesi(sorgu) {
  if (!sorgu) return {};
  if (typeof sorgu.get === 'function' && typeof sorgu.forEach === 'function') {
    const o = {};
    sorgu.forEach((v, k) => { o[k] = v; });
    return o;
  }
  if (typeof sorgu === 'object') return sorgu;
  const o = {};
  String(sorgu).replace(/^\?/, '').split('&').forEach(p => {
    if (!p) return;
    const i = p.indexOf('=');
    const k = i === -1 ? p : p.slice(0, i);
    let v = i === -1 ? '' : p.slice(i + 1);
    try { v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (_) { /* olduğu gibi */ }
    try { o[decodeURIComponent(k)] = v; } catch (_) { o[k] = v; }
  });
  return o;
}

function rezSecimOku(tip, sorgu) {
  const o = rezSorguNesnesi(sorgu);
  const secim = {};
  (REZ_ALANLAR[tip] || []).forEach(([anahtar, alan, tur]) => {
    const v = o[anahtar];
    if (tur === 'liste') secim[alan] = v ? String(v).split(',').map(x => x.trim()).filter(Boolean) : [];
    else if (tur === 'bayrak') secim[alan] = v === '1' || v === 'true';
    else if (tur === 'sayi') { if (v !== undefined && v !== '') secim[alan] = Math.max(0, Math.floor(Number(v) || 0)); }
    else if (v) secim[alan] = String(v).slice(0, 60);
  });
  return secim;
}

/* Ödeme ekranının adresi (kök göreli): rezervasyon/?urun=tur/efes-sirince&tarih=… */
function rezOdemeYolu(tip, slug, secim) {
  const yol = REZ_YOLLAR[tip];
  if (!yol || !slug) return '';
  const s = rezSecimYaz(tip, secim);
  return 'rezervasyon/?urun=' + yol + '/' + encodeURIComponent(slug) + (s ? '&' + s : '');
}
/* 'tur/efes-sirince' -> { tip: 'tour', slug: 'efes-sirince' } */
function rezUrunCoz(deger) {
  const m = String(deger || '').replace(/^\/+|\/+$/g, '').match(/^([a-z]+)\/([a-z0-9-]+)$/);
  if (!m) return null;
  const tip = Object.keys(REZ_YOLLAR).find(t => REZ_YOLLAR[t] === m[1]);
  return tip ? { tip, slug: m[2] } : null;
}

/* ---------------- tipe göre uyarlayıcılar ----------------
   Her tip dört soruya cevap veriyor: tutar ne (kaydın kendi hesap
   fonksiyonu), ne zaman başlıyor, tarih satılabilir mi, kimler
   katılıyor. Ödeme kuralları tiplerden bağımsız. */
function rezPricing(kayit) { return (kayit && kayit.pricing) || {}; }
function rezUfukHatasi(tarih, bugun, enErken) {
  const iso = rezISO(tarih);
  if (!iso) return 'Tarih seçilmedi.';
  const fark = rezGunFarki(bugun, iso);
  if (fark === null) return 'Tarih okunamadı.';
  if (fark < Math.max(0, Number(enErken) || 0)) return 'Seçilen tarih artık satışta değil.';
  if (fark > 365) return 'Bu tarih için satış henüz açılmadı.';
  return '';
}
function rezKisiMetni(parca) {
  return parca.filter(p => p[0] > 0).map(p => p[0] + ' ' + p[1]).join(' · ');
}

const REZ_TIPLER = {
  tour: {
    ad: 'Tur',
    hesapla: (k, s) => { const f = rezFn('tour', 'calcTotal'); return f ? f(k, s) : null; },
    baslangic: (k, s, h) => {
      const p = rezPricing(k);
      const bitis = k.type === 'stay' && Number(k.nights) > 0 ? rezGunEkle(s.date, Number(k.nights)) : '';
      return { tarih: rezISO(s.date), saat: rezSaat(p.startTime), bitis };
    },
    tarihHatasi: (k, s, bugun) => {
      const p = rezPricing(k);
      const hata = rezUfukHatasi(s.date, bugun, p.leadDays === undefined ? 1 : p.leadDays);
      if (hata) return hata;
      const gunler = Array.isArray(p.departureDays) && p.departureDays.length ? p.departureDays : [0, 1, 2, 3, 4, 5, 6];
      return gunler.indexOf(rezTarih(s.date).getDay()) === -1 ? 'Bu tarihte kalkış yok.' : '';
    },
    katilimcilar: (k, h) => {
      const p = rezPricing(k);
      const cocuk = rezYasAraligi(p.childAges);
      const bebek = rezYasAraligi(p.infantAges);
      const liste = [];
      for (let i = 0; i < h.adults; i++) liste.push({ rol: 'yetiskin', ad: 'Yetişkin', kimlik: true });
      for (let i = 0; i < h.children; i++) liste.push({ rol: 'cocuk', ad: 'Çocuk', yas: cocuk });
      for (let i = 0; i < h.infants; i++) liste.push({ rol: 'bebek', ad: 'Bebek', yas: bebek });
      return liste;
    },
    kontenjan: (k, s, h) => ({ item: 'departure', date: rezISO(s.date), time: null, istenen: h.adults + h.children, birim: 'kişilik yer' }),
    ozet: (k, s, h) => {
      const p = rezPricing(k);
      const stay = k.type === 'stay';
      const satir = [];
      satir.push({ ad: stay ? 'Tarih aralığı' : 'Tarih', deger: stay
        ? rezTarihMetni(s.date) + ' – ' + rezTarihMetni(rezGunEkle(s.date, Number(k.nights) || 0))
        : rezTarihMetni(s.date) });
      if (stay && h.city) satir.push({ ad: 'Kalkış', deger: h.city.label + ' · ' + (p.startTime || '') });
      if (!stay) satir.push({ ad: 'Kalkış', deger: [p.startTime, k.meeting && k.meeting.title].filter(Boolean).join(' · ') });
      if (stay && k.accommodation) satir.push({ ad: 'Konaklama', deger: k.nights + ' gece · ' + (k.accommodation.board || '') });
      if (stay && h.singleRoom) satir.push({ ad: 'Oda', deger: 'Tek kişilik oda (tek kişi farkı dahil)' });
      satir.push({ ad: 'Kişi', deger: rezKisiMetni([[h.adults, 'yetişkin'], [h.children, 'çocuk'], [h.infants, 'bebek']]) });
      return satir;
    }
  },

  hotel: {
    ad: 'Otel',
    hesapla: (k, s) => { const f = rezFn('hotel', 'calcHotelTotal'); return f ? f(k, s) : null; },
    baslangic: (k, s, h) => {
      const p = rezPricing(k);
      return { tarih: rezISO(s.checkIn), saat: rezSaat(p.checkInTime), bitis: h ? h.checkOut : '' };
    },
    tarihHatasi: (k, s, bugun) => rezUfukHatasi(s.checkIn, bugun, rezPricing(k).leadDays === undefined ? 1 : rezPricing(k).leadDays),
    katilimcilar: (k, h) => {
      const yas = rezYasAraligi(rezPricing(k).childAges) || { alt: 0, ust: 12 };
      const liste = [];
      for (let i = 0; i < h.rooms; i++) liste.push({ rol: 'oda', ad: (h.rooms > 1 ? (i + 1) + '. oda' : 'Oda') + ' · yetişkin misafir' });
      for (let i = 0; i < h.children; i++) liste.push({ rol: 'cocuk', ad: 'Çocuk', yas, adsiz: true });
      return liste;
    },
    kontenjan: (k, s, h) => ({ item: h.room ? h.room.id : '', date: rezISO(s.checkIn), cikis: h.checkOut, istenen: h.rooms, birim: 'oda' }),
    ozet: (k, s, h) => [
      { ad: 'Giriş – çıkış', deger: rezTarihMetni(h.checkIn) + ' – ' + rezTarihMetni(h.checkOut) },
      { ad: 'Konaklama', deger: h.nights + ' gece · ' + h.rooms + ' oda' },
      { ad: 'Oda', deger: (h.room && h.room.name) || '' },
      { ad: 'Pansiyon', deger: (h.board && h.board.label) || '' },
      { ad: 'Kişi', deger: rezKisiMetni([[h.adults, 'yetişkin'], [h.children, 'çocuk']]) }
    ]
  },

  activity: {
    ad: 'Aktivite',
    hesapla: (k, s) => { const f = rezFn('activity', 'calcActivityTotal'); return f ? f(k, s) : null; },
    baslangic: (k, s, h) => ({ tarih: rezISO(s.date), saat: rezSaat(h && h.session && h.session.time), bitis: '' }),
    tarihHatasi: (k, s, bugun) => rezUfukHatasi(s.date, bugun, rezPricing(k).leadDays === undefined ? 1 : rezPricing(k).leadDays),
    katilimcilar: (k, h) => {
      const yas = rezYasAraligi(rezPricing(k).childAges);
      const liste = [];
      for (let i = 0; i < h.adults; i++) liste.push({ rol: 'yetiskin', ad: 'Yetişkin' });
      for (let i = 0; i < h.children; i++) liste.push({ rol: 'cocuk', ad: 'Çocuk', yas });
      return liste;
    },
    kontenjan: (k, s, h) => ({ item: h.pack ? h.pack.id : '', date: rezISO(s.date), time: rezSaat(h.session && h.session.time) || null,
      istenen: h.adults + h.children, birim: 'kişilik yer' }),
    ozet: (k, s, h) => [
      { ad: 'Tarih', deger: rezTarihMetni(s.date) },
      { ad: 'Seans', deger: [(h.session && h.session.label) || '', (h.session && h.session.time) || ''].filter(Boolean).join(' · ') },
      { ad: 'Paket', deger: (h.pack && h.pack.name) || '' },
      { ad: 'Kişi', deger: rezKisiMetni([[h.adults, 'yetişkin'], [h.children, 'çocuk']]) }
    ]
  },

  event: {
    ad: 'Etkinlik',
    hesapla: (k, s) => { const f = rezFn('event', 'calcEventTotal'); return f ? f(k, s) : null; },
    baslangic: (k, s, h, bugun) => {
      const f = rezFn('event', 'upcomingPerformances');
      const t = f ? f(k, bugun).find(x => x.date === rezISO(s.date)) : null;
      return { tarih: rezISO(s.date), saat: rezSaat((t && t.time) || rezPricing(k).startTime), bitis: '' };
    },
    tarihHatasi: (k, s, bugun) => {
      const f = rezFn('event', 'upcomingPerformances');
      if (!rezISO(s.date)) return 'Temsil seçilmedi.';
      const liste = f ? f(k, bugun) : [];
      return liste.some(t => t.date === rezISO(s.date)) ? '' : 'Seçilen temsil artık satışta değil.';
    },
    katilimcilar: () => [{ rol: 'sahip', ad: 'Bilet sahibi' }],
    kontenjan: (k, s, h, bugun) => {
      const f = rezFn('event', 'upcomingPerformances');
      const t = f ? f(k, bugun).find(x => x.date === rezISO(s.date)) : null;
      return { item: h.category ? h.category.id : '', date: rezISO(s.date), time: rezSaat(t && t.time) || null, istenen: h.tickets, birim: 'bilet' };
    },
    ozet: (k, s, h, bugun) => {
      const f = rezFn('event', 'upcomingPerformances');
      const t = f ? f(k, bugun).find(x => x.date === rezISO(s.date)) : null;
      return [
        { ad: 'Temsil', deger: rezTarihMetni(s.date) + (t ? ' · ' + t.time + (t.title ? ' · ' + t.title : '') : '') },
        { ad: 'Kategori', deger: (h.category && (h.category.name || h.category.label)) || '' },
        { ad: 'Bilet', deger: rezKisiMetni([[h.full, 'tam'], [h.student, 'öğrenci']]) }
      ];
    }
  },

  venue: {
    ad: 'Mekân',
    hesapla: (k, s) => { const f = rezFn('venue', 'calcVenueBooking'); return f ? f(k, s) : null; },
    baslangic: (k, s) => ({ tarih: rezISO(s.date), saat: rezSaat(s.slot), bitis: '' }),
    tarihHatasi: (k, s, bugun) => {
      const p = rezPricing(k);
      const hata = rezUfukHatasi(s.date, bugun, p.leadDays === undefined ? 0 : p.leadDays);
      if (hata) return hata;
      const saatler = rezFn('venue', 'venueHoursFor');
      const gun = saatler ? saatler(k, rezTarih(s.date).getDay()) : null;
      if (gun && gun.closed) return 'Mekân bu gün kapalı.';
      const slotlar = rezFn('venue', 'venueSlots');
      if (slotlar && slotlar(k, s.date).indexOf(String(s.slot || '')) === -1) return 'Seçilen saat bu gün için yok.';
      return '';
    },
    katilimcilar: () => [{ rol: 'sahip', ad: 'Rezervasyon sahibi' }],
    kontenjan: (k, s, h) => ({ item: h.option ? h.option.id : '', date: rezISO(s.date), time: rezSaat(s.slot) || null,
      istenen: h.mode === 'randevu' ? h.guests : 1, birim: h.mode === 'randevu' ? 'kişilik randevu' : 'alan' }),
    ozet: (k, s, h) => [
      { ad: 'Tarih', deger: rezTarihMetni(s.date) + (s.slot ? ' · ' + s.slot : '') },
      { ad: h.mode === 'randevu' ? 'Hizmet' : 'Alan', deger: (h.option && h.option.name) || '' },
      { ad: 'Kişi', deger: h.guests + ' kişi' }
    ]
  }
};

/* ---------------- kampanya ---------------- */
function rezKapsamaGirer(kampanya, tip, kayit) {
  const k = (kampanya && kampanya.kapsam) || {};
  const t = (kayit && kayit.taxonomy) || {};
  if (k.tipler && k.tipler.length && k.tipler.indexOf(tip) === -1) return false;
  if (k.urunler && k.urunler.length && k.urunler.indexOf(tip + '/' + (kayit && kayit.slug)) === -1) return false;
  if (k.kategoriler && k.kategoriler.length && !(t.categories || []).some(c => k.kategoriler.indexOf(c) !== -1)) return false;
  if (k.temalar && k.temalar.length && !(t.themes || []).some(c => k.temalar.indexOf(c) !== -1)) return false;
  return true;
}
function rezGecerli(kampanya, bugun) {
  const b = rezISO(bugun);
  if (kampanya.baslangic && b < kampanya.baslangic) return false;
  if (kampanya.bitis && b > kampanya.bitis) return false;
  return true;
}
/* Bugün yürürlükteki kampanyalar (kampanyalar sayfası ve ana sayfa
   bantları). Üyeye özel olanlar da listede; uygulanmaları üyelikle. */
function rezAktifKampanyalar(bugun) {
  return REZ_KAMPANYALAR.filter(k => rezGecerli(k, bugun));
}
/* "Son N gün": bitişe 7 günden az kaldıysa gün sayısı, yoksa null. */
function rezKalanGun(kampanya, bugun) {
  if (!kampanya || !kampanya.bitis) return null;
  const fark = rezGunFarki(bugun, kampanya.bitis);
  return fark !== null && fark >= 0 && fark < 7 ? fark + 1 : null;
}

/* Erken rezervasyon indirimi olan ürün: kalkışa en az N gün koşullu,
   yürürlükte bir otomatik kampanyanın kapsamında. Liste süzgeci
   (firsatlar/erken-rezervasyon) bunu soruyor. */
function rezErkenRezervasyonVar(tip, kayit, bugun) {
  return REZ_KAMPANYALAR.some(k => k.tur === 'otomatik' && !k.uyeOzel && k.kosul && k.kosul.enAzGunOnce > 0
    && rezGecerli(k, bugun) && rezKapsamaGirer(k, tip, kayit));
}

/* Konaklamanın geceleri (giriş dahil, çıkış hariç) cuma ve cumartesiyi
   birlikte kapsıyor mu. */
function rezCumaCumartesi(giris, gece) {
  const gunler = [];
  for (let i = 0; i < Math.max(0, Number(gece) || 0) && i < 60; i++) gunler.push(rezTarih(rezGunEkle(giris, i)).getDay());
  return gunler.indexOf(5) !== -1 && gunler.indexOf(6) !== -1;
}

/* Bir kampanyanın bu rezervasyona indirimi (TL). Uygulanmıyorsa
   { tutar: 0, neden }. bilgi: { tip, kayit, hesap, baslangic, toplamTL,
   kur, bugun, uye } */
function rezKampanyaIndirimi(kampanya, bilgi) {
  const yok = (neden) => ({ tutar: 0, neden });
  if (!rezGecerli(kampanya, bilgi.bugun)) return yok('Kampanyanın süresi doldu.');
  if (kampanya.uyeOzel && !bilgi.uye) return yok('Bu indirim üyelere özel; giriş yapınca kullanabilirsin.');
  if (kampanya.ilkRezervasyon && bilgi.uye && Number(bilgi.uye.rezervasyonSayisi) > 0) return yok('Bu kupon yalnızca ilk rezervasyonda geçerli.');
  if (kampanya.kisisel) {
    if (kampanya.kisisel.kullanildi) return yok('Bu kupon kullanıldı.');
    if (kampanya.kisisel.sonGun && rezISO(bilgi.bugun) > kampanya.kisisel.sonGun) return yok('Kuponun süresi doldu.');
  }
  if (!rezKapsamaGirer(kampanya, bilgi.tip, bilgi.kayit)) return yok('Bu ürün kampanyanın kapsamında değil.');
  const kosul = kampanya.kosul || {};
  if (kosul.enAzGunOnce) {
    const fark = rezGunFarki(bilgi.bugun, bilgi.baslangic && bilgi.baslangic.tarih);
    if (fark === null || fark < kosul.enAzGunOnce) return yok('Kalkışa en az ' + kosul.enAzGunOnce + ' gün olmalı.');
  }
  if (kosul.enAzTutar && bilgi.toplamTL < kosul.enAzTutar) return yok('En az ' + rezPara(kosul.enAzTutar) + ' tutarında rezervasyonda geçerli.');
  if (kosul.cumaCumartesi) {
    const h = bilgi.hesap || {};
    if (!rezCumaCumartesi(h.checkIn, h.nights)) return yok('Konaklama cuma ve cumartesi gecesini kapsamalı.');
  }
  const ind = kampanya.indirim || {};
  let tutar = 0;
  if (ind.tutar) tutar = Number(ind.tutar) || 0;
  else if (ind.oran) tutar = Math.round(bilgi.toplamTL * ind.oran);
  else if (ind.geceOda) {
    const h = bilgi.hesap || {};
    const gecelik = Number(h.room && h.room.nightly) || 0;
    const gece = Math.min(Number(ind.geceOda) || 0, Number(h.nights) || 0);
    /* Ücretsiz gecenin konaklama vergisi de düşer: toplam, o gece hiç
       satılmamış gibi. */
    const vergi = Number(rezPricing(bilgi.kayit).taxRate) || 0;
    tutar = rezTLKarsiligi(gecelik * (Number(h.rooms) || 1) * gece * (1 + vergi), bilgi.paraBirimi, bilgi.kur);
  }
  if (ind.enFazla) tutar = Math.min(tutar, ind.enFazla);
  tutar = Math.max(0, Math.min(Math.round(tutar), bilgi.toplamTL));
  return tutar > 0 ? { tutar, neden: '' } : yok('Bu rezervasyonda indirim oluşmuyor.');
}

/* Kupon: önce herkese açık kodlar, sonra üyenin kişiye özel kodları
   (uye.kuponlar: { kod, kampanya, sonGun, kullanildi }). Kişisel kod
   kampanyanın kuralını taşır, üstüne kendi son günü ve kullanımı. */
function rezKuponBul(kod, uye) {
  const k = String(kod || '').trim().toUpperCase();
  if (!k) return null;
  const genel = REZ_KAMPANYALAR.find(x => x.tur === 'kupon' && x.kuponKodu && x.kuponKodu.toUpperCase() === k);
  if (genel) return genel;
  const kisisel = ((uye && uye.kuponlar) || []).find(x => String(x.kod || '').toUpperCase() === k);
  const kampanya = kisisel ? REZ_KAMPANYALAR.find(x => x.kod === kisisel.kampanya) : null;
  return kampanya ? Object.assign({}, kampanya, { kuponKodu: kisisel.kod, kisisel }) : null;
}

/* ---------------- kur ve TL ---------------- */
function rezTLKarsiligi(tutar, paraBirimi, kur) {
  const t = Number(tutar) || 0;
  if (!paraBirimi || paraBirimi === 'TRY') return Math.round(t);
  const oran = kur && Number(kur.oran);
  return oran > 0 ? Math.ceil(t * oran) : NaN;
}

/* ---------------- taksit ---------------- */
function rezKartAilesi(id) {
  return REZ_TAKSIT.aileler.find(a => a.id === id) || null;
}
/* Bir aile için taksit satırları: tek çekim + ailenin taksitleri.
   toplam = tutar × (1 + vade farkı), kuruşa yuvarlı; aylık kuruşa
   aşağı, artan kuruş ilk taksitte (bankaların yaptığı gibi). */
function rezTaksitSecenekleri(tutar, aileId) {
  const t = rezKurus(tutar);
  const tek = [{ taksit: 1, oran: 0, toplam: t, aylik: t, ilk: t }];
  const aile = rezKartAilesi(aileId);
  if (!aile || t < REZ_TAKSIT.altSinir) return tek;
  return tek.concat(Object.keys(aile.oranlar).map(Number).sort((a, b) => a - b).map(n => {
    const oran = Number(aile.oranlar[n]) || 0;
    const toplam = rezKurus(t * (1 + oran));
    const aylik = Math.floor(toplam * 100 / n) / 100;
    return { taksit: n, oran, toplam, aylik, ilk: rezKurus(toplam - aylik * (n - 1)) };
  }));
}
/* Bütün ailelerin tablosu (taksit tablosu ekranı): satır taksit sayısı,
   sütun aile. Olmayan hücre null. */
function rezTaksitTablosu(tutar) {
  const sayilar = [1];
  REZ_TAKSIT.aileler.forEach(a => Object.keys(a.oranlar).forEach(n => {
    if (sayilar.indexOf(Number(n)) === -1) sayilar.push(Number(n));
  }));
  sayilar.sort((a, b) => a - b);
  const aileler = REZ_TAKSIT.aileler.map(a => ({ id: a.id, ad: a.ad, banka: a.banka,
    satirlar: rezTaksitSecenekleri(tutar, a.id) }));
  return {
    uygun: rezKurus(tutar) >= REZ_TAKSIT.altSinir,
    sayilar,
    aileler: aileler.map(a => ({ id: a.id, ad: a.ad, banka: a.banka,
      hucreler: sayilar.map(n => a.satirlar.find(s => s.taksit === n) || null) }))
  };
}

/* ---------------- iptal ----------------
   Kaydın kademeleri (minHours, rate): başlangıçtan en az N saat önce
   iptalde bedelin rate kadarı iade. Kaporalı rezervasyonda kesinti
   TOPLAM üzerinden: kesinti = toplam × (1 − rate); iade = ödenen −
   kesinti (eksiye düşmez). Müşteriden bu hesapla ek tahsilat yapılmaz.
   simdiAn verilirse süresi GEÇMİŞ kademeler düşer: kalkışa 30 saat
   kala alınan rezervasyona "48 saat öncesine kadar tamamı iade"
   yazılmaz. Son kademe hep kalır. */
function rezIptalTakvimi(kayit, baslangic, toplam, odenen, simdiAn) {
  const kademeler = (((kayit && kayit.cancellation) || {}).tiers || []).slice()
    .sort((a, b) => (Number(b.minHours) || 0) - (Number(a.minHours) || 0));
  const bas = baslangic ? rezTarih(baslangic.tarih, baslangic.saat) : null;
  const top = Number(toplam) || 0;
  const od = Number(odenen) || 0;
  const an = simdiAn instanceof Date ? simdiAn.getTime() : null;
  return kademeler.filter((k, i) => {
    if (an === null || !bas || i === kademeler.length - 1) return true;
    return bas.getTime() - (Number(k.minHours) || 0) * 3600000 > an;
  }).map((k, i) => {
    const saat = Number(k.minHours) || 0;
    const sinir = bas ? new Date(bas.getTime() - saat * 3600000) : null;
    const oran = Math.max(0, Math.min(1, Number(k.rate) || 0));
    const kesinti = Math.round(top * (1 - oran));
    return {
      etiket: k.label || '',
      metin: k.text || '',
      oran,
      /* Bu kademenin geçerli olduğu son an: bir üst kademenin sınırı
         (en üst kademe için "bu ana kadar"). */
      sonAn: sinir && saat > 0 ? rezISO(sinir) + 'T' + String(sinir.getHours()).padStart(2, '0') + ':' + String(sinir.getMinutes()).padStart(2, '0') : null,
      sonAnMetni: sinir && saat > 0 ? rezTarihMetni(rezISO(sinir), true) + ' ' + String(sinir.getHours()).padStart(2, '0') + ':' + String(sinir.getMinutes()).padStart(2, '0') : '',
      ilk: i === 0,
      iade: Math.max(0, od - kesinti)
    };
  });
}

/* ---------------- teklif ----------------
   secenek: {
     odeme:   'tam' | 'kapora'
     kalan:   'bir-gun-once' | 'aracta'  (kaporada)
     aile:    kart ailesi id'si (taksit için; yoksa tek çekim)
     taksit:  taksit sayısı
     kupon:   kupon kodu
     cocukYaslari: [yaş, …] (otelde fiyatı etkiler)
     uye:     üyelik bağlamı (5. adım)
   }
   baglam: { kur: { oran, tarih, kaynak } } — döviz üründe gerekli;
           simdi: Date — iptal takviminde geçmiş kademeleri düşürmek
           için (yoksa bugün gece yarısı). */
function rezTeklif(tip, kayit, secim, secenek, bugun, baglam) {
  const u = REZ_TIPLER[tip];
  const sec = Object.assign({}, secim || {});
  const opt = secenek || {};
  const gun = rezISO(bugun) || rezISO(new Date());
  const hatalar = [];
  if (!u || !kayit) return { tip, hatalar: ['Ürün bulunamadı.'], satilabilir: false };
  if (kayit.sample) return { tip, slug: kayit.slug, hatalar: ['Bu ürünün online satışı henüz açılmadı.'], satilabilir: false };

  if (tip === 'hotel' && Array.isArray(opt.cocukYaslari)) sec.childAges = opt.cocukYaslari.slice();
  if (tip === 'venue' && !sec.slot) {
    const f = rezFn('venue', 'venueSlot');
    if (f) sec.slot = f(kayit, sec.date, '');
  }
  const hesap = u.hesapla(kayit, sec);
  if (!hesap) return { tip, slug: kayit.slug, hatalar: ['Fiyat hesaplanamadı.'], satilabilir: false };
  const baslangic = u.baslangic(kayit, sec, hesap, gun);
  const tarihHatasi = u.tarihHatasi(kayit, tip === 'hotel' ? Object.assign({}, sec, { checkIn: hesap.checkIn || sec.checkIn }) : sec, gun);
  if (tarihHatasi) hatalar.push(tarihHatasi);
  /* Bugünün geçmiş saati (aynı gün satılan mekân seansı, etkinlik): gün
     satılabilir ama saat geçti. Saat bilgisi yalnızca baglam.simdi
     ya da Date verilen bugün ile var. */
  const simdiAn = (baglam && baglam.simdi instanceof Date) ? baglam.simdi : (bugun instanceof Date ? bugun : null);
  const basAn = rezTarih(baslangic.tarih, baslangic.saat);
  if (!tarihHatasi && simdiAn && basAn && baslangic.saat && basAn.getTime() <= simdiAn.getTime()) {
    hatalar.push('Seçilen saat geçti; ürün sayfasından başka bir saat ya da tarih seçin.');
  }

  const paraBirimi = kayit.currency || 'TRY';
  const kur = paraBirimi === 'TRY' ? null : ((baglam && baglam.kur) || null);
  if (paraBirimi !== 'TRY' && !(kur && kur.oran > 0)) hatalar.push('Günün kuru alınamadı; döviz fiyatlı ürün şu an satılamıyor.');

  /* Mekânda ödeme: ön ödemesiz randevu. Tutar bilgi amaçlı, kart
     çekimi yok. */
  const mekanda = tip === 'venue' && !!hesap.payAtVenue;
  const brutTL = rezTLKarsiligi(hesap.total, paraBirimi, kur) || 0;

  const bilgi = { tip, kayit, hesap, baslangic, toplamTL: brutTL, kur, paraBirimi, bugun: gun, uye: opt.uye || null };
  const indirimler = [];
  if (!mekanda) {
    let enIyi = null;
    REZ_KAMPANYALAR.filter(k => k.tur === 'otomatik').forEach(k => {
      const r = rezKampanyaIndirimi(k, bilgi);
      if (r.tutar > 0 && (!enIyi || r.tutar > enIyi.tutar)) enIyi = { kod: k.kod, ad: k.ad, etiket: k.etiket, tutar: r.tutar };
    });
    if (enIyi) indirimler.push(enIyi);
  }
  let kupon = null;
  if (opt.kupon) {
    const k = rezKuponBul(opt.kupon, opt.uye);
    if (!k) kupon = { kod: String(opt.kupon).trim().toUpperCase(), gecerli: false, mesaj: 'Kupon kodu bulunamadı.' };
    else if (mekanda) kupon = { kod: k.kuponKodu, gecerli: false, mesaj: 'Ön ödemesiz rezervasyonda kupon kullanılmaz.' };
    else {
      const kalanTL = brutTL - indirimler.reduce((t, x) => t + x.tutar, 0);
      const r = rezKampanyaIndirimi(k, Object.assign({}, bilgi, { toplamTL: kalanTL }));
      kupon = r.tutar > 0
        ? { kod: k.kuponKodu, gecerli: true, mesaj: k.ad }
        : { kod: k.kuponKodu, gecerli: false, mesaj: r.neden };
      if (r.tutar > 0) indirimler.push({ kod: k.kod, ad: k.ad, etiket: k.etiket, tutar: r.tutar, kupon: k.kuponKodu });
    }
  }
  const indirimToplam = Math.min(brutTL, indirimler.reduce((t, x) => t + x.tutar, 0));
  const net = brutTL - indirimToplam;

  /* Ödeme planı */
  const kalanGun = rezGunFarki(gun, baslangic.tarih);
  const kaporaTipi = REZ_KAPORA.tipler.indexOf(tip) !== -1;
  const kaporaUygun = !mekanda && kaporaTipi && kalanGun !== null && kalanGun >= REZ_KAPORA.enAzGun;
  const kaporaNeden = !kaporaTipi ? '' : (kaporaUygun ? '' : 'Kalkışa ' + REZ_KAPORA.enAzGun + ' günden az kaldığı için tutarın tamamı ödenir.');
  const kaporaSecildi = kaporaUygun && opt.odeme === 'kapora';
  const kalanTercih = kaporaSecildi
    ? (REZ_KAPORA.kalanSecenekleri.some(s => s.id === opt.kalan) ? opt.kalan : REZ_KAPORA.kalanSecenekleri[0].id)
    : null;
  const simdi = mekanda ? 0 : (kaporaSecildi ? Math.ceil(net * REZ_KAPORA.oran) : net);
  const kalan = mekanda ? net : net - simdi;
  const odeme = {
    sekil: mekanda ? 'mekanda' : (kaporaSecildi ? 'kapora' : 'tam'),
    kaporaUygun,
    kaporaNeden,
    kaporaOrani: REZ_KAPORA.oran,
    kaporaTutari: kaporaUygun ? Math.ceil(net * REZ_KAPORA.oran) : 0,
    simdi,
    kalan,
    kalanTercih,
    kalanTarihi: kalanTercih === 'bir-gun-once' ? rezGunEkle(baslangic.tarih, -1) : (kalanTercih === 'aracta' ? baslangic.tarih : null),
    aramaTarihi: kaporaSecildi ? rezGunEkle(baslangic.tarih, -1) : null
  };

  /* Taksit (bugün çekilen tutar üzerinden) */
  const secenekler = rezTaksitSecenekleri(simdi, opt.aile);
  const secilen = secenekler.find(s => s.taksit === Number(opt.taksit)) || secenekler[0];
  const taksit = {
    aile: rezKartAilesi(opt.aile) ? opt.aile : null,
    uygun: simdi >= REZ_TAKSIT.altSinir,
    secenekler,
    secilen,
    vadeFarki: rezKurus(secilen.toplam - simdi)
  };

  /* Kalan kontenjan sorgusu için istek (kapı değerlendiriyor) */
  const kontenjan = u.kontenjan(kayit, sec, hesap, gun);

  return {
    tip,
    slug: kayit.slug,
    baslik: kayit.title,
    satilabilir: hatalar.length === 0,
    hatalar,
    secim: sec,
    hesap,
    ozet: u.ozet(kayit, sec, hesap, gun),
    katilimcilar: u.katilimcilar(kayit, hesap),
    baslangic,
    paraBirimi,
    kur: kur ? { oran: kur.oran, tarih: kur.tarih || null, kaynak: kur.kaynak || null } : null,
    satirlar: hesap.lines || [],
    araToplam: hesap.total,
    araToplamTL: brutTL,
    indirimler,
    indirimToplam,
    kupon,
    toplam: net,
    odeme,
    taksit,
    tahsilat: secilen.toplam,
    iptal: rezIptalTakvimi(kayit, baslangic, net, simdi, simdiAn || rezTarih(gun)),
    kontenjan,
    paketTur: rezPaketTurMu(tip, kayit)
  };
}

/* Paket tur: konaklama içeren (gecesi olan) tur. Paket Tur Sözleşmeleri
   Yönetmeliği'ne tabi; ödeme adımında paket tur sözleşmesi de
   onaylatılıyor. Günübirlik tur (konaklamasız) paket tur değil. */
function rezPaketTurMu(tip, kayit) {
  return tip === 'tour' && !!kayit && ((Number(kayit.nights) || 0) > 0 || kayit.type === 'stay');
}

/* ---------------- form doğrulama ---------------- */
function rezTCKimlikGecerli(no) {
  const s = String(no || '').replace(/\s+/g, '');
  if (!/^[1-9]\d{10}$/.test(s)) return false;
  const d = s.split('').map(Number);
  const tek = d[0] + d[2] + d[4] + d[6] + d[8];
  const cift = d[1] + d[3] + d[5] + d[7];
  const onuncu = ((tek * 7 - cift) % 10 + 10) % 10;
  if (onuncu !== d[9]) return false;
  return d.slice(0, 10).reduce((t, x) => t + x, 0) % 10 === d[10];
}
function rezPasaportGecerli(no) {
  return /^[A-Z0-9]{6,12}$/i.test(String(no || '').replace(/\s+/g, ''));
}
/* Türkiye cep (5xx xxx xx xx; 0 ya da +90 önekli) ya da +ülke kodlu
   uluslararası numara. */
function rezTelefonGecerli(no) {
  const s = String(no || '').trim();
  const rakam = s.replace(/[\s()-]/g, '');
  if (/^(\+?90|0)?5\d{9}$/.test(rakam)) return true;
  return /^\+(?!90)\d{8,15}$/.test(rakam);
}
function rezEpostaGecerli(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());
}
function rezAdGecerli(ad) {
  return /^[\p{L}][\p{L}' .-]{1,49}$/u.test(String(ad || '').trim());
}

/* Formun bütün hataları: [{ alan, mesaj }]. alan, formdaki name. */
function rezFormHatalari(teklif, form) {
  const f = form || {};
  const hatalar = [];
  const ekle = (alan, mesaj) => hatalar.push({ alan, mesaj });
  const il = f.iletisim || {};
  if (!rezAdGecerli(il.ad)) ekle('iletisim.ad', 'Adınızı yazın.');
  if (!rezAdGecerli(il.soyad)) ekle('iletisim.soyad', 'Soyadınızı yazın.');
  if (!rezEpostaGecerli(il.eposta)) ekle('iletisim.eposta', 'Geçerli bir e-posta adresi yazın.');
  if (!rezTelefonGecerli(il.telefon)) ekle('iletisim.telefon', 'Geçerli bir cep telefonu yazın (5xx xxx xx xx).');

  const kisiler = f.katilimcilar || [];
  ((teklif && teklif.katilimcilar) || []).forEach((sablon, i) => {
    const k = kisiler[i] || {};
    const on = 'katilimci.' + i + '.';
    if (!sablon.adsiz) {
      if (!rezAdGecerli(k.ad)) ekle(on + 'ad', 'Ad yazın.');
      if (!rezAdGecerli(k.soyad)) ekle(on + 'soyad', 'Soyad yazın.');
    }
    if (sablon.kimlik) {
      if (k.yabanci) {
        if (!rezPasaportGecerli(k.pasaport)) ekle(on + 'pasaport', 'Pasaport numarasını yazın.');
      } else if (!rezTCKimlikGecerli(k.tc)) {
        ekle(on + 'tc', 'T.C. kimlik numarası geçersiz.');
      }
    }
    if (sablon.yas) {
      const y = Number(k.yas);
      if (k.yas === undefined || k.yas === null || k.yas === '' || !Number.isFinite(y)) ekle(on + 'yas', 'Yaş seçin.');
      else if (y < sablon.yas.alt || y > sablon.yas.ust) {
        ekle(on + 'yas', sablon.ad + ' ' + sablon.yas.alt + ' – ' + sablon.yas.ust + ' yaş arasında olmalı.');
      }
    }
  });
  if (f.fatura && f.fatura.tur === 'kurumsal') {
    if (String(f.fatura.unvan || '').trim().length < 2) ekle('fatura.unvan', 'Firma unvanını yazın.');
    if (String(f.fatura.vergiDairesi || '').trim().length < 2) ekle('fatura.vergiDairesi', 'Vergi dairesini yazın.');
    if (!/^\d{10,11}$/.test(String(f.fatura.vergiNo || '').trim())) ekle('fatura.vergiNo', 'Vergi numarası 10 (TC kimlikle 11) haneli olmalı.');
  }
  if (!f.sozlesme) ekle('sozlesme', 'Devam etmek için koşulları onaylayın.');
  return hatalar;
}

/* ---------------- rezervasyon kodu ----------------
   Karışan harfler (O/0, I/1) yok; telefonda okunabilsin. */
const REZ_KOD_HARFLER = 'ABCDEFGHJKLMNPRSTUVYZ23456789';
function rezKodUret(rastgele) {
  const r = typeof rastgele === 'function' ? rastgele : Math.random;
  let s = '';
  for (let i = 0; i < 6; i++) s += REZ_KOD_HARFLER[Math.floor(r() * REZ_KOD_HARFLER.length) % REZ_KOD_HARFLER.length];
  return 'M360-' + s;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    REZ_KAPORA, REZ_TAKSIT, REZ_KAMPANYALAR, REZ_ALANLAR, REZ_YOLLAR, REZ_TIPLER,
    rezISO, rezGunEkle, rezGunFarki, rezTarihMetni, rezPara, rezSayi, rezYasAraligi,
    rezSecimYaz, rezSecimOku, rezOdemeYolu, rezUrunCoz,
    rezKapsamaGirer, rezAktifKampanyalar, rezKalanGun, rezErkenRezervasyonVar, rezCumaCumartesi,
    rezKampanyaIndirimi, rezKuponBul, rezTLKarsiligi,
    rezKartAilesi, rezTaksitSecenekleri, rezTaksitTablosu,
    rezIptalTakvimi, rezTeklif, rezPaketTurMu,
    rezTCKimlikGecerli, rezPasaportGecerli, rezTelefonGecerli, rezEpostaGecerli, rezAdGecerli,
    rezFormHatalari, rezKodUret
  };
}
