/* Elle yazılmış anasayfa kartlarının örnek ürün kayıtlarına taşınması.

   Anasayfadaki şerit kartları ve "Günün En Çok Satanları" eskiden app.js
   içinde elle yazılıydı. Artık her biri bir ürün kaydı
   (assets/js/sample-catalog-data.js veya sayfası olan kayıt) ve kart
   kayıttan TÜRETİLİYOR.

   Bu dosyanın tek sözü: TAŞIMADA HİÇBİR ALAN SESSİZCE KAYBOLMADI. Eski
   kartların birebir kopyası aşağıda (ESKI_SERITLER). Her eski kart yeni
   şeritte bulunuyor ve alanları aynı; farklı olanlar tek tek, gerekçesiyle
   yazılı (FARKLAR). Listede olmayan bir fark testi düşürür. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { mergeCatalogCards, catalogAllCards } = require('../assets/js/catalog.js');
const { MolaVeri } = require('../assets/js/data-gateway.js');
const { SAMPLE_PRODUCTS } = require('../assets/js/sample-catalog-data.js');
const { formatReviewCount } = require('../assets/js/catalog.js');

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const BUGUN = '2026-09-21';

/* ---------------- eski kartlar (taşımadan önceki app.js) ---------------- */
const ESKI_SERITLER = {
  etkinlikler: [
    {img:'concert1', badges:['Konser'], rating:'4.8', reviews:'640+', title:'Harbiye Açıkhava Konserleri', meta1:'Cemil Topuzlu Sahnesi, İstanbul · 21:00', meta2:'12 Eylül, Cuma', priceMain:'890'},
    {img:'festival1', badges:['Festival'], rating:'4.6', reviews:'310+', title:'Çeşme Yaz Festivali', meta1:'Alaçatı Sahil, İzmir · Tüm gün', meta2:'19 Eylül, Cuma', priceMain:'650'},
    {img:'standup1', badges:['Stand Up'], sponsored:true, title:'Stand Up Gecesi', meta1:'Jolly Joker, Ankara · 21:30', meta2:'21 Eylül, Pazartesi', priceMain:'420'},
  ],
  'yaklasan-planlar': [
    {img:'run1', badges:['Spor'], rating:'4.6', reviews:'240+', title:'İstanbul Gece Yarısı Koşusu', meta1:'Kadıköy Sahil, İstanbul · 21:00', meta2:'Bu Cuma', priceMain:'350', inDays:0, dayKey:'cuma'},
    {img:'standup1', badges:['Stand Up'], sponsored:true, title:'Stand Up Gecesi', meta1:'Jolly Joker, Ankara · 21:30', meta2:'Bu Cuma', priceMain:'420', inDays:0, dayKey:'cuma'},
    {img:'concert1', badges:['Konser'], rating:'4.8', reviews:'640+', title:'Harbiye Açıkhava Konserleri', meta1:'Harbiye, İstanbul · 21:00', meta2:'Bu Cuma', priceMain:'890', inDays:0, dayKey:'cuma'},
    {img:'concert2', badges:['Konser'], rating:'4.7', reviews:'120+', title:'Kordon Caz Akşamları', meta1:'Alsancak, İzmir · 20:00', meta2:'Bu Cumartesi', priceMain:'480', inDays:1, dayKey:'cumartesi'},
    {img:'sapanca2', badges:['Günübirlik'], rating:'4.6', reviews:'75+', title:'Sapanca ve Maşukiye Turu', meta1:'İstanbul Çıkışlı · 07:30', meta2:'Bu Cumartesi', priceMain:'780', inDays:1, dayKey:'cumartesi'},
    {img:'market1', badges:['Günübirlik'], rating:'4.4', reviews:'96+', title:'Alaçatı Pazar Turu', meta1:'İzmir Çıkışlı · 09:00', meta2:'Bu Pazar', priceMain:'350', inDays:2, dayKey:'pazar'},
    {img:'coffee1', badges:['Festival'], rating:'4.5', reviews:'210+', title:'İstanbul Kahve Festivali', meta1:'Küçükçiftlik Park · 11:00', meta2:'Bu Pazar', priceMain:'290', inDays:2, dayKey:'pazar'},
    {img:'iznik2', badges:['Günübirlik'], rating:'4.5', reviews:'70+', title:'İznik Gölü ve Antik Kent', meta1:'Bursa Çıkışlı · 08:00', meta2:'Bu Pazar', priceMain:'450', inDays:2, dayKey:'pazar'},
    {img:'abant2', badges:['Doğa Turu'], rating:'4.4', reviews:'155+', title:'Abant Gölü Doğa Yürüyüşü', meta1:'Ankara Çıkışlı · 08:30', meta2:'3 gün kaldı', priceMain:'620', inDays:3},
    {img:'kapadokya2', badges:['Konaklamalı'], rating:'4.8', reviews:'910+', title:'Kapadokya 3 Gece Turu', meta1:'3 Gece 4 Gün · Uçaklı', meta2:'9 gün kaldı', priceMain:'8990', inDays:9},
    {img:'erciyes', badges:['Kış Sporu'], rating:'4.6', reviews:'140+', title:'Erciyes Kayak Haftası', meta1:'Kayseri · 4 Gece 5 Gün', meta2:'12 gün kaldı', priceMain:'6400', inDays:12},
  ],
  'konaklamali-turlar': [
    {img:'karadeniz2', badges:['Doğa'], sponsored:true, title:'Karadeniz Yaylaları Turu', meta1:'4 Gece 5 Gün · Uçaklı, İstanbul Çıkışlı', meta2:'2 Kasım, Pazar', priceMain:'12500'},
    {img:'ege2', badges:['Balayı'], rating:'4.9', reviews:'288+', title:'Ege Adaları Balayı Kaçamağı', meta1:'2 Gece 3 Gün · Feribotlu, İzmir Çıkışlı', meta2:'15 Eylül, Salı', priceMain:'6990'},
    {img:'dogu2', badges:['Doğu Ekspresi'], rating:'4.6', reviews:'450+', title:'Turistik Doğu Ekspresi Turu', meta1:'5 Gece 6 Gün · Trenli, Ankara Çıkışlı', meta2:'8 Aralık, Salı', priceMain:'9750'},
  ],
  turlar: [
    {img:'sile', badges:['Günübirlik'], rating:'4.5', reviews:'190+', title:'Şile ve Ağva Turu', meta1:'İstanbul Çıkışlı · Öğle Yemeği Dahil', meta2:'Bu Cumartesi', priceMain:'690'},
    {img:'cunda2', badges:['Günübirlik'], sponsored:true, title:'Cunda Adası ve Ayvalık', meta1:'İzmir Çıkışlı · Tekne Dahil', meta2:'Bu Pazar', priceMain:'890'},
    {img:'abant2', badges:['Günübirlik'], rating:'4.4', reviews:'155+', title:'Abant ve Gölcük Turu', meta1:'Ankara Çıkışlı · Kahvaltı Dahil', meta2:'12 Ekim, Pazar', priceMain:'620'},
    {img:'iznik2', badges:['Günübirlik'], rating:'4.5', reviews:'70+', title:'İznik Gölü ve Antik Kent', meta1:'Bursa Çıkışlı · Rehberli', meta2:'19 Ekim, Pazar', priceMain:'450'},
  ],
  aktiviteler: [
    {img:'rafting3', badges:['Su Sporları'], rating:'4.8', reviews:'440+', title:'Köprülü Kanyon Rafting', meta1:'Antalya, Manavgat · Yarım Gün', meta2:'Her gün', priceMain:'850'},
    {img:'paraglide3', badges:['Macera'], rating:'4.9', reviews:'1,2b+', title:'Ölüdeniz Yamaç Paraşütü', meta1:'Fethiye, Muğla · 20 dk Uçuş', meta2:'Her gün', priceMain:'1450'},
    {img:'kayak3', badges:['Kış Sporu'], rating:'4.5', reviews:'330+', title:'Uludağ Kayak Dersi', meta1:'Bursa, Uludağ · 2 Saat Özel Ders', meta2:'Hafta içi', priceMain:'750'},
  ],
  oteller: [
    {img:'hotel4', badges:['Her Şey Dahil'], rating:'9.2', reviews:'340+', title:'Sealight Resort', meta1:'Kemer, Antalya · Denize Sıfır', meta2:'Bu hafta', priceMain:'2100', unit:'/gece'},
    {img:'hotel6', badges:['Termal'], sponsored:true, title:'Termal Vadi Resort', meta1:'Termal, Yalova · Termal Havuz Dahil', meta2:'Bu ay', priceMain:'1590', unit:'/gece'},
    {img:'hotel7', badges:['Butik'], rating:'9.4', reviews:'96+', title:'Göreme Mağara Otel', meta1:'Göreme, Nevşehir · Tarihi Doku', meta2:'Bu hafta', priceMain:'2450', unit:'/gece'},
  ],
};

const ESKI_TOP10 = [
  {img:'kapadokya',t:'Kapadokya Balon Turu',p:'2.450₺'},{img:'pamukkale',t:'Pamukkale Termal Tatili',p:'1.890₺'},
  {img:'bodrum',t:'Bodrum Tekne Turu',p:'980₺'},{img:'efes',t:'Efes Antik Kent Turu',p:'750₺'},
  {img:'uludag',t:'Uludağ Kayak Paketi',p:'3.200₺'},{img:'bogaz',t:'İstanbul Boğaz Turu',p:'650₺'},
  {img:'ayder',t:'Karadeniz Yayla Turu',p:'2.100₺'},{img:'assos',t:'Assos Gün Batımı Turu',p:'1.150₺'},
  {img:'sile',t:'Şile Kamp Deneyimi',p:'890₺'},{img:'iznik',t:'İznik Kültür Turu',p:'520₺'},
];

/* ---------------- eşleme: eski kart → ürün ---------------- */
const ESLEME = {
  'Harbiye Açıkhava Konserleri': 'event/harbiye-acikhava-konserleri',
  'Çeşme Yaz Festivali': 'event/cesme-yaz-festivali',
  'Stand Up Gecesi': 'event/stand-up-gecesi',
  'İstanbul Gece Yarısı Koşusu': 'event/istanbul-gece-yarisi-kosusu',
  'Kordon Caz Akşamları': 'event/kordon-caz-aksamlari',
  'Sapanca ve Maşukiye Turu': 'tour/sapanca-masukiye',
  'Alaçatı Pazar Turu': 'tour/alacati-pazar-turu',
  'İstanbul Kahve Festivali': 'event/istanbul-kahve-festivali',
  'İznik Gölü ve Antik Kent': 'tour/iznik-golu-antik-kent',
  'Abant Gölü Doğa Yürüyüşü': 'tour/abant-golcuk',
  'Kapadokya 3 Gece Turu': 'tour/kapadokya-3-gece',
  'Erciyes Kayak Haftası': 'tour/erciyes-kayak-haftasi',
  'Karadeniz Yaylaları Turu': 'tour/karadeniz-yaylalari',
  'Ege Adaları Balayı Kaçamağı': 'tour/ege-adalari-balayi',
  'Turistik Doğu Ekspresi Turu': 'tour/dogu-ekspresi',
  'Şile ve Ağva Turu': 'tour/sile-agva',
  'Cunda Adası ve Ayvalık': 'tour/cunda-ayvalik',
  'Abant ve Gölcük Turu': 'tour/abant-golcuk',
  'Köprülü Kanyon Rafting': 'activity/koprulu-kanyon-rafting',
  'Ölüdeniz Yamaç Paraşütü': 'activity/oludeniz-yamac-parasutu',
  'Uludağ Kayak Dersi': 'activity/uludag-kayak-dersi',
  'Sealight Resort': 'hotel/sealight-resort',
  'Termal Vadi Resort': 'hotel/termal-vadi-resort',
  'Göreme Mağara Otel': 'hotel/goreme-magara-otel',
};

const ESLEME_TOP10 = {
  'Kapadokya Balon Turu': 'activity/kapadokya-balon-turu',
  'Pamukkale Termal Tatili': 'tour/pamukkale-hierapolis',
  'Bodrum Tekne Turu': 'activity/bodrum-tekne-turu',
  'Efes Antik Kent Turu': 'tour/efes-sirince',
  'Uludağ Kayak Paketi': 'activity/uludag-kayak-paketi',
  'İstanbul Boğaz Turu': 'activity/istanbul-bogaz-turu',
  'Karadeniz Yayla Turu': 'tour/karadeniz-yaylalari',
  'Assos Gün Batımı Turu': 'tour/assos-gun-batimi',
  'Şile Kamp Deneyimi': 'activity/sile-kamp-deneyimi',
  'İznik Kültür Turu': 'tour/iznik-golu-antik-kent',
};

/* ---------------- bilinen farklar ----------------
   Her satır: [şerit, eski başlık, alan] → gerekçe. Buradaki farklar
   BİLEREK; burada olmayan her fark testi düşürür. */
const FARKLAR = {
  /* Aynı ürün iki şeritte iki farklı metinle yazılmıştı; tek kayıtta
     birleşince biri seçildi (ürünün kendi şeridindeki sürüm). */
  'yaklasan-planlar|Harbiye Açıkhava Konserleri|meta1': 'Etkinlikler şeridindeki "Cemil Topuzlu Sahnesi, İstanbul · 21:00" seçildi',
  'yaklasan-planlar|İznik Gölü ve Antik Kent|meta1': 'Günübirlik şeridindeki "Bursa Çıkışlı · Rehberli" seçildi',
  /* Aynı görsel, puan, yorum sayısı ve fiyat: aynı ürünün iki adı. */
  'yaklasan-planlar|Abant Gölü Doğa Yürüyüşü|title': '"Abant ve Gölcük Turu" ile aynı ürün; tek ad',
  'yaklasan-planlar|Abant Gölü Doğa Yürüyüşü|badges': 'tek ürün, tek rozet (Günübirlik)',
  'yaklasan-planlar|Abant Gölü Doğa Yürüyüşü|meta1': 'tek ürün, tek meta satırı',
  /* Sayfası olan gerçek ürünün elle yazılmış eski kopyası: artık kartın
     her alanı gerçek kayıttan geliyor. */
  'yaklasan-planlar|Kapadokya 3 Gece Turu|title': 'gerçek kayıt (tur/kapadokya-3-gece)',
  'yaklasan-planlar|Kapadokya 3 Gece Turu|badges': 'gerçek kayıt',
  'yaklasan-planlar|Kapadokya 3 Gece Turu|meta1': 'gerçek kayıt',
  'yaklasan-planlar|Kapadokya 3 Gece Turu|rating': 'gerçek kaydın yorum dağılımından',
  'yaklasan-planlar|Kapadokya 3 Gece Turu|reviews': 'gerçek kaydın yorum dağılımından',
  /* Yurt dışı tur döviz fiyatlı (kullanıcı kararı). */
  'konaklamali-turlar|Ege Adaları Balayı Kaçamağı|priceMain': '6990 TL → 149 EUR',
};

/* Tarih alanları hiçbir zaman karşılaştırılmıyor: eskiden elle yazılıydı
   ("Bu Cuma" her hafta "Bu Cuma"), artık kaydın takviminden türetiliyor. */
const TURETILEN = ['meta2', 'inDays', 'dayKey'];

/* '640+' → 640, '1,2b+' → 1200. Eski metindeki sayı kayıtta KORUNMUŞ
   olmalı; kartta yazılışı ortak yuvarlama kuralına göre ('75+' → '70+'). */
function eskiYorumSayisi(metin) {
  const m = String(metin).replace('+', '');
  return m.endsWith('b') ? Math.round(Number(m.slice(0, -1).replace(',', '.')) * 1000) : Number(m);
}

/* Yeni şeritler: app.js'teki tanımdan, katalogla birleştirilmiş hâliyle. */
function yeniSeritler() {
  const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
  const seritler = [...blok.matchAll(/anchor:'([^']+)'[\s\S]*?picks:\[([\s\S]*?)\]/g)]
    .map(([, anchor, secim]) => ({
      anchor, items: [],
      picks: [...secim.matchAll(/'([a-z]+\/[a-z0-9-]+)'/g)].map(m => m[1])
    }));
  return mergeCatalogCards(seritler, BUGUN);
}

function refKayit(ref) {
  const [tip, slug] = ref.split('/');
  return MolaVeri.urun(tip, slug);
}

describe('elle yazılmış kart kalmadı', () => {
  it('şeritlerde kart metni yok, yalnızca ürün seçimi var', () => {
    const blok = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    expect(blok).not.toMatch(/priceMain|rating:|reviews:|meta1:|meta2:/);
    for (const m of blok.matchAll(/items:\[([^\]]*)\]/g)) expect(m[1].trim()).toBe('');
  });

  it('en çok satanlar bir sıralama, ürün kopyası değil', () => {
    const blok = app.match(/const top10 = \[([\s\S]*?)\n\];/)[1];
    expect(blok).not.toMatch(/img:|t:|p:/);
    const refler = [...blok.matchAll(/'([a-z]+\/[a-z0-9-]+)'/g)].map(m => m[1]);
    expect(refler).toHaveLength(ESKI_TOP10.length);
    refler.forEach(r => expect(refKayit(r), r).toBeTruthy());
  });

  it('her şerit seçimi gerçek bir kayda gidiyor', () => {
    for (const s of yeniSeritler()) for (const r of s.picks) expect(refKayit(r), s.anchor + ' · ' + r).toBeTruthy();
  });
});

describe('taşımada hiçbir alan kaybolmadı', () => {
  const yeni = yeniSeritler();

  for (const [anchor, kartlar] of Object.entries(ESKI_SERITLER)) {
    it(anchor + ' şeridindeki her eski kart yeni şeritte, alanları aynı', () => {
      const serit = yeni.find(s => s.anchor === anchor);
      expect(serit, anchor).toBeTruthy();
      for (const eski of kartlar) {
        const ref = ESLEME[eski.title];
        expect(ref, eski.title + ' eşlenmemiş').toBeTruthy();
        const kayit = refKayit(ref);
        const kartBasligi = (kayit.card && kayit.card.title) || kayit.title;
        const yeniKart = serit.items.find(k => k.title === kartBasligi);
        expect(yeniKart, anchor + ' şeridinde ' + eski.title + ' yok').toBeTruthy();

        for (const alan of Object.keys(eski)) {
          if (TURETILEN.includes(alan)) continue;
          const anahtar = anchor + '|' + eski.title + '|' + alan;
          if (FARKLAR[anahtar]) continue;
          if (alan === 'reviews') {
            /* Sayı kayıtta korunmuş; yazılışı ortak kurala göre. */
            expect(kayit.rating.count, anahtar).toBe(eskiYorumSayisi(eski.reviews));
            expect(yeniKart.reviews, anahtar).toBe(formatReviewCount(kayit.rating.count));
            continue;
          }
          expect(yeniKart[alan], anahtar).toEqual(eski[alan]);
        }
        /* Tarih artık türetiliyor ve boş değil. */
        expect(yeniKart.meta2, eski.title + ' tarih').toBeTruthy();
      }
    });
  }

  it('bilinen farkların her biri gerçekten var (eskimiş istisna kalmasın)', () => {
    for (const anahtar of Object.keys(FARKLAR)) {
      const [anchor, baslik, alan] = anahtar.split('|');
      const eski = ESKI_SERITLER[anchor].find(k => k.title === baslik);
      const kayit = refKayit(ESLEME[baslik]);
      const serit = yeni.find(s => s.anchor === anchor);
      const yeniKart = serit.items.find(k => k.title === ((kayit.card && kayit.card.title) || kayit.title));
      expect(yeniKart[alan], anahtar).not.toEqual(eski[alan]);
    }
  });

  it('şeritlere eskisinde olmayan örnek ürün eklenmedi', () => {
    /* Taşıma şeridin içeriğini değiştirmemeli: sayfası olan ürünler
       eskisi gibi kendiliğinden, örnekler yalnızca eskiden orada olanlar. */
    for (const s of yeni) {
      const eskiRefler = new Set((ESKI_SERITLER[s.anchor] || []).map(k => ESLEME[k.title]));
      for (const r of s.picks) expect(eskiRefler.has(r), s.anchor + ' · ' + r).toBe(true);
    }
  });

  it('en çok satanlar eski sırayla ve aynı ürünlerle', () => {
    const blok = app.match(/const top10 = \[([\s\S]*?)\n\];/)[1];
    const refler = [...blok.matchAll(/'([a-z]+\/[a-z0-9-]+)'/g)].map(m => m[1]);
    expect(refler).toEqual(ESKI_TOP10.map(e => ESLEME_TOP10[e.t]));
  });
});

describe('örnek kayıtlar', () => {
  const kayitliGorseller = () => {
    const blok = app.match(/const cardImages = \{([\s\S]*?)\n\};/)[1];
    return new Set([...blok.matchAll(/"([^"]+)":/g)].map(m => m[1]));
  };

  it('kart görselleri görsel sözlüğünde kayıtlı', () => {
    const kayitli = kayitliGorseller();
    for (const g of Object.values(SAMPLE_PRODUCTS)) {
      for (const k of Object.values(g)) expect(kayitli.has(k.card.img), k.slug + ' · ' + k.card.img).toBe(true);
    }
  });

  it('kartı tıklanamıyor: sayfası olmayan ürüne ölü bağ verilmiyor', () => {
    const ornekBasliklar = new Set(Object.values(SAMPLE_PRODUCTS)
      .flatMap(g => Object.values(g)).map(k => k.card.title || k.title));
    const kartlar = catalogAllCards(BUGUN).filter(k => ornekBasliklar.has(k.title));
    expect(kartlar.length).toBeGreaterThan(20);
    kartlar.forEach(k => expect(k.href, k.title).toBeNull());
  });

  it('arama bütün örnek ürünleri buluyor', () => {
    const basliklar = new Set(catalogAllCards(BUGUN).map(k => k.title));
    for (const g of Object.values(SAMPLE_PRODUCTS)) {
      for (const k of Object.values(g)) expect(basliklar.has(k.card.title || k.title), k.slug).toBe(true);
    }
  });

  it('döviz fiyatlı kart kendi para biriminde', () => {
    const ege = catalogAllCards(BUGUN).find(k => k.title === 'Ege Adaları Balayı Kaçamağı');
    expect(ege.priceMain).toBe('149');
    expect(ege.currency).toBe('EUR');
    expect(app).toContain('function paraBirimiEtiketi(kod)');
    expect(app).not.toMatch(/<span class="currency">TL<\/span>/);
  });

  it('örnek etkinliklerin sezonu gelecek yaza kadar sürüyor', () => {
    for (const k of Object.values(SAMPLE_PRODUCTS.event)) {
      const son = k.performances[k.performances.length - 1].date;
      expect(son >= '2027-06-01', k.slug + ' ' + son).toBe(true);
    }
  });
});
