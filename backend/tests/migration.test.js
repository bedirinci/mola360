/* Göç bütünlüğü testleri.

   Göçün tek sözü var: HİÇBİR ALAN SESSİZCE KAYBOLMAZ. Bu testler onu
   kaynaktan sayarak ölçüyor — göç scriptinin kendi raporuna güvenmiyor,
   veri dosyasındaki sayıyı veritabanındaki sayıyla karşılaştırıyor.

   Ayrıca göçün TEKRAR ÇALIŞTIRILABİLİR olduğunu doğruluyor: yarım kalmış
   bir göçü baştan almak mümkün olmalı ve ikinci çalıştırma kayıtları
   ikiye katlamamalı. */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { semayiKur } from './yardim.js';
import { sorgu, kapat } from '../src/db/pool.js';
import { sifreOzetle } from '../src/lib/password.js';

const calistir = promisify(execFile);
const require = createRequire(import.meta.url);
const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const yol = (a) => path.join(KOK, 'assets/js', a);

const TUR = require(yol('tour-data.js'));
const OTEL = require(yol('hotel-data.js'));
const AKTIVITE = require(yol('activity-data.js'));
const ETKINLIK = require(yol('event-data.js'));
const MEKAN = require(yol('venue-data.js'));
const TAKSONOMI = require(yol('taxonomy-data.js'));

const KAYNAK = {
  tour: TUR.TOURS, hotel: OTEL.HOTELS, activity: AKTIVITE.ACTIVITIES,
  event: ETKINLIK.EVENTS, venue: MEKAN.PLACES,
};
const TUM_KAYITLAR = Object.entries(KAYNAK)
  .flatMap(([tip, kume]) => Object.entries(kume).map(([anahtar, k]) => ({ tip, anahtar, k })));

let gocCiktisi = '';

async function gocCalistir() {
  const cevre = { ...process.env, DATABASE_URL: process.env.DATABASE_URL };
  const { stdout } = await calistir('node',
    [path.join(KOK, 'backend/scripts/import-legacy.js')], { env: cevre, cwd: path.join(KOK, 'backend') });
  return stdout;
}

beforeAll(async () => {
  await semayiKur();
  /* Göç bir süper yönetici bekliyor (created_by alanı için). */
  const { rows } = await sorgu(
    `INSERT INTO admin_users (email, password_hash, full_name)
     VALUES ('goc@mola360.test', $1, 'Göç') RETURNING id`, [await sifreOzetle('GocSifresi123')]);
  await sorgu(
    `INSERT INTO admin_user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE key = 'SUPER_ADMIN'`, [rows[0].id]);
  /* Bölge/şehir ana verisi olmadan eşleme yapılamaz. */
  await sorgu(`INSERT INTO regions (slug,name) VALUES
    ('ege','Ege'),('akdeniz','Akdeniz'),('ic-anadolu','İç Anadolu'),('marmara','Marmara')`);
  await sorgu(`INSERT INTO cities (slug,name,region_id) VALUES
    ('izmir','İzmir',(SELECT id FROM regions WHERE slug='ege')),
    ('nevsehir','Nevşehir',(SELECT id FROM regions WHERE slug='ic-anadolu')),
    ('antalya','Antalya',(SELECT id FROM regions WHERE slug='akdeniz')),
    ('istanbul','İstanbul',(SELECT id FROM regions WHERE slug='marmara')),
    ('ankara','Ankara',(SELECT id FROM regions WHERE slug='ic-anadolu'))`);
  gocCiktisi = await gocCalistir();
}, 90_000);

afterAll(async () => { await kapat(); });

const say = async (sql, p = []) => (await sorgu(sql, p)).rows[0].n;

describe('göç raporu', () => {
  it('aktarılmayan alan BIRAKMIYOR', async () => {
    /* Raporun kendi ifadesi; aşağıdaki testler ayrıca sayarak doğruluyor. */
    expect(gocCiktisi).toContain('AKTARILMAYAN ALANLAR (0)');
  });

  it('alan eşlemesi raporlanıyor', () => {
    expect(gocCiktisi).toContain('ALAN EŞLEMESİ');
    expect(gocCiktisi).toMatch(/content\.\*/);
    expect(gocCiktisi).toMatch(/hotel_rooms/);
  });
});

describe('kayıt sayıları kaynakla birebir', () => {
  it('her içerik türünün kayıt sayısı aynı', async () => {
    for (const [tip, kume] of Object.entries(KAYNAK)) {
      const n = await say('SELECT count(*)::int AS n FROM content WHERE type = $1', [tip]);
      expect(n, tip).toBe(Object.keys(kume).length);
    }
  });

  it('her kaydın slug ve başlığı korunmuş', async () => {
    for (const { tip, anahtar, k } of TUM_KAYITLAR) {
      const { rows } = await sorgu(
        'SELECT title, tagline, area, product_code FROM content WHERE type = $1 AND slug = $2',
        [tip, k.slug || anahtar]);
      expect(rows, `${tip}/${k.slug}`).toHaveLength(1);
      expect(rows[0].title).toBe(k.title);
      expect(rows[0].tagline).toBe(k.tagline);
      expect(rows[0].area).toBe(k.area);
      expect(rows[0].product_code).toBe(k.code);
    }
  });
});

describe('alt kayıtlar eksiksiz', () => {
  async function icerikId(tip, slug) {
    const { rows } = await sorgu('SELECT id FROM content WHERE type=$1 AND slug=$2', [tip, slug]);
    return rows[0].id;
  }

  it('galeri, SSS, yorum ve etiket sayıları kaynakla aynı', async () => {
    for (const { tip, anahtar, k } of TUM_KAYITLAR) {
      const id = await icerikId(tip, k.slug || anahtar);
      const kontrol = [
        ['content_media', "role='gallery'", (k.gallery || []).length, 'galeri'],
        ['content_faqs', 'true', (k.faq || []).length, 'SSS'],
        ['reviews', 'true', (k.reviews || []).length, 'yorum'],
        ['content_tags', 'true', (k.tags || []).length, 'etiket'],
        ['content_addons', 'true', (k.addons || []).length, 'ek hizmet'],
      ];
      for (const [tablo, kosul, beklenen, ad] of kontrol) {
        const n = await say(
          `SELECT count(*)::int AS n FROM ${tablo} WHERE content_id = $1 AND ${kosul}`, [id]);
        expect(n, `${k.slug} · ${ad}`).toBe(beklenen);
      }
    }
  });

  it('otel odaları ve pansiyonları fiyatıyla birlikte aktarılmış', async () => {
    for (const [slug, o] of Object.entries(OTEL.HOTELS)) {
      const id = await icerikId('hotel', slug);
      const { rows } = await sorgu(
        'SELECT code, name, nightly, nightly_list, stock, max_guests FROM hotel_rooms WHERE content_id=$1 ORDER BY position',
        [id]);
      expect(rows).toHaveLength(o.rooms.length);
      rows.forEach((satir, i) => {
        expect(satir.code).toBe(o.rooms[i].id);
        expect(satir.name).toBe(o.rooms[i].name);
        expect(satir.nightly).toBe(o.rooms[i].nightly);
        expect(satir.nightly_list).toBe(o.rooms[i].nightlyList);
        expect(satir.stock).toBe(o.rooms[i].count);
        expect(satir.max_guests).toBe(o.rooms[i].maxGuests);
      });
      const pansiyon = await say(
        'SELECT count(*)::int AS n FROM hotel_boards WHERE content_id=$1', [id]);
      expect(pansiyon).toBe(o.boards.length);
    }
  });

  it('etkinlik temsilleri ve bilet kategorileri aktarılmış', async () => {
    for (const [slug, e] of Object.entries(ETKINLIK.EVENTS)) {
      const id = await icerikId('event', slug);
      expect(await say('SELECT count(*)::int AS n FROM event_performances WHERE content_id=$1', [id]))
        .toBe(e.performances.length);

      const { rows } = await sorgu(
        'SELECT code, price, price_list, student_price, student_available, seats FROM event_ticket_categories WHERE content_id=$1 ORDER BY position',
        [id]);
      expect(rows).toHaveLength(e.categories.length);
      rows.forEach((satir, i) => {
        expect(satir.price).toBe(e.categories[i].price);
        expect(satir.seats).toBe(e.categories[i].seats);
        /* "öğrenci bileti yok" ile "0 TL öğrenci bileti" artık ayrı bilgi. */
        expect(satir.student_available).toBe(e.categories[i].student > 0);
      });
    }
  });

  it('aktivite paketleri ve seansları aktarılmış', async () => {
    for (const [slug, a] of Object.entries(AKTIVITE.ACTIVITIES)) {
      const id = await icerikId('activity', slug);
      const { rows } = await sorgu(
        'SELECT code, per_person, per_person_list, capacity FROM activity_packages WHERE content_id=$1 ORDER BY position', [id]);
      expect(rows).toHaveLength(a.packages.length);
      rows.forEach((s, i) => {
        expect(s.per_person).toBe(a.packages[i].perPerson);
        expect(s.capacity).toBe(a.packages[i].capacity);
      });
      expect(await say('SELECT count(*)::int AS n FROM activity_sessions WHERE content_id=$1', [id]))
        .toBe(a.sessions.length);
    }
  });

  it('mekân alanları, hizmetleri ve çalışma saatleri aktarılmış', async () => {
    for (const [slug, m] of Object.entries(MEKAN.PLACES)) {
      const id = await icerikId('venue', slug);
      expect(await say('SELECT count(*)::int AS n FROM venue_areas WHERE content_id=$1', [id]))
        .toBe((m.areas || []).length);
      expect(await say('SELECT count(*)::int AS n FROM venue_services WHERE content_id=$1', [id]))
        .toBe((m.services || []).length);
      expect(await say('SELECT count(*)::int AS n FROM venue_hours WHERE content_id=$1', [id]))
        .toBe((m.hours || []).length);

      const { rows } = await sorgu('SELECT booking_model FROM venues WHERE content_id=$1', [id]);
      expect(rows[0].booking_model).toBe(m.booking);
    }
  });

  it('konaklamalı turun programı, kalkış şehirleri ve konaklaması aktarılmış', async () => {
    const tur = TUR.TOURS['kapadokya-3-gece'];
    const id = await icerikId('tour', 'kapadokya-3-gece');

    const { rows: gunler } = await sorgu(
      'SELECT day_no, title, meal, accommodation FROM tour_itinerary_days WHERE content_id=$1 ORDER BY position', [id]);
    expect(gunler).toHaveLength(tur.program.length);
    expect(gunler[0].day_no).toBe(tur.program[0].day);
    expect(gunler[0].accommodation).toBe(tur.program[0].overnight);

    const { rows: sehirler } = await sorgu(
      'SELECT code, label, fee FROM tour_departure_cities WHERE content_id=$1 ORDER BY position', [id]);
    expect(sehirler).toHaveLength(tur.departureCities.length);
    /* Fiyat farkı korunmuş: İzmir çıkışı +350 TL. */
    sehirler.forEach((s, i) => expect(s.fee).toBe(tur.departureCities[i].fee));

    const { rows: konaklama } = await sorgu(
      `SELECT payload FROM content_blocks WHERE content_id=$1 AND kind='accommodation'`, [id]);
    expect(konaklama).toHaveLength(1);
    expect(konaklama[0].payload.hotels).toHaveLength(tur.accommodation.hotels.length);
  });

  it('günübirlik turun saatli programı aktarılmış', async () => {
    const tur = TUR.TOURS['efes-sirince'];
    const id = await icerikId('tour', 'efes-sirince');
    const { rows } = await sorgu(
      'SELECT time_label, title FROM tour_itinerary_days WHERE content_id=$1 ORDER BY position', [id]);
    expect(rows).toHaveLength(tur.itinerary.length);
    expect(rows[0].time_label).toBe(tur.itinerary[0].time);
    expect(rows[0].title).toBe(tur.itinerary[0].title);
  });
});

/* 019: ürünün taxonomy alanı ve sınıflandırma ana verisi. Göç raporunun
   "aktarılmayan alan 0" demesi yetmiyor; her bağ kaynaktan sayılıyor. */
describe('sınıflandırma', () => {
  async function icerik(tip, slug) {
    const { rows } = await sorgu(
      `SELECT c.id, c.currency, k.slug AS ana_kategori, s.slug AS sehir, r.slug AS bolge
         FROM content c
         LEFT JOIN categories k ON k.id = c.category_id
         LEFT JOIN cities s ON s.id = c.city_id
         LEFT JOIN regions r ON r.id = c.region_id
        WHERE c.type = $1 AND c.slug = $2`, [tip, slug]);
    return rows[0];
  }

  it('ana veri taxonomy-data.js ile aynı sayıda', async () => {
    expect(await say('SELECT count(*)::int AS n FROM themes')).toBe(TAKSONOMI.TAXONOMY_THEMES.length);
    expect(await say('SELECT count(*)::int AS n FROM collections')).toBe(TAKSONOMI.TAXONOMY_COLLECTIONS.length);
    expect(await say('SELECT count(*)::int AS n FROM listing_pages')).toBe(TAKSONOMI.TAXONOMY_LISTINGS.length);
    for (const k of TAKSONOMI.TAXONOMY_CATEGORIES) {
      const { rows } = await sorgu(
        `SELECT k.name, k.name_short, k.in_menu, u.slug AS ust FROM categories k
           LEFT JOIN categories u ON u.id = k.parent_id
          WHERE k.content_type = $1 AND k.slug = $2`, [k.type, k.slug]);
      expect(rows, k.type + '/' + k.slug).toHaveLength(1);
      expect(rows[0].name).toBe(k.name);
      expect(rows[0].name_short).toBe(k.nameShort);
      expect(rows[0].ust).toBe(k.parent);
      expect(rows[0].in_menu).toBe(k.menu !== false);
    }
  });

  it('her ürünün kategori, tema, koleksiyon ve özellikleri bağlanmış', async () => {
    for (const { tip, anahtar, k } of TUM_KAYITLAR) {
      const c = await icerik(tip, k.slug || anahtar);
      const t = k.taxonomy;
      expect(c.ana_kategori, k.slug).toBe(t.categories[0]);
      const { rows: kat } = await sorgu(
        `SELECT k.slug FROM content_categories cc JOIN categories k ON k.id = cc.category_id
          WHERE cc.content_id = $1 ORDER BY cc.position`, [c.id]);
      expect(kat.map(r => r.slug), k.slug).toEqual(t.categories);
      const { rows: tema } = await sorgu(
        `SELECT t.slug FROM content_themes ct JOIN themes t ON t.id = ct.theme_id
          WHERE ct.content_id = $1 ORDER BY ct.position`, [c.id]);
      expect(tema.map(r => r.slug), k.slug).toEqual(t.themes);
      const { rows: kol } = await sorgu(
        `SELECT k.slug FROM content_collections cc JOIN collections k ON k.id = cc.collection_id
          WHERE cc.content_id = $1 ORDER BY cc.position`, [c.id]);
      expect(kol.map(r => r.slug), k.slug).toEqual(t.collections);
      const beklenenOzellik = ['transport', 'departFrom']
        .flatMap(a => (t.facets[a] || []).length).reduce((x, y) => x + y, 0);
      expect(await say('SELECT count(*)::int AS n FROM content_facets WHERE content_id = $1', [c.id]),
        k.slug).toBe(beklenenOzellik);
    }
  });

  it('şehir ve bölge taxonomy.city alanından, para birimi kayıttan', async () => {
    for (const { tip, anahtar, k } of TUM_KAYITLAR) {
      const c = await icerik(tip, k.slug || anahtar);
      expect(c.sehir, k.slug).toBe(k.taxonomy.city);
      expect(c.bolge, k.slug).toBe(TAKSONOMI.taxonomyCityRegion(k.taxonomy.city).slug);
      expect(c.currency, k.slug).toBe(k.currency);
    }
  });

  it('SEO başlıkları kayıttan', async () => {
    for (const { tip, anahtar, k } of TUM_KAYITLAR) {
      const c = await icerik(tip, k.slug || anahtar);
      const { rows } = await sorgu(
        'SELECT seo_title, meta_description, og_title, og_description FROM content_seo WHERE content_id = $1',
        [c.id]);
      expect(rows[0].seo_title, k.slug).toBe(k.seo.title);
      expect(rows[0].meta_description, k.slug).toBe(k.seo.description);
      expect(rows[0].og_title, k.slug).toBe(k.seo.ogTitle);
      expect(rows[0].og_description, k.slug).toBe(k.seo.ogDescription);
    }
  });

  it('kalkış şehirleri ana veriye bağlanmış', async () => {
    const id = (await icerik('tour', 'kapadokya-3-gece')).id;
    const { rows } = await sorgu(
      `SELECT s.slug FROM tour_departure_cities d LEFT JOIN cities s ON s.id = d.city_id
        WHERE d.content_id = $1 ORDER BY d.position`, [id]);
    expect(rows.map(r => r.slug)).toEqual(
      TUR.TOURS['kapadokya-3-gece'].departureCities.map(d => d.city));
  });
});

describe('ilişkiler ve medya', () => {
  it('benzer içerikler ID ile bağlanmış, çözülemeyenler kaybolmamış', async () => {
    const toplamBenzer = TUM_KAYITLAR.reduce((t, x) => t + (x.k.similar || []).length, 0);
    const iliski = await say('SELECT count(*)::int AS n FROM content_relations');
    const cozulemeyen = await say(
      `SELECT count(*)::int AS n FROM content_blocks WHERE kind='similar_unresolved'`);
    /* Hiçbiri kaybolmamış: ya ilişki ya blok. */
    expect(iliski + cozulemeyen).toBe(toplamBenzer);
    expect(iliski).toBeGreaterThan(0);
  });

  it('bir kayıt kendisine benzer olarak bağlanmamış', async () => {
    const n = await say(
      'SELECT count(*)::int AS n FROM content_relations WHERE from_content_id = to_content_id');
    expect(n).toBe(0);
  });

  it('kullanılan her görsel anahtarı media tablosunda', async () => {
    const { rows } = await sorgu('SELECT legacy_key FROM media WHERE legacy_key IS NOT NULL');
    const mevcut = new Set(rows.map(r => r.legacy_key));
    const eksik = [];
    for (const { k } of TUM_KAYITLAR) {
      for (const g of (k.gallery || [])) if (!mevcut.has(g.key)) eksik.push(g.key);
      if (k.card?.img && !mevcut.has(k.card.img)) eksik.push(k.card.img);
    }
    expect(eksik).toEqual([]);
  });

  it('her kaydın kapak görseli bağlanmış', async () => {
    const n = await say(
      `SELECT count(*)::int AS n FROM content WHERE card_media_id IS NULL AND deleted_at IS NULL`);
    expect(n).toBe(0);
  });

  it('galeri sırası korunmuş', async () => {
    const otel = OTEL.HOTELS['kordon-butik-otel'];
    const { rows } = await sorgu(
      `SELECT m.legacy_key, cm.caption FROM content_media cm
         JOIN media m ON m.id = cm.media_id
         JOIN content c ON c.id = cm.content_id
        WHERE c.slug = 'kordon-butik-otel' AND cm.role = 'gallery'
        ORDER BY cm.position`);
    expect(rows.map(r => r.legacy_key)).toEqual(otel.gallery.map(g => g.key));
    expect(rows.map(r => r.caption)).toEqual(otel.gallery.map(g => g.caption));
  });
});

describe('tekrar çalıştırılabilirlik', () => {
  it('ikinci kez çalıştırmak kayıtları ikiye katlamıyor', async () => {
    const once = {
      content: await say('SELECT count(*)::int AS n FROM content'),
      faq: await say('SELECT count(*)::int AS n FROM content_faqs'),
      oda: await say('SELECT count(*)::int AS n FROM hotel_rooms'),
      yorum: await say('SELECT count(*)::int AS n FROM reviews'),
      blok: await say('SELECT count(*)::int AS n FROM content_blocks'),
      kategori: await say('SELECT count(*)::int AS n FROM content_categories'),
      tema: await say('SELECT count(*)::int AS n FROM content_themes'),
      ozellik: await say('SELECT count(*)::int AS n FROM content_facets'),
    };
    await gocCalistir();
    for (const [ad, beklenen] of Object.entries(once)) {
      const tablo = { content: 'content', faq: 'content_faqs', oda: 'hotel_rooms',
                      yorum: 'reviews', blok: 'content_blocks', kategori: 'content_categories',
                      tema: 'content_themes', ozellik: 'content_facets' }[ad];
      expect(await say(`SELECT count(*)::int AS n FROM ${tablo}`), ad).toBe(beklenen);
    }
  }, 60_000);
});
