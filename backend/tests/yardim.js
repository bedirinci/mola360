/* Test yardımcıları: şemayı kurar, temizler, yönetici üretir. */
import { pool, sorgu, transaction } from '../src/db/pool.js';
import { sifreOzetle } from '../src/lib/password.js';
import { yukari } from '../src/db/migrate.js';
import { IZINLER, ROLLER } from '../src/services/rbac.js';

export async function semayiKur() {
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  await yukari();
  await rolleriKur();
}

export async function rolleriKur() {
  await transaction(async (c) => {
    for (const [key, group_key, description] of IZINLER) {
      await c.query(
        `INSERT INTO permissions (key, group_key, description) VALUES ($1,$2,$3)
         ON CONFLICT (key) DO NOTHING`, [key, group_key, description]);
    }
    for (const rol of ROLLER) {
      const { rows } = await c.query(
        `INSERT INTO roles (key, name, description, is_system) VALUES ($1,$2,$3,true)
         ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [rol.key, rol.name, rol.description]);
      await c.query('DELETE FROM role_permissions WHERE role_id = $1', [rows[0].id]);
      if (rol.permissions.includes('*')) continue;
      await c.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT $1, id FROM permissions WHERE key = ANY($2::text[])`,
        [rows[0].id, rol.permissions]);
    }
  });
}

/* Her testin kendi temiz sayfası. Roller ve izinler KORUNUYOR (sabit
   veri), kullanıcı ve içerik siliniyor. */
export async function temizle() {
  await sorgu(`TRUNCATE admin_users, admin_sessions, login_attempts, content,
                        customers, media, audit_logs, categories, regions, cities,
                        tags, locations, bookings, inventory, themes, collections,
                        listing_pages CASCADE`);
}

export async function yoneticiOlustur({ email, sifre = 'CokGucluSifre123', rol = 'ADMIN' } = {}) {
  const eposta = email || `t${Date.now()}${Math.random().toString(36).slice(2, 7)}@mola360.test`;
  const { rows } = await sorgu(
    `INSERT INTO admin_users (email, password_hash, full_name) VALUES ($1,$2,$3) RETURNING id`,
    [eposta, await sifreOzetle(sifre), 'Test Yönetici']);
  await sorgu(
    `INSERT INTO admin_user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE key = $2`,
    [rows[0].id, rol]);
  return { id: rows[0].id, email: eposta, sifre, rol };
}

/* supertest agent'ından çerezi alıp sonraki isteklere taşıyor. */
export function cerezAl(yanit) {
  const basliklar = yanit.headers['set-cookie'] || [];
  return basliklar.map(c => c.split(';')[0]).join('; ');
}
