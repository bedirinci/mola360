-- ============================================================================
-- 014 — Kampanya ve kupon
--
-- İKİSİ AYRI ŞEY:
--   kampanya → koşulu tutan HERKESE otomatik uygulanır (erken rezervasyon)
--   kupon    → kodu GİREN kişiye uygulanır
-- Aynı tabloda tutmak, "kodu olmayan kupon" gibi anlamsız satırlar üretirdi.
--
-- KULLANIM LİMİTİ VERİTABANINDA SAYILIR. coupon_usages satır sayısı gerçek
-- kullanım; coupons.used_count onun önbelleği. Limit kontrolü rezervasyon
-- transaction'ı içinde satır kilidiyle yapılıyor — aksi hâlde eşzamanlı iki
-- kullanım "son 1 kullanım"ı ikiye böler.
-- ============================================================================

CREATE TABLE campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text UNIQUE,
  name          text NOT NULL,
  description   text NOT NULL DEFAULT '',
  banner_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','amount')),
  discount_value numeric(12,2) NOT NULL CHECK (discount_value > 0),
  max_discount  numeric(12,2) CHECK (max_discount IS NULL OR max_discount > 0),
  min_subtotal  numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  content_types text[] NOT NULL DEFAULT '{}',
  region_ids    int[] NOT NULL DEFAULT '{}',
  city_ids      int[] NOT NULL DEFAULT '{}',
  usage_limit   int CHECK (usage_limit IS NULL OR usage_limit > 0),
  per_customer_limit int CHECK (per_customer_limit IS NULL OR per_customer_limit > 0),
  used_count    int NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  priority      int NOT NULL DEFAULT 0,
  created_by    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_date_order CHECK (ends_at > starts_at),
  -- Yüzde indirim 100'ü aşamaz; aşarsa negatif tutar üretir.
  CONSTRAINT campaigns_percent_range
    CHECK (discount_type <> 'percent' OR discount_value <= 100)
);
CREATE INDEX campaigns_active_idx ON campaigns (active, starts_at, ends_at);
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE campaign_contents (
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, content_id)
);

CREATE TABLE coupons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL,
  name          text NOT NULL DEFAULT '',
  campaign_id   uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','amount')),
  discount_value numeric(12,2) NOT NULL CHECK (discount_value > 0),
  max_discount  numeric(12,2),
  min_subtotal  numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  content_types text[] NOT NULL DEFAULT '{}',
  usage_limit   int CHECK (usage_limit IS NULL OR usage_limit > 0),
  per_customer_limit int NOT NULL DEFAULT 1 CHECK (per_customer_limit > 0),
  used_count    int NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_date_order CHECK (ends_at > starts_at),
  CONSTRAINT coupons_percent_range
    CHECK (discount_type <> 'percent' OR discount_value <= 100),
  CONSTRAINT coupons_usage_not_over
    CHECK (usage_limit IS NULL OR used_count <= usage_limit)
);
CREATE UNIQUE INDEX coupons_code_key ON coupons (upper(code));
CREATE TRIGGER coupons_updated BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE coupon_usages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   uuid NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  discount_amount numeric(12,2) NOT NULL CHECK (discount_amount >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Aynı kupon aynı rezervasyonda iki kez kullanılamaz.
  UNIQUE (coupon_id, booking_id)
);
CREATE INDEX coupon_usages_customer_idx ON coupon_usages (coupon_id, customer_id);

ALTER TABLE bookings
  ADD CONSTRAINT bookings_campaign_fk FOREIGN KEY (campaign_id)
    REFERENCES campaigns(id) ON DELETE SET NULL,
  ADD CONSTRAINT bookings_coupon_fk FOREIGN KEY (coupon_id)
    REFERENCES coupons(id) ON DELETE SET NULL;
