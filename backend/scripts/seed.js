#!/usr/bin/env node
/* Roller, izinler, ana veri ve ilk yönetici hesabı.

   YENİDEN ÇALIŞTIRILABİLİR (idempotent): var olanı günceller, yoksa ekler.
   Bir kez çalışan seed'in ikinci çalıştırmada hata vermesi, göç akışını
   kırılgan yapar.

   İLK YÖNETİCİ ŞİFRESİ KODA YAZILMIYOR. ADMIN_PASSWORD ortam değişkeni
   verilmemişse rastgele üretilip EKRANA basılıyor; kimse varsayılan bir
   şifreyle üretime çıkamasın diye. */
import { randomBytes } from 'node:crypto';
import { pool, transaction, kapat } from '../src/db/pool.js';
import { IZINLER, ROLLER } from '../src/services/rbac.js';
import { sifreOzetle } from '../src/lib/password.js';

const BOLGELER = [
  ['marmara', 'Marmara'], ['ege', 'Ege'], ['akdeniz', 'Akdeniz'],
  ['ic-anadolu', 'İç Anadolu'], ['karadeniz', 'Karadeniz'],
  ['dogu-anadolu', 'Doğu Anadolu'], ['guneydogu-anadolu', 'Güneydoğu Anadolu'],
];

/* İçerikte geçen şehirler. Tam il listesi değil; içerik eklendikçe
   panelden büyüyor. Bölge eşlemesi doğru olsun diye elle yazıldı. */
const SEHIRLER = [
  ['istanbul', 'İstanbul', 'marmara', 34], ['izmir', 'İzmir', 'ege', 35],
  ['ankara', 'Ankara', 'ic-anadolu', 6], ['antalya', 'Antalya', 'akdeniz', 7],
  ['nevsehir', 'Nevşehir', 'ic-anadolu', 50], ['mugla', 'Muğla', 'ege', 48],
  ['bursa', 'Bursa', 'marmara', 16], ['yalova', 'Yalova', 'marmara', 77],
  ['denizli', 'Denizli', 'ege', 20], ['kayseri', 'Kayseri', 'ic-anadolu', 38],
  ['rize', 'Rize', 'karadeniz', 53], ['balikesir', 'Balıkesir', 'marmara', 10],
  ['canakkale', 'Çanakkale', 'marmara', 17], ['sakarya', 'Sakarya', 'marmara', 54],
  ['bolu', 'Bolu', 'karadeniz', 14], ['kocaeli', 'Kocaeli', 'marmara', 41],
];

const AYARLAR = [
  ['site.name', 'general', '"mola360"', 'Site adı'],
  ['site.url', 'general', '"https://bedirinci.github.io/mola360"', 'Site adresi'],
  ['site.currency', 'general', '"TRY"', 'Para birimi'],
  ['site.timezone', 'general', '"Europe/Istanbul"', 'Saat dilimi'],
  ['site.locale', 'general', '"tr-TR"', 'Dil'],
  ['contact.phone', 'contact', '"+908502420360"', 'Destek telefonu'],
  ['contact.whatsapp', 'contact', '"+905321112233"', 'WhatsApp'],
  ['contact.email', 'contact', '"destek@mola360.com"', 'E-posta'],
  ['booking.hold_minutes', 'booking', '10', 'Koltuk tutma süresi (dakika)'],
  ['booking.default_tax_rate', 'booking', '0.02', 'Varsayılan konaklama vergisi'],
  ['booking.code_prefix', 'booking', '"MLA"', 'Rezervasyon kodu ön eki'],
  ['seo.title_template', 'seo', '"{title} | mola360"', 'Başlık şablonu'],
  ['seo.default_robots', 'seo', '"index, follow"', 'Varsayılan robots'],
];

async function calistir() {
  const uretilenSifre = !process.env.ADMIN_PASSWORD;
  const sifre = process.env.ADMIN_PASSWORD || randomBytes(12).toString('base64url');
  const eposta = process.env.ADMIN_EMAIL || 'admin@mola360.local';
  const adSoyad = process.env.ADMIN_NAME || 'Sistem Yöneticisi';

  const ozet = await sifreOzetle(sifre);

  const rapor = await transaction(async (c) => {
    // --- izinler ---
    for (const [key, group_key, description] of IZINLER) {
      await c.query(
        `INSERT INTO permissions (key, group_key, description) VALUES ($1,$2,$3)
         ON CONFLICT (key) DO UPDATE SET group_key = EXCLUDED.group_key,
                                          description = EXCLUDED.description`,
        [key, group_key, description]);
    }

    // --- roller ---
    for (const rol of ROLLER) {
      const { rows } = await c.query(
        `INSERT INTO roles (key, name, description, is_system) VALUES ($1,$2,$3,true)
         ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name,
                                          description = EXCLUDED.description
         RETURNING id`,
        [rol.key, rol.name, rol.description]);
      const rolId = rows[0].id;

      /* İzinler her çalıştırmada YENİDEN kuruluyor: rol tanımından bir izin
         kaldırıldığında veritabanında kalmaya devam etmesin. Rol tanımı tek
         kaynak (src/services/rbac.js). */
      await c.query('DELETE FROM role_permissions WHERE role_id = $1', [rolId]);
      if (rol.permissions.includes('*')) continue;   // SUPER_ADMIN: sorgu ile çözülüyor
      await c.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT $1, id FROM permissions WHERE key = ANY($2::text[])`,
        [rolId, rol.permissions]);
    }

    // --- bölge ve şehir ---
    for (const [slug, name] of BOLGELER) {
      await c.query(
        `INSERT INTO regions (slug, name) VALUES ($1,$2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`, [slug, name]);
    }
    for (const [slug, name, bolge, plaka] of SEHIRLER) {
      await c.query(
        `INSERT INTO cities (slug, name, region_id, plate_code)
         VALUES ($1, $2, (SELECT id FROM regions WHERE slug = $3), $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name,
                                           region_id = EXCLUDED.region_id`,
        [slug, name, bolge, plaka]);
    }

    // --- ayarlar ---
    for (const [key, group_key, value, label] of AYARLAR) {
      await c.query(
        `INSERT INTO settings (key, group_key, value, label) VALUES ($1,$2,$3::jsonb,$4)
         ON CONFLICT (key) DO NOTHING`, [key, group_key, value, label]);
    }

    // --- ilk yönetici ---
    const { rows: mevcut } = await c.query(
      'SELECT id FROM admin_users WHERE lower(email) = lower($1)', [eposta]);

    let kullaniciId;
    let yeniHesap = false;
    if (mevcut[0]) {
      kullaniciId = mevcut[0].id;
    } else {
      const { rows } = await c.query(
        `INSERT INTO admin_users (email, password_hash, full_name) VALUES ($1,$2,$3)
         RETURNING id`, [eposta, ozet, adSoyad]);
      kullaniciId = rows[0].id;
      yeniHesap = true;
    }
    await c.query(
      `INSERT INTO admin_user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE key = 'SUPER_ADMIN'
       ON CONFLICT DO NOTHING`, [kullaniciId]);

    return { kullaniciId, yeniHesap };
  });

  const say = async (t) => (await pool.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n;
  console.log([
    'Seed tamamlandı.',
    `  izinler : ${await say('permissions')}`,
    `  roller  : ${await say('roles')}`,
    `  bölgeler: ${await say('regions')}`,
    `  şehirler: ${await say('cities')}`,
    `  ayarlar : ${await say('settings')}`,
  ].join('\n'));

  if (rapor.yeniHesap) {
    console.log(`\nYönetici hesabı oluşturuldu:\n  e-posta: ${eposta}`);
    if (uretilenSifre) {
      console.log(`  şifre  : ${sifre}\n\n  ^ Bu şifre BİR KEZ gösteriliyor. Kaydedin.`);
    } else {
      console.log('  şifre  : ADMIN_PASSWORD ile verildi.');
    }
  } else {
    console.log(`\nYönetici hesabı zaten vardı (${eposta}); şifre değiştirilmedi.`);
  }
}

try {
  await calistir();
  await kapat();
} catch (e) {
  console.error('Seed başarısız:', e.message);
  await kapat();
  process.exit(1);
}
