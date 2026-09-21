-- ============================================================================
-- 007 — Otel
--
-- FİYAT İKİ KATMANDA: oda kaydındaki `nightly` temel fiyat, hotel_rates ise
-- TARİHE ÖZEL fiyat. Bir tarihte satır varsa o geçerli, yoksa temel fiyat.
-- Sezon/hafta sonu fiyatlaması bunun üzerine price_rules ile kuruluyor (011).
--
-- Tek bir `nightly` alanıyla sezonluk fiyat yapılamaz; yazın ve kışın aynı
-- odayı aynı fiyata satmak zorunda kalınırdı.
-- ============================================================================

CREATE TABLE hotels (
  content_id     uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  stars          smallint CHECK (stars BETWEEN 1 AND 5),
  room_count     int CHECK (room_count >= 0),
  floor_count    int,
  distance_label text NOT NULL DEFAULT '',
  check_in_time  time NOT NULL DEFAULT '14:00',
  check_out_time time NOT NULL DEFAULT '12:00',
  min_nights     int NOT NULL DEFAULT 1 CHECK (min_nights >= 1),
  max_nights     int NOT NULL DEFAULT 14 CHECK (max_nights >= 1),
  max_rooms      int NOT NULL DEFAULT 3 CHECK (max_rooms >= 1),
  max_guests     int NOT NULL DEFAULT 8 CHECK (max_guests >= 1),
  lead_days      int NOT NULL DEFAULT 1 CHECK (lead_days >= 0),
  -- Konaklama vergisi ORAN olarak: 0.02 = %2. Fatura üzerinde ayrı satır
  -- gösterildiği için fiyatın içine gömülmüyor.
  tax_rate       numeric(6,4) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate < 1),
  unit_note      text NOT NULL DEFAULT '',
  date_note      text NOT NULL DEFAULT '',
  CONSTRAINT hotels_night_range CHECK (max_nights >= min_nights)
);

CREATE TABLE hotel_rooms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  code         text NOT NULL,
  name         text NOT NULL,
  media_id     uuid REFERENCES media(id) ON DELETE SET NULL,
  size_label   text NOT NULL DEFAULT '',
  view_label   text NOT NULL DEFAULT '',
  beds         text NOT NULL DEFAULT '',
  max_guests   int NOT NULL DEFAULT 2 CHECK (max_guests >= 1),
  max_adults   int,
  max_children int,
  nightly      numeric(12,2) NOT NULL DEFAULT 0 CHECK (nightly >= 0),
  nightly_list numeric(12,2) NOT NULL DEFAULT 0 CHECK (nightly_list >= 0),
  -- Fiziksel oda adedi. Günlük müsaitlik inventory'de; bu, kapasitenin kaynağı.
  stock        int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_nights   int,
  max_nights   int,
  features     jsonb NOT NULL DEFAULT '[]'::jsonb,
  note         text NOT NULL DEFAULT '',
  position     int NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  UNIQUE (content_id, code),
  CONSTRAINT hotel_rooms_list_price_sane CHECK (nightly_list = 0 OR nightly_list >= nightly)
);

CREATE TABLE hotel_boards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  code        text NOT NULL,
  board_type  text NOT NULL DEFAULT 'bb'
              CHECK (board_type IN ('ro','bb','hb','fb','ai')),
  label       text NOT NULL,
  -- Kişi başı GECELİK fark. Kahvaltı dahilse 0 — "dahil" bilgisini ayrı bir
  -- bayrak yerine fiyatın kendisi söylüyor.
  adult_night numeric(12,2) NOT NULL DEFAULT 0 CHECK (adult_night >= 0),
  child_night numeric(12,2) NOT NULL DEFAULT 0 CHECK (child_night >= 0),
  note        text NOT NULL DEFAULT '',
  position    int NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  UNIQUE (content_id, code)
);

CREATE TABLE hotel_rates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,
  stay_date   date NOT NULL,
  nightly     numeric(12,2) CHECK (nightly IS NULL OR nightly >= 0),
  nightly_list numeric(12,2),
  min_nights  int,
  closed      boolean NOT NULL DEFAULT false,
  UNIQUE (room_id, stay_date)
);
CREATE INDEX hotel_rates_date_idx ON hotel_rates (stay_date);
