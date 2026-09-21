/* Şema güvenceleri.

   Bu testler UYGULAMA KODUNU değil, VERİTABANINI sınıyor. Sebep: burada
   sınanan kurallar (çift satış engeli, durum makinesi, türetilen sütunlar)
   son savunma hattı. Uygulama katmanı hatalı olsa, bir script elle SQL
   çalıştırsa veya ileride ikinci bir servis eklense bile bu kuralların
   tutması gerekiyor.

   Uygulama üzerinden test etseydik, yalnızca uygulamanın o an doğru
   davrandığını ölçmüş olurduk — kuralın kendisini değil. */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { semayiKur, temizle } from './yardim.js';
import { sorgu, transaction, kapat } from '../src/db/pool.js';

beforeAll(async () => { await semayiKur(); });
beforeEach(async () => { await temizle(); });
afterAll(async () => { await kapat(); });

async function icerikOlustur(tip = 'tour', slug = 'test-icerik') {
  const { rows } = await sorgu(
    `INSERT INTO content (type, slug, title) VALUES ($1,$2,'Test') RETURNING id`, [tip, slug]);
  return rows[0].id;
}

async function envanterOlustur(contentId, { capacity = 10, sold = 0 } = {}) {
  const { rows } = await sorgu(
    `INSERT INTO inventory (content_id, item_type, item_id, on_date, capacity, sold)
     VALUES ($1,'tour_departure',gen_random_uuid(),'2026-10-01',$2,$3) RETURNING id, available`,
    [contentId, capacity, sold]);
  return rows[0];
}

describe('envanter — çift satış engeli', () => {
  it('available TÜRETİLİYOR, elle yazılamıyor', async () => {
    const id = await icerikOlustur();
    const env = await envanterOlustur(id, { capacity: 10, sold: 3 });
    expect(env.available).toBe(7);
    /* GENERATED ALWAYS sütununa yazma denemesi reddediliyor: kapasite ile
       kalan sayı ayrışamaz. */
    await expect(sorgu('UPDATE inventory SET available = 99 WHERE id = $1', [env.id]))
      .rejects.toThrow();
  });

  it('kapasitenin üstünde satış VERİTABANINCA reddediliyor', async () => {
    const id = await icerikOlustur();
    const env = await envanterOlustur(id, { capacity: 10, sold: 8 });
    await expect(sorgu('UPDATE inventory SET sold = sold + 3 WHERE id = $1', [env.id]))
      .rejects.toThrow(/inventory_not_oversold/);
    /* Tam kalan kadar satış geçiyor. */
    await sorgu('UPDATE inventory SET sold = sold + 2 WHERE id = $1', [env.id]);
    const { rows } = await sorgu('SELECT available FROM inventory WHERE id = $1', [env.id]);
    expect(rows[0].available).toBe(0);
  });

  it('hold + reserved + sold birlikte kapasiteyi aşamıyor', async () => {
    const id = await icerikOlustur();
    const env = await envanterOlustur(id, { capacity: 5 });
    await sorgu('UPDATE inventory SET held = 3, reserved = 2 WHERE id = $1', [env.id]);
    await expect(sorgu('UPDATE inventory SET sold = 1 WHERE id = $1', [env.id]))
      .rejects.toThrow(/inventory_not_oversold/);
  });

  it('EŞZAMANLI iki rezervasyon son koltuğu ikiye bölemiyor', async () => {
    /* Asıl senaryo bu: iki istek aynı anda son koltuğu alıyor. Satır
       kilidi (FOR UPDATE) ikincisini bekletiyor, kısıt da fazlasını
       reddediyor. İkisi birlikte çalışmazsa çift satış olur. */
    const id = await icerikOlustur();
    const env = await envanterOlustur(id, { capacity: 10, sold: 9 });

    const satisDene = () => transaction(async (c) => {
      const { rows } = await c.query(
        'SELECT available FROM inventory WHERE id = $1 FOR UPDATE', [env.id]);
      if (rows[0].available < 1) throw new Error('YER_YOK');
      /* Gerçek dünyadaki iş yükünü taklit eden kısa gecikme: kilit
         olmasaydı iki işlem burada kesişirdi. */
      await new Promise(r => setTimeout(r, 40));
      await c.query('UPDATE inventory SET sold = sold + 1 WHERE id = $1', [env.id]);
      return 'SATILDI';
    });

    const sonuclar = await Promise.allSettled([satisDene(), satisDene()]);
    const basarili = sonuclar.filter(s => s.status === 'fulfilled').length;
    expect(basarili).toBe(1);   // ikisi birden ASLA olmamalı

    const { rows } = await sorgu('SELECT sold, available FROM inventory WHERE id = $1', [env.id]);
    expect(rows[0].sold).toBe(10);
    expect(rows[0].available).toBe(0);
  });

  it('aynı kaynağın aynı tarihte iki envanter satırı olamıyor — SAAT BOŞKEN DE', async () => {
    /* SQL'de NULL kendisine bile eşit değildir; saatsiz iki satır ilk
       sürümde çakışma SAYILMIYORDU ve kapasite ikiye katlanabiliyordu.
       Kısıt 018'de NULLS NOT DISTINCT ile onarıldı. */
    const id = await icerikOlustur();
    const itemId = '11111111-1111-1111-1111-111111111111';
    await sorgu(
      `INSERT INTO inventory (content_id,item_type,item_id,on_date,capacity)
       VALUES ($1,'hotel_room',$2,'2026-10-01',5)`, [id, itemId]);
    await expect(sorgu(
      `INSERT INTO inventory (content_id,item_type,item_id,on_date,capacity)
       VALUES ($1,'hotel_room',$2,'2026-10-01',5)`, [id, itemId]))
      .rejects.toThrow(/inventory_kaynak_tarih_key/);

    /* Saatli olanlar birbirinden AYRI kalmaya devam ediyor. */
    await sorgu(
      `INSERT INTO inventory (content_id,item_type,item_id,on_date,start_time,capacity)
       VALUES ($1,'hotel_room',$2,'2026-10-01','09:00',5)`, [id, itemId]);
    await sorgu(
      `INSERT INTO inventory (content_id,item_type,item_id,on_date,start_time,capacity)
       VALUES ($1,'hotel_room',$2,'2026-10-01','14:00',5)`, [id, itemId]);
  });

  it('saatsiz iki kalkış ve iki temsil de çakışma sayılıyor', async () => {
    const tur = await icerikOlustur('tour', 'kalkis-testi');
    await sorgu(`INSERT INTO tour_departures (content_id, depart_date, capacity)
                 VALUES ($1,'2026-11-01',20)`, [tur]);
    await expect(sorgu(`INSERT INTO tour_departures (content_id, depart_date, capacity)
                        VALUES ($1,'2026-11-01',20)`, [tur]))
      .rejects.toThrow(/tour_departures_tarih_key/);

    const etkinlik = await icerikOlustur('event', 'temsil-testi');
    await sorgu(`INSERT INTO event_performances (content_id, perf_date)
                 VALUES ($1,'2026-11-01')`, [etkinlik]);
    await expect(sorgu(`INSERT INTO event_performances (content_id, perf_date)
                        VALUES ($1,'2026-11-01')`, [etkinlik]))
      .rejects.toThrow(/event_performances_tarih_key/);
  });
});

describe('rezervasyon durum makinesi', () => {
  async function rezervasyonOlustur() {
    const icerik = await icerikOlustur('tour', 'rez-test');
    const { rows: m } = await sorgu(
      `INSERT INTO customers (email, first_name) VALUES ('m@m.test','M') RETURNING id`);
    const { rows } = await sorgu(
      `INSERT INTO bookings (code, customer_id, content_id, content_type, total)
       VALUES ('MLA-' || substr(md5(random()::text),1,8), $1, $2, 'tour', 1000) RETURNING id`,
      [m[0].id, icerik]);
    return rows[0].id;
  }

  it('geçerli geçiş kabul ediliyor', async () => {
    const id = await rezervasyonOlustur();
    for (const durum of ['pending', 'awaiting_payment', 'paid', 'confirmed', 'checked_in', 'completed']) {
      await sorgu('UPDATE bookings SET status = $2 WHERE id = $1', [id, durum]);
    }
    const { rows } = await sorgu('SELECT status FROM bookings WHERE id = $1', [id]);
    expect(rows[0].status).toBe('completed');
  });

  it('geçersiz geçiş VERİTABANINCA reddediliyor', async () => {
    const id = await rezervasyonOlustur();
    /* draft -> completed: ödeme ve onay atlanamaz. */
    await expect(sorgu(`UPDATE bookings SET status = 'completed' WHERE id = $1`, [id]))
      .rejects.toThrow(/Gecersiz rezervasyon durum gecisi/);
  });

  it('iptal edilmiş rezervasyon tamamlanmış sayılamıyor', async () => {
    const id = await rezervasyonOlustur();
    await sorgu(`UPDATE bookings SET status = 'pending' WHERE id = $1`, [id]);
    await sorgu(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [id]);
    await expect(sorgu(`UPDATE bookings SET status = 'completed' WHERE id = $1`, [id]))
      .rejects.toThrow(/Gecersiz rezervasyon durum gecisi/);
  });

  it('kalan tutar TÜRETİLİYOR ve fazla ödeme reddediliyor', async () => {
    const id = await rezervasyonOlustur();
    await sorgu('UPDATE bookings SET paid = 400 WHERE id = $1', [id]);
    const { rows } = await sorgu('SELECT total, paid, balance FROM bookings WHERE id = $1', [id]);
    expect(rows[0].balance).toBe(600);
    await expect(sorgu('UPDATE bookings SET paid = 1500 WHERE id = $1', [id]))
      .rejects.toThrow(/bookings_paid_not_over/);
  });
});

describe('içerik bütünlüğü', () => {
  it('ürün kodu büyük/küçük harften bağımsız tekil', async () => {
    await sorgu(`INSERT INTO content (type,slug,title,product_code)
                 VALUES ('tour','a','A','MLA-01')`);
    await expect(sorgu(`INSERT INTO content (type,slug,title,product_code)
                        VALUES ('hotel','b','B','mla-01')`)).rejects.toThrow(/product_code/);
  });

  it('slug biçimi zorlanıyor', async () => {
    for (const kotu of ['Buyuk-Harf', 'türkçe-karakter', 'bosluk var', '-bastan-tire', '']) {
      await expect(
        sorgu(`INSERT INTO content (type,slug,title) VALUES ('tour',$1,'X')`, [kotu]),
        kotu).rejects.toThrow();
    }
    await sorgu(`INSERT INTO content (type,slug,title) VALUES ('tour','dogru-slug','X')`);
  });

  it('silinen kaydın slugu yeniden kullanılabiliyor', async () => {
    const id = await icerikOlustur('tour', 'ayni-slug');
    await expect(icerikOlustur('tour', 'ayni-slug')).rejects.toThrow();
    await sorgu('UPDATE content SET deleted_at = now() WHERE id = $1', [id]);
    await expect(icerikOlustur('tour', 'ayni-slug')).resolves.toBeTruthy();
  });

  it('SCHEDULED durumu yayın anı olmadan kabul edilmiyor', async () => {
    await expect(sorgu(
      `INSERT INTO content (type,slug,title,status) VALUES ('tour','plan','P','scheduled')`))
      .rejects.toThrow(/content_scheduled_needs_time/);
    await sorgu(
      `INSERT INTO content (type,slug,title,status,scheduled_at)
       VALUES ('tour','plan','P','scheduled', now() + interval '1 day')`);
  });

  it('bir kayıt kendisiyle ilişkilendirilemiyor', async () => {
    const id = await icerikOlustur();
    await expect(sorgu(
      `INSERT INTO content_relations (from_content_id,to_content_id) VALUES ($1,$1)`, [id]))
      .rejects.toThrow(/content_relations_not_self/);
  });

  it('liste fiyatı satış fiyatının altına inemiyor', async () => {
    const id = await icerikOlustur();
    await expect(sorgu(
      `INSERT INTO tours (content_id, kind, adult_price, adult_list_price)
       VALUES ($1,'daily',1000,800)`, [id])).rejects.toThrow(/tours_list_price_sane/);
  });

  it('konaklamalı tur gece/gün ve kişi fiyatı olmadan kaydedilemiyor', async () => {
    const id = await icerikOlustur();
    await expect(sorgu(
      `INSERT INTO tours (content_id, kind) VALUES ($1,'stay')`, [id]))
      .rejects.toThrow(/tours_stay_needs_nights/);
  });

  it('yüzde indirim 100ü aşamıyor', async () => {
    await expect(sorgu(
      `INSERT INTO campaigns (name, discount_type, discount_value, starts_at, ends_at)
       VALUES ('X','percent',120, now(), now() + interval '1 day')`))
      .rejects.toThrow(/campaigns_percent_range/);
  });

  it('kampanya bitiş tarihi başlangıçtan önce olamıyor', async () => {
    await expect(sorgu(
      `INSERT INTO campaigns (name, discount_type, discount_value, starts_at, ends_at)
       VALUES ('X','amount',100, now(), now() - interval '1 day')`))
      .rejects.toThrow(/campaigns_date_order/);
  });

  it('açık gün saatsiz olamıyor', async () => {
    const id = await icerikOlustur('venue', 'mekan-test');
    await expect(sorgu(
      `INSERT INTO venue_hours (content_id, weekday, closed) VALUES ($1, 1, false)`, [id]))
      .rejects.toThrow(/venue_hours_open_needs_times/);
    await sorgu(
      `INSERT INTO venue_hours (content_id, weekday, closed) VALUES ($1, 2, true)`, [id]);
  });

  it('kapora minimum harcamayı aşamıyor', async () => {
    const id = await icerikOlustur('venue', 'mekan-2');
    await expect(sorgu(
      `INSERT INTO venue_areas (content_id, code, name, min_spend, deposit)
       VALUES ($1,'a','A',1000,1500)`, [id])).rejects.toThrow(/venue_areas_deposit_sane/);
  });
});

describe('updated_at tetikleyicisi', () => {
  it('güncellemede kendiliğinden ilerliyor', async () => {
    const id = await icerikOlustur();
    const { rows: once } = await sorgu('SELECT updated_at FROM content WHERE id = $1', [id]);
    await new Promise(r => setTimeout(r, 15));
    await sorgu(`UPDATE content SET title = 'Yeni' WHERE id = $1`, [id]);
    const { rows: sonra } = await sorgu('SELECT updated_at FROM content WHERE id = $1', [id]);
    expect(new Date(sonra[0].updated_at).getTime())
      .toBeGreaterThan(new Date(once[0].updated_at).getTime());
  });
});
