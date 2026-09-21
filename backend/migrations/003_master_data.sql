-- ============================================================================
-- 003 — Ana veri (master data)
--
-- Şehir, bölge, kategori, etiket gibi değerler içerik kaydının içinde SERBEST
-- METİN olarak duruyordu ("Alsancak, İzmir"). Sonucu: aynı şehir üç farklı
-- yazımla üç ayrı değer sayılıyor, filtre eksik sonuç veriyor, bir ilin adı
-- değişince yedi kaydı elle düzeltmek gerekiyor.
--
-- Artık referanslar ID üzerinden. İçerikteki serbest metin alanı (area) ise
-- KORUNUYOR: "Alsancak, İzmir · Sahile yürüme mesafesi" gibi insanın yazdığı
-- konum cümlesinin yerini bir ID tutamaz.
--
-- TAKSONOMİ TEK TABLODA: amenity, service, ticket type, activity type, venue
-- type, board type, age group — hepsi "kind + slug + ad" yapısında. Yedi ayrı
-- tabloya bölmek yedi kez aynı şemayı yazmak olurdu; kind sütunu ayrımı
-- taşıyor ve CHECK ile korunuyor.
-- ============================================================================

CREATE TABLE regions (
  id         serial PRIMARY KEY,
  slug       text NOT NULL UNIQUE CHECK (is_slug(slug)),
  name       text NOT NULL,
  position   int  NOT NULL DEFAULT 0,
  active     boolean NOT NULL DEFAULT true
);

CREATE TABLE cities (
  id         serial PRIMARY KEY,
  region_id  int REFERENCES regions(id) ON DELETE SET NULL,
  slug       text NOT NULL UNIQUE CHECK (is_slug(slug)),
  name       text NOT NULL,
  plate_code int,
  latitude   numeric(9,6),
  longitude  numeric(9,6),
  active     boolean NOT NULL DEFAULT true
);
CREATE INDEX cities_region_idx ON cities (region_id);

CREATE TABLE districts (
  id      serial PRIMARY KEY,
  city_id int NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slug    text NOT NULL CHECK (is_slug(slug)),
  name    text NOT NULL,
  active  boolean NOT NULL DEFAULT true,
  UNIQUE (city_id, slug)
);

CREATE TABLE categories (
  id            serial PRIMARY KEY,
  content_type  text NOT NULL CHECK (content_type IN ('tour','hotel','activity','event','venue')),
  parent_id     int REFERENCES categories(id) ON DELETE SET NULL,
  slug          text NOT NULL CHECK (is_slug(slug)),
  name          text NOT NULL,
  -- Dar yerlerde (mobil başlık, kart rozeti) uzun ad sığmıyor; sitenin
  -- mevcut categoryShort/categoryPlural/categoryAnchor alanlarının karşılığı.
  name_short    text NOT NULL DEFAULT '',
  name_plural   text NOT NULL DEFAULT '',
  home_anchor   text NOT NULL DEFAULT '',
  icon          text NOT NULL DEFAULT '',
  position      int NOT NULL DEFAULT 0,
  active        boolean NOT NULL DEFAULT true,
  UNIQUE (content_type, slug)
);

CREATE TABLE tags (
  id       serial PRIMARY KEY,
  slug     text NOT NULL UNIQUE CHECK (is_slug(slug)),
  name     text NOT NULL,
  -- Site içi arama bağı; mevcut veride tags[].href bunu taşıyordu.
  href     text NOT NULL DEFAULT '',
  usage_count int NOT NULL DEFAULT 0
);

CREATE TABLE taxonomy_terms (
  id     serial PRIMARY KEY,
  kind   text NOT NULL CHECK (kind IN (
           'amenity','service','ticket_type','activity_type','venue_type',
           'board_type','age_group','meal','transport')),
  slug   text NOT NULL CHECK (is_slug(slug)),
  name   text NOT NULL,
  icon   text NOT NULL DEFAULT '',
  position int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (kind, slug)
);

-- Konum: buluşma noktası, alım noktası, tesis adresi, sahne adresi.
-- Bir içerik birden fazla noktaya sahip olabildiği için ayrı tablo
-- (content_locations ile bağlanıyor, bkz. 005).
CREATE TABLE locations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  country       text NOT NULL DEFAULT 'TR',
  city_id       int REFERENCES cities(id) ON DELETE SET NULL,
  district_id   int REFERENCES districts(id) ON DELETE SET NULL,
  neighborhood  text NOT NULL DEFAULT '',
  address       text NOT NULL DEFAULT '',
  latitude      numeric(9,6),
  longitude     numeric(9,6),
  map_url       text NOT NULL DEFAULT '',
  directions    text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER locations_updated BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
