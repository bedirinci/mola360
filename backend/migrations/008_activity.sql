-- ============================================================================
-- 008 — Aktivite
--
-- Aktiviteyi tur'dan ayıran şey: SEANS. Aynı gün içinde birden çok kalkış
-- olabiliyor (sabah 05:30 ve 06:15 balon uçuşu) ve her seansın kendi
-- kapasitesi ve fiyat farkı var. Tur'da gün başına tek kalkış varsayımı
-- yeterliyken burada değil.
--
-- HAVA KOŞULU İADESİ VERİDE: balon/yamaç paraşütü gibi aktivitelerde iptal
-- sebebi operatörden bağımsız. İade oranı kodda sabit olsaydı, farklı iade
-- politikası olan bir aktivite eklenemezdi.
-- ============================================================================

CREATE TABLE activities (
  content_id        uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  activity_type_id  int REFERENCES taxonomy_terms(id) ON DELETE SET NULL,
  activity_label    text NOT NULL DEFAULT '',
  duration_label    text NOT NULL DEFAULT '',
  min_age           int CHECK (min_age IS NULL OR min_age >= 0),
  max_age           int,
  max_weight_kg     int,
  max_guests        int NOT NULL DEFAULT 8 CHECK (max_guests >= 1),
  children_per_adult int NOT NULL DEFAULT 0 CHECK (children_per_adult >= 0),
  child_ages        text NOT NULL DEFAULT '',
  lead_days         int NOT NULL DEFAULT 1 CHECK (lead_days >= 0),
  seats_per_session int NOT NULL DEFAULT 0 CHECK (seats_per_session >= 0),
  -- Hava nedeniyle iptalde iade ORANI (1 = tamamı).
  weather_refund_rate numeric(4,3) NOT NULL DEFAULT 1
                      CHECK (weather_refund_rate BETWEEN 0 AND 1),
  transfer_included boolean NOT NULL DEFAULT false,
  unit_note         text NOT NULL DEFAULT '',
  operating_note    text NOT NULL DEFAULT ''
);

CREATE TABLE activity_packages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  code          text NOT NULL,
  name          text NOT NULL,
  media_id      uuid REFERENCES media(id) ON DELETE SET NULL,
  description   text NOT NULL DEFAULT '',
  group_label   text NOT NULL DEFAULT '',
  duration      text NOT NULL DEFAULT '',
  capacity      int NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  min_age       int,
  per_person    numeric(12,2) NOT NULL DEFAULT 0 CHECK (per_person >= 0),
  per_person_list numeric(12,2) NOT NULL DEFAULT 0 CHECK (per_person_list >= 0),
  child_price   numeric(12,2) NOT NULL DEFAULT 0 CHECK (child_price >= 0),
  child_list_price numeric(12,2) NOT NULL DEFAULT 0,
  features      jsonb NOT NULL DEFAULT '[]'::jsonb,
  note          text NOT NULL DEFAULT '',
  position      int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  UNIQUE (content_id, code),
  CONSTRAINT activity_packages_list_price_sane
    CHECK (per_person_list = 0 OR per_person_list >= per_person)
);

CREATE TABLE activity_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  code       text NOT NULL,
  label      text NOT NULL,
  start_time time NOT NULL,
  end_time   time,
  fee        numeric(12,2) NOT NULL DEFAULT 0,
  capacity   int,
  note       text NOT NULL DEFAULT '',
  position   int NOT NULL DEFAULT 0,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  UNIQUE (content_id, code)
);
