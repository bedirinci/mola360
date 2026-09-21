-- ============================================================================
-- 006 — Tur
--
-- İKİ OPERASYON MODELİ TEK TABLODA: günübirlik (daily) ve konaklamalı (stay).
-- Ayrımı `kind` taşıyor. İki ayrı tablo kurmak, ortak olan her şeyi (kalkış
-- şehri, buluşma, iptal, program) iki kez modellemek olurdu; mevcut kod da
-- tek kayıt tipinde tutuyor ve fiyat fonksiyonu `type` ile dallanıyor.
--
-- Konaklamalıya özgü alanlar NULL kalabiliyor; CHECK kısıtı stay olan kaydın
-- gece/gün sayısını ve kişi başı fiyatını zorunlu kılıyor — yarım doldurulmuş
-- bir konaklamalı tur satışa çıkamaz.
-- ============================================================================

CREATE TABLE tours (
  content_id      uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('daily','stay')),
  duration_label  text NOT NULL DEFAULT '',
  nights          int,
  days            int,
  departure_city_id int REFERENCES cities(id) ON DELETE SET NULL,
  start_time      time,
  lead_days       int NOT NULL DEFAULT 1 CHECK (lead_days >= 0),
  -- 0=Pazar … 6=Cumartesi. Kalkış takvimi bundan üretiliyor.
  departure_days  smallint[] NOT NULL DEFAULT '{}',
  seats_per_departure int NOT NULL DEFAULT 0 CHECK (seats_per_departure >= 0),
  max_guests      int NOT NULL DEFAULT 9 CHECK (max_guests > 0),
  max_infants     int NOT NULL DEFAULT 0 CHECK (max_infants >= 0),
  -- Fiyatlar kuruş değil TL; numeric(12,2) yuvarlama hatası üretmez.
  adult_price     numeric(12,2) NOT NULL DEFAULT 0 CHECK (adult_price >= 0),
  adult_list_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (adult_list_price >= 0),
  child_price     numeric(12,2) NOT NULL DEFAULT 0 CHECK (child_price >= 0),
  child_list_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (child_list_price >= 0),
  infant_price    numeric(12,2) NOT NULL DEFAULT 0 CHECK (infant_price >= 0),
  per_person_price numeric(12,2),
  per_person_list_price numeric(12,2),
  single_room_supplement numeric(12,2) NOT NULL DEFAULT 0,
  child_ages      text NOT NULL DEFAULT '',
  infant_ages     text NOT NULL DEFAULT '',
  unit_note       text NOT NULL DEFAULT '',
  departure_note  text NOT NULL DEFAULT '',

  CONSTRAINT tours_stay_needs_nights
    CHECK (kind <> 'stay' OR (nights IS NOT NULL AND days IS NOT NULL AND per_person_price IS NOT NULL)),
  -- Liste fiyatı satış fiyatının altındaysa üstü çizili fiyat daha ucuz
  -- görünür; bu bir görüntü hatası değil, veri hatasıdır.
  CONSTRAINT tours_list_price_sane
    CHECK (adult_list_price = 0 OR adult_list_price >= adult_price)
);

CREATE TABLE tour_itinerary_days (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  day_no      int NOT NULL DEFAULT 1 CHECK (day_no >= 1),
  position    int NOT NULL DEFAULT 0,
  time_label  text NOT NULL DEFAULT '',
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  meal        text NOT NULL DEFAULT '',
  accommodation text NOT NULL DEFAULT '',
  UNIQUE (content_id, day_no, position)
);

-- Her kalkış ayrı bir satır ve ayrı bir kapasite. Kontenjan sayıları burada
-- DEĞİL, inventory tablosunda tutuluyor (011): kapasite tek bir yerde
-- yönetilmezse iki kaynak ayrışır ve çift satış kaçınılmaz olur.
CREATE TABLE tour_departures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  depart_date   date NOT NULL,
  depart_time   time,
  from_location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  to_location_id   uuid REFERENCES locations(id) ON DELETE SET NULL,
  capacity      int NOT NULL CHECK (capacity >= 0),
  price_adjustment numeric(12,2) NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','full','cancelled','inactive')),
  note          text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, depart_date, depart_time)
);
CREATE INDEX tour_departures_date_idx ON tour_departures (depart_date, status);
CREATE TRIGGER tour_departures_updated BEFORE UPDATE ON tour_departures
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
