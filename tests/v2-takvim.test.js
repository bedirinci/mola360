/* v2 takvimi: arama pencereleri, kalkışlar, örnek rezervasyonlar ve iptal
   günü bugünden hesaplanır (örnek veri eskimez). Saat sabitlenir: sonuç
   testin çalıştığı güne bağlı değil. Her gün için veri katmanı yeniden yüklenir. */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

const kayit = {};
globalThis.localStorage = { getItem: k => kayit[k] ?? null, setItem: (k, v) => { kayit[k] = String(v); }, removeItem: k => { delete kayit[k]; } };
globalThis.sessionStorage = globalThis.localStorage;

/* o gün için veri katmanı */
async function gun(y, m, d) {
  /* saat zaten sahteyken useFakeTimers yeni günü almaz; gün setSystemTime ile */
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(y, m, d, 12));
  vi.resetModules();
  return import('../v2/js/api.js');
}
const g = d => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
const pencere = (api, id) => { const w = api.WHEN.find(x => x[0] === id); return w && [w[1], w[2], g(w[3]), g(w[4])]; };

beforeEach(() => { for (const k of Object.keys(kayit)) delete kayit[k]; });
afterAll(() => vi.useRealTimers());

describe('arama pencereleri bugünden', () => {
  it('çarşamba: bu ve gelecek hafta sonu, bu ayın kalanı ve gelecek ay', async () => {
    const api = await gun(2026, 9, 7);
    expect(pencere(api, 'bu-hs')).toEqual(['Bu hafta sonu', '9 – 11 Ekim', '2026-10-9', '2026-10-11']);
    expect(pencere(api, 'gelecek-hs')).toEqual(['Gelecek hafta sonu', '16 – 18 Ekim', '2026-10-16', '2026-10-18']);
    expect(pencere(api, 'ekim')).toEqual(['Ekim içinde', '7 – 31 Ekim', '2026-10-7', '2026-10-31']);
    expect(pencere(api, 'kasim')).toEqual(['Kasım içinde', '1 – 30 Kasım', '2026-11-1', '2026-11-30']);
  });

  it('cumartesi: bu hafta sonu bugünden pazara, geçmiş cuma pencerede değil', async () => {
    const api = await gun(2026, 9, 10);
    expect(pencere(api, 'bu-hs')).toEqual(['Bu hafta sonu', '10 – 11 Ekim', '2026-10-10', '2026-10-11']);
    expect(pencere(api, 'gelecek-hs')[1]).toBe('16 – 18 Ekim');
  });

  it('ay dönümü ve yıl dönümü', async () => {
    const api = await gun(2026, 11, 28);
    expect(pencere(api, 'bu-hs')).toEqual(['Bu hafta sonu', '1 – 3 Ocak', '2027-1-1', '2027-1-3']);
    expect(pencere(api, 'aralik')[1]).toBe('28 – 31 Aralık');
    expect(pencere(api, 'ocak')[1]).toBe('1 – 31 Ocak');
    /* etikette yıl yok: bugüne en yakın yıl */
    expect(g(api.parseDay('Sal 5 Oca'))).toBe('2027-1-5');
    expect(g(api.parseDay('20 Ara'))).toBe('2026-12-20');
  });
});

describe('örnek takvim eskimez', () => {
  it('1 Ekim 2026 haftası için yazılan kalkışlar o hafta yazıldığı gibi', async () => {
    const api = await gun(2026, 9, 1);
    expect(api.getProduct('kapadokya-turu').dates.slice(0, 3)).toEqual([['Pzt', '5 Eki'], ['Cum', '9 Eki'], ['Pzt', '12 Eki']]);
    expect(api.getProduct('efes-ve-sirince-turu').dates.slice(0, 3)).toEqual([['Per', '1 Eki'], ['Cmt', '3 Eki'], ['Paz', '4 Eki']]);
  });

  it('sonraki haftalarda kalkışlar haftanın aynı günlerinde bugüne taşınır', async () => {
    const api = await gun(2026, 9, 7);
    expect(api.getProduct('kapadokya-turu').dates.slice(0, 3)).toEqual([['Pzt', '12 Eki'], ['Cum', '16 Eki'], ['Pzt', '19 Eki']]);
    expect(api.listProducts({ yer: 'kapadokya', type: 'tur', tarih: 'bu-hs' })).toEqual([]);
    expect(api.firstDateIn(api.getProduct('kapadokya-turu'), 'gelecek-hs')).toBe('Cum 16 Eki');
  });

  for (const [y, m, d] of [[2026, 9, 7], [2026, 10, 18], [2027, 0, 20], [2027, 5, 3]]) {
    it(`${d}.${m + 1}.${y}: her turun ileride kalkışı, bu hafta sonu etkinlik ve hafta sonu dolu`, async () => {
      const api = await gun(y, m, d), t = api.today();
      api.listProducts({ type: 'tur' }).forEach(p => {
        const up = api.upcoming(p.dates);
        expect(up.length, p.title).toBeGreaterThan(2);
        up.forEach(x => expect(api.parseDay(x[1]) >= t, p.title + ' ' + x).toBe(true));
      });
      expect(api.listProducts({ type: 'etkinlik', tarih: 'bu-hs' }).length).toBeGreaterThan(0);
      expect(api.listEvents().length).toBeGreaterThan(0);
      api.WHEN.forEach(w => expect(w[4] >= t, w[0]).toBe(true));
      /* hesaptaki örnek rezervasyon en az 3 gün sonra, bildirimi Bugün'de */
      const [b] = api.listUpcoming();
      expect(b.productId).toBe('pamukkale-ve-hierapolis');
      expect(Math.round((b.day - t) / 864e5)).toBeGreaterThanOrEqual(3);
      expect(api.listNotifs().some(n => n.tur === 'yaklasan' && n.no === b.no)).toBe(true);
    });
  }
});

describe('iptal günü ve rezervasyonlar', () => {
  it('son ücretsiz iptal günü seçilen tarihe göre', async () => {
    const api = await gun(2026, 9, 7), k = api.getProduct('kapadokya-turu');
    expect(api.cancelBy(k, 'Pzt 19 Eki')).toEqual({ date: '12 Ekim Pazartesi', past: false });
    expect(api.cancelBy(k, 'Pzt 12 Eki').past).toBe(true);
  });

  it('tarihi geçen rezervasyon Yaklaşan\'dan Geçmiş\'e geçer, yılı kayıtta durur', async () => {
    let api = await gun(2026, 9, 7);
    const tur = api.createBooking({ productId: 'efes-ve-sirince-turu', date: 'Cmt 10 Eki', slot: '08:00', qty: '2 yetişkin', total: 2580, paid: 2580, pay: 'tam' });
    const otel = api.createBooking({ productId: 'goreme-magara-otel', date: 'Cum 9 Eki · 2 gece', qty: '1 oda', total: 4900, paid: 4900, pay: 'tam' });
    expect(tur.at).toBe('2026-10-10');
    expect(api.listUpcoming().map(b => b.no)).toEqual(expect.arrayContaining([tur.no, otel.no]));
    expect(api.listPastBookings().map(b => b.productId)).not.toContain('efes-ve-sirince-turu');

    /* pazar, otelden çıkış günü: tur geçti, konaklama sürüyor */
    api = await gun(2026, 9, 11);
    expect(api.listUpcoming().map(b => b.no)).toContain(otel.no);
    expect(api.listUpcoming().map(b => b.no)).not.toContain(tur.no);
    const gecmis = api.listPastBookings();
    expect(gecmis[0]).toMatchObject({ productId: 'efes-ve-sirince-turu', when: '10 Ekim', who: '2 yetişkin' });
    /* Mola360'tan yaşandı: o deneyime bağlanan paylaşım rozet alır, değerlendirme hatırlatılır */
    const p = api.createPost({ productId: 'efes-ve-sirince-turu', media: 2 });
    expect(p.verified).toBe(true);
    expect(api.listNotifs().some(n => n.id === 'd-efes-ve-sirince-turu')).toBe(true);

    /* çıkıştan sonra otel de geçmişte; altı ay sonra bile yaklaşan sayılmaz */
    api = await gun(2027, 3, 20);
    expect(api.listUpcoming().map(b => b.no)).not.toContain(otel.no);
    expect(api.listPastBookings().find(b => b.productId === 'goreme-magara-otel').when).toBe('9 – 11 Ekim');
  });
});
