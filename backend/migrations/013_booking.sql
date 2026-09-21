-- ============================================================================
-- 013 — Rezervasyon, ödeme, iade
--
-- DURUM MAKİNESİ: geçişler serbest değil. booking_status_transitions tablosu
-- hangi durumdan hangisine geçilebileceğini VERİDE tutuyor ve bir tetikleyici
-- her UPDATE'te bunu doğruluyor.
--
-- Neden veritabanında: durum geçişi yalnızca uygulama katmanında kontrol
-- edilseydi, bir script, bir elle SQL veya ileride eklenecek ikinci bir servis
-- rezervasyonu "iptal"den doğrudan "tamamlandı"ya taşıyabilirdi. Para ve
-- kontenjanla ilgili bir kaydın tutarlılığı tek bir uygulamanın dikkatine
-- bırakılamaz.
--
-- ÖDEME AYRI TABLO: bir rezervasyonun birden çok ödemesi olabilir (kapora +
-- bakiye, başarısız deneme + başarılı deneme). Toplamı bookings üzerinde tek
-- bir "paid" alanında tutmak, bu geçmişi siler.
--
-- KART VERİSİ SAKLANMIYOR. Tabloda kart numarası, CVV, son kullanma tarihi
-- için sütun YOK ve olmayacak; sağlayıcının token'ı ve işlem kimliği yeterli.
-- ============================================================================

CREATE TABLE bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  customer_id   uuid REFERENCES customers(id) ON DELETE RESTRICT,
  content_id    uuid NOT NULL REFERENCES content(id) ON DELETE RESTRICT,
  content_type  text NOT NULL CHECK (content_type IN ('tour','hotel','activity','event','venue')),

  status        text NOT NULL DEFAULT 'draft' CHECK (status IN (
                  'draft','pending','held','awaiting_payment','paid','confirmed',
                  'checked_in','completed','cancel_requested','cancelled',
                  'refund_pending','partially_refunded','refunded','failed','no_show')),

  -- Rezervasyonun ait olduğu tarih/saat (otelde giriş günü).
  start_date    date,
  end_date      date,
  start_time    time,
  guests_adult  int NOT NULL DEFAULT 1 CHECK (guests_adult >= 0),
  guests_child  int NOT NULL DEFAULT 0 CHECK (guests_child >= 0),
  guests_infant int NOT NULL DEFAULT 0 CHECK (guests_infant >= 0),
  nights        int CHECK (nights IS NULL OR nights >= 0),
  rooms         int CHECK (rooms IS NULL OR rooms >= 0),

  currency      char(3) NOT NULL DEFAULT 'TRY',
  subtotal      numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount      numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  service_fee   numeric(12,2) NOT NULL DEFAULT 0 CHECK (service_fee >= 0),
  tax           numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total         numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  paid          numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid >= 0),
  -- Kalan tutar TÜRETİLİYOR: iki alanı elle tutarlı tutmak imkânsız.
  balance       numeric(12,2) GENERATED ALWAYS AS (total - paid) STORED,

  campaign_id   uuid,
  coupon_id     uuid,
  -- Fiyat hesabının o ANKİ dökümü. Fiyat kuralları sonradan değişse bile
  -- müşteriye ne gerekçeyle ne kadar yazıldığı kaybolmaz.
  price_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,

  source        text NOT NULL DEFAULT 'web'
                CHECK (source IN ('web','admin','phone','whatsapp','walkin')),
  customer_note text NOT NULL DEFAULT '',
  internal_note text NOT NULL DEFAULT '',
  created_by    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  confirmed_at  timestamptz,
  cancelled_at  timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bookings_paid_not_over CHECK (paid <= total),
  CONSTRAINT bookings_date_order CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX bookings_status_idx   ON bookings (status, created_at DESC);
CREATE INDEX bookings_customer_idx ON bookings (customer_id, created_at DESC);
CREATE INDEX bookings_content_idx  ON bookings (content_id, start_date);
CREATE INDEX bookings_date_idx     ON bookings (start_date) WHERE status IN ('confirmed','paid','checked_in');
CREATE TRIGGER bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE booking_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  item_type   text NOT NULL CHECK (item_type IN (
                'tour_seat','hotel_room','hotel_board','activity_package',
                'event_ticket','venue_area','venue_service','addon','fee','tax','discount')),
  item_id     uuid,
  label       text NOT NULL,
  unit_price  numeric(12,2) NOT NULL DEFAULT 0,
  quantity    int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  multiplier  int NOT NULL DEFAULT 1 CHECK (multiplier > 0),
  line_total  numeric(12,2) NOT NULL DEFAULT 0,
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  position    int NOT NULL DEFAULT 0
);
CREATE INDEX booking_items_booking_idx ON booking_items (booking_id, position);

-- İzin verilen durum geçişleri. Veride tutuluyor ki tetikleyici okuyabilsin.
CREATE TABLE booking_status_transitions (
  from_status text NOT NULL,
  to_status   text NOT NULL,
  PRIMARY KEY (from_status, to_status)
);

INSERT INTO booking_status_transitions (from_status, to_status) VALUES
  ('draft','pending'), ('draft','held'), ('draft','failed'), ('draft','cancelled'),
  ('pending','held'), ('pending','awaiting_payment'), ('pending','confirmed'),
  ('pending','cancelled'), ('pending','failed'),
  ('held','awaiting_payment'), ('held','cancelled'), ('held','failed'), ('held','pending'),
  ('awaiting_payment','paid'), ('awaiting_payment','failed'), ('awaiting_payment','cancelled'),
  ('paid','confirmed'), ('paid','refund_pending'), ('paid','cancel_requested'),
  ('confirmed','checked_in'), ('confirmed','cancel_requested'), ('confirmed','no_show'),
  ('confirmed','completed'), ('confirmed','refund_pending'),
  ('checked_in','completed'), ('checked_in','no_show'),
  ('cancel_requested','cancelled'), ('cancel_requested','refund_pending'),
  ('cancel_requested','confirmed'),
  ('refund_pending','refunded'), ('refund_pending','partially_refunded'),
  ('refund_pending','cancelled'),
  ('partially_refunded','refunded'),
  ('cancelled','refund_pending'),
  ('no_show','completed'), ('no_show','refund_pending'),
  ('failed','pending'), ('failed','cancelled');

CREATE OR REPLACE FUNCTION check_booking_transition() RETURNS trigger AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM booking_status_transitions
    WHERE from_status = OLD.status AND to_status = NEW.status
  ) THEN
    RAISE EXCEPTION 'Gecersiz rezervasyon durum gecisi: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_status_guard BEFORE UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION check_booking_transition();

CREATE TABLE booking_status_history (
  id          bigserial PRIMARY KEY,
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  reason      text NOT NULL DEFAULT '',
  actor_id    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_status_history_idx ON booking_status_history (booking_id, created_at);

CREATE TABLE payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  provider      text NOT NULL DEFAULT 'manual',
  provider_transaction_id text,
  amount        numeric(12,2) NOT NULL CHECK (amount > 0),
  currency      char(3) NOT NULL DEFAULT 'TRY',
  method        text NOT NULL DEFAULT 'card'
                CHECK (method IN ('card','transfer','cash','on_site','wallet')),
  installment   int NOT NULL DEFAULT 1 CHECK (installment >= 1),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','authorized','captured','failed','cancelled','refunded')),
  captured_at   timestamptz,
  failed_at     timestamptz,
  failure_reason text NOT NULL DEFAULT '',
  -- Sağlayıcıdan dönen ham yanıt. Kart verisi İÇERMEZ; servis katmanı
  -- maskeler (src/services/payment.js).
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX payments_provider_tx_key ON payments (provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;
CREATE INDEX payments_booking_idx ON payments (booking_id);
CREATE TRIGGER payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE refunds (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  uuid NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  reason      text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','processing','completed','failed')),
  provider_refund_id text,
  requested_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX refunds_payment_idx ON refunds (payment_id);

-- 005 ve 011'de FK'sız bırakılan sütunların kısıtları burada.
ALTER TABLE reviews
  ADD CONSTRAINT reviews_customer_fk FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE SET NULL,
  ADD CONSTRAINT reviews_booking_fk FOREIGN KEY (booking_id)
    REFERENCES bookings(id) ON DELETE SET NULL;

ALTER TABLE inventory_holds
  ADD CONSTRAINT inventory_holds_booking_fk FOREIGN KEY (booking_id)
    REFERENCES bookings(id) ON DELETE CASCADE;
