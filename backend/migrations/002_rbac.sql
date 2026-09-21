-- ============================================================================
-- 002 — Yönetici hesapları, roller, izinler, oturumlar
--
-- MÜŞTERİ ve YÖNETİCİ AYRI TABLODA. Tek bir `users` tablosunda tutmak,
-- panele giriş yetkisini bir `is_admin` sütununa indirger; o sütunu yanlışlıkla
-- true yapan tek bir UPDATE bütün siteyi açar. İki tablo, iki oturum kümesi,
-- iki ayrı kimlik doğrulama yolu — yetki yükseltme kazası mümkün değil.
--
-- ŞİFRE: düz metin saklanmıyor. scrypt (node:crypto) ile tuzlanıp özetleniyor;
-- format ve parametreler src/lib/password.js içinde.
--
-- OTURUM: token'ın KENDİSİ saklanmıyor, SHA-256 özeti saklanıyor. Veritabanı
-- sızsa bile oturum çerezleri taklit edilemez.
-- ============================================================================

CREATE TABLE admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  password_hash text NOT NULL,
  full_name     text NOT NULL,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'suspended', 'invited')),
  last_login_at timestamptz,
  -- Kaba kuvvet koruması: başarısız deneme sayacı ve kilit bitiş anı.
  -- Sayaç başarılı girişte sıfırlanır (src/services/auth.js).
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until  timestamptz,
  two_factor_secret text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
-- E-posta büyük/küçük harfe duyarsız tekil. citext eklentisi yerine ifade
-- indeksi: eklenti kurulumuna bağımlılık yaratmıyor.
CREATE UNIQUE INDEX admin_users_email_key ON admin_users (lower(email)) WHERE deleted_at IS NULL;
CREATE TRIGGER admin_users_updated BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE roles (
  id          serial PRIMARY KEY,
  key         text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  -- Sistem rolleri panelden silinemez; silinirse yetkilendirme çöker.
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id          serial PRIMARY KEY,
  key         text NOT NULL UNIQUE,     -- content.publish, booking.refund ...
  group_key   text NOT NULL,            -- content, booking, user ...
  description text NOT NULL DEFAULT ''
);

CREATE TABLE role_permissions (
  role_id       int NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id int NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE admin_user_roles (
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role_id int  NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE admin_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,
  ip            inet,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  -- İptal edilen oturum silinmiyor: "kim ne zaman çıkış yaptı / oturumu
  -- kim sonlandırdı" denetim için gerekli bilgi.
  revoked_at    timestamptz,
  revoked_by    uuid REFERENCES admin_users(id) ON DELETE SET NULL
);
CREATE INDEX admin_sessions_user_idx ON admin_sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX admin_sessions_expiry_idx ON admin_sessions (expires_at) WHERE revoked_at IS NULL;

-- Her giriş denemesi — başarılı da başarısız da — kayda geçer.
-- Hız sınırı ve kaba kuvvet koruması bu tablodan besleniyor.
CREATE TABLE login_attempts (
  id         bigserial PRIMARY KEY,
  email      text NOT NULL,
  ip         inet,
  user_agent text,
  success    boolean NOT NULL,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_email_idx ON login_attempts (lower(email), created_at DESC);
CREATE INDEX login_attempts_ip_idx ON login_attempts (ip, created_at DESC);
