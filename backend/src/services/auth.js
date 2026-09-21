/* Kimlik doğrulama — SUNUCU TARAFINDA.

   Panelin eski sürümünde şifre tarayıcıda karşılaştırılıyordu; o bir kilit
   değil, kapıya asılmış bir tabelaydı. Buradaki akış:

     1. Şifre scrypt ile doğrulanır (src/lib/password.js)
     2. Rastgele 32 baytlık oturum jetonu üretilir
     3. Jetonun KENDİSİ değil, SHA-256 ÖZETİ veritabanına yazılır
     4. Jeton httpOnly + SameSite=Strict çerezle döner

   JETON NEDEN localStorage'A KONMUYOR: oraya konan bir jeton, sayfadaki
   herhangi bir XSS açığıyla okunabilir. httpOnly çerez JavaScript'e
   görünmez.

   ÖZET NEDEN: veritabanı yedeği sızsa bile oturumlar taklit edilemez —
   özetten jeton geri üretilemez.

   KABA KUVVET: her deneme login_attempts'e yazılıyor; ardışık başarısız
   deneme sayısı eşiği aşınca hesap süreli kilitleniyor. Kilit HESAP bazlı;
   IP bazlı sınır ayrıca middleware'de (rate limit) var. İkisi farklı
   saldırıyı karşılıyor: biri tek hesaba çok deneme, diğeri çok hesaba
   tek deneme. */
import { randomBytes, createHash } from 'node:crypto';
import { config } from '../config/index.js';
import { sorgu, transaction } from '../db/pool.js';
import { sifreDogrula, sifreOzetle, yenidenOzetleGerekli } from '../lib/password.js';
import { hata } from '../lib/errors.js';
import { izinKumesi } from './rbac.js';
import { log } from '../lib/logger.js';

export const COOKIE_ADI = 'mola360_admin';

const jetonOzeti = (jeton) => createHash('sha256').update(jeton).digest('hex');

async function denemeYaz({ email, ip, userAgent, success, reason }) {
  await sorgu(
    `INSERT INTO login_attempts (email, ip, user_agent, success, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [String(email || '').slice(0, 320), ip || null, String(userAgent || '').slice(0, 500),
     success, reason || null]);
}

/* Kullanıcıyı e-posta ile bulur. Büyük/küçük harf duyarsız; silinmiş hesap
   dönmez. */
async function kullaniciBul(email) {
  const { rows } = await sorgu(
    `SELECT id, email, password_hash, full_name, status, failed_attempts, locked_until
       FROM admin_users
      WHERE lower(email) = lower($1) AND deleted_at IS NULL`, [email]);
  return rows[0] || null;
}

export async function girisYap({ email, password, ip, userAgent }) {
  const kullanici = await kullaniciBul(email);

  /* Hesap yoksa da şifre doğrulama maliyetine yakın bir gecikme oluşsun diye
     sahte bir özet doğrulanıyor. Aksi hâlde yanıt SÜRESİ, e-postanın kayıtlı
     olup olmadığını sızdırır (kullanıcı numaralandırma). */
  if (!kullanici) {
    await sifreDogrula(password, 'scrypt$65536$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA');
    await denemeYaz({ email, ip, userAgent, success: false, reason: 'no_user' });
    throw hata.kimlikYok('E-posta veya şifre hatalı.');
  }

  if (kullanici.status !== 'active') {
    await denemeYaz({ email, ip, userAgent, success: false, reason: 'inactive' });
    throw hata.yetkiYok('Hesap etkin değil.');
  }

  if (kullanici.locked_until && new Date(kullanici.locked_until) > new Date()) {
    await denemeYaz({ email, ip, userAgent, success: false, reason: 'locked' });
    const kalan = Math.ceil((new Date(kullanici.locked_until) - new Date()) / 60000);
    throw hata.kilitli(`Çok fazla hatalı deneme. ${kalan} dakika sonra tekrar deneyin.`);
  }

  const dogru = await sifreDogrula(password, kullanici.password_hash);
  if (!dogru) {
    const yeniSayac = kullanici.failed_attempts + 1;
    const kilitle = yeniSayac >= config.LOGIN_MAX_ATTEMPTS;
    await sorgu(
      `UPDATE admin_users
          SET failed_attempts = $2,
              locked_until = CASE WHEN $3 THEN now() + ($4 || ' minutes')::interval ELSE locked_until END
        WHERE id = $1`,
      [kullanici.id, kilitle ? 0 : yeniSayac, kilitle, String(config.LOGIN_LOCK_MINUTES)]);
    await denemeYaz({ email, ip, userAgent, success: false, reason: 'bad_password' });
    if (kilitle) {
      log.warn('Hesap kilitlendi', { email: kullanici.email, ip });
      throw hata.kilitli(
        `Çok fazla hatalı deneme. Hesap ${config.LOGIN_LOCK_MINUTES} dakika kilitlendi.`);
    }
    throw hata.kimlikYok('E-posta veya şifre hatalı.');
  }

  /* Şifre doğru: sayaç sıfırlanır, oturum açılır. */
  const jeton = randomBytes(32).toString('base64url');
  const oturum = await transaction(async (c) => {
    await c.query(
      `UPDATE admin_users
          SET failed_attempts = 0, locked_until = NULL, last_login_at = now()
        WHERE id = $1`, [kullanici.id]);

    /* Maliyet parametreleri yükseltildiyse şifre sessizce yeniden özetlenir. */
    if (yenidenOzetleGerekli(kullanici.password_hash)) {
      const yeni = await sifreOzetle(password);
      await c.query('UPDATE admin_users SET password_hash = $2 WHERE id = $1',
        [kullanici.id, yeni]);
    }

    const { rows } = await c.query(
      `INSERT INTO admin_sessions (user_id, token_hash, ip, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, now() + ($5 || ' hours')::interval)
       RETURNING id, expires_at`,
      [kullanici.id, jetonOzeti(jeton), ip || null,
       String(userAgent || '').slice(0, 500), String(config.SESSION_TTL_HOURS)]);
    return rows[0];
  });

  await denemeYaz({ email, ip, userAgent, success: true });
  log.info('Giriş başarılı', { userId: kullanici.id, ip });

  return { jeton, oturum, kullanici: await profilGetir(kullanici.id) };
}

/* Oturumu jetondan çözer. Süresi dolmuş veya iptal edilmiş oturum NULL döner.

   last_seen_at her istekte değil, en az bir dakikada bir güncelleniyor:
   her istekte UPDATE atmak, okuma ağırlıklı bir panelde gereksiz yazma
   yüküdür. */
export async function oturumCoz(jeton) {
  if (!jeton || typeof jeton !== 'string') return null;
  const { rows } = await sorgu(
    `SELECT s.id AS session_id, s.expires_at, s.last_seen_at,
            u.id, u.email, u.full_name, u.status
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.deleted_at IS NULL
        AND u.status = 'active'`,
    [jetonOzeti(jeton)]);

  const satir = rows[0];
  if (!satir) return null;

  if (Date.now() - new Date(satir.last_seen_at).getTime() > 60_000) {
    sorgu('UPDATE admin_sessions SET last_seen_at = now() WHERE id = $1', [satir.session_id])
      .catch(e => log.warn('last_seen_at güncellenemedi', { err: e.message }));
  }

  const izinler = await izinleriGetir(satir.id);
  return {
    sessionId: satir.session_id,
    id: satir.id,
    email: satir.email,
    fullName: satir.full_name,
    permissions: izinler,
  };
}

export async function izinleriGetir(userId) {
  const { rows } = await sorgu(
    `SELECT DISTINCT p.key AS permission_key
       FROM admin_user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = $1
      UNION
     SELECT '*' FROM admin_user_roles ur2
       JOIN roles r ON r.id = ur2.role_id
      WHERE ur2.user_id = $1 AND r.key = 'SUPER_ADMIN'`,
    [userId]);
  return izinKumesi(rows);
}

export async function profilGetir(userId) {
  const { rows } = await sorgu(
    `SELECT u.id, u.email, u.full_name, u.status, u.last_login_at,
            coalesce(array_agg(r.key) FILTER (WHERE r.key IS NOT NULL), '{}') AS roles
       FROM admin_users u
       LEFT JOIN admin_user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id`, [userId]);
  if (!rows[0]) return null;
  const izinler = await izinleriGetir(userId);
  return { ...rows[0], permissions: [...izinler].sort() };
}

export async function cikisYap(sessionId) {
  await sorgu('UPDATE admin_sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL',
    [sessionId]);
}

/* Bir kullanıcının BÜTÜN oturumlarını sonlandırır. Şifre değiştiğinde ve
   süper yöneticinin "oturumları kapat" işleminde kullanılıyor: şifre
   değiştiği hâlde eski oturumun açık kalması, çalınmış bir oturumun
   şifre değişikliğinden sonra da yaşaması demek. */
export async function tumOturumlariKapat(userId, revokedBy = null) {
  const { rowCount } = await sorgu(
    `UPDATE admin_sessions SET revoked_at = now(), revoked_by = $2
      WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [userId, revokedBy]);
  return rowCount;
}

export function cerezSecenekleri() {
  return {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: 'strict',
    path: '/',
    maxAge: config.SESSION_TTL_HOURS * 3600 * 1000,
  };
}
