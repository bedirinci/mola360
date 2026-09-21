-- ============================================================================
-- 015 — Anasayfa, ayarlar, denetim, işler, bildirim, mesaj
--
-- ANASAYFA BLOKLARI: bugün app.js içindeki cardSections dizisi elle yazılmış.
-- Bu tablo onu veriye taşıyor; her blok manuel (elle seçilmiş kayıtlar) veya
-- otomatik (filtreye uyan kayıtlar) çalışabiliyor.
--
-- AUDIT LOG: kritik her işlemin öncesi ve sonrası. "Kim ne zaman fiyatı
-- değiştirdi" sorusunun cevabı; ödeme ve kontenjan işleyen bir sistemde bu
-- sorunun cevapsız kalması kabul edilemez.
--
-- JOBS: zamanlanmış işler (süresi dolan hold'u serbest bırak, planlanmış
-- içeriği yayına al, süresi biten kampanyayı kapat). Veritabanı tabanlı
-- kuyruk — ayrı bir altyapı gerektirmiyor, tek sunucuda çalışıyor.
-- ============================================================================

CREATE TABLE homepage_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_key   text NOT NULL UNIQUE,
  title       text NOT NULL,
  subtitle    text NOT NULL DEFAULT '',
  -- Sitedeki şeridin çapası (#oteller). catalog.js bununla eşleşiyor.
  anchor      text NOT NULL DEFAULT '',
  mode        text NOT NULL DEFAULT 'auto' CHECK (mode IN ('manual','auto','mixed')),
  max_items   int NOT NULL DEFAULT 12 CHECK (max_items > 0),
  position    int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  -- {types:[], regions:[], featured:true, sort:'price_asc'} gibi.
  filters     jsonb NOT NULL DEFAULT '{}'::jsonb,
  starts_at   timestamptz,
  ends_at     timestamptz,
  updated_by  uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER homepage_blocks_updated BEFORE UPDATE ON homepage_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE homepage_block_items (
  block_id   uuid NOT NULL REFERENCES homepage_blocks(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  position   int NOT NULL DEFAULT 0,
  PRIMARY KEY (block_id, content_id)
);

CREATE TABLE settings (
  key        text PRIMARY KEY,
  group_key  text NOT NULL DEFAULT 'general',
  value      jsonb NOT NULL,
  label      text NOT NULL DEFAULT '',
  -- Gizli ayarlar (SMTP şifresi, API anahtarı) API yanıtında maskelenir.
  is_secret  boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER settings_updated BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE audit_logs (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  -- Hesap silinse bile kimin yaptığı kaybolmasın diye e-posta kopyalanıyor.
  actor_email text NOT NULL DEFAULT '',
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   text,
  before_data jsonb,
  after_data  jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx  ON audit_logs (actor_id, created_at DESC);
CREATE INDEX audit_logs_action_idx ON audit_logs (action, created_at DESC);

CREATE TABLE jobs (
  id          bigserial PRIMARY KEY,
  kind        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  run_at      timestamptz NOT NULL DEFAULT now(),
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','running','succeeded','failed','cancelled')),
  attempts    int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  last_error  text,
  locked_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX jobs_queue_idx ON jobs (status, run_at) WHERE status = 'pending';

CREATE TABLE admin_notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text NOT NULL,
  severity   text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','error')),
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  link       text NOT NULL DEFAULT '',
  -- NULL = bütün yöneticilere.
  user_id    uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_notifications_idx ON admin_notifications (user_id, read_at, created_at DESC);

-- Şablonlar SÜRÜMLÜ: gönderilmiş bir mesajın hangi metinle gittiği
-- sonradan şablon değişince kaybolmasın.
CREATE TABLE message_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL,
  channel    text NOT NULL CHECK (channel IN ('email','sms','whatsapp','push')),
  version    int NOT NULL DEFAULT 1,
  subject    text NOT NULL DEFAULT '',
  body       text NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_key, channel, version)
);

CREATE TABLE message_log (
  id          bigserial PRIMARY KEY,
  template_id uuid REFERENCES message_templates(id) ON DELETE SET NULL,
  channel     text NOT NULL,
  recipient   text NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  booking_id  uuid REFERENCES bookings(id) ON DELETE SET NULL,
  subject     text NOT NULL DEFAULT '',
  body        text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'queued'
              CHECK (status IN ('queued','sent','failed','bounced')),
  provider_id text,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz
);
CREATE INDEX message_log_customer_idx ON message_log (customer_id, created_at DESC);
CREATE INDEX message_log_booking_idx  ON message_log (booking_id);

-- Yayın anlık görüntüsü: statik dosyalar hangi commit ile üretildi.
CREATE TABLE publish_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status      text NOT NULL DEFAULT 'running'
              CHECK (status IN ('running','succeeded','failed')),
  content_count int NOT NULL DEFAULT 0,
  files_written int NOT NULL DEFAULT 0,
  commit_sha  text,
  error       text,
  started_by  uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
