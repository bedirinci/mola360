-- ============================================================================
-- 019 — Sınıflandırma: çoklu kategori, tema, koleksiyon, liste sayfası,
--       özellik ve para birimi
--
-- Ön yüzün veri sözleşmesi (docs/veri-sozlesmesi.md bölüm 5 ve 11) beş
-- kavramı birbirinden ayırıyor: kategori, tema, koleksiyon, destinasyon,
-- özellik. 003'teki şemada yalnızca TEK kategori (content.category_id)
-- vardı; tema ve koleksiyonun karşılığı yoktu. Sonuç: "Ailece" ya da
-- "Doğa & Yayla" ancak bir kategori gibi yazılabilirdi ve bir ürün aynı
-- anda hem Karadeniz Turları'nda hem Ailece koleksiyonunda olamazdı.
--
-- content.category_id KALIYOR: ana kategori (breadcrumb, kart rozeti).
-- content_categories ürünün girdiği BÜTÜN kategoriler; ana kategori de
-- bu tabloda position=0 ile duruyor.
--
-- Ön yüzde karşılığı: assets/js/taxonomy-data.js (ana veri) ve her ürün
-- kaydının `taxonomy` alanı. Göç betiği ikisini de buraya yazıyor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Para birimi: yurt dışı turlar döviz fiyatlı. Fiyat sütunları (tours.*,
-- hotel_rates …) bu para biriminde okunur. Kur rezervasyon anında
-- sabitlenir ve bookings.currency / price_breakdown'a yazılır.
-- ---------------------------------------------------------------------------
ALTER TABLE content
  ADD COLUMN currency char(3) NOT NULL DEFAULT 'TRY'
  CONSTRAINT content_currency_known CHECK (currency IN ('TRY', 'EUR', 'USD'));

-- Yurt içi / yurt dışı ayrımı bölgede: "Yurt İçi Oteller" liste sayfası
-- abroad = false olan bölgelerin ürünlerini topluyor.
ALTER TABLE regions ADD COLUMN abroad boolean NOT NULL DEFAULT false;

-- Menüde olmayan ama mevcut bir ürün için açılmış kategori (ör. Spa &
-- Masaj). Adresi var, menüde görünmüyor.
ALTER TABLE categories ADD COLUMN in_menu boolean NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------------
-- Çoklu kategori
-- ---------------------------------------------------------------------------
CREATE TABLE content_categories (
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  category_id int  NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  position    int  NOT NULL DEFAULT 0,
  PRIMARY KEY (content_id, category_id)
);
CREATE INDEX content_categories_category_idx ON content_categories (category_id);

-- Kategori ürünle AYNI tipte olmalı: bir otel "Karadeniz Turları"na
-- bağlanamaz. Kısıt başka tabloya baktığı için CHECK değil tetikleyici.
CREATE FUNCTION content_category_type_guard() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM content c JOIN categories k ON k.id = NEW.category_id
    WHERE c.id = NEW.content_id AND k.content_type = c.type
  ) THEN
    RAISE EXCEPTION 'Kategori ürünün tipiyle uyuşmuyor (content %, category %)',
      NEW.content_id, NEW.category_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_categories_type_guard
  BEFORE INSERT OR UPDATE ON content_categories
  FOR EACH ROW EXECUTE FUNCTION content_category_type_guard();

-- ---------------------------------------------------------------------------
-- Tema: tipler arası ("Doğa & Yayla" turu da aktiviteyi de topluyor)
-- ---------------------------------------------------------------------------
CREATE TABLE themes (
  id        serial PRIMARY KEY,
  slug      text NOT NULL UNIQUE CHECK (is_slug(slug)),
  name      text NOT NULL,
  media_id  uuid REFERENCES media(id) ON DELETE SET NULL,
  position  int NOT NULL DEFAULT 0,
  active    boolean NOT NULL DEFAULT true
);

CREATE TABLE content_themes (
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  theme_id   int  NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  position   int  NOT NULL DEFAULT 0,
  PRIMARY KEY (content_id, theme_id)
);
CREATE INDEX content_themes_theme_idx ON content_themes (theme_id);

-- ---------------------------------------------------------------------------
-- Koleksiyon: elle (manual) veya kurala göre (rule)
--
-- Kurala göre koleksiyonun üyeleri SORGUYLA bulunuyor (fiyat, takvim, gece
-- sayısı); content_collections'a yazılamaz. Yazılabilseydi fiyatı değişen
-- ürün koleksiyonda eski hâliyle kalırdı.
-- ---------------------------------------------------------------------------
CREATE TABLE collections (
  id        serial PRIMARY KEY,
  slug      text NOT NULL UNIQUE CHECK (is_slug(slug)),
  name      text NOT NULL,
  subtitle  text NOT NULL DEFAULT '',
  media_id  uuid REFERENCES media(id) ON DELETE SET NULL,
  mode      text NOT NULL CHECK (mode IN ('manual', 'rule')),
  -- {maxPrice, currency} | {nextDateWithin} | {minNights, maxNights}
  rule      jsonb NOT NULL DEFAULT '{}'::jsonb,
  position  int NOT NULL DEFAULT 0,
  active    boolean NOT NULL DEFAULT true,
  CONSTRAINT collections_rule_matches_mode
    CHECK ((mode = 'rule') = (rule <> '{}'::jsonb))
);

CREATE TABLE content_collections (
  content_id    uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  collection_id int  NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  position      int  NOT NULL DEFAULT 0,
  PRIMARY KEY (content_id, collection_id)
);
CREATE INDEX content_collections_collection_idx ON content_collections (collection_id);

CREATE FUNCTION content_collection_manual_guard() RETURNS trigger AS $$
BEGIN
  IF (SELECT mode FROM collections WHERE id = NEW.collection_id) <> 'manual' THEN
    RAISE EXCEPTION 'Kurala göre koleksiyona elle ürün eklenemez (collection %)',
      NEW.collection_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_collections_manual_guard
  BEFORE INSERT OR UPDATE ON content_collections
  FOR EACH ROW EXECUTE FUNCTION content_collection_manual_guard();

-- ---------------------------------------------------------------------------
-- Özellik (facet): filtrelenen nitelikler
--
-- transport   ulaşım (otobus, ucak, minibus, tren, feribot)
-- depart_from kalkış şehri; konaklamalı turda tour_departure_cities'ten
--             türetildiği için yalnızca günübirlik turda yazılıyor
--
-- Pansiyon burada YOK: otelin hotel_boards satırlarından türetiliyor.
-- ---------------------------------------------------------------------------
CREATE TABLE content_facets (
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  facet      text NOT NULL CHECK (facet IN ('transport', 'depart_from')),
  value      text NOT NULL CHECK (is_slug(value)),
  PRIMARY KEY (content_id, facet, value)
);
CREATE INDEX content_facets_lookup_idx ON content_facets (facet, value);

-- ---------------------------------------------------------------------------
-- Liste sayfası: kayıtlı filtre + SEO metni
--
-- /turlar/otobuslu-turlar/ bir kategori değil, "ulaşımı otobüs olan
-- turlar" sorgusunun kalıcı adresi. Kategori sayfalarıyla AYNI adres
-- alanını paylaşıyor (/turlar/<slug>/); aynı kökte aynı slug iki şeye
-- işaret edemez, bunu iki yönlü tetikleyici koruyor.
-- ---------------------------------------------------------------------------
CREATE TABLE listing_pages (
  id              serial PRIMARY KEY,
  base            text NOT NULL CHECK (base IN
                    ('turlar', 'oteller', 'aktiviteler', 'etkinlikler', 'mekanlar', 'firsatlar')),
  slug            text NOT NULL CHECK (is_slug(slug)),
  name            text NOT NULL,
  filter          jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_title       text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  in_menu         boolean NOT NULL DEFAULT true,
  position        int NOT NULL DEFAULT 0,
  UNIQUE (base, slug)
);

CREATE FUNCTION listing_base_type(b text) RETURNS text AS $$
  SELECT CASE b
    WHEN 'turlar' THEN 'tour'       WHEN 'oteller' THEN 'hotel'
    WHEN 'aktiviteler' THEN 'activity' WHEN 'etkinlikler' THEN 'event'
    WHEN 'mekanlar' THEN 'venue'    ELSE NULL END;
$$ LANGUAGE sql IMMUTABLE;

CREATE FUNCTION listing_slug_guard() RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'listing_pages' THEN
    IF EXISTS (SELECT 1 FROM categories
               WHERE content_type = listing_base_type(NEW.base) AND slug = NEW.slug) THEN
      RAISE EXCEPTION 'Adres çakışması: /%/%/ zaten bir kategori', NEW.base, NEW.slug
        USING ERRCODE = 'unique_violation';
    END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM listing_pages
               WHERE listing_base_type(base) = NEW.content_type AND slug = NEW.slug) THEN
      RAISE EXCEPTION 'Adres çakışması: % kategorisi % bir liste sayfasıyla aynı adreste',
        NEW.content_type, NEW.slug
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_pages_slug_guard
  BEFORE INSERT OR UPDATE OF base, slug ON listing_pages
  FOR EACH ROW EXECUTE FUNCTION listing_slug_guard();

CREATE TRIGGER categories_listing_slug_guard
  BEFORE INSERT OR UPDATE OF content_type, slug ON categories
  FOR EACH ROW EXECUTE FUNCTION listing_slug_guard();
