-- ============================================================================
-- 012 — Müşteriler ve KVKK
--
-- Müşteri, yönetici hesabından AYRI tablo (gerekçe 002'de).
--
-- KVKK: kişisel veriyi silmek tek bir DELETE değil. Üç ayrı yol var ve
-- üçünün de kaydı tutulmak zorunda:
--   export      → veri taşınabilirliği talebi
--   deletion    → silme talebi
--   anonymize   → rezervasyon geçmişi muhasebe için duracak ama kimlik
--                 bilgisi çıkarılacak
-- Yasal saklama yükümlülüğü (legal_hold) varken silme YAPILAMAZ; bayrak
-- bunu taşıyor ve silme servisi ona bakıyor.
-- ============================================================================

CREATE TABLE customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text,
  phone         text,
  first_name    text NOT NULL DEFAULT '',
  last_name     text NOT NULL DEFAULT '',
  password_hash text,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','suspended','anonymized')),
  email_verified_at timestamptz,
  marketing_consent boolean NOT NULL DEFAULT false,
  -- Yasal saklama: açıkken silme/anonimleştirme reddedilir.
  legal_hold    boolean NOT NULL DEFAULT false,
  loyalty_points int NOT NULL DEFAULT 0,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  anonymized_at timestamptz
);
CREATE UNIQUE INDEX customers_email_key ON customers (lower(email))
  WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX customers_phone_idx ON customers (phone) WHERE deleted_at IS NULL;
CREATE TRIGGER customers_updated BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE customer_addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label       text NOT NULL DEFAULT '',
  city_id     int REFERENCES cities(id) ON DELETE SET NULL,
  address     text NOT NULL DEFAULT '',
  tax_office  text NOT NULL DEFAULT '',
  tax_number  text NOT NULL DEFAULT '',
  is_default  boolean NOT NULL DEFAULT false
);

CREATE TABLE customer_favorites (
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, content_id)
);

-- Rıza kaydı SÜRÜMLÜ: metin değişince eski rıza yeni metni kapsamaz.
CREATE TABLE legal_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         text NOT NULL CHECK (kind IN (
                 'privacy_policy','disclosure','explicit_consent','terms',
                 'cookie_policy','distance_sales')),
  version      text NOT NULL,
  title        text NOT NULL,
  body         text NOT NULL,
  effective_at timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, version)
);

CREATE TABLE consent_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  document_id uuid REFERENCES legal_documents(id) ON DELETE RESTRICT,
  channel     text NOT NULL DEFAULT 'web',
  granted     boolean NOT NULL,
  ip          inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consent_records_customer_idx ON consent_records (customer_id, created_at DESC);

CREATE TABLE data_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid REFERENCES customers(id) ON DELETE SET NULL,
  request_type text NOT NULL CHECK (request_type IN ('export','deletion','anonymize','correction')),
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','in_progress','completed','rejected')),
  reason       text NOT NULL DEFAULT '',
  handled_by   uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  result_note  text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Silme/yok etme kaydı: KVKK imha politikası gereği yapılan işin kanıtı.
CREATE TABLE data_destruction_log (
  id           bigserial PRIMARY KEY,
  entity_type  text NOT NULL,
  entity_id    uuid NOT NULL,
  method       text NOT NULL CHECK (method IN ('delete','anonymize')),
  reason       text NOT NULL DEFAULT '',
  performed_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
