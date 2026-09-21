-- ============================================================================
-- 009 — Etkinlik
--
-- Etkinliği ayıran şey: temsiller SAYILI ve BİTİYOR. Tur her hafta tekrar
-- eder, otel her gün açıktır; festivalin altı temsili vardır ve sezon kapanır.
--
-- GEÇMİŞ TEMSİL SİLİNMEZ. Bilet satılmış bir temsili silmek, o rezervasyonun
-- neye ait olduğunu kaybetmek demek. Durumu 'archived' olur, satırı kalır.
-- ============================================================================

CREATE TABLE events (
  content_id       uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  event_type_id    int REFERENCES taxonomy_terms(id) ON DELETE SET NULL,
  organizer        text NOT NULL DEFAULT '',
  venue_name       text NOT NULL DEFAULT '',
  duration_label   text NOT NULL DEFAULT '',
  start_time       time,
  doors_time       time,
  doors_label      text NOT NULL DEFAULT '',
  season_start     date,
  season_end       date,
  max_tickets      int NOT NULL DEFAULT 6 CHECK (max_tickets >= 1),
  -- Bilet başına ayrı satır olarak gösterilen hizmet bedeli.
  service_per_ticket numeric(12,2) NOT NULL DEFAULT 0 CHECK (service_per_ticket >= 0),
  student_note     text NOT NULL DEFAULT '',
  unit_note        text NOT NULL DEFAULT '',
  CONSTRAINT events_season_order CHECK (season_end IS NULL OR season_start IS NULL OR season_end >= season_start)
);

CREATE TABLE event_performances (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  perf_date  date NOT NULL,
  perf_time  time,
  title      text NOT NULL DEFAULT '',
  kind       text NOT NULL DEFAULT '',
  detail     text NOT NULL DEFAULT '',
  capacity   int CHECK (capacity IS NULL OR capacity >= 0),
  status     text NOT NULL DEFAULT 'scheduled'
             CHECK (status IN ('scheduled','cancelled','postponed','completed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, perf_date, perf_time)
);
CREATE INDEX event_performances_date_idx ON event_performances (perf_date, status);
CREATE TRIGGER event_performances_updated BEFORE UPDATE ON event_performances
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE event_ticket_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  code          text NOT NULL,
  name          text NOT NULL,
  ticket_type_id int REFERENCES taxonomy_terms(id) ON DELETE SET NULL,
  block         text NOT NULL DEFAULT '',
  media_id      uuid REFERENCES media(id) ON DELETE SET NULL,
  price         numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  price_list    numeric(12,2) NOT NULL DEFAULT 0 CHECK (price_list >= 0),
  -- student_price 0 ve student_available false ise "bu blokta öğrenci bileti
  -- yok" demektir; locada olduğu gibi. İki alan ayrı çünkü 0 fiyat da
  -- geçerli bir öğrenci fiyatı olabilir.
  student_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (student_price >= 0),
  student_available boolean NOT NULL DEFAULT false,
  seats         int NOT NULL DEFAULT 0 CHECK (seats >= 0),
  features      jsonb NOT NULL DEFAULT '[]'::jsonb,
  note          text NOT NULL DEFAULT '',
  position      int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  UNIQUE (content_id, code),
  CONSTRAINT event_ticket_list_price_sane CHECK (price_list = 0 OR price_list >= price)
);
