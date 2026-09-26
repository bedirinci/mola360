#!/usr/bin/env node
/* ============================================================================
   Mevcut JavaScript veri dosyalarından veritabanına göç.

   TEMEL KURAL: HİÇBİR ALAN SESSİZCE KAYBOLMAZ.

   Her kaydın her alanı ya bir tabloya yazılıyor ya da raporda "aktarılmadı"
   olarak listeleniyor. Script bunu tahminle değil ÖLÇEREK yapıyor: kaydın
   üst seviye anahtarları toplanıyor, işlenen her anahtar işaretleniyor ve
   sonunda işaretlenmeyenler rapora düşüyor.

   Bu olmadan göç "çalıştı gibi görünüp" bir alanı sessizce düşürebilir ve
   eksik ancak aylar sonra, o alan sitede boş çıktığında fark edilir.

   YENİDEN ÇALIŞTIRILABİLİR: aynı slug ile çalıştırıldığında kaydı günceller,
   alt kayıtları silip yeniden yazar. Yarım kalmış bir göçü baştan almak
   mümkün olmalı.
   ============================================================================ */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transaction, kapat, sorgu } from '../src/db/pool.js';

const require = createRequire(import.meta.url);
const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const veriYolu = (ad) => path.join(KOK, 'assets/js', ad);

const TUR_VERI      = require(veriYolu('tour-data.js'));
const OTEL_VERI     = require(veriYolu('hotel-data.js'));
const AKTIVITE_VERI = require(veriYolu('activity-data.js'));
const ETKINLIK_VERI = require(veriYolu('event-data.js'));
const MEKAN_VERI    = require(veriYolu('venue-data.js'));
/* Sınıflandırmanın ana verisi: bölge, şehir, kategori, tema, koleksiyon,
   liste sayfası. Ürün kayıtları buna slug ile bağlanıyor
   (docs/veri-sozlesmesi.md bölüm 5). */
const TAKSONOMI     = require(veriYolu('taxonomy-data.js'));

/* ---------------- rapor ----------------
   Her aktarılan alan ve aktarılamayan her alan buraya yazılıyor. */
const rapor = {
  esleme: new Map(),      // 'tour.title' -> 'content.title'
  aktarilmayan: [],       // { tur, slug, alan, sebep }
  uyarilar: [],
  sayac: {},
};
const esle = (kaynak, hedef) => rapor.esleme.set(kaynak, hedef);
const say = (ad, n = 1) => { rapor.sayac[ad] = (rapor.sayac[ad] || 0) + n; };

/* ---------------- yardımcılar ---------------- */
const metin = (v) => (v === undefined || v === null ? '' : String(v));
const sayi = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const saat = (v) => (/^\d{1,2}:\d{2}$/.test(metin(v)) ? metin(v) : null);

/* Türkçe karakterleri URL güvenli hâle getiren slug üreticisi.
   toLowerCase() tek başına 'İ' harfini 'i̇' (birleşik) yapar ve slug bozulur;
   harf eşlemesi bu yüzden elle. */
const TR_HARF = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o',
                  'ş':'s','Ş':'s','ü':'u','Ü':'u','â':'a','î':'i','û':'u' };
function slugla(v) {
  return metin(v).replace(/[çÇğĞıİöÖşŞüÜâîû]/g, (h) => TR_HARF[h] || h)
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
    /* Kesilen yer bir tirenin üstüne denk gelirse sonda tire kalıyordu ve
       kayıt is_slug() kısıtına takılıyordu. Ön yüzdeki slugOlustur ile
       aynı kural (tests/slug.test.js ikisini karşılaştırıyor). */
    .replace(/-+$/g, '');
}

/* ---------------- medya ----------------
   Beş görsel sözlüğü + app.js'teki cardImages tek bir media tablosuna
   giriyor. Aynı dosya adı iki sözlükte varsa TEK satır olur: mevcut testler
   zaten aynı anahtarın aynı adresi ürettiğini doğruluyor, yani ikisi aynı
   fotoğraf. */
async function medyaAktar(c) {
  const sozlukler = [
    ['tour', TUR_VERI.TOUR_IMAGE_FILES],
    ['hotel', OTEL_VERI.HOTEL_IMAGE_FILES],
    ['activity', AKTIVITE_VERI.ACTIVITY_IMAGE_FILES],
    ['event', ETKINLIK_VERI.EVENT_IMAGE_FILES],
    ['venue', MEKAN_VERI.VENUE_IMAGE_FILES],
  ];
  const idler = new Map();

  for (const [tur, sozluk] of sozlukler) {
    for (const [anahtar, kayit] of Object.entries(sozluk || {})) {
      const { rows } = await c.query(
        `INSERT INTO media (legacy_key, storage_driver, storage_path, alt, title,
                            source, source_url, license, license_url, attribution,
                            usage_permission)
         VALUES ($1,'commons',$2,$3,$3,'Wikimedia Commons',$4,
                 'Bkz. dosya sayfası','', 'Wikimedia Commons katkıcıları','granted')
         ON CONFLICT (legacy_key) WHERE legacy_key IS NOT NULL DO UPDATE
           SET storage_path = EXCLUDED.storage_path, alt = EXCLUDED.alt
         RETURNING id`,
        [anahtar, kayit.dosya, metin(kayit.ad),
         'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(kayit.dosya)]);
      idler.set(anahtar, rows[0].id);
      say('media');
    }
    esle(`${tur}.IMAGE_FILES`, 'media (legacy_key, storage_path, alt)');
  }

  /* Anasayfa kart görselleri app.js içinde bir sözlükte; o dosya modül
     olmadığı için METİN olarak okunuyor — mevcut testler de aynı yolu
     izliyor (tests/icerik.test.js). */
  const app = readFileSync(path.join(KOK, 'assets/js/app.js'), 'utf8');
  const blok = app.match(/const cardImages = \{([\s\S]*?)\n\};/);
  if (blok) {
    for (const m of blok[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
      const [, anahtar, adres] = m;
      if (idler.has(anahtar)) continue;
      const commons = adres.match(/Special:FilePath\/([^?]+)/);
      const { rows } = await c.query(
        `INSERT INTO media (legacy_key, storage_driver, storage_path, alt, source, source_url)
         VALUES ($1, $2, $3, $1, $4, $5)
         ON CONFLICT (legacy_key) WHERE legacy_key IS NOT NULL DO UPDATE
           SET storage_path = EXCLUDED.storage_path
         RETURNING id`,
        [anahtar,
         commons ? 'commons' : 'local',
         commons ? decodeURIComponent(commons[1]).replace(/_/g, ' ') : adres,
         commons ? 'Wikimedia Commons' : 'Unsplash',
         adres]);
      idler.set(anahtar, rows[0].id);
      say('media');
    }
    esle('app.js cardImages', 'media (legacy_key, storage_path)');
  } else {
    rapor.uyarilar.push('app.js içinde cardImages sözlüğü bulunamadı; kart görselleri eksik.');
  }
  return idler;
}

/* ---------------- sınıflandırma ana verisi ----------------
   taxonomy-data.js tek kaynak. Göç her çalıştığında ana veriyi ondan
   YENİLİYOR (upsert): adı değişen bir kategori veritabanında eski adıyla
   kalmasın. Silinen kayıt silinmiyor — bir ürün hâlâ ona bağlı olabilir;
   yönetim panelinin işi. */
async function taksonomiAktar(c, medya) {
  const T = TAKSONOMI;

  for (const [i, b] of T.TAXONOMY_REGIONS.entries()) {
    await c.query(
      `INSERT INTO regions (slug, name, position, abroad) VALUES ($1,$2,$3,$4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position,
                                         abroad = EXCLUDED.abroad`,
      [b.slug, b.name, i, !!b.abroad]);
    say('regions');
  }
  for (const s of T.TAXONOMY_CITIES) {
    await c.query(
      `INSERT INTO cities (slug, name, region_id)
       VALUES ($1,$2,(SELECT id FROM regions WHERE slug = $3))
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, region_id = EXCLUDED.region_id`,
      [s.slug, s.name, s.region]);
    say('cities');
  }
  esle('taxonomy-data.js · bölge/şehir', 'regions (+abroad) / cities');

  /* Kategoriler iki geçişte: önce hepsi, sonra üst kategori bağı. Tek
     geçişte alt kategori üstünden önce gelirse parent_id çözülemezdi. */
  const kategoriler = new Map();
  for (const [i, k] of T.TAXONOMY_CATEGORIES.entries()) {
    const { rows } = await c.query(
      `INSERT INTO categories (content_type, slug, name, name_short, name_plural, position, in_menu)
       VALUES ($1,$2,$3,$4,$3,$5,$6)
       ON CONFLICT (content_type, slug) DO UPDATE
         SET name = EXCLUDED.name, name_short = EXCLUDED.name_short,
             name_plural = EXCLUDED.name_plural, position = EXCLUDED.position,
             in_menu = EXCLUDED.in_menu
       RETURNING id`,
      [k.type, k.slug, k.name, k.nameShort, i, k.menu !== false]);
    kategoriler.set(k.type + '|' + k.slug, rows[0].id);
    say('categories');
  }
  for (const k of T.TAXONOMY_CATEGORIES) {
    await c.query('UPDATE categories SET parent_id = $1 WHERE id = $2',
      [k.parent ? kategoriler.get(k.type + '|' + k.parent) : null, kategoriler.get(k.type + '|' + k.slug)]);
  }
  esle('taxonomy-data.js · kategoriler', 'categories (+parent_id, in_menu)');

  const temalar = new Map();
  for (const [i, t] of T.TAXONOMY_THEMES.entries()) {
    const { rows } = await c.query(
      `INSERT INTO themes (slug, name, media_id, position) VALUES ($1,$2,$3,$4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, media_id = EXCLUDED.media_id,
                                         position = EXCLUDED.position
       RETURNING id`,
      [t.slug, t.name, medya.get(t.img) || null, i]);
    temalar.set(t.slug, rows[0].id);
    say('themes');
    if (!medya.get(t.img)) rapor.uyarilar.push(`Tema görseli sözlükte yok: ${t.slug} (${t.img})`);
  }
  esle('taxonomy-data.js · temalar', 'themes');

  const koleksiyonlar = new Map();
  for (const [i, k] of T.TAXONOMY_COLLECTIONS.entries()) {
    const { rows } = await c.query(
      `INSERT INTO collections (slug, name, subtitle, media_id, mode, rule, position)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, subtitle = EXCLUDED.subtitle,
         media_id = EXCLUDED.media_id, mode = EXCLUDED.mode, rule = EXCLUDED.rule,
         position = EXCLUDED.position
       RETURNING id`,
      [k.slug, k.name, metin(k.text), medya.get(k.img) || null, k.mode,
       JSON.stringify(k.mode === 'rule' ? (k.rule || {}) : {}), i]);
    koleksiyonlar.set(k.slug, { id: rows[0].id, mode: k.mode });
    say('collections');
  }
  esle('taxonomy-data.js · koleksiyonlar', 'collections (mode, rule)');

  for (const [i, l] of T.TAXONOMY_LISTINGS.entries()) {
    await c.query(
      `INSERT INTO listing_pages (base, slug, name, filter, in_menu, position)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6)
       ON CONFLICT (base, slug) DO UPDATE SET name = EXCLUDED.name, filter = EXCLUDED.filter,
         in_menu = EXCLUDED.in_menu, position = EXCLUDED.position`,
      [l.base, l.slug, l.name, JSON.stringify(l.filter || {}), l.menu !== false, i]);
    say('listing_pages');
  }
  esle('taxonomy-data.js · liste sayfaları', 'listing_pages');

  return { kategoriler, temalar, koleksiyonlar };
}

/* ---------------- ana veri ---------------- */
async function bolgeSehirCoz(c, kayit) {
  /* Şehir kaydın taxonomy.city alanından; bölge şehirden türetiliyor.
     Kayıttaki "region: 'Ege'" yalnızca görüntü metni (ön yüz testi
     taksonomiyle aynı olduğunu ölçüyor). */
  const sehirSlug = kayit.taxonomy && kayit.taxonomy.city;
  if (sehirSlug) {
    const { rows } = await c.query(
      'SELECT id, region_id FROM cities WHERE slug = $1', [sehirSlug]);
    if (rows[0]) return { bolgeId: rows[0].region_id, sehirId: rows[0].id };
    rapor.aktarilmayan.push({ tur: kayit.type, slug: kayit.slug, alan: 'taxonomy.city',
      sebep: `Şehir ana veride yok: ${sehirSlug}` });
  }
  const bolgeAdi = metin(kayit.region);
  let bolgeId = null;
  if (bolgeAdi) {
    const { rows } = await c.query('SELECT id FROM regions WHERE slug = $1', [slugla(bolgeAdi)]);
    bolgeId = rows[0]?.id ?? null;
    if (!bolgeId) rapor.uyarilar.push(`Bölge bulunamadı: "${bolgeAdi}" (${kayit.slug})`);
  }
  /* area "Alsancak, İzmir" biçiminde: son parça şehir. */
  const parcalar = metin(kayit.area).split(',').map(s => s.trim()).filter(Boolean);
  let sehirId = null;
  for (let i = parcalar.length - 1; i >= 0 && !sehirId; i--) {
    const { rows } = await c.query('SELECT id FROM cities WHERE slug = $1', [slugla(parcalar[i])]);
    sehirId = rows[0]?.id ?? null;
  }
  return { bolgeId, sehirId };
}

/* Ana kategori: taxonomy.categories'in ilki. Eskiden kayıttaki
   "category: 'Günübirlik Tur'" görüntü metninden bir kategori
   üretiliyordu; o metin bir kategori değil tur tipiydi (tours.kind). */
function anaKategoriId(tip, kayit, taks) {
  const liste = (kayit.taxonomy && kayit.taxonomy.categories) || [];
  return liste.length ? (taks.kategoriler.get(tip + '|' + liste[0]) || null) : null;
}

/* taxonomy alanının bağ tabloları. Ana veride karşılığı olmayan slug
   SESSİZCE ATLANMIYOR: rapora düşüyor ve "aktarılmayan alan" sayılıyor. */
async function siniflandirmaYaz(c, id, tip, k, taks) {
  const t = k.taxonomy || {};
  const eksik = (alan, deger) => rapor.aktarilmayan.push({ tur: tip, slug: k.slug,
    alan: 'taxonomy.' + alan, sebep: `Ana veride yok: ${deger}` });

  for (const [i, s] of (t.categories || []).entries()) {
    const kid = taks.kategoriler.get(tip + '|' + s);
    if (!kid) { eksik('categories', s); continue; }
    await c.query(
      'INSERT INTO content_categories (content_id, category_id, position) VALUES ($1,$2,$3)',
      [id, kid, i]);
    say('content_categories');
  }
  for (const [i, s] of (t.themes || []).entries()) {
    const tid = taks.temalar.get(s);
    if (!tid) { eksik('themes', s); continue; }
    await c.query(
      'INSERT INTO content_themes (content_id, theme_id, position) VALUES ($1,$2,$3)',
      [id, tid, i]);
    say('content_themes');
  }
  for (const [i, s] of (t.collections || []).entries()) {
    const kol = taks.koleksiyonlar.get(s);
    if (!kol) { eksik('collections', s); continue; }
    /* Kurala göre koleksiyona elle üye yazılamaz; veritabanı da reddeder
       (019, content_collections_manual_guard). */
    if (kol.mode !== 'manual') {
      rapor.aktarilmayan.push({ tur: tip, slug: k.slug, alan: 'taxonomy.collections',
        sebep: `${s} kurala göre çalışıyor, elle üye yazılamaz` });
      continue;
    }
    await c.query(
      'INSERT INTO content_collections (content_id, collection_id, position) VALUES ($1,$2,$3)',
      [id, kol.id, i]);
    say('content_collections');
  }
  const ozellik = t.facets || {};
  for (const [anahtar, facet] of [['transport', 'transport'], ['departFrom', 'depart_from']]) {
    for (const deger of (ozellik[anahtar] || [])) {
      await c.query(
        'INSERT INTO content_facets (content_id, facet, value) VALUES ($1,$2,$3)',
        [id, facet, deger]);
      say('content_facets');
    }
  }
}

async function konumYaz(c, contentId, nesne, rol, sehirId) {
  if (!nesne || typeof nesne !== 'object') return;
  const { rows } = await c.query(
    `INSERT INTO locations (name, city_id, address, map_url, directions)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [metin(nesne.title) || rol, sehirId, metin(nesne.address),
     metin(nesne.mapUrl), metin(nesne.note)]);
  await c.query(
    `INSERT INTO content_locations (content_id, location_id, role, position, detail)
     VALUES ($1,$2,$3,0,$4)`,
    [contentId, rows[0].id, rol, metin(nesne.note)]);
  say('locations');

  /* Buluşma noktaları ayrı satırlar: "07:30 Kadıköy" gibi her nokta ayrı
     bir konum. Tek bir metinde tutulursa panelden yönetilemez. */
  const noktalar = nesne.points || nesne.access || nesne.nearby || nesne.transport || [];
  let i = 0;
  for (const n of noktalar) {
    if (!n || typeof n !== 'object') continue;
    const { rows: r2 } = await c.query(
      `INSERT INTO locations (name, city_id, address) VALUES ($1,$2,$3) RETURNING id`,
      [metin(n.name || n.text), sehirId, metin(n.detail || n.distance || '')]);
    await c.query(
      `INSERT INTO content_locations (content_id, location_id, role, position, time_label, detail)
       VALUES ($1,$2,'pickup',$3,$4,$5)`,
      [contentId, r2[0].id, ++i, metin(n.time), metin(n.detail || n.distance || n.text)]);
    say('locations');
  }
}

/* ---------------- bloklar ----------------
   Basit listeler ve nesne listeleri content_blocks'a. Her biri hangi
   `kind` ile gittiği raporda görünüyor. */
const BLOK_ESLEME = [
  ['highlights',   'highlight'],
  ['description',  'description'],
  ['badges',       'badge'],
  ['facts',        'fact'],
  ['trust',        'trust'],
  ['included',     'included'],
  ['excluded',     'excluded'],
  ['bring',        'bring'],
  ['important',    'important'],
  ['requirements', 'requirement'],
  ['rules',        'rule'],
  ['policies',     'policy'],
  ['amenities',    'amenity_group'],
  ['menu',         'menu_group'],
  ['ratingAspects','rating_aspect'],
];

async function bloklariYaz(c, contentId, kayit, kullanilan, tip) {
  /* Program/itinerary TURDA kendi tablosuna gidiyor (tour_itinerary_days);
     aktivitede gün gün bir yapı olmadığı için blok kalıyor. */
  if (tip !== 'tour' && Array.isArray(kayit.itinerary) && kayit.itinerary.length) {
    let i = 0;
    for (const oge of kayit.itinerary) {
      await c.query(
        `INSERT INTO content_blocks (content_id, kind, position, payload)
         VALUES ($1,'itinerary',$2,$3::jsonb)`, [contentId, i++, JSON.stringify(oge)]);
      say('content_blocks');
    }
    esle('activity.itinerary[]', "content_blocks (kind='itinerary')");
  }
  if (tip !== 'tour') kullanilan.add('itinerary');

  for (const [alan, kind] of BLOK_ESLEME) {
    const liste = kayit[alan];
    if (!Array.isArray(liste) || !liste.length) { kullanilan.add(alan); continue; }
    let i = 0;
    for (const oge of liste) {
      const govde = (typeof oge === 'string') ? { text: oge } : oge;
      await c.query(
        `INSERT INTO content_blocks (content_id, kind, position, payload)
         VALUES ($1,$2,$3,$4::jsonb)`,
        [contentId, kind, i++, JSON.stringify(govde)]);
      say('content_blocks');
    }
    kullanilan.add(alan);
    esle(`*.${alan}`, `content_blocks (kind='${kind}')`);
  }

  /* Tekil nesneler de blok olarak: iptal koşulları, hava politikası,
     sosyal kanıt sayıları. */
  for (const [alan, kind] of [['cancellation','cancellation'], ['weather','weather'], ['social','social']]) {
    if (kayit[alan] && typeof kayit[alan] === 'object') {
      await c.query(
        `INSERT INTO content_blocks (content_id, kind, position, payload)
         VALUES ($1,$2,0,$3::jsonb)`,
        [contentId, kind, JSON.stringify(kayit[alan])]);
      say('content_blocks');
      esle(`*.${alan}`, `content_blocks (kind='${kind}')`);
    }
    kullanilan.add(alan);
  }
}

/* ---------------- tür tabloları ---------------- */
async function turDetay(c, id, k, medya, kullanilan) {
  const p = k.pricing || {};
  const konaklamali = k.type === 'stay';
  await c.query(
    `INSERT INTO tours (content_id, kind, duration_label, nights, days, start_time,
       lead_days, departure_days, seats_per_departure, max_guests, max_infants,
       adult_price, adult_list_price, child_price, child_list_price, infant_price,
       per_person_price, per_person_list_price, single_room_supplement,
       child_ages, infant_ages, unit_note, departure_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
    [id, konaklamali ? 'stay' : 'daily', metin(k.durationLabel),
     konaklamali ? sayi(k.nights) : null, konaklamali ? sayi(k.days) : null,
     saat(p.startTime), sayi(p.leadDays),
     Array.isArray(p.departureDays) ? p.departureDays : [],
     sayi(p.seatsPerDeparture), sayi(p.maxGuests) || 9, sayi(p.maxInfants),
     sayi(p.adult), sayi(p.adultList), sayi(p.child), sayi(p.childList), sayi(p.infant),
     konaklamali ? sayi(p.perPerson) : null, konaklamali ? sayi(p.perPersonList) : null,
     sayi(p.singleRoom || p.singleSupplement),
     metin(p.childAges), metin(p.infantAges), metin(p.unitNote), metin(p.departureNote)]);
  esle('tour.pricing.*', 'tours.*');
  esle('tour.nights/days/durationLabel', 'tours.nights/days/duration_label');

  /* PROGRAM — iki ayrı kaynak, tek hedef:
       konaklamalı tur  k.program[]   gün numarası, öğün ve konaklama bilgisiyle
       günübirlik tur   k.itinerary[] saat bazlı, tek gün
     İkisi de tour_itinerary_days'e gidiyor; gün numarası konaklamalıda
     kaydın kendisinden geliyor, günübirlikte 1. */
  let sira = 0;
  for (const g of (k.program || [])) {
    const ogunler = Array.isArray(g.meals)
      ? g.meals.filter(m => m && m !== '—').join(', ') : metin(g.meals);
    await c.query(
      `INSERT INTO tour_itinerary_days (content_id, day_no, position, title, body, meal, accommodation)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, sayi(g.day) || 1, sira++, metin(g.title), metin(g.text),
       ogunler, metin(g.overnight)]);
    say('tour_itinerary_days');
  }
  for (const g of (k.itinerary || [])) {
    await c.query(
      `INSERT INTO tour_itinerary_days (content_id, day_no, position, time_label, title, body)
       VALUES ($1,1,$2,$3,$4,$5)`,
      [id, sira++, metin(g.time), metin(g.title), metin(g.text)]);
    say('tour_itinerary_days');
  }
  if (k.program || k.itinerary) esle('tour.program[] / tour.itinerary[]', 'tour_itinerary_days');

  /* KALKIŞ ŞEHİRLERİ — fiyat boyutu. Şehir adı ana veriye çözülüyor;
     çözülemezse kayıt yine yazılıyor (label duruyor), yalnızca city_id boş
     kalıyor: fiyat bilgisini bir ad eşleşmesine feda etmek yanlış olur. */
  for (const [i, sehir] of (k.departureCities || []).entries()) {
    const { rows: cr } = await c.query('SELECT id FROM cities WHERE slug = $1',
      [metin(sehir.city) || slugla(sehir.label)]);
    await c.query(
      `INSERT INTO tour_departure_cities (content_id, code, city_id, label, fee, note, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, metin(sehir.id) || slugla(sehir.label), cr[0]?.id || null,
       metin(sehir.label), sayi(sehir.fee), metin(sehir.note), i]);
    say('tour_departure_cities');
    if (!cr[0]) rapor.uyarilar.push(
      `${k.slug}: kalkış şehri "${sehir.label}" ana veride yok; fark korundu, şehir bağı boş.`);
  }
  if (k.departureCities) esle('tour.departureCities[]', 'tour_departure_cities (fiyat farkı)');

  /* KONAKLAMA — anlatım. Tek fiyat boyutu (tek kişilik oda farkı) zaten
     tours.single_room_supplement içinde. */
  if (k.accommodation) {
    await c.query(
      `INSERT INTO content_blocks (content_id, kind, position, payload)
       VALUES ($1,'accommodation',0,$2::jsonb)`, [id, JSON.stringify(k.accommodation)]);
    say('content_blocks');
    esle('tour.accommodation', "content_blocks (kind='accommodation')");
  }

  kullanilan.add('nights').add('days').add('durationLabel').add('pricing')
    .add('program').add('itinerary').add('accommodation').add('departureCities');
}

async function otelDetay(c, id, k, medya, kullanilan) {
  const p = k.pricing || {};
  await c.query(
    `INSERT INTO hotels (content_id, stars, distance_label, check_in_time, check_out_time,
       min_nights, max_nights, max_rooms, max_guests, lead_days, tax_rate, unit_note, date_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, k.stars ? sayi(k.stars) : null, metin(k.distanceLabel),
     saat(p.checkInTime) || '14:00', saat(p.checkOutTime) || '12:00',
     sayi(p.minNights) || 1, sayi(p.maxNights) || 14, sayi(p.maxRooms) || 3,
     sayi(p.maxGuests) || 8, sayi(p.leadDays), sayi(p.taxRate),
     metin(p.unitNote), metin(p.dateNote)]);

  for (const [i, o] of (k.rooms || []).entries()) {
    await c.query(
      `INSERT INTO hotel_rooms (content_id, code, name, media_id, size_label, view_label,
         beds, max_guests, nightly, nightly_list, stock, features, note, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14)`,
      [id, metin(o.id) || slugla(o.name), metin(o.name), medya.get(o.key) || null,
       metin(o.size), metin(o.view), metin(o.beds), sayi(o.maxGuests) || 2,
       sayi(o.nightly), sayi(o.nightlyList), sayi(o.count),
       JSON.stringify(o.features || []), metin(o.note), i]);
    say('hotel_rooms');
  }
  const PANSIYON = { bb: 'bb', hb: 'hb', fb: 'fb', ai: 'ai', ro: 'ro' };
  for (const [i, b] of (k.boards || []).entries()) {
    await c.query(
      `INSERT INTO hotel_boards (content_id, code, board_type, label, adult_night, child_night, note, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, metin(b.id), PANSIYON[b.id] || 'bb', metin(b.label),
       sayi(b.adultNight), sayi(b.childNight), metin(b.note), i]);
    say('hotel_boards');
  }
  esle('hotel.rooms[]', 'hotel_rooms');
  esle('hotel.boards[]', 'hotel_boards');
  esle('hotel.pricing.*', 'hotels.*');
  kullanilan.add('rooms').add('boards').add('stars').add('distanceLabel').add('pricing');
}

async function aktiviteDetay(c, id, k, medya, kullanilan) {
  const p = k.pricing || {};
  const it = (k.cancellation && k.cancellation.weatherRefund != null)
    ? sayi(k.cancellation.weatherRefund) : 1;
  await c.query(
    `INSERT INTO activities (content_id, activity_label, duration_label, min_age,
       max_weight_kg, max_guests, children_per_adult, child_ages, lead_days,
       seats_per_session, weather_refund_rate, unit_note, operating_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, metin(k.activityLabel), metin(k.durationLabel),
     p.minAge != null ? sayi(p.minAge) : null, p.maxWeight != null ? sayi(p.maxWeight) : null,
     sayi(p.maxGuests) || 8, sayi(p.childrenPerAdult), metin(p.childAges),
     sayi(p.leadDays), sayi(p.seatsPerSession), Math.min(1, Math.max(0, it)),
     metin(p.unitNote), metin(p.operatingNote)]);

  for (const [i, pk] of (k.packages || []).entries()) {
    await c.query(
      `INSERT INTO activity_packages (content_id, code, name, media_id, group_label, duration,
         capacity, per_person, per_person_list, child_price, child_list_price,
         features, note, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14)`,
      [id, metin(pk.id), metin(pk.name), medya.get(pk.key) || null,
       metin(pk.groupLabel), metin(pk.duration), sayi(pk.capacity),
       sayi(pk.perPerson), sayi(pk.perPersonList), sayi(pk.child), sayi(pk.childList),
       JSON.stringify(pk.features || []), metin(pk.note), i]);
    say('activity_packages');
  }
  for (const [i, s] of (k.sessions || []).entries()) {
    await c.query(
      `INSERT INTO activity_sessions (content_id, code, label, start_time, fee, note, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, metin(s.id), metin(s.label), saat(s.time) || '00:00', sayi(s.fee), metin(s.note), i]);
    say('activity_sessions');
  }
  esle('activity.packages[]', 'activity_packages');
  esle('activity.sessions[]', 'activity_sessions');
  kullanilan.add('packages').add('sessions').add('activityLabel').add('durationLabel').add('pricing');
}

async function etkinlikDetay(c, id, k, medya, kullanilan) {
  const p = k.pricing || {};
  const tarihler = (k.performances || []).map(t => t.date).filter(Boolean).sort();
  await c.query(
    `INSERT INTO events (content_id, venue_name, duration_label, start_time, doors_time,
       doors_label, season_start, season_end, max_tickets, service_per_ticket,
       student_note, unit_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [id, metin(k.venueName), metin(k.durationLabel), saat(p.startTime), saat(p.doorsTime),
     metin(k.doorsLabel), tarihler[0] || null, tarihler[tarihler.length - 1] || null,
     sayi(p.maxTickets) || 6, sayi(p.servicePerTicket), metin(p.studentNote), metin(p.unitNote)]);

  for (const t of (k.performances || [])) {
    await c.query(
      `INSERT INTO event_performances (content_id, perf_date, perf_time, title, kind, detail)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, t.date, saat(t.time), metin(t.title), metin(t.kind), metin(t.detail)]);
    say('event_performances');
  }
  for (const [i, kat] of (k.categories || []).entries()) {
    /* student === 0 ve blokta öğrenci bileti yoksa student_available false.
       Eski veride bu ayrım YALNIZCA 0 fiyatla ifade ediliyordu; iki ayrı
       alana açmak "0 TL öğrenci bileti" ile "öğrenci bileti yok"u
       birbirinden ayırıyor. */
    await c.query(
      `INSERT INTO event_ticket_categories (content_id, code, name, block, media_id,
         price, price_list, student_price, student_available, seats, features, note, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13)`,
      [id, metin(kat.id), metin(kat.name), metin(kat.block), medya.get(kat.key) || null,
       sayi(kat.price), sayi(kat.priceList), sayi(kat.student), sayi(kat.student) > 0,
       sayi(kat.seats), JSON.stringify(kat.features || []), metin(kat.note), i]);
    say('event_ticket_categories');
  }
  esle('event.performances[]', 'event_performances');
  esle('event.categories[]', 'event_ticket_categories');
  kullanilan.add('performances').add('categories').add('venueName').add('doorsLabel')
    .add('durationLabel').add('pricing');
}

async function mekanDetay(c, id, k, medya, kullanilan) {
  const p = k.pricing || {};
  const randevu = k.booking === 'randevu';
  await c.query(
    `INSERT INTO venues (content_id, booking_model, kind_label, price_level, payment_mode,
       max_guests, lead_days, entry_fee, deposit_note, unit_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, randevu ? 'randevu' : 'masa', metin(k.kindLabel),
     ['₺','₺₺','₺₺₺','₺₺₺₺'].includes(metin(k.priceLevel)) ? metin(k.priceLevel) : '',
     randevu ? 'on_site' : 'deposit',
     sayi(p.maxGuests) || 8, sayi(p.leadDays), sayi(p.entryFee),
     metin(p.depositNote), metin(p.unitNote)]);

  for (const [i, a] of (k.areas || []).entries()) {
    await c.query(
      `INSERT INTO venue_areas (content_id, code, name, media_id, capacity, min_spend,
         deposit, unit_count, features, note, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`,
      [id, metin(a.id), metin(a.name), medya.get(a.key) || null, sayi(a.capacity) || 2,
       sayi(a.minSpend), sayi(a.deposit), sayi(a.count),
       JSON.stringify(a.features || []), metin(a.note), i]);
    say('venue_areas');
  }
  for (const [i, s] of (k.services || []).entries()) {
    const dk = parseInt(metin(s.duration), 10);
    await c.query(
      `INSERT INTO venue_services (content_id, code, name, media_id, duration_minutes,
         price, price_list, capacity, unit_count, features, note, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)`,
      [id, metin(s.id), metin(s.name), medya.get(s.key) || null,
       Number.isFinite(dk) && dk > 0 ? dk : 60,
       sayi(s.price), sayi(s.priceList), sayi(s.capacity) || 1, sayi(s.count),
       JSON.stringify(s.features || []), metin(s.note), i]);
    say('venue_services');
  }
  for (const h of (k.hours || [])) {
    await c.query(
      `INSERT INTO venue_hours (content_id, weekday, open_time, close_time, closed)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (content_id, weekday) DO NOTHING`,
      [id, sayi(h.day), saat(h.open), saat(h.close), !h.open || !h.close]);
    say('venue_hours');
  }
  for (const [tur, liste] of [['weekday', p.slots], ['weekend', p.weekendSlots]]) {
    for (const [i, s] of (liste || []).entries()) {
      if (!saat(s)) continue;
      await c.query(
        `INSERT INTO venue_slot_templates (content_id, day_kind, slot_time, position)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`, [id, tur, s, i]);
      say('venue_slot_templates');
    }
  }
  esle('venue.areas[]', 'venue_areas');
  esle('venue.services[]', 'venue_services');
  esle('venue.hours[]', 'venue_hours');
  esle('venue.pricing.slots[]', 'venue_slot_templates');
  kullanilan.add('areas').add('services').add('hours').add('booking').add('kind')
    .add('kindLabel').add('priceLevel').add('pricing');
}

const DETAY = { tour: turDetay, hotel: otelDetay, activity: aktiviteDetay,
                event: etkinlikDetay, venue: mekanDetay };

/* ---------------- tek kayıt ---------------- */
async function kayitAktar(c, tip, anahtar, k, medya, taks, yoneticiId) {
  /* Kaydın BÜTÜN üst seviye anahtarları. İşlenen her biri `kullanilan`a
     giriyor; sonunda eksik kalanlar rapora düşüyor. Göçün "hiçbir alanı
     sessizce kaybetme" sözü bu kümeyle ölçülüyor. */
  const tumAlanlar = new Set(Object.keys(k));
  const kullanilan = new Set(['slug', 'type', 'category', 'categoryShort',
    'categoryPlural', 'categoryAnchor']);
  /* category* ve region artık TÜRETİLMİŞ görüntü metni: kaynakları
     taxonomy ve tours.kind. Ön yüz testi (tests/veri-kapisi.test.js)
     ikisinin ayrışmadığını ölçüyor; burada ayrıca saklanmıyor. */
  esle('*.category/categoryShort/categoryPlural/categoryAnchor/region',
    'türetilmiş görüntü (taxonomy + tours.kind)');

  const { bolgeId, sehirId } = await bolgeSehirCoz(c, k);
  const kategoriId = anaKategoriId(tip, k, taks);
  const kart = k.card || {};

  /* Mevcut kayıt varsa güncelleniyor; alt kayıtlar silinip yeniden
     yazılıyor. Yarım kalmış bir göçü baştan almak mümkün olmalı. */
  const { rows } = await c.query(
    `INSERT INTO content (type, slug, status, title, tagline, category_id, area,
       region_id, city_id, product_code, card_media_id, card_title, card_meta,
       card_badges, currency, published_at, created_by, updated_by)
     VALUES ($1,$2,'published',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$15,COALESCE($16::timestamptz, now()),$14,$14)
     ON CONFLICT (type, slug) WHERE deleted_at IS NULL DO UPDATE
       SET title = EXCLUDED.title, tagline = EXCLUDED.tagline,
           category_id = EXCLUDED.category_id, area = EXCLUDED.area,
           region_id = EXCLUDED.region_id, city_id = EXCLUDED.city_id,
           product_code = EXCLUDED.product_code, card_media_id = EXCLUDED.card_media_id,
           card_title = EXCLUDED.card_title, card_meta = EXCLUDED.card_meta,
           card_badges = EXCLUDED.card_badges, currency = EXCLUDED.currency,
           published_at = EXCLUDED.published_at,
           updated_by = EXCLUDED.updated_by
     RETURNING id`,
    [tip, k.slug || anahtar, metin(k.title), metin(k.tagline), kategoriId,
     metin(k.area), bolgeId, sehirId, metin(k.code) || null,
     medya.get(kart.img) || null, metin(kart.title), metin(kart.meta1),
     JSON.stringify(kart.badges || []), yoneticiId, metin(k.currency) || 'TRY',
     metin(k.publishedAt) || null]);
  const id = rows[0].id;
  ['title', 'tagline', 'area', 'region', 'code', 'card', 'currency', 'publishedAt'].forEach(a => kullanilan.add(a));
  esle('*.currency', 'content.currency');
  esle('*.publishedAt', 'content.published_at');
  esle('*.title/tagline/area/region/code', 'content.*');
  esle('*.card.{img,title,meta1,badges}', 'content.card_*');

  for (const t of ['content_blocks', 'content_media', 'content_tags', 'content_faqs',
                   'content_locations', 'content_addons', 'reviews', 'content_relations',
                   'content_categories', 'content_themes', 'content_collections',
                   'content_facets']) {
    const sutun = t === 'content_relations' ? 'from_content_id' : 'content_id';
    await c.query(`DELETE FROM ${t} WHERE ${sutun} = $1`, [id]);
  }

  await bloklariYaz(c, id, k, kullanilan, tip);

  // --- sınıflandırma ---
  await siniflandirmaYaz(c, id, tip, k, taks);
  kullanilan.add('taxonomy');
  esle('*.taxonomy.categories[]', 'content_categories (+ content.category_id = ilki)');
  esle('*.taxonomy.themes[] / collections[]', 'content_themes / content_collections');
  esle('*.taxonomy.facets', 'content_facets');
  esle('*.taxonomy.city', 'content.city_id (+ region_id şehirden)');

  // --- galeri ---
  for (const [i, g] of (k.gallery || []).entries()) {
    const mid = medya.get(g.key);
    if (!mid) { rapor.aktarilmayan.push({ tur: tip, slug: k.slug, alan: `gallery[${i}].key`,
      sebep: `Görsel sözlüğünde yok: ${g.key}` }); continue; }
    await c.query(
      `INSERT INTO content_media (content_id, media_id, role, position, caption)
       VALUES ($1,$2,'gallery',$3,$4)`, [id, mid, i, metin(g.caption)]);
    say('content_media');
  }
  if (medya.get(kart.img)) {
    await c.query(
      `INSERT INTO content_media (content_id, media_id, role, position)
       VALUES ($1,$2,'cover',0) ON CONFLICT DO NOTHING`, [id, medya.get(kart.img)]);
  }
  kullanilan.add('gallery');
  esle('*.gallery[]', 'content_media (role=gallery)');

  // --- etiketler ---
  for (const [i, t] of (k.tags || []).entries()) {
    const ad = metin(t.label || t);
    if (!ad) continue;
    const { rows: tr } = await c.query(
      `INSERT INTO tags (slug, name, href) VALUES ($1,$2,$3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [slugla(ad), ad, metin(t.href)]);
    await c.query(
      `INSERT INTO content_tags (content_id, tag_id, position) VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING`, [id, tr[0].id, i]);
    say('content_tags');
  }
  kullanilan.add('tags');
  esle('*.tags[]', 'tags + content_tags');

  // --- SSS ---
  for (const [i, s] of (k.faq || []).entries()) {
    await c.query(
      `INSERT INTO content_faqs (content_id, position, question, answer)
       VALUES ($1,$2,$3,$4)`, [id, i, metin(s.q), metin(s.a)]);
    say('content_faqs');
  }
  kullanilan.add('faq');
  esle('*.faq[]', 'content_faqs');

  // --- yorumlar ---
  for (const y of (k.reviews || [])) {
    await c.query(
      `INSERT INTO reviews (content_id, author_name, rating, title, body, party_label,
         status, verified_booking, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'approved',false,$7)`,
      [id, metin(y.name), Math.min(5, Math.max(1, sayi(y.rating) || 5)),
       metin(y.title), metin(y.text), metin(y.party), y.date || new Date()]);
    say('reviews');
  }
  kullanilan.add('reviews');
  esle('*.reviews[]', 'reviews (status=approved)');

  /* ratingBreakdown: 1–5 yıldız dağılımı. Gerçek yorum satırı sayısı (8) ile
     dağılımın toplamı (örn. 214) uyuşmuyor — dağılım sitedeki "214
     değerlendirme" sayısını üretmek için yazılmış toplu bir sayı.
     Yorum satırı uydurmak yerine dağılım OLDUĞU GİBİ blok olarak saklanıyor
     ve puan hesabı ondan besleniyor; rapora da not düşülüyor. */
  if (k.ratingBreakdown) {
    await c.query(
      `INSERT INTO content_blocks (content_id, kind, position, payload)
       VALUES ($1,'social',1,$2::jsonb)`,
      [id, JSON.stringify({ ratingBreakdown: k.ratingBreakdown })]);
    esle('*.ratingBreakdown', "content_blocks (kind='social')");
  }
  kullanilan.add('ratingBreakdown');

  // --- ek hizmetler ---
  const PER = { stay: 'booking', booking: 'booking', night: 'night', guest: 'guest',
                person: 'guest', ticket: 'ticket', room: 'room' };
  for (const [i, e] of (k.addons || []).entries()) {
    await c.query(
      `INSERT INTO content_addons (content_id, code, label, description, price, per, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, metin(e.id), metin(e.label), metin(e.text), sayi(e.price),
       PER[metin(e.per)] || 'booking', i]);
    say('content_addons');
  }
  kullanilan.add('addons');
  esle('*.addons[]', 'content_addons');

  // --- konumlar ---
  for (const [alan, rol] of [['meeting','meeting'], ['location','main'], ['venue','venue']]) {
    if (k[alan]) await konumYaz(c, id, k[alan], rol, sehirId);
    kullanilan.add(alan);
  }
  esle('*.meeting/location/venue', 'locations + content_locations');

  // --- SEO ---
  /* Kaydın seo alanı sayfa kabuğundaki başlıkla birebir aynı (ön yüz
     testi ölçüyor). Açıklamadaki {fiyat} yer tutucusu SAYFA ÜRETİLİRKEN
     güncel başlangıç fiyatıyla dolduruluyor; fiyat metne gömülseydi fiyat
     değişince açıklama eskirdi. Paylaşım görseli seo.ogImage anahtarından,
     yoksa galerinin ilk görselinden. */
  const seo = k.seo || {};
  const paylasimGorseli = medya.get(seo.ogImage || (k.gallery && k.gallery[0] && k.gallery[0].key))
    || medya.get(kart.img) || null;
  await c.query(
    `INSERT INTO content_seo (content_id, seo_title, meta_description, canonical_url, og_title,
       og_description, og_media_id, schema_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'')
     ON CONFLICT (content_id) DO UPDATE SET seo_title = EXCLUDED.seo_title,
       meta_description = EXCLUDED.meta_description, canonical_url = EXCLUDED.canonical_url,
       og_title = EXCLUDED.og_title, og_description = EXCLUDED.og_description,
       og_media_id = EXCLUDED.og_media_id`,
    [id, metin(seo.title) || metin(k.title), metin(seo.description) || metin(k.tagline),
     `https://bedirinci.github.io/mola360/${TIP_DIZIN[tip]}/${k.slug}/`,
     metin(seo.ogTitle) || metin(seo.title) || metin(k.title),
     metin(seo.ogDescription) || metin(seo.description) || metin(k.tagline),
     paylasimGorseli]);
  kullanilan.add('seo');
  esle('*.seo.{title,description,ogTitle,ogDescription,ogImage}', 'content_seo');

  // --- türe özgü ---
  await c.query(`DELETE FROM ${TIP_TABLO[tip]} WHERE content_id = $1`, [id]);
  for (const t of TIP_ALT_TABLOLAR[tip]) await c.query(`DELETE FROM ${t} WHERE content_id = $1`, [id]);
  await DETAY[tip](c, id, k, medya, kullanilan);

  /* Aktarılmayan alanlar. */
  for (const alan of tumAlanlar) {
    if (kullanilan.has(alan)) continue;
    if (alan === 'similar') continue;   // aşağıda ayrıca işleniyor
    rapor.aktarilmayan.push({ tur: tip, slug: k.slug, alan, sebep: 'Eşleşen hedef yok' });
  }
  return id;
}

const TIP_DIZIN = { tour: 'tur', hotel: 'otel', activity: 'aktivite',
                    event: 'etkinlik', venue: 'mekan' };
const TIP_TABLO = { tour: 'tours', hotel: 'hotels', activity: 'activities',
                    event: 'events', venue: 'venues' };
const TIP_ALT_TABLOLAR = {
  /* DİKKAT: türe ait YENİ bir tablo eklendiğinde buraya da eklenmeli.
     Aksi hâlde göç ikinci kez çalıştığında o tablo temizlenmez ve tekil
     kısıt hatası verir — tests/migration.test.js'teki "ikinci kez
     çalıştırmak kayıtları ikiye katlamıyor" testi bunu yakalıyor. */
  tour: ['tour_itinerary_days', 'tour_departures', 'tour_departure_cities'],
  hotel: ['hotel_rooms', 'hotel_boards'],
  activity: ['activity_packages', 'activity_sessions'],
  event: ['event_performances', 'event_ticket_categories'],
  venue: ['venue_areas', 'venue_services', 'venue_hours', 'venue_slot_templates'],
};

/* ---------------- ilişkiler ----------------
   İkinci geçişte çalışıyor: "benzer içerikler" başka bir kayda işaret
   ediyor ve o kaydın ilk geçişte var olması gerekiyor.

   Eski veride ilişki SLUG ve BAŞLIK kopyalanarak tutuluyordu; başlık
   değişince kopya eskiyordu. Artık ID ile. Gerçek bir kayda çözülemeyen
   kartlar (içerik sayfası olmayan örnekler) KAYBEDİLMİYOR, blok olarak
   saklanıyor. */
async function iliskileriKur(c, kayitlar) {
  for (const { tip, id, k } of kayitlar) {
    let cozulen = 0, cozulemeyen = 0;
    for (const [i, b] of (k.similar || []).entries()) {
      let hedef = null;
      if (b.slug) {
        const { rows } = await c.query(
          'SELECT id FROM content WHERE slug = $1 AND deleted_at IS NULL LIMIT 1', [b.slug]);
        hedef = rows[0]?.id || null;
      }
      if (!hedef && b.href) {
        const s = String(b.href).replace(/\/+$/, '').split('/').pop();
        const { rows } = await c.query(
          'SELECT id FROM content WHERE slug = $1 AND deleted_at IS NULL LIMIT 1', [s]);
        hedef = rows[0]?.id || null;
      }
      if (hedef && hedef !== id) {
        await c.query(
          `INSERT INTO content_relations (from_content_id, to_content_id, relation_type, position)
           VALUES ($1,$2,'similar',$3) ON CONFLICT DO NOTHING`, [id, hedef, i]);
        cozulen++; say('content_relations');
      } else {
        await c.query(
          `INSERT INTO content_blocks (content_id, kind, position, payload)
           VALUES ($1,'similar_unresolved',$2,$3::jsonb)`, [id, i, JSON.stringify(b)]);
        cozulemeyen++; say('similar_unresolved');
      }
    }
    if (cozulemeyen) {
      rapor.uyarilar.push(
        `${k.slug}: ${cozulen} benzer kayıt ilişkiye çevrildi, ${cozulemeyen} tanesi ` +
        'gerçek bir içeriğe işaret etmediği için blok olarak saklandı.');
    }
  }
  esle('*.similar[]', 'content_relations (çözülen) + content_blocks similar_unresolved');
}

/* ---------------- çalıştır ---------------- */
async function calistir() {
  const { rows: yonetici } = await sorgu(
    `SELECT u.id FROM admin_users u JOIN admin_user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id WHERE r.key = 'SUPER_ADMIN' LIMIT 1`);
  const yoneticiId = yonetici[0]?.id || null;
  if (!yoneticiId) throw new Error('Süper yönetici yok. Önce `npm run seed` çalıştırın.');

  const kumeler = [
    ['tour', TUR_VERI.TOURS], ['hotel', OTEL_VERI.HOTELS],
    ['activity', AKTIVITE_VERI.ACTIVITIES], ['event', ETKINLIK_VERI.EVENTS],
    ['venue', MEKAN_VERI.PLACES],
  ];

  await transaction(async (c) => {
    const medya = await medyaAktar(c);
    const taks = await taksonomiAktar(c, medya);
    const aktarilan = [];
    for (const [tip, kume] of kumeler) {
      for (const [anahtar, k] of Object.entries(kume || {})) {
        const id = await kayitAktar(c, tip, anahtar, k, medya, taks, yoneticiId);
        aktarilan.push({ tip, id, k });
        say('content');
      }
    }
    await iliskileriKur(c, aktarilan);
  });
}

function raporYaz() {
  const satir = (s) => console.log(s);
  satir('\n============ GÖÇ RAPORU ============\n');

  satir('YAZILAN KAYITLAR');
  for (const [ad, n] of Object.entries(rapor.sayac).sort()) satir(`  ${ad.padEnd(26)} ${n}`);

  satir('\nALAN EŞLEMESİ  (kaynak → hedef)');
  for (const [kaynak, hedef] of [...rapor.esleme].sort()) {
    satir(`  ${kaynak.padEnd(34)} → ${hedef}`);
  }

  satir(`\nAKTARILMAYAN ALANLAR (${rapor.aktarilmayan.length})`);
  if (!rapor.aktarilmayan.length) satir('  yok — kaydın her alanı bir hedefe yazıldı.');
  for (const a of rapor.aktarilmayan) satir(`  ${a.tur}/${a.slug} · ${a.alan} — ${a.sebep}`);

  satir(`\nUYARILAR (${rapor.uyarilar.length})`);
  if (!rapor.uyarilar.length) satir('  yok');
  for (const u of rapor.uyarilar) satir(`  - ${u}`);
  satir('\n====================================\n');
}

try {
  await calistir();
  raporYaz();
  await kapat();
} catch (e) {
  console.error('\nGöç BAŞARISIZ:', e.message);
  console.error(e.stack);
  await kapat();
  process.exit(1);
}
