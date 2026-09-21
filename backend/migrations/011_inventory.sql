-- ============================================================================
-- 011 — Envanter, geçici tutma (hold), kapalı tarihler, fiyat kuralları
--
-- MEVCUT SİSTEMDE MÜSAİTLİK SAHTE. seatsLeft() tarih metninin hash'inden bir
-- sayı üretiyor: "son 3 yer" yazısının gerçek bir kontenjanla ilgisi yok.
-- Bu tablo onun yerini alıyor.
--
-- ÇİFT SATIŞ ENGELİ — TASARIMIN KALBİ:
--   available = capacity - held - reserved - sold - blocked
-- şeklinde TÜRETİLEN bir sütun. Uygulama onu asla kendisi yazamaz, dolayısıyla
-- kapasite ile satılan miktar ayrışamaz. Ayrıca CHECK kısıtı toplamın
-- kapasiteyi aşmasını veritabanı seviyesinde reddediyor: iki eşzamanlı
-- rezervasyon aynı son koltuğu almaya çalıştığında ikincisi transaction
-- içinde HATA ALIR, sessizce fazla satış olmaz.
--
-- Uygulama katmanı ayrıca SELECT ... FOR UPDATE ile satırı kilitliyor
-- (src/services/inventory.js); kısıt ise son savunma hattı.
--
-- GEÇİCİ TUTMA: koltuk seçilince 10 dakika HELD olur. Ödeme başarılıysa
-- RESERVED'a döner, başarısızsa veya süre dolarsa zamanlanmış iş onu serbest
-- bırakır. Hold olmadan, ödeme sayfasındaki müşterinin koltuğu başkasına
-- satılabilir.
-- ============================================================================

CREATE TABLE inventory (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  -- Neyin envanteri: oda, paket, bilet kategorisi, alan, hizmet, kalkış…
  item_type   text NOT NULL CHECK (item_type IN (
                'tour_departure','hotel_room','activity_package','activity_session',
                'event_ticket','venue_area','venue_service')),
  item_id     uuid NOT NULL,
  on_date     date NOT NULL,
  start_time  time,
  end_time    time,
  capacity    int NOT NULL CHECK (capacity >= 0),
  held        int NOT NULL DEFAULT 0 CHECK (held >= 0),
  reserved    int NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  sold        int NOT NULL DEFAULT 0 CHECK (sold >= 0),
  blocked     int NOT NULL DEFAULT 0 CHECK (blocked >= 0),
  -- Türetilen sütun: elle yazılamaz, eskiyemez.
  available   int GENERATED ALWAYS AS (capacity - held - reserved - sold - blocked) STORED,
  status      text NOT NULL DEFAULT 'available'
              CHECK (status IN ('available','closed','blocked')),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Aynı kaynağın aynı tarih/saatte iki satırı olamaz.
  UNIQUE (content_id, item_type, item_id, on_date, start_time),
  -- Son savunma hattı: kapasitenin üstünde satış veritabanınca reddedilir.
  CONSTRAINT inventory_not_oversold
    CHECK (held + reserved + sold + blocked <= capacity)
);
CREATE INDEX inventory_lookup_idx ON inventory (content_id, on_date);
CREATE INDEX inventory_item_idx   ON inventory (item_type, item_id, on_date);
CREATE INDEX inventory_available_idx ON inventory (on_date) WHERE available > 0;
CREATE TRIGGER inventory_updated BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE inventory_holds (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  booking_id   uuid,                      -- FK 013'te ekleniyor
  quantity     int NOT NULL CHECK (quantity > 0),
  status       text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','converted','released','expired')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  released_at  timestamptz,
  CONSTRAINT inventory_holds_expiry_future CHECK (expires_at > created_at)
);
-- Süresi dolmuş hold'ları bulan zamanlanmış iş bu indeksi kullanıyor.
CREATE INDEX inventory_holds_expiry_idx ON inventory_holds (expires_at) WHERE status = 'active';
CREATE INDEX inventory_holds_booking_idx ON inventory_holds (booking_id);

CREATE TABLE blackout_dates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  item_type  text,
  item_id    uuid,
  start_date date NOT NULL,
  end_date   date NOT NULL,
  reason     text NOT NULL DEFAULT '',
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blackout_date_order CHECK (end_date >= start_date)
);
CREATE INDEX blackout_dates_idx ON blackout_dates (content_id, start_date, end_date);

-- ----------------------------------------------------------------------------
-- FİYAT KURALLARI
--
-- Temel fiyat oda/paket/kategori kaydında duruyor. Bu tablo onun ÜZERİNE
-- binen kuralları tutuyor: sezon, hafta sonu, erken rezervasyon, son dakika,
-- özel tarih, elle düzeltme.
--
-- ÇAKIŞMA DETERMİNİSTİK ÇÖZÜLÜR: priority (büyük olan kazanır), eşitse
-- daha SONRA başlayan kural kazanır, o da eşitse id. Bu sıra
-- shared/pricing/rules.js içinde tek yerde tanımlı; aynı girdi her zaman
-- aynı fiyatı verir — rapor ile sepet ayrışamaz.
-- ----------------------------------------------------------------------------
CREATE TABLE price_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid REFERENCES content(id) ON DELETE CASCADE,
  item_type   text,
  item_id     uuid,
  rule_type   text NOT NULL CHECK (rule_type IN (
                'seasonal','weekend','special_date','early_booking',
                'last_minute','length_of_stay','party_size','manual')),
  name        text NOT NULL DEFAULT '',
  starts_on   date,
  ends_on     date,
  weekdays    smallint[] NOT NULL DEFAULT '{}',
  priority    int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  -- conditions: {minNights, maxNights, minGuests, daysBefore, …}
  -- effect:     {mode: 'percent'|'amount'|'override', value: number}
  conditions  jsonb NOT NULL DEFAULT '{}'::jsonb,
  effect      jsonb NOT NULL,
  created_by  uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT price_rules_date_order CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);
CREATE INDEX price_rules_lookup_idx ON price_rules (content_id, active, priority DESC);
CREATE TRIGGER price_rules_updated BEFORE UPDATE ON price_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
