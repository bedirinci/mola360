/* Rezervasyon ve ödeme (4. adım): booking-engine.js, veri kapısının
   teklif/rezervasyon uçları ve ödeme ekranının saf işaretlemesi.

   Kullanıcı kararları testte sabit:
     - turlarda %20 kapora; kalan turdan 1 gün önce ya da araçta,
       kalkıştan 1 gün önce müşteri aranıyor
     - tahsilat TL; döviz fiyatlı üründe kur rezervasyonda sabit
     - kart aileleri ve taksit oranları örnek tablo */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const R = require('../assets/js/booking-engine.js');
const { MolaVeri } = require('../assets/js/data-gateway.js');
const H = require('../assets/js/hotel-data.js');
const T = require('../assets/js/tour-data.js');
const O = require('../assets/js/checkout-page.js');
const L = require('../assets/js/listing-page.js');
const { PROMO_BANDS } = require('../assets/js/home-blocks.js');

const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');
const BUGUN = '2026-09-26';
const efes = () => MolaVeri.urun('tour', 'efes-sirince');
const kapadokya = () => MolaVeri.urun('tour', 'kapadokya-3-gece');
const otel = () => MolaVeri.urun('hotel', 'kordon-butik-otel');
const teklif = (tip, kayit, secim, secenek, bugun, baglam) => R.rezTeklif(tip, kayit, secim, secenek || {}, bugun || BUGUN, baglam);

describe('seçimin adres satırı', () => {
  const ornekler = {
    tour: { date: '2026-10-01', adults: 2, children: 1, infants: 1, city: 'ist', singleRoom: true, addons: ['a', 'b'] },
    hotel: { checkIn: '2026-10-02', nights: 2, room: 'aile', rooms: 1, board: 'hb', adults: 2, children: 1, addons: ['transfer'] },
    activity: { date: '2026-10-02', session: 'gun-dogumu', pack: 'standart', adults: 2, children: 0, addons: [] },
    event: { date: '2026-10-03', category: 'loca', full: 2, student: 1, addons: [] },
    venue: { date: '2026-10-02', slot: '10:00', option: 'sezlong', guests: 2, addons: [] }
  };

  it('yazılan seçim aynen geri okunuyor (beş tip)', () => {
    Object.entries(ornekler).forEach(([tip, secim]) => {
      const yol = R.rezOdemeYolu(tip, 'x-urun', secim);
      expect(yol.startsWith('rezervasyon/?urun=' + R.REZ_YOLLAR[tip] + '/x-urun'), tip).toBe(true);
      const geri = R.rezSecimOku(tip, yol.slice(yol.indexOf('?')));
      Object.keys(secim).forEach(k => expect(geri[k], tip + '.' + k).toEqual(secim[k]));
    });
  });

  it('sayfa durumundaki fazlalık adres satırına girmiyor', () => {
    const yol = R.rezOdemeYolu('tour', 'efes-sirince', { date: '2026-10-01', adults: 2, favorite: true, photo: 3, reviewStar: 5 });
    expect(yol).toBe('rezervasyon/?urun=tur/efes-sirince&tarih=2026-10-01&yetiskin=2');
  });

  it('ödeme adresi kapıdan ürüne ve seçime çözülüyor', () => {
    const yol = MolaVeri.odemeYolu('hotel', 'kordon-butik-otel', ornekler.hotel);
    const a = MolaVeri.odemeAdresiOku(yol.slice(yol.indexOf('?')));
    expect(a.tip).toBe('hotel');
    expect(a.slug).toBe('kordon-butik-otel');
    expect(a.secim.room).toBe('aile');
    expect(MolaVeri.odemeAdresiOku('?urun=tur/boyle-bir-tur-yok')).toBe(null);
    expect(MolaVeri.odemeAdresiOku('?urun=../../etc')).toBe(null);
    expect(MolaVeri.odemeAdresiOku('')).toBe(null);
  });

  it('yönlendirici ödeme, onay ve kampanyalar adreslerini tanıyor', () => {
    expect(MolaVeri.adres('rezervasyon/').kind).toBe('checkout');
    expect(MolaVeri.adres('rezervasyon/onay/').kind).toBe('confirmation');
    expect(MolaVeri.adres('kampanyalar').kind).toBe('campaigns');
    expect(MolaVeri.sayfaModeli(MolaVeri.adres('rezervasyon'), BUGUN).baslik).toBe('Ödeme');
  });
});

describe('kapora ve kalan ödeme', () => {
  it('turda %20 kapora, yukarı yuvarlı; kalan = toplam − kapora', () => {
    const t = teklif('tour', efes(), { date: '2026-10-01', adults: 2, children: 1 }, { odeme: 'kapora' });
    expect(t.satilabilir).toBe(true);
    expect(t.toplam).toBe(2 * 1290 + 890);
    expect(t.odeme.sekil).toBe('kapora');
    expect(t.odeme.simdi).toBe(Math.ceil(t.toplam * 0.2));
    expect(t.odeme.kalan).toBe(t.toplam - t.odeme.simdi);
    expect(t.tahsilat).toBe(t.odeme.simdi);
  });

  it('kalan tercihi: 1 gün önce ya da araçta; arama kalkıştan 1 gün önce', () => {
    const once = teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { odeme: 'kapora', kalan: 'bir-gun-once' });
    expect(once.odeme.kalanTercih).toBe('bir-gun-once');
    expect(once.odeme.kalanTarihi).toBe('2026-09-30');
    expect(once.odeme.aramaTarihi).toBe('2026-09-30');
    const arac = teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { odeme: 'kapora', kalan: 'aracta' });
    expect(arac.odeme.kalanTercih).toBe('aracta');
    expect(arac.odeme.kalanTarihi).toBe('2026-10-01');
    expect(arac.odeme.aramaTarihi).toBe('2026-09-30');
    const bilinmeyen = teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { odeme: 'kapora', kalan: 'uydurma' });
    expect(bilinmeyen.odeme.kalanTercih).toBe(R.REZ_KAPORA.kalanSecenekleri[0].id);
  });

  it('kalkışa 2 günden az kaldıysa kapora yok, tamamı ödenir', () => {
    const t = teklif('tour', efes(), { date: '2026-09-27', adults: 2 }, { odeme: 'kapora' });
    expect(t.odeme.kaporaUygun).toBe(false);
    expect(t.odeme.sekil).toBe('tam');
    expect(t.odeme.simdi).toBe(t.toplam);
    expect(t.odeme.kaporaNeden).toContain('2 günden az');
  });

  it('kapora yalnızca turlarda', () => {
    const o = teklif('hotel', otel(), { checkIn: '2026-10-10', nights: 1, adults: 2 }, { odeme: 'kapora' });
    expect(o.odeme.kaporaUygun).toBe(false);
    expect(o.odeme.sekil).toBe('tam');
    expect(o.odeme.kaporaNeden).toBe('');
  });

  it('konaklamalı turda tek kişi farkı fiyatta', () => {
    const cift = teklif('tour', kapadokya(), { date: '2026-10-01', adults: 2 });
    const tek = teklif('tour', kapadokya(), { date: '2026-10-01', adults: 2, singleRoom: true });
    expect(tek.toplam).toBeGreaterThan(cift.toplam);
    expect(tek.ozet.map(x => x.deger).join(' ')).toContain('Tek kişilik oda');
  });

  it('mekânda ödemeli randevuda kart çekimi yok', () => {
    const spa = MolaVeri.urun('venue', 'kordon-spa-masaj');
    const t = teklif('venue', spa, { date: '2026-10-02', slot: '10:00', guests: 2 }, { odeme: 'kapora', kupon: 'MOLA100' });
    expect(t.odeme.sekil).toBe('mekanda');
    expect(t.odeme.simdi).toBe(0);
    expect(t.odeme.kalan).toBe(t.toplam);
    expect(t.kupon.gecerli).toBe(false);
    expect(t.indirimler).toEqual([]);
  });
});

describe('tarih ve saat', () => {
  it('turda kalkış günü olmayan tarih satılmıyor', () => {
    /* Efes: salı, perşembe, cumartesi, pazar. 2026-10-02 cuma. */
    expect(teklif('tour', efes(), { date: '2026-10-02', adults: 2 }).hatalar).toContain('Bu tarihte kalkış yok.');
    expect(teklif('tour', efes(), { date: '2026-09-20', adults: 2 }).satilabilir).toBe(false);
    expect(teklif('tour', efes(), { adults: 2 }).satilabilir).toBe(false);
  });

  it('etkinlikte yalnızca yaklaşan temsil', () => {
    const e = MolaVeri.urun('event', 'aspendos-opera-bale-festivali');
    expect(teklif('event', e, { date: '2026-10-03', full: 2 }).satilabilir).toBe(true);
    expect(teklif('event', e, { date: '2026-10-04', full: 2 }).satilabilir).toBe(false);
  });

  it('mekân kapalı günde ve olmayan saatte satılmıyor', () => {
    const spa = MolaVeri.urun('venue', 'kordon-spa-masaj');
    expect(teklif('venue', spa, { date: '2026-10-04', slot: '10:00', guests: 1 }).hatalar).toContain('Mekân bu gün kapalı.');
    expect(teklif('venue', spa, { date: '2026-10-02', slot: '03:00', guests: 1 }).hatalar).toContain('Seçilen saat bu gün için yok.');
  });

  it('aynı gün geçmiş saat satılmıyor (şimdi verilince)', () => {
    const kum = MolaVeri.urun('venue', 'kum-beach-club');
    const oglen = new Date(2026, 8, 26, 12, 30);
    expect(teklif('venue', kum, { date: '2026-09-26', slot: '09:00', guests: 2 }, {}, oglen).satilabilir).toBe(false);
    expect(teklif('venue', kum, { date: '2026-09-26', slot: '18:00', guests: 2 }, {}, oglen).satilabilir).toBe(true);
  });

  it('örnek (özet) kaydın online satışı yok', () => {
    const t = teklif('tour', MolaVeri.urun('tour', 'ege-adalari-balayi'), {});
    expect(t.satilabilir).toBe(false);
    expect(t.hatalar[0]).toContain('online satışı');
  });
});

describe('çocuk yaşı', () => {
  it('turda yaş aralığı kaydın kendi tarifesinden', () => {
    const t = teklif('tour', efes(), { date: '2026-10-01', adults: 1, children: 1, infants: 1 });
    const cocuk = t.katilimcilar.find(k => k.rol === 'cocuk');
    const bebek = t.katilimcilar.find(k => k.rol === 'bebek');
    expect(cocuk.yas).toEqual(R.rezYasAraligi(efes().pricing.childAges));
    expect(bebek.yas).toEqual(R.rezYasAraligi(efes().pricing.infantAges));
    expect(t.katilimcilar.filter(k => k.kimlik).length).toBe(1);
  });

  it('otelde 0 – 6 yaş pansiyon farkı ödemiyor; yaş yoksa hepsi ücretli', () => {
    const secim = { checkIn: '2026-10-06', nights: 2, room: 'aile', rooms: 1, board: 'hb', adults: 2, children: 2 };
    const yassiz = teklif('hotel', otel(), secim);
    const kucuk = teklif('hotel', otel(), secim, { cocukYaslari: [4, 9] });
    const buyuk = teklif('hotel', otel(), secim, { cocukYaslari: [7, 9] });
    const hb = otel().boards.find(b => b.id === 'hb');
    expect(yassiz.toplam - kucuk.toplam).toBe(Math.round(hb.childNight * 2 * 1.02));
    expect(buyuk.toplam).toBe(yassiz.toplam);
    expect(H.hotelPayingChildren(otel(), 2, [0, 6])).toBe(0);
    expect(H.hotelPayingChildren(otel(), 2, [6])).toBe(2);
  });
});

describe('kampanya ve kupon', () => {
  it('Kapadokya erken rezervasyon: kalkışa 30 gün ve üstünde 500 TL', () => {
    const erken = teklif('tour', kapadokya(), { date: '2026-11-05', adults: 2 });
    const gec = teklif('tour', kapadokya(), { date: '2026-10-22', adults: 2 });
    expect(erken.indirimler.map(x => x.kod)).toEqual(['kapadokya-erken']);
    expect(erken.toplam).toBe(erken.araToplamTL - 500);
    expect(gec.indirimler).toEqual([]);
    expect(teklif('tour', efes(), { date: '2026-11-05', adults: 2 }).indirimler).toEqual([]);
  });

  it('erken rezervasyon listesi kampanya kapsamındaki ürünler', () => {
    const liste = MolaVeri.listele({ earlyBooking: true }, BUGUN);
    expect(liste.length).toBeGreaterThan(0);
    liste.forEach(k => expect(k.taxonomy.categories, k.slug).toContain('kapadokya-turlari'));
  });

  it('otel hafta sonu: cuma ve cumartesi gecesi birlikteyse bir gecenin oda bedeli (vergisiyle)', () => {
    const hs = teklif('hotel', otel(), { checkIn: '2026-10-02', nights: 2, room: 'aile', rooms: 1, board: 'bb', adults: 2 });
    const aile = otel().rooms.find(r => r.id === 'aile');
    expect(hs.indirimler[0].kod).toBe('otel-hafta-sonu');
    expect(hs.indirimler[0].tutar).toBe(Math.round(aile.nightly * 1.02));
    const cuma = teklif('hotel', otel(), { checkIn: '2026-10-02', nights: 1, room: 'aile', rooms: 1, board: 'bb', adults: 2 });
    const pazar = teklif('hotel', otel(), { checkIn: '2026-10-04', nights: 2, room: 'aile', rooms: 1, board: 'bb', adults: 2 });
    expect(cuma.indirimler).toEqual([]);
    expect(pazar.indirimler).toEqual([]);
    expect(R.rezCumaCumartesi('2026-10-01', 3)).toBe(true);
  });

  it('kupon: kod büyük/küçük harf fark etmiyor, alt sınır ve bilinmeyen kod', () => {
    const t = teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { kupon: ' mola100 ' });
    expect(t.kupon.gecerli).toBe(true);
    expect(t.toplam).toBe(2580 - 100);
    const kupon = R.rezKuponBul('mola100');
    const az = R.rezKampanyaIndirimi(kupon, { tip: 'tour', kayit: efes(), hesap: {}, baslangic: { tarih: '2026-10-01' }, toplamTL: 999, bugun: BUGUN });
    expect(az.tutar).toBe(0);
    expect(az.neden).toContain('1.000 TL');
    expect(teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { kupon: 'YOK' }).kupon.mesaj).toBe('Kupon kodu bulunamadı.');
  });

  it('kupon otomatik indirimin üstüne; kapora indirimli toplamdan', () => {
    const t = teklif('tour', kapadokya(), { date: '2026-11-05', adults: 2 }, { kupon: 'MOLA100', odeme: 'kapora' });
    expect(t.indirimler.map(x => x.kod)).toEqual(['kapadokya-erken', 'mola100']);
    expect(t.toplam).toBe(t.araToplamTL - 600);
    expect(t.odeme.simdi).toBe(Math.ceil(t.toplam * 0.2));
  });

  it('üyeye özel indirim üyelik olmadan uygulanmıyor, süresi biten kampanya uygulanmıyor', () => {
    const uye = R.REZ_KAMPANYALAR.find(k => k.kod === 'yeni-uye');
    const bilgi = { tip: 'tour', kayit: efes(), hesap: {}, baslangic: { tarih: '2026-10-01' }, toplamTL: 2000, bugun: BUGUN };
    expect(R.rezKampanyaIndirimi(uye, bilgi).tutar).toBe(0);
    expect(R.rezKampanyaIndirimi(uye, Object.assign({}, bilgi, { uye: { ilk: true } })).tutar).toBe(300);
    const kupon = R.rezKuponBul('MOLA100');
    expect(R.rezKampanyaIndirimi(kupon, Object.assign({}, bilgi, { bugun: '2027-01-01' })).tutar).toBe(0);
    expect(MolaVeri.kampanyalar('2027-01-01').map(k => k.kod)).not.toContain('mola100');
  });

  it('bitişe bir haftadan az kalan kampanyada kalan gün', () => {
    const k = { bitis: '2026-09-30' };
    expect(R.rezKalanGun(k, '2026-09-26')).toBe(5);
    expect(R.rezKalanGun(k, '2026-09-01')).toBe(null);
    expect(R.rezKalanGun({}, BUGUN)).toBe(null);
  });

  it('ana sayfa bantları kurallarıyla aynı şeyi söylüyor', () => {
    PROMO_BANDS.forEach(b => {
      const metin = b.title + ' ' + b.text;
      if (!b.kampanya) {
        /* Kuralı olmayan bant indirim vaat etmiyor. */
        expect(metin, b.title).not.toMatch(/%\s?\d|\d[\d.]*\s?TL/);
        return;
      }
      const k = R.REZ_KAMPANYALAR.find(x => x.kod === b.kampanya);
      expect(k, b.kampanya).toBeTruthy();
      const tutar = metin.match(/(\d[\d.]*)\s?TL/);
      if (tutar) expect(k.indirim.tutar, b.title).toBe(Number(tutar[1].replace(/\./g, '')));
      const oran = metin.match(/%(\d+)/);
      if (oran) expect(Math.round(k.indirim.oran * 100), b.title).toBe(Number(oran[1]));
      const gun = metin.match(/(\d+) gün/);
      if (gun) expect(k.kosul.enAzGunOnce, b.title).toBe(Number(gun[1]));
      if (b.path) expect(MolaVeri.adres(b.path), b.path).toBeTruthy();
    });
  });

  it('kampanyalar sayfası kuralın koşullarını yazıyor', () => {
    const html = L.lspKampanyalarMarkup(MolaVeri.kampanyalar(BUGUN), BUGUN);
    expect(html).toContain('Kalkışa en az 30 gün kala');
    expect(html).toContain('Kupon kodu: MOLA100');
    expect(html).toContain('Son gün: 31 Aralık 2026');
    R.REZ_KAMPANYALAR.filter(k => k.sayfa).forEach(k => expect(MolaVeri.adres(k.sayfa), k.sayfa).toBeTruthy());
  });
});

describe('TL tahsilat ve kur', () => {
  const dovizli = () => Object.assign({}, efes(), { currency: 'EUR', slug: 'dovizli-tur' });

  it('döviz fiyatlı üründe tutar günün kuruyla TL, kapora da TL', () => {
    const t = teklif('tour', dovizli(), { date: '2026-10-01', adults: 2 }, { odeme: 'kapora' }, BUGUN,
      { kur: { oran: 50, tarih: '2026-09-21', kaynak: 'örnek' } });
    expect(t.satilabilir).toBe(true);
    expect(t.paraBirimi).toBe('EUR');
    expect(t.araToplam).toBe(2580);
    expect(t.araToplamTL).toBe(2580 * 50);
    expect(t.odeme.simdi).toBe(Math.ceil(t.toplam * 0.2));
    expect(t.kur.oran).toBe(50);
  });

  it('kur yoksa döviz fiyatlı ürün satılmıyor', () => {
    const t = teklif('tour', dovizli(), { date: '2026-10-01', adults: 2 });
    expect(t.satilabilir).toBe(false);
    expect(t.hatalar.join(' ')).toContain('kur');
  });
});

describe('taksit', () => {
  it('her satırda aylık × (n − 1) + ilk taksit = toplam; 2 ve 3 taksit vade farksız', () => {
    R.REZ_TAKSIT.aileler.forEach(a => {
      R.rezTaksitSecenekleri(2583, a.id).forEach(s => {
        expect(Math.round((s.aylik * (s.taksit - 1) + s.ilk) * 100), a.id + ' ' + s.taksit).toBe(Math.round(s.toplam * 100));
        if (s.taksit <= 3) expect(s.toplam).toBe(2583);
        else expect(s.toplam).toBeGreaterThan(2583);
      });
    });
  });

  it('ailesi bilinmeyen kart ve alt sınırın altı tek çekim', () => {
    expect(R.rezTaksitSecenekleri(5000, '').map(s => s.taksit)).toEqual([1]);
    expect(R.rezTaksitSecenekleri(5000, 'boyle-aile-yok').map(s => s.taksit)).toEqual([1]);
    expect(R.rezTaksitSecenekleri(R.REZ_TAKSIT.altSinir - 1, 'bonus').map(s => s.taksit)).toEqual([1]);
  });

  it('teklif ailede olmayan taksidi tek çekime çekiyor; vade farkı tahsilata ekleniyor', () => {
    const yok = teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { aile: 'axess', taksit: 12 });
    expect(yok.taksit.secilen.taksit).toBe(1);
    const alti = teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { aile: 'bonus', taksit: 6 });
    expect(alti.taksit.secilen.taksit).toBe(6);
    expect(alti.tahsilat).toBe(alti.taksit.secilen.toplam);
    expect(alti.taksit.vadeFarki).toBeCloseTo(alti.tahsilat - alti.toplam, 2);
  });

  it('bütün ailelerin tablosu', () => {
    const t = R.rezTaksitTablosu(3000);
    expect(t.uygun).toBe(true);
    expect(t.sayilar[0]).toBe(1);
    expect(t.aileler.length).toBe(R.REZ_TAKSIT.aileler.length);
    t.aileler.forEach(a => expect(a.hucreler.length).toBe(t.sayilar.length));
    expect(R.REZ_TAKSIT.ornek).toBe(true);
  });
});

describe('iptal takvimi', () => {
  it('kademe sınırları başlangıçtan geriye; iade ödenenden, kesinti toplamdan', () => {
    const t = teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { odeme: 'kapora' });
    const [ilk, ikinci, son] = t.iptal;
    expect(ilk.sonAn).toBe('2026-09-29T08:15');
    expect(ilk.iade).toBe(t.odeme.simdi);
    expect(ikinci.sonAn).toBe('2026-09-30T08:15');
    /* %50 kademe: kesinti toplamın yarısı, kaporayı aşıyor. */
    expect(ikinci.iade).toBe(Math.max(0, t.odeme.simdi - Math.round(t.toplam * 0.5)));
    expect(son.sonAn).toBe(null);
    expect(son.iade).toBe(0);
  });

  it('tamamı ödenen rezervasyonda kademe oranı kadar iade', () => {
    const t = teklif('tour', efes(), { date: '2026-10-01', adults: 2 });
    expect(t.iptal.map(k => k.iade)).toEqual([t.toplam, Math.round(t.toplam * 0.5), 0]);
  });

  it('süresi geçmiş kademe listelenmiyor', () => {
    /* Kalkış 27 Eylül 08:15; şimdi 26 Eylül 07:00: 48 saat sınırı
       geçti, 24 saat sınırı (26 Eylül 08:15) geçmedi. */
    const t = teklif('tour', efes(), { date: '2026-09-27', adults: 2 }, {}, new Date(2026, 8, 26, 7, 0));
    expect(t.iptal.length).toBe(2);
    expect(t.iptal[0].oran).toBe(0.5);
    expect(teklif('tour', efes(), { date: '2026-09-27', adults: 2 }, {}, new Date(2026, 8, 26, 10, 0)).iptal.length).toBe(1);
  });
});

describe('form doğrulama', () => {
  it('T.C. kimlik numarası sağlama', () => {
    expect(R.rezTCKimlikGecerli('10000000146')).toBe(true);
    expect(R.rezTCKimlikGecerli('10000000147')).toBe(false);
    expect(R.rezTCKimlikGecerli('00000000146')).toBe(false);
    expect(R.rezTCKimlikGecerli('1234')).toBe(false);
  });

  it('telefon ve e-posta', () => {
    ['5321234567', '05321234567', '+90 532 123 45 67', '0532 123 45 67', '+49 151 23456789'].forEach(n =>
      expect(R.rezTelefonGecerli(n), n).toBe(true));
    ['0212 123 45 67', '12345', '+90 212 123 45 67', ''].forEach(n => expect(R.rezTelefonGecerli(n), n).toBe(false));
    expect(R.rezEpostaGecerli('a@b.co')).toBe(true);
    expect(R.rezEpostaGecerli('a@b')).toBe(false);
  });

  it('katılımcı: ad, kimlik ya da pasaport, yaş aralığı; sözleşme onayı', () => {
    const t = teklif('tour', efes(), { date: '2026-10-01', adults: 2, children: 1 });
    const form = {
      iletisim: { ad: 'Ayşe', soyad: 'Yılmaz', eposta: 'a@b.co', telefon: '5321234567' },
      katilimcilar: [
        { ad: 'Ayşe', soyad: 'Yılmaz', tc: '10000000146' },
        { ad: 'Can', soyad: 'Öz', yabanci: true, pasaport: 'U1234567' },
        { ad: 'Ela', soyad: 'Öz', yas: '12' }
      ],
      sozlesme: true
    };
    expect(R.rezFormHatalari(t, form).map(h => h.alan)).toEqual(['katilimci.2.yas']);
    form.katilimcilar[2].yas = '7';
    expect(R.rezFormHatalari(t, form)).toEqual([]);
    const eksik = R.rezFormHatalari(t, Object.assign({}, form, { sozlesme: false, katilimcilar: [{}, {}, {}] })).map(h => h.alan);
    expect(eksik).toEqual(expect.arrayContaining(['sozlesme', 'katilimci.0.ad', 'katilimci.0.tc', 'katilimci.1.soyad', 'katilimci.2.yas']));
  });

  it('kurumsal faturada unvan, vergi dairesi ve numara', () => {
    const t = teklif('event', MolaVeri.urun('event', 'aspendos-opera-bale-festivali'), { date: '2026-10-03', full: 1 });
    const form = { iletisim: { ad: 'Ali', soyad: 'Kaya', eposta: 'a@b.co', telefon: '5321234567' },
      katilimcilar: [{ ad: 'Ali', soyad: 'Kaya' }], sozlesme: true, fatura: { tur: 'kurumsal', vergiNo: '12' } };
    expect(R.rezFormHatalari(t, form).map(h => h.alan)).toEqual(['fatura.unvan', 'fatura.vergiDairesi', 'fatura.vergiNo']);
  });

  it('rezervasyon kodu okunaklı harflerden', () => {
    for (let i = 0; i < 50; i++) expect(R.rezKodUret()).toMatch(/^M360-[A-HJ-NP-Z2-9]{6}$/);
    expect(R.rezKodUret(() => 0)).toBe('M360-AAAAAA');
  });
});

describe('veri kapısı: teklif ve rezervasyon', () => {
  const form = {
    iletisim: { ad: 'Ayşe', soyad: 'Yılmaz', eposta: 'a@b.co', telefon: '5321234567' },
    katilimcilar: [{ ad: 'Ayşe', soyad: 'Yılmaz', tc: '10000000146' }, { ad: 'Can', soyad: 'Yılmaz', tc: '10000000146' }],
    sozlesme: true
  };

  it('dolu kalkış satılmıyor (örnek kontenjan)', async () => {
    /* Efes'in ikinci kalkışı (29 Eylül) örnek rezervasyonlarla dolu. */
    const t = await MolaVeri.fiyatTeklifi('tour', 'efes-sirince', { date: '2026-09-29', adults: 2 }, {}, BUGUN);
    expect(t.kontenjanDurumu.durum).toBe('doldu');
    expect(t.satilabilir).toBe(false);
  });

  it('kontenjanı yetmeyen seçim satılmıyor', async () => {
    /* İlk kalkışta 16 yerin 12'si satılmış. */
    const t = await MolaVeri.fiyatTeklifi('tour', 'efes-sirince', { date: '2026-09-27', adults: 5 }, {}, BUGUN);
    expect(t.kontenjanDurumu.durum).toBe('yetersiz');
    expect(t.hatalar.join(' ')).toContain('yalnızca 4');
  });

  it('eksik form ve değişen tutar rezervasyon yazdırmıyor', async () => {
    const eksik = await MolaVeri.rezervasyonOlustur({ tip: 'tour', slug: 'efes-sirince', secim: { date: '2026-10-01', adults: 2 },
      form: { sozlesme: false }, bugun: BUGUN });
    expect(eksik.tamam).toBe(false);
    expect(eksik.hatalar.some(h => h.alan === 'sozlesme')).toBe(true);
    const degisti = await MolaVeri.rezervasyonOlustur({ tip: 'tour', slug: 'efes-sirince', secim: { date: '2026-10-01', adults: 2 },
      form, beklenenTahsilat: 1, bugun: BUGUN });
    expect(degisti.tamam).toBe(false);
    expect(degisti.hatalar[0].mesaj).toContain('Tutar güncellendi');
  });

  it('rezervasyon yazılıyor ve koduyla okunuyor; kimlik numarası saklanmıyor', async () => {
    const t = await MolaVeri.fiyatTeklifi('tour', 'efes-sirince', { date: '2026-10-01', adults: 2 }, { odeme: 'kapora', kalan: 'aracta' }, BUGUN);
    const r = await MolaVeri.rezervasyonOlustur({ tip: 'tour', slug: 'efes-sirince', secim: { date: '2026-10-01', adults: 2 },
      secenek: { odeme: 'kapora', kalan: 'aracta' }, form, beklenenTahsilat: t.tahsilat, bugun: BUGUN });
    expect(r.tamam).toBe(true);
    const kayit = await MolaVeri.rezervasyon(r.kod.toLowerCase());
    expect(kayit.kod).toBe(r.kod);
    expect(kayit.deneme).toBe(true);
    expect(kayit.odeme.sekil).toBe('kapora');
    expect(kayit.odeme.kalanTercih).toBe('aracta');
    expect(JSON.stringify(kayit)).not.toContain('10000000146');
    expect((await MolaVeri.rezervasyonlar()).map(x => x.kod)).toContain(r.kod);
    expect(await MolaVeri.rezervasyon('M360-YOKYOK')).toBe(null);
  });
});

describe('ödeme ekranı işaretlemesi', () => {
  it('katılımcı alanları şablondan: kimlik yalnızca yetişkinde, yaş seçimi aralıkta', () => {
    const t = teklif('tour', efes(), { date: '2026-10-01', adults: 2, children: 1 });
    const html = O.odmKatilimciMarkup(t.katilimcilar, 'tour');
    expect((html.match(/name="katilimci\.\d\.tc"/g) || []).length).toBe(2);
    expect(html).toContain('name="katilimci.2.yas"');
    expect(html).toContain('<option value="3">3 yaş</option>');
    expect(html).toContain('<option value="11">11 yaş</option>');
    expect(html).not.toContain('<option value="12">');
    expect(html).toContain('1. Yetişkin');
  });

  it('kapora seçeneği yalnızca uygunsa; mekânda ödemede plan metni', () => {
    const uygun = teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { odeme: 'kapora' });
    const html = O.odmPlanMarkup(uygun, {}, R.REZ_KAPORA);
    expect(html).toContain('value="kapora"');
    expect(html).toContain('name="kalan"');
    expect(html).toContain('Arama günü: 30 Eylül Çarşamba');
    const yarin = teklif('tour', efes(), { date: '2026-09-27', adults: 2 });
    expect(O.odmPlanMarkup(yarin, {}, R.REZ_KAPORA)).not.toContain('value="kapora"');
    const spa = teklif('venue', MolaVeri.urun('venue', 'kordon-spa-masaj'), { date: '2026-10-02', slot: '10:00', guests: 1 });
    expect(O.odmPlanMarkup(spa, {}, R.REZ_KAPORA)).toContain('mekânda');
  });

  it('özet kaçışlı; vade farkı ve karttan çekilecek tutar yazılı', () => {
    const t = teklif('tour', efes(), { date: '2026-10-01', adults: 2 }, { aile: 'bonus', taksit: 6 });
    t.baslik = '<b>x</b>';
    const html = O.odmOzetMarkup(t, null, x => x);
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).toContain('Vade farkı (6 taksit)');
    expect(html).toContain('Karttan çekilecek');
    expect(O.odmOzetMarkup(t, null, x => x, false)).toMatch(/<details class="odm-more">/);
  });

  it('onay ekranı deneme olduğunu söylüyor, kimlik yazmıyor', () => {
    const html = O.odmOnayMarkup({ kod: 'M360-ABCDEF', tip: 'tour', slug: 'efes-sirince', baslik: 'Efes',
      odeme: { sekil: 'kapora', kaporaOrani: 0.2, simdi: 516, kalan: 2064, kalanTercih: 'aracta', kalanTarihi: '2026-10-01', aramaTarihi: '2026-09-30' },
      tahsilat: 516, toplam: 2580, indirimler: [], iptal: [], iletisim: { eposta: 'a@b.co', telefon: '5321234567' },
      katilimcilar: [{ rol: 'yetiskin', ad: 'Ayşe', soyad: 'Yılmaz', yas: null }] });
    expect(html).toContain('M360-ABCDEF');
    expect(html).toContain('Deneme sürümü');
    expect(html).toContain('Kartınızdan çekim yapılmadı');
    expect(html).toContain('Tur günü araçta');
  });
});

describe('sayfalar', () => {
  it('ürün sayfalarının özeti ödeme ekranına gidiyor', () => {
    ['tour', 'hotel', 'activity', 'event', 'venue'].forEach(t => {
      const kod = oku('assets/js/' + t + '-page.js');
      expect(kod, t).toContain('MolaVeri.odemeYolu(');
      expect(kod, t).toContain('Ödemeye geç');
      expect(kod, t).not.toContain('Ödeme adımı henüz bağlı değil');
    });
  });

  it('içerik kabukları rezervasyon motorunu kapıdan önce yüklüyor', () => {
    ['tur/efes-sirince', 'tur/kapadokya-3-gece', 'otel/kordon-butik-otel', 'aktivite/kapadokya-balon-turu',
      'etkinlik/aspendos-opera-bale-festivali', 'mekan/kum-beach-club', 'mekan/kordon-spa-masaj'].forEach(yol => {
      const html = oku(yol + '/index.html');
      const motor = html.indexOf('assets/js/booking-engine.js');
      expect(motor, yol).toBeGreaterThan(0);
      expect(motor, yol).toBeLessThan(html.indexOf('assets/js/data-gateway.js'));
    });
    const y = oku('404.html');
    expect(y.indexOf('src="assets/js/booking-engine.js"')).toBeLessThan(y.indexOf('src="assets/js/data-gateway.js"'));
    expect(y.indexOf('src="assets/js/checkout-page.js"')).toBeLessThan(y.indexOf('src="assets/js/listing-page.js"'));
    expect(y).toContain('href="assets/css/checkout.css"');
  });

  it('yönlendiricinin betikleri tek kapsamda: teklif tarayıcıdaki gibi hesaplanıyor', async () => {
    /* Tarayıcıda motor, hesap fonksiyonlarını ve tabloları üst kapsamdan
       buluyor (Node'da modülden). Klasik betikler gibi tek kapsamda
       çalıştırıp aynı teklifin çıktığını ölçüyoruz. */
    const betikler = [...oku('404.html').matchAll(/<script src="([^"]+)"/g)].map(m => m[1])
      .filter(y => y.startsWith('assets/js/') && !/site-chrome|ui\.js|app\.js|detail-shell|visitor-history/.test(y));
    /* checkout-page.js ve listing-page.js de dahil: yüklenirken DOM'a
       dokunmuyorlar; ad çakışması (ODM_/LSP_) burada yakalanır. */
    expect(betikler).toContain('assets/js/checkout-page.js');
    const ctx = vm.createContext({ Math, Date, JSON, Object, Array, Number, String, isNaN, console, Promise, Set, Map, encodeURIComponent, decodeURIComponent });
    vm.runInContext(betikler.map(d => oku(d)).join('\n'), ctx);
    const t = await vm.runInContext(
      "MolaVeri.fiyatTeklifi('tour', 'kapadokya-3-gece', { date: '2026-11-05', adults: 2 }, { odeme: 'kapora', aile: 'world', taksit: 3, kupon: 'MOLA100' }, '2026-09-26')", ctx);
    const node = await MolaVeri.fiyatTeklifi('tour', 'kapadokya-3-gece', { date: '2026-11-05', adults: 2 },
      { odeme: 'kapora', aile: 'world', taksit: 3, kupon: 'MOLA100' }, '2026-09-26');
    expect(t.satilabilir).toBe(true);
    expect(JSON.parse(JSON.stringify(t))).toEqual(JSON.parse(JSON.stringify(node)));
    expect(vm.runInContext('MolaVeri.kartAileleri().length', ctx)).toBe(R.REZ_TAKSIT.aileler.length);
    expect(vm.runInContext("MolaVeri.listele({ earlyBooking: true }, '2026-09-26').length", ctx)).toBeGreaterThan(0);
  });
});
