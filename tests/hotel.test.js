/* Otel icerik sayfasi (/otel/<slug>/) testleri.

   Iki bolum var ve tur testleriyle ayni mantikla kuruldu:
   1) Saf fonksiyonlar — tarih araligi, oda/misafir sinirlari, tutar,
      vergi, puan. DOM'a dokunmadiklari icin dogrudan cagriliyorlar.
   2) Icerik butunlugu — sayfa, hotel-page.js, hotel-data.js ve app.js
      metin olarak okunup birbirine bagli yerler karsilastiriliyor:
      menude hedefi olmayan sekme, sayfada karsiligi olmayan kap,
      anasayfada otel sayfasindakinden farkli bir fiyat gibi sessiz
      kaymalar burada yakalanir.

   Otel sayfasi tur sayfasinin KABUGUNU paylastigi icin (assets/css/tour.css)
   bazi testler ayni seyi iki sayfa icin ayri ayri dogruluyor; gerekce
   docs/otel-sayfasi.md icinde. */
import { describe, it, expect } from 'vitest';
import { MolaVeri, KAPI_SITE_ADRESI } from '../assets/js/data-gateway.js';
import { readFileSync, existsSync } from 'node:fs';
import {
  HOTELS,
  DEFAULT_HOTEL_SLUG,
  HOTEL_IMAGE_FILES,
  hotelImage,
  hotelCheckout,
  nightsBetween,
  hotelRoom,
  hotelBoard,
  clampStay,
  hotelAddonLines,
  calcHotelTotal,
  hotelNightlyFrom,
  hotelNightlyListFrom,
  hotelScore,
  hotelScoreText,
  hotelSlugFromPath,
} from '../assets/js/hotel-data.js';
import { TOUR_ICONS, TOUR_IMAGE_FILES, commonsImageUrl, formatTRY } from '../assets/js/tour-data.js';
import { catalogCards, catalogAllCards, cardDateText } from '../assets/js/catalog.js';

/* Tarih tureten testler sabit bir "bugun" kullaniyor. */
const BUGUN = '2026-09-21';

const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');

const sayfaJs = oku('assets/js/hotel-page.js');
const veriJs = oku('assets/js/hotel-data.js');
const app = oku('assets/js/app.js');
const otelStil = oku('assets/css/hotel.css');
const turStil = oku('assets/css/tour.css');

/* Her otelin kendi HTML dosyasi var: /otel/<slug>/index.html. Statik
   bilgiler (H1, sekme basligi, kirilma noktalari) elle yazildigi icin
   asagidaki testler her sayfayi kendi otel kaydiyla karsilastirir. */
const sayfalar = Object.keys(HOTELS).map(slug => ({
  slug,
  otel: HOTELS[slug],
  html: oku('otel/' + slug + '/index.html')
}));

const otel = HOTELS[DEFAULT_HOTEL_SLUG];
const sayfa = sayfalar.find(s => s.slug === DEFAULT_HOTEL_SLUG).html;

/* Ortak bir secim: testlerin cogu bunun uzerinden yuruyor. */
const secim = { checkIn: '2026-10-10', nights: 2, rooms: 1, adults: 2, children: 0,
  room: 'standart', board: 'bb', addons: [] };

/* ---------------- tarih araligi ---------------- */
describe('tarih araligi', () => {
  it('cikis tarihi giris + gece sayisi', () => {
    expect(hotelCheckout('2026-10-10', 3)).toBe('2026-10-13');
    expect(hotelCheckout('2026-10-30', 3)).toBe('2026-11-02');
    /* Yil sonu: ay ve yil birlikte donmeli. */
    expect(hotelCheckout('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('gece sayisi en az bir', () => {
    /* Otelde "sifir gecelik" konaklama yok; cagiran taraf 0 verse bile
       cikis bir gun sonraya duser. */
    expect(hotelCheckout('2026-10-10', 0)).toBe('2026-10-11');
    expect(hotelCheckout('2026-10-10', -4)).toBe('2026-10-11');
  });

  it('gecersiz tarih bos doner', () => {
    expect(hotelCheckout('', 2)).toBe('');
    expect(hotelCheckout(null, 2)).toBe('');
  });

  it('iki tarih arasindaki gece sayisi', () => {
    expect(nightsBetween('2026-10-10', '2026-10-13')).toBe(3);
    expect(nightsBetween('2026-10-30', '2026-11-02')).toBe(3);
  });

  it('cikis girisle ayni veya once ise gece yok', () => {
    /* "Gecersiz aralik" bilgisinin kendisi lazim: sessizce 1'e
       yuvarlanirsa hatali secim fiyata donusur. */
    expect(nightsBetween('2026-10-10', '2026-10-10')).toBe(0);
    expect(nightsBetween('2026-10-10', '2026-10-09')).toBe(0);
  });

  it('cikis ve gece hesaplari birbirinin tersi', () => {
    for (let gece = 1; gece <= 14; gece++) {
      expect(nightsBetween('2026-10-10', hotelCheckout('2026-10-10', gece))).toBe(gece);
    }
  });
});

/* ---------------- secim sinirlari ---------------- */
describe('secim sinirlari', () => {
  it('gece sayisi otelin alt ve ust sinirina cekilir', () => {
    expect(clampStay(otel, { ...secim, nights: 0 }).nights).toBe(otel.pricing.minNights);
    expect(clampStay(otel, { ...secim, nights: 99 }).nights).toBe(otel.pricing.maxNights);
  });

  it('misafir odaya sigmiyorsa oda sayisi yukseltilir', () => {
    /* Standart oda iki kisilik; uc misafir icin iki oda gerekir.
       Kullanici bir oda sectiyse bile hesap iki odadan yapilir --
       aksi halde ucuncu kisi ucretsiz konaklamis olurdu. */
    const plan = clampStay(otel, { ...secim, adults: 3, rooms: 1, room: 'standart' });
    expect(plan.rooms).toBe(2);
  });

  it('dort kisilik aile odasi tek odada kalir', () => {
    const plan = clampStay(otel, { ...secim, adults: 2, children: 2, rooms: 1, room: 'aile' });
    expect(plan.rooms).toBe(1);
    expect(plan.guests).toBe(4);
  });

  it('tesis oda siniri misafir sayisini geri ceker', () => {
    /* En fazla 3 oda x 2 kisilik standart oda = 6 kisi. Sekiz kisi
       istense bile alti kisiye duser; once cocuk, sonra yetiskin. */
    const plan = clampStay(otel, { ...secim, adults: 8, children: 2, rooms: 9, room: 'standart' });
    expect(plan.rooms).toBe(otel.pricing.maxRooms);
    expect(plan.guests).toBe(otel.pricing.maxRooms * 2);
    expect(plan.adults).toBe(6);
    expect(plan.children).toBe(0);
  });

  it('en az bir yetiskin kalir', () => {
    expect(clampStay(otel, { ...secim, adults: 0 }).adults).toBe(1);
    expect(clampStay(otel, { ...secim, adults: -3 }).adults).toBe(1);
  });

  it('taninmayan oda ve pansiyon ilk kayda duser', () => {
    const plan = clampStay(otel, { ...secim, room: 'yok', board: 'yok' });
    expect(plan.room.id).toBe(otel.rooms[0].id);
    expect(plan.board.id).toBe(otel.boards[0].id);
  });

  it('oda ve pansiyon cozumleyicileri kimlikle calisir', () => {
    expect(hotelRoom(otel, 'suit').id).toBe('suit');
    expect(hotelBoard(otel, 'hb').id).toBe('hb');
  });
});

/* ---------------- tutar ---------------- */
describe('konaklama tutari', () => {
  it('oda tutari gecelik x oda x gece', () => {
    const hesap = calcHotelTotal(otel, { ...secim, nights: 3, rooms: 2, adults: 4 });
    expect(hesap.roomTotal).toBe(1950 * 2 * 3);
  });

  it('kahvatli pansiyonda fark yok', () => {
    const hesap = calcHotelTotal(otel, secim);
    expect(hesap.boardTotal).toBe(0);
    /* Fiyati sifir olan satir ozette "Dahil" diye gorunsun diye
       'free' turunde basiliyor. */
    expect(hesap.lines.some(l => l.kind === 'free')).toBe(true);
  });

  it('yarim pansiyon kisi basi ve gece basi', () => {
    const hesap = calcHotelTotal(otel, { ...secim, nights: 3, adults: 2, board: 'hb' });
    expect(hesap.boardTotal).toBe(450 * 2 * 3);
  });

  it('cocuk pansiyon tarifesi yetiskinden ayri', () => {
    const hesap = calcHotelTotal(otel, { ...secim, nights: 2, adults: 2, children: 1,
      room: 'aile', board: 'hb' });
    expect(hesap.boardTotal).toBe((450 * 2 + 250 * 1) * 2);
  });

  it('konaklama vergisi oda ve pansiyon uzerinden, ek hizmetler haric', () => {
    /* Vergi matrahi bilerek daraltilmis: transfer ve otopark yan
       hizmet olarak fiyatlaniyor. Matrah degisirse tek yer degisir. */
    const hesap = calcHotelTotal(otel, { ...secim, nights: 2, board: 'hb', addons: ['transfer'] });
    expect(hesap.tax).toBe(Math.round((hesap.roomTotal + hesap.boardTotal) * 0.02));
    expect(hesap.addonsTotal).toBe(850);
    expect(hesap.total).toBe(hesap.subtotal + hesap.addonsTotal + hesap.tax);
  });

  it('ek hizmetin uc carpani birbirinden farkli', () => {
    const temel = { ...secim, nights: 3, adults: 2, children: 1, room: 'aile' };
    const hepsi = calcHotelTotal(otel, { ...temel, addons: ['transfer', 'otopark', 'terasMenu'] });
    const tutar = (id) => hepsi.addons.find(a => a.id === id).amount;
    expect(tutar('transfer')).toBe(850);            // rezervasyon basina
    expect(tutar('otopark')).toBe(250 * 3);         // gece basina
    expect(tutar('terasMenu')).toBe(780 * 3);       // kisi basina
  });

  it('secilmeyen ek hizmet tutara girmez', () => {
    expect(hotelAddonLines(otel, { ...secim, addons: [] })).toEqual([]);
    expect(calcHotelTotal(otel, secim).addonsTotal).toBe(0);
  });

  it('avantaj yalnizca oda fiyati uzerinden', () => {
    /* Pansiyon ve ek hizmetler birer ek ucret; liste fiyati
       karsilastirmasina girmezler. */
    const hesap = calcHotelTotal(otel, { ...secim, nights: 2, board: 'hb', addons: ['otopark'] });
    expect(hesap.saving).toBe((2450 - 1950) * 2);
  });

  it('ozet satirlarinin toplami odenecek tutara esit', () => {
    /* Ekranda gorunen dokum ile buyuk rakam ayrisamaz: ikisi de
       hesap.lines'tan besleniyor. */
    const hesap = calcHotelTotal(otel, { ...secim, nights: 4, rooms: 2, adults: 3,
      children: 1, room: 'deniz', board: 'hb', addons: ['transfer', 'otopark'] });
    const toplam = hesap.lines.reduce((t, l) => t + l.amount, 0);
    expect(toplam).toBe(hesap.total);
  });

  it('hesap kendi sinirlarini uygular', () => {
    /* Kart sinirlari asilmis bir secim gonderse bile tutar sinirli
       secimden hesaplanir. */
    const hesap = calcHotelTotal(otel, { ...secim, adults: 12, nights: 40, room: 'standart' });
    expect(hesap.guests).toBeLessThanOrEqual(otel.pricing.maxRooms * 2);
    expect(hesap.nights).toBe(otel.pricing.maxNights);
  });

  it('en ucuz oda fiyati ve liste fiyati', () => {
    const enUcuz = otel.rooms.reduce((a, b) => (a.nightly <= b.nightly ? a : b));
    expect(hotelNightlyFrom(otel)).toBe(enUcuz.nightly);
    expect(hotelNightlyListFrom(otel)).toBe(enUcuz.nightlyList);
  });
});

/* ---------------- puan ---------------- */
describe('otel puani', () => {
  it('10 uzerinden skor dagilimdan turetilir', () => {
    expect(hotelScore({ 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 })).toBe(10);
    expect(hotelScore({ 5: 0, 4: 0, 3: 1, 2: 0, 1: 0 })).toBe(6);
    expect(hotelScore({ 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 })).toBe(9);
  });

  it('yorum yoksa sifir', () => {
    expect(hotelScore({})).toBe(0);
    expect(hotelScore(null)).toBe(0);
  });

  it('metin bicimi virgullu', () => {
    expect(hotelScoreText(otel.ratingBreakdown)).toBe('8,9');
    expect(hotelScoreText(otel.ratingBreakdown)).not.toContain('.');
  });
});

/* ---------------- kontenjan ----------------
   Kalan yer artık uydurulmuyor. Önceki roomsLeft() tarih metninin karma
   değerinden bir "son N yer" sayısı üretiyordu; hiçbir satışla ilgisi
   yoktu ve dolu durumu hiç oluşmuyordu. Kalan yer veri kapısının
   kontenjan cevabından geliyor (MolaVeri.musaitlik). Cevabın kendisi ve
   hesap tests/veri-kapisi.test.js'te; burada sayfanın onu kullandığı
   ölçülüyor. */
describe('kontenjan', () => {
  const kontenjanFn = () => sayfaJs.match(/function syncSeats\(hesap\) \{([\s\S]*?)\n  \}/)[1];

  it('karma değerden kalan yer üreten fonksiyon yok', () => {
    expect(veriJs).not.toMatch(/function \w*(seatsLeft|SeatsLeft|roomsLeft)\(/);
    expect(sayfaJs).not.toMatch(/(seatsLeft|SeatsLeft|roomsLeft)\(/);
  });

  it('kayıt ve kalan yer veri kapısından', () => {
    expect(sayfaJs).toMatch(/MolaVeri\.urun\('hotel',\s/);
    expect(sayfaJs).not.toMatch(/resolveHotel\(/);
    expect(sayfaJs).toContain("MolaVeri.musaitlik('hotel', ");
    expect(kontenjanFn()).toContain('kontenjanDurumu(');
  });

  it('dolu tarih takvimde kalıyor ama seçilemiyor', () => {
    const fn = sayfaJs.match(/function dateChipsMarkup\(\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('tarihDoluMu(musaitlik, ');
    expect(fn).toContain('is-dolu');
    expect(fn).toContain('disabled');
  });

  it('dolu veya yetmeyen kontenjanda rezervasyon düğmeleri pasif', () => {
    const fn = kontenjanFn();
    expect(fn).toContain("durum.durum === 'doldu' || durum.durum === 'yetersiz'");
    expect(fn).toContain('dugme.disabled = !!satisEngeli');
    expect(sayfaJs).toMatch(/id="tourStickyCta"\$\{satisEngeli \? ' disabled' : ''\}/);
  });

  it('cevap gelmeden kontenjan satırı gizli, satış engellenmiyor', () => {
    expect(kontenjanFn()).toContain("el.hidden = durum.durum === 'bilinmiyor'");
    expect(readFileSync(new URL('../assets/css/tour.css', import.meta.url), 'utf8'))
      .toContain('.tour-seats[hidden] { display: none; }');
  });

  it('her sayfa veri kapısını kendi betiğinden önce yüklüyor', () => {
    for (const s of sayfalar) {
      const yer = (ad) => s.html.indexOf('assets/js/' + ad + '"');
      expect(yer('taxonomy-data.js'), s.slug).toBeGreaterThan(-1);
      expect(yer('inventory-data.js'), s.slug).toBeGreaterThan(yer('taxonomy-data.js'));
      expect(yer('data-gateway.js'), s.slug).toBeGreaterThan(yer('inventory-data.js'));
      expect(yer('hotel-page.js'), s.slug).toBeGreaterThan(yer('data-gateway.js'));
    }
  });
});

/* ---------------- adres ---------------- */
describe('adres ve kayit cozumleme', () => {
  it('slug adresten okunur', () => {
    expect(hotelSlugFromPath('/otel/kordon-butik-otel/')).toBe('kordon-butik-otel');
    expect(hotelSlugFromPath('/mola360/otel/kordon-butik-otel/index.html')).toBe('kordon-butik-otel');
  });

  it('otel adresi olmayan yol bos doner', () => {
    expect(hotelSlugFromPath('/tur/efes-sirince/')).toBe('');
    expect(hotelSlugFromPath('/otel/index.html')).toBe('');
    expect(hotelSlugFromPath('')).toBe('');
  });

  it('taninmayan slug varsayilan otele DUSMUYOR', () => {
    expect(MolaVeri.urun('hotel', 'yok-boyle-bir-otel')).toBe(null);
    expect(MolaVeri.urun('hotel', '')).toBe(null);
    expect(MolaVeri.urun('hotel', 'KORDON-BUTIK-OTEL').slug).toBe(DEFAULT_HOTEL_SLUG);
  });

  it('her kaydin anahtari kendi slug alaniyla ayni', () => {
    Object.keys(HOTELS).forEach(slug => expect(HOTELS[slug].slug).toBe(slug));
  });
});

/* ---------------- gorseller ve ikonlar ---------------- */
describe('gorseller ve ikonlar', () => {
  it('kullanilan her gorsel anahtari kayitli', () => {
    /* Kayitsiz anahtar bos src uretir; ui.js'in yer tutucusu bos src'yi
       yakalamaz, yani sessizce bos bir kutu kalir. */
    const kullanilan = new Set();
    [otel.gallery, otel.similar].forEach(liste =>
      liste.forEach(g => kullanilan.add(g.key)));
    otel.rooms.forEach(o => kullanilan.add(o.key));
    [...kullanilan].forEach(k =>
      expect(HOTEL_IMAGE_FILES[k], 'kayitsiz gorsel anahtari: ' + k).toBeTruthy());
  });

  it('kayitsiz anahtar bos adres dondurur', () => {
    expect(hotelImage('yok', 400)).toBe('');
    expect(hotelImage('kordonBoyu', 400)).toContain('Special:FilePath');
  });

  it('ortak gorseller iki dosyada da ayni adresi uretir', () => {
    /* Ayni fotograf iki farkli adrese gitmesin: dosya adi birebir ayni
       yazilmak zorunda. app.js'teki cardImages Unsplash adresleri
       tutuyor, bu yuzden karsilastirma Commons kayitlari arasinda. */
    Object.keys(HOTEL_IMAGE_FILES).forEach(anahtar => {
      const turKayit = TOUR_IMAGE_FILES[anahtar];
      if (!turKayit) return;
      expect(hotelImage(anahtar, 800), anahtar + ' iki dosyada farkli')
        .toBe(commonsImageUrl(turKayit.dosya, 800));
    });
  });

  it('kullanilan her ikon TOUR_ICONS icinde tanimli', () => {
    /* Otel sayfasi tur sayfasinin ikon setini kullaniyor; tanimsiz ad
       bos bir <svg> basar ve hicbir hata vermez. */
    const kullanilan = new Set();
    for (const m of sayfaJs.matchAll(/(?:ic|tourSvg)\('([a-zA-Z0-9]+)'\)/g)) kullanilan.add(m[1]);
    [otel.badges, otel.facts, otel.trust, otel.amenities, otel.policies,
     otel.location.transport].forEach(liste =>
      liste.forEach(x => { if (x.icon) kullanilan.add(x.icon); }));
    const eksik = [...kullanilan].filter(k => !TOUR_ICONS[k]);
    expect(eksik, 'tanimsiz ikon: ' + eksik.join(', ')).toEqual([]);
  });

  it('ciplak tourSvg kullanan her sinifin svg olcu kurali var', () => {
    /* ic() ikonu <span class="icon"> icine sarar, tourSvg() ciplak
       <svg> dondurur; CSS yalnizca ".X .icon" olcusu veriyorsa ciplak
       svg dugmeyi bastan basa kaplar. */
    const ciplak = [...sayfaJs.matchAll(/class="([a-z0-9 -]+)"[^>]*>\$\{tourSvg\(/g)]
      .map(m => m[1].split(/\s+/)[0]);
    expect(ciplak.length, 'oruntu hic eslesmedi, test olmus olabilir').toBeGreaterThan(2);
    [...new Set(ciplak)].forEach(sinif => {
      const kural = new RegExp('\\.' + sinif + '\\s+svg\\b');
      expect(kural.test(turStil) || kural.test(otelStil),
        '.' + sinif + ' ciplak <svg> basiyor ama olcu kurali yok').toBe(true);
    });
  });
});

/* ---------------- sayfa ile kayit tutarliligi ---------------- */
describe('sayfa ve kayit tutarliligi', () => {
  it('her otel kaydinin kendi sayfasi var', () => {
    Object.keys(HOTELS).forEach(slug =>
      expect(existsSync(new URL('../otel/' + slug + '/index.html', import.meta.url)),
        slug + ' sayfasi yok').toBe(true));
  });

  it('H1 ve alt baslik kayitla birebir ayni', () => {
    /* Statik isaretleme JS calismadan da dogru olsun diye elle yazili;
       elle yazilan her metin kayitla ayrisabilir. */
    sayfalar.forEach(({ slug, otel: o, html }) => {
      expect(html, slug + ' H1 farkli').toContain('<h1>' + o.title + '</h1>');
      expect(html, slug + ' alt baslik farkli')
        .toContain('<p class="tour-lead">' + o.tagline + '</p>');
    });
  });

  it('mobil baslik kayitla ayni', () => {
    sayfalar.forEach(({ slug, otel: o, html }) => {
      expect(html, slug + ' mobil baslik farkli')
        .toContain('<span class="tour-mobile-title">' + o.title + '</span>');
      expect(html, slug + ' mobil alt baslik farkli')
        .toContain('<span class="tour-mobile-subtitle">' + o.categoryShort + ' · ' + o.area + '</span>');
    });
  });

  it('kirilma noktalari kayitla ayni', () => {
    sayfalar.forEach(({ slug, otel: o, html }) => {
      const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
      const adlar = ld.itemListElement.map(i => i.name);
      expect(ld['@type']).toBe('BreadcrumbList');
      expect(adlar, slug + ' kirilma noktasi farkli').toEqual(['Anasayfa', o.categoryPlural, o.title]);
      /* Orta adim anasayfadaki seridin gercek capasina gider. */
      expect(ld.itemListElement[1].item).toBe(KAPI_SITE_ADRESI + MolaVeri.listeYolu(o) + '/');
      expect(ld.itemListElement[2].item).toContain('/otel/' + slug + '/');
    });
  });

  it('uydurma fiyat ve puan yapisal veri olarak isaretlenmiyor', () => {
    /* Icerik ornek oldugu surece Hotel/Offer/AggregateRating yazmak
       yaniltici yapisal veridir (docs/seo-arastirma.md, madde 2). */
    sayfalar.forEach(({ slug, html }) => {
      const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
      ld.forEach(blok => {
        ['"@type": "Hotel"', 'AggregateRating', '"Offer"'].forEach(tip =>
          expect(blok.includes(tip), slug + ' icinde ' + tip).toBe(false));
      });
    });
  });

  it('canonical adres sayfanin kendi adresi', () => {
    sayfalar.forEach(({ slug, html }) => {
      expect(html).toContain('rel="canonical" href="https://bedirinci.github.io/mola360/otel/' + slug + '/"');
    });
  });

  it('doldurulan her kabin sayfada karsiligi var', () => {
    /* fill('x', ...) sessizce hicbir sey yapmaz; kap silinirse bolum
       kaybolur ve kimse fark etmez. */
    const kaplar = [...sayfaJs.matchAll(/fill\('([a-zA-Z-]+)'/g)].map(m => m[1]);
    expect(kaplar.length).toBeGreaterThan(8);
    sayfalar.forEach(({ slug, html }) => {
      kaplar.forEach(id =>
        expect(html, slug + ' icinde #' + id + ' yok').toContain('id="' + id + '"'));
    });
  });

  it('bolum menusundeki her sekmenin sayfada karsiligi var', () => {
    const blok = sayfaJs.match(/const TUM_SECTIONS = \[([\s\S]*?)\n  \];/)[1];
    const idler = [...blok.matchAll(/id: '([a-z-]+)'/g)].map(m => m[1]);
    expect(idler.length).toBeGreaterThan(5);
    sayfalar.forEach(({ slug, html }) => {
      idler.forEach(id =>
        expect(html, slug + ' icinde #' + id + ' bolumu yok').toContain('id="' + id + '"'));
    });
  });

  it('sayfa otele ait dosyalari dogru sirada yukluyor', () => {
    /* hotel-data.js tour-data.js'teki adlari kullaniyor; sira bozulursa
       sayfa ilk satirda oluyor. hotel-page.js ikisinden de sonra. */
    sayfalar.forEach(({ slug, html }) => {
      const sira = ['assets/js/tour-data.js', 'assets/js/hotel-data.js', 'assets/js/hotel-page.js']
        .map(yol => html.indexOf(yol));
      sira.forEach((yer, i) => expect(yer, slug + ' ' + i + '. dosya yuklenmiyor').toBeGreaterThan(-1));
      expect(sira[0], slug + ' tour-data.js hotel-data.js\'ten sonra').toBeLessThan(sira[1]);
      expect(sira[1], slug + ' hotel-data.js hotel-page.js\'ten sonra').toBeLessThan(sira[2]);
      expect(html).toContain('assets/css/tour.css');
      expect(html).toContain('assets/css/hotel.css');
    });
  });

  it('tur sayfasina ait dosyalar otel sayfasina yuklenmiyor', () => {
    /* tour-page.js otel sayfasinda calisirsa kendi kaplarini bulamaz
       ama tour-pdf ile birlikte bos yere ~2 MB indirilir. */
    sayfalar.forEach(({ slug, html }) => {
      expect(html, slug + ' tour-page.js yukluyor').not.toContain('assets/js/tour-page.js');
      expect(html, slug + ' tour-pdf.js yukluyor').not.toContain('assets/js/tour-pdf.js');
    });
  });
});

/* ---------------- sayfa etiketleri ---------------- */
describe('sayfa etiketleri', () => {
  it('hedefi olmayan cip yok', () => {
    /* docs/seo-arastirma.md madde 4: ic baglanti aginin degeri
       hedefler gercek olana kadar sifir. Sayfa ici capa gercekten o
       sayfada, disa giden adres de diskte olmali. */
    sayfalar.forEach(({ slug, otel: o, html }) => {
      (o.tags || []).forEach(t => {
        if (t.href.charAt(0) === '#') {
          expect(html, slug + ' -> ' + t.href + ' sayfada yok')
            .toContain('id="' + t.href.slice(1) + '"');
          return;
        }
        const dosya = t.href.split('#')[0];
        const yol = dosya.endsWith('/') ? dosya + 'index.html' : dosya;
        expect(existsSync(new URL('../' + yol, import.meta.url)),
          slug + ' -> ' + t.href + ' diskte yok').toBe(true);
      });
    });
  });

  it('anasayfa capalari gercekten var', () => {
    const kartBloku = app.match(/const cardSections = \[([\s\S]*?)\n\];/)[1];
    const ankrajlar = [...kartBloku.matchAll(/anchor:'([a-z-]+)'/g)].map(m => m[1]);
    sayfalar.forEach(({ slug, otel: o }) => {
      (o.tags || [])
        .filter(t => t.href.includes('index.html#'))
        .forEach(t => {
          const capa = t.href.split('#')[1];
          expect(ankrajlar, slug + ' -> #' + capa + ' anasayfada yok').toContain(capa);
        });
    });
  });

  it('cip gorunumu anasayfayla ortak, ayri bir kopya degil', () => {
    expect(sayfaJs).toContain('class="seo-chip"');
    expect(sayfaJs).toContain('class="seo-chip-list tour-tag-list"');
    /* Kok-goreli adresler KOK ile oneklenir, '#' oldugu gibi kalir. */
    expect(sayfaJs).toContain('KOK + t.href');
  });
});

/* ---------------- anasayfa baglantisi ---------------- */
describe('anasayfa baglantisi', () => {
  /* Otel kartlari anasayfaya ELLE yazilmiyor: catalog.js onlari HOTELS
     kayitlarindan uretip "Oteller" seridine karistiriyor
     (docs/icerik-katalogu.md). Testler bu yuzden app.js metnine degil
     uretilen kartlara bakiyor. */
  const otelKartlari = catalogAllCards(BUGUN).filter(k => k.href && !k.ornek && k.href.startsWith('otel/'));

  it('her otel anasayfaya kendiliginden giriyor', () => {
    const baglar = otelKartlari.map(k => k.href);
    Object.keys(HOTELS).forEach(slug =>
      expect(baglar, slug + ' anasayfaya girmiyor').toContain('otel/' + slug + '/'));
  });

  it('her otel kendi kategori seridine giriyor', () => {
    Object.values(HOTELS).forEach(o => {
      const seritte = catalogCards(o.categoryAnchor, BUGUN).map(k => k.href);
      expect(seritte, o.slug + ' -> #' + o.categoryAnchor + ' seridinde yok')
        .toContain('otel/' + o.slug + '/');
    });
  });

  it('baglar /otel/<slug>/ biciminde ve slug gercek bir otel', () => {
    otelKartlari.forEach(kart => {
      expect(kart.href, kart.href + ' /otel/<slug>/ biciminde degil').toMatch(/^otel\/[a-z0-9-]+\/$/);
      const slug = kart.href.replace(/^otel\//, '').replace(/\/$/, '');
      expect(HOTELS[slug], slug + ' HOTELS icinde yok').toBeTruthy();
      expect(HOTELS[slug].slug).toBe(slug);
    });
  });

  it('anasayfadaki fiyat en ucuz odanin gecelik ucreti', () => {
    /* Listede bir fiyat, detayda baska bir fiyat gormek guveni bitirir. */
    otelKartlari.forEach(kart => {
      const slug = kart.href.replace(/^otel\//, '').replace(/\/$/, '');
      expect(Number(kart.priceMain), slug + ' kart fiyati otel fiyatiyla ayni degil')
        .toBe(hotelNightlyFrom(HOTELS[slug]));
      expect(kart.unit, slug + ' kart birimi /gece degil').toBe('/gece');
    });
  });

  it('anasayfadaki puan otel sayfasindaki skorla ayni', () => {
    /* Otel puani 10 uzerinden ve yorum dagilimindan turetiliyor. */
    otelKartlari.forEach(kart => {
      const slug = kart.href.replace(/^otel\//, '').replace(/\/$/, '');
      expect(Number(kart.rating), slug + ' kart puani skordan farkli')
        .toBe(hotelScore(HOTELS[slug].ratingBreakdown));
    });
  });

  it('musaitlik tarihi otelin kendi kuralindan geliyor', () => {
    /* Ayni gun giris satilmiyor (leadDays: 1), yani en erken giris yarin.
       Kart elle yaziliyken orada "Bugun" yaziyordu ve otel sayfasindaki
       takvimle celisiyordu. */
    otelKartlari.forEach(kart => {
      const slug = kart.href.replace(/^otel\//, '').replace(/\/$/, '');
      const ilkGiris = hotelCheckout(BUGUN, HOTELS[slug].pricing.leadDays);
      const beklenen = HOTELS[slug].pricing.leadDays === 0 ? 'Bugün' : cardDateText(ilkGiris, BUGUN);
      expect(kart.meta2, slug + ' musaitlik metni bekleneni vermiyor').toBe(beklenen);
    });
  });

  it('kart basligi kayittan geliyor', () => {
    otelKartlari.forEach(kart => {
      const slug = kart.href.replace(/^otel\//, '').replace(/\/$/, '');
      const o = HOTELS[slug];
      expect(kart.title, slug + ' kart basligi farkli').toBe((o.card && o.card.title) || o.title);
    });
  });
});

/* ---------------- metin tek kaynakta ---------------- */
describe('metin tek kaynakta', () => {
  it('oda adlari ve fiyatlari yalnizca veride', () => {
    /* Sayfada gorunen hicbir icerik metni hotel-page.js'e yazilmaz;
       bir oteli degistirmek icin tek dosya yetmeli. */
    otel.rooms.forEach(o => {
      expect(sayfaJs, o.name + ' isaretlemeye yazilmis').not.toContain(o.name);
      expect(sayfaJs, o.nightly + ' fiyati isaretlemeye yazilmis')
        .not.toContain(String(o.nightly));
    });
  });

  it('otel adi ve adresi isaretlemeye yazilmamis', () => {
    expect(sayfaJs).not.toContain(otel.title);
    expect(sayfaJs).not.toContain(otel.location.address);
  });

  it('destek numarasi ortak kaynaktan geliyor', () => {
    /* Numara iki sayfada ayri ayri yazilmasin diye home-blocks.js'teki
       CONTACT okunuyor. */
    expect(sayfaJs).toContain('CONTACT.phoneHref');
    expect(sayfaJs).toContain('CONTACT.whatsappHref');
    expect(sayfaJs).not.toMatch(/0850\s*000/);
  });

  it('bicimlendirme ve hesaplar tekrar yazilmamis', () => {
    /* Tarih, para ve puan yardimcilarinin otel kopyasi yok: hepsi
       tour-data.js'ten geliyor. */
    ['function formatTRY', 'function formatTrDate', 'function ratingSummary',
     'function refundAmount', 'function reviewerInitials']
      .forEach(fn => expect(veriJs, fn + ' otel tarafinda tekrar tanimlanmis')
        .not.toContain(fn));
    expect(veriJs).toContain("require('./tour-data.js')");
  });
});

/* ---------------- katman acikken arka sayfa kilidi ---------------- */
describe('katman kilidi', () => {
  const kilit = sayfaJs.match(/function lockScroll\(on\) \{([\s\S]*?)\n  \}/)[1];

  it('govde sabitleniyor, yalnizca overflow ile yetinilmiyor', () => {
    /* iOS Safari html'deki "overflow: hidden" kuralini dokunmatik
       kaydirmada uygulamiyor; calisan yol govdeyi sabitlemek
       (olcum ve gerekce docs/tur-sayfasi.md icinde). */
    expect(kilit).toContain("govde.style.position = 'fixed'");
    expect(kilit).toContain("govde.style.top = -kilitliY + 'px'");
    expect(kilit).toContain('window.scrollTo(0, kilitliY)');
  });

  it('ust uste acilan katmanlar icin sayac var', () => {
    /* Ikinci kilit konumu yeniden okursa 0 yazar: govde zaten sabit. */
    expect(kilit).toContain('kilitSayaci += 1');
    expect(kilit).toContain('if (kilitSayaci > 1) return;');
  });

  it('her acilan katman kilidi aciyor', () => {
    /* Isik kutusu ve ozet sayfasi: ikisi de acilista true, kapanista
       false cagiriyor -- toplam dort cagri. */
    expect((sayfaJs.match(/lockScroll\((true|false)\)/g) || []).length).toBe(4);
  });
});

/* ---------------- gorunum kurallari ---------------- */
describe('parlama efekti yok', () => {
  /* Yorumlar eleniyor: bir kuralin NEDEN kalktigi yorumda anlatiliyor. */
  const temiz = otelStil.replace(/\/\*[\s\S]*?\*\//g, '');

  it('text-shadow yok', () => {
    const bulunan = (temiz.match(/text-shadow\s*:\s*[^;]+/g) || []).filter(k => !/none/.test(k));
    expect(bulunan, 'hotel.css icinde text-shadow: ' + bulunan.join(' | ')).toEqual([]);
  });

  it('marka rengiyle eslesen bulanik golge yok', () => {
    const markaRenkleri = [/140\s*,\s*198\s*,\s*63/, /37\s*,\s*211\s*,\s*102/, /var\(--green/];
    (temiz.match(/box-shadow\s*:\s*[^;]+/g) || []).forEach(kural => {
      kural.split(/,(?![^(]*\))/).forEach(kat => {
        const oncesi = kat
          .replace(/rgba?\([^)]*\)|var\([^)]*\)|#[0-9a-fA-F]{3,8}/g, ' ')
          .replace(/box-shadow\s*:|inset/g, ' ');
        const olcu = (oncesi.match(/-?[\d.]+/g) || []).map(Number);
        const bulanik = olcu.length >= 3 && olcu[2] > 0;
        if (!bulanik) return;
        markaRenkleri.forEach(renk =>
          expect(renk.test(kat), 'hotel.css icinde renkli parlama: ' + kat.trim()).toBe(false));
      });
    });
  });

  it('otel stili kendi renk paletini kurmuyor', () => {
    /* Renk, yaricap ve golge style.css'teki :root'tan gelir. */
    expect(temiz).not.toMatch(/:root\s*\{/);
    expect(temiz).toContain('var(--border)');
    expect(temiz).toContain('var(--radius)');
  });
});

describe('oda karti gorseli', () => {
  it('fotograf kutusu akistan cikmis ve oranla olculuyor', () => {
    /* Dikey cekilmis bir fotograf, gorsel akista kalirsa kutuyu
       aspect-ratio'nun ustune cikariyor ve o kart digerlerinden uzun
       duruyor -- benzer tur kartlarinda yasanip olculen hata
       (docs/tur-sayfasi.md). Ayni iki onlem burada da alindi. */
    const kural = otelStil.match(/\.otel-oda-media img \{([\s\S]*?)\n\}/)[1];
    expect(kural).toContain('position: absolute');
    expect(kural).toContain('object-fit: cover');
    const kutu = otelStil.match(/\.otel-oda-media \{([\s\S]*?)\n\}/)[1];
    expect(kutu).toContain('position: relative');
  });

  it('mobilde kart tek sutuna duser', () => {
    const mobil = otelStil.match(/@media \(max-width: 680px\) \{([\s\S]*?)\n\}\n/)[1];
    expect(mobil).toContain('.otel-oda { grid-template-columns: minmax(0, 1fr); }');
  });
});

/* ---------------- rezervasyon karti ---------------- */
describe('rezervasyon karti', () => {
  it('kart tek DOM dugumu olarak tasiniyor, klonlanmiyor', () => {
    /* Klonlanirsa secilmis tarih/oda ve dinleyiciler kayboluyor. */
    expect(sayfaJs).toContain('hedef.appendChild(bookingEl)');
    expect(sayfaJs).not.toContain('cloneNode');
    expect(sayfa).toContain('id="tourBookingMobile"');
    expect(sayfa).toContain('id="tourBookingDesktop"');
  });

  it('sinira gelen sayac dugmesi pasiflesiyor', () => {
    /* Tiklanip hicbir sey olmamasi yerine dugme kapaniyor ve nedeni
       alttaki satirda yaziyor. */
    expect(sayfaJs).toContain('btn.disabled = sonuc[hedef] === state[hedef]');
    expect(sayfaJs).toContain("getElementById('tourPartyLimit')");
  });

  it('ozet dokumu hesaptan besleniyor, ikinci kez hesaplanmiyor', () => {
    const fn = sayfaJs.match(/function summaryMarkup\(hesap\) \{([\s\S]*?)\n  \}/)[1];
    expect(fn).toContain('hesap.lines.map');
    expect(fn).toContain('formatTRY(hesap.total)');
    expect(fn).not.toMatch(/nightly|\* hesap\.nights/);
  });

  it('yapiskan seritte kisa tarih bicimi kullaniliyor', () => {
    /* Tam bicim ("10 Ekim Cumartesi – 13 Ekim Sali") dar seritte
       kesiliyor; kesik tarih hic tarih olmamasindan beter. */
    const blok = sayfaJs.match(/bar\.innerHTML = `([\s\S]*?)`;/)[1];
    expect(blok).toContain('dateRangeText(true)');
  });

  it('oda secimi tek durumdan besleniyor', () => {
    /* Oda hem listeden hem karttan secilebiliyor ama durum tek:
       state.room. Iki ayri durum tutulsaydi ikisini esit tutmak
       gerekirdi. */
    expect(sayfaJs).toContain("state.room = id");
    expect(sayfaJs).toContain("state.room = oda.getAttribute('data-room')");
    expect(sayfaJs).toContain('function syncRoomCards()');
  });
});
