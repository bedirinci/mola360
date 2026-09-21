-- ============================================================================
-- 010 — Mekân
--
-- İKİ REZERVASYON MODELİ, TEK ŞABLON:
--   masa     → alan/şezlong/sedir/loca tutulur, kapora alınır, minimum
--              harcama bilgi olarak gösterilir ama toplama GİRMEZ
--   randevu  → hizmet seçilir, süre ve fiyat bellidir
--
-- Fark tek alanda (`booking_model`) ve alanlar/hizmetler iki ayrı tabloda:
-- ikisinin alanları (minimum harcama vs. süre/fiyat) gerçekten farklı.
-- Tek tabloda birleştirmek, yarısı hep NULL kalan bir tablo üretirdi.
--
-- ÖDEME MODELİ AYRI ALAN: randevuda hiçbir şey tahsil edilmiyor ("Mekânda
-- ödenecek"), masada kapora alınıyor. Bunu booking_model'den TÜRETMEK yanlış
-- olur — yarın kapora alan bir randevu mekânı eklenebilir.
-- ============================================================================

CREATE TABLE venues (
  content_id     uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  booking_model  text NOT NULL CHECK (booking_model IN ('masa','randevu')),
  venue_type_id  int REFERENCES taxonomy_terms(id) ON DELETE SET NULL,
  kind_label     text NOT NULL DEFAULT '',
  price_level    text NOT NULL DEFAULT '' CHECK (price_level IN ('','₺','₺₺','₺₺₺','₺₺₺₺')),
  payment_mode   text NOT NULL DEFAULT 'on_site'
                 CHECK (payment_mode IN ('on_site','deposit','prepaid')),
  max_guests     int NOT NULL DEFAULT 8 CHECK (max_guests >= 1),
  lead_days      int NOT NULL DEFAULT 0 CHECK (lead_days >= 0),
  entry_fee      numeric(12,2) NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
  deposit_note   text NOT NULL DEFAULT '',
  unit_note      text NOT NULL DEFAULT ''
);

CREATE TABLE venue_areas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  code       text NOT NULL,
  name       text NOT NULL,
  media_id   uuid REFERENCES media(id) ON DELETE SET NULL,
  capacity   int NOT NULL DEFAULT 2 CHECK (capacity >= 1),
  -- Masada en az harcanacak tutar. Kapora bundan DÜŞÜLÜR; ikisi ayrı alan.
  min_spend  numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_spend >= 0),
  deposit    numeric(12,2) NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  unit_count int NOT NULL DEFAULT 0 CHECK (unit_count >= 0),
  features   jsonb NOT NULL DEFAULT '[]'::jsonb,
  note       text NOT NULL DEFAULT '',
  position   int NOT NULL DEFAULT 0,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  UNIQUE (content_id, code),
  CONSTRAINT venue_areas_deposit_sane CHECK (min_spend = 0 OR deposit <= min_spend)
);

CREATE TABLE venue_services (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id     uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  code           text NOT NULL,
  name           text NOT NULL,
  media_id       uuid REFERENCES media(id) ON DELETE SET NULL,
  duration_minutes int NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  price          numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  price_list     numeric(12,2) NOT NULL DEFAULT 0 CHECK (price_list >= 0),
  capacity       int NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  min_age        int,
  unit_count     int NOT NULL DEFAULT 1 CHECK (unit_count >= 0),
  features       jsonb NOT NULL DEFAULT '[]'::jsonb,
  note           text NOT NULL DEFAULT '',
  position       int NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  UNIQUE (content_id, code),
  CONSTRAINT venue_services_list_price_sane CHECK (price_list = 0 OR price_list >= price)
);

CREATE TABLE venue_hours (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  weekday    smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0 = Pazar
  open_time  time,
  close_time time,
  closed     boolean NOT NULL DEFAULT false,
  UNIQUE (content_id, weekday),
  -- Açık bir günün saatleri olmak zorunda.
  CONSTRAINT venue_hours_open_needs_times
    CHECK (closed OR (open_time IS NOT NULL AND close_time IS NOT NULL))
);

-- Özel tarih: bayram, bakım, özel etkinlik. Haftalık saatleri EZER.
CREATE TABLE venue_special_hours (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  on_date    date NOT NULL,
  open_time  time,
  close_time time,
  closed     boolean NOT NULL DEFAULT false,
  reason     text NOT NULL DEFAULT '',
  UNIQUE (content_id, on_date)
);

-- Randevu/masa saat şablonu. Hafta içi ve hafta sonu farklı olabiliyor.
CREATE TABLE venue_slot_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  day_kind   text NOT NULL DEFAULT 'weekday' CHECK (day_kind IN ('weekday','weekend')),
  slot_time  time NOT NULL,
  position   int NOT NULL DEFAULT 0,
  UNIQUE (content_id, day_kind, slot_time)
);
